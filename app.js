var child_process = require('child_process');
var path = require('path');
var chokidar = require('chokidar');
var conf = require('./conf');
var logger = require('./logger');
var utils = require('./utils');

var workers = Object.create(null);
var pids = [];
var fileList = [];
var syncing = false;
var pathCache = Object.create(null);
var numCPUs = require('os').cpus().length - 1;
var freeWorker = numCPUs; // default free worker num is num CPUs.

// communication to child process
function handleEvents(msg) {
    // {type: 'xx', data: 'xxx'}
    var type = msg.type;
    var data = msg.data;
    if (type == 'cachePath') {
        pathCache[data] = data;
    } else if (type == 'freeWorker') {
    	workers[data].free = true;
        freeWorker++;
        if (fileList.length && !syncing) {
        	sync();
        } else if (!syncing && !fileList.length && (freeWorker == numCPUs)) {
        	logger.tip('\n############ Sync Complete. ############');
        }
    }
}

// init worker
for (var i = 0; i < numCPUs; i++) {
    var worker = child_process.fork('sync.js');
    worker.free = true;
    worker.on('message', handleEvents);
    workers[worker.pid] = worker;
    pids.push(worker.pid);
}

// select free worker
function selectWorker() {
	if (freeWorker <= 0) return null;
	var workerPid = pids.shift();
    var worker = workers[workerPid];
    pids.push(workerPid);
    if (worker.free) {
    	worker.free = false;
    	return worker;
    }
    return selectWorker();
}

// sync localFile to remote
function sync() {
	if (fileList.length) {
		syncing = true;
		var worker = selectWorker();
		if (worker == null) {
			return syncing = false;
		}
		var filepath = fileList.shift();
		var dirname = path.dirname(filepath);
		var data = {"filepath": filepath, "exist": !!(pathCache[dirname])};
		worker.send(data);
		freeWorker--;
		sync();
	} else {
		syncing = false;
	}
}

// cwd to project dir
process.chdir(conf.baseDir); 
logger.info('-------- init watching. --------');
chokidar.watch('*/**', {
    ignoreInitial: true,
    ignorePermissionErrors: true
}).on('all', function(event, filepath) {
    if (event == 'add' || event == 'change') {
        logger.log(filepath + ' was ' + event);
        !utils.contains(fileList, filepath) && fileList.push(filepath);
        !syncing && sync();
    }
}).on('ready', function() {
    logger.info('-------- watching ready. --------');
}).on('error', function(err) {
	logger.error(err.stack);
});

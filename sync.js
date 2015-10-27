'use strict';

var path = require('path');
var Client = require('ssh2').Client;
var conf = require('./conf');
var logger = require('./logger');
var compiler = require('./compiler');
var compileLess = compiler.less;

var baseDir = conf.baseDir;
var targetDir = conf.targetDir;
var pid = process.pid;

var conn = new Client();
var sftp = null;
var self = this;
var localFile, remoteFile, remoteDir;

process.on('message', function(data) {
    // data: {filepath: 'xx', exist: true}
    upload(data);
    if ((path.extname(data.filepath) == '.less') && (data.filepath.indexOf('mixin') == -1)) {
        logger.silent('[compile Less] File: ' + localFile);
        compileLess(localFile);
    }
});


function cachePath(filepath) {
    process.send({type: 'cachePath', data: path.dirname(filepath)});
}

function workerDone() {
    process.send({type: 'freeWorker', data: pid});
}

function upload(data) {
    var filepath = data.filepath,
        fileExist = data.exist;
    localFile = baseDir + '/' + filepath.replace(/\\/g, '/');
    remoteFile = localFile.replace(baseDir, targetDir);
    remoteDir = path.dirname(remoteFile);

    // if path exist in pathCache
    if (fileExist) {
        sftp.fastPut(localFile, remoteFile, function() {
            workerDone();
            logger.done('['+ pid +'] File --> "' + localFile + '" uploaded success.');
        });
    } else {
        sftp.exists(remoteDir, function(exist) {
            if (exist) {
                cachePath(filepath);
                sftp.fastPut(localFile, remoteFile, function() {
                    workerDone();
                    logger.done('['+ pid +'] File --> "' + localFile + '" uploaded success.');
                });
            } else {
                conn.exec('mkdir -p ' + remoteDir, function(err, stream) {
                    if (err) logger.error(err);
                    stream.on('close', function(code, signal) {
                        cachePath(filepath);
                        sftp.fastPut(localFile, remoteFile, function() {
                            workerDone();
                            logger.done('['+ pid +'] File --> "' + localFile + '" uploaded success.');
                        });
                    }).stderr.on('data', function(data) {
                        logger.error('MKDIR Error: ' + data);
                    });
                });
            }
        });
    }
}

conn.on('ready', function() {
    logger.done('Process [' + pid + '] connected to server.');
    conn.sftp(function(err, sftphandler) {
        if (err) throw err;
        sftp = sftphandler;
    });
});
conn.on('error', function(err) {
    logger.error('conn err: ' + err);
});
conn.on('close', function(err) {
    if (err) {
        logger.error('Connection :: close, Error: ' + err);
    } else {
        logger.log('Connection :: closed');
    }
});

// connect server
conn.connect(conf.auth);

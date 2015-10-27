var path = require('path');
var gulp = require('gulp');
var less = require('gulp-less');

function parseLessPath (filepath) {
    var pathdir = path.dirname(filepath);
    // case 1: xx/less/xx.less => xx/css/xx.css
    return pathdir.replace(/less$/, 'css');
    //@TODO case 2: xx/less/other/xx.less => xx/css/xx.css
}

exports.less = function (localFile) {
    gulp.src(localFile)
        .pipe(less())
        .pipe(gulp.dest(parseLessPath(localFile)));
}
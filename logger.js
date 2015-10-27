var chalk = require('chalk');

exports.info = function(data) {
	console.log(chalk.cyan(data));
}

exports.log = function(data) {
	console.log(data);
}

exports.done = function(data) {
	console.log(chalk.green(data));
}

exports.error = function(data) {
	console.log(chalk.red(data));
}

exports.warn = function(data) {
	console.log(chalk.yellow(data));
}

exports.tip = function(data) {
	console.log(chalk.magenta(data));
}

exports.silent = function(data) {
	console.log(chalk.gray(data));
}
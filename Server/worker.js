'use strict';

var fileQueue;
var execFileQueue;
var execQueue;
var waitQueue;
var readyQueue;
var working;
var readyFor;
var async = require('async');
var exec = require('child_process').exec;
var originalFileName;

process.on('message', function(message) {
	switch(message) {
		case 'setup' :
			setup();
			break;
		case 'finish' :
			finish();
			break;
		default : 
			if(readyFor === Number(message.split('_').pop())) {
				readyQueue.push(message);
				readyFor++;
				checkQueue();
			} else {
				waitQueue.push(message);
			}
			if(!working && readyQueue.length > 10) handleFiles();

			break;
	}
});

function checkQueue() {
	waitQueue.sort(function(a, b) {
		return a.split('_').pop() - b.split('_').pop();
	});
	while(waitQueue.length > 0 && Number(waitQueue[0].split('_').pop()) === readyFor) {
		readyQueue.push(waitQueue.shift());
		readyFor++;
	}
}

function concat(name, callback) {
	if(!originalFileName) {
		var temp = name.split('_');
		temp.pop();
		originalFileName = temp.join('_');
	}
	var cmd = ['cat','"' + name + '"', '>>', '"' + originalFileName + '"', ';', 'rm', '"' + name + '"'].join(' ');

	exec(cmd, function(error, stdout, stderr) {
		return callback();
	}) ;
}

function handleFiles(cb) {
	working = true;
	var len = readyQueue.length;

	for(var i = 0; i < len; i += 1) {
		execQueue.push(function(callback) {
			return concat(readyQueue.shift(), callback);
		});
	}

	async.series(execQueue, function(err) {
		if(err) return console.log(err);
		execQueue = [];
		working = false;
		if(cb) cb();
	});
}

function setup() {
	fileQueue = [];
	execQueue = [];
	working = false;
	readyFor = 0;
	waitQueue = [];
	readyQueue = [];
	originalFileName = null;
}

function finish() {
	if(working) return process.send('working');
	checkQueue();
	handleFiles(function() {
		process.send('finished');
	});
}
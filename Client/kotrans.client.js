 /**
 * kotrans.client.js
 * 
 * Client connection using BinaryJS
 * A reference to this js file AND client.config.js should be in your HTML/PHP
 * 
 * <script src="path/to/client.connection.js"></script>
 *
 * @author Sam Ko
 */

'use strict';

var kotrans = kotrans || {};

kotrans.client = (function () {
	
	//done signifies all file Chunks were transfered
	var Client2ServerFlag = {
		send: 'send',
		sendMul: 'sendMul',
		transferComplete: 'transferComplete',
		setup : 'setup'
	}
	
	//sent signifies that the file chunk was sent.
	var Server2ClientFlag = {
		sent: 'sent',
		updateClient: 'updateClient',
		commandComplete: 'commandComplete',
		error: 'error',
		setup : 'setup'
	}

	var file;

	//stores
	var fileChunks;
	var chunk_size = 4194304;

    var timeTook,
    	start;
   	var mainClient;
    var clients;
    var clientids;
    var chunkNumber;
    var totalChunks;
    var sentChunks;
    var allTransferred;
	function createClient(options) {
		var i;
		var options = options || {};
		var host = options.host || 'localhost';
		var port = options.port || '9000';
		var streams = options.no_streams || 2;
		var path = options.path || '';
		mainClient = location.protocol === 'https:' ? new BinaryClient('wss://' + host + ':' + port + path) : new BinaryClient('ws://' + host + ':' + port + path);
		
		
		clients = [];
		clientids = 0;
		allTransferred = false;
		sentChunks = 0;
		// init
		mainClient.on('open', function() {
			mainClient.pid = clientids++;
			//console.log('client ' + mainClient.pid + ' connected to server.');
			
		});

		mainClient.on('stream', function(stream, meta) {
			if(meta.cmd === Server2ClientFlag.commandComplete) {
				finish();
			}
		});

		mainClient.on('error', function(err) {
			throw err;
		})

		for(i = 0; i < streams; ++i) {
			clients.push(initClient(host, port, path));
		}

		return mainClient;
	}

	function initClient(host, port, path) {
		var client = location.protocol === 'https:' ? new BinaryClient('wss://' + host + ':' + port + path) : new BinaryClient('ws://' + host + ':' + port + path);

		client.on('open', function() {
			client.pid = clientids++;
			//console.log('client ' + client.pid + ' connected to server.');
		});

		client.on('stream', function(stream, meta) {
			if(meta.cmd === Server2ClientFlag.sent) {
				//console.log('client ' + client.pid + ' successfully transfered.');
				allTransferred = (totalChunks === ++sentChunks); //&& fileOverflow.length === 0;
				if(fileChunks.length === 0) {
					if(allTransferred) {
						client.send({}, {
							fileName : file.name,
							fileSize : file.size,
							cmd : Client2ServerFlag.transferComplete
						});
					} 
				} else {
					var chunk = fileChunks.shift();
					client.send(chunk, {
						chunkName : file.name + '_' + chunkNumber++,
						chunkSize : chunk.size,
						fileSize : file.size,
						fileName : file.name,
						cmd : Client2ServerFlag.send
					});
				}
			} else if(meta.cmd === Server2ClientFlag.commandComplete) {
				finish();
			} else if(meta.cmd === Server2ClientFlag.updateClient) {
				//Will be sent the file name and the % compete
				//lots of overhead if client that is sending is also giving updates.
			}
		});

		client.on('close', function() {
			throw 'client ' + client.pid + ' closed unexpectedly.';
		});

		client.on('error', function(error) {
			throw error;
		});

		return client;
	}

	var callback;
	function sendFile(sendingFile, cbFun) {
		totalChunks = 0;
		sentChunks = 0;
		allTransferred = false;
		file = sendingFile;
		console.log(file);
		chunkNumber = 0;
		mainClient.send({}, { cmd : Client2ServerFlag.setup, fileSize : file.size / 1000000 });
		callback = callback || cbFun;
		initFile();
	}	

	function initFile() {
		//console.log(file);
		console.log('Initializing file: '  + file.name);
		fileChunks = [];
		var currentSize = chunk_size;
		var i = 0;

		while (i < file.size) {
			//console.log(i);
			//for the last chunk < chunk_size
			if (i + chunk_size > file.size) {
				fileChunks.push(file.slice(i));
				break;
			}
			fileChunks.push(file.slice(i, currentSize));
		
			i += chunk_size;
			currentSize += chunk_size;
		}
		totalChunks = fileChunks.length;
		send();
	}
	var interval;
	function send() {
		interval = setInterval(function() {
			mainClient.send({}, { cmd : Server2ClientFlag.updateClient });
		}, 1000);
		clients.forEach(function(client) {
			if(fileChunks.length !== 0) {
				var chunk = fileChunks.shift();
				client.send(chunk, {
					chunkName : file.name + '_' + chunkNumber++,
					chunkSize : chunk.size,
					fileSize : file.size,
					fileName : file.name,
					cmd : Client2ServerFlag.send
				});
			}
		});
	}

	function finish() {
		clearInterval(interval);
		if(callback) {
			callback();
		}
	}

	return {
		createClient: createClient,
		sendFile: sendFile
	}
})();

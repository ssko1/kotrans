 /**
 * client.connection.js
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

kotrans.client = (function ($) {
	
	//done signifies all file Chunks were transfered
	var Client2ServerFlag = {
		send: 'send',
		sendMul: 'sendMul',
		transferComplete: 'transferComplete'
	}
	
	//sent signifies that the file chunk was sent.
	var Server2ClientFlag = {
		sent: 'sent',
		sentMul: 'sentMul',
		updateClient: 'updateClient',
		commandComplete: 'commandComplete',
		error: 'error'
	}

    var client;
	
	/*alternate destination for file(s). if string is empty, ie. directory = '', server will automatically
	place files where server.connection.js file is located.*/
	var directory;

	var file;

	//stores
	var fileChunks;

	//number of files processed
	var fileCount = 0;

	//array for sending multiple files
	var fileQueue;

	/* multi-streaming capabilities NOT IMPLEMENTE*/
	var idleStreams,
		activeStreams;

	var MAX_STREAMS = 1;
	
	//400MB Chunk size for files that are large
	var chunk_size = kotrans.config.CHUNK_SIZE;
    
    var fileHash;
    //stores callback functions to a file FileController(s)
    var cbHash = {};

    var timeTook,
    	start;

    /**
     * creates a client object with a specified hostFileController on port 9000.
     * 
     * @return Client object
     */
	function createClient() {
		client = new BinaryClient('ws://' + kotrans.Config.HOST + ':9000/');

		//wait for client open
		client.on('open', function() {
	 		idleStreams = [];
	 		activeStreams = [];

	 		for (var i = 0; i < MAX_STREAMS; i++) {
				var stream;
				idleStreams.push(stream);
			}
	 	});

	 	/**
	 	 * Receives messages from the server
	 	 * @param   stream -- the data sent
	 	 * @param   meta -- information describing data sent
	 	 */
		client.on('stream', function (stream, meta) {
			if (meta.cmd === Server2ClientFlag.sent) {
				fileCount++;
				console.log('done sending file chunk ' + meta.chunkName);
				idleStreams.push(activeStreams.shift());
				send();
			} else if (meta.cmd === Server2ClientFlag.sentMul) {
				fileCount++;
				console.log('done sending file chunk ' + meta.chunkName);
				idleStreams.push(activeStreams.shift());
				sendMul();
			} else if (meta.cmd === Server2ClientFlag.error) {
				console.log(stream);
				//notify client that there was an error.
			} else if(meta.cmd === Client2ServerFlag.transferComplete) {

			}
		});
		
		client.on('close', function() {
			console.log('Client connection was stopped abruptly');
		});

		client.on('error', function(error) {
			console.log(error);
		});
		
		return client;
	}

	////////////////////////
	// SINGLE FILE LOGIC  //
	////////////////////////

	/**
	 * Users call this function to send a single file. 
	 * 
	 * @param  {File} sendingFiles 		 -- Single File object to be sent
	 * 
	 * @param  {String} sendingDirectory -- A directory in which to store the file.
	 * 										If the string is empty, ie. directory = '',
	 * 										the default node __dirname global variable 
	 * 										will be used instead.
	 * 										
	 * @param  {function()} cbFun 		 -- This callback function will be called when the entire
	 *  									file has finished transferring
	 */
	function sendFile(sendingFile, sendingDirectory, cbFun) {
		file = sendingFile;
		directory = sendingDirectory;

		//assumes no identical file names
		if(!cbHash[file.name]) {
			cbHash[file.name] = cbFun;
		}

		initFile();
	}	

	/**
	 * Initializes the file by splitting it into 400 MB chunks then pushing those chunks
	 * into a queue.
	 */
	function initFile() {
		start = new Date().getTime();
		console.log('Initializing file: '  + file.name);

		var currentSize = chunk_size;
		fileChunks = [];
		
		var i = 0;
		while (i < file.size) {
			//for the last chunk < chunk_size
			if (i + chunk_size > file.size) {
				fileChunks.push(file.slice(i));
				break;
			}
			fileChunks.push(file.slice(i, currentSize));
		
			i += chunk_size;
			currentSize += chunk_size;
		}

		send();
	}
	
	/**
	 * Helper function that sends single files to the server.
	 */
	function send() {
		console.log('sending file: ' + file.name);

		if(fileChunks.length === 0) {
			finish();
		}
		while (fileChunks.length !== 0 && idleStreams.length > 0) {
			var fileChunk = fileChunks.shift();
			activeStreams.push(idleStreams.shift());
			
			activeStreams[0] = client.send(fileChunk, { chunkName: file.name + '_' + fileCount,
								 						chunkSize: fileChunk.size,
														fileSize: file.size,
														fileName: file.name,
								 						directory: directory, 
								 						cmd: Client2ServerFlag.send });
		}
	}

	/**
	 * When all file chunks are sent, this function is called. The callback function is exceuted.
	 * Sends a message to the server indicating that the file is done
	 */
	function finish() {
		console.log('time took: ' + (new Date().getTime() - start) + ms);
		client.send({}, { fileName: file.name,
						  fileSize: file.size, 
						  fileCount: fileCount, 
					 	  cmd: Client2ServerFlag.transferComplete });

		//reset file counter for next file
		fileCount = 0;

		console.log('finished transferring ' + file.name);

		//execute callback function
		if(cbHash[file.name]) {
			cbHash[file.name]();
		}
	}

	//////////////////////////
	// MULTIPLE FILE LOGIC  //
	//////////////////////////

	/**
	 * User calls this function to send multiple files to a directory. The callback function is executed
	 * once all files are finished transferring.
	 * 
	 * @param  {File} sendingFiles		 -- The file object to be sent
	 * 
	 * @param  {String} sendingDirectory -- A directory in which to store the file. If the 
	 * 										directory string parameter is empty, ie. 
	 * 										directory = '', the default node __dirname location
	 * 										will be used.
	 * 										
	 * @param  {function()} cbfun 		 -- The callback function that executes once ALL
	 * 										files are finished sending.
	 */
	function sendFileMul(sendingFiles, sendingDirectory, cbFun) {
		fileHash = '';

		//concat all file names into the hash, store cbFun in hashed location
		for(var i = 0; i < sendingFiles.length; i++) {
			fileHash += sendingFiles[i].name;
		}

		console.log('Initiating sendFileMul with files: ' + fileHash);

		if(!cbHash[fileHash]) {
			cbHash[fileHash] = cbFun;
		}

		fileQueue = sendingFiles;
		directory = sendingDirectory;
		
		initFileMul();
	}

	/**
	 * Initiates files and splits them into 400 MB chunks. If there are no more files in 
	 * fileQueue, then all files have transferred, calls finishMul();
	 */
	function initFileMul() {
		if(fileQueue.length == 0) {
			finishMul();
		} else {
			file = fileQueue.shift();
			fileChunks = [];

			console.log('Initializing file: '  + file.name);
			var currentSize = chunk_size;
			var i = 0;

			while (i < file.size) {
				//for the last chunk < chunk_size
				if (i + chunk_size > file.size) {
					fileChunks.push(file.slice(i));
					break;
				}
				fileChunks.push(file.slice(i, currentSize));
			
				i += chunk_size;
				currentSize += chunk_size;
			}

			sendMul();
		}
	}

	/**
	 * Helper function that does the sending. If all file chunks from one file are sent,
	 * initFileMul() is called again to get the next file.
	 */
	function sendMul() {
		console.log('Sending the file chunks...');
		if(fileChunks.length === 0) {
			client.send({}, { fileName: file.name,
						      fileSize: file.size, 
						      fileCount: fileCount,
						      directory: directory, 
					 	      cmd: Client2ServerFlag.transferComplete });

			fileCount = 0;

			initFileMul();
		}

		while (fileChunks.length !== 0 && idleStreams.length > 0) {
			var fileChunk = fileChunks.shift();
			activeStreams.push(idleStreams.shift());
			
			activeStreams[0] = client.send(fileChunk, { chunkName: file.name + '_' + fileCount,
								 						chunkSize: fileChunk.size,
								 						fileSize: file.size,
								 						fileName: file.name,
								 						directory: directory, 
								 						cmd: Client2ServerFlag.sendMul });
		}
	}

	/**
	 * Executes the callback function associated with the fileHash
	 */
	function finishMul() {
		console.log('Done transferring ALL files.');
		if(cbHash[fileHash]) {
			cbHash[fileHash]();
		}
	}

	return {
		createClient: createClient,
		sendFile: sendFile,
		sendFileMul: sendFileMul
	}
})(jquery);

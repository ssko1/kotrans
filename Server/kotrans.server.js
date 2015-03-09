/**
 * server.connection.js
 * 
 * Server connection using node.js. To utilize this file, user must invoke the 
 * require() nodejs method.
 *
 * require('path/to/server.connection.js');
 * 
 * @author  Sam Ko
 */

'use strict';

var kotrans = kotrans || {};

kotrans.server = (function () {
    var fs = require('fs');
    var util = require('util');
    var exec = require('child_process').exec;
    var http = require( 'http' );
    var path = require('path');
    var BinaryServer = require('binaryjs').BinaryServer;
    //done signifies all files were transfered
    var Client2ServerFlag = {
        send : 'send',
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

    var server,
        serverPort;
	var socketServer;

    var uploadedBytes;

    var file;
    var percentComplete;
    var cmd;
    var child;
    var i;

    var allowedDirectory;

    function createServer(options, callback) {
        if(arguments[0] instanceof Object && options) {
            allowedDirectory = options.directory || __dirname;

            if(!options.server) {
                return;
            }
            
            socketServer = new BinaryServer({ server: options.server });

            socketServer.on('connection', onSocketConnection);

            if(arguments[1] instanceof Function && callback) {
                callback(null);
            }
        } else {
            if(arguments[0] instanceof Function && options) {
                options('No options specified');
            }
        }
        
    }

    //wait for new user connection
    function onSocketConnection(client) {
        console.log("Client connected with ID " + client.id);

        uploadedBytes = 0;

        //work on the incoming stream from browsers
		client.on('stream', function (stream, meta) {
			if (meta.cmd === Client2ServerFlag.send || meta.cmd === Client2ServerFlag.sendMul) {
                    file = fs.createWriteStream(path.join(allowedDirectory, meta.chunkName));

                    file.on('error', function(err) {
                        console.log(err);
                    });
				stream.pipe(file);    
			} else if(meta.cmd === Client2ServerFlag.transferComplete) {
                uploadedBytes = 0;
                client.send({}, {
                    fileName: meta.fileName,
                    cmd: Server2ClientFlag.commandComplete
                });
            }

            // Sends data back to the client with a percentage complete with file name
			stream.on('data', function (data) {
                if(meta.cmd === Client2ServerFlag.send || meta.cmd === Client2ServerFlag.sendMul) {
                    uploadedBytes += data.length;
                    percentComplete = ((uploadedBytes / meta.fileSize) * 100).toPrecision(4);
                    //console.log(percentComplete);
                    client.send({}, {   percent: percentComplete,
                                        fileName: meta.fileName,
                                        cmd: Server2ClientFlag.updateClient
                    });
                }
			});

            // Send a message to the client that the fileChunk was successfully transferred.
			stream.on('end', function () {
                if(meta.cmd === Client2ServerFlag.send) {
                    executeCommand(concatenateFiles(meta), client, function() {
                        executeCommand(removeFiles(meta), client);
                    });
                    client.send({}, { chunkName: meta.chunkName, cmd: Server2ClientFlag.sent });
                } else if(meta.cmd === Client2ServerFlag.sendMul) {
                    client.send({}, { chunkName: meta.chunkName, cmd: Server2ClientFlag.sentMul});
                }
			});
        });
    }

    /*concatenates all file chunks into the original file
        Parameter is the metadata of the file(s) which include:
        meta.noFiles: the number of chunkFiles that were created.
        meta.name: the original file name 

        This function changes the directory and concatenates the files
        in a single command. */
    function concatenateFiles(meta) {
        cmd = 'cd ' + allowedDirectory + '; cat';

        cmd = cmd.concat(' "' + meta.chunkName + '"');

        cmd = cmd.concat(' >> "' + meta.chunkName.split('_')[0] + '"');

        return cmd;
    }

    /* Removes all file chunks that created the original file
        Parameter is the metadata of the file(s) which include:
        meta.noFiles: the number of chunkFiles that were created.
        meta.name: the original file name 

        This function changes the directory and removes the files in 
        a single command. */
    function removeFiles(meta) {
        cmd = 'cd ' + allowedDirectory + ';rm';

        cmd = cmd.concat(' "' + meta.chunkName + '"');

        return cmd;
    }

    /* executes unix commands on the server.
        -- Parameters --
        cmd: the command to execute */
    function executeCommand(cmd, client, cbfun) {
        child = exec(cmd, function(error, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            if(error !== null) {
                console.log(error);
                client.send({}, {cmd: Server2ClientFlag.error});
            }
            if(cbfun) {
                cbfun();
            }
        });
    }

    module.exports = {
        createServer: function(options, callback) {
            createServer(options, callback);
        }
    }
})();
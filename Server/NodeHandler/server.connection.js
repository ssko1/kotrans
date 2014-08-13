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
    var Config = require('../server.config');
    var BinaryServer = require('../../node_modules/binaryjs').BinaryServer;

    //done signifies all files were transfered
    var Client2ServerFlag = {
        send: 'send',
        sendMul: 'sendMul',
        done: 'done'
    }

    //sent signifies that the file chunk was sent.
    var Server2ClientFlag = {
        sent: 'sent',
        sentMul: 'sentMul',
        error: 'error'
    }

    var server;
	var socketServer;

    /*Creates a node.js server that listens on the given PORT located in
    ../server.config.js*/
    function createServer() {

        server = http.createServer();
        server.listen(Config.PORT);
        socketServer = new BinaryServer({ server: server });
        socketServer.on('connection', onSocketConnection);
        console.log("connection established on port " + Config.PORT);
    }

    //wait for new user connection
    function onSocketConnection(client) {
        console.log("Client connected with ID " + client.id);

        //work on the incoming stream from browsers
		client.on('stream', function (stream, meta) {
			if (meta.cmd === Client2ServerFlag.send || meta.cmd === Client2ServerFlag.sendMul) {
                console.log('working on it....');
                if(meta.directory === '') {
                    var file = fs.createWriteStream(__dirname + '/' + meta.name);
                } else {
                    var file = fs.createWriteStream(meta.directory + '/' + meta.name);
                }

				stream.pipe(file);    
			} else if(meta.cmd === Client2ServerFlag.done) {
                console.log('Done with file transfer, concatenating files.');
                executeCommand(concatenateFiles(meta));
                executeCommand(removeFiles(meta));
            }

			stream.on('data', function (data) {
                //stream.write({ rx : data.length / meta.size });
			});

            // Send a message to the client that the fileChunk was successfully transferred.
			stream.on('end', function () {
                if(meta.cmd === Client2ServerFlag.send) {
                    client.send({}, { name: meta.name, cmd: Server2ClientFlag.sent });
                } else if(meta.cmd === Client2ServerFlag.sendMul) {
                    client.send({}, { name: meta.name, cmd: Server2ClientFlag.sentMul});
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
        var cmd = 'cd ' + __dirname + ';cat';

        for(var i = 0; i < meta.fileCount; i++) {
            cmd = cmd.concat(' ' + meta.name + '_' + i);
        }

        cmd = cmd.concat(' > ' + meta.name);

        return cmd;
    }

    /* Removes all file chunks that created the original file
        Parameter is the metadata of the file(s) which include:
        meta.noFiles: the number of chunkFiles that were created.
        meta.name: the original file name 

        This function changes the directory and removes the files in 
        a single command. */
    function removeFiles(meta) {
        var cmd = 'cd ' + __dirname + ';rm';

        for(var i = 0; i < meta.fileCount; i++) {
            cmd = cmd.concat(' ' + meta.name + '_' + i);
        }

        return cmd;
    }

    /* executes unix commands on the server.
        -- Parameters --
        cmd: the command to execute */
    function executeCommand(cmd) {
        var child = exec(cmd, function(error, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            if(error !== null) {
                console.log(error);
                client.send({}, {cmd: Server2ClientFlag.error});
            }
        });

        console.log('done with command: \n' + cmd);
    }

    module.exports = {
        createServer: createServer
    }
})();
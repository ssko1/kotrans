'use strict';

var kotrans = kotrans || {};

kotrans.server = (function () {
    var fs = require('fs');
    var os = require('os');
    var cluster = require('cluster');
    var exec = require('child_process').exec;
    var child_process = require('child_process');
    var http = require( 'http' );
    var path = require('path');
    var BinaryServer = require('binaryjs').BinaryServer;
    var async = require('async');
    //done signifies all files were transfered
    var Client2ServerFlag = {
        send : 'send',
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

	var socketServer;
    var processors;
    var worker;

    var uploadedBytes;

    var file;
    var percentComplete;

    var allowedDirectory;
    var child;

    function createServer(options, callback) {
        var options = options || {};
        var server = options.server;
        var route = options.route;
        //code for multiple threads means faster concatenation
        processors = os.cpus().length;
        allowedDirectory = options.directory || __dirname;

        socketServer = new BinaryServer({ server: server, path : route });

        socketServer.on('connection', onSocketConnection);

        if(callback instanceof Function) {
            callback();
        }
        
    }

    //wait for new user connection
    var execQueue;
    var initialized = false;
    function onSocketConnection(client) {
        console.log("Client connected with ID " + client.id);

        //work on the incoming stream from browsers
		client.on('stream', function (stream, meta) {
			if (meta.cmd === Client2ServerFlag.send) {
                file = fs.createWriteStream(path.join(allowedDirectory, meta.chunkName));

                file.on('error', function(err) {
                    console.log(err);
                    process.exit();
                });
				stream.pipe(file);    
			} else if(meta.cmd === Client2ServerFlag.transferComplete) {
                //entire file has finished transferring, combining pieces together
                child.send('finish');
            } else if(meta.cmd === Client2ServerFlag.setup) {
                if(child) {
                    child.kill();
                }
                child = child_process.fork('./worker', {
                    cwd : allowedDirectory
                });

                child.on('message', function(message) {
                    if(message === 'working') {
                        setTimeout(function() {
                            child.send('finish');
                        }, 50);
                    } else if(message === 'finished') {
                        client.send({}, { cmd : Server2ClientFlag.commandComplete });
                    }
                });

                child.send('setup');;
            }

            // Sends data back to the client with a percentage complete with file name
			stream.on('data', function (data) {
                
			});

            // Send a message to the client that the fileChunk was successfully transferred.
			stream.on('end', function () {
                if(meta.cmd === Client2ServerFlag.send) {
                    child.send(meta.chunkName);
                    client.send({}, { chunkName: meta.chunkName, cmd: Server2ClientFlag.sent });
                }
			});
        });
    }

    module.exports = {
        createServer: function(options, callback) {
            createServer(options, callback);
        }
    }
})();
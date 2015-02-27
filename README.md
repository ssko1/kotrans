kotrans
=======

Browser-based file transfer system using binary.js as the client and node.js as the server.

## Download

Server

git
```console 
$ git clone git://github.com/CinnamonBagels/kotrans.git
```

npm 
```console
$ npm install kotrans
```

Client

```html
<script src="path/to/binary.js"></script>
<script src="path/to/kotrans.client.js"></script>
```

* kotrans.client.js is located in `node_modules/kotrans/Client/`
* binary.js is located in `node_modules/kotrans/node_modules/Binaryjs/dist/`

How to use
==========

## Creating your server
```javascript
var kotrans = require('kotrans');
var server = kotrans.createServer([options], callback);
```

* `options`
  * `port` number. Default: `1337`
  * `server` Object.
    * If left undefined, kotrans will automatically create a server listener.
    * You may use an existing http.Server
  * `directory` String. Default: `__dirname`
    * Files will only be transferred to this 'allowed directory'

Thats it! Your server should be listening on the specified port.
If no port is specified, the server will default to a port of 1337.

## Creating your client

```javascript
var client = kotrans.client.createClient([options]);
```

* `options`
  * `port` number. Default: `9000`
  * `host` String. Default: `localhost`

NOTE: Your Binary Server must listen on a different port than your Web Server!

## Sending files from client to server

```javascript
kotrans.client.sendFile(file, callback);
```

Send a single `File` object to the Server's specified directory. 
*  `File` is a jQuery event object given by `event.originalEvent.dataTransfer.files`

Callback function is executed after file is finished transferring
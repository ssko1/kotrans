kotrans
=======

Browser-based file transfer system using binary.js as the client and node.js as the server.

###Due to how kotrans transfers very large files to the server, this module only works on applications that run under centOS/ubuntu and similar systems.

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
kotrans.createServer(options, function);
```

* `options`
  * `server` Object. Must be an existing http/https Server
  * `path` String. Default: '/'
  * `directory` String. Default: `kotrans/uploads`
    * Files will only be transferred to this 'allowed directory'
* `function` Callback

Thats it! Your server should be listening on your specified port and path.

## Creating your client

```javascript
var client = kotrans.client.createClient(options);
```

* `options`
  * `host` String. Default: `localhost`
  * `port` Number. Default: `9000`
  * `no_streams` Number. Default: 2. The number of concurrent streams for data transfer.
  * `path` String. Default: '/'. For routing purposes.


## Sending files from client to server

```javascript
kotrans.client.sendFile(file, callback);
```

Send a single `File` object to the Server's specified directory. 
*  `File` is an event object given by `event.dataTransfer.files`, usually coupled with a file drag-and-drop system.

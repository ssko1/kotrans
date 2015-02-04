kotrans
=======

Browser-based file transfer system using binary.js as the client and node.js as the server.

## Download

Server

via git
```console 
$ git clone git://github.com/CinnamonBagels/kotrans.git
```
OR

npm 
```console
$ npm install kotrans
```

Client

```html
<script src="path/to/binary.js"></script>
<script src="path/to/kotrans.client.js"></script>
```
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
    * If a web application framework is used e.g. Express.js, pass in their server object (In the case for express, the object would be `app`)
    
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
kotrans.client.sendFile(file, directory, callback)
//if the directory is not specified (i.e. '') the directory will default
//to __dirname at kotrans/Server/
```

Send a single file to the specified directory. 
Callback function is executed after file is finished transferring
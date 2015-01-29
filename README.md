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
<script src="kotrans/Client/BinaryHandler/client.connection.js"></script>
```
How to use
==========

Specify the host and port located in these files (THEY ARE DEFAULTED TO localhost:9000/:

```console
kotrans/Config/client.config.js
kotrans/Config/server.config.js
```
## Creating your server
```javascript
var kotrans = require('kotrans');
var server = kotrans.createServer();
```
Thats it! Your server should be listening on your hostname on port 9000.

## Creating your client
```javascript
var client = kotrans.client.createClient();
```
## Sending files from client to server

```javascript
kotrans.client.sendFile(file, directory, callback)
//if the directory is not specified (i.e. '') the directory will default
//to __dirname at kotrans/Server/
```

Send a single file to the specified directory. 
Callback function is executed after file is finished transferring

```javascript
kotrans.client.sendFileMul(files[], directory, callback)
//if the directory is not specified (i.e. '') the directory will default
//to __dirname at kotrans/Server/
```

Send multiple files (in an array of File Objects) to the specified directory. 
Callback function is executed after files are finished transferring


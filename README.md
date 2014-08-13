kotrans
=======

Browser-based file transfer system using binary.js as the client and node.js as the server.

Can handle large files

## Download

Server

Git
```console
$ git clone git://github.com/CinnamonBagels/kotrans.git
```

Client

```html
<script src="MAGITransfer/Client/BinaryHandler/client.connection.js"></script>
```
How to use
==========

Specify the host located in these files:

MAGITransfer/Client/client.config.js
MAGITransfer/Server/server.config.js

## Creating your server
```javascript
var kotrans = require('MAGITransfer/Server/NodeHandler/server.connection.js');
var server = kotrans.createServer();
```
Thats it! Your server should be listening on your hostname on port 9000.

## Creating your client
```javascript
var client = kotrans.client.createClient();
```

Sending files from client to server
===================================

##kotrans.client.sendFile(file, directory, callback)

Send a single file to the specified directory. 
Callback function is executed after file is finished transferring

##kotrans.client.send(files, directory, callback)

Send multiple files (in an array of File Objects) to the specified directory. 
Callback function is executed after files are finished transferring


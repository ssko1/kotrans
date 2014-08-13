/**
 * client.js
 * 
 * Example of how client.connection.js could be used.
 *
 * @author  Sam Ko
 */

'use scrict';

(function() {
	var fileQueue;

	var file;

	var client = kotrans.client.createClient();

	client.on('open', function () {
		fileQueue = [];

        var box = $('#drop-box');
        //This is to prevent the browser from accessing the default property of dragging and
        //dropping the file in the browser.
        box.on('dragenter', preventOriginalEvent);
        box.on('dragleave', preventOriginalEvent);
		box.on('dragover', preventOriginalEvent);
		

        //when the user drops file(s) into the designated area
        box.on('drop', function (e) {
            e.originalEvent.stopPropagation();
			e.originalEvent.preventDefault();
			
			//grab the file
			for(var i = 0; i < e.originalEvent.dataTransfer.files.length; i++) {
				fileQueue.push(e.originalEvent.dataTransfer.files[i]);
			}

        	kotrans.client.sendFileMul(fileQueue, '', function() {
        		var a;
        	});
        });
   	 });

	function preventOriginalEvent(e) {
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();
	}
})();
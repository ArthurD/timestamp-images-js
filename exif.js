/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/*
	Additional (perhaps ugly) edits are made inline by me, because... 
	I'm lazy & was just scratching my own itch.  =D
*/

(function (window, document) {
    'use strict';

    if (!supportsFileReader()) {
        alert('Sorry, your web browser does not support the FileReader API.');
        return;
    }

    window.addEventListener('load', function () {
        document.getElementById('picker').addEventListener('change', handleFile, false);
    }, false);

    document.querySelector('html').setAttribute('data-initialized', '');
    
    function supportsFileReader() {
        return window.FileReader !== undefined;
    }

    function handleFile(event) {
        let listing = document.getElementById("listing");
        let xtraText = document.getElementById("extraText").value;
        
        
        for(let fileID=0; fileID<event.target.files.length; fileID++) {
            ExifReader.load(event.target.files[fileID]).then(function (tags) {
                console.log("hrmm");
                console.log(event.target.files[fileID].name);
                console.log(tags);
                
                let date = null;
                if(tags.hasOwnProperty('DateTimeOriginal')) { 
                    date = tags['DateTimeOriginal'].value;
                    console.log('found DateTimeOriginal '+ date);
                } 
                if(tags.hasOwnProperty('DateCreated')) {
                    date = tags['DateCreated'].value;
                    console.log('found DateCreated '+ date);
                } 
                if(tags.hasOwnProperty('CreateDate')) { 
                    date = tags['CreateDate'].value;
                    console.log('found CreateDate '+ date);
                } 
                if(tags.hasOwnProperty('DateTime')) { 
                    date = tags['DateTime'].value;
                    console.log('found DateTime '+ date);
                } 
                if(date == null) {
                    console.log('wtf no date found');
                }
                
                if(Array.isArray(date)) { 
                    date = date[0];
                }

                let listItem = document.createElement('li');
                listing.appendChild(listItem);
                
                let canvas = document.createElement('canvas');
                canvas.width = tags['Image Width'].value;
                canvas.height = tags['Image Height'].value;
                canvas.style = "width: "+(tags['Image Width'].value/10) + "; height: "+(tags['Image Height'].value/10)+";";
                
                listItem.appendChild(canvas);
                
                
                handleImage(canvas, event.target.files[fileID], date + (xtraText.length > 0 ? " "+xtraText : ""), listItem);
            }).catch(function (error) {
                console.log('wtf', error);
            });
        }
    
        function handleImage(canvas, imageFile, overlayText, listItem){
            let fontSize = document.getElementById("fontSize").value;
            var ctx = canvas.getContext('2d');
            
            var reader = new FileReader();
            reader.onload = function(event){
                var img = new Image();
                img.onload = function(){
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
    		        ctx.lineWidth = 16;
    		        ctx.fillStyle = "#ffffff";
    		        ctx.lineStyle = "#000000";
    		        ctx.font = fontSize+"px sans-serif";
    		        ctx.fillText(overlayText, 15, img.height - 30);
                    
                    let listing = document.getElementById('listing');
                    
                    var data = canvas.toDataURL("image/jpeg");
                    var a = document.createElement('a');
                    a.setAttribute("download", imageFile.name);
                    a.setAttribute("class", 'downloadLink');
                    a.innerHTML = "Download "+ imageFile.name;
                    a.setAttribute("href", data);
                    listItem.append(document.createElement("br"));
                    listItem.appendChild(a);
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(imageFile);
        }
    }
})(window, document);
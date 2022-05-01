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
                    console.log('no date found');
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
                
                
                handleImage(canvas, event.target.files[fileID], date, listItem);
            }).catch(function (error) {
                console.log('wtf', error);
            });
        }
    
        function handleImage(canvas, imageFile, dateAsText, listItem){
            let fontSize = document.getElementById("fontSize").value;
            let fontColor = document.getElementById("fontColor").value;
            let text = document.getElementById("txt").value;
            var ctx = canvas.getContext('2d');
            
            let position = document.getElementById("txtPos").value;

            
            var reader = new FileReader();
            reader.onload = function(event){
                var img = new Image();
                img.onload = function(){
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
    		        ctx.lineWidth = 16;
    		        ctx.fillStyle = fontColor;
    		        ctx.lineStyle = fontColor;
    		        ctx.font = fontSize+"px sans-serif";
                    
                    let finalTxt = text.replace('[d]', dateAsText);
                    if(position === "btmLeft") { 
                        ctx.fillText(finalTxt, 15, img.height - 30);
                    } else if(position === "btmRight") { 
                        ctx.fillText(finalTxt, img.width - (0.5 * fontSize * finalTxt.length), img.height - 30);
                    } else if(position === "topRight") { 
                        ctx.fillText(finalTxt, img.width - (0.5 * fontSize * finalTxt.length), fontSize);
                    } else if(position === "topLeft") { 
                        ctx.fillText(finalTxt, 15, fontSize);
                    }
                    
    		        
                    
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
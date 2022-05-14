(function (window, document) {
    'use strict';

    if (!supportsFileReader()) {
        alert('Sorry, your web browser does not support the FileReader API.');
        return;
    }

    window.addEventListener('load', function () {
        document.getElementById('picker').addEventListener('change', handleFile, false);
        document.getElementById('apply').addEventListener('click', ApplySettings, false);
    }, false);

    document.querySelector('html').setAttribute('data-initialized', '');
    
    function supportsFileReader() {
        return window.FileReader !== undefined;
    }
    
    let ALL_FILES = [];
    
    function ClearOldResults() { 
        let listing = document.getElementById("listing");
        while (listing.firstChild) {
            listing.removeChild(listing.firstChild);
        }
    }
    
    function ApplySettings() { 
        ClearOldResults();
        let listing = document.getElementById("listing");
        // let thumbnailsRequested = document.getElementById("makeThumbnails").checked;
        // let thumbSize = parseFloat(document.getElementById("thumbnailSize").value.replace("%", "")) / 100;
        // console.log("thumbs?  "+ thumbnailsRequested +" || size: "+ thumbSize);
        
        for(let fileID=0; fileID<ALL_FILES.length; fileID++) {
            ExifReader.load(ALL_FILES[fileID]).then(function (tags) {
                
                let date = GetCreatedDateFromExifTags(tags);
                let listItem = document.createElement('li');
                listing.appendChild(listItem);

                // if(thumbnailsRequested) {
                    // make thumbnail
                // }

                drawImageWithOverlay(ALL_FILES[fileID], date, listItem);

            }).catch(function (error) {
                console.log('wtf', error);
            });
        }
    }

    function handleFile(event) {
        for(let fileID=0; fileID<event.target.files.length; fileID++) {
            ALL_FILES.push(event.target.files[fileID]);
        }
    }

    function drawThumbnailImage(imageFile, sizeFactor, parentElement) {
        // Create Canvas
        let canvas = document.createElement('canvas');
        parentElement.appendChild(canvas);
        let ctx = canvas.getContext('2d');

        let reader = new FileReader();
        reader.onload = function(event){
            let img = new Image();
            img.onload = function(){

                // This ONLY impacts in-browser display - fully distinct from canvas (image) size
                canvas.style.width = img.width * sizeFactor * 0.10;
                canvas.style.height = img.height * sizeFactor * 0.10;;

                // Set ACTUAL image (canvas) size
                canvas.width = img.width * sizeFactor;
                canvas.height = img.height * sizeFactor;

                // Draw the full-size image
                ctx.drawImage(img, 0, 0);

                CreateDownloadLink("tn_"+imageFile.name, canvas, parentElement);
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(imageFile);
    }
    
    function drawImageWithOverlay(imageFile, dateAsText, parentElement){
        let fontSize = document.getElementById("fontSize").value;
        let fontColor = document.getElementById("fontColor").value;
        let text = document.getElementById("txt").value;
        let position = document.getElementById("txtPos").value;

        // Create Canvas
        let canvas = document.createElement('canvas');
        parentElement.appendChild(canvas);
        let ctx = canvas.getContext('2d');


        let reader = new FileReader();
        reader.onload = function(event){
            let img = new Image();
            img.onload = function(){

                // This ONLY impacts in-browser display - fully distinct from canvas (image) size
                canvas.style.width = img.width * .10;
                canvas.style.height = img.height * .10;

                // Set ACTUAL image (canvas) size
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw the full-size image
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

                CreateDownloadLink(imageFile.name, canvas, parentElement);
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(imageFile);
    }

    function CreateDownloadLink(imageFilename, canvas, parent) {
        let link = document.createElement('a');
        link.setAttribute("download", imageFilename);
        link.setAttribute("class", 'downloadLink');
        link.innerHTML = "Download "+ imageFilename;
        link.setAttribute("href", canvas.toDataURL("image/jpeg"));
        parent.append(document.createElement("br"));
        parent.appendChild(link);
    }

    function GetCreatedDateFromExifTags(tags) {
        let date = null;
        if(tags.hasOwnProperty('DateTimeOriginal')) {
            date = tags['DateTimeOriginal'].value;
            // console.log('found DateTimeOriginal '+ date);
        }
        if(tags.hasOwnProperty('DateCreated')) {
            date = tags['DateCreated'].value;
            // console.log('found DateCreated '+ date);
        }
        if(tags.hasOwnProperty('CreateDate')) {
            date = tags['CreateDate'].value;
            // console.log('found CreateDate '+ date);
        }
        if(tags.hasOwnProperty('DateTime')) {
            date = tags['DateTime'].value;
            // console.log('found DateTime '+ date);
        }
        if(date == null) {
            console.log('no date found');
        }

        if(Array.isArray(date)) {
            date = date[0];
        }
        return date;
    }

})(window, document);
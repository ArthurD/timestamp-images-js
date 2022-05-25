(function (window, document) {
    'use strict';

    if (!supportsFileReader()) {
        alert('Sorry, your web browser does not support the FileReader API.');
        return;
    }

    const DownloadsRequested = [];
    const APPLY_ON_CHANGE = ['sortOrder', 'fontSize', 'fontColorFill', 'fontColorStroke', 'txt', 'txtPos'];

    // Ugly but whatever, is purely client-side anyways
    function checkEnableDownloadAllLink() {
        let links = document.getElementsByClassName('downloadLink');
        let btn = document.getElementById('downloadAllBtn');
        if(links.length > 0) {
            btn.style = "";
            btn.innerHTML = "Download All ("+links.length+")";
        } else {
            btn.style = "display: none;";
            btn.innerHTML = "Download All ("+links.length+")";
        }
    }

    // Invoked 'download all' link is clicked
    function downloadAll() {
        let newDownloads = [];
        for(let x=0; x<ALL_LIST_ITEMS.length; x++) {
            let link = ALL_LIST_ITEMS[x].getElementsByClassName('downloadLink')[0];
            let originalFilename = link.getAttribute('download');
            let fileExtension = originalFilename.split('.').pop();
            link.setAttribute('download', "download_"+ (String(x).padStart(4, '0'))+"."+fileExtension);
            newDownloads.push(link);
        }
        newDownloads.reverse();
        newDownloads.forEach((x) => DownloadsRequested.push(x));
    }

    // Chrome appears to throttle download clicks -- so we queue them & download at a (tight) interval
    function processDownloadQueue() {
        if(DownloadsRequested.length > 0) {
            DownloadsRequested.pop().click(); // download 1
        }
    }


    window.addEventListener('load', function () {
        document.getElementById('picker').addEventListener('change', function(e) {
          handleFile(e);
          ApplySettings();
        }, false);

        APPLY_ON_CHANGE.forEach((elementID) => {
            document.getElementById(elementID).addEventListener('change', ApplySettings, false);
        });

        document.getElementById('downloadAllBtn').addEventListener('click', downloadAll, false);

        // Process queue every N timeframe
        setInterval(function() {
            checkEnableDownloadAllLink();
            processDownloadQueue();
        }, 250);


    }, false);

    document.querySelector('html').setAttribute('data-initialized', '');
    
    function supportsFileReader() {
        return window.FileReader !== undefined;
    }

    function sortList(){
        let inverseOrder = document.getElementById('sortOrder').value === "date_asc";
        let ul = document.getElementById('listing');

        // Cloning UL is the fastest way -- 'moving' the nodes would force FULL browser re-flow each time
        let new_ul = ul.cloneNode(false);

        ALL_LIST_ITEMS.sort(function(a, b){
            return inverseOrder ?
                new Date(a.dataset.date) - new Date(b.dataset.date) :
                new Date(b.dataset.date) - new Date(a.dataset.date);
        });

        // Add them into the ul in order
        for(let i = 0; i < ALL_LIST_ITEMS.length; i++)
            new_ul.appendChild(ALL_LIST_ITEMS[i]);
        ul.parentNode.replaceChild(new_ul, ul);
    }

    let ALL_FILES = [];
    let ALL_LIST_ITEMS = [];
    
    function ClearOldResults() { 
        let listing = document.getElementById("listing");
        while (listing.firstChild) {
            listing.removeChild(listing.firstChild);
        }
        ALL_LIST_ITEMS = [];
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
                let listItem = document.createElement('div');
                listItem.classList.add('gallery');
                listItem.dataset.date = date;
                listing.appendChild(listItem);
                ALL_LIST_ITEMS.push(listItem);

                // if(thumbnailsRequested) {
                    // make thumbnail
                // }

                drawImageWithOverlay(ALL_FILES[fileID], date, listItem, sortList);

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

    function drawImageWithOverlay(imageFile, dateTimestamp, parentElement, callback) {
        let fontSize = document.getElementById("fontSize").value;
        let fontColorFill = document.getElementById("fontColorFill").value;
        let fontColorStroke = document.getElementById("fontColorStroke").value;
        console.log(fontColorFill, fontColorStroke, "colors");
        let text = document.getElementById("txt").value;
        let position = document.getElementById("txtPos").value;

        // Create Canvas
        let canvas = document.createElement('canvas');
        parentElement.appendChild(canvas);
        let ctx = canvas.getContext('2d');

        let dateAsTxt = new Date(dateTimestamp);

        let reader = new FileReader();
        reader.onload = function(event){
            let img = new Image();
            img.onload = function(){

                // Set ACTUAL image (canvas) size
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw the full-size image
                ctx.drawImage(img, 0, 0);
                
		        ctx.lineWidth = fontSize * 0.03;
		        ctx.font = fontSize+"px sans-serif";
		        ctx.fillStyle = fontColorFill.toString();
		        ctx.strokeStyle = fontColorStroke.toString();

                let finalTxt = text.replace('[d]', dateAsTxt.toLocaleString());
                if(position === "btmLeft") { 
                    ctx.fillText(finalTxt, 15, img.height - 30);
                    ctx.strokeText(finalTxt, 15, img.height - 30);
                } else if(position === "btmRight") { 
                    ctx.fillText(finalTxt, img.width - (0.5 * fontSize * finalTxt.length), img.height - 30);
                    ctx.strokeText(finalTxt, img.width - (0.5 * fontSize * finalTxt.length), img.height - 30);
                } else if(position === "topRight") { 
                    ctx.fillText(finalTxt, img.width - (0.5 * fontSize * finalTxt.length), fontSize);
                    ctx.strokeText(finalTxt, img.width - (0.5 * fontSize * finalTxt.length), fontSize);
                } else if(position === "topLeft") {
                    ctx.fillText(finalTxt, 15, fontSize);
                    ctx.strokeText(finalTxt, 15, fontSize);
                }

                SetupImageText(imageFile.name, canvas, parentElement);

                if(callback != null) {
                    callback();
                }

            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(imageFile);
    }

    function SetupImageText(imageFilename, canvas, parent) {
        let descDiv = document.createElement('div');
        descDiv.classList.add('desc');
        parent.appendChild(descDiv);

        let link = document.createElement('a');
        link.setAttribute("download", imageFilename);
        link.setAttribute("class", 'downloadLink');
        link.innerHTML = "Download";
        link.setAttribute("href", canvas.toDataURL("image/jpeg"));
        //descDiv.append(document.createElement("br"));
        descDiv.appendChild(link);
        descDiv.append(document.createElement("br"));
        let span = document.createElement('span');
        span.innerText = imageFilename;
        span.classList.add('filename');
        descDiv.appendChild(span);
    }

    function GetCreatedDateFromExifTags(tags) {
        //let date = null;
        let timestamp = null;
        let date = null;

        if(tags.hasOwnProperty('DateTimeOriginal')) {
            date = tags['DateTimeOriginal'].value;
            console.log('found DateTimeOriginal ', date);
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

        if(date != null) {
            if (Array.isArray(date)) {
                date = date[0];
            }
            timestamp = moment(date, "YYYY:MM:DD HH:mm:ss").toDate();
            console.log("DATE", date, "TIMESTAMP:", timestamp);
        } else {
            console.log('no date found');
        }
        return timestamp;
    }

})(window, document);
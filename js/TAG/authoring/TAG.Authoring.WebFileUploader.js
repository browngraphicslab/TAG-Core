﻿TAG.Util.makeNamespace('TAG.Authoring.WebFileUploader');
//This is the one for the Web App that uses Resumable.js
/**
 * Enum of file upload types
 */
TAG.Authoring.FileUploadTypes = {
    Standard: 0,
    DeepZoom: 1,
    AssociatedMedia: 2,
    VideoArtwork: 3,
    Map: 4
};

TAG.Authoring.WebFileUploader = function (root, type,  localCallback, finishedCallback, filters, useThumbs, errorCallback, multiple, innerProgBar, useOverlay, disableButton, enableButton) {
"use strict";

    var that = {};
    filters = filters || ['*'];
    multiple = multiple || false;
    var uploadingOverlay = $(document.createElement('div')),
    innerProgressBar = $(document.createElement('div')); // HTML upload overlay
    var uploadOverlayText;
    var progressBarButton;
    var progressBar;
    var uploadErrors = [];
    var dataReaderLoads = [];       //To pass into the finishedCallback, parsed as urls (paths to be precise)
    var maxDuration = Infinity;
    var minDuration = -1;
    var size;
    var globalUriStrings = [], globalFiles = [], globalUpload = null;
    var globalFilesArray = [];
    var largeFiles = [];
    var longFiles = [];
    var shortFiles = [];
    var fileUploadError;
    var removeVals = [];
    var maxFileSize = 50 * 1024 * 1024;
    var maxDeepZoomFileSize = 250 * 1024 * 1024;
    var localURLs = [];
    var resumableUploader;
    var localURL;
    var uriString;
    var filesAdded = 0;
    var filesCompleted = 0;
    var successfulUploads = false;



    //Basic HTML initialization
    (function init() {
        uploadOverlayText = $(document.createElement('label'));
        progressBar = $(document.createElement('div')).addClass('progressBarUploads');

        progressBarButton = $(document.createElement('button'))
            .addClass('progressBarUploadsButton')
            .addClass('button')
            .attr('type', 'button')
            .css({
                'border-radius':'3.5px','position': 'relative', 'top': '20%', 'left': '8%', 'border-style': 'solid', 'border-color': 'white', 'height': '60%', "display": "inline-block", "color":"white",
            })
            .text("Show Uploads");

        // Progress / spinner wheel overlay to display while uploading
        uploadingOverlay.attr("id", "uploadingOverlay");
        uploadingOverlay.css({ 'position': 'absolute', 'left': '0%', 'top': '0%', 'background-color': 'rgba(0, 0, 0, .5)', 'width': '100%', 'height': '100%', 'z-index': 100000100 });

        uploadOverlayText.css({ 'color': 'white', 'height': '5%', 'top': '35%', 'left': '35%', 'position': 'absolute', 'font-size': '150%' });
        uploadOverlayText.text('Uploading file(s). Please wait.');

        progressBar.css({
            'position': 'relative', 'top': '20%', 'left': '5%', 'border-style': 'solid', 'border-color': 'white', 'width': '10%', 'height': '20%', "display":"inline-block",
        });

        innerProgressBar.css({
            'background-color': 'white', 'width': '0%', 'height': '100%'
        });

        progressBar.append(innerProgressBar);

    })();

    (function uploadFile() {
        //Actual uploader object
        resumableUploader = new Resumable({
            target: TAG.Worktop.Database.getSecureURL(),        //Check that this works
            maxFiles: 10000,
            fileTypes: function(resumableFile) {
                switch(type) {
                    case TAG.Authoring.FileUploadTypes.VideoArtwork:
                        return 'video/mp4';
                    break;
                    case TAG.Authoring.FileUploadTypes.AssociatedMedia: 
                        return 'video/mp4, audio/mp3, image/jpeg';
                    break;
                    case TAG.Authoring.FileUploadTypes.DeepZoom:
                        return 'video/mp4, image/jpeg';
                    break;
                    default: 
                        return '*'; 
                }
            },
            query: function(resumableFile) {                    //Does it need to execute? New resumable objects for each?

                //Changing Type parameters in the query
                switch(type) {
                    case TAG.Authoring.FileUploadTypes.VideoArtwork:
                        return {
                            Type: 'FileUploadVideoArtwork',
                            ReturnDoq: true,
                            Token: TAG.Auth.getToken(),
                            Extension: resumableFile.file.type.substr(1),
                            AnotherType: resumableUpload,
                        }
                    break;
                    case TAG.Authoring.FileUploadTypes.AssociatedMedia:
                        return {
                            Type: 'FileUploadAssociatedMedia',
                            ReturnDoq: true,
                            Token: TAG.Auth.getToken(),
                            Extension: resumableFile.file.type.substr(1)
                        }
                    break;
                    case TAG.Authoring.FileUploadTypes.Standard:
                        return {
                            Type: 'FileUpload',
                            Token: TAG.Auth.getToken(),
                            Extension: resumableFile.file.type.substr(1)
                        }
                    break;
                    case TAG.Authoring.FileUploadTypes.DeepZoom:
                        if(resumableFile.file.type.match(/video/)) {
                            return {
                            Type: 'FileUploadVideoArtwork',
                            ReturnDoq: true,
                            Token: TAG.Auth.getToken(),
                            Extension: resumableFile.file.type.substr(1)
                            }
                        } else {
                            return {
                            Type: 'FileUploadDeepzoom',
                            ReturnDoq: true,
                            Token: TAG.Auth.getToken(),
                            Extension: resumableFile.file.type.substr(1)
                            }
                        }                       
                    break;
                }
                

            }
        });
        //Invisible element to fire click event for the Resumable object and open the file picker
        var clickedElement = $(document.createElement('div'));
        resumableUploader.assignBrowse(clickedElement);
        clickedElement.click();
        console.log("If you're seeing this, the file picker should be open");

        //sets up the progress popup - creates popup but doesn't show it
        var popup = TAG.Util.UI.uploadProgressPopup(null, "Upload Queue", []);
        $('body').append(popup);
        $(popup).css({'display':'none'});
        /*progressBar.unbind('click').click(function () {
            //$('body').append(popup);
            $(popup).css({ 'display': 'inherit' });
            $(popup).show();
            console.log("popup.show called");
        });*/

        progressBarButton.click(function(){
            $('body').append(popup);
            $(popup).css({ 'display': 'inherit' });
            $(popup).show();
        })

        resumableUploader.on('fileSuccess', function(resumableFile, message) {
            popup.setProgress(resumableFile.fileName, 0.9);

            //Gets back the relative path of the uploaded file on the server
            globalFiles.push(resumableFile.file);
            dataReaderLoads.push($.trim(message));
            console.log("fileSuccess! The file that was successful was " + resumableFile.file.name);
            addLocalCallback([resumableFile.file], [localURL], [uriString])();            
            filesCompleted++;
            successfulUploads = true;
            //TODO progress bar

        });
        resumableUploader.on('complete', function(file) {   //Entire upload operation is complete
            finishedUpload();
            
        });

        resumableUploader.on('fileError', function(file, message){
            console.log("Error: " + message)
            popup.setError(file.fileName)

            uploadErrors.push(file); //keep track of ALL files that had errors - will alert user at end of batch upload
            console.log("upload errors length = " + uploadErrors.length);

        })

        resumableUploader.on('fileProgress', function(resumableFile) {
            popup.setProgress(resumableFile.fileName, resumableFile._prevProgress)
            disableButton(); //disabled import buttons
            var percentComplete = resumableUploader.progress();
            innerProgressBar.width(percentComplete * 90 + "%"); // * 90 or * 100?
        });

        resumableUploader.on('fileAdded', function(resumableFile){
            console.log("the file added was " + resumableFile.file.name);
            addOverlay();
            disableButton();

            popup.createProgressElement(resumableFile.fileName)

            filesAdded++;
            var maxSize;
            globalFilesArray.push(resumableFile.file);
            //Set maximum size for the file
            switch (type) {
            case TAG.Authoring.FileUploadTypes.VideoArtwork:
            case TAG.Authoring.FileUploadTypes.AssociatedMedia:
            case TAG.Authoring.FileUploadTypes.Standard:
               maxSize = maxFileSize;
               break;
            case TAG.Authoring.FileUploadTypes.DeepZoom:
            case TAG.Authoring.FileUploadTypes.Map:
               maxSize = maxDeepZoomFileSize;
               break;
            }
            size = resumableFile.size;

            if(size < maxSize) {
                checkDuration(resumableFile, 
                function(){         //good i.e. the duration is within limits
                    
                    localURL = window.URL.createObjectURL(resumableFile.file);
                    localURLs.push(localURL);
                    var msg;
                    switch (type) {
                       case TAG.Authoring.FileUploadTypes.VideoArtwork:
                           uriString = TAG.Worktop.Database.getSecureURL() + "/?Type=FileUploadVideoArtwork&ReturnDoq=true&Token=" + TAG.Auth.getToken() + "&Extension=" + resumableFile.file.type.substr(1);
                           break;
                       case TAG.Authoring.FileUploadTypes.AssociatedMedia:
                           uriString = TAG.Worktop.Database.getSecureURL() + "/?Type=FileUploadAssociatedMedia&ReturnDoq=true&Token=" + TAG.Auth.getToken() + "&Extension=" + resumableFile.file.type.substr(1);
                           break;
                       case TAG.Authoring.FileUploadTypes.Standard:
                           uriString = TAG.Worktop.Database.getSecureURL() + "/?Type=FileUpload&&Token=" + TAG.Auth.getToken() + "&Extension=" + resumableFile.file.type.substr(1);
                           break;
                       case TAG.Authoring.FileUploadTypes.DeepZoom:
                           uriString = TAG.Worktop.Database.getSecureURL() + "/?Type=FileUploadDeepzoom&ReturnDoq=true&token=" + TAG.Auth.getToken() + "&Extension=" + resumableFile.file.type.substr(1);
                           break;
                       case TAG.Authoring.FileUploadTypes.Map:
                            uriString = TAG.Worktop.Database.getSecureURL() + "/?Type=FileUploadMap&ReturnDoq=true&token=" + TAG.Auth.getToken() + "&Extension=" + resumableFile.file.type.substr(1);
                            break;
                    }
                    //console.log("The file about to be uploaded is " + resumableFile.file.name);
                    globalUriStrings.push(uriString);
                    resumableUploader.upload();
                    
                }, function() {     //long
                    removeVals.push(resumableFile.file);
                    resumableUploader.removeFile(resumableFile);
                    longFiles.push(resumableFile.file);
                    filesCompleted++;
                    checkCompleted();

                }, function() {     //short
                    removeVals.push(resumableFile.file);
                    shortFiles.push(resumableFile.file);
                    resumableUploader.removeFile(resumableFile);
                    filesCompleted++;
                    checkCompleted();
                });
            } else {    //Size > maxSize
                resumableUploader.removeFile(resumableFile);    //Remove the file from the upload operation
                console.log("Too big!");
                largeFiles.push(resumableFile.file);
                filesCompleted++;
                checkCompleted();
               
                /*
                fileUploadError = uploadErrorAlert(null, "The selected file(s) exceeded the 50MB file limit and could not be uploaded.", null);
                $(fileUploadError).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 1000);
                $('body').append(fileUploadError);
                $(fileUploadError).fadeIn(500);
                */
            }
            //More error handlers required here?
        });

    })();
    function checkCompleted() {
        
        if(filesCompleted === filesAdded && !successfulUploads) {
            addLocalCallback([], [], [])();
            finishedUpload();
        }
        
        
    }
    //Check the duration of media files
    function checkDuration(resumableFile, good, long, short) {

        //console.log("Passing through checkDuration for" + resumableFile.file.name);
        if (resumableFile.file.type.match(/video/)) {
            console.log("checking the video properties for " + resumableFile.file.name);
            // Get video properties. Any better way of doing this?
            var videoElement = $(document.createElement('video'));
            videoElement.attr('preload', 'metadata');   //Instead of waiting for whole video to load, just load metadata
            var videoURL = URL.createObjectURL(resumableFile.file);
            videoElement.attr('src', videoURL);
            videoElement.on('loadedmetadata', function() {
                var dur = this.duration;
                if (dur > maxDuration) {
                    console.log(resumableFile.file.name + " was too long");
                    long();
                } else if (dur < minDuration) {
                    short();
                } else {
                    console.log("The duration" + "for" + resumableFile.file + " is " + dur);
                    good();
                }
                
            });

            
        } else if (resumableFile.file.type.match(/audio/)) {
            // Get audio properties. Again, better way of doing this?
            var audioElement = $(document.createElement('audio'));
            audioElement.attr('preload', 'metadata');   //Instead of waiting for whole video to load, just load metadata
            var audioURL = URL.createObjectURL(resumableFile.file);
            audioElement.attr('src', audioURL);
            audioElement.on('loadedmetadata', function() {
                var dur = this.duration;
                if (dur > maxDuration) {
                    long();
                } else if (dur < minDuration) {
                    short();
                } else {
                    good();
                }
                
            });

        } else {
            good();
        }
    }

    /**
     * Local callback
     */
    function addLocalCallback(files, localUrls, uriStrings) {
        return function () {
            localCallback(files, localUrls, uriStrings);
        };
    }


    function addOverlay(elmt) {
        //uploadingOverlay.show();
        /*if (fromImportPopUp==true) {
            uploadingOverlay.show();
            uploadingOverlay.css({ "display": "block" });
            console.log("Overlay should be visible");
        } else {*/
            //updates loading UI
           /* console.log("STARTING NEW UPLOAD")

            var settingsViewTopBar = $(document.getElementById("setViewTopBar"));
            settingsViewTopBar.append(progressBar)
            settingsViewTopBar.append(progressBarButton)*/
        //}
        //var settingsViewTopBar = $(document.getElementById("setViewTopBar"));
        //settingsViewTopBar.append(progressBar)

        if (useOverlay == true) { //do not append other progress things
            console.log("overlay should be visible here")
            uploadingOverlay.append(uploadOverlayText);

            root.append(uploadingOverlay);
            uploadingOverlay.show()
            uploadingOverlay.css({"display": "block"});    
        } else{
        //updates loading UI
            var settingsViewTopBar = $(document.getElementById("setViewTopBar"));
            settingsViewTopBar.append(progressBar);
            settingsViewTopBar.append(progressBarButton);
            console.log("STARTING NEW UPLOAD")
        }
    }

    /**
     * Totally remove the overlay from the DOM / destroy
     */
    function removeOverlay() {
        console.log("remove progress stuff on web now");
        enableButton();
        uploadingOverlay.remove();
        uploadOverlayText.remove();
        progressBar.remove();
        //progressText.remove();
        progressBarButton.remove();
    }


    function finishedUpload() {
        console.log("Called finishedUpload");
        //removeOverlay();
     
        addLocalCallback(globalFiles, localURLs, globalUriStrings)();
        finishedCallback(dataReaderLoads);
        var knownErrors = new HashTable();

        var msg = "", str, mins, secs;
        var longFilesExist = false;
        var i;
        if (largeFiles.length > 0) {
            msg = "The following file(s) exceeded the 50MB file limit: <br />";
            for(var i =0; i<largeFiles.length; i++){
                str = str + largeFiles[i].name + "<br />";
                if(!knownErrors._hasItem(largeFiles[i])){
                    knownErrors.insert(largeFiles[i], largeFiles[i]);  
                }
                
            }
            msg = msg+str;


        }
        if (longFiles.length) {
            longFilesExist = true;
            mins = Math.floor(maxDuration / 60);
            secs = maxDuration % 60;
            if (secs === 0) {
                secs = '00';
            }
            else if (secs <= 9) {
                secs = '0' + secs;
            }
            str = "The following file(s) exceeded the " + mins + ":" + secs + " duration limit:<br />";
            for (i = 0; i < longFiles.length; i++) {
                str = str + longFiles[i].name + "<br />";
                if(!knownErrors._hasItem(longFiles[i])){
                    knownErrors.insert(longFiles[i],longFiles[i]);
                }
            }
            msg = msg + str;
        }
        if (shortFiles.length) {
            if (longFilesExist) {
                msg = msg + "<br />";
            }
            mins = Math.floor(minDuration / 60);
            secs = minDuration % 60;
            if (secs === 0) {
                secs = '00';
            }
            else if (secs <= 9) {
                secs = '0' + secs;
            }
            str = "The following file(s) are shorter than the " + mins + ":" + secs + " lower duration limit:<br />";
            for (i = 0; i < shortFiles.length; i++) {
                str = str + shortFiles[i].name + "<br />";
                if(!knownErrors._hasItem(shortFiles[i])){
                    knownErrors.insert(shortFiles[i], shortFiles[i]);
                }
            }
            msg = msg + str;
        }

        var unknownErrors = [];
        for(i = 0; i<uploadErrors.length; i++){ //Filter out known errors from unknown errors
            if(knownErrors._hasItem(uploadErrors[i]) != true){
                    unknownErrors.push(uploadErrors[i]);
            }
        }


        //CHANGE THE TYPES OF ALL THE ERROR ARRAYS SO YOU CAN ACTUALLY CHECK IF THERE ARE DUPLICATES- UGH WHYYYY WHO DID THIS >:( 
        if(unknownErrors.length >0){
            //removeOverlay();
            console.log("unknown errors = " + unknownErrors);
            str = "An unknown error occurred when uploading the following files: <br />";
            for(i=0; i<unknownErrors.length; i++){
                str = str + unknownErrors[i].file.name + "<br />";
            }
            msg = msg + str;    
        }



        console.log("filesCompleted = " + filesCompleted + " and uploadErrors = " + uploadErrors.length);


        if (msg) {
        
            var fileUploadError = uploadErrorAlert(function(){
                if(filesAdded == uploadErrors.length){ //all files failed
                    removeOverlay();
                }
            }, msg, null, false, true);

            $(fileUploadError).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 1000);
            $('body').append(fileUploadError);
            $(fileUploadError).fadeIn(500);   
                
        }
    }



    function setMaxDuration(seconds) {
        maxDuration = seconds;
    }

    that.setMaxDuration = setMaxDuration;

    function setMinDuration(seconds) {
        minDuration = seconds;
    }

    that.setMinDuration = setMinDuration;

    //clickAction is what happens when the confirm button is clicked
    function uploadErrorAlert(clickAction, message, buttonText, noFade, useHTML) {
        var overlay = TAG.Util.UI.blockInteractionOverlay();

        var confirmBox = document.createElement('div');
        var confirmBoxSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });

        $(confirmBox).css({
            position: 'absolute',
            left: confirmBoxSpecs.x + 'px',
            top: confirmBoxSpecs.y + 'px',
            width: confirmBoxSpecs.width + 'px',
            height: confirmBoxSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });

        var messageLabel = document.createElement('div');
        $(messageLabel).css({
            'color': 'white',
            'width': '80%',
            'height': '50%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '0.8em',
            'position': 'relative',
            'text-align': 'center',
            'word-wrap': 'break-word',
            'font-family': 'Segoe UI',
            'overflow-y': 'auto',
        });


        if (useHTML) {
            $(messageLabel).html(message);
        } else {
            $(messageLabel).text(message);
        }
        var optionButtonDiv = document.createElement('div');
        $(optionButtonDiv).addClass('optionButtonDiv');
        $(optionButtonDiv).css({
            'height': '30%',
            'width': '98%',
            'position': 'absolute',
            'bottom': '0%',
            'right': '2%',
        });

        var confirmButton = document.createElement('button');
        $(confirmButton).css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'float': "left",
            'margin-left': '12%',
            'color': 'white',
            'border-radius': '3.5px',
            'margin-top': '1%',

            'background-color': 'transparent',
        });

        buttonText = (!buttonText || buttonText === "") ? "OK" : buttonText;
        $(confirmButton).text(buttonText);
        confirmButton.onclick = function () {
            if (clickAction)
                clickAction();
            removeAll();
        };

        function removeAll() {
            if (noFade) {
                $(overlay).hide();
                $(overlay).remove();
            } else {
                $(overlay).fadeOut(500, function () { $(overlay).remove(); });
            }
        }

        $(optionButtonDiv).append(confirmButton);

        $(confirmBox).append(messageLabel);
        $(confirmBox).append(optionButtonDiv);

        $(overlay).append(confirmBox);
        return overlay;
    }

    return that;
}
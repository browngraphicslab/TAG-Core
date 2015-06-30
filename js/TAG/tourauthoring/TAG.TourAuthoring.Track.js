TAG.Util.makeNamespace('TAG.TourAuthoring.Track');
TAG.Util.makeNamespace('TAG.TourAuthoring.TrackType');


// Enum defining track types
TAG.TourAuthoring.TrackType = {
    audio: 1,
    video: 2,
    artwork: 3,
    ink: 4,
    image: 5,
};

/**
 * Represents all the displays and keyframes of a piece of media over the duration of a tour
 * Maps to Experience Stream in RIN
 * @param spec.type         one of TAG.TourAuthoring.TrackType
 * @param spec.media        URI of resource
 * @param spec.title        Name to display
 * @param spec.id           Unique id (number)
 * @param spec.guid         Worktop GUID, artworks only
 * @param spec.timeManager  Reference to time object storing current length and scale of timeline
 * @param my                Object that will hold keyframes and displays (for accessing by subclasses w/o making public)
 *                          Will be returned w/ 'displays', 'resource', 'type', 'timeManager', 'undoManager', 'track', 'svg' parameters
 *                          Also used to track currentDisplay, currentKeyframe on mousedown, selectedKeyframe for keyframe capture (set in displays and keyframes)
 */
TAG.TourAuthoring.Track = function (spec, my) {
    "use strict";
    console.log("                            ")
    console.log("making new tour authoring Track with spec: ")
    console.log(spec)
    console.log("                            ")
    var that = {},
        media = spec.media,
        storageContainer,
        dataHolder = spec.dataHolder,
        id = ('Track-' + spec.id),
        arrayPos = spec.id,//stores the position of the selected track in the 'trackarray' array
        guid = spec.guid,
        playbackControls = spec.playbackControls,
        titlediv, // for track minimization
        titleDivManip = false,//variable used to determine when a track has been selected for vertical movement/swapping with another track 
        prevTrack = {},
        trackBody,
        prevTitleDiv = {},
        renameOverlay = $(TAG.Util.UI.blockInteractionOverlay()), //overlay for when 'rename' component option is selected
        deleteOverlay = $(TAG.Util.UI.blockInteractionOverlay()),
        editInkOverlay = $(TAG.Util.UI.blockInteractionOverlay()), //overlay for when 'edit ink' component option is selected while playhead is not over the art track
        beforeTitle = null,
        spaceBefore = false,
        fadeHidden = true,
        lastScale,
        isMinimized = false,
        released = true,
        //attachedInks = [],
        mygroup; // group that contains svg lines for audio tracks only - used by track minimization

    var iconDiv = $(document.createElement('div'));

    my = my || {};
    my.title = decodeURI(spec.title);
    my.resource = 'R-' + arrayPos;
    my.root = spec.root;
    my.type = spec.type || TAG.TourAuthoring.TrackType.artwork;
    my.timeManager = spec.timeManager;
    my.undoManager = spec.undoManager;
    my.update = spec.update; // Call this function every time a change affecting RIN data is made
    my.timeline = spec.timeline;
    my.dirtyKeyframe = false;//keeps track of when a new keyframe has been added to a track
    my.that = that;
    my.selectedTrack = spec.selectedTrack;
    my.mediaLength = spec.mediaLength;
    my.isVisible = true;
    my.attachedInks = [];
    my.converted = spec.converted;                                                                  // boolean to check if a video track is converted or not
    my.toConvert = spec.toConvert;                                                                  // boolean to check if the user want to convert a video track right after uploading

    lastScale = my.timeManager.getDuration().scale;

    // private variables
    my.displays = [];
    // A variable to store all the keyframes for the audio track : Hak
    my.allKeyframes = [];

    // HTML creation
    var convertbtn;                                                                                 //convert video button for video tracks
    var chkIntervalVal;
    var titleConversionMsg
    // Title for header
    var titledivPlaceholder,
        titleText,
        movingIndicator,//variable to keep track of when the white bar indicating if a track can be swapped with a selected track should appear on the titledivs
        compOpsOpen = false,//keeps track of when the 'component options' menu which appears on right clicking on  track is open or not
        eventsPaused = false;
    that.compOpsOpen = compOpsOpen;
    function checkVideoConverted() {
        var retstring;
        if (my.converted === false && my.toConvert === true) {
            var videotag = $(document.createElement('video'));
            videotag.attr('preload', 'metadata');
            var filename = media.slice(8, media.length);//get rid of /Images/ before the filename
            var basefilename = filename.substr(0, filename.lastIndexOf('.'));
            var fileExt = filename.substr(filename.lastIndexOf('.'));
            TAG.Worktop.Database.getConvertedCheck(
                (function (videotag) {
                    return function (output) {
                        retstring = output;
                        if (output !== "False" && output !== "Error") {
                            console.log("converted: ");
                            var mp4filepath = "/Images/" + basefilename + ".mp4";
                            var mp4file = TAG.Worktop.Database.fixPath(mp4filepath);
                            videotag.attr('src', mp4file);
                            videotag.on('loadedmetadata', function () {
                                //remove from the video array and add display with the right duration
                                changeTrackColor('white');
                                my.converted = true;
                                my.toConvert = true;
                                my.mediaLength = this.duration
                                if (fileExt !== ".mp4") {
                                    addDisplay(0, this.duration);
                                }
                                //convertbtn.remove();
                                titleConversionMsg.text("");
                                titleText.css('font-style', 'normal');
                                titlediv.css("opacity", "1");
                                clearInterval(chkIntervalVal);

                            });
                        } if (output === "Error") {
                            my.converted = false;
                            titleText.css('font-style', 'italic');
                            titleConversionMsg.text("Conversion Error");
                            titlediv.css('opacity', '0.7');
                            //pop up message 
                            //if (first!==0) {
                            var popup = TAG.Util.UI.popUpMessage(null, "An error occurred when converting video " + my.title + ". Please try to import it again.", "OK", null, null, null, true);
                            $('body').append(popup);
                            $(popup).css('z-index', 1000000);
                            $(popup).show();
                            //}
                            clearInterval(chkIntervalVal);
                            console.log("Error ocurred when converting");
                        }
                        else {
                            console.log("not converted: ");
                        }
                    }
                })(videotag), null, filename, basefilename);
        }
        return retstring;
    }
    chkIntervalVal = setInterval(checkVideoConverted, 5000);

    (function _initTitle() {
        titlediv = $(document.createElement('div'));
        titlediv.attr('id', id + '-title');
        titlediv.addClass('titlediv');
        titlediv.css({
            "height": TAG.TourAuthoring.Constants.trackHeight+'px',
            "width": 0.127 * $(window).width() + 'px',
            'margin-left': '20px',
            'left': '0%',
            'position': 'relative',
            "background-color": "rgb(105,89,89)", 
            'border-bottom-style': 'solid',
            'border': '1px solid #888',
            'top': '0px',
            'overflow': 'hidden',
            'z-index': 0,
        });

        titleText = $(document.createElement('div'));
        titleText.addClass('track-title');
        titleText.text(my.title);
        titleText.css({
            'font-size': '.75em',
            'color': 'white',
            'top': '8%', 'left': '3%',
            'position': 'relative',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap',
            'display': 'block',
            'width': 0.115*$(window).width() + 'px',
        });
        titleConversionMsg = $(document.createElement('div'));
        titleConversionMsg.addClass("track-conversion");
        titleConversionMsg.css({
            'font-size': '0.5em',
            'color': 'white',
            'top': '16%',
            'left': '3%',
            'position': 'relative',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap',
            'display': 'block',
            'width': 0.115 * $(window).width() + 'px',
        });
        //        if (my.toConvert === true && my.converted !== true) {
        //            titleText.css('font-style', 'italic');
        //            titleConversionMsg.text("Converting video...");
        //            titlediv.css('opacity','0.7');
        //        }
        if (!spec.firstupload) {
            var status = checkVideoConverted();
            if (status === "Error") {
                titleText.css('font-style', 'italic');
                titleConversionMsg.text("Conversion Error");
                titlediv.css('opacity', '0.7');
            }
            if (status === "False") {
                titleText.css('font-style', 'italic');
                titleConversionMsg.text("Converting video...");
                titlediv.css('opacity', '0.7');
            }
        } else {
            titleText.css('font-style', 'italic');
            titleConversionMsg.text("Converting video...");
            titlediv.css('opacity', '0.7');
        }
        
        titlediv.append(titleText);
        titlediv.append(titleConversionMsg);

        //call add icon function here
        addIconToTitle(my.type);
    })();
    
    function initVisuals() {
        // Track container
        my.track = $(document.createElement('div'));
        my.track.attr('id', id);
        my.track.addClass('track');
        my.track.css({
            "height": TAG.TourAuthoring.Constants.trackHeight + 'px', // changed 25%
            'position': 'relative',
            'top': '0%',
            'left': '0%',
            "background-color": "rgb(255, 255, 255)",
            'border': '1px solid #888',
            "box-shadow": "5px 0px 10px -2px #888 inset",
            "overflow":"hidden"
        });
        if (!my.mediaLength && my.converted === false) {
            my.track.css({ "background-color": "gray", });
        }
        // SVG
        my.svg = d3.select(my.track[0])
            .append("svg")
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('overflow', 'hidden')
            .attr('style', 'position: absolute');

        // HK: Where the lines will be drawn
        my.svgLines = my.svg.append("svg:g")
            .classed("connectionLines", true);

        // HK: Draws the initial line for the audio track to distinguish it as an audio track
        if (my.type == TAG.TourAuthoring.TrackType.audio) {
            mygroup = my.svgLines.append("svg:g")
                .attr("id", "keyframeLines");
            var myLine = mygroup.append("svg:line")
                .attr("x1", 0)
                .attr("y1", (100 - TAG.TourAuthoring.Constants.defaultVolume * 100) + "%")
                .attr("x2", '100%')
                .attr("y2", (100 - TAG.TourAuthoring.Constants.defaultVolume * 100) + "%")
                .style('pointer-events', 'none')
                .style("stroke", "green")
                .style("stroke-width", 4);
        }

        var _trackSizing = function (ev) {
            var displays = (dataHolder.getDisplays(arrayPos) && dataHolder.getDisplays(arrayPos).getContents()) || [];
            var i, j, keyframes;
            my.track.css('width', my.timeManager.timeToPx(ev.end) + 'px');
            for (i = 0; i < displays.length; i++) {
                displays[i].display.resetVisuals();
                keyframes = dataHolder.getKeyframes(displays[i]).getContents();
                for (j = 0; j < keyframes.length; j++) {
                    keyframes[j].resetVisuals();
                }
            }
            
        };
        _trackSizing(my.timeManager.getDuration());
        my.timeManager.onSizing(_trackSizing);
    }
    initVisuals();

    function _initTrack() {
        // Track container
        my.track = $(document.createElement('div'));
        my.track.attr('id', id);
        my.track.addClass('track');
        my.track.css({
            "height": TAG.TourAuthoring.Constants.trackHeight + 'px', // changed 25%
            'position': 'relative',
            'top': '0%',
            'left': '0%',
            "background-color": "rgb(255, 255, 255)",
            'border': '1px solid #888',
            "box-shadow": "5px 0px 10px -2px #888 inset"
        });

        var _trackSizing = function (ev) {
            my.track.css('width', my.timeManager.timeToPx(ev.end) + 'px');
        };
        _trackSizing(my.timeManager.getDuration());
        my.timeManager.onSizing(_trackSizing);

        // SVG
        my.svg = d3.select(my.track[0])
            .append("svg")
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('overflow', 'hidden')
            .attr('style', 'position: absolute');

        // Gradient definitions
        var defs = my.svg.append('defs');
        defs.append('linearGradient')
            .attr('id', 'fade-in')
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
            .call(
                function (gradient) {
                    gradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgb(256,256,256)').attr('stop-opacity', '0.75');
                    gradient.append('stop').attr('offset', '85%').attr('stop-color', TAG.TourAuthoring.Constants.displayColor).attr('stop-opacity', '0.75');
                });
        defs.append('linearGradient')
            .attr('id', 'fade-out')
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
            .call(
                function (gradient) {
                    gradient.append('stop').attr('offset', '15%').attr('stop-color', TAG.TourAuthoring.Constants.displayColor).attr('stop-opacity', '0.75');
                    gradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgb(256,256,256)').attr('stop-opacity', '0.75');
                });
        defs.append('linearGradient')
            .attr('id', 'fade-in-ink')
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
            .call(
                function (gradient) {
                    gradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgb(256,256,256)').attr('stop-opacity', '0.75');
                    gradient.append('stop').attr('offset', '85%').attr('stop-color', TAG.TourAuthoring.Constants.inkDisplayColor).attr('stop-opacity', '0.75');
                });
        defs.append('linearGradient')
            .attr('id', 'fade-out-ink')
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%')
            .call(
                function (gradient) {
                    gradient.append('stop').attr('offset', '15%').attr('stop-color', TAG.TourAuthoring.Constants.inkDisplayColor).attr('stop-opacity', '0.75');
                    gradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgb(256,256,256)').attr('stop-opacity', '0.75');
                });


        // HK: Where the displays will be drawn
        my.svgDisplays = my.svg.append("svg:g")
            .classed("displayDrawing", true);

        // HK: Where the lines will be drawn
        my.svgLines = my.svg.append("svg:g")
            .classed("connectionLines", true);

        // HK: Draws the initial line for the audio track to distinguish it as an audio track
        if (my.type == TAG.TourAuthoring.TrackType.audio) {
            mygroup = my.svgLines.append("svg:g")
                .attr("id", "keyframeLines");
            var myLine = mygroup.append("svg:line")
                .attr("x1", 0)
                .attr("y1", (100 - TAG.TourAuthoring.Constants.defaultVolume * 100) + "%")
                .attr("x2", '100%')
                .attr("y2", (100 - TAG.TourAuthoring.Constants.defaultVolume * 100) + "%")
                .style('pointer-events', 'none')
                .style("stroke", "green")
                .style("stroke-width", 4);
        }
    }

    var menu = TAG.TourAuthoring.EditorMenu({
        type: TAG.TourAuthoring.MenuType.track,
        parent: that
    }, my);
    (function _initMenu() {
        menu.addTitle('Track Options');
        var renameButton = menu.addButton('Rename', 'left', componentOptionRename);
        if (my.type === TAG.TourAuthoring.TrackType.ink) {
            var annotationButton = menu.addButton('Edit Annotation', 'left', componentOptionEditInk);
            //Telemetry for add annotation button
            TAG.Telemetry.register(annotationButton, "mousedown", "EditAnnotation");

        }
        if (my.type === TAG.TourAuthoring.TrackType.video && !my.toConvert) {
            convertbtn = menu.addButton('Convert', 'left', componentOptionConvertVideo);

            //if (my.toConvert === true) {
            //    convertbtn.text("Converting");
            //    convertbtn.css({
            //        'color': 'gray' 
            //    })
            //    convertbtn.data('disabled', true);
            //}
        }
        var duplicateButton = menu.addButton('Duplicate', 'left', componentOptionDuplicate);
        var deleteButton = menu.addButton('Delete', 'left', componentOptionDelete);
        var cancelButton = menu.addButton('Cancel', 'left', componentOptionCancel);

        //Rename button highlighting
        renameButton.on('mousedown', function () {
            renameButton.css({ "background-color": "white", "color": "black" });
        });

        renameButton.on('mouseup', function () {
            renameButton.css({ "background-color": "transparent","color":"white" });
        });

        renameButton.on('mouseout', function () {
            renameButton.css({ "background-color": "transparent", "color": "white" });
        });

        //Telemetry for rename button
        TAG.Telemetry.register(renameButton, "mousedown", "RenameTrack");

        //Duplicate button highlighting
        duplicateButton.on('mousedown', function () {
            duplicateButton.css({ "background-color": "white", "color": "black" });
        });

       duplicateButton.on('mouseup', function () {
            duplicateButton.css({ "background-color": "transparent", "color": "white" });
        });

        duplicateButton.on('mouseout', function () {
            duplicateButton.css({ "background-color": "transparent", "color": "white" });
        });

        //Telemetry for duplicate button
        TAG.Telemetry.register(duplicateButton, "mousedown", "DuplicateTrack");

        //Delete button highlighting
        deleteButton.on('mousedown', function () {
            deleteButton.css({ "background-color": "white", "color": "black" });
        });

        deleteButton.on('mouseup', function () {
            deleteButton.css({ "background-color": "transparent", "color": "white" });
        });

        deleteButton.on('mouseout', function () {
            deleteButton.css({ "background-color": "transparent", "color": "white" });
        });

        //Telemetry for duplicate button
        TAG.Telemetry.register(deleteButton, "mousedown", "DeleteTrack");

        //Cancel button highlighting
        cancelButton.on('mousedown', function () {
            cancelButton.css({ "background-color": "white", "color": "black" });
        });

        cancelButton.on('mouseup', function () {
            cancelButton.css({ "background-color": "transparent", "color": "white" });
        });

        cancelButton.on('mouseout', function () {
            cancelButton.css({ "background-color": "transparent", "color": "white" });
        });

        TAG.Telemetry.register(cancelButton, 'mousedown', 'AuthoringCancelButton', function (tobj) {
            tobj.cancelled_action = "Cancel Track Options"; //what was cancelled
        });


    })();

    function close() {
        menu.forceClose();
    }

    function displayError(displayString) {
        close();
        var messageBox = TAG.Util.UI.popUpMessage(null, displayString, null);
        $(messageBox).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 1000);
        $('body').append(messageBox);
        $(messageBox).fadeIn(500);

        var currSelection = dataHolder.getSelectedTrack();
        if (currSelection) {
            currSelection.setDeselected();
        }
    }
    function componentOptionConvertVideo(evt) {
        var curtrack = that;
        var newFileName = media.slice(8, media.length);
        var index = newFileName.lastIndexOf(".");
        var fileExtension = newFileName.slice(index);
        var baseFileName = newFileName.slice(0, index);
        TAG.Worktop.Database.convertVideo(function () {
        }, null, newFileName, fileExtension, baseFileName, null, "True");
        my.toConvert = true;
        //disable the button
        convertbtn.remove();

        titleConversionMsg.text("Converting...");
        titlediv.css('opacity', '0.7');
        titleText.css('font-style', 'italic');
        //convertbtn.text("Converting");
        //convertbtn.css({
        //    'color': 'gray'
        //})
        //convertbtn.data('disabled', true);
        var currSelection = dataHolder.getSelectedTrack();
        if (currSelection) {
            currSelection.setDeselected();
        }
        close();
    }
    //method for manipulating ink canvas
    function componentOptionEditInk(evt) {
        var i;
        var displays = that.getStorageContainer().displays.getContents();
        if ($("#inkDrawControls").css("display") == "block" || $("#inkTransparencyControls").css("display") == "block" || $("#inkTextControls").css("display") == "block" || $("#inkEditDraw").css("display") == "block" || $("#inkEditTransparency").css("display") == "block" || $("#inkEditText").css("display") == "block") {
            displayError("An annotation is already being edited.");
            return;
        }

        if (!displays.length) {
            displayError("The annotation must be visible in the preview window in order to edit it.");
            return;
        }

        var inArtDisplay = true; //keeps track of if playhead is in art display
        var currTime = my.timeManager.getCurrentTime();

        if (getInkEnabled()) {
            var currTrack = getInkLink(),
                trackdisplays = currTrack.getDisplays();
            for (i = 0; i < trackdisplays.length; i++) {
                if ((trackdisplays[i].getStart() <= currTime) && (currTime <= trackdisplays[i].getOutStart() + trackdisplays[i].getFadeOut())) {
                    inArtDisplay = true;
                    break;
                }
                inArtDisplay = false;
            }
        }

        var inInkDisplay = false;//keeps track of if playhead is in ink display
        var closestTime = -1000000;

        // ******************************************************************
        // TODO: convert array to a tree for easy search between time ranges
        // ******************************************************************

        for (i = 0; i < displays.length; i++) {
            if (displays[i].display.getStart() <= currTime && currTime <= displays[i].display.getOutStart() + displays[i].display.getFadeOut()) {
                //inside the end of the fade-out and the start of the fade-in
                inInkDisplay = true;
                break;
            }
        }

        //ensures warning message appears if user tries to edit an ink without the playhead being inside artwork and ink, ink or artwork
        if ((!inInkDisplay) || (!inArtDisplay)) {
            displayError("The annotation must be visible in the preview window in order to edit it.");
            return;
        }

        my.timeManager.stop();
        var old_datastring = that.getInkPath();
        var inkType = old_datastring.split("::")[0].toLowerCase();
        close();

        if (!old_datastring || !inkType) {
            displayError("This annotation track has become corrupted, please remove and create a new ink.");
            return;
        }


        var ES = $("div[id='" + my.title + "']");
        if (!ES[0]) {
            displayError("The annotation must be visible in the preview window in order to edit it.");
            return;
        }

        //that.setInkPath("");
        my.isVisible = false;

        if (inkType === "path" || inkType == "bezier") { //edit draw ink
            my.timeline.showEditDraw(that, old_datastring);
        }
        else if (inkType === "trans") { //edit transparency
            var transType = old_datastring.split("[mode]")[1].split("[")[0];
            my.timeline.showEditTransparency(that, old_datastring, transType);
        }
        else if (inkType === "text") { //edit text
            var text_elt = ES.find('text');
            var viewBox = text_elt[0] ? ES.find('svg')[0].getAttribute('viewBox') : null;
            if (!text_elt[0] || (getInkEnabled() && !viewBox)) {
                my.isVisible = true;
                displayError("The annotation must be loaded and on screen in order to edit it.");
                return;
            }
            var rinplayer = $('#ITEHolder');
            var dims = {
                x: text_elt.offset().left - rinplayer.offset().left,
                y: text_elt.offset().top - rinplayer.offset().top,
                w: text_elt[0].getBBox().width,
                h: text_elt[0].getBBox().height,
                fontsize: getInkEnabled() ? parseFloat(text_elt.attr("font-size")) * (rinplayer.height() / parseFloat(viewBox.split(" ")[3])) : null
            };
            my.timeline.showEditText(that, old_datastring, dims);
        } else {
            my.isVisible = true;
            displayError("This annotation track is in a deprecated format, please remove and create a new ink.");
            return;
        }

        var currSelection = dataHolder.getSelectedTrack();
        if (currSelection) {
            currSelection.setDeselected();
        }
        
        //show overlay to make all tracks non-clickable when edit ink
        if (my.isVisible === true)
            return;
        my.timeline.showEditorOverlay();
    }
    
    //method for handling rename
    function componentOptionRename(evt) {
        menu.close();
        var renameDialog = $(document.createElement("div"));
        renameDialog.attr("id", "renameDialog");


        ///new css
        var renameDialogSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });
        renameDialog.css({
            position: 'absolute',
            left: renameDialogSpecs.x + 'px',
            top: renameDialogSpecs.y + 'px',
            width: renameDialogSpecs.width + 'px',
            height: renameDialogSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });

        renameOverlay.append(renameDialog);
        var renameDialogTitle = $(document.createElement('div'));
        renameDialogTitle.attr('id', 'renameDialogTitle');
        renameDialogTitle.css({
            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '1.25em',
            'position': 'relative',
            'text-align': 'center',
            'word-wrap': 'break-word',
        });


        //renameDialog.css({
        //    'height': '30%',
        //    'width': '45%',
        //    'position': 'fixed',
        //    'top': '50%',
        //    'left': '50%',
        //    'margin-top': '-15%',
        //    'margin-left': '-22.5%',
        //    'background-color': 'black',
        //    'z-index': TAG.TourAuthoring.aboveRinZIndex+5,
        //    'border': '3px double white',
        //});
         
        //renameOverlay.append(renameDialog);
        $("body").append(renameOverlay);
        my.timeManager.stop();
        renameOverlay.fadeIn(500);
        var form = $(document.createElement("form"));
        var newName = $(document.createElement("input"));
        /*newName.on('keyup', function () {
            var txt = (newName && newName[0] && newName[0].value) ? newName[0].value.replace(/[^àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\w\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') : "";
            if (newName && newName[0] && newName[0].value && newName[0].value != txt) {
                newName[0].value = txt;
            }
        });*/
        form.css("text-align", 'left').attr("maxlength","100");
        newName.attr("type", "text");
        newName.css("margin", '4% 4%');
        newName.css("width", '100%'); 
        newName.attr("id","newNameInput"); 
        newName.val(my.title); // default text is existing title
        var text = $(document.createElement("div"));
        newName.attr('maxlength', '50');
        text.text("Rename track to: ");
        text.css({
            //'top': '5%',
            //'height': '20%',
            //'width': '90%',
            //'color': 'white',
            //'margin': '5%',
            //'font-size': '200%'

            color: 'white',
            'width': '80%',
            //'height': '15%',
            'left': '10%',
            //'top': '12.5%',
            'font-size': '1.25em',
            'position': 'absolute',
            'text-align': 'center',
            //'overflow': 'hidden',
            'margin-top': '3%',
        });
        form.append(text);

        form.append(newName);
        renameDialog.append(form);
        newName.css({
            'width': '80%',
            'margin-left': '10%',
            'margin-right': '10%',
            'margin-top':'10%',//'10%',
            'box-sizing': 'border-box',
            'position':'relative',
            //width: 92%; margin-left: 4%; box-sizing: border-box;

        });
        var buttonDiv = $(document.createElement("div"));
        buttonDiv.css('text-align', 'right');
        var emptyDiv = $(document.createElement("div"));
        emptyDiv.css('clear', 'both');
        var buttonRow = $(document.createElement('div'));
        buttonRow.css({
            //'margin-top': '10px',
            //'text-align': 'center',

            'position': 'relative',
            'display': 'block',
            'width': '80%',
            'left': '10%',


        });
        buttonDiv.append(buttonRow);
        var ok = $(document.createElement("button"));
        ok.text("Apply");
        ok.css({
            //'left': '4%',
            //'bottom': '10%',
            //'font-size': '140%',
            //'position': 'absolute',
            //'box-sizing': 'border-box',

            'padding': '1%',
            'border': '1px solid white',
            'border-radius':'3.5px',
            'width': 'auto',
            'position': 'relative',
            //'margin-top': '1%',
            'float': "right",
            'margin-right': '7%',
            'margin-top': '5%',
                        

        });
        buttonRow.append(ok);
        var cancel = $(document.createElement('button'));
        cancel.attr('type', 'button');
        cancel.text("Cancel");
        cancel.css({
         

            //'right': '4%',
            //'bottom': '10%',
            //'font-size': '140%',
            //'position': 'absolute',
            //'box-sizing': 'border-box',

            'padding': '1%',
            'border-radius': '3.5px',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            //'margin-top': '1%',
            'margin-left': '7%',
            'float': "left",
            'margin-top': '5%',
        });
        //buttonDiv.append(cancel);
        //buttonDiv.append(ok);
        buttonDiv.append(emptyDiv);
        buttonRow.append(cancel);
        //renameDialog.append(buttonDiv);
        renameDialog.append(buttonRow);
        renameDialog.show();
        close();

        ok.click(okTap);
        cancel.click(function () {
            renameOverlay.fadeOut(500);
            $(renameOverlay).remove();
        });
        
        $(document).keypress(function (e) {
            if (e.which == 13) {
                okTap(e);
            }
        });

        function okTap(evt) {
            $(renameOverlay).fadeOut(500);
            var tmpTitle = that.getTitle();
            that.setTitle(newName.val().replace(/\'/g, '').replace(/\"/g, ''));
            //renameDialog.remove();
            $(renameOverlay).remove();
            //bleveque: if we change the title of an artwork or image  track, update the links of any attached inks
            if (my.type == TAG.TourAuthoring.TrackType.artwork || my.type == TAG.TourAuthoring.TrackType.image) {
                dataHolder.mapTracks(function (currentTrack) {
                    if (currentTrack.track.getType() == TAG.TourAuthoring.TrackType.ink && currentTrack.track.getInkEnabled() && currentTrack.track.getInkLink().getTitle() == that.getTitle()) {
                        currentTrack.setInkLink(that);
                    }
                });
            }
            
        }
        var currSelection = dataHolder.getSelectedTrack();
        if (currSelection) {
            currSelection.setDeselected();
        }
    }

    function componentOptionDuplicate(evt) { // creates a duplicate track underneath
        menu.close();
        var currTrack = that;
        var undoStackSize = my.undoManager.undoStackSize();
        //var displays = currTrack.getDisplays(); // each has access to its keyframes
        var media = currTrack.getMedia();
        var pos = currTrack.getPos();
        
        var name = currTrack.getTitle();
        var keyframes, e, inFade, outFade, key; // e is the new track
        switch (currTrack.getType()) {
            case TAG.TourAuthoring.TrackType.audio:
                e = my.timeline.addAudioTrack(media, name, null, my.mediaLength);
                addTracksDisplays(e);
                currTrack.insert(e);
                break;

            case TAG.TourAuthoring.TrackType.video:
                e = my.timeline.addVideoTrack(media, name, null, my.mediaLength);
                addTracksDisplays(e);
                currTrack.insert(e);
                break;

            case TAG.TourAuthoring.TrackType.image:
                e = my.timeline.addImageTrack(media, name, null);
                addTracksDisplays(e);
                currTrack.insert(e);
                break;

            case TAG.TourAuthoring.TrackType.ink:
                var expID = currTrack.getInkLink();
                e = my.timeline.addInkTrack(expID, name, currTrack.getMedia(), currTrack.getInkSpec(), null);
                if (expID) {//if it is an attached ink
                    expID.addAttachedInkTrack(e);
                    e.setInkLink(expID);
                }
                addTracksDisplays(e);
                currTrack.insert(e);
                e.setInkEnabled(currTrack.getInkEnabled());
                e.setInkPath(currTrack.getInkPath());
                e.setInkProps({}); // not used
                e.setInkInitKeyframe(currTrack.getInkInitKeyframe());
                e.setInkRelativeArtPos(currTrack.getInkRelativeArtPos());
                
                e.addInkTypeToTitle(currTrack.getInkPath().split('::')[0].toLowerCase());
                break;

            case TAG.TourAuthoring.TrackType.artwork:
                e = my.timeline.addArtworkTrack(media, name, currTrack.getGUID(), null);
                addTracksDisplays(e);
                currTrack.insert(e);
                break;
        }

        function addTracksDisplays(e) {
            var trackNum = e.getPos();
            var displayContent = that.getStorageContainer().displays.getContents();
            for (var i = 0; i < displayContent.length; i++) {
                addEachTrackDisplay(i);
            }

            function addEachTrackDisplay(i) {
                var dispLength, dispStart, currDisp = displayContent[i].display;
                if (currTrack.getType() !== TAG.TourAuthoring.TrackType.audio) {
                    dispLength = currDisp.getMain() + 2 * TAG.TourAuthoring.Constants.defaultFade;
                    dispStart = currDisp.getMainStart() - TAG.TourAuthoring.Constants.defaultFade;
                }
                else {
                    dispLength = currDisp.getMain();
                    dispStart = currDisp.getMainStart();
                }

                var sourceDisp = displayContent[i];
                var newDisp = e.addDisplay(my.timeManager.timeToPx(dispStart), dispLength);

                var parentDisp = sourceDisp.display.getParentDisplay();

                if (parentDisp) {
                    parentDisp.addChildDisplay(newDisp);
                    newDisp.setParentDisplay(parentDisp);
                }

                //newDisp.setFadeInFromMenu(currDisp.getFadeIn());
                //newDisp.setFadeOutFromMenu(currDisp.getFadeOut());
                newDisp.basicSetTimes(sourceDisp.display.getTimes()); // we know exactly what the times should be for each display; no need to do bounds checking

                var sourcekf = currDisp.getStorageContainer().keyframes.getContents();//reset for current display
                for (var j = 0; j < sourcekf.length; j++) {
                    var currkf = sourcekf[j];
                    if (currTrack.getType() === TAG.TourAuthoring.TrackType.audio) {//need y value for volume keyframes
                        var newkf = newDisp.addKeyframe(my.timeManager.timeToPx(currkf.getTime()), currkf.getVolumePx());//adds keyframe and stores it
                        e.addKeyframeToLines(newkf);//adds it to audio lines
                        newkf.restoreHandlers();
                    }
                    else {
                        var newkf = newDisp.addKeyframe(my.timeManager.timeToPx(currkf.getTime()));
                        newkf.loadRIN(currkf.getCaptureData());
                        my.dirtyKeyframe = true;
                        newkf.restoreHandlers();
                    }
                }
            }
            my.timeManager.setScale(my.timeManager.getScale()); // bleveque: TODO hacky fix before SAM release -- figure out why displays were showing up strangely otherwise
            console.log("combining " + (my.undoManager.undoStackSize() - undoStackSize));
            my.undoManager.combineLast(my.undoManager.undoStackSize() - undoStackSize);
        }

    }

   


    //event handling for delete button
    function componentOptionDelete(evt) {

        menu.close();
        //

        var deleteDialog = $(document.createElement("div"));
        deleteDialog.attr("id", "deleteDialog");


        ///new css
        var deleteDialogSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });
        deleteDialog.css({
            position: 'absolute',
            left: deleteDialogSpecs.x + 'px',
            top: deleteDialogSpecs.y + 'px',
            width: deleteDialogSpecs.width + 'px',
            height: deleteDialogSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });
     
        //deleteOverlay.append(deleteDialog);
        var deleteDialogTitle = $(document.createElement('div'));
        deleteDialogTitle.attr('id', 'deleteDialogTitle');
        deleteDialogTitle.css({
            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '1.25em',
            'position': 'relative',
            'text-align': 'center',
            // 'overflow': 'hidden',
            'word-wrap': 'break-word',
        });

        $("body").append(deleteOverlay);
        deleteOverlay.append(deleteDialog);

        my.timeManager.stop();
        deleteOverlay.fadeIn(500);
        close();

        var mssge = $(document.createElement('div'));
        mssge.attr('id', 'mssge');
        var text = "Are you sure you want to delete " + my.title;
         mssge.text(text);
        mssge.css({
            //color: 'white',
            //'width': '80%',
            //'height': '15%',
            //'left': '10%',
            //'top': '12.5%',
            //'font-size': '1.25em',
            //'position': 'relative',
            //'text-align': 'center',
            ////'overflow': 'hidden',
            //'word-wrap': 'break-word',
            color: 'white',
            'width': '80%',
            'height': '50%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '0.8em',
            //'overflow': 'hidden',
            'position': 'relative',
            'text-align': 'center',
            'text-overflow': 'ellipsis',
            'word-wrap': 'break-word',
            'maxlength':'200'
        });
        var fontsize = TAG.Util.getMaxFontSizeEM(text, 1, mssge.width(), mssge.height());
        mssge.css('font-size', fontsize);
        deleteDialog.append(mssge);

        //var mssge = "Are you sure you want to delete " + my.title;
        var hasAttachedInks = false;
        var trackArray = dataHolder.getTracks();
        //for (var jj = 0; jj < trackArray.length; jj++) {
        //    if (trackArray[jj].getType() === TAG.TourAuthoring.TrackType.ink && trackArray[jj].getInkEnabled() && trackArray[jj].getInkLink().getTitle() === that.getTitle()) {
        //        hasAttachedInks = true;
        //        break;
        //    }
        //}
        dataHolder.mapTracks(function (i) {
            if (i.track.getType() === TAG.TourAuthoring.TrackType.ink && i.track.getInkEnabled() && i.track.getInkLink().getTitle() === that.getTitle()) {
                hasAttachedInks = true;
                return;
            }
        });

        text += ((hasAttachedInks && (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image)) ? " and any attached annotation tracks?" : "?");
        mssge.text(text);

        //var confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
        //    yesTap();
        //}, mssge, "Delete");
        //$(confirmationBox).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 7);
        //$('body').append(confirmationBox);
        //my.timeManager.stop();

        //$(confirmationBox).fadeIn(500);
        //close();


        var buttonRow = $(document.createElement('div'));
        buttonRow.css({
            //'margin-top': '10px',
            //'text-align': 'center',

            'height': '20%',
            'width': '80%',
            'position': 'absolute',
            'color': 'white',
            'bottom': '5%',
            'right': '10%',


        });
        deleteDialog.append(buttonRow);

        // TODO: Hook in save-to-server functionality here!
        var deleteButton = $(document.createElement('button'));
        deleteButton.css({
            'padding': '1%',
            'border-radius': '3.5px',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
          
        });
        deleteButton.text('Delete');
        $(deleteButton).click(function () {
            yesTap();
            deleteOverlay.fadeOut(500);
            $(deleteOverlay).remove();
        });

        buttonRow.append(deleteButton);

        var cancelButton = $(document.createElement('button'));
        cancelButton.css({

            'padding': '1%',
            'border-radius': '3.5px',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',

            'float': 'right'
        });
        cancelButton.text('Cancel');
        cancelButton.click(function () { deleteOverlay.fadeOut(500); });
        buttonRow.append(cancelButton);
        TAG.Util.multiLineEllipsis(mssge);


        function yesTap() {
            close();
            var displayData = that.getStorageContainer().displays;
            var command = TAG.TourAuthoring.Command({
                execute: function () {
                    remove();

                    //if artwork is removed, also check if ink functionality should be removed
                    if (!my.timeline.checkForArtworks(0)) {
                        my.timeline.disableInk();
                    }

                    //code to snap down track list such that the track list is always full if it can be
                    if (dataHolder.numTracks() > 0) {
                        var last = $('#Track-' + (dataHolder.numTracks() - 1) + '-title');
                        var trackBottom = ($(document.getElementById('playback-controls')).offset().top);
                        var lastDivBottom = ($(last).offset().top + TAG.TourAuthoring.Constants.trackHeight);

                        //need to check if the first div is on the screen -- then no need to scroll
                        var first = dataHolder._trackArray[0].track.getTitleDiv();
                        var firstTop = first.offset().top;
                        var trackTop = $(timeline).offset().top;
                        if (firstTop < trackTop) {
                            if ((lastDivBottom + TAG.TourAuthoring.Constants.trackHeight) < trackBottom) {
                                //var t = $('.track').css('top');
                                //$('.track').css({
                                //   //'top': parseInt(t, 10) + TAG.TourAuthoring.Constants.trackHeight + "px"
                                //});
                                //$('.titlediv').css({
                                //    //'top': parseInt(t, 10) + TAG.TourAuthoring.Constants.trackHeight + "px"
                                //});
                            }
                        }
                    }
                    my.update();
                },
                unexecute: function () {
                    var replaceTrack = dataHolder.insertTrack(that, that.getPos());
                    replaceTrack.displays = displayData;
                    reloadTrack();
                }
            });
            my.undoManager.logCommand(command);
            command.execute();

            my.timeline.removeInkSession();
            var counter = 1;//one track removed so far
            //this block of code handles the case when an art piece with attached inks is deleted
            for (var k = my.attachedInks.length-1; k >= 0; k--) {
                deleteAttachedInks(k);
            }

            function deleteAttachedInks(j) {
                var track = my.attachedInks[j];
                var inkDisplayData = track.getStorageContainer().displays;
                counter++;
                var command = TAG.TourAuthoring.Command({
                    execute: function () {
                        removeAttachedInkTrack(track);
                        track.remove();
                        //my.update();
                    },
                    unexecute: function () {
                        var replaceTrack = dataHolder.insertTrack(track, track.getPos());
                        replaceTrack.displays = inkDisplayData;
                        track.reloadTrack();
                    }
                });
                my.undoManager.logCommand(command);
                command.execute();
            }

            if (counter > 1) {
                my.undoManager.combineLast(counter);
            }

            updateTrackArray();

            my.update();
        }



        //
        //var mssge = "Are you sure you want to delete " + my.title;
        //var hasAttachedInks = false;
        //for (var jj = 0; jj < trackarray.length; jj++) {
        //    if (trackarray[jj].getType() === TAG.TourAuthoring.TrackType.ink && trackarray[jj].getInkEnabled() && trackarray[jj].getInkLink().getTitle() === that.getTitle()) {
        //        hasAttachedInks = true;
        //        break;
        //    }
        //}
        //mssge += ((hasAttachedInks && (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image)) ? " and any attached ink tracks?" : "?");
        //var confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
        //    yesTap();
        //}, mssge, "Delete");
        //$(confirmationBox).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 7);
        //$('body').append(confirmationBox);
        //my.timeManager.stop();

        //$(confirmationBox).fadeIn(500);
        //close();
        //function yesTap() {
        //    close();
        //    var command = TAG.TourAuthoring.Command({
        //        execute: function () {
        //            my.timeline.removeTrack(that);

        //            //if artwork is removed, also check if ink functionality should be removed
        //            if (!my.timeline.checkForArtworks(0)) {
        //                my.timeline.disableInk();
        //            }

        //            //code to snap down track list such that the track list is always full if it can be
        //            if (trackarray.length>0) {
        //                var last = $('#Track-' + (trackarray.length - 1) + '-title');
        //                var trackBottom = ($(document.getElementById('playback-controls')).offset().top);
        //                var lastDivBottom = ($(last).offset().top + TAG.TourAuthoring.Constants.trackHeight);

        //                //need to check if the first div is on the screen -- then no need to scroll
        //                var first = $('#Track-' + 0 + '-title');
        //                var firstTop = $(first).offset().top;
        //                var trackTop = $(timeline).offset().top;
        //                if (firstTop < trackTop) {
        //                    if ((lastDivBottom + TAG.TourAuthoring.Constants.trackHeight) < trackBottom) {
        //                        //var t = $('.track').css('top');
        //                        //$('.track').css({
        //                        //   //'top': parseInt(t, 10) + TAG.TourAuthoring.Constants.trackHeight + "px"
        //                        //});
        //                        //$('.titlediv').css({
        //                        //    //'top': parseInt(t, 10) + TAG.TourAuthoring.Constants.trackHeight + "px"
        //                        //});
        //                    }
        //                }
        //            }

        //        },
        //        unexecute: function () {
        //            reloadTrack();
        //        }
        //    });
        //    my.undoManager.logCommand(command);
        //    command.execute();

        //    my.timeline.removeInkSession();
        //    var counter = 1;//one track removed so far
        //    //this block of code handles the case when an art piece with attached inks is deleted
        //    for (var ii = 0; ii < trackarray.length; ii++) {
        //        if (trackarray[ii].getType() === TAG.TourAuthoring.TrackType.ink && trackarray[ii].getInkEnabled() && trackarray[ii].getInkLink().getTitle() === that.getTitle()) {
        //            (function (j) {
        //                var track = trackarray[j];

        //                counter++;
        //                var command = TAG.TourAuthoring.Command({
        //                    execute: function () {
        //                        my.timeline.removeTrack(track);
        //                    },
        //                    unexecute: function () {
        //                        track.reloadTrack();
        //                    }
        //                });
        //                my.undoManager.logCommand(command);
        //                command.execute();
                        
        //            })(ii);
        //            ii--;
        //        }
        //    }
        //    my.undoManager.combineLast(counter);
        //}    
    }
    //event handling for cancel button
    function componentOptionCancel(evt) {
        var currSelection = dataHolder.getSelectedTrack();
        if (currSelection) {
            currSelection.setDeselected();
        }
        close();
    }
    
    //function to pause events
    function updateTracksEventsPaused(fb) {
        dataHolder.mapTracks(function (i) {
            i.track.setEventsPaused(fb);
        });
        //$.each(trackarray, function () {
        //    this.setEventsPaused(fb);
        //});
    }
    that.updateTracksEventsPaused = updateTracksEventsPaused;

    /**Xiaoyi & Libby
    *set a display selected when in multi select mode
    */
    function setSelected() {
        dataHolder.selectTrack(that);
        titlediv.css({
            "background-color": "#000"
        });
    }
    that.setSelected = setSelected;

    /**Xiaoyi & Libby
    *set a display deselected in multi select mode
    */
    function setDeselected() {
        dataHolder.selectTrack(null);
        titlediv.css({
            "background-color": "rgb(105,89,89)"
        });
    }
    that.setDeselected = setDeselected;

    // PUBLIC METHODS -- Getters and setters for type and media
    function getType () {
        return my.type;
    }
    that.getType = getType;

    function getMedia () {
        return media;
    }
    that.getMedia = getMedia;

    function getPos() {
        return arrayPos;
    }
    that.getPos = getPos;

    function getTitle () {
        return my.title;
    }
    that.getTitle = getTitle;

    function setTitle(newTitle) {
        newTitle = my.timeline.fixTrackTitle(newTitle, getID());
        my.title = newTitle;
        titleText.text(my.title);
    }
    that.setTitle = setTitle;

    function getSharedMy() {
        return my;
    }
    that.getSharedMy = getSharedMy;

    function getEventsPaused() {
        return eventsPaused;
    }
    that.getEventsPaused = getEventsPaused;

    function setEventsPaused(fB) {
        eventsPaused = fB;
    }
    that.setEventsPaused = setEventsPaused;

    function getCurrentDisplay() {
        return my.currentDisplay;
    }
    that.getCurrentDisplay = getCurrentDisplay;
    
    function setCurrentDisplay(currDisplay) {
        my.currentDisplay = currDisplay;
    }
    that.setCurrentDisplay = setCurrentDisplay;

    function setIsVisible(visibility) {
        my.isVisible = visibility;
    }
    that.setIsVisible = setIsVisible;

    function getCurrentKeyframe() {
        return my.currentKeyframe;
    }
    that.getCurrentKeyframe = getCurrentKeyframe;

    function getGUID() {
        return guid;
    }
    that.getGUID = getGUID;

    function setStorageContainer(storeContain) {
        storageContainer = storeContain;
    }
    that.setStorageContainer = setStorageContainer;

    function getStorageContainer() {
        return storageContainer;
    }
    that.getStorageContainer = getStorageContainer;

    /**
     * Functions for track ID
     * Corresponds to ordering of tracks in timeline array
     * Maps to z-layering in RIN
     * Each track ID should be unique, but might change on track switch
     * Use updatePos to update id
     */

    function getID() {
        return id.split('-')[1];
    }
    that.getID = getID;

    //function to update tracks in array to their current positions.
    function updateTrackArray() {
        dataHolder.mapTracks(function (container, i) {
            container.track.updatePos(i);
        });
    }

    //handles update of location in track array
    function updatePos(pos) {
        arrayPos = pos;
        id = ('Track-' + pos);
        titlediv.attr('id', id + '-title');       
        my.track.attr('id', id);
        my.resource = 'R-' + arrayPos;
        //prevTrack = my.track.prev(".track");
        //prevTitleDiv = titlediv.prev(".titlediv");
        //console.log("new position assigned: " + pos);
    }
    that.updatePos = updatePos;

    /*function checks that given value is within range of top and bottom of titlediv
    * @ param switchOffSet keeps track of the the height of each div
    */
    function checkWithinTitleDiv(switchOffset) {
        var t = titlediv.offset().top;     
        if (that.getPos() == 0 && spaceBefore)
            t -= TAG.TourAuthoring.Constants.trackHeight;       
        var h = parseInt(titlediv.css("height"),10);

        if (switchOffset >= t && switchOffset <= t + h) {
            return true;
        }
        else
            return false;
    }
    that.checkWithinTitleDiv = checkWithinTitleDiv;

    function getTitleDiv() {
        return titlediv;
    }
    that.getTitleDiv = getTitleDiv;

    /* 
    * function to move a current track to the location next to this track
    * if the track to be inserted is below this track, then it is inserted before this track
    * otherwise, it is inserted after
    */
    function insert(track) {
        if (track == that) {
            return;
        }
        var samePosition=false;
        if (arrayPos < track.getPos()) {
            samePosition = track.insertHelper(arrayPos);
        } else {
            samePosition = track.insertHelper(arrayPos);
        }
        updateTrackArray();
        my.update();
        // for resetting the tracks graphically when this is called
        //var t = $('.track').css('top');
        //$('.titlediv').css('top', parseFloat(t) + 'px');
    }
    that.insert = insert;

    /*function called when this track is moved and inserted next to another track
    * @ param prTrack is previous track within calling class
    * @ param prTitle is previous title within calling class 
    * @ param pos is array position within calling class
    */
    function insertHelper(pos) {
        var scrollTop = $('#trackTitleWrapper').scrollTop();
        that.detach();
        var trackToMove = that.getStorageContainer();
        //dataHolder.removeTrack(that);
        dataHolder._trackArray.splice(that.getPos(), 1);
        dataHolder._trackArray.splice(pos, 0, that.getStorageContainer());
        updateTrackArray();
        //prevTrack = prTrack;
        //prevTitleDiv = prTitle;
        my.track.detach();
        reloadTrack();
        titlediv.css('top', '0px');
        my.track.css('display', '');
        $('#trackTitleWrapper').scrollTop(scrollTop);
        offset = 0;
        return false;
    }
    that.insertHelper = insertHelper;

    function debugTrackArray() {
        for (var i = 0; i < dataHolder._trackArray.length; i++) {
            console.log(i + " - " + dataHolder._trackArray[i].track.getTitle());
        }
    }

    function getTrackDomElement() {
        return my.track;
    }
    that.getTrackDomElement = getTrackDomElement;

    //restores track and title to original position after moving title
    function restoreMovedTrack() {
        titlediv.css("top", "0px");
        titlediv.css("left", "0px");
    }

    //reloads track after deletion for undo redo. Assumes track was removed first.
    //Also gets called every time a track is added??
    function reloadTrack() {
        //var t = $('.track').css('top');
        //titlediv.css('top', parseFloat(t) + 'px');
        //my.track.css('top', parseFloat(t) + 'px');
        if (arrayPos === 0) {
            my.timeline.prependAddToDom(my.track, titlediv);
        }
        else {
            var previousTrack = dataHolder._trackArray[arrayPos - 1].track;
            previousTrack.getTitleDiv().after(titlediv);
            previousTrack.getTrackDomElement().after(my.track);
            
            //prevTitleDiv.after(titlediv);
            //prevTrack.after(my.track);
        }
        //dataHolder._trackArray.splice(arrayPos, 0, that.getStorageContainer());
        //updateTrackArray();
        
        my.update();
        restoreHandlers();
        if (my.that.getType() === TAG.TourAuthoring.TrackType.ink && my.that.getInkEnabled(my.that)) {
            my.that.getInkLink(my.that).addAttachedInkTrack(my.that);
        }
    }
    that.reloadTrack = reloadTrack;

    function restoreHandlers() {
        var disps = dataHolder.getDisplays(arrayPos)
        if (disps && disps._root) {
            disps._root.traverse(function (disp) {
                disp._value.display.restoreHandlers();
                var keyfs = dataHolder.getKeyframes(disp._value);
                if (keyfs && keyfs._root) {
                    keyfs._root.traverse(function (keyf) {
                        keyf._value.restoreHandlers();
                    });
                }
            });
        }
    }

    that.restoreHandlers = restoreHandlers;

    // Interaction code

    // Track title manipulations
    TAG.Util.makeManipulatable(titlediv[0], {
        onManipulate: onManipTrackTitleWrapper,
        onTapped: tappedTitle,
        onTappedRight: tapRightTitle,
        onRelease: trackTitleReleased,
        onScroll: scrollTitleWrapper,
        onDoubleTapped: toggleMinimized,
    }, false, true);

    // handles long press on the title
    my.inRightTap = false;
    function tapRightTitle(evt) {
        my.inRightTap = true;
        menu.open(evt);
    }
    this.tapRightTitle = tapRightTitle;

    //handles events when track title is tapped
    function tappedTitle(evt) {
        if (eventsPaused || my.inRightTap)
            return;

        var currSelection = dataHolder.getSelectedTrack();
        if (currSelection === that) {
            setDeselected();
        }
        else {
            if (currSelection) {
                currSelection.setDeselected();
            }
            setSelected();
        }
    }
    that.tappedTitle = tappedTitle;

    //inits track title to be dragged
    var prevZIndex = 0;
    // handles the case when the track title wrapper is dragged, if titledivmanip is true, instead allows for div to be dragged
    var firstEvent = true;

    //variables used by the onManipTrackTitleWrapper class to keep track of the top, bottom and total movement along the y axis of the tracks
    var moveTop = 0;
    var moveBottom = 0;   
    var totalYMoved = 0;
    var offset = 0;
    var dir = 0;
    function scrollTitleWrapper(delta) {
        var close = my.timeline.getCloseMenu();
        if (close) {
            close();
        }
        
        if (delta === 1.1) {
            $('#trackTitleWrapper').scrollTop($('#trackTitleWrapper').scrollTop() - 30);
        } else {
            $('#trackTitleWrapper').scrollTop($('#trackTitleWrapper').scrollTop() + 30);
        }
    }

    var vertLock = false, sideLock = false, xMoved = 0, yMoved = 0, dragEvents = 0;
function trackTitleReleased(evt) {
        my.inRightTap = false;
        if (released) {     // stops double-triggering of release
            released = false;
            return;
        }
        released = true;
        titleDivMouseUp();
    }

    function onManipTrackTitleWrapper(res, evt) {
        var currSelection = dataHolder.getSelectedTrack();
        evt.stopPropagation();

        if (eventsPaused || my.inRightTap) {
            return;
        }
        released = false;

        if (currSelection) {
            currSelection.setDeselected();
        }
        setSelected();

        //checks if a track has been selected for manipulation/movement
        if (titleDivManip) {
            titleDivTranslateY(res);
        } else {
            if (firstEvent) {
                firstEvent = false;
            }
            //these two 'if' conditions determine how much a track needs to be pulled along the x axis for it to become maniputable 
            if (totalYMoved < 30 && Math.abs(res.translation.y) < Math.abs(res.translation.x) * 2) {
                titleDivTranslateX(res.translation.x);
            } else {
                titleDivTranslateX(200);
            }
            if (Math.abs(res.translation.y) > Math.abs(res.translation.x))
                totalYMoved = totalYMoved + Math.abs(res.translation.y);
            if (parseInt(titlediv.css('left'),10) < -20) { //used to be -10
                titleDivManip = true;
                offset = 0;
                titledivPlaceholder = $(document.createElement('div'));
                titledivPlaceholder.css({
                    "width": 0.127 * $(window).width() + 'px',
                    'margin-left': '20px',
                    height: titlediv.height() + 'px',
                    float: 'left',
                    border: '1px solid black',
                    'box-shadow': 'inset 4px -4px 8px #888',
                    position: 'absolute',
                    'z-index': 0,
                    background: 'rgb(219, 218, 199)',
                    top: titlediv.position().top + $('#trackTitleWrapper').scrollTop() + 'px',
                });
                titlediv.before(titledivPlaceholder);
                prevZIndex = titlediv.css('z-index');
                titlediv.css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex);
                titlediv.css('left', '-20px');
                moveTop = titlediv.offset().top;
                moveBottom = moveTop + TAG.TourAuthoring.Constants.trackHeight;
            }
            upAndDown(res);
        }
    }

    /**Moves title div in the vertical direction with cursor
     * @method titleDivTranslateY
     * @param res
     */
    function titleDivTranslateY(res) {
        var t = parseInt(titlediv.css('top'),10);
        var topp = t + res.translation.y;
        var tr = null;                                                      // keeps track of the div/track that needs to be moved when moving a selected track
        var index = 0;
        var oldScroll;
        var scroll;
        var trackArrayHeight = 0;
        var i;

        if (topp < t) {                                                     // Moving up
            moveUp();
        } else if (topp > t) {                                              // Moving down
            moveDown();
        } else {
            if (titlediv.position().top < 15) {
                oldScroll = $('#trackTitleWrapper').scrollTop();
                $('#trackTitleWrapper').scrollTop(oldScroll - 25);
                topp = topp - Math.min(10, oldScroll);
                moveUp();
            }
            if (titlediv.position().top + 2 +titlediv.height() > $('#trackScrollVeil').height() - 15) {
                oldScroll = $('#trackTitleWrapper').scrollTop();
                scroll = oldScroll + 25;
                for (i = 0; i < dataHolder._trackArray.length; i++) {
                    trackArrayHeight = trackArrayHeight + dataHolder._trackArray[i].track.getTitleDiv().height() + 2;
                }
                if (scroll > trackArrayHeight - $('#trackTitleWrapper').height()) scroll = trackArrayHeight - $('#trackTitleWrapper').height();
                $('#trackTitleWrapper').scrollTop(scroll);
                topp = topp + scroll - oldScroll;
                moveDown();
            }
        }
        titlediv.css('top', topp);

        /**Moves the title div up
         * @method moveUp
         */
        function moveUp() {
            var i = arrayPos + offset - 1;
            var nextTrack;
            var nextTitleDiv;

            if (i >= arrayPos) { i++; }
            if (i >= 0) {
                nextTrack = dataHolder._trackArray[i].track;
                nextTitleDiv = nextTrack.getTitleDiv();
                if (nextTitleDiv.position().top > titlediv.position().top) {
                    nextTitleDiv.css('top', parseFloat(nextTitleDiv.css('top')) + 2 + titlediv.height() + 'px');
                    titledivPlaceholder.css('top', parseFloat(titledivPlaceholder.css('top')) - 2 - nextTitleDiv.height() + 'px');
                    offset--;
                }
            }
        }

        /**Moves the title div down
         * @method moveDown
         */
        function moveDown() {
            var i = arrayPos + offset + 1;
            var nextTrack;
            var nextTitleDiv;

            if (i <= arrayPos) { i--; }
            if (i < dataHolder._trackArray.length) {
                nextTrack = dataHolder._trackArray[i].track;
                nextTitleDiv = nextTrack.getTitleDiv();
                if (nextTitleDiv.position().top < titlediv.position().top) {
                    titledivPlaceholder.css('top', parseFloat(titledivPlaceholder.css('top')) + 2 + nextTitleDiv.height() + 'px');
                    nextTitleDiv.css('top', parseFloat(nextTitleDiv.css('top')) - 2 - titledivPlaceholder.height() + 'px');
                    offset++;
                }
            }
        }
    }

    /**Moves title div in the horizontal direction
     * @method titleDivTranslateX
     * @param {Number} x
     */
    function titleDivTranslateX(x) {
        var l = parseInt(titlediv.css('left'),10);
        var left = Math.min(l + x, 0);
        titlediv.css('left', left);
    }

    /**Handles events when a selected track is released
     * @method titleDivMouseUp
     */
    function titleDivMouseUp() {
        var tr = dataHolder._trackArray[arrayPos + offset]
        if (!tr){
            return;
        }
        tr = tr.track;
        var prev;
        var command;
        totalYMoved = 0;
        $('.titlediv').css('top', '0px');
        $('.titlediv').css('left', '0px');
        if (titledivPlaceholder) {
            titledivPlaceholder.detach();
        }
        if (offset !== 0 && titleDivManip && tr) {
            if (that.getPos() > tr.getPos()) {                  // that is below tr
                prev = dataHolder._trackArray[that.getPos() - 1].track;
            } else if (that.getPos() < tr.getPos()) {           // that is above tr
                prev = dataHolder._trackArray[that.getPos() + 1].track;
            } else {
                prev = dataHolder._trackArray[that.getPos()].track;
            }
            command = TAG.TourAuthoring.Command({
                execute: function () { tr.insert(that); },
                unexecute: function () {
                    prev.insert(that);
                }
            });
            command.execute();
            my.undoManager.logCommand(command);
        }
        titlediv.css('z-index', prevZIndex);
        //firstBlock = true;
        titleDivManip = false;
        firstEvent = true;
    }
    var grTrack;
    // makes the track manipulatable 
    if (IS_WINDOWS) {
        grTrack = TAG.Util.makeManipulatable(my.track[0], {
            onManipulate: onManipTrack,
            onTappedRight: tapRight,
            onScroll: scrollTitle,
            onTapped: trackTapped,
            onDoubleTapped: doubleTapped,
            onRelease: function () {
                my.inRightTap = false;
                vertLock = false;
                sideLock = false;
                xMoved = 0;
                yMoved = 0;
                dragEvents = 0;
            }
        });
    } else {
        grTrack = TAG.Util.makeManipulatable(my.track[0], {
            onManipulate: onManipTrack,
            onTappedRight: tapRight,
            onScroll: scrollTitle,
            onTapped: trackTapped,
            onDoubleTapped: doubleTapped,
            onRelease: function () {
                my.inRightTap = false;
                vertLock = false;
                sideLock = false;
                xMoved = 0;
                yMoved = 0;
                dragEvents = 0;
            }
        });
    }

    function released(evt) {
        if (eventsPaused || isMinimized) {
            return;
        }

        my.inRightTap = false;

        if (that.getCurrentKeyframe() !== null) {
            that.getCurrentKeyframe().released(evt);
        } else if (that.getCurrentDisplay() !== null) {
            that.getCurrentDisplay().released(evt);
        } else {
            console.log("skipping release");



        }
    }

    function tapRight(evt) {
        if (eventsPaused || isMinimized) {
            return;
        }

        my.inRightTap = true;

        if (that.getCurrentKeyframe()) {
            that.getCurrentKeyframe().rightTapped(evt);
        }
        else if (that.getCurrentDisplay()) {
            that.getCurrentDisplay().rightTapped(evt);
        }
    }
    that.tapRight = tapRight;
    
    function doubleTapped(evt) {
        if (isMinimized) {
            return;
        }
        if (my.currentDisplay) {
            var loc = my.currentDisplay.getLoc();
            if (loc === TAG.TourAuthoring.DisplayParts['fade-out'] || loc === TAG.TourAuthoring.DisplayParts['fade-in']) {
                return;
            }
        }
        addKeyorDisplay(evt);
    }

    //track tapped
    var multiSelection;
    function trackTapped(evt) {
        // cancel tap event on right click or if track is minimized
        if (evt.button === 2 || evt.gesture.srcEvent.buttons === 2) {
            return;
        }
        vertLock = false;
        sideLock = false;
        xMoved = 0;
        yMoved = 0;
        dragEvents = 0;
        multiSelection = my.timeline.getMultiSelection();
        //if not in the multi selection mode and the selection array is not empty, clear the array by deselecting them
        if (!multiSelection) {
            var selectednumber = my.timeline.getMultiSelectionArray().length;
            if (!that.getCurrentDisplay() && selectednumber > 0) {
                for (var i = 0;  i<selectednumber;i++){
                    my.timeline.allDeselected();
                }
            }
            else if (that.getCurrentKeyframe()) {
                if (isMinimized) {
                    return;
                }
                that.getCurrentKeyframe().tapped(evt);
            }
        }
        else if (that.getCurrentDisplay()) {//if in the multi selection mode, and user clicks on a display
            if (my.timeline.getMultiSelectionArray().indexOf(that.getCurrentDisplay()) < 0) {//if it is not selected, have it selected
                setDisplaySelected(that.getCurrentDisplay());
            }
            else {//if it is selected, have it deselected
                setDisplayDeselected(that.getCurrentDisplay(), false);
            }
        }
        else if (my.currentKeyframe) {//if the user clicks on a keyframe, select/deselect the display that contains current keyframe
            if (isMinimized) {
                return;
            }
            if (my.timeline.getMultiSelectionArray().indexOf(my.currentKeyframe.getContainingDisplay())< 0) {
                setDisplaySelected(my.currentKeyframe.getContainingDisplay());
            }
            else {
                setDisplayDeselected(my.currentKeyframe.getContainingDisplay(),false);
            }
        }
    }

    /**Xiaoyi & Libby
    *set current display deselected when user clicks it again
    */
    function setDisplaySelected(currentDisplay) {
        //add selected display to the array, and change the filling color
        my.timeline.getMultiSelectionArray().push(currentDisplay);
        //change it to the selected colors according to their types
        //the grey color (selectedInkDisplayColor) is used on videos and inks
        if (currentDisplay.getType() === 4 || currentDisplay.getType() === 2) {
            currentDisplay.getMainD().css('background-color', TAG.TourAuthoring.Constants.selectedInkDisplayColor);
        } else {
            currentDisplay.getMainD().css('background-color', TAG.TourAuthoring.Constants.selectedDisplayColor);
        }
    }
    that.setDisplaySelected = setDisplaySelected;

    /**Xiaoyi & Libby
    *set the current display deselected
    *@param: currentDisplay: the display is been clicking on
    *@keepDisplays:if we want to keep the displays
    */
    function setDisplayDeselected(currentDisplay, keepDisplays) {
        //remove the display from the array
        if (!keepDisplays) {
            my.timeline.getMultiSelectionArray().splice(my.timeline.getMultiSelectionArray().indexOf(currentDisplay), 1);
        }

        var valuation = function (a) {
            return a.source;
        }
        //remove this display's boundaries from the binheaps
        dataHolder._leftExternal.remove(
            dataHolder._leftExternal.findValue(currentDisplay, valuation));
        dataHolder._leftInternal.remove(
           dataHolder._leftInternal.findValue(currentDisplay, valuation));
        dataHolder._rightExternal.remove(
           dataHolder._rightExternal.findValue(currentDisplay, valuation));
        dataHolder._rightInternal.remove(
           dataHolder._rightInternal.findValue(currentDisplay, valuation));

        //ink/video displays change back to gray, others to green
        if (currentDisplay.getType() === 4 || currentDisplay.getType() === 2) {
            currentDisplay.getMainD().css('background-color', TAG.TourAuthoring.Constants.inkDisplayColor);
        } else if (currentDisplay.getType() === 1) {
            currentDisplay.getMainD().css('background-color', 'rgba(129, 173, 98, 0.8)');
        } else {
            currentDisplay.getMainD().css('background-color', TAG.TourAuthoring.Constants.displayColor);
        }
    }
    that.setDisplayDeselected = setDisplayDeselected;

    /**
     * Handles drag on track
     * Pan timeline view
     * If a display or keyframe is selected, move that
     */
    function onManipTrack(res, evt) {
        var i, leftbound, rightbound, keydisplay, allKeys;
        if (eventsPaused || my.inRightTap) {
            evt.stopImmediatePropagation();
            return;
        }
        // move display
        if (my.currentDisplay) {
            // hacky fix to keep handles minimized
            my.currentDisplay.suppressHandles();
            if (evt)
                evt.stopPropagation();
            if (vertLock || (!sideLock &&
                dragEvents > 3 && 
                Math.abs(yMoved) > Math.abs(xMoved))) {
                vertLock = true;
                upAndDown(res);
                return;
            } else if (dragEvents > 3) {
                sideLock = true;
            } else {
                xMoved += res.translation.x;
                yMoved += res.translation.y;
                dragEvents++;
                return;
            }
            // update bounds if no multi-select
            if (my.timeline.getMultiSelectionArray().length === 0) {
                leftbound = my.timeManager.getDuration().start;
                rightbound = my.timeManager.getDuration().end;
                var displays = that.getStorageContainer().displays.getContents();
                for (i = 0; i < displays.length; i++) {
                    // update bounds once current display is located in array
                    if (displays[i].display === my.currentDisplay) {
                        if ((i - 1) >= 0) {
                            leftbound = displays[i - 1].display.getEnd() + TAG.TourAuthoring.Constants.esOffset;
                        }
                        if ((i + 1) < displays.length) {
                            rightbound = displays[i + 1].display.getStart() - TAG.TourAuthoring.Constants.esOffset;
                        }
                    }
                } 
                my.currentDisplay.move(res, leftbound, rightbound);
            }
            else {//Xiaoyi/Libby
                //move all selected tracks
                if (my.timeline.getMultiSelectionArray().indexOf(my.currentDisplay) >= 0) {
                    my.timeline.moveSelect(res, my.currentDisplay);
                }
            }
        }
    
        // move keyframe
        else if (my.currentKeyframe) {
            if (isMinimized) {
                return;
            }
            if (evt)
                evt.stopPropagation();

            // Note that the bounds for the keyframe are just the beginning and end of the containing display
            keydisplay = my.currentKeyframe.getContainingDisplay();
            //allKeys = keydisplay.getStorageContainer().keyframes;
            // get bounds
            leftbound = keydisplay.getStart();
            rightbound = keydisplay.getEnd();
            //for (i = 0; i < allKeys.length; i++) {
            //    // update bounds once current keyframe is located in array
            //    if (allKeys[i] === my.currentKeyframe) {
            //        if ((i - 1) >= 0) {
            //            //if (allKeys[i - 1].getTime() + my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize) > allKeys[i].getTime() - my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize)) {
            //            //    leftbound = allKeys[i].getTime();
            //            //}
            //            //else {
            //                leftbound = allKeys[i - 1].getTime() + TAG.TourAuthoring.Constants.esOffset;
            //            //}
            //        }
            //        if ((i + 1) < allKeys.length) {
            //            //if (allKeys[i + 1].getTime() - my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize) < allKeys[i].getTime() + my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize)) {
            //            //    rightbound = allKeys[i].getTime();
            //            //}
            //            //else {
            //                rightbound = allKeys[i + 1].getTime() - TAG.TourAuthoring.Constants.esOffset;
            //            //}
            //        }
            //    }
            //}
            var prevKF = dataHolder.findPrevKeyframe(keydisplay, my.currentKeyframe),
                nextKF = dataHolder.findNextKeyframe(keydisplay, my.currentKeyframe);
            if (prevKF) {
                leftbound = prevKF.getTime() + TAG.TourAuthoring.Constants.esOffset;
            }
            if (nextKF) {
                rightbound = nextKF.getTime() - TAG.TourAuthoring.Constants.esOffset;
            }

            if (!my.timeline.getMultiSelection()) {
                my.currentKeyframe.move(res, leftbound, rightbound);
            }
        }
    }
    that.onManipTrack = onManipTrack;

    /*Xiaoyi & Libby
    *helper function returning the left/right bounds of the track during multi-select
    * @param currDisplay: display that the bounds are being found for
    * @returns the bound for each display separately that are multi-selected
    */
    function boundHelper(currDisplay, hasZeroFadeout) { // deal with fixing bounds for ink dragging here
        /**REWRITTEN TO HANDLE MINHEAPS**/
        var leftbound = my.timeManager.getDuration().start,
            rightbound = my.timeManager.getDuration().end,
            currkeyframes = currDisplay.getStorageContainer().keyframes, //now handles minheap
            //this is the internal right bound for the fade in
            //it is calculated by taking the smallest time when comparing the time at which the fadeout begins and the start time of the first keyframe (if any)
            fadeInRight = Math.min(currDisplay.getOutStart() - currDisplay.getFadeIn(),
                                        ((!currkeyframes.isEmpty() && (currkeyframes.min().getTime() - my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize + TAG.TourAuthoring.Constants.keyframeStrokeW + TAG.TourAuthoring.Constants.fadeBtnSize))) || Infinity)),
            //this is the internal left bound for the fade out
            //it is calculated by taking the largest time when comparing the time at which the fadein ends and the start time of the last keyframe (if any)
            fadeOutLeft = Math.max(currDisplay.getStart() + currDisplay.getFadeIn(),
                             ((!currkeyframes.isEmpty() && (currkeyframes.max().getTime() - currDisplay.getFadeOut() + my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize + TAG.TourAuthoring.Constants.keyframeStrokeW + TAG.TourAuthoring.Constants.fadeBtnSize))) || -Infinity)),
            currLeft = currDisplay.getStart(),
            loc = currDisplay.getLoc();
        var currRight = currDisplay.getEnd();
        
        //if the display the user is dragging has zero fadeout, update the currRight (for some reason, currDisplay.getEnd() doesn't work)
        if (hasZeroFadeout) {
            currRight = currDisplay.getOutStart();
        }

        //in the case where both the fadein and fadeout are both (such as with audio tracks), then the fadeinright and the fadeoutleft need to be calculated using either the first/last keyframe 
        //position or the edge of the fadein/fadeout handle, which prevents the display from being compressed so far that it is just a handle with no display at all
        if (currDisplay.getFadeIn() === 0 || currDisplay.getFadeOut() === 0) {
            fadeInRight = Math.min(my.timeManager.pxToTime(currDisplay.getFioHandle().attr('cx') - 2 * TAG.TourAuthoring.Constants.fadeBtnSize),
                                            ((!currkeyframes.isEmpty() && (currkeyframes.min().getTime() - my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize + TAG.TourAuthoring.Constants.keyframeStrokeW + TAG.TourAuthoring.Constants.fadeBtnSize))) || Infinity));
            fadeOutLeft = Math.max(my.timeManager.pxToTime(currDisplay.getFinHandle().attr('cx')) + my.timeManager.pxToTime(2 * TAG.TourAuthoring.Constants.fadeBtnSize),
                ((!currkeyframes.isEmpty() && (currkeyframes.max().getTime() - currDisplay.getFadeOut() + my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize + TAG.TourAuthoring.Constants.keyframeStrokeW + TAG.TourAuthoring.Constants.fadeBtnSize))) || -Infinity));
        }
        var boundArray = [];
        if (fadeInRight < currDisplay.getStart()) {
            fadeInRight = currDisplay.getStart();
        }
        if (fadeOutLeft > currDisplay.getOutStart()) {
            fadeOutLeft = currDisplay.getOutStart();
        }

        //use data holder to acquire this, reduces for loops being needed
        var prevDisp = dataHolder.findPreviousDisplay(arrayPos, currDisplay);
        var nextDisp = dataHolder.findNextDisplay(arrayPos, currDisplay);

        //if dragging the main section of the display
        var parentArtDisplay;
        if (loc === TAG.TourAuthoring.DisplayParts.main) {
            //for (var i = 0; i < my.displays.length; i++) {
            //    // update bounds once current display is located in array
            //    if (my.displays[i] === currDisplay) {
            //        if ((i - 1) >= 0 && my.timeline.getMultiSelectionArray().indexOf(my.displays[i - 1]) < 0) {
            //            leftbound = my.displays[i - 1].getEnd() + TAG.TourAuthoring.Constants.esOffset;
            //        }
            //        if ((i + 1) < my.displays.length && my.timeline.getMultiSelectionArray().indexOf(my.displays[i + 1]) < 0) {
            //            rightbound = my.displays[i + 1].getStart() - TAG.TourAuthoring.Constants.esOffset;//my.displays[i + 1] === dataHolder.findNextDisplay(arrayPos, currDisplay)
            //        }
            //        if (my.type === TAG.TourAuthoring.TrackType.ink && my.
            //) {
            //            parentArtDisplay = getParentArtDisplay(my.displays[i]);
            //            if (my.timeline.getMultiSelectionArray().indexOf(parentArtDisplay) === -1) {
            //                leftbound = Math.max(leftbound, parentArtDisplay.getStart());
            //                rightbound = Math.min(rightbound, parentArtDisplay.getEnd());
            //            }
            //        }
            //    }
            //}

            //instead of looping through the array we can use the dataholder to find the previous/next displays
            if (prevDisp && my.timeline.getMultiSelectionArray().indexOf(prevDisp.display) < 0) {
                leftbound = prevDisp.display.getEnd() + TAG.TourAuthoring.Constants.esOffset;
            }
            if (nextDisp && my.timeline.getMultiSelectionArray().indexOf(nextDisp.display) < 0) {
                rightbound = nextDisp.display.getStart() - TAG.TourAuthoring.Constants.esOffset;
            }
            if (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled) {
                parentArtDisplay = currDisplay.getParentDisplay();
                if (my.timeline.getMultiSelectionArray().indexOf(parentArtDisplay) === -1) {
                    leftbound = Math.max(leftbound, parentArtDisplay.getStart());
                    rightbound = Math.min(rightbound, parentArtDisplay.getEnd());
                }
            }

        } //if dragging the fadein/fadeout sections of the display
        else if (loc === TAG.TourAuthoring.DisplayParts['fade-out'] || loc === TAG.TourAuthoring.DisplayParts['fade-in']) {
            //for (var j = 0; j < my.displays.length; j++) {
            //    // update bounds once current display is located in array
            //    if (my.displays[j] === currDisplay) {
            //        if ((j - 1) >= 0) {
            //            leftbound = my.displays[j - 1].getEnd() + TAG.TourAuthoring.Constants.esOffset;
            //        }
            //        if ((j + 1) < my.displays.length) {
            //            rightbound = my.displays[j + 1].getStart() - TAG.TourAuthoring.Constants.esOffset;
            //        }
            //        if (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled) {
            //            parentArtDisplay = getParentArtDisplay(my.displays[j]);
            //            if (my.timeline.getMultiSelectionArray().indexOf(parentArtDisplay) === -1) {
            //                leftbound = Math.max(leftbound, parentArtDisplay.getStart());
            //                rightbound = Math.min(rightbound, parentArtDisplay.getEnd());
            //            }
            //        }
            //        else if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image || !my.inkEnabled) {
            //            var attachedDisplays = my.displays[j].getChildDisplays();
            //            var totalDispLength = my.displays[j].getLongestSubgroup(attachedDisplays);
            //            fadeOutLeft = Math.max(fadeOutLeft, my.displays[j].getStart() + totalDispLength);
            //            fadeInRight = Math.min(fadeInRight, my.displays[j].getEnd() - totalDispLength);
            //        }
            //        if (my.type === TAG.TourAuthoring.TrackType.video || my.type === TAG.TourAuthoring.TrackType.audio) {
            //            if (my.displays[j].getMediaLength()) {
            //                var maxlength = parseFloat(currDisplay.getMediaLength());
            //                leftbound = Math.max(leftbound, currDisplay.getEnd() - maxlength);
            //                rightbound = Math.min(rightbound, currDisplay.getStart() + maxlength);
            //            }
            //        }
            //    }
            //}

            //instead of looping through the array we can use the dataholder to find the previous/next displays
            if (prevDisp) {
                leftbound = prevDisp.display.getEnd() + TAG.TourAuthoring.Constants.esOffset;
            }
            if (nextDisp) {
                rightbound = nextDisp.display.getStart() - TAG.TourAuthoring.Constants.esOffset;
            }
            if (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled) {
                parentArtDisplay = getParentArtDisplay(currDisplay);
                if (my.timeline.getMultiSelectionArray().indexOf(parentArtDisplay) === -1) {
                    leftbound = Math.max(leftbound, parentArtDisplay.getStart());
                    rightbound = Math.min(rightbound, parentArtDisplay.getEnd());
                }
            }
            else if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image || !my.inkEnabled) {
                var attachedDisplays = currDisplay.getChildDisplays();
                var totalDispLength = currDisplay.getLongestSubgroup(attachedDisplays);
                fadeOutLeft = Math.max(fadeOutLeft, currDisplay.getStart() + totalDispLength);
                fadeInRight = Math.min(fadeInRight, currDisplay.getEnd() - totalDispLength);
            }
            if (my.type === TAG.TourAuthoring.TrackType.video || my.type === TAG.TourAuthoring.TrackType.audio) {
                if (currDisplay.getMediaLength()) {
                    var maxlength = parseFloat(currDisplay.getMediaLength());
                    leftbound = Math.max(leftbound, currDisplay.getEnd() - maxlength);
                    rightbound = Math.min(rightbound, currDisplay.getStart() + maxlength);
                }
            }
        }
       
        //boundArray[0] = currLeft - leftbound;//fadeinleft distance (in seconds)
        //boundArray[1] = rightbound - currRight;//fadeoutright distance (in seconds)
        //boundArray[2] = fadeInRight - currLeft;//fadeinright distance (in seconds)
        //boundArray[3] = currRight - currDisplay.getFadeOut() - fadeOutLeft;//fadeoutleft distance (in seconds)
        //return boundArray;
        
        //don't need boundArray anymore, using binheaps
        var leftExtBound = {
            bound: currLeft - leftbound, //distance in seconds
            source: currDisplay,
        }
        var leftIntBound = {
            bound: fadeInRight - currLeft, //distance in seconds
            source: currDisplay,
        }
        var rightExtBound = {
            bound: rightbound - currRight, //distance in seconds
            source: currDisplay,
        }
        var rightIntBound = {
            bound: currRight - currDisplay.getFadeOut() - fadeOutLeft, //distance in seconds
            source: currDisplay,
        }
        //push all bounds to respective heaps
        dataHolder._leftExternal.push(leftExtBound);
        dataHolder._leftInternal.push(leftIntBound);
        dataHolder._rightExternal.push(rightExtBound);
        dataHolder._rightInternal.push(rightIntBound);

    }
    that.boundHelper = boundHelper;


    /**
     * Gets the art display enclosing an attached ink track display.
     */
    function getParentArtDisplay(disp) {
        //var parentArtTrack = my.experienceId,
        //    parentDisplays = parentArtTrack.getDisplays(),
        //    parentArtDisplay = null;
        //for (var i = 0; i < parentDisplays.length; i++) {
        //    var currDisp = parentDisplays[i];
        //    if ((currDisp.getStart() <= disp.getOutStart()) && (disp.getOutStart() <= currDisp.getOutStart() + currDisp.getFadeOut())) { // use outStart to test if display is in the art display
        //        parentArtDisplay = currDisp;
        //        break;
        //    }
        //}
        //return parentArtDisplay;
        return disp.getParentDisplay();
    }
    function scale() {
        var displays = that.getStorageContainer().displays.getContents(); //array of displays, from tree of displays
        var i;
        for (i = 0; i < displays.length; i++) {
            displays[i].display.scale();
        }
    }
    that.scale = scale;
    my.timeManager.onSizing(scale);

    /**
     * helper function that loops through the array of displays 
     * returns the start of a display if there's a display nearby
     * returns 1 fadein, 0 fadeout and -1 otherwise
     * @ param  currentDisplayPosition is the position of the current display
     * @ param displays is an array of displays
     */
    function findDisplay(currentDisplayPosition, displays) {
        var i = 0;
        while (i < displays.length) {
            if (Math.abs(displays[i].getEnd() - currentDisplayPosition) <= 0.5 && displays[i].getEnd() !== currentDisplayPosition) {
                return displays[i].getEnd();
            }
            if (Math.abs(displays[i].getStart() - currentDisplayPosition) <= 0.5 && displays[i].getStart() !== currentDisplayPosition) {
                return displays[i].getStart();
            }
            i++;
        }
        return -1;
    }

    /**
     * helper function for finding a certain track using it's id
     * param trackNum - the track's id
     * returns the track
     */
    function getTrackByID(trackNum) {
        var tracks = my.timeline.getTracks();
        var i;
        for (i = 0; i < tracks.length; i++) {
            if (trackNum === parseInt(tracks[i].getID(),10)) {
                return tracks[i];
            }
        }
        return null;
    }

    /**
     * moves the track and the left and right
     */
    function leftAndRight(res, isRuler) {
        if (!trackBody)
            trackBody = my.timeline.getTrackBody();
        trackBody.scrollLeft(trackBody.scrollLeft() - res.translation.x);
    }
    that.leftAndRight = leftAndRight;

    /**
     * moves the track up and down
     */

    function upAndDown(res) {
        if (!trackBody)
            trackBody = $('#trackBody');
        trackBody.scrollTop(trackBody.scrollTop() - res.translation.y);
    }
    that.upAndDown = upAndDown;

    //scrolling function similar to upanddown
    //hacky fix, needs to be reworked like the entire class

    function scrollTitle(evt) {
        var close = my.timeline.getCloseMenu();
        if (close) {
            close();
        }

        if (!trackBody)
            trackBody = my.timeline.getTrackBody();
        var t = trackBody.scrollTop();
        //check if scrolling up or down
        var topp;
        if (evt === 1.1) { //scrolling up
            topp = t - 30;
        }
        else { //scrolling down
            topp = t + 30;
        }
        trackBody.scrollTop(topp);
    }


     //adds a key frame or display    
    function addKeyorDisplay(evt) {
        var positionX = evt.position.x,
            newTime = my.timeManager.pxToTime(positionX),
            positionY = evt.position.y,
            enoughSpace = true,
            displayLength = 5, // assumes display length to be 5 seconds
            i, keyframe, newDisplay,
            currDisplay, artDisplay,
            fromEnd;

        // double-click snap toggle bypass code goes here


        if (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled) {
            var artDisplays = getInkLink().getStorageContainer().displays.getContents();
            var indisp = false;
            var artDisplays = getInkLink().getStorageContainer().displays.nearestNeighbors(newTime);
            for (i = 0; i < artDisplays.length; i++) { //will only be up to 2 elements in artDisplays -- the 2 closest ones
                if (artDisplays[i] && newTime <= artDisplays[i].display.getEnd() && newTime >= artDisplays[i].display.getStart()){//check to make sure display is not null
                    indisp = true;
                    artDisplay = artDisplays[i].display;
                    break;
                }
            }
        }
        if (indisp === false) {
            // TO-DO put in a warning here that the user should create the track over an artwork/image display
            return;
        }
        // Add display - MODIFY TO CHECK DATAHOLDER
        if (!my.currentDisplay) {
            // check if current display is going to conflict with other displays
            var minSpace = Infinity;
            var displays = that.getStorageContainer().displays.getContents();
            for (i = 0; i < displays.length; i++) {
                currDisplay = displays[i].display;

                // if newtime is after display we don't care
                if (newTime <= currDisplay.getEnd()) {
                    // check if tap location is on display
                    
                    if (newTime >= currDisplay.getStart()) {
                        enoughSpace = false;
                        break; // short circuit
                    }
                    // check if newTime is w/i displayLength seconds of start of current display
                    else if (newTime + displayLength >= currDisplay.getStart()) {
                        displayLength = currDisplay.getStart() - newTime - TAG.TourAuthoring.Constants.esOffset;
                    }
                    minSpace = Math.min(minSpace, currDisplay.getStart() - newTime);
                }
            }
            var fromEnd = my.timeManager.getDuration().end - newTime;
            if (enoughSpace) {
                my.timeline.allDeselected();
                //if (artDisplay.getEnd() - newTime >= 0.5) {
                    if (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled) {
                        newDisplay = addDisplay(positionX, Math.min(displayLength, artDisplay.getEnd() - newTime));
                        newDisplay.setParentDisplay(artDisplay);
                        artDisplay.addChildDisplay(newDisplay);
                        if (artDisplay.getEnd() - newTime < 1.5 || minSpace < 1.5) { // if less than 1.5 seconds available...
                            var smallestSpace = Math.min(minSpace, artDisplay.getEnd() - newTime);
                            newDisplay.setIn(0);
                            newDisplay.setOut(0);
                            newDisplay.setMain(smallestSpace);
                        }
                    }
                    else {
                        var smallestSpace = Math.min(displayLength, fromEnd);
                        newDisplay = addDisplay(positionX, smallestSpace);
                        if (fromEnd < 1.5) {
                            newDisplay.setIn(0);
                            newDisplay.setOut(0);
                            newDisplay.setMain(smallestSpace);
                        }
                    }
                //}
            }
        }

        // Add keyframe
        else if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.audio || my.type === TAG.TourAuthoring.TrackType.image) {

            // enabled and disabled via custom event framework - see Viewer's event listener for playerReady event
            if (my.timeline.getViewer().isKeyframingDisabled()) {
                return;
            }

            // check to make sure we are adding keyframe to valid position
            if (newTime >= my.currentDisplay.getStart() && newTime <= my.currentDisplay.getEnd()) {
                // seek before creating new keyframe to unload and update with currently selected keyframe
                if (my.type !== TAG.TourAuthoring.TrackType.audio) {
                    my.timeManager.seek(newTime);
                }

                keyframe = my.currentDisplay.addKeyframe(positionX, positionY, true);
                
                if (keyframe) {
                    my.timeline.allDeselected();
                    if (my.type == TAG.TourAuthoring.TrackType.audio) {
                        my.allKeyframes.push(keyframe);
                        that.drawLines();
                        //my.update();
                    }
                    else { // initialize keyframe and select it for further movements
                        keyframe.loadRIN(my.timeline.captureKeyframe(my.title)); // send in my.title to specify which keyframe should be captured (works for images and artworks)
                        keyframe.setSelected(true); // delay logging of edits
                        my.dirtyKeyframe = true; // dirty b/c it's new
                        //TAG.Util.makeManipulatable
                    }
                    my.update();
                }
            }
        } 
    }

    function captureHandler(evt) {
        captureTween(evt);
        my.update();
    }
    that.captureHandler = captureHandler;

    function captureTween(evt) {
        var origin = evt.eventSource.ITE_track;
        var time = origin.timeManager.elapsedOffset;

        // enabled and disabled via custom event framework - see Viewer's event listener for playerReady event
        if (my.timeline.getViewer().isKeyframingDisabled()) {
            return;
        }

        if (my.type === TAG.TourAuthoring.TrackType.ink || my.type === TAG.TourAuthoring.TrackType.video) {
            return;
        }

        var currentDisplay;

        // find containing display
        var minSpace = Infinity;
        var displays = that.getStorageContainer().displays.getContents();
        for (i = 0; i < displays.length; i++) {
            var disp = displays[i].display;

            // displays are ordered so just iterate and find first where time < last keyframe in display
            if (time <= disp.getEnd()) {
                currentDisplay = disp;
                break;
            }
        }

        // check to make sure we are adding keyframe to valid position, i.e. not in a fade
        if (currentDisplay && time >= currentDisplay.getStart() && time <= currentDisplay.getEnd()) {
            var time_px = my.timeManager.timeToPx(time);
            keyframe = currentDisplay.addKeyframe(time_px, 48, true);

            var time_2dec = Math.twoDecPlaces(time);

            // check that you are not making a keyframe right on top of another
            var neighbors = currentDisplay.getKeyframes().nearestNeighbors(time_2dec, 1);
            if (neighbors[0] && (Math.abs(neighbors[0].getTime() - time_2dec) < 0.05)) {
                if (neighbors[1] && (Math.abs(neighbors[1].getTime() - time_2dec) < 0.05)) {
                    keyframe = (Math.abs(neighbors[0].getTime() - time_2dec) - Math.abs(neighbors[1].getTime() - time_2dec) > 0) ? neighbors[1] : neighbors[0];
                } else {
                    keyframe = neighbors[0];
                }
            } else if (neighbors[1] && (Math.abs(neighbors[1].getTime() - time_2dec) < 0.05)) {
                keyframe = neighbors[1];
            }

            if (keyframe) {
                my.timeline.allDeselected();
                if (my.type == TAG.TourAuthoring.TrackType.audio) {
                    my.allKeyframes.push(keyframe);
                    that.drawLines();
                }
                else { // initialize keyframe and select it for further movements
                    keyframe.loadRIN(my.timeline.captureKeyframe(my.title)); // send in my.title to specify which keyframe should be captured (works for images and artworks)
                    keyframe.setSelected(true); // delay logging of edits
                    my.dirtyKeyframe = true; // dirty b/c it's new
                }
                //my.update();
            }
            //else {
            //    var time_2dec = Math.twoDecPlaces(time);

            //    // check that you are not making a keyframe right on top of another
            //    var neighbors = currentDisplay.getKeyframes().nearestNeighbors(time_2dec, 1);
            //    if (neighbors[0] && (Math.abs(neighbors[0].getTime() - time_2dec) < 0.05)) {
            //        if (neighbors[1] && (Math.abs(neighbors[1].getTime() - time_2dec) < 0.05)) {
            //            keyframe = (Math.abs(neighbors[0].getTime() - time_2dec) - Math.abs(neighbors[1].getTime() - time_2dec) > 0) ? neighbors[1] : neighbors[0];
            //        } else {
            //            keyframe = neighbors[0];
            //        }
            //    } else if (neighbors[1] && (Math.abs(neighbors[1].getTime() - time_2dec) < 0.05)) {
            //        keyframe = neighbors[1];
            //    }

            //    my.timeline.allDeselected();
            //    if (my.type == TAG.TourAuthoring.TrackType.audio) {
            //        my.allKeyframes.push(keyframe);
            //        that.drawLines();
            //    }
            //    else { // initialize keyframe and select it for further movements
            //        keyframe.loadRIN(my.timeline.captureKeyframe(my.title)); // send in my.title to specify which keyframe should be captured (works for images and artworks)
            //        keyframe.setSelected(true); // delay logging of edits
            //        my.dirtyKeyframe = true; // dirty b/c it's new
            //    }
            //}
        }
    }
    that.captureTween = captureTween;

    // canvas-drag-end handler
    function captureFinishedHandler(evt) {
        captureHandler(evt);

        var doCapture = function () {
            captureHandler(evt);
        }

        setTimeout(doCapture, 500);

        my.update();
    }
    that.captureFinishedHandler = captureFinishedHandler;

    //Deselects any active keyframes
    function deselectKeyframe() {
        if (my.selectedKeyframe) my.selectedKeyframe.setDeselected();
        my.dirtyKeyframe = false;
    }
    that.deselectKeyframe = deselectKeyframe;

    /**
    * Because loadRIN calls display.addKeyframe directly,
    * we need to pass it back into the track's list of allKeyframes manually for lines to draw
    */
    function addKeyframeToLines(keyframe) {
        my.allKeyframes.push(keyframe);
        that.drawLines();
    }
    that.addKeyframeToLines = addKeyframeToLines;

    //Draw volume line for audio tracks
    function drawLines() {
        if (isMinimized) {
            return;
        }
        if (my.type === TAG.TourAuthoring.TrackType.audio) {
            var keyframes = my.allKeyframes, end = keyframes.length-1;
            keyframes.sort(function (a, b) {
                if (a.isRemoved())
                    return 1;
                else if (b.isRemoved())
                    return -1;
                else
                    return a.getTime() - b.getTime();
            });

            while (end > 0 && keyframes[end].isRemoved()) {
                end--;
            }

            var lines = my.svgLines.selectAll('#keyframeLines');
            lines.remove();

            mygroup = my.svgLines.append("svg:g")
                .attr("id", "keyframeLines");

            var color = "green";
            var myLine;
            if (keyframes.length > 0) {
                myLine = mygroup.append("svg:line")
                    .attr("x1", 0)
                    .attr("y1", keyframes[0].getVolumePx())
                    .attr("x2", my.timeManager.timeToPx(keyframes[0].getTime()))
                    .attr("y2", keyframes[0].getVolumePx())
                    .style('pointer-events', 'none')
                    .style("stroke", color)
                    .style("stroke-width", 4);

                for (var counter = 0; counter < end; counter++) {
                    myLine = mygroup.append("svg:line")
                    .attr("x1", my.timeManager.timeToPx(keyframes[counter].getTime()))
                    .attr("y1", keyframes[counter].getVolumePx())
                    .attr("x2", my.timeManager.timeToPx(keyframes[counter + 1].getTime()))
                    .attr("y2", keyframes[counter + 1].getVolumePx())
                    .style('pointer-events', 'none')
                    .style("stroke", color)
                    .style("stroke-width", 4);
                }

                myLine = mygroup.append("svg:line")
                    .attr("x1", my.timeManager.timeToPx(keyframes[end].getTime()))
                    .attr("y1", keyframes[end].getVolumePx())
                    .attr("x2", '100%')
                    .attr("y2", keyframes[end].getVolumePx())
                    .style('pointer-events', 'none')
                    .style("stroke", color)
                    .style("stroke-width", 4);
            }
            else {
                myLine = mygroup.append("svg:line")
                    .attr("x1", 0)
                    .attr("y1", (100 - TAG.TourAuthoring.Constants.defaultVolume * 100) + "%")
                    .attr("x2", '100%')
                    .attr("y2", (100 - TAG.TourAuthoring.Constants.defaultVolume * 100) + "%")
                    .style('pointer-events', 'none')
                    .style("stroke", color)
                    .style("stroke-width", 4);
            }
        }
    }
    that.drawLines = drawLines;

    // Methods to add outline and track HTML to DOM
    // Expects to be passed containers as JQuery object

    /**
     * @param domElems  Object w/ two properties: 'title', the title container, and 'track', the track container
     */
    function addAllToDOM (domElems) {
        domElems.title.append(titlediv);
        domElems.track.append(my.track);
    }
    that.addAllToDOM = addAllToDOM;

    function prependAllToDOM(domElems) {
        domElems.title.prepend(titlediv);
        domElems.track.prepend(my.track);
    }
    that.prependAllToDOM = prependAllToDOM;



    /**Adds an identifying icon to the track div
    * @method addIconToTitle
    * @param {Type} type       type of track
    */
    function addIconToTitle(type) {
        var iconPath;
        var iconImg;
        iconDiv.attr('id', 'icon');
        iconDiv.css({
            "bottom": "3px", "position": "absolute", "right": "8px",
            "width": "30px", "height": '30px',
        });
        switch (type) {
            case TAG.TourAuthoring.TrackType.audio:
                iconPath = tagPath + 'images/icons/audio_icon_2.svg';
                break;
            case TAG.TourAuthoring.TrackType.video:
                iconPath = tagPath + 'images/icons/video_icon_2.svg';
                break;
            case TAG.TourAuthoring.TrackType.artwork:
                iconPath = tagPath + 'images/icons/image_icon_2.svg';
                break;
            case TAG.TourAuthoring.TrackType.ink:
                iconPath = tagPath + 'images/icons/text_icon_2.svg';
                break;
            case TAG.TourAuthoring.TrackType.image:
                iconPath = tagPath + 'images/icons/image_icon_2.svg';
                break;
        }
        iconImg = $(document.createElement('img'));
        iconImg.attr({
            'src': iconPath,
            'height': '30px',
            'width': '30px'
        });
        iconDiv.append(iconImg);
        titlediv.append(iconDiv);
    }



    function addInkTypeToTitle(type) {

        var inkType = $(document.createElement('div'));
        inkType.attr('id', 'inkType');
        inkType.css({
            "top": "48px", "position": "absolute", "left" : "5px",
            "font-size": "1em", "color": "white", "width":"80%", "height" : '20px',
        });
        //parse

        if (type === "trans") {

            //old_datastring.split("[mode]")[1].split("[")[0];
            var transType =  that.getInkPath().split("[mode]")[1].split("[")[0];

            if (transType === "block") {
                inkType.text("Block");
            }
            else {
                inkType.text("Isolate");
            }
        }
        else if (type == "text") {
            inkType.text("Text");
        }
        else if (type == "path" || type=="bezier") {
            inkType.text("Draw");
        }
        //inkType.text(type);
        


        titlediv.append(inkType);
    }
    that.addInkTypeToTitle = addInkTypeToTitle;

    // Add only title
    function addTitleToDOM(container) {
        if (arrayPos > 0) {
            container.children().eq(arrayPos - 1).after(titlediv);
        } else {
            container.prepend(titlediv);
        }
        prevTitleDiv = titlediv.prev(".titlediv");
    }
    that.addTitleToDOM = addTitleToDOM;

    // Add only track
    function addEditorToDOM(container) {
        if (arrayPos > 0) {
            container.children().eq(arrayPos - 1).after(my.track);
        } else {
            container.prepend(my.track);
        }
        //prevTrack = my.track.prev(".track");
    }
    that.addEditorToDOM = addEditorToDOM;

    function remove() {
        dataHolder.removeTrack(that);
        titlediv.remove();
        my.track.remove();
    }
    that.remove = remove;

    function detach() {
        //dataHolder.removeTrack(that);
        titlediv.detach();
        my.track.detach();
    }
    that.detach = detach;

    // DISPLAY WORK
   
    var displayCount = 0; // used for ids
    my.currentDisplay = null; // Manipulation handling
    my.currentKeyframe = null;

    /**
     * Public fn for adding visibility to track
     * @param x         x value (px) for display
     * @param length    length of display in seconds (set to 5 if not given) (only used in testing)
     * @returns     command for adding/undoing addition
     */
    function addDisplay(x, length) {
        //x = (my.timeManager.pxToTime(x) < 0.5) ? 0 : x - my.timeManager.timeToPx(0.5); //should use a constant for fade-in length rather than .5
        var index, i, parentDisplays, parentDisp,
            newDisplay = TAG.TourAuthoring.Display({
                start: my.timeManager.pxToTime(x),
                length: length,
                dataHolder: dataHolder,
                canKeyframe: (my.type !== TAG.TourAuthoring.TrackType.ink && my.type !== TAG.TourAuthoring.TrackType.video),
                canFade: (my.type !== TAG.TourAuthoring.TrackType.audio)
            }, my),

            command = TAG.TourAuthoring.Command({
                execute: function () {
                    //dataHolder.addDisplay(arrayPos, newDisplay);
                    newDisplay.reloadDisplay();
                    newDisplay.restoreHandlers();
                    my.update();
                },
                unexecute: function () {
                    newDisplay.removeDisplay(false);
                    my.update();
                }
            });
        dataHolder.addDisplay(arrayPos, newDisplay);
        //displayCount++;
        
        // update rest of displays
        //for (i = index+1; i < my.displays.length; i++) {
        //    my.displays[i].setID(i);
        //}
        my.update(true);
        my.undoManager.logCommand(command);
        return newDisplay; // for testing
    }
    that.addDisplay = addDisplay;

    //Function to remove display passed in as an argument.

    /**
     * Helper function for inserting display into array
     * Keeps displays sorted by start
     */
    function _displaycomp(a, b) {
        return a.getStart() > b.getStart();
    }
    that.displayComp = _displaycomp;

    /**
     * For testing purposes only!!!
     */
    function getDisplays() {
        return my.displays;
    }
    that.getDisplays = getDisplays;

    function clearDisplays() {
        //my.displays = [];
        that.getStorageContainer().displays.clear();
    }

    /**
     * Updates track w/ new keyframe data at current location
     * @param capture   keyframe data in RIN format
     * @param select    whether the keyframe receiving data should be selected
     */
    function receiveKeyframe(capture, select) {
        var i, display, keyframe, current = my.timeManager.getCurrentTime();
        var activeDisplay;// = that.getStorageContainer().displays.nearestNeighbors(current, 1)[0];
        if (my.selectedKeyframe || (activeDisplay = that.getStorageContainer().displays.nearestNeighbors(current, 1)[0])) {
            var activeKeyframe;
            if (my.selectedKeyframe) {
                activeKeyframe = my.selectedKeyframe;
            } else {
                activeKeyframe = activeDisplay.keyframes.nearestNeighbors(current, 1)[0];
            }
            if (activeKeyframe && ((Math.twoDecPlaces(activeKeyframe.getTime()) <= Math.twoDecPlaces(current + 0.05)) && (Math.twoDecPlaces(activeKeyframe.getTime()) >= Math.twoDecPlaces(current - 0.05))) && !activeKeyframe.removed) { // the current check fixes a bug
                activeKeyframe.loadRIN(capture);
                my.dirtyKeyframe = true;
                if (select && my.selectedKeyframe !== activeKeyframe) {
                    activeKeyframe.setSelected();
                }
            }
            else { // find active display and add keyframe to it
                if (!activeDisplay) {
                    activeDisplay = that.getStorageContainer().displays.nearestNeighbors(current, 1)[0];
                }
                if (activeDisplay) {
                    if (current >= activeDisplay.display.getStart() && current <= activeDisplay.display.getEnd()) {
                        keyframe = activeDisplay.display.addKeyframe(my.timeManager.timeToPx(current));
                        if (keyframe) {
                            keyframe.loadRIN(capture);
                            my.dirtyKeyframe = true;
                            keyframe.setSelected(false, true);
                        }
                    }
                }
                //var displays = that.getStorageContainer().displays.getContents();
                //for (i = 0; i < displays.length; i++) {
                //    display = displays[i].display;
                //    if (display.getStart() < current && current < display.getEnd()) {
                //        keyframe = display.addKeyframe(my.timeManager.timeToPx(current));
                //        if (keyframe) {
                //            keyframe.loadRIN(capture);
                //            my.dirtyKeyframe = true;
                //            if (select) keyframe.setSelected();
                //        }
                //        return;
                //    }
                //}
            }
        }
    }
    that.receiveKeyframe = receiveKeyframe;

    function _unselectKeyframe() {
        if (my.selectedKeyframe) {
            my.selectedKeyframe.setDeselected();
        }
        my.currentKeyframe = null;
        my.dirtyKeyframe = false;
    }
    my.timeManager.onMove(function () {
        if (my.dirtyKeyframe) {
            my.update(true);
        }
        _unselectKeyframe();
    });

    // Ink params
    my.inkSpec = {};
    my.inkPath = "";
    my.currentInkPath = "";
    my.inkProps = {};
    my.inkEnabled = null; //(bleveque) unattached ink tracks by default
    my.inkInitKeyframe = {};
    my.inkRelativeArtPos = {};
  
    // add initialization
    //color, font, opacity, size, mode
    // param getters
    function getInkSpec() {
        return my.inkSpec;
    }
    function getInkColor() {
        return my.inkSpec.penColor;
    }
    function getInkFont() {
        return my.inkSpec.font;
    }
    function getInkOpacity() {
        return my.inkSpec.opacity;
    }
    function getInkSize() {
        return my.inkSpec.size;
    }
    function getInkMode() {
        return my.inkSpec.mode;
    }
    function getInkPath() {
        return my.inkPath;
    }
    function getInkLink() {//returns parent/associated artwork track
        return my.experienceId;
    }
    function getInkProps() {
        return my.inkProps;
    }
    function getInkEnabled() {
        return my.inkEnabled;
    }
    function getInkInitKeyframe() {
        return my.inkInitKeyframe;
    }
    function getInkRelativeArtPos() {
        return my.inkRelativeArtPos;
    }
    function getInkType() {
        return my.inkType;
    }
    that.getInkType = getInkType;

    that.getInkSpec = getInkSpec;
    that.getInkColor = getInkColor;
    that.getInkFont = getInkFont;
    that.getInkOpacity = getInkOpacity;
    that.getInkSize = getInkSize;
    that.getInkMode = getInkMode;
    that.getInkPath = getInkPath;
    that.getInkLink = getInkLink;
    that.getInkProps = getInkProps;
    that.getInkEnabled = getInkEnabled;
    that.getInkInitKeyframe = getInkInitKeyframe;
    that.getInkRelativeArtPos = getInkRelativeArtPos;

    // param setters
    function setInkType() {
        return my.inkType;
    }

    function setInkSpec(spec) {
        my.inkSpec = spec;
    }
    function setInkColor(color) {
        my.inkSpec.color = color;
    }
    function setInkFont(font) {
        my.inkSpec.font = font;
    }
    function setInkOpacity(opacity) {
        my.inkSpec.opacity = opacity;
    }
    function setInkSize(size) {
        my.inkSpec.size = size;
    }
    function setInkMode(mode) {
        my.inkSpec.mode = mode;
    }
    function setInkPath(path) {
        my.inkPath = path;
    }
    function setInkLink(id) {
        my.experienceId = id;
    }
    function setInkProps(props) {
        my.inkProps = props;
    }
    function setInkEnabled(enabled) {
        my.inkEnabled = enabled;
    }
    function setInkInitKeyframe(kf) {
        my.inkInitKeyframe = kf;
    }
    function setInkRelativeArtPos(ar) {
        my.inkRelativeArtPos = ar;
    }
    function addAttachedInkTrack(tr) {
        if (my.attachedInks.indexOf(tr) < 0) {
            my.attachedInks.push(tr);
        } else {
            console.log("duplicate added");
        }
    }
    function removeAttachedInkTrack(tr) {
        my.attachedInks.splice(my.attachedInks.indexOf(tr), 1);
    }
    function changeTrackColor(color) {
        my.track.css('background-color', color);
    }

    function videoConverted(converted) {
        my.converted = converted;
    }
    that.setInkSpec = setInkSpec;
    that.setInkType = setInkType;
    that.setInkColor = setInkColor;
    that.setInkFont = setInkFont;
    that.setInkOpacity = setInkOpacity;
    that.setInkSize = setInkSize;
    that.setInkMode = setInkMode;
    that.setInkPath = setInkPath;
    that.setInkLink = setInkLink;
    that.setInkProps = setInkProps;
    that.setInkEnabled = setInkEnabled;
    that.setInkInitKeyframe = setInkInitKeyframe;
    that.setInkRelativeArtPos = setInkRelativeArtPos;
    that.addAttachedInkTrack = addAttachedInkTrack;
    that.removeAttachedInkTrack = removeAttachedInkTrack;
    that.changeTrackColor = changeTrackColor;
    that.videoConverted = videoConverted;
    // RIN conversions

    /**
     * Add track resource to RIN resource table
     * @param table     RIN resource table object to add entry to
     */
    function addResource(table) {
        table[my.resource] = {
            uriReference: media
        };
    }
    that.addResource = addResource;

    /**
     * Generates RIN data for Experience Stream from track
     * @param data      "ExperienceStreams" object to add named track ES object to
     */
    function addES(data) {
        var i, passthrough, inkLink = null,
            param = my.title,
            count = 0,
            exp = {},
            prevState = null;

        exp.data = {
            zIndex: dataHolder.numTracks() - that.getPos(),
        };

        // type
        switch (my.type) {
            case TAG.TourAuthoring.TrackType.artwork:
                exp.providerId = 'ZMES';
                exp.data.guid = guid;
                break;

            case TAG.TourAuthoring.TrackType.image:
                exp.providerId = 'ImageES';
                break;

            case TAG.TourAuthoring.TrackType.audio:
                exp.providerId = 'AES';
                exp.data.mediaLength = my.mediaLength;
                break;

            case TAG.TourAuthoring.TrackType.video:
                exp.providerId = 'VideoES';
                exp.data.mediaLength = my.mediaLength;
                exp.data.converted = my.converted;
                exp.data.toConvert = my.toConvert;
                break;

            case TAG.TourAuthoring.TrackType.ink:
                exp.providerId = 'InkES';
                exp.data.linkToExperience = {};
                inkLink = (my.experienceId) ? my.experienceId.getTitle() : '';
                exp.data.linkToExperience.embedding = {
                    element: {
                        datastring: {
                            type: "datastring",
                            str: my.inkPath,
                        },
                        props: my.inkProps,
                    },
                    enabled: my.inkEnabled,
                    //inkType: my.inkType,
                    initKeyframe: my.inkInitKeyframe,
                    experienceId: inkLink,
                    initproxy: my.inkRelativeArtPos,
                };
                //hard coded for now
                exp.data.markers = {
                    beginAt: 0,
                    endAt: 5,
                };
                exp.data.transition = {
                    inDuration: 0.000001, //was 0.5 (bleveque)
                    outDuration: 0.000001, //was 0.5 (bleveque)
                    providerId: "FadeInOutTransitionService",
                };
                exp.experienceStreams = { "defaultStream": { "duration": 16.891999999999999 } };
                exp.resourceReferences = [];
                break;
            default:
                console.log('Track type not yet implemented in RIN');
        }

        // don't pass through if track is currently selected or there is no selection
        if (!dataHolder.getSelectedTrack() || dataHolder.getSelectedTrack() === that) {
            passthrough = false;
        } else {
            passthrough = true;
        }
        
        if (my.type !== TAG.TourAuthoring.TrackType.ink) {
            exp.resourceReferences = [
                {
                    resourceId: my.resource,
                    required: 'true'
                }
            ];
        } else {
            exp.resourceReferences = [];
        }
        exp.experienceStreams = {};

        var trackDisplays = that.getStorageContainer().displays.getContents();
        for (var idx = 0; idx < trackDisplays.length; idx++) {
            trackDisplays[idx].display.toES(exp, passthrough, prevState, idx);
            prevState = dataHolder.lastKeyframe(trackDisplays[idx].display);
        }

        //dataHolder.mapDisplays(that.getStorageContainer(), function (currentDisplay) {
        //    currentDisplay.display.toES(exp, passthrough, prevState);
        //    prevState = dataHolder.lastKeyframe(currentDisplay.display);
        //});

        //for (i = 0; i < my.displays.length; i++) {
        //    my.displays[i].toES(exp, passthrough, prevState);
        //    prevState = my.displays[i].getLastKeyframe();
        //}

        while (data.hasOwnProperty(param)) {
            param = param + '-0';
        }
        data[param] = exp;
    }
    that.addES = addES;

    /**
     * --- DEPRECATED --- 
     * Helper function for generating Experience Streams
     * Gathers Keyframe Sequence data from displays
     * @returns     "keyframeSequences" object
     */
    function _getKeyframeSequences() {
        var i, sequences = {};
        for (i = 0; i < my.displays.length; i++) {
            my.displays[i].toKeyframeSequence(sequences);
        }
        return sequences;
    }

    /**
     * Gathers screenplay entries from displays
     * Don't forget to sort these things afterwards
     * @param screenplay        Array to add screenplay entries to
     * @param needFull          If true, output screenplay entries regardless of internal settings
     */
    function addScreenPlayEntries(screenplay, needFull) {
        if (needFull || my.isVisible) {
            var trackDisplays = dataHolder.getDisplays(that.getPos()).getContents();
            for (var i = 0; i < trackDisplays.length; i++) {
                var currentDisplay = trackDisplays[i];
                screenplay.push(currentDisplay.display.toScreenPlayEntry(i));
            };
            //for (i = 0; i < my.displays.length; i++) {
            //    screenplay.push(my.displays[i].toScreenPlayEntry());
            //}
        }
    }
    that.addScreenPlayEntries = addScreenPlayEntries;
    
    // updates the position of the zoom box
    function zoomBoxUpdate() {
        var zoomfader = $(document.getElementById('zoomPoint'));
        var currScale = my.timeManager.getDuration().scale;

        var minScale = $(timeline).width() / my.timeManager.getDuration().end;
        var percent = (currScale - minScale) / (TAG.TourAuthoring.Constants.maxZoom - minScale);
        var newLeft = ((zoomfader.offsetParent().width() - zoomfader.width()) * percent);
        zoomfader.css('left', newLeft);
    }

    // set minimized boolean flag to specified value
    function setMinimizedState(state) {
        isMinimized = state;
    }
    that.setMinimizedState = setMinimizedState;

    // return value of boolean flag representing minimized state
    function  getMinimizedState() {
        return isMinimized;
    }
    that.getMinimizedState = getMinimizedState;

    // toggle track minimization
    function toggleMinimized() {
        isMinimized = !isMinimized;
        if (Math.ceil(titlediv.height()) === TAG.TourAuthoring.Constants.trackHeight) {
            titlediv.height(TAG.TourAuthoring.Constants.minimizedTrackHeight);
            my.track.height(TAG.TourAuthoring.Constants.minimizedTrackHeight);
            iconDiv.hide();
            titleConversionMsg.hide();
            if (mygroup) {
                mygroup.style('display', 'none');
            }
        } else {
            titlediv.height(TAG.TourAuthoring.Constants.trackHeight);
            my.track.height(TAG.TourAuthoring.Constants.trackHeight);
            iconDiv.show();
            titleConversionMsg.show();
            if (mygroup) {
                mygroup.style('display', null);
            }
        }
        dataHolder.mapDisplays(that.getStorageContainer(), function (display) {
            display.display.toggleCircles();
        });

        drawLines();
        my.timeline.updateVerticalScroller();
        my.timeline.enableDisableDrag();
        TAG.Telemetry.register(titlediv, 'DoubleClick', 'MinimizeTrackHeader', null);
    }

    return that;
};
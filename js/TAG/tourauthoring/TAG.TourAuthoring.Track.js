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

/**Represents all the displays and keyframes of a piece of media over the duration of a tour
 * Maps to Experience Stream in RIN
 * @class TAG.TourAuthoring.Track
 * @constructor
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

    var media = spec.media,                                                                         // URI of the resource 
        storageContainer,                                                                           // div storing the track
        dataHolder = spec.dataHolder,                                                               // contains the actual track data
        id = ('Track-' + spec.id),                                                                  // track ID
        arrayPos = spec.id,                                                                         // stores the position of the selected track in the 'trackarray' array
        guid = spec.guid,                                                                           // Worktop GUID, for artwork tracks
        playbackControls = spec.playbackControls,                                                   // handles the play/pause etc. functionality for the track
        titlediv,                                                                                   // for track minimization
        titleDivManip = false,                                                                      // variable used to determine when a track has been selected for vertical movement/swapping with another track 
        prevTrack = {},                                                                             // the previous trackobject
        trackBody,                                                                                  // the trackBody div represnting the track on the timeline
        prevTitleDiv = {},                                                                          // the title div of the previous track
        renameOverlay = $(TAG.Util.UI.blockInteractionOverlay()),                                  // overlay for when 'rename' component option is selected
        deleteOverlay = $(TAG.Util.UI.blockInteractionOverlay()),                                  // overlay appears with the 'delete' confirmation box
        editInkOverlay = $(TAG.Util.UI.blockInteractionOverlay()),                                 // overlay for when 'edit ink' component option is selected while playhead is not over the art track
        isMinimized = false,                                                                        // checks if the track is minimized
        released = true,                                                                            // event release on the track (mouse/touch)
        mygroup;                                                                                    // group that contains svg lines for audio tracks only - used by track minimization

    // properties of 'my'
    my = my || {};                                                                                  // the object passed in
    my.title = decodeURI(spec.title);                                                               // track title
    my.resource = 'R-' + arrayPos;                                                                  // track position
    my.root = spec.root;                                                                            // root element
    my.type = spec.type || TAG.TourAuthoring.TrackType.artwork;                                    // type of track
    my.timeManager = spec.timeManager;                                                              // takes care of all time related stuff for the track
    my.undoManager = spec.undoManager;                                                              // keeps track of the order of commands for the undo function 
    my.update = spec.update;                                                                        // Call this function every time a change affecting RIN data is made
    my.timeline = spec.timeline;                                                                    // timeline of the tour
    my.dirtyKeyframe = false;                                                                       // keeps track of when a new keyframe has been added to a track
    my.selectedTrack = spec.selectedTrack;                                                          // current selected track
    my.mediaLength = spec.mediaLength;                                                              // duration of the track
    my.isVisible = true;                                                                            // checks for track visibility 
    my.attachedInks = [];                                                                           // array of attached ink tracks
    my.displays = [];                                                                               // array of attached displays
    my.allKeyframes = [];                                                                           // array of all the keyframes for the audio track
    my.inRightTap = false;                                                                          // checks for long press on the title div                                                                
    my.converted = spec.converted;                                                                  // boolean to check if a video track is converted or not
    my.toConvert = spec.toConvert;                                                                  // boolean to check if the user want to convert a video track right after uploading
    // Title for header
    var titledivPlaceholder,                                                                        // div holding the title div                                     
        titleText,                                                                                  // div holding the track title 
        movingIndicator,                                                                            // variable to keep track of when the white bar indicating if a track can be swapped with a selected track should appear on the titledivs
        compOpsOpen = false,                                                                        // keeps track of when the 'component options' menu which appears on right clicking on  track is open or not
        eventsPaused = false,                                                                       // checks for pausing of a track on the timeline
        menu;                                                                                       // creates an instance of the editor menu

    // variables used by the onManipTrackTitleWrapper class to keep track of the 
    // top, bottom and total movement along the y axis of the tracks
    var prevZIndex = 0,                                                                             // inits track title to be dragged
        firstEvent = true,                                                                          // handles the case when the track title wrapper is dragged, if titledivmanip is true, instead allows for div to be dragged
        moveTop = 0,                                                                                // top position of the track div
        moveBottom = 0,                                                                             // bottom position of the track div
        totalYMoved = 0,                                                                            // total vertical position change of the track
        offset = 0,                                                                                 // position w.r.t the container
        multiSelection;                                                                             //track tapped 
    
    // mouse release variables
    var vertLock = false,                                                                           // checks if a block can be moved vertically on mouse release
        sideLock = false,                                                                           // checks if a block can be moved sideways on mouse release
        xMoved = 0,                                                                                 // sideways movement
        yMoved = 0,                                                                                 // vertical movement
        dragEvents = 0;                                                                             // dragging movement

    var convertbtn;                                                                                 //convert video button for video tracks
    var firstBlock = true;
    var trackToReplace = null;                                                                      // global variable to hold the track which the selected track will be swapped with
    var grTrack;                                                                                    // makes the track manipulatable
    var displayCount = 0;                                                                           // used for ids 

    var that = {                                                                                    // object containing public methods of the class
        updateTracksEventsPaused: updateTracksEventsPaused,
        setSelected: setSelected,
        setDeselected: setDeselected,
        getType: getType,
        getMedia: getMedia,
        getPos: getPos,
        getTitle: getTitle,
        setTitle: setTitle,
        getEventsPaused: getEventsPaused,
        setEventsPaused: setEventsPaused,
        getCurrentDisplay: getCurrentDisplay,
        setCurrentDisplay: setCurrentDisplay,
        setIsVisible: setIsVisible,
        getCurrentKeyframe: getCurrentKeyframe,
        getGUID: getGUID,
        setStorageContainer: setStorageContainer,
        getStorageContainer: getStorageContainer,
        getID: getID,
        updatePos: updatePos,
        getTitleDiv: getTitleDiv,
        insert: insert,
        insertHelper: insertHelper,
        getTrackDomElement: getTrackDomElement,
        reloadTrack: reloadTrack,
        restoreHandlers: restoreHandlers,
        tapRightTitle: tapRightTitle,
        tappedTitle: tappedTitle,
        tapRight: tapRight,
        setDisplaySelected: setDisplaySelected,
        setDisplayDeselected: setDisplayDeselected,
        onManipTrack: onManipTrack,
        boundHelper: boundHelper,
        scale: scale,
        leftAndRight: leftAndRight,
        upAndDown: upAndDown,
        deselectKeyframe: deselectKeyframe,
        addKeyframeToLines: addKeyframeToLines,
        drawLines: drawLines,
        addInkTypeToTitle: addInkTypeToTitle,
        addTitleToDOM: addTitleToDOM,
        addEditorToDOM: addEditorToDOM,
        remove: remove,
        detach: detach,
        addDisplay: addDisplay,
        getDisplays: getDisplays,
        receiveKeyframe: receiveKeyframe,
        getInkSpec: getInkSpec,
        getInkPath: getInkPath,
        getInkLink: getInkLink,
        getInkEnabled: getInkEnabled,
        getInkInitKeyframe: getInkInitKeyframe,
        getInkRelativeArtPos: getInkRelativeArtPos,
        setInkType: setInkType,
        setInkSize: setInkSize,
        setInkPath: setInkPath,
        setInkLink: setInkLink,
        setInkEnabled: setInkEnabled,
        setInkInitKeyframe: setInkInitKeyframe,
        setInkRelativeArtPos: setInkRelativeArtPos,
        addAttachedInkTrack: addAttachedInkTrack,
        removeAttachedInkTrack: removeAttachedInkTrack,
        addResource: addResource,
        addES: addES,
        addScreenPlayEntries: addScreenPlayEntries,
        getMinimizedState: getMinimizedState,
        getCompOps: getCompOps,
        changeTrackColor: changeTrackColor,
        videoConverted: videoConverted,
     };

    my.that = that;                                                                                 // object w/ all public methods of this class
    
    checkVideoConverted();
    function checkVideoConverted() {
        if (my.converted === false) {
            var videotag = $(document.createElement('video'));
            videotag.attr('preload', 'metadata');
            var filename = media.slice(8, media.length);//get rid of /Images/ before the filename
            var basefilename = filename.substr(0, filename.lastIndexOf('.'));
            TAG.Worktop.Database.getConvertedCheck(
                (function (videotag) {
                    return function (output) {
                        if (output !== "False" && output !== "Error") {
                            console.log("converted: ");
                            var mp4filepath = "/Images/" + basefilename + ".mp4";
                            var mp4file = TAG.Worktop.Database.fixPath(mp4filepath);
                            videotag.attr('src', mp4file);
                            videotag.on('loadedmetadata', function () {
                                //remove from the video array and add display with the right duration
                                changeTrackColor('white');
                                addDisplay(0, this.duration);
                                my.converted = true;
                                convertbtn.remove();
                            });

                        } if (output === "Error") {
                            my.converted = false;
                            console.log("Error ocurred when converting");
                        }
                        else {
                            console.log("not converted: ");
                        }
                    }
                })(videotag), null, filename, basefilename);
        }
    }
    setInterval(checkVideoConverted, 1000 * 30);

    /**Creates the title div for a track
     * @method _initTitle
     */
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
            'font-size': '0.7em',
            'color': 'white',
            'top': '11%', 'left': '3%',
            'position': 'relative',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap',
            'display': 'block',
            'width': 0.115*$(window).width() + 'px',
        });
        titlediv.append(titleText);

        //call add icon function here
        addIconToTitle(my.type);
    })();
    
    /**Initializes the visual display components of the track
     * @method initVisuals
     */
    function initVisuals() {
        var myLine,
            _trackSizing;

        my.track = $(document.createElement('div'));                                                // Track container
        my.track.attr('id', id);
        my.track.addClass('track');
        my.track.css({
            "height": TAG.TourAuthoring.Constants.trackHeight + 'px',                              // changed 25%
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
                myLine = mygroup.append("svg:line")
                .attr("x1", 0)
                .attr("y1", (100 - TAG.TourAuthoring.Constants.defaultVolume * 100) + "%")
                .attr("x2", '100%')
                .attr("y2", (100 - TAG.TourAuthoring.Constants.defaultVolume * 100) + "%")
                .style('pointer-events', 'none')
                .style("stroke", "green")
                .style("stroke-width", 4);
        }

        _trackSizing = function (ev) {
            var displays = (dataHolder.getDisplays(arrayPos) && dataHolder.getDisplays(arrayPos).getContents()) || [];
            var i,
                j,
                keyframes;
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

    /**Creates the track itself
     * @method _initTrack
     */
    function _initTrack() {
        var _trackSizing,
            def,
            myLine;

        // Track container
        my.track = $(document.createElement('div'));
        my.track.attr('id', id);
        my.track.addClass('track');
        my.track.css({
            "height": TAG.TourAuthoring.Constants.trackHeight + 'px',                              // changed 25%
            'position': 'relative',
            'top': '0%',
            'left': '0%',
            "background-color": "rgb(255, 255, 255)",
            'border': '1px solid #888',
            "box-shadow": "5px 0px 10px -2px #888 inset"
        });

        _trackSizing = function (ev) {
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
        defs = my.svg.append('defs');
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
                myLine = mygroup.append("svg:line")
                .attr("x1", 0)
                .attr("y1", (100 - TAG.TourAuthoring.Constants.defaultVolume * 100) + "%")
                .attr("x2", '100%')
                .attr("y2", (100 - TAG.TourAuthoring.Constants.defaultVolume * 100) + "%")
                .style('pointer-events', 'none')
                .style("stroke", "green")
                .style("stroke-width", 4);
        }
    }

    menu = TAG.TourAuthoring.EditorMenu({                                                           // creates an instance of the editor menu
        type: TAG.TourAuthoring.MenuType.track,
        parent: that
    }, my);
    /**Creates the track editing menu 
     * It appears when a track div is right-clicked
     * @method _initMenu
     */
    (function _initMenu() {
        menu.addTitle('Track Options');
        menu.addButton('Rename', 'left', componentOptionRename);
        if (my.type === TAG.TourAuthoring.TrackType.ink) {
            menu.addButton('Edit Ink', 'left', componentOptionEditInk);
        }
        if (my.type === TAG.TourAuthoring.TrackType.video && my.converted !== true) {
            convertbtn = menu.addButton('Convert', 'left', componentOptionConvertVideo);
            if (my.toConvert === true) {
                convertbtn.text("Converting");
                convertbtn.css({
                    'color': 'gray'
                })
                convertbtn.data('disabled', true);
            }
        }
        menu.addButton('Duplicate', 'left', componentOptionDuplicate);
        menu.addButton('Delete', 'left', componentOptionDelete);
        menu.addButton('Cancel', 'left', componentOptionCancel);
    })();

    /**Closes the track options menu
     * @method close
     */
    function close() {
        menu.forceClose();
    }

    /**Gives a pop-up message to show an error to the user
     * @method displayError
     * @param {String} displayString        string to be shown on the pop-up
     */
    function displayError(displayString) {
        var messageBox,
            currSelection = dataHolder.getSelectedTrack();
        close();
        messageBox = TAG.Util.UI.popUpMessage(null, displayString, null);
        $(messageBox).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 1000);
        $('body').append(messageBox);
        $(messageBox).fadeIn(500);

        if (currSelection) {
            currSelection.setDeselected();
        }
    }
    
    /**Manipulating ink canvas
     * @method componentOptionEditInk
     * @param {Event} evt
     */
    function componentOptionEditInk(evt) {
        var i;
        var displays = that.getStorageContainer().displays.getContents();
        var inArtDisplay = true;                                                                    // checks if playhead is in art display
        var currTime = my.timeManager.getCurrentTime();
        var currTrack;
        var trackdisplays;
        var inInkDisplay = false;                                                                   // checks if playhead is in ink display
        var closestTime = -1000000;
        var old_datastring;
        var inkType;
        var ES = $("[ES_ID='" + my.title + "']");
        var transType;
        var text_elt;
        var viewBox;
        var rinplayer = $('#rinplayer');
        var dims;
        var currSelection = dataHolder.getSelectedTrack();

        if ($("#inkDrawControls").css("display") == "block" || $("#inkTransparencyControls").css("display") == "block" || $("#inkTextControls").css("display") == "block") {
            displayError("An ink is already being edited.");
            return;
        }
        if (!displays.length) {
            displayError("The ink must be visible in the preview window in order to edit it.");
            return;
        }
        if (getInkEnabled()) {
            currTrack = getInkLink();
            trackdisplays = currTrack.getDisplays();
            for (i = 0; i < trackdisplays.length; i++) {
                if ((trackdisplays[i].getStart() <= currTime) && (currTime <= trackdisplays[i].getOutStart() + trackdisplays[i].getFadeOut())) {
                    inArtDisplay = true;
                    break;
                }
                inArtDisplay = false;
            }
        }

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
            displayError("The ink must be visible in the preview window in order to edit it.");
            return;
        }
        my.timeManager.stop();
        old_datastring = that.getInkPath();
        inkType = old_datastring.split("::")[0].toLowerCase();
        close();

        if (!old_datastring || !inkType) {
            displayError("This ink track has become corrupted, please remove and create a new ink.");
            return;
        }

        if (!ES[0]) {
            displayError("The ink must be visible in the preview window in order to edit it.");
            return;
        }

        my.isVisible = false;

        if (inkType === "path" || inkType == "bezier") {                    //edit draw ink
            my.timeline.showEditDraw(that, old_datastring);
        } else if (inkType === "trans") {                                   //edit transparency
            transType = old_datastring.split("[mode]")[1].split("[")[0];
            my.timeline.showEditTransparency(that, old_datastring, transType);
        } else if (inkType === "text") {                                    //edit text
            text_elt = ES.find('text');
            viewBox = text_elt[0] ? ES.find('svg')[0].getAttribute('viewBox') : null;
            if (!text_elt[0] || (getInkEnabled() && !viewBox)) {
                my.isVisible = true;
                displayError("The ink must be loaded and on screen in order to edit it.");
                return;
            }
            dims = {
                x: text_elt.offset().left - rinplayer.offset().left,
                y: text_elt.offset().top - rinplayer.offset().top,
                w: text_elt[0].getBBox().width,
                h: text_elt[0].getBBox().height,
                fontsize: getInkEnabled() ? parseFloat(text_elt.attr("font-size")) * (rinplayer.height() / parseFloat(viewBox.split(" ")[3])) : null
            };
            my.timeline.showEditText(that, old_datastring, dims);
        } else {
            my.isVisible = true;
            displayError("This ink track is in a deprecated format, please remove and create a new ink.");
            return;
        }

        if (currSelection) {
            currSelection.setDeselected();
        }
        
        //show overlay to make all tracks non-clickable when edit ink
        if (my.isVisible === true) {
            return;
        }
        my.timeline.showEditorOverlay();
    }
    
    /**Handling renaming of tracks
     * @method componentOptionRename
     * @param {Event} evt
     */
    function componentOptionRename(evt) {
        var renameDialog = $(document.createElement("div"));
        var renameDialogTitle = $(document.createElement('div'));
        var emptyDiv = $(document.createElement("div"));
        var buttonDiv = $(document.createElement("div"));
        var buttonRow = $(document.createElement('div'));
        var text = $(document.createElement("div"));
        var ok = $(document.createElement("button"));
        var cancel = $(document.createElement('button'));
        var form = $(document.createElement("form"));
        var newName = $(document.createElement("input"));
        var currSelection = dataHolder.getSelectedTrack();
        var renameDialogSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });

        menu.close();
        renameDialog.attr("id", "renameDialog");
        
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

        $("body").append(renameOverlay);
        my.timeManager.stop();
        renameOverlay.fadeIn(500);
        
        form.css("text-align", 'left');
        newName.attr("type", "text");
        newName.css("margin", '4% 4%');
        newName.css("width", '100%'); 
        newName.attr("id","newNameInput"); 
        newName.val(my.title);                  // default text is existing title
        text.text("Rename track to: ");
        text.css({
            color: 'white',
            'width': '80%',
            'left': '10%',
            'font-size': '1.25em',
            'position': 'absolute',
            'text-align': 'center',
            'margin-top': '3%',
        });
        form.append(text);
        form.append(newName);
        renameDialog.append(form);
        newName.css({
            'width': '80%',
            'margin-left': '10%',
            'margin-right': '10%',
            'margin-top':'10%',
            'box-sizing': 'border-box',
            'position':'relative',
        });
        
        buttonDiv.css('text-align', 'right');
        emptyDiv.css('clear', 'both');
        buttonRow.css({
           'position': 'relative',
            'display': 'block',
            'width': '80%',
            'left': '10%',
        });
        buttonDiv.append(buttonRow);
        
        ok.text("Apply");
        ok.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'float': "right",
            'margin-right': '7%',
            'margin-top': '5%',
                        

        });
        buttonRow.append(ok);
        
        cancel.attr('type', 'button');
        cancel.text("Cancel");
        cancel.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-left': '7%',
            'float': "left",
            'margin-top': '5%',
        });
        buttonDiv.append(emptyDiv);
        buttonRow.append(cancel);
        renameDialog.append(buttonRow);
        renameDialog.show();
        close();
        ok.click(okTap);
        cancel.click(function () {
            renameOverlay.fadeOut(500);
            $(renameOverlay).remove();
        });
        
        $(document).keypress(function (e) {
            if (e.which === 13) {   // enter key
                okTap(e);
            }
        });

        /**Action to be executed when enter key is pressed
         * @method okTap
         * @param {Event} evt
         */
        function okTap(evt) {
            var tmpTitle = that.getTitle();
            $(renameOverlay).fadeOut(500);
            that.setTitle(newName.val().replace(/\'/g, '').replace(/\"/g, ''));
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
        if (currSelection) {
            currSelection.setDeselected();
        }
    }

    /**Handles track duplication from the track options menu
     * @method componentOptionDuplicate
     * @param {Event} evt
     */
    function componentOptionDuplicate(evt) { 
        var currTrack = that,
            undoStackSize = my.undoManager.undoStackSize(),
            media = currTrack.getMedia(),
            pos = currTrack.getPos(),
            name = currTrack.getTitle(),
            keyframes,
            e,                                      // e is the new track
            inFade,
            outFade,
            key,
            expID;

        menu.close();
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
                expID = currTrack.getInkLink();
                e = my.timeline.addInkTrack(expID, name, currTrack.getMedia(), currTrack.getInkSpec(), null);
                if (expID) {//if it is an attached ink
                    expID.addAttachedInkTrack(e);
                    e.setInkLink(expID);
                }
                addTracksDisplays(e);
                currTrack.insert(e);
                e.setInkEnabled(currTrack.getInkEnabled());
                e.setInkPath(currTrack.getInkPath());
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

        /**Adds the timeline displays for the track
         * @method addTrackDisplays
         * @param {Track} e
         */
        function addTracksDisplays(e) {
            var trackNum = e.getPos();
            var displayContent = that.getStorageContainer().displays.getContents();
            var i;
            for (i = 0; i < displayContent.length; i++) {
                addEachTrackDisplay(i);
            }

            /**Helper function to add one display at a time
             * @method addEachTrackDisplay
             * @param {Number} i        to index into the displays list
             */
            function addEachTrackDisplay(i) {
                var dispLength,
                    dispStart,
                    currDisp = displayContent[i].display,
                    sourceDisp,
                    newDisp,
                    parentDisp,
                    sourcekf,
                    j,
                    currkf,
                    newkf;
                if (currTrack.getType() !== TAG.TourAuthoring.TrackType.audio) {
                    dispLength = currDisp.getMain() + 2 * TAG.TourAuthoring.Constants.defaultFade;
                    dispStart = currDisp.getMainStart() - TAG.TourAuthoring.Constants.defaultFade;
                } else {
                    dispLength = currDisp.getMain();
                    dispStart = currDisp.getMainStart();
                }

                sourceDisp = displayContent[i];
                newDisp = e.addDisplay(my.timeManager.timeToPx(dispStart), dispLength);
                parentDisp = sourceDisp.display.getParentDisplay();

                if (parentDisp) {
                    parentDisp.addChildDisplay(newDisp);
                    newDisp.setParentDisplay(parentDisp);
                }

                //newDisp.setFadeInFromMenu(currDisp.getFadeIn());
                //newDisp.setFadeOutFromMenu(currDisp.getFadeOut());
                newDisp.basicSetTimes(sourceDisp.display.getTimes());                                                           // we know exactly what the times should be for each display; no need to do bounds checking

                sourcekf = currDisp.getStorageContainer().keyframes.getContents();                                              //reset for current display
                for (j = 0; j < sourcekf.length; j++) {
                    currkf = sourcekf[j];
                    if (currTrack.getType() === TAG.TourAuthoring.TrackType.audio) {                                           //need y value for volume keyframes
                        newkf = newDisp.addKeyframe(my.timeManager.timeToPx(currkf.getTime()), currkf.getVolumePx());           //adds keyframe and stores it
                        e.addKeyframeToLines(newkf);                                                                            //adds it to audio lines
                        newkf.restoreHandlers();
                    } else {
                        newkf = newDisp.addKeyframe(my.timeManager.timeToPx(currkf.getTime()));
                        newkf.loadRIN(currkf.getCaptureData());
                        my.dirtyKeyframe = true;
                        newkf.restoreHandlers();
                    }
                }
            }
            my.timeManager.setScale(my.timeManager.getScale());                                                                 // bleveque: TODO hacky fix before SAM release -- figure out why displays were showing up strangely otherwise
            console.log("combining " + (my.undoManager.undoStackSize() - undoStackSize));
            my.undoManager.combineLast(my.undoManager.undoStackSize() - undoStackSize);
        }

    }
    /**Handles video track conversion.
     *@method componenetOptionConvertVideo
     *@param: {Event} evt
     */
    function componentOptionConvertVideo(evt) {
        var curtrack = that;
        var newFileName = media.slice(8, media.length);
        var index = newFileName.lastIndexOf(".");
        var fileExtension = newFileName.slice(index);
        var baseFileName = newFileName.slice(0, index);
        TAG.Worktop.Database.convertVideo(function () {
        }, null, newFileName, fileExtension, baseFileName, null);
        //videoConvert.push(curtrack);
        my.toConvert = true;

        //disable the button
        convertbtn.text("Converting");
        convertbtn.css({
            'color': 'gray'
        })
        convertbtn.data('disabled', true);
        var currSelection = dataHolder.getSelectedTrack();
        if (currSelection) {
            currSelection.setDeselected();
        }
        close();
    }
    /**Event handling for delete button
     * @method componentOptionDelete
     * @param {Event] evt
     */
    function componentOptionDelete(evt) {
        var deleteDialog = $(document.createElement("div"));
        var deleteDialogTitle = $(document.createElement('div'));
        var buttonRow = $(document.createElement('div'));
        var mssge = $(document.createElement('div'));
        var deleteButton = $(document.createElement('button'));
        var cancelButton = $(document.createElement('button'));
        var text = "Are you sure you want to delete " + my.title;
        var hasAttachedInks = false;
        var trackArray = dataHolder.getTracks();
        var deleteDialogSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });
        menu.close();
        deleteDialog.attr("id", "deleteDialog");
        deleteDialog.css({
            position: 'absolute',
            left: deleteDialogSpecs.x + 'px',
            top: deleteDialogSpecs.y + 'px',
            width: deleteDialogSpecs.width + 'px',
            height: deleteDialogSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });
     
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
            'word-wrap': 'break-word',
        });

        $("body").append(deleteOverlay);
        deleteOverlay.append(deleteDialog);

        my.timeManager.stop();
        deleteOverlay.fadeIn(500);
        close();
        mssge.attr('id', 'mssge');
        mssge.text(text);
        mssge.css({
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
       
        deleteDialog.append(mssge);
        dataHolder.mapTracks(function (i) {
            if (i.track.getType() === TAG.TourAuthoring.TrackType.ink && i.track.getInkEnabled() && i.track.getInkLink().getTitle() === that.getTitle()) {
                hasAttachedInks = true;
                return;
            }
        });

        text += ((hasAttachedInks && (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image)) ? " and any attached ink tracks?" : "?");
        mssge.text(text);

        buttonRow.css({
            'position': 'relative',
            'display': 'block',
            'width': '80%',
            'left': '10%',
            'top': '50%'
        });
        deleteDialog.append(buttonRow);
        deleteButton.css({
            'padding': '1%',
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
        cancelButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',

            'float': 'right'
        });
        cancelButton.text('Cancel');
        cancelButton.click(function () { deleteOverlay.fadeOut(500); });
        buttonRow.append(cancelButton);

        /**Handles tapping on the delete button
         * @method yesTap
         */
        function yesTap() {
            close();
            var displayData = that.getStorageContainer().displays;
            var counter = 1;                                                //one track removed so far
            var command = TAG.TourAuthoring.Command({
                execute: function () {
                    var last = $('#Track-' + (dataHolder.numTracks() - 1) + '-title');
                    var trackBottom = ($(document.getElementById('playback-controls')).offset().top);
                    var lastDivBottom = ($(last).offset().top + TAG.TourAuthoring.Constants.trackHeight);
                    var first = dataHolder._trackArray[0].track.getTitleDiv();
                    var firstTop = first.offset().top;
                    var trackTop = $(timeline).offset().top;
                    remove();

                    //if artwork is removed, also check if ink functionality should be removed
                    if (!my.timeline.checkForArtworks(0)) {
                        my.timeline.disableInk();
                    }

                    //code to snap down track list such that the track list is always full if it can be
                    if (dataHolder.numTracks() > 0) {
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
            
            //this block of code handles the case when an art piece with attached inks is deleted
            for (var k = my.attachedInks.length-1; k >= 0; k--) {
                deleteAttachedInks(k);
            }

            /**Deletes ink tracks attached to the track being deleted
             * @method deleteAttachedInks
             * @param {Number} j
             */
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
    }

    /**Event handling for cancel button
     * @method componentOptionCancel
     * @param {Event} evt
     */
    function componentOptionCancel(evt) {
        var currSelection = dataHolder.getSelectedTrack();
        if (currSelection) {
            currSelection.setDeselected();
        }
        close();
    }
    
    /**Pausing events
     * @method updateTracksEventsPaused
     * @param fb
     */
    function updateTracksEventsPaused(fb) {
        dataHolder.mapTracks(function (i) {
            i.track.setEventsPaused(fb);
        });
    }
   
    /**Xiaoyi & Libby
     * Set a display selected when in multi select mode
     * @method setSelected
     */
    function setSelected() {
        dataHolder.selectTrack(that);
        titlediv.css({
            "background-color": "#000"
        });
    }
    
    /**Xiaoyi & Libby
     * Set a display deselected in multi select mode
     * @method setDeselected
     */
    function setDeselected() {
        dataHolder.selectTrack(null);
        titlediv.css({
            "background-color": "rgb(105,89,89)"
        });
    }
    
    /****** Getters and setters for type and media ******/

    /**Returns the type of the object passed in
     * @method getType
     * @return {Type} my.type
     */
    function getType () {
        return my.type;
    }
    
    /**Returns the media element
     * @method getMedia
     * @return {Object} media
     */
    function getMedia () {
        return media;
    }
    
    /**Returns the position of the selected track in the track array
     * @method getPos
     * @return {Number} arrayPos
     */
    function getPos() {
        return arrayPos;
    }
    
    /**Returns the title of the track
     * @method getTitle
     * @return {Number} my.title
     */
    function getTitle () {
        return my.title;
    }
    
    /**Sets the title of the track 
     * @method setTitle
     * @param {String} newTitle
     */
    function setTitle(newTitle) {
        newTitle = my.timeline.fixTrackTitle(newTitle, getID());
        my.title = newTitle;
        titleText.text(my.title);
    }
    
    /**Returns the boolean that checks if an event is paused
     * @method getEventsPaused
     * @return {Boolean} eventsPaused
     */
    function getEventsPaused() {
        return eventsPaused;
    }
    
    /**Sets the state of eventsPaused boolean
     * @method setEventsPaused
     * @param {Boolean} fB
     */
    function setEventsPaused(fB) {
        eventsPaused = fB;
    }
    
    /**Returns the currently selected display
     * @method getCurrentDisplay
     * @return {Display} my.currentDisplay
     */
    function getCurrentDisplay() {
        return my.currentDisplay;
    }
    
    /**Sets the current display for the track 
     * @method setCurrentDisplay
     * @param currDisplay
     */
    function setCurrentDisplay(currDisplay) {
        my.currentDisplay = currDisplay;
    }
    
    /**Sets boolean checking for track visibility
     * @method setIsVisible
     * @param {Boolean} visibility
     */
    function setIsVisible(visibility) {
        my.isVisible = visibility;
    }
    
    /**Returns the current key frame selected
     * @method getCurrentKeyframe
     * @return {Keyframe} my.currentKeyframe
     */
    function getCurrentKeyframe() {
        return my.currentKeyframe;
    }
    
    /**Returns boolaen that checks if the track-swapping white bar should appear
     * @method getCompOps
     * @return {Boolean} compOpsOpen
     */
    function getCompOps() {
        return compOpsOpen;
    }

    /**Returns the track id
     * @method getGUID
     * @return {String} guid
     */
    function getGUID() {
        return guid;
    }
    
    /**Sets the main div containing the displays and keyframes for the track
     * @method setStorageContainer
     * @param {HTML ELement} storeContain
     */
    function setStorageContainer(storeContain) {
        storageContainer = storeContain;
    }
    
    /**Returns a track's storage container
     * @method getStorageContainer
     * @return {HTML Element} storageContainer
     */
    function getStorageContainer() {
        return storageContainer;
    }
    
    /**Functions for track ID
     * Corresponds to ordering of tracks in timeline array
     * Maps to z-layering in RIN
     * Each track ID should be unique, but might change on track switch
     * Use updatePos to update id
     * @method getID
     * @return {String}
     */
    function getID() {
        return id.split('-')[1];
    }
    
    /**function to update tracks in array to their current positions.
     * @method updateTrackArray
     */
    function updateTrackArray() {
        dataHolder.mapTracks(function (container, i) {
            container.track.updatePos(i);
        });
    }

    /**Handles update of location in track array
     * @method updatePos
     * @param pos
     */
    function updatePos(pos) {
        arrayPos = pos;
        id = ('Track-' + pos);
        titlediv.attr('id', id + '-title');       
        my.track.attr('id', id);
        my.resource = 'R-' + arrayPos;
    }
    
    /**Returns the track title div
     * @method getTitleDiv
     * @return {HTML Element} titleDiv
     */
    function getTitleDiv() {
        return titlediv;
    }
    
    /**function to move a current track to the location next to this track
     * if the track to be inserted is below this track, then it is inserted before this track
     * otherwise, it is inserted after
     * @method insert
     * @param {Track} track
     */
    function insert(track) {
        var samePosition = false;
        if (track == that) {
            return;
        }
        if (arrayPos < track.getPos()) {
            samePosition = track.insertHelper(arrayPos);
        } else {
            samePosition = track.insertHelper(arrayPos);
        }
        updateTrackArray();
        my.update();
    }
    
    /**function called when this track is moved and inserted next to another track
     * @method insertHelper
     * @param pos               array position within calling class
     * @return {Boolean} false
     */
    function insertHelper(pos) {
        var scrollTop = $('#trackTitleWrapper').scrollTop();
        var trackToMove = that.getStorageContainer();
        that.detach();
        dataHolder._trackArray.splice(that.getPos(), 1);
        dataHolder._trackArray.splice(pos, 0, that.getStorageContainer());
        updateTrackArray();
        my.track.detach();
        reloadTrack();
        titlediv.css('top', '0px');
        my.track.css('display', '');
        $('#trackTitleWrapper').scrollTop(scrollTop);
        offset = 0;
        return false;
    }
    
    /**Returns the track DOM element
     * @method getTrackDomElement
     * @return {DOM Element} my.track
     */
    function getTrackDomElement() {
        return my.track;
    }
    
    /**Reloads track after deletion for undo redo. Assumes track was removed first.
     * @method relaodTrack
     */
    function reloadTrack() {
        var previousTrack;
        if (arrayPos === 0) {
            my.timeline.prependAddToDom(my.track, titlediv);
        } else {
            previousTrack = dataHolder._trackArray[arrayPos - 1].track;
            previousTrack.getTitleDiv().after(titlediv);
            previousTrack.getTrackDomElement().after(my.track);
        }
        my.update();
        restoreHandlers();
        if (my.that.getType() === TAG.TourAuthoring.TrackType.ink && my.that.getInkEnabled(my.that)) {
            my.that.getInkLink(my.that).addAttachedInkTrack(my.that);
        }
    }
    
    /**Restores the display handlers of track displays
     * @method restoreHandlers
     */
    function restoreHandlers() {
        var disps = dataHolder.getDisplays(arrayPos)
        if (disps && disps._root) {
            disps._root.traverse(function (disp) {
                var keyfs = dataHolder.getKeyframes(disp._value);
                disp._value.display.restoreHandlers();
                if (keyfs && keyfs._root) {
                    keyfs._root.traverse(function (keyf) {
                        keyf._value.restoreHandlers();
                    });
                }
            });
        }
    }
    
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

    /**Handles long press on the title
     * @method tapRightTitle
     * @param {Event} evt
     */
    function tapRightTitle(evt) {
        my.inRightTap = true;
        menu.open(evt);
    }
    this.tapRightTitle = tapRightTitle;

    /**Handles events when track title is tapped
     * @method tappedTitle
     * @param {Event} evt
     */
    function tappedTitle(evt) {
        var currSelection = dataHolder.getSelectedTrack();
        if (eventsPaused || my.inRightTap) {
            return;
        }
        if (currSelection === that) {
            setDeselected();
        } else {
            if (currSelection) {
                currSelection.setDeselected();
            }
            setSelected();
        }
    }
    
    /**Scrolling the track list area on the left of the timeline
     * @method scrollTitleWrapper
     * @param {Number} delta
     */
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

    /**Action executed when a  pressed track div is released
     * @method trackTitleReleased
     * @param {Event} evt
     */
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
        var tr = dataHolder._trackArray[arrayPos + offset].track;
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
        firstBlock = true;
        titleDivManip = false;
        firstEvent = true;
    }

    // makes the track manipulatable 
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

    /** <Description>
     * @method released
     * @param {Event} evt
     */
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

    /**Handles tapping on the timeline displays
     * @method tapRight
     * @param {Event} evt
     */
    function tapRight(evt) {
        if (eventsPaused || isMinimized) {
            return;
        }
        my.inRightTap = true;
        if (that.getCurrentKeyframe()) {
            that.getCurrentKeyframe().rightTapped(evt);
        } else if (that.getCurrentDisplay()) {
            that.getCurrentDisplay().rightTapped(evt);
        }
    }
    
    /**Handles double tapping on displays
     * @method doubleTapped
     * @param {Event} evt
     */
    function doubleTapped(evt) {
        var loc;
        if (isMinimized) {
            return;
        }
        if (my.currentDisplay) {
            loc = my.currentDisplay.getLoc();
             if (loc === TAG.TourAuthoring.DisplayParts['fade-out'] || loc === TAG.TourAuthoring.DisplayParts['fade-in']) {
                return;
            }
        }
        addKeyorDisplay(evt);
    }

    /**Tapping on a track
     * @method trackTapped
     * @param {Event} evt
     */
    function trackTapped(evt) {
        var selectednumber = my.timeline.getMultiSelectionArray().length;

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
            if (!that.getCurrentDisplay() && selectednumber > 0) {
                for (var i = 0;  i<selectednumber;i++){
                    my.timeline.allDeselected();
                }
            } else if (that.getCurrentKeyframe()) {
                if (isMinimized) {
                    return;
                }
                that.getCurrentKeyframe().tapped(evt);
            }
        } else if (that.getCurrentDisplay()) {                                                      //if in the multi selection mode, and user clicks on a display
            if (my.timeline.getMultiSelectionArray().indexOf(that.getCurrentDisplay()) < 0) {       //if it is not selected, have it selected
                setDisplaySelected(that.getCurrentDisplay());
            } else {                                                                                //if it is selected, have it deselected
                setDisplayDeselected(that.getCurrentDisplay(), false);
            }
        } else if (my.currentKeyframe) {                                                            //if the user clicks on a keyframe, select/deselect the display that contains current keyframe
            if (isMinimized) {
                return;
            }
            if (my.timeline.getMultiSelectionArray().indexOf(my.currentKeyframe.getContainingDisplay())< 0) {
                setDisplaySelected(my.currentKeyframe.getContainingDisplay());
            } else {
                setDisplayDeselected(my.currentKeyframe.getContainingDisplay(), false);
            }
        }
    }

    /**Xiaoyi & Libby
     * Set current display deselected when user clicks it again
     * @method setDisplaySelected
     * @param {Display} currentDisplay
     */
    function setDisplaySelected(currentDisplay) {
        //add selected display to the array, and change the filling color
        my.timeline.getMultiSelectionArray().push(currentDisplay);
        //change it to the selected colors according to their types
        //the grey color (selectedInkDisplayColor) is used on videos and inks
        if (currentDisplay.getType() === 4 || currentDisplay.getType() === 2) {
            currentDisplay.getMainDisplay().css('background-color', TAG.TourAuthoring.Constants.selectedInkDisplayColor);
        } else {
            currentDisplay.getMainDisplay().css('background-color', TAG.TourAuthoring.Constants.selectedDisplayColor);
        }
    }
    
    /**Xiaoyi & Libby
     * Set the current display deselected
     * @method setDisplayDeselected
     * @param currentDisplay        the display is been clicking on
     * @param keepDisplays          if we want to keep the displays
     */
    function setDisplayDeselected(currentDisplay, keepDisplays) {
        var valuation;

        //remove the display from the array
        if (!keepDisplays) {
            my.timeline.getMultiSelectionArray().splice(my.timeline.getMultiSelectionArray().indexOf(currentDisplay), 1);
        }
        valuation = function (a) {
            return a.source;
        }
        //remove this display's boundaries from the binheaps
        dataHolder._leftExternal.remove(dataHolder._leftExternal.findValue(currentDisplay, valuation));
        dataHolder._leftInternal.remove(dataHolder._leftInternal.findValue(currentDisplay, valuation));
        dataHolder._rightExternal.remove(dataHolder._rightExternal.findValue(currentDisplay, valuation));
        dataHolder._rightInternal.remove(dataHolder._rightInternal.findValue(currentDisplay, valuation));

        //ink/video displays change back to gray, others to green
        if (currentDisplay.getType() === 4 || currentDisplay.getType() === 2) {
            currentDisplay.getMainDisplay().css('background-color', TAG.TourAuthoring.Constants.inkDisplayColor);
        } else if (currentDisplay.getType() === 1) {
            currentDisplay.getMainDisplay().css('background-color', 'rgba(129, 173, 98, 0.8)');
        } else {
            currentDisplay.getMainDisplay().css('background-color', TAG.TourAuthoring.Constants.displayColor);
        }
    }
    
    /**Handles drag on track
     * Pan timeline view
     * If a display or keyframe is selected, move that
     * @method onManipTrack
     * @param res
     * @param {Event} evt
     */
    function onManipTrack(res, evt) {
        var i, 
            leftbound, 
            rightbound, 
            keydisplay, 
            allKeys,
            displays,
            prevKF,
            nextKF;

        if (eventsPaused || my.inRightTap) {
            evt.stopImmediatePropagation();
            return;
        }
        // move display
        if (my.currentDisplay) {
            my.currentDisplay.suppressHandles();
            if (evt) {
                evt.stopPropagation();
            }
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
                displays = that.getStorageContainer().displays.getContents();
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
            } else {
                //move all selected tracks
                if (my.timeline.getMultiSelectionArray().indexOf(my.currentDisplay) >= 0) {
                    my.timeline.moveSelect(res, my.currentDisplay);
                }
            }
        } else if (my.currentKeyframe) { // move keyframe
            if (isMinimized) {
                return;
            }
            if (evt) {
                evt.stopPropagation();
            }

            // Note that the bounds for the keyframe are just the beginning and end of the containing display
            keydisplay = my.currentKeyframe.getContainingDisplay();
            leftbound = keydisplay.getStart();
            rightbound = keydisplay.getEnd();
            prevKF = dataHolder.findPrevKeyframe(keydisplay, my.currentKeyframe);
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
    
    /**Xiaoyi & Libby
     * Helper function returning the left/right bounds of the track during multi-select
     * @method boundHelper
     * @param currDisplay: display that the bounds are being found for
     * @returns the bound for each display separately that are multi-selected
     */
    function boundHelper(currDisplay, hasZeroFadeout) { 
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
            loc = currDisplay.getLoc(),
            currRight = currDisplay.getEnd(),
            boundArray = [],
            prevDisp,
            nextDisp,
            parentArtDisplay,
            attachedDisplays = currDisplay.getChildDisplays(),
            totalDispLength,
            maxLength,
            leftExtBound,
            leftIntBound,
            rightExtBound,
            rightIntBound;
        
        //if the display the user is dragging has zero fadeout, update the currRight (for some reason, currDisplay.getEnd() doesn't work)
        if (hasZeroFadeout) {
            currRight = currDisplay.getOutStart();
        }

        //in the case where both the fadein and fadeout are both (such as with audio tracks), then the fadeinright and the fadeoutleft need to be calculated using either the first/last keyframe 
        //position or the edge of the fadein/fadeout handle, which prevents the display from being compressed so far that it is just a handle with no display at all
        if (currDisplay.getFadeIn() === 0 || currDisplay.getFadeOut() === 0) {
            fadeInRight = Math.min(my.timeManager.pxToTime(currDisplay.getFadeOutHandle().attr('cx') - 2 * TAG.TourAuthoring.Constants.fadeBtnSize),
                                            ((!currkeyframes.isEmpty() && (currkeyframes.min().getTime() - my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize + TAG.TourAuthoring.Constants.keyframeStrokeW + TAG.TourAuthoring.Constants.fadeBtnSize))) || Infinity));
            fadeOutLeft = Math.max(my.timeManager.pxToTime(currDisplay.getFadeInHandle().attr('cx')) + my.timeManager.pxToTime(2 * TAG.TourAuthoring.Constants.fadeBtnSize),
                ((!currkeyframes.isEmpty() && (currkeyframes.max().getTime() - currDisplay.getFadeOut() + my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize + TAG.TourAuthoring.Constants.keyframeStrokeW + TAG.TourAuthoring.Constants.fadeBtnSize))) || -Infinity));
        }
        
        if (fadeInRight < currDisplay.getStart()) {
            fadeInRight = currDisplay.getStart();
        }
        if (fadeOutLeft > currDisplay.getOutStart()) {
            fadeOutLeft = currDisplay.getOutStart();
        }

        //use data holder to acquire this, reduces for loops being needed
        prevDisp = dataHolder.findPreviousDisplay(arrayPos, currDisplay);
        nextDisp = dataHolder.findNextDisplay(arrayPos, currDisplay);

        //if dragging the main section of the display
        parentArtDisplay;
        if (loc === TAG.TourAuthoring.DisplayParts.main) {
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

        } else if (loc === TAG.TourAuthoring.DisplayParts['fade-out'] || loc === TAG.TourAuthoring.DisplayParts['fade-in']) {
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
            } else if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image || !my.inkEnabled) {
                attachedDisplays = currDisplay.getChildDisplays();
                totalDispLength = currDisplay.getLongestSubgroup(attachedDisplays);
                fadeOutLeft = Math.max(fadeOutLeft, currDisplay.getStart() + totalDispLength);
                fadeInRight = Math.min(fadeInRight, currDisplay.getEnd() - totalDispLength);
            }
            if (my.type === TAG.TourAuthoring.TrackType.video || my.type === TAG.TourAuthoring.TrackType.audio) {
                if (currDisplay.getMediaLength()) {
                    maxLength = parseFloat(currDisplay.getMediaLength());
                    leftbound = Math.max(leftbound, currDisplay.getEnd() - maxLength);
                    rightbound = Math.min(rightbound, currDisplay.getStart() + maxLength);
                }
            }
        }
        leftExtBound = {
            bound: currLeft - leftbound,    //distance in seconds
            source: currDisplay,
        }
        leftIntBound = {
            bound: fadeInRight - currLeft, //distance in seconds
            source: currDisplay,
        }
        rightExtBound = {
            bound: rightbound - currRight, //distance in seconds
            source: currDisplay,
        }
        rightIntBound = {
            bound: currRight - currDisplay.getFadeOut() - fadeOutLeft, //distance in seconds
            source: currDisplay,
        }
        //push all bounds to respective heaps
        dataHolder._leftExternal.push(leftExtBound);
        dataHolder._leftInternal.push(leftIntBound);
        dataHolder._rightExternal.push(rightExtBound);
        dataHolder._rightInternal.push(rightIntBound);
    }
    
    /**Gets the art display enclosing an attached ink track display.
     * @method getParentArtDisplay
     * @param {Display} disp
     * @return {Display} parent of the disp passed in 
     */
    function getParentArtDisplay(disp) {
        return disp.getParentDisplay();
    }

    /**Scales display sizes
     * @method scale
     */
    function scale() {
        var displays = that.getStorageContainer().displays.getContents(); //array of displays, from tree of displays
        var i;
        for (i = 0; i < displays.length; i++) {
            displays[i].display.scale();
        }
    }
    my.timeManager.onSizing(scale);

    /**Moves the trackBody left or right with the timeline ruler position
     * @method leftAndRight
     * @param res
     */
    function leftAndRight(res) {
        if (!trackBody) {
            trackBody = my.timeline.getTrackBody();
        }
        trackBody.scrollLeft(trackBody.scrollLeft() - res.translation.x);
    }
    
    /**Moves the trackBody up or down
     * @method upAndDown
     * @param res
     */
    function upAndDown(res) {
        if (!trackBody) {
            trackBody = $('#trackBody');
        }
        trackBody.scrollTop(trackBody.scrollTop() - res.translation.y);
    }
    
    /**Vertical scroll function
     * @method scrollTitle
     * @param {Event} evt
     */
    function scrollTitle(evt) {
        var close = my.timeline.getCloseMenu();
        var t;
        var topp;

        if (close) {
            close();
        }
        if (!trackBody) {
            trackBody = my.timeline.getTrackBody();
        }
        t = trackBody.scrollTop();
        if (evt === 1.1) { //scrolling up
            topp = t - 30;
        } else {           //scrolling down
            topp = t + 30;
        }
        trackBody.scrollTop(topp);
    }


    /**Adds a key frame or display   
     * @method addKeyorDisplay
     * @param {Event} evt
     */
    function addKeyorDisplay(evt) {
        var positionX = evt.position.x,
            newTime = my.timeManager.pxToTime(positionX),
            positionY = evt.position.y,
            enoughSpace = true,
            displayLength = 5, // assumes display length to be 5 seconds
            i, 
            keyframe, 
            newDisplay,
            currDisplay, 
            artDisplay,
            fromEnd,
            artDisplays,
            indisp,
            minSpace,
            displays,
            smallestSpace;


        if (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled) {
            artDisplays = getInkLink().getStorageContainer().displays.getContents();
            indisp = false;
            artDisplays = getInkLink().getStorageContainer().displays.nearestNeighbors(newTime);
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
            minSpace = Infinity;
            displays = that.getStorageContainer().displays.getContents();
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
            fromEnd = my.timeManager.getDuration().end - newTime;
            if (enoughSpace) {
                my.timeline.allDeselected();
                if (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled) {
                    newDisplay = addDisplay(positionX, Math.min(displayLength, artDisplay.getEnd() - newTime));
                    newDisplay.setParentDisplay(artDisplay);
                    artDisplay.addChildDisplay(newDisplay);
                    if (artDisplay.getEnd() - newTime < 1.5 || minSpace < 1.5) { // if less than 1.5 seconds available...
                        smallestSpace = Math.min(minSpace, artDisplay.getEnd() - newTime);
                        newDisplay.setIn(0);
                        newDisplay.setOut(0);
                        newDisplay.setMain(smallestSpace);
                    }
                } else {
                    smallestSpace = Math.min(displayLength, fromEnd);
                    newDisplay = addDisplay(positionX, smallestSpace);
                    if (fromEnd < 1.5) {
                        newDisplay.setIn(0);
                        newDisplay.setOut(0);
                        newDisplay.setMain(smallestSpace);
                    }
               }
           }
       } else if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.audio || my.type === TAG.TourAuthoring.TrackType.image) {    // Add keyframe

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
                     } else { // initialize keyframe and select it for further movements
                        keyframe.loadRIN(my.timeline.captureKeyframe(my.title)); // send in my.title to specify which keyframe should be captured (works for images and artworks)
                        keyframe.setSelected(true); // delay logging of edits
                        my.dirtyKeyframe = true;    // dirty b/c it's new
                    }
                    my.update();
                }
            }
        } 
    }

    /**Deselects any active keyframes
     * @method deselectKeyframe
     */
    function deselectKeyframe() {
        if (my.selectedKeyframe) {
            my.selectedKeyframe.setDeselected();
        }
        my.dirtyKeyframe = false;
    }
    
    /**Because loadRIN calls display.addKeyframe directly,
     * we need to pass it back into the track's list of allKeyframes manually for lines to draw
     * @method addKeyframeToLines
     * @param keyframe
     */
    function addKeyframeToLines(keyframe) {
        my.allKeyframes.push(keyframe);
        that.drawLines();
    }
    
    /**Draw volume line for audio tracks
     * @method drawLines
     */
    function drawLines() {
        var keyframes = my.allKeyframes, 
            end = keyframes.length-1,
            lines,
            color = "green",
            myLine,
            counter;
            
        if (isMinimized) {
            return;
        }
        if (my.type === TAG.TourAuthoring.TrackType.audio) {
            keyframes.sort(function (a, b) {
                if (a.isRemoved()) {
                    return 1;
                } else if (b.isRemoved()) {
                    return -1;
                } else {
                    return a.getTime() - b.getTime();
                }
            });

            while (end > 0 && keyframes[end].isRemoved()) {
                end--;
            }

            lines = my.svgLines.selectAll('#keyframeLines');
            lines.remove();

            mygroup = my.svgLines.append("svg:g")
                .attr("id", "keyframeLines");

            if (keyframes.length > 0) {
                myLine = mygroup.append("svg:line")
                    .attr("x1", 0)
                    .attr("y1", keyframes[0].getVolumePx())
                    .attr("x2", my.timeManager.timeToPx(keyframes[0].getTime()))
                    .attr("y2", keyframes[0].getVolumePx())
                    .style('pointer-events', 'none')
                    .style("stroke", color)
                    .style("stroke-width", 4);

                for (counter = 0; counter < end; counter++) {
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
            } else {
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
    
    // Methods to add outline and track HTML to DOM
    // Expects to be passed containers as JQuery object

    /**Adds an identifying icon to the track div
     * @method addIconToTitle
     * @param {Type} type       type of track
     */
    function addIconToTitle(type) {
        var iconPath;
        var iconImg;
        var iconDiv = $(document.createElement('div'));
        iconDiv.attr('id', 'icon');
        iconDiv.css({
            "bottom": "3px", "position": "absolute", "right": "8px",
            "width": "30px", "height": '30px',
        });
        switch (type) {
            case TAG.TourAuthoring.TrackType.audio:
                iconPath = tagPath+'images/icons/audio_icon_2.svg';
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
            'height' : '30px',
            'width' : '30px'
        });
        iconDiv.append(iconImg);
        titlediv.append(iconDiv);
    }

    /**Adds type to an ink track
     * @method addInkTypeToTitle
     * @param {Type} type
     */
    function addInkTypeToTitle(type) {
        var transType;
        var inkType = $(document.createElement('div'));

        inkType.attr('id', 'inkType');
        inkType.css({
            "top": "48px", "position": "absolute", "left" : "5px",
            "font-size": "1em", "color": "white", "width":"80%", "height" : '20px',
        });
        if (type === "trans") {
            transType = getInkPath().split("[mode]")[1].split("[")[0];
            if (transType === "block") {
                inkType.text("Block");
            } else {
                inkType.text("Isolate");
            }
        } else if (type == "text") {
            inkType.text("Text");
        } else if (type == "path" || type=="bezier") {
            inkType.text("Draw");
        }
        titlediv.append(inkType);
    }
    
    /**Adds title div to the DOM
     * @method addTitleToDOM
     * @param {HTML Element} container
     */
    function addTitleToDOM(container) {
        if (arrayPos > 0) {
            container.children().eq(arrayPos - 1).after(titlediv);
        } else {
            container.prepend(titlediv);
        }
        prevTitleDiv = titlediv.prev(".titlediv");
    }
    
    /**Adds track to the DOM
     * @method addEditorToDOM
     * @param {HTML Element} container
     */
    function addEditorToDOM(container) {
        if (arrayPos > 0) {
            container.children().eq(arrayPos - 1).after(my.track);
        } else {
            container.prepend(my.track);
        }
    }
    
    /**Removes a track and related references
     * @method remove
     */
    function remove() {
        dataHolder.removeTrack(that);
        titlediv.remove();
        my.track.remove();
    }
    
    /**<Description>
     * @method detach
     */
    function detach() {
        titlediv.detach();
        my.track.detach();
    }
    
    // DISPLAY WORK

    my.currentDisplay = null; // Manipulation handling
    my.currentKeyframe = null;

    /**Public fn for adding visibility to track
     * @method addDisplay
     * @param {Number} x         x value (px) for display
     * @param {Number} length    length of display in seconds (set to 5 if not given) (only used in testing)
     * @return newDisplay                 
     */
    function addDisplay(x, length) {
        var index,
            i,
            parentDisplays,
            parentDisp,
            newDisplay = TAG.TourAuthoring.Display({
                start: my.timeManager.pxToTime(x),
                length: length,
                dataHolder: dataHolder,
                canKeyframe: (my.type !== TAG.TourAuthoring.TrackType.ink && my.type !== TAG.TourAuthoring.TrackType.video),
                canFade: (my.type !== TAG.TourAuthoring.TrackType.audio)
            }, my),

            command = TAG.TourAuthoring.Command({
                execute: function () {
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
        my.update();
        my.undoManager.logCommand(command);
        return newDisplay; 
    }
    
    /**For testing purposes only, returns the display property of 'my'
     * @method getDisplays
     * @return {Display} my.display
     */
    function getDisplays() {
        return my.displays;
    }
    
    /**Updates track w/ new keyframe data at current location
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
            }
        }
    }
    
    /**Deselects a keyframe
     * @method _unselectKeyframe
     */
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

    /////////////
    // GETTERS //
    /////////////

    /**Returns ink track object
     * @method getInkSpec
     * @return {Object} my.inkSpec
     */
    function getInkSpec() {
        return my.inkSpec;
    }
    
    /**Returns path of the ink track
     * @method getinkPath
     * @return {String} my.inkPath
     */
    function getInkPath() {
        return my.inkPath;
    }

    /**Returns associated artwork track of the ink
     * @method getInkLink
     * @return my.experienceId
     */
    function getInkLink() {
        return my.experienceId;
    }
    
    /**Specifies if ink is attached or unattached
     * @method getInkEnabled
     * @return my.inkEnabled
     */
    function getInkEnabled() {
        return my.inkEnabled;
    }

    /**Returns initial keyframe of the ink track
     * @method getInitKeyFrame
     * @return {Object} my.inkInitKeyframe
     */
    function getInkInitKeyframe() {
        return my.inkInitKeyframe;
    }

    /**Returns postion of ink track relative to it's associated artwork
     * @method getInkRelativeArtPos
     * @return {Object} my.inkRelativeArtPos
     */
    function getInkRelativeArtPos() {
        return my.inkRelativeArtPos;
    }
    
    /////////////
    // SETTERS //
    /////////////

    /**Sets the ink type 
     * @method setinkType
     * @param type
     */
    function setInkType(type) {
       my.inkType = type;
    }

    /**Sets ink track size
     * @method setInkSize
     * @param size
     */
    function setInkSize(size) {
        my.inkSpec.size = size;
    }
    
    /**Sets path of the ink track
     * @method setInkPath
     * @param {String} path
     */
    function setInkPath(path) {
        my.inkPath = path;
    }

    /**Sets associated artwork of an ink track
     * @method setInkLink
     * @param id
     */
    function setInkLink(id) {
        my.experienceId = id;
    }
   
    /**Sets the inkEnabled property of the ink track
     * @method setInkEnabled
     * @param enabled
     */
    function setInkEnabled(enabled) {
        my.inkEnabled = enabled;
    }

    /**Sets initial key frame for the ink track
     * @method setInkInitialKeyframe
     * @param Keyframe kf
     */
    function setInkInitKeyframe(kf) {
        my.inkInitKeyframe = kf;
    }

    /**Sets position of ink track relative to artwork track
     * @method setInkRelativeArtPos
     * @param Position ar
     */
    function setInkRelativeArtPos(ar) {
        my.inkRelativeArtPos = ar;
    }

    /**Attaches ink track to the artwork track
     * @method addAttachedInkTrack
     * @param Track tr
     */
    function addAttachedInkTrack(tr) {
        if (my.attachedInks.indexOf(tr) < 0) {
            my.attachedInks.push(tr);
        } else {
            console.log("duplicate added");
        }
    }

    /**Removes an ink trackthat was attached to an artwork track
     * @method removeAttachedInkTrack
     * @param Track tr
     */
    function removeAttachedInkTrack(tr) {
        my.attachedInks.splice(my.attachedInks.indexOf(tr), 1);
    }
    /////////////////////
    // RIN conversions //
    /////////////////////
    function changeTrackColor(color) {
        my.track.css('background-color', color);
    }

    function videoConverted(converted) {
        my.converted = converted;
    }

    /**Add track resource to RIN resource table
     * @method addResource
     * @param table     RIN resource table object to add entry to
     */
    function addResource(table) {
        table[my.resource] = {
            uriReference: media
        };
    }
    
    /**Generates RIN data for Experience Stream from track
     * @method addES
     * @param data      "ExperienceStreams" object to add named track ES object to
     */
    function addES(data) {
        var i,
            passthrough,
            inkLink = null,
            param = my.title,
            count = 0,
            exp = {},
            prevState = null,
            trackDisplays,
            idx;

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

        trackDisplays = that.getStorageContainer().displays.getContents();
        for (idx = 0; idx < trackDisplays.length; idx++) {
            trackDisplays[idx].display.toES(exp, passthrough, prevState, idx);
            prevState = dataHolder.lastKeyframe(trackDisplays[idx].display);
        }
        while (data.hasOwnProperty(param)) {
            param = param + '-0';
        }
        data[param] = exp;
    }
    
    /**Gathers screenplay entries from displays
     * Don't forget to sort them afterwards
     * @method addScreenPlayEntries
     * @param screenplay        Array to add screenplay entries to
     * @param needFull          If true, output screenplay entries regardless of internal settings
     */
    function addScreenPlayEntries(screenplay, needFull) {
        var trackDisplays,
            currentDisplay,
            i;
        if (needFull || my.isVisible) {
            trackDisplays = dataHolder.getDisplays(that.getPos()).getContents();
            for (i = 0; i < trackDisplays.length; i++) {
                currentDisplay = trackDisplays[i];
                screenplay.push(currentDisplay.display.toScreenPlayEntry(i));
            };
         }
    }
    
    /**Return value of boolean flag representing minimized state
     * @method getMinimizedState
     * @return {Boolean} isMinimized
     */
    function  getMinimizedState() {
        return isMinimized;
    }
    
    /**Toggle track minimization
     * @method toggleMinimized
     */
    function toggleMinimized() {
        isMinimized = !isMinimized;
        if (Math.ceil(titlediv.height()) === TAG.TourAuthoring.Constants.trackHeight) {
            titlediv.height(TAG.TourAuthoring.Constants.minimizedTrackHeight);
            my.track.height(TAG.TourAuthoring.Constants.minimizedTrackHeight);
            if (mygroup) {
                mygroup.style('display', 'none');
            }
        } else {
            titlediv.height(TAG.TourAuthoring.Constants.trackHeight);
            my.track.height(TAG.TourAuthoring.Constants.trackHeight);
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
    }
    
    return that;
};
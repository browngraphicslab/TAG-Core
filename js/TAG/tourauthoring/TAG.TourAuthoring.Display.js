LADS.Util.makeNamespace("LADS.TourAuthoring.Display");
LADS.Util.makeNamespace("LADS.TourAuthoring.DisplayParts");

LADS.TourAuthoring.DisplayParts = {
    main: 1,
    'fade-in': 2,
    'fade-out': 3
};

/**Makes a display
 * Represents region of time where media is playing
 * Maps to Keyframe Sequence in RIN
 * Contains and manages keyframes added to sequence
 * @class LADS.TourAuthoring.Display
 * @constructor
 * @param {Object}  spec  Params: start, length, fadeIn, fadeOut (all time values in seconds), id
 * @param {Object}  my    Update currentDisplay for touch handling, contains timeManager, undoManager, svg, update
 * @return {Object} that  The object to be added to the DOM with it's properties
 */

LADS.TourAuthoring.Display = function (spec, my) {
    "use strict";

    if (my.type === LADS.TourAuthoring.TrackType.audio) {
        console.log('audio');
    }                                                                                           // just so we know it's an audio track and we can't add keyframes to it

    var
        storageContainer,                                                                       // the container in which a display is stored
        parentDisplay,                                                                          // parentDisplay used only by ink
        inStart = spec.start || 0,                                                              // start of fade-in, start of entire display
        totalLength = spec.length || 5,                                                         // total length
        canKeyframe = spec.canKeyframe,                                                         // whether or not a track can have keyframes added to it
        canFade = spec.canFade,                                                                 // whether or not a track can fade-in and fade-out                     
        fadeIn = (canFade && totalLength >= 1.5) ? (spec.fadeIn || 0.5) : 0,                    // length of fade-in
        fadeOut = (canFade && totalLength >= 1.5) ? (spec.fadeOut || 0.5) : 0,                  // length of fade-out
        main = (totalLength - (fadeIn + fadeOut)),                                              // the main length of the track othe rthan  it's fading times
        mainStart = (inStart + fadeIn),                                                         // start of main region
        outStart = (mainStart + main),                                                          // start of fade-out
        id,                                                                                     // display id
        mainRect,                                                                               // the rectangle marking the track display on the timeline (the green area on the timeline)
        clamped_new = {},                                                                       // stored the changed state of the display
        clamped_init = {},                                                                      // stores the initial state of the display
        has_been_clamped = false,                                                               // boolean to check if the display state has been changed 
        dataHolder = spec.dataHolder,                                                           // stores all tour authoring data
        currkeyframes,                                                                          // current keyframes on a display
        childDisplays = [];                                                                    // used only by artworks to be aware of their inks
                                                                                        // creates the editing menu for the display

    //use these for edit ink primarily -- we could also use getters so we don't have to use 'that.' all over the place -bleveque

    // Add to SVG
    // Note: there is no "add" function, due to how SVG and d3 operates.
    var svgGroup,                                                                               // svg svgGroup containing display elements
        keyFrameGroup,                                                                          // svg svgGroup containing keyframe elements
        fadeInDisplay,                                                                          // fade-in display box
        fadeInHandle,                                                                           // handle for resizing
        mainDisplay,                                                                            // main display box
        fadeOutDisplay,                                                                         // fade-out display box
        fadeOutHandle,                                                                         // handle for resizing
        translation,                                                                            // time to translate between keyframes 
        nextDisplay,                                                                            // furthest current display can go before it coincides with the next display to the right
        prevDisplay,                                                                            // previous display 


        // last two used for mouse/touch handling
        loc,                                                                                    // region of display mouse/finger is clicked over
        offset,                                                                                 // offset of mouse/finger from beginning of region specified in loc
        hidden = false,                                                                         // bool flag for whether circles are hidden, i.e. track is minimized
        dispRemoved = false;                                                                    // whether or not the current display has been removed or not

    var snapTimesDLL = new DoublyLinkedList();                                                  // global snappable times list
    var T2P = my.timeManager.timeToPx;                                                          // convert timeline range to pixel values


    var that = {                                                                                // this object stores all the public methods of the class
        setKeyframeTree: setKeyframeTree,
        getChildDisplays: getChildDisplays,
        addChildDisplay: addChildDisplay,
        initVisuals: initVisuals,
        restoreHandlers: restoreHandlers,
        toggleCircles: toggleCircles,
        setFadeInFromMenu: setFadeInFromMenu,
        setFadeOutFromMenu: setFadeOutFromMenu,
        rightTapped: rightTapped,
        getOffset: getOffset,
        setOffset: setOffset,
        removeAttachedInkDisplays: removeAttachedInkDisplays,
        removeDisplay: removeDisplay,
        reloadDisplay: reloadDisplay,
        getStart: getStart,
        getEnd: getEnd,
        getMainStart: getMainStart,
        getMain: getMain,
        getOutStart: getOutStart,
        getFadeIn: getFadeIn,
        getFadeOut: getFadeOut,
        setTimes: setTimes,
        basicSetTimes: basicSetTimes,
        getTimes: getTimes,
        resetVisuals: resetVisuals,
        setMain: setMain,
        setIn: setIn,
        setOut: setOut,
        getID: getID,
        setID: setID,
        getStorageContainer: getStorageContainer,
        setStorageContainer: setStorageContainer,
        getTrack: getTrack,
        getMediaLength: getMediaLength,
        getType: getType,
        getLoc: getLoc,
        suppressHandles: suppressHandles,
        move: move,
        setParentDisplay: setParentDisplay,
        getParentDisplay: getParentDisplay,
        getMainDisplay: getMainDisplay,
        getFadeInHandle: getFadeInHandle,
        getFadeOutHandle: getFadeOutHandle,
        getLongestSubgroup: getLongestSubgroup,
        msMove: msMove,
        internalMove: internalMove,
        scale: scale,
        addKeyframe: addKeyframe,
        removeKeyframe: removeKeyframe,
        insertKeyframe: insertKeyframe,
        sortKeyframes: sortKeyframes,
        getKeyframes: getKeyframes,
        toES: toES,
        toScreenPlayEntry: toScreenPlayEntry,
        getclampedNew: getclampedNew,
        getclampedInit: getclampedInit,
        getHasBeenClamped: getHasBeenClamped,
        getTotalLength: getTotalLength,
        getRemoved: getRemoved,
        setInStart: setInStart,
        setOutStart: setOutStart,
        setLoc: setLoc,
        getTranslation: getTranslation
    };

   var menu = LADS.TourAuthoring.EditorMenu({
        type: LADS.TourAuthoring.MenuType.display,
        parent: that
    }, my);

    initVisuals();
    
   
    /**Add a new ink display to a track as the child element attached to the display
     * @method addChildDisplay
     * @param {Display} newdisp    new annotation to the track
     */
    function addChildDisplay(newdisp) {
        childDisplays.push(newdisp);
    }

    /**Sets up the visual elements of track to be displayed
     * @method initVisuals
     */
    function initVisuals() {
        var displayDivs = LADS.Util.UI.createDisplay({
            x: T2P(inStart),
            fadeIn: T2P(fadeIn),
            fadeOut: T2P(fadeOut),
            mainLength: T2P(main),
            mainColor: canKeyframe ? (my.type === LADS.TourAuthoring.TrackType.audio ? 'rgba(129, 173, 98, 0.8)' : LADS.TourAuthoring.Constants.displayColor) : LADS.TourAuthoring.Constants.inkDisplayColor,
            fadeColor: null, // FIX THIS TODO
            height: null,
            container: my.track
        });

        mainDisplay = displayDivs.mainRect;
        fadeInDisplay = displayDivs.inRect,
        fadeOutDisplay = displayDivs.outRect,
        fadeInHandle = displayDivs.inHandle,
        fadeOutHandle = displayDivs.outHandle;

        fadeInDisplay.on('mousedown', function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, LADS.TourAuthoring.DisplayParts['fade-in']);
        });
        mainDisplay.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, LADS.TourAuthoring.DisplayParts['main']);
        });
        fadeOutDisplay.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, LADS.TourAuthoring.DisplayParts['fade-out']);
        });
        fadeInHandle.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, LADS.TourAuthoring.DisplayParts['fade-in']);
        });
        fadeOutHandle.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, LADS.TourAuthoring.DisplayParts['fade-out']);
        });
    }

    /**Resets event handlers to initial states
     * @method restoreHandlers
     */
    function restoreHandlers() {
        fadeInDisplay.off('mousedown');
        fadeOutDisplay.off('mousedown');
        mainDisplay.off('mousedown');
        fadeInHandle.off('mousedown');
        fadeOutHandle.off('mousedown');
        fadeInDisplay.on('mousedown', function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, LADS.TourAuthoring.DisplayParts['fade-in']);
        });
        mainDisplay.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, LADS.TourAuthoring.DisplayParts['main']);
        });
        fadeOutDisplay.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, LADS.TourAuthoring.DisplayParts['fade-out']);
        });
        fadeInHandle.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, LADS.TourAuthoring.DisplayParts['fade-in']);
        });
        fadeOutHandle.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, LADS.TourAuthoring.DisplayParts['fade-out']);
        });
    }

    /**Bound to mousedown on display parts
     * Sets currentDisplay for use by displayClick
     * Resets currentDisplay on mouseup
     * @method _displayMousedown
     * @param {Number} mouseoffset      offset of mouse on element clicked for accurate dragging (offset from start of the timeline)
     * @param {Enum type} mouseloc      LADS.TourAuthoring.DisplayParts enum type specifying which part of display was clicked
     */
    function _displayMousedown(mouseoffset, mouseloc) {
        var // saves old states of the display
            oldin = inStart,                                                        // start time
            oldmainstart = mainStart,                                               // state of the mainRect start time
            oldmain = main,                                                         // main display 
            oldout = outStart,                                                      // end time
            oldtotal = totalLength;                                                 // total time of display

        var left,                                                                   // end time of the prev display
            right,                                                                  // start time of next display
            olddata,                                                                // stores the current timeline data
            msdata;                                                                 // display data

        initSnap();                                                                 // initialize snapping at mouse down on display
        my.timeManager.stop();                                                      // Stop playback on click

        // Set move related global variables
        offset = mouseoffset;
        loc = mouseloc;

        if (loc === LADS.TourAuthoring.DisplayParts['fade-in'] || loc === LADS.TourAuthoring.DisplayParts['fade-out']) {
            if (my.that.getMinimizedState()) { return; }
        }
        if (my.that.getMinimizedState()) {
            fadeInHandle.hide();
            fadeOutHandle.hide();
        }
        my.currentDisplay = that;
        my.timeline.newDataArray();

        for (var i = 0; i < my.timeline.getMultiSelectionArray().length; i++) {
            my.timeline.getMultiSelectionArray()[i].setLoc(loc);
        }

        $('body').on('mouseup.display', function () {                                 // On mouseup reset all instance vars and log state
            var command,
                redo,
                undo,
                multiDisplays,
                prevDisp = dataHolder.findPreviousDisplay(my.that.getPos(), that),
                nextDisp = dataHolder.findNextDisplay(my.that.getPos(), that),
                oldOff = offset,
                oldLoc = loc,
                num_clamped,
                multiDisplaysOrig,
                disp;

            my.currentDisplay = null;
            offset = null;
            loc = null;
            redo = 0;
            undo = 0;

            if (my.that.getMinimizedState()) {
                fadeInHandle.hide();
                fadeOutHandle.hide();
            }
            $('body').off('mouseup.display');

            /**log current state of the display
             * @method logHelper
             * @param {Display} disp
             * @param {Track object} cinit                initial state of the display
             * @param {Track Oobject} cnew                new state of the display
             */
            function logHelper(disp, cinit, cnew) {
                var clamp_command = {
                    execute: function () { disp.setTimes(cnew); },
                    unexecute: function () { disp.setTimes(cinit); },
                };
                var disp;
                my.undoManager.logCommand(clamp_command);
            }

            if (my.timeline.getMultiSelectionArray().length !== 0) {
                multiDisplaysOrig = my.timeline.getMultiSelectionArray();
                multiDisplays = [];
                multiDisplaysOrig.map(function (d) {
                    multiDisplays.push(d);
                });
            }

            // If movement has occured, update and log command
            if (oldin !== inStart || oldmainstart !== mainStart || oldmain !== main || oldout !== outStart) {
                left = 0;
                right = Infinity;
                my.timeline.updateOldData();
                my.update();
                switch (oldLoc) {
                    case LADS.TourAuthoring.DisplayParts['fade-in']:
                        redo = inStart;                                                 //save new value
                        undo = oldin;                                                   //save old value
                        break;
                    case LADS.TourAuthoring.DisplayParts['fade-out']:
                        redo = outStart;
                        undo = oldout;
                        break;
                    case LADS.TourAuthoring.DisplayParts['main']:
                        redo = mainStart;
                        undo = oldmainstart;
                        break;
                }

                if (prevDisp) {
                    left = prevDisp.display.getEnd();
                }
                if (nextDisp) {
                    right = nextDisp.display.getStart();
                }

                //stores these two functions with each command that is logged
                olddata = my.timeline.getOldData();
                msdata = my.timeline.getDisplayData();

                command = {
                    execute: function () {
                        var res = {
                            pivot: {
                                x: my.timeManager.timeToPx(redo) + oldOff
                            }
                        };
                        var currdisplay,
                            newredo,
                            newres,
                            newleft,
                            newright;

                        my.currentDisplay = that;
                        loc = oldLoc;
                        offset = oldOff;

                        //if these are defined, then get the logged positions and move the selected displays
                        if (olddata && multiDisplays) {
                            for (var i = 0; i < multiDisplays.length; i++) {
                                currdisplay = multiDisplays[i];
                                switch (oldLoc) {
                                    case LADS.TourAuthoring.DisplayParts['fade-in']:
                                        newredo = olddata[i][0];                                                    //save new value
                                        break;
                                    case LADS.TourAuthoring.DisplayParts['fade-out']:
                                        newredo = olddata[i][2];
                                        break;
                                    case LADS.TourAuthoring.DisplayParts['main']:
                                        newredo = olddata[i][1];
                                        break;
                                }

                                newres = {
                                    pivot: {
                                        x: my.timeManager.timeToPx(newredo) + oldOff
                                    }
                                };

                                //need to update the location, currentdisplay, offset for move 
                                currdisplay.setLoc(oldLoc);
                                currdisplay.setcurrentDisplay(currdisplay);
                                currdisplay.setOffset(offset);
                                newleft = left + currdisplay.getStart() - that.getStart();
                                newright = right + currdisplay.getEnd() - that.getEnd();
                                currdisplay.move(newres, olddata[i][3], olddata[i][4], -1, -1, true);
                                currdisplay.setcurrentDisplay(null);
                            }
                        } else {
                            move(res, left, right, -1, -1, true);
                        }

                        // reset state
                        my.currentDisplay = null;
                        loc = null;
                        offset = null;
                        my.update();
                    },
                    unexecute: function () {
                        var res = {
                            pivot: {
                                x: my.timeManager.timeToPx(undo) + oldOff
                            }
                        };
                        var currdisplay,
                            newundo,
                            newres;

                        my.currentDisplay = that;
                        loc = oldLoc;
                        offset = oldOff;

                        //if there is data logged, then you can undo the positions of the selected displays to the saved msdata's positions
                        if (msdata && multiDisplays) {
                            for (var i = 0; i < multiDisplays.length; i++) {
                                currdisplay = multiDisplays[i];
                                switch (oldLoc) {
                                    case LADS.TourAuthoring.DisplayParts['fade-in']:
                                        newundo = msdata[i][0];                                                     //save old value
                                        break;
                                    case LADS.TourAuthoring.DisplayParts['fade-out']:
                                        newundo = msdata[i][2];
                                        break;
                                    case LADS.TourAuthoring.DisplayParts['main']:
                                        newundo = msdata[i][1];
                                        break;
                                }
                                newres = {
                                    pivot: {
                                        x: my.timeManager.timeToPx(newundo) + oldOff
                                    }
                                };

                                //need to update these for the move function
                                currdisplay.setLoc(oldLoc);
                                currdisplay.setcurrentDisplay(currdisplay);
                                currdisplay.setOffset(offset);
                                currdisplay.move(newres, msdata[i][3], msdata[i][4], -1, -1, true);
                                currdisplay.setcurrentDisplay(null);
                            }
                        } else {
                            move(res, left, right, -1, -1, true);
                        }

                        // reset state
                        my.currentDisplay = null;
                        loc = null;
                        offset = null;
                        my.update();
                    }
                };
                my.undoManager.logCommand(command);
                num_clamped = my.timeline.getClampedDisplays().length;
                for (var i = 0; i < num_clamped; i++) {
                    disp = my.timeline.getClampedDisplays()[i];
                    logHelper(disp, disp.clamped_init, disp.clamped_new);
                    disp.has_been_clamped = false;
                }
                if (num_clamped > 0) {
                    my.undoManager.combineLast(num_clamped + 1);
                    my.timeline.getClampedDisplays().length = 0;
                }

            }
        });
    }

    /** Toggles the track circles according to current visibility of track 
     * @method toggleCircles
     */
    function toggleCircles() {
        hidden = !hidden;
        if (hidden) {
            fadeInHandle.css('display', 'none');
            fadeOutHandle.css('display', 'none');
            fadeInHandle.css('visibility', 'hidden');
            fadeOutHandle.css('visibility', 'hidden');
        } else {
            fadeInHandle.css('display', 'block');
            fadeOutHandle.css('display', 'block');
            fadeInHandle.css('visibility', 'visible');
            fadeOutHandle.css('visibility', 'visible');
        }
        currkeyframes.map(function (j) {
            j.toggleCircle();
        });
    }

    /**Sets up menu with correct inputs and buttons
     * @method initMenu
     */
    (function initMenu() {
        menu.addInput('Start', LADS.TourAuthoring.MenuInputFormats.minSec,
            getStart, setStartFromMenu);
        menu.addInput('Main Length', LADS.TourAuthoring.MenuInputFormats.minSec,
            getMain, setMainFromMenu);
        if (canFade) {
            menu.addInput('Fade-In', LADS.TourAuthoring.MenuInputFormats.sec,
                getFadeIn, setFadeInFromMenu);
            menu.addInput('Fade-Out', LADS.TourAuthoring.MenuInputFormats.sec,
                getFadeOut, setFadeOutFromMenu);
        }
        menu.addButton('Delete', 'left', removeHelper);
        menu.addButton('Close', 'right', menu.forceClose);
    })();

    /**Access the duration of a track
     * @method getLimits
     * @return {Object} duration object         containing start time and end time properties
     */
    function getLimits() {
        var duration = my.timeManager.getDuration(),
            left = duration.start,
            right = duration.end,
            leftDisp = dataHolder.findPreviousDisplay(my.that.getPos(), that),
            rightDisp = dataHolder.findNextDisplay(my.that.getPos(), that);

        left = (leftDisp) ? leftDisp.display.getEnd() : left;
        right = (rightDisp) ? rightDisp.display.getStart() : right;

        if (my.mediaLength) {
            left = Math.max(left, getEnd() - parseFloat(my.mediaLength));
            right = Math.min(right, parseFloat(my.mediaLength) + getStart());
        }
        return {
            left: left,
            right: right
        };
    }

    /**Set a start time for the track
     * @method setStartFromMenu
     * @param {Number} newstart     new start time 
     */
    function setStartFromMenu(newstart) {
        var translation,
            attachedDisplays,
            bounds = getLimits(),
            oldStart = inStart,
            totalDispLength = 0,
            surrDisp;

        if (my.type === LADS.TourAuthoring.TrackType.ink && my.inkEnabled) {
            surrDisp = getParentDisplay();
            bounds.left = Math.max(bounds.left, surrDisp.getStart() + LADS.TourAuthoring.Constants.inkTrackOffset);
            bounds.right = Math.min(bounds.right, surrDisp.getEnd());
        } else if (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image) {
            attachedDisplays = getChildDisplays();
            totalDispLength = getLongestSubgroup(attachedDisplays);
        }

        inStart = Math.constrain(newstart,     // note this is defined in LADS.Util
                            bounds.left, // min
                            bounds.right - fadeIn - fadeOut - main);

        translateTo(inStart);
        _moveAllKeyframes(inStart - oldStart);

        if (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image) {
            for (var i = 0; i < attachedDisplays.length; i++) {
                clampDisplay(attachedDisplays[i]);
            }
        }
    }

    /**Set the main display's time
     * @method setMainFromMenu
     * @param {} newmain
     */
    function setMainFromMenu(newmain) {
        var bounds = getLimits(),
            attachedDisplays,
            keyframeBound = !currkeyframes.isEmpty() ?
                currkeyframes.max().getTime() + LADS.TourAuthoring.Constants.epsilon - mainStart
                : -Infinity,
            totalDispLength = 0,
            surrDisp;

        if (my.type === LADS.TourAuthoring.TrackType.ink && my.inkEnabled) {
            surrDisp = getParentDisplay();
            bounds.left = Math.max(bounds.left, surrDisp.getStart() + LADS.TourAuthoring.Constants.inkTrackOffset);
            bounds.right = Math.min(bounds.right, surrDisp.getEnd());
        }
        else if (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image) {
            attachedDisplays = getChildDisplays();
            totalDispLength = getLongestSubgroup(attachedDisplays);
        }
        main = Math.constrain(Math.max(0.1, newmain),
                            keyframeBound,
                            bounds.right - inStart - fadeOut - fadeIn);
        if (fadeIn === 0 && fadeOut === 0 && main === 0) {
            main = 1;
        }
            
        setMain((main + fadeIn + fadeOut >= totalDispLength) ? main : totalDispLength - fadeIn - fadeOut);

        if (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image) {
            for (var i = 0; i < attachedDisplays.length; i++) {
                clampDisplay(attachedDisplays[i]);
            }
        }
    }

    /**set the fade-in time for a display 
     * @method setFadeInFromMenu
     * @param {Time} newfadein
     */
    function setFadeInFromMenu(newfadein) {
        //FEATURE DECIDED UPON: stop down-sizing the fadeIn if it hits a keyframe
        var bounds = getLimits(),
            i,
            currKeyframe,
            attachedDisplays,
            keyTime,
            surrDisp,
            newInStart,
            newfadeIn,
            totalDispLength = 0;

        if (my.type === LADS.TourAuthoring.TrackType.ink && my.inkEnabled) {
            surrDisp = getParentDisplay();
            bounds.left = Math.max(bounds.left, surrDisp.getStart() + LADS.TourAuthoring.Constants.inkTrackOffset);
            bounds.right = Math.min(bounds.right, surrDisp.getEnd());
        } else if (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image) {
            attachedDisplays = getChildDisplays();
            totalDispLength = getLongestSubgroup(attachedDisplays);
        }

        fadeIn = Math.constrain(newfadein,
                            0,
                            mainStart - bounds.left);
        newInStart = mainStart - fadeIn;

        if (!currkeyframes.isEmpty() && newInStart > currkeyframes.min().getTime() - my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize)) {
            inStart = currkeyframes.min().getTime() - my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize);
            fadeIn = mainStart - inStart;
        } else {
            inStart = newInStart;
        }

        if (main + fadeIn + fadeOut >= totalDispLength) {
            newfadeIn = fadeIn;
        } else {
            newfadeIn = totalDispLength - main - fadeOut;
        }

        setIn(newfadeIn);

        if (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image) {
            for (i = 0; i < attachedDisplays.length; i++) {
                clampDisplay(attachedDisplays[i]);
            }
        }
    }

    /**sets the fade-out property of the track
     * @method setFadeOutFromMenu
     * @param {Time} newfadeout
     */
    function setFadeOutFromMenu(newfadeout) {
        //FEATURE DECIDED UPON: stop down-sizing the fadeOut if it hits a keyframe
        var bounds = getLimits(),
            i,
            currKeyframe,
            attachedDisplays,
            keyTime,
            newend,
            surrDisp,
            totalDispLength = 0;
        if (my.type === LADS.TourAuthoring.TrackType.ink && my.inkEnabled) {
            surrDisp = getParentDisplay();
            bounds.left = Math.max(bounds.left, surrDisp.getStart() + LADS.TourAuthoring.Constants.inkTrackOffset);
            bounds.right = Math.min(bounds.right, surrDisp.getEnd());
        }
        else if (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image) {
            // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
            attachedDisplays = getChildDisplays();
            totalDispLength = getLongestSubgroup(attachedDisplays);
        }

        fadeOut = Math.constrain(newfadeout,
                            0,
                            bounds.right - outStart);
        newend = outStart + fadeOut;
        if (!currkeyframes.isEmpty() && newend < currkeyframes.max().getTime() + my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize)) {
            fadeOut = currkeyframes.max().getTime() + my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize) - outStart;
        }

        setOut((main + fadeIn + fadeOut >= totalDispLength) ? fadeOut : totalDispLength - main - fadeIn);

        if (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image) {
            for (i = 0; i < attachedDisplays.length; i++) {
                clampDisplay(attachedDisplays[i]);
            }
        }
    }

    /**Handles long press on the display
     * @method rightTapped
     * @param {Event} evt       the long tap event on the display
     */
    function rightTapped(evt) {
        menu.open(evt);
    }

    /**Sets the current location
     * @method setLoc
     * @param {} dloc
     */
    function setLoc(dloc) {
        loc = dloc;
    }

    /**Returns the offset property
     * @method getOffset
     * @return {Number} offset      returns the offset of the menu
     */
    function getOffset() {
        return offset;
    }
    
    /**Sets the offset property
     * @method setOffset
     * @param {Number} doffset      new offset
     */
    function setOffset(doffset) {
        offset = doffset;
    }
    
    /**Sets current display object
     * @method setcurrentDisplay
     * @param {Display} display
     */
    function setcurrentDisplay(display) {
        my.currentDisplay = display;
    }

    /**Handles removal of all internal items of display/wrapper to call remove display
     * @method removeHelper
     */
    function removeHelper() {
        // if last display is deleted on a track and track has attached inks, remind user that inks will not function and offer undo option
        var len;
        if (that.getStorageContainer().displayTree.isSolo() && my.attachedInks.length > 0) {
            menu.forceClose();
            my.timeline.confirmDeleteDisableInk(my.title, that, my);
        } else {
            len = removeAttachedInkDisplays();
            removeDisplay(true);
            if (len > 0) {
                my.undoManager.combineLast(len + 1);
            }
        }
    }

    /**remove all attached ink displays when a display is removed
     * @method removeAttachedInkDisplay
     * @return {Number} len         length of the attached array
     */
    function removeAttachedInkDisplays() {
        var attachedDisplays = getChildDisplays(),
            i,
            len = attachedDisplays.length;
        for (i = 0; i < len; i++) {
            attachedDisplays[i].removeDisplay(true);
        }
        return len;                                                         // tells us whether we should combineLast after removing display
    }

    /**Removes the display.
     * @method removeDisplay
     * @param {Boolean} acted     whether the user directly removed the display / if a command should be logged.
     */
    function removeDisplay(acted) {
        menu.forceClose(true);
        var oldkfTree = currkeyframes.clone();
        var oldParentDisplay;
        var command;

        if (parentDisplay) {
            oldParentDisplay = parentDisplay;
        }
        command = LADS.TourAuthoring.Command({
            execute: function () {
                dispRemoved = true;
                dataHolder.removeDisplay(my.that.getPos(), that);
                currkeyframes.clear(function (keyframe) {
                    keyframe._value.removeHelper();
                });
                mainDisplay.remove();
                fadeOutDisplay.remove();
                fadeInDisplay.remove();
                fadeOutHandle.remove();
                fadeInHandle.remove();
                my.update();
            },
            unexecute: function () {
                var newDisplay,
                    kfs;
                dispRemoved = false;
                initVisuals();
                newDisplay = dataHolder.addDisplay(my.that.getPos(), that);
                dataHolder.replaceKeyframes(newDisplay.display, oldkfTree);
                kfs = dataHolder.getKeyframes(newDisplay);
                kfs._root && kfs._root.traverse(REACTIVATE);
                my.update();
            }
        });
        command.execute();
        if (acted) {
            my.undoManager.logCommand(command);
            console.log('logging');
        }
    }
 
    /**Reactivate keyframe
     * @method REACTIVATE
     * @param {KeyFrame} kf
     */
    function REACTIVATE(kf) {
        kf._value.reactivateKeyframe();
    }

    /**Return the boolean which tells if a display is there or not
     * @method getRemoved
     * @return {Boolean} dispRemoved
     */
    function getRemoved() {
        return dispRemoved;
    }

    /**Reloads the display when removed
     * @method reloadDisplay
     */
    function reloadDisplay() {
        dataHolder.addDisplay(my.that.getPos(), that);
        resetVisuals();
        my.update();
    }

    ///////////////////////
    // Setters + Getters //
    ///////////////////////

    /**Returns the new state of the display
     * @method getClampedNew
     * @return {Object} clamped_new
     */
    function getclampedNew() {
        return clamped_new;
    }

    /**Returns old/current state of display
     * @method getclampedInit
     * @return {Object} clamped_init
     */
    function getclampedInit() {
        return clamped_init;
    }

    /**Returns the boolean checking if the display state has been changed
     * @method getHasBeenClamped
     * @return {Boolean} has_been_clamped
     */
    function getHasBeenClamped() {
        return has_been_clamped;
    }

    /**Accessor for the variable used by tracks to know about their inks
     * @method getChildDisplays
     * @return {Array} childDisplays
     */
    function getChildDisplays() {
        return childDisplays;
    }

    /**Returns the start time of the display
     * @method getStart
     * @return {Time} inStart    Start of display block in sec
     */
    function getStart() {
        return inStart;
    }

    /**Returns end time of the display
     * @method getEnd
     * @return {Time} end time          End of display block in sec
     */
    function getEnd() {
        return outStart + fadeOut;
    }

    /**Returns the main start of the display excluding fade-in
     * @method getMainStart
     * @return {Time} mainStart
     */
    function getMainStart() {
        return mainStart;
    }

    /**Returns the running time of the display
     * @method getMain
     * @return {Time} main
     */
    function getMain() {
        return main;
    }

    /**Returns the end time of the display
     * @method getOutStart
     * @return {Time} outStart
     */
    function getOutStart() {
        return outStart;
    }

    /**Returns the fade-in time of the display
     * @method getFadeIn
     * @return {Time} fadeIn
     */
    function getFadeIn() {
        return fadeIn;
    }

    /**Returns the fade-out time of the display
     * @method getFadeOut
     * @return {Time} fadeOut
     */
    function getFadeOut() {
        return fadeOut;
    }

    /**Returns the total duration of the display
     * @method getTotalLength
     * @return {Time} totalLength
     */
    function getTotalLength() {
        return totalLength;
    }

    /**Sets the current keyframe
     * @method setkeyframeTree
     * @param {Keyframe} kft    new value of currentkeyframes
     */
    function setKeyframeTree(kft) {
        currkeyframes = kft;
    }

    /**Accessor for the display's id
     * @method getID
     * @return {Number} id     Numerical ID of display
     */
    function getID() {
        return id;
    }

    /**New ID for display
     * @method setID
     * @param {Number} newid
     */
    function setID(newid) {
        id = newid;
    }

    /**Accessor for the storage container
     * @method getStorageContainer
     * @return {HTML Element} storageContainer
     */
    function getStorageContainer() {
        return storageContainer;
    }

    /**Set the storage container
     * @method setStorageContainer
     * @param {HTML Element} container
     */
    function setStorageContainer(container) {
        storageContainer = container;
    }

    /**Returns current track
     * @method getTrack
     * @return {Object} Track that the display is in
     */
    function getTrack() {
        return my.that;
    }

    /**Returns length of the media
     * @method getMediaLength
     * @return {Number} length          media length
     */
    function getMediaLength() {
        return parseFloat(my.mediaLength);
    }

    /**returns type property
     * @method getType
     * @return {Type} my.type 
     */
    function getType() {
        return my.type;
    }

    /**Returns location of the display
     * @method getLoc
     * @return {} loc
     */
    function getLoc() {
        return loc;
    }

    /**Sets the start/end etc times for a display
     * @method setTimes
     * @param {Display} obj       track to be displayed
     */
    function setTimes(obj) {
        setInStart(obj.inStart);
        setOutStart(obj.outStart);
        setMainStart(obj.inStart + obj.fadeIn);//main = obj.main;
        setMain(obj.main);
        setIn(obj.fadeIn);
        setOut(obj.fadeOut);
    }
    
    /**Sets default display timings
     * @method basicSetTimes
     * @param {Object} input
     */
    function basicSetTimes(input) {
        inStart = input.inStart;
        outStart = input.outStart;
        mainStart = input.inStart + input.fadeIn;
        main = input.main;
        fadeIn = input.fadeIn;
        fadeOut = input.fadeOut;
        resetVisuals();
    }
    
    /**Returns the display's time properties
     * @method getTimes
     * @return {Object} object      contains time properties
     */
    function getTimes() {
        return {
            inStart: inStart,
            outStart: outStart,
            fadeIn: fadeIn,
            main: main,
            mainStart: mainStart,
            fadeOut: fadeOut
        };
    }
    
    /**updates track display times
     * @method updateDispTimes
     * @param {Time} offset
     */
    function updateDispTimes(offset) {
        mainStart += offset;
        inStart += offset;
        outStart += offset;
        resetVisuals();
        _moveAllKeyframes(offset);
    }

    /**reset visual display to initial state
     * @method resetVisuals
     */
    function resetVisuals() {
        fadeInDisplay.css('left', T2P(inStart) + "px");
        mainDisplay.css('left', T2P(mainStart) + "px");
        fadeOutDisplay.css('left', T2P(outStart) + "px");
        fadeInHandle.css('left', T2P(inStart) - 20 + "px");
        fadeOutHandle.css('left', T2P(outStart + fadeOut) - 20 + "px");

        // need to re-add all elements - figure out where they're originally added to
        my.track.append(mainDisplay).append(fadeInDisplay).append(fadeOutDisplay).append(fadeInHandle).append(fadeOutHandle);
        fadeInDisplay.show();
        mainDisplay.show();
        fadeOutDisplay.show();
        fadeInHandle.show();
        fadeOutHandle.show();
    }
    
    /**Set the main part of display to a new time
     * @method setMainStart
     * @param {Time} newmainStart       new time for mainStart
     * @trans {Time} trans              translation display has been dragged
     */
    function setMainStart(newmainStart, trans) {
        mainStart = newmainStart;
        inStart = mainStart - fadeIn;
        outStart = mainStart + main;
        resetVisuals();
        _moveAllKeyframes(trans);
    }

    /**sets the end time for track
     * @method setEnd
     * @param {Time} time       the end time
     */
    function setEnd(time) {
        outStart = time;
    }

    ///////////////////////////////////////////////////////////////////
    //                    xiaoyi & libby                             //
    //these are helper methods for msMove to reset the graphic info. //
    //called when you are changing the fadein                        //
    ///////////////////////////////////////////////////////////////////

    /**set the start time .. again? - surbhi madan  -- all these set times kind of functions .... -_-
     * @method setInStart
     * @param {Time} newinStart
     */
    function setInStart(newinStart) {
        inStart = newinStart;
        mainStart = inStart + fadeIn;
        main = outStart - mainStart;
        totalLength = outStart + fadeOut - newinStart;
        fadeInDisplay.css('left', T2P(newinStart) + "px");
        fadeInHandle.css('left', T2P(newinStart) - 20 + "px"); // DON'T HARDCODE TODO
        mainDisplay.css({
            'left': T2P(mainStart) + "px",
            'width': T2P(main) + "px"
        });
    }

    /**Called when fadeout is changed
     * @method setOutStart
     * @param {Time} newoutStart
     */
    function setOutStart(newoutStart) {
        main = newoutStart - mainStart;
        outStart = newoutStart;
        totalLength = newoutStart + fadeOut - inStart;
        fadeOutDisplay.css('left', T2P(newoutStart) + "px");
        fadeOutHandle.css('left', T2P(newoutStart + fadeOut) - 20 + "px");
        mainDisplay.css('width', T2P(main) + "px");
    }

    /**Called when main display time is changed
     * @method setMain
     * @param {Time} newm
     */
    function setMain(newm) {
        main = newm;
        outStart = mainStart + main;
        totalLength = outStart + fadeOut - inStart;
        fadeOutDisplay.css('left', T2P(outStart) + "px");
        fadeOutHandle.css('left', T2P(outStart + fadeOut) - 20 + "px");
        mainDisplay.css('width', T2P(main) + "px");
    }

    /**Set fade-in times
     * @method setIn
     * @param {Time} newin
     */
    function setIn(newin) {
        if (canFade) {
            fadeIn = newin;
            mainStart = inStart + fadeIn;
            totalLength = outStart + fadeOut - inStart;
            fadeInDisplay.css('left', T2P(inStart) + "px");
            fadeInDisplay.css('width', T2P(fadeIn) + "px");
            fadeInHandle.css('left', T2P(inStart) - 20 + "px");
            mainDisplay.css({
                'left': T2P(mainStart) + "px",
                'width': T2P(main) + "px"
            });
        } else { // just change total length
            setMain(main + newin);
        }
    }

    /**Set fade-out times
     * @method setOut
     * @param {Time} newout
     */
    function setOut(newout) {
        if (canFade) {
            fadeOut = newout;
            totalLength = outStart + fadeOut - inStart;
            fadeOutDisplay.css('width', T2P(fadeOut) + "px");
            fadeOutHandle.css('left', T2P(outStart + fadeOut) - 20 + "px");
        } else { // just change total length
            setMain(main + newout);
        }
    }

    /**Special setter that sets new start but preserves lengths
     * @method translateTo
     * @param {Time} newstart
     */
    function translateTo(newstart) {
        inStart = newstart;
        mainStart = inStart + fadeIn;
        outStart = main + mainStart;
        fadeInDisplay.css('left', T2P(inStart) + "px");
        fadeInHandle.css('left', T2P(inStart) - 20 + "px");
        mainDisplay.css('left', T2P(mainStart) + "px")
                   .css('width', T2P(main) + "px");
        fadeOutDisplay.css('left', T2P(outStart) + "px");
        fadeOutHandle.css('left', T2P(outStart + fadeOut) - 20 + "px");
    }

    
    /**Hide all the handles
     * @method suppressHandles
     */
    function suppressHandles() {
        if (my.that.getMinimizedState()) {
            fadeInHandle.hide();
            fadeOutHandle.hide();
            fadeInHandle.css('visibility', 'hidden');
            fadeOutHandle.css('visibility', 'hidden');
        }
    }

    ///////////
    // Logic //
    ///////////

    /**Logic for manipulation + dragging of displays
     * Moves display to an absolute position given in res
     * currentDisplay, offset, loc should be set, see _initSVG / _displayMousedown for details
     * Currently three different types of move, determined by loc variable
     * 1. loc === 'main': translates the entire display, preserves length
     * 2. loc === 'fade-in' or 'fade-out': drags only fade-in / fade-out region, start of other fade and lengths of fades remaines fixed, length of main area changes
     * @method move
     * @param {Event} res           event from makeManipulable, onManipulate
     * @param {Time}  leftbound     leftmost position display can move to in seconds (not required)
     * @param {Time}  rightbound    rightmost position display can move to in seconds (not required)
     * @param {Time}  displayIn     the position of a nearby display in the previous trac
     * @param {Time}  displayOut    the position of a nearby display in the next track
     */
    
    function move(res, leftbound, rightbound, displayIn, displayOut, inUndoRedo) {                  // This is too much logic *sigh* - Surbhi M.
        // If no bounds are set, display can be anywhere (except negative times)
        var duration = my.timeManager.getDuration();
        var attachedDisplays, i, maxTotalDispLength, parentArtDisplay, diff;
        var totalDispLength = 0;
        var leftLimit;
        var rightLimit;
        var currDisp;
        var newmainStart;
        var excludeRight;
        var excludeLeft;
        var mouseLoc;
        var startTime;
        var endTime;

        leftbound = leftbound || duration.start;
        rightbound = rightbound || duration.end;

        // no display in or out, set to -1
        displayIn = displayIn || -1;
        displayOut = displayOut || -1;

        // error checking
        if (!loc || (offset !== 0 && !offset) || !my.currentDisplay) {                              // need that extra offset = 0 check since 0 and null are equal, arg
            console.log('Move display called when no display is selected!');
        } else if (loc === LADS.TourAuthoring.DisplayParts['fade-in']) {                            // Drag fade-in section to adjust length
            if (displayIn !== -1) {
                inStart = displayIn;
            } else {
                if (!inUndoRedo && (my.type === LADS.TourAuthoring.TrackType.ink && my.inkEnabled)) { // constrain ink movement
                    parentArtDisplay = getParentDisplay();
                    leftbound = Math.max(leftbound, parentArtDisplay.getStart() + LADS.TourAuthoring.Constants.inkTrackOffset);
                } else if (!inUndoRedo && (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image)) {
                    attachedDisplays = getChildDisplays();
                    totalDispLength = getLongestSubgroup(attachedDisplays);
                } else if (my.type === LADS.TourAuthoring.TrackType.video || my.type === LADS.TourAuthoring.TrackType.audio) {
                    if (my.mediaLength) {
                        maxTotalDispLength = parseFloat(my.mediaLength);
                        leftLimit = outStart + fadeOut - maxTotalDispLength;
                        leftbound = Math.max(leftbound, leftLimit);
                    }
                }
                diff = my.timeManager.pxToTime(res.pivot.x - offset);                                   // note this is defined in LADS.Util
                if (getEnd() - diff >= totalDispLength) {
                    if (fadeIn === 0 && fadeOut === 0) {
                        inStart = Math.constrain(diff,
                                        leftbound, // min
                                        Math.min(my.timeManager.pxToTime(parseFloat(fadeOutHandle.css('left')) + 20 - 2 * LADS.TourAuthoring.Constants.fadeBtnSize), // max is one of two values
                                            ((!currkeyframes.isEmpty() && (currkeyframes.min().getTime() - my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize + LADS.TourAuthoring.Constants.keyframeStrokeW + LADS.TourAuthoring.Constants.fadeBtnSize))) || Infinity)));
                    } else {
                        inStart = Math.constrain(my.timeManager.pxToTime(res.pivot.x - offset),         // note this is defined in LADS.Util
                                            leftbound, // min
                                            Math.min(outStart - fadeIn - 0.1,                           //make sure the fadein and fadeout handlers are overlapping
                                                ((!currkeyframes.isEmpty() && (currkeyframes.min().getTime() - my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize + LADS.TourAuthoring.Constants.keyframeStrokeW + LADS.TourAuthoring.Constants.fadeBtnSize))) || Infinity)));
                    }
                    if (!inUndoRedo && (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image)) {
                        for (i = 0; i < attachedDisplays.length; i++) {
                            clampDisplay(attachedDisplays[i]);
                        }
                    }
                }
            }
            setInStart(inStart);
        } else if (loc === LADS.TourAuthoring.DisplayParts['fade-out']) {                               // Drag fade-out section to adjust length
            if (displayOut !== -1) {
                outStart = displayOut;
            } else {
                if (!inUndoRedo && (my.type === LADS.TourAuthoring.TrackType.ink && my.inkEnabled)) {   // constrain ink movement
                    parentArtDisplay = getParentDisplay();
                    rightbound = Math.min(rightbound, parentArtDisplay.getOutStart() + parentArtDisplay.getFadeOut());
                } else if (!inUndoRedo && (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image)) {
                    attachedDisplays = getChildDisplays();
                    totalDispLength = getLongestSubgroup(attachedDisplays);
                } else if (my.type === LADS.TourAuthoring.TrackType.video || my.type === LADS.TourAuthoring.TrackType.audio) {
                    if (my.mediaLength) {
                        maxTotalDispLength = parseFloat(my.mediaLength);
                        rightLimit = inStart + maxTotalDispLength;
                        rightbound = Math.min(rightbound, rightLimit);
                    }
                }
                diff = my.timeManager.pxToTime(res.pivot.x - offset);                                   // note this is defined in LADS.Util
                if (diff + fadeOut - getStart() >= totalDispLength) {
                    if (fadeIn === 0 && fadeOut === 0) {
                        outStart = Math.constrain(diff,
                                        Math.max(my.timeManager.pxToTime(parseFloat(fadeInHandle.css('left')) + 20) + my.timeManager.pxToTime(2 * LADS.TourAuthoring.Constants.fadeBtnSize),
                                            ((!currkeyframes.isEmpty() && (currkeyframes.max().getTime() - fadeOut + my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize + LADS.TourAuthoring.Constants.keyframeStrokeW + LADS.TourAuthoring.Constants.fadeBtnSize))) || -Infinity)),
                                        rightbound - fadeOut);                                          // max
                    } else {
                        outStart = Math.constrain(diff,
                                        Math.max(inStart + fadeIn + 0.1,
                                            ((!currkeyframes.isEmpty() && (currkeyframes.max().getTime() - fadeOut + my.timeManager.pxToTime(LADS.TourAuthoring.Constants.keyframeSize + LADS.TourAuthoring.Constants.keyframeStrokeW + LADS.TourAuthoring.Constants.fadeBtnSize))) || -Infinity)),
                                        rightbound - fadeOut);                                          // max
                    }
                    if (!inUndoRedo && (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image)) {
                        for (i = 0; i < attachedDisplays.length; i++) {
                            clampDisplay(attachedDisplays[i]);
                        }
                    }
                }
            }       //first term is current position, second is either the end of the fadeIn or the point when the end circle collides with the last keyframe, last term is the end of the tour. First term is constrained between the second two
            setOutStart(outStart);
        } else if (loc === LADS.TourAuthoring.DisplayParts['main']) {                                   // Drag whole display, preserve length
            // in here, we want to take care of constraining attached ink display dragging to its artwork display (leftbound = max(leftbound, left bound of attached artwork display), rightbound = .... )
            // also, take care of moving ink displays with artwork displays if need be 
            currDisp = null;
            if (!inUndoRedo && (my.type === LADS.TourAuthoring.TrackType.ink && my.inkEnabled)) {       // constrain ink movement
                parentArtDisplay = getParentDisplay();
                rightbound = Math.min(rightbound, parentArtDisplay.getOutStart() + parentArtDisplay.getFadeOut());
                leftbound = Math.max(leftbound, parentArtDisplay.getStart() + LADS.TourAuthoring.Constants.inkTrackOffset);
            } else if (!inUndoRedo && (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image)) {
                attachedDisplays = getChildDisplays();
            }

            newmainStart = Math.constrain(my.timeManager.pxToTime(res.pivot.x - offset),
                                        leftbound + fadeIn,
                                        rightbound - fadeOut - main),
            translation = newmainStart - mainStart;
            setMainStart(newmainStart, translation);
            /*********************display snapping stuff***********************/

            excludeRight = null;                                                                        //parent display's (if it exists) end time
            excludeLeft = null;                                                                         //parent display's (if it exists) start time

            if (my.type === LADS.TourAuthoring.TrackType.ink && my.inkEnabled) {                        //if display is an ink
                excludeRight = getParentDisplay().getEnd();                                             //get parent display's end time
                excludeLeft = getParentDisplay().getStart();                                            //get parent display's start time
            }

            //display movement should already be set above so mouseLoc should only be used to determine dragging to the right or to the left
            mouseLoc = my.timeManager.pxToTime(res.pivot.x - offset);                                   // where the start of the display would be based on mouse position alone

            startTime = getStart();                                                                     //start time of display
            endTime = getEnd();                                                                         //end time of display

            // +/- 0.001 to startTime to offset the startTime since it is being set above
            if (mouseLoc > startTime - 0.001) {
                frontSnap(excludeRight);
            } else if (mouseLoc < startTime + 0.001) {
                backSnap(excludeLeft);
            }

            /********************************************/

            if (!inUndoRedo && (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.image)) {
                for (i = 0; i < attachedDisplays.length; i++) {
                    clampDisplay(attachedDisplays[i]);
                }
            }
        } else {
            console.log('currentDisplay.loc should be one of: \'fade-in\', \'fade-out\', or \'main\'');
        }
        that.outStart = outStart;                                                                       //bleveque -- added for edit ink
        that.inStart = inStart;
        my.that.drawLines();
    }

    /**Sets parent display, used only by ink tracks
     * @method setParentDisplay
     * @param {Object} display
     */
    function setParentDisplay(display) {
        parentDisplay = display;
    }

    /**Returns parent display, used only by ink tracks
     * @method getParentDisplay
     * @return {Object} parentDisplay
     */
    function getParentDisplay() {
        return parentDisplay;
    }

    /**Returns mainDisplay
     * @method getMainDisplay
     * @return {HTML Element} mainDisplay
     */
    function getMainDisplay() {
        return mainDisplay;
    }

    /**Returns the fade in resizing handle for a display
     * @method getFadeInHandle
     * @return fadeInHandle
     */
    function getFadeInHandle() {
        return fadeInHandle;
    }

    /**Returns the fade out resizing handle for a display
     * @method getFadeOutHandle
     * @return fadeOutHandle
     */
    function getFadeOutHandle() {
        return fadeOutHandle;
    }

    /**Returns the length of the longest total collection of subdisplays
     * @method getLongestSubGroup
     * @param {Array} gp    collection of subdisplays
     * @return {Number} length      
     */
    function getLongestSubgroup(gp) {
        var lens = {};
        var currmax = 0;
        var title;
        for (var i = 0; i < gp.length; i++) {
            title = gp[i].getTrack().getTitle();
            lens[title] = (typeof lens[title] === 'number' ? lens[title] : 0) + (gp[i].getRemoved() ? 0 : gp[i].getEnd() - gp[i].getStart());
            if (lens[title] > currmax)
                currmax = lens[title];
        }
        return currmax + LADS.TourAuthoring.Constants.inkTrackOffset; //add for offset
    }

    /**Gets the attached ink displays residing within the bounds of the current display
     * @method getAllChildDisplays
     * @return {Array} attachedDisplays
     */
    function getAllChildDisplays() {
        var attachedDisplays = [];
        var attachedInkDisps;
        var i;

        // first get the attached inks
        var attached = [];
        var tracks = dataHolder.getTracks();
        var attachedInk;
        var currDisp;

        for (i = 0; i < tracks.length ; i++) {
            if (tracks[i].track.getType() === LADS.TourAuthoring.TrackType.ink && tracks[i].track.getInkEnabled() && tracks[i].track.getInkLink().getTitle() === my.title)
                attached.push(tracks[i]);
        }
        for (i = 0; i < attached.length; i++) {
            // for each attached ink track, we want to see if we should move it with the new movement
            attachedInk = attached[i],
            attachedInkDisps = attachedInk.displays.getContents();

            for (var j = 0; j < attachedInkDisps.length; j++) {
                currDisp = attachedInkDisps[j].display;
                if ((currDisp.getOutStart() <= outStart + fadeOut) && (currDisp.getOutStart() >= inStart)) { // test if ink display is inside our display
                    attachedDisplays.push(currDisp);
                }
            }
        }
        return attachedDisplays;
    }
        
    /**Takes current track and builds an AVLTree -> Doubly Linked List to 
     * hold times to which the current display can snap 
     * @method initSnap
     */
    function initSnap() {
        var hostPos = that.getStorageContainer().hostTrack.getPos();
        var excludables = null;                                                                                 //hashtable with all times of attached ink to exclude from the snappable times list
        var snapTree;

        if (!(my.type === LADS.TourAuthoring.TrackType.ink && my.inkEnabled)) {                                 //if current display is not an ink
            excludables = buildExcludables(hostPos);
        }

        //build snappable times list
        snapTree = buildSnapTree(hostPos, excludables);
        snapTimesDLL = buildSnapDLL(snapTree);

        //fadeInDisplay bounds of adjacent displays
        nextDisplay = dataHolder.findNextDisplay(hostPos, that);
        prevDisplay = dataHolder.findPreviousDisplay(hostPos, that);
    }

    /**Loop through all attached displays and insert start and end times into the excludables HashTable. Then return the table
     * @method 
     * @return {HashTable} excludables
     */
    var buildExcludables = function () {
        var attachedDisplays = getAllChildDisplays();
        var excludables = new HashTable();

        for (var i = 0; i < attachedDisplays.length ; i++) {
            excludables.insert(attachedDisplays[i].getStart(), 1);
            excludables.insert(attachedDisplays[i].getEnd(), 1);
        }

        //if nothing is being added to the excludables table, return null
        if (excludables.getLength() === 0) {
            return null;
        }
        return excludables;
    }


    /**Local AVLTree comparator
     * @method
     * @return {Number} comparator value
     */
    var comparator = function (a, b) {
        if (a.key < b.key) {
            return -1;
        } else if (a.key > b.key) {
            return 1;
        } else {
            return 0;
        }
    };

    /**Local AVLTree valuation
     * @method
     * @return {Number} 
     */
    var valuation = function (value, compareToNode) {
        if (!compareToNode) {
            return null;
        } else if (value < compareToNode.key) {
            return -1;
        } else if (value > compareToNode.key) {
            return 1;
        } else {
            return 0;
        }
    }

    /**For each display in the track, add the start and end time into the list if it is not in excludables HashTable
     * @method addTimeNode
     * @param {Array} displays                              the array of displays in a track
     * @param {AVLTree} localTree                           AVLTreein which display times are to be added
     * @param {HashTable} excludables                       hashtable storing the times
     */
    function addTimeNode(displays, localTree, excludables) {
        if (excludables) {                                  // only checks with excludables if it exists
            for (var i = 0; i < displays.length ; i++) {
                if (!excludables.lookup(displays[i].display.getStart())) {
                    localTree.add({ key: displays[i].display.getStart() });
                }
                if (!excludables.lookup(displays[i].display.getEnd())) {
                    localTree.add({ key: displays[i].display.getEnd() });
                }
            }
        } else {
            for (var i = 0; i < displays.length ; i++) {
                localTree.add({ key: displays[i].display.getStart() });
                localTree.add({ key: displays[i].display.getEnd() });
            }
        }
    }

    /**Takes the track above and below the current display's track and builds the AVLTree (sorted) for the times
     * @method buildSnapTree
     * @param {Number} hostPos
     * @param {HashTable} excludables
     * @return {AVLTree} localTree
     */
    function buildSnapTree(hostPos, excludables) {
        var p1 = (hostPos - 1 >= 0) ? (hostPos - 1) : null,
            n1 = (hostPos + 1 < dataHolder.numTracks()) ? (hostPos + 1) : null;
        var localTree = new AVLTree(comparator, valuation);
        var tracks = dataHolder.getTracks();

        if (p1 != null) {
            addTimeNode(tracks[p1].displays.getContents(), localTree, excludables);
        }
        if (n1 != null) {
            addTimeNode(tracks[n1].displays.getContents(), localTree, excludables);
        }
        return localTree;
    }

    /**Converts the AVLTree of snappable times to a doubly linked list
     * @method buildSnapDLL
     * @param {AVLTree} snapTree                           tree holding snappable times
     * @return {List} snapTimes                            list to put the times into
     */
    function buildSnapDLL(snapTree) {
        var treeTimes = snapTree.getContents();
        var snapTimes = new DoublyLinkedList();

        for (var i = 0; i < treeTimes.length ; i++) {
            snapTimes.append(treeTimes[i].key);
        }
        return snapTimes;
    }

    /**Returns if the time difference is within snappable range - using pixels
     * @method withinSnapRange
     * @param {Time} diff                                  time difference 
     * @return {Boolean} true/false                        
     */
    function withinSnapRange(diff) {
        var pxDiff = my.timeManager.timeToPx(diff);
        if (pxDiff < $(window).width() * 0.01 && pxDiff > 0) {
            return true;
        }
        return false;
    }

    /**Completes display snapping to the right
     * @method frontSnap
     * @param {Time} excludeRight       start time of the next display (if it exists) of the current display
     */
    function frontSnap(excludeRight) {
        var startTime = getStart();
        var endTime = getEnd();
        var startNextNode = snapTimesDLL.findNext(startTime);      // the next time that the current display could possibly snap to relative to the startTime of the current display
        var endNextNode = snapTimesDLL.findNext(endTime);          // the next time that the current display could possibly snap to relative to the endTime of the current display
        var snapped = false;                                                //keeps track of if the end of the current display has snapped to the next snappable time
        var endRightDiff;
        var startRightDiff;

        if (excludeRight && endNextNode && endNextNode.data === excludeRight) {
            // do nothing
        } else {
            if (endNextNode !== null) {
                endRightDiff = endNextNode.data - (inStart + that.getTotalLength());
                if (!withinSnapRange(endRightDiff) || (excludeRight && (endTime + endRightDiff) > excludeRight)) {
                    //do nothing if it's not suppose to snap
                } else {
                    if (nextDisplay && (nextDisplay.display.getStart() - endTime) >= endRightDiff) {
                        updateDispTimes(endRightDiff);
                        snapped = true;
                    } else if (!nextDisplay) {
                        updateDispTimes(endRightDiff);
                        snapped = true;
                    }
                }
            }
        }

        if (excludeRight && startNextNode && startNextNode.data === excludeRight) {
            return;                                                         //does not snap if snaps to it's own display
        } else {
            if (startNextNode != null) {
                startRightDiff = startNextNode.data - startTime
                if (!withinSnapRange(startRightDiff) || (excludeRight && (endTime + startRightDiff) > excludeRight) || (endTime + startRightDiff > my.timeManager.getDuration().end)) {
                    //do nothing if it's not suppose to snap
                } else {
                    if (snapped === false) {
                        if (nextDisplay && (nextDisplay.display.getStart() - endTime) >= startRightDiff) {
                            updateDispTimes(startRightDiff);
                        } else if (!nextDisplay) {
                            updateDispTimes(startRightDiff);
                        }
                    }
                }
            }
        }
    }

    /**Completes display snapping to the left
     * @method backSnap
     * @param {Time} excludeLeft    start time of the prev display (if it exists) of the current display   
     */
    function backSnap(excludeLeft) {
        var startTime = getStart();
        var endTime = getEnd();
        var startLeftNode = snapTimesDLL.findPrev(startTime);
        var endLeftNode = snapTimesDLL.findPrev(endTime);
        var snapped = false;
        var startLeftDiff;
        var endLeftDiff;

        if (excludeLeft && startLeftNode && startLeftNode.data === excludeLeft) {
            //does not snap if it's its own display
        } else {
            if (startLeftNode != null) {
                startLeftDiff = startTime - startLeftNode.data
                if (!withinSnapRange(startLeftDiff) || (excludeLeft && (startTime - startLeftDiff) < excludeLeft)) {
                    //do nothing 
                } else {
                    if (prevDisplay && (prevDisplay.display.getEnd() - startTime) >= startLeftDiff) {
                        updateDispTimes((-1) * startLeftDiff);
                        snapped = true;
                    } else if (!prevDisplay) {
                        updateDispTimes((-1) * startLeftDiff);
                        snapped = true;
                    }
                }
            }
        }

        if (excludeLeft && endLeftNode && endLeftNode.data === excludeLeft) {
            //does not snap if it's its own display so therefore do nothing lolols
        } else {
            if (endLeftNode != null) {
                endLeftDiff = (inStart + that.getTotalLength()) - endLeftNode.data;
                if (!withinSnapRange(endLeftDiff) || (excludeLeft && (startTime - endLeftDiff) < excludeLeft) || (startTime - endLeftDiff < 0)) {
                    //do nothing 
                } else {
                    if (snapped === false) {
                        if (prevDisplay && (prevDisplay.display.getEnd() - startTime) >= endLeftDiff) {
                            updateDispTimes((-1) * endLeftDiff);
                        } else if (!prevDisplay) {
                            updateDispTimes((-1) * endLeftDiff);
                        }
                    }
                }
            }
        }
    }
    /*********** end of displaySnapping *************/

    /**Accepts a display that should be clamped to the current display (i.e. if it sticks out, move it in)
     * @method clampDisplay
     * @param disp     the display to clamp
     */
    function clampDisplay(disp) {
        // we should check first the start, move in, then end, move in, then clamp
        var dInStart = disp.getStart(),
            dOutEnd = disp.getEnd(),
            dMain = disp.getMain(),
            dFadeIn = disp.getFadeIn(),
            dFadeOut = disp.getFadeOut(),
            coDisplays = disp.getStorageContainer().displayTree,
            newStart = dInStart, newEnd = dOutEnd, newMain = dMain, delta, dirty = false;

        if (dInStart < inStart + LADS.TourAuthoring.Constants.inkTrackOffset) {                         // first check if the ink display starts too early
            slideDisplay(disp, coDisplays, 'right', inStart + LADS.TourAuthoring.Constants.inkTrackOffset);
        }
        if (newEnd > outStart + fadeOut) {                                                              // next check if the ink display finishes too late
            slideDisplay(disp, coDisplays, 'left', outStart + fadeOut);
        }
    }
   
    /**slide the display to make room for the prev/next display
     * @method slideDisplay
     * @param disp
     * @param {AVLTree} displayTree     tree containing display times
     * @param {String} direction        whether to slide left or right
     * @param {Time} bound              
     */
    function slideDisplay(disp, displayTree, direction, bound) {
        // we can always move in, since we check beforehand that there's enough room
        var newStart,
            newEnd,
            newMain;
        var oldStart = disp.getStart(),
            oldEnd = disp.getEnd(),
            oldMain = disp.getMain();
        var fout = disp.getFadeOut(),
            fin = disp.getFadeIn();
        var diff;
        var nextDisp;
        var prevDisp;

        if (!disp.has_been_clamped) {
            disp.clamped_init = {
                inStart: oldStart,
                outStart: oldEnd - fout,
                main: oldMain,
                fadeIn: fin,
                fadeOut: fout,
            };
            disp.has_been_clamped = true; //this will be reset to false in the mouseup handler
            my.timeline.getClampedDisplays().push(disp);
        }
        if (direction === 'right') {
            diff = bound - oldStart;
            newStart = bound;
            newEnd = oldEnd + diff;
            newMain = oldMain;
            disp.setInStart(newStart);
            disp.setOutStart(newEnd - fout);
            disp.setMain(newMain);
            disp.clamped_new = {
                inStart: newStart,
                outStart: newEnd - fout,
                main: newMain,
                fadeIn: fin,
                fadeOut: fout,
            };

            nextDisp = displayTree.findNext(disp.getStorageContainer());
            if (nextDisp && nextDisp.display.getStart() < newEnd) {
                slideDisplay(nextDisp.display, displayTree, 'right', newEnd);
            }
        } else {
            diff = oldEnd - bound;
            newEnd = bound;
            newStart = oldStart - diff;
            newMain = oldMain;
            disp.setInStart(newStart);
            disp.setOutStart(newEnd - fout);
            disp.setMain(newMain);
            disp.clamped_new = {
                inStart: newStart,
                outStart: newEnd - fout,
                main: newMain,
                fadeIn: fin,
                fadeOut: fout,
            };
            prevDisp = displayTree.findPrevious(disp.getStorageContainer());
            if (prevDisp && prevDisp.display.getEnd() > newStart) {
                slideDisplay(prevDisp.display, displayTree, 'left', newStart);
            }
        }
    }
    
    /**************************Xiaoyi/Libby**************************/
    /**get the translation of the clicked display when manipulated. constrained by the bounds
     * @method getTranslation
     * @param res              mouse movement, the rest are the bounds 
     * @param {Time} leftbound          bound on start time ?
     * @param {Time} righbound          bound on end time ?
     * @param {Time} fadeinrightbound   bound on fade-in time
     * @param {Time} fadeoutleftbound   bound on fadeout time
     * @return {Time} translation
     */
    function getTranslation(res, leftbound, rightbound, fadeinrightbound, fadeoutleftbound) {
        var translation;
        var newinStart;
        var newoutStart;
        var newmainStart;

        if (!loc || (offset !== 0 && !offset) || !my.currentDisplay) {                                      // need that extra offset = 0 check since 0 and null are equal, arg
            console.log('Move display called when no display is selected!');
        } else if (loc === LADS.TourAuthoring.DisplayParts['fade-in']) {
            newinStart = Math.constrain(my.timeManager.pxToTime(res.pivot.x - offset),                  // note this is defined in LADS.Util
                                      leftbound,                                                            // min
                                      inStart + fadeinrightbound);
            translation = newinStart - inStart;
        } else if (loc === LADS.TourAuthoring.DisplayParts['fade-out']) {                                   // Drag fade-out section to adjust length
            newoutStart = Math.constrain(my.timeManager.pxToTime(res.pivot.x - offset),
                              getEnd() - fadeoutleftbound - fadeOut,
                                rightbound - fadeOut);                                                      // max
            translation = newoutStart - outStart;
        } else if (loc === LADS.TourAuthoring.DisplayParts['main']) {
            newmainStart = Math.constrain(my.timeManager.pxToTime(res.pivot.x - offset),
                                        leftbound + fadeIn,
                                        rightbound - fadeOut - main);
            translation = newmainStart - mainStart;
        }
        return translation;
    }
    
    /**special move function for multi select mode 
     * @method msMove
     * @param {list} selectDisplays     list of the displays
     * @param {Time} translation        translation time of the clicked display
     * @param {Time} displayIn          
     * @param {Time} displayOut
     */
    function msMove(selectDisplays, translation, displayIn, displayOut) { // deal with ink track sliding in here if necessary
        var attachedDisplays,
            i,
            j,
            disp,
            totalDispLength = 0,
            msinStart,
            msOutStart,
            msmainStart,
            newmainStart;

        // no display in or out, set to -1
        displayIn = displayIn || -1;
        displayOut = displayOut || -1;

        if (!loc || (offset !== 0 && !offset)) { // need that extra offset = 0 check since 0 and null are equal, arg -- error checking
            console.log('Move display called when no display is selected!');
        } else if (loc === LADS.TourAuthoring.DisplayParts['fade-in']) { // Drag fade-in section to adjust length -- Actual Editing
            for (i = 0; i < selectDisplays.length; i++) {
                disp = selectDisplays[i];
                if (disp.getType() === LADS.TourAuthoring.TrackType.artwork || disp.getType() === LADS.TourAuthoring.TrackType.image) {
                    // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
                    attachedDisplays = disp.getChildDisplays();
                    totalDispLength = disp.getLongestSubgroup(attachedDisplays);
                }
                if (disp.getEnd() - translation >= totalDispLength) {
                    msinStart = disp.getStart();
                    if (displayIn !== -1) {
                        msinStart = displayIn;
                    } else {
                        msinStart = msinStart + translation;
                    }
                    disp.setInStart(msinStart);
                    if (disp.getType() === LADS.TourAuthoring.TrackType.artwork || disp.getType() === LADS.TourAuthoring.TrackType.image) {
                        for (j = 0; j < attachedDisplays.length; j++) {
                            if (selectDisplays.indexOf(attachedDisplays[j]) === -1) {
                                disp.clampDisplay(attachedDisplays[j]);
                            }
                        }
                    }
                }
            }
        } else if (loc === LADS.TourAuthoring.DisplayParts['fade-out']) { // Drag fade-out section to adjust length
            for (i = 0; i < selectDisplays.length; i++) {
                disp = selectDisplays[i];
                if (disp.getType() === LADS.TourAuthoring.TrackType.artwork || disp.getType() === LADS.TourAuthoring.TrackType.image) {
                    // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
                    attachedDisplays = disp.getChildDisplays();
                    totalDispLength = disp.getLongestSubgroup(attachedDisplays);
                }
                if (disp.getEnd() - translation >= totalDispLength) {
                    msOutStart = disp.getOutStart();
                    if (displayOut !== -1) {
                        outStart = displayOut;
                    } else {
                        msOutStart = msOutStart + translation;
                    }
                    disp.setOutStart(msOutStart);
                    if (disp.getType() === LADS.TourAuthoring.TrackType.artwork || disp.getType() === LADS.TourAuthoring.TrackType.image) {
                        for (j = 0; j < attachedDisplays.length; j++) {
                            if (selectDisplays.indexOf(attachedDisplays[j]) === -1) {
                                disp.clampDisplay(attachedDisplays[j]);
                            }
                        }
                    }
                }
            }
        } else if (loc === LADS.TourAuthoring.DisplayParts['main']) { // Drag whole display, preserve length
            for (i = 0; i < selectDisplays.length; i++) {
                disp = selectDisplays[i];
                if (disp.getType() === LADS.TourAuthoring.TrackType.artwork || disp.getType() === LADS.TourAuthoring.TrackType.image) {
                    // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
                    attachedDisplays = disp.getChildDisplays();
                    totalDispLength = disp.getLongestSubgroup(attachedDisplays);
                }
                msmainStart = disp.getMainStart();
                newmainStart = translation + msmainStart;
                disp.setMainStart(newmainStart, translation);
                if (disp.getType() === LADS.TourAuthoring.TrackType.artwork || disp.getType() === LADS.TourAuthoring.TrackType.image) {
                    for (j = 0; j < attachedDisplays.length; j++) {
                        if (selectDisplays.indexOf(attachedDisplays[j]) === -1) {
                            disp.clampDisplay(attachedDisplays[j]);
                        }
                    }
                }
                disp.getTrackFromDisplay().drawLines();
            }
        } else {
            console.log('currentDisplay.loc should be one of: \'fade-in\', \'fade-out\', or \'main\'');
        }
        that.outStart = outStart;   //bleveque -- added for edit ink
        that.inStart = inStart;
        my.that.drawLines();
    }
    that.msMove = msMove;

    /**access the track on which the current display is
     * @method getTrackFromDisplay
     * @return {Object} the current display object
     */
    function getTrackFromDisplay() {
        return my.that;
    }
    
    /**Used to debug move from command line
     * Flips internal state to simulate clicks
     * Resets state when finished
     * Use only in test code or functions inside display
     * @method internalMove
     * @param {Number} dx       pixel value - ?
     * @param {Time} left
     * @param {Time} right
     * @param {} dloc
     * @param {Number} doffset
     */
    function internalMove(dx, left, right, dloc, doffset) {
        var res = {
            pivot: {
                x: dx
            }
        };
        my.currentDisplay = that;
        loc = dloc;
        offset = doffset;
        move(res, left, right, -1, -1);

        // reset state
        my.currentDisplay = null;
        loc = null;
        offset = null;
    }
    
    /**Helper function for moving all keyframes when whole display is dragged
     * @method _moveAllKeyframes
     * @param {Time} translate     Amount (in time) to move keyframes by
     */
    function _moveAllKeyframes(translate) {
        currkeyframes.map(function (i) {
            i.translate(translate);
        });
    }

    /**Resets positioning and size of display
     * Called after zoom or scaling
     * @method scale
     */
    function scale() {
        if (T2P(inStart) < 1884 && T2P(inStart) > 1883) {
            console.log('');
        }
        outStart = inStart + fadeIn + main;
        fadeInDisplay.css('left', T2P(inStart) + "px")
                     .css('width', T2P(fadeIn) + "px");
        mainDisplay.css('left', T2P(mainStart) + "px")
                   .css('width', T2P(main) + "px");
        fadeOutDisplay.css('left', T2P(outStart) + "px")
                      .css('width', T2P(fadeOut) + "px");
        fadeInHandle.css('left', T2P(inStart) - 20 + "px");
        fadeOutHandle.css('left', T2P(outStart + fadeOut) - 20 + "px");
        currkeyframes.map(function (i) {
            i.scale();
        });
    }
    
    /**Adds a keyframe to the display / sequence
     * @method addKeyframe
     * @param {Number} x         x location in px
     * @param {Number} y         y location in px
     * @returns {LADS.TourAuthoring.Keyframe} keyframe
     */
    function addKeyframe(x, y) {
        if (canKeyframe) {
            var data = my.timeline.captureKeyframe(my.title),
                keyframe,
                command,
                i;
            var reloadingEvent;
            var keyspec = {
                loc: {
                    x: Math.twoDecPlaces(my.timeManager.pxToTime(x)),
                    y: (my.type === LADS.TourAuthoring.TrackType.audio) ? y : 48
                },
                keyFrameGroup: keyFrameGroup,
                display: that,
                data: data,
                displayDiv: mainDisplay
            };

            // check that you are not making a keyframe right on top of another
            var neighbors = currkeyframes.nearestNeighbors(keyspec.loc.x, 1);

            if ((neighbors[0] && Math.abs(neighbors[0].getTime() - keyspec.loc.x) < 0.05) ||
                  (neighbors[1] && Math.abs(neighbors[1].getTime() - keyspec.loc.x) < 0.05)) {
                return null;
            }

            keyframe = LADS.TourAuthoring.Keyframe(keyspec, my),
            command = LADS.TourAuthoring.Command({ // NOTE: don't execute command or call update! might screw up user editing
                execute: function () {
                    currkeyframes.add(keyframe);
                    keyframe.reactivateKeyframe();
                    keyframe.restoreHandlers();
                    my.that.addKeyframeToLines(keyframe);
                    my.update();
                },
                unexecute: function () {
                    keyframe.remove(false, true);
                    keyframe.setDeselected();
                    my.update();
                }
            });
            my.undoManager.logCommand(command);
            console.log('logging');
            currkeyframes.add(keyframe);

            if (my.that.getMinimizedState()) {
                keyframe.toggleCircle();
            }

            reloadingEvent = document.createEvent('Event');
            reloadingEvent.initEvent('playerReloading', true, true);
            $('body')[0].dispatchEvent(reloadingEvent);
            return keyframe;
        } else {
            return null;
        }
    }
    
    /**Function to remove keyframe from keyframe array
     * @method removeKeyframe
     * @param keyframe          to be removed from the array
     */
    function removeKeyframe(keyframe) {
        currkeyframes.remove(keyframe);
    }
    
    /**Function to add keyframe to keyframe array
     * @method insertKeyFrame
     * @param keyframe          to be added the array
     */
    function insertKeyframe(keyframe) {
        currkeyframes.add(keyframe);
    }
    
    /**Sorts the keyframe array
     * Must be called after a keyframe is moved, as keyframes can change order
     * @method sortKeyframes
     */
    function sortKeyframes() {
        var i;
        keyframes.sort(_keyframesort);
        for (i = 0; i < keyframes.length; i++) {
            keyframes[i].updatePosition(i);
        }
    }
    
    /**Get keyframes belonging to display
     * Used for fadeInDisplaying bounds of keyframe movement
     * @method getKeyframes
     * @return current set of key frames
     */
    function getKeyframes() {
        return currkeyframes;
    }
    
    /**Helper function for keeping keyframes sorted
     * Sorted in ascending order by x position (in time)
     * @method _keyframesort
     * @param a     keyframe
     * @param b     keyframe
     * @return {Number} result of the comparison
     */
    function _keyframesort(a, b) {
        if (a.getTime() < b.getTime()) {
            return -1;
        } else if (a.getTime() === b.getTime) {
            return 0;
        } else {
            return 1;
        }
    }

    /////////
    // RIN //
    /////////


    /**Converts Display to Experience Stream
     * @method toES
     * @param {Object}   data          new ES is inserted into this object
     * @param {Type}     type          type header identifying the type of ES / media
     * @param {Property} passthrough   whether this ES (layer) can be manipulated
     * @param prevState                final keyframe from previous display, defines start state for this display
     * @param {String}   id            id of the display         
     */
    function toES(data, passthrough, prevState, id) {
        var keySeq = {},
            esTitle = my.title + '-' + id;

        data.experienceStreams[esTitle] = {
            duration: main,
            data: {
                zIndex: my.timeline.getNumTracks() - my.that.getPos(),
                'layerProperties': {
                    'passthrough': passthrough
                }
            }
        };
        if (canFade) {
            data.experienceStreams[esTitle].data.transition = {
                providerId: "FadeInOutTransitionService",
                inDuration: fadeIn,
                outDuration: fadeOut
            };
        }

        // type specific edits
        switch (my.type) {
            case LADS.TourAuthoring.TrackType.artwork:
                data.experienceStreams[esTitle].data.ContentType = '<SingleDeepZoomImage/>';
                data.experienceStreams[esTitle].header = {};
                data.experienceStreams[esTitle].header.defaultKeyframeSequence = esTitle;
                data.experienceStreams[esTitle].keyframes = _getKeyframesRIN(prevState);
                break;
            case LADS.TourAuthoring.TrackType.image:
                data.experienceStreams[esTitle].header = {};
                data.experienceStreams[esTitle].header.defaultKeyframeSequence = esTitle;
                data.experienceStreams[esTitle].keyframes = _getKeyframesRIN(prevState);
                break;
            case LADS.TourAuthoring.TrackType.audio:
                data.experienceStreams[esTitle].header = {};
                data.experienceStreams[esTitle].header.defaultKeyframeSequence = esTitle;
                data.experienceStreams[esTitle].keyframes = _getKeyframesRIN(prevState);
                break;
            case LADS.TourAuthoring.TrackType.video:
                data.experienceStreams[esTitle].data.markers = {
                    'beginAt': 0,
                    'endAt': main
                };
                break;
            case LADS.TourAuthoring.TrackType.ink:
                break;
            default:
                console.log('RIN track type not yet implemented');
        }
    }
    
    /**Helper function for collecting RIN data of associated keyframes
     * @method _getKeyframesRIN
     * @param prevState         previous state of the display
     * @return {Array} rin
     */
    function _getKeyframesRIN(prevState) {
        var i,
            rin = [],
            first;
        var dispkfs = dataHolder.getKeyframes(that.getStorageContainer());
        var kfarray = dispkfs.getContents();

        if (kfarray.length > 0) {
            if (my.type === LADS.TourAuthoring.TrackType.artwork || my.type === LADS.TourAuthoring.TrackType.audio || my.type === LADS.TourAuthoring.TrackType.image) {
                // Copy first keyframe that appears in display and place copy at start
                // This means display will begin w/ state defined by first keyframe instead of jumping to it
                first = dispkfs.min().toRIN();
                first.offset = 0;
                first.init = true;
                rin.push(first);
            }
            dispkfs.map(function (i) {
                rin.push(i.toRIN());
            });

        } else if (prevState) { // If there are no keyframes but are in prev display
            first = prevState.toRIN();
            first.offset = 0;
            first.init = true;
            rin.push(first);
        } else if (my.type === LADS.TourAuthoring.TrackType.audio) {
            first = {
                offset: 0,
                init: true,
                holdDuration: 0,
                state: { // Need to determine where keyframe info is getting stored, also why does it need a media source?
                    'sound': {
                        'volume': LADS.TourAuthoring.Constants.defaultVolume
                    }
                }
            };
            rin.push(first);
        } else if (kfarray.length == 0) {
            console.log("capturing blank kf for reset");
            first = my.timeline.captureKeyframe(my.title);
            if (!first) {
                first = {
                    state: {
                        viewport: {
                            region: {
                                center: {
                                    x: 0,
                                    y: 0,
                                },
                                span: {
                                    x: 1,
                                    y: 1,
                                }
                            },
                        },
                    },
                };
            }
            first.offset = 0;
            first.init = true;
            rin.push(first);
        }
        return rin;
    }

    /**Constructs Screenplay entry from display
     * Returns object with begin, xml params so entries can be sorted
     * @method toScreenPlayEntry
     * @param i
     * @return {Object} spe
     */
    function toScreenPlayEntry(i) {
        var spe = {},
            esTitle = my.title + '-' + i;

        spe.experienceId = my.title;
        spe.experienceStreamId = esTitle;
        spe.begin = inStart;
        spe.duration = (fadeIn + main);
        spe.layer = 'foreground';
        spe.zIndex = dataHolder.numTracks() - my.that.getPos();
        if (my.type === LADS.TourAuthoring.TrackType.audio) {
            spe.dominantMedia = 'audio';
            spe.volume = 1;
        } else {
            spe.dominantMedia = 'visual';
            spe.volume = 1;
        }

        return spe;
    }
   
    return that;
};
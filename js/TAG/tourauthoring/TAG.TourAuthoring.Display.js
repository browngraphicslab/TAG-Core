TAG.Util.makeNamespace("TAG.TourAuthoring.Display");
TAG.Util.makeNamespace("TAG.TourAuthoring.DisplayParts");

TAG.TourAuthoring.DisplayParts = {
    main: 1,
    'fade-in': 2,
    'fade-out': 3
};

/**
 * Makes a display
 * Represents region of time where media is playing
 * Maps to Keyframe Sequence in RIN
 * Contains and manages keyframes added to sequence
 * @param spec  Params: start, length, fadeIn, fadeOut (all time values in seconds), id
 * @param my    Update currentDisplay for touch handling, contains timeManager, undoManager, svg, update
 */
TAG.TourAuthoring.Display = function (spec, my) {
    "use strict";
    if (my.type === TAG.TourAuthoring.TrackType.audio) {
        console.log('audio');
    }
    var that = {}, //values of display
        storageContainer, parentDisplay, // parentDisplay used only by ink
        inStart = spec.start || 0, // start of fade-in, start of entire display
        totalLength = spec.length || 5, // total length
        canKeyframe = spec.canKeyframe,
        canFade = spec.canFade,
        fadeIn = (canFade && totalLength >= 1.5) ? (spec.fadeIn || 0.5) : 0, // length of fade-in
        fadeOut = (canFade && totalLength >= 1.5) ? (spec.fadeOut || 0.5) : 0, // length of fade-out
        main = (totalLength - (fadeIn + fadeOut)),
        mainStart = (inStart + fadeIn), // start of main region
        outStart = (mainStart + main), // start of fade-out
        id,
        mainRect,
        trackPos,
        dataHolder = spec.dataHolder,
        //keyframes = [],
        currkeyframes,
        childDisplays = [], // used only by artworks to be aware of their inks
        menu = TAG.TourAuthoring.EditorMenu({
            type: TAG.TourAuthoring.MenuType.display,
            parent: that
        }, my);
 
    //use these for edit ink primarily -- we could also use getters so we don't have to use 'that.' all over the place -bleveque
    that.inStart = inStart;
    that.fadeIn = fadeIn;
    that.fadeOut = fadeOut;
    that.oldStart = outStart;
    //that.id = id || 0;
    that.clamped_new = {};
    that.clamped_init = {};
    that.has_been_clamped = false;

    // Add to SVG
    // Note: there is no "add" function, due to how SVG and d3 operates.
    var gv, // svg group containing display elements
        gkey, // svg group containing keyframe elements
        finD, // fade-in display box
        finHandle, // handle for resizing
        mainD, // main display box
        fioD, // fade-out display box
        fioHandle, // handle for resizing
        // last two used for mouse/touch handling
        loc, // region of display mouse/finger is clicked over
        offset, // offset of mouse/finger from beginning of region specified in loc
        hidden = false; // bool flag for whether circles are hidden, i.e. track is minimized

    var snapTimesDLL = new DoublyLinkedList(); //global snappable times list
    var dispNode;

    var T2P = my.timeManager.timeToPx,
        P2T = my.timeManager.pxToTime;

    function setKeyframeTree(kft) {
        currkeyframes = kft;
    }
    that.setKeyframeTree = setKeyframeTree;
    
    function getChildDisplays() {
        return childDisplays;
    }
    that.getChildDisplays = getChildDisplays;

    function addChildDisplay(newdisp) {
        childDisplays.push(newdisp);
    }
    that.addChildDisplay = addChildDisplay;

    function removeChildDisplay(toRemove) {
        childDisplays.splice(childDisplays.indexOf(toRemove), 1);
    }
    that.removeChildDisplay = removeChildDisplay;

    function initVisuals() {
        var displayDivs = TAG.Util.UI.createDisplay({
            x: T2P(inStart),
            fadeIn: T2P(fadeIn),
            fadeOut: T2P(fadeOut),
            mainLength: T2P(main),
            mainColor: canKeyframe ? (my.type === TAG.TourAuthoring.TrackType.audio ? 'rgba(129, 173, 98, 0.8)' : TAG.TourAuthoring.Constants.displayColor) : TAG.TourAuthoring.Constants.inkDisplayColor,
            fadeColor: null, // FIX THIS TODO
            height: null,
            container: my.track
        }); 

        mainD = displayDivs.mainRect;
        finD = displayDivs.inRect,
        fioD = displayDivs.outRect,
        finHandle = displayDivs.inHandle,
        fioHandle = displayDivs.outHandle;

        finD.on('mousedown', function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, TAG.TourAuthoring.DisplayParts['fade-in']);
        });
        mainD.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, TAG.TourAuthoring.DisplayParts['main']);
        });
        fioD.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, TAG.TourAuthoring.DisplayParts['fade-out']);
        });
        finHandle.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, TAG.TourAuthoring.DisplayParts['fade-in']);
        });
        fioHandle.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, TAG.TourAuthoring.DisplayParts['fade-out']);
        });
    }
    that.initVisuals = initVisuals;
    initVisuals();

    function restoreHandlers() {
        finD.off('mousedown');
        fioD.off('mousedown');
        mainD.off('mousedown');
        finHandle.off('mousedown');
        fioHandle.off('mousedown');
        finD.on('mousedown', function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, TAG.TourAuthoring.DisplayParts['fade-in']);
        });
        mainD.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, TAG.TourAuthoring.DisplayParts['main']);
        });
        fioD.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, TAG.TourAuthoring.DisplayParts['fade-out']);
        });
        finHandle.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, TAG.TourAuthoring.DisplayParts['fade-in']);
        });
        fioHandle.on("mousedown", function (e) {
            var offsetX = e.offsetX;
            _displayMousedown(offsetX, TAG.TourAuthoring.DisplayParts['fade-out']);
        });
    }
    that.restoreHandlers = restoreHandlers;

    /**
         * Bound to mousedown on display parts
         * Sets currentDisplay for use by displayClick
         * Resets currentDisplay on mouseup
         * @param mouseoffset   offset of mouse on element clicked for accurate dragging (offset from start of the timeline)
         * @param mouseloc      TAG.TourAuthoring.DisplayParts enum type specifying which part of display was clicked
         */
    function _displayMousedown(mouseoffset, mouseloc) {
        var oldin = inStart, // state before move
            oldmainstart = mainStart,
            oldmain = main,
            oldout = outStart,
            oldtotal = totalLength; // saves old values

        initSnap(); //initialize snapping at mouse down on display

        // Stop playback on click
        my.timeManager.stop();

        // Set move related instance variables
        offset = mouseoffset;
        loc = mouseloc;
        if (loc === TAG.TourAuthoring.DisplayParts['fade-in'] || loc === TAG.TourAuthoring.DisplayParts['fade-out']) {
            if (my.that.getMinimizedState()) {
                return;
            }
        }

        if (my.that.getMinimizedState()) {
            finHandle.hide();
            fioHandle.hide();
        }
        my.currentDisplay = that;
        my.timeline.newDataArray();
        for (var i = 0; i < my.timeline.getMultiSelectionArray().length; i++) {
            my.timeline.getMultiSelectionArray()[i].setLoc(loc);
        }
        // On mouseup reset all instance vars and log state
        $('body').on('mouseup.display', function () {
            //  var command, newin, newmainstart, newmain, newout, newtotal; // state after move
            if (my.that.getMinimizedState()) {
                finHandle.hide();
                fioHandle.hide();
            }

            var command, redo, undo, multiDisplays;
            var prevDisp = dataHolder.findPreviousDisplay(my.that.getPos(), that);
            var nextDisp = dataHolder.findNextDisplay(my.that.getPos(), that);
            redo = 0;
            undo = 0;
            var oldOff = offset;
            var oldLoc = loc;
            my.currentDisplay = null;
            offset = null;
            loc = null;
            $('body').off('mouseup.display');
            function logHelper(disp, cinit, cnew) {
                var clamp_command = {
                    execute: function () { disp.setTimes(cnew); },
                    unexecute: function () {
                        disp.setTimes(cinit);
                    },
                };
                my.undoManager.logCommand(clamp_command);
            }


            if (my.timeline.getMultiSelectionArray().length !== 0) {
                var multiDisplaysOrig = my.timeline.getMultiSelectionArray();
                multiDisplays = [];
                multiDisplaysOrig.map(function (d) {
                    multiDisplays.push(d);
                });
            }

            // If movement has occured, update and log command

            if (oldin !== inStart || oldmainstart !== mainStart || oldmain !== main || oldout !== outStart) {
                my.timeline.updateOldData();
                my.update();
                switch (oldLoc) {
                    case TAG.TourAuthoring.DisplayParts['fade-in']:
                        redo = inStart;//save new value
                        undo = oldin;//save old value
                        break;
                    case TAG.TourAuthoring.DisplayParts['fade-out']:
                        redo = outStart;
                        undo = oldout;
                        break;
                    case TAG.TourAuthoring.DisplayParts['main']:
                        redo = mainStart;
                        undo = oldmainstart;
                        break;
                }
                // my.update();
                var left = 0;
                var right = Infinity;
                if (prevDisp) {
                    left = prevDisp.display.getEnd();
                }
                if (nextDisp) {
                    right = nextDisp.display.getStart();
                }
                //stores these two functions with each command that is logged
                var olddata = my.timeline.getOldData();
                var msdata = my.timeline.getDisplayData();

                command = {
                    execute: function () {
                        var res = {
                            pivot: {
                                x: my.timeManager.timeToPx(redo) + oldOff
                            }
                        };
                        my.currentDisplay = that;
                        loc = oldLoc;
                        offset = oldOff;
                        //if these are defined, then get the logged positions and move the selected displays
                        if (olddata && multiDisplays) {
                            for (var i = 0; i < multiDisplays.length; i++) {
                                var currdisplay = multiDisplays[i];
                                var newredo;
                                switch (oldLoc) {
                                    case TAG.TourAuthoring.DisplayParts['fade-in']:
                                        newredo = olddata[i][0]; //inStart;//save new value
                                        break;
                                    case TAG.TourAuthoring.DisplayParts['fade-out']:
                                        newredo = olddata[i][2];//outStart;
                                        break;
                                    case TAG.TourAuthoring.DisplayParts['main']:
                                        newredo = olddata[i][1];
                                        break;
                                }
                                var newres = {
                                    pivot: {
                                        x: my.timeManager.timeToPx(newredo) + oldOff
                                    }
                                };
                                //need to update the location, currentdisplay, offset for move 
                                currdisplay.setLoc(oldLoc);
                                currdisplay.setcurrentDisplay(currdisplay);
                                currdisplay.setOffset(offset);
                                var newleft = left + currdisplay.getStart() - that.getStart();
                                var newright = right + currdisplay.getEnd() - that.getEnd();
                                currdisplay.move(newres, olddata[i][3], olddata[i][4], -1, -1, true);
                                currdisplay.setcurrentDisplay(null);
                            }
                        }
                        else {
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
                        my.currentDisplay = that;
                        loc = oldLoc;
                        offset = oldOff;
                        //if there is data logged, then you can undo the positions of the selected displays to the saved msdata's positions
                        if (msdata && multiDisplays) {
                            for (var i = 0; i < multiDisplays.length; i++) {
                                var currdisplay = multiDisplays[i];
                                var newundo;
                                switch (oldLoc) {
                                    case TAG.TourAuthoring.DisplayParts['fade-in']:
                                        newundo = msdata[i][0];//oldin;//save old value
                                        break;
                                    case TAG.TourAuthoring.DisplayParts['fade-out']:
                                        newundo = msdata[i][2];
                                        break;
                                    case TAG.TourAuthoring.DisplayParts['main']:
                                        newundo = msdata[i][1];
                                        break;
                                }
                                var newres = {
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
                        }
                        else {
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

                var num_clamped = my.timeline.clamped_displays.length;
                for (var i = 0; i < num_clamped; i++) {
                    var disp = my.timeline.clamped_displays[i];
                    logHelper(disp, disp.clamped_init, disp.clamped_new);
                    disp.has_been_clamped = false;
                }
                if (num_clamped > 0) {
                    my.undoManager.combineLast(num_clamped + 1);
                    my.timeline.clamped_displays.length = 0;
                }

            }
        });
    }


    function initSVG() {
        gv = my.svgDisplays.append('g')
                .classed('display', true)
                //.attr('id', id + '');

        //if (canFade) {
        finD = gv.append('rect').classed('fade-in', true)
            .attr('x', my.timeManager.timeToPx(inStart))
            .attr('y', 0)
            .attr('width', my.timeManager.timeToPx(fadeIn))
            .attr('height', my.svg.attr('height'))
            .style('fill', 'url(#fade-in)')
            .style('stroke-width', 1)
            .style('stroke', 'rgb(0,0,0)');
            //.on('mousedown', function (d, i) {
            //    _displayMousedown(d3.mouse(finD[0][0])[0] - parseInt(this.getAttribute('x'), 10),
            //        TAG.TourAuthoring.DisplayParts['fade-in']);
            //});

        $(finD[0][0]).on("mousedown", function (e) {
            console.log("using new events");
            var offsetX = e.offsetX;
            _displayMousedown(offsetX - parseInt(finD.attr('x'), 10), TAG.TourAuthoring.DisplayParts['fade-in']);
        });

        if (!canKeyframe) {
            finD.style('fill', 'url(#fade-in-ink)');
        }
        //}
        mainD = gv.append('rect').classed('main-display', true)
            .attr('x', my.timeManager.timeToPx(mainStart))
            .attr('y', 0)
            .attr('width', my.timeManager.timeToPx(main))
            .attr('height', my.svg.attr('height'))
            .style('fill', TAG.TourAuthoring.Constants.displayColor);
            //.on('mousedown', function (d, i) {
            //    _displayMousedown(d3.mouse(finD[0][0])[0] - parseInt(this.getAttribute('x'), 10),
            //        TAG.TourAuthoring.DisplayParts['main']);
            //});

        $(mainD[0][0]).on("mousedown", function (e) {
            console.log("using new events");
            var offsetX = e.offsetX;
            _displayMousedown(offsetX - parseInt(mainD.attr('x'), 10), TAG.TourAuthoring.DisplayParts['main']);
        });

        if (!canKeyframe) {
            mainD.style('fill', TAG.TourAuthoring.Constants.inkDisplayColor);
        }
        //if (canFade) {
        fioD = gv.append('rect').classed('fade-out', true)
            .attr('x', my.timeManager.timeToPx(outStart))
            .attr('y', 0)
            .attr('width', my.timeManager.timeToPx(fadeOut))
            .attr('height', my.svg.attr('height'))
            .style('fill', 'url(#fade-out)')
            .style('stroke-width', 1)
            .style('stroke', 'rgb(0,0,0)');
            //.on('mousedown', function (d, i) {
            //    _displayMousedown(d3.mouse(fioD[0][0])[0] - parseInt(this.getAttribute('x'), 10),
            //        TAG.TourAuthoring.DisplayParts['fade-out']);
            //});

        $(fioD[0][0]).on("mousedown", function (e) {
            
            console.log("using new events");
            var offsetX = e.offsetX;
            _displayMousedown(offsetX - parseFloat(fioD.attr('x')), TAG.TourAuthoring.DisplayParts['fade-out']);
        });

        if (!canKeyframe) {
            fioD.style('fill', 'url(#fade-out-ink)');
        }
        //}

        // put keyframes below handles so hatch lines don't overlap handles
        gkey = my.svg.append('g').classed('keyframes', true);

        // handles
        finHandle = gv.append('circle').classed('fade-in-handle', true)
            .attr('cx', my.timeManager.timeToPx(inStart))
            .attr('cy', '50%')
            .attr('r', TAG.TourAuthoring.Constants.fadeBtnSize)
            .attr('style', 'stroke:black; stroke-width:' + TAG.TourAuthoring.Constants.keyframeStrokeW + '; fill:' + TAG.TourAuthoring.Constants.handleColor);
        //    .on('mousedown', function (d, i) {
        //        _displayMousedown(d3.mouse(finHandle[0][0])[0] - parseInt(finD.attr('x'), 10),
        //            TAG.TourAuthoring.DisplayParts['fade-in']);
        //});

        $(finHandle[0][0]).on("mousedown", function (e) {
            console.log("using new events");
            var offsetX = e.offsetX;
            _displayMousedown(offsetX - parseInt(finD.attr('x'), 10), TAG.TourAuthoring.DisplayParts['fade-in']);
        });

        fioHandle = gv.append('circle').classed('fade-out-handle', true)
            .attr('cx', my.timeManager.timeToPx(outStart + fadeOut))
            .attr('cy', '50%') // negative for the transform trick
            .attr('r', TAG.TourAuthoring.Constants.fadeBtnSize)
            .attr('style', 'stroke:black; stroke-width:' + TAG.TourAuthoring.Constants.keyframeStrokeW + '; fill:' + TAG.TourAuthoring.Constants.handleColor);
            //.on('mousedown', function (d, i) {
            //    _displayMousedown(d3.mouse(fioHandle[0][0])[0] - parseInt(fioD.attr('x'), 10),
            //        TAG.TourAuthoring.DisplayParts['fade-out']);
            //});

        $(fioHandle[0][0]).on("mousedown", function (e) {
            console.log("using new events");
            var offsetX = e.offsetX;
            _displayMousedown(offsetX - parseInt(fioD.attr('x'), 10), TAG.TourAuthoring.DisplayParts['fade-out']);
        });
        

        /**
         * Bound to mousedown on display parts
         * Sets currentDisplay for use by displayClick
         * Resets currentDisplay on mouseup
         * @param mouseoffset   offset of mouse on element clicked for accurate dragging (offset from start of the timeline)
         * @param mouseloc      TAG.TourAuthoring.DisplayParts enum type specifying which part of display was clicked
         */
        function _displayMousedown(mouseoffset, mouseloc) {
            var oldin = inStart, // state before move
                oldmainstart = mainStart,
                oldmain = main,
                oldout = outStart,
                oldtotal = totalLength; // saves old values

            initSnap(); //initialize snapping at mouse down on display


            // Stop playback on click
            my.timeManager.stop();

            // Set move related instance variables
            offset = mouseoffset;
            loc = mouseloc;
            if (loc === TAG.TourAuthoring.DisplayParts['fade-in'] || loc === TAG.TourAuthoring.DisplayParts['fade-out']) {
                if (my.that.getMinimizedState()) {
                    return;
                }
            }
            my.currentDisplay = that;
            my.timeline.newDataArray();
            for (var i = 0; i < my.timeline.getMultiSelectionArray().length; i++) {
                my.timeline.getMultiSelectionArray()[i].setLoc(loc);
            }
            // On mouseup reset all instance vars and log state
            $('body').on('mouseup.display', function () {
                //  var command, newin, newmainstart, newmain, newout, newtotal; // state after move
                var command, redo, undo, multiDisplays;
                var prevDisp = dataHolder.findPreviousDisplay(my.that.getPos(), that);
                var nextDisp = dataHolder.findNextDisplay(my.that.getPos(), that);
                redo = 0;
                undo = 0;
                var oldOff = offset;
                var oldLoc = loc;
                my.currentDisplay = null;
                offset = null;
                loc = null;
                $('body').off('mouseup.display');
                function logHelper(disp, cinit, cnew) {
                    var clamp_command = {
                        execute: function () { disp.setTimes(cnew); },
                        unexecute: function () {
                            console.log("init: " + cinit.inStart + ", new: " + cnew.inStart);
                            disp.setTimes(cinit);
                        },
                    };
                    my.undoManager.logCommand(clamp_command);
                }
                
                
                if (my.timeline.getMultiSelectionArray().length !== 0) {
                    var multiDisplaysOrig = my.timeline.getMultiSelectionArray();
                    multiDisplays = [];
                    multiDisplaysOrig.map(function (d) {
                        multiDisplays.push(d);
                    });
                }
                
                // If movement has occured, update and log command
                
                if (oldin !== inStart || oldmainstart !== mainStart || oldmain !== main || oldout !== outStart) {
                    my.timeline.updateOldData();
                    my.update();
                    switch (oldLoc) {
                        case TAG.TourAuthoring.DisplayParts['fade-in']:
                            redo = inStart;//save new value
                            undo = oldin;//save old value
                            break;
                        case TAG.TourAuthoring.DisplayParts['fade-out']:
                            redo = outStart;
                            undo = oldout;
                            break;
                        case TAG.TourAuthoring.DisplayParts['main']:
                            redo = mainStart;
                            undo = oldmainstart;
                            break;
                    }
                    // my.update();
                    var left = 0;
                    var right = Infinity;
                    if (prevDisp) {
                        left = prevDisp.display.getEnd();
                    }
                    if (nextDisp) {
                        right = nextDisp.display.getStart();
                    }
                    //stores these two functions with each command that is logged
                    var olddata = my.timeline.getOldData();
                    var msdata = my.timeline.getDisplayData();
                    
                    command = {
                        execute: function () {
                            var res = {
                                pivot: {
                                    x: my.timeManager.timeToPx(redo) + oldOff
                                }
                            };
                            my.currentDisplay = that;
                            loc = oldLoc;
                            offset = oldOff;
                            //if these are defined, then get the logged positions and move the selected displays
                            if (olddata && multiDisplays) {
                                for (var i = 0; i < multiDisplays.length; i++) {
                                    var currdisplay = multiDisplays[i];
                                    var newredo;
                                    switch (oldLoc) {
                                        case TAG.TourAuthoring.DisplayParts['fade-in']:
                                            newredo = olddata[i][0]; //inStart;//save new value
                                            break;
                                        case TAG.TourAuthoring.DisplayParts['fade-out']:
                                            newredo = olddata[i][2];//outStart;
                                            break;
                                        case TAG.TourAuthoring.DisplayParts['main']:
                                            newredo = olddata[i][1];
                                            break;
                                    }
                                    var newres = {
                                        pivot: {
                                            x: my.timeManager.timeToPx(newredo) + oldOff
                                        }
                                    };
                                    //need to update the location, currentdisplay, offset for move 
                                    currdisplay.setLoc(oldLoc);
                                    currdisplay.setcurrentDisplay(currdisplay);
                                    currdisplay.setOffset(offset);
                                    var newleft = left + currdisplay.getStart() - that.getStart();
                                    var newright = right + currdisplay.getEnd() - that.getEnd();
                                    currdisplay.move(newres, olddata[i][3], olddata[i][4], -1, -1, true);
                                    currdisplay.setcurrentDisplay(null);
                                }
                            }
                            else {
                                move(res, left, right, -1, -1,  true);
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
                            my.currentDisplay = that;
                            loc = oldLoc;
                            offset = oldOff;
                            //if there is data logged, then you can undo the positions of the selected displays to the saved msdata's positions
                            if (msdata && multiDisplays) {
                                for (var i = 0; i < multiDisplays.length; i++) {
                                    var currdisplay = multiDisplays[i];
                                    var newundo;
                                    switch (oldLoc) {
                                        case TAG.TourAuthoring.DisplayParts['fade-in']:
                                            newundo = msdata[i][0];//oldin;//save old value
                                            break;
                                        case TAG.TourAuthoring.DisplayParts['fade-out']:
                                            newundo = msdata[i][2];
                                            break;
                                        case TAG.TourAuthoring.DisplayParts['main']:
                                            newundo = msdata[i][1];
                                            break;
                                    }
                                    var newres = {
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
                            }
                            else {
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

                    var num_clamped = my.timeline.clamped_displays.length;
                    for (var i = 0; i < num_clamped; i++) {
                        var disp = my.timeline.clamped_displays[i];
                        logHelper(disp, disp.clamped_init, disp.clamped_new);
                        disp.has_been_clamped = false;
                    }
                    if (num_clamped > 0) {
                        my.undoManager.combineLast(num_clamped + 1);
                        my.timeline.clamped_displays.length = 0;
                    }   
                    
                }
            });
        }
    }
    //initSVG();

    function toggleCircles() {
        hidden = !hidden;
        if (hidden) {
            finHandle.css('display', 'none');
            fioHandle.css('display', 'none');
            finHandle.css('visibility', 'hidden');
            fioHandle.css('visibility', 'hidden');
        } else {
            finHandle.css('display', 'block');
            fioHandle.css('display', 'block');
            finHandle.css('visibility', 'visible');
            fioHandle.css('visibility', 'visible');
        }
        currkeyframes.map(function (j) {
            j.toggleCircle();
        });
    }
    that.toggleCircles = toggleCircles;

    /**
     * Sets up menu with correct inputs and buttons
     */
    (function initMenu() {
        menu.addInput('Start', TAG.TourAuthoring.MenuInputFormats.minSec,
            getStart, setStartFromMenu);
        menu.addInput('Main Length', TAG.TourAuthoring.MenuInputFormats.minSec,
            getMain, setMainFromMenu);
        if (canFade) {
            menu.addInput('Fade-In', TAG.TourAuthoring.MenuInputFormats.sec,
                getFadeIn, setFadeInFromMenu);
            menu.addInput('Fade-Out', TAG.TourAuthoring.MenuInputFormats.sec,
                getFadeOut, setFadeOutFromMenu);
        }
        var deleteKFButton = menu.addButton('Delete', 'left', removeHelper);
        menu.addButton('Close', 'right', menu.forceClose);

        //Telemetry
        TAG.Telemetry.register(deleteKFButton, "mousedown", "DeleteDisplay");

    })();

    function getLimits() {
        var duration = my.timeManager.getDuration(),
            left = duration.start,
            right = duration.end;

        var leftDisp = dataHolder.findPreviousDisplay(my.that.getPos(), that);
        var rightDisp = dataHolder.findNextDisplay(my.that.getPos(), that);

        left = (leftDisp) ? leftDisp.display.getEnd() : left;
        right = (rightDisp) ? rightDisp.display.getStart() : right;

        if (my.mediaLength) {
            left = Math.max(left, getEnd() - parseFloat(my.mediaLength));
            right = Math.min(right, parseFloat(my.mediaLength) + getStart());
        }
        return { left: left, right: right };
    }

    function setStartFromMenu(newstart) {
        var translation,
            attachedDisplays,
            bounds = getLimits(),
            oldStart = inStart;

        var totalDispLength = 0;
        if (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled) {
            var surrDisp = getParentDisplay();
            bounds.left = Math.max(bounds.left, surrDisp.getStart() + TAG.TourAuthoring.Constants.inkTrackOffset);
            bounds.right = Math.min(bounds.right, surrDisp.getEnd());
        }
        else if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image) {
            // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
            attachedDisplays = getChildDisplays();
            totalDispLength = getLongestSubgroup(attachedDisplays);
        }

        inStart = Math.constrain(newstart, // note this is defined in TAG.Util
                            bounds.left, // min
                            bounds.right - fadeIn - fadeOut - main);
        
        translateTo(inStart);
        _moveAllKeyframes(inStart - oldStart);

        //var num_commands = 0;
        if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image) {
            for (var i = 0; i < attachedDisplays.length; i++) {
                clampDisplay(attachedDisplays[i]);
                //num_commands++;
            }
        }
        //my.undoManager.combineLast(num_commands);
    }

    function setMainFromMenu(newmain) {
        var bounds = getLimits(),
            attachedDisplays,
            keyframeBound = !currkeyframes.isEmpty() ?
                currkeyframes.max().getTime() + TAG.TourAuthoring.Constants.epsilon - mainStart
                : -Infinity;
        var totalDispLength = 0;
        if (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled) {
            var surrDisp = getParentDisplay();
            bounds.left = Math.max(bounds.left, surrDisp.getStart() + TAG.TourAuthoring.Constants.inkTrackOffset);
            bounds.right = Math.min(bounds.right, surrDisp.getEnd());
        }
        else if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image) {
            // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
            attachedDisplays = getChildDisplays();
            totalDispLength = getLongestSubgroup(attachedDisplays);
        }
        main = Math.constrain(Math.max(0.1,newmain),
                            keyframeBound,
                            bounds.right - inStart - fadeOut - fadeIn);
        if (fadeIn===0 && fadeOut===0 && main === 0)
            main = 1;

        setMain((main + fadeIn + fadeOut >= totalDispLength) ? main : totalDispLength - fadeIn - fadeOut);

        //var num_commands = 0;
        if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image) {
            for (var i = 0; i < attachedDisplays.length; i++) {
                clampDisplay(attachedDisplays[i]);
                //num_commands++;
            }
        }
        //my.undoManager.combineLast(num_commands);
    }

    function setFadeInFromMenu(newfadein) {
        //FEATURE DECIDED UPON: stop down-sizing the fadeIn if it hits a keyframe
        var bounds = getLimits(),
            i, currKeyframe, attachedDisplays, keyTime;

        var totalDispLength = 0;
        if (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled) {
            var surrDisp = getParentDisplay();
            bounds.left = Math.max(bounds.left, surrDisp.getStart() + TAG.TourAuthoring.Constants.inkTrackOffset);
            bounds.right = Math.min(bounds.right, surrDisp.getEnd());
        }
        else if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image) {
            // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
            attachedDisplays = getChildDisplays();
            totalDispLength = getLongestSubgroup(attachedDisplays);
        }

        fadeIn = Math.constrain(newfadein,
                            0,
                            mainStart - bounds.left);
        var newInStart = mainStart - fadeIn;
        if (!currkeyframes.isEmpty() && newInStart > currkeyframes.min().getTime() - my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize)) {
            inStart = currkeyframes.min().getTime() - my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize);
            fadeIn = mainStart - inStart;
        }
        else {
            inStart = newInStart;
        }
        // push back any keyframes inside of fade
            //for (i = 0; i < keyframes.length; i++) {
            //    currKeyframe = keyframes[i];
            //    keyTime = currKeyframe.getTime();
            //    if (keyTime < inStart) {
            //        keyframes[i].translate(inStart - keyTime
            //            + TAG.TourAuthoring.Constants.epsilon * (i + 1));
            //    }
            //}
        //translateTo(inStart);
        var newFin;
        if (main + fadeIn + fadeOut >= totalDispLength) {
            newFin = fadeIn;
        } else {
            newFin = totalDispLength - main - fadeOut;
        }
        setIn(newFin);

        //var num_commands = 0;
        if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image) {
            for (i = 0; i < attachedDisplays.length; i++) {
                clampDisplay(attachedDisplays[i]);
                //num_commands++;
            }
        }
       // my.undoManager.combineLast(num_commands);
    }
    that.setFadeInFromMenu = setFadeInFromMenu;

    function setFadeOutFromMenu(newfadeout) {
        //FEATURE DECIDED UPON: stop down-sizing the fadeOut if it hits a keyframe
        var bounds = getLimits(),
            i, currKeyframe, attachedDisplays, keyTime, newend;

        var totalDispLength = 0;
        if (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled) {
            var surrDisp = getParentDisplay();
            bounds.left = Math.max(bounds.left, surrDisp.getStart() + TAG.TourAuthoring.Constants.inkTrackOffset);
            bounds.right = Math.min(bounds.right, surrDisp.getEnd());
        }
        else if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image) {
            // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
            attachedDisplays = getChildDisplays();
            totalDispLength = getLongestSubgroup(attachedDisplays);
        }

        fadeOut = Math.constrain(newfadeout,
                            0,
                            bounds.right - outStart);
        newend = outStart + fadeOut;
        if (!currkeyframes.isEmpty() && newend < currkeyframes.max().getTime() + my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize)) {
            fadeOut = currkeyframes.max().getTime() + my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize) - outStart;
        }
        // push back any keyframes inside of fade
        //for (i = keyframes.length - 1; i >= 0; i--) {
        //    currKeyframe = keyframes[i];
        //    keyTime = currKeyframe.getTime();
        //    if (keyTime > outStart + fadeOut) {
        //        keyframes[i].translate(newend - keyTime
        //            - TAG.TourAuthoring.Constants.epsilon * (i + 1));
        //    }
        //}
        setOut((main + fadeIn + fadeOut >= totalDispLength) ? fadeOut : totalDispLength - main - fadeIn);

       // var num_commands = 0;
        if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image) {
            for (i = 0; i < attachedDisplays.length; i++) {
                clampDisplay(attachedDisplays[i]);
                //num_commands++;
            }
        }
       // my.undoManager.combineLast(num_commands);
    }
    that.setFadeOutFromMenu = setFadeOutFromMenu;

    
    // handles long press on the display
    function rightTapped(evt) {
        menu.open(evt);
    }
    that.rightTapped = rightTapped;

    //closes menu
    function closeMenu() {
        menu.close();
    }
    that.closeMenu = closeMenu;

    function setMenuCloseable(state) {
        menu.menuCloseable = state;
    }

    //Xiaoyi Libby
    function setLoc(dloc) {
        loc = dloc;
    }
    that.setLoc = setLoc;

    function getOffset() {
        return offset;
    }
    that.getOffset = getOffset;

    function setOffset(doffset) {
        offset = doffset;
    }
    that.setOffset = setOffset;

    function setcurrentDisplay(display) {
        my.currentDisplay = display;
    }
    that.setcurrentDisplay = setcurrentDisplay;

    //handles removal of all internal items of display/ wrapper to call remove display
    function removeHelper() {
        // if last display is deleted on a track and track has attached inks, remind user that inks will not function and offer undo option
        var len;
        if (that.getStorageContainer().displayTree.isSolo() && my.attachedInks.length > 0) {
            menu.forceClose();
            my.timeline.confirmDeleteDisableInk(my.title, that, my);
            // for distributed warnings onto ink tracks (alternative option that can be implemented later)
            //var i;
            //for (i = 0; i < my.attachedInks.length; i++) {
            //    console.log('append warning here');
            //}
        } else {
            len = removeAttachedInkDisplays();
            removeDisplay(true);
            if (len > 0) {
                my.undoManager.combineLast(len + 1);
            }
        }
    }
    that.removeHelper = removeHelper;


    // remove all attached ink displays when an artwork display is removed
    function removeAttachedInkDisplays() {
        var attachedDisplays = getChildDisplays();
        var i, len = attachedDisplays.length;
        for (i = 0; i < len; i++) {
            attachedDisplays[i].removeDisplay(true);
        }
        return len; // tells us whether we should combineLast after removing display
    }
    that.removeAttachedInkDisplays = removeAttachedInkDisplays;

    /**
     * Removes the display.
     * @param acted     whether the user directly removed the display / if a command should be logged.
     */
    var dispRemoved = false;
    function removeDisplay(acted) {
        menu.forceClose(true);

        //var oldKeyframes=[];
        var oldkfTree = currkeyframes.clone();
        if (parentDisplay) {
            var oldParentDisplay = parentDisplay;
        }
        var command = TAG.TourAuthoring.Command({
            execute: function () {
                dispRemoved = true;
                dataHolder.removeDisplay(my.that.getPos(), that);
                currkeyframes.clear(function (keyframe) {
                    keyframe._value.removeHelper();
                });
                mainD.remove();
                fioD.remove();
                finD.remove();
                fioHandle.remove();
                finHandle.remove();
                my.update();
           },
            unexecute: function () {
                dispRemoved = false;
                initVisuals();
                var newDisplay = dataHolder.addDisplay(my.that.getPos(), that);
                dataHolder.replaceKeyframes(newDisplay.display, oldkfTree);
                var kfs = dataHolder.getKeyframes(newDisplay);
                kfs._root && kfs._root.traverse(REACTIVATE);
                //if (oldParentDisplay) {
                //    oldParentDisplay.addChildDisplay(that);
                //}
                my.update();
                

                //var newDisplay=TAG.TourAuthoring.Display({start:inStart, length:totalLength, fadeIn: fadeIn, fadeOut:fadeOut, id:id,} ,my);
                //my.displays.insert(that, my.that.displayComp);
                //setID(index);
                //for (i = index + 1; i < my.displays.length; i++) {
                //    my.displays[i].setID(i);
                //}
                
                
                
            }
        });
        command.execute();
        if (acted) {
            my.undoManager.logCommand(command);
            console.log('logging');
        }
    }
    that.removeDisplay = removeDisplay;

    function REACTIVATE(kf) {
        kf._value.reactivateKeyframe();
    }

    function getRemoved() {
        return dispRemoved;
    }
    that.getRemoved = getRemoved;

    //reloads the display when removed
    function reloadDisplay(){
        //initSVG();
        dataHolder.addDisplay(my.that.getPos(), that);
        resetVisuals();
        my.update();
    }
    that.reloadDisplay = reloadDisplay;

    // not using right now b/c broken
    var releasedCounter = 0;
    function released() {
        releasedCounter++;
        if (my.that.getEventsPaused()) {
            return;
        }
        if (releasedCounter > 1) {
            releasedCounter = 0;
            if (!menuCloseable) {
                menuCloseable = true;
                setTimeout(my.timeline.getCloseMenu(), 0);
            }
        }
    }
    that.released = released;

    //////////
    // Getters + Setters

    /**
     * @returns     Start of display block in sec
     */
    function getStart() {
        return inStart;
    }
    that.getStart = getStart;

    /**
     * @returns     End of display block in sec
     */
    function getEnd() {
        return outStart + fadeOut;
    }
    that.getEnd = getEnd;

    function getMainStart() {
        return mainStart;
    }
    that.getMainStart = getMainStart;

    function getMain() {
        return main;
    }
    that.getMain = getMain;

    function getOutStart() {
        return outStart;
    }
    that.getOutStart = getOutStart;

    function getFadeIn() {
        return fadeIn;
    }
    that.getFadeIn = getFadeIn;

    function getFadeOut() {
        return fadeOut;
    }
    that.getFadeOut = getFadeOut;

    function getTotalLength() {
        return totalLength;
    }
    that.getTotalLength = getTotalLength;

    function setTimes(obj) {
        setInStart(obj.inStart);
        setOutStart(obj.outStart);
        setMainStart(obj.inStart + obj.fadeIn);//main = obj.main;
        setMain(obj.main);
        setIn(obj.fadeIn);
        setOut(obj.fadeOut);
    }
    that.setTimes = setTimes;

    function basicSetTimes(input) {
        inStart = input.inStart;
        outStart = input.outStart;
        mainStart = input.inStart+input.fadeIn;
        main = input.main;
        fadeIn = input.fadeIn;
        fadeOut = input.fadeOut;
        resetVisuals();
    }
    that.basicSetTimes = basicSetTimes;

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
    that.getTimes = getTimes;


 /***JessF adfjlasdjfkljasdflkadlsfj fuckckck***/
    function updateDispTimes(offset) {
        mainStart += offset;
        inStart += offset;
        outStart += offset;
        resetVisuals();
        _moveAllKeyframes(offset);
    }
    that.updateDispTimes = updateDispTimes;

    function resetVisuals() {
        finD.css('left', T2P(inStart)+"px");
        mainD.css('left', T2P(mainStart) + "px");
        fioD.css('left', T2P(outStart) + "px");
        finHandle.css('left', T2P(inStart) - 20 + "px");
        fioHandle.css('left', T2P(outStart + fadeOut) - 20 + "px");

        // need to re-add all elements - figure out where they're originally added to
        my.track.append(mainD).append(finD).append(fioD).append(finHandle).append(fioHandle);
        finD.show();
        mainD.show();
        fioD.show();
        finHandle.show();
        fioHandle.show();
    }
    that.resetVisuals = resetVisuals;

    /*
    *set the main part of display to a new time
    * @param newmainStart   new time for mainStart
    * @trans trans    translation display has been dragged
    */
    function setMainStart(newmainStart,trans) {
        mainStart = newmainStart;
        inStart = mainStart - fadeIn;
        outStart = mainStart + main;
        resetVisuals();
        _moveAllKeyframes(trans);
    }
    that.setMainStart = setMainStart;
    
    function setStart(time) {
        inStart = time;
    }
    function setEnd(time) {
        outStart = time;
    }


    /**xiaoyi & libby
    *these are helper methods for msMove to reset the graphic info.
    *called when you are changing the fadein
    */
    function setInStart(newinStart) {
        inStart = newinStart;
        mainStart = inStart + fadeIn;
        main = outStart - mainStart;
        totalLength = outStart + fadeOut - newinStart;
        finD.css('left', T2P(newinStart) + "px");
        finHandle.css('left', T2P(newinStart) - 20 + "px"); // DON'T HARDCODE TODO
        mainD.css({
            'left': T2P(mainStart) + "px",
            'width': T2P(main) + "px"
        });
    }
    that.setInStart = setInStart;
    /*called when you are changing the fadeout
    */
    function setOutStart(newoutStart) {
        main = newoutStart - mainStart;
        outStart = newoutStart;
        totalLength = newoutStart + fadeOut - inStart;
        fioD.css('left', T2P(newoutStart) + "px");
        fioHandle.css('left', T2P(newoutStart + fadeOut) - 20 + "px");
        mainD.css('width', T2P(main) + "px");
    }
    that.setOutStart = setOutStart;
    /*called when you are changing the main
    */
    function setMain(newm) {
        main = newm;
        outStart = mainStart + main;
        totalLength = outStart + fadeOut - inStart;
        fioD.css('left', T2P(outStart) + "px");
        fioHandle.css('left', T2P(outStart + fadeOut) - 20 + "px");
        mainD.css('width', T2P(main) + "px");
    }
    that.setMain = setMain;

    function setIn(newin) {
        if (canFade) {
            fadeIn = newin;
            mainStart = inStart + fadeIn;
            //outStart = mainStart + main;
            totalLength = outStart + fadeOut - inStart;
            finD.css('left', T2P(inStart) + "px");
            finD.css('width', T2P(fadeIn) + "px");
            finHandle.css('left', T2P(inStart) - 20 + "px");
            mainD.css({
                'left': T2P(mainStart) + "px",
                'width': T2P(main) + "px"
            });
        }
        else { // just change total length
            setMain(main + newin);
        }
    }
    that.setIn = setIn;

    function setOut(newout) {
        if (canFade) {
            fadeOut = newout;
            totalLength = outStart + fadeOut - inStart;
            fioD.css('width', T2P(fadeOut) + "px");
            fioHandle.css('left', T2P(outStart + fadeOut) - 20 + "px");
        }
        else { // just change total length
            setMain(main + newout);
        }
    }
    that.setOut = setOut;

    /**
     * Special setter that sets new start but preserves lengths
     */
    function translateTo(newstart) {
        inStart = newstart;
        mainStart = inStart + fadeIn;
        outStart = main + mainStart;
        finD.css('left', T2P(inStart) + "px");
        finHandle.css('left', T2P(inStart) - 20 + "px");
        mainD.css('left', T2P(mainStart) + "px")
            .css('width', T2P(main) + "px");
        fioD.css('left', T2P(outStart) + "px");
        fioHandle.css('left', T2P(outStart + fadeOut) - 20 + "px");
    }
    that.translateTo = translateTo;

    /**
     * @returns     Numerical ID of display
     */
    function getID() {
        return id;
    }
    that.getID = getID;

    //New ID for display
    function setID(newid) {
        id = newid;
    }
    that.setID = setID;

    function getStorageContainer() {
        return storageContainer;
    }
    that.getStorageContainer = getStorageContainer;

    function setStorageContainer(container) {
        storageContainer = container;
    }
    that.setStorageContainer = setStorageContainer;

    /**
     * @returns Track that the display is in
     */
    function getTrack() {
        return my.that;
    }
    that.getTrack = getTrack;
    function getMediaLength() {
        return parseFloat(my.mediaLength);
    }
    that.getMediaLength = getMediaLength;
    function getMouseup() {
        return mouseisup;
    }
    that.getMouseup = getMouseup;

    function getType() {
        return my.type;
    }
    that.getType = getType;

    function getMainD() {
        return mainD;
    }
    that.getMainD = getMainD;

    function getFioHandle() {
        return fioHandle;
    }
    that.getFioHandle = getFioHandle;

    function getFinHandle() {
        return finHandle;
    }
    that.getFinHandle = getFinHandle;

    function getLoc() {
        return loc;
    }
    that.getLoc = getLoc;

    function suppressHandles() {
        if (my.that.getMinimizedState()) {
            finHandle.hide();
            fioHandle.hide();
            finHandle.css('visibility', 'hidden');
            fioHandle.css('visibility', 'hidden');
        }
    }
    that.suppressHandles = suppressHandles;

    ////////
    // Logic

    /**
     * Logic for manipulation + dragging of displays
     * Moves display to an absolute position given in res
     * currentDisplay, offset, loc should be set, see _initSVG / _displayMousedown for details
     * Currently three different types of move, determined by loc variable
     * 1. loc === 'main': translates the entire display, preserves length
     * 2. loc === 'fade-in' or 'fade-out': drags only fade-in / fade-out region, start of other fade and lengths of fades remaines fixed, length of main area changes
     * @param res           event from makeManipulable, onManipulate
     * @param leftbound     leftmost position display can move to in seconds (not required)
     * @param rightbound    rightmost position display can move to in seconds (not required)
     * @param displayIn     the position of a nearby display in the previous trac
     * @param displayOut    the position of a nearby display in the next track
     */
    var translation;
    
    function move(res, leftbound, rightbound, displayIn, displayOut, inUndoRedo) {
        // If no bounds are set, display can be anywhere (except negative times)
        var duration = my.timeManager.getDuration();
        var attachedDisplays, i, maxTotalDispLength, parentArtDisplay, diff;
        var totalDispLength = 0;
        leftbound = leftbound || duration.start;
        rightbound = rightbound || duration.end;

        // no display in or out, set to -1
        displayIn = displayIn || -1;
        displayOut = displayOut || -1;

        // error checking
        if (!loc || (offset !== 0 && !offset) || !my.currentDisplay) { // need that extra offset = 0 check since 0 and null are equal, arg
            console.log('Move display called when no display is selected!');
        }
            // Actual editing
        else if (loc === TAG.TourAuthoring.DisplayParts['fade-in']) { // Drag fade-in section to adjust length
            if (displayIn !== -1) {
                inStart = displayIn;
            }
            else {
                if (!inUndoRedo && (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled)) { // constrain ink movement
                    parentArtDisplay = getParentDisplay();
                    leftbound = Math.max(leftbound, parentArtDisplay.getStart() + TAG.TourAuthoring.Constants.inkTrackOffset);
                }
                else if (!inUndoRedo && (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image)) {
                    // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
                    attachedDisplays = getChildDisplays();
                    totalDispLength = getLongestSubgroup(attachedDisplays);
                }
                else if (my.type === TAG.TourAuthoring.TrackType.video || my.type === TAG.TourAuthoring.TrackType.audio) {
                    if (my.mediaLength) {
                        maxTotalDispLength = parseFloat(my.mediaLength);
                        var leftLimit = outStart + fadeOut - maxTotalDispLength;
                        leftbound = Math.max(leftbound, leftLimit);
                    }
                }
                diff = my.timeManager.pxToTime(res.pivot.x - offset); // note this is defined in TAG.Util
                if (getEnd() - diff >= totalDispLength) {
                    if (fadeIn === 0 && fadeOut === 0) {
                        inStart = Math.constrain(diff,
                                        leftbound, // min
                                        Math.min(my.timeManager.pxToTime(parseFloat(fioHandle.css('left')) + 20 - 2 * TAG.TourAuthoring.Constants.fadeBtnSize), // max is one of two values
                                            ((!currkeyframes.isEmpty() && (currkeyframes.min().getTime() - my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize + TAG.TourAuthoring.Constants.keyframeStrokeW + TAG.TourAuthoring.Constants.fadeBtnSize))) || Infinity)));
                    }
                    else {
                        inStart = Math.constrain(my.timeManager.pxToTime(res.pivot.x - offset), // note this is defined in TAG.Util
                                            leftbound, // min
                                            Math.min(outStart - fadeIn-0.1, //make sure the fadein and fadeout handlers are overlapping
                                                ((!currkeyframes.isEmpty() && (currkeyframes.min().getTime() - my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize + TAG.TourAuthoring.Constants.keyframeStrokeW + TAG.TourAuthoring.Constants.fadeBtnSize))) || Infinity)));
                    }
                    if (!inUndoRedo && (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image)) {
                        //var num_commands = 0;
                        for (i = 0; i < attachedDisplays.length; i++) {
                            clampDisplay(attachedDisplays[i]);
                            //num_commands++;
                        }
                       // my.undoManager.combineLast(num_commands);
                    }
                }
            }
            setInStart(inStart);
        }
        else if (loc === TAG.TourAuthoring.DisplayParts['fade-out']) { // Drag fade-out section to adjust length
            if (displayOut !== -1) {
                outStart = displayOut;
            }
            else {
                if (!inUndoRedo && (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled)) { // constrain ink movement
                    parentArtDisplay = getParentDisplay();
                    rightbound = Math.min(rightbound, parentArtDisplay.getOutStart() + parentArtDisplay.getFadeOut());
                }
                else if (!inUndoRedo && (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image)) {
                    // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
                    attachedDisplays = getChildDisplays();
                    totalDispLength = getLongestSubgroup(attachedDisplays);
                }
                else if (my.type === TAG.TourAuthoring.TrackType.video || my.type === TAG.TourAuthoring.TrackType.audio) {
                    if (my.mediaLength) {
                        maxTotalDispLength = parseFloat(my.mediaLength);
                        var rightLimit = inStart + maxTotalDispLength;
                        rightbound = Math.min(rightbound, rightLimit);
                    }
                }
                diff = my.timeManager.pxToTime(res.pivot.x - offset); // note this is defined in TAG.Util
                if (diff + fadeOut - getStart() >= totalDispLength) {
                    if (fadeIn === 0 && fadeOut === 0) {
                        outStart = Math.constrain(diff,
                                        Math.max(my.timeManager.pxToTime(parseFloat(finHandle.css('left')) + 20) + my.timeManager.pxToTime(2 * TAG.TourAuthoring.Constants.fadeBtnSize),
                                            ((!currkeyframes.isEmpty() && (currkeyframes.max().getTime() - fadeOut + my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize + TAG.TourAuthoring.Constants.keyframeStrokeW + TAG.TourAuthoring.Constants.fadeBtnSize))) || -Infinity)),
                                        rightbound - fadeOut); // max
                    } else {
                        outStart = Math.constrain(diff,
                                        Math.max(inStart + fadeIn + 0.1,
                                            ((!currkeyframes.isEmpty() && (currkeyframes.max().getTime() - fadeOut + my.timeManager.pxToTime(TAG.TourAuthoring.Constants.keyframeSize + TAG.TourAuthoring.Constants.keyframeStrokeW + TAG.TourAuthoring.Constants.fadeBtnSize))) || -Infinity)),
                                        rightbound - fadeOut); // max
                    }
                    if (!inUndoRedo && (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image)) {
                        for (i = 0; i < attachedDisplays.length; i++) {
                            clampDisplay(attachedDisplays[i]);
                        }
                    }
                }
            }//first term is current position, second is either the end of the fadeIn or the point when the end circle collides with the last keyframe, last term is the end of the tour. First term is constrained between the second two
            setOutStart(outStart);
        }
        else if (loc === TAG.TourAuthoring.DisplayParts['main']) { // Drag whole display, preserve length
            // in here, we want to take care of constraining attached ink display dragging to its artwork display (leftbound = max(leftbound, left bound of attached artwork display), rightbound = .... )
            // also, take care of moving ink displays with artwork displays if need be 
            var currDisp = null;
            if (!inUndoRedo && (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled)) { // constrain ink movement
                parentArtDisplay = getParentDisplay();
                rightbound = Math.min(rightbound, parentArtDisplay.getOutStart() + parentArtDisplay.getFadeOut());
                leftbound = Math.max(leftbound, parentArtDisplay.getStart() + TAG.TourAuthoring.Constants.inkTrackOffset);
            }
            else if (!inUndoRedo && (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image)) {
                // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
                attachedDisplays = getChildDisplays();
            }

            
            var newmainStart = Math.constrain(my.timeManager.pxToTime(res.pivot.x - offset),
                                        leftbound + fadeIn,
                                        rightbound - fadeOut - main),
                translation = newmainStart - mainStart;
            setMainStart(newmainStart, translation);
            /*********************display snapping stuff***********************/
            //jjfu

            var excludeRight = null; //parent display's (if it exists) end time
            var excludeLeft = null; //parent display's (if it exists) start time

            if (my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled) { //if display is an ink
                excludeRight = getParentDisplay().getEnd(); //get parent display's end time
                excludeLeft = getParentDisplay().getStart(); //get parent display's start time
            }

            //display movement should already be set above so mouseLoc should only be used to determine dragging to the right or to the left
            var mouseLoc = my.timeManager.pxToTime(res.pivot.x - offset); // where the start of the display would be based on mouse position alone

            var startTime = getStart(); //start time of display
            var endTime = getEnd(); //end time of display

            // +/- 0.001 to startTime to offset the startTime since it is being set above
            if (mouseLoc > startTime - 0.001) { 
                frontSnap(excludeRight);
            } else if (mouseLoc < startTime + 0.001) {
                backSnap(excludeLeft);
            }

            /********************************************/

            if (!inUndoRedo && (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.image)) {
                //var num_commands = 0;
                for (i = 0; i < attachedDisplays.length; i++) {
                    clampDisplay(attachedDisplays[i]);
                    //num_commands++;
                }
                // my.undoManager.combineLast(num_commands);
            }
        }
        else {
            console.log('currentDisplay.loc should be one of: \'fade-in\', \'fade-out\', or \'main\'');
        }
        that.outStart = outStart; //bleveque -- added for edit ink
        that.inStart = inStart;

        my.that.drawLines();
    }
    that.move = move;

    // accessor/mutator pair for parent display, used only by ink tracks
    function setParentDisplay(display) {
        parentDisplay = display;
    }
    that.setParentDisplay = setParentDisplay;

    function getParentDisplay() {
        return parentDisplay;
    }
    that.getParentDisplay = getParentDisplay;

    /**
     * Returns the length of the longest total collection of subdisplays
     */
    function getLongestSubgroup(gp) {
        var lens = {};
        var currmax = 0;
        for (var i = 0; i < gp.length; i++) {
            var title = gp[i].getTrack().getTitle();
            lens[title] = (typeof lens[title] === 'number' ? lens[title] : 0) + (gp[i].getRemoved() ? 0 : gp[i].getEnd() - gp[i].getStart());
            if(lens[title] > currmax)
                currmax = lens[title];
        }
        return currmax + TAG.TourAuthoring.Constants.inkTrackOffset; //add for offset
    }
    that.getLongestSubgroup = getLongestSubgroup;

    /**
     * Gets the attached ink displays residing within the bounds of the current display
     */
    function getAllChildDisplays() {
        var attachedDisplays = [];
        var i;
        // first get the attached inks
        var attached = [];
        var tracks = dataHolder.getTracks();
        for (i = 0; i < tracks.length ; i++) {
            if (tracks[i].track.getType() === TAG.TourAuthoring.TrackType.ink && tracks[i].track.getInkEnabled() && tracks[i].track.getInkLink().getTitle() === my.title)
                attached.push(tracks[i]);
        }
        for (i = 0; i < attached.length; i++) {
            // for each attached ink track, we want to see if we should move it with the new movement
            var attachedInk = attached[i],
                attachedInkDisps = attachedInk.displays.getContents();
            for (var j = 0; j < attachedInkDisps.length; j++) {
                var currDisp = attachedInkDisps[j].display;
                if ((currDisp.getOutStart() <= outStart + fadeOut) && (currDisp.getOutStart() >= inStart)) { // test if ink display is inside our display
                    attachedDisplays.push(currDisp);
                }
            }
        }

        return attachedDisplays;
    }
    that.getAllChildDisplays = getAllChildDisplays;

    /////////////////////////////////display snapping stuuffzzz?/////////////////////////////////
    //jjfu

    var nextDisplay, // furthest current display can go before it coincides with the next display to the right
        prevDisplay; // '' '' but for the previous display

    /*initSnap
    Takes current track and builds an AVLTree -> Doubly Linked List to 
    hold times to which the current display can snap */
    function initSnap() {
        var hostPos = that.getStorageContainer().hostTrack.getPos();

        var excludables = null; //hashtable with all times of attached ink to exclude from the snappable times list
        if (!(my.type === TAG.TourAuthoring.TrackType.ink && my.inkEnabled)) { //if current display is not an ink
            excludables = buildExcludables(hostPos); 
        }

        //build snappable times list
        var snapTree = buildSnapTree(hostPos, excludables);
        snapTimesDLL = buildSnapDLL(snapTree);

        //find bounds of adjacent displays
        nextDisplay = dataHolder.findNextDisplay(hostPos, that);
        prevDisplay = dataHolder.findPreviousDisplay(hostPos, that);
    }

    /*buildExcludables
    Loop through all attached displays and insert start and end times into the excludables HashTable. Then return the table*/
    var buildExcludables = function () {
        var attachedDisplays = getAllChildDisplays();
        var excludables = new HashTable();

        for (var i = 0; i < attachedDisplays.length ; i++){
            excludables.insert(attachedDisplays[i].getStart(), 1);
            excludables.insert(attachedDisplays[i].getEnd(), 1);
        }

        //if nothing is being added to the excludables table, return null
        if (excludables.getLength() === 0) {
            return null;
        }
        return excludables;
    }


    // Local AVLTree comparator + valuation
    var comparator = function (a, b) {
        if (a.key < b.key) {
            return -1;
        } else if (a.key > b.key) {
            return 1;
        } else {
            return 0;
        }
    };

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

    /*addTimeNode
    For each display in the track, add the start and end time into the list if it is not in excludables HashTable*/
    function addTimeNode(displays, localTree, excludables) {
        if (excludables) { // only checks with excludables if it exists
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

    /*buildSnapTree
    Takes the track above and below the current display's track and builds the AVLTree (sorted) for the times*/
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

    /*buildSnapDLL
    Converts the AVLTree of snappable times to a doubly linked list*/
    function buildSnapDLL(snapTree) {
        var treeTimes = snapTree.getContents();
        var snapTimes = new DoublyLinkedList();

        for (var i = 0; i < treeTimes.length ; i++) {
            snapTimes.append(treeTimes[i].key);
        }

        return snapTimes;
    }

    /*withinSnapRange
    Returns if the time difference is within snappable range
    Using pixels*/
    function withinSnapRange(diff) {
        var pxDiff = my.timeManager.timeToPx(diff);
        if (pxDiff < $(window).width() * 0.01 && pxDiff > 0) {
            return true;
        }
        return false;
    }

    /*frontSnap
    Completes display snapping to the right
    Passes in excludeRight which is the start time of the next display (if it exists) of the current display*/
    function frontSnap(excludeRight) {

        var startTime = getStart();
        var endTime = getEnd();

        // the next time that the current display could possibly snap to relative to the startTime of the current display
        var startNextNode = snapTimesDLL.findNext(startTime);
        // the next time that the current display could possibly snap to relative to the endTime of the current display
        var endNextNode = snapTimesDLL.findNext(endTime);

        var snapped = false; //keeps track of if the end of the current display has snapped to the next snappable time

        if (excludeRight && endNextNode && endNextNode.data === excludeRight) {
           //does not snap if it's its own display so therefore do nothing lolols
        }else {
            if (endNextNode !== null) {
                var endRightDiff = endNextNode.data - (inStart + that.getTotalLength());

                if (!withinSnapRange(endRightDiff) || (excludeRight && (endTime + endRightDiff) > excludeRight)) {
                    //do nothing if it's not suppose to snap
                }else {
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
            return; //does not snap if snaps to it's own display
        }else {
            if (startNextNode != null) {
                var startRightDiff = startNextNode.data - startTime

                if (!withinSnapRange(startRightDiff) || (excludeRight && (endTime + startRightDiff) > excludeRight) || (endTime + startRightDiff > my.timeManager.getDuration().end)) {
                    //do nothing if it's not suppose to snap
                }else {
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

    function backSnap(excludeLeft) {

        var startTime = getStart();
        var endTime = getEnd();

        var startLeftNode = snapTimesDLL.findPrev(startTime);
        var endLeftNode = snapTimesDLL.findPrev(endTime);
        var snapped = false;

        if (excludeLeft && startLeftNode && startLeftNode.data === excludeLeft) {
            //does not snap if it's its own display so therefore do nothing lolols
        } else {
            if (startLeftNode != null) {
                var startLeftDiff = startTime - startLeftNode.data

                if (!withinSnapRange(startLeftDiff) || (excludeLeft && (startTime - startLeftDiff) < excludeLeft)) {
                    //do nothing lolss
                }else {
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
                var endLeftDiff = (inStart + that.getTotalLength()) - endLeftNode.data;

                if (!withinSnapRange(endLeftDiff) || (excludeLeft && (startTime - endLeftDiff) < excludeLeft) || (startTime - endLeftDiff < 0)) {
                    //do nothing lolss
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
    ////////////////////////////////////////end of displaySnapping/////////////////////////////////////////////////////







    /**
     * Gets the art display enclosing an attached ink track display.
     */
    function getParentArtDisplay() {
        //DEPRECATED now use getParentDisplay()
        var parentArtTrack = my.experienceId,
            parentDisplays = parentArtTrack.getStorageContainer().displays, //returns the tree that holds all of the displays
            parentArtDisplay,
            currDisp,
            i;
        //for (i = 0; i < parentDisplays.length; i++) {
        //    currDisp = parentDisplays[i];
        //    if ((currDisp.getStart() <= outStart) && (outStart <= currDisp.getOutStart() + currDisp.getFadeOut())) { // use outStart to test if display is in the art display
        //        parentArtDisplay = currDisp;
        //        break;
        //    }
        //}
        var neighbors = parentDisplays.nearestNeighbors(getStart(), 1);

        return neighbors[0];
    }
    that.getParentArtDisplay = getParentArtDisplay;

    /**
     * Accepts a display that should be clamped to the current display (i.e. if it sticks out, move it in)
     * @param disp     the display to clamp
     */
    function clampDisplay(disp) {
        // in here, we should check first the start, move in, then end, move in, then clamp
        // we also need to check to make sure that 
        var dInStart = disp.getStart(),
            dOutEnd = disp.getEnd(),
            dMain = disp.getMain(),
            dFadeIn = disp.getFadeIn(),
            dFadeOut = disp.getFadeOut(),
            coDisplays = disp.getStorageContainer().displayTree, //.getContents().sort(function (a, b) { a.display.getStart() - b.display.getStart() }),//disp.getTrack().getDisplays().sort(function(a,b){a.getStart() - b.getStart()}),
            //index = coDisplays.indexOf(disp),
            newStart = dInStart, newEnd = dOutEnd, newMain = dMain, delta, dirty = false;
        
        if (dInStart < inStart + TAG.TourAuthoring.Constants.inkTrackOffset) { // first check if the ink display starts too early
            slideDisplay(disp, coDisplays, 'right', inStart + TAG.TourAuthoring.Constants.inkTrackOffset);
        }
        if (newEnd > outStart + fadeOut) { // next check if the ink display finishes too late
            slideDisplay(disp, coDisplays, 'left', outStart + fadeOut);
        }
        
        //var newInStart = disp.getStart();
        //var newOutStart = disp.getEnd() - disp.getFadeOut();
        //var newMainLength = disp.getMain();

        //var command = TAG.TourAuthoring.Command({
        //    execute: function () {
        //        disp.setTimes({
        //            inStart: newInStart,
        //            outStart: newOutStart,
        //            main: newMainLength,
        //            fadeIn: dFadeIn,
        //            fadeOut: dFadeOut,
        //        });
        //    },
        //    unexecute: function () {
        //        disp.setTimes({
        //            inStart: dInStart,
        //            outStart: dOutEnd - dFadeOut,
        //            main: dMain,
        //            fadeIn: dFadeIn,
        //            fadeOut: dFadeOut,
        //        });
        //    }
        //});
        //my.undoManager.logCommand(command);
    }
    that.clampDisplay = clampDisplay;

    function slideDisplay(disp, displayTree, direction, bound) {
        // we can always move in, since we check beforehand that there's enough room
        var newStart, newEnd, newMain;
        var oldStart = disp.getStart(), oldEnd = disp.getEnd(), oldMain = disp.getMain();
        var fout = disp.getFadeOut(), fin = disp.getFadeIn();
        var diff;
        if (!disp.has_been_clamped) {
            disp.clamped_init = {
                inStart: oldStart,
                outStart: oldEnd - fout,
                main: oldMain,
                fadeIn: fin,
                fadeOut: fout,
            };
            disp.has_been_clamped = true; //this will be reset to false in the mouseup handler
            my.timeline.clamped_displays.push(disp);
        }
        if (direction === 'right') {
            diff = bound - oldStart;
            newStart = bound;
            newEnd = oldEnd + diff;
            newMain = oldMain;
            //newEnd = Math.min(newStart + dFadeIn + dMain + dFadeOut, coDisplays[index+1] ? coDisplays[index+1].getStart() : Infinity);
            //newMain = newEnd - newStart - dFadeIn - dFadeOut;
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
            //console.log("init start: " + disp.clamped_init.inStart + ", new start: " + disp.clamped_new.inStart);
            var nextDisp = displayTree.findNext(disp.getStorageContainer());
            //if (dispArray.length > index+1 && dispArray[index + 1].display.getStart() < newEnd) {
            if (nextDisp && nextDisp.display.getStart() < newEnd) {
                slideDisplay(nextDisp.display, displayTree, 'right', newEnd);
            }
        }
        else {
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
            var prevDisp = displayTree.findPrevious(disp.getStorageContainer());
            if (prevDisp && prevDisp.display.getEnd() > newStart) {
                slideDisplay(prevDisp.display, displayTree, 'left', newStart);
            }
        }
    }
    that.slideDisplay = slideDisplay;

    /**************************Xiaoyi/Libby**************************/
    /*
     * get the translation of the clicked display when manipulated. constrained by the bounds
     * @params res              mouse movement, the rest are the bounds 
     * @return translation
    */
    function getTranslation(res, leftbound, rightbound, fadeinrightbound, fadeoutleftbound) {
        var translation;
        if (!loc || (offset !== 0 && !offset) || !my.currentDisplay) { // need that extra offset = 0 check since 0 and null are equal, arg
            console.log('Move display called when no display is selected!');
        }
        else if (loc === TAG.TourAuthoring.DisplayParts['fade-in']) {
          var newinStart = Math.constrain(my.timeManager.pxToTime(res.pivot.x - offset), // note this is defined in TAG.Util
                                    leftbound, // min
                                    inStart + fadeinrightbound);
          translation = newinStart - inStart;
        }
        else if (loc === TAG.TourAuthoring.DisplayParts['fade-out']) { // Drag fade-out section to adjust length
            var newoutStart = Math.constrain(my.timeManager.pxToTime(res.pivot.x - offset),
                              getEnd()-fadeoutleftbound-fadeOut,
                                rightbound - fadeOut); // max
            translation = newoutStart - outStart;
        }
        else if (loc === TAG.TourAuthoring.DisplayParts['main']) {
            var newmainStart = Math.constrain(my.timeManager.pxToTime(res.pivot.x - offset),
                                        leftbound + fadeIn,
                                        rightbound - fadeOut - main);
            translation = newmainStart - mainStart;
        }
        return translation;
    }
    that.getTranslation = getTranslation;


    /*
    *special move function for multi select mode!~ YoLo~!!!. 
    */
    function msMove(selectDisplays, translation, displayIn, displayOut) { // deal with ink track sliding in here if necessary
        // no display in or out, set to -1
        displayIn = displayIn || -1;
        displayOut = displayOut || -1;
        var attachedDisplays, i, j, disp;
        var totalDispLength = 0;

        // error checking
        if (!loc || (offset !== 0 && !offset)) { // need that extra offset = 0 check since 0 and null are equal, arg
            console.log('Move display called when no display is selected!');
        }
        // Actual editing
        else if (loc === TAG.TourAuthoring.DisplayParts['fade-in']) { // Drag fade-in section to adjust length
            for (i = 0; i < selectDisplays.length; i++) {
                disp = selectDisplays[i];
                if (disp.getType() === TAG.TourAuthoring.TrackType.artwork || disp.getType() === TAG.TourAuthoring.TrackType.image) {
                    // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
                    attachedDisplays = disp.getChildDisplays();
                    totalDispLength = disp.getLongestSubgroup(attachedDisplays);
                }
                if (disp.getEnd() - translation >= totalDispLength) {
                    var msinStart = disp.getStart();
                    if (displayIn !== -1) {
                        msinStart = displayIn;
                    }
                    else {
                        msinStart = msinStart + translation;
                    }
                    disp.setInStart(msinStart);
                    if (disp.getType() === TAG.TourAuthoring.TrackType.artwork || disp.getType() === TAG.TourAuthoring.TrackType.image) {
                        //var num_commands = 0;
                        for (j = 0; j < attachedDisplays.length; j++) {
                            if (selectDisplays.indexOf(attachedDisplays[j]) === -1) {
                                disp.clampDisplay(attachedDisplays[j]);
                                //num_commands++;
                            }
                        }
                        //my.undoManager.combineLast(num_commands);
                    }
                }
            }
        }
        else if (loc === TAG.TourAuthoring.DisplayParts['fade-out']) { // Drag fade-out section to adjust length
            for (i = 0; i < selectDisplays.length; i++) {
                disp = selectDisplays[i];
                if (disp.getType() === TAG.TourAuthoring.TrackType.artwork || disp.getType() === TAG.TourAuthoring.TrackType.image) {
                    // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
                    attachedDisplays = disp.getChildDisplays();
                    totalDispLength = disp.getLongestSubgroup(attachedDisplays);
                }
                if (disp.getEnd() - translation >= totalDispLength) {
                    var msOutStart = disp.getOutStart();
                    if (displayOut !== -1) {
                        outStart = displayOut;
                    }
                    else {
                        msOutStart = msOutStart + translation;
                    }
                    disp.setOutStart(msOutStart);
                    if (disp.getType() === TAG.TourAuthoring.TrackType.artwork || disp.getType() === TAG.TourAuthoring.TrackType.image) {
                        //var num_commands = 0;
                        for (j = 0; j < attachedDisplays.length; j++) {
                            if (selectDisplays.indexOf(attachedDisplays[j]) === -1) {
                                disp.clampDisplay(attachedDisplays[j]);
                                //num_commands++;
                            }
                        }
                        //my.undoManager.combineLast(num_commands);
                    }
                }
            }
        }
        else if (loc === TAG.TourAuthoring.DisplayParts['main']) { // Drag whole display, preserve length
            for (i = 0; i < selectDisplays.length; i++) {
                disp = selectDisplays[i];
                if (disp.getType() === TAG.TourAuthoring.TrackType.artwork || disp.getType() === TAG.TourAuthoring.TrackType.image) {
                    // in here, construct array of attached ink displays that are inside of the current display (can factor this out eventually to make more efficient -- here now to push)
                    attachedDisplays = disp.getChildDisplays();
                    totalDispLength = disp.getLongestSubgroup(attachedDisplays);
                }
                var msmainStart = disp.getMainStart();
                var newmainStart = translation + msmainStart;
                disp.setMainStart(newmainStart, translation);
                if (disp.getType() === TAG.TourAuthoring.TrackType.artwork || disp.getType() === TAG.TourAuthoring.TrackType.image) {
                    //var num_commands = 0;
                    for (j = 0; j < attachedDisplays.length; j++) {
                        if (selectDisplays.indexOf(attachedDisplays[j]) === -1) {
                            disp.clampDisplay(attachedDisplays[j]);
                            //num_commands++;
                        }
                    }
                    //my.undoManager.combineLast(num_commands);
                }
                disp.getTrackFromDisplay().drawLines();
            }
            
        }
        else {
            console.log('currentDisplay.loc should be one of: \'fade-in\', \'fade-out\', or \'main\'');
        }
        that.outStart = outStart; //bleveque -- added for edit ink
        that.inStart = inStart;
        my.that.drawLines();
    }
    that.msMove = msMove;
  
    function getTrackFromDisplay() {
        return my.that;
    }
    that.getTrackFromDisplay = getTrackFromDisplay;
    /**
     * Used to debug move from command line
     * Flips internal state to simulate clicks
     * Resets state when finished
     * Use only in test code or functions inside display
     */
    function internalMove(dx, left, right, dloc, doffset) {
        var res = {
            pivot: {
                x: dx
            }};
        my.currentDisplay = that;
        loc = dloc;
        offset = doffset;
        
        move(res, left, right,-1,-1);

        // reset state
        my.currentDisplay = null;
        loc = null;
        offset = null;
    }
    that.internalMove = internalMove;

    /**
     * Helper function for moving all keyframes when whole display is dragged
     * @param translate     Amount (in time) to move keyframes by
     */
    function _moveAllKeyframes(translate) {
        //var i;
        //for (i = 0; i < keyframes.length; i++) {
        //    keyframes[i].translate(translate);
        //}
        currkeyframes.map(function (i) {
            i.translate(translate);
        });
    }

    /**
     * Resets positioning and size of display
     * Called after zoom or scaling
     */
    function scale() {
        if (T2P(inStart) < 1884 && T2P(inStart) > 1883)
            console.log('');
        outStart = inStart + fadeIn + main;
        finD.css('left', T2P(inStart) + "px")
            .css('width', T2P(fadeIn) + "px");
        mainD.css('left', T2P(mainStart) + "px")
            .css('width', T2P(main) + "px");
        fioD.css('left', T2P(outStart) + "px")
            .css('width', T2P(fadeOut) + "px");
        finHandle.css('left', T2P(inStart) - 20 + "px");
        fioHandle.css('left', T2P(outStart + fadeOut) - 20 + "px");
        //var i;
        //for (i = 0; i < keyframes.length; i++) {
        //    keyframes[i].scale();
        //}
        currkeyframes.map(function (i) {
            i.scale();
        });
    }
    that.scale = scale;
    //my.timeManager.onSizing(scale); // TODO: should I just call scale() from track? It'd be fewer fn's for timemanager to handle


    /**
     * Adds a keyframe to the display / sequence
     * @param x         x location in px
     * @param y         y location in px
     * @param capture   whether the keyframe should immediately capture the state of the player
     * @returns     keyframe%A
     */
    function addKeyframe(x, y, customSpec) {
        if (canKeyframe) {
            var data = my.timeline.captureKeyframe(my.title),
                keyframe, command, i;

            if (!data) {
                console.log("unable to capture keyframe in track " + my.title);
                return;
            }

            var rinData = {
                viewport: {
                    region: {
                        center: {
                            x: data.bounds.x,
                            y: data.bounds.y
                        },
                        span: {
                            x: data.bounds.width,
                            y: data.bounds.height
                        }
                    }
                }
            }

            var keyspec = {
                    loc: {
                        x: Math.twoDecPlaces(my.timeManager.pxToTime(x)),
                        y: (my.type === TAG.TourAuthoring.TrackType.audio) ? y : 48
                    },
                    gkey: gkey,
                    display: that,
                    data: rinData,
                    displayDiv: mainD
                };

            // check that you are not making a keyframe right on top of another
            var neighbors = currkeyframes.nearestNeighbors(keyspec.loc.x, 1);
            if ((neighbors[0] && Math.abs(neighbors[0].getTime() - keyspec.loc.x) < 0.05) || 
                  (neighbors[1] && Math.abs(neighbors[1].getTime() - keyspec.loc.x) < 0.05)) {
                    return null;
            }
            //for (i = 0; i < keyframes.length; i++) {
            //    if (keyframes[i].getTime() === keyspec.loc.x) {
            //        return null; // no keyframe for u
            //    }
            //}
            //var isUnique = currkeyframes.map(function (i) {
            //    if (Math.twoDecPlaces(i.getTime()) === keyspec.loc.x) {
            //        return null;
            //    }
            //});

            keyframe = TAG.TourAuthoring.Keyframe(keyspec, my),
            command = TAG.TourAuthoring.Command({ // NOTE: don't execute command or call update! might screw up user editing
                execute: function () {
                    //keyframes.push(keyframe);
                    //sortKeyframes();
                    currkeyframes.add(keyframe);
                    keyframe.reactivateKeyframe();
                    keyframe.restoreHandlers();
                    my.that.addKeyframeToLines(keyframe);
                    my.update();
                },
                unexecute: function () {
                    // keyframe.remove() // TODO: add svg removal
                    keyframe.remove(false, true);
                    keyframe.setDeselected();
                    //keyframes.remove(keyframe);
                    my.update();
                }
            });
            my.undoManager.logCommand(command);
            console.log('logging');

            //keyframes.push(keyframe);
            //sortKeyframes();
            currkeyframes.add(keyframe);

            if (my.that.getMinimizedState()) {
                keyframe.toggleCircle();
            }

            var reloadingEvent = document.createEvent('Event');
            reloadingEvent.initEvent('playerReloading', true, true);
            $('body')[0].dispatchEvent(reloadingEvent);

            return keyframe;
        } else {
            return null;
        }
    }
    that.addKeyframe = addKeyframe;

    /**
     * Adds a keyframe to the display / sequence using prespecified data
     * @param x         x location in px
     * @param y         y location in px
     * @param capture   whether the keyframe should immediately capture the state of the player
     * @returns     keyframe%A
     */
    function addKeyframeWithData(x, y, data) {
        if (canKeyframe) {
            var keyframe, command, i;

            var keyspec = {
                loc: {
                    x: Math.twoDecPlaces(my.timeManager.pxToTime(x)),
                    y: (my.type === TAG.TourAuthoring.TrackType.audio) ? y : 48
                },
                gkey: gkey,
                display: that,
                data: data,
                displayDiv: mainD
            };

            // check that you are not making a keyframe right on top of another
            var neighbors = currkeyframes.nearestNeighbors(keyspec.loc.x, 1);
            if ((neighbors[0] && Math.abs(neighbors[0].getTime() - keyspec.loc.x) < 0.05) ||
                  (neighbors[1] && Math.abs(neighbors[1].getTime() - keyspec.loc.x) < 0.05)) {
                return null;
            }
            //for (i = 0; i < keyframes.length; i++) {
            //    if (keyframes[i].getTime() === keyspec.loc.x) {
            //        return null; // no keyframe for u
            //    }
            //}
            //var isUnique = currkeyframes.map(function (i) {
            //    if (Math.twoDecPlaces(i.getTime()) === keyspec.loc.x) {
            //        return null;
            //    }
            //});

            keyframe = TAG.TourAuthoring.Keyframe(keyspec, my),
            command = TAG.TourAuthoring.Command({ // NOTE: don't execute command or call update! might screw up user editing
                execute: function () {
                    //keyframes.push(keyframe);
                    //sortKeyframes();
                    currkeyframes.add(keyframe);
                    keyframe.reactivateKeyframe();
                    keyframe.restoreHandlers();
                    my.that.addKeyframeToLines(keyframe);
                    my.update();
                },
                unexecute: function () {
                    // keyframe.remove() // TODO: add svg removal
                    keyframe.remove(false, true);
                    keyframe.setDeselected();
                    //keyframes.remove(keyframe);
                    my.update();
                }
            });
            my.undoManager.logCommand(command);
            console.log('logging');

            //keyframes.push(keyframe);
            //sortKeyframes();
            currkeyframes.add(keyframe);

            if (my.that.getMinimizedState()) {
                keyframe.toggleCircle();
            }

            var reloadingEvent = document.createEvent('Event');
            reloadingEvent.initEvent('playerReloading', true, true);
            $('body')[0].dispatchEvent(reloadingEvent);

            return keyframe;
        } else {
            return null;
        }
    }
    that.addKeyframeWithData = addKeyframeWithData;

    /**
    * Function to remove keyframe from keyframe array
    */
    function removeKeyframe(keyframe) {
        //keyframes.remove(keyframe);
        //don't need to update position anymore
        //for (var i = 0; i < keyframes.length; i++) {
        //    keyframes[i].updatePosition(i);
        //}
        //return i;
        currkeyframes.remove(keyframe);
    }
    that.removeKeyframe = removeKeyframe;

    //Function to add keyframe to keyframe array
    function insertKeyframe(keyframe){
        currkeyframes.add(keyframe);
    }
    that.insertKeyframe = insertKeyframe;

    /**
     * Sorts the keyframe array
     * Must be called after a keyframe is moved, as keyframes can change order
     */
    //no longer being used
    function sortKeyframes() {
        var i;
        keyframes.sort(_keyframesort);
        for (i = 0; i < keyframes.length; i++) {
            keyframes[i].updatePosition(i);
        }
    }
    that.sortKeyframes = sortKeyframes;

    /**
     * Used for passing last state of display on to next display
     */
    function getLastKeyframe() {
        return currkeyframes.max();
    }
    that.getLastKeyframe = getLastKeyframe;

    /**
     * Get keyframes belonging to display
     * Used for finding bounds of keyframe movement
     */
    function getKeyframes() {
        return currkeyframes;
    }
    that.getKeyframes = getKeyframes;

    /**
     * Helper function for keeping keyframes sorted
     * Sorted in ascending order by x position (in time)
     */
    //no longer being used
    function _keyframesort(a, b) {
        if (a.getTime() < b.getTime()) {
            return -1;
        } else if (a.getTime() === b.getTime) {
            return 0;
        } else {
            return 1;
        }
    }
    //no longer being used
    function _keyframecomp(a, b) {
        return a.getTime() < b.getTime();
    }

    //////
    // RIN

    /**
     * Converts Display to Experience Stream
     * @param data          new ES is inserted into this object
     * @param type          type header identifying the type of ES / media
     * @param passthrough   whether this ES (layer) can be manipulated
     * @param prevState     final keyframe from previous display, defines start state for this display
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
            case TAG.TourAuthoring.TrackType.artwork:
                data.experienceStreams[esTitle].data.ContentType = '<SingleDeepZoomImage/>';
                data.experienceStreams[esTitle].header = {};
                data.experienceStreams[esTitle].header.defaultKeyframeSequence = esTitle;
                data.experienceStreams[esTitle].keyframes = _getKeyframesRIN(prevState);
                break;

            case TAG.TourAuthoring.TrackType.image:
                data.experienceStreams[esTitle].header = {};
                data.experienceStreams[esTitle].header.defaultKeyframeSequence = esTitle;
                data.experienceStreams[esTitle].keyframes = _getKeyframesRIN(prevState);
                break;

            case TAG.TourAuthoring.TrackType.audio:
                data.experienceStreams[esTitle].header = {};
                data.experienceStreams[esTitle].header.defaultKeyframeSequence = esTitle;
                data.experienceStreams[esTitle].keyframes = _getKeyframesRIN(prevState);
                break;

            case TAG.TourAuthoring.TrackType.video:
                data.experienceStreams[esTitle].data.markers = {
                    'beginAt': 0,
                    'endAt': main
                };
                break;

            case TAG.TourAuthoring.TrackType.ink:
                break;

            default:
                console.log('RIN track type not yet implemented');
        }
    }
    that.toES = toES;

    /**
     * Helper function for collecting RIN data of associated keyframes
     */
    function _getKeyframesRIN(prevState) {
        var i, rin = [],
            first;
        var dispkfs = dataHolder.getKeyframes(that.getStorageContainer());
        var kfarray = dispkfs.getContents();
        if (kfarray.length > 0) {
            if (my.type === TAG.TourAuthoring.TrackType.artwork || my.type === TAG.TourAuthoring.TrackType.audio || my.type === TAG.TourAuthoring.TrackType.image) {
                // Copy first keyframe that appears in display and place copy at start
                // This means display will begin w/ state defined by first keyframe instead of jumping to it
                first = dispkfs.min().toRIN();
                first.offset = 0;
                first.init = true;
                rin.push(first);
            }
                
            //for (i = 0; i < keyframes.length; i++) {
            //    rin.push(keyframes[i].toRIN());
            //}
            dispkfs.map(function (i) {
                rin.push(i.toRIN());
            });

        } else if (prevState) { // If there are no keyframes but are in prev display
            first = prevState.toRIN();
            first.offset = 0;
            first.init = true;
            rin.push(first);
        } else if (my.type === TAG.TourAuthoring.TrackType.audio) {
            first = {
                offset: 0,
                init: true,
                holdDuration: 0,
                state: { // Need to determine where keyframe info is getting stored, also why does it need a media source?
                    'sound': {
                        'volume': TAG.TourAuthoring.Constants.defaultVolume
                    }
                }
            };
            rin.push(first);

        } else if (kfarray.length == 0) {
            //var data = my.timeline.captureKeyframe(my.title);
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
            } else if (first.bounds) {
                // from ITE DZ format
                var rin_first = {
                    state: {
                        viewport: {
                            region: {
                                center: {
                                    x: first.bounds.x,
                                    y: first.bounds.y
                                },
                                span: {
                                    x: first.bounds.width,
                                    y: first.bounds.height
                                }
                            },
                        },
                    },
                };
                first = rin_first;
            } else {
                // from ITE image format
                var rin_first = {
                    state: {
                        viewport: {
                            region: {
                                center: {
                                    x: first.left,
                                    y: first.top
                                },
                                span: {
                                    x: first.width,
                                    y: first.height
                                }
                            },
                        },
                    },
                };
                first = rin_first;
            }
            //first.holdDuration = 0;
            first.offset = 0;
            first.init = true;
            rin.push(first);
        }
        return rin;
    }

    /**
     * Constructs Screenplay entry from display
     * Returns object with begin, xml params so entries can be sorted
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
        if (my.type === TAG.TourAuthoring.TrackType.audio) {
            spe.dominantMedia = 'audio';
            spe.volume = 1;
        } else {
            spe.dominantMedia = 'visual';
            spe.volume = 1;
        }
        
        return spe;
    }
    that.toScreenPlayEntry = toScreenPlayEntry;

    function loadRIN(rin) {
        
    }
    that.loadRIN = loadRIN;

    return that;
};
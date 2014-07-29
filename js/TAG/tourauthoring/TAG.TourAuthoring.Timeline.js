LADS.Util.makeNamespace('LADS.TourAuthoring.Timeline');

/**Manages user editing of tracks and creating the elements of the timeline on the tour authoring screen
 * @class LADS.TourAuthoring.Timeline
 * @constructor
 * @param {Object} spec      @params - timeManager, undoManager, viewer 
 * @return {Object} that     public methods of LADS.TourAuthoring.Timeline
 */
LADS.TourAuthoring.Timeline = function (spec) {
    "use strict";

    // Divs that need to be held onto
    var mainScrollHider,                                                                                            // the base timeline div
        editor,                                                                                                     // Top-level container, vertical scrolling
        trackTitleWrapper,                                                                                          // div with track heads, no scrolling at all
        timeRuler,                                                                                                  // Ruler for measuring time in the timeline, placed at the top of the timeline
        timeline,                                                                                                   // Track area div with time ruler and track body, horizontal scrolling
        trackBody,                                                                                                  // Track body container, xy scrolling
        playhead,                                                                                                   // div containing the playhead svg
        playheadtop,                                                                                                // div containing the playhead handle svg
        playheadSVG,                                                                                                // icon for the playhead
        playHeadGroup,                                                                                              // the other parts of the playhead
        playHeadTop,                                                                                                // top circle of the playhead
        playHead,                                                                                                   // the entire playhead on the timeline
        compCont,                                                                                                   // instance of ComponentControls
        onUpdateNumCalls = 0,                                                                                       // RIN related number used in coreUpdate
        trackid = 0,                                                                                                // IDs for uniquely identifying tracks
        docfrag,                                                                                                    // part of the document to which the timeline UI is appended

        // booleans
        tourExited = false,                                                                                         // boolean checking if a tour is still open or not
        loaded = false,                                                                                             // boolean blocking timeline reloads until tour is fully initialized
        isMenuOpen = false,                                                                                         // boolean checking for the current menu state
        editInkOn = false,                                                                                          // checks if ink editing is on
        modifyingInk = false,                                                                                       // checks if an ink track is being modified
        sendScrollLeft = true,                                                                                      // checks if left scrolling is possible on the timeline ruler
        sendScrollTop = true,                                                                                       // checks if it's possible to scroll to the top of a list of tracks
        multiSelection = false,                                                                                     // checks for the multi-selection option status

        manipObjects = {},                                                                                          // the list of manipulatable objects such as the timeline ruler
        tracks = [],                                                                                                // Array of tracks on the timeline
        multiSelectionArray = [],                                                                                   // Array of selected tracks
        data = [],                                                                                                  // data stores the current positions for undo
        olddata = [],                                                                                               // old data stores the current positions for redo
        clamped_displays = [],                                                                                      // stores changed display states

        // Handles time stuff
        playbackControls = spec.playbackControls,                                                                   // handles the play/pause stuff in the timeline
        timeManager = spec.timeManager,                                                                             // all time related tasks in the timeline
        root = spec.root,                                                                                           // the root element of the timeline
        undoManager = spec.undoManager,                                                                             // keeps track of the order of commands for the undo action
        viewer = spec.viewer,                                                                                       // preview window for the current tour being edited
        verticalScroller,                                                                                           // vertical scrollbar to scroll through the list of tracks in the timeline
        verticalScrollBox,                                                                                          // box containing vertical scrollbar
        sliderPane,                                                                                                 // Container and background for Slider
        dataHolder = spec.dataHolder,                                                                               // contains all tour data
        selectedTrack = {
            current: null
        },                                                                                                          // this is an object so contents can be manipulated by track objects

        editorWidth = $(window).width() * 0.995,                                                                    // width of the editing window
        editorHeight = $(window).height() * 0.4825,                                                                 // height of the editing window
        trackTitleWidth = 0.127 * $(window).width(),                                                                // width of the title of a track
        trackAreaHeight = editorHeight - 5 - LADS.TourAuthoring.Constants.timeRulerSize,                            // height of the track div

        editInkOverlay = $(LADS.Util.UI.blockInteractionOverlay()),                                                 // overlay for when 'edit ink' component option is selected while playhead is not over the art track
        overlayLabel = $(document.createElement('div')),                                                            // div to put the text for the 'edit ink' message
        deleteConfirmationOverlay = $(document.createElement('div')),                                               // overlay that covers the screen with the 'delete' pop-up confirmation box
  
        queue = LADS.Util.createQueue(),                                                                            // creates a queue to update the timeline ruler
        newLabels = $(),                                                                                            // creates a new timeline label to add to the queue
        closeMenuHolder,                                                                                            // function to close the menu
        debounce = $.debounce(200, coreUpdate),                                                                     // used in RIN code <Description>

        that = {                                                                                                    // object with all the public methods of the class
            faderUpdate: faderUpdate,
            showEditorOverlay: showEditorOverlay,
            hideEditorOverlay: hideEditorOverlay,
            updateVerticalScroller: updateVerticalScroller,
            enableDisableDrag: enableDisableDrag,
            getEditInkOn: getEditInkOn,
            setEditInkOn: setEditInkOn,
            getMultiSelection: getMultiSelection,
            addToDOM: addToDOM,
            getSelectedTrack: getSelectedTrack,        
            setCompControl: setCompControl,
            showEditDraw: showEditDraw,
            showEditText: showEditText,
            showEditTransparency: showEditTransparency,
            setModifyingInk: setModifyingInk,
            removeInkSession: removeInkSession,
            updateOldData: updateOldData,
            newDataArray: newDataArray,
            getOldData: getOldData,
            moveSelect: moveSelect,
            getDisplayData: getDisplayData,
            allDeselected: allDeselected,
            getMultiSelectionArray: getMultiSelectionArray,
            getTrackslength: getTrackslength,
            getTracks: getTracks,
            getTimeRuler: getTimeRuler,
            setisMenuOpen: setisMenuOpen,
            getisMenuOpen: getisMenuOpen,       
            setCloseMenu: setCloseMenu,
            getCloseMenu: getCloseMenu,
            getLastDisplayTime: getLastDisplayTime,
            fixTrackTitle: fixTrackTitle,
            addAudioTrack: addAudioTrack,
            addVideoTrack: addVideoTrack,
            addArtworkTrack: addArtworkTrack,
            addImageTrack: addImageTrack,
            addInkTrack: addInkTrack,
            prependAddToDom: prependAddToDom,
            getNumTracks: getNumTracks,
            getRelatedArtworks: getRelatedArtworks,
            getTrackBody: getTrackBody,
            checkForArtworks: checkForArtworks,
            disableInk: disableInk,
            setLoaded: setLoaded,
            receiveKeyframe: receiveKeyframe,
            capturingOff: capturingOff,
            captureKeyframe: captureKeyframe,
            getViewer: getViewer,
            getDataHolder: getDataHolder,
            toRIN: toRIN,
            onUpdate: onUpdate,
            loadRIN: loadRIN,
            cancelAccel: cancelAccel,
            getClampedDisplays: getClampedDisplays,
            _removeTrack: _removeTrack
        };

   
    editInkOverlay.addClass('editInkOverlay');
    overlayLabel.text("Ink is being edited...");

    // Set timeline in viewer
    viewer.setTimeline(that);
    createTimeline();

    /**Sets up the timeline 
     * @method createTimeline
     */
    function createTimeline() {
        var trackScrollVeil = $(document.createElement('div')),                                            // veil for track title scrollbar
            horizBlock = $(document.createElement('div')),                                                 // Cover block to hide playhead outside of display area                                          
            vertBlock = $(document.createElement('div')),                                                  // ruler scrollbar veil
            rulerScrollVeil = $(document.createElement('div')),                                            // veil for the timeline ruler
            rulerWrapper = $(document.createElement('div')),                                               // time ruler wrapper
            multiSelButtonPanel = $(document.createElement('div')),                                        // panel to hold the multi-select button
            multiSelButton = $(document.createElement('button')),                                          // the multi-select button
            sliderParts,                                                                                   // parts to be attached to the slider pane
            constrainedHeight = editorHeight - 5,                                                          // height for the mainScrollHider
            constrainedWidth = editorWidth - 17;                                                           // width for the mainScrollHider
        
        // setting global variables
        mainScrollHider = $(document.createElement('div'));                                                 
        editor = $(document.createElement('div'));                                                          
        trackTitleWrapper = $(document.createElement('div'));                                               
        trackBody = $(document.createElement('div'));                                                       
        timeRuler = $(document.createElement('div'));                                                       
        timeline = $(document.createElement('div'));                                                                                                              
        sliderPane = $(document.createElement('div'));                                                      

        mainScrollHider.attr('class', 'mainScrollHider');
        mainScrollHider.css({
            "background-color": "rgb(219,218,199)",
            'overflow': 'hidden',
            'height': editorHeight + 'px',
            'width': editorWidth + 'px',
            'margin-top': '3%',
            'position': 'relative',
        });

        editor.attr('id', 'editor');
        editor.css({
            'height': '100%',
            "width": '100%',
            'overflow': 'hidden',
        });

        trackScrollVeil.attr('id', 'trackScrollVeil');
        trackScrollVeil.css({
            'width': trackTitleWidth + 20 + 'px',
            'height': trackAreaHeight + 'px',
            'margin-left': $(window).width() * 0.02 - 20 + 'px',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'float': 'left',
            'clear': 'left',
            'top': '0px',
            'position': 'relative'
        });

        trackTitleWrapper.attr('id', 'trackTitleWrapper');
        trackTitleWrapper.css({
            'width': trackTitleWidth + 20 + "px",
            'height': '100%',
            'margin-left': '1.5%',
            'position': 'relative',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'z-index': '102',
            'background-color': 'rgb(219, 218, 199)',
        });

        trackBody.attr('id', 'trackBody');
        trackBody.css({
            'height': trackAreaHeight + 'px',
            'margin-left': '15%',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'position': 'relative',
        });

        timeRuler.attr('id', 'timeRuler');
        timeRuler.css({
            'position': 'relative',
            'height': (LADS.TourAuthoring.Constants.timeRulerSize + 17) + 'px', // changed 12 %
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
        });
        
        timeline.attr('id', 'timeline');
        timeline.css({
            'height': '200%',
            'width': '97%',
            'overflow': 'hidden',
            'position': 'relative',
        });

        horizBlock.attr('id', 'horizBlock');
        horizBlock.css({
            'height': LADS.TourAuthoring.Constants.timeRulerSize + 'px',
            'width': '15.5%',
            "background-color": "rgb(219,218,199)",
            'position': 'absolute',
            'z-index': '102',
        });

        vertBlock.attr('id', 'vertBlock');
        vertBlock.css({
            'height': '100%',
            'width': '1.5%',
            "background-color": "rgb(219,218,199)",
            'position': 'absolute',
            'z-index': '102',
        });

        rulerScrollVeil.attr('id', 'rulerScrollVeil');
        rulerScrollVeil.css({
            'height': LADS.TourAuthoring.Constants.timeRulerSize + 'px',
            'width': '85%',
            'margin-left': '15.4%',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',

        });

        rulerWrapper.attr('id', 'rulerWrapper');
        rulerWrapper.css({
            'width': '85%',
            'height': (LADS.TourAuthoring.Constants.timeRulerSize) + 'px',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'position': 'absolute',
            'z-index': '100',
            'box-shadow': '-7px 5px 10px #888',
        });

        moveScroll(rulerWrapper);

        multiSelButtonPanel.addClass("multiSelButtonPanel");
        multiSelButtonPanel.css({
            'top': '12.5%',
            'left': '25%',
            'position': 'relative',
            "width": '60%',
            'height': '75%',
            'float': 'left',
            'z-index': '5',
        });

        multiSelButton.attr('type', 'button');
        multiSelButton.attr('id', "multiSelButton");
        multiSelButton.text("Multi-Select");
        multiSelButton.attr('type', 'button');
        multiSelButton.css({
            "color": "black",
            "border-color": "black",
            "left": "5%",
            'top': '3%',
            "position": "absolute",
            "font-size": '120%',
            'float': 'left',
            'width': '100%'
        });

        $(multiSelButton).click(function () {
            if (getEditInkOn() === true) {
                return false;
            }
            if (multiSelection === true) {
                multiSelection = false;
                multiSelButton.css({
                    'color': 'black',
                    'background-color': 'transparent',
                    "border-color": "black"
                });
            } else {
                multiSelection = true;
                multiSelButton.css({
                    'color': 'white',
                    'background-color': 'darkgreen',
                    "border-color": "white",
                });
            }
        });
        multiSelButton.fitText(0.8);

        editInkOverlay.css({
            top: LADS.Util.Constants.timeRulerSize,
            width: '100%',
            height: '100%',
            'margin-left': "2%",
            'position': 'absolute',
            'z-index': '10000',
            'background-color': 'rgba(0, 0, 0, 0.5)'
        });

        overlayLabel.css({
            'position': 'relative',
            'left': '33.5%',
            'top': '35%',
            'font-size': '22pt',
        });

        editInkOverlay.hide();

        sliderPane.attr('id', 'verticalSliderPane');
        sliderPane.css({
            'position': 'absolute',
            'left': '97.35%',
            'top': 54 + 'px',
            'display': 'inline-block',
            'width': '1%',
            'height': trackAreaHeight - 8 + 'px',
        });
        
        sliderParts = createVerticalScroller();
        sliderPane.append(sliderParts[0]);
        sliderPane.append(sliderParts[1]);
        // appending elements to documentFragment, which is then appended in AddToDOM method
        docfrag = document.createDocumentFragment();

        docfrag.appendChild(mainScrollHider[0]);
        mainScrollHider.append(editor);                                                                 // editor => horiz scrolling hider
        editor.append(timeline);                                                                        // track body + ruler area => editor
        multiSelButtonPanel.append(multiSelButton);
        horizBlock.append(multiSelButtonPanel);
        timeline.append(horizBlock);
        timeline.append(vertBlock);
        timeline.append(rulerScrollVeil);
        rulerScrollVeil.append(rulerWrapper);
        rulerWrapper.append(timeRuler);
        editor.append(sliderPane);
        editor.append(editInkOverlay);
        editInkOverlay.append(overlayLabel);
        timeline.append(trackScrollVeil);
        trackScrollVeil.append(trackTitleWrapper);                                                      // track head panel => editor
        timeline.append(trackBody);

        updateVerticalScroller();
        mainScrollHider.css({
            'height': constrainedHeight + 'px',
            'width': constrainedWidth + 'px'
        });
        multiSelButton.fitText(0.8);

        createPlayhead();
    }

    /**updates timeline when tour length changes
     * @method faderUpdate
     */
    function faderUpdate() {
        timeManager.seek(timeManager.pxToTime(timeManager.getCurrentPx() + trackBody.scrollLeft()));
    }
    
    /**moving and scrolling
     * @method moveScroll
     * @param {HTML Element} wrap       rulerWrapper div 
     */
    function moveScroll(wrap) {
        var toMoveLR = 0,
            throttleLR,
            toMoveUD = 0,
            throttleUD;
        var updateSlider = null;
        var _timeRulerSize = function (ev) {
            timeRuler.css('width', timeManager.timeToPx(ev.end) + 'px');
        };

        manipObjects.ruler = (LADS.Util.makeManipulatable(wrap[0], {
            onManipulate: function (res) {
                wrap.scrollLeft(wrap.scrollLeft() - res.translation.x);
                manipObjects.track.cancelAccel();
            },
            onScroll: function (delta) {
                var close = getCloseMenu();
                if (close) {
                    close();
                }

                if (delta === 1.1) {
                    wrap.scrollLeft(wrap.scrollLeft() - 30);
                } else {
                    wrap.scrollLeft(wrap.scrollLeft() + 30);
                }

                manipObjects.track.cancelAccel();
            },
            onTapped: function (evt) {
                if (modifyingInk) {
                    return false;
                }
                timeManager.seek(timeManager.pxToTime(evt.position.x + trackBody.scrollLeft()));
            }
        }));

        manipObjects.track = (LADS.Util.makeManipulatable(trackBody[0], {
            onManipulate: function (res) {
                var newY;
                manipObjects.ruler.cancelAccel();
                if (res.translation.x !== 0) {
                    console.log('trans = ' + res.translation.x);
                    console.log('pivot = ' + res.pivot.x);
                    trackBody.scrollLeft(trackBody.scrollLeft() - res.translation.x);
                }
                if (res.translation.y !== 0) {
                    if (calculateTotalTrackHeight() > trackBody.height()) {
                        newY = trackBody.scrollTop() - res.translation.y;
                        trackBody.scrollTop(newY);
                        scrollWithBody(newY);
                    }
                }
            }
        }));

        wrap.scroll(function (evt) {
            if (sendScrollLeft) {
                sendScrollLeft = false;
                trackBody.scrollLeft(wrap.scrollLeft());
            } else {
                sendScrollLeft = true;
            }
        });

        trackTitleWrapper.scroll(function (evt) {
            if (sendScrollTop) {
                sendScrollTop = false;
                trackBody.scrollTop(trackTitleWrapper.scrollTop());
                scrollWithBody(trackTitleWrapper.scrollTop());
            } else {
                sendScrollTop = true;
            }
        });

        trackBody.scroll(function (evt) {
            if (sendScrollLeft) {
                sendScrollLeft = false;
                wrap.scrollLeft(trackBody.scrollLeft());
            } else {
                sendScrollLeft = true;
            }

            if (updateSlider) {
                updateSlider();
            }
            seekPlayhead();

            if (sendScrollTop) {
                sendScrollTop = false;
                if (calculateTotalTrackHeight() < trackBody.height()) {
                    return;
                }
                trackTitleWrapper.scrollTop(trackBody.scrollTop());
                updateVerticalScroller();
                scrollWithBody(trackTitleWrapper.scrollTop());
            } else {
                sendScrollTop = true;
            }
        });

        /**updates the slider box when tour time is changed
         * @method registerUpdateSlider
         * @param realUpdate
         */
        function registerUpdateSlider(realUpdate) {
            updateSlider = realUpdate;
        }
        that.registerUpdateSlider = registerUpdateSlider;

        _timeRulerSize(timeManager.getDuration());
        timeManager.onSizing(_timeRulerSize);
    }

    /**Creates the playhead for the timeline
     * @method createPlayhead 
     */
    function createPlayhead() {
        var rawSvgElem,
            rawGElem,
            $body;

        playheadSVG = d3.select(timeline[0])
                        .append("svg")
                        .style('position', 'absolute')
                        .style('left', '0px').style('top', '0px')
                        .attr('id', 'playhead')
                        .attr("width", '0%')
                        .style("z-index","101")
                        .attr("height", '100%');                                            // div to be transformed into an svg group
        rawSvgElem = playheadSVG[0][0];
        playHeadGroup = playheadSVG.append("g").attr("transform", "translate(5,0)");
        rawGElem = playHeadGroup[0][0];
        playHeadTop = playHeadGroup.append("circle")
                        .attr('cx', '0')
                        .attr('cy', '27px')
                        .attr('r', '18px')
                        .attr('fill', 'black')
                        .attr('stroke', 'black')
                        .attr('stroke-width', '7px')
                        .attr('fill-opacity', '0');
        
        playHead = playHeadGroup.append("line")
                        .attr('x1', '0')
                        .attr('y1', '45px') // 11.4%
                        .attr('x2', '0')
                        .attr('y2', '100%')
                        .attr('pointer-events', 'none')
                        .attr('stroke', 'black')
                        .attr('stroke-width', '1px');

        $body = $('body');
        playHeadGroup.on('mousedown', function () {
            var start,
                startTime,
                time;

            start = d3.mouse($body[0])[0];
            startTime = timeManager.getCurrentPx();
            $body.on('mousemove.playhead', function (ev) {
                if (editInkOn === true) {      
                    return false;
                }
                time = startTime + (ev.pageX - start);
                if (time > $('#timeRuler').width()) {           // Don't let the playhead be moved out of bounds
                    time = $('#timeRuler').width();
                } else if (time < 0) {
                    time = 0;
                } else {
                    start = ev.pageX;                           // Only update start if the mouse isn't out of bounds so the mouse, synchronizes with the playhead
                }
                timeManager.seek(timeManager.pxToTime(time));
                startTime = time;
            });
            $body.on('mouseup.playhead', function () {
                $body.off('mousemove.playhead');
                $body.off('mouseup.playhead');
            });
        });
        timeManager.onSeek(seekPlayhead);
        timeManager.onSizing(seekPlayhead);
        timeManager.onPlay(seekPlayhead);
    }

    /**Seeks the playhead on the timeline
     * @method seekPlayhead
     */
    function seekPlayhead() {
        var time = timeManager.getCurrentPx(); // fix editor.width() * 0.15 -- if we ever change the margin of trackBody, this will be really confusing!
        playHeadGroup.attr("transform", "translate(" + (time + editor.width() * 0.15 - trackBody.scrollLeft()) + ")");
    }



  /******** beginning of _makeHTML - Surbhi ********/

   /* (function _makeHTML() {
        // container div that hides vertical scrollbar of top-level container
        /*mainScrollHider = $(document.createElement('div'));
        mainScrollHider.attr('class', 'mainScrollHider');
        mainScrollHider.css({
            "background-color": "rgb(219,218,199)",
            'overflow': 'hidden',
            'height': editorHeight + 'px',
            'width': editorWidth + 'px',
            'margin-top': '3%',
            'position': 'relative',
        });

        // Top-level container, vertical scrolling
        editor = $(document.createElement('div'));
        editor.attr('id', 'editor');
        editor.css({
            'height': '100%',
            "width": '100%', 
            //'width': '100%',
            'overflow': 'hidden',
        });


        // veil for track title scrollbar
        var trackScrollVeil = $(document.createElement('div'));
        trackScrollVeil.attr('id', 'trackScrollVeil');
        trackScrollVeil.css({
            'width': trackTitleWidth + 20 + 'px',
            'height': trackAreaHeight + 'px',
            'margin-left': $(window).width() * 0.02 - 20 + 'px',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'float': 'left',
            'clear': 'left',
            'top': '0px',
            'position':'relative'
        });
        // div with track heads, no scrolling at all
        trackTitleWrapper = $(document.createElement('div'));
        trackTitleWrapper.attr('id', 'trackTitleWrapper');
        trackTitleWrapper.css({
            'width': trackTitleWidth + 20 + "px",
            'height': '100%',
            'margin-left': '1.5%',
            'position': 'relative',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'z-index': '102',
            'background-color': 'rgb(219, 218, 199)',
        });

        // Track body container, xy scrolling
        trackBody = $(document.createElement('div'));
        trackBody.attr('id', 'trackBody');
        trackBody.css({
            'height': trackAreaHeight + 'px',
            'margin-left': '15%',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'position': 'relative',
        });

        // Ruler for measuring time in the timeline
        // Placed at the top of the timeline
        timeRuler = $(document.createElement('div'));
        timeRuler.css({
            'position': 'relative',
            'height': (LADS.TourAuthoring.Constants.timeRulerSize + 17) + 'px', // changed 12 %
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
        });
        timeRuler.attr('id', 'timeRuler');

        // Track area div with time ruler and track body, horizontal scrolling
        timeline = $(document.createElement('div'));
        timeline.attr('id', 'timeline');
        timeline.css({
            'height': '200%',
            'width': '97%',
            'overflow': 'hidden',
            'position': 'relative',
        });

        // Cover block to hide playhead outside of display area
        var horizBlock = $(document.createElement('div'));
        horizBlock.attr('id', 'horizBlock');
        horizBlock.css({
            'height': LADS.TourAuthoring.Constants.timeRulerSize + 'px',
            'width': '15.5%',
            "background-color": "rgb(219,218,199)",
            'position': 'absolute',
            'z-index': '102',
        });

        var vertBlock = $(document.createElement('div'));
        vertBlock.attr('id', 'vertBlock');
        vertBlock.css({
            'height': '100%',
            'width': '1.5%',
            "background-color": "rgb(219,218,199)",
            'position': 'absolute',
            'z-index': '102',
        });

        // ruler scrollbar veil
        var rulerScrollVeil = $(document.createElement('div'));
        rulerScrollVeil.attr('id', 'rulerScrollVeil');
        rulerScrollVeil.css({
            'height': LADS.TourAuthoring.Constants.timeRulerSize + 'px',
            'width': '85%',
            'margin-left': '15.4%',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',

        });

        // time ruler wrapper
        var rulerWrapper = $(document.createElement('div'));
        rulerWrapper.attr('id', 'rulerWrapper');
        rulerWrapper.css({
            'width': '85%',
            'height': (LADS.TourAuthoring.Constants.timeRulerSize) + 'px',
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'position': 'absolute',
            'z-index': '100',
            'box-shadow' : '-7px 5px 10px #888',
        }); */
        // this function will be called when change tour length to update fader position
      /*  function faderUpdate() {
            timeManager.seek(timeManager.pxToTime(timeManager.getCurrentPx() + trackBody.scrollLeft()));
        }
        that.faderUpdate = faderUpdate;

        manipObjects.ruler = (LADS.Util.makeManipulatable(rulerWrapper[0], {
            onManipulate: function (res) {
                rulerWrapper.scrollLeft(rulerWrapper.scrollLeft() - res.translation.x);
                manipObjects.track.cancelAccel();
            },
            onScroll: function (delta) {
                var close = getCloseMenu();
                if (close) {
                    close();
                }

                if (delta === 1.1) {
                    rulerWrapper.scrollLeft(rulerWrapper.scrollLeft() - 30);
                } else {
                    rulerWrapper.scrollLeft(rulerWrapper.scrollLeft() + 30);
                }

                manipObjects.track.cancelAccel();
            },
            onTapped: function (evt) {
                if (modifyingInk) {
                    return false;
                }
                timeManager.seek(timeManager.pxToTime(evt.position.x + trackBody.scrollLeft()));
            }
        })); 

        var toMoveLR = 0;
        var throttleLR;
        var toMoveUD = 0;
        var throttleUD;
        manipObjects.track = (LADS.Util.makeManipulatable(trackBody[0], {
            onManipulate: function (res) {
                manipObjects.ruler.cancelAccel();
                if (res.translation.x !== 0) {
                    console.log('trans = '+res.translation.x);
                    console.log('pivot = '+res.pivot.x);
                    trackBody.scrollLeft(trackBody.scrollLeft() - res.translation.x);
                }
                if (res.translation.y !== 0) {
                    if (calculateTotalTrackHeight() > trackBody.height()) {
                        var newY = trackBody.scrollTop() - res.translation.y;
                        trackBody.scrollTop(newY);
                        scrollWithBody(newY);
                    }
                }
            }
        }));

        rulerWrapper.scroll(function (evt) {
            if (sendScrollLeft) {
                sendScrollLeft = false;
                trackBody.scrollLeft(rulerWrapper.scrollLeft());
            } else {
                sendScrollLeft = true;
            }
        }); 

        trackTitleWrapper.scroll(function (evt) {
            if (sendScrollTop) {
                sendScrollTop = false;
                trackBody.scrollTop(trackTitleWrapper.scrollTop());
                scrollWithBody(trackTitleWrapper.scrollTop());
            } else {
                sendScrollTop = true;
            }
        });

        trackBody.scroll(function (evt) {
            if (sendScrollLeft) {
                sendScrollLeft = false;
                rulerWrapper.scrollLeft(trackBody.scrollLeft());
            } else {
                sendScrollLeft = true;
            }

            // Would be nice to figure out a way to avoid calling this unnecessarily
            // (ie. when the slider is moved)
            if (updateSlider) {
                updateSlider();
            }
            _seekPlayhead();

            if (sendScrollTop) {
                sendScrollTop = false;
                if (calculateTotalTrackHeight() < trackBody.height()) {
                    return;
                }
                trackTitleWrapper.scrollTop(trackBody.scrollTop());
                updateVerticalScroller();
                scrollWithBody(trackTitleWrapper.scrollTop());
            } else {
                sendScrollTop = true;
            }
        }); 

        var updateSlider = null;
        function registerUpdateSlider(realUpdate) {
            updateSlider = realUpdate;
        }
        that.registerUpdateSlider = registerUpdateSlider;


        var _timeRulerSize = function (ev) {
            timeRuler.css('width', timeManager.timeToPx(ev.end) + 'px');
        };
        _timeRulerSize(timeManager.getDuration());
        timeManager.onSizing(_timeRulerSize);

        /*******************************Xiaoyi/Libby****************************************/
     /*   var multiSelButtonPanel = $(document.createElement('div'));
        multiSelButtonPanel.addClass("multiSelButtonPanel");
        multiSelButtonPanel.css({
            'top': '12.5%',
            'left': '25%',
            'position': 'relative',
            "width": '60%',
            'height': '75%',
            'float': 'left',
            'z-index': '5',
        });

        var multiSelButton = $(document.createElement('button'));
        multiSelButton.attr('type', 'button');
        multiSelButton.attr('id', "multiSelButton");
        multiSelButton.text("Multi-Select");
        multiSelButton.attr('type', 'button');
        multiSelButton.css({
            "color": "black",
            "border-color": "black",
            "left": "5%",
            'top': '3%',
            "position": "absolute",
            "font-size": '120%',
            'float': 'left',
            'width': '100%'
        });
        
        $(multiSelButton).click(function () {
            if (getEditInkOn() === true) {
                //multiSelButton.css({
                //    'color': 'gray',
                //});
                return false;
            }
            if (multiSelection === true) {
                multiSelection = false;
                multiSelButton.css({
                    'color': 'black',
                    'background-color': 'transparent',
                    "border-color": "black"
                });
            }
            else {
                multiSelection = true;
                multiSelButton.css({
                    'color': 'white',
                    'background-color': 'darkgreen',
                    "border-color": "white",
                });
            }
        });

        editInkOverlay.css({
            top: LADS.Util.Constants.timeRulerSize,
            width: '100%',
            height: '100%',
            'margin-left': "2%",
            'position': 'absolute',
            'z-index': '10000',
            'background-color': 'rgba(0, 0, 0, 0.5)'
        });

        overlayLabel.css({
            'position': 'relative',
            'left': '33.5%',
            'top': '35%',
            'font-size': '22pt',
        });

        editInkOverlay.hide();

        // Container and background for Slider
        sliderPane = $(document.createElement('div'));
        sliderPane.attr('id', 'verticalSliderPane');
        sliderPane.css({
            'position': 'absolute',
            'left': '97.35%',
            'top': 54 + 'px',
            'display': 'inline-block',
            'width': '1%',
            'height': trackAreaHeight - 8 + 'px',
        });
        
        var sliderParts = createVerticalScroller(sliderPane);
        sliderPane.append(sliderParts[0]);
        sliderPane.append(sliderParts[1]);

        // appending elements to documentFragment, which is then appended in AddToDOM method
        docfrag = document.createDocumentFragment();

        docfrag.appendChild(mainScrollHider[0]);
            mainScrollHider.append(editor); // editor => horiz scrolling hider
                editor.append(timeline); // track body + ruler area => editor
                        multiSelButtonPanel.append(multiSelButton);
                        horizBlock.append(multiSelButtonPanel);
                    timeline.append(horizBlock);
                    timeline.append(vertBlock);
                    timeline.append(rulerScrollVeil);
                        rulerScrollVeil.append(rulerWrapper);
                            rulerWrapper.append(timeRuler);
                editor.append(sliderPane);
                editor.append(editInkOverlay);
                    editInkOverlay.append(overlayLabel);
                    timeline.append(trackScrollVeil);
                        trackScrollVeil.append(trackTitleWrapper); // track head panel => editor
                    timeline.append(trackBody);

               

        var constrainedHeight = editorHeight - 5;
        var constrainedWidth = editorWidth - 17;
        mainScrollHider.css({
            'height': constrainedHeight + "px",
            'width': constrainedWidth + "px",
        });
        multiSelButton.fitText(0.8); 

        /***************************************************************************/
        ///////////
        // Playhead
        //Creating the svg version of the playhead. -David Correa
       /*playheadSVG = d3.select(timeline[0])
                                    .append("svg")
                                    .style('position', 'absolute')
                                    .style('left', '0px').style('top', '0px')
                                    .attr('id', 'playhead')
                                    .attr("width", '0%')
                                    .style("z-index","101")
                                    .attr("height", '100%'); // div to be transformed into an svg group
        var rawSvgElem = playheadSVG[0][0];

        playHeadGroup = playheadSVG.append("g").attr("transform", "translate(5,0)");
        var rawGElem = playHeadGroup[0][0];

        playHeadTop = playHeadGroup.append("circle")
                                   .attr('cx', '0')
                                   .attr('cy', '27px')
                                   .attr('r', '18px')
                                   .attr('fill', 'black')
                                   .attr('stroke', 'black')
                                   .attr('stroke-width', '7px')
                                   .attr('fill-opacity', '0');
        
        playHead = playHeadGroup.append("line")
                                         .attr('x1', '0')
                                         .attr('y1', '45px') // 11.4%
                                         .attr('x2', '0')
                                         .attr('y2', '100%')
                                        .attr('pointer-events', 'none')
                                         .attr('stroke', 'black')
                                         .attr('stroke-width', '1px');

        var $body = $('body');
        playHeadGroup.on('mousedown', function () {
            var start,
                startTime,
                time;

            start = d3.mouse($body[0])[0];
            startTime = timeManager.getCurrentPx();

            $body.on('mousemove.playhead', function (ev) {
                if (editInkOn === true) {      
                    return false;
                }
                time = startTime + (ev.pageX - start);
                // Don't let the playhead be moved out of bounds
                if (time > $('#timeRuler').width()) {
                    time = $('#timeRuler').width();
                } else if (time < 0) {
                    time = 0;
                } else {
                    // Only update start if the mouse isn't out of bounds so the mouse
                    // correctly synchronizes with the playhead.
                    start = ev.pageX;
                }
       
                timeManager.seek(timeManager.pxToTime(time));
                startTime = time;
            });
            $body.on('mouseup.playhead', function () {
                $body.off('mousemove.playhead');
                $body.off('mouseup.playhead');
            });
        });

        var _seekPlayhead = function () {
            var time = timeManager.getCurrentPx(); // fix editor.width() * 0.15 -- if we ever change the margin of trackBody, this will be really confusing!
            playHeadGroup.attr("transform", "translate(" + (time + editor.width() * 0.15 - trackBody.scrollLeft()) + ")");
        };

        timeManager.onSeek(_seekPlayhead);
        timeManager.onSizing(_seekPlayhead);
        timeManager.onPlay(_seekPlayhead);
    })(); 


    /***** End of _makeHTML - Surbhi ******/




    /**Creates an overlay on the screen when ink edits are made
     * @method showEditorOverlay
     */
    function showEditorOverlay() {
        var overlayLabelSpec = LADS.Util.constrainAndPosition(editInkOverlay.width(), editInkOverlay.height(),
            {
                center_h: true,
                center_v: true,
                width: 0.3,
                height: 0.2,
                max_width: 400,
                max_height: 100,
            });
        var labelFontSize = LADS.Util.getMaxFontSizeEM("Ink is being edited...", 0, overlayLabelSpec.width - 10, overlayLabelSpec.height, 0.01);

        $('#resizeButton').attr('src', 'images/icons/Ellipsis_gray.svg');
        setEditInkOn(true);
        $('#multiSelButton').css({
            'color': 'gray',
            'border-color': 'gray'
        });
           
        playHeadTop.attr('fill', 'gray');
        playHeadTop.attr('stroke', 'gray');
        overlayLabel.css({
            top: overlayLabelSpec.y + 'px',
            left: overlayLabelSpec.x + 'px',
            width: overlayLabelSpec.width + 'px',
            height: overlayLabelSpec.height + 'px',
            'font-size': labelFontSize,
            'overflow': 'hidden',
        });
        editInkOverlay.show();
    }

    /**Hides the overlay
     * @method hideEditorOverlay
     */
    function hideEditorOverlay() {
        $('#resizeButton').attr('src', 'images/icons/Ellipsis_brown.svg');
        setEditInkOn(false);
        $('#multiSelButton').css({
            'color': 'black',
            'border-color':'black'
        });
        playHeadTop.attr('fill', 'black');
        playHeadTop.attr('stroke', 'black');
        editInkOverlay.hide();
    }
    
    /**Creating a vertical scroll visualizer
     * @method createVerticalScroller
     * @return {Array} elements         parts of the vertical scroller as an array
     */
    function createVerticalScroller() {
        var elements = [];
        verticalScrollBox = $(document.createElement('div'));
        var greenBoxInSlider = $(document.createElement('div'));                                             //represents the green part of the timeline for artworks and the gray part for inks -- indicates the length

        verticalScroller = $(document.createElement('div'));

        verticalScrollBox.css({
            'position': 'relative',
            'background-color': 'rgb(255,255,255)',
            'width': '70%',
            'left': '15%',
            'height': '100%',
            'overflow': 'hidden',
            'border': '1px solid gray',
        });

        verticalScroller.attr('id', 'verticalSlider');
        verticalScroller.css({
            'position': 'absolute',
            'height': '100px',
            'width': '100%',
            'border': '2px none black',
            'left': '-1px',
        });

        verticalScroller.draggable({
            axis: 'y',
            drag: function (evt, ui) {
                var newRelativeScroll,
                    newAbsoluteScroll;
                evt.stopPropagation();
                ui.position.top = Math.constrain(ui.position.top, 0, sliderPane.height() - verticalScroller.height() - 2);

                newRelativeScroll = ui.position.top / (sliderPane.height() - verticalScroller.height() - 4);
                newAbsoluteScroll = newRelativeScroll * (calculateTotalTrackHeight() - trackBody.height() + 8);

                trackBody.scrollTop(newAbsoluteScroll);
                trackTitleWrapper.scrollTop(newAbsoluteScroll);
                cancelAccel();
            }
        });
        
        elements.push(verticalScrollBox);
        elements.push(verticalScroller);

        verticalScroller.mousedown(function (evt) {
            evt.stopPropagation();
        });

        var upArrow = $(document.createElement('img'));
        upArrow.attr('src', 'images/icons/white_up_arrow3.svg');
        var upArrowBox = $(document.createElement('div'));
        upArrowBox.css({
            width: '100%',
            height: '10%',
            top: '0%'
        });
        upArrow.css('width', '110%');
        upArrowBox.append(upArrow);
        var downArrow = $(document.createElement('img'));
        downArrow.attr('src', 'images/icons/white_down_arrow3.svg');
        var downArrowBox = $(document.createElement('div'));
        downArrowBox.css({
            width: '100%',
            height: '10%',
            position: 'absolute',
            bottom: '0px'
        });
        downArrow.css({
            width: '110%',
            position: 'absolute',
            bottom: '0px'
        });
        downArrowBox.append(downArrow);
        greenBoxInSlider.css({
            'background-color': 'DarkGreen',
            'top': '0%',
            'left': '15%',
            'height': '100%',
            'position': 'absolute',
            'width': '70%',
            'border': '2px solid',
        });

        greenBoxInSlider.append(upArrowBox);
        greenBoxInSlider.append(downArrowBox);
        verticalScroller.append(greenBoxInSlider);
        return elements;
    }

    /**used by vertical position viz to update its location when scrolling occurs on other vertically-scrollable elements.
     * @method scrollWithBody
     * @param {Number} scrollPos        
     */
    function scrollWithBody(scrollPos) {
        var totalTrackHeight = calculateTotalTrackHeight();
        var newTop = scrollPos / totalTrackHeight * sliderPane.height();

        if (newTop < 0) {
            newTop = 0;
        } else if (newTop > sliderPane.height() - verticalScroller.height() - 2) {
            newTop = sliderPane.height() - verticalScroller.height() - 2;
        }
        verticalScroller.css({
            'top': newTop + 'px'
        });
    }

    /**Updates the vertical scroll bar on the timeline depending on the number of tracks
     * @method updateVerticalScroller
     */
    function updateVerticalScroller() {

        var oldVertHeight = verticalScroller.height();
        var totalTrackHeight = calculateTotalTrackHeight();
        var newTop = trackBody.scrollTop() / totalTrackHeight * sliderPane.height() - 4;

       
        if (newTop < 0) { newTop = 0; }

        if (totalTrackHeight === 0) {                                               // edge case for no tracks onscreen
            sliderPane.height(trackBody.height() - 10);
            verticalScroller.css({
                'height': sliderPane.height() + 'px',
                'top': '0px',
            });
            enableDisableDrag();
        }
        if (oldVertHeight !== (trackTitleWrapper.height() - 4) * sliderPane.height() / totalTrackHeight) {
            if (totalTrackHeight < trackTitleWrapper.height()) {
                verticalScroller.css({ 'height': '100%' });
            } else {
                verticalScroller.css({ 'height': (trackTitleWrapper.height() - 4) * sliderPane.height() / totalTrackHeight + 'px' });
            }
            verticalScroller.css({ 'top': newTop + 'px' });
        }
        console.log("totaltrackHeight" + totalTrackHeight);
        console.log("trackBodyheight" + trackBody.height());
        
        //Hide the scroll bar if the height of the tracks is less than the height of the body
        if (totalTrackHeight < trackBody.height()) {
            console.log("hiding");
            verticalScroller.css('visibility', 'hidden');
            verticalScrollBox.css('visibility', 'hidden');
        } else {
            verticalScroller.css('visibility', 'visible');
            verticalScrollBox.css('visibility', 'visible');
        }
       
    }
    
    /**Checks if the vertical scroll bar is draggable depending on it's current dimensions
     * @enableDisableDrag
     */
    function enableDisableDrag() {
        if (calculateTotalTrackHeight() < trackTitleWrapper.height() - 10) {
            verticalScroller.draggable("disable");
            verticalScroller.css({
                'height': '100%',
            });
        } else {
            verticalScroller.draggable("enable");
            verticalScroller.css({
                'height': (trackTitleWrapper.height() - 4) * sliderPane.height() / calculateTotalTrackHeight() + 'px',
            });
        }
    }
    
    /**Finds the height of a track div
     * @method calculateTotalTrackHeight
     * @return {Number} track height
     */
    function calculateTotalTrackHeight() {
        var i,
            total = 0,
            ct;
        for (i = 0; i < dataHolder._trackArray.length; i++) {
            ct = dataHolder._trackArray[i].track;
            if (ct.getMinimizedState()) {
                total = total + LADS.TourAuthoring.Constants.minimizedTrackHeight;
            } else {
                total = total + LADS.TourAuthoring.Constants.trackHeight;
            }
        }
        return total + dataHolder._trackArray.length * 2; // 2px border per track
    }

    /**Updates notches on time ruler when time duration changes (event handler)
     * @method _updateTimeMarkers
     * @param {Event} ev
     */
    function _updateTimeMarkers(ev) {
        var i,
            finalTime,
            scale = ev.scale,
            seconds = scale,
            divChilds = timeRuler.children('div'),
            start = Date.now(),
            left,
            right,
            leftmod,
            j,
            initLoad,
            perQueueOp,
            opLim;

        queue.clear();
        newLabels = document.createDocumentFragment();
        divChilds.text('');

        sendScrollLeft = true;
        trackBody.scrollLeft(trackBody.scrollLeft());

        // what are these doing? seems like the second while will push seconds*scale back below 80. What are 80 and 100 here?
        while (seconds * scale < 80) { seconds = seconds * 2; }
        while (seconds * scale > 100) { seconds = seconds / 2; }
        seconds = Math.ceil(seconds);
        
        left = timeManager.pxToTime(trackBody.scrollLeft()),
        leftmod = left - (left % seconds),
        right = left + timeManager.pxToTime(trackBody.width());
        initLoad = document.createDocumentFragment();
        divChilds.remove();

        for (j = leftmod; j <= right; j += seconds) {
            initLoad.appendChild(createTimeLabel(j)[0]);
        }
        timeRuler.append(initLoad);
        
        perQueueOp = 20,
        opLim = perQueueOp * seconds;

        /**helper function to add new timeline labels to the queue
         * @method newLabelHelper
         */
        function newLabelHelper(i) {
            queue.add(function () {
                var j;
                for (j = i; j <= i + opLim; j = j + seconds) {
                    newLabels.appendChild(createTimeLabel(j)[0]);
                }
            });
        }

        for (i = ev.start; i <= ev.end; i = Math.min(i + opLim, ev.end)) {
            newLabelHelper(i);
            if (i === ev.end) { break; }
        }

        // clear and replace once finished
        queue.add(function () {
            var i;
            divChilds.remove();
            timeRuler.append(newLabels);
            console.log('time ruler update elapsed: ' + (Date.now() - start));
        });

        /**creates a time label and appends it to the time ruler
         * @method createTimelineLabel
         * @param {Number} i
         * @return {HTML Element} timeLabel
         */
        function createTimeLabel(i) {
            var time = Math.min(i, ev.end),
                timeString = timeManager.formatTime(i),
                fontsize = LADS.Util.getFontSize(140),
                markLoc = timeManager.timeToPx(i),
                timeLabel = $(document.createElement('div'))
                            .addClass('time-label')
                            .text(timeString)
                            .css({
                                'border-width': '0px 0px 0px 1px',
                                'border-color': 'black',
                                'border-style': 'solid',
                                'position': 'absolute',
                                'left': markLoc + 'px',
                                'padding-left': '5px',
                                'font-size': fontsize,
                                'color': 'black',
                                'height': '100%',
                            });
            return timeLabel;
        }
    }

    _updateTimeMarkers(timeManager.getDuration());              // Initialization
    timeManager.onSizing(function (ev) {
        timeRuler.children('div').text('');
        setTimeout(function () {
            _updateTimeMarkers(ev);
        }, 2);
    });

    //////////////////////
    // PUBLIC FUNCTIONS //
    //////////////////////

    // Add Timeline HTML

    /**Returns the boolean which checks for the presence of ink editing
     * @method getEditInkOn
     * @return {Boolean} editInkOn
     */
    function getEditInkOn() {
        return editInkOn;
    }
    
    /**Sets the ink editing boolean
     * @method setEditInkOn
     * @param {Boolean} status
     */
    function setEditInkOn(status) {
        editInkOn = status;
    }
    
    /**Adds the main document fragment to the DOM
     * @method addToDOM
     * @param {HTML Element} container
     */
    function addToDOM (container) {
        container.appendChild(docfrag);
    }
    
    /**Returns the current selcted track(s) as an object
     * @method getSelectedTrack
     * @return {Object} selectedTrack
     */
    function getSelectedTrack() {
        return selectedTrack;
    }
    
    /**Controls for editing components
     * @method setCompControl
     * @param {Object} comp         public methods of ComponentControls.js
     */
    function setCompControl(comp) {
        compCont = comp;
    }
    
    /**Wrapper around the method in ComponentControls.js, called when "Edit Ink" is clicked on a draw-type ink track.
     * Creates a new InkController and loads in the datastring of the track.
     * Shows the edit draw controls.
     * If the ink is linked, need to position it correctly using keyframes and size of artwork.
     * @param track        the ink track in question
     * @param datastring   the track's ink datastring (see InkController.js for format)
     */
    function showEditDraw(track,datastring) {
        compCont.showEditDraw(track, datastring);
        modifyingInk = true;
    }
    
    /**Wrapper around the method in ComponentControls.js, called when "Edit Ink" is clicked on a text-type ink track.
     * Creates a new InkController and loads in the datastring of the track.
     * Shows the edit text controls.
     * If the ink is linked, need to position it correctly using keyframes and size of artwork.
     * @param track        the ink track in question
     * @param datastring   the track's ink datastring (see InkController.js for format)
     * @param dims
     */
    function showEditText(track,datastring, dims) {
        compCont.showEditText(track, datastring, dims);
        modifyingInk = true;
    }
    
    /**Wrapper around the method in ComponentControls.js, called when "Edit Ink" is clicked on a highlight-type ink track.
     * Creates a new InkController and loads in the datastring of the track.
     * Shows the edit highlighting controls.
     * If the ink is linked, need to position it correctly using keyframes and size of artwork.
     * @param track        the ink track in question
     * @param datastring   the track's ink datastring (see InkController.js for format)
     * @param trans_type   the track's highlighting type (block/isolate)
     */
    function showEditTransparency(track, datastring, trans_type) {
        compCont.showEditTransparency(track, datastring, trans_type);
        modifyingInk = true;
    }
    
    /**Sets the value of the boolean which decides whether an ink track is being edited
     * @method setModifyingInk
     * @param {Boolean} state
     */
    function setModifyingInk(state) {
        modifyingInk = state;
    }
    
    /**Removes the current ink canvas
     * @method removeInkSession
     */
    function removeInkSession() {
        compCont.removeInkCanv();
        compCont.hideInkControls();
    }
    
    /**Xiaoyi Libby - get the limiting distance for multi select
     * just have each display that is selected push its bounds into the heaps
     * hacky way to solve multi selection not working when dragging a display with 0 fadeout.
     * @method getMSBounds
     * @param {Display} currentDisplay
     * @return bound: the array of the smallest distances
     **/
    function getMSBounds(currentDisplay) {
        var hasZeroFadeout = false;
        if (currentDisplay && currentDisplay.getFadeOut() === 0) { hasZeroFadeout = true; }
        //create new binheaps every time the selected displays are dragged
        //so that old bounds do not erroneously conflict with new ones
        dataHolder.reInitHeaps();
        for (var i = 0; i < multiSelectionArray.length; i++) {
            multiSelectionArray[i].getTrack().boundHelper(multiSelectionArray[i], hasZeroFadeout);
        }
    }
   
    /**Turn off the button for multi select 
     * @method turnOffMS
     */
    function turnOffMS() {
        multiSelection = false;
        $('#multiSelButton').css({
            'color': 'black',
            'background-color': 'transparent',
            "border-color": "black"
        });
    }
    
   /**Update the olddata for each selected displays when the mouse goes up
    * this is used in undo/redo to store the previous positions of all of the selected displays
    * @method updateOldData
    */
    function updateOldData() {
        var selectDisplays = getMultiSelectionArray();
        var selectDisplaysLength = selectDisplays.length;
        var leftDist = dataHolder._leftExternal.peek(),                                     //boundArray[0],
            rightDist = dataHolder._rightExternal.peek();                                   //boundArray[1];
        var leftbound,
            rightbound;

        if (selectDisplays.length === 0) { return; }
        olddata = new Array(selectDisplaysLength);

        //update bounds
        getMSBounds();

        //null checking
        if (leftDist) { leftDist = leftDist.bound; }
        if (rightDist) { rightDist = rightDist.bound; }
        for (var i = 0; i < selectDisplaysLength; i++) {
            olddata[i] = new Array(5);
            leftbound = selectDisplays[i].getStart() - leftDist;
            rightbound = selectDisplays[i].getEnd() + rightDist;
            olddata[i][0] = selectDisplays[i].getStart();
            olddata[i][1] = selectDisplays[i].getMainStart();
            olddata[i][2] = selectDisplays[i].getOutStart();
            olddata[i][3] = leftbound;
            olddata[i][4] = rightbound;
        }
    }
    
    /**create a new data array
     * @method newDataArray
     */
    function newDataArray() {
        data = [];
    }
    
    /**returns the olddata array
     * @method getOldData
     * @return {Array} oldata
     */
    function getOldData() {
        return olddata;
    }
    
    /**Move the selected displays when user drags one of them
     * @param res                            mouse input
     * @param {Display} currentDisplay       the one user is dragging. 
     */
    function moveSelect(res, currentDisplay) {
        var leftDist = dataHolder._leftExternal.peek().bound,                                                                               //boundArray[0],
            rightDist = dataHolder._rightExternal.peek().bound,                                                                             //boundArray[1],
            fadeInRightDist = dataHolder._leftInternal.peek().bound,                                                                        //boundArray[2],
            fadeOutLeftDist = dataHolder._rightInternal.peek().bound,                                                                       //boundArray[3],
            loc = currentDisplay.getLoc(),
            selectDisplays = getMultiSelectionArray(),
            currentDisplayleft = currentDisplay.getStart() - leftDist,
            currentDisplayright = currentDisplay.getEnd() + rightDist,
            translation = currentDisplay.getTranslation(res, currentDisplayleft, currentDisplayright, fadeInRightDist, fadeOutLeftDist),    //get the distance the display has been dragged
            leftbound,
            rightbound,
            fadeinrightbound,
            fadeoutleftbound,
            offset = currentDisplay.getOffset();                                                                                            //distance from the main to fadein that user clicks on

        //turn off multi-select once any kind of edit is made to the selection
        turnOffMS();
        getMSBounds(currentDisplay);
        
        if (data[0] === null || data[0] === undefined) {//update the data for undo at the moment mouse is down, no need to update if user keeps the mouse down and drag multi times.
            data = new Array(getMultiSelectionArray().length);
            for (var i = 0; i < selectDisplays.length; i++) {
                leftbound = selectDisplays[i].getStart() - leftDist;
                rightbound = selectDisplays[i].getEnd() + rightDist;
                fadeinrightbound = selectDisplays[i].getStart() + fadeInRightDist;
                fadeoutleftbound = selectDisplays[i].getEnd() - fadeOutLeftDist;
                if (data[i] === null || data[i] === undefined) {
                    data[i] = new Array(10);
                    data[i][0] = selectDisplays[i].getStart();
                    data[i][1] = selectDisplays[i].getMainStart();
                    data[i][2] = selectDisplays[i].getOutStart();
                    data[i][3] = leftbound;
                    data[i][4] = rightbound;
                    data[i][5] = translation;
                    data[i][6] = loc;
                    data[i][7] = offset;
                    data[i][8] = fadeinrightbound;
                    data[i][9] = fadeoutleftbound;
                }        
            }
        }
        currentDisplay.msMove(selectDisplays, translation);//move all selectedDisplays
    }
    
    /**Returns the display data array
     * @method getDisplayData
     * @return {Array} data
     */
    function getDisplayData() {
        return data;
    }
    
    /**Deselect all displays when the user clicks white space in track or right clicks on the menu
     * @method allDeselected
     */
    function allDeselected() {
        var selectedarray = getMultiSelectionArray();
        var selectednumber = getMultiSelectionArray().length;
        var i;
        turnOffMS();
        if (selectedarray.length > 0) {
            for (i = 0; i < selectednumber; i++) {
                selectedarray[0].getTrack().setDisplayDeselected(selectedarray[0], false);
            }
        }
        olddata = [];
        data = [];
        multiSelectionArray = [];
    }
    
    ////////////
    // TRACKS //
    ////////////

    /**Public API for adding tracks (called from ComponentControls)
     * @param media     URL of added resource (for audio, video, artwork)
     * @param track     Associated track (for ink)
     */


    /**Returns boolean to check the status of multi-select
     * @method getMultiSelection
     * @return {Boolean} multiSelection
     */
    function getMultiSelection() {
        return multiSelection;
    }
    
    /**Returns the array of selected tracks
     * @method getMultiSelectedArray
     * @return {Array} multiSelectedArray
     */
    function getMultiSelectionArray() {
        return multiSelectionArray;
    }
    
    /**Returns the number of tracks on the timeline
     * @return {Number} length
     */
    function getTrackslength() {
        return tracks.length;
    }
    
    /**Returns the list of track son the timeline
     * @return {Array} tracks
     */
    function getTracks() {
        return tracks;
    }
    
    /**Returns the timeline ruler div
     * @method getTimelineRuler
     * @return timeRuler
     */
    function getTimeRuler() {
        return timeRuler;
    }
    
    /**Sets the state of the menu
     * @method setisMenuOpen 
     * @return {Boolean} status
     */
    function setisMenuOpen(status) {
        isMenuOpen = status;
    }
    
    /**Returns the boolean specifying the menu
     * @method getisMenuOpen
     * @return {Boolean} isMenuOpen
     */
    function getisMenuOpen() {
        return isMenuOpen;
    }

    /**Returns an array containing changed display states
     * @method getClampedDisplays
     * @return {Array} clamped_displays
     */
    function getClampedDisplays() {
        return clamped_displays;
    }

    /**Wrapper around the close function actions for the timeline menu
     * @method setCloseMenu
     * @param {Function} closeFunction
     */
    function setCloseMenu(closeFunction) {
        closeMenuHolder = closeFunction;
    }
    
    /**Returns the close function for the menu
     * @method getCloseMenu
     * @return {Function} closeMenuHolder
     */
    function getCloseMenu() {
        return closeMenuHolder;
    }
    
    /**Utility to get track object from title
     * Used to load ink
     * @method findTrackByTitle
     * @return {Object} track object
     */
    function findTrackByTitle(title) {
        return dataHolder.findTrackByTitle(title);
    }

    /**Searches through all displays and compares end times of each
     * @method getLastDisplayTime
     * @return {Time} allDisplaysEnd            the highest end time of all displays
     */
    function getLastDisplayTime() {
        var i,
            allDisplaysEnd = 0,
            tracks = dataHolder.getTracks(),
            endDisplay,
            endDisplayTime;
        for (i = 0; i < tracks.length; i++) {
            endDisplay = dataHolder.maxDisplay(tracks[i].track.getPos());
            endDisplayTime = endDisplay.display.getFadeOut() + endDisplay.display.getOutStart();
            if (endDisplayTime > allDisplaysEnd) {
                allDisplaysEnd = endDisplayTime;
            }
        }
        return allDisplaysEnd;
    }
    
    /**Searches list of tracks for track w/ duplicate name
     * If duplicate exists, changes name to prevent duplication
     * @method fixTrackTitle
     * @param title     the new title
     * @param id        id of the track whose title is being changed
     */
    function fixTrackTitle(title, id) {
        var i,
            j,
            currTitle,
            result,
            ct,
            titleExp,                                   //= new RegExp(title + '(?:-([0-9]+))?'),
            extraNums = [],
            finalNum = -1,
            pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]"),
            rs = "";
        id = id || -1;
        
        for (i = 0; i < title.length; i++) {            //removes any irregular characters from title
            rs = rs + title.substr(i, 1).replace(pattern, '');
        }
        titleExp = new RegExp(rs + '(?:-([0-9]+))?');   //checks if there are any numbers added onto the title we have
        dataHolder.mapTracks(function (i) {
            currTitle = i.track.getTitle();
            ct = "";
            for (j = 0; j < currTitle.length; j++) {    //remove special characters
                ct = ct + currTitle.substr(j, 1).replace(pattern, '');
            }
            result = titleExp.exec(ct);                 //check if any numbers added to original
            if (result && result[0] === ct && id !== i.track.getID()) {     // match
                if (result[1]) {                        //if there is a trailing number
                    extraNums.push(parseInt(result[1], 10));
                } else {                                //if there is no trailing number, pretend substr is -1
                    extraNums.push(-1);
                }
            }
        });

        if (extraNums.length > 0) {
            extraNums.sort(function (a, b) { return a - b; });
            for (i = 0; i < extraNums.length; i++) {
                if (extraNums[i] + 1 !== i) {
                    finalNum = i - 1;
                    break;
                }
                finalNum++;
            }
            if (finalNum !== -1) {
                return title + '-' + finalNum;
            } else {                                    //track w/ no appended number does not already exist
                return title;
            }
        } else {
            return title;
        }
    }
    
    /**Adds audio track to the timeline
     * @method addAudioTrack
     * @param {Path}   media            path to get the media element     
     * @param {String} name             name of the audio track
     * @param pos                       position of the track
     * @param {Time} mediaLength        Track duration
     * @return {Object} newTrack        of type AudioTrack.js
     */
    function addAudioTrack(media, name, pos, mediaLength) {
        var object = createSpec(media, name, pos);
        var newTrack;
        object.mediaLength = mediaLength;
        newTrack = new LADS.TourAuthoring.AudioTrack(object);
        addAnyTrack(newTrack, name, pos);
        return newTrack;
    }
    
    /**Adds video track to the timeline
     * @method addVideoTrack
     * @param {Path}   media            path to get the media element     
     * @param {String} name             name of the video track
     * @param pos                       position of the track
     * @param {Time} mediaLength        Track duration
     * @return {Object} newTrack        of type VideoTrack.js
     */
    function addVideoTrack(media, name, pos, mediaLength) {
        var object = createSpec(media, name, pos);
        var newTrack;
        object.mediaLength = mediaLength;
        //object.converted = converted;
        newTrack = new LADS.TourAuthoring.VideoTrack(object);
        addAnyTrack(newTrack, name, pos);
        return newTrack;
    }
    
    /**Adds artwork track to the timeline
     * @method addAudioTrack
     * @param {Path}   media            path to get the media element     
     * @param {String} name             name of the artwork track
     * @param {String} guid             ID of the track
     * @param pos                       
     * @return {Object} newTrack        of type ArtworkTrack.js
     */
    function addArtworkTrack(media, name, guid, pos) {
        var object = createSpec(media, name, pos);
        var newTrack;
        object.guid = guid;
        newTrack = new LADS.TourAuthoring.ArtworkTrack(object);
        addAnyTrack(newTrack, name, pos);
        return newTrack; 
    }
    
    /**Adds image track to the timeline
     * @method addAudioTrack
     * @param {Path}   media            path to get the media element     
     * @param {String} name             name of the audio track
     * @param pos                       position of the track
     * @return {Object} newTrack        of type ImageTrack.js
     */
    function addImageTrack(media, name, pos) {
        pos = pos || (dataHolder.getSelectedTrack() ? dataHolder.getSelectedTrack().getPos() : 0);
        var object = createSpec(media, name, pos);
        var newTrack = new LADS.TourAuthoring.ImageTrack(object);
        var oldPos;
        var command = LADS.TourAuthoring.Command({
            execute: function () {
                _addTrack(newTrack);
                dataHolder.insertTrack(newTrack, oldPos);
                newTrack.setTitle(newTrack.getTitle());
            },
            unexecute: function () {
                oldPos = newTrack.getPos();
                _removeTrack(newTrack);
            }
        });
        //command.execute();

        _addTrack(newTrack);
        dataHolder.insertTrack(newTrack, pos);
        oldPos = newTrack.getPos();

        if (name) {
            newTrack.setTitle(name);
        }

        undoManager.logCommand(command);
        //addAnyTrack(newTrack, name, pos);

        return newTrack; 
    }
    
    // Additional param in spec: associated-track (either pass by id or direct reference?)
    /**Adds an annotation track to the timeline
     * @method addInkTrack
     * @param {Path} track
     * @param {String} name
     * @param inkType
     * @param inkSpec
     * @param pos
     * @return {Object} newTrack
     */
    function addInkTrack(track, name, inkType, inkSpec, pos) {
        var selected = dataHolder.getSelectedTrack();
        if (!pos) {
            if (selected) {
                pos = selected.getPos();
            } else if (track) {
                pos = track.getPos();
            } else {
                pos = 0;
            }
        } 
        var spec = {
            dataHolder: dataHolder,
            media: inkType,
            root: root,
            inkSpec: inkSpec,
            id: pos,
            title: fixTrackTitle(name),
            timeManager: timeManager,
            undoManager: undoManager,
            update: onUpdate,
            timeline: that,
            trackarray: tracks,
            selectedTrack: selectedTrack,
        };

        var oldPos;

        // Create the track, wrap command
        var newTrack = new LADS.TourAuthoring.InkTrack(spec);
        var command = LADS.TourAuthoring.Command({
            execute: function () {
                _addTrack(newTrack);
                dataHolder.insertTrack(newTrack, oldPos);
                newTrack.setTitle(newTrack.getTitle());
            },
            unexecute: function () {
                oldPos = newTrack.getPos();
                _removeTrack(newTrack);
            }
        });
        //command.execute();
        
        _addTrack(newTrack);
        dataHolder.insertTrack(newTrack, pos);
        oldPos = newTrack.getPos();

        if (name) {
            newTrack.setTitle(name);
        }

        undoManager.logCommand(command);

        return newTrack;
    }
    
    /**Adds the common properties to the object in each track type
     * @method createSpec
     * @param {Path} media      the path of the track file
     * @param {String} name     name of the track
     * @param pos               track id 
     * @return {Object} spec    object with properties for each track
     */
    function createSpec(media, name, pos) {
        var spec = {
            dataHolder: dataHolder,
            media: media,
            root: root,
            id: pos,
            title: fixTrackTitle(name),
            timeManager: timeManager,
            undoManager: undoManager,
            update: onUpdate,
            timeline: that,
            trackarray: tracks,
            selectedTrack: selectedTrack,
        };
        return spec;
    }
   
    /**Common functionality to add tracks Audio/Video/Image/Artwork
     * @method addAnyTrack
     * @param {Object} track
     * @param {String} name
     * @param pos
     * @return {Object} spec
     */
    function addAnyTrack(track, name, pos) {
        pos = pos || (dataHolder.getSelectedTrack() ? dataHolder.getSelectedTrack().getPos() : 0);
        var oldPos,
            command = LADS.TourAuthoring.Command({
                execute: function () {
                    _addTrack(track);
                    dataHolder.insertTrack(track, oldPos);
                    track.setTitle(track.getTitle());
                },
                unexecute: function () {
                    oldPos = track.getPos();
                    _removeTrack(track);
                }
            });
        _addTrack(track);
        dataHolder.insertTrack(track, pos);
        oldPos = track.getPos();

        if (name) {
            track.setTitle(name);
        }
        undoManager.logCommand(command);
    }

    /**Adds the track to the DOM
     * @method _addTrack
     * @param track
     */
    function _addTrack(track) {
        track.addTitleToDOM(trackTitleWrapper);
        track.addEditorToDOM(trackBody);
    }

    /**Remove the track from the timeline
     * @method _removeTrack
     * @param track
     */
    function _removeTrack(track) {
        var i;
        dataHolder.removeTrack(track);
        track.updatePos(track.getPos());
        if (track.getType() === LADS.TourAuthoring.TrackType.ink && track.getInkEnabled()) {
            track.getInkLink().removeAttachedInkTrack(track);
        }
        track.detach();
        dataHolder.mapTracks(function (track, i) {
            track.track.updatePos(i);
        });
        onUpdate();
    }
    
    /**Allows track to prepend itself to DOM.
     * @method prependAddToDom
     * @param track
     * @param {String} trackTitle
     */
    function prependAddToDom(track, trackTitle) {
        trackTitleWrapper.prepend(trackTitle);
        trackBody.prepend(track);
    }
    
    /**Returns the number of tracks in the current tour
     * @method getNumTracks
     * @return {Number} numTracks
     */
    function getNumTracks() {
        return dataHolder.numTracks();
    }
    
    /**List of related artworks to be registered in database
     * @method getRelatedArtworks
     * @return {Array} related     GUIDs of all artworks loaded into tracks
     */
    function getRelatedArtworks() {
        var track,
            i,
            related = [];
        dataHolder.mapTracks(function (i) {
            track = i;
            if (track.track.getType() === LADS.TourAuthoring.TrackType.artwork) {
                related.push(track.track.getGUID());
            }
        });
        return related;
    }
    
    /**Returns the trackBody div
     * @method getTrackBody
     * @return trackBody
     */
    function getTrackBody() {
        return trackBody;
    }
    
    /**Checks if there are any artworks or images in the timeline
     * Used in ComponentControls to check if ink can be added
     * @method checkForArtworks
     * @param {Number} numArtworks      number of artwork tracks in the timeline
     * @return {Boolean}                true if there are artworks loaded, else false
     */
    function checkForArtworks(numArtworks) {
        for (var i = 0; i < dataHolder._trackArray.length; i++) {
                var track = dataHolder._trackArray[i].track;
                if (track.getType() === LADS.TourAuthoring.TrackType.artwork || track.getType() === LADS.TourAuthoring.TrackType.image) {
                    return true;
                }
        }
        return false;
    }
    
    /**this calls component controls from tracks, telling ink to be disabled
     * @method disableInk
     */
    function disableInk() {
        compCont.disableInk();
    }
    
    /**Called when tour has been fully initialized
     * RIN reloads fired by edits are blocked until this is called!
     * @method setLoaded
     */
    function setLoaded() {
        loaded = true;
        undoManager.setInitialized(true);
    }
    
    /**Updates selected keyframe (or new keyframe) w/ keyframe data from RIN
     * @method receiveKeyframe
     * @param {String} trackName      name of the track whose media is being manipulated
     * @param capture                 keyframe data in RIN format (needs to be parsed)
     * @param {Boolean} select        whether receiving keyframe should be selected
     */
    function receiveKeyframe(trackName, capture, select) {
        for (var i = 0; i < dataHolder._trackArray.length; i++) {
            var currentTrack = dataHolder._trackArray[i].track;
            // If this is the track pass on the keyframe data
            if (currentTrack.getTitle() === trackName) {
                currentTrack.receiveKeyframe(capture, select);
                break;
            }
        }
    }
    
    /**Deselects selected keyframes on all tracks
     * @method capturingOff
     */
    function capturingOff() {
        var i;
        dataHolder.mapTracks(function (i) {
            i.track.deselectKeyframe();
        });
    }
    
    /**Grabs current keyframe state from viewer
     * @method captureKeyframe
     * @param {String} artname
     * @return                      Keyframe data in xml
     */
    function captureKeyframe(artname) {
        return viewer.captureKeyframe(artname);
    }
    
    /**Returns the viewer property of spec
     * @method getViewer
     * @return viewer
     */
    function getViewer() {
        return viewer;
    }
    
    /**Returns the dataHolder object
     * @method getDataHolder
     * @return {Object} dataHolder
     */
    function getDataHolder() {
        return dataHolder;
    }
    
    //////////////
    // RIN Code //
    //////////////

    /**Converts timeline to RIN format
     * @method toRIN
     * @return     JSON object representing current state of timeline in RIN format
     */
    function toRIN() {
        var rin = {},
            title = "TAGAuthoringPreview";

        // v2 code
        rin.version = '1.0';
        rin.defaultScreenplayId = "SCP1";
        rin.screenplayProviderId = 'screenplayProvider';
        rin.data = {
            narrativeData: {
                guid: "e3ced195-0c8b-48f6-b42c-f989e52b4f03",
                timestamp: new Date().toISOString(),
                title: title,
                author: "TAG Authoring Tool",
                aspectRatio: "WideScreen",
                estimatedDuration: timeManager.getDuration().end,
                description: "TAG Tour",
                branding: "TAG"
            }
        };
        rin.providers = {
            ZMES: {
                name: "MicrosoftResearch.Rin.ZoomableMediaExperienceStream",
                version: "1.0"
            },
            AES: {
                name: 'MicrosoftResearch.Rin.AudioExperienceStream',
                version: "1.0"
            },
            screenplayProvider: {
                name: "MicrosoftResearch.Rin.DefaultScreenplayProvider",
                version: "1.0"
            },
            FadeInOutTransitionService: {
                name: "MicrosoftResearch.Rin.FadeInOutTransitionService",
                version: "1.0"
            },
            InkES: {
                name: "MicrosoftResearch.Rin.InkExperienceStream",
                version: "0.0"
            },
            VideoES: {
                "name": "MicrosoftResearch.Rin.VideoExperienceStream",
                "version": 0.0
            },
            ImageES: {
                name: "MicrosoftResearch.Rin.ImageExperienceStream",
                version: "1.0"
            },
        };

        rin.resources = _getResourceTable();
        rin.experiences = _getExperienceStreams();
        rin.screenplays = {
            SCP1: {
                data: {
                    experienceStreamReferences: _getScreenPlay()
                }
            }
        };
        return rin;
    }
    
    /**Helper function to collect track resource entries
     * @method _getResourceTable
     * @return {Object} table     JSON object table of resources
     */
    function _getResourceTable() {
        var i,
            table = {};
        dataHolder.mapTracks(function (i) {
            i.track.addResource(table);
        });
        return table;
    }

    /**Helper function to collect track experience streams
     * @method _getExperienceStreams
     * @return {Object} es    JSON object table of ESs
     */
    function _getExperienceStreams() {
        var i,
            es = {};
        dataHolder.mapTracks(function (i) {
            i.track.addES(es);
        });
        return es;
    }

    /**Helper function for constructing screenplay xml string from tracks
     * @method _getScreenPlay
     * @return {String} screenplayStorage   XML screenplay string
     */
    function _getScreenPlay() {
        var i,
            screenplayStorage = [];
        dataHolder.mapTracks(function (i) {
            i.track.addScreenPlayEntries(screenplayStorage);
        });
        screenplayStorage.sort(function (a, b) { return a.begin - b.begin; }); // Screenplay must be sorted
        return screenplayStorage;
    }
    
    /**Function passed into tracks to be called on track changes to update RIN data
     * debounce will prevent the function from being called
     * until the debounce function hasn't been called for
     * the specified number of milliseconds
     * @method coreUpdate
     */
    function coreUpdate() {
        var rin;
        onUpdateNumCalls = onUpdateNumCalls + 1;
        timeManager.stop();
        if (loaded) {
            viewer.setIsReloading(true);
            timeManager.stop();

            viewer.capturingOff();
            capturingOff();

            rin = toRIN();
            viewer.reloadTour(rin);
        }

        updateVerticalScroller();
        enableDisableDrag();
    }

    /**Action to be executed when RIN data is updated
     * @method onUpdate
     * @param noDebounce
     */
    function onUpdate(noDebounce) {
        if (!noDebounce) {
            debounce();
        } else {
            coreUpdate();
        }
    }
    
    /**Loads tour file and initializes timeline UI accordingly
     * @method loadRIN
     * @param rin
     * @param {Function} callback
     */
    function loadRIN(rin, callback) {
        var parser = LADS.Util.createQueue(),
            r,
            e,
            es,
            i,
            j,
            y,
            eobj,
            experienceArray,
            screenplayEntries,
            trackname,
            exp,
            expstr,
            expstrname,
            currScp,
            defaultseq,
            mediaLength,
            begin,
            fadeIn,
            fadeOut,
            track,
            display,
            type,
            length,
            zIndex,
            experienceStreams,
            keyframes,
            currKey,
            key,
            keyloc,
            keylocy,
            linkTrack,
            inks = [],                                                                              // need to do some ink init after everything else has been loaded, save it here
            narrativeData = rin.data.narrativeData,
            resources = rin.resources,
            experiences = rin.experiences,
            screenplay = rin.screenplays.SCP1.data.experienceStreamReferences;
        // parse narrative data
        timeManager.setEnd(narrativeData.estimatedDuration);

        // ignore providers
        // parse resources and experiences simultaneously
        // first, get experiences and sort by zIndex in decending order
        screenplayEntries = rin.screenplays.SCP1.data.experienceStreamReferences;
        experienceArray = [];
        for (e in experiences) {
            if (experiences.hasOwnProperty(e)) {
                experienceArray.push({ name: e + '', exp: experiences[e] });
            }
        }

        /**Compares two expressions and returns a number as the result of the comparison
         * @method compareExps
         * @param a
         * @param b
         * @return {Number} 
         */
        function compareExps(a, b) {
            var az = a.exp.data.zIndex,
                bz = b.exp.data.zIndex,
                astr,
                bstr,
                expstr,
                i,
                currscp,
                astreams = a.exp.experienceStreams,
                bstreams = b.exp.experienceStreams;
            
            if (!az) {
                for (expstr in astreams) {
                    if (astreams.hasOwnProperty(expstr)) {
                        astr = astreams[expstr];
                        if (astr) {
                            az = astr.data.zIndex;
                        }
                        break;
                    }
                }
            }
            if (!bz) {
                for (expstr in bstreams) {
                    if (bstreams.hasOwnProperty(expstr)) {
                        bstr = bstreams[expstr];
                        if (bstr) {
                            bz = bstr.data.zIndex;
                        }
                        break;
                    }
                }
            }
            if (az) {
                if (bz) {
                    return bz - az;
                } else {
                    // b does not exist
                    return -1;
                }
            } else {
                if (bz) {
                    // a does not exist
                    return 1;
                } else {
                    // a and b do not exist
                    return 0;
                }
            }
        }
        experienceArray.sort(compareExps);

        /**Helper function for parsing
         * @method parseHelper
         * @param {Object} eobj
         * @param e
         */
        function parseHelper(eobj, e) {
            parser.add(function () {
                parseTrack(eobj, e);
            });
        }
        for (e = 0; e < experienceArray.length; e++) {
            parseHelper(experienceArray[e], e);
        }


        // finally, ink init
        parser.add(function () {
            var parentDisp,
                parentDisplays;
            for (i = 0; i < inks.length; i++) {
                linkTrack = findTrackByTitle(inks[i].link);
                inks[i].track.setInkLink(linkTrack);
                if (inks[i].track.getInkEnabled()) {//if is attached ink, set parent displays for each display inside
                    dataHolder.mapDisplays(inks[i].track.getStorageContainer(), function (currentDisplay) {
                        parentDisplays = linkTrack.getStorageContainer().displays.nearestNeighbors(currentDisplay.display.getStart(), 1);//array of nearest neighbor's in parent track's display 
                        parentDisp = parentDisplays[0] && parentDisplays[0].display;
                        currentDisplay.display.setParentDisplay(parentDisp);
                        parentDisp && parentDisp.addChildDisplay(currentDisplay.display);
                    });
                }
                if (linkTrack) {
                    linkTrack.addAttachedInkTrack(inks[i].track);
                }
            }
        });

        dataHolder.mapTracks(function (container, i) {
            container.track.updatePos(i);
        });
        parser.add(function () {
            setLoaded();
        });
        parser.add(function () {
            /* do async viewer resize to make sure resize runs
             * after callback adds tour authoring to DOM
             */
            setTimeout(viewer.resize, 1);

            if (typeof callback === 'function') {
                callback();
            }

        });

        /**Deleting an ink track
         * @method confirmDeleteDisableInk
         * @param {String} name         name of the ink track
         * @param {Display} display     display of the track
         * @param {Object}  myy
         */
        function confirmDeleteDisableInk(name, display, myy) {
            var deleteConfirmation = $(document.createElement('div'));                                  // Actual dialog container
            var dialogTitle = $(document.createElement('div'));                                         // container for the dialog box title
            var buttonRow = $(document.createElement('div'));                                           // Container for "continue / cancel" buttons
            var submitButton = $(document.createElement('button'));
            var cancelButton = $(document.createElement('button'));

            // create dialog
            root.append(deleteConfirmationOverlay);
            deleteConfirmationOverlay.attr('id', 'deleteConfirmationOverlay');
            deleteConfirmationOverlay.css({
                display: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                'background-color': 'rgba(0,0,0,0.6)',
                'z-index': LADS.TourAuthoring.Constants.aboveRinZIndex,
            });

            deleteConfirmation.attr('id', 'deleteConfirmation');
            deleteConfirmation.css({
                position: 'absolute',
                left: '32.5%',
                'width': '35%',
                'top': '30%',
                border: '3px double white',
                'background-color': 'black',
                'padding': '2.5% 2.5%',
            });
            deleteConfirmationOverlay.append(deleteConfirmation);

            dialogTitle.attr('id', 'dialogTitle');
            dialogTitle.css({
                color: 'white',
                'font-size': '1.25em',
                'margin-bottom': '10px',
                'word-wrap': 'normal',
            });
            deleteConfirmation.append(dialogTitle);
            deleteConfirmation.append(document.createElement('br'));

            buttonRow.css({
                'margin-top': '10px',
                'text-align': 'center',
            });
            deleteConfirmation.append(buttonRow);

            submitButton.css({
                width: 'auto',
                border: '1px solid white',
                padding: '1%',
                'margin-right': '3%',
            });
            submitButton.text('Continue');
            $(submitButton).click(function () {
                var len = display.removeAttachedInkDisplays();
                display.removeDisplay(true);
                if (len > 0) {
                    undoManager.combineLast(len + 1);
                }
                deleteConfirmationOverlay.fadeOut(500);
            });
            buttonRow.append(submitButton);

            cancelButton.css({
                width: 'auto',
                border: '1px solid white',
                padding: '1%'
            });
            cancelButton.text('Cancel'); 
            cancelButton.click(function () {
                deleteConfirmationOverlay.fadeOut(500);
            });
            buttonRow.append(cancelButton);

            // fade in the overlay
            deleteConfirmationOverlay.fadeIn(500);
            dialogTitle.text('Deleting the last display in track "' + name + '" will disable all attached ink tracks. Any existing ink displays will not function until a new artwork display has been created at an overlapping time.');
        }
        that.confirmDeleteDisableInk = confirmDeleteDisableInk;

        /**Parses an individual track
         * Note that this is scoped into loadRIN function! (needs access to inks variable)
         * @method parseTrack
         * @param eobj      two params, name is track name, exp is rin format experience object
         * @param e         track position of eobj
         */
        function parseTrack(eobj, e) {
            // initialization of track
            trackname = eobj.name;              // track name is simply key / property name
            exp = eobj.exp;                     // actual experience entry
            type = exp.providerId;              // ZMES or AES or ...
            zIndex = exp.data.zIndex;
            if (exp.resourceReferences.length !== 0) {
                r = exp.resourceReferences[0].resourceId; // id used to get media url out of resources
            }
            track = null;
            if (type === 'ZMES') {
                track = addArtworkTrack(resources[r].uriReference, trackname, exp.data.guid, e);
            } else if (type === 'ImageES') {
                track = addImageTrack(resources[r].uriReference, trackname, e);
            } else if (type === 'VideoES') {
                mediaLength = exp.data.mediaLength;
                track = addVideoTrack(resources[r].uriReference, trackname, e, mediaLength);
            } else if (type === 'AES') {
                mediaLength = exp.data.mediaLength;
                track = addAudioTrack(resources[r].uriReference, trackname, e, mediaLength);
            } else if (type === 'InkES') {
                track = addInkTrack(null, trackname, 1, null, e);
                track.setInkPath(exp.data.linkToExperience.embedding.element.datastring.str);
                track.setInkEnabled(exp.data.linkToExperience.embedding.enabled);
                track.setInkInitKeyframe(exp.data.linkToExperience.embedding.initKeyframe);
                track.setInkRelativeArtPos(exp.data.linkToExperience.embedding.initproxy);
                track.link = exp.data.linkToExperience.embedding.experienceId;
                track.addInkTypeToTitle(exp.data.linkToExperience.embedding.element.datastring.str.split('::')[0].toLowerCase());
                inks.push({ 'track': track, 'link': exp.data.linkToExperience.embedding.experienceId }); // do link init later
                //create ink canvas and load datastring
            } else {
                console.log('Experience not yet implemented');
            }

            // check track ordering is correct
            if (track.getPos() !== experienceArray.length - zIndex) {
                console.log('zIndex and track array position are not the same for: ' + trackname);
            }

            // add displays from experience streams
            if (track) {
                experienceStreams = exp.experienceStreams;
                for (var es in experienceStreams) {
                    if (experienceStreams.hasOwnProperty(es)) {
                        expstrname = es + '';
                        expstr = experienceStreams[es]; // actual experience stream
                        length = expstr.duration;

                        // to find start + end of displays, need to scan screenplay
                        for (i = 0; i < screenplay.length; i++) {
                            currScp = screenplay[i];
                            if (currScp.experienceStreamId === expstrname) { // found a match
                                // note: scp length is fadeIn + main, expstr length is just main
                                // easy shortcut for reading fades
                                begin = currScp.begin;
                                if (expstr.data.transition && expstr.data.transition.providerId) {
                                    fadeIn = expstr.data.transition.inDuration;
                                    fadeOut = expstr.data.transition.outDuration;
                                } else {
                                    fadeIn = 0;
                                    fadeOut = 0;
                                }
                                display = track.addDisplay(timeManager.timeToPx(begin));
                                display.setMain(length);
                                display.setIn(fadeIn);
                                display.setOut(fadeOut);

                                // add keyframes
                                if (exp.providerId !== 'InkES' && exp.providerId !== 'VideoES') {
                                    defaultseq = expstr.header.defaultKeyframeSequence;
                                    keyframes = expstr.keyframes;
                                    for (j = 0; j < keyframes.length; j++) {
                                        currKey = keyframes[j];

                                        // ignore initialization keyframe
                                        if (currKey.init) { continue; }
                                        keyloc = timeManager.timeToPx(currKey.offset + display.getStart());
                                        if (type === 'ZMES' || type === 'ImageES') {
                                            key = display.addKeyframe(keyloc, LADS.TourAuthoring.Constants.trackHeight/2);
                                            if (key) key.loadRIN(currKey);
                                        } else if (type === 'AES') {
                                            // get audio to set y location
                                            y = currKey.state.sound.volume;
                                            y = Math.constrain(LADS.TourAuthoring.Constants.trackHeight - LADS.TourAuthoring.Constants.trackHeight * y, 0, LADS.TourAuthoring.Constants.trackHeight);
                                            key = display.addKeyframe(keyloc, y);
                                            if (key) track.addKeyframeToLines(key);
                                        } else if (type === 'VideoES') {
                                            //not used because of if check above
                                        } else {
                                            console.log('Experience not yet implemented');
                                        }
                                    }
                                }
                                // done with this display
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
    
    /**<Description> 
     * @method cancelAccel
     */
    function cancelAccel() {
        manipObjects.ruler.cancelAccel();
        manipObjects.track.cancelAccel();
    }
    
    return that;
};
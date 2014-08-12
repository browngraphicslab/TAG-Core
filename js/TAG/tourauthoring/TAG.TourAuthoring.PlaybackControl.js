TAG.Util.makeNamespace('TAG.TourAuthoring.PlaybackControl');

/**Component menu at the bottom of the screen
 * Contains controls for playing and seeking tour
 * @class TAG.TourAuthoring.PlaybackControl
 * @constructor
 * @param spec      timeManager attr undoManager
 */
TAG.TourAuthoring.PlaybackControl = function (spec) {
    "use strict";

    var that = {                                                                // public methods of the class
           addToDOM: addToDOM,                              
        },
        bottombar = $(document.createElement('div')),                           // creates the bottom div to hold the playback components
        playing = false,                                                        // keeps track of when the player is on
        undoManager = spec.undoManager,                                         // keeps track of the order of commands for the undo functionality
        timeManager = spec.timeManager,                                         // manages all time realted things in the tour
        viewer = spec.viewer,                                                   // preview window for the tour
        timeline = spec.timeline,                                               // timeline displayed on the authoring page
        root = spec.root,                                                       // main element of the page
        playHeadGroup,                                                          // represents the black, long playhead
        lastScale = timeManager.getDuration().scale,                            // stores the scale of the timeline, which can change because of zoom (?)
        oldpercent = 0;                                                         // initial zoom percentage of the timeline area

    /**Creates the main div to which the playback controls are appended
     * @method createBottomBar
     */
    (function createBottomBar() {
        var playButton = $(document.createElement('img'));
        var playheadContainer = createPlayheadSlider();
        var zoomContainer = createMagnifyingSlider();
        var volumeSliderContainer = $(document.createElement('div'));
        var undoRedoArea = createUndoRedo();

        bottombar.css({
            "background-color": "rgb(219,218,199)",
            "height": "9.25%",
            "width": "96.95%", "bottom": "0%",
            'margin-left': '1.25%',
            "position": "absolute",
            "box-shadow": "0px -16px 14px -14px #888",
            'z-index': '102',

        });
        bottombar.attr('id', 'playback-controls');

        // Play button
        playButton.css({
            "margin-top": "1%",
            'margin-left': '2%',
            'width': '4%',
            'height': '60%',
            "position": "relative",
            'display': 'inline-block'
        });
        playButton.attr('src', tagPath + 'images/icons/Play.svg');
        playButton.attr('id', 'playButton');
        playButton.click(function () { // Start and stop playback
            togglePlay();
        });
        bottombar.append(playButton);

        //allow space bar to play/pause
        root.on('keyup', function (evt) { // Start and stop playback
            if (evt.keyCode === 32) {
                togglePlay();
            }
        });

        /**Toggles play/pause states
         * @method togglePlay
         */
        function togglePlay() {
            if (!timeline.getEditInkOn()) {
                if (!playing) {
                    timeManager.play();
                } else {
                    timeManager.stop();
                }
            }
        }

        // on play and stop update the play button image and internal state
        timeManager.onPlayStart(function () {
            playButton.attr('src', tagPath + 'images/icons/Pause.svg');
            playing = true;
        });
        timeManager.onStop(function () {
            playButton.attr('src', tagPath + 'images/icons/Play.svg');
            playing = false;
        });

        bottombar.append(playheadContainer);
        bottombar.append(zoomContainer);

        volumeSliderContainer.css({
            'position': 'relative',
            'display': 'inline-block',
            'width': '5%', 'height': '60%',
            'vertical-align': 'middle',
            'margin-top': '-1%',
            'margin-right': '2%'
        });
        bottombar.append(volumeSliderContainer);
        bottombar.append(undoRedoArea);
    })();

    /**Creates the slider for playhead location in the timeline
     * @method createPlayheadSlider
     * @return {HTML Element} playheadLocContainer
     */
    function createPlayheadSlider() {
        // Playhead Location slider
        var playheadLocContainer = $(document.createElement('div'));
        var locationLabel = $(document.createElement('label'));                             // Label for control
        var sliderContainer = $(document.createElement('div'));                             // container for slider
        var slider = $(document.createElement('div'));                                      // Container and background for Slider
        var sliderBoxWidth = 125;
        var sliderBox = $(document.createElement('div'));
        var greenBoxInSlider = $(document.createElement('div'));
        var fader = createPlayhead();
        var faderUpdate;
        var labelUpdate;
        var sliderLabel = $(document.createElement('label'));


        playheadLocContainer.attr('id', 'playhead-location');
        playheadLocContainer.css({
            'margin-left': '12%', 'height': '100%', 'margin-top': '1%',
            'width': '37.5%', 'position': 'relative', 'display': 'inline-block', 'vertical-align': 'middle',
            'color': 'black',
        });

        locationLabel.attr('id', 'playLabel');
        locationLabel.text('Timeline Overview');
        locationLabel.css({
            'font-weight': '600',
            //'font-size': TAG.Util.getFontSize(45)
            'font-size': '70%'
        });
        playheadLocContainer.append(locationLabel);

        sliderContainer.attr('id', 'sliderContainer');
        sliderContainer.css({
            'position': 'absolute', 'width': '40%', 'height': '100%', 'margin-top': '-2%', 'display': 'inline-block',
        });
        playheadLocContainer.append(sliderContainer);

         slider.attr('id', 'timelineSlider');
        slider.css({
            'position': 'relative', 'margin-left': '4%', 'display': 'inline-block', 'width': '100%', 'height': '20%',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', 'background-color': 'white', 'margin-top': '8.5%',
        });
        sliderContainer.append(slider);

        sliderBox.attr('id', 'timelineSliderBox');
        sliderBox.css({
            'position': 'absolute', 'width': sliderBoxWidth + 'px',
            'height': '130%', 'border': '2px none black', 'margin-top': '-2%'
        });
        sliderBox.draggable({                                   // Updates the view using the element id. Be careful changing element ids
            axis: 'x',
            drag: function (evt, ui) {
                var sliderMax = slider.width() - sliderBox.width();
                var leftt;
                if (timeline.getEditInkOn()) {
                    return false;
                }

                ui.position.left = Math.constrain(ui.position.left, 0, sliderMax);
                leftt = (ui.position.left / (sliderMax + Math.ceil(sliderBox.width())) * timeline.getTimeRuler().width());
                timeline.registerUpdateSlider(null);
                timeline.getTrackBody().scrollLeft(leftt);
                timeline.cancelAccel();
                timeline.registerUpdateSlider(sliderBoxUpdate);
            }
        });
        slider.append(sliderBox);

        sliderBox.mousedown(function (evt) {
            evt.stopPropagation();
        });
        // Update the sliderBox when the timeManager changes size
        timeManager.onSizing(sliderBoxUpdate);
        timeline.registerUpdateSlider(sliderBoxUpdate);

        /**Updates the slider box on change
         * @method sliderBoxUpdate
         * @param {Event} evt
         */
        function sliderBoxUpdate(ev) {
            var timeRuler = timeline.getTimeRuler();
            var trackBody = timeline.getTrackBody();
            ev = ev || timeManager.getDuration();
            var oldWidth = sliderBox.width();

            // Check if the function is getting called before the elements are added to the page
            if (timeRuler.position()) {
                var newWidth = trackBody.width() / timeManager.timeToPx(ev.end) * (slider.width());
                var newLeft = (trackBody.scrollLeft()) / timeManager.timeToPx(ev.end) * (slider.width()) - 2;                           // subtract extra 4px to remove influence of border

                if (newWidth && oldWidth !== Math.ceil(newWidth)) {
                    // If the sliderBox would go past the edge of the slider then adjust
                    // it so that it does not.  This requires moving the timeline to the correct
                    // position to match the sliderBox.
                    if (newWidth + newLeft > slider.position().left + slider.width()) {
                        if (newWidth > slider.width()) {
                            newWidth = slider.width();
                        }
                        newLeft = slider.position().left + slider.width() - newWidth;
                    }
                    sliderBox.css('width', newWidth + 'px');
                }
                sliderBox.css('left', newLeft + 'px');
            }
        }

        greenBoxInSlider.css({
            'background-color': 'DarkGreen', 'top': '10%', 'height': '80%', 'position': 'absolute',
            'width': '100%', 'border': '2px solid black',
        });
        sliderBox.append(greenBoxInSlider);

        fader.css({
            'height': '400%', 'width': '25%', 'margin-top': '-4%',
            'position': 'absolute', 'left': '-12.5%', 'bottom': '-75%'
        });
        fader.attr('id', 'fader');
        fader.draggable({
            axis: 'x',
            drag: function (event, ui) {                                //changes ui on dragging end keyframes
                var sliderWidth = slider.width();
                var percent;
                if (timeline.getEditInkOn()) {
                    return false;
                }
                ui.position.left = Math.constrain(ui.position.left, sliderWidth * -0.125, sliderWidth - sliderWidth * 0.125);
                percent = Math.constrain((ui.position.left + sliderWidth * 0.125) / (sliderWidth + sliderWidth * 0.25 - fader.width()), 0, 1);
                timeManager.seekToPercent(percent);
            },
            stop: function () {
                if (fader.offset().left > slider.offset().left + slider.width()) {
                    fader.css('left', slider.width() + 'px');
                }
            }
        });
        faderUpdate = function (ev) {
            fader.css('left', ((fader.offsetParent().width()) * ev.percent) - fader.width() / 2 + 'px');
        };
        timeManager.onSeek(faderUpdate);
        timeManager.onPlay(faderUpdate);
        timeManager.onSizing(faderUpdate);
        slider.append(fader);

        sliderLabel.attr('id', 'playhead-position');
        sliderLabel.css({
            'position': 'relative',
            'left': '45%',
            'color': 'black',
            'display': 'inline-block',
            'font-weight': '600',
            //'font-size': TAG.Util.getFontSize(45)
            'font-size': '70%'
        });
        sliderLabel.text('0:00/1:00');

        labelUpdate = function (ev) {
            var current = timeManager.getCurrentTime();
            var end = timeManager.getDuration().end;
            var timeLeft;
            var timeRight;

            if (isNaN(current) || isNaN(end)) {
                timeLeft = '0:00';
                timeRight = '0:00';
            } else {
                timeLeft = timeManager.formatTime(current);
                timeRight = timeManager.formatTime(end);
            }
            sliderLabel.text(timeLeft + '/' + timeRight);
        };

        timeManager.onSeek(labelUpdate);
        timeManager.onPlay(labelUpdate);
        timeManager.onSizing(labelUpdate);
        playheadLocContainer.append(sliderLabel);

        return playheadLocContainer;
    }

    /**Creates zoom-in slider bar for timeline zooming
     * @method createMagnifyingSlider
     * @return {HTML Element} zoomSliderContainer
     */
    function createMagnifyingSlider() {
        var zoomSliderContainter = $(document.createElement('div'));
        var imgContainer = $(document.createElement('div'));                                                                           // Container for smaller lens.png
        var lensSmaller = $(document.createElement('img'));                                                                            // lens smaller, shown on the left of the slider
        var zoomslider = $(document.createElement('div'));                                                                             // Container and background for zoom bar
        var zoomfader = $(document.createElement('div'));
        var currScale = timeManager.getDuration().scale;
        var minScale = 1581 / timeManager.getDuration().end;
        var zoomFaderLeftInit = (currScale - minScale) / (TAG.TourAuthoring.Constants.maxZoom - minScale) * 100;
        var zoomfaderUpdate;
        var oldPos = 0.0;
        var newPos = 0.0;
        var imgContainer2 = $(document.createElement('div'));                                                                           // Container for bigger lens.png
        var lensBigger = $(document.createElement('img'));                                                                              // larger lens icon, shown on the right

        zoomSliderContainter.css({
            'position': 'relative',
            'display': 'inline-block',
            'width': '20%', 'height': '60%',
            'vertical-align': 'middle',
            'margin-top': '-1%',
            'margin-right': '2%'
        });

        imgContainer.attr('id', 'imgContainer');
        imgContainer.css({
            'position': 'absolute', 'display': 'inline-block', 'height': '50%'
        });
        zoomSliderContainter.append(imgContainer);

        lensSmaller.css({
            "margin-top": "8%",
            'margin-left': '0%',
            'height': '85%',
            'width': 'auto',
            "position": "relative",
            'display': 'inline-block'
        });
        lensSmaller.attr('src', tagPath + 'images/icons/Lens.svg');
        lensSmaller.attr('id', 'lensSmall');
        lensSmaller.click(function () {
            var pos = zoomfader.position().left - 0.1 * (zoomslider.width());
            var percent;
            if (pos >= 0) {
                zoomfader.css('left', pos + "px");
            } else {
                zoomfader.css('left', "0px");
            }
            percent = zoomfader.position().left / (zoomfader.offsetParent().width() - zoomfader.width());
            zoom(percent);
        });
        imgContainer.append(lensSmaller);

        zoomslider.attr('id', 'zoomslider');
        zoomslider.css({
            'position': 'absolute', 'display': 'inline-block', 'width': '68%', 'height': '35%', 'margin-top': '2%', 'margin-left': '10%',
            'background-color': 'rgb(136, 134, 134)', "border-radius": "25px"
        });
        zoomslider.mousedown(function (evt) {
            if (evt.which != 1)
                return;
            zoomfader.css('left',
                Math.constrain(evt.pageX - zoomslider.offset().left - zoomfader.width() / 2, 0, zoomslider.width() - zoomfader.width()));
            var percent = zoomfader.position().left / (zoomfader.offsetParent().width() - zoomfader.width());
            zoom(percent);
            zoomfader.trigger(evt);
        });
        zoomSliderContainter.append(zoomslider);

        zoomfader.attr('id', 'zoomPoint');
        zoomfader.css({
            'background-color': 'white', 'height': '110%', 'width': '10%',
            'position': 'absolute', 'top': '-10%', 'left': zoomFaderLeftInit + '%',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%"
        });
        zoomslider.append(zoomfader);
        zoomfader.mousedown(function (evt) {
            evt.stopPropagation();
        });
        zoomfader.draggable({
            axis: 'x', containment: 'parent',
            drag: function () {
                var percent = zoomfader.position().left / (zoomfader.offsetParent().width() - zoomfader.width());
                zoom(percent);
                timeline.cancelAccel();
            }
        });
        $('#timeRuler').livequery(function () {
            var percent = zoomfader.position().left / (zoomfader.offsetParent().width() - zoomfader.width());
            zoom(percent);
            $('#timeRuler').expire();
        });

        zoomfaderUpdate = function (ev) {
            zoomfader.css('left', ((zoomfader.offsetParent().width() - zoomfader.width()) * ev.percent) + 'px');
        };

        imgContainer2.attr('id', 'imgContainer');
        imgContainer2.css({
            'position': 'absolute', 'display': 'inline-block', 'height': '40%', 'margin-left': '80%'
        });
        zoomSliderContainter.append(imgContainer2);

        lensBigger.height = 1;
        lensBigger.width = 1;
        lensBigger.css({
            "margin-top": "-7%",
            'height': '170%',
            'width': 'auto',
            "position": "relative",
            'display': 'inline-block'
        });
        lensBigger.attr('src', tagPath + 'images/icons/Lens.svg');
        lensBigger.attr('id', 'lensBig');
        lensBigger.click(function () {
            var pos = zoomfader.position().left + 0.1 * (zoomslider.width());
            if (pos <= (zoomfader.offsetParent().width() - zoomfader.width())) {
                zoomfader.css('left', pos + "px");
            } else {
                zoomfader.css('left', (zoomfader.offsetParent().width() - zoomfader.width()) + "px");
            }
            var percent = zoomfader.position().left / (zoomfader.offsetParent().width() - zoomfader.width());
            zoom(percent);
        });
        imgContainer2.append(lensBigger);

        return zoomSliderContainter;
    }

    /**Creates area for undo/redo buttons
     * @method createUndoRedo
     * @return {HTML Element}  undoRedoButtonArea
     */
    function createUndoRedo() {
        var undoRedoButtonArea = $(document.createElement('div'));
        var undoRedoInkOnly = $(document.createElement('div'));
        var undoRedoButtonCSS = { 'height': '70%', 'width': 'auto', 'margin-left': '15%', 'opacity': '0.4' };
        var undoButton = $(document.createElement('img'));
        var redoButton = $(document.createElement('img'));

        that.undoRedoInkOnly = undoRedoInkOnly;
        that.undoButton = undoButton;
        that.redoButton = redoButton;

        undoRedoInkOnly.text("Affects Ink Only");
        undoRedoInkOnly.css({
            "color": "green",
            "margin-top": "-1%",
            "position": "relative",
            'display': 'none',
            'margin-left': '15%', 'font-weight': '600', 'font-size': TAG.Util.getFontSize(150)
        });

        undoRedoButtonArea.css({
            "margin-top": "-2%",
            "position": "relative",
            'z-index': 0,
            'height': '60%',
            'width': '15%',
            'vertical-align': 'middle',
            'display': 'inline-block'
        });
        undoRedoButtonArea.attr('id', 'undoRedoButtonArea');

        // undo and redo buttons
        $(undoButton).addClass('undoButton');
        undoButton.attr('src', tagPath + 'images/icons/Undo.svg');
        undoButton.css(undoRedoButtonCSS);
        undoButton.click(function () {
            undoManager.undo();
        });
        undoRedoButtonArea.append(undoButton);

        $(redoButton).addClass('redoButton');
        redoButton.attr('src', tagPath + 'images/icons/Redo.svg');
        redoButton.css(undoRedoButtonCSS);
        redoButton.click(function () {
            undoManager.redo();
        });
        undoRedoButtonArea.append(redoButton);
        undoRedoButtonArea.append(undoRedoInkOnly);
        return undoRedoButtonArea;
    }

    /**Creates playhead svg
     * @method createPlayhead
     * @return {HTML Element} playHeadDiv
     */
    function createPlayhead() {
        var playHeadDiv = $(document.createElement('div'));
        var playheadSVG = d3.select(playHeadDiv[0])
                                    .append("svg")
                                    .style('position', 'absolute')
                                    .style('left', '50%')
                                    .style('top', '-2%')
                                    .attr("width", '0%')
                                    .attr("height", '40%'); // div to be transformed into an svg group

        playHeadGroup = playheadSVG.append("g");

        var playHeadTop = playHeadGroup.append("circle")
                                   .attr('cx', '0')
                                   .attr('cy', '80%')
                                   .attr('r', '40%')
                                   .attr('fill', 'black')
                                   .attr('stroke', 'black')
                                   .attr('stroke-width', '10%')
                                   .attr('fill-opacity', '0');

        var playHead = playHeadGroup.append("line")
                                         .attr('x1', '0')
                                         .attr('y1', '110%') // 11.4%
                                         .attr('x2', '0')
                                         .attr('y2', '210%')
                                         .attr('pointer-events', 'none')
                                         .attr('stroke', 'black')
                                         .attr('stroke-width', '10%');
        return playHeadDiv;
    }

    /**Zooms the timeline
     * @method zoom
     * @param {Number} percent
     */
    function zoom(percent) {
        var trackBody = timeline.getTrackBody(),
            timeRuler = timeline.getTimeRuler(),
            dur = timeManager.getDuration(),
            oldScale = dur.scale,
            totalTime = dur.end,
            minScale = trackBody.width() / totalTime,
            newScale = minScale + percent * (TAG.TourAuthoring.Constants.maxZoom - minScale);

        newScale = Math.min(Math.max(newScale, minScale), TAG.TourAuthoring.Constants.maxZoom);
        lastScale = oldScale;

        // data for zooming
        var viewWidth = trackBody.width();
        var midpoint = viewWidth * 0.5;
        var anchorPoint = viewWidth * 0.45;                                                         // see below for explanation
        var oldTrackLength = timeManager.timeToPx(totalTime);
        var newTrackLength = newScale * dur.end;                                                    // (px per second) x (total seconds)
        var oldPlayheadPosition = timeManager.timeToPx(timeManager.getCurrentTime());
        var oldWindowPosition = trackBody.scrollLeft();
        var newWindowPosition;                                                                      //for use later

        // zoom variables
        var leftViewerBoundaryOffset,
            newPlayheadPosition,
            windowPosition;
        var relativeCenterPosition;
        var newAbsoluteCenterPosition;
        var relativeAnchorPosition;
        var newAbsoluteAnchorPosition;

        // zoom is getting called on onSizing now to appropriately adjust to timeline
        // length changes.  Zoom also causes onSizing events to fire when it adjusts
        // the scale, so if the scale doesn't change don't call setScale.   
        if (newScale === oldScale) {
            return;
        }

       

        // if playhead is onscreen, zooming in and out fixes left viewer boundary at the 
        // same pixel distance to the playhead.
        if (oldPlayheadPosition >= oldWindowPosition && oldPlayheadPosition <= oldWindowPosition + viewWidth) {
            if (newScale < oldScale) {
                trackBody.scrollLeft(0);
            }

            // checking zoom boundaries and applying scale to timeManager
            if (newScale >= minScale) {                                                                     // min zoom
                if (newTrackLength >= trackBody.width()) {
                    timeManager.setScale(newScale);
                }
            } else if (newScale <= TAG.TourAuthoring.Constants.maxZoom) {                                  // max zoom
                timeManager.setScale(newScale);
            }
            
            // begin zoom functionality
            leftViewerBoundaryOffset = oldPlayheadPosition - oldWindowPosition;
            newPlayheadPosition = timeManager.getCurrentPx();
            windowPosition = newPlayheadPosition - leftViewerBoundaryOffset;
            trackBody.scrollLeft(windowPosition);
        } else {                                                                                            // if playhead not onscreen, zoom in and zoom out have different anchor points

            // zooming out anchors to center
            if (newScale < oldScale) {
                trackBody.scrollLeft(0);

                // checking zoom boundaries and applying scale to timeManager
                if (newScale >= minScale) {                                                                 // min zoom
                    if (newTrackLength >= trackBody.width()) {
                        timeManager.setScale(newScale);
                    }
                } else if (newScale <= TAG.TourAuthoring.Constants.maxZoom) { // max zoom
                    timeManager.setScale(newScale);
                }
                // end scale check

                // begin zoom functionality
                relativeCenterPosition = (oldWindowPosition + midpoint) / oldTrackLength;                  // find viewer center's relative position to the entire track length
                newAbsoluteCenterPosition = relativeCenterPosition * newTrackLength;                       // calculate viewer center's new absolute position for new track length
                newWindowPosition = newAbsoluteCenterPosition - midpoint;                                  // determine window position by subtracting midpoint pixel distance

                if (newWindowPosition + viewWidth > newTrackLength) {                                      // determine practical view window position based on theoretical position and boundaries
                    trackBody.scrollLeft(newTrackLength - viewWidth);
                } else if (newWindowPosition < 0) {
                    trackBody.scrollLeft(0);
                } else {
                    trackBody.scrollLeft(newWindowPosition);
                }
            } else {                                                                                        // checking zoom boundaries and applying scale to timeManager
                if (newScale >= minScale) {                                                                 // min zoom
                    if (newTrackLength >= trackBody.width()) {
                        timeManager.setScale(newScale);
                    }
                } else if (newScale <= TAG.TourAuthoring.Constants.maxZoom) {                              // max zoom
                    timeManager.setScale(newScale);
                }
                
                // begin zoom functionality
                var relativeAnchorPosition = (oldWindowPosition + anchorPoint) / oldTrackLength;            // find anchor's relative position to the entire track length
                var newAbsoluteAnchorPosition = relativeAnchorPosition * newTrackLength;                    // calculate anchor's new absolute position for new track length
                newWindowPosition = newAbsoluteAnchorPosition - midpoint;                                   // determine window position by subtracting anchor pixel distance


                if (newWindowPosition + viewWidth > newTrackLength) {                                       // and then position window based on theoretical position and boundaries
                    trackBody.scrollLeft(newTrackLength - viewWidth);
                } else if (newWindowPosition < 0) {
                    trackBody.scrollLeft(0);
                } else {
                    trackBody.scrollLeft(newWindowPosition);
                }
            }
        }
        oldpercent = percent;
    }

    /**Adds the bottombar to the DOM
     * @method addToDOM
     * @param {HTML Element} container
     */
    function addToDOM(container) {
        container.appendChild(bottombar[0]);
    }
    
    return that;
};
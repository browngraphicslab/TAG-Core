LADS.Util.makeNamespace('LADS.TourAuthoring.Viewer');

/**Previews current tour while user edits
 * @class LADS.TourAuthoring.Viewer
 * @constructor
 * @param spec  timeManager attr, url (url of tour if loading existing tour for editing)
 * @param my    not used
 */
LADS.TourAuthoring.Viewer = function (spec, my) {
    "use strict";

    var that = {                                                                                        // object storing public methods of the class
            capturingOff: capturingOff,
            isKeyframingDisabled: isKeyframingDisabled,
            captureKeyframe: captureKeyframe,
            getCurrentTime: getCurrentTime,
            addToDOM: addToDOM,
            getContainer: getContainer,
            resize: resize,
            play: play,
            stop: stop,
            seek: seek,
            volume: volume,
            setTimeline: setTimeline,
            loadTour: loadTour,
            reloadTour: reloadTour,
            getIsReloading: getIsReloading,
            setIsReloading: setIsReloading,
            initializeTour: initializeTour,
            unload: unload
        },
        player,                                                                                         // RIN player
        timeline,                                                                                       // an instance of the timeline
       
        artworkPanel = $(document.createElement('div')),                                                // a div to display the track on the viewer
        rinContainer = $(document.createElement('div')),                                                // container for RIN
        timeManager = spec.timeManager,                                                                 // handles all time-related tasks in the tour
        url = spec.url,                                                                                 // url of the track

        // viewer state
        playing = false,                                                                                // boolean checks if the track is playing
        buffering = false,                                                                              // checks if the track is buffering
        reloading = false,                                                                              // checks to see if the tour is reloading
        needRefresh = false,                                                                            // checks if the tour needs to be refreshed after changes have been made
        ctime = null,                                                                                   // current pixel coordinates time of the tour in the viewer

        // capturing keyframes
        capturingOn = false,                                                                            // boolean determines if keyframe data can be captured
        currentCapture = '',                                                                            // currently captured data of a keyframe
        keyframingDisabled = false,                                                                     // whether key frames are allowed currently
        isReloading = false;                                                                            // is the tour reloading

    /**Instantiate RIN player
     * @method _startRIN
     */
    (function _startRIN() {
        // HTML containers
        var playerElement = $(document.createElement('div'));
        artworkPanel.attr('id', 'viewer');
        artworkPanel.css({
            "background-color": "rgb(0,0,0)",
            "height": "100%",
            "width": "80%",
            "position": "relative",
            "left": "20%"
        });

        rinContainer.attr('id', 'rinContainer');
        rinContainer.css({
            'border-style': 'solid', 'border-width': LADS.TourAuthoring.Constants.rinBorder+'px', 'border-color': 'white',
            'height': '95%', 'width': '30%', 'top': '0%', 'left': '30%', 'position': 'absolute', 'z-index': 0
        });
        artworkPanel.append(rinContainer);

       
        playerElement.attr('id', 'rinplayer');
        playerElement.css({
            'z-index': -100, 'overflow': 'hidden',
            'height': '100%', 'width': '100%',
            'position': 'absolute'
        });
        rinContainer.append(playerElement);

        // creates actual RIN player
        rin.processAll(null, 'js/rin/web/').then(function () {
            var options = 'systemRootUrl=js/rin/web/&hideAllControllers=true&playerMode=authorerEditor';
            player = rin.createPlayerControl(playerElement[0], options);
            player.orchestrator.playerESEvent.subscribe(_onPlayerESEvent, 'id');
            player.orchestrator.isPlayerReadyChangedEvent.subscribe(_onPlayerStateEvent);
            timeManager.registerTime(getCurrentTime);
        });

        if (url) {
            loadTour(url, function () { console.log('Viewer: initial loading complete'); });
        }
    })();

    /**When RIN is interacted with, captures new keyframe data and sends it to timeline
     * @method _onPlayerESEvent
     * @param eventArgs     sender, eventId, ? (RIN)
     */
    function _onPlayerESEvent(eventArgs) {
        console.log(eventArgs.eventId);
        if (timeline) {
            switch (eventArgs.eventId) {
                case rin.contracts.esEventIds.interactionActivatedEventId:
                    timeManager.stop();                                                         // on interaction start capturing
                    capturingOn = true;
                    currentCapture = eventArgs.sender._esData.experienceId;
                    if (capturingOn && !reloading && !keyframingDisabled && timeManager.getReady()) {
                        _sendKeyframe(eventArgs.sender);
                    }
                    break;
                case rin.contracts.esEventIds.stateTransitionEventId:
                    // filter out non-interaction transitions
                    if (capturingOn && !reloading && !keyframingDisabled && timeManager.getReady()) {
                        _sendKeyframe(eventArgs.sender);
                    }
                    break;
            }
        }
    }

    /**Seneds keyframe data to timeline
     * @method _sendKeyframe
     * @param sender
     */
    function _sendKeyframe(sender) {
        var trackName,
            capture = '';
        if (sender.captureKeyframe && capturingOn) {
            capture = sender.captureKeyframe();
            if (capture === '') {                                       // continue capturing until successful
                console.log('No keyframe captured!?');
                return;
            }
            trackName = sender._esData.experienceId;
            timeline.receiveKeyframe(trackName, capture, true);
            timeline.allDeselected();
        }
    }

    /**Turn capturing off on update
     * @method capturingOff
     */
    function capturingOff() {
        capturingOn = false;
        currentCapture = '';
    }
    
    /**Get state of keyframe disable switch.
     * @method isKeyframingDisabled
     * @return {Boolean} keyframingDisabled
     */
    function isKeyframingDisabled() {
        return keyframingDisabled;
    }
    
    /**** Add event listeners for playerReady event to re-enable keyframe capture ****/
    $('body')[0].addEventListener('playerReady', function () {
        keyframingDisabled = false;
    });

    $('body')[0].addEventListener('playerReloading', function () {
        keyframingDisabled = true;
        setTimeout(function () {
            keyframingDisabled = false;
        }, 150);
    });

    /**Syncs time manager with buffering state of RIN
     * @method _onPlayerStateEvent
     * @param isReady        true if RIN is ready to play
     */
    function _onPlayerStateEvent(isReady) {
        buffering = !isReady;
        timeManager.setReady(isReady);
        reloading = false;
        if (isReady) {
            if (needRefresh && ctime) {
                needRefresh = false;
                seek(timeManager.getCurrentTime());
                ctime = null;
            }
            needRefresh = false;
            setTimeout(function () {
                var readyEvent = document.createEvent('Event');
                readyEvent.initEvent('playerReady', true, true);
                $('body')[0].dispatchEvent(readyEvent);
            }, 500);
        }
    }

    /**Turn off capture on player events
     * @method _stopCapture
     */
    function _stopCapture() {
        capturingOn = false;
    }
    timeManager.onMove(_stopCapture);
    timeManager.onStop(_stopCapture);

    ////////////////////
    // Public methods //
    ////////////////////

    /**Returns data from current state of the keyframe
     * @method captureKeyframe
     * @param artname
     * @return     current keyframe state data
     */
    function captureKeyframe(artname) {
        if (player) {
            return player.captureKeyframe(artname); 
        }
    }
    
    /**Passed to TimeManager on player load
     * @method getCurrentTime
     * @return {Time}     current time in player
     */
    function getCurrentTime() {
        return player.orchestrator.getCurrentLogicalTimeOffset();
    }
    
    /**Adds viewer container to DOM
     * @method addToDOM
     * @param {HTML Element} addToDOM
     */
    function addToDOM(container) {
        container.append(artworkPanel);
    }
    
    /**Get JQuery object containing rin player
     * @method getContainer
     * @return rinContainer
     */
    function getContainer() {
        return rinContainer;
    }
    
    /**Updates size of viewer area on resize
     * @method resize
     */
    function resize() {
        var h = artworkPanel.height() - 2 * LADS.TourAuthoring.Constants.rinBorder,
            w = artworkPanel.width() - 2 * LADS.TourAuthoring.Constants.rinBorder,
            idealW = h * 16 / 9,
            idealH,                                 // ideal W given h, vice-versa (9:16 ratio)
            xoffset,
            yoffset;
        if (idealW <= w) {
            xoffset = (w - idealW) / 2;
            rinContainer.css({
                width: idealW + 'px',
                height: h + 'px',
                top: '0px',
                left: xoffset + 'px'
            });
        } else {                                    // no room to support, use ideal H
            idealH = w * 9 / 16;
            yoffset = (h - idealH) / 2;             // equal spacing on top and bottom
            rinContainer.css({
                width: w + 'px',
                height: idealH + 'px',
                top: yoffset + 'px',
                left: '0px'
            });
        }
    }
    
    /////////////////////////
    // PLAYER INTERACTIONS //
    /////////////////////////

    /**Play viewer (should only be called from timeManager)
     * @method play
     * @param time
     */
    function play(time) {
        if (!playing) {
            player.play(time);
            playing = true;
        }
    }
    timeManager.onPlayStart(function (ev) { play(ev.current); });

    /**Stop viewer (should only be called from timeManager)
     * @method stop
     */
    function stop() {
        if (playing && !buffering) {
            player.pause();
            playing = false;
        }
    }
    timeManager.onStop(stop);

    /**Seek viewer (should only be called from timeManager)
     * @method seek
     * @param time  location to seek to in units of seconds
     */
    function seek(time) {
        if (player.orchestrator._isNarrativeLoaded) {
            if (needRefresh) {
                ctime = timeManager.timeToPx(time);
            } else if (player && !playing) {
                stop();
                playing = false;
                player.pause(time);
            }
        }
    }
    timeManager.onSeek(function (ev) { seek(ev.current); });

    /**Set volume
     * @method volume
     * @param v     volume, between 0 and 1
     */
    function volume(v) {
        player.volume(v);
    }
    
    /**Set reference to Timeline for keyframe passing
     * @method setTimeline
     * @param t
     */
    function setTimeline(t) {
        timeline = t;
    }
    
    /**Load tour from url
     * @method loadTour
     * @param url       URL of json tour
     */
    function loadTour(url, callback) {
        if (player) {
            player.load(url, callback);
        } else {
            setTimeout(function () {
                loadTour(url, callback);
            }, 50);
        }
    }
    
    /**Load / reload tour into viewer
     * @method reloadTour
     * @param data      Segment portion of RIN tour
     */
    function reloadTour(data, doNotUpdateReloading) {
        if (!doNotUpdateReloading) {
            isReloading = true;
        }
        console.log("####################################################: "+isReloading);
        for (var key in data.resources) {
            if (data.resources.hasOwnProperty(key)) {
                if (typeof data.resources[key].uriReference === 'string') {
                    data.resources[key].uriReference = LADS.Worktop.Database.fixPath(data.resources[key].uriReference);
                }               
            }
        }
        if (player) {
            reloading = true;
            needRefresh = true;
            player.orchestrator._isPlayerReady = false;
            ctime = timeManager.getCurrentTime();
            player.unload();
            player.loadData(data, function () {
                if (!needRefresh) {
                    seek(timeManager.getCurrentTime());
                    setTimeout(function () {
                        var readyEvent = document.createEvent('Event');
                        readyEvent.initEvent('playerReady', true, true);
                        $('body')[0].dispatchEvent(readyEvent);
                    }, 500);
                }
                if (!doNotUpdateReloading) {
                    isReloading = false;

                }
                console.log("##############################################: "+isReloading);
            });
        } else {
            setTimeout(function () { reloadTour(data, true); }, 50);
        }
    }
    
    /**Returns state of tour reloading boolean
     * @method getIsReloading
     * @return {Boolean} isReloading
     */
    function getIsReloading() {
        return isReloading;
    }
    
    /**Returns state of tour reloading boolean
     * @method setIsReloading
     * @param {Boolean} bool
     */
    function setIsReloading(bool) {
        isReloading = bool;
    }
   
    /**Starts the tour in the viewer
     * @method initializeTour
     * @param data
     */
    function initializeTour(data) {
        var ctime;
        isReloading = true;
        console.log("isReloading: true, in initializeTour");
        if (player) {
            ctime = timeManager.getCurrentTime();
            player.unload();
            player.loadData(data, function () {
                setTimeout(function () {
                    seek(ctime);
                    isReloading = false;
                    console.log("isReloading: false, in initializeTour");
                }, 50);
            });
        } else if (timeline.getTrackslength() === 0) {
            ctime = timeManager.getCurrentTime();
            setTimeout(function () {
                isReloading = false;
                console.log("isReloading: false, in initializeTour");
            }, 50);
        } else {
            setTimeout(function () { reloadTour(data, true); }, 50);
        }
    }
    
    /**Unloads RIN player call when exiting Authoring
     * @method unload
     */
    function unload() {
        player.unload();
    }
  
    return that;
};
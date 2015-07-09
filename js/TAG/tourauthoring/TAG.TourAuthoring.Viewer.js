TAG.Util.makeNamespace('TAG.TourAuthoring.Viewer');

/**
 * Previews current tour while user edits
 * @param spec  timeManager attr, url (url of tour if loading existing tour for editing)
 * @param my    not used
 */
TAG.TourAuthoring.Viewer = function (spec, my) {
    "use strict";

    var player,
        timeline,
        that = {},
        viewerPanel = $(document.createElement('div')),
        ITEContainer = $(document.createElement('div')),
        timeManager = spec.timeManager,
        url = spec.url,
        tourobj = spec.tourobj,
        tour = TAG.Util.RIN_TO_ITE(tourobj),

        // viewer state
        playing = false,
        buffering = false,
        reloading = false,
        needRefresh = false,
        ctime = null,

        // capturing keyframes?
        capturingOn = false,
        currentCapture = '',
        keyframingDisabled = false,

        ITEConfig = {
            attachVolume: true,
            attachLoop: true,
            attachPlay: true,
            attachProgressBar: true,
            attachFullScreen: true,
            attachProgressIndicator: true,
            fadeControlskey: true,
            hideControls: true,
            autoPlay: false,
            autoLoop: false,
            setMute: false,
            setInitVolume: 1,
            allowSeek: true,
            setFullScreen: false,
            setStartingOffset: 0,
            setEndTime: NaN,
            isAuthoring: true
        },

        // reload state boolean
        isReloading = false;

    that.tour = tour;

    // create ITE player
    var createITE = function (reload) {

        // panels
        if (!reload) {
            viewerPanel.attr('id', 'viewer');
            viewerPanel.css({
                "background-color": "rgb(0,0,0)", "height": "100%", "width": "80%",
                "position": "relative", "left": "20%"
            });
            // let's assume 16:9 ratio for now
            ITEContainer.attr('id', 'ITEContainer');
            ITEContainer.css({
                'border-style': 'solid',
                'border-width': TAG.TourAuthoring.Constants.rinBorder + 'px',
                'border-color': 'white',
                'height': '95%',
                'width': '30%',
                'top': '0%',
                'left': '30%',
                'position': 'absolute',
                'overflow': 'hidden'
            });

            viewerPanel.append(ITEContainer);
        }

        // create ITE player
        player = new ITE.Player(ITEConfig, self, ITEContainer);

        // load from URL (TODO)
        //if (url) {
        //    loadTour(url, function () { console.log('Viewer: initial loading complete'); });
        //}

    };

    createITE(false);

    function loadITE() {
        //player.load(tour);
        timeManager.setPlayer(player);
        player.refresh();
    }
    that.loadITE = loadITE;

    function getITE() {
        return player;
    }
    that.getITE = getITE;


    function forceITEPlayerReload() {
        var temp = $(TAG.Util.UI.blockInteractionOverlay(1));
        var temp2 = $(TAG.Util.UI.blockInteractionOverlay(1));
        temp.css("display", 'block')
        temp2.css("display", 'block')
        var root = $(document.body);
        root.append(temp)
        root.append(temp2)

        TAG.Util.showLoading(temp2, '20%', '40%', '40%')
        temp.css('background-color','rgb(0,0,0,1)')
        temp.css("z-index", "2147483646");
        temp2.css("z-index", "2147483647");

        var content = JSON.stringify(timeline.toRIN(true));
        var related = JSON.stringify(timeline.getRelatedArtworks());
        var options = {
            Name : $("#textArea").val(),
            Content: content,
            RelatedArtworks: related
        }
        TAG.Worktop.Database.changeTour(tourobj, options, function () {
            // success




            console.log(tourobj)
            console.log(tour)
            stop();
            unload();
            var tempSettings = new TAG.Authoring.SettingsView('Tours', null, null, tourobj.Identifier);

            TAG.Util.UI.slidePageRight(tempSettings.getRoot(), function () {

                console.log($("#setViewButtonContainer"));
                $("#setViewButtonContainer")[0].firstChild.click();
                window.setTimeout(function () {
                    TAG.Util.hideLoading(temp2)
                    temp.remove();
                    temp2.remove();
                }, 750);
                /*
                var toureditor = new TAG.Layout.TourAuthoringNew(tourobj, function () {
                    TAG.Util.UI.slidePageLeft(toureditor.getRoot(), function () {
                        toureditor.getViewer().loadITE();
                        toureditor.getTimeline().onUpdate();
                    });
                });
                /*
                if (progressBarLength > 0) { //other upload happening - disable import
                    toureditor.uploadStillHappening(true);
                }*/
            })





        }, function () {
            // unauth
            dialogOverlay.hide();
            var popup = TAG.Util.UI.popUpMessage(null, "Tour not saved.  You must log in to save changes.");
            $('body').append(popup);
            $(popup).show();
        }, function (jqXHR, ajaxCall) {
            // conflict
            // Ignore conflict for now
            ajaxCall.force();
        }, function () {
            // error
            dialogOverlay.hide();
            var popup = TAG.Util.UI.popUpMessage(null, "Tour not saved.  There was an error contacting the server.");
            $('body').append(popup);
            $(popup).show();
        });

        /*
        $('#ITEHolder').remove();
        createITE(true);
        loadITE();
        timeManager.setPlayer(player);
        */
    }
    that.forceITEPlayerReload = forceITEPlayerReload;

    /**
     * When RIN is interacted with, captures new keyframe data and sends it to timeline
     * @param eventArgs     sender, eventId, ? (RIN)
     */
    function _onPlayerESEvent(eventArgs) {
        console.log(eventArgs.eventId);
        if (timeline) {
            switch (eventArgs.eventId) {
                case rin.contracts.esEventIds.interactionActivatedEventId:
                    timeManager.stop(); // on interaction start capturing
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

    function _sendKeyframe(sender) {
        var trackName, capture = '';
        if (sender.captureKeyframe && capturingOn) {
            capture = sender.captureKeyframe();
            if (capture === '') { // continue capturing until successful
                //setTimeout(function () { _sendKeyframe(sender); }, 10);
				console.log('No keyframe captured!?');
                return;
            }
            trackName = sender._esData.experienceId;

            timeline.receiveKeyframe(trackName, capture,
                true);
            timeline.allDeselected();
        }
    }

    /**
     * Turn capturing off on update
     */
    function capturingOff() {
        capturingOn = false;
        currentCapture = '';
    }
    that.capturingOff = capturingOff;

    /**
     * Get state of keyframe disable switch.
     */
    function isKeyframingDisabled() {
        return keyframingDisabled;
    }
    that.isKeyframingDisabled = isKeyframingDisabled;

    function setKeyframingDisabled(state) {
        keyframingDisabled = state;
    }
    that.setKeyframingDisabled = setKeyframingDisabled;

    // add event listener for playerReady event to re-enable keyframe capture.
    $('body')[0].addEventListener('playerReady', function () {
        keyframingDisabled = false;
    });

    $('body')[0].addEventListener('playerReloading', function () {
        keyframingDisabled = true;
        setTimeout(function () {
            keyframingDisabled = false;
        }, 150);
    });

    /**
     * Syncs time manager with buffering state of RIN
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

    // Turn off capture on player events
    function _stopCapture() {
        capturingOn = false;
    }
    timeManager.onMove(_stopCapture);
    timeManager.onStop(_stopCapture);

    // Public stuff

    /**
     * @returns     current keyframe state data
     */
    function captureKeyframe(title) {
        if (player) {
            //return null;
            return player.captureKeyframe(title); //grab artwork container? BREAKPOINT HERE
        }
    }
    that.captureKeyframe = captureKeyframe;

    /**
     * Passed to TimeManager on player load
     * @returns     current time in player
     */
    function getCurrentTime() {
        //return 0;
        return player.orchestrator.getElapsedTime();
    }
    that.getCurrentTime = getCurrentTime;
    

    function addToDOM (container) {
        container.append(viewerPanel);
    }
    that.addToDOM = addToDOM;

    /**
     * Get JQuery object containing rin player
     */
    function getContainer() {
        return ITEContainer;
    }
    that.getContainer = getContainer;

    /**
     * Updates size of viewer area on resize
     */
    function resize() {
        var h = viewerPanel.height() - 2 * TAG.TourAuthoring.Constants.rinBorder,
            w = viewerPanel.width() - 2 * TAG.TourAuthoring.Constants.rinBorder,
            idealW = h * 16 / 9, idealH, // ideal W given h, vice-versa
            xoffset, yoffset;
        if (idealW <= w) {
            xoffset = (w - idealW) / 2;
            ITEContainer.css({
                width: idealW + 'px',
                height: h + 'px',
                top: '0px',
                left: xoffset + 'px'
            });
        } else { // no room to support, use ideal H
            idealH = w * 9 / 16;
            yoffset = (h - idealH) / 2; // equal spacing on top and bottom
            ITEContainer.css({
                width: w + 'px',
                height: idealH + 'px',
                top: yoffset + 'px',
                left: '0px'
            });
        }
    }
    that.resize = resize;

    // PLAYER INTERACTIONS
    /**
     * Play viewer (should only be called from timeManager)
     */
    function play() {
        if (!playing) {
            player.play()
            playing = true;
        }
    }
    that.play = play;
    timeManager.onPlayStart(function (ev) {
        play();
    });

    /**
     * Stop viewer (should only be called from timeManager)
     */
    function stop() {
        if (playing && !buffering) {
            player.pause();
            playing = false;
        }
    }
    that.stop = stop;
    timeManager.onStop(stop);

    /**
     * Seek viewer (should only be called from timeManager)
     * @param time  location to seek to in units of seconds
     */
    function seek(time) {
        player.scrubTimeline(time.percent);
        // HACK TO GET IT TO REFRESH
        //player.play();
        //player.pause();
    }
    that.seek = seek;
    timeManager.onSeek(function (time) {
        seek(time);
    });

    /**
     * Set volume
     * @param v     volume, between 0 and 1
     */
    function volume(v) {
        player.volume(v);
    }
    that.volume = volume;

    /**
     * Set reference to Timeline for keyframe passing
     */
    function setTimeline(t) {
        timeline = t;
    }
    that.setTimeline = setTimeline;

    /**
     * Load tour from url
     * @param url       URL of json tour
     */
    function loadTour(url, callback) {
        return;
        //if (player) {
        //    player.load(url, callback);
        //} else {
        //    setTimeout(function () {
        //        loadTour(url, callback);
        //    }, 50);
        //}
    }
    that.loadTour = loadTour;

    /**
     * Load / reload tour into viewer
     * @param data      Segment portion of RIN tour
     */
    function reloadTour(data, handlers, callback) {
        if (player) {
            reloading = true;
            // call reload
            //var conv = {
            //    Metadata: {
            //        Content: JSON.stringify(data)
            //    }
            //};
            this.unload();
            player.load(TAG.Util.RIN_TO_ITE(data));
            player.getOrchestrator().setPendingCallback(callback);
            player.bindCaptureHandlers(handlers);
            //player.scrubTimeline(percent);
            reloading = false;
        }
    }
    that.reloadTour = reloadTour;

    function getIsReloading() {
        return isReloading;
    }
    that.getIsReloading = getIsReloading;

    function setIsReloading(bool) {
        isReloading = bool;
    }
    that.setIsReloading = setIsReloading;

    function initializeTour(data) {
        var ctime;
        isReloading = true;
        console.log("isReloading: true, in initializeTour");
        // console.log("player: "+player);
        if (timeline.getTrackslength() === 0) {
            ctime = timeManager.getCurrentTime();
            //setTimeout(function () {
            //seek(ctime);
            isReloading = false;
            console.log("no tracks. isReloading: false, in initializeTour");
            //}, 50);
        } else if (player) {
            ctime = timeManager.getCurrentTime();
            player.unload();
            //player.loadData(data, function () {
            //    setTimeout(function () {
            //        seek(ctime);
            //        isReloading = false;
            //        console.log("isReloading: false, in initializeTour");
            //    }, 50);
            //});
        } else {
            setTimeout(function () { reloadTour(data, true); }, 50);
        }
    }
    that.initializeTour = initializeTour;

    /**
     * Unloads RIN player
     * call when exiting Authoring
     */
    function unload() {
        player.unload();
    }
    that.unload = unload;

    function getPlayer() {
        return player;
    }
    that.getPlayer = getPlayer;

    function getTour() {
        return tour;
    }
    that.getTour = getTour;

    return that;
};
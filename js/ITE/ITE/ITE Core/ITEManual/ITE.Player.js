﻿window.ITE = window.ITE || {};

ITE.Player = function (options, tourPlayer, container,idleTimer, infoData) { //acts as ITE object that contains the orchestrator, etc
    var totalTourDuration;
    var data = infoData;
    var orchestrator = new ITE.Orchestrator(this, options.isAuthoring, idleTimer),
         self = this,
         playerConfiguration = {
             attachVolume: true,
             attachLoop: true,
             attachPlay: true,
             attachProgressBar: true,
             attachFullScreen: true,
             attachProgressIndicator: true,
             fadeControls: true,
             hideControls: false,
             autoPlay: false,
             autoLoop: false,
             setMute: false,
             setInitVolume: 1,
             allowSeek: true,
             setFullScreen: false,
             setStartingOffset: 0,
             setEndTime: NaN //defaults to end of tour if NaN
         },    //dictionary of player configuration options; defaults being set
     //DOM related
         ITEHolder = $(document.createElement("div"))
             .attr("id", "ITEHolder"),
         bottomContainer = $(document.createElement("div"))
             .attr("id", "bottomContainer"),
         buttonContainer = $(document.createElement("div"))
             .attr("id", "buttonContainer");
   if (!options.isAuthoring) {
       ITEHolder.append(bottomContainer);
       bottomContainer.append(buttonContainer);
   }

    //Buttons
   var volumeButton = $(document.createElement("img")),
       volumeLevel = $(document.createElement("img")),
       playPauseButton = $(document.createElement("img")),
       loopButton = $(document.createElement("img")),
       progressBar = $(document.createElement("div")),
       fullScreenButton = $(document.createElement("img")),
       progressIndicator = $(document.createElement("div")),
       volumeLevelContainer = $(document.createElement("div")),
       infoAvailableIcon = $(document.createElement("img")),
       NOBEL_WILL_COLOR = 'rgb(254,161,0)',
       slidingPane = createSlidingPane(),
       infoTracksVisible = [],
       initialOverlay,
       initialLoading = true,
       infoPopup,


   //Other atributes
       infoPaneOut = false,
       infoPaneVisible = false,
       timeOffset,
       controlsTimeout,
       isMuted,
       isLooped,
       isFullScreen,
       isSeeking,
       isUnloaded = false;

    //Other miscellaneous variables
    Utils = new ITE.Utils();
    this.orchestrator = orchestrator;

    var onLoadPlayerEvent = new ITE.PubSubStruct();
    this.onTourEndEvent = new ITE.PubSubStruct();

    this.playerParent = container ? container : $("#tagRoot");

    //Start things up
    createITEPlayer(this.playerParent, options)
   /**
    * I/P: {html}     playerParent    to attach ITE player to; defaults to document if nothing is specified
    *      {object}   options         dictionary including what kinds of control the player should have      
    * O/P: {object}   ITEPlayer       a new ITE player object 
    */
    function createITEPlayer(playerParent, options) {
        makeInitialOverlay();
        this.playerConfiguration    = Utils.sanitizeConfiguration(playerConfiguration, options); //replace ones that are listed
        this.playerConfiguration    = playerConfiguration; 
        this.playerParent           = playerParent;
        this.isAuthoring            = options.isAuthoring;
        self.currentVolumeLevel     = playerConfiguration.setInitVolume; // Value between 0 and 1
        self.previousVolumeLevel    = self.currentVolumeLevel;

        //Attaches all necessary UI details of the player including controls to the parentEle

        this.playerParent.append(ITEHolder);

        if (!options.hideControls){
            attachVolume();
            attachPlay();
            attachLoop();
            attachProgressBar();
            attachInfoIcon()
            //attachFullScreen();
            attachProgressIndicator();
        };
        //set initial tour properties: volume, startTime, endTime, loop, play, hideControls
        // Must be able to dynamically resize and position buttons based on screen size, TAG frame size, and number of buttons
    };

    function getOrchestrator() {
        return orchestrator;
    }


    /*
    * I/P:   none
    * show informative popup
    * O/P:   none
    */
    function hideInfoPopup() {
        infoPopup && infoPopup.hide();
    }


    /*
    * I/P:   none
    * show informative popup
    * O/P:   none
    */
    function showInfoPopup() {
        if (!infoPopup) {
            infoPopup = $(document.createElement('div'));
            infoPopup.css({
                'position' : 'absolute',
                'width': '40%',
                'height': '40%',
                'top': "30%",
                'left': '30%',
                'background-color': 'rgba(0,0,0,.6)',
                'border': '4px solid ' + NOBEL_WILL_COLOR,
                'border-radius': '12px',
                'z-index': '10000000000',
                'display' : 'block',
            }).attr({
                id : 'informationPopup'
            })
            ITEHolder.append(infoPopup);
            infoPopup.click(hideInfoPopup);
        }
        pause();
        infoPopup && infoPopup.show();
    }

    /*
    * I/P:   none
    * show overlay when loading into the tour
    * O/P:   none
    */
    function makeInitialOverlay() {
        initialLoading = true;
        initialOverlay = $(TAG.Util.UI.blockInteractionOverlay(1));
        initialOverlay.css('display','block')
        var infoDiv = $(document.createElement('div'));
        infoDiv.css({
            "color": "white",
            "background-color": "transparent",
            "text-align": "center",
            "top": "59%",
            "display": "block",
            "position": "absolute",
            "font-size": "3em",
            "width": '100%',
            "height": "100%"
        })
        infoDiv.text("Loading Tour...");
        TAG.Util.showLoading(initialOverlay, '10%', '42.5%', '45%')//to show the loading screen
        initialOverlay.append(infoDiv);
        $("#ITEContainer").append(initialOverlay);
        initialOverlay.append($("#backButton"));
    }

    /*
    * I/P:   none
    * hide the overlay when loading into the tour
    * O/P:   none
    */
    function hideInitialOverlay() {
        if (initialLoading === true) {
            $("#backButtonContainer").append($("#backButton"));
            initialLoading = false
            TAG.Util.hideLoading(initialOverlay)
            initialOverlay.remove();
        }
    }

    /*
    * I/P:   none
    * Attach information icon 
    * O/P:   none
    */
    function attachInfoIcon() {
        infoAvailableIcon.css({
            'width': '40px',
            'height': '40px',
            'top': '10px',
            'right': '10px',
            'background-color': 'transparent',
            'position': 'absolute',
            'opacity': '.25',
            'z-index' : '1000000099879896789',
        }).attr({
            id : "infoAvailableIcon"
        }).on("click", showInfoPopup);
        infoAvailableIcon.attr({
            src: itePath + "ITE%20Core/ITEManual/ITEPlayerImages/unlit_info.svg"
        })
        ITEHolder.append(infoAvailableIcon);
    }

    /*
    * I/P:   none
    * Attach volume button container and volume button
    * O/P:   none
    */
    function attachVolume() {
        if (playerConfiguration.attachVolume) {
            var volumeContainer = $(document.createElement("div"))
                .addClass("volumeContainer");

            var volumeButtonContainer = $(document.createElement("div"))
                .addClass("volumeButtonContainer");

            volumeButton.addClass("volumeButton")
            .attr("src", itePath + "ITE%20Core/ITEManual/ITEPlayerImages/volume.svg")
            .on("click", toggleMute);

                volumeLevelContainer.addClass("volumeLevelContainer")
                .on({
                    "click": function(e){
                        setVolume(volumeLevelContainer.getVolumeFromMouse(e));
                    },
                    "mousedown": function(e){
                        volumeLevelContainer.dragging = true;
                    },
                    "mouseup": function(e){
                        volumeLevelContainer.dragging = false;
                    },
                    "mousemove": function(e){
                        volumeLevelContainer.dragging ? setVolume(volumeLevelContainer.getVolumeFromMouse(e)) : null
                    }
                });

                volumeLevel = $(document.createElement("div"))
                    .addClass("volumeLevel");

                volumeLevelContainer.getVolumeFromMouse = function (e) {
                    var newVol = ((volumeLevelContainer.offset().top + volumeLevelContainer.height()) - e.pageY) / volumeLevelContainer.height()
                    volumeLevelContainer.css("background-color", "rgba(255,0,0,0)") //TODO
                    //this makes volume increasable for some reason?? 
                    //It seems like if the background is transparent, mouse movements on volumeLevelContainer are subject not to the size/position of volumeLevelContainer,
                    //but instead to those of volumeLevel, which makes absolutely no sense to me but I might be missing something stupid.
                    //Anyway, I'm leaving it out for now but we do need to deal with this (ereif)
                    return newVol
                }

            buttonContainer.append(volumeContainer);
            volumeContainer.append(volumeButtonContainer)
                           .append(volumeLevelContainer);
            volumeButtonContainer.append(volumeButton);
            volumeLevelContainer.append(volumeLevel);
            //move to be next to loop button, which is hard-coded at 50px
            volumeContainer.css('right', $("#tagRoot").width() * 0.03 + 50 + 'px');
        }
        playerConfiguration.setMute ? mute(): unMute()
    };

    /*
    * I/P:   none
    * Attaches play/pause buttons
    * O/P:   none
    */
    function attachPlay() {
        if (playerConfiguration.attachPlay) {

            var playPauseButtonContainer = $(document.createElement("div"))
                .addClass("playPauseButtonContainer");

                playPauseButton.addClass("playPauseButton")
                .attr("src", itePath + "ITE%20Core/ITEManual/ITEPlayerImages/new_play.svg")
                .on("click", togglePlayPause);

            buttonContainer.append(playPauseButtonContainer);
            playPauseButtonContainer.append(playPauseButton);
        }

        playerConfiguration.autoPlay ? play() : null
    };

    /*
    * I/P:   none
    * Attaches loop
    * O/P:   none
    */
    function attachLoop() {
        if (playerConfiguration.attachLoop) {

            var loopButtonContainer = $(document.createElement("div"))
                .addClass("loopButtonContainer");

                loopButton.addClass("loopButton")
                .attr("src", itePath + "ITE%20Core/ITEManual/ITEPlayerImages/loop.svg")
                .on("click", toggleLoop);

            buttonContainer.append(loopButtonContainer);
            loopButtonContainer.append(loopButton);
        }

        playerConfiguration.autoLoop ? loop() : unLoop()
    };

    /*
    * I/P:   none
    * Attaches progress bar
    * O/P:   none
    */
    function attachProgressBar() {
        if (playerConfiguration.attachProgressBar) {
            //For seeking, skipping and scrubbing (on volume as well as time): when you click and drag on the progressbar, you can seek.  But also if you click down and then move your mouse outside of the bar without mousing up it will still seek (mimiking old RIN)
            $( "*" ).on({
                "mouseup": function (e) {
                    //seeking
                    progressBarContainer.dragging ? seek(e) : null
                    progressBarContainer.dragging = false;
                    isSeeking = false;
                    //volume
                    volumeLevelContainer.dragging ? setVolume(volumeLevelContainer.getVolumeFromMouse(e)) : null
                    volumeLevelContainer.dragging = false
                },
                "mousemove": function (e) {
                    //time
                    progressBarContainer.dragging ? scrub(e) : null
                    //volume
                    volumeLevelContainer.dragging ? setVolume(volumeLevelContainer.getVolumeFromMouse(e)) : null
                }
            })

            var progressBarContainer = $(document.createElement("div"))
                .addClass("progressBarContainer")
                .on({
                    "mouseup": function (e) {
                        seek(e);
                        isSeeking = false;
                    },
                    "mousedown": function (e) {
                        scrub(e);
                        progressBarContainer.dragging = true;
                        isSeeking = true;
                    }
                })
            .css({
                "background-color": "black" });

            progressBar.addClass("progressBar")

            bottomContainer.append(progressBarContainer);
            progressBarContainer.append(progressBar);
        }
    };

    /*
    * I/P:   none
    * Attaches progress indicator
    * O/P:   none
    */
    function attachProgressIndicator() {
        if (playerConfiguration.attachProgressIndicator) 
        {
            var ProgressIndicatorContainer = $(document.createElement("div"))
                .addClass("progressIndicatorContainer");
            progressIndicator.addClass("progressIndicator"); 
            buttonContainer.append(ProgressIndicatorContainer);
            ProgressIndicatorContainer.append(progressIndicator);
            //adjust right positioning
            ProgressIndicatorContainer.css({ 'right': $("#tagRoot").width()*0.04 + 100 + 'px' });
            updateProgressIndicator(orchestrator.getElapsedTime());
        }
    };

    function tourOver(sec) {
        if (sec > totalTourDuration && !isSeeking) 
        {
            if (isLooped)
            {
                orchestrator.seek(0)
            } else if (!isAuthoring) {
                tourPlayer.goBack();
                isUnloaded = true;
            }
        }
    }
     /*
    * I/P:   sec (int-- a time in sec)
    * called by updateProgressIndicator function to stringify the times
    * O/P:   string version of the time in seconds passed in
    */
    function makeTimeString(time){
        time = Math.floor(time);
        if (time>totalTourDuration){
            return makeTimeString(totalTourDuration);
        }
        if (time == 0){
            return ("0:00");
        }
        s = String(time%60);
        if (time%60<10){
            s = "0"+s
        }
        return String(Math.floor(time/60))+":"+s;
    }
     /*
    * I/P:   integer time in sec
    * updates the progress bar with the given time
    * O/P:   none
    */
    
    function updateProgressBar(sec){
        progressBar.css({
            width : (sec/totalTourDuration)*ITEHolder.width()
        });
    }
    
    /*
    * I/P:   sec (int-- a time in sec)
    * called by timeManager and Orchestrator; updates current displayed time
    * O/P:   none
    */
    
    function updateProgressIndicator(sec) {
        progressIndicator.empty();
        var timeString = makeTimeString(sec) + " / "+makeTimeString(totalTourDuration);
        progressIndicator.append(timeString);
        updateProgressBar(sec);
        if (!isAuthoring) {
            tourOver(sec);
        }   
        if (!isUnloaded){
            window.setTimeout(function(){
                updateProgressIndicator(orchestrator.getElapsedTime());
            },100); 
        }
    };
    /*
    * I/P:   none
    * Attaches full screen
    * O/P:   none
    */
    function attachFullScreen() {
        if (playerConfiguration.attachFullScreen) {

            var fullScreenButtonContainer = $(document.createElement("div"))
                .addClass("fullScreenButtonContainer");

            fullScreenButton.addClass("fullScreenButton")
            .attr("src", itePath + "ITE%20Core/ITEManual/ITEPlayerImages/fullscreen.svg")
            .on("click", toggleFullScreen);

            buttonContainer.append(fullScreenButtonContainer);
            fullScreenButtonContainer.append(fullScreenButton);
        }

        //If player configuration's default is to full screen, set full screen
        playerConfiguration.setFullScreen ? enableFullScreen() : disableFullScreen()
    };

//Public functions used to interface with TAG Authoring and Kiosk

    function load(tourData) {
        orchestrator.load(tourData);
        //progressIndicator.append(tourData.totalDuration)
        totalTourDuration = tourData.totalDuration;
        updateProgressIndicator(0);

        playerParent.mousemove(function () {
            volumeButton.stop();
            volumeLevel.stop();
            playPauseButton.stop();
            loopButton.stop();
            progressBar.stop();
            fullScreenButton.stop();
            progressIndicator.stop();
            $("#backButton").stop();
            $("#linkButton").stop();
        });
        bottomContainer.mouseleave(function () {
            setControlsFade();
        })
        bottomContainer.mouseenter(function () {
            makeControlsVisible();
        })
        $("#backButton").mouseenter(function () {
            makeControlsVisible();
        })
        $("#backButton").mouseleave(function () {
            setControlsFade();
        })
        
        orchestrator.refresh();
    };

    function refresh() {
        orchestrator.refresh();
    }

    function updateInkPositions() {
        orchestrator.updateInkPositions();
    }

    function unload() {
        orchestrator.unload();
    };
	
    /*
    * I/P:   trackID		track from which to capture a keyframe
    * Captures and returns a keyframe
    * Used in Authoring
    * O/P:   none
    */ 
    function captureKeyframe(trackID) {
        return orchestrator.captureKeyframe(trackID);
    };

    function getTime() {
        return orchestrator.getElapsedTime();
    }


/*
* PLAYER CONTROLS
* For manipulation of player controls with which user interacts
*/

// PLAY & PAUSE & SEEK

    /*
    * I/P:   none
    * Toggles between play and pause
    * O/P:   none
    */
    function togglePlayPause() {
        (orchestrator.status === 1) ? pause() : play()
    };

    /*
    * I/P:   none
    * Starts tour from the beginning or from a resumed spot
    * O/P:   none
    */
    function play() {
        hideInfoPopup()
        if (initialLoading === true) {
            hideInitialOverlay();
        }
        orchestrator.play();
        playPauseButton.attr("src", itePath + "ITE%20Core/ITEManual/ITEPlayerImages/new_pause.svg");
       setControlsFade();
    };

    /*
    * I/P:   none
    * clears the timeout to make the controls invisible and also removes the handlers that set the fading timeout again
    * O/P:   none
    */

    function clearControlsTimeout() {
        doNothing("controls timeout clear called")
        if (controlsTimeout) {
            window.clearTimeout(controlsTimeout);
        }
        $("#backButton").off('mouseleave');
        bottomContainer.off('mouseleave');
    }
    /*
    * I/P:   none
    * Sets the buttons to fade in 2 seconds from function call
    * O/P:   none
    */
    function setControlsFade() {
        doNothing("set controls fade called")
        if (playerConfiguration.fadeControls) {
            controlsTimeout = window.setTimeout(function () {
                time = 500
                volumeButton.fadeTo(time,0,null);
                volumeLevel.fadeTo(time,0,null);
                playPauseButton.fadeTo(time,0,null);
                loopButton.fadeTo(time,0,null);
                progressBar.fadeTo(time,0,null);
                fullScreenButton.fadeTo(time,0,null);
                progressIndicator.fadeTo(time,0,null);
                $("#backButton").fadeTo(time,0,null);
                $("#linkButton").fadeTo(time,0,null);
            },2000)
       }
    }

    /*
    * I/P:   none
    * Makes the controls/buttons visible and cancels timeouts making them dissappear
    * O/P:   none
    */
    function makeControlsVisible() {
        doNothing("make controls visible called")
        volumeButton.css({ 'opacity' : 1 })
        volumeLevel.css({ 'opacity' : 1 })
        playPauseButton.css({ 'opacity' : 1 })
        loopButton.css({ 'opacity' : 1 })
        progressBar.css({ 'opacity' : 1 })
        fullScreenButton.css({
            'opacity': 1,
            'display': 'none',//because we want to hide the full screen button for now
            'disabled': true
        })
        progressIndicator.css({ 'opacity' : 1 })
        $("#backButton").css({ 'opacity' : 1 })
        $("#linkButton").css({ 'opacity' : 1 })
        isMuted ? mute()   : unMute()
        isFullScreen ? enableFullScreen() : disableFullScreen()
        isLooped ? loop() : unLoop()
    }

    /*
    * I/P:   none
    * Pauses tour
    * O/P:   none
    */
    function pause() {
        orchestrator.pause();
        playPauseButton.attr("src", itePath + "ITE%20Core/ITEManual/ITEPlayerImages/new_play.svg");
        makeControlsVisible();
    };

    /*
    * I/P:   none
    * Seeks tour to a specfied spot, without playing it. 
    * This is designed to be called as the user drags on the progress bar.
    * O/P:   none
    */
    function scrub(evt) {
        if (playerConfiguration.allowSeek){
            progressBar.css({
                width : evt.pageX - ITEHolder.offset().left
            })
            timeOffset = progressBar.width()/(progressBar.parent().width()) //timeOffset is currently a percentage of the total time
            orchestrator.scrub(timeOffset);
        }
    };

    function scrubTimeline(pct) {
        orchestrator.seek(pct);
    }

    /*
    * I/P:   none
    * Seeks tour to a specfied spot, then continue playing (if previously playing).
    * This is designed to be called when the user mouseups on the progress bar at a new time.
    * O/P:   none
    */
    function seek(e) {
        if (playerConfiguration.allowSeek) {
            progressBar.css({
                width : e.pageX - ITEHolder.offset().left
            })
            timeOffset = progressBar.width()/(progressBar.parent().width()) //timeOffset is currently a percentage of the total time
            orchestrator.seek(timeOffset);
        }
    };


//VOLUME & MUTE

    /*
    * I/P:   volumeLevel	updated volume level
    * O/P:   none
    */ 
    function setVolume(newVolume) {
        newVolume > 1 ? newVolume = 1 : null
        newVolume <=0 ? newVolume = 0 : null

        if (isMuted){
            unMute();
        }
        volumeLevel.css({
            height : newVolume * 100 + "%"
        });
        volumeButton.attr("src", itePath + "ITE%20Core/ITEManual/ITEPlayerImages/volume.svg");
        self.previousVolumeLevel = self.currentVolumeLevel   // Reference to previous volume level for volume control in video/audio tracks
        self.currentVolumeLevel = newVolume;
        orchestrator.setVolume(self.currentVolumeLevel);
    };

    /*
    * I/P:   none
    * Toggles mute
    * O/P:   none
    */ 
    function toggleMute() {
        isMuted ? unMute()   : mute()
    };

    /*
    * I/P:   none
    * Sets mute to be true and changes UI accordingly
    * O/P:   none
    */ 
    function mute(){
        isMuted = true;
        volumeButton.attr("src", itePath + "ITE%20Core/ITEManual/ITEPlayerImages/volume0.svg")
        volumeButton.css("opacity" , ".5")
        volumeLevel.css("opacity" , "0")
        orchestrator.toggleMute(true);
    }

    /*
    * I/P:   none
    * Sets mute to be true and changes UI accordingly
    * O/P:   none
    */ 
    function unMute(){
        isMuted = false;
        volumeButton.attr("src", itePath + "ITE%20Core/ITEManual/ITEPlayerImages/volume.svg");
        volumeButton.css("opacity" , "1");
        volumeLevel.css("opacity" , "1")
        orchestrator.toggleMute(false);
    }

//FULL SCREEN
   /**
    * I/P:  none
    * Toggles full screen
    * O/P:  none
    */ 
    function toggleFullScreen() {
        //
        isFullScreen ? disableFullScreen() : enableFullScreen()
    };

   /**
    * I/P:    none
    * Sets fullscreen and changes UI accordingly
    * O/P:    none
    */ 
    function enableFullScreen() {
        isFullScreen = true;
        fullScreenButton.css("opacity" , "1")
        // requestFullScreen($('#ITE')[0])
    };

//TODO: implement this more fully at a later date-- we will need to:
    //a) reset the canvas size
    //b) reparse the keyframes (they're currently parsed based on the size of the ITE holder when the tour is loaded, so we'd have to reparse them to get the new correct sizes.)
// function requestFullScreen(element) {
//     // Supports most browsers and their versions.
//     var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullscreen;
//     if (requestMethod) { // Native full screen.
//             doNothing("requesting full screen")
//         requestMethod.call(element);
//     } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
//         var wscript = new ActiveXObject("WScript.Shell");
//         if (wscript !== null) {
//             wscript.SendKeys("{F11}");
//         }
//     }
// }

   /**
    * I/P:    none
    * Removes fullscreen and changes UI accordingly
    * O/P:    none
    */ 
    function disableFullScreen() {
        isFullScreen = false;
        fullScreenButton.css("opacity" , ".5")
    };


// LOOP
   /**
    * I/P:	none
    * Toggles whether or not the play is in loop
    * O/P:	none
    */ 
    function toggleLoop() {
        isLooped ? unLoop() : loop()
    };

   /**
    * I/P:    none
    * Sets tour to loop and changes UI accordingly
    * O/P:    none
    */ 
    function loop() {
        isLooped = true;
        loopButton.css("opacity" , "1")
    };

   /**
    * I/P:    none
    * Sets tour to not be in loop and changes UI accordingly
    * O/P:    none
    */ 
    function unLoop() {
        isLooped = false;
        loopButton.css("opacity" , ".5")
    };

    /**
     * I/P: 
     * Checks if tour is over
     * O/P: 
     *
    */
    /*function tourIsOver() {

    }*/


    /**
    * I/P:    none
    * returns holder (used for transitioning into tour player)
    * O/P:    root of the ITE player
    */ 
    function getRoot() {
        return ITEHolder
    };


////////////////////////////////////////////////////////////////////////////
// AUTHORING API
////////////////////////////////////////////////////////////////////////////

    function bindCaptureHandlers(handlers) {
        orchestrator.bindCaptureHandlers(handlers);
    }

    /**
    * I/P:    A track to which a keyframe will be added at the current state
    * Creates a keyframe based on the current state of the track
    * O/P:    none
    */ 
    function addKeyframe(track) {
        orchestrator.captureKeyframe(track)
    }

    function captureKeyframe(title) {
        return orchestrator.captureKeyframeFromTitle(title);
    }

    /**
    * I/P:    A track and a keyframe within the track to change
    * Changes a keyframe from the old state to the new state
    * O/P:    none
    */ 
    function changeKeyframe(track, oldKeyFrame, newKeyFrame) {
        orchestrator.changeKeyframe(track, oldKeyFrame, newKeyFrame)
    }

    /**
    * I/P:    A track and a keyframe within the track to delete
    * Deletes said keyframe
    * O/P:    none
    */ 
    function removeKeyframe(track, keyframe) {
        orchestrator.deleteKeyframe(track, oldKeyFrame)
    }

    /**
    * I/P:    track to be deleted
    * Deletes a track
    * O/P:    none
    */ 
    function deleteTrack(track) {
        orchestrator.deleteTrack(track)
    }

    /**
    * I/P:    track and the new index/layer where it should be, with regards to the rest of the tracks (for example, adding one to the top of the list would be an index of)
    * Mutates time of a track
    * O/P:    none
    */ 
    function changeTrackZIndex(track, index){
        if (index > trackManager.length - 1){
            doNothing("ERROR: trying to change index of a track to an index that does not exist")
            return
        }
        trackManger = self.getTracks();
        var i = trackManager.indexOf(track);
        //If desired index is less than current index, keep switching down until you get to the desired index
        while (index < i){
            var temp = trackManager[i - 1];
            trackManager[i - 1] = trackManager[i];
            trackManager[i] = temp
            i--;
        }
        //If the desired index is greater than the current index, switch up
        while (index > i){
            var temp = trackManager[i + 1];
            trackManager[i + 1] = trackManager[i];
            trackManager[i] = temp
            i++;
        }
        orchestrator.updateZIndices();
    }



    /**
    * I/P:    none
    * returns tracks, used for authoring
    * O/P:    trackManager of the orchestrator (list of tracks)
    */ 
    function getTracks(){
        return orchestrator.getTrackManager()
    }

    /**
    * I/P:    trackData-- data object with all the properties of the specific track. See TAG.Utils.RIN_TO_ITE function for a template.
    * Adds a track, used for tour authoring
    * O/P:    said added track
    */ 
    function addTrack(trackData){
        track = orchestrator.createTrackByProvider(trackData)
        track.createDefaultKeyframes()
        orchestrator.initializeTrack(track)
        track.load()
        return track
    }

    function setInfoTrack(z, bool){
        if (z > -1) {
            var doq = getDoqFromZIndex(z);
            if (doq !== null) {
                if (bool === true) {
                    if (infoTracksVisible.indexOf(z) === -1) {
                        infoTracksVisible.push(z);
                    }
                }
                else {
                    var index = infoTracksVisible.indexOf(z)
                    if (index > -1) {
                        var n = []
                        for (var i = 0; i < infoTracksVisible.length; i++) {
                            if (infoTracksVisible[i] !== z) {
                                n.push(infoTracksVisible[i])
                            }
                        }
                        infoTracksVisible = n;
                    }
                }
                updateInfoVisible();
            }
        }
    }

    function updateInfoVisible() {
        if (infoTracksVisible.length > 0) {
            setInfoAvailable(true);
        }
        else {
            setInfoAvailable(false);
        }

    }

    function setInfoAvailable(yes) {
        if (yes === true) {
            infoAvailableIcon.attr({
                src: itePath + "ITE%20Core/ITEManual/ITEPlayerImages/lit_info.svg"
            })
            infoAvailableIcon.css({
                'opacity' : '1'
            })
            
        }
        else {
            infoAvailableIcon.attr({
                src: itePath + "ITE%20Core/ITEManual/ITEPlayerImages/unlit_info.svg"
            })
            infoAvailableIcon.css({
                'opacity': '.25'
            })
        }
    }





    function updateManipObjectZ(z) {
        if (z === -1) {
            if (infoPaneOut === true) {
                hideInfoPane(makePaneVisible(false));
            }
            else {
                makePaneVisible(false);
            }
            return;
        }
        var doq = getDoqFromZIndex(z);
        if (doq !== null) {
            updateInfoPane(doq);
        }
        else {
            hideInfoPane();
            makePaneVisible(false);
        }
    }
    function createSlidingPane() {
        var pane = $(document.createElement('div'));
        var title = $(document.createElement('div'));
        var tab = $(document.createElement('div'));
        var tabImg = $(document.createElement('img'));
        var infoBlock = $(document.createElement('div'));
        var topRight = $(document.createElement('div'));
        var bottomRight = $(document.createElement('div'));
        var outBottom = $(document.createElement('div'));
        var outTop = $(document.createElement('div'));
        topRight.css({
            'position' : 'absolute',
            'border-top-right-radius': '12px',
            'border-right': '2px solid '+NOBEL_WILL_COLOR,
            'border-top': '2px solid '+NOBEL_WILL_COLOR,
            'width': '2%',
            'height': '2%',
            'right': '-2px',
            'top' : '-2px'
        })
        outTop.css({
            'position': 'absolute',
            'border-left': ('2px solid '+NOBEL_WILL_COLOR),
            'width': '2%',
            'height': '42%',
            'left': '100%',
            'top': '2%'
        })
        bottomRight.css({
            'position': 'absolute',
            'border-bottom-right-radius': '12px',
            'border-right': '2px solid '+NOBEL_WILL_COLOR,
            'border-bottom': '2px solid '+NOBEL_WILL_COLOR,
            'width': '2%',
            'height': '2%',
            'right': '-2px',
            'bottom': '-2px'
        })
        outBottom.css({
            'position': 'absolute',
            'border-left': '2px solid '+NOBEL_WILL_COLOR,
            'width': '2%',
            'height': '41.9%',
            'left': '100%',
            'bottom': '2%'
        })
        infoBlock.css({
            'position': 'absolute',
            'height': '90%',
            'z-index': '9999999999',
            'top': '10%',
            'width': '90%',
            'left': '5.5%',
            'background-color': 'transparent',
            'color': 'white',
            'font-size': '.9em',
            'overflow': "auto",
            'text-align': 'left',
            'scrollbar-face-color': NOBEL_WILL_COLOR,
            'scrollbar-arrow-color': 'transparent',
            'scrollbar-track-color': NOBEL_WILL_COLOR,
        }).attr('id', 'infoBlock');
        tabImg.attr({
            src: itePath + "ITE%20Core/ITEManual/ITEPlayerImages/Open.svg",
            id : 'tabImg'
        })
        //tabImg.click(toggleInfoPane);
        tabImg.css({
            'position': 'absolute',
            'height': '80%',
            'width': '80%',
            'left': '10%',
            'top' : '10%',
            'z-index': '9999999',
        })
        pane.css({
            'position': 'absolute',
            'height': '70%',
            'top' : '12%',
            'width':'26%',
            'background-color': 'rgba(0,0,0,.6)',
            'z-index': '9999999',
            'border-top-right-radius': '12px',
            'border-bottom-right-radius': '12px',
            'border-bottom': '2px solid '+NOBEL_WILL_COLOR,
            'border-top': '2px solid '+NOBEL_WILL_COLOR,
            //'border' : '2px solid rgb(254,161,0)',
            'left' : '-26.1%'
        })
        pane.attr({
            id : 'infoPaneDiv'
        })
        title.css({
            'position': 'absolute',
            'top' : '1%',
            'height': '8%',
            'width': '94%',
            'left' : '6%',
            'background-color': 'transparent',
            'color': 'white',
            'font-size': '1.25em',
            'white-space' : 'nowrap',
            'font-weight': 'bold',
            'text-overflow': 'ellipsis',
            'overflow' : 'hidden',
            'z-index': '9999999',
            'font-family' : 'Cinzel',
        })
        tab.css({
            'position': 'absolute',
            'height': '12%',
            'width': '8.5%',
            'background-color': NOBEL_WILL_COLOR,
            'border-top-right-radius': '12px',
            'border-bottom-right-radius': '12px',
            'left': '100%',
            'border-bottom': '2px solid '+NOBEL_WILL_COLOR,
            'border-top': '2px solid '+NOBEL_WILL_COLOR,
            'border-right': '2px solid '+NOBEL_WILL_COLOR,
            'border-left-style': 'none',
            //'border': '2px solid rgb(254,161,0)',
            'z-index': '9999999',
            'top': '44%'
        }).click(toggleInfoPane)
        title.attr({
            id : 'infoPaneTitleDiv'
        })
        tab.attr({
            id:'infoPaneTab'
        })
        tab.append(tabImg);
        pane.append(tab);
        pane.append(outTop);
        pane.append(topRight);
        pane.append(outBottom);
        pane.append(bottomRight);
        pane.append(infoBlock);
        pane.append(title);
        $("#ITEContainer").append(pane);
        pane.hide();
    }
    function toggleInfoPane() {
        if (infoPaneOut === true) {
            hideInfoPane();
        }
        else if(infoPaneOut === false){
            showInfoPane();
        }
    }
    function updateInfoPane(doq) {
        makePaneVisible(true);
        $(".infoPaneInfoField").remove();
        if (doq.Metadata.InfoFields && doq.Metadata.InfoFields.Name) {
            $("#infoPaneTitleDiv").text(doq.Metadata.InfoFields.Name);
        }
        else {
            $("#infoPaneTitleDiv").text(doq.Metadata.Name || "");
        }
        var top = 0;

        var special = ['Category', 'Year of Award', 'Gender','Citizenship 1','Citizenship 2'];
        var keys = Object.keys(doq.Metadata.InfoFields);

        for (var i = 0; i < special.length; i++) {
            if (doq.Metadata.InfoFields[special[i]]) {
                var d = makeInfoField(doq.Metadata.InfoFields[special[i]],true).css('top', top + 'px');
                $("#infoBlock").append(d);
                top += d.height() + 10;
            }
        }

        if (doq.Metadata.Description) {
            var d = makeInfoField("Description: " + doq.Metadata.Description).css('top', top + 'px');
            $("#infoBlock").append(d);
            top += d.height() + 10;
        }
        if (doq.Metadata.Artist) {
            var d = makeInfoField("Artist: " + doq.Metadata.Artist).css('top', top + 'px');
            $("#infoBlock").append(d);
            top += d.height() + 10;
        }
        if (doq.Metadata.Date) {
            var d = makeInfoField("Date: " + doq.Metadata.Date).css('top', top + 'px');
            $("#infoBlock").append(d);
            top += d.height() + 10;
        }

        for (var key = 0; key < keys.length; key++) {
            var val = doq.Metadata.InfoFields[keys[key]];
            var d;
            if (special.indexOf(keys[key]) === -1) {
                d = makeInfoField(keys[key] + ": " + val).css('top', top + 'px');
                $("#infoBlock").append(d);
                top += d.height() + 10;
            }
        }
    }
    function makePaneVisible(b) {
        if (b === true) {
            $("#infoPaneDiv").show();
        }
        else if (b === false) {
            $("#infoPaneDiv").hide();
        }
    }
    function showInfoPane(callback){
        infoPaneOut = true;
        $("#infoPaneDiv").animate({ left: '-1%' }, 1000, 'easeInOutQuart', callback ? function () {
            callback(),
            $("#tabImg").attr('src', itePath + "ITE%20Core/ITEManual/ITEPlayerImages/Close.svg")
            $("#infoPaneTab").css({
                'background-color': 'rgba(0,0,0,.6)',
                'border-right': '2px solid '+NOBEL_WILL_COLOR,
                'border-top': '2px solid '+NOBEL_WILL_COLOR,
                'border-bottom': '2px solid '+NOBEL_WILL_COLOR,
            })
        } : function () {
            $("#tabImg").attr('src', itePath + 'ITE%20Core/ITEManual/ITEPlayerImages/Close.svg');
            $("#infoPaneTab").css({
                'background-color': 'rgba(0,0,0,.6)',
                'border-right': '2px solid '+NOBEL_WILL_COLOR,
                'border-top': '2px solid '+NOBEL_WILL_COLOR,
                'border-bottom': '2px solid '+NOBEL_WILL_COLOR,
            })
        })
        
    }
    function hideInfoPane(callback){
        infoPaneOut = false;
        $("#infoPaneDiv").animate({ left: '-26.1%' }, 500, 'easeInOutQuart', callback ? function () {
            callback(),
            $("#tabImg").attr('src', itePath + "ITE%20Core/ITEManual/ITEPlayerImages/Open.svg")
            $("#infoPaneTab").css({
                'background-color': NOBEL_WILL_COLOR,
                'border-right': '2px solid '+NOBEL_WILL_COLOR,
                'border-top': '2px solid '+NOBEL_WILL_COLOR,
                'border-bottom': '2px solid '+NOBEL_WILL_COLOR,
            })
        } : function () {
            $("#tabImg").attr('src', itePath + "ITE%20Core/ITEManual/ITEPlayerImages/Open.svg")
            $("#infoPaneTab").css({
                'background-color': NOBEL_WILL_COLOR,
                'border-right': '2px solid '+NOBEL_WILL_COLOR,
                'border-top': '2px solid '+NOBEL_WILL_COLOR,
                'border-bottom': '2px solid '+NOBEL_WILL_COLOR,
            })
        })
        

    }

    function makeInfoField(text, special) {
        var outer = $(document.createElement('div'));
        outer.attr({
            class: 'infoPaneInfoField'
        })
        if (special === true) {
            outer.css({
                'position': 'absolute',
                'z-index': '9999999999',
                'width': '90%',
                'left': '0%',
                'background-color': 'transparent',
                'color': 'rgb(254,161,0)',
                'font-size': '1.05em',
                'text-align': 'left',
                'font-weight' : 'bold'
            });
        }
        else{ 
            outer.css({
                'position': 'absolute',
                'z-index': '9999999999',
                'width': '90%',
                'left': '0%',
                'background-color': 'transparent',
                'color': 'white',
                'font-size': '.9em',
                'text-align': 'left'
            });
        }
        outer.text(text);
        return outer;
    }



    function getDoqFromZIndex(z) {
        if (data[z-1]!==false) {
            return data[z-1];
        }
        return null;
    }


    this.getTracks          = getTracks;
    this.addKeyframe        = addKeyframe;
    this.changeKeyframe     = changeKeyframe;
    this.removeKeyframe     = removeKeyframe;
    this.deleteTrack        = deleteTrack;
    this.changeTrackZIndex  = changeTrackZIndex;
    this.getRoot            = getRoot;
    this.getTime            = getTime;
    this.togglePlayPause    = togglePlayPause;
    this.play               = play;
    this.pause              = pause;
    this.seek               = seek;
    this.scrubTimeline      = scrubTimeline;
    this.load               = load;
    this.unload             = unload;
    this.captureKeyFrame    = captureKeyframe;
    this.setVolume          = setVolume;
    this.toggleMute         = toggleMute;
    this.toggleLoop         = toggleLoop;
    this.toggleFullScreen   = toggleFullScreen;
    this.timeOffset         = timeOffset;
    this.isMuted            = isMuted;
    this.isLooped           = isLooped;
    this.isFullScreen       = isFullScreen;
    this.updateProgressIndicator = updateProgressIndicator;
    this.setControlsFade    = setControlsFade;
    this.makeControlsVisible = makeControlsVisible;
    this.refresh = refresh;
    this.captureKeyframe = captureKeyframe;
    this.bindCaptureHandlers = bindCaptureHandlers;
    this.getOrchestrator = getOrchestrator;
    this.updateInkPositions = updateInkPositions;
    this.clearControlsTimeout = clearControlsTimeout;
    this.updateManipObjectZ = updateManipObjectZ;
    this.setInfoTrack = setInfoTrack;
};
window.ITE = window.ITE || {};

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
             hideControls: true,
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
         root = TAG.Util.getHtmlAjax('TourPlayer.html'),
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
       NOBEL_WILL_COLOR = '#"D99B3B',
       slidingPane = createSlidingPane(),
       infoTracksVisible = [],
       initialOverlay,
       initialLoading = true,
       infoPopup,
       cancelEntirely = false,


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
        infoAvailableIcon.css({
            "height": "80px",
            "width": "auto",
            "position": "absolute",
            "top": "20px",
            "right": "20px",
            "z-index": "0099999",
            "opacity" : "0"
        })
        infoAvailableIcon.attr({
            src: itePath + "ITE Core/ITEManual/ITEPlayerImages/tour_interaction.png"
        })
        $("#ITEContainer").append(infoAvailableIcon)
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
            //attachInfoIcon()
            //attachFullScreen();
            attachProgressIndicator();
        };

        hideControls();
        //set initial tour properties: volume, startTime, endTime, loop, play, hideControls
        // Must be able to dynamically resize and position buttons based on screen size, TAG frame size, and number of buttons
    };

    function getOrchestrator() {
        return orchestrator;
    }


    /*
    * I/P:   none
    * cancels if back button pressed while loading
    * O/P:   none
    */
    function cancelLoad() {
        cancelEntirely = true;
        if (orchestrator) {
            orchestrator.cancelLoad();
        }
    }

    
    /*
    * I/P:   none
    * hide the overlay when loading into the tour
    * O/P:   none
    */
    function hideInitialOverlay() {
        tourPlayer.hideInitialOverlay()
    }

    /*
    * I/P:   none
    * Attach volume button container and volume button
    * O/P:   none
    */
    function attachVolume() {
        return
        if (playerConfiguration.attachVolume) {
            var volumeContainer = $(document.createElement("div"))
                .addClass("volumeContainer");

            var volumeButtonContainer = $(document.createElement("div"))
                .addClass("volumeButtonContainer");

            volumeButton.addClass("volumeButton")
            .attr("src", itePath + "ITE Core/ITEManual/ITEPlayerImages/volume.svg")

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

            volumeButton.on({
                "click": function(e){
                    toggleMute();
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
                .attr("src", itePath + "ITE Core/ITEManual/ITEPlayerImages/new_play.svg")
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
        return;
        if (playerConfiguration.attachLoop) {

            var loopButtonContainer = $(document.createElement("div"))
                .addClass("loopButtonContainer");

                loopButton.addClass("loopButton")
                .attr("src", itePath + "ITE Core/ITEManual/ITEPlayerImages/loop.svg")
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
            width : (sec/totalTourDuration)*($('.progressBarContainer').width())
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
        return;
        if (playerConfiguration.attachFullScreen) {

            var fullScreenButtonContainer = $(document.createElement("div"))
                .addClass("fullScreenButtonContainer");

            fullScreenButton.addClass("fullScreenButton")
            .attr("src", itePath + "ITE Core/ITEManual/ITEPlayerImages/fullscreen.svg")
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
        volumeButton.mouseleave(function () {
            //volumeLevel.fadeTo(500, 0, null);
        })
        volumeButton.mouseenter(function () {
            //makeControlsVisible();
        })
        $("#backButton").mouseenter(function () {
            makeControlsVisible();
        })
        $("#backButton").mouseleave(function () {
            //setControlsFade();
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

    function makeTitleSlide() {
        var tourName = tourPlayer.iteTour.guid;
        var titleSlide = $(document.createElement('img'));
        var imgPath;

        switch (tourName.toLowerCase()) {
            case 'will':
                imgPath = tagPath + 'images/title_will.png'
                break;
            case 'fromwilltoprize':
                imgPath = tagPath + 'images/title_prize.png'
                break;
            case 'family':
                imgPath = tagPath + 'images/title_family.png'
                break;
            case 'homes':
                imgPath = tagPath + 'images/title_homes.png'
                break;
            case 'factories':
                imgPath = tagPath + 'images/title_factories.png'
                break;
        }
        titleSlide.attr('src', imgPath);
        var titleDiv = $(document.createElement('div'));
        titleDiv.append(titleSlide);
        tourPlayer.getInitialOverlay().append(titleDiv);
        titleDiv.css({
            'height': '100%',
            'width': '100%'
        });
        titleSlide.css({
            'height': '100%',
            'width': '100%'
        });
        titleSlide.attr('id', 'titleSlide');
    }
    /*
    * I/P:   none
    * Starts tour from the beginning or from a resumed spot
    * O/P:   none
    */
    function play() {
        if (!cancelEntirely) {
            if (initialLoading === true) {
                setTimeout(function () {
                    /*
                    //makeTitleSlide();
                    var hugeVidOverlay = $(document.createElement('div')).attr({id:"videoOverlay"})
                    var vid = $(document.createElement('video')).attr({ id: "videoOverlayVideo", src: itePath + "ITE Core/ITEManual/ITEPlayerImages/NW_instruction_video.mp4" })
                    var css = {
                        "width": "100%",
                        "height": "100%",
                        "position": "absolute",
                        "z-index": "42314431322341324"
                    }
                    var backimg = $(document.createElement("img")).attr({ src: itePath + "ITE Core/ITEManual/ITEPlayerImages/Back.png" })
                    backimg.css({
                        "width": "100%",
                        "position": "absolute"
                    })
                    var back = $(document.createElement('div'))
                    back.click(function () {
                        back.css({"background-color":"rgba(255,255,255,.25)"})
                        tourPlayer.goBack();
                    }).append(backimg).mouseup(function () { back.css({ "background-color": "transparent" }) })
                    back.css({
                        "width": "7.5%",
                        "position": "absolute",
                        "z-index": "500",
                        "height" : "50px"
                    })
                    vid.css(css).css({ "z-index": "1" })
                    hugeVidOverlay.css(css).append(back)
                    hugeVidOverlay.css({"background-color":"black"})
                    vid[0].play()
                    hugeVidOverlay.append(vid)
                    $("#ITEContainer").append(hugeVidOverlay)
                    vid.bind("ended", function () {
                        $("#videoOverlay").remove().die()
                        $("#videoOverlayVideo").remove().die()
                        setTimeout(function(){
                            hideInitialOverlay();
                            attachVolume();
                            attachPlay();
                            attachLoop();
                            attachProgressBar();
                            attachProgressIndicator();
                            playPauseButton.attr("src", itePath + "ITE Core/ITEManual/ITEPlayerImages/new_pause.svg");
                            hideInfoPane();
                            setControlsFade();
                            orchestrator.play();
                            mute()
                            setTimeout(function () { orchestrator.pause(); orchestrator.play(); }, 50)
                            setTimeout(function () {
                                orchestrator.seek(orchestrator.getElapsedTime() / orchestrator.tourData.totalDuration, true)
                                unMute()
                                tourPlayer.getInitialOverlay().fadeTo(1000, 0, function () { tourPlayer.getInitialOverlay().remove(); });
                            }, 75);
                        },100)
                    });
                    */
                    setTimeout(function () {
                        hideInitialOverlay();
                        attachVolume();
                        attachPlay();
                        attachLoop();
                        attachProgressBar();
                        attachProgressIndicator();
                        playPauseButton.attr("src", itePath + "ITE Core/ITEManual/ITEPlayerImages/new_pause.svg");
                        hideInfoPane();
                        setControlsFade();
                        orchestrator.play();
                        mute()
                        setTimeout(function () { orchestrator.pause(); orchestrator.play(); }, 50)
                        setTimeout(function () {
                            orchestrator.seek(orchestrator.getElapsedTime()/orchestrator.tourData.totalDuration,true)
                            unMute()
                            tourPlayer.getInitialOverlay().fadeTo(1000, 0, function () { tourPlayer.getInitialOverlay().remove(); });
                        },75);
                    }, 5000);
                }, 1);
                return;
            }
            orchestrator.play();
            playPauseButton.attr("src", itePath + "ITE Core/ITEManual/ITEPlayerImages/new_pause.svg");
            hideInfoPane();
            setControlsFade();
        }
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
        //$("#backButton").off('mouseleave');
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
                volumeButton.fadeTo(time,0.5,null);
                volumeLevel.fadeTo(time, 0, null);
                $('.volumeLevelContainer').fadeTo(time, 0, null);
                playPauseButton.fadeTo(time,0.5,null);
                loopButton.fadeTo(time,0.5,null);
                progressBar.fadeTo(time,0.5,null);
                fullScreenButton.fadeTo(time,0.5,null);
                progressIndicator.fadeTo(time,0.5,null);
                $("#linkButton").fadeTo(time,0.5,null);
                $('.progressBarContainer').fadeTo(time,0.5,null);
            },2000)
       }
    }

    function hideControls()
    {
        volumeButton.css({ 'opacity': 0 })
        volumeLevel.css({ 'opacity': 0 })
        playPauseButton.css({ 'opacity': 0 })
        loopButton.css({ 'opacity': 0 })
        progressBar.css({ 'opacity': 0 })
        fullScreenButton.css({
            'opacity': 0,
            'display': 'none',//because we want to hide the full screen button for now
            'disabled': true
        })
        progressIndicator.css({ 'opacity': 0 })
        $("#backButton").css({ 'opacity': 0 })
        $("#linkButton").css({ 'opacity': 0 })
        $('.progressBarContainer').css('opacity', '0.1');
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
        $('.progressBarContainer').css('opacity', '1');
        $('.volumeLevelContainer').css('opacity', '1');
        isMuted ? mute()   : unMute()
        isFullScreen ? enableFullScreen() : disableFullScreen()
        isLooped ? loop() : unLoop()
        //if (orchestrator.status !== 1) {
        //    window.setTimeout(function() {
        //        volumeLevel.fadeTo(500, 0, null);
        //    }, 2000);
        //}
    }

    /*
    * I/P:   none
    * Pauses tour
    * O/P:   none
    */
    function pause() {
        orchestrator.pause();
        playPauseButton.attr("src", itePath + "ITE Core/ITEManual/ITEPlayerImages/new_play.svg");
        makeControlsVisible();
    };

    /*
    * I/P:   none
    * Seeks tour to a specfied spot, without playing it. 
    * This is designed to be called as the user drags on the progress bar.
    * O/P:   none
    */
    function scrub(evt) {
        var progressBarContainer = $('.progressBarContainer');
        if (playerConfiguration.allowSeek){
            progressBar.css({
                width : evt.pageX - progressBar.parent().offset().left
            })
            timeOffset = progressBar.width()/progressBarContainer.width() //timeOffset is currently a percentage of the total time
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
                width : e.pageX - progressBar.parent().offset().left
            })
            timeOffset = progressBar.width()/progressBar.parent().width() //timeOffset is currently a percentage of the total time
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
        volumeButton.attr("src", itePath + "ITE Core/ITEManual/ITEPlayerImages/volume.svg");
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
        volumeButton.attr("src", itePath + "ITE Core/ITEManual/ITEPlayerImages/volume0.svg")
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
        volumeButton.attr("src", itePath + "ITE Core/ITEManual/ITEPlayerImages/volume.svg");
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
        trackManager = self.getTracks();
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
            if (doq !== null && doq && doq.Metadata) {
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
        infoAvailableIcon.attr({
            src: itePath + "ITE Core/ITEManual/ITEPlayerImages/tour_interaction.png"
        })
        if (yes === true) {
            infoAvailableIcon.css({
                'opacity' : '1'
            })
            
        }
        else {
            infoAvailableIcon.css({
                'opacity': '0'
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
        if (doq !== null && doq && doq.Metadata) {
            updateInfoPane(doq);
        }
        else {
            hideInfoPane();
            makePaneVisible(false);
        }
        var telemetryName = getDoqIDFromZIndex(z)
        if(telemetryName){
            TAG.Telemetry.recordEvent("TourDZInteraction", function (tobj) {
                tobj.Name = telemetryName
            })
        }
    }

    function createSlidingPane() {
        var pane = $(document.createElement('div')),
            title = $(document.createElement('div')),
            tabWrapper = $(document.createElement('div'));
            tab = $(document.createElement('div')),
            tabImg = $(document.createElement('img')),
            infoBlock = $(document.createElement('div'));

        infoBlock
            .css({
                'position': 'absolute',
                'height': '82.5%',
                'z-index': '9999999999',
                'top': '12.5%',
                'width': '80%',
                "left" : "10%",
                'background-color': 'transparent',
                'color': 'white',
                'font-size': '70%',
                'overflow-y': "auto",
                'text-align': 'left',
                'scrollbar-face-color': NOBEL_WILL_COLOR,
                'scrollbar-arrow-color': 'transparent',
                'scrollbar-track-color': 'transparent',
            })
            .attr('id', 'infoBlock');
        
        tabImg
            .attr({
                src: itePath + "ITE Core/ITEManual/ITEPlayerImages/Close.svg",
                id : 'tabImg'
            })
            .css({
                'top': '30%',
                'width': '72%',
                'height': '42%',
                'margin-top': '85%',
                'margin-left': '10%'
            })
        
        pane
            .css({
                'background-color': '#333333',
                'border-right': '2.5px solid #D99B3B',
                'border-bottom': '3px solid #D99B3B',
                'display': 'block',
                'height': '100%',
                'left': '0px',
                'position': 'absolute',
                'top': '0px',
                'width': '22%',
                'z-index': '9999999'
            })
            .attr({
                id : 'infoPaneDiv'
            })
        
        title
            .css({
                'font-size': '125%',
                'clear': 'both',
                'overflow': 'visible',
                'word-wrap': 'break-word',
                'text-transform': 'uppercase',
                'margin': '50% 15% 0% 15%',
                'z-index': '9999999'
            })
            .attr('id', 'infoPaneTitleDiv')
        
        tab
            .css({
                'background-color': '#333333',
                'border-top': '3px solid #D99B3B',
                'border-right': '3px solid #D99B3B',
                'border-bottom': '3px solid #D99B3B',
                'border-bottom-right-radius': '3.5px',
                'border-top-right-radius': '3.5px',
                'position': 'absolute',
                'left': '99.85%',
                'top': '40%',
                'width': '12%',
                'height': '15%',
                'z-index': '-1'
            })
            .click(toggleInfoPane)
            .attr({
            id:'infoPaneTab'
            })
        
        tab.append(tabImg);
        tabWrapper.append(tab);
        pane.append(tabWrapper);
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
        showInfoPane();
        $(".infoPaneInfoField").remove();
        $(".infoPaneImage").remove();
        if (doq.Metadata.InfoFields && doq.Metadata.InfoFields.Name) {
            $("#infoPaneTitleDiv").text(doq.Metadata.InfoFields.Name);
        }
        else {
            $("#infoPaneTitleDiv").text(doq.Metadata.Name || "");
        }
        var top = 0;
        //var keys = Object.keys(doq.Metadata.InfoFields);

        if (doq.Metadata.Description && false) {
            var d = makeInfoField(doq.Metadata.Description);
            $("#infoBlock").append(d);
            d.css('top', $('#infoPaneTitleDiv').height() + 'px');
            top += d.height() + 50;
        }
        if (doq.SidebarInfo) {
            if (doq.SidebarInfo.length > 0) {
                var spoof = TAG.Layout.Spoof()
                doq.SidebarInfo.forEach(function (info) {
                    if (info.indexOf("<image>") === 0) {
                        var img = $(document.createElement("img")).css({
                            "width": "100%",
                            "height": "auto",
                            "position": "relative"
                        }).attr({ class: "infoPaneImage" })
                        var url = info.substring(7)
                        if (jQuery.data(document, "sidebar_images")[url] !== undefined) {
                            img[0].src = jQuery.data(document, "sidebar_images")[url]
                        }
                        else {
                            spoof.staticSetPath(url, img[0], "src", function () { jQuery.data(document, "sidebar_images")[url] = img[0].src});
                        }
                        $("#infoBlock").append(img)
                    }
                    else {
                        $("#infoBlock").append(makeInfoField(info))
                    }
                })
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


    function showInfoPane(callback) {
        $("#infoPaneDiv").stop()
        infoPaneOut = true;
        $("#infoPaneDiv").animate({ left: '0%' }, 1000, 'easeInOutQuart', callback ? function () {
            callback(),
            $("#tabImg").attr('src', itePath + "ITE Core/ITEManual/ITEPlayerImages/Close.svg")
            $("#infoPaneTab").css({
                'border-right': '3px solid '+ NOBEL_WILL_COLOR,
                'border-top': '3px solid '+ NOBEL_WILL_COLOR,
                'border-bottom': '3px solid ' + NOBEL_WILL_COLOR,
            })
        } : function () {
            $("#tabImg").attr('src', itePath + 'ITE Core/ITEManual/ITEPlayerImages/Close.svg');
            $("#infoPaneTab").css({
                'border-right': '3px solid '+NOBEL_WILL_COLOR,
                'border-top': '3px solid '+NOBEL_WILL_COLOR,
                'border-bottom': '3px solid '+NOBEL_WILL_COLOR,
            })
        })    
    }

    function hideInfoPane(callback) {
        $("#infoPaneDiv").stop()
        infoPaneOut = false;
        $("#infoPaneDiv").animate({ left: '-22%' }, 1000, 'easeInOutQuart', callback ? function () {
            callback(),
            $("#tabImg").attr('src', itePath + "ITE Core/ITEManual/ITEPlayerImages/Open.svg")
            $("#infoPaneTab").css({
                'background-color': NOBEL_WILL_COLOR,
                'border-right': '3px solid '+ NOBEL_WILL_COLOR,
                'border-top': '3px solid '+ NOBEL_WILL_COLOR,
                'border-bottom': '3px solid ' + NOBEL_WILL_COLOR,
            })
        } : function () {
            $("#tabImg").attr('src', itePath + "ITE Core/ITEManual/ITEPlayerImages/Open.svg")
            $("#infoPaneTab").css({
                'background-color': NOBEL_WILL_COLOR,
                'border-right': '3px solid '+ NOBEL_WILL_COLOR,
                'border-top': '3px solid '+ NOBEL_WILL_COLOR,
                'border-bottom': '3px solid '+ NOBEL_WILL_COLOR,
            })
        })
    }

    function makeInfoField(text, special) {
        var outer = $(document.createElement('div'));
        outer.attr({
            class: 'infoPaneInfoField'
        })
        outer.css({
            'position': 'relative',
            'z-index': '9999999999',
            'width': '100%',
            'left': '0%',
            'background-color': 'transparent',
            'color': 'white',
            'font-size': '1.05em',
            'text-align': 'left',
            'overflow-y': 'auto',
            'max-height': .85 * ($('#infoPaneDiv').height() - $('#infoPaneTitleDiv').height() - $('#infoPaneTitleDiv').offset().top) + 'px'
        });
        if (text === " " || text === "") {
            outer.css({ "min-height": "15px"})
        }
        if (text.substring(0,7) === "<title>") {
            text = text.substring(7)
            outer.css({"font-weight":"bold","font-size":"1.65em"})
        }
        outer.text(text);
        return outer;
    }



    function getDoqFromZIndex(z) {
        if (data && data.length > z && data[z - 1] !== false && data[z - 1].SidebarInfo && data[z - 1].SidebarInfo.length) {
            return data[z-1];
        }
        return null;
    }
    function getDoqIDFromZIndex(z) {
        if(!data || data.length <= z){
            return false
        }
        if (data[z - 1] !== false && data[z-1].Identifier) {
            return data[z-1].Identifier
        }
        return data[z-1]
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
    this.timeOffset = timeOffset;
    this.cancelLoad = cancelLoad;
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
    this.isInitialLoading = function () { return initialLoading }
    this.doneInitialLoading = function () { initialLoading = false;}
};
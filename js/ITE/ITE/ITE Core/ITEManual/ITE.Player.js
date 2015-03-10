window.ITE = window.ITE || {};

ITE.Player = function (options) { //acts as ITE object that contains the orchestrator, etc
   var totalTourDuration;
   var  orchestrator            = new ITE.Orchestrator(this),
        self = this,
        playerConfiguration = {
                attachVolume:               true,
                attachLoop:                 true,
                attachPlay:                 true,
                attachProgressBar:          true,
                attachFullScreen:           true,
                attachProgressIndicator:    true,
                fadeControls:               true,
                hideControls:               false,
                autoPlay:                   false,
                autoLoop:                   false,
                setMute:                    false,
                setInitVolume:              1,
                allowSeek:                  true,
                setFullScreen:              false,
                setStartingOffset:          0,
                setEndTime:                 NaN //defaults to end of tour if NaN
        },    //dictionary of player configuration options; defaults being set
    //DOM related
        ITEHolder = $(document.createElement("div"))
            .attr("id", "ITEHolder"),
        bottomContainer = $(document.createElement("div"))
            .attr("id", "bottomContainer"),
        buttonContainer = $(document.createElement("div"))
            .attr("id", "buttonContainer");

    ITEHolder.append(bottomContainer);
    bottomContainer.append(buttonContainer);

    //Buttons
    var volumeButton            = $(document.createElement("img")),
        volumeLevel             = $(document.createElement("img")),
        playPauseButton         = $(document.createElement("img")),
        loopButton              = $(document.createElement("img")),
        progressBar             = $(document.createElement("div")),
        fullScreenButton        = $(document.createElement("img")),
        progressIndicator       = $(document.createElement("div")),
        volumeLevelContainer    = $(document.createElement("div")),


    //Other atributes
        timeOffset,
        isMuted,
        isLooped,
        isFullScreen,

    //Other miscellaneous variables
        Utils = new ITE.Utils();
    this.Orchestrator = orchestrator;

    var onLoadPlayerEvent = new ITE.PubSubStruct();
    this.onTourEndEvent = new ITE.PubSubStruct();


    this.playerParent = $("#tagRoot");

    //Start things up
    createITEPlayer(this.playerParent, options)
   /**
    * I/P: {html}     playerParent    to attach ITE player to; defaults to document if nothing is specified
    *      {object}   options         dictionary including what kinds of control the player should have      
    * O/P: {object}   ITEPlayer       a new ITE player object 
    */
    function createITEPlayer(playerParent, options) {
        this.playerConfiguration    = Utils.sanitizeConfiguration(playerConfiguration, options); //replace ones that are listed
        this.playerConfiguration    = playerConfiguration; 
        this.playerParent           = playerParent;
        self.currentVolumeLevel     = playerConfiguration.setInitVolume; // Value between 0 and 1
        self.previousVolumeLevel    = self.currentVolumeLevel;

        //Attaches all necessary UI details of the player including controls to the parentEle

        this.playerParent.append(ITEHolder);

        if (!options.hideControls){
            attachVolume();
            attachPlay();
            attachLoop();
            attachProgressBar();
            attachFullScreen();
            attachProgressIndicator();
        };
        //onLoadPlayerEvent.publish(tourObj);
        //set initial tour properties: volume, startTime, endTime, loop, play, hideControls
        // Must be able to dynamically resize and position buttons based on screen size, TAG frame size, and number of buttons
    };
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
                .attr("src", itePath + "ITE%20Core/ITEManual/ITEPlayerImages/play.svg")
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
                    progressBarContainer.dragging = false
                    //volume
                    volumeLevelContainer.dragging ? setVolume(volumeLevelContainer.getVolumeFromMouse(e)) : null
                    volumeLevelContainer.dragging = false
                },
                "mousemove": function (e) {
                    //time
                    progressBarContainer.dragging ? seek(e) : null
                    //volume
                    volumeLevelContainer.dragging ? setVolume(volumeLevelContainer.getVolumeFromMouse(e)) : null
                }
            })

            var progressBarContainer = $(document.createElement("div"))
                .addClass("progressBarContainer")
                .on({
                    "click": function(e){
                        seek(e);
                    },
                    "mousedown": function(e){
                        progressBarContainer.dragging = true;
                    },
                    "mouseup": function(e){
                        progressBarContainer.dragging = false;
                    },         
                    "mousemove": function(e){
                        progressBarContainer.dragging ? seek(e) : null
                    }
                });

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
        if (playerConfiguration.attachProgressIndicator) {
            var ProgressIndicatorContainer = $(document.createElement("div"))
                .addClass("progressIndicatorContainer");
            progressIndicator.addClass("progressIndicator"); 
            buttonContainer.append(ProgressIndicatorContainer);
            ProgressIndicatorContainer.append(progressIndicator);
            window.setInterval(function(){
                updateProgressIndicator(orchestrator.getElapsedTime());
            },100);
        }


    };

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

        playerParent.mousemove(function(){
            volumeButton.stop();
            volumeLevel.stop();
            playPauseButton.stop();
            loopButton.stop();
            progressBar.stop();
            fullScreenButton.stop();
            progressIndicator.stop();
            $("#backButton").stop();
            $("#linkButton").stop();
            makeControlsVisible();
        });
        playerParent.mouseleave(function(){
            setControlsFade();
        })
    };

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
        return this.orchestrator.captureKeyframe(trackID);
    };


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
        orchestrator.play();

        // console.log("Tour is playing")
       playPauseButton.attr("src", itePath + "ITE%20Core/ITEManual/ITEPlayerImages/pause.svg")
       setControlsFade();
    };
    /*
    * I/P:   none
    * Sets the buttons to fade in 2 seconds from function call
    * O/P:   none
    */
    function setControlsFade(){
        if(playerConfiguration.fadeControls){
            window.setTimeout(function(){
                if(!playerParent.is(":hover")){
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
                }
            },2000)
       }
    }

    /*
    * I/P:   none
    * Makes the controls/buttons visible and cancels timeouts making them dissappear
    * O/P:   none
    */
    function makeControlsVisible(){
        volumeButton.css({ 'opacity' : 1 })
        volumeLevel.css({ 'opacity' : 1 })
        playPauseButton.css({ 'opacity' : 1 })
        loopButton.css({ 'opacity' : 1 })
        progressBar.css({ 'opacity' : 1 })
        fullScreenButton.css({ 'opacity' : 1 })
        progressIndicator.css({ 'opacity' : 1 })
        $("#backButton").css({ 'opacity' : 1 })
        $("#linkButton").css({ 'opacity' : 1 })
    }

    /*
    * I/P:   none
    * Pauses tour
    * O/P:   none
    */
    function pause() {
        orchestrator.pause();
        // console.log("Tour is paused")
        playPauseButton.attr("src", itePath + "ITE%20Core/ITEManual/ITEPlayerImages/play.svg")
    };

    /*
    * I/P:   none
    * Seeks tour to a specfied spot
    * O/P:   none
    */
    function seek(e) {
        if (playerConfiguration.allowSeek){
            console.log("Tour was seeked")
            progressBar.css({
                width : e.pageX - ITEHolder.offset().left
            })
            timeOffset = progressBar.width()/(progressBar.parent().width()) //timeOffset is currently a percentage of the total time
       //     orchestrator.seek(timeOffset);
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

        // console.log("volume set to " + currentVolumeLevel +  "%")
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
        // console.log("tour is fullscreen")
        fullScreenButton.css("opacity" , "1")
    };

   /**
    * I/P:    none
    * Removes fullscreen and changes UI accordingly
    * O/P:    none
    */ 
    function disableFullScreen() {
        isFullScreen = false;
        // console.log("tour is not fullscreen")
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
        // console.log("tour is looped")
        loopButton.css("opacity" , "1")
    };

   /**
    * I/P:    none
    * Sets tour to not be in loop and changes UI accordingly
    * O/P:    none
    */ 
    function unLoop() {
        isLooped = false;
        // console.log("tour is not looped")
        loopButton.css("opacity" , ".5")
    };

    /**
    * I/P:    none
    * returns holder (used for transitioning into tour player)
    * O/P:    root of the ITE player
    */ 
    function getRoot() {
        return ITEHolder
    };

    this.getRoot            = getRoot;
    this.togglePlayPause    = togglePlayPause;
    this.play               = play;
    this.pause              = pause;
    this.seek               = seek;
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
    this.makeControlsVisible= makeControlsVisible;
};
window.ITE = window.ITE || {};

ITE.Player = function (options) { //acts as ITE object that contains the orchestrator, etc
   var  orchestrator            = new ITE.Orchestrator(),

    playerConfiguration = {
            attachVolume:               true,
            attachLoop:                 true,
            attachPlay:                 true,
            attachProgressBar:          true,
            attachFullScreen:           true,
            attachProgressIndicator:    true,
            hideControls:               false,
            autoPlay:                   false,
            autoLoop:                   false,
            setMute:                    false,
            setInitVolume:              100,
            allowSeek:                  true,
            setFullScreen:              false,
            setStartingOffset:          0,
            setEndTime:                 NaN //defaults to end of tour if NaN
    },    //dictionary of player configuration options; defaults being set

    //DOM related
        ITEHolder           = $("#ITEHolder"),
        bottomContainer     = $("#bottomContainer"),
        buttonContainer     = $("#buttonContainer"),

    //Buttons
        volumeButton,
        volumeLevel,
        playPauseButton,
        loopButton,
        progressBar,
        fullScreenButton,
        progressIndicator,

    //Other atributes
        currentVolumeLevel,
        timeOffset,
        isMuted,
        isLooped,
        isFullScreen,

    //Other miscellaneous variables
        playerParent        = null,
        Utils               = new ITE.Utils();

    //Start things up
    createITEPlayer(ITEHolder, options)

    var Orchestrator = new ITE.Orchestrator();

   /**
    * I/P: {html}     playerParent    to attach ITE player to; defaults to document if nothing is specified
    *      {object}   options         dictionary including what kinds of control the player should have      
    * O/P: {object}   ITEPlayer       a new ITE player object 
    */
    function createITEPlayer(playerParent, options) {
        this.playerConfiguration    = Utils.sanitizeConfiguration(playerConfiguration, options); //replace ones that are listed
        this.playerConfiguration    = playerConfiguration; 
        this.playerParent           = playerParent;

        //Attaches all necessary UI details of the player including controls to the parentEle
        if (!options.hideControls){
            attachVolume();
            attachPlay();
            attachLoop();
            attachProgressBar();
            attachFullScreen();
            attachProgressIndicator();
        };

        //set initial tour properties: volume, startTime, endTime, loop, play, hideControls
        // Must be able to dynamically resize and position buttons based on screen size, TAG frame size, and number of buttons
        return ITEPlayer
    };

    //Attach volume button container and volume button
    function attachVolume() {
        if (playerConfiguration.attachVolume) {

            var volumeContainer = $(document.createElement("div"))
                .addClass("volumeContainer");

            var volumeButtonContainer = $(document.createElement("div"))
                .addClass("volumeButtonContainer");

                volumeButton = $(document.createElement("img"))
                .addClass("volumeButton")
                .attr("src", "ITEPlayerImages/volume.png")
                .on("click", toggleMute);

            var volumeLevelContainer = $(document.createElement("div"))
                .addClass("volumeLevelContainer")
                .on({
                    "click": function(e){
                        setVolume(e);
                    },
                    "mousedown": function(e){
                        volumeLevelContainer.dragging = true;
                    },
                    "mouseup": function(e){
                        volumeLevelContainer.dragging = false;
                    },
                    "mouseleave" : function(e){
                        volumeLevelContainer.dragging = false;
                        console.log("left")
                    },
                    "mousemove": function(e){
                        volumeLevelContainer.dragging ? setVolume(e) : null
                    }
                });

                volumeLevel = $(document.createElement("div"))
                .addClass("volumeLevel")

            buttonContainer.append(volumeContainer);
            volumeContainer.append(volumeButtonContainer)
                           .append(volumeLevelContainer);
            volumeButtonContainer.append(volumeButton);
            volumeLevelContainer.append(volumeLevel);
        }

        playerConfiguration.setMute ? mute(): unMute()
    };

    function attachPlay() {
        if (playerConfiguration.attachPlay) {

            var playPauseButtonContainer = $(document.createElement("div"))
                .addClass("playPauseButtonContainer");

                playPauseButton = $(document.createElement("img"))
                .addClass("playPauseButton")
                .attr("src", "ITEPlayerImages/pause.png")
                .on("click", togglePlayPause);

            buttonContainer.append(playPauseButtonContainer);
            playPauseButtonContainer.append(playPauseButton);
        }

        playerConfiguration.autoPlay ? play() : pause()
    };

    function attachLoop() {
        if (playerConfiguration.attachLoop) {

            var loopButtonContainer = $(document.createElement("div"))
                .addClass("loopButtonContainer");

                loopButton = $(document.createElement("img"))
                .addClass("loopButton")
                .attr("src", "ITEPlayerImages/loop.svg")
                .on("click", toggleLoop);

            buttonContainer.append(loopButtonContainer);
            loopButtonContainer.append(loopButton);
        }

        playerConfiguration.autoLoop ? loop() : unLoop()
    };

    function attachProgressBar() {
        if (playerConfiguration.attachProgressBar) {

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
                    "mouseleave" : function(e){
                        progressBarContainer.dragging = false;
                    },            
                    "mousemove": function(e){
                        progressBarContainer.dragging ? seek(e) : null
                    }
                });

            progressBar = $(document.createElement("div"))
                .addClass("progressBar")


            bottomContainer.append(progressBarContainer);
            progressBarContainer.append(progressBar);
        }
    };

    function attachProgressIndicator() {
        if (playerConfiguration.attachProgressIndicator) {

            var ProgressIndicatorContainer = $(document.createElement("div"))
                .addClass("progressIndicatorContainer");

                progressIndicator = $(document.createElement("div"))
                .addClass("progressIndicator")
                .innerHTML = "01:04";

            buttonContainer.append(ProgressIndicatorContainer);
            ProgressIndicatorContainer.append(progressIndicator);
        }
    };

    function attachFullScreen() {
        if (playerConfiguration.attachFullScreen) {

            var fullScreenButtonContainer = $(document.createElement("div"))
                .addClass("fullScreenButtonContainer");

                fullScreenButton = $(document.createElement("img"))
                .addClass("fullScreenButton")
                .attr("src", "ITEPlayerImages/fullScreen.png")
                .on("click", toggleFullScreen);

            buttonContainer.append(fullScreenButtonContainer);
            fullScreenButtonContainer.append(fullScreenButton);
        }

        //If player configuration's default is to full screen, set full screen
        if (playerConfiguration.setFullScreen){
            enableFullScreen()
        }
    };

//Public functions used to interface with TAG Authoring and Kiosk

    function load(tourData) {
        orchestrator.load(tourData);
    };

    function unload() {
    //    orchestrator.unload();
    };
	
    /*
    I/P:   trackID		track from which to capture a keyframe
    Captures and returns a keyframe
    Used in Authoring
    O/P:   none
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
        (orchestrator.status !== 2) ? pause() : play()
    };

    /*
    * I/P:   none
    * Starts tour from the beginning or from a resumed spot
    * O/P:   none
    */
    function play() {
        orchestrator.play();
        console.log("Tour is playing")
        playPauseButton.attr("src", "ITEPlayerImages/pause.png")
    };


    /*
    * I/P:   none
    * Pauses tour
    * O/P:   none
    */
    function pause() {
        orchestrator.pause();
        console.log("Tour is paused")
        playPauseButton.attr("src", "ITEPlayerImages/play.png")
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
    function setVolume(e) {
        volumeLevel.css({
            height : Math.abs(e.pageY - volumeLevel.parent().offset().top - volumeLevel.parent().height())
        });
        currentVolumeLevel = volumeLevel.height()/(volumeLevel.parent().height());
        //orchestrator.setVolume(newVolumeLevel);

        console.log("volume set to " + parseInt(currentVolumeLevel*100) +  "%")
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
        console.log("tour is muted")
        volumeButton.css("opacity" , ".5")
        volumeLevel.css("height" , "0")
    }

    /*
    * I/P:   none
    * Sets mute to be true and changes UI accordingly
    * O/P:   none
    */ 
    function unMute(){
        isMuted = false;
        console.log("tour is not muted")
        volumeButton.css("opacity" , "1")
        volumeLevel.css("height" , currentVolumeLevel*(volumeLevel.parent().height()))
    }

//FULL SCREEN
   /**
    * I/P:  none
    * Toggles full screen
    * O/P:  none
    */ 
    function toggleFullScreen() {
        isFullScreen ? disableFullScreen() : enableFullScreen()
    };

   /**
    * I/P:    none
    * Sets fullscreen and changes UI accordingly
    * O/P:    none
    */ 
    function enableFullScreen() {
        isFullScreen = true;
        console.log("tour is fullscreen")
        fullScreenButton.css("opacity" , "1")
    };

   /**
    * I/P:    none
    * Removes fullscreen and changes UI accordingly
    * O/P:    none
    */ 
    function disableFullScreen() {
        isFullScreen = false;
        console.log("tour is not fullscreen")
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
        console.log("tour is looped")
        loopButton.css("opacity" , "1")
    };

   /**
    * I/P:    none
    * Sets tour to not be in loop and changes UI accordingly
    * O/P:    none
    */ 
    function unLoop() {
        isLooped = false;
        console.log("tour is not looped")
        loopButton.css("opacity" , ".5")
    };


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
    this.currentVolumeLevel = currentVolumeLevel;
    this.timeOffset         = timeOffset;
    this.isMuted            = isMuted;
    this.isLooped           = isLooped;
    this.isFullScreen       = isFullScreen
};


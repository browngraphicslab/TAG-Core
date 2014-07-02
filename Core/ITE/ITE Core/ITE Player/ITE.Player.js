window.ITE = window.ITE || {};

ITE.Player = function () { //acts as ITE object that contains the orchestrator, etc
   // var orchestrator = new Orchestrator(this);
    var playerConfiguration = {
        attachVolume:           true,
        attachLoop:             true,
        attachPlay:             true,
        attachProgressBar:      true,
        attachFullScreen:       true,
        attachProgressIndicator: true,
        hideControls:           false,
        autoPlay:               false,
        autoLoop:               false,
        setMute:                false,
        setInitVolume:          100,
        allowSeek:              true,
        setFullScreen:          false,
        setStartingOffset:      0,
        setEndTime: NaN //defaults to end of tour if NaN
    },    //dictionary of player configuration options; defaults being set

    //DOM related
    var ITEHolder           = $("#ITEHolder"),
    var bottomContainer     = $("#bottomContainer"),
    var buttonContainer     = $("#buttonContainer"),
    var playerParent = null;
    //Start things up
    createITEPlayer(ITEHolder, playerConfiguration);

    var Orchestrator = new ITE.Orchestrator();
    /*
    I/P: {html}     playerParent    to attach ITE player to; defaults to document if nothing is specified
         {object}   options         dictionary including what kinds of control the player should have      
    O/P: {object}   ITEPlayer       a new ITE player object 
    */
    function createITEPlayer(playerParent, options) {
        //this.playerConfiguration = sanitize(options); //replace ones that are listed
        this.playerConfiguration    = playerConfiguration; 
        this.playerParent           = playerParent;

        //Attaches all necessary UI details of the player including controls to the parentEle
        attachVolume();
        attachPlay();
        attachLoop();
        attachProgressBar();
        attachFullScreen();
        attachProgressIndicator();

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

            var volumeButton = $(document.createElement("img"))
                .addClass("volumeButton")
                .attr("src", "ITEPlayerImages/volume.png")
                .on("click", toggleMute());

            var volumeLevelContainer = $(document.createElement("div"))
                .addClass("volumeLevelContainer");

            var volumeLevel = $(document.createElement("div"))
                .addClass("volumeLevel")
                .on("click", toggleMute());

            buttonContainer.append(volumeContainer);
            volumeContainer.append(volumeButtonContainer)
                           .append(volumeLevelContainer);
            volumeButtonContainer.append(volumeButton);
            volumeLevelContainer.append(volumeLevel);
        }
    };

    function attachPlay() {
        if (playerConfiguration.attachPlay) {

            var playPauseButtonContainer = $(document.createElement("div"))
                .addClass("playPauseButtonContainer");

            var playPauseButton = $(document.createElement("img"))
                .addClass("playPauseButton")
                .attr("src", "ITEPlayerImages/play.png")
                .on("click", togglePlayPause());

            buttonContainer.append(playPauseButtonContainer);
            playPauseButtonContainer.append(playPauseButton);
        }
    };

    function attachLoop() {
        if (playerConfiguration.attachLoop) {

            var loopButtonContainer = $(document.createElement("div"))
                .addClass("loopButtonContainer");

            var loopButton = $(document.createElement("img"))
                .addClass("loopButton")
                .attr("src", "ITEPlayerImages/loop_white.svg")
                .on("click", togglePlayPause());

            buttonContainer.append(loopButtonContainer);
            loopButtonContainer.append(loopButton);
        }
    };

    function attachProgressBar() {
        if (playerConfiguration.attachProgressBar) {

            var progressBarContainer = $(document.createElement("div"))
                .addClass("progressBarContainer");

            var progressBar = $(document.createElement("div"))
                .addClass("progressBar")
                .on("click", togglePlayPause());

            bottomContainer.append(progressBarContainer);
            progressBarContainer.append(progressBar);
        }
    };

    function attachFullScreen() {
        if (playerConfiguration.attachFullScreen) {

            var fullScreenButtonContainer = $(document.createElement("div"))
                .addClass("fullScreenButtonContainer");

            var fullScreenButton = $(document.createElement("img"))
                .addClass("fullScreenButton")
                .attr("src", "ITEPlayerImages/FullScreen.png")
                .on("click", togglePlayPause());

            buttonContainer.append(fullScreenButtonContainer);
            fullScreenButtonContainer.append(fullScreenButton);
        }
    };
    
    function attachProgressIndicator() {
        if (playerConfiguration.attachProgressIndicator) {

            var ProgressIndicatorContainer = $(document.createElement("div"))
                .addClass("progressIndicatorContainer");

            var ProgressIndicator = $(document.createElement("div"))
                .addClass("progressIndicator")
                .innerHTML = "01:04";

            buttonContainer.append(ProgressIndicatorContainer);
            ProgressIndicatorContainer.append(ProgressIndicator);
        }
    };


    //Public functions used to interface with TAG Authoring and Kiosk

    function togglePlayPause() {
    //    orchestrator.play ? pause() : play();
    };

    function play() {
    //    orchestrator.play();
    };

    function pause() {
    //    orchestrator.pause();
    };

    function seek(seekTime) {
   //     orchestrator.seek(seekTime);
    };

    function load() {
   //     orchestrator.load();
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
    I/P:    volumeLevel	updated volume level
    O/P:   none
    */ 
    function setVolume(newVolumeLevel) {
        orchestrator.setVolume(newVolumeLevel);
        currentVolumeLevel = newVolumeLevel;
    };

    /*
    I/P:    muted	bool: is tour muted?
    O/P:   none
    */ 
    function toggleMute() {
  //      Orchestrator.mute ? setVolume(0) : setVolume(currentVolumeLevel)
    };


    /*
    I/P:	loop	bool: should play be in loop?
    O/P:	none
    */ 
    function setLoop(loop) {
    };
};

var ITEPlayer = new ITE.Player();

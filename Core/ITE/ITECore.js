window.ITE = window.ITE || {};

ITE.Utils = function(){ //contains utility functions
    // var extends = function (child, super) { //CHECK IF CORRECT
    //     child.prototype = super;
    // }

    this.sanitizeConfiguration = function (playerConfiguration, options){
        if (typeof options.attachVolume === 'boolean'){
            playerConfiguration.attachVolume  = options.attachVolume;
        }
        if (typeof options.attachLoop === 'boolean'){
            playerConfiguration.attachLoop  = options.attachLoop;
        }
        if (typeof options.attachPlay === 'boolean'){
            playerConfiguration.attachPlay  = options.attachPlay;
        }
        if (typeof options.attachProgressBar === 'boolean'){
            playerConfiguration.attachProgressBar  = options.attachProgressBar;
        }
        if (typeof options.attachFullScreen === 'boolean'){
            playerConfiguration.attachFullScreen  = options.attachFullScreen;
        }
        if (typeof options.attachProgressIndicator === 'boolean'){
            playerConfiguration.attachProgressIndicator  = options.attachProgressIndicator;
        }
        if (typeof options.hideControls === 'boolean'){
            playerConfiguration.hideControls  = options.hideControls;
        }
        if (typeof options.autoPlay === 'boolean'){
            playerConfiguration.autoPlay  = options.autoPlay;
        }
        if (typeof options.autoLoop === 'boolean'){
            playerConfiguration.autoLoop  = options.autoLoop;
        }
        if (typeof options.setMute === 'boolean'){
            playerConfiguration.setMute  = options.setMute;
        }
        if ((typeof options.setInitVolume === 'number') && (0 < options.setInitVolume) && (100 > options.setInitVolume)){
            playerConfiguration.setInitVolume  = options.setInitVolume;
        }
        if (typeof options.allowSeek === 'boolean'){
            playerConfiguration.allowSeek  = options.allowSeek;
        }
        if (typeof options.setFullScreen === 'boolean'){
            playerConfiguration.setFullScreen  = options.setFullScreen;
        }
        if (typeof options.setStartingOffset === 'number'){
            playerConfiguration.setStartingOffset  = options.setStartingOffset;
        }
    }
};

/*************/
window.ITE = window.ITE || {};
ITE.PubSubStruct = function() {

	var callbackItems = {};
    this.subscribe = function (callback, id, context) {
        callbackItems[id || callback] = { callback: callback, context: context || this };
    };

    this.unsubscribe = function (id) {
        delete callbackItems[id];
     };

     this.publish = function (eventArgs, isAsync) {
        for (var id in callbackItems) {
            var callbackItem = callbackItems[id];
            if (isAsync) {
                (function (callbackItem) {
                    setTimeout(function () {callbackItem.callback.call(callbackItem.context, eventArgs);}, 0);})(callbackItem);
            }
            else {
                callbackItem.callback.call(callbackItem.context, eventArgs);
            }
        }
    };

    return this;
};
/*************/
window.ITE = window.ITE || {};

ITE.TimeManager = function(){

	this.isRunning = false; //stopwatch value indicating the time of the tour
	this.startingOffset = 0; //the starting offset
	this.elapsedOffset = 0; //how much time has elapsed

	//getIsRunning
	this.getIsRunning = function(){
		return this.isRunning;
	};

	//getElapsedOffset
	this.getElapsedOffset = function(){
		var offset = (Date.now()/1000 - this.startingOffset) + this.elapsedOffset;
		if (this.isRunning){
			return offset;
		}else {
			return this.elapsedOffset;
		}
	};

	this.addElapsedTime = function(offset) {
		this.elapsedOffset += offset;
	}

		//start the timer
	this.startTimer= function(){
		this.startingOffset = Date.now() / 1000; //get startingOffset in seconds
		this.isRunning = true;
	};

	//pause the timer
	this.stopTimer = function(){
		if (this.isRunning){
			this.elaspedOffset = this.getElapsedOffset();
		}
		this.isRunning = false;
	};
};

/*************/
window.ITE = window.ITE || {};

ITE.Orchestrator = function() {

	var orchestratorState;
	var trackManager;
	var playerChangeEvent = new ITE.PubSubStruct();
	var trackManger = {}; 
	var stateChangeEvent = new ITE.PubSubStruct();

	var taskManager  = new ITE.TaskManager(); 

	this.load = function (tourData){
		var trackData;
		tourData.trackList.forEach(function(trackData) {
			ITE.track.createNew(trackData, context); 
		});

		loadedEvent.publish();	

		if (this.areAllTracksReady()){
			this.play();
		}

		this.initializeTracks();
	};
		

	function unload(){
	
	}

	function unload(track){
		trackManager.remove(track)
	}


	function play(){
		taskManager.start();
		playEvent.publish(timeManager.getElapsedTime());
	}

	function triggerCurrentTracks (tasks) {
		this.orchestratorState = this.state.playing;
		//var currentElaspedTime = this.taskManager.getElapsedTime();
		tasks.forEach(function(task) {
			task.track.play(task.offset, task.keyframe);
		});
	}

	function pause(){
		taskManager.pause();
		pauseEvent.publish(timeManager.getElapsedTime());
	}

	function seek(seekTime){
	    seekedEvent.publish({ "seekTime" : seekTime});
	}

	function setVolume(newVolumeLevel){
	    this.volumeChangedEvent.publish({ "volume" : newVolumeLevel });
	}
 
	function captureKeyframe(trackID) {
		var keyFrameData = trackManager(trackID).getState()
		trackManager(trackID).createNewKeyFrame(keyFrameData)
	}

	function areAllTracksReady() {
		var ready = true;

		trackManager.forEach(function(track) {
			if (track.state !== 2) {  //(2 = paused)
				ready = false
			}
		});
	}

	function initializeTracks(){

		trackManager.forEach(function(track) {
			// Subscribe video and audios to volume changes
			if (track.providerID === "video" || track.providerID === "audio") {
				volumeChangedEvent.subscribe(track.changeVolume)
			}

			// Subscribes everything to other orchestrator events
			narrativeSeekedEvent.subscribe(track.seek)
			narrativeLoadedEvent.subscribe(track.load)
			playEvent.subscribe(track.play);

			//add each keyframe as a scheduled task
			track.forEach(function(keyframe) {
				this.taskManager.loadTask(keyframe.offset, keyframe, track);
			});
		});
	}
}



/*************/
window.ITE = window.ITE || {};

ITE.Player = function (options) { //acts as ITE object that contains the orchestrator, etc
   // var orchestrator = new Orchestrator(this);
    var playerConfiguration = {
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
        playerParent        = null,

        Utils               = new ITE.Utils();

    //Start things up
    createITEPlayer(ITEHolder, options)

    var Orchestrator = new ITE.Orchestrator();

    /*
    I/P: {html}     playerParent    to attach ITE player to; defaults to document if nothing is specified
         {object}   options         dictionary including what kinds of control the player should have      
    O/P: {object}   ITEPlayer       a new ITE player object 
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







///EXCECUTE

var testOptions =   {
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
        setEndTime: NaN
    };

var ITEPlayer = new ITE.Player(testOptions);

/*************/
window.ITE = window.ITE || {};

ITE.ImageProvider = function (){
	ITE.utils.extend(this, ProviderInterfacePrototype);
	var	imageAsset	= document.createElement("img"),
		_UIControl	= document.createElement("div")
			.addClass("UIControl")

	var trackInteractionEvent = new ITE.pubSubStruct();

	var startPos = {
			position : absolute,
			left 		: "0px",
			top 		: "0px",
			height 		: "100%", 
			width 		: "100%", 
			overflow 	: hidden
	};

	function loadTask(imageAsset){
			_super.loadAsset()

			//Sets the image’s URL source
			this._image.src = this.TrackData.trackID.URL

			// When image has finished loading, set status to “paused”, and position element where it should be for the first keyframe
		this._image.addEventListener("load", (function (event) {
					this.setStatus(2);
					this.setState(keyframes[0]);
		}));
	}
		/* 
		I/P: none
		Grabs current actual state of image, and sets savedState to it 
	returns savedState
	O/P: savedState
	*/
		function getState(){
			this.savedState = {
				displayNumber	: getLastKeyframe().displayNumber,
				time			: timeManager.getElapsedSeconds(),
				opacity			: _image.opacity(),
				pos : {
					x		: _image.position().left,
					y 		: _image.position().top
				},
				size: {
					height	: _image.height(),
					width	: _image.width()
				},
			};	
			return savedState;
		};


		/*
	I/P: state	state to make actual image reflect
		Sets properties of the image to reflect the input state
	O/P: none
	*/
		function setState(state){
	_UIControl.css({
		"left":			state.position.left,
		"top":			state.position.top,
		"height":		state.size.height,
		"width":		state.size.width,
		"opacity":		state.opacity
	});

	savedState = state	
	};

		/* 
		I/P: none
		interpolates between current state and next keyframe
	O/P: none
	*/
	// 	function animate(){
	// 		// animate to next keyframe after where we are right now
	// 		var targetKeyFrame = getNextKeyframe(timeManager.getElapsedSeconds())

	//          media.onload =function(){
	//                         var  mediaobj = new Kinetic.Image(){
	//                 //set properties x,y,height, width followed by
	//                 image : media
	//                          });
	//             	 layer.add(mediaobj); //add the kinetic image to the stage’s layer
	//             	stage.add(layer); //add layer to the stage
	            
	//             	var animation = new Kintetic.Animation(function(frame){
	//                	 //define animation as desired},layer);
	//             	animation.start();

	// 		// When current animation has finished, begin next animation
	// this.animation.addEventListener("animationFinished", (function (event) {
	// 	this.animate() //This will start animation to the next keyframe
	// 		}

	// };

		/* 
		I/P: none
		Return a set of interactionHandlers attached to asset from provider
	We’ll want to make this more robust as we develop it further; currently only simple dragging and scrolling are supported. This is also dependent on the kind of animation library we use for animation.
	We will also want to implement hammer (look at RIN imageES file for more details)
	O/P: interactionHandlers 	array of interaction handlers to be passed to
	Orchestrator
	*/
	// 	function getInteractionHandlers(){

	// 		return {
	// 			// Mousedown
	// 			processDown: function(evt){
	// 				if (orchestrator.getState() !== 3){
	// 					orchestrator.pause()
	// 				};
				
	// 			// Drag
	// 			processDrag: function (evt) {
	// 				_image.css({
	// 					top: 	evt.x;
	// 					left:	evt.y;
	// 				});
	// 				this.TrackInteractionEvent.publish(“processDrag”);
	// 	}

	// 			//Scroll
	// 			processScroll: function (delta, zoomScale, pivot) {
	// 				if (orchestrator.getState() !== 3){
	// 					orchestrator.pause()
	// 				};
	// 				_image.zoomSomehow;
	// 				this.TrackInteractionEvent.publish(“processScroll”);
	// 		};
	// 		//Pinch
	// 		processPinch: function (){
	// 				if (orchestrator.getState() !== 3){
	// 					orchestrator.pause()
	// 				};
	// 				_image.pinchProcess;
	// 	this.TrackInteractionEvent.publish(“processPinch”);

	// 		};

	// }
	// };

	// function attachHandlers () {
	// 	var handlerMethods = this.getInteractionHandlers();
	// 	foreach method in handlerMethods {
	// 		//attach to html asset
	// // Initialize everything with Hammer
	// 	hammer.on('touch', processDown);
	// 		hammer.on('drag', function(evt){
	// 			processDrag(evt);
	// 	});
	// 		hammer.on('pinch', processPinch);
	// 	element.onmousewheel = processScroll;
	// }
	// }
	// function play (offset, keyframe) {
	// 	this.animate();

	// 	//need to make sure that the current animation is going through the current 
	// keyframe?

	// }
};

/*************/
// I/P: ESData 	parsed data associated with the track

window.ITE = window.ITE || {};

ITE.ProviderInterfacePrototype = function(TrackData){ 
	var	currentStatus		= 3		// Current status of Orchestrator (played (1), paused (2), loading (3), buffering(4))
									// Defaulted to ‘loading’

	savedState				= null 	// Current state of track (last-saved state)
	duration				= 0,	// Duration of track
	displayList				= [], 	// Data structure to keep track of all displays/keyframes

	interactionHandlers 	= [],	// object with a set of handlers for common tour interactions such as mousedown/tap, mousewheel/pinch zoom, etc. so that a generic function within the orchestrator can bind and unbind handlers to the media element

	currentAnimation		= null, // Current animation, if any (between two different states of the asset)
									// Saved as variable to make pausing and playing easier

	TrackInteractionEvent	= null, // Raised when track is interacted with.  This is for the inks to subscribe to.

	TrackData				= trackData;

	/*
	I/P: none
		Only parses displays here; function filled out in specific providerInterface classes
		Public function
	O/P: none
	*/
	this.loadAsset = function(){
		this.parseDisplays(trackData);
	}

	/*
	I/P: none
		Only parses displays here; function filled out in specific providerInterface classes
		Public function
	O/P: none
	*/
	this.unLoadAsset = function(){
		Orchestrator.removeTrack(this);
	}

	/*
	I/P: none
		Parses track data of keyframes into the correct displays
	O/P: none
	*/
	this.parseDisplays = function (trackData) {
		//Leaving this for now as we don’t yet know what data structure we want to use
	};

	/* 
	I/P: none
		Starts or resumes tour
		Called when tour is played
		Starts animation, if needed
	O/P: none
	*/
	this.play = function(){
	// Resets state to be where it was when track was paused
		this.setState(savedState);

	// Starts animation from saved (and now current) state to the next keyframe
		this.animate();

	// Set current status to “played”
		this.setCurrentStatus(1);
	};

	/* 
	I/P: none
		Pauses animation
		sets savedState to match state when tour is paused
		sets status to paused
	O/P: none
	*/
	this.pause = function(){
		// Stops/cancels animation, if there is one
		currentAnimation && currentAnimation.stop();

		// Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		this.setState(this.getState());

		// Sets currentStatus to paused
		this.setStatus(2);
	};

	/* 
	I/P: none
		Seeks animation from a given offset state
	O/P: none
	*/
	this.seek = function(seekTime){
		// Stops/cancels animation, if there is one
		currentAnimation && currentAnimation.stop();

		// Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		var seekState = animationProvider.interpolate(seekTime, previousKeyFrame(), nextKeyFrame()) //NOTE: this interpolates between the two keyframes to return the state at the given time. I’m not sure exactly what the syntax will be for this, but I know it’s possible in most of the animation libraries we’ve looked at.
			this.setState(state)
			this.play()
	};

	/* 
	I/P: none
		returns current status
	O/P: {status} current status
	*/
	this.getStatus = function(){
		return this.currentStatus
	};

	/* 
	I/P: status	status (from Orchestrator) to set current status of track
		Sets currentStatus to be inputed status
		Public function
	O/P: none
	*/
	this.setStatus = function(status){
		this.currentStatus = status
	};

	/* 
	I/P: none
		will grab data about the current state of the track
		Does nothing for now; function filled out in specific providerInterface classes
	O/P: {state} state
	*/
	this.getState = function(){
	};

	/* 
	I/P: state	state to set current state of track
		Will set state of track to match inputted state
		Does nothing for now; function filled out in specific providerInterface classes
	O/P: none
	*/
	this.setState = function(state){
	};

	/* 
	I/P: none
		Does nothing for now; function filled out in specific providerInterface classes
	O/P: interactionHandlers 	array of interaction handlers to be passed to Orchestrator
	*/
	this.getInteractionHandlers = function(){
		return interactionHandlers;
	};

	/*
    I/P: {state} state to be animated to
	O/P: nothing
	*/
	this.animateMedia = function(state){
         var container = document.createElement("div");
         container.appendChild(media);
         TweenLite.to(container, "duration", state);
	};


	/*
	I/P: time	either passed-in time or current time
	determines the next keyframe to be displayed
	O/P: nextKeyframe: next keyframe to be displayed
	*/
	this.getNextKeyframe = function(time){
		var 	time		= time || timeManager.getElapsedSeconds()
			keyFrame 	= keyframes[0];
	// Loops through keyframes and returns the first that has a time AFTER our inputted time
	// DEPENDS ON DATASTRUCTURE FOR KEYFRAMES/DISPLAYS
		while (keyFrame.time <= time){
			keyFrame = keyFrames.next(keyFrame)
		};
		return keyFrames.next(keyFrame);
	};

	/*
	I/P: time	either passed-in time or current time
	determines the previous keyframe from time offset
	O/P: previousKeyframe: previous keyframe 
	*/
	this.getPreviousKeyframe = function(time){
		var 	time		= time || timeManager.getElapsedSeconds()
			keyFrame 	= keyframes[0];
	// Loops through keyframes and returns the last that has a time BEFORE our inputted time
	// DEPENDS ON DATASTRUCTURE FOR KEYFRAMES/DISPLAYS
		while (keyFrame.time <= time){
			keyFrame = keyFrames.next(keyFrame)
		};
		return keyFrame;
	};
}

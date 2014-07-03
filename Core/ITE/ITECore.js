window.ITE = window.ITE || {};

ITE.Utils = function(){ //contains utility functions

    this.extendsPrototype = function(newClass, superClass) {
       for(i in superClass){
          newClass[i] = superClass[i];        
       }
    };

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
//creates a wrapper around a keyframe to indicate a task that needs to be scheduled
ITE.Task = function(timerOffset, duration, nextKeyframeData, asset) {
	this.offset = timerOffset;
	nextKeyframeData.ease = Linear.easeNone;
	this.callback = function(){
		var animation = TweenLite.to(asset, duration, nextKeyframeData);
		animation.play();
	};
};

var cat1 = document.getElementById('cat1');
var cat2 = document.getElementById('cat2');

//object that is responsible for scheduling different tasks ie. tracks
ITE.TaskManager = function() {
	
	self = this;
	//list of scheduled tasks to loop through;
	this.scheduledTasks = []; 

	//allow for the scheduling of items within a 0.2sec interval of the timer
	this.timerPrecision = 0.2; 

	//tracks which index in the scheduledTasks list the scheduler is currently at
	this.currentTaskIndex = 0;

	//timer of entire tour
	this.timeManager = new ITE.TimeManager();

	//to keep track of the setInterval of the next scheduled item
	this.timerId = -1;

	//getElaspedTime
	this.getElapsedTime = function(){
		return this.timeManager.getElapsedOffset();
	};	

	//load tasks to be scheduled
	this.loadTask = function(timerOffset, duration, nextKeyframeData, asset) {
		var newTask = new ITE.Task(timerOffset, duration, nextKeyframeData, asset);
		this.scheduledTasks.push(newTask);
	};

	//start the scheduler on current tasks
	this.play = function() {
		this.triggerCurrentTasks();
		this.scheduleNextTasks();
		this.timeManager.startTimer();
	};

	//pause the scheduler
	this.pause = function() {
		clearTimeout(this.timerId);
		this.timerId = -1;
		this.timeManager.stopTimer();
	};

//seek to the correct point in the scheduler
	this.seek = function(seekedOffset) {
		this.pause();
		this.timeManager.addElapsedTime(seekedOffset);
		this.currentTaskIndex = this.getIndexAt(offset);
		this.triggerCurrentTasks();
		this.scheduleNextTasks();
	};

	this.triggerCurrentTasks = function() {
		var index = this.currentTaskIndex;

		//interval in which to check for tasks to start
		var scheduleInterval = this.getElapsedTime() + this.timerPrecision;

		while (index < this.scheduledTasks.length && this.scheduledTasks[index].offset <=scheduleInterval) {
			this.scheduledTasks[index].callback.call();
			index++;
		}
		//reset the current task index so that we can schedule subsequent tasks
		this.currentTaskIndex = (index < this.scheduledTasks.length) ? index : -1;
	}

	this.scheduleNextTasks = function() {
		if (this.currentTaskIndex < 0){
			clearInterval(myTimer);
			return; //there are no more tasks to be started/scheduled
		}

		var nextTask = this.scheduledTasks[this.currentTaskIndex];

		//get the interval to wait until the next task is to be started
		var waitInterval = Math.max((nextTask.offset - this.getElapsedTime()), 0);

		clearTimeout(this.timerId);
			this.timerId = setTimeout(function () {self.nextTick();}, waitInterval * 1000);
	};

	this.nextTick = function() {
		this.triggerCurrentTasks();
		this.scheduleNextTasks();
	}

};


var newPlayer = new ITE.TaskManager();

var myTimer = setInterval(function(){document.getElementById("timer").innerHTML = newPlayer.getElapsedTime();}, 1000);

newPlayer.loadTask(0, 3, {left: "900px", top: "30px"}, cat1);
newPlayer.loadTask(0, 3, {left: "-100px", top: "400px"}, cat2);
newPlayer.loadTask(3, 5, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat1);
newPlayer.loadTask(3, 5, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat2);
newPlayer.loadTask(8, 3, {left: "900px", top: "30px"}, cat1);
newPlayer.loadTask(10, 2, {left: "-100px", top: "400px"}, cat2);
newPlayer.loadTask(15, 3, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat1);
newPlayer.loadTask(17, 3, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat2);
newPlayer.play();
/*************/
window.ITE = window.ITE || {};

ITE.Orchestrator = function(player) {
	var orchestratorState,
		trackManager = [],	//******* TODO: DETERMINE WHAT EXACTLY THIS IS GOING TO BE************
		taskManager  = new ITE.TaskManager(),
		playerChangeEvent = new ITE.PubSubStruct(),
		narrativeSeekedEvent = new ITE.PubSubStruct(),
		narrativeLoadedEvent = new ITE.PubSubStruct(),
		stateChangeEvent = new ITE.PubSubStruct();


    /*
    I/P: {URL}     	dataURL    Location of JSON data about keyframes/tracks
         Loads and parses JSON data using AJAX, then figures out which assetProvider to use to actually load the asset.
         Once the asset is loaded, the initializeTracks() is called, and when tracks are ready, the tour is played. 
    O/P: none
    */
	function load(dataURL){
		var tourData;
	    var AJAXreq = new XMLHttpRequest();

	   	AJAXreq.open( "GET", dataURL, true );
	    AJAXreq.setRequestHeader("Content-type", "application/json");
	    AJAXreq.onreadystatechange = function(){
	        if( AJAXreq.readyState == 4 && AJAXreq.status == 200 ){
	        	//Once request is ready, parse data and call function that actually loads tracks
	       		tourData = JSON.parse(AJAXreq.responseText);
	       		loadHelper();
	        }
	    }
	    AJAXreq.send();


	    /*
	    I/P: none
	  		Helper function to load tour with AJAX (called below)
	  		Calls CreatTrackByProvider, initializes the tracks, load their actual sources, and if they're ready, plays them
	    O/P: none
	    */
		function loadHelper(){
			//Creates tracks
			for (track in tourData.tracks){
				if (tourData.tracks.hasOwnProperty(track)){
					track = tourData.tracks[track]
					createTrackByProvider(track)
				};
			};

			//...Initializes them
			initializeTracks();

			//...Loads them
	    	for (i = 0; i < trackManager.length; i++){
	    		trackManager[i].load()
	    	}

	    	//...And plays them!
	    	if (areAllTracksReady()){
				play();
			}
		}



	    /*
	    I/P: {object}	trackData	object with parsed JSON data about the track
	  		Creates track based on providerID
	    O/P: none
	    */
		function createTrackByProvider(trackData){
			switch (trackData.providerID){
				case "Image" : 
					trackManager.push(new ITE.ImageProvider(trackData));
					break;
				case "Video" : 
					trackManager.push(new ITE.VideoProvider(trackData));
					break;
				case "Audio" : 
					trackManager.push(new ITE.AudioProvider(trackData));
					break;
				case "DeepZoom" : 
					trackManager.push(new ITE.DeepZoomProvider(trackData));
					break;
				case "Ink" : 
					trackManager.push(new ITE.InkProvider(trackData));
					break;
				default:
					throw new Error("Unexpected providerID; '" + track.providerID + "' is not a valid providerID");
			}
		}
	};

	function unload(track){
		trackManager.remove(track)
	}


	function play(){
		taskManager.start();
	}

	function triggerCurrentTracks (tasks) {
		this.orchestratorState = this.state.playing;
		//var currentElaspedTime = this.taskManager.getElapsedTime();

		for (task in tasks){
			if (tasks.hasOwnProperty(task)){
				task.track.play(task.offset, task.keyframe);
			};
		};
	};

	function pause(){
		taskManager.pause();
	}

	function seek(seekTime){
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
		for (track in trackManager){
			if (trackManager.hasOwnProperty(track)){
				if (track.state !== 2) {  //(2 = paused)
					ready = false
				}
			}
		}
	}

	function initializeTracks(){
		for (i = 0; i < trackManager.length; i++){
			var track = trackManager[i];
			// Subscribe video and audios to volume changes
			if (track.providerID === "video" || track.providerID === "audio") {
				volumeChangedEvent.subscribe(track.changeVolume)
			}
			// Subscribes everything to other orchestrator events
			narrativeSeekedEvent.subscribe(track.seek)
			narrativeLoadedEvent.subscribe(track.load)

			//add each keyframe as a scheduled task
			for (keyframe in track.keyframes){
				if (track.hasOwnProperty(keyframe)){
					taskManager.loadTask(keyframe.offset, keyframe, track);
				}
			}
			
		}
	}
	this.load = load;
	this.unload = unload;
	this.play = play;
	this.triggerCurrentTracks = triggerCurrentTracks;
	this.pause = pause;
	this.seek = seek;
	this.setVolume = setVolume;
	this.captureKeyframe = captureKeyframe;
	this.areAllTracksReady = areAllTracksReady;
	this.initializeTracks = initializeTracks;
}



/*************/
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

    this.togglePlayPause    = togglePlayPause;
    this.play               = play;
    this.pause              = pause;
    this.seek               = seek;
    this.load               = load;
    this.unload             = unload;
    this.captureKeyFrame    = captureKeyframe;
    this.setVolume          = setVolume;
    this.toggleMute         = toggleMute;
    this.setLoop            = setLoop


};


/*************/
window.ITE = window.ITE || {};

ITE.ImageProvider = function (TrackData){

	//Extend class from ProviderInterfacePrototype
	var Utils 	= new ITE.Utils(),
		_super 	= new ITE.ProviderInterfacePrototype()

	Utils.extendsPrototype(this, _super);

    this.keyframes           	= [];   // Data structure to keep track of all displays/keyframes
	this.trackInteractionEvent 	= new ITE.PubSubStruct();

        //DOM related
	var	_image		= $(document.createElement("img"))
			.addClass("assetImage");
;
		_UIControl	= $(document.createElement("div"))
			.addClass("UIControl")
			.css({
				"width": "50%",
				"height":"50%"
			})
			.append(_image);

	$("#ITEHolder").append(_UIControl)


		//Data related
    this.TrackData   = TrackData;


	/* 
	I/P: none
		Loads actual image asset, and sets status to paused when complete
	O/P: none
	*/
	this.load = function(){
			_super.loadAsset()

			//Sets the image’s URL source
			_image.attr("src", "../../Assets/TourData/" + this.TrackData.assetID)

			// When image has finished loading, set status to “paused”, and position element where it should be for the first keyframe
			_image.onload = function (event) {
					this.setStatus(2);
					this.setState(keyframes[0]);
			};
	};
	
	/* 
	I/P: none
		Grabs current actual state of image, and sets savedState to it 
		returns savedState
	O/P: savedState
	*/
	this.getState = function(){
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
	this.setState = function(state){
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
	this.currentStatus			= 3;		// Current status of Orchestrator (played (1), paused (2), loading (3), buffering(4))
									// Defaulted to ‘loading’

	this.savedState				= null; 	// Current state of track (last-saved state)
	this.duration				= 0;	// Duration of track
	this.keyframes				= []; 	// Data structure to keep track of all displays/keyframes

	this.interactionHandlers 	= null;	// object with a set of handlers for common tour interactions such as mousedown/tap, mousewheel/pinch zoom, etc. so that a generic function within the orchestrator can bind and unbind handlers to the media element

	this.currentAnimation		= null; // Current animation, if any (between two different states of the asset)
										// Saved as variable to make pausing and playing easier

	this.TrackInteractionEvent	= null; // Raised when track is interacted with.  This is for the inks to subscribe to.

	this.TrackData				= TrackData;

	/*
	I/P: none
		Only parses displays here; function filled out in specific providerInterface classes
		Public function
	O/P: none
	*/
	this.loadAsset = function(){
		this.parseDisplays(TrackData);
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

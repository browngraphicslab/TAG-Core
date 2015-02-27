// I/P: ESData 	parsed data associated with the track

window.ITE = window.ITE || {};

ITE.ProviderInterfacePrototype = function(trackData, player, taskManager, orchestrator){ 
	this.currentStatus			= 3;		// Current status of Orchestrator (played (1), paused (2), loading (3), buffering(4))
									// Defaulted to ‘loading’

	this.savedState				= null; 	// Current state of track (last-saved state)
	this.duration				= 0;	// Duration of track
	// TODO: remove old stuff
	// this.keyframes				= []; 	// Data structure to keep track of all displays/keyframes
	// TODO: new stuff start
	this.keyframes           = new AVLTree(
		// Comparator function takes in two keyframes, returns comparison integer.
		function (a, b) {
			if (a.time < b.time) {
				return -1;
			} else if (a.time > b.time) {
				return 1;
			} else {
				return 0;
			}
		},
		// Valuation function takes in a value and keyframe to compare it's time to.
		function (value, compareToNode) {
			if (!compareToNode) {
				return null;
			} else if (value < compareToNode.time) {
				return -1;
			} else if (value > compareToNode.time) {
				return 1;
			} else {
				return 0;
			}
		});
	// TODO: new stuff end
	this.interactionHandlers 	= null;	// object with a set of handlers for common tour interactions such as mousedown/tap, mousewheel/pinch zoom, etc. so that a generic function within the orchestrator can bind and unbind handlers to the media element

	self.player 				= player;
	self.taskManager 			= taskManager;
	self.trackData 				= trackData;
	self.orchestrator			= orchestrator;

	//Only parses displays here; function filled out in specific providerInterface classes
	this.initialize = function(){
		this.parseDisplays(trackData);
	}

	/*
	I/P: none
		Public function
	O/P: none
	*/
	this.load = function(){
	}

	/*
	I/P: Array of keyframes from trackData
		Public function
	O/P: none
	*/
	this.loadKeyframes = function(keyframeData){
		for (var i = 0; i < keyframeData.length; i++) {
			var keyframe = keyframeData[i];
			if (typeof keyframe === "object" && "time" in keyframe) {
				this.keyframes.add(keyframeData[i]);

			}
		}
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
	I/P: {time, ms}	duration duration of animation
		Starts or resumes tour
		Called when tour is played
		Starts animation, if needed
	O/P: none
	*/
	this.play = function(targetTime, data){
	// Resets state to be where it was when track was paused, then clears the saved state
		if(this.savedState) {
			this.setState(this.savedState);
			this.animate(targetTime - this.savedState.time, data);
			this.savedState = null;	
		} else {
			//Animates to the next keyframe
			this.animate(Math.abs(targetTime - this.taskManager.timeManager.getElapsedOffset()), data);
		}
	// // Set current status to “played”
	// 	this.setCurrentStatus(1);
	};

	this.animate = function(){
	}
	
	/* 
	I/P: none
		Seeks animation from a given offset state
	O/P: none
	*/
	this.seek = function(seekTime){
		// // Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		//  var seekState = animationProvider.interpolate(seekTime, previousKeyFrame(), nextKeyFrame()) //NOTE: this interpolates between the two keyframes to return the state at the given time. I’m not sure exactly what the syntax will be for this, but I know it’s possible in most of the animation libraries we’ve looked at.
		// 	this.setState(state)
		// 	this.play()
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
	this.setState = function(state, callback){
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
	// 	var 	time		= time || timeManager.getElapsedSeconds()
	// 			keyFrame 	= keyframes[0];
	// // Loops through keyframes and returns the first that has a time AFTER our inputted time
	// // DEPENDS ON DATASTRUCTURE FOR KEYFRAMES/DISPLAYS
	// 	while (keyFrame.time <= time){
	// 		keyFrame = keyFrames.next(keyFrame)
	// 	};
	// 	return keyFrames.next(keyFrame);

		// TODO: Remove old keyframe stuff
		var 	time 		= time || timeManager.getElapsedSeconds()
				keyframe 	= self.keyframes.min();

		var nn = self.keyframes.nearestNeightbors(time, 1);
		if (nn[1]) {
			keyframe = nn[1];
		} else if (nn[0]) {
			keyframe = nn[0];
		}
		return keyframe || null;

	};

	/*
	I/P: time	either passed-in time or current time
	determines the previous keyframe from time offset
	O/P: previousKeyframe: previous keyframe 
	*/
	this.getPreviousKeyframe = function(time){
	// 	var time 		= time || self.taskManager.timeManager.getElapsedSeconds()
	// 		keyFrame 	= keyframes[0];
	// // Loops through keyframes and returns the last that has a time BEFORE our inputted time
	// // DEPENDS ON DATASTRUCTURE FOR KEYFRAMES/DISPLAYS
	// 	while (keyFrame.time <= time){
	// 		keyFrame = keyFrames.next(keyFrame)
	// 	};
	// 	return keyFrame;
	// 	// TODO: Remove old keyframe stuff
	// 	var 	time 		= time || timeManager.getElapsedSeconds()
	// 			keyframe 	= keyframesAVL.min();

		// TODO: Remove old keyframe stuff.
		var nn = self.keyframes.nearestNeightbors(time, -1);
		if (nn[0]) {
			keyframe = nn[0];
		} else if (nn[1]) {
			keyframe = nn[1];
		}
		return keyframe || null;
	};
}

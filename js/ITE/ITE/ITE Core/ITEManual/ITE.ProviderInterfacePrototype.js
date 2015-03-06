// I/P: ESData 	parsed data associated with the track

window.ITE = window.ITE || {};

//ITE.ProviderInterfacePrototype = function(trackData, player, taskManager, orchestrator){ 
ITE.ProviderInterfacePrototype = function(trackData, player, timeManager, orchestrator){ 
	var self = this;
	self.currentStatus			= 3;		// Current status of Orchestrator (played (1), paused (2), loading (3), buffering(4))
									// Defaulted to ‘loading’

	self.savedState				= null; 	// Current state of track (last-saved state)
	self.duration				= 0;	// Duration of track

	self.keyframes           = new AVLTree(
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

	self.interactionHandlers 	= null;	// object with a set of handlers for common tour interactions such as mousedown/tap, mousewheel/pinch zoom, etc. so that a generic function within the orchestrator can bind and unbind handlers to the media element
	self.player 				= player;
	self.timeManager			= timeManager;
	self.trackData 				= trackData;
	self.orchestrator			= orchestrator;

	//Only parses displays here; function filled out in specific providerInterface classes
	self.initialize = function(){
		this.parseDisplays(trackData);
	};

	/** 
	* I/P: keyframe: a keyframe on this track.
	* Extracts the state information from this keyframe and returns it.
	* O/P: state information (used in animation) from keyframe.
	*/
	self.getKeyframeState = function(keyframe) {};

	/** 
	* I/P: 	startKeyframe: 	keyframe to lerp from.
			endKeyframe: 	keyframe to lerp to.
			interp: 		amount to interpolate.
	* Creates a linearly interpolated state between start and end keyframes.
	* O/P: state information (used in animation) from lerped keyframe.
	*/
	self.lerpState = function(startKeyframe, endKeyframe, interp) {};

	/*
	I/P: none
		Public function
	O/P: none
	*/
	self.load = function() {};

	/*
	I/P: Array of keyframes from trackData
		Public function
	O/P: none
	*/
	self.loadKeyframes = function(keyframeData) {
		for (var i = 0; i < keyframeData.length; i++) {
			var keyframe = keyframeData[i];
			if (typeof keyframe === "object" && "time" in keyframe) {
				this.keyframes.add(keyframeData[i]);
			}
		}
	};

	/*
	I/P: none
		Only parses displays here; function filled out in specific providerInterface classes
		Public function
	O/P: none
	*/
	self.unLoadAsset = function() {
		Orchestrator.removeTrack(self);
	};

	/*
	I/P: none
		Parses track data of keyframes into the correct displays
	O/P: none
	*/
	self.parseDisplays = function (trackData) {	};

	/* 
	I/P: {time, ms}	duration duration of animation
		Starts or resumes tour
		Called when tour is played
		Starts animation, if needed
	O/P: none
	*/
	// self.play = function(targetTime, data){
	// // Resets state to be where it was when track was paused, then clears the saved state
	// 	if(self.savedState) {
	// 		self.setState(self.savedState);
	// 		self.animate(targetTime - self.savedState.time, data);
	// 		self.savedState = null;	
	// 	} else {
	// 		//Animates to the next keyframe
	// 		self.animate(Math.abs(targetTime - self.taskManager.timeManager.getElapsedOffset()), data);
	// 	}
	// // // Set current status to “played”
	// // 	self.setCurrentStatus(1);
	// };


	/** 
	* I/P: endKeyframe: if we know what keyframe we are animating to, pass it here.
	* Plays track
	* O/P: none
	*/
	self.play = function(endKeyframe) {};

	self.pause = function() {};

	self.seek = function() {};

	/** 
	I/P: 	endState: 	end state of animation
			duration: 	duration of animation
		Animates from current state to endState, in specified duration.
		Public function
	O/P: none
	*/
	self.animate = function(endState, duration) {};

	/* 
	I/P: none
		returns current status
	O/P: {status} current status
	*/
	self.getStatus = function(){
		return this.currentStatus;
	};

	/* 
	I/P: status	status (from Orchestrator) to set current status of track
		Sets currentStatus to be inputed status
		Public function
	O/P: none
	*/
	self.setStatus = function(status){
		this.currentStatus = status;
	};

	/* 
	I/P: none
		will grab data about the current state of the track
		Does nothing for now; function filled out in specific providerInterface classes
	O/P: {state} state
	*/
	self.getState = function() {};

	/* 
	I/P: state	state to set current state of track
		Will set state of track to match inputted state
		Does nothing for now; function filled out in specific providerInterface classes
	O/P: none
	*/
	self.setState = function(state, callback) {};

	/* 
	I/P: none
		Does nothing for now; function filled out in specific providerInterface classes
	O/P: interactionHandlers 	array of interaction handlers to be passed to Orchestrator
	*/
	self.getInteractionHandlers = function() {
		return interactionHandlers;
	};

	/*
    I/P: {state} state to be animated to
	O/P: nothing
	*/
	self.animateMedia = function(state) {
         var container = document.createElement("div");
         container.appendChild(media);
         TweenLite.to(container, "duration", state);
	};


	/*
	I/P: time	either passed-in time or current time
	determines the next keyframe to be displayed
	O/P: nextKeyframe: next keyframe to be displayed
	*/
	self.getNextKeyframe = function(time) {
		var 	time 		= time || this.timeManager.getElapsedOffset()
				keyframe 	= this.keyframes.min();

		var nn = this.keyframes.nearestNeighbors(time, 1);
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
	self.getPreviousKeyframe = function(time) {
	var 	time 		= time || this.timeManager.getElapsedOffset()
			keyframe 	= this.keyframes.min();

		var nn = this.keyframes.nearestNeighbors(time, -1);
		if (nn[0]) {
			keyframe = nn[0];
		} else if (nn[1]) {
			keyframe = nn[1];
		}
		return keyframe || null;
	};

	/*
	I/P: time	either passed-in time or current time
	gets previous and next keyframes.
	Edge cases:
		- keyframe k start time: [0] = k; [1] = next keyframe
		- end time: [0] = last keyframe [1] = last
	O/P: surrounding keyframes.
	*/
	self.getSurroundingKeyframes = function(time) {
		var 	time 		= time || this.timeManager.getElapsedOffset()
				keyframe 	= this.keyframes.min();

		var nn = this.keyframes.nearestNeighbors(time, 1);
		if (!nn[1]) {
			nn[1] = nn[0];
		}
		return nn;
	};
}

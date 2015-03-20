window.ITE = window.ITE || {};

/*
 * I/P: 	trackData : 	Holds data on the track, such as duration.
 *			player : 		Reference to actual DOM-related ITE player.
 *			timeManager : 	Reference to common clock for player.
 *			orchestrator : 	Reference to common orchestrator, which informs tracks of actions.
 * Interface for providers to implement. Includes a few functions common to all providers,
 * most notably those involving retrieveing keyframes from the AVL tree based on an arbitrary reference time. 
 * 
 * Be sure to document the format of a state of the provider in the description.
 * O/P: 	none
 */
ITE.ProviderInterfacePrototype = function(trackData, player, timeManager, orchestrator) { 

	var self = this;

	// Common stuff.
	self.player 		= player;		// Reference to actual DOM-related ITE player.
	self.timeManager	= timeManager;	// Reference to common clock for player.
	self.orchestrator	= orchestrator;	// Reference to common orchestrator, which informs tracks of actions.

	// Track data.
	self.startDelayTimer;						// Timer used to delay the start of a track.
	self.animation;								// The animation of this track.
	self.firstKeyframe  = null;					// First keyframe. Should be set in initialization.
	self.lastKeyframe  	= null;					// Last keyframe. Should be set in initialization.
	self.trackData 		= trackData;			// Holds data on the track, such as duration.
	self.savedState		= null; 				// The last saved state of the track.
	self.status			= 3;					// Status of this track:
												// (1) PLAYING
												// (2) PAUSED
												// (3) LOADING
												// (4) BUFFERING
	self.keyframes      = new AVLTree(			// AVL tree holding keyframes. Call self.loadKeyframes(keyframeData) to construct in initialize().
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
		}
	);

	// Object with a set of handlers for common tour interactions such as mousedown/tap,
	// mousewheel/pinch zoom, etc. so that a generic function within the orchestrator can 
	// bind and unbind handlers to the media element.
	self.interactionHandlers 	= null;	

	///////////////////////////////////////////////////////////////////////////
	// Common functions.
	///////////////////////////////////////////////////////////////////////////

	/*
	 * I/P: 	keyframeData : 		Array of keyframes from trackData.
	 * Constructs the AVL tree of keyframes for a track.
	 * O/P: 	none
	 */

	self.loadKeyframes = function(keyframeData) {
		for (var i = 0; i < keyframeData.length; i++) {
			var keyframe = keyframeData[i];
			self.addKeyframe(keyframe)
		}
	};


	/*
	 * I/P: 	keyframe : 		keyframe to be added to keyframes
	 * Adds a single keyframe to the AVL tree. Used above and in authoring
	 * O/P: 	none
	 */
	self.addKeyframe = function(keyframe) {
		if (typeof keyframe === "object" && "time" in keyframe) {
			this.keyframes.add(keyframe);
		}
	}

	/*
	 * I/P: 	none
	 * Removes this track from the orchestrator.
	 * O/P: 	none
	 */
	self.unLoadAsset = function() {
		self.orchestrator.removeTrack(self);
	};

	/* 
	 * I/P: 	none
	 * Returns array of interaction handlers for this provider.
	 * O/P: 	interactionHandlers : 	Array of interaction handlers to be passed to Orchestrator.
	 */
	self.getInteractionHandlers = function() {
		return self.interactionHandlers;
	};

	/*
     * I/P: 	state : 		State to be animated to.
	 * O/P: 	nothing
	 */
	self.animateMedia = function(state) {
    	var container = document.createElement("div");
        container.appendChild(media);
        TweenLite.to(container, "duration", state);
	};

	/*
	 * I/P: 	waitTime : 		Time to wait before triggering first keyframe, in milliseconds.
	 * 			onTimeout : 	Function to call when the timer is done.
	 * Waits specified time to call specified function; used to trigger playing. 
	 * O/P: 	none
	 */
	 self.delayStart = function(waitTime, onTimeout) {
	 	self.stopDelayStart();
		self.startDelayTimer = setTimeout(onTimeout, waitTime * 1000);
	 };

	/*
	 * I/P: 	none
	 * Stops the delayed start timer.
	 * O/P: 	none
	 */
	self.stopDelayStart = function() {
		if (self.startDelayTimer) {
	 		clearTimeout(self.startDelayTimer);
	 	}
	}

	/*
	 * I/P: 	time : 			(OPTIONAL) Time to get next keyframe from; defaults to timeManager.getElapsedTime().
	 * Gets the next keyframe to be displayed immediately after specified or elapsed time.
	 * O/P: 	nextKeyframe : 	Keyframe that immediately follows input time.
	 */
	self.getNextKeyframe = function(time) {
		var 	time 		= time || this.timeManager.getElapsedOffset()
				keyframe 	= this.keyframes.min();
		return this.keyframes.nearestNeighbors(time, 1)[1] || null;
	};

	/*
	 * I/P: 	time : 			(OPTIONAL) Time to get previous keyframe from; defaults to timeManager.getElapsedTime().
	 * Gets the previous keyframe displayed immediately before specified or elapsed time.
	 * O/P: 	nextKeyframe : 	Keyframe that immediately precedes input time.
	 */
	self.getPreviousKeyframe = function(time) {
		var 	time 		= time || this.timeManager.getElapsedOffset()
				keyframe 	= this.keyframes.min();
		return this.keyframes.nearestNeighbors(time, -1)[0] || null;
	};

	/*
	 * I/P: 	time: 			(OPTIONAL) Time to get surrounding keyframes from; defaults to timeManager.getElapsedTime().
	 * Gets the keyframes immediately before and after specified or elapsed time.
	 * O/P: 	keyframes: 		[0] Keyframe that immediately precedes input time.
	 *							[1] Keyframe that immediately follows input time.
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

	// TODO: NOT SURE IF WE NEED THIS
	// /*
	//  * I/P: 	none
	//  * Parses track data of keyframes into the correct displays.
	//  * O/P: 	none
	//  */
	// self.parseDisplays = function (trackData) {};

	///////////////////////////////////////////////////////////////////////////
	// Abstract functions.
	///////////////////////////////////////////////////////////////////////////

	/*
	 * I/P: 	none
	 * Initializes track, creates UI, and attaches handlers.
	 * O/P: 	none
	 */
	self.initialize = function() {};

	/*
	 * I/P: 	none
	 * Loads actual track asset, and sets status to paused (2) when complete.
	 * O/P: 	none
	 */
	self.load = function() {};

	/*
	 * I/P: 	none
	 * Unloads actual track asset.
	 * O/P: 	none
	 */
	self.unload = function() {};

	/*
	 * I/P: endKeyframe : 	(OPTIONAL) if we know what keyframe we are animating to, pass it here.
	 * Plays track.
	 * O/P: none
	 */
	self.play = function(endKeyframe) {};

	/* 
	 * I/P: none
	 * Pauses track.
	 * O/P: none
	 */
	self.pause = function() {};

	/*
	 * I/P: none
	 * Pauses track and changes its state based on new time from timeManager.
	 * O/P: nextKeyframe : 		The next keyframe to play to, if the track is playing, or null otherwise.
	 */
	self.seek = function() {};

	/* 
	 * I/P: 	duration : 		Length of time animation should take, in milliseconds.
	 * 			state : 		State to animate to, from current state.
	 * Animates from current state to provided state in specified duration.
	 * O/P: 	none
	 */
	self.animate = function(duration, state) {};

	/*
	 * I/P: 	none
	 * Grabs current actual state of track, and sets savedState to it.
	 * O/P: 	state : 	Object holding track's current state, as used in animation.
	 */
	self.getState = function() {};

	/*
	 * I/P: 	state :		State to make actual track asset reflect.
	 * Sets properties of the track asset to reflect the input state.
	 * O/P: 	none
	 */
	self.setState = function(state) {};

	/* 
	 * I/P: 	keyframe : 			Keyframe to extract state from.
	 * Extracts the state information from this keyframe and returns it.
	 * O/P: 	state : 			Object holding keyframe's state, as used in animation.
	 */
	self.getKeyframeState = function(keyframe) {};

	/*
	 * I/P: 	startKeyframe : 	Keyframe to lerp from.
	 *			endKeyframe : 		Keyframe to lerp to.
	 *			interp : 			Amount to interpolate.
	 * Creates a linearly interpolated state between start and end keyframes.
	 * O/P: 	state : 			Object holding lerped keyframe's state, as used in animation.
	 */
	self.lerpState = function(startKeyframe, endKeyframe, interp) {};

}

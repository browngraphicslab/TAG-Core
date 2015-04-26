window.ITE = window.ITE || {};

/*
 * I/P: 	trackData : 	Holds data on the track, such as duration.
 *			player : 		Reference to actual DOM-related ITE player.
 *			timeManager : 	Reference to common clock for player.
 *			orchestrator : 	Reference to common orchestrator, which informs tracks of actions.
 * Provider for an ink track. 
 * ATTACHED INKS MUST ALWAYS BE AT THE END OF THE JSON FILE
 * 
 * Model of state:
 * 	{
 * 		opacity : 		Opacity of the image. 
 *		inkData : 		Ink data.
 *		time : 			(OPTIONAL) Actual elapsed time, from timeManager. Read-only.
 * 	}
 * O/P: 	none
 */
ITE.InkProvider = function (trackData, player, timeManager, orchestrator) {

	// Extend class from ProviderInterfacePrototype.
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(trackData, player, timeManager, orchestrator),
		self 		= this;
	Utils.extendsPrototype(this, _super);

	// Creates the field "self.keyframes", an AVL tree of keyframes arranged by "keyframe.time" field.
    self.loadKeyframes(trackData.keyframes);

    // DOM related.
    var _UIControl,
   		_attachedAsset;

   	//Some other things to expose 
    self._UIControl = _UIControl;
    self._ink;

   	// Various animation/manipulation variables.
	self.interactionAnimation;

	// Start things up...
    initialize();

    ///////////////////////////////////////////////////////////////////////////
	// ProviderInterface functions.
	///////////////////////////////////////////////////////////////////////////

    /*
	 * I/P: 	none
	 * Initializes track, creates UI, and attaches handlers.
	 * O/P: 	none
	 */
	function initialize() {
		_super.initialize();

		// Create UI and append to ITEHolder.
		_UIControl	= $(document.createElement("div"))
			.addClass("UIControl")
			.css({
				"width": "100%",
				"height": "100%",
				"background":"transparent",
				"pointer-events":"none",
			})
	        .attr("id", trackData.assetUrl);
		$("#ITEHolder").append(_UIControl);

		// Create ink object.
		self._ink = new tagInk(trackData.assetUrl, _UIControl[0]);
		if ((trackData.experienceReference !== "null") && (trackData.experienceReference !== '')) {
			_attachedAsset = findAttachedAsset(trackData.experienceReference);
			attachToAsset(_attachedAsset);
		};

		// Get first and last keyframes and set state to first.
		self.firstKeyframe = self.keyframes.min();
		self.lastKeyframe = self.keyframes.max();
		self.setState(self.getKeyframeState(self.firstKeyframe));
	};

	/*
	 * I/P: 	none
	 * Loads actual ink asset.
	 * O/P: 	none
	 */
	self.load = function() {
		_super.load();
		self._ink.loadInk(trackData.datastring);

		// When finished loading, set status to 2 (paused).
		self.status = 2; // TODO: should this be some kind of callback?
	};

	/*
	 * I/P: 	none
	 * Unoads track asset.
	 * O/P: 	none
	 */
	self.unload = function() {
		for(var v in self) {
			v = null;
		}
	};

	/*
	 * I/P: 	endKeyframe : 	(OPTIONAL) if we know what keyframe we are animating to, pass it here.
	 * Plays ink asset.
	 * O/P: 	none
	 */
	self.play = function(endKeyframe) {
		if (self.status === 3) {
			return;
		}
		self.status = 1;

		// Revert to any saved state, get time to start animation.
		var startTime;
		if (self.savedState) {
			startTime = self.savedState.time;
			self.setState(self.savedState);
			self.savedState = null;
		} else {
			startTime = self.timeManager.getElapsedOffset();
		}

		// If the track hasn't started yet, set a trigger.
		if (startTime < self.firstKeyframe.time) {
			var playTrigger = function() { self.play() };
			self.delayStart(self.firstKeyframe.time - startTime, playTrigger);
			return;
		}

		// Get the next keyframe in the sequence and animate.
		var nextKeyframe = endKeyframe || self.getNextKeyframe(startTime);
		if (nextKeyframe) {
			self.animate(nextKeyframe.time - startTime, self.getKeyframeState(nextKeyframe));
		}
	};

	/*
	 * I/P: 	none
	 * Pauses ink asset.
	 * O/P: 	none
	 */
	self.pause = function() {
		if (self.status === 3) {
			return;
		}
		self.status = 2;

		self.stopDelayStart();

		self.getState();
		if (self.animation) {
			self.animation.kill();
		}
	};

	/*
	 * I/P: 	none
	 * Pauses track and changes its state based on new time from timeManager.
	 * O/P: 	nextKeyframe : 		The next keyframe to play to, if the track is playing, or null otherwise.
	 */
	self.seek = function() {
		if (self.status === 3) {
			return null;
		}

		var seekTime = self.timeManager.getElapsedOffset(); // Get the new time from the timerManager.
		var prevStatus = self.status; // Store what we were previously doing.
		self.pause(); // Stop any animations and stop the delayStart timer.
		self.savedState = null; // Erase any saved state.
		var nextKeyframe = null; // Where to animate to, if animating.

		// Sought before track started.
		if (seekTime < self.firstKeyframe.time) {
			self.setState(self.getKeyframeState(self.firstKeyframe));
		} 
 
		// Sought after track ended.
		else if (seekTime > self.lastKeyframe.time) {
			self.setState(self.getKeyframeState(self.lastKeyframe));
		}

		// Sought in the track's content.
		else {
			// Update the state based on seeking.
			var surKeyframes = self.getSurroundingKeyframes(seekTime);
			var interp = 0;
			if (surKeyframes[1].time - surKeyframes[0].time !== 0) {
				interp = (self.timeManager.getElapsedOffset() - surKeyframes[0].time) / (surKeyframes[1].time - surKeyframes[0].time);
			}
			var soughtState = self.lerpState(surKeyframes[0], surKeyframes[1], interp);
			self.setState(soughtState);
			nextKeyframe = surKeyframes[1];
		}
		return nextKeyframe;
	};

	/* 
	 * I/P: 	duration : 		Length of time animation should take, in milliseconds.
	 * 			state : 		State to animate to, from current state.
	 * Animates from current state to provided state in specified duration.
	 * O/P: 	none
	 */
	self.animate = function(duration, state) {
		// OnComplete function.
		state.onComplete = function () {
			self.play(self.getNextKeyframe(self.timeManager.getElapsedOffset()));
		};

		// Animation.
		self.animation = TweenLite.to(
			// What object to animate.
			_UIControl, 
			// Duration of animation.
			duration, 
			// New state for animation.
			state);	
		self.animation.play();
	};   

    /*
	 * I/P: 	none
	 * Grabs current actual state of ink, and sets savedState to it.
	 * O/P: 	state : 	Object holding track's current state, as used in animation.
	 */
	self.getState = function() {
		self.savedState = {
			//displayNumber	: self.getPreviousKeyframe().displayNumber,
			time			: self.timeManager.getElapsedOffset(),
			opacity			: window.getComputedStyle(_UIControl[0]).opacity,
			inkData			: trackData.string
		};	
		return self.savedState;
	};

    /*
	 * I/P: 	state :		State to make actual ink reflect.
	 * Sets properties of the ink to reflect the input state.
	 * O/P: 	none
	 */
	self.setState = function(state) {
		_UIControl.css({
			"opacity":		state.opacity
		});
	};

	/* 
	 * I/P: 	keyframe : 			Keyframe to extract state from.
	 * Extracts the state information from this keyframe and returns it.
	 * O/P: 	state : 			Object holding keyframe's state, as used in animation.
	 */
	self.getKeyframeState = function(keyframe) {
		var state = {
						"opacity"	: keyframe.opacity,
						"inkData" 	: trackData.string
					};
		return state;
	}

	/*
	 * I/P: 	startKeyframe : 	Keyframe to lerp from.
	 *			endKeyframe : 		Keyframe to lerp to.
	 *			interp : 			Amount to interpolate.
	 * Creates a linearly interpolated state between start and end keyframes.
	 * O/P: 	state : 			Object holding lerped keyframe's state, as used in animation.
	 */
	self.lerpState = function(startKeyframe, endKeyframe, interp) {
		if (!endKeyframe) {
			return self.getKeyframeState(startKeyframe);
		}
		
		var lerpOpacity = startKeyframe.opacity + (interp * (endKeyframe.opacity - startKeyframe.opacity));
		var state = {
						"opacity"	: lerpOpacity,
						"inkData"	: trackData.string
					};
		return state;
	};

	///////////////////////////////////////////////////////////////////////////
	// InkProvider functions.
	///////////////////////////////////////////////////////////////////////////

    /*
	 * I/P: 	experienceReference : 	Name of attached asset for the ink track.
	 * Finds the attached asset for the ink track (the track to attach the ink to).
	 * O/P: 	_attachedAsset : 		Actual reference to the track that holds self asset.
	 */
	function findAttachedAsset(experienceReference) {
		var j,
			track;

		//Loop through trackManager to find the asset whose name matches the Ink's experienceReference
		for (j = 0; j < self.orchestrator.trackManager.length; j++) {
			track = self.orchestrator.trackManager[j];
			if (track.trackData.name === experienceReference){
				_attachedAsset = track;
			};
		};

		//If it exists, return it, and if now, throw an error
		if (_attachedAsset) {
			return _attachedAsset;
		} else {
			console.log("Failed to find asset '" + experienceReference + "' for attached ink '" + trackData.name + "'");
		};
	};
	self.findAttachedAsset = findAttachedAsset;
	/*
	 * I/P: 	assetName : 		Name of asset to attach from Ink.
	 * Attaches this ink to the provided asset.
	 * O/P: 	none
	 */
	function attachToAsset(assetName){
		//When we add the ink to the attached asset, we set an intial keyframe. This keyframe is the first OF THE INK, not of the attached asset. VERY IMPORTANT.
		//We then call two tagink functions, setInitKeyframeData() and retrieveOrigDims()
		//The first takes in the the in dimensions in relative coordinates, and the second initializes a bunch of variables in tagink. 

		//Then, when you animate (so on every timertick), call _adjustViewBox with ABSOLUTE coordinates of the artwork.

		_attachedAsset.addInk(self);
	};
	self.attachToAsset = attachToAsset;
	
    /*
	 * I/P: 	index
	 * sets the track to the provided z-index
	 * O/P: 	none
	 */
    function setZIndex(index){
    	//set the z index to be -1 if the track is not displayed
		if (window.getComputedStyle(_UIControl[0]).opacity == 0){
			_UIControl.css("z-index", -1)
		} 
		else //Otherwise set it to its correct z index
		{
			_UIControl.css("z-index", index)
		}
    	self.zIndex = index
    }
    self.setZIndex = setZIndex;
};


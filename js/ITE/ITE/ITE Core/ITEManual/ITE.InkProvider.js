window.ITE = window.ITE || {};
//ATTACHED INKS MUST ALWAYS BE AT THE END OF THE JSON FILE

// ITE.InkProvider = function (trackData, player, taskManager, orchestrator){
ITE.InkProvider = function (trackData, player, timeManager, orchestrator){
	//Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(trackData, player, timeManager, orchestrator),
		self 		= this;

	Utils.extendsPrototype(this, _super);

    self.loadKeyframes(trackData.keyframes);

	self.player 		= player;
	// self.taskManager 	= taskManager;
	self.timeManager	= timeManager;
	self.trackStartTime = 0;
	self.trackData 		= trackData;
	self.orchestrator	= orchestrator;
	self.status 		= 3;
	//self.savedState		= keyframes[0];
	self.interactionAnimation;
	self.trackData   			= trackData;

    //DOM related
    var _ink,
    	_UIControl,
   		_attachedAsset;
	//Start things up...
    initialize()

   /** 
	* I/P: none
	* Initializes track, creates UI
	*/
	function initialize(){
		_super.initialize()

		if (trackData.experienceReference !== "null"){
			_attachedAsset = findAttachedAsset(trackData.experienceReference);
			attachToAsset(_attachedAsset);
		};

		//Create UI and append to ITEHolder
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

		_ink = new tagInk(trackData.assetUrl, _UIControl[0]);

		var keyframesArray = self.keyframes.getContents();
		self.setState(keyframesArray[0]);
		self.trackStartTime = keyframesArray[0].time;
		self.status = 2;
	};

	self.getKeyframeState = function(keyframe) {
		var state = {
						"opacity"	: keyframe.opacity,
						"inkData" 	: trackData.string
					};
		return state;
	}

	/** 
	* I/P: 	startKeyframe: 	keyframe to lerp from.
			endKeyframe: 	keyframe to lerp to.
			interp: 		amount to interpolate.
	* Creates a linearly interpolated state between start and end keyframes.
	* O/P: state information (used in animation) from lerped keyframe.
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


   /** 
	* I/P: experienceReference name of asset to attach from Ink
	* Finds the attached asset for the ink track (the track to attach the ink to)
	* O/P: _attachedAsset Actual reference to the track that holds self asset
	*/
	function findAttachedAsset(experienceReference){
		var j,
			track;
		//Loop through trackManager to find the asset whose name matches the Ink's experienceReference
		for (j=0; j<self.orchestrator.trackManager.length; j++) {
			track = self.orchestrator.trackManager[j];
			if (track.trackData.name === experienceReference){
				_attachedAsset = track;
			};
		};
		//If it exists, return it, and if now, throw an error
		if (_attachedAsset) {
			return _attachedAsset;
		} else {
			throw new Error("Failed to find asset '" + experienceReference+ "' for attached ink '" + trackData.name + "'");
		};
	};


	function attachToAsset(assetName){
		_attachedAsset.addInk(self);
	};

   /** 
	* I/P: none
	* Loads actual image asset, and sets status to paused when complete
	* O/P: none
	*/
	self.load = function(){
			_super.load()
			_ink.loadInk(trackData.string);
	};

   /** 
	* I/P: none
	* Grabs current actual state of image, and sets savedState to it 
	* returns savedState
	* O/P: savedState
	*/
	self.getState = function(){
		self.savedState = {
			//displayNumber	: self.getPreviousKeyframe().displayNumber,
			time			: self.timeManager.getElapsedOffset(),
			opacity			: window.getComputedStyle(_UIControl[0]).opacity,
			inkData			: trackData.string
		};	
		return self.savedState;
	};

   /**
	* I/P: state	state to make actual image reflect
	* Sets properties of the image to reflect the input state
	* O/P: none
	*/
	self.setState = function(state){
		_UIControl.css({
			"opacity":		state.opacity
		});
	};

	/** 
	* I/P: endKeyframe: if we know what keyframe we are animating to, pass it here.
	* Plays audio asset
	* O/P: none
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

		// Get the next keyframe in the sequence and animate.
		var nextKeyframe = endKeyframe || self.getNextKeyframe(startTime);
		self.animate(nextKeyframe.time - startTime, self.getKeyframeState(nextKeyframe));
	};

	/** 
	* I/P: none
	* Pauses ink asset
	* O/P: none
	*/
	self.pause = function(){
		if (self.status === 3) {
			return;
		}
		self.status = 2;

		self.getState();
		self.animation.kill();
	};

	/** 
	* I/P: none
	* Informs ink asset of seek. TimeManager will have been updated.
	* O/P: none
	*/
	self.seek = function() {
		if (self.status === 3) {
			return;
		}

		// Has this track actually started?
		var seekTime = self.timeManager.getElapsedOffset();
		if (seekTime < self.trackStartTime) {
			return;
		}

		// Erase any saved state.
		var prevStatus = self.status;
		self.pause();
		self.savedState = null;

		// Update the state based on seeking.
		var surKeyframes = self.getSurroundingKeyframes(seekTime);
		var interp = 0;
		if (surKeyframes[1].time - surKeyframes[0].time !== 0) {
			interp = (self.timeManager.getElapsedOffset() - surKeyframes[0].time) / (surKeyframes[1].time - surKeyframes[0].time);
		}
		var soughtState = self.lerpState(surKeyframes[0], surKeyframes[1], interp);
		self.setState(soughtState);

		// Play or pause, depending on state before being sought.
		if (prevStatus === 1) {
			self.play(surKeyframes[1]);
		} 
	};

	/* 
	I/P: none
	interpolates between current state and next keyframe
	O/P: none
	*/
	self.animate = function(duration, state){
		self.animation = TweenLite.to(_UIControl, duration, state);		
		self.animation.play();
	};

	self.findAttachedAsset = findAttachedAsset;
	self.attachToAsset = attachToAsset;
	self._UIControl = _UIControl;
};

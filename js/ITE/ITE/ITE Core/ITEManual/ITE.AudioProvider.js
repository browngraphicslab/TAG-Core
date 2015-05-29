window.ITE = window.ITE || {};

/*
 * I/P: 	trackData : 	Holds data on the track, such as duration.
 *			player : 		Reference to actual DOM-related ITE player.
 *			timeManager : 	Reference to common clock for player.
 *			orchestrator : 	Reference to common orchestrator, which informs tracks of actions.
 * Provider for an audio track. 
 * 
 * Model of state:
 * 	{
 * 		volume :		Value for track (not control) volume in range [0-1].
 * 		audioOffset	:	(OPTIONAL) Time offset value in milliseconds from beginning of
 *						track. Used only in seeking. Normal keyframes shouldn't use this,
 *						as it could cause tiny audio jumps at the keyframes. 
 *		time : 			(OPTIONAL) Actual elapsed time, from timeManager. Read-only.
 * 	}
 * O/P: 	none
 */
ITE.AudioProvider = function (trackData, player, timeManager, orchestrator) {
"use strict";
	// Extend class from ProviderInterfacePrototype.
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(trackData, player, timeManager, orchestrator),
		self 		= this;
	Utils.extendsPrototype(this, _super);

	// Creates the field "self.keyframes", an AVL tree of keyframes arranged by "keyframe.time" field.
	self.loadKeyframes(trackData.keyframes);
	self.type = "audio";

    // DOM related.
    var _audio,
    	_UIControl,
    	_audioControls;
    self._UIControl = _UIControl;

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
		_audio		= $(document.createElement("audio"))
			.addClass("assetAudio");
		_audioControls = _audio[0];
		_UIControl	= $(document.createElement("div"))
			.addClass("UIControl")
			.append(_audio);
		$("#ITEHolder").append(_UIControl);
		self._UIControl = _UIControl;

		// Get first and last keyframes.
		self.firstKeyframe = self.keyframes.min();
		self.lastKeyframe = self.keyframes.max();
	};

	/*
	 * I/P: 	none
	 * Loads actual audio asset, and sets status to paused (2) when complete.
	 * O/P: 	none
	 */
	self.load = function() {
		_super.load();

		// Sets the image’s URL source.
		_audio.attr({
			"src"	: self.trackData.assetUrl,
			"type" 	: self.trackData.type
		});

		// Ensure that the audio is completely loaded.
		_audioControls.addEventListener("canplay", function() {
			// Update first state.
			self.setState(self.getKeyframeState(self.firstKeyframe));

			// When finished loading, set status to 2 (paused).
			self.status = 2; 

			//Tell orchestrator to play (if other tracks are ready)
			self.orchestrator.playWhenAllTracksReady()
		});

		// // Ensure that the audio is completely loaded.
		// function monitor(timeWaited) {
		// 	timeWaited = timeWaited || 0;
		// 	if (timeWaited > 2000) {
		// 		console.log("Audio failed to load!");
		// 	}
		// 	else if (_audioControls.readyState !== 4) {
		// 		setTimeout(function(){ monitor(timeWaited+100); }, 100);
		// 	}
		// };
		// monitor();

		// // Update first state.
		// self.setState(self.getKeyframeState(self.firstKeyframe));

		// // When finished loading, set status to 2 (paused).
		// self.status = 2;
	};

	/*
	 * I/P: 	none
	 * Unoads track asset.
	 * O/P: 	none
	 */
	self.unload = function() {
		self.pause();
		_UIControl.remove()
		for(var v in self) {
			v = null;
		}
	};

	/*
	 * I/P: 	endKeyframe : 	(OPTIONAL) if we know what keyframe we are animating to, pass it here.
	 * Plays audio asset.
	 * O/P: 	none
	 */
	self.play = function(endKeyframe) {
		_audioControls.pause();
		
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

		//If the current time is after the last keyframe of the deepzoom, don't do anything
		if (this.lastKeyframe.time < self.timeManager.getElapsedOffset()){
			return;
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

		_audioControls.play();
	};

	/* 
	 * I/P: 	none
	 * Pauses audio asset.
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
			self.animation.stop();
		}
		_audioControls.pause();
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
			soughtState.audioOffset = seekTime - self.firstKeyframe.time;
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
		self.animation =_audio.animate(
			// Change volume.
			{
				volume: state.volume * self.player.currentVolumeLevel
			}, 
			// Duration of animation.
			duration * 1000,
			// OnComplete function.
			function() {
				self.play(self.getNextKeyframe(self.timeManager.getElapsedOffset()));
			}
		);	
	};

    /*
	 * I/P: 	none
	 * Grabs current actual state of audio, and sets savedState to it.
	 * O/P: 	state : 	Object holding track's current state, as used in animation.
	 */
	self.getState = function() {
		self.savedState = {
			//displayNumber	: self.getPreviousKeyframe().displayNumber,
			time			: self.timeManager.getElapsedOffset(),
			volume			: _audioControls.volume,
			audioOffset		: _audioControls.currentTime
		};	
		return self.savedState;
	};

    /*
	 * I/P: 	state :		State to make actual audio reflect.
	 * Sets properties of the audio to reflect the input state.
	 * O/P: 	none
	 */
	self.setState = function(state) {
		_audioControls.volume = state.volume * self.player.currentVolumeLevel;
		if (state.audioOffset) {
			_audioControls.currentTime = parseFloat(state.audioOffset);
		}
	};

	/* 
	 * I/P: 	keyframe : 			Keyframe to extract state from.
	 *			setAudioOffset : 	(OPTIONAL) set to true if we want to include the audioOffset field.
	 * Extracts the state information from this keyframe and returns it.
	 * O/P: 	state : 			Object holding keyframe's state, as used in animation.
	 */
	self.getKeyframeState = function(keyframe, setAudioOffset) {
		var state = {
						"volume"	: keyframe.volume 
					};
		if (setAudioOffset) {
			state.audioOffset = keyframe.time - self.firstKeyframe.time
		}
		return state;
	};

	/*
	 * I/P: 	startKeyframe : 	Keyframe to lerp from.
	 *			endKeyframe : 		Keyframe to lerp to.
	 *			interp : 			Amount to interpolate.
	 *			setAudioOffset : 	(OPTIONAL) True if we want to include the audioOffset field.
	 * Creates a linearly interpolated state between start and end keyframes.
	 * O/P: 	state : 			Object holding lerped keyframe's state, as used in animation.
	 */
	self.lerpState = function(startKeyframe, endKeyframe, interp, setAudioOffset) {
		if (!endKeyframe) {
			return self.getKeyframeState(startKeyframe);
		}

		var lerpVolume = startKeyframe.volume + (interp * (endKeyframe.volume - startKeyframe.volume));
		var state = {
						"volume"	: lerpVolume
					};
		if (setAudioOffset) {
			state.audioOffset = startKeyframe.time + (interp * (endKeyframe.time - startKeyframe.time));
		}
		return state;
	};

	///////////////////////////////////////////////////////////////////////////
	// AudioProvider functions.
	///////////////////////////////////////////////////////////////////////////

    /*
	 * I/P: 	none
	 * Creates defauly keyframes for the track
	 * O/P: 	none
	 */
	function createDefaultKeyframes() {
		var i;
		for (i = 0; i < 4; i++){
			var keyframe = {
				"dispNum": 0,
				"time": i,
				"audioOffset": 0,
				"volume": 1
			}
			self.keyframes.add(keyframe)
		}
	};
	self.createDefaultKeyframes = createDefaultKeyframes

	/* 
	 * I/P: 	newVolume : 	 new volume set by user via UI
	 * Sets the current volume to the newVolume * value from keyframes, and then animates the audio to the next keyframe 
	 * O/P: 	none
	 */
	self.setVolume = function(newVolume) {
		if (newVolume === 0) {
			self.toggleMute();
		} else {	
			// Update the volume.
			_audioControls.volume = _audioControls.volume * newVolume / self.player.previousVolumeLevel;
			
			// If playing, reset the animation.
			if (self.status === 1) {
				self.animation.stop();
				self.play();
				// // Duration of current time to next keyframe.
				// var duration = self.currentAnimationTask.nextKeyframeTime - self.taskManager.timeManager.getElapsedOffset();
	
				// // Stop current animation.
				// self.animation.stop();
			
				// // Animate to the next keyframe
				// self.animation =_audio.animate({
				// 	volume: self.currentAnimationTask.nextKeyframeData.volume*newVolume
				// }, duration*1000);
			}
		}
	};

	/* 
	 * I/P: 	isMuted : 	 Whether or not tour is now muted
	 * Mutes or unmutes tour.
	 * O/P: 	none
	 */
	self.toggleMute = function(isMuted) {
		if (isMuted) { 
			_audioControls.muted = true;
		} else {
			_audioControls.muted = false;
		} 
	};


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
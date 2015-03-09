/*
 * Model of AudioProvider state:
 * {
 * 		volume :		Value for track (not control) volume in range [0-1].
 * 		audioOffset	:	(OPTIONAL) Time offset value in milliseconds from beginning of
 *						track. Used only in seeking. Normal keyframes shouldn't use this,
 *						as it could cause tiny audio jumps at the keyframes. 
 * }
 */

window.ITE = window.ITE || {};

// ITE.AudioProvider = function (trackData, player, taskManager, orchestrator){
ITE.AudioProvider = function (trackData, player, timeManager, orchestrator){
"use strict";

	//Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(trackData, player, timeManager, orchestrator),
		self 		= this;

	Utils.extendsPrototype(this, _super);

	// Creates the field "self.keyframes", an AVL tree of keyframes arranged by "keyframe.time" field.
    self.loadKeyframes(trackData.keyframes);

    // Common stuff.
	self.player 		= player;		// Actual DOM-related ITE player.
	self.timeManager	= timeManager;	// Reference to common clock for player.
	self.orchestrator	= orchestrator;	// Reference to common orchestrator, which informs tracks of actions.

	// Track data.
	self.animation;						// The animation of this track.
	self.trackStartTime = 0;			// Taken from the "time" field of the first keyframe. Will be set in initialization.
	self.trackData 		= trackData;	// Holds data on the track, such as duration.
	self.status 		= 3;			// Status: 	1) PLAYING
										//			2) PAUSED
										//			3) LOADING
										// 			4) BUFFERING

    // DOM related
    var _audio,
    	_UIControl,
    	_audioControls;

	// Start things up...
    initialize();

   /** 
	* I/P: none
	* Initializes track, creates UI, and attachs handlers
	* O/P: none
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

		// Initialize the state to that of the first keyframe, and set track start time.
		var firstKeyframe = self.keyframes.min();
		self.setState(getKeyframeState(firstKeyframe));

		// Set the starting time of the track.
		self.trackStartTime = firstKeyframe.time; 

		// Ready to go.
		self.status = 2;
	};

	/** 
	* I/P: 	keyframe : 			keyframe to extract state from
	*		setAudioOffset : 	(OPTIONAL) set to true if we want to include the audioOffset field.
	* Extracts the state information from this keyframe and returns it.
	* O/P: 	state information (used in animation) from keyframe.
	*/
	self.getKeyframeState = function(keyframe, setAudioOffset) {
		var state = {
						"volume"	: keyframe.volume 
					};
		if (setAudioOffset) {
			state.audioOffset = keyframe.time - self.trackStartTime
		}
		return state;
	};

	/** 
	* I/P: 	startKeyframe : 	keyframe to lerp from.
	*		endKeyframe : 		keyframe to lerp to.
	*		interp : 			amount to interpolate.
	*		setAudioOffset : 	(OPTIONAL) set to true if we want to include the audioOffset field.
	* Creates a linearly interpolated state between start and end keyframes.
	* O/P: 	state information (used in animation) from lerped keyframe.
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


   /** 
	* I/P: none
	* Loads actual audio asset, and sets status to paused when complete
	* O/P: none
	*/
	self.load = function(){
		_super.load()

		// Sets the image’s URL source
		_audio.attr({
			//"src"	: itePath + "Assets/TourData/"  + self.trackData.assetUrl,
			"src"	: self.trackData.assetUrl,
			"type" 	: self.trackData.type
		});

		// When audio has finished loading, set status to “paused”, and position element where it should be for the first keyframe
		_audio.onload = function (event) { //Is self ever getting called?
			self.setStatus(2);
			self.setState(self.keyframes.min());
		};
	};

   /** 
	* I/P: none
	* Grabs current actual state of audio, and sets savedState to it 
	* returns savedState
	* O/P: 	state information (used in animation) the track is currently at.
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

   /**
	* I/P: 	state :		state to make actual audio reflect
	* Sets properties of the image to reflect the input state
	* O/P: none
	*/
	self.setState = function(state) {
		_audioControls.volume = state.volume;
		if (state.audioOffset) {
			_audioControls.currentTime = parseFloat(state.audioOffset);
		}
	};

 	/** 
	* I/P: 	endKeyframe : 	(OPTIONAL) if we know what keyframe we are animating to, pass it here.
	* Plays audio asset.
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
		if (nextKeyframe) {
			self.animate(nextKeyframe.time - startTime, self.getKeyframeState(nextKeyframe));
		}

		_audioControls.play();
	};

	/** 
	* I/P: none
	* Pauses audio asset
	* O/P: none
	*/
	self.pause = function(){
		if (self.status === 3) {
			return;
		}
		self.status = 2;

		self.getState();
		self.animation.stop();
		_audioControls.pause();
	};

	/** 
	* I/P: none
	* Informs audio asset of seek. TimeManager will have been updated.
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
		soughtState.audioOffset = seekTime - self.trackStartTime;
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
	self.animate = function(duration, state) {
		self.animation =_audio.animate(
			{
				volume: state.volume * self.player.currentVolumeLevel
			}, 
			duration * 1000,
			function() {
				self.play(self.getNextKeyframe(self.timeManager.getElapsedOffset()));
			}
		);	
	};


	/* 
	* I/P: newVolume 	 new volume set by user via UI
	* Sets the current volume to the newVolume * value from keyframes, and then animates the audio to the next keyframe 
	* O/P: none
	*/
	self.setVolume = function(newVolume) {
		if (newVolume === 0) {
			self.toggleMute()
		} else {	
			//Set volume to newVolume * value from keyframes

			_audioControls.volume = _audioControls.volume*newVolume/self.player.previousVolumeLevel;
			
			if (self.orchestrator.status === 1){

				//Duration of current time to next keyframe
				var duration = self.currentAnimationTask.nextKeyframeTime - self.taskManager.timeManager.getElapsedOffset();
	
				//Stop current animation
				self.animation.stop();
			
				//Animate to the next keyframe
				self.animation =_audio.animate({
					volume: self.currentAnimationTask.nextKeyframeData.volume*newVolume
				}, duration*1000);
			}
		}
	};



	/* 
	* I/P: isMuted 	 boolean, whether or not tour is now muted
	* mutes or unmutes tour
	* O/P: none
	*/
	self.toggleMute = function(isMuted){
		isMuted? _audioControls.muted = true : _audioControls.muted = false;
	}

};
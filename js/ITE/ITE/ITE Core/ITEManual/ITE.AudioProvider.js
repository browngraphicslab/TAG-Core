window.ITE = window.ITE || {};

ITE.AudioProvider = function (trackData, player, taskManager, orchestrator){
"use strict";
console.log("loading audio track")
	//Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(),
		self 		= this;

	Utils.extendsPrototype(this, _super);

    var keyframes       = trackData.keyframes;   // Data structure to keep track of all displays/keyframes

	self.player 		= player;
	self.taskManager 	= taskManager;
	self.trackData 		= trackData;
	self.orchestrator	= orchestrator;
	self.status 		= "loading";
	self.savedState		= keyframes[0];
	self.animation;

	this.trackData   			= trackData;

    //DOM related
    var _audio,
    	_UIControl,
    	_audioControls;

	//Start things up...
    initialize()

   /** 
	* I/P: none
	* Initializes track, creates UI, and attachs handlers
	* O/P: none
	*/
	function initialize(){
		_super.initialize()

		//Create UI and append to ITEHolder
		_audio		= $(document.createElement("audio"))
			.addClass("assetAudio");

		_audioControls = _audio[0];

		_UIControl	= $(document.createElement("div"))
			.addClass("UIControl")
			.append(_audio);

		$("#ITEHolder").append(_UIControl);

		var i, keyframeData;

		for (i=1; i<keyframes.length; i++) {
			keyframeData={
						  "volume"	: keyframes[i].volume 
						};
			self.taskManager.loadTask(keyframes[i-1].time, keyframes[i].time, keyframeData, _UIControl, self);
		}
		self.status = "ready";
	};


   /** 
	* I/P: none
	* Loads actual audio asset, and sets status to paused when complete
	* O/P: none
	*/
	this.load = function(){
		_super.load()

		//Sets the image’s URL source
		_audio.attr({
			//"src"	: itePath + "Assets/TourData/"  + this.trackData.assetUrl,
			"src"	: this.trackData.assetUrl,
			"type" 	: this.trackData.type
		})
		// When audio has finished loading, set status to “paused”, and position element where it should be for the first keyframe
		_audio.onload = function (event) {//Is this ever getting called?
			this.setStatus(2);
			this.setState(keyframes[0]);
		};
	};

   /** 
	* I/P: none
	* Grabs current actual state of audio, and sets savedState to it 
	* returns savedState
	* O/P: savedState
	*/
	this.getState = function(){
		self.savedState = {
			//displayNumber	: this.getPreviousKeyframe().displayNumber,
			time			: self.taskManager.timeManager.getElapsedOffset(),
			volume			: _audioControls.volume,
			audioOffset		: _audioControls.currentTime
		};	
		return self.savedState;
	};

   /**
	* I/P: state	state to make actual audio reflect
	* Sets properties of the image to reflect the input state
	* O/P: none
	*/
	this.setState = function(state){
		_audioControls.volume = state.volume;
		state.audioOffset ? (_audioControls.currentTime = parseFloat(state.audioOffset)) : 0
	};

 	/** 
	* I/P: none
	* Plays audio asset
	* O/P: none
	*/
	this.play = function(targetTime, data){
		console.log("PLAYING?!")
		_super.play.call(self, targetTime, data);
		_audioControls.play();
	}

	this.pause = function(){
		// Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		this.getState();
		self.animation.stop();
		_audioControls.pause()
	}


	/* 
	* I/P: newVolume 	 new volume set by user via UI
	* Sets the current volume to the newVolume * value from keyframes, and then animates the audio to the next keyframe 
	* O/P: none
	*/
	this.setVolume = function(newVolume){
		if (newVolume === 0) {
			this.toggleMute()
		} else {	
			//Set volume to newVolume * value from keyframes

			_audioControls.volume = _audioControls.volume*newVolume/self.player.previousVolumeLevel;
			
			if (this.orchestrator.status === 1){

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
	this.toggleMute = function(isMuted){
		isMuted? _audioControls.muted = true : _audioControls.muted = false;
	}


	/* 
	I/P: none
	interpolates between current state and next keyframe
	O/P: none
	*/
	this.animate = function(duration, state){
		self.animation =_audio.animate({
			volume: state.volume*self.player.currentVolumeLevel
		}, duration*1000);	};
};
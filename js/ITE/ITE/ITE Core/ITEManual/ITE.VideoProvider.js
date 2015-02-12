window.ITE = window.ITE || {};

ITE.VideoProvider = function (trackData, player, taskManager, orchestrator){

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
	self.audioAnimation;

	var interactionHandlers 	= {},
	movementTimeouts 			= [];
    //DOM related
    var _video,
    	_UIControl,
    	_videoControls;

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
		_video		= $(document.createElement("video"))
			.addClass("assetVideo");

		_videoControls = _video[0];

		_UIControl	= $(document.createElement("div"))
			.addClass("UIControl")
			.append(_video);

		$("#ITEHolder").append(_UIControl);

		var i, keyframeData;

		for (i=1; i<keyframes.length; i++) {
			keyframeData={
						  "opacity"	: keyframes[i].opacity,
						  "pos" : {
						  	"top"	: (500*keyframes[i].pos.y/100) + "px",
						  	"left"	: (1000*keyframes[i].pos.x/100) + "px"
						  },
						  "size" : {
						  	"width"	: (1000*keyframes[i].size.x/100) + "px"
						  },
						  "volume"	: keyframes[i].volume
						};
			self.taskManager.loadTask(keyframes[i-1].time, keyframes[i].time, keyframeData, _UIControl, self);
		}
		self.status = "ready";

		//Attach Handlers
		attachHandlers() 
	};


   /** 
	* I/P: none
	* Loads actual video asset, and sets status to paused when complete
	* O/P: none
	*/
	this.load = function(){
		_super.load()

		//Sets the image’s URL source
		_video.attr({
			"src"	: itePath + "Assets/TourData/" + self.trackData.assetUrl,
			"type" 	: self.trackData.type
		})

		_videoControls.load()
		// When image has finished loading, set status to “paused”, and position element where it should be for the first keyframe
		_video.onload = function (event) {//Is this ever getting called?
			this.setStatus(2);
			this.setState(keyframes[0]);
		};
	};

   /** 
	* I/P: none
	* Grabs current actual state of video, and sets savedState to it 
	* returns savedState
	* O/P: savedState
	*/
	this.getState = function(){
		self.savedState = {
			//displayNumber	: this.getPreviousKeyframe().displayNumber,
			time			: self.taskManager.timeManager.getElapsedOffset(),
			opacity			: window.getComputedStyle(_UIControl[0]).opacity,
			pos : {
				left		: _UIControl.position().left,
				top 		: _UIControl.position().top
			},
			size: {
				width	: _UIControl.width()
			},
			videoOffset	: _videoControls.currentTime,
			volume		: _videoControls.volume/self.player.currentVolumeLevel
		};	
		return self.savedState;
	};

   /**
	* I/P: state	state to make actual video reflect
	* Sets properties of the image to reflect the input state
	* O/P: none
	*/
	this.setState = function(state){
		_UIControl.css({
			"left":			state.pos.left,
			"top":			state.pos.top,
			"width":		state.size.width,
			"opacity":		state.opacity
		});
		_videoControls.volume = state.volume*self.player.currentVolumeLevel;
		state.videoOffset ? (_videoControls.currentTime = parseFloat(state.videoOffset)) : 0
	};

 	/** 
	* I/P: none
	* Plays video asset
	* O/P: none
	*/
	this.play = function(targetTime, data){
		_super.play.call(self, targetTime, data);
		_videoControls.play();
		_videoControls.hasAttribute("controls") ? _videoControls.removeAttribute("controls") : null;
	}

	this.pause = function(){
		// Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		this.getState();
		self.animation.kill();
		self.audioAnimation.stop();
		_videoControls.pause()
		_videoControls.setAttribute("controls", "controls")
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
			_videoControls.volume = _videoControls.volume*newVolume/self.player.previousVolumeLevel;
			
			if (this.orchestrator.status === 1){

				//Duration of current time to next keyframe
				var duration = self.currentAnimationTask.nextKeyframeTime - self.taskManager.timeManager.getElapsedOffset();
	
				//Stop current animation
				self.audioAnimation.stop();
			
				//Animate to the next keyframe
				self.audioAnimation =_video.animate({
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
		isMuted? _videoControls.muted = true : _videoControls.muted = false;
	}

	/* 
	I/P: none
	interpolates between current state and next keyframe
	O/P: none
	*/
	this.animate = function(duration, state){
		self.animation = TweenLite.to(_UIControl, duration, {
			"left":			state.pos.left,
			"top":			state.pos.top,
			"width":		state.size.width,
			"opacity":		state.opacity
		});
		self.animation.play();
		self.audioAnimation =_video.animate({
			volume: state.volume*self.player.currentVolumeLevel
		}, duration*1000);
	};

	/* 
	* I/P: inkTrack ink track to attach to this asset
	* Adds ink as an overlay
	* O/P: none
	*/
	this.addInk = function(inkTrack){
		console.log("adding "+ inkTrack.trackData.name + " as an overlay in a video")
	};

   /** 
	* I/P: none
	* Return a set of interactionHandlers attached to asset from provider
	*/
	function getInteractionHandlers(){
		return interactionHandlers;
	}
 
    /**
     * I/P {Object} res     object containing hammer event info
     * Drag/manipulation handler for associated media
     * Manipulation for touch and drag events
     */
    function mediaManip(res) {
        var top     	= _UIControl.position().top,
            left     	= _UIControl.position().left,
            width     	= _UIControl.width(),
            height     	= _UIControl.height(),
            finalPosition;

        // If the player is playing, pause it
    	(self.orchestrator.status === 1) ? self.player.pause() : null

        // If event is initial touch on artwork, save current position of media object to use for animation
        if (res.eventType === 'start') {
            startLocation = {
                x: left,
                y: top
            };
        }	              
        // Target location (where object should be moved to)
        finalPosition = {
            x: res.center.pageX - (res.startEvent.center.pageX - startLocation.x),
            y: res.center.pageY - (res.startEvent.center.pageY - startLocation.y)
        };   

        // Animate to target location
        self.interactionAnimation && self.interactionAnimation.kill();
        self.interactionAnimation = TweenLite.to(_UIControl, .5, {
        	top: finalPosition.y,
        	left: finalPosition.x
        });		
    }
	

    /**
     * I/P {Number} scale     scale factor
     * I/P {Object} pivot     point of contact (with regards to image container, NOT window)
     * Zoom handler for associated media (e.g., for mousewheel scrolling)
     */
    function mediaScroll(scale, pivot) {
    	var t    	= _UIControl.position().top,
            l    	= _UIControl.position().left,
            w   	= _UIControl.width(),
            h  		= _UIControl.height(),
            newW  	= w * scale,
            newH,
            maxW 	= 1000,        // These values are somewhat arbitrary; TODO determine good values
            minW	= 200,
            newX,
            newY;

    	(self.orchestrator.status === 1) ? self.player.pause() : null

        // Constrain new width
        if((newW < minW) || (newW > maxW)) {
            newW 	= Math.min(maxW, Math.max(minW, newW));
        };

        // Update scale, new X and new Y according to newly constrained values.
        scale 	= newW / w;
        newH	= h * scale;
        newX 	= l + pivot.x*(1-scale);
       	newY 	= t + pivot.y*(1-scale); 

       	//Animate _UIControl to this new position
        self.interactionAnimation && self.interactionAnimation.kill();
        self.interactionAnimation = TweenLite.to(_UIControl, .05, {
        	top: newY,
        	left: newX,
        	width: newW,
        	height: newH
        });	
    }
    

    /** 
	* I/P: none
	* Initializes handlers 
	*/
    function attachHandlers() {
        // Allows asset to be dragged, despite the name
        TAG.Util.disableDrag(_UIControl);

        // Register handlers
        TAG.Util.makeManipulatable(_UIControl[0], {
            onManipulate: mediaManip,
            onScroll:     mediaScroll
        }); 
        interactionHandlers.onManipulate 	= mediaManip;
        interactionHandlers.onScroll		= mediaScroll;    	
    }
};

window.ITE = window.ITE || {};

// ITE.ImageProvider = function (trackData, player, taskManager, orchestrator){
ITE.ImageProvider = function (trackData, player, timeManager, orchestrator){
	//Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(trackData, player, timeManager, orchestrator),
		self 		= this;

	Utils.extendsPrototype(this, _super);

    self.loadKeyframes(trackData.keyframes);

	self.player 		= player;
	// self.taskManager 	= taskManager;
	self.timeManager 	= timeManager;
	self.trackData 		= trackData;
	self.orchestrator	= orchestrator;
	self.status 		= 3;
	// self.savedState		= keyframes[0];
	self.animation,
	self.interactionAnimation;

	interactionHandlers 		= {},
	movementTimeouts 			= [],
	self.trackData   			= trackData;

    //DOM related
    var _image,
    	_UIControl;


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
		_image		= $(document.createElement("img"))
			.addClass("assetImage");

		_UIControl	= $(document.createElement("div"))
			.addClass("UIControl")
			.append(_image);

		$("#ITEHolder").append(_UIControl);

		var keyframesArray = self.keyframes.getContents();
		keyframesArray[0] && _UIControl.css("z-index", keyframesArray[0].zIndex);//TODO: clean self up-- self is just to make sure that the asset has the correct z-index. 
		self.setState(keyframesArray[0]);															// There's also clearly been some mistake if we have to do self check (if there are any keyframes) because why would we have a track with no keyframes...?
		self.status = 2;

		//Attach Handlers
		attachHandlers()

	};

	self.getKeyframeState = function(keyframe) {
		var state = {
						"opacity"	: keyframe.opacity,
						"top"		: (500*keyframe.pos.y/100) + "px",
						"left"		: (1000*keyframe.pos.x/100) + "px",
						"width"		: (1000*keyframe.size.x/100) + "px",
						"height"	: (500*keyframe.size.y/100) + "px"
					};
		return state;
	};

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
		var lerpPosX = startKeyframe.pos.x + (interp * (endKeyframe.pos.x - startKeyframe.pos.x));
		var lerpPosY = startKeyframe.pos.y + (interp * (endKeyframe.pos.y - startKeyframe.pos.y));
		var lerpSizeX = startKeyframe.size.x + (interp * (endKeyframe.size.x - startKeyframe.size.x));
		var lerpSizeY = startKeyframe.size.y + (interp * (endKeyframe.size.y - startKeyframe.size.y));
		var state = {
						"opacity"	: lerpOpacity,
						"top"		: (500 * lerpPosY / 100) + "px",
						"left"		: (1000 * lerpPosX / 100) + "px",
						"width"		: (1000 * lerpSizeX / 100) + "px",
						"height"	: (500 * lerpSizeY / 100) + "px"
					};
		return state;
	};


   /** 
	* I/P: none
	* Loads actual image asset, and sets status to paused when complete
	* O/P: none
	*/
	self.load = function(){
			_super.load()

			//Sets the image’s URL source
			_image.attr("src", self.trackData.assetUrl)
			// When image has finished loading, set status to “paused”, and position element where it should be for the first keyframe
			_image.onload = function (event) {//Is self ever getting called?
					self.setStatus(2);
					self.setState(keyframes.min());
			};
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
			pos : {
				x		: _UIControl.position().left,
				y 		: _UIControl.position().top
			},
			size: {
				y	: _UIControl.height(),
				x	: _UIControl.width()
			},
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
			"left":			state.pos.x,
			"top":			state.pos.y,
			"height":		state.size.y,
			"width":		state.size.x,
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
	* Pauses image asset
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
	* Informs image asset of seek. TimeManager will have been updated.
	* O/P: none
	*/
	self.seek = function() {
		if (self.status === 3) {
			return;
		}

		// Erase any saved state.
		var prevStatus = self.status;
		self.pause();
		self.savedState = null;

		// Update the state based on seeking.
		var surKeyframes = self.getSurroundingKeyframes(self.timeManager.getElapsedOffset());
		var interp = 0;
		if (surKeyframes[1] - surKeyframes[0] !== 0) {
			interp = (self.timeManager.getElapsedOffset() - surKeyframes[0].time) / (surKeyframes[1] - surKeyframes[0]);
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

	/* 
	* I/P: inkTrack ink track to attach to self asset
	* Adds ink as an overlay
	* O/P: none
	*/
	//TODO: implement
	self.addInk = function(inkTrack){
		console.log("position().top: " + _UIControl.position().top)
		console.log("offset().top: " + _UIControl.offset().top)

	};



   /** 
	* I/P: none
	* Return a set of interactionHandlers attached to asset from provider
	*/
	function getInteractionHandlers() {};
 
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

    	if (!res.eventType){
			return    	
		}

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
    };
	

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

       	//Animate _UIControl to self new position
        self.interactionAnimation && self.interactionAnimation.kill();
        self.interactionAnimation = TweenLite.to(_UIControl, .05, {
        	top: newY,
        	left: newX,
        	width: newW,
        	height: newH
        });	
    };
    

    /** 
	* I/P: none
	* Initializes handlers 
	*/
    function attachHandlers() {
        // Allows asset to be dragged, despite the name
        TAG.Util_ITE.disableDrag(_UIControl);

        // Register handlers
        TAG.Util_ITE.makeManipulatableITE(_UIControl[0], {
            onManipulate: mediaManip,
            onScroll:     mediaScroll
        }, null, true); 

        interactionHandlers.onManipulate 	= mediaManip;
        interactionHandlers.onScroll		= mediaScroll;    	
    };
};

window.ITE = window.ITE || {};

/*
 * I/P: 	trackData : 	Holds data on the track, such as duration.
 *			player : 		Reference to actual DOM-related ITE player.
 *			timeManager : 	Reference to common clock for player.
 *			orchestrator : 	Reference to common orchestrator, which informs tracks of actions.
 * Provider for an image track. 
 * 
 * Model of state:
 * 	{
 * 		opacity : 		Opacity of the image. 
 *		left : 			Pixel location of left of image.
 *		top : 			Pixel location of top of image.
 *		width : 		Pixel width of image.
 *		height : 		Pixel height of image.
 *		time : 			(OPTIONAL) Actual elapsed time, from timeManager. Read-only.
 * 	}
 * O/P: 	none
 */
ITE.ImageProvider = function (trackData, player, timeManager, orchestrator) {

	// Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(trackData, player, timeManager, orchestrator),
		self 		= this;
	Utils.extendsPrototype(this, _super);

	// Creates the field "self.keyframes", an AVL tree of keyframes arranged by "keyframe.time" field.
    self.loadKeyframes(trackData.keyframes);

    // DOM related.
    var _image,
    	_UIControl;

    // Various animation/manipulation variables.
	self.interactionAnimation;
	var interactionHandlers 		= {},
		movementTimeouts 			= [],
		attachedInks 				= [];

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
		_image		= $(document.createElement("img"))
			.addClass("assetImage");
		_UIControl	= $(document.createElement("div"))
			.addClass("UIControl")
			.append(_image);
		$("#ITEHolder").append(_UIControl);

		// Get first and last keyframes.
		self.firstKeyframe = self.keyframes.min();
		self.lastKeyframe = self.keyframes.max();

		// Attach handlers.
		attachHandlers();
	};

	/*
	 * I/P: 	none
	 * Loads actual image asset.
	 * O/P: 	none
	 */
	self.load = function() {
		_super.load();

		// Sets the image’s URL source.
		_image.attr("src", self.trackData.assetUrl);

		// Ensure that the image is completely loaded.
		// Kinda jank, but according to the onlines, stuff like $().load() can't be trusted.
		function monitor(timeWaited) {
			timeWaited = timeWaited || 0;
			if (timeWaited > 2000) {
				console.log("Image failed to load!");
			}
			else if (!_image[0].complete) {
				setTimeout(function(){ monitor(timeWaited+100); }, 100);
			}
		};
		monitor();

		// Update first state.
		self.setState(self.getKeyframeState(self.firstKeyframe));

		// When finished loading, set status to 2 (paused).
		self.status = 2; 
	};

	/*
	 * I/P: 	none
	 * Unoads track asset.
	 * O/P: 	none
	 */
	self.unload = function() {
		TweenLite.ticker.removeEventListener("tick", updateInk);
		for(var v in self) {
			v = null;
		}
	};

	/*
	 * I/P: 	endKeyframe : 	(OPTIONAL) if we know what keyframe we are animating to, pass it here.
	 * Plays image asset.
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
			var playTrigger = function() { self.play(); };
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
	 * Pauses image asset.
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

		// If this track was playing, continue playing.
		// if (prevStatus === 1) {
		// 	self.play(nextKeyframe);
		// } 
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
			(state.opacity == 0) ? _UIControl.css("pointer-events", "none") :  _UIControl.css("pointer-events" , "auto")
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
	 * Grabs current actual state of image, and sets savedState to it.
	 * O/P: 	state : 	Object holding track's current state, as used in animation.
	 */
	self.getState = function() {
		self.savedState = {
			//displayNumber	: self.getPreviousKeyframe().displayNumber,
			time			: self.timeManager.getElapsedOffset(),
			opacity			: window.getComputedStyle(_UIControl[0]).opacity,
			left 			: _UIControl.position().left,
			top 			: _UIControl.position().top,
			width 			: _UIControl.width(),
			height 			: _UIControl.height()
			// pos : {
			// 	x		: _UIControl.position().left,
			// 	y 		: _UIControl.position().top
			// },
			// size: {
			// 	y	: _UIControl.height(),
			// 	x	: _UIControl.width()
			// },
		};	
		return self.savedState;
	};

	/*
	 * I/P: 	state :		State to make actual image reflect.
	 * Sets properties of the image to reflect the input state.
	 * O/P: 	none
	 */
	self.setState = function(state) {
		_UIControl.css({
			"opacity":		state.opacity,
			"left":			state.left,
			"top":			state.top,
			"width":		state.width,
			"height":		state.height
		});
		(state.opacity == 0) ? _UIControl.css("pointer-events", "none") :  _UIControl.css("pointer-events" , "auto")
	};

	/* 
	 * I/P: 	keyframe : 			Keyframe to extract state from.
	 * Extracts the state information from this keyframe and returns it.
	 * O/P: 	state : 			Object holding keyframe's state, as used in animation.
	 */
	self.getKeyframeState = function(keyframe) {
		var state = {
						"opacity"	: keyframe.opacity,
						"left"		: (1000*keyframe.pos.x/100) + "px",
						"top"		: (500*keyframe.pos.y/100) + "px",
						"width"		: (1000*keyframe.size.x/100) + "px",
						"height"	: (500*keyframe.size.y/100) + "px"
					};
		return state;
	};

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

	///////////////////////////////////////////////////////////////////////////
	// ImageProvider functions.
	///////////////////////////////////////////////////////////////////////////


    /*
	 * I/P: 	none
	 * Creates defauly keyframes for the track
	 * O/P: 	none
	 */
	function createDefaultKeyframes() {
		var i;
		for (i = 0; i < 4; i++){
			opacity = (i == 0 || i == 3) ? 0 : 1;
			var keyframe = {
				"dispNum": 0,
				"time": i,
				"opacity": opacity,
				"pos" : {
					"x" : "100px",
					"y" : "100px"
				},
				"size": {
					"x" : "100",
					"y" : "100"
				}
			}
			self.keyframes.add(keyframe)
		}
	};
	self.createDefaultKeyframes = createDefaultKeyframes

	/* 
	 * I/P: 	none
	 * Updates ink so that it animates with image
	 * O/P: 	none
	 */
	function updateInk() {
		for (var i = 0; i < attachedInks.length; i++){

			bounds = {
				x: 0,//_UIControl.position().left,
				y: 0, //_UIControl.position().top,
				width: _UIControl.width()/$("#ITEHolder").width() || $("#ITEHolder").height(),
				height: _UIControl.height()/$("#ITEHolder").height() || $("#ITEHolder").height()
			}

			// console.log(bounds)

			attachedInks[i]._ink.adjustViewBox(bounds);
		}
	}


	/* 
	 * I/P: 	inkTrack : 		Ink track to attach to self asset.
	 * Adds ink as an overlay.
	 * O/P: 	none
	 */
	function addInk(inkTrack) {
		attachedInks.push(inkTrack)	
		var kf = self.getKeyframeState(self.firstKeyframe)
		var initialDims = { 
			x: 0,//self.firstKeyframe.pos.x, 
			y: 0,//self.firstKeyframe.pos.y, 
			w: self.firstKeyframe.size.x,
			h: self.firstKeyframe.size.y
		}	
		// var initialDims = { 
		// 	x: parseFloat(kf.left), 
		// 	y: parseFloat(kf.top), 
		// 	w: parseFloat(kf.width), 
		// 	h: parseFloat(kf.height)
		// }
		inkTrack._ink.setInitKeyframeData(initialDims)
		inkTrack._ink.retrieveOrigDims();
		TweenLite.ticker.addEventListener("tick", updateInk);
	};
	self.addInk = addInk;

   	/*
	 * I/P: 	none
	 * Return a set of interactionHandlers attached to asset from provider.
	 * O/P: 	none
	 */
	function getInteractionHandlers() {};
 
    /*
     * I/P: 	res : 		Object containing hammer event info.
     * Drag/manipulation handler for associated media.
     * Manipulation for touch and drag events.
     * O/P: 	none
     */
    function mediaManip(res) {
        var top     	= _UIControl.position().top,
            left     	= _UIControl.position().left,
            width     	= _UIControl.width(),
            height     	= _UIControl.height(),
            finalPosition;

        // If the player is playing, pause it.
    	if (self.orchestrator.status === 1) {
    		self.player.pause();
    	}

    	if (!res.eventType){
			return    	
		}

        // If event is initial touch on artwork, save current position of media object to use for animation.
        if (res.eventType === 'start') {
            startLocation = {
                x: left,
                y: top
            };
        }	

        // Target location (where object should be moved to).
        finalPosition = {
            x: res.center.pageX - (res.startEvent.center.pageX - startLocation.x),
            y: res.center.pageY - (res.startEvent.center.pageY - startLocation.y)
        };   

        // Animate to target location.
        self.interactionAnimation && self.interactionAnimation.kill();
        self.interactionAnimation = TweenLite.to(_UIControl, .5, {
        	top: finalPosition.y,
        	left: finalPosition.x
        });		
    };
	
    /*
     * I/P: 	scale : 	Scale factor.	
     *			pivot : 	Location of event (x,y).
     * Scroll/pinch-zoom handler for makeManipulatable on the DeepZoom image.
     * O/P: 	none
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

    	if (self.orchestrator.status === 1) {
    		self.player.pause();
    	}

        // Constrain new width.
        if ((newW < minW) || (newW > maxW)) {
            newW 	= Math.min(maxW, Math.max(minW, newW));
        };

        // Update scale, new X and new Y according to newly constrained values.
        scale 	= newW / w;
        newH	= h * scale;
        newX 	= l + pivot.x*(1-scale);
       	newY 	= t + pivot.y*(1-scale); 

       	// Animate _UIControl to self new position.
        self.interactionAnimation && self.interactionAnimation.kill();
        self.interactionAnimation = TweenLite.to(_UIControl, .05, {
        	top: newY,
        	left: newX,
        	width: newW,
        	height: newH
        });	
    };
    
    /*
	 * I/P: 	none
	 * Initializes handlers.
	 * O/P: 	none
	 */
    function attachHandlers() {
        // Allows asset to be dragged, despite the name.
        TAG.Util_ITE.disableDrag(_UIControl);

        // Register handlers.
        TAG.Util_ITE.makeManipulatableITE(_UIControl[0], {
            onManipulate: mediaManip,
            onScroll:     mediaScroll
        }, null, true); 

        interactionHandlers.onManipulate 	= mediaManip;
        interactionHandlers.onScroll		= mediaScroll;    	
    };


    /*
	 * I/P: 	index
	 * sets the track to the provided z-index
	 * O/P: 	none
	 */
    function setZIndex(index){
    	_UIControl.css("z-index", index)
    	self.zIndex = index
    }
    self.setZIndex = setZIndex;
};

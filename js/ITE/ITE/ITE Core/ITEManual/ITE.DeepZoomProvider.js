window.ITE = window.ITE || {};

// ITE.DeepZoomProvider = function (trackData, player, taskManager, orchestrator){
ITE.DeepZoomProvider = function (trackData, player, timeManager, orchestrator){

	//Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(trackData, player, timeManager, orchestrator),
		self 		= this;

	Utils.extendsPrototype(this, _super);

    self.loadKeyframes(trackData.keyframes);
    
	self.player 				= player;
	// self.taskManager 			= taskManager;
	self.timeManager 			= timeManager;
	self.trackStartTime			= 0;
	self.trackData 				= trackData;
	self.orchestrator			= orchestrator;
	self.status 				= 3;
	self.trackData   			= trackData;
	self.animationCallback;

	var interactionHandlers 		= {},
		movementTimeouts 			= [];

    //DOM related
    var _deepZoom,
    	_UIControl,
    	_viewer,
    	_mouseTracker;

	//Start things up...
    initialize();

   /** 
	* I/P: none
	* Initializes track, creates UI, and attachs handlers
	* O/P: none
	*/
	function initialize(){
		_super.initialize();

		//Create UI and append to ITEHolder
		_UIControl = $(document.createElement("div"))
        	.addClass("UIControl")
        	.attr("id", "DeepZoomHolder")
			.on('mousedown scroll click mousemove resize', function(evt) {
            	evt.preventDefault();
        	})
        	.css({
        		"z-index"	: 0,
        		"width"		: "100%",
        		"height"	: "100%"
        	});

		$("#ITEHolder").append(_UIControl);

		//_viewer is the actual seadragon viewer.  It is appended to UIControl.
		_viewer	= new OpenSeadragon.Viewer({
			id 			 		: "DeepZoomHolder",
			prefixUrl	 		: itePath + "Dependencies/openseadragon-bin-1.1.1/images/",
			//prefixUrl			: self.trackData.assetUrl,
			zoomPerClick 		: 1,
			minZoomImageRatio	: .5,
			maxZoomImageRatio	: 2,
			visibilityRatio		: .2
		});

		/*_viewer.addHandler({
			'canvas-scroll': function(evt) {
				console.log("scrolling")
				(self.orchestrator.status === 1) ? self.player.pause() : null
		    	self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
		    	resetSeadragonConfig()
	    	},
	    	'canvas-drag': function(evt) {
	    		console.log("dragging")
				(self.orchestrator.status === 1) ? self.player.pause() : null
		    	self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
		    	resetSeadragonConfig()	
	    	}
		})*/


        //_viewer.setMouseNavEnabled(false);
        _viewer.clearControls();

        // _deepZoom is the canvas with the deepZoom image files
        _deepZoom = $(_viewer.canvas)
			.addClass("deepZoomImage");

		_mouseTracker = new OpenSeadragon.MouseTracker({
			"element": "DeepZoomHolder"
		});

		var keyframesArray = self.keyframes.getContents();
		_UIControl.css("z-index", keyframesArray[0].zIndex);
		self.setState(keyframesArray[0]);
		self.trackStartTime = keyframesArray[0].time;
		self.status = 2;

		// Attach Handlers
		attachHandlers();
	};

	/** 
	* I/P: keyframe: a keyframe on this track.
	* Extracts the state information from this keyframe and returns it.
	* O/P: state information (used in animation) from keyframe.
	*/
	self.getKeyframeState = function(keyframe) {
		var state = {
						"opacity"	: keyframe.opacity, 
						 "bounds"	: new OpenSeadragon.Rect(parseFloat(keyframe.pos.x), parseFloat(keyframe.pos.y), keyframe.scale, keyframe.scale/2)
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
		var lerpScale = startKeyframe.scale + (interp * (endKeyframe.scale - startKeyframe.scale));
		var state = {
						"opacity"	: lerpOpacity,
						"bounds"	: new OpenSeadragon.Rect(parseFloat(lerpPosX), parseFloat(lerpPosY), lerpScale, lerpScale/2)
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
		//Sets the DeepZoom's URL source
    	//_viewer.open(itePath + "Assets/TourData/" + self.trackData.assetUrl);
		_viewer.open(self.trackData.assetUrl)
	};

   /** 
	* I/P: none
	* Grabs current actual state of image, and sets savedState to it 
	* returns savedState
	* O/P: savedState
	*/
	self.getState = function(){
		self.savedState = {
			time	: self.timeManager.getElapsedOffset(),
			bounds 	: _viewer.viewport.getBounds(true)
		};	
		return self.savedState;
	};

   /**
	* I/P: state	state to make actual image reflect
	* Sets properties of the image to reflect the input state
	* O/P: none
	*/
	self.setState = function(state){
		_viewer.viewport.fitBounds(state.bounds, true);
	};

	/* 
	* I/P: {time, ms}	duration duration of animation
	* I/P: data 		data of next keyframe to animate to
	* Starts or resumes tour
	* Called when tour is played
	* Starts animation, if needed
	* O/P: none
	*/
	// self.play = function(targetTime, data){
	// // Resets state to be where it was when track was paused, then clears the saved state
	// 	self.animationCallback = function() {
	// 		self.animate(targetTime - self.savedState.time, data);
	// 		self.savedState = null;	
	// 		_viewer.removeHandler("animation-finish", self.animationCallback)
	// 	}

	// 	// If tour was paused for any reason:
	// 	if(self.savedState) {
	// 		// If tour has been manipulated, reset it and continue animating (via the above callback method)
	// 		if(self.imageHasBeenManipulated){
	// 			self.setState(self.savedState);
	// 			_viewer.addHandler("animation-finish", self.animationCallback);	
	// 		}
	// 		// If tour was paused simply and has not been manipulated, just start it from where it was before 
	// 		else {
	// 			self.animate(targetTime - self.savedState.time, data);
	// 		}
	// 	} 
	// 	// If "play" is being called from taskmanager, just start animating to the next keyframe
	// 	else {
	// 		self.animate(targetTime - self.taskManager.timeManager.getElapsedOffset(), data);
	// 	}
	// };

	/** 
	* I/P: endKeyframe: if we know what keyframe we are animating to, pass it here.
	* Plays DeepZoom asset
	* O/P: none
	*/
	self.play = function(endKeyframe) {
		if (self.status === 3) {
			return;
		}
		self.status = 1;

		// Callback function is image has been manipulated.
		self.animationCallback = function() {
			var nextKeyframe = endKeyframe || self.getNextKeyframe(self.savedState.time);
			self.animate(nextKeyframe.time - self.savedState.time, self.getKeyframeState(nextKeyframe));
			self.savedState = null;	
			_viewer.removeHandler("animation-finish", self.animationCallback)
		}

		// Revert to any saved state, get time to start animation.
		var startTime;
		if (self.savedState) {
			// If manipulated, use callback.
			if (self.imageHasBeenManipulated){
				self.setState(self.savedState);
				_viewer.addHandler("animation-finish", self.animationCallback);	
				return;
			}
			// Otherwise, just revert back to saved state.
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

	self.pause = function() {
		// Sets savedState to be current state when tour is paused so that we can restart the tour from where we left off
		self.getState();
		self.setState(self.savedState);	// Stops animation
		self.animation.kill();
	};

	/** 
	* I/P: none
	* Informs DeepZoom asset of seek. TimeManager will have been updated.
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
		if (!surKeyframes[0] || !surKeyframes[1]) {
			console.log(surKeyframes);
		}
		var interp = 0;
		if (surKeyframes[1].time - surKeyframes[0].time !== 0) {
			interp = (self.timeManager.getElapsedOffset() - surKeyframes[0].time) / (surKeyframes[1].time - surKeyframes[0].time);
		}		var soughtState = self.lerpState(surKeyframes[0], surKeyframes[1], interp);
		self.setState(soughtState);

		// Play or pause, depending on state before being sought.
		if (prevStatus === 1) {
			self.play(surKeyframes[1]);
		} 
	};


	/* 
	* I/P: none
	* interpolates between current state and next keyframe
	* O/P: none
	*/
	self.animate = function(duration, state){
		self.imageHasBeenManipulated = false;
		setSeadragonConfig(duration);
		_viewer.viewport.fitBounds(state.bounds, false);
		self.animation = TweenLite.to(_UIControl, duration, {opacity: state.opacity});		
		self.animation.play(); 
	};

	/* 
	* I/P: inkTrack ink track to attach to self asset
	* Adds ink as an overlay
	* O/P: none
	*/
	function addInk(inkTrack){
		if (!_viewer.viewport){
			console.log("failed to load ink as DZ is not ready" )
			setTimeout(function(){
				addInk(inkTrack) } , 100)
		} else {
			var point = _viewer.viewport.pointFromPixel(new OpenSeadragon.Point(50, 50))
			console.log("point: " + point)
			_viewer.addOverlay(inkTrack._UIControl[0], point);	
		}
	};
	self.addInk = addInk;
	/* 
	* I/P: duration	duration of track
	* Helper function for animate() that is a bit of a hack
	* Since Seadragon's animation is a bit janky, and you can't input your own animation time, we're going to do it manually.
	* We're also going to change the "spring stiffness", which is another characteristic of their animation scheme 
	* (they use a physics-based, non-linear approach), so that Seadragon animation looks more linear and 
	* thus more similar to other animation in tours (re: Andy's Law of Least Astonishment)
	* O/P: none
	*/
	function setSeadragonConfig(duration){									
		_viewer.viewport.centerSpringY.animationTime 	= duration-.1;	
		_viewer.viewport.centerSpringX.animationTime 	= duration-.1;
		_viewer.viewport.zoomSpring.animationTime 		= duration-.1;
		_viewer.viewport.centerSpringX.springStiffness 	= .0000000001;
		_viewer.viewport.zoomSpring.springStiffness 	= .0000000001;
	}

	// Reset the above after animation is complete (called in MediaManip())
	// These are the actual values of these variables in Seadragon's src code (all animation times = 1.2, springStiffness = 6.5)
	function resetSeadragonConfig(){
		_viewer.viewport.centerSpringY.animationTime 	= 1.2;
		_viewer.viewport.centerSpringX.animationTime 	= 1.2;
		_viewer.viewport.zoomSpring.animationTime 		= 1.2;
		_viewer.viewport.centerSpringX.springStiffness 	= 6.5;
		_viewer.viewport.zoomSpring.springStiffness 	= 6.5;
	}
   /** 
	* I/P: none
	* Return a set of interactionHandlers attached to asset from provider
	*/
	function getInteractionHandlers(){
	}
 
    /**
     * I/P {Object} res     object containing hammer event info
     * Drag/manipulation handler for associated media
     * Manipulation for touch and drag events
     */
    function mediaManip(res) {
    	(self.orchestrator.status === 1) ? self.player.pause() : null
    	self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function

    	resetSeadragonConfig()
        var scale = res.scale,
            trans = res.translation,
            pivot = res.pivot;
        _viewer.viewport.panBy(_viewer.viewport.deltaPointsFromPixels(new OpenSeadragon.Point(trans.x, trans.y)), false);
    }
    
    /**
     * Scroll/pinch-zoom handler for makeManipulatable on the deepzoom image
     * @method dzScroll
     * @param {Number} scale          scale factor
     * @param {Object} pivot          location of event (x,y)
     */
    function mediaScroll(scale, pivot) {
    	(self.orchestrator.status === 1) ? self.player.pause() : null
     	self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
    	resetSeadragonConfig()
      	_viewer.viewport.zoomBy(scale, _viewer.viewport.pointFromPixel(new OpenSeadragon.Point(pivot.x, pivot.y)), false);
    	_viewer.viewport.applyConstraints();
    }
   

    /** 
	* I/P: none
	* Initializes handlers 
	*/
    function attachHandlers() {


		_viewer.addHandler(
			'canvas-scroll', function(evt) {
				//console.log("scrolling");
				(self.orchestrator.status === 1) ? self.player.pause() : null
		    	self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
		    	resetSeadragonConfig()
	    	})
		_viewer.addHandler(
			'canvas-drag', function(evt) {
				//console.log("dragging");
				(self.orchestrator.status === 1) ? self.player.pause() : null
		    	self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
		    	resetSeadragonConfig()
	    	})
		_viewer.addHandler(
			'container-exit', function(evt) {
				console.log("exited");
				_viewer.raiseEvent('canvas-release', evt);
				_viewer.raiseEvent('canvas-drag-end', evt);
				_viewer.raiseEvent('container-release', evt);				
				//(self.orchestrator.status === 1) ? self.player.pause() : null
		    	//self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
		    	//resetSeadragonConfig()
	    	})
        // // Allows asset to be dragged, despite the name
        // TAG.Util_ITE.disableDrag(_deepZoom);

        // _deepZoom.on("mousedown", function() {
        // 	console.log("mouse down")
        // })
        // _deepZoom.on("mouseup", function() {
        // 	console.log("mouse up")
        // })
        // _deepZoom.on("mousemove", function() {
        // 	console.log("mouse move")
        // })
        // _deepZoom.on("click", function() {
        // 	console.log("click")
        // })

        // _viewer.addHandler("container-release", function() {
        // 	console.log("mouseup: " + _deepZoom.mouseup)
        // 	console.log("mousedown: " + _deepZoom.mousedown)

        // 	_deepZoom.mouseup()
        // })

        // _mouseTracker.releaseHandler = function(){
        // 	console.log("Mouse tracker worked!! release")
        // }
        // _mouseTracker.pressHandler = function(){
        // 	console.log("Mouse tracker worked!! press")
        // }

        // console.log("_mouseTracker: " + Object.keys(_mouseTracker.element))

        /*// Register handlers
        TAG.Util_ITE.makeManipulatable(_deepZoom[0], {
            onScroll: function (delta, pivot) {
                mediaScroll(delta, pivot);
            },
            onManipulate: function (res) {
                res.translation.x = - res.translation.x;        //Flip signs for dragging
                res.translation.y = - res.translation.y;
                mediaManip(res); 
            }
        }, null, true);

        interactionHandlers.onManipulate 	= mediaManip;
        interactionHandlers.onScroll		= mediaScroll;    */	
    }
};

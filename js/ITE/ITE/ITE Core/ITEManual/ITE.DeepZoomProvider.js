window.ITE = window.ITE || {};

/*
 * I/P: 	trackData : 	Holds data on the track, such as duration.
 *			player : 		Reference to actual DOM-related ITE player.
 *			timeManager : 	Reference to common clock for player.
 *			orchestrator : 	Reference to common orchestrator, which informs tracks of actions.
 * Provider for a DeepZoom track. 
 * 
 * Model of state:
 * 	{
 * 		opacity : 		Opacity of the image. 
		bounds : 		OpenSeadragon Rect representing the boundaries of the
						DeepZoom Image, in format {x, y, width, height}.	
 *		time : 			(OPTIONAL) Actual elapsed time, from timeManager. Read-only.
 * 	}
 * O/P: 	none
 */
ITE.DeepZoomProvider = function (trackData, player, timeManager, orchestrator) {

	// Extend class from ProviderInterfacePrototype.
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(trackData, player, timeManager, orchestrator),
		self 		= this;
	Utils.extendsPrototype(this, _super);

	// Creates the field "self.keyframes", an AVL tree of keyframes arranged by "keyframe.time" field.
    self.loadKeyframes(trackData.keyframes);

    // DOM related.
    var _deepZoom,
    	_UIControl,
    	_viewer,
    	_mouseTracker;
    
    // Various animation/manipulation variables.
	self.animationCallback;
	var interactionHandlers 		= {},
		movementTimeouts 			= [];

	// miscellaneous
	var attachedInks = [];

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
		_UIControl = $(document.createElement("div"))
        	.addClass("UIControl")
        	.attr("id", trackData.name + "holder")
        	.css({
        		// "z-index"	: 0,
        		// "pointer-events" : "none",
        		// "visibility":"hidden",
        		// "position":"relative",
        		"width"		: "100%",
        		"height"	: "100%"
        	}); 
		$("#ITEHolder").append(_UIControl);

		// Create _viewer, the actual seadragon viewer.  It is appended to UIControl.
		_viewer	= new OpenSeadragon.Viewer({
			id 			 		: trackData.name + "holder",
			prefixUrl	 		: itePath + "Dependencies/openseadragon-bin-1.2.1/images/",
			zoomPerClick 		: 1,
			minZoomImageRatio	: .5,
			maxZoomImageRatio	: 2,
			visibilityRatio		: .2
			// mouseNavEnabled 	: false
		});
		$(_viewer.container).css({
			"position":"absolute"
		});
		_viewer.clearControls();

        // Create _deepZoom, the canvas with the deepZoom image files.
        _deepZoom = $(_viewer.canvas)
			.addClass("deepZoomImage");

		// // Create _mousetracker, the seadragon mouse tracker.
		// _mouseTracker = new OpenSeadragon.MouseTracker({
		// 	"element": trackData.name + "holder"
		// });

		// Get first and last keyframes and set state to first.
		self.firstKeyframe = self.keyframes.min();
		self.lastKeyframe = self.keyframes.max();
		self.setState(self.getKeyframeState(self.firstKeyframe));

		// Attach handlers.
		attachHandlers();
	};

	/*
	 * I/P: 	none
	 * Loads actual DeepZoom asset.
	 * O/P: 	none
	 */
	self.load = function() {
		_super.load();

		// Sets the DeepZoom's URL source.
		_viewer.open(self.trackData.assetUrl);
		
		// When finished loading, set status to 2 (paused).
		self.status = 2; // TODO: should this be some kind of callback?
	};

	self.unload = function(){
		_UIControl.parent.removeChild(_UIControl)
		_UIControl = null
	}

	/*
	 * I/P: 	endKeyframe : 	(OPTIONAL) if we know what keyframe we are animating to, pass it here.
	 * Plays DeepZoom asset.
	 * O/P: 	none
	 */
	self.play = function(endKeyframe) {
		if (self.status === 3) {
			return;
		}
		self.status = 1;

		// TODO: was there a reason this was a callback? I just moved the contents of this function 
		// to where the callback was previously added, and now reverting the state seems to work...
		/*
		// Callback function if image has been manipulated.
		self.animationCallback = function() {
			console.log("CALLBACK");
			console.log(self);
			var nextKeyframe = endKeyframe || self.getNextKeyframe(self.savedState.time);
			self.animate(nextKeyframe.time - self.savedState.time, self.getKeyframeState(nextKeyframe));
			self.savedState = null;	
			_viewer.removeHandler("animation-finish", self.animationCallback)
		}
		*/

		// Revert to any saved state, get time to start animation.
		var startTime;
		if (self.savedState) {
			// If manipulated, use callback.
			if (self.imageHasBeenManipulated) {
				self.setState(self.savedState);
				var nextKeyframe = endKeyframe || self.getNextKeyframe(self.savedState.time);
				self.animate(nextKeyframe.time - self.savedState.time, self.getKeyframeState(nextKeyframe));
				self.savedState = null;	
				// TODO: see above... is this callback necessary?
				//_viewer.addHandler("animation-finish", self.animationCallback);	

				return;
			}
			// Otherwise, just revert back to saved state.
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
	 * Pauses DeepZoom asset.
	 * O/P: 	none
	 */
	self.pause = function() {
		if (self.status === 3) {
			return;
		}

		self.status = 2;

		self.stopDelayStart();

		if (self.animation) {//Kills opacity animation
			self.animation.kill();
		}

		self.getState();
		self.setState(self.savedState); //Effectively kills OSD animation by redirecting the current animation to where the image is right now

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
		self.imageHasBeenManipulated = false;
		setSeadragonConfig(duration);
		_viewer.viewport.fitBounds(state.bounds, false);
		self.animation = TweenLite.to(
			// What object to animate.
			_UIControl, 
			// Duration of animation.
			duration, 
			// Define animation:
			{
				opacity: state.opacity, // Change in opacity
				onComplete: function() { // OnComplete function.
					self.play(self.getNextKeyframe(self.timeManager.getElapsedOffset()));
				}
			}
		);

		// console.log("animating")
		//testing
		// _viewer.addHandler("animation", 
		// 	function(){
		// 		if (state.opacity == 0){
		// 			// console.log("Enabling clickthrough")
		// 			_UIControl.css({
		// 				"pointer-events": "none",
		// 				"z-index": "-1",
		// 				"visibility":"hidden"
		// 			});
		// 		} else {
		// 			// console.log("Disabling clickthrough")
		// 			_UIControl.css({
		// 				// "z-index": "10",
		// 				"pointer-events":"auto",
		// 				"visibility":"visible"
		// 			});
		// 		}
		// 	}
		// )
		//testing

		self.animation.play(); 
	};

	/*
	 * I/P: 	none
	 * Grabs current actual state of DeepZoom, and sets savedState to it.
	 * O/P: 	state : 	Object holding track's current state, as used in animation.
	 */
	self.getState = function() {
		self.savedState = {
			time	: self.timeManager.getElapsedOffset(),
			bounds 	: _viewer.viewport.getBounds(true),
		};	
		return self.savedState;
	};

	/*
	 * I/P: 	state :		State to make actual image reflect.
	 * Sets properties of the image to reflect the input state.
	 * O/P: 	none
	 */
	self.setState = function(state) {
		_viewer.viewport.fitBounds(state.bounds, true);
		_viewer.viewport.update();	
	};

	/* 
	 * I/P: 	keyframe : 			Keyframe to extract state from.
	 * Extracts the state information from this keyframe and returns it.
	 * O/P: 	state : 			Object holding keyframe's state, as used in animation.
	 */
	self.getKeyframeState = function(keyframe) {
		var state = {
						"opacity"	: keyframe.opacity, 
						 "bounds"	: new OpenSeadragon.Rect(parseFloat(keyframe.pos.x), parseFloat(keyframe.pos.y), keyframe.scale, keyframe.scale/2)
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
		var lerpScale = startKeyframe.scale + (interp * (endKeyframe.scale - startKeyframe.scale));
		var state = {
						"opacity"	: lerpOpacity,
						"bounds"	: new OpenSeadragon.Rect(parseFloat(lerpPosX), parseFloat(lerpPosY), lerpScale, lerpScale/2)
					};
		return state;
	};

	// TODO: REMOVE ONCE TESTED.
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

	///////////////////////////////////////////////////////////////////////////
	// DeepZoomProvider functions.
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
                    "x": "0.005",
                    "y": "0.005"
				},
				"scale": 1
			};
			self.keyframes.add(keyframe);
		}
	}
	self.createDefaultKeyframes = createDefaultKeyframes;




	/* 
	 * I/P: 	inkTrack : 		Ink track to attach to self asset.
	 * Adds ink as an overlay.
	 * O/P: 	none
	 */
	function addInk(inkTrack) {
		if (!_viewer.viewport){
			console.log("failed to load ink as DZ is not ready... trying again" );
			setTimeout(function(){
				addInk(inkTrack) } , 100);
		} else {
			attachedInks.push(inkTrack)	
			_UIControl.append(inkTrack._UIControl[0])
			
			inkTrack._ink.retrieveOrigDims();

			inkTrack._ink.setInitKeyframeData({ 
				x: self.firstKeyframe.pos.x, 
				y: self.firstKeyframe.pos.y, 
				w: 1/self.firstKeyframe.scale, 
				h: 1/self.firstKeyframe.scale/2
			})

		}
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
   /* function mediaManip(res) {
    	(self.orchestrator.status === 1) ? self.player.pause() : null
    	self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function

    	resetSeadragonConfig()
        var scale = res.scale,
            trans = res.translation,
            pivot = res.pivot;
        _viewer.viewport.panBy(_viewer.viewport.deltaPointsFromPixels(new OpenSeadragon.Point(trans.x, trans.y)), false);
    };*/

    /*
     * I/P: 	scale : 	Scale factor.	
     *			pivot : 	Location of event (x,y).
     * Scroll/pinch-zoom handler for makeManipulatable on the DeepZoom image.
     * O/P: 	none
     */
    /*function mediaScroll(scale, pivot) {
    	(self.orchestrator.status === 1) ? self.player.pause() : null
     	self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
    	resetSeadragonConfig();
      	_viewer.viewport.zoomBy(scale, _viewer.viewport.pointFromPixel(new OpenSeadragon.Point(pivot.x, pivot.y)), false);
    	_viewer.viewport.applyConstraints();
    };*/

	/* 
	 * I/P: 	duration : 		Duration of track.
	 * Helper function for animate() that is a bit of a hack
	 * Since Seadragon's animation is a bit janky, and you can't input your own animation time, we're going to do it manually.
	 * We're also going to change the "spring stiffness", which is another characteristic of their animation scheme 
	 * (they use a physics-based, non-linear approach), so that Seadragon animation looks more linear and 
	 * thus more similar to other animation in tours (re: Andy's Law of Least Astonishment).
	 * O/P: 	none
	 */
	function setSeadragonConfig(duration) {
		_viewer.viewport.centerSpringY.animationTime 	= duration-.1;	
		_viewer.viewport.centerSpringX.animationTime 	= duration-.1;
		_viewer.viewport.zoomSpring.animationTime 		= duration-.1;
		_viewer.viewport.centerSpringX.springStiffness 	= .0000000001;
		_viewer.viewport.zoomSpring.springStiffness 	= .0000000001;
	};

	/*
	 * I/P: 	none
	 * Reset the above after animation is complete (called in MediaManip()).
	 * These are the actual values of these variables in Seadragon's src code (all animation times = 1.2, springStiffness = 6.5).
	 * O/P: 	none
	 */
	function resetSeadragonConfig() {
		_viewer.viewport.centerSpringY.animationTime 	= 1.2;
		_viewer.viewport.centerSpringX.animationTime 	= 1.2;
		_viewer.viewport.zoomSpring.animationTime 		= 1.2;
		_viewer.viewport.centerSpringX.springStiffness 	= 6.5;
		_viewer.viewport.zoomSpring.springStiffness 	= 6.5;
	};
   
    /*
	 * I/P: 	none
	 * Initializes handlers.
	 * O/P: 	none
	 */
    function attachHandlers() {
		_viewer.addHandler(
			'canvas-scroll', function(evt) {
				//console.log("scrolling");
				if (isInImageBounds(evt)){
					evt.originalEvent.preventDefault();
					(self.orchestrator.status === 1) ? self.player.pause() : null
			    	self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
			    	resetSeadragonConfig()
			    } else {
			    	// evt.preventDefaultAction()
			    }
	    	});
		_viewer.addHandler(
			'canvas-drag', function(evt) {
				//console.log("dragging");
				if (isInImageBounds(evt)){
					evt.originalEvent.preventDefault();
					(self.orchestrator.status === 1) ? self.player.pause() : null
		    		self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
		    		resetSeadragonConfig()		
			    } else {
			    	// evt.preventDefaultAction()
			    }
	    	});
		_viewer.addHandler(
			'animation', function(evt) {
				for (var i = 0; i < attachedInks.length; i++){
					var bounds = _viewer.viewport.getBounds(true);
					bounds = {
						x: bounds.x, 
						y: bounds.y, 
						width: bounds.width, 
						height: bounds.height
					}
					attachedInks[i]._ink.adjustViewBox(bounds);
				}
			})
	}

		/*
	 * I/P: 	evt (a click/touch event)
	 * 
	 * O/P: 	bool, whether or not this event was within the image's bounds
	 */
	function isInImageBounds(evt){
		var x = evt.position.x
		var y = evt.position.y
		var clickP = _viewer.viewport.pointFromPixel(new OpenSeadragon.Point(x, y))
		if (
			(clickP.x < 1) &&
			(clickP.x > 0) &&
			(clickP.y <  _viewer.viewport.contentAspectY) &&
			(clickP.y > 0)){
			return true
		} else{
			return false
		}
	}


    /*
	 * I/P: 	index
	 * sets the track to the provided z-index
	 * O/P: 	none
	 */
    function setZIndex(index){
    	_UIControl.css("z-index", index)
    }
    self.setZIndex = setZIndex;
    
};

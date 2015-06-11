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
						Check the DZ documentation on this - it's weird.
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
	self.type = "dz";

    // DOM related.
    var _deepZoom,
    	_UIControl,
    	_proxy,//For touch handling. We want to be able to click through the transparent parts of the layers, so we're just adding a div over the part of the canvas that has the image.
    			//TODO: there has GOT to be a better way to do this
    	_canvasHolder,
    	_viewer;
        self._UIControl = _UIControl;

    // Various animation/manipulation variables.
	self.animationCallback;

	// miscellaneous
	var attachedInks = [];
	var seeked;
	var scrollCaptureHandler = [];
	var dragCaptureHandler = [];
	var captureFinishedHandler = [];

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
		// Get first and last keyframes.
		self.firstKeyframe = self.keyframes.min();
		self.lastKeyframe = self.keyframes.max();


	    /*OK, so here's the deal with all of these stupidly nested divs:
          we have:

          -ITEHolder
          ----_proxy
          --------_proxy2
          ----_UIControl
          --------_canvasHolder
          -------------all other deep zoom stuff
           
          So the problem we were having is with layering multiple deepzooms; if you call makeManipulatable on them (or just use openseadragon's native handlers),
          you can't click on anything below them because they're canvas elements that take up the entire screen.

          Our fix for this is to have a proxy, which is always the size of where the actual image is (not just the canvas), that floats on top of it at a slightly higher z-index
          and deals with interaction.  Note: the size is reset on every 'animation' event of the deep zoom. This method is in attachHandlers.

          Basically, we call makeManipulatable on the proxy, which tells the deepzoom where to move (and then when the deepzoom moves the proxy moves as well)

          Also, we have this weird other _proxy2 because for some reason _proxy only receives interaction if it has children (?!) 

          IF ANYONE CAN FIND A BETTER SOLUTION TO THIS, THEY SHOULD ABSOLUTELY DO SO. Specifically one that allows us to use OSD's native handlers, which are vastly more performant and less janky than ours.
        */

		_proxy2 = $(document.createElement("img"))
            .addClass("assetImage");

		_proxy = $(document.createElement("div"))
        	.addClass("UIControl")
			.css({
			    "background-color": "orange",
                 "opacity": 0
			})

		// Create UI and append to ITEHolder.
		_canvasHolder = $(document.createElement("div"))
        	.addClass("DeepZoomCanvasHolder")
        	.attr("id", trackData.name + "holder")
        	.css({
        		"position":"absolute",
        		"width"		: $("#ITEHolder").width(),
        		"height"	: $("#ITEHolder").height(),
        	}); 
        _UIControl = $(document.createElement("div"))

		// $("#ITEHolder").append(_UIControl);
        // $("#ITEHolder").append(_proxy);
        // _proxy.append(_proxy2);
		$("#ITEHolder").append(_UIControl);
		_UIControl.append(_canvasHolder);

	    // Create _viewer, the actual seadragon viewer.  It is appended to UIControl.
        // This currently relies on an augmented OSD library where we are using their touch/click handlers + our own edits to deal with the layers issue 
		_viewer	= new OpenSeadragon.Viewer({
			id 			 		: trackData.name + "holder",
			prefixUrl	 		: itePath + "Dependencies/openseadragon-bin-1.2.1/images/",
			zoomPerClick 		: 1,
			minZoomImageRatio	: .5,
			maxZoomImageRatio	: 2,
			visibilityRatio		: .2,
			mouseNavEnabled 	: true, //enables their own touch/click handlers
			orchestrator        : orchestrator, //passes in a reference to orchestrator for layers fix
            ITE_track: self
		});
		$(_viewer.container).css({
			"position":"absolute",
		});
		_viewer.clearControls();

        // Create _deepZoom, the canvas with the deepZoom image files.
        _deepZoom = $(_viewer.canvas)
			.addClass("deepZoomImage"); 
	};


    /* I/P: 	evt (a click/touch event)
    * O/P:   	bool, whether or not this event was within the image's bounds
    *This function determines if a touch/click event is within the bounds of this dz on screen
    *Used as a component in the layers issue fix 
    */
	function isInImageBounds(evt) {

		//If the current time is after the last keyframe of the deepzoom, or before the first, or the asset is current trasnparent, we're defintely out of bounds.
		var notOnScreen = 	(window.getComputedStyle(_canvasHolder[0]).opacity == 0) || 
						(this.lastKeyframe.time < self.timeManager.getElapsedOffset()) ||
						(this.firstKeyframe.time > self.timeManager.getElapsedOffset());

		if (notOnScreen){
			return
		}

		//Otherwise, check position of click against image bounds
	    if (evt.clientX && evt.clientY) {
	        var x = evt.clientX;
	        var y = evt.clientY;
	    }
	    else if (evt.center) {
	        var x = evt.center.x;
	        var y = evt.center.y;
	    }
	    else {
	        var x = evt.position.x
	        var y = evt.position.y
	    }
	    var clickP = _viewer.viewport.pointFromPixel(new OpenSeadragon.Point(x, y))
	    if (
			(clickP.x < 1) &&
			(clickP.x > 0) &&
			(clickP.y < _viewer.viewport.contentAspectY) &&
			(clickP.y > 0)) {
	        return true
	    } else {
	        return false
	    }
	}
	self.isInImageBounds = isInImageBounds;

	self.raiseEvent = function (eventName, eventArgs) {
	    _viewer.raiseEvent(eventName, eventArgs);
	}
	self.viewer = _viewer;

	/*
	 * I/P: 	none
	 * Loads actual DeepZoom asset.
	 * O/P: 	none
	 */
	self.load = function() {
		_super.load();

		// Add a handler to set the first keyframe when the viewer is finished loading.
		_viewer.addHandler('open', function(evt) {
			var provider = evt.userData;
			provider.setState(provider.getKeyframeState(provider.firstKeyframe));	
			self.status = 2; 	
			// Attach handlers.
			attachHandlers();
			_viewer.raiseEvent("animation");//This is just to get the proxy in the right place.  TODO: make less janky.
		
			//Tell orchestrator to play (if other tracks are ready)
			self.orchestrator.playWhenAllTracksReady()
		}, self);
		// Sets the DeepZoom's URL source.
		_viewer.open(self.trackData.assetUrl);
	};

	/*
	 * I/P: 	none
	 * Unoads track asset.
	 * O/P: 	none
	 */
	self.unload = function() {
	    self.pause();
	    self.removeCaptureHandlers({
	        drag: dragCaptureHandler,
            scroll: scrollCaptureHandler
	    });
	    //self.removeCaptureFinishedHandler(captureFinishedHandlers);
	    _viewer.destroy();
		_viewer.source = null;
		_UIControl.remove()
		for(var v in self) {
			v = null;
		}

	};

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

		//If the current time is after the last keyframe of the deepzoom, don't do anything
		if (this.lastKeyframe.time < self.timeManager.getElapsedOffset()){
			return;
		}

		// Revert to any saved state, get time to start animation.
		var startTime;
		if (self.savedState) {
			//If image has been manipulated, set correct state and animate to next keyframe
			if (self.imageHasBeenManipulated) {
				self.setState(self.savedState);
				var nextKeyframe = endKeyframe || self.getNextKeyframe(self.savedState.time);
				self.animate(nextKeyframe.time - self.savedState.time, self.getKeyframeState(nextKeyframe));
				self.savedState = null;	
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
			// !seeked && self.animate(nextKeyframe.time - startTime, self.getKeyframeState(nextKeyframe));
			self.animate(nextKeyframe.time - startTime, self.getKeyframeState(nextKeyframe));
			seeked = false
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

		if (self.animation) { //Kills opacity animation
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
		seeked = true;
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
		self.imageHasBeenManipulated = false;
		//self.opacity = 1;
		setSeadragonConfig(duration);
		_viewer.viewport.fitBounds(state.bounds, false);

		//If we're fading in, set the z-index to be the track's real z-index (as opposed to -1)
		if (state.opacity !== 0) {
		    _UIControl.css("z-index", self.zIndex)
		    _proxy.css("z-index", self.zIndex + 5)
		}

		self.animation = TweenLite.to(
			// What object to animate.
			_canvasHolder,
			// Duration of animation.
			duration, 
			// Define animation:
			{
				opacity: state.opacity, // Change in opacity
				onComplete: function() { // OnComplete function.
					self.play(self.getNextKeyframe(self.timeManager.getElapsedOffset()));
					
					//If we're fading out, set the z-index to -1 to prevent touches
					if (state.opacity == 0) {
					    _UIControl.css("z-index",-1)
					    _proxy.css("z-index", -1)
					}
				}
			})
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
			opacity : window.getComputedStyle(_canvasHolder[0]).opacity
		};	
		return self.savedState;
	};

	/*
	 * I/P: 	state :		State to make actual image reflect.
	 * Sets properties of the image to reflect the input state.
	 * O/P: 	none
	 */
	self.setState = function(state) {

		//So, for some very strang reason fitBounds(bounds, true) 
		//(where "true" refers to whether or not the player is updated immediately or with an animation time, 
		//[this animation time is actually a property of the springs used in their animation system])
		//doesn't always actually update the screen. That is, the bounds is set correctly but it doesn't look any different.
		// The current way to get this to update is by zooming the viewport in a tiny bit, then zooming it back out.
		// Don't know why it works, but it does.
		// Just embrace the jank. Don't fight it. 
		// _viewer.viewport.centerSpringY.animationTime 	= .000001;	// Old janky fix
		// _viewer.viewport.centerSpringX.animationTime 	= .000001; 
		// _viewer.viewport.zoomSpring.animationTime 		= .000001;
		// _viewer.viewport.fitBounds(state.bounds, false);  // End of old janky fix.

	    _canvasHolder.css("opacity", state.opacity)
	    //console.log("setting opacity to " + state.opacity + " : " + self.trackData.name)
        setZIndex(self.zIndex)
		_viewer.viewport.fitBounds(state.bounds, true);
		_viewer.viewport.update();	
        _viewer.viewport.zoomBy(1.01, new OpenSeadragon.Point(0,0), true);
        _viewer.viewport.zoomBy(0.99, new OpenSeadragon.Point(0, 0), true);

        there = _viewer.viewport.deltaPointsFromPixels(new OpenSeadragon.Point(.01, .01));
        and_back_again = _viewer.viewport.deltaPointsFromPixels(new OpenSeadragon.Point(-.01, -.01));
        _viewer.viewport.panBy(there, true);
        _viewer.viewport.panBy(and_back_again, true);

        resetSeadragonConfig()
	};

	/* 
	 * I/P: 	keyframe : 			Keyframe to extract state from.
	 * Extracts the state information from this keyframe and returns it.
	 * O/P: 	state : 			Object holding keyframe's state, as used in animation.
	 */
	self.getKeyframeState = function(keyframe) {
		var state = {
						"opacity"	: keyframe.opacity, 
						 "bounds"	: new OpenSeadragon.Rect(keyframe.pos.x, 
						 									 keyframe.pos.y,
						 									 keyframe.scale, 
						 									 keyframe.scale/_viewer.viewport.getAspectRatio())
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
						"bounds"	: new OpenSeadragon.Rect(lerpPosX, 
															 lerpPosY, 
															 lerpScale, 
															 lerpScale/_viewer.viewport.getAspectRatio())
					};
		return state;
	};

    // keyframe capture pub/sub methods
	self.registerCaptureHandler = function (handlers) {
	    scrollCaptureHandler = handlers.scroll;
	    dragCaptureHandler = handlers.drag;
	    _viewer.addHandler('canvas-scroll',
            function (evt) {
                handlers.scroll(evt);
            });
	    _viewer.addHandler('canvas-drag',
            function (evt) {
                handlers.drag(evt);
            });
	}

	self.registerCaptureFinishedHandler = function (handlers) {
	    captureFinishedHandlers = handlers.end;
	    _viewer.addHandler('canvas-drag-end',
            function (evt) {
	            handlers.end(evt);
	        });
	}

	self.removeCaptureHandlers = function (handlers) {
	    scrollCaptureHandler = null;
	    dragCaptureHandler = null;
	    _viewer.removeHandler('canvas-scroll',
            function (evt) {
                handlers.scroll(evt);
            });
	    _viewer.removeHandler('canvas-drag',
            function (evt) {
                handlers.drag(evt);
            });
	}

	self.removeCaptureFinishedHandler = function (handler) {
	    captureFinishedHandler = null;
	    _viewer.removeHandler('canvas-drag-end',
            function (evt) {
	            handlers.end(evt);
	        });
	}



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
			// console.log("failed to load ink as DZ is not ready... trying again" );
			setTimeout(function(){
				addInk(inkTrack) } , 100);
		} else {
			attachedInks.push(inkTrack)	
			inkTrack._ink.setInitKeyframeData(inkTrack.trackData.initKeyframe)
			inkTrack._ink.retrieveOrigDims();
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
   

    /**
     * Manipulation/drag handler for makeManipulatable on the deepzoom image
     * @method dzManip
     * @param {Object} res             object containing hammer event info
     */

	function dzManip(res) {


        //Pause
        (self.orchestrator.status === 1) ? self.player.pause() : null
      	self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
		resetSeadragonConfig()

        var scale = res.scale,
            trans = res.translation,
            pivot = res.pivot;
        var pivotRel;
        var transRel;

        pivotRel = _viewer.viewport.pointFromPixel(new OpenSeadragon.Point(pivot.x + _proxy.position().left, pivot.y + _proxy.position().top));
        var piv = {
            x: pivotRel.x,
            y: pivotRel.y
        };
        transRel = _viewer.viewport.deltaPointsFromPixels(new OpenSeadragon.Point(trans.x, trans.y));
        _viewer.viewport.zoomBy(scale, pivotRel, false);
        _viewer.viewport.panBy(transRel, false);
        _viewer.viewport.applyConstraints()

    }


    /**
     * Scroll/pinch-zoom handler for makeManipulatable on the deepzoom image
     * @method dzScroll
     * @param {Number} scale          scale factor
     * @param {Object} pivot          location of event (x,y)
     */
    function dzScroll(scale, pivot) {
        dzManip({
            scale: scale,
            translation: {
                x: 0,
                y: 0
            },
            pivot: pivot
        });
    }
    
    /*
	 * I/P: 	none
	 * Initializes handlers.
	 * O/P: 	none
	 */
	function attachHandlers1() {

		_viewer.addHandler(
		'animation', function(evt) {

			//Calculate absolute coordinates of part of the canvas with image
   			var topLeft = _viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0, 0), true);
			bounds = {
				x: topLeft.x,
				y: topLeft.y,
				width: _canvasHolder.width()*_viewer.viewport.getZoom(true),
				height: _canvasHolder.width()*_viewer.viewport.getZoom(true)*_viewer.viewport.contentAspectY
			}


			_proxy.css({
				"width": bounds.width,
				"height": bounds.height,
				"top": bounds.y,
				"left": bounds.x
			})
			//Update all attached inks
			for (var i = 0; i < attachedInks.length; i++){
				attachedInks[i]._ink.adjustViewBox(bounds);
			}

		})

	   	if (IS_WINDOWS) {
	        TAG.Util_ITE.makeManipulatableWinITE(_proxy[0], {
	            onScroll: function (delta, pivot) {
	                dzScroll(delta, pivot);
	            },
	            onManipulate: function (res) {
	                if (!res.translation || !res.pivot) { return; }

                    res.translation.x = -res.translation.x;        //Flip signs for dragging
                    res.translation.y = -res.translation.y;
                    dzManip(res);
	            }
	        }, null, true); //this "true" means no acceleration.
	    } else {
	        TAG.Util.makeManipulatable(_proxy[0], {
	            onScroll: function (delta, pivot) {
	                dzScroll(delta, pivot);
	            },
	            onManipulate: function (res) {
	            	if (!res.translation || !res.pivot) { return; }
                    res.translation.x = -res.translation.x;        //Flip signs for dragging
                    res.translation.y = -res.translation.y;
                    dzManip(res);
	            }
	        }, null, true); //this "true" means no acceleration.
	    }
	}



	function attachHandlers() {
	    _viewer.addHandler(
            'canvas-scroll', function (evt) {
                (self.orchestrator.status === 1) ? self.player.pause() : null
                self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
                resetSeadragonConfig()
            });
 		//_viewer.addHandler(
 		//	'canvas-scroll', function(evt) {
 		//			(self.orchestrator.status === 1) ? self.player.pause() : null
 		//	    	self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
 		//	    	resetSeadragonConfig()
 	    //	});
 		_viewer.addHandler(
 			'canvas-drag', function(evt) {
 					(self.orchestrator.status === 1) ? self.player.pause() : null
 		    		self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
 		    		resetSeadragonConfig()
 	    	});
 		_viewer.addHandler(
 			'animation', function(evt) {
 				for (var i = 0; i < attachedInks.length; i++){
            			var topLeft = _viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0, 0), true);
 					bounds = {
 						x: topLeft.x,
 						y: topLeft.y,
 						width: _UIControl.width()*_viewer.viewport.getZoom(true),
 						height: _UIControl.width()*_viewer.viewport.getZoom(true)
 					}
 					attachedInks[i]._ink.adjustViewBox(bounds);
 				}
 			})
    }

    /*
	 * I/P: 	index
	 * sets the track to the provided z-index
	 * O/P: 	none
	 */
	function setZIndex(index) {
	    index = 100000000;
    	//set the z index to be -1 if the track is not displayed
		if (window.getComputedStyle(_canvasHolder[0]).opacity == 0){
		    _UIControl.css("z-index", -1)
		    _proxy.css("z-index", -1)
           // console.log("zindex being set for "+ self.trackData.name + " to -1")
		} 
		else //Otherwise set it to its correct z index
		{
			_UIControl.css("z-index", index)
			_canvasHolder.css("z-index", 1)
			_proxy.css("z-index", index + 5)
			//console.log("zindex being set for " + self.trackData.name + " to " + index)

		}
    	self.zIndex = index
    }
    self.setZIndex = setZIndex;
    
};

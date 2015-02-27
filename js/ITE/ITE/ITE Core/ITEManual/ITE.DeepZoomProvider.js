window.ITE = window.ITE || {};

ITE.DeepZoomProvider = function (trackData, player, taskManager, orchestrator){

	//Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(),
		self 		= this;

	Utils.extendsPrototype(this, _super);

	// TODO: remove old stuff
    // var keyframes       		= trackData.keyframes;   // Data structure to keep track of all displays/keyframes
    // TODO: new stuff start
    console.log("DeepZoom: loading keyframes...");
    self.loadKeyframes(trackData.keyframes);
    console.log("DeepZoom: loaded!");
    // TODO: new stuff end
	self.player 				= player;
	self.taskManager 			= taskManager;
	self.trackData 				= trackData;
	self.orchestrator			= orchestrator;
	self.status 				= "loading";
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
    initialize()

   /** 
	* I/P: none
	* Initializes track, creates UI, and attachs handlers
	* O/P: none
	*/
	function initialize(){
		_super.initialize()

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
			//prefixUrl			: this.trackData.assetUrl,
			zoomPerClick 		: 1,
			minZoomImageRatio	: .5,
			maxZoomImageRatio	: 2,
			visibilityRatio		: .2
		})


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
		})
		
		var i, keyframeData;

		// TODO: remove old stuff
		//Initialize keyframes and load into taskManager
		// for (i=1; i<keyframes.length; i++) {
		// 	keyframeData={
		// 				  opacity	: keyframes[i].opacity,
		// 				  bounds 	: new OpenSeadragon.Rect(parseFloat(keyframes[i].pos.x), parseFloat(keyframes[i].pos.y), keyframes[i].scale, keyframes[i].scale/2)
		// 				};
		// 	self.taskManager.loadTask(keyframes[i-1].time, keyframes[i].time, keyframeData, _UIControl, self);
		// }
		// self.status = "ready";
		// TODO: new stuff start
		console.log("DeepZoom: loading tasks...");
		var keyframesArray = self.keyframes.getContents();
		for (i = 1; i < keyframesArray.length; i++) {
			keyframeData={
						  "opacity"	: keyframesArray[i].volume, 
						  "bounds"	: new OpenSeadragon.Rect(parseFloat(keyframesArray[i].pos.x), parseFloat(keyframesArray[i].pos.y), keyframesArray[i].scale, keyframesArray[i].scale/2)
						};
			self.taskManager.loadTask(keyframesArray[i-1].time, keyframesArray[i].time, keyframeData, _UIControl, self);
		}
		_UIControl.css("z-index", keyframesArray[0].zIndex);

		self.status = "ready";
		console.log("DeepZoom: ready!");
		console.log(self.keyframes);
		self.setState(keyframesArray[0]);
		// TODO: new stuff end

		// Attach Handlers
		attachHandlers()
	};

   /** 
	* I/P: none
	* Loads actual image asset, and sets status to paused when complete
	* O/P: none
	*/
	this.load = function(){
		_super.load()
		//Sets the DeepZoom's URL source
    	//_viewer.open(itePath + "Assets/TourData/" + this.trackData.assetUrl);
		_viewer.open(this.trackData.assetUrl)
	};

   /** 
	* I/P: none
	* Grabs current actual state of image, and sets savedState to it 
	* returns savedState
	* O/P: savedState
	*/
	this.getState = function(){
		self.savedState = {
			time	: self.taskManager.timeManager.getElapsedOffset(),
			bounds 	: _viewer.viewport.getBounds(true)
		};	
		return self.savedState;
	};

   /**
	* I/P: state	state to make actual image reflect
	* Sets properties of the image to reflect the input state
	* O/P: none
	*/
	this.setState = function(state){
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
	this.play = function(targetTime, data){
	// Resets state to be where it was when track was paused, then clears the saved state
		self.animationCallback = function() {
			self.animate(targetTime - self.savedState.time, data);
			self.savedState = null;	
			_viewer.removeHandler("animation-finish", self.animationCallback)
		}

		// If tour was paused for any reason:
		if(this.savedState) {
			// If tour has been manipulated, reset it and continue animating (via the above callback method)
			if(self.imageHasBeenManipulated){
				this.setState(this.savedState);
				_viewer.addHandler("animation-finish", self.animationCallback);	
			}
			// If tour was paused simply and has not been manipulated, just start it from where it was before 
			else {
				self.animate(targetTime - self.savedState.time, data);
			}
		} 
		// If "play" is being called from taskmanager, just start animating to the next keyframe
		else {
			this.animate(targetTime - this.taskManager.timeManager.getElapsedOffset(), data);
		}
	};

	this.pause = function(){
		// Sets savedState to be current state when tour is paused so that we can restart the tour from where we left off
		this.getState();
		this.setState(self.savedState);	// Stops animation
		self.animation.kill();
	}


	/* 
	* I/P: none
	* interpolates between current state and next keyframe
	* O/P: none
	*/
	this.animate = function(duration, state){
		self.imageHasBeenManipulated = false;
		setSeadragonConfig(duration);
		_viewer.viewport.fitBounds(state.bounds, false);
		self.animation = TweenLite.to(_UIControl, duration, {opacity: state.opacity});		
		self.animation.play(); 
	};

	/* 
	* I/P: inkTrack ink track to attach to this asset
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
	this.addInk = addInk;
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

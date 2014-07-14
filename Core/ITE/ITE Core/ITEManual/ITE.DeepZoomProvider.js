window.ITE = window.ITE || {};

ITE.DeepZoomProvider = function (trackData, player, taskManager, orchestrator){

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
	self.savedState		= {
						  time 		: 0,
						  opacity	: keyframes[0].opacity,
						  bounds 	: new OpenSeadragon.Rect(parseFloat(keyframes[0].pos.x), parseFloat(keyframes[0].pos.y), parseFloat(keyframes[0].scale), parseFloat(keyframes[0].scale/2))
						};

	this.trackInteractionEvent 	= new ITE.PubSubStruct();
	interactionHandlers 		= {},
	movementTimeouts 			= [],
	this.trackData   			= trackData;

    //DOM related
    var _deepZoom,
    	_UIControl,
    	_viewer;

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
			id 			 : "DeepZoomHolder",
			prefixUrl	 : "../../Dependencies/openseadragon-bin-1.1.1/images/",
			zoomPerClick : 1,
		})
        _viewer.setMouseNavEnabled(false);
        _viewer.clearControls();
		_viewer.addHandler("animation-finish", onAnimationFinish);

		//if animation was not an interaction handler, taskManager should delete track
		function onAnimationFinish(track){
			console.log("delete track that had this animation")
		};

        // _deepZoom is the canvas with the deepZoom image files
        _deepZoom = $(_viewer.canvas)
			.addClass("deepZoomImage");
		
		var i, keyframeData;

		for (i=1; i<keyframes.length; i++) {
			keyframeData={
						  opacity	: keyframes[i].opacity,
						  bounds 	: new OpenSeadragon.Rect(parseFloat(keyframes[i].pos.x), parseFloat(keyframes[i].pos.y), keyframes[i].scale, keyframes[i].scale/2),
						  "left"    : new OpenSeadragon.Rect(parseFloat(keyframes[i].pos.x))
						};
			self.taskManager.loadTask(keyframes[i].time-keyframes[i-1].time, keyframeData, _UIControl, keyframes[i].time,self);
		}
		self.status = "ready";

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
    	_viewer.open("../../Assets/TourData/" + this.trackData.assetUrl);
	};

   /** 
	* I/P: none
	* Grabs current actual state of image, and sets savedState to it 
	* returns savedState
	* O/P: savedState
	*/
	this.getState = function(){
		self.savedState = {
			//displayNumber	: this.getPreviousKeyframe().displayNumber,
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
	I/P: none
	interpolates between current state and next keyframe
	O/P: none
	*/
	this.setSeadragonConfiguration = function(duration, state){
		setSeadragonConfig(duration);
		_viewer.viewport.fitBounds(state.bounds, false);
	};


	/* 
	I/P: duration	duration of track
	Helper function for animate() that is a bit of a hack
	Since Seadragon's animation is a bit jenky, and you can't input your own animation time, we're going to do it manually.
	We're also going to change the "spring stiffness", which is another characteristic of their animation scheme 
	(they use a physics-based, non-linear approach), so that Seadragon animation looks more linear and 
	thus more similar to other animation in tours (re: Andy's Law of Least Astonishment)
	O/P: none
	*/
	function setSeadragonConfig(duration){
		//TODO: change this... these values should be {duration}, but aren't becasuse we want the animation-finished 
		// event to be raised every time one of our tracks ends so that we can delete them from the trackManager's ongoingTasks
		// (otherwise these tasks are continually called and this messes everything up.
		// However, this isn't happening because of the way openSeadragon handles events-- if the animation isn't fully complete and another 
		// one is called, the animation "target" spot (and time) is just reset to the new animation's target
		// rather than being cancelled and the new animation created. 
																			
		_viewer.viewport.centerSpringY.animationTime 	= duration;	
		_viewer.viewport.centerSpringX.animationTime 	= duration;
		_viewer.viewport.zoomSpring.animationTime 		= duration;
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
    	resetSeadragonConfig()
        var scale = res.scale,
            trans = res.translation,
            pivot = res.pivot;
		_viewer.viewport.zoomBy(scale, _viewer.viewport.pointFromPixel(new OpenSeadragon.Point(pivot.x, pivot.y)), false);
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
        mediaManip({
            scale: scale,
            translation: {
                x: 0,
                y: 0
            },
            pivot: pivot
        });
    }
   

    /** 
	* I/P: none
	* Initializes handlers 
	*/
    function attachHandlers() {

        // Register handlers
        TAG.Util.makeManipulatable(_deepZoom[0], {
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
        interactionHandlers.onScroll		= mediaScroll;    	
    }
};

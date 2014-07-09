window.ITE = window.ITE || {};

ITE.DeepZoomProvider = function (trackData, player, taskManager, orchestrator){

	//Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(),
		self 		= this;

	self.player 		= player;
	self.taskManager 	= taskManager;
	self.trackData 		= trackData;
	self.orchestrator	= orchestrator;
	self.status 		= "loading";


	Utils.extendsPrototype(this, _super);

    var keyframes           	= trackData.keyframes;   // Data structure to keep track of all displays/keyframes
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


        if(Seadragon.Config) {
            Seadragon.Config.visibilityRatio = 0.8; // TODO see why Seadragon.Config isn't defined; should it be?
        }

		//Create UI and append to ITEHolder
		_UIControl = $(document.createElement("div"))
        	.addClass("UIControl")
			.on('mousedown scroll click mousemove resize', function(evt) {
            	evt.preventDefault();
        	})
        	.css("z-index", 0);
		$("#ITEHolder").append(_UIControl);

		//_viewer is the actual seadragon viewer.  It is appended to UIControl.
		_viewer	= new Seadragon.Viewer(_UIControl[0])
        _viewer.setMouseNavEnabled(false);
        _viewer.clearControls();

        // _deepZoom is the canvas with the deepZoom image files
        _deepZoom = $(_viewer.canvas)
			.addClass("deepZoomImage");

		var i, keyframeData;

		for (i=1; i<keyframes.length; i++) {
			keyframeData={
						  "opacity"	: keyframes[i].opacity,
						  "top"		: (500*keyframes[i].pos.y/100) + "px",
						  "left"	: (1000*keyframes[i].pos.x/100) + "px",
						  "width"	: (1000*keyframes[i].size.x/100) + "px",
						  "height"	: (500*keyframes[i].size.y/100) + "px"};
			self.taskManager.loadTask(parseFloat(keyframes[i].time - keyframes[i-1].time), keyframeData, _UIControl, keyframes[i].time);
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
        	_viewer.openDzi("../../Assets/TourData/" + this.trackData.assetUrl);
	};

   /** 
	* I/P: none
	* Grabs current actual state of image, and sets savedState to it 
	* returns savedState
	* O/P: savedState
	*/
	this.getState = function(){
		this.savedState = {
			//displayNumber	: this.getPreviousKeyframe().displayNumber,
			time			: self.taskManager.timeManager.getElapsedOffset(),
			opacity			: window.getComputedStyle(_UIControl[0]).opacity,
			pos : {
				x		: _UIControl.position().left,
				y 		: _UIControl.position().top
			},
			size: {
				height	: _UIControl.height(),
				width	: _UIControl.width()
			},
		};	
		return this.savedState;
	};


   /**
	* I/P: state	state to make actual image reflect
	* Sets properties of the image to reflect the input state
	* O/P: none
	*/
	this.setState = function(state){
		_UIControl.css({
			"left":			state.pos.x,
			"top":			state.pos.y,
			"height":		state.size.height,
			"width":		state.size.width,
			"opacity":		state.opacity
		});
		//this.savedState = state	
	};

		/* 
		I/P: none
		interpolates between current state and next keyframe
		O/P: none
		*/

		//******* Intentionally left out because I don't know how animation will work yet... (ereif)
		function animate(){
	};

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

        var scale = res.scale,
            trans = res.translation,
            pivot = res.pivot;

        _viewer.viewport.zoomBy(scale, _viewer.viewport.pointFromPixel(new Seadragon.Point(pivot.x, pivot.y)), false);
        _viewer.viewport.panBy(_viewer.viewport.deltaPointsFromPixels(new Seadragon.Point(trans.x, trans.y)), false);
        _viewer.viewport.applyConstraints();
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

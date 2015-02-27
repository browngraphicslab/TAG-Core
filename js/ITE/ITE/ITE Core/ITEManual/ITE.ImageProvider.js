window.ITE = window.ITE || {};

ITE.ImageProvider = function (trackData, player, taskManager, orchestrator){

	//Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(),
		self 		= this;

	Utils.extendsPrototype(this, _super);

	// TODO: remove old stuff
    // var keyframes       = trackData.keyframes;   // Data structure to keep track of all displays/keyframes
    // TODO: new stuff start
    console.log("Image: loading keyframes...");
    self.loadKeyframes(trackData.keyframes);
    console.log("Image: loaded!");
    // TODOL new stuff end
	self.player 		= player;
	self.taskManager 	= taskManager;
	self.trackData 		= trackData;
	self.orchestrator	= orchestrator;
	self.status 		= "loading";
	// self.savedState		= keyframes[0];
	self.animation,
	self.interactionAnimation;

	interactionHandlers 		= {},
	movementTimeouts 			= [],
	this.trackData   			= trackData;

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

		var i, keyframeData;

		// TODO: remove old stuff
		// for (i=1; i<keyframes.length; i++) {
		// 	keyframeData={
		// 				  "opacity"	: keyframes[i].opacity,
		// 				  "top"		: (500*keyframes[i].pos.y/100) + "px",
		// 				  "left"	: (1000*keyframes[i].pos.x/100) + "px",
		// 				  "width"	: (1000*keyframes[i].size.x/100) + "px",
		// 				  "height"	: (500*keyframes[i].size.y/100) + "px"
		// 				};
		// 	self.taskManager.loadTask(keyframes[i-1].time, keyframes[i].time, keyframeData, _UIControl, self);
		// }
		// self.status = "ready";
		// self.setState(keyframes[0]);
		// TODO: new stuff start
		console.log("Image: loading tasks...");
		var keyframesArray = self.keyframes.getContents();
		for (i = 1; i < keyframesArray.length; i++) {
			keyframeData={
						  "opacity"	: keyframesArray[i].opacity,
						  "top"		: (500*keyframesArray[i].pos.y/100) + "px",
						  "left"	: (1000*keyframesArray[i].pos.x/100) + "px",
						  "width"	: (1000*keyframesArray[i].size.x/100) + "px",
						  "height"	: (500*keyframesArray[i].size.y/100) + "px"
						};
			self.taskManager.loadTask(keyframesArray[i-1].time, keyframesArray[i].time, keyframeData, _UIControl, self);
		}
		keyframesArray[0] && _UIControl.css("z-index", keyframesArray[0].zIndex);//TODO: clean this up-- this is just to make sure that the asset has the correct z-index. 
																		// There's also clearly been some mistake if we have to do this check (if there are any keyframes) because why would we have a track with no keyframes...?
		self.status = "ready";
		console.log("Image: ready!");
		self.setState(keyframesArray[0]);
		// TODO: new stuff end
		//Attach Handlers
		attachHandlers()

	};


   /** 
	* I/P: none
	* Loads actual image asset, and sets status to paused when complete
	* O/P: none
	*/
	this.load = function(){
			_super.load()

			//Sets the image’s URL source
			_image.attr("src", this.trackData.assetUrl)
			// When image has finished loading, set status to “paused”, and position element where it should be for the first keyframe
			_image.onload = function (event) {//Is this ever getting called?
					this.setStatus(2);
					this.setState(keyframes.min());
			};
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
			time			: self.taskManager.timeManager.getElapsedOffset(),
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
	this.setState = function(state){
		_UIControl.css({
			"left":			state.pos.x,
			"top":			state.pos.y,
			"height":		state.size.y,
			"width":		state.size.x,
			"opacity":		state.opacity
		});
	};

	this.pause = function(){
		// Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		this.getState();
		self.animation.kill()
	}

	/* 
	I/P: none
	interpolates between current state and next keyframe
	O/P: none
	*/
	this.animate = function(duration, state){
			self.animation = TweenLite.to(_UIControl, duration, state);		
			self.animation.play();
	};

	/* 
	* I/P: inkTrack ink track to attach to this asset
	* Adds ink as an overlay
	* O/P: none
	*/
	//TODO: implement
	this.addInk = function(inkTrack){
		console.log("position().top: " + _UIControl.position().top)
		console.log("offset().top: " + _UIControl.offset().top)

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
        TAG.Util_ITE.disableDrag(_UIControl);

        // Register handlers
        TAG.Util_ITE.makeManipulatableITE(_UIControl[0], {
            onManipulate: mediaManip,
            onScroll:     mediaScroll
        }, null, true); 

        interactionHandlers.onManipulate 	= mediaManip;
        interactionHandlers.onScroll		= mediaScroll;    	
    }
};

window.ITE = window.ITE || {};

ITE.ImageProvider = function (trackData, player, taskManager, orchestrator){

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
			_image.attr("src", "../../Assets/TourData/" + this.trackData.assetUrl)

			// When image has finished loading, set status to “paused”, and position element where it should be for the first keyframe
			_image.onload = function (event) {
					this.setStatus(2);
					this.setState(keyframes[0]);
			};
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

		//******* Intentionally left out because I don't know how animation work... (ereif)
		function animate(){

	// 		// animate to next keyframe after where we are right now
	// 		var targetKeyFrame = getNextKeyframe(timeManager.getElapsedSeconds())

	//          media.onload =function(){
	//                         var  mediaobj = new Kinetic.Image(){
	//                 //set properties x,y,height, width followed by
	//                 image : media
	//                          });
	//             	 layer.add(mediaobj); //add the kinetic image to the stage’s layer
	//             	stage.add(layer); //add layer to the stage
	            
	//             	var animation = new Kintetic.Animation(function(frame){
	//                	 //define animation as desired},layer);
	//             	animation.start();

	// 		// When current animation has finished, begin next animation
	// this.animation.addEventListener("animationFinished", (function (event) {
	// 	this.animate() //This will start animation to the next keyframe
	// 		}

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
        var top     	= _UIControl.position().top,
            left     	= _UIControl.position().left,
            width     	= _UIControl.width(),
            height     	= _UIControl.height(),
            finalPosition;

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

        //FOR ANIMATION TESTING PURPOSES (the blue square shows that finalPosition is correct, but with tweenLite, it is somehow impossible to animate there correctly when you have other animations going?) 
        // var test = $(document.createElement("div")).css({
        //     	"position" : "absolute",
        //     	"height": "10px",
        //     	"width": "10px",
        //     	"left": finalPosition.x,
        //     	"top": finalPosition.y,
        //     	"background-color": "blue"
        //     })
        //     $("#ITEHolder").append(test)

        // TweenLite.killTweensOf(_UIControl)
        // TweenLite.to(_UIControl, 1, {
        // 	y: finalPosition.y,
        // 	x: finalPosition.x
        // }, Ease.easeOutExpo);     

        // Animate to target location
        _UIControl.stop();
        _UIControl.animate({
        	top: finalPosition.y,
        	left: finalPosition.x
        }, "slow", "linear");
 
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

        // Animate to target zoom
        // TweenLite.to(_UIControl, .1, {
        // 	y: newY,
        // 	x: newX,
        // 	width: newW + "px"
        // }, Ease.easeOutExpo);   

        _UIControl.stop();
        _UIControl.css({
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

window.ITE = window.ITE || {};

ITE.ImageProvider = function (){
	//ITE.utils.extend(this, ProviderInterfacePrototype);
	var	imageAsset	= document.createElement("img") 
	//_UIControl	= document.createElement("div");
	var trackInteractionEvent= new ITE.pubSubStruct();

	//_UIControl.addClass(“UIControl”)

	var startPos = {
		position : absolute,
		left : 0px,
		top : 0px,
		height : 100%, 
		width : 100%, 
		overflow : hidden
	};

	function loadAsset(imageAsset){
			_super.loadAsset()

			//Sets the image’s URL source
			this._image.src = this.TrackData.trackID.URL

			// When image has finished loading, set status to “paused”, and position 
	  element where it should be for the first keyframe
	this._image.addEventListener("load", (function (event) {
				this.setStatus(2);
				this.setState(keyframes[0]);
	};

		/* 
		I/P: none
		Grabs current actual state of image, and sets savedState to it 
	returns savedState
	O/P: savedState
	*/
		function getState(){
			this.savedState = {
	“displayNumber”:	getLastKeyframe().displayNumber	
	“time”:			timeManager.getElapsedSeconds()
	“opacity”:		_image.opacity(),
	“pos”: {
		“x”:	_image.position().left,
		“y”:	_image.position().top
	},
	“size”: {
		“height”:	_image.height(),
		“width”: 	_image.width()
	},
			};	
			return savedState;
		};


		/*
	I/P: state	state to make actual image reflect
		Sets properties of the image to reflect the input state
	O/P: none
	*/
		function setState(state){
	_UIControl.css({
	left:		state.position.left,
	top:		state.position.top,
	height:		state.size.height,
	width:		state.size.width,
	opacity:	state.opacity
	});

	savedState = state	
	};

		/* 
		I/P: none
		interpolates between current state and next keyframe
	O/P: none
	*/
		function animate(){
			// animate to next keyframe after where we are right now
			var targetKeyFrame = getNextKeyframe(timeManager.getElapsedSeconds().)

	         media.onload =function(){
	                        var  mediaobj = new Kinetic.Image(){
	                //set properties x,y,height, width followed by
	                image : media
	                         });
	            	 layer.add(mediaobj); //add the kinetic image to the stage’s layer
	            	stage.add(layer); //add layer to the stage
	            
	            	var animation = new Kintetic.Animation(function(frame){
	               	 //define animation as desired},layer);
	            	animation.start();

			// When current animation has finished, begin next animation
	this.animation.addEventListener("animationFinished", (function (event) {
		this.animate() //This will start animation to the next keyframe
			}

	};

		/* 
		I/P: none
		Return a set of interactionHandlers attached to asset from provider
	We’ll want to make this more robust as we develop it further; currently only simple dragging and scrolling are supported. This is also dependent on the kind of animation library we use for animation.
	We will also want to implement hammer (look at RIN imageES file for more details)
	O/P: interactionHandlers 	array of interaction handlers to be passed to
	Orchestrator
	*/
		function getInteractionHandlers(){

			return {
			// Mousedown
			processDown: function(evt){
				if (orchestrator.getState() !== 3){
					orchestrator.pause()
				};
			
	// Drag
			processDrag: function (evt) {
				_image.css({
					top: 	evt.x;
					left:	evt.y;
				});
				this.TrackInteractionEvent.publish(“processDrag”);
	}

			//Scroll
			processScroll: function (delta, zoomScale, pivot) {
				if (orchestrator.getState() !== 3){
					orchestrator.pause()
				};
				_image.zoomSomehow;
				this.TrackInteractionEvent.publish(“processScroll”);
		};
		//Pinch
		processPinch: function (){
				if (orchestrator.getState() !== 3){
					orchestrator.pause()
				};
				_image.pinchProcess;
	this.TrackInteractionEvent.publish(“processPinch”);

		};

	}
	};

	function attachHandlers () {
		var handlerMethods = this.getInteractionHandlers();
		foreach method in handlerMethods {
			//attach to html asset
	// Initialize everything with Hammer
		hammer.on('touch', processDown);
			hammer.on('drag', function(evt){
				processDrag(evt);
		});
			hammer.on('pinch', processPinch);
		element.onmousewheel = processScroll;
	}
	}
	function play (offset, keyframe) {
		this.animate();

		//need to make sure that the current animation is going through the current 
	keyframe?

	}
};

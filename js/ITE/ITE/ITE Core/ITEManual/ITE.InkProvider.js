window.ITE = window.ITE || {};

ITE.InkProvider = function (trackData, player, taskManager, orchestrator){
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
	//self.savedState		= keyframes[0];
	self.interactionAnimation;
	this.trackData   			= trackData;

    //DOM related
    var _ink,
    	_UIControl;

	//Start things up...
    initialize()

   /** 
	* I/P: none
	* Initializes track, creates UI
	*/
	function initialize(){
		_super.initialize()

		//Create UI and append to ITEHolder
		_UIControl	= $(document.createElement("div"))
			.addClass("UIControl")
			.css({
				"width": "100%",
				"height": "100%",
				"background":"transparent",
				"pointer-events":"none",
			})
	        .attr("id", trackData.assetUrl);

		$("#ITEHolder").append(_UIControl);

		_ink = new tagInk(trackData.assetUrl, _UIControl[0]);

		var i, keyframeData;

		for (i=1; i<keyframes.length; i++) {
			keyframeData={
						  "opacity"	: keyframes[i].opacity,
						  "inkData" : trackData.string
						};
			self.taskManager.loadTask(keyframes[i-1].time, keyframes[i].time, keyframeData, _UIControl, self);
		}
		
		self.status = "ready";
		self.setState(keyframes[0]);
	};


   /** 
	* I/P: none
	* Loads actual image asset, and sets status to paused when complete
	* O/P: none
	*/
	this.load = function(){
			_super.load()
			_ink.loadInk(trackData.string);
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
			inkData			: trackData.string
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
};

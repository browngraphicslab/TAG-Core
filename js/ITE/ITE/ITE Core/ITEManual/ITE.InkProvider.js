window.ITE = window.ITE || {};
//ATTACHED INKS MUST ALWAYS BE AT THE END OF THE JSON FILE

ITE.InkProvider = function (trackData, player, taskManager, orchestrator){
	//Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(),
		self 		= this;

	Utils.extendsPrototype(this, _super);

	// TODO: remove old stuff
    // var keyframes       = trackData.keyframes;   // Data structure to keep track of all displays/keyframes
    // TODO: new stuff start
    self.loadKeyframes(trackData.keyframes);
    // TODO new stuff end

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
    	_UIControl,
   		_attachedAsset;
	//Start things up...
    initialize()

   /** 
	* I/P: none
	* Initializes track, creates UI
	*/
	function initialize(){
		_super.initialize()

		if (trackData.experienceReference !== "null"){
			_attachedAsset = findAttachedAsset(trackData.experienceReference);
			attachToAsset(_attachedAsset);
		};

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
		// TODO: remove old stuff
		// for (i=1; i<keyframes.length; i++) {
		// 	keyframeData={
		// 				  "opacity"	: keyframes[i].opacity,
		// 				  "inkData" : trackData.string
		// 				};
		// 	self.taskManager.loadTask(keyframes[i-1].time, keyframes[i].time, keyframeData, _UIControl, self);
		// }
		
		// self.status = "ready";
		// self.setState(keyframes[0]);
		// TODO: new stuff start
		var keyframesArray = self.keyframes.getContents();
		for (i = 1; i < avlArr.length; i++) {
			keyframeData={
						  "opacity"	: keyframesArray[i].opacity,
						  "inkData" : trackData.string
						};
			self.taskManager.loadTask(keyframesArray[i-1].time, keyframesArray[i].time, keyframeData, _UIControl, self);
		}
		self.setState(keyframesArray[0]);
		self.status = "ready";
		// TODO: new stuff end
	};


   /** 
	* I/P: experienceReference name of asset to attach from Ink
	* Finds the attached asset for the ink track (the track to attach the ink to)
	* O/P: _attachedAsset Actual reference to the track that holds this asset
	*/
	function findAttachedAsset(experienceReference){
		var j,
			track;
		//Loop through trackManager to find the asset whose name matches the Ink's experienceReference
		for (j=0; j<self.orchestrator.trackManager.length; j++) {
			track = self.orchestrator.trackManager[j];
			if (track.trackData.name === experienceReference){
				_attachedAsset = track;
			};
		};
		//If it exists, return it, and if now, throw an error
		if (_attachedAsset) {
			return _attachedAsset;
		} else {
			throw new Error("Failed to find asset '" + experienceReference+ "' for attached ink '" + trackData.name + "'");
		};
	};


	function attachToAsset(assetName){
		_attachedAsset.addInk(self);
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

	this.findAttachedAsset = findAttachedAsset
	this.attachToAsset = attachToAsset;
	this._UIControl = _UIControl;



};

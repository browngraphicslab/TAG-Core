window.ITE = window.ITE || {};
//ATTACHED INKS MUST ALWAYS BE AT THE END OF THE JSON FILE

ITE.ScribbleProvider = function (trackData, player, taskManager, orchestrator){
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
		/*if (trackData.experienceReference !== "null"){
			_attachedAsset = findAttachedAsset(trackData.experienceReference);
			attachToAsset(_attachedAsset);
		};*/
		//Create UI and append to ITEHolder


	       // .attr("id", trackData.assetUrl);

		canvas = (document.createElement('canvas'))
		_UIControl	= $(canvas)
		_UIControl.addClass("UIControl")
		_UIControl.css({
			"height": "100%",
			"width": "100%",
			"opacity": 1,
			"touch-events": "none"
		})

		// $("#ITEHolder").append(_UIControl)
		// _UIControl.append(canvas)

		$("#ITEHolder").append(canvas)

			// Only executed our code once the DOM is ready.
			// Create an empty project and a view for the canvas:
			paper.setup(canvas);

			//for (i = 0; i < trackData.inkObjects.length; i++){
			for (i = 0; i < 1; i++){
				pathInfo = trackData.inkObjects[i]
				// Create a Paper.js Path to draw a line into it:
				//console.log(pathInfo)
				//console.log("pathInfo")
				var path = new paper.Path();
				// Give the stroke style
				path.strokeColor = pathInfo.inkProperties.stroke;
				path.strokeCap = "round";
				path.strokeWidth = pathInfo.inkProperties.strokew*100;
				//path.opacity = pathInfo.inkProperties.strokeo;
				//Iterate through points and add them to curve
				console.log("PATH________________________________________________")
								console.log(pathInfo)
				for (p in pathInfo.inkProperties.path){
					point = pathInfo.inkProperties.path[p]
					var x = point.x * _UIControl.width()//sent over as relative coordiates; we're transforming them into pixel coordinates
					var y = point.y * _UIControl.height()//sent over as relative coordiates; we're transforming them into pixel coordinates
					if (x && y){
						if (p == 0){//draw first point ()
							var start = new paper.Point(x, y);
							// Move to start and draw a line from there
							path.moveTo(start);
						} else {
							path.lineTo(start.add([x, y]));
						}
						console.log("x: " + x)
						console.log("y: " + y)
						if (y >= _UIControl.height()){
							console.log("DLKSJFLSKJFLKJKLSDJKLFSDJLK")
						}
						// Draw the view now:
						paper.view.draw();
						//console.log("x: " + x + " y: " + y)
					}
				}
				//console.log(path)
				//path.simplify()
				//path.smooth()
			}
			_UIControl.on("click", function(e){
				//console.log(Object.keys(e))
				console.log("you clicked at : " + e.clientX + ", " + e.clientY)
			}
			)

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
			console.log("ANIMATING")
	};

	this.findAttachedAsset = findAttachedAsset
	this.attachToAsset = attachToAsset;
	this._UIControl = _UIControl;



};

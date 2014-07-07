window.ITE = window.ITE || {};

ITE.ImageProvider2 = function (trackData, player, taskManager, orchestrator){

	var self = this;
	self.player = player;
	self.taskManager = taskManager;
	self.trackData = trackData;
	self.orchestrator = orchestrator;
	self.state = "loading";

	self._image = $(document.createElement("img"))
		.attr("src", this.trackData.assetUrl);
	self._image.on('load', function(){
					self.load();
					self._image.css({"position":"absolute", 
									  "opacity": 0, 
									  "top": (500*0.5 - self._image.height()/2) + "px", 
									  "left": (1000*0.5 - self._image.width()/2) + "px"});
					
				});

	var ITEHolder = $(document.getElementById("ITEHolder"));

	self.load = function(){
		ITEHolder.append(self._image);
		var keyframes = trackData.keyframes;
		var i, keyframeData;

		for (i=1; i<keyframes.length; i++) {
			keyframeData={"position":"absolute",
						  "opacity": keyframes[i].opacity,
						  "top": (500*keyframes[i].pos.y/100 - self._image.height()/2) + "px",
						  "left": (1000*keyframes[i].pos.x/100 - self._image.height()/2) + "px",
						  "width": (500*keyframes[i].size.x/100) + "px",
						  "height": (1000*keyframes[i].size.y/100) + "px"};
			self.taskManager.loadTask(keyframeData, self._image);
		}
		self.state = "ready";
	}; 


	/* 
	I/P: none
		Grabs current actual state of image, and sets savedState to it 
		returns savedState
	O/P: savedState
	*/
	this.getState = function(){
			this.savedState = {
				displayNumber	: getLastKeyframe().displayNumber,
				time			: timeManager.getElapsedSeconds(),
				opacity			: _image.opacity(),
				pos : {
					x		: _image.position().left,
					y 		: _image.position().top
				},
				size: {
					height	: _image.height(),
					width	: _image.width()
				},
			};	
			return savedState;
		};


	/*
	I/P: state	state to make actual image reflect
		Sets properties of the image to reflect the input state
	O/P: none
	*/
	this.setState = function(state){
	_UIControl.css({
		"left":			state.position.left,
		"top":			state.position.top,
		"height":		state.size.height,
		"width":		state.size.width,
		"opacity":		state.opacity
	});

	savedState = state	
	};
};

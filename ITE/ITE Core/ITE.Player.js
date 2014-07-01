window.ITE = window.ITE || {};

ITE.Player = function Player() {


	var Orchestrator = new ITE.Orchestrator();
	var playerConfiguration  = {
		attachVolume: true,
		attachLoop: true,
		attachPlay: true,
		attachProgressBar: true,
		attachFullScreen: true,
		attachProgressIndicator: true,
		hideControls: false,
		autoPlay: false,
		autoLoop: false,
		setMute: false,
		setInitVolume: 100,
		allowSeek: true,
		setFullScreen: false,
		setStartingOffset: 0,
		setEndTime: NaN //defaults to end of tour if Nan
	}; 
	//dictionary of player configuration options; defaults being set
	this.playerParent = null;
	this.playerElement = document.createElement("div");
	this.playerElement.seteAttribute("id", "ITEPlayer");

	this.changePlayerStyle = function (style) {
		this.playerElement.seteAttribute("style", style);
	};
	this.changePlayerStyle("position:relative; background-color:#000037; height:100%; width:100%");

	this.createITEPlayer = function (playerParent, options){
		this.playerConfiguration = sanitize(options); //replace ones that are listed
		this.playerParent = playerParent;
		//attachVolume();
		attachPlay();
		//attachLoop();
		attachProgressBar();
		//attachFullScreen():
		//attachProgressIndicator();
		this.playerParent.append(this.playerElement);
		return this.playerElement;
	};

	function attachVolume(){
		
	} 

	function attachPlay(){
		var playButton = document.createElement();
	} 

	function attachLoop(){
		
	} 

	function attachProgressBar(){
		
	} 

	function attachFullScreen(){
		
	} 

	function attachProgressIndicator(){
		
	} 


	//Public functions used to interface with TAG Authoring and Kiosk

	function play() {
		orchestrator.play();
	}

	function pause() {
		orchestrator.pause();
	}


	function seek(seekTime) {
		orchestrator.seek(seekTime);
	}

	function load(){
		orchestrator.load();
	}
	function unload(){
		orchestrator.unload();
	}
		
	/*
	I/P:   trackID		track from which to capture a keyframe
	Captures and returns a keyframe
	Used in Authoring
	O/P:   none
	*/ 
	function captureKeyframe(trackID) {
	return this.orchestrator.captureKeyframe(trackID);
	},

	/*
	I/P:    volumeLevel	updated volume level
	O/P:   none
	*/ 
	function setVolume(newVolumeLevel) {
		orchestrator.setVolume(newVolumeLevel);
		currentVolumeLevel = newVolumeLevel;
	}

	/*
	I/P:    muted	bool: is tour muted?
	O/P:   none
	*/ 
	function setMute(muted) {
		muted ? setVolume(0) : setVolume(currentVolumeLevel)
	}


	/*
	I/P:	loop	bool: should play be in loop?
	O/P:	none
	*/ 
	function setLoop(loop) {
	}


};

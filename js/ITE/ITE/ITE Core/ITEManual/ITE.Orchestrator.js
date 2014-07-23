window.ITE = window.ITE || {};

ITE.Orchestrator = function(player) {
	status = 3;		// Current status of Orchestrator (played (1), paused (2), loading (3), buffering(4))
									// Defaulted to ‘loading’
	var	self = this;
	self.narrativeSeekedEvent 	= new ITE.PubSubStruct();
	self.narrativeLoadedEvent 	= new ITE.PubSubStruct();
	self.volumeChangedEvent		= new ITE.PubSubStruct();
	self.stateChangeEvent 		= new ITE.PubSubStruct();
	self.muteChangedEvent		= new ITE.PubSubStruct();

	self.player 			= player;
	trackManager 			= [];	//******* TODO: DETERMINE WHAT EXACTLY THIS IS GOING TO BE************
	self.taskManager 		= new ITE.TaskManager();
	self.status 			= 3;

   /**
    * I/P: {URL}     	dataURL    Location of JSON data about keyframes/tracks
    * Loads and parses JSON data using AJAX, then figures out which assetProvider to use to actually load the asset.
    * Once the asset is loaded, the initializeTracks() is called, and when tracks are ready, the tour is played. 
    * O/P: none
    */
	this.load = function(dataURL){
		var tourData,
			AJAXreq = new XMLHttpRequest(),
			i;

	   	AJAXreq.open( "GET", dataURL, true );
	    AJAXreq.setRequestHeader("Content-type", "application/json");
	    AJAXreq.onreadystatechange = function(){
	        if( AJAXreq.readyState == 4 && AJAXreq.status == 200 ){
	        	//Once request is ready, parse data and call function that actually loads tracks
	       		tourData = JSON.parse(AJAXreq.responseText);
	       		loadHelper();
	        }
	    }
	    AJAXreq.send();


	  /**
	    * I/P: none
	  	* Helper function to load tour with AJAX (called below)
	  	* Calls CreatTrackByProvider, initializes the tracks, load their actual sources, and if they're ready, plays them
	    * O/P: none
	    */
		function loadHelper(){
			//Creates tracks
			for (i = 0; i < tourData.tracks.length; i++){
				var track = tourData.tracks[i]

				createTrackByProvider(track)
			};

			//...Initializes them
			initializeTracks();

			//...Loads them
	    	for (i = 0; i < trackManager.length; i++){
	    		trackManager[i].load()
	    	}

	    	//...And plays them
	    	if (areAllTracksReady()){
				play();
			}
		}



	   /**
	    * I/P: {object}	trackData	object with parsed JSON data about the track
	  	* Creates track based on providerID
	    * O/P: none
	    */
		function createTrackByProvider(trackData){
			switch (trackData.providerId){
				case "image" : 
					self.trackManager.push(new ITE.ImageProvider(trackData, self.player, self.taskManager, self));
					break;
				case "video" : 
					self.trackManager.push(new ITE.VideoProvider(trackData, self.player, self.taskManager, self));
					break;
				case "audio" : 
					self.trackManager.push(new ITE.AudioProvider(trackData, self.player, self.taskManager, self));
					break;
				case "deepZoom" : 
					trackManager.push(new ITE.DeepZoomProvider(trackData, self.player, self.taskManager, self));
					break;
				case "ink" : 
					self.trackManager.push(new ITE.InkProvider(trackData));
					break;
				default:
					throw new Error("Unexpected providerID; '" + trackData.providerID + "' is not a valid providerID");
			}
		}
	};

	function unload(track){
		trackManager.remove(track)
	}


	function play(){
		var i;
		for (i=0; i<self.trackManager.length; i++) {
			if (self.trackManager[i].state === "loading"){
				setTimeout(self.play, 1000);
				return;
			}
		}
		self.taskManager.scheduledTasks.sort(function(a, b){return a.timerOffset-b.timerOffset});
		self.taskManager.play();
		this.status = 1;
	}

	function pause(){
		self.taskManager.pause();
		this.status = 2;
	}

	function seek(seekTime){

	}

	function setVolume(newVolumeLevel){
		self.volumeChangedEvent.publish(newVolumeLevel)
	    // parseInt(this.status) !== 3 ? self.volumeChangedEvent.publish(newVolumeLevel) : console.log("don't do anything");
	}

	function toggleMute(isMuted){
		self.muteChangedEvent.publish(isMuted)
	}
 
	function captureKeyframe(trackID) {
		var keyFrameData = trackManager(trackID).getState()
		trackManager(trackID).createNewKeyFrame(keyFrameData)
	}

	function areAllTracksReady() {
		var ready = true,
			i;
		for (i = 0; i < trackManager.length; i++){
			var track = trackManager[i]
			if (track.state !== 2) {  //(2 = paused)
				ready = false
			}
		}
	}

	function initializeTracks(){
		var i;
		for (i = 0; i < trackManager.length; i++){
			var track = trackManager[i];
			// Subscribe video and audios to volume changes
			if (track.trackData.providerId === "video" || track.trackData.providerId === "audio") {
				self.volumeChangedEvent.subscribe(track.setVolume, track.trackData.assetUrl, track);
				self.muteChangedEvent.subscribe(track.toggleMute, track.trackData.assetUrl, track);
			}
			// Subscribes everything to other orchestrator events
			self.narrativeSeekedEvent.subscribe(track.seek, null, track)
			self.narrativeLoadedEvent.subscribe(track.load, null, track)
		}
	}
	this.trackManager = trackManager;
	this.unload = unload;
	this.play = play;
	this.pause = pause;
	this.seek = seek;
	this.setVolume = setVolume;
	this.toggleMute = toggleMute;
	this.captureKeyframe = captureKeyframe;
	this.areAllTracksReady = areAllTracksReady;
	this.initializeTracks = initializeTracks;
	this.status = status;
}



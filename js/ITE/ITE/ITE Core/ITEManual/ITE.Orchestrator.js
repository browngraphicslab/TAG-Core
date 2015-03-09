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
	self.tourData;
	self.player 			= player;
	trackManager 			= [];	//******* TODO: DETERMINE WHAT EXACTLY self IS GOING TO BE************
	//self.taskManager 		= new ITE.TaskManager();
	self.status 			= 3;
	self.tourData 			= null;

	self.timeManager = new ITE.TimeManager();
	self.getElapsedTime = function(){
		return self.timeManager.getElapsedOffset();
	};	

   /**
    * I/P: {URL}     	dataURL    Location of JSON data about keyframes/tracks
    * Loads and parses JSON data using AJAX, then figures out which assetProvider to use to actually load the asset.
    * Once the asset is loaded, the initializeTracks() is called, and when tracks are ready, the tour is played. 
    * O/P: none
    */
	self.load = function(dataURL){
		var tourData,
			AJAXreq = new XMLHttpRequest(),
			i;

	   	/*AJAXreq.open( "GET", dataURL, true );
	    AJAXreq.setRequestHeader("Content-type", "application/json");
	    AJAXreq.onreadystatechange = function(){
	        if( AJAXreq.readyState == 4 && AJAXreq.status == 200 ){
	        	//Once request is ready, parse data and call function that actually loads tracks
	       		tourData = JSON.parse(AJAXreq.responseText);
	       		loadHelper();
	        }
	    }
	    AJAXreq.send();*/
	    tourData = dataURL
	    self.tourData = tourData;
	    loadHelper();
	    self.tourData = tourData;

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
			/*console.log("----------------------------------------------------")
			console.log("Name: " + trackData.Name)
			console.log("URL: " + trackData.assetUrl)
			console.log("provider: " + trackData.providerId)
			console.log("----------------------------------------------------")*/

			switch (trackData.providerId){
				case "image" : 
					self.trackManager.push(new ITE.ImageProvider(trackData, self.player, self.timeManager, self));
					break;
				case "video" : 
					//self.trackManager.push(new ITE.VideoProvider(trackData, self.player, self.timeManager, self));
					break;
				case "audio" : 
					self.trackManager.push(new ITE.AudioProvider(trackData, self.player, self.timeManager, self));
					break;
				case "deepZoom" : 
					self.trackManager.push(new ITE.DeepZoomProvider(trackData, self.player, self.timeManager, self));
					break;
				case "ink" : 
					//self.trackManager.push(new ITE.scribbleProvider(trackData, self.player, self.timeManager, self));
					break;
				default:
					throw new Error("Unexpected providerID; '" + trackData.providerId + "' is not a valid providerID");
			}
		}
	};

	function unload(track){
		trackManager.remove(track)
	}
	/**
	    * I/P: none
	  	* getter for the tour data
	    * O/P: tourData object
	    */
	function getTourData(){
		return self.tourData;
	}
	/**
	    * I/P: none
	  	* getter for the status
	    * O/P: tourData object
	*/
	function getStatus(){
		return this.status;
	}

	function play(){
		var i;
		for (i=0; i<self.trackManager.length; i++) {
			if (self.trackManager[i].state === "loading"){
				setTimeout(self.play, 1000);//TODO not have self be a timeout...
				return;
			}
		}
		// TODO: OLD STUFF
		// self.taskManager.scheduledTasks.sort(function(a, b){return a.timerOffset-b.timerOffset});
		// self.taskManager.play();
		// TODO: NEW STUFF
		for (i = 0; i < self.trackManager.length; i++) {
			self.trackManager[i].play();
		}
		self.timeManager.startTimer();
		// TODO: END
		self.status = 1;
	}

	function pause(){
		// TODO: OLD
		// self.taskManager.pause();
		// TODO: NEW
		self.timeManager.stopTimer();
		for (i = 0; i < self.trackManager.length; i++) {
			self.trackManager[i].pause();
		}
		// TODO: END
		self.status = 2;
	}

	function seek(seekPercent) {
		// Change time.
		var seekTime = seekPercent * self.tourData.totalDuration;
		self.timeManager.addElapsedTime(seekTime - this.timeManager.getElapsedOffset());

		// Inform tracks of seek.
		for (i = 0; i < self.trackManager.length; i++) {
			self.trackManager[i].seek();
		}
		//self.taskManager.seek(seekTime * self.tourData.totalDuration);
	}

	function setVolume(newVolumeLevel){
	    self.volumeChangedEvent.publish(newVolumeLevel)
	    // parseInt(self.status) !== 3 ? self.volumeChangedEvent.publish(newVolumeLevel) : console.log("don't do anything");
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
	self.trackManager = trackManager;
	self.unload = unload;
	self.play = play;
	self.pause = pause;
	self.seek = seek;
	self.setVolume = setVolume;
	self.toggleMute = toggleMute;
	self.getElapsedTime = self.timeManager.getElapsedOffset;
	self.captureKeyframe = captureKeyframe;
	self.areAllTracksReady = areAllTracksReady;
	self.initializeTracks = initializeTracks;
	self.getTourData = getTourData;
	self.status = status;
}



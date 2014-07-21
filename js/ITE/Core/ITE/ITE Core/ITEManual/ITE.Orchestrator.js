window.ITE = window.ITE || {};

ITE.Orchestrator = function(player) {
	status = 3;		// Current status of Orchestrator (played (1), paused (2), loading (3), buffering(4))
									// Defaulted to ‘loading’
	var	self = this,
		narrativeSeekedEvent 	= new ITE.PubSubStruct(),
		narrativeLoadedEvent 	= new ITE.PubSubStruct(),
		stateChangeEvent 		= new ITE.PubSubStruct();

		self.player 			= player;
		trackManager 			= [];	//******* TODO: DETERMINE WHAT EXACTLY THIS IS GOING TO BE************
		self.taskManager 		= new ITE.TaskManager();
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
					trackManager.push(new ITE.ImageProvider(trackData, self.player, self.taskManager, self));
					break;
				case "video" : 
					trackManager.push(new ITE.VideoProvider(trackData, self.player, self.taskManager, self));
					break;
				case "audio" : 
					trackManager.push(new ITE.AudioProvider(trackData, self.player, self.taskManager, self));
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

	function triggerCurrentTracks (tasks) {
		this.status = 1
		//var currentElaspedTime = this.taskManager.getElapsedTime();

		for (task in tasks){
			if (tasks.hasOwnProperty(task)){
				task.track.play(task.offset, task.keyframe);
			};
		};
	};

	function pause(){
		self.taskManager.pause();
		this.status = 2;
	}

	function seek(seekTime){
	}

	function setVolume(newVolumeLevel){
	    this.volumeChangedEvent.publish({ "volume" : newVolumeLevel });
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
			if (track.providerID === "video" || track.providerID === "audio") {
				volumeChangedEvent.subscribe(track.changeVolume)
			}
			// Subscribes everything to other orchestrator events
			narrativeSeekedEvent.subscribe(track.seek)
			narrativeLoadedEvent.subscribe(track.load)

			//add each keyframe as a scheduled task
			for (j = 0; j < track.keyframes.length; j++){
				var keyframe = track.keyframes[j]
				self.taskManager.loadTask(keyframe.offset, keyframe, track);
			}
		}
	}
	this.trackManager = trackManager;
	this.unload = unload;
	this.play = play;
	this.triggerCurrentTracks = triggerCurrentTracks;
	this.pause = pause;
	this.seek = seek;
	this.setVolume = setVolume;
	this.captureKeyframe = captureKeyframe;
	this.areAllTracksReady = areAllTracksReady;
	this.initializeTracks = initializeTracks;
	this.status = status;
}



window.ITE = window.ITE || {};

ITE.Orchestrator = function(player) {
	var status = 3;		// Current status of Orchestrator (played (1), paused (2), loading (3), buffering(4))
									// Defaulted to ‘loading’
		trackManager = [],	//******* TODO: DETERMINE WHAT EXACTLY THIS IS GOING TO BE************
		taskManager  = new ITE.TaskManager(),
		playerChangeEvent = new ITE.PubSubStruct(),
		narrativeSeekedEvent = new ITE.PubSubStruct(),
		narrativeLoadedEvent = new ITE.PubSubStruct(),
		stateChangeEvent = new ITE.PubSubStruct();


   /**
    * I/P: {URL}     	dataURL    Location of JSON data about keyframes/tracks
    * Loads and parses JSON data using AJAX, then figures out which assetProvider to use to actually load the asset.
    * Once the asset is loaded, the initializeTracks() is called, and when tracks are ready, the tour is played. 
    * O/P: none
    */
	function load(dataURL){
		var tourData;
	    var AJAXreq = new XMLHttpRequest();

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
			for (track in tourData.tracks){
				if (tourData.tracks.hasOwnProperty(track)){
					track = tourData.tracks[track]
					createTrackByProvider(track)
				};
			};

			//...Initializes them
			initializeTracks();

			//...Loads them
	    	for (i = 0; i < trackManager.length; i++){
	    		trackManager[i].load()
	    	}

	    	//...And plays them!
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
			switch (trackData.providerID){
				case "Image" : 
					trackManager.push(new ITE.ImageProvider(trackData));
					break;
				case "Video" : 
					trackManager.push(new ITE.VideoProvider(trackData));
					break;
				case "Audio" : 
					trackManager.push(new ITE.AudioProvider(trackData));
					break;
				case "DeepZoom" : 
					trackManager.push(new ITE.DeepZoomProvider(trackData));
					break;
				case "Ink" : 
					trackManager.push(new ITE.InkProvider(trackData));
					break;
				default:
					throw new Error("Unexpected providerID; '" + track.providerID + "' is not a valid providerID");
			}
		}
	};

	function unload(track){
		trackManager.remove(track)
	}


	function play(){
		// taskManager.start();
		this.status = 1;
	}

	function triggerCurrentTracks (tasks) {
		this.status = this.state.playing;
		//var currentElaspedTime = this.taskManager.getElapsedTime();

		for (task in tasks){
			if (tasks.hasOwnProperty(task)){
				task.track.play(task.offset, task.keyframe);
			};
		};
	};

	function pause(){
		// taskManager.pause();
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
		var ready = true;
		for (track in trackManager){
			if (trackManager.hasOwnProperty(track)){
				if (track.state !== 2) {  //(2 = paused)
					ready = false
				}
			}
		}
	}

	function initializeTracks(){
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
			for (keyframe in track.keyframes){
				if (track.hasOwnProperty(keyframe)){
					taskManager.loadTask(keyframe.offset, keyframe, track);
				}
			}
			
		}
	}
	this.load = load;
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



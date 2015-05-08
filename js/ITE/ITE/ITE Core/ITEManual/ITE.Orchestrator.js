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
	self.prevStatus			= 0; // 0 means we're not scrubbing. 1 - previously playing. 2 - previously paused.
	self.tourData 			= null;
    self.loadQueue = TAG.Util.createQueue(),           // an async queue for artwork tile creation, etc
    self.loadedTracks = 0;

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
	self.load = function(dataURL) {
		var tourData,
			AJAXreq = new XMLHttpRequest(),
			i;
	    tourData = dataURL
	    self.tourData = tourData;
	    loadHelper();

	  /**
	    * I/P: none
	  	* Helper function to load tour with AJAX (called below)
	  	* Calls CreateTrackByProvider, initializes the tracks, load their actual sources, and if they're ready, plays them
	    * O/P: none
	    */
		function loadHelper(){
			//Creates tracks
			for (i = 0; i < tourData.tracks.length; i++){
				var track = tourData.tracks[i]
				self.loadQueue.add(createTrackByProvider(track))
			};

			//...Initializes them
			initializeTracks();

			//...Loads them
	    	for (i = 0; i < trackManager.length; i++){
	    		trackManager[i].load()
	    	}
		}


	   /**
	    * I/P: {object}	trackData	object with parsed JSON data about the track
	  	* Creates track based on providerID
	    * O/P: none
	    */
		function createTrackByProvider(trackData) {
			switch (trackData.providerId){
				case "image" : 
					self.trackManager.push(new ITE.ImageProvider(trackData, self.player, self.timeManager, self));
					break; 
				case "video" : 
					self.trackManager.push(new ITE.VideoProvider(trackData, self.player, self.timeManager, self));
					break;
				case "audio" : 
					self.trackManager.push(new ITE.AudioProvider(trackData, self.player, self.timeManager, self));
					break;
				case "deepZoom" :  
					self.trackManager.push(new ITE.DeepZoomProvider(trackData, self.player, self.timeManager, self));
					break;
				case "ink" : 
					self.trackManager.push(new ITE.InkProvider(trackData, self.player, self.timeManager, self));
					break;
				default:
					throw new Error("Unexpected providerID; '" + trackData.providerId + "' is not a valid providerID");
			}
		}
	};

	/**
	    * I/P: none
	  	* unloads the tour
	    * O/P: none
	 */
	function unload(){
		for (i = self.trackManager.length-1; i >= 0; i--) {
			self.trackManager[i].unload();
			trackManager.remove(trackManager[i]);
		}
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

	function play() {
		var i;
		for (i=0; i<self.trackManager.length; i++) {
			if (self.trackManager[i].state === "loading"){
				setTimeout(self.play, 1000);//TODO not have self be a timeout...
				return;
			}
		}
		for (i = 0; i < self.trackManager.length; i++) {
			self.trackManager[i].play();
		}
		self.timeManager.startTimer();
		self.status = 1;

	}

	function pause() {
		self.timeManager.stopTimer();
		for (i = 0; i < self.trackManager.length; i++) {
			self.trackManager[i].pause();
		}
		self.status = 2; 
	}

	function scrub(seekPercent) {
		// Pause.
		if (self.prevStatus === 0) {
			self.prevStatus = self.status;
		}
		if (self.status === 1) {
			self.pause();
		}

		// Change time.
		var seekTime = seekPercent * self.tourData.totalDuration;
		self.timeManager.addElapsedTime(seekTime - this.timeManager.getElapsedOffset());

		// Inform tracks of seek.
		for (i = 0; i < self.trackManager.length; i++) {
			self.trackManager[i].seek();
		}
	}

	function seek(seekPercent) {
		self.updateZIndices()
		// Pause.
		if (self.prevStatus === 0) {
			self.prevStatus = self.status;
		}
		if (self.status === 1) {
			self.pause();
		}

		// Change time.
		var seekTime = seekPercent * self.tourData.totalDuration;
		self.timeManager.addElapsedTime(seekTime - this.timeManager.getElapsedOffset());

		// Inform tracks of seek.
		var nextKeyframes = new Array(trackManager.length);
		for (i = 0; i < self.trackManager.length; i++) {
			nextKeyframes[i] = self.trackManager[i].seek();
		}

		// If we're playing, continue playing!
		if (self.prevStatus === 1) {
			for (i = 0; i < self.trackManager.length; i++) {
				self.trackManager[i].play(nextKeyframes[i]);
			}
			self.timeManager.startTimer();
			self.status = 1;
		}
		self.prevStatus = 0;
	}

	function setVolume(newVolumeLevel){
	    self.volumeChangedEvent.publish(newVolumeLevel)
	}

	function toggleMute(isMuted){
		self.muteChangedEvent.publish(isMuted)
	}
 
	function captureKeyframe(track) {
		var keyFrameData = track.getKeyframeState()
		track.addKeyframe(keyFrameData)
	}

	function changeKeyframe(track, oldKeyFrame, newKeyFrame) {
		track.keyframes.remove(track.keyframes.find(oldKeyFrame))
		track.keyframes.add(newKeyFrame)
	}

	function deleteKeyframe(track, keyframe){
		track.keyframes.remove(keyframe)
	}

	function updateZIndices(){
		var i;
		for (i = 0; i < trackManager.length; i++){
			trackManager[i].setZIndex(i*10)
		}
	}

	function deleteTrack(track){
		var index = trackManager[indexOf(track)]
		if (index > -1) {
		    trackManager.splice(index, 1);
		}
		track.unload();
	}

	function playWhenAllTracksReady() {
		self.loadedTracks++
		if (self.loadedTracks == trackManager.length){
			self.play()
		}
	}

	/**
	    * I/P: track
	  	* initializes a single track by subscribing it properly to the applicable events
	    * O/P: none
	 */
	function initializeTrack(track){
			// Subscribe video and audios to volume changes
			if (track.trackData.providerId === "video" || track.trackData.providerId === "audio") {
				self.volumeChangedEvent.subscribe(track.setVolume, track.trackData.assetUrl, track);
				self.muteChangedEvent.subscribe(track.toggleMute, track.trackData.assetUrl, track);
			}
			// Subscribes everything to other orchestrator events
			self.narrativeSeekedEvent.subscribe(track.seek, null, track)
			self.narrativeLoadedEvent.subscribe(track.load, null, track)
	}
	/**
	    * I/P: none
	  	* initializes tracks
	    * O/P: none
	 */
	function initializeTracks(){
		var i;
		for (i = 0; i < trackManager.length; i++){
			var track = trackManager[i];
			initializeTrack(track)
			track.setZIndex(10*i)
		}
	}

	function getTrackManager(){
		return self.trackManager;
	}

	function getTrackBehind(zIndex, evt, isDrag) {
	    cur = -99999999999999999999999999999999999999999999999999999999999999999999999999999;
	    cur_track = null;
	    for (var i = 0; i < self.trackManager.length; i++) {
	        index = self.trackManager[i].trackData.zIndex;
	        if (cur < index && zIndex > index && self.trackManager[i].isInImageBounds && self.trackManager[i].isInImageBounds(evt) && self.trackManager[i].trackData.providerId !== "ink") {
	            cur = index;
	            cur_track = self.trackManager[i];
	        } else if (zIndex === index) {
	            if (self.trackManager[i].isInImageBounds && self.trackManager[i].isInImageBounds(evt)) {
	                if (isDrag && self.manipTrack != null && self.manipTrack === self.trackManager[i]) {
	                    console.log("dragging same track");
	                    return null;
	                } else if (isDrag && self.manipTrack != null && self.manipTrack !== self.trackManager[i]) {
                        //do nothing
	                }else{
	                    return null;
	                }
	            }
	        }
	    }
	    if (isDrag && self.manipTrack != null && self.manipTrack !== cur_track) {
	        console.log("dragging donedone");
	        return self.manipTrack
	    }
	    if (isDrag) {
	        console.log("dragging same track");
	        self.manipTrack = cur_track;
	    }
	    return cur_track;
	}

	self.manipTrack = null;
	self.getTrackManger = getTrackManger;
	self.captureKeyframe = captureKeyframe;
	self.changeKeyframe = changeKeyframe;
	self.deleteKeyframe = deleteKeyframe;
	self.deleteTrack = deleteTrack;
	self.trackManager = trackManager;
	self.updateZIndices = updateZIndices;
	self.unload = unload;
	self.play = play;
	self.pause = pause;
	self.scrub = scrub;
	self.seek = seek;
	self.setVolume = setVolume;
	self.toggleMute = toggleMute;
	self.getElapsedTime = self.timeManager.getElapsedOffset;
	self.getStatus = getStatus;
	self.captureKeyframe = captureKeyframe;
	self.playWhenAllTracksReady = playWhenAllTracksReady;
	self.initializeTracks = initializeTracks;
	self.getTourData = getTourData;
	self.status = status;
	self.getTrackBehind = getTrackBehind;
}

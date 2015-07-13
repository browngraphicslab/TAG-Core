window.ITE = window.ITE || {};
ITE.Orchestrator = function(player, isAuthoring) {
	status = 3;		// Current status of Orchestrator (played (1), paused (2), loading (3), buffering(4))
    // Defaulted to ‘loading’
	var self = this;
	var pctTime = null;
	var reloadCallback = null;
	self.narrativeSeekedEvent 	= new ITE.PubSubStruct();
	self.narrativeLoadedEvent 	= new ITE.PubSubStruct();
	self.volumeChangedEvent		= new ITE.PubSubStruct();
	self.stateChangeEvent 		= new ITE.PubSubStruct();
	self.muteChangedEvent		= new ITE.PubSubStruct();
	self.tourData;
	self.player = player;
	self.isAuthoring = isAuthoring;
	self.currentManipulatedObject = null;
	self.animationFinishHandlerBound = false;
	trackManager 			= [];	//******* TODO: DETERMINE WHAT EXACTLY self IS GOING TO BE************
	//self.taskManager 		= new ITE.TaskManager();
	self.status 			= 3;
	self.prevStatus			= 0; // 0 means we're not scrubbing. 1 - previously playing. 2 - previously paused.
    self.loadQueue = TAG.Util.createQueue(),           // an async queue for artwork tile creation, etc
    self.loadedTracks = 0;

	self.timeManager = new ITE.TimeManager();
	self.getElapsedTime = function(){
		return self.timeManager.getElapsedOffset();
	};	
	if (idleTimer) {
	    idleTimer.tourPlaying(true);
	}

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
	    if (idleTimer) {
	        idleTimer.tourPlaying(true);
	    }
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

	function reload(tourData) {
	    self.tourData = tourData;
	}

	/**
	    * I/P: none
	  	* unloads the tour
	    * O/P: none
	 */
	function unload() {
	    if (idleTimer) {
	        idleTimer.tourPlaying(false);
	    }
		for (i = self.trackManager.length-1; i >= 0; i--) {
			self.trackManager[i].unload();
			trackManager.remove(trackManager[i]);
		}
		self.animationFinishHandlerBound = false;
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
	    updateZIndices();
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
		if (idleTimer) {
		    idleTimer.tourPlaying(true);
		}
	}

	function pause() {
	    self.updateZIndices();
		self.timeManager.stopTimer();
		for (i = 0; i < self.trackManager.length; i++) {
			self.trackManager[i].pause();
		}
		self.status = 2;
		if (idleTimer) {
		    idleTimer.tourPlaying(false);
		}
	}

	function scrub(seekPercent) {
	    if (!self.tourData) return;
	    self.updateZIndices();
		// Pause.
		if (self.prevStatus === 0) {
			self.prevStatus = self.status;
		}
		if (self.status === 1) {
			self.pause();
		}

		// Change time.
		var seekTime = seekPercent * self.tourData.totalDuration;
		// self.timeManager.addElapsedTime(seekTime - this.timeManager.getElapsedOffset());
		self.timeManager.addElapsedTime(seekTime - self.timeManager.getElapsedOffset());


		// Inform tracks of seek.
		for (i = 0; i < self.trackManager.length; i++) {
		    self.trackManager[i].seek();
		}
	}


	function seek(seekPercent) {
	    self.updateZIndices();
		// Pause.
		if (self.prevStatus === 0) {
			self.prevStatus = self.status;
		}
		if (self.status === 1) {
		    self.pause();
		}

		if (!self.tourData || !self.tourData.totalDuration) {
		    return;
		}

		// Change time.
		var seekTime = seekPercent * self.tourData.totalDuration;
		//self.timeManager.addElapsedTime(seekTime - this.timeManager.getElapsedOffset());
		self.timeManager.addElapsedTime(seekTime - self.timeManager.getElapsedOffset());

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
			if (idleTimer) {
			    idleTimer.tourPlaying(true);
			}
		}
		self.prevStatus = 0;
	}



	function refresh() {
	    if (self.tourData) {
	        var currTime = self.timeManager.getElapsedOffset(),
                timePercent = currTime / self.tourData.totalDuration;
	        seek(timePercent);
	    }
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

	function captureKeyframeFromTitle(title) {
	    for (var i = 0; i < trackManager.length; i++) {
	        track = trackManager[i];
	        if (title === trackManager[i].trackData.name) {
	            return track.getState();
	        }
	    }
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
		for (i = 0; i < trackManager.length; i++) {
		    if (trackManager[i].isVisible()) {
		        trackManager[i].setZIndex((i * 10) + 1);
		    } else {
		        trackManager[i].setZIndex(-1);
		    }
		}
	}

	function deleteTrack(track){
		var index = trackManager.indexOf(track)
		if (index > -1) {
		    trackManager.splice(index, 1);
		}
		track.unload();
	}
	function authoring() {
	    return self.isAuthoring;
	}
	function playWhenAllTracksReady() {
	    self.loadedTracks++
	    if (self.loadedTracks == trackManager.length) {
	        if (!self.isAuthoring) {
	            self.player.play()
	        } else {
	            if (reloadCallback) {
	                reloadCallback();
	            }
	            reloadCallback = null;
	        }

	        self.loadedTracks = 0;
	    } else {
	        self.player.pause();
	    }
	}

	function setPendingCallback(callback) {
	    reloadCallback = callback;
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

	function getTrackBehind(zIndex, evt) {
	    manipulated = null;
	    for (var i = zIndex - 1; i >= 0; i--) {
	        depth = self.trackManager[i].trackData.zIndex;
	        if (self.trackManager[i].isInImageBounds && self.trackManager[i].isInImageBounds(evt)) {
	            return self.trackManager[i];
	        }
	    }
	    return manipulated;
	}

	function bindCaptureHandlers(handlers) {
	    var i;
	    handlers = handlers.reverse();
	    for (i = 0; i < trackManager.length; i++) {
	        var track = trackManager[i];
	        if (track.type === "dz" || track.type === "image") {
	            track.registerCaptureHandler(handlers[i]);
	            track.registerCaptureFinishedHandler(handlers[i]);
	        }
	    }
	}

	function updateInkPositions() {
	    var i;
	    for (i = 0; i < trackManager.length; i++) {
	        var track = trackManager[i];
	        if (track.type === "image") {
	            track.updateInk(true);
	        }
	    }
	}

	self.updateInkPositions = updateInkPositions;
	self.manipTrack = null;
	self.getTrackManager = getTrackManager;
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
	self.refresh = refresh;
	self.setVolume = setVolume;
	self.toggleMute = toggleMute;
	self.getElapsedTime = self.timeManager.getElapsedOffset;
	self.getStatus = getStatus;
	self.captureKeyframeFromTitle = captureKeyframeFromTitle;
	self.playWhenAllTracksReady = playWhenAllTracksReady;
	self.initializeTracks = initializeTracks;
	self.getTourData = getTourData;
	self.status = status;
	self.getTrackBehind = getTrackBehind;
	self.bindCaptureHandlers = bindCaptureHandlers;
	self.setPendingCallback = setPendingCallback;
	self.authoring = authoring;
}

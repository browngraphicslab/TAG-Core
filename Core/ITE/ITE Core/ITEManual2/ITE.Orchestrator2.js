window.ITE = window.ITE || {};

ITE.Orchestrator2 = function(player) {
	var orchestratorState;
	var self = this;
	this.player = player;
	this.tourObj;
	this.trackManager = [];
	self.taskManager = new ITE.TaskManager2();

	this.load = function (tourObj) {
		this.tourObj = tourObj;
		var tracks = tourObj.tracks;
		var i;
		for (i=0; i<tracks.length; i++) {
			if (tracks[i].providerId === "image"){
					this.trackManager.push(new ITE.ImageProvider(tracks[i], this.player, self.taskManager));
			}
		}
	}

	function unload(track){
		trackManager.remove(track)
	}


	self.play = function (){
		var i;
		for (i=0; i<self.trackManager.length; i++) {
			if (self.trackManager[i].state === "loading"){
				setTimeout(self.play, 1000);
				return;
			}
		}
		self.taskManager.play();
	}

	// function triggerCurrentTracks (tasks) {
	// 	this.orchestratorState = this.state.playing;
	// 	//var currentElaspedTime = this.taskManager.getElapsedTime();

	// 	for (task in tasks){
	// 		if (tasks.hasOwnProperty(task)){
	// 			task.track.play(task.offset, task.keyframe);
	// 		};
	// 	};
	// };

	self.pause = function(){
		self.taskManager.pause();
	}

	function seek(seekTime){
		self.taskManager.seek(seekTime);
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
					taskManager.loadTask(keyframe, track);
				}
			}
			
		}
	}

}



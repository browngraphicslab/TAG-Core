window.ITE = window.ITE || {};

ITE.Orchestrator = function() {

	var orchestratorState;
	var trackManager;
	var playerChangeEvent = new ITE.pubSubStruct();
	var trackManger = {}; 
	var playEvent = new ITE.pubSubStruct();

	var taskManager  = new ITE.taskManager(this); 

	this.load = function (tourData){
		var trackData;
		foreach(trackData in tourData.trackList){
			ITE.track.createNew(trackData, context); 
		}

		loadedEvent.publish();	

		if (this.areAllTracksReady()){
			this.play();
		}

		this.initializeTracks();
	};
		

	function unload(){
	
	}

	function unload(track){
		trackManager.remove(track)
	}


	function play(){
		taskManager.start();
		playEvent.publish(timeManager.getElapsedTime());
	}

	function triggerCurrentTracks (tasks) {
		this.orchestratorState = this.state.playing;
		//var currentElaspedTime = this.taskManager.getElapsedTime();

		foreach task in tasks {
			task.track.play(task.offset, task.keyframe);
		}

	}

	function pause(){
		taskManager.pause();
		pauseEvent.publish(timeManager.getElapsedTime());
	}

	function seek(seekTime){
	    seekedEvent.publish({ ‘seekTime’: seekTime});
	}

	function setVolume(newVolumeLevel){
	    this.volumeChangedEvent.publish({ "volume": newVolumeLevel });
	}
 
	function captureKeyframe(trackID) {
		var keyFrameData = trackManager(trackID).getState()
		trackManager(trackID).createNewKeyFrame(keyFrameData)
	}

	function areAllTracksReady() {
		var ready = true;
		for track in trackManager {
			if (track.state !== 2) {  //(2 = paused)
				ready = false
			}
		}
	}

	function initializeTracks(){
		for all tracks in trackManager {

		// Subscribe video and audios to volume changes
		if (track.providerID === ‘video’ || track.providerID === ‘audio’) {
			volumeChangedEvent.subscribe(track.changeVolume)
		}

		// Subscribes everything to other orchestrator events
		narrativeSeekedEvent.subscribe(track.seek)
		narrativeLoadedEvent.subscribe(track.load)
		playEvent.subscribe(track.play);

		//add each keyframe as a scheduled task
		foreach keyframe in track {
			this.taskManager.loadTask(keyframe.offset, keyframe, track);
			}

		}
	}
}

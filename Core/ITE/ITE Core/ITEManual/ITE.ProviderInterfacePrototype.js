// I/P: ESData 	parsed data associated with the track

window.ITE = window.ITE || {};

ITE.ProviderInterfacePrototype = function(TrackData){ 
	this.currentStatus			= 3;		// Current status of Orchestrator (played (1), paused (2), loading (3), buffering(4))
									// Defaulted to ‘loading’

	this.savedState				= null; 	// Current state of track (last-saved state)
	this.duration				= 0;	// Duration of track
	this.keyframes				= []; 	// Data structure to keep track of all displays/keyframes

	this.interactionHandlers 	= null;	// object with a set of handlers for common tour interactions such as mousedown/tap, mousewheel/pinch zoom, etc. so that a generic function within the orchestrator can bind and unbind handlers to the media element

	this.currentAnimation		= null; // Current animation, if any (between two different states of the asset)
										// Saved as variable to make pausing and playing easier

	this.TrackInteractionEvent	= null; // Raised when track is interacted with.  This is for the inks to subscribe to.

	this.TrackData				= TrackData;

	/*
	I/P: none
		Only parses displays here; function filled out in specific providerInterface classes
		Public function
	O/P: none
	*/
	this.loadAsset = function(){
		this.parseDisplays(TrackData);
	}

	/*
	I/P: none
		Only parses displays here; function filled out in specific providerInterface classes
		Public function
	O/P: none
	*/
	this.unLoadAsset = function(){
		Orchestrator.removeTrack(this);
	}

	/*
	I/P: none
		Parses track data of keyframes into the correct displays
	O/P: none
	*/
	this.parseDisplays = function (trackData) {
		//Leaving this for now as we don’t yet know what data structure we want to use
	};

	/* 
	I/P: none
		Starts or resumes tour
		Called when tour is played
		Starts animation, if needed
	O/P: none
	*/
	this.play = function(){
	// Resets state to be where it was when track was paused
		this.setState(savedState);

	// Starts animation from saved (and now current) state to the next keyframe
		this.animate();

	// Set current status to “played”
		this.setCurrentStatus(1);
	};

	/* 
	I/P: none
		Pauses animation
		sets savedState to match state when tour is paused
		sets status to paused
	O/P: none
	*/
	this.pause = function(){
		// Stops/cancels animation, if there is one
		currentAnimation && currentAnimation.stop();

		// Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		this.setState(this.getState());

		// Sets currentStatus to paused
		this.setStatus(2);
	};

	/* 
	I/P: none
		Seeks animation from a given offset state
	O/P: none
	*/
	this.seek = function(seekTime){
		// Stops/cancels animation, if there is one
		currentAnimation && currentAnimation.stop();

		// Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		var seekState = animationProvider.interpolate(seekTime, previousKeyFrame(), nextKeyFrame()) //NOTE: this interpolates between the two keyframes to return the state at the given time. I’m not sure exactly what the syntax will be for this, but I know it’s possible in most of the animation libraries we’ve looked at.
			this.setState(state)
			this.play()
	};

	/* 
	I/P: none
		returns current status
	O/P: {status} current status
	*/
	this.getStatus = function(){
		return this.currentStatus
	};

	/* 
	I/P: status	status (from Orchestrator) to set current status of track
		Sets currentStatus to be inputed status
		Public function
	O/P: none
	*/
	this.setStatus = function(status){
		this.currentStatus = status
	};

	/* 
	I/P: none
		will grab data about the current state of the track
		Does nothing for now; function filled out in specific providerInterface classes
	O/P: {state} state
	*/
	this.getState = function(){
	};

	/* 
	I/P: state	state to set current state of track
		Will set state of track to match inputted state
		Does nothing for now; function filled out in specific providerInterface classes
	O/P: none
	*/
	this.setState = function(state){
	};

	/* 
	I/P: none
		Does nothing for now; function filled out in specific providerInterface classes
	O/P: interactionHandlers 	array of interaction handlers to be passed to Orchestrator
	*/
	this.getInteractionHandlers = function(){
		return interactionHandlers;
	};

	/*
    I/P: {state} state to be animated to
	O/P: nothing
	*/
	this.animateMedia = function(state){
         var container = document.createElement("div");
         container.appendChild(media);
         TweenLite.to(container, "duration", state);
	};


	/*
	I/P: time	either passed-in time or current time
	determines the next keyframe to be displayed
	O/P: nextKeyframe: next keyframe to be displayed
	*/
	this.getNextKeyframe = function(time){
		var 	time		= time || timeManager.getElapsedSeconds()
			keyFrame 	= keyframes[0];
	// Loops through keyframes and returns the first that has a time AFTER our inputted time
	// DEPENDS ON DATASTRUCTURE FOR KEYFRAMES/DISPLAYS
		while (keyFrame.time <= time){
			keyFrame = keyFrames.next(keyFrame)
		};
		return keyFrames.next(keyFrame);
	};

	/*
	I/P: time	either passed-in time or current time
	determines the previous keyframe from time offset
	O/P: previousKeyframe: previous keyframe 
	*/
	this.getPreviousKeyframe = function(time){
		var 	time		= time || timeManager.getElapsedSeconds()
			keyFrame 	= keyframes[0];
	// Loops through keyframes and returns the last that has a time BEFORE our inputted time
	// DEPENDS ON DATASTRUCTURE FOR KEYFRAMES/DISPLAYS
		while (keyFrame.time <= time){
			keyFrame = keyFrames.next(keyFrame)
		};
		return keyFrame;
	};
}

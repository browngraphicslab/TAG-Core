window.ITE = window.ITE || {};


ITE.TaskManager = function(){

	self = this;

	this.timeline = new TimelineLite({
		onUpdate: this.updateFunction

	});

	//timer of entire tour
	this.timeManager = new ITE.TimeManager();
    
    this.state = 'starting';

	this.getElapsedTime = function(){
		return this.timeManager.getElapsedOffset();
	};	

	this.loadTask = function(duration,nextKeyframeData,asset,offsetParam){
        this.timeline.add(TweenLite.to(asset,duration,nextKeyframeData),offsetParam);
        this.timeline.pause();
        nextKeyframeData.ease = Linear.easeNone;

	};

	this.play = function(){ 
		if (this.state === "paused"){
			this.state = "playing";
	    }
		this.timeline.play();
		console.log("this.timeline: " + this.timeline._totalDuration)
		console.log("this.timeline: " + Object.keys(this.timeline))
		this.timeManager.startTimer();
	};

	this.pause = function(){
		this.state = "paused";
		this.timeline.pause();
		this.timeManager.stopTimer();
	};

	this.seek= function(seekedTime){
		this.timeManager.addElapsedTime(seekedTime);
		this.timeline.seek(seekedTime);

	};

	this.updateFunction= function(){};
};


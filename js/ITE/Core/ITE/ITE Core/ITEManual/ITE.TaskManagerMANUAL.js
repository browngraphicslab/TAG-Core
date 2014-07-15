window.ITE = window.ITE || {};
//creates a wrapper around a keyframe to indicate a task that needs to be scheduled
ITE.Task = function(timerOffset, nextKeyframeTime, nextKeyframeData, asset, ongoingTasks, track) {
	var self 				= this;
	self.timerOffset 		= timerOffset;
	self.nextKeyframeTime 	= nextKeyframeTime;
	self.nextKeyframeData 	= nextKeyframeData;
	self.asset 				= asset;
	self.ongoingTasks 		= ongoingTasks;
	self.track 				= track

	self.nextKeyframeData.ease = Linear.easeNone;
	self.nextKeyframeData.onComplete = function(){
		self.ongoingTasks.splice(self.ongoingTasks.indexOf(self), 1);
	}
	self.animation;

	this.play = function(fromPause){

			TweenLite.killTweensOf(asset);
			asset.stop();
			self.track.play()
			self.animation = TweenLite.to(self.asset, self.nextKeyframeTime - self.timerOffset, self.nextKeyframeData);		
			self.animation.play();
	};

	this.pause = function() {
		self.track.pause()
		TweenLite.killTweensOf(asset);
		self.animation.kill()
	}
};

//object that is responsible for scheduling different tasks ie. tracks
ITE.TaskManager = function() {
	
	var self = this;
	//list of scheduled tasks to loop through;
	self.scheduledTasks = []; 

	//allow for the scheduling of items within a 0.2sec interval of the timer
	this.timerPrecision = 0.2; 

	//tracks which index in the scheduledTasks list the scheduler is currently at
	this.currentTaskIndex = 0;

	//timer of entire tour
	this.timeManager = new ITE.TimeManager();

	//to keep track of the setInterval of the next scheduled item
	this.timerId = -1;

	this.ongoingTasks = [];
	this.status = "starting";

	//getElaspedTime
	this.getElapsedTime = function(){
		return this.timeManager.getElapsedOffset();
	};	

	//load tasks to be scheduled
	this.loadTask = function(timerOffset, duration, nextKeyframeData, asset, track) {
		var newTask = new ITE.Task(timerOffset, duration, nextKeyframeData, asset, this.ongoingTasks, track);
		this.scheduledTasks.push(newTask);
	};

	//start the scheduler on current tasks
	this.play = function() {
		if (this.status === "paused"){

			this.status = "playing";

			this.scheduleNextTasks();
			
			for (var i=0; i<this.ongoingTasks.length; i++){
				this.ongoingTasks[i].play(true);
			}
			this.timeManager.startTimer();
		}else {
			this.triggerCurrentTasks();
			this.scheduleNextTasks();
			this.timeManager.startTimer();
		}
	};

	//pause the scheduler
	this.pause = function() {
		this.status = "paused"
		clearTimeout(this.timerId);
		this.timerId = -1;
		for (var i=0; i<this.ongoingTasks.length; i++){
			this.ongoingTasks[i].pause();
		}
		this.timeManager.stopTimer();
	};

//seek to the correct point in the scheduler
	this.seek = function(seekedOffset) {
		this.pause();
		this.timeManager.addElapsedTime(seekedOffset);
		this.currentTaskIndex = this.getIndexAt(offset);
		this.triggerCurrentTasks();
		this.scheduleNextTasks();
	};

	this.triggerCurrentTasks = function() {
	
		this.status = "playing";
		var index = this.currentTaskIndex;

		//interval in which to check for tasks to start
		var curTime = this.getElapsedTime();
		var scheduleInterval = curTime + this.timerPrecision;

		while (index < this.scheduledTasks.length && this.scheduledTasks[index].timerOffset <=scheduleInterval) {
			this.ongoingTasks.push(this.scheduledTasks[index]);
			this.scheduledTasks[index].play();
			index++;
		}
		//reset the current task index so that we can schedule subsequent tasks
		this.currentTaskIndex = (index < this.scheduledTasks.length) ? index : -1;
		
	}

	this.scheduleNextTasks = function() {
		if (this.currentTaskIndex < 0){
			clearInterval(this.timerId);
			return; //there are no more tasks to be started/scheduled
		}

		var nextTask = this.scheduledTasks[this.currentTaskIndex];
		//get the interval to wait until the next task is to be started
		var waitInterval = Math.max((nextTask.timerOffset - this.getElapsedTime()), 0);
		clearTimeout(this.timerId);
		this.timerId = setTimeout(function () {self.nextTick();}, waitInterval * 1000);
	};

	this.nextTick = function() {
		this.triggerCurrentTasks();
		this.scheduleNextTasks();
	}

};
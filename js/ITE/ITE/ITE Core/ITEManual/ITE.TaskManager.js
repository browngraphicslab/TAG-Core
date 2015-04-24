window.ITE = window.ITE || {};
//creates a wrapper around a keyframe to indicate a task that needs to be scheduled
ITE.Task = function(timerOffset, nextKeyframeTime, nextKeyframeData, asset, ongoingTasks, track) {

	var self 				= this;
	self.timerOffset 		= timerOffset;
	self.nextKeyframeTime 	= nextKeyframeTime;
	self.nextKeyframeData 	= nextKeyframeData;
	self.asset 				= asset;
	self.ongoingTasks 		= ongoingTasks;
	self.track 				= track;
	self.animation;

	self.play = function(){
		(track.trackData.providerId === 'image') && asset.stop(); //TODO deal with self 
		self.track.play(self.nextKeyframeTime, self.nextKeyframeData);
	};

	self.pause = function() {
		self.track.pause()
	};

};

//object that is responsible for scheduling different tasks ie. tracks
ITE.TaskManager = function() {
	
	var self = this;
	//list of scheduled tasks to loop through;
	self.scheduledTasks = []; 

	//allow for the scheduling of items within a 0.2sec interval of the timer
	self.timerPrecision = 0.2; 

	//tracks which index in the scheduledTasks list the scheduler is currently at
	self.currentTaskIndex = 0;

	//timer of entire tour
	self.timeManager = new ITE.TimeManager();

	//to keep track of the setInterval of the next scheduled item
	self.timerId = -1;

	self.ongoingTasks = [];
	self.status = "starting";

	//getElaspedTim+e
	self.getElapsedTime = function(){
		return self.timeManager.getElapsedOffset();
	};	

	//load tasks to be scheduled
	self.loadTask = function(timerOffset, nextKeyframeTime, nextKeyframeData, asset, track) {
		var newTask = new ITE.Task(timerOffset, nextKeyframeTime, nextKeyframeData, asset, self.ongoingTasks, track);
		self.scheduledTasks.push(newTask);
	};

	//start the scheduler on current tasks
	self.play = function() {
		if (self.status === "paused"){

			self.status = "playing";

			self.scheduleNextTasks();
			for (var i=0; i<self.ongoingTasks.length; i++){
				self.ongoingTasks[i].play(true);
			}
			self.timeManager.startTimer();
		} else {
			self.triggerCurrentTasks();
			self.scheduleNextTasks();
			self.timeManager.startTimer();
		}
	};

	//pause the scheduler
	self.pause = function() {
		self.timeManager.stopTimer();
		self.status = "paused"
		clearTimeout(self.timerId);
		self.timerId = -1;
		for (var i=0; i<self.ongoingTasks.length; i++){
			self.ongoingTasks[i].pause();
		}
	};

//seek to the correct point in the scheduler
	self.seek = function(seekedOffset) {
		self.pause();
		self.timeManager.addElapsedTime(seekedOffset);
		self.currentTaskIndex = self.getIndexAt(seekedOffset);
		self.triggerCurrentTasks();
		self.scheduleNextTasks();
	};

	self.triggerCurrentTasks = function() {
		self.status = "playing";
		var index 	= self.currentTaskIndex,
			i 		= 0,
			task;

		//interval in which to check for tasks to start
		var curTime = self.getElapsedTime();
		var scheduleInterval = curTime + self.timerPrecision;

		while (index < self.scheduledTasks.length && self.scheduledTasks[index].timerOffset <= scheduleInterval) {
			task = self.scheduledTasks[index]
			self.ongoingTasks.push(task);
			task.play();
			task.track.currentAnimationTask && self.ongoingTasks.splice(self.ongoingTasks.indexOf(task.track.currentAnimationTask), 1);
			task.track.currentAnimationTask = task;
			index++;
		}
		//reset the current task index so that we can schedule subsequent tasks
		self.currentTaskIndex = (index < self.scheduledTasks.length) ? index : -1;
		
	}

	self.scheduleNextTasks = function() {
		if (self.currentTaskIndex < 0){
			clearInterval(self.timerId);
			return; //there are no more tasks to be started/scheduled
		}

		var nextTask = self.scheduledTasks[self.currentTaskIndex];
		//get the interval to wait until the next task is to be started
		var waitInterval = Math.max((nextTask.timerOffset - self.getElapsedTime()), 0);
		clearTimeout(self.timerId);
		self.timerId = setTimeout(function () {self.nextTick();}, waitInterval * 1000);
	};

	self.nextTick = function() {
		self.triggerCurrentTasks();
		self.scheduleNextTasks();
	}

};
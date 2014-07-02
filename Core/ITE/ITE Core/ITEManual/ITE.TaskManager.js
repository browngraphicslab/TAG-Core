window.ITE = window.ITE || {};
//creates a wrapper around a keyframe to indicate a task that needs to be scheduled
ITE.Task = function(timerOffset, duration, nextKeyframeData, asset) {
	this.offset = timerOffset;
	nextKeyframeData.ease = Linear.easeNone;
	this.callback = function(){
		var animation = TweenLite.to(asset, duration, nextKeyframeData);
		animation.play();
	};
};

var cat1 = document.getElementById('cat1');
var cat2 = document.getElementById('cat2');

//object that is responsible for scheduling different tasks ie. tracks
ITE.TaskManager = function() {
	
	self = this;
	//list of scheduled tasks to loop through;
	this.scheduledTasks = []; 

	//allow for the scheduling of items within a 0.2sec interval of the timer
	this.timerPrecision = 0.2; 

	//tracks which index in the scheduledTasks list the scheduler is currently at
	this.currentTaskIndex = 0;

	//timer of entire tour
	this.timeManager = new ITE.TimeManager();

	//to keep track of the setInterval of the next scheduled item
	this.timerId = -1;

	//getElaspedTime
	this.getElapsedTime = function(){
		return this.timeManager.getElapsedOffset();
	};	

	//load tasks to be scheduled
	this.loadTask = function(timerOffset, duration, nextKeyframeData, asset) {
		var newTask = new ITE.Task(timerOffset, duration, nextKeyframeData, asset);
		this.scheduledTasks.push(newTask);
	};

	//start the scheduler on current tasks
	this.play = function() {
		this.triggerCurrentTasks();
		this.scheduleNextTasks();
		this.timeManager.startTimer();
	};

	//pause the scheduler
	this.pause = function() {
		clearTimeout(this.timerId);
		this.timerId = -1;
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
		var index = this.currentTaskIndex;

		//interval in which to check for tasks to start
		var scheduleInterval = this.getElapsedTime() + this.timerPrecision;

		while (index < this.scheduledTasks.length && this.scheduledTasks[index].offset <=scheduleInterval) {
			this.scheduledTasks[index].callback.call();
			index++;
		}
		//reset the current task index so that we can schedule subsequent tasks
		this.currentTaskIndex = (index < this.scheduledTasks.length) ? index : -1;
	}

	this.scheduleNextTasks = function() {
		if (this.currentTaskIndex < 0){
			clearInterval(myTimer);
			return; //there are no more tasks to be started/scheduled
		}

		var nextTask = this.scheduledTasks[this.currentTaskIndex];

		//get the interval to wait until the next task is to be started
		var waitInterval = Math.max((nextTask.offset - this.getElapsedTime()), 0);

		clearTimeout(this.timerId);
			this.timerId = setTimeout(function () {self.nextTick();}, waitInterval * 1000);
	};

	this.nextTick = function() {
		this.triggerCurrentTasks();
		this.scheduleNextTasks();
	}

};


var newPlayer = new ITE.TaskManager();

var myTimer = setInterval(function(){document.getElementById("timer").innerHTML = newPlayer.getElapsedTime();}, 1000);

newPlayer.loadTask(0, 3, {left: "900px", top: "30px"}, cat1);
newPlayer.loadTask(0, 3, {left: "-100px", top: "400px"}, cat2);
newPlayer.loadTask(3, 5, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat1);
newPlayer.loadTask(3, 5, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat2);
newPlayer.loadTask(8, 3, {left: "900px", top: "30px"}, cat1);
newPlayer.loadTask(10, 2, {left: "-100px", top: "400px"}, cat2);
newPlayer.loadTask(15, 3, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat1);
newPlayer.loadTask(17, 3, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat2);
newPlayer.play();
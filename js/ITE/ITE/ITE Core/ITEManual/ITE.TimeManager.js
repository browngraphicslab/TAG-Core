window.ITE = window.ITE || {};

ITE.TimeManager = function(){

	var self = this;

	self.isRunning = false; //stopwatch value indicating the time of the tour
	self.startingOffset = 0; //the starting offset
	self.elapsedOffset = 0; //how much time has elapsed

	//getIsRunning
	self.getIsRunning = function(){
		return self.isRunning;
	};

	//getElapsedOffset
	self.getElapsedOffset = function(){
		var offset = (Date.now()/1000 - self.startingOffset) + self.elapsedOffset;
		if (self.isRunning){
			return offset;
		}else {
			return self.elapsedOffset;
		}
	};

	self.addElapsedTime = function(offset) {
		var now = Date.now() / 1000;
		if (self.isRunning) {
			self.elapsedOffset = (now - self.startingOffset) + offset;
			self.startingOffset = now;
		} else {
			self.elapsedOffset += offset;
			self.startingOffset = now;
		}
	}

		//start the timer
	self.startTimer= function(){
		console.log("START TIMER");
		self.startingOffset = Date.now() / 1000; //get startingOffset in seconds
		self.isRunning = true;
	};

	//pause the timer
	self.stopTimer = function(){
		console.log("STOP TIMER");
		if (self.isRunning){
			self.elapsedOffset = self.getElapsedOffset();
		}
		self.isRunning = false;
	};
};

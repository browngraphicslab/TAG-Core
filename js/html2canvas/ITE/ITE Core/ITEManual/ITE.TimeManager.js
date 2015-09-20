window.ITE = window.ITE || {};

ITE.TimeManager = function(){

	var self = this;

	self.isRunning = false; //stopwatch value indicating the time of the tour
	self.startingOffset = 0; //the starting offset
	self.elapsedOffset = 0; //how much time has elapsed
	self.end = false; //whether or not the end of tour has been reached

	//getIsRunning
	self.getIsRunning = function(){
		return self.isRunning;
	};

    //check end of tour.
	/*self.endTour = function (offset) {
	    //if (offset > totalTourDuration) {
	        self.isRunning = false;
	        self.end = true;
	    //}
	}*/

	//return status, depending on whether tour is over or not
	self.isEnd = function() {
		return self.end;
	}

	//getElapsedOffset
	self.getElapsedOffset = function(){
	    var offset = (Date.now() / 1000 - self.startingOffset) + self.elapsedOffset;
	    //self.endTour(offset);

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
		self.startingOffset = Date.now() / 1000; //get startingOffset in seconds
		self.isRunning = true;
	};

	//pause the timer
	self.stopTimer = function(){
		if (self.isRunning){
			self.elapsedOffset = self.getElapsedOffset();
		}
		self.isRunning = false;
	};
};

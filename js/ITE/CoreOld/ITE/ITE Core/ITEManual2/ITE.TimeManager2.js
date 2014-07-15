window.ITE = window.ITE || {};

ITE.TimeManager2 = function(){

	this.isRunning = false; //stopwatch value indicating the time of the tour
	this.startingOffset = 0; //the starting offset
	this.elapsedOffset = 0; //how much time has elapsed

	//getIsRunning
	this.getIsRunning = function(){
		return this.isRunning;
	};

	//getElapsedOffset
	this.getElapsedOffset = function(){
		var offset = (Date.now()/1000 - this.startingOffset) + this.elapsedOffset;
		if (this.isRunning){
			return offset;
		}else {
			return this.elapsedOffset;
		}
	};

	this.addElapsedTime = function(offset) {
		this.elapsedOffset += offset;
	}

		//start the timer
	this.startTimer= function(){
		this.startingOffset = Date.now() / 1000; //get startingOffset in seconds
		this.isRunning = true;
	};

	//pause the timer
	this.stopTimer = function(){
		if (this.isRunning){
			this.elaspedOffset = this.getElapsedOffset();
		}
		this.isRunning = false;
	};
};

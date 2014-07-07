window.ITE = window.ITE || {};


var cat1 = document.getElementById('cat1');
var cat2 = document.getElementById('cat2');

ITE.TaskManager2 = function(){

	self = this;

	this.timeline = new TimelineLite({
		onUpdate: this.updateFunction

	});

	//timer of entire tour
	this.timeManager = new ITE.TimeManager();

	this.getElapsedTime = function(){
		return this.timeManager.getElapsedOffset();
	};	

	this.loadTask = function(duration,nextKeyframeData,asset,offsetParam){
        this.timeline.add(TweenLite.to(asset,duration,nextKeyframeData,offsetParam));
        this.timeline.pause();

	};

	this.play = function(){ 
		this.timeline.play();
		this.timeManager.startTimer();
	};

	this.pause = function(){
		this.timeline.pause();
		this.timeManager.stopTimer();
	};

	this.seek= function(seekedTime){
		this.timeManager.addElapsedTime(seekedTime);
		this.timeline.seek(seekedTime);

	};

	this.updateFunction= function(){};
};

var newPlayer = new ITE.TaskManager2();

// newPlayer.loadTask(3, {left: "900px", top: "30px"}, cat1);
// newPlayer.loadTask(3, {left: "-100px", top: "400px"}, cat2,'label');
// newPlayer.loadTask(2, {left: "-100px", top: "400px"}, cat1,'label');

var fiveImgTest = function(){
	newPlayer.loadTask(2, {left: "900px", top: "30px"}, cat1);
	newPlayer.loadTask(2, {left: "-100px", top: "400px"}, cat2,"g");
	newPlayer.loadTask(2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat2,"s");
	newPlayer.loadTask(1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat1,0);
	newPlayer.loadTask(2, {left: "900px", top: "30px"}, cat1,"s");
	newPlayer.loadTask(2, {left: "-100px", top: "400px"}, cat1,"q");
	newPlayer.loadTask(2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat2,"s");
	newPlayer.loadTask(2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat2,"q");
};

fiveImgTest();
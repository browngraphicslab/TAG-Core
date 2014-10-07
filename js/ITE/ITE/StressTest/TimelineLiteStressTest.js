window.ITE = window.ITE || {};

var cat1 = document.getElementById('cat1');
var cat2 = document.getElementById('cat2');
var cat3 = document.getElementById('cat3');
var cat4 = document.getElementById('cat4');
var cat5 = document.getElementById('cat5');
var cat6 = document.getElementById('cat6');
var cat7 = document.getElementById('cat7');
var cat8 = document.getElementById('cat8');
var cat9 = document.getElementById('cat9');
var cat10 = document.getElementById('cat10');
var cat11 = document.getElementById('cat11');
var cat12 = document.getElementById('cat12');
var cat13 = document.getElementById('cat13');
var cat14 = document.getElementById('cat14');
var cat15 = document.getElementById('cat15');
var cat16 = document.getElementById('cat16');
var cat17 = document.getElementById('cat17');
var cat18 = document.getElementById('cat18');
var cat19 = document.getElementById('cat19');
var cat20 = document.getElementById('cat20');
var cat21 = document.getElementById('cat21');
var cat22 = document.getElementById('cat22');
var cat23 = document.getElementById('cat23');
var cat24 = document.getElementById('cat24');
var cat25 = document.getElementById('cat25');
var cat26 = document.getElementById('cat26');
var cat27 = document.getElementById('cat27');
var cat28 = document.getElementById('cat28');
var cat29 = document.getElementById('cat29');
var cat30 = document.getElementById('cat30');

ITE.TimelineLiteStressTest = function(){

	self = this;

	this.timeline = new TimelineLite({
		onUpdate: this.updateFunction

	});

	this.loadAnim = function(delay,duration,nextKeyframeData,asset,offsetParam){
        this.timeline.to(asset,duration,nextKeyframeData,offsetParam);
	    this.timeline.delay(delay);
	};

	this.play = function(){ 
		this.timeline.play();
	};

	this.pause = function(){
		this.timeline.pause();
	};

	this.seek= function(seekedTime){
		this.timeline.seek(seekedTime);
	};

	this.resume = function(){
		this.timeline.resume();
	};

	this.restart = function(){
		this.timeline.restart();
	};

	this.timescale = function(factor){
		this.timeline.timescale(factor);
	};

	this.updateFunction= function(){};
};

var newPlayer = new ITE.TimelineLiteStressTest();

// newPlayer.loadAnim(0, 3, {left: "900px", top: "30px"}, cat1);
// newPlayer.loadAnim(0, 3, {left: "-100px", top: "400px"}, cat4,'label');
// newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat6,'label');

var fiveImgTest = function(){
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat1);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat2,"g");
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat3,"s");
	newPlayer.loadAnim(1, 1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat4,0);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat5,"s");
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat3,"q");
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat2,"s");
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat3,"q");
};

var tenImgTest = function(){
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat1);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat2,"g");
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat3,"s");
	newPlayer.loadAnim(1, 1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat4,0);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat5,"s");
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat3,"q");
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat2,"s");
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat3,"q");
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat1);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat2);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat3,'e');
	newPlayer.loadAnim(1, 1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat4,'e');
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat5);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat6);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat2,"l");
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat7,'q');
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat8);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat9);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat10,"l");
	newPlayer.loadAnim(1, 1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat10,'h');
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat3);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat6);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat8,0);
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat1,"l");
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat6);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat5);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat9,"l");
	newPlayer.loadAnim(1, 1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat10,'h-=0.5');
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat10,"-=1");
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat3,"-=2");
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat4,"l");
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat5,'w');

};

var thirtyImageTest = function(){
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat1);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat2,0);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat3,"s");
	newPlayer.loadAnim(1, 1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat4,0);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat5,"s");
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat3,"q");
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat2,"s");
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat3,"q");
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat1);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat2);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat3,'e');
	newPlayer.loadAnim(1, 1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat4,'e');
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat5);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat6);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat2,"l");
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat7,'q');
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat8);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat9);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat10,"l");
	newPlayer.loadAnim(1, 1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat10,'h');
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat3);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat6);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat8,0);
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat1,"l");
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat6);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat5);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat9,"l");
	newPlayer.loadAnim(1, 1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat10,'h-=0.5');
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat10,"-=1");
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat3,"-=2");
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat4,"l");
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat5,'w');
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat16);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat9);
	newPlayer.loadAnim(1, 1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat17);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat18);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat3);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat19);
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat20);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat21);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat23);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat22);
	newPlayer.loadAnim(1, 2, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat4);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat24);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat25);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat2);
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat7);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat26);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat9);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat27);
	newPlayer.loadAnim(1, 2, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat28);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat29);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat30);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat30);
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat30);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat25);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat23);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat22);
	newPlayer.loadAnim(1, 1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat21);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat26);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat17);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat17);
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat17);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat15);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat22);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat13);
	newPlayer.loadAnim(1, 1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat14);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat15);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat16);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat12);
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat27);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat28);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat29);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat11);
	newPlayer.loadAnim(1, 2, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat12);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat12);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat26);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat18);
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat21);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat16);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat25);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "100px"}, cat19);
	newPlayer.loadAnim(1, 1, {left: "1200px", top: "400px", width: "100px", height: "100px"}, cat12);
	newPlayer.loadAnim(0, 2, {left: "900px", top: "30px"}, cat13);
	newPlayer.loadAnim(0, 2, {left: "-100px", top: "400px"}, cat30);
	newPlayer.loadAnim(0, 2, {left: "30px", top: "30px", width: "100px", height: "600px"}, cat25);
	newPlayer.loadAnim(0, 2, {left: "670px", top: "400px", width: "10px", height: "600px"}, cat22);

};

//fiveImgTest();
//document.activeElement.blur();
//tenImgTest();
thirtyImageTest();
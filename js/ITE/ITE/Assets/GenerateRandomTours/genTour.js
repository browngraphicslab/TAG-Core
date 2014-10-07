var myTour = "";

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


//type: image, deepZoom, audio, video
function createImageTrack(trackName, length, assetUrl) {
	var track = "{\"name\": \""+trackName+"\", \"providerId\": \"image\", \"assetUrl\": \""+assetUrl+"\", ";

	var dispNum = 1;
	var dispStartTime = getRandomInt (0, (length-3));
	var dispLength = getRandomInt (3, (length-dispStartTime));

	track += "\"keyframes\": [";
	var createNewDisp = true;
	var disp, nextDispTime;

	while (createNewDisp) {
		disp = createDisp(dispNum, dispStartTime, dispLength);
		track += disp;

		nextDispTime = dispStartTime + dispLength + 1;
		dispStartTime = getRandomInt (nextDispTime, (length - 3 + 1)); // length -3+1 to allow for an invalid start time
		dispLength = getRandomInt (3, (length-dispStartTime));
		dispNum ++;

		if (nextDispTime>=length || dispStartTime > (length-3)){
			createNewDisp = false;
		}else {
			track += ", ";
		}
	}

	track += "]";

	track += "}";
	return track;
}


function createDisp (dispNum, dispStartTime, dispLength) {
	var disp = "";
	var dispEndTime = dispStartTime + dispLength;
	var prop=null;
	var curOpacity = 0;
	var keyframeTime = dispStartTime;
	var newKeyframe = true;
	var nextKeyframeTime;
	var tempNextTime;

	var keyframe = createKeyframe (dispNum, keyframeTime, curOpacity, prop) + ", "; //fade in node
	disp += keyframe;

	nextKeyframeTime = keyframeTime + 1;
	keyframeTime = getRandomInt(nextKeyframeTime, (dispEndTime-2));
	curOpacity = 1;

	while (newKeyframe) {
		keyframe = createKeyframe (dispNum, keyframeTime, curOpacity, prop) + ", "; 
		disp += keyframe;

		nextKeyframeTime = keyframeTime + 1;
		keyframeTime = getRandomInt(nextKeyframeTime, (dispEndTime-1));

		tempNextTime = getRandomInt(keyframeTime + 1, dispEndTime); //to see if the next time is the end of the display
		if (tempNextTime === dispEndTime){
			newKeyframe = false;
			keyframe = createKeyframe (dispNum, keyframeTime, curOpacity, prop) + ", "; 
			disp += keyframe;
		}else {
			prop = {"sizeX":getRandomInt (30, 100), "sizeY":getRandomInt (30, 100),"posX":getRandomInt (30, 100),"posY":getRandomInt (30, 100)};
		}
	}

	curOpacity = 0;
	var keyframe = createKeyframe (dispNum, dispEndTime, curOpacity, prop); //fade in node
	disp += keyframe;

	return disp;
}



function createKeyframe(dispNum, time, opacity, prop) {
	var keyframe = "{";
	var randomX, randomY;

	keyframe += "\"dispNum\":"+dispNum+", ";
	keyframe +="\"time\":"+time+", ";
	keyframe +="\"opacity\":"+opacity+", ";

	sizeX = !prop ? 100 : prop.sizeX; 
	sizeY = !prop ? 100 : prop.sizeY; 

	keyframe +="\"size\": { \"x\":"+sizeX+", \"y\":"+sizeY+"}, ";

	posX = !prop ? 100 : prop.posX; 
	posY = !prop ? 100 : prop.posY; 

	keyframe +="\"pos\": { \"x\":"+posX+", \"y\":"+posY+"}, ";
	keyframe += "\"data\": {}";

	keyframe += "}";

	return keyframe;
}


//options: how many tracks for each type of asset => {imageNum:_, audioNum:_, videoNum:_, deepZoomNum:_}
//length: length of tour in seconds
function createTour (options, length, tourName, tourAssets) {
	myTour = "{\"tourTitle\": \""+tourName+"\", \"tracks\": [";
	var imageNum = options.imageNum;
	var i, track;

	track = createImageTrack("Track0", length, tourAssets[0]);
	for (i=1; i<imageNum; i++) {
		myTour += track + ", ";
		track = createImageTrack("Track"+i, length, tourAssets[i]);
	}
	if (imageNum > 1) {
		myTour += track;
	}

	myTour += "]}";
	return myTour;
}

var options={};
options.imageNum = 80;
var tourName = "TempTour";
var tourAssets = ["cat.jpg", "cow.jpg", "chicken.jpg", "bird.jpg", "dog.jpg"];
//fade in/out times are by seconds just for now
var displayDiv = document.getElementById("displayDiv");
var tourJson = createTour(options, 30, tourName, tourAssets);
displayDiv.innerText = tourJson;

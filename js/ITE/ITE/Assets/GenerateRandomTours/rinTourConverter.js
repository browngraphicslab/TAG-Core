function rinTourConvertor(rintour){
	var rawFile = new XMLHttpRequest();
    rawFile.open("GET", rintour, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                var json = JSON.parse(allText);
                console.log(json);
                var newjson = {
                    "tourTitle" : String(json.data.narrativeData.title)
                };
                newjson.tracks = [];
                for (var key in json.experiences){
                	if(json.experiences.hasOwnProperty(key)){
                		var newobj = {};
                		var subprop = key + "-0";
                		for (var i in json.experiences[key].experienceStreams){
                			if (i === subprop){
	                			newobj.name = key;
	                			newobj.providerId = json.experiences[key].providerId;
	                			newobj.keyframes = json.experiences[key].experienceStreams[i].keyframes;
                			if (typeof json.experiences[key].resourceReferences[0] !== "undefined" ){
                				var resourceid = json.experiences[key].resourceReferences[0].resourceId;
                            }
                        }
                        for (var j in json.resources){
                            if (j===resourceid){
                            	newobj.assetUrl = json.resources[j].uriReference;
                            }
                        }      

                			
                		}

                		newjson.tracks.push(newobj);
                	}
                };

                console.log(newjson);
                document.write(newjson);
                

            }
        }
    }
    rawFile.send();
}


var displayDiv = document.getElementById("display");
rinTourConvertor("http://localhost/tagcore/js/ITE/ITE/Assets/GenerateRandomTours/TourData1406041958407.txt");
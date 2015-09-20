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
		                			if (json.experiences[key].providerId==="AES"){
		                				newobj.providerId = "audio";	
		                			}
		                			else if (json.experiences[key].providerId==="ImageES"){
		                				newobj.providerId = "image";	
		                			}
		                			else if (json.experiences[key].providerId==="ZMES"){
		                				newobj.providerId = "deepZoom";	
		                			}
		                			else if (json.experiences[key].providerId==="VideoES"){
		                				newobj.providerId = "video";	
		                			}
		                			else{
		                				newobj.providerId = json.experiences[key].providerId;
		                			}
		                			//newobj.keyframes = json.experiences[key].experienceStreams[i].keyframes;
	                                newobj.keyframes = [];
	                                for (var k in json.experiences[key].experienceStreams[i].keyframes){
	                                	var newkeyframe = {};
	                                	var newkeyframe1 = {};
	                                	// if (newobj.providerId===deepzoom){
		                                // 	newkeyframe.time = k.offset;
		                                // 	newkeyframe.pos = k.state.viewport.region.center;	
	                                	// }
	                                	if (k===0){
	                                		newkeyframe.time = 0;
	                                		newkeyframe.opacity = 0;
	                                		if (typeof json.experiences[key].experienceStreams[i].keyframes[0].state.viewport !== "undefined"){
	                                			if(newobj.providerId="deepZoom"){
	                            	    			newkeyframe.scale = 1; //for now
		                                			newkeyframe.pos = json.experiences[key].experienceStreams[i].keyframes[0].state.viewport.region.center;
		                                		}
		                                		else if(newobj.providerId="audio"){
		                                			if (typeof newkeyframe.volume = json.experiences[key].experienceStreams[i].keyframes[0].state.sound !== "undefined"){
	                            	    				newkeyframe.volume = json.experiences[key].experienceStreams[i].keyframes[0].state.sound.volume;
	                            	    			}
	                            	    			else{
	                            	    				newkeyframe.volume = 0.5;
	                            	    			}	
		                                			newkeyframe.audioOffset = 
		                                		    
		                                		}
	                                    	}
	                                    	newobj.keyframes.push(newkeyframe);
	                                    	newkeyframe1.time = 1;


	                                	}
	                                	    
	                                	newkeyframe.time = json.experiences[key].experienceStreams[i].keyframes[k].offset;
	                                	if (typeof json.experiences[key].experienceStreams[i].keyframes[k].state.viewport !== "undefined"){
	                            	    	newkeyframe.size = json.experiences[key].experienceStreams[i].keyframes[k].state.viewport.region.span;
		                                	newkeyframe.pos = json.experiences[key].experienceStreams[i].keyframes[k].state.viewport.region.center;
	                                    }
		                                
		                                newobj.keyframes.push(newkeyframe);
	                                }
	                                for (var l in newobj.keyframes){
	                                	if (l===1 || l===2){

	                                	}
	                                }
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
	                document.write(JSON.stringify(newjson));
	                

	            }
	        }
	    }
	    rawFile.send();
	}


	var displayDiv = document.getElementById("display");
	rinTourConvertor("http://localhost/tagcore/js/ITE/ITE/Assets/GenerateRandomTours/TourData1406041958407.txt");
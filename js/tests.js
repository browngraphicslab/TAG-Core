TAG.Util.makeNamespace("TAG.TESTS");

/**
 * TAG testing framework
 *
 * The TEST SCRIPTS section below has a few test routines. These
 * routines are made public at the bottom of this file. They call
 * runTests on a collection of TEST SCRIPT ACTIONs, which are defined
 * in the second section. These are 'atomic' actions that can
 * be combined to make more complex routines. There are a few
 * TEST SUPPORT FUNCTIONs defined in the last section below.
 */

TAG.TESTS = (function () {

	var emptyTest = {
		tests: [],
		intervals: []
	};

	var highlightColors = [
		'rgba(255,100,0,0.9)',
		'rgba(255,0,100,0.9)',
		'rgba(100,255,0,0.9)',
		'rgba(100,0,255,0.9)',
		'rgba(0,255,100,0.9)',
		'rgba(0,100,255,0.9)'
	];

	var testTimeout; // the currently-running timeout

	/**********************\
	|**** TEST SCRIPTS ****|
	\**********************/

	function testEnterCollections() {
		runTests(combineTestObjs([
			navigate_to_start,
			start_to_collections,
			collections_to_start,
			{tests: 2, intervals: 2}
		]));
	}

	function testSelectCollections() {
		runTests(combineTestObjs([
			navigate_to_collections,
			pick_random_collection,
			{tests: 1, intervals: 10}
		]));
	}

	function testSelectArtworks() {
		runTests(combineTestObjs([
			navigate_to_collections,
			pick_random_collection,
			pick_random_collection,
			pick_random_artwork,
			{tests: 1, intervals: 10}
		]));
	}

	function testDragArtwork() {
		runTests(combineTestObjs([
			navigate_to_garibaldi,
			pan_artwork,
			{tests: 4, intervals: 2}
		]));
	}

	/*****************************\
	|**** TEST SCRIPT ACTIONS ****|
	\*****************************/

	/* navigate from the start screen to the collections view */
	function start_to_collections() {
		return {
			tests: [
				function() {
					clickEvent($('#overlay'));
				}
			],
			intervals: [
				2000
			]
		};
	}

	/* navigate from the collections view to the start screen */
	function collections_to_start() {
		return {
			tests: [
				function() {
					clickEvent($('#catalogBackButton'));
				}
			],
			intervals: [
				2000
			]
		};
	}

	/* pick a random collection from the collections list */
	function pick_random_collection() {
		return {
			tests: [
				function() {
					var collectionClickables = $('.collectionClickable'),
						collection = randElt(collectionClickables);
					if(collection) {
						clickEvent($(collection));
					}
				}
			],
			intervals: [
				2000
			]
		};
	}

	/* pick a random artwork tile (make sure it's not already selected) */
	function pick_random_artwork() {
		return {
			tests: [
				function() {
					var artTiles = $('.tile'),
						tile = randElt(artTiles),
						alreadySelected;
					if(!tile) {
						console.log("RETURNING: no artwork tiles yet");
						return;
					}
					alreadySelected = $('.already_selected_in_test');
					while(artTiles.length > 1 && $(tile).hasClass('already_selected_in_test')) {
						tile = randElt(artTiles);
					}
					alreadySelected.removeClass('already_selected_in_test');
					$(tile).addClass('already_selected_in_test');
					clickEvent($(tile));
				}
			],
			intervals: [
				1000
			]
		}
	}

	/* pan the given artwork */
	function pan_artwork() {
		var tagWidth = $('#tagRoot').width(),
			tagHeight = $('#tagRoot').height();
		return {
			tests: [
				function() {
					dragEvent($('.artworkCanvasTesting')[0], {
						startX: tagWidth/2,
						endX: 2*tagWidth/3,
						startY: tagHeight/2,
						endY: 4*tagHeight/5
					});
				},
				function() {
					dragEvent($('.artworkCanvasTesting')[0], {
						startX: tagWidth/2,
						endX: tagWidth - 10,
						startY: tagHeight/2,
						endY: tagHeight - 10
					});
				},
				function() {
					dragEvent($('.artworkCanvasTesting')[0], {
						startX: tagWidth/2,
						endX: 10,
						startY: tagHeight/2,
						endY: tagHeight/2
					});
				},
				function() {
					dragEvent($('.artworkCanvasTesting')[0], {
						startX: tagWidth/2,
						endX: tagWidth/2,
						startY: tagHeight/2,
						endY: 10
					});
				}
			],
			intervals: [
				1500,
				1500,
				1500,
				1500
			]
		}
	}

	/* navigate to the garibaldi panorama */
	function navigate_to_garibaldi() {
		return {
			tests: [
				function() {
					var garibaldiId = "48880741-040a-4657-a3ef-0a2f9bbe27cd";

					TAG.Worktop.Database.getDoq(garibaldiId, function(doq) {
						var prevInfo = {prevPage: "catalog", prevScroll: 0},
							options = {catalogState: {}, doq: doq, split: 'L' },
			            	deepZoom = new TAG.Layout.ArtworkViewer(prevInfo, options, null);
		            	TAG.Util.UI.slidePageLeft(deepZoom.getRoot());
					}, genErrorHandler('navigate_to_garibaldi'), genErrorHandler('navigate_to_garibaldi'));
				}
			],
			intervals: [
				1000
			]
		}
	}

	/* navigate to start page */
	function navigate_to_start() {
		return {
			tests: [
				function() {
					TAG.Layout.StartPage(null, function (root) {
			            TAG.Util.UI.slidePageRight(root);
			        }, true);
				}
			],
			intervals: [
				1000
			]
		}
	}

	/* navigate to collections view */
	function navigate_to_collections() {
		return {
			tests: [
				function() {
					var newCatalog = new TAG.Layout.CollectionsPage();
    			    $('#overlay').on('click', function(){});
        			TAG.Util.UI.slidePageLeft(newCatalog.getRoot());
        		}
        	],
        	intervals: [
        		1000
        	]
        }
	}

	/***********************************\
	|**** TESTING SUPPORT FUNCTIONS ****|
	\***********************************/

	/**
	 * Run a series of tests
	 * @param testObj.tests       an array of tests to run
	 * @param testObj.intervals   array of time intervals (ms) between these tests
	 * @return                    -1 if an error was thrown during testing
	 */
	function runTests(testObj) {
		var tests = testObj.tests,
			intervals = testObj.intervals;
		// TODO check that tests and intervals are arrays, that they have equal lengths, etc...
		try {
			showStartOverlay();
			runTest(0, tests, intervals);
		} catch(e) {
			console.log('error in runTests: '+e.message);
			return -1;
		}
	}

	/**
	 * Called by runTests, calls a single test, then calls runTest with incremented index
	 */
	function runTest(index, tests, intervals, testNum) {
		testNum = testNum || 1;
		var type;
		if(index < tests.length) {
			type = typeof tests[index];
			testTimeout = setTimeout(function() {
				if(type === "function") {
					console.log("RUNNING TEST #"+testNum);
					tests[index]();
					runTest(index+1, tests, intervals, testNum+1);
				} else if(type === "number" && intervals[index] > 0) { // repeat previous tests[index] commands intervals[index] times
					intervals[index]--;
					runTest(Math.max(0, index - tests[index]), tests, intervals, testNum+1);
				}
			}, type === "function" ? intervals[index] : 0);
		}
	}

	/**
	 * Helper function to concatenate different testing objects
	 * @param testObjs       array of test objects (or functions that will generate test objects) to combine
	 * @return               combined test objects
	 */
	function combineTestObjs(testObjs) {
		// TODO validate input
		if(testObjs.length === 0) {
			return {
				tests: [],
				intervals: []
			};
		}
		var combinedTests = [],
			combinedIntervals = [],
			i,
			currObj;
		for(i=0;i<testObjs.length;i++) {
			currObj = typeof testObjs[i] === 'function' ? testObjs[i]() : testObjs[i];
			combinedTests = combinedTests.concat(currObj.tests);
			combinedIntervals = combinedIntervals.concat(currObj.intervals);
		}
		return {
			tests: combinedTests,
			intervals: combinedIntervals
		};
	}

	/**
	 * Create click event on the input element
	 */
	function clickEvent(target) {
		var $target = $(target);
		highlightTarget($target);
		$target.trigger('click');
	}

	/**
	 * Simulate a pinch zoom event
	 */
	function pinchZoomEvent(target, eventData) {
		// TODO
	}

	/**
	 * Create mousemove event -- be careful to leave enough interval time to call this
	 * @param target       target element for event
	 * @param eventData    object with the following properties:
	 *            startX     starting x coordinate relative to #tagRoot
	 *            startY     ...
	 *            endX       ...
	 *            endY
	 */
	function dragEvent(target, eventData) {
		var $target = $(target),
			simulatedEvent,
			clientX = eventData.startX + $('#tagRoot').offset().left,
			clientY = eventData.startY + $('#tagRoot').offset().top,
			screenX = clientX,
			screenY = clientY,
			endX = clientX + (eventData.endX - eventData.startX),
			endY = clientY + (eventData.endY - eventData.startY),
			deltaX = endX - clientX,
			deltaY = endY - clientY,
			distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY),
			distancePerMove = 20,
			numMoves = distance/distancePerMove,
			i;

		// mousedown at (startX, startY)
		simulatedEvent = document.createEvent('MouseEvent');
        simulatedEvent.initMouseEvent('mousedown', true, true, window, 1,
                   screenX, screenY,
                   clientX, clientY, false,
                   false, false, false, 0, null);
        highlightTarget($target, eventData.startX, eventData.startY, true);
        $target[0].dispatchEvent(simulatedEvent);

        // call mouseMoves to create mousemove events
        mouseMoves(0, numMoves, {
		       	target: $target,
		       	startClientX: clientX,
		       	startClientY: clientY,
		       	startScreenX: screenX,
		       	startScreenY: screenY,
		       	endClientX: endX,
		       	endClientY: endY,
		       	endScreenX: endX,
		       	endScreenY: endY
		    }, function() {
	       	    // mouseup at (endX, endY)
			 	simulatedEvent = document.createEvent('MouseEvent');
		        simulatedEvent.initMouseEvent('mouseup', true, true, window, 1,
		                    endX, endY,
		                    endX, endY, false,
		                    false, false, false, 0, null);
		        $target[0].dispatchEvent(simulatedEvent);
	        }
	    );
	}

	/**
	 * Recursive call to execute mousemove events
	 * @param ctr        the number of move events we've called
	 * @param numMoves   the number of move events we will call
	 * @param data       event data with properties:
	 *           startClientX        starting x position in context of browser window
	 *           startClientY        ...
	 *           endClientX          ...
	 *           endClientY          ...
	 *           target              target element
	 * @param callback   function to be called when all moves have executed
	 */
	function mouseMoves(ctr, numMoves, data, callback) {
		var simulatedEvent,
			f = (ctr + 1) / numMoves,
			startX = data.startClientX,
			startY = data.startClientY,
			endX = data.endClientX,
			endY = data.endClientY,
			$target = data.target,
			lerpX = lerp(startX, endX, f),
			lerpY = lerp(startY, endY, f);
		if(ctr < numMoves) {
			simulatedEvent = document.createEvent('MouseEvent');
	        simulatedEvent.initMouseEvent('mousemove', true, true, window, 1,
	                    lerpX, lerpY,
	                    lerpX, lerpY, false,
	                    false, false, false, 0, null);
	        highlightTarget($target, lerpX - $('#tagRoot').offset().left, lerpY - $('#tagRoot').offset().top, true);
	       	$($target)[0].dispatchEvent(simulatedEvent);
	       	setTimeout(function() {
	       		mouseMoves(ctr+1, numMoves, data, callback);
	       	}, 0);
		} else {
			callback && callback();
		}
	}

	/**
	 * Linearly interpolate between start and stop by t in [0,1]
	 */
	function lerp(start, stop, t) {
		return (1-t)*start + t*stop;
	}


	/**
	 * Highlight the target of a testing event (visualize events)
	 * @param target          the element to highlight
	 * @param left            (optional) the left offset of the event within the target
	 * @param top             (optional) ....
	 * @param animateRadius   (optional) if true, highlights get smaller as they disappear
	 * @param highlightWidth  (optional) width of the highlight circle
	 */
	function highlightTarget(target, left, top, animateRadius, highlightWidth) {
		var $target = $(target),
			tagname = $target.prop('tagName').toLowerCase(),
			highlightOverlay = $(document.createElement('div')),
			highlightWidth = highlightWidth || 30,
			isAbs = ($target.css('position') === 'absolute' || $target.css('position') === 'relative'),
			oldBackgroundColor,
			marginLeftOffset = left ? $target.width() - left : $target.width()/2,
			marginTopOffset = top ? $target.height() - top : $target.height()/2,
			leftOffset = left ? left : $target.width()/2,
			topOffset = top ? top : $target.height()/2;

		if(tagname === 'img' || tagname === 'video') { // can't append a highlight inside an img or video
			oldBackgroundColor = $target.css('background-color');
			$target.css('background-color', 'rgba(255,100,0,0.8)');
			setTimeout(function() {
				$target.css('background-color', oldBackgroundColor);
			}, 1000);
		} else {
			highlightOverlay.css({
				'border-radius': '100px',
				'background-color': randElt(highlightColors),
				'position': 'absolute',
				'margin-top': isAbs ? '' : '-' + (marginTopOffset + highlightWidth/2) + 'px',
				'margin-left': isAbs ? '' : (marginLeftOffset - highlightWidth/2) + 'px',
				'top': isAbs ? (topOffset - highlightWidth/2) + 'px' : '',
				'left': isAbs ? (leftOffset - highlightWidth/2) + 'px' : '',
				'opacity': 0,
				'width': highlightWidth+'px',
				'height': highlightWidth+'px'
			});
			$target.append(highlightOverlay);
			highlightOverlay.animate({
				opacity: 1,
			}, 20, function() {
				var animOpts = {
					opacity: 0
				};
				if(animateRadius) {
					animOpts.width = highlightWidth/2;
					animOpts.height = highlightWidth/2;
					if(isAbs) {
						animOpts.left = (leftOffset - highlightWidth/2) + highlightWidth/4;
						animOpts.top = (topOffset - highlightWidth/2) + highlightWidth/4;
					} else {
						animOpts.marginLeft = (marginLeftOffset - highlightWidth/2 + highlightWidth/4);
						animOpts.marginTop = -(marginTopOffset + highlightWidth/2 - highlightWidth/4);
					}
				}
				highlightOverlay.animate(animOpts, 1200, function() {
					highlightOverlay.remove();
				});
			});
		}
	}

	/**
	 * @param arr     array for which we want a random index
	 * @return        random index into array, -1 if arr is empty
	 */
	function randIndex(arr) {
		if(arr.length === 0) {
			return -1;
		} else {
			return Math.floor(Math.random() * arr.length);
		}
	}

	/**
	 * returns random element from input array
	 * @param arr     input array
	 * @return        random element, null if arr=[]
	 */
	function randElt(arr) {
		var ind;
		console.log("arr.length = "+arr.length);
		if(arr.length === 0) {
			return null;
		} else {
			ind = randIndex(arr);
			console.log('index = '+ind);
			return arr[ind];
		}
	}

	/**
	 * Returns a basic error callback function (long-term, should define
	 * case-specific error funcs that actually do some error handling).
	 *
	 * @param calling      string: calling function's name
	 */
	function genErrorHandler(calling) {
		var str = calling ? ('error in '+calling) : 'error';
		return function(err) {
			console.log(str + ': ' + e.message);
		};
	}

	/**
	 * Show an overlay explaining that the first step in the test is to
	 * navigate to the correct starting page.
	 */
	function showStartOverlay() {
		var rootContainer = $('#tagContainer'), // this is demo.html-specific!
			overlay = $(document.createElement('div')),
			message = $(document.createElement('div'));

		overlay.css({
			'background-color': 'rgba(0,0,0,0.9)',
			height: '100%',
			opacity: 0,
			position: 'absolute',
			width: '100%',
			'z-index': 100000000000000000
		});

		message.css({
			color: '#ffdd00',
			position: 'absolute',
			'font-family': 'sourceSans',
			'font-size': '60px',
			'text-align': 'center',
			top: '40%',
			width: '100%'
		});

		message.text('starting test...');

		overlay.append(message);
		rootContainer.append(overlay);

		overlay.animate({
			opacity: 1
		}, 100, function() {
			setTimeout(function(){
				overlay.animate({
					opacity: 0
				}, 100, function() {
					overlay.remove();
				});
			}, 1000);
		});
	}

	/**
	 * Cancels the currently-running test
	 */
	function cancelTest() {
		clearTimeout(testTimeout);
	}

	// publicize test functions
	return {
		testEnterCollections: testEnterCollections,
		testSelectCollections: testSelectCollections,
		testSelectArtworks: testSelectArtworks,
		testDragArtwork: testDragArtwork,
		cancelTest: cancelTest,
		runTests: runTests
	};
})();
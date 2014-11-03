/**
 * This file takes care of compiling jade and stylus files and
 * building TAG.js by concatenating a collection of source js
 * files. The source files can be found in the JSSRC array below.
 * 
 * To use Grunt, run
 *
 *    $ grunt
 *
 * from the command line. You can also run
 *
 *    $ grunt watch
 *
 * which will watch for saved changes in any files in the WATCH
 * array below. WATCH contains all of the js files in JSSRC (when
 * any of our source files change, we want to recompile TAG.js)
 * as well as the styl and jade files (when these change, we want
 * to recompile respective css and html files).
 *
 * We use Grunt for a couple reasons:
 *   - it's a pain to always compile jade and stylus by hand
 *   - it's nice to be able to include a single js file (TAG.js)
 *     rather than a whole collection of them, and doing so lets us
 *     put all TAG code -- including third-party libraries we use --
 *     inside a contained scope, so our variables don't clobber those
 *     in the host site's code
 *
 * To look further into the second point above, you can take a look
 * at the "concat" task below. It concatenates a bunch of js files
 * together inside a "banner" and a "footer." The banner, which will
 * appear at the top of TAG.js, defines a function (TAG) that wraps all
 * of our code and declares some global variables. The footer appends a
 * closing curly brace to the very end of the file to finish the TAG
 * function.
 */

var JSSRC = [
		'js/jQueryUI/js/jquery-1.7.1.js',                      // TAGCORE
		'js/jQueryUI/js/jquery-ui-1.8.16.custom.min.js',       // TAGCORE
		'js/jQueryUI/js/jquery.available.min.js',              // TAGCORE
		'js/jQueryUI/js/jquery.fittext.js',                    // TAGCORE
		'js/jQueryUI/js/jquery.autoSize.js',                   // TAGCORE
		'js/jQueryUI/js/jquery.numeric.js',                    // TAGCORE

		'js/seadragon/src/Seadragon.Core.js',                  // TAGCORE
		'js/seadragon/src/Seadragon.Config.js',                // TAGCORE
		'js/seadragon/src/Seadragon.Strings.js',               // TAGCORE
		'js/seadragon/src/Seadragon.Debug.js',                 // TAGCORE
		'js/seadragon/src/Seadragon.Profiler.js',              // TAGCORE
		'js/seadragon/src/Seadragon.Point.js',                 // TAGCORE
		'js/seadragon/src/Seadragon.Rect.js',                  // TAGCORE
		'js/seadragon/src/Seadragon.Spring.js',                // TAGCORE
		'js/seadragon/src/Seadragon.Utils.js',                 // TAGCORE
		'js/seadragon/src/Seadragon.MouseTracker.js',          // TAGCORE
		'js/seadragon/src/Seadragon.EventManager.js',          // TAGCORE
		'js/seadragon/src/Seadragon.ImageLoader.js',           // TAGCORE
		'js/seadragon/src/Seadragon.Buttons.js',               // TAGCORE
		'js/seadragon/src/Seadragon.TileSource.js',            // TAGCORE
		'js/seadragon/src/Seadragon.DisplayRect.js',           // TAGCORE
		'js/seadragon/src/Seadragon.DeepZoom.js',              // TAGCORE
		'js/seadragon/src/Seadragon.Viewport.js',              // TAGCORE
		'js/seadragon/src/Seadragon.Drawer.js',                // TAGCORE
		'js/seadragon/src/Seadragon.Viewer.js',      

		
		'js/utils/CryptoJS/rollups/sha1.js',                   // TAGCORE
		'js/utils/CryptoJS/rollups/sha224.js',                 // TAGCORE
		'js/utils/CryptoJS/rollups/sha256.js',                 // TAGCORE
		'js/utils/CryptoJS/rollups/sha384.js',                 // TAGCORE
		'js/utils/CryptoJS/rollups/sha512.js',                 //TAGCORE
		'js/utils/CryptoJS/rollups/tripledes.js',              //TAGCORE
		'js/utils/CryptoJS/rollups/aes.js',                    // TAGCORE
		'js/utils/jquery.getScrollbarWidth.js',                // TAGCORE
		'js/utils/jquery.throttle-debounce.js',                // TAGCORE
		'js/utils/jquery-css-transform.js',                    // TAGCORE
		'js/utils/jquery-animate-css-transform.js',            // TAGCORE
		'js/utils/jquery.xml2json.js',                         // TAGCORE
		'js/utils/json2xml.js',                                // TAGCORE
		'js/utils/jquery.hammer.js',                           // TAGCORE
		'js/utils/hammer.js',                                  // TAGCORE
		'js/utils/avltree.js',                                 // TAGCORE
		'js/utils/avlnode.js',                                 // TAGCORE
		'js/utils/binaryheap.js',                              // TAGCORE
		'js/utils/dataholder.js',                              // TAGCORE
		'js/utils/doubleLinkedList.js',                        // TAGCORE
		'js/utils/hashtable.js',                               // TAGCORE
		'js/d3/d3.v2.js',                                      // TAGCORE
		'js/TAG/util/TAG.Util.js',                             // TAGCORE
		'js/html2canvas/html2canvas.js',                       // TAGCORE
		'js/utils/jquery.livequery.js',                        // TAGCORE
		'js/utils/Autolinker.js-master/dist/Autolinker.js',    // TAGCORE

		'js/TAG/tourauthoring/TAG.TourAuthoring.Constants.js', // TAGCORE
		'js/TAG/util/TAG.Util.Constants.js',                   // TAGCORE
		'js/TAG/util/TAG.Util.Splitscreen.js',                 // TAGCORE
		'js/TAG/util/TAG.Util.IdleTimer.js',                   // TAGCORE
		'js/TAG/worktop/Worktop.Database.js',                  // TAGCORE
		'js/TAG/worktop/Worktop.Doq.js',                       // TAGCORE
		'js/TAG/worktop/TAG.Worktop.Database.js',              // TAGCORE
		'js/TAG/artmode/TAG.AnnotatedImage.js',      
		'js/TAG/auth/TAG.Auth.js',                             // TAGCORE
		'js/TAG/layout/TAG.Layout.StartPage.js',               // TAGCORE
		'js/TAG/layout/TAG.Layout.ArtworkViewer.js',           // TAGCORE
		'js/TAG/layout/TAG.Layout.CollectionsPage.js',         // TAGCORE
		'js/TAG/layout/TAG.Layout.InternetFailurePage.js',     // TAGCORE
		'js/TAG/layout/TAG.Layout.MetroSplitscreenMessage.js', // TAGCORE
		'js/TAG/layout/TAG.Layout.TourPlayer.js',              // TAGCORE
		'js/TAG/layout/TAG.Layout.VideoPlayer.js',             // TAGCORE
		'js/TAG/layout/TAG.Layout.ArtworkEditor.js',
		'js/TAG/layout/TAG.Layout.TourAuthoringNew.js',
        
		'js/TAG/tourauthoring/TAG.TourAuthoring.TimeManager.js',        // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.UndoManager.js',        // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.ArtworkTrack.js',       // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.AudioTrack.js',         // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.Viewer.js',             // TAGCORE
		'js/TAG/tourauthoring/TAG.TourAuthoring.ArtworkTrack.js',       // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.Command.js',            // TAGCORE
		'js/TAG/tourauthoring/TAG.TourAuthoring.ComponentControls.js',  // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.Display.js',            // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.EditorMenu.js',         // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.ImageTrack.js',         // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.InkAuthoring.js',       // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.InkTrack.js',           // TAGCORE
		'js/TAG/tourauthoring/TAG.TourAuthoring.Keyframe.js',           // TAGCORE
		'js/TAG/tourauthoring/TAG.TourAuthoring.PlaybackControl.js',    // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.Tests.js',              // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.Timeline.js',           // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.TopMenu.js',            // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.TourOptions.js',        // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.Track.js',              // TAGCORE 
		'js/TAG/tourauthoring/TAG.TourAuthoring.VideoTrack.js',         // TAGCORE 
        
		'js/TAG/authoring/TAG.Authoring.SettingsView.js',  // TAGCORE
		'js/TAG/authoring/TAG.Authoring.FileUploader.js',  // TAGCORE
		'js/TAG/authoring/jscolor/jscolor.js',             // TAGCORE

		'js/utils/popcorn.min.js',                         // TAGCORE
		'js/utils/popcorn.capture.js',                     // TAGCORE

		'telemetry/telemetry.js',                          // TAGCORE
        'telemetry/telemetryEvents.js',                    // TAGCORE
        'telemetry/telemetryTimer.js',                     // TAGCORE
		
		'js/tests.js',                                     // TAGCORE
		
		'js/core.js'                                       // TAGCORE
	],
	WATCH = JSSRC.slice(); // WATCH will be a superset of JSSRC

// add additional files to WATCH
WATCH.push(
	'html/*.jade',
	'css/*.styl'
);

module.exports = function(grunt) {
	grunt.initConfig({
	    concat: {
	        options: { //localStorage.tagTelemetry ? localStorage.tagTelemetry : 
	            separator: '\n;\n',
	            banner: 'var TAG_GLOBAL = function(tagInput) { \
					        \n    var tagPath              = tagInput.path || "", \
					        \n        containerId          = tagInput.containerId || "tagContainer", \
					        \n        ip                   = tagInput.serverIp || "browntagserver.com", \
					        \n        allowServerChange    = tagInput.allowServerChange, \
					        \n 		  allowAuthoringMode   = tagInput.allowAuthoringMode, \
					        \n        idleDuration         = tagInput.idleDuration, \
					        \n        currentPage          = {}, // name and obj properties \
					        \n        urlToLoad            = tagInput.urlToLoad, \
					        \n        urlToParse           = tagInput.urlToParse, \
					        \n        pageToLoad           = {}, // a specific page to load \
					        \n        TELEMETRY_SESSION_ID = null, \
					        \n        TELEMETRY_SWITCH     = "on", \
                            \n        SPENT_TIMER          = null, \
                            \n        SETTINGSVIEW_TIMER    = null, \
                            \n        IS_WINDOWS           = (typeof Windows !== "undefined"), \
                            \n        IS_WEBAPP            = !IS_WINDOWS, // perhaps more intuitive than writing !IS_WINDOWS \
					        \n        idleTimer, \
                            \n        Worktop = {}, \
			                \n        TAG                  = {}; \n\n',
				footer: '};'
			},
			dist: {
				src: JSSRC,
				dest: 'js/TAG.js'
			}
		},
		stylus: {
			compile: {
				options: {
					compress: false // in ship builds, set this to "true"
				},
				files: {
					'css/TAG.css': [
						'css/common.styl',               // TAGCORE
						'css/StartPage.styl',            // TAGCORE
						'css/InternetFailurePage.styl',  // TAGCORE
						'css/Artmode.styl',              // TAGCORE
						'css/NewCatalog.styl',           // TAGCORE
						'css/VideoPlayer.styl',          // TAGCORE
						'css/TourPlayer.styl',           // TAGCORE
						'css/General.styl',              // TAGCORE
						'css/SettingsView.styl',         // TAGCORE
						'css/Util.styl',                 // TAGCORE
						'css/SplashScreenOverlay.styl'   // TAGCORE
						//'css/ComponentControls.styl'	 // TAGCORE
					]
				}
			}
		},
		jade: {
			compile: {
				options: {
					pretty: true // in ship builds, set this to "false"
				},
				files: {
					'html/StartPage.html':           'html/StartPage.jade',           // TAGCORE
					'html/InternetFailurePage.html': 'html/InternetFailurePage.jade', // TAGCORE
					'html/Artmode.html':             'html/Artmode.jade',             // TAGCORE
					'html/NewCatalog.html':          'html/NewCatalog.jade',          // TAGCORE
					'html/VideoPlayer.html':         'html/VideoPlayer.jade',         // TAGCORE
					'html/SettingsView.html':        'html/SettingsView.jade',        // TAGCORE
					'html/TourPlayer.html':          'html/TourPlayer.jade',          // TAGCORE
					'html/ComponentControls.html':	 'html/ComponentControls.jade',	  // TAGCORE
					'html/SplashScreenOverlay.html': 'html/SplashScreenOverlay.jade'  // TAGCORE
				}
			}
		},
		watch: {
			files: WATCH,
			tasks: ['stylus', 'jade', 'concat']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-jade');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['jade', 'stylus', 'concat']); // normal calls to grunt will not run the "uglify" task
}

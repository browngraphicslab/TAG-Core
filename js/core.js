﻿// TAG (Touch Art Gallery) does not collect or publish any personal information.

/**
 * This file is responsible for performing initial setup. Please see the comments for load
 * and init below.
 */
(function () { // TODO merging: make sure everything necessary from the win8 app is here
    "use strict";

    if (IS_WINDOWS) {
        $(document).on('ready', load);
    } else {
        load();
    }

    /**
     * The first real TAG function called. Sets up the embedding within iframe and
     * calls init, which takes care of loading scripts and displaying the first page.
     * @method load
     */
    function load() {
        var container,              // container to hold embedding
            positioning,            // try to be friendly to the positioning the host set (either abs or rel);
                                    //    if we're embedding in iframe, doesn't matter
            tagRootContainer,       // the following two use table positioning to center the embedding
            tagRootInnerContainer,  //    vertically and horizontally
            tagRoot,                // the div containing TAG -- considered the "root" of the TAG-related DOM
            w,                      // width of embedding
            h,                      // height of embedding
            l;                      // left of tagRoot
        
        TELEMETRY_SESSION_ID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });

        if(containerId && $('#'+containerId).length > 0) {
            container = $('#'+containerId);
        } else {
            console.log('no containerId specified, or the containerId does not match an element');
            return; // no TAG for you
        }

        // if we're in the windows app, localStorage.ip should take precedence (starting on the last server
        // running makes more sense than in the web app, where TAG should start to whichever server is specified
        // by the museum/institution)
        localStorage.ip = (IS_WINDOWS ? (localStorage.ip || ip) : (ip || localStorage.ip)) || 'browntagserver.com';

        positioning = container.css('position');
        if(positioning !== 'relative' && positioning !== 'absolute') {
            container.css('position', 'relative');
        }

        tagRootContainer = $(document.createElement('div')).attr('id', 'tagRootContainer');
        container.append(tagRootContainer);

        tagRootInnerContainer = $(document.createElement('div')).attr('id', 'tagRootInnerContainer');
        tagRootContainer.append(tagRootInnerContainer);
        
        tagRoot = $(document.createElement('div')).attr('id', 'tagRoot');
        tagRootInnerContainer.append(tagRoot);
        
        w = container.width();
        h = container.height();
        l = 0;

        if (IS_WEBAPP) {
            if (w / h > 16 / 9) { // constrain width or height depending on the embedding dimensions
                l = (w - 16 / 9 * h) / 2;
                w = 16 / 9 * h;
            } else {
                h = 9 / 16 * w;
            }
        }

        tagRoot.css({
            'font-size':  (w/9.6) + '%', // so font-size percentages for descendents work well
            height:       h + "px",
            left:         l + "px",
            'max-width':  w + "px",
            'max-height': h + "px",
            width:        w + "px"
        });

        // bleveque: I got rid of the demo.html handlers here, since they don't really belong (delete this comment if after 8/15/14)

        init();
    }

    /**
     * Initialize TAG; load some scripts into the <head> element,
     * load StartPage (or TourPlayer if specified in the API call).
     * @method init
     */
    function init() {
        var TAGSCRIPTS = [                                    // scripts to load
                'js/raphael.js',
                'js/tagInk.js',
                'js/RIN/web/lib/rin-core-1.0.js'
            ],
            i,                                                // index
            oHead,                                            // head element
            oScript,                                          // script element
            oCss,                                             // link element
            tagContainer;                                     // div containing TAG

        TAGSCRIPTS.push(
            IS_WINDOWS ? 'js/WIN8_RIN/web/lib/rin-core-1.0.js'   : 'js/RIN/web/lib/rin-core-1.0.js',
            IS_WINDOWS ? 'js/WIN8_RIN/web/lib/knockout-2.1.0.js' : 'js/RIN/web/lib/knockout-2.2.1.js'
        );

        tagPath = tagPath || '';
        if(tagPath.length > 0 && tagPath[tagPath.length - 1] !== '/') {
            tagPath += '/';
        }

        // load scripts
        oHead = document.getElementsByTagName('head').item(0);
        for (i = 0; i < TAGSCRIPTS.length; i++) {
            oScript = document.createElement("script");
            oScript.type = "text/javascript";
            oScript.src = tagPath + TAGSCRIPTS[i];
            oHead.appendChild(oScript);
        }

        // load stylesheet
        oCss = document.createElement("link");
        oCss.rel = "stylesheet";
        oCss.href = tagPath+"css/TAG.css";
        oHead.appendChild(oCss);

        tagContainer = $('#tagRoot');

        $("body").css("-ms-touch-action","none");

        // set up idle timer restarting
        $('body').on('click.idleTimer', function() {
            TAG.Util.IdleTimer.restartTimer();
        });

        // if the user specified the tourData API parameter, load into the corresponding tour
        if(INPUT_TOUR_ID) {
            currentPage.name = TAG.Util.Constants.pages.START_PAGE;
            currentPage.obj  = null;

            TAG.Layout.StartPage(null, function (page) {
                TAG.Worktop.Database.getDoq(INPUT_TOUR_ID, function(tour) {
                    var tourData = JSON.parse(unescape(tour.Metadata.Content)),
                        rinPlayer = TAG.Layout.TourPlayer(tourData, null, {}, null, tour);

                    tagContainer.css('overflow', 'hidden');

                    tagContainer.append(rinPlayer.getRoot());
                    rinPlayer.startPlayback();

                    currentPage.name = TAG.Util.Constants.pages.TOUR_PLAYER;
                    currentPage.obj  = rinPlayer;
                }, function() {
                    // TODO error handling
                }, function() {
                    // TODO cache error handling
                });
            });
        } else { // otherwise, load to start page
            currentPage.name = TAG.Util.Constants.pages.START_PAGE;
            currentPage.obj  = null;

            TAG.Layout.StartPage(null, function (page) {
                tagContainer.append(page);
            });
        }
    }
})();
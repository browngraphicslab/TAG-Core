// TAG (Touch Art Gallery) does not collect or publish any personal information.

/**
 * This file is responsible for performing initial setup. Please see the comments for load
 * and init below.
 */
(function () {
    "use strict";

    load();

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

        if(containerId && $('#'+containerId).length > 0) {
            container = $('#'+containerId);
        } else {
            console.log('no containerId specified, or the containerId does not match an element');
            return; // no TAG for you
        }
        localStorage.ip = ip || localStorage.ip || 'browntagserver.com';

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

        if(w/h > 16/9) { // constrain width or height depending on the embedding dimensions
            l = (w - 16/9*h)/2;
            w = 16/9 * h;
        } else {
            h = 9/16 * w;
        }

        tagRoot.css({
            'font-size':  (w/9.6) + '%', // so font-size percentages for descendents work well
            height:       h + "px",
            left:         l + "px",
            'max-width':  w + "px",
            'max-height': h + "px",
            width:        w + "px"
        });

        /**
         * In demo.html, we have some testing buttons and sliders. The handlers are
         * set up here.
         * @method setUpTestingHandlers
         */
        function setUpTestingHandlers() {
            $('#widthSlider').on('change', function(evt) {
                container.empty();
                var w = $(this).attr('value');
                $('#tagWidth').text(w);
                container.css('width', w + 'px');
            });

            $('#heightSlider').on('change', function(evt) {
                container.empty();
                var h = $(this).attr('value');
                $('#tagHeight').text(h);
                container.css({
                    height: h + "px"
                });
            });

            $('#TAG_tb1').on('click', TAG.TESTS.testEnterCollections);
            $('#TAG_tb2').on('click', TAG.TESTS.testSelectCollections);
            $('#TAG_tb3').on('click', TAG.TESTS.testSelectArtworks);
            $('#TAG_tb4').on('click', TAG.TESTS.testDragArtwork);
            $('#TAG_cancelTest').on('click', TAG.TESTS.cancelTest);

            $('#refreshTAGButton').on('click', function(evt) { // currently doesn't work to refresh TAG if a tour has been played
                container.empty();
                $('#refreshTAGButton').off('click');
                $('#heightSlider').off('change');
                $('#widthSlider').off('change');
                $('[src='+tagPath+'"js/raphael.js"]').remove();
                $('[src='+tagPath+'"js/tagInk.js"]').remove();
                $('[src='+tagPath+'"js/RIN/web/lib/rin-core-1.0.js"]').remove();
                $('[href="css/TAG.css"]').remove();
                $('[src$="rin-experiences-1.0.js"]').remove();
                $('[src$="jquery.pxtouch.min.js"]').remove();
                $('[href$="themeResources/rin.css"]').remove();

                TAG_GLOBAL({
                    path: tagPath,
                    containerId: containerId,
                    serverIp: ip,
                    allowServerChange: true
                });
            });
        }

        setUpTestingHandlers();
        init();
    }

    /**
     * Initialize TAG; load some scripts into the <head> element,
     * load StartPage (or TourPlayer if specified in the API call).
     * @method init
     */
    function init() {
        var TAGSCRIPTS = [                                    // scripts to load
                'js/raphael.js', // TODO merging
                'js/tagInk.js',
                'js/RIN/web/lib/rin-core-1.0.js'
            ],
            i,                                                // index
            oHead,                                            // head element
            oScript,                                          // script element
            oCss,                                             // link element
            tagContainer;                                     // div containing TAG


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
        oCss.href = tagPath+"css/TAG.css"; // TODO merging
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
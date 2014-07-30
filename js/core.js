// TAG (Touch Art Gallery) does not collect or publish any personal information.

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

        if(urlToParse || urlToLoad) {
            pageToLoad = parseQueryParams();
        }

        // if we're in the windows app, localStorage.ip should take precedence (starting on the last server
        // running makes more sense than in the web app, where TAG should start to whichever server is specified
        // by the museum/institution)
        localStorage.ip = (IS_WINDOWS ? (localStorage.ip || ip) : (pageToLoad.tagserver || ip || localStorage.ip)) || 'browntagserver.com';

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
     * Parses page url for a specific TAG page to load
     * @method parseQueryParams
     * @return {Object}              the tag params found
     */
    function parseQueryParams() {
        var url     = urlToParse,                 // url of host site
            param,                                // param
            ret     = {};                         // will return this

        param = url.match(/tagserver=[^\&]*/);
        if(param && param.length > 0) {
            ret.tagserver = param[0].split(/=/)[1];
        }

        param = url.match(/tagpagename=[a-zA-Z]+/);

        if(param && param.length > 0) {
            ret.pagename = param[0].split(/=/)[1];
            switch(ret.pagename) {
                case 'collections':
                    param = url.match(/tagcollectionid=[a-f0-9\-]+/);
                    if(param && param.length > 0) {
                        ret.collectionid = param[0].split(/=/)[1];
                        param = url.match(/tagartworkid=[a-f0-9\-]+/);
                        if(param && param.length > 0) {
                            ret.artworkid = param[0].split(/=/)[1];
                        }
                        return ret;
                    }
                    break;
                case 'artwork':
                case 'video':
                    param = url.match(/tagguid=[a-f0-9\-]+/);
                    if(param && param.length > 0) {
                        ret.guid = param[0].split(/=/)[1];
                        return ret;
                    }
                    break;
                case 'tour':
                    param = url.match(/tagguid=[a-f0-9\-]+/);
                    if(param && param.length > 0) {
                        ret.guid = param[0].split(/=/)[1];
                        ret.onlytour = url.match(/tagonlytour=true/) ? true : false;
                        return ret;
                    }
                    break;
            }
        } else if (urlToLoad) {
            // if we didn't have any luck parsing urlToParse, try urlToLoad
            // this makes urlToLoad the "default" loading page, but still
            // allows users to link to specific pages by specifying url params
            urlToParse = urlToLoad;
            urlToLoad = '';
            return parseQueryParams();
        }
        return ret;
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

        // // if the user specified the tourData API parameter, load into the corresponding tour
        // if(INPUT_TOUR_ID) {
        //     currentPage.name = TAG.Util.Constants.pages.START_PAGE;
        //     currentPage.obj  = null;

        //     TAG.Layout.StartPage(null, function (page) {
        //         TAG.Worktop.Database.getDoq(INPUT_TOUR_ID, function(tour) {
        //             var tourData = JSON.parse(unescape(tour.Metadata.Content)),
        //                 rinPlayer = TAG.Layout.TourPlayer(tourData, null, {}, null, tour);

        //             tagContainer.css('overflow', 'hidden');

        //             tagContainer.append(rinPlayer.getRoot());
        //             rinPlayer.startPlayback();

        //             currentPage.name = TAG.Util.Constants.pages.TOUR_PLAYER;
        //             currentPage.obj  = rinPlayer;
        //         }, function() {
        //             // TODO error handling
        //         }, function() {
        //             // TODO cache error handling
        //         });
        //     });
        // } else { // otherwise, load to start page
        //     currentPage.name = TAG.Util.Constants.pages.START_PAGE;
        //     currentPage.obj  = null;

        //     TAG.Layout.StartPage(null, function (page) {
        //         tagContainer.append(page);
        //     });
        // }
        // if the user specified the tourData API parameter, load into the corresponding tour
        if(pageToLoad && pageToLoad.pagename === 'tour') {
            currentPage.name = TAG.Util.Constants.pages.START_PAGE;
            currentPage.obj  = null;

            TAG.Layout.StartPage(null, function (page) {
                TAG.Worktop.Database.getDoq(pageToLoad.guid, function(tour) {
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
        } else if (pageToLoad && pageToLoad.pagename === 'collections') {
            currentPage.name = TAG.Util.Constants.pages.START_PAGE;
            currentPage.obj  = null;

            TAG.Layout.StartPage(null, function (page) {
                var collectionsPage;
                if(pageToLoad.collectionid) {
                    TAG.Worktop.Database.getDoq(pageToLoad.collectionid, function(collection) {
                        if(pageToLoad.artworkid) {
                            TAG.Worktop.Database.getDoq(pageToLoad.artworkid, function(artwork) {
                                collectionsPage = new TAG.Layout.CollectionsPage({
                                    backScroll: 0,
                                    backArtwork: artwork,
                                    backCollection: collection
                                });
                                tagContainer.append(collectionsPage.getRoot());
                            });
                        } else {
                            collectionsPage = new TAG.Layout.CollectionsPage({
                                backScroll: 0,
                                backArtwork: null,
                                backCollection: collection
                            });
                            tagContainer.append(collectionsPage.getRoot());
                        }
                    });
                } else {
                    collectionsPage = TAG.Layout.CollectionsPage();
                    tagContainer.append(collectionsPage.getRoot());
                }
                currentPage.name = TAG.Util.Constants.pages.COLLECTIONS_PAGE;
                currentPage.obj  = collectionsPage;
            }, function() {
                // TODO error handling
            }, function() {
                // TODO cache error handling
            });
        } else if (pageToLoad && pageToLoad.pagename === 'artwork') {
            currentPage.name = TAG.Util.Constants.pages.START_PAGE;
            currentPage.obj  = null;

            TAG.Layout.StartPage(null, function (page) {
                TAG.Worktop.Database.getDoq(pageToLoad.guid, function(artwork) {
                    var artworkViewer = TAG.Layout.ArtworkViewer({
                        doq: artwork,
                        prevScroll: 0,
                        prevCollection: null,
                        prevPage: 'catalog'
                    });
                    tagContainer.append(artworkViewer.getRoot());

                    currentPage.name = TAG.Util.Constants.pages.ARTWORK_VIEWER;
                    currentPage.obj  = artworkViewer;
                });
            }, function() {
                // TODO error handling
            }, function() {
                // TODO cache error handling
            });
        } else if (pageToLoad && pageToLoad.pagename === 'video') {
            currentPage.name = TAG.Util.Constants.pages.START_PAGE;
            currentPage.obj  = null;

            TAG.Layout.StartPage(null, function (page) {
                TAG.Worktop.Database.getDoq(pageToLoad.guid, function(video) {
                    var videoPlayer = TAG.Layout.VideoPlayer(video, null, null);
                    tagContainer.append(videoPlayer.getRoot());

                    currentPage.name = TAG.Util.Constants.pages.VIDEO_PLAYER;
                    currentPage.obj  = videoPlayer;
                });
            }, function() {
                // TODO error handling
            }, function() {
                // TODO cache error handling
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
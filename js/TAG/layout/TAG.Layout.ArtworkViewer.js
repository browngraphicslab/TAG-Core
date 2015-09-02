﻿TAG.Util.makeNamespace("TAG.Layout.ArtworkViewer");

/**
 * The artwork viewer, which contains a sidebar with tools and thumbnails as well
 * as a central area for the deepzoom image.
 * @class TAG.Layout.ArtworkViewer
 * @constructor
 * @param {Object} options              some options for the artwork viewer page
 * @param {HTML Element} container      the root container 
 * @return {Object}                     some public methods
 */
TAG.Layout.ArtworkViewer = function (options, container) { // prevInfo, options, exhibition) {
    "use strict";

    options = options || {}; // cut down on null checks later

    var // DOM-related
        root = TAG.Util.getHtmlAjax('Artmode.html'),
        sideBar = root.find('#sideBar'),
        toggler = root.find('#toggler'),
        togglerImage = root.find('#togglerImage'),
        backButton = root.find('#backButton'),
        linkButton = root.find('#linkButton'),
        linkButtonContainer = root.find('#linkContainer'),
        //locHistoryDiv       = root.find('#locationHistoryDiv'),
        FIX_PATH = TAG.Worktop.Database.fixPath,
        info = root.find('#info'),
        loadingArea = root.find('#loadingArea'),
        locHistory = root.find('#locationHistory'),
        locHistoryContainer = root.find('#locationHistoryContainer'),
        locationPanelDiv = null,
        locHistoryToggle = null,
        locHistoryToggleSign = null,
        toggleArea,
        toggleHotspotButton,
        fieldsMapButton = $(document.createElement("BUTTON")),
        isOpen = false,
        that = this,
        locked = TAG.Worktop.Database.getLocked(),     //Check for locked
        // constants
        FIX_PATH = TAG.Worktop.Database.fixPath,
        PRIMARY_FONT_COLOR = "#D99B3B",
        SECONDARY_FONT_COLOR = options.secondaryFontColor ? options.secondaryFontColor : TAG.Worktop.Database.getMuseumSecondaryFontColor(),
        FONT = TAG.Worktop.Database.getMuseumFontFamily(),

        // input options
        doq = options.doq,              // the artwork doq
        prevPage = options.prevPage,         // the page we came from (string)
        prevScroll = options.prevScroll || 0,  // scroll position where we came from
        prevCollection = options.prevCollection,   // collection we came from, if any
        prevTag = options.prevTag,          // sort tag of collection we came from, if any
        prevMult = options.prevMult,
        prevPreview = options.prevPreview,      //previous artwork/media that was previewing (could be different than doq for assoc media view)     
        prevPreviewPos = options.prevPreviewPos,
        prevSearch = options.prevSearch,       // previous search
        previewing = options.previewing, 	   // if we are previewing in authoring (for styling)
        assocMediaToShow = options.assocMediaToShow,
        wasOnAssocMediaView = options.onAssocMediaView,
        originalOptions = options,
        isSlideMode = options.isSlideMode,
        slideModeArray = options.slidesArray,
        nextSlide= $(document.createElement('img')),
        prevSlide = $(document.createElement('img')),

        //Nobel will customizations
        isNobelWill = options.isNobelWill || false,
        isImpactMap = true,// options.isImpactMap,
        isSecondaryArt = options.isSecondaryArt,
        smallPreview = options.smallPreview, //for reloading back into collections page
        titleIsName = options.titleIsName, // for reloading back into collections page
        NOBEL_WILL_COLOR = 'rgb(254,161,0)',
        //NOBEL_WILL_COLOR = 'rgb(189,125,13)',
        NOBEL_ORANGE_COLOR = 'rgb(254,161,0)',
        
        //options to maintain customizations when going back to collections page
        isImpactMap = options.isImpactMap,
        smallPreview = options.smallPreview,
        titleIsName = options.titleIsName,
        twoDeep = options.twoDeep,
        oneDeep = options.oneDeep,
        hideKeywords = options.hideKeywords,
        showNobelLifeBox = options.showNobelLifeBox,

        // misc initialized vars  
        locHistoryActive = false,                   // whether location history is open
        locClosing = false,                   // whether location history is closing
        locOpening = false,                   // whether location history is opening
        drawers = [],                      // the expandable sections for assoc media, tours, description, etc...
        mediaHolders = [],                      // array of thumbnail buttons
        loadQueue = TAG.Util.createQueue(),  // async queue for thumbnail button creation, etc
        screenWidth = $('#tagRoot').width(),      // Width of entire tag screen (for split screen styling)
        telemetry_timer = new TelemetryTimer(),       //Timer for telemetry
        firstShowHotspots = true,

        //nobel will variables
        showInitialNobelWillBox = true,
        showInitialImpactPopUp = options.showInitialImpactPopUp || false,
        sliderBar,//the big yellow div sliding up and down
        chunkNumber,//the current chunk number (0-based) being observed
        leftTextArray,//the array of textDiv-spacingPercent tuples
        textDivArray = [],//array of divs on left with each paragraph of text
        sliderPositions,//the array of yLocation-height tuples for each slider position
        associatedMediaArrays,//the arrays with associated media
        associatedMediaNobelLocations,//array keeping track of locations of associated media
        nobelAssociatedMediaCoordinates,//array of coordinates for associated media
        associatedMediaNobelKeywords,//list of strings that identify the associated media being found. NOT ACTUAL KEYWORDS
        nobelHotspots,//array of hotspots in form [[[hotspotDiv,assocMedia],[hotspotDiv,assocMedia]],[[hotspotDiv,assocMedia],[hotspotDiv,assocMedia]]]
        hardcodedHotspotSpecs,//array of hardcoded info about the locations of the hotspots
        pageNumber = 0,//nobel will page number
        nextPageDoq, //these four variables a self explainatory and are fetched from ther server upon loading
        nextPageAssociatedMedia,
        prevPageDoq,
        audioFinishedHandler,
        prevPageAssociatedMedia,
        nobelIsPlaying = false,
        nobelPlayPauseButton,
        currentAudio,
        muteButton,
        nobelMuted = false,
        toggleHotspotButton,
        hotspotsShown,
        willImage,
        smallWillImage,

        // misc uninitialized vars
        keywordSets,
        locationList,                               // location history data
        customMapsLength,
        map,                                        // Bing Maps map for location history
        annotatedImage,                             // an AnnotatedImage object
        associatedMedia,                            // object of associated media objects generated by AnnotatedImage
        hotspots,                                   // object of hotspots from annotated image
        manipulate; // Manipulation method


    // get things rolling if doq is defined (it better be)
    doq && init();
    console.log(SECONDARY_FONT_COLOR);

    return {
        getRoot: getRoot,
        getArt: getArt
    };
    root.attr('unselectable', 'on');
    root.css({
        '-moz-user-select': '-moz-none',
        '-o-user-select': 'none',
        '-khtml-user-select': 'none',
        '-webkit-user-select': 'none',
        '-ms-user-select': 'none',
        'user-select': 'none'
    });
    root.bind('selectstart', function () { return false; });
    sideBar.disableSelection();
    sideBar.attr('unselectable', 'on');
    sideBar.css({
        '-moz-user-select': '-moz-none',
        '-o-user-select': 'none',
        '-khtml-user-select': 'none',
        '-webkit-user-select': 'none',
        '-ms-user-select': 'none',
        'user-select': 'none'
    });
    sideBar.bind('selectstart', function () { return false; });
    /**
     * Initiate artmode with a root, artwork image and a sidebar on the left
     * @method init
     */
    function init() {
        var head,
            script,
            meta;

        if (!idleTimer && !previewing && locked !== doq.Identifier) {
            idleTimer = TAG.Util.IdleTimer.TwoStageTimer();
            idleTimer.start();
        }
        if (idleTimer && (previewing || locked === doq.Identifier)) {
            idleTimer.kill();
        }

        var progressCircCSS = {
            'position': 'absolute',
            'z-index': '50',
            'height': 'auto',
            'width': '5%',
            'left': '47.5%',
            'top': '42.5%'
        };


        TAG.Util.showProgressCircle(loadingArea, progressCircCSS, '0px', '0px', false);
        var loadingLabel = $(document.createElement('label'));
        loadingLabel.css({
            'position': 'absolute',
            'left': '40%',
            'top': '55%',
            'font-size': '200%',
            'color': 'white',
            'opacity': '1'
        });
        loadingLabel.text('Loading Viewer');
        loadingArea.append(loadingLabel);

        // add script for displaying bing maps

        head = document.getElementsByTagName('head').item(0);
        script = document.createElement("script");
        script.charset = "UTF-8";
        script.type = "text/javascript";
        script.src = "http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0";
        head.appendChild(script);
        meta = document.createElement('meta');
        meta.httpEquiv = "Content-Type";
        meta.content = "text/html; charset=utf-8";
        head.appendChild(meta);

        locationList = TAG.Util.UI.getLocationList(doq.Metadata);

        sideBar.css('visibility', 'hidden');

        if (!slideModeArray || !slideModeArray.length || slideModeArray.length===0) {
            isSlideMode = false;
        }
        else if(slideModeArray[0]._value && slideModeArray[0]._value.artwork) {
            var temp = []
            while (slideModeArray.length > 0) {
                temp.push(slideModeArray.shift()._value.artwork)
            }
            slideModeArray = temp;
        }

        if (isImpactMap) sideBar.css

        annotatedImage = TAG.AnnotatedImage({
            isNobelWill: isNobelWill,
            isImpactMap: isImpactMap,
            root: root,
            doq: doq,
            callback: function () {
                associatedMedia = annotatedImage.getAssociatedMedia();
                associatedMedia.guids.sort(function (a, b) {
                    return associatedMedia[a].doq.Name.toLowerCase() < associatedMedia[b].doq.Name.toLowerCase() ? -1 : 1;
                });
                hotspots = annotatedImage.getHotspots();
                try { // TODO figure out why loadDoq sometimes causes a NetworkError (still happening?)
                    annotatedImage.openArtwork(doq);
                } catch (err) {
                    debugger;
                    doNothing(err); // TODO if we hit a network error, show an error message
                }
                //hiding splitscreen for nobel demo
                /**
                if (isNobelWill !== true && !isImpactMap) {
                    TAG.Util.Splitscreen.setViewers(root, annotatedImage);
                    initSplitscreen();
                }
                **/
                //createSeadragonControls();
                TAG.Worktop.Database.getMaps(doq.Identifier, function (mps) {
                    customMapsLength = mps.length;
                    setTimeout(function(){makeSidebar();},250);  //hack for some async styling stuff - lucyvk
                });

                if (isNobelWill === true) {
                    nobelWillInit();
                }

                if (isImpactMap === true && showInitialImpactPopUp === false) {
                    createImpactPopUp();
                }

                $("#startPageLoadingOverlay").remove();

                loadingArea.hide();
            },
            noMedia: false,
            getNobelAssociatedMediaLocation: getNobelAssociatedMediaLocation
        });

        // Keyword sets
        keywordSets = TAG.Worktop.Database.getKeywordSets();
    }

    /*
    *returns the coordinates of the next place to put the next associated media
    * @param identifier of the doq being displayed
    */
    function getNobelAssociatedMediaLocation(identifier) {
        if (isNobelWill === true) {
            if (!associatedMediaNobelLocations) {
                associatedMediaNobelLocations = [false, false];
                var w = (root.width() * .16) / 2 + 125;
                nobelAssociatedMediaCoordinates = [{ x: root.width() - w, y: 0 }, { x: root.width() - w, y: root.height() / 2 }];
                return getNobelAssociatedMediaLocation();
            }
            else {
                for (var i = 0; i < associatedMediaNobelLocations.length; i++) {
                    if (associatedMediaNobelLocations[i] !== false && associatedMediaNobelLocations[i].length && associatedMediaNobelLocations[i][0] === identifier) {
                        return associatedMediaNobelLocations[i][1];
                    }
                }
                for (var i = 0; i < associatedMediaNobelLocations.length; i++) {
                    if (associatedMediaNobelLocations[i] === false) {
                        associatedMediaNobelLocations[i] = [identifier, nobelAssociatedMediaCoordinates[i]]
                        return nobelAssociatedMediaCoordinates[i]
                    }
                }
                return { x: root.width() - 250, y: 200 }
            }
        }
        else {
            return false;
        }
    }

    function afterInSlideArray(item) {
        if (isSlideMode === true) {
            item = item || doq;
            var index = slideModeArray.indexOf(item);
            if (index === slideModeArray.length - 1) {
                return false;
            }
            else {
                return slideModeArray[index +1]
            }
        }
        return false
    }

    function beforeInSlideArray(item) {
        if (isSlideMode === true) {
            item = item || doq;
            var index = slideModeArray.indexOf(item);
            if (index === 0) {
                return false;
            }
            else {
                return slideModeArray[index - 1]
            }
        }
        return false
    }

    function nextSlidePage() {
        var artworkViewer = TAG.Layout.ArtworkViewer({
            doq: afterInSlideArray(),
            isNobelWill: false,
            isSlideMode: isSlideMode,
            slidesArray: slideModeArray,

            prevPreview: prevPreview,
            prevTag: prevTag,
            prevScroll: prevScroll,
            prevPreviewPos: prevPreviewPos,
            prevCollection: prevCollection,
            prevPage: prevPage,
            prevMult: prevMult,
            showNobelLifeBox: showNobelLifeBox
        });
        var newPageRoot = artworkViewer.getRoot();
        newPageRoot.data('split', root.data('split') === 'R' ? 'R' : 'L');

        TAG.Util.UI.slidePageLeftSplit(root, newPageRoot);
    }

    function prevSlidePage() {
        var artworkViewer = TAG.Layout.ArtworkViewer({
            doq: beforeInSlideArray(),
            isNobelWill: false,
            isSlideMode: isSlideMode,
            slidesArray: slideModeArray,

            prevPreview: prevPreview,
            prevTag: prevTag,
            prevScroll: prevScroll,
            prevPreviewPos: prevPreviewPos,
            prevCollection: prevCollection,
            prevPage: prevPage,
            prevMult: prevMult,
            showNobelLifeBox: showNobelLifeBox
        });
        var newPageRoot = artworkViewer.getRoot();
        newPageRoot.data('split', root.data('split') === 'R' ? 'R' : 'L');

        TAG.Util.UI.slidePageRightSplit(root, newPageRoot);
    }

    /**
     * Initializes splitscreen functionality
     * @method initSplitscreen
     */
    function initSplitscreen() {
        var splitscreenContainer = $(document.createElement('div')),
            splitscreenIcon = $(document.createElement('img'));

        splitscreenContainer.attr('id', 'splitscreenContainer');
        splitscreenContainer.css({
            'background-color': 'rgba(0,0,0,0.6)',
            'border-top-left-radius': '3.5px',
            'height': '10%',
            'position': 'absolute',
            'right': '0%',
            'text-align': 'center',
            'top': '90%',
            'vertical-align': 'center',
            'width': '10%',
            'z-index': '500'
        });

        splitscreenIcon.attr({
            id: 'splitscreen-icon',
            src: tagPath + 'images/SplitWhite_dotted.svg'
        });
        splitscreenIcon.css({
            height: '50%',
            left: '2%',
            opacity: '0.6',
            //position: 'absolute',
            'margin-top': '8%',
            width: '75%'
        });

        splitscreenContainer.on('click', function () {
            var collectionsPage,
                collectionsPageRoot;
            if (!TAG.Util.Splitscreen.isOn()) {
                if (isOpen) {
                    locationPanelDiv.animate({ width: '0%' }, 350, function () {
                        locHistory.text("Maps");
                        locHistory.css({ "color": TAG.Util.UI.dimColor(PRIMARY_FONT_COLOR, 1.7) });
                        locHistoryContainer.css({ "background-color": "transparent" });
                        locationPanelDiv.hide();
                        locHistoryToggle.hide();
                        locHistoryToggleSign.attr("src", tagPath + 'images/icons/plus.svg');
                        isOpen = false;
                        toggler.show();

                        collectionsPage = TAG.Layout.CollectionsPage();

                        collectionsPageRoot = collectionsPage.getRoot();
                        collectionsPageRoot.find("#loadingLabel").css({ 'font-size': '100%', 'left': '37%', 'top': '50%' }); // adjust formatting in splitscreen mode
                        collectionsPageRoot.data('split', 'R');

                        splitscreenContainer.css('display', 'none');
                        TAG.Util.Splitscreen.init(root, collectionsPageRoot);
                        annotatedImage.viewer.clearOverlays();
                        //annotatedImage.viewer.viewport.applyConstraints();
                        TAG.Util.Splitscreen.setViewers(root, annotatedImage);
                    });
                } else {
                    locHistory.css({ "color": TAG.Util.UI.dimColor(PRIMARY_FONT_COLOR, 1.7) });
                    collectionsPage = TAG.Layout.CollectionsPage();

                    collectionsPageRoot = collectionsPage.getRoot();
                    collectionsPageRoot.find("#loadingLabel").css({ 'font-size': '100%', 'left': '37%', 'top': '50%' }); // adjust formatting in splitscreen mode
                    collectionsPageRoot.data('split', 'R');

                    splitscreenContainer.css('display', 'none');
                    TAG.Util.Splitscreen.init(root, collectionsPageRoot);
                    annotatedImage.viewer.clearOverlays();
                    //annotatedImage.viewer.viewport.applyConstraints();
                    TAG.Util.Splitscreen.setViewers(root, annotatedImage);
                }

            }
        });

        splitscreenContainer.append(splitscreenIcon);

        var splitScreenLabel = $(document.createElement('div')).css({ 'font-size': '40%', 'bottom': '0%', 'margin-top': '-2%' }).text('Splitscreen').appendTo(splitscreenContainer);

        root.append(splitscreenContainer);
        doNothing('locked' + locked);
        doNothing(!locked);
        if (TAG.Util.Splitscreen.isOn() || (locked !== undefined && locked !== 'undefined')) {
            splitscreenContainer.css('display', 'none');
        }
        else {
            splitscreenContainer.css('display', 'block');
        }
    }

    /**
     * Add controls and key handlers for manual Seadragon manipulation
     * @method createSeadragonControls
     */
    function createSeadragonControls() {
        var container = root.find('#seadragonManipContainer'),
            slideButton = root.find('#seadragonManipSlideButton'),
            tagRoot = $('#tagRoot'),
            top = 0,
            count = 0,
            panDelta = 20,
            zoomScale = 1.1,
            containerFocused = true,
            interval;

        // splitscreen
        if (root.data('split') === 'R' && TAG.Util.Splitscreen.isOn()) {
            container.css({
                'right': 'auto',
                'left': '0%'
            });
            slideButton.css({ //fix the rounded edge to be on the correct side
                'border-bottom-left-radius': '0px',
                'border-bottom-right-radius': '3.5px',
            });
        }

        //To-do figure out best max-width, min width
        if (previewing) {
            return;
        }
        container.css('width', Math.max(160, Math.min($('#tagRoot').width() * 0.19, 400)));
        var containerHeight = container.width() * (111 / 163)
        container.css({
            'height': containerHeight + 'px',
            'top': '-' + containerHeight + 'px',
            'min-width': container.width()
        });
        slideButton.css({
            'padding-top': 0.05 * container.width() + 'px',
            'padding-bottom': 0.05 * container.width() + 'px'
        })


        slideButton.on('click', function () {
            count = 1 - count;
            container.animate({
                top: top
            });
            if (count === 0) {
                top = '0px';
            } else {
                top = '-' + containerHeight + 'px';
            }
        });

        var first_time = true,
            telem_timer = new TelemetryTimer();

        TAG.Telemetry.register(slideButton, 'click', 'ButtonPanelToggled', function (tobj) {
            if (first_time || count) { //registering only when the button panel is open and for how long it was open
                telemetry_timer.restart();
                first_time = false;
                return true;
            }
            tobj.current_artwork = doq.Identifier;
            tobj.time_spent = telemetry_timer.get_elapsed();
            //doNothing(tobj.time_spent);
        });


        container.append(slideButton);
        var sdleftbtn = createButton('leftControl', tagPath + 'images/icons/zoom_left.svg'),
            sdrightbtn = createButton('rightControl', tagPath + 'images/icons/zoom_right.svg'),
            sdupbtn = createButton('upControl', tagPath + 'images/icons/zoom_up.svg'),
            sddownbtn = createButton('downControl', tagPath + 'images/icons/zoom_down.svg');
        container.append(sddownbtn);
        container.append(sdupbtn);

        if (sddownbtn.width()) {
            doNothing("got valid height" + sddownbtn.height());
            sdleftbtn.css('height', sddownbtn.width());
            sdrightbtn.css('height', sddownbtn.width());
        }
        container.append(sdleftbtn);
        container.append(sdrightbtn);

        var radius = (sdrightbtn.position().left - sdleftbtn.position().left + sdrightbtn.width()) / 2;
        var centery = sdleftbtn.position().top + sdleftbtn.height() / 2;
        //sdupbtn.css('top', centery - radius +5+ 'px');
        //sddownbtn.css('top', centery + radius -sdleftbtn.width() +15+ 'px');
        container.append(createButton('zinControl', tagPath + 'images/icons/zoom_plus.svg'));
        container.append(createButton('zoutControl', tagPath + 'images/icons/zoom_minus.svg'));

        var crossfadeSlider = $(document.createElement('input')).attr({
            'id': 'crossfadeSlider',
            'type': 'range',
            'value': 1,
            'min': 0,
            'max': 1,
            'step': 0.05
        });

        crossfadeSlider.on('change mousemove', function () {
            $('.mediaOuterContainer').css('opacity', crossfadeSlider.val());
        });
        crossfadeSlider.on('touchmove', function (e) {
            e.preventDefault();
            $('.mediaOuterContainer').css('opacity', crossfadeSlider.val());
        });


        /**
         * Create a seadragon control button
         * @method createButton
         * @param {String} id        the id for the new button
         * @param {String} imgPath   the path to the button's image
         * @param {Number} left      css left property for button
         * @param {Number} top       css top property for button
         * @return {jQuery obj}      the button
         */
        function createButton(id, imgPath, left, top) {
            var img = $(document.createElement('img'));

            img.attr({
                src: imgPath,
                id: id
            });

            img.removeAttr('width');
            img.removeAttr('height');

            img.css({
                left: left + "px",
                top: top + "px"
            });

            if (id === 'leftControl' || id === 'rightControl') {
                img.addClass('seadragonManipButtonLR');
            } else if (id === 'upControl' || id === 'downControl') {
                img.addClass('seadragonManipButtonUD');
            } else if (id === 'zinControl' || id === 'zoutControl') {
                img.addClass('seadragonManipButtoninout');
            }

            return img;
        }
        /*      //TODO change to recordEvent
        TAG.Telemetry.register(root.find("#leftControl,#rightControl,#downControl,#upControl,#zoutControl,#zinControl"), 'click', 'ControlButton', function (tobj, evt) {
            tobj.control_type = "seadragon_click"
            tobj.button = evt.target.id;
            tobj.current_artwork = doq.Identifier;
        });
        */
        /**
         * Keydown handler for artwork manipulation; wrapper around doManip that first
         * prevents default key behaviors
         * @method keyHandler
         * @param {Object} evt         the event object
         * @param {String} direction   the direction in which to move the artwork
         */
        function keyHandler(evt, direction) {
            evt.preventDefault();
            clearInterval(interval);
            doManip(evt, direction);
        }

        /**
         * Click handler for button in given direction; a wrapper around doManip that also
         * executes doManip in an interval if the user is holding down a button
         * @method buttonHandler
         * @param {Object} evt         the event object
         * @param {String} direction   the direction in which to move the artwork
         */
        function buttonHandler(evt, direction) {
            doManip(evt, direction);
            clearInterval(interval);
            interval = setInterval(function () {
                doManip(evt, direction);
            }, 100);
        }

        /**
         * Do fixed manipulation in response to seadragon controls or key presses
         * @method doManip
         * @param {Object} evt         the event object
         * @param {String} direction   the direction in which to move the artwork
         */
        function doManip(evt, direction) {
            var pivot = annotatedImage.getMediaPivot();
            manipulate = annotatedImage.getToManip();

            if (direction === 'left') {
                manipulate({ pivot: pivot, translation: { x: -panDelta, y: 0 }, scale: 1 }, null, true);
            } else if (direction === 'up') {
                manipulate({ pivot: pivot, translation: { x: 0, y: -panDelta }, scale: 1 }, null, true);
            } else if (direction === 'right') {
                manipulate({ pivot: pivot, translation: { x: panDelta, y: 0 }, scale: 1 }, null, true);
            } else if (direction === 'down') {
                manipulate({ pivot: pivot, translation: { x: 0, y: panDelta }, scale: 1 }, null, true);
            } else if (direction === 'in') {
                manipulate({ pivot: pivot, translation: { x: 0, y: 0 }, scale: zoomScale });
            } else if (direction === 'out') {
                manipulate({ pivot: pivot, translation: { x: 0, y: 0 }, scale: 1 / zoomScale });
            }
        }


        // tabindex code is to allow key press controls (focus needs to be on the TAG container)
        $('#tagContainer').attr("tabindex", -1);
        $("[tabindex='-1']").focus();
        $("[tabindex='-1']").css('outline', 'none');
        $("[tabindex='-1']").on('click', function () {
            $("[tabindex='-1']").focus();
            containerFocused = true;
            annotatedImage.dzManipPreprocessing();     //Tell AnnotatedImage that the main artwork is active
        });
        $("[tabindex='-1']").focus(function () {
            containerFocused = true;
        });
        $("[tabindex='-1']").focusout(function () {
            containerFocused = false;
        });

        // TODO merge: need to fix the $(...) calls above for splitscreen

        $(document).on('keydown', function (evt) {
            if (containerFocused) {
                switch (evt.which) {
                    case 37:
                        keyHandler(evt, 'left');
                        break;
                    case 38:
                        keyHandler(evt, 'up');
                        break;
                    case 39:
                        keyHandler(evt, 'right');
                        break;
                    case 40:
                        keyHandler(evt, 'down');
                        break;
                    case 187:
                    case 61:
                        keyHandler(evt, 'in');
                        break;
                    case 189:
                    case 173:
                        keyHandler(evt, 'out');
                        break;
                }
            }
        });

        $(document).keyup(function (evt) {
            clearInterval(interval);
        });

        root.find('#seadragonManipContainer').on('click', function (evt) {
            evt.stopPropagation(); //Prevent the click going through to the main container
            evt.preventDefault();
            if (locked !== doq.Identifier) {
                TAG.Util.IdleTimer.restartTimer();
            }
        });

        root.find('#leftControl').on('mousedown', function (evt) {
            buttonHandler(evt, 'left');
        });
        root.find('#upControl').on('mousedown', function (evt) {
            buttonHandler(evt, 'up');
        });
        root.find('#rightControl').on('mousedown', function (evt) {
            buttonHandler(evt, 'right');
        });
        root.find('#downControl').on('mousedown', function (evt) {
            buttonHandler(evt, 'down');
        });
        root.find('#zinControl').on('mousedown', function (evt) {
            buttonHandler(evt, 'in');
        });
        root.find('#zoutControl').on('mousedown', function (evt) {
            buttonHandler(evt, 'out');
        });

        root.find('.seadragonManipButtonLR').on('mouseup mouseleave', function () {
            clearInterval(interval);
        });

        root.find('.seadragonManipButtonUD').on('mouseup mouseleave', function () {
            clearInterval(interval);
        });

        root.find('.seadragonManipButtoninout').on('mouseup mouseleave', function () {
            clearInterval(interval);
        });

    }

    /**
     * Makes the artwork viewer sidebar
     * @method makeSidebar
     */
    function makeSidebar(mapslength) {
        var backBttnContainer = root.find("#backBttnContainer"),
            sideBarSections = root.find('#sideBarSections'),
            sideBarInfo = root.find('#sideBarInfo'),
            infoTitle = root.find('#infoTitle'),
            infoArtist = root.find('#infoArtist'),
            infoYear = root.find('#infoYear'),
            assetContainer = root.find('#assetContainer'),
            isBarOpen = true,
            currBottom = 0,
            item,
            fieldTitle,
            fieldValue,
            infoCustom,
            i,
            curr,
            button,
            descriptionDrawer,
            keywordsSet1Drawer,
            keywordsSet2Drawer,
            keywordsSet3Drawer,
            tourDrawer,
            locHistoryButton,
            mediaDrawer,
            xfadeDrawer,
            xfadeSlider,
            xfadeSliderPoint,
            isFading = false;

        sideBar.css('visibility', 'visible');
        toggleArea = $(document.createElement('div'))
        .css({'display':'none', 'height': '10%', 'margin-top': '10%'});
        assetContainer.append(toggleArea);

        if (!IS_WINDOWS){
            sideBar.on("mousemove", function(evt){
                console.log("sidebar blocking mousemove")
                evt.stopPropagation();
            });
        }

        sideBarInfo.css({
            'height': sideBarSections.height() - 25 + 'px'
        });

        if (locked !== doq.Identifier) {
            backButton.attr('src', tagPath + 'images/icons/Back.svg');
        } else {
            backButton.hide();
        }

        togglerImage.attr("src", tagPath + 'images/icons/Close_nobel.svg');
        infoTitle.text(doq.Name);
        infoArtist.text(doq.Metadata.Artist);
        infoYear.text(doq.Metadata.Year);
        infoTitle.css({
            'color': '#' + PRIMARY_FONT_COLOR,
        });

        infoArtist.css({
            'color': '#' + PRIMARY_FONT_COLOR,
        });

        infoYear.css({
            'color': '#' + PRIMARY_FONT_COLOR,
            //'font-family': FONT
        });
        locHistory && locHistory.css({
            'color': '#' + PRIMARY_FONT_COLOR,
            //'font-family': FONT
        });

        if (!previewing) {
            sideBar.css('min-width', 0.22 * screenWidth);
        }

        // toggler to hide/show sidebar
        toggler.on('click', function () {
            var opts = {},
                isLeft = root.data('split') === 'L';

            if (isLeft) {
                opts.left = isBarOpen ? '-' + (0.22 * screenWidth) + 'px' : '0%';
            } else {
                opts.right = isBarOpen ? '-' + (0.22 * screenWidth) + 'px' : '0%';
            }

            isBarOpen = !isBarOpen;

            sideBar.animate(opts, 1000, function () {
                togglerImage.attr('src', tagPath + 'images/icons/' + ((!!isBarOpen) ^ (!isLeft) ? 'Close_nobel.svg' : 'Open_nobel.svg'));
            });
        });

        var t_timer = new TelemetryTimer();

        TAG.Telemetry.register(toggler, 'mouseup', 'ToggleSidebar', function (tobj) {
            if (!isBarOpen) {
                t_timer.restart();
                return true;
            }
            tobj.sidebar_open = !isBarOpen;
            tobj.current_artwork = doq.Identifier;
            tobj.time_spent = t_timer.get_elapsed();
            //doNothing(tobj.time_spent);
        });

        backButton.on('click', goBack);
        TAG.Telemetry.register(backButton, 'click', 'BackButton', function (tobj) {

            //for the seadragon controls, if the back button is pressed when they are open
            root.find('#seadragonManipSlideButton').click();

            //same for the left menu sidebar
            toggler.mouseup();

            tobj.current_artwork = doq.Identifier;
            tobj.next_page = prevCollection;
            tobj.time_spent = telemetry_timer.get_elapsed();
        });

        if (IS_WEBAPP && !locked) {
            linkButton.attr('src', tagPath + 'images/link.svg');
            linkButton.on('click', function () {
                var linkOverlay = TAG.Util.UI.showPageLink(urlToParse, {
                    tagpagename: 'artwork',
                    tagguid: doq.Identifier,
                    prevpage: prevCollection.Identifier
                });

                root.append(linkOverlay);
                linkOverlay.fadeIn(500, function () {
                    linkOverlay.find('.linkDialogInput').select();
                });
            });
        } else {
            linkButtonContainer.remove();
        }

        function goBack() {
            console.log("going back");
            TAG.Util.removeYoutubeVideo();
            $('.annotatedImageHotspotCircle').remove(); //remove hotspots
            $('.mediaOuterContainer').remove();
            var collectionsPage,
                collectionsPageRoot;
            backButton.off('click');

            //idleTimer && idleTimer.kill();
            //idleTimer = null;

            annotatedImage && annotatedImage.unload();

            collectionsPage = TAG.Layout.CollectionsPage({
                backScroll: prevScroll,
                backPreviewPos: prevPreviewPos,
                backArtwork: prevPreview,
                backCollection: prevCollection,
                backTag: prevTag,
                backMult: prevMult,
                backSearch: prevSearch,
                wasOnAssocMediaView: wasOnAssocMediaView,
                splitscreen: root.data('split'),
                smallPreview: smallPreview,
                titleIsName: titleIsName,
                twoDeep: twoDeep,
                oneDeep: oneDeep,
                hideKeywords: hideKeywords,
                showNobelLifeBox: showNobelLifeBox,
                showInitialImpactPopUp: showInitialImpactPopUp
            });

            collectionsPageRoot = collectionsPage.getRoot();
            collectionsPageRoot.data('split', root.data('split') === 'R' ? 'R' : 'L');

            TAG.Util.UI.slidePageRightSplit(root, collectionsPageRoot, function () {
                if (!IS_WINDOWS) {
                    if (collectionsPage.getState().exhibition === prevCollection) {
                        collectionsPage.showArtwork(prevPreview, prevMult && prevMult)();
                    }
                }
            });

            currentPage.name = TAG.Util.Constants.pages.COLLECTIONS_PAGE;
            currentPage.obj = collectionsPage;
        }

        if (customMapsLength > 0 || locationList.length > 0) {
            locHistoryButton = initlocationHistory();
            assetContainer.append(locHistoryButton);
            currBottom += locHistoryButton.height();
        } else {
            root.find('#locationHistoryContainer').remove();
        }

        infoYear.css('display','none');

        /**
         * Creates a tour thumbnail button
         * @method createTourButton
         * @param {jQuery obj} container     the element to which we'll append this button
         * @param {doq} tour                 the tour doq
         */
        function createTourButton(container, tour) {
            return function () {
                container.append(TAG.Util.Artwork.createThumbnailButton({
                    title: TAG.Util.htmlEntityDecode(tour.Name),
                    year: TAG.Util.htmlEntityDecode(tour.Year || ""),
                    handler: tourClicked(tour),
                    buttonClass: 'tourButton',
                    src: (tour.Metadata.Thumbnail ? FIX_PATH(tour.Metadata.Thumbnail) : tagPath + 'images/tour_icon.svg')
                }));
            }
        }

        /**
         * Creates a thumbnail button for an associated media
         * @method createMediaButton
         * @param {jQuery obj} container       the element to which we'll append the button
         * @param {Object} media               an associated media object (from AnnotatedImage)
         */
        function createMediaButton(container, media) {
            return function () {
                var src = '',
                    metadata = media.doq.Metadata,
                    thumb = metadata.Thumbnail;
                switch (metadata.ContentType) {
                    case 'Audio':
                        src = tagPath + 'images/audio_icon.svg';
                        break;
                    case 'Video':
                        src = (thumb && !thumb.match(/.mp4/)) ? FIX_PATH(thumb) : tagPath + 'images/video_icon.svg';
                        break;
                    case 'Image':
                        src = thumb ? FIX_PATH(thumb) : FIX_PATH(metadata.Source);
                        break;
                    case 'iframe':
                        src = tagPath + 'images/video_icon.svg';
                        break;
                    default:
                        src = tagPath + 'images/text_icon.svg';
                        break;
                }
                var isHotspotButton = media.isHotspot ? 'hotspotButton' : 'mediaButton';
                var toAppend = TAG.Util.Artwork.createThumbnailButton({
                    title: TAG.Util.htmlEntityDecode(media.doq.Name),
                    year: TAG.Util.htmlEntityDecode(media.doq.Year || ""),
                    handler: mediaClicked(media),
                    buttonClass: isHotspotButton,
                    buttonID: 'thumbnailButton-' + media.doq.Identifier,
                    src: src
                });
                container.append(toAppend);
                if (toAppend.parents('#metascreen-R').length) {
                    toAppend.attr('id', toAppend.attr('id') + 'R');
                }
            }
        }

        /**
         * Generates a click handler for a specific associated media object
         * Also used when entering from collections page to open a specific associated media (hence the error check for evt)
         * @method mediaClicked
         * @param {Object} media       the associated media object (from AnnotatedImage)
         */
        function mediaClicked(media, justCircle, noPanToPoint) {
            console.log('mediaClicked'+ noPanToPoint);
            if (isNobelWill === true) {              
                return function () { return };
            }
            return function (evt) {
                evt && evt.stopPropagation();
                console.log('hotspot media visible: ' + media.isHotspotMediaVisible());
                locHistoryActive = true;
                media.create(); // returns if already created             
                media.toggle(false, noPanToPoint);
                if (justCircle) {
                    media.toggle(true, noPanToPoint);
                }
                if (locked !== doq.Identifier) {
                    TAG.Util.IdleTimer.restartTimer();
                }
                (media.linq.Metadata.Type !== 'Layer') && media.mediaManipPreprocessing();   // Set the newly opened media as active for manipulation

                media.pauseReset();
                // toggleLocationPanel();
            };
        }

    //TO-DO
    function toggleHotspotsShown(){
        if (hotspotsShown){
            hideHotspots();
        } else {
            showHotspots();
        }
    }

    function hideHotspots() {
        hotspotsShown = false;
        if (toggleHotspotButton) {
            toggleHotspotButton.text('Show Hotspots');
        }

        for (var y = 0; y < hotspots.guids.length; y++) {
            //don't re-click hotspots that are already hidden
                if (!hotspots[hotspots.guids[y]].isVisible()) {
                    console.log('skipping: ' + hotspots.guids[y]);
                    continue;
                }
                //double click to optoggleHotspotButtonen media before closing
                if (!hotspots[hotspots.guids[y]].isHotspotMediaVisible()) {
                    mediaClicked(hotspots[hotspots.guids[y]])();
                }
                mediaClicked(hotspots[hotspots.guids[y]])();
                console.log('hiding: ' + hotspots.guids[y]);
            }
        }

    function showHotspots(){
        hotspotsShown = true;
        if (toggleHotspotButton) {
            toggleHotspotButton.text('Hide Hotspots');
        }
        for (var y = 0; y < hotspots.guids.length; y++) {
            //don't re-click hotspots that are already visible
            if (hotspots[hotspots.guids[y]].isVisible()){
                console.log('skipping: '+ hotspots.guids[y]);
                continue;
            }
            mediaClicked(hotspots[hotspots.guids[y]],true)();
            console.log('showing: '+ hotspots.guids[y]);
        }        
    }

        // Load tours and filter for tours associated with this artwork
        TAG.Worktop.Database.getTours(function (tours) {
            var relatedTours,
                maxHeight;

            relatedTours = tours.filter(function (tour) {
                var relatedArtworks;
                if (!tour.Metadata || !tour.Metadata.RelatedArtworks || tour.Metadata.Private === "true") {
                    return false;
                }
                relatedArtworks = JSON.parse(tour.Metadata.RelatedArtworks);
                if (!relatedArtworks || !relatedArtworks.length) {
                    return false;
                }
                return relatedArtworks.indexOf(doq.Identifier) >= 0;
            });

            if (doq.Metadata.Description) {
                var description = doq.Metadata.Description;
                var descriptionDiv = $(document.createElement('div'));
                descriptionDiv.css({
                    'font-size': '75%',
                    'display': 'inline-block',
                    'margin-left': '15%',
                    'margin-right': '15%',
                    'margin-top': '10%',
                    'max-height': .85*(sideBar.height() - infoTitle.offset().top - infoTitle.height()) + 'px',
                    'overflow-y': 'auto'
                });
                descriptionDiv.addClass('description');
                descriptionDiv.text(description);
                descriptionDiv.appendTo(info);
            };

            // set max height of drawers to avoid expanding into minimap area
            maxHeight = Math.max(1, assetContainer.height() - currBottom); //to account for the height of the drawerLabel of the current drawer.

            root.find(".drawerContents").css({
                "max-height": maxHeight * .75 + "px", //TODO this
                //'max-height':2*0.19 * $('#tagRoot').height() + 'px', //height of two thumbnails
            });
        });

        /**
         * Generates a click handler for a specific tour
         * @method tour
         * @param {Object} media       the tour object(from AnnotatedImage)
         */
        function tourClicked(tour) {
            return function () {

                //ereif: not sure why this is here, but it's undoubtedly important?
                TAG.Util.removeYoutubeVideo();

                var prevInfo, //Info about the artwork we're returning to
                    messageBox,
                    collectionOptions;

                //If splitscreen is on, open confirmation box to tell user that splitscreen will exit.
                if (TAG.Util.Splitscreen.isOn()) {
                    var confirmationBox = $(TAG.Util.UI.PopUpConfirmation(function () {
                        TAG.Util.Splitscreen.exit(root.data('split') || 'L');
                        tourClicked(tour)();
                        TAG.Util.multiLineEllipsis($($($(confirmationBox).children()[0]).children()[0]));
                    },
                        "By opening this tour, you will exit splitscreen mode. Would you like to continue?",
                        "Continue",
                        false,
                        function () {
                            confirmationBox.remove();
                        },
                        root
                    ));
                    confirmationBox.css('z-index', 10000001);
                    root.append(confirmationBox);
                    confirmationBox.show();
                }
                else {
                    //unload current image and set previous info
                    annotatedImage.unload();
                    prevInfo = { artworkPrev: "artmode", prevScroll: prevScroll, prevTag: prevTag };

                    //Parse RIN data into ITE data
                    var iteData = TAG.Util.RIN_TO_ITE(tour);

                    //Create tag tourplayer (which will in turn create an ITE player)
                    var ITEPlayer = new TAG.Layout.TourPlayer(iteData, prevCollection, prevInfo, options, tour);
                    TAG.Util.UI.slidePageLeftSplit(root, ITEPlayer.getRoot(), function () {
                        setTimeout(function () {
                            //var rindata = tour;
                            //ITEPlayer.setTourData(TAG.Util.RIN_TO_ITE(rindata));
                            ITEPlayer.startPlayback();
                        }, 1000);
                    });
                    currentPage.name = TAG.Util.Constants.pages.TOUR_PLAYER;
                }
            };
        }

        assetContainer.css({
            //'max-height': sideBarInfo.height() - info.height() - infoTitle.height() - backButton.height() + 'px',
            'overflow-y': 'visible',
            'margin-top': '4%',
            'scrollbar-face-color': NOBEL_ORANGE_COLOR,
            'scrollbar-arrow-color': 'transparent',
            'scrollbar-track-color': 'transparent',
            'webkit-scrollbar-button': NOBEL_ORANGE_COLOR,
            'webkit-scrollbar-track': NOBEL_ORANGE_COLOR,
            'webkit-scrollbar-track-piece': NOBEL_ORANGE_COLOR,
            'webkit-scrollbar-thumb': NOBEL_ORANGE_COLOR,
            'webkit-scrollbar-corner': NOBEL_ORANGE_COLOR,
        });

        if (!IS_WINDOWS) {
            if (toggleHotspotButton) {
                assetContainer.css('max-height', sideBarInfo.height() - backButton.height() - info.height() + 'px');
            } else {
                assetContainer.css('max-height', sideBarInfo.height() - info.height() - infoTitle.height() + 'px');
            }
        };

        assocMediaToShow && loadQueue.add(mediaClicked(associatedMedia[assocMediaToShow.Identifier]));

        console.log('hotspots: ' + hotspots);
        //load hotspots then hide them
        for (var y = 0; y < hotspots.guids.length; y++) {
            loadQueue.add(showHotspots());
        }
    }

    function initKeywordsSetDrawer(name, fullKeywordSet, artworkKeywords) {
        var drawer = createDrawer((name && name !== '') ? name : 'Untitled Set');
        var keywordsArray = artworkKeywords.split(',');
        var listString = '';
        for (var i = 0; i < keywordsArray.length; i++) {
            if (fullKeywordSet.indexOf(keywordsArray[i]) > -1) {
                listString = listString + ' ' + keywordsArray[i] + ',';
            }
        }
        if (listString !== '') {
            listString = listString.substring(1, listString.length - 1);
            drawer.contents.html(listString);
            drawer.css({ 'word-wrap': 'break-word' });

        } else {
            drawer = null;
        }
        return drawer;
    }


    /**
     * Create a drawer with a disclosure button used to display
     * hotspots, assets, tours. The returned jQuery object has
     * a property called "contents" which should be used to add
     * buttons or messages to the contents of the drawer.
     *
     * @param title, the display title for the drawer
     * @author jastern
     */
    function initlocationHistory() {
        var RLH,
            toggleContainer = $(document.createElement('div')).addClass('drawerToggleContainer');
        //toggle          = $(document.createElement('img')).addClass("drawerPlusToggle")
        //    .attr("src", tagPath+'images/icons/plus.svg');      
        isOpen = false;

        locHistoryToggleSign = $(document.createElement('img')).addClass("drawerPlusToggle")
                .attr("src", tagPath + 'images/icons/plus.svg');
        locHistoryContainer.on('click', function () { toggleLocationOpen(); });

        toggleContainer.append(locHistoryToggleSign);
        locHistoryContainer.append(toggleContainer);

        //panel that slides out when location history is clicked
        RLH = TAG.Util.RLH({
            artwork: doq,
            root: root,
            authoring: false
        });
        locationPanelDiv = RLH.init();
        locationPanelDiv.css({ "width": "0%" });
        locHistoryToggle = $(document.createElement('div'))
            .attr("id", "locHistoryToggle")
            .css({
                "left": '100%',
                'border-top-right-radius': '10px',
                'border-bottom-right-radius': '10px',
                "background-color": "rgba(0,0,0,0.7)",
                "top": "43%",
                "width": "4%",
                "height": "14%",
                "z-index": "100",
                "position": "relative"
            });
        var locHistoryToggleImage = $(document.createElement('img'))
            .attr('src', tagPath + 'images/icons/Close_nobel.svg')
            .attr("id", "locHistoryToggleImage")
            .css({
                'left': '0%',
                "position": "absolute",
                "top": "30%",
                "width": "72%",
                "height": "42%"
            });
        locationPanelDiv.append(locHistoryToggle);
        locHistoryToggle.append(locHistoryToggleImage);

        var maps_timer = new TelemetryTimer();

        locHistoryToggle.on('click', function () { toggleLocationOpen(); });
        function toggleLocationOpen() {
            isOpen ? locationClose() : locationOpen();
        }

        TAG.Telemetry.register(locHistoryContainer, 'click', 'Drawer', function (tobj, evt) {
            if (!isOpen) {
                maps_timer.restart();
                return true;
            }
            tobj.current_artwork = doq.Identifier;
            tobj.toggle = isOpen; //expanded or collapsed
            tobj.drawer_header = "Maps";
            tobj.time_spent = maps_timer.get_elapsed();
        });

        if (TAG.Util.Splitscreen.isOn()) {
            locHistory.css({ "color": TAG.Util.UI.dimColor(PRIMARY_FONT_COLOR, 1.7) });
        }
        function locationOpen() {
            if (!isOpen) {
                if (!TAG.Util.Splitscreen.isOn()) {

                    //close other drawers if any are open
                    root.find(".drawerPlusToggle").attr({
                        src: tagPath + 'images/icons/plus.svg',
                        expanded: false
                    });
                    root.find(".drawerContents").slideUp();

                    //and open RLH
                    locationPanelDiv.css({ display: 'inline' });
                    locHistoryToggleSign.attr("src", tagPath + 'images/icons/minus.svg');
                    isOpen = true;
                    toggler.hide();
                    locationPanelDiv.show();
                    locationPanelDiv.animate({ width: '65%' }, 350, function () { locHistoryToggle.show(); });
                }
            }
        }

        function locationClose() {
            if (isOpen) {
                locHistoryToggleSign.attr("src", tagPath + 'images/icons/plus.svg');
                locHistory.text("Maps");
                locHistoryContainer.css({ "background-color": "transparent" });
                isOpen = false;
                locationPanelDiv.animate({ width: '0%' }, 350, function () { locationPanelDiv.hide(); locHistoryToggle.hide(); toggler.show(); });
            }
        }

        that.locationClose = locationClose

        return locHistoryContainer;
    }

    /**
     * Create a drawer (e.g., for list of related tours or the artwork's description) 
     * @param {String} title            title of the drawer
     * @param {jQuery obj} topContents  an element to be included before the main contents of the drawer
     * @return {jQuery obj}             the drawer
     */
    function createDrawer(title, topContents, assocMediaToShow) {
        var drawer = $(document.createElement('div')).addClass('drawer'),
            drawerHeader = $(document.createElement('div')).addClass('drawerHeader'),
            label = $(document.createElement('div')).addClass('drawerLabel'),
            toggleContainer = $(document.createElement('div')).addClass('drawerToggleContainer'),
            toggle = $(document.createElement('img')).addClass("drawerPlusToggle"),
            drawerContents = $(document.createElement('div')).addClass("drawerContents"),
            i;

        label.addClass('primaryFont');
        label.text(title);
        label.css({
            'color': '#' + PRIMARY_FONT_COLOR,
            //'font-family': FONT
        });
        toggle.attr({
            src: tagPath + 'images/icons/plus.svg',
            expanded: true
        });

        drawer.append(drawerHeader);
        drawerHeader.append(label);
        //drawerHeader.append(toggleContainer);
        //toggleContainer.append(toggle);

        drawer.append(drawerContents);
        topContents && drawerContents.append(topContents);

        //var drawerToggle = function (evt) {
        //    if (toggle.attr('expanded') !== 'true') {
        //        root.find(".drawerPlusToggle").attr({
        //            src: tagPath + 'images/icons/plus.svg',
        //            expanded: false
        //        });

        //        root.find(".drawerContents").slideUp();

        //        toggle.attr({
        //            src: tagPath + 'images/icons/minus.svg',
        //            expanded: true
        //        });
        //    } else {
        //        toggle.attr({
        //            src: tagPath + 'images/icons/plus.svg',
        //            expanded: false
        //        });

        //    }

        //    drawerContents.slideToggle();
        //    isOpen && that.locationClose()
        //}

        //have the toggler icon minus when is is expanded, plus otherwise.
        //drawerHeader.on('click', drawerToggle);
        TAG.Telemetry.register(drawerHeader, 'click', 'Drawer', function (tobj) {
            tobj.current_artwork = doq.Identifier;
            tobj.toggle = toggle.attr("expanded"); //expanded or collapsed
            tobj.drawer_header = drawerHeader.text();
        });
        drawer.contents = drawerContents;
        //if (assocMediaToShow && title === 'Associated Media') {
            drawerHeader.click();
            //drawer.drawerToggle = drawerToggle;
        //}
        return drawer;
    }

    /**
     * Return art viewer root element
     * @method
     * @return {jQuery obj}    root jquery object
     */
    function getRoot() {
        return root;
    }

    function getArt() {
        return annotatedImage;
    }

    

    /**
     * Make the map for location History.
     * @method makeMap
     * @param {Function} callback     function to be called when map making is complete
    */
    function makeMap(callback) {
        var mapOptions,
            viewOptions;

        mapOptions = {
            credentials: "AkNHkEEn3eGC3msbfyjikl4yNwuy5Qt9oHKEnqh4BSqo5zGiMGOURNJALWUfhbmj",
            mapTypeID: Microsoft.Maps.MapTypeId.road,
            showScalebar: true,
            enableClickableLogo: false,
            enableSearchLogo: false,
            showDashboard: true,
            showMapTypeSelector: false,
            zoom: 2,
            center: new Microsoft.Maps.Location(20, 0)
        };

        viewOptions = {
            mapTypeId: Microsoft.Maps.MapTypeId.road,
        };

        map = new Microsoft.Maps.Map(document.getElementById('lpMapDiv'), mapOptions);
        map.setView(viewOptions);

        callback && callback();
    }
};

TAG.Layout.ArtworkViewer.default_options = {
    catalogState: {},
    doq: null,
    split: 'L',
};


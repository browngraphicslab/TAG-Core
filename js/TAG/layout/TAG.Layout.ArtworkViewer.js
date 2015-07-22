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
        info = root.find('#info'),
        loadingArea = root.find('#loadingArea'),
        locHistory = root.find('#locationHistory'),
        locHistoryContainer = root.find('#locationHistoryContainer'),
        locationPanelDiv = null,
        locHistoryToggle = null,
        locHistoryToggleSign = null,
        isOpen = false,
        that = this,
        locked = TAG.Worktop.Database.getLocked(),     //Check for locked
        // constants
        FIX_PATH = TAG.Worktop.Database.fixPath,
        PRIMARY_FONT_COLOR = options.primaryFontColor ? options.primaryFontColor : TAG.Worktop.Database.getMuseumPrimaryFontColor(),
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
        isNobelWill = options.isNobelWill || false,
        isImpactMap = options.isImpactMap,
        smallPreview        = options.smallPreview,
        titleIsName = options.titleIsName,
        NOBEL_WILL_COLOR = 'rgb(189,125,13)',


        // misc initialized vars  
        locHistoryActive = false,                   // whether location history is open
        locClosing = false,                   // whether location history is closing
        locOpening = false,                   // whether location history is opening
        drawers = [],                      // the expandable sections for assoc media, tours, description, etc...
        mediaHolders = [],                      // array of thumbnail buttons
        loadQueue = TAG.Util.createQueue(),  // async queue for thumbnail button creation, etc
        screenWidth = $('#tagRoot').width(),      // Width of entire tag screen (for split screen styling)
        telemetry_timer = new TelemetryTimer(),       //Timer for telemetry

        //nobel will variables
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
        nextPageDoq,
        nextPageAssociatedMedia,
        prevPageDoq,
        prevPageAssociatedMedia,


        // misc uninitialized vars
        keywordSets,
        locationList,                               // location history data
        customMapsLength,
        map,                                        // Bing Maps map for location history
        annotatedImage,                             // an AnnotatedImage object
        associatedMedia,                            // object of associated media objects generated by AnnotatedImage
        manipulate; // Manipulation method


    // get things rolling if doq is defined (it better be)
    doq && init();

    return {
        getRoot: getRoot,
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

        sideBar.css('visibility', 'hidden')

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
                try { // TODO figure out why loadDoq sometimes causes a NetworkError (still happening?)
                    annotatedImage.openArtwork(doq);
                } catch (err) {
                    debugger;
                    doNothing(err); // TODO if we hit a network error, show an error message
                }
                if (isNobelWill !== true) {
                    TAG.Util.Splitscreen.setViewers(root, annotatedImage);
                    initSplitscreen();
                }
                createSeadragonControls();
                TAG.Worktop.Database.getMaps(doq.Identifier, function (mps) {
                    customMapsLength = mps.length;
                    makeSidebar();
                });

                if (isNobelWill === true) {
                    nobelWillInit();
                }

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

    /**
     * 
     * simply initializes everything the nobel will special case needs
     */
    function nobelWillInit() {
        $("#toggler").hide();
        $("#toggler").off('click');
        $("#seadragonManipContainer").off('click');
        $("#seadragonManipContainer").hide();
        $("#sideBarSections").hide();
        $("#sideBarSections").off('click');
        $("#sideBar").css({
            "width": '40%',
            'background-color': 'rgb(102,102,102)'
        });
        root.css("background-color", 'rgb(60,60,60)')
        var titleDiv = $(document.createElement('div'))
        titleDiv.css({
            'position': 'absolute',
            'font-size': '1.4em',
            'color': 'black',
            'font-weight': 'bold',
            'width': '85%',
            'text-align': 'center',
            'height': '10%',
            'top': '2%',
            'left': '15%'
        }).text(doq.Name);
        titleDiv.attr({
            id: "titleDiv"
        })
        sideBar.append(titleDiv);
        for (var i = 1; i < 5; i++) {
            if (doq.Name.indexOf(i) > -1) {
                pageNumber = i;
                break;
            }
        }
        switch (pageNumber) {
            case 1:
                associatedMediaNobelKeywords = [['Alfred Bernhard', 0], ['Robert Nobel', 1], ['Emanuel Nobel', 2], ['Sofie Kapy von Kapivar', 5], ['Alarik Liedbeck', 6]]
                hardcodedHotspotSpecs = [[63.5, 15, 17, 3.5], [66.5, 30, 11, 3], [61, 34.5, 12.5, 2.5], [47, 54, 23.5, 3], [47.5, 65.4, 18.5, 3]]

                leftTextArray = [
                    ['I, the undersigned, Alfred Bernhard Nobel, do hereby, after mature deliberation, declare the following to be my last Will and Testament with respect to such property as may be left by me at the time of my death:', 17],
                    ['To my nephews, Hjalmar and Ludvig Nobel, the sons of my brother Robert Nobel, I bequeath the sum of Two Hundred Thousand Crowns each;', 28.5],
                    ['To my nephew Emanuel Nobel, the sum of Three Hundred Thousand, and to my niece Mina Nobel, One Hundred Thousand Crowns;', 35.5],
                    ['To my brother Robert Nobel’s daughters, Ingeborg and Tyra, the sum of One Hundred Thousand Crowns each;', 42.5],
                    ['Miss Olga Boettger, at present staying with Mrs Brand, 10 Rue St Florentin, Paris, will receive One Hundred Thousand Francs;', 48.5],
                    ['Mrs Sofie Kapy von Kapivar, whose address is known to the Anglo-Oesterreichische Bank in Vienna, is hereby entitled to an annuity of 6000 Florins Ö.W. which is paid to her by the said Bank, and to this end I have deposited in this Bank the amount of 150,000 Fl. in Hungarian State Bonds;', 55],
                    ['Mr Alarik Liedbeck, presently living at 26 Sturegatan, Stockholm, will receive One Hundred Thousand Crowns;', 65.5],
                    ['Miss Elise Antun, presently living at 32 Rue de Lubeck, Paris, is entitled to an annuity of Two Thousand Five Hundred Francs. In addition, Forty Eight Thousand Francs owned by her are at present in my custody, and shall be refunded;', 71.5],
                    ['Mr Alfred Hammond, Waterford, Texas, U.S.A. will receive Ten Thousand Dollars;', 81.5],
                    ['The Misses Emy and Marie Winkelmann,', 87]
                ]
                sliderPositions = [
                    [14, 13.5],
                    [27.5, 7],
                    [34.5, 7.5],
                    [42, 5],
                    [46.5, 7.5],
                    [53.5, 12],
                    [65, 5],
                    [69.5, 12],
                    [80.5, 5.5],
                    [85, 5]
                ]
                break;
            case 2:
                associatedMediaNobelKeywords = [['Georges Fehrenbach', 4], ['estate', 6], ['fund', 6], ['greatest benefit to mankind', 6], ['physics', 6], ['chemical', 6], ['physiology or medicine', 6], ['literature', 6]];
                hardcodedHotspotSpecs = [[53, 39.75, 14, 3.75], [75.5, 58, 5, 3.5], [46.5, 66, 4.5, 3.5], [64.5, 70.5, 9, 3], [75.25, 72, 6, 3], [69, 76.75, 13, 2.5], [62.5,81,20,2.75], [65.5, 83.25, 16.25, 2.5]]

                leftTextArray = [
                    ['Potsdamerstrasse, 51, Berlin, will receive Fifty Thousand Marks each;', 8.5],
                    ['Mrs Gaucher, 2 bis Boulevard du Viaduc, Nimes, France will receive One Hundred Thousand Francs;', 13],
                    ['My servants, Auguste Oswald and his wife Alphonse Tournand, employed in my laboratory at San Remo, will each receive an annuity of One Thousand Francs;', 19.5],
                    ['My former servant, Joseph Girardot, 5, Place St. Laurent, Châlons sur Saône, is entitled to an annuity of Five Hundred Francs, and my former gardener, Jean Lecof, at present with Mrs Desoutter, receveur Curaliste, Mesnil, Aubry pour Ecouen, S.& O., France, will receive an annuity of Three Hundred Francs;', 27],
                    ['Mr Georges Fehrenbach, 2, Rue Compiègne, Paris, is entitled to an annual pension of Five Thousand Francs from January 1, 1896 to January 1, 1899, when the said pension shall discontinue;', 40.5],
                    ['A sum of Twenty Thousand Crowns each, which has been placed in my custody, is the property of my brother’s children, Hjalmar, Ludvig, Ingeborg and Tyra, and shall be repaid to them.', 50],
                    ['The whole of my remaining realizable estate shall be dealt with in the following way: the capital, invested in safe securities by my executors, shall constitute a fund, the interest on which shall be annually distributed in the form of prizes to those who, during the preceding year, shall have conferred the greatest benefit to mankind. The said interest shall be divided into five equal parts, which shall be apportioned as follows: one part to the person who shall have made the most important discovery or invention within the field of physics; one part to the person who shall have made the most important chemical discovery or improvement; one part to the person who shall have made the most important discovery within the domain of physiology or medicine; one part to the person who shall have produced in the field of literature', 59]
                ]
                /*
                ['Mr Alarik Liedbeck, presently living at 26 Sturegatan, Stockholm, will receive One Hundred Thousand Crowns;', 66],
                ['Miss Elise Antun, presently living at 32 Rue de Lubeck, Paris, is entitled to an annuity of Two Thousand Five Hundred Francs. In addition, Forty Eight Thousand Francs owned by her are at present in my custody, and shall be refunded;', 71.5],
                ['Mr Alfred Hammond, Waterford, Texas, U.S.A. will receive Ten Thousand Dollars;', 81.5],
                ['The Misses Emy and Marie Winkelmann,', 87]
            ]*/
                sliderPositions = [
                    [7.75, 5.75],
                    [12, 5.5],
                    [18.5, 8],
                    [24.5, 16],
                    [39, 10.75],
                    [48.5, 10.75],
                    [58.25, 28.5]
                ]/*
                            [65, 5],
                            [69.5, 12],
                            [80.5, 5.5],
                            [85, 5]
                        ]*/
                break;

        }
        for (var i = 0; i < leftTextArray.length; i++) {
            var tempText = $(document.createElement('div'));
            tempText.css({
                'position': 'absolute',
                'background-color': "transparent",
                'left': '7.5%',
                'width': '85%',
                'color': 'black',
                'height': '25%',
                'top': leftTextArray[i][1] + '%',
                'font-size': '.6em',
            }).text(leftTextArray[i][0])
            tempText.attr('class', 'textChunkDiv');
            sideBar.append(tempText);
            textDivArray.push(tempText);
        }
        showNobelInitialPopup(
            function () {
                var leftArrow = $(document.createElement('img'));
                var rightArrow = $(document.createElement('img'));
                leftArrow.attr({
                    id: 'leftPageArrow',
                    src: tagPath + 'images/icons/left_nobel_icon.svg'
                })
                rightArrow.attr({
                    id: 'rightPageArrow',
                    src: tagPath + 'images/icons/right_nobel_icon.svg'
                })
                leftArrow.css({
                    'position': 'absolute',
                    'background-color': 'transparent',
                    'width': '6%',
                    'bottom': '20px',
                    'left': "40%",
                    'z-index': '88888889'
                });
                leftArrow.click(function () {
                    goPrevPage();
                })
                rightArrow.css({
                    'position': 'absolute',
                    'width': '6%',
                    'background-color': 'transparent',
                    'bottom': '20px',
                    'left': "78%",
                    'z-index': '88888889'
                }).click(nextPage)

                var arrowWidth = rightArrow.width();
                rightArrow.css('height', arrowWidth + '%');
                leftArrow.css('height', arrowWidth + '%');

                root.append(rightArrow);
                root.append(leftArrow);

                if (pageNumber === 4) {
                    rightArrow.hide();
                }
                else {
                    TAG.Worktop.Database.getDoq(getGuidOfPage(pageNumber + 1), function (c) { nextPageDoq = c })
                    TAG.Worktop.Database.getAssocMediaTo(getGuidOfPage(pageNumber + 1), function (c) { nextPageAssociatedMedia = c })
                }
                if (pageNumber === 1) {
                    leftArrow.hide();
                }
                else {
                    TAG.Worktop.Database.getDoq(getGuidOfPage(pageNumber - 1), function (c) { prevPageDoq = c })
                    TAG.Worktop.Database.getAssocMediaTo(getGuidOfPage(pageNumber - 1), function (c) { prevPageAssociatedMedia = c })
                }

                var sliderBarInnerds = $(document.createElement('div'));
                sliderBarInnerds.css({
                    'position': 'absolute',
                    'background-color': "rgb(254,161,0)",
                    'opacity': '.4',
                    'left': '45.4%',
                    'width': '54.6%',
                    'height': '100%',
                })
                sliderBar = $(document.createElement('div'));
                sliderBar.attr('id', 'sliderBar');
                sliderBar.append(sliderBarInnerds);
                sliderBar.css({
                    'position': 'absolute',
                    'background-color': 'transparent',
                    'border': '3px solid rgb(254,161,0)',
                    'border-radius': '12px',
                    'left': '1%',
                    'width': '86%',
                    'height': '10%',
                    'z-index': '9999999'
                })

                var up = $(document.createElement('img'))
                var down = $(document.createElement('img'))
                up.attr({
                    id: 'upIcon',
                    src: tagPath + 'images/icons/up_nobel_icon.svg'
                })
                up.css({
                    'position': 'absolute',
                    'background-color': "transparent",
                    'max-height': '50px',
                    'max-width': '50px',
                    'height': '50%',
                    'top': '0px',
                    'right': '0px'
                }).click(prevChunk)
                down.attr({
                    id: 'downIcon',
                    src: tagPath + 'images/icons/down_nobel_icon.svg'
                })
                down.css({
                    'position': 'absolute',
                    'background-color': "transparent",
                    'max-height': '50px',
                    'max-width': '50px',
                    'height': '50%',
                    'bottom': '0px',
                    'right': '0px'
                }).click(nextChunk)

                sliderBar.append(down)
                sliderBar.append(up)
                root.append(sliderBar);

                for (var i = 0; i < associatedMedia.guids.length; i++) {
                    associatedMedia[associatedMedia.guids[i]].create();
                    associatedMedia[associatedMedia.guids[i]].toggle();
                    associatedMedia[associatedMedia.guids[i]].toggle();
                }


                


                makeNobelHotspots(associatedMediaNobelKeywords, hardcodedHotspotSpecs)


                setChunkNumber(0, null, 1);

                var j = 1
                var test = function () {
                    setTimeout(function () {
                        setChunkNumber(j, test);
                        j = (j + 1) % textDivArray.length;
                    }, 2500)
                }
                //test();
            }
        )
    }
    /*
    *
    *goes to the previous nobel will page
    */
    function goPrevPage() {
        if (isNobelWill === true) {
            doq = prevPageDoq;
            assocMediaToShow = prevPageAssociatedMedia;
            sliderBar.remove();
            $("#upIcon").remove();
            $("#downIcon").remove();
            $("#rightPageArrow").remove();
            $("#leftPageArrow").remove();
            $(".textChunkDiv").remove();
            $("#titleDiv").remove();
            $("#annotatedImageAssetCanvas").remove();
            $(".nobelHotspot").remove();
            sliderBar.die();
            $("#upIcon").die();
            $("#downIcon").die();
            $("#rightPageArrow").die();
            $("#leftPageArrow").die();
            $(".textChunkDiv").die();
            $("#titleDiv").die();
            $("#annotatedImageAssetCanvas").die();
            $(".nobelHotspot").die();
            textDivArray = [];
            init();
        }
    }

    /*
    *
    *goes to the next nobel will page
    */
    function nextPage() {
        if (isNobelWill === true && nextPageDoq && nextPageAssociatedMedia) {
            //annotatedImage && annotatedImage.unload();
            doq = nextPageDoq;
            assocMediaToShow = nextPageAssociatedMedia;
            sliderBar.remove();
            $("#upIcon").remove();
            $("#downIcon").remove();
            $("#rightPageArrow").remove();
            $("#leftPageArrow").remove();
            $(".textChunkDiv").remove();
            $("#titleDiv").remove();
            $("#annotatedImageAssetCanvas").remove();
            $(".nobelHotspot").remove();
            sliderBar.die();
            $("#upIcon").die();
            $("#downIcon").die();
            $("#rightPageArrow").die();
            $("#leftPageArrow").die();
            $(".textChunkDiv").die();
            $("#titleDiv").die();
            $("#annotatedImageAssetCanvas").die();
            $(".nobelHotspot").die();
            textDivArray = [];
            init();
        }
    }
    
    /*
    *returns the guid of the page number passed in
    * @param pageNum        the page number integer 1-4
    */
    function getGuidOfPage(pageNum) {
        if (isNobelWill === true && pageNum > 0 && pageNum < 5) {
            switch (pageNum) {
                case 1:
                    return "f4b858e5-130c-4cd9-b4f9-45502fed8123"
                case 2:
                    return "eada3ca7-27f1-42e1-98e6-ea79d7438f36"
                case 3:
                    return "fb68c9bd-31d2-4f8f-941c-e460e9aed8a3"
                case 4:
                    return "722bc6dc-e2dc-4213-a82b-4767a6ffb05c"
            }
        }
    }
    /*
    * parses through associated media and associated them with a hotspot.  also creates the hotspot div
    * @param names array[string]        the array of strings that identify the associated media by name
    */
    function makeNobelHotspots(names, hotSpotInfo) {
        nobelHotspots = [];
        var assocMediaOrder = []
        for (var i = 0; i < names.length; i++) {
            for (var k = 0; k < associatedMedia.guids.length; k++) {
                if (associatedMedia[associatedMedia.guids[k]].doq.Name.indexOf(names[i][0]) > -1) {
                    assocMediaOrder.push(associatedMedia[associatedMedia.guids[k]])
                }
            }
        }
        for (var i = 0; i < textDivArray.length; i++) {
            nobelHotspots.push([]);
        }
        for (var i = 0; i < assocMediaOrder.length; i++) {
            var div = $(document.createElement('div'));
            div.css({
                'position': 'absolute',
                'background-color': 'rgb(200,20,20)',
                'opacity': '.3',
                'border': '2px solid red',
                'font-size' : '.6em',
                'border-radius': '5px',
                'left': hotSpotInfo[i][0] + '%',
                'top': hotSpotInfo[i][1] + '%',
                'width': hotSpotInfo[i][2] + '%',
                'height': hotSpotInfo[i][3] + '%',
                'z-index': '99999999'
            })
            div.attr({
                id: assocMediaOrder[i].doq.Identifier,
                class: 'nobelHotspot'
            }).hide();

            div.click(function () {
                associatedMedia[this.id].create();
                associatedMedia[this.id].toggle();
                /*
                for (var l = 0; l < nobelHotspots.length; l++) {
                    if (nobelHotspots[l].length){
                        for(var spot = 0;spot<nobelHotspots[l].length;spot++){
                            if (this.id === nobelHotspots[l][spot][0][0].id) {
                                nobelHotspots[l][spot][1].show();
                            }
                        }
                        
                    }
                }*/
            })

            root.append(div);
            nobelHotspots[names[i][1]].push([div, assocMediaOrder[i]]);
        }
    }
    /**
    * decrements the chunk number
    * @param function callback     function to be called upon completion
    */
    function prevChunk(callback) {
        if (isNobelWill === true) {
            setChunkNumber(chunkNumber - 1, callback ? callback : null)
        }
    }

    /**
    * incremenets the chunk number
    * @param function callback     function to be called upon completion
    */
    function nextChunk(callback) {
        if (isNobelWill === true) {
            setChunkNumber(chunkNumber + 1, callback ? callback : null)
        }
    }

    /**
    * set the current chunk, highlights the right text, moves the sliderbar to the right spot, hides or shows the up and down arrows, clears the associated media; and enables the right associated media
    * @param double chunk        the chunk number to be set
    * @param function callback     function to be called upon completion
    * @param int duration          for the excpetionally picky a duration of animation can be specified in milliseconds
    */
    function setChunkNumber(chunk, callback, duration) {
        if (isNobelWill === true && chunk >= 0 && chunk < textDivArray.length) {
            for (var j = 0; j < associatedMedia.guids.length; j++) {
                associatedMedia[associatedMedia.guids[j]].hide();
            }
            for (var i = 0; i < textDivArray.length; i++) {
                if (i !== chunk) {
                    fadeText(textDivArray[i], 'black', null, duration || 1000)
                }
            }
            for (var k = 0; k < nobelHotspots.length; k++) {
                if (k === chunk) {
                    for (var vis = 0; vis < nobelHotspots[chunk].length; vis++) {
                        nobelHotspots[chunk][vis][0].fadeIn(duration || 1000, 'easeInOutQuart');
                    }
                }
                else {
                    for (var vis = 0; vis < nobelHotspots[k].length; vis++) {
                        nobelHotspots[k][vis][0].fadeOut(duration || 1000, 'easeInOutQuart');
                    }
                }
            }
            fadeText(textDivArray[chunk], 'white', null, duration || 1000);
            if (chunk === 0) {
                $("#upIcon").fadeOut(duration || 1000, 'easeInOutQuart');
            }
            else {
                $("#upIcon").fadeIn(duration || 1000, 'easeInOutQuart');
            }
            if (chunk === textDivArray.length - 1) {
                $("#downIcon").fadeOut(duration || 1000, 'easeInOutQuart');
            }
            else {
                $("#downIcon").fadeIn(duration || 1000, 'easeInOutQuart');
            }
            moveSliderBar(sliderPositions[chunk][0] / 100, sliderPositions[chunk][1] / 100, callback ? callback : null, duration || 1000);

            //TODO :  add enabling associated media
            if (associatedMediaNobelLocations) {
                for (var i = 0; i < associatedMediaNobelLocations.length; i++) {
                    associatedMediaNobelLocations[i] = false;
                }
            }
            chunkNumber = chunk;
        }

    }
    /**
    * fades the text color to the passed in color on the passed in div
    * @param div textDiv           the div to change color
    * @param finalColor string      the color the change into
    * @param function callback     function to be called upon completion
    * @param int duration          for the excpetionally picky a duration of animation can be specified in milliseconds
    */
    function fadeText(textDiv, finalColor, callback, duration) {
        if (isNobelWill === true) {
            textDiv.animate({ color: finalColor }, duration || 1000, 'easeInOutQuart', callback ? callback : null);
        }
    }

    /**
     * moves the top of the slider bar to a location on the screen in terms of percent Y of root page
     * @param double percentY       the fraction of the height the slider bar will be moved to, between 0 and 1 (except 1 would put the bar below the bottom of the screen)
     * @param double height         the percent of the root page screen in height the bar should be tall
     * @param function callback     function to be called upon completion
     * @param int duration          for the excpetionally picky a duration of animation can be specified in milliseconds
     */
    function moveSliderBar(y, height, callback, duration) {
        if (isNobelWill === true) {
            y *= 100;
            height *= 100;
            sliderBar.animate({ top: y + '%', height: height + '%' }, duration || 1000, 'easeInOutQuart', callback ? callback : null);
        }
    }

    /**
     * Initializes the popup informative window before the nobel will exploration begins
     * @param function onClose      the function called after the window is closed
     */

    function showNobelInitialPopup(onClose) {
        if (pageNumber > 1) {
            onClose && onClose()
            return;
        }
        var popup = $(document.createElement('div'))
        popup.css({
            'display': 'block',
            'position': 'absolute',
            'opacity': '1',
            'border-radius': '18px',
            'border-color': NOBEL_WILL_COLOR,
            'border': '8px solid ' + NOBEL_WILL_COLOR,
            'width': '60%',
            'height': '50%',
            'top': '25%',
            'left': '20%',
            'background-color': 'black',
            'z-index': '99999999'
        })
        var popupTopBar = $(document.createElement('div'));
        var popupLeftBar = $(document.createElement('div'));
        var popupRightBar = $(document.createElement('div'));
        var popupLeftTopBar = $(document.createElement('div'));
        var popupLeftBottomBar = $(document.createElement('div'));
        var nobelIcon = $(document.createElement('img'));
        var closeX = $(document.createElement('img'));

        nobelIcon.attr({
            src: tagPath + 'images/icons/nobel_icon.png',
            id: 'nobelIcon'
        })
        nobelIcon.css({
            'position': 'absolute',
            'width': '80%',
            'left': '20%',
            'top': '5%'
        })
        popupRightBar.append(nobelIcon);
        popupTopBar.append(closeX);
        closeX.attr({
            src: tagPath + 'images/icons/x.svg',
            id: 'closeX'
        })
        closeX.css({
            'left': '94.85%',
            'position': 'absolute',
            'top': '15%',
            'height': '54%'
        })
        popupTopBar.css({
            'height': '15%',
            'position': 'absolute',
            'width': '100%',
        })

        popupLeftBar.css({
            'height': '85%',
            'position': 'absolute',
            'width': '65%',
            'top': '15%',
            'color': 'white'
        })

        popupRightBar.css({
            'height': '85%',
            'position': 'absolute',
            'width': '35%',
            'top': '15%',
            'left': '60%',
        })

        popupLeftTopBar.css({
            'height': '18%',
            'position': 'absolute',
            'width': '92%',
            'left': '8%',
            'font-size': '1.25em',
            'font-weight': 'bold',
            'color': 'white'
        }).text("ALFRED NOBEL'S WILL")

        popupLeftBottomBar.css({
            'top': ' 18%',
            'height': '82%',
            'position': 'absolute',
            'left': '8%',
            'width': '92%',
            'font-size': '.82em',
            'color': 'white'
        }).text('Alfred Nobel was a wealthy inventor and industrialist who \nlived in the 19th century. During his lifetime he built up a \nvast fortune. His handwritten will is four pages long and \nwritten in Swedish; in it he expresses a wish to let the majority of his realizable estate form the foundation for \na prize to those who "shall have conferred the greatest \nbenefit to mankind” in the fields of physics, chemistry, \nmedicine, literature and peace work.')

        var temp = $(TAG.Util.UI.blockInteractionOverlay(.3));//add blocking div to stop all interaction
        temp.css({
            "display": 'block',
            'z-index': '9999999'
        })
        popupLeftBar.append(popupLeftTopBar);
        popupLeftBar.append(popupLeftBottomBar);
        popup.append(popupTopBar);
        popup.append(popupLeftBar);
        popup.append(popupRightBar);
        root.append(temp)
        root.append(popup)
        closeX.click(function () {
            temp.remove();
            popup.remove();
            if (onClose) {
                onClose();
            }
        })

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
                slideButton.html("Show Controls");
            } else {
                top = '-' + containerHeight + 'px';
                slideButton.html('Hide Controls');
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

        sideBarInfo.css({
            'height': sideBarSections.height() - 25 + 'px'
        });
        if (locked !== doq.Identifier) {
            backButton.attr('src', tagPath + 'images/icons/Back.svg');
        } else {
            backButton.hide();
        }

        togglerImage.attr("src", tagPath + 'images/icons/Close.svg');
        infoTitle.text(doq.Name);
        infoArtist.text(doq.Metadata.Artist);
        infoYear.text(doq.Metadata.Year);
        infoTitle.css({
            'color': '#' + PRIMARY_FONT_COLOR,
            //'font-family': FONT
        });

        infoArtist.css({
            'color': '#' + PRIMARY_FONT_COLOR,
            //'font-family': FONT
        });

        infoYear.css({
            'color': '#' + PRIMARY_FONT_COLOR,
            //'font-family': FONT
        });
        locHistory && locHistory.css({
            'color': '#' + PRIMARY_FONT_COLOR,
            //'font-family': FONT
        });

        // splitscreen
        if (root.data('split') === 'R' && TAG.Util.Splitscreen.isOn()) {
            sideBar.css({
                'left': 'auto',
                'right': '0%'
            });
            toggler.css({
                left: '-12%',
                'border-top-left-radius': '3.5px',
                'border-top-right-radius': '0px',
                'border-bottom-right-radius': '0px',
                'border-bottom-left-radius': '3.5px'
            });
            togglerImage.attr('src', tagPath + 'images/icons/Open.svg')
                        .css('right', '0%');
        } else {
            togglerImage.css('left', '0%');
        }
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
                togglerImage.attr('src', tagPath + 'images/icons/' + ((!!isBarOpen) ^ (!isLeft) ? 'Close.svg' : 'Open.svg'));
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

        TAG.Util.UI.setUpBackButton(backButton, goBack);
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
            TAG.Util.removeYoutubeVideo();
            var collectionsPage,
                collectionsPageRoot;
            backButton.off('click');

            //going back from will goes to splash screen
            if (isNobelWill){
                TAG.Layout.StartPage(null, function (page) {
                    TAG.Util.UI.slidePageRight(page);
                });
                return;
            } 

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
                titleIsName: titleIsName
            });
            //if (root.data('split') === 'R') {

            //}
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


        // add more information for the artwork if curator added in the authoring mode
        for (item in doq.Metadata.InfoFields) {
            if (doq.Metadata.InfoFields.hasOwnProperty(item)) {
                fieldTitle = item;
                fieldValue = doq.Metadata.InfoFields[item];
                infoCustom = $(document.createElement('div'));
                infoCustom.addClass('infoCustom');
                infoCustom.text(fieldTitle + ': ' + fieldValue);
                infoCustom.css({
                    'color': '#' + PRIMARY_FONT_COLOR,
                    //'font-family': FONT
                });
                infoCustom.appendTo(info);
            }
        }

        // make sure the info text fits in the div (TODO is this necessary?)
        TAG.Util.fitText(info, 1.1);

        // create drawers
        if (doq.Metadata.Description) {
            descriptionDrawer = createDrawer("Description");
            descriptionDrawer.contents.html(Autolinker.link(doq.Metadata.Description.replace(/\n/g, "<br />"), { email: false, twitter: false }));
            if (IS_WINDOWS) {
                var links = descriptionDrawer.find('a');
                links.each(function (index, element) {
                    $(element).replaceWith(function () {
                        return $.text([this]);
                    });
                });
            }
            assetContainer.append(descriptionDrawer);
            currBottom = descriptionDrawer.height();
        }

        if (keywordSets && keywordSets[0] && keywordSets[0].shown && doq.Metadata.KeywordsSet1 && doq.Metadata.KeywordsSet1 !== '') {
            keywordsSet1Drawer = initKeywordsSetDrawer(keywordSets[0].name, keywordSets[0].keywords, doq.Metadata.KeywordsSet1);
            if (keywordsSet1Drawer) {
                assetContainer.append(keywordsSet1Drawer);
                currBottom += keywordsSet1Drawer.height();
            }
        }

        if (keywordSets && keywordSets[1] && keywordSets[1].shown && doq.Metadata.KeywordsSet2 && doq.Metadata.KeywordsSet2 !== '') {
            keywordsSet2Drawer = initKeywordsSetDrawer(keywordSets[1].name, keywordSets[1].keywords, doq.Metadata.KeywordsSet2);
            if (keywordsSet2Drawer) {
                assetContainer.append(keywordsSet2Drawer);
                currBottom += keywordsSet2Drawer.height();
            }
        }

        if (keywordSets && keywordSets[2] && keywordSets[2].shown && doq.Metadata.KeywordsSet3 && doq.Metadata.KeywordsSet3 !== '') {
            keywordsSet3Drawer = initKeywordsSetDrawer(keywordSets[2].name, keywordSets[2].keywords, doq.Metadata.KeywordsSet3);
            if (keywordsSet3Drawer) {
                assetContainer.append(keywordsSet3Drawer);
                currBottom += keywordsSet3Drawer.height();
            }
        }

        if (customMapsLength > 0 || locationList.length > 0) {
            locHistoryButton = initlocationHistory();
            assetContainer.append(locHistoryButton);
            currBottom += locHistoryButton.height();
        } else {
            root.find('#locationHistoryContainer').remove();
        }

        var drawerToggleFn = null;
        if (associatedMedia.guids.length > 0) {
            for (i = 0; i < associatedMedia.guids.length; i++) {
                curr = associatedMedia[associatedMedia.guids[i]];
                if (curr.linq.Metadata.Type === 'Layer') {
                    if (!xfadeDrawer) {
                        xfadeSlider = $(document.createElement('div'))
                            .attr('id', 'xfadeSlider');
                        xfadeSlider.css({
                            border: '2px solid rgba(255,255,255,0.8)',
                            height: '25px',
                            left: '10%',
                            margin: '5px 0px 5px 0px',
                            position: 'relative',
                            width: '80%'
                        });
                        xfadeSliderPoint = $(document.createElement('div'))
                            .attr('id', 'xfadeSliderPoint');
                        xfadeSliderPoint.css({
                            'background-color': 'rgba(255,255,255,0.8)',
                            height: '100%',
                            left: '0%',
                            position: 'absolute',
                            top: '0%',
                            width: '50%'
                        });
                        xfadeSlider.append(xfadeSliderPoint);

                        var updateOverlay = function (evt) {
                            if (isFading) {
                                var leftPercent = (evt.clientX - xfadeSlider.offset().left) / xfadeSlider.width();
                                xfadeSliderPoint.css('width', Math.min(leftPercent * 100, 100) + '%');
                                root.find('.xfadeImg').css('opacity', leftPercent);
                            }
                        }

                        xfadeSlider.on('mousedown', function (evt) {
                            isFading = true;
                            updateOverlay(evt)
                        });
                        xfadeSlider.on('mousemove', function (evt) {
                            updateOverlay(evt)
                        });

                        root.on('mouseup', function (evt) {
                            isFading = false;
                        });

                        xfadeDrawer = createDrawer('Layers', xfadeSlider);
                    }
                    loadQueue.add(createMediaButton(xfadeDrawer.contents, curr));
                } else {

                    if (!mediaDrawer) {
                        mediaDrawer = createDrawer('Associated Media', null, assocMediaToShow);
                        if (mediaDrawer.drawerToggle) {
                            drawerToggleFn = mediaDrawer.drawerToggle;
                        }
                    }

                    loadQueue.add(createMediaButton(mediaDrawer.contents, curr));
                }
            }
            if (mediaDrawer) {
                assetContainer.append(mediaDrawer);
                currBottom += mediaDrawer.height();
            }
            if (xfadeDrawer) {
                assetContainer.append(xfadeDrawer);
                currBottom += xfadeDrawer.height();
            }
            if (drawerToggleFn && (typeof drawerToggleFn === "function")) {
                loadQueue.add(drawerToggleFn);
            }
        }

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
                var toAppend = TAG.Util.Artwork.createThumbnailButton({
                    title: TAG.Util.htmlEntityDecode(media.doq.Name),
                    year: TAG.Util.htmlEntityDecode(media.doq.Year || ""),
                    handler: mediaClicked(media),
                    buttonClass: 'mediaButton',
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
        function mediaClicked(media) {
            //var toggleFunction = toggleLocationPanel;
            if(isNobelWill === true){
                return function(){return};
            }
            return function (evt) {
                evt && evt.stopPropagation();
                locHistoryActive = true;
                media.create(); // returns if already created
                media.toggle();
                /**
                if (isImpactMap) {
                    media.hide();
                }
                **/
                if (locked !== doq.Identifier) {
                    TAG.Util.IdleTimer.restartTimer();
                }
                (media.linq.Metadata.Type !== 'Layer') && media.mediaManipPreprocessing();   // Set the newly opened media as active for manipulation

                media.pauseReset();
                // toggleLocationPanel();
            };
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

            if (relatedTours.length > 0) {
                tourDrawer = createDrawer('Tours');
                assetContainer.append(tourDrawer);
                currBottom += tourDrawer.height();

                tourDrawer.contents.text('');
                for (i = 0; i < relatedTours.length; i++) {
                    loadQueue.add(createTourButton(tourDrawer.contents, relatedTours[i]));
                }
            }

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

        /*************************************************************************
         * MINIMAP CODE. bleveque: didn't rewrite this; separate issue
         *                         if some variable names are off now, let me know
         */

        //Create minimapContainer...
        var minimapContainer = root.find('#minimapContainer');

        //if the #info div exceeds the half the length of the sidebar, the div's max-height is set to its default with an auto scroll property.
        info.css({
            'overflow-y': 'auto',
            'max-height': sideBar.height() * 2 / 5 - (info.offset().top - sideBar.offset().top) + 'px',

        });

        var minimapDescription = $(document.createElement('div'))
            .addClass('minimapDescription')
            .css({
                'font-size': '80%',
                'margin-top': '-13%',
                'text-align': 'center'
            })
            .text('Navigation');
        minimapContainer.append(minimapDescription);



        //when the #info div's size is not too large, the text inside metadata fields is made as much visible as possible
        assetContainer.css({
            'max-height': sideBarInfo.height() - info.height() + (info.offset().top - sideBar.offset().top) + 'px',

        });



        sideBarSections.append(minimapContainer);

        //A white rectangle for minimap to show the current shown area for artwork
        var minimaprect = root.find('#minimaprect');

        //Load deepzoom thumbnail. 
        var img = new Image();
        var loaded = false;
        var AR = 1;//ratio between width and height.
        var minimapw = 1;//minimap width
        var minimaph = 1;//minimap height
        var minimap;

        /*
        **Load the image of artwork and initialize the minimap rectangle
        * @method minimapLoaded
        */
        function minimapLoaded() {
            if (loaded) return;
            loaded = true;
            //load the artwork image
            minimap = root.find('#minimap');
            minimap.attr('src', TAG.Worktop.Database.fixPath(doq.URL));

            //make the minimap not moveable. 
            minimap.mousedown(function () {
                return false;
            });

            //TAG.Util.disableDrag(minimapContainer);

            AR = img.naturalWidth / img.naturalHeight;
            var heightR = img.naturalHeight / $(minimapContainer).height();//the ratio between the height of image and the container.
            var widthR = img.naturalWidth / $(minimapContainer).width();//ratio between the width of image and the container.
            //make sure the whole image shown inside the container based on the longer one of height and width.
            if (heightR > widthR) {
                minimap.removeAttr("height");
                minimap.removeAttr("width");
                minimap.css({ "height": "100%" });
            }
            else {
                minimap.removeAttr("height");
                minimap.removeAttr("width");
                minimap.css({ "width": "100%" });
            }

            //make the image manipulatable. 
            if (IS_WINDOWS && isNobelWill !== true) {
                var gr = TAG.Util.makeManipulatableWin(minimap[0], {
                    onManipulate: onMinimapManipWin,
                    onScroll: onMinimapScrollWin,
                    onTapped: onMinimapTappedWin
                }, false);
            } else if(isNobelWill!==true){
                var gr = TAG.Util.makeManipulatable(minimap[0], {
                    onManipulate: onMinimapManip,
                    onScroll: onMinimapScroll,
                    onTapped: onMinimapTapped
                }, true);
            }
            /**********************/
            var minimaph = minimap.height();
            var minimapw = minimap.width();

            //centers rectangle
            var minimapt = (minimapContainer.height() / 2) - (minimap.height() / 2);
            var minimapl = (minimapContainer.width() / 2) - (minimap.width() / 2);
            minimaprect.css({
                width: (minimapw - 1) + "px",
                height: (minimaph - 1) + "px",
                top: minimapt + "px",
                left: (minimapl - 1) + "px"
            });
            /*********************/
        }
        /*
        **Implement manipulation function from makeManipulatable.
        * @method onMinimapManip
        * @param {Object} evt        object containing hammer event info 
        */
        function onMinimapManip(evt) {
            var minimaph = minimap.height();
            var minimapw = minimap.width();
            var minimapt = minimap.position().top;
            var minimapl = parseFloat(minimap.css('marginLeft'));

            //find pivot and translation of manipulation event
            var px = evt.pivot.x + (minimap.offset().left - minimapContainer.offset().left);
            var py = evt.pivot.y + (minimap.offset().top - minimapContainer.offset().top);
            var tx = evt.translation.x;
            var ty = evt.translation.y;

            var x = px + tx;
            var y = py + ty;
            x = (x - minimapl) / minimapw;
            y = (y - minimapt) / minimaph;
            y = y / AR;
            x = Math.max(0, Math.min(x, 1));
            y = Math.max(0, Math.min(y, 1 / AR));
            var s = 1 + (1 - evt.scale);
            if (s) annotatedImage.viewer.viewport.zoomBy(s, false);
            annotatedImage.viewer.viewport.panTo(new Seadragon.Point(x, y), true);
            annotatedImage.viewer.viewport.applyConstraints();
        }

        /*
        **Implement manipulation function from makeManipulatableWin in win8 app.
        * @method onMinimapManipWin
        * @param {Object} evt        object containing windows event info 
        */
        function onMinimapManipWin(evt) {
            var minimaph = minimap.height();
            var minimapw = minimap.width();
            var minimapt = minimap.position().top;
            var minimapl = parseFloat(minimap.css('marginLeft'));

            var px = evt.pivot.x;
            var py = evt.pivot.y;
            var tx = evt.translation.x;
            var ty = evt.translation.y;

            var x = px + tx;
            var y = py + ty;
            x = (x - minimapl) / minimapw;
            y = (y - minimapt) / minimaph;
            y = y / AR;
            x = Math.max(0, Math.min(x, 1));
            y = Math.max(0, Math.min(y, 1 / AR));

            var s = 1 + (1 - evt.scale);
            if (s) {
                annotatedImage.viewer.viewport.zoomBy(s, false);
            }
            annotatedImage.viewer.viewport.panTo(new Seadragon.Point(x, y), true);
            annotatedImage.viewer.viewport.applyConstraints();
        }

        /**Implement scroll function from makeManipulatable
         * @method onMinimapScroll
         * @param {Number} scale     scale factor
         * @param {Object} pivot     x and y location of event
         */
        function onMinimapScroll(scale, pivot) {
            //create hammer event and pass into onMinimapManip
            onMinimapManip({
                scale: scale,
                translation: {
                    x: 0,
                    y: 0
                },
                pivot: pivot
            });
        }

        /**Implement scroll function in win8app from makeManipulatableWin
         * @method onMinimapScrollWin
         * @param {Number} delta     change
         * @param {Object} pivot     x and y location of event
         */
        function onMinimapScrollWin(delta, pivot) {
            annotatedImage.viewer.viewport.zoomBy(delta, annotatedImage.viewer.viewport.pointFromPixel(new Seadragon.Point(pivot.x, pivot.y)));
            annotatedImage.viewer.viewport.applyConstraints();
        }


        /**Implement tapped function from makeManipulatable
        * @method onMinimapTapped
        * @param {Object} evt        object containing hammer event info
        */
        function onMinimapTapped(evt) {
            var minimaph = minimap.height();
            var minimapw = minimap.width();
            var minimapt = minimap.position().top;
            var minimapl = parseFloat(minimap.css('marginLeft'));

            var xPos = evt.position.x; //+ minimap.offset().left;
            var yPos = evt.position.y; //+ minimap.offset().top;
            var x = (xPos - minimapl) / minimapw;
            var y = (yPos - minimapt) / minimaph;
            y = y / AR;
            x = Math.max(0, Math.min(x, 1));
            y = Math.max(0, Math.min(y, 1 / AR));
            var s = 1;
            if (s) annotatedImage.viewer.viewport.zoomBy(s, false);
            annotatedImage.viewer.viewport.panTo(new Seadragon.Point(x, y), true);
            annotatedImage.viewer.viewport.applyConstraints();
        }

        /**Implement tapped function in win8 from makeManipulatableWin
        * @method onMinimapTapped
        * @param {Object} evt        object containing windows event info
        */
        function onMinimapTappedWin(evt) {
            var minimaph = minimap.height();
            var minimapw = minimap.width();
            var minimapt = minimap.position().top;
            var minimapl = parseFloat(minimap.css('marginLeft'));

            var xPos = evt.position.x;
            var yPos = evt.position.y;
            var x = (xPos - minimapl) / minimapw;
            var y = (yPos - minimapt) / minimaph;
            y = y / AR;
            x = Math.max(0, Math.min(x, 1));
            y = Math.max(0, Math.min(y, 1 / AR));
            var s = 1;
            if (s) {
                annotatedImage.viewer.viewport.zoomBy(s, false);
            }
            annotatedImage.viewer.viewport.panTo(new Seadragon.Point(x, y), true);
            annotatedImage.viewer.viewport.applyConstraints();
        }

        img.onload = minimapLoaded;
        //should be complete image of artwork NOT thumbnail
        img.src = TAG.Worktop.Database.fixPath(doq.URL);
        if (img.complete) {
            minimapLoaded();
        }
        /*
        **Move the minimap rectangle based on the manipulation of the image
        * @method dzMoveHandler
        * @param {event} evt            manipulation event of the image
        */
        function dzMoveHandler(evt) {

            //catch race condition when minimap not yet reloaded 
            if (!minimap) {
                return;
            }
            var minimaph = minimap.height();
            var minimapw = minimap.width();

            //centers rectangle
            var minimapt = (minimapContainer.height() / 2) - (minimap.height() / 2);
            var minimapl = (minimapContainer.width() / 2) - (minimap.width() / 2);

            var viewport = evt.userData.viewport;
            //OSD hasn't reloaded completely yet
            if (!viewport) {
                return;
            }
            var rect = viewport.getBounds(true);
            var tl = rect.getTopLeft();
            var br = rect.getBottomRight();
            var x = tl.x;
            var y = tl.y;
            var xp = br.x;
            var yp = br.y;
            if (x < 0) x = 0;
            if (y < 0) y = 0;
            if (xp > 1) xp = 1;
            if (yp > 1 / AR) yp = 1 / AR;
            y = y * AR;
            yp = yp * AR;
            yp = yp - y;
            xp = xp - x;
            x = minimapl + x * minimapw;
            y = minimapt + y * minimaph;
            xp = xp * minimapw;
            yp = yp * minimaph;
            minimaprect.css({
                width: (xp - 1) + "px",
                height: (yp - 1) + "px",
                top: y + "px",
                left: (x - 1) + "px"
            });
        }

        /*
         * END MINIMAP CODE
         ******************/

        annotatedImage.addAnimateHandler(dzMoveHandler);
        assocMediaToShow && loadQueue.add(mediaClicked(associatedMedia[assocMediaToShow.Identifier]));

        //show hotspots
        if (isImpactMap) {
            for (var y = 0; y < associatedMedia.guids.length; y++) {
                loadQueue.add(mediaClicked(associatedMedia[associatedMedia.guids[y]]));
            }
        }
        //PART OF CUSTOM BUILD FOR THE SAM
        /*for (i = 0; i < associatedMedia.guids.length; i++) {
            //doNothing("THIS THIS: " + Object.keys(associatedMedia[associatedMedia.guids[i]]));
            if (associatedMedia[associatedMedia.guids[i]].linq.Metadata.Type && (associatedMedia[associatedMedia.guids[i]].linq.Metadata.Type === "Hotspot")) {
                loadQueue.add(associatedMedia[associatedMedia.guids[i]].showHotspot());
            }
        };*/
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
            .attr('src', tagPath + 'images/icons/Close.svg')
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
            expanded: false
        });

        drawer.append(drawerHeader);
        drawerHeader.append(label);
        drawerHeader.append(toggleContainer);
        toggleContainer.append(toggle);

        drawer.append(drawerContents);
        topContents && drawerContents.append(topContents);
        var drawerToggle = function (evt) {
            if (toggle.attr('expanded') !== 'true') {
                root.find(".drawerPlusToggle").attr({
                    src: tagPath + 'images/icons/plus.svg',
                    expanded: false
                });

                root.find(".drawerContents").slideUp();

                toggle.attr({
                    src: tagPath + 'images/icons/minus.svg',
                    expanded: true
                });
            } else {
                toggle.attr({
                    src: tagPath + 'images/icons/plus.svg',
                    expanded: false
                });

            }

            drawerContents.slideToggle();
            isOpen && that.locationClose()
        }

        //have the toggler icon minus when is is expanded, plus otherwise.
        drawerHeader.on('click', drawerToggle);
        TAG.Telemetry.register(drawerHeader, 'click', 'Drawer', function (tobj) {
            tobj.current_artwork = doq.Identifier;
            tobj.toggle = toggle.attr("expanded"); //expanded or collapsed
            tobj.drawer_header = drawerHeader.text();
        });
        drawer.contents = drawerContents;
        if (assocMediaToShow && title === 'Associated Media') {
            //drawerHeader.click();
            drawer.drawerToggle = drawerToggle;
        }
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


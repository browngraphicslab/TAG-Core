TAG.Util.makeNamespace("TAG.Layout.LaureatesPage");

TAG.Layout.LaureatesPage = function (options, idletimerDuration) {
     options = options || {}; // cut down on null checks later

     var // DOM-related
         root = TAG.Util.getHtmlAjax('LaureatesPage.html'), // use AJAX to load html from .html file
         infoDiv = root.find('#infoDiv'),
         tileDiv = $(document.createElement("div")).attr("id", "tileDiv"),//root.find('#tileDiv'),
         displayArea = root.find("#displayArea"),
         collectionArea = root.find('#collectionArea'),
         backButtonArea = root.find('#backButtonArea'),
         backButton = root.find('#backButton'),
         homeButtonArea = root.find('#homeButtonArea'),
         homeButton = root.find('#homeButton'),
         centeredCollectionHeader = root.find("#centeredCollectionHeader"),
         dropDownArrow = root.find('#dropDownArrow'),
         collectionDotHolder = root.find('#collectionDotHolder'),
         bgimage = root.find('#bgimage'),
         bottomContainer = root.find('#bottomContainer'),
         catalogDiv = root.find('#catalogDiv'),
         collectionMenu = root.find('#collectionMenu'),
         searchInput = root.find('#searchInput'),
         searchBttn = root.find('#searchBttn'),
         keywordsDiv = root.find("#keywords"),
         searchTxt = root.find('#searchTxt'),
         artworksButton = root.find('#artworksButton'),
         assocMediaButton = root.find('#assocMediaButton'),
         selectedArtworkContainer = root.find('#selectedArtworkContainer'),
         popupOverlay = root.find('#popupOverlay'),
         searchResultText = root.find('#searchResultText'),
         timelineArea = root.find('#timelineArea'),
         topBar = root.find('#topBar'),
         filterTitle = root.find('#filterTitle'),
         searchTitle = root.find('#searchTitle'),
        loadingArea = root.find('#loadingArea'),
        infoButton = root.find('#infoButton'),
        tutorialButton = root.find('#tutorialButton'),
        linkButton = root.find('#linkButton'),
        sortsDiv = root.find('#sorts'),
        filtersDiv = root.find('#filters'),
        divideDiv = root.find('#divide'),
        keywordSelects = [], // Will be filled in later.
        keywordOperatorSelects = [], // Will be filled in later.
        selectedPrizes = {},
        prizeButtonArray = [],
        showKeywords = false,
        overlay = root.find('#overlay'),
        prevCollection = $(document.createElement('div')).attr('id', 'prevCollection'),
        selectedTile,
        tourIDsHash,
        filtersTitle,

        // input options
        scrollPos = options.backScroll || null,     // horizontal position within collection's catalog
        previewPos = options.backPreviewPos || null,
        currCollection = options.backCollection,      // the currently selected collection
        currentArtwork = options.backArtwork,         // the currently selected artwork
        currentTag = options.backTag,             // current sort tag for collection
        multipleShown = options.backMult,            // whether multiple artworks shown at a specific year, if applicable
        backSearch = options.backSearch,
        //wasOnAssocMediaView     = options.wasOnAssocMediaView || false,   //whether we were on associated media view       
        previewing = options.previewing || false,   // whether we are loading for a preview in authoring (for dot styling)
        hideKeywords = options.hideKeywords, //true if should be hidden for a particular collection
        smallPreview= options.smallPreview,
        titleIsName = options.titleIsName,
        showOtherCollections = options.showOtherCollections,
        twoDeep = options.twoDeep, //show two tiles per column
        oneDeep = options.oneDeep, //show one tile per column
        backToGuid = options.backToGuid, //for impact map experience
        backToAssoc = options.backToAssoc, // for impact map experience
        NOBEL_WILL_COLOR = 'rgb(254,161,0)',
        showNobelLifeBox = options.showNobelLifeBox, // customization to indicate whether initial pop up has appeared on Nobel Life collection
        showInitialImpactPopUp = options.showInitialImpactPopUp,
        

        // misc initialized vars
        idleTimerDuration = idletimerDuration,
        loadQueue = TAG.Util.createQueue(),           // an async queue for artwork tile creation, etc
        artworkSelected = false,                        // whether an artwork is selected

        keywords0Selected = [],
        keywords1Selected = [],
        keywords2Selected = [],


        visibleCollections = [],                               // array of collections that are visible and published
        collectionDots = {},                               // dict of collection dots, keyed by collection id
        artworkCircles = {},                               // dict of artwork circles in timeline, keyed by artwork id                  
        artworkTiles = {},                                   // dict of artwork tiles in bottom region, keyed by artwork id
        hiddenDots = [],
        firstLoad = true,                             // TODO is this necessary? what is it doing?
        currentArtworks = [],                               // array of artworks in current collection
        infoSource = [],                               // array to hold sorting/searching information
        keywordSearchOptions = [],                      // object to hold details of keywords search
        keywordDictionary = [],                          // hash for keywords
        timelineEventCircles = [],                               // circles for timeline
        timelineTicks = [],                               // timeline ticks
        scaleTicks = [],                               // timeline scale ticks
        artworkYears = {},                               // dict of artworks keyed by yearKey for detecting multiple artworks at one year    
        scaleTicksAppended = false,                            // if scale ticks have been appended
        tileDivHeight = 0,                                // Height of tile div (before scroll bar added, should equal height of catalogDiv)
        artworkShown = false,                            // whether an artwork pop-up is currently displayed
        timelineShown = true,                             // whether current collection has a timeline
        onAssocMediaView = options.wasOnAssocMediaView || false,                            // whether current collection is on assoc media view
        previouslyClicked = null,
        artworkInCollectionList = [],
        lockKioskMode = TAG.Worktop.Database.getKioskLocked(),                           // true if back button is hidden //TO DO: GET KIOSKLOCKED FROM SPOOF
        // constants
        NOBEL_COLOR = 'rgb(254,161,0)',
        BASE_FONT_SIZE = TAG.Worktop.Database.getBaseFontSize(),       // base font size for current font //TO DO: GET FONT SIZE FROM SPOOF
        FIX_PATH = TAG.Layout.Spoof().fixPath,              // prepend server address to given path                     //TODO CHANGE THIS BACK TO WORKTOP'S
        MAX_YEAR = (new Date()).getFullYear(),                   // Maximum display year for the timeline is current year
        EVENT_CIRCLE_WIDTH = Math.min(30, Math.max(20, $("#tagRoot").width() / 50)),  // width of the circles for the timeline                                
        COLLECTION_DOT_WIDTH = Math.max(7, $("#tagRoot").width() / 120),  // width of the circles for the timeline                      
        LEFT_SHIFT = 9,                                                    // pixel shift of timeline event circles to center on ticks 
        TILE_BUFFER = $("#tagRoot").width() / 55, // number of pixels between artwork tiles
        TILE_BUFFER2 = $("#tagRoot").width()/35,
        TILE_HEIGHT_RATIO = 200,                                          //ratio between width and height of artwork tiles
        TILE_WIDTH_RATIO = twoDeep ? 255 : 200,
        ANIMATION_DURATION = 800,                                         // duration of timeline zoom animation
        DIMMING_FACTOR = 1.7,                                          //dimming of unhighlighted text
        PRIMARY_FONT_COLOR = options.primaryFontColor ? options.primaryFontColor : TAG.Worktop.Database.getMuseumPrimaryFontColor(),
        SECONDARY_FONT_COLOR = options.secondaryFontColor ? options.secondaryFontColor : TAG.Worktop.Database.getMuseumSecondaryFontColor(),
        FONT = TAG.Worktop.Database.getMuseumFontFamily(),

        // misc uninitialized vars
        fullMinDisplayDate,             // minimum display date of full timeline
        fullMaxDisplayDate,             // maximum display date of full timeline
        currentTimeline,                // currently displayed timeline
        currTimelineCircleArea,         // current timeline circle area
        currentDefaultTag,              // current default tag if 'Year' and  'Title' sorts don't exist
        toShowFirst,                    // first collection to be shown (by default)
        toursIn,                        // tours in current collection
        imgDiv,                         // container for thumbnail image
        descriptiontext,                // description of current collection or artwork
        loadingArea,                    // container for progress circle
        moreInfo,                       // div holding tombstone information for current artwork
        artistInfo,                     // artist tombstone info div
        yearInfo,                       // year tombstone info div
        justShowedArtwork,              // for telemetry; helps keep track of artwork tile clicks
        comingBack,                     // if you are coming back from a viewer
        defaultTag,                     // default sort tag
        showArtworkTimeout,
        searchResultsLength,
        tileCircle,                     // loading circle for artwork tiles
        menuCreated,
    
        // KEYWORDS
        keywordSets,

        //TELEMETRY
        nav_timer = new TelemetryTimer(),
        global_artwork_prev_timer = new TelemetryTimer(); //initialized here, restarted when previewer is opened
        //previewer_exit_click; //keeps track of how the previewer was closed

    if (SECONDARY_FONT_COLOR[0] !== '#') {
        SECONDARY_FONT_COLOR = '#' + SECONDARY_FONT_COLOR;
    }
    if (PRIMARY_FONT_COLOR[0] !== '#') {
        PRIMARY_FONT_COLOR = '#' + PRIMARY_FONT_COLOR;
    }
    root[0].collectionsPage = this;
    root.data('split',options.splitscreen);
    options.backCollection ? comingBack = true : comingBack = false;
    var cancelLoadCollection = null;

    homeButton.attr('src', tagPath + 'images/icons/home.svg');
    homeButton.click(function () {
        TAG.Layout.StartPage(null, function (page) {
            $('#keywords').empty();
            $("#startPageLoadingOverlay").remove()
            TAG.Util.UI.slidePageRight(page);
        });
    })

    collectionArea.css('display', 'none');


    backButton.attr('src', tagPath + 'images/icons/Back.svg');
    root.append(backButtonArea);
    root.append(homeButtonArea);

    
    backButton.css('z-index', '99999999');
    homeButton.css('z-index', '999999999');
    /*backButton.click(function () {   
        if (backToGuid){
            TAG.Worktop.Database.getDoq(backToGuid,
                function (result) {
                    var artworkViewer = TAG.Layout.ArtworkViewer({
                        doq: result,
                        isNobelWill: false,
                        isImpactMap: true,
                        showInitialImpactPopUp: true,
                        assocMediaToShow: backToAssoc
                });
                var newPageRoot = artworkViewer.getRoot();
                newPageRoot.data('split', root.data('split') === 'R' ? 'R' : 'L');
                TAG.Util.UI.slidePageRight(newPageRoot);
                currentPage.name = TAG.Util.Constants.pages.ARTWORK_VIEWER;
                currentPage.obj = artworkViewer;
                });
            return;
        } 
        TAG.Layout.StartPage(null, function (page) {
            // quick fix - something weird happens to the dropdownchecklists that reverts them to the visible multiselect on a page switch.
            // For now, we'll just hide the whole keywords div.
           // $('#keywords').hide();
            $('#keywords').empty();
            TAG.Util.UI.slidePageRight(page);
        });
    }); */

    if (lockKioskMode == "true") {
        doNothing("kiosk mode locked, back button disabled")
        backButton.css('display', 'none');
    } else {
        doNothing("kiosk mode unlocked, back button enabled")
        //collectionMenu.css('left', '5%');
        if (IS_WINDOWS) {
            backButton.css('padding-top', '');
        }
        backButton.css('display', 'inline');
    }


    // get things rolling
    init();
    /**
     * Sets up the collections page UI
     * @method init
     */
    function init() {
        
        /*if (!idleTimer && !previewing) {
            var timerDuration = {
                duration: idleTimerDuration ? idleTimerDuration : null
            }
            idleTimer = TAG.Util.IdleTimer.TwoStageTimer(timerDuration);
            //idleTimer.start();
        }
        else if (idleTimer && !previewing && idleTimerDuration) {
            var timerDuration = {
                duration: idleTimerDuration
            }
            var timerStopped = idleTimer.isStopped();
            idleTimer = TAG.Util.IdleTimer.TwoStageTimer(timerDuration);
            if (!timerStopped) {
               // idleTimer.start();
            }
        }
        if ((previewing || lockKioskMode) && idleTimer) {
            idleTimer.kill();
        } */
        var progressCircCSS,
            circle,
            oldSearchTerm;
        
        cancelLoadCollection = null;
        progressCircCSS = {
            'position': 'absolute',
            'z-index': '50',
            'height': 'auto',
            'width': '5%',
            'left': '47.5%',
            'top': '42.5%'
        };
        if (!$("#startPageLoadingOverlay").length) {
            circle = TAG.Util.showProgressCircle(loadingArea, progressCircCSS, '0px', '0px', false);
        }
        var loadingLabel = $(document.createElement('div'));
        loadingLabel.attr('id','loadingLabel');
        loadingLabel.css({
            'position': 'absolute',
            'left': '37%',
            'top': '55%',
            'font-size': '200%',
            'color': 'white',
            'opacity': '1'
        });  

        loadingLabel.text('Loading Collections');
        if (!$("#startPageLoadingOverlay").length) {
            loadingArea.append(loadingLabel);
        }

        //Or else the search bar loses focus immediately when you come back from artwork viewer
        $('#tagContainer').off();
        
        // search on keyup
        searchInput.on('keyup', function (e) {
            if (!infoDiv.is(':animated')) {
                var keywordsInputEmpty = true;
                for (var i = 0; i < keywordSearchOptions.length; i++) {
                    keywordsInputEmpty = keywordsInputEmpty && (keywordSearchOptions[i].keywords.length == 0);
                }
                if (!searchInput.val() && keywordsInputEmpty && e.which !== 13) {
                    clearSearchResults();
                }
                else if (e.which === 13) {
                    doSearch(true);
                }
            }
        });
        $("#bottomContainer").css({
            'scrollbar-face-color': NOBEL_WILL_COLOR,
            'scrollbar-arrow-color': 'transparent',
            'scrollbar-track-color': 'transparent',
        })
        //Search telemetry register
        /*
        TAG.Telemetry.register(searchInput, 'keyup', 'Search', function(tobj, evt){
            if(evt.which != 13) {
                return true;
            }

            tobj.search_text = searchTxt.text();
            tobj.current_collection = currCollection.Identifier;
            setTimeout(function () { 
                tobj.number_of_matches = searchResultsLength; 
            }, 2000);       //Delay so that searchResultsLength gets updated
            
        }); */


        searchInput.css({
            /*'background-image': 'url("' + tagPath + '/images/icons/search icon.svg")',
            //0'background-size' : 'auto 90%',
            'background-repeat': 'no-repeat',
            'background-position':'right'*/
        });

        searchBttn.attr('src', tagPath + 'images/icons/search_icon.svg').unbind('click');
        searchBttn.click(function () {
            doSearch(true);
        });

        var searchDefault = "search";
        
        searchInput.css({
            'font-style': 'italic'
        })
        /*searchInput.on('focusin', function () { 
            searchInput.css({ 'background-image': 'none' }); 
        });
        searchInput.on('focusout', function () { 
            if (!searchInput.val()) {
                searchInput.css({ 'background-image': 'url("' + tagPath + '/images/icons/search icon.svg")' });
            };
        });*/

        //initSplitscreen();

        infoButton.attr('src', tagPath+'images/icons/info.svg')
            .addClass('bottomButton')
        infoButton.on('mousedown', function () {
            createInfoPopUp();
        });
        //Info register
        /*TAG.Telemetry.register(infoButton, 'mousedown', 'Overlay', function(tobj){
            tobj.overlay_type = "info"; //info or tutorial page
            tobj.current_collection = currCollection.Identifier;
            tobj.time_spent = null;
        });*/

        tutorialButton.attr('src', tagPath + 'images/icons/question_mark.svg')
            .addClass('bottomButton')
            .on('mousedown', function () {
                TAG.Util.createTutorialPopup(currCollection);
            });
        /*TAG.Telemetry.register(tutorialButton, 'mousedown', 'Overlay', function(tobj){
            tobj.overlay_type = "tutorial"; //info or tutorial page
            tobj.current_collection = currCollection.Identifier;
            tobj.time_spent = null;
        });*/
        if (IS_WEBAPP) {
            linkButton.attr('src', tagPath + 'images/link.svg')
                        .addClass('bottomButton')
                        .on('mousedown', function () {
                            var linkOverlay = TAG.Util.UI.showPageLink(urlToParse, {
                                tagpagename: 'collections',
                                tagcollectionid: currCollection.Identifier,
                                tagartworkid: currentArtwork ? currentArtwork.Identifier : ''
                            });
                root.append(linkOverlay);
                linkOverlay.fadeIn(500, function () {
                    linkOverlay.find('.linkDialogInput').select();
                });
            });
            
        } else {
            linkButton.remove();
        }

        if (root.data('split') === 'L' && TAG.Util.Splitscreen.isOn()) {
            infoButton.hide();
            tutorialButton.hide();
            linkButton.css("float", "left");
        }

        catalogDiv.css('bottom', -(0.01 * $("#tagRoot").height()) + 'px');

        //Scrolling closes popup
        if (bottomContainer[0].addEventListener) {
            // IE9, Chrome, Safari, Opera
            bottomContainer[0].addEventListener("mousewheel", 
                function(){
                    currentArtwork && hideArtwork(currentArtwork)()
                }, false);
            // Firefox
            bottomContainer[0].addEventListener("DOMMouseScroll", 
                function(){
                    currentArtwork && hideArtwork(currentArtwork)()
                }, false);
        } else { 
            // IE 6/7/8
            bottomContainer[0].attachEvent("onmousewheel",
                function(){
                    currentArtwork && hideArtwork(currentArtwork)()
                }, false);
        };

        var progressCircCSS = {
            'position': 'absolute',
            'float': 'left',
            'left': '40%',
            'z-index': '50',
            'height': '10%',
            'width': 'auto',
            'top': '22%',
        };

        root.find(".sortButton").css({
            'max-width': $("#tagRoot").width() * 0.15 + 'px',
        });

        TAG.Worktop.Database.getExhibitions(getCollectionsHelper, null, getCollectionsHelper); //TO DO: FIGURE OUT WHAT THIS DOES?!
        applyCustomization();
        menuCreated = false;

        //root.find('#filterTitle').attr('id', 'filterTitle');
/*        filtersTitle = $(document.createElement('div')).addClass("filtersTitle");
        filtersTitle.text = "Filters";
        root.find('#keywords').append(filtersTitle);
        root.find('#keywords').text = "Filters";*/
        filterTitle.css({
            //'background-color': 'green',
            //'float': 'top',
            //'display': 'inline',

            
        });
        filterTextDiv = $(document.createTextNode("Filters"));
        filterTextDiv.css({
            'color':'white'
        });
        filterTitle.append(filterTextDiv);

        searchTextDiv = $(document.createTextNode("Search"));
        searchTextDiv.css({ 'color': 'white' });

        searchTitle.append(searchTextDiv);

        /*root.find('#keywords').css({

        });*/

        root.find('#catalogDiv').css('height', '83%');
        //root.find('#topDiv').append
    }

    /**ui-dropdownchecklist-
     * Fill in the appropriate UI pieces so that they reflect the search as defined by parameters.
     * @method updateSearchInput
     * @param searchText {String}               The text to be entered in the search bar.
     * @param keywordSearchOptions {Object}     Object containing info on keywords search (see getKeywordSearchOptions())
     */
    function updateSearchInput(searchText, keywordSearchOptions) {
        // Search bar.
        if (searchText) {
            searchInput.val(searchText);
        }

        // Keywords search.
        if (keywordSearchOptions) {
            for (var i = 0; i < keywordSearchOptions.length; i++) {
                var options = keywordSearchOptions[i];
                // Set the operation.
                if (options.operation && options.operation !== '') {
                    // Update hidden select element.
                    var selOptions = $(root.find('.operationSelect')[i]).find('option');
                    $.each(selOptions, function (selOptionIndex, selOption) {
                        if ($(selOption).text().toLowerCase() === options.operation) {
                            $(selOption).attr('selected', 'selected');
                        } else {
                            $(selOption).removeAttr('selected');
                        }
                    });

                    // Update selector text.
                    $(root.find('.operationSelect').parent().find('span.ui-dropdownchecklist-text')[i])
                        .attr('title', options.operation.toUpperCase())
                        .text(options.operation.toUpperCase());
                }

                // Set the selected keywords.
                if (options.keywords) {
                    for (var j = 0; j < options.keywords.length; j++) {
                        var keyword = options.keywords[j];

                        // Update hidden select element.
                        var selOptions = $(root.find('.keywordsMultiselect')[i]).find('option')
                        $.each(selOptions, function (selOptionIndex, selOption) {
                            if ($(selOption).text().toLowerCase() === keyword) {
                                $(selOption).attr('selected', 'selected');
                            }
                        });

                        // Update checkbox.
                        var labels = $(root.find('.keywordsMultiselect')[i]).parent().find('.ui-dropdownchecklist-dropcontainer label');
                        $.each(labels, function (labelIndex, label) {
                            if ($(label).text().toLowerCase() === keyword) {
                                $(label).parent().find(':checkbox').attr('checked', 'checked');
                            }
                        });
                    }
                }
            }
        }
    }

   
    /**
     * Create info pop-up for 'i' info icon on collections page
     * @method createInfoPopUp
     */
    function createInfoPopUp() {
        var infoOverlay = $(TAG.Util.UI.blockInteractionOverlay());
        var infoBox = $(document.createElement('div'));
        var infoTitle = $(document.createElement('div'));
        var infoMain = $(document.createElement('div'));
        var infoLogo = $(document.createElement('div'));
        var infoTitleLeft = $(document.createElement('div'));
        var infoTitleRight = $(document.createElement('div'));
        var infoMainTop = $(document.createElement('div'));
        var infoMainBottom = $(document.createElement('div'));
        var microsoftLogoDiv = $(document.createElement('div'));
        var brownLogoDiv = $(document.createElement('div'));
        var microsoftLogo = $(document.createElement('img'));
        var brownLogo = $(document.createElement('img'));
        var closeButton = createCloseButton();
        var string = 'cs.brown.edu/research/ptc/tag';
        microsoftLogo.attr('src', tagPath + 'images/microsoft_logo_transparent.png');
        brownLogo.attr('src', tagPath + 'images/brown_logo_transparent.png');
        microsoftLogoDiv.css({
            'background': 'transparent',
            'width': '25%',
            'min-width':'120px',
            'height': '100%',
            'float': 'right',
            'display':'inline-block'
        });
        brownLogoDiv.css({
            'background': 'transparent',
            'width': '10%',
            'min-width': '40px',
            'height': '100%',
            'float': 'right',
            'display': 'inline-block'
        });
        microsoftLogo.css({
            'height': 'auto',
            'width': '100%',
            'min-width':'120px',
            'margin-top': '4%'
        });
        brownLogo.css({
            'height': 'auto',
            'width': '80%',
            'min-width': '40px',
            'margin-top': '-16%'
        });
       
        infoOverlay.css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex);
        infoOverlay.append(infoBox);
        infoBox.css({
            'background-color': 'black',
            'color': 'white',
            'height': '50%',
            'width': '50%',
            'margin-top': '15%',
            'margin-left': '25%',
        });
        infoTitle.css({
            'background-color': 'black',
            'margin': '0%',
            'display': 'block',
            'color': 'white',
            'border-top-left-radius':'3.5px',
            'border-top-right-radius':'3.5px'
        });
        infoTitle.append(infoTitleLeft);
        infoTitle.append(infoTitleRight);

        closeButton.css({
            'height': '4%',
            'width': '4%',
            'min-height': '20px',
            'min-width':'20px',
            'margin-left': '0%',
            'margin-bottom': '0%',
            'margin-top': '1%',
            'margin-right':'1%',
            'top':'0%',
            'display': 'block',
            'float':'right'
        });

        infoBox.append(closeButton);
        infoTitleLeft.css({
            'color': 'white',
            'background-color': 'black',
            'display': 'inline-block',
            'font-weight': 'bold',
            'font-size': '2em',
            'margin-left': '5%',
            'margin-top': '2%'
        });
        infoTitleLeft.text('TAG');

        infoTitleRight.css({
            'color': 'white',
            'background-color': 'black',
            'display': 'inline-block',
            'font-size': '1.5em',
            'margin-left': '3%'
        });
        infoTitleRight.text('Touch Art Gallery');

        infoMain.css({
            'background-color': 'black',
            'display': 'block',
            'color': 'white'
        });
        infoMainTop.css({
            'color': 'white',
            'background': 'black',
            'display': 'block',
            'font-size': '0.75em',
            'margin-left': '5%',
            'margin-top': '3%',
            'margin-right': '6%'
        });
        infoMainBottom.css({
            'color': 'white',
            'background': 'black',
            'display': 'block',
            'font-size': '0.65em',
            'margin-left': '5%',
            'margin-top': '3%',
            'margin-right': '6%'
        });
        infoMainTop.text('Touch Art Gallery is a free webapp and Win8 application, funded by Microsoft Reasearch and created by the Graphics Lab at Brown University. You can learn more about this project at http://cs.brown.edu/research/ptc/tag.');
        infoMainBottom.text('Andy van Dam, Karthik Battula, Karishma Bhatia, Nate Bowditch, Gregory Chatzinoff, Tiffany Citra, John Connuck, David Correa, Mohsan Elahi, Aisha Ferrazares, Jessica Fu, Yudi Fu, Kaijan Gao, Trent Green, Jessica Herron, Alex Hills, Ardra Hren, Hak Rim Kim, Inna Komarovsky, Ryan Lester, Benjamin LeVeque, Josh Lewis, Jinqing Li, Jeffery Lu, Surbhi Madan, Xiaoyi Mao, Ria Mirchandani, Julie Mond, Ben Most, Carlene Niguidula, Tanay Padhi, Jonathan Poon, Dhruv Rawat, Emily Reif, Jacob Rosenfeld, Lucy van Kleunen, Qingyun Wan, Jing Wang, David Weinberger, Anqi Wen, Natasha Wollkind, Dan Zhang, Libby Zorn');
        infoMain.append(infoMainTop);
        infoMain.append(infoMainBottom);

        infoLogo.css({
            'background-color': 'black',
            'display': 'block',
            'color': 'white',
            'height': '17%',
            'padding':'5%',
            'border-bottom-right-radius':'3.5px',
            'border-bottom-left-radius':'3.5px'
        });
        infoLogo.append(brownLogoDiv);
        infoLogo.append(microsoftLogoDiv);

        brownLogoDiv.append(brownLogo);
        microsoftLogoDiv.append(microsoftLogo);

        infoBox.append(infoTitle);
        infoBox.append(infoMain);
        infoBox.append(infoLogo);
        root.append(infoOverlay);
        infoOverlay.fadeIn();

        closeButton.on('mousedown', function () {
            infoOverlay.fadeOut();
        });

        //telemetry registering
        var telemetry_timer = new TelemetryTimer();
        TAG.Telemetry.register(closeButton, 'mousedown', 'Overlay', function(tobj){
            tobj.overlay_type = "info"; //info or tutorial page
            if (currCollection) {
                tobj.current_collection = currCollection.Identifier;
            }
            tobj.time_spent = telemetry_timer.get_elapsed();
        });
    }

    function prepareNextView() {
        onAssocMediaView = false;
        currentTag = null;
        currentArtwork = null;
        currCollection = null;
        loadQueue.clear();
        comingBack = false;
        tileDiv.empty();
        tileCircle.show();
        clearKeywordCheckBoxes();
        clearSearchResults();
        infoSource = [];
        keywordDictionary = [];
        if (cancelLoadCollection) cancelLoadCollection();
       
    }

    /**
     * Create a closeButton for associated media
     * @method createCloseButton
     * @return {HTML element} the button as a 'div'
     */
    function createCloseButton() {
        var closeButton = $(document.createElement('img'));
        closeButton.attr('src', tagPath + 'images/icons/x.svg');
        closeButton.text('X');
        closeButton.css({
            'height': '3%',
            'width': '3%',
            'margin-left': '39%',
            'margin-bottom': '3.5%'
        });
        return closeButton;
    }

    /**
     * Return the type of work
     * @method getWorkType
     * @param {doq} work       the doq representing the current work
     * @return {String}        a string describing type of work ('artwork', 'video', or 'tour')
     */
    function getWorkType(work) {
        if (currentArtwork.Type === "Empty") {
            if (currentArtwork.Metadata.ContentType === "iframe"){
                return 'iframe';
            } else {
                return 'tour';
            }
        } else if (currentArtwork.Metadata.Type === 'VideoArtwork') {
            return 'video';
        }
        return 'artwork';
    }

    /**
     * Helper function to add collections to top bar.  Also creates an array of visible artworks
     * @method getCollectionsHelper
     * @param collections               list of collections to add to page
     */

    function getCollectionsHelper(collections) {
        var i,
           privateState,   // Is collection private?
           c,
           j,
           lastCollectionIndex,
           firstCollectionIndex,
           collectionDot,
           collectionsToShow = false;
        // Iterate through entire list of collections to to determine which are visible/not private/published.  Also set toShowFirst
        for (i = 0; i < collections.length; i++) {
            c = collections[i];
            privateState = c.Metadata.Private ? (/^true$/i).test(c.Metadata.Private) : false;
            if (!privateState && TAG.Util.localVisibility(c.Identifier)) {
                collectionsToShow = ((collectionsToShow) ? collectionsToShow : true);
                toShowFirst = toShowFirst || c;
                visibleCollections.push(collections[i]);
            } 
        }
        if (!collectionsToShow && !previewing) {
            var infoOverlay = $(document.createElement('div'));
            infoOverlay.text("No collections to display");
            infoOverlay.css({ "color": "white", "text-align": "center", "font-size": "200%", "margin-top": "20%" });
            root.append(infoOverlay);
            $('#catalogDivContainer').hide();
            TAG.Util.hideLoading(bottomContainer);
        }
      
        // Load collection
        if (currCollection) {
            //Quick check for specific load
            for(i = 0; i < visibleCollections.length; i++) {
                if (currCollection.Identifier === visibleCollections[i].Identifier){
                    currCollection = visibleCollections[i]
                }
            }

            //If you didnt find the collection you're trying to load in the visible collections, just load the first one instead
            if (visibleCollections.indexOf(currCollection) === -1) {
                if (previewing) {
                    loadCollection(currCollection, null, currentArtwork)();
                } else {
                    loadFirstCollection();
                }
                
            } else {
                loadCollection(currCollection, null, currentArtwork)();
            }
        } else if (toShowFirst) {
            loadFirstCollection();
        }
        $("#startPageLoadingOverlay").remove();
        loadingArea.hide();
        searchInput.show();
    }

    /**
     * Adds keyword dropdowns to the search area.
     * @method addKeywords
     */
    function addKeywords() {

        if (hideKeywords) {
            //hacky way to do styling- better structure would need to happen for extensibility
            $("#searchInput").css('margin-top', '2.5%');
            $(".sortButton").css({ 'margin-top': '0%', 'margin-right': '1%' });
            $("#bottomContainer").css({ 'top': '15%', 'height': '80%' });
            $("#bottomContainer").css({
                'scrollbar-face-color': NOBEL_WILL_COLOR,
                'scrollbar-arrow-color': 'transparent',
                'scrollbar-track-color': 'transparent',
            })
            return;
        }
        // Don't repeat this.
        if (root.find('.ui-dropdownchecklist').length > 0) {
            return;
        }
        $('#keywords').empty();

        // Get keywords from the server!
        keywordSets = TAG.Layout.Spoof().getKeywordSets();
        for (var x = 0; x < keywordSets.length; x++) {
            if ((keywordSets[x].shown) === "true") {
                showKeywords = true;
            }
        }

        // Start off by creating basic 'select' inputs. We will use jQuery library 'dropdownchecklist' to make them look nicer. 
      if (keywordSets && showKeywords) {
            // Create unordered list of select elements.
            var selectList = $(document.createElement('ul')).addClass('rowLeft'); // Class keeps stuff inline and hides bullets.
            
            // Loop through the categories of keywords. 
            keywordSets.forEach(function(set, setIndex) {

                // Create operator select element. 
                var listItem1 = $(document.createElement('li')).addClass('rowItem'); // Class keeps list inline and spaces items.
                var select1 = $(document.createElement('select')).addClass('keywordsSelect') // Class stylizes select element.
                                                                 .addClass('operationSelect'); // Class to distinguish this as AND/NOT.
                var andOptn = $('<option>AND</option>').attr('value', '0'); // AND option.
                var notOptn = $('<option>NOT</option>').attr('value', '1'); // NOT option.
                select1.append(andOptn); // Add AND option.
                //select1.css({'display': 'none'});
                andOptn.css({'display': 'none'});
                //select1.append(notOptn); // Add NOT option.
                listItem1.append(select1); // Wrap the select element in a list item.
                if (setIndex === 0){
                    listItem1.css('display','none');
                }
                // Hide if not shown.
                if (set.shown !== 'true') {
                    listItem1.css('display', 'none');
                }
                //selectList.append(listItem1); // Then add the list item to our list of selects.
                keywordOperatorSelects.push(select1); // Also add select element to stored list of operator selects. 

                // Create keywords select element.
                var listItem2 = $(document.createElement('li')).addClass('prizeKeyword'); // Class keeps list inline and spaces items.
                var select2 = $(document.createElement('select')).addClass('keywordsSelect') // Class stylizes select element.
                                                                 .addClass('keywordsMultiselect') // Class to help distinguish keyword selection from operation select.
                                                                 .attr('multiple', 'multiple'); // Make this a multi-select element. jQuery lib will turn into dropdown.
                

                // Add each of the keywords in this category.
                for (var i = 0; i < set.keywords.length; i++) {
                    var keywordsOption = $('<option>' + set.keywords[i].charAt(0).toUpperCase() + set.keywords[i].slice(1) + '</option>');
                    console.log(set.keywords[i]);
                    select2.append(keywordsOption.attr('value', i.toString()));
                    keywordsOption.on('change', function () {
                        console.log("selected");
                    });

                    
                }
                listItem2.append(select2); // Wrap the select element in a list item.
                // Hide if not shown.
                if (set.shown !== 'true') {
                    listItem2.css('display', 'none');
                }
                selectList.append(listItem2); // Then add the list item to our list of selects.
                keywordSelects.push(select2); // Also add select element to stored list of keyword selects.


            });




            var prizeSelectList = $(document.createElement('ul')).addClass('rowLeft');

          //prize filter buttons
            for (var i = 0; i < 8; i++) {
                var listItem3 = $(document.createElement('li')).addClass('prizeFilterRow');
                if (i <= 5) {
                    var filter = $(document.createElement('div')).addClass('prizeFilterButton');

                    var title = $(document.createElement('div')).addClass('prizeFilterTitle');

                    //TO DO: ACTUAL SELECTED UI. CHANGING RED BORDERS IS TEMPORARY
                    var image = $(document.createElement('img')).addClass('prizeFilterImage')
                    image.data("selected", false);
                     
                    /*image.click(function () {
                        if (filter.data("selected") === true) {
                            $(this).css("border", "0px solid red")
                            filter.data("selected", false);
                        } else { //not selected - change to selected
                            $(this).css("border", "3px solid red")
                            filter.data("selected", true);
                        }
                        
                    });*/
                    filter.data("image", image);
                    filter.data("selected", false);

                    if (i == 0) {

                        filter.data('category', 'physics').attr('id', 'physics').click(function () {
                            toggleSelectedPrize($(this))
                        });
                        title.text('Physics')
                        image.attr('src', tagPath + 'images/prize_icons/physics.svg');
                        
                    } else if (i == 1) {

                        filter.data('category', 'chemistry').attr('id', 'chemistry').click(function () {
                            toggleSelectedPrize($(this))
                        });
                        title.text('Chemistry');
                        image.attr('src', tagPath + 'images/prize_icons/chemistry.svg');

                    } else if (i == 2) {

                        filter.data('category', 'medicine').attr('id', 'medicine').click(function () {
                            toggleSelectedPrize($(this))
                        });
                        title.text('Medicine');
                        image.attr('src', tagPath + 'images/prize_icons/medicine.svg');

                    } else if (i == 3) {

                        filter.data('category', 'literature').attr('id', 'literature').click(function () {
                            toggleSelectedPrize($(this))
                        });
                        title.text('Literature');
                        image.attr('src', tagPath + 'images/prize_icons/literature.svg');

                    } else if (i == 4) {

                        filter.data('category', 'peace').attr('id', 'peace').click(function () {
                            toggleSelectedPrize($(this))
                        });
                        title.text('Peace');
                        image.attr('src', tagPath + 'images/prize_icons/peace.svg');

                    } else if (i == 5) {

                        filter.data('category', 'economics').attr('id', 'economics').click(function () {
                            toggleSelectedPrize($(this))
                        });
                        title.text('Economics');
                        image.attr('src', tagPath + 'images/prize_icons/economics.svg');

                    }
                    prizeButtonArray.push(filter);
                    filter.append(title);
                    filter.append(image);
                    listItem3.append(filter);


                } else if(i==6){ //search and clear

                    var apply = $(document.createElement('div')).addClass('applyOrClear');
                    apply.attr('id','applyButton')
                    apply.text("Apply");
                    apply.click(function () {
                        doSearch(true);
                    });
                    listItem3.append(apply);
                } else if (i == 7) {
                    var clear = $(document.createElement('div')).addClass('applyOrClear');
                    clear.attr('id', 'clearButton')
                    clear.text("Clear");
                    listItem3.append(clear);
                    clear.click(function () {
                        clearKeywordCheckBoxes();
                        clearSearchResults();
                        searchResultText.text('');

                        
                    });

                }

                prizeSelectList.append(listItem3);


            }




            
            /*var searchButtonListItem = $(document.createElement('li')).addClass('prizeFilterRow'); // Class keeps list inline and spaces items.
            var searchButton = $(document.createElement('div')).text('Apply')
                .attr('id', 'searchButton')
                .css('height', elementHeight + 'px')
                .hover(
                    function () {
                        if ($(this).attr('disabled') !== 'disabled') {
                            $(this).css('background-color', NOBEL_COLOR);
                            $(this).css('color', 'white');
                        }
                    }, function () {
                        $(this).css('background-color', NOBEL_COLOR);
                        $(this).css('color', 'black');
                    })
                .click(
                    function () {
                        if (TAG.Util.Splitscreen.isOn()) {
                            root.find("#filterByKeywords").click();
                        }
                        doSearch(true);
                    });
            searchButtonListItem.append(searchButton);
            prizeSelectList.append(searchButtonListItem);*/



            // Finally, add the list of select elements to the keywords div.
            keywordsDiv.append(selectList);
            root.find('#prizes').append(prizeSelectList);
            
            keywordsDiv.css('width', '20%');



            // Now run the dropdowncheclist jQuery library to turn the select elements into basic dropdown lists.
            if (IS_WINDOWS) {
                MSApp.execUnsafeLocalFunction(function () { // You got a deathwish, Truant?
                    root.find('select.keywordsSelect').dropdownchecklist({
                        maxDropHeight: $('#tagRootContainer').height() / 2, // Max height of dropdown box is half of TAG's height
                        closeRadioOnClick: true // After selecting AND/NOT, the dropdown should close automatically.
                    });
                });
            } else {
                root.find('select.keywordsSelect').dropdownchecklist({
                    maxDropHeight: $('#tagRootContainer').height() / 2, // Max height of dropdown box is half of TAG's height
                    closeRadioOnClick: true // After selecting AND/NOT, the dropdown should close automatically.
                });
            }

            root.find('select.keywordsSelect').hide().css({
                'display': 'none',
                'opacity': '0'
            });
            
            // Unfortunately, the dropdownchecklists are minimally stylized, so we need to do some cleaning up. 

            // Format the dropdown selector box (what you click on to make dropdown appear).
            var elementHeight = searchInput.innerHeight(); // Get the height of the search bar. We want the dropdowns to match it.
            if (!IS_WINDOWS){
                //make them a bit taller on the web
                elementHeight = elementHeight * 1.4;
            }
            var selector;
            root.find('.ui-dropdownchecklist-selector').each(function (index, element) {
                selector = $(element);
                var maxW;
                if (previewing) {                    
                    selector.css({ 'max-width': $("#setViewViewer").width() * 0.095 + 'px' });
                } else {
                    //if (index % 2 === 0) {
                        //maxW = $("#tagRoot").width()*0.04 + 'px';
                    //} else {
                        maxW = $("#tagRoot").width()*0.12 + 'px';
                    //}
                    selector.css({ 'max-width': maxW });
                }
                // Set the text inside the selector box.
                //if (index % 2 == 0) {
                    // Even numbered dropdowns are operator dropdowns. //NOPE NOT ANYMORE
                    /*selector.find('.ui-dropdownchecklist-text') // Get the text span element.
                        .css('display', 'inline') // Make it inline so the div with our dropdown arrow will be inline.
                        .css('color', '#000') // Make the text black. TAG defaults spans to light gray.
                        .css('width','auto');
                    selector.parent().parent().find('input').hide();//.css('opacity', '0'); // TODO: hiding the radio button creates bug where clicking item twice allows empty selection.
                    */
                //} else {
                    // Odd numbered dropdowns are for keywords.
                   // var setIndex = (index - 1) / 2; // 1 --> 0, 3 --> 1, 5 --> 2, etc.
                    var setName = (keywordSets[index].name !== '') ? keywordSets[index].name : 'untitled set';
                    selector.text(setName); // Change the inner text of this selector element to category title.
                    // Note: here we do not change the '.ui-dropdownchecklist-text' element (as we do above) to eliminate the functionality of updating
                    // the selector with selected text. I.e., when a user selects a keyword, the selector box text will not change to that keyword, 
                    // it will stay as the category title. 

                    // Set the width of keywords dropdowns and make overflowing text have an ellipsis.
                    selector.css('width','auto') 
                              .css('overflow', 'hidden')
                              .css('text-overflow', 'ellipsis');
                //}

                // Further stylization of selector box.
                selector.parent().css('height', elementHeight + 'px'); // This element uses padding, so we actually change the height of its parent, a wrapper span. 
                selector.css('color', '#000'); // Make the text black.

                // Create a dropdown arrow.
                var downArrow = $(document.createElement('img')).attr('src', tagPath + 'images/icons/blackclose.svg').addClass('selector-dropdown').addClass('arrow')
                    .css({ 'width': ($("#tagRoot").width() * 0.01015) + 'px' });
                //adjust styling for web
                if (!IS_WINDOWS){
                    downArrow.css({'min-width': '5px'});
                }
                //adjust hard-coded size of drop down arrows if in previewer
                if (previewing) {
                    downArrow.css({ 'min-width': '0px', 'width': $("#setViewViewer").width() * 0.01015 + 'px', 'height': '35%','top': '0%'});
                }
                selector.parent().append(downArrow); // Add the arrow the selector box.
  
                if (TAG.Util.Splitscreen.isOn()) { //experimenting for splitscreen
                    if (index % 2 != 0) {
                        //set width of text element appropriately
                        var minKeywordWidth = $("#tagRoot").width()*0.058565;
                        var maxKeywordWidth = $("#tagRoot").width()*0.0732;
                        var elWidth = parseInt(selector.width());
                        if (elWidth > minKeywordWidth) {
                            if (elWidth > maxKeywordWidth) {
                               selector.css('width', maxKeywordWidth + 'px')
                            }
                        } else {
                            selector.css('width', minKeywordWidth + 'px');
                        }
                    } else {
                        //set widths of boolean drop downs
                        var booleanWidth = $("#tagRoot").width()*0.0366;
                        selector.parent().css('width', booleanWidth + 'px');
                    }
                                       
                    //add drop down arrow underneath text of keyword dropdown instead of on side
                    selector.parent().css('width', $(element).width());
                    selector.parent().css('height', $(element).parent().height()+ downArrow.height() + 'px'); //experimenting with splitscreen
                    downArrow.css({ 'float': 'none', 'top': '-25%' });
                } else {
                    var mult = 1.1
                    //if (index % 2 != 0) {
                        selector.parent().css({ 'width': $(element).parent().outerWidth() * mult + 'px' });
                    //}
                }

                //tool tip on mouseenter when ellipsis
                selector.bind('mouseenter', function () {
                    var $this = $(this);
                    if (this.offsetWidth < this.scrollWidth && !$this.attr('title')) {
                        $this.attr('title', $this.text());
                    }
                });

               selector.parent().parent().find('.ui-dropdownchecklist-dropcontainer-wrapper') // Once the width of the selector box is set...
                         .css({'width': selector.parent().outerWidth() + 'px'}); // Change the width of the actual dropdownchecklist to be the same.

            });
            
            //adjust styling for windows
            if (!IS_WINDOWS){              
                if (previewing) {
                    $(".selector-dropdown").css('top', '-4px');
                } else {
                    //$(".selector-dropdown").css('top', '-1px');
                }
            }

            var applyAndClear = $(document.createElement('ul')).addClass('rowLeft');

            // The last thing we do is add a search button. 
           /* var searchButtonListItem = $(document.createElement('li')).addClass('rowItem'); // Class keeps list inline and spaces items.
            var searchButton = $(document.createElement('div')).text('Apply')
                .attr('id', 'searchButton')
                .css('height', elementHeight + 'px')
                .hover(
                    function () {
                        if ($(this).attr('disabled') !== 'disabled') {
                            $(this).css('background-color', NOBEL_COLOR);
                            $(this).css('color', 'white');
                        }
                    }, function () {
                        $(this).css('background-color', NOBEL_COLOR);
                        $(this).css('color', 'black');
                    })
                .click(
                    function () {
                        if (TAG.Util.Splitscreen.isOn()) {
                            root.find("#filterByKeywords").click();
                        }
                        doSearch(true);
                    });
            searchButtonListItem.append(searchButton);*/
            //applyAndClear.append(searchButtonListItem);
            //keywordsDiv.append(applyAndClear);

            //ui fixes for when in previewer
            if (previewing) {
                $('li.rowItem').css('margin-left', '5px');
                $('.ui-dropdownchecklist-group').css('padding', '0.2px');
                $('#searchInput').css('height', '15px');
            }
            

            // If we are coming back and there was a previous search, execute that search.
            if (backSearch) {
                updateSearchInput(backSearch.searchText, backSearch.keywordSearchOptions);
                var emptySearch = backSearch.searchText === '';
                $.each(backSearch.keywordSearchOptions, function (setIndex, options) {
                    emptySearch = emptySearch && options.keywords.length === 0;
                });
                if (!emptySearch) {
                    var artworkToShow = {};
                    for (var prop in currentArtwork) {
                        if (currentArtwork.hasOwnProperty(prop)) {
                            artworkToShow[prop] = currentArtwork[prop];
                        }
                    }
                    doSearch(true, function () { showArtwork(artworkToShow);});
                }
            }
            
        } else {
            var divHeight = $('#leftContainer').height()/2;
            $('#leftContainer').css('margin-top', divHeight + 'px');
            $('#leftContainer').css('margin-bottom', divHeight + 'px');
      }

    }




    /**
     * Applies customization changes to main divs
     * @method applyCustomization
     */
    function applyCustomization() {
        var dimmedColor = TAG.Util.UI.dimColor(PRIMARY_FONT_COLOR,DIMMING_FACTOR);
        $('.primaryFont').css({
            'color': PRIMARY_FONT_COLOR,
            //'font-family': FONT
        });
        $('.secondaryFont').css({
            'color': SECONDARY_FONT_COLOR,
            //'font-family': FONT
        });
        $('.nextPrevCollection').css({
            'color' : dimmedColor
        })
    }

    /**
     * Shows collection and title
     * @method loadCollection
     * @param {jQuery obj} collection     the element currently being clicked
     * @param {Number} sPos               if undefined, set scroll position to 0, otherwise, use this
     * @param {doq} artwrk                if undefined, set currentArtwork to null, otherwise, use this
     */

    function loadCollection(collection, sPos, artwrk) {
        return function (evt) {
            var cancelLoad = false;
            assocMediaButton.css({ "color": TAG.Util.UI.dimColor(SECONDARY_FONT_COLOR, DIMMING_FACTOR) });
            assocMediaButton.attr('disabled', 'disabled');
            artworksButton.css({ "color": TAG.Util.UI.dimColor(SECONDARY_FONT_COLOR, DIMMING_FACTOR) });
            artworksButton.attr('disabled', 'disabled');
            var i,
                title = TAG.Util.htmlEntityDecode(collection.Name),
                nextTitle,
                prevTitle,
                mainCollection = root.find('#mainCollection'),
                titleBox = root.find('#collection-title'),
                collectionMedia = [],
                counter = 0,
                collectionLength,
                collectionDescription = $(document.createElement('div')),
                searchDescription = $(document.createElement('div')),
                dummyDot,
                dimmedColor = TAG.Util.UI.dimColor(SECONDARY_FONT_COLOR,DIMMING_FACTOR),
                str,
                text = collection.Metadata && collection.Metadata.Description ? TAG.Util.htmlEntityDecode(collection.Metadata.Description) : "" + "\n\n   ",
                progressCircCSS = {
                    'position': 'absolute',
                    'float'   : 'left',
                    'left'    : '12%',
                    'z-index' : '50',
                    'height'  : '20%',
                    'width'   : 'auto',
                    'top'     : '22%',
                };
            artworkShown = false;
            mainCollection.css({
                "text-align" : "center"
            });

            if (collection.Name === 'The Life of Alfred Nobel'){
                oneDeep = true;
                hideKeywords = true;
            }

            // if the idle timer hasn't started already, start it
            if (!idleTimer && evt && !previewing && !lockKioskMode && jQuery.data(document.body, "isKiosk") == true) { // loadCollection is called without an event to show the first collection
                var timerDuration = {
                    duration: idleTimerDuration ? idleTimerDuration : null
                }
                //idleTimer = TAG.Util.IdleTimer.TwoStageTimer(timerDuration);
                //idleTimer.start();
            }
            else if (idleTimer && evt && !previewing && !lockKioskMode && jQuery.data(document.body, "isKiosk") == true && idleTimerDuration) {
                var timerDuration = {
                    duration: idleTimerDuration
                }
                var timerStopped = idleTimer.isStopped();
                //idleTimer = TAG.Util.IdleTimer.TwoStageTimer(timerDuration);
                if (!timerStopped) {
                    //idleTimer.start();
                }
            }
            //Set background image
            if (collection.Metadata.BackgroundImage) {
                bgimage.css('background-image', "url(" + FIX_PATH(collection.Metadata.BackgroundImage) + ")");
            }
            //Change timeline shown based on saved metadata
            if (collection.Metadata.Timeline === "true" || collection.Metadata.Timeline === "false") {
                collection.Metadata.Timeline === "true" ? timelineShown = true : timelineShown = false;
            } else {
                timelineShown = true; //default to true for backwards compatibility
            }

            //adjust for nice vertical positioning
            if (!timelineShown && !onAssocMediaView) {
                root.find("#leftContainer").css('top', -($("#tagRoot").height() * 0.01945) + 'px');
            } else if (timelineShown && onAssocMediaView){
                root.find("#leftContainer").css('top', $("#tagRoot").height()*0.02 + 'px');
            }else {
                root.find("#leftContainer").css('top', '0px');
            }

            if (onAssocMediaView) {
                $('#keywords').css('visibility','hidden');
            } else {
                $('#keywords').css('visibility','visible');
            }

            //If on associated media view and there are no associated media with valid dates, hide the timeline
            if (onAssocMediaView && collection.collectionMediaMinYear===999999){
                timelineShown = false;
            }
            sortsDiv.empty();

            if (collection.Metadata.AssocMediaView && collection.Metadata.AssocMediaView === "true"){ 
                TAG.Worktop.Database.getAssocMediaIn(collection.Identifier, function (mediaDoqs) {
                    if (cancelLoad) return;
                    for (i=0;i<mediaDoqs.length;i++){
                        collectionMedia.push(mediaDoqs[i]);
                    }
                    collection.collectionMedia = collectionMedia;
                    if (sortByYear(collectionMedia,true).min()){
                        collection.collectionMediaMinYear = sortByYear(collectionMedia,true).min().yearKey;
                    }
                })   
            }

            // Clear search box
            searchTxt.text("");

            //re-display the magnifying glass icon
            searchInput.css({ 
                //'background-image': 'url("' + tagPath + '/images/icons/search icon.svg")',
                /*'border-radius': '6pt',
                'border-color': NOBEL_COLOR,
                'border-width': 'thin',
                'border-style': 'solid',
                'background-color': 'transparent',
                'color': NOBEL_COLOR */
            });
            searchBttn.attr('src', tagPath + 'images/icons/search_icon.svg').unbind('click');
            searchBttn.click(function () {
                doSearch(true);
            });

            // Clear catalog div (with info and artwork tiles)
            catalogDiv.empty();
            catalogDiv.stop();             

            // formatting adjustments during splitscreen mode 
            if (TAG.Util.Splitscreen.isOn()) {
                root.find('#collectionMenu').css('width', '70%');
                root.find('#backButtonArea').css('display', 'none');
            }
            else {
                root.find('#backButtonArea').css('display', 'auto');
            }
            if (!IS_WINDOWS) {
                root.find('#backButtonArea').css('position', 'relative');
            }

            /**
            // resize the size of the collection menu after exiting splitscreen mode
            $(document).click(function(event) {
                if (!TAG.Util.Splitscreen.isOn()) {
                    root.find('#collectionMenu').css('width','35%');
                }
            });
            **/
        
            makeOptionsClick();
            //hideCollectionMenu();   

            // Add collection title
            mainCollection.addClass('mainCollection');
            titleBox.text(title);

            var uiDocfrag = document.createDocumentFragment();
            collectionArea.css({
                "height" : "75%"
            })
            // for previewing purpose in the authoring mode so that the menu arrow position does not change
            if (!IS_WINDOWS && previewing) {
                // reduce the size of the dropdown menu when being previewed in authoring mode
                // to make the dropdown arrow menu appear in previewing mode for unpublished collections
                dropDownArrow.attr('src', tagPath + 'images/icons/Close.svg');
                dropDownArrow.addClass('arrow');    
            }


            titleBox.css({
                "display": "inline-block",
                "position": "relative",
                "padding-right": $("#tagRoot").width()*0.012+ "px",
                "height": "100%",
                "text-overflow": "ellipsis",
                "white-space": "nowrap",
                "font-family": "Cinzel"

            })
            centeredCollectionHeader.css({
                "text-align": "center",
                "display": "inline-block",
                "height": "90%",
                "top": "10%",
                "cursor": "pointer",
                "white-space" : "nowrap",
                'position': 'relative'
            }).off();
            centeredCollectionHeader.on('mousedown', function (j) {
                    if (visibleCollections.length > 1) {
                        return function () {
                            showCollectionMenu();
                        }
                    }
                }(collection));
            if (!IS_WINDOWS) {
                titleBox.css({
                    "padding-right": .165 * centeredCollectionHeader.height() + "px"
                });
                centeredCollectionHeader.css({ 'height': 'auto' });
            }
            if (IS_WINDOWS && previewing) {
                titleBox.css({
                    "padding-right": .133 * centeredCollectionHeader.height() + "px"
                })
            }
            dropDownArrow.css({
                'display': 'inline-block',
                'left': "auto",
                'position': "relative",
                'height': .55*centeredCollectionHeader.height()+"px",
                'width': .13344* centeredCollectionHeader.height() + 'px',
                'top' : "17%"
            });
            if (!IS_WINDOWS ) {
                dropDownArrow.css({
                    'height': .71625 * centeredCollectionHeader.height() + "px",
                    'width': .2066 * centeredCollectionHeader.height() + 'px',
                    'top': "18.5%",
                    'position':'absolute'
                });
            }
            if (!IS_WINDOWS && previewing){
                dropDownArrow.css({'top':'3.5%'});
            }
            dropDownArrow.attr('src', tagPath + 'images/icons/Close.svg');
            dropDownArrow.addClass('arrow');    

            if (visibleCollections.length < 2) {
                dropDownArrow.css({
                    "display": "none",
                    "opacity": "0",
                    "pointer-events": "none",
                    "cursor": "auto"
                });
                $("#centeredCollectionHeader").css({
                    "cursor": "auto",
                    "pointer-events": "none"
                })
                $("#collection-title").css({
                    "cursor": "auto",
                    "pointer-events": "none"
                })
            }
            else {
                dropDownArrow.css({
                    "display": "inline-block",
                    "opacity": "1",
                    "pointer-events": "auto",
                    "cursor": "pointer"
                });
                $("#centeredCollectionHeader").css({
                    "cursor": "pointer",
                    "pointer-events": "auto"
                })
                $("#collection-title").css({
                    "cursor": "pointer",
                    "pointer-events": "auto"
                })
            };

            // Add previous and next collection titles
            if (collection.prevCollectionIndex||collection.prevCollectionIndex===0){
                prevTitle = TAG.Util.htmlEntityDecode(visibleCollections[collection.prevCollectionIndex].Name)

                dropDownArrow.attr('src', tagPath + 'images/icons/Close.svg');
                dropDownArrow.addClass('arrow');    
                
            }

            
            collectionArea.append($(uiDocfrag));

            if (collection.prevCollectionIndex===null && !collection.nextCollectionIndex===null) {
                dropDownArrow.hide();
            }

            collectionDescription.attr('id', 'collectionDescription');
            collectionDescription.addClass('secondaryFont');
            collectionDescription.css({'word-wrap': 'break-word', "color": SECONDARY_FONT_COLOR});
            str = collection.Metadata.Description ? collection.Metadata.Description.replace(/\n\r?/g, '<br />') : "";
            collectionDescription.css({
                'font-size': 0.2 * TAG.Util.getMaxFontSizeEM(str, 1.5, 0.55 * $(infoDiv).width(), 0.915 * $(infoDiv).height(), 0.1),
            });
            collectionDescription.html(Autolinker.link(str, {email: false, twitter: false}));
            if (IS_WINDOWS) {
                if (collectionDescription) {
                    var links = collectionDescription.find('a');
                    links.each(function (index, element) {
                        $(element).replaceWith(function () {
                            return $.text([this]);
                        });
                    }); 
                }
            }
            searchDescription.attr('id', 'searchDescription');
            searchDescription.addClass('secondaryFont');
            searchDescription.css({
                "color": SECONDARY_FONT_COLOR,
                'font-size': 0.2 * TAG.Util.getMaxFontSizeEM(str, 1.5, 0.55 * $(infoDiv).width(), 0.915 * $(infoDiv).height(), 0.1),
                'max-height': '88%'
            });

            var clearSearchButton = $(document.createElement('div'))
                .addClass('secondaryFont')
                .attr('id', 'clearSearchButton')
                .css({
                    'color': 'black',
                    'background-color': NOBEL_COLOR,
                    'border-radius': '6pt',
                    
                    'font-size': 0.2 * TAG.Util.getMaxFontSizeEM(str, 1.5, 0.55 * $(infoDiv).width(), 0.915 * $(infoDiv).height(), 0.1),
                })
                .text('Clear search results')
                .hover(
                    function () {
                        if ($(this).attr('disabled') !== 'disabled') {
                            $(this).css({
                                'background-color': NOBEL_COLOR,
                                'color': 'white'
                            });
                        }
                    },
                    function () {
                        $(this).css({
                            'background-color': NOBEL_COLOR,
                            'color': 'black'
                        })
                    }

                )
                .click(function () {
                    searchInput.val('');
                    
                    searchTxt.text('');
                    clearKeywordCheckBoxes();
                    clearSearchResults();
                });

            //If there's no description, change UI so that artwork tiles take up entire bottom area
            infoDiv.css('width', '25%');
            if (collection.Metadata.Description && !onAssocMediaView) {
                infoDiv.css('margin-left', '0%'); 
            } else { 
                infoDiv.css('margin-left', '-25%');
            }

            // Hide selected artwork container, as nothing is selected yet
            popupOverlay.css('display', 'none');
            selectedArtworkContainer.css('display', 'none');


            tileDiv.empty();
            catalogDiv.append(tileDiv);
            infoDiv.empty();
            infoDiv.append(searchDescription);
            infoDiv.append(clearSearchButton);
            infoDiv.append(collectionDescription);
            catalogDiv.append(infoDiv);
            timelineArea.empty();
            //timelineArea.css({ "bottom": $("#tagRoot").height() * 0.020 + 'px' });
            styleBottomContainer();

            //Show loading circle
            tileCircle = TAG.Util.showProgressCircle(catalogDiv, progressCircCSS, catalogDiv.width()/2, catalogDiv.height()/2, true);
            catalogDiv.append(tileCircle);

            if (collection.Metadata.AssocMediaView && collection.Metadata.AssocMediaView === "true"){
                filtersDiv.css('display','inline');
                divideDiv.css('display','inline');
                artworksButton.off()
                              .on('mousedown', function () {
                                  //artworksButton.css('color', SECONDARY_FONT_COLOR);
                                  //assocMediaButton.css('color', dimmedColor);
                                  if (onAssocMediaView && !infoDiv.is(':animated')) {
                                      onAssocMediaView = false;
                                      artworkShown = false;
                                      clearSearchResults();
                                      clearKeywordCheckBoxes();
                                     // $('#keywords').show();
                                      loadCollection(currCollection)();
                                  }
                              });

                assocMediaButton.off()
                                .on('mousedown', function () {
                                    //artworksButton.css('color', dimmedColor);
                                    //assocMediaButton.css('color', SECONDARY_FONT_COLOR);  
                                    if (!onAssocMediaView && !infoDiv.is(':animated')) {
                                        onAssocMediaView = true;
                                        clearSearchResults();
                                        clearKeywordCheckBoxes();
                                        currentArtwork && hideArtwork(currentArtwork)()
                                      //  $('#keywords').hide();
                                        loadCollection(currCollection)();
                                    }
                                });
            } else {
                doNothing(collection.Metadata);
                filtersDiv.css('display','none');
                divideDiv.css('display','none');
            }
           
            currCollection = collection;
            currentArtwork = artwrk || null;
            //loadCollection.call($('#collection-'+ currCollection.Identifier), currCollection);
            //scrollPos = sPos || 0;
            applyCustomization();
            if (!onAssocMediaView || !currCollection.collectionMedia) {
                getCollectionContents(currCollection, function () { addKeywords(); }, function () { return cancelLoad;});
            } else {
                if (onAssocMediaView && artworkInCollectionList.length == 0) {
                    TAG.Layout.Spoof().getLaureates(
                        function (contents) {
                            artworkInCollectionList = [];
                            for (var i = 0; i < contents.length; i++) {
                                artworkInCollectionList.push(contents[i].Identifier);
                            }
                            loadSortTags(currCollection, currCollection.collectionMedia)
                            initSearch(currCollection.collectionMedia);
                            createArtTiles(currCollection.collectionMedia);
                            addKeywords();
                        });
                } else {
                    loadSortTags(currCollection, currCollection.collectionMedia)
                    initSearch(currCollection.collectionMedia);
                    createArtTiles(currCollection.collectionMedia);
                    addKeywords();
                }
            }
            cancelLoadCollection = function () { cancelLoad = true; };

        }
    }
    this.loadCollection = loadCollection;

    //For when buttons from collection Menu are clicked
    function loadPage(index) {
        prepareNextView();
        loadCollection(visibleCollections[index])();
    }

    /**
     * To make the dropdown menu a list of clickable buttons that correspond to collections
     * @method makeOptionsClick
     */
    function makeOptionsClick() {
        var menu,
            menuArray,
            arrow;

        menu = $(root).find('#collectionMenu');
        arrow = $(root).find('#dropDownArrow');
        menuArray = [];

        if (!menuCreated) {
            for (var i = 0; i < visibleCollections.length; i++) {
                var para = $(document.createElement("div"))
                    .css({
                        'height': '25%',
                        'text-align': 'center',
                        'overflow':'ellipsis'
                    });
                var txtNode = document.createTextNode(TAG.Util.htmlEntityDecode(visibleCollections[i].Name));
                menuArray[i] = document.createElement("BUTTON");
                menuArray[i].setAttribute("id", i);
                $("#" + i).addClass('secondaryFont');
                menuArray[i].style.border = "none";
                menuArray[i].style.fontSize = "100%";
                menuArray[i].style.padding = ".5%";
                menu.append(para);

                menuArray[i].onclick = function () {
                    loadPage(this.id);
                    showCollectionMenu();
                }
                para.append(menuArray[i]);
                menuArray[i].appendChild(txtNode);
            }
            menuCreated = true;
        }
    }

    /**
     * Helper function to show/hide dropdown collection menu
     * @method showCollectionMenu
     */
    function showCollectionMenu() {
        var menu,
            arrow;

        if (!showOtherCollections){
            return;
        }
        menu = $(root).find('#collectionMenu');
        arrow = $(root).find('#dropDownArrow');

        var w = (root.width() - menu.width()) / 2;
        menu.css({
            "left" : w+"px"
        })

        if (menu.css('display') == 'block') {
            menu.css({
                'display':'none'
            });
            arrow.css({
                'transform':'rotate(270deg)',
                'webkitTransform':'rotate(270deg)'
            });
        } else {
            menu.css({
                'display':'block'
            });
            arrow.css({
                'transform':'rotate(90deg)',
                'webkitTransform':'rotate(90deg)'
            });
        };

    }

    /**
     * Hide the dropdown collection menu if the user clicks something outside the menu
     * @method hideCollectionMenu
     */
    /*function hideCollectionMenu() {
        var menu,
            arrow;
        menu = document.getElementById('collectionMenu');
        arrow = document.getElementById('dropDownArrow');
        $(root).click(function(event) {
            if (event.target.id != 'dropDownArrow' && event.target.id !='collection-title' && event.target.id != 'centeredCollectionHeader' && !$(event.target).parents().andSelf().is("#collectionMenu")) {
                if (menu.style.display == 'block') {
                    doNothing("here " + event.target.id)
                    menu.style.display = 'none';
                    arrow.style.transform = 'rotate(270deg)';
                    arrow.style.webkitTransform = 'rotate(270deg)';
                }
            }
        });
    }*/

    /**
     * Helper function to load first collection
     * @method loadFirstCollection
     */
    function loadFirstCollection() {
        loadCollection(toShowFirst, null,currentArtwork && currentArtwork)();
    }

    /*helper function to load sort tags
        * @method loadSortTags
        * @param {Object} collection
        * @param {Object} contents (of collection, to check for tours)  
        */
    function loadSortTags(collection,contents) {
        var sortOptions = [],
            sortButton,
            sortButtonTags = {}; 
        if (!onAssocMediaView && collection.Metadata.SortOptions) {
            var sortOptionsObj = JSON.parse(collection.Metadata.SortOptions || "{}");
            /*TAG.Worktop.Database.getDoq(collection.Metadata.SortOptionsGuid, function getSortOptions(sortOptionsDoq){
            var sortObjects = sortOptionsDoq.Metadata,
                sortText,
                sortObjArray;
            if (sortObjects){
                for (var sortObj in sortObjects){
                    if (sortObjects.hasOwnProperty(sortObj) && sortObj !== "__Created" && sortObj !== "Count") {
                        if (sortObj.charAt(0) === '?') {
                            sortText = sortObj.substr(1);
                        } else {
                            sortText = sortObj;
                        }
                        sortObjArray = sortObjects[sortObj].split(",");
                        if ((sortObjArray.length === 2 && sortObjArray[1] === "true" || sortObjArray[1] === true)
                                        || (sortObjArray[0] === true || sortObjArray[0] === "true")) {
                            sortOptions.push(sortText);
                        }
                    }
                }
            }*/
            for (var sortTag in sortOptionsObj){
                if (sortOptionsObj[sortTag] === true) {
                    sortOptions.push(sortTag);
                    //sortTag.style.marginTop = "30%";
                }
            }
            appendTags();
            //});
        } else if (onAssocMediaView){
            sortOptions = ["Date","Title"];
            appendTags();
        } else {
            sortOptions = ["Date", "Title", "Artist"];
            /*if (!sortCatalog(contents,"Tour").isEmpty()){
                sortOptions.push("Tour");
            }*/
            appendTags();
        }
        /**Callback function to create the sort tag buttons
        * @method appendTags
        */
        function appendTags() {
            var i,
                text;
            //buttonRow.empty();
            sortsDiv.empty();
            sortsDiv.css("display", "none");
            var uiDocfrag = document.createDocumentFragment();
            var rowList = $(document.createElement('ul')).addClass('rowLeft').addClass('sortRowLeft');
            rowList.attr('id', 'rowListDivThing');
            for (i = 0; i < sortOptions.length; i++) {
                var listItem = $(document.createElement('li')).addClass('rowItem');
                
                sortButton = $(document.createElement('div'));
                // uiDocfrag.appendChild(sortButton[0]);
                //Because stored on server as "Tour" but should be displayed as "Tours"
                sortOptions[i]==="Tour" ? text = "Tours" : text = sortOptions[i];
                if ((sortOptions[i] === "Title") && titleIsName){
                    text = "Name";
                }
                if (sortOptions[i]==="Citizenship 1"){
                    text = "Primary Citizenship";
                }
                sortButton.addClass('secondaryFont');
                sortButton.addClass('rowButton').addClass('sortButton')
                            .text(text)   
                            .attr('id', sortOptions[i].toLowerCase() + "Button")
                         .off()
                            .on('mousedown', function () {
                                //currentArtwork = null;
                                doNothing($(this).attr('id'));
                                doNothing(sortButtonTags[$(this).attr('id')]);
                                changeDisplayTag(currentArtworks, sortButtonTags[this.textContent == "Tours" ? 'Tour' : this.textContent]);
                                $(this).css('color', NOBEL_COLOR);
                            });
               
                //var spec = {
                //    height: .7,
                //    width:1,
                //    center_v: true,
                //};
                //var newPos = TAG.Util.constrainAndPosition(0, buttonRow.height(), spec); // give a random width cuz when try to get the centered yPos, width doesn't matter
                //sortButton.css("top", newPos.y + 'px');
                //sortButton.css("height", newPos.height + 'px');
                //buttonRow.append(sortButton);
                sortButtonTags[text == "Tours" ? 'Tour' : text] = sortOptions[i];
                listItem.append(sortButton);
                rowList.append(listItem);

                //Sort telemetry register
                TAG.Telemetry.register(sortButton, 'mousedown', 'SortOptions', function (tobj) {
                    tobj.sort_type = sortButtonTags[text == "Tours" ? 'Tour' : text].toLowerCase();
                    tobj.current_collection = currCollection.Identifier;
                });
            }
            uiDocfrag.appendChild(rowList[0]);
            sortsDiv.append($(uiDocfrag));
            if (!comingBack || !currentTag) {
                //If currentTag not defined currentTag is either 'year' or 'title' depending on if timeline is shown
                if (timelineShown && (sortOptions.indexOf('Date')>=0)) {
                    currentTag = "Date";
                    currentDefaultTag = "Date";
                } else if (sortOptions.indexOf('Title')>=0) {
                    currentTag = "Title";
                    currentDefaultTag = "Title";
                } else {
                    //if no year or title sort currentTag is first sortButton, or null if there are no sortOptions.
                    sortOptions[0] ? currentTag = sortOptions[0] : currentTag = null;
                    currentDefaultTag = currentTag;
                }
            }
            colorSortTags(currentTag);
        }

    }
    /**
     * Get contents (artworks, videos, tours) in the specified collection and make catalog
     * @method getCollectionContents
     * @param {doq} collecion         the collection whose contents we want
     * @param {Function} callback     a function to call when the contents have been retrieved
     */
    function getCollectionContents(collection, callback, cancel) {
        TAG.Layout.Spoof().getLaureates(contentsHelper);
        //TAG.Worktop.Database.getArtworksIn(collection.Identifier, contentsHelper, null, contentsHelper);

        /**
         * Helper function to process collection contents
         * @method contentsHelper
         * @param {Array} contents     array of doq objects for each of the contents of this collection
         */
        function contentsHelper(contents) {
            artworkInCollectionList = [];
            for (var i = 0; i < contents.length; i++){
                artworkInCollectionList.push(contents[i].Identifier);
            }
            if (!contents.length) {
                var emptyCollectionDiv = $(document.createElement('div'));
                emptyCollectionDiv.addClass("primaryFont");
                emptyCollectionDiv.text("There are no artworks in this collection at present.");
                emptyCollectionDiv.css({ "text-align": "center", "margin-top": "20%", "color": PRIMARY_FONT_COLOR });
                catalogDiv.append(emptyCollectionDiv);
            }
            if (cancel && cancel()) return;
            loadSortTags(collection, contents);
            initSearch(contents);
            createArtTiles(contents, cancel);
            callback && callback();
        }

        
    }

    /**
         * Store the search strings for each artwork/tour
         * @method initSearch
         * @param {Array} contents    the contents of this collection (array of doqs)
         */
    function initSearch(contents) {
        var info,
            i,
            cts;

        searchInput[0].value = "";
        infoSource = [];
        keywordDictionary = [];

        // Normal metadata
        $.each(contents, function (i, cts) {
            if (!cts) {
                return false;
            }
            info = ((cts.Name) ? cts.Name : "") + " " + ((cts.Metadata.Artist) ? cts.Metadata.Artist : "") + " " + ((cts.Metadata.Year) ? cts.Metadata.Year : "") + " " + ((cts.Metadata.Description) ? cts.Metadata.Description : "") + " " + ((cts.Metadata.Type) ? cts.Metadata.Type : "");
            if (cts.Metadata) {
                $.each(cts.Metadata, function (field, fieldText) {           //Adding custom metadata fields: both keys and values
                    info += " " + field;
                    info += " " + fieldText;
                });
            }
            infoSource.push({
                "id": i,
                "keys": info.toLowerCase()
            });
        });

        //make a dictionary that stores all the artworks that have this metadata



        // Keywords.
        // Get keywords from the server!
        keywordSets = TAG.Layout.Spoof().getKeywordSets(); //TO DO: GET KEYWORDS FROM SPOOF
        if (keywordSets) {
            // Build hash for keywords to artworks. Each set has dictionaries for AND and NOT.
            // keywordDictionary[setIndex].and["keyword"] --> [artworks with "keyword"] in set
            // keywordDictionary[setIndex].not["keyword"] --> [artworks without "keyword"] in set
            $.each(keywordSets, function (setIndex, set) {
                // Create dictionaries.
                keywordDictionary.push({ "and": {}, "not": {} });
                $.each(keywordSets[setIndex].keywords, function (keywordIndex, keyword) {
                    keywordDictionary[setIndex].and[keyword] = []; // Empty dictionary for and.
                    keywordDictionary[setIndex].not[keyword] = []; // Empty dictionary for not.
                });
            });

            //  Fill the dictionaries.
            $.each(contents, function (i, cts) {
                if (!cts) {
                    return false;
                }
                // Get the info.
                info = ((cts.Name) ? cts.Name : "") + " " + ((cts.Metadata.Artist) ? cts.Metadata.Artist : "") + " " + ((cts.Metadata.Year) ? cts.Metadata.Year : "") + " " + ((cts.Metadata.Description) ? cts.Metadata.Description : "") + " " + ((cts.Metadata.Type) ? cts.Metadata.Type : "");
                if (cts.Metadata) {
                    $.each(cts.Metadata, function (field, fieldText) {           //Adding custom metadata fields: both keys and values
                        info += " " + field;
                        info += " " + fieldText;
                    });
                }

                // Create a dictionary of each set for this artwork. Just an object that has a field for every keyword the artwork has, arbitrarily set to 'true'
                var set1 = (cts.Metadata.KeywordsSet1) ? cts.Metadata.KeywordsSet1.split(',') : [''], set1Lookup = {};
                $.each(set1, function (i, word) { set1Lookup[word] = 'true'; });
                var set2 = (cts.Metadata.KeywordsSet2) ? cts.Metadata.KeywordsSet2.split(',') : [''], set2Lookup = {};
                $.each(set2, function (i, word) { set2Lookup[word] = 'true'; });
                var set3 = (cts.Metadata.KeywordsSet3) ? cts.Metadata.KeywordsSet3.split(',') : [''], set3Lookup = {};
                $.each(set3, function (i, word) { set3Lookup[word] = 'true'; });

                // Fill the AND and NOT dictionaries for set 1. Each artwork appears in one of the two dictionaries for each keyword: AND if an artwork has a keyword, NOT if, well, not. 
                $.each(keywordSets[0].keywords, function (keywordIndex, keyword) {
                    var op = (set1Lookup[keyword] === 'true') ? 'and' : 'not';
                    keywordDictionary[0][op][keyword].push({ "id": i, "keys": info.toLowerCase() });
                });
                // Fill the AND and NOT dictionaries for set 2.
                $.each(keywordSets[1].keywords, function (keywordIndex, keyword) {
                    var op = (set2Lookup[keyword] === 'true') ? 'and' : 'not';
                    keywordDictionary[1][op][keyword].push({ "id": i, "keys": info.toLowerCase() });
                });
                // Fill the AND and NOT dictionaries for set 3.
                $.each(keywordSets[2].keywords, function (keywordIndex, keyword) {
                    var op = (set3Lookup[keyword] === 'true') ? 'and' : 'not';
                    keywordDictionary[2][op][keyword].push({ "id": i, "keys": info.toLowerCase() });
                });
            });

        }
    }

    /*
     * Helper method to extract the details defining a keywords search.
     * @method getKeywordSearchOptions
     * @return      array of objects (one per set), each with format {"operation": [AND/NOT], "keywords": [array of checked keywords]}
     */
    function getKeywordSearchOptions() {
        keywordSearchOptions = [];

        for (var i = 0; i < keywordSets.length; i++) {
            var currentSet;
            if (i === 0) {
                currentSet = keywords0Selected;
            } else if (i === 1) {
                currentSet = keywords1Selected;
            } else { //i===2
                currentSet = keywords2Selected;
            }
            // Check to see if this set is shown.
            var setOption = {};
            /*if (keywordSets[i].shown !== 'true') {
                setOption['operation'] = '';
                setOption['keywords'] = [];
                keywordSearchOptions.push(setOption);
                continue;
            }*/

            // Find out if operation is AND or NOT.
            var operation = $(root.find('.operationSelect')[i]).find(':selected').text();
            if (operation === '') {
                operation = 'AND';
            }
            setOption['operation'] = operation.toLowerCase();

            // Extract keywords checked off for this set.


            var keywords = [];

            if (i < 2) {
                $(root.find('.keywordsMultiselect')[i]).find(':selected').each(function (i, selected) {
                    keywords.push($(selected).text().toLowerCase());
                    currentSet.push($(selected).text().toLowerCase()); //text of option that will be displayed
                });

            } else { // if (i === 2) //TO DO: Hardcode prize icons to correspond to 
                var keywords3 = TAG.Layout.Spoof().getKeywordSets()[2]; //TO DO: GET KEYWORDS FROM SPOOF
                var prizeKeywords = Object.getOwnPropertyNames(selectedPrizes);

                for (var j = 0; j < prizeKeywords.length; j++) {
                    var x;
                    if (prizeKeywords[j] === "physics") {
                        x = 0;
                    } else if (prizeKeywords[j] === "chemistry") {
                        x = 1;
                    } else if (prizeKeywords[j] === "medicine") {
                        x = 2;

                    } else if (prizeKeywords[j] === "literature") {
                        x = 3;
                    } else if (prizeKeywords[j] === "peace") {
                        x = 4;
                    } else {
                        x = 5;
                    }

                    keywords.push(keywords3.keywords[x]);

                }
            }

            setOption["keywords"] = keywords;
            keywordSearchOptions.push(setOption);

        }

        /*
        var prizeOptions = {};
        var prizekeywords = [];
        for (var i = 0; i < Object.getOwnPropertyNames(selectedPrizes).length; i++) {
            prizekeywords.push(Object.getOwnPropertyNames(selectedPrizes)[i]);
        }
        prizeOptions["keywords"] = prizekeywords;
        keywordSearchOptions.push(prizeOptions);*/

        //  console.log("keywordSearchOptions = " + keywordSearchOptions);

        return keywordSearchOptions;


    }

    function displaySelectedKeywords() {
        for (var i = 0; i < keywordSets.length; i++) {
            var currentSet;
            if (i === 0) {
                currentSet = keywords0Selected;
            } else if (i === 1) {
                currentSet = keywords1Selected;
            } else { //i===2
                currentSet = keywords2Selected;
            }

            // Check to see if this set is shown.
            var setOption = {};
            /*if (keywordSets[i].shown !== 'true') {
                setOption['operation'] = '';
                setOption['keywords'] = [];
                keywordSearchOptions.push(setOption);
                continue;
            }*/

            // Extract keywords checked off for this set.
            $(root.find('.keywordsMultiselect')[i]).find(':selected').each(function (i, selected) {
                
                //if it is not a duplicate!
                currentSet.push($(selected).text().toLowerCase()); //text of option that will be displayed
            });

        }
        return currentSet;

    }


    /**
     * Search collection using string in search input box
     * @method doSearch
     * @param {Boolean}         explicitSearch - true if the search is explicit, and we need to display results, even if no input was provided.
     */
    function doSearch(explicitSearch, callback) {

        var content = searchInput.val().toLowerCase(),
            matchedArts = [],
            unmatchedArts = [],
            i;

        if (content.length === 0 || !content.trim()) {
            searchBttn.attr('src', tagPath + 'images/icons/search_icon.svg').unbind('click');
            searchBttn.click(function () { doSearch(true) });
        } else {
            searchBttn.attr('src', tagPath + 'images/icons/x_icon.svg').unbind('click');
            searchBttn.click(function () {
                clearKeywordCheckBoxes();
                clearSearchResults();
                searchResultText.text('');
            });
        }

        // Clear the results description.
        root.find('#searchDescription').text('');
        root.find('#clearSearchButton').css({ 'display': 'none' });

        var keywordMatches = {}; // Object with fields keywordMatches['id'] === 'true' for matching artworks with that "id"
        if (keywordSets) {
            // Get the details of our keyword search. 
            keywordSearchOptions = getKeywordSearchOptions();

            // If no keywords are checked, don't do the keywords search.
            var doKeywordSearch = false;
            for (i = 0; i < keywordSearchOptions.length; i++) {
                doKeywordSearch = doKeywordSearch || (keywordSearchOptions[i]['keywords'].length > 0); // This cancels search if all categories are hidden, or if no keywords are checked
            }
            if (doKeywordSearch) {
                keywordMatches = keywordSearch(keywordSearchOptions);
            }
        }

        var doTextSearch = true;
        if (!content) {
            doTextSearch = false;
        }
        var keywordsInputEmpty = true;
        for (var i = 0; i < keywordSearchOptions.length; i++) {
            keywordsInputEmpty = keywordsInputEmpty && (keywordSearchOptions[i].keywords.length == 0);
        }
        var emptyExplicitSearch = !doTextSearch && keywordsInputEmpty && explicitSearch;
        if (!doTextSearch && keywordsInputEmpty && !explicitSearch) {
            searchTxt.text("");
            // If there is no description, hide the infoDiv.
            var description = currCollection.Metadata && currCollection.Metadata.Description ? TAG.Util.htmlEntityDecode(currCollection.Metadata.Description) : "" + "\n\n   ";
            if (description === "" + "\n\n   " || onAssocMediaView) {
                $("#searchButton").attr('disabled', 'disabled').css({
                    'background-color': NOBEL_COLOR,
                    'color': 'black'
                
                });
                $('#clearSearchButton').attr('disabled', 'disabled')
                    .css({
                        'background-color': NOBEL_COLOR,
                        'color': 'black'
                    });
                tileDiv.stop().animate({ 'left': '0%' }, 1000, function () { });
                infoDiv.stop().animate({ 'margin-left': '-25%' }, 1000, function () {
                    $("#searchButton").removeAttr('disabled');
                    $('#clearSearchButton').removeAttr('disabled');
                });
            }
            drawCatalog(currentArtworks, currentTag, 0, false, false);
            return;
        }

        for (i = 0; i < infoSource.length; i++) {
            if (((keywordsInputEmpty || keywordMatches[infoSource[i].id] === 'true') && (!doTextSearch || (doTextSearch && infoSource[i].keys.indexOf(content) > -1))) || emptyExplicitSearch) {
                matchedArts.push(currentArtworks[i]);
            } else {
                unmatchedArts.push(currentArtworks[i]);
            }
        }


        var searchDescriptionText = getSearchDescription(matchedArts, content, doTextSearch);
        if ((content.length === 0 || !content.trim()) && getKeywordSearchOptions().length===0) {
            searchResultText.text('');
            searchBttn.attr('src', tagPath + 'images/icons/search_icon.svg').unbind('click');
            searchBttn.click(function () {
                doSearch(true);
            });
        } else {
            searchResultText.text(searchDescriptionText); //TO DO: MAKE THIS DESCRIPTION ACCURATE
        }

        console.log("searchDescriptionText = " + searchDescriptionText);

        if (!comingBack) {
            var duration = ANIMATION_DURATION / 5;
            catalogDiv.animate({
                scrollLeft: 0
            }, duration, "easeInOutQuint", function () {
                if (currentArtwork) {
                    showArtwork(currentArtwork, multipleShown && multipleShown)();
                }
            });
        } else {
            if (currentArtwork) {
                showArtwork(currentArtwork, multipleShown && multipleShown)();
            }
        }
        root.find('#searchDescription').text(searchDescriptionText);
        root.find('#clearSearchButton').css({ 'display': 'block' });
        root.find('#collectionDescription').hide();
        var description = currCollection.Metadata && currCollection.Metadata.Description ? TAG.Util.htmlEntityDecode(currCollection.Metadata.Description) : "" + "\n\n   ";
        var animating = false;
        if (description === "" + "\n\n   " && tileDiv.css('left') !== infoDiv.width() + 'px') {
            animating = true;
            $('#searchButton').attr('disabled', 'disabled').css('background-color', NOBEL_COLOR);
            $('#clearSearchButton').attr('disabled', 'disabled')
                .css({
                    'background-color': NOBEL_COLOR,
                    'color': 'black'
                });
            tileDiv.stop().animate({ 'left': infoDiv.width() + 'px' }, comingBack ? 0 : 1000, function () { });
            infoDiv.stop().animate({ 'margin-left': '0%' }, comingBack ? 0 : 1000, function () {
                $('#searchButton').removeAttr('disabled');
                $('#clearSearchButton').removeAttr('disabled');
                if (callback) {
                    callback();
                }
            });
        }

        //searchTxt.text(matchedArts.length > 0 ? "Results Found" : "No Matching Results");
        searchResultsLength = matchedArts.length;
        TAG.Telemetry.recordEvent('Search', function (tobj) {
            tobj.search_text = searchTxt.text();
            tobj.current_collection = currCollection.Identifier;
            tobj.number_of_matches = matchedArts.length;
        });

        drawCatalog(matchedArts, currentTag, 0, true, explicitSearch);
        drawCatalog(unmatchedArts, currentTag, searchResultsLength, false, false);

        if (!animating && callback) {
            callback();
        }
    }

    function getSearchDescription(matchedArts, content, doTextSearch) {

        var optionTextDict = {};
        var andKeywordsString = '',
            notKeywordsString = '',
            andCount = 0,
            notCount = 0;

        var searchDescriptionText = 'You have  ' + matchedArts.length +
            ' result' + ((matchedArts.length == 1) ? '' : 's') +
            ((doTextSearch) ? (' for \'' + content + '\'') : '');

        var getSetListString = function (op, keywords) {
            if (op === '') return '';
            var listString = '';
            for (var i = 0; i < keywords.length; i++) {
                listString = listString + (((i == keywords.length - 1) && keywords.length != 1 ? ' or ' : ' ') + '\'' + keywords[i] + '\'' +
                    (((i == 0 && keywords.length == 2) || i == keywords.length-1) ? '' : ','));
                
            }
            //optionTextDict[op] = listString;
           

            return listString;
        };

        
        

        $.each(keywordSearchOptions, function (optionIndex, option) {
            var listString = getSetListString(option.operation, option.keywords);
            optionTextDict[option] = listString;
            keywordSearchOptions[0]["listString"] = listString;

            var resultsString = searchDescriptionText.trim().substr(searchDescriptionText.length - 7);
            var resultString = searchDescriptionText.trim().substr(searchDescriptionText.length - 6);
            console.log("resultsstring = " + resultsString);
            if (resultsString === "results" || resultString === "result") {
                searchDescriptionText = searchDescriptionText +
                    ((listString !== '') ? (' for ' + listString) : '');
            } else {
                searchDescriptionText = searchDescriptionText +
                    ((listString !== '') ? (' and' + listString) : '');
            }


        });
        searchDescriptionText = searchDescriptionText + '.';

        return searchDescriptionText;
    }

    /*
     * Method to get artworks that fit the quiery defined in keywordSearchOptions. 
     * @param   keywordSearchOptions  (see return value of getKeywordSearchOptions)
     */
    function keywordSearch(keywordSearchOptions, contents) {
        // Start with all artworks.
        var matches = {};
        $.each(infoSource, function (i, art) {
            matches[art.id] = 'true';
        });


        // Go through each set of keywords.
        $.each(keywordSearchOptions, function (setIndex, searchOptions) {
            // Ignore any hidden sets or sets not selected.
            if (searchOptions['keywords'].length === 0) {
                return;
            }

            if (searchOptions['operation'] === 'and') {
                var newMatches = {};
                var dict = keywordDictionary[setIndex].and;
                //console.log("length of dict is " + Object.keys(dict).length);
                // Go through each keyword that is checked in the set, provided by keywordSearchOptions.
                $.each(keywordSearchOptions[setIndex].keywords, function (checkedKeywordIndex, checkedKeyword) {
                    // Get all the artworks that have the checked keyword.
                    var artworks = dict[checkedKeyword];
                    // Go through each of these matching artworks and see that it already is part of our set
                    $.each(artworks, function (artworkIndex, artwork) {
                        if (matches[artwork.id] === 'true') {
                            newMatches[artwork.id] = 'true';
                        }
                    });
                });
                matches = newMatches;
            } else if (searchOptions['operation'] === 'not') {
                var dict = keywordDictionary[setIndex].and;
                // Go through each keyword that is checked in the set, provided by keywordSearchOptions.
                $.each(keywordSearchOptions[setIndex].keywords, function (checkedKeywordIndex, checkedKeyword) {
                    // Get all the artworks that have that keyword and remove them from the set of matches.
                    var artworks = dict[checkedKeyword];
                    // Go through each of the checked artworks 
                    $.each(artworks, function (artworkIndex, artwork) {
                        if (matches[artwork.id] === 'true') {
                            delete matches[artwork.id];
                        }
                    });
                });
            }
        });

        return matches;

    }


   /*
    * Method to toggle the set of selected prizes
    *
    */
    function toggleSelectedPrize(filter) {

        if (selectedPrizes.hasOwnProperty($(filter).data("category"))) { //Currently selected - need to un-select

            delete selectedPrizes[$(filter).data("category")];
            $(filter).data("image").css("border", "0px solid white");
            filter.data("selected", false)

        } else { //Currently unselected - need to select

            selectedPrizes[$(filter).data("category")] = true;
            $(filter).data("image").css("border", "2px solid white");
            filter.data("selected", true);
        }

        console.log(filter.data());
        console.log(Object.getOwnPropertyNames(selectedPrizes));
    }


    /*
     * Method to clear all the checked-off keyword boxes.
     * {method} clearSearchResults
     */
    function clearKeywordCheckBoxes() {
        keywordSearchOptions = [];
        root.find('.operationSelect :selected').each(function () { $(this).removeAttr('selected'); });
        root.find('.operationSelect').val('');
        root.find('.operationSelect').parent().find('span.ui-dropdownchecklist-text').each(function () { $(this).attr('title', 'AND').text('AND') });
        root.find('.keywordsMultiselect :selected').each(function () { $(this).removeAttr('selected'); });
        root.find('.keywordsMultiselect').val('');
        root.find('#keywords input:checkbox').each(function () { $(this).removeAttr('checked'); });
    }

    /**
     * Method to clear the results of a search.
     * {method} clearSearchResults
     */
    function clearSearchResults() {
        // Clear the search text.
        searchTxt.text("");
        searchBttn.attr('src', tagPath + 'images/icons/search_icon.svg').unbind('click');
        searchBttn.click(function () {
            doSearch(true);
        });
        searchInput.val('');


       /*searchInput.on('focusin', function () {
            searchInput.css({ 'background-image': 'none' });
        });


        searchInput.on('focusout', function () {
            if (!searchInput.val()) {
                searchInput.css({ 'background-image': 'url("' + tagPath + '/images/icons/search icon.svg")' });
            }
        });*/
        // Clear the results description.
        root.find('#searchDescription').text('');
        root.find('#clearSearchButton').css({ 'display': 'none' });
        root.find('#collectionDescription').show();

        if (currCollection) {
            // If there is no description, hide the infoDiv.
            var description = currCollection.Metadata && currCollection.Metadata.Description ? TAG.Util.htmlEntityDecode(currCollection.Metadata.Description) : "" + "\n\n   ";
            if (description === "" + "\n\n   ") {
                $('#searchButton').attr('disabled', 'disabled').css('background-color', NOBEL_COLOR);
                $('#clearSearchButton').attr('disabled', 'disabled');
                tileDiv.stop().animate({ 'left': '0%' }, 1000, function () { });
                infoDiv.stop().animate({ 'margin-left': '-25%' }, 1000, function () {
                    $('#searchButton').removeAttr('disabled');
                    $('#clearSearchButton').removeAttr('disabled');
                });
            }

            // See if we will need to redraw the timeline
            if (currCollection.Metadata.Timeline === "true" || currCollection.Metadata.Timeline === "false") {
                currCollection.Metadata.Timeline === "true" ? timelineShown = true : timelineShown = false;
            } else {
                timelineShown = true; //default to true for backwards compatibility
            }
        }

        //Clear prize filters
        for (var i = 0; i < prizeButtonArray.length; i++) {
            if (prizeButtonArray[i].data("selected") === true) {
                toggleSelectedPrize(prizeButtonArray[i]);
            }
        }


        drawCatalog(currentArtworks, currentTag, 0, false, true);
        
        keywordSearchOptions = [];
        searchResultsLength = null;
    }

    /**
     * Create tiles for each artwork/tour in a collection
     * @method createArtTiles
     * @param {Array} artworks     an array of doq objects
     */
    function createArtTiles(artworks, cancel) {
        currentArtworks = artworks;
        currentTag && colorSortTags(currentTag);
        drawCatalog(currentArtworks, currentTag, 0, null, true);

        var description = currCollection.Metadata && currCollection.Metadata.Description ? TAG.Util.htmlEntityDecode(currCollection.Metadata.Description) : "" + "\n\n   ";
        if (description === "" + "\n\n   ") {
            tileDiv.css({ 'left': '0%' });
        } else {
            tileDiv.css({ 'left': '25%' });
        }
        //drawCatalog(artworks, currentTag, 0);
    }

    /**
     * Draw the collection catalog
     * @method drawCatalog
     * @param {Array} artworks          the contents of the collection
     * @param {String} tag              current sorting tag
     * @param {Number} start            starting at start-th artwork total (note NOT start-th artwork in artworks)
     * @param {Boolean} onSearch        whether the list of artworks is a list of works matching a search term
     * @param {Boolean} redrawTimeline  whether to call clearTimeline. I didn't want to do it, but timeline code is such a mess. It's the only whey.
     */
    function drawCatalog(artworks, tag, start, onSearch, redrawTimeline) {
        if (!currCollection) {
            return;
        }

        if (start === 0) {
            loadQueue.clear();
            return drawHelper();
            
        } else {
            return drawHelper();
        }

        /**
         * helper function to perform the actual drawing (to make sure we deal with async correctly)
         * @method drawHelper
         */
        function drawHelper() {
            var sortedArtworks,
                minOfSort,
                currentWork,
                works,
                progressCircCSS,
                paddingDiv,
                circle,
                i, h, w, j;
            if (!tourIDsHash || tourIDsHash['collection'] !== currCollection) {
                tourIDsHash = [];
            }
            var tourDoqs = [];
            if (tourIDsHash && tourIDsHash['collection'] === currCollection) {
                gotTours(null,true)
            }
            else {
                TAG.Worktop.Database.getTours(gotTours, function (error) { console.log(error) }, function (error) { console.log(error) });
            }
            function gotTours(tours, bypass) {
                if (bypass) {
                    gotDoqs(true);
                }
                else{
                    for (var g = 0; g < tours.length; g++) {
                        var tour = tours[g]
                        TAG.Worktop.Database.getDoq(tour.Identifier, tourBack, function (error) { console.log(error) }, function (error) { console.log(error) });
                    }
                }
                function tourBack(doq) {
                    tourDoqs.push(doq);
                    if (tourDoqs.length === tours.length) {
                        gotDoqs();
                    }
                } 
                function gotDoqs(bypass2) {
                    if (!currCollection) {
                        return;
                    }
                    if (start === 0) {
                        loadQueue.clear();
                    }
                    if(!bypass2){
                        for (var l = 0; l < tourDoqs.length; l++) {
                            var a = JSON.parse(tourDoqs[l].Metadata.RelatedArtworks)
                            for (var k = 0; k < a.length; k++) {
                                tourIDsHash[a[k]] = true;
                            }
                        }
                    }
                    tourIDsHash['collection'] = currCollection;
                    if (!artworks || artworks.length === 0) {
                        tileCircle.hide();
                        if (onAssocMediaView) {
                            $("#assocMediaButton").css({ "color": SECONDARY_FONT_COLOR });
                            $("#artworksButton").css({ "color": TAG.Util.UI.dimColor(SECONDARY_FONT_COLOR, DIMMING_FACTOR) });
                        } else {
                            assocMediaButton.css({ "color": TAG.Util.UI.dimColor(SECONDARY_FONT_COLOR, DIMMING_FACTOR) });
                            artworksButton.css({ "color": SECONDARY_FONT_COLOR });
                        }
                        assocMediaButton.removeAttr('disabled');
                        artworksButton.removeAttr('disabled');
                        return;
                    }

                    if (tag) {
                        sortedArtworks = sortCatalog(artworks, tag);
                        minOfSort = sortedArtworks.min();
                        currentWork = minOfSort ? minOfSort.artwork : null;
                        works = sortedArtworks.getContents();
                    } else {
                        //If no sort options
                        works = artworks;
                        currentWork = artworks[0];
                    }
                    i = start;
                    h = catalogDiv.height() * 0.48;
                    w = h * 1.4;

                    tileDiv.empty();
                    tileDivHeight = tileDiv.height();

                    var lastVisibleTileNumber = works.length - 1;
                    for (var reverse = works.length - 1; reverse >= 0; reverse--) {
                        var currWork = works[reverse].artwork ? works[reverse].artwork.Metadata : works[reverse].Metadata
                        if (currWork.ContentType !== 'tour' || currWork.Private !== 'true') {
                            lastVisibleTileNumber = reverse;
                            break;
                        }
                    }
                    var hiddenTours = 0;
                    for (j = 0; j < works.length; j++) {
                        if (tag) {
                            if (works[j].artwork.Metadata.ContentType !== 'tour' || works[j].artwork.Metadata.Private !== "true") {
                                loadQueue.add(drawArtworkTile(works[j].artwork, tag, onSearch, i + j - hiddenTours, tourIDsHash[works[j].artwork.Identifier]===true,j === lastVisibleTileNumber));
                            }
                            else {
                                hiddenTours++;
                            }
                        }
                        else {
                            if (works[j].Metadata.ContentType !== 'tour' || works[j].Metadata.Private !== "true") {
                                loadQueue.add(drawArtworkTile(works[j], null, onSearch, i + j - hiddenTours, tourIDsHash[works[j].artwork.Identifier] === true, j === lastVisibleTileNumber));
                            }
                            else {
                                hiddenTours++;
                            }
                        }
                    }
                    if (works.length == 0) {

                        if (onAssocMediaView) {
                            assocMediaButton.css({ "color": SECONDARY_FONT_COLOR });
                            artworksButton.css({ "color": TAG.Util.UI.dimColor(SECONDARY_FONT_COLOR, DIMMING_FACTOR) });
                        } else {
                            assocMediaButton.css({ "color": TAG.Util.UI.dimColor(SECONDARY_FONT_COLOR, DIMMING_FACTOR) });
                            artworksButton.css({ "color": SECONDARY_FONT_COLOR });
                        }

                        assocMediaButton.removeAttr('disabled');
                        artworksButton.removeAttr('disabled');

                    }
                    loadQueue.add(function () {
                        if (works.length > 0) {
                            paddingDiv = $(document.createElement("div"))
                                .css({
                                    'height': "100%",
                                    "width": TILE_BUFFER,
                                    "pointer-events": "none",
                                    'position': 'absolute',
                                    "margin": "none",
                                    'left': tileDiv.children().eq(-1).position().left + tileDiv.children().eq(-1).width() // to get last child position
                                });
                            tileDiv.append(paddingDiv);
                        }
                    })
                    loadQueue.add(function () {
                        tileCircle.hide();
                    })
                    if (IS_WINDOWS) {
                        loadQueue.add(function () {
                            showArtwork(currentArtwork, multipleShown && multipleShown)();
                        })
                    }

                    //if (infoDiv.width()===0){
                    //    tileDiv.css({'margin-left':'2%'});
                    //} else{
                    //    tileDiv.css({'margin-left':'0%'});
                    //}
                    catalogDiv.append(tileDiv);
                    if (redrawTimeline) {
                        clearTimeline(artworks);
                    }

                }
            }
        }
    }
        
    /**
        * helper function to reset and clear timeline
        * @method drawHelper
        */
    function clearTimeline(artworks){
        timelineEventCircles = [];
        timelineTicks = [];
        scaleTicks = [];
        artworkYears = {};
        timelineArea.empty();
        if (currentTimeline){
            currentTimeline.stop(true, true);
            if (!comingBack) {
                currentArtwork = null;
            }
        }
        if (currTimelineCircleArea){
            currTimelineCircleArea.stop(true,true);
        }
        //Sort artworks by year and find the minimum and maximum
        var avlTree = sortByYear(artworks, true);

        //Hide timeline if there are no compatible dates-- mostly for backwards compatibility
        if (avlTree.min().yearKey >= 999999 || (currCollection && currCollection.Metadata.Timeline && currCollection.Metadata.Timeline === 'false')) {
            timelineShown = false;
            if (!comingBack) {
                if ($('#titleButton')) {
                    currentTag = "Title";
                } else {
                    currentTag = currentDefaultTag || null;
                }
            }
            changeDisplayTag(artworks, currentTag);
            colorSortTags(currentTag);
        } else {
            timelineShown = true;
        }
        if (timelineShown && artworks) {
            initTimeline(artworks);
        }
        styleBottomContainer();
    }

    /* Helper method to style bottom container based on if timeline is shown
        * @method styleBottomContainer
        */
    function styleBottomContainer(){
        console.log('smallPreview' + smallPreview);
       /* if (timelineShown){   
                bottomContainer.css({
                    'height' : '75%',
                    'top' : '18%',
                    'z-index': '',
                });

        } else { //DO CHANGES HERE
            bottomContainer.css({
                'height': '100%',
                'top': '5%',
                'z-index': '100005',
                'margin-left': '4%'
            });

        }*/
        $("#bottomContainer").css({
            'scrollbar-face-color': NOBEL_WILL_COLOR,
            'scrollbar-arrow-color': 'transparent',
            'scrollbar-track-color': 'transparent',
        })
    }

    /**
     * Creates an artwork tile in a collection's catalog
     * @method drawArtworkTile
     * @param {doq} currentWork     the artwork/tour for which we're creating a tile
     * @param {String} tag          current sort tag
     * @param {Boolean} onSearch    whether this work is a match after searching
     * @param {Boolean} needsTourIcon    whether this work needs a small tour icon next to it
     * @param {Number} i            index into list of all works in this collection
     */
    var tileDivDocFrag = document.createDocumentFragment();
    tileDivDocFrag.appendChild(tileDiv[0]);
    function drawArtworkTile(currentWork, tag, onSearch, i, needsTourIcon,last) {
        return function () {
            var main = $(document.createElement('div')),
                artTitle = $(document.createElement('div')),
                artIcon = $(document.createElement('img')),
                artText = $(document.createElement('div')),
                tileImage = $(document.createElement('img')),
                yearTextBox = $(document.createElement('div')),
                yearText,
                tourLabel,
                videoLabel,
                //click,
                showLabel = true;
            //var uiDocfrag = document.createDocumentFragment();
            //uiDocfrag.appendChild(main[0]);

            if (twoDeep){
                yearTextBox.css('height','15%');
            }
            artIcon.addClass("artIcon")
            artworkTiles[currentWork.Identifier] = main;
            main.addClass("laureateTile");
            tileImage.addClass('tileImage');
            artTitle.addClass('laureateTitle');
            //artTitle.append(artIcon);
            
            artText.addClass('laureateText');
            //artText.addClass('secondaryFont');
            artText.css({
                'color': NOBEL_COLOR,
                //'font-family': FONT
            });
            yearTextBox.addClass('yearTextBox');
            yearTextBox.addClass('secondaryFont');
            yearTextBox.css({
                'color': SECONDARY_FONT_COLOR,
                //'font-family': FONT
            });
            if (oneDeep){
                artTitle.css({
                    'font-size': '150%',
                    'background-color': 'rgb(254, 161, 0.8)',
                    'height': '10%',
                    'font-family': 'sourcesans'
                });
                yearTextBox.css({
                    'height': '10%',
                    'vertical-align': 'middle',
                })
            }

            /* @function doubleClickHandler
                * Opens artwork directly on double click
                * Basically, sets a timeout during which the artwork can be clicked again to be opened
                * @returns handler function
                */
            function doubleClickHandler() {
                return function () {
                    if (currentWork.Metadata.Type === "Artwork" || currentWork.Metadata.ContentType === "tour" || currentWork.Metadata.Type === "VideoArtwork") {

                        if (previouslyClicked === main) {
                            //click = "double";
                            switchPage(currentWork, null, getContainerLeft(currentWork, false))();

                            //TELEMETRY

                            //RECORD ARTWORK PREVIEWER CLOSE FOR TELEMETRY
                            if (currCollection.Name !== "The Life of Alfred Nobel") {
                                TAG.Telemetry.recordEvent('ArtworkPreviewer', function (tobj) {
                                    tobj.is_assoc_media_view = onAssocMediaView;
                                    tobj.click_type = "double";
                                    tobj.selected_artwork = currentWork.Identifier;
                                    tobj.is_tour = false;
                                    if (currentWork.type === 'Tour') {
                                        tobj.is_tour = true;
                                    }
                                    tobj.current_collection = currCollection;
                                    tobj.tap_to_explore = false;
                                    tobj.close = false; //it was closed
                                    tobj.assoc_media = false;
                                    tobj.time_spent = global_artwork_prev_timer.get_elapsed(); //time spent in the previewer
                                    //doNothing(tobj.time_spent);
                                    //timer reset in showArtwork
                                    doNothing("DOUBLE CLICKED ON THE TILE");
                                });
                            }


                        } else {
                            //click = "single";
                            previouslyClicked = main;
                            setTimeout(function () { previouslyClicked = null }, 1000)
                        }
                    } else {
                        /*TAG.Worktop.Database.getArtworksAssocTo(currentWork.Identifier, function (doqs) {
                            if (previouslyClicked === main) {
                                //click = "double";
                                switchPage(doqs[0], currentWork, getContainerLeft(currentWork, false))();

                                //TELEMETRY

                                //RECORD ARTWORK PREVIEWER CLOSE FOR TELEMETRY
                                TAG.Telemetry.recordEvent('ArtworkPreviewer', function (tobj) {
                                    tobj.is_assoc_media_view = onAssocMediaView;
                                    tobj.click_type = "double";
                                    tobj.selected_artwork = currentWork.Identifier;
                                    tobj.is_tour = false;
                                    if (currentWork.type === 'Tour') {
                                        tobj.is_tour = true;
                                    }
                                    tobj.current_collection = currCollection;
                                    tobj.tap_to_explore = false;
                                    tobj.close = false; //it was closed
                                    tobj.assoc_media = false;
                                    tobj.time_spent = global_artwork_prev_timer.get_elapsed(); //time spent in the previewer
                                    //doNothing(tobj.time_spent);
                                    //timer reset in showArtwork
                                    doNothing("DOUBLE CLICKED ON THE ASSOC MEDIA TILE");
                                });


                            } else {
                                previouslyClicked = main;
                                //click = "single";
                                setTimeout(function () { previouslyClicked = null }, 1000);
                            }
                        }, function () {

                        }, function () {

                        }); */
                    }

                }();
            }
            main.on('click', function () {
                if (currCollection.Name === "The Life of Alfred Nobel") {
                    artworkSelected = true;
                    switchPage(currentWork, null, getContainerLeft(currentWork, false))();
                    return;
                }
                doubleClickHandler()

                // if the idle timer hasn't started already, start it
                /*if (!idleTimer && !previewing && !lockKioskMode) {
                    var timerDuration = {
                        duration: idleTimerDuration ? idleTimerDuration : null
                    }
                    idleTimer = TAG.Util.IdleTimer.TwoStageTimer(timerDuration);
                    //idleTimer.start();
                }
                else if (idleTimer && !previewing && !lockKioskMode && idleTimerDuration) {
                    var timerDuration = {
                        duration: idleTimerDuration
                    }
                    var timerStopped = idleTimer.isStopped();
                    idleTimer = TAG.Util.IdleTimer.TwoStageTimer(timerDuration);
                    if (!timerStopped) {
                        //idleTimer.start();
                    }
                } */
                //Timeout so that double click is actually captured at all (otherwise, it scrolls out of the way too quickly for second click to occur)
                setTimeout(function () { showArtwork(currentWork, false)() }, 10)
                zoomTimeline(artworkCircles[currentWork.Identifier])
                justShowedArtwork = true;
            })

            // Set tileImage to thumbnail image, if it exists
            if (needsTourIcon === true) {
                var icon = $(document.createElement('img'))
                icon.attr({
                    src: tagPath + 'images/tour_icon_nobel.svg'
                })
                icon.css({
                    'position': 'absolute',
                    'bottom': '0%',
                    'right': '0%',
                    'width': '29px',
                    'height' : '29px',
                    'background-color': 'transparent',
                    'z-index' : '500000'
                })
                main.append(icon);
            }
            if (currentWork.Metadata.Thumbnail && currentWork.Metadata.ContentType !== "Audio") {
                main.css('overflow', 'hidden');

                tileImage.attr("src", FIX_PATH(currentWork.Metadata.Thumbnail.FilePath));

                var w, h;
                $("<img/>") // preload the image to "crop" it
                    .attr("src", tileImage.attr("src"))
                    .load(function () {
                        w = this.width;
                        h = this.height;
                        var mainh = tileImage.height();
                        var mainw = tileImage.width();
                        if (mainw / mainh < w / h) {
                            mainh = tileImage.height();
                            var neww = w / h * mainh;
                            tileImage.css({
                                'height': mainh,
                                'width': neww,
                            });
                        } else {
                            mainw = tileImage.width();
                            var newh = h / w * mainw;
                            tileImage.css({
                                'width': mainw,
                                'height': newh,
                            });
                        }
                    });
            } else if (currentWork.Metadata.ContentType === "Audio") {
                tileImage.css('background-color', 'black');
                tileImage.attr('src', tagPath + 'images/audio_thumbnail.svg');
            } else if (currentWork.Metadata.Medium === "Video" || currentWork.Metadata.ContentType === "Video" || currentWork.Metadata.ContentType === "iframe") {
                showLabel = false;
                tileImage.css('background-color', 'black');
                tileImage.attr('src', tagPath + 'images/video_thumbnail.svg');
            } else if (currentWork.Metadata.ContentType === "Image") {
                if (currentWork.Metadata.Thumbnail) {
                    tileImage.attr("src", FIX_PATH(currentWork.Metadata.Thumbnail));
                } else if (currentWork.Metadata.Source) {
                    tileImage.attr("src", FIX_PATH(currentWork.Metadata.Source));
                } else {
                    tileImage.attr("src", tagPath + 'images/image_icon.svg');
                }
            } else if (currentWork.Type === "Empty" || currentWork.Type === "Tour" || currentWork.Metadata.Type === "Tour" || currentWork.Metadata.ContentType === "Tour") {
                tileImage.css('background-color', 'black');
                if (currentWork.Metadata.Thumbnail) {
                    tileImage.attr('src', FIX_PATH(currentWork.Metadata.Thumbnail));
                } else {
                    if (currentWork.Type == "Empty") {
                        //tileImage.attr('src', FIX_PATH("/Images/text_icon.svg"));
                        tileImage.attr('src', FIX_PATH("/Images/default.jpg"));
                    }
                    else {
                        tileImage.attr('src', FIX_PATH("/Images/default.jpg"));
                    }
                }
            } else {
                tileImage.attr("src", tagPath + 'images/no_thumbnail.svg');
            }

            var yellowTextFields = ['Category', 'Year of Award'];

            //TODO: DETERMINE TEXT, COLOR AND IMAGE BASED ON METADATA OF ACTUAL EXHIBIT IMAGES
            
            //var firstDiv = $(document.createElement("div")).text(TAG.Util.htmlEntityDecode(currentWork.Name));  TODO SPOOF CHANGE
            var firstDiv = $(document.createElement("div")).text(currentWork.Metadata.FirstName);
            var secondDiv = $(document.createElement("div")).text(currentWork.Metadata.LastName ? currentWork.Metadata.LastName : "");
            var prizeAndYearDiv = $(document.createElement("div"))

            if (currentWork && currentWork.Metadata) {
                var uppercasePrize = currentWork.Metadata.PrizeCategory.toUpperCase();
                prizeAndYearDiv.text(uppercasePrize + " " + currentWork.Metadata.Year);
            }
            else {
                prizeAndYearDiv.text("CATEGORY 9999")
            }


            firstDiv.addClass("laureateInfo");
            secondDiv.addClass("laureateInfo");
            prizeAndYearDiv.addClass("laureateInfo");

            // Add title
            if (tag === 'Title') {
            } else if (tag === 'Artist') {
                //var nameText = laureateInfo;
                //artText.text(laureateInfo);
            } else if (tag === 'Tours') {
            } else if (tag) {
            } else {
                //no sort tag
            }

            artText.append(firstDiv);
            artText.append(secondDiv);
            artText.append(prizeAndYearDiv);

            artTitle.append(artText);

            // Styling for searches
            var numKeywordsChecked = 0;
            $.each(keywordSearchOptions, function (setIndex, set) {
                numKeywordsChecked += keywordSearchOptions[setIndex].keywords.length;
            });
            artText.css('font-size', '.55em');
            artText.css('color', 'rgb(254,161,0)');

            artTitle.css('padding-top', '0%');




            //set the icon and color dynamically
            //TO DO: GET REAL METADATA OF ARTWORKS. DON'T SWITCH ON STRINGS. SORRY EVERYONE
            //ALSO GET REAL ICONS
            if (currentWork && currentWork.Metadata && currentWork.Metadata) {
                var category = currentWork.Metadata.PrizeCategory;

                if (category === "Physics" || category === "physics") {
                    artIcon.attr('src', tagPath + 'images/prize_icons/physics.svg');
                    artTitle.css('background-color', 'rgba(163, 168, 73, 0.8)');
                } else if (category === "Chemistry" || category === "chemistry") {
                    artIcon.attr('src', tagPath + 'images/prize_icons/chemistry.svg');
                    artTitle.css('background-color', 'rgba(153, 0, 53, 0.8)');
                } else if (category === "Medicine" || category === "medicine") {
                    artIcon.attr('src', tagPath + 'images/prize_icons/medicine.svg');
                    artTitle.css('background-color', 'rgba(60, 62, 111, 0.8)');
                } else if (category === "Literature" || category === "literature") {
                    artIcon.attr('src', tagPath + 'images/prize_icons/literature.svg');
                    artTitle.css('background-color', 'rgba(198, 121, 28, 0.8)');
                } else if (category === "Peace" || category === "peace") {
                    artIcon.attr('src', tagPath + 'images/prize_icons/peace.svg');
                    artTitle.css('background-color', 'rgba(0, 98, 144, 0.8)');
                } else if (category === "Economics" || category=== "economics") {
                    artIcon.attr('src', tagPath + 'images/prize_icons/economics.svg');
                    artTitle.css('background-color', 'rgba(91, 75, 34, 0.8)');
                }
            } else {
                artIcon.css('background-color', 'black');
                
            }

            //artText.css('opacity', '.7');


            artTitle.append(artIcon);
            if (!onSearch && (searchInput.val() !== '' || numKeywordsChecked !== 0)) {
                main.css({
                    //'opacity': '0.3'
                    'display': 'none'
                });
                
            } else if (onSearch) {
                main.css({
                    //'opacity': '1'
                    'display': 'block'
                });
            }
            main.hover(
                function () {
                    artText.css('color', 'white');
                },
                function(){
                    artText.css('color', 'rgb(254,161,0)');
                }
            )
            if (currCollection.Name !== "The Life of Alfred Nobel" || true) {
                main.append(tileImage)
                    .append(artTitle)
                    .append(yearTextBox);
            }
            else {
                main.append(tileImage)
            }
            if (currentWork.Type === "Empty" && currentWork.Metadata.ContentType !== "iframe" && currentWork.Metadata.Type !== "VideoArtwork") {
                if (currentWork.Metadata.ContentType == "tour" || currentWork.Metadata.ContentType == undefined) {
                    tourLabel = $(document.createElement('img'))
                        .addClass('tourLabel')
                        .attr('src', tagPath + 'images/tour_icon.svg');
                }
                else {
                    tourLabel = $(document.createElement('img'))
                        .addClass('tourLabel')
                        .attr('src', tagPath + 'images/icons/text_icon_2.svg');
                }
                main.append(tourLabel);
            } else if (currentWork.Metadata.Medium === "Video" || currentWork.Metadata.ContentType === "Video") {
                if (showLabel) {
                    videoLabel = $(document.createElement('img'))
                        .addClass('videoLabel')
                        .attr('src', tagPath + 'images/icons/catalog_video_icon.svg');
                    main.append(videoLabel);
                }
            }

            tileDiv.append(main);

            //base height off original tileDivHeight (or else changes when scroll bar added on 6th tile)
           /* if (!twoDeep) {
                if (oneDeep){
                    var tileHeight = (0.9) * tileDivHeight;  
                    main.css({ 'height': (0.9) * tileDivHeight });
                } else {
                    var tileHeight = (0.3) * tileDivHeight;  
                    main.css({ 'height': (0.3) * tileDivHeight });
                }
            } else { */
                var tileHeight = (0.23) * tileDivHeight;
                main.css({ 'height': (0.23) * tileDivHeight });
            //}
            main.css({ 'width': (tileHeight / TILE_HEIGHT_RATIO) * TILE_WIDTH_RATIO });
            // Align tile so that it follows the grid pattern we want

            /*if (!twoDeep) {
                if (oneDeep){
                    main.css({
                    'left': i * (main.width() + TILE_BUFFER),
                    'top': 0,
                });
                } else {
                    console.log("make fix here");
                main.css({
                    'left': Math.floor(i / 3) * (main.width() + TILE_BUFFER),
                    'top': Math.floor(i % 3) * (main.height() + TILE_BUFFER)
                });
                }
            } else { */

                main.css({
                    'left': Math.floor(i / 3) * (main.width() + TILE_BUFFER),
                    'top': Math.floor(i % 3) * (main.height() + TILE_BUFFER2)
                });
        //    }

            //Add scrollbar to catalog div if needed
            /**
            if (main.position().left + main.width() > main.parent().width()) {
                catalogDiv.css("overflow-x", "scroll")
            }      
            **/
            if (last) {
                if (onAssocMediaView) {
                    assocMediaButton.css({ "color": SECONDARY_FONT_COLOR });
                    artworksButton.css({ "color": TAG.Util.UI.dimColor(SECONDARY_FONT_COLOR, DIMMING_FACTOR) });
                } else {
                    assocMediaButton.css({ "color": TAG.Util.UI.dimColor(SECONDARY_FONT_COLOR, DIMMING_FACTOR) });
                    artworksButton.css({ "color": SECONDARY_FONT_COLOR });
                }

                assocMediaButton.removeAttr('disabled');
                artworksButton.removeAttr('disabled');
                displayArea.append($(tileDivDocFrag));
            }
        };
    }

    /** styles a circle for the timeline
    * @method styleTimelineCircle
    * @param  {HTML element} element      element to be styled
    * @param  {bool} selected             Whether or not circle is selected
    */
    function styleTimelineCircle(element, selected) {
        if (previewing) {
            EVENT_CIRCLE_WIDTH = root.width()/ 40; // for collections page preview in authoring
        }
        if (selected) {
            element.css({
                'height': EVENT_CIRCLE_WIDTH*3/2,
                'width': EVENT_CIRCLE_WIDTH*3/2,
                'border-radius': EVENT_CIRCLE_WIDTH*3 / 4,
                'top': -EVENT_CIRCLE_WIDTH*3 / 4,
                'opacity': "1"
            });
           element.timelineDateLabel.css({
                'visibility': 'visible',
                'color' : 'white',
                'font-size' : '110%',
                'bottom': "100%",
                'left': element.width()/2 - element.timelineDateLabel.width()*1.1 / 2
            }); 
        } else {
            element.css({
                'height': EVENT_CIRCLE_WIDTH,
                'width': EVENT_CIRCLE_WIDTH,
                'border-radius': EVENT_CIRCLE_WIDTH / 2,
                'top': -EVENT_CIRCLE_WIDTH / 2,
                'opacity': .5
            });
            element.timelineDateLabel.css({
                'color': 'rgb(170,170,170)',
                'font-size': "100%",
                'bottom': "100%",
                'left': EVENT_CIRCLE_WIDTH / 2 - element.timelineDateLabel.width() / 2
            });
        }
    }

    /**Initializes timeline for a collection of artworks
     * @method initTimeline
     * @param  {Array} artworks              list of artworks in the collection
     */
    function initTimeline(artworks) {
        var avlTree,
            maxNode,
            maxDate,
            minDate,
            timelineDate;
        if (!artworks || artworks.length === 0){
            return;
        };

        //Sort artworks by year and find the minimum and maximum
        avlTree = sortByYear(artworks, true);
        maxNode = avlTree.max();
        
        //Skip before tours and artworks with incompatible dates
        while (maxNode.yearKey >= 999999){
            maxNode = avlTree.findPrevious(maxNode);
        }

        maxDate = parseInt(maxNode.yearKey);
        minDate = parseInt(avlTree.min().yearKey);

        //Save the original maximum and minimum display date
        fullMaxDisplayDate = maxDate;
        fullMinDisplayDate = minDate;

        //TO-DO: calculate and pass in numTicks based on number of years
        currentTimeline = prepTimelineArea(minDate, maxDate);
        currTimelineCircleArea = prepTimelineCircles(avlTree, minDate, maxDate);
        setTimeout(function() {
            currentArtwork && zoomTimeline(artworkCircles[currentArtwork.Identifier]);
        }, 100);

        /**Helper function to prepare timeline area including 'ticks'
        * @method prepTimelineArea
        * @param  {Integer} minDate          minimum artwork date
        * @param  {Integer} maxDate          maximum artwork date
        * @param  {Integer} numTicks         optional specification for number of timeline ticks
        * @return {Object}  timeline         div representing timeline ticks 
        */
        function prepTimelineArea(minDate, maxDate){
            var timeline = $(document.createElement('div')),
                i,
                dateRange = maxDate - minDate,
                numTicks = 101,
                tick;

            timeline.addClass('timeline');
            timelineArea.append(timeline);

            //Create ticks
            for (i = 0; i < numTicks; i++) { 
                tick = $(document.createElement('div'));
                tick.addClass('timelineTick');
                tick.css({
                    'left' : (i/(numTicks-1)*100 - .05) + '%'
                });
                tick.Offset = i/numTicks;
                timeline.append(tick);
                timelineTicks.push(tick);
            }
            return timeline;
        }

        /**Helper function to prepare and append the timeline event circles
        * @method prepTimelineCircles
        * @param  {AVLTree} avlTree        avlTree for access to artworks in year order
        * @param  {Number}  minDate        minimum date of artworks in collection
        * @param  {Number}  maxDate        maximum date of artworks in collection
        */
        function prepTimelineCircles(avlTree, minDate, maxDate){
            var curr,
                timeRange,
                art,
                positionOnTimeline,
                eventCircle,
                timelineCircleArea = $(document.createElement('div')),
                yearText,
                timelineDateLabel,
                prevNode,
                circleOverlap,
                labelOverlap,
                zoomLevel = 1,
                currOffset;
            var uiDocfrag = document.createDocumentFragment();
            timeRange = maxDate - minDate;

            timelineCircleArea.addClass('timelineCircleArea');
            timelineArea.append(timelineCircleArea);

            curr = avlTree.min();
            art = curr.artwork;
       
            while (curr&& curr.yearKey<999999){
                if (!isNaN(curr.yearKey)){
                    positionOnTimeline = 100*(curr.yearKey - minDate)/timeRange;
                    var correctedPosition = (positionOnTimeline - 1.25);
                    //Create and append event circle
                    eventCircle = $(document.createElement('div'));
                    uiDocfrag.appendChild(eventCircle[0]);
                    eventCircle.addClass('timelineEventCircle')
                                .css('left', correctedPosition + '%')
                                .on('click', (function (art, eventCircle) {
                                    
                                    return function() {
                                            if (artworkShown === true && currentArtwork === art) {
                                                hideArtwork(art)();
                                                artworkShown = false;

                                            } else {
                                                if (!artworkTiles[art.Identifier]) {
                                                    return;
                                                }
                                                zoomTimeline(eventCircle)
                                                showArtwork(art,true)();
                                                artworkShown  = true;
                                            } 
                                        
                                    }      
                                })(art, eventCircle));
                    // timelineCircleArea.append(eventCircle);

                    //Shift circles left by half their width so they are centered on ticks
                    //TO-DO: add this back in so that it works with new animations (all relative positioning)
                    //eventCircle.css('left', eventCircle.position().left - LEFT_SHIFT + 'px');

                    yearText = getDateText(getArtworkDate(curr.artwork, true));

                    //Create and append timeline date labels
                    timelineDateLabel = $(document.createElement('div'))
                            .text(yearText)
                            .addClass('timelineDateLabel');
                    eventCircle.append(timelineDateLabel);

                    eventCircle.yearKey = curr.yearKey;
                    eventCircle.timelineDateLabel = timelineDateLabel;
                    eventCircle.Offset = positionOnTimeline/100;
                    eventCircle.artwork = art;                    
                    timelineEventCircles.push(eventCircle);
                    artworkCircles[curr.artwork.Identifier] = eventCircle;
                    displayLabels(eventCircle);
                    
                    if (!artworkYears[yearText]){
                        artworkYears[yearText] = [curr.artwork];
                    } else {
                        artworkYears[yearText].push(curr.artwork);
                    }
                }
                curr = avlTree.findNext(curr);
                if(curr) { art = curr.artwork; }

            }
            timelineCircleArea.append($(uiDocfrag));
            //Set intitial style of timeline event circles and set their zoomLevel
            for (var i = 0; i < timelineEventCircles.length; i++) { // Make sure all other circles are grayed-out and small
                timelineEventCircles[i].zoomLevel = getZoomLevel(timelineEventCircles[i]);
                styleTimelineCircle(timelineEventCircles[i], false);
                displayLabels(timelineEventCircles[i]);
                //Label of last circle should always be shown
                if (i === timelineEventCircles.length-1){
                    displayLabels(timelineEventCircles[i],null,i);
                }
            };

            return timelineCircleArea;

            function getZoomLevel(circle){
                var center = .5,
                    nextCircle = timelineEventCircles[timelineEventCircles.indexOf(circle) + 1],
                    prevCircle = timelineEventCircles[timelineEventCircles.indexOf(circle) - 1],
                    lastCircle = timelineEventCircles[timelineEventCircles.length - 1],
                    firstCircle = timelineEventCircles[0],
                    spacing = .05;
                    zoomLevel = 1;

                currOffset = center - circle.Offset;
                if ((location(lastCircle) - center) < center) { 
                    zoomLevel = (center)/(lastCircle.Offset - circle.Offset)
                }
                if (center - (location(firstCircle)) < center) { 
                    zoomLevel = (center)/(firstCircle.Offset - circle.Offset)
                }
                if(Math.abs(zoomLevel) === Infinity){
                    zoomLevel = 1
                };
                if (nextCircle && ((location(nextCircle) - center) < spacing) && (location(nextCircle) - center) > 0) { 
                    zoomLevel = (spacing)/(nextCircle.Offset - circle.Offset)
                }
                if (prevCircle && ((center - location(prevCircle)) < spacing) && (center - location(prevCircle)) > 0) { 
                    zoomLevel = (spacing)/(prevCircle.Offset - circle.Offset)
                }
                return Math.abs(zoomLevel);
            }
            function location(dot){
                return ((currOffset + dot.Offset)  - .5) * Math.abs(zoomLevel)  + .5;
            }
        };
    };

    function displayLabels(circ, selectedCircle, numCircles){
        var prevNode,
            labelOverlap,
            timelineDateLabel = circ.timelineDateLabel,
            nextCircle = timelineEventCircles[timelineEventCircles.indexOf(circ) + 1],
            prevCircle = timelineEventCircles[timelineEventCircles.indexOf(circ) - 1];

        //Decide whether to display labels:
        if (circ === timelineEventCircles[0]){
            timelineDateLabel.css('visibility', 'visible');
        }

        if (selectedCircle) { //sometimes need to reset visiblity of selected circle if there were two circles with same date
            selectedCircle.css('visibility', 'visible');
            selectedCircle.timelineDateLabel.css('visibility', 'visibility');
        }

        if (prevCircle){
            //Find the previous visible timeline label:
            while (timelineEventCircles[timelineEventCircles.indexOf(prevCircle) - 1] && prevCircle.timelineDateLabel.css('visibility')!=='visible'){
                prevCircle = timelineEventCircles[timelineEventCircles.indexOf(prevCircle) - 1];
            }
            //Check to see if the label of the current circle would overlap that of the previously labelled artwork:
            labelOverlap = labelsAreOverlapping(prevCircle.position().left, circ.position().left, prevCircle.timelineDateLabel.width()); 
            //Overlapping circles should only have 1 label: 
            if (prevCircle && !labelOverlap){
                timelineDateLabel.css('visibility', 'visible');
                //prevCircle.timelineDateLabel.css('visibility','visible');
            } else{
                timelineDateLabel.css('visibility', 'hidden');    
                if (numCircles && timelineEventCircles.indexOf(circ) === numCircles){
                    timelineDateLabel.css('visibility','visible');
                    prevCircle.timelineDateLabel.css('visibility','hidden');
                }          
            } 
        }

        for (var i = 0; i < timelineEventCircles.length; ++i) {
            if (selectedCircle && (Math.floor(timelineEventCircles[i].yearKey) === Math.floor(selectedCircle.yearKey)) && (timelineEventCircles[i] != selectedCircle)) {
               
                timelineEventCircles[i].css('visibility', 'hidden');
                timelineEventCircles[i].timelineDateLabel.css('visibility', 'hidden');  
            }        
        }
        
        
        
        // Always show current circle, and if there are other circles with the same date, hide them
        if (selectedCircle && circ.yearKey === selectedCircle.yearKey){ 
            if (circ === selectedCircle) {
                timelineDateLabel.css('visibility', 'visible');
                
            } else {
                timelineDateLabel.css('visibility', 'hidden'); 
            }
            return;
        };
    }
    
    function zoomTimeline(circle) {
        doNothing("zoom timeline called");
        var i,
            j,
            k,
            tick,
            tickTarget,
            center = .5,
            currOffset = circle ? center - circle.Offset : 0,
            zoomLevel = circle ? circle.zoomLevel : 1,
            circleTarget,
            otherCircle;

        for (i = 0; i < timelineEventCircles.length ; i++) {
            //if (!circle) {
                //doNothing("no particular circle to zoom on - all circles visible");
                timelineEventCircles[i].css('visibility', 'visible');
                timelineEventCircles[i].timelineDateLabel.css('visibility', 'visible');
            //}
            
                
            

            otherCircle = timelineEventCircles[i]
            circleTarget = location(otherCircle)
            otherCircle.stop();
            otherCircle.css({ "transition-property": "left", "transition-duration": "1s", "transition-timing-function": "ease-in-out" });
            otherCircle.css({ "-webkit-transition-property": "left", "-webkit-transition-duration": "1s", "-webkit-transition-timing-function": "ease-in-out" });
            otherCircle.css(            //ANIMATEALERT
                { "left": parseInt(circleTarget * otherCircle.parent().width()) - EVENT_CIRCLE_WIDTH * 15 / 20 });
            //When last animation done, loop through and hide/show date labels
            if (i === timelineEventCircles.length-1){
                otherCircle.on('webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd', function () {
                    doNothing("Webkit transition end now")
                    for (k=0; k < timelineEventCircles.length; k++){
                        displayLabels(timelineEventCircles[k], circle);
                        if (circle) {
                            doNothing("CIRCLE IS NOT NULL")
                            //  timelineEventCircles[k].css('visibility', 'visible');
                            //timelineEventCircles[k].timelineDateLabel.css('visibility', 'visible');
                        }
                        if (k===timelineEventCircles.length -1){
                           displayLabels(timelineEventCircles[k],null,k); 
                        }
                    }
                });
                //If last dot doesn't change position, transition event never fires, so use timeout
                if (otherCircle.position().left === parseInt(circleTarget * otherCircle.parent().width()) - EVENT_CIRCLE_WIDTH * 15 / 20){ 
                    setTimeout(function() {
                    for (k=0; k < timelineEventCircles.length; k++){
                        displayLabels(timelineEventCircles[k], circle);
                        if (k===timelineEventCircles.length -1){
                           displayLabels(timelineEventCircles[k],null,k); 
                        }
                    }
                    },1100); // timeout would need to be changed if animation time changed (should use transitionend event in other cases for slow connections)
                }
            }

            if (!circle) {
                timelineEventCircles[i].css('visibility', 'visible');
                timelineEventCircles[i].timelineDateLabel.css('visibility', 'visible');
            }

        }

        for (j = 0; j < timelineTicks.length; j++) {
            tick = timelineTicks[j]
            tickTarget = location(tick)
            tick.stop()
            tick.css({ "transition-property": "left", "transition-duration": "1s", "transition-timing-function": "ease-in-out" });
            tick.css({ "-webkit-transition-property": "left", "-webkit-transition-duration": "1s", "-webkit-transition-timing-function": "ease-in-out" });
            tick.css(               //ANIMATEALERT
                { "left": (tickTarget * 100) + "%" });
        }
         
        function location(dot){
            var target =  ((currOffset + dot.Offset)  - center) * zoomLevel  + center;
            return target;
        }


    }

    /*Helper function to determine if the labels of two event cirlces are overlapping
     * @method labelsAreOverlapping
     * @param  {Number} position1       left pixel position of the circle that is further left
     * @param  {Number} position2       left pixel position of the circle that is further right
     * @param  {Number} labelWidth      the width of the label of the circle that is further left
     * @return {Boolean}                whether the labels of the two circles are overlapping
     */
    function labelsAreOverlapping(position1, position2, labelWidth){
        //40% of labels width padding between labels for clarity 
        return Math.round(position1) + labelWidth*1.4 > position2;
    }

    /**
      * Close the pop-up outset box of an artwork preview in the collections page
      * @method hideArtwork
      * @param {doq} artwork        the artwork doq to be hidden
      */
    function hideArtwork(artwork) {
        return function () {
            var i;
            currentArtwork = null;
            if (selectedTile) {
                selectedTile.css('border-width','0px');
            }
            if (!artwork) {
                return;
            }
            popupOverlay.css('display', 'none');
            selectedArtworkContainer.animate({'opacity': 0}, ANIMATION_DURATION/5, function(){
                
                selectedArtworkContainer.css('display', 'none')
                
                });
            root.find('.tile').each(function (tileIndex, tile) {
                if (!searchResultsLength || tileIndex < searchResultsLength) { // If searchResultsLength is nul||undefined there was no search done.
                    $(this).css({
                        'opacity': '1',
                    });

                } else {
                    $(this).css('opacity', '0.2');
                }
            });
            if (artworkCircles[artwork.Identifier]){
                styleTimelineCircle(artworkCircles[artwork.Identifier], false);
            }
            zoomTimeline();

            for (var i = 0; i < timelineEventCircles.length; ++i) {
                doNothing("no particular circle to zoom on - all circles visible");
                timelineEventCircles[i].css('visibility', 'visible');
                timelineEventCircles[i].timelineDateLabel.css('visibility', 'visible');
            }
            catalogDiv.stop(true,false);
            artworkShown = false;

            //RECORD ARTWORK PREVIEWER CLOSE FOR TELEMETRY
            TAG.Telemetry.recordEvent('ArtworkPreviewer', function(tobj) {
                tobj.is_assoc_media_view = onAssocMediaView;
                tobj.click_type = "Single";
                tobj.selected_artwork = artwork.Identifier;
                tobj.is_tour = false;
                if(artwork.type === 'Tour') {
                    tobj.is_tour = true;
                }
                tobj.current_collection = currCollection;
                tobj.tap_to_explore = false; 
                tobj.close = true; //it was closed
                tobj.assoc_media = false;  
                tobj.time_spent = global_artwork_prev_timer.get_elapsed(); //time spent in the previewer
                //doNothing(tobj.time_spent);
                //timer reset in showArtwork
                // doNothing("ARTWORK PREVIEWER WAS CLOSED");
            });
            
        };
    }

    function getContainerWidth(artwork, showAllAtYear){
        var previewWidth,
            artworksForYear,
            containerWidth;
        artworksForYear = artworkCircles[artwork.Identifier] && artworkYears[artworkCircles[artwork.Identifier].timelineDateLabel.text()];
        if (smallPreview){
             previewWidth = (0.25) * $("#tagRoot").width();
        } else {
             previewWidth = (0.38) * $("#tagRoot").width();
        }      
        if (showAllAtYear && artworksForYear){
            containerWidth = (Math.min(($("#tagRoot").width()*.80), (artworksForYear.length) * previewWidth));///2;
        } else {
            containerWidth = (previewWidth);
        }
        return containerWidth || 0;
    }

    function getContainerLeft(artwork, showAllAtYear){
        var rootWidth,
            infoWidth,
            tileWidth,
            tilePos,
            shift,
            leftOffset,
            containerLeft;
            rootWidth = root.width();
            infoWidth = infoDiv.width();
            if (!(currCollection.Metadata.Description && !onAssocMediaView)) {
                infoWidth = 0;
            }
            if (comingBack && previewPos && !(TAG.Util.Splitscreen.isOn())){
                containerLeft = previewPos;
            } else {
                if (artworkTiles[artwork.Identifier]){
                    tileWidth = artworkTiles[artwork.Identifier].width();
                    tilePos = artworkTiles[artwork.Identifier].position().left;
                }
                shift = (getContainerWidth(artwork,showAllAtYear)-tileWidth)/2;
                leftOffset = parseFloat(tileDiv.css('margin-left')) + tilePos + infoWidth - catalogDiv.scrollLeft();
                //if artwork tile at beginning of window
                if (leftOffset < shift){
                    shift = 0;
                }
                //if there are more than 3 artworks associated with the date year
                if (showAllAtYear && artworkCircles[artwork.Identifier] && artworkYears[artworkCircles[artwork.Identifier].timelineDateLabel.text()].length >= 3){
                    selectedArtworkContainer.css("overflow-x", "scroll")
                    leftOffset = bottomContainer.width()/10
                    shift = 0;
                }
                //if artwork tile at end of window
                if (Math.ceil(leftOffset + tileWidth + TILE_BUFFER) >= rootWidth){ 
                   shift = shift*2 + TILE_BUFFER;
                }
                containerLeft = leftOffset - shift;
                }   
            return containerLeft || 0;
            }

    /**
     * Shows an artwork as an outset box and shows name, description, etc
     * @method showArtwork
     * @param {doq} artwork     the artwork doq to be shown
     * @param {showAllAtYear}       whether all of the artworks at a specific year should be shown
     */
    function showArtwork(artwork, showAllAtYear, justHighlight) {
        return function () {
            
            if (!artworkShown){ //FOR NOW - switching between artworks in the previewer does not 
                                //reset the timer, and the total time spent with the previewer
                                //open is recorded (this is only one event)
                //doNothing("restarting previewer timer");
                global_artwork_prev_timer.restart(); //restarts the previewer timer for telemetry
            }
            var rootWidth,
                infoWidth,
                tileWidth,
                //shift,
                //leftOffset,
                previewWidth,
                containerWidth,
                containerLeft,
                newScrollPos,
                duration,
                newTile,
                previewTile,
                firstDescSpan = $(document.createElement('div')),
                progressCircCSS,
                timelineDateLabel,
                circle,
                artworksForYear,
                closeButton,
                tilePos,
                i,
                currentThumbnail;

            if (!artwork) {
                return;
            }

            selectedArtworkContainer.off();

            if (artworkShown) {
                popupOverlay.css('display', 'none');
                selectedArtworkContainer.animate(
                        {"opacity": 0}, 
                        0, //JessF: took out animation fade in and out because it causes problems with double clicks
                        function () {
                            animateCatalogDiv();
                        }
                )
                
            } 
            else {
                animateCatalogDiv();
            }
                

        function animateCatalogDiv(){
            //scroll catalogDiv to center the current artwork
            if (selectedTile) {
                selectedTile.css({ 'border-width': '0px' });
                
            }
            catalogDiv.stop(true,false);
            rootWidth = root.width();
            infoWidth = infoDiv.width();
            if (comingBack && scrollPos) {
                console.log("coming back now!!");
                newScrollPos = scrollPos;
                duration = ANIMATION_DURATION/5;
            } else {
                if (artworkTiles[artwork.Identifier]){
                    tileWidth = artworkTiles[artwork.Identifier].width();       
                    tilePos = artworkTiles[artwork.Identifier].position().left; 
                }
                duration = ANIMATION_DURATION/3;
                newScrollPos = tilePos - rootWidth / 2 + infoWidth - TILE_BUFFER;
            }   

            if (newScrollPos<0){
                newScrollPos = 0;
            }
            //Don't animate if not actually scrolling
            if (parseInt(newScrollPos) === catalogDiv.scrollLeft()){
                duration = 0;
            }
            catalogDiv.animate({
                scrollLeft: newScrollPos
            }, duration, "easeInOutQuint", function(){
                //}, duration, null, function(){
                //center selectedArtworkContainer over current artwork thumbnail
                fillSelectedArtworkContainer();
                popupOverlay.css({'display': 'inline'});
                selectedArtworkContainer.css({
                    'display': 'inline',
                    'opacity':1
                });
                if (oneDeep) {
                        console.log("hiding selected Artwork Container")
                        selectedArtworkContainer.css({
                            'display': 'none'
                        });
                    //insert code to highlight orange
                        selectedTile = artworkTiles[artwork.Identifier];
                        artworkTiles[artwork.Identifier].css({ 'border': '5px solid #', 'opacity':'1' });
                   
                }
                
                
                if (showAllAtYear && artworkCircles[artwork.Identifier] && artworkYears[artworkCircles[artwork.Identifier].timelineDateLabel.text()].length >= 3) {
                    selectedArtworkContainer.css({
                        "overflow-x": "scroll"
                    });
                }
                //add back handlers
                if (selectedArtworkContainer[0].addEventListener) {
                    // IE9, Chrome, Safari, Opera
                    selectedArtworkContainer[0].addEventListener("mousewheel", 
                        function(e){
                            e.stopPropagation();
                        }, false);
                    // Firefox
                    selectedArtworkContainer[0].addEventListener("DOMMouseScroll",
                        function(e){
                            e.stopPropagation();
                        }, false);
                } else { 
                    // IE 6/7/8
                    selectedArtworkContainer[0].attachEvent("onmousewheel",
                        function(e){
                            e.stopPropagation();
                        }, false);
                }
                //selectedArtworkContainer.children().animate({"opacity": 1},ANIMATION_DURATION/5);
                scrollPos = tilePos;
                comingBack = false;
            });
        }
            currentArtwork = artwork;
            artworkSelected = true;
            artworkShown = true;
            multipleShown = showAllAtYear;

            // Set selected artwork to hide when anything else is clicked
            root.on('mouseup', function(e) {

                //TELEMETRY STUFF
                /*
                if (e.target.id.toString()){
                    previewer_exit_click = e.target.id.toString();
                    doNothing(previewer_exit_click);
                } else {
                    doNothing("closed previewer; target has no id");
                }
                */

                var subject = selectedArtworkContainer;
                if (e.target.id != subject.attr('id') && !$(e.target).hasClass('tileImage') &&!$(e.target).hasClass('timelineEventCircle') && !subject.has(e.target).length){    
                    if (artworkShown){
                        hideArtwork(currentArtwork)();
                    }
                }
            });

            function fillSelectedArtworkContainer(){
                //Set up elements of selectedArtworkContainer
                previewWidth = (0.66) * $("#tagRoot").width();

                selectedArtworkContainer.empty();

                closeButton = $(document.createElement('img'));
                closeButton.attr('src', tagPath + 'images/icons/x.svg');
                closeButton.text('X');
                closeButton.css({
                    'position': 'absolute',
                    'top': '1.5%',
                    'width': '6%',
                    'height': '6%',
                    'min-height': '15px',
                    'min-width': '15px',
                    'background-color': '',
                });
                closeButton.on('mousedown', function () {
                    hideArtwork(currentArtwork)();
                });
                
                artworksForYear = artworkCircles[artwork.Identifier] && artworkYears[artworkCircles[artwork.Identifier].timelineDateLabel.text()];
               
                //If there are multiple artworks that should all be shown, selectedArtworkContainer will contain all of them and be larger
               /* if (showAllAtYear && artworksForYear){
                    for (i = 0; i < artworksForYear.length; i++) {
                        newTile = createOnePreviewTile(artworksForYear[i],i);
                        newTile.css({
                            'left': (i * previewWidth) + 'px',
                            'width': previewWidth
                        });
                        if (i===0){
                            newTile.append(closeButton);
                        }
                    }
                    containerWidth = Math.min(($("#tagRoot").width()*.80), (artworksForYear.length) * previewWidth);
                } else { */
                    newTile = createOnePreviewTile(artwork,0);
                    newTile.css('left', '0%');
                    newTile.append(closeButton);
                    containerWidth = previewWidth;
                //}
            }

            /* Helper method to create a preview tile for an artwork and append to selectedArtworkContainer
             * @method createOnePreviewTile
             * @param {Object} artwork       //artwork to create preview tile for
             * @param {Number}  num            //number previewer it is if multiple
             * @return {Object} previewTile    //preview tile just created
             */
            function createOnePreviewTile(artwork, num){
                var previewTile,
                    infoWrapper,
                    titleSpan,
                    imgDiv,
                    spaceDiv,
                    nameDiv,
                    prizeDiv,
                    yearOfAwardDiv,
                    descriptionDiv,
                    iconDiv,
                    iconImg,
                    prevArrow,
                    nextArrow,
                    descSpan,
                    exploreTab,
                    exploreText,
                    exploreIcon,
                    infoText,
                    artistInfo,
                    artText,
                    yearInfo,
                    descText,
                    miniTilesHolder,
                    miniTile;
                //Entire tile
                previewTile = $(document.createElement('div')).attr('id', 'previewTile'); 
                previewTile.css({
                    'height': '100%',
                    'width' : '100%'
                })

                //Tile title
                titleSpan = $(document.createElement('div'))
                    .addClass('titleSpan')
                         .text(TAG.Util.htmlEntityDecode(artwork.Name))
                    .css({
                        'color': SECONDARY_FONT_COLOR,
                        'top' : '1%',
                        'font-family': 'Cinzel',
                    });


                var yellowTextFields = ['Category', 'Year of Award']//, 'Citizenship 1', 'Gender']
                var needsYellowText = true;
                var yellowTextTop = $(document.createElement('div'));
               // var yellowTextBottom = $(document.createElement('div'));
                var darkDiv = $(document.createElement('div'));;
                if (artwork.Metadata && artwork.Metadata.InfoFields) {
                    for (var k = 0; k < yellowTextFields.length; k++) {
                        if (Object.keys(artwork.Metadata.InfoFields).indexOf(yellowTextFields[k]) === -1) {
                            needsYellowText = false;
                            break;
                        }
                    }
                }
                else {
                    needsYellowText = false;
                }
               /* if (needsYellowText) {
                    yellowTextTop.css({
                        //'bottom': '12%',
                        'height': '8%',
                        'width': '100%',
                        'position': 'absolute',
                        'color': NOBEL_WILL_COLOR,
                        'background-color': 'transparent',
                        'text-align': 'center',
                        'font-weight' : '900',
                        'font-size': BASE_FONT_SIZE * 1 / 2 + 'em',
                    }).text(artwork.Metadata.InfoFields[yellowTextFields[0]].split(' ')[artwork.Metadata.InfoFields[yellowTextFields[0]].split(' ').length-1] + ', ' + artwork.Metadata.InfoFields[yellowTextFields[1]]);
                    yellowTextBottom.css({
                        'bottom': '2%',
                        'height': '8%',
                        'width': '100%',
                        'position': 'absolute',
                        'color': NOBEL_WILL_COLOR,
                        'background-color': 'transparent',
                        'text-align': 'center',
                        'font-weight': '900',
                        'font-size': BASE_FONT_SIZE * 1 / 2 + 'em'
                    }).text(artwork.Metadata.InfoFields[yellowTextFields[2]] + ', ' + artwork.Metadata.InfoFields[yellowTextFields[3]]);
                    darkDiv.css(
                        'bottom': '00%',
                        'height': '10%',
                        'width': '100%',
                        'position': 'absolute',
                        'background-color': 'rgba(0,0,0,.6)',
                    })
                    darkDiv.attr('id', 'darkDiv');
                }*/
                
                //Main Div that holds information in pop up
                infoWrapper = $(document.createElement('div')).attr('id', 'infoWrapper');

                //Smaller divs that hold information
                imgDiv = $(document.createElement('div')).attr('id','imgDiv');
                spaceDiv = $(document.createElement('div')).attr('id', 'spaceDiv');
                nameDiv = $(document.createElement('div')).attr('id', 'nameDiv').addClass('popupInfo');
                prizeDiv = $(document.createElement('div')).attr('id', 'prizeDiv').addClass('popupInfo');
                yearDiv = $(document.createElement('div')).attr('id', 'yearDiv').addClass('popupInfo');
                descriptionDiv = $(document.createElement('div')).attr('id', 'descriptionDiv').addClass('popupInfo');
                iconDiv = $(document.createElement('div')).attr('id', 'iconDiv');
                iconImg = $(document.createElement('img')).attr('id', 'iconDivImg');

                //Apply content to smaller divs
                imgDiv.css({
                    'background-image': 'url(' + FIX_PATH(artwork.Metadata.Thumbnail.FilePath) + ")",
                    'background-repeat': 'no-repeat',
                    'background-size': 'cover'
                })
                nameDiv.text((artwork.Metadata.FirstName + " " + (artwork.Metadata.LastName ? artwork.Metadata.LastName : "")).toUpperCase());

                if (artwork && artwork.Metadata) {
                    var category = artwork.Metadata.PrizeCategory;
                    prizeDiv.text(category);
                    yearDiv.text(artwork.Metadata.Year);


                    if (category === "Physics" || category==="physics") {
                        iconImg.attr('src', tagPath + 'images/prize_icons/physics.svg');
                    } else if (category === "Chemistry" || category=== "chemistry") {
                        iconImg.attr('src', tagPath + 'images/prize_icons/chemistry.svg');
                    } else if (category === "Medicine" || category === "medicine") {
                        iconImg.attr('src', tagPath + 'images/prize_icons/medicine.svg');
                    } else if (category === "Literature" || category === "literature") {
                        iconImg.attr('src', tagPath + 'images/prize_icons/literature.svg');
                    } else if (category === "Peace" || category === "peace") {
                        iconImg.attr('src', tagPath + 'images/prize_icons/peace.svg');
                    } else if (category === "Economics" ||category === "economics") {
                        iconImg.attr('src', tagPath + 'images/prize_icons/economics.svg');
                    }

                    descriptionDiv.text(artwork.Metadata.prizes[0].motivation);


                } else {
                    prizeDiv.text("PRIZE");
                    yearDiv.text("YEAR");
                    iconImg.attr('background-color', 'white');
                }

                iconDiv.append(iconImg)

                //imgDiv.append(darkDiv)
                darkDiv.append(yellowTextTop);//.append(yellowTextBottom);
                //Explore div
                exploreTab = $(document.createElement('div'))
                if (!onAssocMediaView) {
                    exploreTab.on('mousedown', function(){


                        (switchPage(artwork))();

                        //TELEMETRY

                        //RECORD ARTWORK PREVIEWER CLOSE FOR TELEMETRY
                        TAG.Telemetry.recordEvent('ArtworkPreviewer', function(tobj) {
                            tobj.is_assoc_media_view = false;
                            tobj.click_type = "Single";
                            tobj.selected_artwork = artwork.Identifier;
                            tobj.is_tour = false;
                            if(artwork.type === 'Tour') {
                                tobj.is_tour = true;
                            }
                            tobj.current_collection = currCollection;
                            tobj.tap_to_explore = true; 
                            tobj.close = false; //it was closed
                            tobj.assoc_media = false;  
                            tobj.time_spent = global_artwork_prev_timer.get_elapsed(); //time spent in the previewer
                            //doNothing(tobj.time_spent);
                            //timer reset in showArtwork
                            doNothing("TAP TO EXPLORE");
                        });

                    });
                } 

                //Explore text
                var whiteArrow = $(document.createElement('img'))
                whiteArrow.attr({
                    src: tagPath + 'images/icons/white_arrow.svg'
                })
                whiteArrow.css({
                    'height': '100%',
                    'top': '10%',
                    'right': '15%',
                    'width': '10%',
                    'bottom': '0%',
                    'position' : 'absolute',
                })
                exploreText = $(document.createElement('div'))
                    .css({
                        //"font-size": BASE_FONT_SIZE * 2 / 3 + 'em',
                        'border-radius': '6pt',
                        'font-size': '100%',
                        'width': '80%',
                        'float': 'bottom',
                        'background-color': NOBEL_WILL_COLOR,
                        'margin-left': '10%',
                        'color': 'black'

                    })
                    .attr('id','learnMoreDiv')
                    .text(onAssocMediaView ? "Select an Associated Artwork Below" : "Learn More");
                exploreText.hover(function () {
                    $(this).css('color', 'white');
                }, function () {
                    $(this).css('color', 'black')
                })


                exploreTab.css({
                    'top': '90%',
                    'height': '8%',
                    'position': 'absolute',
                    'text-align': 'center',
                    'width' : '100%'
                });
                //exploreText.append(whiteArrow);

                exploreTab.append(exploreText)

                //Thumbnail image

                currentThumbnail = $(document.createElement('img'))
                    .addClass('currentThumbnail');
                

                currentThumbnail.attr("src", FIX_PATH(artwork.Metadata.Thumbnail));

                /*if (artwork.Metadata.Thumbnail && artwork.Metadata.ContentType !== "Audio") {
                    currentThumbnail.attr("src", FIX_PATH(artwork.Metadata.Thumbnail));
                    //currentThumbnail = $(document.createElement('div'));
                    currentThumbnail.css({
                        'background': 'url(' + FIX_PATH(artwork.Metadata.Thumbnail ),
                        'background-size':'contain',
                        'height':'100%',
                    })
//                    background: url(url) no-repeat center;
                } else if (artwork.Metadata.ContentType === "Audio") {
                    currentThumbnail.css('background-color', 'black');
                    currentThumbnail.attr('src', tagPath + 'images/audio_thumbnail.svg');
                } else if (artwork.Metadata.Medium === "Video" || artwork.Metadata.ContentType === "Video" || artwork.Metadata.ContentType === "iframe") {
                        currentThumbnail.css('background-color', 'black');
                        currentThumbnail.attr('src', tagPath + 'images/video_thumbnail.svg');
                } else if (artwork.Metadata.ContentType === "Image") {
                    if (artwork.Metadata.Thumbnail) {
                        currentThumbnail.attr("src", FIX_PATH(artwork.Metadata.Thumbnail));
                    } else if (artwork.Metadata.Source) {
                        currentThumbnail.attr("src", FIX_PATH(artwork.Metadata.Source));
                    } else {
                        currentThumbnail.attr("src", tagPath + 'images/image_icon.svg');
                    }
                } else if (artwork.Type === "Empty" || artwork.Type === "Tour" || artwork.Metadata.Type === "Tour" || artwork.Metadata.ContentType === "Tour") {
                    currentThumbnail.css('background-color', 'black');
                    if (artwork.Metadata.Thumbnail) {
                        currentThumbnail.attr('src', FIX_PATH(artwork.Metadata.Thumbnail));
                    } else {
                        currentThumbnail.attr('src', FIX_PATH("/Images/default.jpg"));
                    }
                }else {
                    currentThumbnail.attr("src", tagPath + 'images/no_thumbnail.svg');
                }*/

                !onAssocMediaView && currentThumbnail.on('mousedown', function(){


                    (switchPage(artwork))();

                    //TELEMETRY

                    //RECORD ARTWORK PREVIEWER CLOSE FOR TELEMETRY
                    TAG.Telemetry.recordEvent('ArtworkPreviewer', function(tobj) {
                        tobj.is_assoc_media_view = false;
                        tobj.click_type = "Single";
                        tobj.selected_artwork = artwork.Identifier;
                        tobj.is_tour = false;
                        if(artwork.type === 'Tour') {
                            tobj.is_tour = true;
                        }
                        tobj.current_collection = currCollection;
                        tobj.tap_to_explore = true; 
                        tobj.close = false; //it was closed
                        tobj.assoc_media = false;  
                        tobj.time_spent = global_artwork_prev_timer.get_elapsed(); //time spent in the previewer
                        //doNothing(tobj.time_spent);
                        //timer reset in showArtwork
                        // doNothing("CLICKED ON THE ARTWORK TILE");
                    });

                });


                /*
                //Telemetry stuff
                TAG.Telemetry.register($("#currentThumbnail,#exploreTab"), 'mousedown', '', function(tobj) {
                    if (!artwork || !artworkSelected) {
                        return true; // abort
                    }
                    tobj.custom_1 = CryptoJS.SHA1(artwork.Name).toString(CryptoJS.enc.Base64);
                    tobj.ttype     = 'to_' + getWorkType(artwork);
                    tobj.mode = 'Kiosk'; 
                });
                */

                //Div for artist and year info, directly below image thumbnail
                infoText = $(document.createElement('div'))
                    .addClass('infoText');

                //Artist name
                artistInfo = $(document.createElement('div'))
                    .addClass('artistInfo')
                    .css({ 
                    'font-size': 11 * BASE_FONT_SIZE / 30 + 'em',
                    'color': SECONDARY_FONT_COLOR,
                    'font-style':'italic'
                    //'font-family': FONT
                });

                //Year of creation
                yearInfo = $(document.createElement('div'))
                    .addClass('yearInfo')
                    .css({ 
                    'font-size': 11 * BASE_FONT_SIZE / 30 + 'em',
                    'color': SECONDARY_FONT_COLOR,
                    'font-style': 'italic'
                    //'font-family': FONT
                });

                //Set texts of labels
                if (artwork.Type !== "Empty") {
                    artwork.Metadata.Artist ? artText = "" + artwork.Metadata.Artist : artText = ' ';
                    artistInfo.text(artText);
                    yearInfo.text(getDateText(getArtworkDate(artwork,false),true) || " ");
                } else {
                    if (artwork.Extension && artwork.Extension === 'tour') {
                        artistInfo.text("(Interactive Tour)");
                    }
                    yearInfo.text(" " );
                }

                //Bottom portion of the tile (with thumbnails, description, etc)
                tileBottom = $(document.createElement('div'))
                    .addClass('tileBottom');

                //Description of art
                num===0 ? descSpan = firstDescSpan: descSpan = $(document.createElement('div'));
                descSpan.addClass('descSpan');

                //Div for above description. First get the content.
                var descriptionContent = artwork.Metadata.Description ? artwork.Metadata.Description.replace(/\n/g, '<br />') : '';
                if (keywordSets && keywordSets[0] && keywordSets[0].keywords && keywordSets[0].shown && artwork.Metadata.KeywordsSet1) {
                    var artworksKeywordList = '';
                    $.each(artwork.Metadata.KeywordsSet1.split(','), function (keywordIndex, keyword) {
                        if (keywordSets[0].keywords.indexOf(keyword) > -1) {
                            artworksKeywordList = artworksKeywordList + ' ' + keyword + ',';
                        }
                    });
                    if (artworksKeywordList !== '') {
                        artworksKeywordList = artworksKeywordList.substring(0, artworksKeywordList.length - 1);
                        descriptionContent = descriptionContent + '<p><span>' + keywordSets[0].name + ':   </span>' + artworksKeywordList + '</p>';
                    }
                }
                if (keywordSets && keywordSets[1] && keywordSets[1].keywords && keywordSets[1].shown && artwork.Metadata.KeywordsSet2) {
                    var artworksKeywordList = '';
                    $.each(artwork.Metadata.KeywordsSet2.split(','), function (keywordIndex, keyword) {
                        if (keywordSets[1].keywords.indexOf(keyword) > -1) {
                            artworksKeywordList = artworksKeywordList + ' ' + keyword + ',';
                        }
                    });
                    if (artworksKeywordList !== '') {
                        artworksKeywordList = artworksKeywordList.substring(0, artworksKeywordList.length - 1);
                        descriptionContent = descriptionContent + '<p><span >' + keywordSets[1].name + ':   </span>' + artworksKeywordList + '</p>';
                    }
                }
                if (keywordSets && keywordSets[2] && keywordSets[2].keywords && keywordSets[2].shown && artwork.Metadata.KeywordsSet3) {
                    var artworksKeywordList = '';
                    $.each(artwork.Metadata.KeywordsSet3.split(','), function (keywordIndex, keyword) {
                        if (keywordSets[2].keywords.indexOf(keyword) > -1) {
                            artworksKeywordList = artworksKeywordList + ' ' + keyword + ',';
                        }
                    });
                    if (artworksKeywordList !== '') {
                        artworksKeywordList = artworksKeywordList.substring(0, artworksKeywordList.length - 1);
                        descriptionContent = descriptionContent + '<p><span >' + keywordSets[2].name + ':   </span>' + artworksKeywordList + '</p>';
                    }
                   
                }
                descText = $(document.createElement('div'))
                    .addClass('descText secondaryFontColor')
                    .html(Autolinker.link(descriptionContent, {email: false, twitter: false}))
                    .css({
                    'color': SECONDARY_FONT_COLOR,
                    //'font-family': FONT,
                    'font-size': "110%",
                    'height': '100%'
                });
                if (IS_WINDOWS) {
                    if (descText){
                        var links = descText.find('a');
                        links.each(function (index, element) {
                            $(element).replaceWith(function () {
                                return $.text([this]);
                            });
                        });
                    }
                   
                }

                function addAssociationRow(numberAssociatedDoqs){//depricated!
                    var tileSpacing;
                    if (numberAssociatedDoqs === 0){
                        miniTilesHolder.hide();
                        descSpan.css({"height": "92%"});
                        TAG.Util.removeProgressCircle(circle);
                    } else {
                        descSpan.css({'height':'33%'});
                        miniTilesLabel.text(onAssocMediaView ? "Artworks" : "Associated Media");
                        tileSpacing = miniTilesHolder.height()/10;
                        if (numberAssociatedDoqs* (miniTilesHolder.height() + tileSpacing) - tileSpacing > miniTilesHolder.width()){
                            prevArrow = $(document.createElement('img'))
                                .addClass("miniTilesArrow")
                                .attr('src', tagPath + 'images/icons/Close.svg')
                                .attr('id','prevMiniArrow')
                                .on('mousedown', function(){
                                        miniTilesHolder.stop();
                                        miniTilesHolder.animate({
                                        scrollLeft: miniTilesHolder.scrollLeft() - 50
                                    }, ANIMATION_DURATION/2)
                                });

                            nextArrow = $(document.createElement('img'))
                                .addClass("miniTilesArrow")
                                .attr('src', tagPath + 'images/icons/Open.svg')
                                .attr('id','nextMiniArrow')
                                .css('left', "94%")
                                .on('mousedown', function(){
                                    miniTilesHolder.stop();
                                    miniTilesHolder.animate({
                                    scrollLeft: miniTilesHolder.scrollLeft() + 50
                                }, ANIMATION_DURATION/2)
                            });
                            tileBottom.append(prevArrow);
                            tileBottom.append(nextArrow);
                       }
                    }
                }


                /**
                * @method addMediaMiniTiles
                * @param {Array} doqs    array of media or artworks doqs to with which the mini tiles are created
                */
               /* function addMiniTiles(doqs){
                    var src,
                        metadata,
                        thumb;
                    numberAssociatedDoqs = doqs.length;
                    var j = 0;
                    var defaultIndex = 0; //index of artwork you are taken to when you click "Select an Associated Artwork" in assoc media tab
                    //Loop through media doqs and create tiles from them
                    for (i = 0; i < doqs.length; i++) {
                        if (onAssocMediaView && artworkInCollectionList.indexOf(doqs[i].Identifier) == -1) {
                            if (i === defaultIndex) {
                                defaultIndex++;
                            }
                            continue;
                        }

                        src = '';
                        metadata = doqs[i].Metadata;
                        thumb = metadata.Thumbnail;

                        !onAssocMediaView && (doqs[i].artwork = artwork);

                        miniTile = $(document.createElement('img'))
                            .addClass('miniTile')
                            .css({
                                'width': .35 * (.45 * selectedArtworkContainer.height())
                            })
                            .on('mousedown', onAssocMediaView ? switchPage(doqs[i], artwork) : switchPage(artwork, doqs[i])
                                    /*function(){
                                        var func = onAssocMediaView ? (switchPage(doqs[i], artwork)) : (switchPage(artwork, doqs[i]));
                                        func();
                                    }
                                );

                        TAG.Telemetry.register(miniTile, "mousedown", "ArtworkPreviewer", function(tobj){
                            tobj.is_assoc_media_view = onAssocMediaView;
                            tobj.click_type = "Single";
                            tobj.selected_artwork = artwork.Identifier;
                            tobj.is_tour = false;
                            if(artwork.type === 'Tour') {
                                tobj.is_tour = true;
                            }
                            tobj.current_collection = currCollection;
                            tobj.tap_to_explore = false; 
                            tobj.close = false; //it was closed
                            tobj.assoc_media = true;  
                            tobj.time_spent = global_artwork_prev_timer.get_elapsed(); //time spent in the previewer
                            //doNothing(tobj.time_spent);
                            //timer reset in showArtwork
                            doNothing("CLICKED ON AN ASSOCIATED MEDIA");
                        });


                        miniTile.css('left', j * (miniTile.width() + miniTilesHolder.height() / 10));

                        switch (metadata.ContentType) {
                            case 'Audio':
                                src = tagPath + 'images/audio_icon.svg';
                                break;
                            case 'Video':
                                src = (thumb && !thumb.match(/.mp4/)) ? FIX_PATH(thumb) : tagPath + 'images/video_icon.svg';
                                break;
                            case 'iframe':
                                src = tagPath + 'images/video_icon.svg';
                                break;
                            case 'Text':
                                src = tagPath + 'images/text_icon.svg';
                                break;
                            case 'Image':
                                if (thumb) {
                                    src = FIX_PATH(thumb);
                                } else if (metadata.Source) {
                                    src = FIX_PATH(metadata.Source);
                                } else {
                                    src = tagPath + 'images/no_thumbnail.svg';
                                }
                                break;
                            default:
                                if (thumb) {
                                    src = FIX_PATH(thumb);
                                } else if (metadata.Source) {
                                    src = FIX_PATH(metadata.Source);
                                } else {
                                    src = tagPath + 'images/no_thumbnail.svg';
                                }
                                break;
                        }
                        if (onAssocMediaView && metadata.Type === "Artwork") {
                            if (thumb) {
                                src = FIX_PATH(thumb);
                            } else if (metadata.Source) {
                                src = FIX_PATH(metadata.Source);
                            } else {
                                src = tagPath + 'images/no_thumbnail.svg';
                            }

                        }
                        miniTile.attr("src", src);
                        miniTilesHolder.append(miniTile);                        
                        j++;
                    }

                    addAssociationRow(numberAssociatedDoqs); 
                    TAG.Util.removeProgressCircle(circle);

                    // hide previous and next arrows if artworks thumbnail <= 4
                    if (j <= 4) {
                        $('.miniTilesArrow').hide();
                    }

                    //Also add handlers to switch to first artwork if in assoc media view
                    if (onAssocMediaView) {
                        exploreTab.on('mousedown', function(){
                            (switchPage(doqs[defaultIndex], artwork, getContainerLeft(artwork, false)))();

                            //RECORD ARTWORK PREVIEWER CLOSE FOR TELEMETRY
                            TAG.Telemetry.recordEvent('ArtworkPreviewer', function(tobj) {
                                tobj.is_assoc_media_view = true;
                                tobj.click_type = "Single";
                                tobj.selected_artwork = artwork.Identifier;
                                tobj.is_tour = false;
                                if(artwork.type === 'Tour') {
                                    tobj.is_tour = true;
                                }
                                tobj.current_collection = currCollection;
                                tobj.tap_to_explore = false; 
                                tobj.close = false; //it was closed
                                tobj.assoc_media = true;  
                                tobj.time_spent = global_artwork_prev_timer.get_elapsed(); //time spent in the previewer
                                //doNothing(tobj.time_spent);
                                //timer reset in showArtwork
                                doNothing("CLICKED ON EXPLORE TAB (FIRST ARTWORK) IN ASSOCIATED MEDIA VIEW");
                            });

                        });
                        currentThumbnail.on('mousedown', function(){
                            (switchPage(doqs[0], artwork, getContainerLeft(artwork, false)))();


                            //RECORD ARTWORK PREVIEWER CLOSE FOR TELEMETRY
                            TAG.Telemetry.recordEvent('ArtworkPreviewer', function(tobj) {
                                tobj.is_assoc_media_view = true;
                                tobj.click_type = "Single";
                                tobj.selected_artwork = artwork.Identifier;
                                tobj.is_tour = false;
                                if(artwork.type === 'Tour') {
                                    tobj.is_tour = true;
                                }
                                tobj.current_collection = currCollection;
                                tobj.tap_to_explore = false; 
                                tobj.close = false; //it was closed
                                tobj.assoc_media = true;  
                                tobj.time_spent = global_artwork_prev_timer.get_elapsed(); //time spent in the previewer
                                //doNothing(tobj.time_spent);
                                //timer reset in showArtwork
                                doNothing("CLICKED ON THUMBNAIL (FIRST ARTWORK) IN ASSOCIATED MEDIA VIEW");
                            });

                        });
                    }
                }*/

                //Append everything
                infoText.append(artistInfo)
                        //.append(yearInfo);    depricated!

                //imgDiv.append(currentThumbnail)
                infoWrapper.append(imgDiv);
                infoWrapper.append(spaceDiv);
                infoWrapper.append(nameDiv);
                infoWrapper.append(prizeDiv);
                infoWrapper.append(yearDiv);
                infoWrapper.append(descriptionDiv);
                infoWrapper.append(iconDiv);
                previewTile.append(infoWrapper);

                

                descSpan.append(descText);
                tileBottom.append(descSpan);

                miniTilesLabel = $(document.createElement('div'))
                                    .addClass("miniTilesLabel");
                miniTilesHolder = $(document.createElement('div'))
                                    .addClass('miniTilesHolder');



                //selectedArtworkContainer.append(previewTile);
                selectedArtworkContainer.css({
                    'border': '2px solid '+NOBEL_WILL_COLOR,
                    'border-radius': '10px',
                })
                
                selectedArtworkContainer.append(previewTile);
                root.find('.tile').css('opacity','0.5');
  
                var numberAssociatedDoqs = 0;
                var tileLoadQueue = TAG.Util.createQueue();
                /*tileLoadQueue.add(function(){
                    onAssocMediaView && TAG.Worktop.Database.getArtworksAssocTo(artwork.Identifier, addMiniTiles, null, addMiniTiles);
                    !onAssocMediaView && TAG.Worktop.Database.getAssocMediaTo(artwork.Identifier, addMiniTiles, null, addMiniTiles);
                });*/

                return previewTile;         
            }

            for (i = 0; i < timelineEventCircles.length; i++) { // Make sure all other circles are grayed-out and small
                styleTimelineCircle (timelineEventCircles[i], false)
            };            

            // Make current circle larger and white           
            if (artworkCircles[artwork.Identifier]){
                styleTimelineCircle(artworkCircles[artwork.Identifier], true)
            }; 
                
            progressCircCSS = {
                'position': 'absolute',
                'float'   : 'left',
                'left'    : '35%',
                'z-index' : '50',
                'height'  : '60%',
                'width'   : 'auto',
                'top'     : '15%',
            };
            var miniTilesHolder = $('.miniTilesHolder');
            circle = TAG.Util.showProgressCircle(miniTilesHolder, progressCircCSS, '0px', '0px', false);
                 
        };
    }
    this.showArtwork = showArtwork;

    /**
     * Generates a comparator function for catalog sorting
     * @method sortComparator
     * @param {String} primary     the primary sorting property
     * @param {String} secondary   the secondary sorting property
     *                                if left undefined, a.artwork.Identifier is used
     *                                as the secondary property
     */
    function sortComparator(primary, secondary) {
        return function(a, b) {
            var aSecondary,
                bSecondary;
            if (a[primary] < b[primary]) {
                return -1;
            } else if (a[primary] > b[primary]) {
                return 1;
            } else {
                aSecondary = secondary ? a[secondary] : a.artwork.Identifier;
                bSecondary = secondary ? b[secondary] : b.artwork.Identifier;
                if (aSecondary < bSecondary) {
                    return -1;
                } else if (aSecondary > bSecondary) {
                    return 1;
                } else {
                    return 0;
                }
            }
        }
    }

    /**
     * Generates a valuation function for catalog sorting
     * @method sortValuation
     * @param {String} property     valuation property name
     */
    function sortValuation(property) {
        return function(value, compareToNode) {
            if (!compareToNode) {
                return null;
            } else if (value < compareToNode[property]) {
                return -1;
            } else if (value > compareToNode[property]) {
                return 1;
            } else {
                return 0;
            }
        }
    }

    /**
     * Sort the catalog by the given criterium
     * @method sortCatalog
     * @param {Array} artworks    an array of doq objects to be sorted
     * @param {String} tag        the sort type
     * @return {AVLTree}          an avl tree for easy sorting
     */
    function sortCatalog(artworks, tag) {
        var comparator,
            valuation,
            avlTree,
            artNode,
            i;

        if (tag === 'Title') {
            var titleKey;
            comparator = sortComparator('nameKey');
            valuation = sortValuation('nameKey');
            avlTree = new AVLTree(comparator, valuation);
            avlTree.clear();
            for (i = 0; i < artworks.length; i++) {
                if (artworks[i].Name) {
                    titleKey = artworks[i].Name.toLowerCase();
                } else {
                    titleKey = '~~~~';
                }
                artNode = {
                    artwork: artworks[i],
                    nameKey: titleKey,
                };
                avlTree.add(artNode);
            }
            return avlTree;
        } else if (tag === 'Artist') {
            var artistKey;
            comparator = sortComparator('artistKey');
            valuation  = sortValuation('artistKey');
            avlTree = new AVLTree(comparator, valuation);
            for (i = 0; i < artworks.length; i++) {
                if (artworks[i].Metadata.Artist) {
                    artistKey = artworks[i].Metadata.Artist.toLowerCase();
                } else {
                    artistKey = '~~~~';
                }
                artNode = {
                    artwork: artworks[i],
                    artistKey: artworks[i].Type === 'Empty' ? '~~~~' : artistKey // tours show up at end
                };
                avlTree.add(artNode);
            }
            return avlTree;
        } else if (tag === 'Date') {
            return sortByYear(artworks,true);
        } else if (tag === 'Tours') {
            var tourName;
            comparator = sortComparator('nameKey');
            valuation  = sortValuation('nameKey');
            avlTree = new AVLTree(comparator, valuation);
            for (i = 0; i < artworks.length; i++) {
                if (artworks[i].Type === 'Empty') {
                    if (artworks[i].Name) {
                        tourName = artworks[i].Name.toLowerCase();
                    } else {
                        tourName = '';
                    }

                } else {
                    tourName = '~~~~~~';
                }
                artNode = {
                    artwork: artworks[i],
                    nameKey: tourName,
                };
                    
                avlTree.add(artNode);
            }
            return avlTree;
        }
        //For custom sort tags
        else if (tag){
            var sortKey;
            comparator = sortComparator('sortKey');
            valuation = sortValuation('sortKey');
            avlTree = new AVLTree(comparator,valuation);
            avlTree.clear();
            for (i = 0; i < artworks.length; i++) {
                if (artworks[i].Metadata && artworks[i].Metadata.InfoFields[tag]) {
                    sortKey = artworks[i].Metadata.InfoFields[tag].toLowerCase();
                } else {
                    sortKey = null;
                }
                artNode = {
                    artwork: artworks[i],
                    sortKey: sortKey
                };
                if (artNode.sortKey) {
                    avlTree.add(artNode);
                }
            }
            return avlTree;
        }

        return null; // error case: falsy tag
    }

    /**Helper function for sorting artwork tiles and timeline markers
     * Also used to catch common non-integer input date forms and generate timeline 
     * years for their display. 
     * @method sortByYear
     * @param  {Object} artworks      list of artworks to sort9
     * @param {Boolean} timelineDate  whether you are sorting by timeline date (for now both timeline and tiles do)
     * @return {AVLTree} avlTree      sorted tree so order can be easily accessed
    **/
    function sortByYear(artworks, timelineDate) {
        var comparator,
            valuation,
            avlTree,
            artNode,
            artworkDate,
            yearKey,
            nameKey,
            usedkeys,
            i;
        comparator = sortComparator('yearKey', 'nameKey');
        valuation  = sortValuation('yearKey');
        avlTree = new AVLTree(comparator, valuation);
        usedkeys = [];
        for (i = 0; i < artworks.length; i++) {
            if (timelineDate){
                artworkDate = getArtworkDate(artworks[i], true);
            } else {
                artworkDate = getArtworkDate(artworks[i],false);
            }
            if (artworks[i].Name) {
                nameKey = artworks[i].Name.toLowerCase();
            } else {
                nameKey = '~~~~';
            }
            yearKey = TAG.Util.parseDateToYear(artworkDate);
            if (!isNaN(yearKey)) {
                yearKey = artworks[i].Type === 'Empty' ? 999999 : yearKey
                while (usedkeys.indexOf(yearKey) >= 0) {
                    yearKey+=.0001
                }
                artNode = {
                    artwork: artworks[i],
                    nameKey: nameKey,
                    yearKey: yearKey //Tours set to Infinity to show up at end of 'Year' sort
                };
            } else {
                yearKey = 999999
                while (usedkeys.indexOf(yearKey) >= 0) {
                    yearKey += .0001
                }
                artNode = {
                    artwork: artworks[i],
                    nameKey: nameKey,
                    yearKey: yearKey //Set unintelligible dates to show up at end of 'Year' sort 
                };
            }
            usedkeys.push(yearKey)
            avlTree.add(artNode);
        }
        return avlTree;
    }

    /* Get a date object representing temporal metadata for an artwork
    * @method getArtworkDate
    * @param {Object} artwork       artwork we care about
    * @param {Boolean} timelineDate     whether we want the metadata date or the timeline date
    * @return {Object} artworkDate      object containing year, month, day attributes
    */
    function getArtworkDate(artwork, timelineDate){
        var artworkDate;
        //second conditional checks to see if that metadata field exists in the server (backwards compatibility)
        if (timelineDate && (artwork.Metadata.TimelineYear||artwork.Metadata.TimelineYear==='')){
                artworkDate = {
                    year : artwork.Metadata.TimelineYear,
                    month : artwork.Metadata.TimelineMonth,
                    day : artwork.Metadata.TimelineDay
                }
            } else {
                 artworkDate = {
                    year : artwork.Metadata.Year,
                    month : artwork.Metadata.Month,
                    day : artwork.Metadata.Day
                }
            }
        return artworkDate;
    }

    /*Get the text to display based on a date object
    * @method getDateText
    * @param {Object} date     object containing year, month, day attributes
    * @param {Boolean} isYearMetadata whether it is a year metadata field (can be arbitrary string)
    * @return {String} dateText    text to display in mm/dd/yyyy or mm/yyyy format (Note- would need to change for internationalization)
    */   
    function getDateText(date, isYearMetadata){
        var yearText,
            neg = false,
            monthDict,
            month,
            monthText,
            dayText,
            dateText;

        yearText = TAG.Util.parseDateToYear({ year: date.year });
        //display text for arbitrary year metadata (ex- "middle pharoah period" should show up as written)
        if (!yearText && isYearMetadata) {
            return date.year
        }
        if (yearText<0){
            yearText = -yearText;
            neg = true;
        } 
        dateText = yearText;
        monthDict = {
                    "January": 1,
                    "February": 2,
                    "March": 3,
                    "April": 4,
                    "May": 5,
                    "June": 6,
                    "July": 7,
                    "August": 8,
                    "September": 9,
                    "October": 10,
                    "November":11,
                    "December": 12
                }
        if (date.month){
            month = date.month;
            monthText = monthDict[month];
            if (date.day){
               dayText = date.day;
               dateText = monthText + '/' + dayText + '/' + dateText; 
            } else {
                dateText = monthText + '/' + dateText;
            }
        }
        if (neg){
            dateText = dateText + ' BCE';
        }
        return dateText;
    }

    /** 
     * Set the colors of the sort tags
     * @method colorSortTags
     * @param {String} tag    the name of the sort tag
     */
    function colorSortTags(tag) {
        var unselectedColor = TAG.Util.UI.dimColor(SECONDARY_FONT_COLOR, DIMMING_FACTOR);
       root.find('.rowButton').css('color', unselectedColor);
       if (tag){
            root.find('#' + tag.toLowerCase() + 'Button').css('color', NOBEL_COLOR);
       }
    }


    /**
     * Changes the selected tag and re-sorts
     * @method changeDisplayTag
     * @param {Array} artworks     the array of artwork doqs to sort
     * @param {String} tag         the name of the sort tag
     */
    function changeDisplayTag(artworks, tag) {
        var guidsSeen = [],
            toursArray  = [],
            artsArray   = [],
            videosArray = [],
            bigArray    = [],
            i;
        currentArtwork && hideArtwork(currentArtwork)();
        currentTag = tag;
        colorSortTags(currentTag);
        drawCatalog(artworks, currentTag, 0, false, false);
        doSearch(false); // search with new tag
    }

    /**
     * Switch to the tour player
     * @method switchPageTour
     * @param {doq} tour    the relevant tour doq
     */
    function switchPageTour(tour, containerLeft) {
        var prevInfo,
            messageBox,
            collectionOptions,
            parentid;

        // quick fix - something weird happens to the dropdownchecklists that reverts them to the visible multiselect on a page switch.
        // For now, we'll just hide the whole keywords div.
        $('#keywords').hide();

        //Options for when we return to the collections page
        collectionOptions = {
            prevScroll: catalogDiv.scrollLeft(),
            prevPreviewPos: containerLeft || selectedArtworkContainer.position().left,
            backCollection: currCollection,
            prevSearch: {'searchText': searchInput.val(), 'keywordSearchOptions': keywordSearchOptions},
            prevTag : currentTag,
            backArtwork: tour,
            prevMult : multipleShown
        }

        //Parse RIN data to ITE Data
        var iteData = TAG.Util.RIN_TO_ITE(tour);
        //Create tag tourplayer (which will in turn create an ITE player)
        var ITEPlayer = TAG.Layout.TourPlayer(iteData, currCollection, collectionOptions, null, tour, idleTimer);
        TAG.Util.UI.slidePageLeftSplit(root, ITEPlayer.getRoot(), function () {
            setTimeout(function () {
                //var rindata = tour;
                //ITEPlayer.setTourData(TAG.Util.RIN_TO_ITE(rindata));
                ITEPlayer.startPlayback();
            }, 1000);
        });
        currentPage.name = TAG.Util.Constants.pages.TOUR_PLAYER;
    }
    
    /**
     * Switch to the video player
     * @method switchPageVideo
     * @param {doq} video         the video to which we'll switch
     */
    function switchPageVideo(video, containerLeft) {
        var prevInfo,
            videoPlayer;

        // quick fix - something weird happens to the dropdownchecklists that reverts them to the visible multiselect on a page switch.
        // For now, we'll just hide the whole keywords div.
        $('#keywords').hide();

        prevInfo = {
            artworkPrev: null,
            prevScroll: catalogDiv.scrollLeft(),
            prevPreviewPos : containerLeft || selectedArtworkContainer.position().left,
            prevTag: currentTag,
            prevSearch: { 'searchText': searchInput.val(), 'keywordSearchOptions': keywordSearchOptions },
            prevMult: multipleShown
        };
        videoPlayer = TAG.Layout.VideoPlayer(video, currCollection, prevInfo);
        TAG.Util.UI.slidePageLeftSplit(root, videoPlayer.getRoot());

        currentPage.name = TAG.Util.Constants.pages.VIDEO_PLAYER;
        currentPage.obj = videoPlayer;
    }

    /**
     * Switch to the artwork viewer or tour player
     * @method switchPage
     * @param {Object} artwork      artwork to return to after switching
     */
    function switchPage(artwork, associatedMedia, containerLeft) {
        return function() {
            var artworkViewer,
                newPageRoot,
                splitopts = 'L',
                opts = getState(),
                confirmationBox,
                slideMode = true,
                avl,
                avlArray = [],
                prevInfo;


            if (!artwork|| !artworkSelected) {
                return;
            }
            if (currCollection.Name !== "The Life of Alfred Nobel") {
                slideMode = false;
            }

            /*if (slideMode === true) {
                avl = sortByYear(currentArtworks, false);
                if(!avl.isEmpty()){
                    avlArray.push(avl.remove());
                    while (!avl.isempty()) {
                        var cur = avl.remove();
                        if (cur < avlArray[0]) {
                            avlArray.unshift(cur)
                        }
                        else {
                            avlArray.push(cur);
                        }
                    }
                }
            }*/
            if (slideMode === true) {
                avl = sortByYear(currentArtworks, true);
                while (!avl.isEmpty()) {
                    avlArray.push(avl.remove(avl.min()));
                }
            }

            if (artwork.Type === "Empty" && artwork.Metadata.Type !== "VideoArtwork" && artwork.Metadata.ContentType !== "iframe") { // tour
                if (TAG.Util.Splitscreen.isOn()) {
                    confirmationBox = $(TAG.Util.UI.PopUpConfirmation(function () {
                            TAG.Util.Splitscreen.exit(root.data('split') || 'L');
                            switchPageTour(artwork);
                            TAG.Util.multiLineEllipsis($($($(confirmationBox).children()[0]).children()[0]));
                        },
                        "By opening this tour, you will exit split screen mode. Would you like to continue?",
                        "Continue",
                        false,
                        function () {
                            confirmationBox.remove();
                        },
                        root
                    ));
                    confirmationBox.css('z-index', 1000000001);
                    root.append(confirmationBox);
                    confirmationBox.show();
                } else {
                    switchPageTour(artwork, containerLeft);
                }
            } else if (artwork.Metadata.Type === "VideoArtwork") { // video
                if (TAG.Util.Splitscreen.isOn()) {
                    confirmationBox = $(TAG.Util.UI.PopUpConfirmation(function () {
                            TAG.Util.Splitscreen.exit(root.data('split') || 'L');
                            switchPageVideo(artwork);
                            TAG.Util.multiLineEllipsis($($($(confirmationBox).children()[0]).children()[0]));
                        },
                        "By opening this video, you will exit split screen mode. Would you like to continue?",
                        "Continue",
                        false,
                        function () {
                            confirmationBox.remove();
                        },
                        root
                    ));
                    confirmationBox.css('z-index', 100000001);
                    root.append(confirmationBox);
                    confirmationBox.show();
                } else {
                    switchPageVideo(artwork, containerLeft);
                }
            } else { // deepzoom artwork

                // quick fix - something weird happens to the dropdownchecklists that reverts them to the visible multiselect on a page switch.
                // For now, we'll just hide the whole keywords div.
                $('#keywords').hide();

                artworkViewer = TAG.Layout.ArtworkViewer({
                    doq: artwork,
                    prevPreview: currCollection.Name === "The Life of Alfred Nobel" ? null : currentArtwork,
                    prevTag: currCollection.Name === "The Life of Alfred Nobel" ? null : currentTag,
                    prevScroll: catalogDiv.scrollLeft(),
                    prevPreviewPos: containerLeft || selectedArtworkContainer.position().left,
                    prevCollection: currCollection,
                    prevPage: 'catalog',
                    prevMult: multipleShown,
                    prevSearch: { 'searchText': searchInput.val(), 'keywordSearchOptions': keywordSearchOptions },
                    assocMediaToShow: associatedMedia,
                    onAssocMediaView : onAssocMediaView,
                    smallPreview: smallPreview,
                    titleIsName: titleIsName,
                    isNobelWill: false,
                    isSlideMode: slideMode,
                    slidesArray : avlArray,
                    twoDeep: twoDeep,
                    oneDeep: oneDeep,
                    hideKeywords: hideKeywords,
                    showNobelLifeBox: showNobelLifeBox
                });
                newPageRoot = artworkViewer.getRoot();
                newPageRoot.data('split', root.data('split') === 'R' ? 'R' : 'L');

                TAG.Util.UI.slidePageLeftSplit(root, newPageRoot);

                currentPage.name = TAG.Util.Constants.pages.ARTWORK_VIEWER;
                currentPage.obj  = artworkViewer;
            }
            root.css({ 'overflow-x': 'hidden' });
        }
    }
    this.switchPage = switchPage;
    

    /**
     * Gets the current state of the collections page
     * @method getState
     * @return {Object}    object containing state
     */
    function getState() {
        return {
            exhibition: currCollection,
            currentTag: currentTag,
            currentImage: currentArtwork,
        };
    }

    /**
     * Returns the root of the collections page
     * @method getRoot
     * @return {jQuery Object}    root of the collections page
     */
    function getRoot() {
        return root;
    }

    return {
        getRoot: getRoot,
        loadCollection: loadCollection,
        loadFirstCollection: loadFirstCollection,
        showArtwork : showArtwork,
        getState: getState,
        switchPage : switchPage
    };
};

TAG.Layout.LaureatesPage.default_options = {};
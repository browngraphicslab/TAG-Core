TAG.Util.makeNamespace("TAG.Layout.CollectionsPage");

/**
 * The collections page
 * @class TAG.Layout.CollectionsPage
 * @constructor
 * @param {Object} options         some options for the collections page
 * @return {Object}                some public methods
 */
TAG.Layout.CollectionsPage = function (options) { // backInfo, backExhibition, container, forSplitscreen) {
    "use strict";

    options = options || {}; // cut down on null checks later

    var // DOM-related
        root                     = TAG.Util.getHtmlAjax('NewCatalog.html'), // use AJAX to load html from .html file
        infoDiv                  = root.find('#infoDiv'),
        tileDiv                  = root.find('#tileDiv'),
        collectionArea           = root.find('#collectionArea'),
        backArrowArea            = root.find('#backArrowArea'),
        backArrow                = root.find('#backArrow'),
        nextArrowArea            = root.find('#nextArrowArea'),
        nextArrow                = root.find('#nextArrow'),
        collectionHeader         = root.find('#collectionHeader'),
        collectionDotHolder      = root.find('#collectionDotHolder'),
        bgimage                  = root.find('#bgimage'),
        bottomContainer          = root.find('#bottomContainer'),
        catalogDiv               = root.find('#catalogDiv'),
        infoTilesContainer       = root.find('#infoTilesContainer'),
        sortRow                  = root.find('#sortRow'),
        searchInput              = root.find('#searchInput'),
        searchTxt                = root.find('#searchTxt'),
        buttonRow                = root.find('#buttonRow'),
        artworksButton           = root.find('#artworksButton'),
        assocMediaButton         = root.find('#assocMediaButton'),
        toggleRow                = root.find('#toggleRow'),
        selectedArtworkContainer = root.find('#selectedArtworkContainer'),
        timelineArea             = root.find('#timelineArea'),
        topBar                   = root.find('#topBar'),
        loadingArea              = root.find('#loadingArea'),
        infoButton               = root.find('#infoButton'),
        linkButton               = root.find('#linkButton'),
        // splitscreenIcon          = root.find('#splitscreenIcon'),
        overlay                  = root.find('#overlay'),

        // input options
        scrollPos        = options.backScroll || 0,     // horizontal position within collection's catalog
        currCollection   = options.backCollection,      // the currently selected collection
        currentArtwork   = options.backArtwork,         // the currently selected artwork
        currentTag       = options.backTag,             // current sort tag for collection
        multipleShown    = options.backMult,            // whether multiple artworks shown at a specific year, if applicable
        previewing       = options.previewing || false,          // whether we are loading for a preview in authoring (for dot styling)
        
        // misc initialized vars
        loadQueue            = TAG.Util.createQueue(),           // an async queue for artwork tile creation, etc
        artworkSelected      = false,                            // whether an artwork is selected
        visibleCollections   = [],                               // array of collections that are visible and published
        collectionDots       = {},                               // dict of collection dots, keyed by collection id
        artworkCircles       = {},                               // dict of artwork circles in timeline, keyed by artwork id                  
        artworkTiles         = {},                               // dict of artwork tiles in bottom region, keyed by artwork id
        firstLoad            = true,                             // TODO is this necessary? what is it doing?
        currentArtworks      = [],                               // array of artworks in current collection
        infoSource           = [],                               // array to hold sorting/searching information
        timelineEventCircles = [],                               // circles for timeline
        timelineTicks        = [],                               // timeline ticks
        scaleTicks           = [],                               // timeline scale ticks
        artworkYears         = {},                               // dict of artworks keyed by yearKey for detecting multiple artworks at one year    
        scaleTicksAppended   = false,                            // if scale ticks have been appended
        tileDivHeight        = 0,                                // Height of tile div (before scroll bar added, should equal hieght of catalogDiv)
        artworkShown         = false,                            // whether an artwork pop-up is currently displayed
        timelineShown        = true,                             // whether current collection has a timeline
        onAssocMediaView     = false,                            // whether current collection is on assoc media view
        previouslyClicked    = null,

        // constants
        BASE_FONT_SIZE      = TAG.Worktop.Database.getBaseFontSize(),       // base font size for current font
        FIX_PATH            = TAG.Worktop.Database.fixPath,                 // prepend server address to given path
        MAX_YEAR            = (new Date()).getFullYear(),                   // Maximum display year for the timeline is current year
        EVENT_CIRCLE_WIDTH  =  Math.max(20, $("#tagRoot").width() / 50),  // width of the circles for the timeline                                
        COLLECTION_DOT_WIDTH = Math.max(7, $("#tagRoot").width() / 120),  // width of the circles for the timeline                      
        LEFT_SHIFT = 9,                                                    // pixel shift of timeline event circles to center on ticks 
        TILE_BUFFER         = $("#tagRoot").width() / 100,                  // number of pixels between artwork tiles
        TILE_HEIGHT_RATIO   = 200,                                          //ratio between width and height of artwork tiles
        TILE_WIDTH_RATIO    = 255,
        ANIMATION_DURATION  = 800,                                         // duration of timeline zoom animation
        PRIMARY_FONT_COLOR  = options.primaryFontColor ? options.primaryFontColor : TAG.Worktop.Database.getMuseumPrimaryFontColor(),
        SECONDARY_FONT_COLOR = options.secondaryFontColor ? options.secondaryFontColor : TAG.Worktop.Database.getMuseumSecondaryFontColor(),
        FONT                = TAG.Worktop.Database.getMuseumFontFamily(),

        // misc uninitialized vars
        fullMinDisplayDate,             // minimum display date of full timeline
        fullMaxDisplayDate,             // maximum display date of full timeline
        currentTimeline,                // currently displayed timeline
        currTimelineCircleArea,         // current timeline circle area
        currentDefaultTag,              // current default tag if 'Year' and  'Title' sorts don't exist
        toShowFirst,                    // first collection to be shown (by default)
        toursIn,                        // tours in current collection
        currentThumbnail,               // img tag for current thumbnail image
        imgDiv,                         // container for thumbnail image
        descriptiontext,                // description of current collection or artwork
        loadingArea,                    // container for progress circle
        moreInfo,                       // div holding tombstone information for current artwork
        artistInfo,                     // artist tombstone info div
        yearInfo,                       // year tombstone info div
        justShowedArtwork,              // for telemetry; helps keep track of artwork tile clicks
        comingBack,                      // if you are coming back from a viewer
        defaultTag;                     // default sort tag

        root[0].collectionsPage = this;
        options.backCollection ? comingBack = true : comingBack = false;
       
    // get things rolling
    init();

    /**
     * Sets up the collections page UI
     * @method init
     */
    function init() {
        var progressCircCSS,
            circle,
            oldSearchTerm;
        
        progressCircCSS = {
            'position': 'absolute',
            'z-index': '50',
            'height': 'auto',
            'width': '5%',
            'left': '47.5%',
            'top': '42.5%'
        };
        
        circle = TAG.Util.showProgressCircle(loadingArea, progressCircCSS, '0px', '0px', false);

        // search on keyup
        searchInput.on('keyup', function (e) {
            if(e.which === 13) {
                doSearch();
            }
        });
        
        searchInput.css({
            'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")',
            'background-size' : 'auto 50%',
            'background-repeat': 'no-repeat',
            'background-position':'2% center'
        });

        searchInput.on('focus', function () { searchInput.css({ 'background-image': 'none' }); });
        searchInput.on('focusout', function () { 
            if (!searchInput.val()) {
                searchInput.css({ 'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")' });
            } 
        });

        // initSplitscreen();

        infoButton.attr('src', tagPath+'images/icons/info.svg')
            .addClass('bottomButton')

        if (IS_WEBAPP) {
            linkButton.attr('src', tagPath + 'images/link.svg')
                        .addClass('bottomButton')
                        .on('click', function () {
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
            infoButton.on('click', function () {
                createInfoPopUp();
            });
        }

        if (root.data('split') === 'R' && TAG.Util.Splitscreen.isOn()) {
        }

        bottomContainer.on('scroll', function(){ 
            hideArtwork(currentArtwork)
        })
        

        applyCustomization();
        TAG.Worktop.Database.getExhibitions(getCollectionsHelper, null, getCollectionsHelper);
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
        var microsoftLogo = $(document.createElement('img'));
        var brownLogo = $(document.createElement('img'));
        var closeButton = createCloseButton();

        microsoftLogo.attr('src', tagPath + 'images/Microsoft-Logo-Black-small.png');
        brownLogo.attr('src', tagPath + 'images/brown_logo.png');
        microsoftLogo.css({
            'height': 'auto',
            'width': '20%',
            'margin-left': '50%'
        });
        brownLogo.css({
            'height': 'auto',
            'width': '20%',
            'margin-left': '50%'
        });
        
        infoOverlay.css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex);
        infoOverlay.append(infoBox);
        infoBox.css({
            'background-color': 'black',
            'color': 'white',
            'height': '50%',
            'width': '50%',
            'margin-top': '15%',
            'margin-left': '25%'
        });
        infoTitle.css({
            'background-color': 'black',
            'margin': '0%',
            'display': 'block',
            'color': 'white'
        });
        infoTitle.append(infoTitleLeft);
        infoTitle.append(infoTitleRight);
        infoTitle.append(closeButton);
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
        infoMainTop.text('Touch Art Gallery is a free webapp and Win8 application, funded by Microsoft Reasearch and created by the Graphics Lab at Brown University. You can learn more about this project at http://cs.brown.edu/research/ptc/tag/.');
        infoMainBottom.text('Andy van Dam, Alex Hills, Yudi Fu, Karishma Bhatia, Gregory Chatzinoff, John Connuck, David  Correa, Mohsan Elahi, Aisha Ferrazares, Jessica Fu, Kaijan Gao, Jessica Herron, Ardra Hren, Hak Rim Kim, Lucy van Kleunen, Inna Komarovsky, Ryan Lester, Benjamin LeVeque, Josh Lewis, Jinqing Li, Jeffery Lu, Xiaoyi Mao, Ria Mirchandani, Julie Mond, Ben Most, Jonathan Poon, Dhruv Rawat, Emily Reif, Surbhi Madan, Jacob Rosenfeld, Anqi Wen, Dan Zhang, Libby Zorn');
        infoMain.append(infoMainTop);
        infoMain.append(infoMainBottom);

        infoLogo.css({
            'background-color': 'blue',
            'display': 'block',
            'color': 'white',
            'height': '15%',
            'margin-top': '3%'
        });
        infoLogo.append(microsoftLogo);
        infoLogo.append(brownLogo);

        infoBox.append(infoTitle);
        infoBox.append(infoMain);
        infoBox.append(infoLogo);
        root.append(infoOverlay);
        infoOverlay.fadeIn();

        closeButton.on('click', function () {
            infoOverlay.fadeOut();
        });
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
            'height': '30px',
            'width': '30px',
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
        if (currentArtwork.Type === 'Empty') {
            return 'tour';
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
            collectionDot;

        // Iterate through entire list of collections to to determine which are visible/not private/published.  Also set toShowFirst
        for(i=0; i<collections.length; i++) {
            c = collections[i];
            privateState = c.Metadata.Private ? (/^true$/i).test(c.Metadata.Private) : false;
            if(!privateState && TAG.Util.localVisibility(c.Identifier)) {
                toShowFirst = toShowFirst || c;
                visibleCollections.push(collections[i]);
            }
        }

        // Iterate through visible/not private/published collections, and set their prev and next values
        // Also create a scroll dot for each (under main collection title)
        collectionDotHolder.empty();
        for(i = 0; i < visibleCollections.length; i++) {
            if(visibleCollections.length<=2){ 
                lastCollectionIndex = null;
                firstCollectionIndex = null;
            } else {
                lastCollectionIndex = visibleCollections.length - 1;
                firstCollectionIndex = 0;
            }
            visibleCollections[i].prevCollectionIndex = visibleCollections[i - 1] ? i - 1 : lastCollectionIndex;
            visibleCollections[i].nextCollectionIndex = visibleCollections[i + 1] ? i + 1 : firstCollectionIndex;
            
            if (previewing) {
                COLLECTION_DOT_WIDTH = root.width() / 120; //for previewing collections page in authoring
            }
            collectionDot = $(document.createElement('div'))
                        .addClass('collectionDot')
                        .css({
                            "width": COLLECTION_DOT_WIDTH,
                            "height":  COLLECTION_DOT_WIDTH,
                            "border-radius": COLLECTION_DOT_WIDTH / 2,
                            "margin": COLLECTION_DOT_WIDTH/4
                        }).on('click', function(j){
                            return function(){
                                loadCollection(visibleCollections[j])();
                                currentTag = null;
                            }
                        }(i));
            collectionDotHolder.append(collectionDot);

            collectionDots[visibleCollections[i].Identifier] = collectionDot;
        }

        // Load collection
        if (currCollection) {
            loadCollection(currCollection, scrollPos, currentArtwork)();
        } else if (toShowFirst) {
            loadFirstCollection();
        }

        loadingArea.hide();
    }

    /**
     * Applies customization changes to main divs
     * @method applyCustomization
     */
    function applyCustomization() {
        var dimmedColor = TAG.Util.UI.dimColor(PRIMARY_FONT_COLOR);
        $('.primaryFont').css({
            'color': dimmedColor,
            'font-family': FONT
        });
        $('.secondaryFont').css({
            'color': '#' + SECONDARY_FONT_COLOR,
            'font-family': FONT
        });
        $('.collection-title').css({ 
            'color': '#' + PRIMARY_FONT_COLOR,
            'font-family': FONT
        });
    }

    /**
     * Shows collection and title
     * @method loadCollection
     * @param {jQuery obj} collection     the element currently being clicked
     * @param {Number} sPos               if undefined, set scroll position to 0, otherwise, use this
     * @param {doq} artwrk                if undefined, set currentArtwork to null, otherwise, use this
     */
    function loadCollection(collection, sPos, artwrk) {

        return function(evt) {
            var i,
                title             = TAG.Util.htmlEntityDecode(collection.Name),
                nextTitle,
                prevTitle,
                mainCollection    = $('#mainCollection'),
                nextCollection    = $('#nextCollection'),
                prevCollection    = $('#prevCollection'),
                titleBox          = $('.collection-title'), 
                collectionMedia   = [],
                counter           = 0,
                collectionLength,
                collectionDescription = $(document.createElement('div')),
                dummyDot,
                dimmedColor = TAG.Util.UI.dimColor(SECONDARY_FONT_COLOR),
                str,
                text              = collection.Metadata && collection.Metadata.Description ? TAG.Util.htmlEntityDecode(collection.Metadata.Description) : "";

            // if the idle timer hasn't started already, start it
            if(!idleTimer && evt) { // loadCollection is called without an event to show the first collection
                idleTimer = TAG.Util.IdleTimer.TwoStageTimer();
                idleTimer.start();
            }

            //Change timeline shown based on saved metadata
            if (collection.Metadata.Timeline === "true"|| collection.Metadata.Timeline === "false"){
                    collection.Metadata.Timeline === "true" ? timelineShown = true: timelineShown = false;
            } else {
                timelineShown = true; //default to true for backwards compatibility
            }

            //If on associated media view and there are no associated media with valid dates, hide the timeline
            if (onAssocMediaView && collection.collectionMediaMinYear===Infinity){
                timelineShown = false;
            }

            buttonRow.empty();
            loadSortTags(collection);
            comingBack = false;

            if (!onAssocMediaView){
                if (collection.Metadata.AssocMediaView && collection.Metadata.AssocMediaView === "true"){
                    TAG.Worktop.Database.getArtworksIn(collection.Identifier, getCollectionMedia, null, getCollectionMedia);     
                }

                // Clear search box
                searchTxt.text("");

                //re-display the magnifying glass icon
                searchInput.css({ 'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")' });

                // Clear catalog div (with info and artwork tiles)
                catalogDiv.empty();

                //Set background image
                if (collection.Metadata.BackgroundImage) {
                    bgimage.css('background-image', "url(" + FIX_PATH(collection.Metadata.BackgroundImage) + ")");
                }

                if (!collectionDots[collection.Identifier]){
                    //For previewing unpublished collections in authoring: add a collection dot and highlight it. 
                    dummyDot = $(document.createElement('div'))
                        .addClass('collectionDot')
                        .css({
                            "width": COLLECTION_DOT_WIDTH,
                            "height":  COLLECTION_DOT_WIDTH,
                            "border-radius": COLLECTION_DOT_WIDTH / 2,
                            "margin": COLLECTION_DOT_WIDTH/4,
                            "background-color":'white'
                        });
                    collectionDotHolder.append(dummyDot);
                } else {
                    //Make collection dot white and others gray
                    for(i = 0; i < visibleCollections.length; i++) { 
                        collectionDots[visibleCollections[i].Identifier].css('background-color','rgb(170,170,170)');
                    }
                    collectionDots[collection.Identifier].css('background-color', 'white');
                }                

                // Add collection title
                mainCollection.addClass('mainCollection');
                titleBox.addClass('collection-title primaryFont').html(title);

                // Add previous and next collection titles
                if (collection.prevCollectionIndex||collection.prevCollectionIndex===0){
                    prevTitle = TAG.Util.htmlEntityDecode(visibleCollections[collection.prevCollectionIndex].Name)
                    backArrowArea.addClass('arrowArea');
                    backArrowArea.css('left', '0%')
                        .off()
                        .on('click', function(j){
                                return function(){
                                    loadCollection(visibleCollections[j.prevCollectionIndex])();
                                    currentTag = null;
                                }
                            }(collection));
                    backArrow.attr('src', tagPath + 'images/icons/Close.svg');
                    backArrow.addClass('arrow');    

                    prevCollection.addClass('nextPrevCollection')
                                .addClass('primaryFont')
                                //.attr({
                                //   'id': 'collection-' + visibleCollections[collection.prevCollectionIndex].Identifier
                                //})
                                .css('left','3%')
                                .html(prevTitle)
                                .off()
                                .on('click', function(j){
                                        return function(){
                                            onAssocMediaView = false
                                            loadCollection(visibleCollections[j.prevCollectionIndex])();
                                            currentTag = null;
                                        }
                                    }(collection));

                    TAG.Telemetry.register(backArrowArea, 'click', 'collection_title', function(tobj){
                        tobj.custom_1 = prevTitle;
                        tobj.custom_2 = visibleCollections[collection.prevCollectionIndex].Identifier;
                    });
                    TAG.Telemetry.register(prevCollection, 'click', 'collection_title', function(tobj){
                        tobj.custom_1 = prevTitle;
                        tobj.custom_2 = visibleCollections[collection.prevCollectionIndex].Identifier;
                    });
                }

                if (prevCollection){
                    prevCollection.css('width', (.95 * collectionArea.width() - mainCollection.width())/2 - backArrowArea.width());
                    // prevCollection.css('color', '#' + PRIMARY_FONT_COLOR);
                }
                if (collection.nextCollectionIndex||collection.nextCollectionIndex===0){
                    nextTitle = TAG.Util.htmlEntityDecode(visibleCollections[collection.nextCollectionIndex].Name)
                    nextArrowArea.addClass('arrowArea');
                    nextArrowArea.css({'right': '0%'})
                                .off()
                                .on('click', function(j){
                                        return function(){
                                            loadCollection(visibleCollections[j.nextCollectionIndex])();
                                            currentTag = null;
                                        }
                                    }(collection));

                   // collectionArea.append(nextArrowArea);
                    nextArrow.attr('src', tagPath + 'images/icons/Open.svg');
                    nextArrow.addClass('arrow');
                    nextCollection.addClass('nextPrevCollection')
                                  .addClass('primaryFont')
                                  //.attr({
                                  //   'id': 'collection-' + visibleCollections[collection.nextCollectionIndex].Identifier
                                  // })
                                  .html(nextTitle)
                                  .css({
                                    'right': 0 + nextArrowArea.width()/2,
                                    'width': (.95 * collectionArea.width() - mainCollection.width())/2 - nextArrowArea.width(),
                                    //'color': '#' + PRIMARY_FONT_COLOR
                                   })
                                .off()
                                .on('click', function(j){
                                        return function(){
                                            onAssocMediaView = false
                                            loadCollection(visibleCollections[j.nextCollectionIndex])();
                                            currentTag = null;
                                        }
                                    }(collection));

                    TAG.Telemetry.register(nextArrowArea, 'click', 'collection_title', function(tobj){
                        tobj.custom_1 = nextTitle;
                        tobj.custom_2 = visibleCollections[collection.nextCollectionIndex].Identifier;
                    });
                    TAG.Telemetry.register(nextCollection, 'click', 'collection_title', function(tobj){
                        tobj.custom_1 = nextTitle;
                        tobj.custom_2 = visibleCollections[collection.nextCollectionIndex].Identifier;
                    });
                   // collectionArea.append(nextCollection);
                }

                collectionDescription.attr('id', 'collectionDescription');
                collectionDescription.addClass('secondaryFont');
                str = collection.Metadata.Description ? collection.Metadata.Description.replace(/\n\r?/g, '<br />') : "";
                collectionDescription.css({
                    'font-size': 0.2 * TAG.Util.getMaxFontSizeEM(str, 1.5, 0.55 * $(infoDiv).width(), 0.915 * $(infoDiv).height(), 0.1),
                });
                collectionDescription.html(Autolinker.link(str, {email: false, twitter: false}));

                artworksButton.css('color', '#' + SECONDARY_FONT_COLOR);
                assocMediaButton.css('color', dimmedColor);

            }

            //If there's no description, change UI so that artwork tiles take up entire bottom area
            if (collection.Metadata.Description && !onAssocMediaView) {
                infoDiv.css('width', '25%'); 
            } else { 
                infoDiv.css('width', '0%');
            }

            // Hide selected artwork container, as nothing is selected yet
            selectedArtworkContainer.css('display', 'none');
            overlay.css('z-index', '1');
      
            tileDiv.empty();
            catalogDiv.append(tileDiv);
            infoDiv.empty();
            infoDiv.append(collectionDescription);
            catalogDiv.append(infoDiv);
            timelineArea.empty();
            styleBottomContainer();

            if (collection.Metadata.AssocMediaView && collection.Metadata.AssocMediaView === "true"){
                toggleRow.css({
                    'display': 'block',
                });
                artworksButton.off()
                              .on('click', function(){
                                    artworksButton.css('color', '#' + SECONDARY_FONT_COLOR);
                                    assocMediaButton.css('color', dimmedColor);
                                    if (onAssocMediaView){
                                        onAssocMediaView = false;
                                        loadCollection(currCollection)();
                                    }
                               });

                assocMediaButton.off()
                                .on('click', function(){
                                    artworksButton.css('color', dimmedColor);
                                    assocMediaButton.css('color', '#' + SECONDARY_FONT_COLOR);  
                                    if (!onAssocMediaView){
                                        onAssocMediaView = true;
                                        loadCollection(currCollection)();
                                    }
                                });
                                
            } else {
                toggleRow.css('display','none');
            }

            currCollection = collection;
            currentArtwork = artwrk || null;
            //loadCollection.call($('#collection-'+ currCollection.Identifier), currCollection);
            scrollPos = sPos || 0;
            //comingBack = false;
            if (!onAssocMediaView || !currCollection.collectionMedia){
                getCollectionContents(currCollection);
            } else {
                createArtTiles(currCollection.collectionMedia);
                initSearch(currCollection.collectionMedia);
            }
            applyCustomization();

            /*Helper function to get all of the associated media in a collection
             * @method getCollectionMedia
             * @param  {Array} artworkDoqs          list of artwork doqs in the collection
             */
            function getCollectionMedia(artworkDoqs){  
                collectionLength = artworkDoqs.length;
                for (i=0;i<artworkDoqs.length;i++){
                    TAG.Worktop.Database.getAssocMediaTo(artworkDoqs[i].Identifier, addAssocMedia, null, addAssocMedia);
                }

                /*Helper function to combine all the media for each artwork in the collection
                * @method addAssocMedia
                * @param {Array} mediaDoqs          associated media doqs passed in by getAssocMediaTo()
                */
                function addAssocMedia(mediaDoqs){
                    counter = counter +1 ;
                    for (i=0; i<mediaDoqs.length;i++){
                        collectionMedia.push(mediaDoqs[i]);
                    }
                    //When all of the collections have been looped through (neccessary to deal with async)
                    if (counter === collectionLength){
                        collection.collectionMedia = collectionMedia;
                        if (sortByYear(collectionMedia,true).min()){
                            collection.collectionMediaMinYear =  sortByYear(collectionMedia,true).min().yearKey;
                        }
                    }
                }  
            }

            /*helper function to load sort tags
            * @method loadSortTags
            * @param {Object} collection
            */
            function loadSortTags(collection){
                var sortOptions = [],
                    sortButton,
                    sortButtonTags = {}; 
                //TO-DO: test with custom sorts
                if (collection.Metadata.SortOptionsGuid){ 
                    TAG.Worktop.Database.getDoq(collection.Metadata.SortOptionsGuid, function getSortOptions(sortOptionsDoq){
                        var sortObjects = sortOptionsDoq.Metadata,
                            sortText,
                            sortObjArray;
                        if (sortObjects){
                            for (sortObj in sortObjects){
                                if (sortObjects.hasOwnProperty(sortObj) && sortObj != "__Created" && sortObj != "Count") {
                                    if (sortObj.charAt(0) == '?') {
                                        sortText = sortObj.substr(1);
                                    } else {
                                        sortText = sortObj;
                                    }
                                    sortObjArray = sortObjects[sortObj].split(",");
                                    if (sortObjArray.length == 2 && sortObjArray[0] == "0" && sortObjArray[1] == "false") {
                                        continue;
                                    }
                                    sortOptions.append(sortText);
                                }
                            }
                        }

                    });
                } else {
                    //TO-DO-"Type" to  "Tours" (saved as "Tour" on server)
                    sortOptions = ["Date","Title","Artist","Type"];
                }
                for (i=0;i<sortOptions.length;i++){
                    sortButton = $(document.createElement('div'));
                    sortButton.addClass('rowButton')
                              .text(sortOptions[i])
                              .attr('id', sortOptions[i].toLowerCase() + "Button")
                              .off()
                              .on('click', function(){
                                currentArtwork = null;
                                changeDisplayTag(currentArtworks,sortButtonTags[$(this).attr('id')]);
                              });
                    buttonRow.append(sortButton);
                    sortButtonTags[sortButton.attr('id')] = sortOptions[i];
                    //TO-DO: test this telemetry handler
                    TAG.Telemetry.register(sortButton , 'click', '', function(tobj) {
                        tobj.ttype = 'sort_by_' + sortButtonTags[$(sortButton).attr('id')].toLowerCase();
                    });
                }
                if (!comingBack){
                    //If currentTag not defined currentTag is either 'year' or 'title' depending on if timeline is shown
                    if (timelineShown && $('#dateButton')){
                        currentTag = "Date";
                    } else if ($('#titleButton')){
                        currentTag = "Title";
                    } else {
                        //if no year or title sort currentTag is first sortButton, or null if there are no sortOptions.
                        currentTag = sortOptions[0] || null;
                        currentDefaultTag = currentTag;
                    }
                }
                colorSortTags(currentTag);
            }
        }
    }
    this.loadCollection = loadCollection;

    /**
     * Helper function to load first collection
     * @method loadFirstCollection
     */
    function loadFirstCollection() {
        loadCollection(toShowFirst)(); 
    }

    /**
     * Get contents (artworks, videos, tours) in the specified collection and make catalog
     * @method getCollectionContents
     * @param {doq} collecion         the collection whose contents we want
     * @param {Function} callback     a function to call when the contents have been retrieved
     */
    function getCollectionContents(collection, callback) {
        TAG.Worktop.Database.getArtworksIn(collection.Identifier, contentsHelper, null, contentsHelper);

        /**
         * Helper function to process collection contents
         * @method contentsHelper
         * @param {Array} contents     array of doq objects for each of the contents of this collection
         */
        function contentsHelper(contents) {
            createArtTiles(contents);
            initSearch(contents);
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

        $.each(contents, function (i, cts) {
            if (!cts) {
                return false;
            }
            info = ((cts.Name) ? cts.Name : "") + " " + ((cts.Metadata.Artist) ? cts.Metadata.Artist : "") + " " + ((cts.Metadata.Year) ? cts.Metadata.Year : "") + " " + ((cts.Metadata.Description) ? cts.Metadata.Description : "") + " " + ((cts.Metadata.Type) ? cts.Metadata.Type : "");
            if (cts.Metadata.InfoFields) {
                $.each(cts.Metadata.InfoFields, function (field, fieldText) {           //Adding custom metadata fields: both keys and values
                    info += " " + field;
                    info += " " + fieldText;
                });
            }
            infoSource.push({
                "id": i,
                "keys": info.toLowerCase()
            });
        });
    }

    /**
     * Search collection using string in search input box
     * @method doSearch
     */
    function doSearch() {
        var content = searchInput.val().toLowerCase(),
            matchedArts = [],
            unmatchedArts = [],
            i;

        if (!content) {
            searchTxt.text("");
            drawCatalog(currentArtworks, currentTag, 0, false);
            return;
        }

        for (i = 0; i < infoSource.length; i++) {
            if (infoSource[i].keys.indexOf(content) > -1) {
                matchedArts.push(currentArtworks[i]);
            } else {
                unmatchedArts.push(currentArtworks[i]);
            }
        }

        searchTxt.text(matchedArts.length > 0 ? "Results Found" : "No Matching Results");

        drawCatalog(matchedArts, currentTag, 0, true);
        drawCatalog(unmatchedArts, currentTag, matchedArts.length, false);
    }

    /**
     * Create tiles for each artwork/tour in a collection
     * @method createArtTiles
     * @param {Array} artworks     an array of doq objects
     */
    function createArtTiles(artworks) {
        currentArtworks = artworks;
        currentTag && colorSortTags(currentTag);
        drawCatalog(currentArtworks, currentTag, 0);
    }

    /**
     * Draw the collection catalog
     * @method drawCatalog
     * @param {Array} artworks    the contents of the collection
     * @param {String} tag        current sorting tag
     * @param {Number} start      starting at start-th artwork total (note NOT start-th artwork in artworks)
     * @param {Boolean} onSearch  whether the list of artworks is a list of works matching a search term
     */
    function drawCatalog(artworks, tag, start, onSearch) {

        if (!currCollection) {
            return;
        }

        if (start === 0) {
            loadQueue.clear();
            drawHelper();
            
        } else {
            drawHelper();
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
                i, h, w, j;

            if (!artworks || artworks.length === 0){
                return;
            }

            if (tag){
                sortedArtworks = sortCatalog(artworks, tag);
                minOfSort      = sortedArtworks.min();
                currentWork    = minOfSort ? minOfSort.artwork : null;
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

            
            for (j = 0; j < works.length; j++) {
                if (tag){
                    loadQueue.add(drawArtworkTile(works[j].artwork, tag, onSearch, i + j));
                }
                else{
                   loadQueue.add(drawArtworkTile(works[j], null, onSearch, i + j)); 
                }
            }
            loadQueue.add(function(){
                showArtwork(currentArtwork,multipleShown && multipleShown)();
           });
            tileDiv.css({'left': infoDiv.width()});
            if (infoDiv.width()===0){
                tileDiv.css({'margin-left':'2%'});
            } else{
                tileDiv.css({'margin-left':'0%'});
            }
            catalogDiv.append(tileDiv);
            clearTimeline(artworks);
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
                currentArtwork = null;
            }
            if (currTimelineCircleArea){
                currTimelineCircleArea.stop(true,true);
            }
            if (timelineShown && artworks){ 
                if (onAssocMediaView){
                    var loadAssocMediaTimeline;
                    setTimeout(function(){initTimeline(artworks)},1000);
                } else{ 
                    initTimeline(artworks);
                }
            }
            styleBottomContainer();
        }

        /* Helper method to style bottom container based on if timeline is shown
         * @method styleBottomContainer
         */
        function styleBottomContainer(){
            if (timelineShown){   
                    bottomContainer.css({
                        'height' : '69%',
                        'top' : '25%',
                        'z-index': '',
                    });
                
            } else {
                bottomContainer.css({
                    'height':'85%',
                    'top':'15%',
                    'z-index':'100005',
                });
            }
        }

    /**
     * Creates an artwork tile in a collection's catalog
     * @method drawArtworkTile
     * @param {doq} currentWork     the artwork/tour for which we're creating a tile
     * @param {String} tag          current sort tag
     * @param {Boolean} onSearch    whether this work is a match after searching
     * @param {Number} i            index into list of all works in this collection
     */
    function drawArtworkTile(currentWork, tag, onSearch, i) {
        return function () {
            var main      = $(document.createElement('div')),
                artTitle  = $(document.createElement('div')),
                artText   = $(document.createElement('div')),
                tileImage = $(document.createElement('img')),
                yearTextBox  = $(document.createElement('div')),
                yearText,
                tourLabel,
                videoLabel;
  
            artworkTiles[currentWork.Identifier] = main;
            main.addClass("tile");
            tileImage.addClass('tileImage');
            artTitle.addClass('artTitle');
            artText.addClass('artText');
            artText.css({
                'color': '#' + SECONDARY_FONT_COLOR,
                'font-family': FONT
            });
            yearTextBox.addClass('yearTextBox');
            yearTextBox.css({
                'color': '#' + SECONDARY_FONT_COLOR,
                'font-family': FONT
            });
            main.on('click', function () {

                // if the idle timer hasn't started already, start it
                if(!idleTimer) {
                    idleTimer = TAG.Util.IdleTimer.TwoStageTimer();
                    idleTimer.start();
                }
                showArtwork(currentWork, false)();
                zoomTimeline(artworkCircles[currentWork.Identifier])
                justShowedArtwork = true;
            })
            .on('click', doubleClickHandler)
            //For double click
            function doubleClickHandler(){
                if(previouslyClicked === main){
                    switchPage(currentArtwork);
                };
                previouslyClicked = main;

                setTimeout(function(){previouslyClicked = null}, 1000)
            }

            TAG.Telemetry.register(main, 'click', '', function(tobj) {
                var type;
                //if (currentThumbnail.attr('guid') === currentWork.Identifier && !justShowedArtwork) {
                //    tobj.ttype = 'collections_to_' + getWorkType(currentWork);
                //} else {
                    tobj.ttype = 'artwork_tile';
                //}
                //tobj.artwork_name = currentWork.Name;
                //tobj.artwork_guid = currentWork.Identifier;
                tobj.custom_1 = currentWork.Name;
                tobj.custom_2 = currentWork.Identifier;
                justShowedArtwork = false;
            });

            // Set tileImage to thumbnail image, if it exists
            if(currentWork.Metadata.Thumbnail) {
                tileImage.attr("src", FIX_PATH(currentWork.Metadata.Thumbnail));
            } else {
                tileImage.attr("src", tagPath+'images/no_thumbnail.svg');
            }

            // Add title
            if (tag === 'Title') {
                artText.text(TAG.Util.htmlEntityDecode(currentWork.Name));
            } else if (tag === 'Artist') {
                artText.text(currentWork.Type === 'Empty' ? '(Interactive Tour)' : currentWork.Metadata.Artist);
            } else if (tag === 'Date') {
                yearTextBox.css('visibility','visible');
                yearText = getDateText(getArtworkDate(currentWork,true));
                if (currentWork.Type === 'Empty'){
                    yearTextBox.text('')
                        .css('visibility','hidden');
                } else {
                    yearTextBox.text(yearText);
                }
                artText.text(currentWork.Type === 'Empty' ? '(Interactive Tour)' :  TAG.Util.htmlEntityDecode(currentWork.Name));

            } else if (tag === 'Type') { //TO-DO change to 'Tours'
                artText.text(TAG.Util.htmlEntityDecode(currentWork.Name));
            } else {
                //If using custom tag or are no sort tags
                artText.text(TAG.Util.htmlEntityDecode(currentWork.Name));
            }
            artTitle.append(artText);

            // Styling for searches
            if (!onSearch && searchInput.val() !== '') {
                main.css({ 'opacity': '0.2' });
                main.css('border', '1px solid black');
            } else if (onSearch) {
                tileImage.css({ 'opacity': '1.0'});
                main.css('border', '1px solid rgba(255, 255, 255, 0.5)');
            }
            main.append(tileImage)
                .append(artTitle)
                .append(yearTextBox);

            if (currentWork.Type === "Empty") {
                tourLabel = $(document.createElement('img'))
                    .addClass('tourLabel')
                    .attr('src', tagPath+'images/icons/catalog_tour_icon.svg');
                main.append(tourLabel);
            } else if (currentWork.Metadata.Medium === "Video") {
                videoLabel = $(document.createElement('img'))
                    .addClass('videoLabel')
                    .attr('src', tagPath+'images/icons/catalog_video_icon.svg');
                main.append(videoLabel);
            }

            tileDiv.append(main);
            //base height off original tileDivHeight (or else changes when scroll bar added on 6th tile)
            var tileHeight = (0.45) * tileDivHeight;
            main.css({'height': (0.45) * tileDivHeight});
            main.css({'width': (tileHeight/TILE_HEIGHT_RATIO)*TILE_WIDTH_RATIO});
             // Align tile so that it follows the grid pattern we want
            main.css({
                'left': Math.floor(i / 2) * (main.width() + TILE_BUFFER), 
                'top' : Math.floor(i % 2) * (main.height() + TILE_BUFFER)
            });       
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
                'border-radius': EVENT_CIRCLE_WIDTH * 3 / 4,
                'top': -EVENT_CIRCLE_WIDTH*3 / 4,
                'opacity': "1"
            });
            element.timelineDateLabel.css({
                    'visibility': 'visible',
                    'color' : 'white',
                    'font-size' : '120%' ,
                    'top': -EVENT_CIRCLE_WIDTH ,
                    'left': "0"
            })

        } else {
            element.css({
                'height': EVENT_CIRCLE_WIDTH,
                'width': EVENT_CIRCLE_WIDTH,
                'border-radius': EVENT_CIRCLE_WIDTH / 2,
                'top': -EVENT_CIRCLE_WIDTH / 2,
                'opacity': .5
            });
            element.timelineDateLabel.css({
                    'color' : 'rgb(170,170,170)',
                    'font-size' : '100%' ,
                    'top': -EVENT_CIRCLE_WIDTH,
                    'left': "-20%"
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

        //Hide timeline if there are no compatible dates-- mostly for backwards compatibility
        if (avlTree.min().yearKey === Number.POSITIVE_INFINITY){
            timelineShown = false;
            clearTimeline();
            if ($('#titleButton')){
                currentTag = "Title";
            } else {
                currentTag = currentDefaultTag || null;
            }
            changeDisplayTag(artworks,currentTag);
            colorSortTags(currentTag);
            return;
        }
        
        //Skip before tours and artworks with incompatible dates
        while (maxNode.yearKey === Number.POSITIVE_INFINITY){
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
            currentArtwork && zoomTimeline(artworkCircles[currentArtwork.Identifier])
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
                    'left' : i/(numTicks-1)*100 + '%'
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

            timeRange = maxDate - minDate;

            timelineCircleArea.addClass('timelineCircleArea');
            timelineArea.append(timelineCircleArea);

            curr = avlTree.min();
            art = curr.artwork;
       
            while (curr&& curr.yearKey!==Number.POSITIVE_INFINITY){
                if (!isNaN(curr.yearKey)){
                    positionOnTimeline = 100*(curr.yearKey - minDate)/timeRange;

                    //Create and append event circle
                    eventCircle = $(document.createElement('div'));  
                    eventCircle.addClass('timelineEventCircle')
                                .css('left', positionOnTimeline + '%')
                                .on('click', (function(art, eventCircle) {
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
                    timelineCircleArea.append(eventCircle);

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

            //Set intitial style of timeline event circles and set their zoomLevel
            for (var i = 0; i < timelineEventCircles.length; i++) { // Make sure all other circles are grayed-out and small
                timelineEventCircles[i].zoomLevel = getZoomLevel(timelineEventCircles[i]);
                styleTimelineCircle(timelineEventCircles[i], false)
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

    function displayLabels(circ, selectedCircle){
        var prevNode,
            labelOverlap,
            timelineDateLabel = circ.timelineDateLabel,
            nextCircle = timelineEventCircles[timelineEventCircles.indexOf(circ) + 1],
            prevCircle = timelineEventCircles[timelineEventCircles.indexOf(circ) - 1];

        // Always show current circle, and if there are other circles with the same date, hide them
        if (selectedCircle && circ.yearKey === selectedCircle.yearKey){
            timelineDateLabel.css('visibility', 'hidden');
                if (circ === selectedCircle){
                    timelineDateLabel.css('visibility', 'visible');
                };
            return;
        };

        //Decide whether to display labels:
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
            } else{
                timelineDateLabel.css('visibility', 'hidden');
                if (timelineEventCircles.indexOf(circ) === 0 || timelineEventCircles.indexOf(circ) === timelineEventCircles.length){
                    timelineDateLabel.css('visibility','visible');
                }               
            } 
        }
        if (circ === timelineEventCircles[0]){
            timelineDateLabel.css('visibility', 'visible');
        }
    }
    
    function zoomTimeline(circle){
        var i,
            j,
            tick,
            tickTarget,
            center = .5,
            currOffset = circle ? center - circle.Offset : 0,
            zoomLevel = circle ? circle.zoomLevel : 1,
            circleTarget,
            otherCircle;

        for (i = 0; i<timelineEventCircles.length ;i++){
            otherCircle = timelineEventCircles[i]
            circleTarget = location(otherCircle)
            otherCircle.stop();
            otherCircle.animate(
                {"left" : parseInt(circleTarget*otherCircle.parent().width()) - EVENT_CIRCLE_WIDTH*15/20}, 1000,"easeInOutQuint", (function(otherCircle) {
                    return function() {
                        displayLabels(otherCircle, circle);
                    };
                })(otherCircle));
        }

        for (j = 0; j < timelineTicks.length; j++){
            tick = timelineTicks[j]
            tickTarget = location(tick)
            tick.stop()
            tick.animate(
                {"left" : (tickTarget*100) + "%"}, 1000,"easeInOutQuint");
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
        //Hard-coded 4 pixel buffer between labels for clarity 
        return Math.round(position1) + labelWidth + 4 > position2;
    }

    /**
      * Close the pop-up outset box of an artwork preview in the collections page
      * @method hideArtwork
      * @param {doq} artwork        the artwork doq to be hidden
      */
    function hideArtwork(artwork) {
        return function () {
            if (!artwork) {
                return;
            }
            selectedArtworkContainer.animate({'opacity': 0}, ANIMATION_DURATION, function(){
                selectedArtworkContainer.css('display', 'none')
                });
            overlay.css('z-index', '1');
            if (artworkCircles[artwork.Identifier]){
                styleTimelineCircle(artworkCircles[artwork.Identifier], false);
            }
            zoomTimeline();
            catalogDiv.stop(true,false);
            artworkShown = false;
        };
    }

    /**
     * Shows an artwork as an outset box and shows name, description, etc
     * @method showArtwork
     * @param {doq} artwork     the artwork doq to be shown
     * @param {showAllAtYear}       whether all of the artworks at a specific year should be shown
     */
    function showArtwork(artwork, showAllAtYear) {
        return function () {
            var rootWidth,
                infoWidth,
                tileWidth,
                shift,
                leftOffset,
                previewWidth,
                containerWidth,
                newTile,
                previewTile,
                progressCircCSS,
                timelineDateLabel,
                circle,
                artworksForYear,
                i,
                descText = $(document.createElement('div')),
                currentThumbnail = $(document.createElement('img'));

            if (!artwork) {
                return;
            }

            //scroll catalogDiv to center the current artwork
            catalogDiv.stop(true,false);
            rootWidth = root.width();
            infoWidth = infoDiv.width();
            tileWidth = artworkTiles[artwork.Identifier].width();

            catalogDiv.stop();
            catalogDiv.animate({
                scrollLeft: artworkTiles[artwork.Identifier].position().left - rootWidth/2 + infoWidth + tileWidth/2 - TILE_BUFFER
            }, ANIMATION_DURATION/2, "easeInOutQuint");

            //Stop any previously-running animations
            selectedArtworkContainer.stop();
            if (artworkShown){
                selectedArtworkContainer.animate(
                        {"opacity": 0}, 
                        ANIMATION_DURATION, 
                        function(){
                            fillSelectedArtworkContainer();
                            selectedArtworkContainer.children().animate(
                                {"opacity": 1},
                                ANIMATION_DURATION
                            )
                        }
                )
            } else {
                selectedArtworkContainer.animate(
                    {"opacity": 0}, 
                    ANIMATION_DURATION/2, 
                    function(){
                        fillSelectedArtworkContainer();
                        selectedArtworkContainer.children().animate(
                            {"opacity": 1},
                            ANIMATION_DURATION*2
                        )
                    }
                )
            }

            currentArtwork = artwork;
            artworkSelected = true;
            artworkShown = true;
            multipleShown = showAllAtYear;

            // Set selected artwork to hide when anything else is clicked
            root.on('mouseup', function(e) {
                var subject = selectedArtworkContainer;
                if (e.target.id != subject.attr('id') && !$(e.target).hasClass('tileImage') &&!$(e.target).hasClass('timelineEventCircle') && !subject.has(e.target).length) {
                    if (artworkShown){
                        hideArtwork(currentArtwork)();
                    }
                }
            });

            function fillSelectedArtworkContainer(){
                //Set up elements of selectedArtworkContainer
                previewWidth = (0.38) * $("#tagRoot").width();

                selectedArtworkContainer.empty();

                artworksForYear = artworkCircles[artwork.Identifier] && artworkYears[artworkCircles[artwork.Identifier].timelineDateLabel.text()];
               
                //If there are multiple artworks that should all be shown, selectedArtworkContainer will contain all of them and be larger
                if (showAllAtYear && artworksForYear){
                    for (i = 0; i < artworksForYear.length; i++) {
                        newTile = createOnePreviewTile(artworksForYear[i]);
                        newTile.css({
                            'left': (i * previewWidth) + 'px',
                            'width': previewWidth
                        });
                    }
                    containerWidth = Math.min(($("#tagRoot").width()*.80), (artworksForYear.length) * previewWidth);
                } else {
                    newTile = createOnePreviewTile(artwork);
                    newTile.css('left', '0%');
                    containerWidth = previewWidth;
                }

                //center selectedArtworkContainer over current artwork thumbnail
                shift = (containerWidth-tileWidth)/2;
                leftOffset = artworkTiles[artwork.Identifier].position().left + infoWidth - catalogDiv.scrollLeft();

                //if artwork tile at beginning of window
                if (leftOffset < shift){
                    shift = 0;
                }
                //if artwork tile at end of window
                if (leftOffset + tileWidth + TILE_BUFFER > rootWidth){ 
                    shift = shift * 2;
                }


                //if there are more than 3 artworks associated with the date year
                if (showAllAtYear && artworkCircles[artwork.Identifier] && artworkYears[artworkCircles[artwork.Identifier].timelineDateLabel.text()].length >= 3){
                    leftOffset = bottomContainer.width()/10
                    shift = 0;
                    //shift = rootWidth/10;
                }
                selectedArtworkContainer.css({
                    'width' : containerWidth,
                    'display': 'inline',
                    'left' : leftOffset - shift
                })
                selectedArtworkContainer.animate({'opacity': 1}, ANIMATION_DURATION/2);
                overlay.css('z-index', '100002');
                topBar.css('z-index','100003');
            }

            /* Helper method to create a preview tile for an artwork and append to selectedArtworkContainer
             * @method createOnePreviewTile
             * @param {Object} artwork       //artwork to create preview tile for
             * @return {Object} previewTile    //preview tile just created
             */
            function createOnePreviewTile(artwork){
                var previewTile,
                    tileTop,
                    tileBottom,
                    titleSpan,
                    imgDiv,
                    exploreTab,
                    exploreText,
                    exploreIcon,
                    infoText,
                    artistInfo,
                    yearInfo,
                    descSpan;



                //Entire tile
                previewTile = $(document.createElement('div'))
                    .addClass('previewTile');

                //Top portion of the tile (with image, title, and subtitle)
                tileTop = $(document.createElement('div'))
                    .addClass('tileTop');

                //Tile title
                titleSpan = $(document.createElement('div'))
                    .addClass('titleSpan')
                         .text(TAG.Util.htmlEntityDecode(artwork.Name))
                    .css({
                        'color': '#' + SECONDARY_FONT_COLOR,
                        'font-family': FONT
                    });

                //Image div
                imgDiv = $(document.createElement('div'))
                    .addClass('imgDiv');

                //Explore div
                exploreTab = $(document.createElement('div'))
                    .addClass('exploreTab')
                    .on('click', switchPage(artwork))

                //Explore icon
                exploreIcon = $(document.createElement('img'))
                    .addClass('exploreIcon')
                    .attr('src', tagPath+'images/icons/ExploreIcon.svg');

                //Explore text
                exploreText = $(document.createElement('div'))
                    .addClass('exploreText')
                    .css("font-size",  BASE_FONT_SIZE*2/3 + 'em')
                    .text("Tap to Explore");

                exploreTab.append(exploreIcon)
                          .append(exploreText);

                //Thumbnail image
                currentThumbnail.addClass('currentThumbnail')
                    .attr('src', artwork.Metadata.Thumbnail ? FIX_PATH(artwork.Metadata.Thumbnail) : (tagPath+'images/no_thumbnail.svg'))
                    .on('click', switchPage(artwork));

                //Telemetry stuff
                TAG.Telemetry.register($("#currentThumbnail,#exploreTab"), 'click', '', function(tobj) {
                    if (!artwork || !artworkSelected) {
                        return true; // abort
                    }
                    tobj.custom_1 = artwork.Name;
                    tobj.custom_2 = artwork.Identifier;
                    tobj.ttype     = 'collection_to_' + getWorkType(artwork); 
                });

                //Div for artist and year info, directly below image thumbnail
                infoText = $(document.createElement('div'))
                    .addClass('infoText');

                //Artist name
                artistInfo = $(document.createElement('div'))
                    .addClass('artistInfo')
                    .css({ 
                    'font-size': 11 * BASE_FONT_SIZE / 30 + 'em',
                    'color': '#' + SECONDARY_FONT_COLOR,
                    'font-family': FONT
                });

                //Year of creation
                yearInfo = $(document.createElement('div'))
                    .addClass('yearInfo')
                    .css({ 
                    'font-size': 11 * BASE_FONT_SIZE / 30 + 'em',
                    'color': '#' + SECONDARY_FONT_COLOR,
                    'font-family': FONT
                });

                //Set texts of labels
                if (artwork.Type !== "Empty") {
                    artistInfo.text("Artist: " + (artwork.Metadata.Artist || "Unknown"));
                    yearInfo.text(getDateText(getArtworkDate(artwork,false)) || " ");
                } else {
                    artistInfo.text("(Interactive Tour)" );
                    yearInfo.text(" " );
                }

                //Bottom portion of the tile (with thumbnails, description, etc)
                tileBottom = $(document.createElement('div'))
                    .addClass('tileBottom');

                //Description of art
                descText.addClass('descText');

                //Div for above description
                descSpan = $(document.createElement('div'))
                    .addClass('descSpan')
                    .html(Autolinker.link(artwork.Metadata.Description ? artwork.Metadata.Description.replace(/\n/g, '<br />') : '', {email: false, twitter: false}))
                    .css({
                    'color': '#' + SECONDARY_FONT_COLOR,
                    'font-family': FONT
                });

                //Append everything
                infoText.append(artistInfo)
                        .append(yearInfo);

                imgDiv.append(exploreTab)
                      .append(currentThumbnail)
                      .append(infoText);

                tileTop.append(imgDiv)
                    .append(titleSpan)
                    .append(infoText);

                descText.append(descSpan);

                tileBottom.append(descText)

                previewTile.append(tileTop)
                    .append(tileBottom);

                selectedArtworkContainer.append(previewTile);


                createThumbnailsForSelectedArtworkContainer(artwork)
                return previewTile;
            }

            //Circle (with date) on timeline
            for (i = 0; i < timelineEventCircles.length; i++) { // Make sure all other circles are grayed-out and small
                styleTimelineCircle (timelineEventCircles[i], false)
            };

            // Make current circle larger and white
            if (artworkCircles[artwork.Identifier]){
                styleTimelineCircle(artworkCircles[artwork.Identifier], true)
            };

            //Progress circle for loading
            // TODO: is this showing up? Look into
            progressCircCSS = {
                'position': 'absolute',
                'float'   : 'left',
                'left'    : '12%',
                'z-index' : '50',
                'height'  : '20%',
                'width'   : 'auto',
                'top'     : '22%',
            };

            circle = TAG.Util.showProgressCircle(descText, progressCircCSS, '0px', '0px', false);

            currentThumbnail.on('load', function () {
                TAG.Util.removeProgressCircle(circle);
            });
        };
    }


    function createThumbnailsForSelectedArtworkContainer(artwork){
    }



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
            comparator = sortComparator('nameKey');
            valuation  = sortValuation('nameKey');

            avlTree = new AVLTree(comparator, valuation);
            avlTree.clear();
            for (i = 0; i < artworks.length; i++) {
                artNode = {
                    artwork: artworks[i],
                    nameKey: artworks[i].Name,
                };
                avlTree.add(artNode);
            }
            return avlTree;
        } else if (tag === 'Artist') {
            comparator = sortComparator('artistKey');
            valuation  = sortValuation('artistKey');

            avlTree = new AVLTree(comparator, valuation);
            for (i = 0; i < artworks.length; i++) {
                artNode = {
                    artwork: artworks[i],
                    artistKey: artworks[i].Type === 'Empty' ? '~~~~' : artworks[i].Metadata.Artist // tours show up at end
                };
                avlTree.add(artNode);
            }
            return avlTree;
        } else if (tag === 'Date') {
            return sortByYear(artworks,false);

        } else if (tag === 'Type') {  //TO-DO change to 'Tours'
            comparator = sortComparator('typeKey', 'nameKey');
            valuation  = sortValuation('nameKey');

            avlTree = new AVLTree(comparator, valuation);
            for (i = 0; i < artworks.length; i++) {
                artNode = {
                    artwork: artworks[i],
                    nameKey: artworks[i].Name,
                    typeKey: artworks[i].Type === 'Empty' ? 1 : (artworks[i].Metadata.Type === 'Artwork' ? 2 : 3)
                };
                avlTree.add(artNode);
            }
            return avlTree;
        } 
        //For custom sort tags
        else if (tag){
            comparator = sortComparator('sortKey');
            valuation = sortValuation('sortKey');
            avlTree = new AVLTree(comparator,valuation);
            avlTree.clear();
            for (i = 0; i < artworks.length; i++) {
                artNode = {
                    artwork: artworks[i],
                    sortKeyMetadataType: tag,
                    sortKey: artworks[i].Metadata.infoFields[tag] || null
                };
                avlTree.add(artNode);
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
     * @param {Boolean} timelineDate  whether you are sorting by timeline date (vs metadata date for thumbnail sorting)
     * @return {AVLTree} avlTree      sorted tree so order can be easily accessed
    **/
    function sortByYear(artworks, timelineDate){
        var comparator,
            valuation,
            avlTree,
            artNode,
            artworkDate,
            yearKey,
            i;
        comparator = sortComparator('yearKey', 'nameKey');
        valuation  = sortValuation('yearKey');
        avlTree = new AVLTree(comparator, valuation);
        for (i = 0; i < artworks.length; i++) {
            if (timelineDate){
                artworkDate = getArtworkDate(artworks[i],true);
            } else {
                artworkDate = getArtworkDate(artworks[i],false);
            }
            yearKey = TAG.Util.parseDateToYear(artworkDate);
            if (!isNaN(yearKey)){
                artNode = {
                    artwork: artworks[i],
                    nameKey: artworks[i].Name,
                    yearKey: artworks[i].Type === 'Empty' ? Number.POSITIVE_INFINITY : yearKey //Tours set to Infinity to show up at end of 'Year' sort
                };
            } else{                        
                artNode = {
                    artwork: artworks[i],
                    nameKey: artworks[i].Name,
                    yearKey: Number.POSITIVE_INFINITY //Set unintelligible dates to Infinity to show up at end of 'Year' sort 
                };
            }
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
    * @return {String} dateText    text to display in mm/dd/yyyy or mm/yyyy format (Note- would need to change for internationalization)
    */   
    function getDateText(date){
        var yearText,
            neg = false,
            monthDict,
            month,
            monthText,
            dayText,
            dateText;
        yearText = TAG.Util.parseDateToYear({year: date.year});
        if (yearText<0){
            yearText = -yearText;
            neg = true;
        } 
        dateText = yearText;
        monthDict = {
                    "January": 1,
                    "February:": 2,
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
        //$('.rowButton').css('color', 'rgb(170,170,170)');
       // $('[tagName="'+tag+'"]').css('color', 'white');
       var unselectedColor = TAG.Util.UI.dimColor(SECONDARY_FONT_COLOR);
       $('.rowButton').css('color', unselectedColor);
       if (tag){
            $('#' + tag.toLowerCase() + 'Button').css('color', '#' + SECONDARY_FONT_COLOR);
       }
       //$('[tagName="' + tag + '"]').css('color', '#' + SECONDARY_FONT_COLOR);
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

        currentTag = tag;
        colorSortTags(currentTag);
        if (tag !== 'Type') {
            drawCatalog(artworks, currentTag, 0, false);
        } else {
            for (i = 0; i < artworks.length; i++) {
                if (guidsSeen.indexOf(artworks[i].Identifier) < 0) {
                    guidsSeen.push(artworks[i].Identifier);
                } else {
                    continue;
                }
                if (artworks[i].Type === "Empty") {
                    toursArray.push(artworks[i]);
                } else if (artworks[i].Metadata.Type === "Artwork") {
                    artsArray.push(artworks[i]);
                } else {
                    videosArray.push(artworks[i]);
                }
            }

            // draw tours, artworks, then videos
            bigArray.concat(toursArray).concat(artsArray).concat(videosArray);
            if ($('#titleButton')){
                drawCatalog(bigArray, "Title" , 0, false);
            } else {
                drawCatalog(bigArray,currentDefaultTag,0,false);
            }
        }
        doSearch(); // search with new tag
    }

    /**
     * Switch to the tour player
     * @method switchPageTour
     * @param {doq} tour    the relevant tour doq
     */
    function switchPageTour(tour) {
        var rinData,
            rinPlayer,
            prevInfo,
            messageBox,
            collectionOptions,
            parentid;

            if (TAG.Util.Splitscreen.isOn()) {
                    confirmationBox = $(TAG.Util.UI.PopUpConfirmation(function () {
                            TAG.Util.Splitscreen.exit(root.data('split') || 'L');
                            tourClicked(tour)();
                        },
                        "By opening this tour, you will exit splitscreen mode. Would you like to continue?",
                        "Continue",
                        false,
                        function () {
                            confirmationBox.remove();
                        },
                        root
                    ));

                    confirmationBox.css('z-index', 10001);
                    root.append(confirmationBox);
                    confirmationBox.show();
                }


        rinData = JSON.parse(unescape(tour.Metadata.Content));

        if (!rinData || !rinData.data) {
            messageBox = $(TAG.Util.UI.popUpMessage(null, "Cannot play empty tour.", null));
            messageBox.css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 7);
            root.append(messageBox);
            messageBox.fadeIn(500);
            return;
        }
        
        scrollPos = catalogDiv.scrollLeft();

        collectionOptions = {
            backScroll: scrollPos,
            backCollection: currCollection,
            prevTag : currentTag,
            backArtwork: tour,
            prevMult : multipleShown
        }

        rinPlayer = TAG.Layout.TourPlayer(rinData, currCollection, collectionOptions, null, tour);

        TAG.Util.UI.slidePageLeftSplit(root, rinPlayer.getRoot(), rinPlayer.startPlayback);

        currentPage.name = TAG.Util.Constants.pages.TOUR_PLAYER;
        currentPage.obj  = rinPlayer;
    }

    /**
     * Switch to the video player
     * @method switchPageVideo
     * @param {doq} video         the video to which we'll switch
     */
    function switchPageVideo(video) {
        var prevInfo,
            videoPlayer;

        scrollPos = catalogDiv.scrollLeft();
        prevInfo = {
            artworkPrev: null,
            prevScroll: scrollPos,
            prevTag: currentTag,
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
    function switchPage(artwork) {
        return function() {
            var artworkViewer,
                newPageRoot,
                splitopts = 'L',
                opts = getState(),
                confirmationBox,
                prevInfo;

            if (!artwork|| !artworkSelected) {
                return;
            }

            if (artwork.Type === "Empty") { // tour
                if (TAG.Util.Splitscreen.isOn()) {
                    confirmationBox = $(TAG.Util.UI.PopUpConfirmation(function () {
                            TAG.Util.Splitscreen.exit(root.data('split') || 'L');
                            switchPageTour(artwork);
                        },
                        "By opening this tour, you will exit split screen mode. Would you like to continue?",
                        "Continue",
                        false,
                        function () {
                            confirmationBox.remove();
                        },
                        root
                    ));
                    confirmationBox.css('z-index', 10001);
                    root.append(confirmationBox);
                    confirmationBox.show();
                } else {
                    switchPageTour(artwork);
                }
            } else if (artwork.Metadata.Type === "VideoArtwork") { // video
                if (TAG.Util.Splitscreen.isOn()) {
                    confirmationBox = $(TAG.Util.UI.PopUpConfirmation(function () {
                            TAG.Util.Splitscreen.exit(root.data('split') || 'L');
                            switchPageVideo(artwork);
                        },
                        "By opening this video, you will exit split screen mode. Would you like to continue?",
                        "Continue",
                        false,
                        function () {
                            confirmationBox.remove();
                        },
                        root
                    ));
                    confirmationBox.css('z-index', 10001);
                    root.append(confirmationBox);
                    confirmationBox.show();
                } else {
                    switchPageVideo(artwork);
                }
            } else { // deepzoom artwork
                scrollPos = catalogDiv.scrollLeft();
                artworkViewer = TAG.Layout.ArtworkViewer({
                    doq: artwork,
                    prevTag : currentTag,
                    prevScroll: catalogDiv.scrollLeft(),
                    prevCollection: currCollection,
                    prevPage: 'catalog',
                    prevMult: multipleShown
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

    //UNCOMMENT IF WE EVER WANT SPLITSCREEN ACCESS FROM CATALOG
    //     /**
    //  * Initializes splitscreen functionality
    //  * @method initSplitscreen
    //  */
    // function initSplitscreen() {
    //     splitscreenIcon.attr({
    //             src: tagPath+'images/SplitWhite_dotted.svg'
    //         })
    //         .addClass('bottomButton')
    //     if (TAG.Util.Splitscreen.isOn()) {
    //         splitscreenIcon.css('display', 'none');
    //     }
    //     splitscreenIcon.on('click', function () {
    //         var collectionsPage,
    //             collectionsPageRoot,
    //             newCollectionsPage,
    //             newCollectionsPageRoot;

    //         if (!TAG.Util.Splitscreen.isOn()) {
    //             TAG.Util.Splitscreen.setOn(true);
    //             collectionsPage = TAG.Layout.CollectionsPage();
    //             collectionsPageRoot = collectionsPage.getRoot();
    //             collectionsPageRoot.data('split', 'R');

    //             newCollectionsPage = TAG.Layout.CollectionsPage();
    //             newCollectionsPageRoot = newCollectionsPage.getRoot();
    //             newCollectionsPageRoot.data('split', 'L');
    //             setTimeout(function(){
    //                 root.detach();
    //                 root = newCollectionsPageRoot;
    //                 newCollectionsPage.loadCollection(currCollection, scrollPos, currentArtwork)
    //                 infoButton.css("float", "left");
    //                 linkButton.css("float", "left");
    //             }, 1000);
    //             TAG.Util.Splitscreen.init(newCollectionsPageRoot, collectionsPageRoot);
    //         }
    //     });
    // }

    /**
     * Gets the current state of the collections page
     * @method getState
     * @return {Object}    object containing state
     */
    function getState() {
        return {
            exhibition: currCollection,
            currentTag: currentTag,
            currentImage: currentArtwork
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
        loadFirstCollection: loadFirstCollection
    };
};

TAG.Layout.CollectionsPage.default_options = {};
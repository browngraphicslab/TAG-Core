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
        bgimage                  = root.find('#bgimage'),
        bottomContainer          = root.find('#bottomContainer'),
        catalogDiv               = root.find('#catalogDiv'),
        infoTilesContainer       = root.find('#infoTilesContainer'),
        sortRow                  = root.find('#sortRow'),
        searchInput              = root.find('#searchInput'),
        searchTxt                = root.find('#searchTxt'),
        selectedArtworkContainer = root.find('#selectedArtworkContainer'),
        titleSpan                = root.find('#titleSpan'),
        imgDiv                   = root.find('#imgDiv'),
        currentThumbnail         = root.find('#currentThumbnail'),
        exploreTab               = root.find('#exploreTab'),
        exploreText              = root.find('#exploreText'),
        exploreIcon              = root.find('#exploreIcon'),
        infoText                 = root.find('#moreInfo'),
        artistInfo               = root.find('#artistInfo'),
        yearInfo                 = root.find('#yearInfo'),
        descText                 = root.find('#descText'),
        descSpan                 = root.find('#descSpan'),
        timelineArea             = root.find('#timelineArea'),
        topBar                   = root.find('#topBar'),
        loadingArea              = root.find('#loadingArea'),
        infoButton               = root.find('#infoButton'),
        linkButton               = root.find('#linkButton'),

        // input options
        scrollPos        = options.backScroll || 0,     // horizontal position within collection's catalog
        currCollection   = options.backCollection,      // the currently selected collection
        currentArtwork   = options.backArtwork,         // the currently selected artwork
        currentTag       = options.backTag,             // current sort tag for collection
        multipleShown    = options.backMult,            // whether multiple artworks shown at a specific year, if applicable
        
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


        // constants
        BASE_FONT_SIZE      = TAG.Worktop.Database.getBaseFontSize(),       // base font size for current font
        FIX_PATH            = TAG.Worktop.Database.fixPath,                 // prepend server address to given path
        MAX_YEAR            = (new Date()).getFullYear(),                   // Maximum display year for the timeline is current year
        EVENT_CIRCLE_WIDTH  = Math.max(20, $("#tagContainer").width()/40),  // width of the circles for the timeline                                // pixel width of event circles
        COLLECTION_DOT_WIDTH = Math.max(7, $("#tagContainer").width() / 100),  // width of the circles for the timeline                                // pixel width of event circles
        LEFT_SHIFT = 9,                                            // pixel shift of timeline event circles to center on ticks 
        TILE_BUFFER         = $("#tagContainer").width() / 100,              // number of pixels between artwork tiles
        TILE_HEIGHT_RATIO   = 200,                                          //ratio between width and height of artwork tiles
        TILE_WIDTH_RATIO    = 255,
        ANIMATION_DURATION  = 800,                                         // duration of timeline zoom animation

        // misc uninitialized vars
        fullMinDisplayDate,             // minimum display date of full timeline
        fullMaxDisplayDate,             // maximum display date of full timeline
        initTimelineWidth,              // initial width of timeline
        initTimelineLeft,               // initial left position of timeline
        currentTimeline,                // currently displayed timeline
        currTimelineCircleArea,         // current timeline circle area
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
        defaultTag;                    // default sort tag
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

        root.find('.rowButton').on('click', function() {
            changeDisplayTag(currentArtworks, $(this).attr('tagName'));
        });

        TAG.Telemetry.register(root.find('#artistButton'), 'click', '', function(tobj) {
            tobj.ttype = 'sort_by_artist';
        });

        TAG.Telemetry.register(root.find('#titleButton'), 'click', '', function(tobj) {
            tobj.ttype = 'sort_by_title';
        });

        TAG.Telemetry.register(root.find('#yearButton'), 'click', '', function(tobj) {
            tobj.ttype = 'sort_by_year';
        });

        TAG.Telemetry.register(root.find('#typeButton'), 'click', '', function(tobj) {
            tobj.ttype = 'sort_by_type';
        });

        // search on keyup
        searchInput.on('keyup', function (e) {
            doSearch();
        });

        infoButton.attr('src', tagPath+'images/icons/info.svg');

        if (IS_WEBAPP) {
            linkButton.attr('src', tagPath + 'images/link.svg');
            linkButton.on('click', function () {
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

        TAG.Worktop.Database.getExhibitions(getCollectionsHelper, null, getCollectionsHelper);
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
            collectionDotHolder = $(document.createElement('div')),
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
        collectionDotHolder.addClass('collectionDotHolder');
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
           
            collectionDot  = $(document.createElement('div'))
                        .addClass('collectionDot')
                        .css({
                            "width": COLLECTION_DOT_WIDTH,
                            "height":  COLLECTION_DOT_WIDTH,
                            "border-radius": COLLECTION_DOT_WIDTH / 2,
                            "margin": COLLECTION_DOT_WIDTH/4
                        })
                         .on('click', loadCollection(visibleCollections[i]));

            collectionDotHolder.append(collectionDot);
            topBar.append(collectionDotHolder);

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
                mainCollection    = $(document.createElement('div')),
                nextCollection    = $(document.createElement('div')),
                prevCollection    = $(document.createElement('div')),
                titleBox          = $(document.createElement('div')),
                collectionDescription = $(document.createElement('div')),
                str,
                text              = collection.Metadata.Description ? TAG.Util.htmlEntityDecode(collection.Metadata.Description) : "";

            // if the idle timer hasn't started already, start it
            if(!idleTimer && evt) { // loadCollection is called without an event to show the first collection
                idleTimer = TAG.Util.IdleTimer.TwoStageTimer();
                idleTimer.start();
            }

            // Clear search box
            searchTxt.text("");

            // Clear catalog div (with info and artwork tiles)
            catalogDiv.empty();

            //Set background image
            if (collection.Metadata.BackgroundImage) {
               bgimage.css('background-image', "url(" + FIX_PATH(collection.Metadata.BackgroundImage) + ")");
            }

            //Make collection dot white and others gray
            for(i = 0; i < visibleCollections.length; i++) { 
                collectionDots[visibleCollections[i].Identifier].css('background-color','rgb(170,170,170)');
            }
            collectionDots[collection.Identifier].css('background-color', 'white');

            // Add collection title
            collectionArea.empty();
            mainCollection.addClass('mainCollection')
                          .attr({
                            'id': 'collection-' + collection.Identifier,
                           });

            titleBox.attr('id' ,'collection-title-'+collection.Identifier)
                    .addClass('collection-title')
                    .html(title);

            mainCollection.append(titleBox);
            
            // Add previous and next collection titles
            if (collection.prevCollectionIndex||collection.prevCollectionIndex===0){
                prevTitle = TAG.Util.htmlEntityDecode(visibleCollections[collection.prevCollectionIndex].Name)
                backArrowArea.addClass('arrowArea');
                backArrowArea.css('left', '0%')
                             .on('click',function(){
                                            return function(){
                                                loadCollection(visibleCollections[collection.prevCollectionIndex], sPos, artwrk)();
                                                currentTag = null;
                                            }
                                        }());
                collectionArea.append(backArrowArea);
                backArrow.attr('src', tagPath + 'images/icons/Close.svg');
                backArrow.addClass('arrow');
                prevCollection.addClass('nextPrevCollection')
                              .attr({
                                'id': 'collection-' + visibleCollections[collection.prevCollectionIndex].Identifier
                               })
                              .css('left','3%')
                              .html(prevTitle)
                              .on('click', function(){
                                            return function(){
                                                loadCollection(visibleCollections[collection.prevCollectionIndex], sPos, artwrk)();
                                                currentTag = null;
                                            }
                                        }());
                TAG.Telemetry.register(backArrowArea, 'click', 'collection_title', function(tobj){
                    tobj.custom_1 = prevTitle;
                    tobj.custom_2 = visibleCollections[collection.prevCollectionIndex].Identifier;
                });
                TAG.Telemetry.register(prevCollection, 'click', 'collection_title', function(tobj){
                    tobj.custom_1 = prevTitle;
                    tobj.custom_2 = visibleCollections[collection.prevCollectionIndex].Identifier;
                });
                collectionArea.append(prevCollection);
            };

            collectionArea.append(mainCollection);
            if (prevCollection){
                prevCollection.css('width', (.95 * collectionArea.width() - mainCollection.width())/2 - backArrowArea.width());
            }
            if (collection.nextCollectionIndex||collection.nextCollectionIndex===0){
                nextTitle = TAG.Util.htmlEntityDecode(visibleCollections[collection.nextCollectionIndex].Name)
                nextArrowArea.addClass('arrowArea');
                nextArrowArea.css({
                    'right': '0%'})
                             .on('click', function(){
                                            return function(){
                                                loadCollection(visibleCollections[collection.nextCollectionIndex], sPos, artwrk)();
                                                currentTag = null;
                                            }
                                        }());
                collectionArea.append(nextArrowArea);
                nextArrow.attr('src', tagPath + 'images/icons/Open.svg');
                nextArrow.addClass('arrow');
                nextCollection.addClass('nextPrevCollection')
                              .attr({
                                'id': 'collection-' + visibleCollections[collection.nextCollectionIndex].Identifier
                               })
                              .html(nextTitle)
                              .css({
                                'width': (.95 * collectionArea.width() - mainCollection.width())/2 - nextArrowArea.width(),
                              })
                              .on('click', function(){
                                            return function(){
                                                loadCollection(visibleCollections[collection.nextCollectionIndex], sPos, artwrk)();
                                                currentTag = null;
                                            }
                                        }());
                TAG.Telemetry.register(nextArrowArea, 'click', 'collection_title', function(tobj){
                    tobj.custom_1 = nextTitle;
                    tobj.custom_2 = visibleCollections[collection.nextCollectionIndex].Identifier;
                });
                TAG.Telemetry.register(nextCollection, 'click', 'collection_title', function(tobj){
                    tobj.custom_1 = nextTitle;
                    tobj.custom_2 = visibleCollections[collection.nextCollectionIndex].Identifier;
                });
                collectionArea.append(nextCollection);
            };


            // Hide selected artwork container, as nothing is selected yet
            selectedArtworkContainer.css('display', 'none');


            collectionDescription.attr('id', 'collectionDescription');
            str = collection.Metadata.Description ? collection.Metadata.Description.replace(/\n\r?/g, '<br />') : "";
            collectionDescription.css({
                'font-size': 0.2 * TAG.Util.getMaxFontSizeEM(str, 1.5, 0.55 * $(infoDiv).width(), 0.915 * $(infoDiv).height(), 0.1),
            });
            collectionDescription.html(Autolinker.link(str, {email: false, twitter: false}));
            tileDiv.empty();
            catalogDiv.append(tileDiv);
            infoDiv.empty();
            infoDiv.append(collectionDescription);
            catalogDiv.append(infoDiv);
            timelineArea.empty();


            //If there's no description, change UI so that artwork tiles take up entire bottom area
            collection.Metadata.Description ? infoDiv.css('width', '25%') : infoDiv.css('width', '0');

            //TO-DO: add in 
            //timelineShown = collection.Metadata.Timeline;

            currCollection = collection;
            currentArtwork = artwrk || null;
            //loadCollection.call($('#collection-'+ currCollection.Identifier), currCollection);
            scrollPos = sPos || 0;
            getCollectionContents(currCollection);
        }
    }

    /**
     * Helper function to load first collection
     * @method loadFirstCollection
     */
    function loadFirstCollection() {
        loadCollection(toShowFirst)(); // first collection selected by default
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

        for (i = 0; i < contents.length; i++) {
            cts = contents[i];
            if (!cts) {
                continue;
            }
            info = cts.Name + " " + cts.Metadata.Artist + " " + cts.Metadata.Year + " " + cts.Metadata.Type;
            infoSource.push({
                "id": i,
                "keys": info.toLowerCase()
            });
        }
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
        if (!currentTag){
            //If currentTag not defined currentTag is either 'year' or 'title' depending on if timeline is shown
            timelineShown ? currentTag = "Year" : currentTag = "Title";
        } 
        colorSortTags(currentTag);
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

        // helper function to perform the actual drawing (to make sure we deal with async correctly)
        function drawHelper() {
            var sortedArtworks,
                minOfSort,
                currentWork,
                works,
                i, h, w, j;

            if (!artworks || artworks.length === 0){
                return;
            }

            sortedArtworks = sortCatalog(artworks, tag);
            minOfSort      = sortedArtworks.min();
            currentWork    = minOfSort ? minOfSort.artwork : null;
            i = start;
            h = catalogDiv.height() * 0.48;
            w = h * 1.4;

            tileDiv.empty();
            tileDivHeight = tileDiv.height();

            works = sortedArtworks.getContents();
            for (j = 0; j < works.length; j++) {
                loadQueue.add(drawArtworkTile(works[j].artwork, tag, onSearch, i + j));
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
            if (timelineShown){   
                    initTimeline(artworks);
            } else {
                bottomContainer.css('height', '85%');
            } 
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
            yearTextBox.addClass('yearTextBox');

            main.on('click', function () {

                // if the idle timer hasn't started already, start it
                if(!idleTimer) {
                    idleTimer = TAG.Util.IdleTimer.TwoStageTimer();
                    idleTimer.start();
                }
                //TO-DO add panning here 
                showArtwork(currentWork, false)();
                zoomTimeline(TAG.Util.parseDateToYear(currentWork.Metadata.Year), fullMinDisplayDate, fullMaxDisplayDate);
                justShowedArtwork = true;
            });

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
            } else if (tag === 'Year') {
                yearTextBox.css('visibility','visible');
                yearText = TAG.Util.parseDateToYear(currentWork.Metadata.Year);
                if (yearText<0){
                    yearText = -yearText + ' BCE';
                }
                yearTextBox.text(currentWork.Type === 'Empty' ? '' :  yearText);
                artText.text(currentWork.Type === 'Empty' ? '(Interactive Tour)' :  TAG.Util.htmlEntityDecode(currentWork.Name));
            } else if (tag === 'Type') {
                artText.text(TAG.Util.htmlEntityDecode(currentWork.Name));
            }
            artTitle.append(artText);

            // Styling for searches
            if (!onSearch && searchInput.val() !== '') {
                tileImage.css({ 'opacity': '0.3' });
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
            var tileHeight = (0.42) * tileDivHeight;
            main.css({'height': (0.42) * tileDivHeight});
            main.css({'width': (tileHeight/TILE_HEIGHT_RATIO)*TILE_WIDTH_RATIO});
             // Align tile so that it follows the grid pattern we want
            main.css({
                'left': Math.floor(i / 2) * (main.width() + TILE_BUFFER), 
                'top' : Math.floor(i % 2) * (main.height() + TILE_BUFFER)
            });       
        };
    }

    /**styles a circle for the timeline
    * @method styleTimelineCircle
    * @param  {HTML element} element      element to be styled
    * @param  {bool} selected             Whether or not circle is selected
    */
    function styleTimelineCircle(element, selected) {
        if (selected) {
            element.css({
                'height': EVENT_CIRCLE_WIDTH*3/2,
                'width': EVENT_CIRCLE_WIDTH*3/2,
                'border-radius': EVENT_CIRCLE_WIDTH * 3 / 4,
                'top': -EVENT_CIRCLE_WIDTH*3 / 4,
                'opacity': 1
            });
        } else {
            element.css({
                'height': EVENT_CIRCLE_WIDTH,
                'width': EVENT_CIRCLE_WIDTH,
                'border-radius': EVENT_CIRCLE_WIDTH / 2,
                'top': -EVENT_CIRCLE_WIDTH / 2,
                'opacity': .5
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
            minDate;

        if (!artworks || artworks.length === 0){
            return;
        };

        //Sort artworks by year and find the minimum and maximum
        avlTree = sortByYear(artworks);
        maxNode = avlTree.max();

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
        currentArtwork && zoomTimeline(TAG.Util.parseDateToYear(currentArtwork.Metadata.Year), fullMinDisplayDate, fullMaxDisplayDate);


        /**Helper function to prepare timeline area including 'ticks'
        * @method prepTimelineArea
        * @param  {Integer} minDate          minimum artwork date
        * @param  {Integer} maxDate          maximum artwork date
        * @param  {Integer} numTicks         optional specification for number of timeline ticks
        * @return {Object}  timeline         div representing timeline ticks 
        */
        function prepTimelineArea(minDate, maxDate, numTicks){
            var timeline = $(document.createElement('div')),
                i,
                numTicks = numTicks ? numTicks : 101,
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
                timeline.append(tick);
                timelineTicks.push(tick);
            }

            initTimelineWidth = timeline.width();
            initTimelineLeft = timeline.position().left;
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
                labelOverlap;

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
                                .on('click', (function(art) {
                                    return function() {
                                    if (artworkShown === true && currentArtwork === art) {
                                        hideArtwork(art)();
                                        artworkShown = false;
                                    } else {
                                        if (!artworkTiles[art.Identifier]) {
                                            return;
                                        }

                                        //TO-DO: make panning happen at first too if it makes sense 
                                        //panTimeline(art.circle, minDate, maxDate);
                                        zoomTimeline(artworkCircles[art.Identifier].yearKey, fullMinDisplayDate, fullMaxDisplayDate);
                                        showArtwork(art,true)();
                                        artworkShown  = true;
                                        } 
                                    }      
                                })(art));
                    timelineCircleArea.append(eventCircle);

                    //Shift circles left by half their width so they are centered on ticks
                    //TO-DO: add this back in so that it works with new animations (all relative positioning)
                    //eventCircle.css('left', eventCircle.position().left - LEFT_SHIFT + 'px');

                    //Artworks before year 0 are automatically given the 'BCE' tag
                    if (curr.yearKey<0){
                        yearText = (-curr.yearKey).toString() + ' BCE';
                    } else{
                        yearText = curr.yearKey.toString();
                    }

                    //Create and append timeline date labels
                    timelineDateLabel = $(document.createElement('div'))
                            .text(yearText)
                            .addClass('timelineDateLabel');
                    eventCircle.append(timelineDateLabel);

                    eventCircle.yearKey = curr.yearKey;
                    eventCircle.timelineDateLabel = timelineDateLabel;
                    eventCircle.labelwidth = timelineDateLabel.width();
                    eventCircle.artwork = art;                    
                    timelineEventCircles.push(eventCircle);
                    artworkCircles[curr.artwork.Identifier] = eventCircle;
                    
                    if (!artworkYears[yearText]){
                        artworkYears[yearText] = [curr.artwork];
                    } else {
                        artworkYears[yearText].push(curr.artwork);
                    }

                    //Decide whether to display labels:
                    if (avlTree.findPrevious(curr) && artworkCircles[avlTree.findPrevious(curr).artwork.Identifier]){
                        prevNode = avlTree.findPrevious(curr);
                        //Find the previous visible timeline label:
                        while (avlTree.findPrevious(prevNode) && artworkCircles[prevNode.artwork.Identifier].timelineDateLabel.css('visibility')!=='visible'){
                            prevNode = avlTree.findPrevious(prevNode);
                        }
                        //Check to see if the current circle is overlapping the circle of the last label: 
                        circleOverlap = areOverlapping(artworkCircles[prevNode.artwork.Identifier].position().left, eventCircle.position().left);
                        //Check to see if the label of the current circle would overlap that of the previously labelled artwork:
                        labelOverlap = labelsAreOverlapping(artworkCircles[prevNode.artwork.Identifier].position().left, eventCircle.position().left, artworkCircles[prevNode.artwork.Identifier].labelwidth); 
                        //Overlapping circles should only have 1 label: 
                        if (artworkCircles[prevNode.artwork.Identifier] && !circleOverlap && !labelOverlap){
                            timelineDateLabel.css('visibility', 'visible');
                        } else{
                            timelineDateLabel.css('visibility', 'hidden');
                            if (curr.yearKey === fullMaxDisplayDate){
                                timelineDateLabel.css('visibility','visible');
                                if (circleOverlap){
                                    artworkCircles[prevNode.artwork.Identifier].timelineDateLabel.css('visibility','hidden');
                                }
                            }               
                        } 
                    }
                }
                curr = avlTree.findNext(curr);
                if(curr) { art = curr.artwork; }
            }

            //Set intitial style of timeline event circles
            for (var i = 0; i < timelineEventCircles.length; i++) { // Make sure all other circles are grayed-out and small
                styleTimelineCircle(timelineEventCircles[i], false)
                timelineEventCircles[i].timelineDateLabel.css({
                    'color': 'rgb(170,170,170)'
                });
            };

            return timelineCircleArea;
        };
    };


    /** Zooms timeline to center on particular yearKey
     * @methdd zoomTimeline
     * @param  {Number} yearKey          yearKey of clicked artwork to zoom in on. (if null, zooms back out to initial state)
     * @param  {Number} minDisplayDate   minimum date on timeline before (additional) zoom 
     * @param  {Number} maxDisplayDate   maximum date on timeline before (additional) zoom
     */
    function zoomTimeline(yearKey, minDisplayDate, maxDisplayDate){
        var initTimeRange,
            width,
            left,
            originalScale,
            newScale,
            initTickSpacing,
            newTickSpacing,
            lastTickSpacing,
            leftOffset,
            shift,
            minDatePos,
            beforeDiff,
            afterDiff,
            buffer,
            lastTimeRange,
            timeRange,
            numTicks=101,
            i,
            k,
            j,
            scaleTick,
            positionOnTimeline,
            first = true,
            fullOverlap,
            position1,
            position2, 
            labelwidth,
            art;

        if (yearKey===0||yearKey){

            lastTimeRange = maxDisplayDate - minDisplayDate;

            //Calculate new min and max display date. 
            beforeDiff = Math.round(yearKey - minDisplayDate);
            afterDiff = Math.round(maxDisplayDate - yearKey);
            //Scale correctly if already zoomed in and clicking on first dot
            buffer = (beforeDiff===0)? Math.max(afterDiff,1): Math.min(beforeDiff,afterDiff);
            //If zoomed in to last marker, add a 1 year buffer for clear display
            buffer = (afterDiff===0)? 1 : Math.min(buffer, afterDiff);
            minDisplayDate = Math.round(yearKey- buffer);
            maxDisplayDate = Math.round(yearKey + buffer);
            //Don't allow minimum display date to be less than 1 year before full minimum display date
            if (minDisplayDate<fullMinDisplayDate){
                minDisplayDate = fullMinDisplayDate-1;
                maxDisplayDate = yearKey +1
            }
            timeRange = maxDisplayDate - minDisplayDate;

            //If less than 100 years each tick is a year. 
            if (timeRange<100){
                numTicks = timeRange + 1; 
            }

        }

        //Info for zooming calculations
        initTimeRange = fullMaxDisplayDate - fullMinDisplayDate;
        originalScale = initTimeRange/100;
        initTickSpacing = initTimelineWidth/100;
        lastTickSpacing = currentTimeline.width()/(numTicks-1);
        
        //Caculate new left position and width of timeline and timelineCircleArea (may be a better way to do some of these calculations)
        if (yearKey===null){
            width = initTimelineWidth;
            left = initTimelineLeft;
        } else {
            if (timeRange<100){
                newTickSpacing = lastTickSpacing*(lastTimeRange/timeRange);
            } else {
                newScale = timeRange/100;
                newTickSpacing = initTickSpacing*(originalScale/newScale);
            }   
                width = newTickSpacing*100;
                positionOnTimeline = ((yearKey - fullMinDisplayDate)/initTimeRange)*width;
                minDatePos = ((minDisplayDate- fullMinDisplayDate)/initTimeRange)*width;
                leftOffset = positionOnTimeline - minDatePos;
                shift = leftOffset - timelineArea.width()/2;               
                if (timeRange<100){
                    //TO-Do: there is an issue with the left position calcuation for this situation, probably a better way to do this
                    left = initTimelineLeft - minDatePos - shift - EVENT_CIRCLE_WIDTH/2;
                } else {
                    left = initTimelineLeft - minDatePos;
                }
        }


        if (scaleTicksAppended && newTickSpacing < initTickSpacing * EVENT_CIRCLE_WIDTH || !yearKey) {
            for (k=0;k<scaleTicks.length;k++){
                scaleTicks[k].remove();
            }
            scaleTicks = [];
            scaleTicksAppended = false;
        }

        currentTimeline.stop(true,false);
        currentTimeline.animate({
            left: left + 'px',
            width: width + 'px'},
            ANIMATION_DURATION, "easeInOutQuint",function(){
                if (newTickSpacing > initTickSpacing * EVENT_CIRCLE_WIDTH && yearKey) {
                    for (k=0; k<timelineTicks.length; k++){
                        //TO-DO add more scale ticks once zoomed in far 
                        scaleTick = $(document.createElement('div'));
                        scaleTick.addClass('timelineTick');
                        var scaleTickPercent = (timelineTicks[k].position().left + newTickSpacing/2)/width*100;
                        scaleTick.css({
                            left: scaleTickPercent + '%',
                            // For testing: 
                            //'background-color' : 'red'
                        });
                        currentTimeline.append(scaleTick);
                        scaleTicks.push(scaleTick);
                    }
                    scaleTicksAppended = true;
                } 
        });
    
        currTimelineCircleArea.overlapping = false;
        currTimelineCircleArea.stop(true, false);
        currTimelineCircleArea.animate({
            left: left + 'px',
            width: width + 'px'},
            ANIMATION_DURATION, "easeInOutQuint", function(){
                for (i=0; i<timelineEventCircles.length; i++){
                if (first){
                    timelineEventCircles[i].timelineDateLabel.css('visibility', 'visible');
                }
                if (timelineEventCircles[i].yearKey>=minDisplayDate && timelineEventCircles[i].yearKey<=maxDisplayDate){
                    first = false;
                }

                //Check for any overlaps:
                j = i-1;
                if (j>=0 && timelineEventCircles[j].yearKey>=minDisplayDate && timelineEventCircles[i].yearKey<=maxDisplayDate){
                    position1 = timelineEventCircles[j].position().left;
                    position2 = timelineEventCircles[i].position().left;
                    labelwidth = timelineEventCircles[j].timelineDateLabel.width();
                    fullOverlap = position1 === position2; 
                    if (!fullOverlap && (areOverlapping(position1, position2)||labelsAreOverlapping(position1,position2,labelwidth))){
                        currTimelineCircleArea.overlapping = true;
                    } 
                }
                
                //Decide whether to display labels:
                while (j>0 && timelineEventCircles[j].timelineDateLabel.css('visibility')!=='visible' && timelineEventCircles[j].yearKey>= minDisplayDate){
                    j = j-1;
                }
                if (j>=0 && !first && timelineEventCircles[j].yearKey>= minDisplayDate){
                    position1 = timelineEventCircles[j].position().left;
                    position2 = timelineEventCircles[i].position().left;
                    labelwidth = timelineEventCircles[j].timelineDateLabel.width();
                    fullOverlap = position1 === position2;
                    if (!areOverlapping(position1, position2)&&!labelsAreOverlapping(position1, position2, labelwidth)){
                        timelineEventCircles[i].timelineDateLabel.css('visibility', 'visible');
                    } else{
                        timelineEventCircles[i].timelineDateLabel.css('visibility', 'hidden');
                        if (timelineEventCircles[i].yearKey === yearKey){
                            timelineEventCircles[i].timelineDateLabel.css('visibility','visible');
                            if (fullOverlap){
                                timelineEventCircles[j].timelineDateLabel.css('visibility','hidden');
                            }
                        }
                        if (timelineEventCircles[i].yearKey === fullMaxDisplayDate){
                            timelineEventCircles[i].timelineDateLabel.css('visibility', 'visible');
                            if (labelsAreOverlapping(position1,position2)){
                                timelineEventCircles[j].timelineDateLabel.css('visibility', 'hidden');
                            }
                        }
                    }
                }

                //Re-add on-click functions. TO-DO: factor out. 
                timelineEventCircles[i].unbind();
                art = timelineEventCircles[i].artwork;
                timelineEventCircles[i].on('click', (function(art) {
                                            return function() {
                                                if (artworkShown === true && currentArtwork === art) {
                                                    zoomTimeline(null, fullMinDisplayDate, fullMaxDisplayDate);
                                                    hideArtwork(art)();
                                                    artworkShown = false;
                                                } else {
                                                    if (currTimelineCircleArea.overlapping || artworkTiles[art.Identifier]) {
                                                        zoomTimeline(artworkCircles[art.Identifier].yearKey, minDisplayDate, maxDisplayDate);
                                                    } else {
                                                        panTimeline(artworkCircles[art.Identifier].yearKey, minDisplayDate, maxDisplayDate);
                                                    }
                                                    showArtwork(art,true)();
                                                    artworkShown  = true;
                                                } 
                                            }      
                                        })(art));
         
                };
        }); 
    }; 

    /* Pans timeline to specific yearKey while maintaining current zoom level.
     * @param  {Number} yearKey         yearKey of circle/artwork to pan to
     * @param  {Number} minDisplayDate  minimum display date of timeline before panning
     * @param  {Number} maxDisplayDate  maximum display date of timeline before panning
     */
    function panTimeline(yearKey, minDisplayDate, maxDisplayDate){
        var timeRange,
            half;
        timeRange = maxDisplayDate - minDisplayDate;
        half = Math.round(timeRange/2);
        yearKey - half < fullMinDisplayDate ? minDisplayDate = minDisplayDate : minDisplayDate = yearKey - half;
        yearKey + half > fullMaxDisplayDate ? maxDisplayDate = maxDisplayDate : maxDisplayDate = yearKey + half;
        //force zoomTimeline() to maintain same zoom level by passing in desired min and max date. 
        zoomTimeline(yearKey, minDisplayDate, maxDisplayDate);
    }

    /* Helper function to determine if two event circles are overlapping
     * @method areOverlapping
     * @param  {Number} position1     left pixel position of the circle that is further left
     * @param  {Number}  position2    left pixel position of the circle that is further right
     * @return {Boolean}              whether the circles are overlapping
     */
    function areOverlapping(position1, position2){
        //TO-DO: add fullOverlap here
        return Math.round(position2) - Math.round(position1) < EVENT_CIRCLE_WIDTH;
    }

    /*Helper function to determine if the labels of two event cirlces are overlapping
     * @method labelsAreOverlapping
     * @param  {Number} position1       left pixel position of the circle that is further left
     * @param  {Number} position2       left pixel position of the circle that is further right
     * @param  {Number} labelWidth      the width of the label of the circle that is further left
     * @return {Boolean}                whether the labels of the two circles are overlapping
     */
    function labelsAreOverlapping(position1, position2, labelWidth){
        //Hard-coded 2 pixel buffer between labels for clarity 
        return Math.round(position1) + labelWidth + 2 > position2;
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

            selectedArtworkContainer.css('display', 'none');
            if (artworkCircles[artwork.Identifier]){
                styleTimelineCircle(artworkCircles[artwork.Identifier], false);
                artworkCircles[artwork.Identifier].timelineDateLabel && artworkCircles[artwork.Identifier].timelineDateLabel.css({
                    'color' : 'rgb(170,170,170)'  
                });
            }
            zoomTimeline(null, fullMinDisplayDate, fullMaxDisplayDate);
            catalogDiv.stop(true,false);
            catalogDiv.animate({scrollLeft: 0}, 1000);
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
                i;

            if (!artwork) {
                return;
            }

            currentArtwork = artwork;
            artworkSelected = true;
            artworkShown = true;
            multipleShown = showAllAtYear;

            //scroll catalogDiv to center the current artwork
            catalogDiv.stop(true,false);
            rootWidth = root.width();
            infoWidth = infoDiv.width();
            tileWidth = artworkTiles[artwork.Identifier].width();
            catalogDiv.animate({
                scrollLeft: artworkTiles[artwork.Identifier].position().left - rootWidth/2 + infoWidth + tileWidth/2 - TILE_BUFFER
            }, ANIMATION_DURATION/2, "easeInOutQuint", function () {
                    //center selectedArtworkContainer over current artwork thumbnail
                    shift = (selectedArtworkContainer.width()-tileWidth)/2;
                    leftOffset = artworkTiles[artwork.Identifier].position().left + infoWidth - catalogDiv.scrollLeft();
                    //if artwork tile at beginning of window
                    if (leftOffset < shift){
                        shift = 0;
                    }
                    //if artwork tile at end of window
                    if (leftOffset + tileWidth + TILE_BUFFER > rootWidth){ 
                        shift = shift * 2;
                    }
                    selectedArtworkContainer.css({
                        'display': 'inline',
                        'left' : leftOffset - shift
                    });
                    if (!artwork.Metadata.Year){
                        zoomTimeline(null, fullMinDisplayDate, fullMaxDisplayDate);
                    }
            });
    
            // Set selected artwork to hide when anything else is clicked
            root.on('mouseup', function(e) {
                var subject = selectedArtworkContainer;
                if (e.target.id != subject.attr('id') && !$(e.target).hasClass('tileImage') &&!$(e.target).hasClass('timelineEventCircle') && !subject.has(e.target).length) {
                    if (artworkShown){
                        hideArtwork(currentArtwork)();
                    }
                }
            });

            //Set up elements of selectedArtworkContainer

            previewWidth = (0.32) * bottomContainer.width();

            selectedArtworkContainer.empty();
            // showAllAtYear is a boolean of of whether or not all artworks of a given year are shown, or just the artowrk selected.
            // The second conditional argument seems to be whether or not the artwork has a year?
            //^ The second boolean is whether there is a dictionary entry of artworks at the given year in the artworkYears dictionary, you can't check this before
            // checking for 'showAllAtYear' or else you will get errors because the timelineDateLabel will be undefined for an artwork without a year,
            //I just had this throw an error, changing it back for now sorry if it was unclear -LVK
            if (showAllAtYear && artworkYears[artworkCircles[artwork.Identifier].timelineDateLabel.text()] ){
                for (i = 0; i < artworksForYear.length; i++) {
                    newTile = createPreviewTile(artworksForYear[i]);
                    newTile.css({
                        'left': (i * previewWidth) + 'px',
                        'width': previewWidth
                    });
                }
                containerWidth = Math.min((bottomContainer.width()*.80), (artworksForYear.length) * previewWidth);
            } else {
                newTile = createPreviewTile(artwork);
                newTile.css('left', '0%');
                containerWidth = previewWidth;

            }
            selectedArtworkContainer.css({
                width : containerWidth
            });

            /* Helper method to create a preview tile for an artwork and append to selectedArtworkContainer
             * @method createPreviewTile
             * @param {Object} artwork       //artwork to create preview tile for
             * @return {Object} previewTile    //preview tile just created
             */
            function createPreviewTile(artwork){
                previewTile = $(document.createElement('div'))
                    .addClass('previewTile');
                titleSpan = $(document.createElement('div'));
                titleSpan.addClass('titleSpan')
                         .text(TAG.Util.htmlEntityDecode(artwork.Name));
                imgDiv = $(document.createElement('div'));
                imgDiv.addClass('imgDiv');
                exploreTab = $(document.createElement('div'));
                exploreTab.addClass('exploreTab')
                          .on('click', switchPage(artwork));
                exploreIcon = $(document.createElement('img'));
                exploreIcon.addClass('exploreIcon')
                           .attr('src', tagPath+'images/icons/ExploreIcon.svg');
                exploreText = $(document.createElement('div'));
                exploreText.addClass('exploreText')
                           .css("font-size",  BASE_FONT_SIZE*2/3 + 'em')
                           .text("Explore");
                exploreTab.append(exploreIcon)
                          .append(exploreText);
                currentThumbnail = $(document.createElement('img'));
                currentThumbnail.addClass('currentThumbnail')
                                .attr('src', artwork.Metadata.Thumbnail ? FIX_PATH(artwork.Metadata.Thumbnail) : (tagPath+'images/no_thumbnail.svg'))
                                .on('click', switchPage(artwork));
                TAG.Telemetry.register($("#currentThumbnail,#exploreTab"), 'click', '', function(tobj) {
                    if (!artwork || !artworkSelected) {
                        return true; // abort
                    }
                    tobj.custom_1 = artwork.Name;
                    tobj.custom_2 = artwork.Identifier;
                    tobj.ttype     = 'collection_to_' + getWorkType(artwork); 
                });
                infoText = $(document.createElement('div'));
                infoText.addClass('infoText');
                artistInfo = $(document.createElement('div'));
                artistInfo.addClass('artistInfo')
                          .css('font-size', 11 * BASE_FONT_SIZE / 30 + 'em');
                yearInfo = $(document.createElement('div'));
                yearInfo.addClass('yearInfo')
                        .css('font-size', 11 * BASE_FONT_SIZE / 30 + 'em');
                if (artwork.Type !== "Empty") {
                    artistInfo.text("Artist: " + (artwork.Metadata.Artist || "Unknown"));
                    yearInfo.text(artwork.Metadata.Year || " ");
                } else {
                    artistInfo.text("(Interactive Tour)" );
                    yearInfo.text(" " );
                }
                infoText.append(artistInfo)
                        .append(yearInfo);
                imgDiv.append(exploreTab)
                      .append(currentThumbnail)
                      .append(infoText);
                descText = $(document.createElement('div'));
                descText.addClass('descText');
                descSpan = $(document.createElement('div'));
                descSpan.addClass('descSpan')
                        .html(Autolinker.link(artwork.Metadata.Description ? artwork.Metadata.Description.replace(/\n/g, '<br />') : '', {email: false, twitter: false}));
                descText.append(descSpan);
                previewTile.append(titleSpan)
                           .append(imgDiv)
                           .append(descText);
                selectedArtworkContainer.append(previewTile);
                return previewTile;
            }

            //Circle (with date) on timeline
            for (i = 0; i < timelineEventCircles.length; i++) { // Make sure all other circles are grayed-out and small
                styleTimelineCircle (timelineEventCircles[i], false)
                timelineEventCircles[i].timelineDateLabel.css({
                    'color' : 'rgb(170,170,170)'
                });
            };

            // Make current circle larger and white
            if (artworkCircles[artwork.Identifier]){
                styleTimelineCircle(artworkCircles[artwork.Identifier], true)

                // Add label to current date
                artworkCircles[artwork.Identifier].timelineDateLabel.css({
                    'visibility': 'visible',
                    'color' : 'white'  
                })
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
        } else if (tag === 'Year') {

            return sortByYear(artworks);

        } else if (tag === 'Type') {
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
        
        return null; // error case: falsy tag
    }

    /**Helper function for sorting artwork tiles and timeline markers
     * Also used to catch common non-integer input date forms and generate timeline 
     * years for their display. 
     * @method sortByYear
     * @param  {Object} artworks      list of artworks to sort
     * @return {AVLTree} avlTree      sorted tree so order can be easily accessed
    **/
    function sortByYear(artworks){
        var comparator,
            valuation,
            avlTree,
            artNode,
            yearKey,
            i;
        comparator = sortComparator('yearKey');
        valuation  = sortValuation('yearKey');
        avlTree = new AVLTree(comparator, valuation);
        for (i = 0; i < artworks.length; i++) {
            yearKey = TAG.Util.parseDateToYear(artworks[i].Metadata.Year);
            if (!isNaN(yearKey)){
                artNode = {
                    artwork: artworks[i],
                    yearKey: artworks[i].Type === 'Empty' ? Number.POSITIVE_INFINITY : yearKey //Tours set to Infinity to show up at end of 'Year' sort
                    };
            } else{                        
                artNode = {
                    artwork: artworks[i],
                    yearKey: Number.POSITIVE_INFINITY //Set unintelligible dates to Infinity to show up at end of 'Year' sort 
                };
            }
            avlTree.add(artNode);
        }
        return avlTree;
    }

    /** 
     * Set the colors of the sort tags
     * @method colorSortTags
     * @param {String} tag    the name of the sort tag
     */
    function colorSortTags(tag) {
        $('.rowButton').css('color', 'rgb(170,170,170)');
        $('[tagName="'+tag+'"]').css('color', 'white');
    }

    /**
     * Changes the selected tag and re-sorts
     * @method changeDisplayTag
     * @param {Array} artworks     the array of artwork doqs to sort
     * @param {String} tag         the name of the sort tag
     */
    function changeDisplayTag(artworks, tag) {
        var guidsSeen   = [],
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
            drawCatalog(bigArray, "Title", 0, false);
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
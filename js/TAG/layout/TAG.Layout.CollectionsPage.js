TAG.Util.makeNamespace("TAG.Layout.CollectionsPage");

/**
 * The collections page
 * @class TAG.Layout.CollectionsPage
 * @constructor
 * @param {Object} options         some options for the collections page
 * @param {int} idletimerDuration  the duration in milliseconds of the maindoq's idle timer stage one 
 * @return {Object}                some public methods
 */
TAG.Layout.CollectionsPage = function (options, idletimerDuration) { 
    "use strict";

    options = options || {}; // cut down on null checks later

    var // DOM-related
        root = TAG.Util.getHtmlAjax('NewCatalog.html'), // use AJAX to load html from .html file
        tileDiv = $(document.createElement("div")).attr("id", "tileDiv"),
        backButton = root.find('#backButton'),
        bottomContainer = root.find('#bottomContainer'),

        // input options
        currCollection = options.backCollection,      // the currently selected collection
        currentArtwork = options.backArtwork,         // the currently selected artwork     
        titleIsName = options.titleIsName,
        twoDeep = true, //show two tiles per column
        NOBEL_WILL_COLOR = 'rgb(254,161,0)',
        spoofDoq = options.doqToUse,
        spoofArtworkDoqs = options.artworkDoqs,
        willRoot = options.willRoot,

        // misc initialized vars
        idleTimerDuration = idletimerDuration,
        loadQueue = TAG.Util.createQueue(),           // an async queue for artwork tile creation, etc
        artworkSelected = true,                        // whether an artwork is selected

        visibleCollections = [],                               // array of collections that are visible and published                 
        artworkTiles = {},                                   // dict of artwork tiles in bottom region, keyed by artwork id
        currentArtworks = [],                               // array of artworks in current collection
        artworkYears = {},                               // dict of artworks keyed by yearKey for detecting multiple artworks at one year    
        tileDivHeight = 0,                                // Height of tile div (before scroll bar added, should equal height of catalogDiv)
        artworkShown = false,                            // whether an artwork pop-up is currently displayed
        timelineShown = false,                             // whether current collection has a timeline
        onAssocMediaView = options.wasOnAssocMediaView || false,                            // whether current collection is on assoc media view
        previouslyClicked = null,
        artworkInCollectionList = [],
        OFFLINE = true,
        spoof,
        lockKioskMode = false, //TAG.Layout.Spoof().getKioskLocked() : TAG.Worktop.Database.getKioskLocked(),                           // true if back button is hidden
        // constants
        NOBEL_COLOR = "#D99B3B",
        TILE_BUFFER = $("#tagRoot").width() / 18,                  // number of pixels between artwork tiles
        TILE_HEIGHT_RATIO = 200,                                          //ratio between width and height of artwork tiles
        TILE_WIDTH_RATIO = 255,

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
        moreInfo,                       // div holding tombstone information for current artwork
        artistInfo,                     // artist tombstone info div
        yearInfo,                       // year tombstone info div
        justShowedArtwork,              // for telemetry; helps keep track of artwork tile clicks
        comingBack,                     // if you are coming back from a viewer
        defaultTag,                     // default sort tag
        showArtworkTimeout,
        searchResultsLength,
        menuCreated;




    root[0].collectionsPage = this;
    root.data('split',options.splitscreen);
    options.backCollection ? comingBack = true : comingBack = false;
    var cancelLoadCollection = null;

    backButton.attr('src', tagPath + 'images/icons/Back.png');
    backButton.click(function () {
        willRoot.css({"background-color":"transparent"})
        willRoot.animate({ left: "100%" }, 1000, "easeInOutQuart", function () {
            willRoot.die()
            willRoot.remove()
        })
    });

    // get things rolling
    init()
    /**
     * Sets up the collections page UI
     * @method init
     */
    function init() {

     
        cancelLoadCollection = null;

        //Or else the search bar loses focus immediately when you come back from artwork viewer
        $('#tagContainer').off();
        getCollectionsHelper([spoofDoq])
        menuCreated = false;
    }

    function prepareNextView() {
        onAssocMediaView = false;
        currentArtwork = null;
        currCollection = null;
        loadQueue.clear();
        comingBack = false;
        tileDiv.empty();
        if (cancelLoadCollection) cancelLoadCollection();
       
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
                    loadFirstCollection();             
            } else {
                loadCollection(currCollection, null, currentArtwork)();
            }
        } else if (toShowFirst) {
            loadFirstCollection();
        }
        $("#startPageLoadingOverlay").remove();

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
            var i,
                title = TAG.Util.htmlEntityDecode(collection.Name),
                nextTitle,
                prevTitle,
                mainCollection = root.find('#mainCollection'),
                titleBox = root.find('#collection-title'),
                collectionMedia = [],
                counter = 0,
                collectionLength,
                dummyDot,
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

            // Add collection title
            mainCollection.addClass('mainCollection');
            titleBox.text(title);

            var uiDocfrag = document.createDocumentFragment(); 
            currCollection = collection;
            currentArtwork = artwrk || null;

            if (!onAssocMediaView || !currCollection.collectionMedia) {
                getCollectionContents(currCollection, function () {  }, function () { return cancelLoad;});
            } else {
                if (onAssocMediaView && artworkInCollectionList.length == 0) {
                    var f = function (contents) {
                        artworkInCollectionList = [];
                        for (var i = 0; i < contents.length; i++) {
                            artworkInCollectionList.push(contents[i].Identifier);
                        }
                        createArtTiles(currCollection.collectionMedia);
                    }
                    f(spoofArtworksDoqs)
                } else {
                    createArtTiles(currCollection.collectionMedia);
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
     * Helper function to load first collection
     * @method loadFirstCollection
     */
    function loadFirstCollection() {
        loadCollection(toShowFirst, null,currentArtwork && currentArtwork)();
    }

    /**
     * Get contents (artworks, videos, tours) in the specified collection and make catalog
     * @method getCollectionContents
     * @param {doq} collecion         the collection whose contents we want
     * @param {Function} callback     a function to call when the contents have been retrieved
     */
    function getCollectionContents(collection, callback, cancel) {
            contentsHelper(spoofArtworkDoqs)

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
            if (cancel && cancel()) return;
            createArtTiles(contents, cancel);
            callback && callback();
        }

        
    }

    /**
     * Create tiles for each artwork/tour in a collection
     * @method createArtTiles
     * @param {Array} artworks     an array of doq objects
     */
    function createArtTiles(artworks, cancel) {
        currentArtworks = artworks;
        drawCatalog(currentArtworks, null, 0, null, true);

        var description = currCollection.Metadata && currCollection.Metadata.Description ? TAG.Util.htmlEntityDecode(currCollection.Metadata.Description) : "" + "\n\n   ";
        tileDiv.css
        ({ 
            'left': '0%',
        });
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
            
            var tourDoqs = [];

                    if (!currCollection) {
                        return;
                    }
                    if (start === 0) {
                        loadQueue.clear();
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
                    h = 0; 
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
                                loadQueue.add(drawArtworkTile(works[j].artwork, tag, onSearch, i + j - hiddenTours, false,j === lastVisibleTileNumber));
                            }
                            else {
                                hiddenTours++;
                            }
                        }
                        else {
                            if (works[j].Metadata.ContentType !== 'tour' || works[j].Metadata.Private !== "true") {
                                loadQueue.add(drawArtworkTile(works[j], null, onSearch, i + j - hiddenTours, false, j === lastVisibleTileNumber));
                            }
                            else {
                                hiddenTours++;
                            }
                        }
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

        }
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
    function drawArtworkTile(currentWork, tag, onSearch, i, needsTourIcon, last) {
        return function () {
            var main = $(document.createElement('div')),
                artTitle = $(document.createElement('div')),
                artText = $(document.createElement('div')),
                tileImage = $(document.createElement('img')),
                yearText,
                tourLabel,
                videoLabel,
                showLabel = true;

            artworkTiles[currentWork.Identifier] = main;
            main.addClass("tile");
            tileImage.addClass('tileImage');
            tileImage.css({
                "height": "auto",
                "bottom" : "0%",
            })
            artTitle.addClass('artTitle');
            artText.addClass('artText');
            artText.addClass('secondaryFont');
            artText.css({
                'color': NOBEL_COLOR,
            });


            //CLICK HANDLER FOR TILE
            main.on('click', function () {

                switchPage(currentWork)();
            });

            main.css('overflow', 'hidden');
            tileImage.attr("src", currentWork.Metadata.Thumbnail.FilePath);
            artText.text(TAG.Util.htmlEntityDecode(currentWork.Name));
            artTitle.append(artText);
            artText.css('font-size', '.8em');
            artText.css('color', 'white');
            main.hover(
                function () {
                    artText.css('color', 'white');
                    artTitle.css('background-color','rgb(254,161,0)')
                },
                function(){
                    artText.css('color', 'white');
                    artTitle.css('background-color', 'rgba(0,0,0,.8)')
                }
            )

            main.append(tileImage)
                .append(artTitle);

            tileDiv.append(main);
            tileDivHeight = bottomContainer.height();
            var tileHeight = (0.35) * tileDivHeight;
            main.css({ 'height': (0.40) * tileDivHeight });
            main.css({ 
                'width': 1.42*tileHeight,
                'box-shadow': '8px 8px 20px #000',
                'border': '3px solid',
                'border-color': NOBEL_COLOR,
                'border-radius': '3%'
            });
            // Align tile so that it follows the grid pattern we want
            main.css({
               'left': Math.floor( i / 2) * (main.width() + TILE_BUFFER),
                'top': Math.floor(i % 2) * (main.height() + TILE_BUFFER)
            });

            if (last) {
                bottomContainer.append($(tileDivDocFrag));
            }
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
                if (artworks[i].Metadata.InfoFields && artworks[i].Metadata.InfoFields[tag]) {
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
                slideMode = false,
                avl,
                avlArray = [],
                prevInfo;
                
           avlArray = TAG.Layout.Spoof().doqsInCollection[currCollection.Identifier]

                artworkViewer = TAG.Layout.ArtworkViewer({
                    doq: artwork,
                    prevCollection: currCollection,
                    prevPage: 'catalog',
                    assocMediaToShow: associatedMedia,
                    onAssocMediaView : onAssocMediaView,
                    titleIsName: titleIsName,
                    isNobelWill: false,
                    isSlideMode: true,
                    slidesArray : avlArray,
                    twoDeep: twoDeep,
                });
                newPageRoot = artworkViewer.getRoot();
                newPageRoot.data('split', root.data('split') === 'R' ? 'R' : 'L');
                

                if ($("#artworkViewerSwitchRoot").length === 0) {
                    var switchRoot = $(document.createElement("div"))
                    root.append(switchRoot)
                    switchRoot.css({
                        "width": "100%",
                        "position": "absolute",
                        "height": "100%",
                        "top": "0%",
                        "left": "100%",
                        'z-index': "50001"
                    })
                    switchRoot.append(artworkViewer.getRoot()).attr({ id: "artworkViewerSwitchRoot" })
                    switchRoot.css({ "background-color": "black" })
                    switchRoot.animate({ left: "0%" }, 1000, "easeInOutQuart", function () { $("#artworkViewerSwitchRoot").css({ "background-color": "black" }) })
                }
                currentPage.name = TAG.Util.Constants.pages.ARTWORK_VIEWER;
                currentPage.obj  = artworkViewer;
           // }
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
        getState: getState,
        switchPage : switchPage
    };
};

TAG.Layout.CollectionsPage.default_options = {};
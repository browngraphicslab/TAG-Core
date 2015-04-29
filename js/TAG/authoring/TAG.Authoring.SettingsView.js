/// <reference path="../../../telemetry/telemetry.js" />
TAG.Util.makeNamespace("TAG.Authoring.SettingsView");

/*  Creates a SettingsView, which is the first UI in authoring mode.  
 *  @class TAG.Authoring.SettingsView
 *  @constructor
    TODO- change parameters to options object
 *  @param startView sets the starting setting.  This can be "Exhibitions", "Artworks", "Tours", 
 *       or "General Settings".  Undefined/null, etc. goes to General Settings.
 *       TODO: Use constants instead of strings
 *   @param {Function} callback  called after the UI is done being created.
 *   @param {Function} backPage is a function to create the page to go back to (null/undefined goes
 *      back to the main page).  This function, when called with no arguments,
 *      should return a dom element that can be provided as an argument to 
 *      slidePageRight.
 *   @param startLabelID selects a middle label automatically if it matches that id.
 *      The label will be scrolled to if it is off screen
 *   @return {Object} public methods and variables
 */
TAG.Authoring.SettingsView = function (startView, callback, backPage, startLabelID) {
    "use strict";
    //$(document).off();                   
    var root = TAG.Util.getHtmlAjax('../tagcore/html/SettingsView.html'), //Get html from html file

        //get all of the ui elements from the root and save them in variables
        middleLoading = root.find('#setViewLoadingCircle'),
        settingsContainer = root.find('#setViewSettingsContainer'),
        searchContainer = root.find('#setViewSearchContainer'),
        navBar = root.find('#setViewNavBar'),
        searchbar = root.find('#setViewSearchBar'),
        newButton = root.find('#setViewNewButton'),
        addButton = root.find('#setViewAddButton'),
        secondaryButton = root.find('#setViewSecondaryButton'),
        deleteBlankButton = root.find('#setViewDeleteButton'),
        middlebar = root.find('#setViewMiddleBar'),
        middleLabelContainer = root.find('#setViewMiddleLabelContainer'),
        rightbar = root.find('#setViewRightBar'),
        viewer = root.find('#setViewViewer'),
        buttonContainer = root.find('#setViewButtonContainer'),
        settings = root.find('#setViewSettingsBar'),
        label = root.find('#setViewLoadingLabel'),
        circle = root.find('#setViewLoadingCircle'),
        rootContainer = root.find('#setViewRoot'),
        iframeAssetCreateButton = root.find('#iframeAssetCreateButton'),
        findBar = root.find('#setViewFindBar'),
        findBarTextBox = root.find('#findBarTextBox'),
        findBarDropIcon = root.find('#findBarDropIcon'),
        findContainer = root.find('#setViewFindContainer'),
        sortContainer = root.find('#setViewSortContainer'),
        sortLabelContainer = root.find('#sortLabelContainer'),
        sortsContainer = root.find('#sortsContainer'),
        findButton = root.find('#findButton'),
        addToArtworkLabel = root.find('#addToArtworkLabel'),
        addToArtworkDiv = root.find('#addToArtworkDiv'),
        titleSort = root.find('#titleSort'),
        collectionSort = root.find('#collectionSort'),
        addedRecentlySort = root.find('#addedRecentlySort'),
        searchLabelContainer = root.find('#searchLabelContainer'),
        findSearchContainer = root.find('#findSearchContainer'),
        searhBarContainer = root.find('#setViewSearchBarContainer'),
        menuLabel = root.find('#addMenuLabel'),
        dropDown = $(document.createElement('div')),

        // = root.find('#importButton'),

        

        primaryColorPicker,
        secondaryColorPicker,
        isArtView = false,
        findShown = false,
        sortByArt = "Title",
        sortByAssoc = "Title",

        // Constants
        VIEWER_ASPECTRATIO = $(window).width() / $(window).height(),
        //Should probably get rid of any hard-coded values here:
        RIGHT_WIDTH = '54',
        CONTENT_HEIGHT = '92',
        HIGHLIGHT = 'white',
        BUTTON_HEIGHT = '40',
        DEFAULT_SEARCH_TEXT = '',
        PICKER_SEARCH_TEXT = 'Search by Name, Artist, or Year...',

        // Text for Navagation labels
        NAV_TEXT = {
            general: {
                text: 'General Settings',
                subtext: 'Customize TAG experience'
            },
            exhib: {
                text: 'Collections',
                subtext: 'Create and edit collections'
            },
            art: {
                text: 'Artworks',
                subtext: 'Import and manage artworks'
            },
            media: {
                text: 'Associated Media',
                subtext: 'Manage associated media'
            },
            tour: {
                text: 'Tours',
                subtext: 'Build interactive tours'
            },
            dummytour:{
                text: 'Tours',
                subtext: 'Tours are disabled on the web'
            },
            feedback: {
                text: 'Feedback',
                subtext: 'View comments and reports'
            },
        },

        that = {
            getRoot: getRoot,
        },

        //AUTOSAVING HAS BEEN REMOVED - SAVE BUTTONS ARE BACK!
        //global vars for automatic saving
        //currentMetadataHandler,                     //the save function for the current item (collection/artwork/assocmedia/tour); added to the queue when navigation occurs
        //saveQueue = TAG.Util.createQueue(),         //async queue that handles save operations (when multiple items have been edited in a short amount of time)
        previousIdentifier,                         //refers to the current middle label selected to prevent redundant save operations
        //changesHaveBeenMade = false,                //keeps track of whether the current collection/artwork/assocmedia/tour has been edited to prevent redundant save operations
        //autosaveData = {},                          //Used to refresh the display before the database has actually been updated
        //backButtonClicked = false,
        backButton,
        /*saveArray = [],
        pCL = null, 
        pCircle2 = null,
        backButtonClicked = false,
        generalIsLoading = false,
        collectionsIsLoading = false,
        artworksIsLoading = false,
        associatedMediaIsLoading = false,
        toursIsLoading = false,
        generalProgressCircle = null,*/
        labelOne,
        labelTwo,
        sortOptionsCount = 0,
        sortOptionsObj = {},
        settingsViewKeyHandler = {
            13: enterKeyHandlerSettingsView,
            46: deleteKeyHandlerSettingsView,
            40: downKeyHandlerSettingsView,
            38: upKeyHandlerSettingsView,
        },

        prevSelectedSetting,
        prevSelectedMiddleLabel,
        // These are 'asynchronous' queues to perform tasks. These queues will process events in order, but asynchronously so
        // they can be completed in the 'background'. Calling .add(fn) adds a function to the queue while .clear() clears the queue.  
        //Note that an in progress function will not be canceled by .clear().
        middleQueue = TAG.Util.createQueue(),  //used to add things to the middle label container
        rightQueue = TAG.Util.createQueue(), //used to add things to the right panel
        cancelLastSetting,
        cancelLastView,
        artPickerOpen = false,
        nav = [],
        artworks = [],
        assetUploader,
        mediaMetadata = [],
        numFiles = 0,
        isUploading = false,
        isCreatingMedia = false,
        artworkAssociations = [], // entry i contains the artwork info for the ith associated media
        artworkList = [], // save artworks retrieved from the database
        mediaCheckedIDs = [], // artworks checked in associated media uploading
        mediaUncheckedIDs = [], // artworks unchecked in associated media uploading
        editArt, // enter artwork editor button
        artmodeList, // list of all artworks in a collection
        infoSource = [], // array to hold sorting/searching information
        currDoq,//current selected artwork/associated media id
        currArtwork,
        currTour,
        // key handling stuff
        deleteType,
        toDelete,
        currentList,
        currentIndex = 0,
        currentSelected,
		currentSelectedSetting,
		leftButton,
        popUpBoxVisible = false,
        changesMade = false,
        pickerOpen = false,
        multiSelected = [],

        // booleans
		inGeneralView = false,
        inCollectionsView = false,
        inArtworkView = false,
        inAssociatedView = false,
        inToursView = false,
        inFeedbackView = false,

        showDropdown = false;
        createAddToArtworkMenu();
        
        createDropdownAssocMediaMenu();
        setUpFindContainer();

        //window.addEventListener('keydown', keyHandler),
        TAG.Util.UI.initKeyHandler();
        TAG.Util.UI.getStack()[0] = settingsViewKeyHandler;
        var timelineShown;
        newButton.on("mousedown", function () {
            newButton.css({"background-color":"white"});
        });

    var prevLeftBarSelection = {
        timeSpentTimer: null,
        categoryName: null,
        loadTime: null
    };

    findBarDropIcon.attr('src', tagPath + 'images/icons/RightB.png');

    var timer = new TelemetryTimer();
    var prevMiddleBarSelection = {
        type_representation: null,
        time_spent_timer: null
    };

    //WEB ui
    if (!IS_WINDOWS) {
        
        newButton.css({
            'width': 'auto',
            'font-size': '100%'
        });
        addButton.css({
            'width': 'auto',
            'font-size': '100%'
        })
    } else {
        menuLabel.css('min-width', '0px');
        addToArtworkLabel.css('min-width', '0px');
        newButton.css('min-width', '0px');
    }
    deleteBlankButton.css({
        'min-width': '0px',
        'width': '20%',
        'font-size':'50%'
    })
    .text("Delete");
    findBarTextBox.css({
        'height': '100%',
        'font-size': '110%',
        'width': '20%',
        'display': 'inline-block',
        'padding-left': '10%',
        'float': 'left'
    });
    findBarDropIcon.css({
        width: '7%',
        height: '70%',
        display: 'inline-block',
    });
    if (IS_WINDOWS) {
        findBarTextBox.css('font-size', '150%');
        findButton.css('font-size','100%');
        findBarDropIcon.css({
            'float': 'left',
            'width': '5%',
            'margin-top': '5%',
            'margin-left':'20%'
        });
    }

    /*Surbhi */

        TAG.Telemetry.register(newButton, "mousedown", "ImportButton", function (tobj) {
            tobj.element_type = "artwork";
        });

    //////////////////////////
        var checkConTimerId;
        var cancelArtworkLoad = null;
    loadHelper();
    if (callback) {
        callback(that);
    }


    //an array to store video guids that need to be converted
    //var conversionVideos = [];
    /*function checkConversion() {
        for (var i = 0; i < conversionVideos.length; i++) {
            var artwork = conversionVideos[i];
            LADS.Worktop.Database.getConvertedVideoCheck(
                (function (i, artwork) {
                    return function (output) {
                        if (output !== "" || output !== "False") {
                            console.log("converted: ");
                            var element = $(document.getElementById("videoInPreview"));
                            if (element && element.attr("identifier") === output) {
                                reloadVideo(element);
                                conversionVideos.remove(artwork);
                            }
                        } else {
                            console.log("not converted: ");
                        }
                    }
                })(i, artwork), null, conversionVideos[i]);
        }
    }*/
    function checkConversion(doq) { //WIN8 AUG 15 RELEASE ONLY
        //if(
        LADS.Worktop.Database.getConvertedVideoCheck(
            function (output) {
                if (output === "True") {
                    console.log("converted: ");
                    clearInterval(checkConTimerId);
                    var source = doq.Metadata.Source;
                    var ext = source.substr(source.lastIndexOf('.'));
                    if (currDoq === doq.Identifier) {
                        if (ext === ".mp4") {
                            $("#videoErrorMsg").remove();
                            $("#leftLoading").remove();
                        } else {
                            reloadVideo(doq);
                        }
                    }
                } else if (output === "Error") {
                    clearInterval(checkConTimerId);
                    if (currDoq === doq.Identifier) {
                        $("#videoErrorMsg").remove();
                        $("#leftLoading").remove();
                        var msg = "An error occured when converting this video. Please try to upload again";
                        if (doq.Extension === '.mp4') {
                            viewer.append(TAG.Util.createConversionLoading(msg, true, true))
                        } else {
                            viewer.append(TAG.Util.createConversionLoading(msg, true));
                        }
                    }
                
                }else {
                    console.log("not converted: ");
                }
            }, null, doq.Identifier);
    }

    //setInterval(checkConversion, 1000 * 60);
    function reloadVideo(doq) {
        var mediaElement = $(document.createElement('video'));
        mediaElement.attr('id', 'videoInPreview');
        fixVolumeBar(mediaElement);
        mediaElement.attr('poster', (doq.Metadata.Thumbnail && !doq.Metadata.Thumbnail.match(/.mp4/)) ? TAG.Worktop.Database.fixPath(doq.Metadata.Thumbnail) : '');
        mediaElement.attr('identifier', doq.Identifier);
        mediaElement.attr("preload", "none");
        mediaElement.attr("controls", "");
        mediaElement.css({ "width": "100%", "max-width": "100%", "max-height": "100%" });
        var source = TAG.Worktop.Database.fixPath(doq.Metadata.Source);
        var sourceWithoutExtension = source.substring(0, source.lastIndexOf('.'));
        var sourceExt = source.substring(source.lastIndexOf('.'));
        var videoErrorDiv = $(document.createElement('div'));
        videoErrorDiv.addClass("videoErrorDiv");

        mediaElement.attr("fileName", doq.Metadata.Source.substring(0, source.lastIndexOf('.')));
        var sourceMP4 = sourceWithoutExtension + ".mp4";
        var sourceWEBM = sourceWithoutExtension + ".webm";
        var sourceOGV = sourceWithoutExtension + ".ogv";

        addSourceToVideo(mediaElement, sourceMP4, 'video/mp4');
        addSourceToVideo(mediaElement, sourceWEBM, 'video/webm');
        addSourceToVideo(mediaElement, sourceOGV, 'video/ogv');
        mediaElement[0].onerror = TAG.Util.videoErrorHandler(mediaElement, viewer);
        viewer.append(mediaElement);

        $("#middleLoading").remove();
        $("#leftLoading").remove();
        $("#videoErrorMsg").remove();
    }
    
    
    //an array to store video guids that need to be converted
    var conversionVideos = [];
    /**
    * check for conversion in interval
    */
    //function checkConversion() {
    //    for (var i = 0; i < conversionVideos.length; i++) {
    //        var artwork = conversionVideos[i];
    //        TAG.Worktop.Database.getConvertedVideoCheck(
    //            (function (i, artwork) {
    //                return function (output) {
    //                    if (output !== "" && output !== "False" && output !== "Error") {
    //                        //console.log("converted: ");
    //                        var element = $(document.getElementById("videoInPreview"));
    //                        if (element && element.attr("identifier") === output) {
    //                            reloadVideo(element);
    //                            conversionVideos.remove(artwork);
    //                        }
    //                    } else if (output === "Error") {
    //                        $("#videoErrorMsg").remove();
    //                        $("#leftLoading").remove();
    //                        var msg = "An error occured when converting this video. Please try again";
    //                        viewer.append(TAG.Util.createConversionLoading(msg));
    //                        conversionVideos.remove(artwork);
    //                    }
    //                    else {
    //                        //console.log("not converted: ");
    //                    }
    //                }
    //            })(i, artwork), null, conversionVideos[i]);
    //    }
    //}
    //setInterval(checkConversion, 1000 * 60);

    /** Reload the video when conversion is done
    * @ param: videoInPreview element
    */

    //function reloadVideo(element) {
    //    var source = element.attr("src");
    //    if (element[0].children.length < 3) {
    //        element.removeAttr("src");
    //        var sourceWithoutExtension = source.substring(0, source.lastIndexOf('.'));
    //        var sourceMP4 = sourceWithoutExtension + ".mp4";
    //        var sourceWEBM = sourceWithoutExtension + ".webm";
    //        var sourceOGV = sourceWithoutExtension + ".ogv";

    //        addSourceToVideo(element, sourceMP4, 'video/mp4');
    //        addSourceToVideo(element, sourceWEBM, 'video/webm');
    //        addSourceToVideo(element, sourceOGV, 'video/ogv');
    //    }
    //    $(document.getElementById("leftLoading")).remove();
    //    $(function () {
    //        $("#leftLoading").remove();
    //    })
    //    if ($("#videoErrorMsg")) {
    //        $("#videoErrorMsg").remove();
    //    }
    //    element.show();
    //    var video = document.getElementById("videoInPreview");
    //    video.load();
    //    video.play();
    //}

    /**Handles enter key press on the SettingsView page
     * @ method enterKeyHandlerSettingsView
     * @param event
     */
    function enterKeyHandlerSettingsView(event) {
        if (event.target.className == "metadataPickerSearchbar") {
            console.log('searching metadata');
            event.stopPropagation();
            event.preventDefault();
        }
        if ($('.searchBar').is(':focus')) {
            event.stopPropagation();
            event.preventDefault();
        }
        else if (searchbar.is(':focus')) {
            if (!searchbar.val()) {
                resetView();
                searchbar.css({ 'background-image': 'none' });
            } else {
                doSearch();
                searchbar.css({ 'background-image': 'none' });
            }
            event.stopPropagation();
            event.preventDefault();
        }
        else if (!$("input, textarea, select").is(":focus")) {
            event.stopPropagation();
            event.preventDefault();
            if (inCollectionsView) {
                manageCollection(currentList[currentIndex]);
            }
            if (inArtworkView) {
                if ($(document.getElementById('artworkEditorButton')).length) {
                    editArtwork(currentList[currentIndex]);
                }
                if ($(document.getElementById('thumbnailButton')).length) {
                    saveThumbnail(currentList[currentIndex], false);
                }
             }
            if (inAssociatedView) {
                if (!$('.pickerOverlay').length) {
                    assocToArtworks(currentList[currentIndex]);
                }                
            }
            if (inToursView) { editTour(currentList[currentIndex]); }
            if (inFeedbackView) { deleteFeedback(currentList[currentIndex]); }
        }
        
    }

    /**Handles delete key press on the SettingsView page
     * @ method deleteKeyHandlerSettingsView
     */
    function deleteKeyHandlerSettingsView() {
        if (!$("input, textarea").is(":focus")) {
            deleteType(toDelete);
        }
    }

    /**Handles up key press on the SettingsView page
     * @ method upKeyHandlerSettingsView
     */
    function upKeyHandlerSettingsView() {
        if (!$("input, textarea").is(":focus")) {
            if (prevSelectedMiddleLabel && prevSelectedMiddleLabel === currentSelected) {
                if (currentSelected.prev()) {
                    if (currentIndex > 0) {
                        resetLabels('.middleLabel');
                        selectLabel(currentSelected.prev());
                        currentSelected = currentSelected.prev();
                        prevSelectedMiddleLabel = currentSelected;
                        currentIndex--;
                        

                        if (inCollectionsView) { 
                            loadExhibition(currentList[currentIndex]); 
                        }
                        if (inArtworkView) { 
                            loadArtwork(currentList[currentIndex]); 
                        }
                        if (inAssociatedView) { 
                            loadAssocMedia(currentList[currentIndex]); 
                        }
                        if (inToursView) { 
                            loadTour(currentList[currentIndex]); 
                        }
                        if (inFeedbackView) {
                            loadFeedback(currentList[currentIndex]); 
                        }
                    }
                }
            }
			
        }
        if (inGeneralView) {
            if (currentSelected === labelTwo) {
                resetLabels('.leftLabel');
                selectLabel(labelOne);
                currentSelected = labelOne;
                loadSplashScreen();
            } else if (currentSelected === labelOne) {
                resetLabels('.leftLabel');
                selectLabel(labelTwo);
                currentSelected = labelTwo;
                loadPasswordScreen();
            }
        }
    }

    /**Handles the down arrow key press on the SettingsViewPage
     * @method downKeyHandlerSettingsView
     */
    function downKeyHandlerSettingsView() {
        
        if (!$("input, textarea").is(":focus") && !inGeneralView) {
            if (prevSelectedMiddleLabel && prevSelectedMiddleLabel === currentSelected) {
                if (currentSelected.next()) {
                    if (currentIndex < (currentList.length - 1)) {
                        resetLabels('.middleLabel');
                        selectLabel(currentSelected.next());
                        currentSelected = currentSelected.next();
                        prevSelectedMiddleLabel = currentSelected;
                        currentIndex++;

                        if (inCollectionsView) {
                            loadExhibition(currentList[currentIndex]);
                        }
                        if (inArtworkView) {
                            loadArtwork(currentList[currentIndex]);
                        }
                        if (inAssociatedView) {
                            loadAssocMedia(currentList[currentIndex]);
                        }
                        if (inToursView) {
                            loadTour(currentList[currentIndex]);
                        }
                        if (inFeedbackView) {
                            loadFeedback(currentList[currentIndex]);
                        }
                    }
                }
            }
        }
        if (inGeneralView) {
            if (currentSelected === labelOne) {
                resetLabels('.leftLabel');
                selectLabel(labelTwo);
                currentSelected = labelTwo;
                loadPasswordScreen();
            } else if (currentSelected === labelTwo) {
                resetLabels('.leftLabel');
                selectLabel(labelOne);
                currentSelected = labelOne;
                loadSplashScreen();
            }
        }
    }

 /**
  * Function to reset current view and reload original labels
  * @method resetView
  */
    function resetView() {
        if (inArtworkView) {
            loadArtView();
        } else if (inAssociatedView) {
            loadAssocMediaView();
        } else if (inCollectionsView) {
            loadExhibitionsView();
        } else if (inFeedbackView) {
            loadFeedbackView();
        } else if (inToursView) {
            loadTourView();
        }
    }

    /**
     * Helper function to set up UI elements and switch to first view
     * @method loadHelper
     * @param {Object} main  
     */
    function loadHelper(main){

        //Setting up UI:
        backButton = root.find('#setViewBackButton');
        backButton.attr('src', tagPath + 'images/icons/Back.svg');

        backButton.mousedown(function () {
            TAG.Util.UI.cgBackColor("backButton", backButton, false);
        });
            
        backButton.mouseleave(function () {
            TAG.Util.UI.cgBackColor("backButton", backButton, true);
        });

        backButton.click(function () {

            TAG.Telemetry.recordEvent("SpentTime", function (tobj) {
                tobj.item = "settings_view";
                tobj.time_spent = SETTINGSVIEW_TIMER.get_elapsed();
                //console.log("settings view spent time: " + tobj.time_spent);
            });

            TAG.Telemetry.recordEvent("LeftBarSelection", function (tobj) {
                tobj.category_name = prevLeftBarSelection.categoryName;
                tobj.middle_bar_load_count = prevLeftBarSelection.loadTime;
                tobj.time_spent = prevLeftBarSelection.timeSpentTimer.get_elapsed();
            });

            TAG.Telemetry.recordEvent("MiddleBarSelection", function (tobj) {
                tobj.type_representation = prevMiddleBarSelection.type_representation;
                tobj.time_spent = prevMiddleBarSelection.time_spent_timer.get_elapsed();
            });

            //if (!changesHaveBeenMade) {
            TAG.Util.removeYoutubeVideo();
                TAG.Auth.clearToken();
                rightQueue.clear();
                middleQueue.clear();
                backButton.off('click');
                if (backPage) {
                    var bpage = backPage();
                    TAG.Util.UI.slidePageRight(bpage);
                } else {
                    TAG.Layout.StartPage(null, function (page) {
                        TAG.Util.UI.slidePageRight(page);
                    });
                }
                TAG.Util.UI.getStack()[0] = null;
            //} else {

            //    changesHaveBeenMade && currentMetadataHandler && saveQueue.add(currentMetadataHandler());
            //    changesHaveBeenMade = false;

            //    backButtonClicked = true;

            //    settingsContainer.css({ visibility: 'hidden' });
            //    settings.css({ overflow: 'hidden' });
            //    buttonContainer.css({ visibility: 'hidden' });
            //    var changeLabel = createLabel('Changes are being saved...');
            //    changeLabel.attr('id', 'changeLabel');
            //    changeLabel.css({
            //        'position': 'absolute',
            //        'top': '30%',
            //        'left': '10%',
            //        'z-index': '50',
            //        'height': 'auto',
            //        'width': '33%',
            //        'color': 'black',
            //        'font-size': '80%'
            //    });
            //    var progressCircCSS = {
            //        'position': 'absolute',
            //        'left': '50%',
            //        'top': '30%',
            //        'z-index': '50',
            //        'height': 'auto',
            //        'width': '10%'
            //    };
            //    var progressCL = TAG.Util.showProgressCircle(settings, progressCircCSS, '0px', '0px', true);
            //    settings.append(changeLabel);
            //}
            
        });
        /*
        TAG.Telemtry.register(backButton, "click", "BackButton", function (tobj) {
            tobj.current_artwork = artwork.Identifier;
            tobj.next_page = null;
            tobj.time_spent = null;
        }); */

        var topBarLabel = root.find('#setViewTopBarLabel');
        var topBarLabelSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height() * 0.08,
        {
            width: 0.4,
            height: 0.9,
        });
        topBarLabel.css({
            'height': topBarLabelSpecs.height + 'px',
            'width': topBarLabelSpecs.width + 'px',
        });
        var fontsize = TAG.Util.getMaxFontSizeEM('Tour Authoring', 0.5, topBarLabelSpecs.width, topBarLabelSpecs.height * 0.8, 0.1);
        topBarLabel.css({ 'font-size': fontsize });
        topBarLabel.text('Authoring Mode');

        //Add text to navigation bar:

        navBar.append(nav[NAV_TEXT.general.text] = createNavLabel(NAV_TEXT.general, loadGeneralView));
        navBar.append(nav[NAV_TEXT.exhib.text] = createNavLabel(NAV_TEXT.exhib, loadExhibitionsView));
        navBar.append(nav[NAV_TEXT.art.text] = createNavLabel(NAV_TEXT.art, loadArtView));
        navBar.append(nav[NAV_TEXT.media.text] = createNavLabel(NAV_TEXT.media, loadAssocMediaView)); // COMMENT!!!!!!!!
        if (IS_WINDOWS){
            navBar.append(nav[NAV_TEXT.tour.text] = createNavLabel(NAV_TEXT.tour, loadTourView, false));
        } else{
            navBar.append(nav[NAV_TEXT.tour.text] = createNavLabel(NAV_TEXT.dummytour, null, true));
        }
        //navBar.append(nav[NAV_TEXT.feedback.text] = createNavLabel(NAV_TEXT.feedback, loadFeedbackView));

        searchbar.css({
            'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")',
            'background-size': 'auto 50%',
            'background-repeat': 'no-repeat',
            'background-position': '12px center'
        });

        searchbar.on('click focus', function () {
            searchbar.css({ 'background-image': 'none' });
        });
        searchbar.on('focusout', function () {
            if (!searchbar.val()) {
                searchbar.css({ 'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")' });
            }
        });
        
        searchbar.keyup(function (e) {

            if (!searchbar.val()) {
                resetView();
                searchbar.css({ 'background-image': 'none' });
            }
        });

       // rootContainer.keydown(keyHandler);
        //searchbar.attr('placeholder', 'Search...');
        newButton.text('New');
        secondaryButton.text('Video');
        addButton.text("Add to Collection");
        label.text('Loading...');
        circle.attr('src', tagPath + 'images/icons/progress-circle.gif');

        viewer.css({
            'height': $(window).width() * RIGHT_WIDTH / 100 * 1 / VIEWER_ASPECTRATIO + 'px',
        });

        buttonContainer.css({
            'top': $(window).width() * RIGHT_WIDTH / 100 * 1 / VIEWER_ASPECTRATIO + 'px',
        });
        settings.css({
            'height': getSettingsHeight() + 'px',
        });
        switchView(startView, startLabelID);
    }
    
    /**Switches the view based on selected navigation label
     * @method switchView
     * @param {String} view         the view to switch to
     * @param {Object} id           the id of the middle label to start on
     */
    function importFiles() {
        console.log("Import button was clicked");
    }

    function switchView(view, id) {
        resetLabels('.navContainer');
        console.log("switch view called");
        switch (view) {
            case "Exhibitions":
                selectLabel(nav[NAV_TEXT.exhib.text]);
                prevSelectedSetting = nav[NAV_TEXT.exhib.text];
                loadExhibitionsView(id);
                isArtView = false;
                break;
            case "Artworks":
                selectLabel(nav[NAV_TEXT.art.text]);
                prevSelectedSetting = nav[NAV_TEXT.art.text];
                loadArtView(id);
                isArtView = true;
                break;
            case "Associated Media": 
                selectLabel(nav[NAV_TEXT.media.text]);
                prevSelectedSetting = nav[NAV_TEXT.media.text];
                loadAssocMediaView(id);
                isArtView = false;
                break;
            case "Tours":
                selectLabel(nav[NAV_TEXT.tour.text]);
                prevSelectedSetting = nav[NAV_TEXT.tour.text];
                loadTourView(id);
                isArtView = false;
                break;
            case "Feedback":
                selectLabel(nav[NAV_TEXT.feedback.text]);
                prevSelectedSetting = nav[NAV_TEXT.feedback.text];
                loadFeedbackView(id);
                isArtView = false;
                break;
            case "General Settings":
                isArtView = false;

            default:
                selectLabel(nav[NAV_TEXT.general.text]);
                prevSelectedSetting = nav[NAV_TEXT.general.text];
                loadGeneralView();
                isArtView = false;
                break;
        }
    }

    /**Returns root
     * @method getRoot
     * @return {Object} root 
     */
    function getRoot() {
        return root;
    }

    // Navigation Bar Functions:

     /**Create a navigation label
     * @method createNavLabel
     * @param {String} text         text for label
     * @param {Function} onclick    onclick function for label
     * @param {Boolean} disabled    true if its disabled
     * @return {Object} container   container containing new label
     */
    function createNavLabel(text, onclick, disabled) {
        var container = $(document.createElement('div'));
        if (!disabled){
            container.attr('class', 'navContainer');
        } else {
            container.attr('class','dummyNav')
        }
        container.attr('id', 'nav-' + text.text);
        if (!disabled){
        container.mousedown(function () {
            container.css({
                'background': HIGHLIGHT
            });
        });
        container.mouseup(function () {
            container.css({
                'background': 'transparent'
            });
        });
        container.mouseleave(function () {
            container.css({
                'background': 'transparent'
            });
        });
        container.click(function () {
            
            TAG.Telemetry.recordEvent("LeftBarSelection", function (tobj) {
                tobj.category_name = prevLeftBarSelection.categoryName;
                tobj.middle_bar_load_count = prevLeftBarSelection.loadTime;
                tobj.time_spent = prevLeftBarSelection.timeSpentTimer.get_elapsed();
            });

            prevLeftBarSelection.timeSpentTimer.restart();
            prevLeftBarSelection.loadTime = 0
            prevLeftBarSelection.categoryName = text.text;

            // If a label is clicked return if its already selected.
            //if (prevSelectedSetting === container) {
            //    return;
            //} else {
            //    changesHaveBeenMade && currentMetadataHandler && saveQueue.add(currentMetadataHandler());
            //    changesHaveBeenMade = false;
            //}
            // Reset all labels and then select this one
            TAG.Util.removeYoutubeVideo();
            searchbar[0].value = "";

            resetLabels('.navContainer');
            selectLabel(container);
            // Do the onclick function
            if (onclick) {
                onclick();
            }
            prevSelectedSetting = container;
        });
        }
        // vertical centering groundwork for 2.2
        //var navTextHolder;

        var navtext = $(document.createElement('label'));
        navtext.attr('class','navtext');
        navtext.text(text.text);

        var navsubtext = $(document.createElement('label'));
        navsubtext.attr('class','navsubtext');
        navsubtext.text(text.subtext);

        if (disabled){
            container.removeClass('leftLabel');
        }

        container.append(navtext);
        container.append(navsubtext);
        return container;
    }

    // General Settings Functions:

    /**Loads the General Settings view
     * @method loadGeneralView
     */
    function loadGeneralView() {
  
        inGeneralView = true;
        inCollectionsView = false;
        inArtworkView = false;
        inAssociatedView = false;
        inToursView = false;
        inFeedbackView = false;

        changesMade = false;

        prepareNextView(false);
        if (prevLeftBarSelection.categoryName == null) {
            prevLeftBarSelection = {
                timeSpentTimer: new TelemetryTimer(),
                categoryName: "General Settings",
                loadTime: 0
            };
        }

        var loadTimer = new TelemetryTimer();
        // Add this to our queue so the UI doesn't lock up
        middleQueue.add(function () { 
            var label;
            // Add the Splash Screen label and set it as previously selected because its our default
            middleLoading.before(label = selectLabel(createMiddleLabel('Splash Screen', null, loadSplashScreen), true));
            labelOne = label;
            labelOne.addClass('leftLabel');
            prevSelectedMiddleLabel = label;
            // Default to loading the splash screen
            loadSplashScreen();
            // Add the Password Settings label
            labelTwo = createMiddleLabel('Password Settings', null, loadPasswordScreen).attr('id', 'password');
            labelTwo.addClass('leftLabel');
            middleLoading.before(labelTwo);
            middleLoading.hide(); 
        });
        middleQueue.add(function () {
            prevLeftBarSelection.loadTime = loadTimer.get_elapsed();
        });
        cancelLastSetting = null;
    }

    // Fixes volume far for video/audio
    function fixVolumeBar(mediaElement) {
        var media = mediaElement[0];
        var lastVolume = media.volume;
        var muted = false;
        media.addEventListener('volumechange', function () {
            if (media.muted) {
                media.volume = 0;
                muted = true;
            }
            else {
                if (muted) {
                    media.volume = lastVolume;
                    muted = false;
                }
                lastVolume = media.volume;
            }
        }, false);
    }

    /**Sets up the right side of the UI for the splash screen
     * including the viewer, buttons, and settings container.
     * @method loadSplashScreen
     */
    function loadSplashScreen() {
        //$(document).off();
        prepareViewer(true);
        clearRight();

        // Load the start page, the callback will add it to the viewer when its done
		//if (generalIsLoading) {
        //    generalProgressCircle = displayLoadingSettings();
        //} else {
        //    generalProgressCircle && hideLoadingSettings(generalProgressCircle);
        //}

        // Get DB Values
        /*var alpha = TAG.Worktop.Database.getMuseumOverlayTransparency();
        var overlayColor = TAG.Worktop.Database.getMuseumOverlayColor();
        var name = TAG.Worktop.Database.getMuseumName();
        var loc = TAG.Worktop.Database.getMuseumLoc();
        var info = TAG.Worktop.Database.getMuseumInfo();
        if (name === undefined) {
            name = "";
        }
        if (loc === undefined) {
            loc = "";
        }
        if (info === undefined) {
            info = "";
        }
        var logoColor = TAG.Worktop.Database.getLogoBackgroundColor();
        var backgroundColor = TAG.Worktop.Database.getBackgroundColor();
        var backgroundOpacity = TAG.Worktop.Database.getBackgroundOpacity();*/
        var primaryFontColor = TAG.Worktop.Database.getPrimaryFontColor();
        var secondaryFontColor = TAG.Worktop.Database.getSecondaryFontColor();
        var fontFamily = TAG.Worktop.Database.getFontFamily();
        var idleTimerDuration = TAG.Worktop.Database.getIdleTimerDuration()/60000;

        prevMiddleBarSelection = {
            type_representation: "Splash Screen",
            time_spent_timer: new TelemetryTimer()
        };

        // Create inputs
        //var alphaInput = createTextInput(Math.floor(alpha * 100), true);
        var bgImgInput = createButton('Change Image', function () {
            changesMade = true;
            saveButton.prop("disabled", false);
			uploadFile(TAG.Authoring.FileUploadTypes.Standard, function (urls) {
                var url = urls[0];
                bgImgInput.val(url);
                $('#innerContainer').css({
                    'background-image': 'url("' + TAG.Worktop.Database.fixPath(url) + '")',
                    'background-size': 'cover',
                });
            });
        });
        TAG.Telemetry.register(bgImgInput, "click", "BackgroundImage", function (tobj) {
            //nothing to record
        });
        bgImgInput.css('height', '35px');
        /*var logoInput = createButton('Change Logo', function () {
            changesHaveBeenMade = true;
			uploadFile(TAG.Authoring.FileUploadTypes.Standard, function (urls) {
                var url = urls[0];
                logoInput.val(url);
                $('#logo')[0].src = TAG.Worktop.Database.fixPath(url);
            });
        });*/
        /*var overlayColorInput = createBGColorInput(overlayColor, '.infoDiv', null, function () { return alphaInput.val(); });
        var nameInput = createTextInput(TAG.Util.htmlEntityDecode(name), true, 40);
        var locInput = createTextInput(TAG.Util.htmlEntityDecode(loc), true, 45);
        var infoInput = createTextAreaInput(TAG.Util.htmlEntityDecode(info), true);
        var logoColorInput = createBGColorInput(logoColor, '.logoContainer', null, function () { return 100; });
        var backgroundColorInput = createBGColorInput(backgroundColor, '.background', null, function() { return backgroundOpacityInput.val(); });
        var backgroundOpacityInput = createTextInput(backgroundOpacity, true);*/
        var primaryFontColorInput = createBGColorInput(primaryFontColor, null, '.primaryFont', function () {
            changesMade = true;
            saveButton.prop("disabled", false);
            saveButton.css("opacity", 1);
            return 100;
        });

        primaryFontColorInput.on('keyup', function (event) {
            if (event.which === 13) {
                event.preventDefault();
                event.stopPropagation();
                saveButton.click();
            } else {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            }
            
        });

        primaryFontColorInput.on('change', function () {
            changesMade = true;
            saveButton.prop("disabled", false);
            saveButton.css("opacity", 1);
        });

        var secondaryFontColorInput = createBGColorInput(secondaryFontColor, null, '.secondaryFont', function () {
            changesMade = true;
            saveButton.prop("disabled", false);
            saveButton.css("opacity", 1);
            return 100;
        });

        secondaryFontColorInput.on('keyup', function (event) {
            if (event.which === 13) {
                event.preventDefault();
                event.stopPropagation();
                saveButton.click();
            } else {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            }
        });

        secondaryFontColorInput.on('change', function () {
            changesMade = true;
            saveButton.prop("disabled", false);
            saveButton.css("opacity", 1);
        });


        //var fontFamilyInput = createSelectInput(['Arial', 'Calibri', 'Comic Sans MS', 'Courier New', 'Franklin Gothic', 'Raavi', 'Segoe Print', 'Segoe UI Light', 'Source Sans Pro', 'Times New Roman', 'Trebuchet MS', 'Verdana'], TAG.Worktop.Database.getFontFamily());
        var idleTimerDurationInput = createTextInput(idleTimerDuration, "", 3, false, false, true);
        idleTimerDurationInput.on('keyup', function () {
            changesMade = true;
            saveButton.prop("disabled", false);
            saveButton.css("opacity", 1);
        });
        var startPage = previewStartPage(primaryFontColorInput, secondaryFontColorInput);

        //var font = fontFamilyInput.find(":selected").text();
        //$('.primaryFont').css('font-family', fontFamily);
        //$('.secondaryFont').css('font-family', fontFamily);
        
        // Handle changes
        primaryFontColorInput.focus(function () {
            $('#tagContainer').off().unbind();
        });
        secondaryFontColorInput.focus(function () {
            $('#tagContainer').off().unbind();
        });
        // Handle changes for autosaving
        //primaryFontColorInput.on('change', function () { changesHaveBeenMade = true; });
        //secondaryFontColorInput.on('change', function () { changesHaveBeenMade = true; });
        //fontFamilyInput.on('change', function () { changesHaveBeenMade = true; });
        //idleTimerDurationInput.on('change', function () { changesHaveBeenMade = true; });

        /*onChangeUpdateNum(alphaInput, 0, 100, function (num) {
            updateBGColor('.infoDiv', overlayColorInput.val(), num);
        });
        onChangeUpdateText(nameInput, '#museumName', 40);
        nameInput.keyup(function () {
            startPage.fixText();
        });
        nameInput.keydown(function () {
            startPage.fixText();
        });var museumLoc
        nameInput.change(function () {
            startPage.fixText();
        });
        onChangeUpdateText(locInput, '#subheading', 33);
        onChangeUpdateText(infoInput, '#museumInfo', 300);
        onChangeUpdateNum(backgroundOpacityInput, 0, 100, function(num) {
            updateBGColor('.background', backgroundColorInput.val(), num);
        })*/



        var bgImage = createSetting('Background Image', bgImgInput);
        /*var overlayAlpha = createSetting('Overlay Transparency (0-100)', alphaInput);
        var overlayColorSetting = createSetting('Overlay Color', overlayColorInput);
        var museumName = createSetting('Museum Name', nameInput);
        var museumLoc = createSetting('Museum Location', locInput);
        var museumInfo = createSetting('Museum Info', infoInput);
        var museumLogo = createSetting('Museum Logo', logoInput);
        var logoColorSetting = createSetting('Museum Logo Background Color', logoColorInput);
        var backgroundColorSetting = createSetting('Background Color', backgroundColorInput);
        var backgroundOpacitySetting = createSetting('Background Opacity (0-100)', backgroundOpacityInput);*/
        var primaryFontColorSetting = createSetting('Primary Font Color', primaryFontColorInput);
        var secondaryFontColorSetting = createSetting('Secondary Font Color', secondaryFontColorInput);
        //var fontFamilySetting = createSetting('Font Family', fontFamilyInput);
        var idleTimerDurationSetting = createSetting('Idle Timer Duration (in minutes)', idleTimerDurationInput);

        settingsContainer.append(bgImage);
        /*settingsContainer.append(overlayColorSetting);
        settingsContainer.append(overlayAlpha);
        settingsContainer.append(museumName);
        settingsContainer.append(museumLoc);
        settingsContainer.append(museumInfo);
        settingsContainer.append(museumLogo);
        settingsContainer.append(logoColorSetting);
        settingsContainer.append(backgroundColorSetting);
        settingsContainer.append(backgroundOpacitySetting);*/
        settingsContainer.append(primaryFontColorSetting);
        settingsContainer.append(secondaryFontColorSetting);
        //settingsContainer.append(fontFamilySetting);
        settingsContainer.append(idleTimerDurationSetting);
		//automatically save General Settings - Customization
        onChangeUpdateText(idleTimerDurationInput, null, 3);
        //TAG.Util.IdleTimer.TwoStageTimer().s1d = idleTimerDurationInput.val();
        settings.scroll(function () {
            secondaryFontColorInput.trigger("blur");
            primaryFontColorInput.trigger("blur");
        });

        //currentMetadataHandler = function () {
        //    /*if (locInput === undefined) {
        //        locInput = "";
        //    }
        //    if (infoInput === undefined) {
        //        infoInput = "";
        //    }*/
        //    saveSplashScreen({
        //        /*alphaInput: alphaInput,                             //Overlay Transparency
        //        overlayColorInput: overlayColorInput,               //Overlay Color
        //        nameInput: nameInput,                               //Museum Name
        //        locInput: locInput,                                 //Museum Location
        //        infoInput: infoInput,                               //Museum Info
        //        logoColorInput: logoColorInput, */                    //Logo background color
        //        bgImgInput: bgImgInput,                             //Background image
        //        /*logoInput: logoInput,                               //Logo image
        //        backgroundColorInput: backgroundColorInput,         //Background Color
        //        backgroundOpacityInput: backgroundOpacityInput, */    //Background Opacity
        //        primaryFontColorInput: primaryFontColorInput,       //Primary Font Color
        //        secondaryFontColorInput: secondaryFontColorInput,   //Secondary Font Color
        //        fontFamilyInput: fontFamilyInput,
        //        //idleTimerDurationInput: idleTimerDurationInput
        //    });
        //};

        var kioskIsLocked = TAG.Worktop.Database.getKioskLocked(); //need server request
        var unlockedKioskInput = createButton('Unlocked', function () {
                kioskIsLocked = false;
                unlockedKioskInput.css('background-color', 'white');
                lockedKioskInput.css('background-color', '');
            }, {
                'min-height': '0px',
                'margin-right': '4%',
                'width': '48%',
            });
        var lockedKioskInput = createButton('Locked', function () {
                kioskIsLocked = true;
                lockedKioskInput.css('background-color', 'white');
                unlockedKioskInput.css('background-color', '');
            }, {
                'min-height': '0px',
                'width': '48%',
            });
        if (kioskIsLocked == "true") {
            lockedKioskInput.css('background-color', 'white');
        } else {
            unlockedKioskInput.css('background-color', 'white');
        }
        var kioskOptionsDiv = $(document.createElement('div'));
        kioskOptionsDiv.append(unlockedKioskInput).append(lockedKioskInput);

        //to-do create save function for kiosk locking

        lockedKioskInput.on('click',function () {
            changesMade = true;
            saveButton.prop("disabled", false);
            saveButton.css("opacity", 1);
        });

        unlockedKioskInput.on('click',function () {
            changesMade = true;
            saveButton.prop("disabled", false);
            saveButton.css("opacity", 1);
        });

        var lockKioskSetting = createSetting("Lock Kiosk Mode", kioskOptionsDiv);
        settingsContainer.append(lockKioskSetting);

        // Save buttton

        var saveButton = createButton('Save', function () {
           /* if (locInput === undefined) {
                locInput = "";
            }
            if (infoInput === undefined) {
                infoInput = "";
            }*/
            //save Splash screen and pass in inputs with following keys:
            //idleTimerDurationInput.text(idleTimerDurationInput.val());
            saveIdleTimerDuration(idleTimerDurationInput);
            //idleTimerDurationInput.text(idleDuration);
            saveSplashScreen({
                //alphaInput: alphaInput,                             //Overlay Transparency
                //overlayColorInput: overlayColorInput,               //Overlay Color
                //nameInput: nameInput,                               //Museum Name
                //locInput: locInput,                                 //Museum Location
                //infoInput: infoInput,                               //Museum Info
                //logoColorInput: logoColorInput,                     //Logo background color
                isKioskLocked: kioskIsLocked,
                bgImgInput: bgImgInput,                             //Background image
                //logoInput: logoInput,                               //Logo image
                //backgroundColorInput: backgroundColorInput,         //Background Color
                //backgroundOpacityInput: backgroundOpacityInput,    //Background Opacity
                primaryFontColorInput: primaryFontColorInput,       //Primary Font Color
                secondaryFontColorInput: secondaryFontColorInput,   //Secondary Font Color
                //fontFamilyInput: fontFamilyInput,
                idleTimerDurationInput: idleTimerDurationInput
            });
        }, {
            'margin-right': '3%',
            'margin-top': '1%',
            'margin-bottom': '1%',
            'margin-left': '.5%',
            'float': 'right'
        }, true);
        TAG.Telemetry.register(saveButton, "click", "SaveButton", function (tobj) {
            tobj.element_type = "Splash Screen";
        });
        // preview buttons
        var previewStartPageButton = createButton('Splash Screen', function () {
            previewStartPage(primaryFontColorInput, secondaryFontColorInput);
            primaryColorPicker.hidePicker();
            secondaryColorPicker.hidePicker();
        }, {
            'margin-left': '2%',
            'margin-top': '1%',
            'margin-right': '0%',
            'margin-bottom': '3%',
        });

        var previewCollectionsPageButton = createButton('Collections Page', function () {
                previewCollectionsPage(primaryFontColorInput, secondaryFontColorInput);
                primaryColorPicker.hidePicker();
                secondaryColorPicker.hidePicker();
            },
            {
            'margin-left': '2%',
            'margin-top': '1%',
            'margin-right': '0%',
            'margin-bottom': '3%',
        });

        var previewArtworkViewerButton = createButton('Artwork Viewer', function () {
            previewArtworkViewer(primaryFontColorInput, secondaryFontColorInput);
            primaryColorPicker.hidePicker();
            secondaryColorPicker.hidePicker();
        }, {
            'margin-left': '2%',
            'margin-top': '1%',
            'margin-right': '0%',
            'margin-bottom': '3%',
        });

        buttonContainer.append(saveButton);
        buttonContainer.append(previewStartPageButton);
        buttonContainer.append(previewCollectionsPageButton);
        buttonContainer.append(previewArtworkViewerButton);


        saveButton.on("mousedown", function () {
            if (!saveButton.attr("disabled")) {
                saveButton.css({ "background-color": "white" });
            }
        });
        previewStartPageButton.on("mousedown", function () {
            previewStartPageButton.css({ "background-color": "white" });
        });
        previewCollectionsPageButton.on("mousedown", function () {
            previewCollectionsPageButton.css({ "background-color": "white" });
        });
        previewArtworkViewerButton.on("mousedown", function () {
            previewArtworkViewerButton.css({ "background-color": "white" });
        });
        bgImgInput.on("mousedown", function () {
            bgImgInput.css({ "background-color": "white" });
        });
        saveButton.on("mouseleave", function () {
            saveButton.css({ "background-color": "transparent" });
        });
        previewStartPageButton.on("mouseleave", function () {
            previewStartPageButton.css({ "background-color": "transparent" });
        });
        previewCollectionsPageButton.on("mouseleave", function () {
            previewCollectionsPageButton.css({ "background-color": "transparent" });
        });
        previewArtworkViewerButton.on("mouseleave", function () {
            previewArtworkViewerButton.css({ "background-color": "transparent" });
        });
        bgImgInput.on("mouseleave", function () {
            bgImgInput.css({ "background-color": "transparent" });
        });
        newButton.on("mouseleave", function () {
            newButton.css({ "background-color": "transparent" });
        });
        
    }

    /**Changes idle timer stageOne duration from the customization settings
     * input.val() is in minutes, and idleDuration needs to be set in milliseconds
     * hence the conversion factor of 60000
     * @method saveIdleTimerDuration
     * @param {HTML Element} input      
     */
    function saveIdleTimerDuration(input) {
        idleDuration = parseInt(input.val())*60000;
    }

    /**Saves the splash screen settings
     * @method saveSplashScreen
     * @param {Object} inputs       information from setting inputs
     */
    function saveSplashScreen(inputs) {
        //pCL = displayLoadingSettings();
        //backButtonClicked && prepareNextView(false, null, null, "Saving...");
		//generalIsLoading = true;
        clearRight();
        prepareViewer(true);
        prepareNextView(false, null, null, "Saving...");

        /*var alpha = inputs.alphaInput.val()/100;
        var overlayColor = inputs.overlayColorInput.val();
        var name = inputs.nameInput.val();
        var loc = inputs.locInput.val();
        var info = inputs.infoInput.val().replace('/\n\r?/g', '<br />');
        var logoColor = inputs.logoColorInput.val();*/
        var bgImg = inputs.bgImgInput.val();
        /*var logo = inputs.logoInput.val();
        var backgroundColor = inputs.backgroundColorInput.val();
        var backgroundOpacity = inputs.backgroundOpacityInput.val();*/
        var primaryFontColor = inputs.primaryFontColorInput.val();
        var secondaryFontColor = inputs.secondaryFontColorInput.val();
        var isKioskLocked = inputs.isKioskLocked;
        //var fontFamily = inputs.fontFamilyInput.val();
        //var baseFontSize = LADS.Util.getMaxFontSize('Test', 2, 100000000, 30, 0.1);
        var idleTimerDuration = inputs.idleTimerDurationInput.val() * 1000 * 60;
        
        //inputs.idleTimerDurationInput.val(idleTimerDuration);
        //TAG.Util.IdleTimer.TwoStageTimer().s1d = parseInt(idleTimerDuration);
        var options = {
            //Name: name,
            //OverlayColor: overlayColor,
            //OverlayTrans: alpha,
            //Location: loc,
            //Info: info,
            //IconColor: logoColor,
            //BackgroundColor: backgroundColor,
            //BackgroundOpacity: backgroundOpacity,
            PrimaryFontColor: primaryFontColor,
            SecondaryFontColor: secondaryFontColor,
            isKioskLocked: isKioskLocked,
            //FontFamily: fontFamily,
            //BaseFontSize: baseFontSize,
            IdleTimerDuration: idleTimerDuration
        };
        if (bgImg) { options.Background = bgImg; }
        //if (logo) options.Icon = logo;

        //Change the settings in the database
        TAG.Worktop.Database.changeMain(options, function () {
            //refreshSplashScreen();
            //generalIsLoading = false;
            //if (!(generalIsLoading || collectionsIsLoading ||
            //    artworksIsLoading || associatedMediaIsLoading || toursIsLoading)) { //don't continue if more sections are still loading - wait for them to finish
            //    backButtonClicked && backButtonClickHandler();
            //};
            if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.general.text]) {
                LADS.Worktop.Database.getMain();
                return;
            };
            LADS.Worktop.Database.getMain(function () {
                if (!(prevSelectedMiddleLabel && (prevSelectedMiddleLabel.text() === "Password Settings"))) {
                    loadGeneralView();
                };
            }, error(loadGeneralView), null);
            //hideLoading();
            //hideLoadingSettings(pCL);
        }, authError, conflict({ Name: 'Main' }, 'Update', loadGeneralView), error(loadGeneralView));
    }

    /**Set up the right side of the UI for the  password changer
     * @method loadPasswordScreen
     */
    function loadPasswordScreen() {
        //generalProgressCircle && hideLoadingSettings(generalProgressCircle);
        prepareViewer(false, null, false);
        clearRight();

        prevMiddleBarSelection = {
            type_representation: "Password Screen",
            time_spent_timer: new TelemetryTimer()
        };
        var loading = createLabel('Loading...');
        var loadingSetting = createSetting('', loading);
        settingsContainer.append(loadingSetting);

        TAG.Worktop.Database.checkSetting('AllowChangePassword', function (val) {
            loadingSetting.remove();
            if (val.toLowerCase() === 'true') {
                var oldInput = createTextInput('', false);
                var newInput1 = createTextInput('', false);
                var newInput2 = createTextInput('', false);
                var msgLabel = createLabel('');

                newInput1.on('keyup', function () {
                    changesMade = true;
                    saveButton.prop("disabled", false);
                    saveButton.css("opacity", 1);
                });

                oldInput.attr('type', 'password');
                newInput1.attr('type', 'password');
                newInput2.attr('type', 'password');

                var old = createSetting('Current Password', oldInput);
                var new1 = createSetting('New Password', newInput1);
                var new2 = createSetting('Confirm New Password', newInput2);
                var msg = createSetting('', msgLabel);

                settingsContainer.append(old);
                settingsContainer.append(new1);
                settingsContainer.append(new2);
               

                //Hide or else unused div covers 'Old Password' line
                buttonContainer.css('display', 'none');

                var saveButton = createButton('Update Password', function () {
                    savePassword({
                        old: oldInput,         // Old password
                        new1: newInput1,       // New password
                        new2: newInput2,       // New password confirmation
                        msg: msgLabel,         // Message area
                    });
                });
                TAG.Telemetry.register(saveButton, "click", "SaveButton", function (tobj) {
                    tobj.element_type = "Change Password";
                });
                // Make the save button respond to enter
                saveButton.removeAttr('type');
                var save = createSetting('', saveButton);
                settingsContainer.append(save);
                settingsContainer.append(msg);
            } else {
                passwordChangeNotSupported();
            }
        });
    }

    /**Display label if password change not supported by server
     *@method passwordChangeNotSupported
     */
    function passwordChangeNotSupported() {
        var label = createLabel('');
        var setting = createSetting('Changing the password has been disabled by the server.  Contact the server administrator for more information', label);
        settingsContainer.append(setting);
    }

    /**Updates the new password
     * @method savePassword
     * @param {Object} inputs    keys for password change
     */
    function savePassword(inputs) {
        inputs.msg.text('Processing...');
        if (inputs.new1.val() !== inputs.new2.val()) {
            inputs.msg.text('New passwords do not match.');
        } else {
            TAG.Auth.changePassword(inputs.old.val(), inputs.new1.val(),
                function () {
                    inputs.msg.text('Password Saved.');
                    inputs.old.val('');
                    inputs.new1.val('');
                    inputs.new2.val('');
                },
                function (msg) {
                    if (msg) {
                        inputs.msg.html(msg);
                    } else {
                        inputs.msg.text('Incorrect Password.');
                    }
                },
                function () {
                    inputs.msg.text('There was an error contacting the server.');
                });
        }
    }

    // PREVIEWS OF SPLASH SCREEN, COLLECTIONS PAGE, ARTOWRK VIEWER FOR CUSTOMIZATION

    /**Preview splash screen
     * @method previewStartPage
     */
    function previewStartPage(primaryFontInput, secondaryFontInput) {
        // Load the start page, the callback adds it to the viewer when it's done loading
        var startPage = TAG.Layout.StartPage({ primaryFontColor: primaryFontInput.val(), secondaryFontColor: secondaryFontInput.val(), isPreview:true}, function (startPage) {
            if(prevSelectedSetting && prevSelectedSetting != nav[NAV_TEXT.general.text]) {
                return;
            }
            viewer.empty();
            viewer.append(startPage);
            preventClickthrough(viewer);
        });
        return startPage;
    }

    /**Preview collections page
     * @method previewCollectionsPage
     */
    function previewCollectionsPage(primaryFontInput, secondaryFontInput) {
    	var collectionsPage,
    		options,
    		croot;
    	options = {
    	    primaryFontColor: primaryFontInput.val(),
    	    secondaryFontColor: secondaryFontInput.val(),
    		previewing:true
    	}
    	collectionsPage = TAG.Layout.CollectionsPage(options);
    	$(collectionsPage).find("*").off();;
        croot = collectionsPage.getRoot();
        $(croot).css({ 'z-index': '1' });

        if(prevSelectedSetting && prevSelectedSetting != nav[NAV_TEXT.general.text]) {
            return;
        }
        viewer.empty();
        viewer.append(croot);
        preventClickthrough(viewer);
    }

    /**Preview artwork viewer
     * @method previewArtworkViewer
     */
    function previewArtworkViewer(primaryFontInput, secondaryFontInput) {
        var doq,
        	options,
        	artworkViewer,
        	aroot;

        TAG.Worktop.Database.getArtworks(function(result){
        	doq=result[0];
        	var i;
     		for (i=0;i<result.length;i++){
     			//set the preview doq to the first artwork (not video or tour)
     			if (!(result[i].Metadata.Medium === "Video")&& !(result[i].Type === "Empty")){
     				doq = result[i];
     				break;
     			}
     		}
        	options = { 
        		catalogState: {}, 
        		doq: doq, 
        		split: 'L', 
        		primaryFontColor: primaryFontInput.val(),
        		secondaryFontColor: secondaryFontInput.val(),
        		previewing: true,
        	}
        	artworkViewer = TAG.Layout.ArtworkViewer(options, viewer);
        	aroot = artworkViewer.getRoot();
        	$(aroot).css('z-index', '-1');
        	if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.general.text]) {
            	return;
        	}
        	viewer.empty();
        	
        	viewer.append(aroot);
        	// Don't allow the viewer to be clicked
        	preventClickthrough(viewer);
        	
        });      
    }

    // Collection Functions:

    /**Loads the collections view
     * @method loadExhibitionsView
     * @param {Object} id       id of middle label to start on
     */
    function loadExhibitionsView(id, matches) {

        inGeneralView = false;
        inCollectionsView = true;
        inArtworkView = false;
        inAssociatedView = false;
        inToursView = false;
        inFeedbackView = false;

        changesMade = false;

        var list;
        var cancel = false;
        currentIndex = 0;

        // Set the new button text to "New"
        prepareNextView(true, "New", createExhibition);
        clearRight();
        prepareViewer(true);

        //if (generalIsLoading || collectionsIsLoading ||
        //         artworksIsLoading || associatedMediaIsLoading || toursIsLoading) {
        //    hideLoading();
        //    hideLoadingSettings(pCL);
        //};

        //generalProgressCircle && hideLoadingSettings(generalProgressCircle);
        //collectionsIsLoading && showLoading();
        //(saveArray.indexOf(previousIdentifier) < 0) && function () { hideLoading(); hideLoadingSettings(pCL); };
        if (prevLeftBarSelection.categoryName == null) {
            prevLeftBarSelection = {
                timeSpentTimer: new TelemetryTimer(),
                categoryName: "General Settings",
                loadTime: 0
            };
        }
        var loadTimer = new TelemetryTimer();
        if (typeof matches !== "undefined") {
            list = matches;
            displayLabels();
        } else {
            // Make an async call to get the list of exhibitions
            TAG.Worktop.Database.getExhibitions(function (result) {
                if (cancel) return;
                sortAZ(result);
                currentList = result;
                initSearch();
                list = result;
                console.log("loading colelctions");
                displayLabels();
            });
        }
        

        function displayLabels() {
            $.each(list, function (i, val) {
                if (cancel) {
                    return;
                }
                // Add each label as a separate function in the queue so they don't lock up the UI
                middleQueue.add(function () {
                    if (cancel) {
                        return;
                    }
                    if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.exhib.text]) {
                        return;
                    }
                    var label;
                    if (!prevSelectedMiddleLabel &&
                        ((id && val.Identifier === id) || (!id && i === 0))) {

                        // Select the first one or the specified id
                        middleLoading.before(selectLabel(label = createMiddleLabel(val.Name, null, function () {
                            previousIdentifier = val.Identifier;
                            if (cancelLastView) cancelLastView();
                            loadExhibition(val);
                            currentIndex = i;
                        }, val.Identifier), true));

                        // Scroll to the selected label if the user hasn't already scrolled somewhere
                        if (middleLabelContainer.scrollTop() === 0 && label.offset().top - middleLabelContainer.height() > 0) {
                            middleLabelContainer.animate({
                                scrollTop: (label.offset().top - middleLabelContainer.height() / 2)
                            }, 1000);
                        }
                        prevSelectedMiddleLabel = label;
                        currentSelected = prevSelectedMiddleLabel;
                        currentIndex = i;
                        if (cancelLastView) cancelLastView();
                        loadExhibition(val);
                    } else {
                        middleLoading.before(label = createMiddleLabel(val.Name, null, function () {
                            //if (changesHaveBeenMade) {
                            //    //saveArray.push(previousIdentifier);
                            //    //currentMetadataHandler && saveQueue.add(currentMetadataHandler());
                            //    //changesHaveBeenMade = false;
                            //}
                            if (cancelLastView) cancelLastView();
                            loadExhibition(val);
                            previousIdentifier = val.Identifier;
                            currentIndex = i;
                        }, val.Identifier));
                        //prevSelectedMiddleLabel = label;
                        //currentSelected = prevSelectedMiddleLabel;
                    }

                });
            });
            // Hide the loading label when we're done
            middleQueue.add(function () {
                middleLoading.hide();
            });
            middleQueue.add(function () {
                prevLeftBarSelection.loadTime = loadTimer.get_elapsed();
            });
        }

        cancelLastSetting = function () { cancel = true; };
    }

    //CLICK HANDLER FOR SORT OPTIONS
    function clickCallback(sortDiv) {
        return function () {
            var buttonId = sortDiv.text().toLowerCase() + "Button",
                sortButton;

            if (sortDiv.attr("setSort") === "true" || sortDiv.attr("setSort") === true) {
                if (sortOptionsCount>0){
                    sortOptionsCount--;
                }
                
                sortDiv.attr("setSort", false);
                sortDiv.css({
                    "background-color": "black",
                    "background": "transparent",
                    "color": "black"
                });
                sortOptionsObj[sortDiv.text()] = false;
                //TODO:set the sort tag to white in previewer

                $("[id='"+buttonId+"']").hide();

                if (sortDiv.text() === "Date") {
                    timelineShown = false;
                    $("#dateButton").hide();
                    $("#showTimelineBttn").css('background-color', '');
                    $("#hideTimelineBttn").css('background-color', 'white');
                    $("#showTimelineBttn").attr("disabled","true");
                }
            } else {
                if (sortOptionsCount < 4) {
                    sortOptionsCount++;
                    sortDiv.attr("setSort", true);
                    sortDiv.css({
                        "background-color": "white"
                    });

                    //if the button already exists
                    if ($("[id='" + buttonId + "']")[0]) {
                        $("[id='" + buttonId + "']").show()
                            .css({"color":TAG.Util.UI.dimColor( "#" + TAG.Worktop.Database.getSecondaryFontColor(), 1.7)})
                    } else { //or if you're making it (sort option was origionally deselected)
                        sortButton = $(document.createElement('div'));
                        //Because stored on server as "Tour" but should be displayed as "Tours"
                        //sortDiv.text()==="Tour" ? text = "Tours" : text = sortDiv.text();
                        sortButton.addClass('secondaryFont');
                        sortButton.addClass('rowButton')
                                    .text(sortDiv.text())
                                    .attr('id', buttonId)
                                    //TODO: make sortButton have the same class as the same ones that are created in the collections page
                                    .css({
                                        "cursor": "pointer",
                                        "float": "left",
                                        "font-size": "92.5%",
                                        "margin-top": "0.475%",
                                        "margin-right": "2%",
                                        "height": "100%",
                                        "color":TAG.Util.UI.dimColor( "#" + TAG.Worktop.Database.getSecondaryFontColor(), 1.7)
                                    });
                        $("#buttonRow").append(sortButton);
                    }

                    if (sortDiv.text() === "Date") {
                        $("#showTimelineBttn").removeAttr('disabled');
                        $("#dateButton").show();
                    }
                    sortOptionsObj[sortDiv.text()] = true;
                }
                
            }
        };
    };

    //CREATE SORT OPTIONS DIV
    function createSortOptions(sortOptionsObj) {
        sortOptionsCount = 0;
        var sortOptionsDiv = $(document.createElement("div"))
            .css({
                'width': "50%",
                "height": "auto",
                'float': 'right',
                'margin-right': '3%',
                "overflow": "hidden",
                "overflow-x": "hidden"
            });

        var sortObj, sortDiv;
        for (sortObj in sortOptionsObj) {
            if ((sortOptionsObj.hasOwnProperty(sortObj)) && !(sortObj === '')) {
                /*if (sortObj === "Date" && sortOptionsObj[sortObj] === false) {
                    timelineShown = false;

                    $("#showTimelineBttn").css('background-color', '');
                    $("#hideTimelineBttn").css('background-color', 'white');

                    $("#showTimelineBttn").attr("disabled","true");
                }*/
                var sortDiv = $(document.createElement("div"))
                    .text(sortObj)
                    .addClass("sortOptionDiv");
                var setSort = sortOptionsObj[sortObj];
                sortDiv.attr("setSort", setSort);
                if (setSort === true) {
                    sortOptionsCount++;
                    sortDiv.css({
                        "background-color": "white",
                        "border": "1px solid black"
                    });
                }
                sortDiv.click(clickCallback(sortDiv));
                sortOptionsDiv.append(sortDiv);
            }
        }
        
        return sortOptionsDiv;
    }    

    /**Editing collections by adding/removing artworks
     * @method manageCollection
     * @param {doq} exhibition      the current collection to be edited
     */
    function manageCollection(exhibition) {
        console.log("called manage collections");
        if (!exhibition) {
            return;
        }
        TAG.Util.UI.createAssociationPicker(root, "Add and Remove Artworks in this Collection",
                { comp: exhibition, type: 'exhib' },
                'exhib', [{
                    name: 'All Artworks',
                    getObjs: TAG.Worktop.Database.getArtworksAndTours,
                }, {
                    name: 'Artworks in this Collection',
                    getObjs: TAG.Worktop.Database.getArtworksIn,
                    args: [exhibition.Identifier]
                }], {
                    getObjs: TAG.Worktop.Database.getArtworksIn,
                    args: [exhibition.Identifier]
                }, function () {
                    prepareNextView(true, "New", createExhibition);
                    clearRight();
                    prepareViewer(true);
                    loadExhibitionsView(exhibition.Identifier);
                });
     }



    /**Set up the right side for a collection
     * @method loadExhibition
     * @param {Object} exhibition   exhibition to load
     */
    function loadExhibition(exhibition) {
        //$(document).off();
        deleteType = deleteExhibition;
        toDelete = exhibition;
        var cancelView = false;
        clearRight();
        viewer.empty();
        viewer.css('background', 'black');
        var progressCircCSS = {
            'position': 'absolute',
            'left': '5%',
            'z-index': '50',
            'height': 'auto',
            'width': '10%',
            'top': '20%',
        };
        var vert = viewer.height() / 2;
        var horz = viewer.width() / 2;

        var circle = TAG.Util.showProgressCircle(viewer, progressCircCSS, horz, vert, true);

        // Create inputs
        var privateState;
        if (exhibition.Metadata.Private) {
            privateState = (/^true$/i).test(exhibition.Metadata.Private);
        } else {
            privateState = false;
        }
        var privateInput = createButton('Unpublish', function () {
            //(!privateState) && function () { changesHaveBeenMade = true;}();
            privateState = true;
            privateInput.css('background-color', 'white');
            publicInput.css('background-color', '');
        }, {
            'min-height': '0px',
            'margin-right': '4%',
            'width': '48%',
            'height':'35px'
        });
        privateInput.attr('class', 'settingButton');
        var publicInput = createButton('Publish', function () {
            //(privateState) && function () { changesHaveBeenMade = true; }();
            privateState = false;
            publicInput.css('background-color', 'white');
            privateInput.css('background-color', '');
        }, {
            'min-height': '0px',
            'width': '48%',
            'height':'35px'
        });
        publicInput.attr('class', 'settingButton');
        if (privateState) {
            privateInput.css('background-color', 'white');
        } else {
            publicInput.css('background-color', 'white');
        }
        
        TAG.Telemetry.register(privateInput, "click", "Publish", function (tobj) {
            tobj.toggle_state = privateInput.privateState;
            tobj.element_type = "collections";
        });

        TAG.Telemetry.register(publicInput, "click", "Publish", function (tobj) {
            tobj.toggle_state = privateInput.privateState;
            tobj.element_type = "collections";
        });

        /*var pubPrivDiv = $(document.createElement('div'));
        pubPrivDiv.append(privateInput).append(publicInput);*/

        // local visibility
        var localVisibility = LADS.Util.localVisibility(exhibition.Identifier);
        var invisibilityInput = createButton('Hide on This Machine', function () {
            //if (localVisibility) { changesHaveBeenMade = true; };
            localVisibility = false;
            invisibilityInput.css('background-color', 'white');
            visibilityInput.css('background-color', '');
        }, {
            'min-height': '0px',
            'margin-right': '4%',
            'width': '48%',
            'height':'35px'
        });
        TAG.Telemetry.register(invisibilityInput, "click", "Visibility", function (tobj) {
            tobj.toggle_state = "Hide";
            tobj.collection_id = exhibition.Identifier;
        });
        var visibilityInput = createButton('Show on This Machine', function () {
            //if (!localVisibility) { changesHaveBeenMade = true; };
            localVisibility = true;
            visibilityInput.css('background-color', 'white');
            invisibilityInput.css('background-color', '');
        }, {
            'min-height': '0px',
            'width': '48%',
            'height': '35px'
        });

        TAG.Telemetry.register(visibilityInput, "click", "Visibility", function (tobj) {
            tobj.toggle_state = "Show";
            tobj.collection_id = exhibition.Identifier;
        });
        if (localVisibility) {
            visibilityInput.css('background-color', 'white');
        } else {
            invisibilityInput.css('background-color', 'white');
        }
        /*var visDiv = $(document.createElement('div'));
        visDiv.append(invisibilityInput).append(visibilityInput);*/

        //TO-DO: add in on server side from TAG.Worktop.Database.js changeExhibition() 
        var assocMediaShown;
        if (exhibition.Metadata.AssocMediaView === "true" || exhibition.Metadata.AssocMediaView === "false") {
            exhibition.Metadata.AssocMediaView === "true" ? assocMediaShown = true: assocMediaShown = false;
        } else {
            //backwards compatibility
            assocMediaShown = false;
        }
        var showAssocMedia = createButton('Show', function () {
            //(!assocMediaShown) && function () { changesHaveBeenMade = true; }();
            assocMediaShown = true;
            showAssocMedia.css({'background-color':'white'});
            hideAssocMedia.css({'background-color':''});
            $('#toggleRow').css('display','block');
        }, {
            'min-height': '0px',
            'margin-right': '4%',
            'width': '48%',
            'height':'35px'
        });
        showAssocMedia.attr('class','settingButton');
        var hideAssocMedia = createButton('Hide', function () {
            //(assocMediaShown) && function () { changesHaveBeenMade = true; }();
            assocMediaShown = false;
            hideAssocMedia.css('background-color','white');
            showAssocMedia.css('background-color','');
            $('#toggleRow').css('display','none');
            }, {
            'min-height': '0px',
            'width': '48%',
             'height': '35px'
        });
        hideAssocMedia.attr('class','settingButton');
        if (assocMediaShown){
            showAssocMedia.css('background-color','white');
        }else{
            hideAssocMedia.css('background-color','white');
        }
        /*var timelineOptionsDiv = $(document.createElement('div'));
        timelineOptionsDiv.append(showTimeline).append(hideTimeline);*/

        
        if (exhibition.Metadata.Timeline === "true" || exhibition.Metadata.Timeline === "false") {
            exhibition.Metadata.Timeline === "true" ? timelineShown = true: timelineShown = false;
        } else {
            //backwards compatibility
            timelineShown = true;
        }
        // use #toggleRow
        /*
        $('#toggleRow').css({
            'display': 'none',
            'min-height': '0px',
            'width': '48%',
             'height': '35px'
        });
        */
        var showTimeline = createButton('Show', function () {
            //(!timelineShown) && function () { changesHaveBeenMade = true; }();
            timelineShown = true;
            showTimeline.css('background-color', 'white');
            hideTimeline.css('background-color','');
            if ($('#timelineArea').children().length > 0) {
                $('#timelineArea').css('display', 'block');
                $('#bottomContainer').css({
                    'height': '69%',
                    'top': '25%'
                });
            }
            //$('#dateButton') &&
            //$('#yearButton') &&
        }, {
            'min-height': '0px',
            'margin-right': '4%',
            'width':'48%',
            'padding-left': '10px',
            'padding-right': '10px',
            'height': '35px'
        });
        showTimeline.attr("id","showTimelineBttn");
        showTimeline.attr('class','settingButton');
        var hideTimeline = createButton('Hide', function () {
            //(timelineShown) && function () { changesHaveBeenMade = true; }();
            timelineShown = false;
            hideTimeline.css('background-color','white');
            showTimeline.css('background-color','');
            $('#timelineArea').css('display','none');
            $('#bottomContainer').css({
                'height': '85%',
                'top':'15%'
               });
            //$('#dateButton') &&
            //$('#yearButton') &&
            }, {
                'min-height': '0px',
                'width': '48%',
                'height': '35px'
            });

        hideTimeline.attr("id","hideTimelineBttn");
        hideTimeline.attr('class','settingButton');
        if (timelineShown){
            showTimeline.css('background-color','white');
        }else{
            hideTimeline.css('background-color','white');
        }



        var privateSetting;
        var localVisibilitySetting;
        var name;
        var desc;
        var bg;
        var sortDropDown = null;
        var idLabel;
        var timeline;
        var nameInput;
        var descInput;
        var bgInput;
        var assocMedia;
        var sortOptions = null;
        var curSortOptions = JSON.parse(exhibition.Metadata.SortOptions || "{}" );
        var key;
        sortOptionsObj = {};
        if (curSortOptions.Title === false) {
            sortOptionsObj.Title = false;
        } else {
            sortOptionsObj.Title = true;
        }
        if (curSortOptions.Date === false) {
            sortOptionsObj.Date = false;
        } else {
            sortOptionsObj.Date = true;
        }
        if (curSortOptions.Artist === false) {
            sortOptionsObj.Artist = false;
        } else {
            sortOptionsObj.Artist = true;
        }


        TAG.Worktop.Database.getArtworksIn(exhibition.Identifier, function (artworks) {
            if (cancelView) return;
            for (var i = 0; i < artworks.length; i++) {
                if (artworks[i].Extension === "tour" || (artworks[i].Type === "Empty" && artworks[i].Metadata.ContentType !== "Artwork" && artworks[i].Metadata.Type !== "Image" && artworks[i].Metadata.ContentType !== "VideoArtwork" && artworks[i].Metadata.ContentType !== "iframe")) {
                    sortOptionsObj["Tours"] = curSortOptions["Tours"] || false;
                } else {
                    var infoFields = artworks[i].Metadata.InfoFields;
                    for (key in infoFields) {
                        var val = curSortOptions[key];
                        if (val===null) {
                            sortOptionsObj[key] = false;
                        } else {
                            sortOptionsObj[key] = val;
                        }
                    }
                }
            }
            if (sortOptionsObj && sortOptionsObj != {}) {
                sortDropDown = createSortOptions(sortOptionsObj);
            }
            createCollectionSettings();
        }, authError, conflict(exhibition, "Update", loadExhibitionsView), error(loadExhibitionsView));

        var createCollectionSettings = function createCollectionSettings() {
            if (cancelView) return;
            prepareViewer(true);
            clearRight();
            // Set the viewer to exhibition view (see function below)
            exhibitionView(exhibition);
            var pubPrivDiv = $(document.createElement('div'));
            pubPrivDiv.append(privateInput).append(publicInput);
            privateInput.click(function () {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            });

            publicInput.click(function () {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            });

            var visDiv = $(document.createElement('div'));
            visDiv.append(invisibilityInput).append(visibilityInput);

            invisibilityInput.click(function () {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            });

            visibilityInput.click(function () {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            });

            var timelineOptionsDiv = $(document.createElement('div'));
            timelineOptionsDiv.append(showTimeline).append(hideTimeline);

            showTimeline.click(function () {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            });

            hideTimeline.click(function () {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            });

            var assocMediaOptionsDiv = $(document.createElement('div'));
            assocMediaOptionsDiv.append(showAssocMedia).append(hideAssocMedia);

            showAssocMedia.click(function () {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            });

            hideAssocMedia.click(function () {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            });

            nameInput = createTextInput(TAG.Util.htmlEntityDecode(exhibition.Name), 'Title', 40);
            descInput = createTextAreaInput(TAG.Util.htmlEntityDecode(exhibition.Metadata.Description), false, 2000);
            bgInput = createButton('Select...', function () {
                //changesHaveBeenMade = true;    
                console.log("collection bg");

                //experimentation for background issue
                /**
                TAG.Util.UI.createAssociationPicker(root, "Choose Background Image",
                { comp: exhibition, type: 'exhib' },
                'bg', [{
                        name: 'All Artworks',
                        getObjs: TAG.Worktop.Database.getArtworks, //to-do only want image artworks, not videos
                    }, {
                    name: 'Artworks in this Collection',
                    getObjs: TAG.Worktop.Database.getArtworksIn,
                    args: [exhibition.Identifier]
                }], {
                    args: exhibition.Metadata.BackgroundImage //needs to be guid if artwork in collection, url if imported separately
                }, function () {
                    prepareNextView(true, "New", createExhibition);
                    clearRight();
                    prepareViewer(true);
                    loadExhibitionsView(exhibition.Identifier);
                });
                **/

                uploadFile(TAG.Authoring.FileUploadTypes.Standard, function (urls) {
                    changesMade = true;
                    saveButton.prop("disabled", false);
                    saveButton.css("opacity", 1);
                    var url = urls[0];
                    bgInput.val(url);
                    $('#bgimage').css({
                        'background-image': 'url("' + TAG.Worktop.Database.fixPath(url) + '")',
                        'background-size': 'cover',
                    });
                });
            });

            nameInput.focus(function () {
                if (nameInput.val() === 'Collection')
                    nameInput.select();
            });
            nameInput.keyup(function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (event.which === 13) {                   
                    saveButton.click();
                } else {
                    changesMade = true;
                    saveButton.prop("disabled", false);
                    saveButton.css("opacity", 1);
                }
                $('.collection-title').text(nameInput.val());
                
            });
            descInput.focus(function () {
                if (descInput.val() === 'Description')
                    descInput.select();
            });
            descInput.keyup(function () {
                $("#collectionDescription").text(descInput.val());
                var infoDiv = $("#infoDiv"),
                    titleDiv = $("#tileDiv");
                if (descInput.val() === "") {
                    infoDiv.css("width", "0%");
                    titleDiv.css({ 'margin-left': '2%' });
                } else {
                    infoDiv.css("width", "25%");
                    titleDiv.css({ 'margin-left': '0%' });
                }
                titleDiv.css({ 'left': infoDiv.width() });
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            });
            // Handle Changes
            onChangeUpdateText(nameInput, '#exhibition-title', 40);
            onChangeUpdateText(descInput, '#description-text', 1790);

            localVisibilitySetting = createSetting('Visibility on Machine', visDiv);
            privateSetting = createSetting('Publish Setting', pubPrivDiv);
            name = createSetting('Title', nameInput);
            desc = createSetting('Description', descInput);
            bg = createSetting('Background Image', bgInput);
            timeline = createSetting('Timeline Setting', timelineOptionsDiv);
            assocMedia = createSetting('Associated Media Timeline Setting', assocMediaOptionsDiv);

            if (sortDropDown) {
                sortOptions = createSetting('Sort Options', sortDropDown);
                sortDropDown.click(function () {
                    changesMade = true;
                    saveButton.prop("disabled", false);
                    saveButton.css("opacity", 1);
                });
            }

            //$('.settingsViewTextarea').css({
            //    'resize': 'vertical',
            //    'height':'60px'
            //});

            settingsContainer.append(privateSetting);
            settingsContainer.append(localVisibilitySetting);
            settingsContainer.append(name);
            settingsContainer.append(desc);
            settingsContainer.append(bg);
            settingsContainer.append(timeline);
            settingsContainer.append(assocMedia);
            if (sortOptions) {
                settingsContainer.append(sortOptions);
            }

            //Automatically save changes
            //currentMetadataHandler = function () {
            //    if (nameInput.val() === undefined || nameInput.val() === "") {
            //        nameInput.val("Untitled Collection");
            //    }
            //    LADS.Util.localVisibility(exhibition.Identifier, { visible: localVisibility });
            //    saveExhibition(exhibition, {
            //        privateInput: privateState,
            //        nameInput: nameInput,
            //        descInput: descInput,
            //        bgInput: bgInput,
            //        sortOptions: sortDropDown,
            //        timelineInput: timelineShown
            //    });
            //};

            // Buttons
            var saveButton = createButton('Save', function () {
                if (nameInput.val() === undefined || nameInput.val() === "") {
                    nameInput.val("Untitled Collection");
                }
                LADS.Util.localVisibility(exhibition.Identifier, { visible: localVisibility });
                saveExhibition(exhibition, {
                    privateInput: privateState,  //default set unpublished
                    nameInput: nameInput,        //Collection name
                    descInput: descInput,        //Collection description
                    bgInput: bgInput,            //Collection background image
                    sortOptions: sortDropDown,
                    timelineInput: timelineShown,
                    assocMediaInput: assocMediaShown
                });
            }, {
                'margin-right': '3%',
                'margin-top': '1%',
                'margin-bottom': '1%',
                'margin-left': '.5%',
                'float': 'right',
            }, true);

            var deleteButton = createButton('Delete', function () {
                deleteExhibitionSingle(exhibition);
            }, {
                'margin-left': '2%',
                'margin-top': '1%',
                'margin-right': '0',
                'margin-bottom': '3%',
            });

            //deleteBlankButton.show();

            if(IS_WINDOWS){
                $('#setViewDeleteButton').css('display','block');
                deleteBlankButton.unbind('click').click(function(){ deleteExhibition(multiSelected)});
                deleteBlankButton.text('Delete');
            } else{

            }

            TAG.Telemetry.register(saveButton, "click", "SaveButton", function (tobj) {
                tobj.element_type = "Collections";
            });
            var catalogNext = true;
            // Creates the button to toggle between views
            var switchViewButton = createButton('Preview Catalog', function () {
                viewer.empty();
                if (catalogNext) {
                    // If there is no art the program crashes when entering catalog mode
                    // Show a message and return if thats the case (would prefer not having
                    // to request all the artwork)
                    LADS.Worktop.Database.getArtworksIn(exhibition.Identifier, function (artworks) {
                        if (cancelView) return;
                        if (!artworks || !artworks[0]) {
                            var messageBox = LADS.Util.UI.popUpMessage(null, "Cannot view in catalog mode because there is no artwork in this exhibit.", null, true);
                            root.append(messageBox);
                            $(messageBox).show();
                            exhibitionView();
                        } else {
                            switchViewButton.text('Preview Collection');
                            catalogView();
                            catalogNext = !catalogNext;
                        }
                    });

                    return;
                } else {
                    switchViewButton.text('Preview Catalog');
                    exhibitionView();
                }
                catalogNext = !catalogNext;
            }, {
                'margin-left': '2%',
                'margin-top': '1%',
                'margin-right': '0%',
                'margin-bottom': '3%',
            });
            
            function importAndRefresh(){
                //finalizeAssociations from TAG.Util.js
                createArtwork(true);
                //makeManagePopUp();
            }

            function makeManagePopUp(){
                console.log("Made Manage Pop Up");
                TAG.Util.UI.createAssociationPicker(root, "Add and Remove Artworks in this Collection",
                    { comp: exhibition, type: 'exhib' },
                    'exhib', [{
                        name: 'All Artworks',
                        getObjs: TAG.Worktop.Database.getArtworksAndTours,
                    }, {
                        name: 'Artworks in this Collection',
                        getObjs: TAG.Worktop.Database.getArtworksIn,
                        args: [exhibition.Identifier]
                    }], {
                        getObjs: TAG.Worktop.Database.getArtworksIn,
                        args: [exhibition.Identifier]
                    }, function () {
                        prepareNextView(true, "New", createExhibition);
                        clearRight();
                        prepareViewer(true);
                        loadExhibitionsView(exhibition.Identifier);
                    }, importAndRefresh);

            }

            var artPickerButton = createButton('Add/Remove Artworks', makeManagePopUp/*function () {
                TAG.Util.UI.createAssociationPicker(root, "Add and Remove Artworks in this Collection",
                    { comp: exhibition, type: 'exhib' },
                    'exhib', [{
                        name: 'All Artworks',
                        getObjs: TAG.Worktop.Database.getArtworksAndTours,
                    }, {
                        name: 'Artworks in this Collection',
                        getObjs: TAG.Worktop.Database.getArtworksIn,
                        args: [exhibition.Identifier]
                    }], {
                        getObjs: TAG.Worktop.Database.getArtworksIn,
                        args: [exhibition.Identifier]
                    }, function () {
                        prepareNextView(true, "New", createExhibition);
                        clearRight();
                        prepareViewer(true);
                        loadExhibitionsView(exhibition.Identifier);
                    }, importAndRefresh);

            }*/, {
                'margin-left': '2%',
                'margin-top': '1%',
                'margin-right': '0%',
                'margin-bottom': '3%',
            });
            
            TAG.Telemetry.register(artPickerButton, "click", "EditorButton", function (tobj) {
                tobj.edit_type = "Manage Collection";
                tobj.element_id = exhibition.Identifier;
            });

            TAG.Telemetry.register(deleteButton, "click", "DeleteButton", function (tobj) {
                tobj.element_type = "Collections";
            })

            artPickerButton.on("mousedown", function () {
                artPickerButton.css({ "background-color": "white"});
            });

            leftButton = artPickerButton;



            saveButton.on("mousedown", function () {
                if (!saveButton.attr("disabled")) {
                    saveButton.css({ "background-color": "white" });
                }
            });
            artPickerButton.on("mousedown", function () {
                artPickerButton.css({ "background-color": "white" });
            });
            deleteButton.on("mousedown", function () {
                deleteButton.css({ "background-color": "white" });
            });
            saveButton.on("mouseleave", function () {
                if (!saveButton.attr("disabled")) {
                    saveButton.css({ "background-color": "transparent" });
                }
            });
            artPickerButton.on("mouseleave", function () {
                artPickerButton.css({ "background-color": "transparent" });
            });
            deleteButton.on("mouseleave", function () {
                deleteButton.css({ "background-color": "transparent" });
            });
            newButton.on("mouseleave", function () {
                newButton.css({ "background-color": "transparent" });
            });
            

          

            // Sets the viewer to catalog view
            function catalogView() {
                rightQueue.add(function () {
                    if (cancelView) return;
                    var catalog;
                    if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.exhib.text]) {
                        return;
                    }
                    LADS.Layout.Catalog(exhibition, null, function (catalog) {
                        viewer.append(catalog.getRoot());
                        catalog.loadInteraction();
                        preventClickthrough(viewer);

                    });
                });
            }

            /**Helper method to set the viewer to exhibition view
             * @method exhibitionView
             * @param {Object} exhibition    exhibition to load
             */
            function exhibitionView(exhibition) {
                rightQueue.add(function () {
                    if (cancelView) return;
                    var options = {
                        backCollection: exhibition,
                        previewing: true
                    };
                    var exhibView = new TAG.Layout.CollectionsPage(options);
                    var exroot = exhibView.getRoot();
                    $(exroot).css('z-index', '-1'); // otherwise, you can use the search box and sorting tabs!
                    viewer.append(exroot);
                    preventClickthrough(viewer);
                });
            }

            

            buttonContainer.append(artPickerButton).append(saveButton); //REAPPEND DELETE BUTTON HERE
            if(!IS_WINDOWS){
                buttonContainer.append(deleteButton);
            }
        }
        cancelLastView = function () {
            cancelView = true;
        };
    }

    /**Create an exhibition
     * @method createExhibition
     */
    function createExhibition() {
        prepareNextView(false);
        clearRight();
        prepareViewer(true);

        TAG.Worktop.Database.createExhibition(null, function (newDoq) {
            if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.exhib.text]) {
                return;
            }
            if (!newDoq) { // Shouldn't happen!
                // TODO: Error Message
                loadExhibitionsView();
                return;
            }
            loadExhibitionsView(newDoq.Identifier);
        }, authError, error(loadExhibitionsView), true);
    }

    /** Save a collection
     * @method saveExhibition
     * @param {Object} exhibition   collection to save
     * @inputs {Object} inputs      keys from input fields
     */
    function saveExhibition(exhibition, inputs) {
        //pCL = displayLoadingSettings();
        //prepareNextView(false, null, null, "Saving...");
        clearRight();
        prepareViewer(true);
        prepareNextView(false, null, null, "Saving...");

        //To-Do add in encoding here:
        var name = inputs.nameInput.val();
        var desc = inputs.descInput.val();
        var bg = inputs.bgInput.val();
        var priv = inputs.privateInput;
        var timeline = inputs.timelineInput;
        var assocMedia = inputs.assocMediaInput;

        /*var sortOptionChanges = {};
        if (inputs.sortOptions) {
            for (var i = 0; i < inputs.sortOptions[0].children.length; i++) {
                var option = $(inputs.sortOptions[0].children[i]);
                var setSort = option.attr("setSort");
                if (i > 2) {
                    if (option.text() === "Tour" && i == 3) {
                        sortOptionChanges[option.text()] = setSort;
                    } else {
                        sortOptionChanges["?" + option.text()] = setSort;
                    }
                } else {
                    sortOptionChanges[option.text()] = setSort;
                }
            }
        }*/
        var options = {
            Name: name,
            Private: priv,
            Description: desc,
            SortOptions: JSON.stringify(sortOptionsObj),
            Timeline: timeline,
            AssocMediaView: assocMedia
        }

        if (bg){
            options.Background = bg;
        }

        TAG.Worktop.Database.changeExhibition(exhibition.Identifier, options, function () {
            //refreshExhibition(exhibition);
            //collectionsIsLoading = false;
            //if (backButtonClicked && !(generalIsLoading || collectionsIsLoading ||
            //    artworksIsLoading || associatedMediaIsLoading || toursIsLoading)) { //don't continue if more sections are still loading - wait for them to finish
            //    backButtonClickHandler();
            //};
            //if (!backButtonClicked && (prevSelectedSetting && prevSelectedSetting === nav[NAV_TEXT.exhib.text])) {
            //    loadExhibitionsView(exhibition.Identifier); //eventually don't want this here? - reloads everything
            //};
            //hideLoading();
            //hideLoadingSettings(pCL);
            //saveArray.splice(saveArray.indexOf(exhibition.Identifier), 1); //removes identifier from save array
            if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.exhib.text]) {
                LADS.Worktop.Database.getExhibitions();
                return;
            }
            if (prevSelectedSetting && prevSelectedSetting === nav[NAV_TEXT.exhib.text]) {
                loadExhibitionsView(exhibition.Identifier);
                return;
            }
        }, authError, conflict(exhibition, "Update", loadExhibitionsView), error(loadExhibitionsView));
    }

    /**Delete a collection
     * @method deleteExhibition
     * @param {Object} exhibition     collection to delete
     */
    function deleteExhibition(exhibitions) {

        var confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
            prepareNextView(false);
            clearRight();
            prepareViewer(true);

            // actually delete the exhibition
            TAG.Worktop.Database.batchDeleteDoq(exhibitions, function () {
                if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.exhib.text]) {
                    return;
                }
                loadExhibitionsView();
            }, authError, authError);
        }, "Are you sure you want to delete the selected collections?", "Delete", true, function() { $(confirmationBox).hide(); });
        root.append(confirmationBox);
        $(confirmationBox).show();
        TAG.Util.multiLineEllipsis($($($(confirmationBox).children()[0]).children()[0]));
    }

    //FOR THE WEB APP ONLY
    function deleteExhibitionSingle(exhibition) {

        var confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
            prepareNextView(false);
            clearRight();
            prepareViewer(true);

            // actually delete the exhibition
            TAG.Worktop.Database.deleteDoq(exhibition, function () {
                if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.exhib.text]) {
                    return;
                }
                loadExhibitionsView();
            }, authError, authError);
        }, "Are you sure you want to delete " + exhibition.Name + " ?", "Delete", true, function () { $(confirmationBox).hide(); });
        root.append(confirmationBox);
        $(confirmationBox).show();
        TAG.Util.multiLineEllipsis($($($(confirmationBox).children()[0]).children()[0]));
    }


    // Tour Functions:

    /**Load the tour view
     * @method loadTourView
     * @param {Object} id   id of middle label to start on
     */
    function loadTourView(id, matches) {
        

        inGeneralView = false;
        inCollectionsView = false;
        inArtworkView = false;
        inAssociatedView = false;
        inToursView = true;
        inFeedbackView = false;

        changesMade = false;

        var list;
        currentIndex = 0;

        prepareNextView(true, "New", createTour);
        clearRight();
        prepareViewer(true);
        var cancel = false;

        //if (generalIsLoading || collectionsIsLoading ||
        //        artworksIsLoading || associatedMediaIsLoading || toursIsLoading) {
        //    hideLoading();
        //    hideLoadingSettings(pCL);
        //};
        //generalProgressCircle && hideLoadingSettings(generalProgressCircle);
        //toursIsLoading && showLoading();
        //(saveArray.indexOf(previousIdentifier) < 0) && function () { hideLoading(); hideLoadingSettings(pCL); };

        if (prevLeftBarSelection.categoryName == null) {
            prevLeftBarSelection = {
                timeSpentTimer: new TelemetryTimer(),
                categoryName: "Tour",
                loadTime: 0
            };
        }

        var loadTimer = new TelemetryTimer();
        if (typeof matches !== "undefined") {
            list = matches;
            displayLabels();
        } else {
            // Make an async call to get tours
            TAG.Worktop.Database.getTours(function (result) {
                if (cancel) return;
                sortAZ(result);
                currentList = result;
                initSearch();
                list = result;
                displayLabels();

            });
        }

        function displayLabels() {
            $.each(list, function (i, val) {
                if (cancel) return false;
                // Add each label as a separate function to the queue so the UI doesn't lock up
                middleQueue.add(function () {
                    if (cancel) return;
                    if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.tour.text]) {
                        return;
                    }
                    var label;
                    if (!prevSelectedMiddleLabel &&
                        ((id && val.Identifier === id) || (!id && i === 0))) {
                        // Select the first one
                        middleLoading.before(selectLabel(label = createMiddleLabel(val.Name, null, function () {
                            previousIdentifier = val.Identifier;
                            loadTour(val);
                            currentIndex = i;
                        }, val.Identifier, false, function () {
                            editTour(val);
                        }), true));

                        // Scroll to the selected label if the user hasn't already scrolled somewhere
                        if (middleLabelContainer.scrollTop() === 0 && label.offset().top - middleLabelContainer.height() > 0) {
                            middleLabelContainer.animate({
                                scrollTop: (label.offset().top - middleLabelContainer.height() / 2)
                            }, 1000);
                        }

                        prevSelectedMiddleLabel = label;
                        currentSelected = prevSelectedMiddleLabel;
                        currentIndex = i;
                        loadTour(val);
                    } else {

                        middleLoading.before(label = createMiddleLabel(val.Name, null, function () {
                            //if (changesHaveBeenMade) {
                            //    //saveArray.push(previousIdentifier);
                            //    //currentMetadataHandler && saveQueue.add(currentMetadataHandler());
                            //    //changesHaveBeenMade = false;
                            //}
                            loadTour(val);
                            previousIdentifier = val.Identifier;
                            currentIndex = i;
                        }, val.Identifier, false, function () {
                            editTour(val);

                        }));
                        //prevSelectedMiddleLabel = label;
                        //currentSelected = prevSelectedMiddleLabel;
                    }

                });
            });
            // Hide the loading label when we're done
            middleQueue.add(function () {
                middleLoading.hide();
            });
            middleQueue.add(function () {
                prevLeftBarSelection.loadTime = loadTimer.get_elapsed();
            });
        }

        cancelLastSetting = function () { cancel = true; };
    }

    /**Load a tour to the right side
     * @method loadTour
     * @param {Object} tour     tour to load
     */
    function loadTour(tour) {
        //$(document).off();
        prepareViewer(true);
        clearRight();
        deleteType = deleteTour;
        toDelete = tour;

        currTour = tour;

        prevMiddleBarSelection = {
            type_representation: "Tour",
            time_spent_timer: new TelemetryTimer()
        };

        // Create an img element just to load the image
        var img = $(document.createElement('img'));
        img.attr('src', TAG.Worktop.Database.fixPath(tour.Metadata.Thumbnail));

        // Create a progress circle
        var progressCircCSS = {
            'position': 'absolute',
            'left': '30%',
            'top': '22%',
            'z-index': '50',
            'height': viewer.height() / 2 + 'px',
            'width': 'auto'
        };

        var circle = TAG.Util.showProgressCircle(viewer, progressCircCSS, '0px', '0px', false);
        var selectedLabel = prevSelectedMiddleLabel;
        img.load(function () {
            // If the selection has changed since we started loading return
            if (prevSelectedMiddleLabel && prevSelectedMiddleLabel.text() !== TAG.Util.htmlEntityDecode(tour.Name)) {
                TAG.Util.removeProgressCircle(circle);
                return;
            }
            TAG.Util.removeProgressCircle(circle);
            // Set the image as a background image, centered and contained
            viewer.css('background', 'black url(' + TAG.Worktop.Database.fixPath(tour.Metadata.Thumbnail) + ') no-repeat center / contain');
        });

        if (tour.Metadata.Thumbnail === "/Images/default.jpg") {
            TAG.Util.removeProgressCircle(circle);
        }
        // Create inputs
        // inputs
        var privateState;
        if (tour.Metadata.Private) {
            privateState = (/^true$/i).test(tour.Metadata.Private);
        } else {
            privateState = false;
        }
        var privateInput = createButton('Unpublish', function () {
            //(!privateState) && function () { changesHaveBeenMade = true;}();
            privateState = true;
            privateInput.css('background-color', 'white');
            publicInput.css('background-color', '');
        }, {
            //'min-height': '0px',
            'margin-right': '4%',
            'width': '48%',
            'height':'35px'
        });
        privateInput.attr('class', 'settingButton');
        
        privateInput.click(function () {
            changesMade = true;
            saveButton.prop("disabled", false);
            saveButton.css("opacity", 1);
        });

        var publicInput = createButton('Publish', function () {
            //(privateState) && function () { changesHaveBeenMade = true; }();
            privateState = false;
            publicInput.css('background-color', 'white');
            privateInput.css('background-color', '');
        }, {
            //'min-height': '0px',
            'width': '48%',
            'height':'35px'
        });

        publicInput.click(function () {
            changesMade = true;
            saveButton.prop("disabled", false);
            saveButton.css("opacity", 1);
        });

        TAG.Telemetry.register(privateInput, "click", "Publish", function (tobj) {
            tobj.toggle_state = privateInput.privateState;
            tobj.element_type = "tours";
        });

        TAG.Telemetry.register(publicInput, "click", "Publish", function (tobj) {
            tobj.toggle_state = publicInput.changesMade;
            tobj.element_type = "tours";
        });


        publicInput.attr('class','settingButton');
        if (privateState) {
            privateInput.css('background-color', 'white');
        } else {
            publicInput.css('background-color', 'white');
        }
        var pubPrivDiv = $(document.createElement('div'));
        pubPrivDiv.append(privateInput).append(publicInput);

        var nameInput = createTextInput(TAG.Util.htmlEntityDecode(tour.Name), "Tour Title", 120);
        var descInput = createTextAreaInput(TAG.Util.htmlEntityDecode(tour.Metadata.Description).replace(/\n/g,'<br />') || "", false, 2000);
        var tourIdInput = createTextInput(tour.Identifier, 'Tour ID (read-only)', 80, false, true);
        nameInput.focus(function () {
            if (nameInput.val() === 'Untitled Tour')
                nameInput.select();
        });
        descInput.focus(function () {
            if (descInput.val() === 'Tour Description')
                descInput.select();
        });

        // on change behavior
        onChangeUpdateText(descInput, null, 1500); // What should max length be?
        onChangeUpdateText(nameInput, null, 1500);

        var privateSetting = createSetting('Publish Setting', pubPrivDiv);
        var name = createSetting('Name', nameInput);
        var desc = createSetting('Description', descInput);
        var tourIdLabel = createSetting('ID (read-only)', tourIdInput);

        settingsContainer.append(privateSetting);
        settingsContainer.append(name);
        settingsContainer.append(desc);
        settingsContainer.append(tourIdLabel);

        nameInput.on('keyup', function (event) {
            if (event.which === 13) {
                saveButton.click();
            } else {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            }
        });

        descInput.on('keyup', function () {
            changesMade = true;
            saveButton.prop("disabled", false);
            saveButton.css("opacity", 1);
        });

        //Automatically save changes
        //currentMetadataHandler = function () {
        //    if (nameInput.val() === undefined || nameInput.val() === "") {
        //        nameInput.val("Untitled Tour");
        //    }
        //    saveTour(tour, {
        //        privateInput: privateState,
        //        nameInput: nameInput,
        //        descInput: descInput,
        //    });
        //};

        // Create buttons
        var editButton = createButton('Edit',
            function () { editTour(tour); },
            {
                'margin-left': '2%',
                'margin-top': '1%',
                'margin-right': '0%',
                'margin-bottom': '3%',
            });

        TAG.Telemetry.register(editButton, "click", "EditorButton", function (tobj) {
            tobj.edit_type = "Edit Tour";
            tobj.element_id = tour.Identifier;
        });

        var deleteButton = createButton('Delete',
            function () { deleteTour(multiSelected); },
            {
                'margin-left': '2%',
                'margin-top': '1%',
                'margin-right': '0%',
                'margin-bottom': '3%',
            });
        var duplicateButton = createButton('Duplicate',
            function () {
                duplicateTour(tour, {
                    privateInput: privateState,
                    nameInput: nameInput,
                    descInput: descInput,
                });
            },
            {
                'margin-left': '2%',
                'margin-top': '1%',
                'margin-right': '0%',
                'margin-bottom': '3%',
            });

         if(IS_WINDOWS){
                $('#setViewDeleteButton').css('display','block');
                deleteBlankButton.unbind('click').click(function(){ deleteTour(multiSelected)});
                deleteBlankButton.text('Delete');
        }
    

        TAG.Telemetry.register(duplicateButton, "click", "DuplicateTour", function (tobj) {
            //nothing to record
        });
        var saveButton = createButton('Save',
            function () {
                if (nameInput.val() === undefined || nameInput.val() === "") {
                    nameInput.val("Untitled Tour");
                }
                saveTour(tour, {
                    privateInput: privateState,
                    nameInput: nameInput,
                    descInput: descInput,
                });
            }, {
                'margin-right': '3%',
                'margin-top': '1%',
                'margin-bottom': '1%',
                'margin-left': '.5%',
                'float': 'right'
            }, true);
        TAG.Telemetry.register(saveButton, "click", "SaveButton", function (tobj) {
            tobj.element_type = "Tour";
        });
        buttonContainer.append(editButton).append(duplicateButton).append(saveButton);
        if(!IS_WINDOWS){
            buttonContainer.append(deleteButton);
        }

        saveButton.on("mousedown", function () {
            if (!saveButton.attr("disabled")) {
                saveButton.css({ "background-color": "white" });
            }
        });
        duplicateButton.on("mousedown", function () {
            duplicateButton.css({ "background-color": "white" });
        });
        deleteButton.on("mousedown", function () {
            deleteButton.css({ "background-color": "white" });
        });
        editButton.on("mousedown", function () {
            editButton.css({ "background-color": "white" });
        });
        saveButton.on("mouseleave", function () {
            if (!saveButton.attr("disabled")) {
                saveButton.css({ "background-color": "transparent" });
            }
        });
        duplicateButton.on("mouseleave", function () {
            duplicateButton.css({ "background-color": "transparent" });
        });
        TAG.Telemetry.register(deleteButton,"click","DeleteButton",function(tobj){
            tobj.element_type= "Tour";
        });
        deleteButton.on("mouseleave", function () {
            deleteButton.css({ "background-color": "transparent" });
        });
        editButton.on("mouseleave", function () {
            editButton.css({ "background-color": "transparent" });
        });
        newButton.on("mouseleave", function () {
            newButton.css({ "background-color": "transparent" });
        });
        

    }

    /** Create a tour
     * @method createTour
     */
    function createTour() {
        prepareNextView(false);
        clearRight();
        prepareViewer(true);

        TAG.Worktop.Database.createTour(null, function (newDoq) {
            if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.tour.text]) {
                return;
            }
            if (!newDoq) {
                // TODO: ERROR
                loadTourView();
                return;
            }
            loadTourView(newDoq.Identifier);
        }, authError, error(loadTourView), true);
    }

    /**Edit a tour
     * @method editTour
     * @param {Object} tour     tour to edit
     */
    function editTour(tour) {
        if (!tour) {
            return;
        }
        TAG.Telemetry.recordEvent("LeftBarSelection", function (tobj) {
            tobj.category_name = prevLeftBarSelection.categoryName;
            tobj.middle_bar_load_count = prevLeftBarSelection.loadTime;
            tobj.time_spent = prevLeftBarSelection.timeSpentTimer.get_elapsed();
        });

        TAG.Telemetry.recordEvent("MiddleBarSelection", function (tobj) {
            tobj.type_representation = prevMiddleBarSelection.type_representation;
            tobj.time_spent = prevMiddleBarSelection.time_spent_timer.get_elapsed();
        });

        var timer = new TelemetryTimer();
        // Overlay doesn't spin... not sure how to fix without redoing tour authoring to be more async
        loadingOverlay('Loading Tour...', 1);
        middleQueue.clear();
        rightQueue.clear();
        setTimeout(function () {
            var toureditor = new TAG.Layout.TourAuthoringNew(tour, function () {
                TAG.Util.UI.slidePageLeft(toureditor.getRoot(), function () {
                    TAG.Telemetry.recordEvent("PageLoadTime", function (tobj) {
                        tobj.source_page = "settings_view";
                        tobj.destination_page = "tour_authoring";
                        tobj.load_time = timer.get_elapsed();
                        tobj.identifier = tour.Identifier;
                        //console.log("tour editor load time: " + tobj.load_time);
                    });
                    SPENT_TIMER.restart();
                });
            });
        }, 1);
    }

    /**Delete a tour
     * @method deleteTour
     * @param {Object} tour     tour to delete
     */
    function deleteTour(tours) {
        var confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
            prepareNextView(false);
            clearRight();
            prepareViewer(true);

            // actually delete the tour
            TAG.Worktop.Database.batchDeleteDoq(tours, function () {
                if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.tour.text]) {
                    return;
                }
                loadTourView();
            }, authError, authError);
        }, "Are you sure you want to delete the selected tours?", "Delete", true, function () { 
            $(confirmationBox).hide(); 
        });
        root.append(confirmationBox);
        $(confirmationBox).show();
        TAG.Util.multiLineEllipsis($($($(confirmationBox).children()[0]).children()[0]));
    }

    /**Duplicate a tour
     * @method duplicateTour
     * @param {Object} tour     tour to duplicate
     * @param {Object} inputs   keys for name, description, and privateInput of tour
     */
    function duplicateTour(tour, inputs) {
        prepareNextView(false);
        clearRight();
        prepareViewer(true);
        var options = {
            Name: "Copy: " + tour.Name,
            Description: tour.Metadata.Description,
            Content: tour.Metadata.Content,
            Thumbnail: tour.Metadata.Thumbnail,
            Private: "true", // always want to create duplicates as unpublished
        };

        TAG.Worktop.Database.createTour(options, function (tewer) {
            console.log("success");
            if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.tour.text]) {
                return;
            }
            loadTourView(tewer.Identifier);
        }, function () {
            console.log("error");
        }, function () {
            console.log("cacheError");
        });
    }

    /**Save a tour
     * @method saveTour
     * @param {Object} tour     tour to save
     * @param {Object} inputs   keys for name, description, and privateInput of tour
     */
    function saveTour(tour, inputs) {
        //pCL = displayLoadingSettings();
        var name = inputs.nameInput.val();
        var desc = inputs.descInput.val();

        if (name.indexOf(' ') === 0) {
            var messageBox = TAG.Util.UI.popUpMessage(null, "Tour Name cannot start with a space.", null, true);
            $(root).append(messageBox);
            $(messageBox).show();
            return;
        }

        prepareNextView(false, null, null, "Saving...");
        clearRight();
        prepareViewer(true);

        TAG.Worktop.Database.changeTour(tour.Identifier, {
            Name: name,
            Description: desc,
            Private: inputs.privateInput,
        }, function () {
            //refreshTour(tour);
            //toursIsLoading = false;
            //if (backButtonClicked && !(generalIsLoading || collectionsIsLoading ||
            //    artworksIsLoading || associatedMediaIsLoading || toursIsLoading)) { //don't continue if more sections are still loading - wait for them to finish
            //    backButtonClickHandler();
            //};
            //if (!backButtonClicked && (prevSelectedSetting && prevSelectedSetting === nav[NAV_TEXT.tour.text])) {
            //    loadTourView(previousIdentifier); //eventually don't want this here? - reloads everything
            //};
            //hideLoading();
            //hideLoadingSettings(pCL);
            //saveArray.splice(saveArray.indexOf(tour.Identifier), 1); //removes identifier from save array
            if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.tour.text]) {
                LADS.Worktop.Database.getTours();
                return;
            }
            if (prevSelectedSetting && prevSelectedSetting === nav[NAV_TEXT.tour.text]) {
                loadTourView(previousIdentifier);
                return;
            }
        }, authError, conflict(tour, "Update", loadTourView), error(loadTourView));
    }

    // Associated Media functions:

    /**Load Associated Media view
     * @method load AssocMediaView
     * @param {Object} id   id of middle label to start on
     */
    function loadAssocMediaView(id, matches) {

        console.log(sortByAssoc);

        //$(document).off();
        inGeneralView = false;
        inCollectionsView = false;
        inArtworkView = false;
        inAssociatedView = true;
        inToursView = false;
        inFeedbackView = false;

        changesMade = false;

        var list;
        //var sortBy = "Title";
        currentIndex = 0;
        menuLabel.on("mouseleave", function () {
            menuLabel.css({"background-color": "transparent"});
        });
        if (showDropdown) {
            menuLabel.click();
        }

        collectionSort.css('display','none');

        findContainer.css('width','100%');

        prepareNextView(true, "Add", createAsset);
        prepareViewer(true);
        clearRight();
        var cancel = false;

        //if (generalIsLoading || collectionsIsLoading ||
        //  artworksIsLoading || associatedMediaIsLoading || toursIsLoading) {
        //    hideLoading();
        //    hideLoadingSettings(pCL);
        //};
        //generalProgressCircle && hideLoadingSettings(generalProgressCircle);
        //associatedMediaIsLoading && showLoading();
        //(saveArray.indexOf(previousIdentifier) < 0) && function () { hideLoading(); hideLoadingSettings(pCL); };
        if (prevLeftBarSelection.categoryName == null) {
            prevLeftBarSelection = {
                timeSpentTimer: new TelemetryTimer(),
                categoryName: "Associated Media",
                loadTime: 0
            };
        }
        var loadTimer = new TelemetryTimer();
        if (typeof matches !== "undefined") {       //If there are no search results to display
            list = matches;
            if (list.length>0){
                list.unshift("Search Results:")
            } else {
                list.push("No search results");
            }
            displayLabels();
        } else {
            // Make an async call to get artworks and then display
            TAG.Worktop.Database.getAssocMedia(function (result) {
                if (cancel) return;
                sortAZ(result);
                currentList = result;
                artworkList = result;
                initSearch();
                list = result;
                sortLabels();
            });
        }

        if (sortByAssoc == "Title"){
            titleSort.css('background-color','white');
            collectionSort.css('background-color','initial');
            addedRecentlySort.css('background-color','initial');
        } else if (sortByAssoc == "Collection"){
            titleSort.css('background-color','initial');
            collectionSort.css('background-color','white');
            addedRecentlySort.css('background-color','initial');
        } else if (sorByAssoc == "Recently Added"){
            titleSort.css('background-color','initial');
            collectionSort.css('background-color','initial');
            addedRecentlySort.css('background-color','white');
        }
        

        function sortLabels(){
            if (sortByAssoc == "Title"){
                console.log("sort by title");
                sortAZ(list);
                displayLabels();
            } 
            else if (sortByAssoc == "Recently Added"){
                //create sort list for added before and other
                console.log("sort by recently added")
                sortAZ(list);
                var afterList = [];
                var beforeList = [];
                for (var sb = 0, len = list.length; sb < len; sb++){
                    var artDate = new Date(list[sb].Metadata.__Created);
                    var now = new Date();
                    var compareDate = new Date(now.getFullYear(), now.getMonth(),now.getDate()-7);
                    if (artDate.getTime() > compareDate.getTime()){
                        afterList.push(list[sb]);
                    } else{
                        beforeList.push(list[sb]);
                    }
                }
                list = [];
                list.push("Recently Added");
                list = list.concat(afterList);
                list.push("Older");
                list = list.concat(beforeList);
                displayLabels();
            }

        }



        function displayLabels() {
            if (list[0]) {
                $.each(list, function (i, val) {
                    if (cancel) return;
                    if (val && val.Metadata){
                    // Add each label in a separate function in the queue so the UI doesn't lock up
                    middleQueue.add(function () {
                        if (cancel) return;
                        if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.media.text]) {
                            return;
                        }
                        var label;
                        var imagesrc;
                        switch (val.Metadata.ContentType.toLowerCase()) {
                            case 'video':
                                imagesrc = (val.Metadata.Thumbnail && !val.Metadata.Thumbnail.match(/.mp4/)) ? TAG.Worktop.Database.fixPath(val.Metadata.Thumbnail) : tagPath + 'images/video_icon.svg';
                                break;
                            case 'audio':
                                imagesrc = tagPath + '/images/audio_icon.svg';
                                break;
                            case 'iframe':
                                imagesrc = tagPath + '/images/video_icon.svg'; // TODO iframe replace icon
                                break;
                            case 'image':
                                imagesrc = val.Metadata.Thumbnail ? TAG.Worktop.Database.fixPath(val.Metadata.Thumbnail) : tagPath + 'images/image_icon.svg';
                                break;
                            default:
                                imagesrc = null;
                                break;
                        }
                        if (!prevSelectedMiddleLabel &&
                            ((id && val.Identifier === id) || (!id && i === 0))) {
                            // Select the first one
                            middleLoading.before(selectLabel(label = createMiddleLabel(val.Name, imagesrc, function () {
                                //keep track of identifiers for autosaving
                                previousIdentifier = val.identifier;
                                loadAssocMedia(val);
                                currentIndex = i;
                            }, val.Identifier, false), true));

                            // Scroll to the selected label if the user hasn't already scrolled somewhere
                            if (middleLabelContainer.scrollTop() === 0 && label.offset().top - middleLabelContainer.height() > 0) {
                                middleLabelContainer.animate({
                                    scrollTop: (label.offset().top - middleLabelContainer.height() / 2)
                                }, 1000);
                            }

                            prevSelectedMiddleLabel = label;
                            currentSelected = prevSelectedMiddleLabel;
                            loadAssocMedia(val);
                        } else {
                            middleLoading.before(label = createMiddleLabel(val.Name, imagesrc, function () {
                                //if (changesHaveBeenMade) {
                                //    //saveArray.push(previousIdentifier);
                                //    //currentMetadataHandler && saveQueue.add(currentMetadataHandler());
                                //    //changesHaveBeenMade = false;
                                //}
                                loadAssocMedia(val);
                                previousIdentifier = val.Identifier;
                                currentIndex = i;
                            }, val.Identifier, false));
                        }
                    });
                    } else if (val){
                        middleQueue.add(function(){
                            console.log(val);
                            middleLoading.before(label = createSortLabel(val));
                        });
                    }
                });
                // Hide the loading label when we're done
                middleQueue.add(function () {
                    middleLoading.hide();
                });
            } else {
                middleLoading.hide();
            }
            middleQueue.add(function () {
                prevLeftBarSelection.loadTime = loadTimer.get_elapsed();
            });
        }

        cancelLastSetting = function () { cancel = true; };
    }
    
    var load = 0;

    /**Loads associated media to the right side
     * @method loadAssocMedia
     * @param {Object} media    associated media to load
     */
    function loadAssocMedia(media) {
        
        prepareViewer(true);
        clearRight();
        deleteType = deleteAssociatedMedia;
        toDelete = media;
        currDoq = media.Identifier;
        clearTimeout(checkConTimerId);
        // Create an img element to load the image
        var type = media.Metadata.ContentType.toLowerCase();
        var holder;
        var sourceExt;
        var source = (type === 'iframe') ? media.Metadata.Source : TAG.Worktop.Database.fixPath(media.Metadata.Source);

        prevMiddleBarSelection = {
            type_representation: "Assoc Media",
            time_spent_timer: new TelemetryTimer()
        };

        switch (type) {
            case "image":
                holder = $(document.createElement('img'));
                break;
            case "video":
                holder = $(document.createElement('video'));
                holder.attr('id', 'videoInPreview');
                holder.attr('poster', (media.Metadata.Thumbnail && !media.Metadata.Thumbnail.match(/.mp4/)) ? TAG.Worktop.Database.fixPath(media.Metadata.Thumbnail) : '');
                holder.attr('identifier', media.Identifier);
                holder.attr("preload", "none");
                holder.attr("controls", "");
                holder.css({ "width": "100%", "max-width": "100%", "max-height": "100%" });
                holder.attr("src", source);
                var source = TAG.Worktop.Database.fixPath(media.Metadata.Source);
                var sourceWithoutExtension = source.substring(0, source.lastIndexOf('.'));
                sourceExt = source.substring(source.lastIndexOf('.'));
                TAG.Worktop.Database.getConvertedVideoCheck(
                function (output) {
                    if (output ==="True" || sourceExt === ".mp4") {
                        holder.removeAttr('src');
                        var sourceMP4 = sourceWithoutExtension + ".mp4";
                        var sourceWEBM = sourceWithoutExtension + ".webm";
                        var sourceOGV = sourceWithoutExtension + ".ogv";

                        addSourceToVideo(holder, sourceMP4, 'video/mp4');
                        addSourceToVideo(holder, sourceWEBM, 'video/webm');
                        addSourceToVideo(holder, sourceOGV, 'video/ogv');
                        holder[0].onerror = TAG.Util.videoErrorHandler(holder, viewer);
                        //$(document.getElementsByClassName("convertVideoBtn")[0]).hide().data('disabled', true);
                        viewer.append(holder);
                        if (sourceExt === '.mp4') {
                            if (output === "False") {
                                var msg = "This video is being converted to compatible formats for different browsers";
                                checkConTimerId = setInterval(function () { checkConversion(media) }, 2000);
                                viewer.append(TAG.Util.createConversionLoading(msg, null, true));
                            } else if (output === "Error") {
                                var msg = "An error occured when converting this video. Please try to upload again";
                                viewer.append(TAG.Util.createConversionLoading(msg, true, true));
                            }
                        }
                    } else {
                        //convertBtn.show();
                        if (output === "False") {
                            //$(document.getElementsByClassName("convertVideoBtn")[0]).hide().data('disabled', true);
                            $("#videoErrorMsg").remove();
                            $("#leftLoading").remove();
                            var msg = "This video is being converted to compatible formats for different browsers";
                            viewer.append(TAG.Util.createConversionLoading(msg));
                            checkConTimerId = setInterval(function () { checkConversion(media) }, 2000);
                        } else if (output === "Error") {
                            $("#videoErrorMsg").remove();
                            $("#leftLoading").remove();
                            var msg = "An error occured when converting this video. Please try to upload again";
                            if (sourceExt === ".mp4") {
                                viewer.append(TAG.Util.createConversionLoading(msg, true, true));
                            } else {
                                viewer.append(TAG.Util.createConversionLoading(msg, true));
                            }
                        } else if(output ===null) {
                            TAG.Worktop.Database.convertVideo(function () {
                            }, null, source, sourceExt, sourceWithoutExtension, artwork.Identifier);
                        }
                        //holder.attr('src', source);
                    }
                }, null, media.Identifier);
                //if (conversionVideos.indexOf(media.Identifier) > -1) {
                //    var msg = "This video is being converted to compatible formats for different browsers";
                //    viewer.append(TAG.Util.createConversionLoading(msg));
                //} else {
                //    holder[0].onerror = TAG.Util.videoErrorHandler(holder, viewer, media.Metadata.Converted);
                //}
                break;
            case "audio":
                holder = $(document.createElement('audio'));
                holder.attr("preload", "none");
                holder.attr("controls", "");
                holder.css({ 'width': '80%' });
                fixVolumeBar(holder);
                break;
            case "iframe":
                holder = $(document.createElement('iframe'));
                holder.attr({
                    src: source + "?modestbranding=1&showinfo=0&fs=0",
                    frameborder: '0'
                });
                holder.css({
                    width: '100%',
                    height: '100%'
                });
                break;
            case "text":
            default:
                holder = $(document.createElement('div'));
                holder.css({
                    "font-size": "24px",
                    "top": "20%",
                    "width": "80%",
                    "text-align": "center",
                    "color": "white"
                });
                holder.html(media.Name + "<br /><br />" + media.Metadata.Description);
                holder.crossOrigin = "";
                break;
        }
        (source && type !== 'Text' && type!== "iframe") && holder.attr('src', source);

        // Create a progress circle
        var progressCircCSS = {
            'position': 'absolute',
            'left': '40%',
            'top': '40%',
            'z-index': '50',
            'height': 'auto',
            'width': '20%'
        };
        var circle = TAG.Util.showProgressCircle(viewer, progressCircCSS, '0px', '0px', false);
        var selectedLabel = prevSelectedMiddleLabel;

        switch (type) {
            case "image":
                holder.load(function () {
                    // If the selection has changed since we started loading then return
                    if (prevSelectedMiddleLabel && prevSelectedMiddleLabel.text() !== media.Name) {
                        TAG.Util.removeProgressCircle(circle);
                        return;
                    }
                    TAG.Util.removeProgressCircle(circle);
                    // Set the image as a background image
                    viewer.css('background', 'black url(' + source + ') no-repeat center / contain');
                });
                break;
            case "video":
                TAG.Util.removeProgressCircle(circle);
                viewer.css('background', 'black');
                //if(sourceExt===".mp4"){
                //    viewer.append(holder);
                //}
                break;
            case "audio":
                TAG.Util.removeProgressCircle(circle);
                viewer.css('background', 'black');
                //center the the audio element in the viewer
                viewer.append(holder);
                var left = viewer.width() / 2 - holder.width() / 2 + "px";
                var top = viewer.height() /2 - holder.height() /2 + "px";
                holder.css({ "position": "absolute", "left": left, "top" : top });
                break;
            case "iframe":
                TAG.Util.removeProgressCircle(circle);
                viewer.css('background', 'black');
                viewer.append(holder);
                break;
            case "text":
                TAG.Util.removeProgressCircle(circle);
                viewer.css({ 'background': 'black'});
                viewer.append(holder);
                var left = viewer.width() / 2 - holder.width() / 2 + "px";
                var top = viewer.height() / 2 - holder.height() / 2 + "px";
                holder.css({ "position": "absolute", "left": left, "top": top });
                break;
            default:
                TAG.Util.removeProgressCircle(circle);
                viewer.css('background', 'black');
                break;
        }

        // Create labels
        var titleInput = createTextInput(TAG.Util.htmlEntityDecode(media.Name) || "", "Title", 100);
        var descInput = createTextAreaInput(TAG.Util.htmlEntityDecode(media.Metadata.Description).replace(/\n/g,'<br />') || "", true, 2000);

        titleInput.focus(function () {
            if (titleInput.val() === 'Title')
                titleInput.select();
        });

        titleInput.on('keyup', function (event) {
            if (event.which === 13) {
                saveButton.click();
            } else {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            }
            
        });

        descInput.focus(function () {
            if (descInput.val() === 'Description')
                descInput.select();
        });

        descInput.on('keyup', function () {
            changesMade = true;
            saveButton.prop("disabled", false);
            saveButton.css("opacity", 1);
        });

        onChangeUpdateText(titleInput, null, 100);
        onChangeUpdateText(descInput, null, 5000);

        var title = createSetting('Title', titleInput);
        var desc = createSetting('Description', descInput);
        var yearMetadataDivSpecs = createYearMetadataDiv(media, function (event) {            
            if (event && event.which === 13) {
                saveButton.click();
            } else {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            }
        });

        settingsContainer.append(title);
        settingsContainer.append(desc);
        if (type === 'iframe') {
            var rawSource = media.Metadata.Source;
            var visibleSource;
            if (rawSource.indexOf('youtube') > -1) {
                if (rawSource.indexOf('embed') > -1) {
                    visibleSource = rawSource.substring(rawSource.indexOf('embed') + 6);
                    visibleSource = "https://www.youtube.com/watch?v=" + visibleSource;
                }                
            }
            else if (rawSource.indexOf('vimeo')) {
                if (rawSource.indexOf('video') > -1) {
                    visibleSource = rawSource.substring(rawSource.indexOf('video') + 6, rawSource.indexOf("?"));
                    visibleSource = "https://www.vimeo.com/" + visibleSource;
                }    
            }
            var sourceInput = createTextInput(visibleSource);
            sourceInput.focus(function () {
                if (descInput.val() === 'Source')
                    descInput.select();
            });
            sourceInput.on('keyup', function (event) {
                if (event.which === 13) {
                    saveButton.click();
                } else {
                    changesMade = true;
                    saveButton.prop("disabled", false);
                    saveButton.css("opacity", 1);
                }
            });
            onChangeUpdateText(sourceInput, null, 5000);
            var source = createSetting('Source', sourceInput);
            settingsContainer.append(source);
        }
        settingsContainer.append(yearMetadataDivSpecs.yearMetadataDiv);

        //Automatically save changes
        //currentMetadataHandler = function () {
        //    if (titleInput.val() === undefined || titleInput.val() === "") {
        //        titleInput.val("Untitled Asset");
        //    }
        //    saveAssocMedia(media, {
        //        titleInput: titleInput,
        //        descInput: descInput,
        //        yearInput: yearMetadataDivSpecs.yearInput,
        //        monthInput: yearMetadataDivSpecs.monthInput,
        //        dayInput: yearMetadataDivSpecs.dayInput,
        //        timelineYearInput: yearMetadataDivSpecs.timelineYearInput,
        //        timelineMonthInput: yearMetadataDivSpecs.timelineMonthInput,
        //        timelineDayInput: yearMetadataDivSpecs.timelineDayInput
        //    });
        //};

        // Create buttons
        
        addToArtworkLabel.unbind("click");
        addToArtworkLabel.click(
            function () {
                pickerOpen = true;
                assocToArtworks(media);
            });
        TAG.Telemetry.register(addToArtworkLabel, "click", "EditorButton", function (tobj) {
            tobj.edit_type = "Manage Associations";
            tobj.element_id = media.Identifier;
        });

        //    assocButton = createButton('Manage Associations',
        //        function () {
        //            pickerOpen = true;
        //            assocToArtworks(media); /*changesHaveBeenMade = true;*/
        //        },
        //        {
        //            'float': 'left',
        //            'margin-left': '2%',
        //            'margin-top': '1%',
        //            'margin-right': '0%',
        //            'margin-bottom': '3%',
        //        });
        //    TAG.Telemetry.register(assocButton, "click", "EditorButton", function (tobj) {
        //        tobj.edit_type = "Manage Associations";
        //        tobj.element_id = media.Identifier;
        //    });

        leftButton = addToArtworkLabel;
        var deleteButton = createButton('Delete',
            function () { deleteAssociatedMediaSingle(media); /*changesHaveBeenMade = true;*/ },
            {
                'margin-right': '0%',
                'margin-top': '1%',
                'margin-bottom': '3%',
                'margin-left': '2%',
                'float': 'left',
            });

        if(IS_WINDOWS){
            $('#setViewDeleteButton').css('display','block');
            deleteBlankButton.unbind('click').click(function(){ deleteAssociatedMedia(multiSelected)});
            deleteBlankButton.text("Delete");
        } else{

        }

        var generateAssocMediaThumbnailButton = createButton('Generate Thumbnail',
            function () {
                generateAssocMediaThumbnail(media);
                //changesHaveBeenMade = true;
            }, {
                'margin-right': '3%',
                'margin-top': '1%',
                'margin-bottom': '1%',
                'margin-left': '2%',
                'float': 'left'
            });

        var saveButton = createButton('Save',
            function () {
                if (titleInput.val() === undefined || titleInput.val() === "") {
                    titleInput.val("Untitled Asset");
                }
                var updatedMetadata = {
                    titleInput: titleInput,
                    descInput: descInput,
                    yearInput: yearMetadataDivSpecs.yearInput,
                    monthInput: yearMetadataDivSpecs.monthInput,
                    dayInput: yearMetadataDivSpecs.dayInput,
                    timelineYearInput: yearMetadataDivSpecs.timelineYearInput,
                    timelineMonthInput: yearMetadataDivSpecs.timelineMonthInput,
                    timelineDayInput: yearMetadataDivSpecs.timelineDayInput
                };


                if (type === 'iframe') {
                    var validURL = checkEmbeddedURL(sourceInput.val());
                    if (validURL) {
                        saveAssocMedia(media, updatedMetadata, validURL);
                    }
                } else {
                    saveAssocMedia(media, updatedMetadata);
                }
            }, {
                'margin-right': '3%',
                'margin-top': '1%',
                'margin-bottom': '1%',
                'margin-left': '.5%',
                'float': 'right'
            }, true);
        TAG.Telemetry.register(saveButton, "click", "SaveButton", function (tobj) {
            tobj.element_type = "Assoc Media";
        });
        var thumbnailButton = createButton('Capture Thumbnail',
            function () {
                saveThumbnail(media, false);
                //changesHaveBeenMade = true;
            }, {
                'margin-right': '0%',
                'margin-top': '1%',
                'margin-bottom': '3%',
                'margin-left': '2%',
                'float': 'left'
            });

        thumbnailButton.attr('id', 'thumbnailButton');

        if (media.Metadata.ContentType.toLowerCase() === 'video') {
        //    var convertBtn = createButton('Convert Video',
        //            function () {
        //                var source = media.Metadata.Source;
        //                var newFileName = source.slice(8, source.length);
        //                var index = newFileName.lastIndexOf(".");
        //                var fileExtension = newFileName.slice(index);
        //                var baseFileName = newFileName.slice(0, index);
        //                if (media.Metadata.Converted !== "True") {
        //                    TAG.Worktop.Database.convertVideo(function () {
        //                    }, null, newFileName, fileExtension, baseFileName, media.Identifier);
        //                    conversionVideos.push(media.Identifier);
        //                    $("#videoErrorMsg").remove();
        //                    $("#leftLoading").remove();
        //                    var msg = "This video is being converted to compatible formats for different browsers";
        //                    viewer.append(TAG.Util.createConversionLoading(msg));
        //                    holder[0].onerror = TAG.Util.videoErrorHandler(holder, viewer, "False");
        //                    convertBtn.hide().data('disabled', true);
        //                }
        //            }, {
        //                'margin-right': '0%',
        //                'margin-top': '1%',
        //                'margin-bottom': '3%',
        //                'margin-left': '2%',
        //                'float': 'left'
        //            })
        //    convertBtn.attr('class', 'button convertVideoButton');
        //    convertBtn.attr("disabled", "");
        buttonContainer.append(thumbnailButton);//.append(convertBtn);
        } else if (media.Metadata.ContentType.toLowerCase() === 'image' && !media.Metadata.Thumbnail && media.Metadata.Source && media.Metadata.Source[0] === '/' && !source.match(/.mp3/)) {
            // hacky way to see if asset was imported recently enough to support thumbnailing (these are /Images/_____.__
            // rather than http:// _______/Images/_______.__
            buttonContainer.append(generateAssocMediaThumbnailButton);
        }
        buttonContainer.append(saveButton); //SAVE BUTTON// //REAPPEND DELETE BUTTON HERE
        if(!IS_WINDOWS){
            buttonContainer.append(deleteButton);
        }


        saveButton.on("mousedown", function () {
            if (!saveButton.attr("disabled")) {
                saveButton.css({ "background-color": "white" });
            }
        });
        thumbnailButton.on("mousedown", function () {
            thumbnailButton.css({ "background-color": "white" });
        });
        TAG.Telemetry.register(deleteButton, "click", "DeleteButton", function (tobj) {
            tobj.element_type = "Assoc Media";
        });
        deleteButton.on("mousedown", function () {
            deleteButton.css({ "background-color": "white" });
        });
        addToArtworkLabel.on("mousedown", function () {
            addToArtworkLabel.css({ "background-color": "white" });
        });
        saveButton.on("mouseleave", function () {
            if (!saveButton.attr("disabled")) {
                saveButton.css({ "background-color": "transparent" });
            }
        });
        thumbnailButton.on("mouseleave", function () {
            thumbnailButton.css({ "background-color": "transparent" });
        });
        deleteButton.on("mouseleave", function () {
            deleteButton.css({ "background-color": "transparent" });
        });
        addToArtworkLabel.on("mouseleave", function () {
            addToArtworkLabel.css({ "background-color": "transparent" });
        });
        newButton.on("mouseleave", function () {
            newButton.css({ "background-color": "transparent" });
        });
    }


    /**Helper method to check URLs of videos to be embedded (standard YouTube or Vimeo URLs only) and return parsed URL for embed
     * @method checkEmbeddedURL
     * @param {String} url    URL to check and parse
     * @return {string} validURL   parsed URL if valid, empty string otherwise
     */
    function checkEmbeddedURL(url) {
        var modifiedURL = url,
                        popup,
                        id,
                        validURL = true;
        if (modifiedURL.toLowerCase().indexOf('youtube') > -1) {

            if (modifiedURL.indexOf("watch?v=") > -1) {
                id = modifiedURL.substring(modifiedURL.indexOf("watch?v=") + 8);

                if (id && !/^[a-zA-Z0-9_-]*$/.test(id)) {
                    validURL = false;
                }
            } else {
                validURL = false;
            }

            if (validURL && id) {
                if (modifiedURL.indexOf("https://") < 0 && modifiedURL.indexOf("http://") > -1) {
                    modifiedURL = modifiedURL.replace("http://", "https://");
                } else if (modifiedURL.indexOf("https://") < 0 && modifiedURL.indexOf("http://") < 0) {
                    modifiedURL = "https://" + modifiedURL;
                }
                modifiedURL = modifiedURL.replace("watch?v=", "embed/");
            } else {
                popup = TAG.Util.UI.popUpMessage(null, "There was a problem embedding the given YouTube URL. The URL should be in the format http://www.youtube.com/watch?v=JozMHAWq0TA");
                $('body').append(popup);
                $(popup).show();
            }

        } else if (modifiedURL.toLowerCase().indexOf('vimeo') > -1) {

            if (modifiedURL.indexOf("vimeo.com") > -1) {
                id = modifiedURL.substring(modifiedURL.indexOf("vimeo.com") + 10);
                if (id && !/^\d+$/.test(id)) {		//No special characters or characters
                    validURL = false;
                }
            } else {
                validURL = false;
            }

            if (validURL && id) {
                modifiedURL = "https://player.vimeo.com/video/" + id + "?title=0&amp;byline=0&amp;portrait=0";
            } else {
                popup = TAG.Util.UI.popUpMessage(null, "There was a problem embedding the given Vimeo URL. The URL should be in the format http://vimeo.com/11088764 ");
                $('body').append(popup);
                $(popup).show();
            }

        } else {
            popup = TAG.Util.UI.popUpMessage(null, "Please enter a valid YouTube or Vimeo URL.");
            $('body').append(popup);
            $(popup).show();
            validURL = false;
        }
        if (validURL) {
            return modifiedURL;
        } else {
            return "";
        }
    }


    /**Save an associated media
     * @method saveAssocMedia
     * @param {Object} media    associated media to save
     * @param {Object} inputs   keys for media title and description
     */
    function saveAssocMedia(media, inputs, embeddedURL) {
        var name = inputs.titleInput.val(),
            year = inputs.yearInput.val(),
            month = inputs.monthInput.val(),
            day = inputs.dayInput.val(),
            timelineYear = inputs.timelineYearInput.val(),
            timelineMonth = inputs.timelineMonthInput.val(),
            timelineDay = inputs.timelineDayInput.val(),
            desc = inputs.descInput.val(),
            source = embeddedURL || "";
            
        //pCL = displayLoadingSettings();
        clearRight();
        prepareViewer(true);
        prepareNextView(false, null, null, "Saving...");

        var name = inputs.titleInput.val();
        var desc = inputs.descInput.val();
        //prepareViewer(true);

        TAG.Worktop.Database.changeHotspot(media, {
            Name: name,
            Description: desc,
            Source: source,
            Year: year,
            Month: month,
            Day: day,
            TimelineYear: timelineYear,
            TimelineMonth: timelineMonth,
            TimelineDay: timelineDay,
        }, function () {
            //refreshAssocMedia(media);
            //associatedMediaIsLoading = false;
            //if (backButtonClicked && !(generalIsLoading || collectionsIsLoading ||
            //    artworksIsLoading || associatedMediaIsLoading || toursIsLoading)) { //don't continue if more sections are still loading - wait for them to finish
            //    backButtonClickHandler();
            //};
            //if (!backButtonClicked && (prevSelectedSetting && prevSelectedSetting === nav[NAV_TEXT.media.text])) {
            //    hideLoading();
            //    hideLoadingSettings(pCL);
            //    loadAssocMediaView(previousIdentifier); //eventually don't want this here? - reloads everything
            //};
            //hideLoading();
            //hideLoadingSettings(pCL);
            //saveArray.splice(saveArray.indexOf(media.Identifier), 1); //removes identifier from save array
            if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.media.text]) {
                LADS.Worktop.Database.getAssocMedia();
                return;
            }
            if (prevSelectedSetting && prevSelectedSetting === nav[NAV_TEXT.media.text]) {
                loadAssocMediaView(previousIdentifier);
                return;
            }
        }, authError, conflict(media, "Update", loadAssocMediaView), error(loadAssocMediaView));
    }

    /**Delete associated media
     * @method deleteAssociatedMedia
     * @param {Object} media    media to be deleted
     */
    function deleteAssociatedMedia(mediaMULTIPLE) {
        var confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
            prepareNextView(false);
            clearRight();
            prepareViewer(true);

            console.log(mediaMULTIPLE.length + " things to delete.")
            var deleteCounter = 0;

            //only way to get it to reload after all of them are done
            var DEL = function (j, media) {
                // stupid way to force associated artworks to increment their linq counts and refresh their lists of media
                TAG.Worktop.Database.changeHotspot(media.Identifier, { Name: media.Name }, function () {
                    // success handler
                    TAG.Worktop.Database.deleteDoq(media.Identifier, function () {
                        deleteCounter += 1
                        console.log("deleted item: " + j)
                        if (deleteCounter == mediaMULTIPLE.length) {
                            loadAssocMediaView();
                        }
                    }, function () {
                        console.log("noauth error");
                    }, function () {
                        console.log("conflict error");
                    }, function () {
                        console.log("general error");
                    });
                }, function () {
                    // unauth handler
                }, function () {
                    // conflict handler
                }, function () {
                    // error handler
                });
            };

            for (var i = 0; i < mediaMULTIPLE.length; i++) {
                var media = mediaMULTIPLE[i]
                DEL(i, media)
            }

        }, "Are you sure you want to delete the selected associated media?", "Delete", true, function () { $(confirmationBox).hide(); });
        root.append(confirmationBox);
        $(confirmationBox).show();
        TAG.Util.multiLineEllipsis($($($(confirmationBox).children()[0]).children()[0]));
    }

    //FOR THE WEB APP
    function deleteAssociatedMediaSingle(media) {
        var confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
            prepareNextView(false);
            clearRight();
            prepareViewer(true);

            // stupid way to force associated artworks to increment their linq counts and refresh their lists of media
            TAG.Worktop.Database.changeHotspot(media.Identifier, { Name: media.Name }, function () {
                // success handler
                TAG.Worktop.Database.deleteDoq(media.Identifier, function () {
                    console.log("deleted");
                    loadAssocMediaView();
                }, function () {
                    console.log("noauth error");
                }, function () {
                    console.log("conflict error");
                }, function () {
                    console.log("general error");
                });
            }, function () {
                // unauth handler
            }, function () {
                // conflict handler
            }, function () {
                // error handler
            });
        }, "Are you sure you want to delete " + media.Name + "?", "Delete", true, function () { $(confirmationBox).hide(); });
        root.append(confirmationBox);
        $(confirmationBox).show();
        TAG.Util.multiLineEllipsis($($($(confirmationBox).children()[0]).children()[0]));
    }


    /**Brings up an artwork chooser for a particular associated media
     * @method assocToArtworks
     * @param {Object} media    media to associate to artworks
     */
    function assocToArtworks(media) {
        if (!media) {
            return;
        }
        artworkAssociations = [[]];
        numFiles = 1;
        TAG.Util.UI.createAssociationPicker(root, "Choose artworks", { comp: media, type: 'media' }, "artwork", [{
            name: "All Artworks",
            getObjs: TAG.Worktop.Database.getArtworks
        }], {
            getObjs: TAG.Worktop.Database.getArtworksAssocTo,
            args: [media.Identifier]
        }, function () { });
    }

    /**Generate thumbnail for associated media
     * @method generateAssocMediaThumbnail
     * @param {Object} media        media to generate thumbnail for
     */
    function generateAssocMediaThumbnail(media) {
        prepareNextView(false, null, null, "Saving...");
        clearRight();
        prepareViewer(true);
        TAG.Worktop.Database.changeHotspot(media.Identifier, { Thumbnail: 'generate' }, function () {
            loadAssocMediaView(media.Identifier);
        }, unauth, conflict, error);
    }

    /**Generate iframe asset
     * @method createIframeAsset
     * @param {String} src        URL to embed
     */
    function createIframeAsset(src) { //TODO IFRAME ASSOC MEDIA: iframe asset creation would look something like this
        middleLabelContainer.empty();
        middleLabelContainer.append(middleLoading);
        middleLoading.show();
        clearRight();
        viewer.empty();
        viewer.css('background', 'black');
        var validURL = checkEmbeddedURL(src);
        if (validURL) {
            var options = {
                Source: validURL,
                Name: "Untitled Embedded Video"
            };
            TAG.Worktop.Database.createIframeAssocMedia(options, onSuccess);
        } else {
            loadAssocMediaView();
        }
        function onSuccess(doqData) {
            var newDoq = new Worktop.Doq(doqData.responseText);
            function done() {
                loadAssocMediaView(newDoq.Identifier);
            }
            TAG.Worktop.Database.changeHotspot(newDoq.Identifier, options, done, TAG.Util.multiFnHandler(authError, done), TAG.Util.multiFnHandler(conflict(newDoq, "Update", done)), error(done));

        };

    }

    /**
     * Create a dialog for inputting an iframe source for new associated media
     * @method createIframeSourceDialog
     */
    function createIframeSourceDialog() {
        var overlay = TAG.Util.UI.popupInputBox({
            confirmAction: createIframeAsset,
            container: root,
            message: 'Enter a YouTube or Vimeo URL',
            //placeholder: 'E.g., http://www.youtube.com/embed/g794oDdc1l0',
            confirmText: 'Save'
        });
        root.append(overlay);
        overlay.fadeIn(500);
    }

    /**
     * @method createAsset
     */
    function createAsset() {
        uploadFile(TAG.Authoring.FileUploadTypes.AssociatedMedia, function (urls, names, contentTypes, files) {
            var check, i, url, name, done = 0, total = urls.length, durations = [], toScroll, alphaName;

            //implementing background uploads - david
            console.log("createAsset called")
            hideUploadingProgress();
            //prepareNextView(false);
            //clearRight();
            //prepareViewer(true);

            if(files.length > 0) {
                durationHelper(0);
            }

            function durationHelper(j) {
                if (contentTypes[j] === 'Video') {
                    
                    //webappfileupload
                    if (!IS_WINDOWS){
                        var videoElement = $(document.createElement('video'));
                        videoElement.attr('preload', 'metadata');   //Instead of waiting for whole video to load, just load metadata
                        var videoURL = URL.createObjectURL(files[j]);
                        videoElement.attr('src', videoURL);
                        videoElement.on('loadedmetadata', function() {
                            var dur = this.duration;
                            durations.push(dur);
                        });
                    } else {
                        files[j].properties.getVideoPropertiesAsync().done(function (VideoProperties) {
                        durations.push(VideoProperties.duration / 1000); // duration in seconds
                        updateDoq(j);
                        }, function (err) {
                            console.log(err);
                        });
                    }

                } else if (contentTypes[j] === 'Audio') {

                    //webappfileupload
                    if (!IS_WINDOWS){
                        var audioElement = $(document.createElement('audio'));
                        audioElement.attr('preload', 'metadata');   //Instead of waiting for whole audio to load, just load metadata
                        var audioURL = URL.createObjectURL(files[j]);
                        audioElement.attr('src', audioURL);
                        audioElement.on('loadedmetadata', function() {
                            var dur = this.duration;
                            durations.push(dur);
                            updateDoq(j);
                        });
                    } else {
                        files[j].properties.getMusicPropertiesAsync().done(function (MusicProperties) {
                        durations.push(MusicProperties.duration / 1000); // duration in seconds
                        updateDoq(j);
                        }, function (error) {
                            console.log(error);
                        });
                    }
                } else {
                    durations.push(null);
                    updateDoq(j);
                }
            }

            function incrDone() {
                done++;
                if (done >= total) {
                    if (inAssociatedView) {
                        loadAssocMediaView(toScroll.Identifier);
                    } else {
                        
                    }
                } else {
                    durationHelper(done);
                }
            }

            function updateDoq(j) {
                var newDoq;
                try {
                    newDoq = new Worktop.Doq(urls[j]);
                    var options = { Name: names[j] };
                    if (durations[j]) {
                        options.Duration = durations[j];
                    }
                    TAG.Worktop.Database.changeHotspot(newDoq.Identifier, options, incrDone, TAG.Util.multiFnHandler(authError, incrDone), TAG.Util.multiFnHandler(conflict(newDoq, "Update", incrDone)), error(incrDone));
                    if (contentTypes[j] === "Video") {
                        var source = newDoq.Metadata.Source;
                        var newFileName = source.slice(8, source.length);
                        var index = newFileName.lastIndexOf(".");
                        var fileExtension = newFileName.slice(index);
                        var baseFileName = newFileName.slice(0, index);
                        TAG.Worktop.Database.convertVideo(function () {
                        }, null, newFileName, fileExtension, baseFileName, newDoq.Identifier);
                    }
                    /*if (contentTypes[j] === "Video") { //TODO: COMMENTING OUT FOR WIN8 AUG 15 RELEASE ONLY

                        //conversionVideos.push(newDoq.Identifier);
                        var source = newDoq.Metadata.Source;
                        var newFileName = source.slice(8, source.length);
                        var index = newFileName.lastIndexOf(".");
                        var fileExtension = newFileName.slice(index);
                        var baseFileName = newFileName.slice(0, index);
                        var confirmBox = TAG.Util.UI.PopUpConfirmation(function () {
                            //$(document.getElementById("leftLoading")).remove();
                            //viewer.append(LADS.Util.createConversionLoading("This video is being converted to compatible formats for different browsers"));
                            TAG.Worktop.Database.convertVideo(function () {
                            }, null, newFileName, fileExtension, baseFileName, newDoq.Identifier);
                            conversionVideos.push(newDoq.Identifier);
                            var mediaElement = $(document.getElementById("videoInPreview"));
                            if (mediaElement[0]) {
                                $("#videoErrorMsg").remove();
                                $("#leftLoading").remove();
                                var msg = "This video is being converted to compatible formats for different browsers";
                                viewer.append(TAG.Util.createConversionLoading(msg));    
                            }
                        }, "Would you like to convert" + newFileName + "?", "Yes", true, function () {
                            if (fileExtension !== ".mp4") {
                                var msg = "This video format has not been converted to formats supported in multiple browsers.";
                                viewer.append(LADS.Util.createConversionLoading(msg, true));
                            }
                            $(".convertVideoBtn").show().data("disabled", false);
                        });

                        root.append(confirmBox);
                        $(confirmBox).show();
                    }*/
                } catch (error) {
                    done++;
                    console.log("error in uploading: " + error.message);
                    return;
                }
                if (!alphaName || names[j] < alphaName) {
                    toScroll = newDoq;                          //Alphabetical order
                    alphaName = names[j];
                }
            }
        }, true, ['.jpg', '.png', '.gif', '.tif', '.tiff', '.mp4', '.mp3', '.mp4', '.webm', '.ogv','.mov','.avi','.wmv']);
    }

    /**Create an associated media (import), possibly more than one
     * @method createMedia
     */
    function createMedia() {
        batchAssMedia();
    }

    /**
     * @method batchAssMedia
     */
    function batchAssMedia() {
        var uniqueUrls = []; // Used to make sure we don't override data for the wrong media (not actually airtight but w/e)
        mediaMetadata = [];
        artworkAssociations = [];
        numFiles = 0;
        isUploading = true;
        if (IS_WINDOWS){
            assetUploader = TAG.Authoring.FileUploader( // multi-file upload now
                root,
                TAG.Authoring.FileUploadTypes.AssociatedMedia,
                function (files, localURLs) { // localCallback
                    var file, localURL, i;
                    var img, video, audio;
                    var contentType;
                    numFiles = files.length;
                    for (i = 0; i < files.length; i++) {
                        artworkAssociations.push([]);
                        file = files[i];
                        localURL = localURLs[i];
                        if (file.contentType.match(/image/)) {
                            contentType = 'Image';
                        } else if (file.contentType.match(/video/) || files[i].fileType.toLowerCase() === ".mp4" || files[i].fileType.toLowerCase() === ".webm" || files[i].fileType.toLowerCase() === ".ogv") {
                            contentType = 'Video';
                        } else if (file.contentType.match(/audio/)) {
                            contentType = 'Audio';
                        }
                        uniqueUrls.push(localURL);
                        mediaMetadata.push({
                            'title': file.displayName,
                            'contentType': contentType,
                            'localUrl': localURL,
                            'assetType': 'Asset',
                            'assetLinqID': undefined,
                            'assetDoqID': undefined
                        });
                    }
                },
                function (dataReaderLoads) { // finished callback: set proper contentUrls, if not first, save it
                    var i, dataReaderLoad;
                    for (i = 0; i < dataReaderLoads.length; i++) {
                        dataReaderLoad = dataReaderLoads[i];
                        mediaMetadata[i].contentUrl = dataReaderLoad;
                    }

                // chooseAssociatedArtworks(); // need to send in media objects here TODO
                },
                ['.jpg', '.png', '.gif', '.tif', '.tiff', '.mp4', '.mp3'], // filters
                false, // useThumbnail
                null, // errorCallback
                true // multiple file upload enabled?
            );
        } else {
        //webappfileupload
            assetUploader = TAG.Authoring.WebFileUploader(
                root,
                TAG.Authoring.FileUploadTypes.AssociatedMedia,
                function (files, localURLs) { // localCallback
                    var file, localURL, i;
                    var img, video, audio;
                    var contentType;
                    numFiles = files.length;
                    for (i = 0; i < files.length; i++) {
                        artworkAssociations.push([]);
                        file = files[i];
                        localURL = localURLs[i];

                        //webappfileupload
                        if (file.type.match(/image/)) {
                            contentType = 'Image';
                        } else if (file.type.match(/video/)) {
                            contentType = 'Video';
                        } else if (file.type.match(/audio/)) {
                            contentType = 'Audio';
                        }
                    
                        uniqueUrls.push(localURL);
                        mediaMetadata.push({
                            'title': file.name,
                            'contentType': contentType,
                            'localUrl': localURL,
                            'assetType': 'Asset',
                            'assetLinqID': undefined,
                            'assetDoqID': undefined
                        });
                    }
                },
                function (dataReaderLoads) { // finished callback: set proper contentUrls, if not first, save it
                    var i, dataReaderLoad;
                    for (i = 0; i < dataReaderLoads.length; i++) {
                        dataReaderLoad = dataReaderLoads[i];
                        mediaMetadata[i].contentUrl = dataReaderLoad;
                    }

                // chooseAssociatedArtworks(); // need to send in media objects here TODO
                },
                ['.jpg', '.png', '.gif', '.tif', '.tiff', '.mp4', '.mp3'], // filters
                false, // useThumbnail
                null, // errorCallback
                true // multiple file upload enabled?
            );
        }
    }

    /**
     * @method saveAssMedia
     * @param i the index of the asset 
     */
    function saveAssMedia(i) {
        var len = artworkAssociations[i].length;
        uploadHotspotHelper(i, 0, len);
    }

    /**
     * Uploads hotspot i to artwork j in its list of artworks to associate to.
     * @method uploadHotspotHelper
     * @param i    the index of the asset we're uploading
     * @param j    each asset has a list of artworks it'll be associated with; j is the index in this list
     * @param len  the length of the list above
     */
    function uploadHotspotHelper(i, j, len) {
        // uploads hotspot hotspot i to artwork j in its list
        var activeMM = mediaMetadata[i];
        uploadHotspot(artworkAssociations[i][j], { // this info isn't changing, so maybe we can do this more easily in uploadHotspot
            title: TAG.Util.htmlEntityEncode(activeMM.title || 'Untitled media'),
            desc: TAG.Util.htmlEntityEncode(''),
            pos: null, // bogus entry for now -- should set it to {x: 0, y: 0} in uploadHotspot
            contentType: activeMM.contentType,
            contentUrl: activeMM.contentUrl,
            assetType: activeMM.assetType,
            metadata: {
                assetLinqID: activeMM.assetLinqID,
                assetDoqID: activeMM.assetDoqID
            }
        },
        i, j, len);
    }

    /**
     * @method uploadHotspot
     * @param artwork
     * @param info
     * @param i
     * @param j
     * @param len
     */
    function uploadHotspot(artwork, info, i, j, len) {
        var title = info.title,
            desc = info.desc,
            pixel = info.pos,
            contentType = info.contentType,
            contentUrl = info.contentUrl,
            assetType = info.assetType,
            worktopInfo = info.metadata || {},
            dzPos = pixel ? zoomimage.viewer.viewport.pointFromPixel(pixel) : { x: 0, y: 0 },
            rightbarLoadingSave;

        var options = {
            Name: title,
            ContentType: contentType,
            Duration: duration,
            Source: contentUrl,
            LinqTo: artwork.Identifier,
            X: dzPos.x,
            Y: dzPos.y,
            LinqType: assetType,
            Description: desc
        };

        TAG.Worktop.Database.createHotspot(artwork.CreatorID, artwork.Identifier, createHotspotHelper);

        /**
         * @method createHotspotHelper
         * @param isNewAsset
         * @param xmlHotspot
         */
        function createHotspotHelper(isNewAsset, xmlHotspot) { // currently for creating both hotspots and assoc media
            var $xmlHotspot,
                hotspotId,
                hotspotContentId,
                hotspotContentDoq,
                $hotspotContentDoq,
                titleField,
                metadata,
                descField,
                contentTypeField,
                sourceField,
                position;
            $xmlHotspot = $(xmlHotspot);
            hotspotId = $xmlHotspot.find("Identifier").text();
            hotspotContentId = $xmlHotspot.find("BubbleContentID:last").text();
            hotspotContentDoq = $.parseXML(TAG.Worktop.Database.getDoqXML(hotspotContentId));
            $hotspotContentDoq = $(hotspotContentDoq);
            // update doq info and send back to server
            titleField = $hotspotContentDoq.find('Name').text(title);
            metadata = $hotspotContentDoq.find('Metadata');
            descField = metadata.find("d3p1\\:Key:contains('Description') + d3p1\\:Value").text(desc);
            contentTypeField = metadata.find("d3p1\\:Key:contains('ContentType') + d3p1\\:Value").text(contentType);
            sourceField = metadata.find("d3p1\\:Key:contains('Source') + d3p1\\:Value").text(contentUrl);
            position = $xmlHotspot.find('Offset > d2p1\\:_x').text(dzPos.x); // why is position getting reset?
            position = $xmlHotspot.find('Offset > d2p1\\:_y').text(dzPos.y);
            //add linq type : Hotspot vs. Asset
            $xmlHotspot.find("d3p1\\:Key:contains('Type') + d3p1\\:Value").text(assetType);
            TAG.Worktop.Database.pushLinq(xmlHotspot, hotspotId);
            TAG.Worktop.Database.pushXML(hotspotContentDoq, hotspotContentId);
            if (j < len - 1) {
                uploadHotspotHelper(i, j + 1, len);
            }
            else if (j === len - 1 && i < numFiles - 1) {
                saveAssMedia(i + 1);
            }
            else {
                isUploading = false;
                isCreatingMedia = false;
                //$topProgressDiv.css("visibility", "hidden");
            }
        }
    }



    /**
     * Store the search strings for each artwork/tour
     * @method initSearch
     * @param {Array} contents    the contents of this collection (array of doqs)
     */
    function initSearch() {
        var info;

        searchbar[0].value = "";
        //$(searchbar).blur(); //////////
        infoSource = [];
        
        $.each(currentList, function (i, cts) {
            if (!cts) {
                return false;
            }
            info = ((cts.Name) ? cts.Name : "") + " " + ((cts.Metadata.Artist) ? cts.Metadata.Artist : "") + " " + ((cts.Metadata.Year) ? cts.Metadata.Year : "") + " " + ((cts.Metadata.TimelineYear) ? cts.Metadata.TimelineYear : "") + " " + ((cts.Metadata.Description) ? cts.Metadata.Description : "") + " " + ((cts.Metadata.Type) ? cts.Metadata.Type : "") + " " + ((cts.Metadata.Feedback) ? cts.Metadata.Feedback : "");
            if (cts.Metadata.InfoFields) {
                $.each(cts.Metadata.InfoFields, function (field, fieldText) {           //Adding custom metadata fields: both keys and values
                    info += " " + field;
                    info += " " + fieldText;
                });
            }            
            
            infoSource.push({
                "id": i,
                "keys": info.toLowerCase(),
                "identifier": info.Identifier
            });
           
        });
    }

    /**
     * Search collection using string in search input box
     * @method doSearch
     */
    function doSearch() {
        TAG.Util.removeYoutubeVideo();

        var content = searchbar.val().toLowerCase(),
            matches = [],
            i;

        if (!content) {
            loadArtView();
            return;
        }

        for (i = 0; i < infoSource.length; i++) {
            if (infoSource[i].keys.indexOf(content) > -1) {
                matches.push(currentList[i]);
            }
        }
        if (inArtworkView) {
            loadArtView(null, matches);
            if(matches.length==0){
                console.log("No matches in artwork view");
            }
        } else if (inAssociatedView) {
            loadAssocMediaView(null, matches);
            if(matches.length ==0){
                console.log("no matches in associated media view");
            }
        } else if (inCollectionsView) {
            loadExhibitionsView(null, matches);
        } else if (inFeedbackView) {
            loadFeedbackView(null, matches);
        } else if (inToursView) {
            loadTourView(null, matches);
        } else {

            return;
        }

    }

    function displayNoResults(){
        var noResults = $(document.createElement('label')).css('border-radius', '3.5px');
        noResults.css({
            'margin': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'color': 'white',
            'padding-left': '1%',
            'padding-right': '1%',
            'background-color': 'black',
            'position': 'relative',
            'float': "right",
            'margin-right': '3%'
        });
        

    }



    // Art Functions:

    /**Loads art view
     * @method loadArtView
     * @param {Object} id   id of middle label to start on
     */
    function loadArtView(id, matches) {

        console.log(sortByArt);
        
        inGeneralView = false;
        inCollectionsView = false;
        inArtworkView = true;
        inAssociatedView = false;
        inToursView = false;
        inFeedbackView = false;

        changesMade = false;

        var list;
        var collectionList = {};
        var guidsInCollection = [];
        //var sortBy = "Title";
        currentIndex = 0;
        prepareNextView(true, "Import", createArtwork, null, true);
        prepareViewer(true);
        clearRight();
        var cancel = false;

        collectionSort.css('display','inline-block');

        findContainer.css('width','140%');

        //if (generalIsLoading || collectionsIsLoading ||
        //  artworksIsLoading || associatedMediaIsLoading || toursIsLoading) {
        //    hideLoading();
        //    hideLoadingSettings(pCL);
        //};
        //generalProgressCircle && hideLoadingSettings(generalProgressCircle);
        //artworksIsLoading && showLoading();
        //(saveArray.indexOf(previousIdentifier) < 0) && function () { hideLoading(); hideLoadingSettings(pCL); };
        if (prevLeftBarSelection.categoryName == null) {
            prevLeftBarSelection = {
                timeSpentTimer: new TelemetryTimer(),
                categoryName: "Artwork",
                loadTime: 0
            };
        }
        var loadTimer = new TelemetryTimer();
        if (typeof matches !== "undefined") {       //If there are no search results to display
            list = matches;
            if (list.length>0){
                list.unshift("Search Results:")
            } else {
                list.push("No search results");
            }
            displayLabels(); 
        } else {
            // Make an async call to get artworks and then display
            TAG.Worktop.Database.getArtworks(function (result) {
                if (cancel) return;
                sortAZ(result);
                currentList = result;
                artworkList = result;
                initSearch();
                list = result;
                sortLabels();
            });
        }

        if (sortByArt == "Title"){
            titleSort.css('background-color','white');
            collectionSort.css('background-color','initial');
            addedRecentlySort.css('background-color','initial');
        } else if (sortByArt == "Collection"){
            titleSort.css('background-color','initial');
            collectionSort.css('background-color','white');
            addedRecentlySort.css('background-color','initial');
        } else if (sortByArt == "Recently Added"){
            titleSort.css('background-color','initial');
            collectionSort.css('background-color','initial');
            addedRecentlySort.css('background-color','white');
        }
        
        function sortLabels(){
            collectionList = [];
            guidsInCollection = [];
            if (sortByArt == "Title"){
                console.log("sort by title");
                sortAZ(list);
                displayLabels();
            } 
            else if (sortByArt == "Collection"){
                console.log("sort by collection");
                TAG.Worktop.Database.getExhibitions(function (result) {
                    if (cancel) return;
                    sortAZ(result);
                    //create sort list for each collection
                    for (var r = 0, len = result.length; r < len; r++){
                        //make entry in hash map 
                            //key- guid of collection
                            //values- name of collection
                            //      - list of artwork guids in collection
                        collectionList[result[r].Identifier] = {collect_name: result[r].Name, artworks:[]};
                    }
                    //create list for artworks that are not in a collection
                    collectionList["Other"] = {collect_name: "Other", artworks:[]};
                    //add artworks to collectionList based on values in _Folders attribute
                    for (var a=0, alen= list.length; a<alen; a++){
                        var notInCollection = true;
                        var folders = list[a]._Folders.FolderData;
                        for (var v=0, vlen=folders.length; v<vlen;v++){
                            if (folders[v].FolderId in collectionList){
                                collectionList[folders[v].FolderId].artworks.push(list[a]);
                                notInCollection = false;
                            }
                        }
                        if (notInCollection){
                            //add to other
                            collectionList["Other"].artworks.push(list[a]);
                        }
                    }
                    //concatenate list
                    list = [];
                    for (var collect in collectionList){
                        list.push(collectionList[collect].collect_name);
                        list = list.concat(collectionList[collect].artworks);
                    }
                    displayLabels();
                });
            }
            else if (sortByArt == "Recently Added"){
                //create sort list for added before and other
                console.log("sort by recently added")
                sortAZ(list);
                var afterList = [];
                var beforeList = [];
                for (var sb = 0, len = list.length; sb < len; sb++){
                    var artDate = new Date(list[sb].Metadata.__Created);
                    var now = new Date();
                    var compareDate = new Date(now.getFullYear(), now.getMonth(),now.getDate()-7);
                    //compareDate = compareDate.setDate(compareDate.getDate()-7);
                    if (artDate.getTime() > compareDate.getTime()){
                        afterList.push(list[sb]);
                    } else{
                        beforeList.push(list[sb]);
                    }
                }
                list = [];
                list.push("Recently Added");
                list = list.concat(afterList);
                list.push("Older");
                list = list.concat(beforeList);
                displayLabels();
            }

        }


        function displayLabels() {
            if (list[0]) {
                $.each(list, function (i, val) {
                    if (cancel) return;
                    // Add each label in a separate function in the queue
                    // so the UI doesn't lock up
                    if (val && val.Metadata){
                    val.Name = TAG.Util.htmlEntityDecode(val.Name);
                    middleQueue.add(function () {
                        if (cancel) return;
                        if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.art.text]) {
                            return;
                        }
                        var label;
                        var imagesrc;
                        switch (val.Metadata.Type) {
                            case 'Artwork':
                                imagesrc = TAG.Worktop.Database.fixPath(val.Metadata.Thumbnail);
                                break;
                            case 'VideoArtwork':
                                imagesrc = val.Metadata.Thumbnail ? TAG.Worktop.Database.fixPath(val.Metadata.Thumbnail) : tagPath + "images/video_icon.svg";
                                break
                            default:
                                imagesrc = null;
                        }
                        if (!prevSelectedMiddleLabel &&
                            ((id && val.Identifier === id) || (!id && i === 0))) {
                            // Select the first one
                            middleLoading.before(selectLabel(label = createMiddleLabel(val.Name, imagesrc, function () {
                                //keep track of identifiers for autosaving
                                previousIdentifier = val.identifier;
                                loadArtwork(val);
                                currentIndex = i;
                            }, val.Identifier, false, function () {
                                if (val.Metadata.Type === "Artwork") {
                                    editArtwork(val);
                                }
                            }, true, val.Extension), true));


                            // Scroll to the selected label if the user hasn't already scrolled somewhere
                            if (middleLabelContainer.scrollTop() === 0 && label.offset().top - middleLabelContainer.height() > 0) {
                                middleLabelContainer.animate({
                                    scrollTop: (label.offset().top - middleLabelContainer.height() / 2)
                                }, 1000);
                            }

                            prevSelectedMiddleLabel = label;
                            currentSelected = prevSelectedMiddleLabel;
                            currentIndex = i;
                            loadArtwork(val);
                        } else {
                            middleLoading.before(label = createMiddleLabel(val.Name, imagesrc, function () {
                                //keep track of identifiers for autosaving
                                //if (changesHaveBeenMade) {
                                //    //saveArray.push(previousIdentifier);
                                //    //currentMetadataHandler && saveQueue.add(currentMetadataHandler());
                                //    //changesHaveBeenMade = false;
                                //}
                                loadArtwork(val);
                                previousIdentifier = val.Identifier;
                                currentIndex = i;
                            }, val.Identifier, false, function () {
                                if (val.Metadata.Type === "Artwork") {
                                    editArtwork(val);
                                }
                            }, true, val.Extension));
                        }

                    });
                    }
                    //sort name
                    else if (val) {
                        middleQueue.add(function(){
                            console.log(val);
                            middleLoading.before(label= createSortLabel(val));
                        });
                    }
                });
                // Hide the loading label when we're done
                middleQueue.add(function () {
                    middleLoading.hide();

                });
            } else {
                middleLoading.hide();

            }
            middleQueue.add(function () {
                prevLeftBarSelection.loadTime = loadTimer.get_elapsed();
            });
            
        }
            
        cancelLastSetting = function () { cancel = true; };
    }

    function createSortLabel(text){

        var container = $(document.createElement('div'));
        var text = TAG.Util.htmlEntityDecode(text);
        container.attr('class', 'sortLabel');
        var width;

        var helper = $(document.createElement('span'));
        helper.css({
            'display' : 'inline-block',
            'height': '100%',
            'vertical-align': 'middle'
        });
        container.append(helper);
        var label = $(document.createElement('div'));
        label.attr('class', 'sortLabelText');
        label.css({
            'width': width,
            'vertical-align': 'middle',
            'padding-left': '4%'
        });

        label.text(text);
        container.append(label); 
        return container; 
    }


    /**Add artworks to collections in the Artwork Tab
     * @method addArtworksToCollections 
     */
    function addArtworksToCollections(artworks) { 
        if (!artworks.length) {
            return;
        }

        //Opens a popup to choose collection(s) to add the artworks list to
        TAG.Util.UI.createAssociationPicker(root, "Add Artworks to Collections",
                { comp: artworks, type: 'artworkMulti' , modifiedButtons: true},
                'exhib', [{
                    name: 'All Collections',
                    getObjs: TAG.Worktop.Database.getExhibitions,
                }], {
                    getObjs: function () { return [];}, //TODO how to get the collections that an artwork is already in
                }, function () {
                    prepareNextView(true, "New", createExhibition);
                    clearRight();
                    prepareViewer(true);
                    loadExhibitionsView(currArtwork.Identifier);
                }
        );
    }

    /**Add tours to collections in the Tours Tab
     * @method addToursToCollections
     */
    function addToursToCollections(tours) { //todo - use an array instead of a single tour (once multiselect is implemented)
        if (!tours.length) {
            return;
        }

        //Opens a popup to choose collection(s) to add the tours to
        TAG.Util.UI.createAssociationPicker(root, "Add Tours to Collections",
                { comp: tours, type: 'artworkMulti', modifiedButtons: true },
                'exhib', [{
                    name: 'All Collections',
                    getObjs: TAG.Worktop.Database.getExhibitions,
                }], {
                    getObjs: function () { return []; }, //TODO how to get the collections that the tour is already in
                }, function () {
                    prepareNextView(true, "New", createExhibition);
                    clearRight();
                    prepareViewer(true);
                    loadExhibitionsView(currTour.Identifier);
                }
        );
    }

    /**Add associated medias to artworks
     * @method addToursToCollections
     */
    function addAssocMediaToArtworks(assocMedia) {
        if (!assocMedia.length) {
            return;
        }

        //Opens a popup to choose artwork(s) to associate Associated Media(s) to
        TAG.Util.UI.createAssociationPicker(root, "Associate with Artworks",
                { comp: assocMedia, type: 'mediaMulti', modifiedButtons: true },
                'artwork', [{
                    name: 'All Artworks',
                    getObjs: TAG.Worktop.Database.getArtworks,
                }], {
                    getObjs: function () { return []; }, 
                }, function () {
                    prepareNextView(true, "New", createArtwork);
                    clearRight();
                    prepareViewer(true);
                    loadExhibitionsView(currArtwork.Identifier);
                }
        );
    }

    /*nest source tag inside video element*/
    function addSourceToVideo(element, src, type) {
        var source = document.createElement('source');

        source.src = src;
        source.type = type;

        element[0].appendChild(source);
    }
    /**Loads an artwork to the right side
     * @method loadArtwork
     * @param {Object} artwork  artwork to load
     */
    function loadArtwork(artwork) {
        //$(document).off();
        if (cancelArtworkLoad) cancelArtworkLoad();
        prepareViewer(true);
        clearRight();
        deleteType = deleteArtwork;
        toDelete = artwork;
        clearInterval(checkConTimerId);
        currDoq = artwork.Identifier;
        currArtwork = artwork;
        // Create an img element to load the image
        var mediaElement;
        var cancel = false;

        prevMiddleBarSelection = {
            type_representation: "Artwork",
            time_spent_timer: new TelemetryTimer()
        };

        if (artwork.Metadata.Type !== 'VideoArtwork') {
            mediaElement = $(document.createElement('img'));
            mediaElement.attr('src', TAG.Worktop.Database.fixPath(artwork.URL));
        } else {
            /*
            mediaElement = $(document.createElement('video'));
            mediaElement.attr('id', 'videoInPreview');
            fixVolumeBar(mediaElement);
            mediaElement.attr('poster', (artwork.Metadata.Thumbnail && !artwork.Metadata.Thumbnail.match(/.mp4/)) ? TAG.Worktop.Database.fixPath(artwork.Metadata.Thumbnail) : '');
            mediaElement.attr('identifier', artwork.Identifier);
            mediaElement.attr("preload", "none");
            mediaElement.attr("controls", "");
            mediaElement.css({ "width": "100%", "max-width": "100%", "max-height": "100%" });
            var source = TAG.Worktop.Database.fixPath(artwork.Metadata.Source);

            TAG.Worktop.Database.getConvertedVideoCheck(
                function (output) {
                    if (output !== "" && output !== "False" && output !== "Error") {
                        var sourceWithoutExtension = source.substring(0, source.lastIndexOf('.'));
                        var sourceMP4 = sourceWithoutExtension + ".mp4";
                        var sourceWEBM = sourceWithoutExtension + ".webm";
                        var sourceOGV = sourceWithoutExtension + ".ogv";

                        addSourceToVideo(mediaElement, sourceMP4, 'video/mp4');
                        addSourceToVideo(mediaElement, sourceWEBM, 'video/webm');
                        addSourceToVideo(mediaElement, sourceOGV, 'video/ogv');
                        $(document.getElementsByClassName("convertVideoBtn")[0]).hide().data('disabled', true);
                    } else {
                        if (output === "False") {
                            $(document.getElementsByClassName("convertVideoBtn")[0]).hide().data('disabled', true);
                            $("#videoErrorMsg").remove();
                            $("#leftLoading").remove();
                            var msg = "This video is being converted to compatible formats for different browsers";
                            viewer.append(TAG.Util.createConversionLoading(msg));
                            conversionVideos.push(artwork.Identifier);
                        } else if (output === "Error") {
                            $("#videoErrorMsg").remove();
                            $("#leftLoading").remove();
                            var msg = "An error occured when converting this video. Please try again";
                            viewer.append(TAG.Util.createConversionLoading(msg, true));
                        } else {
                            //if (artwork.Extension !== ".mp4") {
                            $("#videoErrorMsg").remove();
                            $("#leftLoading").remove();
                            var msg = "This video format has not been converted to formats supported in multiple browsers.";
                            viewer.append(TAG.Util.createConversionLoading(msg, true));
                            //}
                        }
                        mediaElement.attr('src', source);
                    }
                }, null, artwork.Identifier);
            if (conversionVideos.indexOf(artwork.Identifier) > -1) {
                $("#videoErrorMsg").remove();
                $("#leftLoading").remove();
                var msg = "This video is being converted to compatible formats for different browsers";
                viewer.append(TAG.Util.createConversionLoading(msg));
            } else {
                mediaElement[0].onerror = TAG.Util.videoErrorHandler(mediaElement, viewer, artwork.Metadata.Converted);
            }
            */
            mediaElement = $(document.createElement('video'));
            mediaElement.attr('id', 'videoInPreview');
            fixVolumeBar(mediaElement);
            mediaElement.attr('poster', (artwork.Metadata.Thumbnail && !artwork.Metadata.Thumbnail.match(/.mp4/)) ? TAG.Worktop.Database.fixPath(artwork.Metadata.Thumbnail) : '');
            mediaElement.attr('identifier', artwork.Identifier);
            mediaElement.attr("preload", "none");
            mediaElement.attr("controls", "");
            mediaElement.css({ "width": "100%", "max-width": "100%", "max-height": "100%" });
            var source = TAG.Worktop.Database.fixPath(artwork.Metadata.Source);
            var sourceWithoutExtension = source.substring(0, source.lastIndexOf('.'));
            var sourceExt = source.substring(source.lastIndexOf('.'));
            var videoErrorDiv = $(document.createElement('div'));
            videoErrorDiv.addClass("videoErrorDiv");

            mediaElement.attr("fileName", artwork.Metadata.Source.substring(0, source.lastIndexOf('.')));
            TAG.Worktop.Database.getConvertedVideoCheck(
                function (output) {
                    if (output === "True" || sourceExt === ".mp4" || output === "true") {
                        clearInterval(checkConTimerId);
                        var sourceMP4 = sourceWithoutExtension + ".mp4";
                        var sourceWEBM = sourceWithoutExtension + ".webm";
                        var sourceOGV = sourceWithoutExtension + ".ogv";

                        addSourceToVideo(mediaElement, sourceMP4, 'video/mp4');
                        addSourceToVideo(mediaElement, sourceWEBM, 'video/webm');
                        addSourceToVideo(mediaElement, sourceOGV, 'video/ogv');
                        mediaElement[0].onerror = TAG.Util.videoErrorHandler(mediaElement, viewer);
                        viewer.append(mediaElement);
                        if (sourceExt === '.mp4') {
                            if (output === "False") {
                                var msg = "This video is being converted to compatible formats for different browsers";
                                checkConTimerId = setInterval(function () { checkConversion(artwork) }, 2000);
                                viewer.append(TAG.Util.createConversionLoading(msg, null, true));
                            } else if (output === "Error") {
                                var msg = "An error occured when converting this video. Please try to upload again";
                                viewer.append(TAG.Util.createConversionLoading(msg, true, true));
                            }
                        }
                    } else {
                        if (output === "False") {
                            //$(document.getElementsByClassName("convertVideoBtn")[0]).hide();
                            $("#videoErrorMsg").remove();
                            $("#leftLoading").remove();
                            var msg = "This video is being converted to a compatible format";
                            viewer.append(TAG.Util.createConversionLoading(msg));
                            checkConTimerId = setInterval(function () { checkConversion(artwork) }, 2000);
                        } else if (output === "Error") {
                            //$(document.getElementsByClassName("convertVideoBtn")[0]).show();
                            $("#videoErrorMsg").remove();
                            $("#leftLoading").remove();
                            var msg = "An error occured when converting this video. Please try to upload again";
                            if (sourceExt === ".mp4") {
                                viewer.append(TAG.Util.createConversionLoading(msg, true, true));
                            } else {
                                viewer.append(TAG.Util.createConversionLoading(msg, true));
                            }
                        } else if (output === null) {
                            TAG.Worktop.Database.convertVideo(function () {
                            }, null, source, sourceExt, sourceWithoutExtension, artwork.Identifier);
                        }
                    }
                }, null, artwork.Identifier);
        }
        mediaElement.crossOrigin = "";
        // Create a progress circle
        var progressCircCSS = {
            'position': 'absolute',
            'left': '40%',
            'top': '40%',
            'z-index': '50',
            'height': 'auto',
            'width': '20%'
        };
        var circle;
        if (artwork.Metadata.Type !== 'VideoArtwork') {
            circle = TAG.Util.showProgressCircle(viewer, progressCircCSS, '0px', '0px', false);
        }
        var selectedLabel = prevSelectedMiddleLabel;

        if (artwork.Metadata.Type !== 'VideoArtwork') {
            mediaElement.load(function () {
                // If the selection has changed since we started loading then return
                if (prevSelectedMiddleLabel && prevSelectedMiddleLabel.text() !== artwork.Name) {
                    TAG.Util.removeProgressCircle(circle);
                    return;
                }
                TAG.Util.removeProgressCircle(circle);
                // Set the image as a background image
                viewer.css('background', 'black url(' + TAG.Worktop.Database.fixPath(artwork.URL) + ') no-repeat center / contain');
            });
        } else {

        }

        

        // Lock artwork setting: Only one artwork per server
        var isLocked;

        TAG.Worktop.Database.getMain(function () {
            var titleInput = createTextInput(TAG.Util.htmlEntityDecode(artwork.Name), "Artwork Title", 100);
            var artistInput = createTextInput(TAG.Util.htmlEntityDecode(artwork.Metadata.Artist), "Artist", 100);
            var descInput = createTextAreaInput(TAG.Util.htmlEntityDecode(artwork.Metadata.Description).replace(/\n/g, '<br />') || "", "", false, 2000);

            titleInput.on('keyup', function (event) {
                if (event.which === 13) {
                    saveButton.click();
                } else {
                    changesMade = true;
                    saveButton.prop("disabled", false);
                    saveButton.css("opacity", 1);
                }

            });

            artistInput.on('keyup', function (event) {
                if (event.which === 13) {
                    saveButton.click();
                } else {
                    changesMade = true;
                    saveButton.prop("disabled", false);
                    saveButton.css("opacity", 1);
                }

            });

            descInput.on('keyup', function () {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
            });

            var customInputs = {};
            var customSettings = {};

            var saveButton;
            var yearMetadataDivSpecs = createYearMetadataDiv(artwork, function (event) {
                if (event && event.which === 13) {
                    saveButton.click();
                } else {
                    changesMade = true;
                    saveButton.prop("disabled", false);
                    saveButton.css("opacity", 1);
                }
            });


            titleInput.focus(function () {
                if (titleInput.val() === 'Title')
                    titleInput.select();
            });
            artistInput.focus(function () {
                if (artistInput.val() === 'Artist')
                    artistInput.select();
            });
            descInput.focus(function () {
                if (descInput.val() === 'Description')
                    descInput.select();
            });

            onChangeUpdateText(titleInput, null, 100);
            onChangeUpdateText(artistInput, null, 100);
            onChangeUpdateText(yearMetadataDivSpecs.yearInput, null, 100);
            onChangeUpdateText(descInput, null, 5000);

            var desc = createSetting('Description', descInput);
            var title = createSetting('Title', titleInput);
            var artist = createSetting('Artist', artistInput);

            if (artwork.Metadata.InfoFields) {
                $.each(artwork.Metadata.InfoFields, function (key, val) {
                    customInputs[key] = createTextInput(TAG.Util.htmlEntityDecode(val), "Metadata Field");
                    customSettings[key] = createSetting(key, customInputs[key]);
                });
            }


            settingsContainer.append(title);
            settingsContainer.append(artist);
            settingsContainer.append(desc);
            settingsContainer.append(yearMetadataDivSpecs.yearMetadataDiv);

            $.each(customSettings, function (key, val) {
                settingsContainer.append(val);
            });



            if (cancel) return;
            isLocked = TAG.Worktop.Database.getLocked();
            //Get locked artwork GUID
            var unlockedInput = createButton('Unlocked', function () {
                //if (localVisibility) { changesHaveBeenMade = true; };
                isLocked = "";
                unlockedInput.css('background-color', 'white');
                lockedInput.css('background-color', '');
            }, {
                'min-height': '0px',
                'margin-right': '4%',
                'width': '48%',
            });
            var lockedInput = createButton('Locked', function () {
                //if (!localVisibility) { changesHaveBeenMade = true; };
                isLocked = artwork.Identifier;
                lockedInput.css('background-color', 'white');
                unlockedInput.css('background-color', '');
            }, {
                'min-height': '0px',
                'width': '48%',
            });

            //Color the appropriate button
            if (isLocked === artwork.Identifier) {
                lockedInput.css('background-color', 'white');
            } else {
                unlockedInput.css('background-color', 'white');
            }

            var lockedDiv = $(document.createElement('div'));
            lockedDiv.append(lockedInput).append(unlockedInput);

            lockedInput.click(function () {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
                TAG.Telemetry.recordEvent('LockToArtwork', function(tobj) {
                    tobj.toggle_state = true;                                
                });

            });

            unlockedInput.click(function () {
                changesMade = true;
                saveButton.prop("disabled", false);
                saveButton.css("opacity", 1);
                TAG.Telemetry.recordEvent('LockToArtwork', function(tobj) {
                    tobj.toggle_state = false;                                
                });
            });
            var lockedSetting = createSetting('Lock to this artwork', lockedDiv);
            settingsContainer.append(lockedSetting);


            //Automatically save changes
            //currentMetadataHandler = function () {
            //    if (titleInput.val() === undefined || titleInput.val() === "") {
            //        titleInput.val("Untitled Artwork");
            //    }
            //    saveArtwork(artwork, {
            //        artistInput: artistInput,                                      //Artwork artist
            //        nameInput: titleInput,                                         //Artwork title
            //        yearInput: $(yearMetadataDivSpecs.yearInput),                     //Artwork year or era
            //        monthInput: yearMetadataDivSpecs.monthInput,                   //Artwork month
            //        dayInput: yearMetadataDivSpecs.dayInput,                       //Artwork day
            //        timelineYearInput: yearMetadataDivSpecs.timelineYearInput,     //Artwork year on timeline
            //        timelineMonthInput: yearMetadataDivSpecs.timelineMonthInput,   //Artwork month on timeline 
            //        timelineDayInput: yearMetadataDivSpecs.timelineDayInput,       //Artwork day on timeline 
            //        descInput: descInput,                                          //Artwork description
            //        customInputs: customInputs                                    //Artwork custom info fields
            //    });
            //};

            // Create buttons
            editArt = createButton('Artwork Editor',
                function () { editArtwork(artwork); },
                {
                    'margin-left': '2%',
                    'margin-top': '1%',
                    'margin-right': '0%',
                    'margin-bottom': '3%',
                });

            TAG.Telemetry.register(editArt, "click", "EditorButton", function (tobj) {
                tobj.edit_type = "Artwork Editor";
                tobj.element_id = artwork.Identifier;
            });
            leftButton = editArt;
            editArt.attr("id", "artworkEditorButton");

            var deleteArt = createButton('Delete',
                function () { deleteArtwork(multiSelected); },
                {
                    'margin-left': '2%',
                    'margin-top': '1%',
                    'margin-right': '0%',
                    'margin-bottom': '3%',
                });
            /*if (isLocked == artwork.Identifier) {
                deleteBlankButton.prop("disabled", true);
                deleteBlankButton.css({
                    "opacity": "0.5"
                });
            }*/
            var inputs = {
                artistInput: artistInput,                                      //Artwork artist
                nameInput: titleInput,                                         //Artwork title
                yearInput: $(yearMetadataDivSpecs.yearInput),                     //Artwork year or era
                monthInput: yearMetadataDivSpecs.monthInput,                   //Artwork month
                dayInput: yearMetadataDivSpecs.dayInput,                       //Artwork day
                timelineYearInput: yearMetadataDivSpecs.timelineYearInput,     //Artwork year on timeline
                timelineMonthInput: yearMetadataDivSpecs.timelineMonthInput,   //Artwork month on timeline 
                timelineDayInput: yearMetadataDivSpecs.timelineDayInput,       //Artwork day on timeline 
                descInput: descInput,                                          //Artwork description
                customInputs: customInputs                                    //Artwork custom info fields
            };
            saveButton = createButton('Save',
                function () {
                    if (titleInput.val() === undefined || titleInput.val() === "") {
                        titleInput.val("Untitled Artwork");
                    }
                    saveArtwork(artwork, {
                        artistInput: artistInput,                                      //Artwork artist
                        nameInput: titleInput,                                         //Artwork title
                        yearInput: $(yearMetadataDivSpecs.yearInput),                  //Artwork year or era
                        monthInput: yearMetadataDivSpecs.monthInput,                   //Artwork month
                        dayInput: yearMetadataDivSpecs.dayInput,                       //Artwork day
                        timelineYearInput: yearMetadataDivSpecs.timelineYearInput,     //Artwork year on timeline
                        timelineMonthInput: yearMetadataDivSpecs.timelineMonthInput,   //Artwork month on timeline 
                        timelineDayInput: yearMetadataDivSpecs.timelineDayInput,       //Artwork day on timeline 
                        descInput: descInput,                                          //Artwork description
                        locked: isLocked,                                                //Whether locked into artwork
                        customInputs: customInputs                                     //Artwork custom info fields
                    });
                }, {
                    'margin-right': '3%',
                    'margin-top': '1%',
                    'margin-bottom': '1%',
                    'margin-left': '.5%',
                    'float': 'right'
                }, true);
            TAG.Telemetry.register(saveButton, "click", "SaveButton", function (tobj) {
                tobj.element_type = "Artwork";
            });
            var xmluploaderbtn = createButton('Upload XML',
                            function () {
                                uploadXML(artwork, inputs, settingsContainer);
                            },
                            {
                                'margin-left': '2%',
                                'margin-top': '1%',
                                'margin-right': '0%',
                                'margin-bottom': '3%',
                            });


            var thumbnailButton = createButton('Capture Thumbnail',
                function () {
                    saveThumbnail(artwork, true);
                }, {
                    'margin-right': '0%',
                    'margin-top': '1%',
                    'margin-bottom': '1%',
                    'margin-left': '2%',
                    'float': 'left'
                });
            thumbnailButton.attr('id', 'thumbnailButton');
            if (artwork.Metadata.Type !== 'VideoArtwork') { //REAPPEND DELETE BUTTON HERE
                buttonContainer.append(editArt).append(saveButton); //.append(xmluploaderbtn); // for win8 aug 15 release only
                if(!IS_WINDOWS){
                    buttonContainer.append(deleteArt);
                }
                //searchContainer.append(deleteArt);
                //deleteBlankButton = deleteArt;
            } else {
                buttonContainer.append(saveButton);//.append(xmluploaderbtn); // for win8 aug 15 release only

              
            }

            saveButton.on("mousedown", function () {
                if (!saveButton.attr("disabled")) {
                    saveButton.css({ "background-color": "white" });
                }
            });
            thumbnailButton.on("mousedown", function () {
                thumbnailButton.css({ "background-color": "white" });
            });
            xmluploaderbtn.on("mousedown", function () {
                xmluploaderbtn.css({ "background-color": "white" });
            });
            TAG.Telemetry.register(deleteArt, "click", "DeleteButton", function (tobj) {
                tobj.element_type = "Artwork";
            });
            deleteArt.on("mousedown", function () {
                deleteArt.css({ "background-color": "white" });
            });
            editArt.on("mousedown", function () {
                editArt.css({ "background-color": "white" });
            });
            saveButton.on("mouseleave", function () {
                saveButton.css({ "background-color": "transparent" });
            });
            thumbnailButton.on("mouseleave", function () {
                thumbnailButton.css({ "background-color": "transparent" });
            });
            xmluploaderbtn.on("mouseleave", function () {
                xmluploaderbtn.css({ "background-color": "transparent" });
            });
            deleteArt.on("mouseleave", function () {
                deleteArt.css({ "background-color": "transparent" });
            });
            editArt.on("mouseleave", function () {
                editArt.css({ "background-color": "transparent" });
            });
            newButton.on("mouseleave", function () {
                newButton.css({ "background-color": "transparent" });
            });


            /*if (artwork.Metadata.Type !== 'VideoArtwork') {
                buttonContainer.append(editArt).append(deleteArt).append(saveButton).append(xmluploaderbtn); //SAVE BUTTON//
            } else {
                var convertBtn = createButton('Convert Video',
                        function () {
                            var source = artwork.Metadata.Source;
                            var newFileName = source.slice(8, source.length);
                            var index = newFileName.lastIndexOf(".");
                            var fileExtension = newFileName.slice(index);
                            var baseFileName = newFileName.slice(0, index);
                            if (artwork.Metadata.Converted !== "True") {
                                TAG.Worktop.Database.convertVideo(function () {
                                }, null, newFileName, fileExtension, baseFileName, artwork.Identifier);
                                conversionVideos.push(artwork.Identifier);
                                $("#videoErrorMsg").remove();
                                $("#leftLoading").remove();
                                var msg = "This video is being converted to compatible formats for different browsers";
                                viewer.append(TAG.Util.createConversionLoading(msg));
                                mediaElement[0].onerror = TAG.Util.videoErrorHandler(mediaElement, viewer, "False");
                                convertBtn.hide().data('disabled', true);
                            }
                        }, {
                            'margin-right': '0%',
                            'margin-top': '1%',
                            'margin-bottom': '3%',
                            'margin-left': '2%',
                            'float': 'left'
                        })
                convertBtn.attr('class', 'button convertVideoBtn');
                convertBtn.attr("disabled", "");
                if (artwork.Metadata.Converted !== "True" && conversionVideos.indexOf(artwork.Identifier) === -1) {
                    convertBtn.show().data('disabled', false);
                } else {
                    convertBtn.hide().data('disabled', true);
                }
                buttonContainer.append(thumbnailButton).append(saveButton).append(convertBtn).append(xmluploaderbtn).append(deleteArt); //SAVE BUTTON//
            }*/
        });
        cancelArtworkLoad = function () { cancel = true; };
    }

    /**Save Thumbnail image 
     * @method saveThumbnail
     * @param {Object} component
     * @param {Boolean} isArtwork
     */
    function saveThumbnail(component, isArtwork) {
        var id = $('#videoInPreview').attr('identifier');
        var pop = Popcorn('#videoInPreview');
        var time = $('#videoInPreview')[0].currentTime;
        var dataurl = pop.capture({ type: 'jpg' }); // modified popcorn.capture a bit to
        prepareNextView(false, null, null, "Saving...");
        clearRight();
        prepareViewer(true);
        TAG.Worktop.Database.uploadImage(dataurl, function (imageURL) {
            if (isArtwork) {
                TAG.Worktop.Database.changeArtwork(id, { Thumbnail: imageURL }, function () {
                    console.log("success?")
                    loadArtView(component.Identifier);
                }, unauth, conflict, error);
            
            } else { // here, it must be a video assoc media
                TAG.Worktop.Database.changeHotspot(id, { Thumbnail: imageURL }, function () {
                    console.log("success?");
                    loadAssocMediaView(component.Identifier);
                }, unauth, conflict, error);
            }
        }, unauth, error);
    }

    function unauth() {
        dialogOverlay.hide();
        var popup = TAG.Util.UI.popUpMessage(null, "Thumbnail not saved.  You must log in to save changes.");
        $('body').append(popup);
        $(popup).show();
    }

    function conflict(jqXHR, ajaxCall) {
        ajaxCall.force();
    }

    function error() {
        dialogOverlay.hide();
        var popup = TAG.Util.UI.popUpMessage(null, "Thumbnail not saved.  There was an error contacting the server.");
        $('body').append(popup);
        $(popup).show();
    }

    function hideUploadingProgress() {
        //updates loading UI
        console.log("FINISHED THE UPLOAD PROCESS")
        var settingsViewTopBar = $(document.getElementById("setViewTopBar"));
        $('.progressBarUploads').remove()
    }

    /**Create an artwork (import), possibly more than one
     * @method createArtwork
     */
    function createArtwork(fromImportPopUp) {
        uploadFile(TAG.Authoring.FileUploadTypes.DeepZoom, function (urls, names, contentTypes, files) {
            var check, i, url, name, done = 0, total = urls.length, durations = [], toScroll, alphaName;

            //implementing background uploads - david
            console.log("createArtwork called")
            hideUploadingProgress();
            //prepareNextView(false);
            //clearRight();
            //prepareViewer(true);

            //webappfileupload
            if (!IS_WINDOWS){
                if(!total) {
                    if(isArtView==true){
                        loadArtView();
                    }
                }
            }

            function incrDone() {
                done++;
                //webappfileupload
                if (!IS_WINDOWS){
                    if (done >= total || !total) {
                        middleLoading.hide();
                        if(isArtView==true){ //scroll down to newly-added artwork
                            loadArtView(toScroll.Identifier);   
                        }

                    } else {
                        durationHelper(done);
                    }
                } else {
                    if (done >= total) {
                        if(isArtView==true){
                            loadArtView(toScroll.Identifier);   
                        }    //Scroll down to a newly-added artwork
                    } else {
                        durationHelper(done);
                    }
                }
            }

            //////////
            if (files.length > 0) {
                durationHelper(0);
            }

            function durationHelper(j) {
                if (contentTypes[j] === 'Video') {

                    //webappfileupload
                    if (!IS_WINDOWS){
                        var videoElement = $(document.createElement('video'));
                        videoElement.attr('preload', 'metadata');   //Instead of waiting for whole video to load, just load metadata
                        var videoURL = URL.createObjectURL(files[j]);
                        videoElement.attr('src', videoURL);
                        videoElement.on('loadedmetadata', function() {
                            var dur = this.duration;
                            durations.push(dur);
                            updateDoq(j);
                        });
                    } else {
                        files[j].properties.getVideoPropertiesAsync().done(function (VideoProperties) {
                            durations.push(VideoProperties.duration / 1000); // duration in seconds
                            updateDoq(j);
                        }, function (err) {
                            console.log(err);
                        });
                    }
                } else {
                    durations.push(null);
                    updateDoq(j);
                }
            }
            ///////////
            function updateDoq(j) {
                var newDoq;
                try {
                    newDoq = new Worktop.Doq(urls[j]);
                } catch (error) {
                    done++;
                    console.log("error in uploading: " + error.message);
                    return;
                }
                var ops = { Name: names[j] };
                if (durations[j]) {
                    ops.Duration = durations[j];
                }
                if (!alphaName || names[j] < alphaName) {
                    toScroll = newDoq;                          //Alphabetical order
                    alphaName = names[j];
                }
                TAG.Worktop.Database.changeArtwork(newDoq.Identifier, ops, incrDone, TAG.Util.multiFnHandler(authError, incrDone), TAG.Util.multiFnHandler(conflict(newDoq, "Update", incrDone)), error(incrDone));
                var source = newDoq.Metadata.Source;
                var newFileName = source.slice(8, source.length);
                var index = newFileName.lastIndexOf(".");
                var fileExtension = newFileName.slice(index);
                var baseFileName = newFileName.slice(0, index);
                if (contentTypes[j] === "Video") {
                    TAG.Worktop.Database.convertVideo(function () {
                    }, null, newFileName, fileExtension, baseFileName, newDoq.Identifier);
                }
                /*var source = newDoq.Metadata.Source;
                if (contentTypes[j] === "Video") {
                    var newFileName = source.slice(8, source.length);
                    var index = newFileName.lastIndexOf(".");
                    var fileExtension = newFileName.slice(index);
                    var baseFileName = newFileName.slice(0, index);
                    var confirmBox = TAG.Util.UI.PopUpConfirmation(function () {
                        TAG.Worktop.Database.convertVideo(function () {
                        }, null, newFileName, fileExtension, baseFileName, newDoq.Identifier);
                        conversionVideos.push(newDoq.Identifier);
                        var mediaElement = $(document.getElementById("videoInPreview"));
                        if (mediaElement[0]) {
                            var msg = "This video is being converted to compatible formats for different browsers";
                            viewer.append(TAG.Util.createConversionLoading(msg));
                            $("#videoErrorMsg").remove();
                        }
                        $(".convertVideoBtn").hide().data("disabled", true);
                    }, "Would you like to convert " + newFileName + "?", "Yes", true, function () {
                        if (fileExtension !== ".mp4") {
                            var msg = "This video format has not been converted to formats supported in multiple browsers.";
                            viewer.append(LADS.Util.createConversionLoading(msg, true));
                        }
                        $(".convertVideoBtn").show().data("disabled", false);
                    });

                    root.append(confirmBox);
                    $(confirmBox).show();
                }*/
            }

        }, true, ['.jpg', '.png', '.gif', '.tif', '.tiff', '.mp4', '.webm', '.ogv','.avi','.mov','.wmv'], fromImportPopUp);
    }

   // var optionButtons = document.getElementById('optionButtons');
    //console.log(optionButtons == null);


    /*upload xml for single artwork
   artwork
   inputs: all the input fields in the settingsContainer
   settingsContainer
   */


    function uploadXML(artwork, inputs, settingsContainer) {
        var parsingOverlay = $(TAG.Util.UI.blockInteractionOverlay()).addClass("parsingOverlay"),
            parsingOverlayText = $(document.createElement('label')).addClass("parsingOverlayText").text('Parsing Metadata file now. Please wait.'),
            parsingPicker = $(document.createElement('div')).addClass("parsingPicker"),
            parsingPickerHeader = $(document.createElement('div')).addClass("parsingPickerHeader").text("Please update the input fields below to match the input fields in your XML file."),
            parsingInfo = $(document.createElement('div')).addClass("parsingInfo"),
            parsingPickerConfirm = $(document.createElement('button')).attr("id", "parsingPickerConfirm").text("Confirm"),
            parsingPickerCancel = $(document.createElement('button')).attr("id", "parsingPickerCancel").text("Cancel"),
            curtitle = artwork.Name,
            curdata,
            isrightdata = false,
            customFields = [],
            mtinputs = {};
        parsingPickerConfirm.css('border-radius', '3.5px');
        parsingPickerCancel.css('border-radius', '3.5px');
        parsingOverlay.css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex);
        parsingOverlay.append(parsingOverlayText);
        parsingOverlayText.hide();

        parsingPicker.append(parsingPickerHeader);
        parsingPicker.append(parsingInfo);
        parsingPicker.append(parsingPickerCancel);
        parsingPicker.append(parsingPickerConfirm);

        parsingOverlay.append(parsingPicker);

        root.append(parsingOverlay);

        parsingOverlay.fadeIn();

        //Metadata input fields
        if (artwork.Metadata.InfoFields) {
            customFields = Object.keys(artwork.Metadata.InfoFields);
        };
        var metadataspec = {
            title: "title",
            description: "description",
            year: "year",
            artist: "artist",
            extra1: customFields[0] || "",
            extra2: customFields[1] || "",
            extra3: customFields[2] || "",
            extra4: customFields[3] || "",
        };
        $.each(metadataspec, function (key, val) {
            var input = createTextInput(val, "Metadata Field", null, false, false);
            var field = createSetting(key, input, null, '7px');
            field.addClass("metadataspec");
            $(field).css({
                'margin': '0px 0px 2px 0px',
                padding: '1% 7% 1% 1%',
                width:'92%',
            });
            $(field).children(":first").css({ color: 'white', 'font-style': 'normal', 'vertical-align': 'top' });
            $(field).children().eq(1).css({ margin: '0 auto', 'font-size':'60%'});
            mtinputs[key] = input;// { field: field, input: input };
            field.show().data('visible', true);
            parsingInfo.append(field);
        });

        //Confirm button
        parsingPickerConfirm.click(function () {
            //parsingPickerOverlay.fadeOut();
            $.each(metadataspec, function (key, val) {
                // update spec according to inputs val
                var newval = mtinputs[key].val();
                //if (newval !== val){// && newval!=="") {
                metadataspec[key] = newval;
                //}
            });
            parsingPicker.fadeOut();
            initFilepicker(metadataspec);
        });

        //Cancel button
        parsingPickerCancel.click(function () {
            parsingOverlay.fadeOut();
            parsingPickerCancel.disabled = true;
        });

        function initFilepicker(spec) {
            var filepicker = new Windows.Storage.Pickers.FileOpenPicker();
            filepicker.fileTypeFilter.replaceAll([".xml"]);
            filepicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.desktop;
            filepicker.pickSingleFileAsync().then(function (file) {
                if (!file) {
                    parsingOverlay.fadeOut();
                }
                if (file) {
                    parsingOverlayText.fadeIn();
                    var size;
                    var maxFileSize = 30 * 1024 * 1024;
                    var toparse;
                    file.getBasicPropertiesAsync().then(
                        function (basicProperties) {
                            size = basicProperties.size;
                            if (size < maxFileSize) {
                                toparse = true;
                                parsefile();
                            } else {
                                parsingOverlay.fadeOut();
                                var warningBox = TAG.Util.UI.PopUpConfirmation(function () {
                                    toparse = true;
                                    parsefile();
                                }, "The file is larger than 30MB. Parsing it might crash your computer. Are you sure you want to continue?", "Confirm", true, function () {
                                    toparse = false;
                                });
                                root.append(warningBox);
                                $(warningBox).show();
                                TAG.Util.multiLineEllipsis($($($(warningBox).children()[0]).children()[0]));
                            }

                            //picked the xml file and parse the strings
                            function parsefile() {
                                $.ajax({
                                    type: "GET",
                                    url: window.URL.createObjectURL(file),
                                    dataType: "xml",
                                    success: function (xml) {
                                        // Parse the xml file and get data
                                        var lists = [];
                                        var elements = xml.documentElement.childNodes;
                                        var i, curname;
                                        for (i = 0; i < elements.length; i++) {//each artwork
                                            if (isrightdata === false) {
                                                curname = elements[i].localName;
                                                if (curname !== null) {
                                                    var metadatas = elements[i].childNodes;
                                                    var list = {};
                                                    var j, name;
                                                    for (j = 0; j < metadatas.length; j++) {//each metadata field in the artwork
                                                        name = metadatas[j].localName;
                                                        if (name !== null) {
                                                            name = name.toLowerCase();
                                                            if (metadatas[j].childNodes[0]) {
                                                                list[name] = metadatas[j].childNodes[0].nodeValue;
                                                                if (name === spec.title && metadatas[j].childNodes[0].nodeValue === curtitle) {
                                                                    isrightdata = true;
                                                                }
                                                            } else {
                                                                list[name] = "";
                                                            }
                                                        }
                                                    }
                                                    lists.push(list);
                                                    if (isrightdata === true) {
                                                        curdata = list;
                                                        break;
                                                    }
                                                }
                                            }
                                        }

                                        if (isrightdata === true) {
                                            //find the match and update the artwork info using curdata
                                            //$(".parsingOverlay").fadeOut();
                                            updateArtwork(artwork, inputs, curdata, settingsContainer, spec);
                                            $(".parsingOverlay").remove();

                                        } else {//make a metadata picker for them to choose the metadata they want if no match found
                                            _metadatapicker(artwork, inputs, settingsContainer, lists, spec);
                                            $(".parsingOverlay").remove();

                                        }
                                    },
                                    error: function () {
                                        $(".parsingOverlay").remove();
                                        var popupmsg = TAG.Util.UI.popUpMessage(null, "Error occured when parsing xml. Please double check your file", "OK", null, null, null, true);
                                        $(popupmsg).show();
                                        root.append(popupmsg);
                                    }
                                });
                            }
                        });

                }
            });
            //$(".parsingOverlay").remove();
        }
    }
    /*update artwork inputs after parse xml file
    @param: artwork: the artwork you are going to update metadata for
        inputs: all the input fields on settingsContainer. 
        data: the metadata that is going to be updated for the artwork
    */
    function updateArtwork(artwork, inputs, data, settingsContainer, spec) {
        var counter = 0;//counter to keep track of customfields. now 4max
        var infoFields = {};
        var customSettings = {};

        var title = data[spec.title];
        var artist = data[spec.artist];
        var year = data[spec.year];
        var description = data[spec.description];
        var ele;
        var curval;
        if (!title)
            title = "";
        delete data[spec.title];
        delete spec.title;
        if (!year)
            year = "";
        delete data[spec.year];
        delete spec.year;
        if (!artist)
            artist = "";
        delete data[spec.artist];
        delete spec.artist;
        if (!description)
            description = "";
        delete data[spec.description];
        delete spec.description;
        $.each(spec, function (key, val) {
            if (val !== "") {
                infoFields[val] = "";
            }
        });
        if (Object.keys(data).length > 0) {//if there are more fields:
            $.each(infoFields, function (key, val) {
                curval = data[key];
                if (curval) {
                    delete data[key];
                    infoFields[key] = curval;
                }
                delete spec[key];
                counter++;
            });
            for (ele in data) {
                if (counter < 2) {
                    infoFields[ele] = data[ele];
                    // create input field for new cus field
                    inputs.customInputs[ele] = createTextInput(TAG.Util.htmlEntityDecode(data[ele]), "Metadata Field");
                    customSettings[ele] = createSetting(ele, inputs.customInputs[ele]);
                    counter++;
                }
            }

            $.each(customSettings, function (key, val) {
                settingsContainer.append(val);
            });

        }
        //$(".parsingOverlay").remove();
        prepareNextView(false, null, null, "Saving...");
        clearRight();
        prepareViewer(true);
        TAG.Worktop.Database.changeArtwork(artwork, {
            Name: title,
            Artist: artist,
            Year: year,
            Description: description,
            InfoFields: JSON.stringify(infoFields),
        }, function () {
            if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.art.text]) {
                return;
            }
            loadArtView(artwork.Identifier);
        }, authError, conflict(artwork, "Update", loadArtView), error(loadArtView));
    }
    /*a picker for user to choose metadata when nothing matches in the file
    @params: artwork: doq of artwork
            inputs: all the input fields in settingsContainer 
            settingsContainer: settingsContainer, passed in for adding new input later
            metadatalist: a list of metadata that parsed in xml file
    */
    function _metadatapicker(artwork, inputs, settingsContainer, metadatalist, spec) {
        var allTitles = {};
        var metadataPickerOverlay   = $(TAG.Util.UI.blockInteractionOverlay())  .addClass('metadataPickerOverlay');
        var metadataPicker          = $(document.createElement('div'))          .addClass("metadataPicker");
        var metadataPickerHeader    = $(document.createElement('div'))          .addClass('metadataPickerHeader')       .text("No match found. Please select the metadata you would like to import for '" + artwork.Name + "'.");
        var searchbar               = $(document.createElement('input'))        .addClass('metadataPickerSearchbar')    .attr('type', 'text');
        var metadataLists           = $(document.createElement('div'))          .addClass('metadataLists');
        var metadataInfos           = $(document.createElement('div'))          .addClass('metadataInfos');
        var metadataholder          = $(document.createElement('div'))          .addClass('metadataHolder');
        var fields = {};//fields to store all the metadata elements

        //get all metadata titles from metadatalist.
        var selectedmetadata;
        var i;
        var counter = 0;
        var curlast;
        var curlist = metadatalist;
        var infoSource = [];
        var info = "";
        init();
        metadataPickerOverlay.css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex);
        metadataPickerOverlay.append(metadataPicker);
        metadataPickerHeader.css({
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap',
            'overflow':'hidden'
        });
        TAG.Util.multiLineEllipsis(metadataPickerHeader);
        metadataPicker.append(metadataPickerHeader);

        //searchbar
        searchbar.css({
            'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")',
            'background-size': 'auto 50%',
            'background-repeat': 'no-repeat',
            'background-position': '8px center'
        });
        searchbar.on('click focus', function () { searchbar.css({ 'background-image': 'none' }); });
        searchbar.on('blur focusout', function () { (!searchbar.val()) && searchbar.css({ 'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")' }); });
        searchbar.on('keyup', function (event) {
            if (!searchbar.val()) {
                //init();
                metadataLists.empty();
                for (var i = 0; i < 30; i++) {
                    if (i < infoSource.length) {
                        var mtHolder = makemtholder(infoSource[i].title || "Untitled", i);
                    } else {
                        break;
                    }//set the first one selected once we firstly open the picker
                    if (i === 0) {
                        mtHolder.click();
                    }
                    counter++;
                }
            }
            if (event.which === 13) {
                doSearch();
            }
        });

        metadataPicker.append(searchbar);

        // creates a panel for all the metadata objects
        metadataPicker.append(metadataLists);
        metadataLists.bind('scroll', function () {
            if ($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
                if (counter < curlist.length) {
                    var num = counter + 30 <= curlist.length ? 30 : curlist.length - counter;
                    for (var k = 0; k < num; k++) {
                        if (counter < curlist.length) {
                            makemtholder(allTitles[counter], counter);
                            counter++;
                        }
                    }
                }
            }
        })

        // creates a panel for all metadata's detailed info
        metadataPicker.append(metadataInfos);
        metadataInfos.append(metadataholder);
        

        //Method to display reset the metadata list and search information
        function init() {
            metadataLists.empty();
            infoSource = [];
            curlist = metadatalist;
            for (i = 0; i < metadatalist.length; i++) {
                info = "";
                $.each(metadatalist[i], function(index, element) {
                    info += element + " ";          //Put all the metadata in one string for searching purposes
                });
                var mt = metadatalist[i];
                var title = mt[spec["title"]];
                infoSource.push({
                    "id": i,
                    "keys": info.toLowerCase(),
                    "title": title||"Untitled",
                });
                if (!title)
                    title = "Untitled";
                allTitles[i] = title;                                          
                if (i < 30) {
                    var mtHolder = makemtholder(title, i);
                    //set the first one selected once we firstly open the picker
                    if (i === 0) {
                        mtHolder.click();
                    }
                    counter++;
                }
            };
        }
        
        //Actual search method
        function doSearch() {
            var content = searchbar.val();
            var searchResults = [];
            if(content){
                metadataLists.empty();
                counter = 0;
                content = content.toLowerCase();
                curlist = [];
                $.each(infoSource, function (index, element) {
                    if (element.keys.indexOf(content) > -1 || element.title.toLowerCase().indexOf(content) > -1) {
                        curlist.push(metadatalist[element.id])
                        if (counter < 30) {
                            var mtHolder = makemtholder(element.title, element.id);
                            if (counter === 0) {
                                mtHolder.click();
                            }
                            counter++
                        }
                    }
                });
            } else {
                //init();
                metadataLists.empty();
                counter = 0;
                curlist = metadatalist;
                for (var i = 0; i < 30; i++) {
                    if (i < infoSource.length) {
                        var mtHolder = makemtholder(infoSource[i].title || "Untitled", i);
                    } else {
                        break;
                    }//set the first one selected once we firstly open the picker
                    if (i === 0) {
                        mtHolder.click();
                    }
                    counter++;
                }
            }
            
        }
        function makemtholder(ttl, index) {
            var mtHolder = $(document.createElement('div')).addClass('mtHolder').attr('id', index).text(ttl)
                            .css({'white-space':'nowrap','overflow':'hidden','text-overflow':'ellipsis','font-size':'0.9em'});
            metadataLists.append(mtHolder);
            makemtClickable(mtHolder);
            return mtHolder;
        }

        //click function for each metadata element
        function makemtClickable(mtholder) {
            mtholder.click(function () {
                $(".mtHolder").css('background', 'black');
                mtholder.css('background', '#999');

                var selected = mtholder.attr('id');
                selectedmetadata = metadatalist[selected];
                if (selectedmetadata) {
                    $("#metadataPickerImport").attr('disabled', false);
                    for (var ele in fields) {//if there is already a field for that element, change the value and show it.
                        if (ele in selectedmetadata) {
                            fields[ele].input.val(selectedmetadata[ele]);
                            fields[ele].field.show().data('visible', true);
                        } else {
                            fields[ele].field.hide().data('visible', false);
                        }
                    }
                    for (var rest in selectedmetadata) {
                        //if there are extra fields, add them
                        if (!fields[rest]) {
                            var input = createTextInput(selectedmetadata[rest], "Metadata Field", null, false, true);
                            var field = createSetting(rest, input, null, '7px').addClass("metadataField").attr('title', rest);
                            field.css({
                                margin:  '0%',
                                padding: '1%',
                                width:   '98%'
                            });
                            $(field).children(":first").css({ color: 'white', 'font-style': 'normal', 'vertical-align': 'middle' });
                            fields[rest] = { field: field, input: input };
                            field.show().data('visible', true);
                            metadataholder.append(field);
                        }
                    }
                }
            });
        }



        var metadataPickerButtons = $(document.createElement('div')).attr("id", "metadataPickerButtons")
                                    .css({'height':'5%','bottom':'7%','width':'100%','position':'absolute'});
        var metadataPickerCancel = $(document.createElement('button')).attr("id", "metadataPickerCancel").css({ 'float': 'right', 'position': 'absolute', 'margin-right': '12%' }).css('border-radius', '3.5px');;
        metadataPickerCancel.text("Cancel");
        
        // cancel button click handler
        metadataPickerCancel.click(function () {
            metadataPickerOverlay.fadeOut();
            $('.metadataInfos').empty();
            metadataPickerCancel.disabled = true;
        });
        metadataPickerButtons.append(metadataPickerCancel);


        var metadataPickerImport = $(document.createElement('button')).attr("id", "metadataPickerImport").css({ 'float': 'right', 'position': 'absolute', 'margin-right': '2%' }).css('border-radius', '3.5px');;
        metadataPickerImport.attr('disabled', true);
        if (selectedmetadata)
            metadataPickerImport.attr('disabled', false);
        metadataPickerImport.text("Import");

        //import button click handler
        metadataPickerImport.click(function () {
            updateArtwork(artwork, inputs, selectedmetadata, settingsContainer, spec);
            $('.metadataInfos').empty();
            metadataPickerOverlay.fadeOut();
        });

        metadataPickerButtons.append(metadataPickerImport);
        metadataPicker.append(metadataPickerButtons);
        root.append(metadataPickerOverlay);
        $(".parsingOverlay").fadeOut();
        metadataPickerOverlay.fadeIn();
    }
    /**Edit an artwork
     * @method editArtwork
     * @param {Object} artwork   artwork to edit
     */
    function editArtwork(artwork) {
        if (!artwork) {
            return;
        }
        TAG.Telemetry.recordEvent("LeftBarSelection", function (tobj) {
            tobj.category_name = prevLeftBarSelection.categoryName;
            tobj.middle_bar_load_count = prevLeftBarSelection.loadTime;
            tobj.time_spent = prevLeftBarSelection.timeSpentTimer.get_elapsed();
        });

        TAG.Telemetry.recordEvent("MiddleBarSelection", function (tobj) {
            tobj.type_representation = prevMiddleBarSelection.type_representation;
            tobj.time_spent = prevMiddleBarSelection.time_spent_timer.get_elapsed();
        });
        var timer = new TelemetryTimer();
        // Overlay doesn't spin... not sure how to fix without redoing tour authoring to be more async
        loadingOverlay('Loading Artwork...', 1);
        middleQueue.clear();
        clearTimeout(checkConTimerId);
        rightQueue.clear();
        setTimeout(function () {
            TAG.Util.UI.slidePageLeft((TAG.Layout.ArtworkEditor(artwork)).getRoot(), function () {
                TAG.Telemetry.recordEvent("PageLoadTime", function (tobj) {
                    tobj.source_page = "settings_view";
                    tobj.destination_page = "artwork_editor";
                    tobj.load_time = timer.get_elapsed();
                    tobj.identifier = artwork.Identifier;
                    //console.log("artwork editor load time: " + tobj.load_time);
                });
                SPENT_TIMER.restart();
            });
        }, 1);
    }

    /**Delete an artwork
     * @method deleteArtwork
     * @param {Object} artwork      artwork to delete
     */
    function deleteArtwork(artworks) {
        var confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
            prepareNextView(false);
            clearRight();
            prepareViewer(true);

            // actually delete the artwork
            TAG.Worktop.Database.batchDeleteDoq(artworks, function () {
                if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.art.text]) {
                    return;
                }
                console.log("complete")
                loadArtView();
            }, authError, authError);
        }, "Are you sure you want to delete the selected artworks?", "Delete", true, function () { $(confirmationBox).hide() });

        root.append(confirmationBox);
        $(confirmationBox).show();
        TAG.Util.multiLineEllipsis($($($(confirmationBox).children()[0]).children()[0]));
    }

    /**Save an artwork
     * @method saveArtwork
     * @param {Object} artwork      artwork to save
     * @param {Object} inputs       keys for artwork info from input fields
     */
    function saveArtwork(artwork, inputs) {
        var name = inputs.nameInput.val(),
            artist = inputs.artistInput.val(),
            year = inputs.yearInput.val(),
            month = inputs.monthInput.val(),
            day = inputs.dayInput.val(),
            timelineYear = inputs.timelineYearInput.val(),
            timelineMonth = inputs.timelineMonthInput.val(),
            timelineDay = inputs.timelineDayInput.val(),
            description = inputs.descInput.val(),
            isLocked = inputs.locked;

        var infoFields = {};
        $.each(inputs.customInputs, function (key, val) {
            infoFields[key] = val.val();
        });

        //pCL = displayLoadingSettings();
        //prepareNextView(false, null, null, "Saving...");
        clearRight();
        prepareViewer(true);
        prepareNextView(false, null, null, "Saving...");
        
        TAG.Worktop.Database.changeArtwork(artwork, {
            Name: name,
            Artist: artist,
            Year: year,
            Month: month,
            Day: day,
            TimelineYear: timelineYear,
            TimelineMonth: timelineMonth,
            TimelineDay: timelineDay,
            Description: description,
            Locked: isLocked,
            InfoFields: JSON.stringify(infoFields),
        }, function () {
            //refreshArtwork(artwork);
            //artworksIsLoading = false;
            //if (backButtonClicked && !(generalIsLoading || collectionsIsLoading ||
            //    artworksIsLoading || associatedMediaIsLoading || toursIsLoading)) { //don't continue if more sections are still loading - wait for them to finish
            //    backButtonClickHandler();
            //};
            //if (!backButtonClicked && (prevSelectedSetting && prevSelectedSetting === nav[NAV_TEXT.art.text])) {
            //    hideLoading();
            //    hideLoadingSettings(pCL);
            //    loadArtView(previousIdentifier); //eventually don't want this here? - reloads everything
            //};
            //hideLoading();
            //hideLoadingSettings(pCL);
            //saveArray.splice(saveArray.indexOf(artwork.Identifier), 1); //removes identifier from save array
            if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.art.text]) {
                LADS.Worktop.Database.getMain();
                return;
            }
            if (prevSelectedSetting && prevSelectedSetting === nav[NAV_TEXT.art.text]) {
                loadArtView(previousIdentifier);
                return;
            }
        }, authError, conflict(artwork, "Update", loadArtView), error(loadArtView)); 
    }

    // Feedback Functions:

    /**Loads Feedback view
     * @method loadFeedbackView
     * @param {Object} id   id of middle label to start on
     */
    function loadFeedbackView(id, matches) {

        inGeneralView = false;
        inCollectionsView = false;
        inArtworkView = false;
        inAssociatedView = false;
        inToursView = false;
        inFeedbackView = true;

        changesMade = false;

        var list;
        currentIndex = 0;

        prepareNextView(true, "");
        prepareViewer(false);
        clearRight();
        var cancel = false;

        //if (generalIsLoading || collectionsIsLoading ||
        //       artworksIsLoading || associatedMediaIsLoading || toursIsLoading) {
        //    hideLoading();
        //    hideLoadingSettings(pCL);
        //};
        //generalProgressCircle && hideLoadingSettings(generalProgressCircle);

        if (typeof matches !== "undefined") {
            list = matches;
            displayLabels();
        } else {
            // Make an async call to get feedback
            TAG.Worktop.Database.getFeedback(function (result) {
                if (cancel) return;
                sortDate(result);
                currentList = result;
                initSearch();
                list = result;
                displayLabels();
            });
        }

        function displayLabels() {
            $.each(list, function (i, val) {
                if (cancel) return false;
                // Add each label as a separate function to the queue so the UI doesn't lock up
                middleQueue.add(function () {
                    if (cancel) return;
                    if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.feedback.text]) {
                        return;
                    }
                    var label;
                    var text = $.datepicker.formatDate('(m/dd/yy) ', new Date(val.Metadata.Date * 1000)) + val.Metadata.Feedback;
                    if (!prevSelectedMiddleLabel &&
                        ((id && val.Identifier === id) || (!id && i === 0))) {
                        // Select the first one
                        middleLoading.before(selectLabel(label = createMiddleLabel(text, null, function () {
                            loadFeedback(val);
                            currentIndex = i;
                        }, val.Identifier, true)));

                        // Scroll to the selected label if the user hasn't already scrolled somewhere
                        if (middleLabelContainer.scrollTop() === 0 && label.offset().top - middleLabelContainer.height() > 0) {
                            middleLabelContainer.animate({
                                scrollTop: (label.offset().top - middleLabelContainer.height() / 2)
                            }, 1000);
                        }

                        prevSelectedMiddleLabel = label;
                        currentSelected = prevSelectedMiddleLabel;
                        loadFeedback(val);
                    } else {
                        middleLoading.before(label = createMiddleLabel(text, null, function () {
                            loadFeedback(val);
                            currentIndex = i;
                        }, val.Identifier, true));
                    }

                });
            });
            // Hide the loading label when we're done
            middleQueue.add(function () {
                middleLoading.hide();
            });
        }

        cancelLastSetting = function () { cancel = true; };
    }

    /** Loads feedback to right side of screen
     * @method loadFeedback
     * @param {Object} feedback     feedback to load
     */
    function loadFeedback(feedback) {
        clearRight();
        prepareViewer(true, feedback.Metadata.Feedback);
        deleteType = deleteFeedback;
        toDelete = feedback;

        var sourceLabel = createLabel('Loading...');
        var dateLabel = createLabel($.datepicker.formatDate('DD, MM d, yy ', new Date(feedback.Metadata.Date * 1000)));
        var source = createSetting('Submitted From', sourceLabel);
        var dateSetting = createSetting('Date', dateLabel);

        settingsContainer.append(source);
        var sourceType = feedback.Metadata.SourceType === "Exhibition" ? "Collection" : feedback.Metadata.SourceType;
        if (feedback.Metadata.SourceID) {
            getSourceName(feedback, function (sourceName) {
                sourceLabel.text(sourceName + ' (' + sourceType + ')');
                var sourceButton = createButton(sourceName + ' (' + sourceType + ')', function () {
                    followSource(feedback);
                });
                var sourceSetting = createSetting('Submitted From', sourceButton);
                source.remove();
                dateSetting.prepend(sourceSetting);
            }, function (sourceName) {
                sourceLabel.text(sourceName + ' (' + sourceType + ', Deleted)');
            }, function () {
                sourceLabel.text('Deleted');
            });
        } else {
            sourceLabel.text(sourceType + " Page (No " + sourceType + " Selected)");
        }
        settingsContainer.append(dateSetting);

        var deleteButton = createButton('Delete Feedback', function () {
            deleteFeedback(feedback);
        },
        {
            'margin-left': '2%',
            'margin-top': '1%',
            'margin-right': '0%',
            'margin-bottom': '3%',
        });
        leftButton = deleteButton;
        buttonContainer.append(deleteButton);
    }

    /**Get source of feedback
     * @method getSourceName
     * @param {Object} feedback     feedback to get source of
     * @param {Function} onSuccess  function called if source found
     * @param {Function} onDeleted  function called if source has been deleted
     * @param {Function} onError    function called if there is an error 
     */
    function getSourceName(feedback, onSuccess, onDeleted, onError) {
        TAG.Worktop.Database.getDoq(feedback.Metadata.SourceID,
            function (doq) {
                if (doq.Metadata.Deleted) {
                    onDeleted(doq.Name);
                } else {
                    onSuccess(doq.Name);
                }
            }, function () {
                onError();
            });
    }

    /**Switch view to source of feedback
     * @method followSource
     * @param {Object} feedback     feedback to follow source of
     */
    function followSource(feedback) {
        switch (feedback.Metadata.SourceType) {
            case "Exhibition":
            case "Exhibitions":
                switchView("Exhibitions", feedback.Metadata.SourceID);
                break;
            case "Tour":
            case "Tours":
                switchView("Tours", feedback.Metadata.SourceID);
                break;
            case "Art":
            case "Artwork":
            case "Artworks":
                switchView("Artworks", feedback.Metadata.SourceID);
                break;
        }
    }

    /**Delete a feedback
     * @method deleteFeedback
     * @param {Object} feedback     feedback to delete
     */
    function deleteFeedback(feedback) {
        prepareNextView(false);
        clearRight();

        // actually delete the feedback
        TAG.Worktop.Database.deleteDoq(feedback.Identifier, function () {
            if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.feedback.text]) {
                return;
            }
            loadFeedbackView();
        }, authError, conflict(feedback), error(loadFeedbackView));
    }

    //Middle Bar Functions:

    /**Create a middle label 
     * @method createMiddleLabel
     * @param  {String} text            the text of the label
     * @param imagesrc                  the source for the image. If not specified no image added
     * @param {Function} onclick        the onclick function for the label
     * @param {Object} id               id to set if specified
     * @param {Function} onDoubleClick  function for double click
     * @param {Boolean} inArtMode 
     * @param extension                 to check if is video or static art
     * @return {Object} container       the container of the new label
     */
    function createMiddleLabel(text, imagesrc, onclick, id, noexpand, onDoubleClick, inArtMode, extension) {
        var container = $(document.createElement('div'));
        text = TAG.Util.htmlEntityDecode(text);
        container.attr('class', 'middleLabel');
        if (id) {
            container.attr('id', id);
        }


        if (inArtMode) {
            if (extension.match(/mp4/) || extension.match(/ogv/) || extension.match(/webm/) || extension.match(/avi/) || extension.match(/mov/)) {
                container.data('isVideoArtwork', true);
            } else {
                container.data('isStaticArtwork', true);
            }
        }

        var mousedownFn = 
        function () {
            container.css({
                'background': HIGHLIGHT
            });
        }
        container.mousedown(mousedownFn);

        container.mouseup(function () {
           container.css({
                'background': 'transparent'
            });
        });
        container.mouseleave(function () {
            container.css({
                'background': 'transparent'
            });
        });

        var clickFn = 
        function () {
            //if (prevSelectedMiddleLabel == container) {
            //    return;
            //} else {
            //    changesHaveBeenMade && currentMetadataHandler && saveQueue.add(currentMetadataHandler());
            //    changesHaveBeenMade = false;
            //}
            //autosave for general settings - switching between customization and password settings
            //if (inGeneralView && changesHaveBeenMade) {
            //    currentMetadataHandler && saveQueue.add(currentMetadataHandler());
            //    changesHaveBeenMade = false;
            //    //generalProgressCircle && hideLoadingSettings(generalProgressCircle);
            //}

            TAG.Util.removeYoutubeVideo();
            resetLabels('.middleLabel');
            selectLabel(container, !noexpand);

            TAG.Telemetry.recordEvent("MiddleBarSelection", function (tobj) {
                tobj.type_representation = prevMiddleBarSelection.type_representation;
                tobj.time_spent = prevMiddleBarSelection.time_spent_timer.get_elapsed();
            });

            if (onclick) {
                onclick();
            }
            prevSelectedMiddleLabel = container;
            currentSelected = container;
        }

        container.click(clickFn);

        if (onDoubleClick) {
            container.dblclick(onDoubleClick);
        }

        var width;

        // BUILD VERTICAL CENTERING HELPER FUCK YEAH
        var helper = $(document.createElement('span'));
        helper.css({
            'display' : 'inline-block',
            'height': '100%',
            'vertical-align': 'middle'
        });
        container.append(helper);

        // build image if it exists WHICH WILL BE VERTICALLY CENTERED FUCK YEAH
        if (imagesrc) {
            var imageParent = $(document.createElement('div'))
            .css({
                'display': 'inline-block',
                'vertical-align': 'middle',
                'height': '100%',
                'width': '20%',
                'position': 'relative',
                'margin': 'auto 3% auto 1%'
            });
            container.append(imageParent);
            var image = $(document.createElement('img'));
            image.attr('src', imagesrc);
            image.css({
                'margin': 'auto auto auto',
                'height': 'auto',
                'max-width': '100%',
                'max-height': '100%',
                'display': 'block',
                'position': 'absolute',
                'width': 'auto',
                'left': '0',
                'right': '0',
                'top': '0',
                'bottom': '0'
            });
            imageParent.append(image);

            var progressCircCSS = {
                'position': 'absolute',
                'left': '5%',
                'z-index': '50',
                'height': 'auto',
                'width': '10%',
                'top': '20%'
            };
            var circle = TAG.Util.showProgressCircle(container, progressCircCSS, '0px', '0px', false);
            image.load(function () {
                TAG.Util.removeProgressCircle(circle);
            });
            width = '60%';
        } else {
            width = '80%';
        }

        // build text label WHICH WILL ALSO BE VERTICALLY CENTERED FUCK YEAH
        var label = $(document.createElement('div'));
        label.attr('class', 'labelText');
        label.css({
            'width': width,
            'vertical-align': 'middle'
        });

        if (!imagesrc) {
            label.css({
                'padding-left': '4%'
            });
        } else {
            label.css({
                'padding-left': '2%'
            });
        }

        label.text(text);

        container.append(label);


        //add the checkbox if in the artworks tab
        if (inArtworkView || inAssociatedView || ((inToursView || inCollectionsView) && IS_WINDOWS)) {
            container.append(function () {
                var checkboxContainer = $(document.createElement('div'))
                .addClass('checkboxContainer')
                .css({
                    'width': '7%',
                    'height': '100%',
                    'vertical-align': 'middle',
                    'display': 'inline-block',
                    'margin-left':'2%'
                })

                var checkboxColor = 'rgb(230, 235, 235)';
                var checkbox = $(document.createElement('div'))
                .addClass('checkbox')
                .css({
                    'width': '100%',
                    'height':'0',
                    'padding-top': '100%',
                    'margin-top':'85%',
                    'vertical-align': 'middle',
                    'position': 'relative',
                    'display': 'block',
                    'background-color': checkboxColor,
                })

                checkboxContainer.append(checkbox);

                var check = $(document.createElement('img'))
                    .attr('src', tagPath + 'images/icons/checkmark.svg')
                    .css({
                        'width': '5%',
                        'height': 'auto',
                        'vertical-align': 'middle',
                        'position': 'absolute',
                        'top': '40%',
                        'right': '6%',
                        'display':'none'
                    })
                    .addClass("check")

                if (inCollectionsView || inToursView) {
                    check.css({'right':'7.5%'})
                }

                checkboxContainer.append(check)

                var isSelected = false;

                checkbox.on("click", function (evt) {
                    if (!isSelected) {
                        container.unbind('click')
                        isSelected = true
                        check.css({ 'display': 'inherit' })
                        if (!inAssociatedView){
                            multiSelected.push(id)
                        } else {
                            multiSelected.push({Identifier:id, Name:text})
                        }
                        console.log(multiSelected)
                        evt.stopPropagation()
                        evt.preventDefault()
                        container.click(clickFn)
                    }
                })

                check.on("click", function (evt) {
                    if (isSelected) {
                        container.unbind('click')
                        isSelected = false
                        check.css({ 'display': 'none' })
                        multiSelected.splice(multiSelected.indexOf(id), 1)
                        console.log(multiSelected)
                        evt.stopPropagation()
                        evt.preventDefault()
                        container.click(clickFn)
                    }
                });

                checkbox.on('mousedown', function(){
                    container.unbind('mousedown')
                })

                checkbox.on('mouseup', function () {
                    container.mousedown(mousedownFn)
                })

                check.on('mousedown', function () {
                    container.unbind('mousedown')
                })

                check.on('mouseup', function () {
                    container.mousedown(mousedownFn)
                })


                return checkboxContainer
            });
        }


        return container;
    }

    /**Set up the middle bar for the next view
     * @method prepareNextView
     * @param {Boolean} showSearch      if true show search bar, otherwise hide
     * @param {String} newText          text for the 'New' button
     * @param {Function} newBehavior    onclick function for the 'New' button
     * @param {String} loadingText      Text to display while middle bar loading
     */
    function prepareNextView(showSearch, newText, newBehavior, loadingText) {
        TAG.Util.removeYoutubeVideo();
        clearInterval(checkConTimerId);
        middleQueue.clear();
        middleLabelContainer.empty();
        middleLabelContainer.append(middleLoading);
        middleLoading.show();
        secondaryButton.css("display", "none");
        findBarTextBox.text("Find");
        findBarDropIcon.css({
            //width: '7%',
            // height: '70%',
            // display:'inline-block',
            '-webkit-transform': 'rotate(90deg)',
            '-moz-transform': 'rotate(90deg)',
            '-o-transform': 'rotate(90deg)',
            '-ms-transform': 'rotate(90deg)',
            'transform': 'rotate(90deg)',
        });
        findBar.css("display","none");
        findContainer.css("display","none");
        findShown = false;

        //clears the multiselected artworks/tours
        multiSelected = []

        if (showDropdown) {
            menuLabel.click();
        }

        menuLabel.hide();
        addToArtworkLabel.hide();
        newButton.text(newText);
        newButton.unbind('click').click(newBehavior);
        if (!newText) { newButton.hide(); }
        else { newButton.show(); }

        if (inArtworkView){
            findBar.css("display","inline-block");
            searchbar.css({ width: '53%' });
            //shows the second button
            addButton.text("Add to Collection")
            addButton.show();
            addButton.unbind('click').click(function () { addArtworksToCollections(multiSelected)});

            //deleteBlankButton.show();
            if(IS_WINDOWS){
                $('#setViewDeleteButton').css('display','block');
                deleteBlankButton.unbind('click').click(function(){ deleteArtwork(multiSelected)});
                deleteBlankButton.text('Delete');
            } 

        } else if (inAssociatedView) {
            findBar.css("display", "none");
            addButton.text("Add Associations")
            addButton.show()
            addButton.unbind('click').click(function () { addAssocMediaToArtworks(multiSelected) })
            findBar.css("display", "inline-block");
            searchbar.css({ width: '75%' });
        } else {
            //hides the second button
            addButton.hide()
            addButton.unbind('click')
            findBar.css("display", "none");
        }

        prevSelectedMiddleLabel = null;
        if (cancelLastSetting) cancelLastSetting();

        if (loadingText) {
            middleLoading.children('label').text(loadingText);
        } else {
            middleLoading.children('label').text('Loading...');
        }

        if (showSearch) {
            searchContainer.show();
            searchContainer.css('display', 'inline-block');
            searchbar.css({ 'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")' });
        } else {
            searchContainer.hide();
        }
    }

    /**Clears the right side
     * @method clearRight
     */
    function clearRight() {
        settingsContainer.empty();
        buttonContainer.empty();
        rightQueue.clear();
        $(".leftLoading").remove();
    }

    /**Prepares the viewer on the right side
     * @method prepareViewer
     * @param {Boolean} showViewer    whether the preview window is shown 
     * @param {String} text           text to add to the viewer (in a textbox)
     * @param {Boolean} showButtons   whether the buttonContainer is shown
     */
    function prepareViewer(showViewer, text, showButtons) {
        TAG.Util.removeYoutubeVideo();
        viewer.empty();
        viewer.css('background', 'black');
        if (showViewer) {
            viewer.show();
            buttonContainer.show();
            buttonContainer.css({
                'top': $(window).width() * RIGHT_WIDTH / 100 * 1 / VIEWER_ASPECTRATIO + 'px',
                'margin-top': '0.35%',
            });
            settings.css({
                'height': getSettingsHeight() + 'px',
            });
            if (text) {
                var textbox = $(document.createElement('textarea'));
                if (typeof text == 'string')
                    text = text.replace(/<br \/>/g, '\n').replace(/<br>/g, '\n').replace(/<br\/>/g, '\n');
                textbox.val(text);
                textbox.css({
                    'padding': '.5%',
                    'width': '100%',
                    'height': '100%',
                    'box-sizing': 'border-box',
                    'margin': '0px',
                });
                textbox.attr('readonly', 'true');
                viewer.append(textbox);
                viewer.css('background', 'transparent');
            } else {
                viewer.css('background', 'black');
            }
        } else {
            viewer.hide();
            settings.css({
                'height': ($(window).height() * CONTENT_HEIGHT / 100) -
                (BUTTON_HEIGHT * 1) + 'px',
            });
        }
        if (showButtons===false){
            buttonContainer.hide();
        }
    }

    //Helper methods for label interaction:

    /**Clicks an element determined by a jquery selector when it is added to the page
     * @method clickWhenReady
     * @param selector
     * @param maxtries
     * @param tries
     */
    function clickWhenReady(selector, maxtries, tries) {
        doWhenReady(selector, function (elem) { elem.click(); }, maxtries, tries);
    }

    /** Calls passed in function when the element determined by the selector
     *  is added to the page
     * @method doWhenReady
     * @param {Object} selector     class or id of object(s) on which fn is performed     
     * @param {Function} fn
     * @param maxtries
     * @param tries
     */
    function doWhenReady(selector, fn, maxtries, tries) {
        maxtries = maxtries || 100;
        tries = tries || 0;
        if (tries > maxtries) return;
        if ($.contains(document.documentElement, $(selector)[0])) {
            fn($(selector));
        } else {
            rightQueue.add(function () {
                doWhenReady(selector, fn, maxtries, tries + 1);
            });
        }
    }

    /**Reset mouse interaction for labels
     * @method resetLabels
     * @param {Object} selector     class of labels to reset
     */
    function resetLabels(selector) {
        
        $(selector).css('background', 'transparent');
        $.each($(selector), function (i, current) {
            
            if ($(current).attr('disabled') === 'disabled') {
                return;
            }
            
            $(current).mousedown(function () {
                
                $(current).css({
                    'background': HIGHLIGHT
                });
            });
            $(current).mouseup(function () {
                
                $(current).css({
                    'background': 'transparent'
                });
            });
            $(current).mouseleave(function () {
                
                $(current).css({
                    'background': 'transparent'
                });
            });
        });
    }

    /**Select a label by unbinding mouse events and highlighting
     * @method selectLabel
     * @param {Object} label    label to select
     * @param {Boolean} expand  if label expands when selected 
     * @param {Integer} index   index of the selected label in it's relvant list.  
     * @return {Object} label   selected label   
     */
    function selectLabel(label, expand) {
        label.css('background', HIGHLIGHT);
        label.unbind('mousedown').unbind('mouseleave').unbind('mouseup');
        
        if (expand) {
            label.css('height', '');
            label.children('div').css('white-space', '');

            if (prevSelectedMiddleLabel) {
                prevSelectedMiddleLabel.children('div').css('white-space', 'nowrap');
            }
        }
        return label;
    }

    /**Disable a label, unbinding mouse events
     * @method disableLabel
     * @param {Object} label         label to disable
     * @return {Object} label        disabled label
     */
    function disableLabel(label) {
        label.css({
            'color': 'gray',
        });
        label.unbind('mousedown').unbind('mouseleave').unbind('mouseup').unbind('click').attr('disabled', true);
        return label;
    }

   
    //Settings functions:

    /**Gets the height of the settings section since the viewer has to be positioned absolutely,
     *the entire right bar needs to be position absolutely. Settings has bottom: 0, so the height needs to be correct
     * to not have this be under the buttons container.  If any of the heights of the right components changes it should be
     * updated here.
     * @method getSettingsHeight
     * @return height       appropriate height for settings
     */
    function getSettingsHeight() {
        var height =
        // Start with the entire height of the right side
        ($(window).height() * CONTENT_HEIGHT / 100) -
        // Subtract:
        (
            // Height of the viewer
            $(window).width() * RIGHT_WIDTH / 100 * 1 / VIEWER_ASPECTRATIO +
            // Height of the button container
            BUTTON_HEIGHT * 1 +
            // Height of the padding of the button container
            $(window).width() * RIGHT_WIDTH / 100 * 0.0285
        );
        return height;
    }

    /**Creates a setting to be inserted into the settings container
     * @method createSetting
     * @param {String} text     text for the setting
     * @param {Object} input    the input for the setting
     * @param width             if not falsey then assumed to be number represengint percent, must be less than 95
     * @return container        container of new setting
     */
    function createSetting(text, input, width, labelLeft, timeline) {
        var container = $(document.createElement('div'));
        var mb = "4%";
        if (timeline){
            mb = "0%";
        }
        container.css({
            'width': '100%',
            'margin-bottom': mb
        });

        var label = $(document.createElement('div'));
        label.css({
            //'font-size': SETTING_FONTSIZE,
            'width': width ? 45 - (width - 50) + '%' : '45%',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'font-style': 'italic',
            'display': 'inline-block',
            'margin-left': labelLeft,
        });
        label.text(text);

        if (width) {
            width = width + '%';
        } else {
            width = '50%';
        }
        input.css({
            'width': width,
            //'font-size': INPUT_FONTSIZE,
            'float': 'right',
            'margin-right': '3%',
            'box-sizing': 'border-box',
        });

        var clear = $(document.createElement('div'));
        clear.css('clear', 'both');

        container.append(label);
        container.append(input);
        container.append(clear);

        return container;
    }

    //Helper functions:


    /* Create a linked year metadata input div 
    * @method createYearMetadataDiv
    * @param {Object} work                      artwork or media you are editting
    * @param {Object} saveButton                jQuery DOM object representing the save button to be enabled when settings are changed
    * @return {Object} yearMetadataDivSpecs     div with year and timeline year options, list of input fields
    */
    function createYearMetadataDiv(work, callback){
        
        var yearInput,
            monthInput,
            dayInput,
            timelineInputText,
            timelineYearInput,
            timelineYearJustChanged = false,
            timelineMonthInput,
            timelineDayInput,
            timelineYearDiv = $(document.createElement('div')).addClass('timelineYearDiv'),
            yearDiv = $(document.createElement('div')).addClass('yearDiv'),
            year,
            month,
            day,
            timelineYear,
            timelineMonth,
            timelineDay,
            timelineYearAutofilled = false,
            timelineYearAllowed = true,
            yearMetadataDiv= $(document.createElement('div')).addClass('yearMetadataDiv'),
            yearMetadataDivSpecs;

        //Create input boxes: 
        yearInput = createTextInput(TAG.Util.htmlEntityDecode(work.Metadata.Year), "Enter valid year", 100);
        var yearDescriptionDiv = $(document.createElement('div'));
        monthInput = createSelectInput(getMonthOptions(yearInput.attr('value')), work.Metadata.Month);
        monthInput.css('margin-right', '0%');
        dayInput = createSelectInput(getDayOptions(monthInput.attr('value'),yearInput,monthInput), work.Metadata.Day);
        dayInput.css('margin-right', '0%');
        timelineInputText = work.Metadata.TimelineYear || getTimelineInputText(yearInput);
        timelineYearInput = createTextInput(timelineInputText, "Enter valid year", 100);

        timelineMonthInput = createSelectInput(getMonthOptions(timelineYearInput.attr('value')),work.Metadata.TimelineMonth);
        timelineMonthInput.css('margin-right','0%');
        timelineDayInput = createSelectInput(getDayOptions(timelineMonthInput.attr('value'),timelineYearInput,timelineMonthInput), work.Metadata.TimelineDay);
        timelineDayInput.css('margin-right', '0%');
        yearInput.attr('id', 'yearInput');
        //Add focus to inputs:
        yearInput.focus(function () {
            if (yearInput.val() === 'Year'){
                yearInput.select();
            }
        });
        monthInput.focus(function(){
            if (monthInput.val() === 'Month'){
                monthInput.select();
            }
        });
        dayInput.focus(function(){
            if (dayInput.val() === 'Day'){
                dayInput.select();
            }
        });
        timelineYearInput.focus(function(){
            if (timelineYearInput.val() === 'Date on Timeline'){
                timelineYearInput.select();
            }
        });
        timelineMonthInput.focus(function(){
            if (timelineMonthInput.val() === "Month"){
                timelineMonthInput.select();
            }
        });
        timelineDayInput.focus(function(){
            if (timelineDayInput.val() === "Day"){
                timelineDayInput.select();
            }
        });

        //Set up year div:
        //TO-DO: add (?) icon w/ pop-up
        yearDiv.css({
            width : '100%',
            height : '20px'
        });
        year = createSetting('Year', yearInput, 60, null, true);
        year.css({
            width: '32%',
            display: 'inline-block',
            position: 'relative',
            'float': 'left'
        });
        month = createSetting('Month', monthInput, 60, null, true);
        month.css({
            width: '32%',
            'padding-left': '1%',
            'position':'relative',
            display: 'inline-block',
            'float': 'left'
        });
        toggleAllow(monthInput);
        day = createSetting('Day', dayInput, 70, null, true);
        day.css({
            width: '30%',
            'padding-left': '2%',
            'position': 'relative',
            display: 'inline-block',
            'float': 'left'
        });
        toggleAllow(dayInput);
        yearDiv.append(year)
               .append(month)
               .append(day);

        //Set up timeline year div:
        //TO-DO add (?) icon w/ pop-up
        timelineYearDiv.css({
            width: '100%',
            height: '20px',
            'padding-top':'2%'
        });
        timelineYear = createSetting('Date on Timeline', timelineYearInput, 40);
        timelineYear.css({
            width: '44%',
            display: 'inline-block',
            position: 'relative',
            'float': 'left'
        });
        timelineMonth = createSetting('Month', timelineMonthInput, 50);
        timelineMonth.css({
            width: '25%',
            'padding-left': '1%',
            'position': 'relative',
            display: 'inline-block',
            'float': 'left'
        });
        toggleAllow(timelineMonthInput);
        timelineDay = createSetting('Day', timelineDayInput, 60);
        timelineDay.css({
            width: '25%',
            'padding-left': '2%',
            'position': 'relative',
            display: 'inline-block',
            'float': 'left'
        });
        toggleAllow(timelineDayInput);
        timelineYearDiv.append(timelineYear)
                       .append(timelineMonth)
                       .append(timelineDay);

        yearDescriptionDiv.css({
            'width': '60%',
            'height': '10%',
            'position': 'relative',
            'font-size': '70%',
            'font-style': 'italic',
            'white-space': 'nowrap',
            'display':'inline-block'
        });
        if (IS_WINDOWS){
            yearDescriptionDiv.css({
            'top': '-10px'
            });
        }
        yearDescriptionDiv.text("Year Format Examples:  2013, 800 BC, 17th century, 1415-1450");
        yearInput.on('keyup', function (event) {
            callback(event)
        });
        timelineYearInput.on('keyup', function (event) {
            callback(event)
        });
        //Link input values of date fields to dynamically change/disable               
        yearInput.on('input', function (event) {
            callback(event);
            setOptions(monthInput, getMonthOptions(yearInput.attr('value')),'');
            toggleAllow(monthInput);
            setOptions(dayInput, getDayOptions(monthInput.attr('value'),yearInput,monthInput));
            toggleAllow(dayInput);
            if (!timelineYearJustChanged|| timelineYearInput.val()===''){
                timelineYearInput.val(getTimelineInputText(yearInput));

                timelineYearJustChanged = false;
                setOptions(timelineMonthInput, getMonthOptions(timelineYearInput.attr("value")));
                toggleAllow(timelineMonthInput);
                setOptions(timelineDayInput, getDayOptions(timelineMonthInput.attr("value"),timelineYearInput,timelineMonthInput));
                toggleAllow(timelineDayInput);
            }
            timelineYearAutofilled = false;
        });
        monthInput.change(function () {
            callback();
            setOptions(dayInput,getDayOptions(monthInput.attr("value"),yearInput,monthInput),dayInput.attr('value'));
            toggleAllow(dayInput);
            if (timelineMonthInput.attr("value") === "") {
                timelineMonthInput.attr("value",monthInput.attr("value"));
                setOptions(timelineDayInput, getDayOptions(timelineMonthInput.attr("value"),timelineYearInput,timelineMonthInput));
                toggleAllow(timelineDayInput);
            }
        });
        dayInput.change(function () {
            callback();           
            if (timelineDayInput.attr("value")=== "" && timelineDayInput.dropDownOptions.length>1){
                timelineDayInput.attr("value", dayInput.attr("value"));
            };
        });
        timelineYearInput.on('input', function (event) {
            callback(event);            
            if (timelineYearInput.attr('value').length===0 && !timelineYearAutofilled){
                timelineYearInput.val(getTimelineInputText(yearInput));
                timelineMonthInput.val(monthInput.attr("value"));
                timelineDayInput.val(dayInput.attr("value"));
                timelineYearAutofilled = true;
            } 
            timelineYearJustChanged = true;
            if ( timelineYearInput.attr('value').length>0 &&!isSingleYear(timelineYearInput.attr('value'))){
                timelineYearAllowed = false;
                timelineYearInput.css({
                    'border-color': 'red',
                    'border-width' : 'medium',
                    'opacity' : '0.7'
                });
            } else {
                timelineYearAllowed = true;
                timelineYearInput.css({
                    'border-color' : '#a7b4ae',
                    'border-width': 'thin',
                    'opacity': '1'
                });
            }
            setOptions(timelineMonthInput, getMonthOptions(timelineYearInput.attr('value')),'');
            toggleAllow(timelineMonthInput, timelineYearAllowed);
            setOptions(timelineDayInput, getDayOptions(timelineMonthInput.attr('value'),timelineYearInput,timelineMonthInput),'');
            toggleAllow(timelineDayInput, timelineYearAllowed);
        });
        timelineMonthInput.change(function () {
            callback();
            setOptions(timelineDayInput,getDayOptions(timelineMonthInput.attr("value"),timelineYearInput,timelineMonthInput),timelineDayInput.attr('value'));
            toggleAllow(timelineDayInput, true);
        });

        //Set up year metadatadiv
        yearMetadataDiv.css({
            'width' : '100%'
        });

        
        var versionsButton = createButton("Provide Web Versions",
            function(){
                var back = $(document.createElement("div"));
                var centerDiv = $(document.createElement("div"));
                centerDiv.attr("id","centerDivForVersionsButton");
                back.attr("id","backgroundForVersionsButton");
                back.css({
                    //"color": "black",
                    'z-index': "9999999999999999999999999999999999999999999999999999999999999999999999",
                    //'float':'right',
                    //'font-size':'50%',
                    'height':'100%',
                    //'margin-top':'2.8%',
                    //'padding-bottom':'1%',
                    'width': '100%',
                    'position' : "absolute",
                    'background-color' : "gray",
                    "opacity" : ".75",
                    //'border': '1px solid black',
                    //'padding': '1.5% 0px 0px 0px',
                    //'padding-top':'-10%',
                    //'display': 'block',
                });
                centerDiv.css({
                    "background-color" : "#3f3735",
                    'z-index': "99999999999999999999999999999999999999999999999999999999999999999999999999999991",
                    "height" : "50%",
                    "width" : "50%",
                    "position" : "absolute",
                    "top" : "25%",
                    "left" : "25%",
                    "opacity" : "1",
                });
                $('#tagContainer').append(back);
                $('#tagContainer').append(centerDiv);
                function filesChosen(data){
                    console.log("Data uploading: " + data);
                }
                var uploadButton = createButton("Upload File(s)",
                    function(){
                        uploadFile(3,filesChosen,false,[".mp4",".ogv",".webm"]);
                    }

                );
                uploadButton.css({
                    "bottom" : "20%",
                    "position" : "absolute",
                    "left" : "40%",
                    "width" : "20%",
                })
                var exitButton = createButton("Exit",
                    function(){
                        $("#centerDivForVersionsButton").remove();
                        $("#backgroundForVersionsButton").remove();
                    }
                );
                
                exitButton.css({
                    "bottom" : "5%",
                    "position" : "absolute",
                    "left" : "40%",
                    "width" : "20%",
                })
                var webm = $(document.createElement("div"));
                var webmButton = createButton("Browse", function(){
                    uploadFile(3, filesChosen, false, [".webm"]);
                    webm.css({
                        "color": "green",
                    })
                })
                webmButton.css({
                    "left": "20%",
                    "position": "absolute",
                    "height": "8%",
                    "width": "20%",
                    "top": "9%",
                });
                webm.text("webm");
                webm.css({
                    "left" : "5%",
                    "position" : "absolute",
                    "height": "10%",
                    "width" : "90%",
                    "top": "10%",
                })
                
                var ogv = $(document.createElement("div"));
                var ogvButton = createButton("Browse", function () {
                    uploadFile(3, filesChosen, false, [".ogv"]);
                    ogv.css({
                        "color" : "green",
                    })
                });
                ogvButton.css({
                    "left": "20%",
                    "position": "absolute",
                    "height": "8%",
                    "width": "20%",
                    "top": "24%",
                });
                ogv.text("ogv");
                ogv.css({
                    "left": "5%",
                    "position": "absolute",
                    "height": "10%",
                    "width": "90%",
                    "top": "25%",
                })
                var mp4 = $(document.createElement("div"));
                var mp4Button = createButton("Browse", function () {
                    uploadFile(3, filesChosen, false, [".mp4"]);
                    mp4.css({ 
                        "color": "green",
                    })
                });
                mp4Button.css({
                    "left": "20%",
                    "position": "absolute",
                    "height": "8%",
                    "width": "20%",
                    "top": "39%",
                });
                mp4.text("mp4");
                mp4.css({
                    "left": "5%",
                    "position": "absolute",
                    "height": "10%",
                    "width": "90%",
                    "top": "40%",
                })

                centerDiv.append(webm);
                centerDiv.append(webmButton);
                centerDiv.append(ogv);
                centerDiv.append(ogvButton);
                centerDiv.append(mp4);
                centerDiv.append(mp4Button);
                centerDiv.append(uploadButton);
                centerDiv.append(exitButton);


            },
            
            {
                'margin-right': '0%',
                'margin-top': '1%',
                'margin-bottom': '3%',
                'margin-left': '2%',
                'float': 'left',
            });
        versionsButton.attr("id","versionsButton");
        //Trent's version button work in progress
        yearMetadataDiv.append(yearDiv)
                       .append(yearDescriptionDiv)
                       .append(timelineYearDiv);
        
        var typ = "";
        if (work.Metadata.Type) {
            typ = work.Metadata.Type.toLowerCase();
        }
        else if (work.Metadata.ContentType) {
            typ = work.Metadata.ContentType.toLowerCase();
        }
        if (typ=="video"||typ=="videoArtwork") {
            yearMetaDataDiv.append(versionsButton);
        }
        yearMetadataDivSpecs = {
            yearMetadataDiv : yearMetadataDiv,
            yearInput : yearInput, 
            monthInput: monthInput,
            dayInput: dayInput,
            timelineYearInput: timelineYearInput,
            timelineMonthInput: timelineMonthInput,
            timelineDayInput: timelineDayInput
        }

        return yearMetadataDivSpecs;

        //Helper functions:

        /*Get month options based on year
         * @method getMonthOptions
         * @param {String} year         year used to determine month options
         * @return {Array}              list of options to use in month drop down
         */
        function getMonthOptions(year){
            if (!isSingleYear(year)){
                return [''];
            } else {
                return ['','January','February','March','April','May','June','July','August','September','October','November','December'];
            }
        }

        /*Get input text for timeline year input
         * @method getTimelineInputText
         * @param {Object} yearInput        year input field
         * @return {String} timelineInputText   text to display in timelineYearInput 
         */
        function getTimelineInputText(yearInput){
            var timelineInputText = TAG.Util.parseDateToYear({ year : yearInput.attr('value')});
            if (timelineInputText){
                if (timelineInputText<0){
                    return -timelineInputText + ' BCE';
                }
                else {
                    return timelineInputText;
                }
            } else{
                return '';
            }
        }

        /* returns whether a date input is a single year
         * @method isSingleYear
         * @param {String} dateString      string to parse
         * @return {Boolean}               whether input string represents single year
         */
        function isSingleYear(dateString){
            //remove characters that are okay and white space
            dateString = dateString.replace(/bce?/gi,'')
                                   .replace(/ce/gi, '')
                                   .replace(/ad/gi, '')
                                   .replace(/,/g,'')
                                   .replace(/\s/gi,'');
            //dateString now cannot have non-numeric characters, except '-' at index 0 (for negative numbers) 
            if (dateString.search(/[^0-9]/)>0 || dateString.length===0 || dateString[0].search(/[0-9||-]/)<0){
                return false;
            } else {
                return true;
            }
        }
        
        /*Get day options based on month using test date
         * @method getDayOptions
         * @param {String} month
         * @return {Array} dayArray     array of day drop down options
         */
        function getDayOptions(month, yearIn, monthIn){
            var dayArray = [''],
                testDate,
                daysInMonth,
                i;
            if (month === '') { 
                return dayArray;
            }
            testDate = new Date(TAG.Util.parseDateToYear({year: yearIn.attr('value')}), monthIn.dropDownOptions.indexOf(month), 0);
            daysInMonth = testDate.getDate();
            for (i=1;i<daysInMonth+1;i++){
                dayArray.push(i);
            }
            return dayArray;
        }
        
        /*Set drop down options of a select input
         * @method setOptions()
         * @param {Object} select       select input
         * @param {Object} options      options to add to drop down
         * @param {String} value        selected value
         */
        function setOptions(select, options, value){
            var option,
                i;
            select.empty();
            select.dropDownOptions = options;
            for (i=0; i<options.length; i++) {
                option = $(document.createElement('option'));
                option.text(options[i]);
                option.attr('value', options[i]);
                select.append(option);
                //options[i].selected = true;
            }
            select.attr('value', value);
        }

        /*Set styling of a select input based on if its allowed
        * @param {Object} select        select input to style
        * @param {Boolean} allowed      whether its allowed (optional)
        * @return {Boolean}             whether its allowed
        */
        function toggleAllow(select, allowed){
            if (select.dropDownOptions.length === 1 || allowed === "false"){
                select.css({
                    'background-color': 'gray',
                    'opacity' : '0.3',
                });
                return false;
            }
            else {
                select.css({
                    'background-color': 'white',
                    'opacity' : '1'
                });
                return true;
            } 
        }
    }

    /** Create a button 
     * @method createButton
     * @param {String} text         button text
     * @param {Function} onclick    onclick function for button
     * @param css                   additional css to apply to button if specified
     * @return {Object} button      new button created
     */
    function createButton(text, onclick, css, isSaveButton) {
        var button = $(document.createElement('button')).text(text).css('border-radius','3.5px');
        button.attr('type', 'button');
        button.attr('class','button');
        if (css) {
            button.css(css);
        }
        button.click(onclick);
        if (isSaveButton) {
            button.prop("disabled", true);
            button.css("opacity", "0.4");
        }
        return button;
    }

    /**Create a label
     * @method createLabel
     * @param {String} text         label text
     * @return {Object} label       new label created
     */
    function createLabel(text) {
        var label = $(document.createElement('label')).text(text || "");
        return label;
    }

    /**Create a text input
     * @method createTextInput
     * @param {String} text         the default text for the input
     * @param {Boolean} defaultval  if true, reset to default text if empty and loses focus
     * @param maxlength             max length of the input in characters
     * @param hideOnClick
     * @param {Boolean} onlyNumbers only numeric characters are allowed
     * @return input                newly created input
     */
    function createTextInput(text, defaultval, maxlength, hideOnClick, readonly, onlyNumbers) {
        var input = $(document.createElement('input')).val(text);
        onlyNumbers = onlyNumbers || false;
        /*input.on('keyup', function () {
            var txt = (input && input[0] && input[0].value) ? input[0].value.replace(/[^àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\w\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') : "";
            if (input && input[0] && input[0].value && input[0].value!=txt) {
                input[0].value = txt;
            }
        });*/
        if (onlyNumbers) {
            input.on('keypress', function (event) {
                return (event.charCode >= 48 && event.charCode <= 57);
            });
        }
        if (defaultval) {
            input.attr("placeholder", defaultval);
        }
        input.attr('autocomplete', 'off');
        input.attr('spellcheck', 'false');
        input.addClass("searchBar");
        input.attr({
            'type': 'text',
            'maxlength': maxlength,
            'readonly': !!readonly
        });
        //input.on('change', function () { changesHaveBeenMade = true; }); //for autosaving
        return input;
    }

    /**Create a text area input 
     * @method createTextAreaInput
     * @param {String} text     default text for area
     * @param defaultval
     * @param hideOnClick
     * @return {Object} input    newly creted text input
     */
    function createTextAreaInput(text, defaultval, hideOnClick, maxLength) {
        if (typeof text === 'string') {
            text = text.replace(/<br \/>/g, '\n').replace(/<br>/g, '\n').replace(/<br\/>/g, '\n');
        }
        text = text.substring(0, 2001);
        var input = $(document.createElement('textarea')).val(text).attr({ 'id': 'settingsViewTextarea', 'maxlength': maxLength});
         input.css({
             'overflow': 'hidden',
         });
         /*input.bind('copy paste', function (e) {
             e.preventDefault();
         });*/
        //input.autoSize();
        doWhenReady(input, function (elem) {
            if (input[0].scrollHeight<=(root.find('#setViewSettingsContainer').height() * 0.5)){
                var realHeight = input[0].scrollHeight;
            }
            else{
                var realHeight= root.find('#setViewSettingsContainer').height() * 0.5;
            }
            $(input).css('height', realHeight + 'px');
        });
        input.on('keyup', function () {
            //var txt = (input && input.text()) ? input.text().replace(/[^àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\w\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') : "";
            if (input[0].scrollHeight <= (root.find('#setViewSettingsContainer').height() * 0.5)) {
                var realHeight = input[0].scrollHeight;
            }
            else {
                var realHeight = root.find('#setViewSettingsContainer').height() * 0.5;
            }
            /*if (input && input.text() && input.text()!=txt) {
                input.text(txt);
            }*/
            $(input).css('height', realHeight + 'px');
        });
        //input.on('change', function () { changesHaveBeenMade = true; }); //for autosaving
        return input;
    }

    /**Create a drop-down input element with a list to add options to
     * @method createSelectInput
     * @param {Array} options               list of options in the drop-down
     * @param {Object} value                current value of select menu
     * @return {HTML element} selectElt     element of type 'select'
     */
    function createSelectInput(options, value) {
        var selectElt = $(document.createElement('select')),
            option,
            i;
        selectElt.css({ 'overflow': 'scroll' });
        selectElt.dropDownOptions = options;
        for (i=0; i<options.length; i++) {
            option = $(document.createElement('option'));
            option.text(options[i]);
            option.attr('value', options[i]);
            selectElt.append(option);
            //options[i].selected = true;
        }
        selectElt.change(function () {
            //$('.primaryFont').css('font-family', selectElt.find(":selected").text());
            //$('.secondaryFont').css('font-family', selectElt.find(":selected").text());
        });
        selectElt.attr('value', value);
        //selectElt.on('change', function () { changesHaveBeenMade = true; }); //for autosaving
        return selectElt;
    }

    /**Create a color input which modifies the background color
     * of all elements matching the jquery selector 'selector'.
     * @method creatBGColorInput 
     * @param color 
     * @param selectorBackground            jQuery selector for elements background to be changed
     * @param selectorText                  jQuery selector for color of text in the element to be changed
     * @param {Function} getTransValue      returns a valid transparency value  
     * @return {Object} container           returns container holding new input
     */
    function createBGColorInput(color, selectorBackground, selectorText, getTransValue) {
        if (color.indexOf('#') !== -1) {
            color = color.substring(1, color.length);
        }
        var container = $(document.createElement('input'));
        container.attr('type', 'text');
        var picker = new jscolor.color(container[0], {});
        var hex = TAG.Util.UI.colorToHex(color);
        container.val(color);
        picker.fromString(color);
        if (selectorText === ".secondaryFont"){
            secondaryColorPicker = picker;
        } else {
            primaryColorPicker = picker;
        }
        picker.onImmediateChange = function () {
            if(selectorText) {
                updateTextColor(selectorText, container.val());
            } 
            if(selectorBackground) {
                updateBGColor(selectorBackground, container.val(), getTransValue());
            }
            if (selectorText != ".secondaryFont") {
                $('#serverInput').css('border-color', '#' + container.val());
                $('#passwordInput').css('border-color', '#' + container.val());
                $('#serverSubmit').css('border-color', '#' + container.val());
                $('#passwordSubmit').css('border-color', '#' + container.val());
            } 
        };
        //container.on('change', function () { changesHaveBeenMade = true; }); //for autosaving
        return container;
    }

    /**Set the bg color of elements maching jquery selector 'selector'
     * @method updateBGColor 
     * @param selector          jQuery selector of elements to be changed
     * @param hex               hex value of color
     * @param trans             transparency of color
     */
    function updateBGColor(selector, hex, trans) {
        $(selector).css('background-color', TAG.Util.UI.hexToRGB(hex) + trans / 100.0 + ')');

    }

    /**Sets the text color of text in the jQuery selector passed in
     * @method updateTextColor
     * @param {HTML element} selector          jQuery selector, the color of text inside the selector is changed
     * @param {Hex Value} color                color passed in as a hex value
     */
    function updateTextColor(selector, color) {
        $(selector).css({ 'color': '#' + color });
    }

    /**Prevent a container from being clicked on by added a div on top of it
     * @method preventClickthrough
     * @param {Object} container     container to prevent click through of
     */
    function preventClickthrough(container) {
        var cover = document.createElement('div');
        $(cover).css({
            'height': '100%',
            'width': '100%',
            'float': 'left',
            'position': 'absolute',
            'background-color': 'white',
            'opacity': '0',
            'top': '0px',
            'right': '0px',
            'z-index': '499',
        });
        $(cover).bind('click', function () { return false; });
        $(container).append(cover);
    }

    /**Sort a list with propery Name alphabetically, case insensitive
     * @method sortAZ
     * @param {Object} list
     * @return 
     */
    function sortAZ(list) {
        if (list.sort) {
            list.sort(function (a, b) {
                var aLower = a.Name.toLowerCase();
                var bLower = b.Name.toLowerCase();
                return (aLower < bLower) ? -1 : 1;
            });
        }
    }

    /**Sort a list with date metadata by date with most recent date first
     * @method sortDate
     * @param {Object} list 
     * @return 
     */
    function sortDate(list) {
        if (list.sort) {
            list.sort(function (a, b) {
                var aint = parseInt(a.Metadata.Date, 10);
                var bint = parseInt(b.Metadata.Date, 10);
                if (aint < bint) {
                    return 1;
                } else if (aint > bint) {
                    return -1;
                } else {
                    return 0;
                }
            });
        }
    }

    /**Perform a search 
     * @method search
     * @param val           value to search for
     * @param selector      jQuery selector of elements to search
     * @param childType     selector's type
     */
    function search(val, selector, childType) {
        $.each($(selector), function (i, child) {
            if ($(child).attr('id') === 'middleLoading')
                return;
            if (TAG.Util.searchString($(child).children(childType).text(), val)) {
                $(child).show();
            } else {
                $(child).hide();
            }
        });
    }

    /**Search data
     * @param val       value to search for
     * @param selector  jQuery selector for elements to be searched
     */
    function searchData(val, selector) {
        $.each($(selector), function (i, element) {
            var data = $(element).data();
            var show = false;
            $.each(data, function (k, v) {
                if (TAG.Util.searchString(v, val)) {
                    show = true;
                }
            });
            if (show) {
                $(element).show();
            } else {
                $(element).hide();
            }
        });
    }

    /**Update text on change
     * @method onChangeUpdateText
     * @param {Object} input    input to update
     * @param selector          jQuery selector of element to update
     * @param maxLength         maximum text length in characters
     * @return {Object}         updated input
     */
    function onChangeUpdateText(input, selector, maxlength) {
        input.keyup(function () {
            if (input.val().length > maxlength) {
                input.val(input.val().substring(0, maxlength));
            }
            $(selector).html(input.val().replace(/\n\r?/g, '<br />'));
        });
        input.keydown(function () {
            if (input.val().length > maxlength) {
                input.val(input.val().substring(0, maxlength));
            }
            $(selector).html(input.val().replace(/\n\r?/g, '<br />'));
        });
        input.change(function () {
            if (input.val().length > maxlength) {
                input.val(input.val().substring(0, maxlength));
            }
            $(selector).html(input.val().replace(/\n\r?/g, '<br />'));
        });
        return input;
    }

    /**Update a text input that takes in a number
     * @method onChangeUpdateNum
     * @param {Object} input            input to update
     * @param min                       minimum value of inputted number
     * @param max                       maximum value of inputted number
     * @param {Function} doOnChange     performed if input value is number between min and max   
     */
    function onChangeUpdateNum(input, min, max, doOnChange) {
        input.keyup(function () {
            var replace = input.val().replace(/[^0-9]/g, '');
            replace = Math.constrain(parseInt(replace, 10), min, max);
            if (isNaN(replace)) replace = 0;
            if (input.val() !== replace + '') {
                input.val(replace);
            }
            if (doOnChange)
                doOnChange(replace);
        });
        input.keydown(function () {
            var replace = input.val().replace(/[^0-9]/g, '');
            replace = Math.constrain(parseInt(replace, 10), min, max);
            if (isNaN(replace)) replace = 0;
            if (input.val() !== replace + '') {
                input.val(replace);
            }
            if (doOnChange)
                doOnChange(replace);
        });
        input.change(function () {
            var replace = input.val().replace(/[^0-9]/g, '');
            replace = Math.constrain(parseInt(replace, 10), min, max);
            if (isNaN(replace)) replace = 0;
            if (input.val() !== replace + '') {
                input.val(replace);
            }
            if (doOnChange)
                doOnChange(replace);
        });
    }


    /**from JavaScript: The Good Parts
     * @method is_array
     * @param value         value to check
     * @return {Boolean}    if value is an array
     */
    function is_array(value) {
        return Object.prototype.toString.apply(value) === '[object Array]';
    }

    /** Upload a file then calls the callback with the url and name of the file.
     * @method uploadFIle
     * @param type                  See TAG.Authoring.FileUploader for 'type' values
     * @param {Function} callback   
     * @param multiple              for batch upload
     * @param filter    
     */
    function uploadFile(type, callback, multiple, filter, fromImportPopUp) {
        console.log("file upload!");
        console.log(IS_WINDOWS);
        if (!IS_WINDOWS){
        //webappfileupload:   
        var names = [], locals = [], contentTypes = [], fileArray = [], i, urlArray = [];
        TAG.Authoring.WebFileUploader( // remember, this is a multi-file upload
            root,
            type,
            // local callback - get filename
            function (files, localURLs) {
                for (i = 0; i < files.length; i++) {
                    fileArray.push(files[i]);
                    names.push(files[i].name);
                    if (files[i].type.match(/image/)) {
                        contentTypes.push('Image');
                    } else if (files[i].type.match(/video/)) {
                        contentTypes.push('Video');
                    } else if (files[i].type.match(/audio/)) {
                        contentTypes.push('Audio');
                    }
                }
            },
            // remote callback - save correct name
            function (urls) {
                if (!is_array(urls)) { // check to see whether a single file was returned
                    urls = [urls];
                    names = [names];
                }
                for (i = 0; i < urls.length; i++) {
                    console.log("trying that new URL thing");
                    urlArray.push(urls[i]);
                    //console.log("urls[" + i + "] = " + urls[i] + ", names[" + i + "] = " + names[i]);
                }

                for (var i = 0; i < names.length; i++) {
                    console.log("The files being passed through names: " + names[i]);
                }
                callback(urls, names, contentTypes, fileArray);
            },
            filter || ['.jpg', '.png', '.gif', '.tif', '.tiff'],
            false,
            function () {
                root.append(TAG.Util.UI.popUpMessage(null, "There was an error uploading the file.  Please try again later."));
            },
            !!multiple, // batch upload disabled
            fromImportPopUp
            );
        } else {

        var names = [], locals = [], contentTypes = [], fileArray, i;
        TAG.Authoring.FileUploader( // remember, this is a multi-file upload
            root,
            type,
            // local callback - get filename
            function (files, localURLs) {
                fileArray = files;
                for (i = 0; i < files.length; i++) {
                    names.push(files[i].displayName);
                    var ext=files[i].fileType.toLowerCase();
                    if (files[i].contentType.match(/image/)) {
                        contentTypes.push('Image');
                    } else if (files[i].contentType.match(/video/) || ext === ".avi" || ext === ".wmv" || ext === ".mov" || ext === ".mp4" || ext === ".webm" || ext === ".ogv") {
                        contentTypes.push('Video');
                    } else if (files[i].contentType.match(/audio/)) {
                        contentTypes.push('Audio');
                    } else if (files[i].name.match('\.woff')) {
                        contentTypes.push('Font');
                    }
                }

                if (files.length > 0) {
                    var elementType;
                    switch (type) {
                        case 0:
                            elementType = "Standard";
                            break;
                        case 1:
                            elementType = "DeepZoom";
                            break;
                        case 2:
                            elementType = "Associated Media";
                            break;
                        case 3:
                            elementType = "Video Artwork";
                        case 4:
                            elementType = "Map";
                            break;
                        default:
                            elementType = "Unkown";
                    }
                    TAG.Telemetry.recordEvent("EndOfImport", function (tobj) {
                        tobj.number_imported = files.length;
                        tobj.element_type = elementType;
                    });
                }
            },
            // remote callback - save correct name
            function (urls) {
                if (!is_array(urls)) { // check to see whether a single file was returned
                    urls = [urls];
                    names = [names];
                }
                for (i = 0; i < urls.length; i++) {
                    //console.log("urls[" + i + "] = " + urls[i] + ", names[" + i + "] = " + names[i]);
                }
                callback(urls, names, contentTypes, fileArray);
            },
            filter || ['.jpg', '.png', '.gif', '.tif', '.tiff', '.woff'],
            false,
            function () {
                root.append(TAG.Util.UI.popUpMessage(null, "There was an error uploading the file.  Please try again later."));
            },
            !!multiple, // batch upload disabled
            fromImportPopUp
            );
        }
    }

    /**Create an overlay over the whole settings view with a spinning circle and centered text. This overlay is intended to be used 
     * only when the page is 'done'.  The overlay doesn't support being removed from the page, so only call this when the page will 
     * be changed!
     * @method loadingOverlay
     * @param {String} text     Text defaults to 'Loading...' if not specified. 
     */
    function loadingOverlay(text, opacity) {
        text = text || "Loading...";
        var overlay = $(document.createElement('div'));
        var opacity = opacity || 0.5;
        overlay.css({
            'position': 'absolute',
            'left': '0px',
            'top': '0px',
            'width': '100%',
            'height': '100%',
            'background-color': 'rgba(0,0,0,' + opacity + ')',
            'z-index': '1000',
        });
        root.append(overlay);

        var circle = $(document.createElement('img'));
        circle.attr('src', tagPath + 'images/icons/progress-circle.gif');
        circle.css({
            'height': 'auto',
            'width': '10%',
            'position': 'absolute',
            'left': '45%',
            'top': ($(window).height() - $(window).width() * 0.1) / 2 + 'px',
        });
        overlay.append(circle);

        var widthFinder = $(document.createElement('div'));
        widthFinder.css({
            'position': 'absolute',
            'visibility': 'hidden',
            'height': 'auto',
            'width': 'auto',
            'font-size': '200%',
        });
        widthFinder.text(text);
        root.append(widthFinder);

        var label = $(document.createElement('label'));
        label.css({
            'position': 'absolute',
            'left': ($(window).width() - widthFinder.width()) / 2 + 'px',
            'top': ($(window).height() - $(window).width() * 0.1) / 2 + $(window).width() * 0.1 + 'px',
            'font-size': '200%',
            'color': 'white',
        });
        widthFinder.remove();
        label.text(text);
        overlay.append(label);
    }
    
    /** Authentication error function
     * @method authError
     */
    function authError() {
        var popup = TAG.Util.UI.popUpMessage(function () {
            TAG.Auth.clearToken();
            rightQueue.clear();
            middleQueue.clear();
            TAG.Layout.StartPage(null, function (page) {
                TAG.Util.UI.slidePageRight(page);
            });
        }, "Could not authenticate, returning to the splash page.", null, true);
        root.append(popup);
        $(popup).show();
    }

    /**Error function
     * @method error
     * @param {Function} fn     function called if specified
     */
    function error(fn) {
        return function () {
            var popup = TAG.Util.UI.popUpMessage(null, "An unknown error occured.", null, true);
            root.append(popup);
            $(popup).show();
            fn && fn();
        }
    }

    /**Conflict function
    * @method conflict
    * @param doq            doq for which there is a conflict
    * @param {String} text      
    * @param fail
    */
    function conflict(doq, text, fail) {
        return function (jqXHR, ajaxCall) {
            var confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
                ajaxCall.force();
                // TODO: Text for change/delete
            }, "Your version of " + doq.Name + " is not up to date.  Are you sure you want to change " + doq.Name + "?", text, true, fail);
            root.append(confirmationBox);
            $(confirmationBox).show();
            TAG.Util.multiLineEllipsis($($($(confirmationBox).children()[0]).children()[0]));
        }
    }

    //function displayLoadingSettings() {
    //    settingsContainer.css({ visibility: 'hidden' });
    //    settings.css({ overflow: 'hidden' });
    //    buttonContainer.css({ visibility: 'hidden' });
    //    var changeLabel = createLabel('Changes are being saved...');
    //    changeLabel.attr('id', 'changeLabel');
    //    changeLabel.css({
    //        'position': 'absolute',
    //        'top': '15%',
    //        'z-index': '50',
    //        'height': 'auto',
    //        'width': '33%',
    //        'color': 'black',
    //        'font-size': '140%'
    //    });
    //    var progressCircCSS = {
    //        'position': 'absolute',
    //        'left': '40%',
    //        'top': '20%',
    //        'z-index': '50',
    //        'height': 'auto',
    //        'width': '20%'
    //    };
    //    var progressCL = LADS.Util.showProgressCircle(settings, progressCircCSS, '0px', '0px', true);
    //    settings.append(changeLabel);
    //    return progressCL;
    //};

    //function hideLoadingSettings(circle) {
    //    $('#changeLabel').remove();
    //    settingsContainer.css({ visibility: 'visible' });
    //    settings.css({ overflow: 'auto' });
    //    buttonContainer.css({ visibility: 'visible' });
    //    circle && LADS.Util.removeProgressCircle(circle);
    //};

    //function showLoading() {
    //    leftLabelContainer.empty();
    //    leftLabelContainer.append(createLeftLoading());
    //    buttonContainer.css({ visibility: 'hidden' });
    //    prepareViewer(true);
    //    pCircle2 = displayLoadingSettings();
    //};

    //function hideLoading() {
    //    buttonContainer.css({ visibility: 'visible' });
    //    hideLoadingSettings(pCircle2);
    //};

    //function backButtonClickHandler() {
    //    LADS.Auth.clearToken();
    //    rightQueue.clear();
    //    leftQueue.clear();
    //    $('#backButton').off('click');
    //    if (backPage) {
    //        var bpage = backPage();
    //        LADS.Util.UI.slidePageRight(bpage);
    //    } else {
    //        LADS.Layout.StartPage(null, function (page) {
    //            LADS.Util.UI.slidePageRight(page);
    //        });
    //    }
    //};

    //function refreshSplashScreen() {
    //    //console.log('\nsaveSplashScreen has finished.');
    //    TAG.Worktop.Database.getMain(function () {
    //        //console.log('reloading... ' + (prevSelectedSetting && prevSelectedSetting === nav[NAV_TEXT.general.text]));
    //        if (prevSelectedSetting && prevSelectedSetting === nav[NAV_TEXT.general.text]) {
    //            if (!(prevSelectedMiddleLabel && (prevSelectedMiddleLabel.text() === "Password Settings"))) {
    //                loadGeneralView(); //refreshes the general settings
    //            };
    //        };
    //    });
    //    saveQueue.isEmpty() && backButtonClicked && handleBackButtonClick();
    //}

    //function refreshExhibition(exhibition) {
    //    //console.log('\nsaveExhibition has finished.');
    //    TAG.Worktop.Database.getDoq(exhibition.Identifier, function (doq) {
    //        exhibition.label.text(doq.Name);
    //    });
    //    saveQueue.isEmpty() && backButtonClicked && handleBackButtonClick();
    //}

    //function refreshTour(tour) {
    //    //console.log('\nsaveTour has finished.');
    //    TAG.Worktop.Database.getDoq(tour.Identifier, function (doq) {
    //        tour.label.text(doq.Name);
    //    });
    //    saveQueue.isEmpty() && backButtonClicked && handleBackButtonClick();
    //}

    //function refreshAssocMedia(media) {
    //    //console.log('\nsaveAssocMedia has finished.');
    //    //TAG.Worktop.Database.getDoq(media.Identifier, function (doq) {
    //    //    media.label.text(doq.Name);
    //    //});
    //    saveQueue.isEmpty() && backButtonClicked && handleBackButtonClick();
    //}

    //function refreshArtwork(artwork) {
    //    //console.log('\nsaveArtwork has finished.');
    //    //TAG.Worktop.Database.getDoq(artwork.Identifier, function (doq) {
    //    //    artwork.label.text(doq.Name);
    //    //});
    //    saveQueue.isEmpty() && backButtonClicked && handleBackButtonClick();
    //}

    //function handleBackButtonClick() {
    //    TAG.Worktop.Database.getMain(function () {
    //        TAG.Auth.clearToken();
    //        rightQueue.clear();
    //        middleQueue.clear();
    //        backButton.off('click');
    //        if (backPage) {
    //            var bpage = backPage();
    //            TAG.Util.UI.slidePageRight(bpage);
    //        } else {
    //            TAG.Layout.StartPage(null, function (page) {
    //                TAG.Util.UI.slidePageRight(page);
    //            });
    //        }
    //        TAG.Util.UI.getStack()[0] = null;
    //    });
    //}


    function setUpFindContainer(){
        sortLabelContainer.text("Sort By:");
        searchLabelContainer.text("Search:");
        titleSort.addClass('sortByButton')
                  .click(function(){
                    if (inArtworkView){
                        sortByArt = "Title";
                        titleSort.css('background-color','white');
                        collectionSort.css('background-color','initial');
                        addedRecentlySort.css('background-color','initial');
                        loadArtView();
                    }
                    else if (inAssociatedView){
                        sortByAssoc = "Title";
                        titleSort.css('background-color','white');
                        collectionSort.css('background-color','initial');
                        addedRecentlySort.css('background-color','initial');
                        loadAssocMediaView();
                    }
                  })
                  .text("Title");
        collectionSort.addClass('sortByButton')
                    .click(function(){
                        if (inArtworkView){
                            sortByArt = "Collection";
                            titleSort.css('background-color','initial');
                            collectionSort.css('background-color','white');
                            addedRecentlySort.css('background-color','initial');
                            loadArtView();
                        }
                        else if (inAssociatedView){
                            sortByAssoc = "Collection";
                            titleSort.css('background-color','initial');
                            collectionSort.css('background-color','white');
                            addedRecentlySort.css('background-color','initial');
                            loadAssocMediaView();
                        }
                    })
                    .text("Collection");
        addedRecentlySort.addClass('sortByButton')
                    .click(function(){
                        if (inArtworkView){
                            sortByArt = "Recently Added";
                            titleSort.css('background-color','initial');
                            collectionSort.css('background-color','initial');
                            addedRecentlySort.css('background-color','white');
                            loadArtView();
                        }
                        else if (inAssociatedView){
                            sortByAssoc = "Recently Added";
                            titleSort.css('background-color','initial');
                            collectionSort.css('background-color','initial');
                            addedRecentlySort.css('background-color','white');
                            loadAssocMediaView();
                        }
                    })
                    .text("Recently Added");
        findButton.click(function(){
            if (findShown){
                findContainer.css('display','none');
                findBarDropIcon.css({
                   '-webkit-transform': 'rotate(90deg)',
                '-moz-transform': 'rotate(90deg)',
                '-o-transform': 'rotate(90deg)',
                '-ms-transform': 'rotate(90deg)',
                'transform': 'rotate(90deg)',     
                });
            } else{
                findContainer.css('display','inline-block');
                if (dropDown.css('display') != 'none'){
                    menuLabel.click();
                }
                findBarDropIcon.css({
                    '-webkit-transform': 'rotate(270deg)',
                '-moz-transform': 'rotate(270deg)',
                '-o-transform': 'rotate(270deg)',
                '-ms-transform': 'rotate(270deg)',
                'transform': 'rotate(270deg)',

                });
            }
            findShown = !findShown;
        });
    }

    function createAddToArtworkMenu() {
        //var addToArtworkLabel = $(document.createElement('button'))
            //.attr('id', 'addToArtworkLabel')
            //.appendTo(searchContainer)
        addToArtworkLabel.css({
            "color": "black",
            'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex,
            'float': 'left',
            //'font-size': '50%',
            'height': '40%',
            'margin-top': '2.8%',
            'padding-bottom': '1%',
            //'width': '48%',
            'border': '1px solid black',
            //'padding': '1.5% 0px 0px 0px',
            'padding-top': '-5%',
            'display': 'block',
            //<<<<<<< HEAD
            //                'position': 'absolute,
            //            }).css('border-radius', '3.5px');
            //        var addToArtworkDiv = $(document.createElement('div'))
            //            .css({
            //=======
        }).css('border-radius', '3.5px')
        //var addToArtworkDiv = $(document.createElement('div'))
        /**
        addToArtworkDiv.css({
>>>>>>> 5939587aa6c3ffc6d1a091df042c069b27e2cedf
                width: '80%',
                height: '100%',
                'text-align': 'center',
                'vertical-align': 'middle',
                'padding': '0px 10% 0px 10%'
            })
        **/
           /**
            .append($(document.createElement('div')).text('Add to Artwork').css({
                'display': 'inline-block',
                'margin-right': '5%',
            }));
                **/
            .text('Add to Artwork');
        if (!IS_WINDOWS) {
            addToArtworkLabel.css('font-size', '100%');
        } else {
            addToArtworkLabel.css('font-size', '50%');
        }
            //.appendTo(addToArtworkLabel);
        //return addToArtworkLabel;
    }

    function createDropdownAssocMediaMenu() {
        //var addMenuLabel = $(document.createElement('button'))
            //.attr('id', 'addMenuLabel')
            //.appendTo(searchContainer)
        menuLabel.css({
                "color": "black",
                'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex,
                'float':'left',
                'height':'40%',
                'margin-top':'2.8%',
                'margin-left':'2%',
                'padding-bottom':'1%',
                'padding-left':'5%',
                'padding-right':'2%',
                'width': '35%',
                'border': '1px solid black',
                //'padding': '1.5% 0px 0px 0px',
                'padding-top':'-10%',
                'display': 'block',
            }).css('border-radius', '3.5px');
        if (!IS_WINDOWS){
            menuLabel.css('font-size','100%');
        } else{
            menuLabel.css('font-size','50%');
        }
        var addMenuArrowIcon = $(document.createElement('img'))
            .attr('id', 'addMenuArrowIcon')
            .attr('src', tagPath + 'images/icons/RightB.png')
            .css({
                width: '10%',
                height: '10%',
                display:'inline-block',
                'margin-right': '5%',
                'margin-left': '3%',
                'margin-top': '5%',
                '-webkit-transform': 'rotate(90deg)',
                '-moz-transform': 'rotate(90deg)',
                '-o-transform': 'rotate(90deg)',
                '-ms-transform': 'rotate(90deg)',
                'transform': 'rotate(90deg)',
                'padding-left': '7%',
                'padding-right':'0%'
            })
        if (IS_WINDOWS) {
            addMenuArrowIcon.css({
                width: '6%',
                height: '6%',
                'margin-top': '2%',
                'margin-right': '2%'
            });
        } 
        var addMenuLabelDiv = $(document.createElement('div'))
            .css({
                width:'auto',
                height: '100%',
                'text-align': 'center',
                'vertical-align': 'middle'
                //'padding':'0px 10% 0px 10%'
            })
            .append($(document.createElement('div')).text('Import').css({
                'display': 'inline-block',
                'margin-right': '1%',
                'float':'left'
            }))
            .append(addMenuArrowIcon)
            .appendTo(menuLabel);
        dropDown.attr('id', 'dropDown')
            .appendTo(searchContainer)
            .css({
                "left": '52%',
                "display":"block",
                "position": "absolute",
                "color": "rgb(256, 256, 256)",
                'width': '48%',
                'background-color': 'rgba(0,0,0,0.95)',
                'float': 'left',
                'top': '50%',
                'clear': 'left',
                'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex,
                'border': '1px solid white',
            });
        if (IS_WINDOWS) {
            dropDown.css({
                'font-size': '70%',
                'right': '4%',
                'left': '',
                 width: '37%'
            })
        }
        dropDown.hide();
        menuLabel.click(function () {
            if (showDropdown) {
                $("#setViewMiddleLabelContainer").css('overflow', 'auto');
                menuLabel.css({ "background-color": "transparent" });
                addMenuArrowIcon.css({
                    '-webkit-transform': 'rotate(90deg)',
                    '-moz-transform': 'rotate(90deg)',
                    '-o-transform': 'rotate(90deg)',
                    '-ms-transform': 'rotate(90deg)',
                    'transform': 'rotate(90deg)',
                    'padding-left': '7%',
                    'padding-right': '0%'
                });
                dropDown.hide();
            } else {
                menuLabel.css({ "background-color": "white" });
                $("#setViewMiddleLabelContainer").css('overflow', 'hidden');
                addMenuArrowIcon.css({
                    '-webkit-transform': 'rotate(270deg)',
                    '-moz-transform': 'rotate(270deg)',
                    '-o-transform': 'rotate(270deg)',
                    '-ms-transform': 'rotate(270deg)',
                    'transform': 'rotate(270deg)',
                    'padding-left': '0%',
                    'padding-right':'7%',
                    'float':'left'
                });
                console.log(findContainer.css('display'));
                if (findContainer.css('display') != 'none'){
                        dropDown.css('top',(searchContainer.height()-findContainer.height())*0.5 + 'px');
                } else {
                    dropDown.css('top','50%');
                }
                dropDown.show();
            }
            showDropdown = !showDropdown;
        });

        var fromFile = $(document.createElement('label'))
            .attr('id', 'fromFile')
            .text('From File')
            .css({
                "display": "block",
                'border-color': 'white',
                'color': 'white',
                'background-color': 'black',
                //'border-style': 'solid',
                'border-width': 'thin',
                'border-bottom-style': 'none',
                'padding-left': '15px',
                'padding-right': '15px',
                'font-size': '85%',
                'font-weight': '600',
                'padding-bottom':'5%',
                'padding-top':'5%',
            })
            .on('mouseenter', function () {
                fromFile.css({
                    'background-color': 'white',
                    'color': 'black',
                    'border-color': 'black',
                });
            })
            .on('mouseleave', function (e) {
                fromFile.css({
                    'background-color': 'black',
                    'color': 'white',
                    'border-color': 'white',
                });
            })
            .click(function () {
                menuLabel.click();
                createAsset();
            });
        var iFrameAsset = $(document.createElement('label'))
            .attr('id', 'Embed Video')
            .text('Embed Video')
            .css({
                "display": "block",
                'border-color': 'white',
                'color': 'white',
                'background-color': 'black',
                //'border-style': 'solid',
                'border-width': 'thin',
                'padding-left': '15px',
                'padding-right': '15px',
                'font-size': '85%',
                'font-weight': '600',
                'padding-bottom': '5%',
                'padding-top': '5%',
            })
            .on('mouseenter', function () {
                iFrameAsset.css({
                    'background-color': 'white',
                    'color': 'black',
                    'border-color': 'black',
                });
            })
            .on('mouseleave', function (e) {
                iFrameAsset.css({
                    'background-color': 'black',
                    'color': 'white',
                    'border-color': 'white',
                });
            })
            .click(function () {
                menuLabel.click();
                createIframeSourceDialog();
            });
        dropDown.append(fromFile);
        dropDown.append(iFrameAsset);
        menuLabel.on("mousedown", function () {
            if (!showDropdown) {
                menuLabel.css({ "background-color": "white" });
            }            
        });
        menuLabel.on("mouseleave", function () {
            if (!showDropdown) {
                menuLabel.css({ "background-color": "transparent" });
            }
        });
       
        
        //return addMenuLabel;
    }

    return that;



};
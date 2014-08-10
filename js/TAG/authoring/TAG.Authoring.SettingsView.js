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
   
     
    var root = TAG.Util.getHtmlAjax('../tagcore/html/SettingsView.html'), //Get html from html file

        //get all of the ui elements from the root and save them in variables
        middleLoading = root.find('#setViewLoadingCircle'),
        settingsContainer = root.find('#setViewSettingsContainer'),
        searchContainer = root.find('#setViewSearchContainer'),
        navBar = root.find('#setViewNavBar'),
        searchbar = root.find('#setViewSearchBar'),
        newButton = root.find('#setViewNewButton'),
        secondaryButton = root.find('#setViewSecondaryButton'),
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

        // key handling stuff
        deleteType,
        toDelete,
        currentList,
        currentIndex = 0,
        currentSelected,
		currentSelectedSetting,
		leftButton,
        popUpBoxVisible = false,

        // booleans
		inGeneralView = false,
        inCollectionsView = false,
        inArtworkView = false,
        inAssociatedView = false,
        inToursView = false,
        inFeedbackView = false,

        //dropdown associated media menu
        menuLabel = createDropdownAssocMediaMenu();

        //window.addEventListener('keydown', keyHandler),
        TAG.Util.UI.initKeyHandler();
        TAG.Util.UI.getStack()[0] = settingsViewKeyHandler;

    loadHelper();
    if (callback) {
        callback(that);
    }
	   
    //an array to store video guids that need to be converted
    var conversionVideos = [];
	function checkConversion() {
        for (var i = 0; i < conversionVideos.length; i++) {
            var artwork = conversionVideos[i];
            LADS.Worktop.Database.getConvertedVideoCheck(
                (function (i, artwork) {
                    return function (output) {
                        if (output!==""||output !== "False") {
                            //console.log("converted: ");
                            var element = $(document.getElementById("videoInPreview"));
                            if (element && element.attr("identifier") === output) {
                                reloadVideo(element);
                                conversionVideos.remove(artwork);
                            }
                        } else {
                            //console.log("not converted: ");
                        }
                    }
                })(i, artwork), null, conversionVideos[i]);
        }
	}

    setInterval(checkConversion, 1000 * 60);
	function reloadVideo(element) {
        var source = element.attr("src");
        if (element[0].children.length < 3) {
            element.removeAttr("src");
            var sourceWithoutExtension = source.substring(0, source.lastIndexOf('.'));
            var sourceMP4 = sourceWithoutExtension + ".mp4";
            var sourceWEBM = sourceWithoutExtension + ".webm";
            var sourceOGV = sourceWithoutExtension + ".ogv";

            addSourceToVideo(element, sourceMP4, 'video/mp4');
            addSourceToVideo(element, sourceWEBM, 'video/webm');
            addSourceToVideo(element, sourceOGV, 'video/ogv');
        }
        $(document.getElementById("middleLoading")).remove();
        $(function () {
            $("#middleLoading").remove();
        })
        if($("#videoErrorMsg")){
            $("#videoErrorMsg").remove();
        }
        element.show();
        var video = document.getElementById("videoInPreview");
        video.load();
        video.play();
    }
    
    
    //an array to store video guids that need to be converted
    var conversionVideos = [];
    /**
    * check for conversion in interval
    */
    function checkConversion() {
        for (var i = 0; i < conversionVideos.length; i++) {
            var artwork = conversionVideos[i];
            TAG.Worktop.Database.getConvertedVideoCheck(
                (function (i, artwork) {
                    return function (output) {
                        if (output !== "" && output !== "False" && output !== "Error") {
                            //console.log("converted: ");
                            var element = $(document.getElementById("videoInPreview"));
                            if (element && element.attr("identifier") === output) {
                                reloadVideo(element);
                                conversionVideos.remove(artwork);
                            }
                        } else if (output === "Error") {
                            $("#videoErrorMsg").remove();
                            $("#leftLoading").remove();
                            var msg = "An error occured when converting this video. Please try again";
                            viewer.append(TAG.Util.createConversionLoading(msg));
                            conversionVideos.remove(artwork);
                        }
                        else {
                            //console.log("not converted: ");
                        }
                    }
                })(i, artwork), null, conversionVideos[i]);
        }
    }
    //setInterval(checkConversion, 1000 * 60);

    /** Reload the video when conversion is done
    * @ param: videoInPreview element
    */

    function reloadVideo(element) {
        var source = element.attr("src");
        if (element[0].children.length < 3) {
            element.removeAttr("src");
            var sourceWithoutExtension = source.substring(0, source.lastIndexOf('.'));
            var sourceMP4 = sourceWithoutExtension + ".mp4";
            var sourceWEBM = sourceWithoutExtension + ".webm";
            var sourceOGV = sourceWithoutExtension + ".ogv";

            addSourceToVideo(element, sourceMP4, 'video/mp4');
            addSourceToVideo(element, sourceWEBM, 'video/webm');
            addSourceToVideo(element, sourceOGV, 'video/ogv');
        }
        $(document.getElementById("leftLoading")).remove();
        $(function () {
            $("#leftLoading").remove();
        })
        if ($("#videoErrorMsg")) {
            $("#videoErrorMsg").remove();
        }
        element.show();
        var video = document.getElementById("videoInPreview");
        video.load();
        video.play();
    }

    /**Handles enter key press on the SettingsView page
     * @ method enterKeyHandlerSettingsView
     */
    function enterKeyHandlerSettingsView(event) {
        if (searchbar.is(':focus')) {
            if (!searchbar.val()) {
                resetView();
                searchbar.css({ 'background-image': 'none' });
            } else {
                doSearch();
            }
            event.stopPropagation();
            event.preventDefault();
        }
        if (!$("input, textarea").is(":focus")) {
            if (inCollectionsView) { manageCollection(currentList[currentIndex]);  }
            if (inArtworkView) {
                if ($(document.getElementById('artworkEditorButton')).length) {
                    editArtwork(currentList[currentIndex]);
                }
                if ($(document.getElementById('thumbnailButton')).length) {
                    saveThumbnail(currentList[currentIndex], false);
                }
             }
            if (inAssociatedView) { assocToArtworks(currentList[currentIndex]); }
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
            //if (!changesHaveBeenMade) {
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
        navBar.append(nav[NAV_TEXT.tour.text] = createNavLabel(NAV_TEXT.tour, loadTourView));
        //navBar.append(nav[NAV_TEXT.feedback.text] = createNavLabel(NAV_TEXT.feedback, loadFeedbackView));

        searchbar.css({
            'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")',
            'background-size': 'auto 50%',
            'background-repeat': 'no-repeat',
            'background-position': '2% center'
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
    function switchView(view, id) {
        resetLabels('.navContainer');
        switch (view) {
            case "Exhibitions":
                selectLabel(nav[NAV_TEXT.exhib.text]);
                prevSelectedSetting = nav[NAV_TEXT.exhib.text];
                loadExhibitionsView(id);
                break;
            case "Artworks":
                selectLabel(nav[NAV_TEXT.art.text]);
                prevSelectedSetting = nav[NAV_TEXT.art.text];
                loadArtView(id);
                break;
            case "Associated Media": 
                selectLabel(nav[NAV_TEXT.media.text]);
                prevSelectedSetting = nav[NAV_TEXT.media.text];
                loadAssocMediaView(id);
                break;
            case "Tours":
                
                selectLabel(nav[NAV_TEXT.tour.text]);
                prevSelectedSetting = nav[NAV_TEXT.tour.text];
                loadTourView(id);
                break;
            case "Feedback":
                selectLabel(nav[NAV_TEXT.feedback.text]);
                prevSelectedSetting = nav[NAV_TEXT.feedback.text];
                loadFeedbackView(id);
                break;
            case "General Settings":
            default:
                selectLabel(nav[NAV_TEXT.general.text]);
                prevSelectedSetting = nav[NAV_TEXT.general.text];
                loadGeneralView();
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
     * @return {Object} container   container containing new label
     */
    function createNavLabel(text, onclick) {
        var container = $(document.createElement('div'));
        container.attr('class', 'navContainer');
        container.attr('id', 'nav-' + text.text);
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
            // If a label is clicked return if its already selected.
            //if (prevSelectedSetting === container) {
            //    return;
            //} else {
            //    changesHaveBeenMade && currentMetadataHandler && saveQueue.add(currentMetadataHandler());
            //    changesHaveBeenMade = false;
            //}
            // Reset all labels and then select this one
            resetLabels('.navContainer');
            selectLabel(container);
            // Do the onclick function
            if (onclick) {
                onclick();
            }
            prevSelectedSetting = container;
        });

        var navtext = $(document.createElement('label'));
        navtext.attr('class','navtext');
        navtext.text(text.text);

        var navsubtext = $(document.createElement('label'));
        navsubtext.attr('class','navsubtext');
        navsubtext.text(text.subtext);

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

        prepareNextView(false);

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

        // Create inputs
        //var alphaInput = createTextInput(Math.floor(alpha * 100), true);
        var bgImgInput = createButton('Change Image', function () {
            //changesHaveBeenMade = true;
			uploadFile(TAG.Authoring.FileUploadTypes.Standard, function (urls) {
                var url = urls[0];
                bgImgInput.val(url);
                $('#background').css({
                    'background-image': 'url("' + TAG.Worktop.Database.fixPath(url) + '")',
                    'background-size': 'cover',
                });
            });
        });
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
        var primaryFontColorInput = createBGColorInput(primaryFontColor, null, '.primaryFont', function() { return 100; });
        var secondaryFontColorInput = createBGColorInput(secondaryFontColor, null, '.secondaryFont', function() { return 100; });
        var fontFamilyInput = createSelectInput(['Arial', 'Calibri', 'Comic Sans MS', 'Courier New', 'Franklin Gothic', 'Raavi', 'Segoe Print', 'Segoe UI Light', 'Source Sans Pro', 'Times New Roman', 'Trebuchet MS', 'Verdana'], TAG.Worktop.Database.getFontFamily());
        var idleTimerDurationInput = createTextInput(idleTimerDuration, false, 3, false, false, true);
        var startPage = previewStartPage(primaryFontColorInput, secondaryFontColorInput);

        var font = fontFamilyInput.find(":selected").text();
        $('.primaryFont').css('font-family', font);
        $('.secondaryFont').css('font-family', font);
        
        // Handle changes

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
        var fontFamilySetting = createSetting('Font Family', fontFamilyInput);
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
        settingsContainer.append(fontFamilySetting);
        settingsContainer.append(idleTimerDurationSetting);
		//automatically save General Settings - Customization
        onChangeUpdateText(idleTimerDurationInput, null, 3);
        //TAG.Util.IdleTimer.TwoStageTimer().s1d = idleTimerDurationInput.val();

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

        // Save button

        var saveButton = createButton('Save Changes', function () {
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
                bgImgInput: bgImgInput,                             //Background image
                //logoInput: logoInput,                               //Logo image
                //backgroundColorInput: backgroundColorInput,         //Background Color
                //backgroundOpacityInput: backgroundOpacityInput,    //Background Opacity
                primaryFontColorInput: primaryFontColorInput,       //Primary Font Color
                secondaryFontColorInput: secondaryFontColorInput,   //Secondary Font Color
                fontFamilyInput: fontFamilyInput,
                idleTimerDurationInput: idleTimerDurationInput
            });
        }, {
            'margin-right': '3%',
            'margin-top': '1%',
            'margin-bottom': '1%',
            'margin-left': '.5%',
            'float': 'right'
        });

        
        // preview buttons
        var previewStartPageButton = createButton('Splash Screen', function () { previewStartPage(primaryFontColorInput, secondaryFontColorInput) }, {
            'margin-left': '2%',
            'margin-top': '1%',
            'margin-right': '0%',
            'margin-bottom': '3%',
        });

        var previewCollectionsPageButton = createButton('Collections Page', function () {
            previewCollectionsPage(primaryFontColorInput, secondaryFontColorInput);
            },
            {
            'margin-left': '2%',
            'margin-top': '1%',
            'margin-right': '0%',
            'margin-bottom': '3%',
        });

        var previewArtworkViewerButton = createButton('Artwork Viewer', function () { previewArtworkViewer(primaryFontColorInput, secondaryFontColorInput) }, {
            'margin-left': '2%',
            'margin-top': '1%',
            'margin-right': '0%',
            'margin-bottom': '3%',
        });

        buttonContainer.append(saveButton);
        buttonContainer.append(previewStartPageButton);
        buttonContainer.append(previewCollectionsPageButton);
        buttonContainer.append(previewArtworkViewerButton);
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
        var fontFamily = inputs.fontFamilyInput.val();
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
            FontFamily: fontFamily,
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
        var startPage = TAG.Layout.StartPage({ primaryFontColor: primaryFontInput.val(), secondaryFontColor: secondaryFontInput.val() }, function (startPage) {
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
                        loadExhibition(val);
                    } else {
                        middleLoading.before(label = createMiddleLabel(val.Name, null, function () {
                            //if (changesHaveBeenMade) {
                            //    //saveArray.push(previousIdentifier);
                            //    //currentMetadataHandler && saveQueue.add(currentMetadataHandler());
                            //    //changesHaveBeenMade = false;
                            //}
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
        }

        cancelLastSetting = function () { cancel = true; };
    }

    //CLICK HANDLER FOR SORT OPTIONS
    function clickCallback(sortDiv) {
        return function () {
            if (sortDiv.attr("setSort") === "true" || sortDiv.attr("setSort") === true) {
                if (sortOptionsCount>0){
                    sortOptionsCount--;
                }

                sortDiv.attr("setSort", false);
                sortDiv.css({
                    "background-color": "white",
                    "color": "black",
                    "border": "2px solid black"
                });
            } else {
                if (sortOptionsCount < 4) {
                    sortOptionsCount++;
                    sortDiv.attr("setSort", true);
                    sortDiv.css({
                        "background-color": "#0040FF",
                        "color": "white",
                        "border": "2px solid white"
                    });
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
                "height": "100px",
                'float': 'right',
                'margin-right': '3%',
                "overflow": "scroll",
                "overflow-x": "hidden"
            });

        var sortObj, sortDiv;
        var sortOptions = sortOptionsObj.Metadata;
        if (sortOptions) {
            for (var sortObj in sortOptions) {
                if (sortOptions.hasOwnProperty(sortObj) && sortObj !== "__Created" && sortObj != "Count") {
                    var key = "";
                    if (sortObj.charAt(0) === '?') {
                        key = sortObj.substr(1);
                    } else {
                        key = sortObj;
                    }
                    var sortObjArray = sortOptions[sortObj].split(",");
                    if (sortObjArray.length === 2 && sortObjArray[0] === "0" && sortObjArray[1] == "false") {
                        continue;
                    }
                    var sortDiv = $(document.createElement("div"))
                        .text(key)
                        .addClass("sortOptionDiv");
                    var setSort = sortObjArray[sortObjArray.length - 1];
                    sortDiv.attr("setSort", setSort);
                    if (setSort === true || setSort === "true") {
                        sortOptionsCount++;
                        sortDiv.css({
                            "background-color": "#0040FF",
                            "color": "white",
                            "border": "2px solid white"
                        });
                    }
                    sortDiv.click(clickCallback(sortDiv));
                    sortOptionsDiv.append(sortDiv);

                }
            }
        }
        return sortOptionsDiv;
    }    

    /**Editing collections by adding/removing artworks
     * @method manageCollection
     * @param {doq} exhibition      the current collection to be edited
     */
     function manageCollection(exhibition) {
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
        prepareViewer(true);
        clearRight();
        deleteType = deleteExhibition;
        toDelete = exhibition;

        // Set the viewer to exhibition view (see function below)
        exhibitionView(exhibition);

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
        });
        publicInput.attr('class', 'settingButton');
        if (privateState) {
            privateInput.css('background-color', 'white');
        } else {
            publicInput.css('background-color', 'white');
        }
        var pubPrivDiv = $(document.createElement('div'));
        pubPrivDiv.append(privateInput).append(publicInput);

        // local visibility
        var localVisibility = LADS.Util.localVisibility(exhibition.Identifier);
        var invisibilityInput = createButton('Hidden', function () {
            //if (localVisibility) { changesHaveBeenMade = true; };
            localVisibility = false;
            invisibilityInput.css('background-color', 'white');
            visibilityInput.css('background-color', '');
        }, {
            'min-height': '0px',
            'margin-right': '4%',
            'width': '48%',
        });
        var visibilityInput = createButton('Visible', function () {
            //if (!localVisibility) { changesHaveBeenMade = true; };
            localVisibility = true;
            visibilityInput.css('background-color', 'white');
            invisibilityInput.css('background-color', '');
        }, {
            'min-height': '0px',
            'width': '48%',
        });
        if (localVisibility) {
            visibilityInput.css('background-color', 'white');
        } else {
            invisibilityInput.css('background-color', 'white');
        }
        var visDiv = $(document.createElement('div'));
        visDiv.append(invisibilityInput).append(visibilityInput);

        //TO-DO: add in on server side from TAG.Worktop.Database.js changeExhibition() 
        var assocMediaShown;
        if (exhibition.Metadata.AssocMediaView === "true" || exhibition.Metadata.AssocMediaView === "false") {
            exhibition.Metadata.AssocMediaView === "true" ? assocMediaShown = true: assocMediaShown = false;
        } else {
            //backwards compatibility
            assocMediaShown = false;
        }
        var showAssocMedia = createButton('Show Associated Media View', function () {
            //(!assocMediaShown) && function () { changesHaveBeenMade = true; }();
            assocMediaShown = true;
            showAssocMedia.css('background-color', 'white');
            hideAssocMedia.css('background-color','');
        }, {
            'min-height': '0px',
            'margin-right': '4%',
            'width':'48%',
        });
        showAssocMedia.attr('class','settingButton');
        var hideAssocMedia = createButton('Hide Associated Media View', function () {
            //(assocMediaShown) && function () { changesHaveBeenMade = true; }();
            assocMediaShown = false;
            hideAssocMedia.css('background-color','white');
            showAssocMedia.css('background-color','');
            }, {
            'min-height': '0px',
            'width': '48%'
        });
        hideAssocMedia.attr('class','settingButton');
        if (assocMediaShown){
            showAssocMedia.css('background-color','white');
        }else{
            hideAssocMedia.css('background-color','white');
        }
        var timelineOptionsDiv = $(document.createElement('div'));
        timelineOptionsDiv.append(showTimeline).append(hideTimeline);

        var timelineShown;
        if (exhibition.Metadata.Timeline === "true" || exhibition.Metadata.Timeline === "false") {
            exhibition.Metadata.Timeline === "true" ? timelineShown = true: timelineShown = false;
        } else {
            //backwards compatibility
            timelineShown = true;
        }
        var showTimeline = createButton('Show Timeline', function () {
            //(!timelineShown) && function () { changesHaveBeenMade = true; }();
            timelineShown = true;
            showTimeline.css('background-color', 'white');
            hideTimeline.css('background-color','');
        }, {
            'min-height': '0px',
            'margin-right': '4%',
            'width':'48%',
            'padding-left': '10px',
            'padding-right': '10px'
        });
        showTimeline.attr('class','settingButton');
        var hideTimeline = createButton('Hide Timeline', function () {
            //(timelineShown) && function () { changesHaveBeenMade = true; }();
            timelineShown = false;
            hideTimeline.css('background-color','white');
            showTimeline.css('background-color','');
            }, {
            'min-height': '0px',
            'width': '48%'
        });
        hideTimeline.attr('class','settingButton');
        if (timelineShown){
            showTimeline.css('background-color','white');
        }else{
            hideTimeline.css('background-color','white');
        }

        var timelineOptionsDiv = $(document.createElement('div'));
        timelineOptionsDiv.append(showTimeline).append(hideTimeline);
        var assocMediaOptionsDiv = $(document.createElement('div'));
        assocMediaOptionsDiv.append(showAssocMedia).append(hideAssocMedia);

        var privateSetting;
        var localVisibilitySetting;
        var name;
        var desc;
        var bg;
        var sortDropDown = null;
        var sortOptions = null;
        var idLabel;
        var timeline;
        var nameInput;
        var descInput;
        var bgInput;
        var assocMedia;
        var sortOptionsObj = null;
        if (!exhibition.Metadata.SortOptionsGuid) { //NEEDS T OBE CHANGESEDFDJAKLSDJF
            TAG.Worktop.Database.changeExhibition(exhibition.Identifier, {AddSortOptions: true}, function (sortOptionsDoq) {
                TAG.Worktop.Database.getDoq(sortOptionsDoq.statusText, function (sortOptionsDoq) {
                    sortOptionsObj = sortOptionsDoq;
                    sortDropDown = createSortOptions(sortOptionsObj);
                    createCollectionSettings();
                });
            }, authError, conflict(exhibition, "Update", loadExhibitionsView), error(loadExhibitionsView));
        } else {
            TAG.Worktop.Database.getDoq(exhibition.Metadata.SortOptionsGuid, function (sortOptionsDoq) {
                sortOptionsObj = sortOptionsDoq;
                sortDropDown = createSortOptions(sortOptionsObj);
                createCollectionSettings();
            });         
        }

        function createCollectionSettings() {

            nameInput = createTextInput(TAG.Util.htmlEntityDecode(exhibition.Name), 'Collection name', 40);
            descInput = createTextAreaInput(TAG.Util.htmlEntityDecode(exhibition.Metadata.Description), false);
            bgInput = createButton('Change Background Image', function () {
                //changesHaveBeenMade = true;
                uploadFile(TAG.Authoring.FileUploadTypes.Standard, function (urls) {
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

            descInput.focus(function () {
                if (descInput.val() === 'Description')
                    descInput.select();
            });

            // Handle Changes
            onChangeUpdateText(nameInput, '#exhibition-title', 40);
            onChangeUpdateText(descInput, '#description-text', 1790);

            privateSetting = createSetting('Change Publish Setting', pubPrivDiv);
            name = createSetting('Collection Name', nameInput);
            desc = createSetting('Collection Description', descInput);
            bg = createSetting('Collection Background Image', bgInput);
            timeline = createSetting('Change Timeline Setting', timelineOptionsDiv);
            assocMedia = createSetting('Change View Settings', assocMediaOptionsDiv);

            if (sortDropDown){
                sortOptions = createSetting('Sort Options', sortDropDown);
            }

            settingsContainer.append(privateSetting);
            settingsContainer.append(name);
            settingsContainer.append(desc);
            settingsContainer.append(bg);
            settingsContainer.append(timeline);
            settingsContainer.append(assocMedia);
            if (sortOptions){
                settingsContainer.append(sortOptions);
            }
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
        var saveButton = createButton('Save Changes', function () {
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
                assocMediaInput : assocMediaShown
            });
        }, {
            'margin-right': '3%',
            'margin-top': '1%',
            'margin-bottom': '1%',
            'margin-left': '.5%',
            'float': 'right',
        });

        var deleteButton = createButton('Delete Collection', function () {
            deleteExhibition(exhibition);
        }, {
            'margin-left': '2%',
            'margin-top': '1%',
            'margin-right': '0',
            'margin-bottom': '3%',
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

        var artPickerButton = createButton('Manage Collection', function () {
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

        }, {
            'margin-left': '2%',
            'margin-top': '1%',
            'margin-right': '0%',
            'margin-bottom': '3%',
        });

        leftButton = artPickerButton;
        // Sets the viewer to catalog view
        function catalogView() {
            rightQueue.add(function () {
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
                var options = {
                    backCollection : exhibition,
                    previewing : true
                };
                var exhibView = new TAG.Layout.CollectionsPage(options);
                var exroot = exhibView.getRoot();
                $(exroot).css('z-index','-1'); // otherwise, you can use the search box and sorting tabs!
                viewer.append(exroot);
                preventClickthrough(viewer);
            });
        }

        buttonContainer.append(artPickerButton).append(deleteButton).append(saveButton);
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

        var sortOptionChanges = {};
        if (inputs.sortOptions) {
            for (var i = 0; i < inputs.sortOptions[0].children.length; i++) {
                var option = $(inputs.sortOptions[0].children[i]);
                var setSort = option.attr("setSort");
                if (i > 2) {
                    sortOptionChanges["?" + option.text()] = setSort;
                } else {
                    sortOptionChanges[option.text()] = setSort;
                }
            }
        }
        var options = {
            Name: name,
            Private: priv,
            Description: desc,
            SortOptions: JSON.stringify(sortOptionChanges),
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
    function deleteExhibition(exhibition) {

        var confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
            prepareNextView(false);
            clearRight();
            prepareViewer(true);

            // actually delete the exhibition
            TAG.Worktop.Database.deleteDoq(exhibition.Identifier, function () {
                if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.exhib.text]) {
                    return;
                }
                loadExhibitionsView();
            }, authError, conflict(exhibition, "Delete", loadExhibitionsView), error(loadExhibitionsView));
        }, "Are you sure you want to delete " + exhibition.Name + "?", "Delete", true, function() { $(confirmationBox).hide(); });
        root.append(confirmationBox);
        $(confirmationBox).show();
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
        }

        cancelLastSetting = function () { cancel = true; };
    }

    /**Load a tour to the right side
     * @method loadTour
     * @param {Object} tour     tour to load
     */
    function loadTour(tour) {
        prepareViewer(true);
        clearRight();
        deleteType = deleteTour;
        toDelete = tour;

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
            if (prevSelectedMiddleLabel && prevSelectedMiddleLabel.text() !== tour.Name) {
                TAG.Util.removeProgressCircle(circle);
                return;
            }
            TAG.Util.removeProgressCircle(circle);
            // Set the image as a background image, centered and contained
            viewer.css('background', 'black url(' + TAG.Worktop.Database.fixPath(tour.Metadata.Thumbnail) + ') no-repeat center / contain');
        });

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
            'min-height': '0px',
            'margin-right': '4%',
            'width': '48%',
        });
        privateInput.attr('class','settingButton');
        var publicInput = createButton('Publish', function () {
            //(privateState) && function () { changesHaveBeenMade = true; }();
            privateState = false;
            publicInput.css('background-color', 'white');
            privateInput.css('background-color', '');
        }, {
            'min-height': '0px',
            'width': '48%',
        });
        publicInput.attr('class','settingButton');
        if (privateState) {
            privateInput.css('background-color', 'white');
        } else {
            publicInput.css('background-color', 'white');
        }
        var pubPrivDiv = $(document.createElement('div'));
        pubPrivDiv.append(privateInput).append(publicInput);

        var nameInput = createTextInput(TAG.Util.htmlEntityDecode(tour.Name), true, 120);
        var descInput = createTextAreaInput(TAG.Util.htmlEntityDecode(tour.Metadata.Description).replace(/\n/g,'<br />') || "", false);
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

        var privateSetting = createSetting('Change Publish Setting', pubPrivDiv);
        var name = createSetting('Tour Name', nameInput);
        var desc = createSetting('Tour Description', descInput);
        var tourIdLabel = createSetting('Tour ID (read-only)', tourIdInput);

        settingsContainer.append(privateSetting);
        settingsContainer.append(name);
        settingsContainer.append(desc);
        settingsContainer.append(tourIdLabel);

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
        var editButton = createButton('Edit Tour',
            function () { editTour(tour); },
            {
                'margin-left': '2%',
                'margin-top': '1%',
                'margin-right': '0%',
                'margin-bottom': '3%',
            });
        var deleteButton = createButton('Delete Tour',
            function () { deleteTour(tour); },
            {
                'margin-left': '2%',
                'margin-top': '1%',
                'margin-right': '0%',
                'margin-bottom': '3%',
            });
        var duplicateButton = createButton('Duplicate Tour',
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
        var saveButton = createButton('Save Changes',
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
            });

        buttonContainer.append(editButton).append(duplicateButton).append(deleteButton).append(saveButton);
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
        // Overlay doesn't spin... not sure how to fix without redoing tour authoring to be more async
        loadingOverlay('Loading Tour...');
        middleQueue.clear();
        rightQueue.clear();
        setTimeout(function () {
            var toureditor = new TAG.Layout.TourAuthoringNew(tour, function () {
                TAG.Util.UI.slidePageLeft(toureditor.getRoot());
            });
        }, 1);
    }

    /**Delete a tour
     * @method deleteTour
     * @param {Object} tour     tour to delete
     */
    function deleteTour(tour) {
        var confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
            prepareNextView(false);
            clearRight();
            prepareViewer(true);

            // actually delete the tour
            TAG.Worktop.Database.deleteDoq(tour.Identifier, function () {
                if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.tour.text]) {
                    return;
                }
                loadTourView();
            }, authError, conflict(tour, "Delete", loadTourView), error(loadTourView));
        }, "Are you sure you want to delete " + tour.Name + "?", "Delete", true, function () { 
            $(confirmationBox).hide(); 
        });
        root.append(confirmationBox);
        $(confirmationBox).show();
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

        inGeneralView = false;
        inCollectionsView = false;
        inArtworkView = false;
        inAssociatedView = true;
        inToursView = false;
        inFeedbackView = false;

        var list;
        currentIndex = 0;

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

        if (typeof matches !== "undefined") {       //If there are no search results to display
            list = matches;
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
                displayLabels();
            });
        }


        function displayLabels() {
            if (list[0] && list[0].Metadata) {
                $.each(list, function (i, val) {
                    if (cancel) return;
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
                                imagesrc = tagPath + '/images/audio_icon.svg'; // TODO iframe replace icon
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
                });
                // Hide the loading label when we're done
                middleQueue.add(function () {
                    middleLoading.hide();
                });
            } else {
                middleLoading.hide();
            }
        }

        cancelLastSetting = function () { cancel = true; };
    }
    
    /**Loads associated media to the right side
     * @method loadAssocMedia
     * @param {Object} media    associated media to load
     */
    function loadAssocMedia(media) {
        prepareViewer(true);
        clearRight();
        deleteType = deleteAssociatedMedia;
        toDelete = media;
        // Create an img element to load the image
        var type = media.Metadata.ContentType.toLowerCase();
        var holder;
        var source = (type === 'iframe') ? media.Metadata.Source : TAG.Worktop.Database.fixPath(media.Metadata.Source);
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
                TAG.Worktop.Database.getConvertedVideoCheck(
                function (output) {
                    if (output !== "" && output !== "False" && output !== "Error") {
                        holder.removeAttr('src');
                        var sourceWithoutExtension = source.substring(0, source.lastIndexOf('.'));
                        var sourceMP4 = sourceWithoutExtension + ".mp4";
                        var sourceWEBM = sourceWithoutExtension + ".webm";
                        var sourceOGV = sourceWithoutExtension + ".ogv";

                        addSourceToVideo(holder, sourceMP4, 'video/mp4');
                        addSourceToVideo(holder, sourceWEBM, 'video/webm');
                        addSourceToVideo(holder, sourceOGV, 'video/ogv');
                        $(document.getElementsByClassName("convertVideoBtn")[0]).hide().data('disabled', true);
                    } else {
                        convertBtn.show();
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
                            if (media.Extension !== ".mp4") {
                                $("#videoErrorMsg").remove();
                                $("#leftLoading").remove();
                                var msg = "This video format has not been converted to formats supported in multiple browsers.";
                                viewer.append(LADS.Util.createConversionLoading(msg, true));
                            }
                        }
                        holder.attr('src', source);
                    }
                }, null, media.Identifier);
                if (conversionVideos.indexOf(media.Identifier) > -1) {
                    var msg = "This video is being converted to compatible formats for different browsers";
                    viewer.append(TAG.Util.createConversionLoading(msg));
                } else {
                    holder[0].onerror = TAG.Util.videoErrorHandler(holder, viewer, media.Metadata.Converted);
                }
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
                    src: source,
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
        (source && type !== 'text') && holder.attr('src', source);

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
                viewer.append(holder);
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
        var titleInput = createTextInput(TAG.Util.htmlEntityDecode(media.Name) || "", true, 2000);
        var descInput = createTextAreaInput(TAG.Util.htmlEntityDecode(media.Metadata.Description).replace(/\n/g,'<br />') || "", true);

        titleInput.focus(function () {
            if (titleInput.val() === 'Title')
                titleInput.select();
        });
        descInput.focus(function () {
            if (descInput.val() === 'Description')
                descInput.select();
        });

        onChangeUpdateText(titleInput, null, 2000);
        onChangeUpdateText(descInput, null, 5000);

        var title = createSetting('Title', titleInput);
        var desc = createSetting('Description', descInput);
        var yearMetadataDivSpecs = createYearMetadataDiv(media);

        settingsContainer.append(title);
        settingsContainer.append(desc);
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
        
        var assocButton = createButton('Associate to Artworks',
            function () { assocToArtworks(media); /*changesHaveBeenMade = true;*/ },
            {
                'float': 'left',
                'margin-left': '2%',
                'margin-top': '1%',
                'margin-right': '0%',
                'margin-bottom': '3%',
            });
        
        leftButton = assocButton;
        var deleteButton = createButton('Delete',
            function () { deleteAssociatedMedia(media); /*changesHaveBeenMade = true;*/ },
            {
                'margin-right': '0%',
                'margin-top': '1%',
                'margin-bottom': '3%',
                'margin-left': '2%',
                'float': 'left',
            });

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

        var saveButton = createButton('Save Changes',
            function () {
                if (titleInput.val() === undefined || titleInput.val() === "") {
                    titleInput.val("Untitled Asset");
                }
                saveAssocMedia(media, {
                    titleInput: titleInput,
                    descInput: descInput,
                    yearInput: yearMetadataDivSpecs.yearInput,
                    monthInput: yearMetadataDivSpecs.monthInput,
                    dayInput: yearMetadataDivSpecs.dayInput,
                    timelineYearInput: yearMetadataDivSpecs.timelineYearInput,
                    timelineMonthInput: yearMetadataDivSpecs.timelineMonthInput,
                    timelineDayInput: yearMetadataDivSpecs.timelineDayInput
                });
            }, {
                'margin-right': '3%',
                'margin-top': '1%',
                'margin-bottom': '1%',
                'margin-left': '.5%',
                'float': 'right'
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
        buttonContainer.append(assocButton);
        if (media.Metadata.ContentType.toLowerCase() === 'video') {
            var convertBtn = createButton('Convert Video',
                    function () {
                        var source = media.Metadata.Source;
                        var newFileName = source.slice(8, source.length);
                        var index = newFileName.lastIndexOf(".");
                        var fileExtension = newFileName.slice(index);
                        var baseFileName = newFileName.slice(0, index);
                        if (media.Metadata.Converted !== "True") {
                            TAG.Worktop.Database.convertVideo(function () {
                            }, null, newFileName, fileExtension, baseFileName, media.Identifier);
                            conversionVideos.push(media.Identifier);
                            $("#videoErrorMsg").remove();
                            $("#leftLoading").remove();
                            var msg = "This video is being converted to compatible formats for different browsers";
                            viewer.append(TAG.Util.createConversionLoading(msg));
                            holder[0].onerror = TAG.Util.videoErrorHandler(holder, viewer, "False");
                            convertBtn.hide().data('disabled', true);
                        }
                    }, {
                        'margin-right': '0%',
                        'margin-top': '1%',
                        'margin-bottom': '3%',
                        'margin-left': '2%',
                        'float': 'left'
                    })
            convertBtn.attr('class', 'button convertVideoButton');
            convertBtn.attr("disabled", "");
            buttonContainer.append(thumbnailButton).append(convertBtn);
        } else if (media.Metadata.ContentType.toLowerCase() === 'image' && !media.Metadata.Thumbnail && media.Metadata.Source && media.Metadata.Source[0] === '/' && !source.match(/.mp3/)) {
            // hacky way to see if asset was imported recently enough to support thumbnailing (these are /Images/_____.__
            // rather than http:// _______/Images/_______.__
            buttonContainer.append(generateAssocMediaThumbnailButton);
        }
        buttonContainer.append(deleteButton).append(saveButton); //SAVE BUTTON//
    }

    /**Save an associated media
     * @method saveAssocMedia
     * @param {Object} media    associated media to save
     * @param {Object} inputs   keys for media title and description
     */
    function saveAssocMedia(media, inputs) {
        var name = inputs.titleInput.val(),
            year = inputs.yearInput.val(),
            month = inputs.monthInput.val(),
            day = inputs.dayInput.val(),
            timelineYear = inputs.timelineYearInput.val(),
            timelineMonth = inputs.timelineMonthInput.val(),
            timelineDay = inputs.timelineDayInput.val(),
            desc = inputs.descInput.val();

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
    function deleteAssociatedMedia(media) {
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
    }

    /**Brings up an artwork chooser for a particular associated media
     * @method assocToArtworks
     * @param {Object} media    media to associate to artworks
     */
    function assocToArtworks(media) {
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
        var modifiedURL = src,
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
            var options = {
                Source: modifiedURL,
                Name: modifiedURL
            };
            TAG.Worktop.Database.createIframeAssocMedia(options, onSuccess);
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
            prepareNextView(false);
            clearRight();
            prepareViewer(true);

            if(files.length > 0) {
                durationHelper(0);
            }

            function durationHelper(j) {
                if (contentTypes[j] === 'Video') {
                    files[j].properties.getVideoPropertiesAsync().done(function (VideoProperties) {
                        durations.push(VideoProperties.duration / 1000); // duration in seconds
                        updateDoq(j);
                    }, function (err) {
                        console.log(err);
                    });
                } else if (contentTypes[j] === 'Audio') {
                    files[j].properties.getMusicPropertiesAsync().done(function (MusicProperties) {
                        durations.push(MusicProperties.duration / 1000); // duration in seconds
                        updateDoq(j);
                    }, function (error) {
                        console.log(error);
                    });
                } else {
                    durations.push(null);
                    updateDoq(j);
                }
            }

            function incrDone() {
                done++;
                if (done >= total) {
                    loadAssocMediaView(toScroll.Identifier);
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
                    }
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
        }, true, ['.jpg', '.png', '.gif', '.tif', '.tiff', '.mp4', '.mp3', '.mp4', '.webm', '.ogv']);
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
        $(searchbar).blur(); //////////
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
        } else if (inAssociatedView) {
            loadAssocMediaView(null, matches);
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



    // Art Functions:

    /**Loads art view
     * @method loadArtView
     * @param {Object} id   id of middle label to start on
     */
    function loadArtView(id, matches) {

        inGeneralView = false;
        inCollectionsView = false;
        inArtworkView = true;
        inAssociatedView = false;
        inToursView = false;
        inFeedbackView = false;

        var list;
        currentIndex = 0;
        prepareNextView(true, "Import", createArtwork);
        prepareViewer(true);
        clearRight();
        var cancel = false;

        //if (generalIsLoading || collectionsIsLoading ||
        //  artworksIsLoading || associatedMediaIsLoading || toursIsLoading) {
        //    hideLoading();
        //    hideLoadingSettings(pCL);
        //};
        //generalProgressCircle && hideLoadingSettings(generalProgressCircle);
        //artworksIsLoading && showLoading();
        //(saveArray.indexOf(previousIdentifier) < 0) && function () { hideLoading(); hideLoadingSettings(pCL); };

        if (typeof matches !== "undefined") {       //If there are no search results to display
            list = matches;
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
                displayLabels();
            });
        }
        

        function displayLabels() {
            if (list[0] && list[0].Metadata) {
                $.each(list, function (i, val) {
                    if (cancel) return;
                    // Add each label in a separate function in the queue
                    // so the UI doesn't lock up
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
                });
                // Hide the loading label when we're done
                middleQueue.add(function () {
                    middleLoading.hide();
                });
            } else {
                middleLoading.hide();
            }
        }
            
        cancelLastSetting = function () { cancel = true; };
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
        prepareViewer(true);
        clearRight();
        deleteType = deleteArtwork;
        toDelete = artwork;

        // Create an img element to load the image
        var mediaElement;
        if (artwork.Metadata.Type !== 'VideoArtwork') {
            mediaElement = $(document.createElement('img'));
            mediaElement.attr('src', TAG.Worktop.Database.fixPath(artwork.URL));
        } else {
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
                    if (output !== "" && output !== "False" && output !== "Error") {
                        
                        var sourceMP4 = sourceWithoutExtension + ".mp4";
                        var sourceWEBM = sourceWithoutExtension + ".webm";
                        var sourceOGV = sourceWithoutExtension + ".ogv";

                        addSourceToVideo(mediaElement, sourceMP4, 'video/mp4');
                        addSourceToVideo(mediaElement, sourceWEBM, 'video/webm');
                        addSourceToVideo(mediaElement, sourceOGV, 'video/ogv');
                    } else {
                        if (sourceExt === ".mp4") { //IN WIN8APP ONLY BECAUSE AUTHORING IN WIN8

                            if (output === "False") {
                                $(document.getElementsByClassName("convertVideoBtn")[0]).hide();
                                $("#videoErrorMsg").remove();
                                $("#leftLoading").remove();
                                var msg = "This video is being converted to compatible formats for different browsers";
                                viewer.append(TAG.Util.createConversionLoading(msg));
                                conversionVideos.push(artwork.Identifier);
                            } else if (output === "Error") {
                                $(document.getElementsByClassName("convertVideoBtn")[0]).show();
                                $("#videoErrorMsg").remove();
                                $("#leftLoading").remove();
                                var msg = "An error occured when converting this video. Please try again";
                                viewer.append(TAG.Util.createConversionLoading(msg, true));
                            } else {
                                $(document.getElementsByClassName("convertVideoBtn")[0]).show();
                                //if (artwork.Extension !== ".mp4") {
                                $("#videoErrorMsg").remove();
                                $("#leftLoading").remove();
                                var msg = "This video format has not been converted to formats supported in multiple browsers.";
                                viewer.append(TAG.Util.createConversionLoading(msg, true));
                            }
                        } else {

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
            viewer.append(mediaElement);
        }

        var titleInput = createTextInput(TAG.Util.htmlEntityDecode(artwork.Name), true, 55);
        var artistInput = createTextInput(TAG.Util.htmlEntityDecode(artwork.Metadata.Artist), true, 55);
        var descInput = createTextAreaInput(TAG.Util.htmlEntityDecode(artwork.Metadata.Description).replace(/\n/g, '<br />') || "", "", false);
        var customInputs = {};
        var customSettings = {};
        var desc = createSetting('Description', descInput);
        var yearMetadataDivSpecs = createYearMetadataDiv(artwork);

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

        onChangeUpdateText(titleInput, null, 500);
        onChangeUpdateText(artistInput, null, 150);
        onChangeUpdateText(yearMetadataDivSpecs.yearInput, null, 100);
        onChangeUpdateText(descInput, null, 5000);

        var title = createSetting('Title', titleInput);
        var artist = createSetting('Artist', artistInput);

        if (artwork.Metadata.InfoFields) {
            $.each(artwork.Metadata.InfoFields, function (key, val) {
                customInputs[key] = createTextInput(TAG.Util.htmlEntityDecode(val), true);
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
        editArt = createButton('Enter Artwork Editor',
            function () { editArtwork(artwork); },
            {
                'margin-left': '2%',
                'margin-top': '1%',
                'margin-right': '0%',
                'margin-bottom': '3%',
            });
        leftButton = editArt;
        editArt.attr("id", "artworkEditorButton");
        var deleteArt = createButton('Delete Artwork',
            function () { deleteArtwork(artwork); },
            {
                'margin-left': '2%',
                'margin-top': '1%',
                'margin-right': '0%',
                'margin-bottom': '3%',
            });
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
        var saveButton = createButton('Save Changes',
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
                    customInputs: customInputs                                     //Artwork custom info fields
                });
            }, {
                'margin-right': '3%',
                'margin-top': '1%',
                'margin-bottom': '1%',
                'margin-left': '.5%',
                'float': 'right'
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
        if (artwork.Metadata.Type !== 'VideoArtwork') {
            buttonContainer.append(editArt).append(deleteArt).append(saveButton).append(xmluploaderbtn); //SAVE BUTTON//
        } else {
            var convertBtn = createButton('Convert Video',
                    function () {
                        var source = artwork.Metadata.Source;
                        var newFileName = source.slice(8, source.length);
                        var index = newFileName.lastIndexOf(".");
                        var fileExtension = newFileName.slice(index);
                        var baseFileName = newFileName.slice(0, index);

                        TAG.Worktop.Database.convertVideo(function () {
                        }, null, newFileName, fileExtension, baseFileName, artwork.Identifier);
                        //conversionVideos.push(artwork.Identifier);
                        //$("#videoErrorMsg").remove();
                        //$("#leftLoading").remove();
                        //var msg = "This video is being converted to compatible formats for different browsers";
                        //viewer.append(TAG.Util.createConversionLoading(msg));
                        mediaElement[0].onerror = TAG.Util.videoErrorHandler(mediaElement, viewer, "False");
                        //convertBtn.hide().data('disabled', true);
                        convertBtn.hide();
                    }, {
                        'margin-right': '0%',
                        'margin-top': '1%',
                        'margin-bottom': '3%',
                        'margin-left': '2%',
                        'float': 'left'
                    })
            convertBtn.attr('class', 'button convertVideoBtn');
            //convertBtn.attr("disabled", "");
            convertBtn.hide();
            /*if (artwork.Metadata.Converted!=="True" && conversionVideos.indexOf(artwork.Identifier) === -1) {
                convertBtn.show().data('disabled', false);
            } else {
                convertBtn.hide().data('disabled', true);
            }*/
            buttonContainer.append(thumbnailButton).append(convertBtn).append(xmluploaderbtn).append(deleteArt).append(saveButton); //SAVE BUTTON//
        }
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
                    console.log("success?");
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

    /**Create an artwork (import), possibly more than one
     * @method createArtwork
     */
    function createArtwork() {
        uploadFile(TAG.Authoring.FileUploadTypes.DeepZoom, function (urls, names, contentTypes, files) {
            var check, i, url, name, done=0, total=urls.length, durations=[], toScroll, alphaName;
            prepareNextView(false);
            clearRight();
            prepareViewer(true);

            function incrDone() {
                done++;
                if (done >= total) {
                    loadArtView(toScroll.Identifier);       //Scroll down to a newly-added artwork
                } else {
                    durationHelper(done);
                }
            }

            //////////
            if (files.length > 0) {
                durationHelper(0);
            }

            function durationHelper(j) {
                if (contentTypes[j] === 'Video') {
                    files[j].properties.getVideoPropertiesAsync().done(function (VideoProperties) {
                        durations.push(VideoProperties.duration / 1000); // duration in seconds
                        updateDoq(j);
                    }, function (err) {
                        console.log(err);
                    });
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
                }
            }

        }, true, ['.jpg', '.png', '.gif', '.tif', '.tiff', '.mp4', '.mp3', '.webm', '.ogv']);
    }
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
            var input = createTextInput(val, null, null, false, false);
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
                                var warningBox = TAG.Util.UI.PopUpConfirmation(function () {
                                    toparse = true;
                                    parsefile();
                                }, "The file is larger than 30MB. Parsing it might crash your computer. Are you sure you want to continue?", "Confirm", true, function () {
                                    toparse = false;
                                });
                                root.append(warningBox);
                                $(warningBox).show();
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
                if (counter < 4) {
                    infoFields[ele] = data[ele];
                    // create input field for new cus field
                    inputs.customInputs[ele] = createTextInput(TAG.Util.htmlEntityDecode(data[ele]), true);
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

        metadataPickerOverlay.css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex);
        metadataPickerOverlay.append(metadataPicker);

        metadataPicker.append(metadataPickerHeader);

        //searchbar
        searchbar.css({
            'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")',
            'background-size': 'auto 50%',
            'background-repeat': 'no-repeat',
            'background-position': '2% center'
        });
        searchbar.on('click focus', function () { searchbar.css({ 'background-image': 'none' }); });
        searchbar.on('blur focusout', function () { (!searchbar.val()) && searchbar.css({ 'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")' }); });

        metadataPicker.append(searchbar);

        //search function in terms of titles
        function searchtitles(tofind, alltitles, container) {
            var searchresults = [];
            curlist = [];
            var title, ind;
            for (ind in alltitles) {
                title = alltitles[ind];
                if (TAG.Util.searchString(title, tofind)) {
                    searchresults.push(ind);
                    curlist.push(metadatalist[ind]);
                }
            }
            //generate mtholders for the results
            metadataLists.empty();
            for (var mtfield in fields) {
                fields[mtfield].field.hide();
            }
            counter = 0;
            var num = searchresults.length < 30 ? searchresults.length : 30;
            for (var j = 0; j < num; j++) {
                var curtitle = alltitles[searchresults[j]];
                var titlediv = makemtholder(curtitle, searchresults[j]);
                counter++;
                if (j === 0)
                    titlediv.click();
            }
        }

        // creates a panel for all the metadata objects
        metadataPicker.append(metadataLists);
        metadataLists.bind('scroll', function () {
            if ($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
                if (counter < curlist.length) {
                    var num = counter + 30 <= curlist.length ? 30 : curlist.length - counter;
                    for (var k = 0; k < num; k++) {
                        if (counter + k < curlist.length) {
                            makemtholder(allTitles[counter + k], counter + k);
                            counter++;
                        }
                    }
                }
            }
        })

        // creates a panel for all metadata's detailed info
        metadataPicker.append(metadataInfos);
        metadataInfos.append(metadataholder);

        for (i = 0; i < metadatalist.length; i++) {
            var mt = metadatalist[i];
            var title = mt["title"];
            if (!mt['title'])
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

        function makemtholder(ttl, index) {
            var mtHolder = $(document.createElement('div')).addClass('mtHolder').attr('id', index).text(ttl);
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
                            var input = createTextInput(selectedmetadata[rest], null, null, false, true);
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




        var metadataPickerCancel = $(document.createElement('button')).attr("id", "metadataPickerCancel");
        metadataPickerCancel.text("Cancel");
        
        // cancel button click handler
        metadataPickerCancel.click(function () {
            metadataPickerOverlay.fadeOut();
            $('.metadataInfos').empty();
            metadataPickerCancel.disabled = true;
        });
        metadataPicker.append(metadataPickerCancel);


        var metadataPickerImport = $(document.createElement('button')).attr("id", "metadataPickerImport");
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

        metadataPicker.append(metadataPickerImport);

        root.append(metadataPickerOverlay);
        $(".parsingOverlay").fadeOut();
        metadataPickerOverlay.fadeIn();
    }
    /**Edit an artwork
     * @method editArtwork
     * @param {Object} artwork   artwork to edit
     */
    function editArtwork(artwork) {
        // Overlay doesn't spin... not sure how to fix without redoing tour authoring to be more async
        loadingOverlay('Loading Artwork...');
        middleQueue.clear();
        rightQueue.clear();
        setTimeout(function () {
            TAG.Util.UI.slidePageLeft((TAG.Layout.ArtworkEditor(artwork)).getRoot());
        }, 1);
    }

    /**Delete an artwork
     * @method deleteArtwork
     * @param {Object} artwork      artwork to delete
     */
    function deleteArtwork(artwork) {
        var confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
            prepareNextView(false);
            clearRight();
            prepareViewer(true);

            // actually delete the artwork
            TAG.Worktop.Database.deleteDoq(artwork.Identifier, function () {
                if (prevSelectedSetting && prevSelectedSetting !== nav[NAV_TEXT.art.text]) {
                    return;
                }
                loadArtView();
            }, authError, authError);
        }, "Are you sure you want to delete " + artwork.Name + "?", "Delete", true, function () { $(confirmationBox).hide() });
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
            description = inputs.descInput.val();

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
            if(extension.match(/mp4/) || extension.match(/ogv/) || extension.match(/webm/)) {
                container.data('isVideoArtwork', true);
            } else {
                container.data('isStaticArtwork', true);
            }
        }

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
            resetLabels('.middleLabel');
            selectLabel(container, !noexpand);
            if (onclick) {
                onclick();
            }
            prevSelectedMiddleLabel = container;
            currentSelected = container;
        });
        if (onDoubleClick) {
            container.dblclick(onDoubleClick);
        }
        var width;
        if (imagesrc) {
            var image = $(document.createElement('img'));
            image.attr('src', imagesrc);
            image.css({
                'height': 'auto',
                'width': '20%',
                'margin-right': '5%',
            });
            container.append(image);
            

            var progressCircCSS = {
                'position': 'absolute',
                'left': '5%',
                'z-index': '50',
                'height': 'auto',
                'width': '10%',
                'top': '20%',
            };
            var circle = TAG.Util.showProgressCircle(container, progressCircCSS, '0px', '0px', false);
            image.load(function () {
                TAG.Util.removeProgressCircle(circle);
            });
            width = '75%';
        } else {
            width = '95%';
        }

        var label = $(document.createElement('div'));
        label.attr('class', 'labelText');
        label.css({'width': width});

        if (!imagesrc) {
            label.css({
                'padding-top': '0.4%',
                'padding-left': '1.3%',
            });
        }
        label.text(text);

        container.append(label);

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
        middleQueue.clear();
        middleLabelContainer.empty();
        middleLabelContainer.append(middleLoading);
        middleLoading.show();
        secondaryButton.css("display", "none");

        if (!inAssociatedView) {
            menuLabel.hide();
            newButton.text(newText);
            newButton.unbind('click').click(newBehavior);
            if (!newText) newButton.hide();
            else newButton.show();
        } else {
            newButton.hide();
            menuLabel.show();
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
    }

    /**Prepares the viewer on the right side
     * @method prepareViewer
     * @param {Boolean} showViewer    whether the preview window is shown 
     * @param {String} text           text to add to the viewer (in a textbox)
     * @param {Boolean} showButtons   whether the buttonContainer is shown
     */
    function prepareViewer(showViewer,text, showButtons) { 
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
    function createSetting(text, input, width, labelLeft) {
        var container = $(document.createElement('div'));
        container.css({
            'width': '100%',
            'margin-bottom': '4%',
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
    * @return {Object} yearMetadataDivSpecs     div with year and timeline year options, list of input fields
    */
    function createYearMetadataDiv(work){
        
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
        yearInput = createTextInput(TAG.Util.htmlEntityDecode(work.Metadata.Year), true, 20);
        var yearDescriptionDiv = $(document.createElement('div'));
        monthInput = createSelectInput(getMonthOptions(yearInput.attr('value')), work.Metadata.Month);
        monthInput.css('margin-right', '0%');
        dayInput = createSelectInput(getDayOptions(monthInput.attr('value'),yearInput,monthInput), work.Metadata.Day);
        dayInput.css('margin-right', '0%');
        timelineInputText = work.Metadata.TimelineYear || getTimelineInputText(yearInput);
        timelineYearInput = createTextInput(timelineInputText, true, 20);
        if (timelineYearInput.val()===''){
            timelineYearInput.attr('placeholder', 'Type valid year');
        }
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
            height : '20px',
            'margin-bottom' : '4%'
        });
        year = createSetting('Year', yearInput, 60);
        year.css({
            width: '32%',
            display: 'inline-block',
            position: 'relative',
            'float': 'left'
        });
        month = createSetting('Month', monthInput, 60);
        month.css({
            width: '32%',
            'padding-left': '1%',
            'position':'relative',
            display: 'inline-block',
            'float': 'left'
        });
        toggleAllow(monthInput);
        day = createSetting('Day', dayInput, 70);
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
            'margin-bottom': '4%',
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
            'height': '25px',
            'position': 'absolute',
            'left': '0%',
            'margin-bottom':'1%',
            'margin-left': '2%',
            'font-size': '70%',
            'white-space': 'nowrap',
            'display':'inline-block'
        });
        yearDescriptionDiv.text("Year format examples: 2013, 800 BC, 17th century, 1415-1450");

        //Link input values of date fields to dynamically change/disable               
        yearInput.on('input', function(){
            setOptions(monthInput, getMonthOptions(yearInput.attr('value')),'');
            toggleAllow(monthInput);
            setOptions(dayInput, getDayOptions(monthInput.attr('value'),yearInput,monthInput));
            toggleAllow(dayInput);
            if (!timelineYearJustChanged|| timelineYearInput.val()===''){
                timelineYearInput.val(getTimelineInputText(yearInput));
                if (timelineYearInput.val()===''){
                    timelineYearInput.attr('placeholder','Type valid year');
                }
                timelineYearJustChanged = false;
                setOptions(timelineMonthInput, getMonthOptions(timelineYearInput.attr("value")));
                toggleAllow(timelineMonthInput);
                setOptions(timelineDayInput, getDayOptions(timelineMonthInput.attr("value"),timelineYearInput,timelineMonthInput));
                toggleAllow(timelineDayInput);
            }
            timelineYearAutofilled = false;
        });
        monthInput.change(function(){
            setOptions(dayInput,getDayOptions(monthInput.attr("value"),yearInput,monthInput),dayInput.attr('value'));
            toggleAllow(dayInput);
            if (timelineMonthInput.attr("value") === "") {
                timelineMonthInput.attr("value",monthInput.attr("value"));
                setOptions(timelineDayInput, getDayOptions(timelineMonthInput.attr("value"),timelineYearInput,timelineMonthInput));
                toggleAllow(timelineDayInput);
            }
        });
        dayInput.change(function(){
            if (timelineDayInput.attr("value")=== "" && timelineDayInput.dropDownOptions.length>1){
                timelineDayInput.attr("value", dayInput.attr("value"));
            };
        });
        timelineYearInput.on('input', function(){
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
        timelineMonthInput.change(function(){
            setOptions(timelineDayInput,getDayOptions(timelineMonthInput.attr("value"),timelineYearInput,timelineMonthInput),timelineDayInput.attr('value'));
            toggleAllow(timelineDayInput, true);
        });

        //Set up year metadatadiv
        yearMetadataDiv.css({
            'width' : '100%'
        });

        yearMetadataDiv.append(yearDiv)
                       .append(yearDescriptionDiv)
                       .append(timelineYearDiv);

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
                                   .replace(/ad/gi,'')
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
                options[i].selected = true;
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
    function createButton(text, onclick, css) {
        var button = $(document.createElement('button')).text(text);
        button.attr('type', 'button');
        button.attr('class','button');
        if (css) {
            button.css(css);
        }
        button.click(onclick);
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
        
        if (onlyNumbers) {
            input.on('keypress', function (event) {
                return (event.charCode >= 48 && event.charCode <= 57);
            });
        }
        input.attr('autocomplete', 'off');
        input.attr('spellcheck', 'false');
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
    function createTextAreaInput(text, defaultval, hideOnClick) {
        if (typeof text === 'string') {
            text = text.replace(/<br \/>/g, '\n').replace(/<br>/g, '\n').replace(/<br\/>/g, '\n');
        }
         var input = $(document.createElement('textarea')).val(text);
        input.css('overflow-y', 'scroll');
        //input.autoSize();
        doWhenReady(input, function (elem) {
            var realHeight = input[0].scrollHeight;
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
            options[i].selected = true;
        }
        selectElt.change(function () {
            $('.primaryFont').css('font-family', selectElt.find(":selected").text());
            $('.secondaryFont').css('font-family', selectElt.find(":selected").text());
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
    function uploadFile(type, callback, multiple, filter) {
        var names = [], locals = [], contentTypes = [], fileArray, i;
        TAG.Authoring.FileUploader( // remember, this is a multi-file upload
            root,
            type,
            // local callback - get filename
            function (files, localURLs) {
                fileArray = files;
                for (i = 0; i < files.length; i++) {
                    names.push(files[i].displayName);
                    if (files[i].contentType.match(/image/)) {
                        contentTypes.push('Image');
                    } else if (files[i].contentType.match(/video/) || files[i].fileType.toLowerCase() === ".mp4" || files[i].fileType.toLowerCase() === ".webm" || files[i].fileType.toLowerCase() === ".ogv") {
                        contentTypes.push('Video');
                    } else if (files[i].contentType.match(/audio/)) {
                        contentTypes.push('Audio');
                    } else if (files[i].name.match('\.woff')) {
                        contentTypes.push('Font');
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
                    console.log("urls[" + i + "] = " + urls[i] + ", names[" + i + "] = " + names[i]);
                }
                callback(urls, names, contentTypes, fileArray);
            },
            filter || ['.jpg', '.png', '.gif', '.tif', '.tiff', '.woff'],
            false,
            function () {
                root.append(TAG.Util.UI.popUpMessage(null, "There was an error uploading the file.  Please try again later."));
            },
            !!multiple // batch upload disabled
            );
    }

    /**Create an overlay over the whole settings view with a spinning circle and centered text. This overlay is intended to be used 
     * only when the page is 'done'.  The overlay doesn't support being removed from the page, so only call this when the page will 
     * be changed!
     * @method loadingOverlay
     * @param {String} text     Text defaults to 'Loading...' if not specified. 
     */
    function loadingOverlay(text) {
        text = text || "Loading...";
        var overlay = $(document.createElement('div'));
        overlay.css({
            'position': 'absolute',
            'left': '0px',
            'top': '0px',
            'width': '100%',
            'height': '100%',
            'background-color': 'rgba(0,0,0,0.5)',
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

    function createDropdownAssocMediaMenu() {
        var showDropdown = false;
        var addMenuLabel = $(document.createElement('button'))
            .attr('id', 'addMenuLabel')
            .text('Add ')
            .appendTo(searchContainer)
            .css({
                "color": "rgb(256, 256, 256)",
                'background-color': "rgb(63, 55, 53)",
                'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex,
                'float':'right',
                'font-size':'85%',
                'height':'70%',
                'margin-top':'1%',
                'padding-bottom':'1%',
                'width': '30%',
                'border': '1px solid white',
            });
        var addMenuArrowIcon = $(document.createElement('img'))
            .attr('id', 'addMenuArrowIcon')
            .attr('src', tagPath + 'images/icons/Down.png')
            .css({
                width: '25%',
                height: 'auto',
                'padding-left':'10%'
            })
            .appendTo(addMenuLabel);
        var dropDown = $(document.createElement('div'))
            .attr('id', 'dropDown')
            .appendTo(searchContainer)
            .css({
                "left": '70%',
                "display":"inline-block",
                "position": "relative",
                "color": "rgb(256, 256, 256)",
                'width': '50%',
                'background-color': 'rgba(0,0,0,0.95)',
                'float': 'left',
                'clear': 'left',
                'z-index': 10000000 - 100,
                'margin-top': '2%',
                'border':'1px solid white'
            });
        dropDown.hide();
        addMenuLabel.click(function () {
            if (showDropdown) {
                addMenuArrowIcon.css('transform', 'scaleY(1)');
                dropDown.hide();
            } else {
                addMenuArrowIcon.css('transform', 'scaleY(-1)');
                dropDown.show();
            }
            showDropdown = !showDropdown;
        });
        addMenuLabel.on('focusout', function () {
            if (showDropdown) {
                addMenuLabel.click();
            }
        });
        var fromFile = $(document.createElement('label'))
            .attr('id', 'fromFile')
            .text('From File')
            .css({
                "display": "block",
                'border-bottom': '1px solid white',
                'padding-left': '10px'
            })
            .on('mouseenter', function () {
                fromFile.css({
                    'background-color': 'white',
                    'color': 'black',
                });
            })
            .on('mouseleave', function () {
                fromFile.css({
                    'background-color': 'black',
                    'color': 'white',
                });
            })
            .click(function () {
                createAsset();
                addMenuLabel.click();
            });
        var iFrameAsset = $(document.createElement('label'))
            .attr('id', 'Embed Video')
            .text('Embed Video')
            .css({
                "display": "block",
                'padding-left':'10px'
            })
            .on('mouseenter', function () {
                iFrameAsset.css({
                    'background-color': 'white',
                    'color': 'black',
                });
            })
            .on('mouseleave', function () {
                iFrameAsset.css({
                    'background-color': 'black',
                    'color': 'white',
                });
            })
            .click(function () {
                createIframeSourceDialog();
                addMenuLabel.click();
            });
        dropDown.append(fromFile);
        dropDown.append(iFrameAsset);
        return addMenuLabel;
    }

    return that;
};
TAG.Util.makeNamespace("TAG.Layout.ArtworkEditor");

/**
 * The layout definition for the artwork editor. 
 * Click 'Edit Artwork Info' in the Authoring Mode to enter.
 * Contains info, location, and media editors.
 * @class TAG.Layout.ArtworkEditor
 * @constructor
 * @param {doq} artwork          doq of the relevant artwork (see github wiki for doq structure)
 * @param {Array} guidsToBeDeleted a list of elements that have been marked for delete in settingsview
 * @return {Object}              any public methods or properties
 */

TAG.Layout.ArtworkEditor = function (artwork, guidsToBeDeleted) {
    "use strict";

    // TODO: get actual keywords from the server!

    // 3 categories.

    //var keywordCategories = ['fruit, but this category title is going to be really long', 'color', 'genre'];
    //var keywords = [['platonia', 'bael', 'cherymoya', 'rambutan', 'jabuticaba', 'breadfruit', 'noni'],
    //                ['vermillion', 'cerulean', 'cinnabar', 'viridian', 'saffron', 'fuschia'],
    //                ['tropical house', 'hardstyle', 'disco', 'hardcore', 'tagcore',
    //                'ambient post-noise-metalcoretronicastep', 'classical', 'metamodernism', 'genre',
    //                'escapism', 'realism', 'meso-american', 'brutalism', 'grilled cheese', 'chuckie cheese',
    //                'charles darwinism', 'socialism', 'schism', 'sshh', 'shitake', 'list item', '^_^']];
    //var keywordsCheckboxDict = [[],[],[]];


    // 2 categories.
    //var keywordCategories = ['Fruit, but this category title is going to be really long', 'Color'];
    //var keywords = [['Platonia', 'Bael', 'Cherymoya', 'Rambutan', 'Jabuticaba', 'Breadfruit', 'Noni'],
    //                ['Vermillion', 'Cerulean', 'Cinnibar', 'Viridian', 'Saffron', 'Fuschia']];

    // 1 category.
    //var keywordCategories = ['Fruit, but this category title is going to be really long'];
    //var keywords = [['Platonia', 'Bael', 'Cherymoya', 'Rambutan', 'Jabuticaba', 'Breadfruit', 'Noni']];

    // No categories, no keywords. Capiche??
    var keywordCategories = [];
    var keywords = [[], [], []];

    var // DOM-related
        root = $(document.createElement('div')),                    // get via Util.getHtmlAjax in web app
        topbar = $(document.createElement('div')),                  // get via root.find(...) in web app, set up in JADE
        mainPanel = $(document.createElement('div')),
        titleArea = $(document.createElement('div')),
        //rightbarLoadingDelete = $(document.createElement('div')),

        // misc initialized variables
        helpText = "To select a location, type into the search field or \
                    right-click/long-press on the map and drag the pushpin \
                    to the desired location, then click on the desired \
                    address and click 'Confirm.'",                                        // location history hint text
        credentials = "AkNHkEEn3eGC3msbfyjikl4yNwuy5Qt9oHKEnqh4BSqo5zGiMGOURNJALWUfhbmj", // bing maps credentials
        locationList = [],                                                                // list of locations in location history
        artworkMetadata = {},                                                             // will be populated by HTML elements whose values have artwork metadata
        textMetadata = {},                                                                // deprecated -- for text metadata
        loadQueue = TAG.Util.createQueue(),                                               // async queue for loading UI elements                                                  
        topbarHeight = 8,                                                                 // % height of top bar
        METADATA_EDITOR = MetadataEditor(),                                               // MetadataEditor object to deal with metadata-related business
        THUMBNAIL_EDITOR = ThumbnailEditor(),                                             // ThumbnailEditor object to deal with setting up thumbnail editing
        LOCATION_HISTORY = RichLocationHistory(),                                         // RichLocationHistory object ................................
        KEYWORDS_EDITOR = KeywordsEditor(),                                               // Keywords Editor object to deal with keywords
        MEDIA_EDITOR = AssocMediaEditor(),                                                // AssocMediaEditor object ................................
        TEXT_EDITOR = AssocTextEditor(),
        guidsToBeDeleted = guidsToBeDeleted,

        // misc uninitialized variables
        annotatedImage,               // AnnotatedImage object
        associatedMedia,
        metadataButton,               // "Information" sidebar button
        rightArrow,                   // right arrow in "Information" button
        editThumbnailButton,          // "Edit Thumbnail" button
        rightArrowEditThumb,          // right arrow in "Edit Thumbnail" button
        editLocButton,                // "Edit Location History" button
        rightArrowEditLoc,            // right arrow in "Edit Location History" button
        keywordsButton,               // "Keywords" button
        rightArrowKeywords,           // right arrow in "Keywords" button
        sidebarHideButtonContainer,   // tab to expand/contract side bar
        creatingText,                  // editing text associated media
        rightbarIsOpen;               // rightbar status

    LADS.Util.UI.getStack()[0] = null;
        
    root.attr("class", "rootPage");
    // get things rolling
    init();

    return {
        getRoot: getRoot
    };
    
    /**
     * Loads deepzoom image and creates UI (via a call to initUI)
     * @method init
     */
    function init() {
        //$(document).off();
        root.css({ // TODO STYL
            "background-color": "rgb(219,217,204)",
            "color": "black",
            "width": "100%",
            "height": "100%"
        });
        mainPanel.css({ // TODO JADE/STYL
            width: '100%',
            height: (100 - topbarHeight) + '%'
        }).addClass("mainPanel");

        root[0].onkeydown = function (e) {
            if (e.which == 9) {
                return false;
            }
        }


        //creates deep zoom image
        if (artwork) {
            
            annotatedImage = new TAG.AnnotatedImage({
                root: root,
                doq: artwork,
                callback: function () {

                    if (!(annotatedImage.openArtwork(artwork))) { // if artwork load is unsuccessful...
                        var popup = TAG.Util.UI.popUpMessage(function () {
                            TAG.Authoring.SettingsView("Artworks", function (settingsView) {
                                TAG.Util.UI.slidePageRight(settingsView.getRoot());
                            }, null, artwork.Identifier,guidsToBeDeleted);
                        }, "There was an error loading the image.", "Go Back", true);
                        root.append(popup);
                        $(popup).show();
                    }
                    initUI();
                },
                noMedia: true
            });
        } else {
            initUI();
        }
    }

    /**
     * Initializes the artwork editor UI (side bar, top bar, etc)
     * @method initUI
     */
    function initUI() {
        createTopBar();
        root.append(mainPanel);     // TODO JADE
        makeSidebar();
        METADATA_EDITOR.init();     // initialize different parts of the editor
        LOCATION_HISTORY.init();
        THUMBNAIL_EDITOR.init();
        if (keywordCategories.length > 0) {
            KEYWORDS_EDITOR.init();
        }
        MEDIA_EDITOR.init();
    }

    /**
     * Creates the artwork editor top bar (back button, save changes button, etc)
     * @method createTopBar
     */
    function createTopBar() { // TODO most of this can be factored to J/S
        var backButton = $(document.createElement('img')), // TODO JADE
            topBarLabel = $(document.createElement('div')), // TODO JADE
            topBarLabelSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height() * 0.08, { // TODO should be able to do this in STYL file
                width: 0.4,
                height: 0.9,
            }),
            titleAreaSpecs,
            aefontsize;

        topbar.css({ // TODO JADE/STYL
            "background-color": "rgb(63,55,53)",
            "color": "rgb(175,200,178)",
            "width": '100%',
            'height': topbarHeight + '%',
            'position': 'relative',
            'z-index': 1 // above any moving layers
        }).addClass("topbar");

        backButton.attr('src', tagPath+'images/icons/Back.svg'); // TODO add tagpath in web app
        backButton.css({ // TODO STYL
            'height': '63%',
            'margin-left': '1.2%',
            'float': 'left',
            'width': 'auto',
            'top': '18.5%',
            'position': 'relative',
        });
        topbar.append(backButton); // TODO JADE

        // TODO use TAG.Util.setUpBackButton in web app to combine mousedown/mouseleave/click
        backButton.on('mousedown', function () {
            TAG.Util.UI.cgBackColor("backButton", backButton, false);
        });
        var timer = new TelemetryTimer();
        backButton.on('click', function () {

            TAG.Telemetry.recordEvent("SpentTime", function (tobj) {
                tobj.item = "artwork_editor";
                tobj.time_spent = SPENT_TIMER.get_elapsed();
                console.log("artwork editor spent time: " + tobj.time_spent);
            });

            TAG.Util.removeYoutubeVideo();
            var authoringHub;
            var transOverlay = $(TAG.Util.UI.blockInteractionOverlay(0.6));
            $("#tagRoot").append(transOverlay);
            var vert = $("#tagRoot").height() / 2;
            var horz = $("#tagRoot").width() / 2;
            var progressCircCSS = {
                'position': 'absolute',
                'z-index': '50',
                'height': 'auto',
                'width': ($("#tagRoot").width() * 0.1) +"px"
            };
            var circle = TAG.Util.showProgressCircle(transOverlay, progressCircCSS, horz, vert, true);
            transOverlay.show();
            MEDIA_EDITOR.close();
            backButton.off('click');
            if (shouldSave) {
                saveMetadata();
            } else {
                var authoringHub = new TAG.Authoring.SettingsView("Artworks", null, null, artwork.Identifier,guidsToBeDeleted);
                TAG.Util.UI.slidePageRight(authoringHub.getRoot());
            }
            
        });
 
        topBarLabel.css({ // TODO STYL (see constrainAndPosition comment above)
            'margin-right': '2%',
            'margin-top': 8 * 0.045 + '%', // ?
            'color': 'white',
            'position': 'absolute',
            'text-align': 'right',
            'right': '0px',
            'top': '0px',
            'height': topBarLabelSpecs.height + 'px',
            'width': topBarLabelSpecs.width + 'px',
        });

        // TODO see if you can do this in STYL file as well
        aefontsize = TAG.Util.getMaxFontSizeEM('Artwork Editor', 0.5, topBarLabelSpecs.width, topBarLabelSpecs.height * 0.8);
        topBarLabel.css({ 'font-size': aefontsize });

        topBarLabel.text('Artwork Editor'); // TODO JADE

        // TODO STYL
        titleAreaSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height() * 0.08, {
            center_v: true,
            width: 0.55,
            height: 0.5,
            x_offset: 0.05,
            x_max_offset: 60,
        });

        titleArea.text(artwork.Name);

        // TODO STYL (try to eliminate need for constrainAndPosition)
        titleArea.css({
            'margin-left': '3.25%',
            'position': 'absolute',
            'color': 'white',
            'font-size': aefontsize,
            'margin-top': 8 * 0.045 + '%', // ?
            'left': titleAreaSpecs.x + 'px',
            width: titleAreaSpecs.width + 'px',
            height: topBarLabelSpecs.height + 'px',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap'
        });
        titleArea.attr('id', 'titleArea'); // TODO JADE

        topbar.append(titleArea); // TODO JADE

        // TODO JADE
        topbar.append(topBarLabel);
        root.append(topbar);
        TAG.Telemetry.register(root.find('.artworkInfoLabel'),'click','artworkeditor_info',function(tobj){
            tobj.mode = 'artwork editor';
        });

        TAG.Telemetry.register(root.find('#locationHistoryAddLocationButton'),'click','artworkeditor_addlocation',function(tobj){
            tobj.mode = 'artwork editor';
        });

        TAG.Telemetry.register(root.find('#locationHistorySortLocationsByTitleButton'),'click','artworkeditor_sort_title',function(tobj){
            tobj.mode = 'artwork editor';
        });

        TAG.Telemetry.register(root.find('#locationHistorySortLocationsByDateButton'),'click','artworkeditor_sort_date',function(tobj){
            tobj.mode = 'artwork editor';
        });

        TAG.Telemetry.register(root.find('#locationHistoryDeleteButton'),'click','artworkeditor_sort_title',function(tobj){
            tobj.mode = 'artwork editor';
        });

        TAG.Telemetry.register(root.find('#locationHistoryImportMapButton'),'click','artworkeditor_sort_title',function(tobj){
            tobj.mode = 'artwork editor';
        });
    }   


    /**
     * Reloads the specified associate media in the associate media list
     * @method reloadAssocMedia
     * @param {String} assocMediaIdentifier       the identifier string for the associate media to be reloaded
     */
    function reloadAssocMedia(assocMediaIdentifier) {
        annotatedImage.loadAssociatedMedia(function(mediaList) {
            var assocMediaHolder = $('#' + assocMediaIdentifier);
            mediaList = annotatedImage.getAssociatedMedia();

            for (var x = 0; x < mediaList.guids.length; x++) {
                if (guidsToBeDeleted.indexOf(mediaList.guids[x]) >= 0) {
                    mediaList.guids.splice(x, 1);
                }
            }

            for (var i = 0; i < mediaList.guids.length; i++) {
                var mediadoq = mediaList[mediaList.guids[i]].doq;
                if (mediadoq.Identifier == assocMediaIdentifier) {
                    loadQueue.add(reloadMediaHolder(assocMediaHolder, mediadoq));
                    assocMediaHolder.on('click', thumbnailButtonClick(mediaList[mediaList.guids[i]]));
                }
            }

        });
    }

    /**
    * Returns a function that refreshes the title of the specified associate media in the associate media list
    * @method reloadMediaHolder
    * @param {jQuery obj} container         the holder element containing the element for the title of the associate media
    * @parem {Object} asset         the asset of info about the associate media 
    * @return {Function}        the function that refreshes the title of the specified associate media in the associate media list
    */
    function reloadMediaHolder(container, asset) { 
        return function () {
            var $holder = container;
            var $title = $holder.find('.thumbnailButtonTitle');
            $title.text(LADS.Util.htmlEntityDecode(asset.Name));
        };
    }

    /**
     * Creates associated media list in left panel
     * @method createMediaList
     * @param {jQuery obj} container        the element containing this list
     */
    function createMediaList(container) {
        TAG.Util.showLoading(container || $('.assetContainer'), '20%', '40%', '40%');
        annotatedImage.loadAssociatedMedia(function (mediaList) {
            container = container || $('.assetContainer');
            container.empty();
            mediaList = annotatedImage.getAssociatedMedia();
            var i,
                src;
            
            for (var x = 0; x < mediaList.guids.length; x++) {
                if (guidsToBeDeleted.indexOf(mediaList.guids[x]) >= 0) {
                    mediaList.guids.splice(x, 1);
                }
            }
            // sort alphabetically
            mediaList.guids.sort(function (a, b) {
                return mediaList[a].doq.Name < mediaList[b].doq.Name ? -1 : 1;
            });

            // create divs for each media
            for (i = 0; i < mediaList.guids.length; i++) {
                var mediadoq = mediaList[mediaList.guids[i]].doq;
                switch (mediadoq.Metadata.ContentType) {
                    case 'Audio':
                        src = tagPath + 'images/audio_icon.svg';
                        break;
                    case 'Video':
                        src = ((mediadoq.Metadata.Thumbnail && !mediadoq.Metadata.Thumbnail.match(/.mp4/)) ? TAG.Worktop.Database.fixPath(mediadoq.Metadata.Thumbnail) : tagPath + 'images/video_icon.svg');
                        break;
                    case 'Image':
                        if (mediadoq.Metadata.Thumbnail) {
                            src= TAG.Worktop.Database.fixPath(mediadoq.Metadata.Thumbnail);
                        }else if (mediadoq.Metadata.Source){
                            src = TAG.Worktop.Database.fixPath(mediadoq.Metadata.Source);
                        } else {
                            src=tagPath + 'images/image_icon.svg';
                        }
                        break;
                    case 'iframe':
                        src = tagPath + 'images/video_icon.svg';
                        break;
                    case 'Text':
                        src = tagPath + 'images/text_icon.svg';
                        break;
                    default:
                        src = tagPath + 'images/text_icon.svg';
                        break;
                }
                loadQueue.add((function (j) {
                     var thumbnailButton = TAG.Util.Artwork.createThumbnailButton({
                        title: mediadoq.Name,
                        handler: thumbnailButtonClick(mediaList[mediaList.guids[j]]),
                        buttonClass: "assetHolder",
                        src: src
                    });
                    thumbnailButton.attr("id", mediadoq.Identifier);
                    container.append(thumbnailButton);
                })(i));
            }
            TAG.Util.hideLoading(container);
        });

    }

    /**
     * Click handler for an associated media thumbnail button. Opens the media editing pane.
     * @method thumbnailButtonClick
     * @param {Object} asset            associated media object
     * @param {jQuery obj} holder       the thumbnail button
     */
    function thumbnailButtonClick(asset) { // TODO in the web app, pass this in to TAG.Util.Artwork.createThumbnailButton
        return function (evt) {
            if (!($(document.getElementById(asset.doq.Identifier)).css('background-color') === 'rgba(255, 255, 255, 0.4)')) {
                closeAllPanels();
                MEDIA_EDITOR.open(asset, MEDIA_EDITOR.createMediaWrapper(asset), function () {
                    //Initially disable the save button
                    $(".addbutton").prop('disabled', true);
                    $(".addbutton").css('opacity', '0.4');
                    $('.assetHolder').css('background-color', '');
                    $(document.getElementById(asset.doq.Identifier)).css({
                        'background-color': 'rgba(255, 255, 255, 0.4)',
                    });
                });
            } else {
                //$('.assetHolder').css('background-color', '');
                //$('.closeEditAssocMedia').click();
            }
        };
    }

    /**
     * Make the artwork editing side bar.
     * @method makeSidebar
     */
    function makeSidebar() {
        var i,                 // iteration index
            sidebar,           // div for whole side bar
            buttonContainer,   // contains information, loc history, and thumbnail buttons
            artworkInfoLabel,  // "Artwork Information" label
            buttonCSS,         // some button css
            newButtonCSS,      // some more button css (do both of these in STYL)
            sidePanelFontSize, // result of call to Util.getMaxFontSizeEM (can try to do this in STYL after some trial and error)
            titleFontSize,     // font size of "Artwork Information" header (STYL)
            metaDataLabel,     // "Information" label
            editLocLabel,      // "Edit Location History" label
            editThumbLabel,    // "Edit Thumbnail" label
            assocMediaLabel,   // "Associated Media" label
            keywordsLabel,     // "Keywords" label
            addRemoveMedia,    // "Add/Remove Media" button
            addText,      // "Add Text" button
            assetContainer,    // contains assoc media thumbnail buttons
            sidebarHideButton, // button to toggle side bar visibility
            sidebarHideIcon,   // arrow icon in the side bar hide button
            expanded = true;   // whether the side bar is expanded or contracted

        buttonCSS = { // TODO STYL
            'margin-top': '2%',
            'margin-bottom': '3%',
            'width': '81%',
            'position': 'relative',
        };

        newButtonCSS = { // TODO STYL
            'margin-top': '1%',
            'margin-bottom': '1.5%',
            'width': '100%',
            'height': root.height() * 0.06,
            'color': 'white',
            'position': 'relative'
        };
        
        sidePanelFontSize = TAG.Util.getMaxFontSizeEM("Edit Maps", 1, root.width() * 0.11, 0.5 * root.height() * 0.07);
        titleFontSize = TAG.Util.getMaxFontSizeEM("Artwork Properties", 1, root.width() * 0.15, root.height() * 0.07);

        sidebar = $(document.createElement('div')); // TODO JADE/STYL
        sidebar.addClass("sidebar");
        sidebar.css({
            'width': '20%',
            'height': '100%',
            'position': 'relative',
            'left': '0%',
            'float': 'left',
            'background-color': 'rgba(0,0,0,0.85)',
            'z-index': 100
        });

        buttonContainer = $(document.createElement('div')); // TODO JADE/STYL
        buttonContainer.attr('class', 'buttonContainer');
        buttonContainer.css({
            position: 'relative',
            'margin-top': '4%',
            'text-align':'center'
        });
        sidebar.append(buttonContainer);

        // change calculation of max font size to be non-dependent on div size
        // copy constant over
        artworkInfoLabel = $(document.createElement('div')); // TODO JADE/STYL
        artworkInfoLabel.addClass('artworkInfoLabel');
        artworkInfoLabel.text('Artwork Properties');
        artworkInfoLabel.css({
            'color': 'white',
            'font-size': titleFontSize,
            'margin-top': '2%',
            'margin-bottom': '3%',
            'font-weight': 'bold',
            'height': newButtonCSS.height * 0.6
        });
        buttonContainer.append(artworkInfoLabel);

        // Metadata button.
        metadataButton = $(document.createElement('div')) // TODO J/S
            .css(newButtonCSS)
            .on('click', function () {
                METADATA_EDITOR.toggle();
            });
        // Metadata button's right arrow.
        rightArrow = $(document.createElement('img')) // TODO J/S
            .attr('src', tagPath+'images/icons/Right.png') // TODO keep this in js, tack on tagPath in web app
            .css({
                "position": "absolute",
                "right": "5%",
                top: "30%",
                width: "auto",
                height: "40%"
            });
        metadataButton.append(rightArrow); // Append it to the button.
        // Metadata button's label.
        metaDataLabel = $(document.createElement('label')) // TODO J/S
            .text("Metadata  ")
            .css({
                "width": "100%",
                "height": "100%",
                "text-align": "center",
                "line-height": metadataButton.height() + "px",
                "font-size": sidePanelFontSize
            });
        metadataButton.append(metaDataLabel); // Append it to the button.
        // Append the metadata button!
        buttonContainer.append(metadataButton);

        // Edit maps button.
        editLocButton = $(document.createElement('div')) // TODO J/S
            .css(newButtonCSS)
            .on('click', function () {
                LOCATION_HISTORY.toggle();
            });
        // Edit maps button's right arrow.
        rightArrowEditLoc = $(document.createElement('img')) // TODO J/S
            .attr('src', tagPath+'images/icons/Right.png')
            .css({
                "position": "absolute",
                "right": "5%",
                top: "30%",
                width: "auto",
                height: "40%"
            });
        editLocButton.append(rightArrowEditLoc); // Append it to the button.
        // Edit maps button's label.
        editLocLabel = $(document.createElement('label')) // TODO J/S
            .text("Edit Maps  ")
            .css({
                "width": "100%",
                "height": "100%",
                "text-align": "center",
                "line-height": editLocButton.height() + "px",
                "font-size": sidePanelFontSize
            });
        editLocButton.append(editLocLabel); // Append it to the button.
        if (IS_WINDOWS) {
            buttonContainer.append(editLocButton); // Append the edit maps button!
        }   

        // Edit thumbnail button.
        editThumbnailButton = $(document.createElement('div')) // TODO J/S
            .addClass("editThumbnailButton")
            .attr('type', 'button')
            .css(newButtonCSS)
            .on('click', function () {
                THUMBNAIL_EDITOR.toggle();
            });
        // Edit thumbnail button's right arrow.
        rightArrowEditThumb = $(document.createElement('img')) // TODO J/S
            .attr('src', tagPath + 'images/icons/Right.png')
            .css({
                "position": "absolute",
                "right": "5%",
                top: "30%",
                width: "auto",
                height: "40%"
            });
        editThumbnailButton.append(rightArrowEditThumb); // Append it to the button.
        // Edit thumbnail button's label.
        editThumbLabel = $(document.createElement('label')) // TODO J/S
            .text("Capture Thumbnail  ")
            .css({
                "width": "100%",
                "height": "100%",
                "line-height": editThumbnailButton.height() + "px",
                "font-size": sidePanelFontSize
            });
        editThumbnailButton.append(editThumbLabel); // Append it to the button.
        if (IS_WINDOWS) {
            buttonContainer.append(editThumbnailButton); // Append the edit thumnbail button!
        }

        // Keywords button.
        if (keywordCategories.length > 0) {
            keywordsButton = $(document.createElement('div')) // TODO J/S
                .css(newButtonCSS)
                .on('click', function () {
                    KEYWORDS_EDITOR.toggle();
                });
            // Keywords button's right arrow.
            rightArrowKeywords = $(document.createElement('img')) // TODO J/S
                .attr('src', tagPath + 'images/icons/Right.png')
                .css({
                    "position": "absolute",
                    "right": "5%",
                    top: "30%",
                    width: "auto",
                    height: "40%"
                });
            keywordsButton.append(rightArrowKeywords); // Append it to the button.
            // Keywords button's label.
            keywordsLabel = $(document.createElement('label')) // TODO J/S
                .text("Keywords  ")
                .css({
                    "width": "100%",
                    "height": "100%",
                    "text-align": "center",
                    "line-height": keywordsButton.height() + "px",
                    "font-size": sidePanelFontSize
                });
            keywordsButton.append(keywordsLabel); // Append it to the button.
            if (IS_WINDOWS) {
                buttonContainer.append(keywordsButton); // Append the keywords button!
            }
        }

        assocMediaLabel = $(document.createElement('div')); // TODO JADE/STYL
        assocMediaLabel.addClass('assocMediaLabel');
        assocMediaLabel.text('Associated Media');
        assocMediaLabel.css({
            color: 'white',
            'font-size': titleFontSize,
            'margin-top': '6%',
            'margin-bottom': "2%",
            'font-weight': 'bold'
        });
        buttonContainer.append(assocMediaLabel);

        addText = $(document.createElement('button')); // TODO JADE/STYL
        addText.addClass('addText');
        addText.text('Add Text').css('border-radius', '3.5px');
        addText.attr('type', 'button');
        addText.css(buttonCSS);
        addText.css({ 'font-size': TAG.Util.getMaxFontSizeEM("Add Text", 0.5, root.width() * 0.1, 0.5 * newButtonCSS.height) });
        buttonContainer.append(addText);
        addText.on('click', AssocTextEditor().openNew);


        addRemoveMedia = $(document.createElement('button')); // TODO JADE/STYL
        addRemoveMedia.addClass('addRemoveMedia');
        addRemoveMedia.text('Add/Remove').css('border-radius', '3.5px');
        addRemoveMedia.attr('type', 'button');
        addRemoveMedia.css(buttonCSS);
        addRemoveMedia.css({'font-size':TAG.Util.getMaxFontSizeEM("Add/Remove Media", 0.5, root.width() * 0.1, 0.5 * newButtonCSS.height)});
        buttonContainer.append(addRemoveMedia);

        
        addText.on('mousedown', function () {
            addText.css({ "background-color": "white", "color": "black" });
        });

        addText.on("mouseleave", function () {
            addText.css({ "background-color": "transparent", "color": "white" });
        });


        // open media picker on button click
        addRemoveMedia.on('click', createMediaPicker);
        addRemoveMedia.on('mousedown', function () {
            addRemoveMedia.css({ "background-color": "white","color":"black" });
        });

        addRemoveMedia.on("mouseleave", function () {
            addRemoveMedia.css({ "background-color": "transparent","color":"white"});
        });
        /**
         * Create the associated media selection picker
         * @method createMediaPicker
         */
        function createMediaPicker() {
            TAG.Util.UI.createAssociationPicker(root,
                "Choose the media you wish to associate with this artwork",
                {comp: artwork, type: 'artwork', modifiedButtons: true},
                "artwork",
                [{
                    name: "All Media",
                    getObjs: TAG.Worktop.Database.getAssocMedia,
                    excluded: guidsToBeDeleted
                }, {
                    name: "Currently Associated",
                    getObjs: TAG.Worktop.Database.getAssocMediaTo,
                    args: [artwork.Identifier],
                    excluded: guidsToBeDeleted
                }], {
                    getObjs: TAG.Worktop.Database.getAssocMediaTo,
                    args: [artwork.Identifier]
                }, function () { // TODO (low priority) -- shouldn't need to reload entire list here
                    $('.assetContainer').empty();
                    createMediaList($('.assetContainer'));
                });
        }

        assetContainer = $(document.createElement('div')); // TODO JADE/STYL
        assetContainer.attr('class', 'buttonContainer');
        assetContainer.css({
            position: 'relative',
            top: '0%,',
            'margin-top': '2%',
            padding: '0px 8% 0px 4%',
            width:'82%',
            left:'5%',
            'overflow-x': 'hidden',
            'overflow-y': 'auto',
            'text-overflow': 'ellipsis',
            'word-wrap': 'break-word',
            height: '54%'
        });
        assetContainer.addClass('assetContainer');
        sidebar.append(assetContainer);

        createMediaList(assetContainer);

        // sidebar toggle button
        sidebarHideButtonContainer = $(document.createElement('div')); // TODO J/S
        sidebarHideButtonContainer.addClass('sidebarHideButtonContainer');
        sidebarHideButtonContainer.css({
            'top': '0%',
            'right': '0%',
            'position': 'relative',
            'width': '2%',
            'height': '100%',
            'float': 'left',
            'z-index': 1000
        });

        sidebarHideButton = $(document.createElement('div')); // TODO J/S
        sidebarHideButton.css({
            'top': '45%',
            'right': '0%',
            'position': 'relative',
            'width': '100%',
            'height': '10%',
            'background-color': 'rgba(0,0,0,.85)',
            'border-bottom-right-radius': '10px',
            'border-top-right-radius': '10px'
        });

        sidebarHideIcon = $(document.createElement('img')); // TODO J/S
        sidebarHideIcon.css({ 'top': '30%', 'width': '40%', 'height': 'auto', 'position': 'relative', 'left': '20%' });
        sidebarHideIcon.attr('src', tagPath+'images/icons/Left.png'); // TODO keep this in js, use tagPath + ....
        sidebarHideButton.append(sidebarHideIcon);

        sidebarHideButtonContainer.append(sidebarHideButton);

        sidebarHideButtonContainer.on('click', function () {
            var left = expanded ? '-20%' : '0%';
            sidebarHideIcon.attr('src', expanded ? tagPath+'images/icons/Right.png' : tagPath+'images/icons/Left.png'); // TODO tagPath + ... in web app
            sidebar.animate({ 'left': left }, 600);
            sidebarHideButtonContainer.animate({ 'left': left }, 600);
            expanded = !expanded;
        });

        mainPanel.append(sidebar); // TODO JADE
        mainPanel.append(sidebarHideButtonContainer);
    }

    /**
     * If we have an out-of-date doq (e.g., if another TAG
     * client updated the doq while we were working), force
     * the call anyway, which will overwrite their changes.
     * This may not be the best behavior, so if you think of
     * a well-defined solution, please rewrite this function!
     * @method conflict
     * @param {jqXHR} jqXHR         async request object (see http://api.jquery.com/Types/#jqXHR)
     * @param {Object} ajaxCall     see documentation in TAG.Worktop.Database (and the code in asyncRequest in that file)
     */
    function conflict(jqXHR, ajaxCall) {
        ajaxCall && ajaxCall.force && ajaxCall.force();
    }

    /**
     * Return root of artwork editor DOM.
     * @method getRoot
     * @return {jQuery obj}       root of artwork editor DOM
     */
    function getRoot() {
        return root;
    }

    /**
     * Closes all open panels (metadata editing panel, location history
     * panel, and thumbnail editing panel).
     * @method closeAllPanels
     */
    function closeAllPanels() {
        THUMBNAIL_EDITOR.close();
        LOCATION_HISTORY.close();
        METADATA_EDITOR.close();
        if (keywordCategories > 0) {
            KEYWORDS_EDITOR.close();
        }
    }

    /**
     * Thumbnail editing code. Just a wrapper around some thumbnail functions to clean things up.
     * @method ThumbnailEditor
     * @return {Object}         an object with "public" thumbnail editing methods
     */
    function ThumbnailEditor() {
        var tnBorderWrapper,
            isOpen = false,
            mainPanelHeight,
            mainPanelWidth,
            ratio,
            tnSave;

        /**
         * Initialize the thumbnail editor. Mostly UI stuff here.
         * @method init
         */
        function init() { // TODO most of this could be moved to JADE/STYL (the only thing that should be necessary here is binding click handlers)
            var tnBorderCenter,
                tnBorderLeft,
                tnBorderTop,
                tnBorderBottom,
                tnBorderRight,
                tnHelp,
                tnHelpPadding,
                tnHelpBorder,
                tnBottomWidth;

            mainPanelHeight = $('.mainPanel').height(),
            mainPanelWidth = $('.mainPanel').width(),
            ratio = 1.564,

            tnBorderWrapper = $(document.createElement('div'));
            tnBorderWrapper.addClass('tnBorderWrapper');
            tnBorderWrapper.css({
                position: 'relative',
                top: '0px',
                left: '0px',
                height: '100%',
                width: '100%',
                display: 'none',
            });

            tnBorderCenter = $(document.createElement('div'));
            tnBorderCenter.addClass("tnBorderCenter");
            tnBorderCenter.css({
                position: 'absolute',
                top: '15%',
                left: '25%',
                height: 50 + '%',
                width: ((50 * mainPanelHeight * ratio) / mainPanelWidth) + '%',
                'background-color': 'transparent',
                border: '2px solid white',
                'z-index': 60,
            });

            tnBorderLeft = $(document.createElement('div'));
            tnBorderLeft.addClass("tbBorderLeft");
            tnBorderLeft.css({
                position: 'absolute',
                top: '0%',
                left: 0,
                height: '100%',
                width: '25%',
                'background-color': 'rgba(0,0,0,.6)',
                'z-index': 50,
            });

            tnBorderTop = $(document.createElement('div'));
            tnBorderTop.addClass("tnBorderTop");
            tnBorderTop.css({
                position: 'absolute',
                top: '0%',
                left: '25%',
                height: '15%',
                width: $(tnBorderCenter).width() + '%',
                'background-color': 'rgba(0,0,0,.6)',
                'z-index': 50,
            });

            tnBorderBottom = $(document.createElement('div'));
            tnBorderBottom.addClass("tnBorderBottom");
            tnBorderBottom.css({
                position: 'absolute',
                top: (15 + $(tnBorderCenter).height()) + '%',
                left: '25%',
                height: (100 - $(tnBorderCenter).height() - $(tnBorderTop).height()) + '%',
                width: $(tnBorderCenter).width() + '%',
                'background-color': 'rgba(0,0,0,.6)',
                'z-index': 55,
            });

            tnBorderRight = $(document.createElement('div'));
            tnBorderRight.addClass("tnBorderRight");
            tnBorderRight.css({
                position: 'absolute',
                top: '0%',
                left: (25 + $(tnBorderCenter).width()) + '%',
                height: '100%',
                width: (100 - 25 - $(tnBorderCenter).width()) + '%',
                'background-color': 'rgba(0,0,0,.6)',
                'z-index': 50,
            });

            tnHelp = $(document.createElement('div')); // TODO this help box looks weird
            tnHelp.addClass('tnHelp');
            tnHelp.css({
                position: 'relative',
                top: '5%',
                left: '0%',
                width: '100%',
                padding: '1%',
                'text-align': 'center',
                'font-size': '120%',
                color: 'white',
            });
            tnHelp.text("Move and resize the artwork within the thumbnail window, and select “Save Thumbnail” when you’re happy with the composition.");
            tnHelpPadding = (parseInt($(tnHelp).css('padding'), 10) / 100) * ($(tnBorderBottom).innerWidth() / 100) * root.width();
            tnHelpBorder = parseInt($(tnHelp).css('border'), 10);
            tnBottomWidth = ($(tnBorderBottom).innerWidth() / 100) * root.width();
            tnHelp.width(tnBottomWidth - 2 * tnHelpBorder - 2 * tnHelpPadding);

            tnSave = $(document.createElement('button'));
            tnSave.text("Save Thumbnail").css('border-radius', '3.5px');
            tnSave.css({
                position: 'relative',
                'top': '8%',
                'float': 'right'
            });
            tnSave.on("click", save);

            tnBorderBottom.append(tnHelp);
            tnBorderBottom.append(tnSave);
            tnBorderWrapper.append(tnBorderTop);
            tnBorderWrapper.append(tnBorderLeft);
            tnBorderWrapper.append(tnBorderCenter);
            tnBorderWrapper.append(tnBorderBottom);
            tnBorderWrapper.append(tnBorderRight);
            mainPanel.append(tnBorderWrapper);
        }

        /**
         * Toggle the thumbnail editor in and out.
         * @method toggle
         */
        function toggle() {
            isOpen ? close() : open();
            //if (isOpen) {
            //    tnBorderWrapper.fadeOut();
            //} else {
            //    closeAllPanels();
            //    open();
            //}
            //if (locPanelOpen) {
            //    $('.locationPanelDiv').hide("slide", { direction: 'left' }, 500, function () {
            //        $('.sidebarHideButtonContainer').show();
            //    });
            //    locPanelOpen = false;
            //}
            //if ($(tnBorderWrapper)[0] === undefined) {
            //    makethumbnailPicker();
            //    $(tnBorderWrapper).fadeToggle(200);
            //} else {
            //    $(tnBorderWrapper).fadeToggle(200);
            //}
        }

        /**
         * Opens the thumbnail editor and closes any open panels.
         * @method open
         */
        function open() {
            if (!isOpen) {
                closeAllPanels();
                tnBorderWrapper.fadeIn();
                editThumbnailButton.css({
                    'background-color': 'white',
                    'color': 'black'
                });
                rightArrowEditThumb.attr('src', tagPath+'images/icons/RightB.png');
                isOpen = true;
            }
        }

        /**
         * Closes the thumbnail editor.
         * @method close
         */
        function close() {
            if (isOpen) {
                tnBorderWrapper.fadeOut();
                editThumbnailButton.css({
                    'background-color': 'transparent',
                    'color': 'white'
                });
                rightArrowEditThumb.attr('src', tagPath+'images/icons/Right.png');
                isOpen = false;
            }
        }

        /**
         * Saves the current thumbnail selection.
         * @method save
         */
        function save() {
            //progress circle
            var progressCircleCSS = {
                'position': 'absolute',
                'top': '110%',
                'left': '100%',
                'z-index': '50',
                'height': 'auto',
                'width': '40px'
            };
            var progressCircle = TAG.Util.showProgressCircle($('.tnHelp'), progressCircleCSS, '0px', '0px', false);

            var canvas = $("canvas"),
                ctx = canvas[0].getContext("2d"),
                tnBorderCenter = $('.tnBorderCenter'),
                x = tnBorderCenter.offset().left, // get position of thumbnail frame
                y = tnBorderCenter.offset().top,
                width = tnBorderCenter.outerWidth(),
                height = tnBorderCenter.outerHeight(),
                imgdata = ctx.getImageData(x, y, width, height), // gets imagedata from position of thumbnail frame
                tmpCanvas = document.createElement("canvas"),
                tmpCtx,
                dataurl;

            tnSave.attr('disabled', 'true');

            tmpCanvas.width = imgdata.width; // set width of canvas like this (using CSS will stretch contents)
            tmpCanvas.height = imgdata.height;

            tmpCtx = tmpCanvas.getContext("2d");
            tmpCtx.putImageData(imgdata, 0, 0);

            dataurl = tmpCanvas.toDataURL(); // gets dataurl from tmpcanvas, ready to send to server!

            TAG.Worktop.Database.uploadImage(dataurl, function (imageURL) {
                TAG.Worktop.Database.changeArtwork(artwork.Identifier, { Thumbnail: imageURL }, thumbnailSuccess, thumbnailUnauth, conflict);
            }, thumbnailUnauth, thumbnailError);

            // success handler for saving
            function thumbnailSuccess() {
                TAG.Util.removeProgressCircle(progressCircle);
                tnSave[0].removeAttribute('disabled');
                close();
            }

            // unauthorized handler
            function thumbnailUnauth() {
                TAG.Util.removeProgressCircle(progressCircle);
                var popup = TAG.Util.UI.popUpMessage(null, "Thumbnail not saved.  You must log in to save changes.");
                $('body').append(popup);
                $(popup).show();
                tnSave[0].removeAttribute('disabled');
            }

            // general error handler
            function thumbnailError() {
                TAG.Util.removeProgressCircle(progressCircle);
                var popup = TAG.Util.UI.popUpMessage(null, "Thumbnail not saved.  There was an error contacting the server.");
                $('body').append(popup);
                $(popup).show();
                tnSave[0].removeAttribute('disabled');
            }
        }

        return {
            init: init,
            toggle: toggle,
            close: close,
            open: open,
            save: save
        };
    }

    /**
     * Rich location history API. Location history code can make everything else messy and dense, so we'll cordon it off here.
     * @method RichLocationHistory
     * @return {Object}         an object with "public" location history methods
     */
    function RichLocationHistory() {
        var isOpen = false,
            RLH,
            locationPanelDiv;
        var timer = new TelemetryTimer();
        function init() {
            RLH = TAG.Util.RLH({
                artwork: artwork,
                root: root,
                authoring: true
            });
            locationPanelDiv = RLH.init();
        }

        function open() {
            if (!isOpen) {
                timer.restart();
                closeAllPanels();
                MEDIA_EDITOR.close();
                editLocButton.css({ 'background-color': 'white', 'color': 'black' }).css('border-radius', '3.5px');
                rightArrowEditLoc.attr('src', tagPath+'images/icons/RightB.png');
                sidebarHideButtonContainer.hide();
                locationPanelDiv.show("slide", { direction: 'left' }, 500);
                locationPanelDiv.css({ display: 'inline' });
                
                isOpen = true;
            }
        }

        function close() {
            if (isOpen) {
                TAG.Telemetry.recordEvent("EditMaps", function (tobj) {
                    tobj.time_spent = timer.get_elapsed();
                });
                editLocButton.css({ 'background-color': 'transparent', 'color': 'white' }).css('border-radius', '3.5px');
                rightArrowEditLoc.attr('src', tagPath+'images/icons/Right.png');
                locationPanelDiv.hide("slide", { direction: 'left' }, 500, function () {
                    if (!METADATA_EDITOR.isOpen()) {
                        sidebarHideButtonContainer.show();
                    }
                });
                
                isOpen = false;
            }
        }

        function toggle() {
            isOpen ? close() : open();
        }

        function returnIsOpen() {
            return isOpen;
        }

        return {
            init: init,
            open: open,
            close: close,
            toggle: toggle,
            isOpen: returnIsOpen
        };
    }

    /**
     * Media editing panel. Contains methods for initializing, opening, and closing the panel, as well as
     * methods for saving and deleting media.
     * @method AssocMediaEditor
     * @return {Object}       an object with "public" associated media editing methods
     */
    function AssocMediaEditor() {
        var //isOpen = false,
            editingMedia = false,
            hotspotAnchor,
            layerContainer,
            currSource,
            toggleHotspotButton = $('.toggleHotspot'),
            //toggleLayerButton = $('.toggleLayer'),
            activeAssocMedia, // TODO in web app, this should be current assoc media object (of the type created by AnnotatedImage)
            isHotspot = false, // whether the current media is a hotspot
            isLayer = false,
            oldTitle, //title text when the editor is opened
            oldDescription, // description text when the editor is opened
            positionChanged = false; // whether the hotspot is added, moved, or deleted
        toggleHotspotButton.css('border-radius','3.5px');
       // toggleLayerButton.css({ 'border-radius': '3.5px', 'display': 'none' });
        rightbarIsOpen = false;
        creatingText = false;
        /**
         * Initialize a reusible hotspot circle div and store it in the variable hotspotAnchor
         * @method makeHotspotAnchor
         */
        function makeHotspotAnchor() {
            var hotspotCircle = $(document.createElement('div')),
                innerCircle = $(document.createElement('div')),
                hotspotHint = $(document.createElement('div')),
                clickableArea = $(document.createElement('div'));

            hotspotAnchor = $(document.createElement('div')).css({ // TODO JADE/STYL
                'position': 'absolute',
                'display': 'none'
            }).addClass('hotspotedit');

            hotspotCircle.css({ // TODO JADE/STYL -- should use same stylus as hotspot circles in kiosk mode
                'position': 'absolute',
                'display': 'block',
                'width': '40px',
                'height': '40px',
                'border': 'solid rgba(255,255,255,1) 5px',
                'border-radius': '50%',
                'top': '-50px',
                'left': '-50px'
            })
            .attr('on', null)
            .appendTo(hotspotAnchor)
            .addClass('hotspotCircle');

            innerCircle.css({ // TODO JADE/STYL
                'display': 'block',
                'width': '30px',
                'height': '30px',
                'background': 'rgba(0,0,0,0.01)',
                'border': 'solid rgba(0,0,0,1) 5px',
                'border-radius': '50%'
            })
            .appendTo(hotspotCircle);

            clickableArea.css({ // TODO JADE/STYL
                'display': 'block',
                'width': '0px',
                'height': '0px',
                'background': 'rgba(0,0,0,0)',
                'border': 'solid rgba(0,0,0,0.1) 15px',
                'border-radius': '50%'
            })
            .appendTo(innerCircle);

            hotspotHint.text('Hotspot (drag to update)').css({ // TODO JADE/STYL
                'position': 'relative',
                'left': '-5px',
                'top': '-5px',
                'width': 'auto',
                'color': 'white',
                'font-weight': 'bold',
                'font-size': 'large',
                'padding': '8px',
                'background-color': 'rgba(0,0,0,.85)'
            }).appendTo(hotspotAnchor);

            TAG.Util.disableDrag(root);

            // detect whether the hotspot is moved
            hotspotCircle.get(0).addEventListener('mouseup', function () {
                //Enable save nutton
                $(".addbutton").prop('disabled', false);
                $(".addbutton").css('opacity', '1');
                positionChanged = true;
            }, false);

            // TODO use makeManipulatable here for web app (and for win8 app... some dragging issues right now, though)
            if (IS_WINDOWS) {
                TAG.Util.makeManipulatableWin(hotspotCircle[0], {
                    onManipulate: function (res) {
                        var t = hotspotAnchor.css('top'),
                            l = hotspotAnchor.css('left');
                        hotspotAnchor.css("top", (parseInt(t, 10) + res.pivot.y - 20) + "px");
                        hotspotAnchor.css("left", (parseInt(l, 10) + res.pivot.x - 20) + "px");
                        annotatedImage.updateOverlay(hotspotAnchor[0], Seadragon.OverlayPlacement.TOP_LEFT);
                    }
                });
            } else {
                TAG.Util.makeManipulatable(hotspotCircle[0], {
                    onManipulate: function (res) {
                        var t = hotspotAnchor.css('top'),
                            l = hotspotAnchor.css('left');
                        hotspotAnchor.css("top", (parseInt(t, 10) + res.pivot.y - 20) + "px");
                        hotspotAnchor.css("left", (parseInt(l, 10) + res.pivot.x - 20) + "px");
                        annotatedImage.updateOverlay(hotspotAnchor[0], Seadragon.OverlayPlacement.TOP_LEFT);
                    }
                });
            }
            

            hotspotAnchor.appendTo(root);
        }

        /**
         * Adds hotspot circle to canvas and pans to circle's location
         * @method toggleToHotspot
         * @param {Seadragon.Point} point       the point at which to add the hotspot circle (defaults to center of canvas)
         */
        function toggleToHotspot(point) {
            point = point || annotatedImage.viewer.viewport.getCenter();

            var pixel = annotatedImage.viewer.viewport.pixelFromPoint(point),
                pixel_adj = new Seadragon.Point(pixel.x + 50, pixel.y + 50),
                point_adj = annotatedImage.viewer.viewport.pointFromPixel(pixel_adj);

            isLayer && toggleFromLayer();

            toggleHotspotButton.text('Remove Hotspot');
           // toggleLayerButton.attr('disabled', 'disabled');
           // toggleLayerButton.css('opacity', '0.5');

            annotatedImage.addOverlay(hotspotAnchor[0], point_adj, Seadragon.OverlayPlacement.TOP_LEFT); // TODO see new AnnotatedImage; also, do we really want to be adding a new overlay each time? we only have one hotspot circle, so maybe just want to update the existing overlay
            annotatedImage.viewer.viewport.panTo(new Seadragon.Point(point.x, point.y), false);
            hotspotAnchor.fadeIn(100);
            isHotspot = true;
        }

        /**
         * Removes hotspot from canvas
         * @method toggleFromHotspot
         */
        function toggleFromHotspot() {
            toggleHotspotButton.text('Set as Hotspot');
           // toggleLayerButton.removeAttr('disabled');
            toggleHotspotButton.on("mousedown", function () {
                toggleHotspotButton.css({ "background-color": "white", "color": "black" });
            });
            toggleHotspotButton.on("mouseleave", function () {
                toggleHotspotButton.css({ "background-color": "transparent", "color": "white" });
            });
          //  toggleLayerButton.css('opacity', '1.0');

            annotatedImage.removeOverlay(hotspotAnchor[0]); // TODO check
            hotspotAnchor.fadeOut(100);
            isHotspot = false;
        }

        /**
         * Returns a Seadragon.Rect bounding the artwork layer on screen
         * @method getLayerRect
         * @return {Seadragon.Rect}         the Seadragon.Rect
         */
        function getLayerRect() {
            var offset = layerContainer.offset(),
                width = layerContainer.width(),
                height = layerContainer.height(),
                topLeft = annotatedImage.viewer.viewport.pointFromPixel(new Seadragon.Point(offset.left, offset.top)),
                bottomRight = annotatedImage.viewer.viewport.pointFromPixel(new Seadragon.Point(offset.left + width, offset.top + height));
            console.log("width" + width);
            console.log("height" + height);
            return new Seadragon.Rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
        }

        /**
         * Initialize a reusable layer container and store it in the variable layerContainer
         * @method makeLayerContainer
         */
        function makeLayerContainer() {
            layerContainer = $(document.createElement('img'))
                                .attr({
                                    src: currSource
                                })
                                .addClass('layerContainer')
                                .appendTo(root);

            // add manipulation handlers
            LADS.Util.makeManipulatable(layerContainer[0], {
                onManipulate: function (res) {
                    var l = layerContainer.offset().left, // TODO might need to update this for web app
                        t = layerContainer.offset().top,
                        tx = res.translation.x,
                        ty = res.translation.y;

                    layerContainer.css({
                        left: (l + tx) + 'px',
                        top: (t + ty) + 'px'
                    });

                    annotatedImage.viewer.drawer.updateOverlay(layerContainer[0], getLayerRect());
                },
                onScroll: function (res, pivot) {
                    var l = layerContainer.offset().left, // TODO might need to update this for web app
                        t = layerContainer.offset().top,
                        w = layerContainer.width(),
                        h = layerContainer.height(),
                        newW = w * res,
                        newH = h * res;

                    annotatedImage.viewer.drawer.removeOverlay(layerContainer[0]); // remove and re-add to ensure correct positioning if we move artwork
                    root.append(layerContainer);

                    layerContainer.css({
                        left: (l + (1 - res) * (pivot.x)) + 'px',
                        top: (t + (1 - res) * (pivot.y)) + 'px',
                        width: newW + 'px',
                        height: newH + 'px',
                        position: 'absolute'
                    });

                    annotatedImage.viewer.drawer.addOverlay(layerContainer[0], getLayerRect());
                }
            }, false, true);

            //layerContainer.on('mousedown', function () {
            //    var l = layerContainer.offset().left, // TODO might need to update this for web app
            //        t = layerContainer.offset().top,
            //        w = layerContainer.width(),
            //        h = layerContainer.height();

            //    annotatedImage.viewer.drawer.removeOverlay(layerContainer[0]); // remove to ensure correct positioning if artwork is in midst of a move
            //    root.append(layerContainer);
            //    layerContainer.css({
            //        left: l + 'px',
            //        top: t + 'px',
            //        width: w + 'px',
            //        height: h + 'px',
            //        position: 'absolute'
            //    });
            //});

           
            /**
            layerContainer.hover(function () {
                console.log("freezing");
                annotatedImage.freezeArtwork();
            }, function () {
                console.log("unfreezing");
                annotatedImage.unfreezeArtwork();
            });
            **/

            //Not sure why this is the combo of handlers that works, probably should refine at some point 
            layerContainer.on("mousedown", function () {
                annotatedImage.freezeArtwork();
            });
            //Mouse up doesn't seem to work...added on click
            layerContainer.on("mouseup", function () {
                positionChanged = true;
                annotatedImage.unfreezeArtwork();
                annotatedImage.viewer.drawer.updateOverlay(layerContainer[0], getLayerRect());
            });
            layerContainer.on("click", function () {
                positionChanged = true;
                annotatedImage.unfreezeArtwork();
                annotatedImage.viewer.drawer.updateOverlay(layerContainer[0], getLayerRect());
            });
        }

        /**
         * Makes layerContainer visible at the specified location
         * @method toggleToLayer
         * @param {Seadragon.Rect} rect      the rect on the artwork on which we'll add the layer container (see Seadragon.Drawer docs)
         */
        function toggleToLayer(rect) {
            var i,
                oldLayerContainers = $('.layerContainer');

            isHotspot && toggleFromHotspot();

            isLayer = true;

            makeLayerContainer();

           // toggleLayerButton.text('Remove Layer');
            toggleHotspotButton.attr('disabled', 'disabled'); 
            toggleHotspotButton.css('opacity', '0.5');

            if (oldLayerContainers.length > 0) {   // clicking on a thumbnail button really quickly would add a bunch of layerContainers...but
                for (i = 0; i < oldLayerContainers.length; i++) { // a cleaner way to avoid that would be to just disable the thumbnail button when its media is already open
                    annotatedImage.viewer.drawer.removeOverlay(oldLayerContainers[i]);
                    $(oldLayerContainers[i]).remove();
                }
            }

            layerContainer.css({
                'border': '2px solid red',
                'display': 'block',
                'opacity': '0.5',
                'position': 'absolute'
            }).appendTo(root);

            if (!rect) {
                layerContainer.css({
                    'left': '30%',
                    'top': '20%',
                    'width': '40%',
                    'height': 'auto'
                });
                rect = getLayerRect();
            }

            annotatedImage.viewer.drawer.addOverlay(layerContainer[0], rect);
        }

        /**
         * Removes layer image from canvas and updates some button text/attributes
         * @method toggleFromLayer
         */
        function toggleFromLayer() {
            isLayer = false;
           // toggleLayerButton.text('Set as Layer');
            toggleHotspotButton.removeAttr('disabled');
            toggleHotspotButton.css('opacity', '1.0');
           
           // toggleLayerButton.on("mousedown", function () {
          //      toggleLayerButton.css({ "background-color": "white", "color": "black" });
          //  });
           // toggleLayerButton.on("mouseleave", function () {
         //       toggleLayerButton.css({ "background-color": "transparent", "color": "white" });
         //   });
            if (layerContainer) {
                annotatedImage.viewer.drawer.removeOverlay(layerContainer[0]);
                layerContainer.remove();
                layerContainer.css('display', 'none');
            }
        }

        /** TODO GET RID OF THIS IN WEB APP (just use current assoc media object)
         * Set a metadata value for the active media content.
         * @param key
         * @param val
         */
        function setActiveMediaMetadata(key, val) {
            var $media = $('.rightbar').find('.assocmedia').children();
            ($media.length) ? $media.data(key, val) : textMetadata[key] = val;
        }

        /** TODO GET RID OF THIS IN WEB APP (just use current assoc media object)
         * Get metadata values for the active media content.
         * @param key (optional)   the key to retrieve. If key is not given, retrieve 
         *     the entire values object. 
         */
        function getActiveMediaMetadata(key) {
            var $media = $('.rightbar').find('.assocmedia').children();
            if (!key) {
                return false;
            }
            else {
                return $media.data(key) || textMetadata[key];
            }
        }

        // Fix volume far for video/audio
        function fixVolumeBar(holder) {
            var media = holder[0];
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

        /** 
         * Create a view in the editing pane for the specified media
         * @method createMediaWrapper
         * @param {Object} media    the assoc media object we want to "wrap"
         * @return {jQuery obj}     a jQuery element wrapping a view into the content
         */
        function createMediaWrapper(media) {
            var video,
                audio,
                text,
                src = media.doq.Metadata.Source,
                type = media.doq.Metadata.ContentType,
                thumbnail = (media.doq.Metadata.Thumbnail && !media.doq.Metadata.Thumbnail.match(/.mp4/)) ? TAG.Worktop.Database.fixPath(media.doq.Metadata.Thumbnail) : '',
                src_webm,
                src_ogg,
                src_mp4,
                src_mp3,
                errText,
                msgdiv,
                fixedSrc = TAG.Worktop.Database.fixPath(src);

            if (type === 'Image') {
                return $(document.createElement('div'))
                    .css({
                        'width': '100%',
                        'height': '100%',
                        'background-image': 'url(' + fixedSrc + ')',
                        'background-repeat': 'no-repeat',
                        'background-position': 'center center',
                        'background-size': 'contain',
                        'border': '0'
                    });
            } else if (type === 'Video') {
                video = $(document.createElement('video'));
                fixVolumeBar(video);
                video[0].onerror = function (err) { // TODO put this error handler in the Util file -- could be useful elsewhere
                    var msg = "";
                    switch (err.target.error.code) {
                        case err.target.error.MEDIA_ERR_ABORTED:
                            msg = "Video playback aborted. Please see FAQs on the TAG website.";
                            break;
                        case err.target.error.MEDIA_ERR_NETWORK:
                            msg = "Network error during video upload. Please see FAQs on the TAG website.";
                            break;
                        case err.target.error.MEDIA_ERR_DECODE:
                            msg = "Error decoding video. Please see FAQs on the TAG website.";
                            break;
                        case err.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                            msg = "Either the video format is not supported or a network or server error occurred. Please see FAQs on the TAG website.";
                            break;
                        default:
                            msg = "Error: please see FAQs on the TAG website.";
                            break;
                    }

                    msgdiv = $(document.createElement('div'));
                    msgdiv.css({
                        'width': '80%',
                        'margin-left': '10%',
                        'margin-top': '50%',
                        'color': 'white',
                        'text-align': 'center'
                    });
                    msgdiv.text(msg);

                    video.hide();
                    video.parent().append(msgdiv);
                    video[0].onerror = function (err) { }; // neglect any further errors
                };
                video.attr({
                    'preload': 'none',
                    'poster': thumbnail,
                    'controls': 'controls'
                });

                src_mp4 = document.createElement('source');
                src_mp4.src = fixedSrc;
                src_mp4.type = "video/mp4";

                src_webm = document.createElement('source');
                src_webm.src = fixedSrc;
                src_webm.type = "video/webm";

                src_ogg = document.createElement('source');
                src_ogg.src = fixedSrc;
                src_ogg.type = "video/ogg";

                video.append(src_mp4);
                video.append(src_webm);
                video.append(src_ogg);
                video[0].innerHTML += "Your browser does not support this video."; // fallback text

                video.css({ // TODO could be done in STYL even though video probably shouldn't be created in JADE
                    color: "white",
                    position: 'relative',
                    width: '100%',
                    height: '100%'
                });
                return video;
            } else if (type === 'Audio') {
                audio = $(document.createElement('audio'));
                fixVolumeBar(audio);
                
                audio.attr({
                    'preload': 'none',
                    'controls': 'controls'
                });

                src_mp3 = document.createElement('source');
                src_mp3.src = fixedSrc;
                src_mp3.type = "audio/mp3";

                src_ogg = document.createElement('source');
                src_ogg.src = fixedSrc;
                src_ogg.type = "audio/ogg";

                audio.append(src_mp3);
                audio.append(src_ogg);

                audio.css({ // TODO see video comment above
                    position: 'absolute',
                    width: '100%',
                    bottom: '0%'
                });
                return audio;
            } else if (type === 'iframe') {
                iframe = $(document.createElement('iframe'));
                iframe.attr({
                    src: src + "?modestbranding=1&showinfo=0&fs=0",
                    frameborder: '0'
                });
                iframe.css({
                    width: '100%',
                    height: '100%'
                });
                return iframe;
            }
        }

         /**
        * Saves the current settings for the opened associate media
        * @method saveAssocMedia
        */
        function saveAssocMedia() {
            var titleTextVal,
                descriptionTextVal,
                assetType;
            $('.assetHolder').css('background-color', '');

            if (getActiveMediaMetadata('ContentType') === 'Video') { // TODO see comments in the delete button's click handler
              //  $('.rightbar').find('video')[0].pause();
            } else if (getActiveMediaMetadata('ContentType') === 'Audio') { // TODO see comments in the delete button's click handler
              //  $('.rightbar').find('audio')[0].pause();
            }

            titleTextVal = $('.title').val() || 'Untitled';
            descriptionTextVal = $('.description').val() || 'Untitled';
            oldTitle = oldTitle || 'Untitled';
            oldDescription = oldDescription || 'Untitled';


            assetType = isHotspot ? 'Hotspot' : (isLayer ? 'Layer' : 'Asset');

            if (titleTextVal != oldTitle || descriptionTextVal != oldDescription || positionChanged) {
                console.log(titleTextVal + " " + oldTitle + " " + descriptionTextVal + " " + oldDescription + " " + positionChanged);
                updateAssocMedia({
                    title: TAG.Util.htmlEntityEncode(titleTextVal),
                    desc: TAG.Util.htmlEntityEncode($('.description').val()),
                    pos: isHotspot ? Seadragon.Utils.getElementPosition(hotspotAnchor.children().first().get(0)) : null, // TODO should store this html elt in a variable (in the function that makes the hotspot anchor) so people don't have to figure out what this means
                    rect: isLayer ? getLayerRect() : null,
                    contentType: activeAssocMedia.doq.Metadata.ContentType,
                    contentUrl: TAG.Worktop.Database.fixPath(activeAssocMedia.doq.Metadata.Source),
                    assetType: assetType,
                    metadata: {
                        assetDoqID: activeAssocMedia.doq.Identifier
                    }
                });
            }
        }

        /**
         * Wrapper around TAG.Worktop.Database.changeHotspot to update assoc media after
         * editing in the right pane.
         * @method updateAssocMedia
         * @param {Object} info        assoc media info to update
         */
        function updateAssocMedia(info) { // TODO use new AnnotatedImage; also, could eliminate need for param here by using 'global' current assoc media object (same with showEditMedia above, actually)
            var title = info.title,
                desc = info.desc,
                contentType = info.contentType,
                contentUrl = info.contentUrl,
                duration = info.duration,
                assetType = info.assetType,
                worktopInfo = info.metadata || {},
                //dzPos = info.pos ? annotatedImage.viewer.viewport.pointFromPixel(info.pos) : { x: 0, y: 0 },
                coords,
                rightbarLoadingSave,
                thumbnailLoadingSave,
                options;

            if (info.pos) {
                coords = annotatedImage.viewer.viewport.pointFromPixel(info.pos);
                coords.width = 0;
                coords.height = 0;
            } else if (info.rect) {
                coords = info.rect
            } else {
                coords = {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                };
            }
            
            rightbarLoadingSave = $(document.createElement('div'));
            rightbarLoadingSave.css({
                'width': '20%',
                'height': '100%',
                'position': 'absolute',
                'background-color': 'rgba(0,0,0,.85)',
                'top': $('.topbar').css('height'),
                'right': '0%',
                'z-index': 100
            });
            mainPanel.append(rightbarLoadingSave);


            TAG.Util.showLoading(rightbarLoadingSave, '20%', '40%', '40%');
            rightbarLoadingSave.attr('class', 'rightbarLoadingSave');
            

            // add loading overlay to the thumbnail of the associate media which has been modified
            var top = 
            $(document.getElementById(worktopInfo.assetDoqID)).height();
            thumbnailLoadingSave = $(document.createElement('div'));
            thumbnailLoadingSave.css({
                'width': '100%',
                'height': '100%',
                'position': 'relative',
                'background-color': 'rgba(0,0,0,.85)',
                'top': '-' + top -4 + 'px',
                'z-index': 100
            });
            $('#' + worktopInfo.assetDoqID).append(thumbnailLoadingSave);
        
            TAG.Util.showLoading(thumbnailLoadingSave, '20%', '40%', '40%');
            thumbnailLoadingSave.attr('class', 'thumbnailLoadingSave');

            options = {
                Name: title,
                ContentType: contentType,
                Duration: duration,
                LinqTo: artwork.Identifier,
                X: coords.x,
                Y: coords.y,
                W: coords.width,
                H: coords.height,
                LinqType: assetType,
                Description: desc
            };
            if (contentType !== "iframe" && contentType !== "Text") {
                options.Source = contentUrl;
            }

            TAG.Worktop.Database.changeHotspot(worktopInfo.assetDoqID, options, updateSuccess, no_op, conflict, no_op);

            /**
             * Success callback for call to changeHotspot in updateAssocMedia;
             * reloads media list and hides editing pane
             * @method updateSuccess
             */
            function updateSuccess() {
                /*
                close();
                createMediaList();*/
                rightbarLoadingSave.fadeOut();
                
                reloadAssocMedia(worktopInfo.assetDoqID);
                thumbnailLoadingSave.fadeOut();
            }

            function no_op() { // TODO I think TAG.Worktop.Database functions can just accept null callbacks, since they use the safeCall util function. if so, use null

            }
        }

        /**
         * Initializes UI for associated media editor.
         * @method init
         */
        function init() {
            var $rightbar = $(document.createElement('div')) // move all of these to JADE/STYL
                    .addClass("rightbar")
                    .css({
                        'width': '20%',
                        'height': '100%',
                        'position': 'absolute',
                        'background-color': 'rgba(0,0,0,0.85)',
                        'top': $('.topbar').css('height'),
                        'right': '-20%',
                        'float': 'right',
                        'z-index': 100,
                        'color': 'white'
                    }),
                rightbarHeader = $(document.createElement('div'))
                    .css({
                        'margin': '5% 8%',
                        'color': 'white',
                        'font-size': '100%',
                        'float': 'left',
                        'position': 'relative',
                    })
                    .addClass('header')
                    .text('Edit Associated Media')
                    .appendTo($rightbar),
                $assocMediaContainer = $(document.createElement('div'))
                    .css({
                        'position': 'relative',
                        'margin': '10% 8%', 
                        'margin-top': '20%',
                        'border': '2px solid white',
                        'width': '86%',
                        'height': '30%'
                    })
                    .addClass('assocMediaContainer')
                    .appendTo($rightbar),
                $assocMediaContent = $(document.createElement('div'))
                    .addClass('assocmedia')
                    .addClass('contentwrapper')
                    .css({
                        'background-color': 'rgba(0,0,0,.9)',
                        'height': '100%',
                        'width': '100%',
                        'left': '0',
                        'position': 'absolute'
                    })
                    .appendTo($assocMediaContainer),
                $toggleModeContainer = $(document.createElement('div'))
                    .addClass('toggleModeContainer')
                    .css({
                        'width': '87%',
                        'left': '8%',
                        'position': 'relative',
                        'height': 'auto', 
                        'max-height': '10%'
                    })
                    .appendTo($rightbar),
                $toggleHotspot = $(document.createElement('button'))
                    .addClass('toggleHotspot')
                    .css({ // css for this and toggleLayer should be defined as a class rule
                        'width': '100%',
                        'height': 'auto',
                        'max-height': '45%', 
                        'border': '2px solid white',
                        'position': 'relative',
                        'font-size': $('.addRemoveMedia').css('font-size')
                    })
                    //.css('border-radius','3.5px')
                    .attr('type', 'button')
                    .appendTo($toggleModeContainer),
                /**
                $toggleLayer = $(document.createElement('button'))
                    .addClass('toggleLayer').css('border-radius','3.5px')
                    .css({
                        'width': '100%',
                        'height': 'auto',
                        'max-height': '45%', 
                        'margin-top': '5%', 
                        //'border': '2px solid white',
                        'position': 'relative',
                        'font-size': $('.addRemoveMedia').css('font-size')
                    })
                    .attr('type', 'button')
                    .appendTo($toggleModeContainer), 
                    **/
                $titleContainer = $(document.createElement('div'))
                    .addClass('textareaContainer')
                    .css({
                        'width': '87%',
                        'left': '8%',
                        'position': 'relative',
                        'height': 'auto', 
                        'max-height': '10%',
                        'margin-top': '10%',
                    })
                    .appendTo($rightbar),
                $titleText = $(document.createElement('input'))
                    .addClass('title')
                    .attr('placeholder', ' Title')
                    .attr('title', 'Title')
                    .css({
                        'width': '100%',
                        '-webkit-box-sizing': 'border-box', /* Safari/Chrome, other WebKit */
                        '-moz-box-sizing': 'border-box',    /* Firefox, other Gecko */
                        'box-sizing': 'border-box',        /* Opera/IE 8+ */
                        'font-size': '0.7em'
                    })
                    .appendTo($titleContainer),
                $descContainer = $(document.createElement('div'))
                    .addClass('textareaContainer')
                    //.addClass('descContainer')
                    .css({
                        'width': '87%',
                        'left': '8%',
                        'position': 'relative',
                        'height': '16%', 
                        'margin-top': '5%',
                    })
                    .appendTo($rightbar),
                $descArea = $(document.createElement('textarea'))
                    .addClass('description')
                    .attr('placeholder', ' Description')
                    .css({
                        'background-color': 'white',
                        'width': '100%',
                        'min-width': '100%',
                        'height': '90%',
                        '-webkit-box-sizing': 'border-box', /* Safari/Chrome, other WebKit */
                        '-moz-box-sizing': 'border-box',    /* Firefox, other Gecko */
                        'box-sizing': 'border-box',        /* Opera/IE 8+ */
                        'font-size': '0.7em',
                        'padding-right': '8px'
                    })
                    .appendTo($descContainer),
                $assocMediaButtonContainer = $(document.createElement('div'))
                    .addClass('buttoncontainer')
                    .css({
                        'width': '87%',
                        'padding': '5% 8%',
                        'position': 'relative',
                        'height': '5%',
                        'display': 'block'
                    })
                    .appendTo($rightbar),
                $unassociateAssocMediaButton = $(document.createElement('button'))
                    .addClass('asscmediabutton unassociatebutton').css('border-radius','3.5px')
                    .text('Unassociate')
                    .css({
                        'float': 'left',
                        'border': '2px solid white',
                        'max-width': '43%',
                        'width': '43%',
                        'display': 'inline-block',
                        'text-align': 'center',
                        'padding': '4px 4px 4px 4px',
                        'font-size': $('.addRemoveMedia').css('font-size'),
                    })
                    .attr('type', 'button')
                    .appendTo($assocMediaButtonContainer),
                $saveAssocMediaButton = $(document.createElement('button')).css('border-radius', '3.5px')
                    .addClass('asscmediabutton addbutton')
                    .text('Save')
                    .attr('type', 'button')
                    .css({
                        'float': 'right',
                        //'border': '2px solid white',
                        'max-width': '43%',
                        'width': '43%',
                        'display': 'inline-block',
                        'text-align': 'center',
                        'padding': '4px 4px 4px 4px',
                        'font-size': $('.addRemoveMedia').css('font-size'),
                    })
                    .appendTo($assocMediaButtonContainer),
                closeButton = $(document.createElement('img')).addClass('closeEditAssocMedia')
                    .attr('src', tagPath + 'images/icons/x.svg')
                    .css({
                        'position': 'absolute',
                        'top': '85%',
                        //'top': ($(window).height() - ($(window).height() * topbarHeight / 100)) * 0.95 - 15 + 'px',
                        'left': '8%',
                        'width': '11%',
                        'height': '5%',//
                    })
                    .appendTo($rightbar);
            /*$descArea.on('keyup', function () {
                var txt = ($descArea && $descArea[0] && $descArea[0].value) ? $descArea[0].value.replace(/[^àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\w\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') : "";
                if ($descArea && $descArea[0] && $descArea[0].value && $descArea[0].value!=txt) {
                    $descArea[0].value = txt;
                }
            });
            $titleText.on('keyup', function () {
                var txt = ($titleText && $titleText[0] && $titleText[0].value) ? $titleText[0].value.replace(/[^àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\w\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') : "";
                if ($titleText && $titleText[0] && $titleText[0].value && $titleText[0].value!=txt) {
                    $titleText[0].value = txt;
                }
            });*/
            $saveAssocMediaButton.on("mousedown", function () {
                $saveAssocMediaButton.css({ "background-color": "white", "color": "black" });

            });
            $unassociateAssocMediaButton.on("mousedown", function () {
                $unassociateAssocMediaButton.css({ "background-color": "white", "color": "black" });

            });
            $saveAssocMediaButton.on("mouseleave", function () {
                $saveAssocMediaButton.css({ "background-color": "transparent", "color": "white" });
            });
            $unassociateAssocMediaButton.on("mouseleave", function () {
                $unassociateAssocMediaButton.css({ "background-color": "transparent", "color": "white" });
            });

            $unassociateAssocMediaButton.on("mouseup", function () {
                $unassociateAssocMediaButton.css({ "background-color": "transparent", "color": "white" });
            });

            //Initially disable the save button
            $saveAssocMediaButton.prop('disabled', true);
            $saveAssocMediaButton.css('opacity', '0.4');

            $titleText.on('keyup', function () {
                $saveAssocMediaButton.prop('disabled', false);
                $saveAssocMediaButton.css('opacity', '1');
            });

            $descArea.on('keyup', function () {
                $saveAssocMediaButton.prop('disabled', false);
                $saveAssocMediaButton.css('opacity', '1');
            });

            $toggleHotspot.on('click', function () {
                $saveAssocMediaButton.prop('disabled', false);
                $saveAssocMediaButton.css('opacity', '1');
            });

            /**
            $toggleLayer.on('click', function () {
                $saveAssocMediaButton.prop('disabled', false);
                $saveAssocMediaButton.css('opacity', '1');
            });
            **/

            makeHotspotAnchor();
            // makeLayerContainer(); -- called in toggleToLayer now

            $toggleHotspot.on('click', function () {
                positionChanged = true;
                isHotspot ? toggleFromHotspot() : toggleToHotspot();
            });
            /**
            $toggleLayer.on('click', function () {
                isLayer ? toggleFromLayer() : toggleToLayer();
            });
            **/

            toggleHotspotButton = $toggleHotspot; // get rid of these intermediate variables...
           // toggleLayerButton = $toggleLayer;

            $unassociateAssocMediaButton.on('click', function () {
                TAG.Util.removeYoutubeVideo();
                var assetDoqID = getActiveMediaMetadata('assetDoqID'); // TODO see comment below about AnnotatedImage
                $saveAssocMediaButton.attr('disabled', true).css('color', 'rgba(255,255,255,0.5)');
                if (getActiveMediaMetadata('contentType') === 'Video') { // TODO when this file is better integrated with the new AnnotatedImage, should store the current active media in a 'global' variable and just access its contentType rather than going through a helper function
                    $('.rightbar').find('video')[0].pause();
                } else if (getActiveMediaMetadata('contentType') === 'Audio') {
                    $('.rightbar').find('audio')[0].pause();
                }


                var thumbnailLoadingUnassoc;
                var top =
                $(document.getElementById(assetDoqID)).height();
                thumbnailLoadingUnassoc = $(document.createElement('div'));
                thumbnailLoadingUnassoc.css({
                    'width': '100%',
                    'height': '100%',
                    'position': 'relative',
                    'background-color': 'rgba(0,0,0,.85)',
                    'top': '-' + top - 4 + 'px',
                    'z-index': 100
                });
                $('#' + assetDoqID).append(thumbnailLoadingUnassoc);

                TAG.Util.showLoading(thumbnailLoadingUnassoc, '20%', '40%', '40%');
                thumbnailLoadingUnassoc.attr('class', 'thumbnailLoadingUnassoc');


                var rightbarLoadingDelete = $(document.createElement('div'));
                rightbarLoadingDelete.css({ // TODO STYL
                    'width': '20%',
                    'height': '100%',
                    'position': 'absolute',
                    'background-color': 'rgba(0,0,0,.85)',
                    'top': $('.topbar').css('height'),
                    'right': '0%',
                    'z-index': 100
                });
                mainPanel.append(rightbarLoadingDelete);
                TAG.Util.showLoading(rightbarLoadingDelete, '20%', '40%', '40%');
                $unassociateAssocMediaButton.attr('disabled', true).css('color', 'rgba(255,255,255,0.5)');

                // remove the associated media's linq to this artwork
                if (assetDoqID) {
                    TAG.Worktop.Database.changeArtwork(artwork.Identifier, { RemoveIDs: assetDoqID }, function () {
                        close();
                        $('.assetContainer').empty();
                        createMediaList();
                        rightbarLoadingDelete.fadeOut();
                    }, function () {
                        console.log("error 1");
                    }, function () {
                        console.log("error 2");
                    }, function () {
                        console.log("error 3");
                    });
                } else {
                    close();
                    createMediaList();
                    rightbarLoadingDelete.fadeOut();
                }

            });

            $saveAssocMediaButton.on('click', function () {
                var titleTextVal,
                    assetType;

                //$('.assetHolder').css('background-color', '');

                if (getActiveMediaMetadata('ContentType') === 'Video') { // TODO see comments in the delete button's click handler
                    $('.rightbar').find('video')[0].pause();
                } else if (getActiveMediaMetadata('ContentType') === 'Audio') { // TODO see comments in the delete button's click handler
                    $('.rightbar').find('audio')[0].pause();
                }

                titleTextVal = $titleText.val() || 'Untitled';

                assetType = isHotspot ? 'Hotspot' : (isLayer ? 'Layer' : 'Asset');

                if (creatingText) {
                    createTextAsset(titleTextVal, $descArea.val());
                    /**
                    // add the loading circle right after the "save" button is clicked
                    var buttonbarLoadingDelete = $(document.createElement('div'));
                    buttonbarLoadingDelete.css({ // TODO STYL
                        'width': '100%',
                        'height': '52%',
                        'position': 'absolute',
                        'top': '33%',
                        'right': '0%',
                        'z-index': 10000
                    });
                    $('.sidebar').append(buttonbarLoadingDelete);
                    buttonbarLoadingDelete.attr('class','buttonbarLoadingDelete');
                    TAG.Util.showLoading(buttonbarLoadingDelete, '20%', '40%', '40%');
                    buttonbarLoadingDelete.css('background-color', 'black');
                    **/
                    creatingText = false;
                    close();
                } else {

                    updateAssocMedia({
                        title: TAG.Util.htmlEntityEncode(titleTextVal),
                        desc: TAG.Util.htmlEntityEncode($descArea.val()),
                        pos: isHotspot ? Seadragon.Utils.getElementPosition(hotspotAnchor.children().first().get(0)) : null, // TODO should store this html elt in a variable (in the function that makes the hotspot anchor) so people don't have to figure out what this means
                        rect: isLayer ? getLayerRect() : null,
                        contentType: activeAssocMedia.doq.Metadata.ContentType,
                        contentUrl: TAG.Worktop.Database.fixPath(activeAssocMedia.doq.Metadata.Source),
                        assetType: assetType,
                        metadata: {
                            assetDoqID: activeAssocMedia.doq.Identifier
                        }
                    });
                }
            });

            closeButton.on('click', function () {
                if (getActiveMediaMetadata('contentType') === 'Video') { // TODO see comments above
                    $('.rightbar').find('video')[0].pause();
                } else if (getActiveMediaMetadata('contentType') === 'Audio') {
                    $('.rightbar').find('audio')[0].pause();
                }
                close();
            });

            mainPanel.append($rightbar);
        }

        /**
         * Opens the media editor with the specified media.
         * @method open
         * @param {Object} asset         the media to edit
         * @param {jQuery obj} content   a dom element suitable for displaying the content (could be the result
         *                                of a call to createMediaWrapper)
         * @param {Function} callback    a callback function to call after the editing pane has opened
         */
        function open(asset, content, callback) {
            //Initially disable the save button
            $(".addbutton").prop('disabled', true);
            $(".addbutton").css('opacity', '0.4');

            /*
            var editingMediamsg;

            if (editingMedia) {
                editingMediamsg = $(TAG.Util.UI.popUpMessage(null, "You are currently making changes. Please save or cancel before opening another media for editing.", "OK", false));
                root.append(editingMediamsg);
                editingMediamsg.show();
                return;
            }
            */
            //if (asset.doq.Metadata.ContentType == "Text"){
            //    $(".rightbar").find('.assocMediaContainer').hide();
            //}
           
            $(".asscmediabutton").attr('disabled', false).css('color', 'rgba(255,255,255,1)');
            editingMedia = false;
            creatingText = false;

            TAG.Worktop.Database.getLinq(artwork.Identifier, asset.doq.Identifier, linqCallback, function () { }, function () { });

            /**
             * Helper function for showEditMedia, called when the linq between the
             * media and the artwork has been obtained
             * @method linqCallback
             * @param {linq} linq           a linq object (see github wiki for structure)
             */
            function linqCallback(linq) {
                var x = parseFloat(linq.Offset._x),
                    y = parseFloat(linq.Offset._y),
                    w = parseFloat(linq.Dimensions ? linq.Dimensions._x : 0), // some backwards compatibility checking
                    h = parseFloat(linq.Dimensions ? linq.Dimensions._y : 0),
                    title = TAG.Util.htmlEntityDecode(asset.doq.Name),
                    description = asset.doq.Metadata.Description ? TAG.Util.htmlEntityDecode(asset.doq.Metadata.Description).replace(/<br>/g, '\n') : '',
                    point,
                    enableLayering = asset.doq.Metadata.ContentType === 'Image' && linq.Dimensions,
                    rect,
                    key,
                    rightbar = $('.rightbar'); // TODO get this from JADE, store as a 'global' variable at top of file


                isHotspot = linq.Metadata.Type === "Hotspot";
                isLayer = linq.Metadata.Type === "Layer";

                oldTitle = title;
                oldDescription = description;
                positionChanged = false;

                if (enableLayering) {
                    currSource = LADS.Worktop.Database.fixPath(asset.doq.Metadata.Source);
                }

                if (asset.doq.Metadata.ContentType == "Text") {
                    rightbar.find('.assocMediaContainer').hide();
                }
                else {
                    rightbar.find('.assocMediaContainer').show();
                }

                if (isHotspot) {
                    point = new Seadragon.Point(x, y);
                } else if (isLayer) {
                    rect = new Seadragon.Rect(x, y, w, h);
                }

                toggleHotspotButton.text(isHotspot ? 'Remove Hotspot' : 'Create Hotspot');
              //  toggleLayerButton.text(isLayer ? 'Remove Layer' : 'Create Layer');

                isHotspot ? toggleToHotspot(point) : toggleFromHotspot();
                isLayer ? toggleToLayer(rect) : toggleFromLayer();

                // don't show the toggle layer button if we're dealing with audio/video or an older server
            //    toggleLayerButton.css({
                  //  'display': enableLayering ? 'inline-block' : 'none'
               // });

                
                rightbar.find('.header').text("Edit Associated Media");
               
                rightbar.find('.assocmedia').html(content);
                rightbar.find('.title').val(title);
                rightbar.find('.description').val(description);

                rightbar.find('.title').on('keyup', function () {
                    editingMedia = true;
                });

                rightbar.find('.description').on('keyup', function () {
                    editingMedia = true;
                });

                if (!rightbarIsOpen) {
                    rightbar.animate({ 'right': 0 }, 600);
                }

                for (key in asset.doq.Metadata) { // TODO just use 'global' current assoc media object rather than doing this set/getActiveMediaMetadata business
                    if (asset.doq.Metadata.hasOwnProperty(key)) {
                        setActiveMediaMetadata(key, asset.doq.Metadata[key]);
                    }
                }
                setActiveMediaMetadata('assetDoqID', asset.doq.Identifier);

                rightbarIsOpen = true;
                activeAssocMedia = asset;

                callback && callback();
            }
        }

        /**
         * Closes the media editor.
         * @method close
         */
        function close() {
            TAG.Util.removeYoutubeVideo();
            var rightbar;
            if (rightbarIsOpen) {
                //saveAssocMedia();
                rightbar = $('.rightbar');
                hotspotAnchor.fadeOut(100);
                if (layerContainer) {
                    annotatedImage.viewer.drawer.removeOverlay(layerContainer[0]);
                    layerContainer.remove();
                }
                annotatedImage.unfreezeArtwork();
                rightbar.animate({ 'right': '-20%' }, 600);
                $('.assetHolder').css('background-color', '');
                editingMedia = false;
                rightbarIsOpen = false;
                creatingText = false;
            }
        }

        /**
         * Returns whether the editing panel is open
         * @method returnIsOpen
         * @return {Boolean}      true if open
         */
        function returnIsOpen() {
            return rightbarIsOpen;
        }

        return {
            init: init,
            open: open,
            close: close,
            createMediaWrapper: createMediaWrapper,
            isOpen: returnIsOpen
        };
    }

    function AssocTextEditor() {
        var //isOpen = false,
            editingMedia = false,
            hotspotAnchor,
            layerContainer,
            currSource,
            toggleHotspotButton = $('.toggleHotspot'),
            //toggleLayerButton = $('.toggleLayer'),
            //activeAssocMedia, // TODO in web app, this should be current assoc media object (of the type created by AnnotatedImage)
            isHotspot = false, // whether the current media is a hotspot
            isLayer = false,
            oldTitle, //title text when the editor is opened
            oldDescription, // description text when the editor is opened
            //rightbar = $('.rightbar'),
            //closeButton = rightbar.find('.closeEditAssocButton'),
            positionChanged = false; // whether the hotspot is added, moved, or deleted
            
        toggleHotspotButton.css('border-radius', '3.5px');
        //toggleLayerButton.css('border-radius', '3.5px');

        //closeButton.on('click', function () {
        //    close();
        //});

        function openNew() {
            //Initially disable the save button
            $(".addbutton").prop('disabled', true);
            $(".addbutton").css('opacity', '0.4');

            /*
            var editingMediamsg;

            if (editingMedia) {
                editingMediamsg = $(TAG.Util.UI.popUpMessage(null, "You are currently making changes. Please save or cancel before opening another media for editing.", "OK", false));
                root.append(editingMediamsg);
                editingMediamsg.show();
                return;
            }
            */
            
            $(".asscmediabutton").attr('disabled', false).css('color', 'rgba(255,255,255,1)');
            editingMedia = false;
            creatingText = true;

            //TAG.Worktop.Database.getLinq(artwork.Identifier, asset.doq.Identifier, linqCallback, function () { }, function () { });

            ///**
            // * Helper function for showEditMedia, called when the linq between the
            // * media and the artwork has been obtained
            // * @method linqCallback
            // * @param {linq} linq           a linq object (see github wiki for structure)
            // */
            //function linqCallback(linq) {
            //    var x = parseFloat(linq.Offset._x),
            //        y = parseFloat(linq.Offset._y),
            //        w = parseFloat(linq.Dimensions ? linq.Dimensions._x : 0), // some backwards compatibility checking
            //        h = parseFloat(linq.Dimensions ? linq.Dimensions._y : 0),
            //        title = TAG.Util.htmlEntityDecode(asset.doq.Name),
            //        description = asset.doq.Metadata.Description ? TAG.Util.htmlEntityDecode(asset.doq.Metadata.Description).replace(/<br>/g, '\n') : '',
            //        point,
            //        enableLayering = asset.doq.Metadata.ContentType === 'Image' && linq.Dimensions,
            //        rect,
            //        key,
            //        rightbar = $('.rightbar'); // TODO get this from JADE, store as a 'global' variable at top of file

            //    isHotspot = linq.Metadata.Type === "Hotspot";
            //    isLayer = linq.Metadata.Type === "Layer";

            //    oldTitle = title;
            //    oldDescription = description;
            //    positionChanged = false;

            //    if (enableLayering) {
            //        currSource = LADS.Worktop.Database.fixPath(asset.doq.Metadata.Source);
            //    }

            //    $('.assocMediaContainer').show();

            //if (isHotspot) {
            //    point = new Seadragon.Point(x, y);
            //} else if (isLayer) {
            //    rect = new Seadragon.Rect(x, y, w, h);
            //}

           
           // toggleLayerButton.text(isLayer ? 'Remove Layer' : 'Create Layer');

            //isHotspot ? toggleToHotspot(point) : toggleFromHotspot();
            //isLayer ? toggleToLayer(rect) : toggleFromLayer();

            // don't show the toggle layer button if we're dealing with audio/video or an older server
            //toggleLayerButton.css({
            //    'display': enableLayering ? 'inline-block' : 'none'
            //});

            //rightbar.find('.assocmedia').html(contentrightbar = $('.rightbar');
            var rightbar = $('.rightbar');
            rightbar.find('.title').val('');
            rightbar.find('.description').val('');
            rightbar.find('.header').text('Add Text Annotation');
            rightbar.find('.assocMediaContainer').hide();
            ///rightbar.find('descContainer').style.height = '35%';

            rightbar.find('.title').on('keyup', function () {
                editingMedia = true;
            });

            rightbar.find('.description').on('keyup', function () {
                editingMedia = true;
            });

            rightbar.find('.toggleHotspot').text('Set as Hotspot');

            if (!rightbarIsOpen) {
                rightbar.animate({ 'right': 0 }, 600);
            }

            //for (key in asset.doq.Metadata) { // TODO just use 'global' current assoc media object rather than doing this set/getActiveMediaMetadata business
            //    if (asset.doq.Metadata.hasOwnProperty(key)) {
            //        setActiveMediaMetadata(key, asset.doq.Metadata[key]);
            //    }
            //}
            //setActiveMediaMetadata('assetDoqID', asset.doq.Identifier);

            rightbarIsOpen = true;
            //activeAssocMedia = asset;

            //callback;

        }


        return {
            openNew: openNew,
        };
    }

    /**Generate text asset
     * @method createTextAsset
     * @param {String, String}  name: name of text assoc media, text: content of assoc media
     */
    function createTextAsset(title, text) { 
        var name = title ? title : "Untitled Text";
        var options;
        if (text) {
            options = {
                Text: text,
                Name: name
            };
            TAG.Worktop.Database.createTextAssocMedia(options, onSuccess);
        } 
        //else {
        //    loadAssocMediaView();
        //}
        function onSuccess(doqData) {
            var newDoq = new Worktop.Doq(doqData.responseText);
            function done() {
                //loadAssocMediaView(newDoq.Identifier);
                //Jing: TODO reload assoc media list in the sidebar
                //rightbarLoadingSave.fadeOut();
                
                //reloadAssocMedia(newDoq.Identifier);
                TAG.Util.hideLoading($('.buttonbarLoadingDelete'));
                $('.buttonbarLoadingDelete').remove();
                $('.assetContainer').empty();
                createMediaList($('.assetContainer'));
                //thumbnailLoadingSave.fadeOut();
            }
            var ops = {};
            ops.AddIDs = newDoq.Identifier;
            TAG.Worktop.Database.changeArtwork(artwork.Identifier, ops);
            TAG.Worktop.Database.changeHotspot(newDoq.Identifier, options, done, TAG.Util.multiFnHandler(authError, done), TAG.Util.multiFnHandler(conflict(newDoq, "Update", done)), error(done));
            
        };

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


   
    /**
    * Save artwork metadata
    * @method save
    */
    var shouldSave = false;
    function saveMetadata() {
        var i,
            additionalFields = $('.additionalField'),
            infoFields = {};        
        //saveMetadataButton.text('Saving...');
        //saveMetadataButton.attr('disabled', 'true');
        titleArea.text("Saving "+artworkMetadata.Title.val() + "...");
        for (i = 0; i < additionalFields.length; i++) {
            var key = $(additionalFields[i]).attr("value");
            if (key === "") {
                key = "Unnamed Field " + i;
            }
            infoFields[key] = $(additionalFields[i]).attr('entry');
        }

        var textName = $(artworkMetadata.Title).val();
        
        if (textName == "") {
            textName= "Untitled Artwork";
        }
        TAG.Worktop.Database.changeArtwork(artwork.Identifier, {
            Name: textName,
            Artist: $(artworkMetadata.Artist).val(),
            Year: $(artworkMetadata.Year).val(),
            Location: JSON.stringify(locationList),
            Description: $(artworkMetadata.Description).val(),
            InfoFields: JSON.stringify(infoFields)
        }, saveSuccess, saveFail,conflict, saveError);

        // success handler for save button
        function saveSuccess() {
            titleArea.text(artworkMetadata.Title.val());
            var authoringHub = new TAG.Authoring.SettingsView("Artworks", null, null, artwork.Identifier,guidsToBeDeleted);
            TAG.Util.UI.slidePageRight(authoringHub.getRoot());
            //saveMetadataButton.text('Save Changes');
            //saveMetadataButton[0].removeAttribute('disabled');
        }

        // general failure callback for save button
        function saveFail() {
            titleArea.text(artworkMetadata.Title.val());
            var popup = $(TAG.Util.UI.popUpMessage(function () {
                var authoringHub = new TAG.Authoring.SettingsView("Artworks", null, null, artwork.Identifier,guidsToBeDeleted);
                TAG.Util.UI.slidePageRight(authoringHub.getRoot());
            }, "Changes to " + artwork.Name + " have not been saved.  You must log in to save changes."));
            $('body').append(popup);
            popup.show();
            shouldSave = false;
            //saveMetadataButton.text('Save Changes');
            //saveMetadataButton[0].removeAttribute('disabled');
        }

        // error handler for save button
        function saveError() {
            titleArea.text(artworkMetadata.Title.val());
            var popup;
            popup = $(TAG.Util.UI.popUpMessage(function () {
                var authoringHub = new TAG.Authoring.SettingsView("Artworks", null, null, artwork.Identifier,guidsToBeDeleted);
                TAG.Util.UI.slidePageRight(authoringHub.getRoot());
            }, "Changes to " + artwork.Name + " have not been saved.  There was an error contacting the server."));
            $('body').append(popup); // TODO ('body' might not be quite right in web app)
            popup.show();
            shouldSave = false;
            //saveMetadataButton.text('Save Changes');
            //saveMetadataButton[0].removeAttribute('disabled');
        }
    }

    /**
     * Artwork metadata editor. Contains methods for initializing the metadata form, saving metadata, adding additional
     * metadata fields, etc...
     * @method MetadataEditor
     * @return {Object}      an object with "public" associated media editing methods
     */
    function MetadataEditor() {
        var isOpen,
            addInfoButton,
            saveMetadataButton,
            textFieldContainer,
            metadataForm;

        /**
         * Create a metadata editing field.
         * @method createMetadataTextArea
         * @param {Object} options
         */
        function createMetadataTextArea(options) {
            var field = options.field,
                entry = options.entry,
                animate = options.animate,
                isTextarea = options.isTextarea,
                isAdditionalField = options.isAdditionalField,
                textareaContainer = $(document.createElement('div')).addClass('textareaContainer'),
                fieldTitle = $(document.createElement(isAdditionalField ? 'input' : 'div')).addClass('fieldTitle'),
                textarea = $(document.createElement(isTextarea ? 'textarea' : 'input')),
                deleteFieldIcon = $(document.createElement('div'));

            textareaContainer.css({ // TODO STYL
                'margin-bottom': '7%',
                'width': '100%',
                'text-align': 'left'
            });

            isAdditionalField && fieldTitle.addClass('additionalField');
            isAdditionalField && field!=="" ? fieldTitle.attr('value', field) : fieldTitle.text(field);

            fieldTitle.css({ // TODO STYL
                'display': 'inline-block',
                'color': isAdditionalField ? 'black' : 'white',
                'margin-right': '12px',
                'width': '18%',
                'text-align': 'right',
                'vertical-align': isAdditionalField ? '' : 'top',
                'padding-top': isAdditionalField ? '0px' : '5px',
                'font-size':'0.8em',
                'overflow': 'hidden',
                'border': "0px solid black"
            });

            if (isTextarea) {
                textarea.attr('rows', 3);
                textarea.css({ // TODO add a class, use textarea.classname vs input.classname in STYL
                    'overflow': 'auto',
                    'background': 'white',
                    'border': "0px solid black"
                });
            }// else {
            /*textarea.on('keyup', function () {
                var txt = (textarea && textarea[0] && textarea[0].value) ? textarea[0].value.replace(/[^àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\w\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') : "";
                if (textarea && textarea[0] && textarea[0].value && textarea[0].value!=txt) {
                    textarea[0].value = txt;
                }
            });
            fieldTitle.on('keyup', function () {
                var txt = (fieldTitle && fieldTitle[0] && fieldTitle[0].value) ? fieldTitle[0].value.replace(/[^àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\w\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') : "";
                if (fieldTitle && fieldTitle[0] && fieldTitle[0].value && fieldTitle[0].value!=txt) {
                    fieldTitle[0].value = txt;
                }
            });*/
            textarea.change(function () {
                shouldSave = true;
            })
            fieldTitle.change(function () {
                shouldSave = true;
            })
            //}
            textarea.css({ // TODO STYL
                'width': '70%',
                'font-size': '11pt',
                'display': 'inline-block',
                'border': "0px solid black"
            });
            if (isAdditionalField){
                textarea.attr('placeholder', "Metadata Field")
            }
            if (!isAdditionalField) {
                textarea.attr('placeholder', field);
            }

            if (isAdditionalField) {
                fieldTitle.attr('entry', entry);
                textarea.on('keyup', function () {
                    fieldTitle.attr('entry', textarea.attr('value'));
                });
            }
            artworkMetadata[field] = textarea;
            textarea.val(entry);
            textarea.attr('title', field);

            deleteFieldIcon.css({ 'margin-left': '15px', display: 'inline-block', width: '30px' });
            if (field !== 'Title' && field !== 'Keywords' && field !== 'Artist' && field !== 'Year' && field !== 'Description') {
                fieldTitle.attr('placeholder', "New");
                deleteFieldIcon = $(document.createElement('img'));
                deleteFieldIcon.attr('src', tagPath + 'images/icons/minus.svg');
                if (!IS_WINDOWS){
                    deleteFieldIcon.css({
                    'float': 'right',
                    'width': '20px',
                    'height': '20px',
                    'display': 'inline-block'
                });
                } else {
                    deleteFieldIcon.css({
                    'float': 'right',
                    'margin-right': '2%',
                    'width': '30px',
                    'height': '30px',
                    'display': 'inline-block'
                });
                }
                deleteFieldIcon.bind("click", { Param1: field, }, function (event) {
                    shouldSave = true;
                    textareaContainer.remove();
                    if (!shouldDisableAddButton()) {
                        addInfoButton.removeAttr('disabled');
                    }
                });
            }
            animate && textareaContainer.css('display', 'none');

            textareaContainer.append(fieldTitle);
            textareaContainer.append(textarea);
            textareaContainer.append(deleteFieldIcon);
            textFieldContainer.append(textareaContainer);
            if (animate) {
                textareaContainer.slideDown(function () {
                    $("#metadataForm").animate({ scrollTop: $("#metadataForm")[0].scrollHeight }, 1000);
                });
            }
            return textarea;
        }

        /**
         * Creates additional metadata fields
         */
        function createCustomFields() {
            var infoFields = artwork.Metadata.InfoFields;
            infoFields = infoFields || {};
            $.each(infoFields, function (key, val) {
                createMetadataTextArea({ field: key, entry: val, animate: true, isAdditionalField: true });
            });
        }

        /**
         * Returns true if we should disable the "Add Information Field" button. We should if there are more than
         * two additional fields already.
         * @method shouldDisableAddButton
         * @return {Boolean}         whether or not we should disable the button
         */
        function shouldDisableAddButton() {
            return $('.additionalField').length >= 10;
        }

        /**
         * Initialize the metadata editor UI
         * @method init
         */
        function init() {
            var formTitle;

            metadataForm = $(document.createElement('div')) // TODO JADE/STYL
            .attr("id", "metadataForm")
            .css({
                'background': 'rgba(0, 0, 0, 0.85)',
                'border-radius': '0px 10px 10px 0px',
                'left': '20%',
                'width': '45%',
                'position': 'absolute',
                'display': 'none',
                'color': 'white',
                'padding-top': '1%',
                'margin-top': '1%',
                'z-index': 100000,
                'max-height': '70%',
                'overflow-y': 'scroll'
            })
            .appendTo(mainPanel);

            formTitle = $(document.createElement('div')); // TODO JADE/STYL
            formTitle.text("Metadata Editor");
            formTitle.css({
                'width': '100%',
                'text-align': 'center',
                'font-size': '150%',
            });
            metadataForm.append(formTitle);

            textFieldContainer = $(document.createElement('div')); // TODO JADE/STYL
            textFieldContainer.attr("id", "textFieldContainer");
            textFieldContainer.css({
                'position': 'relative',
                'height': '25%',
                'overflow': 'auto',
                'padding': '0px 4% 0px 0px',
                'margin-top': '30px'
            });
            metadataForm.append(textFieldContainer);

            addInfoButton = $(document.createElement('button'));
            addInfoButton.text('Add Metadata Field').css('border-radius', '3.5px'); // TODO JADE/STYL
            addInfoButton.attr('type', 'button');
            addInfoButton.css({
                'left': '10%',
                'width': '80%',
                'margin-top': '2%',
                'margin-bottom': '3%',
                'position': 'relative'
            });
            metadataForm.append(addInfoButton);

            saveMetadataButton = $(document.createElement('button')); // TODO JADE/STYL
            saveMetadataButton.text('Save');
            saveMetadataButton.attr('type', 'button');
            saveMetadataButton.css({
                'left': '10%',
                'width': '80%',
                'margin-top': '2%',
                'margin-bottom': '3%',
                'position': 'relative'
            });
            //metadataForm.append(saveMetadataButton);

            createMetadataTextArea({ field: 'Title', entry: artwork.Name }); // TODO a lot of this can be factored to J/S
            createMetadataTextArea({ field: 'Artist', entry: artwork.Metadata.Artist });
            createMetadataTextArea({ field: 'Year', entry: artwork.Metadata.Year });
            createMetadataTextArea({ field: 'Description', entry: artwork.Metadata.Description, isTextarea: true });
            createCustomFields();

            if (shouldDisableAddButton()) {
                addInfoButton.attr('disabled', 'true');
            }

            addInfoButton.on('click', function () {
                shouldSave = true;
                createMetadataTextArea({ field: "", entry: "", animate: true, isAdditionalField: true });
                if (shouldDisableAddButton()) {
                    addInfoButton.attr('disabled', 'disabled');
                }
            });

            //saveMetadataButton.on('click', save);
        }

        

        /**
         * Open the metadata editor
         * @method open
         */
        function open() {
            if (!isOpen) {
                closeAllPanels();
                metadataForm.toggle();
                metadataButton.css({ 'background-color': 'white', 'color': 'black' }); // TODO could do css toggling using classes and static css
                rightArrow.attr('src', tagPath+'images/icons/RightB.png');
                sidebarHideButtonContainer.hide();
                isOpen = true;
            }
        }

        /**
         * Close the metadata editor
         * @method close
         */
        function close() {
            if (isOpen) {                
                metadataForm.toggle();
                metadataButton.css({ 'background-color': 'transparent', 'color': 'white' });
                rightArrow.attr('src', tagPath+'images/icons/Right.png');
                sidebarHideButtonContainer.show();
                isOpen = false;
            }
        }


        /**
         * Toggle the metadata editor open and closed
         * @method toggle
         */
        function toggle() {
            isOpen ? close() : open();
        }

        /**
         * Returns whether the editing panel is open
         * @method returnIsOpen
         * @return {Boolean}      true if open
         */
        function returnIsOpen() {
            return isOpen;
        }

        return {
            init: init,
            open: open,
            close: close,
            toggle: toggle,
            isOpen: returnIsOpen
        };
    }

    
    function KeywordsEditor() {
        var isOpen,             // Is this editor open?
            categorySelects = [],    // Array holding select elements (jQuery objects) for keyword categories.
            $keywordsForm,      // Div holding all our stuff.
            $keywordsContainer, // Div holding the checkboxes for keywords.
            $saveContainer,     // Div holding the save button.
            $saveButton;         // Save button.

        // TODO: GET FROM METADATA
        var currentKeywords = [['breadfruit'], ['saffron'], ['charles darwinism', '^_^']];

        /**
         * Initialize the keywords editor UI
         * @method init
         */
        function init() {
            var formTitle

            $keywordsForm = $(document.createElement('div')) // TODO JADE/STYL
                .attr("id", "keywordsForm")
                .css({
                    'background': 'rgba(0, 0, 0, 0.85)',
                    'border-radius': '0px 10px 10px 0px',
                    'left': '20%',
                    'width': '45%',
                    'position': 'absolute',
                    'display': 'none',
                    'color': 'white',
                    'padding-top': '1%',
                    'margin-top': '1%',
                    'z-index': 100000,
                    'max-height': '70%',
                    'overflow-y': 'hidden'
                })
                .appendTo(mainPanel);

            formTitle = $(document.createElement('div')) // TODO JADE/STYL
                .text('Keywords Editor')
                .css({
                    'width': '100%',
                    'text-align': 'center',
                    'font-size': '150%',
                })
                .appendTo($keywordsForm);

            $keywordsContainer = $(document.createElement('div')) // TODO JADE/STYL
                .attr('id', 'keywordsContainer')
                .css({
                    'position': 'relative',
                    'height': '25%',
                    'overflow': 'hidden',
                    'margin': '30px 4%'
                })
                .appendTo($keywordsForm);
            //createSelects(keywordcategories, keywords, $keywordsContainer);

            // Make sure everything's coo.
            if (!keywords || !keywordCategories || !categorySelects) {
                console.log('Tried creating selects before initializing the keywords editor!');
                return;
            }

            // Define some height values.
            var checklistContainerHeight = $('#tagRoot').height() / 3;
            var numItemsShown = 10;
            var checklistItemHeight = checklistContainerHeight / (numItemsShown + 1);

            // Create a list to store checklists in.
            var $checklistList = $(document.createElement('ul'))
                .addClass('checklist-list')
                .css({
                    'display': 'block',
                    'list-style-type': 'none',
                    'width': '100%',
                    'height': checklistContainerHeight + 'px',
                    'margin': '0px',
                    'padding': '0px',
                })
                .appendTo($keywordsContainer);

            // Create one checklist for each category.
            keywordCategories.forEach(function (category, categoryIndex) {
                var $checklistListItem = $(document.createElement('li'))
                    .addClass('checklist-listItem')
                    .css({
                        'display': 'inline-block',
                        'margin': '0px 1.5%', // No top/bot margin; each of 3 containers width is 30% + (2*1.5)% = 99%
                        'width': '30%',
                        'height': '100%'
                    })
                    .appendTo($checklistList);
                var $checklistContainer = $(document.createElement('div'))
                    .addClass('checkList-container')
                    .css({
                        'background-color': '#d9000000',
                        'color': '#000',
                        'width': '100%',
                        'height': '100%'
                    })
                    .appendTo($checklistListItem);
                var $checklistTitleConatiner = $(document.createElement('div'))
                    .addClass('checkList-title-container')
                    .text(category)
                    .css({
                        'color': '#fff',
                        'background-color': '#d9000000',
                        'height': checklistItemHeight + 'px',
                        'line-height': checklistItemHeight + 'px',
                        'font-size': (0.8 * checklistItemHeight) + 'px',
                        'padding': '0px 3%',
                        'width': '94%',
                        'overflow': 'hidden',
                        'text-overflow': 'ellipsis',
                        'white-space': 'nowrap',

                    })
                    .appendTo($checklistContainer);
                var $checklistWrapper = $(document.createElement('div'))
                    .addClass('checklist-wrapper')
                    .css({
                        'background-color': '#fff',
                        'color': '#000',
                        'height': (checklistContainerHeight - checklistItemHeight) + 'px',
                        'width': '100%'
                    })
                    .appendTo($checklistContainer);
                var $checklist = $(document.createElement('div'))
                    .addClass('checklist')
                    .css({
                        'height': '100%',
                        'width': '100%',
                        'overflow-y': 'auto'
                    })
                    .appendTo($checklistWrapper);

                keywords[categoryIndex].forEach(function (keyword, keywordIndex) {
                    var $keywordDiv = $(document.createElement('div'))
                        .css({
                            'color': '#000',
                            'display': 'block',
                            'height': checklistItemHeight + 'px',
                            'line-height': checklistItemHeight + 'px',
                            'font-size': (0.8 * checklistItemHeight) + 'px',
                            'padding': '0px 7% 0px 3%',
                            'width': '90%',
                            'overflow': 'hidden',
                            'text-overflow': 'ellipsis',
                            'white-space': 'nowrap'
                        })
                        .hover(
                            function () {
                                $(this).css({'background-color': '#39f'});
                            },
                            function () {
                                $(this).css({ 'background-color': '#fff' });
                            }
                        )
                        .click(function() {
                            $(this).find('input:checkbox').attr('checked', !$(this).find('input:checkbox').attr('checked'));
                        })
                        .appendTo($checklist);
                    var $keywordCheckbox = $(document.createElement('input'))
                        .addClass('keyword-checkbox')
                        .attr('type', 'checkbox')
                        .attr('id', 'keyword-checkbox_' + categoryIndex + '_' + keywordIndex)
                        .attr('index', keywordIndex)
                        .attr('value', keywordIndex)
                        .css({
                            'border': '1px solid #777',
                            'background-color': '#fff'
                        })
                        .click(function(e) {
                            e.stopPropagation();
                        })
                        .appendTo($keywordDiv);
                    keywordsCheckboxDict[categoryIndex][keyword] = $keywordCheckbox;
                    var $keywordLabel = $(document.createElement('label'))
                        .text(keyword)
                        .attr('index', keywordIndex)
                        .attr('value', keywordIndex)
                        .attr('for', 'keyword-checkbox_' + categoryIndex + '_' + keywordIndex)
                        .css({
                            'cursor': 'default',
                            'font-size': '0.7em'
                        })
                        .click(function (e) {
                            e.stopPropagation();
                        })
                        .appendTo($keywordDiv);  
                });
            });

            // Check off the current keywords.
            keywordCategories.forEach(function (category, categoryIndex) {
                currentKeywords[categoryIndex].forEach(function (keyword, keywordIndex) {
                    keywordsCheckboxDict[categoryIndex][keyword][0].checked = true;
                });
            });

            // Add save button.
            var $saveContainer = $(document.createElement('div'))
                .attr('id', 'save-keywords-container')
                .css({
                    'width': '100%',
                    'padding-bottom': '7%',
                    'position': 'relative'
                })
                .appendTo($keywordsForm);
            var $saveButton = $(document.createElement('button'))
                .attr('id', 'save-keywords-button')
                .text("Save Keywords").css('border-radius', '3.5px')
                .css({
                    'position': 'absolute',
                    'right': '5.5%',
                    'top': '0px'
                })
                .click(function() {
                    var i,
                        j,
                        checkboxes = $('input.keyword-checkbox:checked'),
                        artworkKeywords = [[], [], []];
                    for (i = 0; i < checkboxes.length; i++) {
                        var categoryIndex = $(checkboxes[i]).attr('id').split('_')[1];
                        artworkKeywords[categoryIndex].push($(checkboxes[i]).parent().find('label').text());
                    }

                    for (i = 0; i < artworkKeywords.length; i++) {
                        console.log(keywordCategories[i]);
                        for (j = 0; j < artworkKeywords[i].length; j++) {
                            console.log('    ' + artworkKeywords[i][j]);
                        }
                    }
                })
                .appendTo($saveContainer);
        }



        /**
         * Open the keywords editor
         * @method open
         */
        function open() {
            if (!isOpen) {
                closeAllPanels();
                $keywordsForm.toggle();
                keywordsButton.css({ 'background-color': 'white', 'color': 'black' }); // TODO could do css toggling using classes and static css
                rightArrowKeywords.attr('src', tagPath + 'images/icons/RightB.png');
                sidebarHideButtonContainer.hide();
                isOpen = true;
            }
        }

        /**
         * Close the keywords editor
         * @method close
         */
        function close() {
            if (isOpen) {
                $keywordsForm.toggle();
                keywordsButton.css({ 'background-color': 'transparent', 'color': 'white' });
                rightArrowKeywords.attr('src', tagPath + 'images/icons/Right.png');
                sidebarHideButtonContainer.show();
                isOpen = false;
            }
        }


        /**
         * Toggle the keywords editor open and closed
         * @method toggle
         */
        function toggle() {
            isOpen ? close() : open();
        }

        /**
         * Returns whether the editing panel is open
         * @method returnIsOpen
         * @return {Boolean}      true if open
         */
        function returnIsOpen() {
            return isOpen;
        }

        return {
            init: init,
            open: open,
            close: close,
            toggle: toggle,
            isOpen: returnIsOpen
        };
    }
};
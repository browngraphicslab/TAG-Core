TAG.Util.makeNamespace("TAG.Layout.ArtworkEditor");

/**
 * The layout definition for the artwork editor. 
 * Click 'Edit Artwork Info' in the Authoring Mode to enter.
 * Contains info, location, and media editors.
 * @class TAG.Layout.ArtworkEditor
 * @constructor
 * @param {doq} artwork          doq of the relevant artwork (see github wiki for doq structure)
 * @return {Object}              any public methods or properties
 */

TAG.Layout.ArtworkEditor = function (artwork) {
    "use strict";

    var // DOM-related
        root = $(document.createElement('div')), // get via Util.getHtmlAjax in web app
        topbar = $(document.createElement('div')), // get via root.find(...) in web app, set up in JADE
        mainPanel = $(document.createElement('div')),
        titleArea = $(document.createElement('div')),
        rightbarLoadingDelete = $(document.createElement('div')),

        // misc initialized variables
        helpText = "To select a location, type into the search field or \
                    right-click/long-press on the map and drag the pushpin \
                    to the desired location, then click on the desired \
                    address and click 'Confirm.'",                                        // location history hint text
        credentials = "AkNHkEEn3eGC3msbfyjikl4yNwuy5Qt9oHKEnqh4BSqo5zGiMGOURNJALWUfhbmj", // bing maps credentials
        locationList = [],                                                                // list of locations in location history
        artworkMetadata = {},                                                             // will be populated by HTML elements whose values have artwork metadata
        textMetadata = {},                                                                // deprecated -- for text metadata
        loadQueue = TAG.Util.createQueue(),                                              // async queue for loading UI elements                                                  
        topbarHeight = 8,                                                                 // % height of top bar
        METADATA_EDITOR = MetadataEditor(),                                               // MetadataEditor object to deal with metadata-related business
        THUMBNAIL_EDITOR = ThumbnailEditor(),                                             // ThumbnailEditor object to deal with setting up thumbnail editing
        LOCATION_HISTORY = RichLocationHistory(),                                         // RichLocationHistory object ................................
        MEDIA_EDITOR = AssocMediaEditor(),                                                // AssocMediaEditor object ................................
       // currentKeyHandler = TAG.Util.UI.getStack()[0],

        // misc uninitialized variables
        zoomimage,                    // AnnotatedImage object
        metadataButton,               // "Information" sidebar button
        rightArrow,                   // right arrow in "Information" button
        editThumbnailButton,          // "Edit Thumbnail" button
        rightArrowEditThumb,          // right arrow in "Edit Thumbnail" button
        editLocButton,                // "Edit Location History" button
        rightArrowEditLoc,            // right arrow in "Edit Location History" button
        sidebarHideButtonContainer;   // tab to expand/contract side bar
        
        

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

        //creates deep zoom image
        if (artwork) {
            zoomimage = new TAG.AnnotatedImage(root, artwork, false, function () { // TODO UPDATE TO MATCH NEW ANNOTATEDIMAGE IN WEBAPP
                if (!(zoomimage.loadDoq(artwork))) { // if artwork load is unsuccessful...
                    var popup = TAG.Util.UI.popUpMessage(function () {
                        TAG.Authoring.NewSettingsView("Artworks", function (settingsView) {
                            TAG.Util.UI.slidePageRight(settingsView.getRoot());
                        }, null, artwork.Identifier);
                    }, "There was an error loading the image.", "Go Back", true);
                    root.append(popup);
                    $(popup).show();
                }
                initUI();
            }, true);
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
            'position': 'relative'
        }).addClass("topbar");

        backButton.attr('src', 'images/icons/Back.svg'); // TODO add tagpath in web app
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
        backButton.on('click', function () {
           // TAG.Util.UI.getStack()[0] = currentKeyHandler;
            var authoringHub,
                editingMediamsg;
            if (MEDIA_EDITOR.isOpen()) {
                editingMediamsg = $(TAG.Util.UI.popUpMessage(null, "You are currently editing a Hotspot or Media", "OK", false));
                root.append(editingMediamsg);
                editingMediamsg.show();
                TAG.Util.UI.cgBackColor("backButton", backButton, true);
            } else {
                backButton.off('click');
                authoringHub = new TAG.Authoring.SettingsView("Artworks", null, null, artwork.Identifier);
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
    }

    /**
     * Creates associated media list in left panel
     * @method createMediaList
     * @param {jQuery obj} container        the element containing this list
     */
    function createMediaList(container) {
        container = container || $('.assetContainer');
        container.empty();
        zoomimage.loadHotspots(); // TODO this is different in the web app -- see what's done in ArtworkViewer.js
        TAG.Worktop.Database.getAssocMediaTo(artwork.Identifier, mediaSuccess, function () {
            console.log("error 1 in createMediaList");
        }, function () {
            console.log("error 2 in createMediaList");
        });

        /**
         * Helper function called by createMediaList after all associated media
         * have been retrieved
         * @method mediaSuccess
         * @param {Array} mediaList     an array of assoc media doqs
         */
        function mediaSuccess(mediaList) {
            var i;

            // sort alphabetically
            mediaList.sort(function (a, b) {
                return a.Name < b.Name ? -1 : 1;
            });

            // create divs for each media
            for (i = 0; i < mediaList.length; i++) {
                loadQueue.add(createMediaHolder(container, mediaList[i]));
            }
        }
    }

    /**
     * Returns a function that creates a media holder -- NOT WRITING DOCUMENTATION OR CLEANING, SEE TODO BELOW
     * (it returns a function because it's used as a callback)
     */
    function createMediaHolder(container, asset) { // TODO -- there's a util function for this in the webapp now (TAG.Util.Artwork.createThumbnailButton); in binding the call to loadQueue.add above, can pass in function(){ TAG.Util.Artwork...... }
        return function () {
            var $holder = $(document.createElement('div'));
            $holder.addClass("assetHolder");
            $holder.css({
                'float': 'left',
                'margin': '2%',
                'width': '44%',
                'position': 'relative',
                'text-align': 'center',
                'border': '1px solid white'
            });

            $holder.data('info', asset);

            $holder.on("click", thumbnailButtonClick(asset, $holder));
            container.append($holder);
            $holder.css('height', $holder.width() * 1.20);

            var $mediaHolderDiv = $(document.createElement('div'));
            $mediaHolderDiv.addClass('mediaHolderDiv');
            $mediaHolderDiv.css({
                "height": "80%",
                "width": "96%",
                "margin": "2%"
            });
            $holder.append($mediaHolderDiv);

            var $mediaHolderImage = $(document.createElement('img'));
            $mediaHolderImage.addClass('assetHolderImage');
            switch (asset.Metadata.ContentType) {
                case 'Audio':
                    $mediaHolderImage.attr('src', 'images/audio_icon.svg');
                    break;
                case 'Video':
                    $mediaHolderImage.attr('src', (asset.Metadata.Thumbnail && !asset.Metadata.Thumbnail.match(/.mp4/)) ? TAG.Worktop.Database.fixPath(asset.Metadata.Thumbnail) : 'images/video_icon.svg');
                    break;
                case 'Image':
                    $mediaHolderImage.attr('src', asset.Metadata.Thumbnail ? TAG.Worktop.Database.fixPath(asset.Metadata.Thumbnail) : 'images/image_icon.svg');
                    break;
                default:
                    $mediaHolderImage.attr('src', 'images/text_icon.svg');
                    break;
            }
            $mediaHolderImage.css({
                'max-width': '100%',
                'max-height': '100%'
            });
            $mediaHolderImage.removeAttr('width');
            $mediaHolderImage.removeAttr('height');
            $mediaHolderDiv.append($mediaHolderImage);

            var $title = $(document.createElement('div'));
            $title.text(TAG.Util.htmlEntityDecode(asset.Name));
            $title.css({
                'top': '80%',
                'height': '20%',
                'color': 'white',
                'overflow': 'hidden',
                'text-overflow': 'ellipsis',
                'white-space': 'nowrap',
                'margin': '0% 2% 0% 2%'
            });
            $holder.append($title);
        };
    }

    /**
     * Click handler for an associated media thumbnail button. Opens the media editing pane.
     * @method thumbnailButtonClick
     * @param {Object} asset            associated media object
     * @param {jQuery obj} holder       the thumbnail button
     */
    function thumbnailButtonClick(asset, holder) { // TODO in the web app, pass this in to TAG.Util.Artwork.createThumbnailButton
        return function () {
            closeAllPanels();
            MEDIA_EDITOR.open(asset, MEDIA_EDITOR.createMediaWrapper(asset), function () {
                $('.assetHolder').css('background-color', '');
                holder.css('background-color', 'rgba(255, 255, 255, 0.75)');
            });
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
            addRemoveMedia,    // "Add/Remove Media" button
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
            'margin-top': '2%',
            'margin-bottom': '3%',
            'width': '100%',
            'height': root.height() * 0.05,
            'color': 'white',
            'position': 'relative'
        };

        sidePanelFontSize = TAG.Util.getMaxFontSizeEM("Edit Location History", 1, root.width() * 0.1, 0.65 * newButtonCSS.height); // TODO can probably do this in STYL
        titleFontSize = TAG.Util.getMaxFontSizeEM("Artwork Information", 1, root.width() * 0.15, 0.8 * newButtonCSS.height); // TODO can probably do this in STYL

        sidebar = $(document.createElement('div')); // TODO JADE/STYL
        sidebar.addClass("sidebar");
        sidebar.css({
            'width': '20%',
            'height': '100%',
            'position': 'relative',
            'left': '0%',
            'float': 'left',
            'background-color': 'rgba(0,0,0,0.85)',
            'z-index': 100,
        });

        buttonContainer = $(document.createElement('div')); // TODO JADE/STYL
        buttonContainer.attr('class', 'buttonContainer');
        buttonContainer.css({
            position: 'relative',
            'margin-top': '4%',
            'text-align':'center'
        });
        sidebar.append(buttonContainer);

        artworkInfoLabel = $(document.createElement('div')); // TODO JADE/STYL
        artworkInfoLabel.addClass('artworkInfoLabel');
        artworkInfoLabel.text('Artwork Information');
        artworkInfoLabel.css({
            color: 'white',
            'font-size': titleFontSize,
            'margin-top': '2%'
        });
        buttonContainer.append(artworkInfoLabel);

        rightArrow = $(document.createElement('img')); // TODO J/S
        rightArrow.attr('src', '/images/icons/Right.png'); // TODO keep this in js, tack on tagPath in web app
        rightArrow.css({
            "position": "absolute",
            "right": "5%",
            top: "30%",
            width: "auto",
            height: "40%"
        });

        metadataButton = $(document.createElement('div')) // TODO J/S
                            .css(newButtonCSS);
        metadataButton.append(rightArrow);

        metaDataLabel = $(document.createElement('label')); // TODO J/S
        metaDataLabel.text("Information");
        metaDataLabel.css({
            "width": "100%",
            "height": "100%",
            "text-align": "center",
            "line-height": metadataButton.height() + "px",
            "font-size": sidePanelFontSize
        });

        metadataButton.append(metaDataLabel);
        buttonContainer.append(metadataButton);

        rightArrowEditLoc = $(document.createElement('img')); // TODO J/S
        rightArrowEditLoc.attr('src', '/images/icons/Right.png');
        rightArrowEditLoc.css({ "position": "absolute", "right": "5%", top: "30%", width: "auto", height: "40%" });

        editLocLabel = $(document.createElement('label')); // TODO J/S
        editLocLabel.text("Edit Location History");
        editLocLabel.css({ "width": "100%", "height": "100%", "line-height": "100%", "text-align": "center" });

        editLocButton = $(document.createElement('div')); // TODO J/S
        editLocButton.css(newButtonCSS);
        buttonContainer.append(editLocButton);
        editLocButton.append(rightArrowEditLoc);
        editLocButton.append(editLocLabel);
        editLocLabel.css({ "line-height": editLocButton.height() + "px", "font-size": sidePanelFontSize });

        editThumbLabel = $(document.createElement('label')); // TODO J/S
        editThumbLabel.text("Capture Thumbnail");
        editThumbLabel.css({ "width": "100%", "height": "100%", "line-height": "100%", "text-align": "center" });

        rightArrowEditThumb = $(document.createElement('img')); // TODO J/S
        rightArrowEditThumb.attr('src', '/images/icons/Right.png');
        rightArrowEditThumb.css({ "position": "absolute", "right": "5%", top: "30%", width: "auto", height: "40%" });

        editThumbnailButton = $(document.createElement('div')); // TODO J/S
        editThumbnailButton.addClass("editThumbnailButton");
        editThumbnailButton.attr('type', 'button');
        editThumbnailButton.css(newButtonCSS);

        buttonContainer.append(editThumbnailButton); // TODO J/S
        editThumbnailButton.append(rightArrowEditThumb);
        editThumbnailButton.append(editThumbLabel);
        editThumbLabel.css({ "line-height": editLocButton.height() + "px", "font-size": sidePanelFontSize });

        // toggles metadata form and button
        metadataButton.on('click', function () {
            METADATA_EDITOR.toggle();
        });

        // toggles location history editing panel and button
        editLocButton.on('click', function () {
            LOCATION_HISTORY.toggle();
        });
        
        // toggles edit thumbnail functionality
        editThumbnailButton.on('click', function () {
            THUMBNAIL_EDITOR.toggle();
        });

        assocMediaLabel = $(document.createElement('div')); // TODO JADE/STYL
        assocMediaLabel.addClass('assocMediaLabel');
        assocMediaLabel.text('Associated Media');
        assocMediaLabel.css({
            color: 'white',
            'font-size': titleFontSize,
            'margin-top': '2%',
            'margin-bottom': "2%"
        });
        buttonContainer.append(assocMediaLabel);

        addRemoveMedia = $(document.createElement('button')); // TODO JADE/STYL
        addRemoveMedia.addClass('addRemoveMedia');
        addRemoveMedia.text('Add/Remove Media');
        addRemoveMedia.attr('type', 'button');
        addRemoveMedia.css(buttonCSS);
        buttonContainer.append(addRemoveMedia);

        // open media picker on button click
        addRemoveMedia.on('click', createMediaPicker);

        /**
         * Create the associated media selection picker
         * @method createMediaPicker
         */
        function createMediaPicker() {
            TAG.Util.UI.createAssociationPicker(root,
                "Choose the media you wish to associate with this artwork",
                {comp: artwork, type: 'artwork'},
                "artwork",
                [{
                    name: "all media",
                    getObjs: TAG.Worktop.Database.getAssocMedia,
                }, {
                    name: "currently associated",
                    getObjs: TAG.Worktop.Database.getAssocMediaTo,
                    args: [artwork.Identifier]
                }, {
                    name: "recently associated",
                    getObjs: TAG.Util.UI.getRecentlyAssociated
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
            padding: '0px 4% 0px 12%',
            'overflow-y': 'auto',
            height: '60%'
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
        sidebarHideIcon.css({ 'top': '39%', 'width': '40%', 'height': 'auto', 'position': 'relative', 'left': '20%' });
        sidebarHideIcon.attr('src', 'images/icons/Left.png'); // TODO keep this in js, use tagPath + ....
        sidebarHideButton.append(sidebarHideIcon);

        sidebarHideButtonContainer.append(sidebarHideButton);

        sidebarHideButtonContainer.on('click', function () {
            var left = expanded ? '-20%' : '0%';
            sidebarHideIcon.attr('src', expanded ? 'images/icons/Right.png' : 'images/icons/Left.png'); // TODO tagPath + ... in web app
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
            tnSave.text("Save Thumbnail");
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
                rightArrowEditThumb.attr('src', '/images/icons/RightB.png');
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
                rightArrowEditThumb.attr('src', '/images/icons/Right.png');
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
            searchBox,
            resultsBox,
            unsavedDescription,
            locationsDiv,
            confirmBubble,
            mapDiv,
            map,
            mapAttachClick,
            addLocationDiv,
            addLocButton,
            datePicker,
            customInfobox,
            locationTextArea,
            descriptionTextArea,
            helpBox,
            locationInfo,
            currentLocation,
            selectedLocResource,
            selectedAddress,
            selectedDate,
            editingDescription,
            selectedPoint,
            yearBox,
            monthBox,
            dateBox,
            locationPanelDiv;

        //Generates the list of artwork locations in the artwork editor
        function drawLocationList() {
            for (var i = 0; i < locationList.length; i++) {
                if (typeof locationList[i].date == "string") {
                    var dateParts = locationList[i].date.split("-");
                    dateParts[2] = dateParts[2].substring(0, 2);
                    locationList[i].date = {
                        year: parseInt(dateParts[0], 10),
                        month: parseInt(dateParts[1], 10),
                        day: parseInt(dateParts[2], 10),
                    };
                }
            }
            locationList.sort(compareDates);
            $('div.locations').detach();

            // prevent crash upon clicking too fast, i.e. before bing map loads
            if (map) {
                map.entities.clear();
            }

            //click handler helpers
            function removeButtonClicked(e) {
                e.data.div.slideUp(function () { e.data.div.detach(); });
                var removed = e.data.locationList.remove(e.data.obj);
                TAG.Util.UI.drawPushpins(locationList, map);
                drawLocationList();
                if (e.data.obj === currentLocation)
                    customInfobox.hide();
                return false;
            }

            function editButtonClicked(e) {
                currentLocation = e.data.obj;
                setTimeout(function () { displayInfobox(e.data.obj); }, 300);
            }

            function newDivClicked(e) {
                TAG.Util.UI.drawPushpins(locationList, map);
                customInfobox.hide();
                $('div.locations').css(unselectedCSS);
                $('img.removeButton').attr('src', 'images/icons/minus.svg');
                $('img.editButton').attr('src', 'images/icons/edit.png');
                $(this).find('img.removeButton').attr('src', 'images/icons/minusB.svg');
                $(this).find('img.editButton').attr('src', 'images/icons/editB.png');
                $(this).css(selectedCSS);
                var lat, long, location;
                if (e.data.resource.latitude) {
                    location = e.data.resource;
                } else {
                    lat = e.data.resource.point.coordinates[0];
                    long = e.data.resource.point.coordinates[1];
                    location = new Microsoft.Maps.Location(lat, long);
                }
                var viewOptions = {
                    center: location,
                    zoom: 4,
                };
                map.setView(viewOptions);
            }

            function newDivHoverIn(e) {
                if (e.data[0].style.color === 'white') { // if text is white then box is unselected
                    e.data.css({
                        'background-color': 'rgba(50, 50, 50, 0.65)',
                    });
                }
            }

            function newDivHoverOut(e) {
                if (e.data[0].style.color === 'white') {
                    e.data.css({
                        'background-color': 'transparent',
                    });
                }
            }


            var i;
            for (i = 0; i < locationList.length; i++) {
                var unselectedCSS = {
                    'background-color': 'transparent',
                    'color': 'white'
                };
                var selectedCSS = {
                    'background-color': 'white',
                    'color': 'black',
                };
                var pushpinOptions = {
                    text: String(i + 1),
                    icon: '/images/icons/locationPin.png',
                    width: 20,
                    height: 30
                };
                var address = locationList[i].address;
                var date = '';
                if (locationList[i].date && !isNaN(locationList[i].date.year)) {
                    var year = locationList[i].date.year;
                    if (year < 0) {
                        //add BC to years that are less than 0
                        year = Math.abs(year) + ' BC';
                    }
                    date = " - " + year;
                } else {
                    date = ' - <i>Date Unspecified</i>';
                }
                var newDiv = $(document.createElement('div'));
                newDiv.addClass('locations');
                var entryConstraints = TAG.Util.constrainAndPosition(locationsDiv.width(), locationsDiv.height(), {
                    width: 1,
                    height: 0.16625,
                    max_height: 45,
                });
                var infoString = String((i + 1) + '. ' + address + date);
                var calibrationLength = infoString.length;
                if (calibrationLength > 30) {
                    calibrationLength = 30;
                }
                var locationFontSize = TAG.Util.getMaxFontSizeEM(infoString.substring(0, calibrationLength), 0.5, 1000, entryConstraints.height * 0.65, 0.01);
                newDiv.css({
                    'color': 'white',
                    'display': 'none',
                    width: entryConstraints.width + 'px',
                    height: entryConstraints.height + 'px',
                    'margin': '0 0 0.375% 0',
                    'position': 'relative',
                    'overflow': 'hidden',
                });
                var locText = $(document.createElement('div'));
                locText.html((i + 1) + '. ' + address + date);
                locText.css({
                    'width': '60%',
                    'height': '100%',
                    'white-space': 'nowrap',
                    'overflow': 'hidden',
                    'font-size': locationFontSize,
                    'display': 'inline-block',
                    'margin': '1.1% 0 0 3%',
                    'text-overflow': 'ellipsis',
                });
                newDiv.append(locText);

                var removeButton = $(document.createElement('img'));
                removeButton.on('click', null, { div: newDiv, locationList: locationList, obj: locationList[i] }, removeButtonClicked);
                removeButton.addClass('removeButton');
                removeButton.attr('src', 'images/icons/minus.svg');
                removeButton.css({
                    'height': '80%',
                    'width': 'auto',
                    'margin-right': '5%',
                    'margin-top': '0.825%',
                    'display': 'inline-block',
                    'position': 'relative',
                    'right': '0px',
                    'float': 'right',
                });
                newDiv.append(removeButton);
                var editButton = $(document.createElement('img')); // edit location details button
                editButton.on('click', null, { obj: locationList[i] }, editButtonClicked);
                editButton.addClass('editButton');
                editButton.attr('src', 'images/icons/edit.png');
                editButton.css({
                    'height': '80%',
                    'width': 'auto',
                    'margin-right': '2%',
                    'margin-top': '0.825%',
                    'display': 'inline-block',
                    'position': 'relative',
                    'float': 'right',
                });
                newDiv.append(editButton);
                TAG.Util.UI.drawPushpins(locationList, map);
                newDiv.on('click', null, locationList[i], newDivClicked);
                newDiv.on('mouseenter', null, newDiv, newDivHoverIn).on('mouseleave', null, newDiv, newDivHoverOut);
                locationsDiv.append(newDiv);
                newDiv.fadeIn();
                if (locationList[i] === currentLocation) //If this location is currently under edition, select it
                    newDiv.click();
            }
        }

        /**
         * Creates a date picker (two drop-downs for month and day and a text box for year)
         * @method createBasicDatePicker
         * @param {Number} loadDay         an optional day to load in
         * @param {Number} loadMonth       an optional month value to load in
         * @param {String} loadYear        an optional year string to load in
         */
        function createBasicDatePicker(loadDay, loadMonth, loadYear) {
            var bdp = $(document.createElement('div'));
            bdp.addClass("basicDatePicker");
            bdp.css({
                'width': '100%',
                float: 'left'
            });

            var nullOption = $(document.createElement('option')).html('---').attr('value', -1);
            var spacingCSS = { 'margin-right': '.5%' };
            var monthtext = ['January', 'Feburary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            var date = $(document.createElement('select'));
            var month = $(document.createElement('select'));
            var year = $(document.createElement('input'));

            var dropdownCSS = {
                'min-width': '0px',
                'min-height': '0px',
                'width': '25%',
                'margin-right': '1%',
                'font-size': '95%'
            };

            date.css(dropdownCSS);
            date.css({
                width: '15%',
            });

            month.css(dropdownCSS);
            year.css({
                'font-size': '95%',
                'width': '12.5%',
                'margin-right': '2.5px'
            });

            bdp.append(date).append(month).append(year);
            var dateNull = nullOption.clone().attr('value', 0), monthNull = nullOption.clone().attr('value', 0);

            if (loadDay && loadDay === 0) {
                date.append(dateNull.attr('selected', 1));
            } else {
                date.append(dateNull);
            }
            if (loadMonth && loadMonth === 0) {
                month.append(monthNull).attr('selected', 1);
            } else {
                month.append(monthNull);
            }

            var i;
            for (i = 0; i < 31; i++) {
                var dateOption = $(document.createElement('option'));
                dateOption.html(i + 1);
                dateOption.attr('value', i + 1);
                if (loadDay && loadMonth && loadDay === i + 1) {
                    dateOption.attr('selected', 1);
                }
                date.append(dateOption);
            }
            for (i = 0; i < 12; i++) {
                var monthOption = $(document.createElement('option'));
                monthOption.html(monthtext[i]);
                monthOption.attr('value', i + 1);
                if (loadMonth && loadMonth === i) {
                    monthOption.attr('selected', 1);
                }
                month.append(monthOption);
            }
            if (loadYear) {
                year.val(loadYear);
            }

            //triggered everytime the datepicker has changed, resets the selected date
            function dateChangedEvent() {
                $('div.results').css({ 'background-color': 'transparent', 'color': 'white' });
                var y = parseInt(yearBox[0].value, 10);
                var m = monthBox[0][monthBox[0].selectedIndex].value;
                var d = dateBox[0][dateBox[0].selectedIndex].value;
                if (m === 0 || isNaN(m)) {
                    m = undefined;
                } else {
                    m = m - 1;
                }
                if (d === 0 || isNaN(d)) {
                    d = undefined;
                }
                if (y === '' || isNaN(y)) {
                    m = undefined;
                    d = undefined;
                    y = undefined;
                }
                selectedDate = {
                    year: y,
                    month: m,
                    day: d,
                };
            }

            date.change(dateChangedEvent);
            month.change(dateChangedEvent);
            year.change(dateChangedEvent);

            return bdp;
        }

        function makeMap() {
            Microsoft.Maps.loadModule('Microsoft.Maps.Map', {
                callback: initMap
            });

            //Define custom properties for the pushpin class.
            Microsoft.Maps.Pushpin.prototype.date = null;
            Microsoft.Maps.Pushpin.prototype.location = null;
            Microsoft.Maps.Pushpin.prototype.description = null;

            function initMap() {
                var mapOptions = {
                    credentials: credentials,
                    mapTypeID: Microsoft.Maps.MapTypeId.road,
                    showScalebar: true,
                    enableClickableLogo: false,
                    enableSearchLogo: false,
                    showDashboard: false,
                    showMapTypeSelector: false,
                    zoom: 2,
                    center: new Microsoft.Maps.Location(20, 0)
                };
                var viewOptions = {
                    mapTypeId: Microsoft.Maps.MapTypeId.road
                };

                map = new Microsoft.Maps.Map(document.getElementById('mapDiv'), mapOptions);

                customInfobox = new CustomInfobox(map, {
                    color: 'rgba(0,0,0,0.65)',
                    arrowColor: 'rgba(0,0,0,0.65)',
                    closeButtonStyle: 'position:absolute;right:5px;top:2px;cursor:pointer;font:40px Arial;line-height:24px;color:white;'
                });

                map.setView(viewOptions);
                locationList = TAG.Util.UI.getLocationList(artwork.Metadata);
                drawLocationList();
            }
        }

        //geocode methods
        //searching with string query
        function makeGeocodeStringRequest() {
            clearResults();
            var geocodeRequest = "http://dev.virtualearth.net/REST/v1/Locations?query=" + encodeURI(searchBox.val()) + "&output=json&key=" + credentials;
            WinJS.xhr({
                url: geocodeRequest
            }).done(function (result) { // was called 'complete'
                geocodeStringCallback(result);
            },
            function (err) { // was called 'error'
            },
            function (result) { // was called 'progress'
                console.log(result.readystate);
            });
        }
        function geocodeStringCallback(result) {
            result = JSON.parse(result.responseText);
            //checks if results is undefined
            if (result && result.resourceSets && result.resourceSets.length > 0 && result.resourceSets[0].resources && result.resourceSets[0].resources.length > 0) {
                //sets view to first result
                var first = result.resourceSets[0].resources[0];
                //set bounding box
                var bbox = first.bbox;

                var viewBoundaries = Microsoft.Maps.LocationRect.fromLocations(
                    new Microsoft.Maps.Location(bbox[0], bbox[1]),
                    new Microsoft.Maps.Location(bbox[2], bbox[3])
                );
                map.setView({ bounds: viewBoundaries });

                //add a pushpin at the first location
                var location = new Microsoft.Maps.Location(first.point.coordinates[0], first.point.coordinates[1]);
                var pushpinOptions = {
                    icon: '/images/icons/locationPin.png',
                    width: 20,
                    height: 30
                };
                var pushpin = new Microsoft.Maps.Pushpin(location, pushpinOptions);
                map.entities.push(pushpin);

                for (var i = 0; i < result.resourceSets[0].resources.length; i++) {
                    addresults(result.resourceSets[0].resources[i]);
                }
            }
        }

        //add a pushpin as user clicks the map
        function addPushpinOntouch(e) {
            if (e.targetType == "map") {
                // hide help text
                helpBox.hide();

                //Get map unit x,y
                var point = new Microsoft.Maps.Point(e.getX(), e.getY());

                //Convert map point to location
                var location = e.target.tryPixelToLocation(point);

                //Print x y
                map.entities.clear();
                customInfobox.hide();
                clearResults();
                var pushpinOptions = {
                    draggable: true,
                    icon: '/images/icons/locationPin.png',
                    width: 20,
                    height: 30
                };
                var startLocation = map.getCenter();
                var pushpin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(location.latitude, location.longitude), pushpinOptions);
                Microsoft.Maps.Events.addHandler(pushpin, 'dragend', function (e) {
                    makeGeocodePointRequest(pushpin.getLocation());
                });
                selectedPoint = new Microsoft.Maps.Location(location.latitude, location.longitude);
                map.entities.push(pushpin);
                makeGeocodePointRequest(pushpin.getLocation());
            }
        }

        function makeGeocodePointRequest(location) {
            clearResults();
            var lat = location.latitude;
            var long = location.longitude;
            var geocodeRequest = "http://dev.virtualearth.net/REST/v1/Locations/" + lat + "," + long + "?" + "output=json&key=" + credentials;
            WinJS.xhr({ // TODO use $.ajax instead (with success handler rather than a .then callback)
                url: geocodeRequest
            }).then(GeocodePointCallback);
        }
        function GeocodePointCallback(result) {
            result = JSON.parse(result.responseText);
            for (var i = 0; i < result.resourceSets[0].resources.length; i++) {
                addresults(result.resourceSets[0].resources[i]);
            }
            if (result.resourceSets[0].resources.length !== 0) {
                createCustomAddressButton(result.resourceSets[0].resources[0]);
            } else {
                createCustomAddressButton(selectedPoint);
            }
        }

        //Search results manipulation methods
        function clearResults() {
            $('div.results').detach();
            selectedAddress = undefined;
            selectedLocResource = undefined;
        }

        function addresults(resource) {
            helpBox.fadeOut('fast');
            var result = $(document.createElement('div'));
            var text = resource.address.formattedAddress;
            var unselectedCSS = {
                'background-color': 'transparent',
                'color': 'white',
            };
            var selectedCSS = {
                'background-color': 'white',
                'color': 'black',
            };
            result.addClass('results');
            var resultConstraints = TAG.Util.constrainAndPosition(resultsBox.width(), resultsBox.height(), {
                width: 1,
                height: 0.14,
                max_height: 40,
            });
            var resultFontSize = TAG.Util.getMaxFontSizeEM(text, 0.5, resultConstraints.width * 0.95, resultConstraints.height * 0.95, 0.01);
            result.css({
                'color': 'white',
                width: resultConstraints.width + 'px',
                height: resultConstraints.height + 'px',
                'margin': '0 0 0.375% 0',
                'padding': '1% 1.5%',
                'font-size': resultFontSize,
                'position': 'relative',
                'overflow': 'hidden',
            });
            result.text(text);
            result.hover(function () {
                if (result[0].style.color === 'white') { // if text is white then box is unselected
                    result.css({
                        'background-color': 'rgba(50, 50, 50, 0.65)',
                    });
                }
            }, function () {
                if (result[0].style.color === 'white') {
                    result.css({
                        'background-color': 'transparent',
                    });
                }
            });
            result.click(resource, function (e) {
                $('div.results').css(unselectedCSS);
                $(this).css(selectedCSS);
                var bbox = e.data.bbox;
                var viewBoundaries = Microsoft.Maps.LocationRect.fromLocations(
                    new Microsoft.Maps.Location(bbox[0], bbox[1]),
                    new Microsoft.Maps.Location(bbox[2], bbox[3])
                );
                map.setView({ bounds: viewBoundaries });
                map.entities.clear();

                var location = new Microsoft.Maps.Location(resource.point.coordinates[0], resource.point.coordinates[1]);
                var pushpinOptions = {
                    icon: '/images/icons/locationPin.png',
                    width: 20,
                    height: 30
                };
                var pushpin = new Microsoft.Maps.Pushpin(location, pushpinOptions);
                map.entities.push(pushpin);

                selectedLocResource = e.data;
                selectedAddress = e.data.address.formattedAddress;
            });
            resultsBox.append(result);
        }

        function createCustomAddressButton(resource) {
            var customResult = $(document.createElement('div'));
            var text = $(document.createElement('div'));
            var save = $(document.createElement('button'));
            var customInput = $(document.createElement('input'));
            text.text('Add Custom Address');
            save.text('Save');
            var unselectedCSS = {
                'background-color': 'transparent',
                'color': 'white',
            };

            var selectedCSS = {
                'background-color': 'white',
                'color': 'black',
            };
            customResult.addClass('results');

            var customResultConstraints = TAG.Util.constrainAndPosition(resultsBox.width(), resultsBox.height(), {
                width: 1,
                height: 0.14,
                max_height: 40,
            });
            var customResultFontSize = TAG.Util.getMaxFontSizeEM(text.text(), 0.5, customResultConstraints.width * 0.95, customResultConstraints.height * 0.95, 0.01);
            customResult.css({
                'color': 'white',
                width: customResultConstraints.width + 'px',
                height: customResultConstraints.height + 'px',
                'margin': '0 0 0 0',
                'padding': '1% 1.5%',
                'font-size': customResultFontSize,
                'position': 'relative',
                'overflow': 'hidden',
            });
            customInput.addClass('customInput');
            customInput.css({
                display: 'none',
                'height': '100%',
                width: '50%',
                float: 'left',
                border: '0px',
            });
            save.css({
                display: 'none',
                'margin-left': '2%',
                'float': 'left',
                'font-size': '85%',
                'margin-top': '-0.5%',
            });
            text.click(function () {
                $('div.results').css(unselectedCSS);
                text.hide();
                customInput.fadeIn();
                save.fadeIn();
                selectedLocResource = resource;
            });
            customResult.hover(function () {
                if (customResult[0].style.color === 'white') { // if text is white then box is unselected
                    customResult.css({
                        'background-color': 'rgba(50, 50, 50, 0.65)',
                    });
                }
            }, function () {
                if (customResult[0].style.color === 'white') {
                    customResult.css({
                        'background-color': 'transparent',
                    });
                }
            });

            //make the input box and save button disappear when other results are clicked
            $('div.results').click(function (event) {
                if ($(event.target) !== customResult) {
                    customInput.hide();
                    save.hide();
                    text.fadeIn();
                }
            });
            save.click(resource, function (e) {
                e.stopPropagation();
                text.text(customInput.val());
                customInput.fadeOut('fast');
                save.fadeOut('fast', function () {
                    customResult.append(text);
                });
                selectedLocResource = e.data;
                selectedAddress = customInput.val();
                customResult.css(selectedCSS);
                customResult.click(resource, function (evt) {
                    $('div.results').css(unselectedCSS);
                    customResult.css(selectedCSS);
                    selectedAddress = customInput.val();
                    selectedLocResource = evt.data;
                });
                text.fadeIn();
                text.unbind('click');
            });
            customResult.append(text);
            customResult.append(customInput);
            customResult.append(save);
            resultsBox.append(customResult);
        }

        //Called when a location is selected to be added to the artwork. Creates and populates an LocObject that is eventually pushed into the locationList object
        function addLocation(confirmNewLocation) { //takes in confirm button
            confirmNewLocation.text('Saving...');
            confirmNewLocation.attr('disabled', 'true');

            if (!selectedLocResource) {
                console.log('no location selected');
                //confirmBubble.fadeIn(200, function () {
                //    setTimeout(function () { confirmBubble.fadeOut(); }, 1000);
                //});
                return false;
            }
            var newYear = parseInt(yearBox[0].value, 10);
            var newMonth = parseInt(monthBox[0][monthBox[0].selectedIndex].value, 10) - 1
            var newDay = parseInt(dateBox[0][dateBox[0].selectedIndex].value, 10);
            if (newMonth < 0 || isNaN(newMonth)) {
                newMonth = undefined;
            }
            if (newDay === 0 || isNaN(newDay)) {
                newDay = undefined;
            }
            if (newYear === '' || isNaN(newYear)) {
                newYear = undefined;
                newDay = undefined;
                newMonth = undefined;
            }
            selectedDate = {
                year: newYear,
                month: newMonth,
                day: newDay,
            }
            var locs = new LocObject(selectedLocResource, selectedAddress, selectedDate, unsavedDescription);
            locationList.push(locs);
            var newLocation = TAG.Util.UI.addPushpinToLoc(locs, locationList.length);
            drawLocationList();
            selectedDate = undefined;
            selectedLocResource = undefined;
            selectedAddress = undefined;
            unsavedDescription = undefined;

            TAG.Worktop.Database.changeArtwork(artwork.Identifier, {
                Location: JSON.stringify(locationList)
            }, saveSuccess, saveFail, conflict, saveError);

            // success handler for save button
            function saveSuccess() {
                confirmNewLocation.text('Confirm');
                confirmNewLocation[0].removeAttribute('disabled');
            }

            // general failure callback for save button
            function saveFail() {
                popup = $(TAG.Util.UI.popUpMessage(null, "Changes have not been saved.  You must log in to save changes."));
                $('body').append(popup);
                popup.show();
                confirmNewLocation.text('Confirm');
                confirmNewLocation[0].removeAttribute('disabled');
                return false;
            }

            // error handler for save button
            function saveError() {
                var popup;
                popup = $(TAG.Util.UI.popUpMessage(null, "Changes have not been saved.  There was an error contacting the server."));
                $('body').append(popup); // TODO ('body' might not be quite right in web app)
                popup.show();
                confirmNewLocation.text('Confirm');
                confirmNewLocation[0].removeAttribute('disabled');
                return false;
            }

            return true;
        }

        // date comparison function
        function compareDates(a, b, phase) {
            phase = phase || 1;
            var aComp, bComp;
            if (!a.date || !b.date) {
                return 1;
            }
            switch (phase) {
                case 1:
                    aComp = a.date.year;
                    bComp = b.date.year;
                    break;

                case 2:
                    aComp = a.date.month;
                    bComp = b.date.month;
                    break;

                case 3:
                    aComp = a.date.day;
                    bComp = b.date.day;
                    break;
            }

            if (aComp) {
                if (bComp) {
                    if (bComp === aComp) {
                        if (phase === 3) {
                            return 0;
                        } else {
                            phase++;
                            return compareDates(a, b, phase);
                        }
                    } else {
                        return aComp - bComp;
                    }
                } else {
                    return 1;
                }
            } else if (bComp) {
                return 1
            } else {
                return -1;
            }
        }

        function displayInfobox(loc) {
            var pushpin = loc.pushpin;
            var latlong = pushpin._location;

            //make locationInfobox, popup that shows location information
            //This section has to be reproduced every time because dynamic text cannot be passed into the customInfobox.js effectively. 
            //Only initializing once and passing that object over would result in deletion of the children, 
            //and passing clones does not pass event handlers, etc.
            locationInfo = $(document.createElement('div'));
            locationInfo.attr('class', 'locationInfo');
            locationInfo.attr('id', 'locationInfo');
            locationInfo.css({
                'padding': '0px',
                'background-color': 'rgba(255,255,255,0)',
                'border-radius': '10px',
                'min-width': '250px',
                'max-width': '450px',
                'position': 'relative',
                'float': 'left'
            });

            var textAreaCSS = {
                'border': '2px solid Gray',
                'margin-bottom': '3%',
                'width': '100%',
                'float': 'left'
            };


            var dateEditor;
            if (loc.date && loc.date.year) { //If there is a valid year, initialize the datepicker with those values
                dateEditor = createBasicDatePicker(loc.date.day, loc.date.month, loc.date.year); //date picker for editing the location's date
            } else {
                dateEditor = createBasicDatePicker(); //date picker for editing the location's date
            }

            dateEditor.css({ 'margin-bottom': '3%' });

            locationTextArea = $(document.createElement('input'));
            locationTextArea.attr('placeholder', 'Location');
            locationTextArea.attr('id', 'locationTextArea');
            locationTextArea.css(textAreaCSS);

            descriptionTextArea = $(document.createElement('textarea'));
            descriptionTextArea.attr('id', 'descriptionTextArea');
            descriptionTextArea.attr('placeholder', 'Description');
            descriptionTextArea.attr('rows', '4');
            descriptionTextArea.css(textAreaCSS);
            descriptionTextArea.css({
                'padding': '0px 1px 0px 1px',
                'margin-top': '0px',
                'background-color': 'white'
            });

            var saveButton = $(document.createElement('button'));
            saveButton.addClass('addButton');
            saveButton.text('Save');
            saveButton.css({
                'color': 'white',
                'border': '2px solid white',
                'padding': '1%',
                'position': 'relative',
                'float': 'right',
                'left': '4px'
            });
            saveButton.click(function () {
                // same logic as datePickerEvent, REFACTORING!!!
                var y = parseInt(dateEditor[0].childNodes[2].value, 10);
                var m = parseInt(dateEditor[0].childNodes[1].value, 10) - 1;
                var d = parseInt(dateEditor[0].childNodes[0].value, 10);
                if (y === '' || isNaN(y)) {
                    y = undefined;
                    m = 0;
                    d = 0;
                }
                if (m < 0 || isNaN(m)) {
                    m = undefined;
                }
                if (d === 0 || isNaN(d)) {
                    d = undefined;
                }
                loc.date = {
                    year: y,
                    month: m,
                    day: d,
                };
                currentLocation.date = {
                    year: y,
                    month: m,
                    day: d,
                };
                currentLocation.address = locationTextArea.val();
                currentLocation.info = descriptionTextArea.val();
                drawLocationList(); //redraw the locations list
            });

            $(locationInfo).append(dateEditor);
            $(locationInfo).append(locationTextArea);
            $(locationInfo).append(descriptionTextArea);
            $(locationInfo).append(saveButton);

            locationTextArea.attr('value', currentLocation.address);
            descriptionTextArea.attr('value', currentLocation.info);

            //Display Infobox
            customInfobox.show(latlong, locationInfo);
        }

        function toggleInfobox(e) {
            if (!customInfobox.visible()) {
                displayInfobox(e);
            } else {
                customInfobox.hide();
            }
        }

        //Clears values in the datepicker
        function clearDatePicker(obj) {
            obj[0].childNodes[0].selectedIndex = 0; //reset date
            obj[0].childNodes[1].selectedIndex = 0; //reset month
            obj[0].childNodes[2].value = ''; //reset year
        }

        //Location Object, probably should be replaced with
        //something from the server //does this comment still apply? - yudi
        function LocObject(locResource, address, date, info) {
            this.resource = locResource;
            this.date = date;
            this.info = info;
            this.address = address;
            this.pushpin = null;
        }

        function init() {
            var locationPanel,
                bottomDiv,
                leftDiv,
                rightDiv,
                leftRow1,
                searchButton,
                mapDetectTimer,
                monthtext = ['January', 'Feburary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                monthOption,
                dateOption,
                nullOption,
                spacingCSS,
                datepickerCSS,
                datePickerBox,
                dateLabel,
                leftRow3,
                leftRow2,
                addDescripButton,
                editDescriptionBox,
                textAreaCSS,
                descriptionText,
                cancelButton,
                saveButton,
                i;

            locationPanelDiv = $(document.createElement('div'));
            locationPanelDiv.addClass('locationPanelDiv');
            locationPanelDiv.css({
                position: 'absolute',
                top: '10%',
                left: '20%',
                width: '100%',
                height: '85%',
                display: 'none',
                'z-index': '51'
            });
            $(root).append(locationPanelDiv);

            locationPanel = $(document.createElement('div'));
            locationPanel.addClass('locationPanel');
            locationPanel.css({
                width: '70%',
                height: '90%',
                'z-indez': 99,
                'background-color': 'rgba(0,0,0,0.85);',
                'padding': '2% 2%',
            });
            locationPanelDiv.append(locationPanel);

            mapDiv = $(document.createElement('div'));
            mapDiv.addClass('mapDiv');
            mapDiv.attr('id', 'mapDiv');
            mapDiv.css({
                position: 'relative',
                width: '100%',
                height: '50%',
            });
            locationPanel.append(mapDiv);

            bottomDiv = $(document.createElement('div')); // area below the map with all the locations
            bottomDiv.addClass('bottomDiv');
            bottomDiv.css({
                position: 'relative',
                height: '50%',
                width: '100%',
                'margin-top': '1.5%'
            });
            locationPanel.append(bottomDiv);

            leftDiv = $(document.createElement('div')); // left side of the bottom area
            leftDiv.addClass('leftDiv');
            leftDiv.css({
                position: 'relative',
                height: '100%',
                width: '69%',
                'margin-right': '1%',
            });
            bottomDiv.append(leftDiv);

            addLocationDiv = $(document.createElement('div')); // div where user searches for locations and adds them, hidden until 'add location' button is pressed
            addLocationDiv.addClass('addLocationDiv');
            addLocationDiv.css({
                position: 'relative',
                height: '100%',
                width: '100%',
                display: 'none'
            });
            leftDiv.append(addLocationDiv);

            rightDiv = $(document.createElement('div')); // right side of the bottom area, containing all the existing locations of the artwork
            rightDiv.addClass('rightDiv');
            rightDiv.css({
                position: 'absolute',
                height: '100%',
                width: '29%',
                top: 0,
                right: 0,
            });
            bottomDiv.append(rightDiv);

            leftRow1 = $(document.createElement('div')); // search bar and search button
            leftRow1.addClass('leftRow1');
            addLocationDiv.append(leftRow1);

            searchBox = $(document.createElement('input'));
            searchBox.attr('type', 'text');
            searchBox.attr('placeholder', 'Search...');
            searchBox.css({
                width: '70%',
                'margin': '0px',
            });
            leftRow1.append(searchBox);

            searchButton = $(document.createElement('button'));
            searchButton.text('Search');
            searchButton.css({
                'max-width': '25%',
                float: 'right',
            });
            leftRow1.append(searchButton);

            leftRow2 = $(document.createElement('div'));
            leftRow2.addClass('leftRow2');
            leftRow2.css({
                position: 'relative',
                height: '60%',
                'overflow-y': 'hidden',
                'overflow-x': 'hidden',
                margin: '2% 0%'
            });
            addLocationDiv.append(leftRow2);

            helpBox = $(document.createElement('div'));
            helpBox.addClass('helpBox');
            helpBox.css({
                position: 'absolute',
                top: 0,
                left: 0,
                height: '70%',
                'text-align': 'center',
                'font-size': '100%',
                'color': 'white',
                'width': '100%'
            });
            helpBox.text(helpText);
            leftRow2.append(helpBox);

            resultsBox = $(document.createElement('div'));
            resultsBox.addClass('resultsBox');
            resultsBox.css({
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '90%',
                'overflow-y': 'auto',
                'overflow-x': 'hidden',
            });
            leftRow2.append(resultsBox);

            leftRow3 = $(document.createElement('div')); // datepicker and confirm/cancel buttons
            leftRow3.addClass('leftRow3');
            leftRow3.css({
                position: 'relative',
                bottom: '7.5%',
                width: '100%'
            });
            addLocationDiv.append(leftRow3);

            dateLabel = $(document.createElement('div'));
            dateLabel.text('Date');
            dateLabel.css({
                'color': 'white',
                'font-size': '100%'
            });
            leftRow3.append(dateLabel);

            datePickerBox = $(document.createElement('div'));

            datePicker = $(document.createElement('div'));
            datePicker.css({
                'width': '100%',
                float: 'left'
            });
            dateBox = $(document.createElement('select'));
            monthBox = $(document.createElement('select'));
            yearBox = $(document.createElement('input'));
            yearBox.attr("maxlength", 15);

            datepickerCSS = { // widths are hardcoded because typical entry lengths are fixed
                'width': '120px',
                'margin-right': '0.5%',
                'font-size': '95%'
            };
            dateBox.css(datepickerCSS);
            dateBox.css({
                'width': '65px',
            });
            monthBox.css(datepickerCSS);

            yearBox.css({  // to accomodate "B.C." pre/post year entry, change to 75px
                'font-size': '95%',
                'width': '50px',
            });

            nullOption = $(document.createElement('option')).html('---').attr('value', -1);
            spacingCSS = { 'margin-right': '.5%' };

            dateBox.addClass("datePicker dateBox");
            monthBox.addClass("datePicker monthBox");
            yearBox.addClass("datePicker yearBox");
            yearBox.attr('id', 'yearBox');

            datePicker.append(dateBox).append(monthBox).append(yearBox);
            datePickerBox.append(datePicker);

            leftRow3.append(datePickerBox);

            dateBox.append(nullOption.clone().attr('value', 0));
            monthBox.append(nullOption.clone().attr('value', 0));

            for (i = 0; i < 31; i++) {
                dateOption = $(document.createElement('option'));
                dateOption.html(i + 1);
                dateOption.attr('value', i + 1);
                dateBox.append(dateOption);
            }
            for (i = 0; i < 12; i++) {
                monthOption = $(document.createElement('option'));
                monthOption.html(monthtext[i]);
                monthOption.attr('value', i + 1);
                monthBox.append(monthOption);
            }

            addDescripButton = $(document.createElement('button'));
            addDescripButton.css({
                'margin-left': '1.5%',
                'margin-top': '1%',
                'min-width': '0px',
                'min-height': '0px',
                'width': '22%',
                'font-size': '100%'
            });
            addDescripButton.text("Edit Description");
            datePicker.append(addDescripButton);

            editDescriptionBox = $(document.createElement('div'));
            locationPanel.append(editDescriptionBox);
            editDescriptionBox.css({
                'background-color': 'rgba(0, 0, 0, 0.85)',
                'width': '30%',
                'height': '18%',
                'position': 'absolute',
                'bottom': '16%',
                'left': '25%'
            });

            textAreaCSS = {
                'border': '2px solid Gray',
                'margin-bottom': '3%',
                'width': '100%',
                'float': 'left'
            };

            descriptionText = $(document.createElement('textarea'));
            editDescriptionBox.append(descriptionText);
            descriptionText.attr('id', 'descriptionText');
            descriptionText.attr('placeholder', 'Description');
            descriptionText.attr('rows', '5');
            descriptionText.css(textAreaCSS);
            descriptionText.css({
                'padding': '0px 1px 0px 1px',
                'margin-top': '0px',
                'background-color': 'white',
                'position': 'absolute',
                'width': '89%',
                'left': '5%',
                'top': '20px'
            });

            cancelButton = $(document.createElement('button')); // really generic name for the cancel button for location history descriptions...
            cancelButton.addClass('cancelEditDescButton');
            cancelButton.text('Cancel');
            cancelButton.css({
                'color': 'white',
                'border': '2px solid white',
                'position': 'absolute',
                'width': '15%',
                'bottom': '9.5%',
                'left': '5%',
                'height': '10%'
            });
            editDescriptionBox.append(cancelButton);

            saveButton = $(document.createElement('button'));// really generic name for the save button for location history descriptions...
            saveButton.addClass('saveDescButton');
            saveButton.text('Save');
            saveButton.css({
                'color': 'white',
                'border': '2px solid white',
                'position': 'absolute',
                'width': '15%',
                'bottom': '9.5%',
                'right': '5%',
                'height': '10%'
            });
            editDescriptionBox.append(saveButton);
            editDescriptionBox.hide();

            // set interval to check whether mapDiv is inserted in DOM
            mapDetectTimer = setInterval(function () {
                if ($('#mapDiv').length > 0) {
                    makeMap();
                    clearInterval(mapDetectTimer);
                }
            }, 300);

            // when the search button is clicked; show help message or run search
            searchButton.on('click', function () {
                if (searchBox[0].value === '') {
                    TAG.Util.UI.drawPushpins(locationList, map);
                    clearResults();
                    //helpboxAlert('Please type in the search bar');
                } else {
                    map.entities.clear();
                    customInfobox.hide();
                    helpBox.fadeOut('fast');
                    makeGeocodeStringRequest();
                }
            });

            /**
             * Triggered every time the datepicker has changed, resets the selected date
             * @method datePickerEvent
             */
            function datePickerEvent() {
                var y = parseInt(yearBox[0].value, 10),
                    m = parseInt(monthBox[0][monthBox[0].selectedIndex].value, 10) - 1,
                    d = parseInt(dateBox[0][dateBox[0].selectedIndex].value, 10);

                $('div.results').css({ 'background-color': 'transparent', 'color': 'white' });

                if (m < 0 || isNaN(m)) {
                    m = null;
                }
                if (d <= 0 || isNaN(d)) {
                    d = null;
                }
                if (isNaN(y)) {
                    m = null;
                    d = null;
                    y = null;
                }
                selectedDate = {
                    year: y,
                    month: m,
                    day: d,
                };
            }

            // set up some event handlers for changing drop-downs
            dateBox.on('change', datePickerEvent);
            monthBox.on('change', datePickerEvent);
            yearBox.on('change', datePickerEvent);

            // this is the location history description cancel button
            cancelButton.on('click', function () {
                unsavedDescription && descriptionText.val(unsavedDescription);
                editingDescription = false;
                editDescriptionBox.hide();
            });

            // location history description save button
            saveButton.on('click', function () {
                unsavedDescription = descriptionText.val();
                editingDescription = false;
                editDescriptionBox.hide();
            });

            // TODO scrap this
            addDescripButton.on('click', function () {
                var descrBoxConstraints,
                    descriptionTextConstraints;
                editingDescription = !editingDescription;
                if (editingDescription) {
                    descrBoxConstraints = TAG.Util.constrainAndPosition(locationPanel.width(), locationPanel.height(), {
                        width: 0.5,
                        height: 0.35,
                        max_width: 768,
                        max_height: 192
                    });

                    editDescriptionBox.css({
                        'width': descrBoxConstraints.width + 'px',
                        'height': descrBoxConstraints.height + 'px'
                    });

                    descriptionTextConstraints = TAG.Util.constrainAndPosition(editDescriptionBox.width(), editDescriptionBox.height(), {
                        center_h: true,
                        width: 0.9,
                        x_offset: 0.05,
                        y_offset: 0.12,
                        y_max_offset: 25
                    });
                    descriptionText.css({
                        'top': descriptionTextConstraints.y + 'px',
                        'left': descriptionTextConstraints.x - 2 + 'px',
                        'width': descriptionTextConstraints.width + 'px'
                    });
                    editDescriptionBox.show();

                    descriptionText.attr('value', "");
                } else {
                    editDescriptionBox.hide();
                }
            });

            // cancel button to hide addLocationDiv
            var cancelNewLocation = $(document.createElement('button'));
            cancelNewLocation.css({
                position: 'absolute',
                right: "16.5%",
                'margin-top': '1%',
                'min-width': '0px',
                'min-height': '0px',
                'width': '12%',
                'font-size': '100%'
            });
            cancelNewLocation.text('Cancel');
            cancelNewLocation.click(function (e) {
                selectedLocResource = undefined;
                selectedAddress = undefined;
                unsavedDescription = undefined;
                selectedDate = undefined;
                addLocationDiv.hide('blind');
                addLocButton.show();
                TAG.Util.UI.drawPushpins(locationList, map);
                Microsoft.Maps.Events.removeHandler(mapAttachClick);
                clearDatePicker(datePicker);
            });
            datePicker.append(cancelNewLocation);

            // confirm button to add selected location
            var confirmNewLocation = $(document.createElement('button'));
            confirmNewLocation.css({
                position: 'absolute',
                right: '0%',
                'margin-top': '1%',
                'min-width': '0px',
                'min-height': '0px',
                'width': '15%',
                'font-size': '100%'
            });
            confirmNewLocation.text('Confirm');
            confirmNewLocation.click(function (e) {
                
                if (!addLocation(confirmNewLocation)) {
                    return;
                }

                editDescriptionBox.hide();
                addLocationDiv.hide('blind');
                addLocButton.show();
                TAG.Util.UI.drawPushpins(locationList, map);
                Microsoft.Maps.Events.removeHandler(mapAttachClick);
                clearDatePicker(datePicker);
            });
            datePicker.append(confirmNewLocation);

            //popup bubble warning the user that a location has not been selected when confirm is pressed
            confirmBubble = $(document.createElement('div'));
            confirmBubble.attr('class', 'confirmBubble');
            confirmBubble.css({
                'padding': '4% 4%',
                'left': '63%',
                'margin-bottom': '4%',
                'top': '-150%',
                'position': 'absolute',
                'background-color': 'rgba(255,255,255,.6)',
                'border-radius': '10px',
                'z-index': '2',
                'font-weight': 'bold',
                'text-align': 'center'
            });
            confirmBubble.html('Please select a valid location');

            var confirmBubbleTriangle = $(document.createElement('div'));
            confirmBubbleTriangle.attr('class', 'confirmBubbleTriangle');
            confirmBubbleTriangle.css({
                'position': 'absolute',
                'top': '100%',
                'left': '40%',
                'width': 0,
                'border-style': 'solid',
                'border-width': '20px',
                'border-color': 'rgba(255,255,255,.6) transparent transparent transparent',
            });
            confirmBubble.append(confirmBubbleTriangle);
            leftRow3.append(confirmBubble);
            confirmBubble.hide();

            // 'Add Location' button that shows the addLocationDiv
            addLocButton = $(document.createElement('button'));
            addLocButton.css({
                position: 'absolute',
                float: 'left',
                'min-width': '0px',
                'min-height': '0px'
            });

            addLocButton.text('Add Location');
            mapAttachClick = null;
            addLocButton.click(function (e) {
                helpBox.show();
                searchBox.val('');
                clearResults();
                helpBox.fadeIn();
                TAG.Util.fitText(helpBox, 3.5); ///////////////////
                addLocationDiv.show('blind');
                mapAttachClick = Microsoft.Maps.Events.addHandler(map, 'rightclick', addPushpinOntouch);
                addLocButton.hide();
            });
            leftDiv.append(addLocButton);

            // Locations title
            var locationsTitle = $(document.createElement('div'));
            locationsTitle.addClass('locationsTitle');
            locationsTitle.text('Locations');
            locationsTitle.css({
                color: 'white',
                'font-size': '185%',
                'position': 'relative',
                'top': '-0.75%',
            });
            rightDiv.append(locationsTitle);

            // Div where all locations will be appended
            locationsDiv = $(document.createElement('div'));
            locationsDiv.addClass("listOfLocations");
            locationsDiv.css({
                position: 'relative',
                height: '80%',
                'overflow-y': 'auto',
                'overflow-x': 'hidden',
            });
            rightDiv.append(locationsDiv);
        }

        function open() {
            localStorage.locationHistory = true;
            var connectivityCheck = navigator.onLine; //check if there is internet
            var msgDiv = TAG.Util.UI.popUpMessage(null, "No internet connection was detected. Bing Maps requires internet connectivity. Please ensure that you are connected to the internet and try again.", null, true);
            if (connectivityCheck === false) {
                root.append(msgDiv);
                $(msgDiv).show();
            } else {
                if (!isOpen) {
                    closeAllPanels();
                    MEDIA_EDITOR.close();
                    editLocButton.css({ 'background-color': 'white', 'color': 'black' });
                    rightArrowEditLoc.attr('src', '/images/icons/RightB.png');
                    sidebarHideButtonContainer.hide();
                    locationPanelDiv.show("slide", { direction: 'left' }, 500);
                    locationPanelDiv.css({ display: 'inline' });
                    drawLocationList();

                    isOpen = true;
                }
            }
        }

        function close() {
            if (isOpen) {
                editLocButton.css({ 'background-color': 'transparent', 'color': 'white' });
                rightArrowEditLoc.attr('src', '/images/icons/Right.png');
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
        var isOpen = false,
            editingMedia = false,
            hotspotAnchor,
            toggleHotspotButton,
            activeAssocMedia, // TODO in web app, this should be current assoc media object (of the type created by AnnotatedImage)
            isHotspot = false; // whether the current media is a hotspot

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
            .appendTo(hotspotAnchor);

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

            // TODO use makeManipulatable here for web app (and for win8 app... some dragging issues right now, though)
            TAG.Util.makeManipulatableWin(hotspotCircle.get(0), {
                onManipulate: function (res) {
                    var t = hotspotAnchor.css('top'),
                        l = hotspotAnchor.css('left');
                    hotspotAnchor.css("top", (parseInt(t, 10) + res.pivot.y - 20) + "px");
                    hotspotAnchor.css("left", (parseInt(l, 10) + res.pivot.x - 20) + "px");
                    zoomimage.updateOverlay(hotspotAnchor.get(0), Seadragon.OverlayPlacement.TOP_LEFT);
                }
            });

            hotspotAnchor.appendTo(root);
        }

        /**
         * Adds hotspot circle to canvas and pans to circle's location
         * @method toggleToHotspot
         * @param {Seadragon.Point} point       the point at which to add the hotspot circle (defaults to center of canvas)
         */
        function toggleToHotspot(point) {
            point = point || zoomimage.viewer.viewport.getCenter();

            var pixel = zoomimage.viewer.viewport.pixelFromPoint(point),
                pixel_adj = new Seadragon.Point(pixel.x + 50, pixel.y + 50),
                point_adj = zoomimage.viewer.viewport.pointFromPixel(pixel_adj);

            toggleHotspotButton.text('Remove Hotspot');
            zoomimage.addOverlayToDZ(hotspotAnchor[0], point_adj, Seadragon.OverlayPlacement.TOP_LEFT); // TODO see new AnnotatedImage; also, do we really want to be adding a new overlay each time? we only have one hotspot circle, so maybe just want to update the existing overlay
            zoomimage.viewer.viewport.panTo(new Seadragon.Point(point.x, point.y), false);
            hotspotAnchor.fadeIn(100);
            isHotspot = true;
        }

        /**
         * Removes hotspot from canvas
         * @method toggleFromHotspot
         */
        function toggleFromHotspot() {
            toggleHotspotButton.text('Add Hotspot');
            zoomimage.removeOverlay(hotspotAnchor[0]); // TODO check
            hotspotAnchor.fadeOut(100);
            isHotspot = false;
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
                src = media.Metadata.Source,
                type = media.Metadata.ContentType,
                thumbnail = (media.Metadata.Thumbnail && !media.Metadata.Thumbnail.match(/.mp4/)) ? TAG.Worktop.Database.fixPath(media.Metadata.Thumbnail) : '',
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
                dzPos = info.pos ? zoomimage.viewer.viewport.pointFromPixel(info.pos) : { x: 0, y: 0 },
                rightbarLoadingSave,
                options;

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

            TAG.Util.showLoading(rightbarLoadingSave, '20%');
            rightbarLoadingSave.attr('class', 'rightbarLoadingSave');

            options = {
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

            TAG.Worktop.Database.changeHotspot(worktopInfo.assetDoqID, options, updateSuccess, no_op, conflict, no_op);

            /**
             * Success callback for call to changeHotspot in updateAssocMedia;
             * reloads media list and hides editing pane
             * @method updateSuccess
             */
            function updateSuccess() {
                createMediaList();
                MEDIA_EDITOR.close();
                rightbarLoadingSave.fadeOut();
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
                        'font-size': '150%',
                        'float': 'left',
                        'position': 'relative',
                    })
                    .addClass('header')
                    .text('Edit Associated Media')
                    .appendTo($rightbar),
                $assocMediaContainer = $(document.createElement('div'))
                    .css({
                        'position': 'relative',
                        'margin': '15% 8%',
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
                $toggleHotspotContainer = $(document.createElement('div'))
                    .addClass('toggleHotspotContainer')
                    .css({
                        'width': '60%',
                        'left': '20%',
                        'position': 'relative',
                    })
                    .appendTo($rightbar),
                $toggleHotspot = $(document.createElement('button'))
                    .addClass('toggleHotspot')
                    .css({
                        'width': '100%',
                        'height': 'auto',
                        'border': '2px solid white',
                        'position': 'relative'
                    })
                    .attr('type', 'button')
                    .appendTo($toggleHotspotContainer),
                $titleContainer = $(document.createElement('div'))
                    .addClass('textareaContainer')
                    .css({
                        'width': '100%',
                        'padding': '5% 8%',
                        'margin-top': '5%',
                    })
                    .appendTo($rightbar),
                $titleText = $(document.createElement('input'))
                    .addClass('title')
                    .attr('placeholder', ' Title')
                    .attr('title', 'Title')
                    .css({
                        'width': '64%',
                        'font-size': '11pt'
                    })
                    .appendTo($titleContainer),
                $descContainer = $(document.createElement('div'))
                    .addClass('textareaContainer')
                    .css({
                        'width': '87%',
                        'height': '12%',
                        'position': 'relative',
                        'padding': '5% 8%'
                    })
                    .appendTo($rightbar),
                $descArea = $(document.createElement('textarea'))
                    .addClass('description')
                    .attr('placeholder', ' Description')
                    .css({
                        'background-color': 'white',
                        'width': '92.5%',
                        'min-width': '92.5%',
                        'height': '90%'
                    })
                    .appendTo($descContainer),
                $assocMediaButtonContainer = $(document.createElement('div'))
                    .addClass('buttoncontainer')
                    .css({
                        'width': '87%',
                        'padding': '5% 8%',
                        'position': 'relative'
                    })
                    .appendTo($rightbar),
                $deleteAssocMediaButton = $(document.createElement('button'))
                    .addClass('asscmediabutton deletebutton')
                    .text('Delete')
                    .css({
                        'float': 'left',
                        'border': '2px solid white',
                        'width': '45%'
                    })
                    .attr('type', 'button')
                    .appendTo($assocMediaButtonContainer),
                $saveAssocMediaButton = $(document.createElement('button'))
                    .addClass('asscmediabutton addbutton')
                    .text('Save')
                    .attr('type', 'button')
                    .css({
                        'float': 'right',
                        'border': '2px solid white',
                        'width': '45%'
                    })
                    .appendTo($assocMediaButtonContainer),
                closeButton = $(document.createElement('img'))
                    .attr('src', 'images/icons/x.svg')
                    .css({
                        'position': 'absolute',
                        'top': ($(window).height() - ($(window).height() * topbarHeight / 100)) * 0.95 - 15 + 'px',
                        'left': '8%',
                        'width': '11%',
                        'height': 'auto',
                    })
                    .appendTo($rightbar);

            makeHotspotAnchor();

            $toggleHotspot.on('click', function () {
                isHotspot ? toggleFromHotspot() : toggleToHotspot();
            });

            toggleHotspotButton = $toggleHotspot;

            $deleteAssocMediaButton.on('click', function () {
                var assetDoqID = getActiveMediaMetadata('assetDoqID'); // TODO see comment below about AnnotatedImage

                if (getActiveMediaMetadata('contentType') === 'Video') { // TODO when this file is better integrated with the new AnnotatedImage, should store the current active media in a 'global' variable and just access its contentType rather than going through a helper function
                    $('.rightbar').find('video')[0].pause();
                } else if (getActiveMediaMetadata('contentType') === 'Audio') {
                    $('.rightbar').find('audio')[0].pause();
                }

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
                TAG.Util.showLoading(rightbarLoadingDelete, '20%');

                // remove the associated media's linq to this artwork
                if (assetDoqID) {
                    TAG.Worktop.Database.changeArtwork(artwork.Identifier, { RemoveIDs: assetDoqID }, function () {
                        createMediaList();
                        MEDIA_EDITOR.close();
                        rightbarLoadingDelete.fadeOut();
                    }, function () {
                        console.log("error 1");
                    }, function () {
                        console.log("error 2");
                    }, function () {
                        console.log("error 3");
                    });
                } else {
                    createMediaList();
                    MEDIA_EDITOR.close();
                    rightbarLoadingDelete.fadeOut();
                }
            });

            $saveAssocMediaButton.on('click', function () {
                var titleTextVal,
                    assetType;

                $('.assetHolder').css('background-color', '');

                if (getActiveMediaMetadata('ContentType') === 'Video') { // TODO see comments in the delete button's click handler
                    $('.rightbar').find('video')[0].pause();
                } else if (getActiveMediaMetadata('ContentType') === 'Audio') { // TODO see comments in the delete button's click handler
                    $('.rightbar').find('audio')[0].pause();
                }

                titleTextVal = $titleText.val() || 'Untitled';

                assetType = isHotspot ? 'Hotspot' : 'Asset';

                updateAssocMedia({
                    title: TAG.Util.encodeXML(titleTextVal),
                    desc: TAG.Util.encodeXML($descArea.val()),
                    pos: isHotspot ? Seadragon.Utils.getElementPosition(hotspotAnchor.children().first().get(0)) : null, // TODO should store this html elt in a variable (in the function that makes the hotspot anchor) so people don't have to figure out what this means
                    contentType: activeAssocMedia.Metadata.ContentType,
                    contentUrl: TAG.Worktop.Database.fixPath(activeAssocMedia.Metadata.Source),
                    assetType: assetType,
                    metadata: {
                        assetDoqID: activeAssocMedia.Identifier
                    }
                });
            });

            closeButton.on('click', function () {
                if (getActiveMediaMetadata('contentType') === 'Video') { // TODO see comments above
                    $('.rightbar').find('video')[0].pause();
                } else if (getActiveMediaMetadata('contentType') === 'Audio') {
                    $('.rightbar').find('audio')[0].pause();
                }
                MEDIA_EDITOR.close();
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
            var editingMediamsg;
            if (editingMedia) {
                editingMediamsg = $(TAG.Util.UI.popUpMessage(null, "You are currently making changes. Please save or cancel before opening another media for editing.", "OK", false));
                root.append(editingMediamsg);
                editingMediamsg.show();
                return;
            }
            editingMedia = false;

            TAG.Worktop.Database.getLinq(artwork.Identifier, asset.Identifier, linqCallback, function () { }, function () { });

            /**
             * Helper function for showEditMedia, called when the linq between the
             * media and the artwork has been obtained
             * @method linqCallback
             * @param {linq} linq           a linq object (see github wiki for structure)
             */
            function linqCallback(linq) {
                var x = parseFloat(linq.Offset._x),
                    y = parseFloat(linq.Offset._y),
                    title = TAG.Util.htmlEntityDecode(asset.Name),
                    description = asset.Metadata.Description ? TAG.Util.htmlEntityDecode(asset.Metadata.Description).replace(/<br>/g, '\n') : '',
                    point,
                    oldtitle,
                    key,
                    oldDescription,
                    rightbar = $('.rightbar'); // TODO get this from JADE, store as a 'global' variable at top of file

                isHotspot = linq.Metadata.Type === "Hotspot";

                $('.assocMediaContainer').show();

                if (isHotspot) {
                    point = new Seadragon.Point(x, y);
                }

                toggleHotspotButton.text(isHotspot ? 'Remove Hotspot' : 'Add Hotspot');
                isHotspot ? toggleToHotspot(point) : toggleFromHotspot();

                rightbar.find('.assocmedia').html(content);
                rightbar.find('.title').val(title);
                rightbar.find('.description').val(description);

                rightbar.find('.title').on('keyup', function () {
                    editingMedia = true;
                });

                rightbar.find('.description').on('keyup', function () {
                    editingMedia = true;
                });

                if (!isOpen) {
                    rightbar.animate({ 'right': 0 }, 600);
                }

                for (key in asset.Metadata) { // TODO just use 'global' current assoc media object rather than doing this set/getActiveMediaMetadata business
                    if (asset.Metadata.hasOwnProperty(key)) {
                        setActiveMediaMetadata(key, asset.Metadata[key]);
                    }
                }
                setActiveMediaMetadata('assetDoqID', asset.Identifier);

                isOpen = true;
                activeAssocMedia = asset;

                callback && callback();
            }
        }

        /**
         * Closes the media editor.
         * @method close
         */
        function close() {
            var rightbar;
            if (isOpen) {
                rightbar = $('.rightbar');
                hotspotAnchor.fadeOut(100);
                rightbar.animate({ 'right': '-20%' }, 600);
                $('.assetHolder').css('background-color', '');
                editingMedia = false;
                isOpen = false;
            }
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
            createMediaWrapper: createMediaWrapper,
            isOpen: returnIsOpen
        };
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
            isAdditionalField ? fieldTitle.attr('value', field) : fieldTitle.text(field);

            fieldTitle.css({ // TODO STYL
                'display': 'inline-block',
                'color': isAdditionalField ? 'black' : 'white',
                'margin-right': '14px',
                'width': '15%',
                'text-align': 'right',
                'vertical-align': isAdditionalField ? '' : 'top',
                'padding-top': isAdditionalField ? '0px' : '5px',
                'overflow': 'auto',
                'border': "0px solid black",
            });

            if (isTextarea) {
                textarea.attr('rows', 3);
                textarea.css({ // TODO add a class, use textarea.classname vs input.classname in STYL
                    'overflow': 'auto',
                    'padding': '0px',
                    'background': 'white',
                    'border': "0px solid black",
                });
            }
            textarea.css({ // TODO STYL
                'width': '70%',
                'font-size': '11pt',
                'display': 'inline-block',
                'border': "0px solid black",
            });
            textarea.attr('placeholder', field);

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
                deleteFieldIcon = $(document.createElement('img'));
                deleteFieldIcon.attr('src', 'images/icons/minus.svg');
                deleteFieldIcon.css({
                    'float': 'right',
                    'margin-right': '2%',
                    'width': '30px',
                    'height': '30px',
                    'display': 'inline-block'
                });
                deleteFieldIcon.bind("click", { Param1: field, }, function (event) {
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
            return $('.additionalField').length >= 2;
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
                'width': '38%',
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
            addInfoButton.text('Add Information Field'); // TODO JADE/STYL
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
            saveMetadataButton.text('Save Changes');
            saveMetadataButton.attr('type', 'button');
            saveMetadataButton.css({
                'left': '10%',
                'width': '80%',
                'margin-top': '2%',
                'margin-bottom': '3%',
                'position': 'relative'
            });
            metadataForm.append(saveMetadataButton);

            createMetadataTextArea({ field: 'Title', entry: artwork.Name }); // TODO a lot of this can be factored to J/S
            createMetadataTextArea({ field: 'Artist', entry: artwork.Metadata.Artist });
            createMetadataTextArea({ field: 'Year', entry: artwork.Metadata.Year });
            createMetadataTextArea({ field: 'Description', entry: artwork.Metadata.Description, isTextarea: true });
            createCustomFields();

            if (shouldDisableAddButton()) {
                addInfoButton.attr('disabled', 'true');
            }

            addInfoButton.on('click', function () {
                createMetadataTextArea({ field: "new", entry: "metadata field", animate: true, isAdditionalField: true });
                if (shouldDisableAddButton()) {
                    addInfoButton.attr('disabled', 'disabled');
                }
            });

            saveMetadataButton.on('click', save);
        }

        /**
         * Save artwork metadata
         * @method save
         */
        function save() {
            var i,
                additionalFields = $('.additionalField'),
                infoFields = {};

            saveMetadataButton.text('Saving...');
            saveMetadataButton.attr('disabled', 'true');

            for (i = 0; i < additionalFields.length; i++) {
                infoFields[$(additionalFields[i]).attr("value")] = $(additionalFields[i]).attr('entry');
            }

            TAG.Worktop.Database.changeArtwork(artwork.Identifier, {
                Name: $(artworkMetadata.Title).val(),
                Artist: $(artworkMetadata.Artist).val(),
                Year: $(artworkMetadata.Year).val(),
                Location: JSON.stringify(locationList),
                Description: $(artworkMetadata.Description).val(),
                InfoFields: JSON.stringify(infoFields)
            }, saveSuccess, saveFail, conflict, saveError);
            
            // success handler for save button
            function saveSuccess() {
                titleArea.text(artworkMetadata.Title.val());
                saveMetadataButton.text('Save Changes');
                saveMetadataButton[0].removeAttribute('disabled');
            }

            // general failure callback for save button
            function saveFail() {
                popup = $(TAG.Util.UI.popUpMessage(null, "Changes have not been saved.  You must log in to save changes."));
                $('body').append(popup);
                popup.show();
                saveMetadataButton.text('Save Changes');
                saveMetadataButton[0].removeAttribute('disabled');
            }

            // error handler for save button
            function saveError() {
                var popup;
                popup = $(TAG.Util.UI.popUpMessage(null, "Changes have not been saved.  There was an error contacting the server."));
                $('body').append(popup); // TODO ('body' might not be quite right in web app)
                popup.show();
                saveMetadataButton.text('Save Changes');
                saveMetadataButton[0].removeAttribute('disabled');
            }
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
                rightArrow.attr('src', '/images/icons/RightB.png');
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
                rightArrow.attr('src', '/images/icons/Right.png');
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
            save: save,
            open: open,
            close: close,
            toggle: toggle,
            isOpen: returnIsOpen
        };
    }
};
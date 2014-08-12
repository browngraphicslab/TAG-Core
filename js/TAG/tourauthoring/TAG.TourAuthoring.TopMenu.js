TAG.Util.makeNamespace('TAG.TourAuthoring.TopMenu');

/**
 * The top-most menu bar for tour authoring
 * Back button, rename tour controls, save button, tour options
 * @class TAG.TourAuthoring.TopMenu
 * @constructor
 * @param {Object} options      relevant options required for the menu
 * @return {Object} that        the topbar as a DOM object        
 */
TAG.TourAuthoring.TopMenu = function (options) {   // viewer, undoManager, timeline, timeManager, tourobj, playbackControls, root, componentControls
    "use strict";

    var // the parameter object passed in
        root = options.root,                                                  // root of the tour authoring top-bar
        viewer = options.viewer,                                              // the preview window for the current tour being edited
        timeline = options.timeline,                                          // timelines for the tracks
        tourobj = options.tourobj,                                            // doq containing tour info
        undoManager = options.undoManager,                                    // an instance of the UndoManager to keep track of the order of commands
        timeManager = options.timeManager,                                    // keeps track of time-related stuff in tour authoring
        playbackControls = options.playbackControls,                          // the component menu at the bottom of the screen to play/pause/seek videos
        componentControls = options.componentControls,                        // controls to add components and edit their properties

        // the UI stuff
        topbar,                                                               // creates the top-bar holding the menu
        dialogOverlay = $(TAG.Util.UI.blockInteractionOverlay()),            // the overlay generated when buttons like 'save changes' are clicked, to prevent further interaction with the UI
        backDialogOverlay = $(TAG.Util.UI.blockInteractionOverlay()),        // the overlay generated when the program takes you back to the main tour-authoring page
        titleTextArea,                                                        // the div where the tour title can be modified
        backButton,                                                           // button to go back to the SettingsView page

        // booleans
        saveClicked = false,                                                  // checks if the save action has been invoked
        nameChanged = false;                                                  // checks if the text in the title text area has been changed
    
   init();
    
    /**Initialize the UI and relevant controls
     * @method init
     */
    function init() {
        topbar = createTopBar();
        titleTextArea = createTitleTextArea();
        topbar.append(titleTextArea);
        tourOptionsMenu();
        createBackDialog();
        createSaveDialog();
    }

    /**Creates the topbar div
     * @method createTopBar
     * @return {HTML Element} top       the top bar div
     */
    function createTopBar() {
        var top = $(document.createElement('div'));
        top.css({ "background-color": "rgb(63,55,53)", "height": "8%", "width": "100%" });
        top.attr('id', 'topbar');
        return top;
    }

    /**Saves the changes made to the tour
     * @method save
     * @param {Boolean} stayOnPage      determines whether or not to stay on the authoring page after saving changes
     */
    function save(stayOnPage) {
        var name = titleTextArea.val(),
            content = JSON.stringify(timeline.toRIN(true)),
            related = JSON.stringify(timeline.getRelatedArtworks()),
            options = {
                Name: name,
                Content: content,
                RelatedArtworks: related
            };

        console.log("isUploading === " + componentControls.getIsUploading());
        saveClicked = true;
        nameChanged = false;

        //if ($("#inkEditText").css('display') !== "none") {
        //    componentControls.saveText();
        //}
        //else if ($("#inkEditDraw").css('display') !== "none") {
        //    componentControls.saveDraw();
        //}
        //else if ($("#inkEditTransparency").css('display') !== "none") {
        //    componentControls.saveTrans();
        //}

        timeline.hideEditorOverlay();
        undoManager.setPrevFalse();                             //method sets savedState of top element of undoStack to true to indicate further prompt for saving is not required on leaving page
        
        TAG.Worktop.Database.changeTour(tourobj, options, function () {
            // success
            dialogOverlay.fadeOut(500);
            !stayOnPage && goBack();
        }, function () {
            // unauth
            dialogOverlay.hide();
            var popup = TAG.Util.UI.popUpMessage(null, "Tour not saved.  You must log in to save changes.");
            $('body').append(popup);
            $(popup).show();
        }, function (jqXHR, ajaxCall) {
            // conflict
            // Ignore conflict for now
            ajaxCall.force();
        }, function () {
            // error
            dialogOverlay.hide();
            var popup = TAG.Util.UI.popUpMessage(null, "Tour not saved.  There was an error contacting the server.");
            $('body').append(popup);
            $(popup).show();
        });
    }

    /**The action excuted when back button is clicked
     * @method goBack
     */
    function goBack() {
        var messageBox,
            tempSettings;

        // first, make sure that a tour reload isn't in progress
        if (viewer.getIsReloading()) {
            messageBox = TAG.Util.UI.popUpMessage(null, "Tour reload in progress. Please wait a few moments.", null);
            $(messageBox).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 1000);
            $('body').append(messageBox);
            $(messageBox).fadeIn(500);
            return;
        }

        tempSettings = new TAG.Authoring.SettingsView('Tours', null, null, tourobj.Identifier);
        backButton.off('click');
        viewer.unload();
        TAG.Util.UI.slidePageRight(tempSettings.getRoot());
    }

    /**Handles creating the components for the back button and related actions
     * @method createBackDialog
     */
    function createBackDialog() {
        var backSaveButton = $(document.createElement('button'));
        var backDontSaveButton = $(document.createElement('button'));
        var backCancelButton = $(document.createElement('button'));
        var backButtonArea = $(document.createElement('div'));
        var backButtonRow = $(document.createElement('div'));
        var backDialog = $(document.createElement('div'));
        var backDialogTitle = $(document.createElement('div'));
        var buttonHeight = $(window).height() * 0.0504;
        var backDialogSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),
         {
             center_h: true,
             center_v: true,
             width: 0.5,
             height: 0.35,
             max_width: 560,
             max_height: 200,
         });

        backButtonArea.css({
            "top": "18.5%",
            'margin-left': '1.2%',
            'height': '63%',
            "width": buttonHeight + 'px',
            "position": "relative",
            "float": "left"
        });
        backButton = $(document.createElement('img'));
        backButton.attr('src', tagPath + 'images/icons/Back.svg');
        backButton.css({ 'width': '100%', 'height': '100%' });

        backButton.mousedown(function () {
            TAG.Util.UI.cgBackColor("backButton", backButton, false);
        });

        backButton.mouseleave(function () {
            TAG.Util.UI.cgBackColor("backButton", backButton, true);
        });
        backDialogOverlay.attr('id', 'backDialogOverlay');
        backDialogOverlay.css({
            display: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            'background-color': 'rgba(0,0,0,0.6)',
            'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex,
        });

        backDialog.attr('id', 'backDialog');
        backDialog.css({
            position: 'absolute',
            left: backDialogSpecs.x + 'px',
            top: backDialogSpecs.y + 'px',
            width: backDialogSpecs.width + 'px',
            height: backDialogSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });
        backDialogOverlay.append(backDialog);

        backDialogTitle.attr('id', 'backDialogTitle');
        backDialogTitle.css({
            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '1.25em',
            'position': 'relative',
            'text-align': 'center',
            'word-wrap': 'break-word',
        });
        backDialog.append(backDialogTitle);
        backDialog.append(document.createElement('br'));

        backButtonRow.css({
            'position': 'relative',
            'display': 'block',
            'width': '80%',
            'left': '10%',
            'top': '40%'
        });

        backSaveButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
            float: 'right',
            display:'inline-block'
        });
        backSaveButton.text('Save');
        backSaveButton.click(function () {
            save();
        });
        backButtonRow.append(backSaveButton);

        backDontSaveButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
            float: 'left',
            display: 'inline-block'

        });
        backDontSaveButton.text('Don\'t Save');
        backDontSaveButton.click(function () {
            goBack();
        });

        backButtonRow.append(backDontSaveButton);
        backDialog.append(backButtonRow);

        backButton.click(function () {
            var messageBox;
            $('.rightClickMenu').hide();//shuts the menu that appears on right clicking on a track
            if (viewer.getIsReloading()) {
                messageBox = $(TAG.Util.UI.popUpMessage(null, "Tour reload in progress. Please wait a few moments.", null));
                messageBox.css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 1000);
                $('body').append(messageBox);
                messageBox.fadeIn(500);
                return;
            }

            if (nameChanged || (undoManager.dirtyStateGetter() === false) || 
                (componentControls.getInkUndoManager() && (componentControls.getInkUndoManager().dirtyStateGetter() === false))) {
                backDialogOverlay.fadeIn(500);
                if (titleTextArea.val().length === 0) {
                    titleTextArea.val('Untitled Tour');
                }
                backDialogTitle.text('Save changes to ' + $(titleTextArea).val() + ' before leaving?');
            } else {
                goBack(); 
            }
        });
        backButtonArea.append(backButton);
        topbar.append(backButtonArea);
    }

    /**Creating and positioning the title text area
     * @method createTitleTextArea
     * @return {HTML Element} textArea          the div containing the title text
     */
    function createTitleTextArea() {
        var textArea = $(document.createElement('input'));
        var textAreaSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height() * 0.08,
        {
            center_v: true,
            width: 0.2,
            height: 0.5,
            x_offset: 0.05,
            x_max_offset: 60,
        });

        textArea.css({
            'margin-left': '3%',
            'position': 'absolute',
            'border': '3px solid',
            'border-color': '#666666',
            top: textAreaSpecs.y - 7 + 'px',
            'left': textAreaSpecs.x + 'px',
            width: textAreaSpecs.width + 'px',
            height: textAreaSpecs.height + 'px',
        });
        textArea.attr({
            display: 'block',
            type: 'text',
            id: 'textArea',
            name: 'textArea',
            value: tourobj.Name
        });

        textArea.on('keydown', function (ev) {
            ev.stopImmediatePropagation();
        });
        textArea.on('keypress', function (ev) {
            ev.stopImmediatePropagation();
        });
        textArea.on('keyup', function (ev) {
            nameChanged = true;
            ev.stopImmediatePropagation();
        });
        return textArea;
    }

    /**Handles putting up the save/cancel dialog box on an overlay
     * @method createSaveDialog
     */
    function createSaveDialog() {
        var saveButton = $(document.createElement("button"));
        var submitButton = $(document.createElement('button'));
        var cancelButton = $(document.createElement('button'));
        
        var saveDialog = $(document.createElement('div'));
        var dialogTitle = $(document.createElement('div'));
        var buttonRow = $(document.createElement('div'));
        var saveButtonSpecs = TAG.Util.constrainAndPosition($(window).width() * 0.8, $(window).height() * 0.08,
            {
                center_v: true,
                width: 0.1,
                height: 0.5,
            });
        var fontsize = TAG.Util.getMaxFontSizeEM('Save Changes', 0.2, 0.75 * saveButtonSpecs.width, 0.75 * saveButtonSpecs.height, 0.01);
        var saveDialogSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });
        
        saveButton.text("Save Changes");
        saveButton.attr('type', 'button');
        saveButton.css({
            "color": "white",
            "border-color": "white",
            'position': 'absolute',
            width: saveButtonSpecs.width + 'px',
            height: saveButtonSpecs.height + 'px',
            'top': saveButtonSpecs.y + 'px',
            //'font-size': fontsize,
            'font-size': '70%',
            'left': parseInt(titleTextArea.css('left'), 10) + titleTextArea.width() + 45 + ($(window).width() * 0.022) + 'px',
        });
        saveButton.click(function () {
            $('.rightClickMenu').hide();//shuts the menu that appears on right clicking on a track
            dialogOverlay.fadeIn(500);
            if (titleTextArea.val().length === 0) {
                titleTextArea.val('Untitled Tour');
            }
            dialogTitle.text('Save changes to ' + titleTextArea.val() + '?');
            submitButton.css({
                'color': 'white',
                'border': '1px solid white',
                'cursor': 'pointer'
            });
            submitButton.attr('disabled', false);
        });

        /*save button dialog code*/
        // Overlay to darken out main UI
        dialogOverlay.attr('id', 'dialogOverlay');
        dialogOverlay.css({
            display: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            'background-color': 'rgba(0,0,0,0.6)',
            'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex,
        });

        // Actual dialog container
        saveDialog.attr('id', 'saveDialog');
        saveDialog.css({
            position: 'absolute',
            left: saveDialogSpecs.x + 'px',
            top: saveDialogSpecs.y + 'px',
            width: saveDialogSpecs.width + 'px',
            height: saveDialogSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });
        
        dialogTitle.attr('id', 'dialogTitle');
        dialogTitle.css({
            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '1em',
            'position': 'relative',
            'text-align': 'center',
            'word-wrap': 'break-word',
        });

        // Container for "save / cancel" buttons
        buttonRow.css({
            'position': 'relative',
            'display': 'block',
            'width': '80%',
            'left': '10%',
            'top': '40%'
        });
        
        submitButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '4.5%',
        });
        submitButton.text('Save');
        submitButton.click(function () {
            save(true);
            submitButton.attr('disabled', true);
            submitButton.css({ 'border': '1px solid gray', 'color': 'gray', 'cursor': 'default' });
        });

        cancelButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '5%',
            'float': 'right'
        });
        cancelButton.text('Cancel');
        cancelButton.click(function () { dialogOverlay.fadeOut(500); });
        
        
        // appending stuff
        topbar.append(saveButton);
        dialogOverlay.append(saveDialog);
        saveDialog.append(dialogTitle);
        //saveDialog.append(document.createElement('br'));
        saveDialog.append(buttonRow);
        buttonRow.append(submitButton);
        buttonRow.append(cancelButton);
    }
    
    /**Handles creating the tour options menu on the top bar
     * @method tourOptionsMenu
     */
    function tourOptionsMenu() {
        var tourOptions = TAG.TourAuthoring.TourOptions({
            timeManager: timeManager,
            timeline: timeline,
            root: root,
            undoManager: undoManager,
            playbackControls: playbackControls,
            tour: tourobj
        });
        var tourOptionsSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height() * 0.08,
        {
           center_v: true,
           width: 0.13,
           height: 0.8,
        });
        var tourOptionsFontSize = TAG.Util.getMaxFontSizeEM('Options', 0.5, tourOptionsSpecs.width * 0.8, tourOptionsSpecs.height * 0.7, 0.01);
        var optionsLabelSpecs = TAG.Util.constrainAndPosition(tourOptionsSpecs.width, tourOptionsSpecs.height, {
            center_v: true,
            width: 0.8,
            height: 0.8,
        });
        var topBarLabel = $(document.createElement('div'));
        var topBarLabelSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height() * 0.08,
        {
            width: 0.4,
            height: 0.9,
        });
        var fontsizeTop = TAG.Util.getMaxFontSizeEM('Tour Authoring', 0.5, topBarLabelSpecs.width, topBarLabelSpecs.height * 0.85);
        tourOptions.addToDOM(topbar);
       
        tourOptions.applyCSS({
            "height": tourOptionsSpecs.height + "px",
            "width": tourOptionsSpecs.width + 'px',
            "left": "60%",
            'top': tourOptionsSpecs.y + 'px',
            "position": 'absolute',
        });

        tourOptions.applyLabelCSS({
            'height': optionsLabelSpecs.height + 'px',
            'width': optionsLabelSpecs.width + 'px',
            'left': 0 + 'px',
            'top': optionsLabelSpecs.y + 'px',
            "position": 'absolute',
            'font-size': tourOptionsFontSize,
        });

        // Page header (not user's tour title)
        topBarLabel.css({
            'margin-right': '2%',
            'margin-top': 8 * 0.04 + '%',
            'color': 'white',
            'position': 'absolute',
            'text-align': 'right',
            'right': '0px',
            'top': '0px',
            'height': topBarLabelSpecs.height + 'px',
            'width': topBarLabelSpecs.width + 'px',
        });

        topBarLabel.css({ 'font-size': fontsizeTop });
        topBarLabel.text('Tour Authoring');
        topbar.append(topBarLabel);
    }

    /**Adds the entire top bar to the DOM
     * @method addToDOM
     * @param {HTML Element} container          the main container that contains TAG
     */
    function addToDOM(container) {
        container.append(topbar).append(dialogOverlay).append(backDialogOverlay);
    }
    
    // Public methods returned
    return {
        addToDOM: addToDOM
    };
};

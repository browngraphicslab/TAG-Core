TAG.Util.makeNamespace('TAG.TourAuthoring.TopMenu');

/**
 * Main menu for Tour Authoring
 * Back button, rename tour controls, save button, tour options
 * @param spec      not used
 * @param my        not used
 */
TAG.TourAuthoring.TopMenu = function (spec, my) {
    "use strict";

    var that = {},
        viewer = spec.viewer,
        undoManager = spec.undoManager,
        timeline = spec.timeline,
        timeManager = spec.timeManager,
        tourobj = spec.tourobj,
        playbackControls = spec.playbackControls,
        root = spec.root,
        componentControls = spec.componentControls,
        topbar = $(document.createElement('div')),
        //dialogOverlay = $(document.createElement('div')), // NOTE: TODO: figure out how to place dialogOverlay inside of topbar to maintain modularity?

        dialogOverlay = $(TAG.Util.UI.blockInteractionOverlay()),
        //backDialogOverlay = $(document.createElement('div'));
        backDialogOverlay = $(TAG.Util.UI.blockInteractionOverlay());

    (function _createHTML() {
        topbar.css({
            "background-color": "rgb(63,55,53)",
            "height": "8%",
            "width": "100%",
            "z-index": "1000000",
            "position": "relative",
            "top": "0px",
            "left": "0px"
        });
        topbar.attr('id', 'topbar');
        
        var buttonHeight = $(window).height() * 0.0504; // matches effective % size from SettingsView
        var backButtonArea = $(document.createElement('div'));
        backButtonArea.css({
            "top": "18.5%",
            'margin-left': '1.2%',
            'height': '63%',
            "width": buttonHeight + 'px',
            "position": "relative",
            "float": "left"
        });
        var backButton = $(document.createElement('img'));
        backButton.attr('src', tagPath + 'images/icons/Back.svg');
        backButton.css({ 'width': '100%', 'height': '100%' });

        backButton.mousedown(function () {
            TAG.Util.UI.cgBackColor("backButton", backButton, false);
        });

        backButton.mouseleave(function () {
            TAG.Util.UI.cgBackColor("backButton", backButton, true);
        });

        //Telemetry for multiselect button
        TAG.Telemetry.register(backButton, "click", "AuthoringBackButton", function (tobj) {
            tobj.source_page = "Tour Authoring";
            tobj.destination_page = "Settings View";
        });

        //save method saves all changes made
        var saveClicked = false;
        var nameChanged = false;
        function save(stayOnPage) {
            console.log("isUploading === " + componentControls.getIsUploading());
            saveClicked = true;
            nameChanged = false;
            if ($("#inkEditText").css('display') !== "none") {
                componentControls.saveText();
            }
            else if ($("#inkEditDraw").css('display') !== "none") {
                componentControls.saveDraw();
            }
            else if ($("#inkEditTransparency").css('display') !== "none") {
                componentControls.saveTrans();
            }
            timeline.hideEditorOverlay();

            undoManager.setPrevFalse();//method sets savedState of top element of undoStack to true to indicate further prompt for saving is not required on leaving page
            //var xml = TAG.Worktop.Database.getDoqXML(tourobj.Identifier);
            //var parser = new DOMParser();
            //var tourXML = $(parser.parseFromString(xml, 'text/xml'));

            var name = textArea.val();
            var content = JSON.stringify(timeline.toRIN(true));
            var related = JSON.stringify(timeline.getRelatedArtworks());
            //var thumbnail = optionsBuffer && optionsBuffer.thumbnail;

            var options = {
                Name: name,
                Content: content,
                RelatedArtworks: related
            }

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
        // Takes you back to the tour authoring menu page
        function goBack() {
            var messageBox;
            // first, make sure that a tour reload isn't in progress
            if (viewer.getIsReloading()) {
                messageBox = TAG.Util.UI.popUpMessage(null, "Tour reload in progress. Please wait a few moments.", null);
                $(messageBox).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 1000);
                $('body').append(messageBox);
                $(messageBox).fadeIn(500);
                return;
            }
            backButton.off('click');
            $('.rightClickMenu').hide();//shuts the menu that appears on right clicking on a track
            var tempSettings = new TAG.Authoring.SettingsView('Tours', null, null, tourobj.Identifier);
            viewer.stop();
            viewer.unload();
            TAG.Util.UI.slidePageRight(tempSettings.getRoot(), function () {
                TAG.Telemetry.recordEvent("SpentTime", function (tobj) {
                    tobj.item = "tour_authoring";
                    tobj.time_spent = SPENT_TIMER.get_elapsed();
                    console.log("tour authoring spent time: " + tobj.time_spent);
                });
            });
        }
        //backDialogOverlay.attr('id', 'backDialogOverlay');
        //backDialogOverlay.css({
        //    display: 'none',
        //    position: 'absolute',
        //    top: 0,
        //    left: 0,
        //    width: '100%',
        //    height: '100%',
        //    'background-color': 'rgba(0,0,0,0.6)',
        //    'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex,
        //    //'height': '30%',
        //    //'width': '45%',
        //    //'position': 'fixed',
        //    //'top': '50%',
        //    //'left': '50%',
        //    //'margin-top': '-15%',
        //    //'margin-left': '-22.5%',
        //    //'background-color': 'black',
        //    //'z-index': TAG.TourAuthoring.aboveRinZIndex+5,
        //    //'border': '3px double white',
        //});
        //// Actual dialog container for when back button is pressed
        //var backDialog = $(document.createElement('div'));
        //backDialog.attr('id', 'backDialog');

        /////new css
        //var backDialogSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),
        //   {
        //       center_h: true,
        //       center_v: true,
        //       width: 0.5,
        //       height: 0.35,
        //       max_width: 560,
        //       max_height: 200,
        //   });
        //backDialog.css({
        //    position: 'absolute',
        //    left: backDialogSpecs.x + 'px',
        //    top: backDialogSpecs.y + 'px',
        //    width: backDialogSpecs.width + 'px',
        //    height: backDialogSpecs.height + 'px',
        //    border: '3px double white',
        //    'background-color': 'black',
        //});

        //backDialogOverlay.append(backDialog);
        //var backDialogTitle = $(document.createElement('div'));
        //backDialogTitle.attr('id', 'backDialogTitle');
        ////var fontsize = TAG.Util.getMaxFontSizeEM('Entering authoring mode, please enter password.', 0.8, 0.8 * loginDialog.width(), 0.2 * loginDialog.height(), 0.05);
        //backDialogTitle.css({
        //    color: 'white',
        //    'width': '80%',
        //    'height': '15%',
        //    'left': '10%',
        //    'top': '12.5%',
        //    'font-size': '1.25em',
        //    'position': 'relative',
        //    'text-align': 'center',
        //   // 'overflow': 'hidden',
        //    'word-wrap':'break-word',
        //});

        //backDialog.append(backDialogTitle);
        //backDialog.append(document.createElement('br'));
         
        //var backButtonRow = $(document.createElement('div'));
        //backButtonRow.css({
        //    'position': 'relative',
        //    'display': 'block',
        //    'width': '80%',
        //    'left': '10%',
        //    'top':'40%'
        //});

        //var backSaveButton = $(document.createElement('button'));
        //backSaveButton.css({
        //    'padding': '1%',
        //    'border': '1px solid white',
        //    'width': 'auto',
        //    'position': 'relative',
        //    'margin-top': '1%',
        //});
        //backSaveButton.text('Save');

        //$(backSaveButton).click(function () {
        //    save();
        //});

        //backButtonRow.append(backSaveButton);

        //var backDontSaveButton = $(document.createElement('button'));
        //backDontSaveButton.css({
        //    'padding': '1%',
        //    'border': '1px solid white',
        //    'width': 'auto',
        //    'position': 'relative',
        //    'margin-top': '1%',
        //    'left': '20%'

        //});
        //backDontSaveButton.text('Don\'t Save');
        //$(backDontSaveButton).click(function () {
        //    goBack();
        //});

        //backButtonRow.append(backDontSaveButton);

        //var backCancelButton = $(document.createElement('button'));
        //backCancelButton.css({
        //    'padding': '1%',
        //    'border': '1px solid white',
        //    'width': 'auto',
        //    'position': 'relative',
        //    'margin-top': '1%',
        //    'float': 'right'
        //});
        //backCancelButton.text('Cancel');
        //backCancelButton.click(function () { backDialogOverlay.fadeOut(500); });
        //backButtonRow.append(backCancelButton);

        //backDialog.append(backButtonRow);

        backButton.click(function () {
            var messageBox;

            $('.rightClickMenu').hide();//shuts the menu that appears on right clicking on a track

            if (viewer.getIsReloading() && false) {
                messageBox = TAG.Util.UI.popUpMessage(null, "Tour reload in progress. Please wait a few moments.", null);
                $(messageBox).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 1000);
                $('body').append(messageBox);
                $(messageBox).fadeIn(500);
                return;
            }

            if (nameChanged || (undoManager.dirtyStateGetter() === false) || 
                (componentControls.getInkUndoManager() && (componentControls.getInkUndoManager().dirtyStateGetter() === false) /*&& (componentControls.getInkUndoManager().undoStackSize() != 0)*/)) {
                //backDialogOverlay.fadeIn(500);
                if (textArea.val().length === 0) {
                    textArea.val('Untitled Tour');
                }
                var backDialog = TAG.Util.UI.PopUpConfirmation(function () {
                    $("#popupConfirmButton").text('Saving...').attr('disabled', true);
                    save();
                }, 'Save changes to ' +textArea.val() + ' before leaving?', "Save", false, function () {
                    goBack();
                    $("#popupConfirmButton").attr('disabled', true);//.css({ 'color': 'rgba(255, 255, 255, 0.5)' });
                    $("#popupCancelButton").attr('disabled', true).css({ 'color': 'rgba(255, 255, 255, 0.5)' });
                }, null, null, true);
                root.append(backDialog);
                TAG.Util.multiLineEllipsis($($($(backDialog).children()[0]).children()[0]));

                $(backDialog).css('z-index', 1000000);
                $(backDialog).show();
            }
            else {
                goBack();
            }


       });
        backButtonArea.append(backButton);
        topbar.append(backButtonArea);

        // Title text area, users can retype and redefine title name
        var textArea = $(document.createElement('input'));
        textArea.type = "text";
        /*textArea.on('keyup', function () {
            var txt = (textArea && textArea[0] && textArea[0].value) ? textArea[0].value.replace(/[^àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\w\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') : "";
            if (textArea && textArea[0] && textArea[0].value && textArea[0].value!=txt) {
                textArea[0].value = txt;
            }
        });*/
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
            'font-size':'.7em'
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
            saveButton.prop('disabled', false);
            saveButton.css({
                "background-color": "transparent",
                "border-color": "white",
                "opacity" : "1"
            });
            nameChanged = true;
            ev.stopImmediatePropagation();
        });
        
        topbar.append(textArea);

        // NOTE: save button click event handler is below dialog code
        var saveButton = $(document.createElement("button"));
        saveButton.text("Save").css('border-radius', '3.5px');
        saveButton.attr('type', 'button');      
        saveButton.attr('id', 'tourSaveButton');
        //Initially disable save button since there have been no changes
        saveButton.prop('disabled', true);
        saveButton.css('opacity', '0.4');

        //Save button highlighting
        
        saveButton.on('mousedown', function () {
            if (!saveButton.is(":disabled")) {
                saveButton.css({ "background-color": "white", "color": "black" });
            }
        });

        saveButton.on('mouseup', function () {
            if (!saveButton.is(":disabled")) {
                saveButton.css({ "background-color": "transparent", "color": "white" });
            }
        });

        saveButton.on('mouseout', function () {
            if (!saveButton.is(":disabled")) {
                saveButton.css({ "background-color": "transparent", "color": "white" });
            }
        });


        var saveButtonSpecs = TAG.Util.constrainAndPosition($(window).width() * 0.8, $(window).height() * 0.08,
        {
            center_v: true,
            width: 0.13,
            height: 0.5,
        });
        var fontsize = TAG.Util.getMaxFontSizeEM('Save', 0.2, 0.63 * saveButtonSpecs.width, 0.75 * saveButtonSpecs.height, 0.01);
        saveButton.css({
            "color": "white",
            "border-color": "white",
            'position': 'absolute',
            width: saveButtonSpecs.width + 'px',
            height: saveButtonSpecs.height + 'px',
            'top': saveButtonSpecs.y + 'px',
            'font-size': fontsize,
            'left': parseInt(textArea.css('left'),10) + textArea.width() + 45 + ($(window).width() * 0.022) + 'px',
        });
        
        topbar.append(saveButton);


        /*save button dialog code*/
        //// Overlay to darken out main UI
        //dialogOverlay.attr('id', 'dialogOverlay');
        //dialogOverlay.css({
        //    display: 'none',
        //    position: 'absolute',
        //    top: 0,
        //    left: 0,
        //    width: '100%',
        //    height: '100%',
        //    'background-color': 'rgba(0,0,0,0.6)',
        //    'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex,
        //});

        //// Actual dialog container
        //var saveDialog = $(document.createElement('div'));
        //saveDialog.attr('id', 'saveDialog');

        //var saveDialogSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),
        //   {
        //       center_h: true,
        //       center_v: true,
        //       width: 0.5,
        //       height: 0.35,
        //       max_width: 560,
        //       max_height: 200,
        //   });
        //saveDialog.css({
        //    position: 'absolute',
        //    left: saveDialogSpecs.x + 'px',
        //    top: saveDialogSpecs.y + 'px',
        //    width: saveDialogSpecs.width + 'px',
        //    height: saveDialogSpecs.height + 'px',
        //    border: '3px double white',
        //    'background-color': 'black',
        //});
        //dialogOverlay.append(saveDialog);
        //var dialogTitle = $(document.createElement('div'));
        //dialogTitle.attr('id', 'dialogTitle');
        ////var fontsize = TAG.Util.getMaxFontSizeEM('Entering authoring mode, please enter password.', 0.8, 0.8 * loginDialog.width(), 0.2 * loginDialog.height(), 0.05);
        //dialogTitle.css({
        //    color: 'white',
        //    'width': '80%',
        //    'height': '15%',
        //    'left': '10%',
        //    'top': '12.5%',
        //    'font-size': '1.25em',
        //    'position': 'relative',
        //    'text-align': 'center',
        //    //'overflow': 'hidden',
        //    'word-wrap': 'break-word',
        //});

        //saveDialog.append(dialogTitle);
        //saveDialog.append(document.createElement('br'));

        //// Container for "save / cancel" buttons
        //var buttonRow = $(document.createElement('div'));
        //buttonRow.css({
        //    'position': 'relative',
        //    'display': 'block',
        //    'width': '80%',
        //    'left': '10%',
        //    'top': '40%'
        //});
        //saveDialog.append(buttonRow);

        //// TODO: Hook in save-to-server functionality here!
        //var submitButton = $(document.createElement('button'));
        //submitButton.css({
        //    'padding': '1%',
        //    'border': '1px solid white',
        //    'width': 'auto',
        //    'position': 'relative',
        //    'margin-top': '1%',
        //});
        //submitButton.text('Save');
        //submitButton.click(function () { save(true); });

        //buttonRow.append(submitButton);

        //var cancelButton = $(document.createElement('button'));
        //cancelButton.css({
        //    'padding': '1%',
        //    'border': '1px solid white',
        //    'width': 'auto',
        //    'position': 'relative',
        //    'margin-top': '1%',
        //    'float': 'right'
        //});
        //cancelButton.text('Cancel');
        //cancelButton.click(function () { dialogOverlay.fadeOut(500); });
        //buttonRow.append(cancelButton);
        
        //save button click event handler
        saveButton.click(function () {
            $('.rightClickMenu').hide();//shuts the menu that appears on right clicking on a track
            //dialogOverlay.fadeIn(500);
            if (textArea.val().length === 0) {
                textArea.val('Untitled Tour');
            }
            //var saveDialog = TAG.Util.UI.PopUpConfirmation(function () {
                //$("#popupConfirmButton").text('Saving...').attr('disabled', true).css({ 'border': '1px solid gray', 'color': 'gray', 'cursor': 'default' });
            save(true);
            saveButton.prop('disabled', true);
            saveButton.css('opacity', '0.4');
            //}, 'Save changes to ' + textArea.val() + '?', "Save", false);
            //root.append(saveDialog);
            //$(saveDialog).css('z-index', 1000000);
            //$(saveDialog).show();
        });
        TAG.Telemetry.register(saveButton, 'click', 'SaveTour', null);

        //topbar.append(buttonPanel);

        // Tour Options dropdown
        var tourOptions = TAG.TourAuthoring.TourOptions({
            timeManager: timeManager,
            timeline: timeline,
            root: root,
            undoManager: undoManager,
            playbackControls: playbackControls,
            tour: tourobj
        });
        tourOptions.addToDOM(topbar);
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

        tourOptions.applyCSS(
            {
                "height": tourOptionsSpecs.height + "px",
                "width": tourOptionsSpecs.width + 'px',
                "left": "60%",
                'top': tourOptionsSpecs.y + 'px',
                "position": 'absolute',
            });

        tourOptions.applyLabelCSS(
            {
                'height': optionsLabelSpecs.height + 'px',
                'width': optionsLabelSpecs.width + 'px',
                'left': 0 + 'px',
                'top': optionsLabelSpecs.y + 'px',
                "position": 'absolute',
                'font-size': tourOptionsFontSize,
            });

        // Page header (not user's tour title)
        var topBarLabel = $(document.createElement('div'));
        var topBarLabelSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height() * 0.08,
        {
            width: 0.4,
            height: 0.9,
        });
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

        var fontsizeTop = TAG.Util.getMaxFontSizeEM('Tour Authoring', 0.5, topBarLabelSpecs.width, topBarLabelSpecs.height * 0.85);
        topBarLabel.css({ 'font-size': fontsizeTop });

        topBarLabel.text('Tour Authoring');

        topbar.append(topBarLabel);

        //topbar.append(tourLabel);
    })();

    function addToDOM(container) {
        container.append(topbar).append(dialogOverlay).append(backDialogOverlay);
    }
    that.addToDOM = addToDOM;

    return that;
};
TAG.Util.makeNamespace('TAG.TourAuthoring.TourOptions');

/**
 * Class for the tour authoring 'Options' menu on the top-bar
 * @class TAG.TourAuthoring.TourOptions
 * @constructor
 * @param {Object} options          timeManager attr, url (url of tour if loading existing tour for editing)
 * @return {Object} that            TourOptions as a DOM object
 */
TAG.TourAuthoring.TourOptions = function (options) {
    "use strict";

    var
        // main divs of the menu
        functionsPanel,                                                     // the main div containing the 'Options' Label
        tourOptionsLabel,                                                   // the options label
        dropMain,                                                           // the drop-down menu
        dropdownIcon,                                                       // the drop down icon

        // parameter properties
        tour = options.tour,                                                // the actual tour being edited
        playbackControls = options.playbackControls,                        // the bottom panel controls to play/pause the tour
        timeManager = options.timeManager,                                  // handles all time related things in tour authoring
        timeline = options.timeline,                                        // the timeline on the authoring page to view the tour
        root = options.root,                                                // root of the tour authoring page
        undoManager = options.undoManager,                                  // handles undo changes made by user by keeping track of the order of commands

        // misc variables
        dialogOverlay = $(TAG.Util.UI.blockInteractionOverlay()),          // the overlay that blocks the UI when a pop-up comes up                // NOTE: TODO: figure out how to place dialogOverlay inside of topbar to maintain modularity?   
        timeInput,                                                          // input box to enter time
        messageRow,                                                         // div containing messages to the user when required
        thumbnailcaptured = $(document.createElement('div')),               // used for thumbnail capture in the preview window
        menuVisible = false;                                                // used to toggle between the two states of the drop-down menu

    init();

    /**Initializing all the required UI components and functionality
     * @method init
     */
    function init() {
        functionsPanel = createFunctionPanel();                             // create the main panel on the top bar
        dropdownIcon = createDropDownIcon();                                // create the down arrow icon
        dropMain = createMainMenu();                                        // create the main drop-down menu 
        functionsPanel.append(dropMain);                                    // add the list to the main panel
        tourOptionsLabel = createOptionsLabel();                            // create the label with 'options' text
        tourOptionsLabel.append(dropdownIcon);                              // add the down arrow to the label
        functionsPanel.append(tourOptionsLabel);                            // add the label to the main panel
        dropMain.hide();                                                    // the drop-down menu is hidden by default
        handleDialogInputs();                                               // handle the dialog box inputs
        createMenuOptions();                                                // create and manage actions related to each option in the drop-down menu
    }

    /**Creating the main panel to hold the drop-down arrow and label text
     * @method createFunctionPanel
     * @return {HTML Element} panel         div containing text and drop-down arrow
     */
    function createFunctionPanel() {
        var panel = $(document.createElement('div'));
        panel.attr('id', 'tour-options');
        panel.css({
            "height": "48px",
            "width": "13%",
            "left": "25%",
            "top": "27%",
            "position": "relative",
            "float": "left"
        });
        return panel;
    }

    /**
     * Creates component buttons for the drop-down menu
     * @method addMenuItem
     * @param {String} title                Name of button
     * @param {HTML Element} component      DOM element to add button to
     * @param {String} id                   id to the element
     * @return {HTML Element} item          the label containing the option name
     */
    function addMenuItem(title, component, id) {
        var item = $(document.createElement('label'));
        item.addClass('optionItem');
        item.attr('id', id);
        item.text(title);
        item.css({
            "left": "0%",
            "position": "relative",
            "font-size": '80%',//TAG.Util.getFontSize(48),
            "color": "rgb(256, 256, 256)",
            "display": "block",
            'padding': '4% 0 5% 0',
            'text-indent': '4%',
            'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex + 5
        });
        item.on('mousedown', function (evt) {
            evt.stopImmediatePropagation();
        });
        component.append(item);
        return item;
    }

    /**Creates the drop-down arrow icon
     * @method createDropDownIcon
     * @return {HTML Element} icon      the drop-down arrow icon image
     */
    function createDropDownIcon() {
        var icon = $(document.createElement('img'));
        icon.addClass("tourOptionDropDownIcon");
        icon.attr('src', tagPath + 'images/icons/Down.png');
        icon.css({
            'top': '-5%',
            'width': '7.5%',
            'height': 'auto',
            'margin-left': '5%',
            'margin-bottom': '3%',
        });
        return icon;
    }

    /**Creates the label saying 'Options' to be displayed on the top bar
     * @method createOptionsLabel
     * @return {HTML Element} optionsLabel        label with text
     */
    function createOptionsLabel() {
        var optionsLabel = $(document.createElement('label'));
        optionsLabel.attr('id', 'addTourOptionsLabel');
        optionsLabel.text("Options");
        optionsLabel.css({
            "font-size": TAG.Util.getFontSize(55),
            "color": "rgb(255, 255, 255)"
        });
        optionsLabel.click(function (event) {
            var close = timeline.getCloseMenu();
            if (close && close !== hideMenu) {
                close();
            }
            event.stopImmediatePropagation();
            menuVisible = !menuVisible;
            if (menuVisible) {
                timeline.setisMenuOpen(true);
                timeline.setCloseMenu(hideMenu);
                root.on('mousedown.topMenu', function (event) {
                    hideMenu();
                });
                $(dropdownIcon).css({
                    'transform': 'scaleY(-1)',
                    'margin-bottom': '3%'
                });
            } else {
                timeline.setisMenuOpen(false);
                timeline.setCloseMenu(hideMenu);
                root.off('mousedown.topMenu');
                $(dropdownIcon).css({
                    'transform': 'scaleY(1)',
                    'margin-bottom': '3%'
                });
            }
            dropMain.css('top', parseInt(optionsLabel.css('top'), 10) + optionsLabel.height());
            dropMain.toggle();
        });
        optionsLabel.on('mousedown', function (evt) {
            evt.stopImmediatePropagation();
        });
        return optionsLabel;
    }

    /**Creates the main drop down div containing editing options
     * @method createMainMenu
     * @return {HTML Element}  mainMenu        div containing list of editing options
     */
    function createMainMenu() {
        var menu = $(document.createElement('div'));
        menu.css({
            "position": "absolute",
            "color": "rgb(256, 256, 256)",
            'background-color': 'rgba(0,0,0,0.85)',
            'left': '0',
            'width': '100%',
            'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex
        });
        return menu;
    }

    /**Creates the list of editing options with their properties
     * @method createMenuOptions
     */
    function createMenuOptions() {
        // menu options
        var thumbnailButton = addMenuItem('Capture Thumbnail', dropMain, 'thumbnailButton');
        var lengthButton = addMenuItem('Change Tour Length', dropMain, 'tourLengthButton');
        var exportButton = addMenuItem('Embed Tour', dropMain, 'exportButton');

        //the capture thumbnail confirmation
        var capturedmsg = $(document.createElement('label'));

        capturedmsg.text("Capturing Thumbnail...");
        capturedmsg.css({
            'text-align': 'center',
            'width': '100%',
            'font-size': '1.5em',
            'color': 'white'
        });
        thumbnailcaptured.append(capturedmsg);
        thumbnailcaptured.addClass("thumbnailcaptured");
        thumbnailcaptured.css({
            'background-color': 'black',
            'position': 'absolute',
            'left': '52%',
            'z-index': '1000',
            'display': 'none',
            'opacity': '0.8',
            'border': '2.8px double white'
        });

        /*capture the current viewer's thumbnail*/
        thumbnailButton.on('click', function () {
            var uiHeight = $('#resizableArea').height() + $('#topbar').height();
            var rinplayer;
            thumbnailcaptured.css({ 'top': 0.53 * uiHeight + 'px' });
            hideMenu();     //hide menu
            thumbnailcaptured.fadeIn('fast');
            //capture the thumbnail and upload it.
            rinplayer = $('#rinplayer');
            html2canvas([rinplayer[0]], {
                onrendered: function (canvas) {
                    //no need for cropping anymore, since the rinplayer is always 16:9
                    //gets dataurl from tmpcanvas, ready to send to server!
                    var dataurl = canvas.toDataURL();
                    TAG.Worktop.Database.uploadImage(dataurl, function (imageURL) {
                        TAG.Worktop.Database.changeTour(tour.Identifier, { Thumbnail: imageURL }, function () {
                            setTimeout(function () {
                                thumbnailcaptured.fadeOut();//alert msg disappear
                            }, 1000);
                        }, unauth, conflict, error);
                    }, unauth, error);
                },
                allowTaint: true, // allow imageES images in thumbnails, etc
            });
        });

        lengthButton.on('click', function () {
            hideMenu();     //hide menu
            dialogOverlay.fadeIn(500);
            timeInput.val(timeManager.formatTime(timeManager.getDuration().end));       // Set timeInput to the current length
            timeInput.select();
            messageRow.text('');
        });

        exportButton.on("click", exportJSON);           // export tour json to file
    }

    /**Handles exceptions for unauthorized access
     * @method unauth
     */
    function unauth() {
        var popup = TAG.Util.UI.popUpMessage(null, "Thumbnail not saved.  You must log in to save changes.");
        dialogOverlay.hide();
        $('body').append(popup);
        $(popup).show();
        setTimeout(function () {
            thumbnailcaptured.fadeOut();//alert msg disappear
        }, 1000);
    }

    /**If we have an out-of-date doq (e.g., if another TAG
     * client updated the doq while we were working), force
     * the call anyway, which will overwrite their changes.
     * @method conflict
     * @param {jqXHR} jqXHR     async request object (see http://api.jquery.com/Types/#jqXHR)
     * @param {} ajaxCall       see documentation in TAG.Worktop.Database (and the code for asyncRequest in that file)
     */
    function conflict(jqXHR, ajaxCall) {
        ajaxCall.force();
    }

    /**Handles server connectivity errors
     * @method error
     */
    function error() {
        var popup = TAG.Util.UI.popUpMessage(null, "Thumbnail not saved.  There was an error contacting the server.");
        dialogOverlay.hide();
        $('body').append(popup);
        $(popup).show();
        setTimeout(function () {
            thumbnailcaptured.fadeOut();        //alert msg disappear
        }, 1000);
    }

    /**Creates and manages the dialogForm box to change tour length etc.
     * @method handleDialogInputs
     */
    function handleDialogInputs() {
        var lengthDialog = $(document.createElement('div'));                                                            // create the pop-up div containing the form components
        var dialogForm = $(document.createElement('form'));                                                             // create a form to capture enter keypress
        var dialogTitle = $(document.createElement('div'));                                                             // the dialog box title text
        var lengthDialogSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),                   
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });                                                                                                          
        var emptyDiv = $(document.createElement("div"));
        var buttonDiv = $(document.createElement("div"));                                                               // main button panel
        var buttonRow = $(document.createElement('div'));                                                               // div containing the save and cancel buttons
        var submitButton = $(document.createElement("button"));                                                         // submit button on the dialog box
        var cancelButton = $(document.createElement('button'));                                                         // cancel button on the dialog box

        timeInput = $(document.createElement('input'));                                                                 // input for the tour length time
        messageRow = $(document.createElement('div'));                                                                  // div to output a message to the user

        lengthDialog.attr('id', 'lengthDialog');
        dialogOverlay.css('z-index', '100000');
        lengthDialog.css({
            position: 'absolute',
            left: lengthDialogSpecs.x + 'px',
            top: lengthDialogSpecs.y + 'px',
            width: lengthDialogSpecs.width + 'px',
            height: lengthDialogSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',
        });
        dialogOverlay.append(lengthDialog);
        dialogForm.attr('id', 'dialogForm');
        dialogForm.css({
            'margin-top': '4.5%',
        });
        lengthDialog.append(dialogForm);

        // updates the timeManager/timeinput related stats
        // when the length of tour is changed/submit button is clicked.
        dialogForm.on('submit', function () {
            var split = timeInput.val().split(':');
            var min = parseInt(split[0], 10);
            var sec = parseInt(split[1], 10);
            var oldTime;
            var command;

            if (split.length === 1 && (min || min === 0) && min >= 0) { // In this case 'min' is actually seconds
                if (min > TAG.TourAuthoring.Constants.maxTourLength) {
                    messageRow.text('Tour length is too long. Maximum length of tour must be 15 minutes.');
                    messageRow.css({
                        color: 'white',
                        'width': '80%',
                        'left': '10%',
                        'font-size': '0.7em',
                        'position': 'absolute',
                        'text-align': 'center',
                        'margin-top': '3%',
                    });
                    timeInput.select();
                } else {
                    if (min < timeline.getLastDisplayTime()) { //check if new time is shorter than last display length, and limit it to that
                        min = timeline.getLastDisplayTime();
                    }
                    oldTime = timeManager.getDuration().end;
                    command = TAG.TourAuthoring.Command({
                        execute: function () {
                            timeManager.setEnd(min);
                        },
                        unexecute: function () {
                            timeManager.setEnd(oldTime);
                        }
                    });
                    command.execute();
                    undoManager.logCommand(command);
                    dialogOverlay.fadeOut(500);
                }
            } else if (split.length === 2 && (min || min === 0) && (sec || sec === 0) && min >= 0 && (typeof sec === "number") && sec >= 0 && sec <= 59) { // good format
                var newTime = min * 60 + sec;
                if (newTime > TAG.TourAuthoring.Constants.maxTourLength) {
                    messageRow.text('Tour length is too long. Maximum length of tour is 15 minutes.');
                    timeInput.select();
                } else {
                    if (newTime < timeline.getLastDisplayTime()) { //check if new time is shorter than last display length, and limit it to that
                        newTime = timeline.getLastDisplayTime();
                    }
                    oldTime = timeManager.getDuration().end;
                    command = TAG.TourAuthoring.Command({
                        execute: function () {
                            timeManager.setEnd(newTime);
                        },
                        unexecute: function () {
                            timeManager.setEnd(oldTime);
                        }
                    });
                    command.execute();
                    undoManager.logCommand(command);
                    dialogOverlay.fadeOut(500);
                }
            } else {
                messageRow.text('Please enter a valid length (MM:SS or seconds).');
                timeInput.select();
            }
            timeline.faderUpdate();// update the fader pposition in sliderBox
            return false;
        });

        dialogTitle.attr('id', 'dialogTitle');
        dialogTitle.css({
            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'font-size': '0.7em',
            'position': 'relative',
            'text-align': 'center',
            'word-wrap': 'break-word'
        });
        dialogTitle.text('Enter New Length (MM:SS): ');
        dialogForm.append(dialogTitle);

        timeInput.attr('id', 'timeInput');
        timeInput.css({
            'position': 'relative',
        });
        dialogTitle.append(timeInput);
        dialogForm.append(document.createElement('br'));

        timeInput.on('keydown', function (ev) {
            ev.stopImmediatePropagation();
        });
        timeInput.on('keypress', function (ev) {
            ev.stopImmediatePropagation();
        });
        timeInput.on('keyup', function (ev) {
            ev.stopImmediatePropagation();
        });
       
        messageRow.css({
            'color': 'white',
            'width': '80%',
            'left': '10%',
            'font-size': '0.7em',
            'position': 'absolute',
            'text-align': 'center',
            'margin-top': '3%'
        });
        dialogForm.append(messageRow);
        buttonRow.css({
            'position': 'relative',
            'display': 'block',
            'width': '80%',
            'left': '10%',
            'top': '50%'
        });
        dialogForm.append(buttonRow);

        buttonDiv.css('text-align', 'right');
        emptyDiv.css('clear', 'both');
        
        submitButton.text("Apply");
        submitButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'absolute',
            'float': "left",
            'margin-top': '5%'
        });
        
        cancelButton.attr('type', 'button');
        cancelButton.text("Cancel");
        cancelButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'float': "right",
            'margin-top': '5%',
            'bottom': '1%'
        });
        buttonRow.append(cancelButton);
        buttonRow.append(submitButton);
        buttonRow.append(emptyDiv);
        dialogForm.append(buttonRow);
        cancelButton.click(function () { dialogOverlay.fadeOut(500); });
        buttonRow.append(cancelButton);
        
    }

    /**Helper function to hide the drop-down menu
     * @method hideMenu
     */
    function hideMenu() {
        $('.tourOptionDropDownIcon').css({ 'transform': 'scaleY(1)', 'margin-bottom': '0%' });
        menuVisible = false;
        dropMain.hide();
    }

    /**Exports tour json to a file
     * @method exportJSON
     */
    function exportJSON() {
        var date = Date.now();
        var json = timeline.toRIN(true);
        var json_str = JSON.stringify(json);
        var messageBox;

        var html_content = '';
        html_content += '<!DOCTYPE html>\n';
        html_content += '    <html>\n';
        html_content += '    <head>\n';
        html_content += '        <title>TAG Tour Embedding</title>\n';
        html_content += '        <script src="TAG-min.js"></script>\n';
        html_content += '        <script>\n';
        html_content += '            window.onload = load;\n';
        html_content += '            function load() {\n';
        html_content += '                TAG({\n';
        html_content += '                    path: "",\n';
        html_content += '                    containerId: "tagContainer",\n';
        html_content += '                    serverIp: "' + localStorage.ip + '",\n';
        html_content += '                    width: "1000px",\n';
        html_content += '                    height: "500px",\n';
        html_content += '                    pageToLoad: "#tagpagename=tour&tagguid='+options.tour.Identifier+'&tagtouronly=false&tagserver='+localStorage.ip+'"\n';
        html_content += '                });\n';
        html_content += '            }\n';
        html_content += '        </script>\n';
        html_content += '    </head>\n';
        html_content += '    <body style="height:1000px;width:1100px;">\n';
        html_content += '        <div id="tagContainer" style="margin-left:50px;margin-top:50px"></div>\n';
        html_content += '    </body>\n';
        html_content += '</html>';

        hideMenu();

        messageBox = popupTextareaDialog("Copy the text below into an HTML file and place this file in the top-level 'TAG' directory of the TAG web app source code. Please see our website (cs.brown.edu/research/ptc/tag) for more details.", html_content);
        $('body').append(messageBox);
        messageBox.fadeIn(500);
    }

    /**
     * Show a popup dialog with a textarea so the user can copy some content. This
     * is used in the "export tour data" functionality to give the user an html string.
     * @method popupTextareaDialog
     * @param {String} description      description/directions
     * @param {String} text             text for the textarea
     * @return {jQuery obj}             the overlay to be appended to the root
     */
    function popupTextareaDialog(description, text) {
        var overlay = $(TAG.Util.UI.blockInteractionOverlay()),
            messageDiv = $(document.createElement('div')),
            textarea = $(document.createElement('textarea')),
            closeButton = $(document.createElement('button')),
            optionButtonDiv = $(document.createElement('div')),
            confirmBox = $(document.createElement('div')),
            confirmBoxSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(), { // TODO is window right for the web app?
                center_h: true,
                center_v: true,
                width: 0.5,
                height: 0.6,
                max_width: 1200,
                max_height: 1200,
            });

        overlay.on('click', removeAll);

        confirmBox.css({
            position: 'absolute',
            left: confirmBoxSpecs.x + 'px',
            top: confirmBoxSpecs.y + 'px',
            width: confirmBoxSpecs.width + 'px',
            height: confirmBoxSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black'
        });
        confirmBox.on('click', function (evt) {
            evt.stopPropagation();
        });

        messageDiv.addClass('popupTextareaMessage');
        messageDiv.css({
            'font-size': '1.2em',
            'height': '60px',
            'left': '5%',
            'position': 'relative',
            'margin-top': '10px',
            'width': '90%'
        });
        messageDiv.text(description);

        textarea.css({
            left: '4%',
            position: 'relative',
            'margin-top': '12px',
            width: '90%'
        });
        textarea.attr({
            value: text
        });

        optionButtonDiv.addClass('optionButtonDiv');
        optionButtonDiv.css({
            'height': '30px',
            'width': '90%',
            'position': 'relative',
            'left': '5%',
            'margin-top': '10px'
        });

        closeButton.css({
            'border': '1px solid white',
            'display': 'inline-block',
            'float': 'right',
            'position': 'relative'
        });
        closeButton.text('Close');
        closeButton.on('click', removeAll);

        function removeAll() {
            overlay.fadeOut(500, function () { overlay.remove(); });
        }

        optionButtonDiv.append(closeButton);
        confirmBox.append(messageDiv);
        confirmBox.append(textarea);
        confirmBox.append(optionButtonDiv);
        overlay.append(confirmBox);
        textarea.css('height', (confirmBox.height() - optionButtonDiv.height() - messageDiv.height() - 60) + 'px');

        return overlay;
    }

    /**Apply given CSS properties to the functionsPanel
     * @method applyCSS
     * @param {Object} css      list of css properties as an object
     */
    function applyCSS(css) {
        functionsPanel.css(css);
    }
    
    /**Apply given CSS properties to the tourOptionsLabel
     * @method applyLabelCSS
     * @param {Object} css     list of css properties as an object
     */
    function applyLabelCSS(css) {
        tourOptionsLabel.css(css);
    }
    
    /**Adds the tour options panel to the DOM
     * @method addToDOM
     * @param {HTML Element} container      the actual div/window containing TAG
     */
    function addToDOM(container) {
        container.append(functionsPanel).append(dialogOverlay);
        container.append(functionsPanel).append(thumbnailcaptured);
    }
    
    // Public methods
    return {
        applyCSS: applyCSS,
        applyLabelCSS: applyLabelCSS,
        addToDOM: addToDOM,
    };
};


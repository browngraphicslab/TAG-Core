fTAG.Util.makeNamespace('TAG.TourAuthoring.TourOptions');

/**
 * Control for additional tour options
 *@param spec:    timeManager attr, url (url of tour if loading existing tour for editing)

 */
TAG.TourAuthoring.TourOptions = function (spec) {
    "use strict";

    var functionsPanel = $(document.createElement('div')),
        addTourOptionsLabel,
        dropMain,
        dropdownIcon,
        that = {},
        tour = spec.tour,
        playbackControls = spec.playbackControls,
        timeManager = spec.timeManager,
        timeline = spec.timeline,
        root = spec.root,
        undoManager = spec.undoManager,
        //dialogOverlay = $(document.createElement('div')), // NOTE: TODO: figure out how to place dialogOverlay inside of topbar to maintain modularity?

        dialogOverlay = $(TAG.Util.UI.blockInteractionOverlay()),


        thumbnailcaptured = $(document.createElement('div')),
        optionsBuffer = {};

    (function _createHTML() {
        functionsPanel.attr('id', 'tour-options');
        // Had to do tops and heights as CSS to prevent overlap on small screens
        functionsPanel.css({
            "height": "48px",
            "width": "13%",
            "left": "25%",
            "top": "27%",
            "position": "relative",
            "float": "left"
        });

        /**
         * Drop Down icon
         * Modified By: Hak
         */
        var addDropDownIconTourOptions = $(document.createElement('img'));
        addDropDownIconTourOptions.addClass("tourOptionDropDownIcon");
        addDropDownIconTourOptions.attr('src', tagPath + 'images/icons/Down.png');
        addDropDownIconTourOptions.css({
            'top': '-5%', 'width': '7.5%', 'height': 'auto', 'margin-left': '5%', 'margin-bottom': '3%',
        });
        dropdownIcon = addDropDownIconTourOptions;

        // Additional options will go here once they exist
        addTourOptionsLabel = $(document.createElement('label'));
        addTourOptionsLabel.attr('id', 'addTourOptionsLabel');
        addTourOptionsLabel.text("Options");
        addTourOptionsLabel.css({
            "font-size": TAG.Util.getFontSize(190),
            "color": "rgb(256, 256, 256)"
        });
        addTourOptionsLabel.append(addDropDownIconTourOptions);
        functionsPanel.append(addTourOptionsLabel);

        // Dropdown menus:
        // Main section
        dropMain = $(document.createElement('div'));
        dropMain.css({
            "position": "absolute",
            "color": "rgb(256, 256, 256)",
            'background-color': 'rgba(0,0,0,0.85)',
            'left': '0',
            'width': '100%',
            'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex
        });
        functionsPanel.append(dropMain);
        dropMain.hide();

        // create the buttons to add various components
        var thumbnailButton = _addMenuItem('Capture Thumbnail', dropMain, 'thumbnailButton');
        var lengthButton = _addMenuItem('Change Tour Length', dropMain, 'tourLengthButton');
        var exportButton = _addMenuItem('Export Tour Data', dropMain, 'exportButton');

        /**
         * Creates component menu buttons
         * @param title         Name of button
         * @param component     DOM element to add button to
         * @param id            id to the element
         */
        function _addMenuItem(title, component, id) {
            var item = $(document.createElement('label'));
            item.addClass('optionItem');
            item.attr('id', id);
            item.text(title);
            item.css({
                "left": "0%",
                "position": "relative",
                "font-size": '.8em',//TAG.Util.getFontSize(170),
                "color": "rgb(256, 256, 256)",
                "display": "block",
                'padding': '4% 0 5% 0',
                'text-indent': '4%',
                'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex + 5
            });

            //Highlighting
            item.on('mousedown', function (evt) {
                evt.stopImmediatePropagation();
                item.css({ "background-color": "white", "color": "black" });
            });

            item.on('mouseup', function (evt) {
                evt.stopImmediatePropagation();
                item.css({ "background-color": "transparent", "color": "white" });
            });

            item.on('mouseout', function (evt) {
                evt.stopImmediatePropagation();
                item.css({ "background-color": "transparent", "color": "white" });
            });

            component.append(item);
            return item;
        }

        var menuVisible = false;
        //have the dropMain menu show/hide when clicked
        addTourOptionsLabel.click(function (event) {
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
            }
            else {
                timeline.setisMenuOpen(false);
                timeline.setCloseMenu(hideMenu);
                root.off('mousedown.topMenu');

                $(dropdownIcon).css({
                    'transform': 'scaleY(1)',
                    'margin-bottom': '3%'
                });
            }
            dropMain.css('top', parseInt(addTourOptionsLabel.css('top'),10) + addTourOptionsLabel.height());
            dropMain.toggle();
        });
        addTourOptionsLabel.on('mousedown', function (evt) {
            evt.stopImmediatePropagation();
        });

        //the capture thumbnail confirmation
        var capturedmsg = $(document.createElement('label'));
        $(capturedmsg).text("Capturing Thumbnail...");
        capturedmsg.css({
            'text-align': 'center',
            'width': '100%',
            'font-size': '1em',
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
            thumbnailcaptured.css({ 'top': 0.53 * uiHeight + 'px' });

            //hide menu
            hideMenu();
            thumbnailcaptured.fadeIn('fast');
            //capture the thumbnail and upload it.
            var rinplayer = $('#ITEHolder');
            html2canvas([rinplayer[0]], {
                onrendered: function (canvas) {
                    // no need for cropping anymore, since the rinplayer is always 16:9
                    //gets dataurl from tmpcanvas, ready to send to server!
                    var dataurl = canvas.toDataURL();
                    TAG.Worktop.Database.uploadImage(dataurl, function (imageURL) {
                        TAG.Worktop.Database.changeTour(tour.Identifier, { Thumbnail: imageURL }, function () {
                            setTimeout(function () {
                                thumbnailcaptured.fadeOut();//alert msg disappear
                            }, 1000);
                        }, unauth, conflict, error);
                    }, unauth, error);
                    //optionsBuffer.thumbnail = imageURL;
                },
                allowTaint: true, // allow imageES images in thumbnails, etc
            });

        });
        TAG.Telemetry.register(thumbnailButton, 'click', 'CaptureTourThumbnail', null);

        function unauth() {
            dialogOverlay.hide();
            var popup = TAG.Util.UI.popUpMessage(null, "Thumbnail not saved.  You must log in to save changes.");
            $('body').append(popup);
            $(popup).show();
            setTimeout(function () {
                thumbnailcaptured.fadeOut();//alert msg disappear
            }, 1000);
        }

        function conflict(jqXHR, ajaxCall) {
            ajaxCall.force();
        }

        function error() {
            dialogOverlay.hide();
            var popup = TAG.Util.UI.popUpMessage(null, "Thumbnail not saved.  There was an error contacting the server.");
            $('body').append(popup);
            $(popup).show();
            setTimeout(function () {
                thumbnailcaptured.fadeOut();//alert msg disappear
            }, 1000);
        }

        /*click function for inputtin new tour length*/
        lengthButton.on('click', function () {
            //hide menu
            hideMenu();

            dialogOverlay.fadeIn(500);
            // Set timeInput to the current length
            timeInput.val(timeManager.formatTime(timeManager.getDuration().end));
            timeInput.select();
            messageRow.text('');
        });
        TAG.Telemetry.register(lengthButton, 'click', 'ChangeTourLength', null);

        // Tour Length Dialog
        // Overlay to darken out main UI

        // Actual dialog container
        var lengthDialog = $(document.createElement('div'));
        lengthDialog.attr('id', 'lengthDialog');

        ///
        dialogOverlay.css('z-index', '100000');


        var lengthDialogSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width:$('body').width()*0.35,
               max_height: $('body').height() * 0.25,
           });

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
        
        // Create a form to capture enter keypress
        var dialogForm = $(document.createElement('form'));
        dialogForm.attr('id', 'dialogForm');
        dialogForm.css({
            'margin-top': '4.5%',
        });
        lengthDialog.append(dialogForm);

        // updates the timeManager/timeinput related stats
        // when the length of tour is changed/submit button is clicked.
        dialogForm.on('submit', function () {
            var split = timeInput.val().split(':');
            var min = parseInt(split[0],10), sec = parseInt(split[1],10);
            var oldTime;
            var command;
            if (split.length == 1 && (min || min === 0) && min >= 0) { // In this case 'min' is actually seconds
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
                }
                else {
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
                }
                else {
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
            }
            else {
                messageRow.text('Please enter a valid length (MM:SS or seconds).');
                timeInput.select();
            }

            timeline.faderUpdate();// update the fader pposition in sliderBox
            return false;
        });

        var dialogTitle = $(document.createElement('div'));
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
        var msg = 'Enter New Length (MM:SS): ';
        dialogTitle.text(msg);
        //var fontsize = TAG.Util.getMaxFontSizeEM(msg,0.7,lengthDialog.width(),lengthDialog.height());
        //dialogTitle.css('font-size', fontsize);
        dialogForm.append(dialogTitle);

        var timeInput = $(document.createElement('input'));
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

        // Div for bad format message
        var messageRow = $(document.createElement('div'));
        messageRow.css({
            'color': 'white',
            'width': '80%',
            'left': '10%',
            'font-size': '0.7em',
            'position': 'absolute',
            'text-align': 'center',
            'margin-top': '1%'
        });
        dialogForm.append(messageRow);

        // Container for "save / cancel" buttons
        var buttonRow = $(document.createElement('div'));
        buttonRow.css({
            //'margin-top': '10px',
            //'text-align': 'left',

            'position': 'absolute',
            'display': 'block',
            'width': '80%',
            'left': '10%',
            'top': '60%'
        });
        dialogForm.append(buttonRow);


        //////////

        var buttonDiv = $(document.createElement("div"));
        buttonDiv.css('text-align', 'right');
        var emptyDiv = $(document.createElement("div"));
        emptyDiv.css('clear', 'both');
        var submitButton = $(document.createElement("button"));
        submitButton.text("Apply");
        submitButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'absolute',
            'float': "left",
            'margin-top': '7%'


        });
        var cancelButton = $(document.createElement('button')).css('border-radius', '3.5px');
        cancelButton.attr('type', 'button');
        cancelButton.text("Cancel");
        cancelButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'float': "right",
            'margin-top': '7%',
            'bottom': '1%'
        });
        buttonRow.append(cancelButton);
        buttonRow.append(submitButton);
        buttonRow.append(emptyDiv);
        //renameDialog.append(buttonDiv);
        dialogForm.append(buttonRow);


        ////////////

        //creates all buttons and adds them to panel
        //var submitButton = $(document.createElement('button'));
        //submitButton.css({
        //    width: 'auto',
        //    border: '1px solid white',
        //    padding: '1%',
        //    'float':'right'
        //});
        //submitButton.text('Apply');
        //buttonRow.append(submitButton);

        //var cancelButton = $(document.createElement('button'));
        //cancelButton.attr('type', 'button');
        //cancelButton.css({
        //    width: 'auto',
        //    border: '1px solid white',
        //    padding: '1%',
        //});
        //cancelButton.text('Cancel');
        cancelButton.click(function () { dialogOverlay.fadeOut(500); });
        buttonRow.append(cancelButton);

        // export tour json to file



        exportButton.on("click", exportJSON);

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
            html_content += '                    pageToLoad: "#tagpagename=tour&tagguid=' + spec.tour.Identifier + '&tagtouronly=false&tagserver=' + localStorage.ip + '"\n';
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
            //Windows.Storage.KnownFolders.picturesLibrary.createFileAsync("TourPlayer" + date + ".html").then(
            //    function (file) {
            //        Windows.Storage.FileIO.writeTextAsync(file, html_content).done(function () {
            //            messageBox = TAG.Util.UI.popUpMessage(null, "Tour player file created in your Pictures Library.", null);
            //            $(messageBox).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 1000);
            //            $('body').append(messageBox);
            //            $(messageBox).fadeIn(500);
            //        });
            //    }
            //);
        }
        TAG.Telemetry.register($(exportButton), 'click', 'ExportTourData', null);

        function popupTextareaDialog(description, text) {
            var overlay = $(TAG.Util.UI.blockInteractionOverlay()),
                messageDiv = $(document.createElement('div')),
                textarea = $(document.createElement('textarea')),
                closeButton = $(document.createElement('button')).css('border-radius', '3.5px'),
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
        /*the helper function to hide menus when an option is clicked*/
        function hideMenu() {
            $('.tourOptionDropDownIcon').css({ 'transform': 'scaleY(1)', 'margin-bottom': '2%' });
            menuVisible = false;
            dropMain.hide();
        }

    })();
    function applyCSS(css) {
        functionsPanel.css(css);
    }
    that.applyCSS = applyCSS;

    function applyLabelCSS(css) {
        addTourOptionsLabel.css(css);
    }
    that.applyLabelCSS = applyLabelCSS;

    function addToDOM(container) {
        container.append(functionsPanel).append(dialogOverlay);
        container.append(functionsPanel).append(thumbnailcaptured);
    }
    that.addToDOM = addToDOM;

    function getBufferedData() {
        var returndata = optionsBuffer;
        optionsBuffer = {};
        return returndata;
    }
    that.getBufferedData = getBufferedData;

    return that;
};

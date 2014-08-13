/// <reference path="TAG.TourAuthoring.InkTrack.js" />
TAG.Util.makeNamespace('TAG.TourAuthoring.ComponentControls');



/**Controls for adding Components, editing properties of them, and undo/redo buttons
 * @class TAG.TourAuthoring.ComponentControls
 * @constructor
 * @param spec  root, timeline, timeManager attr
 * @param my    not used
 */
TAG.TourAuthoring.ComponentControls = function (spec, my) {
    "use strict";

    var functionsPanel = $(document.createElement('div')),
        functionsPanelDocfrag = document.createDocumentFragment(),
        catalogPicker = $(document.createElement('div')),
        associatedMediaPicker = $(document.createElement('div')),
        that = {
            saveDraw: saveDraw,
            showEditDraw: showEditDraw,
            getInkUndoManager: getInkUndoManager,
            saveTrans: saveTrans,
            showEditTransparency: showEditTransparency,
            saveText: saveText,
            showEditText: showEditText,
            disableInk: disableInk,
            hideInkControls: hideInkControls,
            removeInkCanv: removeInkCanv,
            addToDOM: addToDOM,
            addCatalogToDOM: addCatalogToDOM,
            getIsUploading: getIsUploading
        },
        root = spec.root,
        playbackControls = spec.playbackControls,
        timeManager = spec.timeManager,
        timeline = spec.timeline,
        viewer = spec.viewer,
        tourobj = spec.tourobj,
        undoManager = spec.undoManager,
        inkAuthoring,
        inkTransparencyControls,
        inkTextControls,
        inkDrawControls,
        addCompButtonHeight,
        myPicker,
        resizableHeight,
        artQueue = TAG.Util.createQueue(),
        mediaQueue = TAG.Util.createQueue(),
        PICKER_SEARCH_TEXT = 'Search by Name, Artist, or Year...',
        IGNORE_IN_SEARCH = ['visible', 'exhibits', 'selected'],
        rinContainer = viewer.getContainer(),
        isUploading = false,
        allArtworks,
        p1,
        textArray = [],
        videos2Convert = [];

    var dropMain = $(document.createElement('div'));
    var dropFile = $(document.createElement('div'));
    var dropInk = $(document.createElement('div'));
    var inkTextDocfrag = document.createDocumentFragment();

    functionsPanelDocfrag.appendChild(functionsPanel[0]);
    timeline.setCompControl(that);
    var catalogPickerOverlay = TAG.Util.UI.blockInteractionOverlay();
    $(catalogPickerOverlay).addClass('catalogPickerOverlay');
    $(catalogPickerOverlay).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex);

    var associatedMediaPickerOverlay = TAG.Util.UI.blockInteractionOverlay();
    $(associatedMediaPickerOverlay).addClass('associatedMediaPickerOverlay');
    $(associatedMediaPickerOverlay).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex);

    var currentInkController;
    var isEditingText = false;
    var values;


    // draw stuff
    var inkDrawDocfrag = document.createDocumentFragment();
    var drawMode = 'draw';
    var isEditingDraw = false;
    var drawArray = [];
    var drawValues = {};
    createInitialDrawControls();
    var saveDrawButton = createSaveButton();
    var cancelDrawButton = createCancelDrawButton();
    var INITIAL_DRAW = createInkDrawControls();


    var prevSelected = [];
    var allowInk = false;
    var componentDropDown = false;

    //Hover colors for "Add Component" menu items
    var isInFileSubMenu = false;                    // move up - surbhi
    var isInInkSubMenu = false;
    var fileClick = true;
    var inkClick = true;

    var selectedArtworks = [];
    var artworkIndicesViaURL = [];
    var selectedArtworksUrls = {};

    // trans stuff
    var inkTransparencyDocfrag = document.createDocumentFragment();
    var transArray = []; // array of transparency controls
    var isEditingTransparency = false;
    createInitialTransparencyControls();
    var cancelTransButton = createTransparencyCancelButton();
    var saveTransButton = createSaveTransparencyButton();
    var INITIAL_TRANSPARENCY = createInkTransparencyControls();

    // text stuff
    createInitialInkControls();
    var cancelButton = createCancelTextButton();
    var saveButton = createSaveButton();
    var INITIAL_INK_TEXT = createInkTextControls();

    //code to handle undo-redo using ctrl-z
    var onCtrlZCalled = false;
    root.on('keydown', ctrlZHandler);





    /**Checks video conversion
     * @method checkVideoConverted
     */
    /**********************TRY VIDEO CONVERSION********************/
    //function checkVideoConverted() {
    //    if (videos2Convert.length > 0) {
    //        for (var i = 0; i < videos2Convert.length; i++) {
    //            var track = videos2Convert[i];
    //            var media = track.getMedia();
    //            var videotag = $(document.createElement('video'));
    //            videotag.attr('preload', 'metadata');
    //            var filename = media.slice(8, media.length);//get rid of /Images/ before the filename
    //            TAG.Worktop.Database.getConvertedCheck(
    //                (function (i, track, media, videotag) {
    //                    return function (output) {
    //                        if (output !== "False") {
    //                            console.log("converted: ");
    //                            var mp4filepath = "/Images/" + output.substr(0, output.lastIndexOf('.')) + ".mp4";
    //                            var mp4file = TAG.Worktop.Database.fixPath(mp4filepath);
    //                            videotag.attr('src', mp4file);
    //                            videotag.on('loadedmetadata', function () {
    //                                //remove from the video array and add display with the right duration
    //                                track.changeTrackColor('white');
    //                                track.addDisplay(0, this.duration);
    //                                videos2Convert.remove(track);
    //                            });

    //                        } else {
    //                            console.log("not converted: ");
    //                        }
    //                    }
    //                })(i, track, media, videotag), null, filename);
    //        }
    //    }
    //}

    //setInterval(checkVideoConverted, 1000 * 30);


    /**Display warning message if ink cannot be loaded
     * @method creationError
     * @param {String} displayString     String describing error (to be displayed)
     */
    function creationError(displayString) {
        var messageBox = TAG.Util.UI.popUpMessage(null, displayString, null);
        $(messageBox).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 1000);
        $('body').append(messageBox);
        $(messageBox).fadeIn(500);
        timeline.onUpdate(true);
    }

    /**Handles undo events with key press
     * @method ctrlZHandler
     * @param {Event} evt
     */
    function ctrlZHandler(evt) {
        if (evt.keyCode === 90 && evt.ctrlKey) {                                        // keyCode 90 is 'z'
            if (!onCtrlZCalled) {
                onCtrlZCalled = true;
                root.on('keyup.z', function (evt) {
                    onCtrlZCalled = false;
                    root.off('keyup.z');
                    if (timeline.getEditInkOn()) {                                      //in ink authoring mode
                        if (evt.shiftKey) {
                            inkAuthoring.getInkUndoManager().redo();
                        } else {
                            inkAuthoring.getInkUndoManager().undo();
                        }

                    } else {
                        if (evt.shiftKey) {
                            undoManager.redo();
                        } else {
                            undoManager.undo();
                        }
                    }
                });
            }
        } else if (evt.keyCode === 89 && evt.ctrlKey) {                                   // keyCode 89 is 'y'
            root.on('keyup.y', function (evt) {
                root.off('keyup.y');

                if ((inkAuthoring !== null) && (inkAuthoring.getInkUndoManager())) {    // in ink authoring mode
                    inkAuthoring.getInkUndoManager().redo();
                } else {
                    undoManager.redo();

                }
            });
        }
    }


    /**Checks what kind of track the ink is linked to and adjusts the viewer
     * @method checkLinkType
     * @param linkedTrack       parent track of ink
     * @param track             this ink track
     * @param keyframe          display part where the ink should be attached
     */
    function checkLinkType(linkedTrack, track, keyframe) {
        var kfvx,
            kfvy,
            kfvw,
            kfvh,
            linkType = linkedTrack.getType(),
            rw;

        if (!keyframe) {
            track.setIsVisible(true);
            creationError("The track this ink is attached to must be fully on screen in order to edit this ink. Please seek to a location where the track is visible.");
            return false;
        }

        if (linkType === TAG.TourAuthoring.TrackType.artwork) {
            kfvx = keyframe.state.viewport.region.center.x;
            kfvy = keyframe.state.viewport.region.center.y;
            kfvw = keyframe.state.viewport.region.span.x;
            kfvh = keyframe.state.viewport.region.span.y;
        } else if (linkType === TAG.TourAuthoring.TrackType.image) {
            kfvw = 1.0 / keyframe.state.viewport.region.span.x;
            rw = keyframe.state.viewport.region.span.x * $("#rinplayer").width();
            kfvh = keyframe.state.viewport.region.span.y; // not used
            kfvx = -keyframe.state.viewport.region.center.x * kfvw;
            kfvy = -($("#rinplayer").height() / rw) * keyframe.state.viewport.region.center.y;
        }
    }

    /**Updates the ink track in the viewer when edits are saved
     * @method updateInks
     * @param {String} artname      name of parent artwork track
     * @param linkedTrack
     * @param track
     */
    function updateInks(artname, linkedTrack, track) {
        var currcanv = $('#inkCanv');
        var new_proxy_div = $("[data-proxy='" + escape(artname) + "']");                                //proxy for the artwork -- keeps track of dimensions
        var new_proxy = {
            x: new_proxy_div.data("x"),
            y: new_proxy_div.data("y"),
            w: new_proxy_div.data("w"),
            h: new_proxy_div.data("h")
        };

        var new_keyframe = viewer.captureKeyframe(artname);
        var new_kfvx,
            new_kfvy,
            new_kfvw,
            new_kfvh,
            rw,
            linkType = linkedTrack.getType();

        if (!new_keyframe) {
            creationError("The track this ink is attached to must be fully on screen in order to save this ink. Please seek to a location where the track is visible.");
            return false;
        }

        if (linkType === TAG.TourAuthoring.TrackType.artwork) {
            new_kfvx = new_keyframe.state.viewport.region.center.x;
            new_kfvy = new_keyframe.state.viewport.region.center.y;
            new_kfvw = new_keyframe.state.viewport.region.span.x;
            new_kfvh = new_keyframe.state.viewport.region.span.y;
        } else if (linkType === TAG.TourAuthoring.TrackType.image) {
            new_kfvw = 1.0 / new_keyframe.state.viewport.region.span.x;
            rw = new_keyframe.state.viewport.region.span.x * currcanv.width();
            new_kfvh = new_keyframe.state.viewport.region.span.y; // not used
            new_kfvx = -new_keyframe.state.viewport.region.center.x * new_kfvw;
            new_kfvy = -(currcanv.height() / rw) * new_keyframe.state.viewport.region.center.y;
        }
        track.setInkInitKeyframe({ "x": new_kfvx, "y": new_kfvy, "w": new_kfvw, "h": new_kfvh });
        track.setInkRelativeArtPos(currentInkController.getArtRelativePos(new_proxy));
    }

    /**Deletes an ink track and all associated stuff
     * @method deleteInkTrack
     * @param track
     */
    function deleteInkTrack(track) {
        var command = TAG.TourAuthoring.Command({
            execute: function () {
                timeline.removeTrack(track);
            },
            unexecute: function () {
                track.reloadTrack();
            }
        });
        track.setIsVisible(true);
        undoManager.logCommand(command);
        command.execute();
        //hide ink controls and removeinkcanv
        inkTransparencyCOntrols.hide();
        removeInkCanv();

        //change the undomanager back fron ink only
        playbackControls.undoButton.off('click'); //reset undo/redo buttons to global undo/redo functionality
        playbackControls.redoButton.off('click');
        playbackControls.undoButton.on('click', function () {
            undoManager.undo();
        });
        playbackControls.redoButton.on('click', function () {
            undoManager.redo();
        });
        playbackControls.undoRedoInkOnly.css('display', 'none');
    }

    /**Update inks
     * @method editInks
     * @param track
     * @param {String} datastr      updates to the ink
     */
    function editInks(track, datastr) {
        var oldDataStr = track.getInkPath();
        var command = TAG.TourAuthoring.Command({
            execute: function () {
                track.setInkPath(datastr);
                timeline.onUpdate(true);
            },
            unexecute: function () {
                track.setInkPath(oldDataStr);
                timeline.onUpdate(true);
            }
        });

        track.setIsVisible(true);
        undoManager.logCommand(command);
        command.execute();
        currentInkController.removeAll();

        //hide ink controls and removeinkcanv
        removeInkCanv();

        //change the undomanager back fron ink only
        playbackControls.undoButton.off('click'); //reset undo/redo buttons to global undo/redo functionality
        playbackControls.redoButton.off('click');
        playbackControls.undoButton.on('click', function () {
            undoManager.undo();
        });
        playbackControls.redoButton.on('click', function () {
            undoManager.redo();
        });
        playbackControls.undoRedoInkOnly.css('display', 'none');
        //hide ink controls and removeinkcanv

        if (inkAuthoring) {
            inkAuthoring.getInkUndoManager().clear();
            undoManager.greyOutBtn();
        }
    }

    /**Saves the edits made to 'Draw' type ink annotation
     * @method saveDraw
     * @param {Boolean}             checks if ink is attached/unattached
     * @param linkedTrack
     * @param {String} artname
     * @param track
     */
    function saveDraw(linked, linkedTrack, artname, track) {
        //first, check if the ink is empty
        var datastr = currentInkController.updateDatastring();
        var oldDataStr = track.getInkPath();
        var confirmationBox;

        if (currentInkController.isDatastringEmpty(currentInkController.updateDatastring())) {
            confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
                deleteInkTrack(track);
                inkEditDraw.hide();


            }, "You have created an empty ink. Would you like to delete ink track or go back to editing?", "Delete Track", true);
            root.append(confirmationBox);
            $(confirmationBox).show();
            return;
        }

        //reset the initial keyframe and relative artwork positioning in the track data
        if (linked) {
            updateInks(artname, linkedTrack, track);
        }
        currentInkController.removeAll();
        editInks(track, datastr);
        inkDrawControls.hide();
    }

    /**Reset click and save handlers to deal with current datastring
     * @method resetDrawHandlers
     * @param {Boolean} linked
     * @param linkedTrack
     * @param {String} artname
     * @param track
     */
    function resetDrawHandlers(linked, linkedTrack, artname, track) {
        cancelDrawButton.off('click');
        cancelDrawButton.on('click', function () {
            track.setIsVisible(true);
            timeline.setEditInkOn(false);
            timeline.onUpdate(true);
            timeline.setModifyingInk(false);
            timeline.hideEditorOverlay();

            //  brushSliderPoint.attr('value', 7.0);
            //  currentInkController.updatePenWidth("brushEditSlider");

            currentInkController.removeAll();
            removeInkCanv();
            inkDrawControls.hide();

            playbackControls.undoButton.off('click');                                           //reset undo/redo buttons to global undo/redo functionality
            playbackControls.redoButton.off('click');
            playbackControls.undoButton.on('click', function () {
                undoManager.undo();
            });
            playbackControls.redoButton.on('click', function () {
                undoManager.redo();
            });
            playbackControls.undoRedoInkOnly.css('display', 'none');
        });

        saveDrawButton.off('click');
        saveDrawButton.on('click', function () {
            saveDraw(linked, linkedTrack, artname, track);
            timeline.hideEditorOverlay();
            timeline.setEditInkOn(false);
            timeline.setModifyingInk(false);
        });
    }

    /**Method called when "Edit Ink" is clicked on a draw-type ink track.
     * Creates a new InkController and loads in the datastring of the track.
     * Shows the edit draw controls.
     * If the ink is linked, need to position it correctly using keyframes and size of artwork.
     * @method showEditDraw
     * @param track        the ink track in question
     * @param datastring   the track's ink datastring (see InkController.js for format)
     */
    function showEditDraw(track, datastring) {
        var cw,
            ch,
            initKeyframe,
            artname,
            proxy,
            linked = track.getInkEnabled(),
            linkedTrack = track.getInkLink(),
            proxy_div,
            keyframe,
            raTop = $("#resizableArea").offset().top,
            raHeight = $("#resizableArea").height(),
            inkdiv = createInkCanv();

        currentInkController = new TAG.TourAuthoring.InkAuthoring({
            spec: spec
        });

        isEditingDraw = true;

        playbackControls.undoRedoInkOnly.css({ 'display': 'inline-block' });

        if (linked) {                   // needs creation check up here
            artname = linkedTrack.getTitle();

            proxy_div = $("[data-proxy='" + escape(artname) + "']");
            proxy = {
                x: proxy_div.data("x"),
                y: proxy_div.data("y"),
                w: proxy_div.data("w"),
                h: proxy_div.data("h")
            };
            keyframe = viewer.captureKeyframe(artname);
            checkLinkType(linkedTrack, track, keyframe);
        }
        //hide any open component controls, show inkEditDraw
        hideInkControls();
        //var newHeight = functionsPanel.parent().height() - addComponentLabel.offset().top - 10;
        inkDrawControls.css({ 'display': 'block' });
        inkDrawControls.css("height", raTop + raHeight - 204);                                            //make sure the initial size of the panel is the full height of the resizable area

        //  drawEditLabel.css({ 'color': 'black' });
        //  eraseEditLabel.css({ 'color': 'gray' });
        //  drawEditMode = 'draw';
        //   drawEditModeLabel1.text("Draw");
        //  brushEditLabel.text("Width: ");
        //  brushEditLabel1.text("7px");
        //  brushEditLabel.append(brushEditLabel1);
        //  brushEditSliderPoint.css("left", "0px");
        //  opacityEditLabel.text("Opacity: ");
        //   opacityEditLabel1.text("100%");
        //   opacityEditLabel.append(opacityEditLabel1);
        //  opacityEditSliderPoint.css("left", (0.87 * opacityEditSlider.width()) + "px");
        hideAll(drawArray);
        resetDrawHandlers(linked, linkedTrack, artname, track);

        $('#inkCanv').css("background", "rgba(0,0,0,0.01)");
        inkAuthoring = p1;
        currentInkController.setEditable();
        currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
        ////// new ink draw stuff

        //   p1.setPenColor(p1.getAttr(datastring, 'stroke', 's'));
        //   p1.setPenOpacity(p1.getAttr(datastring, 'strokeo', 'f'));
        //   p1.setPenWidth(p1.getAttr(datastring, 'strokew', 'f'));
        modeInput.updateMode();
        drawValues = {
            color: currentInkController.getPenColor(),
            opacity: currentInkController.getPenOpacity(),
            width: currentInkController.getPenWidth()

        };
        INITIAL_DRAW.createModeButton();
        INITIAL_DRAW.showForm();
        INITIAL_DRAW.updateInputs();

        if (linked) {
            //if the ink is linked, need to figure out where to place it beyond loading in the original datastring
            initKeyframe = track.getInkInitKeyframe();
            currentInkController.setInitKeyframeData(initKeyframe);
            currentInkController.setArtName(artname);
            currentInkController.retrieveOrigDims();
            currentInkController.setExpId(track.getTitle());
        }

        currentInkController.loadInk(datastring); //load in the ink to be edited

        if (linked) {
            //now adjust viewbox so art is at the proper coordinates
            currentInkController.updateDatastring();
            //currentInkController.setOldOpac(1);
            currentInkController.adjustViewBox({
                x: proxy.x,
                y: proxy.y,
                width: proxy.w,
                height: proxy.h
            }, true);
            // currentInkController.drawPaths();
            currentInkController.drawBezierPath();
        }



        // call onUpdate to remove the existing ink before reloading it in edit mode
        timeline.onUpdate(true);
        timeline.showEditorOverlay();
        timeline.setEditInkOn(true);
    }

    /**Method called when "Edit Ink" is clicked on a block/isolate-type ink track.
     * See comments for showEditDraw.
     * @method getUndoManager
     * @return 
     */
    function getInkUndoManager() {
        if (inkAuthoring)
            return inkAuthoring.getInkUndoManager();
    }

    /**Resets handlers for 'Highlighting' ink annotations to reflect current data
     * @method resetTransHandlers
     * @param {Boolean} linked
     * @param linkedTrack
     * @param {String} artname
     * @param track
     */
    function resetTransHandlers(linked, linkedTrack, artname, track) {
        cancelTransButton.off('click');
        cancelTransButton.on('click', function () {
            track.setIsVisible(true);
            timeline.onUpdate(true);
            timeline.setModifyingInk(false);
            timeline.setEditInkOn(false);
            timeline.hideEditorOverlay();

            currentInkController.removeAll();
            removeInkCanv();
            inkTransparencyControls.hide();

            playbackControls.undoButton.off("click");
            playbackControls.redoButton.off("click");

            playbackControls.undoButton.on('click', function () {
                undoManager.undo();
            });
            playbackControls.redoButton.on('click', function () {
                undoManager.redo();
            });
            playbackControls.undoRedoInkOnly.css('display', 'none');
        });

        saveTransButton.off("click");
        saveTransButton.on('click', function () {
            saveTrans(linked, linkedTrack, artname, track);
            timeline.hideEditorOverlay();
            timeline.setModifyingInk(false);
            timeline.setEditInkOn(false);
        });
    }

    /**Saves the edits made to 'Highlighting' inks
     * @method saveTrans
     * @param {boolean} linked
     * @param linkedTrack
     * @param {String} artname
     * @param track
     */
    function saveTrans(linked, linkedTrack, artname, track) {
        var datastr,
            confirmationBox;

        if (currentInkController.isDatastringEmpty(currentInkController.updateDatastring())) {         //first, check if the ink is empty
            confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
                deleteInkTracks(track);
                inkTransparencyControls.hide();


            }, "You have created an empty ink. Would you like to delete ink track or go back to editing?", "Delete Track", true);
            root.append(confirmationBox);
            $(confirmationBox).show();
            return;
        }
        if (linked) {
            updateInks(artname, linkedTrack, track);
        }

        // if (currentInkController.getTransMode() === 'isolate') {
        //      $('#inkType').text('Isolate');
        //  } else if (currentInkController.getTransMode() === 'block') {
        //      $('#inkType').text('Block');
        //  }

        //need to convert rectangles/ellipses to paths before updating datastring
        currentInkController.getTransShapeData();
        datastr = currentInkController.updateDatastring();
        datastr += currentInkController.getBoundingShapes(); //save the rect/ellipse data in case we need to edit again
        editInks(track, datastr);
        inkTransparencyControls.hide();
    }

    /**Method called when "Edit Ink" is clicked on a highlight-type ink track.
    * Creates a new InkController and loads in the datastring of the track.
    * Shows the edit highlighting controls.
    * If the ink is linked, need to position it correctly using keyframes and size of artwork.
    * @method showEditTransparency
    * @param track        the ink track in question
    * @param datastring   the track's ink datastring (see InkController.js for format)
    * @param trans_type   block/isolate 
    */
    function showEditTransparency(track, datastring, trans_type) {
        playbackControls.undoRedoInkOnly.css({ 'display': 'inline-block' });
        var cw,
            ch,
            initKeyframe,
            artname,
            proxy,
            proxy_h,
            proxy_w,
            kfvx,
            kfvy,
            kfvw,
            kfvh,
            linked = track.getInkEnabled(),
            linkedTrack = track.getInkLink(),
            proxy_div,
            keyframe,
            raTop = $("#resizableArea").offset().top,
            raHeight = $("#resizableArea").height(),
            inkdiv = createInkCanv(),
            currentMode,
            currOpacity,
            real_kfw,
            real_kfh,
            real_kfx,
            real_kfy;
        isEditingTransparency = true;
        playbackControls.undoRedoInkOnly.css({ 'display': 'inline-block' });

        currentInkController = new TAG.TourAuthoring.InkAuthoring({
            spec: spec
        });

        if (linked) {
            initKeyframe = track.getInkInitKeyframe();
            artname = linkedTrack.getTitle();
            proxy_div = $("[data-proxy='" + escape(artname) + "']");
            proxy = {
                x: proxy_div.data("x"),
                y: proxy_div.data("y"),
                w: proxy_div.data("w"),
                h: proxy_div.data("h")
            };
            keyframe = viewer.captureKeyframe(artname);
            checkLinkType(linkedTrack, track, keyframe);
        }
        //    inkTextControls.css({ 'display': 'none' });
        //     inkDrawControls.css({ 'display': 'none' });
        //    inkEditDraw.css('display', 'none');
        //     inkEditText.css('display', 'none');
        //     inkEditTransparency.show();
        //  inkTransparencyControls.css({
        //      "height": raTop + raHeight - inkTransparencyControls.offset().top - 10
        //  });

        hideInkControls();
        inkTransparencyControls.show();
        inkTransparencyControls.css({
            "height": raTop + raHeight - 204
        });

        //  opacityEditTransparencyLabel.text("Opacity: ");
        //  opacityEditTransparencyLabel1.text("80%");
        //  opacityEditTransparencyLabel.append(opacityEditTransparencyLabel1);    
        //  opacityEditTransparencySliderPoint.css("left", 0.8 * (opacityEditTransparencySlider.offset().left + opacityEditTransparencySlider.width()) / 1.28 + 'px');
        hideAll(transArray);
        resetTransHandlers(linked, linkedTrack, artname, track);

        $('#inkCanv').css("background", "rgba(0,0,0,0.01)");
        inkAuthoring = p1;
        currentInkController.setMode(TAG.TourAuthoring.InkMode.shapes); //shape manipulation mode
        currentInkController.setEditable();


        if (linked) {
            //get the inkController set to load ink in the correct position
            currentInkController.setInitKeyframeData(initKeyframe);
            currentInkController.setArtName(artname);
            cw = $("#inkCanv").width();
            ch = $("#inkCanv").height();
            currentInkController.retrieveOrigDims();
            currentInkController.setExpId(track.getTitle());
        }
        currentMode = datastring.split("mode")[1].split("[")[0].replace("]", "");
        currentInkController.setTransMode(currentInkController.getAttr(datastring, 'mode', 's'));
        currentInkController.loadTransparencyBoundingShapes(datastring);
        currentInkController.setMarqueeFillOpacity(currentInkController.getAttr(datastring, 'opac', 'f'));


        INITIAL_TRANSPARENCY.createModeButtons();
        INITIAL_TRANSPARENCY.showForm();
        INITIAL_TRANSPARENCY.updateInputs(currentInkController.getAttr(datastring, 'opac', 'f'));
        transMode.updateMode(currentInkController.getTransMode());
        /*     if (currentMode === 'isolate') {
                 isolateEditLabel.css({ 'color': 'black' });
                 blockEditLabel.css({ 'color': 'gray' });
                 transparencyEditMode = 'isolate';
                 transEditModeLabel1.text("Isolate");
                 p1.setTransMode("isolate");
             }
             if (currentMode === 'block') {
                 isolateEditLabel.css({ 'color': 'gray' });
                 blockEditLabel.css({ 'color': 'black' });
                 transparencyEditMode = 'block';
                 transEditModeLabel1.text("Block");
                 p1.setTransMode("block");
             } */
        if (linked) {
            //now adjust viewbox so art is at the proper coordinates
            real_kfw = currentInkController.origPaperW / kfvw;
            real_kfh = real_kfw * proxy_h / proxy_w;
            real_kfx = -kfvx * real_kfw;
            real_kfy = -kfvy * real_kfw;
            currentInkController.updateDatastring();
            //currentInkController.setOldOpac(1);
            currentInkController.adjustViewBox({
                x: proxy.x,
                y: proxy.y,
                width: proxy.w,
                height: proxy.h
            }, true);
        }
        //currentInkController = p1;
        //     currOpacity = currentInkController.getMarqueeFillOpacity();
        //    opacityEditTransparencyLabel1.text(Math.round(100 * currOpacity) + "%");
        //     opacityEditTransparencyLabel.append(opacityEditTransparencyLabel1);
        //     opacityEditTransparencySliderPoint.css("left", currOpacity * (opacityEditTransparencySlider.offset().left + opacityEditTransparencySlider.width()) / 1.28 + 'px');

        //call onUpdate to remove the existing ink before reloading it in edit mode
        timeline.onUpdate(true);
        timeline.showEditorOverlay();
    }

    /**Resets handlers for text-type ink annotations to reflect current data
     * @method resetTextHandlers
     * @param {Boolean} linked
     * @param linkedTrack
     * @param {String} artname
     * @param track
     */
    function resetTextHandlers(linked, linkedTrack, artname, track) {
        //var cancelTextButton = createCancelTextButton();
        cancelButton.off("click");
        cancelButton.on("click", function () {
            track.setIsVisible(true);
            timeline.onUpdate(true);
            timeline.setModifyingInk(false);
            timeline.setEditInkOn(false);
            timeline.hideEditorOverlay();
            currentInkController.resetText();
            currentInkController.removeAll();
            removeInkCanv();
            inkTextControls.hide();
            playbackControls.undoButton.off("click");
            playbackControls.redoButton.off("click");

            playbackControls.undoButton.on("click", function () {
                undoManager.undo();
            });
            playbackControls.redoButton.on("click", function () {
                undoManager.redo();
            });
            playbackControls.undoRedoInkOnly.css('display', 'none');
        });

        //   var saveTextButton = createSaveButton();
        saveButton.off("click");
        saveButton.on("click", function () {
            saveText(linked, linkedTrack, artname, track);
            $('#writeAnnotation').val("");
            // textEditBodyLabel1.text("");
            timeline.hideEditorOverlay();
            timeline.setModifyingInk(false);
            timeline.setEditInkOn(false);
        });
    }

    /**Saves edits made to text-inks
     * @method saveText
     * @param {Boolean} linked
     * @param linkedTrack
     * @param {String} artname
     * @param track
     */
    function saveText(linked, linkedTrack, artname, track) {
        var confirmationBox;
        //first, check if the ink is empty
        if (currentInkController.isTextboxEmpty()) {
            confirmationBox = TAG.Util.UI.PopUpConfirmation(function () {
                deleteInkTracks(track);
                // inkEditText.hide();
                inkTextControls.hide();

            }, "You have created an empty ink. Would you like to delete ink track or go back to editing?", "Delete Track", true);
            root.append(confirmationBox);
            $(confirmationBox).show();
            return;
        }
        if (linked) {
            updateInks(artname, linkedTrack, track);
        }

        track.setInkPath(currentInkController.updateDatastring()); //======== can call currentInkController.updateDatastring here to get the most recent ink path (getDatastring assumes it's already been called)
        removeInkCanv();
        inkTextControls.hide();
        track.setIsVisible(true);

        playbackControls.undoButton.off("click");
        playbackControls.redoButton.off("click");

        playbackControls.undoButton.on("click", function () {
            undoManager.undo();
        });
        playbackControls.redoButton.on("click", function () {
            undoManager.redo();
        });
        playbackControls.undoRedoInkOnly.css('display', 'none');

        //  colorTextLabel1.text("#FFFFFF");
        // $('#textColorToggle').attr('value', "FFFFFF");

        if (inkAuthoring) {
            inkAuthoring.getInkUndoManager().clear();
            undoManager.greyOutBtn();
        }
        timeline.onUpdate();
    }

    /**Method called when "Edit Ink" is clicked on a text-type ink track.
     * See comments for showEditDraw.
     * @method showEditText
     * @param track        the ink track in question
     * @param datastring   the track's ink datastring
     * @param dims
     */
    function showEditText(track, datastring, dims) {
        var cw,
            ch,
            initKeyframe,
            rap,
            artname,
            proxy,
            linked = track.getInkEnabled(),
            linkedTrack = track.getInkLink(),
            proxy_div,
            keyframe,
            raTop = $("#resizableArea").offset().top,
            raHeight = $("#resizableArea").height(),
            inkdiv = createInkCanv(),
            fontsize,
            line_breaks,
            num_lines,
            w,
            h,
            str,
            scaleFactor,
            textX,
            textY,
            svgText,
            pointvalue,
            currentcolor;

        currentInkController = new TAG.TourAuthoring.InkAuthoring({
            spec: spec
        });

        isEditingText = true;

        playbackControls.undoRedoInkOnly.css({ 'display': 'inline-block' });
        if (linked) {
            initKeyframe = track.getInkInitKeyframe();
            artname = linkedTrack.getTitle();
            proxy_div = $("[data-proxy='" + escape(artname) + "']");
            proxy = {
                x: proxy_div.data("x"),
                y: proxy_div.data("y"),
                w: proxy_div.data("w"),
                h: proxy_div.data("h")
            };

            keyframe = viewer.captureKeyframe(artname);
            checkLinkType(linkedTrack, track, keyframe);
        }

        hideInkControls();
        // inkEditText.show();
        inkTextControls.show();
        inkTextControls.css({
            "height": raTop + raHeight - 204
        });

        // fontEditLabel.text("Font: ");
        // fontEditLabel1.text("Times New Roman");
        //  fontEditLabel.append(fontEditLabel1);
        //  textEditSliderPoint.css("left", "0px");
        //   textEditSizeLabel.text("Text Size: ");
        hideAll(textArray);
        resetTextHandlers(linked, linkedTrack, artname, track);

        $('#inkCanv').css("background", "rgba(0,0,0,0.01)");
        inkAuthoring = p1;
        cw = $("#inkCanv").width();
        ch = $("#inkCanv").height();
        currentInkController.setMode(TAG.TourAuthoring.InkMode.text);
        currentInkController.setEditable();

        //     fontsize = p1.getAttr(datastring, "fontsize", 'f') * ch;
        //     p1.setFontSize(fontsize);
        // maxFontSize = Math.max(48, fontsize);

        //    textEditArea.val(str);
        //    textEditBodyLabel1.text(str);
        scaleFactor = dims.fontsize / fontsize;


        try {
            w = currentInkController.getAttr(datastring, 'w', 'f');
            w = linked ? w * scaleFactor : w;
            h = currentInkController.getAttr(datastring, 'h', 'f');
            h = linked ? h * scaleFactor : h;
        } catch (err) {
            w = null;
            h = null;
        }

        if (linked) {
            currentInkController.setInitKeyframeData(initKeyframe);
            currentInkController.setArtName(artname);
            currentInkController.retrieveOrigDims();
            currentInkController.setExpId(track.getTitle());
            currentInkController.loadInk(datastring);
            currentInkController.adjustViewBox({
                x: proxy.x,
                y: proxy.y,
                width: proxy.w,
                height: proxy.h
            }, true);
        }
        textX = currentInkController.getPannedPos().x || currentInkController.getAttr(datastring, "x", "f") * cw;
        textY = currentInkController.getPannedPos().y || currentInkController.getAttr(datastring, "y", "f") * ch;
        currentInkController.setFontFamily(currentInkController.getAttr(datastring, "font", 's'));
        currentInkController.setFontColor(currentInkController.getAttr(datastring, "color", 's'));
        currentInkController.setFontSize(currentInkController.getAttr(datastring, "fontsize", 'f') * ch);
        str = currentInkController.getAttr(datastring, 'str', 's');


        values = {
            color: currentInkController.getAttr(datastring, 'color', 's'),
            font: currentInkController.getAttr(datastring, 'font', 's'),
            text: currentInkController.getAttr(datastring, 'str', 's'),
            size: currentInkController.getAttr(datastring, 'fontsize', 'f') * ch
        };
        INITIAL_INK_TEXT.createModeButton();
        INITIAL_INK_TEXT.showForm();
        INITIAL_INK_TEXT.updateInputs(values);

        currentInkController.removeAll();

        currentInkController.addTextBox(textX, textY, str);               // 5px seems to be standard textarea padding
        svgText = currentInkController.getSVGText();
        svgText.data('str', str);

        //   currentFontSize = fontsize;
        //   textEditSizeLabel1.text(Math.round(fontsize) + "px");
        //    textEditSizeLabel.append(textEditSizeLabel1);
        //  pointvalue = (fontsize - 8) / (maxFontSize - 8);
        //   textEditSizeSlider.attr("value", Math.round(fontsize) + "px");
        //  currentcolor = p1.get_attr(datastring, "color", 's'); //update the current color
        //    colorEditTextLabel1.text(currentcolor);

        //  myEditTextPicker.fromString(currentcolor);
        //currentInkController = p1;
        //   firstUpdate();
        //   updateToggle(textArray, textArea);
        timeline.onUpdate(true);
        timeline.showEditorOverlay();
    }

    /***********************************************************************************************************************************************************************************/
    /***********************************************************************************************************************************************************************************/

    /**Creates the function panel to edit tours
     * @method createFunctionsPanel
     */
    (function createFunctionsPanel() {
        // creating components for functions panel
        var addDropDownIconComponent = $(document.createElement('img'));
        var menuOffsetL = '13%';
        var addComponentLabel = $(document.createElement('label'));
        var fade = $(document.createElement('div'));

        // create the buttons to add various components
        var artButton = _createAddComponentButton("Artwork", dropMain);
        var assetButton = _createAddComponentButton("Associated Media", dropMain);
        var fileButton = _createAddComponentButton("From File", dropMain);
        var inkButton = _createAddComponentButton("Annotate", dropMain);

        var audioButton = _createAddComponentButton("Audio (MP3)", dropFile);
        var videoButton = _createAddComponentButton("Video (MP4)", dropFile);
        var imageButton = _createAddComponentButton("Image", dropFile);

        artButton.attr('id', 'artButton');
        assetButton.attr('id', 'assetButton');
        fileButton.attr('id', 'fileButton');
        inkButton.attr('id', 'inkButton');
        audioButton.attr('id', 'audioButton');
        videoButton.attr('id', 'videoButton');
        imageButton.attr('id', 'imageButton');

        functionsPanel.attr('id', 'component-controls');
        functionsPanel.css({
            "background-color": "rgb(219,218,199)",
            "height": "48px",
            "width": "20%",
            'top': '15px',
            'left': '0%',
            'position': 'relative',
            'float': 'left'
        });

        // setting attributes/CSS of the components
        addDropDownIconComponent.attr('id', 'addDropDownIconComponent');
        addDropDownIconComponent.attr('src', tagPath + 'images/icons/Down.png');
        addDropDownIconComponent.css({
            'width': '10%',
            'height': '10%',
            'display': 'inline-block',
            'float': 'right',
            'margin-top': '3%',
            'margin-right':'3%'
        });

        addComponentLabel.text("Add Track");
        addComponentLabel.attr('id', 'addComponentLabel');
        addComponentLabel.css({
            "left": menuOffsetL, "top": "5%", "position": "relative",
            //"font-size": TAG.Util.getFontSize(70),
            "font-size": '70%',
            "color": "rgb(256, 256, 256)",
            //Using the current background color value multiplied by the ( 1- alpha value )
            'background-color': "rgb(63, 55, 53)",
            'padding': '3% 1% 4% 3%',
            'width': '70%',
            'float': 'left',
        });
        addComponentLabel.on('mousedown', function (evt) {
            evt.stopImmediatePropagation();
        });
        addComponentLabel.click(function (evt) {
            var i,
                prev,
                closeFunc = timeline.getCloseMenu();
            if (timeline.getEditInkOn() === true) { return; }
            if (closeFunc && closeFunc !== closeComponentMenu) { closeFunc(); }
            evt.stopImmediatePropagation();

            // flip state
            componentDropDown = !componentDropDown;

            // hide submenus
            dropInk.hide();
            dropFile.hide();

            if (componentDropDown) {    // close --> open
                dropMain.show();
                root.on('mousedown.componentMenu', closeComponentMenu);
                timeline.setisMenuOpen(true);
                timeline.setCloseMenu(closeComponentMenu);
                timeManager.stop();
                addDropDownIconComponent.css({
                    'transform': 'scaleY(-1)',
                    'margin-bottom': '2%'
                });

                //reseting all menu items to normal font thickness
                $(".thicknessLabel").css({ 'font-weight': 'normal' });

                // Reset any selected menu items to regular CSS
                // and unselected state
                for (i = 0; i < prevSelected.length; i++) {
                    prev = $(prevSelected[i]);
                    prev.css({
                        'background-color': 'transparent',
                        'color': 'white'
                    });
                    prev.data('selected', false);
                }

                // check to see if ink can be added
                // (only allow ink if there are artworks or images)
                if (!timeline.checkForArtworks(0)) {
                    allowInk = false;
                    inkButton.css({
                        'background-color': 'transparent',
                        'color': 'gray'
                    });
                } else {
                    allowInk = true;
                    inkButton.css({
                        'background-color': 'transparent',
                        'color': 'white'
                    });
                }
            } else {          // open --> close
                dropMain.hide();
                root.off('mousedown.componentMenu');
                timeline.setCloseMenu(null);
                timeline.setisMenuOpen(false);
                addDropDownIconComponent.css({
                    'transform': 'scaleY(1)',
                    'margin-bottom': '0%'
                });
            }
        });

        fade.css({
            width: "100%",
            height: "100%",
            position: "fixed",
            top: '0px',
            left: '0px',
            'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex + 18
        });
        fade.attr("class", "fade");
        fade.on('mousedown', function (evt) {
            fade.hide();
            componentDropDown = false;
            addDropDownIconComponent.css({ 'transform': 'scaleY(1)', 'margin-bottom': '2%' });
            dropInk.hide();
            dropFile.hide();
            dropMain.hide();
        });

        dropMain.css({
            "left": menuOffsetL,
            "position": "relative",
            "color": "rgb(256, 256, 256)",
            'width': '74%',
            'background-color': 'rgba(0,0,0,0.95)',
            'float': 'left',
            'clear': 'left',
            'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex + 19
        });

        dropFile.css({
            "left": '87%',
            'margin-top': '-33%',
            "position": "relative",
            "color": "rgb(256, 256, 256)",
            'width': '74%',
            'background-color': 'rgba(0,0,0,0.95)',
            'float': 'left',
            'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex + 19
        });

        dropInk.css({
            "left": '87%',
            'margin-top': '-16.5%',
            "position": "relative",
            "color": "rgb(256, 256, 256)",
            'width': '74%',
            'background-color': 'rgba(0,0,0,0.95)',
            'float': 'left',
            'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex + 19
        });


        // create ink buttons
        _createAddComponentButton("Write", dropInk).attr('id', 'write');
        _createAddComponentButton("Draw", dropInk).attr('id', 'draw');
        _createAddComponentButton("Highlight", dropInk).attr('id', 'highlight');

        // append components on the panel
        addComponentLabel.append(addDropDownIconComponent);
        functionsPanel.append(addComponentLabel);
        functionsPanel.append(fade);			//fade overlay appears when AddComponent is opened -- allows addComponent to be closed when clicking away
        fade.hide();
        functionsPanel.append(dropMain);
        dropMain.hide();
        functionsPanel.append(dropFile);
        dropFile.hide();
        functionsPanel.append(dropInk);
        dropInk.hide();

        TAG.Telemetry.register(addComponentLabel,'click','tour_components_added',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('#multiSelButton'),'click','tour_multisel',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('.displayMenu'),'click','tour_displaymenu',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('.time-label'),'click','tour_timeline_timelabel',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('.titlediv'),'click','tour_timeline_track_selected',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('.inHandle'),'click','tour_timeline_inhandle',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('.outHandle'),'click','tour_timeline_outhandle',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('.keyframeInnerCirc'),'click','tour_timeline_keyframeinnercirc',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('.mainRect'),'click','tour_timeline_mainrect',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('.seaDragonClipContents'),'click','tour_previewclick',function(tobj){
            tobj.mode = 'authoring';
        });
        
        TAG.Telemetry.register(root.find('.#playButton'),'click','tour_timeline_play',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('.#fader'),'click','tour_timeline_overviewdrag',function(tobj){
            tobj.mode = 'authoring';
        });
        
        TAG.Telemetry.register(root.find('#zoomPoint'),'click','tour_timeline_zoomdrag',function(tobj){
            tobj.mode = 'authoring';
        });
        
        TAG.Telemetry.register(root.find('#lensSmall'),'click','tour_timeline_zoomout',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('#lensBig'),'click','tour_timeline_zoomin',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('.undoButton'),'click','tour_timeline_undo',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('.redoButton'),'click','tour_timeline_redo',function(tobj){
            tobj.mode = 'authoring';
        });

        TAG.Telemetry.register(root.find('#tour-options'),'click','tour_options',function(tobj){
            tobj.mode = 'authoring';
        });

        
    })();

    /**Disables functionality on exiting ink track display timeframe
     * @method exitInk
     */
    function exitInk() {
        removeInkCanv();
        hideInkControls();
        // set undo/redo buttons back to global undo/redo functionality
        playbackControls.undoButton.off("click");
        playbackControls.redoButton.off("click");
        playbackControls.undoButton.on("click", function () {
            undoManager.undo();
        });
        playbackControls.redoButton.on("click", function () {
            undoManager.redo();
        });
        playbackControls.undoRedoInkOnly.css({ 'display': 'none' });
    }

    /**Opens the correct file picker based on the file type
        * @method pickFile
        */
    function pickFile() {
        var type,
            names = [],
            title = $(this).text(),
            initLoc = timeManager.getCurrentPx(),
            toConvertDecisions = [],
            mediaLengths = [],
            i,
            upldr,
            mediaFiles;

        isUploading = true;

        /**Get music properties helper function for audio files
         * @method getMusicPropertiesHelper
         * @param files
         * @param i
         * @param callback
         */
        function getMusicPropertiesHelper(files, i, callback) {
            var file = files[i];
            try {
                file.properties.getMusicPropertiesAsync().done(function (musicProperties) {
                    mediaLengths.push(musicProperties.duration / 1000); // get duration in seconds
                    if (i < files.length - 1) {
                        getMusicPropertiesHelper(files, i + 1, callback);
                    } else {
                        callback && callback();
                    }
                }, function (error) {
                    console.log(error);
                });
            } catch (err) {
                console.log(err.message);
                mediaLengths.push(TAG.TourAuthoring.Constants.maxTourLength);
                if (i < files.length - 1) {
                    getMusicPropertiesHelper(files, i + 1, callback);
                } else {
                    callback && callback();
                }
            }
        }

        if (title === "Audio (MP3)") {
            upldr = TAG.Authoring.FileUploader(root, TAG.Authoring.FileUploadTypes.Standard,
            function (files) {
                var file;
                for (i = 0; i < files.length; i++) {
                    file = files[i];
                    names.push(file.displayName);
                }
                type = TAG.TourAuthoring.TrackType.audio;
                mediaFiles = files;
            },
            function (urls) {
                getMusicPropertiesHelper(mediaFiles, 0, urlsCallback);
                function urlsCallback() {
                    var url,
                        name,
                        mediaLength,
                        track,
                        positionX,
                        displayLength,
                        diff,
                        newDisplay;
                    for (i = 0; i < urls.length; i++) {
                        url = urls[i];
                        name = names[i];
                        mediaLength = mediaLengths[i];
                        track = timeline.addAudioTrack(url, name, null, mediaLength);
                        positionX = initLoc;
                        displayLength = mediaLength;
                        if (timeManager.getDuration().end < displayLength + timeManager.pxToTime(positionX)) {
                            timeManager.setEnd(Math.min(TAG.TourAuthoring.Constants.maxTourLength, displayLength + timeManager.pxToTime(positionX)));
                        }
                        diff = TAG.TourAuthoring.Constants.maxTourLength - timeManager.pxToTime(positionX);
                        newDisplay = (diff < TAG.TourAuthoring.Constants.displayEpsilon) ?
                                             track.addDisplay(timeManager.timeToPx(TAG.TourAuthoring.Constants.maxTourLength - TAG.TourAuthoring.Constants.displayEpsilon), TAG.TourAuthoring.Constants.displayEpsilon) :
                                             track.addDisplay(positionX, Math.min(diff, displayLength));

                        if (timeline.getTracks().length > 0) {
                            timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                        }
                    }
                    undoManager.combineLast(2 * urls.length);
                    isUploading = false;
                    timeline.getDataHolder().mapTracks(function (container, i) {
                        container.track.updatePos(i);
                    });
                }
            },
            ['.mp3'],
            false,
            function () {
                root.append(TAG.Util.UI.popUpMessage(null, "There was an error uploading the file. Please try again later."));
            },
            true);
            upldr.setMaxDuration(TAG.TourAuthoring.Constants.maxTourLength);
            upldr.setMinDuration(TAG.TourAuthoring.Constants.minMediaLength);
        }

        /**Helper function to get properties of video files
         * @method getVideoPropertiesHelper
         * @param files
         * @param i
         * @param callback
         */
        function getVideoPropertiesHelper(files, i, callback) {
            var file = files[i];
            try {
                file.properties.getVideoPropertiesAsync().done(function (VideoProperties) {
                    mediaLengths.push(VideoProperties.duration / 1000); // get duration in seconds
                    if (i < files.length - 1) {
                        getVideoPropertiesHelper(files, i + 1, callback);
                    } else {
                        callback && callback();
                    }
                },
                function (error) {
                    console.log(error);
                });
            } catch (err) {
                mediaLengths.push(TAG.TourAuthoring.Constants.maxTourLength);
                if (i < files.length - 1) {
                    getVideoPropertiesHelper(files, i + 1, callback);
                } else {
                    callback && callback();
                }
            }
        }

        if (title === "Video (MP4)") {
            upldr = TAG.Authoring.FileUploader(root, TAG.Authoring.FileUploadTypes.Standard,
            function (files, localURLs, confirmCallback, cancelCallback) {
                var file,
                    total = files.length,
                    decided = 0,
                    decisions = [];
                for (i = 0; i < files.length; i++) {
                    file = files[i];
                    names.push(file.displayName);
                    //var toUpload = true;
                    //if (file.fileType !== '.mp4') {
                        //var confirmBox = TAG.Util.UI.PopUpConfirmation(function () {
                        //    decisions.push(true);
                        //    if (++decided >= total) {
                        //        confirmCallback && confirmCallback();
                        //    }
                        //}, "This video is not in a compatible format. Would you like us to convert " + file.displayName + " for you?", "Yes", true, (function (curfile) {
                        //    return function () {
                        //        decisions.push(false);
                        //        if (++decided >= total) {
                        //            confirmCallback && confirmCallback();
                        //        }
                        //    };
                        //})(file));
                        //root.append(confirmBox);
                        //$(confirmBox).show();
                    //} else {//file is Mp4, ask users if they still want to convert it. Regardless, upload the video
                        //var confirmBox = TAG.Util.UI.PopUpConfirmation((function (index) {
                        //    return function () {
                        //        decisions.push(true);
                        //        if (++decided >= total) {
                        //            confirmCallback && confirmCallback();
                        //        }
                        //    };
                        //})(i), "Video " + file.displayName + " is already MP4. Would you like us to convert it to other formats for different browsers for you?", "Yes", true, function () {
                        //    if (++decided >= total) {
                        //        decisions.push(false);
                        //        confirmCallback && confirmCallback();
                        //    }
                        //});
                        //root.append(confirmBox);
                        //$(confirmBox).show();
                    }
                    //return toUpload;
                //}
                //if (decided >= total) {
                //    confirmCallback && confirmCallback();
                //}
                confirmCallback&&confirmCallback();
                type = TAG.TourAuthoring.TrackType.video;
                mediaFiles = files;
                //toConvertDecisions = decisions;
                return 'uploading test!';
            },
            function (urls) {
                getVideoPropertiesHelper(mediaFiles, 0, urlsCallback);
                function urlsCallback() {
                    var url,
                        name,
                        mediaLength,
                        track,
                        positionX,
                        displayLength,
                        diff,
                        newDisplay;
                    for (i = 0; i < urls.length; i++) {
                        url = urls[i];
                        name = names[i];
                        mediaLength = mediaLengths[i];
                        //if (toConvertDecisions[i] === true) {
                            var newFileName = urls[i].slice(8, urls[i].length);
                            var index = newFileName.lastIndexOf(".");
                            var fileExtension = newFileName.slice(index);
                            var baseFileName = newFileName.slice(0, index);
                            TAG.Worktop.Database.convertVideo(function () {
                            }, null, newFileName, fileExtension, baseFileName, null,"True");
                        //}
                        var track = timeline.addVideoTrack(url, name, null, mediaLength,true, false);
                        var positionX = initLoc;
                        var displayLength = mediaLength;
                        if (timeManager.getDuration().end < displayLength + timeManager.pxToTime(positionX)) {
                            timeManager.setEnd(Math.min(TAG.TourAuthoring.Constants.maxTourLength, displayLength + timeManager.pxToTime(positionX)));
                        }
                        var diff = TAG.TourAuthoring.Constants.maxTourLength - timeManager.pxToTime(positionX);
                        if (displayLength !== 0 && mediaFiles[i].fileType === '.mp4') {//check if the video is mp4 and we currently can get the length of the video
                            var newDisplay = (diff < TAG.TourAuthoring.Constants.displayEpsilon) ?
                                             track.addDisplay(timeManager.timeToPx(TAG.TourAuthoring.Constants.maxTourLength - TAG.TourAuthoring.Constants.displayEpsilon), TAG.TourAuthoring.Constants.displayEpsilon) :
                                             track.addDisplay(positionX, Math.min(diff, displayLength));
                        } else {//else we don't add a display and also gray out the track
                            videos2Convert.push(track);
                            track.changeTrackColor("gray");
                        }
                        if (timeline.getTracks().length > 0) {
                            timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                        }
                        //check if the video is not mp4 and the medialength is 0, remove display. gray out the track
                    }
                    undoManager.combineLast(2 * urls.length);
                    isUploading = false;
                    timeline.getDataHolder().mapTracks(function (container, i) {
                        container.track.updatePos(i);
                    });
                }
            },
            ['.mp4', '.webm', '.ogv'],
            false,
            function () {
                root.append(TAG.Util.UI.popUpMessage(null, "There was an error uploading the file.  Please try again later."));
            },
            true);
            upldr.setMaxDuration(TAG.TourAuthoring.Constants.maxTourLength);
            upldr.setMinDuration(TAG.TourAuthoring.Constants.minMediaLength);
        }
        if (title === "Image") {
            TAG.Authoring.FileUploader(root, TAG.Authoring.FileUploadTypes.Standard,
            function (files) {
                for (i = 0; i < files.length; i++) {
                    names.push(files[i].displayName);
                }
            },
            function (urls) {
                var track,
                    dispLen,
                    newDisplay;
                for (i = 0; i < urls.length; i++) {
                    track = timeline.addImageTrack(urls[i], names[i].replace(/\'/, '').replace(/\"/, ''));
                    dispLen = Math.min(5, timeManager.getDuration().end - timeManager.pxToTime(initLoc));
                    newDisplay = (dispLen < TAG.TourAuthoring.Constants.displayEpsilon) ? track.addDisplay(timeManager.timeToPx(timeManager.getDuration().end - TAG.TourAuthoring.Constants.displayEpsilon), TAG.TourAuthoring.Constants.displayEpsilon) : track.addDisplay(initLoc, dispLen);
                    if (dispLen < 1.5 && dispLen >= TAG.TourAuthoring.Constants.displayEpsilon) {
                        newDisplay.setIn(0);
                        newDisplay.setOut(0);
                        newDisplay.setMain(dispLen);
                    }

                    if (timeline.getTracks().length > 0) {
                        timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                    }
                }
                undoManager.combineLast(2 * urls.length);
                isUploading = false;
                timeline.getDataHolder().mapTracks(function (container, i) {
                    container.track.updatePos(i);
                });
            },
            ['.jpg', '.png', '.gif', '.tif', '.tiff'],
            false,
            function () {
                root.append(TAG.Util.UI.popUpMessage(null, "There was an error uploading the file.  Please try again later."));
            },
            true);
        }

    }

    /**Creates component menu buttons
     * @method _createComponentButton
     * @param {String} title                         Name of button
     * @param {HTML Element} component               DOM element to add button to
     * @return {HTML Element} addComponentButton     the button created.
     */
    function _createAddComponentButton(title, component) {
        var addComponentButton = $(document.createElement('label'));
        if (title === "From File") {
            addComponentButton.addClass('clickable ' + 'files');
        } else {
            addComponentButton.addClass('clickable ' + title);
        }
        addComponentButton.text(title);
        addComponentButton.css({
            "left": "0%",
            "position": "relative",
            "font-size": '80%',
            "color": "rgb(256, 256, 256)",
            "display": "block",
            'padding': '2% 0 2% 0',
            'text-indent': '4%',
            'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex + 19
        });

        // mouseenter function
        addComponentButton.on('mouseenter', function () {
            var self = $(this);
            var id = this.id;
            self.css({
                'background-color': 'white',
                'color': 'black'
            });

            switch (id) {
                case "artButtom":
                case "assetButton":
                    dropInk.hide();
                    dropFile.hide();
                    break;
                case "fileButton":
                    dropFile.show();
                    dropInk.hide();
                    break;
                case "audioButton":
                case "videoButton":
                case "imageButton":
                    isInFileSubMenu = true;
                    break;
                case "inkButton":
                    if (allowInk) {
                        dropInk.show();
                        dropFile.hide();
                    } else {
                        self.css({
                            'background-color': 'transparent',
                            'color': 'gray'
                        });
                    }
                    break;
                case "write":
                case "draw":
                case "highlight":
                    isInInkSubMenu = true;
                    break;
            }
        });

        // mouseleave function
        addComponentButton.on('mouseleave', function () {
            var self = $(this);
            self.css({
                'background-color': 'transparent',
                'color': 'white'
            });
            if (self.text() === "Annotate" && !allowInk) {
                self.css({
                    'background-color': 'transparent',
                    'color': 'gray'
                });
            }
            if (fileClick || inkClick || isInFileSubMenu || isInInkSubMenu) { return; }
            dropFile.hide();
            dropInk.hide();
        });

        // mousedown function
        addComponentButton.on('mousedown', function (evt) {
            evt.stopImmediatePropagation();
        });

        // click handler
        addComponentButton.on('click', function (evt) {
            var messageBox;
            if (timeline.getEditInkOn() === true) {
                messageBox = TAG.Util.UI.popUpMessage(null, "An ink is already being edited.", null);
                $(messageBox).css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 2000000);
                $("#resizableArea").parent().parent().append(messageBox);
                closeComponentMenu();
                $(messageBox).fadeIn(500);
                return;
            }

            evt.stopImmediatePropagation();

            var self = $(this);
            var id = this.id;
            // reset css of any previously selected menu items
            for (var i = 0; i < prevSelected.length; i++) {
                if (self !== $(prevSelected[i])) {
                    ($(prevSelected[i])).css({
                        'background-color': 'transparent',
                        'color': 'white'
                    });
                }
            }
            prevSelected[prevSelected.length] = this;

            //Tto close addComponent by clicking away (only the following two have submenus)
            switch (id) {
                case "artButton":
                    exitInk();
                    self.css({
                        'background-color': 'white',
                        'color': 'black'
                    });
                    hideInkControls();
                    removeInkCanv();
                    closeComponentMenu();
                    _catalogPick();
                    break;

                case "assetButton":
                    exitInk();
                    self.css({
                        'background-color': 'white',
                        'color': 'black'
                    });
                    $('#inkButton').data('selected', false);
                    hideInkControls();
                    removeInkCanv();
                    closeComponentMenu();
                    _associatedMediaPick();
                    break;

                case "fileButton":
                    self.css({
                        'background-color': 'white',
                        'color': 'black'
                    });
                    dropFile.show();
                    dropInk.hide();
                    $('#assetButton').data('selected', false);
                    fileClick = true;
                    break;

                case "audioButton":
                case "videoButton":
                case "imageButton":
                    closeComponentMenu();
                    exitInk();
                    hideInkControls();
                    removeInkCanv();
                    isInFileSubMenu = true;
                    pickFile.call(addComponentButton);
                    break;

                case "inkButton":
                    if (allowInk) {
                        self.css({
                            'background-color': 'white',
                            'color': 'black'
                        });
                        dropInk.show();
                        dropFile.hide();
                        $(assetButton).data('selected', false);
                        inkClick = true;
                    }
                    break;


                case "write":
                    isEditingText = false;
                    //create an ink canvas and inkController
                    var inkdiv = createInkCanv();
                    var p1 = new TAG.TourAuthoring.InkAuthoring({
                        spec: spec
                    });
                    currentInkController = p1;

                    //  INITIAL_INK_TEXT.createInputs();
                    INITIAL_INK_TEXT.createModeButton();
                    INITIAL_INK_TEXT.showForm();
                    INITIAL_INK_TEXT.updateInputs();
                    var newHeight;
                    $('.undoButton').css({ 'opacity': '0.4' });
                    $('.redoButton').css({ 'opacity': '0.4' });
                    self.css({
                        'background-color': 'white',
                        'color': 'black'
                    });
                    $('inkButton').data('selected', false);
                    playbackControls.undoRedoInkOnly.css({ 'display': 'inline-block' });
                    closeComponentMenu();
                    hideInkControls();
                    hideAll(textArray);
                    inkTextControls.show();
                    newHeight = $("#resizableArea").offset().top + $("#resizableArea").height() - inkTextControls.offset().top - 10;
                    inkTextControls.css({ 'height': newHeight });
                    // initText();
                    $('#inkCanv').css("background", "rgba(0,0,0,0.01)");
                    inkAuthoring = p1;
                    p1.resetText();
                    p1.removeAll();
                    p1.addTextBox();
                    // p1.setFontColor("FFFFFF");
                    // p1.setFontFamily("Times New Roman, serif");
                    // p1.setFontSize("12");
                    p1.setMode(TAG.TourAuthoring.InkMode.text);
                    p1.setEditable();
                    currentInkController = p1;
                    $('#writeAnnotation').val("");
                    //  textBodyLabel1.text("");
                    //  colorTextLabel1.text("#FFFFFF");
                    // $('#textColorToggle').attr('value', "FFFFFF");
                    // myPicker.fromString("FFFFFF");
                    // $('.changeColor')[0].innerHTML = "#" + $("#textColorToggle").attr('value');
                    //  updateToggle(textArray, textArea);

                    timeline.setEditInkOn(true);


                    break;

                case "draw":
                    isEditingDraw = false;

                    // here, we set the initial height of the ink draw controls, so they can be resized appropriately
                    var raTop = $("#resizableArea").offset().top;
                    var raHeight = $("#resizableArea").height();

                    //create ink canvas and inkController
                    var inkdiv = createInkCanv();
                    var p1 = new TAG.TourAuthoring.InkAuthoring({
                        spec: spec
                    });
                    currentInkController = p1;

                    INITIAL_DRAW.createModeButton();
                    INITIAL_DRAW.showForm();
                    INITIAL_DRAW.updateInputs();
                    $('.undoButton').css({ 'opacity': '0.4' });
                    $('.redoButton').css({ 'opacity': '0.4' });
                    self.css({ 'background-color': 'white', 'color': 'black' });
                    playbackControls.undoRedoInkOnly.css({ 'display': 'inline-block' });
                    $('#inkButton').data('selected', false);
                    closeComponentMenu();
                    hideInkControls();

                    inkDrawControls.css({ 'display': 'block' });
                    hideAll(drawArray);
                    inkDrawControls.css("height", raTop + raHeight - inkDrawControls.offset().top - 10);
                    //  initDraw();
                    //  colorLabel1.text("#000000");
                    //  myPicker.fromString("000000"); //jscolor picker
                    $('#inkCanv').css("background", "rgba(0,0,0,0.01)");
                    inkAuthoring = p1;
                    p1.setMode(TAG.TourAuthoring.InkMode.draw);
                    p1.setEditable(); // give the canvas pointer events
                    //   p1.updatePenWidth("brushSlider");
                    //   p1.updatePenColor("brushColorToggle");
                    //   p1.updatePenOpacity("opacitySlider");
                    currentInkController = p1;
                    timeline.setEditInkOn(true);
                    break;

                case "highlight":
                    //create an ink canvas and inkController
                    var inkdiv = createInkCanv();
                    var p1 = new TAG.TourAuthoring.InkAuthoring({
                        spec: spec
                    });
                    var newHeight;
                    currentInkController = p1;
                    isEditingTransparency = false;
                    INITIAL_TRANSPARENCY.createModeButtons();
                    INITIAL_TRANSPARENCY.showForm();
                    INITIAL_TRANSPARENCY.updateInputs();
                    transMode.updateMode('isolate');
                    $('.undoButton').css({ 'opacity': '0.4' });
                    $('.redoButton').css({ 'opacity': '0.4' });
                    self.css({ 'background-color': 'white', 'color': 'black' });
                    playbackControls.undoRedoInkOnly.css({ 'display': 'inline-block' });
                    $('#inkButton').data('selected', false);
                    closeComponentMenu();
                    hideInkControls();
                    hideAll(transArray);
                    inkTransparencyControls.show();
                    newHeight = $("#resizableArea").offset().top + $("#resizableArea").height() - inkTransparencyControls.offset().top - 10;
                    inkTransparencyControls.css({ 'height': newHeight });
                    //   initTrans();
                    $('#inkCanv').css("background", "rgba(0,0,0,0.01)");
                    inkAuthoring = p1;
                    p1.setMode(TAG.TourAuthoring.InkMode.shapes);
                    p1.setEditable(); //in this case, we're just making sure that the artwork can't be manipulated


                    timeline.setEditInkOn(true);
                    break;
            }

            // if this is already selected, unselect it
            var selected = self.data('selected');
            if (selected) {
                self.css({
                    'background-color': 'transparent',
                    'color': 'white'
                });
            }
            self.data('selected', !selected);
            if (!allowInk) {
                $('#inkButton').css({
                    'background-color': 'transparent',
                    'color': 'gray'
                });
            }
        });

        component.append(addComponentButton);
        return addComponentButton;
    }

    /**Called when all artworks/images are deleted; disables ink functionality by graying out "Ink" button
     * @method disableInk
     */
    function disableInk() {
        allowInk = false;
        $('#inkButton').css({ 'background-color': 'transparent', 'color': 'gray' });
        dropInk.hide();
        inkTransparencyControls.css({ 'display': 'none' });
        inkTextControls.css({ 'display': 'none' });
        inkDrawControls.css({ 'display': 'none' });
        timeline.setEditInkOn(false);
        timeline.setModifyingInk(false);
        //if ink is currently being edited but is unattached, remove it if there are no artworks left
        removeInkCanv();
    }

    /**Set componentDropDown state to true to force close
     * @method closeComponentMenu
     */
    function closeComponentMenu() {
        componentDropDown = true;
        addComponentLabel.click();
    }

    /**Creates catalog picker for associated media related to the artwork already imported into the tour (Jessica Fu)
     * @method createCatalogPicker
     */
    (function createCatalogMediaPicker() {
        var associatedMediaPickerHeader = document.createElement('div');
        var associatedsearchbar = $(document.createElement('input'));
        var associatedMediaPickerArtwork = document.createElement('div');
        var associatedMediaPickerMedia = document.createElement('div');

        associatedMediaPicker.addClass("associatedMediaPicker");
        associatedMediaPicker.css({
            position: 'absolute',
            width: '49%',
            height: '49%',
            padding: '1%',
            'background-color': 'black',
            'border': '3px double white',
            top: '25%',
            left: '25%',
        });
        $(associatedMediaPickerOverlay).append(associatedMediaPicker);

        // heading
        $(associatedMediaPickerHeader).addClass('associatedMediaPickerInfo');
        $(associatedMediaPickerHeader).text("Select media to import");
        $(associatedMediaPickerHeader).css({
            'font-size': '100%',
        });

        $(associatedsearchbar).attr('type', 'text');
        associatedsearchbar.addClass('associatesearchbar');
        $(associatedsearchbar).css({
            'float': 'right',
            'margin-right': '3%',
            'margin-top': '0.75%',
            'width': '38%',
            'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")',
            'background-size': 'auto 50%',
            'background-repeat': 'no-repeat',
            'background-position': '4% center'
        });
        $(associatedsearchbar).on('focus', function () {
            $(associatedsearchbar).css({ 'background-image': 'none' });
        });
        $(associatedsearchbar).on('focusout', function () {
            if (!$(associatedsearchbar).val()) {
                $(associatedsearchbar).css({ 'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")' });
            }
        });
        $(associatedsearchbar).on('keyup', function (event) {
            event.stopPropagation();
        });
        //$(associatedsearchbar).attr('placeholder', PICKER_SEARCH_TEXT);
        $(associatedsearchbar).val("");
        associatedsearchbar.keyup(function () {
            TAG.Util.searchData($(associatedsearchbar).val(), '.mediaHolder', IGNORE_IN_SEARCH);
        });
        associatedsearchbar.change(function () {
            TAG.Util.searchData($(associatedsearchbar).val(), '.mediaHolder', IGNORE_IN_SEARCH);
        });
        $(associatedMediaPickerHeader).append(associatedsearchbar);

        associatedMediaPicker.append(associatedMediaPickerHeader);

        // list of artworks in tour that have associated media
        $(associatedMediaPickerArtwork).addClass('associatedMediaPickerArtwork');
        $(associatedMediaPickerArtwork).css({
            position: 'absolute',
            'border-right': '1px solid white',
            top: '15%',
            padding: '1%',
            height: '72%',
            width: '28%',
            overflow: 'auto',
        });
        associatedMediaPicker.append(associatedMediaPickerArtwork);

        // list of associated media
        $(associatedMediaPickerMedia).addClass('associatedMediaPickerMedia');
        $(associatedMediaPickerMedia).css({
            position: 'absolute',
            left: '33%',
            top: '15%',
            padding: '1%',
            height: '72%',
            width: '62%',
            overflow: 'auto',
        });
        associatedMediaPicker.append(associatedMediaPickerMedia);
    })();

    /**Helper function for audio/video associated media double click
     * @method selectMedia
     */
    function selectMedia(selectedArt, track) {
        var positionX = timeManager.getCurrentPx();
        var displayLength = parseFloat(selectedArt.duration);
        var diff,
            newDisplay;
        if (timeManager.getDuration().end < displayLength + timeManager.pxToTime(positionX)) {
            timeManager.setEnd(Math.min(TAG.TourAuthoring.Constants.maxTourLength, displayLength + timeManager.pxToTime(positionX)));
        }
        diff = TAG.TourAuthoring.Constants.maxTourLength - timeManager.pxToTime(positionX);
        newDisplay = (diff < TAG.TourAuthoring.Constants.displayEpsilon) ?
                             track.addDisplay(timeManager.timeToPx(TAG.TourAuthoring.Constants.maxTourLength - TAG.TourAuthoring.Constants.displayEpsilon), TAG.TourAuthoring.Constants.displayEpsilon) :
                             track.addDisplay(positionX, Math.min(diff, displayLength));
        if (timeline.getTracks().length > 0) {
            timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
        }
    }

    /**Get associated media for all artworks in the tour from the server.
     * Creates the media picker dom elements.
     * @method _associatedMediaPick
     */
    function _associatedMediaPick() {
        var loading = $(document.createElement('div'));
        var circle = $(document.createElement('img'));
        var myArtwork = timeline.getRelatedArtworks();
        var allAssociatedMediaHolder = document.createElement('div');                // draw "All Associated Media" Label
        var mediaCache = {};
        var myFilteredArtwork = [];
        var unique;
        var associatedMediaPickerImport = document.createElement('button');
        var associatedMediaPickerCancel = document.createElement('button');


        isUploading = true;
        $(associatedMediaPickerOverlay).fadeIn();
        mediaQueue.clear();
        $('.mediaHolder').css('background-color', 'rgb(34, 34, 34)');
        loading.css({
            'display': 'inline-block',
            'position': 'absolute',
            'left': '3%',
            'bottom': '2%',
        });
        loading.text('Loading...');
        loading.attr('id', 'associatedLoadingLabel');

        circle.attr('src', tagPath + 'images/icons/progress-circle.gif');
        circle.css({
            'height': '30px',
            'width': 'auto',
            'margin-left': '20px',
            'float': 'right',
        });


        $(allAssociatedMediaHolder).addClass('allAssociatedMediaHolder');
        $(allAssociatedMediaHolder).css({
            width: '100%',
            height: '9%',
            margin: '1px 0px 1px 0px',
            background: '#999',
            'padding-left': '3%',
            'padding-top': '3%',
            'font-size': '70%'
        });
        $(allAssociatedMediaHolder).text('All Associated Media');

        loading.append(circle);
        associatedMediaPicker.append(loading);
        $('.associatedMediaPickerArtwork').append(allAssociatedMediaHolder);

        for (var i = 0; i < myArtwork.length ; i++) {
            unique = true;
            for (var j = 0; j < i; j++) {
                if (myArtwork[j] === myArtwork[i]) {
                    unique = false;
                    break;
                }
            }
            if (unique) {
                myFilteredArtwork.push(myArtwork[i]);
            }
        }
        for (var k = 0; k < myFilteredArtwork.length; k++) {
            getArt(k);
        }

        loading.hide(); //hides the loading circle once art is recieved

        /**Single clicking on associated media selects it, to be imported
         * @method mediasingleClick
         * @param mediaHolder
         */
        function mediasingleClick(e, mediaHolder) {
            var index;
            if (mediaHolder) {
                if (mediaHolder.data("selected")) {
                    mediaHolder.data("selected", false);
                    mediaHolder.css('background', '#222');
                    index = artworkIndicesViaURL.indexOf(mediaHolder.data('url'));
                    selectedArtworks.splice(index, 1);
                    artworkIndicesViaURL.splice(index, 1);
                    selectedArtworksUrls[mediaHolder.data('url')] = false;
                    associatedMediaPickerImport.disabled = selectedArtworks.length ? false : true;
                } else {
                    mediaHolder.data({ "selected": true });
                    mediaHolder.css('background', '#999');
                    selectedArtworks.push({ 'url': mediaHolder.data('url'), 'name': mediaHolder.data('name'), 'id': mediaHolder.attr('id'), 'type': mediaHolder.data('type'), 'duration': mediaHolder.data('duration') });
                    artworkIndicesViaURL.push(mediaHolder.data('url'));
                    selectedArtworksUrls[mediaHolder.data('url')] = true;
                    associatedMediaPickerImport.disabled = false;
                }
            }
        }



        /**Double clicking on associated media will import all selected media
         * @method mediadoubleClick
         * @param mediaHolder
         */
        function mediadoubleClick(e, mediaHolder) {
            if (mediaHolder) {
                var i,
                    selectedArt,
                    track,
                    positionX,
                    displayLength,
                    newDisplay,
                    diff,
                    dispLen;
                mediaHolder.css('background', '#999');

                if (mediaHolder.data('selected') !== true) {
                    selectedArtworks.push({ 'url': mediaHolder.data('url'), 'name': mediaHolder.data('name'), 'id': mediaHolder.attr('id'), 'type': mediaHolder.data('type'), 'duration': mediaHolder.data('duration') });
                    mediaHolder.data({
                        "selected": true
                    });
                }
                _clearAssMedia();
                $(associatedMediaPickerOverlay).fadeOut();
                associatedMediaPickerImport.disabled = true;
                //$('.associatedsearchbar').attr('placeholder', PICKER_SEARCH_TEXT);
                if (selectedArtworks && selectedArtworks.length) {
                    for (i = 0; i < selectedArtworks.length; i++) {
                        selectedArt = selectedArtworks[i];
                        if (selectedArt.type === "Video") {
                            track = timeline.addVideoTrack(selectedArt.url, selectedArt.name, null, selectedArt.duration);
                            selectMedia(selectedArt, track);
                        } else if (selectedArt.type === "Image") {
                            track = timeline.addImageTrack(selectedArt.url, selectedArt.name);
                            positionX = timeManager.getCurrentPx();
                            displayLength = 5;
                            dispLen = Math.min(displayLength, timeManager.getDuration().end - timeManager.pxToTime(positionX));
                            newDisplay = (dispLen < TAG.TourAuthoring.Constants.displayEpsilon) ? track.addDisplay(timeManager.timeToPx(timeManager.getDuration().end - TAG.TourAuthoring.Constants.displayEpsilon), TAG.TourAuthoring.Constants.displayEpsilon) : track.addDisplay(positionX, dispLen);
                            if (dispLen < 1.5 && dispLen >= TAG.TourAuthoring.Constants.displayEpsilon) {
                                newDisplay.setIn(0);
                                newDisplay.setOut(0);
                                newDisplay.setMain(dispLen);
                            }
                            if (timeline.getTracks().length > 0) {
                                timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                            }
                        } else if (selectedArt.type === "Audio") {
                            track = timeline.addAudioTrack(selectedArt.url, selectedArt.name, null, selectedArt.duration);
                            selectMedia(selectedArt, track);
                        } else {
                            console.log('Unrecognized file type imported');
                        }
                    }
                    undoManager.combineLast(2 * selectedArtworks.length);
                }
            }
            //$('.associatedsearchbar').attr('placeholder', PICKER_SEARCH_TEXT);
            $('.associatedsearchbar').val("");
            isUploading = false;
            timeline.getDataHolder().mapTracks(function (container, i) {
                container.track.updatePos(i);
            });
        }

        /**This handles discriminating between the double and single clicks for importing media
         * cleans up bugs where both click events were firing and media would import twice
         * @method assMediasingleDoubleclick
         * @param {HTML Element} mediaHolder
         */
        function assMediasingleDoubleclick(mediaHolder) {
            mediaHolder.click(function (e) {
                var that = this;
                setTimeout(function () {
                    var dblclick = parseInt($(that).data('double'), 10);
                    if (dblclick > 0) {
                        $(that).data('double', dblclick - 1);
                    } else {
                        mediasingleClick.call(that, e, mediaHolder);
                    }
                }, 300);
            }).dblclick(function (e) {
                $(this).data('double', 2);
                mediadoubleClick.call(this, e, mediaHolder);
            });
        }

        /**Get associated media and cache them in array associated with the guid of each artwork
         * @method getArt
         * @param {Number} i
         */
        function getArt(i) {
            TAG.Worktop.Database.getAssocMediaTo(myFilteredArtwork[i], function (doqs) {
                var mediaArray = [];
                var k = 0;
                var doq;
                var c1,
                    c2,
                    c3;
                var mediaHolderDocfrag = document.createDocumentFragment();

                doqs.sort(function (a, b) {
                    return a.Name.toLowerCase() < b.Name.toLowerCase() ? -1 : 1;
                });

                if (doqs) {
                    for (var j = 0; j < doqs.length; j++) {
                        k++;
                        doq = doqs[j];
                        c1 = (doq.Metadata.ContentType === 'Video' || doq.Metadata.ContentType === 'Audio');
                        c2 = (doq.Metadata.Duration <= TAG.TourAuthoring.Constants.maxTourLength && doq.Metadata.Duration >= TAG.TourAuthoring.Constants.minMediaLength);
                        c3 = (c2 || doq.Metadata.Duration === undefined);
                        if ((c1 && c3) || doq.Metadata.ContentType === 'Image') {           //make sure no text associated media for now
                            mediaArray.push(doq);
                        }
                        if (k === doqs.length) { // just put this outside loop
                            mediaCache[myFilteredArtwork[i]] = mediaArray;
                            if (mediaArray.length > 0) { //only shows artworks with at least one associated media
                                drawAssociatedMedia(mediaCache[myFilteredArtwork[i]], assMediasingleDoubleclick, mediaHolderDocfrag);// create dom elements for this artwork's associated media
                                // retrieve titles of artworks that have at least one associated media, create divs for them in the artwork list
                                TAG.Worktop.Database.getDoq(myFilteredArtwork[i], function (nextArt) {
                                    var name;
                                    var hasSpace = false;
                                    var scanLength;
                                    var artworkHolder = document.createElement('div');

                                    if (nextArt.Name.length > 15) {
                                        scanLength = Math.min(nextArt.Name.length, 25);
                                        for (var j = 14; j < scanLength ; j++) {
                                            if (nextArt.Name[j] === " " && !hasSpace) {
                                                name = nextArt.Name.substr(0, j) + "...";
                                                hasSpace = true;
                                            } else if (nextArt.Name[j] === "-" && j !== (scanLength - 1) && !hasSpace) {
                                                if (nextArt.Name[j + 1] === " ") {
                                                    name = nextArt.Name.substr(0, j) + "...";
                                                    hasSpace = true;
                                                }
                                            }
                                        }
                                        if (!hasSpace) {
                                            name = nextArt.Name.substr(0, 25) + "...";
                                        }
                                    } else {
                                        name = nextArt.Name;
                                    }

                                    $(artworkHolder).addClass('artworkHolder');
                                    $(artworkHolder).attr('id', nextArt.Identifier);
                                    $(artworkHolder).css({
                                        width: '100%',
                                        height: '9%',
                                        margin: '1px 0px 1px 0px',
                                        'font-size': '70%',
                                        'padding-left': '3%',
                                        'padding-top': '3%',
                                    });
                                    $(artworkHolder).text(name);
                                    $('.associatedMediaPickerArtwork').append(artworkHolder);
                                    $(artworkHolder).on('click', function () {
                                        var selected = $(artworkHolder).attr('id');
                                        var artworkAMDocfrag = document.createDocumentFragment();
                                        mediaQueue.clear();
                                        $(".allAssociatedMediaHolder").css('background', 'black');
                                        $(".artworkHolder").css('background', 'black');
                                        $(artworkHolder).css('background', '#999');
                                        $(".mediaHolder").detach();
                                        drawAssociatedMedia(mediaCache[selected], assMediasingleDoubleclick, artworkAMDocfrag);
                                        associatedMediaPickerImport.disabled = selectedArtworks.length ? false : true;
                                        TAG.Util.searchData($('.associatedsearchbar').val(), '.mediaHolder', IGNORE_IN_SEARCH);
                                    });
                               });
                            }
                        }
                    }
                }
            });
        }


        // "All Associated Media" button click handler
        $(allAssociatedMediaHolder).click(function () {
            $(".artworkHolder").css('background', 'black');
            $(allAssociatedMediaHolder).css('background', '#999');
            $(".mediaHolder").detach();
            for (var i = 0; i < myArtwork.length; i++) {
                var allAMDocfrag = document.createDocumentFragment();
                drawAssociatedMedia(mediaCache[myFilteredArtwork[i]], assMediasingleDoubleclick, allAMDocfrag);
            }
            associatedMediaPickerImport.disabled = selectedArtworks.length ? false : true;
            TAG.Util.searchData($('.associatedsearchbar').val(), '.mediaHolder', IGNORE_IN_SEARCH);
        });


        


        /*
        function loadInArtworks(artworks) {
            var i;
            var artHolderImageHolder = document.createElement('div');
            var artHolderImage = document.createElement('img');

            for (i = 0; i < artworks.length; i++) {
                if (artworks[i].Type === 'Empty') {
                    artworks.splice(i, 1);
                    i--;
                }
            }
            artworks.sort(function (a, b) {
                return a.Name.toLowerCase() < b.Name.toLowerCase() ? -1 : 1;
            });

            $.each(artworks, function (i, artwork) {
                artQueue.add(function () {
                    var artHolder = document.createElement('div');
                    var exhibits = [];
                    var ids = "";
                    var artHolderText = document.createElement('div');
                    var name = artwork.Name;
                    var hasSpace = false;
                    var scanLength;

                    if (selectedExhib)
                        $(artHolder).hide().data('visible', false);
                    for (var j = 0; j < artwork._Folders.FolderData.length; j++) {
                        exhibits.push(artwork._Folders.FolderData[j]);
                        if (selectedExhib === artwork._Folders.FolderData[j].FolderId)
                            $(artHolder).show().data('visible', true);
                        ids += artwork._Folders.FolderData[j].FolderId + " ";
                    }
                    $(artHolder).attr('class', 'artButton ' + ids);
                    $(artHolder).data({
                        name: artwork.Name,
                        artist: artwork.Metadata.Artist,
                        year: artwork.Metadata.Year,
                    });
                    $(artHolder).data('exhibits', exhibits);
                    $(artHolder).addClass("artHolder");
                    $(artHolder).attr('id', artwork.Identifier); // unique artwork identifier
                    $(artHolder).data('name', artwork.Name);
                    $(artHolder).data('type', artwork.Metadata.Type);

                    if (artwork.Metadata.Duration) { //for videos
                        $(artHolder).data('duration', artwork.Metadata.Duration);
                        $(artHolder).data('url', artwork.Metadata.Source);
                    } else {
                        $(artHolder).data('url', artwork.Metadata.DeepZoom);
                    }
                    $(artHolder).css({
                        float: 'left',
                        background: '#222',
                        width: '48%',
                        height: '25%',
                        padding: '2px',
                        margin: '1px',
                    });
                    $(catalogPickerArtworks).append(artHolder);
                    TAG.Util.searchData($(searchbar).val(), '.artButton', IGNORE_IN_SEARCH);

                    $(artHolderImageHolder).addClass('artHolderImageHolder');
                    $(artHolderImageHolder).css({
                        float: 'left',
                        position: 'relative',
                        width: '40%',
                        margin: '3.5%',
                        height: '80%',
                        'overflow': 'hidden',
                    });
                    $(artHolder).append(artHolderImageHolder);

                    // create image for artwork holder
                    $(artHolderImage).addClass('artHolderImage');
                    $(artHolderImage).attr('src', TAG.Worktop.Database.fixPath(artwork.Metadata.Thumbnail));
                    $(artHolderImage).css({
                        position: 'absolute',
                        'width': 'auto',
                        'height': 'auto',
                        'max-height': '100%',
                        'max-width': '100%',
                        'top': '0',
                        'bottom': '0',
                        'left': '0',
                        'right': '0',
                        'margin': 'auto'
                    });
                    $(artHolderImageHolder).append(artHolderImage);

                    // create text for artwork holder
                    $(artHolderText).addClass('artHolderText');
                    if (name.length > 23) {
                        scanLength = Math.min(name.length, 35);
                        for (var i = 20; i < scanLength ; i++) {
                            if (name[i] === " " && !hasSpace) {
                                name = name.substr(0, i) + "...";
                                hasSpace = true;
                            } else if (name[i] === "-" && i !== (scanLength - 1) && !hasSpace) {
                                if (name[i + 1] === " ") {
                                    name = name.substr(0, i) + "...";
                                    hasSpace = true;
                                }
                            }
                        }
                        if (!hasSpace) {
                            name = name.substr(0, 24) + "...";
                        }
                    }

                    $(artHolderText).text(name);
                    $(artHolderText).css({
                        floar: 'left',
                        'padding-left': '3%',
                        'padding-right': '4.5%',
                        'font-size': '100%',
                        'margin': '5% 0 5% 2%',
                        'overflow': 'hidden',
                        'word-wrap': 'break-word',
                    });
                    $(artHolder).append(artHolderText);
                    singleDoubleclick($(artHolder));
                });
            });
            artQueue.add(function () {
                loading.hide();
            });
        }
        */

        /**Click handlers for all artwork name buttons
         * @method artworkHolderClick
         * @param artworkHolder
         */
        //(function artworkHolderClick(artworkHolder) {
            //$('.artworkHolder').off('click');
            
        //})();

        // create import button
        associatedMediaPickerImport.disabled = true;
        $(associatedMediaPickerImport).text("Import");
        $(associatedMediaPickerImport).css({
            position: 'absolute',
            bottom: '1%',
            right: '22%',
        });

        // click handler for import button -- perform the import using selectedArtworks.*
        $(associatedMediaPickerImport).click(function () {
            var selectedArt,
                i,
                track,
                positionX,
                newDisplay,
                dispLen,
                displayLength,
                diff;
            _clearAssMedia();
            $(associatedMediaPickerOverlay).fadeOut();
            associatedMediaPickerImport.disabled = true;
            //$('.associatedsearchbar').attr('placeholder', PICKER_SEARCH_TEXT);
            if (selectedArtworks && selectedArtworks.length) {
                for (i = 0; i < selectedArtworks.length; i++) {
                    selectedArt = selectedArtworks[i];
                    if (selectedArt.type === "Video") {
                        track = timeline.addVideoTrack(selectedArt.url, selectedArt.name, null, selectedArt.duration);
                        selectMedia(selectedArt, track);
                    } else if (selectedArt.type === "Image") {
                        track = timeline.addImageTrack(selectedArt.url, selectedArt.name);
                        positionX = timeManager.getCurrentPx();
                        displayLength = 5;
                        dispLen = Math.min(displayLength, timeManager.getDuration().end - timeManager.pxToTime(positionX));
                        newDisplay = (dispLen < TAG.TourAuthoring.Constants.displayEpsilon) ? track.addDisplay(timeManager.timeToPx(timeManager.getDuration().end - TAG.TourAuthoring.Constants.displayEpsilon), TAG.TourAuthoring.Constants.displayEpsilon) : track.addDisplay(positionX, dispLen);
                        if (dispLen < 1.5 && dispLen >= TAG.TourAuthoring.Constants.displayEpsilon) {
                            newDisplay.setIn(0);
                            newDisplay.setOut(0);
                            newDisplay.setMain(dispLen);
                        }
                        if (timeline.getTracks().length > 0) {
                            timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                        }
                    } else if (selectedArt.type === "Audio") {
                        track = timeline.addAudioTrack(selectedArt.url, selectedArt.name, null, selectedArt.duration);
                        selectMedia(selectedArt, track);
                    } else {
                        console.log('Unrecognized file type imported!!!???');
                    }
                }
                undoManager.combineLast(2 * selectedArtworks.length);
            }
            //$('.associatedsearchbar').attr('placeholder', PICKER_SEARCH_TEXT);
            $('.associatedsearchbar').val("");
            isUploading = false;
            timeline.getDataHolder().mapTracks(function (container, i) {
                container.track.updatePos(i);
            });
        });
        associatedMediaPicker.append(associatedMediaPickerImport);


        // cancel button
        $(associatedMediaPickerCancel).text("Cancel");
        $(associatedMediaPickerCancel).css({
            position: 'absolute',
            bottom: '1%',
            right: '5%'
        });

        // cancel button click handler
        $(associatedMediaPickerCancel).click(function () {
            _clearAssMedia();
            $(associatedMediaPickerOverlay).fadeOut();
            associatedMediaPickerImport.disabled = true;
            //$('.associatedsearchbar').attr('placeholder', PICKER_SEARCH_TEXT);
            $('.associatedsearchbar').val("");
            $('.mediaHolder').data('selected', 'false');
            $('.mediaHolder').css('background-color', 'rgb(34,34,34)');
            return undefined;
        });
        associatedMediaPicker.append(associatedMediaPickerCancel);

        /**Detach picker elements
         * @method _clearAssMedia
         */
        function _clearAssMedia() {
            $(".mediaHolder").detach();
            $(".artworkHolder").detach();
            $(".allAssociatedMediaHolder").detach();
            $('#associatedLoadingLabel').detach();
        }
    }

    /**Creates the media panel for the media associated to a given artwork. Each is given a .mediaHolder-class container.
     * @method drawAssociatedMedia
     * @param mediaArray   the list of media to appear in the panel
     * @param applyClick
     * @param {HTML Element} docfrag
     */
    function drawAssociatedMedia(mediaArray, applyClick, docfrag) {
        if (mediaArray) {
            for (var i = 0; i < mediaArray.length; i++) {
                mediaQueue.add(createMediaHolder(mediaArray[i], applyClick));
            }
        }
    }

    /**Creates the div holding the current media object's information
     * @method  createMediaHolder
     * @param {Object} media
     * @param applyClick
     * @return {Function}  function creating media holder
     */
    function createMediaHolder(media, applyClick) {
        return function () {
            var mediaHolder = $(document.createElement('div'));
            var mediaHolderImageHolder = $(document.createElement('div'));
            var mediaHolderImage = $(document.createElement('img'));
            var mediaHolderText = $(document.createElement('div'));
            var isSelected;
            var name = media.Name;
            var hasSpace = false;
            var scanLength = Math.min(name.length, 24);

            mediaHolder.addClass("mediaHolder");
            mediaHolder.attr('id', media.Identifier);                                   // unique identifier for this media
            mediaHolder.data('type', media.Metadata.ContentType);
            mediaHolder.data('url', media.Metadata.Source);                             // store url as data
            mediaHolder.data('name', media.Name);
            mediaHolder.data('duration', media.Metadata.Duration);
            mediaHolder.data('description', media.Metadata.Description);
            isSelected = selectedArtworksUrls[media.Metadata.Source] ? true : false;
            mediaHolder.data('selected', isSelected);
            mediaHolder.css({
                float: 'left',
                background: isSelected ? '#999' : '#222',
                width: '48%',
                height: '25%',
                padding: '2px',
                margin: '1px',
            });

            mediaHolderImageHolder.addClass('mediaHolderImageHolder');
            mediaHolderImageHolder.css({
                float: 'left',
                position: 'relative',
                width: '40%',
                margin: '3.5%',
                height: '80%',
                'overflow': 'hidden'
            });

            mediaHolderImage.addClass('mediaHolderImage');                              // create the thumbnail to show in the media holder
            if (media.Metadata.ContentType === 'Audio') {
                mediaHolderImage.attr('src', tagPath + 'images/audio_icon.svg');
            } else if (media.Metadata.ContentType === 'Video') {
                mediaHolderImage.attr('src', (media.Metadata.Thumbnail && !media.Metadata.Thumbnail.match(/.mp4/)) ? TAG.Worktop.Database.fixPath(media.Metadata.Thumbnail) : tagPath + 'images/video_icon.svg');
            } else if (media.Metadata.ContentType === 'Image') {
                mediaHolderImage.attr('src', media.Metadata.Thumbnail ? TAG.Worktop.Database.fixPath(media.Metadata.Thumbnail) : tagPath + 'images/image_icon.svg');
            } else {                                                                    //text associated media without any media...
                mediaHolderImage.attr('src', tagPath + 'images/text_icon.svg');
            }
            mediaHolderImage.css({
                'max-height': '100%',
                'position': 'absolute',
                'left': '0',
                'right': '0',
                'top': '0',
                'bottom': '0',
                'margin': 'auto',
                'display': 'block',
                'max-width': '100%',
                width: 'auto',
                //position: 'absolute',
                //'width': '40%',
                //'height': '80%',
                //'max-width': '100%',
                //'max-height': '100%',
                //top: 0,
                //bottom: 0,
                //left: 0,
                //right: 0,
                //margin: 'auto',
                //'text-align': 'center'
            });
            mediaHolderImage.removeAttr('width');
            mediaHolderText.addClass('mediaHolderText');                                // create the text to show in the media holder

            //trims off long names
            if (name.length > 15) {
                for (var i = 14; i < scanLength ; i++) {
                    if (name[i] === " " && !hasSpace) {
                        name = name.substr(0, i) + "...";
                        hasSpace = true;
                    } else if (name[i] === "-" && i !== (scanLength - 1) && !hasSpace) {
                        if (name[i + 1] === " ") {
                            name = name.substr(0, i) + "...";
                            hasSpace = true;
                        }
                    }
                }
                if (!hasSpace) {
                    name = name.substr(0, 16) + "...";
                }
            }
            mediaHolderText.text(name);
            mediaHolderText.css({
                floar: 'left',
                'padding-left': '3%',
                'padding-right': '4.5%',
                'font-size': '70%',
                'margin': '5% 0 5% 2%',
                'overflow': 'hidden',
                'word-wrap': 'break-word',
            });

            $('.associatedMediaPickerMedia').append(mediaHolder);
            mediaHolder.append(mediaHolderImageHolder);
            mediaHolderImageHolder.append(mediaHolderImage);
            mediaHolder.append(mediaHolderText);
            applyClick(mediaHolder);
        }
    }

    /**Creates picker for importing artworks as tour tracks
     * @method createCatalogPicker
     */
    (function createCatalogPicker() {
        var catalogPickerHeader = document.createElement('div');							// creates the header for the artwork catalog picker
        var searchbar = $(document.createElement('input'));
        var catalogPickerExhibitions = document.createElement('div');						// creates the exhibitions panel in the artwork catalog picker
        var catalogPickerArtworks = document.createElement('div');							// creates the artwork panel in the artwork catalog picker

        catalogPicker.addClass("catalogPicker");
        catalogPicker.css({
            position: 'absolute',
            width: '49%',
            height: '49%',
            padding: '1%',
            'background-color': 'black',
            'border': '3px double white',
            top: '25%',
            left: '25%',
        });
        $(catalogPickerHeader).addClass('catalogPickerInfo');
        $(catalogPickerHeader).text("Select artwork to import");
        $(catalogPickerHeader).css({
            'font-size': '100%',
            'float': 'left',
        });

        searchbar.attr('id', 'searchbar');
        $(searchbar).css({
            'float': 'right',
            'margin-right': '3%',
            'margin-top': '0.75%',
            'width': '38%',
            'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")',
            'background-size': 'auto 50%',
            'background-repeat': 'no-repeat',
            'background-position': '4% center'
        });
        $(searchbar).on('focus', function () {
            $(searchbar).css({ 'background-image': 'none' });
        });
        $(searchbar).on('focusout', function () {
            if (!$(searchbar).val()) {
                $(searchbar).css({ 'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")' });
            }
        });
        $(searchbar).on('keyup', function (event) {
            event.stopPropagation();
        });
        $(searchbar).attr('type', 'text');
        //$(searchbar).attr('placeholder', PICKER_SEARCH_TEXT);
        searchbar.keyup(function () {
            TAG.Util.searchData($(searchbar).val(), '.artButton', IGNORE_IN_SEARCH);
        });
        searchbar.change(function () {
            TAG.Util.searchData($(searchbar).val(), '.artButton', IGNORE_IN_SEARCH);
        });

        $(catalogPickerExhibitions).addClass('catalogPickerExhibitions');
        $(catalogPickerExhibitions).css({
            position: 'absolute',
            'border-right': '1px solid white',
            top: '13%',
            padding: '1%',
            height: '73%',
            width: '28%',
            overflow: 'auto',
        });

        $(catalogPickerArtworks).addClass('catalogPickerArtworks');
        $(catalogPickerArtworks).css({
            position: 'absolute',
            left: '33%',
            top: '13%',
            padding: '1%',
            height: '73%',
            width: '62%',
            overflow: 'auto',
        });

        $(catalogPickerOverlay).append(catalogPicker);
        catalogPicker.append(catalogPickerHeader);
        catalogPicker.append(searchbar);
        catalogPicker.append(catalogPickerExhibitions);
        catalogPicker.append(catalogPickerArtworks);
    })();

    /**Gets artwork from server, displays catalogPicker
     * @method _catalogPick
     * @return artwork id
     */
    function _catalogPick() {
        var selectedExhib;
        var allArtworksHolder = document.createElement('div');
        var loading = $(document.createElement('div'));
        var circle = $(document.createElement('img'));
        var catalogPickerCancel = document.createElement('button');

        selectedArtworks = [];
        selectedArtworksUrls = {};
        artworkIndicesViaURL = [];
        isUploading = true;
        artQueue.clear();

        $(allArtworksHolder).addClass('allArtworksHolder');
        $(allArtworksHolder).css({
            width: '100%',
            height: '9%',
            margin: '1px 0px 1px 0px',
            background: '#999',
            'padding-left': '3%',
            'padding-top': '3%',
            'font-size': '70%'
        });
        $(allArtworksHolder).text('All Artworks');
        $('.catalogPickerExhibitions').append(allArtworksHolder);

        loading.css({
            'display': 'inline-block',
            'position': 'absolute',
            'left': '3%',
            'bottom': '2%',
        });
        loading.text('Loading...');
        loading.attr('id', 'loadingLabel');

        circle.attr('src', tagPath + 'images/icons/progress-circle.gif');
        circle.css({
            'height': '30px',
            'width': 'auto',
            'margin-left': '20px',
            'float': 'right',
        });
        loading.append(circle);

        TAG.Worktop.Database.getExhibitions(function (exhibitions) {
            var origName;
            var name;
            var hasSpace = false;
            var scanLength;
            var exhibHolder;
            var write;

            
            // draw exhibition holders for each exhibition
            for (var i = 0; i < exhibitions.length; i++) {
                origName = exhibitions[i].Name;
                if (origName.length > 15) {
                    scanLength = Math.min(origName.length, 25);
                    for (var j = 14; j < scanLength ; j++) {
                        if (origName[j] === " " && !hasSpace) {
                            name = origName.substr(0, j) + "...";
                            hasSpace = true;
                        } else if (origName[j] === "-" && j !== (scanLength - 1) && !hasSpace) {
                            if (origName[j + 1] === " ") {
                                name = origName.substr(0, j) + "...";
                                hasSpace = true;
                            }
                        }
                    }
                    if (!hasSpace) {
                        name = origName.substr(0, 25) + "...";
                    }
                } else {
                    name = origName;
                }
                if (origName.length > 25) {
                    write = origName.substr(0, 25) + "...";
                } else {
                    write = origName;
                }
                
                exhibHolder = $(document.createElement('div'));
                exhibHolder.addClass('exhibHolder');
                exhibHolder.attr('id', exhibitions[i].Identifier);
                exhibHolder.css({
                    width: '100%',
                    height: '9%',
                    'text-overflow': 'ellipsis',
                    margin: '1px 0px 1px 0px',
                    'font-size': '70%',
                    'padding-left': '3%',
                    'padding-top': '3%',
                });
                exhibHolder.text(write);
                $('.catalogPickerExhibitions').append(exhibHolder);
                // click handler for general exhibition button
                makeExhibClickable(exhibHolder);
            }

            /**Click handler for artwork labels
            * @method makeExhibClickable
            * @param exhibHolder
            */
            function makeExhibClickable(exhibHolder) {
                exhibHolder.click(function () {
                    var selected = exhibHolder.attr('id');
                    $(".allArtworksHolder").css('background', 'black');
                    $(".exhibHolder").css('background', 'black');
                    exhibHolder.css('background', '#999');
                    selectedExhib = selected;
                    $('.catalogPickerArtworks').empty();
                    catalogPickerImport.disabled = selectedArtworks.length ? false : true;
                    $('.artButton').hide().data('visible', false);
                    $('.' + selected).show().data('visible', true);
                    TAG.Util.searchData($(searchbar).val(), '.artButton', IGNORE_IN_SEARCH);
                    TAG.Worktop.Database.getArtworksIn(exhibHolder.attr('id'), loadInArtworks, function () {
                        console.log("error");
                    }, function () {
                        console.log("error2");
                    });
                });
            }

            TAG.Worktop.Database.getArtworks(loadInArtworks, function () {
                console.log("error");
            }, function () {
                console.log("error2");
            });
        });

        /**Puts artworks in a queus to be loaded
         * @method loadInArtworks
         * @param {Array} artworks
         */
        function loadInArtworks(artworks) {
            var i;

            for (i = 0; i < artworks.length; i++) {
                if (artworks[i].Type === 'Empty') {
                    artworks.splice(i, 1);
                    i--;
                }
            }
            artworks.sort(function (a, b) {
                return a.Name.toLowerCase() < b.Name.toLowerCase() ? -1 : 1;
            });

            $.each(artworks, function (i, artwork) {
                artQueue.add(function () {
                    var artHolder = document.createElement('div');
                    var exhibits = [];
                    var ids = "";
                    var artHolderText = document.createElement('div');
                    var artHolderImageHolder = document.createElement('div');
                    var artHolderImage = document.createElement('img');
                    var name = artwork.Name;
                    var hasSpace = false;
                    var scanLength;

                    if (selectedExhib)
                        $(artHolder).hide().data('visible', false);
                    for (var j = 0; j < artwork._Folders.FolderData.length; j++) {
                        exhibits.push(artwork._Folders.FolderData[j]);
                        if (selectedExhib === artwork._Folders.FolderData[j].FolderId)
                            $(artHolder).show().data('visible', true);
                        ids += artwork._Folders.FolderData[j].FolderId + " ";
                    }
                    $(artHolder).attr('class', 'artButton ' + ids);
                    $(artHolder).data({
                        name: artwork.Name,
                        artist: artwork.Metadata.Artist,
                        year: artwork.Metadata.Year,
                    });
                    $(artHolder).data('exhibits', exhibits);
                    $(artHolder).addClass("artHolder");
                    $(artHolder).attr('id', artwork.Identifier); // unique artwork identifier
                    $(artHolder).data('name', artwork.Name);
                    $(artHolder).data('type', artwork.Metadata.Type);
                    $(artHolder).data('description', artwork.Metadata.Description);
                    if (artwork.Metadata.InfoFields) {
                        $.each(artwork.Metadata.InfoFields, function (field, fieldText) {           //Adding custom metadata fields: both keys and values
                            $(artHolder).data(field, fieldText);
                        });
                    }

                    if (artwork.Metadata.Duration) { //for videos
                        $(artHolder).data('duration', artwork.Metadata.Duration);
                        $(artHolder).data('url', artwork.Metadata.Source);
                    } else {
                        $(artHolder).data('url', artwork.Metadata.DeepZoom);
                    }
                    $(artHolder).css({
                        float: 'left',
                        background: '#222',
                        width: '48%',
                        height: '25%',
                        padding: '2px',
                        margin: '1px',
                    });
                    $('.catalogPickerArtworks').append(artHolder);
                    TAG.Util.searchData($('#searchbar').val(), '.artButton', IGNORE_IN_SEARCH);

                    $(artHolderImageHolder).addClass('artHolderImageHolder');
                    $(artHolderImageHolder).css({
                        float: 'left',
                        position: 'relative',
                        width: '40%',
                        margin: '3.5%',
                        height: '80%',
                        'overflow': 'hidden',
                    });
                    $(artHolder).append(artHolderImageHolder);

                    // create image for artwork holder
                    $(artHolderImage).addClass('artHolderImage');
                    $(artHolderImage).attr('src', TAG.Worktop.Database.fixPath(artwork.Metadata.Thumbnail));
                    if (artwork.Metadata.ContentType === 'Video' || artwork.Type === 'Video' || artwork.Metadata.Type === 'VideoArtwork') {
                        $(artHolderImage).attr('src', (artwork.Metadata.Thumbnail && !artwork.Metadata.Thumbnail.match(/.mp4/)) ? TAG.Worktop.Database.fixPath(artwork.Metadata.Thumbnail) : tagPath + 'images/video_icon.svg');
                    }
                    $(artHolderImage).css({
                        'max-height': '100%',
                        'position': 'absolute',
                        'left': '0',
                        'right': '0',
                        'top': '0',
                        'bottom': '0',
                        'margin': 'auto',
                        'display': 'block',
                        'max-width': '100%',
                        width: 'auto',
                        //position: 'absolute',
                        //'width': 'auto',
                        ////'height': 'auto',
                        //'max-width': '100%',
                        //'max-height': '100%',
                        //display:'block',
                        //top: 0,
                        //bottom: 0,
                        //left: 0,
                        //right: 0,
                        //margin: 'auto',
                    });
                    $(artHolderImageHolder).append(artHolderImage);

                    // create text for artwork holder
                    $(artHolderText).addClass('artHolderText');
                    if (name.length > 23) {
                        scanLength = Math.min(name.length, 35);
                        for (var i = 20; i < scanLength ; i++) {
                            if (name[i] === " " && !hasSpace) {
                                name = name.substr(0, i) + "...";
                                hasSpace = true;
                            } else if (name[i] === "-" && i !== (scanLength - 1) && !hasSpace) {
                                if (name[i + 1] === " ") {
                                    name = name.substr(0, i) + "...";
                                    hasSpace = true;
                                }
                            }
                        }
                        if (!hasSpace) {
                            name = name.substr(0, 24) + "...";
                        }
                    }

                    $(artHolderText).text(name);
                    $(artHolderText).css({
                        floar: 'left',
                        'padding-left': '3%',
                        'padding-right': '4.5%',
                        'font-size': '70%',
                        'margin': '5% 0 5% 2%',
                        'overflow': 'hidden',
                        'word-wrap': 'break-word',
                    });
                    $(artHolder).append(artHolderText);
                    singleDoubleclick($(artHolder));
                });
            });
            artQueue.add(function () {
                loading.hide();
            });
        }

        /**Single clicking selects/deselects artworks to be imported
         * @method singleClick
         * @param {Event} e
         * @param {HTML Element} artHolder
         */
        function singleClick(e, artHolder) {
            var index,
                urlindex;
            if (artHolder.data('selected')) {
                artHolder.css('background', '#222');
                artHolder.data('selected', false);
                urlindex = artworkIndicesViaURL.indexOf(artHolder.data('url'));
                selectedArtworks.splice(urlindex, 1);
                artworkIndicesViaURL.splice(urlindex, 1);
                selectedArtworksUrls[artHolder.data('url')] = false;
                catalogPickerImport.disabled = selectedArtworks.length ? false : true;
            } else {
                artHolder.css('background', '#999');
                artHolder.data({
                    'selected': true
                });
                if (artworkIndicesViaURL.indexOf(artHolder.data('url')) === -1) {
                    selectedArtworks.push({ 'url': artHolder.data('url'), 'name': artHolder.data('name'), 'id': artHolder.attr('id'), 'type': artHolder.data('type'), 'duration': artHolder.data('duration') });
                    artworkIndicesViaURL.push(artHolder.data('url'));
                    selectedArtworksUrls[artHolder.data('url')] = true;
                }
                catalogPickerImport.disabled = false;
            }
        }

        /**Double clicking will import all selected artworks
         * @method {Event} e
         * @param artHolder
         */
        function doubleClick(e, artHolder) {
            var i,
                selectedArt,
                track,
                positionX,
                displayLength,
                dispLen,
                newDisplay;

            // get artwork selected
            catalogPickerImport.disabled = false;
            artHolder.css('background', '#999');
            if (!selectedArtworksUrls[artHolder.data('url')] && artHolder.data('selected') !== true) {
                selectedArtworks.push({ 'url': artHolder.data('url'), 'name': artHolder.data('name'), 'id': artHolder.attr('id'), 'type': artHolder.data('type'), 'duration': artHolder.data('duration') });
                selectedArtworksUrls[artHolder.data('url')] = true;
                artHolder.data({
                    'selected': true
                });
            }
            $(catalogPickerOverlay).fadeOut();
            _clearCatalog();
            //$(searchbar).attr('placeholder', PICKER_SEARCH_TEXT);
            $(searchbar).val("");
            // add the artwork track to the timeline
            for (i = 0; i < selectedArtworks.length; i++) {
                selectedArt = selectedArtworks[i];
                if (selectedArt.type === "VideoArtwork") {
                    track = timeline.addVideoTrack(selectedArt.url, selectedArt.name, null, selectedArt.duration);
                    selectMedia(selectedArt, track);
                } else {
                    track = timeline.addArtworkTrack(selectedArt.url, selectedArt.name, selectedArt.id, selectedArt.type);
                    positionX = timeManager.getCurrentPx();
                    displayLength = 5;
                    dispLen = Math.min(displayLength, timeManager.getDuration().end - timeManager.pxToTime(positionX));
                    newDisplay = (dispLen < TAG.TourAuthoring.Constants.displayEpsilon) ? track.addDisplay(timeManager.timeToPx(timeManager.getDuration().end - TAG.TourAuthoring.Constants.displayEpsilon), TAG.TourAuthoring.Constants.displayEpsilon) : track.addDisplay(positionX, dispLen);
                    if (dispLen < 1.5 && dispLen >= TAG.TourAuthoring.Constants.displayEpsilon) {
                        newDisplay.setIn(0);
                        newDisplay.setOut(0);
                        newDisplay.setMain(dispLen);
                    }
                    if (timeline.getTracks().length > 0) {
                        timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                    }
                }
            }
            undoManager.combineLast(2 * selectedArtworks.length); 							// allow undo/redo to perform both actions (addTrack, addDisplay) at once
            isUploading = false;
            timeline.getDataHolder().mapTracks(function (container, i) {
                container.track.updatePos(i);
            });
        }

        /**This handles discriminating between the double and single clicks for importing artworks
         * cleans up bugs where both click events were firing and artworks would import twice
         * @method singleDoubleclick
         * @param {HTML Element} artHolder
         */
        function singleDoubleclick(artHolder) {
            artHolder.click(function (e) {
                var that = this;
                setTimeout(function () {
                    var dblclick = parseInt($(that).data('double'), 10);
                    if (dblclick > 0) {
                        $(that).data('double', dblclick - 1);
                    } else {
                        singleClick.call(that, e, artHolder);
                    }
                }, 300);
            }).dblclick(function (e) {
                $(this).data('double', 2);
                doubleClick.call(this, e, artHolder);
            });
        }


        // click handler for the "all artworks" button
        $(allArtworksHolder).on('click', function () {
            $(".exhibHolder").css('background', 'black');
            $(this).css('background', '#999');
            catalogPickerImport.disabled = selectedArtworks.length ? false : true;
            $('.catalogPickerArtworks').empty();
            $('.artButton').show().data('visible', true);
            TAG.Util.searchData($(searchbar).val(), '.artButton', IGNORE_IN_SEARCH);
            selectedExhib = null;
            if (allArtworks) {
                loadInArtworks(allArtworks);
            } else {
                TAG.Worktop.Database.getArtworks(loadInArtworks, function () {
                    console.log("error");
                }, function () {
                    console.log("error2");
                });
            }
        });



        $(catalogPickerOverlay).fadeIn();

        catalogPicker.append(loading);

        // create artwork import button
        var catalogPickerImport = document.createElement('button');
        catalogPickerImport.disabled = true;
        $(catalogPickerImport).text("Import");
        $(catalogPickerImport).css({
            position: 'absolute',
            bottom: '2%',
            right: '22%',
        });

        // in here, deal with multiple selected artworks
        // artwork import button click handler
        $(catalogPickerImport).click(function () {
            var i;
            // if an artwork is selected, add an artwork track and a display (and combine these commands in undo manager)
            catalogPickerImport.disabled = true;
            function importHelper(j) {
                var selectedArt = selectedArtworks[j];
                var track;
                var positionX = timeManager.getCurrentPx();
                var displayLength;
                if (selectedArt.type === "VideoArtwork") {
                    track = timeline.addVideoTrack(selectedArt.url, selectedArt.name, null, selectedArt.duration);
                    selectMedia(selectedArt, track);
                } else {
                    track = timeline.addArtworkTrack(selectedArt.url, selectedArt.name, selectedArt.id);
                    displayLength = 5;
                    var dispLen = Math.min(displayLength, timeManager.getDuration().end - timeManager.pxToTime(positionX));
                    var newDisplay = (dispLen < TAG.TourAuthoring.Constants.displayEpsilon) ? track.addDisplay(timeManager.timeToPx(timeManager.getDuration().end - TAG.TourAuthoring.Constants.displayEpsilon), TAG.TourAuthoring.Constants.displayEpsilon) : track.addDisplay(positionX, dispLen);
                    if (dispLen < 1.5 && dispLen >= TAG.TourAuthoring.Constants.displayEpsilon) {
                        newDisplay.setIn(0);
                        newDisplay.setOut(0);
                        newDisplay.setMain(dispLen);
                    }
                    // force a tour reload? easiest to use timeline.onUpdate()
                    if (timeline.getTracks().length > 0) {
                        timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
                    }
                }
            }
            if (selectedArtworks && selectedArtworks.length) {
                artQueue.clear();
                loading.text('Importing...');
                loading.show();
                $(catalogPickerImport).hide();
                $(catalogPickerCancel).hide();
                for (i = 0; i < selectedArtworks.length; i++) {
                    importHelper(i);
                }
                undoManager.combineLast(2 * selectedArtworks.length);
                $('#inkButton').css({ 'background-color': 'transparent', 'color': 'white' });
                allowInk = true;
                _clearCatalog();
                $(catalogPickerOverlay).fadeOut();
            } else {
                _clearCatalog();
                $(catalogPickerOverlay).fadeOut();
            }
            //$(searchbar).attr('placeholder', PICKER_SEARCH_TEXT);
            $(searchbar).val("");
            isUploading = false;
            timeline.getDataHolder().mapTracks(function (container, i) {
                container.track.updatePos(i);
            });
        });
        catalogPicker.append(catalogPickerImport);

        // cancel button

        $(catalogPickerCancel).text("Cancel");
        $(catalogPickerCancel).css({
            position: 'absolute',
            bottom: '2%',
            right: '5%',
        });

        // cancel button click handler
        $(catalogPickerCancel).click(function () {
            $(catalogPickerOverlay).fadeOut();
            _clearCatalog();
            catalogPickerImport.disabled = true;
            //$(searchbar).attr('placeholder', PICKER_SEARCH_TEXT);
            $(searchbar).val("");
            return undefined;
        });
        catalogPicker.append(catalogPickerCancel);
    }

    /**Checks if a string 'val' contains 'str
     * If 'val' is the default search text it will always return true
     * Case insensitive
     * @method searchString
     * @ param {String} str
     * @param {String} val
     * @return {Boolean}
     */
    function searchString(str, val) {
        if (val === PICKER_SEARCH_TEXT) val = '';
        return str.toLowerCase().indexOf(val.toLowerCase()) !== -1;
    }

    /**Detaches elements
     * @method _clearCatalog
     */
    function _clearCatalog() {
        $(".artHolder").detach();
        $(".exhibHolder").detach();
        $(".allArtworksHolder").detach();
        $('#loadingLabel').detach();
        artQueue.clear();
    }


    /**
     * Below are the ink UI controls. They are separated into draw, text, and transparency controls.
     */

    // var numInkTracks = 0;

    /**
     * Ink text UI controls (initial text creation, not edit mode)
     */

    // text UI control panel

    //  inkTextControls = $(document.createElement('div'));
    //  inkTextControls.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-x': 'none', 'overflow-y': 'auto', 'margin-top': '8%' });
    //  inkTextControls.attr('id', 'inkTextControls');
    //  inkTextDocfrag.appendChild(inkTextControls[0]);
    //  inkTextControls.css({ "display": "none" });

    // cancel text button
    //var cancelTextButton = $(document.createElement('button'));
    //cancelTextButton.css({ 'font-size': '100%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', /*'width': '25%'*/// 'width': '80%' });
    /*    cancelTextButton.get(0).innerHTML = "Cancel";
        cancelTextButton.click(function () {
            removeInkCanv();
            inkTextControls.hide();
            timeline.setModifyingInk(false);
            timeline.setEditInkOn(false);

            inkAuthoring.getInkUndoManager().clear();
            undoManager.greyOutBtn();
            // set undo/redo buttons back to global undo/redo functionality
            playbackControls.undoButton.off("click");
            playbackControls.redoButton.off("click");
            playbackControls.undoButton.on("click", function () {
                undoManager.undo();
            });
            playbackControls.redoButton.on("click", function () {
                undoManager.redo();
            });
            playbackControls.undoRedoInkOnly.css({ 'display': 'none' });
        });
        inkTextControls.append(cancelTextButton);

        // CREATING NEW TEXT INK
        var textArray = []; // array of text UI controls
        
        var textBodyLabel = $(document.createElement('div'));
        textBodyLabel.addClass('thicknessLabel');
        var textBodyLabel1 = $(document.createElement('div'));
        textBodyLabel.text("Text:");
        textBodyLabel.append(textBodyLabel1);
        inkTextControls.append(textBodyLabel);
        textBodyLabel1.css({
            'position': 'relative',
            'top': '2px',
            'width': '65%',
            'color': 'green',
            'display': 'inline-block',
            'margin-left': '2%',
            'text-overflow': 'ellipsis',
            'overflow': 'hidden',
            'white-space': 'nowrap',
            'margin-bottom': '0',
        });
        textBodyLabel.css({
            'font-size': '130%',
            'color': 'black',
            'margin-left': '8%',
            'font-weight': 'normal',
            'margin-top': '3%',
            'margin-right': '12%',
            'margin-bottom': '1%',
            'display': 'inline-block',
            'border-bottom-width': ' 2px',
            'border-bottom-style': 'solid',
            'border-bottom-color': 'white',
            'width': '80%',
        });

        var textArea = $(document.createElement('textarea'));
        textArea.css({
            'width': "72%",
            'min-width': '0px',
            'margin-left': '8%',
            'margin-top': '2%',
            'overflow-x': 'hidden',
            'position': 'relative',
        });
        textArray.push(textArea);
        textArea.attr('id', 'writeAnnotation');
        $('#writeAnnotation').autoSize({
            onResize: function () {
                $(this).css({ 'opacity': '0.8' });
            },
            animateCallback: function () {
                $(this).css({ 'opacity': '1' });
            },
            animateDuration: 300,
            extraSpace: 40
        });
        //textArea.autoSize();
        inkTextControls.append(textArea);

        function updateAreaText() {
            var text = currentInkController.getSVGText();
            textBodyLabel1.text(textArea.val()); // or .text()
            text.attr('text', textArea.val());
            text.data('str', textArea.val());
        }

        var lastText = "";
        textArea.on("keyup", function (evt) { //use onpropertychange

            var code = evt.keyCode;
            if (code === 32) {
                evt.stopPropagation();
            }
          
            var undoRedo = $.debounce(500, false, undoRedoText(evt));
            if (code !== 37 && code !== 38 && code !== 39 && code !== 40 && evt.keyCode !== 90 && !evt.ctrlKey && evt.keyCode !== 89) { // exclude arrow/ctrl/etc keys
                undoRedo();
            }
            updateAreaText();
        });

        function undoRedoText(evt) {
            return function () {
                var currText = textArea.val();
                var oldText = lastText;
                if (currText === lastText || evt.which === 17) {
                    return;
                }
                var undoMgr = currentInkController.getInkUndoManager();
                var command = TAG.TourAuthoring.Command({
                    execute: function () {
                        textArea.val(currText);
                        updateAreaText();
                    },
                    unexecute: function () {
                        textArea.val(oldText);
                        updateAreaText();
                    }
                });
                undoMgr.logCommand(command);
                lastText = textArea.val();
            };
        }

        textBodyLabel.click(function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            textBodyLabel.css({ 'font-weight': 'bold' });
            updateToggle(textArray, textArea);
        });

        // show current font label
        var fontLabel = $(document.createElement('div'));
        fontLabel.addClass('thicknessLabel');
        var fontLabel1 = $(document.createElement('div'));
        fontLabel.text("Font:");
        fontLabel1.text("Times New Roman");
        fontLabel.append(fontLabel1);
        inkTextControls.append(fontLabel);

        fontLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        fontLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // dropdown font selector
        var fontSelector = $(document.createElement("select"));
        fontSelector.addClass('fontSelector');
        fontSelector.css({ color: "white", 'float': 'left', 'clear': 'both', 'display': 'none', "border": "solid 3px rgba(255,255,255,1)", width: "72%",  'margin-left': '8%', 'margin-top': '2%', "background-color": 'rgba(0,0,0,0.5)' });
        textArray.push(fontSelector);
        inkTextControls.append(fontSelector);

        
        // create font options for the selector -- on click, set the font family of the current ink and reset fontLabel1.text
        var timesOption = $(document.createElement("option"));
        timesOption.text("Times New Roman").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
        timesOption.on('click', function () {
            currentInkController.setFontFamily("Times New Roman, serif");
            fontLabel1.text("Times New Roman");
        });
        var georgiaOption = $(document.createElement("option"));
        georgiaOption.text("Georgia").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
        georgiaOption.on('click', function () {
            currentInkController.setFontFamily("Georgia, serif");
            fontLabel1.text("Georgia");
        });
        var verdanaOption = $(document.createElement("option"));
        verdanaOption.text("Verdana").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
        verdanaOption.on('click', function () {
            currentInkController.setFontFamily("Verdana, Geneva, sans-serif");
            fontLabel1.text("Verdana");
        });
        var courierOption = $(document.createElement("option"));
        courierOption.text("Courier").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
        courierOption.on('click', function () {
            currentInkController.setFontFamily("'Courier New', Courier, monospace");
            fontLabel1.text("Courier");
        });

        fontSelector.append(timesOption);
        fontSelector.append(georgiaOption);
        fontSelector.append(verdanaOption);
        fontSelector.append(courierOption);

        // font label click handler (needs to be after the font selector is created)
        fontLabel.click(function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            fontLabel.css({ 'font-weight': 'bold' });
            updateToggle(textArray, fontSelector);
        });

        // show current font color label
        var colorTextLabel = $(document.createElement('div'));
        colorTextLabel.addClass('thicknessLabel');
        var colorTextLabel1 = $(document.createElement('div'));
        colorTextLabel1.addClass('changeColor');
        colorTextLabel.text("Color: ");
        colorTextLabel1.text("#FFFFFF");
        colorTextLabel.append(colorTextLabel1);
        inkTextControls.append(colorTextLabel);

        colorTextLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
        colorTextLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });

        // create div containing the color picker
        var colorTextDiv = $(document.createElement('div'));
        colorTextDiv.attr("id", "colorTextDiv");
        colorTextDiv.css('display', 'none');
        inkTextControls.append(colorTextDiv);
        textArray.push(colorTextDiv);

        //click handler to open the color picker when we click on the color label
        colorTextLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            colorTextLabel.css({ 'font-weight': 'bold' });
            updateToggle(textArray, colorTextDiv);

        });

        // create input box for color picker
        var itemText = document.createElement('input');
        $(itemText).attr('id', 'textColorToggle');
        $(itemText).attr('readonly', 'readonly');
        $(itemText).css({ 'margin-left': '8%', 'margin-top': '3%', 'clear': 'left', 'width': '40%' });
        $(itemText).on('keyup', function (event) {
            event.stopPropagation();
        });

        if (itemText.addEventListener) {
            itemText.addEventListener('DOMNodeInserted', function () {
                // initialize colorpicker object on current element
                myPicker = new jscolor.color(itemText, {});
                myPicker.fromString("FFFFFF");
                myPicker.onImmediateChange = function () {
                    currentInkController.setFontColor("#"+$("#textColorToggle").attr('value'));
                    $('.changeColor')[0].innerHTML = "#"+$("#textColorToggle").attr('value');
                };
            }, false);
        }
        colorTextDiv.append(itemText);

        // show font size label 
        var textSizeLabel = $(document.createElement('div'));
        textSizeLabel.addClass('thicknessLabel');
        var textSizeLabel1 = $(document.createElement('div'));
        textSizeLabel.text("Text Size: ");
        textSizeLabel1.text("12px");
        textSizeLabel.append(textSizeLabel1);
        inkTextControls.append(textSizeLabel);
        textSizeLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        textSizeLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

        // create slider for font size
        var textSizeSlider = $(document.createElement('div'));
        textSizeSlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative', 'float': 'left'
        });
        var textSliderPoint = $(document.createElement('div'));
        textSliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", "margin-top": "-0.57%", "left": "50px",
        });
        textSizeSlider.append(textSliderPoint);
        textSizeSlider.attr("value", "12px");
        inkTextControls.append(textSizeSlider);
        
        // drag functionality for font size slider point
        textSliderPoint.draggable({
            axis: "x", containment: "parent",
            scroll: false,
            drag: function (event) {
                textSliderPoint.value = textSliderPoint.css("left").replace('px', '') / (textSizeSlider.offset().left + textSizeSlider.width()) * 1.28;
                //console.log(textSliderPoint.value);
                textSizeSlider.attr("value", (textSliderPoint.value * 39 + 8) + "px");
                var val = Math.round(textSliderPoint.value * 39) + 8;
                textSizeLabel1.text( val + "px");
                currentInkController.setFontSize(textSizeSlider.attr("value"));
            },
            appendTo: 'body'
        });

        textArray.push(textSizeSlider);

        // click handler for text size label -- opens slider
        textSizeLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            textSizeLabel.css({ 'font-weight': 'bold' });
            updateToggle(textArray, textSizeSlider);
        });

        // attach buttons for text
        var linkTextDiv = getAttachDiv(inkTextControls, "Write");
        inkTextControls.append(linkTextDiv);
        functionsPanel.append(inkTextDocfrag);

        /**
         * Edit ink text UI controls -- we can probably compress some of this by reusing the inkTextControls
         */

    // edit text control panel
    /*  var textEditDocfrag = document.createDocumentFragment();
      inkEditText = $(document.createElement('div'));
      inkEditText.attr("id", "inkEditText");
      inkEditText.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-y': 'auto', 'margin-top': '8%' });
      //functionsPanel.append(inkEditText);
      textEditDocfrag.appendChild(inkEditText[0]);
      inkEditText.css({ "display": "none" });

      var cancelEditTextButton = $(document.createElement('button'));
      cancelEditTextButton.css({ 'font-size': '100%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', /*'width': '25%'*/ //'width':'80%' });
    // cancelEditTextButton.get(0).innerHTML = "Cancel";
    // inkEditText.append(cancelEditTextButton);

    // EDITING OLD TEXT INK
    /*   var textEditArray = []; // array of edit text controls
       
       var textEditBodyLabel = $(document.createElement('div'));
       textEditBodyLabel.addClass('thicknessLabel');
       var textEditBodyLabel1 = $(document.createElement('div'));
       textEditBodyLabel.text("Text:");
       textEditBodyLabel.append(textEditBodyLabel1);
       inkEditText.append(textEditBodyLabel);
       textEditBodyLabel1.css({
           'position': 'relative',
           'top': '2px',
           'width': '65%',
           'color': 'green',
           'display': 'inline-block',
           'margin-left': '2%',
           'text-overflow': 'ellipsis',
           'overflow': 'hidden',
           'white-space': 'nowrap',
           'margin-bottom': '0',
       });
       textEditBodyLabel.css({
           'font-size': '130%',
           'color': 'black',
           'margin-left': '8%',
           'font-weight': 'normal',
           'margin-top': '3%',
           'margin-right': '12%',
           'margin-bottom': '1%',
           'display': 'inline-block',
           'border-bottom-width': ' 2px',
           'border-bottom-style': 'solid',
           'border-bottom-color': 'white',
           'width': '80%',
       });

       var textEditArea = $(document.createElement('textarea'));
       textEditArea.css({
           'width': "72%",
           'min-width': '0px',
           'margin-left': '8%',
           'margin-top': '2%',
           'overflow-x': 'hidden',
           'position': 'relative',
       });
       textEditArray.push(textEditArea);
       textEditArea.autoSize();
       inkEditText.append(textEditArea);

       var textA;
       function updateEditAreaText() {
           textA = currentInkController.getSVGText();
           textEditBodyLabel1.text(textEditArea.val()); // or .text()
           currentInkController.removeAll();
           currentInkController.addTextBox(textA.attrs.x, textA.attrs.y, -1, -1, textEditArea.val(), true);
           textA = currentInkController.getSVGText();
           textA.data('str', textEditArea.val());
       }
       var lastEditText;
       function firstUpdate() {
           textA = currentInkController.getSVGText();
           textEditBodyLabel1.text(textEditArea.val()); // or .text()
           currentInkController.removeAll();
           lastEditText = textEditArea.val();
           switch (textA.attr('font-family')) {
               case "'Courier New', Courier, monospace":
                   courierEditOption.prop('selected', true);
                   currentInkController.setFontFamily("'Courier New', Courier, monospace");
                   fontEditLabel1.text("Courier");
                   break;
               case "Verdana, Geneva, sans-serif":
                   verdanaEditOption.prop('selected', true);
                   currentInkController.setFontFamily("Verdana, Geneva, sans-serif");
                   fontEditLabel1.text("Verdana");
                   break;
               case "Georgia, serif":
                   georgiaEditOption.prop('selected', true);
                   currentInkController.setFontFamily("Georgia, serif");
                   fontEditLabel1.text("Georgia");
                   break;
               case "Times New Roman, serif":
                   timesEditOption.prop('selected', true);
                   currentInkController.setFontFamily("Times New Roman, serif");
                   fontEditLabel1.text("Times New Roman");
                   break;
               default:
                   break;
           
           }
           currentInkController.addTextBox(textA.attrs.x, textA.attrs.y, -1, -1, textEditArea.val(), true);
           textA = currentInkController.getSVGText();
           textA.data('str', textEditArea.val());
       }

       
       textEditArea.on("keyup", function (evt) { //use onpropertychange

           var code = evt.keyCode;

           if (code == 32) {
           evt.stopPropagation();
           }
           var undoRedoEdit = $.debounce(500, false, undoRedoEditText(evt));
           if (code !== 37 && code !== 38 && code !== 39 && code !== 40 && !evt.ctrlKey) { // exclude arrow keys
               undoRedoEdit();
           }
           updateEditAreaText();
       });

      
       function undoRedoEditText(evt) {
           return function () {
               var currEditText = textEditArea.val();
               var oldEditText = lastEditText;
               if (currEditText === lastEditText || evt.which === 17) {
                   return;
               }
               var undoMgr = currentInkController.getInkUndoManager();
               var command = TAG.TourAuthoring.Command({
                   execute: function () {
                       textEditArea.val(currEditText);
                       updateEditAreaText();
                   },
                   unexecute: function () {
                       textEditArea.val(oldEditText);
                       updateEditAreaText();
                   }
               });
               undoMgr.logCommand(command);
               lastEditText = currEditText;
           };
       }

       textEditBodyLabel.on('click', function () {
           $(".thicknessLabel").css({ 'font-weight': 'normal' });
           textEditBodyLabel.css({ 'font-weight': 'bold' });
           updateToggle(textEditArray, textEditArea);
       });

       // show font family label
       var fontEditLabel = $(document.createElement('div'));
       fontEditLabel.addClass('thicknessLabel');
       var fontEditLabel1 = $(document.createElement('div'));
       fontEditLabel.text("Font:");
       fontEditLabel1.text("Times New Roman");
       fontEditLabel.append(fontEditLabel1);
       inkEditText.append(fontEditLabel);

       fontEditLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
       fontEditLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

       // font selection dropdown
       var fontEditSelector = $(document.createElement("select"));
       fontEditSelector.addClass('fontSelector');
       fontEditSelector.css({ color: "white", 'float': 'left', 'clear': 'both', 'display': 'none', "border": "solid 3px rgba(255,255,255,1)", width: "72%",  'margin-left': '8%', 'margin-top': '2%', "background-color": 'rgba(0,0,0,0.5)' });
       textEditArray.push(fontEditSelector);
       inkEditText.append(fontEditSelector);

       // font options in dropdown
       var timesEditOption = $(document.createElement("option"));
       timesEditOption.text("Times New Roman").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
       timesEditOption.click(function () {
           currentInkController.setFontFamily("Times New Roman, serif");
           fontEditLabel1.text("Times New Roman");
       });
       var georgiaEditOption = $(document.createElement("option"));
       georgiaEditOption.text("Georgia").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
       georgiaEditOption.click(function () {
           currentInkController.setFontFamily("Georgia, serif");
           fontEditLabel1.text("Georgia");
       });
       var verdanaEditOption = $(document.createElement("option"));
       verdanaEditOption.text("Verdana").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
       verdanaEditOption.click(function () {
           currentInkController.setFontFamily("Verdana, Geneva, sans-serif");
           fontEditLabel1.text("Verdana");
       });
       var courierEditOption = $(document.createElement("option"));
       courierEditOption.text("Courier").css({ color: "white", "border-color": "rgba(0,0,0,0.5)", overflow: "hidden", background: "no-repeat scroll", "background-color": 'rgba(0,0,0,0.5)' });
       courierEditOption.click(function () {
           currentInkController.setFontFamily("'Courier New', Courier, monospace");
           fontEditLabel1.text("Courier");
       });

       fontEditSelector.append(timesEditOption);
       fontEditSelector.append(georgiaEditOption);
       fontEditSelector.append(verdanaEditOption);
       fontEditSelector.append(courierEditOption);

       // font label click handler -- opens dropdown
       fontEditLabel.on('click', function () {
           $(".thicknessLabel").css({ 'font-weight': 'normal' });
           fontEditLabel.css({ 'font-weight': 'bold' });
           updateToggle(textEditArray, fontEditSelector);
       });

       // font color label for editing ink text
       var colorEditTextLabel = $(document.createElement('div'));
       colorEditTextLabel.addClass('thicknessLabel');
       var colorEditTextLabel1 = $(document.createElement('div'));
       colorEditTextLabel1.addClass('changeColorEdit');
       colorEditTextLabel.text("Color: ");
       colorEditTextLabel1.text("#FFFFFF");
       colorEditTextLabel.append(colorEditTextLabel1);
       inkEditText.append(colorEditTextLabel);
       colorEditTextLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
       colorEditTextLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });

       // div to contain color picker
       var colorEditTextDiv = $(document.createElement('div'));
       colorEditTextDiv.css('display', 'none');
       inkEditText.append(colorEditTextDiv);
       textEditArray.push(colorEditTextDiv);

       // click handler to open color picker
       colorEditTextLabel.on('click', function () {
           $(".thicknessLabel").css({ 'font-weight': 'normal' });
           colorEditTextLabel.css({ 'font-weight': 'bold' });
           updateToggle(textEditArray, colorEditTextDiv);

       });

       // color picker input box for editing ink Text
       var itemEditText = document.createElement('input');
       $(itemEditText).attr('id', 'textEditColorToggle');
       $(itemEditText).attr('readonly', 'readonly');
       $(itemEditText).css({ 'margin-left': '8%', 'margin-top': '3%', 'clear': 'left', 'width': '40%' });
       $(itemEditText).on('keyup', function (event) {
           event.stopPropagation();
       });

       if (itemEditText.addEventListener) {
           itemEditText.addEventListener('DOMNodeInserted', function () {
               // initialize colorpicker object on current element
               myEditTextPicker = new jscolor.color(itemEditText, {});
               myEditTextPicker.fromString("FFFFFF");
               myEditTextPicker.onImmediateChange = function () {
                   currentInkController.setFontColor("#" + $("#textEditColorToggle").attr('value'));
                   $('.changeColorEdit')[0].innerHTML = "#" + $("#textEditColorToggle").attr('value');
               };
           }, false);
       }
       colorEditTextDiv.append(itemEditText);

       // font size label for editing
       var textEditSizeLabel = $(document.createElement('div'));
       textEditSizeLabel.addClass('thicknessLabel');
       var textEditSizeLabel1 = $(document.createElement('div'));
       textEditSizeLabel.text("Text Size: ");
       textEditSizeLabel1.text("8px");
       textEditSizeLabel.append(textEditSizeLabel1);
       inkEditText.append(textEditSizeLabel);
       textEditSizeLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
       textEditSizeLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

       // font size slider for editing
       var textEditSizeSlider = $(document.createElement('div'));
       textEditSizeSlider.css({
           'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
           'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'
       });
       inkEditText.append(textEditSizeSlider);
       var textEditSliderPoint = $(document.createElement('div'));
       textEditSliderPoint.css({
           'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
           'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", "margin-top": "-0.57%"
       });
       textEditSizeSlider.append(textEditSliderPoint);
       textEditSizeSlider.attr("value", "8px");
       
       // drag handler for font size slider point
       textEditSliderPoint.draggable({
           axis: "x", containment: "parent",
           scroll: false,
           drag: function (event, ui) {
               //console.log(ui.position.left);
               textEditSliderPoint.value = ui.position.left / (textEditSizeSlider.width() - textEditSliderPoint.width());
               //console.log(textEditSliderPoint.value);
               textEditSizeSlider.attr("value", (textEditSliderPoint.value * (maxFontSize - 8) + 8) + "px"); // font size goes from 12-43 (maybe the slider point goes past 1.0?)
               var val = Math.round(textEditSliderPoint.value * (maxFontSize - 8)) + 8;
               currentFontSize = val;
               textEditSizeLabel1.text(val + "px");
               currentInkController.setFontSize(textEditSizeSlider.attr("value"));
           },
           appendTo: 'body'
       });
       textEditArray.push(textEditSizeSlider);

       // click handler for font size label -- opens size slider
       textEditSizeLabel.on('click', function () {
           $(".thicknessLabel").css({ 'font-weight': 'normal' });
           textEditSizeLabel.css({ 'font-weight': 'bold' });
           updateToggle(textEditArray, textEditSizeSlider);
           var pointvalue = (currentFontSize - 8) / (maxFontSize - 8);
           var pointleft = pointvalue * (textEditSizeSlider.width() - textEditSliderPoint.width());
           textEditSliderPoint.css("left", pointleft + "px");
       });

       // save edited ink button
       var saveTextButton = $(document.createElement('button'));
       saveTextButton.css({ 'font-size': '100%', 'color': 'black', 'margin-top': '3%', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', 'width': '80%' });
       saveTextButton.get(0).innerHTML = "Save";
       inkEditText.append(saveTextButton);

       functionsPanel.append(textEditDocfrag); */



    ////////////////////////////
    // NEW TEXT INK STUFF /////
    ///////////////////////////






    /**Creates editing inputs on the left panel for ink type annotations
     * @method createInkTextControls
     * @return {Object} public functions defined to manipulate ink annotations
     */
    function createInkTextControls() {
        // creating DOM elements
        var colorInput = createColorInput(inkTextControls, function (color) {
            currentInkController.setFontColor(color);
        });
        var fontInput = createFontInput(inkTextControls, function (font) {
            currentInkController.setFontFamily(font)
        });
        var sizeInput = createTextSizeInput(inkTextControls, function (size) {
            currentInkController.setFontSize(size)
        });
        var linkTextDiv = getAttachDiv(inkTextControls, true, false);
        var textInput = createInkTextInput(inkTextControls);

        /**Updates ink values when changed
         * @method updateInputs
         * @param {Object} values       changed values of the ink
         */
        function updateInputs(values) {
            if (values) {
                colorInput.updateColor(values.color);
                fontInput.updateFont(values.font);
                sizeInput.updateSize(values.size);
                textInput.updateAreaText(values.text);
            } else {
                colorInput.updateColor();
                fontInput.updateFont();
                sizeInput.updateSize();
                textInput.updateAreaText();
            }
        }

        /**Appends the controls to the left panel
         * @method showForm
         */
        function showForm() {
            functionsPanel.append(inkTextDocfrag);
        }

        /**Decides form specifications for a new ink track v/s editing existing track
         * @method createModeButton
         */
        function createModeButton() {
            if (isEditingText) {
                // save button, etc etc
                inkTextControls.append(saveButton);
                linkTextDiv.detach();
            } else {
                saveButton.detach();
                inkTextControls.append(linkTextDiv);
            }
        }

        /**Updatesthe text area on the left panel where text is typed
         * @method getTextArea
         * @return {Function}  updates the text on change
         */
        function getTextArea() {
            return function () {
                textInput.updateAreaText();
            };
        }

        return {            // public methods
            updateInputs: updateInputs,
            showForm: showForm,
            createModeButton: createModeButton,
            getTextArea: getTextArea
        };
    }



    /**Creates form input to manipulate text color
     * @method createColorInput
     * @param {HTML Element} form           form to append color input to 
     * @param {Function} handler            function ot set font color
     * @return {Object} public method to update color
     */
    function createColorInput(form, handler) {
        var handle = handler;
        var colorTextLabel = $(document.createElement('div'));
        var colorTextLabel1 = $(document.createElement('div'));
        var colorTextDiv = $(document.createElement('div'));
        var itemText = $(document.createElement('input'));


        colorTextLabel.addClass('thicknessLabel');
        colorTextLabel1.addClass('changeColor');
        colorTextLabel.text("Color: ");
        colorTextLabel1.text("#FFFFFF");
        colorTextLabel.append(colorTextLabel1);
        form.append(colorTextLabel);

        colorTextLabel.css(labelCSS());
        colorTextLabel1.css({
            'color': 'green',
            'display': 'inline',
            'padding-left': '2%'
        });
        colorTextDiv.attr("id", "colorTextDiv");
        colorTextDiv.css('display', 'none');
        form.append(colorTextDiv);
        textArray.push(colorTextDiv);

        //click handler to open the color picker when we click on the color label
        colorTextLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            colorTextLabel.css({ 'font-weight': 'bold' });
            updateToggle(textArray, colorTextDiv);
        });

        $(itemText).attr('id', 'textColorToggle');
        $(itemText).attr('readonly', 'readonly');
        $(itemText).css({
            'margin-left': '8%',
            'margin-top': '3%',
            'clear': 'left',
            'width': '40%'
        });

        itemText.attr('id', 'textColorToggle');

        itemText.on('keyup', function (event) {
            event.stopPropagation();
        });

        if (itemText[0].addEventListener) {
            itemText[0].addEventListener('DOMNodeInserted', function () {
                myPicker = new jscolor.color(itemText[0], {});
                myPicker.fromString("FFFFFF");
                myPicker.onImmediateChange = function () {
                    updateColor($("#textColorToggle").attr('value'));
                }
            }, false);
        }

        colorTextDiv.append(itemText[0]);

        /**Updates the color in all relevant places on change
         * @method updateColor
         * @param color
         */
        function updateColor(color) {
            if (color) {
                colorTextLabel1.text(color);
                $('#textColorToggle').attr('value', color);
                $('.changeColor').text(color);
                $(itemText).css({ 'background-color': color, 'text': color });
                handler(color);
            } else {
                $(itemText).css({ 'background-color': '#FFFFFF', 'text': '#FFFFFF' });
                colorTextLabel1.text("#FFFFFF");
                $('#textColorToggle').attr('value', "FFFFFF");
                $('.changeColor').text('#FFFFFF');
                handler('#FFFFFF');
            }
        }

        return {
            updateColor: updateColor,
        };
    }

    /**Creates form input to manipulate font
     * @method createFontInput
     * @param {HTML Element} form           form to append color input to 
     * @param {Function} handler            function ot set font color
     * @return {Object} public method to update font type
     */
    function createFontInput(form, handler) {
        var fontLabel = $(document.createElement('div'));
        var fontLabel1 = $(document.createElement('div'));
        var fontSelector = $(document.createElement("select")).addClass('fontSelector');
        var timesOption = createFontOption("Times New Roman");
        var georgiaOption = createFontOption("Georgia");
        var verdanaOption = createFontOption("Verdana");
        var courierOption = createFontOption("Courier");

        fontLabel.addClass('thicknessLabel');
        fontLabel.text("Font:");
        fontLabel1.text("Times New Roman");
        fontLabel.append(fontLabel1);
        form.append(fontLabel);
        fontLabel1.css({
            'color': 'green',
            'display': 'inline',
            'padding-left': '2%'
        });

        fontLabel.css(labelCSS());

        fontSelector.addClass('fontSelector');
        fontSelector.attr('id', 'fontSelector');
        fontSelector.css({
            color: "white",
            'float': 'left',
            'clear': 'both',
            'display': 'none',
            "border": "solid 3px rgba(255,255,255,1)",
            width: "72%",
            'margin-left': '8%',
            'margin-top': '2%',
            "background-color": 'rgba(0,0,0,0.5)'
        });
        textArray.push(fontSelector);
        form.append(fontSelector);

        fontLabel.click(function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            fontLabel.css({ 'font-weight': 'bold' });
            updateToggle(textArray, fontSelector);
        });


        timesOption.on('click', function () {
            updateFont(timesOption.text());
            timesOption.prop('selected', true);
        });

        georgiaOption.on('click', function () {
            updateFont(georgiaOption.text());
            georgiaOption.prop('selected', true);
        });

        verdanaOption.on('click', function () {
            updateFont(verdanaOption.text());
            verdanaOption.prop('selected', true);
        });

        courierOption.on('click', function () {
            updateFont(courierOption.text());
            courierOption.prop('selected', true);
        });

        fontSelector.append(timesOption);
        fontSelector.append(georgiaOption);
        fontSelector.append(verdanaOption);
        fontSelector.append(courierOption);

        /**Updates font on change
         * @method updateFont
         * @pram font
         */
        function updateFont(font) {
            if (font) {
                fontLabel1.text(font);
                handler(font);
                firstUpdate();
            } else {
                fontLabel1.text("Times New Roman");
                timesOption.attr("selected", "selected");
            }
        }

        /**Updates 'selected' property of current font family
         * @method firstUpdate
         */
        function firstUpdate() {
            var currFont = currentInkController.getFontFamily();
            switch (currFont) {
                case "'Courier":
                    courierOption.prop('selected', true);
                    break;
                case "Verdana":
                    verdanaOption.prop('selected', true);
                    break;
                case "Georgia":
                    georgiaOption.prop('selected', true);
                    break;
                case "Times New Roman":
                    timesOption.prop('selected', true);
                    break;
                default:
                    break;
            }
        }


        return {
            updateFont: updateFont,
        };
    }

    /**Creates form input to manipulate text size
     * @method createFontInput
     * @param {HTML Element} form           form to append color input to 
     * @param {Function} handler            function ot set font color
     * @return {Object} public method to update fotn size
     */
    function createTextSizeInput(form, handler) {
        var textSizeLabel = $(document.createElement('div'));
        var textSizeLabel1 = $(document.createElement('div'));
        var textSizeSlider = $(document.createElement('div'));                      // create slider for font size
        var textSliderPoint = $(document.createElement('div'));

        textSizeLabel.addClass('thicknessLabel');
        textSizeLabel.text("Text Size: ");
        textSizeLabel1.text("12px");
        textSizeLabel.append(textSizeLabel1);
        textSizeSlider.attr('id', 'textSizeSlider');
        form.append(textSizeLabel);
        textSizeLabel1.css({
            'color': 'green',
            'display': 'inline',
            'padding-left': '2%'
        });
        textSizeLabel.css(labelCSS());

        textSizeSlider.css({
            'clear': 'both',
            'background-color': 'rgb(136, 134, 134)',
            'border-radius': '25px',
            "-ms-touch-action": "none",
            'border': '1px solid gray',
            'width': '70%',
            'height': '21px',
            'margin-top': '3%',
            'margin-left': '8%',
            'display': 'none',
            'position': 'relative',
            'float': 'left'
        });

        textSliderPoint.css({
            'background-color': 'white',
            'height': '115%',
            'width': '9.25%',
            'position': 'relative',
            'border': '1px',
            'border-style': 'solid',
            'border-color': 'gray',
            "border-radius": "50%",
            "top": "-5%",
            "margin-top": "-0.57%",
            "left": "50px"
        });

        textSizeSlider.append(textSliderPoint);
        textSizeSlider.attr("value", "12px");
        form.append(textSizeSlider);

        // drag functionality for font size slider point
        textSliderPoint.draggable({
            axis: "x",
            containment: "parent",
            scroll: false,
            drag: function (event) {
                updateSize(textSizeSlider.attr('value').replace('px', ''));
            },
            appendTo: 'body'
        });

        textArray.push(textSizeSlider);

        // click handler for text size label -- opens slider
        textSizeLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            textSizeLabel.css({ 'font-weight': 'bold' });
            updateToggle(textArray, textSizeSlider);
        });

        /**Updates text size on change
         * @method updateSize
         * @param {Number} size
         */
        function updateSize(size) {
            if (size) {
                textSliderPoint.value = textSliderPoint.css("left").replace('px', '') / (textSizeSlider.offset().left + textSizeSlider.width()) * 1.28;
                textSizeSlider.attr("value", (textSliderPoint.value * 39 + 8) + "px");
                if (size > 48) {
                    handler(48)
                } else {
                    handler(size);
                }
                var currentFontsize = currentInkController.getFontSize();
                var maxFontSize = Math.max(48, currentFontsize);
                var pointvalue = (currentFontsize - 8) / (maxFontSize - 8);
                var pointleft = pointvalue * (textSizeSlider.width() - textSliderPoint.width());
                textSizeLabel1.text(Math.round(currentFontsize) + 'px');
                textSliderPoint.css("left", pointleft + "px");
            } else {
                textSliderPoint.css("left", "10%");
                textSizeLabel1.text("12px");
                textSizeSlider.attr('value', '12px');
                handler(textSizeSlider.attr('value'));
            }
        }

        return {
            updateSize: updateSize
        };
    }


    /**Creates form input to manipulate text size
     * @method createFontInput
     * @param {HTML Element} form           form to append color input to 
     * @param {Function} handler            function ot set font color
     * @return {Object} public method to update fotn size
     */
    function createInkTextInput(form, handler) {
        var textBodyLabel = $(document.createElement('div'));
        var textBodyLabel1 = $(document.createElement('div'));
        var textArea = $(document.createElement('textarea'));

        textBodyLabel.addClass('thicknessLabel');
        textBodyLabel.text("Text:");
        textBodyLabel.append(textBodyLabel1);
        form.append(textBodyLabel);
        textBodyLabel1.css({
            'position': 'relative',
            'top': '2px',
            'width': '65%',
            'color': 'green',
            'display': 'inline-block',
            'margin-left': '2%',
            'text-overflow': 'ellipsis',
            'overflow': 'hidden',
            'white-space': 'nowrap',
            'margin-bottom': '0',
        });

        textBodyLabel.css(labelCSS());
        textBodyLabel.click(function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            textBodyLabel.css({ 'font-weight': 'bold' });
            updateToggle(textArray, textArea);
        });


        textArea.css({
            'width': "72%",
            'min-width': '0px',
            'margin-left': '8%',
            'margin-top': '2%',
            'overflow-x': 'hidden',
            'position': 'relative',
        });

        textArea.on("keyup", function (evt) { //use onpropertychange
            var code = evt.keyCode;
            if (code === 32) {
                evt.stopPropagation();
            }

            var undoRedo = $.debounce(500, false, undoRedoText(evt));
            if (code !== 37 && code !== 38 && code !== 39 && code !== 40 && evt.keyCode !== 90 && !evt.ctrlKey && evt.keyCode !== 89) { // exclude arrow/ctrl/etc keys
                undoRedo();
            }
            updateAreaText(textArea.val());
        });

        textArray.push(textArea);
        textArea.attr('id', 'writeAnnotation');
        $('#writeAnnotation').autoSize({
            onResize: function () {
                $(this).css({ 'opacity': '0.8' });
            },
            animateCallback: function () {
                $(this).css({ 'opacity': '1' });
            },
            animateDuration: 300,
            extraSpace: 40
        });
        form.append(textArea);

        /**Updates text on change
         * @method updateAreaText
         * @param {String} txt
         */
        function updateAreaText(txt) {
            var textA = currentInkController.getSVGText() || 'Your Text Here';
            if (txt || txt === '') {
                textBodyLabel1.text(txt); // or .text()
                $(textA).attr('text', txt);
                $(textA).data('str', txt);

                lastText = textArea.val();
                textArea.attr('value', txt);
                textA = currentInkController.getSVGText();
                currentInkController.removeAll();
                if (textA) {
                    currentInkController.addTextBox(textA.attrs.x, textA.attrs.y, textArea.val());
                    textA.data('str', textArea.val());
                }
            } else {
                var string = "Your Text Here";
                textArea.attr('value', '');
                textBodyLabel1.text(string); // or .text()
                $(textA).attr('text', string);
                $(textA).data('str', string);
                textArea.attr('text', string);
                currentInkController.addTextBox();
                lastText = textArea.val();
                textA = currentInkController.getSVGText();
                textA.data('str', textArea.val());
            }

        }

        /**Returns the label storing current text
         * @method getTextLabel1
         * @return {HTML Element} textBodyLabel1
         */
        function getTextLabel1() {
            return textBodyLabel1;
        }

        return {
            updateAreaText: updateAreaText,
            getTextLabel1: getTextLabel1
        };
    }



    // General functions

    /**Sets CSS of labels
     * @method labelCSS
     * @return {CSS} css
     */
    function labelCSS() {
        var css = {
            'font-size': '70%',
            'color': 'black',
            'margin-left': '8%',
            'font-weight': 'normal',
            'margin-top': '3%',
            'margin-right': '12%',
            'margin-bottom': '1%',
            'float': 'left',
            'clear': 'both',
            'display': 'inline',
            'border-bottom-width': ' 2px',
            'border-bottom-style': 'solid',
            'border-bottom-color': 'white',
            'width': '80%',
        };
        return css;
    }

    /**Creates font option for the drop-down
     * @method createFontOption
     * @param {String} text
     * @return createFontOption
     */
    function createFontOption(text) {
        var fontOption = $(document.createElement('option'));
        fontOption.text(text);
        fontOption.css({
            color: "white",
            "border-color": "rgba(0,0,0,0.5)",
            overflow: "hidden",
            background: "no-repeat scroll",
            "background-color": 'rgba(0,0,0,0.5)'
        });
        return fontOption;
    }

    /**Creates the form to which ink text controls get appended
     * @method createInitialInkControls
     */
    function createInitialInkControls() {
        inkTextControls = $(document.createElement('div'));
        inkTextControls.css({
            'height': '425%',
            'width': '100%',
            top: '130%',
            position: 'absolute',
            'z-index': 0,
            'overflow-x': 'none',
            'overflow-y': 'auto',
            'margin-top': '8%',
            "display": "none"
        });
        inkTextControls.attr('id', 'inkTextControls');
        inkTextDocfrag.appendChild(inkTextControls[0]);
    }

    /**Creates cancel button
     * @method createCancelTextButton
     * @return {HTML Element} cancelTextButton
     */
    function createCancelTextButton() {
        var cancelTextButton = $(document.createElement('button'));
        cancelTextButton.css({
            'font-size': '70%',
            'color': 'black',
            'margin-left': '8%',
            'margin-bottom': '10px',
            'font-weight': 'bold',
            'float': 'left',
            'width': '80%',
            'height': '20%'
        });
        cancelTextButton.get(0).innerHTML = "Cancel";
        cancelTextButton.click(function () {
            removeInkCanv();
            //  INITIAL_INK_TEXT.removeForm();
            //  inkTextControls.remove();
            inkTextControls.hide();
            timeline.setModifyingInk(false);
            timeline.setEditInkOn(false);
            timeline.hideEditorOverlay();

            INITIAL_INK_TEXT.updateInputs(values);

            inkAuthoring.getInkUndoManager().clear();
            undoManager.greyOutBtn();
            // set undo/redo buttons back to global undo/redo functionality
            playbackControls.undoButton.off("click");
            playbackControls.redoButton.off("click");
            playbackControls.undoButton.on("click", function () {
                undoManager.undo();
            });
            playbackControls.redoButton.on("click", function () {
                undoManager.redo();
            });
            playbackControls.undoRedoInkOnly.css({ 'display': 'none' });
        });
        inkTextControls.append(cancelTextButton);
        return cancelTextButton;
    }

    /**Creates cancel button
    * @method createSaveButton
    * @return {HTML Element} saveTextButton
    */
    function createSaveButton() {
        var saveTextButton = $(document.createElement('button'));
        // save edited ink button
        saveTextButton.css({
            'font-size': '70%',
            'color': 'black',
            'margin-top': '3%',
            'margin-left': '8%',
            'margin-bottom': '10px',
            'font-weight': 'bold',
            'float': 'left',
            'width': '80%',
            'height': '20%'
        });
        saveTextButton.get(0).innerHTML = "Save";
        return saveTextButton;
    }

    var lastText = "";

    /**Takes care of undo/redo ink text
     * @param {Event} evt
     * @return {Function}
     */
    function undoRedoText(evt) {
        return function () {
            var currText = $('#writeAnnotation').val();
            var oldText = lastText;
            if (currText === lastText || evt.which === 17) {
                return;
            }
            var undoMgr = currentInkController.getInkUndoManager();
            var command = TAG.TourAuthoring.Command({
                execute: function () {
                    $('#writeAnnotation').val(currText);
                    // updateAreaText();
                    INITIAL_INK_TEXT.getTextArea();
                },
                unexecute: function () {
                    $('#writeAnnotation').val(oldText);
                    // updateAreaText();
                    INITIAL_INK_TEXT.getTextArea();
                }
            });
            undoMgr.logCommand(command);
            lastText = $('#writeAnnotation').attr("value");
        };
    }


    ///////////////////////////
    ///// INK TEXT STUFF TILL HERE
    //////////////








    /**
     * Ink draw UI controls (for initial draw authoring, not editing mode)
     */

    // draw control panel

    /*   inkDrawControls = $(document.createElement('div'));
       inkDrawControls.attr("id", "inkDrawControls");
       inkDrawControls.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-y': 'auto', 'margin-top': '8%' });
       inkDrawDocfrag.appendChild(inkDrawControls[0]);
       inkDrawControls.css({ "display": "none" });

       // draw cancel button
       var cancelDrawButton = $(document.createElement('button'));
       cancelDrawButton.css({ 'font-size': '100%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', 'width': '80%' });
    /*   cancelDrawButton.get(0).innerHTML = "Cancel";
       cancelDrawButton.click(function () {
           brushSliderPoint.attr('value', 7.0);
           currentInkController.updatePenWidth("brushSlider");
           removeInkCanv();
           inkDrawControls.hide();
           timeline.setModifyingInk(false);
           timeline.setEditInkOn(false);

           inkAuthoring.getInkUndoManager().clear();
           undoManager.greyOutBtn();
           // reset undo/redo buttons to global undo/redo functionality
           playbackControls.undoButton.off("click");
           playbackControls.redoButton.off("click");

           playbackControls.undoButton.on('click', function () {
               undoManager.undo();
           });
           playbackControls.redoButton.on('click', function () {
               undoManager.redo();
           });
           playbackControls.undoRedoInkOnly.css({ 'display': 'none' });
       });
       inkDrawControls.append(cancelDrawButton);

       var drawArray = []; // array of draw controls

       /////////////////////////////////////

       // draw mode div (contains draw and eraser labels)
       var drawModeDiv = $(document.createElement('div'));
       drawModeDiv.css({ "height": '10%', 'width': '80%', 'clear': 'both', 'margin-left': '8%', 'margin-top': '3%', 'display': 'none' });

       // draw mode label
       var drawModeLabel = $(document.createElement('div'));
       drawModeLabel.addClass('thicknessLabel');
       var drawModeLabel1 = $(document.createElement('div'));
       drawModeLabel.text("Mode: ");
       drawModeLabel1.text("Draw");
       drawModeLabel.append(drawModeLabel1);
       drawModeLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
       drawModeLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
       inkDrawControls.append(drawModeLabel);
       inkDrawControls.append(drawModeDiv);
       drawArray.push(drawModeDiv);

       // draw mode label click handler
       drawModeLabel.on('click', function () {
           $(".thicknessLabel").css({ 'font-weight': 'normal' });
           drawModeLabel.css({ 'font-weight': 'bold' });
           updateToggle(drawArray, drawModeDiv);
       });

       // draw label
       var drawMode = 'draw';
       var drawLabel = $(document.createElement('label'));
       drawLabel.css({ 'font-size': '120%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'bold', 'float': 'left' });
       drawLabel.text("Draw");
       drawModeDiv.append(drawLabel);

       // draw label click handler
       drawLabel.on('click', function () {
           if (drawMode === 'erase') {
               drawLabel.css({ 'color': 'black' });
               eraseLabel.css({ 'color': 'gray' });
               drawMode = 'draw';
               drawModeLabel1.text("Draw");
               currentInkController.setMode(1); // draw mode
           }
       });

       // erase label
       var eraseLabel = $(document.createElement('label'));
       eraseLabel.css({ 'font-size': '120%', 'color': 'gray', 'margin-right': '9%', 'font-weight': 'bold', 'float': 'right' });
       eraseLabel.text("Erase");
       drawModeDiv.append(eraseLabel);

       // block label click handler
       eraseLabel.on('click', function () {
           if (drawMode === 'draw') {
               drawLabel.css({ 'color': 'gray' });
               eraseLabel.css({ 'color': 'black' });
               drawMode = 'erase';
               drawModeLabel1.text("Erase");
               currentInkController.setMode(2); // erase mode
           }
       });

       /////////////////////////////////////



       // brush width label
       var brushLabel = $(document.createElement('div'));
       brushLabel.addClass('thicknessLabel');
       var brushLabel1 = $(document.createElement('div'));
       brushLabel.text("Width: ");
       brushLabel1.text("7px");
       brushLabel.append(brushLabel1);
       inkDrawControls.append(brushLabel);
       brushLabel1.css({ 'color': 'green',  'display': 'inline', 'padding-left': '2%' });
   /*    brushLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

       // brush width slider
       var brushSlider = $(document.createElement('div'));
       brushSlider.css({
           'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
           'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'
       });
       inkDrawControls.append(brushSlider);
       drawArray.push(brushSlider);
       var brushSliderPoint = $(document.createElement('div'));
       brushSliderPoint.attr('id', 'brushSlider');
       brushSliderPoint.css({
           'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': "relative",
           'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%"
       });
       brushSliderPoint.attr('value', 7.0);
       brushSlider.append(brushSliderPoint);

       // brush width label click handler -- opens brush width slider
       brushLabel.on('click', function () {
           $(".thicknessLabel").css({ 'font-weight': 'normal' });
           brushLabel.css({ 'font-weight': 'bold' });
           updateToggle(drawArray, brushSlider);
           //currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
       });
       
       // brush width slider drag handler
       brushSliderPoint.draggable({
           axis: "x", containment: "parent",
           scroll: false,
           drag: function (event) {
               brushSliderPoint.attr('value', (brushSliderPoint.css("left").replace('px', '') / (brushSlider.offset().left + brushSlider.width()) * 60 + 1) + 6); // get values in the right range
               if (brushSliderPoint.value < 7) {
                   brushSliderPoint.attr('value', 7.0);
               }
               currentInkController.updatePenWidth("brushSlider");
               currentInkController.setEraserWidth(brushSliderPoint.attr('value'));
               //currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
               brushLabel1.text(Math.round(brushSliderPoint.attr('value')) + "px");
           },
           appendTo: 'body'
       });
       
       // brush color label
       var colorLabel = $(document.createElement('div'));
       colorLabel.addClass('thicknessLabel');
       var colorLabel1 = $(document.createElement('div'));
       colorLabel1.addClass('changeColor1');
       colorLabel.text("Color: ");
       colorLabel1.text("#000000");
       colorLabel.append(colorLabel1);
       inkDrawControls.append(colorLabel);
       colorLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
       colorLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });

       // div to contain color picker
       var colorDiv = $(document.createElement('div'));
       colorDiv.css('display', 'none');
       inkDrawControls.append(colorDiv);
       drawArray.push(colorDiv);

       // color label click handler
       colorLabel.on('click', function () {
           $(".thicknessLabel").css({ 'font-weight': 'normal' });
           colorLabel.css({ 'font-weight': 'bold' });
           updateToggle(drawArray, colorDiv);
           currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
           drawLabel.css({ 'color': 'black' });
           eraseLabel.css({ 'color': 'gray' });
           drawMode = 'draw';
           drawModeLabel1.text("Draw");
       });

       // input element for color picker
       var item = document.createElement('input');
       $(item).attr('id', 'brushColorToggle');
       $(item).attr('readonly', 'readonly');
       $(item).css({ 'margin-left': '8%', 'float': 'left', 'margin-top': '3%', 'clear': 'left', 'width': '40%'});
       item.onfocus = function () {
           currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
       };
       $(item).on('keyup', function (event) {
           event.stopPropagation();
       });
       if (item.addEventListener) {
           item.addEventListener('DOMNodeInserted', function () {
               //initialize colorpicker object on current element
               myPicker = new jscolor.color(item, {});
               myPicker.fromString("000000");
               myPicker.onImmediateChange = function () {
                   currentInkController.updatePenColor("brushColorToggle");
                   currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
                   $('.changeColor1')[0].innerHTML = "#"+$("#brushColorToggle").attr("value");
               };
           }, false);
       }
       colorDiv.append(item);

       

       // draw opacity label
       var opacityLabel = $(document.createElement('div'));
       opacityLabel.addClass('thicknessLabel');
       var opacityLabel1 = $(document.createElement('div'));
       opacityLabel.text("Opacity: ");
       opacityLabel1.text("100%");
       opacityLabel.append(opacityLabel1);
       inkDrawControls.append(opacityLabel);
       opacityLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
       opacityLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });

       // draw opacity slider
       var opacitySlider = $(document.createElement('div'));
       opacitySlider.css({
           'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
           'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'
       });
       inkDrawControls.append(opacitySlider);
       drawArray.push(opacitySlider);
       var opacitySliderPoint = $(document.createElement('div'));
       opacitySliderPoint.attr('id', 'opacitySlider');
       opacitySliderPoint.css({
           'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
           'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", "margin-top": "-0.57%"
       });
       opacitySliderPoint.attr("value", 1.0);
       opacitySlider.append(opacitySliderPoint);

       // opacity label click handler
       opacityLabel.on('click', function () {
           $(".thicknessLabel").css({ 'font-weight': 'normal' });
           opacityLabel.css({ 'font-weight': 'bold' });
           updateToggle(drawArray, opacitySlider);
           currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
           drawLabel.css({ 'color': 'black' });
           eraseLabel.css({ 'color': 'gray' });
           drawMode = 'draw';
           drawModeLabel1.text("Draw");
       });

       // opacity slider drag handler
       opacitySliderPoint.draggable({
           axis: "x", containment: "parent",
           scroll: false,
           drag: function (event) {
               opacitySliderPoint.attr('value', (parseFloat(opacitySliderPoint.css("left").replace('px', '')) / (parseFloat(opacitySlider.offset().left) + parseFloat(opacitySlider.width())) * 1.28));
               if (opacitySliderPoint[0].value > 0.99) {
                   opacitySliderPoint.attr('value', 1.0);
               }
               else if (opacitySliderPoint[0].value < 0) {
                   opacitySliderPoint.attr('value', 0.0);
               }
               currentInkController.updatePenOpacity("opacitySlider");
               opacityLabel1.text(Math.round(100 * opacitySliderPoint.attr("value")) + "%");
           },
           appendTo: 'body'
       });
       
       // draw attach buttons
       var linkDrawDiv = getAttachDiv(inkDrawControls);
       inkDrawControls.append(linkDrawDiv);
       functionsPanel.append(inkDrawDocfrag);

       /**
        * Edit draw controls (edit mode)
        */

    // edit draw control panel
    /*     var editDrawDocfrag = document.createDocumentFragment();
         inkEditDraw = $(document.createElement('div'));
         inkEditDraw.attr("id", "inkEditDraw");
         inkEditDraw.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-y': 'auto', 'margin-top': '8%', });
         editDrawDocfrag.appendChild(inkEditDraw[0]);
         inkEditDraw.css('display', 'none');
 
         // cancel edit draw button
         var cancelEditDrawButton = $(document.createElement('button'));
         cancelEditDrawButton.css({ 'font-size': '100%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', 'width': '80%' });
         cancelEditDrawButton.get(0).innerHTML = "Cancel";
         inkEditDraw.append(cancelEditDrawButton);
 
         var drawEditArray = []; // array of draw controls
 
         /////////////////////////////////////
 
         // draw mode div (contains draw and eraser labels)
         var drawEditModeDiv = $(document.createElement('div'));
         drawEditModeDiv.css({ "height": '10%', 'width': '80%', 'clear': 'both', 'margin-left': '8%', 'margin-top': '3%', 'display': 'none' });
 
         // draw mode label
         var drawEditModeLabel = $(document.createElement('div'));
         drawEditModeLabel.addClass('thicknessLabel');
         var drawEditModeLabel1 = $(document.createElement('div'));
         drawEditModeLabel.text("Mode: ");
         drawEditModeLabel1.text("Draw");
         drawEditModeLabel.append(drawEditModeLabel1);
         drawEditModeLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
         drawEditModeLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
         inkEditDraw.append(drawEditModeLabel);
         inkEditDraw.append(drawEditModeDiv);
         drawEditArray.push(drawEditModeDiv);
 
         // draw mode label click handler
         drawEditModeLabel.on('click', function () {
             $(".thicknessLabel").css({ 'font-weight': 'normal' });
             drawEditModeLabel.css({ 'font-weight': 'bold' });
             updateToggle(drawEditArray, drawEditModeDiv);
         });
 
         // draw label
         var drawEditMode = 'draw';
         var drawEditLabel = $(document.createElement('label'));
         drawEditLabel.css({ 'font-size': '120%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'bold', 'float': 'left' });
         drawEditLabel.text("Draw");
         drawEditModeDiv.append(drawEditLabel);
 
         // draw label click handler
         drawEditLabel.on('click', function () {
             if (drawEditMode === 'erase') {
                 drawEditLabel.css({ 'color': 'black' });
                 eraseEditLabel.css({ 'color': 'gray' });
                 drawEditMode = 'draw';
                 drawEditModeLabel1.text("Draw");
                 currentInkController.setMode(1); // draw mode
             }
         });
 
         // erase label
         var eraseEditLabel = $(document.createElement('label'));
         eraseEditLabel.css({ 'font-size': '120%', 'color': 'gray', 'margin-right': '9%', 'font-weight': 'bold', 'float': 'right' });
         eraseEditLabel.text("Erase");
         drawEditModeDiv.append(eraseEditLabel);
 
         // block label click handler
         eraseEditLabel.on('click', function () {
             if (drawEditMode === 'draw') {
                 drawEditLabel.css({ 'color': 'gray' });
                 eraseEditLabel.css({ 'color': 'black' });
                 drawEditMode = 'erase';
                 drawEditModeLabel1.text("Erase");
                 currentInkController.setMode(2); // erase mode
             }
         });
 
         /////////////////////////////////////
 
         // brush width label
         var brushEditLabel = $(document.createElement('div'));
         brushEditLabel.addClass('thicknessLabel');
         var brushEditLabel1 = $(document.createElement('div'));
         brushEditLabel.text("Width: ");
         brushEditLabel1.text("7px");
         brushEditLabel.append(brushEditLabel1);
         inkEditDraw.append(brushEditLabel);
         brushEditLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
         brushEditLabel.css({ '-ms-touch-action': 'none', 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
 
         // brush width slider
         var brushEditSlider = $(document.createElement('div'));
         brushEditSlider.addClass("brushEditSlider");
         brushEditSlider.css({
             'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
             'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative', 'float': 'left'
         });
         inkEditDraw.append(brushEditSlider);
         drawEditArray.push(brushEditSlider);
         var brushEditSliderPoint = $(document.createElement('div'));
         brushEditSliderPoint.attr('id', 'brushEditSlider');
         brushEditSliderPoint.css({
             'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': "relative",
             'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%"
         });
         brushEditSliderPoint.attr('value', 7.0);
         brushEditSlider.append(brushEditSliderPoint);
 
         // brush width label click handler
         brushEditLabel.on('click', function () {
             $(".thicknessLabel").css({ 'font-weight': 'normal' });
             brushEditLabel.css({ 'font-weight': 'bold' });
             updateToggle(drawEditArray, brushEditSlider);
             //currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
         });
 
         // brush width slider drag handler
         brushEditSliderPoint.draggable({
             axis: "x", containment: "parent",
             scroll: false,
             drag: function (event) {
                 brushEditSliderPoint.attr('value', (brushEditSliderPoint.css("left").replace('px', '') / (brushEditSlider.offset().left + brushEditSlider.width()) * 60 + 1) + 6);// * 24.33 + 1;
                 if (brushEditSliderPoint.value < 7) {
                     brushEditSliderPoint.attr('value', 7.0);
                 }
                 currentInkController.updatePenWidth("brushEditSlider");
                 //currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
                 brushEditLabel1.text(Math.round(brushEditSliderPoint.attr('value')) + "px");
             },
             appendTo: 'body'
         });
 
         // brush color label
         var colorEditLabel = $(document.createElement('div'));
         colorEditLabel.addClass('thicknessLabel');
         var colorEditLabel1 = $(document.createElement('div'));
         colorEditLabel1.addClass('changeColor1Edit');
         colorEditLabel.text("Color: ");
         colorEditLabel1.text("#000000");
         colorEditLabel.append(colorEditLabel1);
         inkEditDraw.append(colorEditLabel);
         colorEditLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
         colorEditLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
 
         // div containing color picker
         var colorEditDiv = $(document.createElement('div'));
         colorEditDiv.css('display', 'none');
         inkEditDraw.append(colorEditDiv);
         drawEditArray.push(colorEditDiv);
 
         // color label click handler
         colorEditLabel.on('click', function () {
             $(".thicknessLabel").css({ 'font-weight': 'normal' });
             colorEditLabel.css({ 'font-weight': 'bold' });
             updateToggle(drawEditArray, colorEditDiv);
             currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
             drawEditLabel.css({ 'color': 'black' });
             eraseEditLabel.css({ 'color': 'gray' });
             drawEditMode = 'draw';
             drawEditModeLabel1.text("Draw");
         });
 
         // input element for color picker
         var itemEdit = document.createElement('input');
         $(itemEdit).attr('id', 'brushEditColorToggle');
         $(itemEdit).attr('readonly', 'readonly');
         $(itemEdit).css({ 'margin-left': '8%', 'float': 'left', 'margin-top': '3%', 'clear': 'left', 'width': '40%' });
         itemEdit.onfocus = function () {
             currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
             drawEditLabel.css({ 'color': 'black' });
             eraseEditLabel.css({ 'color': 'gray' });
             drawEditMode = 'draw';
             drawEditModeLabel1.text("Draw");
         };
         $(itemEdit).on('keyup', function (event) {
             event.stopPropagation();
         });
         if (itemEdit.addEventListener) {
             itemEdit.addEventListener('DOMNodeInserted', function () {
                 //initialize colorpicker object on current element
                 myEditDrawPicker = new jscolor.color(itemEdit, {});
                 myEditDrawPicker.fromString("000000");
                 myEditDrawPicker.onImmediateChange = function () {
                     currentInkController.updatePenColor("brushEditColorToggle");
                     currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
                     drawEditLabel.css({ 'color': 'black' });
                     eraseEditLabel.css({ 'color': 'gray' });
                     drawEditMode = 'draw';
                     drawEditModeLabel1.text("Draw");
                     $('.changeColor1Edit')[0].innerHTML = currentInkController.getPenColor();
                 };
             }, false);
         }
         colorEditDiv.append(itemEdit);
         
         
 
         // draw opacity label
         var opacityEditLabel = $(document.createElement('div'));
         opacityEditLabel.addClass('thicknessLabel');
         var opacityEditLabel1 = $(document.createElement('div'));
         opacityEditLabel.text("opacity: ");
         opacityEditLabel1.text("100%");
         opacityEditLabel.append(opacityEditLabel1);
         inkEditDraw.append(opacityEditLabel);
         opacityEditLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
         opacityEditLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
 
         // draw opacity slider
         var opacityEditSlider = $(document.createElement('div'));
         opacityEditSlider.css({
             'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
             'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'
         });
         inkEditDraw.append(opacityEditSlider);
         drawEditArray.push(opacityEditSlider);
         var opacityEditSliderPoint = $(document.createElement('div'));
         opacityEditSliderPoint.attr('id', 'opacityEditSlider');
         opacityEditSliderPoint.css({
             'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
             'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", 'left': '87%', "margin-top": "-0.57%"
         });
         opacityEditSliderPoint.attr("value", 1.0);
         opacityEditSlider.append(opacityEditSliderPoint);
 
         // draw opacity label click handler
         opacityEditLabel.on('click', function () {
             $(".thicknessLabel").css({ 'font-weight': 'normal' });
             opacityEditLabel.css({ 'font-weight': 'bold' });
             updateToggle(drawEditArray, opacityEditSlider);
             currentInkController.setMode(1);
             drawEditLabel.css({ 'color': 'black' });
             eraseEditLabel.css({ 'color': 'gray' });
             drawEditMode = 'draw';
             drawEditModeLabel1.text("Draw");
         });
 
         // draw opacity slider drag handler
         opacityEditSliderPoint.draggable({
              axis: "x", containment: "parent",
              scroll: false,
              drag: function (event) {
                  opacityEditSliderPoint.attr('value', (parseFloat(opacityEditSliderPoint.css("left").replace('px', '')) / (parseFloat(opacityEditSlider.offset().left) + parseFloat(opacityEditSlider.width())) * 1.28));
                  if (opacityEditSliderPoint[0].value > 0.99) {
                      opacityEditSliderPoint.attr('value', 1.0);
                  }
                  else if (opacityEditSliderPoint[0].value < 0) {
                      opacityEditSliderPoint.attr('value', 0.0);
                  }
                  currentInkController.updatePenOpacity("opacityEditSlider");
                  opacityEditLabel1.text(Math.round(100 * opacityEditSliderPoint.attr("value")) + "%");
              },
              appendTo: 'body'
          });
         
 
         // edit draw save button
         var saveDrawButton = $(document.createElement('button'));
         saveDrawButton.css({ 'font-size': '100%', 'color': 'black', 'margin-top': '3%', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', 'width': '80%' });
         saveDrawButton.get(0).innerHTML = "Save";
         inkEditDraw.append(saveDrawButton);
 
         functionsPanel.append(editDrawDocfrag); */




    /////////////////////////
    ///// DRAW INK STUFF
    ////////////////////////





    /**Creates form to which draw ink controls are appended
     * @method createInitialDrawControls
     */
    function createInitialDrawControls() {
        inkDrawDocfrag = document.createDocumentFragment();
        inkDrawControls = $(document.createElement('div'));
        inkDrawControls.attr("id", "inkDrawControls");
        inkDrawControls.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-y': 'auto', 'margin-top': '8%' });
        inkDrawDocfrag.appendChild(inkDrawControls[0]);
        inkDrawControls.css({ "display": "none" });
    }

    var modeInput;

    /**Creates form input elements
     * @method createInkDrawControls
     * @return {Object} public methodsof the form
     */
    function createInkDrawControls() {
        modeInput = createDrawModeInput(inkDrawControls);
        var colorInput = createDrawColorInput(inkDrawControls, function (color) {
            currentInkController.setFontColor(color);
        });
        var sizeInput = createBrushInput(inkDrawControls);
        var opacityInput = createDrawOpacityInput(inkDrawControls);
        var linkDrawDiv = getAttachDiv(inkDrawControls, false, false);

        /**Updates inputs on change
         * @method updateInputs
         * @param {Object} values       new values of the ink
         */
        function updateInputs(values) {
            if (values) {
                colorInput.updateColor(values.color);
                sizeInput.updateStrokeSize(values.size);
                opacityInput.updateOpacity(values.opacity);
            } else {
                colorInput.updateColor();
                sizeInput.updateStrokeSize();
                opacityInput.updateOpacity();
                modeInput.updateMode();
            }
        }

        /**Appends the inputs to the form
         * @method showForm
         */
        function showForm() {
            functionsPanel.append(inkDrawDocfrag);
        }

        /**Creates form specifications according to new ink/edit existing ink 
         * @method createModeButton
         */
        function createModeButton() {
            if (isEditingDraw) {
                inkDrawControls.append(saveDrawButton);
                linkDrawDiv.detach();
            } else {
                saveDrawButton.detach();
                inkDrawControls.append(linkDrawDiv);
            }
        }

        return {
            updateInputs: updateInputs,
            showForm: showForm,
            createModeButton: createModeButton
        };
    }

    /**Creates draw/erase mode input
     * @method createDrawModeInput
     * @param {HTML Element} form          div to append inputs to 
     * @param {Function} handler           sets draw mode
     * @return {Object} public method to update values
     */
    function createDrawModeInput(form, handler) {
        var drawModeLabel = $(document.createElement('div'));
        var drawModeLabel1 = $(document.createElement('div'));
        var drawModeDiv = $(document.createElement('div'));
        var drawLabel = $(document.createElement('label'));
        var eraseLabel = $(document.createElement('label'));
        drawMode = 'draw';

        drawModeDiv.css({ "height": '10%', 'width': '80%', 'clear': 'both', 'margin-left': '8%', 'margin-top': '3%', 'display': 'none' });
        drawModeLabel.addClass('thicknessLabel');


        drawModeLabel.text("Mode: ");
        drawModeLabel1.text("Draw");
        drawModeLabel.append(drawModeLabel1);
        eraseLabel.text("Erase");
        drawLabel.text("Draw");


        drawModeLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        drawModeLabel1.text('Draw');
        drawModeLabel.css(labelCSS());
        drawModeLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            drawModeLabel.css({ 'font-weight': 'bold' });
            updateToggle(drawArray, drawModeDiv);
        });
        form.append(drawModeLabel);
        form.append(drawModeDiv);
        drawArray.push(drawModeDiv);
        drawLabel.css({ 'font-size': '70%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'bold', 'float': 'left' });
        eraseLabel.css({ 'font-size': '70%', 'color': 'gray', 'margin-right': '9%', 'font-weight': 'bold', 'float': 'right' });
        drawModeDiv.append(drawLabel);
        drawModeDiv.append(eraseLabel);

        drawLabel.on('click', function () {
            if (drawMode === 'erase') {
                drawLabel.css({ 'color': 'black' });
                eraseLabel.css({ 'color': 'gray' });
                drawModeLabel1.text("Draw");
                drawMode = 'draw';
                currentInkController.setMode(1); // draw mode
            }
        });

        eraseLabel.on('click', function () {
            if (drawMode === 'draw') {
                drawLabel.css({ 'color': 'gray' });
                eraseLabel.css({ 'color': 'black' });
                drawModeLabel1.text("Erase");
                drawMode = 'erase';
                currentInkController.setMode(2); // erase mode
            }
        });

        function updateMode() {
            drawLabel.css({ 'color': 'black' });
            eraseLabel.css({ 'color': 'gray' });
            drawModeLabel1.text("Draw");
            drawMode = 'draw';
            currentInkController.setMode(1); // draw mode
        }

        return {
            updateMode: updateMode
        }
    }

    /**Creates input to set brush stroke size
     * @method createBrushInput
     * @param {HTML Element} form
     * @return {Object} public methods
     */
    function createBrushInput(form) {
        var brushLabel = $(document.createElement('div'));
        var brushLabel1 = $(document.createElement('div'));
        var brushSlider = $(document.createElement('div'));
        var brushSliderPoint = $(document.createElement('div'));

        brushLabel.addClass('thicknessLabel');
        brushLabel.text("Width: ");
        brushLabel1.text("7px");
        brushLabel.append(brushLabel1);
        brushSliderPoint.attr('id', 'brushSlider');
        form.append(brushLabel);
        brushLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        brushLabel.css(labelCSS());

        brushSlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'
        });
        brushSliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': "relative",
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%"
        });
        brushSlider.append(brushSliderPoint);
        form.append(brushSlider);

        brushLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            brushLabel.css({ 'font-weight': 'bold' });
            updateToggle(drawArray, brushSlider);
        });
        drawArray.push(brushSlider);
        // brush width slider drag handler
        brushSliderPoint.draggable({
            axis: "x", containment: "parent",
            scroll: false,
            drag: function (event) {
                updateStrokeSize(brushSliderPoint.attr('value'));
            },
            appendTo: 'body'
        });

        /**Handles updateing brush stroke size
         * @method updateStrokeSize
         * @param {Number} size
         */
        function updateStrokeSize(size) {
            if (size) {
                brushSliderPoint.attr('value', (brushSliderPoint.css("left").replace('px', '') / (brushSlider.offset().left + brushSlider.width()) * 60 + 1) + 6); // get values in the right range
                brushSliderPoint.css({ 'left': brushSliderPoint.css('left') });
                brushSlider.attr('value', brushSliderPoint.attr('value'));
                if (brushSliderPoint.value < 7) {
                    brushSliderPoint.attr('value', 7.0);
                }
                currentInkController.setPenWidth(brushSliderPoint.attr('value'));
                currentInkController.setEraserWidth(brushSliderPoint.attr('value'));
                currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
                brushLabel1.text(Math.round(brushSliderPoint.attr('value')) + "px");

                // switch to draw mode
                modeInput.updateMode();
            } else {
                brushSliderPoint.attr('value', 7.0);
                currentInkController.setPenWidth(brushSliderPoint.attr('value'));
                currentInkController.setEraserWidth(brushSliderPoint.attr('value'));
                brushLabel1.text('7 px');
                brushSliderPoint.css("left", "0px");
            }
        }

        return {
            updateStrokeSize: updateStrokeSize
        };
    }

    /**Creates input to set brush color
     * @method createDrawColorInput
     * @param {HTML Element} form
     * @pram handler
     * @return {Object} public methods
     */
    function createDrawColorInput(form, handler) {
        var colorLabel = $(document.createElement('div'));
        var colorLabel1 = $(document.createElement('div'));
        var colorDiv = $(document.createElement('div'));
        var item = $(document.createElement('input'));

        colorLabel.addClass('thicknessLabel');
        colorLabel1.addClass('changeColor1');
        colorLabel.text("Color: ");
        colorLabel1.text("#000000");
        colorLabel.append(colorLabel1);
        form.append(colorLabel);

        colorLabel.css(labelCSS());
        colorLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });

        form.append(colorDiv);
        drawArray.push(colorDiv);

        colorLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            colorLabel.css({ 'font-weight': 'bold' });

            currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
            //  drawLabel.css({ 'color': 'black' });
            //  eraseLabel.css({ 'color': 'gray' });

            drawMode = 'draw';
            updateToggle(drawArray, colorDiv);
            //  drawModeLabel1.text("Draw");
        });

        $(item).attr('id', 'brushColorToggle');
        $(item).attr('readonly', 'readonly');
        $(item).css({ 'margin-left': '8%', 'float': 'left', 'margin-top': '3%', 'clear': 'left', 'width': '40%' });
        item.onfocus = function () {
            currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
        };

        $(item).on('keyup', function (event) {
            event.stopPropagation();
        });
        if (item[0].addEventListener) {
            item[0].addEventListener('DOMNodeInserted', function () {
                //initialize colorpicker object on current element
                myPicker = new jscolor.color(item[0], {});
                myPicker.fromString("000000");
                myPicker.onImmediateChange = function () {
                    colorLabel1.text($('#brushColorToggle').attr('value'));
                    currentInkController.setPenColor($('#brushColorToggle').attr('value'));
                    updateColor(currentInkController.getPenColor());
                };
            }, false);
        }
        colorDiv.append(item);

        /**Updates brush stroke color
         * @method updateColor
         * @param color
         */
        function updateColor(color) {
            if (color) {
                colorLabel1.text(color.replace('#', ''));
                $('#brushColorToggle').attr('value', color);
                $('.changeColor1').text($("#brushColorToggle").attr('value'));
                $(item).css({ 'background-color': color, 'text': color });
                currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
                $('.changeColor1')[0].innerHTML = $("#brushColorToggle").attr("value");
                $(item).css({ 'background-color': '#' + color, 'text': color });

                // switch to draw mode
                modeInput.updateMode();
            } else {
                $(item).css({ 'background-color': '#000000', 'text': '#000000' });
                colorLabel1.text("#000000");
                $('#brushColorToggle').attr('value', "000000");
                currentInkController.setPenColor("#000000");
                currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
                colorLabel1.text("#" + $("#brushColorToggle").attr("value"));
            }
        }

        return {
            updateColor: updateColor
        };
    }

    /**Creates input to set brush stroke opacity
     * @method createDrawOpacityInput
     * @param {HTML Element} form
     * @param {Function} handler
     * @return {Object} public methods
     */
    function createDrawOpacityInput(form, handler) {
        var opacityLabel = $(document.createElement('div'));
        var opacityLabel1 = $(document.createElement('div'));
        var opacitySlider = $(document.createElement('div'));
        var opacitySliderPoint = $(document.createElement('div'));

        opacityLabel.addClass('thicknessLabel');
        opacityLabel.text("Opacity: ");
        opacityLabel1.text("100%");
        opacityLabel.append(opacityLabel1);
        form.append(opacityLabel);
        opacityLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        opacityLabel.css(labelCSS());
        opacitySlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'
        });

        opacitySliderPoint.attr('id', 'opacitySlider');
        opacitySliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", "margin-top": "-0.57%"
        });
        opacitySlider.append(opacitySliderPoint);
        form.append(opacitySlider);
        opacityLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            opacityLabel.css({ 'font-weight': 'bold' });
            updateToggle(drawArray, opacitySlider);
        });

        // opacity slider drag handler
        opacitySliderPoint.draggable({
            axis: "x", containment: "parent",
            scroll: false,
            drag: function (event) {
                updateOpacity(opacitySliderPoint.attr('value'));
            },
            appendTo: 'body'
        });
        drawArray.push(opacitySlider);

        /**Handles updating opcacity of 'draw' ink
         * @method updateOpacity
         * @param {Number} opacity
         */
        function updateOpacity(opacity) {
            if (opacity > -1) {
                opacitySliderPoint.attr('value', (parseFloat(opacitySliderPoint.css("left").replace('px', '')) / (parseFloat(opacitySlider.offset().left) + parseFloat(opacitySlider.width())) * 1.28));
                if (opacitySliderPoint[0].value > 0.99) {
                    opacitySliderPoint.attr('value', 1.0);
                } else if (opacitySliderPoint[0].value < 0) {
                    opacitySliderPoint.attr('value', 0.0);
                }
                currentInkController.setPenOpacity(opacitySliderPoint.attr('value'));
                opacityLabel1.text(Math.round(100 * opacitySliderPoint.attr("value")) + "%");
                opacitySliderPoint.css({ 'left': (0.87 * opacitySlider.width()) + 'px' });

                // switch to draw mode
                modeInput.updateMode();
            } else {
                opacitySliderPoint.attr('value', 1.0);
                currentInkController.setPenOpacity(opacitySliderPoint.attr('value'));
                opacityLabel1.text("100%");
                opacitySliderPoint.css("left", "242.5px");
            }
        }

        return {
            updateOpacity: updateOpacity
        };
    }

    /**creates cancel button for draw ink tracks
     * @method createCancelDrawButton
     * @return {HTML Element} cancelDrawButton
     */
    function createCancelDrawButton() {
        // draw cancel button
        var cancelDrawButton = $(document.createElement('button'));
        cancelDrawButton.css({ 'font-size': '70%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', /*'width': '25%'*/ 'width': '80%' , 'height': '20%' });
        cancelDrawButton.get(0).innerHTML = "Cancel";
        cancelDrawButton.click(function () {
            // brushSliderPoint.attr('value', 7.0);
            // currentInkController.updatePenWidth("brushSlider");
            removeInkCanv();
            inkDrawControls.hide();
            timeline.setModifyingInk(false);
            timeline.setEditInkOn(false);
            INITIAL_DRAW.updateInputs(drawValues);
            inkAuthoring.getInkUndoManager().clear();
            undoManager.greyOutBtn();
            // reset undo/redo buttons to global undo/redo functionality
            playbackControls.undoButton.off("click");
            playbackControls.redoButton.off("click");

            playbackControls.undoButton.on('click', function () {
                undoManager.undo();
            });
            playbackControls.redoButton.on('click', function () {
                undoManager.redo();
            });
            playbackControls.undoRedoInkOnly.css({ 'display': 'none' });
        });
        inkDrawControls.append(cancelDrawButton);
        return cancelDrawButton;
    }


    /////////////////////////////
    //// DRAW INK - TILL HERE
    ///////////////////////////











    /**
     * Ink transparency controls (initial authoring, not editing mode)
     */

    // transparency control panel
    /*        var inkTransparencyDocfrag = document.createDocumentFragment();
            inkTransparencyControls = $(document.createElement('div'));
            inkTransparencyControls.attr("id","inkTransControls");
            inkTransparencyControls.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-y': 'auto', 'margin-top': '8%' });
            inkTransparencyDocfrag.appendChild(inkTransparencyControls[0]);
            inkTransparencyControls.css({ "display": "none" });
    
            // trans cancel button
            var cancelTransButton = $(document.createElement('button'));
            cancelTransButton.css({ 'font-size': '100%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', 'width': '80%' });
            cancelTransButton.get(0).innerHTML = "Cancel";
            cancelTransButton.on('click', function () {
                removeInkCanv();
                inkTransparencyControls.hide();
                timeline.setModifyingInk(false);
                timeline.setEditInkOn(false);
    
                inkAuthoring.getInkUndoManager().clear();
                undoManager.greyOutBtn();
                // revert undo/redo buttons to global undo/redo functionality
                playbackControls.undoButton.off("click");
                playbackControls.redoButton.off("click");
                playbackControls.undoButton.on('click', function () {
                    undoManager.undo();
                });
                playbackControls.redoButton.on('click', function () {
                    undoManager.redo();
                });
                //console.log("reseting undo-redo buttons to global");
                playbackControls.undoRedoInkOnly.css({ 'display': 'none' });
            });
            inkTransparencyControls.append(cancelTransButton);
    
            var transArray = []; // array of transparency controls
            
            // add ellipse bounding shape button
            var addEllipseButton = $(document.createElement('button'));
            addEllipseButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '3%', 'clear': 'left' });
            addEllipseButton.get(0).innerHTML = "Add Ellipse";
            addEllipseButton.on('click', function () {
                currentInkController.addEllipse();
            });
            inkTransparencyControls.append(addEllipseButton);
    
            // add rectangle bounding shape button
            var addRectButton = $(document.createElement('button'));
            addRectButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '3%' });
            addRectButton.get(0).innerHTML = "Add Rectangle";
            addRectButton.on('click', function () {
                currentInkController.addRectangle();
            });
            inkTransparencyControls.append(addRectButton);
    
            // trans mode div (contains isolate and block labels)
            var transModeDiv = $(document.createElement('div'));
            transModeDiv.css({ "height": '10%', 'width': '80%', 'clear': 'both', 'margin-left': '8%', 'margin-top': '3%', 'display': 'none' });
    
            // trans mode label
            var transModeLabel = $(document.createElement('div'));
            transModeLabel.addClass('thicknessLabel');
            var transModeLabel1 = $(document.createElement('div'));
            transModeLabel.text("Mode: ");
            transModeLabel1.text("Isolate");
            transModeLabel.append(transModeLabel1);
            transModeLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
            transModeLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
            inkTransparencyControls.append(transModeLabel);
            inkTransparencyControls.append(transModeDiv);
            transArray.push(transModeDiv);
    
            // trans mode label click handler
            transModeLabel.on('click', function () {
                $(".thicknessLabel").css({ 'font-weight': 'normal' });
                transModeLabel.css({ 'font-weight': 'bold' });
                updateToggle(transArray, transModeDiv);
            });
    
            // isolate label
            var transparencyMode = 'isolate';
            var isolateLabel = $(document.createElement('label'));
            isolateLabel.css({ 'font-size': '120%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'bold', 'float': 'left' });
            isolateLabel.text("Isolate");
            transModeDiv.append(isolateLabel);
    
            // isolate label click handler
            isolateLabel.on('click', function () {
                if (transparencyMode === 'block') {
                    isolateLabel.css({ 'color': 'black' });
                    blockLabel.css({ 'color': 'gray' });
                    transparencyMode = 'isolate';
                    transModeLabel1.text("Isolate");
                    currentInkController.setTransMode("isolate");         
                }
            });
    
            // block label
            var blockLabel = $(document.createElement('label'));
            blockLabel.css({ 'font-size': '120%', 'color': 'gray', 'margin-right': '9%', 'font-weight': 'bold', 'float': 'right' });
            blockLabel.text("Block");
            transModeDiv.append(blockLabel);
    
            // block label click handler
            blockLabel.on('click', function () {
                if (transparencyMode === 'isolate') {
                    isolateLabel.css({ 'color': 'gray' });
                    blockLabel.css({ 'color': 'black' });
                    transparencyMode = 'block';
                    transModeLabel1.text("Block");
                    currentInkController.setTransMode("block");
                }
            });
    
            // trans opacity label
            var opacityTransparencyLabel = $(document.createElement('div'));
            opacityTransparencyLabel.addClass('thicknessLabel');
            var opacityTransparencyLabel1 = $(document.createElement('div'));
            opacityTransparencyLabel.text("Opacity: ");
            opacityTransparencyLabel1.text("80%");
            opacityTransparencyLabel.append(opacityTransparencyLabel1);
            inkTransparencyControls.append(opacityTransparencyLabel);
            opacityTransparencyLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
            opacityTransparencyLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
    
            // trans opacity slider
            var opacityTransparencySlider = $(document.createElement('div'));
            opacityTransparencySlider.css({
                'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
                'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'/*, 'float': 'left'*/

    /*      });
          var opacityTransparencySliderPoint = $(document.createElement('div'));
          opacityTransparencySliderPoint.attr("id", "opacityTransparencySliderPoint");
          opacityTransparencySliderPoint.css({
              'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
              'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", "margin-top": "-0.57%"
          });
          opacityTransparencySlider.append(opacityTransparencySliderPoint);
          inkTransparencyControls.append(opacityTransparencySlider);
  
          // trans opacity label click handler
          opacityTransparencyLabel.on('click', function () {
              $(".thicknessLabel").css({ 'font-weight': 'normal' });
              opacityTransparencyLabel.css({ 'font-weight': 'bold' });
              updateToggle(transArray, opacityTransparencySlider);
          });
  
          // trans opacity slider drag handler
          opacityTransparencySliderPoint.draggable({
              axis: "x", containment: "parent",
              scroll: false,
              drag: function (event) {
                  opacityTransparencySliderPoint.attr('value', (parseFloat(opacityTransparencySliderPoint.css("left").replace('px', '')) / (parseFloat(opacityTransparencySlider.offset().left) + parseFloat(opacityTransparencySlider.width())) * 1.28));
                  if (opacityTransparencySliderPoint[0].value > 0.99) {
                      opacityTransparencySliderPoint.attr('value', 1.0);
                  }
                  else if (opacityTransparencySliderPoint[0].value < 0) {
                      opacityTransparencySliderPoint.attr('value', 0.0);
                  }
                  currentInkController.setMarqueeFillOpacity(parseFloat(opacityTransparencySliderPoint.attr("value")));
                  opacityTransparencyLabel1.text(Math.round(100 * opacityTransparencySliderPoint.attr("value")) + "%");
              },
              appendTo: 'body'
          });
          transArray.push(opacityTransparencySlider);
  
          // trans attach buttons
          var linkTransDiv = getAttachDiv(inkTransparencyControls, 0, "trans");
          inkTransparencyControls.append(linkTransDiv);
          functionsPanel.append(inkTransparencyDocfrag); 
  
  
  
  
  
  
          /**
           * Edit transparency controls (edit mode)
           */

    // edit trans control panel
    /*       var editTransparencyDocfrag = document.createDocumentFragment();
           inkEditTransparency = $(document.createElement('div'));
           inkEditTransparency.attr("id", "inkEditTransparency");
           inkEditTransparency.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-y': 'auto', 'margin-top': '8%' });
           editTransparencyDocfrag.appendChild(inkEditTransparency[0]);
           inkEditTransparency.css({ "display": "none" });
   
           // trans cancel button
           var cancelEditTransButton = $(document.createElement('button'));
           cancelEditTransButton.css({ 'font-size': '100%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', 'width': '80%' });
    /*       cancelEditTransButton.get(0).innerHTML = "Cancel";
           inkEditTransparency.append(cancelEditTransButton);
   
           var transEditArray = []; // array of edit transparency controls
   
           // add ellipse bounding shape button
           var addEditEllipseButton = $(document.createElement('button'));
           addEditEllipseButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '3%', 'clear': 'left' });
           addEditEllipseButton.get(0).innerHTML = "Add Ellipse";
           addEditEllipseButton.on('click', function () {
               currentInkController.addEllipse();
           });
           inkEditTransparency.append(addEditEllipseButton);
   
           // add rectangle bounding shape button
           var addEditRectButton = $(document.createElement('button'));
           addEditRectButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '3%' });
           addEditRectButton.get(0).innerHTML = "Add Rectangle";
           addEditRectButton.on('click', function () {
               currentInkController.addRectangle();
           });
           inkEditTransparency.append(addEditRectButton);
   
           // div containing transparency mode options
           var transEditModeDiv = $(document.createElement('div'));
           transEditModeDiv.css({ "height": '10%', 'width': '80%', 'clear': 'both', 'margin-left': '8%', 'margin-top': '3%', 'display': 'none' });
   
           // trans mode label
           var transEditModeLabel = $(document.createElement('div'));
           transEditModeLabel.addClass('thicknessLabel');
           var transEditModeLabel1 = $(document.createElement('div'));
           transEditModeLabel.text("Mode: ");
           transEditModeLabel1.text("Isolate");
           transModeLabel.attr("id", "transModeLabel");
           transEditModeLabel.append(transEditModeLabel1);
           transEditModeLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
           transEditModeLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
           inkEditTransparency.append(transEditModeLabel);
           inkEditTransparency.append(transEditModeDiv);
           transEditArray.push(transEditModeDiv);
   
           //trans mode click handler
           transEditModeLabel.on('click', function () {
               $(".thicknessLabel").css({ 'font-weight': 'normal' });
               transEditModeLabel.css({ 'font-weight': 'bold' });
               updateToggle(transEditArray, transEditModeDiv);
           });
   
           var transparencyEditMode = 'isolate';
   
           // isolate label
           var isolateEditLabel = $(document.createElement('label'));
           isolateEditLabel.css({ 'font-size': '120%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'bold', 'float': 'left' });
           isolateEditLabel.text("Isolate");
           transEditModeDiv.append(isolateEditLabel);
   
           // isolate label click handler
           isolateEditLabel.on('click', function () {
               if (transparencyEditMode === 'block') {
                   isolateEditLabel.css({ 'color': 'black' });
                   blockEditLabel.css({ 'color': 'gray' });
                   transparencyEditMode = 'isolate';
                   transEditModeLabel1.text("Isolate");
                   currentInkController.setTransMode("isolate");
               }
           });
   
           // block label
           var blockEditLabel = $(document.createElement('label'));
           blockEditLabel.css({ 'font-size': '120%', 'color': 'gray', 'margin-right': '9%', 'font-weight': 'bold', 'float': 'right' });
           blockEditLabel.text("Block");
           transEditModeDiv.append(blockEditLabel);
   
           // block label click handler
           blockEditLabel.on('click', function () {
               if (transparencyEditMode === 'isolate') {
                   isolateEditLabel.css({ 'color': 'gray' });
                   blockEditLabel.css({ 'color': 'black' });
                   transparencyEditMode = 'block';
                   transEditModeLabel1.text("Block");
                   currentInkController.setTransMode("block");
               }
           });
   
           // trans opacity label
           var opacityEditTransparencyLabel = $(document.createElement('div'));
           opacityEditTransparencyLabel.addClass('thicknessLabel');
           var opacityEditTransparencyLabel1 = $(document.createElement('div'));
           opacityEditTransparencyLabel.text("Opacity: ");
           opacityEditTransparencyLabel1.text("80%");
           opacityEditTransparencyLabel.append(opacityEditTransparencyLabel1);
           inkEditTransparency.append(opacityEditTransparencyLabel);
           opacityEditTransparencyLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
           opacityEditTransparencyLabel.css({ 'font-size': '130%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'normal', 'margin-top': '3%', 'margin-right': '12%', 'margin-bottom': '1%', 'float': 'left', 'clear': 'both', 'display': 'inline', 'border-bottom-width': ' 2px', 'border-bottom-style': 'solid', 'border-bottom-color': 'white', 'width': '80%', });
   
           // trans opacity slider
           var opacityEditTransparencySlider = $(document.createElement('div'));
           opacityEditTransparencySlider.attr("id", "opacityEditTransparencySlider");
           opacityEditTransparencySlider.css({
               'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
               'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'/*, 'float': 'left'*/
    /*      });
          var opacityEditTransparencySliderPoint = $(document.createElement('div'));
          opacityEditTransparencySliderPoint.attr("id", "opacityEditTransparencySliderPoint");
          opacityEditTransparencySliderPoint.css({
              'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': "relative",
              'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", "margin-top": "-0.57%"
          });
          opacityEditTransparencySlider.append(opacityEditTransparencySliderPoint);
          inkEditTransparency.append(opacityEditTransparencySlider);
  
          // trans opacity label click handler
          opacityEditTransparencyLabel.on('click', function () {
              $(".thicknessLabel").css({ 'font-weight': 'normal' });
              opacityEditTransparencyLabel.css({ 'font-weight': 'bold' });
              updateToggle(transEditArray, opacityEditTransparencySlider);
          });
  
          // trans opacity slider drag handler
          opacityEditTransparencySliderPoint.draggable({
              axis: "x", containment: "parent",
              scroll: false,
              drag: function (event) {
                  opacityEditTransparencySliderPoint.attr('value', (parseFloat(opacityEditTransparencySliderPoint.css("left").replace('px', '')) / (parseFloat(opacityEditTransparencySlider.offset().left) + parseFloat(opacityEditTransparencySlider.width())) * 1.28));
                  if (opacityEditTransparencySliderPoint[0].value > 0.99) {
                      opacityEditTransparencySliderPoint.attr('value', 1.0);
                  }
                  else if (opacityEditTransparencySliderPoint[0].value < 0) {
                      opacityEditTransparencySliderPoint.attr('value', 0.0);
                  }
                  currentInkController.setMarqueeFillOpacity(parseFloat(opacityEditTransparencySliderPoint.attr("value")));
                  opacityEditTransparencyLabel1.text(Math.round(100 * opacityEditTransparencySliderPoint.attr("value")) + "%");
              },
              appendTo: 'body'
          });
          transEditArray.push(opacityEditTransparencySlider);
  
          // edit trans save button
          var saveTransButton = $(document.createElement('button'));
          saveTransButton.css({ 'font-size': '100%', 'color': 'black', 'margin-top': '3%', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', 'width': '80%' });
          saveTransButton.get(0).innerHTML = "Save";
          inkEditTransparency.append(saveTransButton);
          functionsPanel.append(editTransparencyDocfrag); */


    ///////////////////////////
    /// INK TRANSPARENCY STUFF
    ////////////////////////////////

    /**Creates div holding highlighting ink edit controls
     * @method createInitialTransparencyControls
     */
    function createInitialTransparencyControls() {
        inkTransparencyControls = $(document.createElement('div'));
        inkTransparencyControls.attr("id", "inkTransControls");
        inkTransparencyControls.css({ 'height': '425%', 'width': '100%', top: '130%', position: 'absolute', 'z-index': 0, 'overflow-y': 'auto', 'margin-top': '8%' });
        inkTransparencyDocfrag.appendChild(inkTransparencyControls[0]);
        inkTransparencyControls.css({ "display": "none" });
    }

    var transMode;

    /**Appends editing inputs to the form
     * @method createInkTransparencyControls
     * @return {Object} public properties of the form
     */
    function createInkTransparencyControls() {
        transMode = createTransparencyBlocks();
        var opacityInput = createTransparencyOpacityInput();
        var linkTransDiv = getAttachDiv(inkTransparencyControls, false, true);

        /**Appends editing controls to DOM at the left panel
         * @method showForm
         */
        function showForm() {
            functionsPanel.append(inkTransparencyDocfrag);
        }

        /**Creates options based on new ink track or editing existing ink track mode
         * @method createModeButtons
         */
        function createModeButtons() {
            if (isEditingTransparency) {
                inkTransparencyControls.append(saveTransButton);
                linkTransDiv.detach();
            } else {
                saveTransButton.detach();
                inkTransparencyControls.append(linkTransDiv);
            }
        }

        /**Handles updating inputs on change
         * @method updateInputs
         * @param {Number} opacity
         */
        function updateInputs(opacity) {
            if (opacity) {
                opacityInput.updateOpacity(opacity);
            } else {
                opacityInput.updateOpacity();
            }
        }

        return {
            showForm: showForm,
            createModeButtons: createModeButtons,
            updateInputs: updateInputs
        };
    }

    /**Creates highlighting shapes for the ink canvas and sets the mode of highlighting
     * @method createTransparencyBlocks
     * @return {Object}         public properties
     */
    function createTransparencyBlocks() {
        var addEllipseButton = $(document.createElement('button'));
        var addRectButton = $(document.createElement('button'));
        var transModeDiv = $(document.createElement('div'));
        var transModeLabel = $(document.createElement('div'));
        var transModeLabel1 = $(document.createElement('div'));
        var transparencyMode = 'isolate';
        var isolateLabel = $(document.createElement('label'));
        var blockLabel = $(document.createElement('label'));


        addEllipseButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '3%', 'clear': 'left' });
        addEllipseButton.get(0).innerHTML = "Add Ellipse";
        addEllipseButton.on('click', function () {
            currentInkController.addEllipse();
        });
        inkTransparencyControls.append(addEllipseButton);

        addRectButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '3%' });
        addRectButton.get(0).innerHTML = "Add Rectangle";
        addRectButton.on('click', function () {
            currentInkController.addRectangle();
        });
        inkTransparencyControls.append(addRectButton);

        transModeDiv.css({ "height": '10%', 'width': '80%', 'clear': 'both', 'margin-left': '8%', 'margin-top': '3%', 'display': 'none' });

        transModeLabel.addClass('thicknessLabel');
        transModeLabel.text("Mode: ");
        transModeLabel1.text("Isolate");
        transModeLabel.append(transModeLabel1);
        transModeLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        transModeLabel.css(labelCSS());
        inkTransparencyControls.append(transModeLabel);
        inkTransparencyControls.append(transModeDiv);
        transArray.push(transModeDiv);

        transModeLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            transModeLabel.css({ 'font-weight': 'bold' });
            updateToggle(transArray, transModeDiv);
        });

        // isolate label
        isolateLabel.css({ 'font-size': '70%', 'color': 'black', 'margin-left': '8%', 'font-weight': 'bold', 'float': 'left' });
        isolateLabel.text("Isolate");
        transModeDiv.append(isolateLabel);

        // isolate label click handler
        isolateLabel.on('click', function () {
            if (transparencyMode === 'block') {
                isolateLabel.css({ 'color': 'black' });
                blockLabel.css({ 'color': 'gray' });
                transparencyMode = 'isolate';
                transModeLabel1.text("Isolate");
                currentInkController.setTransMode("isolate");
            }
        });

        // block label
        blockLabel.css({ 'font-size': '70%', 'color': 'gray', 'margin-right': '9%', 'font-weight': 'bold', 'float': 'right' });
        blockLabel.text("Block");
        transModeDiv.append(blockLabel);

        // block label click handler
        blockLabel.on('click', function () {
            if (transparencyMode === 'isolate') {
                isolateLabel.css({ 'color': 'gray' });
                blockLabel.css({ 'color': 'black' });
                transparencyMode = 'block';
                transModeLabel1.text("Block");
                currentInkController.setTransMode("block");
            }
        });

        /**Updates highlighting mode on change
         * @method updateMode
         * @param {String} mode
         */
        function updateMode(mode) {
            if (mode === 'isolate') {
                isolateLabel.css({ 'color': 'black' });
                blockLabel.css({ 'color': 'gray' });
                transparencyMode = 'isolate';
                transModeLabel1.text("Isolate");
                currentInkController.setTransMode("isolate");
            } else if (mode === 'block') {
                isolateLabel.css({ 'color': 'gray' });
                blockLabel.css({ 'color': 'black' });
                transparencyMode = 'block';
                transModeLabel1.text("Block");
                currentInkController.setTransMode("block");
            }
        }

        return {
            updateMode: updateMode
        }
    }

    /**Creates input to edit ink transparency
     * @method createTransparencyOpcaityInput
     * @return {Object}   public properties of the input
     */
    function createTransparencyOpacityInput() {
        var opacityTransparencyLabel = $(document.createElement('div'));
        var opacityTransparencyLabel1 = $(document.createElement('div'));
        var opacityTransparencySlider = $(document.createElement('div'));
        var opacityTransparencySliderPoint = $(document.createElement('div'));

        opacityTransparencyLabel.addClass('thicknessLabel');
        opacityTransparencyLabel.text("Opacity: ");
        opacityTransparencyLabel.append(opacityTransparencyLabel1);
        inkTransparencyControls.append(opacityTransparencyLabel);
        opacityTransparencyLabel1.css({ 'color': 'green', 'display': 'inline', 'padding-left': '2%' });
        opacityTransparencyLabel.css(labelCSS());
        opacityTransparencySlider.css({
            'clear': 'both', 'background-color': 'rgb(136, 134, 134)', "border-radius": "25px", "-ms-touch-action": "none", 'border': '1px solid gray',
            'width': '70%', 'height': '21px', 'margin-top': '3%', 'margin-left': '8%', 'display': 'none', 'position': 'relative'
        });

        opacityTransparencySliderPoint.attr("id", "opacityTransparencySliderPoint");
        opacityTransparencySliderPoint.css({
            'background-color': 'white', 'height': '115%', 'width': '9.25%', 'position': 'relative',
            'border': '1px', 'border-style': 'solid', 'border-color': 'gray', "border-radius": "50%", "top": "-5%", "margin-top": "-0.57%"
        });
        opacityTransparencySlider.append(opacityTransparencySliderPoint);
        inkTransparencyControls.append(opacityTransparencySlider);

        // trans opacity label click handler
        opacityTransparencyLabel.on('click', function () {
            $(".thicknessLabel").css({ 'font-weight': 'normal' });
            opacityTransparencyLabel.css({ 'font-weight': 'bold' });
            updateToggle(transArray, opacityTransparencySlider);
        });

        // trans opacity slider drag handler
        opacityTransparencySliderPoint.draggable({
            axis: "x", containment: "parent",
            scroll: false,
            drag: function (event) {
                updateOpacity(opacityTransparencySliderPoint.attr('value'));
            },
            appendTo: 'body'
        });
        transArray.push(opacityTransparencySlider);

        /**Handles updating the opacity on change
         * @method updateOpacity
         * @param {Number} opacity
         */
        function updateOpacity(opacity) {
            if (opacity > -1) {
                var currOpacity = currentInkController.getMarqueeFillOpacity();
                opacityTransparencySliderPoint.attr('value', (parseFloat(opacityTransparencySliderPoint.css("left").replace('px', '')) / (parseFloat(opacityTransparencySlider.offset().left) + parseFloat(opacityTransparencySlider.width())) * 1.28));
                if (opacityTransparencySliderPoint[0].value > 0.99) {
                    opacityTransparencySliderPoint.attr('value', 1.0);
                    opacityTransparencyLabel1.text("100%");
                } else if (opacityTransparencySliderPoint[0].value < 0) {
                    opacityTransparencySliderPoint.attr('value', 0.0);
                    opacityTransparencyLabel1.text("0%");
                }
                currentInkController.setMarqueeFillOpacity(opacityTransparencySliderPoint.attr('value'));
                // var currOpacity = currentInkController.getMarqueeFillOpacity();
                //opacityTransparencySliderPoint.attr('value', opacity);
                opacityTransparencyLabel1.text(Math.round(100 * currOpacity) + "%");
                opacityTransparencySliderPoint.css("left", (currOpacity * opacityTransparencySlider.width() / 1.28) + 'px');
            } else {
                opacityTransparencySliderPoint.attr('value', 0.8);
                currentInkController.setMarqueeFillOpacity(parseFloat(0.8));
                opacityTransparencyLabel1.text("80%");
                opacityTransparencySliderPoint.css({ "left": '188px' });
            }
        }

        return {
            updateOpacity: updateOpacity
        };
    }

    /**creates cancel button for highlighting ink 
     * @method createTransparencyCancelButton
     * @return {HTML Element} cancelTransButton
     */
    function createTransparencyCancelButton() {
        // trans cancel button
        var cancelTransButton = $(document.createElement('button'));
        cancelTransButton.css({ 'font-size': '70%', 'color': 'black', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', 'width': '80%', 'height': '20%' });
        cancelTransButton.get(0).innerHTML = "Cancel";
        cancelTransButton.on('click', function () {
            removeInkCanv();
            inkTransparencyControls.hide();
            timeline.setModifyingInk(false);
            timeline.setEditInkOn(false);

            inkAuthoring.getInkUndoManager().clear();
            undoManager.greyOutBtn();

            // revert undo/redo buttons to global undo/redo functionality
            playbackControls.undoButton.off("click");
            playbackControls.redoButton.off("click");
            playbackControls.undoButton.on('click', function () {
                undoManager.undo();
            });
            playbackControls.redoButton.on('click', function () {
                undoManager.redo();
            });
            //console.log("reseting undo-redo buttons to global");
            playbackControls.undoRedoInkOnly.css({ 'display': 'none' });
        });
        inkTransparencyControls.append(cancelTransButton);
        return cancelTransButton;
    }

    /**creates save button for highlighting ink 
     * @method createSaveTransparencyButton
     * @return {HTML Element} saveTransButton
     */
    function createSaveTransparencyButton() {
        // edit trans save button
        var saveTransButton = $(document.createElement('button'));
        saveTransButton.css({ 'font-size': '70%', 'color': 'black', 'margin-top': '3%', 'margin-left': '8%', 'margin-bottom': '10px', 'font-weight': 'bold', 'float': 'left', 'width': '80%', 'height': '20%' });
        saveTransButton.get(0).innerHTML = "Save";
        inkTransparencyControls.append(saveTransButton);
        return saveTransButton;
    }

    ////////////////////////
    //// INK TRANSPARENCY STUFF - TILL HERE
    //////////////////////////



    /**
     * Below are some helper function for the creation of ink controls above
     */

    /**Allows you to click to close ink, 
     * controls (e.g. opacity sliders by clicking on labels).
     * Clicking on a label will collapse all other controls and show the selected control if it was hidden, hide it if it was shown.
     * @method updateToggle
     * @param array   the array of controls containing the control we are clicking on
     * @param show    the control we are clicking on -- we toggle it to be shown or hidden
     */
    function updateToggle(array, show) {
        if (array === textArray || array === drawArray || array === transArray) {
            $.each(array, function () {
                if (this === show && $(show).css("display") === "block") {
                    $(".thicknessLabel").css({ 'font-weight': 'normal' });
                    this.css("display", "none");
                } else {
                    if (this === show) {
                        this.css("display", "block");
                    } else {
                        this.css("display", "none");
                    }
                }
            });
        } else {
            $.each(array, function () {
                if (this === show) {
                    this.css("display", "block");
                } else {
                    this.css("display", "none");
                }
            });
        }
    }

    /**Collapses all controls in a given panel
     * @method hideAll
     * @param array   this is the array of controls to collapse (e.g. drawArray)
     */
    function hideAll(array) {
        $.each(array, function () {
            $('.thicknessLabel').css({ 'font-weight': 'normal' });
            this.css("display", "none");
        });
    }

    /**
     * Initialize the text controls with default values
     * NOT USED
     */
    function initText() {
        fontLabel.text("Font: ");
        fontLabel1.text("Times New Roman");
        fontLabel.append(fontLabel1);
        textSliderPoint.css("left", "10%");
        timesOption.attr("selected", "selected");
        textSizeLabel.text("Text Size: ");
        textSizeLabel1.text("12px");
        textSizeLabel.append(textSizeLabel1);
        hideAll(textArray);
    }

    /**
     * Initialize the transparency controls with default values
     * NOT USED
     */
    function initTrans() {
        opacityTransparencyLabel.text("Opacity: ");
        opacityTransparencyLabel1.text("80%");
        opacityTransparencyLabel.append(opacityTransparencyLabel1);
        opacityTransparencySliderPoint.css("left", (0.8 * (opacityTransparencySlider.offset().left + opacityTransparencySlider.width()) / 1.28) + 'px');
        isolateLabel.css({ 'color': 'black' });
        blockLabel.css({ 'color': 'gray' });
        transparencyMode = 'isolate';
        transModeLabel1.text("Isolate");
        hideAll(transArray);
    }

    /**
     * Initialize the draw controls with default values
     * NOT USED
     */
    function initDraw() {
        brushLabel.text("Width: ");
        brushLabel1.text("7px");
        brushLabel.append(brushLabel1);
        brushSliderPoint.css("left", "0px");
        drawLabel.css({ 'color': 'black' });
        eraseLabel.css({ 'color': 'gray' });
        drawMode = 'draw';
        drawModeLabel1.text("Draw");
        //eraserLabel.text("Eraser: ");
        //eraserLabel1.text("7px");
        //eraserLabel.append(eraserLabel1);
        //eraserSliderPoint.css("left", "0px");
        opacityLabel.text("Opacity: ");
        opacityLabel1.text("100%");
        opacityLabel.append(opacityLabel1);
        opacitySliderPoint.css("left", (0.87 * opacitySlider.width()) + "px");
        hideAll(drawArray);
    }

    /**Create attach and create as unlinked buttons for ink creation
     * @method getAttachDiv
     * @param controls
     * @param text
     * @pram trans
     */
    function getAttachDiv(controls, isText, isTrans) {
        // slightly different controls for text and transparency, since we can't call currentInkController.link directly
        var text_mode = false;
        var trans_mode = false;
        var newDiv = $(document.createElement('div'));                          // div to contain buttons
        var linkButton = $(document.createElement('button'));                   // attach button
        var freeInkButton = $(document.createElement('button'));                // create as unattached ink button

        if (isText && isText !== 0) {
            text_mode = true;
        }
        if (isTrans) {
            trans_mode = true;
        }


        newDiv.css("display", "block");
        newDiv.css('margin-top', '2%');

        linkButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '5%', 'clear': 'left' });
        linkButton.get(0).innerHTML = "Attach to Selected";

        // attach button click handler -- reset to default values, call link, link_text, or link_trans or their unattached equivalents
        linkButton.on('click', function () {
            //  brushSliderPoint.attr('value', 7.0);
            //  currentInkController.updatePenWidth("brushSlider");
            //  colorLabel1.text("#000000");
            //  myPicker = new jscolor.color(item, {});
            //  myPicker.fromString("000000");
            //  myPicker.onImmediateChange = function () {
            //     currentInkController.updatePenColor("brushColorToggle");
            //    currentInkController.setMode(TAG.TourAuthoring.InkMode.draw);
            //  $('.changeColor1')[0].innerHTML = "#" + $("#brushColorToggle").attr("value");
            //};
            var check = true; // if check becomes false, then a warning message appeared, do not proceed after trying to attach
            text_mode = false; // hacky temporary workaround
            if (text_mode) {
                check = currentInkController.linkText();
            } else if (trans_mode) {
                check = currentInkController.linkTrans();
            } else {// draw
                check = currentInkController.link();
            }

            if (!check)
                return;

            controls.hide();
            // reset undo/redo buttons to global undo/redo functionality
            playbackControls.undoButton.off("click");
            playbackControls.redoButton.off("click");

            playbackControls.undoButton.on('click', function () {
                undoManager.undo();
            });
            playbackControls.redoButton.on('click', function () {
                undoManager.redo();
            });
            playbackControls.undoRedoInkOnly.css('display', 'none');


            if (inkAuthoring) {
                inkAuthoring.getInkUndoManager().clear();
                undoManager.greyOutBtn();
            }
            timeline.setModifyingInk(false);
            timeline.setEditInkOn(false);
        });
        newDiv.append(linkButton);

        freeInkButton.css({ 'color': 'black', 'width': '35%', 'float': 'left', 'margin-left': '8%', 'margin-top': '5%' });
        freeInkButton.get(0).innerHTML = "Create as Unattached";

        // unattached button click handler
        freeInkButton.on('click', function () {
            // brushSliderPoint.attr('value', 7.0);
            //  currentInkController.updatePenWidth("brushSlider");
            var check = true;
            if (text_mode) {
                check = currentInkController.linkTextUnattached();
            } else if (trans_mode) {
                check = currentInkController.linkTransUnattached();
            } else {
                check = currentInkController.linkUnattached();
            }
            if (!check) {
                return;
            }
            controls.hide();
            // restore global undo/redo functionality
            playbackControls.undoButton.off("click");
            playbackControls.redoButton.off("click");
            playbackControls.undoButton.on('click', function () {
                undoManager.undo();
            });
            playbackControls.redoButton.on('click', function () {
                undoManager.redo();
            });
            playbackControls.undoRedoInkOnly.css('display', 'none');

            if (inkAuthoring) {
                inkAuthoring.getInkUndoManager().clear();
                undoManager.greyOutBtn();
            }
            timeline.setModifyingInk(false);
            timeline.setEditInkOn(false);
        });
        newDiv.append(freeInkButton);
        return newDiv;
    }

    /**Sets display:none for each of the ink control panels
     * @method hideInkControls
     */
    function hideInkControls() {
        inkTransparencyControls.css({ 'display': 'none' });
        inkTextControls.css({ 'display': 'none' });
        inkDrawControls.css({ 'display': 'none' });
    }

    /**Removes the current ink canvas if there is one\
     * @method removeInkCanv
     */
    function removeInkCanv() {
        if ($("#inkCanv").length) {
            $("#inkCanv").remove();
        }
        $("#rinplayer").css({});
    }

    /**Creates an ink canvas
     * @method createInkCanv
     * @return {HTML Element} inkdiv   a div on which we'll create a Raphael paper
     */
    function createInkCanv() {
        var inkdiv = document.createElement("div");
        var num_tracks = timeline.getTrackslength();
        var view_elt;
        // remove any existing ink canvases
        removeInkCanv();

        // create a div on which we'll create a Raphael paper
        inkdiv.setAttribute("id", "inkCanv");
        inkdiv.setAttribute("class", "inkCanv");
        //set rinplayer's position to absolute so our canvas isn't pushed down
        $("#rinplayer").css({
            "position": "absolute",
        });

        // set css of inkdiv, making sure that its z-index is greater than those of all images and artworks (artwork in track i has z-index 20000+i)
        inkdiv.setAttribute("style", "overflow:hidden; position:absolute; width:100%; height:100%; background:transparent; pointer-events: all; z-index:" + (20100 + num_tracks) + ";");
        view_elt = $("#rinContainer"); // change to #rinplayer if we can figure out how to keep it around during tour reloads (if in #rinplayer, we can capture inks in thumbnails)
        $("#rinplayer").before(inkdiv);
        return inkdiv;
    }

    /**Appends the functions panel to the inputted container element
     * @method addToDOM
     * @param container   element to which we'll append the functions panel
     */
    function addToDOM(container) {
        container.append(functionsPanelDocfrag);
    }

    /**Adds the catalog overlays (for artwork and associated media import) to the inputted container element
     * Used in TourAuthoringNew
     * @method addCatalogToDOM
     * @param container   element to which we'll append the functions panel
     */
    function addCatalogToDOM(container) {
        container.appendChild(catalogPickerOverlay);
        container.appendChild(associatedMediaPickerOverlay);
    }

    /**Returns the boolean specifying the state of uploading ink tracks
     * @method getIsUploading
     * @return {Booolean} isUploading
     */
    function getIsUploading() {
        return isUploading;
    }

    return that;
};
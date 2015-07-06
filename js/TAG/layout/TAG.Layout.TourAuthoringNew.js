﻿TAG.Util.makeNamespace('TAG.Layout.TourAuthoringNew');

/**
 * Final layout for Tour Authoring
 * All parts of layout are container in separate files/classes
 * Layout file also contains testing instructions / notes / functions
 * @param tourobj           Doq containing tour info
 * @param onLoadCallback    Callback to run once tour has loaded (loadRin runs async)
 */
TAG.Layout.TourAuthoringNew = function (tourobj, onLoadCallback) {
    "use strict";

    var root = $(document.createElement('div')),
        resizableArea = $(document.createElement('div')),
        originalHeightSize = window.innerHeight * 0.3,
        ITE,
        timeManager,
        undoManager,
        viewer,
        timeline,
        componentControls,
        playbackControls,
        $mainScrollHider,
        $trackBody,
        $trackVeil,
        $inkTextControls,
        $inkDrawControls,
        $inkTransControls,
        $blocker,
        $inkEditText,
        $inkEditDraw,
        $inkEditTransparency,
        topbar,
        dataHolder = new DataHolder();

    // Background css
    root.css({
        "background-color": "rgb(219,218,199)",
        "height": "100%",
        "width": "100%" 
    });
    root.attr("class", "rootPage");
    TAG.Util.UI.getStack()[0] = null;

    /**
    *Second row on screen, contains ComponentControls and Viewer
    **/
    (function setupResizableArea() {
        resizableArea.css({
            "background-color": "rgb(219,218,199)",
            "height": originalHeightSize + "px",
            "width": "100%",
            "box-shadow": "0px 30px 30px -25px #888"
        });
        resizableArea.attr("id", "resizableArea");

        dataHolder.setLastPreviewerHeight(originalHeightSize);

        $blocker = $(document.createElement('div'));
        $blocker.css({
            'background-color': "rgb(219, 218, 199)",
            "height": window.innerHeight - originalHeightSize - 0.08 * window.innerHeight + "px",
            "width": "100%",
            "bottom": "0px",
            "left": "0px",
            "z-index": "99999",
            "position": "absolute"
        })
        $blocker.attr("id", "blocker");

        if (!$mainScrollHider) {
            $mainScrollHider = $('.mainScrollHider');
        }
        $mainScrollHider.css({
            'z-index': '1000000'
        });

        //mouse down and drag this button, aka three dots...to resize the viewer and component control
        var resizeButtonDocfrag = document.createDocumentFragment();
        var resizeButtonArea = $(document.createElement('div'));
        resizeButtonDocfrag.appendChild(resizeButtonArea[0]);
        resizeButtonArea.addClass('resizeButtonArea');
        resizeButtonArea.css({
            'height': '3%', 'width': '10%', 'position': 'absolute', 'top': (originalHeightSize + window.innerHeight * 0.09) + 'px',
            'left': '45%', 'margin-left': '-1.5%', 'z-index': 1000000, 'float': 'left'
        });

        var resizeButton = $(document.createElement('img'));
        resizeButton.addClass("resizeButton");
        resizeButton.attr('src', tagPath + 'images/icons/dragTourWindowTwoBars.svg');
        resizeButton.attr('id', 'resizeButton');
        resizeButton.css({
            'cursor': 'pointer', 'height': 'auto', 'width': '30%', 'position': 'absolute', 'top': '20%', 'left': '40%'
        });

        var prevLocationY;
        var currentMouseLocation;
        var dragOverlay;

        resizeButtonArea.draggable({
            axis: "y", containment: [0, window.innerHeight / 5 + window.innerHeight * 0.1, 0, window.innerHeight / 1.5 + window.innerHeight * 0.1],
            scroll: false,
            start: function (evt, ui) {
                if (timeline.getEditInkOn() === true) {
                    return false;
                }

                // bring up the buffering overlay, since artwork doesn't resize as you drag anyway
                $("#bufferingDiv").css({
                    "background": "rgba(0,0,0,.9)"
                });
                $($("#bufferingDiv").parent()).css({
                    "opacity": 0.9,
                    "display": "block"
                });
                prevLocationY = ui.position.top;
                timeManager.stop();
                dataHolder.setLastPreviewerHeight(resizableArea.height());
            }, //commented out because broke with svg
            stop: function (evt, ui) {
                // the css of bufferingDiv and its parentbeing reset in timeline.onUpdate
                // if we ever eliminate timeline.onUpdate, reset css here
                timeline.onUpdate(true);
            },
            drag: function (event, ui) {
                if (timeline.getEditInkOn() === true) {
                    return false;
                }
                ui.position.top = Math.constrain(ui.position.top, window.innerHeight / 5 + window.innerHeight * 0.1, window.innerHeight / 1.5 + window.innerHeight * 0.1);
                //if (event.originalEvent.pageY < window.innerHeight / 5 + window.innerHeight * 0.1) {//minimum size
                //    currentMouseLocation = window.innerHeight / 5 + window.innerHeight * 0.1;
                //}
                //else if (event.originalEvent.pageY > window.innerHeight / 1.5 + window.innerHeight * 0.1) {//maximum size
                //    currentMouseLocation = window.innerHeight / 1.5 + window.innerHeight * 0.1;
                //}
                //else {
                //    currentMouseLocation = event.originalEvent.pageY;
                //}

                if (prevLocationY === null) {
                    prevLocationY = ui.position.top;
                    return;
                }
                var distance = (ui.position.top - prevLocationY);
                resizableArea.css({
                    "height": originalHeightSize + distance + 'px'
                });
                if (!$mainScrollHider) {
                    $mainScrollHider = $('.mainScrollHider');
                }

                $mainScrollHider.css({
                    'height': $mainScrollHider.height() - distance + 'px',
                    'z-index': '1000000'
                });

                if (!$blocker) {
                    $blocker = $('#blocker');
                }
                $blocker.css({
                    'height': $blocker.height() - distance + 'px',
                });

                if (!$trackBody) {
                    $trackBody = $('#trackBody');
                }
                $trackBody.css({
                    'height': $trackBody.height() - distance + 'px',
                });
                
               

                if (!$trackVeil) {
                    $trackVeil = $('#trackScrollVeil');
                }
                $trackVeil.css({
                    'height': $trackVeil.height() - distance + 'px',
                });

               
                $('#verticalSliderPane').css({
                    'height': $trackBody.height() + 'px',
                });

                $('#trackScrollVeil').css({
                    'height': $trackBody.height() + 'px',
                });
                
                //update the height
                originalHeightSize = originalHeightSize + distance;

                var raTop = resizableArea.offset().top;
                var raHeight = resizableArea.height();
                //resize the component control stuff
                if (!$inkTextControls) { $inkTextControls = $('#inkTextControls'); }
                if (!$inkDrawControls) { $inkDrawControls = $('#inkDrawControls'); }
                if (!$inkTransControls) { $inkTransControls = $('#inkTransControls'); }
             //   if (!$inkEditText) { $inkEditText = $('#inkEditText'); }
             //   if (!$inkEditDraw) { $inkEditDraw = $('#inkEditDraw'); }
             //   if (!$inkEditTransparency) { $inkEditTransparency = $('#inkEditTransparency'); }
                if ($('#inkTextControls').length > 0) {
                    $("#inkTextControls").css("height", raTop + raHeight - $("#inkTextControls").offset().top - 10);
                }
                if ($('#inkDrawControls').length > 0) {
                    $("#inkDrawControls").css("height", raTop + raHeight - $("#inkDrawControls").offset().top - 10);
                }
                if ($('#inkTransControls').length > 0) {
                    $("#inkTransControls").css("height", raTop + raHeight - $("#inkTransControls").offset().top - 10);
                }
           //     $("#inkEditText").css("height", raTop + raHeight - $("#inkEditText").offset().top - 10);
           //     $("#inkEditDraw").css("height", raTop + raHeight - $("#inkEditDraw").offset().top - 10);
           //     $("#inkEditTransparency").css("height", raTop + raHeight - $("#inkEditTransparency").offset().top - 10);
                viewer.resize();//resize the viewer.

                prevLocationY = ui.position.top;
            },
            appendTo: 'body'
        });

        //Telemetry
        TAG.Telemetry.register(resizeButtonArea, "mousedown", "ResizePreviewArea");

        resizeButtonArea.append(resizeButton);

        root.append(resizeButtonDocfrag);
        root.append($blocker);
       
    })();
 
    /**
    *Creates components and sets up UI
    */
    (function initBackend() {
        // Start by initializing all the parts
        timeManager = TAG.TourAuthoring.TimeManager();
        undoManager = TAG.TourAuthoring.UndoManager();
        viewer = TAG.TourAuthoring.Viewer({
            timeManager: timeManager,
            tourobj: tourobj
        });
        var tour = viewer.getTour();
        ITE = viewer.getPlayer();
        timeline = TAG.TourAuthoring.Timeline({
            timeManager: timeManager,
            undoManager: undoManager,
            viewer: viewer,
            root: root,
            ITE: ITE,
            dataHolder: dataHolder
        });
        viewer.setTimeline(timeline);
        playbackControls = TAG.TourAuthoring.PlaybackControl({
            timeManager: timeManager,
            undoManager: undoManager,
            viewer: viewer,
            timeline: timeline,
            root : root
        });
        componentControls = TAG.TourAuthoring.ComponentControls({
            root: root,
            undoManager: undoManager,
            playbackControls: playbackControls,
            timeline: timeline,
            dataHolder: dataHolder,
            viewer: viewer,
            timeManager: timeManager,
        });
        topbar = TAG.TourAuthoring.TopMenu({
            viewer: viewer,
            timeline: timeline,
            tourobj: tourobj,
            componentControls: componentControls,
            timeManager: timeManager,
            undoManager: undoManager,
            playbackControls: playbackControls,
            root: root
        });
       
        // Assemble the UI using docfrag
        var uiDocfrag = document.createDocumentFragment();
        uiDocfrag.appendChild(resizableArea[0]);
        topbar.addToDOM(root);
        componentControls.addToDOM(resizableArea);
        viewer.addToDOM(resizableArea);
        componentControls.addCatalogToDOM(uiDocfrag);
        timeline.addToDOM(uiDocfrag);
        playbackControls.addToDOM(uiDocfrag);
        root.append(uiDocfrag);

        // Load tour from the rin object
        var tourdata = JSON.parse(unescape(tourobj.Metadata.Content));   
        if (jQuery.isEmptyObject(tourdata)) {
            tourdata = timeline.toRIN();
        }

        viewer.initializeTour(tourdata);
        //timeline.loadTour(tour, onLoadCallback);
        timeline.loadRIN(tourdata, onLoadCallback);
        timeline.updateVerticalScroller();
        //timeline.setLoaded();
    })();

    this.getRoot = function() {
        return root;
    };

    this.getITE = function () {
        return ITE;
    };
    
    this.getTimeline = function () {
        return timeline;
    }

    this.getViewer = function () {
        return viewer;
    };
    this.uploadStillHappening = function (uploadDone) {
        return componentControls.otherUpload(uploadDone);
    }
};
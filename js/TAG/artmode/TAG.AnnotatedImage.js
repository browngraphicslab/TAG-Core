TAG.Util.makeNamespace("TAG.AnnotatedImage");

/**
 * Representation of deepzoom image with associated media. Contains
 * touch handlers and a method for creating associated media objects.
 * @class TAG.AnnotatedImage
 * @constructor
 * @param {Object} options         some options for the artwork and assoc media
 * @return {Object}                some public methods and variables
 */

TAG.AnnotatedImage = function (options) { // rootElt, doq, split, callback, shouldNotLoadHotspots) {
    "use strict";


    var // input options
        root = options.root,           // root of the artwork viewing page
        doq = options.doq,            // doq for the artwork
        callback = options.callback,       // called after associated media are retrieved from server
        noMedia = options.noMedia,        // should we not have assoc media? (set to true in artwork editor)
        locationHist = options.locationHist,
        inArtworkEditor = options.inArtworkEditor,
        isNobelWill = options.isNobelWill,
        isImpactMap = options.isImpactMap,
        getNobelAssociatedMediaLocation = options.getNobelAssociatedMediaLocation,

        // constants
        FIX_PATH = TAG.Worktop.Database.fixPath,   // prepend server address to given path

        // misc initialized variables

        artworkName = doq.Name,        // artwork's title
        associatedMedia = { guids: [] },   // object of associated media objects for this artwork, keyed by media GUID;
                                           // also contains an array of GUIDs for cleaner iteration
        toManip = dzManip,         // media to manipulate, i.e. artwork or associated media
        rootHeight = $('#tagRoot').height(), //tag root height
        rootWidth = $('#tagRoot').width(),  //total tag root width for manipulation (use root.width() instead for things that matter for splitscreen styling)
        outerContainerPivot = {
            x: rootHeight / 2,
            y: rootWidth / 2
        },
        doManipulation = true,      //used in RLH to prevent manipulation of image in certain cases
        aspectRatio = 1, //TODO - how to find this
        artworkFrozen = false,
        descscroll = false,
        scrollingMedia = false,
        disableZoomRLH = options.disableZoom,

        // misc uninitialized variables
        viewerelt,
        OSDHolder,
        viewer,
        assetCanvas;
    var xFadeOffset;

    // get things rolling
    //init();
    initOSD();
    return {
        getAssociatedMedia: getAssociatedMedia,
        unload: unload,
        dzManip: dzManip,
        dzScroll: dzScroll,
        openArtwork: openArtwork,
        addAnimateHandler: addAnimateHandler,
        getToManip: getToManip,
        getMediaPivot: getMediaPivot,
        dzManipPreprocessing: dzManipPreprocessing,
        viewer: viewer,
        panToPoint: panToPoint,
        isInViewportBounds: isInViewportBounds,
        isInImageBounds: isInImageBounds,
        returnElementToBounds: returnElementToBounds,
        locationOf: locationOf,
        centerElement: centerElement,
        pointFromPixel: pointFromPixel,
        createStartingPoint: createStartingPoint,
        scroll: scroll,
        pauseManip: pauseManip,
        restartManip: restartManip,
        updateOverlay: updateOverlay,
        addOverlay: addOverlay,
        removeOverlay: removeOverlay,
        loadAssociatedMedia: loadAssociatedMedia,
        getOverlayCoordinates: getOverlayCoordinates,
        freezeArtwork: freezeArtwork,
        unfreezeArtwork: unfreezeArtwork,
        initZoom: initZoom
    };


    /**
     * Return applicable manipulation method
     * @method getToManip
     * @return {Object}     manipulation method object
     */
    function getToManip() {
        return toManip;
    }


    /**
     * Return the dimensions of the active associated media or artwork
     * @method getMediaPivot
     * @return {Object}     object with dimensions
     */
    function getMediaPivot() {
        return outerContainerPivot;
    }


    /**
     * Return list of associatedMedia
     * @method getAssociatedMedia
     * @return {Object}     associated media object
     */
    function getAssociatedMedia() {
        return associatedMedia;
    }

    /**
     * Open the deepzoom image
     * @method openArtwork
     * @param {doq} doq           artwork doq to open // TODO this shouldn't be necessary -- we know the artwork...
     * @return {Boolean}          whether opening was successful
     */
    function openArtwork(doq) {
        if (!viewer || !doq || !doq.Metadata || !doq.Metadata.DeepZoom) {
            //debugger;
            doNothing("ERROR IN openDZI");
            return false;
        }
        viewer.openDzi(FIX_PATH(doq.Metadata.DeepZoom));
        return true;
    }

    /**
     * Wrapper around Seadragon.updateOverlay; moves an HTML element "overlay."
     * Used mostly in conjunction with hotspot circles (this function is currently
     * only called from ArtworkEditor.js)
     * @method updateOverlay
     * @param {HTML element} element                   the overlay element to move
     * @param {Seadragon.OverlayPlacement} placement   the new placement of the overlay
     */
    function updateOverlay(element, placement) {
        var $elt = $(element),
            top = parseFloat($elt.css('top')),
            left = parseFloat($elt.css('left'));
        if (top && left) { // TODO is this check necessary?
            viewer.updateOverlay(element, viewer.viewport.pointFromPixel(new OpenSeadragon.Point(left, top)), placement);
        }
    }

    /**
     * Wrapper around Seadragon.addOverlay; adds an HTML overlay to the seadragon
     * canvas. Currently only used in ArtworkEditor.js.
     * @method addOverlay
     * @param {HTML element} element                   the overlay element to add
     * @param {Seadragon.Point} point                  the point at which to add the overlay
     * @param {Seadragon.OverlayPlacement} placement   the placement at the given point
     */
    function addOverlay(element, point, placement) {
        if (!viewer.isOpen()) {
            viewer.addHandler('open', function () {
                viewer.addOverlay(element, point, placement);
                viewer.updateOverlay(element, point, placement);
            });
        } else {
            viewer.addOverlay(element, point, placement);
            viewer.updateOverlay(element, point, placement);
        }
    }

    /**
     * Wrapper around Seadragon.removeOverlay. Removes an HTML overlay from the seadragon
     * canvas.
     * @method removeOverlay
     * @param {HTML element}       the ovlerlay element to remove
     */
    function removeOverlay(element) {
        if (!viewer.isOpen()) {
            viewer.addHandler('open', function () {
                viewer.removeOverlay(element);
            });
        } else {
            viewer.removeOverlay(element);
        }
    };

    /**
     * Unloads the seadragon viewer
     * @method unload
     */
    function unload() {
        viewer && viewer.destroy();
    }

    /**
     * When the artwork is active, sets the manipulation method and dimensions for the active container
     * @method dzManipPreprocessing
     */
    function dzManipPreprocessing() {
        outerContainerPivot = {
            x: root.width() / 2,//+ root.offset().left,
            y: root.height() / 2// + root.offset().top
        };
        toManip = dzManip;
        TAG.Util.IdleTimer.restartTimer();
    }

    /**
     * Manipulation/drag handler for makeManipulatable on the deepzoom image
     * @method dzManip
     * @param {Object} res             object containing hammer event info
     */

    function dzManip(res) {

        if (disableZoomRLH) { return; }

        var scale = res.scale,
            trans = res.translation,
            pivot = res.pivot;
        var pivotRel;
        var transRel;
        dzManipPreprocessing();

        if (!artworkFrozen && isNobelWill !== true) {
            pivotRel = viewer.viewport.pointFromPixel(new OpenSeadragon.Point(pivot.x, pivot.y));
            var piv = {
                x: pivotRel.x,
                y: pivotRel.y
            };
            transRel = viewer.viewport.deltaPointsFromPixels(new OpenSeadragon.Point(trans.x, trans.y));
            if (xFadeOffset) {

                // testing 
                //var zoom = viewer.viewport.getZoom(true);

                //var correctionRel = new Seadragon.Point(xFadeOffset.x * 1/zoom, xFadeOffset.y * 1/zoom) // ver 1
                //var correctionRel = new Seadragon.Point(xFadeOffset.x, xFadeOffset.y); // ver 2

                //var correctionAbs = viewer.viewport.pixelFromPoint(correctionRel);

                //var pivotCorrectedRel = new Seadragon.Point(pivotRel.x - correctionRel.x, pivotRel.y - correctionRel.y);

                //var pivotCorrectedAbs = viewer.viewport.pixelFromPoint(pivotCorrectedRel); // ver 1
                //var pivotCorrectedAbs = new Seadragon.Point(pivot.x + correctionAbs.x, pivot.y + correctionAbs.y); // ver 2
                //var pivotFinal = viewer.viewport.pointFromPixel(pivotCorrectedAbs);

                // begin diagnostic markers
                /*
                if (!correctedMarker) {
                    correctedMarker = $(document.createElement('div'));
                    correctedMarker.css({
                        width: "5px",
                        height: "5px",
                        background: "rgb(0, 0, 255)",
                        position: "absolute",
                        "z-index": "999999"
                    });
                    $('body').append(correctedMarker);
                }
                correctedMarker.css({
                    top: pivotCorrectedAbs.y + "px",
                    left: pivotCorrectedAbs.x + "px"
                });

                if (!pivotMarker) {
                    pivotMarker = $(document.createElement('div'));
                    pivotMarker.css({
                        width: "5px",
                        height: "5px",
                        background: "rgb(255, 0, 0)",
                        position: "absolute",
                        "z-index": "999999"
                    });
                    $('body').append(pivotMarker);
                }
                pivotMarker.css({
                    top: pivot.y + "px",
                    left: pivot.x + "px"
                });
                */
                // end diagnostic markers

                // hacky fix - can't pan while you zoom otherwise stuff blows up
                if (scale !== 1) {
                    viewer.viewport.zoomBy(scale, piv, false);
                } else {
                    viewer.viewport.panBy(transRel, false);
                }
            } else {
                // begin diagnostic markers
                /*
                if (!pivotMarker) {
                    pivotMarker = $(document.createElement('div'));
                    pivotMarker.css({
                        width: "5px",
                        height: "5px",
                        background: "rgb(255, 0, 0)",
                        position: "absolute",
                        "z-index": "999999"
                    });
                    $('body').append(pivotMarker);
                }
                pivotMarker.css({
                    top: pivot.y + "px",
                    left: pivot.x + "px"
                });
                */
                // end diagnostic markers
                viewer.viewport.zoomBy(scale, pivotRel, false);
                viewer.viewport.panBy(transRel, false);
            }
            viewer.viewport.applyConstraints();
        }
    }

    function freezeArtwork() {
        artworkFrozen = true;
    }

    function unfreezeArtwork() {
        artworkFrozen = false;
    }

    /**
     * Scroll/pinch-zoom handler for makeManipulatable on the deepzoom image
     * @method dzScroll
     * @param {Number} scale          scale factor
     * @param {Object} pivot          location of event (x,y)
     */
    function dzScroll(scale, pivot) {
        if (!disableZoomRLH) {
            dzManip({
                scale: scale,
                translation: {
                    x: 0,
                    y: 0
                },
                pivot: pivot
            });
        }
    }

    /**
    * Reset the deepzoom image (center, zoom out) if an element is not currently visible in the viewport.
    * Used in rich location history.
    * @method panToPoint
    */
    function panToPoint(element) {
        doNothing("Panning");
        viewer.viewport && function () {
            var ycoord = parseFloat($(element).css('top')) + parseFloat($(element).css('height'));
            var xcoord = parseFloat($(element).css('left')) + 0.5 * parseFloat($(element).css('width'));
            var point = viewer.viewport.pointFromPixel(new OpenSeadragon.Point(xcoord, ycoord));
            var bounds = viewer.viewport.getBounds();
            //if the point is not visible in the current bounds
            if (!((point.x < bounds.getBottomRight().x && point.x > bounds.getTopLeft().x)
                && (point.y < bounds.getBottomRight().y && point.y > bounds.getTopLeft().y))) {
                viewer.viewport.panTo(viewer.viewport.getCenter());
                viewer.viewport.zoomTo(.8 * viewer.viewport.getHomeZoom());
            }
        }();
    };

    /**
    * Sets up the annotated image to allow zoom on double click.  Used in RLH
    * @method initZoom
    */
    function initZoom() {
        if (!disableZoomRLH) {
            OSDHolder && function () {
                OSDHolder.on('dblclick', function () {
                    doNothing("Zooming!");
                    zoomToPoint();
                });
            }();
        }
    }

    /**
    * Zooms into the deepzoom image.  Used when double-clicking on a map in rlh.
    * @method zoomToPoint()
    */
    function zoomToPoint() { //TODO zoom to where the mouse is
        doNothing("Also zooming");
        viewer.viewport.zoomBy(2);
    }

    /**
    * Returns whether an element is in the viewport's bounds (including a buffer of 10 pixels)
    * Used in rich location history.
    * @method isInViewportBounds
    */
    function isInViewportBounds(element) {
        var bounds = viewer.viewport.getBounds(),
            val = false,
            height = parseFloat($(element).css('height')),
            width = parseFloat($(element).css('width')),
            top = parseFloat($(element).css('top')),
            left = parseFloat($(element).css('left'));

        var topY = pointFromPixel(new OpenSeadragon.Point(1, top - 10)).y,
            bottomY = pointFromPixel(new OpenSeadragon.Point(1, top + height + 10)).y,
            leftX = pointFromPixel(new OpenSeadragon.Point(left - 10, 1)).x,
            rightX = pointFromPixel(new OpenSeadragon.Point(left + width + 10, 1)).x;

        if (((rightX < bounds.getBottomRight().x && leftX > bounds.getTopLeft().x)
            && (bottomY < bounds.getBottomRight().y && topY > bounds.getTopLeft().y))) {
            val = true;
        }
        return val;
    }

    /**
    * Returns whether an element is within the bounds of the deepzoom image (with a margin of .05 in Seadragon coordinates)
    * Used in rich location history.
    * @method isInImageBounds
    */
    function isInImageBounds(element) {

        var val = false;
        var point = locationOf(element);
        if ((point.x < 1.05 && point.x > -0.05) && (point.y > -0.05 && point.y < (1 / aspectRatio) + .05)) {
            val = true;
        }
        //doNothing(point.x + ', ' + point.y);
        //doNothing((1 / aspectRatio) + .05);
        //doNothing('inBounds= ' + val);
        return val;
    }

    /**
    * Returns coordinates that an element should be returned to if it is dragged too far from the deepzoom image.
    * (with a margin of .05 in Seadragon coordinates)
    * Used in rich location history.
    * @method returnElementToBounds
    */
    function returnElementToBounds(element) {
        var point = locationOf(element);
        var bounds = viewer.viewport.getBounds();
        if (point.x <= 0 && point.y <= 0) { //TOP LEFT
            return viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0, 0));
        }
        if (point.y <= 0 && point.x >= 1) { //TOP RIGHT
            return viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(1, 0));
        }
        if (point.x <= 0 && point.y >= (1 / aspectRatio) + 0) { //BOTTOM LEFT
            return viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0, (1 / aspectRatio)));
        }
        if (point.x >= 1 && point.y >= (1 / aspectRatio) + 0) { //BOTTOM RIGHT
            return viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(1, (1 / aspectRatio)));
        }
        if (point.x <= -0.05) { //LEFT
            return viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0, point.y));
        }
        if (point.x >= 1.05) { //RIGHT
            return viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(1, point.y));
        }
        if (point.y <= -0.05) { //TOP
            return viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(point.x, 0));
        }
        if (point.y >= (1 / aspectRatio) + .05) { //BOTTOM
            return viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(point.x, (1 / aspectRatio)));
        }
    }

    /**
    * Calculates the location (point) of an element (bottom center)
    * Used in rich location history.
    * @method locationOf
    */
    function locationOf(element) {
        var point;
        (viewer.viewport && element) && function () {
            var ycoord = parseFloat($(element).css('top')) + parseFloat($(element).css('height'));
            var xcoord = parseFloat($(element).css('left')) + 0.5 * parseFloat($(element).css('width'));
            point = viewer.viewport.pointFromPixel(new OpenSeadragon.Point(xcoord, ycoord));
        }();
        return point;
    }

    /**
    * Puts an element in the center of the viewport
    * Used in RLH
    * @method centerElement
    */
    function centerElement(element) {
        var pixel = viewer.viewport.pixelFromPoint(viewer.viewport.getCenter());
        $(element).css({
            top: pixel.y,
            left: pixel.x
        });
    }

    /**
     * Gets a Seadragon point from the given overlay element. Uses BOTTOM as the default OverlayPlacement
     * @method getCoordinate
     * @param {HTML elt} element       the overlay element
     * @return {Seadragon.Point}       the location of the overlay in Seadragon coordinates
     */
    function getOverlayCoordinates(element) {
        var t = parseFloat($(element).css('top')) + $(element).height(),
            l = parseFloat($(element).css('left')) + $(element).width() / 2;

        return viewer.viewport.pointFromPixel(new OpenSeadragon.Point(l, t));
    }

    /** 
    * Returns a Seadragon point corresponding to a pixel
    * Used in RLH
    * @method pointFromPixel
    */
    function pointFromPixel(pixel) {
        return viewer.viewport.pointFromPixel(pixel);
    };

    /** 
    * Returns a Seadragon point in the center of the viewport + a 1% offset (to prevent overlap)
    * Used in RLH to create new pins
    * @method createStartingPoint
    */
    function createStartingPoint() {
        var centerPoint = viewer.viewport.getCenter();
        var bounds = viewer.viewport.getBounds();
        return new OpenSeadragon.Point(centerPoint.x + .01 * (bounds.getBottomRight().x - bounds.getTopLeft().x),
            centerPoint.y + .01 * (bounds.getBottomRight().y - bounds.getTopLeft().y));
    };

    /** 
    * Used for zooming when simultaneously dragging a pin in RLH
    * @method scroll
    */
    function scroll(delta, pivot) {
        dzManip({
            scale: delta,
            translation: {
                x: 0,
                y: 0
            },
            pivot: {
                x: pivot.x,
                y: pivot.y
            }
        });
    }

    /*
    * functions used to stop panning of image in RLH when pins are being dragged
    * @method pauseManip
    */
    function pauseManip() {
        doManipulation = false;
    }

    /*
    * functions used to start panning of image in RLH when pins have been set
    * @method restartManip
    */
    function restartManip() {
        doManipulation = true;
    }

    /**
 *Inits the OpenSeadragon viewer
 */
    function initOSD() {

        //Creates element that the OSD viewer will be appended to
        viewerelt = document.createElement("div");


        var holderID;
        if (locationHist) {
            holderID = "locationHistViewer";
        } else {
            holderID = "annotatedImageViewer";
        }
        //OSD enforces unique viewer ids, so we need to create unique ids for when there are multiple viewers (such as w/ custom maps)
        holderID = holderID + Math.floor(Math.random() * 1000000000);
        OSDHolder = $(viewerelt)
			.attr("id", holderID)
			.on('mousedown scroll click mousemove resize', function (evt) {
			    evt.preventDefault();
			});
        root.append(OSDHolder);
        OSDHolder.css({
            'height': '100%',
            'width': '100%',
            'left' : '12%',
            'position': 'absolute',
            'z-index': '0'
        });
        //The minimum percentage ( expressed as a number between 0 and 1 ) of the viewport height or width at which the zoom out will be constrained.
        //Setting it to 0, for example will allow you to zoom out infinitly.
        var minZoomImageRatio = 0.9; //OSD default- don't allow as much zoom out on deep zooms as in tour player
        if (inArtworkEditor) {
            minZoomImageRatio = 0.4; //Allow a lot of zoom out in artwork editor for thumbnail capture
        }

        var maxZoomImageRatio = null;
        var panHorizontal = true;
        var panVertical = true;
        if (isNobelWill === true) {
            maxZoomImageRatio = 1;
            minZoomImageRatio = 1;
            panVertical = false;
            panHorizontal = false;
        }
        //creates and sets up the OSD viewer
        viewer = new OpenSeadragon.Viewer({
            id: holderID,
            element: viewerelt,
            zoomPerClick: 1,  //disables click to zoom
            artworkViewer: true,
            panVertical: panVertical,
            constrainDuringPan: true,
            panHorizontal: panHorizontal,
            minZoomImageRatio: minZoomImageRatio,
            maxZoomImageRatio: maxZoomImageRatio,
            maxZoomPixelRatio: isNobelWill === false ? 2 : 0, //The maximum ratio to allow a zoom-in to affect the highest level pixel ratio. 
            visibilityRatio: isNobelWill === false ? .2 : 0, //set for consistency with ITE
            gestureSettingsTouch: { flickEnabled: false }, //don't allow flick gesture to throw art off screen
        });
        if (locationHist) {
            viewer.setMouseNavEnabled(false);
        }
        //fix for sticky mouse- in progress
        if (!IS_WINDOWS){
            /**
            var interactionOverlayOSD = $(document.createElement('div')).attr('id', "interactionOverlayOSD");
            interactionOverlayOSD.css({
                height: "100%",
                width: "100%",
                position: "absolute",
                left: 0,
                top: 0,
                'pointer-events': 'none'
            });
            root.append(interactionOverlayOSD);
            var mouseDown = false;
            var setMouse = function(){
                //viewer.setMouseNavEnabled(mouseDown);
                if (mouseDown = false){
                    interactionOverlayOSD.css('pointer-events', 'auto');
                    interactionOverlayOSD.on('mousedown',function(evt){
                        evt.stopPropagation();
                    });
                } else{
                    interactionOverlayOSD.off();
                    interactionOverlayOSD.css('pointer-events', 'none');
                }
            };
            //var keyDown = false;
            viewer.addHandler('canvas-drag', function(){
                console.log('canvas-drag');
                mouseDown = true;
                setMouse();
            });
            viewer.addHandler('canvas-drag-end', function(){
                console.log('canvas-drag-end');
                mouseDown = false;
                setMouse();
            })
            viewer.addHandler('canvas-release', function(){
                console.log('canvas-release');
                mouseDown = false;
                setMouse();
            })
            viewer.addHandler('mousedown', function(){
                console.log('mousedown');
                mouseDown = true;
                setMouse();
            })
**/

        }

        viewer.clearControls();
        OSDHolder.css({ 'position': 'absolute' })

        //the canvas
        var canvas = $(viewer.canvas).addClass("artworkCanvasTesting");
        //sets up manipulation 
        if (IS_WINDOWS) {
            TAG.Util.makeManipulatableWin(canvas[0], {
                onScroll: function (delta, pivot) {
                    dzScroll(delta, pivot);
                },
                onManipulate: function (res) {
                    if (doManipulation) {
                        res.translation.x = -res.translation.x;        //Flip signs for dragging
                        res.translation.y = -res.translation.y;
                        dzManip(res);
                    }
                }
            }, null, true); // NO ACCELERATION FOR NOW
        } else {
            TAG.Util.makeManipulatable(canvas[0], {
                onScroll: function (delta, pivot) {
                    dzScroll(delta, pivot);
                },
                onManipulate: function (res) {
                    if (doManipulation) {
                        res.translation.x = -res.translation.x;        //Flip signs for dragging
                        res.translation.y = -res.translation.y;
                        dzManip(res);
                    }
                }
            }, null, true); // NO ACCELERATION FOR NOW
        }

        //adds assetCanvas for associated media
        assetCanvas = $(document.createElement('div'));
        assetCanvas.attr('id', 'annotatedImageAssetCanvas');
        root.append(assetCanvas);

        // this is stupid, but it seems to work (for being able to reference zoomimage in artmode)
        noMedia ? setTimeout(function () { callback && callback() }, 1) : loadAssociatedMedia(callback);
    }


    /**
     * Initialize seadragon, set up handlers for the deepzoom image, load assoc media if necessary -- should be deprecated now
     * @method init
     */
    /**
    function init() {
        var canvas;

        if(Seadragon.Config) {
            Seadragon.Config.visibilityRatio = 0.8; // TODO see why Seadragon.Config isn't defined; should it be?
            //Seadragon.Config.springStiffness = 0;
            //Seadragon.Config.animationTime = 0;
        }

        viewerelt = $(document.createElement('div'));
        viewerelt.attr('id', 'annotatedImageViewer');
        viewerelt.on('mousedown scroll click mousemove resize', function(evt) {
            evt.preventDefault();
        });
        root.append(viewerelt);

        viewer = new Seadragon.Viewer(viewerelt[0]);
        viewer.setMouseNavEnabled(false);
        viewer.clearControls();

        canvas = $(viewer.canvas);
        canvas.addClass('artworkCanvasTesting');
        if (IS_WINDOWS) {
            TAG.Util.makeManipulatableWin(canvas[0], {
                onScroll: function (delta, pivot) {
                    dzScroll(delta, pivot);
                    doNothing("Scrolling map!");
                },
                onManipulate: function (res) {
                    if (doManipulation) {
                        res.translation.x = -res.translation.x;        //Flip signs for dragging
                        res.translation.y = -res.translation.y;
                        dzManip(res);
                    }
                }
            }, null, true); // NO ACCELERATION FOR NOW
        } else {
            TAG.Util.makeManipulatable(canvas[0], {
                onScroll: function (delta, pivot) {
                    dzScroll(delta, pivot);
                },
                onManipulate: function (res) {
                    if (doManipulation) {
                        res.translation.x = -res.translation.x;        //Flip signs for dragging
                        res.translation.y = -res.translation.y;
                        dzManip(res);
                    }
                }
            }, null, true); // NO ACCELERATION FOR NOW
        }

        assetCanvas = $(document.createElement('div'));
        assetCanvas.attr('id', 'annotatedImageAssetCanvas');
        root.append(assetCanvas);

        // this is stupid, but it seems to work (for being able to reference zoomimage in artmode)
        noMedia ? setTimeout(function() { callback && callback() }, 1) : loadAssociatedMedia(callback);
}
**/

    /**
     * Adds an animation handler to the annotated image. This is used to allow the image to move
     * when the minimap is manipulated.
     * @method addAnimationHandler
     * @param {Function} handler      the handler to add
     */
    function addAnimateHandler(handler) {
        viewer.addHandler("animation", handler, { "viewport": viewer.viewport });
    }

    /**
     * Retrieves associated media from server and stores them in the
     * associatedMedia array.
     * @method loadAssociatedMedia
     * @param {Function} callback    function to call after loading associated media
     */
    function loadAssociatedMedia(callback) {
        var done = 0,
            total;

        associatedMedia = {
            guids: []
        };

        TAG.Worktop.Database.getAssocMediaTo(doq.Identifier, mediaSuccess, null, mediaSuccess);

        /**
         * Success callback function for .getAssocMediaTo call above. If the list of media is
         * non-null and non-empty, it gets the linq between each doq and the artwork 
         * @method mediaSuccess
         * @param {Array} doqs        the media doqs
         */
        function mediaSuccess(doqs) {
            var i;
            total = doqs ? doqs.length : 0;
            if (total > 0) {
                for (i = 0; i < doqs.length; i++) {
                    TAG.Worktop.Database.getLinq(doq.Identifier, doqs[i].Identifier, createLinqSuccess(doqs[i]), null, createLinqSuccess(doqs[i]));
                }
            } else {
                callback && callback(associatedMedia);
            }
        }

        /**
         * Helper function for the calls to .getLinq above. It accepts an assoc media doc and returns
         * a success callback function that accepts a linq. Using this information, it creates a new
         * hotspot from the doq and linq
         * @method createLinqSuccess
         * @param {doq} assocMedia        the relevant associated media doq
         */
        function createLinqSuccess(assocMedia) {
            return function (linq) {
                associatedMedia[assocMedia.Identifier] = createMediaObject(assocMedia, linq);
                associatedMedia.guids.push(assocMedia.Identifier);

                if (++done >= total && callback) {
                    callback(associatedMedia);
                }
            }
        }
    }


    /**
     * Creates an associated media object to be added to associatedMedia.
     * This object contains methods that could be called in Artmode.js or
     * ArtworkEditor.js. This could be in its own file.
     * @method createMediaObject
     * @param {mdoq} doq       the media doq
     * @param {linq} linq     the linq between the media doq and the artwork doq
     * @return {Object}       some public methods to be used in other files
     */
    function createMediaObject(mdoq, linq) {
        var // DOM-related
            outerContainer = $(document.createElement('div')).addClass('mediaOuterContainer'),
            innerContainer = $(document.createElement('div')).addClass('mediaInnerContainer'),
            mediaContainer = $(document.createElement('div')).addClass('mediaMediaContainer'),

            // constants
            IS_HOTSPOT = linq.Metadata.Type ? (linq.Metadata.Type === "Hotspot") : false,
            IS_XFADE = linq.Metadata.Type ? (linq.Metadata.Type === "Layer") : false, //TODO ADD BACK WHEN LAYERS COME BACK
            X = parseFloat(linq.Offset._x),
            Y = parseFloat(linq.Offset._y),
            position = new OpenSeadragon.Point(X, Y),
            rect,   //For layer
            TITLE = unescape(TAG.Util.htmlEntityDecode(mdoq.Name)),
            CONTENT_TYPE = mdoq.Metadata.ContentType,
            SOURCE = mdoq.Metadata.Source,
            DESCRIPTION = unescape(TAG.Util.htmlEntityDecode(mdoq.Metadata.Description)),
            THUMBNAIL = mdoq.Metadata.Thumbnail,
            RELATED_ARTWORK = false,

            // misc initialized variables
            mediaHidden = true,
            hotspotMediaHidden = true,
            outerContainerhidden = true,
            currentlySeeking = false,
            movementTimeouts = [],
            circleRadius = 60,
            // misc uninitialized variables
            circle,
            position,
            mediaLoaded,
            mediaElt,
            mediaController,
            titleDiv,
            descTextSize,
            titleTextHolder,
            descDiv,
            thumbnailButton,
            startLocation,
            play;
        // get things rolling
        initMediaObject();

        /**
         * Initialize various parts of the media object: UI, manipulation handlers
         * @method initMediaObject
         */
        function initMediaObject() {
            if (IS_XFADE && linq.Offset && linq.Dimensions) {
                outerContainer.css({
                    'border': '1px solid rgba(255,255,255,0.4)',
                    'background': 'rgba(0,0,0,0)',
                    'width': parseFloat(parseInt(linq.Dimensions._x) || 50),
                    'height': parseFloat(parseInt(linq.Dimensions._y) || 50),
                    'position': 'absolute'
                });
                assetCanvas.append(outerContainer);
                outerContainer.hide();
            } else {
                // set up divs for the associated media
                outerContainer.css('width', 0.29 * root.width() + 'px');
                innerContainer.css('backgroundColor', 'rgba(0,0,0,0.65)');
                // for scaling and preventing overflow issues with the close button, we use a holder for the title
                // .remove is safety check for inertia looping issue
                titleDiv && titleDiv.remove();
                titleDiv = $(document.createElement('div'));
                var titleHeight = '20px';
                if (IS_WINDOWS) {
                    titleHeight = '40px';
                }
                titleDiv.css({
                    'display': 'block',
                    'height': titleHeight,
                    'position': 'relative',
                    'margin-bottom': '5px',
                    'width': '100%',
                });
                titleTextHolder = $(document.createElement('div'));
                titleTextHolder.addClass('annotatedImageMediaTitle');//.css({'text-overflow':'ellipsis','white-space':'nowrap'});

                titleDiv.append(titleTextHolder);
                var titlefontsize = LADS.Util.getMaxFontSizeEM("WWWWW", 0.6, 999999, parseInt(titleHeight) + 1, 0.025);
                if (TITLE) {
                    titleTextHolder.text(TITLE);
                } else {
                    titleTextHolder.text('Untitled');
                }

                titleTextHolder.css({
                    'width': (outerContainer.width() - 65) + 'px',
                    'font-size': titlefontsize
                });

                descTextSize = titlefontsize;

                var closeButton = createCloseButton();
                closeButton.on('click', function (evt) {
                    evt.stopPropagation();
                    hideMediaObject();
                    TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                        tobj.current_artwork = doq.Identifier;
                        tobj.assoc_media = mdoq.Identifier; //the associated media that was clicked
                        tobj.assoc_media_interactions = "close"; //TODO what is this
                    });
                });
                titleDiv.append(closeButton[0]);

                innerContainer.append(titleDiv);
                innerContainer.append(mediaContainer);

                /**
                if (DESCRIPTION) {
                    descDiv = $(document.createElement('div'));
                    descDiv.addClass('annotatedImageMediaDescription');
                    descDiv.html(Autolinker.link(DESCRIPTION, { email: false, twitter: false }));
                    if (IS_WINDOWS) {
                        var links = descDiv.find('a');
                        links.each(function (index, element) {
                            $(element).replaceWith(function () {
                                return $.text([this]);
                            });
                        });
                    }
                    descDiv.css({
                        'top' : innerContainer.height() + 'px';
                    });
                    innerContainer.append(descDiv);
                }
                **/

                if (RELATED_ARTWORK) {
                    // TODO append related artwork button here
                }

                outerContainer.append(innerContainer);
                assetCanvas.append(outerContainer);
                outerContainer.hide();

                // create hotspot circle if need be
                if (IS_HOTSPOT) {
                    if (isNobelWill !== true) {
                        circle = $(document.createElement("img"));
                        circle.attr('src', tagPath + 'images/icons/hotspot_circle.svg');
                        circle.addClass('annotatedImageHotspotCircle');
                        circle.click(function () {
                            toggleMediaObject(true);
                            TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                                tobj.current_artwork = doq.Identifier;
                                tobj.assoc_media = mdoq.Identifier;
                                tobj.assoc_media_interactions = "hotspot_toggle";
                            });
                        });
                        root.append(circle);
                    }
                    else {

                    }
                }

                // allows asset to be dragged, despite the name
                TAG.Util.disableDrag(outerContainer);

                //When the associated media is clicked, set it to active(see mediaManipPreprocessing() above )
                outerContainer.on('click mousedown', function (event) {
                    event.stopPropagation();            //Prevent the click going through to the main container
                    event.preventDefault();
                    TAG.Util.IdleTimer.restartTimer();
                    mediaManipPreprocessing();
                    TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                        tobj.current_artwork = doq.Identifier;
                        tobj.assoc_media = mdoq.Identifier; //the associated media that was clicked
                        tobj.assoc_media_interactions = "set_active"; //TODO what is this
                    });
                    // If event is initial touch on artwork, save current position of media object to use for animation
                    outerContainer.startLocation = {
                        x: outerContainer.position().left,
                        y: outerContainer.position().top
                    };
                    doNothing("startin location is getting set")
                    outerContainer.manipulationOffset = {
                        x: event.clientX - outerContainer.position().left,
                        y: event.clientY - outerContainer.position().top
                    };

                });

                // register handlers
                if (IS_WINDOWS) {
                    TAG.Util.makeManipulatableWin(outerContainer[0], {
                        onManipulate: mediaManipWin,
                        onScroll: mediaScrollWin
                    }, null); // NO ACCELERATION FOR NOW  
                } else {
                    TAG.Util.makeManipulatable(outerContainer[0], {
                        onManipulate: mediaManip,
                        onScroll: mediaScroll
                    }, null, true); // NO ACCELERATION FOR NOW  
                }

            }
        }

        /**
         * Initialize any media controls
         * @method initMediaControls
         * @param {HTML element} elt      video or audio element
         */
        function initMediaControls() {
            var elt = mediaElt,
                $elt = $(elt),
                cpHolder = $(document.createElement('div')),
                controlPanel = $(document.createElement('div')).addClass('annotatedImageMediaControlPanel'),
                vol = $(document.createElement('img')).addClass('mediaVolButton'),
                timeContainer = $(document.createElement('div')).addClass('mediaTimeContainer'),
                currentTimeDisplay = $(document.createElement('div')).addClass('mediaTimeDisplay'),
                playHolder = $(document.createElement('div')).addClass('mediaPlayHolder'),
                volHolder = $(document.createElement('div')).addClass('mediaVolHolder'),
                sliderContainer = $(document.createElement('div')).addClass('mediaSliderContainer'),
                sliderPoint = $(document.createElement('div')).addClass('mediaSliderPoint');

            controlPanel.attr('id', 'media-control-panel-' + mdoq.Identifier);

            play = $(document.createElement('img')).addClass('mediaPlayButton');

            play.attr('src', tagPath + 'images/icons/PlayWhite.svg');
            vol.attr('src', tagPath + 'images/icons/VolumeUpWhite.svg');
            currentTimeDisplay.text("00:00");

            // dz17 - don't move this out - these divs are dynamically generated. The holders help with scaled positioning substantially.
            cpHolder.css({
                'width': '100%',
                'margin': '0 auto'
            });

            play.css({
                'position': 'absolute',
                'height': '100%',
                'width': 'auto'
            });

            playHolder.css({
                'position': 'absolute',
                'height': '35px',
                'width': "auto",
                'display': "block",
                'margin': '4px 1% 0px 1%'
            });

            sliderContainer.css({
                'position': 'absolute',
                'display': "block",
                'height': '17px',
                'width': '475px',
                'max-width': '600px',
                'left': '55px',
                'top': '13px'
            });

            sliderPoint.css({
                'position': 'absolute',
                'height': '100%',
                'background-color': '#3cf',
                'width': '0%',
                'left': '0%',
                'max-width': '100%'
            });

            vol.css({
                'position': 'absolute',
                'height': '100%',
                'width': 'auto',
                'right': '0%'
            });

            volHolder.css({
                'height': '30px',
                'position': 'absolute',
                'display': "block",
                'width': 'auto',
                'right': '2%',
                'top': '6px'
            });

            timeContainer.css({
                'height': '45px',
                'width': '15%',
                'max-width': '70px',
                'right': '56px',
                'display': 'block',
                'position': 'absolute'
            });
            var timefontsize = LADS.Util.getMaxFontSizeEM("00:00", 0.6, 70, 40, 0.025);
            currentTimeDisplay.css({
                'top': '1px',
                'height': '40px',
                'position': 'absolute',
                'font-size': timefontsize,
                'vertical-align': 'middle',
                'text-align': 'center'
            });

            playHolder.append(play);
            sliderContainer.append(sliderPoint);
            volHolder.append(vol);

            // set up handlers
            play.on('click', function () {
                if (elt.paused) {
                    elt.play();
                    play.attr('src', tagPath + 'images/icons/PauseWhite.svg');
                    TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                        tobj.current_artwork = doq.Identifier;
                        tobj.assoc_media = mdoq.Identifier;
                        tobj.assoc_media_interactions = "play_media";
                    });
                } else {
                    elt.pause();
                    play.attr('src', tagPath + 'images/icons/PlayWhite.svg');
                    TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                        tobj.current_artwork = doq.Identifier;
                        tobj.assoc_media = mdoq.Identifier;
                        tobj.assoc_media_interactions = "pause_media";
                    });
                }
            });

            vol.on('click', function () {
                if (elt.muted) {
                    elt.muted = false;
                    vol.attr('src', tagPath + 'images/icons/VolumeUpWhite.svg');
                    TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                        tobj.current_artwork = doq.Identifier;
                        tobj.assoc_media = mdoq.Identifier;
                        tobj.assoc_media_interactions = "volume_up";
                    });
                } else {
                    elt.muted = true;
                    vol.attr('src', tagPath + 'images/icons/VolumeDownWhite.svg');
                    TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                        tobj.current_artwork = doq.Identifier;
                        tobj.assoc_media = mdoq.Identifier;
                        tobj.assoc_media_interactions = "volume_down";
                    });
                }
            });

            $elt.on('ended', function () {
                elt.pause();
                play.attr('src', tagPath + 'images/icons/PlayWhite.svg');
            });

            sliderContainer.on('mousedown', function (evt) {
                var time = elt.duration * ((evt.pageX - $(evt.target).offset().left) / sliderContainer.width()),
                    origPoint = evt.pageX,
                    timePxRatio = elt.duration / sliderContainer.width(),
                    currTime = Math.max(0, Math.min(elt.duration, elt.currentTime)),
                    origTime = time,
                    currPx = currTime / timePxRatio,
                    minutes = Math.floor(currTime / 60),
                    seconds = Math.floor(currTime % 60),
                    adjMin = (minutes < 10) ? '0' + minutes : minutes,
                    adjSec = (seconds < 10) ? '0' + seconds : seconds;

                evt.stopPropagation();
                TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                    tobj.current_artwork = doq.Identifier;
                    tobj.assoc_media = mdoq.Identifier;
                    tobj.assoc_media_interactions = "media_seek";
                });
                if (!isNaN(time)) {
                    currentTimeDisplay.text(adjMin + ":" + adjSec);
                    elt.currentTime = time;
                    sliderPoint.css('width', 100 * (currPx / sliderContainer.width()) + '%');
                }

                sliderContainer.on('mousemove.seek', function (e) {
                    var currPoint = e.pageX,
                        timeDiff = (currPoint - origPoint) * timePxRatio;

                    currTime = Math.max(0, Math.min(elt.duration, origTime + timeDiff));
                    currPx = currTime / timePxRatio;
                    minutes = Math.floor(currTime / 60);
                    seconds = Math.floor(currTime % 60);
                    adjMin = (minutes < 10) ? '0' + minutes : minutes;
                    adjSec = (seconds < 10) ? '0' + seconds : seconds;

                    if (!isNaN(currTime)) {
                        currentTimeDisplay.text(adjMin + ":" + adjSec);
                        elt.currentTime = currTime;
                        sliderPoint.css('width', 100 * (currPx / sliderContainer.width()) + '%');
                    }
                });

                $('body').on('mouseup.seek mouseleave.seek', function () {
                    sliderContainer.off('mouseup.seek mouseleave.seek mousemove.seek');
                    // if(!isNaN(getCurrTime())) {
                    //     currentTimeDisplay.text(adjMin + ":" + adjSec);
                    //     elt.currentTime = getCurrTime();
                    //     sliderPoint.css('width', 100*(currPx / sliderContainer.width()) + '%');
                    // }
                });
            });

            // Update the seek bar as the video plays
            $elt.on("timeupdate", function () {
                var value = 100 * elt.currentTime / elt.duration,
                    timePxRatio = elt.duration / sliderContainer.width(),
                    currPx = elt.currentTime / timePxRatio,
                    minutes = Math.floor(elt.currentTime / 60),
                    seconds = Math.floor(elt.currentTime % 60),
                    adjMin = (minutes < 10) ? '0' + minutes : minutes,
                    adjSec = (seconds < 10) ? '0' + seconds : seconds;

                if (!isNaN(elt.currentTime)) {
                    currentTimeDisplay.text(adjMin + ":" + adjSec);
                    sliderPoint.css('width', 100 * (currPx / sliderContainer.width()) + '%');
                }
            });

            mediaContainer.append(elt);
            mediaContainer.append(controlPanel);
            controlPanel.append(cpHolder);
            cpHolder.append(playHolder);
            cpHolder.append(sliderContainer);
            timeContainer.append(currentTimeDisplay);
            cpHolder.append(timeContainer);
            cpHolder.append(volHolder);

            mediaController = controlPanel;
        }

        function reinitMediaControlHandlers() {
            // find shit
            var elt = mediaElt,
                $elt = $(elt),
                vol = $(mediaController.find('.mediaVolButton')[0]),
                timeContainer = $(mediaController.find('.mediaTimeContainer')[0]),
                currentTimeDisplay = $(mediaController.find('.mediaTimeDisplay')[0]),
                sliderContainer = $(mediaController.find('.mediaSliderContainer')[0]),
                sliderPoint = $(mediaController.find('.mediaSliderPoint')[0]),
                playButton = $(mediaController.find('.mediaPlayButton')[0]);

            // set up handlers
            playButton.on('click', function () {
                if (elt.paused) {
                    elt.play();
                    playButton.attr('src', tagPath + 'images/icons/PauseWhite.svg');
                    TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                        tobj.current_artwork = doq.Identifier;
                        tobj.assoc_media = mdoq.Identifier;
                        tobj.assoc_media_interactions = "play_media";
                    });
                } else {
                    elt.pause();
                    playButton.attr('src', tagPath + 'images/icons/PlayWhite.svg');
                    TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                        tobj.current_artwork = doq.Identifier;
                        tobj.assoc_media = mdoq.Identifier;
                        tobj.assoc_media_interactions = "pause_media";
                    });
                }
            });

            vol.on('click', function () {
                if (elt.muted) {
                    elt.muted = false;
                    vol.attr('src', tagPath + 'images/icons/VolumeUpWhite.svg');
                    TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                        tobj.current_artwork = doq.Identifier;
                        tobj.assoc_media = mdoq.Identifier;
                        tobj.assoc_media_interactions = "volume_up";
                    });
                } else {
                    elt.muted = true;
                    vol.attr('src', tagPath + 'images/icons/VolumeDownWhite.svg');
                    TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                        tobj.current_artwork = doq.Identifier;
                        tobj.assoc_media = mdoq.Identifier;
                        tobj.assoc_media_interactions = "volume_down";
                    });
                }
            });

            $elt.on('ended', function () {
                elt.pause();
                playButton.attr('src', tagPath + 'images/icons/PlayWhite.svg');
            });

            sliderContainer.on('mousedown', function (evt) {
                var time = elt.duration * ((evt.pageX - $(evt.target).offset().left) / sliderContainer.width()),
                    origPoint = evt.pageX,
                    timePxRatio = elt.duration / sliderContainer.width(),
                    currTime = Math.max(0, Math.min(elt.duration, elt.currentTime)),
                    origTime = time,
                    currPx = currTime / timePxRatio,
                    minutes = Math.floor(currTime / 60),
                    seconds = Math.floor(currTime % 60),
                    adjMin = (minutes < 10) ? '0' + minutes : minutes,
                    adjSec = (seconds < 10) ? '0' + seconds : seconds;

                evt.stopPropagation();
                TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                    tobj.current_artwork = doq.Identifier;
                    tobj.assoc_media = mdoq.Identifier;
                    tobj.assoc_media_interactions = "media_seek";
                });
                if (!isNaN(time)) {
                    currentTimeDisplay.text(adjMin + ":" + adjSec);
                    elt.currentTime = time;
                    sliderPoint.css('width', 100 * (currPx / sliderContainer.width()) + '%');
                }

                sliderContainer.on('mousemove.seek', function (e) {
                    var currPoint = e.pageX,
                        timeDiff = (currPoint - origPoint) * timePxRatio;

                    currTime = Math.max(0, Math.min(elt.duration, origTime + timeDiff));
                    currPx = currTime / timePxRatio;
                    minutes = Math.floor(currTime / 60);
                    seconds = Math.floor(currTime % 60);
                    adjMin = (minutes < 10) ? '0' + minutes : minutes;
                    adjSec = (seconds < 10) ? '0' + seconds : seconds;

                    if (!isNaN(currTime)) {
                        currentTimeDisplay.text(adjMin + ":" + adjSec);
                        elt.currentTime = currTime;
                        sliderPoint.css('width', 100 * (currPx / sliderContainer.width()) + '%');
                    }
                });

                $('body').on('mouseup.seek mouseleave.seek', function () {
                    sliderContainer.off('mouseup.seek mouseleave.seek mousemove.seek');
                    // if(!isNaN(getCurrTime())) {
                    //     currentTimeDisplay.text(adjMin + ":" + adjSec);
                    //     elt.currentTime = getCurrTime();
                    //     sliderPoint.css('width', 100*(currPx / sliderContainer.width()) + '%');
                    // }
                });
            });

            // Update the seek bar as the video plays
            $elt.on("timeupdate", function () {
                var value = 100 * elt.currentTime / elt.duration,
                    timePxRatio = elt.duration / sliderContainer.width(),
                    currPx = elt.currentTime / timePxRatio,
                    minutes = Math.floor(elt.currentTime / 60),
                    seconds = Math.floor(elt.currentTime % 60),
                    adjMin = (minutes < 10) ? '0' + minutes : minutes,
                    adjSec = (seconds < 10) ? '0' + seconds : seconds;

                if (!isNaN(elt.currentTime)) {
                    currentTimeDisplay.text(adjMin + ":" + adjSec);
                    sliderPoint.css('width', 100 * (currPx / sliderContainer.width()) + '%');
                }
            });
        }

        /**
         * Load the actual image/video/audio; this can take a while if there are
         * a lot of media, so just do it when the thumbnail button is clicked
         * @method createMediaElements
         */
        function createMediaElements() {
            var $mediaElt,
                img,
                iframe,
               // closeButton,
                x,
                y,
                w,
                h;
            //rect;

            if (!mediaLoaded) {
                mediaLoaded = true;
            } else {
                if (mediaHidden) {
                    initMediaObject();
                    if (IS_XFADE) {
                        outerContainer.css({
                            "pointer-events": "none "
                        })
                    } else {
                        if (CONTENT_TYPE === 'Image') {
                            outerContainer.css('min-width', '');
                        } else if (CONTENT_TYPE === 'Video') {
                            outerContainer.css({
                                'width': '675px',
                                'height': 'auto'
                            });
                            reinitMediaControlHandlers();
                        } else if (CONTENT_TYPE === 'Audio') {
                            outerContainer.css({
                                'width': '675px',
                                'height': 'auto'
                            });
                            reinitMediaControlHandlers();
                        } else if (CONTENT_TYPE === 'iframe') {

                            outerContainer.css({
                                'width': '30%',
                            });
                            if (descDiv) {
                                outerContainer.css('height', outerContainer.width() * 1.15);
                            } else {
                                outerContainer.css('height', outerContainer.width() * 0.89);
                            }
                            innerContainer.css({
                                'height': '100%'
                            });
                            var mediaHeight;
                            DESCRIPTION ? mediaHeight = '85%' : mediaHeight = '100%';
                            mediaContainer.css({
                                'height': mediaHeight
                            });
                            /*var iframe = outerContainer.find("iframe");
                            iframe.attr({
                                src: SOURCE + "?modestbranding=1&showinfo=0&fs=0",
                                frameborder: '0'
                            });
                            iframe.css({
                                width: '100%',
                                height: '100%'
                            });*/

                            //Create an overlay to help with interaction (problems with mouse "sticking" to iframe)
                            //Basically, create an overlay that only exists while you have clicked down on the media, and then is removed when you release it (i.e, when you want to actually play the iframe)
                            if (!IS_WINDOWS) {
                                var interactionOverlay = $(document.createElement('div')).addClass("interactionOverlay");
                                interactionOverlay.css({
                                    height: "100%",
                                    width: "100%",
                                    position: "absolute",
                                    left: 0,
                                    top: 0
                                });
                                outerContainer.on('mousedown', function () {
                                    interactionOverlay.css("pointer-events", "auto");
                                });
                                $("body").on('mouseup', function () {
                                    interactionOverlay && interactionOverlay.css("pointer-events", "none")
                                });
                                mediaContainer.append(interactionOverlay)
                            }
                        }
                        if (DESCRIPTION) {
                            descDiv = $(document.createElement('div'));
                            descDiv.addClass('annotatedImageMediaDescription');
                            descDiv.css({
                                'font-size': descTextSize
                            });
                            descDiv.html(Autolinker.link(DESCRIPTION, { email: false, twitter: false }));
                            if (IS_WINDOWS) {
                                var links = descDiv.find('a');
                                links.each(function (index, element) {
                                    $(element).replaceWith(function () {
                                        return $.text([this]);
                                    });
                                });
                            }
                            descDiv.mouseover(function () { descscroll = true });
                            descDiv.mouseleave(function () { descscroll = false; });
                            //if(CONTENT_TYPE === 'iframe'){
                            //    descDiv.css({top:'110%'});
                            //}
                            console.log("description is here!")

                            /*if (isImpactMap === true) {
                                console.log("should create button now")
                                var fieldsMapButton = $(document.createElement("BUTTON"));
                                fieldsMapButton.text("Learn More");
                                fieldsMapButton.css({
                                    'color': 'black',
                                    "background-color": "transparent",
                                    'float': 'bottom',
                                    'left': '50%',
                                    'position': 'relative'
                                });
                                descDiv.append(fieldsMapButton);

                            }*/
                            outerContainer.append(descDiv);
                        }

                        
                        
                        return;
                    }
                } else {
                    return;
                }
            }

            if (IS_XFADE) {
                $mediaElt = $(document.createElement('img')).addClass('xfadeImg');
                $mediaElt.attr({
                    src: FIX_PATH(SOURCE)
                });
                $mediaElt.css({
                    height: '100%',
                    position: 'absolute',
                    width: '100%'
                });
                outerContainer.append($mediaElt);
                outerContainer.css({
                    "pointer-events": "none "
                })

                x = parseFloat(linq.Offset._x || 0);
                y = parseFloat(linq.Offset._y || 0);
                w = parseFloat(linq.Dimensions._x || 50);
                h = parseFloat(linq.Dimensions._y || 50);
                xFadeOffset = {
                    x: x,
                    y: y
                }
                rect = new OpenSeadragon.Rect(x, y, w, h);

                viewer.addOverlay(outerContainer[0], rect);
            } else {
                //closeButton = createCloseButton();
                //mediaContainer.append(closeButton[0]);
                //closeButton.on('click', function (evt) {
                //        evt.stopPropagation();
                //        hideMediaObject();
                //});

                if (CONTENT_TYPE === 'Image') {
                    img = document.createElement('img');
                    img.src = FIX_PATH(SOURCE);
                    $(img).css({
                        position: 'relative',
                        width: '100%',
                        height: 'auto'
                    });
                    mediaContainer.append(img);
                    outerContainer.css('min-width', '');
                } else if (CONTENT_TYPE === 'Video') {
                    mediaElt = document.createElement('video');
                    $mediaElt = $(mediaElt);

                    $mediaElt.attr({
                        preload: 'none',
                        poster: (THUMBNAIL && !THUMBNAIL.match(/.mp4/)) ? FIX_PATH(THUMBNAIL) : '',
                        src: FIX_PATH(SOURCE),
                        type: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
                        controls: false
                    });

                    outerContainer.css({
                        'width': '675px',
                        'height': 'auto'
                    });

                    // TODO need to use <source> tags rather than setting the source and type of the
                    //      video in the <video> tag's attributes; see video player code

                    $mediaElt.css({
                        position: 'relative',
                        width: '100%'
                    });

                    initMediaControls(mediaElt);

                } else if (CONTENT_TYPE === 'Audio') {
                    mediaElt = document.createElement('audio');
                    $mediaElt = $(mediaElt);

                    $mediaElt.attr({
                        preload: 'none',
                        type: 'audio/mp3',
                        src: FIX_PATH(SOURCE),
                        controls: false
                    });

                    initMediaControls(mediaElt);
                    $mediaElt.on('error', function () {
                        doNothing("Here's an error ");
                    });
                    outerContainer.css({
                        'width': '675px',
                        'height': 'auto'
                    });
                } else if (CONTENT_TYPE === 'iframe') {
                    outerContainer.css({
                        'width': '30%',
                    });
                    if (descDiv) {
                        outerContainer.css('height', outerContainer.width() * 1.15);
                    } else {
                        outerContainer.css('height', outerContainer.width() * 0.89);
                    }
                    innerContainer.css({
                        'height': '100%'
                    });
                    var mediaHeight;
                    DESCRIPTION ? mediaHeight = '85%' : mediaHeight = '100%';
                    mediaContainer.css({
                        'height': mediaHeight
                    });
                    iframe = $(document.createElement('iframe'));
                    iframe.attr({
                        src: SOURCE + "?modestbranding=1&showinfo=0&fs=0",
                        frameborder: '0'
                    });
                    iframe.css({
                        width: '100%',
                        height: '100%'
                    });
                    mediaContainer.append(iframe);

                    //Create an overlay to help with interaction (problems with mouse "sticking" to iframe)
                    //Basically, create an overlay that only exists while you have clicked down on the media, and then is removed when you release it (i.e, when you want to actually play the iframe)
                    if (!IS_WINDOWS) {
                        var interactionOverlay = $(document.createElement('div'))
                        interactionOverlay.css({
                            height: "100%",
                            width: "100%",
                            position: "absolute",
                            left: 0,
                            top: 0
                        })

                        outerContainer.on('mousedown', function () {
                            interactionOverlay.css("pointer-events", "auto");
                        });
                        $("body").on('mouseup', function () {
                            interactionOverlay && interactionOverlay.css("pointer-events", "none")
                        });
                        mediaContainer.append(interactionOverlay)
                    }
                }
                if (DESCRIPTION) {
                    descDiv = $(document.createElement('div'));
                    descDiv.addClass('annotatedImageMediaDescription');
                    descDiv.css({
                        'font-size': descTextSize
                    });
                    descDiv.html(Autolinker.link(DESCRIPTION, { email: false, twitter: false }));
                    if (IS_WINDOWS) {
                        var links = descDiv.find('a');
                        links.each(function (index, element) {
                            $(element).replaceWith(function () {
                                return $.text([this]);
                            });
                        });
                    }
                    descDiv.mouseover(function () { descscroll = true });
                    descDiv.mouseleave(function () { descscroll = false; });
                    //if(CONTENT_TYPE === 'iframe'){
                    //    descDiv.css({top:'110%'});
                    //}
                    outerContainer.append(descDiv);
                }
            }
        }

        /**
         * Stores the dimensions and points to the media manipulation method  of the active associated media, also sends it to the front
         * media manip.
         * @method mediaManipPreprocessing
         */
        function mediaManipPreprocessing() {
            var w = outerContainer.width(),
                h = outerContainer.height();
            outerContainerPivot = {
                x: w / 2,// - (outerContainer.offset().left - root.offset().left),
                y: h / 2// - (outerContainer.offset().top - root.offset().top)
            };
            if (IS_XFADE) {
                toManip = dzManip;
            } else {
                toManip = mediaManip;
                $('.mediaOuterContainer').css('z-index', 1000);
                outerContainer.css('z-index', 1001);
            }
            TAG.Util.IdleTimer.restartTimer();
        }



        function mediaManipWin(res) {
            if (isNobelWill === true) {
                $("#annotatedImageAssetCanvas").css("z-index", '9999999');
            }
            var t = outerContainer.css('top');
            var l = outerContainer.css('left');
            var w = outerContainer.css('width');
            var h = outerContainer.css('height');
            var neww = parseFloat(w) * res.scale;
            var isOffscreen = "false";
            var minConstraint;
            if (CONTENT_TYPE === 'Video' || CONTENT_TYPE === 'Audio') {
                minConstraint = 450;
            } else {
                minConstraint = 200;
            }

            //if the new width is in the right range, scale from the point of contact and translate properly; otherwise, just translate and clamp
            var newClone;
            if ((neww >= minConstraint) && (neww <= 800)) {
                if (0 < parseFloat(t) + parseFloat(h) && parseFloat(t) < rootHeight && 0 < parseFloat(l) + parseFloat(w) && parseFloat(l) < rootWidth && res) {
                    outerContainer.css("top", (parseFloat(t) + res.translation.y + (1.0 - res.scale) * (res.pivot.y)) + "px");
                    outerContainer.css("left", (parseFloat(l) + res.translation.x + (1.0 - res.scale) * (res.pivot.x)) + "px");
                }
            } else {
                if (0 < parseFloat(t) + parseFloat(h) && parseFloat(t) < rootHeight && 0 < parseFloat(l) + parseFloat(w) && parseFloat(l) < rootWidth && res) {
                    outerContainer.css("top", (parseFloat(t) + res.translation.y) + "px");
                    outerContainer.css("left", (parseFloat(l) + res.translation.x) + "px");
                    neww = Math.min(Math.max(neww, minConstraint), 800);
                }
            }
            outerContainer.css("width", neww + "px");
            if (CONTENT_TYPE === 'Audio') {
                outerContainer.css('height', 'auto');
            } else {
                var newH = (neww * h) / w;
                outerContainer.css('height', newH + 'px');
            }
            outerContainer.find('.annotatedImageMediaTitle').css({
                'width': (neww - 65) + 'px'
            });

            if (CONTENT_TYPE === 'Video') {
                outerContainer.find('.mediaSliderContainer').css({
                    'width': (neww - 200) + 'px'
                });
            }
            mediaManipPreprocessing();

            checkForOffscreen();

            function checkForOffscreen() {
                var offscreenBuffer = (!IS_WINDOWS ? root.width() / 8 : 0);
                var finalPosition = {
                    x: parseInt(outerContainer.css('left')),
                    y: parseInt(outerContainer.css('top'))
                };
                var finalDims = {
                    w: parseInt(outerContainer.css('width')),
                    h: parseInt(outerContainer.css('height'))
                }
                if (!(
                    (0 < finalPosition.y + finalDims.h - offscreenBuffer) //top
                    && (finalPosition.y + offscreenBuffer < root.height()) //bottom
                    && (0 < finalPosition.x + finalDims.w - offscreenBuffer) //left
                    && (finalPosition.x + offscreenBuffer < root.width()))) { //right
                    TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                        tobj.current_artwork = doq.Identifier;
                        tobj.assoc_media = mdoq.Identifier; //the associated media that was clicked
                        tobj.assoc_media_interactions = "pan"; //TODO what is this
                        tobj.offscreen = "true";
                    });
                    hideMediaObject();
                    pauseResetMediaObject();
                    //for debugging (trying to figure out if we can turn off inertia after the media leaves the screen)
                    //if (IS_WINDOWS) {
                    //res.grEvent.target.isInertial = false;
                    //res.grEvent.target.velocities.linear.x = 0;
                    //res.grEvent.target.velocities.linear.y = 0;
                    //res.grEvent.stop();
                    //}
                    return;
                    IS_WINDOWS && (outerContainer.manipulationOffset = null);
                }
            }
        }

        function mediaScrollWin(res, pivot) {
            mediaManip({
                scale: res,
                translation: {
                    x: 0,
                    y: 0
                },
                pivot: {
                    x: pivot.x + root.offset().left,// + (outerContainer.offset().left - root.offset().left),
                    y: pivot.y + root.offset().top// + (outerContainer.offset().top - root.offset().top)
                }
            });
        }

        /**
         * I/P {Object} res     object containing hammer event info
         * Drag/manipulation handler for associated media
         * Manipulation for touch and drag events
         */
        function mediaManip(res, evt, fromSeadragonControls) {
            if (isNobelWill === true) {
                $("#annotatedImageAssetCanvas").css("z-index", '888888899');
            }

            res && res.grEvent && (res.grEvent.target.autoProcessInertia = false);

            if (descscroll === true) {
                return;
            }

            if (res.scale !== 1) {
                mediaScroll(res.scale, res.pivot);
                return;
            }
            var top = outerContainer.position().top,
                left = outerContainer.position().left,
                width = outerContainer.width(),
                height = outerContainer.height(),
                finalPosition;

            // Target location (where object should be moved to)
            if (fromSeadragonControls) {
                finalPosition = {
                    x: left + res.translation.x,
                    y: top + res.translation.y
                }
            } else if (IS_WINDOWS) {
                if (!outerContainer.manipulationOffset) return;
                finalPosition = {
                    x: left + res.pivot.x + root.offset().left - outerContainer.manipulationOffset.x,
                    y: top + res.pivot.y + root.offset().top - outerContainer.manipulationOffset.y
                }
            } else {
                // finalPosition = {
                //     x: left + res.pivot.x  - outerContainer.manipulationOffset.x,
                //     y: top + res.pivot.y  - outerContainer.manipulationOffset.y
                // } 
                //  
                finalPosition = {
                    x: (res.center.pageX - res.startEvent.center.pageX) + outerContainer.startLocation.x,
                    y: (res.center.pageY - res.startEvent.center.pageY) + outerContainer.startLocation.y
                };
            }

            // Animate to target location (or don't, if you're on the win8 app)
            outerContainer.stop()
            if (IS_WINDOWS) {
                outerContainer.css({
                    top: finalPosition.y,
                    left: finalPosition.x
                });
                checkForOffscreen();
            }
            else {
                outerContainer.animate({
                    top: finalPosition.y,
                    left: finalPosition.x
                }, 300, function () {
                    checkForOffscreen();
                });
            }

            /**
             * @method checkForOffscreen()
             * check whether or not asset is still on screen
             * If object is not on screen, reset and hide it
             */
            function checkForOffscreen() {
                var offscreenBuffer = (!IS_WINDOWS ? root.width() / 8 : 0);
                if (!(
                    (0 < finalPosition.y + height - offscreenBuffer) //top
                    && (finalPosition.y + offscreenBuffer < root.height()) //bottom
                    && (0 < finalPosition.x + width - offscreenBuffer) //left
                    && (finalPosition.x + offscreenBuffer < root.width()))) { //right
                    TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                        tobj.current_artwork = doq.Identifier;
                        tobj.assoc_media = mdoq.Identifier; //the associated media that was clicked
                        tobj.assoc_media_interactions = "pan"; //TODO what is this
                        tobj.offscreen = "true";
                    });
                    hideMediaObject();
                    pauseResetMediaObject();
                    //for debugging (trying to figure out if we can turn off inertia after the media leaves the screen)
                    //if (IS_WINDOWS) {
                    //res.grEvent.target.isInertial = false;
                    //res.grEvent.target.velocities.linear.x = 0;
                    //res.grEvent.target.velocities.linear.y = 0;
                    //res.grEvent.stop();
                    //}
                    return;
                    IS_WINDOWS && (outerContainer.manipulationOffset = null);
                }
            }
        }

        /**
         * I/P {Number} scale     scale factor
         * I/P {Object} pivot     point of contact (with regards to image container, NOT window)
         * Zoom handler for associated media (e.g., for mousewheel scrolling)
         */
        function mediaScroll(scale, pivot) {
            if (descscroll === true) {
                return;
            } else if (CONTENT_TYPE === 'Audio') {
                // disallowing resizing of audio - doesn't make sense anyway
                return;
            }
            var t = outerContainer.position().top,
            l = outerContainer.position().left,
            w = outerContainer.width(),
            h = outerContainer.height(),
            newW = w * scale,
            newH,
            maxW,
            minW,
            newX,
            newY;
            scrollingMedia = true;
            if (CONTENT_TYPE === 'Video') {
                minW = 450;
                maxW = 800;
            } else {
                minW = 250;
                maxW = 800;
            }
            if (CONTENT_TYPE === "iframe") {
                minW = parseInt(rootWidth * 0.33);
                maxW = parseInt(rootWidth * 0.75);
            }

            // Constrain new width
            if ((newW < minW) || (newW > maxW)) {
                newW = Math.min(maxW, Math.max(minW, newW));
            };

            // Update scale, new X and new Y according to newly constrained values.
            scale = newW / w;
            newH = h * scale;
            newX = l + pivot.x * (1 - scale);
            newY = t + pivot.y * (1 - scale);

            //Animate outerContainer to this new position
            outerContainer.stop()
            outerContainer.css({
                top: newY,
                left: newX,
                width: newW,
                height: newH
            });

            outerContainer.find('.annotatedImageMediaTitle').css({
                'width': (newW - 65) + 'px'
            });

            if (CONTENT_TYPE === 'Video') {
                outerContainer.find('.mediaSliderContainer').css({
                    'width': (newW - 200) + 'px'
                });
            }
            setTimeout(function () {
                scrollingMedia = false;
            }, 100);
        }

        /**
         * Create a closeButton for associated media
         * @method createCloseButton
         * @return {HTML element} the button as a 'div'
         */
        function createCloseButton() {
            var closeButton = $(document.createElement('img'));
            closeButton.attr('src', tagPath + 'images/icons/x.svg');
            closeButton.text('X');
            var cssHeight = IS_WINDOWS ? '30px' : '15px';
            closeButton.css({
                'position': 'absolute',
                'width': cssHeight,
                'height': cssHeight,
                'min-width': '30px',
                'z-index': '1',
                'right': '1.5%',
                'margin-top': '7px'
            });
            return closeButton;
        }

        /**
         * Show the associated media on the seadragon canvas. If the media is not
         * a hotspot, show it in a slightly random position.
         * @method showMediaObject
         */
        function showMediaObject(isHotspotIcon, hideOuterContainer) {
            var t,
                l,
                h = outerContainer.height(),
                w = outerContainer.width(),
                splitscreenOffset = 0;
            outerContainer && outerContainer.detach();

            // temporary crashfix for errors where viewport isn't properly initialized
            // need to root-cause this issue ASAP
            if (!viewer.viewport) {
                doNothing("[DIAGNOSTIC] viewer or viewer.viewport is null in showMediaObject() call for " + (TITLE ? TITLE : "untitled") + "asset");
                return;
            }

            if (IS_XFADE) {
                //doNothing(appending);
                //assetCanvas.append(outerContainer);
                outerContainer.show();
                root.find('.xfadeImg').css("opacity", root.find('#xfadeSliderPoint').width() / root.find('#xfadeSlider').width());
                viewer.viewport.fitBounds(rect, false);
                viewer.viewport.applyConstraints()
            } else {
                //If associated media object is a hotspot, then position it next to circle.  Otherwise, put it in a slightly random position near the middle
                if (IS_HOTSPOT && isNobelWill !== true) {
                    if (!isHotspotIcon) {
                        circle.css('visibility', 'visible');                       
                        addOverlay(circle[0], position, OpenSeadragon.OverlayPlacement.CENTER);
                    }
                    //don't pan to position 
                    if (!isImpactMap) {
                        viewer.viewport.panTo(position, false);
                    }
                    viewer.viewport.applyConstraints()
                    t = viewer.viewport.pixelFromPoint(position).y - h / 2 + circleRadius / 2;
                    l = viewer.viewport.pixelFromPoint(position).x + circleRadius;
                }
                else {
                    (root.data('split') === 'R') && (splitscreenOffset = -root.find('#sideBar').width());
                    (root.data('split') === 'L') && (splitscreenOffset = root.find('#sideBar').width());
                    t = root.height() * 1 / 10 + Math.random() * root.height() * 2 / 10;
                    l = (root.width() + splitscreenOffset) / 3 + (.5 - Math.random()) * root.width() / 8;
                };
                outerContainer.css({
                    'top': t + "px",
                    'left': l + "px",
                    'position': "absolute",
                    'z-index': 1000,
                    'pointer-events': 'all'
                });

                assetCanvas.append(outerContainer);

                outerContainer.show();

                //viewer.viewport.fitBounds(new OpenSeadragon.Rect(.1,.1,.2,.5),true)
                if (isNobelWill === true) {
                    var cs = window.getComputedStyle(outerContainer[0]);
                    var x = cs.getPropertyValue('left') + cs.getPropertyValue('width') / 2;
                    var y = cs.getPropertyValue('top') + cs.getPropertyValue('height') / 2;
                    if (IS_WINDOWS) {
                        mediaScrollWin(.1, { x: x, y: y })
                    }
                    else {
                        mediaScroll(.1, { x: x, y: y })
                    }
                    $("#annotatedImageAssetCanvas").css("z-index", '50');
                    var loc = getNobelAssociatedMediaLocation(outerContainer[0].innerText);
                    outerContainer.css({
                        'top': loc.y + 'px',
                        'left': loc.x + 'px'
                    })
                }
            }
            mediaHidden = false;
            TAG.Telemetry.recordEvent("AssociatedMedia", function (tobj) {
                tobj.current_artwork = doq.Identifier;
                tobj.assoc_media = mdoq.Identifier; //the associated media that was clicked
                tobj.assoc_media_interactions = "open"; //TODO what is this
            });

            if (hotspotMediaHidden) {
                hotspotMediaHidden = false;
            }

            var toHideID = '#thumbnailButton-' + mdoq.Identifier;
            if (outerContainer.parents('#metascreen-R').length) {
                toHideID += 'R';
            }

            if (!thumbnailButton) {
                thumbnailButton = $(toHideID);
            }

            thumbnailButton.css({
                'color': 'black',
                'background-color': 'rgba(255,255,255, 0.3)'
            });

            /**
            if (hideOuterContainer) {
                toggleMediaObject(true);
            }
            **/

            // TODO is this necessary? 
            // dz17: this WAS necessary due to scaling. Please ask before disabling anything to do with resizing
            // if ((info.contentType === 'Video') || (info.contentType === 'Audio')) {
            //     resizeControlElements();
            // }

        }

        /**
         * Hide the associated media
         * @method hideMediaObject
         */
        function hideMediaObject(isHotspotIcon) {
            //TAG.Util.removeYoutubeVideo();
            outerContainer.stop();

            var toHideID = '#thumbnailButton-' + mdoq.Identifier;
            if (outerContainer.parents('#metascreen-R').length) {
                toHideID += 'R';
            }
            if (!thumbnailButton) {
                thumbnailButton = $(toHideID);
            }

            if (!isHotspotIcon) {
                thumbnailButton.css({
                    'color': 'white',
                    'background-color': ''
                });
                mediaHidden = true;
            } else {
                hotspotMediaHidden = true;
            }
            TAG.Util.IdleTimer.restartTimer();
            dzManipPreprocessing();                     //When an object is hidden, set the artwork as active

            // removed below because xfades are gone for 2.1
            if (IS_XFADE) { // slightly repeated code, but emphasizes that this is all we need to do for xfades
                outerContainer.hide();
            } else {
                pauseResetMediaObject();
                if (!isHotspotIcon) {
                    IS_HOTSPOT && isNobelWill !== true && removeOverlay(circle[0]);
                    outerContainer.remove();
                    outerContainer = $(document.createElement('div'));
                } else {
                    outerContainer.hide();
                }
            }
        }

        /* SAM custom build */
        function showHotspot() {
            createMediaElements();
            showMediaObject();
            hideMediaObject();
        }

        /**
         * Show if hidden, hide if shown
         * @method toggleMediaObject
         */
        function toggleMediaObject(isHotspotIcon, hideOuterContainer) {
            if (hotspotMediaHidden) {
                showMediaObject(isHotspotIcon, hideOuterContainer);
            } else {
                mediaHidden ? showMediaObject(isHotspotIcon) : hideMediaObject(isHotspotIcon);
            }

            outerContainerhidden = mediaHidden;
        }

        /**
         * Returns whether the media object is visible
         * @method isVisible
         * @return {Boolean}
         */
        function isVisible() {
            return !mediaHidden;
        }

        function toggleHotspot() {
            if (outerContainerhidden) {
                outerContainer.show();
                outerContainerhidden = false;
            } else {
                outerContainer.hide();
                outerContainerhidden = true;
            }
        }
        /**
         * Pauses and resets (to time 0) the media if the content type is video or audio
         * @pauseResetMediaObject
         */
        function pauseResetMediaObject() {
            if (!mediaElt || mediaElt.readyState < 4) { // see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
                return;
            }
            mediaElt.currentTime = 0;
            mediaElt.pause();
            play.attr('src', tagPath + 'images/icons/PlayWhite.svg');
        }


        return {
            doq: mdoq,
            linq: linq,
            show: showMediaObject,
            hide: hideMediaObject,
            create: createMediaElements,
            pauseReset: pauseResetMediaObject,
            toggle: toggleMediaObject,
            showHotspot: showHotspot,
            createMediaElements: createMediaElements,
            isVisible: isVisible,
            mediaManipPreprocessing: mediaManipPreprocessing
        };
    }
};

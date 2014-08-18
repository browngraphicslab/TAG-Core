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

        // misc uninitialized variables
        viewerelt,
        viewer,
        assetCanvas,
        makeManip;

    if (IS_WINDOWS) {
        makeManip = TAG.Util.makeManipulatableWin;
    } else {
        makeManip = TAG.Util.makeManipulatable;
    }

    // get things rolling
    init();

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
        if(!viewer || !doq || !doq.Metadata || !doq.Metadata.DeepZoom) {
            //debugger;
            console.log("ERROR IN openDZI");
            return false;
        }
        viewer.openDzi(FIX_PATH(doq.Metadata.DeepZoom));
        return true;
    }

    /**
     * Wrapper around Seadragon.Drawer.updateOverlay; moves an HTML element "overlay."
     * Used mostly in conjunction with hotspot circles (this function is currently
     * only called from ArtworkEditor.js)
     * @method updateOverlay
     * @param {HTML element} element                   the overlay element to move
     * @param {Seadragon.OverlayPlacement} placement   the new placement of the overlay
     */
    function updateOverlay(element, placement) {
        var $elt = $(element),
            top  = parseFloat($elt.css('top')),
            left = parseFloat($elt.css('left'));
        if (top && left) { // TODO is this check necessary?
            viewer.drawer.updateOverlay(element, viewer.viewport.pointFromPixel(new Seadragon.Point(left, top)), placement);
        }
    }

    /**
     * Wrapper around Seadragon.Drawer.addOverlay; adds an HTML overlay to the seadragon
     * canvas. Currently only used in ArtworkEditor.js.
     * @method addOverlay
     * @param {HTML element} element                   the overlay element to add
     * @param {Seadragon.Point} point                  the point at which to add the overlay
     * @param {Seadragon.OverlayPlacement} placement   the placement at the given point
     */
    function addOverlay(element, point, placement) {
        if (!viewer.isOpen()) {
            viewer.addEventListener('open', function () {
                viewer.drawer.addOverlay(element, point, placement);
                viewer.drawer.updateOverlay(element, point, placement);
            });
        } else {
            viewer.drawer.addOverlay(element, point, placement);
            viewer.drawer.updateOverlay(element, point, placement);
        }
    }

    /**
     * Wrapper around Seadragon.Drawer.removeOverlay. Removes an HTML overlay from the seadragon
     * canvas.
     * @method removeOverlay
     * @param {HTML element}       the ovlerlay element to remove
     */
    function removeOverlay(element) {
        if (!viewer.isOpen()) {
            viewer.addEventListener('open', function () {
                viewer.drawer.removeOverlay(element);
            });
        } else {
            viewer.drawer.removeOverlay(element);
        }
    };

    /**
     * Unloads the seadragon viewer
     * @method unload
     */
    function unload() {
        viewer && viewer.unload();
    }

    /**
     * When the artwork is active, sets the manipulation method and dimensions for the active container
     * @method dzManipPreprocessing
     */
    function dzManipPreprocessing() {
        outerContainerPivot = {
            x: root.width()/ 2,//+ root.offset().left,
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
        var scale = res.scale,
            trans = res.translation,
            pivot = res.pivot;

        dzManipPreprocessing();

        if (!artworkFrozen) {
            viewer.viewport.zoomBy(scale, viewer.viewport.pointFromPixel(new Seadragon.Point(pivot.x, pivot.y)), false);
            viewer.viewport.panBy(viewer.viewport.deltaPointsFromPixels(new Seadragon.Point(trans.x, trans.y)), false);
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
        dzManip({
            scale: scale,
            translation: {
                x: 0,
                y: 0
            },
            pivot: {
                x: pivot.x + root.offset().left,
                y: pivot.y + root.offset().top
            }
        });
    }

    /**
    * Reset the deepzoom image (center, zoom out) if an element is not currently visible in the viewport.
    * Used in rich location history.
    * @method panToPoint
    */
    function panToPoint(element) {
        viewer.viewport && function () {
            var ycoord = parseFloat($(element).css('top')) + parseFloat($(element).css('height'));
            var xcoord = parseFloat($(element).css('left')) + 0.5 * parseFloat($(element).css('width'));
            var point = viewer.viewport.pointFromPixel(new Seadragon.Point(xcoord, ycoord));
            var bounds = viewer.viewport.getBounds();
            //if the point is not visible in the current bounds
            if (!((point.x < bounds.getBottomRight().x && point.x > bounds.getTopLeft().x)
                && (point.y < bounds.getBottomRight().y && point.y > bounds.getTopLeft().y))) {
                viewer.viewport.panTo(viewer.viewport.getHomeCenter());
                viewer.viewport.zoomTo(.8 * viewer.viewport.getHomeZoom());
            }
        }();
    };

    /**
    * Sets up the annotated image to allow zoom on double click.  Used in RLH
    * @method initZoom
    */
    function initZoom() {
        viewerelt && function () {
            viewerelt.on('dblclick', function () {
                zoomToPoint();
            });
        }();
        console.log('error in initzoom');
    }

    /**
    * Zooms into the deepzoom image.  Used when double-clicking on a map in rlh.
    * @method zoomToPoint()
    */
    function zoomToPoint() { //TODO zoom to where the mouse is
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

        var topY = pointFromPixel(new Seadragon.Point(1, top - 10)).y,
            bottomY = pointFromPixel(new Seadragon.Point(1, top + height + 10)).y,
            leftX = pointFromPixel(new Seadragon.Point(left - 10, 1)).x,
            rightX = pointFromPixel(new Seadragon.Point(left + width + 10, 1)).x;

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
        if ((point.x < 1.05 && point.x > -0.05) && (point.y > -0.05 && point.y < (1/aspectRatio) + .05)) {
            val = true;
        }
        //console.log(point.x + ', ' + point.y);
        //console.log((1 / aspectRatio) + .05);
        //console.log('inBounds= ' + val);
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
            return viewer.viewport.pixelFromPoint(new Seadragon.Point(0, 0));
        }
        if (point.y <= 0 && point.x >= 1) { //TOP RIGHT
            return viewer.viewport.pixelFromPoint(new Seadragon.Point(1, 0));
        }
        if (point.x <= 0 && point.y >= (1 / aspectRatio) + 0) { //BOTTOM LEFT
            return viewer.viewport.pixelFromPoint(new Seadragon.Point(0, (1 / aspectRatio)));
        }
        if (point.x >= 1 && point.y >= (1 / aspectRatio) + 0) { //BOTTOM RIGHT
            return viewer.viewport.pixelFromPoint(new Seadragon.Point(1, (1 / aspectRatio)));
        }
        if (point.x <= -0.05) { //LEFT
            return viewer.viewport.pixelFromPoint(new Seadragon.Point(0, point.y));
        }
        if (point.x >= 1.05) { //RIGHT
            return viewer.viewport.pixelFromPoint(new Seadragon.Point(1, point.y));
        }
        if (point.y <= -0.05) { //TOP
            return viewer.viewport.pixelFromPoint(new Seadragon.Point(point.x, 0));
        }
        if (point.y >= (1 / aspectRatio) + .05) { //BOTTOM
            return viewer.viewport.pixelFromPoint(new Seadragon.Point(point.x, (1 / aspectRatio)));
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
            point = viewer.viewport.pointFromPixel(new Seadragon.Point(xcoord, ycoord));
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

        return viewer.viewport.pointFromPixel(new Seadragon.Point(l, t));
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
        return new Seadragon.Point(centerPoint.x + .01 * (bounds.getBottomRight().x - bounds.getTopLeft().x),
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
     * Initialize seadragon, set up handlers for the deepzoom image, load assoc media if necessary
     * @method init
     */
    function init() {
        var canvas;

        if(Seadragon.Config) {
            Seadragon.Config.visibilityRatio = 0.8; // TODO see why Seadragon.Config isn't defined; should it be?
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
                },
                onManipulate: function (res) {
                    if (doManipulation) {
                        res.translation.x = -res.translation.x;        //Flip signs for dragging
                        res.translation.y = -res.translation.y;
                        dzManip(res);
                    }
                }
            }, null); // NO ACCELERATION FOR NOW
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

    /**
     * Adds an animation handler to the annotated image. This is used to allow the image to move
     * when the minimap is manipulated.
     * @method addAnimationHandler
     * @param {Function} handler      the handler to add
     */
    function addAnimateHandler(handler) {
        viewer.addEventListener("animation", handler);
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
            IS_XFADE = linq.Metadata.Type ? (linq.Metadata.Type === "Layer") : false,
            X = parseFloat(linq.Offset._x),
            Y = parseFloat(linq.Offset._y),
            TITLE = TAG.Util.htmlEntityDecode(mdoq.Name),
            CONTENT_TYPE = mdoq.Metadata.ContentType,
            SOURCE = mdoq.Metadata.Source,
            DESCRIPTION = TAG.Util.htmlEntityDecode(mdoq.Metadata.Description),
            THUMBNAIL = mdoq.Metadata.Thumbnail,
            RELATED_ARTWORK = false,

            // misc initialized variables
            mediaHidden = true,
            outerContainerhidden = true,
            currentlySeeking = false,
            movementTimeouts = [],
            circleRadius = 60,

            // misc uninitialized variables
            circle,
            position,
            mediaLoaded,
            mediaElt,
            titleDiv,
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
                console.log("initing");
                outerContainer.css({
                    'border': '1px solid rgba(255,255,255,0.4)',
                    'background': 'rgba(0,0,0,0)',
                    'width' : parseFloat(linq.Dimensions._x || 50),
                    'height' : parseFloat(linq.Dimensions._y || 50),
                    'position': 'absolute'
                });
                assetCanvas.append(outerContainer);
                outerContainer.hide();
            } else {
                // set up divs for the associated media
                outerContainer.css('width', '29%');
                innerContainer.css('backgroundColor', 'rgba(0,0,0,0.65)');

                if (TITLE) {
                    titleDiv = $(document.createElement('div'));
                    titleDiv.addClass('annotatedImageMediaTitle');//.css({'text-overflow':'ellipsis','white-space':'nowrap'});
                    titleDiv.text(TITLE);

                    innerContainer.append(titleDiv);
                }

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
                    circle = $(document.createElement("img"));
                    position = new Seadragon.Point(X, Y);
                    circle.attr('src', tagPath + 'images/icons/hotspot_circle.svg');
                    circle.addClass('annotatedImageHotspotCircle');
                    circle.click(function () {
                        toggleHotspot();
                    });
                    root.append(circle);
                }

                // allows asset to be dragged, despite the name
                TAG.Util.disableDrag(outerContainer);

                // register handlers
                if (IS_WINDOWS) {
                    TAG.Util.makeManipulatableWin(outerContainer[0], {
                        onManipulate: mediaManipWin,
                        onScroll: mediaScrollWin
                    });
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
                controlPanel = $(document.createElement('div')).addClass('annotatedImageMediaControlPanel'),
                vol = $(document.createElement('img')).addClass('mediaVolButton'),
                timeContainer = $(document.createElement('div')).addClass('mediaTimeContainer'),
                currentTimeDisplay = $(document.createElement('span')).addClass('mediaTimeDisplay'),
                playHolder = $(document.createElement('div')).addClass('mediaPlayHolder'),
                volHolder = $(document.createElement('div')).addClass('mediaVolHolder'),
                sliderContainer = $(document.createElement('div')).addClass('mediaSliderContainer'),
                sliderPoint = $(document.createElement('div')).addClass('mediaSliderPoint');

            controlPanel.attr('id', 'media-control-panel-' + mdoq.Identifier);

            play = $(document.createElement('img')).addClass('mediaPlayButton');

            play.attr('src', tagPath + 'images/icons/PlayWhite.svg');
            vol.attr('src', tagPath+'images/icons/VolumeUpWhite.svg');
            currentTimeDisplay.text("00:00");

            // TODO move this css to styl file
            play.css({
                'position': 'absolute',
                'height':   '100%',
                'width':    '100%',
                'display':  'inline-block',
            });

            playHolder.css({
                'position': 'absolute',
                'height': '45%',
                'width': '10%',
                'min-height': '20px',
                'top':    '0%',
                'display':  'inline-block',
                'margin':   '2px 1% 0px 1%',
            });

            sliderContainer.css({
                'position': 'absolute',
                'height': '20%',
                'min-height' :'10px',
                'width':    '100%',
                'left':     '0px',
                'bottom':   '0px'
            });

            sliderPoint.css({
                'position': 'absolute',
                'height':   '100%',
                'background-color': '#3cf',
                'width':    '0%',
                'left':     '0%'
            });

            vol.css({
                'height':   '100%',
                'width':    '100%',
                'position': 'absolute',
                'display':  'inline-block',
            });

            volHolder.css({
                'height': '45%',
                'min-height' : '20px',
                'position': 'absolute',
                'width': '8%',
                'right':    '2%',
                'top':      '10%'
            });

            timeContainer.css({
                'height': '45%',
                'top': '0%',
                'width' : '15%',
                'right':  volHolder.width() + 10 + 'px',
                'position': 'absolute',
                'vertical-align': 'top',
                'padding':  '0',
                'display':  'inline-block',
            });

            currentTimeDisplay.css({
                'height': '100%',
                'top': '0%',
                'position': 'absolute',
                'font-size': '70%'
            });

            playHolder.append(play);
            sliderContainer.append(sliderPoint);
            volHolder.append(vol);
            
            // set up handlers
            play.on('click', function () {
                if (elt.paused) {
                    elt.play();
                    play.attr('src', tagPath + 'images/icons/PauseWhite.svg');
                } else {
                    elt.pause();
                    play.attr('src', tagPath + 'images/icons/PlayWhite.svg');
                }
            });

            vol.on('click', function () {
                if (elt.muted) {
                    elt.muted = false;
                    vol.attr('src', tagPath + 'images/icons/VolumeUpWhite.svg');
                } else {
                    elt.muted = true;
                    vol.attr('src', tagPath + 'images/icons/VolumeDownWhite.svg');
                }
            });

            $elt.on('ended', function () {
                elt.pause();
                play.attr('src', tagPath + 'images/icons/PlayWhite.svg');
            });

            sliderContainer.on('mousedown', function(evt) {
                var time = elt.duration * ((evt.pageX - $(evt.target).offset().left) / sliderContainer.width()),
                    origPoint = evt.pageX,
                    timePxRatio = elt.duration / sliderContainer.width(),
                    currTime = Math.max(0, Math.min(elt.duration, elt.currentTime)),
                    origTime = time,
                    currPx   = currTime / timePxRatio,
                    minutes = Math.floor(currTime / 60),
                    seconds = Math.floor(currTime % 60),
                    adjMin = (minutes < 10) ? '0'+minutes : minutes,
                    adjSec = (seconds < 10) ? '0'+seconds : seconds;

                evt.stopPropagation();

                if(!isNaN(time)) {
                    currentTimeDisplay.text(adjMin + ":" + adjSec);
                    elt.currentTime = time;
                    sliderPoint.css('width', 100*(currPx / sliderContainer.width()) + '%');
                }

                sliderContainer.on('mousemove.seek', function(e) {
                    var currPoint = e.pageX,
                        timeDiff = (currPoint - origPoint) * timePxRatio;

                    currTime = Math.max(0, Math.min(elt.duration, origTime + timeDiff));
                    currPx   = currTime / timePxRatio;
                    minutes  = Math.floor(currTime / 60);
                    seconds  = Math.floor(currTime % 60);
                    adjMin   = (minutes < 10) ? '0'+minutes : minutes;
                    adjSec   = (seconds < 10) ? '0'+seconds : seconds;

                    if(!isNaN(currTime)) {
                        currentTimeDisplay.text(adjMin + ":" + adjSec);
                        elt.currentTime = currTime;
                        sliderPoint.css('width', 100*(currPx / sliderContainer.width()) + '%');
                    }
                });

                $('body').on('mouseup.seek mouseleave.seek', function() {
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

                if(!isNaN(elt.currentTime)) {
                    currentTimeDisplay.text(adjMin + ":" + adjSec);
                    sliderPoint.css('width', 100*(currPx / sliderContainer.width()) + '%');
                }
            });

            mediaContainer.append(elt);
            mediaContainer.append(controlPanel);

            controlPanel.append(playHolder);
            controlPanel.append(sliderContainer);
            timeContainer.append(currentTimeDisplay);
            controlPanel.append(timeContainer);
            controlPanel.append(volHolder);
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
                closeButton,
                x,
                y,
                w,
                h,
                rect;

            if(!mediaLoaded) {
                mediaLoaded = true;
            } else {
                return;
            }

            if (IS_XFADE) {
                $mediaElt = $(document.createElement('img')).addClass('xfadeImg');
                $mediaElt.attr({
                    src: FIX_PATH(SOURCE)
                });
                $mediaElt.css({
                    height: '100%',
                    opacity: 0.5,
                    position: 'absolute',
                    width: '100%'
                });
                outerContainer.append($mediaElt);

                x = parseFloat(linq.Offset._x || 0);
                y = parseFloat(linq.Offset._y || 0);
                w = parseFloat(linq.Dimensions._x || 50);
                h = parseFloat(linq.Dimensions._y || 50);

                rect = new Seadragon.Rect(x, y, w, h);

                viewer.drawer.addOverlay(outerContainer[0], rect);
            } else {
                closeButton = createCloseButton();
                mediaContainer.append(closeButton[0]);
                closeButton.on('click', function (evt) {
                        evt.stopPropagation();
                        hideMediaObject();
                });

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

                    outerContainer.css('min-width', 0.29*rootWidth);

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
                        console.log("Here's an error ");
                    });
                    outerContainer.css({
                        'min-width': 0.29*rootWidth,
                        'height' : 'auto'
                    });
                } else if (CONTENT_TYPE === 'iframe') {
                    outerContainer.css({
                        'width':'30%',
                    });
                    if (descDiv){
                        outerContainer.css('height', outerContainer.width()*1.15);
                    }else{
                        outerContainer.css('height',outerContainer.width()*0.89);
                    }
                    innerContainer.css({
                        'height':'100%'
                    });
                    var mediaHeight;
                    DESCRIPTION ? mediaHeight = '85%' : mediaHeight ='100%';
                    mediaContainer.css({
                        'height': mediaHeight
                    });
                    iframe = $(document.createElement('iframe'));
                    iframe.attr({
                        src: SOURCE,
                        frameborder: '0'
                    });
                    iframe.css({
                        width: '100%',
                        height: '100%'
                    });
                    mediaContainer.append(iframe);
                }
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
                x: w / 2 - (outerContainer.offset().left - root.offset().left),
                y: h / 2 - (outerContainer.offset().top - root.offset().top)
            };
            toManip = mediaManip;
            $('.mediaOuterContainer').css('z-index', 1000);
            outerContainer.css('z-index', 1001);
            TAG.Util.IdleTimer.restartTimer();
        }

        //When the associated media is clicked, set it to active(see mediaManipPreprocessing() above )
        outerContainer.on('click', function (event) {
            event.stopPropagation();            //Prevent the click going through to the main container
            event.preventDefault();
            TAG.Util.IdleTimer.restartTimer();
            mediaManipPreprocessing();
        });

     
        /**
         * Drag/manipulation handler for associated media
         * @method mediaManip
         * @param {Object} res     object containing hammer event info
         */
        function mediaManip(res) {

            if (currentlySeeking || !res) {
                return;
            }
            
            var scale = res.scale,
                trans = res.translation,
                pivot = res.pivot,
                t     = parseFloat(outerContainer.css('top')),
                l     = parseFloat(outerContainer.css('left')),
                w     = outerContainer.width(),
                h     = outerContainer.height(),
                timestepConstant = 50,
                newW = w * scale,
                isWinFactor = IS_WINDOWS ? 1 : 0,
                maxW,
                minW,
                timer,
                initialPosition,
                deltaPosition,
                finalPosition,
                currentTime,
                initialVelocity;

            // If event is initial touch on artwork, save current position of media object to use in movement method
            if (res.eventType === 'start') {
                startLocation = {
                    x: l,
                    y: t
                };
            } else if (!startLocation) {
                startLocation = {
                    x: l,
                    y: t
                };
            }

            // these values are somewhat arbitrary; TODO determine good values
            if (CONTENT_TYPE === 'Image') {
                maxW = 2500;
                minW = 200;
            } else if (CONTENT_TYPE === 'Video') {
                maxW = rootWidth*0.75;
                minW = parseFloat(outerContainer.css('min-width'));
            } else if (CONTENT_TYPE === 'Audio') {
                maxW = 800;
                minW = parseFloat(outerContainer.css('min-width'));
            } else if(CONTENT_TYPE === 'iframe'){
                minW = rootWidth*0.33;
                maxW = rootWidth*0.75;
            }

            //constrain new width
            if (newW < minW){
                newW = minW;
                scale = newW/w;
            }
            else if (newW > maxW){
                newW = maxW;
                scale = newW/w;
            }

           //Manipulation for touch and drag events
            if (newW === w){ //If media object is being dragged (not resized)
                if ((0 < t + h) && (t < rootHeight) && (0 < l + w) && (l< rootWidth)) { // and is still on screen
                    
                    currentTime = Date.now();

                    //Position of object on manipulation
                    if (res.eventType) { //If initial values were set with a mouseDown or touch event
                        initialPosition = {
                            x: l, 
                            y: t
                        };
                    } else { //If initial values were set with seadragon controls or key touches
                        initialPosition = {
                            x: outerContainer.position().left,
                            y: outerContainer.position().top
                        };
                    }

                    //Where object should be moved to
                    if (res.center) { //As above, if movement is caused by mouse or touch event (hammer):
                        finalPosition = {
                            x: res.center.pageX - (res.startEvent.center.pageX - startLocation.x),
                            y: res.center.pageY - (res.startEvent.center.pageY - startLocation.y)
                        };
                    } else { //Or if it was set with seadragon controls or key touches:
                        finalPosition = {
                            x: initialPosition.x + res.translation.x,
                            y: initialPosition.y + res.translation.y,                            
                        };
                    }

                    //Total distance to travel
                    deltaPosition = {
                        x: finalPosition.x - initialPosition.x,
                        y: finalPosition.y - initialPosition.y
                    },

                    //Initial velocity is proportional to distance traveled
                    initialVelocity = {
                        x: deltaPosition.x/timestepConstant,
                        y: deltaPosition.y/timestepConstant
                    };
                    
                    //Recursive function to move object between start location and final location with proper physics
                    move(initialVelocity, initialPosition, finalPosition, timestepConstant/50);
                    viewer.viewport.applyConstraints();
                    mediaManipPreprocessing(); //updateDimensions, etc

                } else { //If object isn't within bounds, hide and reset it.
                    hideMediaObject();
                    pauseResetMediaObject();
                    mediaManipPreprocessing(); //updateDimensions, etc
                    return;
                }
            } else{ // zoom from touch point: change width and height of outerContainer
                if (minW != newW){
                outerContainer.css('left', l- (newW - w)/2);
                outerContainer.css("width", newW + "px");
                if (CONTENT_TYPE === 'Audio'){
                    outerContainer.css('height','auto');
                } else {
                var newH = (newW*h)/w;
                outerContainer.css('height',newH + 'px');
                }
                outerContainer.css('top', t - (outerContainer.height() - h)/2);
                mediaManipPreprocessing(); //Update dimensions since they've changed, and keep this media as active (if say an inactive media was dragged/pinch-zoomed)
                }
            }
        }


        /**
         * Recursive helper function for mediaManip.
         * Moves object between start location and final location with proper physics.
         * @method move
         * @param {Object} res              object containing hammer event info
         * @param {Object} prevVelocity     velocity of object on release
         * @param {Object} prevLocation     location of object
         * @param {Object} finalPos         target location of object
         * @param {Object} delay            delay (for timer)
         */
        function move(prevVelocity, prevLocation, finalPos, delay){
            var currentPosition,
                newVelocity,
                top = parseFloat(outerContainer.css('top')),
                left = parseFloat(outerContainer.css('left')),
                timer;

            if (mediaHidden) {
                return;
            }

            //If object is not on screen, reset and hide it
            if (!(
                (0 < outerContainer.position().top+ outerContainer.height()) 
                && (outerContainer.position().top < rootHeight) 
                && (0 < outerContainer.position().left + outerContainer.width()) 
                && (outerContainer.position().left < rootWidth))) 
                {
                    hideMediaObject();
                    pauseResetMediaObject();
                    return;
            };

            //If velocity is almost 0, stop movement
            if ((Math.abs(prevVelocity.x) < .1) && (Math.abs(prevVelocity.y) < .1)) {
                return;
            };

            //Current position is previous position + movement from velocity * time
            currentPosition = { 
                x: left + delay*prevVelocity.x,
                y: top + delay*prevVelocity.y   
            };

            // New velocity is proportional to distance left to travel
            newVelocity = {
                x: (finalPos.x - currentPosition.x)/(delay*50),
                y: (finalPos.y - currentPosition.y)/(delay*50)
            };
            
            outerContainer.css({'left': currentPosition.x, 'top': currentPosition.y});

            //Clear all previously-set timers used for movement on this object
            for (var i = 0; i < movementTimeouts.length; i++) {
                clearTimeout(movementTimeouts[i]);
            }
            movementTimeouts = [];
            movementTimeouts.push( 
                setTimeout(function () {
                move(newVelocity, currentPosition, finalPos, delay);
                }, 1)
            );
        }

        /**
         * Zoom handler for associated media (e.g., for mousewheel scrolling)
         * @method mediaScroll
         * @param {Number} scale     scale factor
         * @param {Object} pivot     point of contact
         */
        function mediaScroll(scale, pivot) {
            mediaManip({
                scale: scale,
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

        function mediaManipWin(res) {
            var t     = parseFloat(outerContainer.css('top')),
                l     = parseFloat(outerContainer.css('left')),
                w     = outerContainer.width(),
                h     = outerContainer.height(),
                neww = w * res.scale;

                var minConstraint,maxConstraint;
                if (CONTENT_TYPE === 'Video' ||CONTENT_TYPE === 'Audio'||CONTENT_TYPE==="iframe") {
                    minConstraint = 450;
                    maxConstraint = 800;
                } else {
                    minConstraint = 200;
                    maxConstraint = 2500;
                }
                if (CONTENT_TYPE === "iframe") {
                    minConstraint = rootWidth * 0.33;
                    maxConstraint = rootWidth * 0.75;
                }
                //if the new width is in the right range, scale from the point of contact and translate properly; otherwise, just translate and clamp
                var newClone;
                if ((neww >= minConstraint) && (neww <= maxConstraint)) {
                    if (0 < t+h && t < rootHeight && 0 < l + w && l < rootWidth && res) {
                        outerContainer.css("top", (t + res.translation.y + (1.0 - res.scale) * (res.pivot.y)) + "px");
                        outerContainer.css("left", (l + res.translation.x + (1.0 - res.scale) * (res.pivot.x)) + "px");
                    }
                } else {
                    if (0 < t + h && t < rootHeight && 0 < l + w && l < rootWidth && res) {
                        outerContainer.css("top", (t + res.translation.y) + "px");
                        outerContainer.css("left", (l + res.translation.x) + "px");
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
                mediaManipPreprocessing();
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
         * Create a closeButton for associated media
         * @method createCloseButton
         * @return {HTML element} the button as a 'div'
         */
        function createCloseButton() {
            var closeButton = $(document.createElement('img'));
            closeButton.attr('src', tagPath + 'images/icons/x.svg');
            closeButton.text('X');
            closeButton.css({
                'position': 'absolute',
                'top': '2%',
                'width': '4%',
                'height': '4%',
                'min-height': '15px',
                'min-width': '15px',
                'z-index': '1',
                'background-color': '',
                'right': '2%'
            });
            return closeButton;
        }
         
        /**
         * Show the associated media on the seadragon canvas. If the media is not
         * a hotspot, show it in a slightly random position.
         * @method showMediaObject
         */
        function showMediaObject() {
            var t,
                l,
                h = outerContainer.height(),
                w = outerContainer.width();


            if (IS_XFADE) {
                //console.log(appending);
                //assetCanvas.append(outerContainer);
                outerContainer.show();
            } else {
                //If associated media object is a hotspot, then position it next to circle.  Otherwise, put it in a slightly random position near the middle
                if (IS_HOTSPOT) {
                    circle.css('visibility', 'visible');
                    addOverlay(circle[0], position, Seadragon.OverlayPlacement.TOP_LEFT);
                    viewer.viewport.panTo(position, false);
                    viewer.viewport.applyConstraints()
                    t = viewer.viewport.pixelFromPoint(position).y - h / 2 + circleRadius / 2;
                    l = viewer.viewport.pixelFromPoint(position).x + circleRadius;
                } else {
                    t = rootHeight * 1 / 10 + Math.random() * rootHeight * 2 / 10;
                    l = rootWidth * 3 / 10 + Math.random() * rootWidth * 2 / 10;
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
            }

            if (!thumbnailButton) {
                thumbnailButton = $('#thumbnailButton-' + mdoq.Identifier);
            }

            thumbnailButton.css({
                'color': 'black',
                'background-color': 'rgba(255,255,255, 0.3)'
            });

            // TODO is this necessary?
            // if ((info.contentType === 'Video') || (info.contentType === 'Audio')) {
            //     resizeControlElements();
            // }

            mediaHidden = false;
        }

        /**
         * Hide the associated media
         * @method hideMediaObject
         */
        function hideMediaObject() {
            if (IS_XFADE) { // slightly repeated code, but emphasizes that this is all we need to do for xfades
                outerContainer.hide();
            } else {
                pauseResetMediaObject();
                IS_HOTSPOT && removeOverlay(circle[0]);
                outerContainer.detach();
            }

            mediaHidden = true;

            if (!thumbnailButton) {
                thumbnailButton = $('#thumbnailButton-' + mdoq.Identifier);
            }

            thumbnailButton.css({
                'color': 'white',
                'background-color': ''
            });
            TAG.Util.IdleTimer.restartTimer();
            dzManipPreprocessing();                     //When an object is hidden, set the artwork as active

        }
        /**
         * Show if hidden, hide if shown
         * @method toggleMediaObject
         */
        function toggleMediaObject() {
            mediaHidden ? showMediaObject() : hideMediaObject();
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
            if(!mediaElt || mediaElt.readyState < 4) { // see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
                return;
            }
            mediaElt.currentTime = 0;
            mediaElt.pause();
            play.attr('src', tagPath + 'images/icons/PlayWhite.svg');
        }


        return {
            doq:                 mdoq,
            linq:                linq,
            show:                showMediaObject,
            hide:                hideMediaObject,
            create:              createMediaElements,
            pauseReset:          pauseResetMediaObject,
            toggle:              toggleMediaObject,
            createMediaElements: createMediaElements,
            isVisible:           isVisible,
            mediaManipPreprocessing: mediaManipPreprocessing
        };
    }
};

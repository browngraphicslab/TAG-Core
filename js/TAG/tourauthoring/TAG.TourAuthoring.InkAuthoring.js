TAG.Util.makeNamespace("TAG.TourAuthoring.InkAuthoring");

// enum defining ink modes
TAG.TourAuthoring.InkMode = {
    shapes: 0, //shape manipulation
    draw: 1,
    erase: 2,
    text: 5,
};

// enum defining
TAG.TourAuthoring.InkCallers = {
    inkes: 1,
    componentcontrols: 2
};

/**
 * Back-end for ink authoring and editing. Instances are created in ComponentControls and InkES. In
 * ComponentControls, we need the ability to author and edit inks. In InkES, we need them to follow
 * artworks.
 * Uses the RaphaelJS library for svg manipulation.
 * @class TAG.TourAuthoring.InkAuthoring
 * @constructor
 * @param {Object} options       input options
 *         {String} canvId        id of the destination ink canvas (defaults to "inkCanv")
 *         {Object} spec          spec passed in from ComponentControls
 */

TAG.TourAuthoring.InkAuthoring = function (options) {
    "use strict";

    // TODO clean up vars and get rid of any unnecessary ones
    var // input options
        canvId = options.canvId || "inkCanv",    // id of the ink canvas
        spec = options.spec,               // spec obj passed in from componentcontrols

        // DOM-related
        canvElt = $("#" + canvid),               // ink canvas elt
        viewerElt = $('#rinContainer'),          // container for player
        canvWidth = canvElt.width(),
        canvHeight = canvElt.height(),

        // constants
        TEXTBOX_ID = "textbox",
        SQRT2 = Math.sqrt(2),

        // misc initialized vars
        dataHolder = spec.dataHolder,               // data holder for getting selected track, etc
        paper = new Raphael(canvElt[0], "100%", "100%"), // raphael obj

        // "draw" ink vars
        penColor = "#000000",
        penOpacity = 1.0,
        penWidth = 7,
        eraserWidth = 5,
        pa = [], // path attributes (one object for each path segment)

        // "highlight" ink vars
        marqueeFillColor = "#000000",
        marqueeFillOpacity = 0.7,
        transMode = 'isolate',
        transCoords = [],
        transLetters = [],
        transCurrpath = "",
        boundingShapes = "",

        // "write" ink vars
        fontFamily = "'Times New Roman', serif",
        fontColor = "#ffffff",
        fontSize = "12px",
        svgText,


        // misc uninitialized vars
        textElt,
        inkTrack,
        hasClicked,
        datastring = "",
        mode = TAG.TourAuthoring.InkMode.draw,
        isAttached = true, // TODO DOC why is this true to start?
        initKeyframe = {},
        artworkName = "",
        expId = "",
        oldScale = 1,

        // for panning/zooming inks
        origPaperX = 0, // orig coordinates of the raphael canvas
        origPaperY = 0,
        origPaperW = viewerElt.width(),
        origPaperH = viewerElt.height(),
        origpx = 0, // orig coordinates of the artwork
        origpy = 0,
        origpw = 0,
        origph = 0,
        lastpx = 0, // most recent coordinates of the artwork
        lastpy = 0,
        lastpw = 0,
        lastph = 0,
        lastcx = 0, // most recent coordinates of the "virtual canvas" which helps us place inks correctly
        lastcy = 0, // the virtual canvas is where the Raphael canvas would be if it were moving with the artwork
        lastcw = 0,
        lastch = 0,

        inkUndoManager = new TAG.TourAuthoring.UndoManager(),

        playbackControls = spec.playbackControls,
        undoManager = spec.undoManager,
        timeline = spec.timeline,
        timeManager = spec.timeManager,
        viewer = spec.viewer;

    // make sure svg elt is correctly positioned
    $("#" + canvid + " svg").css("position", "absolute");
    
    // undo manager stuff
    inkUndoManager.setInitialized(true);
    playbackControls.undoButton.off("click");
    playbackControls.redoButton.off("click");
    playbackControls.undoButton.on('click', function () {
        inkUndoManager.undo();
    });
    playbackControls.redoButton.on('click', function () {
        inkUndoManager.redo();
    });
    
    
    // methods //

    /**
     * Sets ink params to defaults
     * @method resetParams
     */
    function resetParams() {
        // "draw" variables
        penColor = "#000000";
        penOpacity = 1.0;
        penWidth = 7;
        eraserWidth = 5;

        // "highlight" variables
        marqueeFillColor = "#000000";
        marqueeFillOpacity = 0.8;
        trans_mode = 'isolate';

        // "write" variables
        fontFamily = "'Times New Roman', serif";
        fontColor = "#ffffff";
        fontSize = '12px';
    }

    /**
     * Helper function to generate an absolute coordinate on svg canvas from stored relative
     * coordinate. Relative coords are stored because inks can be viewed/edited/created in
     * viewers of different sizes.
     * @method toAbsoluteCoords
     * @param {String/Number} rel      relative coordinate (in [0,1] probably)
     * @param {Boolean} y              if the coord should be scaled in the y direction (if false, scale in s)
     * @return {Number}                the absolute coordinate
     */
    function toAbsoluteCoords(rel, y) { // TODO DOC make sure we can just get height/width at beginning
        var scaleFactor = y ? canvHeight : canvWidth;
        return parseFloat(rel_coord) * scaleFactor;
    }

    /**
     * Takes an ellipse or rectangle and adds styling, drag events, drag handles to it.
     * @method addHighlightShapeAttributes
     * @param {Raphael elt} elt     the svg element
     */
    function addHighlightShapeAttributes(elt) {
        var origmousex,
            origmousey,
            origPosition = {},
            C1,
            C2,
            DC,
            rds = TAG.TourAuthoring.Constants.inkDragHandleRadius,
            isEllipse = elt.data('type') === 'ellipse'; // otherwise, is a rectangle

        elt.attr({ // add color attributes
            "stroke-width": 5,
            "stroke": "#ffffff",
            "stroke-opacity": 0.7,
            "fill": "#000000",
            "fill-opacity": 0,
            "stroke-dasharray": "-"
        });

        C1 = paper.ellipse(0, 0, rds - 2, rds - 2).attr({ "stroke-width": 2, "stroke": "#ffffff", "fill": "#296B2F", "fill-opacity": 0.9 }).data("type", "grabHandle");
        C2 = paper.ellipse(0, 0, rds - 2, rds - 2).attr({ "stroke-width": 2, "stroke": "#296B2F", "fill": "#ffffff", "fill-opacity": 0.9 }).data("type", "grabHandle");
        DC = paper.ellipse(0, 0, rds - 2, rds - 2).attr({ "stroke-width": 2, "stroke": "#ffffff", "fill": "#880000", "fill-opacity": 0.9 }).data("type", "grabHandle");
        placeHandles();

        C1.data("curr_cx", C1.attr("cx"));
        C1.data("curr_cy", C1.attr("cy"));
        C2.data("curr_cx", C2.attr("cx"));
        C2.data("curr_cy", C2.attr("cy"));
        DC.data("curr_cx", DC.attr("cx"));
        DC.data("curr_cy", DC.attr("cy"));

        // log in the undo manager; show and hide elements
        var command = TAG.TourAuthoring.Command({
            execute: function () {
                elt.show();
                C1.show();
                C2.show();
                DC.show();
                elt.data("visible", "yes");
            },
            unexecute: function () {
                elt.hide();
                C1.hide();
                C2.hide();
                DC.hide();
                elt.data("visible", "no");
            }
        });
        command.execute();
        inkUndoManager.logCommand(command);

        /**
         * Helper function to reposition (includes panning and zooming) a
         * highlight rect/ellipse
         * @method repositionHighlightElt
         * @param {Object} attrs    xloc, yloc, xdim, and ydim properties for new location/size
         */
        function repositionHighlightElt(attrs) {
            elt.data({
                curr_xloc: attrs.xloc,
                curr_yloc: attrs.yloc,
                curr_xdim: attrs.xdim,
                curr_ydim: attrs.ydim
            });

            if (isEllipse) {
                elt.attr({
                    cx: attrs.xloc,
                    cy: attrs.yloc,
                    rx: attrs.xdim,
                    ry: attrs.ydim
                });
            } else {
                elt.attr({
                    x: attrs.xloc,
                    y: attrs.yloc,
                    width: attrs.xdim,
                    height: attrs.ydim
                });
            }
            placeHandles();

            elt.toFront();
            C1.toFront();
            C2.toFront();
            DC.toFront();
        }

        /**
         * Places the pan, resize, and delete handles relative to the element
         * @method placeHandles
         */
        function placeHandles() {
            var xloc = elt.data("curr_xloc"), // x for rect; cx for ellipse
                yloc = elt.data("curr_yloc"), // y; cy
                xdim = elt.data("curr_xdim"), // w; rx
                ydim = elt.data("curr_ydim"), // h; ry
                x0, // temp
                y0; // temp


            if (isEllipse) {
                x0 = xdim / SQRT2; // fix where the top left drag handle should be in proportion to the radius
                y0 = ydim / SQRT2; // (if ellipse is a circle, handle will be on the line between center and top left corner of bounding box)

                C1.attr({
                    cx: xloc - x0 - 1, // 1 here is the stroke width / 2
                    cy: yloc - y0 + 1
                });

                C2.attr({
                    cx: xloc + x0 + 1,
                    cy: yloc + y0 + 1
                });

                DC.attr({
                    cx: xloc + x0 + 1,
                    cy: yloc - y0 + 1
                });
            } else {
                C1.attr({
                    cx: xloc,
                    cy: yloc
                });

                C2.attr({
                    cx: xloc + xdim,
                    cy: yloc + ydim
                });

                DC.attr({
                    cx: xloc + xdim,
                    cy: yloc
                });
            }
        }

        /**
         * Helper function to log a command at the end of a drag
         * @method dragStopHandler
         */
        function dragStopHandler() {
            var orig_xloc = origPosition.xloc,
                orig_yloc = origPosition.yloc,
                orig_xdim = origPosition.xdim,
                orig_ydim = origPosition.ydim,

                last_xloc = elt.data('curr_xloc'),
                last_yloc = elt.data('curr_yloc'),
                last_xdim = elt.data('curr_xdim'),
                last_ydim = elt.data('curr_ydim'),

                command = TAG.TourAuthoring.Command({
                    execute: function () {
                        repositionHighlightElt({
                            xloc: last_xloc,
                            yloc: last_yloc,
                            xdim: last_xdim,
                            ydim: last_ydim
                        });
                    },
                    unexecute: function () {
                        repositionHighlightElt({
                            xloc: orig_xloc,
                            yloc: orig_yloc,
                            xdim: orig_xdim,
                            ydim: orig_ydim
                        });
                    }
                });

            inkUndoManager.logCommand(command);
        }

        /**
         * Helper function to record initial locations at the start of
         * a drag.
         * @method dragStartHandler
         */
        function dragStartHandler() {
            origPosition = {
                xloc: elt.data("curr_xloc"), // x for rect; cx for ellipse
                yloc: elt.data("curr_yloc"), // y; cy
                xdim: elt.data("curr_xdim"), // w; rx
                ydim: elt.data("curr_ydim"), // h; ry
                c2x: C2.attr('cx'), // starting position of C2
                c2y: C2.attr('cy')
            };
        }

        // define drag functionality for the panning handle (upper-left)
        C1.drag(function (dx, dy, mousex, mousey) { // move
            repositionHighlightElt({
                xloc: origPosition.xloc + dx,
                yloc: origPosition.yloc + dy,
                xdim: origPosition.xdim,
                ydim: origPosition.ydim
            });
        },
        function (x, y) { // start; record original positions
            dragStartHandler();
        },
        function (x, y) { // stop; log in undomanager and set data of element
            dragStopHandler();
        });

        

        // define drag functionality for the resizing handle (lower-right);
        // when we resize, keep the panning handle where it is, have the resizing handle follow the mouse,
        // set the shape to be whatever it needs to be to satisfy those constraints
        C2.drag(function (dx, dy, mousex, mousey) { // move
            var C1X = C1.attr('cx'),
                C1Y = C1.attr('cy'),
                C2X = Math.max(origPosition.c2x + dx, C1X + 2*rds + 2),
                C2Y = Math.max(origPosition.c2y + dy, C1Y + 2*rds + 2);

            if (isEllipse) {
                repositionHighlightElt({
                    xloc: (C1X + C2X)/2,
                    yloc: (C1Y + C2Y)/2,
                    xdim: SQRT2/2 * (C2X - C1X - 2),
                    ydim: SQRT2/2 * (C2Y - C1Y)
                });
            } else {
                repositionHighlightElt({
                    xloc: C1X,
                    yloc: C1Y,
                    xdim: C2X - C1X,
                    ydim: C2Y - C1Y
                });
            }
        },
        function (x, y) { //start
            dragStartHandler();
        },
        function (x, y) { //stop
            dragStopHandler();
        });

        // define drag functionality for the shape itself (panning)
        elt.drag(function (dx, dy, mousex, mousey) { // move
            repositionHighlightElt({
                xloc: origPosition.xloc + dx,
                yloc: origPosition.yloc + dy,
                xdim: origPosition.xdim,
                ydim: origPosition.ydim
            });
        },
        function (x, y) { // start
            dragStartHandler();
        },
        function (x, y) { //stop
            dragStopHandler();
        });

        // shape deletion functionality
        DC.on('click', function () {
            var dccommand = TAG.TourAuthoring.Command({
                execute: function () {
                    elt.hide();
                    C1.hide();
                    C2.hide();
                    DC.hide();
                    elt.data("visible", "no");
                },
                unexecute: function () {
                    elt.show();
                    C1.show();
                    C2.show();
                    DC.show();
                    elt.data("visible", "yes");
                }
            });
            dccommand.execute();
            inkUndoManager.logCommand(dccommand);
        });
    }

    /**
     * Return the ink undo manager. Used in ComponenControls
     * @method getInkUndoManager
     * @return {TAG.TourAuthoring.UndoManager}     the ink undo manager
     */
    function getInkUndoManager() {
        return inkUndoManager;
    }

    /**
     * Add an ellipse to the Raphael canvas. Called by the "Add Ellipse" button in isolate/block ink mode
     * @method addEllipse
     * @param {Number} cx       center x coord of ellipse
     * @param {Number} cy       center y coord of ellipse
     * @param {Number} rx       x radius of ellipse
     * @param {Number} ry       y radius of ellipse
     */
    function addEllipse(cx, cy, rx, ry) {
        var ellipse;
        setMode(TAG.TourAuthoring.InkMode.shapes);
        
        if (!cx && cx !== 0) {
            cx = 100 + Math.random() * 10;
        }
        if (!cy && cy !== 0) {
            cy = 100 + Math.random() * 10;
        }
        if (!rx && rx !== 0) {
            rx = 50;
        }
        if (!ry && ry !== 0) {
            ry = 50;
        }

        ellipse = paper.ellipse(cx, cy, rx, ry); // draw to the canvas
        ellipse.data("curr_xloc", cx); // add data to be used by addHighlightShapeAttributes
        ellipse.data("curr_yloc", cy);
        ellipse.data("curr_xdim", rx);
        ellipse.data("curr_ydim", ry);
        ellipse.data("type", "ellipse");
        ellipse.data("visible", "yes");
        addHighlightShapeAttributes(ellipse);
    }

    /**
     * Add a rectangle to the Raphael canvas. Called by the "Add Rectangle" button in isolate/block ink mode
     * @method addRectangle
     * @param {Number} x     top left x
     * @param {Number} y     top left y
     * @param {Number} w     width
     * @param {Number} h     height
     */
    function addRectangle(x, y, w, h) {
        var rect;
        setMode(TAG.TourAuthoring.InkMode.shapes);

        if (!x && x !== 0) {
            x = 200 + Math.random() * 10;
        }
        if (!y && y !== 0) {
            y = 200 + Math.random() * 10;
        }
        if (!w && w !== 0) {
            w = 100;
        }
        if (!h && h !== 0) {
            h = 100;
        }

        rect = paper.rect(x, y, 100, 100); // draw to the Raphael canvas
        rect.data("curr_xloc", x); // set data to be used by addHighlightShapeAttributes
        rect.data("curr_yloc", y);
        rect.data("curr_xdim", 100);
        rect.data("curr_ydim", 100);
        rect.data("type", "rect");
        rect.data("visible", "yes");
        addHighlightShapeAttributes(rect);
    }

    /**
     * Return text svg element
     * @method getSVGText
     * @return {Raphael text elt}     text svg element
     */
    function getSVGText(){
        return svgText;
    }

    /**
     * Add an svg text element to the canvas
     * @param {Number} x     absolute x coord of text box
     * @param {Number} y     absolute y coord of text box
     * @param {String} str   the text string to render
     * @param {Number} size  font size (if not specified, uses value of fontSize)
     */
    function addTextBox(x, y, str, size) {
        if (!x && x !== 0) {
            x = 75;
        }
        if (!y && y !== 0) {
            y = 75;
        }

        str = str || "Your text here";

        set_mode(TAG.TourAuthoring.InkMode.text);

        svgText = paper.text(x, y, str);

        svgText.attr({
            'alignment-baseline': 'before-edge',
            "text-anchor": "start",
            'font-family': fontFamily,
            'font-size': size ? size : fontSize,
            'fill': fontColor,
            text: str
        });

        svgText.data({ // TODO DOC is this data really necessary?
            type: 'text',
            str: str,
            font: fontFamily,
            fontsize: size ? size : fontSize,
            color: fontColor,
        });

        setTextAttributes(svgText);
    }
    
    /**
     * Pans and resizes all inks to move with the artwork. Uses the initial keyframe of the artwork
     * (converted here to absolute coordinates) and the inputted dimensions to compute deltas and scale
     * factors. Once we have these, first pan to (0,0), then scale, then pan to position + deltas.
     *
     * In most cases, this does "panning" and "resizing" by using the Raphael Paper.setViewBox method
     * (see http://raphaeljs.com/reference.html#Paper.setViewBox), which resets the bounds of the virtual
     * view box of the Raphael paper. For example, by making the virtual view box "smaller," all of the inks
     * drawn on it appear to zoom in.
     *
     * Currently, isolate inks are created by filling the space between an outer path (around the whole viewport)
     * and inner paths that define the shapes in the isolate. If you were to use Paper.setViewBox on this, you
     * could zoom in to see outside of the outer path, which was previously outside of the viewport. For isolate
     * inks, we actually recalculate the points in the path to pan and zoom. This takes longer, but it allows us
     * to redraw our outer path around the whole viewport. This is very open to improvement.
     *
     * Also, it is nice to be able to force this explicit recomputation of points when loading inks in the "edit ink"
     * functionality. Inks are positioned relative to an initial artwork keyframe. When we edit and save an ink, that
     * initial keyframe is updated, so we should actually recompute the points in the ink to be relative to this
     * new initial keyframe (rather than just resetting the view box).
     *
     * @param {Object} dims          the current dimensions of our artwork in absolute coordinates (x, y, width, height)
     * @param {Boolean} hardResize   forces explicit recomputation of points in/position of our ink
     */
    function adjustViewBox(dims, hardResize) {
        var new_px = dims.x,
            new_py = dims.y,
            new_pw = dims.width,
            new_ph = dims.height,
            real_kfw, real_kfh, real_kfx, real_kfy,
            lambda_w, lambda_h, nvw, nvh, nvx, nvy,
            SW, newwid, newhei, cw, ch;

        // convert weird deeepzoom keyframe coordinates to absolute coordinates
        real_kfw = origPaperW / initKeyframe.w; // deepzoom keyframe width is what we multiply the absolute width of art by to get width of viewer
        real_kfh = real_kfw * (new_ph / new_pw); // deepzoom keyframe height is kind of confusing, so use width * (1 / aspect_ratio of art)
        real_kfx = -initKeyframe.x * real_kfw; // deepzoom keyframe x times absolute width of art is what we must translate art by to reach the left of viewer
        real_kfy = -initKeyframe.y * real_kfw; // (WEIRD -- seems to place too high if use -initKeyframe.y * real_kfh)

        // if the new position is not trivially different from the old position, pan and zoom
        if (nontrivial({ x: new_px, y: new_py, w: new_pw, h: new_ph }, { x: lastpx, y: lastpy, w: lastpw, h: lastph })) {
            //var eid_elt = $("[ES_ID='" + EID + "']");
            lambda_w = origPaperW / real_kfw;
            lambda_h = origPaperH / real_kfh;
            nvw = new_pw * lambda_w; // nv*: dimensions of the new virtual canvas (where the ink canvas would be if we were panning and zooming it with the artwork)
            nvh = new_ph * lambda_h;
            nvx = (nvw / origPaperW) * (origPaperX - real_kfx) + new_px;
            nvy = (nvh / origPaperH) * (origPaperY - real_kfy) + new_py;

            SW = nvw / lastcw; // scale factor in x direction
            // var SH = nvh / lastch; // scale factor in y direction (in case we ever have non-aspect-ratio-preserving scaling)

            oldScale = new_pw / origpw;
            // oldScaleH = new_ph / origph; // in case we ever have non-aspect-ratio-preserving scaling

            if ((!transCoords.length || trans_mode === 'block') && !hardResize) { // for all ink types except isolates (can't just resize the window for them)
                newwid = origPaperW / oldScale;
                newhei = origPaperH / oldScale;
                paper.setViewBox(-nvx / oldScale, -nvy / oldScale, newwid, newhei); // see raphael documentation
            }
            else {
                cw = canvWidth; // domelement.width();
                ch = canvHeight; // domelement.height();
                magX = cw;
                magY = ch;
                panObjects(-lastcx / origPaperW, -lastcy / origPaperH, { cw: cw, ch: ch }, 0); // no need to draw updated ink yet
                resizeObjects(SW, SW); // still no need, since we still have to pan
                panObjects(nvx / origPaperW, nvy / origPaperH, { cw: cw, ch: ch }, 1);
            }

            // reset coordinates
            lastcx = nvx;
            lastcy = nvy;
            lastcw = nvw;
            lastch = nvh;
            lastpx = new_px;
            lastpy = new_py;
            lastpw = new_pw;
            lastph = new_ph;
        }
    }

    /**
     * Convert a string representing a block transparency to one representing an isolate transparency.
     * Block/isolate is determined by the fill property of the svg element. If we draw the path counterclockwise (rather than clockwise)
     * and also draw a path around the whole canvas, the space in between will be filled and we will get an isolate transparency. This
     * method reverses the given path and adds the aforementioned outer path.
     * @method blockToIsol
     * @param {String} pth     path describing the block transparency
     * @return {String}        reversed isolate path (with outer path)
     */
    function blockToIsol(pth) {
        var newPth = '',
            segs = [''],
            parsedPth = Raphael.parsePathString(pth),
            numArray = [],
            i,
            j;

        // iterate through in reverse order
        for (var i = parsedPth.length - 2; i >= 0; i--) {
            if (parsedPth[i][0] === "z") {
                newPth += "M" + numArray[0] + "," + numArray[1];
                for (j = 2; j < numArray.length; j++) {
                    newPth += (j % 6 == 2) ? ("C" + numArray[j]) : numArray[j];
                    newPth += (j % 6 != 1) ? "," : "";
                }
                newPth += "z"; // close the path
                numArray.length = 0;
                numArray = []; // every time we hit a close-path command ('z'), restart num_array for new path
            } else if (parsedPth[i][0] === "M") {
                numArray.push(parsedPth[i][1]);
                numArray.push(parsedPth[i][2]);
            } else {
                numArray.push(parsedPth[i][5]);
                numArray.push(parsedPth[i][6]);
                numArray.push(parsedPth[i][3]);
                numArray.push(parsedPth[i][4]);
                numArray.push(parsedPth[i][1]);
                numArray.push(parsedPth[i][2]);
            }
        }

        // manually add the last path, since there is no 'z' at the start of our pathstring
        newPth += "M" + numArray[0] + "," + numArray[1];
        for (j = 2; j < numArray.length; j++) {
            newPth += ((j % 6 == 2) ? ("C" + numArray[j]) : (numArray[j]));
            newPth += ((j % 6 != 1) ? (",") : "");
        }
        newPth += "z";
        newPth += "M-5,-5L" + (canvWidth + 5) + ",-5L" + (canvWidth + 5) + "," + (canvHeight + 5) + "L-5," + (canvHeight + 5) + "L-5,-5z"; // outer path (5px outside viewer)
        return newPth;
    }

    /**
     * Construct the path that models the overlap between new_path and existing_path in the appropriate
     * transparency mode. Used for properly constructing a transparency from overlapping shapes.
     * For example, if the paths are intersecting circles, constructCombinedPath returns the
     * outline of the two; if one path is completely inside the other, the inner one is returned in isolate
     * mode and the outer is returned in block mode. Both input paths are closed (have a trailing 'z'). Please try
     * to improve this. Could see if https://github.com/poilu/raphael-boolean could replace this.
     *
     * Known bugs:
     *  - if there is a completely enclosed section of negative space (a "courtyard") inside a few intersecting
     *    paths, this fails
     *
     * @method constructCombinedPath
     * @param {String} new_path        one path
     * @param {String} existing_path   another path (in the scheme of things, we are building this path up by adding new_paths)
     * @return {String}                combined path
     */
    function constructCombinedPath(new_path, existing_path) {
        // orderAdded is an array of points objects in the order they are added;
        // point format:
        //    {
        //        point: {
        //            x: __,
        //            y: __
        //        },
        //        type: 'endpoint' or 'intpoint',
        //        path: 0 or 1  (0 if on new_path, 1 if on existing_path)
        //    }

        var order_added = [],
            i,
            j,
            k,
            pth_seg,
            next_seg,
            pth_seg_len,
            first_point_added = 0,
            parsed_new_path,
            parsed_old_path,
            old_nz, // number of 'z's in old path (we'll get rid of these)
            new_path_startpoints = [],
            old_path_endpoints = [],
            perturbed = 0,
            ind2, // temp
            nps,
            prev,
            ints,
            seg_ints,
            old_seg_ints = [], // for intersections along each segment of the old path
            outer_path = "",
            curr_ints,
            old_seg_num,
            index,
            pt1,
            test1,
            test2,
            l,
            final_list = [],
            pt,
            next,
            ob,
            ib;

        if (existing_path === "") { // if the existing path is empty, new path should replace it
            return new_path;
        }

        // get array of vertices for the new path
        parsed_new_path = Raphael.parsePathString(new_path);
        for (i = 0; i < parsed_new_path.length; i++) {
            if (parsed_new_path[i][0] == "z") {
                parsed_new_path.splice(i, 1); // don't want the trailing 'z's
                i--;
            }
        }

        // get array of vertices for the old path
        parsed_old_path = Raphael.parsePathString(existing_path);
        old_nz = 0;
        for (i = 0; i < parsed_old_path.length; i++) {
            if (parsed_old_path[i][0] == "z") {
                parsed_old_path.splice(i, 1); // don't want the trailing 'z's
                i--;
                old_nz++;
            }
        }

        // get array of startpoints for the new path, including bezier coordinates out of the point (ax1, ay1) and into the next point (ax2, ay2)
        for (i = 0; i < parsed_new_path.length - 1; i++) {
            pth_seg = parsed_new_path[i];
            next_seg = parsed_new_path[(i + 1) % parsed_new_path.length];
            pth_seg_len = pth_seg.length;
            new_path_startpoints.push({ x: pth_seg[pth_seg_len - 2], y: pth_seg[pth_seg_len - 1], ax1: next_seg[1], ay1: next_seg[2], ax2: next_seg[3], ay2: next_seg[4] });
        }

        // get array of endpoints for the oldpath, including bezier coordinates as above
        for (i = 0; i < parsed_old_path.length - 1; i++) {
            pth_seg = parsed_old_path[(i + 1) % parsed_old_path.length];
            ind2 = ((i + 2) % parsed_old_path.length !== 0) ? ((i + 2) % parsed_old_path.length) : 1;
            next_seg = parsed_old_path[ind2];
            pth_seg_len = pth_seg.length;
            old_path_endpoints.push({ x: pth_seg[pth_seg_len - 2], y: pth_seg[pth_seg_len - 1], ax1: next_seg[1], ay1: next_seg[2], ax2: next_seg[3], ay2: next_seg[4] });
        }

        // see if any of our endpoints are the same or are colinear; if they are, perturb one by a slight amount
        for (i = 0; i < new_path_startpoints.length; i++) {
            for (j = 0; j < old_path_endpoints.length; j++) {
                if (same_point(new_path_startpoints[i], old_path_endpoints[j])) {
                    new_path_startpoints[i].x += 1;
                    new_path_startpoints[i].y += 1;
                    new_path_startpoints[i].ax1 += 1;
                    new_path_startpoints[i].ay1 += 1;
                    new_path_startpoints[i].ax2 += 1;
                    new_path_startpoints[i].ay2 += 1;
                    perturbed = true;
                    break; // break out of inner loop
                }
            }
        }

        // if we perturbed any points above, we need to reset the string in new_path and reparse to get parsed_new_path
        if (perturbed) {
            new_path = "M" + new_path_startpoints[0].x + "," + new_path_startpoints[0].y;
            for (i = 1; i < new_path_startpoints.length; i++) {
                nps = new_path_startpoints[i];
                prev = new_path_startpoints[i - 1];
                new_path += "C" + prev.ax1 + "," + prev.ay1 + "," + prev.ax2 + "," + prev.ay2 + "," + nps.x + "," + nps.y;
            }
            new_path += "C" + nps.ax1 + "," + nps.ay1 + "," + nps.ax2 + "," + nps.ay2 + "," + new_path_startpoints[0].x + "," + new_path_startpoints[0].y;
            new_path += "z";
            parsed_new_path = Raphael.parsePathString(new_path);
            for (i = 0; i < parsed_new_path.length; i++) {
                if (parsed_new_path[i][0] == "z") {
                    parsed_new_path.splice(i, 1);
                    i--;
                }
            }
        }

        // get the array of intersection points of the two paths
        ints = Raphael.pathIntersection(new_path, existing_path);
        seg_ints = [[], [], [], []]; // for intersections along each segment of the new path (4 segments)
        for (i = 0; i < ints.length; i++) {
            seg_ints[ints[i].segment1 - 1].push(ints[i]); // segments are 1-indexed
        }

        // sort each segment's intersections in order of increasing t-value (i.e. distance along the segment)
        function sortHelperT1(a, b) {
            return a.t1 - b.t1;
        }

        for (i = 0; i < seg_ints.length; i++) {
            seg_ints[i].sort(sortHelperT1); // sort by t-value (t1 is the t-value of the int on the new path)
        }

        
        for (i = 0; i < parsed_old_path.length - old_nz; i++) {
            old_seg_ints.push([]);
        }

        for (i = 0; i < ints.length; i++) {
            old_seg_ints[ints[i].segment2 - 1].push(ints[i]);
        }

        // sort each segment's intersections in order of increasing t2-value (maybe unnecessary)
        function sortHelperT2(a, b) {
            return a.t2 - b.t2;
        }

        for (i = 0; i < old_seg_ints.length; i++) {
            old_seg_ints[i].sort(sortHelperT2);
        }


        if (ints.length === 0) //if no intersections, the paths are disjoint and one may be contained in the other
        {
            if (point_inside(new_path, old_path_endpoints[0].x, old_path_endpoints[0].y)) {
                return ((trans_mode === 'isolate') ? existing_path : new_path); // existing_path is inside new_path
            }
            if (point_inside(existing_path, new_path_startpoints[0].x, new_path_startpoints[1].y)) {
                return ((trans_mode === 'isolate') ? new_path : existing_path); // new_path is inside existing_path
            }
            return new_path + existing_path; // paths are disjoint and neither is inside the other
        }

        // iterate through the segments of new_path
        // for each segment, add the start point if it is outside existing_path, add each intersection point, and after adding intersection points, check to see if we should add any endpoints of existing_path
        for (i = 0; i < seg_ints.length; i++) {
            // add start point if outside existing_path
            if (!point_inside(existing_path, new_path_startpoints[i].x, new_path_startpoints[i].y) && !repeat_pt(new_path_startpoints[i], order_added)) {
                if (i === 0)
                    first_point_added = 1;
                order_added.push({ point: new_path_startpoints[i], type: "endpoint", path: 0 }); // add point to order_added if it should be in the final path
            }
            curr_ints = seg_ints[i]; // array of intersection points on the current segment of new_path
            for (j = 0; j < curr_ints.length; j++) {
                if (!repeat_pt(curr_ints[j], order_added)) {
                    // need to find which curve the previously added point is from in order to get the right bezier coordinates
                    order_added.push({ point: curr_ints[j], type: "intpoint", path: ((order_added.length) ? (order_added[order_added.length - 1].type) : 0) });
                }
                old_seg_num = curr_ints[j].segment2 - 1; // index of int point in old_seg_ints
                k = old_seg_num;
                index = k;

                // iterate through old path endpoints, adding them if they are outside new_path, stopping when we hit a repeat or a point inside new_path
                while (!point_inside(new_path, old_path_endpoints[index].x, old_path_endpoints[index].y) && !repeat_pt(old_path_endpoints, order_added)) {
                    pt1 = old_path_endpoints[index];
                    test1 = 1;
                    test2 = 1;
                    if (index == old_seg_num) { // still on segment of existing_path that the original intersection point was on
                        // check here if there is another intersection point farther along the current segment in the existing path (so we shouldn't add the next endpoint of existing_path)
                        for (l = 0; l < old_seg_ints[index].length; l++) {
                            if (old_seg_ints[index][l].t2 > curr_ints[j].t2) {
                                test1 = 0;
                                break;
                            }
                        }
                    }
                    else {
                        // otherwise, we just want to make sure that there are no intersection points along the segment whose endpoint is pt1
                        if (old_seg_ints[index].length > 0)
                            test2 = 0;
                    }
                    if (!test1 || !test2 || repeat_pt(pt1, order_added))
                        break;

                    // if we're here, we should add the endpoint pt1 to order_added (with path: 1, since it's on the old path)
                    order_added.push({ point: old_path_endpoints[index], type: "endpoint", path: 1 });
                    k++;
                    index = k % (old_seg_ints.length); // wrap around to first point if necessary
                }
            }
        }
        if (!point_inside(existing_path, new_path_startpoints[0].x, new_path_startpoints[0].y)) {
            order_added.push({ point: new_path_startpoints[0], type: "endpoint", path: 0 }); // if first startpoint is outside existing_path, add it again to close the path
        }
        if (!same_point(order_added[order_added.length - 1].point, order_added[0].point)) {
            order_added.push(order_added[0]); // close path if need be
        }

        // build up outer_path using order_added
        for (i = 0; i < order_added.length - 1; i++) {
            pt = order_added[i];
            next = order_added[(i + 1) % order_added.length];
            ob = out_bez(pt, next);
            ib = next_in_bez(pt, next);
            final_list.push({
                ax1: ob.x,
                ay1: ob.y,
                ax2: ib.x,
                ay2: ib.y,
                x: next.point.x,
                y: next.point.y
            }); // push each point along with outgoing bezier coordinates (and incoming for the next point)
        }

        // take points in final_list and build the path string
        outer_path = "M" + final_list[final_list.length - 1].x + "," + final_list[final_list.length - 1].y;
        for (i = 0; i < final_list.length; i++) {
            pt = final_list[i];
            outer_path += "C" + pt.ax1 + "," + pt.ay1 + "," + pt.ax2 + "," + pt.ay2 + "," + pt.x + "," + pt.y;
        }
        outer_path += "z";
        return outer_path;
    }

    /**
     * A helper function to draw transparencies. Takes the arrays transLetters (representing the
     * svg path commands in the transparency string) and transCoords (corresponding locations on the
     * canvas in relative coordinates) and draws the appropriate type of transparency to the canvas.
     * If the type is 'isolate,' calls blockToIsol, which reverses the path and adds an outer path
     * around the canvas to fill the in-between space.
     * @method drawTrans
     */
    function drawTrans() {
        var path = '',
            ind = 0,
            i,
            k,
            final_path,
            trans;

        remove_all(); // be careful that this method isn't called unless the type of the ink is 'trans'!

        // iterate through the transLetters array and create our svg path accordingly
        for (i = 0; i < transLetters.length; i++) {
            if (transLetters[i] === "M" || transLetters[i] === "L") { // if M or L, add next two coords to the path
                path += transLetters[i] + (transCoords[ind] * cw) + "," + (transCoords[ind + 1] * ch);
                ind += 2;
            } else if (transLetters[i] === "C") {
                path += "C" + (transCoords[ind] * cw);
                for (k = 1; k < 6; k++) { // if C, add next six coords to the path (coords represent bezier curve)
                    path += "," + (transCoords[ind + k] * ((k % 2 === 1) ? canvHeight : canvWidth));
                }
                ind += 6;
            } else if (transLetters[i] === "z") { // if z, close the path
                path += "z";
            }
        }
        final_path = path;
        if (trans_mode === 'isolate') { // if the mode is 'isolate,' reverse the path and add an outer path
            final_path = blockToIsol(path);
        }
        trans = paper.path(final_path).attr({ "fill": marqueeFillColor, "fill-opacity": marqueeFillOpacity, "stroke-width": 0 }).data("type", "trans");
        trans_currpath = "TRANS::[path]" + path + "[color]" + marqueeFillColor + "[opac]" + marqueeFillOpacity + "[mode]" + trans_mode + "[]";
        update_datastring();// TODO DOC do we need to call this so often?
    }

    /**
     * Takes in a datastring and parses for a certain attribute by splitting at "[" and "]" (these surround
     * attribute names).
     * NOTE if errors are coming from this function, could be that the datastring is empty...
     *
     * @method getAttr
     * @param {String} str        the datastring
     * @param {String} attr       the attribute we'll parse for
     * @param {String} parsetype  's' (string), or 'f' (float) ('f' is the default)
     * @return {String/Number}    the value of the attribute in the correct type
     */
    function getAttr(str, attr, parsetype) {
        var val = str.split('[' + attr + ']')[1].split('[')[0];
        if (parsetype === "s") {
            return val;
        }
        return parseFloat(val);
    }
    
    /**
     * Returns the isolate/block bounding shapes
     * @method getBoundingShapes
     * @return {String}    the datastring of bounding shapes
     */
    function getBoundingShapes() {
        return bounding_shapes;
    }

    /**
     * Returns the current datastring (TODO INK JSON fix the ink format to use stringified JSON rather than this weird custom format)
     * @method getDatastring
     * @return {String}   the current datastring
     */
    function getDatastring() {
        return datastring;
    }

    /**
     * Uses path data representing ellipses and rectangles to get the path representing the ultimate block
     * or isolate shape
     * @method getOuterPaths
     * @param {Array} paths        path strings representing ellipses and rects
     */
    function getOuterPath(paths) {
        var cumulative_path = "",
            i,
            outer_path,
            parsed,
            temp,
            j,
            jparsed;

        for (i = 0; i < paths.length; i++) {
            temp = transformPathstringMarq(paths[i], canvWidth, canvHeight); // transform each to absolute coords
            paths[i] = (temp[temp.length - 1] === "z") ? temp : (temp + "z"); // make sure each is closed
        }
        while (paths.length) {
            // take the first path, loop through the list, calling constructCombinedPath on any that intersect, then add to cumulative_path
            outer_path = paths[0];
            paths.splice(0, 1);
            if (paths.length) {
                parsed = Raphael.parsePathString(outer_path); // parses outer_path as a list of objects containing path data
                for (j = 0; j < paths.length; j++) {
                    jparsed = Raphael.parsePathString(paths[j]);
                    // the next line checks if paths[j] and outerpath intersect, or if one is completely inside the other
                    if (Raphael.pathIntersection(outer_path, paths[j]).length || point_inside(outer_path, jparsed[0][1], jparsed[0][2]) || point_inside(paths[j], parsed[0][1], parsed[0][2])) {
                        outer_path = constructCombinedPath(paths[j], outer_path);
                        paths.splice(j, 1);
                        j = -1; //if we have an intersection, another, previously non-intersecting path might now intersect, so reset j (we spliced out the current j, so no repeats)
                    }
                }
            }
            cumulative_path += outer_path;
        }
        // finally, load the resulting cumulative path onto the canvas
        loadTransFromPath(cumulative_path);
    }

    /**
     * Helper function to get artwork's relative coordinates within the viewer
     * @param {Object} proxy        proxy for the artwork's position and size (contains x, y, w, and h properties)
     * @return {Object}             an object containing relative coordinates x, y, w, h
     */
    function getArtRelativePos(proxy) {
        return {
            x: proxy.x / canvWidth,
            y: proxy.y / canvHeight,
            w: proxy.w / canvWidth,
            h: proxy.h / canvHeight
        };
    }

    /**
     * Helper function to get the svg element created by Raphael
     * @method getSVGElement
     * @return {HTML elt}        svg HTML element created by Raphael
     */
    function getSVGElement() {
        return canvElt.find("svg")[0];
    }

    /**
     * Searches the current datastring for ellipses and rectangles, stores their information in bounding_shapes.
     * Also stores their coordinates and types in an array "shapes" and calls shapesToPaths on shapes
     * to transform them to path format.
     * @method getTransShapeData
     */
    function getTransShapeData () {
        var datastr = update_datastring(),
            shapes = [],
            i,
            shapes2,
            type,
            xloc, // x for rect; cx for ellipse
            yloc, // y; cy
            xdim, // w; rx
            ydim, // h; ry
            strokec, // stroke color
            strokeo, // stroke opacity
            strokew, // stroke width
            elt;

        if (datastr === "") {
            return;
        }

        shapes2 = datastr.split("|");
        for (i = 0; i < shapes2.length; i++) {
            shape2 = shapes2[i];
            type = shape2.split("::")[0];
            strokec = getAttr(shape2, 'strokec', 's');
            strokeo = getAttr(shape2, 'strokeo', 's');
            strokew = getAttr(shape2, 'strokew', 'f');
            switch (type.toLowerCase()) {
                case "lrect":
                case "mrect":
                case "rect":
                    // rectangle format: [x]73[y]196[w]187[h]201[strokec]#000000[strokeo]1[strokew]3[]
                    xloc = toAbsoluteCoords(getAttr(shape2, "x", "f"));
                    yloc = toAbsoluteCoords(getAttr(shape2, "y", "f"), true);
                    xdim = toAbsoluteCoords(getAttr(shape2, "w", "f"));
                    ydim = toAbsoluteCoords(getAttr(shape2, "h", "f"), true);
                    elt = { "X": x, "Y": y, "w": w, "h": h, "type": "rect" };
                    bounding_shapes += "BOUNDRECT::[x]" + (xloc / canvWidth) + "[y]" + (yloc / canvHeight);
                    bounding_shapes += "[w]" + (xdim / canvWidth) + "[h]" + (ydim / canvHeight);
                    bounding_shapes += "[fillc]#000000[fillo]0[strokec]" + strokec + "[strokeo]" + strokeo + "[strokew]" + strokew + "[]|";
                    shapes.push(elt);
                    break;
                case "lellipse":
                case "mellipse":
                case "ellipse":
                    // ellipse format: [cx]81[cy]131[rx]40[ry]27[strokec]#000000[strokeo]1[strokew]3[]
                    xloc = toAbsoluteCoords(getAttr(shape2, "cx", "f")); // center x
                    yloc = toAbsoluteCoords(getAttr(shape2, "cy", "f"), true); // center y
                    xdim = toAbsoluteCoords(getAttr(shape2, "rx", "f")); // x-radius
                    ydim = toAbsoluteCoords(getAttr(shape2, "ry", "f"), true); // y-radius
                    elt = { "cx": cx, "cy": cy, "rx": rx, "ry": ry, "type": "ellipse" };
                    bounding_shapes += "BOUNDELLIPSE::[cx]" + (xloc / canvWidth) + "[cy]" + (yloc / canvHeight);
                    bounding_shapes += "[rx]" + (xdim / canvWidth) + "[ry]" + (ydim / canvHeight);
                    bounding_shapes += "[fillc]#000000[fillo]0[strokec]" + strokec + "[strokeo]" + strokeo + "[strokew]" + strokew + "[]|";
                    shapes.push(elt);
                    break;
            }
        }
        shapesToPaths(shapes);
    }

    /**
     * Returns true if the text box containing an ink being edited/authored is empty
     * @method isTextboxEmpty
     * @return {Boolean}      whether text box is empty
     */
    function isTextboxEmpty() {
        return !($('#' + TEXTBOX_ID).attr("value"));
    }

    /**
     * Helper function to check if there is actually a valid ink to attach/save during ink authoring/editing.
     * For texts, need to use isTextboxEmpty.
     * @method isDatastringEmpty
     * @param {String} datastring     the datastring to check
     * @return {Boolean}              whether or not there are inks on the canvas (i.e. the datastring does not represent anything useful)
     */
    function isDatastringEmpty(datastring) {
        var empty = false;

        if (!pathstring && datastring === "") {
            return true;
        }

        switch (datastring.split("::")[0].toLowerCase()) {
            case 'trans':
                if (datastring.split("[path]")[1].split("[")[0] === "") {
                    empty = true;
                }
                break;
            case 'bezier': // TO DO -- in case we go back to old paths, add currpaths or something
            case 'path':
                if (!pathstring && datastring.split("[pathstring]")[1].split("[")[0] === "") {
                    empty = true;
                }
                break;
            case 'text':
                if (datastring.split("[str]")[1].split("[")[0] === "") {
                    empty = true;
                }
                break;
            default:
                break;
        }
        return empty;
    }

    /**
     * Display warning message if ink cannot be loaded
     * @param displayString     String describing error (to be displayed)
     */
    function creationError(displayString) {
        timeline.hideEditorOverlay();
        var messageBox = $(TAG.Util.UI.popUpMessage(null, displayString, null));
        messageBox.css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex + 1000);
        $('#tagRoot').append(messageBox); // TODO CHECK is this correct in both apps?
        messageBox.fadeIn(500);
    }

    /**
     * Checks if currently inside display
     * @method checkInDisplay
     * @param {TAG.TourAuthoring.Track} track        selected track
     * @return {Boolean}                             true if in a display in selected track
     */
    function checkInDisplay(track) {
        var currTime = timeManager.getCurrentTime(),
            nearestDisplay = track.getStorageContainer().displays.nearestNeighbors(currTime, 1)[0];

        return !!nearestDisplay;
    }

    /**
     * Helper function to do some preprocessing on text inks before linking them
     * @method linkText
     * @return {Boolean}     true if successful in linking, false otherwise
     */
    function linkText() {
        //var track,
        //    keyframe;

        //dataHolder = dataHolder || timeline.dataHolder;

        //// check if track is valid (i.e., there is a selected track and it's an artwork or image track)
        //track = dataHolder.getSelectedTrack();
        //if (!track || (track.getType() !== TAG.TourAuthoring.TrackType.artwork && track.getType() !== TAG.TourAuthoring.TrackType.image)) {
        //    creationError("There is no artwork or image track selected. Please select a valid track or create as an unlinked annotation.");
        //    return false;
        //}

        // check if the text is a valid (non-empty) ink by checking the value of the textbox. If invalid, show a warning message.
        if (isTextboxEmpty()) {
            creationError("Unable to attach an empty annotation. Please add to annotation before attaching.");
            return false;
        }

        //// check to make sure the playhead is in a display; if not, show a warning message
        //if (!checkInDisplay(track)) {
        //    creationError("Please move the playhead within the currently selected track's display.");
        //    return false;
        //}

        //// make sure capturing keyframe is successful, too
        //keyframe = viewer.captureKeyframe(track.getTitle());
        //if (!keyframe) {
        //    creationError("The track selected must be fully on screen in order to attach an annotation. Please seek to a location where the track is visible.");
        //    return false;
        //}

        saveText();
        return link();
    }

    /**
     * Helper function to do some preprocessing on unattached text inks
     * @method linkTextUnattached
     * @return {Boolean}     true if no warnings, false otherwise
     */
    function linkTextUnattached() {
        // check if the text is a valid (non-empty) ink by checking the value of the textbox. If invalid, show a warning message.
        if (isTextboxEmpty()) {
            creationError("Unable to attach an empty ink. Please add to ink component before attaching.");
            return false;
        }
        return linkUnattached();
    }

    /**
     * Helper function to do some preprocessing on transparencies before linking them
     *
     * TODO could factor out some code from here and linkText
     *
     * @method linkTrans
     * @return {Boolean}     true if successful in linking, false otherwise
     */
    function linkTrans() {
        //var track,
        //    keyframe;

        //dataHolder = dataHolder || timeline.dataHolder;

        //// TODO DOC can we delete these checks? they happen in link anyway...

        //// check if track is valid (i.e., there is a selected track and it's an artwork or image track)
        //track = dataHolder.getSelectedTrack();
        //if (!track || (track.getType() !== TAG.TourAuthoring.TrackType.artwork && track.getType() !== TAG.TourAuthoring.TrackType.image)) {
        //    creationError("There is no artwork or image track selected. Please select a valid track or create as an unlinked annotation.");
        //    return false;
        //}

        //// check to make sure the playhead is in a display; if not, show a warning message
        //if (!checkInDisplay(track)) {
        //    creationError("Please move the playhead within the currently selected track's display.");
        //    return false;
        //}

        //// make sure capturing keyframe is successful, too
        //keyframe = viewer.captureKeyframe(track.getTitle());
        //if (!keyframe) {
        //    creationError("The track selected must be fully on screen in order to attach an annotation. Please seek to a location where the track is visible.");
        //    return false;
        //}

        getTransShapeData();
        return link();
    }

    /**
     * Helper function to do some preprocessing on unattached transparency inks
     * @method linkTransUnattached
     * @return {Boolean}     true if no warnings, false otherwise
     */
    function linkTransUnattached() {
        if (isDatastringEmpty(update_datastring())) {
            creationError("Unable to attach an empty ink. Please add to ink component before attaching.");
            return false;
        }
        getTransShapeData();
        return linkUnattached();
    }

    /**
     * Function to link an ink to an artwork. Called for all types of inks (possibly after preprocessing, in
     * the cases of texts and transparencies).
     * return     true if linking was successful, false if warnings
     */
    function link() {
        var track,
            keyframe,
            datastr = updateDatastring(),
            proxyDiv,
            proxy,
            kfvx,
            kfvy,
            kfvw,
            kfvh,
            rw,
            inkType,
            linkType,
            inkDisplayTime,
            parentDisplay,
            boundingEdge,
            inkDisplay;

        dataHolder = dataHolder || timeline.dataHolder;

        // check if track is valid (i.e., there is a selected track and it's an artwork or image track)
        track = dataHolder.getSelectedTrack();
        if (!track || (track.getType() !== TAG.TourAuthoring.TrackType.artwork && track.getType() !== TAG.TourAuthoring.TrackType.image)) {
            creationError("There is no artwork or image track selected. Please select a valid track or create as an unattached annotation.");
            return false;
        }

        // make sure the datastring is nonempty before we attach
        if (isDatastringEmpty(datastr)) {
            creationError("Unable to attach an empty annotation. Please add to annotation before saving.");
            return false;
        }

        // make sure the track selection is valid, it is an artwork or an image, and the playhead is in a track display
        if (!checkInDisplay(track)) {
            creationError("Please move the playhead within the currently selected track's display.");
            return false;
        }

        // prepare to set track data
        artName = track.getTitle(); // "global" var
        linkType = track.getType();

        // make sure capturing keyframe is successful, too
        keyframe = viewer.captureKeyframe(artName);
        if (!keyframe) {
            creationError("The track selected must be fully on screen in order to attach an annotation. Please seek to a location where the track is visible.");
            return false;
        }

        magX = canvWidth;
        magY = canvHeight;
        proxyDiv = $("[data-proxy='" + escape(artName) + "']");
        proxy = {
            x: proxyDiv.data("x"),
            y: proxyDiv.data("y"),
            w: proxyDiv.data("w"),
            h: proxyDiv.data("h")
        };

        
        // get initial keyframe for the artwork/image we're attaching to (in the deepzoom format)
        if (linkType === TAG.TourAuthoring.TrackType.artwork) {
            kfvx = keyframe.state.viewport.region.center.x;
            kfvy = keyframe.state.viewport.region.center.y;
            kfvw = keyframe.state.viewport.region.span.x;
            kfvh = keyframe.state.viewport.region.span.y;
        } else if (linkType === TAG.TourAuthoring.TrackType.image) {
            kfvw = 1.0 / keyframe.state.viewport.region.span.x;
            rw = keyframe.state.viewport.region.span.x * canvElt.width();
            kfvh = keyframe.state.viewport.region.span.y; // not used
            kfvx = -keyframe.state.viewport.region.center.x * kfvw;
            kfvy = -(canvElt.height() / rw) * keyframe.state.viewport.region.center.y;
        }

        // set track data
        inkType = datastr.split("::")[0].toLowerCase();
        inkTrack = timeline.addInkTrack(track, "Ink " + decodeURI(artName), inkType);

        if (inkType === "trans") {
            datastr += bounding_shapes; // if we're attaching a transparency, also include the bounding ellipse/rects in the datastring so we can edit later
        }

        inkTrack.setInkPath(datastr);
        inkTrack.setInkInitKeyframe({ // the init keyframe is used to position the ink when the artwork is moved
            "x": kfvx,
            "y": kfvy,
            "w": kfvw,
            "h": kfvh
        });
        inkTrack.setInkEnabled(true); // set linked
        inkTrack.setInkType(inkType);
        inkTrack.setInkRelativeArtPos(getArtRelativePos(proxy));

        inkTrack.addInkTypeToTitle(inkType);

        isAttached = true;
        canvElt.remove(); // remove raphael canvas

        inkDisplayTime = timeManager.getCurrentTime();
        parentDisplay = track.getStorageContainer().displays.nearestNeighbors(inkDisplayTime, 1)[0].display;
        boundingEdge = parentDisplay.getEnd();
        inkDisplay = inkTrack.addDisplay(timeManager.getCurrentPx(), Math.min(5, boundingEdge - inkDisplayTime)); //add a display at the playhead location

        // set parent-child association between displays (used for constraining display dragging, etc)
        parentDisplay.addChildDisplay(inkDisplay);
        inkDisplay.setParentDisplay(parentDisplay);

        // add linking association between tracks
        track.addAttachedInkTrack(inkTrack);
        inkTrack.setInkLink(track);

        // add command to undo both track creation and display at once
        undoManager.combineLast(2);

        // it looks like this is forcing a tour refresh? TODO MAKE DEDICATED METHOD
        if (dataHolder._trackArray.length > 0) {
            dataHolder._trackArray[0].track.leftAndRight({ translation: { x: 0 } }, false);
        }

        return true;
    }

    /**
     * Function to create an unattached ink. Called for all types of inks (possibly after preprocessing, in
     * the cases of texts and transparencies).
     * return     true if creation was successful, false if warnings
     */
    function linkUnattached() {
        var datastr = updateDatastring(),
            inkType;

        if (isDatastringEmpty(datastr)) {
            creationError("Unable to attach an empty annotation. Please add to annotation before saving.");
            return false;
        }

        // add track and set track data
        inkTrack = timeline.addInkTrack(null, "Unattached Ink", 1);
        inkTrack.setInkLink(null);
        inkType = datastr.split("::")[0].toLowerCase();
        if (inkType === "trans") {
            datastr += bounding_shapes;
        }
        inkTrack.setInkPath(datastr);
        inkTrack.setInkEnabled(false); // unattached
        inkTrack.setInkSize(fontSize); // TODO DOC is this necessary
        inkTrack.setInkInitKeyframe({}); // initial keyframe doesn't matter, since not attached
        inkTrack.setInkRelativeArtPos({}); // initial art position doesn't matter, since not attached

        inkTrack.addInkTypeToTitle(inkType);

        isAttached = false;
        canvElt.remove();
        inkTrack.addDisplay(Math.min(timeManager.timeToPx(timeManager.getDuration().end - 0.5), timeManager.getCurrentPx()), Math.min(5, Math.max(0.5, timeManager.getDuration().end - timeManager.getCurrentTime()))); // add a display at the playhead location
        undoManager.combineLast(2);
        if (timeline.getTracks().length > 0) {
            timeline.getTracks()[0].leftAndRight({ translation: { x: 0 } }, false);
        }
        return true;
    }

    function getTextElt() {
        return textElt;
    }
    that.getTextElt = getTextElt;

    var magX = canvElt.width(), magY = canvElt.height();

    function getTextMagnification() {
        return magY;
    }
    that.getTextMagnification= getTextMagnification;

    /**
     * Loads an ink onto the ink canvas using its datastring (e.g. from track data).
     * @param   the datastring to be loaded (see update_datastring for datastring format)
     */
    function loadInk(datastr) {
        var shapes = datastr.split("|");
        var i;
        var cw = canvElt.width();
        var ch = canvElt.height();
        magX = cw;
        magY = ch;
        pathstring = "";
        var shapes_len = shapes.length;
        for (i = 0; i < shapes_len; i++) {
            var shape = shapes[i];
            var x, y, w, h, fillc, fillo, strokec, strokeo, strokew;
            if (shape && (shape !== "")) {
                var type = shape.split("::")[0];
                switch (type.toLowerCase()) {
                    case "text":
                        // format: [str]<text>[font]<font>[fontsize]<fontsize>[color]<font color>[x]<x>[y]<y>[]
                        var size = getAttr(shape, "fontsize", "f") * ch;
                        fontSize = size;
                        x = getAttr(shape, "x", "f") * cw;
                        y = getAttr(shape, "y", "f") * ch;
                        //var w, h;
                        try {
                            w = getAttr(shape, 'w', 'f');
                            h = getAttr(shape, 'h', 'f');
                        } catch (err) {
                            w = null;
                            h = null;
                        }
                        var text_color = getAttr(shape, "color", "s");
                        var text_font = getAttr(shape, "font", "s");
                        var text_text = getAttr(shape, "str", "s");
                        var text = paper.text(x, y, text_text);
                        text.attr({
                            "font-family": text_font,
                            "font-size": size + "px",
                            "fill": text_color,
                            "text-anchor": "start",
                        });
                        text.data({
                            "x": x,
                            "y": y,
                            'w': w,
                            'h': h,
                            "fontsize": size,
                            "color": text_color,
                            "font": text_font,
                            "type": "text",
                            "str": text_text,
                        });
                        textElt = text;
                        break;
                    case "path":
                        // format: [pathstring]M284,193L284,193[stroke]000000[strokeo]1[strokew]10[]

                        // TODO DOC just turn this into a bezier path, so it gets saved as a bezier path for later
                        //if (!currpaths)
                        //    currpaths = "";
                        //currpaths += shape + "|";
                        //update_ml_xy_pa(shape + "|");
                        break;
                    case "bezier": // bezier paths
                        
                        pathstring += getAttr(shape,"pathstring",'s');
                        pa.push({ color: getAttr(shape, "stroke", 's'), opacity: getAttr(shape, "strokeo", "f"), width: getAttr(shape, "strokew","f") });
                        break;
                    case "trans":
                        // format: [path]<path>[color]<color>[opac]<opac>[mode]<block or isolate>[]
                        if (!trans_currpath)
                            trans_currpath = "";
                        trans_currpath += shape + "|";
                        var pathstringt = getAttr(shape, "path", 's'); // MODIFIED
                        marqueeFillColor = getAttr(shape, "color", 's');
                        marqueeFillOpacity = getAttr(shape, "opac", "f");
                        trans_mode = getAttr(shape, "mode", 's');
                        transCoords = pathstringt.match(/[0-9.\-]+/g);
                        transLetters = pathstringt.match(/[CMLz]/g);
                        drawTrans();
                        break;
                    //case "rect":
                    //    // format: [x]73[y]196[w]187[h]201[fillc]#ffff00[fillo].5[strokec]#000000[strokeo]1[strokew]3[]
                    //    x = toAbsoluteCoords(getAttr(shape, "x", "f"));
                    //    y = toAbsoluteCoords(getAttr(shape, "y", "f"), true);
                    //    w = toAbsoluteCoords(getAttr(shape, "w", "f"));
                    //    h = toAbsoluteCoords(getAttr(shape, "h", "f"), true);
                    //    fillc = getAttr(shape, "fillc", "s");
                    //    fillo = getAttr(shape, "fillo", "f");
                    //    strokec = getAttr(shape, "strokec", "s");
                    //    strokeo = getAttr(shape, "strokeo", "f");
                    //    strokew = getAttr(shape, "strokew", "f");
                    //    var R = paper.rect(x, y, w, h);
                    //    R.data("currx", x);
                    //    R.data("curry", y);
                    //    R.data("currw", w);
                    //    R.data("currh", h);
                    //    R.data("type", "rect");
                    //    R.data("visible", "yes");
                    //    addHighlightShapeAttributes(R, fillc, fillo, strokec, strokeo, strokew);
                    //    break;
                    //case "ellipse":
                    //    // format: [cx]81[cy]131[rx]40[ry]27[fillc]#ffff00[fillo].5[strokec]#000000[strokeo]1[strokew]3[]
                    //    var cx = toAbsoluteCoords(getAttr(shape, "cx", "f"));
                    //    var cy = toAbsoluteCoords(getAttr(shape, "cy", "f"), true);
                    //    var rx = toAbsoluteCoords(getAttr(shape, "rx", "f"));
                    //    var ry = toAbsoluteCoords(getAttr(shape, "ry", "f"), true);
                    //    fillc = getAttr(shape, "fillc", "s");
                    //    fillo = getAttr(shape, "fillo", "f");
                    //    strokec = getAttr(shape, "strokec", "s");
                    //    strokeo = getAttr(shape, "strokeo", "f");
                    //    strokew = getAttr(shape, "strokew", "f");
                    //    var E = paper.ellipse(cx, cy, rx, ry);
                    //    E.data("currx", E.getBBox().x);
                    //    E.data("curry", E.getBBox().y);
                    //    E.data("curr_rx", rx);
                    //    E.data("curr_ry", ry);
                    //    E.data("type", "ellipse");
                    //    E.data("visible", "yes");
                    //    addHighlightShapeAttributes(E, fillc, fillo, strokec, strokeo, strokew);
                    //    break;
                    case "marquee": // DEPRECATED
                        // format: [x]206[y]207[w]102[h]93[surrfillc]#222222[surrfillo].8[]
                        var topx = toAbsoluteCoords(getAttr(shape, "x", "f"));
                        var topy = toAbsoluteCoords(getAttr(shape, "y", "f"), true);
                        w = toAbsoluteCoords(getAttr(shape, "w", "f"));
                        h = toAbsoluteCoords(getAttr(shape, "h", "f"), true);
                        var surrfillc = getAttr(shape, "surrfillc", "s");
                        var surrfillo = getAttr(shape, "surrfillo", "f");
                        var botx = topx + w;
                        var boty = topy + h;
                        var rn = paper.rect(0, 0, cw, topy);
                        rn.data("currx", 0);
                        rn.data("curry", 0);
                        var re = paper.rect(botx, topy, cw - botx, boty - topy);
                        re.data("currx", botx);
                        re.data("curry", topy);
                        var rs = paper.rect(0, boty, cw, ch - boty);
                        rs.data("currx", 0);
                        rs.data("curry", boty);
                        var rw = paper.rect(0, topy, topx, boty - topy);
                        rw.data("currx", 0);
                        rw.data("curry", topy);
                        var rc = paper.rect(topx, topy, botx - topx, boty - topy);
                        rc.data("currx", topx);
                        rc.data("curry", topy);
                        rc.data("type", "marquee");
                        //var m = new marquee(rn, re, rs, rw, rc);
                        //add_marq_attributes(m, surrfillc, surrfillo);
                        //marquees.push(m);
                        break;
                }
            }
        }
        drawPaths();
        if (pathstring) {
            drawBezierPath();
        }

        // force adjustViewBox to run so viewbox is always set 
        //lastpx = origpx + 10000;
        if (isAttached) {
            paper.setViewBox(0, 0, cw, ch);
            //adjustViewBox({ x: origpx, y: origpy, width: origpw, height: origph });
        }
    }
    that.loadInk = loadInk;

    /**
     * Draws a transparency to the canvas and adds the correct styling. Also sets trans_currpath, which keeps track of current transparency path.
     * @param pth    the path representing the transparency to be loaded in
     */
    function load_trans_from_path(pth) {
        var cw = canvElt.width();
        var ch = canvElt.height();
        var trans = paper.path(pth).attr({ "fill-opacity": marqueeFillOpacity, "fill": marqueeFillColor, "stroke-opacity": 0, "stroke": "#888888", "stroke-width": 0 });
        trans.data("type", "trans");
        trans_currpath = "TRANS::[path]" + transform_pathstring_marq(pth, 1.0 / cw, 1.0 / ch) + "[color]" + marqueeFillColor + "[opac]" + marqueeFillOpacity + "[mode]" + trans_mode + "[]|";
        update_datastring();
    }
    that.load_trans_from_path = load_trans_from_path;

    /**
     * Loads a transparency's bounding shapes -- type boundrect and boundellipse -- for editing transparencies
     * @param datastr    the datastring containing the transparency path and its bounding shapes
     */
    function load_transparency_bounding_shapes(datastr) {
        var shapes = datastr.split("|");
        var i;
        var cw = canvElt.width();
        var ch = canvElt.height();
        for (i = 0; i < shapes.length; i++) {
            var shape = shapes[i];
            var fillc, fillo, strokec, strokeo, strokew;
            if (shape && (shape !== "")) {
                var type = shape.split("::")[0];
                type = type.toLowerCase();
                switch (type) {
                    case "boundrect":
                        //format: [x]73[y]196[w]187[h]201[fillc]#ffff00[fillo].5[strokec]#000000[strokeo]1[strokew]3[]
                        var x = toAbsoluteCoords(getAttr(shape, "x", "f"));
                        var y = toAbsoluteCoords(getAttr(shape, "y", "f"), true);
                        var w = toAbsoluteCoords(getAttr(shape, "w", "f"));
                        var h = toAbsoluteCoords(getAttr(shape, "h", "f"), true);
                        addRectangle(x, y, w, h);
                        break;
                    case "boundellipse":
                        //format: [cx]81[cy]131[rx]40[ry]27[fillc]#ffff00[fillo].5[strokec]#000000[strokeo]1[strokew]3[]
                        var cx = toAbsoluteCoords(getAttr(shape, "cx", "f"));
                        var cy = toAbsoluteCoords(getAttr(shape, "cy", "f"), true);
                        var rx = toAbsoluteCoords(getAttr(shape, "rx", "f"));
                        var ry = toAbsoluteCoords(getAttr(shape, "ry", "f"), true);
                        addEllipse(cx, cy, rx, ry);
                        break;
                }
            }
        }
    }
    that.load_transparency_bounding_shapes = load_transparency_bounding_shapes;

    /**
     * Using the point pt, computes the incoming bezier anchor coordinates for the next point (next) in the path.
     * This is done by using the points' types (if pt and next are both endpoints, pt.point.ax2, .ay2 give the relevant information, etc).
     * @param pt      starting point object (contains point coordinates, type of point, and which path it's on)
     * @param next    next point object
     * @return    the incoming bezier anchor coordinates to next
     */
    function next_in_bez(pt, next) {
        var bez, t, dots;
        if (pt.type == "endpoint") {
            if (next.type == "endpoint") {
                return { x: pt.point.ax2, y: pt.point.ay2 };
            }
            else { // pt is an endpoint and next is an intersection point
                bez = (pt.path === 0) ? (next.point.bez1) : (next.point.bez2);
                t = (pt.path === 0) ? (next.point.t1) : (next.point.t2);
                dots = Raphael.findDotsAtSegment(bez[0], bez[1], bez[2], bez[3], bez[4], bez[5], bez[6], bez[7], t);
                return { x: dots.m.x, y: dots.m.y };
            }
        }
        else { // pt is an intersection point
            if (next.type === "endpoint") {
                bez = (next.path === 0) ? (pt.point.bez1) : (pt.point.bez2);
                return { x: bez[4], y: bez[5] };
            }
            else {//both pt and next are intersection points
                bez = (next.path === 0) ? (next.point.bez1) : (next.point.bez2);
                t = (next.path === 0) ? (next.point.t1) : (next.point.t2);
                dots = Raphael.findDotsAtSegment(bez[0], bez[1], bez[2], bez[3], bez[4], bez[5], bez[6], bez[7], t);
                return { x: dots.n.x, y: dots.n.y };
            }
        }
    }
    that.next_in_bez = next_in_bez;

    /**
     * Helper function to determine whether p1 and p2 are effectively the same point. Returns true if so.
     */
    function nontrivial(p1, p2) {
        var epsilon = 0.00000001;
        return ((Math.abs(p1.x - p2.x) > epsilon) || (Math.abs(p1.y - p2.y) > epsilon) || (Math.abs(p1.w - p2.w) > epsilon) || (Math.abs(p1.h - p2.h) > epsilon));
    }

    /**
     * Using the point next, computes the outgoing bezier anchor coordinates for the point pt on the path.
     * @param pt      starting point object (contains point coordinates, type of point, and which path it's on)
     * @param next    next point object
     * @return    the outgoing bezier anchor coordinates from pt
     */
    function out_bez(pt, next) {
        if (pt.type === "endpoint") {
            return { x: pt.point.ax1, y: pt.point.ay1 };
        }
        else { // pt is an intersection point
            var bez = (next.path === 0) ? (pt.point.bez1) : (pt.point.bez2);
            var t = (next.path === 0) ? (pt.point.t1) : (pt.point.t2);
            var dots = Raphael.findDotsAtSegment(bez[0], bez[1], bez[2], bez[3], bez[4], bez[5], bez[6], bez[7], t);
            return { x: dots.n.x, y: dots.n.y };
        }
    }

    var inkPannedX;
    var inkPannedY;
    /**
     * Pans all objects in the canvas by dx, dy.
     * @param dx, dy    the deltas
     * @param draw      should we take time to draw the objects?
     */
    function panObjects(dx, dy, canv_dims, draw) {
        var cw = canv_dims.cw;
        var ch = canv_dims.ch;
        var i;
        paper.forEach(function (elt) { // first take care of panning rects, ellipses, and texts by changing their attributes
            var type = elt.data("type");
            if ((type != "path") && (type != "bezier") && (type != "text") && (type != "trans")) {
                elt.attr({
                    'x': parseFloat(elt.attr("x")) + dx * cw,
                    'y': parseFloat(elt.attr("y")) + dy * ch,
                    'cx': parseFloat(elt.attr("cx")) + dx * cw,
                    'cy': parseFloat(elt.attr("cy")) + dy * ch,
                });
                if (type == "ellipse") {
                    elt.data("currx", parseFloat(elt.attr("cx")) - parseFloat(elt.attr("rx")));
                    elt.data("curry", parseFloat(elt.attr("cy")) - parseFloat(elt.attr("ry")));
                    elt.data("curr_rx", elt.attr("rx"));
                    elt.data("curr_ry", elt.attr("ry"));
                }
                else {
                    elt.data("currx", elt.attr("x"));
                    elt.data("curry", elt.attr("y"));
                }
            }
            else if (type == "text") {
                elt.attr({
                    'x': parseFloat(elt.attr("x")) + dx * cw,
                    'y': parseFloat(elt.attr("y")) + dy * ch,
                });
                elt.data('x', parseFloat(elt.data("x")) + dx * cw);
                elt.data('y', parseFloat(elt.data("y")) + dy * ch);
                inkPannedX = elt.attr('x');
                inkPannedY = elt.attr('y');
            }
        });

        // pan paths by modifying xy
        var xylen = xy.length;
        for (i = 0; i < xylen; i++) {
            xy[i][0] = xy[i][0] + dx;
            xy[i][1] = xy[i][1] + dy;
        }

        var coords, letters;
        coords = extractCoords(pathstring);
        letters = extractLetters(pathstring);
        for (i = 0; i < coords.length; i += 2) {
            coords[i] += dx;
            coords[i + 1] += dy;
        }
        pathstring = mergeToPath(letters, coords);

        // pan transparencies by modifying transCoords
        var tclen = transCoords.length;
        for (i = 0; i < tclen; i++) {
            transCoords[i] += ((i % 2) ? dy : dx);
        }

        // if type is drawing, call drawPaths if necessary
        if (xylen && draw)
            drawPaths();

        // if type is transparency, call drawTrans if ncecessary
        if (tclen && draw)
            drawTrans();

        if (pathstring && draw)
            drawBezierPath();

        // if the type of our ink is a text, redraw (if necessary) by just removing all and loading the datastring back in
        if (!xylen && !tclen && draw) {
            var dstring = update_datastring();
            remove_all();
            datastring = dstring;
            loadInk(datastring);
        }
    }
    that.panObjects = panObjects;

    function getPannedPos() {
        // used to return positional data for generating text in correct place
        var pannedPos = { x: inkPannedX, y: inkPannedY };
        return pannedPos;
    }
    that.getPannedPos = getPannedPos;

    /**
     * Pans all objects in the canvas by dx, dy.
     * @param dx, dy    the deltas
     * @param draw      should we take time to draw the objects?
     */
    function testPan(dx, dy, draw) {
        if (!draw) {
            paper.forEach(function (elt) {
                elt.transform("t-" + elt.data("bboxcenterx") + ",-" + elt.data("bboxcentery") + "...");
            });
        }
        else {
            paper.forEach(function (elt) {
                elt.transform("t" + (dx+elt.data("bboxcenterx")) + "," + (dy+elt.data("bboxcentery")) + "...");
            });
        }
    }
    that.testPan = testPan;

    function testScale(scale_x, scale_y, draw) {
        paper.forEach(function (elt) {
            var bbox = elt.getBBox();
            elt.transform("s" + scale_x + "...");
            elt.transform("t" + (-elt.getBBox().x) + "," + (-elt.getBBox().y)+"...");
            elt.transform("t" + (bbox.x*scale_x) + "," + (bbox.y*scale_y)+"...");
        });
    }
    that.testScale = testScale;

    /**
     * Sometimes points on the boundary of a shape do not register as being inside the shape, so check a few surrounding
     * points as well. If enough of them (2) are inside, call the point inside. This isn't bulletproof, but it should
     * work most of the time.
     * @param pth     the path whose boundary concerns us
     * @param x, y    coordinates of the point to test
     * @return    1 if enough points are inside, 0 otherwise
     */
    function point_inside(pth, x, y) {
        var test1 = Raphael.isPointInsidePath(pth, x, y);
        var test2 = Raphael.isPointInsidePath(pth, x - 1, y - 1);
        var test3 = Raphael.isPointInsidePath(pth, x + 1, y - 1);
        var test4 = Raphael.isPointInsidePath(pth, x - 1, y + 1);
        var test5 = Raphael.isPointInsidePath(pth, x + 1, y + 1);
        if (test1 || (test2 + test3 + test4 + test5 >= 2))
            return 1;
        return 0;
    }
    that.point_inside = point_inside;

    /**
     * Helper function to convert to relative coordinates.
     * @param abs_coord   the absolute coordinate
     * @param canv_dim    the relevant canvas dimension to scale by
     */
    function rel_dims(abs_coord, canv_dim) {
        return parseFloat(abs_coord) / parseFloat(canv_dim);
    }
    that.rel_dims = rel_dims;

    /**
     * Returns 1 if any points in order_added match pt.
     */
    function repeat_pt(pt, order_added) {
        for (var i = 0; i < order_added.length - 1; i++) {
            if (same_point(order_added[i].point, pt)) {
                return 1;
            }
        }
        return 0;
    }
    that.repeat_pt = repeat_pt;

    /**
     * Removes all Raphael elements from the canvas and clears arrays
     */
    function remove_all() {
        paper.clear();
        ml.length = 0;
        xy.length = 0;
        pa.length = 0;
        //pathObjects.length = 0;
        marquees.length = 0;
        //currpaths = "";
        datastring = '';
    }
    that.remove_all = remove_all;

    /**
     * Resizes all elements in the ink canvas.
     * @param scale_x, scale_y   the scale factors to resize by
     * @param draw               should we take the time to draw the result?
     */
    function resizeObjects(scale_x, scale_y, draw) {
        paper.forEach(function (elt) { // resize ellipses, rects, and texts by scaling attributes
            var type = elt.data("type");
            if ((type !== "path") && (type !== "bezier") && (type !== "text") && (type !== "trans") && (type !== "grabHandle")) {
                elt.attr({
                    'x': parseFloat(elt.attr("x")) * scale_x,
                    'y': parseFloat(elt.attr("y")) * scale_y,
                    'cx': parseFloat(elt.attr("cx")) * scale_x,
                    'cy': parseFloat(elt.attr("cy")) * scale_y,
                    'rx': parseFloat(elt.attr("rx")) * scale_x,
                    'ry': parseFloat(elt.attr("ry")) * scale_y,
                    'width': parseFloat(elt.attr("width")) * scale_x,
                    'height': parseFloat(elt.attr("height")) * scale_y,
                });
                if (type === "ellipse") {
                    elt.data("currx", parseFloat(elt.attr("cx")) - parseFloat(elt.attr("rx")));
                    elt.data("curry", parseFloat(elt.attr("cy")) - parseFloat(elt.attr("ry")));
                    elt.data("curr_rx", parseFloat(elt.attr("rx")));
                    elt.data("curr_ry", parseFloat(elt.attr("ry")));
                }
                else {
                    elt.data("currx", elt.attr("x"));
                    elt.data("curry", elt.attr("y"));
                }
            }
            else if (type === "text") {
                elt.attr({
                    'font-size': parseFloat(elt.attr("font-size")) * scale_y,
                    'x': elt.attr("x") * scale_x,
                    'y': elt.attr("y") * scale_y,
                });
                elt.data({
                    'fontsize': elt.data("fontsize") * scale_y,
                    'x': elt.data("x") * scale_x,
                    'y': elt.data("y") * scale_y,
                });
            }
        });

        // resize paths by scaling elements of xy
        var xylen = xy.length;
        var i;
        for (i = 0; i < xylen; i++) {
            xy[i][0] = xy[i][0] * scale_x;
            xy[i][1] = xy[i][1] * scale_y;
            pa[i].width = pa[i].width * scale_x;
        }

        var coords, letters;
        coords = extractCoords(pathstring);
        letters = extractLetters(pathstring);
        for (i = 0; i < coords.length; i += 2) {
            coords[i] *= scale_x;
            coords[i + 1] *= scale_y;
        }
        for (i = 0; i < pa.length; i++) {
            pa[i].width = pa[i].width * scale_x;
        }
        pathstring = mergeToPath(letters, coords);

        // resize transparencies by scaling elements of transCoords
        var tclen = transCoords.length;
        for (i = 0; i < tclen; i++) {
            transCoords[i] *= ((i % 2) ? scale_y : scale_x);
        }

        // call drawPaths or drawTrans to update paths and transparencies, respectively, if need be
        if (xylen && draw)
            drawPaths();
        if (tclen && draw)
            drawTrans();
        if (pathstring && draw)
            drawBezierPath();

        // update texts if need by by calling remove_all and then loading in the datastring
        if (!xylen && !tclen && draw) {
            var dstring = update_datastring();
            remove_all();
            datastring = dstring;
            loadInk(datastring);
        }
    }
    that.resizeObjects = resizeObjects;

    /**
     * Set the variables related to adjustViewBox (original artwork location) using the art proxy,
     * which keeps track of its dimensions
     */
    function retrieveOrigDims() {
        var proxy = $("[data-proxy='" + escape(artName) + "']");
        var kfx = initKeyframe.x;
        var kfy = initKeyframe.y;
        var kfw = initKeyframe.w;
        var real_kfw = origPaperW / kfw;
        var real_kfh = real_kfw * (proxy.data("h") / proxy.data("w"));
        var real_kfx = -kfx * real_kfw;
        var real_kfy = -kfy * real_kfh;
        origpx = real_kfx;
        origpy = real_kfy;
        origpw = real_kfw;
        origph = real_kfh;
        lastpx = origpx;
        lastpy = origpy;
        lastpw = origpw;
        lastph = origph;
    }
    that.retrieveOrigDims = retrieveOrigDims;

    /**
-     * Checks whether two points are effectively the same
     * @param pt1, pt2   the points in question
     * @param err        how close the points have to be to be considered the same
     * @return    whether or not the points are the same (true/false)
     */
    function same_point(pt1, pt2, err) {
        if (err === undefined)
            err = 0.00001;
        return (Math.abs(pt1.x - pt2.x) < err && Math.abs(pt1.y - pt2.y) < err);
    }
    that.same_point = same_point;

    /**
     * Helper function to convert a textbox to a Raphael text element. //========== should be deprecated
     */
    function save_text() {
        var x = svgText.left;// + parseFloat(textboxelmt.css("padding-left")); // a bit hacky -- we should figure out exactly how to compute text positioning
        var y = svgText.top;//tbe_pos.top;// + parseFloat(textboxelmt.css("padding-top")); // parseFloat(fontSize) * ((num_lines + 1) / 2.0) +
        var elt = paper.text(x, y, str); // draw the text on the canvas
        elt.attr("text-anchor", "start");
        var initX = elt.attr("x");
        var initY = elt.attr("y");
        var eltbbox=elt.getBBox();
        elt.data({
            x: initX + parseFloat(textboxelmt.css("padding-left")),//eltbbox.width / 2 + 
            y: initY + eltbbox.height + parseFloat(textboxelmt.css("padding-top")),
            font: fontFamily,
            fontsize: fontSize,
            color: fontColor,
            str: str,
            type: "text",
        });
        update_datastring();
    }
    that.save_text = save_text;

    /**
     * Setter for the artname of a linked ink's associated artwork
     */
    function setArtName(name) {
        artName = name;
    }
    that.setArtName = setArtName;

    /**
     * Set the svg element to handle all pointer events so we can draw on it
     * (and also to prevent manipulation of artwork during ink creation)
     */
    function set_editable() {
        var svgelt = getSVGElement();
        //svgelt.style.zIndex = -1;
        svgelt.style.background = "rgba(0, 0, 0, 0)";
        svgelt.style.pointerEvents = "all";
    }
    that.set_editable = set_editable;

    /**
     * Setter (sets experience id of ink)
     */
    function setExpId(inexpId) {
        expId = inexpId;
    }
    that.setexpId = setexpId;

    /**
     * Sets the initial artwork keyframe
     */
    function setInitKeyframeData(kf) {
        initKeyframe = kf;
    }
    that.setInitKeyframeData = setInitKeyframeData;

    /**
     * Sets the ink mode
     */
    function setMode(m) {
        mode = m;
    }

    /**
     * Similar to the retrieveOrigDims function, but uses a proxy variable.
     */
    function setOrigDims(proxy) {
        var kfx = initKeyframe.x;
        var kfy = initKeyframe.y;
        var kfw = initKeyframe.w;
        var real_kfw = origPaperW / kfw;
        var real_kfh = real_kfw * (proxy.h / proxy.w);
        var real_kfx = -kfx * real_kfw;
        var real_kfy = -kfy * real_kfh;
        origpx = real_kfx;
        origpy = real_kfy;
        origpw = real_kfw;
        origph = real_kfh;
        lastpx = origpx;
        lastpy = origpy;
        lastpw = origpw;
        lastph = origph;
    }
    that.setOrigDims = setOrigDims;

    function resetText() {
        datastring = "";
    }
    that.resetText = resetText;

    /**
     * Similar to addHighlightShapeAttributes, gives text boxes drag functionality, drag handles, and undo/redo functionality.
     * @param textbox   the text box in question
     */
    function setTextAttributes(textbox) {
        var C1; //drag handles
        var rds = TAG.TourAuthoring.Constants.inkDragHandleRadius;
        var x = textbox.attrs.x,
            y = textbox.attrs.y,
            origposition = { x: 0, y: 0, },
            c1origposition = { x: 0, y: 0, },
            boundingBox = textbox.getBBox();
        var handlerad = TAG.TourAuthoring.Constants.inkDragHandleRadius;

        // set the positions of C1 and C2 using the styling of textbox
        C1 = paper.ellipse(x, y, rds - 2, rds - 2).attr({ "stroke-width": 2, "stroke": "#ffffff", "fill": "#296B2F", "fill-opacity": 0.8 }).data("type", "grabHandle");
        C1.toFront();
        textbox.toFront();
        C1.data("curr_cx", C1.attr("cx"));
        C1.data("curr_cy", C1.attr("cy"));
        textbox.data({
            'x': x,
            'y': y,
        });

        // drag handler for C1 -- the pan handle.....
        C1.drag(function (dx, dy, mousex, mousey) { // move
            var circleRadius = C1.attr("rx");
            //Hard stops for textbox location in ink canvas
            if (origposition.x + dx <= circleRadius + 5) {
                dx = (circleRadius + 5) - origposition.x;
            }
            if (origposition.y + dy <= circleRadius + 5) {
                dy = (circleRadius + 5) - origposition.y;
            }
            if (origposition.x + dx >= canvwidth - (circleRadius + 5)) {
                dx = canvwidth - (circleRadius + 5) - origposition.x;
            }
            if (origposition.y + dy >= canvheight - (circleRadius + 5)) {
                dy = canvheight - (circleRadius + 5) - origposition.y;
            }

            var c1currx = parseInt(this.data("curr_cx"),10); // x position at the start of drag
            var c1curry = parseInt(this.data("curr_cy"),10);
            var xpos = c1currx + dx; // to get new x position, just add dx
            var ypos = c1curry + dy;
            this.attr({
                cx: xpos, // xcenter
                cy: ypos, // ycenter
            });

            // move the textbox
            textbox.attr("x", origposition.x + dx);
            textbox.attr("y", origposition.y + dy);
        },
        function (x, y) { // start -- record original positions
            origposition.x = parseFloat(textbox.attrs.x);
            origposition.y = parseFloat(textbox.attrs.y);

            var bbox = C1.getBBox();
            c1origposition.x = bbox.x;
            c1origposition.y = bbox.y;
            c1origposition.w = bbox.width;
            c1origposition.h = bbox.height;
        },
        function (x, y) { // stop -- deal with undo/redo functionality
            var c1bboxx = this.getBBox().x;
            var c1bboxy = this.getBBox().y;
            var c1bboxw = this.getBBox().width;
            var c1bboxh = this.getBBox().height;
            this.data("curr_cx", c1bboxx + c1bboxw / 2.0); // reset data using bounding box coords
            this.data("curr_cy", c1bboxy + c1bboxh / 2.0);

            textbox.data({
                "x": textbox.attrs.x,
                "y": textbox.attrs.y
            });

            var bboxx = parseFloat(textbox.attrs.x);
            var bboxy = parseFloat(textbox.attrs.y);

            c1bboxx = C1.getBBox().x;
            c1bboxy = C1.getBBox().y;
            c1bboxw = C1.getBBox().width;
            c1bboxh = C1.getBBox().height;

            var ox = origposition.x;
            var oy = origposition.y;
            var ow = origposition.w;
            var oh = origposition.h;

            var o1x = c1origposition.x;
            var o1y = c1origposition.y;
            var o1w = c1origposition.w;
            var o1h = c1origposition.h;

            var command = TAG.TourAuthoring.Command({
                execute: function () {
                    svgText.attr({ x: bboxx });
                    svgText.attr({ y: bboxy });
                    textbox.attr({ x: bboxx, y: bboxy });
                    textbox.data({ x: bboxx, y: bboxy });

                    C1.data("curr_cx", c1bboxx + c1bboxw / 2.0);
                    C1.data("curr_cy", c1bboxy + c1bboxh / 2.0);
                    C1.attr({
                        cx: c1bboxx + c1bboxw / 2.0,
                        cy: c1bboxy + c1bboxh / 2.0,
                        rx: c1bboxw / 2.0,
                        ry: c1bboxh / 2.0,
                    });
                },
                unexecute: function () {
                    svgText.attr({ x: ox });
                    svgText.attr({ y: oy });
                    textbox.attr({ x: ox, y: oy });
                    textbox.data({ x: ox, y: oy });

                    C1.data("curr_cx", o1x + o1w / 2.0);
                    C1.data("curr_cy", o1y + o1h / 2.0);
                    C1.attr({
                        cx: o1x + o1w / 2.0,
                        cy: o1y + o1h / 2.0,
                    });
                }
            });
            command.execute();
            inkUndoManager.logCommand(command);
        });
    }
    that.setTextAttributes = setTextAttributes;

    /**
     * Takes transparency bounding shapes and converts them to bezier paths
     * @param shapes     array of shapes to convert
     * @return    array of corresponding paths
     */
    function shapes_to_paths (shapes) {
        //takes in an array of shapes, returns an array of paths
        var cw = canvElt.width();
        var ch = canvElt.height();
        var paths = [];
        remove_all();/////////////////
        for (var i = 0; i < shapes.length; i++) {
            var shape = shapes[i];
            var path;
            var type = shape.type.toLowerCase();
            if (shape.type == "rect") { // in this case, bezier path is just four corners with bezier anchors along each segment
                var x = parseFloat(shape.X) / cw;
                var y = parseFloat(shape.Y) / ch;
                var w = parseFloat(shape.w) / cw;
                var h = parseFloat(shape.h) / ch;
                var xoff = 10.0 / cw;
                var yoff = 10.0 / ch;
                path = "M" + x + "," + y + "C" + (x + xoff) + "," + y + "," + (x + w - xoff) + "," + y + "," + (x + w) + "," + y + "C" + (x + w) + "," + (y + yoff) + "," + (x + w) + "," + (y + h - yoff) + "," + (x + w) + "," + (y + h) + "C" + (x + w - xoff) + "," + (y + h) + "," + (x + xoff) + "," + (y + h) + "," + (x) + "," + (y + h) + "C" + x + "," + (y + h - yoff) + "," + (x) + "," + (y + yoff) + "," + (x) + "," + (y) + "z";
            }
            else if (shape.type == "ellipse") { // bezier path is four points (north, east, south, west) with bezier anchors vertical/horizonal from the points a certain distance (given by the 'magic number' below)
                var cx = parseFloat(shape.cx) / cw;
                var cy = parseFloat(shape.cy) / ch;
                var rx = parseFloat(shape.rx) / cw;
                var ry = parseFloat(shape.ry) / ch;
                var k = (4.0 / 3.0) * (Math.sqrt(2) - 1); // 'magic number' defining bezier anchor coordinates for ellipses
                path = "M" + cx + "," + (cy - ry) + "C" + (cx + rx * k) + "," + (cy - ry) + "," + (cx + rx) + "," + (cy - ry * k) + "," + (cx + rx) + "," + cy + "C" + (cx + rx) + "," + (cy + ry * k) + "," + (cx + rx * k) + "," + (cy + ry) + "," + cx + "," + (cy + ry) + "C" + (cx - rx * k) + "," + (cy + ry) + "," + (cx - rx) + "," + (cy + ry * k) + "," + (cx - rx) + "," + cy + "C" + (cx - rx) + "," + (cy - ry * k) + "," + (cx - rx * k) + "," + (cy - ry) + "," + cx + "," + (cy - ry) + "z";
            }
            paths.push(path);
        }
        get_outer_path(paths);
        return paths;
    }
    that.shapes_to_paths = shapes_to_paths;

    /**
     * Debugging function; prints out the ink path in our ink track
     */
    function showInkPath() {
        try {
            console.log("showInkPath gives: " + inkTrack.getInkPath());
        }
        catch (err) {
            console.log("error in showInkPath: " + err.message);
        }
    }
    that.showInkPath = showInkPath;

    /**
     * Scales a path representing a transparency/marquee.
     * @param pth               the path whose coordinates we'll scale
     * @param trans_factor_x    scale factor in x-direction
     * @param trans_factor_y    scale factor in y-direction
     * @return   scaled path
     */
    function transform_pathstring_marq (pth, trans_factor_x, trans_factor_y) {
        var nums = pth.match(/[0-9.\-]+/g); // gets coordinates from path
        var newpath = "";
        var j = 0, n = pth.length;
        for (var i = 0; i < n; i++) {
            if ((pth[i] == "M") || (pth[i] == "L")) { // if M or L, need to scale next two coords
                newpath = newpath + pth[i];
                newpath += (parseFloat(nums[j]) * trans_factor_x).toFixed(6) + ",";
                newpath += (parseFloat(nums[j + 1]) * trans_factor_y).toFixed(6);
                j = j + 2;
            }
            else if (pth[i] == "C") { // if C, need to scale next six coords
                newpath = newpath + pth[i];
                newpath += (parseFloat(nums[j]) * trans_factor_x).toFixed(6) + ",";
                newpath += (parseFloat(nums[j + 1]) * trans_factor_y).toFixed(6) + ",";
                newpath += (parseFloat(nums[j + 2]) * trans_factor_x).toFixed(6) + ",";
                newpath += (parseFloat(nums[j + 3]) * trans_factor_y).toFixed(6) + ",";
                newpath += (parseFloat(nums[j + 4]) * trans_factor_x).toFixed(6) + ",";
                newpath += (parseFloat(nums[j + 5]) * trans_factor_y).toFixed(6);
                j = j + 6;
            }
            else if (pth[i] == "z") { // if z, close path
                newpath += "z";
            }
        }
        return newpath;
    }
    that.transform_pathstring_marq = transform_pathstring_marq;

    /**
     * Returns a string giving all necessary information to recreate the current scene.
     * The result is stored in ink tracks as the 'datastring.' Also used throughout
     * InkAuthoring to make sure we have an up to date datastring. The formats for each
     * type of ink is given below (note that the trailing '[]' makes it easier to parse).
     * Note that the MARQUEE type is deprecated -- it has been replaced by TRANS type
     * transparencies represented by paths rather than collections of rectangles. The
     * BOUNDRECT and BOUNDELLIPSE types are for reloading rectangles and ellipses when we
     * edit transparencies (their formats are identical to RECT/ELLIPSE). All coordinates are relative.
     *
     *   PATH::[pathstring]<svg path string>[stroke]<color>[strokeo]<opacity>[strokew]<width>[]
     *   RECT::[x]<x>[y]<y>[w]<width>[h]<height>[fillc]<color>[fillo]<opac>[strokec]<color>[strokeo]<opac>[strokew]<width>[]
     *   ELLIPSE::[cx]<center x>[cy]<center y>[rx]<x radius>[ry]<y radius>[fillc]<color>[fillo]<opac>[strokec]<color>[strokeo]<opac>[strokew]<width>[]
     *   MARQUEE::[x]<x>[y]<y>[w]<width>[h]<height>[surrfillc]<fill color>[surrfillo]<fill opac>[]
     *   TEXT::[str]<text>[font]<font>[fontsize]<fontsize>[color]<font color>[x]<x>[y]<y>[w]<width>[h]<height>[]
     *   TRANS::[path]<path>[color]<color>[opac]<opac>[mode]<block or isolate>[]
     *   BOUNDRECT::[x]<x>[y]<y>[w]<width>[h]<height>[fillc]<color>[fillo]<opac>[strokec]<color>[strokeo]<opac>[strokew]<width>[]
     *   BOUNDELLIPSE::[cx]<center x>[cy]<center y>[rx]<x radius>[ry]<y radius>[fillc]<color>[fillo]<opac>[strokec]<color>[strokeo]<opac>[strokew]<width>[]
     *
     * @return    up to date datastring
     */
    function update_datastring () {
        var data_string = "";
        var canv_width = canvElt.width();
        var canv_height = canvElt.height();
        var pth;
        //if (currpaths) { // add pen paths to datastring
        //    if (currpaths.split("Mundefined").length > 1)
        //        currpaths = currpaths.split("Mundefined").join("");
        //    data_string += currpaths;
        //}
        if (trans_currpath) { // add transparency paths to datastring
            data_string += trans_currpath;
        }
        if (cpathstring) {
            data_string += cpathstring.replace(/undefined/g, '');
        }

        paper.forEach(function (elt) { // now check the canvas for rectangles, ellipses, text, old marquees
            if (elt.data("type") === "rect" && elt.data("visible") === "yes") {
                pth = "RECT::[x]" + rel_dims(elt.attr("x"), canv_width) + "[y]" + rel_dims(elt.attr("y"), canv_height);
                pth += "[w]" + rel_dims(elt.attr("width"), canv_width) + "[h]" + rel_dims(elt.attr("height"), canv_height);
                pth += "[fillc]" + elt.attr("fill") + "[fillo]" + elt.attr("fill-opacity");
                pth += "[strokec]" + elt.attr("stroke") + "[strokeo]" + elt.attr("stroke-opacity") + "[strokew]" + elt.attr("stroke-width") + "[]";
                data_string += pth + "|";
            }
            else if (elt.data("type") === "ellipse" && elt.data("visible") === "yes") {
                pth = "ELLIPSE::[cx]" + rel_dims(elt.attr("cx"), canv_width) + "[cy]" + rel_dims(elt.attr("cy"), canv_height);
                pth += "[rx]" + rel_dims(elt.attr("rx"), canv_width) + "[ry]" + rel_dims(elt.attr("ry"), canv_height);
                pth += "[fillc]" + elt.attr("fill") + "[fillo]" + elt.attr("fill-opacity");
                pth += "[strokec]" + elt.attr("stroke") + "[strokeo]" + elt.attr("stroke-opacity") + "[strokew]" + elt.attr("stroke-width") + "[]";
                data_string += pth + "|";
            }
            else if (elt.data("type") === "marquee") { //old marquees
                pth = "MARQUEE::[x]" + rel_dims(elt.attr("x"), canv_width);
                pth = pth + "[y]" + rel_dims(elt.attr("y"), canv_height);
                pth += "[w]" + rel_dims(elt.attr("width"), canv_width) + "[h]" + rel_dims(elt.attr("height"), canv_height);
                pth += "[surrfillc]" + elt.data("surr-fill") + "[surrfillo]" + elt.data("surr-opac") + "[]";
                data_string += pth + "|";
            }
            else if (elt.data("type") === "text") {
                pth = "TEXT::[str]" + elt.data("str")
                    + "[font]" + elt.data("font")
                    + "[fontsize]" + rel_dims(elt.data("fontsize"), canv_height) //scale font-size
                    + "[color]" + elt.data("color")
                    + "[x]" + rel_dims(elt.data("x"), canv_width)
                    + "[y]" + rel_dims(elt.data("y"), canv_height)
                    + "[w]" + elt.data('w')
                    + "[h]" + elt.data('h')
                    + "[]";
                data_string += pth + "|";
            }
        });
        datastring = data_string;
        return data_string;
    }
    that.update_datastring = update_datastring;

    /**
     * The following are setters for various ink parameters
     * @param _    the value to be set to the corresponding ink parameter
     */
    function setPenColor(c) { penColor = (c[0] == '#') ? c : ("#" + c); }
    function setPenOpacity(o) { penOpacity = o; }
    function setPenWidth(w) { penWidth = w; }
    function setEraserWidth(w) { eraserWidth = w; }
    function setMarqueeFillColor(c) { marqueeFillColor = (c[0] == '#') ? c : ("#" + c); }
    function setMarqueeFillOpacity(o) { marqueeFillOpacity = o; }
    function setEnabled(en) { isAttached = end; }
    function setFontFamily(f) {
        fontFamily = f;
        if (svgText) {
            svgText.attr({
                "font-family": fontFamily,
            });
            svgText.data({
                "font": fontFamily,
            });
        }
    }
    function setFontSize(f) {
        // set the value to "", change font size, reset the value so we can see the results in real-time
        fontSize = f;
        if (svgText) {
            svgText.attr({
                "font-size": fontSize
            });
            svgText.data({
                "fontsize": fontSize
            });
        }
    }
    function setFontColor(f) {
        fontColor = (f[0] == '#') ? f : ("#" + f);
        if (svgText) {
            svgText.attr({
                "fill": fontColor
            });
            svgText.data({
                "color": fontColor
            });
        }
    }
    function setFontOpacity(f) { fontOpacity = f; }
    function setTransMode(m) { trans_mode = m; }

    that.setPenColor = setPenColor;
    that.setPenOpacity = setPenOpacity;
    that.setPenWidth = setPenWidth;
    that.setEraserWidth = setEraserWidth;
    that.setMarqueeFillColor = setMarqueeFillColor;
    that.setMarqueeFillOpacity = setMarqueeFillOpacity;
    that.setEnabled = setEnabled;
    that.setFontFamily = setFontFamily;
    that.setFontSize = setFontSize;
    that.setFontColor = setFontColor;
    that.setFontOpacity = setFontOpacity;
    that.setTransMode = setTransMode;

    /**
     * The following are getters for different ink parameters.
     */
    function getPenColor() { return penColor; }
    function getPenOpacity() { return penOpacity; }
    function getPenWidth() { return penWidth; }
    function getEraserWidth() { return eraserWidth; }
    function getMarqueeFillColor() { return marqueeFillColor; }
    function getMarqueeFillOpacity() { return marqueeFillOpacity; }
    function getEnabled() { return isAttached; }
    function getFontFamily() { return fontFamily; }
    function getFontSize() { return fontSize; }
    function getFontColor() { return fontColor; }
    function getFontOpacity() { return fontOpacity; }
    function getTransMode() { return trans_mode; }

    that.getPenColor = getPenColor;
    that.getPenOpacity = getPenOpacity;
    that.getPenWidth = getPenWidth;
    that.getEraserWidth = getEraserWidth;
    that.getMarqueeFillColor = getMarqueeFillColor;
    that.getMarqueeFillOpacity = getMarqueeFillOpacity;
    that.getEnabled = getEnabled;
    that.getFontFamily = getFontFamily;
    that.getFontSize = getFontSize;
    that.getFontColor = getFontColor;
    that.getFontOpacity = getFontOpacity;
    that.getTransMode = getTransMode;


    //////// NEW PATH SMOOTHING CODE //////////
    var points = [],
        roughPoints = [],
        paper,
        thresh = 8,
        closeThresh = 5,
        canBeClosed = false,
        pathstring = "",
        closeCircle,
        old_points = [],
        old_pa = [],
        cpathstring = "",
        old_pathstring = '',
        canvW, canvH;
    canvElt.on('mousedown', mstart);
    canvElt.on('mouseenter', function() { // change cursor styling here
        canvElt.css('cursor', ((mode == 1) || (mode == 2)) ? 'crosshair' : 'pointer');
    });

    function distance(pt1, pt2, cw, ch) {
        var dx = (pt1[0] - pt2[0]) * (cw || 1);
        var dy = (pt1[1] - pt2[1]) * (ch || 1);
        return Math.sqrt(dx*dx + dy*dy);
    }

    // get array of coordinates from a pathstring (x, y, x, y, ...)
    function extractCoords(pthstr) {
        var strCoords = pthstr.match(/[0-9.\-]+/g) || [];
        var coords = [];
        for (var i = 0; i < strCoords.length; i++) {
            coords.push(parseFloat(strCoords[i]));
        }
        return coords;
    }

    // get array of letters from a pathstring ('M', 'R', ' ', ' ', 'M', 'L', ...)
    function extractLetters(pthstr) {
        return pthstr.match(/[MLR ]/g) || [];
    }

    // merge a coordinate array and a letter array to produce a pathstring
    function mergeToPath(letters, coords) {
        var merged = "", i;
        for (i = 0; i < letters.length; i++) {
            merged += letters[i] + coords[2 * i] + "," + coords[2 * i + 1];
        }
        //points = coords.slice(0);
        return merged;
    }

    function saveOldValues() {
        old_pa = pa.slice(0);
        old_pathstring = pathstring;
    }

    // called on mousedown to start drawing
    function mstart(e) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        if (!(mode === 1 || mode === 2)) return;
        canvW = viewerElt.width(),
        canvH = viewerElt.height();
        
        click = true;
        points.length = 0;
        roughPoints.length = 0;

        // for undo/redo
        saveOldValues();

        if (mode === 1) { // draw
            pa.push({ color: penColor, opacity: penOpacity, width: penWidth / canvH });
            points.push([e.offsetX/canvW, e.offsetY/canvH]);
            constructBezierPath();
        } else if (mode === 2) { // erase
            eraseBezier([e.offsetX, e.offsetY]);
            drawBezierPath();
        }
        
        canvElt.on('mousemove', mmove);
        canvElt.on('mouseup', mend);
        canvElt.on('mouseleave', mend);
    }

    // called on mousemove to continue drawing
    function mmove(e) {
        var len = points.length,
            pt = [e.offsetX / canvW, e.offsetY / canvH],
            ptAbs = [e.offsetX, e.offsetY];
        if (mode === 1) { // draw
            //console.log("ptAbs = " + ptAbs[0] + "," + ptAbs[1]);
            if (len === 0 || distance(ptAbs, [points[len - 1][0]*canvW, points[len-1][1]*canvH]) > thresh) {
                roughPoints.length = 0;
                points.push(pt);
                constructBezierPath();
            } else {
                roughPoints.push(pt);
                constructBezierPath();
            }
            //drawBezierPath();
        } else if (mode === 2) { // erase
            eraseBezier([e.offsetX, e.offsetY]);
            drawBezierPath();
        }
    }

    // called on mouseup and mouseleave to stop drawing
    function mend(e) {
        if (points.length > 0) {
            constructBezierPath(true);
        }
        click = false;
        points.length = 0;
        roughPoints.length = 0;
        canvElt.off('mousemove');
        canvElt.off('mouseup');
        canvElt.off('mouseleave');
        var new_data = { pathstring: pathstring, pa: pa };
        var old_data = { pathstring: old_pathstring, pa: old_pa };
        var command = TAG.TourAuthoring.Command({
            execute: function () {
                pathstring = new_data.pathstring;
                pa = new_data.pa.slice(0);
                drawBezierPath();
            },
            unexecute: function () {
                pathstring = old_data.pathstring;
                pa = old_data.pa.slice(0);
                drawBezierPath();
            }
        });
        command.execute();
        inkUndoManager.logCommand(command);

        //console.log('pathstring = '+pathstring);
    }

    // draws either the given path or pathstring if none is provided
    function drawBezierPath(str) {
        var cw = viewerElt.width();
        var ch = viewerElt.height();
        var pathsToDraw=[], pathsToSave='', pathToDraw='';
        var raphaelpath = '',
            roughpath='',
            i, path, circle;
        str = str || pathstring;
        paper.clear();
        if (!str) return;
        var MRL = extractLetters(str);
        var coords = extractCoords(str);
        
        var paCount = 0;
        for (i = 0; i < MRL.length; i++) { //construct the paths
            if (MRL[i] === 'M') {
                pathsToSave += "BEZIER::[pathstring]";
            }
            //console.log("ch*coords["+(2*i+1)+"] = "+ch*coords[2*i+1]);
            pathToDraw += MRL[i] + (cw * coords[2*i]) + ',' + (ch * coords[2*i+1]); // absolute coords
            pathsToSave += MRL[i] + coords[2*i] + ',' + coords[2*i+1]; // relative coords
            if (MRL[i + 1] === 'M' || i === MRL.length - 1) {
                pathsToDraw.push(pathToDraw);
                pathToDraw = '';
                pathsToSave += "[stroke]" + pa[paCount].color + "[strokeo]" + pa[paCount].opacity + "[strokew]" + pa[paCount].width + "[]|";
                paCount++;
            }
        }
        //console.log("to save: "+pathsToSave);
        for (i = 0; i < pathsToDraw.length; i++) { // need to split up the paths so we can style each separately
            //console.log("to draw: " + pathsToDraw[i]);
            var drawing = paper.path(pathsToDraw[i]); // draw the path to the canvas
            drawing.data("type", "bezier");
            drawing.attr({
                "stroke-width": pa[i].width * ch,
                "stroke-opacity": pa[i].opacity,
                "stroke": pa[i].color,
                "stroke-linejoin": "round",
                "stroke-linecap": "round"
            });
        }
        cpathstring = pathsToSave; // currpaths is used in update_datastring as the string representing all paths on the canvas
    }
    that.drawBezierPath = drawBezierPath;

    // constructs bezier path to draw
    function constructBezierPath(clip) {
        var raphaelpath = '',
            roughpath = '',
            i, path, circle, len = points.length, rlen = roughPoints.length,
            p1x = points[0][0], p1y = points[0][1],
            rp1x, rp1y, matches;
        
        if (len === 1) {
            raphaelpath = "M"+p1x+","+p1y+"L"+p1x+","+p1y;
        } else if (len === 2) {
            raphaelpath = "M" + p1x + "," + p1y + "L" + points[1][0] + "," + points[1][1];//+" "+points[1][0]+","+points[1][1];
        } else if (len > 2) {
            raphaelpath = "M"+p1x+","+p1y+"R";
            for (i = 1; i < len; i++) {
                raphaelpath+=((i===1) ? "" : " ")+points[i][0]+","+points[i][1];
            }
        }
        if (rlen > 0) {
            rp1x = roughPoints[0][0];
            rp1y = roughPoints[0][1];
            if(len > 0) {
                for (i = 0; i < rlen; i++) {
                    roughpath+=" "+roughPoints[i][0]+","+roughPoints[i][1];
                }
            } else {
                if (rlen === 1) {
                    roughpath = "M" + rp1x + "," + rp1y + "L" + rp1x + "," + rp1y;
                }
                else if (rlen === 2) {
                    roughpath = "M" + rp1x + "," + rp1y + "L" + roughPoints[1][0] + "," + roughPoints[1][1];
                } else {
                    roughpath = "M" + rp1x + "," + rp1y + "R";
                    for (i = 1; i < rlen; i++) {
                        roughpath += ((i === 1) ? "" : " ") + roughPoints[i][0] + "," + roughPoints[i][1];
                    }
                }
            }
        }
        if(clip) {
            pathstring += raphaelpath;
            matches = pathstring.match(/[MLR ]/g);
            if (matches && matches[matches.length - 1] !== 'L') {
                pathstring += (rlen === 0) ? "" : " " + roughPoints[rlen - 1][0] + "," + roughPoints[rlen - 1][1];
            }
            drawBezierPath();
        } else {
            drawBezierPath(pathstring+raphaelpath+roughpath);
        }
    }

    // erase a portion of the bezier path
    function eraseBezier(location) {
        if (!pathstring) return;
        var cw = canvElt.width(),
            ch = canvElt.height(),
            coords = extractCoords(pathstring),
            letters = extractLetters(pathstring),
            currentPAIndex = -1;
        //console.log("start pathstring = " + pathstring);
        for (var i = 0; i < letters.length; i++) { // for each coordinate, test for proximity to location
            if (letters[i] === 'M') {
                currentPAIndex++;
            }
            if (distance(location,[cw*coords[2*i], ch*coords[2*i+1]]) < eraserWidth) {
                if (letters[i] === 'M') {
                    if (letters[i + 1] === 'R') {
                        if (letters[i + 3] === 'M' || !letters[i + 3]) { // here, we have M-R-_-M, turn to gone-M-L-M
                            //console.log('case 1');
                            letters.splice(i, 3, 'M', 'L');
                            coords.splice(2*i, 2);
                        } else { // here, M-R-_-_, turn to gone-M-R-_
                            //console.log('case 2');
                            letters.splice(i, 3, 'M', 'R');
                            coords.splice(2 * i, 2);
                        }
                    } else if (letters[i + 1] === 'L') { // M-L-M or M-L-done, turn to gone-M or gone-done
                        //console.log('case 3');
                        letters.splice(i, 2);
                        coords.splice(2 * i, 4);
                        pa.splice(currentPAIndex, 1);
                    }
                } else if (letters[i] === 'L') { // M-L, turn to gone
                    //console.log('case 4');
                    letters.splice(i - 1, 2);
                    coords.splice(2 * (i - 1), 4);
                    pa.splice(currentPAIndex, 1);
                } else if (letters[i] === 'R') {
                    if (letters[i + 2] === 'M' || !letters[i + 2]) { // M-R-_-M or M-R-_-done, turn to gone-M or gone
                        //console.log('case 5');
                        letters.splice(i - 1, 3);
                        coords.splice(2 * (i - 1), 6);
                        pa.splice(currentPAIndex, 1);
                    } else if (letters[i+3] ===' ') { // M-R-_-_-_-, turn to M-R-_-
                        //console.log('case 6');
                        letters.splice(i - 1, 4,'M','R');
                        coords.splice(2 * (i - 1), 4);
                    } else {
                        //console.log('case 6.5');
                        letters.splice(i - 1, 4, 'M', 'L');
                        coords.splice(2 * (i - 1), 4);
                    }
                } else if (letters[i] === " ") {
                    if (letters[i + 1] === 'M' || !letters[i + 1]) {
                        if (letters[i - 1] === 'R') { // M-R-_-M or M-R-_-M, turn to gone-M or gone
                            //console.log('case 7');
                            letters.splice(i - 2, 3);
                            coords.splice(2 * (i - 2), 6);
                            pa.splice(currentPAIndex, 1);
                        } else { // R-_-_-M or R-_-_, turn to R-_
                            //console.log('case 8');
                            letters.splice(i, 1);
                            coords.splice(2 * i, 2);
                        }
                    } else if (letters[i + 1] === ' ' && letters[i + 2] === ' ' && letters[i + 3] === ' ') { // R-_-*-_, turn to R-_-M-R-_
                        //console.log('case 8.1');
                        letters.splice(i, 3, "M", "R");
                        coords.splice(2 * i, 2);
                        pa.splice(currentPAIndex,0,pa[currentPAIndex]);
                    } else if (letters[i + 1] === ' ' && letters[i + 2] === ' ') {
                        //console.log('case 8.2');
                        letters.splice(i,3,"M","L");
                        coords.splice(2 * i, 2);
                        pa.splice(currentPAIndex, 0, pa[currentPAIndex]);
                    } else if (letters[i + 1] === ' ') {
                        //console.log('case 8.3');
                        letters.splice(i,2);
                        coords.splice(2*i,4);
                    } else {
                        //console.log('case 8.4');
                        letters.splice(i,1);
                        coords.splice(2*i,2);
                    }
                }
                //break;
            }
        }
        currentPAIndex = -1;
        var lastM = 0;
        for (i = 0; i < letters.length; i++) {
            if (letters[i] === 'M') {
                lastM = i;
                currentPAIndex++
                if (letters[i + 1] === 'R' && letters[i + 2] !== ' ') {
                    letters.splice(i, 2);
                    coords.splice(2 * i, 4);
                    i--;
                    pa.splice(currentPAIndex, 1);
                    currentPAIndex--;
                    lastM--;
                    continue;
                }
            }
            if (isNaN(coords[2 * i]) || isNaN(coords[2 * i + 1])) {
                for (var j = 0; j < letters.length - i; j++) {
                    if (letters[j + 1] === 'M' && !letters[j + 1]) {
                        letters.splice(lastM, i + j - lastM);
                        coords.splice(2 * lastM, 2 * (i + j - lastM));
                        pa.splice(currentPAIndex, 1);
                        currentPAIndex--;
                        i = lastM;
                        continue;
                    }
                }
            }
        }
        pathstring = mergeToPath(letters, coords);
        if (pathstring.match(/undefined/) || (pathstring && pathstring[0] !== 'M')) {
            console.log('uh oh');
        }
    }

    // setter for distance between bezier points
    function setThresh(val) {
        thresh = parseInt(val, 10);
    }

    // setter for close path threshold
    function setCloseThresh(val) {
        closeThresh = parseInt(val, 10);
    }
    //////////////////////////////////////////

    // allow drawing on the Raphael paper by recording mouse locations on mousemove events, add coordinates to xl (similar with erase) (old code removed)
    var old_pa = [], canvwidth, canvheight;
    
    return that;
};
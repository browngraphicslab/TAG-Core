window.ITE = window.ITE || {};

ITE.Utils = function(){ //contains utility functions

    this.extendsPrototype = function(newClass, superClass) {
       for(i in superClass){
          newClass[i] = superClass[i];        
       }
    };

    this.sanitizeConfiguration = function (playerConfiguration, options){
        if (typeof options.attachVolume === 'boolean'){
            playerConfiguration.attachVolume  = options.attachVolume;
        }
        if (typeof options.attachLoop === 'boolean'){
            playerConfiguration.attachLoop  = options.attachLoop;
        }
        if (typeof options.attachPlay === 'boolean'){
            playerConfiguration.attachPlay  = options.attachPlay;
        }
        if (typeof options.attachProgressBar === 'boolean'){
            playerConfiguration.attachProgressBar  = options.attachProgressBar;
        }
        if (typeof options.attachFullScreen === 'boolean'){
            playerConfiguration.attachFullScreen  = options.attachFullScreen;
        }
        if (typeof options.attachProgressIndicator === 'boolean'){
            playerConfiguration.attachProgressIndicator  = options.attachProgressIndicator;
        }
        if (typeof options.hideControls === 'boolean'){
            playerConfiguration.hideControls  = options.hideControls;
        }
        if (typeof options.autoPlay === 'boolean'){
            playerConfiguration.autoPlay  = options.autoPlay;
        }
        if (typeof options.autoLoop === 'boolean'){
            playerConfiguration.autoLoop  = options.autoLoop;
        }
        if (typeof options.setMute === 'boolean'){
            playerConfiguration.setMute  = options.setMute;
        }
        if ((typeof options.setInitVolume === 'number') && (0 < options.setInitVolume) && (100 > options.setInitVolume)){
            playerConfiguration.setInitVolume  = options.setInitVolume;
        }
        if (typeof options.allowSeek === 'boolean'){
            playerConfiguration.allowSeek  = options.allowSeek;
        }
        if (typeof options.setFullScreen === 'boolean'){
            playerConfiguration.setFullScreen  = options.setFullScreen;
        }
        if (typeof options.setStartingOffset === 'number'){
            playerConfiguration.setStartingOffset  = options.setStartingOffset;
        }
    }
};

/*************/
window.ITE = window.ITE || {};

var TAG = TAG || {},
    Worktop = Worktop || {};

//TAG Utilities
TAG.Util = (function () {
    "use strict";

    var tagContainerId = 'tagRoot';

    //TAG.Util public methods and members
    return {
        makeNamespace: namespace,
        setToDefaults: setToDefaults,
        getGestureRecognizer: getGestureRecognizer,
        makeXmlRequest: makeXmlRequest,
        makeManipulatable: makeManipulatable,
        makeManipulatableWin: makeManipulatableWin,
        applyD3DataRec: applyD3DataRec,
        elementInDocument: elementInDocument,
        fitText: fitText,
        encodeText: encodeText,
        disableDrag: disableDrag,
        getFontSize: getFontSize,
        showLoading: showLoading,
        hideLoading: hideLoading,
        removeProgressCircle: removeProgressCircle,
        showProgressCircle: showProgressCircle,
        createQueue: createQueue,
        createDoubleEndedPQ: createDoubleEndedPQ,
        replaceSVGImg: replaceSVGImg,
        getMaxFontSizeEM: getMaxFontSizeEM,
        encodeXML: encodeXML,
        constrainAndPosition: constrainAndPosition,
        getFieldValueFromMetadata: getFieldValueFromMetadata,
        formatAddress: formatAddress,
        safeCall: safeCall,
        safeCallHandler: safeCallHandler,
        multiFnHandler: multiFnHandler,
        contains: contains,
        defaultVal: defaultVal,
        searchData: searchData,
        searchString: searchString,
        saveThumbnail: saveThumbnail,
        htmlEntityEncode: htmlEntityEncode,
        htmlEntityDecode: htmlEntityDecode,
        videoErrorHandler: videoErrorHandler,
        getHtmlAjax: getHtmlAjax,
        localVisibility: localVisibility
    };

    /* 
    constrainAndPosition takes in a set of relative and absolute 
    constraints and positioning as well as an HTML element and 
    its intended container, and returns a dictionary of position 
    and sizing data which conforms to the specified requirements.
    For this to work, the container must already be initialized 
    to its correct size.

    Possible constraints for propertySpec object:
    width: w 
        // mandatory, target relative width as decimal percent
    height: h 
        // mandatory, target relative height as decimal percent

    max_height: max_h 
        // optional, max absolute height in px 
        // ignored if unspecified
    max_width: max_w 
        // optional, max absolute width in px
        // ignored if unspecified

    x_offset: x_off 
        // optional, relative offset from left border of container as decimal percent
        // ignored if unspecified
    y_offset: y_off 
        // optional, relative offset from top border of container as decimal percent
        // ignored if unspecified

    x_max_offset: x_max_off 
        // optional, max absolute offset from left border of container in px
        // ignored if unspecified
    y_max_offset: y_max_off 
        // optional, max absolute offset from top border of container in px
        // ignored if unspecified

    center_h: center_h 
        // optional, boolean indicating whether element should be horizontally centered
        // defaults to false if unspecified
        // overrides any x-offset/x-max-offset as well as align_right if set to true
    center_v: center_v 
        // optional, boolean indicating whether element should be vertically centered
        // defaults to false if unspecified
        // overrides any y-offset/y-max-offset as well as align_bottom if set to true

    align_right: align_right
        // optional, boolean indicating whether element should be aligned from the right
        // NOTE: in this mode, positive offset values work like negative values in that they 
        // will shift the element leftwards TOWARDS THE CENTER, not the right.
    align_bottom: align_bottom
        // optional, boolean indicating whether element should be aligned from the bottom
        // NOTE: in this mode, positive offset values work like negative values in that they 
        // will shift the element upwards TOWARDS THE CENTER, not the bottom.
    */
    function constrainAndPosition(container_width, container_height, propertySpec) {
        var adjustedProperties,
            center_h = propertySpec.center_h || false,
            center_v = propertySpec.center_v || false;

        var cw = container_width,
            ch = container_height;

        var adjHeight, adjWidth;
        if (propertySpec.max_height) {
            // constrain to max height if specified
            adjHeight = Math.min(propertySpec.height * ch, propertySpec.max_height);
        } else {
            adjHeight = propertySpec.height * ch;
        }

        if (propertySpec.max_width) {
            // constrain to max width if specified
            adjWidth = Math.min(propertySpec.width * cw, propertySpec.max_width);
        } else {
            adjWidth = propertySpec.width * cw;
        }

        var xPos, yPos;
        // horizontal (x) value determined based on alignment/centering and offsets
        if (center_h) {
            // if horizontal centering enabled, account for in processing of x-offset
            if (propertySpec.x_max_offset) {
                // if max offset specified
                xPos = 0.5 * (cw - adjWidth) + Math.min(propertySpec.x_offset * cw, propertySpec.x_max_offset);
            } else {
                // if unspecified, ignore
                xPos = 0.5 * (cw - adjWidth);
            }

        } else {
            // otherwise, take care of offset from horiz axis
            if (propertySpec.x_max_offset) {
                // if max offset specified
                if (propertySpec.align_right) {
                    // if right alignment also specified, factor in width of object 
                    // and subtract offset from container width
                    xPos = cw - Math.min(propertySpec.x_offset * cw, propertySpec.x_max_offset) - adjWidth;
                } else {
                    // otherwise just select offset based on minimum of relative and absolute constraints
                    xPos = Math.min(propertySpec.x_offset * cw, propertySpec.x_max_offset);
                }
            } else {
                // if unspecified, ignore
                xPos = propertySpec.x_offset * cw;
            }
        }

        // vertical (y) value determined based on alignment/centering and offsets
        if (center_v) {
            // if vertically centering enabled, account for in processing of y-offset
            if (propertySpec.y_max_offset) {
                // if max offset specified
                yPos = 0.5 * (ch - adjHeight) + Math.min(propertySpec.y_offset * ch, propertySpec.y_max_offset);
            } else {
                // if unspecified, ignore
                yPos = 0.5 * (ch - adjHeight);
            }  
            
        } else {
            //otherwise, take care of offset from vertical axis
            if (propertySpec.y_max_offset) {
                // if max offset specified
                if (propertySpec.align_bottom) {
                    // if bottom alignment also specified, factor in width of object 
                    // and subtract offset from container high
                    yPos = ch - Math.min(propertySpec.y_offset * ch, propertySpec.y_max_offset) - adjHeight;
                } else {
                    // otherwise just select offset based on minimum of relative and absolute constraints
                    yPos = Math.min(propertySpec.y_offset * ch, propertySpec.y_max_offset);
                }
            } else {
                // if unspecified, ignore
                yPos = propertySpec.y_offset * ch;
            }
        }
        
        adjustedProperties = {
            height: adjHeight,
            width: adjWidth,
            x: xPos,
            y: yPos,
        };
        
        return adjustedProperties;
    }

    // Sets the default value of an input to val
    // If the input loses focus when it's empty it will revert
    // to val.  Additionally, if hideOnClick is true then
    // if the value is val and the input gains focus it will be
    // set to the empty string
    function defaultVal(val, input, hideOnClick, ignore) {
        input.val(val);
        if (hideOnClick) {
            input.focus(function () {
                if (input.val() === val)
                    input.val('').change();
            });
        }
        input.blur(function () {
            if (input.val() === '') {
                input.val(val).change();
                searchData('', '.artButton', ignore);
            }
        });
    }

    // search the data of all objects matching selector
    function searchData(val, selector, ignore) {
        $.each($(selector), function (i, element) {
            var data = $(element).data();
            var show = false;
            $.each(data, function (k, v) {
                if ($.inArray(k, ignore) !== -1) return;
                //if (k === 'visible' || k === 'exhibits') return;
                if (searchString(v, val)) {
                    show = true;
                }
            });
            if (data.visible === false) {
                show = false;
            }
            if (show) {
                $(element).show();
            } else {
                $(element).hide();
            }
        });
    }

    // Checks if a string 'val' contains 'str
    // If 'val' is the default search text it will always return true
    // Case insensitive
    function searchString(str, val) {
        if (str) {
            return str.toLowerCase().indexOf(val.toLowerCase()) !== -1;
        }
        return true;
    }

    // save a video thumbnail using popcorn.capture
    function saveThumbnail(artwork) {

    }


    // Creates a queue that will run functions asynchronously.
    // Call createQueue() to get a queue, then with that object
    // call add() to add a job to the queue.  Jobs will be completed
    // when the browser has downtime.
    // Call clear() to remove anything currently in the queue.
    function createQueue() {
        return {
            _timer: null,
            _queue: [],
            // fn: the function to be called
            // 
            add: function (fn, context, time) {
                var setTimer = function (time, self) {
                    self._timer = setTimeout(function () {
                        time = self.add();
                        if (self._queue.length) {
                            setTimer(time, self);
                        }
                    }, time || 2);
                };

                if (fn) {
                    this._queue.push([fn, context, time]);
                    if (this._queue.length === 1) {
                        setTimer(time, this);
                    }
                    return;
                }

                var next = this._queue.shift();
                if (!next) {
                    return 0;
                }
                next[0].call(next[1] || window);
                return next[2];
            },
            clear: function () {
                clearTimeout(this._timer);
                this._queue = [];
            }
        };
    }

    function formatAddress(address) {
        address = address.replace('http://', '');
        address = address.split(':')[0];
        return address;
    }

    function safeCall(fn) {
        var passedArgs = [];
        for (var i = 1; i < arguments.length; i++) {
            passedArgs[i - 1] = arguments[i];
        }
        fn && typeof fn === "function" && fn.apply(null, passedArgs);
    }

    function safeCallHandler(fn) {
        var passedArgs = [];
        for (var i = 1; i < arguments.length; i++) {
            passedArgs[i - 1] = arguments[i];
        }
        return function () {
            fn && typeof fn === "function" && fn.apply(null, passedArgs);
        }
    }

    function multiFnHandler() {
        var fns = arguments;
        return function () {
            var args = [];
            for (var j = 0; j < arguments.length; j++) { // Need to copy arguments into a regular array for concat
                args[j] = arguments[j];
            }
            var passedArgs;
            if (fns && fns.length) {
                for (var i = 0; i < fns.length; i++) {
                    passedArgs = [fns[i]].concat(args);
                    safeCall.apply(null, passedArgs);
                }
            }
        }
    }

    function contains(object, val) {
        if (object && object.indexOf) {
            return object.indexOf(val) !== -1;
        }
        return false;
    }

    /* 
     * This method parses the Metadata fields and then checks whether the required metadata
     * field matches up with the one currently being looked at. Once it has found a match, it
     * returns the appropriate node corresponding to the field.
     *
     * From the old settings view, works there so should work here
     * Made it so that it creates blank text node if there is none
     */
    function getFieldValueFromMetadata(xml, field) {
        var metadata = getMetaData(xml);
        for (var i = 0; i < metadata.length; i++) {
            if (metadata[i].childNodes[0].textContent === field) {
                var out = metadata[i].childNodes[1].childNodes[0];
                if (out) return out;

                metadata[i].childNodes[1].appendChild(xml.createTextNode(''));
                return metadata[i].childNodes[1].childNodes[0];
            }
        }
        return null;
    }

    function getMetaData(doq) {
        return doq.getElementsByTagName("Metadata")[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes;
    }

    //takes text with special characters and returns the html encode string
    function encodeText(string) {
        var element = document.createElement("div");
        element.innerText = element.textContent = string;
        string = element.innerHTML;
        return string;
    }

    function encodeXML(string) {
        if (string)
            return string.replace(/\n/g, '<br>').
                replace(/&/g, '&amp;').
                replace(/</g, '&lt;').
                replace(/>/g, '&gt;').
                replace(/\'/g, '&apos;').
                replace(/\"/g, '&quot;');
        else return "";
    }

    function fitText(element, factor, options) {
        var loadedInterval = setInterval(function () {
            if (elementInDocument($(element))) {
                $(element).fitText(factor, options);
                clearInterval(loadedInterval);
            }
        });
    }

    // Replace SVG img with inline SVG
    function replaceSVGImg(svgImg) {
        var $img = $(svgImg);
        var imgURL = $img.attr('src');
        var imgID = $img.attr('id');
        var imgClass = $img.attr('class');
        var imgStyle = $img.attr('style');

        $.get(imgURL, function (data) {
            var $svg = $(data).find('svg');

            // Add replaced image's ID to the new SVG
            if (typeof imgID !== 'undefined') {
                $svg = $svg.attr('id', imgID);
            }
            // Add replaced image's classes to the new SVG
            if (typeof imgClass !== 'undefined') {
                $svg = $svg.attr('class', imgClass);
            }
            // Add replaced image's classes to the new SVG
            if (typeof imgStyle !== 'undefined') {
                $svg = $svg.attr('style', imgStyle);
            }

            $svg = $svg.removeAttr('xmlns:a');

            $img.replaceWith($svg);
            return $img;
        });
    }

    // show spinning circle and change the background to tell users the new page is loading
    function showLoading(divToAppend, circleSize, top, left) {
        
        var progressCircCSS = {
            "position": 'absolute',
            'z-index': '50',
            'height': 'auto',
            'width': '10%',
            'left': '50%',
            'top': '50%'
        };
        if (top || left) {
            progressCircCSS.top = top;
            progressCircCSS.left = left;
        }
        var centerhor = '0px';
        var centerver = '0px';
        if (circleSize) {
            progressCircCSS.width = circleSize;
        }
        var colorString = $(divToAppend).css("background-color");
        var colorOnly = colorString.substring(colorString.indexOf("(") + 1, colorString.lastIndexOf(")")).split(/, \s*/);
        var bgColor = "rgba(" + colorOnly[0] + "," + colorOnly[1] + "," + colorOnly[2]  + "," + "0.5)";
        divToAppend.css({
            'background-color': bgColor
        });

        var circle = showProgressCircle($(divToAppend), progressCircCSS, centerhor, centerver, false);
    }

    // hide specified div
    function hideLoading(divToHide) {
        var colorString = $(divToHide).css("background-color");
        var colorOnly = colorString.substring(colorString.indexOf("(") + 1, colorString.lastIndexOf(")")).split(/, \s*/);
        var bgColor = "rgba(" + colorOnly[0] + "," + colorOnly[1] + "," + colorOnly[2] + "," + "1)";
        divToHide.css({ 'background-color': bgColor });

        var circle = divToHide.find('.progressCircle');
        removeProgressCircle(circle);
    }

    //remove the progress circle when work is finished 
    function removeProgressCircle(circle) {
        circle.remove();
        circle = null;
    }

    // show circle; returns the progress circle so it can be removed later (note: center of element given to center circle within)
    function showProgressCircle(elAppendTo, cssObject, centerHor, centerVert, shouldCenter) {
        var progressCircle = $(document.createElement('img'));
        progressCircle.addClass("progressCircle");
        elAppendTo.append(progressCircle);
        progressCircle.attr('src', tagPath+"images/icons/progress-circle.gif");
        progressCircle.css(cssObject || { // css for entity loading circles
            'position': 'absolute',
            'left': '5%',
            'z-index': '50',
            'height': 'auto',
            'bottom': '10%',
            'width': '10%',
        });
        if (shouldCenter) {
            progressCircle.css({ top: centerVert - 0.5 * progressCircle.height(), left: centerHor - 0.5 * progressCircle.width() });
        }
        return progressCircle;
    }

    // Used in TourAuthoring layout
    function getFontSize(factor) {
        return factor * (window.innerWidth / 1920) + '%'; // Huh??? what is 1920? width of screen lol
    }

    //Takes d3 data and recursively applies it to all children. Only necessary if using D3
    function applyD3DataRec(element) {
        var nodes = element.childNodes;
        var i;
        for (i in nodes) {
            nodes[i].__data__ = element.__data__;
            applyD3DataRec(nodes[i]);
        }
    }

    //Creates a new namespace from a string (ex "TAG.Layout.Catalog")
    function namespace(namespaceString) {
        var parts = namespaceString.split('.'),
        parent = window,
        currentPart = '';
         var k=0;
	if(parts[0] === 'TAG') {
	TAG = TAG || {};
	parent = TAG;
	k = 1;
	} else if (parts[0] === 'Worktop') {
	Worktop = Worktop || {};
	parent = Worktop;
	k = 1;
	}
 
	for (var i = k, length = parts.length; i < length; i++) {
            currentPart = parts[i];
            parent[currentPart] = parent[currentPart] || {};
            parent = parent[currentPart];
        }

        return parent;
    }

    //Takes an object of options and an object of defaults, and combines them without overwriting.
    function setToDefaults(options, defaults) {
        return $.extend({}, defaults, options);
    }

    /*
    Gets the maximum font size in em that fits into the specified width and height.
    The output is a string with 'em' at the end.

        text: The text to measure
        minFontSize: Minimum font size (in em, a number not a string).  The output will be no smaller than this value
        maxWidth: The maximum width the text should be.
        maxHeight: The maximum height the text should be.
        step: Optional.  The step to increment by when testing font size.
    */
    function getMaxFontSizeEM(text, minFontSize, maxWidth, maxHeight, step) {
        console.log('getting max font size.....');
        if (!text) {
            return;
        }
        var testDiv = $(document.createElement('div'));
        var tagContainer = $('#tagRoot');
        step = step || 0.1;
        var currSize = minFontSize;

        testDiv.css({
            'position': 'absolute',
            'visibility': 'hidden',
			'font-size': minFontSize + 'em',
            'height': 'auto',
            'width': 'auto',
        });

        testDiv.text(text);
        tagContainer.append(testDiv);

        if (testDiv.width() >= maxWidth || testDiv.height() >= maxHeight) {
            return minFontSize + 'em';
			//currSize = minFontSize;
			//testDiv.css('font-size', currSize + 'em');
        }

        while (testDiv.width() < maxWidth && testDiv.height() < maxHeight) {
            currSize += step;
            testDiv.css('font-size', currSize + 'em');
        }
        testDiv.remove();
        return currSize + 'em';
    }
	
	/*
		Gets the maximum font size without em.
	*/
	function getMaxFontSize(text, minFontSize, maxWidth, maxHeight, step) {
        console.log('getting max font size.....');
        if (!text) {
            return;
        }
        var testDiv = $(document.createElement('div'));
        var tagContainer = $('#tagRoot');
        step = step || 0.1;
        var currSize = minFontSize;

        testDiv.css({
            'position': 'absolute',
            'visibility': 'hidden',
			'font-size': minFontSize + 'em',
            'height': 'auto',
            'width': 'auto',
        });

        testDiv.text(text);
        tagContainer.append(testDiv);

        if (testDiv.width() >= maxWidth || testDiv.height() >= maxHeight) {
            return minFontSize + 'em';
			//currSize = minFontSize;
			//testDiv.css('font-size', currSize + 'em');
        }

        while (testDiv.width() < maxWidth && testDiv.height() < maxHeight) {
            currSize += step;
            testDiv.css('font-size', currSize + 'em');
        }
        testDiv.remove();
        return currSize;
    }

    //Shouldn't be public anymore, this is primarially used by makeManipulatable
    function getGestureRecognizer() {
        var gr = new Windows.UI.Input.GestureRecognizer();
        gr.gestureSettings = Windows.UI.Input.GestureSettings.manipulationRotate |
            Windows.UI.Input.GestureSettings.manipulationTranslateX |
            Windows.UI.Input.GestureSettings.manipulationTranslateY |
            Windows.UI.Input.GestureSettings.manipulationScale |
            Windows.UI.Input.GestureSettings.manipulationRotateInertia |
            Windows.UI.Input.GestureSettings.manipulationScaleInertia |
            Windows.UI.Input.GestureSettings.manipulationTranslateInertia |
            Windows.UI.Input.GestureSettings.hold |
            Windows.UI.Input.GestureSettings.holdWithMouse |
            Windows.UI.Input.GestureSettings.rightTap |
            Windows.UI.Input.GestureSettings.tap;
        return gr;
    }

    //Makes an xml request, and will actually get a modified document, because internet explorer (the
    //environment that metro apps run in) by default never retrieves a new xml document, even if the server's
    //version is new. This fixes that.
    function makeXmlRequest(url) {
        var request = new XMLHttpRequest();
        request.open("GET", url, false);
        request.send(null);
        if (false && !request.getResponseHeader("Date")) { // TODO figure out why this causes network errors
            var cached = request;
            request = new XMLHttpRequest();
            var ifModifiedSince = cached.getResponseHeader("Last-Modified") || new Date(0); // January 1, 1970
            request.open("GET", url, false);
            request.setRequestHeader("If-Modified-Since", ifModifiedSince);
            request.send("");
            if (request.status === 304) {
                request = cached;
            }
        }
        return request;
    }

    // determine if element is in a doc
    function elementInDocument(element) {
        element = $(element)[0];
        while (element) {
            if (element === document) {
                return true;
            }
            element = element.parentNode;
        }
        return false;
    }

    //give it a jquery element and it will disable drag on the element, and drag events should propagate to parent element
    //still don't know where to put this function yet
    function disableDrag(element) {
        element.attr("ondragstart", "return false");
    }

    // dz - double-ended priority queue implementation using parallel min and max heap
    function createDoubleEndedPQ(minComparator, maxComparator) {
        return {
            // DEPQ built on a min-max heap pair
            _minComp: minComparator,
            _maxComp: maxComparator,
            
            _maxheap: new binaryHeap(maxComparator),
            _minheap: new binaryHeap(minComparator),
            
            // add
            //Input: Element to be added
            add: function (element) {
                this._maxheap.push(element);
                this._minheap.push(element); 
                return element;
            },

            //Output: Minimum element in minheap
            getMin: function () {
                return this._minheap.peek();
            },

            getMax: function() {
                return this._maxheap.peek();
            },

            removeMin: function () {
                return this._minheap.pop();
            },

            removeMax: function () {
                return this._maxheap.pop();
            },

            remove: function (node) {
                this._maxheap.remove(node);
                this._minheap.remove(node);
            },

            size: function() {
                return this._maxheap.size();
            },

            clear: function () {
                this._maxheap = new binaryHeap(this._maxComp);
                this._minheap = new binaryHeap(this._minComp);
            },

            find: function (node) {
                return this._maxheap.find(node)
            },
        }
    }
    that.createDoubleEndedPQ = createDoubleEndedPQ;

    //VERY important function. Will take an element and add multitouch/scale/etc events to it. And inertia.
    //Takes in a set of functions (onManipulate, onTapped, onScroll, onHolding)
    //onManipulate(result), result has pivot.x,.y ; translation.x,.y; rotation, scale
    //onScroll(delta,pivot) is the scroll wheel
    //onTapped
    //onHolding
    function makeManipulatable(element, functions, stopOutside, noAccel) {
        var hammer = new Hammer(element, {
            hold_threshold: 3,
            drag_min_distance: 9,
            drag_max_touches: 10,
            hold_timeout: 600,
            tap_max_distance: 15,
            doubletap_distance: 17,
            doubletap_interval: 200,
            swipe: false
        });

        var lastTouched = null,
            that = this,
            manipulating = false,
            isDown = false,
            $element = $(element);

        var lastPos = {},
            lastEvt,
            timer,
            currentAccelId = 0,
            lastScale = 1;

        // general event handler
        function manipulationHandler(evt) {
            var translation;
            if (evt.gesture) {
                // Update Dir, and set pivot rotation, and scale values
                getDir(evt, true);
                var pivot = { x: evt.gesture.center.pageX - $element.offset().left, y: evt.gesture.center.pageY - $element.offset().top };
                var rotation = evt.gesture.rotation; // In degrees
                if (!lastPos.x && lastPos.x !== 0) {
                    translation = { x: evt.gesture.deltaX, y: evt.gesture.deltaY };
                } else {
                    translation = { x: evt.gesture.center.pageX - lastPos.x, y: evt.gesture.center.pageY - lastPos.y };
                }
                var scale = evt.gesture.scale - lastScale;
                // Previous values
                lastScale = evt.gesture.scale;
                lastPos.x = evt.gesture.center.pageX;
                lastPos.y = evt.gesture.center.pageY;
                lastEvt = evt;
                if (typeof functions.onManipulate === "function") {
                    functions.onManipulate({ 
                        pivot: pivot, 
                        translation: translation, 
                        rotation: rotation, 
                        scale: 1 + scale,
                        target: evt.gesture.target,
                        touches: evt.gesture.touches,
                        pointerType: evt.gesture.pointerType,
                        center: evt.gesture.center,
                        deltaTime: evt.gesture.deltaTime,
                        deltaX: evt.gesture.deltaX,
                        deltaY: evt.gesture.deltaY,
                        velocityX: evt.gesture.velocityX,
                        velocityY: evt.gesture.velocityY,
                        angle: evt.gesture.angle,
                        direction: evt.gesture.direction,
                        distance: evt.gesture.distance,
                        eventType: evt.gesture.eventType,
                        srcEvent: evt.gesture.srcEvent,
                        startEvent: evt.gesture.startEvent
                    }, evt);
                };
                //if ((evt.type === "pinch" || evt.type === "pinchin" || evt.type === "pinchout") && typeof functions.onScroll === "function")
                //    functions.onScroll(1 + scale, pivot);
            } else {
                // Update Dir

                getDir(evt, true);
                var pivot = { x: evt.pageX - $element.offset().left, y: evt.pageY - $element.offset().top };
                // var rotation = evt.gesture.rotation; // In degrees // Don't need rotation...
                if (false && !lastPos.x && lastPos.x !== 0) { // TODO need this?
                    translation = { x: evt.gesture.deltaX, y: evt.gesture.deltaY };
                } else {
                    translation = { x: evt.pageX - lastPos.x, y: evt.pageY - lastPos.y };
                    console.log('translation.y = '+translation.y);
                }
                var scale = evt.gesture.scale - lastScale; /////////////////// HEREHEHEHEHEHRHERIEREIRHER ///
                lastScale = evt.gesture.scale;
                lastPos.x = evt.pageX;
                lastPos.y = evt.pageY;
                lastEvt = evt;

                if (typeof functions.onManipulate === "function") {
                    functions.onManipulate({ 
                        pivot: pivot, 
                        translation: translation, 
                        rotation: rotation, 
                        scale: 1 + scale,
                        target: evt.gesture.target,
                        touches: evt.gesture.touches,
                        pointerType: evt.gesture.pointerType,
                        center: evt.gesture.center,
                        deltaTime: evt.gesture.deltaTime,
                        deltaX: evt.gesture.deltaX,
                        deltaY: evt.gesture.deltaY,
                        velocityX: evt.gesture.velocityX,
                        velocityY: evt.gesture.velocityY,
                        angle: evt.gesture.angle,
                        direction: evt.gesture.direction,
                        distance: evt.gesture.distance,
                        eventType: evt.gesture.eventType,
                        srcEvent: evt.gesture.srcEvent,
                        startEvent: evt.gesture.startEvent
                    }, evt);
                };

                clearTimeout(timer);
                timer = setTimeout(function () {
                    var dir = getDir(evt);
                    if (evt.gesture.pointerType !== "mouse" && !noAccel)
                        accel(30 * dir.vx, 30 * dir.vy, null, currentAccelId);
                }, 5);
            }
        }


        function processPinch(evt) {
            var pivot = { x: evt.gesture.center.pageX - $element.offset().left, y: evt.gesture.center.pageY - $element.offset().top };
            var scale = evt.gesture.scale - lastScale;
            var rotation = evt.gesture.rotation; // In degrees
            var translation;
            if (!lastPos.x && lastPos.x !== 0) {
                translation = { x: 0, y: 0};
            } else {
                translation = { x: evt.gesture.center.pageX - lastPos.x, y: evt.gesture.center.pageY - lastPos.y };
            }
            lastPos.x = evt.gesture.center.pageX;
            lastPos.y = evt.gesture.center.pageY;
            getDir(evt, true);
            if (scale !== lastScale && typeof functions.onScroll === "function")
                functions.onScroll(1 + scale, pivot);

            if (typeof functions.onManipulate === "function")
                functions.onManipulate({                     
                        pivot: pivot, 
                        translation: translation, 
                        rotation: rotation, 
                        target: evt.gesture.target,
                        touches: evt.gesture.touches,
                        pointerType: evt.gesture.pointerType,
                        center: evt.gesture.center,
                        deltaTime: evt.gesture.deltaTime,
                        deltaX: evt.gesture.deltaX,
                        deltaY: evt.gesture.deltaY,
                        velocityX: evt.gesture.velocityX,
                        velocityY: evt.gesture.velocityY,
                        angle: evt.gesture.angle,
                        direction: evt.gesture.direction,
                        distance: evt.gesture.distance,
                        eventType: evt.gesture.eventType,
                        srcEvent: evt.gesture.srcEvent,
                        startEvent: evt.gesture.startEvent,
                        scale: 1 
                    }, evt);
            lastScale = evt.gesture.scale;
        }

        // mousedown
        var dragStart;
        function processDown(evt) {
            lastScale = 1;
            isDown = true;
            dragStart = evt.gesture.center;
            lastEvt = null;
            lastTouched = evt.srcElement;
            currentAccelId++;
            resetDir();
            clearTimeout(timer);
            manipulationHandler(evt);
        }

        // mouse move
        function processMove(evt) {
            manipulationHandler(evt);
        }

        // requestAnimationFrame polyfill by Erik Möller
        // fixes from Paul Irish and Tino Zijdel
        (function () {
            var lastTime = 0;
            var vendors = ['ms', 'moz', 'webkit', 'o'];
            for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
                window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
                window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
            }

            if (!window.requestAnimationFrame)
                window.requestAnimationFrame = function (callback, element) {
                    var currTime = Date.now();
                    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                    var id = window.setTimeout(function () { callback(currTime + timeToCall); },
                      timeToCall);
                    lastTime = currTime + timeToCall;
                    return id;
                };

            if (!window.cancelAnimationFrame)
                window.cancelAnimationFrame = function (id) {
                    clearTimeout(id);
                };
        }());

        function accel(vx, vy, delay, id) {
            if (!lastEvt) return;
            if (currentAccelId !== id) return;
            if (Math.abs(vx) <= 4 && Math.abs(vy) <= 4) {
                return;
            }
            var offset = $element.offset();
            delay = delay || 5;
            var pivot = { x: lastEvt.gesture.center.pageX - offset.left, y: lastEvt.gesture.center.pageY - offset.top };
            var rotation = 0; // In degrees
            var translation = { x: vx, y: vy };
            var scale = 1;
            if (typeof functions.onManipulate === "function")
                functions.onManipulate({ 

                        pivot: pivot, 
                        translation: translation, 
                        rotation: rotation, 
                        scale: scale

                 }, lastEvt);

            timer = setTimeout(function () {
                accel(vx * 0.95, vy * 0.95, delay, id);
            }, delay);
            timer = window.requestAnimationFrame(accel(vx * .95, vy * .95, delay, id), $element);
        }

        // mouse release
        function processUp(evt) {
            //evt.stopPropagation();
            isDown = false;
            lastPos = {};
            var dir = getDir(evt);
            if (evt.gesture.pointerType === "mouse" && !noAccel)
                accel(30 * dir.vx, 30 * dir.vy, null, currentAccelId);
            if (typeof functions.onRelease === "function")
                functions.onRelease(evt);

            //var dir = getDir(evt);
            //resetDir();
            //setTimeout(function () {
                //accel(30 * dir.vx, 30 * dir.vy, null, currentAccelId);
            //}, 1);
            //accel(30 * evt.gesture.velocityX * (evt.gesture.center.pageX > dragStart.pageX ? 1 : -1),//(Math.abs(evt.gesture.angle) < 90 ? 1 : -1),
            //    30 * evt.gesture.velocityY * (evt.gesture.center.pageY > dragStart.pageY ? 1 : -1));//evt.gesture.angle / Math.abs(evt.gesture.angle));
        }

        var firstEvtX, firstEvtY, changeX, changeY, prevEvt;
        function resetDir() {
            firstEvtX = null;
            firstEvtY = null;
            changeX = 0;
            changeY = 0;
            prevEvt = null;
        }

        function getDir(evt, noReturn) {
            if (!firstEvtX) {
                firstEvtX = evt;
                //console.log("firstEvtX SETA");
                firstEvtX.currentDir = firstEvtX.gesture.deltaX / Math.abs(firstEvtX.gesture.deltaX) || 0;
                if (!prevEvt) {
                    prevEvt = evt;
                    return { vx: 0, vy: 0 };
                }
            } else {
                if (evt.gesture.deltaX > prevEvt.gesture.deltaX && firstEvtX.currentDir !== 1) {
                    firstEvtX = evt;
                    //console.log("firstEvtX SETB");
                    firstEvtX.currentDir = 1;
                } else if (evt.gesture.deltaX < prevEvt.gesture.deltaX && firstEvtX.currentDir !== -1) {
                    firstEvtX = evt;
                    //console.log("firstEvtX SETC");
                    firstEvtX.currentDir = -1;
                }
            }
            if (!firstEvtY) {
                firstEvtY = evt;
                //console.log("firstEvtY SETA");
                firstEvtY.currentDir = firstEvtY.gesture.deltaY / Math.abs(firstEvtY.gesture.deltaY) || 0;
            } else {
                if (evt.gesture.deltaY > prevEvt.gesture.deltaY && firstEvtY.currentDir !== 1) {
                    firstEvtY = evt;
                    //console.log("firstEvtY SETB");
                    firstEvtY.currentDir = 1;
                } else if (evt.gesture.deltaY < prevEvt.gesture.deltaY && firstEvtY.currentDir !== -1) {
                    firstEvtY = evt;
                    //console.log("firstEvtY SETC");
                    firstEvtY.currentDir = -1;
                }
            }
            prevEvt = evt;
            if (!noReturn) {
                return {
                    vx: ((evt.gesture.deltaX - firstEvtX.gesture.deltaX) / (evt.gesture.timeStamp - firstEvtX.gesture.timeStamp)) || 0,
                    vy: ((evt.gesture.deltaY - firstEvtY.gesture.deltaY) / (evt.gesture.timeStamp - firstEvtY.gesture.timeStamp)) || 0,
                };
            }
        }
        function processScrollFirefox(evt) {
                // console.log("capturing wheel events");
                var pivot = { x: evt.clientX - $element.offset().left, y: evt.clientY - $element.offset().top };
                console.log(evt.detail);
                var delta = -evt.detail;
                
                //delta = delta * 1.1;
                /*
                if (delta < 0) { 
                    console.log("here; " + delta);
                    delta = 1.0 / 1.1;
                } else { 
                    console.log("there; " + delta);
                    delta = 1.1;
                }
                */
				if (delta < 0) delta = 1.0 / 1.1;
            	else delta = 1.1;
				console.log("delta processed " + delta);
                evt.cancelBubble = true;
                if (typeof functions.onScroll === "function") { 
                    functions.onScroll(delta, pivot);
                }
         }
        // scroll wheel
        function processScroll(evt) {
            var pivot = { x: evt.x - $element.offset().left, y: evt.y - $element.offset().top };
            var delta = evt.wheelDelta;
            if (evt.wheelDelta < 0) delta = 1.0 / 1.1;
            else delta = 1.1;
            evt.cancelBubble = true;
            if (typeof functions.onScroll === "function") functions.onScroll(delta, pivot);
        }

        hammer.on('touch', processDown);
        hammer.on('drag', function(evt){
            processMove(evt);
        });
        hammer.on('pinch', processPinch);
        hammer.on('release', processUp);
        element.onmousewheel = processScroll;
        element.addEventListener("DOMMouseScroll", processScrollFirefox);

        // double tap
        var doubleTappedHandler, event;
        if (typeof functions.onDoubleTapped === "function") {
            doubleTappedHandler = function (evt) {
                if (evt.gesture.srcEvent.button > 0 || evt.gesture.srcEvent.buttons == 2) {
                    return;
                }
                event = {};
                event.position = {};
                event.position.x = evt.gesture.center.pageX - $(element).offset().left;
                event.position.y = evt.gesture.center.pageY - $(element).offset().top;
                functions.onDoubleTapped(event);
            };
            hammer.on('doubletap', doubleTappedHandler);
        }

        // short tap, i.e. left-click
        var tappedHandler = null;
        if (typeof functions.onTapped === "function") {
            tappedHandler = function (evt) {
                if (evt.gesture.srcEvent.button > 0) {
                    evt.stopPropagation();
                    event = {};
                    event.gesture = evt.gesture;
                    event.position = {};
                    event.position.x = evt.gesture.center.pageX - $(element).offset().left;
                    event.position.y = evt.gesture.center.pageY - $(element).offset().top;
                    if (functions.onTappedRight) {
                        functions.onTappedRight(event);
                    }
                    return;
                }
                event = {};
                event.position = {};
                event.button = evt.button;
                event.gesture = evt.gesture;
                event.position.x = evt.gesture.center.pageX - $(element).offset().left;
                event.position.y = evt.gesture.center.pageY - $(element).offset().top;
                functions.onTapped(event);
            };
            hammer.on('tap', tappedHandler);
            //gr.addEventListener('tapped', tappedHandler);
        }

        var releasedHandler = null;
        if (typeof functions.onRelease === "function") {
            releasedHandler = function (evt) {
                event = {};
                event.position = {};
                event.position.x = evt.gesture.center.pageX - $(element).offset().left;
                event.position.y = evt.gesture.center.pageY - $(element).offset().top;
                functions.onRelease(event);
            };
            hammer.on('release', releasedHandler);
        }

        //var debugLog = function(evt) {
        //    console.log(evt.type);
        //}

        //hammer.on('release hold tap touch drag doubletap', debugLog);

        // long-press, i.e. right-click
        var holdHandler = null;
        var rightClickHandler = null;
        var stopNextClick = false;
        if (typeof functions.onTappedRight === "function") {
            holdHandler = function (evt) {
                evt.stopPropagation();
                stopNextClick = true;
                event = {};
                event.gesture = evt.gesture;
                event.position = {};
                event.position.x = evt.gesture.center.pageX - $element.offset().left;
                event.position.y = evt.gesture.center.pageY - $element.offset().top;
                functions.onTappedRight(event);
            };
            rightClickHandler = function (evt) {
                evt.stopPropagation();
                event = {};
                event.button = evt.button;
                event.gesture = evt.gesture;
                event.position = {};
                event.position.x = evt.pageX - $element.offset().left;
                event.position.y = evt.pageY - $element.offset().top;
                functions.onTappedRight(event);
            };
            element.addEventListener("MSPointerDown", function (evt) {
                console.log(evt);
                if (stopNextClick) {
                    console.log("STOPPING CLICK");
                    evt.stopPropagation();
                    setTimeout(function () {
                        stopNextClick = false;
                    }, 1);
                    return;
                }
            }, true);
            element.addEventListener("mouseup", function (evt) {
                console.log("CLICK");
                if (stopNextClick) {
                    console.log("STOPPING CLICK");
                    evt.stopPropagation();
                    setTimeout(function () {
                        stopNextClick = false;
                    }, 1);
                    return;
                }
                if (evt.button === 2) {
                    rightClickHandler(evt);
                }

            }, true);

            hammer.on('hold', holdHandler);
        }

        return {
            cancelAccel: function () {
                currentAccelId++;
                clearTimeout(timer);
            }
        };
        
        //return gr;
    }

    //VERY important function. Will take an element and add multitouch/scale/etc events to it. And inertia.
    //Takes in a set of functions (onManipulate, onTapped, onScroll, onHolding)
    //onManipulate(result), result has pivot.x,.y ; translation.x,.y; rotation, scale
    //onScroll(delta,pivot) is the scroll wheel
    //onTapped
    //onHolding
    function makeManipulatableWin(element, functions, stopOutside) {

        var lastTouched = null;
        var that = this;
        var gr = TAG.Util.getGestureRecognizer();
        var manipulating = false;

        // general event handler
        function manipulationHandlerWin(evt) {
            if (evt.delta) {
                var pivot = { x: evt.position.x, y: evt.position.y };
                var rotation = evt.delta.rotation / 180 * Math.PI;
                var translation = { x: evt.delta.translation.x, y: evt.delta.translation.y };
                var scale = evt.delta.scale;
                if (typeof functions.onManipulate === "function")
                    functions.onManipulate({ 

                        pivot: pivot, 
                        translation: translation, 
                        rotation: rotation, 
                        target: evt.gesture.target,
                        touches: evt.gesture.touches,
                        pointerType: evt.gesture.pointerType,
                        center: evt.gesture.center,
                        deltaTime: evt.gesture.deltaTime,
                        deltaX: evt.gesture.deltaX,
                        deltaY: evt.gesture.deltaY,
                        velocityX: evt.gesture.velocityX,
                        velocityY: evt.gesture.velocityY,
                        angle: evt.gesture.angle,
                        direction: evt.gesture.direction,
                        distance: evt.gesture.distance,
                        eventType: evt.gesture.eventType,
                        srcEvent: evt.gesture.srcEvent,
                        startEvent: evt.gesture.startEvent,
                        scale: scale

                     });
            }
        }

        function isManipulatingWin() { return manipulating; }

        // mousedown
        function processDownWin(evt) {
            lastTouched = evt.srcElement;
            var pp = evt.currentPoint;
            try {
                gr.processDownEvent(pp);
                element.msSetPointerCapture(evt.pointerId);

                evt.cancelBubble = true;
            }
            catch (err) {
                var message = err.message;
            }
        }

        // mouse move
        function processMoveWin(evt) {
            if (stopOutside) {
               if (evt.x < 0 || evt.y < 0 || evt.x > $(element).width() || evt.y > $(element).height()) {
                    return;
                }
            }
            var pps = evt.intermediatePoints;
            try {
                gr.processMoveEvents(pps);
            }
            catch (err) {
                var message = err.message;
            }
        }

        // mouse release
        function processUpWin(evt) {
            var pp = evt.currentPoint;
            try {
                gr.processUpEvent(pp);
            }
            catch (err) {
                var message = err.message;
            }
        }

        // scroll wheel
        function processScrollWin(evt) {
            var pivot = { x: evt.x, y: evt.y };
            var delta = evt.wheelDelta;
            if (evt.wheelDelta < 0) delta = 1.0 / 1.1;
            else delta = 1.1;
            evt.cancelBubble = true;
            if (typeof functions.onScroll === "function") functions.onScroll(delta, pivot);
        }

        element.addEventListener('MSPointerDown', processDownWin, false);
        element.addEventListener('MSPointerMove', processMoveWin, false);
        element.addEventListener('MSPointerUp', processUpWin, false);
        element.onmousewheel = processScrollWin;

        // start capturing manip
        function manipulationStartedHandlerWin(evt) {
            manipulating = true;
            manipulationHandlerWin(evt);
        }
        gr.addEventListener('manipulationstarted', manipulationStartedHandlerWin);

        // react to changes
        function manipulationDeltaHandlerWin(evt) {
            manipulationHandlerWin(evt);
        }
        gr.addEventListener('manipulationupdated', manipulationDeltaHandlerWin);

        // react to conclusion of manip
        function manipulationEndHandlerWin(evt) {
            manipulating = false;
            manipulationHandlerWin(evt);
        }
        gr.addEventListener('manipulationcompleted', manipulationEndHandlerWin);

        // short tap, i.e. left-click
        var tappedHandlerWin = null;
        if (typeof functions.onTapped === "function") {
            tappedHandlerWin = function(evt) {
                var event = {};
                event.position = {};
                if (evt.position.x < 50) {
                    event.position.x = $(lastTouched).offset().left - $(element).offset().left + evt.position.x;
                } else {
                    event.position.x = evt.position.x;
                }
                event.position.y = $(lastTouched).offset().top - $(element).offset().top + evt.position.y;
                functions.onTapped(event);
            };
            gr.addEventListener('tapped', tappedHandlerWin);
        }

        // long-press, i.e. right-click
        var rightTapHandlerWin = null;
        if (typeof functions.onTappedRight === "function") {
            rightTapHandler = function (evt) {
                var event = {};
                event.position = {};
                event.position.x = evt.position.x;
                event.position.y = evt.position.y;
                functions.onTappedRight(event);
            };
            gr.addEventListener('righttapped', rightTapHandlerWin);
        }
        
        return gr;
    }

    function htmlEntityEncode(str) {
        return str ? $('<div />').text(escape(str)).html() : '';
    }

    function htmlEntityDecode(str) {
        return str ? unescape($('<div />').html(str).text()) : '';
    }

    // sets up error handler for a video element
    // container is the div we'll append error messages to
    function videoErrorHandler(videoElt, container) {
        return function (err) {
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
            console.log("video error: " + msg);
            var msgdiv = $(document.createElement('div'));
            msgdiv.css({
                'position':'absolute',
                'width': '80%',
                'left': '10%',
                'top': '50%',
                'color': 'white',
                'text-align': 'center',
                'font-size': TAG.Util.getMaxFontSizeEM(msg, 2, container.width() * 0.8, container.height() * 0.2, 0.1)
            });
            msgdiv.text(msg);
            videoElt.hide();
            container.append(msgdiv);
            videoElt[0].onerror = function (err) {  }; // get rid of the error handler afterwards
        }
    }

    /**
     * Used by web app code to slide in pages given their html files
     * @param path     the path to the html file within the html directory
     */
    function getHtmlAjax(path) {
        var ret;
        $.ajax({
            async: false,
            cache: false,
            url: tagPath+"html/"+path,
            success: function (data) {
                ret = $(data);
            },
            error: function (err) {
                console.log("url = " + path);
                console.log("error: "+err.statusText);
                ret = null;
            },
            dataType: 'html'
        });
        return ret;
    }

     /**
     * @param collectionId      the id of the collection whose local visibility we want to check or set
     * @param setValue          falsy if just want to return visibility status
     *                          {visible: true}  if we want to set collection to be locally visible
     *                          {visible: false} if we want to hide the collection locally
     */
    function localVisibility(collectionId, setValue) {
        localStorage.invisibleCollectionsTAG = localStorage.invisibleCollectionsTAG || '[]';
        var tempList, index;
        try {
            tempList = JSON.parse(localStorage.invisibleCollectionsTAG);
        } catch (err) {
            localStorage.invisibleCollectionsTAG = '[]';
            tempList = [];
        }
        index = tempList.indexOf(collectionId);
        if (setValue && setValue.visible) {
            index >= 0 && tempList.splice(index, 1);
        } else if (setValue && setValue.hasOwnProperty('visible')) {
            index === -1 && tempList.push(collectionId);
        } else {
            return index >= 0 ? false : true;
        }
        localStorage.invisibleCollectionsTAG = JSON.stringify(tempList);
    }

})();

/**
 * Utils for Animation, splitscreen, colors and the like
 */
TAG.Util.UI = (function () {
    "use strict";

    var PICKER_SEARCH_TEXT = 'Search by Name, Artist, or Year...';
    var IGNORE_IN_SEARCH = ['visible', 'exhibits', 'selected', 'guid', 'url', 'comp'];
    var recentlyAssociated = []; // recently associated media
    var recentlyAssociatedGUIDs = []; // to more easily check if a media has been associated recently
    var tagContainerId = 'tagRoot'; // TODO more general

    return {
        slidePageLeftSplit: slidePageLeftSplit,
        slidePageRightSplit: slidePageRightSplit,
        slidePageLeft: slidePageLeft,
        slidePageRight: slidePageRight,
        hexToR: hexToR,
        hexToG: hexToG,
        hexToB: hexToB,
        hexToRGB: hexToRGB,
        colorToHex: colorToHex,
        fitTextInDiv: fitTextInDiv,
        makeNoArtworksOptionBox: makeNoArtworksOptionBox,
        drawPushpins: drawPushpins,
        addPushpinToLoc: addPushpinToLoc,
        getLocationList: getLocationList,
        popUpMessage: popUpMessage,
        PopUpConfirmation: PopUpConfirmation,
        cgBackColor: cgBackColor,
        setUpBackButton: setUpBackButton,
        blockInteractionOverlay: blockInteractionOverlay,
        FeedbackBox: FeedbackBox,
        ChangeServerDialog: ChangeServerDialog,
        createAssociationPicker: createAssociationPicker,
        getRecentlyAssociated: getRecentlyAssociated,
        createCirc: createCirc,
        createLine: createVertLine,
        createKeyframe: createKeyframe,
        createDisplay: createDisplay,
        createTrack: createTrack
    };

    function createTrack(specs) {
        // TODO if necessary
    }

    function createDisplay(specs) {
        var inRect, mainRect, outRect, inHandle, outHandle;
        var x = specs.x,
            fadeIn = specs.fadeIn,
            fadeOut = specs.fadeOut,
            mainLength = specs.mainLength,
            fadeColor = specs.fadeColor || '#ff7700',
            mainColor = specs.mainColor || '#81ad62',
            height = specs.height || '100%',
            container = specs.container;

        // fade in rectangle
        inRect = $(document.createElement('div'));
        inRect.addClass('inRect');
        inRect.css({
            'position': 'absolute',
            'left': x + "px",
            'top': '0px',
            'width': fadeIn + "px",
            'height': height,
            'border-left': '1px solid black',
            'border-right': '1px solid black',
            'background': 'linear-gradient(to right,white, ' + mainColor + ')' // DO FADE GRADIENT
        });

        // main rectangle
        mainRect = $(document.createElement('div'));
        mainRect.addClass('mainRect');
        mainRect.css({
            'position': 'absolute',
            'left': (x+fadeIn) + "px",
            'top': '0px',
            'width': mainLength + "px",
            'height': height,
            'background-color': mainColor
        });

        // fade out rectangle
        outRect = $(document.createElement('div'));
        outRect.addClass('outRect');
        outRect.css({
            'position': 'absolute',
            'left': (x+fadeIn+mainLength) + "px",
            'top': '0px',
            'width': fadeOut + "px",
            'height': height,
            'border-left': '1px solid black',
            'border-right': '1px solid black',
            'background': 'linear-gradient(to right, '+ mainColor + ',white)' // DO FADE GRADIENT
        });

        // fade in handle
        inHandle = createCirc(x, 48, 15, 5, '#000000', '#ffffff');
        inHandle.addClass('inHandle');

        // fade out handle
        outHandle = createCirc(x + mainLength + fadeIn + fadeOut, 48, 15, 5, '#000000', '#ffffff');
        outHandle.addClass('outHandle');

        container && container.append(mainRect).append(inRect).append(outRect).append(inHandle).append(outHandle);

        return { inRect: inRect, mainRect: mainRect, outRect: outRect, inHandle: inHandle, outHandle: outHandle };
    }

    function createKeyframe(specs) {
        var x=specs.x,
            y=specs.y || 48,
            container=specs.container;
        var line = createVertLine(x);
        line.addClass('keyframeLine');
        var circ = createCirc(x, y);
        circ.addClass('keyframeCirc');
        var innerCirc = createCirc(x, y, 17, 0, '#ff0000', '#ffffff');
        line.css('z-index', 2);
        circ.css('z-index', 3);
        innerCirc.css('z-index', 3);
        innerCirc.addClass('keyframeInnerCirc');
        container && container.append(line);
        container && container.append(circ);
        container && container.append(innerCirc);
        return { line: line, circ: circ, innerCirc: innerCirc };
    }

    function createCirc(cx, cy, radius, strokeW, strokeColor, fillColor) {
        var circ = $(document.createElement('div'));
        radius = radius || 21;
        strokeW = (strokeW === 0 || strokeW) ? strokeW : 5;
        strokeColor = strokeColor || "#296b2f";
        fillColor = fillColor || "#ffffff";
        circ.css({
            'border': strokeW + "px solid " + strokeColor,
            '-webkit-border-radius': (2 * radius) + "px",
            '-moz-border-radius':(2*radius)+"px",
            'border-radius': (2 * radius) + "px",
            'width': (2 * radius) + "px",
            'height': (2 * radius) + "px",
            'background-color': fillColor,
            'position': 'absolute',
            'left':(cx-radius-strokeW)+"px",
            'top': (cy - radius - strokeW) + "px",
        });
        return circ;
    }

    function createVertLine(x, width, color) {
        var line = $(document.createElement('div'));
        width = width || 3;
        color = color || "#296b2f";
        line.css({
            'width': width + "px",
            'height': "100%",
            'background-color': color,
            'position': 'absolute',
            'left': (x-width/2) + "px",
            'top': "0px"
        });
        return line;
    }

    function ChangeServerDialog() {
        var serverDialogOverlay = $(document.createElement('div'));
        var old_ip = localStorage.ip;
        var tagContainer = $('#tagRoot');
        serverDialogOverlay.attr('id', 'serverDialogOverlay');
        // debugger;
        serverDialogOverlay.css({
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            'background-color': 'rgba(0,0,0,0.6)',
            'z-index': 1000000000 + 5
        });

        // dialog box for server changes
        var serverDialog = $(document.createElement('div'));
        serverDialog.attr('id', 'serverDialog');

        //

        var serverDialogSpecs = TAG.Util.constrainAndPosition($(tagContainer).width(), $(tagContainer).height(),
        {
            center_h: true,
            center_v: true,
            width: 0.5,
            height: 0.35,
            max_width: 560,
            max_height: 230
        });
        serverDialog.css({
            position: 'absolute',
            left: '30%',//serverDialogSpecs.x + 'px',
            top: '30%',//serverDialogSpecs.y + 'px',
            width: '40%',   //serverDialogSpecs.width + 'px',
            height: '40%',   //serverDialogSpecs.height + 'px',
            border: '3px double white',
            'text-align': 'center',
            'background-color': 'black'
        });

        serverDialogOverlay.append(serverDialog);
        var serverDialogTitle = $(document.createElement('div'));
        serverDialogTitle.attr('id', 'dialogTitle');
        serverDialogTitle.css({
            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'top': '10%',
            'font-size': '1.35em',
            'position': 'relative',
            'text-align': 'center'
        });
        serverDialogTitle.text("TAG Server Address:");
        serverDialog.append(serverDialogTitle);

        var serverDialogInput = $(document.createElement('input'));
        serverDialogInput.attr('id', 'serverDialogInput');
        serverDialogInput.css({
            display: 'block',
            margin: 'auto',
            'margin-bottom': '1%',
            'width': '60%',
	        'height':'10%',
            'position':'relative',
            'top':'15%',
	        'font-size':'100%'
        });
        serverDialogInput.val(localStorage.ip);
        serverDialogInput.focus(function () {
            serverDialogInput.select();
        });
        serverDialog.append(serverDialogInput);
        serverDialogInput.on('keydown', function(evt) {
            if(evt.which === 13) {
                saveClick();
            }
        });

        TAG.Telemetry.register(serverDialogInput, 'keydown', 'change_server', function(tobj, evt) {
            if(evt.which !== 13) {
                return true;
            }
            tobj.old_address = localStorage.ip;
            tobj.new_address = serverDialogInput.val();
        });

        var serverDialogContact = $(document.createElement('div'));
        serverDialogContact.css({ 'margin-top': '10%' , 'color':'white','text-align': 'center'  });
        serverDialogContact.html(
            "Contact us for server setup at:<br /><a href='mailto:brown.touchartgallery@outlook.com'>brown.touchartgallery@outlook.com</a>."
        );
        serverDialog.append(serverDialogContact);

        var serverButtonRow = $(document.createElement('div'));
        serverButtonRow.css({
            'margin-top': '5%',
        });
        serverDialog.append(serverButtonRow);
        var serverSaveButton = $(document.createElement('button'));
        serverSaveButton.css({
            'padding': '1%', 'border': '1px solid white', 'width': '14%','height':'3%' ,'position': 'relative','margin-top': '1%', 'float': "left", 'margin-left':'7%' ,'font-size':'90%','bottom':'1%'
        });
        serverSaveButton.text('Save');
        var serverErrorMessage = $(document.createElement('div'));
        serverErrorMessage.attr('id', 'serverErrorMessage');
        serverErrorMessage.css({
            'color': 'white',
            'left': '10%',
            'width': '80%',
	        'height':'10%',
            'text-align': 'center',
            'position': 'relative',
        });

        serverButtonRow.append(serverErrorMessage);
        serverErrorMessage.hide();


        var serverCancelButton = $(document.createElement('button'));
        serverCancelButton.css({
            'padding': '1%', 'border': '1px solid white', 'width': '14%','height':'3%', 'position': 'relative', 'margin-top': '1%', 'float': "right", 'margin-right': '7%','font-size':'90%','bottom':'1%'
        });
        serverCancelButton.text('Cancel');
        serverCancelButton.attr('type', 'button');
        serverButtonRow.append(serverCancelButton);
        serverButtonRow.append(serverSaveButton);
        serverCancelButton.click(function () {
            $('#serverDialogOverlay').remove();
        });

        function saveClick() {
            var address = serverDialogInput.val();
            switch(address) {
                case 'tagunicorn':
                    var unicorn = $(document.createElement('img'));
                    unicorn.attr('src', tagPath+'images/unicorn.jpg');
                    unicorn.css({
                        width: '100%',
                        height: '100%',
                        'z-index': 2147483647, // we really want this unicorn to show up
                        display: 'none',
                        position: 'absolute',
                    });
                    tagContainer.append(unicorn);
                    unicorn.fadeIn(500);
                    setTimeout(function () {
                        $('img').attr('src', tagPath+'images/unicorn.jpg');
                        $('.background').css('background-image', 'url('+tagPath+'"images/unicorn.jpg")');
                        unicorn.fadeOut(500, function () { unicorn.remove(); });
                    }, 5000);
                    return;
                case 'tagtest':
                    address = 'tagtestserver.cloudapp.net';
                    break;
                case 'tagdemo':
                    address = 'tagdemo.cloudapp.net';
                    break;
                case 'taglive':
                    address = 'browntagserver.com';
                    break;
                case 'taglocal':
                    address = '10.116.71.58';
                    break;
                case 'sam':
                case 'seattleartmuseum':
                    address = 'tag.seattleartmuseum.org'
                    break;
                default:
                    break;
            }
            serverCancelButton.hide();
            serverSaveButton.hide();
            serverErrorMessage.html('Connecting...');
            serverErrorMessage.show();
            TAG.Worktop.Database.changeServer(address, false, function () {
                TAG.Layout.StartPage(null, function (page) {
                    TAG.Util.UI.slidePageRight(page);
                });
            }, function () {
                serverCancelButton.show();
                serverSaveButton.show();
                serverErrorMessage.html('Could not connect to the specified address. Please try again.');
                serverErrorMessage.css({ 'margin-top': '-3%'});
                serverErrorMessage.show();
                serverDialogTitle.css({ 'margin-bottom': '-3%'});
                serverDialog.css({
                    width: '40%',   //serverDialogSpecs.width + 'px',
                    height: '45%',   //serverDialogSpecs.height + 'px',
                });
                serverDialogContact.css({ 'margin-top': '13%' , 'color':'white','text-align': 'center'  });        
            });
        }

        serverSaveButton.on('click', saveClick);

        TAG.Telemetry.register(serverSaveButton, 'click', 'change_server', function(tobj, evt) {
            tobj.old_address = localStorage.ip;
            tobj.new_address = serverDialogInput.val();
        });

        var serverCircle = $(document.createElement('img'));
        serverCircle.css({
            'width': '20px',
            'height': 'auto',
            'display': 'none',
            'margin-right': '3%',
            'margin-top': '2.5%',
            'float': 'right'
        });
        serverCircle.attr('src', tagPath+'images/icons/progress-circle.gif');

        var serverPasswordErrorMessage = $(document.createElement('div'));
        serverPasswordErrorMessage.attr('id', 'serverPasswordErrorMessage');
        serverPasswordErrorMessage.css({
            color: 'white',
            'font-size': '1.25em',
            'margin-bottom': '10px',
        });
        serverPasswordErrorMessage.html('Invalid authoring password entered. Please try again.');
        serverPasswordErrorMessage.hide();

        tagContainer.append(serverDialogOverlay);
        serverDialogInput.focus();
    }


    function FeedbackBox(sourceType, sourceID) {
        var dialogOverlay = $(document.createElement('div'));
        var tagContainer = $('#tagRoot');
        $(dialogOverlay).attr('id', 'dialogOverlay');

        $(dialogOverlay).css({
            display: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            'background-color': 'rgba(0,0,0,0.6)',
            'z-index': 10000000,
        });

        var feedbackBox = $(document.createElement('div'));
        $(feedbackBox).addClass('feedbackBox');
        var feedbackBoxSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),

        {
            center_h: true,
            center_v: true,
            width: 0.5,
            height: 0.35,
            max_width: 560,
            max_height: 210,
        });
		var leftPos = ($('#tagRoot').width() - feedbackBoxSpecs.width) * 0.5;
        $(feedbackBox).css({
            position: 'absolute',
            left: '20%', //leftPos + 'px',
            top: '25%', // feedbackBoxSpecs.y + 'px',
            width: '62%', // feedbackBoxSpecs.width + 'px',
            height: '45%', // feedbackBoxSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',

        });

        $(dialogOverlay).append(feedbackBox);
		$(dialogOverlay).click(cancelFeedback);
		$(feedbackBox).click(function(event){
			event.stopPropagation();
		});
		
        var feedbackLabel = $(document.createElement('label'));
        $(feedbackLabel).addClass('feedbackLabel');
        $(feedbackLabel).text('Send Feedback');
        $(feedbackLabel).css({
            'left': '9%',
            'top': '12.5%',
            'width': '80%',
            'height': '15%',
            'text-align': 'left',
            'color': 'white',
            'position': 'absolute',
            'font-size': '100%'
        });

        var commentBox = $(document.createElement('textarea'));
        $(commentBox).addClass('commentBox');
        $(commentBox).css({
            'border-color': 'gray',
            'color': 'gray',
            'position': 'relative',
            'min-width': 0,
            'left': '9%',
            'top': '12%',
            'width': '77%',
            'height': '30%'


        });

        $(commentBox).attr('placeholder', 'Questions or Comments');

        /*******buttons********/

        var buttonRow = $(document.createElement('div'));
        $(buttonRow).css({
            'position': 'relative',
            'width': '80%',
            'left': '10%',
            'bottom': '-74%',
            'display': 'inline-block'
        });
        var submitButton = $(document.createElement('button'));
        $(submitButton).css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
            'margin-left': '-2%',
            'display': 'inline-block',
        });
        $(submitButton).text('Send ');
        $(submitButton).on('click', submitFeedback);

        function submitFeedback() {
            var type = (typeof sourceType === 'function') ? sourceType() : sourceType;
            var id = (typeof sourceID === 'function') ? sourceID() : sourceID;
            TAG.Worktop.Database.createFeedback($(commentBox).val(), type, id);
            $(dialogOverlay).css({ 'display': 'none' });
            $(commentBox).val('');
            var popup = TAG.Util.UI.popUpMessage(null, "Your feedback has been submitted, thank you for your feedback.", null, null, null, true);
            tagContainer.append(popup);
            $(popup).css('z-index', 1000000);
            $(popup).show();
        }
        var cancelButton = $(document.createElement('button'));
        $(cancelButton).css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
            'float': "right",
            'margin-right': '-2%',
            'display': 'inline-block',
        });
        $(cancelButton).text('Cancel');
        
        $(cancelButton).click(cancelFeedback);
        function cancelFeedback() {
            $(commentBox).val('');
            $(dialogOverlay).css({ 'display': 'none' });

        }
        $(feedbackBox).append(buttonRow);
        $(buttonRow).append(submitButton);
        $(buttonRow).append(cancelButton);

        $(feedbackBox).append(commentBox);
        $(feedbackBox).append(feedbackLabel);
        return dialogOverlay;
    }

    // overlay that "absorbs" interactions with elements below it, used to isolate popup forms etc.
    function blockInteractionOverlay(opac) {
        opac = opac ? Math.max(Math.min(parseFloat(opac), 1), 0) : 0.6;
        var overlay = document.createElement('div');
        $(overlay).attr('id', 'blockInteractionOverlay');
        $(overlay).css({
            display: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            'background-color': 'rgba(0,0,0,'+opac+')',
            'z-index': '10000000'
        });
        return overlay;
    }

    // unused - this is not tested, use at your own risk - consider removing?
    //function PopUpWarningBox(message) {
    //    var overlay = BlockInteractionOverlay();
    //    var WarningBox = document.createElement('div');
    //    $(WarningBox).css({
    //        'height': '30%',
    //        'width': '45%',
    //        'position': 'fixed',
    //        'top': '50%',
    //        'left': '50%',
    //        'margin-top': '-15%',
    //        'margin-left': '-22.5%',
    //        'background-color': 'black',
    //        'z-index': '100',
    //        'border': '3px double white',
    //    });

    //    var messageLabel = document.createElement('div');
    //    $(messageLabel).css({ 'top': '5%', 'height': '20%', 'width': '90%', 'color': 'white', 'margin': '5%', 'font-size': '200%' });
    //    $(messageLabel).text(message);

    //    var optionButtonDiv = document.createElement('div');
    //    $(optionButtonDiv).css({ 'height': '10%', 'width': '25%', 'left': '70%', 'position': 'relative', 'top': '35%' });
    //    var okButton = document.createElement('button');
    //    $(okButton).css({ 'font-size': '140%', 'margin-left': '2%' });
    //    $(okButton).text("OK");
    //    okButton.onclick = function () {
    //        $(overlay).fadeOut(500, function () { $(overlay).remove(); });
    //    }
    //    $(optionButtonDiv).append(okButton);

    //    $(confirmBox).append(messageLabel);
    //    $(confirmBox).append(optionButtonDiv);

    //    $(overlay).append(confirmBox)
    //    return overlay;
    //}

    // generate a popup message with specified text and button
    function popUpMessage(clickAction, message, buttonText, noFade, useHTML, onDialogClick) {
        var overlay = blockInteractionOverlay();

        var confirmBox = document.createElement('div');
        var confirmBoxSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 560,
               max_height: 200,
           });
		var leftPos = ($('#tagRoot').width() - confirmBoxSpecs.width) * 0.5;
        $(confirmBox).css({
            //'height': '30%',
            //'width': '45%',
            //'position': 'absolute',
            //'top': '50%',
            //'left': '50%',
            //'margin-top': '-15%',
            //'margin-left': '-22.5%',
            //'background-color': 'black',
            //'z-index': '100',
            //'border': '3px double white',

            position: 'absolute',
            left: leftPos + 'px',
            top: confirmBoxSpecs.y + 'px',
            width: confirmBoxSpecs.width + 'px',
            height: confirmBoxSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',

        });
		if(onDialogClick){
			$(overlay).click(removeAll);
			$(confirmBox).click(function(event){
				event.stopPropagation();
			});
		}

        var messageLabel = document.createElement('div');
        $(messageLabel).css({
            //'top': '5%',
            //'height': '20%',
            //'width': '90%',
            //'color': 'white',
            //'margin': '5%',
            //'font-size': '200%'

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
        if (useHTML) {
            $(messageLabel).html(message);
        } else {
            $(messageLabel).text(message);
        }
        var optionButtonDiv = document.createElement('div');
        $(optionButtonDiv).addClass('optionButtonDiv');
        $(optionButtonDiv).css({
            'height': '10%',
            'width': '100%',
            'position': 'absolute',
            'bottom': '12%',
            'right': '2%',
        });

        var confirmButton = document.createElement('button');
        $(confirmButton).css({
            //'font-size': '140%',
            //'margin-left': '2%',
            //'float': 'right',
            //'margin-right':'2%'

            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            //'margin-top': '1%',
            'float': "right",
            'margin-right': '3%',
            'margin-top': '-3%',
        });
        buttonText = (!buttonText || buttonText === "") ? "OK" : buttonText;
        $(confirmButton).text(buttonText);
        confirmButton.onclick = function () {
            if (clickAction)
                clickAction();
            removeAll();
        };

        function removeAll() {
            if (noFade) {
                $(overlay).hide();
                $(overlay).remove();
            } else {
                $(overlay).fadeOut(500, function () { $(overlay).remove(); });
            }
        }

        $(optionButtonDiv).append(confirmButton);

        $(confirmBox).append(messageLabel);
        $(confirmBox).append(optionButtonDiv);

        $(overlay).append(confirmBox);
        return overlay;
    }

    // popup message to ask for user confirmation of an action e.g. deleting a tour
    function PopUpConfirmation(confirmAction, message, confirmButtonText, noFade, cancelAction, container) {
        var overlay = blockInteractionOverlay();
        container = container || window;
        var confirmBox = document.createElement('div');
        var confirmBoxSpecs = TAG.Util.constrainAndPosition($(container).width(), $(container).height(),
            {
                center_h: true,
                center_v: true,
                width: 0.5,
                height: 0.35,
                max_width: 560,
                max_height: 200,
            });

        $(confirmBox).css({
            position: 'absolute',
            left: confirmBoxSpecs.x + 'px',
            top: confirmBoxSpecs.y + 'px',
            width: confirmBoxSpecs.width + 'px',
            height: confirmBoxSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black'
        });

        var messageLabel = document.createElement('div');
        $(messageLabel).css({
            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '1.25em',
            'position': 'relative',
            'text-align': 'center',
            'word-wrap': 'break-word'
        });
        $(messageLabel).text(message);
        var optionButtonDiv = document.createElement('div');
        $(optionButtonDiv).addClass('optionButtonDiv');
        $(optionButtonDiv).css({
            'height': '20%',
            'width': '100%',
            'position': 'absolute',
            'bottom': '10%',
            'right': '5%'
        });

        var confirmButton = document.createElement('button');
        $(confirmButton).css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'float': "left",
            'margin-left': '12%',
            'margin-top': '-1%'

        });
        confirmButtonText = (!confirmButtonText || confirmButtonText === "") ? "Confirm" : confirmButtonText;
        $(confirmButton).text(confirmButtonText);
        confirmButton.onclick = function () {
            removeAll();
            confirmAction();
        };

        var cancelButton = document.createElement('button');
        $(cancelButton).css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'float': "right",
            'margin-right': '3%',
            'margin-top': '-1%'
        });
        $(cancelButton).text('Cancel');
        cancelButton.onclick = function () {
            removeAll();
            cancelAction && cancelAction();
        }

        function removeAll() {
            if (noFade) {
                $(overlay).hide();
                $(overlay).remove();
            } else {
                $(overlay).fadeOut(500, function () { $(overlay).remove(); });
            }
        }

        $(optionButtonDiv).append(cancelButton);
        $(optionButtonDiv).append(confirmButton);

        $(confirmBox).append(messageLabel);
        $(confirmBox).append(optionButtonDiv);

        $(overlay).append(confirmBox);
        return overlay;
    }

    /**
     * Following functions transition between pages while in splitscreen mode
     */
    /**
     * Use _Split fn's for transitions that need to preserve splitscreen
     * Note: pages passed in to this function should have a top-level root node
     * (true of exhibition, catalog and artmode)
     */
    // used for setting button colors
    function cgBackColor(buttonType, buttonToChange, isMouseLeave) {
        switch (buttonType) {
            case "backButton":
                if (!isMouseLeave) {
                    $(buttonToChange).css({ 'background-color': 'gray', 'border-radius': '999px' });
                }
                else {
                    $(buttonToChange).css({ 'background-color': 'transparent', 'border-radius': '999px' });
                }
                break;
            case "labelButton":
                $(buttonToChange).css({ 'background-color': 'white', 'color': 'black' });
                break;
            case "forwardButton":
                $(buttonToChange).css({ 'background-color': 'gray' });
                break;
        }
    }

    /**
     * Set up handlers for back button
     * @method setUpBackButton
     * @param {jQuery Obj} elt         jQuery object for back button element
     * @param {Function} clickHandler  click handler for button
     */
    function setUpBackButton(elt, clickHandler) {
        elt.on('mouseleave', function () {
            cgBackColor("backButton", elt, true);
        });
        elt.on('mousedown', function () {
            cgBackColor("backButton", elt, false);
        });
        elt.on('click', clickHandler);
    }

    // slide towards left (splitscreen)
    function slidePageLeftSplit(oldpage, newpage, callback) {
        var outgoingDone = false,
            incomingDone = false,
            metaContainer = oldpage.parent(),
            outgoing = makeFullPage(),
            incoming = makeFullPage();
        
        var elements = metaContainer.children();
        elements.remove();

        elements.appendTo($(outgoing));
        $(outgoing).css({ left: "0%", float: "left" });

        $(incoming).append(newpage);
        $(incoming).css({ left: "120%", display: "inline" });

        metaContainer.append(outgoing);
        metaContainer.append(incoming);

        $(outgoing).animate({ left: "-120%" }, 1000, 'easeOutQuad', function () {
            $(outgoing).remove();
            outgoingDone = true;
            makeCallback();
        });
        $(incoming).animate({ left: "0%" }, 1000, 'easeOutQuad', function () {
            $(incoming).detach();
            metaContainer.append(newpage);
            incomingDone = true;
            makeCallback();
        });

        function makeCallback() {
            if (outgoingDone && incomingDone) {
                if (callback)
                    callback();
            }
        }
    }

    // slide towards right (splitscreen)
    function slidePageRightSplit(oldpage, newpage, callback) {
        var outgoingDone = false,
            incomingDone = false,
            metaContainer = oldpage.parent(),
            outgoing = makeFullPage(),
            incoming = makeFullPage(),
            elements = metaContainer.children();

        elements.detach();

        elements.appendTo($(outgoing));
        $(outgoing).css({ left: "0%", float: "left" });

        $(incoming).append(newpage);
        $(incoming).css({ left: "-120%", display: "inline" });

        metaContainer.append(outgoing);
        metaContainer.append(incoming);

        $(outgoing).animate({ left: "120%" }, 1000, 'easeOutQuad', function () {
            $(outgoing).remove();
            outgoingDone = true;
            makeCallback();
        });
        $(incoming).animate({ left: "0%" }, 1000, 'easeOutQuad', function () {
            $(incoming).detach();
            metaContainer.append(newpage);
            incomingDone = true;
            makeCallback();
        });

        function makeCallback() {
            if (outgoingDone && incomingDone) {
                if (callback)
                    callback();
            }
        }
    }

    /**
     * Use for any page transition that does not need to preserve splitscreen
     */
    // towards left
    function slidePageLeft(newpage, callback) {
        var outgoingDone = false;
        var incomingDone = false;
        var tagContainer = $('#tagRoot');

        var elements = tagContainer.children();
        elements.remove();

        var outgoing = makeFullPage();
        elements.appendTo($(outgoing));
        $(outgoing).css({ left: "0%", float: "left" });

        var incoming = makeFullPage();
        $(incoming).append(newpage);
        $(incoming).css({ left: "120%", display: "inline" });

        tagContainer.append(outgoing);
        tagContainer.append(incoming);

        $(outgoing).animate({ left: "-120%" }, 1000, 'easeOutQuad', function () {
            $(outgoing).remove();
            outgoingDone = true;
            makeCallback();
        });
        $(incoming).animate({ left: "0%" }, 1000, 'easeOutQuad', function () {
            $(incoming).detach();
            tagContainer.append(newpage);
            incomingDone = true;
            makeCallback();
        });

        function makeCallback() {
            if (outgoingDone && incomingDone) {
                if (callback)
                    callback();
            }
        }
    }

    // towards right
    function slidePageRight(newpage, callback) {
        var outgoingDone = false;
        var incomingDone = false;
        var tagContainer = $('#tagRoot');

        var elements = tagContainer.children();
        elements.remove();

        var outgoing = makeFullPage();
        elements.appendTo($(outgoing));
        $(outgoing).css({ left: "0%", float: "left" });

        var incoming = makeFullPage();
        $(incoming).append(newpage);
        $(incoming).css({ left: "-120%", display: "inline" });

        tagContainer.append(outgoing);
        tagContainer.append(incoming);

        $(outgoing).animate({ left: "120%" }, 1000, 'easeOutQuad', function () {
            $(outgoing).remove();
            outgoingDone = true;
            makeCallback();
        });
        $(incoming).animate({ left: "0%" }, 1000, 'easeOutQuad', function () {
            $(incoming).detach();
            tagContainer.append(newpage);
            incomingDone = true;
            makeCallback();
        });

        function makeCallback() {
            if (outgoingDone && incomingDone) {
                if (callback)
                    callback();
            }
        }
    }

    // cleanup: currently unused, leave or delete up to reviewer
    /*function makeTriangle(width, height, color) {
        var toReturn = document.createElement('div');
        $(toReturn).css({
            width: "0px", height: "0px", "border-top": (height / 2) + "px solid transparent",
            "border-bottom": (height / 2) + "px solid transparent", "border-left": width + "px solid " + color
        });
        return toReturn;
    }*/

    // make a full-page div
    function makeFullPage() {
        var newPage = document.createElement("div");
        $(newPage).css({ height: "100%", width: "100%", position: "absolute" });
        return newPage;
    }

    function hexToRGB(h) { return 'rgba(' + hexToR(h) + ',' + hexToG(h) + ',' + hexToB(h) + ','; } // return rgba value of hex color leaving space for alpha
    function hexToR(h) { return parseInt((cutHex(h)).substring(0, 2), 16); }
    function hexToG(h) { return parseInt((cutHex(h)).substring(2, 4), 16); }
    function hexToB(h) { return parseInt((cutHex(h)).substring(4, 6), 16); }
    function cutHex(h) { return (h.charAt(0) === "#") ? h.substring(1, 7) : h; }

    //Takes a RGB or RGBA color value as input and outputs the Hex color representation, without the '#' symbol in front
    function colorToHex(rgb) {
        var digits = rgb.match(/(rgb|rgba)\((\d+),\s*(\d+),\s*(\d+)\,*\s*((\d+\.\d+)|\d+)*\)$/);
        function hex(x) {
            var str = ("0" + parseInt(x, 10).toString(16)).toUpperCase();  
            return str.slice(-2);
        }
        if (digits !== null && digits !== undefined) { // string.match() returns null if regexp fails
            return hex(digits[2]) + hex(digits[3]) + hex(digits[4]);
        }
        else if (rgb === "transparent") {
            return "000000"; // Prevent this from breaking due to bad server state (jastern 3/7/2013)
        }
        else {
            return "000000";
        }
    }

    //function called to fit the text (that is wrapped in a span) within a div element.
    //created for fitting text in museumInfo
    function fitTextInDiv(element, max, min) {
        var fontSize = parseInt(element.css('font-size'), 10);
        if (parseInt(element.parent()[0].scrollHeight, 10) > element.parent().height()) {
            while (parseInt(element.parent()[0].scrollHeight, 10) > element.parent().height() && fontSize > min) {
                fontSize--;
                element.css('font-size', fontSize + 'px');
            }
        } else if (parseInt(element.height(), 10) < (element.parent().height())) {
            while (parseInt(element.height(), 10) < (element.parent().height()) && fontSize < max) {
                fontSize++;
                element.css('font-size', fontSize + 'px');
                if (parseInt(element.parent()[0].scrollHeight, 10) > element.parent().height()) {
                    fontSize--;
                    element.css('font-size', fontSize);
                    break;
                }
            }
        }
    }


    //makes the "no artworks in selected exhibiton" dialog box, used in both exhibition view and authoring
    function makeNoArtworksOptionBox() {
        var overlay = blockInteractionOverlay();
        var noArtworksOptionBox = document.createElement('div');
        $(noArtworksOptionBox).addClass('noArtworksOptionBox');
        $(noArtworksOptionBox).css({
            'width': '45%',
            'position': 'absolute',
            'top': '40%',
            'left': '25%',
            'padding': '2% 2%',
            'background-color': 'black',
            'border': '3px double white',
            'z-index': '10000',
            'id': 'deleteOptionBox'
        });
        var noArtworksLabel = document.createElement('p');
        $(noArtworksLabel).css({
            'font-size': '150%',
            'color': 'white'
        });
        $(noArtworksLabel).text('There are no artworks present in this collection.');

        var okButton = document.createElement('button');
        $(okButton).css({
            'float': 'right'
        });
        $(okButton).text('OK');


        okButton.onclick = function () {
            $(overlay).fadeOut(500, function () { $(overlay).remove(); });
        };

        $(noArtworksOptionBox).append(noArtworksLabel);
        $(noArtworksOptionBox).append(okButton);
        $(overlay).append(noArtworksOptionBox);
        return overlay;
    }

    //Creates Microsoft.Maps.Pushpin objects from the locObjects within the locationList object, and displays the pushpins on the map
    function drawPushpins(locationList, map) {
        map.entities.clear();
        for (var i = 0; i < locationList.length; i++) {
            var locationItem = locationList[i];
            var location;
            if (locationItem.resource.latitude) { // if latitude exists then it's a custom pushpin
                location = locationItem.resource;
            } else {
                var lat = locationItem.resource.point.coordinates[0];
                var long = locationItem.resource.point.coordinates[1];
                location = new Microsoft.Maps.Location(lat, long);
            }
            var pushpinOptions = {
                text: String(i + 1),
                icon: tagPath+'images/icons/locationPin.png',
                width: 20,
                height: 30
            };
            var pushpin = new Microsoft.Maps.Pushpin(location, pushpinOptions);

            //Add some info about the location in the pin
            //if (locationItem.date) {
            //    pushpin.date = locationItem.date;
            //} else {
            //    pushpin.date = 'Date Unspecified';
            //}

            pushpin.location = locationItem.address;
            pushpin.description = '';
            if (locationItem.info) {
                pushpin.description = locationItem.info;
            }
            map.entities.push(pushpin);
        }

    }

    function addCustomPushpin(locs, currentLocationIndex) {
        var pushpinOptions = {
            text: String(currentLocationIndex),
            icon: tagPath+'/images/icons/locationPin.png',
            width: 20,
            height: 30
        };
        var pushpin = new Microsoft.Maps.Pushpin(locs.resource, pushpinOptions);
        pushpin.location = locs.address;
        pushpin.description = '';
        if (locs.info) {
            pushpin.description = locs.info;
        }
        locs.pushpin = pushpin;
    }

    //function takes a locObject and creates the pushpins that correspond to them 
    function addPushpinToLoc(locs, currentLocationIndex) {
        //set pushpin for location
        if (locs.resource.latitude) {
            addCustomPushpin(locs, currentLocationIndex);
            return;
        }
        var lat = locs.resource.point.coordinates[0];
        var long = locs.resource.point.coordinates[1];
        var location = new Microsoft.Maps.Location(lat, long);
        var pushpinOptions = {
            text: String(currentLocationIndex),
            icon: tagPath+'/images/icons/locationPin.png',
            width: 20,
            height: 30
        };
        var pushpin = new Microsoft.Maps.Pushpin(location, pushpinOptions);

        //Add some info about the location in the pin
        //if (locs.date && !isNaN(locs.date.year)) {
        //    pushpin.date = locs.date;
        //} else {
        //    pushpin.date = 'Date Unspecified';
        //}

        pushpin.location = locs.address;
        pushpin.description = '';
        if (locs.info) {
            pushpin.description = locs.info;
        }
        //assign pushpin to location
        locs.pushpin = pushpin;
    }

    //gets JSON encoded location list from artwork XML and displays the information
    function getLocationList(metadata) {
        var locationList;
        //parsing the location field in the artwork metadata to obtain the pushpin information
        var data = metadata.Location;
        try {
            locationList = JSON.parse(data);
        } catch (e) {
            console.log('artwork location metadata cannot be parsed.');
            locationList = [];
        }

        // load dates and modernize old date objects
        for (var i = 0; i < locationList.length; i++) {
            var locationItem = locationList[i];
            if (locationItem.date) {
                // convert old dates to new dates
                if (locationItem.date.getFullYear) {
                    var y = date.getUTCFullYear();
                    var m = date.getUTCMonth();
                    var d = date.getUTCDay();
                    locationItem.date = {
                        year: y,
                        month: m,
                        day: d,
                    }
                }
                locationItem.pushpin.date = locationItem.date;
            }
        }

        return locationList;
    }

    var selectCSS = {
        'color': '#aaaaaa',
        'display': 'inline-block',
        'margin-left': '20px'
    };

    /**
     * Creates a picker (e.g. click add/remove media in the artwork editor) to manage
     *   associations between different TAG components (exhib, artworks, assoc media)
     * @param root           object: jquery object for the root of the DOM (we'll append an overlay to this)
     * @param title          string: the title to appear at the top of the picker
     * @param target         object: a comp property (object whose associations we're managing) and a type property
     *                               ('exhib', 'artwork', 'media') telling us what kind of component it is
     * @param type           string: "exhib" (exhib-artwork), "artwork" (artwork-media) : type of the association
     * @param tabs           array: list of tab objects. Each has a name property (string, title of tab), a getObjs
     *                              property (a function to be called to get each entity listed in the tab), and a
     *                              args property (which will be extra arguments sent to getObjs)
     * @param filter         object: a getObjs property to get components that are already associated with target
     *                               (e.g. getAssocMediaTo if type='artwork') and an args property (extra args to getObjs)
     * @param callback       function: function to be called when import is clicked or a component is double clicked
     */
    function createAssociationPicker(root, title, target, type, tabs, filter, callback) {
        var pickerOverlay,
            picker,
            pickerHeader,
            tabBanner,
            tab,
            i,
            searchTab,
            pickerSearchBar,
            selectAllLabel,
            deselectAllLabel,
            mainContainer,
            addedComps = [], // components we will be associating to target
            addedCompsObjs = [], // keep track of the component objects (to be added to the recently associated list)
            removedComps = [], // components whose associations with target we will be removing
            origComps = [], // components that are already associated with target
            tabCache = [], // cached results from the server
            loadQueue = TAG.Util.createQueue();

        for (i = 0; i < tabs.length; i++) {
            tabCache.push({ cached: false, comps: [] });
        }

        var filterArgs = (filter.args || []).concat([function (comps) { // this has async stuff, make sure it gets called by the time it needs to be
            for (i = 0; i < comps.length; i++) {
                origComps.push(comps[i].Identifier);
            }
        }, error, cacheError]);
        filter.getObjs.apply(null, filterArgs);

        // overlay
        pickerOverlay = $(blockInteractionOverlay());
        pickerOverlay.addClass('pickerOverlay');
        pickerOverlay.css('z-index', 10000000);
        pickerOverlay.appendTo($(root));
        pickerOverlay.fadeIn();

        // picker div
        picker = $(document.createElement('div'));
        picker.addClass("picker");
        picker.css({
            position: 'absolute',
            width: '70%',
            height: '60%',
            padding: '1%',
            'padding-left': '2%',
            'background-color': 'black',
            'border': '3px double white',
            top: '19%',
            left: '19%',
        });
        pickerOverlay.append(picker);

        // heading
        pickerHeader = $(document.createElement('div'));
        pickerHeader.addClass('pickerHeading');
        pickerHeader.text(title);
        pickerHeader.css({
            'width': '100%',
            'color': 'white',
            'font-size': '150%',
            'height': '8%',
            'margin-bottom': '10px'
        });
        picker.append(pickerHeader);

        // tab container
        if( tabs.length >= 2) {
            tabBanner = $(document.createElement('div'));
            tabBanner.css({
                'width': '100%',
                'height': '8%',
                'left': '5%'
            });
            tabBanner.attr("id", "tabBanner");
            picker.append(tabBanner);

            // tabs
            for (i = 0; i < tabs.length; i++) {
                tab = $(document.createElement('div'));
                tab.addClass('tab');
                tab.attr('id', 'tab' + i);
                tab.css({
                    'display': 'inline-block',
                    'min-width': '20%',
                    'width': 'auto',
                    'padding-left': '2%',
                    'padding-right': '2%',
                    'padding-top': '1%',
                    'height': '85%',
                    'color': 'white',
                    'border-top': '1px solid ' + ((i === 0) ? 'white' : 'black'),
                    'border-right': '1px solid ' + ((i === 0) ? 'white' : 'black'),
                    'border-left': '1px solid ' + ((i === 0) ? 'white' : 'black'), // repeated computation
                    'border-bottom': '1px solid ' + ((i === 0) ? 'black' : 'white'),
                    'text-align': 'center',

                });
                tab.text(tabs[i].name);
                tab.on('click', tabHelper(i));
                tabBanner.append(tab);
            }
            tab = $(document.createElement('div'));
            tab.attr("id", "extraSpaceAwwwwwYeahhhh");
            tab.css({
                'display': 'inline-block',
                'color': 'black',
                'width': (90 - 20 * tabs.length) + '%',
                'height': '100%',
                'border-bottom': '1px solid white',
                'border-left': '1px solid black'
            });
            tab.text('_'); // suuuuuuuuper hacky; vertical positioning wasn't right... TODO
            //tabBanner.append(tab);
        }

        searchTab = $(document.createElement('div'));
        searchTab.attr("id","searchTab");
        searchTab.css({
            'height': '8%',
            'width': '100%',
            'margin-top': '2%',
            'top': '13%'
        })

        picker.append(searchTab);

        // search bar
        pickerSearchBar = $(document.createElement('input'));
        pickerSearchBar.attr('type', 'text');
        pickerSearchBar.css({
            'margin-left': '1%',
            'width': '20%',
            'height': '55%',
        });
        pickerSearchBar.on('keyup', function (event) {
            event.stopPropagation();
        });
        // TAG.Util.defaultVal("Search by Name...", pickerSearchBar, true, IGNORE_IN_SEARCH); // TODO more specific search (e.g. include year for artworks)
        pickerSearchBar.attr("placeholder", "Search by Name...");
        pickerSearchBar.keyup(function () {
            TAG.Util.searchData(pickerSearchBar.val(), '.compHolder', IGNORE_IN_SEARCH);
        });
        pickerSearchBar.change(function () {
            if (pickerSearchBar.val() !== '') {
                TAG.Util.searchData(pickerSearchBar.val(), '.compHolder', IGNORE_IN_SEARCH);
            }
        });
        searchTab.append(pickerSearchBar);

        // select all label
        selectAllLabel = $(document.createElement('div'));
        selectAllLabel.attr("id", "selectAllLabel");
        selectAllLabel.css({
            'color': '#aaaaaa',
            'display': 'inline-block',
            'margin-left': '5%'
        });
        selectAllLabel.text('Select All');
        selectAllLabel.on('click', function () {
            var holder, guid, index;
            $.each($('.compHolder'), function (ind, holderElt) {
                holder = $(holderElt);
                if (!holder.data("selected") && holder.css("display") !== "none") {
                    holder.css('background', '#999');
                    holder.data("selected", true);
                    guid = holder.data("guid");
                    index = origComps.indexOf(guid);
                    if (index >= 0) {
                        removedComps.remove(guid);
                    } else {
                        addedComps.push(guid);
                        addedCompsObjs.push(holder.data('comp'));
                    }
                }
            });
        }); // TODO
        searchTab.append(selectAllLabel);

        // deselect all label
        deselectAllLabel = $(document.createElement('div'));
        deselectAllLabel.attr("id", "deselectAllLabel");
        deselectAllLabel.css({
            'color': '#aaaaaa',
            'display': 'inline-block',
            'margin-left': '5%'
        });
        deselectAllLabel.text('Deselect All');
        deselectAllLabel.on('click', function () {
            var holder, guid, index, addedIndex;
            $.each($('.compHolder'), function (ind, holderElt) {
                holder = $(holderElt);
                if (holder.data("selected") && holder.css("display") !== "none") {
                    holder.css('background', '#222');
                    holder.data("selected", false);
                    guid = holder.data("guid");
                    index = origComps.indexOf(guid);
                    if (index >= 0) {
                        removedComps.push(guid)
                    } else {
                        addedIndex = addedComps.indexOf(guid);
                        addedComps.splice(addedIndex, 1);
                        addedCompsObjs.splice(addedIndex, 1);
                    }
                }
            });
        }); // TODO
        searchTab.append(deselectAllLabel);

        // main thumbnail container
        mainContainer = $(document.createElement('div'));
        mainContainer.attr("id", "mainThumbnailContainer");
        mainContainer.css({
            'overflow-y': 'scroll',
            'margin-top': '10px',
            'width': '100%',
            //'height': '75%' // should actually figure out how tall this should be based on other elements TODO
        });
        picker.append(mainContainer);
        mainContainer.css({height: (picker.height() - mainContainer.offset().top + picker.offset().top - 30) + "px"});

        // cancel and save buttons
        var optionButtonDiv = $(document.createElement('div'));
        optionButtonDiv.addClass('optionButtonDiv');
        optionButtonDiv.css({
            'height': '5%',
            'width': '100%'
        });

        var progressCSS = {
            'left': '5%',
            'top': '15px',
            'width': '40px',
            'height': 'auto',
            'position': 'relative',
            'z-index': 50
        };

        var progressCirc;

        var confirmButton = $(document.createElement('button'));
        confirmButton.css({
            'margin': '1%',
            'border': '1px solid white',
            'color': 'white',
            'padding-left': '1%',
            'padding-right': '1%',
            'background-color': 'black',
            'width': 'auto',
            'position': 'relative',
            'float': "right",
        });
        confirmButton.text("Save Changes");
        confirmButton.on('click', function () {
            progressCirc = TAG.Util.showProgressCircle(optionButtonDiv, progressCSS);
            finalizeAssociations();
        });

        var cancelButton = $(document.createElement('button'));
        cancelButton.css({
            'margin': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'color': 'white',
            'padding-left': '1%',
            'padding-right': '1%',
            'background-color': 'black',
            'position': 'relative',
            'float': "right",
            'margin-right': '3%'
        });
        cancelButton.text('Cancel');
        cancelButton.on('click', function () {
            pickerOverlay.fadeOut(function () { pickerOverlay.empty(); pickerOverlay.remove(); }); //Josh L -- fix so the div actually fades out
        });

        optionButtonDiv.append(cancelButton);
        optionButtonDiv.append(confirmButton);

        picker.append(optionButtonDiv);

        tabHelper(0)(); // load first tab

        // helper functions

        // click handler for tabs
        function tabHelper(j) {
            return function () {
                loadQueue.clear();
                progressCirc = TAG.Util.showProgressCircle(optionButtonDiv, progressCSS);
                pickerSearchBar.attr("value", "");
                mainContainer.empty();
                $(".tab").css({
                    'border-top': '1px solid black',
                    'border-right': '1px solid black',
                    'border-left': '1px solid black',
                    'border-bottom': '1px solid white'
                });
                $("#tab" + j).css({
                    'border-top': '1px solid white',
                    'border-right': '1px solid white',
                    'border-left': '1px solid white',
                    'border-bottom': '1px solid black'
                });
                if (!tabCache[j].cached) {
                    var tabArgs = (tabs[j].args || []).concat([function (comps) {
                        tabCache[j].cached = true;
                        tabCache[j].comps = comps;
                        success(comps);
                    }, error, cacheError]);
                    tabs[j].getObjs.apply(null, tabArgs);
                } else {
                    success(tabCache[j].comps); // used cached results if possible
                }

            }
        }

        function success(comps) {
            var newComps = [];
            for (var i = 0; i < comps.length; i++) {
                if (!(type === 'artwork' && comps[i].Metadata.Type === 'VideoArtwork')) {
                    newComps.push(comps[i]);
                }
            }
            drawComps(newComps, compSingleDoubleClick);
            TAG.Util.removeProgressCircle(progressCirc);
        }

        function error() {
            console.log("ERROR IN TABHELPER");
        }

        function cacheError() {
            error();
        }

        /** 
         * Creates the media panel
         * @param compArray   the list of media to appear in the panel
         * @param applyClick  function to add handlers to each holder element
         */
        function drawComps(compArray, applyClick) {
            if (compArray) {
                addedComps.length = 0;
                addedCompsObjs.length = 0;
                removedComps.length = 0;
                compArray.sort(function (a, b) {
                    return (a.Name.toLowerCase() < b.Name.toLowerCase()) ? -1 : 1;
                });
                for (var i = 0; i < compArray.length; i++) {
                    loadQueue.add(drawComp(compArray[i], applyClick));
                }
            }
        }

        function drawComp(comp, applyClick) {
            return function () {
                var compHolder = $(document.createElement('div'));
                compHolder.addClass("compHolder");
                compHolder.attr('id', comp.Identifier); // unique identifier for this media
                compHolder.data({
                    'type': comp.Metadata.ContentType,
                    'guid': comp.Identifier,
                    'name': comp.Name,
                    'duration': comp.Metadata.Duration,
                    'comp': comp
                });
                var isSelected = (origComps.indexOf(comp.Identifier) >= 0);//selectedArtworksUrls[compArray[i].Metadata.Source] ? true : false;
                if (isSelected) {
                    console.log("is selected");
                }
                compHolder.data('selected', isSelected);
                compHolder.css({
                    float: 'left',
                    background: isSelected ? '#999' : '#222',
                    width: '15%',
                    height: '35%',
                    padding: '1%',
                    //'padding-bottom': '0%',
                    margin: '1%',
                    'text-align': 'center',
                    border: '1px solid white',
                    color: 'white'
                });
                mainContainer.append(compHolder);

                // create the thumbnail to show in the media holder
                var imgHolderDiv = $(document.createElement('div'));
                imgHolderDiv.addClass('compHolderDiv');
                imgHolderDiv.css({
                    "position": 'relative',
                    "height": "75%",
                    "margin": "2%",
                    "width":"96%"
                });
                compHolder.append(imgHolderDiv);

                var compHolderImage = $(document.createElement('img')); // change to img for image
                compHolderImage.addClass('compHolderImage');

                var typeIndicatorImage = $(document.createElement('img')); // to hold a tour or video icon
                typeIndicatorImage.addClass('typeIndicatorImage');

                var FIXPATH = TAG.Worktop.Database.fixPath;
                var shouldAppendTII = false;

                if (comp.Metadata.ContentType === 'Audio') {
                    compHolderImage.attr('src', tagPath+'images/audio_icon.svg');
                }
                else if (comp.Metadata.ContentType === 'Video' || comp.Type === 'Video' || comp.Metadata.Type === 'VideoArtwork') {
                    compHolderImage.attr('src', (comp.Metadata.Thumbnail && !comp.Metadata.Thumbnail.match(/.mp4/)) ? FIXPATH(comp.Metadata.Thumbnail) : 'images/video_icon.svg');
                    shouldAppendTII = true;
                    typeIndicatorImage.attr('src', tagPath+'images/icons/catalog_video_icon.svg');
                }
                else if (comp.Metadata.ContentType === 'Image' || comp.Type === 'Image') {
                    compHolderImage.attr('src', comp.Metadata.Thumbnail ? FIXPATH(comp.Metadata.Thumbnail) : tagPath+'images/image_icon.svg');
                }
                else if (comp.Type === 'Empty') { // tours....don't know why the type is 'Empty'
                    compHolderImage.attr('src', comp.Metadata.Thumbnail ? FIXPATH(comp.Metadata.Thumbnail) : tagPath+'images/icons/catalog_tour_icon.svg');
                    shouldAppendTII = true;
                    typeIndicatorImage.attr('src', tagPath+'images/icons/catalog_tour_icon.svg');
                }
                else {//text associated media without any media...
                    compHolderImage.attr('src', tagPath+'images/text_icon.svg');
                }
                compHolderImage.css({
                    'width': '100%',
                    'height': '100%',
                    'max-width': '100%',
                    'max-height': '100%'
                });
                compHolderImage.removeAttr('width');
                compHolderImage.removeAttr('height');
                imgHolderDiv.append(compHolderImage);

                if (shouldAppendTII) {
                    typeIndicatorImage.css({
                        'position': 'absolute',
                        'width': '20%',
                        'height': 'auto',
                        'left': '75%',
                        'bottom': '5%',
                        'z-index': 2
                    });
                    typeIndicatorImage.removeAttr('width');
                    typeIndicatorImage.removeAttr('height');
                    imgHolderDiv.append(typeIndicatorImage);
                }

                // create the text to show in the media holder
                var compHolderText = $(document.createElement('div'));
                compHolderText.addClass('compHolderText');
                //trims off long names
                var name = comp.Name;
                //if (comp.Name.length > 24) { // we should do this in a more flexible way.... TODO JL
                //    name = comp.Name.slice(0, 24) + "...";
                //} else {
                //    name = comp.Name;
                //}

                compHolderText.text(name);
                compHolderText.css({
                    'padding-left': '3%',
                    'font-size': '70%',
                    //'margin' :'0% 2% 0% 2%',
                    'overflow': 'hidden',
                    //'overflow-y': 'visible',
                    'text-overflow': 'ellipsis',
                    'white-space': 'nowrap',
                    'height': '22%'
                });
                compHolder.append(compHolderText);
                applyClick(compHolder); // binds handlers
            }
        }

        //single clicking on associated media selects it, to be imported
        function compSingleClick(e, compHolder) {
            var guid = compHolder.data('guid'),
                index = origComps.indexOf(guid),
                addedIndex;
                
            if (compHolder.data("selected")) {
                compHolder.data("selected", false);
                compHolder.css('background', '#222');
                if(index >= 0) {
                    removedComps.push(guid)
                } else {
                    addedIndex = addedComps.indexOf(guid);
                    addedComps.splice(addedIndex, 1);
                    addedCompsObjs.splice(addedIndex, 1);
                }
            }
            else {
                compHolder.data("selected", true);
                compHolder.css('background', '#999');
                if (index >= 0) {
                    removedComps.remove(guid);
                } else {
                    addedComps.push(guid);
                    addedCompsObjs.push(compHolder.data('comp'));
                }
            }
            //console.log("added length = " + addedComps.length);
            //console.log("remove length = " + removedComps.length);
            //console.log("orig length = " + origComps.length + "\n");
        }

        // double clicking on associated media will import all selected media
        function compDoubleClick(evt, compHolder) {
            var guid = compHolder.data('guid'),
                index = origComps.indexOf(guid);
            compHolder.css('background', '#999');
            if (compHolder.data('selected') !== true) {
                if (index >= 0) {
                    removedComps.remove(guid)
                } else {
                    addedComps.push(guid);
                    addedCompsObjs.push(compHolder.data('comp'));
                }
                compHolder.data("selected", true);
            }
            finalizeAssociations();
        }

        //this handles discriminating between the double and single clicks for importing media
        //cleans up bugs where both click events were firing and media would import twice
        function compSingleDoubleClick(compHolder) {
            compHolder.click(function (evt) {
                var that = this;
                setTimeout(function () {
                    var dblclick = parseInt($(that).data('double'), 10);
                    if (dblclick > 0) {
                        $(that).data('double', dblclick - 1);
                    } else {
                        compSingleClick.call(that, evt, compHolder);
                    }
                }, 300);
            });
            //.dblclick(function (evt) {
            //    $(this).data('double', 2);
            //    compDoubleClick.call(this, evt, compHolder);
            //});
        }

        // adds media as an associated media of each artwork in artworks
        function finalizeAssociations() {
            var options = {};

            // only update recentlyAssociated if the target is an artwork and we're managing an artwork-media assoc
            if (type === 'artwork' && target.type === 'artwork') {
                for (var i = 0; i < addedComps.length; i++) {
                    if (recentlyAssociatedGUIDs.indexOf(addedComps[i]) < 0) {
                        recentlyAssociatedGUIDs.push(addedComps[i]);
                        recentlyAssociated.push(addedCompsObjs[i]);
                    }
                }
            }

            if (addedComps.length) {
                options.AddIDs = addedComps.join(",");
            }
            if (removedComps.length) {
                options.RemoveIDs = removedComps.join(",");
            }
            if (addedComps.length || removedComps.length) {
                if (type === 'artwork' && target.type === 'artwork') {
                    TAG.Worktop.Database.changeArtwork(target.comp.Identifier, options, function () { // SUCCESS HANDLER
                        callback();
                        pickerOverlay.fadeOut();
                        pickerOverlay.empty();
                        pickerOverlay.remove();
                    }, function (err) {
                        // AUTH ERROR HANDLER
                        console.log(err.message);
                    }, function (err) {
                        // CONFLICT HANDLER
                        console.log(err.message);
                    }, function (err) {
                        // GENERAL ERROR HANDLER
                        console.log(err.message);
                    });
                } else if (type === 'artwork' && target.type === 'media') {
                    TAG.Worktop.Database.changeHotspot(target.comp.Identifier, options, function () { // TODO (Add/RemoveIDs for changeHotspot)
                        callback();
                        pickerOverlay.fadeOut();
                        pickerOverlay.empty();
                        pickerOverlay.remove();
                    }, function (err) {
                        console.log(err.message);
                    }, function (err) {
                        console.log(err.message);
                    }, function (err) {
                        console.log(err.message);
                    });
                } else if (type === 'exhib' && target.type === 'exhib') {
                    TAG.Worktop.Database.changeExhibition(target.comp.Identifier, options, function() {
                        callback();
                        pickerOverlay.fadeOut();
                        pickerOverlay.empty();
                        pickerOverlay.remove();
                    }, function (err) {
                        console.log(err.message);
                    }, function (err) {
                        console.log(err.message);
                    }, function (err) {
                        console.log(err.message);
                    });
                }
            } else {
                callback();
                pickerOverlay.fadeOut();
                pickerOverlay.empty();
                pickerOverlay.remove();
            }
        }
    }

    function getRecentlyAssociated(callback) {
        callback(recentlyAssociated);
    }


    //var containerCSS = { // css for an entire container
    //    'width': '20%',
    //    'float': 'left',
    //    'text-align': 'center'
    //};

    //var thumbnailCSS = { // css for the thumbnail in a container
    //    'position': 'absolute',
    //    'width': '90%', // height will be set dynamically to be square
    //    'left': '5%',
    //    'top': '5%'
    //};

    //var metadataCSS = { // css for title/artist/year metadata div
    //    'position': 'absolute',
    //    'width': '90%',
    //    'left': '5%',
    //    'top': '2%',
    //    'text-overflow': 'ellipsis',
    //    'overflow': 'hidden',
    //    'white-space': 'nowrap'
    //};

    //var progressCircCSS = { // css for entity loading circles
    //    'position': 'absolute',
    //    'left': '5%',
    //    'z-index': '50',
    //    'height': 'auto',
    //    'top': '18%',
    //    'width': '10%',
    //};

    //function setHeight($elt) {
    //    var w = $elt.width();
    //    $elt.css("height", w + "px");
    //}

    ///**
    // * Creates a container for an entity, to be called by createAssociationPicker
    // * @param comp           object: component object from the server
    // * @param type           string: 'exhib', 'artwork', 'media'
    // * @param onclick        handler: click handler for the container
    // * @param selected       boolean: is the container already selected
    // * @return               object: returns the container as a jquery object
    // */
    //function createHolderButton(comp, type, onclick, selected) {
    //    var container = $(document.createElement('div'));
    //    container.addClass('pickerButton');
    //    container.css(containerCSS);
    //    var thumbnail = $(document.createElement('img'));
    //    var metadataDiv = $(document.createElement('div'));

    //    switch (type) {
    //        case 'exhib':
    //            break;
    //        case 'artwork':
    //            container.data({
    //                name: comp.Name,
    //                artist: comp.Metadata.Artist,
    //                year: comp.Metadata.Year,
    //                selected: selected
    //            });
    //            thumbnail.attr('src', TAG.Worktop.Database.fixPath(artwork.Metadata.Thumbnail));
    //            metadataDiv.html(comp.Name + '<br />' + comp.Metadata.Artist + " (" + comp.Metadata.Year + ")");
    //            break;
    //        case 'media':
    //            container.data({
    //                name: comp.title,
    //                selected: selected
    //            });
    //            thumbnail.attr('src', TAG.Worktop.Database.fixPath(comp.source));
    //            metadataDiv.html(comp.title);
    //            break;
    //        default:
    //            break;
    //    }

    //    container.on('mousedown', function () {
    //        container.css({
    //            'background': 'white',
    //        });
    //    });
    //    container.on('mouseup', function () {
    //        container.css({
    //            'background': 'transparent',
    //        });
    //    });
    //    container.on('mouseleave', function () {
    //        container.css({
    //            'background': 'transparent',
    //        });
    //    });
    //    container.on('click', function (evt) {
    //        evt.stopPropagation();
    //        container.data("selected", !container.data("selected"));
    //    });

    //    thumbnail.css(thumbnailCSS);
    //    setHeight(thumbnail);
    //    container.append(thumbnail);

    //    var circle = TAG.Util.showProgressCircle(container, progressCircCSS, '0px', '0px', false);
    //    image.load(function () {
    //        TAG.Util.removeProgressCircle(circle);
    //    });

    //    metadataDiv.css(metadataCSS);
    //    container.append(metadataDiv);

    //    return container;
    //}

})();

/**
 * Utils for the artwork viewer and the artwork editor
 * @class TAG.Util.Artwork
 */
TAG.Util.Artwork = (function () {
    "use strict";

    return {
        createThumbnailButton: createThumbnailButton
    };

    /**
     * Creates a thumbnail button to be used in a side bar list
     * @method createThumbnailButton
     * @param {Object} options      options for creating the thumbnail button:
     *            title         title of the button, shown under the thumbnail
     *            handler       a click handler for the button
     *            buttonClass   an extra class to add to the button
     *            buttonID      an id to give to the button
     *            src           thumbnail image source
     *            width         custom width of button
     *            height        custom height of button
     * @return {jQuery obj}      the button
     */
    function createThumbnailButton(options) {
        options = options || {};

        var title       = options.title,
            handler     = options.handler,
            buttonClass = options.buttonClass,
            buttonID    = options.buttonID,
            src         = options.src,
            width       = options.width,
            height      = options.height || 0.15 * $('#tagRoot').height() + 'px',
            holder               = $(document.createElement('div')).addClass('thumbnailButton'),
            thumbHolderDiv       = $(document.createElement('div')).addClass('thumbnailHolderDiv'),
            holderContainer      = $(document.createElement('div')).addClass('thumbnailButtonContainer'),
            holderInnerContainer = $(document.createElement('div')).addClass('thumbnailButtonInnerContainer'),
            thumbnailImage       = $(document.createElement('img')).addClass('thumbnailButtonImage'),
            titleDiv             = $(document.createElement('div')).addClass('thumbnailButtonTitle');

        /********************************************\

        ----------------------------------------------
        |                                            |  <--- holder
        | ------------------------------------------ |
        | |                                        | |
        | |                                        | |
        | |                                        | <------ thumbHolderDiv
        | |                                        | |
        | |              THUMBNAIL                 | |
        | |                IMAGE                   | |
        | |                 HERE                  <--------- thumbnailImage
        | |                                        | |
        | |                                        | |
        | |                                        | |
        | |                                        | |
        | |                                        | |
        | |                                        | |
        | |                                        | |
        | ------------------------------------------ |
        | ------------------------------------------ |
        | |             NAME OF DOQ                | <--- titleDiv
        | |                                        | |
        | ------------------------------------------ |
        ----------------------------------------------

        \********************************************/

        
        buttonClass && holder.addClass(buttonClass);
        holder.css('height', height);
        buttonID && holder.attr('id', buttonID);

        holder.on("click", handler);

        holder.append(thumbHolderDiv);
        thumbHolderDiv.append(holderContainer);
        holderContainer.append(holderInnerContainer);

        thumbnailImage.attr('src', src);

        thumbnailImage.removeAttr('width');
        thumbnailImage.removeAttr('height');

        thumbnailImage.css({ // TODO fix this
            'max-height': 0.15 * 0.7 * $("#tagRoot").height() + "px",
            'max-width': 0.22 * 0.89 * 0.95 * 0.40 * 0.92 * $("#tagRoot").width() + "px"
        });

        holderInnerContainer.append(thumbnailImage);

        titleDiv.text(title);
        holder.append(titleDiv);

        return holder;
    }
})();

/**
 * Built-in object extensions
 */

// From JS: the good parts
// Shortcut for adding a function to an object
Function.prototype.method = function (name, func) {
    if (!this.prototype[name]) {
        this.prototype[name] = func;
        return this;
    }
};

// Curry a function
Function.method('curry', function () {
    var slice = Array.prototype.slice,
        args = slice.apply(arguments),
        that = this;
    return function () {
        return that.apply(null, args.concat(slice.apply(arguments)));
    };
});

/**
 * If specified object is in the array, remove it
 * @param obj   object to be removed
 */
Array.method('remove', function (obj) {
    var i = this.indexOf(obj);
    if (i !== -1) {
        this.splice(i, 1);
        return true;
    } else {
        return false;
    }
});

/**
 * Insert object into array based on comparator fn given
 * Assumes array is already sorted!
 * @param obj       Object to be inserted
 * @param comp      Function used to compare objects; obj will be inserted when comp evaluates to true; takes two args, first is current array elt, second is obj
 * @returns         Index of obj in array after insertion
 */
Array.method('insert', function (obj, comp) {
    var i;
    for (i = 0; i < this.length; i++) {
        if (comp(this[i], obj)) {
            this.splice(i, 0, obj);
            return i;
        }
    }
    this.push(obj);
    return this.length - 1;
});

/**
 * Constrain a number to given range
 * @param num   value to constrain
 * @param min   minimum limit
 * @param max   maximum limit
 */
if (!Math.constrain) {
    Math.constrain = function (num, min, max) {
        return Math.min(max, Math.max(min, num));
    };
}
ITE.TAGUtils = TAG.Util;

/*************/
window.ITE = window.ITE || {};
ITE.PubSubStruct = function() {

    var callbackItems = {};
    this.subscribe = function (callback, id, context) {
        callbackItems[id || callback] = { callback: callback, context: context || this };
    };

    this.unsubscribe = function (id) {
        delete callbackItems[id];
    };

     this.publish = function (eventArgs, isAsync) {
        for (var id in callbackItems) {
            var callbackItem = callbackItems[id];
            if (isAsync) {
                (function (callbackItem) {
                    setTimeout(function () {callbackItem.callback.call(callbackItem.context, eventArgs);}, 0);})(callbackItem);
            }
            else {
                callbackItem.callback.call(callbackItem.context, eventArgs);
            }
        }
    };

    return this;
};
/*************/
window.ITE = window.ITE || {};

ITE.ImageProvider = function (trackData, player, taskManager, orchestrator){

	//Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(),
		self 		= this;

	Utils.extendsPrototype(this, _super);

    var keyframes       = trackData.keyframes;   // Data structure to keep track of all displays/keyframes

	self.player 		= player;
	self.taskManager 	= taskManager;
	self.trackData 		= trackData;
	self.orchestrator	= orchestrator;
	self.status 		= "loading";
	self.savedState		= keyframes[0];
	self.animation,
	self.interactionAnimation;

	this.trackInteractionEvent 	= new ITE.PubSubStruct();
	interactionHandlers 		= {},
	movementTimeouts 			= [],
	this.trackData   			= trackData;

    //DOM related
    var _image,
    	_UIControl;


	//Start things up...
    initialize()

   /** 
	* I/P: none
	* Initializes track, creates UI, and attachs handlers
	* O/P: none
	*/
	function initialize(){
		_super.initialize()

		//Create UI and append to ITEHolder
		_image		= $(document.createElement("img"))
			.addClass("assetImage");

		_UIControl	= $(document.createElement("div"))
			.addClass("UIControl")
			.append(_image);

		$("#ITEHolder").append(_UIControl);

		var i, keyframeData;

		for (i=1; i<keyframes.length; i++) {
			keyframeData={
						  "opacity"	: keyframes[i].opacity,
						  "top"		: (500*keyframes[i].pos.y/100) + "px",
						  "left"	: (1000*keyframes[i].pos.x/100) + "px",
						  "width"	: (1000*keyframes[i].size.x/100) + "px",
						  "height"	: (500*keyframes[i].size.y/100) + "px"
						};
			self.taskManager.loadTask(keyframes[i-1].time, keyframes[i].time, keyframeData, _UIControl, self);
		}
		self.status = "ready";
		self.setState(keyframes[0]);
		//Attach Handlers
		attachHandlers()

	};


   /** 
	* I/P: none
	* Loads actual image asset, and sets status to paused when complete
	* O/P: none
	*/
	this.load = function(){
			_super.load()

			//Sets the image’s URL source
			_image.attr("src", "../../Assets/TourData/" + this.trackData.assetUrl)

			// When image has finished loading, set status to “paused”, and position element where it should be for the first keyframe
			_image.onload = function (event) {//Is this ever getting called?
					this.setStatus(2);
					this.setState(keyframes[0]);
			};
	};

   /** 
	* I/P: none
	* Grabs current actual state of image, and sets savedState to it 
	* returns savedState
	* O/P: savedState
	*/
	this.getState = function(){
		self.savedState = {
			//displayNumber	: this.getPreviousKeyframe().displayNumber,
			time			: self.taskManager.timeManager.getElapsedOffset(),
			opacity			: window.getComputedStyle(_UIControl[0]).opacity,
			pos : {
				x		: _UIControl.position().left,
				y 		: _UIControl.position().top
			},
			size: {
				height	: _UIControl.height(),
				width	: _UIControl.width()
			},
		};	
		return self.savedState;
	};

   /**
	* I/P: state	state to make actual image reflect
	* Sets properties of the image to reflect the input state
	* O/P: none
	*/
	this.setState = function(state){
		_UIControl.css({
			"left":			state.pos.x,
			"top":			state.pos.y,
			"height":		state.size.height,
			"width":		state.size.width,
			"opacity":		state.opacity
		});
	};

	this.pause = function(){
		// Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		this.getState();
		self.animation.kill()
	}

	/* 
	I/P: none
	interpolates between current state and next keyframe
	O/P: none
	*/
	this.animate = function(duration, state){
			self.animation = TweenLite.to(_UIControl, duration, state);		
			self.animation.play();
	};

   /** 
	* I/P: none
	* Return a set of interactionHandlers attached to asset from provider
	*/
	function getInteractionHandlers(){
	}
 
    /**
     * I/P {Object} res     object containing hammer event info
     * Drag/manipulation handler for associated media
     * Manipulation for touch and drag events
     */
    function mediaManip(res) {
        var top     	= _UIControl.position().top,
            left     	= _UIControl.position().left,
            width     	= _UIControl.width(),
            height     	= _UIControl.height(),
            finalPosition;

        // If the player is playing, pause it
    	(self.orchestrator.status === 1) ? self.player.pause() : null

    	if (!res.eventType){
return    	}

        // If event is initial touch on artwork, save current position of media object to use for animation
        if (res.eventType === 'start') {
            startLocation = {
                x: left,
                y: top
            };
        }	
        // Target location (where object should be moved to)
        finalPosition = {
            x: res.center.pageX - (res.startEvent.center.pageX - startLocation.x),
            y: res.center.pageY - (res.startEvent.center.pageY - startLocation.y)
        };   

        // Animate to target location
        self.interactionAnimation && self.interactionAnimation.kill();
        self.interactionAnimation = TweenLite.to(_UIControl, .5, {
        	top: finalPosition.y,
        	left: finalPosition.x
        });		
    }
	

    /**
     * I/P {Number} scale     scale factor
     * I/P {Object} pivot     point of contact (with regards to image container, NOT window)
     * Zoom handler for associated media (e.g., for mousewheel scrolling)
     */
    function mediaScroll(scale, pivot) {
    	var t    	= _UIControl.position().top,
            l    	= _UIControl.position().left,
            w   	= _UIControl.width(),
            h  		= _UIControl.height(),
            newW  	= w * scale,
            newH,
            maxW 	= 1000,        // These values are somewhat arbitrary; TODO determine good values
            minW	= 200,
            newX,
            newY;

    	(self.orchestrator.status === 1) ? self.player.pause() : null

        // Constrain new width
        if((newW < minW) || (newW > maxW)) {
            newW 	= Math.min(maxW, Math.max(minW, newW));
        };

        // Update scale, new X and new Y according to newly constrained values.
        scale 	= newW / w;
        newH	= h * scale;
        newX 	= l + pivot.x*(1-scale);
       	newY 	= t + pivot.y*(1-scale); 

       	//Animate _UIControl to this new position
        self.interactionAnimation && self.interactionAnimation.kill();
        self.interactionAnimation = TweenLite.to(_UIControl, .05, {
        	top: newY,
        	left: newX,
        	width: newW,
        	height: newH
        });	
    }
    

    /** 
	* I/P: none
	* Initializes handlers 
	*/
    function attachHandlers() {
        // Allows asset to be dragged, despite the name
        TAG.Util.disableDrag(_UIControl);

        // Register handlers
        TAG.Util.makeManipulatable(_UIControl[0], {
            onManipulate: mediaManip,
            onScroll:     mediaScroll
        }, null, true); 

        interactionHandlers.onManipulate 	= mediaManip;
        interactionHandlers.onScroll		= mediaScroll;    	
    }
};

/*************/
window.ITE = window.ITE || {};

ITE.VideoProvider = function (trackData, player, taskManager, orchestrator){

	//Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(),
		self 		= this;

	Utils.extendsPrototype(this, _super);

    var keyframes       = trackData.keyframes;   // Data structure to keep track of all displays/keyframes

	self.player 		= player;
	self.taskManager 	= taskManager;
	self.trackData 		= trackData;
	self.orchestrator	= orchestrator;
	self.status 		= "loading";
	self.savedState		= keyframes[0];
	self.animation;
	self.audioAnimation;

	this.trackInteractionEvent 	= new ITE.PubSubStruct();
	var interactionHandlers 	= {},
	movementTimeouts 			= [];
    //DOM related
    var _video,
    	_UIControl,
    	_videoControls;

	//Start things up...
    initialize()

   /** 
	* I/P: none
	* Initializes track, creates UI, and attachs handlers
	* O/P: none
	*/
	function initialize(){
		_super.initialize()

		//Create UI and append to ITEHolder
		_video		= $(document.createElement("video"))
			.addClass("assetVideo");

		_videoControls = _video[0];

		_UIControl	= $(document.createElement("div"))
			.addClass("UIControl")
			.append(_video);

		$("#ITEHolder").append(_UIControl);

		var i, keyframeData;

		for (i=1; i<keyframes.length; i++) {
			keyframeData={
						  "opacity"	: keyframes[i].opacity,
						  "pos" : {
						  	"top"	: (500*keyframes[i].pos.y/100) + "px",
						  	"left"	: (1000*keyframes[i].pos.x/100) + "px"
						  },
						  "size" : {
						  	"width"	: (1000*keyframes[i].size.x/100) + "px"
						  },
						  "volume"	: keyframes[i].volume
						};
			self.taskManager.loadTask(keyframes[i-1].time, keyframes[i].time, keyframeData, _UIControl, self);
		}
		self.status = "ready";

		//Attach Handlers
		attachHandlers() 
	};


   /** 
	* I/P: none
	* Loads actual video asset, and sets status to paused when complete
	* O/P: none
	*/
	this.load = function(){
		_super.load()

		//Sets the image’s URL source
		_video.attr({
			"src"	: "../../Assets/TourData/" + self.trackData.assetUrl,
			"type" 	: self.trackData.type
		})

		_videoControls.load()
		// When image has finished loading, set status to “paused”, and position element where it should be for the first keyframe
		_video.onload = function (event) {//Is this ever getting called?
			this.setStatus(2);
			this.setState(keyframes[0]);
		};
	};

   /** 
	* I/P: none
	* Grabs current actual state of video, and sets savedState to it 
	* returns savedState
	* O/P: savedState
	*/
	this.getState = function(){
		self.savedState = {
			//displayNumber	: this.getPreviousKeyframe().displayNumber,
			time			: self.taskManager.timeManager.getElapsedOffset(),
			opacity			: window.getComputedStyle(_UIControl[0]).opacity,
			pos : {
				left		: _UIControl.position().left,
				top 		: _UIControl.position().top
			},
			size: {
				width	: _UIControl.width()
			},
			videoOffset	: _videoControls.currentTime,
			volume		: _videoControls.volume/self.player.currentVolumeLevel
		};	
		return self.savedState;
	};

   /**
	* I/P: state	state to make actual video reflect
	* Sets properties of the image to reflect the input state
	* O/P: none
	*/
	this.setState = function(state){
		_UIControl.css({
			"left":			state.pos.left,
			"top":			state.pos.top,
			"width":		state.size.width,
			"opacity":		state.opacity
		});
		console.log(state.volume)
		_videoControls.volume = state.volume*self.player.currentVolumeLevel;
		state.videoOffset ? (_videoControls.currentTime = parseFloat(state.videoOffset)) : 0
	};

 	/** 
	* I/P: none
	* Plays video asset
	* O/P: none
	*/
	this.play = function(targetTime, data){
		_super.play.call(self, targetTime, data);
		_videoControls.play();
		_videoControls.hasAttribute("controls") ? _videoControls.removeAttribute("controls") : null;
	}

	this.pause = function(){
		// Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		this.getState();
		self.animation.kill();
		self.audioAnimation.stop();
		_videoControls.pause()
		_videoControls.setAttribute("controls", "controls")
	}


	/* 
	* I/P: newVolume 	 new volume set by user via UI
	* Sets the current volume to the newVolume * value from keyframes, and then animates the audio to the next keyframe 
	* O/P: none
	*/
	this.setVolume = function(newVolume){
		if (newVolume === 0) {
			this.toggleMute()
		} else {	
		//Duration of current time to next keyframe
			var duration = self.currentAnimationTask.nextKeyframeTime - self.taskManager.timeManager.getElapsedOffset();
	
			//Set volume to newVolume * value from keyframes
			_videoControls.volume = _videoControls.volume*newVolume/self.player.previousVolumeLevel;
	
			if (self.taskManager.status === "playing"){
				//Stop current animation
				self.audioAnimation.stop();
			
				//Animate to the next keyframe
				self.audioAnimation =_video.animate({
					volume: self.currentAnimationTask.nextKeyframeData.volume*newVolume
				}, duration*1000);
			}
		}
	};



	/* 
	* I/P: isMuted 	 boolean, whether or not tour is now muted
	* mutes or unmutes tour
	* O/P: none
	*/
	this.toggleMute = function(isMuted){
		isMuted? _videoControls.muted = true : _videoControls.muted = false;
	}

	/* 
	I/P: none
	interpolates between current state and next keyframe
	O/P: none
	*/
	this.animate = function(duration, state){
		self.animation = TweenLite.to(_UIControl, duration, {
			"left":			state.pos.left,
			"top":			state.pos.top,
			"width":		state.size.width,
			"opacity":		state.opacity
		});
		self.animation.play();
		self.audioAnimation =_video.animate({
			volume: state.volume*self.player.currentVolumeLevel
		}, duration*1000);
	};


   /** 
	* I/P: none
	* Return a set of interactionHandlers attached to asset from provider
	*/
	function getInteractionHandlers(){
		return interactionHandlers;
	}
 
    /**
     * I/P {Object} res     object containing hammer event info
     * Drag/manipulation handler for associated media
     * Manipulation for touch and drag events
     */
    function mediaManip(res) {
        var top     	= _UIControl.position().top,
            left     	= _UIControl.position().left,
            width     	= _UIControl.width(),
            height     	= _UIControl.height(),
            finalPosition;

        // If the player is playing, pause it
    	(self.orchestrator.status === 1) ? self.player.pause() : null

        // If event is initial touch on artwork, save current position of media object to use for animation
        if (res.eventType === 'start') {
            startLocation = {
                x: left,
                y: top
            };
        }	              
        // Target location (where object should be moved to)
        finalPosition = {
            x: res.center.pageX - (res.startEvent.center.pageX - startLocation.x),
            y: res.center.pageY - (res.startEvent.center.pageY - startLocation.y)
        };   

        // Animate to target location
        self.interactionAnimation && self.interactionAnimation.kill();
        self.interactionAnimation = TweenLite.to(_UIControl, .5, {
        	top: finalPosition.y,
        	left: finalPosition.x
        });		
    }
	

    /**
     * I/P {Number} scale     scale factor
     * I/P {Object} pivot     point of contact (with regards to image container, NOT window)
     * Zoom handler for associated media (e.g., for mousewheel scrolling)
     */
    function mediaScroll(scale, pivot) {
    	var t    	= _UIControl.position().top,
            l    	= _UIControl.position().left,
            w   	= _UIControl.width(),
            h  		= _UIControl.height(),
            newW  	= w * scale,
            newH,
            maxW 	= 1000,        // These values are somewhat arbitrary; TODO determine good values
            minW	= 200,
            newX,
            newY;

    	(self.orchestrator.status === 1) ? self.player.pause() : null

        // Constrain new width
        if((newW < minW) || (newW > maxW)) {
            newW 	= Math.min(maxW, Math.max(minW, newW));
        };

        // Update scale, new X and new Y according to newly constrained values.
        scale 	= newW / w;
        newH	= h * scale;
        newX 	= l + pivot.x*(1-scale);
       	newY 	= t + pivot.y*(1-scale); 

       	//Animate _UIControl to this new position
        self.interactionAnimation && self.interactionAnimation.kill();
        self.interactionAnimation = TweenLite.to(_UIControl, .05, {
        	top: newY,
        	left: newX,
        	width: newW,
        	height: newH
        });	
    }
    

    /** 
	* I/P: none
	* Initializes handlers 
	*/
    function attachHandlers() {
        // Allows asset to be dragged, despite the name
        TAG.Util.disableDrag(_UIControl);

        // Register handlers
        TAG.Util.makeManipulatable(_UIControl[0], {
            onManipulate: mediaManip,
            onScroll:     mediaScroll
        }); 
        interactionHandlers.onManipulate 	= mediaManip;
        interactionHandlers.onScroll		= mediaScroll;    	
    }
};

/*************/
window.ITE = window.ITE || {};

ITE.DeepZoomProvider = function (trackData, player, taskManager, orchestrator){

	//Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(),
		self 		= this;

	Utils.extendsPrototype(this, _super);

    var keyframes       		= trackData.keyframes;   // Data structure to keep track of all displays/keyframes
	self.player 				= player;
	self.taskManager 			= taskManager;
	self.trackData 				= trackData;
	self.orchestrator			= orchestrator;
	self.status 				= "loading";
	this.trackInteractionEvent 	= new ITE.PubSubStruct();
	self.trackData   			= trackData;
	self.animationCallback;

	var interactionHandlers 		= {},
		movementTimeouts 			= [];

    //DOM related
    var _deepZoom,
    	_UIControl,
    	_viewer,
    	_mouseTracker;

	//Start things up...
    initialize()

   /** 
	* I/P: none
	* Initializes track, creates UI, and attachs handlers
	* O/P: none
	*/
	function initialize(){
		_super.initialize()

		//Create UI and append to ITEHolder
		_UIControl = $(document.createElement("div"))
        	.addClass("UIControl")
        	.attr("id", "DeepZoomHolder")
			.on('mousedown scroll click mousemove resize', function(evt) {
            	evt.preventDefault();
        	})
        	.css({
        		"z-index"	: 0,
        		"width"		: "100%",
        		"height"	: "100%"
        	});

		$("#ITEHolder").append(_UIControl);

		//_viewer is the actual seadragon viewer.  It is appended to UIControl.
		_viewer	= new OpenSeadragon.Viewer({
			id 			 		: "DeepZoomHolder",
			prefixUrl	 		: "../../Dependencies/openseadragon-bin-1.1.1/images/",
			zoomPerClick 		: 1,
			minZoomImageRatio	: .5,
			maxZoomImageRatio	: 2,
			visibilityRatio		: .2
		})
        _viewer.setMouseNavEnabled(false);
        _viewer.clearControls();

        // _deepZoom is the canvas with the deepZoom image files
        _deepZoom = $(_viewer.canvas)
			.addClass("deepZoomImage");

		_mouseTracker = new OpenSeadragon.MouseTracker({
			"element": "DeepZoomHolder"
		})
		
		var i, keyframeData;

		//Initialize keyframes and load into taskManager
		for (i=1; i<keyframes.length; i++) {
			keyframeData={
						  opacity	: keyframes[i].opacity,
						  bounds 	: new OpenSeadragon.Rect(parseFloat(keyframes[i].pos.x), parseFloat(keyframes[i].pos.y), keyframes[i].scale, keyframes[i].scale/2)
						};
			self.taskManager.loadTask(keyframes[i-1].time, keyframes[i].time, keyframeData, _UIControl, self);
		}
		self.status = "ready";

		// Attach Handlers
		attachHandlers()
	};

   /** 
	* I/P: none
	* Loads actual image asset, and sets status to paused when complete
	* O/P: none
	*/
	this.load = function(){
		_super.load()
		//Sets the DeepZoom's URL source
    	_viewer.open("../../Assets/TourData/" + this.trackData.assetUrl);
	};

   /** 
	* I/P: none
	* Grabs current actual state of image, and sets savedState to it 
	* returns savedState
	* O/P: savedState
	*/
	this.getState = function(){
		self.savedState = {
			time	: self.taskManager.timeManager.getElapsedOffset(),
			bounds 	: _viewer.viewport.getBounds(true)
		};	
		return self.savedState;
	};

   /**
	* I/P: state	state to make actual image reflect
	* Sets properties of the image to reflect the input state
	* O/P: none
	*/
	this.setState = function(state){
		_viewer.viewport.fitBounds(state.bounds, true);
	};

	/* 
	* I/P: {time, ms}	duration duration of animation
	* I/P: data 		data of next keyframe to animate to
	* Starts or resumes tour
	* Called when tour is played
	* Starts animation, if needed
	* O/P: none
	*/
	this.play = function(targetTime, data){
	// Resets state to be where it was when track was paused, then clears the saved state
		self.animationCallback = function() {
			self.animate(targetTime - self.savedState.time, data);
			self.savedState = null;	
			_viewer.removeHandler("animation-finish", self.animationCallback)
		}

		// If tour was paused for any reason:
		if(this.savedState) {
			// If tour has been manipulated, reset it and continue animating (via the above callback method)
			if(self.imageHasBeenManipulated){
				this.setState(this.savedState);
				_viewer.addHandler("animation-finish", self.animationCallback);	
			}
			// If tour was paused simply and has not been manipulated, just start it from where it was before 
			else {
				self.animate(targetTime - self.savedState.time, data);
			}
		} 
		// If "play" is being called from taskmanager, just start animating to the next keyframe
		else {
			this.animate(targetTime - this.taskManager.timeManager.getElapsedOffset(), data);
		}
	};

	this.pause = function(){
		// Sets savedState to be current state when tour is paused so that we can restart the tour from where we left off
		this.getState();
		this.setState(self.savedState);	// Stops animation
		self.animation.kill();
	}


	/* 
	* I/P: none
	* interpolates between current state and next keyframe
	* O/P: none
	*/
	this.animate = function(duration, state){
		self.imageHasBeenManipulated = false;
		setSeadragonConfig(duration);
		_viewer.viewport.fitBounds(state.bounds, false);
		self.animation = TweenLite.to(_UIControl, duration, {opacity: state.opacity});		
		self.animation.play(); 
	};


	/* 
	* I/P: duration	duration of track
	* Helper function for animate() that is a bit of a hack
	* Since Seadragon's animation is a bit jenky, and you can't input your own animation time, we're going to do it manually.
	* We're also going to change the "spring stiffness", which is another characteristic of their animation scheme 
	* (they use a physics-based, non-linear approach), so that Seadragon animation looks more linear and 
	* thus more similar to other animation in tours (re: Andy's Law of Least Astonishment)
	* O/P: none
	*/
	function setSeadragonConfig(duration){									
		_viewer.viewport.centerSpringY.animationTime 	= duration-.1;	
		_viewer.viewport.centerSpringX.animationTime 	= duration-.1;
		_viewer.viewport.zoomSpring.animationTime 		= duration-.1;
		_viewer.viewport.centerSpringX.springStiffness 	= .0000000001;
		_viewer.viewport.zoomSpring.springStiffness 	= .0000000001;
	}

	// Reset the above after animation is complete (called in MediaManip())
	// These are the actual values of these variables in Seadragon's src code (all animation times = 1.2, springStiffness = 6.5)
	function resetSeadragonConfig(){
		_viewer.viewport.centerSpringY.animationTime 	= 1.2;
		_viewer.viewport.centerSpringX.animationTime 	= 1.2;
		_viewer.viewport.zoomSpring.animationTime 		= 1.2;
		_viewer.viewport.centerSpringX.springStiffness 	= 6.5;
		_viewer.viewport.zoomSpring.springStiffness 	= 6.5;
	}
   /** 
	* I/P: none
	* Return a set of interactionHandlers attached to asset from provider
	*/
	function getInteractionHandlers(){
	}
 
    /**
     * I/P {Object} res     object containing hammer event info
     * Drag/manipulation handler for associated media
     * Manipulation for touch and drag events
     */
    function mediaManip(res) {
    	(self.orchestrator.status === 1) ? self.player.pause() : null
    	self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function

    	resetSeadragonConfig()
        var scale = res.scale,
            trans = res.translation,
            pivot = res.pivot;
        _viewer.viewport.panBy(_viewer.viewport.deltaPointsFromPixels(new OpenSeadragon.Point(trans.x, trans.y)), false);
    }
    
    /**
     * Scroll/pinch-zoom handler for makeManipulatable on the deepzoom image
     * @method dzScroll
     * @param {Number} scale          scale factor
     * @param {Object} pivot          location of event (x,y)
     */
    function mediaScroll(scale, pivot) {
    	(self.orchestrator.status === 1) ? self.player.pause() : null
     	self.imageHasBeenManipulated = true; // To know whether or not to reset state after pause() in play() function
    	resetSeadragonConfig()
      	_viewer.viewport.zoomBy(scale, _viewer.viewport.pointFromPixel(new OpenSeadragon.Point(pivot.x, pivot.y)), false);
    	_viewer.viewport.applyConstraints();
    }
   

    /** 
	* I/P: none
	* Initializes handlers 
	*/
    function attachHandlers() {

        // // Allows asset to be dragged, despite the name
        // TAG.Util.disableDrag(_deepZoom);

        // _deepZoom.on("mousedown", function() {
        // 	console.log("mouse down")
        // })
        // _deepZoom.on("mouseup", function() {
        // 	console.log("mouse up")
        // })
        // _deepZoom.on("mousemove", function() {
        // 	console.log("mouse move")
        // })
        // _deepZoom.on("click", function() {
        // 	console.log("click")
        // })

        // _viewer.addHandler("container-release", function() {
        // 	console.log("mouseup: " + _deepZoom.mouseup)
        // 	console.log("mousedown: " + _deepZoom.mousedown)

        // 	_deepZoom.mouseup()
        // })

        // _mouseTracker.releaseHandler = function(){
        // 	console.log("Mouse tracker worked!! release")
        // }
        // _mouseTracker.pressHandler = function(){
        // 	console.log("Mouse tracker worked!! press")
        // }

        // console.log("_mouseTracker: " + Object.keys(_mouseTracker.element))

        // Register handlers
        TAG.Util.makeManipulatable(_deepZoom[0], {
            onScroll: function (delta, pivot) {
                mediaScroll(delta, pivot);
            },
            onManipulate: function (res) {
                res.translation.x = - res.translation.x;        //Flip signs for dragging
                res.translation.y = - res.translation.y;
                mediaManip(res); 
            }
        }, null, true);

        interactionHandlers.onManipulate 	= mediaManip;
        interactionHandlers.onScroll		= mediaScroll;    	
    }
};

/*************/
window.ITE = window.ITE || {};

ITE.AudioProvider = function (trackData, player, taskManager, orchestrator){

	//Extend class from ProviderInterfacePrototype
	var Utils 		= new ITE.Utils(),
		TAGUtils	= ITE.TAGUtils,
		_super 		= new ITE.ProviderInterfacePrototype(),
		self 		= this;

	Utils.extendsPrototype(this, _super);

    var keyframes       = trackData.keyframes;   // Data structure to keep track of all displays/keyframes

	self.player 		= player;
	self.taskManager 	= taskManager;
	self.trackData 		= trackData;
	self.orchestrator	= orchestrator;
	self.status 		= "loading";
	self.savedState		= keyframes[0];
	self.animation;

	this.trackInteractionEvent 	= new ITE.PubSubStruct();
	interactionHandlers 		= {},
	movementTimeouts 			= [],
	this.trackData   			= trackData;

    //DOM related
    var _video,
    	_UIControl,
    	_videoControls;


	//Start things up...
    initialize()

   /** 
	* I/P: none
	* Initializes track, creates UI, and attachs handlers
	* O/P: none
	*/
	function initialize(){
		_super.initialize()

		//Create UI and append to ITEHolder
		_video		= $(document.createElement("video"))
			.addClass("assetVideo");

		_videoControls = _video[0];

		_UIControl	= $(document.createElement("div"))
			.addClass("UIControl")
			.append(_video);

		$("#ITEHolder").append(_UIControl);

		var i, keyframeData;

		for (i=1; i<keyframes.length; i++) {
			keyframeData={
						  "opacity"	: keyframes[i].opacity,
						  "top"		: (500*keyframes[i].pos.y/100) + "px",
						  "left"	: (1000*keyframes[i].pos.x/100) + "px",
						  "width"	: (1000*keyframes[i].size.x/100) + "px",
						  "height"	: (500*keyframes[i].size.y/100) + "px"
						};
			self.taskManager.loadTask(keyframes[i-1].time, keyframes[i].time, keyframeData, _UIControl, self);
		}
		self.status = "ready";

		//Attach Handlers
		attachHandlers()

	};


   /** 
	* I/P: none
	* Loads actual video asset, and sets status to paused when complete
	* O/P: none
	*/
	this.load = function(){
		_super.load()

		//Sets the image’s URL source
		_video.attr({
			"src"	: "../../Assets/TourData/" + this.trackData.assetUrl,
			"type" 	: this.trackData.type
		})

		_videoControls.load()
		// When image has finished loading, set status to “paused”, and position element where it should be for the first keyframe
		_video.onload = function (event) {//Is this ever getting called?
			this.setStatus(2);
			this.setState(keyframes[0]);
		};
	};

   /** 
	* I/P: none
	* Grabs current actual state of video, and sets savedState to it 
	* returns savedState
	* O/P: savedState
	*/
	this.getState = function(){
		self.savedState = {
			//displayNumber	: this.getPreviousKeyframe().displayNumber,
			time			: self.taskManager.timeManager.getElapsedOffset(),
			opacity			: window.getComputedStyle(_UIControl[0]).opacity,
			pos : {
				x		: _UIControl.position().left,
				y 		: _UIControl.position().top
			},
			size: {
				height	: _UIControl.height(),
				width	: _UIControl.width()
			},
			videoOffset	: _videoControls.currentTime
		};	
		return self.savedState;
	};

   /**
	* I/P: state	state to make actual video reflect
	* Sets properties of the image to reflect the input state
	* O/P: none
	*/
	this.setState = function(state){
		_UIControl.css({
			"left":			state.pos.x,
			"top":			state.pos.y,
			"height":		state.size.height,
			"width":		state.size.width,
			"opacity":		state.opacity
		});
		state.videoOffset ? (_videoControls.currentTime = parseFloat(state.videoOffset)) : 0
	};

 	/** 
	* I/P: none
	* Plays video asset
	* O/P: none
	*/
	this.play = function(targetTime, data){
		_super.play.call(self, targetTime, data);
		_videoControls.play();
		_videoControls.hasAttribute("controls") ? _videoControls.removeAttribute("controls") : null;
	}

	this.pause = function(){
		// Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		this.getState();
		self.animation.kill();
		_videoControls.pause()
		_videoControls.setAttribute("controls", "controls")
	}

	/* 
	I/P: none
	interpolates between current state and next keyframe
	O/P: none
	*/
	this.animate = function(duration, state){
		self.animation = TweenLite.to(_UIControl, duration, state);		
		self.animation.play();
	};

   /** 
	* I/P: none
	* Return a set of interactionHandlers attached to asset from provider
	*/
	function getInteractionHandlers(){
		return interactionHandlers;
	}
 
    /**
     * I/P {Object} res     object containing hammer event info
     * Drag/manipulation handler for associated media
     * Manipulation for touch and drag events
     */
    function mediaManip(res) {
        var top     	= _UIControl.position().top,
            left     	= _UIControl.position().left,
            width     	= _UIControl.width(),
            height     	= _UIControl.height(),
            finalPosition;

        // If the player is playing, pause it
    	(self.orchestrator.status === 1) ? self.player.pause() : null

        // If event is initial touch on artwork, save current position of media object to use for animation
        if (res.eventType === 'start') {
            startLocation = {
                x: left,
                y: top
            };
        }	              
        // Target location (where object should be moved to)
        finalPosition = {
            x: res.center.pageX - (res.startEvent.center.pageX - startLocation.x),
            y: res.center.pageY - (res.startEvent.center.pageY - startLocation.y)
        };   

        // Animate to target location
        self.interactionAnimation && self.interactionAnimation.kill();
        self.interactionAnimation = TweenLite.to(_UIControl, .5, {
        	top: finalPosition.y,
        	left: finalPosition.x
        });		
    }
	

    /**
     * I/P {Number} scale     scale factor
     * I/P {Object} pivot     point of contact (with regards to image container, NOT window)
     * Zoom handler for associated media (e.g., for mousewheel scrolling)
     */
    function mediaScroll(scale, pivot) {
    	var t    	= _UIControl.position().top,
            l    	= _UIControl.position().left,
            w   	= _UIControl.width(),
            h  		= _UIControl.height(),
            newW  	= w * scale,
            newH,
            maxW 	= 1000,        // These values are somewhat arbitrary; TODO determine good values
            minW	= 200,
            newX,
            newY;

    	(self.orchestrator.status === 1) ? self.player.pause() : null

        // Constrain new width
        if((newW < minW) || (newW > maxW)) {
            newW 	= Math.min(maxW, Math.max(minW, newW));
        };

        // Update scale, new X and new Y according to newly constrained values.
        scale 	= newW / w;
        newH	= h * scale;
        newX 	= l + pivot.x*(1-scale);
       	newY 	= t + pivot.y*(1-scale); 

       	//Animate _UIControl to this new position
        self.interactionAnimation && self.interactionAnimation.kill();
        self.interactionAnimation = TweenLite.to(_UIControl, .05, {
        	top: newY,
        	left: newX,
        	width: newW,
        	height: newH
        });	
    }
    

    /** 
	* I/P: none
	* Initializes handlers 
	*/
    function attachHandlers() {
        // Allows asset to be dragged, despite the name
        TAG.Util.disableDrag(_UIControl);

        // Register handlers
        TAG.Util.makeManipulatable(_UIControl[0], {
            onManipulate: mediaManip,
            onScroll:     mediaScroll
        }); 
        interactionHandlers.onManipulate 	= mediaManip;
        interactionHandlers.onScroll		= mediaScroll;    	
    }
};

/*************/
window.ITE = window.ITE || {};

ITE.TimeManager = function(){

	this.isRunning = false; //stopwatch value indicating the time of the tour
	this.startingOffset = 0; //the starting offset
	this.elapsedOffset = 0; //how much time has elapsed

	//getIsRunning
	this.getIsRunning = function(){
		return this.isRunning;
	};

	//getElapsedOffset
	this.getElapsedOffset = function(){
		var offset = (Date.now()/1000 - this.startingOffset) + this.elapsedOffset;
		if (this.isRunning){
			return offset;
		}else {
			return this.elapsedOffset;
		}
	};

	this.addElapsedTime = function(offset) {
		this.elapsedOffset += offset;
	}

		//start the timer
	this.startTimer= function(){
		this.startingOffset = Date.now() / 1000; //get startingOffset in seconds
		this.isRunning = true;
	};

	//pause the timer
	this.stopTimer = function(){
		if (this.isRunning){
			this.elapsedOffset = this.getElapsedOffset();
		}
		this.isRunning = false;
	};
};

/*************/
window.ITE = window.ITE || {};
//creates a wrapper around a keyframe to indicate a task that needs to be scheduled
ITE.Task = function(timerOffset, nextKeyframeTime, nextKeyframeData, asset, ongoingTasks, track) {

	var self 				= this;
	self.timerOffset 		= timerOffset;
	self.nextKeyframeTime 	= nextKeyframeTime;
	self.nextKeyframeData 	= nextKeyframeData;
	self.asset 				= asset;
	self.ongoingTasks 		= ongoingTasks;
	self.track 				= track

	self.nextKeyframeData.ease = Linear.easeNone;

	// self.nextKeyframeData.onComplete = function(){
	// 	self.ongoingTasks.splice(self.ongoingTasks.indexOf(self), 1);
	// }
	self.animation;

	this.play = function(){
		(track.trackData.providerId === 'image') && asset.stop();
		self.track.play(self.nextKeyframeTime, self.nextKeyframeData);
	};

	this.pause = function() {
		self.track.pause()
		//self.track.animation.kill()
	};

};

//object that is responsible for scheduling different tasks ie. tracks
ITE.TaskManager = function() {
	
	var self = this;
	//list of scheduled tasks to loop through;
	self.scheduledTasks = []; 

	//allow for the scheduling of items within a 0.2sec interval of the timer
	this.timerPrecision = 0.2; 

	//tracks which index in the scheduledTasks list the scheduler is currently at
	this.currentTaskIndex = 0;

	//timer of entire tour
	this.timeManager = new ITE.TimeManager();

	//to keep track of the setInterval of the next scheduled item
	this.timerId = -1;

	this.ongoingTasks = [];
	this.status = "starting";

	//getElaspedTime
	this.getElapsedTime = function(){
		return this.timeManager.getElapsedOffset();
	};	

	//load tasks to be scheduled
	this.loadTask = function(timerOffset, nextKeyframeTime, nextKeyframeData, asset, track) {
		var newTask = new ITE.Task(timerOffset, nextKeyframeTime, nextKeyframeData, asset, this.ongoingTasks, track);
		this.scheduledTasks.push(newTask);
	};

	//start the scheduler on current tasks
	this.play = function() {
		if (self.status === "paused"){

			self.status = "playing";

			this.scheduleNextTasks();
			for (var i=0; i<this.ongoingTasks.length; i++){
				this.ongoingTasks[i].play(true);
			}
			this.timeManager.startTimer();
		} else {
			this.triggerCurrentTasks();
			this.scheduleNextTasks();
			this.timeManager.startTimer();
		}
	};

	//pause the scheduler
	this.pause = function() {
		this.timeManager.stopTimer();
		self.status = "paused"
		clearTimeout(this.timerId);
		this.timerId = -1;
		for (var i=0; i<this.ongoingTasks.length; i++){
			this.ongoingTasks[i].pause();
		}
	};

//seek to the correct point in the scheduler
	this.seek = function(seekedOffset) {
		this.pause();
		this.timeManager.addElapsedTime(seekedOffset);
		this.currentTaskIndex = this.getIndexAt(offset);
		this.triggerCurrentTasks();
		this.scheduleNextTasks();
	};

	this.triggerCurrentTasks = function() {
		this.status = "playing";
		var index 	= this.currentTaskIndex,
			i 		= 0,
			task;

		//interval in which to check for tasks to start
		var curTime = this.getElapsedTime();
		var scheduleInterval = curTime + this.timerPrecision;

		while (index < this.scheduledTasks.length && this.scheduledTasks[index].timerOffset <= scheduleInterval) {
			task = this.scheduledTasks[index]
			this.ongoingTasks.push(task);
			task.play();
			task.track.currentAnimationTask && self.ongoingTasks.splice(self.ongoingTasks.indexOf(task.track.currentAnimationTask), 1);
			task.track.currentAnimationTask = task;
			index++;
		}
		//reset the current task index so that we can schedule subsequent tasks
		this.currentTaskIndex = (index < this.scheduledTasks.length) ? index : -1;
		
	}

	this.scheduleNextTasks = function() {
		if (this.currentTaskIndex < 0){
			clearInterval(this.timerId);
			return; //there are no more tasks to be started/scheduled
		}

		var nextTask = this.scheduledTasks[this.currentTaskIndex];
		//get the interval to wait until the next task is to be started
		var waitInterval = Math.max((nextTask.timerOffset - this.getElapsedTime()), 0);
		clearTimeout(this.timerId);
		this.timerId = setTimeout(function () {self.nextTick();}, waitInterval * 1000);
	};

	this.nextTick = function() {
		this.triggerCurrentTasks();
		this.scheduleNextTasks();
	}

};
/*************/
window.ITE = window.ITE || {};

ITE.Orchestrator = function(player) {
	status = 3;		// Current status of Orchestrator (played (1), paused (2), loading (3), buffering(4))
									// Defaulted to ‘loading’
	var	self = this;
	self.narrativeSeekedEvent 	= new ITE.PubSubStruct();
	self.narrativeLoadedEvent 	= new ITE.PubSubStruct();
	self.volumeChangedEvent		= new ITE.PubSubStruct();
	self.stateChangeEvent 		= new ITE.PubSubStruct();
	self.muteChangedEvent		= new ITE.PubSubStruct();

	self.player 			= player;
	trackManager 			= [];	//******* TODO: DETERMINE WHAT EXACTLY THIS IS GOING TO BE************
	self.taskManager 		= new ITE.TaskManager();

   /**
    * I/P: {URL}     	dataURL    Location of JSON data about keyframes/tracks
    * Loads and parses JSON data using AJAX, then figures out which assetProvider to use to actually load the asset.
    * Once the asset is loaded, the initializeTracks() is called, and when tracks are ready, the tour is played. 
    * O/P: none
    */
	this.load = function(dataURL){
		var tourData,
			AJAXreq = new XMLHttpRequest(),
			i;

	   	AJAXreq.open( "GET", dataURL, true );
	    AJAXreq.setRequestHeader("Content-type", "application/json");
	    AJAXreq.onreadystatechange = function(){
	        if( AJAXreq.readyState == 4 && AJAXreq.status == 200 ){
	        	//Once request is ready, parse data and call function that actually loads tracks
	       		tourData = JSON.parse(AJAXreq.responseText);
	       		loadHelper();
	        }
	    }
	    AJAXreq.send();


	  /**
	    * I/P: none
	  	* Helper function to load tour with AJAX (called below)
	  	* Calls CreatTrackByProvider, initializes the tracks, load their actual sources, and if they're ready, plays them
	    * O/P: none
	    */
		function loadHelper(){
			//Creates tracks
			for (i = 0; i < tourData.tracks.length; i++){
				var track = tourData.tracks[i]

				createTrackByProvider(track)
			};

			//...Initializes them
			initializeTracks();

			//...Loads them
	    	for (i = 0; i < trackManager.length; i++){
	    		trackManager[i].load()
	    	}

	    	//...And plays them
	    	if (areAllTracksReady()){
				play();
			}
		}



	   /**
	    * I/P: {object}	trackData	object with parsed JSON data about the track
	  	* Creates track based on providerID
	    * O/P: none
	    */
		function createTrackByProvider(trackData){
			switch (trackData.providerId){
				case "image" : 
					self.trackManager.push(new ITE.ImageProvider(trackData, self.player, self.taskManager, self));
					break;
				case "video" : 
					self.trackManager.push(new ITE.VideoProvider(trackData, self.player, self.taskManager, self));
					break;
				case "audio" : 
					self.trackManager.push(new ITE.AudioProvider(trackData, self.player, self.taskManager, self));
					break;
				case "deepZoom" : 
					trackManager.push(new ITE.DeepZoomProvider(trackData, self.player, self.taskManager, self));
					break;
				case "ink" : 
					self.trackManager.push(new ITE.InkProvider(trackData));
					break;
				default:
					throw new Error("Unexpected providerID; '" + trackData.providerID + "' is not a valid providerID");
			}
		}
	};

	function unload(track){
		trackManager.remove(track)
	}


	function play(){
		var i;
		for (i=0; i<self.trackManager.length; i++) {
			if (self.trackManager[i].state === "loading"){
				setTimeout(self.play, 1000);
				return;
			}
		}
		self.taskManager.scheduledTasks.sort(function(a, b){return a.timerOffset-b.timerOffset});
		self.taskManager.play();
		this.status = 1;
	}

	function pause(){
		self.taskManager.pause();
		this.status = 2;
	}

	function seek(seekTime){
	}

	function setVolume(newVolumeLevel){
	    self.volumeChangedEvent.publish(newVolumeLevel);
	}

	function toggleMute(isMuted){
		self.muteChangedEvent.publish(isMuted)
	}
 
	function captureKeyframe(trackID) {
		var keyFrameData = trackManager(trackID).getState()
		trackManager(trackID).createNewKeyFrame(keyFrameData)
	}

	function areAllTracksReady() {
		var ready = true,
			i;
		for (i = 0; i < trackManager.length; i++){
			var track = trackManager[i]
			if (track.state !== 2) {  //(2 = paused)
				ready = false
			}
		}
	}

	function initializeTracks(){
		var i;
		for (i = 0; i < trackManager.length; i++){
			var track = trackManager[i];
			// Subscribe video and audios to volume changes
			if (track.trackData.providerId === "video" || track.trackData.providerId === "audio") {
				self.volumeChangedEvent.subscribe(track.setVolume, track.trackData.assetUrl, track);
				self.muteChangedEvent.subscribe(track.toggleMute, track.trackData.assetUrl, track);
			}
			// Subscribes everything to other orchestrator events
			self.narrativeSeekedEvent.subscribe(track.seek, null, track)
			self.narrativeLoadedEvent.subscribe(track.load, null, track)
		}
	}
	this.trackManager = trackManager;
	this.unload = unload;
	this.play = play;
	this.pause = pause;
	this.seek = seek;
	this.setVolume = setVolume;
	this.toggleMute = toggleMute;
	this.captureKeyframe = captureKeyframe;
	this.areAllTracksReady = areAllTracksReady;
	this.initializeTracks = initializeTracks;
	this.status = status;
}



/*************/
window.ITE = window.ITE || {};

ITE.Player = function (options) { //acts as ITE object that contains the orchestrator, etc
   var  orchestrator            = new ITE.Orchestrator(this),
        self = this,
        playerConfiguration = {
                attachVolume:               true,
                attachLoop:                 true,
                attachPlay:                 true,
                attachProgressBar:          true,
                attachFullScreen:           true,
                attachProgressIndicator:    true,
                hideControls:               false,
                autoPlay:                   false,
                autoLoop:                   false,
                setMute:                    false,
                setInitVolume:              1,
                allowSeek:                  true,
                setFullScreen:              false,
                setStartingOffset:          0,
                setEndTime:                 NaN //defaults to end of tour if NaN
        },    //dictionary of player configuration options; defaults being set

    //DOM related
        ITEHolder = $(document.createElement("div"))
            .attr("id", "ITEHolder"),
        bottomContainer = $(document.createElement("div"))
            .attr("id", "bottomContainer"),
        buttonContainer = $(document.createElement("div"))
            .attr("id", "buttonContainer");

    ITEHolder.append(bottomContainer);
    bottomContainer.append(buttonContainer);

    //Buttons
    var volumeButton        = $(document.createElement("img")),
        volumeLevel         = $(document.createElement("img")),
        playPauseButton     = $(document.createElement("img")),
        loopButton          = $(document.createElement("img")),
        progressBar         = $(document.createElement("div")),
        fullScreenButton    = $(document.createElement("img")),
        progressIndicator   = $(document.createElement("div")),

    //Other atributes
        timeOffset,
        isMuted,
        isLooped,
        isFullScreen,

    //Other miscellaneous variables
        Utils = new ITE.Utils();
    this.Orchestrator = orchestrator;

    var onLoadPlayerEvent = new ITE.PubSubStruct();
    this.onTourEndEvent = new ITE.PubSubStruct();


    this.playerParent = $(document.body);

    //Start things up
    createITEPlayer(this.playerParent, options)
   /**
    * I/P: {html}     playerParent    to attach ITE player to; defaults to document if nothing is specified
    *      {object}   options         dictionary including what kinds of control the player should have      
    * O/P: {object}   ITEPlayer       a new ITE player object 
    */
    function createITEPlayer(playerParent, options) {
        this.playerConfiguration    = Utils.sanitizeConfiguration(playerConfiguration, options); //replace ones that are listed
        this.playerConfiguration    = playerConfiguration; 
        this.playerParent           = playerParent;
        self.currentVolumeLevel     = playerConfiguration.setInitVolume; // Value between 0 and 1
        self.previousVolumeLevel    = self.currentVolumeLevel;

        //Attaches all necessary UI details of the player including controls to the parentEle

        this.playerParent.append(ITEHolder);

        if (!options.hideControls){
            attachVolume();
            attachPlay();
            attachLoop();
            attachProgressBar();
            attachFullScreen();
            attachProgressIndicator();
        };

        //onLoadPlayerEvent.publish(tourObj);
        //set initial tour properties: volume, startTime, endTime, loop, play, hideControls
        // Must be able to dynamically resize and position buttons based on screen size, TAG frame size, and number of buttons
    };
    /*
    * I/P:   none
    * Attach volume button container and volume button
    * O/P:   none
    */
    function attachVolume() {
        if (playerConfiguration.attachVolume) {
            var volumeContainer = $(document.createElement("div"))
                .addClass("volumeContainer");

            var volumeButtonContainer = $(document.createElement("div"))
                .addClass("volumeButtonContainer");

            volumeButton.addClass("volumeButton")
            .attr("src", "ITEPlayerImages/volume.svg")
            .on("click", toggleMute);

            var volumeLevelContainer = $(document.createElement("div"))
                .addClass("volumeLevelContainer")
                .on({
                    "click": function(e){
                        var height = Math.abs(e.pageY - volumeLevel.parent().offset().top - volumeLevel.parent().height())/100;
                        setVolume(height);
                    },
                    "mousedown": function(e){
                        volumeLevelContainer.dragging = true;
                    },
                    "mouseup": function(e){
                        volumeLevelContainer.dragging = false;
                    },
                    "mouseleave" : function(e){
                        volumeLevelContainer.dragging = false;
                    },
                    "mousemove": function(e){
                        volumeLevelContainer.dragging ? setVolume(e) : null
                    }
                });

                volumeLevel = $(document.createElement("div"))
                    .addClass("volumeLevel");
            buttonContainer.append(volumeContainer);
            volumeContainer.append(volumeButtonContainer)
                           .append(volumeLevelContainer);
            volumeButtonContainer.append(volumeButton);
            volumeLevelContainer.append(volumeLevel);
        }
        playerConfiguration.setMute ? mute(): unMute()
    };

    /*
    * I/P:   none
    * Attaches play/pause buttons
    * O/P:   none
    */
    function attachPlay() {
        if (playerConfiguration.attachPlay) {

            var playPauseButtonContainer = $(document.createElement("div"))
                .addClass("playPauseButtonContainer");

                playPauseButton.addClass("playPauseButton")
                .attr("src", "ITEPlayerImages/pause.svg")
                .on("click", togglePlayPause);

            buttonContainer.append(playPauseButtonContainer);
            playPauseButtonContainer.append(playPauseButton);
        }

        playerConfiguration.autoPlay ? play() : pause()
    };

    /*
    * I/P:   none
    * Attaches loop
    * O/P:   none
    */
    function attachLoop() {
        if (playerConfiguration.attachLoop) {

            var loopButtonContainer = $(document.createElement("div"))
                .addClass("loopButtonContainer");

                loopButton.addClass("loopButton")
                .attr("src", "ITEPlayerImages/loop.svg")
                .on("click", toggleLoop);

            buttonContainer.append(loopButtonContainer);
            loopButtonContainer.append(loopButton);
        }

        playerConfiguration.autoLoop ? loop() : unLoop()
    };

    /*
    * I/P:   none
    * Attaches progress bar
    * O/P:   none
    */
    function attachProgressBar() {
        if (playerConfiguration.attachProgressBar) {

            var progressBarContainer = $(document.createElement("div"))
                .addClass("progressBarContainer")
                .on({
                    "click": function(e){
                        seek(e);
                    },
                    "mousedown": function(e){
                        progressBarContainer.dragging = true;
                    },
                    "mouseup": function(e){
                        progressBarContainer.dragging = false;
                    },
                    "mouseleave" : function(e){
                        progressBarContainer.dragging = false;
                    },            
                    "mousemove": function(e){
                        progressBarContainer.dragging ? seek(e) : null
                    }
                });

            progressBar.addClass("progressBar")

            bottomContainer.append(progressBarContainer);
            progressBarContainer.append(progressBar);
        }
    };

    /*
    * I/P:   none
    * Attaches progress indicator
    * O/P:   none
    */
    function attachProgressIndicator() {
        if (playerConfiguration.attachProgressIndicator) {

            var ProgressIndicatorContainer = $(document.createElement("div"))
                .addClass("progressIndicatorContainer");

            progressIndicator.addClass("progressIndicator")
            .innerHTML = "01:04";

            buttonContainer.append(ProgressIndicatorContainer);
            ProgressIndicatorContainer.append(progressIndicator);
        }
    };

    /*
    * I/P:   none
    * Attaches full screen
    * O/P:   none
    */
    function attachFullScreen() {
        if (playerConfiguration.attachFullScreen) {

            var fullScreenButtonContainer = $(document.createElement("div"))
                .addClass("fullScreenButtonContainer");

            fullScreenButton.addClass("fullScreenButton")
            .attr("src", "ITEPlayerImages/fullScreen.svg")
            .on("click", toggleFullScreen);

            buttonContainer.append(fullScreenButtonContainer);
            fullScreenButtonContainer.append(fullScreenButton);
        }

        //If player configuration's default is to full screen, set full screen
        playerConfiguration.setFullScreen ? enableFullScreen() : disableFullScreen()
    };

//Public functions used to interface with TAG Authoring and Kiosk

    function load(tourData) {
        orchestrator.load(tourData);
    };

    function unload() {
    //    orchestrator.unload();
    };
	
    /*
    * I/P:   trackID		track from which to capture a keyframe
    * Captures and returns a keyframe
    * Used in Authoring
    * O/P:   none
    */ 
    function captureKeyframe(trackID) {
        return this.orchestrator.captureKeyframe(trackID);
    };


/*
* PLAYER CONTROLS
* For manipulation of player controls with which user interacts
*/

// PLAY & PAUSE & SEEK

    /*
    * I/P:   none
    * Toggles between play and pause
    * O/P:   none
    */
    function togglePlayPause() {
        (orchestrator.status !== 2) ? pause() : play()
    };

    /*
    * I/P:   none
    * Starts tour from the beginning or from a resumed spot
    * O/P:   none
    */
    function play() {
        orchestrator.play();
        // console.log("Tour is playing")
        playPauseButton.attr("src", "ITEPlayerImages/pause.svg")
    };


    /*
    * I/P:   none
    * Pauses tour
    * O/P:   none
    */
    function pause() {
        orchestrator.pause();
        // console.log("Tour is paused")
        playPauseButton.attr("src", "ITEPlayerImages/play.svg")
    };

    /*
    * I/P:   none
    * Seeks tour to a specfied spot
    * O/P:   none
    */
    function seek(e) {
        if (playerConfiguration.allowSeek){
            // console.log("Tour was seeked")
            progressBar.css({
                width : e.pageX - ITEHolder.offset().left
            })
            timeOffset = progressBar.width()/(progressBar.parent().width()) //timeOffset is currently a percentage of the total time
       //     orchestrator.seek(timeOffset);
        }
    };


//VOLUME & MUTE

    /*
    * I/P:   volumeLevel	updated volume level
    * O/P:   none
    */ 
    function setVolume(newVolume) {
        newVolume > 1 ? newVolume = 1 : null
        if (isMuted){
            unMute();
        }
        volumeLevel.css({
            height : newVolume * 100 + "%"
        });
        volumeButton.attr("src", "ITEPlayerImages/volume.svg");
        self.previousVolumeLevel = self.currentVolumeLevel   // Reference to previous volume level for volume control in video/audio tracks
        self.currentVolumeLevel = newVolume;
        orchestrator.setVolume(self.currentVolumeLevel);

        // console.log("volume set to " + currentVolumeLevel +  "%")
    };

    /*
    * I/P:   none
    * Toggles mute
    * O/P:   none
    */ 
    function toggleMute() {
        isMuted ? unMute()   : mute()
    };

    /*
    * I/P:   none
    * Sets mute to be true and changes UI accordingly
    * O/P:   none
    */ 
    function mute(){
        isMuted = true;
        volumeButton.attr("src", "ITEPlayerImages/volume0.svg")
        volumeButton.css("opacity" , ".5")
        volumeLevel.css("opacity" , "0")
        orchestrator.toggleMute(true);
    }

    /*
    * I/P:   none
    * Sets mute to be true and changes UI accordingly
    * O/P:   none
    */ 
    function unMute(){
        isMuted = false;
        volumeButton.attr("src", "ITEPlayerImages/volume.svg");
        volumeButton.css("opacity" , "1");
        volumeLevel.css("opacity" , "1")
        orchestrator.toggleMute(false);
    }

//FULL SCREEN
   /**
    * I/P:  none
    * Toggles full screen
    * O/P:  none
    */ 
    function toggleFullScreen() {
        isFullScreen ? disableFullScreen() : enableFullScreen()
    };

   /**
    * I/P:    none
    * Sets fullscreen and changes UI accordingly
    * O/P:    none
    */ 
    function enableFullScreen() {
        isFullScreen = true;
        // console.log("tour is fullscreen")
        fullScreenButton.css("opacity" , "1")
    };

   /**
    * I/P:    none
    * Removes fullscreen and changes UI accordingly
    * O/P:    none
    */ 
    function disableFullScreen() {
        isFullScreen = false;
        // console.log("tour is not fullscreen")
        fullScreenButton.css("opacity" , ".5")
    };


// LOOP
   /**
    * I/P:	none
    * Toggles whether or not the play is in loop
    * O/P:	none
    */ 
    function toggleLoop() {
        isLooped ? unLoop() : loop()
    };

   /**
    * I/P:    none
    * Sets tour to loop and changes UI accordingly
    * O/P:    none
    */ 
    function loop() {
        isLooped = true;
        // console.log("tour is looped")
        loopButton.css("opacity" , "1")
    };

   /**
    * I/P:    none
    * Sets tour to not be in loop and changes UI accordingly
    * O/P:    none
    */ 
    function unLoop() {
        isLooped = false;
        // console.log("tour is not looped")
        loopButton.css("opacity" , ".5")
    };


    this.togglePlayPause    = togglePlayPause;
    this.play               = play;
    this.pause              = pause;
    this.seek               = seek;
    this.load               = load;
    this.unload             = unload;
    this.captureKeyFrame    = captureKeyframe;
    this.setVolume          = setVolume;
    this.toggleMute         = toggleMute;
    this.toggleLoop         = toggleLoop;
    this.toggleFullScreen   = toggleFullScreen;
    this.timeOffset         = timeOffset;
    this.isMuted            = isMuted;
    this.isLooped           = isLooped;
    this.isFullScreen       = isFullScreen;
};
/*************/
// I/P: ESData 	parsed data associated with the track

window.ITE = window.ITE || {};

ITE.ProviderInterfacePrototype = function(trackData, player, taskManager, orchestrator){ 
	this.currentStatus			= 3;		// Current status of Orchestrator (played (1), paused (2), loading (3), buffering(4))
									// Defaulted to ‘loading’

	this.savedState				= null; 	// Current state of track (last-saved state)
	this.duration				= 0;	// Duration of track
	this.keyframes				= []; 	// Data structure to keep track of all displays/keyframes

	this.interactionHandlers 	= null;	// object with a set of handlers for common tour interactions such as mousedown/tap, mousewheel/pinch zoom, etc. so that a generic function within the orchestrator can bind and unbind handlers to the media element

	this.TrackInteractionEvent	= null; // Raised when track is interacted with.  This is for the inks to subscribe to.

	self.player 				= player;
	self.taskManager 			= taskManager;
	self.trackData 				= trackData;
	self.orchestrator			= orchestrator;

	//Only parses displays here; function filled out in specific providerInterface classes
	this.initialize = function(){
		this.parseDisplays(trackData);
	}

	/*
	I/P: none
		Public function
	O/P: none
	*/
	this.load = function(){
	}

	/*
	I/P: none
		Only parses displays here; function filled out in specific providerInterface classes
		Public function
	O/P: none
	*/
	this.unLoadAsset = function(){
		Orchestrator.removeTrack(this);
	}

	/*
	I/P: none
		Parses track data of keyframes into the correct displays
	O/P: none
	*/
	this.parseDisplays = function (trackData) {
		//Leaving this for now as we don’t yet know what data structure we want to use
	};

	/* 
	I/P: {time, ms}	duration duration of animation
		Starts or resumes tour
		Called when tour is played
		Starts animation, if needed
	O/P: none
	*/
	this.play = function(targetTime, data){
	// Resets state to be where it was when track was paused, then clears the saved state
		if(this.savedState) {
			this.setState(this.savedState);
			this.animate(targetTime - this.savedState.time, data);
			this.savedState = null;	
		} else {
			//Animates to the next keyframe
			this.animate(Math.abs(targetTime - this.taskManager.timeManager.getElapsedOffset()), data);
		}
	// // Set current status to “played”
	// 	this.setCurrentStatus(1);
	};

	this.animate = function(){
	}
	
	/* 
	I/P: none
		Seeks animation from a given offset state
	O/P: none
	*/
	this.seek = function(seekTime){
		// // Stops/cancels animation, if there is one
		// currentAnimation && currentAnimation.stop();

		// // Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		// var seekState = animationProvider.interpolate(seekTime, previousKeyFrame(), nextKeyFrame()) //NOTE: this interpolates between the two keyframes to return the state at the given time. I’m not sure exactly what the syntax will be for this, but I know it’s possible in most of the animation libraries we’ve looked at.
		// 	this.setState(state)
		// 	this.play()
	};

	/* 
	I/P: none
		returns current status
	O/P: {status} current status
	*/
	this.getStatus = function(){
		return this.currentStatus
	};

	/* 
	I/P: status	status (from Orchestrator) to set current status of track
		Sets currentStatus to be inputed status
		Public function
	O/P: none
	*/
	this.setStatus = function(status){
		this.currentStatus = status
	};

	/* 
	I/P: none
		will grab data about the current state of the track
		Does nothing for now; function filled out in specific providerInterface classes
	O/P: {state} state
	*/
	this.getState = function(){
	};

	/* 
	I/P: state	state to set current state of track
		Will set state of track to match inputted state
		Does nothing for now; function filled out in specific providerInterface classes
	O/P: none
	*/
	this.setState = function(state, callback){
	};

	/* 
	I/P: none
		Does nothing for now; function filled out in specific providerInterface classes
	O/P: interactionHandlers 	array of interaction handlers to be passed to Orchestrator
	*/
	this.getInteractionHandlers = function(){
		return interactionHandlers;
	};

	/*
    I/P: {state} state to be animated to
	O/P: nothing
	*/
	this.animateMedia = function(state){
         var container = document.createElement("div");
         container.appendChild(media);
         TweenLite.to(container, "duration", state);
	};


	/*
	I/P: time	either passed-in time or current time
	determines the next keyframe to be displayed
	O/P: nextKeyframe: next keyframe to be displayed
	*/
	this.getNextKeyframe = function(time){
		var 	time		= time || timeManager.getElapsedSeconds()
				keyFrame 	= keyframes[0];
	// Loops through keyframes and returns the first that has a time AFTER our inputted time
	// DEPENDS ON DATASTRUCTURE FOR KEYFRAMES/DISPLAYS
		while (keyFrame.time <= time){
			keyFrame = keyFrames.next(keyFrame)
		};
		return keyFrames.next(keyFrame);
	};

	/*
	I/P: time	either passed-in time or current time
	determines the previous keyframe from time offset
	O/P: previousKeyframe: previous keyframe 
	*/
	this.getPreviousKeyframe = function(time){
		var time 		= time || self.taskManager.timeManager.getElapsedSeconds()
			keyFrame 	= keyframes[0];
	// Loops through keyframes and returns the last that has a time BEFORE our inputted time
	// DEPENDS ON DATASTRUCTURE FOR KEYFRAMES/DISPLAYS
		while (keyFrame.time <= time){
			keyFrame = keyFrames.next(keyFrame)
		};
		return keyFrame;
	};
}

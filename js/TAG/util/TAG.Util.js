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
        multiLineEllipsis: multiLineEllipsis,
        encodeText: encodeText,
        disableDrag: disableDrag,
        getFontSize: getFontSize,
        parseDateToYear : parseDateToYear,
        showLoading: showLoading,
        hideLoading: hideLoading,
        removeProgressCircle: removeProgressCircle,
        showProgressCircle: showProgressCircle,
        createQueue: createQueue,
        createDoubleEndedPQ: createDoubleEndedPQ,
        replaceSVGImg: replaceSVGImg,
        getMaxFontSizeEM: getMaxFontSizeEM,
        getMaxFontSize: getMaxFontSize,
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
        checkVideoConverted4Track: checkVideoConverted4Track,
        createConversionLoading: createConversionLoading,
        videoErrorHandler: videoErrorHandler,
        getHtmlAjax: getHtmlAjax,
        localVisibility: localVisibility,
        dimColor: dimColor,
        hexToRGBA: hexToRGBA,
        IdCreator: IdCreator,
        makeBorderRadius: makeBorderRadius,
        createTutorialPopup: createTutorialPopup,
        removeYoutubeVideo: removeYoutubeVideo
    };

    function removeYoutubeVideo(){
        var iframeEle = document.getElementsByTagName("iframe");
        if (iframeEle[0]) {
            iframeEle[0].src = "";
        }
    }

    function makeBorderRadius(ele, radius) {
        ele.css('border-radius', radius);
    }
    function IdCreator(){
        var Id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
        return Id;
    }

    function multiLineEllipsis(textHolder) {
        var text = textHolder.html();
        var t = $(textHolder.clone(true))
            .hide()
            .css('position', 'absolute')
            .css('overflow', 'visible')
            .width(textHolder.width())
            .height('auto');

        function height() {
            var bool = t.height() > textHolder.height();
            return bool;
        };
        
        if(textHolder.css("overflow") == "hidden")
        {
            textHolder.parent().append(t);
            var func = height;

            while (text.length > 0 && func())
            {
                text = text.substr(0, text.length - 1);
                t.html(text + "...");
            }

            textHolder.html(t.html());
            t.remove();
        }
    }
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
            },
            isEmpty: function () {
                return (this._queue.length === 0);
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
                replace(/<(.|\n)*?>/g, '').
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

    /* Get an integer year from date metadata
     * @method parseDateToYear
     * @param {Object} date       object containing year, month, and day 
     * @return {Number} year      year (can have decimals to represent month, days)
     */
    function parseDateToYear(date){
        var yearString,
            neg = false,
            cent,
            year,
            month,
            monthDict,
            day,
            metadataDate,
            startDate,
            millisecondDifference,
            millisecondsPerDay = 1000 * 3600 * 24,
            dayInYear,
            totalDaysInYear,
            dayDecimal;

        if (date && date.year){
            yearString = date.year;
            //Catches 'ad', 'bc', 'bce' case, spacing, and order insensitive
            if (yearString.search(/bce?/i)>=0){
                neg = true;
                yearString = yearString.replace(/bce?/gi,'');
            }
            yearString = yearString.replace(/ad/gi,'')
                                   .replace(/ce(?!n)/gi,'')
                                   .replace(/\s/g, '')
                                   .replace(/,/g,'');
            //Catch 'century', 'c', and 'c.' and return mid year of that century (17th c --> 1650)
            if (yearString.search(/c.?/i)>=0 || yearString.search(/century/i)>=0){
                yearString.replace(/[a-z]\w/gi,'')
                          .replace(/c.?/gi, '')
                cent = parseInt(yearString) - 1 ;
                yearString = cent.toString() + '50';
            }

            year = parseInt(yearString);
            if (date.month){
                month = date.month;
                monthDict = {
                    "January": 1,
                    "February:": 2,
                    "March": 3,
                    "April": 4,
                    "May": 5,
                    "June": 6,
                    "July": 7,
                    "August": 8,
                    "September": 9,
                    "October": 10,
                    "November":11,
                    "December": 12
                }
                if (date.day){
                    day = date.day;
                } else {
                    day = 1;
                }
                metadataDate = new Date(year, monthDict[month],day);
                startDate = new Date(year,0,0);
                millisecondDifference = metadataDate - startDate;
                dayInYear = Math.round(millisecondDifference/millisecondsPerDay);
                //check for leap year
                (new Date(year,2,0).getDate() === 29) ? totalDaysInYear = 366 : totalDaysInYear = 365;
                dayDecimal = dayInYear/totalDaysInYear;
                year = year + dayDecimal;
            }
            if (neg){
                year = -year;  
            }
            return year;
        }
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
        if (colorString && colorString.indexOf("rgb")!== -1){
            var colorOnly = colorString.substring(colorString.indexOf("(") + 1, colorString.lastIndexOf(")")).split(/, \s*/);
            var bgColor = "rgba(" + colorOnly[0] + "," + colorOnly[1] + "," + colorOnly[2]  + "," + "0.5)";
            divToAppend.css({
                'background-color': bgColor
            });
        }

        var circle = showProgressCircle($(divToAppend), progressCircCSS, centerhor, centerver, false);
    }

    // hide specified div
    function hideLoading(divToHide) {
        var colorString = $(divToHide).css("background-color");
        if (colorString && colorString.indexOf("rgb") !== -1) {
            var colorOnly = colorString.substring(colorString.indexOf("(") + 1, colorString.lastIndexOf(")")).split(/, \s*/);
            var bgColor = "rgba(" + colorOnly[0] + "," + colorOnly[1] + "," + colorOnly[2] + "," + "1)";
            divToHide.css({ 'background-color': bgColor });
        }

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
        currSize -= step;
        return currSize + 'em';
    }

    /**
     *  get max font size without em
     * @method getMaxFontSize
     * @param {String} text       TODO FINISH DOCUMENTATION
     */
    function getMaxFontSize(text, minFontSize, maxWidth, maxHeight, step) {
        var testDiv = $(document.createElement('div'));
        step = step || 0.1;
        var currSize = minFontSize;

        testDiv.css({
            'position': 'absolute',
            'visibility': 'hidden',
            'height': 'auto',
            'width': 'auto',
            'font-size': minFontSize + 'em',
        });
        testDiv.text(text);
        $('body').append(testDiv);

        if (testDiv.width() >= maxWidth || testDiv.height() >= maxHeight) {
            return minFontSize;
        }

        while (testDiv.width() < maxWidth && testDiv.height() < maxHeight) {
            currSize += step;
            testDiv.css('font-size', currSize + 'em');
        }
        testDiv.remove();
        return currSize;
    }
	
	/*
		Gets the maximum font size without em.
	*/
	function getMaxFontSize(text, minFontSize, maxWidth, maxHeight, step) {
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

    //Shouldn't be public anymore, this is primarily used by makeManipulatable
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

        if(!url) {
            return;
        }

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
            doubletap_interval: 400,
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
                clearTimeout(timer);
                timer = setTimeout(function () {
                    var dir = getDir(evt);
                    if (evt.gesture.pointerType !== "mouse" && !noAccel)
                        accel(30 * dir.vx, 30 * dir.vy, null, currentAccelId);
                }, 5);
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
            //manipulationHandler(evt);
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
            //timer = window.requestAnimationFrame(accel(vx * .95, vy * .95, delay, id), $element);
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
                firstEvtX.currentDir = firstEvtX.gesture.deltaX / Math.abs(firstEvtX.gesture.deltaX) || 0;
                if (!prevEvt) {
                    prevEvt = evt;
                    return { vx: 0, vy: 0 };
                }
            } else {
                if (evt.gesture.deltaX > prevEvt.gesture.deltaX && firstEvtX.currentDir !== 1) {
                    firstEvtX = evt;
                    firstEvtX.currentDir = 1;
                } else if (evt.gesture.deltaX < prevEvt.gesture.deltaX && firstEvtX.currentDir !== -1) {
                    firstEvtX = evt;
                    firstEvtX.currentDir = -1;
                }
            }
            if (!firstEvtY) {
                firstEvtY = evt;
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
            element.addEventListener("MSPointerEvent", function (evt) {
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
                //evt.target.autoProcessInertia = false;
                if (typeof functions.onManipulate === "function") {
                    if (evt.gesture) {
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
                    } else {
                        functions.onManipulate({
                            pivot: pivot,
                            translation: translation,
                            rotation: rotation,
                            scale: scale,
                            grEvent: evt
                        });
                    }
                }
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
            rightTapHandlerWin = function (evt) {
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
        /*try {
            return str ? $('<div />').text(encodeURIComponent(str).html()) : '';
        } catch (e){
            //use our deprecated function for now if error thrown
            return encodeXML(str);
        }*/
        
        encodeText(str || "");
        return str || "";
    }

    function htmlEntityDecode(str) {
        /*try {
            return str ? decodeURIComponent($('<div />').html(str).text()) : '';
        } catch (e) {
            return str ? unescape($('<div />').html(str).text()) : '';
        }*/
        return str || "";
    }

    /**
    function to check if the videos have been converted.
    Also, show the display in the track after conversion is done
    @param: an array of video tracks to convert.
    */
    function checkVideoConverted4Track(videos2Convert) {
        if (videos2Convert.length > 0) {
            for (var i = 0; i < videos2Convert.length; i++) {
                var track = videos2Convert[i];
                var media = track.getMedia();
                var videotag = $(document.createElement('video'));
                videotag.attr('preload', 'metadata');
                var filename = media.slice(8, media.length);//get rid of /Images/ before the filename
                TAG.Worktop.Database.getConvertedCheck(
                    (function (i, track, media, videotag) {
                        return function (output) {
                            if (output !== "False") {
                                console.log("converted/ or not being written now");
                                var mp4filepath = "/Images/" + output.substr(0, output.lastIndexOf('.')) + ".mp4";
                                var mp4file = TAG.Worktop.Database.fixPath(mp4filepath);
                                videotag.attr('src', mp4file);
                                videotag.on('loadedmetadata', function () {
                                    //remove from the video array and add display with the right duration
                                    track.changeTrackColor('white');
                                    track.videoConverted(true);
                                    track.addDisplay(0, this.duration);
                                    videos2Convert.remove(track);
                                });

                            } else {
                                console.log("not converted: ");
                            }
                        }
                    })(i, track, media, videotag), null, filename);
            }
        }
    }

    /*create video conversion loading message and circle for 
	  when imported videos are converting
	  O/P: the div containing the loading circle and message*/
    function createConversionLoading(msg, nocircle, isMp4) {
        var container = $(document.createElement('div'));
        container.attr('id', 'leftLoading');
        container.css({
            'position': 'absolute',
            'width': '80%',
            'left': '10%',
            'top': '40%',
            'color': 'white',
            'text-align': 'center',
        });
        
        var label = $(document.createElement('label'));
        label.text(msg);
        label.css({
            'height': '50%',
            'width': '50%',
            'font-size': '250%'
        });
        if (isMp4) {
            container.css({
                'top': '1%',
            });
            label.css('background-color','black');
        }
        if (!nocircle) {
            var circle = $(document.createElement('img'));
            circle.attr('src', tagPath + 'images/icons/progress-circle.gif');
            circle.css({
                'height': '50px',
                'width': 'auto',
                'left': '45%',
                display: 'block',
                position: 'relative',
                'top': '30%',
                'margin-bottom':'5%'
            });
            if (isMp4) {
                circle.css({
                    'height':'25px',
                    'top': '1%',
                    //'left':'',
                })
            }
            container.append(circle);
        }
        container.append(label);
        return container;
    }
    // sets up error handler for a video element
    // container is the div we'll append error messages to
    function videoErrorHandler(videoElt, container, conversionFlag) {
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
                    if (conversionFlag && conversionFlag === "False") {
                        //var loadingContainer = createConversionLoading();
                        msg = "This video is being converted to compatible formats for different browsers";
                        //container.append(createConversionLoading(msg));
                        //} else if (!conversionFlag) {
                        //msg = "The video format is not supported.";
                        //container.append(createConversionLoading(msg));
                    } else {
                        msg = "Either the video format is not supported or a network or server error occurred. Please see FAQs on the TAG website.";
                    }
                    break;
                default:
                    msg = "Error: please see FAQs on the TAG website.";
                    break;
            }
            $("#videoErrorMsg").remove();
            $("#leftLoading").remove();
            if (conversionFlag && conversionFlag === "False") {
                container.append(createConversionLoading(msg));
            } else if (!document.getElementById("leftLoading")) {
                //if (conversionFlag==="True") { //&& conversionFlag === "True"
                var msgdiv = $(document.createElement('div'));
                msgdiv.attr("id", "videoErrorMsg");
                msgdiv.css({
                    'position': 'absolute',
                    'width': '80%',
                    'left': '10%',
                    'top': '50%',
                    'color': 'white',
                    'text-align': 'center',
                    'font-size': TAG.Util.getMaxFontSizeEM(msg, 2, container.width() * 0.8, container.height() * 0.2, 0.1)
                });
                msgdiv.text(msg);
                container.append(msgdiv);
            }
            videoElt.hide();

            videoElt[0].onerror = function (err) { };// get rid of the error handler afterwards
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
            url: path.match(/\//) ? path : tagPath+"html/"+path,
            success: function (data) {
                ret = data;
            },
            error: function (err) {
                console.log("url = " + path);
                console.log("error: "+err.statusText);
                ret = null;
            },
            dataType: 'html'
        });
        return ret ? (IS_WINDOWS ? $(toStaticHTML(ret)) : $(ret)) :  '';
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

    /**
     * Take in a color and return a dimmed version of that color (divide rgb by k)
     * @param {String} inColor      input color as a hex string
     * @param {Number} k            dimming factor
     * @return {String}             formatted as 'rbg(_,_,_)'
     */
    function dimColor(inColor, k) {
        var r,
            g,
            b;

        k = k || 3;

        inColor = inColor.replace(/\#/g, '');
        inColor = inColor.substring(0, 6);

        r = Math.round(parseInt(inColor.substring(0, 2), 16) / k);
        g = Math.round(parseInt(inColor.substring(2, 4), 16) / k);
        b = Math.round(parseInt(inColor.substring(4, 6), 16) / k);

        return 'rgb(' + r + ',' + g+ ',' + b + ')';
    }

    /**
     * Take in a color (in '#abcdef' format) and an opacity (0-1) and return an rgba(..) string
     * @param {String} color       input color as a hex string
     * @param {String} opac        input opacity
     * @return {String}            'rgba(color.r, color.g, color.b, opac)'
     */
    function hexToRGBA(color, opac) {
        var r, g, b;

        color = color.replace(/\#/g, '');
        color = color.substring(0, 6);

        r = parseInt(color.substring(0, 2), 16);
        g = parseInt(color.substring(2, 4), 16);
        b = parseInt(color.substring(4, 6), 16);

        return 'rgba(' + r + ',' + g + ',' + b + ',' + opac + ')';
    }

    /***
    * Create the tutorial popup for the collections page
    * @method createTutorialPopup
    */

    function createTutorialPopup(collection) {
        var tagContainer = $('#tagRoot');
        var infoOverlay = $(TAG.Util.UI.blockInteractionOverlay());
        var infoBox = $(document.createElement('div')).addClass('infoBox');
        var infoMain = $(document.createElement('div')).addClass('infoMain');
        var infoTitle = $(document.createElement('div')).addClass('infoTitle');
        var closeButton = createCloseButton().addClass('closeButton');
        var telemetry_timer = new TelemetryTimer();

        function createCloseButton() {
            var closeButton = $(document.createElement('img'));
            closeButton.attr('src', tagPath + 'images/icons/x.svg');
            closeButton.text('X');
            closeButton.css({
                'height': '3%',
                'width': '3%',
                'margin-left': '39%',
                'margin-bottom': '3.5%'
            });
            return closeButton;
        }

        TAG.Telemetry.register(closeButton, 'mousedown', 'Overlay', function(tobj){
            tobj.overlay_type = "tutorial";
            tobj.current_collection = collection.Identifier;
            tobj.time_spent = telemetry_timer.get_elapsed();
            //console.log("current collection " + tobj.current_collection);
            //console.log("elapsed " + tobj.time_spent);
        });

        infoBox.css({
            'background-color': 'black',
            'color': 'white',
            'height': '55%',
            'width': '50%',
            'margin-top': '15%',
            'margin-left': '25%',
        });

        infoTitle.css({
            'padding-top': '5%',
            'padding-left': '8%',
            'padding-right': '8%',
            'background-color': 'black',
            'display': 'block',
            'color': 'white',
            'border-top-left-radius': '3.5px',
            'border-top-right-radius': '3.5px',
            'font-size': '1.5em'
        }).text('Welcome to Touch Art Gallery');

            infoMain.css({
                'background-color': 'black',
                'display': 'block',
                'color': 'white',
                'font-size': '0.75em',
                'margin-left': '8%',
                'margin-top': '4%',
                'margin-right': '8%'
            });

            closeButton.css({
                'height': '4%',
                'width': '4%',
                'min-height': '20px',
                'min-width': '20px',
                'margin-left': '0%',
                'margin-bottom': '0%',
                'margin-top': '1%',
                'margin-right': '1%',
                'top': '0%',
                'display': 'block',
                'float': 'right'
            });

            infoBox.append(closeButton);
            infoBox.append(infoTitle);

            function createDivWithLabel(text, src) {
                var section = $(document.createElement('div'))
                    .addClass('infoSection')
                    .css({
                        'display': 'block',
                        'position': 'relative',
                        'width': '100%',
                        'min-height': '1.5%',
                        'max-height': '4%',
                        'padding-bottom': '1.5%',
                    })
                if (src) {
                    var imgholder = $(document.createElement('div'))
                        .addClass('infoSectionIconHolder')
                        .css({
                            'display': 'inline-block',
                            'position': 'absolute',
                            //'padding-top':'1%',
                            'height': '80%',
                            'width': '10%',
                            'left': '0%',
                            'top': '0%',
                            'text-align': 'center',
                            'vertical-align': 'middle'
                        });
                    imgholder.append(
                        $(document.createElement('img'))
                        .addClass('infoSectionIcon')
                        .attr('src', src)
                        .css({
                            'display': 'block',
                            'position': 'absolute',
                            'vertical-align': 'middle',
                            'width': '100%',
                            'max-width': '45px',
                            'height': 'auto',
                            'max-height': '45px'/*
                        bottom: '0px',
                        display: 'block',
                        height: '100%',
                        left: '0px',
                        'margin-bottom': 'auto',
                        'margin-left': 'auto',
                        'margin-right': 'auto',
                        'margin-top': 'auto',
                        'max-height': '80%',
                        'max-width': '80%',
                        position: 'absolute',
                        right: '0px',
                        top: '0px',
                        width: 'auto',*/
                        })
                    );
                    section.append(imgholder);
                }
                section.append(
                    $(document.createElement('div'))
                    .addClass('infoSectionText')
                    .text(text)
                    .css({
                        'display': 'inline-block',
                        'position': 'relative',
                        'width': src ? '85%' : '100%',
                        'left': src ? '12%' : '0%'
                    })
                );
                infoMain.append(section);
            }

            createDivWithLabel("Click or tap on a tile to preview the item it represents, and click/tap on its thumbnail again to begin exploring it in full.");
            createDivWithLabel("Tiles without icons are image artworks. Any media associated with the artwork will appear below the artwork in the previewer. You can explore the artwork with a specific media item by tapping on the item's thumbnail image.")
            createDivWithLabel("Tiles with the play icon represent video artworks. Click or tap on the tile to view them in the video player.", tagPath + 'images/video_icon.svg');
            createDivWithLabel("Tiles with this icon represent interactive tours. Click or tap on the tile to open them in the tour player. Tours are like video narratives, but can be paused at any time via the controls, or by tapping anywhere in the player. While paused, you can freely manipulate all items that are currently onscreen.", tagPath + 'images/tour_icon.svg');

        infoBox.append(infoMain);

        infoOverlay.css('z-index', TAG.TourAuthoring.Constants.aboveRinZIndex);
        infoOverlay.append(infoBox);

        closeButton.on('mousedown', function () {
            infoOverlay.fadeOut();
        });

        tagContainer.append(infoOverlay);
        infoOverlay.fadeIn();

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
    var globalKeyHandler = [];


    return {
        slidePageLeftSplit: slidePageLeftSplit,
        slidePageRightSplit: slidePageRightSplit,
        slidePageLeft: slidePageLeft,
        slidePageRight: slidePageRight,
        hexToR: hexToR,
        hexToG: hexToG,
        hexToB: hexToB,
        hexToRGB: hexToRGB,
        hexToRGBA: hexToRGBA,
        colorToHex: colorToHex,
        dimColor: dimColor,
        fitTextInDiv: fitTextInDiv,
        drawPushpins: drawPushpins,
        addPushpinToLoc: addPushpinToLoc,
        getLocationList: getLocationList,
        popUpMessage: popUpMessage,
        PopUpConfirmation: PopUpConfirmation,
        popupInputBox: popupInputBox,
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
        createTrack: createTrack,
        getStack: getStack,
        initKeyHandler: initKeyHandler,
        keyHandler: keyHandler,
        showPageLink: showPageLink,
        uploadProgressPopup : uploadProgressPopup,
    };

    //initKeyHandler();



    function initKeyHandler() {
        window.focus();
        window.addEventListener('keydown', keyHandler);
    }

    /**The key handling event function
     * @method keyHandler
     * @param {Event} event     // the event triggered on key presses
     */
    function keyHandler(event) {
        event.stopPropagation();        
        if (globalKeyHandler && globalKeyHandler[0] && globalKeyHandler[0][event.which]) {
            globalKeyHandler[0][event.which](event);
        }
      }

    function getStack() {
        return globalKeyHandler;
    }

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
            if (evt.which === 13 && serverDialog.length > 0) {
                evt.stopPropagation();
                evt.preventDefault();
                saveClick();
            }
        });

        /* TODO merging
        TAG.Telemetry.register(serverDialogInput, 'keydown', 'change_server', function(tobj, evt) {
            if(evt.which !== 13) {
                return true;
            }
            tobj.custom_3 = localStorage.ip;
            tobj.custom_4 = serverDialogInput.val();
            tobj.custom_5 = 'Kiosk';
        });
        */

        var serverDialogContact = $(document.createElement('div'));
        serverDialogContact.css({ 'margin-top': '10%' , 'color':'white','text-align': 'center'  });
        if (!IS_WINDOWS) {
            serverDialogContact.html(
                "Contact us for server setup at:<br /><a href='mailto:brown.touchartgallery@outlook.com'>brown.touchartgallery@outlook.com</a>.");
        } else {
            serverDialogContact.html(
                "Contact us for server setup at:<br />brown.touchartgallery@outlook.com.");
        }
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

        /* TODO merging
        TAG.Telemetry.register(serverSaveButton, 'click', 'change_server', function(tobj, evt) {
            tobj.custom_3 = localStorage.ip;
            tobj.custom_4 = serverDialogInput.val();
            tobj.custom_5 = 'Kiosk';
        });
        */

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

        opac = (opac || opac===0) ? Math.max(Math.min(parseFloat(opac), 1), 0) : 0.6;
        
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
        var overlay,first;
        if(document.getElementById("popupblockInteractionOverlay")){
            overlay = $(document.getElementById("popupblockInteractionOverlay"));
        }else{
            overlay = blockInteractionOverlay();
            first = true;
            $(overlay).attr('id', 'Overlay');
        }
        var confirmBox = document.createElement('div');
        var confirmBoxSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.35,
               max_width: 650,
               max_height: 300,
           });
		var leftPos = ($('#tagRoot').width() - confirmBoxSpecs.width) * 0.5;
        var currentKeyHandler = globalKeyHandler[0];

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
            'height': '30%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '1.20em',
            'position': 'relative',
            'text-align': 'center',
            'word-wrap': 'break-word',

        });
        var fontsize = TAG.Util.getMaxFontSizeEM(message, 1.5, $(messageLabel).width(), $(messageLabel).height());
        $(messageLabel).css('font-size', fontsize);
        TAG.Util.multiLineEllipsis($(messageLabel));
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
            'bottom': '6%',
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
            'margin-top': '-1%',
            color: 'white',
        }).css('border-radius', '3.5px');
        buttonText = (!buttonText || buttonText === "") ? "OK" : buttonText;
        $(confirmButton).text(buttonText);
        confirmButton.onclick = function () {
            if (clickAction) {
                clickAction();
            }
            if (first) {
                removeAll();
            } else {
                $(confirmBox).remove();
            }
        };




        function onEnter() {
            if(clickAction) {
                clickAction();
            }
            removeAll();
            
        }

        globalKeyHandler[0] = { 13: onEnter, };

        function removeAll() {
            if (noFade) {
                $(overlay).hide();
                $(overlay).remove();
            } else {
                $(overlay).fadeOut(500, function () { $(overlay).remove(); });
            }
            globalKeyHandler[0] = currentKeyHandler;
        }

        $(optionButtonDiv).append(confirmButton);

        $(confirmBox).append(messageLabel);
        $(confirmBox).append(optionButtonDiv);

        $(overlay).append(confirmBox);
        return overlay;
    }

   
    //generates upload progress popup
    function uploadProgressPopup(clickAction, message, filesArray) {
        var buttonText, noFade, useHTML, onDialogClick;
        var overlay, first;

        if (document.getElementById("popupblockInteractionOverlay")) {
            overlay = $(document.getElementById("popupblockInteractionOverlay"));
        } else {
            overlay = blockInteractionOverlay();
            first = true;
            $(overlay).attr('id', 'popupblockInteractionOverlay');
        }
        var confirmBox = document.createElement('div');
        var confirmBoxSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),
           {
               center_h: true,
               center_v: true,
               width: 0.5,
               height: 0.5,
               max_width: 650,
               max_height: 500,
           });
        var leftPos = ($('#tagRoot').width() - confirmBoxSpecs.width) * 0.5;
        var currentKeyHandler = globalKeyHandler[0];

        $(confirmBox).css({

            position: 'absolute',
            left: leftPos + 'px',
            top: confirmBoxSpecs.y + 'px',
            width: confirmBoxSpecs.width + 'px',
            height: confirmBoxSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black',

        });
        if (onDialogClick) {
            $(overlay).click(removeAll);
            $(confirmBox).click(function (event) {
                event.stopPropagation();
            });
        }

        var messageLabel = document.createElement('div');
        $(messageLabel).css({

            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'top': '12.5%',
            //'font-size': '1.20em',
            'position': 'relative',
            'text-align': 'left',
            'word-wrap': 'break-word',

        });

        if (IS_WINDOWS) {
            $(messageLabel).css({'font-size':'1.20em'})
        }

        var fontsize = TAG.Util.getMaxFontSizeEM(message, 1.5, $(messageLabel).width(), $(messageLabel).height());
        $(messageLabel).css('font-size', fontsize);
        TAG.Util.multiLineEllipsis($(messageLabel));
        if (useHTML) {
            $(messageLabel).html(message);
        } else {
            $(messageLabel).text(message);
        }


        //creates the progress pane
        var progressDiv = $(document.createElement('div')).addClass("ProgressDiv").css({
            color: 'white',
            'width': '80%',
            'height': '45%',
            'left': '10%',
            'top': '15%',
            //'font-size': '1.20em',
            'position': 'relative',
            'text-align': 'left',
            'word-wrap': 'break-word',
            'overflow-x': 'hidden',
            'overflow-y':'scroll'
        });

        if (IS_WINDOWS) {
            progressDiv.css({'font-size':'1.20em'})
        }

        //creates an element for one upload
        var createProgressElement = function (name) {

            var realname = name;
            name = function (s) { return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0); } (name)

            var prog = $(document.createElement('div')).addClass("progress" + name).css({
                'width': '100%',
                'height':'20%',
                'position': 'relative',
                //'font-size': '1.20em',
                'text-align': 'left',
                'word-wrap': 'break-word',
                'display': 'block',
                'margin-bottom': '3%'
            });

            if (IS_WINDOWS) {
                prog.css({'font-size':'1.20em'})
            }

            var nameLabel = $(document.createElement('div')).addClass("uploadProgressName" + name).css({
                'text-align': 'left',
                'position': 'absolute',
                'display': 'inline-block',
                'width': '42%',
                'left': '0%',
                'top':'10%',
                'white-space': 'nowrap',
                'overflow': 'hidden',
                'text-overflow':'ellipsis',
                'height': '90%',
                'max-width':'500px'
            }).text(function () {
                if (realname.length > 20) {
                    return realname.substring(0, 17) + "..."
                } else {
                    return realname
                }
            });

            var progressBar = $(document.createElement('div')).addClass("uploadProgress" + name).css({
                'position':'absolute', 'right': '23%', 'top':'20%', 'border-style': 'solid', 'border-color': 'white', 'width': '30%', 'height': '50%', "display": "inline-block",
            });

            var innerProgressBar = $(document.createElement('div')).addClass("uploadProgressInner" + name).css({
                'background-color': 'white', 'width': '0%', 'height': '100%', 'display':'block', 'position':'absolute',
            });

            var progressLabel = $(document.createElement('div')).addClass("uploadProgressLabel" + name).css({
                'text-align': 'left',
                'word-wrap': 'break-word',
                'position': 'absolute',
                'display':'inline-block',
                'width':'13%',
                'right': '6%',
                'height': '90%',
                'top': '10%',
                'white-space': 'nowrap',
                'overflow': 'hidden',
                'text-overflow': 'ellipsis',
                'max-width': '500px',
                'vertical-align':'middle'
            }).text("0%");

            progressBar.append(innerProgressBar)
            prog.append(nameLabel)
            prog.append(progressBar)
            prog.append(progressLabel)
            progressDiv.append(prog)
        }

        for (var i = 0; i < filesArray.length; i++) {
            createProgressElement(filesArray[i])
        }

        var setProgress = function (name, percent) {
            var elementClassName = function (s) { return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0); } (name)
            $(".uploadProgressLabel" + elementClassName).text((percent*100).toString().substring(0, 4) + "%")
            $(".uploadProgressInner" + elementClassName).css({'width':percent*100+'%'});
        }

        var setError = function(name) {
            var elementClassName = function (s) { return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0); } (name)
            $(".uploadProgressLabel" + elementClassName).text("Error")
        }

        var optionButtonDiv = document.createElement('div');
        $(optionButtonDiv).addClass('optionButtonDiv');
        $(optionButtonDiv).css({
            'height': '10%',
            'width': '100%',
            'position': 'absolute',
            'bottom': '5%',
            'right': '2%',
            'margin-bottom':'0%'
        });

        var confirmButton = document.createElement('button');
        $(confirmButton).css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'float': "right",
            'margin-right': '3%',
            'margin-top': '-1%',
            color: 'white',
        }).css('border-radius', '3.5px');
        buttonText = (!buttonText || buttonText === "") ? "OK" : buttonText;
        $(confirmButton).text(buttonText);
        confirmButton.onclick = function () {
            if (clickAction) {
                clickAction();
            }
            if (first) {
                removeAll();
            } else {
                $(confirmBox).remove();
            }
        };

        function onEnter() {
            if (clickAction) {
                clickAction();
            }
            removeAll();
        }

        globalKeyHandler[0] = { 13: onEnter, };

        function removeAll() {
            if (noFade) {
                $(overlay).hide();
                $(overlay).remove();
            } else {
                $(overlay).fadeOut(500, function () { $(overlay).remove(); });
            }
            globalKeyHandler[0] = currentKeyHandler;
        }

        $(optionButtonDiv).append(confirmButton);

        $(confirmBox).append(messageLabel);
        $(confirmBox).append(progressDiv);
        $(confirmBox).append(optionButtonDiv);

        $(overlay).append(confirmBox);

        overlay.createProgressElement = createProgressElement
        overlay.setProgress = setProgress
        overlay.setError = setError

        return overlay;
    }

    // popup message to ask for user confirmation of an action e.g. deleting a tour
    function PopUpConfirmation(confirmAction, message, confirmButtonText, noFade, cancelAction, container, onkeydown,forTourBack,fortelemetry) {
        var overlay;
        var origin;
        /*if (document.getElementById("popupblockInteractionOverlay")) {
            overlay = $(document.getElementById("popupblockInteractionOverlay"));
        } else {
            origin = true;
            overlay = blockInteractionOverlay();
            $(overlay).attr('id', 'popupblockInteractionOverlay');
        }*/

        origin = true;
        overlay = blockInteractionOverlay();
        console.log("Made new overlay");

        origin
        container = container || window;
        var confirmBox = document.createElement('div');
        var popUpHandler = {
            13: doOnEnter,
        }
        var currKeyHandler = globalKeyHandler[0];
        globalKeyHandler[0] = popUpHandler;
        
        //temp solution for telemetry box in all resolutions and browsers. 
        var maxw = 600,
            maxh=300;
        if (fortelemetry) {
            maxw = $('body').width() * 0.45;
            maxh = $('body').height() * 0.33;
        }
        var confirmBoxSpecs = TAG.Util.constrainAndPosition($(container).width(), $(container).height(),
            {
                center_h: true,
                center_v: true,
                width: 0.5,
                height: 0.35,
                max_width:maxw,// $('body').width()*0.33,
                max_height: maxh//$('body').height()*0.2,
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
            'height': '50%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '0.8em',
            'overflow': 'hidden',
            'position': 'relative',
            'text-align': 'center',
            'text-overflow': 'ellipsis',
            'word-wrap': 'break-word'
        });
        var fontsize =TAG.Util.getMaxFontSizeEM(message, 1, $(messageLabel).width(), $(messageLabel).height());
        if (fortelemetry&&IS_WINDOWS) {
            fontsize = TAG.Util.getMaxFontSizeEM(message, 0.8, $(messageLabel).width(), $(messageLabel).height());
        }
        $(messageLabel).css('font-size', fontsize);
        $(messageLabel).text(message).attr("id","popupmessage");
        $(confirmBox).append(messageLabel);
        TAG.Util.multiLineEllipsis($(messageLabel));
        var optionButtonDiv = document.createElement('div');
        $(optionButtonDiv).addClass('optionButtonDiv');
        $(optionButtonDiv).css({
            'height': '20%',
            'width': '100%',
            'position': 'absolute',
            'color': 'white',
            'bottom': '5%',
            'right': '5%',
            'text-align':'center'
        });
        $(confirmBox).append(optionButtonDiv);

        $(overlay).append(confirmBox);
        var confirmButton = document.createElement('button');
        $(confirmButton).css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'float': "left",
            'margin-left': '12%',
            'color': 'white',
            'border-radius': '3.5px',
            'margin-top': '1%'

        }).attr('id', 'popupConfirmButton');
        confirmButtonText = (!confirmButtonText || confirmButtonText === "") ? "Confirm" : confirmButtonText;
        $(confirmButton).text(confirmButtonText);
       
        confirmButton.onclick = function () {
            if (origin) {
                removeAll();
            } else {
                $(confirmBox).remove()
            }
            confirmAction();
        };

        confirmButton.onkeydown = function (event) {
            switch (event.which) {
                case 13: // enter key
                    removeAll();
                    confirmAction();
            }
        }
        $(optionButtonDiv).append(confirmButton);

        var cancelButton = document.createElement('button');
        var $cancelButton = $(cancelButton);
        $cancelButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'float': "right",
            'margin-right': '3%',
            'color': 'white',
            'margin-top': '1%',
            'border-radius': '3.5px'
        }).attr('id', 'popupCancelButton');
        $cancelButton.text('Cancel');
        $(optionButtonDiv).append(cancelButton);

        if (forTourBack) {
            $cancelButton.text('Don\'t Save');
            $(optionButtonDiv).css({
                "right": "0%",
            });
            $(confirmButton).css({
                'left': '12%',
                'margin': 'auto',
                'margin-top': '1%',
            });
            var realcancelbtn = $(document.createElement('button'));
            realcancelbtn.css({
                'padding': '1%',
                'border': '1px solid white',
                'width': 'auto',
                'position': 'relative',
                'float': "right",
                //'margin-right': '12%',
                'right':'12%',
                'color': 'white',
                'margin-top': '1%',
                'border-radius': '3.5px'
            }).text("Cancel");
            var btnwidth = $(cancelButton).width();
            var dontleft = ($(optionButtonDiv).width() - btnwidth) / 2;
            $cancelButton.css({
                "float": 'none',
                'margin': 'auto',
                'margin-top':'1%',                
            });
            $(optionButtonDiv).append(realcancelbtn);
            realcancelbtn.click(function () {
                if (origin) {
                    removeAll();
                } else {
                    $(confirmBox).remove();
                }
            });
        }
        cancelButton.onclick = function () {
            if(origin){
                removeAll();
            }else{
                $(confirmBox).remove();
            }
            cancelAction && cancelAction();
        }

        
        if(fortelemetry){
            $cancelButton.text("No, I don't mind")
                .css({
                    "border-radius":'3.5px',
                    "background-color": "white",
                    "color":'black',
                    "font-weight":"bold"
                });
            $(confirmButton).css({
                "border-radius":'3.5px',
                "font-weight":"bold"
            });
        }
        function doOnEnter() {
            removeAll();
            confirmAction();
        }
        

        function removeAll() {
            if (noFade) {
                $(overlay).hide();
                $(overlay).remove();
            } else {
                $(overlay).fadeOut(500, function () { $(overlay).remove(); });
            }
            globalKeyHandler[0] = currKeyHandler;
        }


       
        return overlay;
    }

    /**
     * Create an input box popup
     * @method popupInputBox
     * @param {Object} options             some input options (callback function for confirm button, etc)
     *            {Function} cancelAction    action to take on clicking "cancel"
     *            {Function} confirmAction   action to take on clicking "confirm"
     *            {jQuery obj} container     container used for styling the popup box
     *            {String} message           message to show at top of popup
     *            {String} placeholder       placeholder text inside input field
     *            {String} confirmText       custom text for the "confirm" button
     * @return {jQuery obj}                overly of popup box
     */
    function popupInputBox(options) {
        var overlay = $(blockInteractionOverlay()),
            cancelAction = function () {
                options.cancelAction && options.cancelAction();
                removeAll();
            },
            confirmAction = function () {
                options.confirmAction && options.confirmAction(inputField.val()); // TODO iframe sanitize input here?
                removeAll();
            },
            popupHandler = {
                13: confirmAction
            },
            container = options.container || window,
            currKeyHandler = globalKeyHandler[0],
            popupBox = $(document.createElement('div')),
            popupBoxSpecs = TAG.Util.constrainAndPosition($(container).width(), $(container).height(), {
                center_h: true,
                center_v: true,
                width: 0.5,
                height: 0.35,
                max_width: 560,
                max_height: 200,
            }),
            messageLabel = $(document.createElement('div')),
            optionButtonDiv = $(document.createElement('div')),
            inputField = $(document.createElement('input')),
            message = options.message || '',
            confirmButton = $(document.createElement('button')),
            cancelButton = $(document.createElement('button')),
            confirmButtonText = options.confirmText || '';

        globalKeyHandler[0] = popupHandler; // TODO KEYHANDLER should we be prepending rather than overwriting first element? same with popupconfirmation above

        popupBox.css({
            position: 'absolute',
            left: popupBoxSpecs.x + 'px',
            top: popupBoxSpecs.y + 'px',
            width: popupBoxSpecs.width + 'px',
            height: popupBoxSpecs.height + 'px',
            border: '3px double white',
            'background-color': 'black'
        });

        messageLabel.css({
            color: 'white',
            'width': '80%',
            'height': '30%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '0.6em',
            'position': 'relative',
            'text-align': 'center',
            'word-wrap': 'break-word'
        });

        messageLabel.text(message);

        inputField.css({
            width: '60%',
            left: '20%',
            position: 'relative'
        });
        inputField.attr({
            type: 'text',
            placeholder: options.placeholder || 'Paste URL here...'
        });

        optionButtonDiv.addClass('optionButtonDiv');
        optionButtonDiv.css({
            'height': '20%',
            'width': '100%',
            'position': 'absolute',
            'bottom': '10%',
            'right': '5%'
        });

        confirmButton.css({
            'color': 'white',
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'float': "left",
            'margin-left': '12%',
            'margin-top': '-1%'

        });
        confirmButtonText = !confirmButtonText ? "Confirm" : confirmButtonText;
        confirmButton.text(confirmButtonText);

        confirmButton.on('click', confirmAction);

        confirmButton.on('keydown', function (event) { // TODO KEYHANDLER do we need a separate keydown handler for this? should be handled in global key handling
            switch (event.which) {
                case 13: // enter key
                    confirmAction();
            }
        });

        cancelButton.css({
            'color': 'white',
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'float': "right",
            'margin-right': '3%',
            'margin-top': '-1%'
        });
        cancelButton.text('Cancel');
        cancelButton.on('click', cancelAction);

        function removeAll() {
            overlay.fadeOut(500, function () {
                overlay.remove();
            });
            globalKeyHandler[0] = currKeyHandler;
        }

        optionButtonDiv.append(cancelButton);
        optionButtonDiv.append(confirmButton);

        popupBox.append(messageLabel);
        popupBox.append(inputField);
        popupBox.append(optionButtonDiv);

        overlay.append(popupBox);
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

    /**
     * Take in a color (in '#abcdef' format) and an opacity (0-1) and return an rgba(..) string
     * @method hexToRGBA
     * @param {String} color       input color as a hex string
     * @param {String} opac        input opacity
     * @return {String}            'rgba(color.r, color.g, color.b, opac)'
     */
    function hexToRGBA(color, opac) {
        var r, g, b;

        color = color.replace(/\#/g, '');
        color = color.substring(0, 6);

        r = parseInt(color.substring(0, 2), 16);
        g = parseInt(color.substring(2, 4), 16);
        b = parseInt(color.substring(4, 6), 16);

        return 'rgba(' + r + ',' + g + ',' + b + ',' + opac + ')';
    }

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

    /**
     * Take in a color and return a dimmed version of that color (divide rgb by k)
     * @param {String} inColor      input color as a hex string
     * @param {Number} k            dimming factor
     * @return {String}             formatted as 'rbg(_,_,_)'
     */
    function dimColor(inColor, k) {
        var r,
            g,
            b;

        k = k || 3;

        inColor = inColor.replace(/\#/g, '');
        inColor = inColor.substring(0, 6);

        r = Math.round(parseInt(inColor.substring(0, 2), 16) / k);
        g = Math.round(parseInt(inColor.substring(2, 4), 16) / k);
        b = Math.round(parseInt(inColor.substring(4, 6), 16) / k); 

        return 'rgb(' + r + ',' + g+ ',' + b + ')';
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
            icon: tagPath+'images/icons/locationPin.png',
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
            icon: tagPath+'images/icons/locationPin.png',
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
    function getLocationList(metadata) { //TODO DW - update/review this
        var locationList;
        //parsing the location field in the artwork metadata to obtain the pushpin information
        var data = metadata.RichLocationHistory || metadata.Location;
        try {
            locationList = JSON.parse(data);
        } catch (e) {
            console.log('artwork location metadata cannot be parsed.');
            locationList = [];
            return locationList;
        }

        if (locationList.locations) {
            // load dates and modernize old date objects
            for (var i = 0; i < locationList.locations.length; i++) {
                var locationItem = locationList.locations[i];
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
                    //no longer needed
                    //locationItem.pushpin.date = locationItem.date;
                }
            }
            return locationList.locations;
        } else {
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
    }

    var selectCSS = {
        'color': '#aaaaaa',
        'display': 'inline-block',
        'margin-left': '20px'
    };

    var importButton;



    /**
     * Creates a picker (e.g. click add/remove media in the artwork editor) to manage
     *   associations between different TAG components (exhib, artworks, assoc media)
     * @param root           object: jquery object for the root of the DOM (we'll append an overlay to this)
     * @param title          string: the title to appear at the top of the picker
     * @param target         object: a comp property (object whose associations we're managing) and a type property
     *                               ('exhib', 'artwork', 'media') telling us what kind of component it is
     * @param type           string: "exhib" (exhib-artwork), "artwork" (artwork-media), "bg"- background image : type of the association
     * @param tabs           array: list of tab objects. Each has a name property (string, title of tab), a getObjs
     *                              property (a function to be called to get each entity listed in the tab), and a
     *                              args property (which will be extra arguments sent to getObjs)
     * @param filter         object: a getObjs property to get components that are already associated with target
     *                               (e.g. getAssocMediaTo if type='artwork') and an args property (extra args to getObjs)
     * @param callback       function: function to be called when import is clicked or a component is double clicked
     */
    function createAssociationPicker(root, title, target, type, tabs, filter, callback, importBehavior, queueLength) {
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
            loadQueue = TAG.Util.createQueue(),
            modifiedButtons = target.modifiedButtons || false,

            currentKeyHandler = globalKeyHandler[0];
            globalKeyHandler[0] = { 13: onEnter };

        for (i = 0; i < tabs.length; i++) {
            tabCache.push({ cached: false, comps: [] });
        }

        if (type == "bg"){
            origComps= filter.args;
        } else {
        var filterArgs = (filter.args || []).concat([function (comps) { // this has async stuff, make sure it gets called by the time it needs to be
            for (i = 0; i < comps.length; i++) {
                origComps.push(comps[i].Identifier);
            }
        }, error, cacheError]);
        filter.getObjs.apply(null, filterArgs);
        }

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
            width: '60%',
            height: '55%',
            padding: '1%',
            'padding-left': '2%',
            'background-color': 'black',
            'border': '3px double white',
            top: '22%',
            left: '20%',
        });
        pickerOverlay.append(picker);

        // heading
        pickerHeader = $(document.createElement('div'));
        pickerHeader.addClass('pickerHeading');
        pickerHeader.text(title);
        pickerHeader.css({
            'width': '97%',
            'color': 'white',
            'font-size': '120%',
            'height': '7%',
            'margin-bottom': '10px'
        });

        picker.append(pickerHeader);
        var fontsize = TAG.Util.getMaxFontSizeEM(title,0.7,pickerHeader.width(),pickerHeader.height());
        pickerHeader.css('font-size', fontsize);
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
                    'min-width': '18%',
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
                    'font-size':'0.8em'
                });
                tab.text(tabs[i].name);
                tab.on('click', tabHelper(i, tabs[i].name, queueLength));
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
        pickerSearchBar.addClass("searchBar");
        pickerSearchBar.attr('type', 'text');
        pickerSearchBar.css({
            'margin-left': '1%',
            'width': '20%',
            'height': '55%',
        });
        // TAG.Util.defaultVal("Search by Name...", pickerSearchBar, true, IGNORE_IN_SEARCH); // TODO more specific search (e.g. include year for artworks)
        //pickerSearchBar.attr("placeholder", "Search");
        pickerSearchBar.keyup(function (event) {
            event.stopPropagation();
            if (event.which === 13) {
                TAG.Util.searchData(pickerSearchBar.val(), '.compHolder', IGNORE_IN_SEARCH);
            }
        });

        pickerSearchBar.css({
            'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")',
            'background-size': 'auto 50%',
            'background-repeat': 'no-repeat',
            'background-position': '8px center'
        });

        pickerSearchBar.on('focus', function () { pickerSearchBar.css({ 'background-image': 'none' }); });
        pickerSearchBar.on('focusout', function () {
            if (!pickerSearchBar.val()) {
                pickerSearchBar.css({ 'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")' });
            }
        });

        searchTab.append(pickerSearchBar);

        pickerSearchBar.on('keyup', function () {
            if (!pickerSearchBar.val()) {
                TAG.Util.searchData('', '.compHolder', IGNORE_IN_SEARCH);
            }
        });

        // select all label
        selectAllLabel = $(document.createElement('div'));
        selectAllLabel.attr("id", "selectAllLabel");
        selectAllLabel.css({
            'color': '#aaaaaa',
            'display': 'inline-block',
            'margin-left': '5%',
            'font-size':'0.8em',
        });
        selectAllLabel.text('Select All');
        
        selectAllLabel.on('click', function () {
            var holder, guid, index;
            confirmButton.prop('disabled', false);
            confirmButton.css('opacity', '1');
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
            'margin-left': '5%',
            'font-size': '0.8em',
        });
        deselectAllLabel.text('Deselect All');
        deselectAllLabel.on('click', function () {
            var holder, guid, index, addedIndex;
            confirmButton.prop('disabled', false);
            confirmButton.css('opacity', '1');
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
        optionButtonDiv.attr("id", "optionButtons");
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
            'border-radius': '3.5px'
        });

        confirmButton.text("Save");
        confirmButton.on('click', function () {
            confirmButton.attr('disabled', true).css({ 'color': 'rgba(255, 255, 255, 0.5)' });
            cancelButton.attr('disabled', true).css({ 'color': 'rgba(255, 255, 255, 0.5)' });
            importButton.attr('disabled', true).css({ 'color': 'rgba(255, 255, 255, 0.5)' });
            $('.compHolder').off();
            progressCirc = TAG.Util.showProgressCircle(optionButtonDiv, progressCSS);
            finalizeAssociations();
            globalKeyHandler[0] = currentKeyHandler;
        });

        importButton = $(document.createElement('button'));
        importButton.css({ //initially greyed out
            'margin': '1%',
            'border': '1px solid white',
            'color': 'white',
            'opacity': '.4',
            'padding-left': '1%',
            'padding-right': '1%',
            'background-color': 'black',
            'width': 'auto',
            'position': 'relative',
            'float': "right",
            'border-radius': '3.5px'
        });
        importButton.text('Import');
        importButton.click(importOnClick);
        $(importButton).attr("id", "importButton");
        
        function importOnClick(){
            confirmButton.attr('disabled', true).css({ 'color': 'rgba(255, 255, 255, 0.5)' });
            cancelButton.attr('disabled', true).css({ 'color': 'rgba(255, 255, 255, 0.5)' });
            importButton.attr('disabled', true).css({ 'color': 'rgba(255, 255, 255, 0.5)' });
            console.log("Called import on click");
            $('.compHolder').off();
            finalizeAssociations();
            globalKeyHandler[0] = currentKeyHandler;
            importBehavior();

        }

        /**Saves changes for pressing enter key
         * @method onEnter
         */
        function onEnter(event) {
            event.stopPropagation();
            event.preventDefault();
            if (pickerSearchBar.is(':focus')) {
                TAG.Util.searchData(pickerSearchBar.val(), '.compHolder', IGNORE_IN_SEARCH);
            } else if (confirmButton.is(':disabled')) {
                cancelButton.click();
            }
            else {
                progressCirc = TAG.Util.showProgressCircle(optionButtonDiv, progressCSS);
                finalizeAssociations();
                globalKeyHandler[0] = currentKeyHandler;
            }            
        }

        var cancelButton = $(document.createElement('button')).css('border-radius', '3.5px');
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
            $('.compHolder').off();
            cancelButton.attr('disabled', true).css({ 'color': 'rgba(255, 255, 255, 0.5)' });
            confirmButton.attr('disabled', true).css({ 'color': 'rgba(255, 255, 255, 0.5)' });
            importButton.attr('disabled', true).css({ 'color': 'rgba(255, 255, 255, 0.5)' });
            pickerOverlay.fadeOut(function () { 
                pickerOverlay.empty(); 
                pickerOverlay.remove(); 
            }); //Josh L -- fix so the div actually fades out
            globalKeyHandler[0] = currentKeyHandler;
        });
        //TAG.Telemetry.register(cancelButton, 'click', 'CancelAssociatedMediaPicker', null);

        optionButtonDiv.append(cancelButton);
        optionButtonDiv.append(confirmButton);
        //optionButtonDiv.append(importButton);

        //don't want import button to appear if this is in the add to collections popup
        if (!modifiedButtons) {
           optionButtonDiv.append(importButton);
        }

        picker.append(optionButtonDiv);

        tabHelper(0)(); // load first tab
        confirmButton.prop('disabled', true);
        confirmButton.css('opacity', '0.4');

        $('#mainThumbnailContainer').on('click', function (event) {
            confirmButton.prop('disabled', false);
            confirmButton.css('opacity', '1');
        });

        // helper functions

        // click handler for tabs
        function tabHelper(j, tabName, queueLength) {            
            return function () {                
                loadQueue.clear();
                progressCirc = TAG.Util.showProgressCircle(optionButtonDiv, progressCSS);
                pickerSearchBar.attr("value", "");
                pickerSearchBar.css({ 'background-image': 'url("' + tagPath + '/images/icons/Lens.svg")' });
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
                if(tabName == 'Artworks in this Collection' && queueLength <= 0){ //in Artworks in Collection tab, AND there isn't an upload happening already
                    $(importButton).prop('disabled', false);
                    importButton.css({'opacity': '1'});
                    console.log("import button should be enabled");
                } else{
                    importButton.css({'opacity': '.4'});
                    $(importButton).prop('disabled', true);
                    console.log("import button should be disabled");
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
                    loadQueue.add(drawComp(compArray[i], applyClick),i);
                }
            }
        }

        function drawComp(comp, applyClick,i) {
            return function () {
                var compHolder = $(document.createElement('div'));
                compHolder.addClass("compHolder");
                compHolder.attr('id', comp.Identifier); // unique identifier for this media
                compHolder.data({
                    'type': comp.Metadata.ContentType,
                    'guid': comp.Identifier,
                    'name': comp.Name,
                    'duration': comp.Metadata.Duration,
                    'comp': comp,
                    'year': comp.Metadata.Year,
                    'artist': comp.Metadata.Artist
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
                } else if (comp.Metadata.ContentType === 'Video' || comp.Type === 'Video' || comp.Metadata.Type === 'VideoArtwork') {
                    compHolderImage.attr('src', (comp.Metadata.Thumbnail && !comp.Metadata.Thumbnail.match(/.mp4/)) ? FIXPATH(comp.Metadata.Thumbnail) : tagPath+'images/video_icon.svg');
                    //shouldAppendTII = true;
                    //typeIndicatorImage.attr('src', tagPath+'images/icons/catalog_video_icon.svg');
                } else if (comp.Metadata.ContentType === 'Image' || comp.Type === 'Image') {
                    var imageSrc;
                    if (comp.Metadata.Thumbnail) {
                        imageSrc=FIXPATH(comp.Metadata.Thumbnail)
                    } else if (comp.Metadata.Source) {
                        imageSrc = FIXPATH(comp.Metadata.Source)
                    } else {
                        imageSrc = tagPath + 'images/image_icon.svg';
                    }
                    compHolderImage.attr('src', imageSrc);
                } else if (comp.Metadata.ContentType === 'iframe') {
                    compHolderImage.attr('src', tagPath + 'images/video_icon.svg'); // TODO iframe fix this with new icon
                } else if (comp.Type === 'Empty' || comp.Metadata.ContentType === "Tour") { // tours....don't know why the type is 'Empty'
                    compHolderImage.attr('src', comp.Metadata.Thumbnail ? FIXPATH(comp.Metadata.Thumbnail) : tagPath + 'images/icons/catalog_tour_icon.svg');
                    shouldAppendTII = true;
                    typeIndicatorImage.attr('src', tagPath + 'images/icons/catalog_tour_icon.svg');
                } else {//text associated media without any media...
                    compHolderImage.attr('src', tagPath + 'images/text_icon.svg');
                }

                // if (compHolderImage.height() / compHolderImage.width() > 1) {
                //     compHolderImage.css({
                //         'width': 'auto',
                //         'height': '100%',
                //     });
                // } else {
                //     compHolderImage.css({
                //         'height': 'auto',
                //         'width': '100%',
                //     });
                // }
                compHolderImage.css({
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
                });
                if (i < 30) {
                    $(".compHolderImage").css({
                        'max-height': '100%',
                        //'position': 'absolute',
                        //'left': '0',
                        //'right': '0',
                        //'top': '0',
                        //'bottom': '0',
                        //'margin': 'auto',
                        //'display': 'block',
                        'max-width': '100%',
                        width: 'auto',
                        //height: 'auto'
                    });
                }
                // compHolderImage.removeAttr('width');
                // compHolderImage.removeAttr('height');
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
                    'height': '22%',
                    'color':'white'
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
                } else if (type === 'exhib' && target.type === 'artwork') {
                    for (var i = 0; i < addedComps.length; i++) {
                        TAG.Worktop.Database.changeExhibition(addedComps[i], {AddIDs : [target.comp.Identifier]}, function () {
                            if (i == addedComps.length - 1) {
                                callback();
                                pickerOverlay.fadeOut();
                                pickerOverlay.empty();
                                pickerOverlay.remove();
                            }
                        }, function (err) {
                            console.log(err.message);
                        }, function (err) {
                            console.log(err.message);
                        }, function (err) {
                            console.log(err.message);
                        });
                    }
                } else if (type === 'exhib' && target.type === 'artworkMulti') {
                    for (var i = 0; i < addedComps.length; i++) {
                        TAG.Worktop.Database.changeExhibition(addedComps[i], { AddIDs: [target.comp] }, function () {
                            if (i == addedComps.length - 1) {
                                callback();
                                pickerOverlay.fadeOut();
                                pickerOverlay.empty();
                                pickerOverlay.remove();
                            }
                        }, function (err) {
                            console.log(err.message);
                        }, function (err) {
                            console.log(err.message);
                        }, function (err) {
                            console.log(err.message);
                        });
                    }
                } else if (type === 'artwork' && target.type === 'mediaMulti') {
                    /**
                    console.log("adding associated medias to artworks")
                    for (var i = 0; i < addedComps.length; i++) {
                        TAG.Worktop.Database.changeArtwork(addedComps[i], { AddIDs: [target.comp] }, function () {
                            if (i == addedComps.length - 1) {
                                callback();
                                pickerOverlay.fadeOut();
                                pickerOverlay.empty();
                                pickerOverlay.remove();
                            }
                        }, function (err) {
                            console.log(err.message);
                        }, function (err) {
                            console.log(err.message);
                        }, function (err) {
                            console.log(err.message);
                        });
                    }
                }
                **/
                    var createMediaMultiList = function () {
                        var l = []
                        for (var k = 0; k < target.comp.length; k++) {
                            l.push(target.comp[k].Identifier)
                        }
                        return l
                    }();
                    for (var i = 0; i < addedComps.length; i++) {
                        console.log(target.comp)
                        TAG.Worktop.Database.changeArtwork(addedComps[i], { AddIDs: createMediaMultiList }, function () {
                            if (i == addedComps.length - 1) {
                                callback();
                                pickerOverlay.fadeOut();
                                pickerOverlay.empty();
                                pickerOverlay.remove();
                            }
                        }, function (err) {
                            console.log(err.message);
                        }, function (err) {
                            console.log(err.message);
                        }, function (err) {
                            console.log(err.message);
                        });
                    }
                }
            } else {
                callback();
                pickerOverlay.fadeOut();
                pickerOverlay.empty();
                pickerOverlay.remove();
            }
            if (type === "exhib" && target.type === "exhib") {
                var progressCircCSS = {
                    'position': 'absolute',
                    'left': '40%',
                    'top': '40%',
                    'z-index': '50',
                    'height': 'auto',
                    'width': '20%'
                };
                var viewer = $("#setViewViewer");
                var vert = viewer.height() / 2;
                var horz = viewer.width() / 2;
                var circle = TAG.Util.showProgressCircle(viewer, progressCircCSS, horz, vert, true);
            }
            pickerOverlay.fadeOut();
            pickerOverlay.empty();
            pickerOverlay.remove();
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

    /**
     * Creates a dialog that displays a link to the current page (for use in web app only).
     * @method showPageLink
     * @param {String} baseurl         
     * @param {Object} params          URL params to include
     */
    function showPageLink(baseurl, params) {
        var overlay      = $(document.createElement('div')),
            container    = $(document.createElement('div')),
            linkLabel    = $(document.createElement('label')),
            linkInput    = $(document.createElement('input')),
            buttonRow    = $(document.createElement('div')),
            cancelButton = $(document.createElement('button')),
            tagContainer = $('#tagRoot'),
            text         = baseurl.split(/#/)[0] + '#',
            paramNum     = 0,
            key;

        params = params || {};

        overlay.attr('id', 'linkDialogOverlay');
        overlay.css({
            display: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            'background-color': 'rgba(0,0,0,0.6)',
            'z-index': 10000000,
        });

        container.addClass('linkDialogContainer');
        container.css({
            position: 'absolute',
            left: '20%',
            top: '25%',
            width: '62%',
            border: '3px double white',
            'background-color': 'black',
        });

        overlay.append(container);
        overlay.on('click', closeLinkOverlay);
        container.on('click', function(evt){
            evt.stopPropagation();
        });

        linkInput.addClass('linkDialogInput');
        linkInput.css({
            'border-color': 'gray',
            'color': 'gray',
            'font-size': '1.3em',
            'position': 'relative',
            'margin-top': '20px',
            'min-width': 0,
            'left': '10%',
            'width': '80%'
        });

        //Read-only link
        linkInput.attr('readonly', true);

        for(key in params) {
            if(params.hasOwnProperty(key) && (params[key] || params[key] === false)) {
                text += ((paramNum++) > 0 ? '&' : '') + key + '=' + params[key];
            }
        }
        if(!params.tagserver) {
            text += ((paramNum++) > 0 ? '&' : '') + 'tagserver=' + localStorage.ip;
        }

        linkInput.attr({
            'value':       text,
            'placeholder': 'No page link available'
        });

        buttonRow.css({
            'margin': '20px 0px 20px 0px',
            'position': 'relative',
            'width': '80%',
            'left': '10%',
            'text-align': 'center',
            'display': 'inline-block'
        });

        cancelButton.css({
            'padding': '1%',
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
            'margin-right': '-2%',
            'display': 'inline-block',
        });
        cancelButton.text('Close');
        cancelButton.on('click', closeLinkOverlay);

        function closeLinkOverlay() {
            overlay.fadeOut(500, function() {
                overlay.remove();
            });
        }

        container.append(linkInput);
        
        container.append(buttonRow);
        buttonRow.append(cancelButton);

        return overlay;
    }

})();

/**
 * Some common functionality between the rich location editing and
 * viewing interfaces
 * @method TAG.Util.RLH
 * @param {Object} input           a couple input options
 *         {Doq}         artwork        artwork doq
 *         {jQuery obj}  root           root of current page
 *         {Boolean}     authoring      whether we're in authoring mode
 */
TAG.Util.RLH = function (input) {
    var artwork = input.artwork, // artwork doq
        root = input.root,       // root of current page
        bingMapHelper,       // helper object for Bing map
        customMapHelper,     // helper object for custom maps
        richLocationData,    // object containing rich location data (e.g., 
        currentIndex,        // current map being shown
        mapGuids = [],       // list of map guids, including bing map, the first one is bing Map and null
        mapDoqs = {},        // dictionary of map doqs, not including bing map, keyed by map guid
        defaultMapShown,     // whether bing map is shown
        locations,           // list of locations
        mapHolders = {},     // dictionary of map holder divs, keyed by mapguid
        annotImgs = {},      // object of annotated images corresponding to custom map deepzoom images (keyed by map guid)
        map,                 // bing map
        pushpins = [],       // used to iterate through pushpins
        disabledOverlay,     // overlay on default (bing) map holder if it's disabled
        importDisabledOverlay,
        formIsEnabled = false,// form is currently being displayed
        isEditForm,          // edit location form is open (as opposed to add location form)
        importingMap,        // used to show the correct map after importing 

        locationPanelDiv,    // outer container for whole location history UI
        locationPanel,       // holds content of location history UI

        topRegion,           // contains map name and dots
        metadataContainer,   // map name container div
        nameInput,           // input element for map name
        additionalInfoInput, // input element for additional map info (e.g., date)
        //mapDescriptionInput, // input element for a short map description
        saveMapButton,       // button for saving metadata changes to a map

        mapRegion,           // contains map, arrows
        leftArrowContainer,  // contains left arrow
        leftArrowButton,     // shows previous map if any
        mapContainer,        // map container div (contains all map holders)
        rightArrowContainer, // contains right arrow
        rightArrowButton,    // shows next map if any

        buttonsRegion,       // contains buttons
        buttonsRegionDisabled,
        addLocationButton,   // button for adding new location
        sortLocationsByTitleButton, // sorts the locations by title
        sortLocationsByDateButton, // sorts the locations by date
        dotsContainer,       // dots container div
        deleteButton,        // delete/hide/show map button
        importMapButton,     // import map button

        locationsRegion;     // contains location list

    if (!artwork || !root) {
        console.log("need to provide input.artwork and input.root");
        return;
    }

    return {
        init: init
    };

    /**
     * Initializes rich location history editing (called only once). Grabs
     * artwork.Metadata.RichLocationHistory (or converts old artwork.Metadata.Location
     * object to new format), builds UI, and shows the first map.
     * @method init
     */
    function init() {
        // get data and initialize maps and locations
        richLocationData = artwork.Metadata.RichLocationHistory ? JSON.parse(unescape(artwork.Metadata.RichLocationHistory)) : locationToRichLocation(artwork.Metadata.Location);
        locations = richLocationData.locations || [];
        defaultMapShown = richLocationData.defaultMapShown;
        currentIndex = 0;
        if (!IS_WINDOWS) {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0&onscriptload=DrawMap';
            document.getElementsByTagName('head')[0].appendChild(script);
        }
        bingMapHelper = BingMapHelper();
        customMapHelper = CustomMapHelper();
        importingMap = false;
        isEditForm = false;

        // initialize UI (most of this should be done in JADE/STYL in web app)
        locationPanelDiv = $(document.createElement('div'))
                        .attr('id', 'locationHistoryOuterContainer')
                        .css({
                            position: 'absolute',
                            top: '12%',
                            left: input.authoring?'20%':'22%',
                            width: '65%',
                            height: '85%',
                            display: 'none',
                            'z-index': '51'
                        })
                        .appendTo(root);

        locationPanel = $(document.createElement('div'))
                        .attr('id', 'locationHistoryContainer')
                        .css({
                            display:'inline-block',
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            top: '0%',
                            left: '0%',
                            'z-indez': 99,
                            "border-top-right-radius": "3.5px",
                            "border-bottom-right-radius": "3.5px",
                            'background-color': 'rgba(0,0,0,0.75)'
                        })
                        .appendTo(locationPanelDiv);

        topRegion = $(document.createElement('div'))
                    .attr('id', 'locationHistoryTopRegion')
                    .css({
                        position: 'relative',
                        width: '100%',
                        height: '7%',
                        'font-size': '.5em'
                    })
                    .appendTo(locationPanel);

        metadataContainer = $(document.createElement('div'))
                        .attr('id', 'locationHistoryMetadataContainer')
                        .css({
                            position: 'absolute',
                            'width': '80%',
                            'height': '80%',
                            'top': '10%',
                            'left': '10%',
                            'display':'block'
                        })
                        .appendTo(topRegion);

        if (input.authoring) {
            nameInput = $(document.createElement('input'))
                    .attr({
                        id: 'locationHistoryNameInput',
                        placeholder: 'Map name'
                    })
                    .css({
                        position: 'relative',
                        width: '35%',
                        height: '60%',
                        'max-height':'60px',
                        top: '20%',
                        'font-size':'110%'
                    })
                    .appendTo(metadataContainer);
            /*nameInput.on('keyup', function () {
                var txt = (nameInput && nameInput[0] && nameInput[0].value) ? nameInput[0].value.replace(/[^àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\w\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') : "";
                if (nameInput && nameInput[0] && nameInput[0].value && nameInput[0].value != txt) {
                    nameInput[0].value = txt;
                }
            });*/
            additionalInfoInput = $(document.createElement('input'))
                        .attr({
                            id: 'locationHistoryAdditionalInfoInput',
                            placeholder: 'Date',
                            maxlength:'15'
                        })
                        .css({
                            position: 'relative',
                            'margin-left': '10px',
                            width: '20%',
                            height: '60%',
                            'max-height': '60px',
                            top: '20%',
                            'font-size': '110%'
                        })
                        .appendTo(metadataContainer);
            /*additionalInfoInput.on('keyup', function () {
                var txt = (additionalInfoInput && additionalInfoInput[0] && additionalInfoInput[0].value) ? additionalInfoInput[0].value.replace(/[^àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\w\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') : "";
                if (additionalInfoInput && additionalInfoInput[0] && additionalInfoInput[0].value && additionalInfoInput[0].value != txt) {
                    additionalInfoInput[0].value = txt;
                }
            });*/
            saveMapButton = $(document.createElement('button'))
                            .attr({
                                id: 'locationHistorySaveMapButton',
                                type: 'button'
                            })
                            .css({
                                position: 'relative',
                                'margin-left': '10px',
                                top: '20%',
                                height: '60%',
                                'max-height': '60px',
                            })
                            .text('Save')
                            .appendTo(metadataContainer);
            saveMapButton.on('click', saveCurrentMapMetadata);
        } else {
            nameInput = $(document.createElement('div'))
                    .attr({
                        id: 'locationHistoryNameHolder'
                    })
                    .css({
                        'font-size': '2.5em',
                        position: 'absolute',
                        top: '15%',
                        height: '90%',
                        width:'100%',
                        'text-overflow': 'ellipsis',
                        'overflow': 'hidden',
                        'white-space': 'nowrap',
                        'display':'block'
                    })
                    .appendTo(metadataContainer);

            additionalInfoInput = $(document.createElement('div'))
                        .attr({
                            id: 'locationHistoryAdditionalInfoHolder'
                        })
                        .css({
                            'font-size': '2.5em',
                            position: 'absolute',
                            top: '15%',
                            right: '0%',
                            height: '90%'
                        })
                        .appendTo(metadataContainer);
        }

        mapRegion = $(document.createElement('div'))
                    .attr('id', 'locationHistoryMapRegion')
                    .css({
                        position: 'relative',
                        width: '100%',
                        height: '49%'
                    })
                    .appendTo(locationPanel);

        leftArrowContainer = $(document.createElement('div'))
                    .attr('id', 'locationHistoryLeftArrowContainer')
                    .css({
                        position: 'absolute',
                        width: '10%',
                        height: '100%'
                    })
                    .appendTo(mapRegion);

        leftArrowButton = $(document.createElement('img'))
                    .attr('id', 'locationHistoryLeftArrowButton')
                    .attr('src', tagPath+'images/icons/Left.png')
                    .css({
                        position: 'absolute',
                        width: '13px',
                        height: 'auto',
                        right: '10%',
                        top: '50%',
                        cursor: 'pointer'
                    })
                    .appendTo(leftArrowContainer)

        mapContainer = $(document.createElement('div'))
                    .attr('id', 'locationHistoryMapContainer')
                    .css({
                        top:'2%',
                        position: 'absolute',
                        width: '80%',
                        height: '100%',
                        left: '10%',
                        'border': '1px solid white',
                        'background-color': 'rgba(0,0,0,0.8)'
                    })
                    .appendTo(mapRegion);

        rightArrowContainer = $(document.createElement('div'))
                    .attr('id', 'locationHistoryRightArrowContainer')
                    .css({
                        position: 'absolute',
                        width: '10%',
                        height: '100%',
                        left: '90%'
                    })
                    .appendTo(mapRegion);

        rightArrowButton = $(document.createElement('img'))
                    .attr('id', 'locationHistoryRightArrowButton')
                    .attr('src', tagPath+'images/icons/Right.png')
                    .css({
                        position: 'absolute',
                        width: '13px',
                        height: 'auto',
                        left: '10%',
                        top: '50%',
                        cursor: 'pointer'
                    })
                    .appendTo(rightArrowContainer)

        disabledOverlay = $(document.createElement('div'))
                    .attr('id', 'defaultMapDisabledOverlay')
                    .css({
                        'background-color': 'rgba(0,0,0,0.85)',
                        'color': 'white',
                        'font-size': '20px',
                        'height': '100%',
                        'position': 'absolute',
                        'text-align': 'center',
                        'top': '0%',
                        'width': '100%'
                    })
                    .text('Bing map is disabled.');

        importDisabledOverlay = $(document.createElement('div'))
                    .attr('id', 'importDisabledOverlay')
                    .css({
                        'background-color': 'rgba(0,0,0,0.5)',
                        'color': 'white',
                        'font-size': '30px',
                        'height': '100%',
                        'position': 'absolute',
                        'vertical-align':'middle',
                        'text-align': 'center',
                        'top': '0%',
                        'z-index': '1000',
                        'display': 'block',
                        width: '100%',
                        height: '100%',
                        left: '0%',
                    })
                    .append($(document.createElement('div'))
                        .css({
                            'top': '30%',
                            'position':'relative'
                        })
                        .text('Loading...')
                    );

        if (input.authoring) {

            dotsContainer = $(document.createElement('div'))
                    .attr('id', 'locationHistoryDotsContainer')
                    .css({
                        'margin-left': 'auto',
                        'margin-right': 'auto',
                        'margin-top': '5px',
                        'margin-bottom': '5px',
                        //'width': '30%',
                        'height': '30px',
                        'top': '100%',
                        'text-align': 'center',
                        display: 'block',
                    })
                    .appendTo(locationPanel);

        }

        buttonsRegion = $(document.createElement('div'))
                    .attr('id', 'locationHistoryButtonsRegion')
                    .css({
                        position: 'relative',
                        left: '10%',
                        width: '80%',
                        top: '0%',
                        height: '6%',
                        'margin-bottom': '0%'
                    })
                    .appendTo(locationPanel);

        buttonsRegionDisabled = $(document.createElement('div'))
                    .attr('id', 'locationHistoryButtonsRegionDisabled')
                    .css({
                        position: 'absolute',
                        left: '0',
                        width: '100%',
                        top: '0%',
                        height: '100%',
                        'z-index': '100000',
                        'display': 'none',
                        'background-color': 'rgba(0,0,0,0.01)',
                    })
                    .appendTo(buttonsRegion);

        if (input.authoring) {
            addLocationButton = $(document.createElement('button'))
                        .attr({
                            'id': 'locationHistoryAddLocationButton',
                            'type': 'button'
                        })
                        .css({
                            position: 'relative',
                            float: 'left'
                        })
                        .appendTo(buttonsRegion)
                        .text('Add Location').css('border-radius', '3.5px');
            sortLocationsByTitleButton = $(document.createElement('button'))
                        .attr({
                            'id': 'locationHistorySortLocationsByTitleButton',
                            'type': 'button'
                        })
                        .css({
                            position: 'relative',
                            'margin-left': '10px',
                            float: 'left'
                        })
                        .appendTo(buttonsRegion)
                        .text('Sort By Title').css('border-radius', '3.5px');
            sortLocationsByDateButton = $(document.createElement('button'))
                        .attr({
                            'id': 'locationHistorySortLocationsByDateButton',
                            'type': 'button'
                        })
                        .css({
                            position: 'relative',
                            'margin-left': '10px',
                            float: 'left'
                        })
                        .appendTo(buttonsRegion)
                        .text('Sort By Date').css('border-radius', '3.5px');

            importMapButton = $(document.createElement('button'))
                    .attr({
                        'id': 'locationHistoryImportMapButton',
                        'type': 'button'
                    })
                    .css({
                        position: 'relative',
                        float: 'right'
                    })
                    .appendTo(buttonsRegion)
                    .text('Import Map').css('border-radius', '3.5px');

            deleteButton = $(document.createElement('button'))
                        .attr({
                            'id': 'locationHistoryDeleteButton',
                            'type': 'button'
                        })
                        .css({
                            position: 'relative',
                            'margin-right': '10px',
                            float: 'right'
                        })
                        .text('Delete Map')
                        .appendTo(buttonsRegion).css('border-radius', '3.5px');



            importMapButton.on('click', importMap);
            deleteButton.on('click', function (evt) {
                var mapName = function () {
                    if (mapGuids[currentIndex]) {
                        if (mapDoqs[mapGuids[currentIndex]].Name.length > 14) {
                            return "'" + mapDoqs[mapGuids[currentIndex]].Name.substring(0, 14) + '...' + "'";
                        } else {
                            return "'" + mapDoqs[mapGuids[currentIndex]].Name + "'";
                        }
                    } else {
                        return 'Custom Map';
                    }
                }();
                if (!(currentIndex === 0)) { //if it's not the bing map being displayed, confirm the deletion
                    var overlay = TAG.Util.UI.PopUpConfirmation(function () {
                        deleteMap();
                    }, "Are you sure you want to delete " + mapName + " and all locations associated with it?", "Yes");
                    root.append(overlay);
                    $(overlay).show();
                    evt.stopPropagation();
                } else {
                    deleteMap(); //hides bing map
                };
            });
            addLocationButton.on('click', addLocation);
            sortLocationsByTitleButton.on('click', sortLocationsByTitle);
            sortLocationsByDateButton.on('click', sortLocationsByDate);
        } else {
            dotsContainer = $(document.createElement('div'))
                            .attr('id', 'locationHistoryDotsContainer')
                            .css({
                                position: 'absolute',
                                'width': '40%',
                                'height': '50%',
                                'top': '50%',
                                'left': '30%',
                                'text-align': 'center'
                            })
                            .appendTo(buttonsRegion);
        }

        locationsRegion = $(document.createElement('div'))
                    .attr('id', 'locationHistoryLocationsRegion')
                    .css({
                        top:'1%',
                        position: 'relative',
                        width: '80%',
                        left: '10%',
                        height: '28%',
                        color: 'white',
                        'font-size': '11',
                        'font-weight': '300',
                        'overflow-y': 'auto',
                        'overflow-x': 'hidden'
                    })
                    .appendTo(locationPanel)
                    .text("No locations to display...");

        if (!(input.authoring)) {
            locationsRegion.css({
                top: '2%',
                height: '32%'
            });
        }

        // set up click handlers, etc
        leftArrowButton.on('click', function () {
            if (currentIndex - 1 >= 0) {
                showMap(mapGuids[--currentIndex]);
            } else {
                currentIndex = mapGuids.length - 1;
                showMap(mapGuids[currentIndex]);
            }
        });

        rightArrowButton.on('click', function () {
            if (currentIndex + 1 < mapGuids.length) {
                showMap(mapGuids[++currentIndex]);
            } else {
                currentIndex = 0;
                showMap(mapGuids[0]);
            }
        });

        // load in the first map in the list
        getMaps();

        return locationPanelDiv;
    }

    /**
    *Hides the Map Name field, Additional Input (date) field, and save button in the metadata container
    *Called when the Bing Map is being displayed, displays the name 'Bing Map'
    *@method hideMetadataEditingFields
    */
    function hideMetadataEditingFields() {
        nameInput.css({ visibility: 'hidden' });
        additionalInfoInput.css({ visibility: 'hidden' });
        saveMapButton && saveMapButton.css({ visibility: 'hidden' });
        $(document.createElement('div'))
            .attr({
                id: 'bingMapNameHolder'
            })
            .css({
                'font-size': '2.5em',
                'vertical-align':'middle',
                position: 'absolute',
                top: '15%',
                height: '90%',
                'z-index': '50',
                color: 'white'
            })
            .text('Bing Map')
            .appendTo(metadataContainer);
        if (!input.authoring) {
            $('#bingMapNameHolder').css({
                //top: '0%',
                //'margin-top': '-1%'
            });
        } else {
            $('#bingMapNameHolder').css({
                //'font-size': '210%',
            });
        }
    }

    /**
    *Shows the Map Name field, Additional Input (date) field, and save button in the metadata container
    *Reverses the above function, called when any map besides the bing map is displayed
    *@method showMetadataEditingFields
    */
    function showMetadataEditingFields() {
        $('#bingMapNameHolder').remove();
        nameInput.css({ visibility: 'visible' });
        additionalInfoInput.css({ visibility: 'visible' });
        saveMapButton && saveMapButton.css({ visibility: 'visible' });
    }

    /**
     * Get all the maps for the artwork
     * @method getMaps
     * @param {Function} callback      function to call when maps have been obtained and loaded
     */
    function getMaps(callback) {
        callback = callback || function () {
            if (!importingMap) { //don't display the first map if an import has just occured
                try {
                    showMap(mapGuids[currentIndex]);
                } catch (e) {
                    showMap(mapGuids[0]);
                }
            } else { //display the last one instead
                importingMap = false;
                showMap(mapGuids[mapGuids.length - 1]);
                removeLoadingOverlay();
            }
        };
        mapGuids = (defaultMapShown || input.authoring) ? [null] : [null];
        TAG.Worktop.Database.getMaps(artwork.Identifier, function (mps) {
            var mapslength = mps.length;
            if (mapslength > 0) {
                for (var i = 0; i < mapslength; i++) {
                    mapDoqs[mps[i].Identifier] = mps[i];
                    mapGuids.push(mps[i].Identifier);
                }
            }
            if (!defaultMapShown) { // do not show bing map if it is disabled
                mapGuids.remove(null);
            }
            loadMaps(callback);
            createDots();
        }, function () {
            loadMaps(callback);
            createDots();
        }, function () {
            loadMaps(callback);
            createDots();
        });
    }

    /**
     * Loads all maps by creating holders for them within the mapContainer div.
     * @method loadMaps
     * @param {Function} callback      function to call when loading is complete
     */
    function loadMaps(callback) {
        var i,
            holder,
            m,
            img,
            progress = { // allows init functions to keep track of how many maps have loaded (call callback after all have loaded)
                total: mapGuids.length,
                done: 0
            },
            helper,
            loadCallback;

        mapHolders = {};
        mapContainer.empty(); // TODO this is inefficient, just here for rapid prototyping

        loadCallback = function () {
            callback && callback();
            createLocationList();
        };

        for (i = 0; i < mapGuids.length; i++) {
            holder = $(document.createElement('div'))
                        .addClass('locationHistoryMapHolder')
                        .css({
                            //'background-color': 'rgba(0,0,0,0.8)',
                            //'border': '1px solid white',
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            left: '0%',
                            top: '0%',
                            'text-align': 'center',
                            display: 'none'
                        })
                        .appendTo(mapContainer);
            mapHolders[mapGuids[i]] = holder;
            helper = mapGuids[i] ? customMapHelper : bingMapHelper;
            helper.init({
                container: holder,
                mapdoq: mapDoqs[mapGuids[i]],
                progress: progress,
                loadCallback: loadCallback
            });
        }
    }

    /**
     * Saves any metadata changes to the current map
     * @method saveCurrentMapMetadata
     */
    function saveCurrentMapMetadata() {
        var progressCSS = {
            'left': '70%',
            'top': '10px',
            'width': 'auto',
            'height': '50%',
            'position': 'relative',
            'z-index': 50,
            'display': 'inline-block'
        };
        var progCirc = TAG.Util.showProgressCircle(topRegion, progressCSS);

        var index = currentIndex;
        if (mapGuids[index]) {
            TAG.Worktop.Database.changeMap(mapDoqs[mapGuids[index]], {
                Name: nameInput.val() || 'Custom Map',
                AdditionalInfo: additionalInfoInput.val(),
                //Description: mapDescriptionInput.val()
            }, function () {
                var mapName = function () {
                    if (nameInput.val()) {
                        if (nameInput.val().length > 14) {
                            return "'" + nameInput.val().substring(0, 14) + '...' + "'";
                        } else {
                            return "'" + nameInput.val() + "'";
                        }
                    } else {
                        return "'Custom Map'";
                    }
                }();
                deleteButton && deleteButton.text('Delete ' + mapName);
                TAG.Util.removeProgressCircle(progCirc);
                TAG.Worktop.Database.getDoq(mapDoqs[mapGuids[index]].Identifier, function (newMap) {
                    mapDoqs[mapGuids[index]] = newMap;
                });
            }, TAG.Util.UI.errorContactingServerPopup, function () {
                TAG.Util.removeProgressCircle(progCirc);
                TAG.Worktop.Database.getDoq(mapDoqs[mapGuids[index]].Identifier, function (newMap) {
                    mapDoqs[mapGuids[index]] = newMap;
                });
            });
        }
    }

    /**
     * Helper function to iterate through location list and call a
     * helper function for each.
     * @method iterateThroughLocations
     * @param {Function} toCall       helper method to call for each map; by
     *                                default, called with two params (loc and mapdoq)
     */
    function iterateThroughLocations(toCall) {
        var i,
            helper;

        for (i = 0; i < locations.length; i++) {
            if (!locations[i].map && !defaultMapShown && !input.authoring) {
                continue;
            }
            helper = locations[i].map ? customMapHelper : bingMapHelper;
            if (!locations[i].map || mapDoqs[locations[i].map]) { // make sure the custom map exists
                helper[toCall](locations[i], mapDoqs[locations[i].map]);
            }
        }
    }

    /**
     * Create list of locations in the bottom panel
     * @method createLocationList
     */
    function createLocationList() {
        locationsRegion.empty();
        iterateThroughLocations("createLocationItem");
    }

    /**
     * Shows the specified map holder, sets currentIndex, and deals with dot colors
     * @method showMap
     * @param {String} guid        key into mapHolders
     */
    function showMap(guid) {
        var i;

        //if (!(mapGuids[currentIndex] == guid)){ //don't register if already being shown
            TAG.Telemetry.recordEvent("Maps", function(tobj) {
                tobj.current_artwork = artwork.Identifier;            
                tobj.pin_clicked = null;
                tobj.location_clicked = null;
                tobj.map_viewed = mapDoqs[guid] || "Bing Map";
                tobj.map_interaction = "show_map";
                console.log("show map");
            });

        showMetadataEditingFields(); //by default; hideMetadataEditingFields() is called later for bing map
        currentIndex = mapGuids.indexOf(guid);

        // style map dots
        $('.locationHistoryMapDot').css('opacity', '0.4'); //resets all dots to the unselected state
        $('#dot-' + guid).css('opacity', '1'); //selects the correct dot

        // show the correct map holder
        $('.locationHistoryMapHolder').css('display', 'none');
        mapHolders[guid].css('display', 'block');

        // add correct content to name and additional info fields
        if (input.authoring && mapDoqs[guid]) {
            nameInput.attr('value', mapDoqs[guid].Name || '');
            additionalInfoInput.attr('value', mapDoqs[guid].Metadata.AdditionalInfo || '');
        } else {
            nameInput.text(mapDoqs[guid] ? (mapDoqs[guid].Name || 'Custom Map') : 'Bing Map');
            additionalInfoInput.text(mapDoqs[guid] ? (mapDoqs[guid].Metadata.AdditionalInfo || '') : '');
        }

        // deal with additional Bing map styling
        if (!guid) {
            hideMetadataEditingFields(); //hide fields for the bing map
            if (!defaultMapShown) {
                mapHolders[null].append(disabledOverlay);
                deleteButton && deleteButton.text('Show Bing Map');
            } else {
                deleteButton && deleteButton.text('Hide Bing Map');
            }
        } else {
            var mapName = function () {
                if (mapDoqs[guid].Name) {
                    if (mapDoqs[guid].Name.length > 14) {
                        return "'" + mapDoqs[guid].Name.substring(0, 14) + '...' + "'";
                    } else {
                        return "'" + mapDoqs[guid].Name + "'";
                    }
                } else {
                    return 'Custom Map';
                }
            }();
            deleteButton && deleteButton.text('Delete ' + mapName);
        }
    }

    /**
     * Shows a message in the bottom region indicating that saving/loading is
     * underway.
     * @method showLoadingMessage
     * @param {String} message            an optional custom message
     */
    function showLoadingMessage(message) {
        var messageDiv = $(document.createElement('div'));

        messageDiv.css({
            color: 'white',
            'font-size': '20px',
            position: 'relative',
            'text-align': 'center',
            width: '100%'
        });
        messageDiv.text(message || 'Loading...');
        var progressCSS = {
            'left': '5%',
            'top': '15px',
            'width': '40px',
            'height': 'auto',
            'position': 'relative',
            'z-index': 50
        };
        var progCirc = TAG.Util.showProgressCircle(messageDiv, progressCSS);

        locationsRegion.empty();
        locationsRegion.append(messageDiv);
    }

    /**
     * Creates map dots (below the map)
     * @method createDots
     */
    function createDots() {
        var i,
            dot;
        dotsContainer.empty();
        for (i = 0; i < mapGuids.length; i++) {
            dot = $(document.createElement('div'))
                    .addClass('locationHistoryMapDot')
                    .attr('id', 'dot-' + mapGuids[i])
                    .css({
                        display: 'inline-block',
                        cursor: 'pointer',
                        'background-color': 'white',
                        'border': '3px solid white',
                        'border-radius': '20px',
                        'border-color': 'white',
                        width: '6px',
                        height: '6px',
                        'margin-left': '5px',
                        opacity:'1'
                    })
                    .appendTo(dotsContainer);
            dot.on('click', dotClickHelper(i));
        }
    }

    /**
     * Click handler helper for map dots (just calls showMap)
     * @method dotClickHelper
     * @param {Number} i             the index of the dot clicked
     * @return {Function}            a click handler for a map dot
     */
    function dotClickHelper(i) {
        return function () {
            currentIndex = i;
            showMap(mapGuids[i]);
        }
    }

    /**
     * Click function for addLocation Button. create a pin on the map and create
     * a location editing form.  Only one form can be displayed at a time.
     * @method addLocation
     */
    function addLocation() {
        if (!formIsEnabled) {
            formIsEnabled = true;
            var mapguid = mapGuids[currentIndex],
                helper = mapguid ? customMapHelper : bingMapHelper,
                editingFormElements = helper.createLocationEditor();

            locationsRegion.append(editingFormElements.container);
            locationsRegion.scrollTop(0);
            locationsRegion.scrollTop(editingFormElements.container.position().top+20);
        }
    }

    /**
     * Function to remove the add location form when the cancel button is clicked.
     * @method removeLocationForm
     */
    function removeLocationForm() {
        formIsEnabled = false;
        $('.locationEditingContainer').remove();
    }

    /**
     * Function to sort the locations in the list by title when the sort button is clicked.
     * @method sortLocations
     */
    function sortLocationsByTitle() {
        var l;
        var ind;
        if (!formIsEnabled) {

            //sort
            locations.sort(function (a, b) {
                return (a.title.toLowerCase() < b.title.toLowerCase()) ? -1 : 1;
            });

            //hides all location pins (prevents duplicate pins bug)
            for (l = 0; l < map.entities.getLength() ; l++) { //iterates through bing map pushpins
                map.entities.get(l).setOptions({ visible: false });
            }
            for (ind = 0; ind < pushpins.length; ind++) {
                pushpins[ind].css({display:'none'});
                //pushpins[ind].remove();
            }

            //re-creates list (for now)
            createLocationList();

            //save
            TAG.Worktop.Database.changeArtwork(artwork.Identifier, { RichLocationHistory: generateRichLocationData() }, success, error, error, error);
            function success() {}
            function error() { console.log('An error occured while saving.'); }
        }
    }

    /**
     * Function to sort the locations in the list by title when the sort button is clicked.
     * @method sortLocations
     */
    function sortLocationsByDate() {
        var l;
        var ind;
        if (!formIsEnabled) {

            //sort
            locations.sort(function (a, b) {
                return (a.date < b.date) ? -1 : 1;
            });

            //hides all location pins (prevents duplicate pins bug)
            for (l = 0; l < map.entities.getLength() ; l++) { //iterates through bing map pushpins
                map.entities.get(l).setOptions({ visible: false });
            }
            for (ind = 0; ind < pushpins.length; ind++) {
                pushpins[ind].css({ display: 'none' });
                //pushpins[ind].remove();
            }

            //re-creates list (for now)
            createLocationList();

            //save
            TAG.Worktop.Database.changeArtwork(artwork.Identifier, { RichLocationHistory: generateRichLocationData() }, success, error, error, error);
            function success() { }
            function error() { console.log('An error occured while saving.'); }

        }
    }

    /**
     * For backwards compatibility, translates an artwork.Location property to an
     * artwork.RichLocationHistory property
     * @method locationToRichLocation
     * @param {String} locationData           old location data to transform
     * @return {Object}                       properly formatted rich location data
     */
    function locationToRichLocation(locationData) {
        var parsedData = (typeof (locationData) === "string") ? JSON.parse(unescape(locationData)) : locationData,
            locs = [],
            loc,
            i;

        for (i = 0; i < parsedData.length; i++) {
            loc = parsedData[i];
            locs.push({
                map: null,
                latitude: (loc.resource && loc.resource.point && loc.resource.point.coordinates && loc.resource.point.coordinates[0]) ? loc.resource.point.coordinates[0] : 0,
                longitude: (loc.resource && loc.resource.point && loc.resource.point.coordinates && loc.resource.point.coordinates[1]) ? loc.resource.point.coordinates[1] : 0,
                title: loc.address || '',
                date: (loc.date === "string") ? loc.date : '', // TODO maybe do some parsing here
                description: loc.info || ''
            });
        }

        return {
            defaultMapShown: true,
            locations: locs
        };
    }

    /**
     * Some helper functions for the Bing map. The idea is to have BingMapHelper
     * and CustomMapHelper implement the same interface, so manipulating location data can
     * be generic
     * @method BingMapHelper
     */
    function BingMapHelper() {
        var pushpin,
            credentials = "AkNHkEEn3eGC3msbfyjikl4yNwuy5Qt9oHKEnqh4BSqo5zGiMGOURNJALWUfhbmj"; // bing maps credentials

        /**
         * Makes the map, creates pushpin, etc
         * @method init
         * @method {Object} input        some input options
         *             container:        container of the bing map
         *             progress:         an object allowing us to keep track of how many of all maps have loaded 
         *             loadCallback:     callback function to call if this is the last map to load
         */
        function init(input) {

            // load bing map
            
            if (IS_WINDOWS) {
                Microsoft.Maps.loadModule('Microsoft.Maps.Map', {
                    callback: initMap
                });
            } else {
                Microsoft.Maps.loadModule('Microsoft.Maps.Themes.BingTheme', {
                    callback: initMap
                });
            }

            /**
             * Callback function to initiailize bing map
             * @method initMap
             */
            function initMap() {
                var mapOptions = {
                    credentials: credentials,
                    mapTypeID: Microsoft.Maps.MapTypeId.road,
                    showScalebar: true,
                    enableClickableLogo: false,
                    enableSearchLogo: false,
                    showDashboard: false,
                    showMapTypeSelector: false,
                    zoom: 2,
                    center: new Microsoft.Maps.Location(20, 0)
                };

                map = new Microsoft.Maps.Map(input.container[0], mapOptions);

                map.setView({
                    mapTypeId: Microsoft.Maps.MapTypeId.road
                });

                if (++input.progress.done >= input.progress.total) {
                    input.loadCallback && input.loadCallback();
                }
            }
        }

        /**
         * Draws a pushpin using the input location. Note that this is a location object
         * from artwork.Metdata.RichLocationHistory.locations.
         * @method drawPushpin
         * @param {Object} options       some input options
         *          {Object} location      location data for pushpin
         *          {Doq} mapdoq           the doq representing our map (not used here)
         *          {Boolean} editing      whether this pushpin should be manipulatable
         * @return {Microsoft.Maps.Pushpin}     the pushpin object
         */
        function drawPushpin(options) {
            var location = options.location,
                editing = options.editing,
                loc = new Microsoft.Maps.Location(location.latitude, location.longitude),
                pushpin;

            pushpin = new Microsoft.Maps.Pushpin(loc, {
                draggable: !!editing,
                icon: tagPath+'images/icons/locationPin.svg', //green icon is the default
                width: 20,
                height: 30
            });

            //ability to select a pushpin
            Microsoft.Maps.Events.addHandler(pushpin, 'click', selectPushpin);
            function selectPushpin() {
                if (!formIsEnabled) { //don't do anything if another form is already open
                    if (location.descContainer.css('display') === 'block') { //if previously selected - deselect
                        deselect(location, pushpin, false);
                    } else {
                        select(location, pushpin, false);
                        //scroll to the correct location in the list
                        locationsRegion.scrollTop(0);
                        locationsRegion.scrollTop(pushpin.container.position().top);
                    }
                }
                TAG.Telemetry.recordEvent("Maps", function(tobj) {
                    tobj.current_artwork = artwork.Identifier;            
                    tobj.pin_clicked = location;
                    tobj.location_clicked = null;
                    tobj.map_viewed = "Bing Map";
                    tobj.map_interaction = "pushpin_clicked";
                    console.log("bing map pushpin clicked");
                });
            }

            map.entities.push(pushpin);

            return pushpin;
        }

        /**
         * Removes the given pushpin from the map
         * @method removePushpin
         * @param {Object} options           some input options
         *          {Microsoft.Maps.Pushpin}   pushpin    the pushpin to remove
         */
        function removePushpin(options) {
            map.entities.remove(options.pushpin);
        }

        /**
         * Creates location editing interface (used for adding new and editing existing
         * locations)
         * @method createLocationEditor
         * @param {Object} options       some input options
         *          {Object} location       location data to be edited (null for new location)
         *          {Number} index          index of location in location list
         *          {Function} cancelClick  cancel button click handler
         * @return {jQuery obj}          editing container div, which can be appended to list
         */
        function createLocationEditor(options) {
            options = options || {};

            var editingFormElements = commonCreateLocationEditor({
                location: options.location,
                custom: false,
                mapguid: null,
                index: options.index,
                cancelClick: options.cancelClick
            });

            // set up search button click handler
            editingFormElements.searchButton.on('click', function () {
                editingFormElements.resultsDiv.css({ 'margin-bottom': '2%' }); //set this margin only when the results div will be displayed
                editingFormElements.resultsDiv.empty();
                editingFormElements.resultsDiv.text('Searching...'); // TODO better loading UI

                searchBingLocation(editingFormElements.titleInput.val(), function (result) { // success handler
                    var i;

                    // error checking
                    if (!result || !result.resourceSets || !result.resourceSets[0] || !result.resourceSets[0].resources || !result.resourceSets[0].resources.length) {
                        editingFormElements.resultsDiv.text('No results found.'); // TODO could look better
                        return;
                    }

                    editingFormElements.resultsDiv.empty();

                    for (i = 0; i < result.resourceSets[0].resources.length; i++) {
                        editingFormElements.resultsDiv.append(createSearchResultDiv(result.resourceSets[0].resources[i]));
                    }

                    //Select the first result
                    $('.bingSearchResultContainer:eq(0)').click();

                }, function () { // error handler
                    editingFormElements.resultsDiv.text('Error contacting Bing Maps. Please try again.');
                });
            });

            /**
             * Creates a bing map search result div. Called by the callback to searchBingLocation.
             * @method createSearchResultDiv
             * @param {Object} result                this is an object derived from the results of a bing map search
             */
            function createSearchResultDiv(result) {
                var container = $(document.createElement('div')).addClass('bingSearchResultContainer');

                container.css({
                    position: 'relative',
                    width: '100%',
                    'padding-left': '10px',
                    'font-size':'20px'
                });

                container.text(result.address.formattedAddress);

                container.on('click', function () {

                    $('.bingSearchResultContainer').css('background-color', 'rgba(0,0,0,0)');
                    container.css('background-color', 'rgba(255,255,255,0.2)');

                    // error checking
                    if (!result.point || !result.point.coordinates || !result.point.coordinates.length) {
                        return;
                    }

                    editingFormElements.titleInput.attr('value', result.address.formattedAddress);

                    // reset pushpin location
                    editingFormElements.pushpin.setLocation({
                        latitude: result.point.coordinates[0],
                        longitude: result.point.coordinates[1]
                    });

                    // error checking
                    if (!result.bbox || !result.bbox.length) {
                        return;
                    }

                    // pan/zoom to specified point
                    map.setView({
                        bounds: Microsoft.Maps.LocationRect.fromLocations(
                                new Microsoft.Maps.Location(result.bbox[0], result.bbox[1]),
                                new Microsoft.Maps.Location(result.bbox[2], result.bbox[3])
                            )
                    });
                });

                return container;
            }

            /**
             * Searches the input string on a bing map.
             * @method searchBingLocation
             * @param {String} locString          input string to search
             * @param {Function} success          function to call when results have been found
             * @param {Function} error            error callback
             */
            function searchBingLocation(locString, success, error) {
                var requestURL = "http://dev.virtualearth.net/REST/v1/Locations?query=" + encodeURI(locString) + "&output=json&key=" + credentials;

                $.ajax({
                    url: requestURL,
                    success: success,
                    error: error
                });
            }

            return editingFormElements
        }

        /**
         * Creates a location item in the bottom panel (locationsRegion)
         * @method  
         * @param {Object} location      location data for item
         */
        function createLocationItem(location) {
            commonCreateLocationItem({
                location: location,
                custom: false
            });
        }

        return {
            init: init,
            drawPushpin: drawPushpin,
            removePushpin: removePushpin,
            createLocationEditor: createLocationEditor,
            createLocationItem: createLocationItem
        };
    };

    /**
     * Some helper functions for custom maps. The idea is to have BingMapHelper
     * and CustomMapHelper implement the same interface, so manipulating location data can
     * be generic
     * @method CustomMapHelper
     */
    function CustomMapHelper() {

        /**
         * Initialize a custom map
         * @method init
         * @param {Object} input        some input options
         *             container:        container of the bing map
         *             progress:         an object allowing us to keep track of how many of all maps have loaded
         *             loadCallback:     callback function to call if this is the last map to load
         *             mapdoq:           the doq of the custom map
         */
        function init(input) {
            annotImgs = {};
            var annotImg = new TAG.AnnotatedImage({
                root        :   input.container,
                doq         :   input.mapdoq,
                callback    :   function(){
                    annotImg.openArtwork(input.mapdoq);
                    annotImgs[input.mapdoq.Identifier] = annotImg;
                    annotImg.initZoom();
                    
                    if (++input.progress.done >= input.progress.total) {
                            input.loadCallback && input.loadCallback();
                    }
                },
                noMedia: true,
                disableZoom : false
            });
        }

        /**
         * Draw a pushpin on the given map
         * @method drawPushpin
         * @param {Object} options       some input options
         *          {Object} location      location data for pushpin
         *          {Doq} mapdoq           the doq representing our map
         *          {Boolean} editing      whether this pushpin should be manipulatable
         * @return {jQuery obj}          the pushpin element
         */
        function drawPushpin(options) {
            var location = options.location,
                mapdoq = options.mapdoq,
                editing = options.editing,
                annotImg = annotImgs[mapdoq.Identifier],
                pushpin = $(document.createElement('img')),
                lastPivot;
            if (!annotImg) {
                return;
            }

            pushpin.attr({
                src: tagPath+'images/icons/locationPin.svg'
            });

            pushpin.css({
                width: '20px',
                height: '30px',
                'z-index': '1'
            });

            pushpin.addClass('locationPushpin');

            pushpins.push(pushpin);

            if (editing) {
                pushpin.attr({
                    src: tagPath+'images/icons/locationPin2.svg'
                });
            }

            pushpin.on('click', function () {
                if (!editing) {
                    if (!formIsEnabled) { //don't do anything if another form is already open
                        if (location.descContainer.css('display') === 'block') { //if previously selected - deselect
                            deselect(location, pushpin, true);
                        } else { //if not previously selected - select
                            select(location, pushpin, true);
                            //scroll to the correct location in the list
                            locationsRegion.scrollTop(0);
                            locationsRegion.scrollTop(pushpin.container.position().top);
                        }
                    }
                }

                TAG.Telemetry.recordEvent("Maps", function(tobj) {
                    tobj.current_artwork = artwork.Identifier;            
                    tobj.pin_clicked = location;
                    tobj.location_clicked = null;
                    tobj.map_viewed = mapdoq;
                    tobj.map_interaction = "pushpin_clicked";
                    console.log("custom map pushpin clicked");
                });

            });

            //all pins start off in an overlay
            annotImg.addOverlay(pushpin[0], new Seadragon.Point(location.x, location.y), Seadragon.OverlayPlacement.BOTTOM);

            var isOverlay = true,
                x,
                y,
                t,
                l,
                w = parseFloat(pushpin.css('width')),
                h = parseFloat(pushpin.css('height'));

            TAG.Util.makeManipulatable(pushpin[0], {
                onManipulate: function (res) {
                    if (editing) {
                        if (isOverlay) {
                            annotImg.pauseManip(); //prevents the image from moving when the pin is being manipulated
                            isOverlay = false;
                            t = pushpin.css('top');
                            l = pushpin.css('left');
                            annotImg.removeOverlay(pushpin[0]); //seems like this changes the CSS of the pushpin?
                            pushpin.appendTo(mapHolders[mapdoq.Identifier]);
                            pushpin.css({
                                top: t,
                                left: l,
                                position: 'absolute'
                            });
                        }

                        //if pushpin is within bounds of viewport
                        if (annotImg.isInViewportBounds(pushpin)) {
                            t = parseFloat(pushpin.css('top')),
                            l = parseFloat(pushpin.css('left'));

                            pushpin.css("top", (t + res.translation.y) + "px");
                            pushpin.css("left", (l + res.translation.x) + "px");

                            //update the overlay coordinates here - b/c need the translation
                            x = l + res.translation.x + (0.5 * w);
                            y = t + res.translation.y + (h);

                            lastPivot = res.pivot;

                        }
                        //otherwise the location of the pushpin is not updated with manipulation
                    }
                },
                onRelease: function (evt) {
                    if (editing && !isOverlay) {
                        //add the overlay back once mouse is released
                        isOverlay = true;

                        //if pushpin is not within bounds of image, it snaps back to the edge on release
                        if (!annotImg.isInImageBounds(pushpin)) {
                            var coord = annotImg.returnElementToBounds(pushpin);
                            pushpin.css("top", (coord.y - h) + "px");
                            pushpin.css("left", (coord.x - 0.5 * w) + "px");
                            annotImg.addOverlay(pushpin[0], annotImg.pointFromPixel(new Seadragon.Point(coord.x, coord.y)), Seadragon.OverlayPlacement.BOTTOM);
                        } else {
                            annotImg.addOverlay(pushpin[0], annotImg.pointFromPixel(new Seadragon.Point(x, y)), Seadragon.OverlayPlacement.BOTTOM);
                        }
                        annotImg.restartManip(); //allow manipulation of the DZ image after the pin is put down
                    }
                },
                onScroll: function (delta, pivot) { //allow scrolling of the map while dragging a pin (or when the mouse is on top of a pin)
                    annotImg.scroll(delta, { //use the location of the pushpin for the pivot
                        x: w + parseFloat(pushpin.css('left')),
                        y: h + parseFloat(pushpin.css('top'))
                    });
                }
            }, false, true);

            return pushpin;
        }

        /**
         * Removes the given pushpin from the map
         * @method removePushpin
         * @param {Object} options        some input options
         *          {jQuery obj} pushpin    the pushpin to remove
         *          {Object} mapguid        corresponding map's guid
         */
        function removePushpin(options) {
            annotImgs[options.mapguid].removeOverlay(options.pushpin[0]);
            options.pushpin.remove();
        }

        /**
         * Creates location editing interface (used for adding new and editing existing
         * locations)
         * @method createLocationEditor
         * @param {Object} options       some input options
         *          {Object} location       location data to be edited (null for new location)
         *          {Number} index          index of location in location list
         *          {Function} cancelClick  cancel button click handler
         * @return {jQuery obj}          editing container div, which can be appended to list
         */
        function createLocationEditor(options) {
            options = options || {};

            return commonCreateLocationEditor({
                location: options.location,
                custom: true,
                mapguid: mapGuids[currentIndex],
                index: options.index,
                cancelClick: options.cancelClick
            });
        }

        /**
         * Creates a location item in the bottom panel (locationsRegion)
         * @method createLocationItem
         * @param {Object} location      location data for item
         * @param {Doq} mapdoq           the doq representing our map
         */
        function createLocationItem(location, mapdoq) {
            var container = commonCreateLocationItem({
                location: location,
                custom: true,
                mapguid: mapdoq.Identifier
            });
        }

        return {
            init: init,
            drawPushpin: drawPushpin,
            removePushpin: removePushpin,
            createLocationEditor: createLocationEditor,
            createLocationItem: createLocationItem
        };
    }

    /**
     * Common functionality for creating location items
     * @method commonCreateLocationItem
     * @param {Object} options        some input options:
     *          {Object} location        the location in question
     *          {Boolean} custom         whether this is from a custom map
     *          {String} mapguid         the guid of the map in question
     *          
     * @return {jQuery obj}           the outer container of the list item
     */
    function commonCreateLocationItem(options) {
        var container = $(document.createElement('div')).addClass('locationItemContainer'),
            deleteButton = $(document.createElement('img')).addClass('locationItemDeleteButton'),
            editButton = $(document.createElement('img')).addClass('locationItemEditButton'),
            titleContainer = $(document.createElement('div')).addClass('locationItemTitle'),
            dateContainer = $(document.createElement('div')).addClass('locationItemDate'),
            descContainer = $(document.createElement('div')).addClass('locationItemDesc'),
            location = options.location,
            custom = options.custom,
            helper = custom ? customMapHelper : bingMapHelper,
            mapguid = options.mapguid || null,
            pushpin;

        location && (location.descContainer = descContainer);
        location && (location.container = container);

        if (!location) {
            console.log("please provide all options");
            return;
        }

        pushpin = helper.drawPushpin({
            location: options.location,
            mapdoq: mapDoqs[mapguid],
            editing: false
        });

        pushpin['container'] = container;

        //pushpins.push(pushpin);

        container.css({
            margin: '0px 0px 10px 0px',
            position: 'relative',
            width: '100%',
        });
        container.on('click', function () {
            if (!formIsEnabled) { //don't do anything if another form is already open
                if (location.descContainer.css('display') === 'block') { //if previously selected
                    if (custom) {
                        deselect(location, pushpin, true);
                    } else {
                        deselect(location, pushpin, false);
                    }
                }
                else { //if not previously selected

                    TAG.Telemetry.recordEvent("Maps", function(tobj) {
                        tobj.current_artwork = artwork.Identifier;            
                        tobj.pin_clicked = null;
                        tobj.location_clicked = location;
                        tobj.map_viewed = mapDoqs[mapguid] || "Bing Map";
                        tobj.map_interaction = "location_clicked";
                        console.log("location clicked");
                    });

                    if (custom) {
                        annotImgs[mapguid].panToPoint(pushpin[0]);
                        select(location, pushpin, true);
                    } else {
                        select(location, pushpin, false);
                        if (!map.getBounds().contains(pushpin.getLocation())) {
                            map.setView(new Microsoft.Maps.LocationRect.fromLocations(pushpin.getLocation()));
                        }
                    }
                    showMap(mapguid); //don't show the map if you are deselecting a label from another map
                }
            }
        });

        if (input.authoring) {

            deleteButton.css({
                display: 'inline-block',
                cursor: 'pointer',
                height: '30px',
                margin: '2px',
                position: 'relative',
                'vertical-align': 'middle',
                width: '30px'
            });

            deleteButton.attr('src', tagPath+'images/icons/delete.svg');

            deleteButton.on('click', function (evt) {
                var overlay = TAG.Util.UI.PopUpConfirmation(function () {
                    index = locations.indexOf(location);
                    if (index >= 0) {
                        locations.splice(index, 1);
                        saveRichLocationHistory();
                    } else {
                        console.log("error");
                    }
                }, "Are you sure you want to delete this location?", "Yes");
                root.append(overlay);
                $(overlay).show();

                evt.stopPropagation();
            });

            editButton.css({
                display: 'inline-block',
                cursor: 'pointer',
                height: '30px',
                margin: '2px',
                position: 'relative',
                'vertical-align': 'middle',
                width: '30px'
            });

            editButton.attr('src', tagPath+'images/icons/edit.png');

            editButton.on('click', function (evt) {
                if (!formIsEnabled) {
                    formIsEnabled = true;
                    isEditForm = true;

                    //deselect other locations (if necessary)
                    $('.locationItemDesc').css({ 'display': 'none' });
                    $('.locationItemContainer').css('background-color', 'rgba(0,0,0,0)');
                    //reset all pushpins to the green icon
                    $('.locationPushpin').attr('src', tagPath+'images/icons/locationPin.svg');
                    for (l = 0; l < map.entities.getLength() ; l++) { //iterates through bing map pushpins
                        map.entities.get(l).setOptions({ icon: tagPath+'images/icons/locationPin.svg' });
                    }

                    if (custom) {
                        pushpin && pushpin.attr('src', tagPath+'images/icons/locationPin2.svg');
                    }
                    //if it's a bing map pushpin, it's set to red below

                    var editingFormElements;
                    showMap(mapguid);

                    //make sure that the pin is visible on the map
                    if (custom) {
                        annotImgs[mapguid].panToPoint(pushpin[0]);
                    } else {
                        if (!map.getBounds().contains(pushpin.getLocation())) {
                            map.setView(new Microsoft.Maps.LocationRect.fromLocations(pushpin.getLocation()));
                        }
                    }

                    editingFormElements = helper.createLocationEditor({
                        location: location,
                        index: locations.indexOf(location),
                        cancelClick: function () {
                            commonCreateLocationItem(options).insertAfter($('.locationEditingContainer'));
                            //editingFormElements.container.after(container);
                            //editingFormElements.container.remove();
                            //pushpin = helper.drawPushpin({
                            //    location: location,
                            //    mapdoq: mapDoqs[location.map],
                            //    editing: false
                            //});
                        }
                    });
                    container.after(editingFormElements.container);
                    container.detach();
                    helper.removePushpin({
                        pushpin: pushpin,
                        mapguid: location.map
                    });
                    (!custom) && map.entities.get(map.entities.getLength() - 1).setOptions({ icon: tagPath+'images/icons/locationPin2.svg' }); //set the last pushpin to red

                    //scroll to the correct position
                    locationsRegion.scrollTop(0);
                    locationsRegion.scrollTop(editingFormElements.container.position().top + 20);
                }
            });
        }

        titleContainer.css({
            display: 'inline-block',
            margin: '0px 10px 0px 10px',
            position: 'relative',
            'vertical-align': 'middle',
            'max-font-size': '24px',
            'min-font-size' : "12px",
            "font-size": root.height()/40
        });
        titleContainer.text((location.title ? location.title + (location.date ? ',' : '') : (location.date ? '' : '(Untitled Location)')));
        (!location.title && titleContainer.css({margin:'0px 0px 0px 10px'}));

        dateContainer.css({
            display: 'inline-block',
            margin: '0px 0px 0px 0px',
            position: 'relative',
            'vertical-align': 'middle',
            'max-font-size': '24px',
            'min-font-size' : "12px",
            "font-size": root.height()/40
        });
        dateContainer.text(location.date || '');

        descContainer.css({
            display: 'none',
            margin: '0px 0px 0px 80px',
            position: 'relative',
            'vertical-align': 'middle',
            'max-font-size': '24px',
            'min-font-size' : "12px",
            "font-size": root.height()/50,
            'padding-right': '20px',
            'font-style': 'italic'
        });

        if (!input.authoring) {
            descContainer.css({ margin: '0px 0px 0px 10px' });
        }

        descContainer.text(location.description || '');
        if (descContainer.text() === '') { //don't put padding if it's empty, so that clicking on it won't change the height
            descContainer.css('padding-bottom', '0px');
        } else {
            descContainer.css('padding-bottom', '10px');
        }

        if (input.authoring) {
            container.append(deleteButton);
            container.append(editButton);
        }

        container.append(titleContainer);
        container.append(dateContainer);
        container.append(descContainer);

        locationsRegion.append(container);

        return container;
    }

    /**
     * Common functionality for creating location editor UIs. This is here because a lot
     * of code would be copied between the BingMapHelper and CustomMapHelper otherwise. Some
     * functionality is specific to one or the other, though, so that's taken care of in their
     * respective createLocationEditor methods using the returned components here.
     * @method commonCreateLocationEditor
     * @param {Object} options       some input options
     *          {Object} location       the location in question
     *          {Boolean} custom        whether this is a custom map
     *          {String} mapguid        the guid of the map in question
     *          {Number} index          index of loaaction in location list
     *          {Function} cancelClick  cancel button click event
     * @return {Object}              the relevant components of the editing form
     */
    function commonCreateLocationEditor(options) {
        options = options || {}; // cut down on null checks later

        //'de-select' any previous locations from the list (only want one red pin at a time)
        $('.locationItemContainer').css('background-color', 'rgba(0,0,0,0)');
        $('.locationItemDesc').css({ 'display': 'none' });
        $('.locationPushpin').attr('src', tagPath+'images/icons/locationPin.svg');
        for (var l = 0; l < map.entities.getLength() ; l++) { //iterates through all of the bing map pushpins
            map.entities.get(l).setOptions({ icon: tagPath+'images/icons/locationPin.svg' });
        }

        var container = $(document.createElement('div')).addClass('locationEditingContainer'),

            titleContainer = $(document.createElement('div')).addClass('locationOptionsContainer'),
            titleInput = $(document.createElement('input')).addClass('locationTitleInput'),

            titleLabel = $(document.createElement('div')).addClass('locationLabel').text('Location Title'),

            dateContainer = $(document.createElement('div')).addClass('locationOptionsContainer'),
            dateInput = $(document.createElement('input')).addClass('locationDateInput'),
            dateLabel = $(document.createElement('div')).addClass('locationLabel').text('Date'),

            descContainer = $(document.createElement('div')).addClass('locationOptionsContainer'),
            descInput = $(document.createElement('textarea')).addClass('locationDescInput'),
            descLabel = $(document.createElement('div')).addClass('locationLabel').text('Description'),

            bottomButtonsContainer = $(document.createElement('div')).addClass('locationOptionsContainer'),
            saveButton = $(document.createElement('button')).addClass('locationSaveButton'),
            deleteButton = $(document.createElement('button')).addClass('locationDeleteButton'),
            cancelButton = $(document.createElement('button')).addClass('locationCancelButton'),

            searchButton,
            resultsDiv,
            location = options.location,
            index = options.index,
            custom = options.custom,
            mapguid = options.mapguid,
            helper = custom ? customMapHelper : bingMapHelper,
            pushpin,
            cancelClick = function () {
                formIsEnabled = false;
                options.cancelClick && options.cancelClick();
                removeLocationForm();
                helper.removePushpin({
                    pushpin: pushpin,
                    mapguid: mapguid
                });
            };
        /*titleInput.on('keyup', function () {
            var txt = (titleInput && titleInput[0] && titleInput[0].value) ? titleInput[0].value.replace(/[^àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\w\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') : "";
            if (titleInput && titleInput[0] && titleInput[0].value && titleInput[0].value != txt) {
                titleInput[0].value = txt;
            }
        });

        dateInput.on('keyup', function () {
            var txt = (dateInput && dateInput[0] && dateInput[0].value) ? dateInput[0].value.replace(/[^àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\w\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') : "";
            if (dateInput && dateInput[0] && dateInput[0].value && dateInput[0].value != txt) {
                dateInput[0].value = txt;
            }
        });

        descInput.on('keyup', function () {
            var txt = (descInput && descInput[0] && descInput[0].value) ? descInput[0].value.replace(/[^àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\w\s~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '') : "";
            if (descInput && descInput[0] && descInput[0].value && descInput[0].value != txt) {
                descInput[0].value = txt;
            }
        });*/

        if (!custom) {
            if (!location || index < 0 || index >= locations.length) {
                var bounds = map.getBounds();
                var centerCoord = map.getCenter();
                location = {
                    latitude: centerCoord.latitude + (.01 * (bounds.getSouth() - bounds.getNorth())), //1% offset from center is to prevent the new pin from directly 
                    longitude: centerCoord.longitude + (.01 * (bounds.getEast() - bounds.getWest())) //overlapping one that may have been previously selected
                };
                index = locations.length;
            }
        } else {
            if (!location || index < 0 || index >= locations.length) {
                var startLocation = annotImgs[mapguid].createStartingPoint(); //uses the same 1% offset
                location = {
                    x: startLocation.x,
                    y: startLocation.y
                }
                index = locations.length;
            }
        }

        pushpin = helper.drawPushpin({
            location: location,
            mapdoq: mapDoqs[mapguid],
            editing: true
        });

        if (custom) {
            pushpin.attr('src', tagPath+'images/icons/locationPin2.svg');
        } else {
            pushpin.setOptions({ icon: tagPath+'images/icons/locationPin2.svg' });
        }

        container.css({
            'width': '100%',
            'position': 'relative',
            'overflow': 'auto',
            'padding': '0px 4% 0px 0px',
            'margin-bottom': '4%',
            'margin-top': '2%'
        });

        titleLabel.css({
            'width': '20%',
            'display': 'inline-block',
            'vertical-align': 'top',
            'text-align': 'right'
        });

        dateLabel.css({
            'width': '20%',
            'display': 'inline-block',
            'vertical-align': 'top',
            'text-align': 'right'
        });

        descLabel.css({
            'width': '20%',
            'display': 'inline-block',
            'vertical-align': 'top',
            'text-align': 'right'
        });

        titleContainer.css({
            'margin-bottom': '2%'
        });

        dateContainer.css({
            'margin-bottom': '2%'
        });

        descContainer.css({
            'margin-bottom': '2%'
        });


        titleInput.css({
            position: 'relative',
            width: '52%',
            left: '2%',
            display: 'inline-block'
        });
        titleInput.attr({
            placeholder: ' Title',
            value: location.title ? location.title : ''
        });

        if (!custom) {

            titleInput.css({ width: '42%' });

            searchButton = $(document.createElement('button')).addClass('locationEditorSearchButton').css('border-radius', '3.5px');
            searchButton.attr({
                type: 'button'
            });
            searchButton.text('Search');
            searchButton.css({ 'display': 'inline-block', 'margin-left':'3.5%'});

            resultsDiv = $(document.createElement('div')).addClass('locationEditorSearchResults');
            resultsDiv.css({
                left: '22%',
                'max-height': '200px',
                'overflow-x': 'hidden',
                'overflow-y': 'auto',
                position: 'relative',
                width: '52.5%'
            });
        }

        titleInput.on('keydown', function (event) {
            event.stopPropagation();
            if (event.which === 13 && searchButton) {
                event.preventDefault();
                searchButton.click();
            }
        });

        dateInput.css({
            position: 'relative',
            width: '52%',
            left: '2%',
            display: 'inline-block'
        });
        dateInput.attr({
            placeholder: ' Date',
            value: location.date ? location.date : ''
        });

        descInput.css({
            position: 'relative',
            width: '49.75%',
            left: '2%',
            display: 'inline-block'
        });
        descInput.attr({
            placeholder: ' Description',
            rows: '3',
            value: location.description ? location.description : ''
        });

        bottomButtonsContainer.css({
            'display': 'inline-block',
            position: 'relative',
            left: '22%',
            width: '70%'
        });

        saveButton.css({
            position: 'relative',
            'margin-right': '2%'
        }).css('border-radius', '3.5px');
        saveButton.text('Save Location');
        saveButton.on('click', function () {

            // TODO only replace the relevant list item rather than recreating whole list
            var pushpinLocation,
                newLoc,
                currInd = currentIndex;

            if (custom) {
                pushpinLocation = annotImgs[mapGuids[currInd]].getOverlayCoordinates(pushpin[0]);
                newLoc = {
                    map: mapGuids[currInd],
                    title: titleInput.val(),
                    date: dateInput.val(),
                    description: descInput.val(),
                    x: pushpinLocation.x,
                    y: pushpinLocation.y
                };
            } else {
                pushpinLocation = pushpin.getLocation();
                newLoc = {
                    map: null,
                    title: titleInput.val(),
                    date: dateInput.val(),
                    description: descInput.val(),
                    latitude: pushpinLocation.latitude,
                    longitude: pushpinLocation.longitude
                };
            }
            if (index >= 0 && index < locations.length) {
                locations[index] = newLoc;
            } else {
                locations.push(newLoc);
            }

            saveRichLocationHistory({
                callback: function () {
                    showMap(mapGuids[currInd]);
                }
            });
            formIsEnabled = false;
        });

        if (location) {
            deleteButton.css({
                position: 'relative',
                'margin-right': '2%'
            });
            deleteButton.text('Delete').css('border-radius', '3.5px');
            deleteButton.on('click', function (evt) {
                formIsEnabled = false;
                var overlay = TAG.Util.UI.PopUpConfirmation(function () {
                    index = locations.indexOf(location);
                    if (index >= 0 && index < locations.length) {
                        locations.splice(index, 1);
                    }
                    saveRichLocationHistory();
                }, "Are you sure you want to delete this location?", "Yes");
                root.append(overlay);
                $(overlay).show();
                evt.stopPropagation();
            });
        }

        cancelButton.css({
            position: 'relative',
            'margin-right': '2%'
        });
        cancelButton.text('Cancel').css('border-radius', '3.5px');
        cancelButton.on('click', cancelClick);

        titleContainer.append(titleLabel);
        titleContainer.append(titleInput);
        container.append(titleContainer);
        if (!custom) {
            titleContainer.append(searchButton);
            container.append(resultsDiv);
        }

        dateContainer.append(dateLabel);
        dateContainer.append(dateInput);
        container.append(dateContainer);

        descContainer.append(descLabel);
        descContainer.append(descInput);
        container.append(descContainer);

        bottomButtonsContainer.append(saveButton);
        if (isEditForm) { //new added locations should not have a delete button
            (location && bottomButtonsContainer.append(deleteButton));
            isEditForm = false;
        }
        bottomButtonsContainer.append(cancelButton);
        container.append(bottomButtonsContainer);

        if (custom) {
            return {
                container: container
            };
        }
        return {
            container: container,
            titleInput: titleInput,
            searchButton: searchButton,
            resultsDiv: resultsDiv,
            pushpin: pushpin
        };
    }

    /**
     * Saves latest rich location history data to the artwork doq. Uses the maps and
     * locations variables, so make sure those are up to date before calling. Reloads
     * all maps afterwards.
     * @method saveRichLocationHistory
     * @param {Object} input       some input options, including:
     *              toadd          a string of comma-separated GUIDs of maps to add
     *              toremove       a string of comma-separated GUIDs of maps to remove
     *              noReload       a boolean telling us whether to reload maps or not
     *              callback       a callback function to be called after saving and reloading artwork is done
     */
    function saveRichLocationHistory(input) {

        if ($('.locationTitleInput').is(':focus')) {
            return;
        }

        disableButtons();

        var options = {
            RichLocationHistory: generateRichLocationData()
        };

        input = input || {}; // cut down on null checks later

        if (input.toadd) {
            options.AddMaps = input.toadd;
        }

        if (input.toremove) {
            options.RemoveMaps = input.toremove;

        }

        !input.noReload && showLoadingMessage();
        TAG.Worktop.Database.changeArtwork(artwork.Identifier, options, success, error, error, error);

        function success() {
            TAG.Worktop.Database.getDoq(artwork.Identifier, function (newArtwork) {
                if (newArtwork.Metadata) {
                    artwork = newArtwork;
                }
                richLocationData = artwork.Metadata.RichLocationHistory ? JSON.parse(unescape(artwork.Metadata.RichLocationHistory)) : locationToRichLocation(artwork.Metadata.Location);
                locations = richLocationData.locations || [];
                !input.noReload && getMaps(input.callback);
                enableButtons();
                if (defaultMapShown) {
                    disabledOverlay.remove();
                } else {
                    disabledOverlay.text("Bing Map is disabled.");
                }
            }, error, error);
            //input.sort && input.callback();
        }

        function error() {
            console.log('An error occured while saving.');
            enableButtons();
            disabledOverlay.remove();
        }
    }

    /**
     * Generates a RichLocationHistory property (string) from the maps and locations
     * variables for saving. A helper function for saveRichLocationHistory.
     * @method generateRichLocationData
     * @return {String}              a string to be used as a RichLocationHistory property
     */
    function generateRichLocationData() {
        return JSON.stringify({
            defaultMapShown: defaultMapShown,
            locations: locations
        });
    }

    /**
     * Toggles the default map overlay to indicate that it is
     * enabled or disabled. Uses the value of defaultMapShown
     * to do so.
     * @method toggleDefaultMap
     */
    function toggleDefaultMap() {   
        defaultMapShown = !defaultMapShown;
        disabledOverlay.appendTo(mapHolders[null]);
        disabledOverlay.text("Loading...");
        deleteButton.text(defaultMapShown ? 'Hide Bing Map' : 'Show Bing Map');
    }

    /**
     * Delete the selected map, reload maps, set the current map to bing map (for now)
     * @method deleteMap
     */
    function deleteMap() {
        var mapguid = mapGuids[currentIndex],
            i,
            locs;
        if (mapguid) {
            removeLocations(mapguid);
            saveRichLocationHistory({
                toremove: mapguid
            });
        } else {
            toggleDefaultMap();
            saveRichLocationHistory({
                noReload: true
            });
        }
    }

    /**
     * Remove locations associated with a given map from artwork metadata
     * @method removeLocations
     * @param {String} guid       map guid
     */
    function removeLocations(guid) {
        var i;

        for (i = locations.length - 1; i >= 0; i--) {
            if (locations[i].map === guid) {
                locations.splice(i, 1);
            }
        }

        richLocationData = {
            defaultMapShown: defaultMapShown,
            locations: locations
        };
    }

    /**
     * Upload a custom map from user's computer
     * @method uploadCustomMap
     */
    function importMap() {
        formIsEnabled = false;
        importingMap = true;
        var fileArray,
            i;

        //webfileupload
        if (!IS_WINDOWS){
            console.log("maps");
        TAG.Authoring.WebFileUploader(
            root,
            TAG.Authoring.FileUploadTypes.Map, // TODO RLH TESTING: change this to TAG.Authoring.FileUploadTypes.Map to test map uploading
            function (files) {
                fileArray = files;
            },
            function (urls) {
                var newDoq
                if (!urls.length && urls.length !== 0) { // check to see whether a single file was returned
                    urls = [urls];
                }
                var newDoq;
                try {
                    newDoq = new Worktop.Doq(urls[0]);
                } catch (error) {
                    console.log("error in uploading: " + error.message);
                    return;
                }
                mapGuids.push(newDoq.Identifier);

                mapDoqs[newDoq.Identifier] = newDoq;
                //update changeartwork and linq the map and artwork

                importLoadingOverlay();

                saveRichLocationHistory({
                    toadd: newDoq.Identifier,
                });

                //reload (which will show the map that has just been imported)
                loadMaps();

                //TAG.Worktop.Database.changeArtwork(artwork.Identifier, {AddMaps:JSON.stringify(maps)});
                // TODO this is just in here for testing purposes
                //TAG.Worktop.Database.changeMap(newDoq.Identifier, { Name: "Custom Map", Description: "Test description", AdditionalInfo: "Middle Pharaoh Period" }, function () {
                //    console.log('success in changeMap');
                //}, function () { }, function () { }, function () { }); // TODO RLH TESTING: make sure map doq is updated properly (the next time it's loaded, it should have these metadata)
            },
            ['.jpg', '.png', '.gif'],//, '.tif', '.tiff' these two crashes visual studio every time we click on the dot to show map. haven't found why though
            false,
            function () {
                root.append(TAG.Util.UI.popUpMessage(null, "There was an error uploading the file.  Please try again later."));
            },
            false // batch upload disabled for now
        );
        } else {

        TAG.Authoring.FileUploader(
            root,
            TAG.Authoring.FileUploadTypes.Map, // TODO RLH TESTING: change this to TAG.Authoring.FileUploadTypes.Map to test map uploading
            function (files) {
                fileArray = files;
            },
            function (urls) {
                var newDoq
                if (!urls.length && urls.length !== 0) { // check to see whether a single file was returned
                    urls = [urls];
                }
                var newDoq;
                try {
                    newDoq = new Worktop.Doq(urls[0]);
                } catch (error) {
                    console.log("error in uploading: " + error.message);
                    return;
                }
                mapGuids.push(newDoq.Identifier);

                mapDoqs[newDoq.Identifier] = newDoq;
                //update changeartwork and linq the map and artwork

                importLoadingOverlay();

                saveRichLocationHistory({
                    toadd: newDoq.Identifier,
                });

                //reload (which will show the map that has just been imported)
                loadMaps();

                //TAG.Worktop.Database.changeArtwork(artwork.Identifier, {AddMaps:JSON.stringify(maps)});
                // TODO this is just in here for testing purposes
                //TAG.Worktop.Database.changeMap(newDoq.Identifier, { Name: "Custom Map", Description: "Test description", AdditionalInfo: "Middle Pharaoh Period" }, function () {
                //    console.log('success in changeMap');
                //}, function () { }, function () { }, function () { }); // TODO RLH TESTING: make sure map doq is updated properly (the next time it's loaded, it should have these metadata)
            },
            ['.jpg', '.png', '.gif'],//, '.tif', '.tiff' these two crashes visual studio every time we click on the dot to show map. haven't found why though
            false,
            function () {
                root.append(TAG.Util.UI.popUpMessage(null, "There was an error uploading the file.  Please try again later."));
            },
            false // batch upload disabled for now
        );
        }

    }

    /**
    * Append a loading message over the map region to indicate loading while a map is being uploaded
    * @method importLoadingOverlay()
    */
    function importLoadingOverlay() {
        locationPanel.append(importDisabledOverlay);
    }

    /**
    * Remove the loading message over the map region to indicate loading while a map is being uploaded
    * @method removeLoadingOverlay()
    */
    function removeLoadingOverlay() {
        importDisabledOverlay.remove();
    }

    
    /**
     * De-select a location pin and the corresponding location list item
     * @method deselect
     */
    function deselect(location, pushpin, custom) {
        location.descContainer.css({ 'display': 'none' });
        $('.locationItemContainer').css('background-color', 'rgba(0,0,0,0)');
        if (!custom) {
            pushpin.setOptions({ icon: tagPath+'images/icons/locationPin.svg' });
        } else {
            $('.locationPushpin').attr('src', tagPath+'images/icons/locationPin.svg');
        }
    }

    /**
     * Select a location pin and the corresponding location list item
     * @method select
     */
    function select(location, pushpin, custom) {
        var l;

        //if not previously selected - expand the correct description
        $('.locationItemDesc').css({ 'display': 'none' });
        location.descContainer.css({ 'display': 'block' });
        $('.locationItemContainer').css('background-color', 'rgba(0,0,0,0)');
        pushpin.container.css('background-color', 'rgba(255,255,255,0.2)');

        //reset all pushpins here to the green icon
        $('.locationPushpin').attr('src', tagPath+'images/icons/locationPin.svg');
        if (input.authoring || defaultMapShown) { //can't access map if in art mode and bing map is not shown
            for (l = 0; l < map.entities.getLength() ; l++) { //iterates through all of the bing map pushpins
                map.entities.get(l).setOptions({ icon: tagPath+'images/icons/locationPin.svg' });
            }
        }

        if (!custom) {
            //make the right pushpin red
            pushpin.setOptions({ icon: tagPath+'images/icons/locationPin2.svg' });
        } else {
            //make the right pushpin red
            pushpin && pushpin.attr('src', tagPath+'images/icons/locationPin2.svg');
        }
    };

    /**
    * Disables the buttons below the map.  Used when saving is in progress.
    * @method disableButtons()
    */

    function disableButtons() {
        buttonsRegionDisabled.css({ display: 'block' });

        $('#locationHistoryAddLocationButton').disabled = true;
        $('#locationHistoryAddLocationButton').css({'color': 'rgba(255, 255, 255, 0.5)'});

        $('#locationHistorySortLocationsByTitleButton').disabled = true;
        $('#locationHistorySortLocationsByTitleButton').css({'color': 'rgba(255, 255, 255, 0.5)'});

        $('#locationHistorySortLocationsByDateButton').disabled = true;
        $('#locationHistorySortLocationsByDateButton').css({'color': 'rgba(255, 255, 255, 0.5)'});

        $('#locationHistoryImportMapButton').disabled = true;
        $('#locationHistoryImportMapButton').css({ 'color': 'rgba(255, 255, 255, 0.5)' });

        $('#locationHistoryDeleteButton').disabled = true;
        $('#locationHistoryDeleteButton').css({ 'color': 'rgba(255, 255, 255, 0.5)' });
    }

    /**
    * Re-enables the buttons below the map.  Called when saving is complete.
    * @method enableButtons()
    */

    function enableButtons() {
        
        buttonsRegionDisabled.css({ display: 'none' });

        $('#locationHistoryAddLocationButton').disabled = false;
        $('#locationHistoryAddLocationButton').css({'color': 'rgba(255, 255, 255, 1.0)'});

        $('#locationHistorySortLocationsByTitleButton').disabled = false;
        $('#locationHistorySortLocationsByTitleButton').css({'color': 'rgba(255, 255, 255, 1.0)'});

        $('#locationHistorySortLocationsByDateButton').disabled = false;
        $('#locationHistorySortLocationsByDateButton').css({'color': 'rgba(255, 255, 255, 1.0)'});

        $('#locationHistoryImportMapButton').disabled = false;
        $('#locationHistoryImportMapButton').css({ 'color': 'rgba(255, 255, 255, 1.0)' });

        $('#locationHistoryDeleteButton').disabled = false;
        $('#locationHistoryDeleteButton').css({ 'color': 'rgba(255, 255, 255, 1.0)' });
    }


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
}


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
     *            title         title of the button, shown above the thumbnail
     *            year          year of the media, shown below the thumbnail
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
            year        = options.year,
            handler     = options.handler,
            buttonClass = options.buttonClass,
            buttonID    = options.buttonID,
            src         = options.src,
            width       = options.width,
            height      = options.height || 0.18 * $('#tagRoot').height() + 'px',
            holder               = $(document.createElement('div')).addClass('thumbnailButton'),
            thumbHolderDiv       = $(document.createElement('div')).addClass('thumbnailHolderDiv'),
            holderContainer      = $(document.createElement('div')).addClass('thumbnailButtonContainer'),
            holderInnerContainer = $(document.createElement('div')).addClass('thumbnailButtonInnerContainer'),
            thumbnailImage       = $(document.createElement('img')).addClass('thumbnailButtonImage'),
            titleDiv = $(document.createElement('div')).addClass('thumbnailButtonTitle'),
            yearDiv = $(document.createElement('div')).addClass('thumbnailButtonYear');



        /********************************************\

        ----------------------------------------------      <--- holder
        | ------------------------------------------ |     
        | |              NAME OF DOQ               | <--- titleDiv
        | |                                        | |
        | ------------------------------------------ |
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
        | |                 YEAR                   | <--- yearDiv
        | |                                        | |
        | ------------------------------------------ |
        ----------------------------------------------

        \********************************************/
        
        buttonClass && holder.addClass(buttonClass);
        holder.css('height', height);
        buttonID && holder.attr('id', buttonID);

        holder.on("click", handler);

        titleDiv.text(title);
        holder.append(titleDiv);
        holder.append(thumbHolderDiv);
        thumbHolderDiv.append(holderContainer);
        holderContainer.append(holderInnerContainer);

        thumbnailImage.attr('src', src);

        thumbnailImage.removeAttr('width');
        thumbnailImage.removeAttr('height');

        if (buttonClass && buttonClass === 'assetHolder') { //Artwork Editor TODO J/S
            holder.css({
                //border: '1px solid rgba(255,255,255,0.4)',
            });
            titleDiv.css({
                margin: '1% 2% 0% 2%',
                top: '80%',
                height: '20%',
                'white-space': 'nowrap',
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
                'text-align': 'center',
                'font-size': '75%',
                padding: '0% 3% 0% 3%'
            });
            thumbHolderDiv.css({
                height: '70%',
                position: 'relative',
                width: '92%',
                margin: '-2% 4% 4% 4%',
                display: 'block',
            });
            holderContainer.css({
                display: 'block',
                position: 'relative',
                width: '100%',
                height: '100%',
                'margin-top': '5%',
            });
            holderInnerContainer.css({
                display: 'block',
                'height': '100%',
                'width': '100%',
                'vertical-align': 'middle',
                'text-align': 'center',
                'position': 'relative',
                'top':'0%',
                'left':'0%',
            });
            if (src.indexOf('svg') > -1) {
                thumbnailImage.css({
                    bottom: '0px',
                    display: 'block',
                    height: '100%',
                    left: '0px',
                    'margin-bottom': 'auto',
                    'margin-left': 'auto',
                    'margin-right': 'auto',
                    'margin-top': 'auto',
                    'max-height': '100%',
                    'max-width': '100%',
                    position: 'absolute',
                    right: '0px',
                    top: '0px',
                    width: 'auto',
                });
            } else {
                thumbnailImage.css({
                    bottom: '0px',
                    display: 'block',
                    height: 'auto',
                    left: '0px',
                    'margin-bottom': 'auto',
                    'margin-left': 'auto',
                    'margin-right': 'auto',
                    'margin-top': 'auto',
                    'max-height': '100%',
                    'max-width': '100%',
                    position: 'absolute',
                    right: '0px',
                    top: '0px',
                    width: 'auto',
                });
            }
        } else {
            thumbnailImage.css({
                bottom: '0px',
                height: 'auto',
                left: '0px',
                'margin-bottom': 'auto',
                'margin-left': 'auto',
                'margin-right': 'auto',
                'margin-top': 'auto',
                'max-height': '100%',
                'max-width': '100%',
                position: 'absolute',
                right: '0px',
                top: '0px',
                width: 'auto',
            });
        }

        holderInnerContainer.append(thumbnailImage);

        yearDiv.text(year);
        holder.append(yearDiv);

        return holder;
    }
})();

////////////////////////////////////////////////////////////////////////////////////
//				ITE PARSING
////////////////////////////////////////////////////////////////////////////////////
/*	TEMPLATE FOR TOUR DATASTRUCTURE: {
*
*		guid: guid
*		timestamp: time
*		totalDuration: duration
*		tourTitle: title
*		tracks:[], an array of tracks (see below for structure)
*}
*
*	TEMPLATE FOR TRACK DATASTRUCTURE: {
*
*	name: name of track,
*	assetURL: url of where track resources are stored to be loaded. Inks DO NOT have asset URLs
*	providerID: image, video, audio, deepZoom, or ink
*	zIndex: zIndex for proper layering
*	keyframes: an array of all keyframes. The specific properties depend on the track type, and are as follows:
*
*		IMAGE:
*			dispNum: display number
*			time: time
*			opacity: opacity
*			pos{x, y}: position in x, y
*			size{x, y}: size
*
*		DEEPZOOM:
*			dispNum: display number
*			time: time
*			opacity: opacity
*			pos{x, y}: position in x, y
*			scale: scale
*
*		AUDIO:
*			dispNum: display number
*			time: time
*			audioOffset: offset from beginning of audio track itsself
*			volume: volume
*
*		VIDEO:
*			dispNum: display number
*			time: time
*			opacity: opacity
*			pos{x, y}: position in x, y
*			size{x, y}: size	
*			volume: volume
*			videoOffset: offset from the beginning of the video itsself
*			
*		INKS: TBD depending on implementation
*	}
*
*/

//Utilities for RIN parsing
TAG.Util.RIN_TO_ITE = function (tour) {

	console.log(">>>>>>>>>>>>> Starting ITE Parsing >>>>>>>>>>>>>");

	if (!tour){
		return {};
	}
    
	var rinData;
	if (!tour.Metadata) {
	    rinData = tour;
	} else {
	    rinData = JSON.parse(unescape(tour.Metadata.Content)); //the original RIN tour obj
	    console.log("rin data: ")
	    console.log(rinData)
	}

	//parses the referenceData to be used for the keyframes
	//Object with the names of all of the *experience streams* as keys
	var referenceDataMap;

	if (!(rinData.screenplays && 
		rinData.screenplays.SCP1 && 
		rinData.screenplays.SCP1.data && 
		rinData.screenplays.SCP1.data.experienceStreamReferences)) {
			console.log("ERROR: no data for experience stream time offsets");
			referenceDataMap = {};
	} else {
		referenceDataMap = function(){
			var data = {};
			$.each(rinData.screenplays.SCP1.data.experienceStreamReferences, 
				function(key, value) {
					data[value.experienceStreamId] = value
				}
			);
			return data;
		}();
	}

	// console.log("REFERENCE DATA")
	// console.log(referenceDataMap)
		
	//parses keyframes from a RIN experience track
	var ITE_keyframes = function(track, providerID){
		var keyframes = []; //all of the keyframes for the entire track
		var experienceStreamKeys = Object.keys(track.experienceStreams).sort(); //TODO test if the ordering of experience streams is preserved - I don't think it is

		/*  RIN has multiple experience streams (each with its own keyframes) per track.
			ITE gets rid of the middle layer and only has one set of keyframes per track. 
			The keyframes are parsed from one experience stream at a time, then the initial
			and final keyframes are added, and then these keyframes are added to the final 
			keyframes array */

		var k=0;
		for (k=0; k<experienceStreamKeys.length; k++){
			var currKeyframes = []; //the keyframes for the current experience stream
			var currKey = experienceStreamKeys[k];
			var currExperienceStream = track.experienceStreams[currKey]; //the current experience stream
			if (!currExperienceStream.keyframes){
				continue;
			}

			//parses time offset of current experience stream from a different section of the RIN metadata

			var referenceData = referenceDataMap[currKey];
			if (!referenceData) {
				console.log("ERROR: no data for experience stream time offsets")
			}
			var time_offset = referenceData.begin;
			var l = 0;
			if (providerID == "video") {
			    
			}
			for (l=0; l<currExperienceStream.keyframes.length; l++) {
				var currKeyframe = currExperienceStream.keyframes[l]
				var keyframeObject = {}; //represents one keyframe

				//quick check to make sure that we're not adding keyframes after the track should be offscreen 
				if(currKeyframe.offset > currExperienceStream.duration){
					currKeyframe.offset = currExperienceStream.duration
				}
				
				if (providerID == "image"){
					keyframeObject = {
						"dispNum": k,
						"zIndex": track.data.zIndex,
						"time": time_offset + currKeyframe.offset,
						"opacity": 1, 
						"size": {
							"x": currKeyframe.state.viewport.region.span.x * $('#tagRoot').width(),
							"y": currKeyframe.state.viewport.region.span.y * $('#tagRoot').height()
						},
						"pos": {
							"x": currKeyframe.state.viewport.region.center.x * $('#tagRoot').width(),
							"y": currKeyframe.state.viewport.region.center.y * $('#tagRoot').height()
						},
						"data": {}
					}
				}
				else if (providerID == "deepZoom"){
					keyframeObject = {
						"dispNum": k,
						"zIndex": track.data.zIndex,
						"time": time_offset + currKeyframe.offset,
						"opacity": 1, 
						"scale": currKeyframe.state.viewport.region.span.x, //TODO
						"pos": {
							"x": currKeyframe.state.viewport.region.center.x,
							"y": currKeyframe.state.viewport.region.center.y
						},
						"data": {}
					}
				}
				else if (providerID == "audio"){
					keyframeObject = {
						"dispNum": k,
						"time": time_offset + currKeyframe.offset,
						"volume": currKeyframe.state.sound.volume,
						"data": {},
						"audioOffset": null, //TODO
						"audioKeyframeType" : "INITIAL"
					}
				}
				else if (providerID == "video"){
					keyframeObject = { //TODO
						"dispNum": k,
						"zIndex": track.data.zIndex,
						"time": time_offset + currKeyframe.offset,
						"opacity": 1,
                        "size": {
                            "x": $('#tagRoot').width(),//currKeyframe.state.viewport.region.span.x * $('#tagRoot').width(),
                            "y": currKeyframe.state.viewport.region.span.y * $('#tagRoot').height()
                        },
                        "pos": {
                            "x": 0,//currKeyframe.state.viewport.region.center.x * $('#tagRoot').width(),
                            "y": currKeyframe.state.viewport.region.center.y * $('#tagRoot').height()
                        },
						"data": {},
						"volume": currKeyframe.state.sound.volume,
						"videoOffset": 0
					}
				}
				
				/* Ink tracks parsed separately in the ITE_parseInkKeyframes function below */

				currKeyframes.push(keyframeObject);

				//Backwards compatability for old RIN tours that stored audio as a single keyframe with a specific duration
				if ((providerID == "audio") && (experienceStreamKeys.length == 1)){
					currKeyframes.push({
						"dispNum": k,
						"time": time_offset + currKeyframe.offset + currExperienceStream.duration,
						"volume": currKeyframe.state.sound.volume,
						"data": {},
						"audioOffset": null, //TODO
						"audioKeyframeType": "FINAL"
					});

					//TODO - this is a really really janky fix for the audio problem
					currKeyframes.push({
					    "dispNum": k,
					    "time": time_offset + currKeyframe.offset + currExperienceStream.duration + .01,
					    "volume": 0,
					    "data": {},
					    "audioOffset": null, //TODO
					    "audioKeyframeType": "FINAL"
					});
				}
			}

			//Adds a final keyframe using the duration of time for the experience stream, this is so items 
			//don't prematurely disappear from the screen.  note - this is before the fade in/out keyframes are added.
			//audio and video don't need this
			if (providerID != "audio" && providerID != "video"){
				var endKeyframe = $.extend({}, currKeyframes[currKeyframes.length - 1]);
				endKeyframe.time = currKeyframes[0].time + currExperienceStream.duration
				endKeyframe.SpecialKeyframeType = "HOLDING FOR DURATION" //for testing
				currKeyframes.push(endKeyframe)
			}

			/*  This section deals with adding initial and final keyframes for the fade in and fade out.
				Note - each experience stream in the RIN object needs its own fade in and fade out. */

			//if the RIN object has transition data for the current experience stream
			if (currExperienceStream.data['transition']){

				var fadeInDuration = currExperienceStream.data.transition.inDuration,
					fadeOutDuration = currExperienceStream.data.transition.outDuration

				//assert that the duration of the asset is longer than RIN's inDuration + outDuration
				if (track.data.duration < fadeInDuration + fadeOutDuration){
					console.log("ERROR: track duration shorter than fadein/fadeout duration")
				}

				//each provider has this - the opacity is zero, and the time is -inDuration and +outDuration
				var initialKeyframe = ITE_createTransitionKeyframe({
						"keyframes" : currKeyframes, 
						"providerID" : providerID, 
						"ktype" : "initial", 
						"duration" : fadeInDuration 
					}),
					finalKeyframe = ITE_createTransitionKeyframe({
						"keyframes" : currKeyframes, 
						"providerID" : providerID, 
						"ktype" : "final",
						"duration" : fadeOutDuration
					})

				//merges them into the array
				currKeyframes.push(finalKeyframe)
				currKeyframes.unshift(initialKeyframe)

			} else {
				console.log("ERROR: " + providerID + " track has no transition data available.")
			}

			//at the end - merges onto the end of the total keyframes array, preserving ordering of experience streams
			keyframes = keyframes.concat(currKeyframes)

		}

		return keyframes
	}

	/* parses and returns keyframes for an ink track
		args:
			track: 		the ink track to be parsed
	*/
	var ITE_parseInkKeyframes = function(args){

		/* IMPORTANT: for now, I am assuming that each ink track will have 4 keyframes:

			1.  The start of the fadeIn (the start time - the fade in time)
			2.  The start of the ink annotation (the start time)
			3.  The end of the ink annotation (the start time + the duration)
			4.  The end of the fadeOut (the start time + the duration + the fade out time)
	
			Emily - does this seem good?

			Also - I'm assuming that each ink track in RIN only has one experience stream

		*/

		var track = args.track,
			keyframes = [],
			referenceData,
			timeOffset = 0,
			duration = 0,
			fadeInDurationInk = 0,
			fadeOutDurationInk = 0;

		referenceData = referenceDataMap[Object.keys(track.experienceStreams)[0]];
		if (!referenceData) {
			//this shouldn't ever happen - but why is it?
			console.log("An error occurred retrieving the reference data for: " + track)
		} else {
			timeOffset = referenceData.begin,
			duration = referenceData.duration;
		}

		if (Object.keys(track.experienceStreams).length > 0) {
			fadeInDurationInk = track.experienceStreams[Object.keys(track.experienceStreams)[0]].data.transition.inDuration,
			fadeOutDurationInk = track.experienceStreams[Object.keys(track.experienceStreams)[0]].data.transition.outDuration;
		}

		//this is where the four keyframes are actually parsed

		var keyframePrototype = {
			"type" : track.data.linkToExperience.embedding.experienceId == "" ? "unattached" : "attached", //TODO - is this what differentiates attached vs. unattached ?????
			"dispNum" : 1, //TODO - can this be hardcoded (are there ever multiple displays of inks)
			"initKeyframe" : track.data.linkToExperience.embedding.initKeyframe,
			"initproxy" : track.data.linkToExperience.embedding.initproxy,
		}

		//#1
		keyframes.push($.extend({}, keyframePrototype, {
			"time" : timeOffset - fadeInDurationInk,
			"opacity" : 0,
		}));

		//#2
		keyframes.push($.extend({}, keyframePrototype, {
			"time" : timeOffset,
			"opacity" : 1,
		}));

		//#3
		keyframes.push($.extend({}, keyframePrototype, {
			"time" : timeOffset + duration,
			"opacity" : 1,
		}));

		//#4
		keyframes.push($.extend({}, keyframePrototype, {
			"time" : timeOffset + duration + fadeOutDurationInk,
			"opacity" : 0,
		}));

		return keyframes
	}

	/** stolen from tagInk.js
	 * Takes in a datastring and parses for a certain attribute by splitting at "[" and "]" (these surround
	 * attribute names).
	 * NOTE if errors are coming from this function, could be that the datastring is empty...
	 * @param str        the datastring
	 * @param attr       the attribute we'll parse for
	 * @param parsetype  'i' (int), 's' (string), or 'f' (float)
	 * @return  the value of the attribute in the correct format
	 */
	var ITE_get_attr = function(str, attr, parsetype) {
		//checks if not in string to begin with
		if (str.indexOf("["+attr+"]") == -1){
			return parsetype == "s" ? null : 0
		}

		if (parsetype === "f") {
			return parseFloat(str.split("[" + attr + "]")[1].split("[")[0]);
		} else if (parsetype === "s") {
			return str.split("[" + attr + "]")[1].split("[")[0];
		} else {
			return parseInt(str.split("[" + attr + "]")[1].split("[")[0]);
		}
	}

	/* parses the datastring into an object for ink tracks
		args:
			datastring: 		the datastring to be parsed

		(refer to tagInk.js)
	*/
	var ITE_parseInkDatastring = function(args){
		var datastring = args.datastring,
			type,
			objects = [];

		if (!datastring){
			return objects
		}

		var inkObjects = datastring.split("|")
		$.each(inkObjects, function(inkObjectNum, inkObject) {
			if (inkObject && (inkObject != "")) {
				
				var type = inkObject.split("::")[0].toLowerCase(),
					currObj = {},
					willParsePathstring = false,
					propertiesToParse = {};

				switch (type) {
					case "text":
						// format: [str]<text>[font]<font>[fontsize]<fontsize>[color]<font color>[x]<x>[y]<y>[]
						propertiesToParse = 
						{
							"str" 		: "s",
							"font" 		: "s",
							"fontsize" 	: "s",
							"color" 	: "s",
							"x" 		: "f",
							"y" 		: "f",
							"w" 		: "f",
							"h" 		: "f"
						};
						break;
					case "path":
						// format: [pathstring]M284,193L284,193[stroke]000000[strokeo]1[strokew]10[]
						propertiesToParse = 
						{
							"pathstring": "s",
							"stroke"	: "s",
							"strokeo"	: "f",
							"strokew"	: "f",
						}
						willParsePathstring = true;
						break;
					case "bezier":
						// format: [pathstring]M284,193L284,193[stroke]000000[strokeo]1[strokew]10[]
						propertiesToParse = 
						{
							"pathstring": "s",
							"stroke"	: "s",
							"strokeo"	: "f",
							"strokew"	: "f",
						}
						willParsePathstring = true;
						break;
					case "trans":
						// format: [path]<path>[color]<color>[opac]<opac>[mode]<block or isolate>[]
						propertiesToParse = 
						{
							"path" 		: "s",
							"color" 	: "s",
							"opac" 		: "f",
							"mode" 		: "s"
						}
						break;
					case "boundrect":
						// format: BOUNDRECT::[x]<x>[y]<y>[w]<width>[h]<height>[fillc]<color>[fillo]<opac>[strokec]<color>[strokeo]<opac>[strokew]<width>[]
						propertiesToParse = 
						{
							"x" 		: "f",
							"y" 		: "f",
							"w" 		: "f",
							"h" 		: "f",
							"fillc" 	: "s",
							"fillo" 	: "f",
							"strokec" 	: "s",
							"strokeo" 	: "f",
							"strokew" 	: "f"
						}
						break;
					case "boundellipse":
						// format: BOUNDELLIPSE::[cx]<center x>[cy]<center y>[rx]<x radius>[ry]<y radius>[fillc]<color>[fillo]<opac>[strokec]<color>[strokeo]<opac>[strokew]<width>[]
						propertiesToParse = 
						{
							"cx" 		: "f",
							"cy" 		: "f",
							"rx" 		: "f",
							"ry" 		: "f",
							"fillc" 	: "s",
							"fillo" 	: "f",
							"strokec" 	: "s",
							"strokeo" 	: "f",
							"strokew" 	: "f"
						}
						break;
				}

				$.each(propertiesToParse, function(attrName, attrType){
					var parsedAttr = ITE_get_attr(inkObject, attrName, attrType)
					currObj[attrName] = parsedAttr
				});

				if (willParsePathstring) {
					currObj["path"] = ITE_parsePathstring(currObj.pathstring)
				}

				objects.push({
					"inkType" : type,
					"inkProperties" : currObj
				});
			}
		});
		return objects
	}

	/* parses and returns the path (for an ink) from the pathstring
		args:
			pathstring: 		a pathstring
	*/
	var ITE_parsePathstring = function(pathstring){
		var path = [],
		coords = pathstring.split(" ");

		$.each(coords, function(i, el){
			var coordstring;
			if (i == 0) {
				el = el.split(/[RML]/).filter(
					function(el){
						return el !== "";
					});
			}
			path = path.concat(function(){
				if (Object.prototype.toString.call(el) === '[object Array]'){
					var res = []
					for (i=0; i<el.length; i++){
						var xy = el[i].split(",");
						res.push({
							"x" : xy[0],
							"y" : xy[1]
						});
					}
					return res
				} else {
					var xy = el.split(",");
					return [{
						"x" : xy[0],
						"y" : xy[1]
					}];
				}
			}());
		});
		return path
	}

	/* creates final or initial keyframe for fade in and out
		args:
			keyframes:          array of keyframes
			providerID:         providerID of this track
			ktype:              "initial" or "final" specifying the type of keyframe
			duration:           duration (either fadeInDuration or fadeOutDuration)
	*/
	var ITE_createTransitionKeyframe = function(args){
		var keyframes   = args.keyframes,
			providerID  = args.providerID,
			ktype       = args.ktype,
			duration    = args.duration,
			transitionKeyframe = {}

		//possible error - no keyframes to begin with
		if (keyframes.length == 0) {
			return transitionKeyframe
		}

		//current first and last keyframes
		var firstKeyframe = keyframes[0],
			lastKeyframe = keyframes[keyframes.length - 1]

		//new one is the same as either the current first or last keyframe - except the time and the opacity
		if (ktype == "initial") {
			transitionKeyframe = $.extend({}, firstKeyframe); //need to make a copy of the first keyframe
			transitionKeyframe.time = transitionKeyframe.time - duration

			//TODO - is this a problem?
			if (transitionKeyframe.time < 0){
				// console.log("ERROR: initial keyframe with time < 0")
			}

			transitionKeyframe.opacity = 0
			transitionKeyframe['SpecialKeyframeType'] = "INITIAL" //for testing
		} else {
			transitionKeyframe = $.extend({}, lastKeyframe); //need to make a copy of the last keyframe
			transitionKeyframe.time = transitionKeyframe.time + duration
			transitionKeyframe.opacity = 0
			transitionKeyframe['SpecialKeyframeType'] = "FINAL" //for testing
		}

		return transitionKeyframe
	}

	//parses asset URL(s) from a RIN experience track
	var ITE_assetUrl = function(track){
		var urls = [];
		if (track.resourceReferences.length == 0){
			return urls;
		}
		var j = 0;
		for (j=0; j<track.resourceReferences.length; j++){
			urls.push(rinData.resources[track.resourceReferences[j].resourceId].uriReference);
		}

		var URL;
		//TO DO: figure out why url sometimes has server and sometimes not (?!)
		if (urls.toString().substring(0, 4) == "http"){//if first 4 letters are "http"; that is, if server name is being appended
			URL = urls;
		} else { //if server name is NOT already appended, append it.
			var serverURL = 'http://' + (localStorage.ip ? localStorage.ip + ':8086' : "browntagserver.com:8080");
			URL = serverURL + urls
		}
		return URL;
	}

	//returns a string of the providerID based on RIN's providerId's
	var ITE_providerID = function (RINid) {
		return {
			"ImageES" : "image", 
			"ZMES" : "deepZoom",
			"AES" : "audio",
			"InkES" : "ink",
			"VideoES" : "video" //TODO find out what this is
		}[RINid] || "";
	}

	//parses the tracks from the rinData object
	var ITE_tracks = function(){
		var tracks = [],
			rinDataExperiencesKeys = Object.keys(rinData.experiences);

		var i = 0;
		for (i=0; i < rinDataExperiencesKeys.length; i++){
			var currExperience = rinData.experiences[rinDataExperiencesKeys[i]],
				providerID = ITE_providerID(currExperience.providerId);

			//ignore experiences with no experience streams
			if (Object.keys(currExperience.experienceStreams).length == 0){
				console.log("Found an experience with no experience streams")
				continue;
			}

			//different structure for ink tracks vs. others
			if (providerID == "ink") {
				tracks.push({
					"name" : rinDataExperiencesKeys[i],
					"providerId" : providerID,
					"experienceReference" : currExperience.data.linkToExperience.embedding.experienceId, //TODO - check this
					"assetUrl" : "noAssetUrl"+i,
					"datastring" : currExperience.data.linkToExperience.embedding.element.datastring.str,
					"inkObjects" : ITE_parseInkDatastring({
						"datastring" : currExperience.data.linkToExperience.embedding.element.datastring.str
					}),
					"initKeyframe" : currExperience.data.linkToExperience.embedding.initKeyframe,
					"keyframes" : ITE_parseInkKeyframes({
						"track" : currExperience
					}),
					"zIndex" : currExperience.data.zIndex
				})
			}
			else if (providerID == "audio") {
			    tracks.push({
			        "name": rinDataExperiencesKeys[i],
			        "providerId": providerID,
			        "assetUrl": ITE_assetUrl(currExperience),
			        "mediaLength": currExperience.data.mediaLength,
			        "keyframes": ITE_keyframes(currExperience, providerID),
			        "zIndex": currExperience.data.zIndex
			    });
			}
			else if (providerID == 'video') {
			    keyFrames = [];
			    currExperienceStreamKey = Object.keys(currExperience.experienceStreams).sort()[0]
                currExperienceStream = currExperience.experienceStreams[currExperienceStreamKey]
			    console.log("Experience: ");
			    console.log(currExperience);
			    console.log(currExperienceStream);
			    /*
			    keyframeObject = {
			        "dispNum": k,
			        "zIndex": track.data.zIndex,
			        "time": time_offset + currKeyframe.offset,
			        "opacity": 1,
			        "size": {
			            "x": currKeyframe.state.viewport.region.span.x * 100,
			            "y": currKeyframe.state.viewport.region.span.y * 100
			        },
			        "pos": {
			            "x": currKeyframe.state.viewport.region.center.x * 100,
			            "y": currKeyframe.state.viewport.region.center.y * 100
			        },
			        "data": {}
			    }
                
			    VIDEO:
			        *			dispNum: display number
                    *			time: time
                    *			opacity: opacity
                    *			pos{x, y}: position in x, y
                    *			size{x, y}: size	
                    *			volume: volume
                    *			videoOffset: offset from the beginning of the video itsself
                */
			    keyFrame0 = {
			        "dispNum": 1,
			        "zIndex": currExperienceStream.data.zIndex,
			        "time": 0,
			        "opacity": 1,
			        "size": {
			            "x": $('#tagRoot').width(),
			            "y": $('#tagRoot').height()
			        },
			        "pos": {
			            "x": 0,
			            "y": 0
			        },
			        "volume": 1,
			        "videoOffset": 0,
			        "data": {}
			    }
			    keyFrame1 = {
			        "dispNum": 1,
			        "zIndex": currExperienceStream.data.zIndex,
			        "time": .05,
			        "opacity": .95,
			        "size": {
			            "x": $('#tagRoot').width(),
			            "y": $('#tagRoot').height()
			        },
			        "pos": {
			            "x": 0,
			            "y": 0
			        },
			        "volume": 1,
			        "videoOffset": 0,
			        "data": {}
			    }
			    keyFrame2 = {
			        "dispNum": 1,
			        "zIndex": currExperienceStream.data.zIndex,
			        "time": currExperienceStream.duration - .05,
			        "opacity": .95,
			        "size": {
			            "x": $('#tagRoot').width(),
			            "y": $('#tagRoot').height()
			        },
			        "pos": {
			            "x": 0,
			            "y": 0
			        },
			        "volume": 1,
			        "videoOffset": 0,
			        "data": {}
			    }
			    keyFrame3 = {
			        "dispNum": 1,
			        "zIndex": currExperienceStream.data.zIndex,
			        "time": currExperienceStream.duration,
			        "opacity": 0,
			        "size": {
			            "x": $('#tagRoot').width(),
			            "y": $('#tagRoot').height()
			        },
			        "pos": {
			            "x": 0,
			            "y": 0
			        },
			        "volume": 1,
			        "videoOffset": 0,
			        "data": {}
			    }
			    keyFrames.push(keyFrame0);
			    keyFrames.push(keyFrame1);
			    keyFrames.push(keyFrame2);
			    keyFrames.push(keyFrame3);
			    tracks.push({
			        "name": rinDataExperiencesKeys[i],
			        "providerId": providerID,
			        "assetUrl": ITE_assetUrl(currExperience),
			        "keyframes": keyFrames,
			        "zIndex": currExperience.data.zIndex
			    });

			} else {
				tracks.push({
				    "name": rinDataExperiencesKeys[i],
                    "guid": currExperience.data.guid || "",
					"providerId" : providerID,
					"assetUrl" : ITE_assetUrl(currExperience),
					"keyframes" : ITE_keyframes(currExperience, providerID),
					"zIndex" : currExperience.data.zIndex
				});
			}
		}
		//sorted from lowest to highest z-index
		return tracks.sort(function(a, b){return a.zIndex - b.zIndex});
	}

	var ITE_tour = {
		"tourTitle" : tour.Name,
		"totalDuration" : rinData.data.narrativeData.estimatedDuration || 0,
		"guid" : rinData.data.narrativeData.guid,
		"timestamp" : rinData.data.narrativeData.timestamp,
		"tracks" : ITE_tracks()
	}

	console.log("ITE tour object is: ");
	console.log(ITE_tour);
	console.log(">>>>>>>>>>>>> Finished ITE Parsing >>>>>>>>>>>>>");

	return ITE_tour;
}




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

/**
 * Defining a to-two-decimal-places function in Math
 * @method Math.twoDecPlaces
 * @param {Number} x             the number to convert to two decimal places
 * @return {Number}              x chopped at two decimal places
 */
Math.twoDecPlaces = function (x) {
    return Math.floor(x * 100) / 100;
};

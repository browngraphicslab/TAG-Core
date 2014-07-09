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
/*! Hammer.JS - v1.0.5 - 2013-04-07
 * http://eightmedia.github.com/hammer.js
 *
 * Copyright (c) 2013 Jorik Tangelder <j.tangelder@gmail.com>;
 * Licensed under the MIT license */

(function(window, undefined) {
    'use strict';

/**
 * Hammer
 * use this to create instances
 * @param   {HTMLElement}   element
 * @param   {Object}        options
 * @returns {Hammer.Instance}
 * @constructor
 */
var Hammer = function(element, options) {
    return new Hammer.Instance(element, options || {});
};

// default settings
Hammer.defaults = {
    // add styles and attributes to the element to prevent the browser from doing
    // its native behavior. this doesnt prevent the scrolling, but cancels
    // the contextmenu, tap highlighting etc
    // set to false to disable this
    stop_browser_behavior: {
		// this also triggers onselectstart=false for IE
        userSelect: 'none',
		// this makes the element blocking in IE10 >, you could experiment with the value
		// see for more options this issue; https://github.com/EightMedia/hammer.js/issues/241
        touchAction: 'none',
		touchCallout: 'none',
        contentZooming: 'none',
        userDrag: 'none',
        tapHighlightColor: 'rgba(0,0,0,0)'
    }

    // more settings are defined per gesture at gestures.js
};

// detect touchevents
Hammer.HAS_POINTEREVENTS = navigator.pointerEnabled || navigator.msPointerEnabled;
Hammer.HAS_TOUCHEVENTS = ('ontouchstart' in window);

// dont use mouseevents on mobile devices
Hammer.MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;
Hammer.NO_MOUSEEVENTS = Hammer.HAS_TOUCHEVENTS && navigator.userAgent.match(Hammer.MOBILE_REGEX);

// eventtypes per touchevent (start, move, end)
// are filled by Hammer.event.determineEventTypes on setup
Hammer.EVENT_TYPES = {};

// direction defines
Hammer.DIRECTION_DOWN = 'down';
Hammer.DIRECTION_LEFT = 'left';
Hammer.DIRECTION_UP = 'up';
Hammer.DIRECTION_RIGHT = 'right';

// pointer type
Hammer.POINTER_MOUSE = 'mouse';
Hammer.POINTER_TOUCH = 'touch';
Hammer.POINTER_PEN = 'pen';

// touch event defines
Hammer.EVENT_START = 'start';
Hammer.EVENT_MOVE = 'move';
Hammer.EVENT_END = 'end';

// hammer document where the base events are added at
Hammer.DOCUMENT = document;

// plugins namespace
Hammer.plugins = {};

// if the window events are set...
Hammer.READY = false;

/**
 * setup events to detect gestures on the document
 */
function setup() {
    if(Hammer.READY) {
        return;
    }

    // find what eventtypes we add listeners to
    Hammer.event.determineEventTypes();

    // Register all gestures inside Hammer.gestures
    for(var name in Hammer.gestures) {
        if(Hammer.gestures.hasOwnProperty(name)) {
            Hammer.detection.register(Hammer.gestures[name]);
        }
    }

    // Add touch events on the document
    Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_MOVE, Hammer.detection.detect);
    Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_END, Hammer.detection.detect);

    // Hammer is ready...!
    Hammer.READY = true;
}

/**
 * create new hammer instance
 * all methods should return the instance itself, so it is chainable.
 * @param   {HTMLElement}       element
 * @param   {Object}            [options={}]
 * @returns {Hammer.Instance}
 * @constructor
 */
Hammer.Instance = function(element, options) {
    var self = this;

    // setup HammerJS window events and register all gestures
    // this also sets up the default options
    setup();

    this.element = element;

    // start/stop detection option
    this.enabled = true;

    // merge options
    this.options = Hammer.utils.extend(
        Hammer.utils.extend({}, Hammer.defaults),
        options || {});

    // add some css to the element to prevent the browser from doing its native behavoir
    if(this.options.stop_browser_behavior) {
        Hammer.utils.stopDefaultBrowserBehavior(this.element, this.options.stop_browser_behavior);
    }

    // start detection on touchstart
    Hammer.event.onTouch(element, Hammer.EVENT_START, function(ev) {
        if(self.enabled) {
            Hammer.detection.startDetect(self, ev);
        }
    });

    // return instance
    return this;
};


Hammer.Instance.prototype = {
    /**
     * bind events to the instance
     * @param   {String}      gesture
     * @param   {Function}    handler
     * @returns {Hammer.Instance}
     */
    on: function onEvent(gesture, handler){
        var gestures = gesture.split(' ');
        for(var t=0; t<gestures.length; t++) {
            this.element.addEventListener(gestures[t], handler, false);
        }
        return this;
    },


    /**
     * unbind events to the instance
     * @param   {String}      gesture
     * @param   {Function}    handler
     * @returns {Hammer.Instance}
     */
    off: function offEvent(gesture, handler){
        var gestures = gesture.split(' ');
        for(var t=0; t<gestures.length; t++) {
            this.element.removeEventListener(gestures[t], handler, false);
        }
        return this;
    },


    /**
     * trigger gesture event
     * @param   {String}      gesture
     * @param   {Object}      eventData
     * @returns {Hammer.Instance}
     */
    trigger: function triggerEvent(gesture, eventData){
        // create DOM event
        var event = Hammer.DOCUMENT.createEvent('Event');
		event.initEvent(gesture, true, true);
		event.gesture = eventData;

        // trigger on the target if it is in the instance element,
        // this is for event delegation tricks
        var element = this.element;
        if(Hammer.utils.hasParent(eventData.target, element)) {
            element = eventData.target;
        }

        element.dispatchEvent(event);
        return this;
    },


    /**
     * enable of disable hammer.js detection
     * @param   {Boolean}   state
     * @returns {Hammer.Instance}
     */
    enable: function enable(state) {
        this.enabled = state;
        return this;
    }
};

/**
 * this holds the last move event,
 * used to fix empty touchend issue
 * see the onTouch event for an explanation
 * @type {Object}
 */
var last_move_event = null;


/**
 * when the mouse is hold down, this is true
 * @type {Boolean}
 */
var enable_detect = false;


/**
 * when touch events have been fired, this is true
 * @type {Boolean}
 */
var touch_triggered = false;


Hammer.event = {
    /**
     * simple addEventListener
     * @param   {HTMLElement}   element
     * @param   {String}        type
     * @param   {Function}      handler
     */
    bindDom: function(element, type, handler) {
        var types = type.split(' ');
        for(var t=0; t<types.length; t++) {
            element.addEventListener(types[t], handler, false);
        }
    },


    /**
     * touch events with mouse fallback
     * @param   {HTMLElement}   element
     * @param   {String}        eventType        like Hammer.EVENT_MOVE
     * @param   {Function}      handler
     */
    onTouch: function onTouch(element, eventType, handler) {
		var self = this;

        this.bindDom(element, Hammer.EVENT_TYPES[eventType], function bindDomOnTouch(ev) {
            var sourceEventType = ev.type.toLowerCase();

            // onmouseup, but when touchend has been fired we do nothing.
            // this is for touchdevices which also fire a mouseup on touchend
            if(sourceEventType.match(/mouse/) && touch_triggered) {
                return;
            }

            // mousebutton must be down or a touch event
            else if( sourceEventType.match(/touch/) ||   // touch events are always on screen
                sourceEventType.match(/pointerdown/) || // pointerevents touch
                (sourceEventType.match(/mouse/) && ev.which === 1)   // mouse is pressed
            ){
                enable_detect = true;
            }

            // we are in a touch event, set the touch triggered bool to true,
            // this for the conflicts that may occur on ios and android
            if(sourceEventType.match(/touch|pointer/)) {
                touch_triggered = true;
            }

            // count the total touches on the screen
            var count_touches = 0;

            // when touch has been triggered in this detection session
            // and we are now handling a mouse event, we stop that to prevent conflicts
            if(enable_detect) {
                // update pointerevent
                if(Hammer.HAS_POINTEREVENTS && eventType != Hammer.EVENT_END) {
                    count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
                }
                // touch
                else if(sourceEventType.match(/touch/)) {
                    count_touches = ev.touches.length;
                }
                // mouse
                else if(!touch_triggered) {
                    count_touches = sourceEventType.match(/up/) ? 0 : 1;
                }

                // if we are in a end event, but when we remove one touch and
                // we still have enough, set eventType to move
                if(count_touches > 0 && eventType == Hammer.EVENT_END) {
                    eventType = Hammer.EVENT_MOVE;
                }
                // no touches, force the end event
                else if(!count_touches) {
                    eventType = Hammer.EVENT_END;
                }

                // because touchend has no touches, and we often want to use these in our gestures,
                // we send the last move event as our eventData in touchend
                if(!count_touches && last_move_event !== null) {
                    ev = last_move_event;
                }
                // store the last move event
                else {
                    last_move_event = ev;
                }

                // trigger the handler
                handler.call(Hammer.detection, self.collectEventData(element, eventType, ev));

                // remove pointerevent from list
                if(Hammer.HAS_POINTEREVENTS && eventType == Hammer.EVENT_END) {
                    count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
                }
            }

            //debug(sourceEventType +" "+ eventType);

            // on the end we reset everything
            if(!count_touches) {
                last_move_event = null;
                enable_detect = false;
                touch_triggered = false;
                Hammer.PointerEvent.reset();
            }
        });
    },


    /**
     * we have different events for each device/browser
     * determine what we need and set them in the Hammer.EVENT_TYPES constant
     */
    determineEventTypes: function determineEventTypes() {
        // determine the eventtype we want to set
        var types;

        // pointerEvents magic
        if(Hammer.HAS_POINTEREVENTS) {
            types = Hammer.PointerEvent.getEvents();
        }
        // on Android, iOS, blackberry, windows mobile we dont want any mouseevents
        else if(Hammer.NO_MOUSEEVENTS) {
            types = [
                'touchstart',
                'touchmove',
                'touchend touchcancel'];
        }
        // for non pointer events browsers and mixed browsers,
        // like chrome on windows8 touch laptop
        else {
            types = [
                'touchstart mousedown',
                'touchmove mousemove',
                'touchend touchcancel mouseup'];
        }

        Hammer.EVENT_TYPES[Hammer.EVENT_START]  = types[0];
        Hammer.EVENT_TYPES[Hammer.EVENT_MOVE]   = types[1];
        Hammer.EVENT_TYPES[Hammer.EVENT_END]    = types[2];
    },


    /**
     * create touchlist depending on the event
     * @param   {Object}    ev
     * @param   {String}    eventType   used by the fakemultitouch plugin
     */
    getTouchList: function getTouchList(ev/*, eventType*/) {
        // get the fake pointerEvent touchlist
        if(Hammer.HAS_POINTEREVENTS) {
            return Hammer.PointerEvent.getTouchList();
        }
        // get the touchlist
        else if(ev.touches) {
            return ev.touches;
        }
        // make fake touchlist from mouse position
        else {
            return [{
                identifier: 1,
                pageX: ev.pageX,
                pageY: ev.pageY,
                target: ev.target
            }];
        }
    },


    /**
     * collect event data for Hammer js
     * @param   {HTMLElement}   element
     * @param   {String}        eventType        like Hammer.EVENT_MOVE
     * @param   {Object}        eventData
     */
    collectEventData: function collectEventData(element, eventType, ev) {
        var touches = this.getTouchList(ev, eventType);

        // find out pointerType
        var pointerType = Hammer.POINTER_TOUCH;
        if(ev.type.match(/mouse/) || Hammer.PointerEvent.matchType(Hammer.POINTER_MOUSE, ev)) {
            pointerType = Hammer.POINTER_MOUSE;
        }

        return {
            center      : Hammer.utils.getCenter(touches),
            timeStamp   : new Date().getTime(),
            target      : ev.target,
            touches     : touches,
            eventType   : eventType,
            pointerType : pointerType,
            srcEvent    : ev,

            /**
             * prevent the browser default actions
             * mostly used to disable scrolling of the browser
             */
            preventDefault: function() {
                if(this.srcEvent.preventManipulation) {
                    this.srcEvent.preventManipulation();
                }

                if(this.srcEvent.preventDefault) {
                    this.srcEvent.preventDefault();
                }
            },

            /**
             * stop bubbling the event up to its parents
             */
            stopPropagation: function() {
                this.srcEvent.stopPropagation();
            },

            /**
             * immediately stop gesture detection
             * might be useful after a swipe was detected
             * @return {*}
             */
            stopDetect: function() {
                return Hammer.detection.stopDetect();
            }
        };
    }
};

Hammer.PointerEvent = {
    /**
     * holds all pointers
     * @type {Object}
     */
    pointers: {},

    /**
     * get a list of pointers
     * @returns {Array}     touchlist
     */
    getTouchList: function() {
        var self = this;
        var touchlist = [];

        // we can use forEach since pointerEvents only is in IE10
        Object.keys(self.pointers).sort().forEach(function(id) {
            touchlist.push(self.pointers[id]);
        });
        return touchlist;
    },

    /**
     * update the position of a pointer
     * @param   {String}   type             Hammer.EVENT_END
     * @param   {Object}   pointerEvent
     */
    updatePointer: function(type, pointerEvent) {
        if(type == Hammer.EVENT_END) {
            this.pointers = {};
        }
        else {
            pointerEvent.identifier = pointerEvent.pointerId;
            this.pointers[pointerEvent.pointerId] = pointerEvent;
        }

        return Object.keys(this.pointers).length;
    },

    /**
     * check if ev matches pointertype
     * @param   {String}        pointerType     Hammer.POINTER_MOUSE
     * @param   {PointerEvent}  ev
     */
    matchType: function(pointerType, ev) {
        if(!ev.pointerType) {
            return false;
        }

        var types = {};
        types[Hammer.POINTER_MOUSE] = (ev.pointerType == ev.MSPOINTER_TYPE_MOUSE || ev.pointerType == Hammer.POINTER_MOUSE);
        types[Hammer.POINTER_TOUCH] = (ev.pointerType == ev.MSPOINTER_TYPE_TOUCH || ev.pointerType == Hammer.POINTER_TOUCH);
        types[Hammer.POINTER_PEN] = (ev.pointerType == ev.MSPOINTER_TYPE_PEN || ev.pointerType == Hammer.POINTER_PEN);
        return types[pointerType];
    },


    /**
     * get events
     */
    getEvents: function() {
        return [
            'pointerdown MSPointerDown',
            'pointermove MSPointerMove',
            'pointerup pointercancel MSPointerUp MSPointerCancel'
        ];
    },

    /**
     * reset the list
     */
    reset: function() {
        this.pointers = {};
    }
};


Hammer.utils = {
    /**
     * extend method,
     * also used for cloning when dest is an empty object
     * @param   {Object}    dest
     * @param   {Object}    src
	 * @parm	{Boolean}	merge		do a merge
     * @returns {Object}    dest
     */
    extend: function extend(dest, src, merge) {
        for (var key in src) {
			if(dest[key] !== undefined && merge) {
				continue;
			}
            dest[key] = src[key];
        }
        return dest;
    },


    /**
     * find if a node is in the given parent
     * used for event delegation tricks
     * @param   {HTMLElement}   node
     * @param   {HTMLElement}   parent
     * @returns {boolean}       has_parent
     */
    hasParent: function(node, parent) {
        while(node){
            if(node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    },


    /**
     * get the center of all the touches
     * @param   {Array}     touches
     * @returns {Object}    center
     */
    getCenter: function getCenter(touches) {
        var valuesX = [], valuesY = [];

        for(var t= 0,len=touches.length; t<len; t++) {
            valuesX.push(touches[t].pageX);
            valuesY.push(touches[t].pageY);
        }

        return {
            pageX: ((Math.min.apply(Math, valuesX) + Math.max.apply(Math, valuesX)) / 2),
            pageY: ((Math.min.apply(Math, valuesY) + Math.max.apply(Math, valuesY)) / 2)
        };
    },


    /**
     * calculate the velocity between two points
     * @param   {Number}    delta_time
     * @param   {Number}    delta_x
     * @param   {Number}    delta_y
     * @returns {Object}    velocity
     */
    getVelocity: function getVelocity(delta_time, delta_x, delta_y) {
        return {
            x: Math.abs(delta_x / delta_time) || 0,
            y: Math.abs(delta_y / delta_time) || 0
        };
    },


    /**
     * calculate the angle between two coordinates
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {Number}    angle
     */
    getAngle: function getAngle(touch1, touch2) {
        var y = touch2.pageY - touch1.pageY,
            x = touch2.pageX - touch1.pageX;
        return Math.atan2(y, x) * 180 / Math.PI;
    },


    /**
     * angle to direction define
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {String}    direction constant, like Hammer.DIRECTION_LEFT
     */
    getDirection: function getDirection(touch1, touch2) {
        var x = Math.abs(touch1.pageX - touch2.pageX),
            y = Math.abs(touch1.pageY - touch2.pageY);

        if(x >= y) {
            return touch1.pageX - touch2.pageX > 0 ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
        }
        else {
            return touch1.pageY - touch2.pageY > 0 ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
        }
    },


    /**
     * calculate the distance between two touches
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {Number}    distance
     */
    getDistance: function getDistance(touch1, touch2) {
        var x = touch2.pageX - touch1.pageX,
            y = touch2.pageY - touch1.pageY;
        return Math.sqrt((x*x) + (y*y));
    },


    /**
     * calculate the scale factor between two touchLists (fingers)
     * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
     * @param   {Array}     start
     * @param   {Array}     end
     * @returns {Number}    scale
     */
    getScale: function getScale(start, end) {
        // need two fingers...
        if(start.length >= 2 && end.length >= 2) {
            return this.getDistance(end[0], end[1]) /
                this.getDistance(start[0], start[1]);
        }
        return 1;
    },


    /**
     * calculate the rotation degrees between two touchLists (fingers)
     * @param   {Array}     start
     * @param   {Array}     end
     * @returns {Number}    rotation
     */
    getRotation: function getRotation(start, end) {
        // need two fingers
        if(start.length >= 2 && end.length >= 2) {
            return this.getAngle(end[1], end[0]) -
                this.getAngle(start[1], start[0]);
        }
        return 0;
    },


    /**
     * boolean if the direction is vertical
     * @param    {String}    direction
     * @returns  {Boolean}   is_vertical
     */
    isVertical: function isVertical(direction) {
        return (direction == Hammer.DIRECTION_UP || direction == Hammer.DIRECTION_DOWN);
    },


    /**
     * stop browser default behavior with css props
     * @param   {HtmlElement}   element
     * @param   {Object}        css_props
     */
    stopDefaultBrowserBehavior: function stopDefaultBrowserBehavior(element, css_props) {
        var prop,
            vendors = ['webkit','khtml','moz','ms','o',''];

        if(!css_props || !element.style) {
            return;
        }

        // with css properties for modern browsers
        for(var i = 0; i < vendors.length; i++) {
            for(var p in css_props) {
                if(css_props.hasOwnProperty(p)) {
                    prop = p;

                    // vender prefix at the property
                    if(vendors[i]) {
                        prop = vendors[i] + prop.substring(0, 1).toUpperCase() + prop.substring(1);
                    }

                    // set the style
                    element.style[prop] = css_props[p];
                }
            }
        }

        // also the disable onselectstart
        if(css_props.userSelect == 'none') {
            element.onselectstart = function() {
                return false;
            };
        }
    }
};

Hammer.detection = {
    // contains all registred Hammer.gestures in the correct order
    gestures: [],

    // data of the current Hammer.gesture detection session
    current: null,

    // the previous Hammer.gesture session data
    // is a full clone of the previous gesture.current object
    previous: null,

    // when this becomes true, no gestures are fired
    stopped: false,


    /**
     * start Hammer.gesture detection
     * @param   {Hammer.Instance}   inst
     * @param   {Object}            eventData
     */
    startDetect: function startDetect(inst, eventData) {
        // already busy with a Hammer.gesture detection on an element
        if(this.current) {
            return;
        }

        this.stopped = false;

        this.current = {
            inst        : inst, // reference to HammerInstance we're working for
            startEvent  : Hammer.utils.extend({}, eventData), // start eventData for distances, timing etc
            lastEvent   : false, // last eventData
            name        : '' // current gesture we're in/detected, can be 'tap', 'hold' etc
        };

        this.detect(eventData);
    },


    /**
     * Hammer.gesture detection
     * @param   {Object}    eventData
     * @param   {Object}    eventData
     */
    detect: function detect(eventData) {
        if(!this.current || this.stopped) {
            return;
        }

        // extend event data with calculations about scale, distance etc
        eventData = this.extendEventData(eventData);

        // instance options
        var inst_options = this.current.inst.options;

        // call Hammer.gesture handlers
        for(var g=0,len=this.gestures.length; g<len; g++) {
            var gesture = this.gestures[g];

            // only when the instance options have enabled this gesture
            if(!this.stopped && inst_options[gesture.name] !== false) {
                // if a handler returns false, we stop with the detection
                if(gesture.handler.call(gesture, eventData, this.current.inst) === false) {
                    this.stopDetect();
                    break;
                }
            }
        }

        // store as previous event event
        if(this.current) {
            this.current.lastEvent = eventData;
        }

        // endevent, but not the last touch, so dont stop
        if(eventData.eventType == Hammer.EVENT_END && !eventData.touches.length-1) {
            this.stopDetect();
        }

        return eventData;
    },


    /**
     * clear the Hammer.gesture vars
     * this is called on endDetect, but can also be used when a final Hammer.gesture has been detected
     * to stop other Hammer.gestures from being fired
     */
    stopDetect: function stopDetect() {
        // clone current data to the store as the previous gesture
        // used for the double tap gesture, since this is an other gesture detect session
        this.previous = Hammer.utils.extend({}, this.current);

        // reset the current
        this.current = null;

        // stopped!
        this.stopped = true;
    },


    /**
     * extend eventData for Hammer.gestures
     * @param   {Object}   ev
     * @returns {Object}   ev
     */
    extendEventData: function extendEventData(ev) {
        var startEv = this.current.startEvent;

        // if the touches change, set the new touches over the startEvent touches
        // this because touchevents don't have all the touches on touchstart, or the
        // user must place his fingers at the EXACT same time on the screen, which is not realistic
        // but, sometimes it happens that both fingers are touching at the EXACT same time
        if(startEv && (ev.touches.length != startEv.touches.length || ev.touches === startEv.touches)) {
            // extend 1 level deep to get the touchlist with the touch objects
            startEv.touches = [];
            for(var i=0,len=ev.touches.length; i<len; i++) {
                startEv.touches.push(Hammer.utils.extend({}, ev.touches[i]));
            }
        }

        var delta_time = ev.timeStamp - startEv.timeStamp,
            delta_x = ev.center.pageX - startEv.center.pageX,
            delta_y = ev.center.pageY - startEv.center.pageY,
            velocity = Hammer.utils.getVelocity(delta_time, delta_x, delta_y);

        Hammer.utils.extend(ev, {
            deltaTime   : delta_time,

            deltaX      : delta_x,
            deltaY      : delta_y,

            velocityX   : velocity.x,
            velocityY   : velocity.y,

            distance    : Hammer.utils.getDistance(startEv.center, ev.center),
            angle       : Hammer.utils.getAngle(startEv.center, ev.center),
            direction   : Hammer.utils.getDirection(startEv.center, ev.center),

            scale       : Hammer.utils.getScale(startEv.touches, ev.touches),
            rotation    : Hammer.utils.getRotation(startEv.touches, ev.touches),

            startEvent  : startEv
        });

        return ev;
    },


    /**
     * register new gesture
     * @param   {Object}    gesture object, see gestures.js for documentation
     * @returns {Array}     gestures
     */
    register: function register(gesture) {
        // add an enable gesture options if there is no given
        var options = gesture.defaults || {};
        if(options[gesture.name] === undefined) {
            options[gesture.name] = true;
        }

        // extend Hammer default options with the Hammer.gesture options
        Hammer.utils.extend(Hammer.defaults, options, true);

        // set its index
        gesture.index = gesture.index || 1000;

        // add Hammer.gesture to the list
        this.gestures.push(gesture);

        // sort the list by index
        this.gestures.sort(function(a, b) {
            if (a.index < b.index) {
                return -1;
            }
            if (a.index > b.index) {
                return 1;
            }
            return 0;
        });

        return this.gestures;
    }
};


Hammer.gestures = Hammer.gestures || {};

/**
 * Custom gestures
 * ==============================
 *
 * Gesture object
 * --------------------
 * The object structure of a gesture:
 *
 * { name: 'mygesture',
 *   index: 1337,
 *   defaults: {
 *     mygesture_option: true
 *   }
 *   handler: function(type, ev, inst) {
 *     // trigger gesture event
 *     inst.trigger(this.name, ev);
 *   }
 * }

 * @param   {String}    name
 * this should be the name of the gesture, lowercase
 * it is also being used to disable/enable the gesture per instance config.
 *
 * @param   {Number}    [index=1000]
 * the index of the gesture, where it is going to be in the stack of gestures detection
 * like when you build an gesture that depends on the drag gesture, it is a good
 * idea to place it after the index of the drag gesture.
 *
 * @param   {Object}    [defaults={}]
 * the default settings of the gesture. these are added to the instance settings,
 * and can be overruled per instance. you can also add the name of the gesture,
 * but this is also added by default (and set to true).
 *
 * @param   {Function}  handler
 * this handles the gesture detection of your custom gesture and receives the
 * following arguments:
 *
 *      @param  {Object}    eventData
 *      event data containing the following properties:
 *          timeStamp   {Number}        time the event occurred
 *          target      {HTMLElement}   target element
 *          touches     {Array}         touches (fingers, pointers, mouse) on the screen
 *          pointerType {String}        kind of pointer that was used. matches Hammer.POINTER_MOUSE|TOUCH
 *          center      {Object}        center position of the touches. contains pageX and pageY
 *          deltaTime   {Number}        the total time of the touches in the screen
 *          deltaX      {Number}        the delta on x axis we haved moved
 *          deltaY      {Number}        the delta on y axis we haved moved
 *          velocityX   {Number}        the velocity on the x
 *          velocityY   {Number}        the velocity on y
 *          angle       {Number}        the angle we are moving
 *          direction   {String}        the direction we are moving. matches Hammer.DIRECTION_UP|DOWN|LEFT|RIGHT
 *          distance    {Number}        the distance we haved moved
 *          scale       {Number}        scaling of the touches, needs 2 touches
 *          rotation    {Number}        rotation of the touches, needs 2 touches *
 *          eventType   {String}        matches Hammer.EVENT_START|MOVE|END
 *          srcEvent    {Object}        the source event, like TouchStart or MouseDown *
 *          startEvent  {Object}        contains the same properties as above,
 *                                      but from the first touch. this is used to calculate
 *                                      distances, deltaTime, scaling etc
 *
 *      @param  {Hammer.Instance}    inst
 *      the instance we are doing the detection for. you can get the options from
 *      the inst.options object and trigger the gesture event by calling inst.trigger
 *
 *
 * Handle gestures
 * --------------------
 * inside the handler you can get/set Hammer.detection.current. This is the current
 * detection session. It has the following properties
 *      @param  {String}    name
 *      contains the name of the gesture we have detected. it has not a real function,
 *      only to check in other gestures if something is detected.
 *      like in the drag gesture we set it to 'drag' and in the swipe gesture we can
 *      check if the current gesture is 'drag' by accessing Hammer.detection.current.name
 *
 *      @readonly
 *      @param  {Hammer.Instance}    inst
 *      the instance we do the detection for
 *
 *      @readonly
 *      @param  {Object}    startEvent
 *      contains the properties of the first gesture detection in this session.
 *      Used for calculations about timing, distance, etc.
 *
 *      @readonly
 *      @param  {Object}    lastEvent
 *      contains all the properties of the last gesture detect in this session.
 *
 * after the gesture detection session has been completed (user has released the screen)
 * the Hammer.detection.current object is copied into Hammer.detection.previous,
 * this is usefull for gestures like doubletap, where you need to know if the
 * previous gesture was a tap
 *
 * options that have been set by the instance can be received by calling inst.options
 *
 * You can trigger a gesture event by calling inst.trigger("mygesture", event).
 * The first param is the name of your gesture, the second the event argument
 *
 *
 * Register gestures
 * --------------------
 * When an gesture is added to the Hammer.gestures object, it is auto registered
 * at the setup of the first Hammer instance. You can also call Hammer.detection.register
 * manually and pass your gesture object as a param
 *
 */

/**
 * Hold
 * Touch stays at the same place for x time
 * @events  hold
 */
Hammer.gestures.Hold = {
    name: 'hold',
    index: 10,
    defaults: {
        hold_timeout	: 500,
        hold_threshold	: 1
    },
    timer: null,
    handler: function holdGesture(ev, inst) {
        switch(ev.eventType) {
            case Hammer.EVENT_START:
                // clear any running timers
                clearTimeout(this.timer);

                // set the gesture so we can check in the timeout if it still is
                Hammer.detection.current.name = this.name;

                // set timer and if after the timeout it still is hold,
                // we trigger the hold event
                this.timer = setTimeout(function() {
                    if(Hammer.detection.current.name == 'hold') {
                        inst.trigger('hold', ev);
                    }
                }, inst.options.hold_timeout);
                break;

            // when you move or end we clear the timer
            case Hammer.EVENT_MOVE:
                if(ev.distance > inst.options.hold_threshold) {
                    clearTimeout(this.timer);
                }
                break;

            case Hammer.EVENT_END:
                clearTimeout(this.timer);
                break;
        }
    }
};


/**
 * Tap/DoubleTap
 * Quick touch at a place or double at the same place
 * @events  tap, doubletap
 */
Hammer.gestures.Tap = {
    name: 'tap',
    index: 100,
    defaults: {
        tap_max_touchtime	: 250,
        tap_max_distance	: 10,
		tap_always			: true,
        doubletap_distance	: 20,
        doubletap_interval	: 300
    },
    handler: function tapGesture(ev, inst) {
        if(ev.eventType == Hammer.EVENT_END) {
            // previous gesture, for the double tap since these are two different gesture detections
            var prev = Hammer.detection.previous,
				did_doubletap = false;

            // when the touchtime is higher then the max touch time
            // or when the moving distance is too much
            if(ev.deltaTime > inst.options.tap_max_touchtime ||
                ev.distance > inst.options.tap_max_distance) {
                return;
            }

            // check if double tap
            if(prev && prev.name == 'tap' &&
                (ev.timeStamp - prev.lastEvent.timeStamp) < inst.options.doubletap_interval &&
                ev.distance < inst.options.doubletap_distance) {
				inst.trigger('doubletap', ev);
				did_doubletap = true;
            }

			// do a single tap
			if(!did_doubletap || inst.options.tap_always) {
				Hammer.detection.current.name = 'tap';
				inst.trigger(Hammer.detection.current.name, ev);
			}
        }
    }
};


/**
 * Swipe
 * triggers swipe events when the end velocity is above the threshold
 * @events  swipe, swipeleft, swiperight, swipeup, swipedown
 */
Hammer.gestures.Swipe = {
    name: 'swipe',
    index: 40,
    defaults: {
        // set 0 for unlimited, but this can conflict with transform
        swipe_max_touches  : 1,
        swipe_velocity     : 0.7
    },
    handler: function swipeGesture(ev, inst) {
        if(ev.eventType == Hammer.EVENT_END) {
            // max touches
            if(inst.options.swipe_max_touches > 0 &&
                ev.touches.length > inst.options.swipe_max_touches) {
                return;
            }

            // when the distance we moved is too small we skip this gesture
            // or we can be already in dragging
            if(ev.velocityX > inst.options.swipe_velocity ||
                ev.velocityY > inst.options.swipe_velocity) {
                // trigger swipe events
                inst.trigger(this.name, ev);
                inst.trigger(this.name + ev.direction, ev);
            }
        }
    }
};


/**
 * Drag
 * Move with x fingers (default 1) around on the page. Blocking the scrolling when
 * moving left and right is a good practice. When all the drag events are blocking
 * you disable scrolling on that area.
 * @events  drag, drapleft, dragright, dragup, dragdown
 */
Hammer.gestures.Drag = {
    name: 'drag',
    index: 50,
    defaults: {
        drag_min_distance : 10,
        // set 0 for unlimited, but this can conflict with transform
        drag_max_touches  : 1,
        // prevent default browser behavior when dragging occurs
        // be careful with it, it makes the element a blocking element
        // when you are using the drag gesture, it is a good practice to set this true
        drag_block_horizontal   : false,
        drag_block_vertical     : false,
        // drag_lock_to_axis keeps the drag gesture on the axis that it started on,
        // It disallows vertical directions if the initial direction was horizontal, and vice versa.
        drag_lock_to_axis       : false,
        // drag lock only kicks in when distance > drag_lock_min_distance
        // This way, locking occurs only when the distance has become large enough to reliably determine the direction
        drag_lock_min_distance : 25
    },
    triggered: false,
    handler: function dragGesture(ev, inst) {

        // current gesture isnt drag, but dragged is true
        // this means an other gesture is busy. now call dragend
        if(Hammer.detection.current.name != this.name && this.triggered) {
            inst.trigger(this.name +'end', ev);
            this.triggered = false;
            return;
        }

        // max touches
        if(inst.options.drag_max_touches > 0 &&
            ev.touches.length > inst.options.drag_max_touches) {
            return;
        }

        switch(ev.eventType) {
            case Hammer.EVENT_START:
                this.triggered = false;
                break;

            case Hammer.EVENT_MOVE:
                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(ev.distance < inst.options.drag_min_distance &&
                    Hammer.detection.current.name != this.name) {
                    return;
                }

                // we are dragging!
                Hammer.detection.current.name = this.name;

                // lock drag to axis?
                if(Hammer.detection.current.lastEvent.drag_locked_to_axis || (inst.options.drag_lock_to_axis && inst.options.drag_lock_min_distance<=ev.distance)) {
                    ev.drag_locked_to_axis = true;
                }
                var last_direction = Hammer.detection.current.lastEvent.direction;
                if(ev.drag_locked_to_axis && last_direction !== ev.direction) {
                    // keep direction on the axis that the drag gesture started on
                    if(Hammer.utils.isVertical(last_direction)) {
                        ev.direction = (ev.deltaY < 0) ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
                    }
                    else {
                        ev.direction = (ev.deltaX < 0) ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
                    }
                }

                // first time, trigger dragstart event
                if(!this.triggered) {
                    inst.trigger(this.name +'start', ev);
                    this.triggered = true;
                }

                // trigger normal event
                inst.trigger(this.name, ev);

                // direction event, like dragdown
                inst.trigger(this.name + ev.direction, ev);

                // block the browser events
                if( (inst.options.drag_block_vertical && Hammer.utils.isVertical(ev.direction)) ||
                    (inst.options.drag_block_horizontal && !Hammer.utils.isVertical(ev.direction))) {
                    ev.preventDefault();
                }
                break;

            case Hammer.EVENT_END:
                // trigger dragend
                if(this.triggered) {
                    inst.trigger(this.name +'end', ev);
                }

                this.triggered = false;
                break;
        }
    }
};


/**
 * Transform
 * User want to scale or rotate with 2 fingers
 * @events  transform, pinch, pinchin, pinchout, rotate
 */
Hammer.gestures.Transform = {
    name: 'transform',
    index: 45,
    defaults: {
        // factor, no scale is 1, zoomin is to 0 and zoomout until higher then 1
        transform_min_scale     : 0.01,
        // rotation in degrees
        transform_min_rotation  : 1,
        // prevent default browser behavior when two touches are on the screen
        // but it makes the element a blocking element
        // when you are using the transform gesture, it is a good practice to set this true
        transform_always_block  : false
    },
    triggered: false,
    handler: function transformGesture(ev, inst) {
        // current gesture isnt drag, but dragged is true
        // this means an other gesture is busy. now call dragend
        if(Hammer.detection.current.name != this.name && this.triggered) {
            inst.trigger(this.name +'end', ev);
            this.triggered = false;
            return;
        }

        // atleast multitouch
        if(ev.touches.length < 2) {
            return;
        }

        // prevent default when two fingers are on the screen
        if(inst.options.transform_always_block) {
            ev.preventDefault();
        }

        switch(ev.eventType) {
            case Hammer.EVENT_START:
                this.triggered = false;
                break;

            case Hammer.EVENT_MOVE:
                var scale_threshold = Math.abs(1-ev.scale);
                var rotation_threshold = Math.abs(ev.rotation);

                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(scale_threshold < inst.options.transform_min_scale &&
                    rotation_threshold < inst.options.transform_min_rotation) {
                    return;
                }

                // we are transforming!
                Hammer.detection.current.name = this.name;

                // first time, trigger dragstart event
                if(!this.triggered) {
                    inst.trigger(this.name +'start', ev);
                    this.triggered = true;
                }

                inst.trigger(this.name, ev); // basic transform event

                // trigger rotate event
                if(rotation_threshold > inst.options.transform_min_rotation) {
                    inst.trigger('rotate', ev);
                }

                // trigger pinch event
                if(scale_threshold > inst.options.transform_min_scale) {
                    inst.trigger('pinch', ev);
                    inst.trigger('pinch'+ ((ev.scale < 1) ? 'in' : 'out'), ev);
                }
                break;

            case Hammer.EVENT_END:
                // trigger dragend
                if(this.triggered) {
                    inst.trigger(this.name +'end', ev);
                }

                this.triggered = false;
                break;
        }
    }
};


/**
 * Touch
 * Called as first, tells the user has touched the screen
 * @events  touch
 */
Hammer.gestures.Touch = {
    name: 'touch',
    index: -Infinity,
    defaults: {
        // call preventDefault at touchstart, and makes the element blocking by
        // disabling the scrolling of the page, but it improves gestures like
        // transforming and dragging.
        // be careful with using this, it can be very annoying for users to be stuck
        // on the page
        prevent_default: false,

        // disable mouse events, so only touch (or pen!) input triggers events
        prevent_mouseevents: false
    },
    handler: function touchGesture(ev, inst) {
        if(inst.options.prevent_mouseevents && ev.pointerType == Hammer.POINTER_MOUSE) {
            ev.stopDetect();
            return;
        }

        if(inst.options.prevent_default) {
            ev.preventDefault();
        }

        if(ev.eventType ==  Hammer.EVENT_START) {
            inst.trigger(this.name, ev);
        }
    }
};


/**
 * Release
 * Called as last, tells the user has released the screen
 * @events  release
 */
Hammer.gestures.Release = {
    name: 'release',
    index: Infinity,
    handler: function releaseGesture(ev, inst) {
        if(ev.eventType ==  Hammer.EVENT_END) {
            inst.trigger(this.name, ev);
        }
    }
};

// node export
if(typeof module === 'object' && typeof module.exports === 'object'){
    module.exports = Hammer;
}
// just window export
else {
    window.Hammer = Hammer;

    // requireJS module definition
    if(typeof window.define === 'function' && window.define.amd) {
        window.define('hammer', [], function() {
            return Hammer;
        });
    }
}
})(this);
/*************/
/*!
 * VERSION: 1.12.1
 * DATE: 2014-06-26
 * UPDATES AND DOCS AT: http://www.greensock.com
 *
 * @license Copyright (c) 2008-2014, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */
(window._gsQueue||(window._gsQueue=[])).push(function(){"use strict";window._gsDefine("TimelineLite",["core.Animation","core.SimpleTimeline","TweenLite"],function(t,e,i){var s=function(t){e.call(this,t),this._labels={},this.autoRemoveChildren=this.vars.autoRemoveChildren===!0,this.smoothChildTiming=this.vars.smoothChildTiming===!0,this._sortChildren=!0,this._onUpdate=this.vars.onUpdate;var i,s,r=this.vars;for(s in r)i=r[s],a(i)&&-1!==i.join("").indexOf("{self}")&&(r[s]=this._swapSelfInParams(i));a(r.tweens)&&this.add(r.tweens,0,r.align,r.stagger)},r=1e-10,n=i._internals.isSelector,a=i._internals.isArray,o=[],h=window._gsDefine.globals,l=function(t){var e,i={};for(e in t)i[e]=t[e];return i},_=function(t,e,i,s){t._timeline.pause(t._startTime),e&&e.apply(s||t._timeline,i||o)},u=o.slice,f=s.prototype=new e;return s.version="1.12.1",f.constructor=s,f.kill()._gc=!1,f.to=function(t,e,s,r){var n=s.repeat&&h.TweenMax||i;return e?this.add(new n(t,e,s),r):this.set(t,s,r)},f.from=function(t,e,s,r){return this.add((s.repeat&&h.TweenMax||i).from(t,e,s),r)},f.fromTo=function(t,e,s,r,n){var a=r.repeat&&h.TweenMax||i;return e?this.add(a.fromTo(t,e,s,r),n):this.set(t,r,n)},f.staggerTo=function(t,e,r,a,o,h,_,f){var p,c=new s({onComplete:h,onCompleteParams:_,onCompleteScope:f,smoothChildTiming:this.smoothChildTiming});for("string"==typeof t&&(t=i.selector(t)||t),n(t)&&(t=u.call(t,0)),a=a||0,p=0;t.length>p;p++)r.startAt&&(r.startAt=l(r.startAt)),c.to(t[p],e,l(r),p*a);return this.add(c,o)},f.staggerFrom=function(t,e,i,s,r,n,a,o){return i.immediateRender=0!=i.immediateRender,i.runBackwards=!0,this.staggerTo(t,e,i,s,r,n,a,o)},f.staggerFromTo=function(t,e,i,s,r,n,a,o,h){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,this.staggerTo(t,e,s,r,n,a,o,h)},f.call=function(t,e,s,r){return this.add(i.delayedCall(0,t,e,s),r)},f.set=function(t,e,s){return s=this._parseTimeOrLabel(s,0,!0),null==e.immediateRender&&(e.immediateRender=s===this._time&&!this._paused),this.add(new i(t,0,e),s)},s.exportRoot=function(t,e){t=t||{},null==t.smoothChildTiming&&(t.smoothChildTiming=!0);var r,n,a=new s(t),o=a._timeline;for(null==e&&(e=!0),o._remove(a,!0),a._startTime=0,a._rawPrevTime=a._time=a._totalTime=o._time,r=o._first;r;)n=r._next,e&&r instanceof i&&r.target===r.vars.onComplete||a.add(r,r._startTime-r._delay),r=n;return o.add(a,0),a},f.add=function(r,n,o,h){var l,_,u,f,p,c;if("number"!=typeof n&&(n=this._parseTimeOrLabel(n,0,!0,r)),!(r instanceof t)){if(r instanceof Array||r&&r.push&&a(r)){for(o=o||"normal",h=h||0,l=n,_=r.length,u=0;_>u;u++)a(f=r[u])&&(f=new s({tweens:f})),this.add(f,l),"string"!=typeof f&&"function"!=typeof f&&("sequence"===o?l=f._startTime+f.totalDuration()/f._timeScale:"start"===o&&(f._startTime-=f.delay())),l+=h;return this._uncache(!0)}if("string"==typeof r)return this.addLabel(r,n);if("function"!=typeof r)throw"Cannot add "+r+" into the timeline; it is not a tween, timeline, function, or string.";r=i.delayedCall(0,r)}if(e.prototype.add.call(this,r,n),(this._gc||this._time===this._duration)&&!this._paused&&this._duration<this.duration())for(p=this,c=p.rawTime()>r._startTime;p._timeline;)c&&p._timeline.smoothChildTiming?p.totalTime(p._totalTime,!0):p._gc&&p._enabled(!0,!1),p=p._timeline;return this},f.remove=function(e){if(e instanceof t)return this._remove(e,!1);if(e instanceof Array||e&&e.push&&a(e)){for(var i=e.length;--i>-1;)this.remove(e[i]);return this}return"string"==typeof e?this.removeLabel(e):this.kill(null,e)},f._remove=function(t,i){e.prototype._remove.call(this,t,i);var s=this._last;return s?this._time>s._startTime+s._totalDuration/s._timeScale&&(this._time=this.duration(),this._totalTime=this._totalDuration):this._time=this._totalTime=this._duration=this._totalDuration=0,this},f.append=function(t,e){return this.add(t,this._parseTimeOrLabel(null,e,!0,t))},f.insert=f.insertMultiple=function(t,e,i,s){return this.add(t,e||0,i,s)},f.appendMultiple=function(t,e,i,s){return this.add(t,this._parseTimeOrLabel(null,e,!0,t),i,s)},f.addLabel=function(t,e){return this._labels[t]=this._parseTimeOrLabel(e),this},f.addPause=function(t,e,i,s){return this.call(_,["{self}",e,i,s],this,t)},f.removeLabel=function(t){return delete this._labels[t],this},f.getLabelTime=function(t){return null!=this._labels[t]?this._labels[t]:-1},f._parseTimeOrLabel=function(e,i,s,r){var n;if(r instanceof t&&r.timeline===this)this.remove(r);else if(r&&(r instanceof Array||r.push&&a(r)))for(n=r.length;--n>-1;)r[n]instanceof t&&r[n].timeline===this&&this.remove(r[n]);if("string"==typeof i)return this._parseTimeOrLabel(i,s&&"number"==typeof e&&null==this._labels[i]?e-this.duration():0,s);if(i=i||0,"string"!=typeof e||!isNaN(e)&&null==this._labels[e])null==e&&(e=this.duration());else{if(n=e.indexOf("="),-1===n)return null==this._labels[e]?s?this._labels[e]=this.duration()+i:i:this._labels[e]+i;i=parseInt(e.charAt(n-1)+"1",10)*Number(e.substr(n+1)),e=n>1?this._parseTimeOrLabel(e.substr(0,n-1),0,s):this.duration()}return Number(e)+i},f.seek=function(t,e){return this.totalTime("number"==typeof t?t:this._parseTimeOrLabel(t),e!==!1)},f.stop=function(){return this.paused(!0)},f.gotoAndPlay=function(t,e){return this.play(t,e)},f.gotoAndStop=function(t,e){return this.pause(t,e)},f.render=function(t,e,i){this._gc&&this._enabled(!0,!1);var s,n,a,h,l,_=this._dirty?this.totalDuration():this._totalDuration,u=this._time,f=this._startTime,p=this._timeScale,c=this._paused;if(t>=_?(this._totalTime=this._time=_,this._reversed||this._hasPausedChild()||(n=!0,h="onComplete",0===this._duration&&(0===t||0>this._rawPrevTime||this._rawPrevTime===r)&&this._rawPrevTime!==t&&this._first&&(l=!0,this._rawPrevTime>r&&(h="onReverseComplete"))),this._rawPrevTime=this._duration||!e||t||this._rawPrevTime===t?t:r,t=_+1e-4):1e-7>t?(this._totalTime=this._time=0,(0!==u||0===this._duration&&this._rawPrevTime!==r&&(this._rawPrevTime>0||0>t&&this._rawPrevTime>=0))&&(h="onReverseComplete",n=this._reversed),0>t?(this._active=!1,0===this._duration&&this._rawPrevTime>=0&&this._first&&(l=!0),this._rawPrevTime=t):(this._rawPrevTime=this._duration||!e||t||this._rawPrevTime===t?t:r,t=0,this._initted||(l=!0))):this._totalTime=this._time=this._rawPrevTime=t,this._time!==u&&this._first||i||l){if(this._initted||(this._initted=!0),this._active||!this._paused&&this._time!==u&&t>0&&(this._active=!0),0===u&&this.vars.onStart&&0!==this._time&&(e||this.vars.onStart.apply(this.vars.onStartScope||this,this.vars.onStartParams||o)),this._time>=u)for(s=this._first;s&&(a=s._next,!this._paused||c);)(s._active||s._startTime<=this._time&&!s._paused&&!s._gc)&&(s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=a;else for(s=this._last;s&&(a=s._prev,!this._paused||c);)(s._active||u>=s._startTime&&!s._paused&&!s._gc)&&(s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=a;this._onUpdate&&(e||this._onUpdate.apply(this.vars.onUpdateScope||this,this.vars.onUpdateParams||o)),h&&(this._gc||(f===this._startTime||p!==this._timeScale)&&(0===this._time||_>=this.totalDuration())&&(n&&(this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[h]&&this.vars[h].apply(this.vars[h+"Scope"]||this,this.vars[h+"Params"]||o)))}},f._hasPausedChild=function(){for(var t=this._first;t;){if(t._paused||t instanceof s&&t._hasPausedChild())return!0;t=t._next}return!1},f.getChildren=function(t,e,s,r){r=r||-9999999999;for(var n=[],a=this._first,o=0;a;)r>a._startTime||(a instanceof i?e!==!1&&(n[o++]=a):(s!==!1&&(n[o++]=a),t!==!1&&(n=n.concat(a.getChildren(!0,e,s)),o=n.length))),a=a._next;return n},f.getTweensOf=function(t,e){var s,r,n=this._gc,a=[],o=0;for(n&&this._enabled(!0,!0),s=i.getTweensOf(t),r=s.length;--r>-1;)(s[r].timeline===this||e&&this._contains(s[r]))&&(a[o++]=s[r]);return n&&this._enabled(!1,!0),a},f._contains=function(t){for(var e=t.timeline;e;){if(e===this)return!0;e=e.timeline}return!1},f.shiftChildren=function(t,e,i){i=i||0;for(var s,r=this._first,n=this._labels;r;)r._startTime>=i&&(r._startTime+=t),r=r._next;if(e)for(s in n)n[s]>=i&&(n[s]+=t);return this._uncache(!0)},f._kill=function(t,e){if(!t&&!e)return this._enabled(!1,!1);for(var i=e?this.getTweensOf(e):this.getChildren(!0,!0,!1),s=i.length,r=!1;--s>-1;)i[s]._kill(t,e)&&(r=!0);return r},f.clear=function(t){var e=this.getChildren(!1,!0,!0),i=e.length;for(this._time=this._totalTime=0;--i>-1;)e[i]._enabled(!1,!1);return t!==!1&&(this._labels={}),this._uncache(!0)},f.invalidate=function(){for(var t=this._first;t;)t.invalidate(),t=t._next;return this},f._enabled=function(t,i){if(t===this._gc)for(var s=this._first;s;)s._enabled(t,!0),s=s._next;return e.prototype._enabled.call(this,t,i)},f.duration=function(t){return arguments.length?(0!==this.duration()&&0!==t&&this.timeScale(this._duration/t),this):(this._dirty&&this.totalDuration(),this._duration)},f.totalDuration=function(t){if(!arguments.length){if(this._dirty){for(var e,i,s=0,r=this._last,n=999999999999;r;)e=r._prev,r._dirty&&r.totalDuration(),r._startTime>n&&this._sortChildren&&!r._paused?this.add(r,r._startTime-r._delay):n=r._startTime,0>r._startTime&&!r._paused&&(s-=r._startTime,this._timeline.smoothChildTiming&&(this._startTime+=r._startTime/this._timeScale),this.shiftChildren(-r._startTime,!1,-9999999999),n=0),i=r._startTime+r._totalDuration/r._timeScale,i>s&&(s=i),r=e;this._duration=this._totalDuration=s,this._dirty=!1}return this._totalDuration}return 0!==this.totalDuration()&&0!==t&&this.timeScale(this._totalDuration/t),this},f.usesFrames=function(){for(var e=this._timeline;e._timeline;)e=e._timeline;return e===t._rootFramesTimeline},f.rawTime=function(){return this._paused?this._totalTime:(this._timeline.rawTime()-this._startTime)*this._timeScale},s},!0)}),window._gsDefine&&window._gsQueue.pop()();
/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

if (!window.Seadragon) {
    window.Seadragon = {};
}

// this line overwrites any previous window.Seadragon value in IE before this file
// executes! since this is a global variable, IE does a forward-reference check
// and deletes any global variables which are declared through var. so for now,
// every piece of code that references Seadragon will just have to implicitly
// refer to window.Seadragon and not this global variable Seadragon.
// UPDATE: re-adding this since we're now wrapping all the code in a function.
var Seadragon = window.Seadragon;

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonConfig = Seadragon.Config;

(function() {
    
    // DUPLICATION CHECK -- necessary to prevent overwriting user changes
    if (SeadragonConfig) {
        return;
    }

    SeadragonConfig = Seadragon.Config = {
        
        debugMode: false,
        
        animationTime: 1.5,
        
        blendTime: 0.5,
        
        alwaysBlend: false,
        
        autoHideControls: true,
        
        constrainDuringPan: true,
        
        immediateRender: false,
        
        logarithmicZoom: true,
        
        wrapHorizontal: false,
        
        wrapVertical: false,
        
        wrapOverlays: false,
        
        transformOverlays: false,
        
        // for backwards compatibility, keeping this around and defaulting to null.
        // if it ever has a non-null value, that means it was explicitly set.
        minZoomDimension: null,
        
        minZoomImageRatio: 0.8,
        
        maxZoomPixelRatio: 2,
        
        visibilityRatio: 0.8,
        
        springStiffness: 5.0,
        
        imageLoaderLimit: 2, 
        
        clickTimeThreshold: 200,
        
        clickDistThreshold: 25, // square of real distance
        
        zoomPerClick: 2.0,
        
        zoomPerScroll: Math.pow(2, 1/3),
        
        zoomPerSecond: 2.0,
        
        proxyUrl: null,
        
        imagePath: "img/",
        
        fps: 60

    };

})();

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonStrings = Seadragon.Strings;

(function() {

    if (SeadragonStrings) {
        return;     // don't overwrite any strings that may have been added or changed
    }

    SeadragonStrings = Seadragon.Strings = {
        
        Errors: {
            Failure: "Sorry, but Seadragon Ajax can't run on your browser!\n" +
                    "Please try using IE 8 or Firefox 3.\n",
            Dzc: "Sorry, we don't support Deep Zoom Collections!",
            Dzi: "Hmm, this doesn't appear to be a valid Deep Zoom Image.",
            Xml: "Hmm, this doesn't appear to be a valid Deep Zoom Image.",
            Empty: "You asked us to open nothing, so we did just that.",
            ImageFormat: "Sorry, we don't support {0}-based Deep Zoom Images.",
            Security: "It looks like a security restriction stopped us from " +
                    "loading this Deep Zoom Image.",
            Status: "This space unintentionally left blank ({0} {1}).",
            Unknown: "Whoops, something inexplicably went wrong. Sorry!"
        },
        
        Messages: {
            Loading: "Loading..."
        },
        
        Tooltips: {
            FullPage: "Toggle full page",
            Home: "Go home",
            ZoomIn: "Zoom in (you can also use your mouse's scroll wheel)",
            ZoomOut: "Zoom out (you can also use your mouse's scroll wheel)"
        }
        
    };

    SeadragonStrings.getString = function(prop) {
        var props = prop.split('.');
        var string = SeadragonStrings;
        
        // get property, which may contain dots, meaning subproperty
        for (var i = 0; i < props.length; i++) {
            string = string[props[i]] || {};    // in case not a subproperty
        }
        
        // in case the string didn't exist
        if (typeof(string) != "string") {
            string = "";
        }
        
        // regular expression and lambda technique from:
        // http://frogsbrain.wordpress.com/2007/04/28/javascript-stringformat-method/#comment-236
        var args = arguments;
        return string.replace(/\{\d+\}/g, function(capture) {
            var i = parseInt(capture.match(/\d+/)) + 1;
            return i < args.length ? args[i] : "";
        });
    };

    SeadragonStrings.setString = function(prop, value) {
        var props = prop.split('.');
        var container = SeadragonStrings;
        
        // get property's container, up to but not after last dot
        for (var i = 0; i < props.length - 1; i++) {
            if (!container[props[i]]) {
                container[props[i]] = {};
            }
            container = container[props[i]];
        }
        
        container[props[i]] = value;
    };

})();

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonDebug = function () {

    // Methods

    this.log = function (msg, important) {
        var console = window.console || {};
        var debug = SeadragonConfig.debugMode;

        if (debug && console.log) {
            console.log(msg);
        } else if (debug && important) {
            alert(msg);
        }
    };

    this.error = function (msg, e) {
        var console = window.console || {};
        var debug = SeadragonConfig.debugMode;

        if (debug && console.error) {
            console.error(msg);
        } else if (debug) {
            alert(msg);
        }

        if (debug) {
            // since we're debugging, fail fast by crashing
            throw e || new Error(msg);
        }
    };

    this.fail = function (msg) {
        alert(SeadragonStrings.getString("Errors.Failure"));
        throw new Error(msg);
    };

};

// Seadragon.Debug is a static class, so make it singleton instance
SeadragonDebug = Seadragon.Debug = new SeadragonDebug();

/*************/

//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonProfiler = Seadragon.Profiler = function() {
    
    // Fields
    
    var self = this;
    
    var midUpdate = false;
    var numUpdates = 0;
    
    var lastBeginTime = null;
    var lastEndTime = null;
    
    var minUpdateTime = Infinity;
    var avgUpdateTime = 0;
    var maxUpdateTime = 0;
    
    var minIdleTime = Infinity;
    var avgIdleTime = 0;
    var maxIdleTime = 0;
    
    // Methods -- UPDATE TIME ACCESSORS
    
    this.getAvgUpdateTime = function() {
        return avgUpdateTime;
    };
    
    this.getMinUpdateTime = function() {
        return minUpdateTime;
    };
    
    this.getMaxUpdateTime = function() {
        return maxUpdateTime;
    };
    
    // Methods -- IDLING TIME ACCESSORS
    
    this.getAvgIdleTime = function() {
        return avgIdleTime;
    };
    
    this.getMinIdleTime = function() {
        return minIdleTime;
    };
    
    this.getMaxIdleTime = function() {
        return maxIdleTime;
    };
    
    // Methods -- GENERAL ACCESSORS 
    
    this.isMidUpdate = function() {
        return midUpdate;
    };
    
    this.getNumUpdates = function() {
        return numUpdates;
    };
    
    // Methods -- MODIFIERS
    
    this.beginUpdate = function() {
        if (midUpdate) {
            self.endUpdate();
        }
        
        midUpdate = true;
        lastBeginTime = Date.now();
        
        if (numUpdates <1) {
            return;     // this is the first update
        }
        
        var time = lastBeginTime - lastEndTime;
        
        avgIdleTime = (avgIdleTime * (numUpdates - 1) + time) / numUpdates;
        
        if (time < minIdleTime) {
            minIdleTime = time;
        }
        if (time > maxIdleTime) {
            maxIdleTime = time;
        }
    };
    
    this.endUpdate = function() {
        if (!midUpdate) {
            return;
        }
        
        lastEndTime = Date.now();
        midUpdate = false;
        
        var time = lastEndTime - lastBeginTime;
        
        numUpdates++;
        avgUpdateTime = (avgUpdateTime * (numUpdates - 1) + time) / numUpdates;
        
        if (time < minUpdateTime) {
            minUpdateTime = time;
        }
        if (time > maxUpdateTime) {
            maxUpdateTime = time;
        }
    };
    
    this.clearProfile = function() {
        midUpdate = false;
        numUpdates = 0;
        
        lastBeginTime = null;
        lastEndTime = null;
        
        minUpdateTime = Infinity;
        avgUpdateTime = 0;
        maxUpdateTime = 0;
        
        minIdleTime = Infinity;
        avgIdleTime = 0;
        maxIdleTime = 0;
    };
    
};

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonPoint = Seadragon.Point;

(function() {
    
    // preventing duplicate definitions because our code checks instanceof
    // SeadragonPoint, and that breaks if Seadragon.Point is redefined!
    if (SeadragonPoint) {
        return;
    }

    SeadragonPoint = Seadragon.Point = function(x, y) {
        
        // Properties
        
        this.x = typeof(x) == "number" ? x : 0;
        this.y = typeof(y) == "number" ? y : 0;
        
    };

    // Methods
    
    var SDPointPrototype = SeadragonPoint.prototype;

    SDPointPrototype.plus = function(point) {
        return new SeadragonPoint(this.x + point.x, this.y + point.y);
    };

    SDPointPrototype.minus = function(point) {
        return new SeadragonPoint(this.x - point.x, this.y - point.y);
    };

    SDPointPrototype.times = function(factor) {
        return new SeadragonPoint(this.x * factor, this.y * factor);
    };

    SDPointPrototype.divide = function(factor) {
        return new SeadragonPoint(this.x / factor, this.y / factor);
    };

    SDPointPrototype.negate = function() {
        return new SeadragonPoint(-this.x, -this.y);
    };

    SDPointPrototype.distanceTo = function(point) {
        return Math.sqrt(Math.pow(this.x - point.x, 2) +
                        Math.pow(this.y - point.y, 2));
    };

    SDPointPrototype.distance2To = function (point) {
        return Math.pow(this.x - point.x, 2) + Math.pow(this.y - point.y, 2);
    }

    SDPointPrototype.apply = function(func) {
        return new SeadragonPoint(func(this.x), func(this.y));
    };

    SDPointPrototype.equals = function(point) {
        return (point instanceof SeadragonPoint) &&
                (this.x === point.x) && (this.y === point.y);
    };

    SDPointPrototype.toString = function() {
        return "(" + this.x + "," + this.y + ")";
    };

})();

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonRect = Seadragon.Rect;

(function () {
    
    // preventing duplicate definitions because our code checks instanceof
    // SeadragonRect, and that breaks if Seadragon.Rect is redefined!
    if (SeadragonRect) {
        return;
    }

    SeadragonRect = Seadragon.Rect = function(x, y, width, height) {
        
        // Properties
        
        this.x = typeof(x) == "number" ? x : 0;
        this.y = typeof(y) == "number" ? y : 0;
        this.width = typeof(width) == "number" ? width : 0;
        this.height = typeof(height) == "number" ? height : 0;

    };
    
    // Methods
    
    var SDRectPrototype = SeadragonRect.prototype;
    
    SDRectPrototype.getAspectRatio = function() {
        return this.width / this.height;
    };
    
    SDRectPrototype.getTopLeft = function() {
        return new SeadragonPoint(this.x, this.y);
    };
    
    SDRectPrototype.getBottomRight = function() {
        return new SeadragonPoint(this.x + this.width, this.y + this.height);
    };
    
    SDRectPrototype.getCenter = function() {
        return new SeadragonPoint(this.x + this.width / 2.0,
                        this.y + this.height / 2.0);
    };
    
    SDRectPrototype.getSize = function() {
        return new SeadragonPoint(this.width, this.height);
    };
    
    SDRectPrototype.equals = function(other) {
        return (other instanceof SeadragonRect) &&
                (this.x === other.x) && (this.y === other.y) &&
                (this.width === other.width) && (this.height === other.height);
    };
    
    SDRectPrototype.toString = function() {
        return "[" + this.x + "," + this.y + "," + this.width + "x" +
                this.height + "]";
    };

})();

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonSpring = Seadragon.Spring = function(initialValue) {
    
    // Fields
    
    var currentValue = typeof(initialValue) == "number" ? initialValue : 0;
    var startValue = currentValue;
    var targetValue = currentValue;
    
    var currentTime = Date.now(); // always work in milliseconds
    var startTime = currentTime;
    var targetTime = currentTime;
    
    // Helpers
    
    /**
     * Transform from linear [0,1] to spring [0,1].
     */
    function transform(x) {
        var s = SeadragonConfig.springStiffness;
        return (1.0 - Math.exp(-x * s)) / (1.0 - Math.exp(-s));
    }
    
    // Methods
    
    this.getCurrent = function() {
        return currentValue;
    };
    
    this.getTarget = function() {
        return targetValue;
    };
    
    this.resetTo = function(target) {
        targetValue = target;
        targetTime = currentTime;
        startValue = targetValue;
        startTime = targetTime;
    };
    
    this.springTo = function(target) {
        startValue = currentValue;
        startTime = currentTime;
        targetValue = target;
        targetTime = startTime + 1000 * SeadragonConfig.animationTime;
    };
    
    this.shiftBy = function(delta) {
        startValue += delta;
        targetValue += delta;
    };
    
    this.update = function() {
        currentTime = Date.now();
        currentValue = (currentTime >= targetTime) ? targetValue :
                startValue + (targetValue - startValue) *
                transform((currentTime - startTime) / (targetTime - startTime));
    };
    
};

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonBrowser = Seadragon.Browser = {
    UNKNOWN: 0,
    IE: 1,
    FIREFOX: 2,
    SAFARI: 3,
    CHROME: 4,
    OPERA: 5
};

var SeadragonUtils = function() {
    
    // Fields
    
    var self = this;
    
    var arrActiveX = ["Msxml2.XMLHTTP", "Msxml3.XMLHTTP", "Microsoft.XMLHTTP"];
    var supportedImageFormats = {
        "bmp": false,
        "jpeg": true,
        "jpg": true,
        "png": true,
        "tif": false,
        "wdp": false
    };
    
    var browser = SeadragonBrowser.UNKNOWN;
    var browserVersion = 0;
    var badAlphaBrowser = false;    // updated in constructor
    
    var urlParams = {};
    
    // Constructor
    
    (function() {
        
        // Browser detect
        
        var app = navigator.appName;
        var ver = navigator.appVersion;
        var ua = navigator.userAgent;
        
        if (app == "Microsoft Internet Explorer" &&
                !!window.attachEvent && !!window.ActiveXObject) {
            
            var ieOffset = ua.indexOf("MSIE");
            browser = SeadragonBrowser.IE;
            browserVersion = parseFloat(
                    ua.substring(ieOffset + 5, ua.indexOf(";", ieOffset)));
            
            // update: for intranet sites and compat view list sites, IE sends
            // an IE7 User-Agent to the server to be interoperable, and even if
            // the page requests a later IE version, IE will still report the
            // IE7 UA to JS. we should be robust to this.
            var docMode = document.documentMode;
            if (typeof docMode !== "undefined") {
                browserVersion = docMode;
            }
            
        } else if (app == "Netscape" && !!window.addEventListener) {
            
            var ffOffset = ua.indexOf("Firefox");
            var saOffset = ua.indexOf("Safari");
            var chOffset = ua.indexOf("Chrome");
            
            if (ffOffset >= 0) {
                browser = SeadragonBrowser.FIREFOX;
                browserVersion = parseFloat(ua.substring(ffOffset + 8));
            } else if (saOffset >= 0) {
                var slash = ua.substring(0, saOffset).lastIndexOf("/");
                browser = (chOffset >= 0) ? SeadragonBrowser.CHROME : SeadragonBrowser.SAFARI;
                browserVersion = parseFloat(ua.substring(slash + 1, saOffset));
            }
            
        } else if (app == "Opera" && !!window.opera && !!window.attachEvent) {
            
            browser = SeadragonBrowser.OPERA;
            browserVersion = parseFloat(ver);
            
        }
        
        // Url parameters
        
        var query = window.location.search.substring(1);    // ignore '?'
        var parts = query.split('&');
        
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            var sep = part.indexOf('=');
            
            if (sep > 0) {
                urlParams[part.substring(0, sep)] =
                        decodeURIComponent(part.substring(sep + 1));
            }
        }
        
        // Browser behaviors
        
        // update: chrome 2 no longer has this problem! and now same with IE9!
        badAlphaBrowser =
                (browser == SeadragonBrowser.IE && browserVersion < 9) ||
                (browser == SeadragonBrowser.CHROME && browserVersion < 2);
        
    })();
    
    // Helpers
    
    function getOffsetParent(elmt, isFixed) {
        // IE and Opera "fixed" position elements don't have offset parents.
        // regardless, if it's fixed, its offset parent is the body.
        if (isFixed && elmt != document.body) {
            return document.body;
        } else {
            return elmt.offsetParent;
        }
    }
    
    // Methods
    
    this.getBrowser = function() {
        return browser;
    };
    
    this.getBrowserVersion = function() {
        return browserVersion;
    };
    
    this.getElement = function(elmt) {
        if (typeof(elmt) == "string") {
            elmt = document.getElementById(elmt);
        }
        
        return elmt;
    };
    
    this.getElementPosition = function(elmt) {
        var elmt = self.getElement(elmt);
        var result = new SeadragonPoint();
        
        // technique from:
        // http://www.quirksmode.org/js/findpos.html
        // with special check for "fixed" elements.
        
        var isFixed = self.getElementStyle(elmt).position == "fixed";
        var offsetParent = getOffsetParent(elmt, isFixed);
        
        while (offsetParent) {
            result.x += elmt.offsetLeft;
            result.y += elmt.offsetTop;
            
            if (isFixed) {
                result = result.plus(self.getPageScroll());
            }
            
            elmt = offsetParent;
            isFixed = self.getElementStyle(elmt).position == "fixed";
            offsetParent = getOffsetParent(elmt, isFixed);
        }
        
        return result;
    };
    
    this.getElementSize = function(elmt) {
        var elmt = self.getElement(elmt);
        return new SeadragonPoint(elmt.clientWidth, elmt.clientHeight);
    };
    
    this.getElementStyle = function(elmt) {
        var elmt = self.getElement(elmt);
        
        if (elmt.currentStyle) {
            return elmt.currentStyle;
        } else if (window.getComputedStyle) {
            return window.getComputedStyle(elmt, "");
        } else {
            SeadragonDebug.fail("Unknown element style, no known technique.");
        }
    };
    
    this.getEvent = function(event) {
        return event ? event : window.event;
    };
    
    this.getMousePosition = function(event) {
        var event = self.getEvent(event);
        var result = new SeadragonPoint();
        
        // technique from:
        // http://www.quirksmode.org/js/events_properties.html
        
        if (event.type == "DOMMouseScroll" &&
                browser == SeadragonBrowser.FIREFOX && browserVersion < 3) {
            // hack for FF2 which reports incorrect position for mouse scroll
            result.x = event.screenX;
            result.y = event.screenY;
        } else if (typeof(event.pageX) == "number") {
           result.x = event.pageX;
            result.y = event.pageY;
        } else if (typeof(event.clientX) == "number") {
            result.x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            result.y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        } else {
            SeadragonDebug.fail("Unknown event mouse position, no known technique.");
        }
        
        return result;
    };
    
    this.getMouseScroll = function(event) {
        var event = self.getEvent(event);
        var delta = 0; // default value
        
        // technique from:
        // http://blog.paranoidferret.com/index.php/2007/10/31/javascript-tutorial-the-scroll-wheel/
        
        if (typeof(event.wheelDelta) == "number") {
            delta = event.wheelDelta;
        } else if (typeof(event.detail) == "number") {
            delta = event.detail * -1;
        } else {
            SeadragonDebug.fail("Unknown event mouse scroll, no known technique.");
        }
        
        // normalize value to [-1, 1]
        return delta ? delta / Math.abs(delta) : 0;
    };
    
    this.getPageScroll = function() {
        var result = new SeadragonPoint();
        var docElmt = document.documentElement || {};
        var body = document.body || {};
        
        // technique from:
        // http://www.howtocreate.co.uk/tutorials/javascript/browserwindow
        
        if (typeof(window.pageXOffset) == "number") {
            // most browsers
            result.x = window.pageXOffset;
            result.y = window.pageYOffset;
        } else if (body.scrollLeft || body.scrollTop) {
            // W3C spec, IE6+ in quirks mode
            result.x = body.scrollLeft;
            result.y = body.scrollTop;
        } else if (docElmt.scrollLeft || docElmt.scrollTop) {
            // IE6+ in standards mode
            result.x = docElmt.scrollLeft;
            result.y = docElmt.scrollTop;
        }
        
        // note: we specifically aren't testing for typeof here, because IE sets
        // the appropriate variables undefined instead of 0 under certain
        // conditions. this means we also shouldn't fail if none of the three
        // cases are hit; we'll just assume the page scroll is 0.
        
        return result;
    };
    
    this.getWindowSize = function() {
        var result = new SeadragonPoint();
        var docElmt = document.documentElement || {};
        var body = document.body || {};
        
        // technique from:
        // http://www.howtocreate.co.uk/tutorials/javascript/browserwindow
        
        // important: i originally cleaned up the second and third IE checks to
        // check if the typeof was number. but this fails for quirks mode,
        // because docElmt.clientWidth is indeed a number, but it's incorrectly
        // zero. so no longer checking typeof is number for those cases.
        
        if (typeof(window.innerWidth) == 'number') {
            // non-IE browsers
            result.x = window.innerWidth;
            result.y = window.innerHeight;
        } else if (docElmt.clientWidth || docElmt.clientHeight) {
            // IE6+ in standards mode
            result.x = docElmt.clientWidth;
            result.y = docElmt.clientHeight;
        } else if (body.clientWidth || body.clientHeight) {
            // IE6+ in quirks mode
            result.x = body.clientWidth;
            result.y = body.clientHeight;
        } else {
            SeadragonDebug.fail("Unknown window size, no known technique.");
        }
        
        return result;
    };
    
    this.imageFormatSupported = function(ext) {
        var ext = ext ? ext : "";
        return !!supportedImageFormats[ext.toLowerCase()];
    };
    
    this.makeCenteredNode = function(elmt) {
        var elmt = SeadragonUtils.getElement(elmt);
        var div = self.makeNeutralElement("div");
        var html = [];
        
        // technique for vertically centering (in IE!!!) from:
        // http://www.jakpsatweb.cz/css/css-vertical-center-solution.html
        // with explicit neutralizing of styles added by me.
        html.push('<div style="display:table; height:100%; width:100%;');
        html.push('border:none; margin:0px; padding:0px;'); // neutralizing
        html.push('#position:relative; overflow:hidden; text-align:left;">');
            // the text-align:left guards against incorrect centering in IE
        html.push('<div style="#position:absolute; #top:50%; width:100%; ');
        html.push('border:none; margin:0px; padding:0px;'); // neutralizing
        html.push('display:table-cell; vertical-align:middle;">');
        html.push('<div style="#position:relative; #top:-50%; width:100%; ');
        html.push('border:none; margin:0px; padding:0px;'); // neutralizing
        html.push('text-align:center;"></div></div></div>');
        
        div.innerHTML = html.join('');
        div = div.firstChild;
        
        // now add the element as a child to the inner-most div
        var innerDiv = div;
        var innerDivs = div.getElementsByTagName("div");
        while (innerDivs.length > 0) {
            innerDiv = innerDivs[0];
            innerDivs = innerDiv.getElementsByTagName("div");
        }
        
        innerDiv.appendChild(elmt);
        
        return div;
    };
    
    this.makeNeutralElement = function(tagName) {
        var elmt = document.createElement(tagName);
        var style = elmt.style;
        
        // TODO reset neutral element's style in a better way
        style.background = "transparent none";
        style.border = "none";
        style.margin = "0px";
        style.padding = "0px";
        style.position = "static";
        
        return elmt;
    };
    
    this.makeTransparentImage = function(src) {
        var img = self.makeNeutralElement("img");
        var elmt = null;
        
        if (browser == SeadragonBrowser.IE && browserVersion < 7) {
            elmt = self.makeNeutralElement("span");
            elmt.style.display = "inline-block";
            
            // to size span correctly, load image and get natural size,
            // but don't override any user-set CSS values
            img.onload = function() {
                elmt.style.width = elmt.style.width || img.width + "px";
                elmt.style.height = elmt.style.height || img.height + "px";
                
                img.onload = null;
                img = null;     // to prevent memory leaks in IE
            };
            
            img.src = src;
            elmt.style.filter =
                    "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" +
                    src + "', sizingMethod='scale')";
        } else {
            elmt = img;
            elmt.src = src;
        }
        
        return elmt;
    };
    
    this.setElementOpacity = function(elmt, opacity, usesAlpha) {
        var elmt = self.getElement(elmt);
        
        if (usesAlpha && badAlphaBrowser) {
            // images with alpha channels won't fade well, so round
            opacity = Math.round(opacity);
        }
        
        // for CSS opacity browsers, remove opacity value if it's unnecessary
        if (opacity < 1) {
            elmt.style.opacity = opacity;
        } else {
            elmt.style.opacity = "";
        }
        
        // for CSS filter browsers (IE), remove alpha filter if it's unnecessary.
        // update: doing this always since IE9 beta seems to have broken the
        // behavior if we rely on the programmatic filters collection.
        var prevFilter = elmt.style.filter || "";
        elmt.style.filter = prevFilter.replace(/[\s]*alpha\(.*?\)[\s]*/g, "");
                // important: note the lazy star! this protects against
                // multiple filters; we don't want to delete the other ones.
                // update: also trimming extra whitespace around filter.
        
        if (opacity >= 1) {
            return;
        }
        
        var ieOpacity = Math.round(100 * opacity);
        var ieFilter = " alpha(opacity=" + ieOpacity + ") ";
        
        elmt.style.filter += ieFilter;
        
        // old way -- seems to have broken in IE9's compatibiliy mode:
        // check if this element has filters associated with it (IE only),
        // but prevent bug where IE throws error "Member not found" sometimes.
        //try {
        //    if (elmt.filters && elmt.filters.alpha) {
        //        elmt.filters.alpha.opacity = ieOpacity;
        //    } else {
        //        elmt.style.filter += ieFilter;
        //    }
        //} catch (e) {
        //    elmt.style.filter += ieFilter;
        //}
    };
    
    this.addEvent = function(elmt, eventName, handler, useCapture) {
        var elmt = self.getElement(elmt);
        
        // technique from:
        // http://blog.paranoidferret.com/index.php/2007/08/10/javascript-working-with-events/
        
        if (elmt.addEventListener) {
            if (eventName == "mousewheel") {
                elmt.addEventListener("DOMMouseScroll", handler, useCapture);
            }
            // we are still going to add the mousewheel -- not a mistake!
            // this is for opera, since it uses onmousewheel but needs addEventListener.
            elmt.addEventListener(eventName, handler, useCapture);
        } else if (elmt.attachEvent) {
            elmt.attachEvent("on" + eventName, handler);
            if (useCapture && elmt.setCapture) {
                elmt.setCapture();
            }
        } else {
            SeadragonDebug.fail("Unable to attach event handler, no known technique.");
        }
    };
    
    this.removeEvent = function(elmt, eventName, handler, useCapture) {
        var elmt = self.getElement(elmt);
        
        // technique from:
        // http://blog.paranoidferret.com/index.php/2007/08/10/javascript-working-with-events/
        
        if (elmt.removeEventListener) {
            if (eventName == "mousewheel") {
                elmt.removeEventListener("DOMMouseScroll", handler, useCapture);
            }
            // we are still going to remove the mousewheel -- not a mistake!
            // this is for opera, since it uses onmousewheel but needs removeEventListener.
            elmt.removeEventListener(eventName, handler, useCapture);
        } else if (elmt.detachEvent) {
            elmt.detachEvent("on" + eventName, handler);
            if (useCapture && elmt.releaseCapture) {
                elmt.releaseCapture();
            }
        } else {
            SeadragonDebug.fail("Unable to detach event handler, no known technique.");
        }
    };
    
    this.cancelEvent = function(event) {
        var event = self.getEvent(event);
        
        // technique from:
        // http://blog.paranoidferret.com/index.php/2007/08/10/javascript-working-with-events/
        
        if (event.preventDefault) {
            event.preventDefault();     // W3C for preventing default
        }
        
        event.cancel = true;            // legacy for preventing default
        event.returnValue = false;      // IE for preventing default
    };
    
    this.stopEvent = function(event) {
        var event = self.getEvent(event);
        
        // technique from:
        // http://blog.paranoidferret.com/index.php/2007/08/10/javascript-working-with-events/
        
        if (event.stopPropagation) {
            event.stopPropagation();    // W3C for stopping propagation
        }
        
        event.cancelBubble = true;      // IE for stopping propagation
    };
    
    this.createCallback = function(object, method) {
        // create callback args
        var initialArgs = [];
        for (var i = 2; i < arguments.length; i++) {
            initialArgs.push(arguments[i]);
        }
        
        // create closure to apply method
        return function() {
            // concatenate new args, but make a copy of initialArgs first
            var args = initialArgs.concat([]);
            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            
            return method.apply(object, args);
        };
    };
    
    this.getUrlParameter = function(key) {
        var value = urlParams[key];
        return value ? value : null;
    };
    
    this.makeAjaxRequest = function(url, callback) {
        var async = typeof(callback) == "function";
        var req = null;
        
        if (async) {
            var actual = callback;
            var callback = function() {
                window.setTimeout(SeadragonUtils.createCallback(null, actual, req), 1);
            };
        }
        
        if (false&&window.ActiveXObject) {
            for (var i = 0; i < arrActiveX.length; i++) {
                try {
                    req = new ActiveXObject(arrActiveX[i]);
                    break;
                } catch (e) {
                    continue;
                }
            }
        } else if (window.XMLHttpRequest) {
            req = new XMLHttpRequest();
        }
        
        if (!req) {
            SeadragonDebug.fail("Browser doesn't support XMLHttpRequest.");
        }
        
        // Proxy support
        if (SeadragonConfig.proxyUrl) {
            url = SeadragonConfig.proxyUrl + url;
        }
        
        if (async) {
            req.onreadystatechange = function() {
                if (req.readyState == 4) {
                    // prevent memory leaks by breaking circular reference now
                    req.onreadystatechange = new Function();
                    callback();
                }
            };
        }
        
        try {
            req.open("GET", url, async);
            req.send(null);
        } catch (e) {
            SeadragonDebug.log(e.name + " while making AJAX request: " + e.message);
            
            req.onreadystatechange = null;
            req = null;
            
            if (async) {
                callback();
            }
        }
        
        return async ? null : req;
    };
    
    this.parseXml = function(string) {
        var xmlDoc = null;
        
        if (window.ActiveXObject) {
            try {
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(string);
            } catch (e) {
                SeadragonDebug.log(e.name + " while parsing XML (ActiveX): " + e.message);
                console.log("error creating ActiveXObject in Seadragon.Utils parseXml");
            }
        } else if (window.DOMParser) {
            try {
                var parser = new DOMParser();
                xmlDoc = parser.parseFromString(string, "text/xml");
            } catch (e) {
                SeadragonDebug.log(e.name + " while parsing XML (DOMParser): " + e.message);
            }
        } else {
            SeadragonDebug.fail("Browser doesn't support XML DOM.");
        }
        
        return xmlDoc;
    };
    
};

// Seadragon.Utils is a static class, so make it singleton instance
SeadragonUtils = Seadragon.Utils = new SeadragonUtils();

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonMouseTracker = Seadragon.MouseTracker;

(function() {
    
    // DUPLICATION CHECK -- necessary here because of private static state
    if (SeadragonMouseTracker) {
        return;
    }
    
    // Constants
    
    // update: IE9 implements the W3C standard event model! =)
    var lteIE8 = SeadragonUtils.getBrowser() == SeadragonBrowser.IE &&
        SeadragonUtils.getBrowserVersion() < 9;
    
    // Static fields
    
    var buttonDownAny = false;
    
    var ieCapturingAny = false;
    var ieTrackersActive = {};      // dictionary from hash to MouseTracker
    var ieTrackersCapturing = [];   // list of trackers interested in capture
    
    // Static helpers
    
    function getMouseAbsolute(event) {
        return SeadragonUtils.getMousePosition(event);
    }
    
    function getMouseRelative(event, elmt) {
        var mouse = SeadragonUtils.getMousePosition(event);
        var offset = SeadragonUtils.getElementPosition(elmt);
        
        return mouse.minus(offset);
    }
    
    /**
     * Returns true if elmtB is a child node of elmtA, or if they're equal.
     */
    function isChild(elmtA, elmtB) {
        var body = document.body;
        while (elmtB && elmtA != elmtB && body != elmtB) {
            try {
                elmtB = elmtB.parentNode;
            } catch (e) {
                // Firefox sometimes fires events for XUL elements, which throws
                // a "permission denied" error. so this is not a child.
                return false;
            }
        }
        return elmtA == elmtB;
    }
    
    function onGlobalMouseDown() {
        buttonDownAny = true;
    }
    
    function onGlobalMouseUp() {
        buttonDownAny = false;
    }
    
    // Static constructor
    
    (function () {
        // the W3C event model lets us listen to the capture phase of events, so
        // to know if the mouse is globally up or down, we'll listen to the
        // capture phase of the window's events. we can't do this in IE, so
        // we'll give it a best effort by listening to the regular bubble phase,
        // and on the document since window isn't legal in IE for mouse events.
        if (lteIE8) {
            SeadragonUtils.addEvent(document, "mousedown", onGlobalMouseDown, false);
            SeadragonUtils.addEvent(document, "mouseup", onGlobalMouseUp, false);
        } else {
            SeadragonUtils.addEvent(window, "mousedown", onGlobalMouseDown, true);
            SeadragonUtils.addEvent(window, "mouseup", onGlobalMouseUp, true);
        }
    })();
    
    // Class
    
    SeadragonMouseTracker = Seadragon.MouseTracker = function(elmt) {
        
        // Fields
        
        var self = this;
        var ieSelf = null;
        
        var hash = Math.random();     // a unique hash for this tracker
        var elmt = SeadragonUtils.getElement(elmt);
        
        var tracking = false;
        var capturing = false;
        var buttonDownElmt = false;
        var insideElmt = false;
        
        var lastPoint = null;           // position of last mouse down/move
        var lastMouseDownTime = null;   // time of last mouse down
        var lastMouseDownPoint = null;  // position of last mouse down
        
        // Properties
        
        this.target = elmt;
        this.enterHandler = null;       // function(tracker, position, buttonDownElmt, buttonDownAny)
        this.exitHandler = null;        // function(tracker, position, buttonDownElmt, buttonDownAny)
        this.pressHandler = null;       // function(tracker, position)
        this.releaseHandler = null;     // function(tracker, position, insideElmtPress, insideElmtRelease)
        this.clickHandler = null;       // function(tracker, position, quick, shift)
        this.dragHandler = null;        // function(tracker, position, delta, shift)
        this.scrollHandler = null;      // function(tracker, position, scroll, shift)
        
        // Helpers
        
        function startTracking() {
            if (!tracking) {
                SeadragonUtils.addEvent(elmt, "mouseover", onMouseOver, false);
                SeadragonUtils.addEvent(elmt, "mouseout", onMouseOut, false);
                SeadragonUtils.addEvent(elmt, "mousedown", onMouseDown, false);
                SeadragonUtils.addEvent(elmt, "mouseup", onMouseUp, false);
                SeadragonUtils.addEvent(elmt, "mousewheel", onMouseScroll, false);
                SeadragonUtils.addEvent(elmt, "click", onMouseClick, false);
                
                tracking = true;
                ieTrackersActive[hash] = ieSelf;
            }
        }
        
        function stopTracking() {
            if (tracking) {
                SeadragonUtils.removeEvent(elmt, "mouseover", onMouseOver, false);
                SeadragonUtils.removeEvent(elmt, "mouseout", onMouseOut, false);
                SeadragonUtils.removeEvent(elmt, "mousedown", onMouseDown, false);
                SeadragonUtils.removeEvent(elmt, "mouseup", onMouseUp, false);
                SeadragonUtils.removeEvent(elmt, "mousewheel", onMouseScroll, false);
                SeadragonUtils.removeEvent(elmt, "click", onMouseClick, false);
                
                releaseMouse();
                tracking = false;
                delete ieTrackersActive[hash];
            }
        }
        
        function captureMouse() {
            if (!capturing) {
                // IE lets the element capture the mouse directly, but other
                // browsers use the capture phase on the highest element.
                if (lteIE8) {
                    // we need to capture the mouse, but we also don't want to
                    // handle mouseup like normally (special case for bubbling)
                    SeadragonUtils.removeEvent(elmt, "mouseup", onMouseUp, false);
                    SeadragonUtils.addEvent(elmt, "mouseup", onMouseUpIE, true);
                    SeadragonUtils.addEvent(elmt, "mousemove", onMouseMoveIE, true);
                } else {
                    SeadragonUtils.addEvent(window, "mouseup", onMouseUpWindow, true);
                    SeadragonUtils.addEvent(window, "mousemove", onMouseMove, true);
                }
                
                capturing = true;
            }
        }
        
        function releaseMouse() {
            if (capturing) {
                // similar reasoning as captureMouse()
                if (lteIE8) {
                    // we need to release the mouse, and also go back to handling
                    // mouseup like normal (no longer a hack for capture phase)
                    SeadragonUtils.removeEvent(elmt, "mousemove", onMouseMoveIE, true);
                    SeadragonUtils.removeEvent(elmt, "mouseup", onMouseUpIE, true);
                    SeadragonUtils.addEvent(elmt, "mouseup", onMouseUp, false);
                } else {
                    SeadragonUtils.removeEvent(window, "mousemove", onMouseMove, true);
                    SeadragonUtils.removeEvent(window, "mouseup", onMouseUpWindow, true);
                }
                
                capturing = false;
            }
        }
        
        // IE-specific helpers
        
        function triggerOthers(eventName, event) {
            // update: protecting against properties added to the Object class's
            // prototype, which can and does happen (e.g. through js libraries)
            var trackers = ieTrackersActive;
            for (var otherHash in trackers) {
                if (trackers.hasOwnProperty(otherHash) && hash != otherHash) {
                    trackers[otherHash][eventName](event);
                }
            }
        }
        
        function hasMouse() {
            return insideElmt;
        }
        
        // Listeners
        
        function onMouseOver(event) {
            var event = SeadragonUtils.getEvent(event);
            
            // IE capturing model doesn't raise or bubble the events on any
            // other element if we're capturing currently. so pass this event to
            // other elements being tracked so they can adjust if the element
            // was from them or from a child. however, IE seems to always fire
            // events originating from parents to those parents, so don't double
            // fire the event if the event originated from a parent.
            if (lteIE8 && capturing && !isChild(event.srcElement, elmt)) {
                triggerOthers("onMouseOver", event);
            }
            
            // similar to onMouseOut() tricky bubbling case...
            var to = event.target ? event.target : event.srcElement;
            var from = event.relatedTarget ? event.relatedTarget : event.fromElement;
            if (!isChild(elmt, to) || isChild(elmt, from)) {
                // the mouseover needs to end on this or a child node, and it
                // needs to start from this or an outer node.
                return;
            }
            
            insideElmt = true;
           
            if (typeof(self.enterHandler) == "function") {
                try {
                    self.enterHandler(self, getMouseRelative(event, elmt),
                            buttonDownElmt, buttonDownAny);
                } catch (e) {
                    // handler threw an error, ignore
                    SeadragonDebug.error(e.name +
                            " while executing enter handler: " + e.message, e);
                }
            }
        }
        
        function onMouseOut(event) {
            var event = SeadragonUtils.getEvent(event);
            
            // similar to onMouseOver() case for IE capture model
            if (lteIE8 && capturing && !isChild(event.srcElement, elmt)) {
                triggerOthers("onMouseOut", event);
            }
            
            // we have to watch out for a tricky case: a mouseout occurs on a
            // child element, but the mouse is still inside the parent element.
            // the mouseout event will bubble up to us. this happens in all
            // browsers, so we need to correct for this. technique from:
            // http://www.quirksmode.org/js/events_mouse.html
            var from = event.target ? event.target : event.srcElement;
            var to = event.relatedTarget ? event.relatedTarget : event.toElement;
            if (!isChild(elmt, from) || isChild(elmt, to)) {
                // the mouseout needs to start from this or a child node, and it
                // needs to end on this or an outer node.
                return;
            }
            
            insideElmt = false;
            
            if (typeof(self.exitHandler) == "function") {
                try {
                    self.exitHandler(self, getMouseRelative(event, elmt),
                            buttonDownElmt, buttonDownAny);
                } catch (e) {
                    // handler threw an error, ignore
                    SeadragonDebug.error(e.name +
                            " while executing exit handler: " + e.message, e);
                }
            }
        }
        
        function onMouseDown(event) {
            var event = SeadragonUtils.getEvent(event);
            
            // don't consider right-clicks (fortunately this is cross-browser)
            if (event.button == 2) {
                return;
            }
            
            buttonDownElmt = true;
            
            lastPoint = getMouseAbsolute(event);
            lastMouseDownPoint = lastPoint;
            lastMouseDownTime = Date.now();
            
           if (typeof(self.pressHandler) == "function") {
                try {
                    self.pressHandler(self, getMouseRelative(event, elmt));
                } catch (e) {
                    // handler threw an error, ignore
                    SeadragonDebug.error(e.name +
                            " while executing press handler: " + e.message, e);
                }
            }
            
            if (self.pressHandler || self.dragHandler) {
                // if a press or drag handler is registered, don't drag-drop images, etc.
                SeadragonUtils.cancelEvent(event);
            }
            
            if (!lteIE8 || !ieCapturingAny) {
                captureMouse();
                ieCapturingAny = true;
                ieTrackersCapturing = [ieSelf];     // reset to empty & add us
            } else if (lteIE8) {
                ieTrackersCapturing.push(ieSelf);   // add us to the list
            }
        }
        
        function onMouseUp(event) {
            var event = SeadragonUtils.getEvent(event);
            var insideElmtPress = buttonDownElmt;
            var insideElmtRelease = insideElmt;
            
            // don't consider right-clicks (fortunately this is cross-browser)
            if (event.button == 2) {
                return;
            }
            
            buttonDownElmt = false;
            
            if (typeof(self.releaseHandler) == "function") {
                try {
                    self.releaseHandler(self, getMouseRelative(event, elmt),
                            insideElmtPress, insideElmtRelease);
                } catch (e) {
                    // handler threw an error, ignore
                    SeadragonDebug.error(e.name +
                            " while executing release handler: " + e.message, e);
                }
            }
            
            // some browsers sometimes don't fire click events when we're also
            // listening for mouseup events. i'm not sure why, it could be
            // something i'm doing. in the meantime, this is a temporary fix.
            if (insideElmtPress && insideElmtRelease) {
                handleMouseClick(event);
            }
        }
        
        /**
         * Only triggered once by the deepest element that initially received
         * the mouse down event. We want to make sure THIS event doesn't bubble.
         * Instead, we want to trigger the elements that initially received the
         * mouse down event (including this one) only if the mouse is no longer
         * inside them. Then, we want to release capture, and emulate a regular
         * mouseup on the event that this event was meant for.
         */
        function onMouseUpIE(event) {
            var event = SeadragonUtils.getEvent(event);
            
            // don't consider right-clicks (fortunately this is cross-browser)
            if (event.button == 2) {
                return;
            }
            
            // first trigger those that were capturing
            for (var i = 0; i < ieTrackersCapturing.length; i++) {
                var tracker = ieTrackersCapturing[i];
                if (!tracker.hasMouse()) {
                    tracker.onMouseUp(event);
                }
            }
            
            // then release capture and emulate a regular event
            releaseMouse();
            ieCapturingAny = false;
            event.srcElement.fireEvent("on" + event.type,
                    document.createEventObject(event));
            
            // make sure to stop this event -- shouldn't bubble up
            SeadragonUtils.stopEvent(event);
        }
        
        /**
         * Only triggered in W3C browsers by elements within which the mouse was
         * initially pressed, since they are now listening to the window for
         * mouseup during the capture phase. We shouldn't handle the mouseup
         * here if the mouse is still inside this element, since the regular
         * mouseup handler will still fire.
         */
        function onMouseUpWindow(event) {
            if (!insideElmt) {
                onMouseUp(event);
            }
            
            releaseMouse();
        }
        
        function onMouseClick(event) {
            // see onMouseUp() bug -- handleClick() is already called by
            // onMouseUp() as a temporary fix, so don't duplicate the call here.
            
            if (self.clickHandler) {                
                // since a click handler was registered, don't follow href's, etc.
                SeadragonUtils.cancelEvent(event);
            }
        }
        
        function handleMouseClick(event) {
            var event = SeadragonUtils.getEvent(event);
            
            // don't consider right-clicks (fortunately this is cross-browser)
            if (event.button == 2) {
                return;
            }
            
            var time = Date.now() - lastMouseDownTime;
            var point = getMouseAbsolute(event);
            var distance = lastMouseDownPoint.distance2To(point);
            var quick = time <= SeadragonConfig.clickTimeThreshold &&
                    distance <= SeadragonConfig.clickDistThreshold;
            
            if (typeof(self.clickHandler) == "function") {
                try {
                    self.clickHandler(self, getMouseRelative(event, elmt),
                            quick, event.shiftKey);
                } catch (e) {
                    // handler threw an error, ignore
                    SeadragonDebug.error(e.name +
                            " while executing click handler: " + e.message, e);
                }
            }
        }
        
        function onMouseMove(event) {
            var event = SeadragonUtils.getEvent(event);
            var point = getMouseAbsolute(event);
            var delta = point.minus(lastPoint);
            
            lastPoint = point;
            
            if (typeof(self.dragHandler) == "function") {
                try {
                    self.dragHandler(self, getMouseRelative(event, elmt),
                            delta, event.shiftKey);
                } catch (e) {
                    // handler threw an error, ignore
                    SeadragonDebug.error(e.name +
                            " while executing drag handler: " + e.message, e);
                }
                
                // since a drag handler was registered, don't allow highlighting, etc.
                SeadragonUtils.cancelEvent(event);
            }
        }
        
        /**
         * Only triggered once by the deepest element that initially received
         * the mouse down event. Since no other element has captured the mouse,
         * we want to trigger the elements that initially received the mouse
         * down event (including this one).
         */
        function onMouseMoveIE(event) {
            // manually trigger those that are capturing
            for (var i = 0; i < ieTrackersCapturing.length; i++) {
                ieTrackersCapturing[i].onMouseMove(event);
            }
            
            // make sure to stop this event -- shouldn't bubble up. note that at
            // the time of this writing, there is no harm in letting it bubble,
            // but a minor change to our implementation would necessitate this.
            SeadragonUtils.stopEvent(event);
        }
        
        function onMouseScroll(event) {
            var event = SeadragonUtils.getEvent(event);
            var delta = SeadragonUtils.getMouseScroll(event);
            
            if (typeof(self.scrollHandler) == "function") {
                // FF2 and FF3/Mac (possibly others) seem to sometimes fire
                // extraneous scroll events. check for those.
                if (delta) {
                    try {
                        self.scrollHandler(self, getMouseRelative(event, elmt),
                                delta, event.shiftKey);
                    } catch (e) {
                        // handler threw an error, ignore
                        SeadragonDebug.error(e.name +
                                " while executing scroll handler: " + e.message, e);
                    }
                }
                
                // since a scroll handler was registered, don't scroll the page, etc.
                SeadragonUtils.cancelEvent(event);
            }
        }
        
        // Constructor
        
        (function () {
            ieSelf = {
                hasMouse: hasMouse,
                onMouseOver: onMouseOver,
                onMouseOut: onMouseOut,
                onMouseUp: onMouseUp,
                onMouseMove: onMouseMove
            };
        })();
        
        // Methods
        
        this.isTracking = function() {
            return tracking;
        };
        
        this.setTracking = function(track) {
            if (track) {
                startTracking();
            } else {
                stopTracking();
            }
        };
        
    };
    
})();

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonEventManager = Seadragon.EventManager = function() {
    
    // Fields
    
    var listeners = {}; // dictionary of eventName --> array of handlers
    
    // Methods
    
    this.addListener = function(eventName, handler) {
        if (typeof(handler) != "function") {
            return;
        }
        
        if (!listeners[eventName]) {
            listeners[eventName] = [];
        }
        
        listeners[eventName].push(handler);
    };
    
    this.removeListener = function(eventName, handler) {
        var handlers = listeners[eventName];
        
        if (typeof(handler) != "function") {
            return;
        } else if (!handlers) {
            return;
        }
        
        for (var i = 0; i < handlers.length; i++) {
            if (handler == handlers[i]) {
                handlers.splice(i, 1);
                return;
            }
        }
    };
    
    this.clearListeners = function(eventName) {
        if (listeners[eventName]) {
            delete listeners[eventName];
        }
    };
    
    this.trigger = function(eventName) {
        var handlers = listeners[eventName];
        var args = [];
        
        if (!handlers) {
            return;
        }
        
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        
        for (var i = 0; i < handlers.length; i++) {
            try {
                handlers[i].apply(window, args);
            } catch (e) {
                // handler threw an error, ignore, go on to next one
                SeadragonDebug.error(e.name + " while executing " + eventName +
                        " handler: " + e.message, e);
            }
        }
    };
    
};

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonImageLoader;

(function() {
    
    var TIMEOUT = 15000;     // milliseconds after which an image times out
    
    function Job(src, callback) {
        // Fields
        this.src = src;
        this.callback = callback;
        this.image = null;
        this.timeout = null;     // IE8 fix: no finishing event raised sometimes
        this.running = false;
    }

    Job.prototype.start = function () {
        var self = this;
        if (!self.running) {
            self.running = true;
            self.image = new Image();

            var successFunc = function () { self.finish(true); };
            var failureFunc = function () { self.finish(false); };
            var timeoutFunc = function () {
                SeadragonDebug.log("Image timed out: " + self.src);
                self.finish(false);
            };

            self.image.onload = successFunc;
            self.image.onabort = failureFunc;
            self.image.onerror = failureFunc;

            // consider it a failure if the image times out.
            self.timeout = window.setTimeout(timeoutFunc, TIMEOUT);

            self.image.src = self.src;
        }
    };

    Job.prototype.finish = function (success) {
        this.image.onload = null;
        this.image.onabort = null;
        this.image.onerror = null;

        if (this.timeout) {
            window.clearTimeout(this.timeout);
        }

        // call on a timeout to ensure asynchronous behavior
        this.callback(this.src, success ? this.image : null);
    };
    
    SeadragonImageLoader = Seadragon.ImageLoader = function() {
        
        // Fields
        
        var downloading = 0,    // number of Jobs currently downloading
            downloadQueue = []; // Jobs that have yet to be started
        
        // Helpers
        
        function onComplete(callback, src, image) {
            var newdl;
            downloading--;

            // finish loading
            if (typeof (callback) === "function") {
                setTimeout(function () {
                    try {
                        callback(image);
                    } catch (e) {
                        SeadragonDebug.error(e.name + " while executing " + src +
                                " callback: " + e.message, e);
                    }
                }, 2);
            }

            // launch jobs in queue
            while (downloading < SeadragonConfig.imageLoaderLimit && downloadQueue.length > 0) {
                newdl = downloadQueue.shift();
                if (!newdl.tile.loaded) {
                    setTimeout(newdl.job.start(), 2);
                    downloading++;
                }
            }
        }
        
        // Methods
        
        this.loadImage = function(tile, callback) {
            
            var func = SeadragonUtils.createCallback(null, onComplete, callback);
            var job = new Job(tile.url, func);

            // if there are too many jobs, save job to queue
            if (downloading >= SeadragonConfig.imageLoaderLimit) {
                downloadQueue.push({ job: job, tile: tile });
            } else {
                downloading++;
                job.start();
            }
            
            // returning true for now for legacy code
            tile.loading = true;
        };

        this.clear = function () {
            downloadQueue.map(function (v) {
                v.tile.loading = false;
            });
            downloadQueue = [];
        };
        
    };

})();

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonButton,
    SeadragonButtonGroup;

(function() {
    
    // Enumerations
    
    var ButtonState = {
        REST: 0,
        GROUP: 1,
        HOVER: 2,
        DOWN: 3
    };
    
    // Button class
    
    SeadragonButton = Seadragon.Button = function(tooltip,
            srcRest, srcGroup, srcHover, srcDown,
            onPress, onRelease, onClick, onEnter, onExit) {
        
        // Fields
        
        var button = SeadragonUtils.makeNeutralElement("span");
        var currentState = ButtonState.GROUP;
        var tracker = new SeadragonMouseTracker(button);
        
        var imgRest = SeadragonUtils.makeTransparentImage(srcRest);
        var imgGroup = SeadragonUtils.makeTransparentImage(srcGroup);
        var imgHover = SeadragonUtils.makeTransparentImage(srcHover);
        var imgDown = SeadragonUtils.makeTransparentImage(srcDown);
        
        var onPress = typeof(onPress) == "function" ? onPress : null;
        var onRelease = typeof(onRelease) == "function" ? onRelease : null;
        var onClick = typeof(onClick) == "function" ? onClick : null;
        var onEnter = typeof(onEnter) == "function" ? onEnter : null;
        var onExit = typeof(onExit) == "function" ? onExit : null;
        
        var fadeDelay = 0;      // begin fading immediately
        var fadeLength = 2000;  // fade over a period of 2 seconds
        var fadeBeginTime = null;
        var shouldFade = false;
        
        // Properties
        
        this.elmt = button;
        
        // Fading helpers
        
        function scheduleFade() {
            window.setTimeout(updateFade, 20);
        }
        
        function updateFade() {
            if (shouldFade) {
                var currentTime = new Date().getTime();
                var deltaTime = currentTime - fadeBeginTime;
                var opacity = 1.0 - deltaTime / fadeLength;
                
                opacity = Math.min(1.0, opacity);
                opacity = Math.max(0.0, opacity);
                
                SeadragonUtils.setElementOpacity(imgGroup, opacity, true);
                if (opacity > 0) {
                    scheduleFade();    // fade again
                }
            }
        }
        
        function beginFading() {
            shouldFade = true;
            fadeBeginTime = new Date().getTime() + fadeDelay;
            window.setTimeout(scheduleFade, fadeDelay);
        }
        
        function stopFading() {
            shouldFade = false;
            SeadragonUtils.setElementOpacity(imgGroup, 1.0, true);
        }
        
        // State helpers
        
        function inTo(newState) {
            if (newState >= ButtonState.GROUP && currentState == ButtonState.REST) {
                stopFading();
                currentState = ButtonState.GROUP;
            }
            
            if (newState >= ButtonState.HOVER && currentState == ButtonState.GROUP) {
                // important: don't explicitly say "visibility: visible".
                // see note in Viewer.setVisible() for explanation.
                imgHover.style.visibility = "";
                currentState = ButtonState.HOVER;
            }
            
            if (newState >= ButtonState.DOWN && currentState == ButtonState.HOVER) {
                // important: don't explicitly say "visibility: visible".
                // see note in Viewer.setVisible() for explanation.
                imgDown.style.visibility = "";
                currentState = ButtonState.DOWN;
            }
        }
        
        function outTo(newState) {
            if (newState <= ButtonState.HOVER && currentState == ButtonState.DOWN) {
                imgDown.style.visibility = "hidden";
                currentState = ButtonState.HOVER;
            }
            
            if (newState <= ButtonState.GROUP && currentState == ButtonState.HOVER) {
                imgHover.style.visibility = "hidden";
                currentState = ButtonState.GROUP;
            }
            
            if (newState <= ButtonState.REST && currentState == ButtonState.GROUP) {
                //beginFading();
                currentState = ButtonState.REST;
            }
        }
        
        // Tracker helpers
        
        function enterHandler(tracker, position, buttonDownElmt, buttonDownAny) {
            if (buttonDownElmt) {
                inTo(ButtonState.DOWN);
                if (onEnter) {
                    onEnter();
                }
            } else if (!buttonDownAny) {
                inTo(ButtonState.HOVER);
            }
        }
        
        function exitHandler(tracker, position, buttonDownElmt, buttonDownAny) {
            outTo(ButtonState.GROUP);
            if (buttonDownElmt && onExit) {
                onExit();
            }
        }
        
        function pressHandler(tracker, position) {
            inTo(ButtonState.DOWN);
            if (onPress) {
                onPress();
            }
        }
        
        function releaseHandler(tracker, position, insideElmtPress, insideElmtRelease) {
            if (insideElmtPress && insideElmtRelease) {
                outTo(ButtonState.HOVER);
                if (onRelease) {
                    onRelease();
                }
            } else if (insideElmtPress) {
                outTo(ButtonState.GROUP);
            } else {
                // pressed elsewhere, but released on it. if we ignored the
                // enter event because a button was down, activate hover now
                inTo(ButtonState.HOVER);
            }
        }
        
        function clickHandler(tracker, position, quick, shift) {
            if (onClick && quick) {
                onClick();
            }
        }
        
        // Methods
        
        this.notifyGroupEnter = function() {
            inTo(ButtonState.GROUP);
        };
        
        this.notifyGroupExit = function() {
            outTo(ButtonState.REST);
        };
        
        // Constructor
        
        (function() {
            button.style.display = "inline-block";
            button.style.position = "relative";
            button.title = tooltip;
            
            button.appendChild(imgRest);
            button.appendChild(imgGroup);
            button.appendChild(imgHover);
            button.appendChild(imgDown);
            
            var styleRest = imgRest.style;
            var styleGroup = imgGroup.style;
            var styleHover = imgHover.style;
            var styleDown = imgDown.style;
            
            // DON'T position imgRest absolutely -- let it be inline so it fills
            // up the div, sizing the div appropriately
            styleGroup.position = styleHover.position = styleDown.position = "absolute";
            styleGroup.top = styleHover.top = styleDown.top = "0px";
            styleGroup.left = styleHover.left = styleDown.left = "0px";
            styleHover.visibility = styleDown.visibility = "hidden";
                    // rest and group are always visible
            
            // FF2 is very buggy with inline-block. it squashes the button div,
            // making the group-pressed states' images lower than rest. but
            // apparently, clearing the "top" style fixes this. (note that this
            // breaks the buttons in every other browser, so we're not clearing
            // the "top" style by default...)
            if (SeadragonUtils.getBrowser() == SeadragonBrowser.FIREFOX &&
                    SeadragonUtils.getBrowserVersion() < 3) {
                styleGroup.top = styleHover.top = styleDown.top = ""; 
            }
            
            tracker.enterHandler = enterHandler;
            tracker.exitHandler = exitHandler;
            tracker.pressHandler = pressHandler;
            tracker.releaseHandler = releaseHandler;
            tracker.clickHandler = clickHandler;
            
            tracker.setTracking(true);
            outTo(ButtonState.REST);
        })();
        
    };
    
    // ButtonGroup class
    
    SeadragonButtonGroup = Seadragon.ButtonGroup = function(buttons) {
        
       // Fields
        
        var group = SeadragonUtils.makeNeutralElement("span");
        var buttons = buttons.concat([]);   // copy
        var tracker = new SeadragonMouseTracker(group);
        
        // Properties
        
        this.elmt = group;
        
        // Tracker helpers
        
        function enterHandler(tracker, position, buttonDownElmt, buttonDownAny) {
            // somewhat office ribbon style -- we do this regardless of whether
            // the mouse is down from elsewhere. it's a nice soft glow effect.
            for (var i = 0; i < buttons.length; i++) {
                buttons[i].notifyGroupEnter();
            }
        }
        
        function exitHandler(tracker, position, buttonDownElmt, buttonDownAny) {
            if (!buttonDownElmt) {
                // only go to rest if the mouse isn't down from a button
                for (var i = 0; i < buttons.length; i++) {
                    buttons[i].notifyGroupExit();
                }
            }
        }
        
        function releaseHandler(tracker, position, insideElmtPress, insideElmtRelease) {
            if (!insideElmtRelease) {
                // this means was the mouse was inside the div during press, so
                // since it's no longer inside the div during release, it left
                // the div. but onDivExit() ignored it since the mouse was down
                // from the div, so we'll go out to rest state now.
                for (var i = 0; i < buttons.length; i++) {
                    buttons[i].notifyGroupExit();
                }
            }
        }
        
        // Methods
        
        this.emulateEnter = function() {
            enterHandler();
        };
        
        this.emulateExit = function() {
            exitHandler();
        };
        
        // Constructor
        
        (function() {
            group.style.display = "inline-block";
            
            for (var i = 0; i < buttons.length; i++) {
                group.appendChild(buttons[i].elmt);
            }
            
            tracker.enterHandler = enterHandler;
            tracker.exitHandler = exitHandler;
            tracker.releaseHandler = releaseHandler;
            
            tracker.setTracking(true);
        })();
        
    };
    
})();

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonTileSource = Seadragon.TileSource = function(
        width, height, tileSize, tileOverlap, minLevel, maxLevel) {
    
    // Fields
    
    var self = this;
    var normHeight = height / width;
    
    // Properties
    
    this.width = width;
    this.height = height;
    this.aspectRatio = width / height;
    this.dimensions = new SeadragonPoint(width, height);
    this.minLevel = minLevel ? minLevel : 0;
    this.maxLevel = maxLevel ? maxLevel :
            Math.ceil(Math.log(Math.max(width, height)) / Math.log(2));
    this.tileSize = tileSize ? tileSize : 0;
    this.tileOverlap = tileOverlap ? tileOverlap : 0;
    
    // Methods
    
    this.getLevelScale = function(level) {
        // equivalent to Math.pow(0.5, numLevels - level);
        return 1 / (1 << (self.maxLevel - level));
    };
    
    this.getNumTiles = function(level) {
        var scale = self.getLevelScale(level);
        var x = Math.ceil(scale * width / self.tileSize);
        var y = Math.ceil(scale * height / self.tileSize);
        
        return new SeadragonPoint(x, y);
    };
    
    this.getPixelRatio = function(level) {
        var imageSizeScaled = self.dimensions.times(self.getLevelScale(level));
        var rx = 1.0 / imageSizeScaled.x;
        var ry = 1.0 / imageSizeScaled.y;
        
        return new SeadragonPoint(rx, ry);
    };
    
    this.getTileAtPoint = function(level, point) {
        // support wrapping by taking less-than-full tiles into account!
        // this is necessary in order to properly wrap low-res tiles.
        var scaledSize = self.dimensions.times(self.getLevelScale(level));
        var pixel = point.times(scaledSize.x);
        var tx, ty;
        
        // optimize for the non-wrapping case, but support wrapping
        if (point.x >= 0.0 && point.x <= 1.0) {
            tx = Math.floor(pixel.x / self.tileSize);
        } else {
            tx = Math.ceil(scaledSize.x / self.tileSize) * Math.floor(pixel.x / scaledSize.x) +
                    Math.floor(((scaledSize.x + (pixel.x % scaledSize.x)) % scaledSize.x) / self.tileSize);
        }
        
        // same thing vertically
        if (point.y >= 0.0 && point.y <= normHeight) {
            ty = Math.floor(pixel.y / self.tileSize);
        } else {
            ty = Math.ceil(scaledSize.y / self.tileSize) * Math.floor(pixel.y / scaledSize.y) +
                    Math.floor(((scaledSize.y + (pixel.y % scaledSize.y)) % scaledSize.y) / self.tileSize);
        }
        
        return new SeadragonPoint(tx, ty);
    };
    
    this.getTileBounds = function(level, x, y) {
        // work in scaled pixels for this level
        var dimensionsScaled = self.dimensions.times(self.getLevelScale(level));
        
        // find position, adjust for no overlap data on top and left edges
        var px = (x === 0) ? 0 : self.tileSize * x - self.tileOverlap;
        var py = (y === 0) ? 0 : self.tileSize * y - self.tileOverlap;
        
        // find size, adjust for no overlap data on top and left edges
        var sx = self.tileSize + (x === 0 ? 1 : 2) * self.tileOverlap;
        var sy = self.tileSize + (y === 0 ? 1 : 2) * self.tileOverlap;
        
        // adjust size for single-tile levels where the image size is smaller
        // than the regular tile size, and for tiles on the bottom and right
        // edges that would exceed the image bounds
        sx = Math.min(sx, dimensionsScaled.x - px);
        sy = Math.min(sy, dimensionsScaled.y - py);
        
        // finally, normalize...
        // note that isotropic coordinates ==> only dividing by scaled x!
        var scale = 1.0 / dimensionsScaled.x;
        return new SeadragonRect(px * scale, py * scale, sx * scale, sy * scale);
    };
    
    this.getTileUrl = function(level, x, y) {
        throw new Error("Method not implemented.");
    };
    
    this.tileExists = function(level, x, y) {
        var numTiles = self.getNumTiles(level);
        return level >= self.minLevel && level <= self.maxLevel &&
                x >= 0 && y >= 0 && x < numTiles.x && y < numTiles.y;
    };
    
};

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonDisplayRect = Seadragon.DisplayRect = function(x, y, width, height, minLevel, maxLevel) {
    
    // Inheritance
    
    SeadragonRect.apply(this, arguments);
    
    // Properties (extended)
    
    this.minLevel = minLevel;
    this.maxLevel = maxLevel;
    
};

SeadragonDisplayRect.prototype = new SeadragonRect();

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonDziTileSource = Seadragon.DziTileSource = function(
        width, height, tileSize, tileOverlap, tilesUrl, tileFormat, displayRects) {
    
    // Inheritance
    
    SeadragonTileSource.apply(this, [width, height, tileSize, tileOverlap]);
    
    // Fields
    
    var self = this;
    var levelRects = {};    // 1D dictionary [level] --> array of DisplayRects
    
    // Properties
    
    this.fileFormat = tileFormat;   // deprecated old property ("file" instead of "tile")
    this.tileFormat = tileFormat;
    this.displayRects = displayRects;
    
    // Constructor
    
    (function() {
        if (!displayRects) {
            return;
        }
        
        for (var i = displayRects.length - 1; i >= 0; i--) {
            var rect = displayRects[i];
            for (var level = rect.minLevel; level <= rect.maxLevel; level++) {
                if (!levelRects[level]) {
                    levelRects[level] = [];
                }
                levelRects[level].push(rect);
            }
        }
    })();
    
    // Methods -- OVERRIDDEN
    
    this.getTileUrl = function(level, x, y) {
        // using array join because it's faster than string concatenation
        return [tilesUrl, level, '/', x, '_', y, '.', tileFormat].join('');
    };
    
    this.tileExists = function(level, x, y) {
        var rects = levelRects[level];
        
        if (!rects || !rects.length) {
            return true;
        }
        
        var scale = self.getLevelScale(level);
        
        for (var i = rects.length - 1; i >= 0; i--) {
            var rect = rects[i];
            
            // check level
            if (level < rect.minLevel || level > rect.maxLevel) {
                continue;
            }
            
            // transform rectangle coordinates to this level
            var xMin = rect.x * scale;
            var yMin = rect.y * scale;
            var xMax = xMin + rect.width * scale;
            var yMax = yMin + rect.height * scale;
            
            // convert to rows and columns -- note that we're ignoring tile
            // overlap, but it's a reasonable approximation. it errs on the side
            // of false positives, which is much better than false negatives.
            xMin = Math.floor(xMin / tileSize);
            yMin = Math.floor(yMin / tileSize);
            xMax = Math.ceil(xMax / tileSize);
            yMax = Math.ceil(yMax / tileSize);
            
            if (xMin <= x && x < xMax && yMin <= y && y < yMax) {
                return true;
            }
        }
        
        return false;
    };
    
};

SeadragonDziTileSource.prototype = new SeadragonTileSource();



(function() {
    
    // Helpers -- Errors
    
    function DziError(message) {
        Error.apply(this, arguments);
        this.message = message;
    }
    
    DziError.prototype = new Error();
    
    function getError(e) {
        if (!(e instanceof DziError)) {
            // shouldn't happen, but if it does, fail fast or at least log it
            SeadragonDebug.error(e.name + " while creating DZI from XML: " + e.message);
            e = new DziError(SeadragonStrings.getString("Errors.Unknown"));
        }
        
        return e;
    }
    
    // Helpers -- URL
    
    function getTilesUrl(xmlUrl) {
        var urlParts = xmlUrl.split('/');
        var filename = urlParts[urlParts.length - 1];
        var lastDot = filename.lastIndexOf('.');
        
        if (lastDot > -1) {
            urlParts[urlParts.length - 1] = filename.slice(0, lastDot);
        }
        
        return urlParts.join('/') + "_files/";
    }
    
    // Helpers -- XML
    
    function processResponse(xhr, tilesUrl) {
        if (!xhr) {
            throw new DziError(SeadragonStrings.getString("Errors.Security"));
        } /*else if (xhr.status !== 200 && xhr.status !== 0) {
            // chrome has bug where it sends "OK" for 404
            var status = xhr.status;
            var statusText = (status == 404) ? "Not Found" : xhr.statusText;
            throw new DziError(SeadragonStrings.getString("Errors.Status", status, statusText));
        }*/
        
        var doc = null;
        
        if (xhr.responseXML && xhr.responseXML.documentElement) {
            doc = xhr.responseXML;
        } else if (xhr.responseText)  {
            doc = SeadragonUtils.parseXml(xhr.responseText);
        }
        
        return processXml(doc, tilesUrl);
    }
    
    function processXml(xmlDoc, tilesUrl) {
        if (!xmlDoc || !xmlDoc.documentElement) {
            throw new DziError(SeadragonStrings.getString("Errors.Xml"));
        }
        
        var root = xmlDoc.documentElement;
        var rootName = root.tagName;
        
        if (rootName == "Image") {
            try {
                return processDzi(root, tilesUrl);
            } catch (e) {
                var defMsg = SeadragonStrings.getString("Errors.Dzi");
                throw (e instanceof DziError) ? e : new DziError(defMsg);
            }
        } else if (rootName == "Collection") {
            throw new DziError(SeadragonStrings.getString("Errors.Dzc"));
        } else if (rootName == "Error") {
            return processError(root);
        }
        
        throw new DziError(SeadragonStrings.getString("Errors.Dzi"));
    }
    
    function processDzi(imageNode, tilesUrl) {
        var tileFormat = imageNode.getAttribute("Format");
        
        if (!SeadragonUtils.imageFormatSupported(tileFormat)) {
            throw new DziError(SeadragonStrings.getString("Errors.ImageFormat",
                    tileFormat.toUpperCase()));
        }
        
        var sizeNode = imageNode.getElementsByTagName("Size")[0];
        var dispRectNodes = imageNode.getElementsByTagName("DisplayRect");
        
        var width = parseInt(sizeNode.getAttribute("Width"), 10);
        var height = parseInt(sizeNode.getAttribute("Height"), 10);
        var tileSize = parseInt(imageNode.getAttribute("TileSize"));
        var tileOverlap = parseInt(imageNode.getAttribute("Overlap"));
        var dispRects = [];
        
        for (var i = 0; i < dispRectNodes.length; i++) {
            var dispRectNode = dispRectNodes[i];
            var rectNode = dispRectNode.getElementsByTagName("Rect")[0];
            
            dispRects.push(new SeadragonDisplayRect( 
                parseInt(rectNode.getAttribute("X"), 10),
                parseInt(rectNode.getAttribute("Y"), 10),
                parseInt(rectNode.getAttribute("Width"), 10),
                parseInt(rectNode.getAttribute("Height"), 10),
                // TEMP not sure why we did this -- seems like it's wrong.
                // commenting out the hardcoded 0 and using the XML's value.
                //0,  // ignore MinLevel attribute, bug in Deep Zoom Composer
                parseInt(dispRectNode.getAttribute("MinLevel"), 10),
                parseInt(dispRectNode.getAttribute("MaxLevel"), 10)
            ));
        }
        
        return new SeadragonDziTileSource(width, height, tileSize, tileOverlap,
                tilesUrl, tileFormat, dispRects);
    }
    
    function processError(errorNode) {
        var messageNode = errorNode.getElementsByTagName("Message")[0];
        var message = messageNode.firstChild.nodeValue;
        
        throw new DziError(message);
    }
    
    // Methods -- FACTORIES
    
    SeadragonDziTileSource.getTilesUrl = getTilesUrl;
        // expose this publicly because it's useful for multiple clients
    
    SeadragonDziTileSource.createFromJson = function(jsonObj, callback) {
        var async = typeof(callback) == "function";
        var source, error;
        var dzi = jsonObj;
        
        if (!dzi || (!dzi.url && !dzi.tilesUrl)) {
            error = new DziError(SeadragonStrings.getString("Errors.Empty"));
            
        } else {
            
            try {
                
                var displayRects = dzi.displayRects;
                if (displayRects && displayRects.length) {
                    for (var i = 0, n = displayRects.length; i < n; i++) {
                        var dr = displayRects[i];
                        displayRects[i] = new SeadragonDisplayRect(
                            dr.x || dr[0],
                            dr.y || dr[1],
                            dr.width || dr[2],
                            dr.height || dr[3],
                            dr.minLevel || dr[4],
                            dr.maxLevel || dr[5]
                        );
                    }
                }
                
                source = new SeadragonDziTileSource(
                    dzi.width,
                    dzi.height,
                    dzi.tileSize,
                    dzi.tileOverlap,
                    dzi.tilesUrl || getTilesUrl(dzi.url),
                    dzi.tileFormat,
                    dzi.displayRects
                );
                
                source.xmlUrl = dzi.url;
                
            } catch (e) {
                error = getError(e);
            }
            
        }
        
        if (async) {
            window.setTimeout(SeadragonUtils.createCallback(null, callback, source, error && error.message), 1);
        } else if (error) {
            throw error;
        } else {
            return source;
        }
    };
    
    SeadragonDziTileSource.createFromXml = function(xmlUrl, xmlString, callback) {
        var async = typeof(callback) == "function";
        var error = null;
        
        if (!xmlUrl) {
            error = SeadragonStrings.getString("Errors.Empty");
            if (async) {
                window.setTimeout(function() {
                    callback(null, error);
                }, 1);
                return null;
            }
            throw new DziError(error);
        }
        
        var tilesUrl = getTilesUrl(xmlUrl);
        
        function finish(func, obj) {
            try {
                var source = func(obj, tilesUrl);
                source.xmlUrl = xmlUrl;
                return source;
            } catch (e) {
                if (async) {
                    error = getError(e).message;
                    return null;
                } else {
                    throw getError(e);
                }
            }
        }
        
        if (async) {
            if (xmlString) {
                window.setTimeout(function() {
                    var source = finish(processXml, SeadragonUtils.parseXml(xmlString));
                    callback(source, error);    // call after finish sets error
                }, 1);
            } else {
                SeadragonUtils.makeAjaxRequest(xmlUrl, function(xhr) {
                    var source = finish(processResponse, xhr);
                    callback(source, error);    // call after finish sets error
                });
            }
            
            return null;
        }
        
        // synchronous version
        if (xmlString) {
            return finish(processXml, SeadragonUtils.parseXml(xmlString));
        } else {
            return finish(processResponse, SeadragonUtils.makeAjaxRequest(xmlUrl));
        }
    };
    
})();

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonViewport = Seadragon.Viewport = function(containerSize, contentSize, seadragonViewer) {
    
    // Fields
    
    var self = this;
    
    var containerSize = new SeadragonPoint(containerSize.x, containerSize.y); // copy
    var contentAspect = contentSize.x / contentSize.y;
    var contentHeight = contentSize.y / contentSize.x;
    
    var centerSpringX = new SeadragonSpring(0);
    var centerSpringY = new SeadragonSpring(0);
    var zoomSpring = new SeadragonSpring(SeadragonConfig.logarithmicZoom ? 0 : 1);
    var zoomPoint = null;
    
    var homeBounds = new SeadragonRect(0, 0, 1, contentHeight);
    var homeCenter = homeBounds.getCenter();
    
    var LN2 = Math.LN2;
    
    // Helpers
    
    function init() {
        self.goHome(true);
        self.update();
    }
    
    function log2(x) {
        return Math.log(x) / LN2;
    }
    
    function pow2(x) {
        return Math.pow(2, x);
    }
    
    function clamp(x, min, max) {
        return Math.min(Math.max(x, min), max);
    }
    
    function clampPointToRect(point, rect) {
        var xOld = point.x,
            yOld = point.y,
            xNew = clamp(xOld, rect.x, rect.x + rect.width),
            yNew = clamp(yOld, rect.y, rect.y + rect.height);
        
        return (xOld === xNew && yOld === yNew) ? point :
                new SeadragonPoint(xNew, yNew);
    }
    
    function getCenterConstraintRect(current) {
        var zoom = self.getZoom(current),
            width = 1.0 / zoom,
            height = width / self.getAspectRatio(),
            visibilityRatio = SeadragonConfig.visibilityRatio,
            xMin = (visibilityRatio - 0.5) * width,
            yMin = (visibilityRatio - 0.5) * height,
            xDelta = 1.0 - 2 * xMin,
            yDelta = contentHeight - 2 * yMin;
        
        if (xDelta < 0) {
            xMin += (0.5 * xDelta);
            xDelta = 0;
        }
        
        if (yDelta < 0) {
            yMin += (0.5 * yDelta);
            yDelta = 0;
        }
        
        return new Seadragon.Rect(xMin, yMin, xDelta, yDelta);
    }
    
    // Methods -- CONSTRAINT HELPERS
    
    this.getHomeBounds = function () {
        // fit home bounds to viewport's aspect ratio, maintaining center.
        // this is the same logic as in fitBounds().
        
        var viewportAspect = self.getAspectRatio();
        var homeBoundsFit = new SeadragonRect(
            homeBounds.x, homeBounds.y, homeBounds.width, homeBounds.height);
        
        if (contentAspect >= viewportAspect) {
            // width is bigger relative to viewport, resize height
            homeBoundsFit.height = homeBounds.width / viewportAspect;
            homeBoundsFit.y = homeCenter.y - homeBoundsFit.height / 2;
        } else {
            // height is bigger relative to viewport, resize width
            homeBoundsFit.width = homeBounds.height * viewportAspect;
            homeBoundsFit.x = homeCenter.x - homeBoundsFit.width / 2;
        }
        
        return homeBoundsFit;
    };
    
    this.getHomeCenter = function () {
        return homeCenter;
    };

    this.getHomeZoom = function () {
        // if content is wider, we'll fit width, otherwise height
        var aspectFactor = contentAspect / self.getAspectRatio();
        return (aspectFactor >= 1) ? 1 : aspectFactor;
    };
    
    this.getMinCenter = function (current) {
        return getCenterConstraintRect(current).getTopLeft();
    };
    
    this.getMaxCenter = function (current) {
        return getCenterConstraintRect(current).getBottomRight();
    };

    this.getMinZoom = function () {
        var homeZoom = self.getHomeZoom();

        // for backwards compatibility, respect minZoomDimension if present
        if (SeadragonConfig.minZoomDimension) {
            var zoom = (contentSize.x <= contentSize.y) ?
                SeadragonConfig.minZoomDimension / containerSize.x :
                SeadragonConfig.minZoomDimension / (containerSize.x * contentHeight);
        } else {
            var zoom = SeadragonConfig.minZoomImageRatio * homeZoom;
        }

        return Math.min(zoom, homeZoom);
    };

    this.getMaxZoom = function () {
        var zoom = contentSize.x * SeadragonConfig.maxZoomPixelRatio / containerSize.x;
        return Math.max(zoom, self.getHomeZoom());
    };
        
    // Methods -- ACCESSORS

    this.getAspectRatio = function () {
        return containerSize.x / containerSize.y;
    };
    
    this.getContainerSize = function() {
        return new SeadragonPoint(containerSize.x, containerSize.y);
    };
    
    this.getBounds = function(current) {
        var center = self.getCenter(current);
        var width = 1.0 / self.getZoom(current);
        var height = width / self.getAspectRatio();
        
        return new SeadragonRect(center.x - width / 2.0, center.y - height / 2.0,
            width, height);
    };
    
    this.getCenter = function(current) {
        var centerCurrent = new SeadragonPoint(
            centerSpringX.getCurrent(), centerSpringY.getCurrent());
        var centerTarget = new SeadragonPoint(
            centerSpringX.getTarget(), centerSpringY.getTarget());
        
        if (current) {
            return centerCurrent;
        } else if (!zoomPoint) {
            // no adjustment necessary since we're not zooming
            return centerTarget;
        }
        
        // to get the target center, we need to adjust for the zoom point.
        // we'll do this in the same way as the update() method.
        
        // manually calculate bounds based on this unadjusted target center.
        // this is mostly a duplicate of getBounds() above. note that this is
        // based on the TARGET zoom but the CURRENT center.
        var zoom = self.getZoom();
        var width = 1.0 / zoom;
        var height = width / self.getAspectRatio();
        var bounds = new SeadragonRect(
            centerCurrent.x - width / 2.0,
            centerCurrent.y - height / 2.0,
            width,
            height
        );
        
        // the conversions here are identical to the pixelFromPoint() and
        // deltaPointsFromPixels() methods.
        var oldZoomPixel = self.pixelFromPoint(zoomPoint, true);
        var newZoomPixel = zoomPoint.minus(bounds.getTopLeft()).times(containerSize.x / bounds.width);
        var deltaZoomPixels = newZoomPixel.minus(oldZoomPixel);
        var deltaZoomPoints = deltaZoomPixels.divide(containerSize.x * zoom);
        
        // finally, shift center to negate the change.
        return centerTarget.plus(deltaZoomPoints);
    };
    
    this.getZoom = function(current) {
        var zoom;
        if (current) {
            zoom = zoomSpring.getCurrent();
            return SeadragonConfig.logarithmicZoom ? pow2(zoom) : zoom;
        } else {
            zoom = zoomSpring.getTarget();
            return SeadragonConfig.logarithmicZoom ? pow2(zoom) : zoom;
        }
    };
    
    // Methods -- MODIFIERS
    
    this.applyConstraints = function(immediately) {
        // first, apply zoom constraints
        var oldZoom = self.getZoom();
        var newZoom = clamp(oldZoom, self.getMinZoom(), self.getMaxZoom());
        if (oldZoom != newZoom) {
            self.zoomTo(newZoom, zoomPoint, immediately);
        }
        
        // then, apply pan constraints -- but do so via fitBounds() in order to
        // account for (and adjust) the zoom point! also ignore constraints if
        // content is being wrapped! but differentiate horizontal vs. vertical.
        var oldCenter = self.getCenter();
        var newCenter = clampPointToRect(oldCenter, getCenterConstraintRect());
        if (SeadragonConfig.wrapHorizontal) {
            newCenter.x = oldCenter.x;
        }
        if (SeadragonConfig.wrapVertical) {
            newCenter.y = oldCenter.y;
        }
        
        if (!oldCenter.equals(newCenter)) {
            var width = 1.0 / newZoom,
                height = width / self.getAspectRatio();
            self.fitBounds(new SeadragonRect(
                newCenter.x - 0.5 * width,
                newCenter.y - 0.5 * height,
                width,
                height
            ), immediately);
            return true; // returns whether or not constraints were applied
        } else {return false};
    };
    
    this.ensureVisible = function(immediately) {
        // for backwards compatibility
        self.applyConstraints(immediately);
    };
    
    this.fitBounds = function(bounds, immediately) {
        var aspect = self.getAspectRatio();
        var center = bounds.getCenter();
        
        // resize bounds to match viewport's aspect ratio, maintaining center.
        // note that zoom = 1/width, and width = height*aspect.
        var newBounds = new SeadragonRect(bounds.x, bounds.y, bounds.width, bounds.height);
        if (newBounds.getAspectRatio() >= aspect) {
            // width is bigger relative to viewport, resize height
            newBounds.height = bounds.width / aspect;
            newBounds.y = center.y - newBounds.height / 2;
        } else {
            // height is bigger relative to viewport, resize width
            newBounds.width = bounds.height * aspect;
            newBounds.x = center.x - newBounds.width / 2;
        }
        
        // stop movement first! this prevents the operation from missing
        self.panTo(self.getCenter(true), true);
        self.zoomTo(self.getZoom(true), null, true);
        
        // capture old values for bounds and width. we need both, but we'll
        // also use both for redundancy, to protect against precision errors.
        // note: use target bounds, since update() hasn't been called yet!
        var oldBounds = self.getBounds();
        var oldZoom = self.getZoom();
        
        // if we're already at the correct zoom, just pan and we're done.
        // we'll check both zoom and bounds for redundancy, to protect against
        // precision errors (see note below).
        var newZoom = 1.0 / newBounds.width;
        if (newZoom == oldZoom || Math.abs(newBounds.width - oldBounds.width) < 0.000001) {
            self.panTo(center, immediately);
            return;
        }
        
        // otherwise, we need to zoom about the only point whose pixel transform
        // is constant between the old and new bounds. this is just tricky math.
        var refPoint = oldBounds.getTopLeft().times(containerSize.x / oldBounds.width).minus(
                newBounds.getTopLeft().times(containerSize.x / newBounds.width)).divide(
                containerSize.x / oldBounds.width - containerSize.x / newBounds.width);
        
        // note: that last line (cS.x / oldB.w - cS.x / newB.w) was causing a
        // divide by 0 in the case that oldBounds.width == newBounds.width.
        // that should have been picked up by the zoom check, but in certain
        // cases, the math is slightly off and the zooms are different. so now,
        // the zoom check has an extra check added.
        
        self.zoomTo(newZoom, refPoint, immediately);
    };
   
    this.goHome = function(immediately) {
        // calculate center adjusted for zooming
        var center = self.getCenter();
        
        // if we're wrapping horizontally, "unwind" the horizontal spring
        if (SeadragonConfig.wrapHorizontal) {
            // this puts center.x into the range [0, 1) always
            center.x = (1 + (center.x % 1)) % 1;
            centerSpringX.resetTo(center.x);
            centerSpringX.update();
        }
        
        // if we're wrapping vertically, "unwind" the vertical spring
        if (SeadragonConfig.wrapVertical) {
            // this puts center.y into the range e.g. [0, 0.75) always
            center.y = (contentHeight + (center.y % contentHeight)) % contentHeight;
            centerSpringY.resetTo(center.y);
            centerSpringY.update();
        }
        
        self.fitBounds(homeBounds, immediately);
    };
    
    this.panBy = function(delta, immediately) {
        self.panTo(self.getCenter().plus(delta), immediately);
    };
    
    this.panTo = function(center, immediately) {
        // we have to account for zoomPoint here, i.e. if we're in the middle
        // of a zoom about some point and panTo() is called, we should be
        // spring to some center that will get us to the specified center.
        // the logic here is thus the exact inverse of the getCenter() method.
        
        if (immediately) {
            centerSpringX.resetTo(center.x);
            centerSpringY.resetTo(center.y);
            return;
        }

        if(!zoomPoint) { // added by bleveque for tour manipulation
            zoomPoint = new Seadragon.Point(0,0);
        }
        
        // if (!zoomPoint) { // commented out by bleveque -- broke tour manipulation
        //     centerSpringX.springTo(center.x);
        //     centerSpringY.springTo(center.y);
        //     return;
        // }

                
        // manually calculate bounds based on this unadjusted target center.
        // this is mostly a duplicate of getBounds() above. note that this is
        // based on the TARGET zoom but the CURRENT center.
        var zoom = self.getZoom();
        var width = 1.0 / zoom;
        var height = width / self.getAspectRatio();
        var bounds = new SeadragonRect(
            centerSpringX.getCurrent() - width / 2.0,
            centerSpringY.getCurrent() - height / 2.0,
            width,
            height
        );
        
        // the conversions here are identical to the pixelFromPoint() and
        // deltaPointsFromPixels() methods.
        var oldZoomPixel = self.pixelFromPoint(zoomPoint, true);
        var newZoomPixel = zoomPoint.minus(bounds.getTopLeft()).times(containerSize.x / bounds.width);
        var deltaZoomPixels = newZoomPixel.minus(oldZoomPixel);
        var deltaZoomPoints = deltaZoomPixels.divide(containerSize.x * zoom);
        
        // finally, shift center to negate the change.
        var centerTarget = center.minus(deltaZoomPoints);
        
        centerSpringX.springTo(centerTarget.x);
        centerSpringY.springTo(centerTarget.y);

        seadragonViewer.scheduleUpdate();
    };
    
    this.zoomBy = function(factor, refPoint, immediately) {
        self.zoomTo(self.getZoom() * factor, refPoint, immediately);
    };
    
    this.zoomTo = function(zoom, refPoint, immediately) {
        // we used to constrain zoom automatically here; now it needs to be
        // explicitly constrained, via applyConstraints().
        //zoom = clamp(zoom, self.getMinZoom(), self.getMaxZoom());
        
        if (immediately) {
            zoomSpring.resetTo(SeadragonConfig.logarithmicZoom ? log2(zoom) : zoom);
        } else {
            zoomSpring.springTo(SeadragonConfig.logarithmicZoom ? log2(zoom) : zoom);
        }
        
        zoomPoint = refPoint instanceof SeadragonPoint ? refPoint : null;

        seadragonViewer.scheduleUpdate();
    };
    
    this.resize = function(newContainerSize, maintain) {
        // default behavior: just ensure the visible content remains visible.
        // note that this keeps the center (relative to the content) constant.
        var oldBounds = self.getBounds();
        var newBounds = oldBounds;
        var widthDeltaFactor = newContainerSize.x / containerSize.x;
        
        // update container size, but make copy first
        containerSize = new SeadragonPoint(newContainerSize.x, newContainerSize.y);
        
        if (maintain) {
            // no resize relative to screen, resize relative to viewport.
            // keep origin constant, zoom out (increase bounds) by delta factor.
            newBounds.width = oldBounds.width * widthDeltaFactor;
            newBounds.height = newBounds.width / self.getAspectRatio(); 
        }
        
        self.fitBounds(newBounds, true);
    };
    
    this.update = function() {
        var oldCenterX = centerSpringX.getCurrent();
        var oldCenterY = centerSpringY.getCurrent();
        var oldZoom = zoomSpring.getCurrent();
        
        // remember position of zoom point
        if (zoomPoint) {
            var oldZoomPixel = self.pixelFromPoint(zoomPoint, true);
        }
        
        // now update zoom only, don't update pan yet
        zoomSpring.update();
        
        // adjust for change in position of zoom point, if we've zoomed
        if (zoomPoint && zoomSpring.getCurrent() != oldZoom) {
            var newZoomPixel = self.pixelFromPoint(zoomPoint, true);
            var deltaZoomPixels = newZoomPixel.minus(oldZoomPixel);
            var deltaZoomPoints = self.deltaPointsFromPixels(deltaZoomPixels, true);
            
            // shift pan to negate the change
            centerSpringX.shiftBy(deltaZoomPoints.x);
            centerSpringY.shiftBy(deltaZoomPoints.y);
        } else {
            // don't try to adjust next time; this improves performance
            zoomPoint = null;
        }
        
        // now after adjustment, update pan
        centerSpringX.update();
        centerSpringY.update();
        
        return centerSpringX.getCurrent() != oldCenterX ||
                centerSpringY.getCurrent() != oldCenterY ||
                zoomSpring.getCurrent() != oldZoom;
    };
    
    // Methods -- CONVERSION HELPERS
    
    this.deltaPixelsFromPoints = function(deltaPoints, current) {
        return deltaPoints.times(containerSize.x * self.getZoom(current));
    };
    
    this.deltaPointsFromPixels = function(deltaPixels, current) {
        return deltaPixels.divide(containerSize.x * self.getZoom(current));
    };
    
    this.pixelFromPoint = function(point, current) {
        var bounds = self.getBounds(current);
        return point.minus(bounds.getTopLeft()).times(containerSize.x / bounds.width);
    };
    
    this.pointFromPixel = function(pixel, current) {
        var bounds = self.getBounds(current);
        return pixel.divide(containerSize.x / bounds.width).plus(bounds.getTopLeft());
    };
    
    // Constructor
    
    init();
    
};

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonDrawer,
    SeadragonOverlayPlacement;

(function() {
    
    // Constants
    
    var QUOTA = 1500;    // the max number of images we should keep in memory
    var MIN_PIXEL_RATIO = 0.5;  // the most shrunk a tile should be
    
    // Method of drawing
    
    var browser = SeadragonUtils.getBrowser();
    var browserVer = SeadragonUtils.getBrowserVersion();
    var userAgent = navigator.userAgent;
    
    // check if browser supports <canvas>.
    // update: IE9 returns type "object" instead of "function"...
    var hasCanvas = !!(document.createElement("canvas").getContext);
    
    // we use this style for a lot of our checks, so caching it here:
    var docElmt = document.documentElement || {};
    var docElmtStyle = docElmt.style || {};
    
    // check if browser supports CSS transforms. using this technique:
    // http://www.zachstronaut.com/posts/2009/02/17/animate-css-transforms-firefox-webkit.html
    // also, the spec says translate values need to include units (e.g. "px"),
    // but webkit chokes on units. we need to check for this bug.
    var hasCssTransforms = false;
    var cssTransformProperties = ["msTransform", "WebkitTransform", "MozTransform"];
    var cssTransformProperty, cssTransformNoUnits;
    
    while (cssTransformProperty = cssTransformProperties.shift()) {
        if (typeof docElmtStyle[cssTransformProperty] !== "undefined") {
            hasCssTransforms = true;
            cssTransformNoUnits = /webkit/i.test(cssTransformProperty);
            break;
        }
    }
    
    // we'll use a similar technique to check for CSS transitions.
    // TEMP the value for CSS transition-property is the CSS name of the
    // property you want transitioned, e.g. "-webkit-transform", and NOT the
    // JavaScript name, e.g. "WebkitTransform". so for the time being, we're
    // hardcoding this stuff to just webkit instead of general checking.
    var cssTransformPropertyCssName = "-webkit-transform";
    var cssTransitionProperty = "WebkitTransition";
    var hasCssTransitions =
        typeof docElmtStyle[cssTransitionProperty] !== "undefined";
    
    // check if browser is IE, or supports IE's proprietary DirectX filters.
    // specifically, the matrix transform filter is similar to CSS transforms!
    // http://msdn.microsoft.com/en-us/library/ms533014(v=VS.85).aspx
    var IE_MATRIX_FILTER = "progid:DXImageTransform.Microsoft.Matrix";
    var IE_MATRIX_FILTER_REGEXP = new RegExp(
        IE_MATRIX_FILTER + "\\(.*?\\)", 'g');
    
    // TEMP checking for the presence of the "filters" property isn't really
    // strong feature detection, so added an explicit IE check. that's fine?
    // update: also trying catch this since IE9 throws an error here.
    var hasIeFilters = (function() {
        try {
            return (browser === SeadragonBrowser.IE) &&
                !!(document.documentElement.filters);
        } catch (e) {
            return false;
        }
    })();
    
    // in general, <canvas> is great because it's standardized and stable for
    // the functionality we need. plus, firefox, opera and safari 4 all have
    // subpixel precision inside <canvas>. CSS transforms also seem to get us
    // subpixel precision, and more broadly, across firefox, safari 4 and even
    // chrome, but it's less stable so far. both <canvas> and CSS transform
    // have potential to be hardware accelerated, so deciding between the two
    // comes down to subpixel precision and perf based on experimentation.
    // note that IE provides proprietary matrix transforms which also get us
    // subpixel precision!! for fallback, we use regular CSS position/size.
    // UPDATE: IE's matrix transforms are dog-slow, no good unfortunately.
    // but, we may still be able to use them somehow, maybe once per frame on
    // just the canvas and not multiple times per frame on each tile.
    // TODO investigate IE matrix transforms on canvas instead of per tile.
    // TEMP for now, turning off IE matrix transforms altogether.
    var badCanvas =     // due to no subpixel precision
            (browser === SeadragonBrowser.SAFARI && browserVer < 4) ||
            (browser === SeadragonBrowser.CHROME);
    var useCanvas = hasCanvas && !badCanvas;
    var useCssTransforms = !useCanvas && hasCssTransforms;
    var useIeFilters = false;
    
    // UPDATE: safari 4 on Mac OS X 10.6 (snow leopard) and safari mobile on
    // iPhone OS 3 hardware accelerate CSS transforms when combined with CSS
    // transitions, so use them there over <canvas>!
    // UPDATE: this causes flickers on the iPhone; removing support for now.
    //var acceleratedTransforms =
    //    browser == SeadragonBrowser.SAFARI && userAgent.match(/Mac OS X/) && (
    //        // case 1: safari 4 (desktop and iPad)
    //        browserVer >= 4 ||
    //        // case 2: safari mobile, might be 3
    //        userAgent.match(/Mobile\//));
    //if (hasCssTransforms && hasCssTransitions && acceleratedTransforms) {
    //    useCanvas = false;
    //    useCssTransforms = true;
    //}
    
    // regardless, in IE, we use <img> tags. unfortunately, in IE, <img> tags
    // use a crappy nearest-neighbor interpolation by default. IE7+ lets us
    // change this via a proprietary CSS property. unfortunately, changing it to
    // bicubic caused tile seams in IE7 -- but not IE8! even IE8 in compat mode
    // has no tile seams. so we need to detect IE8 regardless of mode; we do so
    // via document.documentMode, introduced in IE8 for all modes. finally, in
    // IE7, we'll explicitly say nearest-neighbor, otherwise if the user zooms
    // the page, IE7 would implicitly change it to bicubic, causing tile seams.
    var MS_INTERPOLATION_MODE = (typeof document.documentMode !== "undefined") ?
            "bicubic" : "nearest-neighbor";
    
    // Tiles
    
    function Tile(level, x, y, bounds, exists, url) {
        // Core
        this.level = level;
        this.x = x;
        this.y = y;
        this.bounds = bounds;   // where this tile fits, in normalized coordinates
        this.exists = exists;   // part of sparse image? tile hasn't failed to load?
        
        // Image
        this.url = url;         // the URL of this tile's image
        this.elmt = null;       // the HTML element for this tile
        this.image = null;      // the Image object for this tile
        this.loaded = false;    // is this tile loaded?
        this.loading = false;   // or is this tile loading?
        
        // Drawing
        this.style = null;      // alias of this.elmt.style
        this.position = null;   // this tile's position on screen, in pixels
        this.size = null;       // this tile's size on screen, in pixels
        this.blendStart = null; // the start time of this tile's blending
        this.opacity = null;    // the current opacity this tile should be
        this.distance = null;   // the distance of this tile to the viewport center
        this.visibility = null; // the visibility score of this tile
        
        // Caching
        this.beingDrawn = false;// whether this tile is currently being drawn
        this.covered = false;   // whether this tile is currently covered
        this.lastDrawnTime = 0; // when the tile was last drawn
        this.lastTouchTime = 0; // the time that tile was last touched (though not necessarily drawn)
    }
    
    Tile.prototype.toString = function() {
        return this.level + "/" + this.x + "_" + this.y;
    };
    
    Tile.prototype.drawHTML = function(container) {
        if (!this.loaded) {
            SeadragonDebug.error("Attempting to draw tile " + this.toString() +
                    " when it's not yet loaded.");
            return;
        }
        
        // initialize if first time
        if (!this.elmt) {
            this.elmt = SeadragonUtils.makeNeutralElement("img");
            this.elmt.src = this.url; 
            this.style = this.elmt.style;
            this.style.position = "absolute";
            this.style.msInterpolationMode = MS_INTERPOLATION_MODE;
                // IE only property. see note above for explanation.
            
            if (useCssTransforms) {
                this.style[cssTransformProperty + "Origin"] = "0px 0px";
                // TEMP commenting out CSS transitions for now; not stable yet.
                //if (hasCssTransitions) {
                //    this.style[cssTransitionProperty + "Property"] = cssTransformPropertyCssName;
                //    this.style[cssTransitionProperty + "Duration"] = ".01666667s";   // TEMP 1/60th of a second
                //}
            }
        }
        
        var elmt = this.elmt;
        var image = this.image;
        var style = this.style;
        var position = this.position;
        var size = this.size;
        
        if (elmt.parentNode !== container) {
            container.appendChild(elmt);
        }
        
        if (useCssTransforms) {
            
            // warning! sometimes chrome doesn't have this new <img> element
            // loaded yet, even though it's a clone of another <img> element
            // that is loaded. so we use the width and height properties of the
            // original <img> (the image variable instead of this one (elmt).
            style[cssTransformProperty] = [
                'matrix(',
                (size.x / image.width).toFixed(8),
                ',0,0,',
                (size.y / image.height).toFixed(8),
                ',',
                position.x.toFixed(8),
                cssTransformNoUnits ? ',' : 'px,',
                position.y.toFixed(8),
                cssTransformNoUnits ? ')' : 'px)'
            ].join('');
            
        } else if (useIeFilters) {
            
            var containerWidth = container.clientWidth,
                containerHeight = container.clientHeight;
            
            style.width = containerWidth + "px";
            style.height = containerHeight + "px";
            style.filter = [
                'progid:DXImageTransform.Microsoft.Matrix(',
                'M11=',
                (size.x / containerWidth).toFixed(8),
                ',M22=',
                (size.y / containerHeight).toFixed(8),
                ',Dx=',
                position.x.toFixed(8),
                ',Dy=',
                position.y.toFixed(8),
                ')'
            ].join('');
            
        } else {
            
            position = position.apply(Math.floor);
            size = size.apply(Math.ceil);
            
            style.left = position.x + "px";
            style.top = position.y + "px";
            style.width = size.x + "px";
            style.height = size.y + "px";
            
        }
        
        // TEMP because we know exactly whether we're using IE filters or not,
        // short-circuitting this utils call to optimize the logic.
        // UPDATE: we're no longer using IE filters, so reverting this logic.
        SeadragonUtils.setElementOpacity(elmt, this.opacity);
        //var opacity = this.opacity;
        //if (useIeFilters && opacity < 1) {
        //    style.filter += " alpha(opacity=" + Math.round(100 * opacity) + ")";
        //} else {
        //    style.opacity = (opacity < 1) ? opacity : '';
        //}
    };
    
    Tile.prototype.drawCanvas = function(context) {
        if (!this.loaded) {
            SeadragonDebug.error("Attempting to draw tile " + this.toString() +
                    " when it's not yet loaded.");
            return;
        }
        
        var position = this.position;
        var size = this.size;
            
        context.globalAlpha = this.opacity;
        context.drawImage(this.image, position.x, position.y, size.x, size.y);
    };
    
    Tile.prototype.unload = function () {
        if (this.elmt && this.elmt.parentNode) {
            this.elmt.parentNode.removeChild(this.elmt);
        }

        this.elmt = null;
        this.image = null;
        this.loaded = false;
        this.loading = false;
    };
    
    // Overlays
    
    SeadragonOverlayPlacement = Seadragon.OverlayPlacement = {
        CENTER: 0,
        TOP_LEFT: 1,
        TOP: 2,
        TOP_RIGHT: 3,
        RIGHT: 4,
        BOTTOM_RIGHT: 5,
        BOTTOM: 6,
        BOTTOM_LEFT: 7,
        LEFT: 8
    };
    
    /**
     * Creates an "adjustment" function for a given overlay placement that
     * adjusts an overlay's position depending on its size and placement. This
     * gives better perf during draw loop since we don't need to re-check and
     * re-calculate the adjustment every single iteration.
     */
    function createAdjustmentFunction(placement) {
        switch (placement) {
            case SeadragonOverlayPlacement.TOP_LEFT:
                return function(position, size) {
                    // no adjustment needed
                };
            case SeadragonOverlayPlacement.TOP:
                return function(position, size) {
                    position.x -= size.x / 2;
                    // no y adjustment needed
                };
            case SeadragonOverlayPlacement.TOP_RIGHT:
                return function(position, size) {
                    position.x -= size.x;
                    // no y adjustment needed
                };
            case SeadragonOverlayPlacement.RIGHT:
                return function(position, size) {
                    position.x -= size.x;
                    position.y -= size.y / 2;
                };
            case SeadragonOverlayPlacement.BOTTOM_RIGHT:
                return function(position, size) {
                    position.x -= size.x;
                    position.y -= size.y;
                };
            case SeadragonOverlayPlacement.BOTTOM:
                return function(position, size) {
                    position.x -= size.x / 2;
                    position.y -= size.y;
                };
            case SeadragonOverlayPlacement.BOTTOM_LEFT:
                return function(position, size) {
                    // no x adjustment needed
                    position.y -= size.y;
                };
            case SeadragonOverlayPlacement.LEFT:
                return function(position, size) {
                    // no x adjustment needed
                    position.y -= size.y / 2;
                };
            case SeadragonOverlayPlacement.CENTER:
            default:
                return function(position, size) {
                    position.x -= size.x / 2;
                    position.y -= size.y / 2;
                };
        }
    }
    
    function Overlay(elmt, loc, placement) {
        // Core
        this.elmt = elmt;
        this.scales = (loc instanceof SeadragonRect);
        this.bounds = new SeadragonRect(loc.x, loc.y, loc.width, loc.height);
        // Drawing
        this.adjust = createAdjustmentFunction(loc instanceof SeadragonPoint ?
                placement : SeadragonOverlayPlacement.TOP_LEFT);    // rects are always top-left
        this.position = new SeadragonPoint(loc.x, loc.y);
        this.size = new SeadragonPoint(loc.width, loc.height);
        this.style = elmt.style;
        this.naturalSize = new SeadragonPoint(elmt.clientWidth, elmt.clientHeight);
    }
    
    Overlay.prototype.destroy = function() {
        var elmt = this.elmt;
        var style = this.style;
        
        if (elmt.parentNode) {
            elmt.parentNode.removeChild(elmt);
        }
        
        style.top = "";
        style.left = "";
        style.position = "";
        
        if (this.scales) {
            style.width = "";
            style.height = "";
        }
    };
    
    Overlay.prototype.drawHTML = function(container) {
        var elmt = this.elmt;
        var style = this.style;
        var scales = this.scales;
        var naturalSize = this.naturalSize;
        
        if (elmt.parentNode !== container) {
            container.appendChild(elmt);
            style.position = "absolute";
            naturalSize.x = elmt.clientWidth;
            naturalSize.y = elmt.clientHeight;
        }
        
        var position = this.position;
        var size = this.size;
        
        // override calculated size if this element doesn't scale with image
        if (!scales) {
            size.x = naturalSize.x = naturalSize.x || elmt.clientWidth;
            size.y = naturalSize.y = naturalSize.y || elmt.clientHeight;
        }
        
        // adjust position based on placement (default is center)
        this.adjust(position, size);
        
        if (SeadragonConfig.transformOverlays && hasCssTransforms) {
            
            style[cssTransformProperty + "Origin"] = "0px 0px";
            style[cssTransformProperty] = [
                'translate(',
                position.x.toFixed(8),
                'px,',  // webkit correctly accepts length units for translate() func
                position.y.toFixed(8),
                'px)'
            ].join('');
            
            if (scales) {
                
                if (!elmt.clientWidth) {
                    style.width = "100%";
                }
                if (!elmt.clientHeight) {
                    style.height = "100%";
                }
                
                style[cssTransformProperty] += [
                    ' scale(',
                    (size.x / elmt.clientWidth).toFixed(8),
                    ',',
                    (size.y / elmt.clientHeight).toFixed(8),
                    ')'
                ].join('');
                
            }
            
        } else if (SeadragonConfig.transformOverlays && useIeFilters) {
            
            var containerWidth = container.clientWidth,
                containerHeight = container.clientHeight;
            
            style.width = containerWidth + "px";
            style.height = containerHeight + "px";
            style.filter = [
                'progid:DXImageTransform.Microsoft.Matrix(',
                'M11=',
                (size.x / containerWidth).toFixed(8),
                ',M22=',
                (size.y / containerHeight).toFixed(8),
                ',Dx=',
                position.x.toFixed(8),
                ',Dy=',
                position.y.toFixed(8),
                ')'
            ].join('');
            
        } else {
            
            position = position.apply(Math.floor);
            size = size.apply(Math.ceil);
            
            style.left = position.x + "px";
            style.top = position.y + "px";
            
            if (scales) {
                style.width = size.x + "px";
                style.height = size.y + "px";
            }
            
        }
    };
    
    Overlay.prototype.update = function(loc, placement) {
        this.scales = (loc instanceof SeadragonRect);
        this.bounds = new SeadragonRect(loc.x, loc.y, loc.width, loc.height);
        this.adjust = createAdjustmentFunction(loc instanceof SeadragonPoint ?
                placement : SeadragonOverlayPlacement.TOP_LEFT);    // rects are always top-left
    };
    
    // Drawer
    
    SeadragonDrawer = Seadragon.Drawer = function(source, viewport, elmt, viewer, ignoreConstraints) {
        
        MIN_PIXEL_RATIO = ignoreConstraints ? 0.1 : 0.5;

        // Implementation note:
        // 
        // This class draws two types of things: tiles and overlays. Currently,
        // only HTML elements are supported overlay types, so they will always
        // be inserted into the DOM. Tiles are images, which allows them to be
        // both inserted into the DOM or to be drawn onto a <canvas> element.
        // 
        // Higher-res (higher-level) tiles need to be drawn above lower-res
        // (lower-level) tiles. Overlays need to be drawn above all tiles. For
        // tiles drawn using <canvas>, this is easy. For tiles drawn as HTML,
        // and for overlays, we can use the CSS z-index property, but that has
        // issues in full page. So instead, we can achieve natural z-ordering
        // through the order of the elements in the container.
        // 
        // To do this, in the HTML mode, we add the tiles not to the container
        // directly, but to a div inside the container. This div is the first
        // child of the container. The overlays are added to the container
        // directly, after that div. This ensures that the overlays are always
        // drawn above the tiles.
        // 
        // In the below fields, the canvas field refers to the <canvas> element
        // if we're drawing with canvas, or the div that contains the tiles if
        // we're drawing with HTML.
        // 
        // Minor note: we remove and re-add tiles to the div every frame, but we
        // can't do this with overlays, as it breaks browser event behavior.
        
        // Fields
        
        var container = SeadragonUtils.getElement(elmt);
        var canvas = SeadragonUtils.makeNeutralElement(useCanvas ? "canvas" : "div");
        var context = useCanvas ? canvas.getContext("2d") : null;
        
        var imageLoader = new SeadragonImageLoader();
        var profiler = new SeadragonProfiler();
        
        var minLevel = source.minLevel;
        var maxLevel = source.maxLevel;
        var tileSize = source.tileSize;
        var tileOverlap = source.tileOverlap;
        var normHeight = source.height / source.width;
        
        var cacheNumTiles = {};     // 1d dictionary [level] --> Point
        var cachePixelRatios = {};  // 1d dictionary [level] --> Point
        var tilesMatrix = {};       // 3d dictionary [level][x][y] --> Tile
        var tilesLoaded = [];       // unordered list of Tiles with loaded images
        var coverage = {};          // 3d dictionary [level][x][y] --> Boolean
        
        var overlays = [];          // unordered list of Overlays added
        var lastDrawn = [];         // unordered list of Tiles drawn last frame
        var lastFrameTime = 0;      // the timestamp of the previous frame
        var lastResetTime = 0;
        var midUpdate = false;
        var updateAgain = true;

        // Properties
        
        this.elmt = container;
        this.profiler = profiler;
        
        // Constructor
        
        (function () {
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.position = "absolute";
            container.style.textAlign = "left";    // explicit left-align
            container.appendChild(canvas);
        })();
        
        // Helpers -- CACHES
        
        function getNumTiles(level) {
            if (!cacheNumTiles[level]) {
                cacheNumTiles[level] = source.getNumTiles(level);
            }
            
            return cacheNumTiles[level];
        }
        
        function getPixelRatio(level) {
            if (!cachePixelRatios[level]) {
                cachePixelRatios[level] = source.getPixelRatio(level);
            }
            
            return cachePixelRatios[level];
        }
        
        // Helpers -- TILES
        
        function getTile(level, x, y, time, numTilesX, numTilesY) {
            if (!tilesMatrix[level]) {
                tilesMatrix[level] = {};
            }
            if (!tilesMatrix[level][x]) {
                tilesMatrix[level][x] = {};
            }
            
            // initialize tile object if first time
            if (!tilesMatrix[level][x][y]) {
                // where applicable, adjust x and y to support wrapping.
                var xMod = (numTilesX + (x % numTilesX)) % numTilesX;
                var yMod = (numTilesY + (y % numTilesY)) % numTilesY;
                var bounds = source.getTileBounds(level, xMod, yMod);
                var exists = source.tileExists(level, xMod, yMod);
                var url = source.getTileUrl(level, xMod, yMod);
                
                // also adjust bounds to support wrapping.
                bounds.x += 1.0 * (x - xMod) / numTilesX;
                bounds.y += normHeight * (y - yMod) / numTilesY;
                
                tilesMatrix[level][x][y] = new Tile(level, x, y, bounds, exists, url);
            }
            
            var tile = tilesMatrix[level][x][y];
            
            // mark tile as touched so we don't reset it too soon
            tile.lastTouchTime = time;
            
            return tile;
        }
        
        function loadTile(tile, time) {
            imageLoader.loadImage(tile,
                    SeadragonUtils.createCallback(null, onTileLoad, tile, time));
        }
        
        function onTileLoad(tile, time, image) {
            tile.loading = false;
            
            if (midUpdate) {
                SeadragonDebug.error("Tile load callback in middle of drawing routine.");
                return;
            } else if (!image) {
                SeadragonDebug.log("Tile " + tile + " failed to load: " + tile.url);
                tile.exists = false;
                return;
            }
            //else if (time < lastResetTime) {
            //    SeadragonDebug.log("Ignoring tile " + tile + " loaded before reset: " + tile.url);
            //    return;
            //}
            
            tile.image = image;
            tile.loaded = true;
            
            var insertionIndex = tilesLoaded.length;
            
            if (tilesLoaded.length >= QUOTA) {
                var cutoff = Math.ceil(Math.log(tileSize) / Math.log(2));
                    // don't delete any single-tile levels. this takes priority.
                
                var worstTile = null;
                var worstTileIndex = -1;
                
                for (var i = tilesLoaded.length - 1; i >= 0; i--) {
                    var prevTile = tilesLoaded[i];
                    
                    if (prevTile.level <= cutoff || prevTile.beingDrawn) {
                        continue;
                    } else if (!worstTile) {
                        worstTile = prevTile;
                        worstTileIndex = i;
                        continue;
                    }
                    
                    var prevTime = prevTile.lastTouchTime;
                    var worstTime = worstTile.lastTouchTime;
                    var prevLevel = prevTile.level;
                    var worstLevel = worstTile.level;
                    
                    if (prevTime < worstTime ||
                            (prevTime === worstTime && prevLevel > worstLevel)) {
                        worstTile = prevTile;
                        worstTileIndex = i;
                    }
                }
                
                if (worstTile && worstTileIndex >= 0) {
                    worstTile.unload();
                    insertionIndex = worstTileIndex;
                    // note: we don't want or need to delete the actual Tile
                    // object from tilesMatrix; that's negligible memory.
                }
            }
            
            tilesLoaded[insertionIndex] = tile;
            updateAgain = true;
        }
        
        function clearTiles() {
            tilesMatrix = {};
            tilesLoaded = [];
        }
        
        // Helpers -- COVERAGE
        
        // Coverage scheme: it's required that in the draw routine, coverage for
        // every tile within the viewport is initially explicitly set to false.
        // This way, if a given level's coverage has been initialized, and a tile
        // isn't found, it means it's offscreen and thus provides coverage (since
        // there's no content needed to be covered). And if every tile that is found
        // does provide coverage, the entire visible level provides coverage.
        
        /**
         * Returns true if the given tile provides coverage to lower-level tiles of
         * lower resolution representing the same content. If neither x nor y is
         * given, returns true if the entire visible level provides coverage.
         * 
         * Note that out-of-bounds tiles provide coverage in this sense, since
         * there's no content that they would need to cover. Tiles at non-existent
         * levels that are within the image bounds, however, do not.
         */
        function providesCoverage(level, x, y) {
            if (!coverage[level]) {
                return false;
            }
            
            if (x === undefined || y === undefined) {
                // check that every visible tile provides coverage.
                // update: protecting against properties added to the Object
                // class's prototype, which can definitely (and does) happen.
                var rows = coverage[level];
                for (var i in rows) {
                    if (rows.hasOwnProperty(i)) {
                        var cols = rows[i];
                        for (var j in cols) {
                            if (cols.hasOwnProperty(j) && !cols[j]) {
                               return false;
                            }
                        }
                    }
                }
                
                return true;
            }
            
            return (coverage[level][x] === undefined ||
                    coverage[level][x][y] === undefined ||
                    coverage[level][x][y] === true);
        }
        
        /**
         * Returns true if the given tile is completely covered by higher-level
         * tiles of higher resolution representing the same content. If neither x
         * nor y is given, returns true if the entire visible level is covered.
         */
        function isCovered(level, x, y) {
            if (x === undefined || y === undefined) {
                return providesCoverage(level+1);
            } else {
                return (providesCoverage(level+1, 2*x, 2*y) &&
                        providesCoverage(level+1, 2*x, 2*y + 1) &&
                        providesCoverage(level+1, 2*x + 1, 2*y) &&
                        providesCoverage(level+1, 2*x + 1, 2*y + 1));
            }
        }
        
        /**
         * Sets whether the given tile provides coverage or not.
         */
        function setCoverage(level, x, y, covers) {
            if (!coverage[level]) {
                SeadragonDebug.error("Setting coverage for a tile before its " +
                        "level's coverage has been reset: " + level);
                return;
            }
            
            if (!coverage[level][x]) {
                coverage[level][x] = {};
            }
            
            coverage[level][x][y] = covers;
        }
        
        /**
         * Resets coverage information for the given level. This should be called
         * after every draw routine. Note that at the beginning of the next draw
         * routine, coverage for every visible tile should be explicitly set. 
         */
        function resetCoverage(level) {
            coverage[level] = {};
        }
        
        // Helpers -- SCORING
        
        function compareTiles(prevBest, tile) {
            // figure out if this tile is better than the previous best tile...
            // note that if there is no prevBest, this is automatically better.
            if (!prevBest) {
                return tile;
            }
            
            if (tile.visibility > prevBest.visibility) {
                return tile;
            } else if (tile.visibility === prevBest.visibility) {
                if (tile.distance < prevBest.distance) {
                    return tile;
                }
            }
            
            return prevBest;
        }
        
        function sortTiles(a, b) {
            // helper, can be used in Array.sort to sort array of tiles
            if (a.visibility > b.visibility) {
                return -1;
            } else if (a.visibility < b.visibility) {
                return 1;
            } else { // equal
                if (a.distance < b.distance) {
                    return -1;
                } else if (a.distance > b.distance) {
                    return 1;
                }
            }

            return 0;
        }

        // Helpers -- OVERLAYS
        
        function getOverlayIndex(elmt) {
            for (var i = overlays.length - 1; i >= 0; i--) {
                if (overlays[i].elmt === elmt) {
                    return i;
                }
            }
            
            return -1;
        }
        
        // Helpers -- CORE
        /**
         * What do I need to return?
         * _lastUpdated is instance var
         * need list to load - can just load here...?
         */
        function updateTiles(fullDownload) {
            // make local references to variables & functions referenced in
            // loops in order to improve perf

            // the tiles that were drawn last frame, but won't be this frame,
            // can be cleared from the cache, so they should be marked as such.
			var i;
            for (i = 0; i < lastDrawn.length; i++) {
                lastDrawn[i].beingDrawn = false;
                lastDrawn[i].covered = false;
            }
            lastDrawn = [];
            var _lastDrawn = lastDrawn;
            imageLoader.clear();

            // if viewport is off image entirely, don't bother drawing.
            // UPDATE: logic modified to support horizontal/vertical wrapping.
            var viewportBounds = viewport.getBounds(true);
            if (isNaN(viewportBounds.x)) {
                viewport.goHome(true);
                viewportBounds = viewport.getBounds(true);
            }
            var viewportTL = viewportBounds.getTopLeft();
            var viewportBR = viewportBounds.getBottomRight();
            var wrapHorizontal = SeadragonConfig.wrapHorizontal;
            var wrapVertical = SeadragonConfig.wrapVertical;
            if (!wrapHorizontal &&
                    (viewportBR.x < 0 || viewportTL.x > 1)) {
                // we're not wrapping horizontally, and viewport is off in x
                return;
            } else if (!wrapVertical &&
                    (viewportBR.y < 0 || viewportTL.y > normHeight)) {
                // we're not wrapping vertically, and viewport is off in y
                return;
            }

            // the below section is commented out because it's more relevant to
            // collections, where you don't want 10 items to all load their xml
            // at the same time when 9 of them won't be in the viewport soon.

            //            // but even if the viewport is currently on the image, don't force
            //            // tiles to load if the viewport target is off the image
            //            var viewportTargetBounds = getViewportBounds(false);
            //            var viewportTargetTL = viewportTargetBounds.getTopLeft();
            //            var viewportTargetBR = viewportTargetBounds.getBottomRight();
            //            var willBeOff = viewportTargetBR.x < 0 || viewportTargetBR.y < 0 ||
            //                    viewportTargetTL.x > 1 || viewportTargetTL.y > normHeight;

            // make local references to functions and variables used in loops to
            // improve perf
            var _getNumTiles = getNumTiles;
            var _getPixelRatio = getPixelRatio;
            var _getTile = getTile;
            var _isCovered = isCovered;
            var _setCoverage = setCoverage;
            var _resetCoverage = resetCoverage;
            var _providesCoverage = providesCoverage;
            var _tileOverlap = tileOverlap;
            var _lastFrameTime = lastFrameTime;
            var isChrome = (browser === SeadragonBrowser.CHROME);
            // same for Math functions
            var _abs = Math.abs;
            var _floor = Math.floor;
            var _log = Math.log;
            var _max = Math.max;
            var _min = Math.min;
            // and Viewport functions
            var _deltaPixelsFromPoints = viewport.deltaPixelsFromPoints;
            var _pixelFromPoint = viewport.pixelFromPoint;
            // and TileSource functions
            var _getTileAtPoint = source.getTileAtPoint;
            // and Config properties
            var immediateRender = SeadragonConfig.immediateRender;
            var minDimension = SeadragonConfig.minZoomDimension || 64; // for backwards compatibility

            // restrain bounds of viewport relative to image.
            // UPDATE: logic modified to support horizontal/vertical wrapping.
            if (!wrapHorizontal) {
                viewportTL.x = _max(viewportTL.x, 0);
                viewportBR.x = _min(viewportBR.x, 1);
            }
            if (!wrapVertical) {
                viewportTL.y = _max(viewportTL.y, 0);
                viewportBR.y = _min(viewportBR.y, normHeight);
            }

            var currentTime = Date.now();

            // calculate values for scoring -- this is based on TARGET values
            var viewportCenterPoint = viewport.getCenter();
            var viewportCenterPixel = _pixelFromPoint(viewportCenterPoint);
            var zeroRatioT = _deltaPixelsFromPoints(_getPixelRatio(0), false).x;
            var optimalPixelRatio = immediateRender ? 1 : zeroRatioT;

            // adjust levels to iterate over -- this is based on CURRENT values
            // TODO change this logic to use minImageRatio, but for backwards
            // compatibility, use minDimension if it's been explicitly set.
            // TEMP for now, original minDimension logic with default 64.
            //minDimension = minDimension || 64;
            var minPixelRatio = (viewport.getZoom(true) < 0.8) ? MIN_PIXEL_RATIO : 0.5;
            var zeroRatioC = _deltaPixelsFromPoints(_getPixelRatio(0), true).x;
            var highestLevel = _min(maxLevel,
                    _floor(_log(zeroRatioC / minPixelRatio) / _log(2)));
            var lowestLevel = _max(minLevel, _floor(_log(minDimension) / _log(2)));
            lowestLevel = _min(lowestLevel, highestLevel); // with very small images, this edge case can occur...

            // START loading tiles
            var loadQueue = [];
            var best = null;
            var haveDrawn = false;
            for (var level = highestLevel; level >= lowestLevel; level--) {
                var drawLevel = false;
                var renderPixelRatioC = _deltaPixelsFromPoints(
                        _getPixelRatio(level), true).x;     // note the .x!

                // if we haven't drawn yet, only draw level if tiles are big enough
                if ((!haveDrawn && renderPixelRatioC >= minPixelRatio) ||
                        level === lowestLevel) {
                    drawLevel = true;
                    haveDrawn = true;
                } else if (!haveDrawn) {
                    continue;
                }

                _resetCoverage(level);

                // calculate scores applicable to all tiles on this level --
                // note that we're basing visibility on the TARGET pixel ratio
                //var levelOpacity = _min(1, (renderPixelRatioC - 0.5) / 0.5);
                //var renderPixelRatioT = _deltaPixelsFromPoints(
                //        _getPixelRatio(level), false).x;
                //var levelVisibility = optimalPixelRatio /
                //        _abs(optimalPixelRatio - renderPixelRatioT);

                // only iterate over visible tiles
                var tileTL = _getTileAtPoint(level, viewportTL);
                var tileBR = _getTileAtPoint(level, viewportBR);
                var numTiles = _getNumTiles(level);
                var numTilesX = numTiles.x;
                var numTilesY = numTiles.y;
                if (!wrapHorizontal) {
                    tileBR.x = _min(tileBR.x, numTilesX - 1);
                }
                if (!wrapVertical) {
                    tileBR.y = _min(tileBR.y, numTilesY - 1);
                }

                // create and get tiles
                // iterate from center spiraling out
                var dx = 1,
                    dy = 0,
                    segmentLength = 1,
                    width = tileBR.x - tileTL.x,
                    height = tileBR.y - tileTL.y,
                    x = tileTL.x + Math.floor(width / 2),
                    y = tileTL.y + Math.floor(height / 2),
                    segmentPassed = 0,
                    numTiles = (width + 1) * (height + 1),
                    levelLoadQueue = [],
                    minx = Infinity,
                    maxx = -Infinity,
                    miny = Infinity,
                    maxy = -Infinity,
                    k,
                    buffer;

                for (k = 0; k < numTiles; k++) {

                    // update min and max
                    minx = Math.min(x, minx);
                    maxx = Math.max(x, maxx);
                    miny = Math.min(y, miny);
                    maxy = Math.max(y, maxy);

                    // load tile
                    var tile = _getTile(level, x, y, currentTime, numTilesX, numTilesY);
                    var drawTile = drawLevel;

                    // assume this tile doesn't cover initially
                    _setCoverage(level, x, y, false);

                    // check not part of sparse image, or failed to load
                    if (tile.exists) {
                        // if we've drawn a higher-resolution level and we're not
                        // going to draw this level, then say this tile does cover
                        // if it's covered by higher-resolution tiles. if we're not
                        // covered, then we should draw this tile regardless.
                        if (haveDrawn && !drawTile) {
                            if (_isCovered(level, x, y)) {
                                _setCoverage(level, x, y, true);
                            } else {
                                drawTile = true;
                            }
                        }

                        if (drawTile) {
                            // calculate tile's position and size in pixels
                            var boundsTL = tile.bounds.getTopLeft();
                            var boundsSize = tile.bounds.getSize();
                            var positionC = _pixelFromPoint(boundsTL, true);
                            var sizeC = _deltaPixelsFromPoints(boundsSize, true);

                            // if there is no tile overlap, we need to oversize the
                            // tiles by 1px to prevent seams at imperfect zooms.
                            // fortunately, this is not an issue with regular dzi's
                            // created from Deep Zoom Composer, which uses overlap.
                            if (!_tileOverlap) {
                                sizeC = sizeC.plus(new SeadragonPoint(1, 1));
                            }

                            // update tile's scores and values
                            tile.position = positionC;
                            tile.size = sizeC;

                            // push
                            _lastDrawn.push(tile);
                            if (!tile.loaded && !tile.loading) {
                                levelLoadQueue.push(tile);
                            }
                        }
                    }

                    

                    // make a step
                    x += dx;
                    y += dy;
                    segmentPassed++;

                    var flipIter = 0;
                    while (!(tileTL.x <= x && x <= tileBR.x &&
                            tileTL.y <= y && y <= tileBR.y)) {
                        
                        flipIter++;
                        if (flipIter >= 4) {
                            //console.log('flipped all');
                            break;
                        }
                        segmentPassed = 0;

                        if (x < tileTL.x) {
                            x = tileTL.x;
                            y = miny - 1;
                            dx = 1;
                            dy = 0;
                            segmentLength = Math.max(1, maxx - tileTL.x + 1);
                        } else if (y > tileBR.y) {
                            x = minx - 1;
                            y = tileBR.y;
                            dx = 0;
                            dy = -1;
                            segmentLength = Math.max(1, tileBR.y - miny + 1);
                        } else if (x > tileBR.x) {
                            x = tileBR.x;
                            y = maxy + 1;
                            dx = -1;
                            dy = 0;
                            segmentLength = Math.max(1, tileBR.x - minx + 1);
                        } else if (y < tileTL.y) {
                            x = maxx + 1;
                            y = tileTL.y;
                            dx = 0;
                            dy = 1;
                            segmentLength = Math.max(1, maxy - tileTL.y + 1);
                        }
                    }
                    
                    // rotate?
                    if (segmentPassed === segmentLength) {
                        segmentPassed = 0;
                        buffer = dx;
                        dx = -dy;
                        dy = buffer;

                        // increase length if necessary
                        if (dy === 0) {
                            segmentLength++;
                        }
                    }
                }
                if (levelLoadQueue.length > 0) {
                    loadQueue.push(levelLoadQueue);
                }
            }
            // Finish picking tiles

            // now load (in reverse order)
            var currLevel;
            if (fullDownload) {
                for (i = (loadQueue.length - 1); i >= 0; i--) {
                    currLevel = loadQueue[i];
                    currLevel.map(loadTile);
                }
            } else if (loadQueue.length > 0) {
                currLevel = loadQueue[loadQueue.length-1];
                loadTile(currLevel[0], 10);
            }
        }

        function updateDraw() {
            // now draw the tiles, but in reverse order since we want higher-res
            // tiles to be drawn on top of lower-res ones. also mark each tile
            // as being drawn so it won't get cleared from the cache.
            var i, tile, deltaTime, opacity,
                _canvas = canvas,
                _context = context,
                alwaysBlend = SeadragonConfig.alwaysBlend,
                blendTimeMillis = 1000 * SeadragonConfig.blendTime,
                _useCanvas = useCanvas,
                _lastDrawn = lastDrawn,
                _setCoverage = setCoverage,
                _deltaPixelsFromPoints = viewport.deltaPixelsFromPoints,
                _pixelFromPoint = viewport.pixelFromPoint,
                viewportSize = viewport.getContainerSize(),
                viewportWidth = viewportSize.x,
                viewportHeight = viewportSize.y,
                _min = Math.min,
                _floor = Math.floor,
                currentTime = Date.now(),
                wrapOverlays = SeadragonConfig.wrapOverlays,
                wrapHorizontal = SeadragonConfig.wrapHorizontal,
                wrapVertical = SeadragonConfig.wrapVertical;

            updateAgain = false;

            // clear canvas, whether in <canvas> mode or HTML mode.
            // this is important as scene may be empty this frame.
            if (_useCanvas) {
                _canvas.width = viewportWidth;
                _canvas.height = viewportHeight;
                //_context.clearRect(0, 0, viewportWidth, viewportHeight);
                // this last line shouldn't be needed. setting the width and
                // height should clear <canvas>, but Firefox doesn't always.
            } else {
                _canvas.innerHTML = "";
            }

            for (i = _lastDrawn.length - 1; i >= 0; i--) {
                tile = _lastDrawn[i];

                // draw it!
                if (tile.covered || isCovered(tile.level, tile.x, tile.y)) {
                    // remove from list to draw
                    // no need to adjust i since counting down
                    //_lastDrawn.splice(i, 1); too slow
                    tile.covered = true;
                } else if (tile.loaded) {
                    // update opacity
                    if (tile.opacity < 1) {
                        if (!tile.blendStart) {
                            // image was just added, blend it
                            tile.blendStart = currentTime;
                        }

                        deltaTime = currentTime - tile.blendStart;
                        opacity = (blendTimeMillis === 0) ? 1 :
                            _min(1, deltaTime / blendTimeMillis);

                        tile.opacity = opacity;
                    }
                    // effects of opacity
                    if (tile.opacity >= 1) {
                        _setCoverage(tile.level, tile.x, tile.y, true);

                        // workaround for chrome's weird flickering issue
                        //if (isChrome && tile.lastDrawnTime !== _lastFrameTime) {
                        //    _setCoverage(tile.level, tile.x, tile.y, false);
                        //}
                    } else {
                        updateAgain = true;
                    }

                    if (_useCanvas) {
                        tile.drawCanvas(_context);
                    } else {
                        tile.drawHTML(_canvas);
                    }

                    tile.beingDrawn = true;
                } else if (tile.exists) {
                    updateAgain = true;
                }
            }

            // draw the overlays -- TODO optimize based on viewport like tiles,
            // but this is tricky for non-scaling overlays like pins...
            var overlay, bounds, overlayTL;
            for (i = 0; i < overlays.length; i++) {
                overlay = overlays[i];
                bounds = overlay.bounds;
                overlayTL = bounds.getTopLeft();    // in normalized coords

                // wrap overlays if specified
                if (wrapOverlays && wrapHorizontal) {
                    // TEMP this isn't perfect, e.g. view center is at -2.1 and
                    // overlay is at 0.1, this will use -2.9 instead of -1.9.
                    overlayTL.x += _floor(viewportCenterPoint.x);
                }
                if (wrapOverlays && wrapVertical) {
                    // TODO wrap overlays vertically
                }

                overlay.position = _pixelFromPoint(overlayTL, true);
                overlay.size = _deltaPixelsFromPoints(bounds.getSize(), true);

                overlay.drawHTML(container);
            }

            // new: save this frame's timestamp to enable comparing times
            lastFrameTime = currentTime;
        }

        // Methods -- OVERLAYS
        
        this.addOverlay = function(elmt, loc, placement) {
            elmt = SeadragonUtils.getElement(elmt);
            
            if (getOverlayIndex(elmt) >= 0) {
                return;     // they're trying to add a duplicate overlay
            }
            
            overlays.push(new Overlay(elmt, loc, placement));
            updateAgain = true;
            viewer.scheduleUpdate();
        };
        
        this.updateOverlay = function(elmt, loc, placement) {
            elmt = SeadragonUtils.getElement(elmt);
            var i = getOverlayIndex(elmt);
            
            if (i >= 0) {
                overlays[i].update(loc, placement);
                updateAgain = true;
                viewer.scheduleUpdate();
            }
        };
       
        this.removeOverlay = function(elmt) {
            elmt = SeadragonUtils.getElement(elmt);
            var i = getOverlayIndex(elmt);
            
            if (i >= 0) {
                overlays[i].destroy();
                overlays.splice(i, 1);
                updateAgain = true;     // TODO do we really need this?
                viewer.scheduleUpdate();
            }
        };
        
        this.clearOverlays = function() {
            while (overlays.length > 0) {
                overlays.pop().destroy();
                updateAgain = true;     // TODO do we really need this?
                viewer.scheduleUpdate();
                                        // TODO it also doesn't need to be in the loop.
            }
        };
        
        // Methods -- CORE
        
        this.needsUpdate = function() {
            return updateAgain;
        };
        
        this.numTilesLoaded = function() {
            return tilesLoaded.length;
        };
        
        this.reset = function() {
            clearTiles();
            lastResetTime = Date.now();
            updateAgain = true;
        };
        
        this.update = function (fullUpdate, fullDownload) {
            midUpdate = true;
            if (fullUpdate) {
                updateTiles(fullDownload);
            }
            updateDraw();
            midUpdate = false;
        };
    
        this.idle = function() {
            // TODO idling function
        };
        
    };
    
})();

/*************/
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SeadragonViewer,
    SeadragonControlAnchor;

(function () {

    // Constants

    var SIGNAL = "----seadragon----";

    // Private static

    var browser = SeadragonUtils.getBrowser();

    // Controls

    SeadragonControlAnchor = Seadragon.ControlAnchor = {
        NONE: 0,
        TOP_LEFT: 1,
        TOP_RIGHT: 2,
        BOTTOM_RIGHT: 3,
        BOTTOM_LEFT: 4
    };

    /**
     * Adds the given element to the given container based on the given anchor,
     * such that all new elements anchored to a right edge are shown to the left
     * of existing elements anchored to the same edge.
     */
    function addToAnchor(elmt, anchor, container) {
        if (anchor === SeadragonControlAnchor.TOP_RIGHT || anchor === SeadragonControlAnchor.BOTTOM_RIGHT) {
            container.insertBefore(elmt, container.firstChild);
        } else {
            container.appendChild(elmt);
        }
    }

    function Control(elmt, anchor, container) {
        // Fields
        var wrapper = SeadragonUtils.makeNeutralElement("span");

        // Properties
        this.elmt = elmt;
        this.anchor = anchor;
        this.container = container;
        this.wrapper = wrapper;

        // Constructor
        wrapper.style.display = "inline-block";
        wrapper.appendChild(elmt);
        if (anchor === SeadragonControlAnchor.NONE) {
            wrapper.style.width = wrapper.style.height = "100%";    // IE6 fix
        }

        addToAnchor(wrapper, anchor, container);
    }

    Control.prototype.destroy = function () {
        this.wrapper.removeChild(this.elmt);
        this.container.removeChild(this.wrapper);
    };

    Control.prototype.isVisible = function () {
        // see note in setVisible() below about using "display: none"
        return this.wrapper.style.display !== "none";
    };

    Control.prototype.setVisible = function (visible) {
        // using "display: none" instead of "visibility: hidden" so that mouse
        // events are no longer blocked by this invisible control.
        this.wrapper.style.display = visible ? "inline-block" : "none";
    };

    Control.prototype.setOpacity = function (opacity) {
        // like with setVisible() above, we really should be working with the
        // wrapper element and not the passed in element directly, so that we
        // don't conflict with the developer's own opacity settings. but this
        // doesn't work in IE always, so for our controls, use a hack for now...
        if (this.elmt[SIGNAL] && browser === SeadragonBrowser.IE) {
            SeadragonUtils.setElementOpacity(this.elmt, opacity, true);
        } else {
            SeadragonUtils.setElementOpacity(this.wrapper, opacity, true);
        }
    };

    // Navigation control

    var FULL_PAGE = "fullpage";
    var HOME = "home";
    var ZOOM_IN = "zoomin";
    var ZOOM_OUT = "zoomout";

    var REST = "_rest.png";
    var GROUP = "_grouphover.png";
    var HOVER = "_hover.png";
    var DOWN = "_pressed.png";

    function makeNavControl(viewer) {
        var group = null;
        var zooming = false;    // whether we should be continuously zooming
        var zoomFactor = null;  // how much we should be continuously zooming by
        var lastZoomTime = null;

        function onHome() {
            if (viewer.viewport) {
                viewer.viewport.goHome();
            }
        }

        function onFullPage() {
            viewer.setFullPage(!viewer.isFullPage());
            group.emulateExit();  // correct for no mouseout event on change

            if (viewer.viewport) {
                viewer.viewport.applyConstraints();
            }
        }

        function beginZoomingIn() {
            lastZoomTime = Date.now();
            zoomFactor = SeadragonConfig.zoomPerSecond;
            zooming = true;
            scheduleZoom();
        }

        function beginZoomingOut() {
            lastZoomTime = Date.now();
            zoomFactor = 1.0 / SeadragonConfig.zoomPerSecond;
            zooming = true;
            scheduleZoom();
        }

        function endZooming() {
            zooming = false;
        }

        function scheduleZoom() {
            window.setTimeout(doZoom, 10);
        }

        function doZoom() {
            if (zooming && viewer.viewport) {
                var currentTime = Date.now();
                var deltaTime = currentTime - lastZoomTime;
                var adjustedFactor = Math.pow(zoomFactor, deltaTime / 1000);

                viewer.viewport.zoomBy(adjustedFactor);
                viewer.viewport.applyConstraints();
                lastZoomTime = currentTime;
                scheduleZoom();
            }
        }

        function doSingleZoomIn() {
            if (viewer.viewport) {
                zooming = false;
                viewer.viewport.zoomBy(SeadragonConfig.zoomPerClick / 1.0);
                viewer.viewport.applyConstraints();
            }
        }

        function doSingleZoomOut() {
            if (viewer.viewport) {
                zooming = false;
                viewer.viewport.zoomBy(1.0 / SeadragonConfig.zoomPerClick);
                viewer.viewport.applyConstraints();
            }
        }

        function lightUp() {
            group.emulateEnter();
            group.emulateExit();
        }

        function url(prefix, postfix) {
            return SeadragonConfig.imagePath + prefix + postfix;
        }

        var zoomIn = new SeadragonButton(SeadragonStrings.getString("Tooltips.ZoomIn"),
                url(ZOOM_IN, REST), url(ZOOM_IN, GROUP), url(ZOOM_IN, HOVER),
                url(ZOOM_IN, DOWN), beginZoomingIn, endZooming, doSingleZoomIn,
                beginZoomingIn, endZooming);

        var zoomOut = new SeadragonButton(SeadragonStrings.getString("Tooltips.ZoomOut"),
                url(ZOOM_OUT, REST), url(ZOOM_OUT, GROUP), url(ZOOM_OUT, HOVER),
                url(ZOOM_OUT, DOWN), beginZoomingOut, endZooming, doSingleZoomOut,
                beginZoomingOut, endZooming);

        var goHome = new SeadragonButton(SeadragonStrings.getString("Tooltips.Home"),
                url(HOME, REST), url(HOME, GROUP), url(HOME, HOVER),
                url(HOME, DOWN), null, onHome, null, null, null);

        var fullPage = new SeadragonButton(SeadragonStrings.getString("Tooltips.FullPage"),
                url(FULL_PAGE, REST), url(FULL_PAGE, GROUP), url(FULL_PAGE, HOVER),
                url(FULL_PAGE, DOWN), null, onFullPage, null, null, null);

        group = new SeadragonButtonGroup([zoomIn, zoomOut, goHome, fullPage]);
        group.elmt[SIGNAL] = true;   // hack to get our controls to fade

        viewer.addEventListener("open", lightUp);

        return group.elmt;
    }

    // Viewer
    // TAG: added ignore constraints to ignore constraints for mouse in authoring mode of RIN
    SeadragonViewer = Seadragon.Viewer = function (container, ignoreConstraints) {

        // hack to decrease bounds so image doesn't disappear
        if (ignoreConstraints) {
            //Seadragon.Config.minZoomDimension = null;
            Seadragon.Config.minZoomImageRatio = 0.1;
            //Seadragon.Config.maxZoomPixelRatio = 10;
            ////Seadragon.Config.visibilityRatio = 0.8;
        } else {
            Seadragon.Config.minZoomImageRatio = 0.8;
        }

        // Fields

        var self = this;

        var parent = SeadragonUtils.getElement(container);
        container = SeadragonUtils.makeNeutralElement("div");
        self.container = container;
        var canvas = SeadragonUtils.makeNeutralElement("div");
        self.canvas = canvas;

        var controlsTL = SeadragonUtils.makeNeutralElement("div");
        var controlsTR = SeadragonUtils.makeNeutralElement("div");
        var controlsBR = SeadragonUtils.makeNeutralElement("div");
        var controlsBL = SeadragonUtils.makeNeutralElement("div");

        var source = null;
        var drawer = null;
        var viewport = null;
        var profiler = null;

        var eventManager = new SeadragonEventManager();
        var innerTracker = new SeadragonMouseTracker(canvas);
        var outerTracker = new SeadragonMouseTracker(container);

        var controls = [];
        //var controlsShouldFade = true;
        //var controlsFadeBeginTime = null;
        var navControl = null;

        var controlsFadeDelay = 1000;   // begin fading after 1 second
        var controlsFadeLength = 2000;  // fade over 2 second period
        var controlsFadeBeginTime = null;
        var controlsShouldFade = false;

        var bodyWidth = document.body.style.width;
        var bodyHeight = document.body.style.height;
        var bodyOverflow = document.body.style.overflow;
        var docOverflow = document.documentElement.style.overflow;

        var fsBoundsDelta = new SeadragonPoint(1, 1);
        var prevContainerSize = null;

        var lastOpenStartTime = 0;
        var lastOpenEndTime = 0;

        var mouseDownPixel = null;
        var mouseDownCenter = null;

        var animating = false;
        var forceRedraw = false;
        var mouseInside = false;

        // Properties

        this.container = parent;
        this.elmt = container;

        this.source = null;
        this.drawer = null;
        this.viewport = null;
        this.profiler = null;

        this.tracker = innerTracker;

        self.loopId = null;

        var requestAnimationFrame =
            window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback) {
                var currTime = Date.now();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
                  timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            }

        var cancelAnimationFrame =
            window.cancelAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            window.mozCanelAnimationFrame ||
            window.oCancelAnimationFrame ||
            window.msCancelAnimationFrame ||
            function (id) {
                clearTimeout(id);
            };

        // Helpers -- UI

        function initialize() {
            // copy style objects to improve perf
            var canvasStyle = canvas.style;
            var containerStyle = container.style;
            var controlsTLStyle = controlsTL.style;
            var controlsTRStyle = controlsTR.style;
            var controlsBRStyle = controlsBR.style;
            var controlsBLStyle = controlsBL.style;

            containerStyle.width = "100%";
            containerStyle.height = "100%";
            containerStyle.position = "relative";
            containerStyle.left = "0px";
            containerStyle.top = "0px";
            containerStyle.textAlign = "left";  // needed to protect against
            // incorrect centering

            canvasStyle.width = "100%";
            canvasStyle.height = "100%";
            canvasStyle.overflow = "hidden";
            canvasStyle.position = "absolute";
            canvasStyle.top = "0px";
            canvasStyle.left = "0px";

            controlsTLStyle.position = controlsTRStyle.position =
                    controlsBRStyle.position = controlsBLStyle.position =
                    "absolute";

            controlsTLStyle.top = controlsTRStyle.top = "0px";
            controlsTLStyle.left = controlsBLStyle.left = "0px";
            controlsTRStyle.right = controlsBRStyle.right = "0px";
            controlsBLStyle.bottom = controlsBRStyle.bottom = "0px";

            // mouse tracker handler for canvas (pan and zoom)

            
            innerTracker.clickHandler = onCanvasClick;
            innerTracker.pressHandler = onCanvasPress;
            innerTracker.dragHandler = onCanvasDrag;
            innerTracker.releaseHandler = onCanvasRelease;
            innerTracker.scrollHandler = onCanvasScroll;
            innerTracker.setTracking(true);     // default state
            
            // create default navigation control
            navControl = makeNavControl(self);
            navControl.style.marginRight = "4px";
            navControl.style.marginBottom = "4px";
            self.addControl(navControl, SeadragonControlAnchor.BOTTOM_RIGHT);

            // mouse tracker handler for container (controls fading)
            
            outerTracker.enterHandler = onContainerEnter;
            outerTracker.exitHandler = onContainerExit;
            outerTracker.releaseHandler = onContainerRelease;
            outerTracker.setTracking(true); // always tracking
            window.setTimeout(beginControlsAutoHide, 1);    // initial fade out
            

            //append to DOM only at end
            container.appendChild(canvas);
            container.appendChild(controlsTL);
            container.appendChild(controlsTR);
            container.appendChild(controlsBR);
            container.appendChild(controlsBL);
            parent.innerHTML = "";          // clear any existing content...
            parent.appendChild(container);  // ...then add the real container
        }

        function setMessage(message) {
            var textNode = document.createTextNode(message);

            canvas.innerHTML = "";
            canvas.appendChild(document.createElement('div'));
            //canvas.appendChild(SeadragonUtils.makeCenteredNode(textNode));

            /*var textStyle = textNode.parentNode.style;

            // explicit styles for error message
            //textStyle.color = "white";    // TEMP uncommenting this; very obtrusive
            textStyle.fontFamily = "verdana";
            textStyle.fontSize = "13px";
            textStyle.fontSizeAdjust = "none";
            textStyle.fontStyle = "normal";
            textStyle.fontStretch = "normal";
            textStyle.fontVariant = "normal";
            textStyle.fontWeight = "normal";
            textStyle.lineHeight = "1em";
            textStyle.textAlign = "center";
            textStyle.textDecoration = "none";*/
        }

        // Helpers -- CORE

        function beforeOpen() {
            if (source) {
                onClose();
            }

            lastOpenStartTime = Date.now();   // to ignore earlier opens

            // show loading message after a delay if it still hasn't loaded
            window.setTimeout(function () {
                if (lastOpenStartTime > lastOpenEndTime) {
                    setMessage(SeadragonStrings.getString("Messages.Loading"));
                }
            }, 2000);

            return lastOpenStartTime;
        }

        function onOpen(time, _source, error) {
            lastOpenEndTime = Date.now();

            if (time < lastOpenStartTime) {
                SeadragonDebug.log("Ignoring out-of-date open.");
                eventManager.trigger("ignore", self);
                return;
            } else if (!_source) {
                setMessage(error);
                eventManager.trigger("error", self);
                return;
            }

            // clear any previous message
            canvas.innerHTML = "";
            prevContainerSize = SeadragonUtils.getElementSize(container);

            // UPDATE: if the container is collapsed, we should delay opening
            // since we don't know yet what the home zoom should be, so opening
            // when the container gets layout will allow us to gracefully and
            // correctly start at home. this also prevents viewport NaN values.
            // what timeout value should we use? it's arbitrary, but given that
            // this generally only occurs in embed scenarios where the image is
            // opened before the page has even finished loading, we'll use very
            // small timeout values to be crisp and responsive. note that this
            // polling is necessary; there is no good cross-browser event here.
            if (prevContainerSize.x === 0 || prevContainerSize.y === 0) {
                window.setTimeout(function () {
                    onOpen(time, _source, error);
                }, 10);
                return;
            }

            // assign fields
            source = _source;
            viewport = new SeadragonViewport(prevContainerSize, source.dimensions, self);
            drawer = new SeadragonDrawer(source, viewport, canvas, self, ignoreConstraints);
            profiler = new SeadragonProfiler();

            // assign properties
            self.source = source;
            self.viewport = viewport;
            self.drawer = drawer;
            self.profiler = profiler;

            // begin updating
            animating = false;
            forceRedraw = true;
            eventManager.trigger("open", self);
            if (!self.loopId) self.loopId = requestAnimationFrame(updateOnce);
            //scheduleUpdate(updateMulti);
        }

        function onClose() {
            // TODO need destroy() methods to prevent leaks? check for null if so.

            // nullify fields and properties
            self.source = source = null;
            self.viewport = viewport = null;
            self.drawer = drawer = null;
            self.profiler = profiler = null;

            // clear all tiles and any message
            canvas.innerHTML = "";
        }

        /**
         * Schedules a complete redraw of the image
         */
        function scheduleUpdate() {
            if (!self.loopId) {
                self.loopId = requestAnimationFrame(updateOnce);
            }
            forceRedraw = true;
        }
        this.scheduleUpdate = scheduleUpdate;

        function updateOnce() {
            self.loopId = requestAnimationFrame(updateOnce);

            if (!source) {
                return;
            }

            var containerSize = SeadragonUtils.getElementSize(container);

            // UPDATE: don't break if the viewer was collapsed or hidden!
            // in that case, go ahead still update normally as we were before,
            // but don't notify the viewport of the resize! prevents NaN bug.
            if (!containerSize.equals(prevContainerSize) &&
                    containerSize.x > 0 && containerSize.y > 0) {
                viewport.resize(containerSize, true); // maintain image position
                prevContainerSize = containerSize;
                eventManager.trigger("resize", self);
            }

            var animated = viewport.update();
            var animEnd = animating && !animated;

            if (!animating && animated) {
                // we weren't animating, and now we did ==> animation start
                eventManager.trigger("animationstart", self);
                abortControlsAutoHide();
            }

            if (animated) {
                // viewport moved
                drawer.update(true, false);
                eventManager.trigger("animation", self);
            } else if (forceRedraw || drawer.needsUpdate()) {
                // need to load or blend images, etc.
                var fullUpdate = animEnd || forceRedraw;
                drawer.update(fullUpdate, fullUpdate);
            }
            else {
                // no changes, so stop drawing
                cancelAnimationFrame(self.loopId);
                self.loopId = null;
            }

            if (animEnd) {
                // we were animating, and now we're not anymore ==> animation finish
                eventManager.trigger("animationfinish", self);

                // if the mouse has left the container, begin fading controls
                //if (!mouseInside) {
                //    beginControlsAutoHide();
                //}
            }

            animating = animated;
            forceRedraw = false;
        }

        // Controls

        function getControlIndex(elmt) {
            for (var i = controls.length - 1; i >= 0; i--) {
                if (controls[i].elmt === elmt) {
                    return i;
                }
            }

            return -1;
        }

        function scheduleControlsFade() {
            window.setTimeout(updateControlsFade, 20);
        }

        function updateControlsFade() {
            if (controlsShouldFade) {
                var currentTime = Date.now();
                var deltaTime = currentTime - controlsFadeBeginTime;
                var opacity = 1.0 - deltaTime / controlsFadeLength;

                opacity = Math.min(1.0, opacity);
                opacity = Math.max(0.0, opacity);

                for (var i = controls.length - 1; i >= 0; i--) {
                    controls[i].setOpacity(opacity);
                }

                if (opacity > 0) {
                    scheduleControlsFade();    // fade again
                }
            }
        }

        function abortControlsAutoHide() {
            controlsShouldFade = false;
            for (var i = controls.length - 1; i >= 0; i--) {
                controls[i].setOpacity(1.0);
            }
        }

        function beginControlsAutoHide() {
            if (!SeadragonConfig.autoHideControls) {
                return;
            }

            controlsShouldFade = true;
            controlsFadeBeginTime = Date.now() + controlsFadeDelay;
            window.setTimeout(scheduleControlsFade, controlsFadeDelay);
        }

        // Mouse interaction with container

        function onContainerEnter(tracker, position, buttonDownElmt, buttonDownAny) {
            mouseInside = true;
            abortControlsAutoHide();
        }

        function onContainerExit(tracker, position, buttonDownElmt, buttonDownAny) {
            // fade controls out over time, only if the mouse isn't down from
            // within the container (e.g. panning, or using a control)
            if (!buttonDownElmt) {
                mouseInside = false;
                if (!animating) {
                    //beginControlsAutoHide();
                }
            }
        }

        function onContainerRelease(tracker, position, insideElmtPress, insideElmtRelease) {
            // the mouse may have exited the container and we ignored it if the
            // mouse was down from within the container. now when the mouse is
            // released, we should fade the controls out now.
            if (!insideElmtRelease) {
                mouseInside = false;
                if (!animating) {
                    beginControlsAutoHide();
                }
            }
        }

        // Mouse interaction with canvas

        function onCanvasClick(tracker, position, quick, shift) {
            if (viewport && quick) {    // ignore clicks where mouse moved
                var zoomPerClick = SeadragonConfig.zoomPerClick;
                var factor = shift ? 1.0 / zoomPerClick : zoomPerClick;
                viewport.zoomBy(factor, viewport.pointFromPixel(position, true));
                //if (!ignoreConstraints) {
                    viewport.applyConstraints();
                //}
            }
        }

        function onCanvasPress(tracker, position) {
            if (viewport) {
                mouseDownPixel = position;
                mouseDownCenter = viewport.getCenter();
            }
        }

        function onCanvasDrag(tracker, position, delta, shift) {
            if (viewport) {
                // note that in both cases, we're negating delta pixels since
                // dragging is opposite of panning. analogy is adobe viewer,
                // dragging up scrolls down.
                if (SeadragonConfig.constrainDuringPan) {
                    var deltaPixels = position.minus(mouseDownPixel);
                    var deltaPoints = viewport.deltaPointsFromPixels(deltaPixels.negate(), true);
                    viewport.panTo(mouseDownCenter.plus(deltaPoints));
                    //if (!ignoreConstraints) {
                        viewport.applyConstraints();
                    //}
                } else {
                    viewport.panBy(viewport.deltaPointsFromPixels(delta.negate(), true));
                }
            }
        }

        function onCanvasRelease(tracker, position, insideElmtPress, insideElmtRelease) {
            if (insideElmtPress && viewport && !ignoreConstraints) {
                viewport.applyConstraints();
            }
        }

        function onCanvasScroll(tracker, position, delta, shift) {
            if (viewport) {
                var factor = Math.pow(SeadragonConfig.zoomPerScroll, delta);
                viewport.zoomBy(factor, viewport.pointFromPixel(position, true));
                //if (!ignoreConstraints) {
                    viewport.applyConstraints();
                //}
            }
        }

        // Keyboard interaction

        function onPageKeyDown(event) {
            event = SeadragonUtils.getEvent(event);
            if (event.keyCode === 27) {    // 27 means esc key
                self.setFullPage(false);
            }
        }

        // Methods -- IMAGE

        this.isOpen = function () {
            return !!source;
        };

        this.openDzi = function (xmlUrlOrJsonObj, xmlString) {
            var currentTime = beforeOpen();
            var callback = SeadragonUtils.createCallback(null, onOpen, currentTime);

            if (typeof(xmlUrlOrJsonObj) === 'string') {
                SeadragonDziTileSource.createFromXml(xmlUrlOrJsonObj, xmlString, callback);
            } else {
                SeadragonDziTileSource.createFromJson(xmlUrlOrJsonObj, callback);
            }
        };

        this.openTileSource = function (tileSource) {
            var currentTime = beforeOpen();
            window.setTimeout(function () {
                onOpen(currentTime, tileSource);
            }, 1);
        };

        this.close = function () {
            if (!source) {
                return;
            }

            onClose();
        };

        // Methods -- CONTROLS

        this.addControl = function (elmt, anchor) {
            elmt = SeadragonUtils.getElement(elmt);

            if (getControlIndex(elmt) >= 0) {
                return;     // they're trying to add a duplicate control
            }

            var div = null;

            switch (anchor) {
                case SeadragonControlAnchor.TOP_RIGHT:
                    div = controlsTR;
                    elmt.style.position = "relative";
                    break;
                case SeadragonControlAnchor.BOTTOM_RIGHT:
                    div = controlsBR;
                    elmt.style.position = "relative";
                    break;
                case SeadragonControlAnchor.BOTTOM_LEFT:
                    div = controlsBL;
                    elmt.style.position = "relative";
                    break;
                case SeadragonControlAnchor.TOP_LEFT:
                    div = controlsTL;
                    elmt.style.position = "relative";
                    break;
                case SeadragonControlAnchor.NONE:
                default:
                    div = container;
                    elmt.style.position = "absolute";
                    break;
            }

            controls.push(new Control(elmt, anchor, div));
        };

        this.removeControl = function (elmt) {
            elmt = SeadragonUtils.getElement(elmt);
            var i = getControlIndex(elmt);

            if (i >= 0) {
                controls[i].destroy();
                controls.splice(i, 1);
            }
        };

        this.clearControls = function () {
            while (controls.length > 0) {
                controls.pop().destroy();
            }
        };

        this.getNavControl = function () {
            return navControl;
        };

        // Methods -- UI

        this.isDashboardEnabled = function () {
            for (var i = controls.length - 1; i >= 0; i--) {
                if (controls[i].isVisible()) {
                    return true;
                }
            }

            return false;
        };

        this.isFullPage = function () {
            return container.parentNode === document.body;
        };

        this.isMouseNavEnabled = function () {
            return innerTracker.isTracking();
        };

        this.isVisible = function () {
            return container.style.visibility !== "hidden";
        };

        this.setDashboardEnabled = function (enabled) {
            for (var i = controls.length - 1; i >= 0; i--) {
                controls[i].setVisible(enabled);
            }
        };

        this.setFullPage = function (fullPage) {
            if (fullPage === self.isFullPage()) {
                return;
            }

            // copy locally to improve perf
            var body = document.body;
            var bodyStyle = body.style;
            var docStyle = document.documentElement.style;
            var containerStyle = container.style;
            var canvasStyle = canvas.style;

            if (fullPage) {
                // change overflow, but preserve what current values are
                bodyOverflow = bodyStyle.overflow;
                docOverflow = docStyle.overflow;
                bodyStyle.overflow = "hidden";
                docStyle.overflow = "hidden";

                // IE6 needs the body width/height to be 100% also
                bodyWidth = bodyStyle.width;
                bodyHeight = bodyStyle.height;
                bodyStyle.width = "100%";
                bodyStyle.height = "100%";

                // always show black background, etc., for fullpage
                canvasStyle.backgroundColor = "black";
                canvasStyle.color = "white";

                // make container attached to the window, immune to scrolling,
                // and above any other things with a z-index set.
                containerStyle.position = "fixed";
                containerStyle.zIndex = "99999999";

                body.appendChild(container);
                prevContainerSize = SeadragonUtils.getWindowSize();

                // add keyboard listener for esc key, to exit full page.
                // add it on document because browsers won't give an arbitrary
                // element (e.g. this viewer) keyboard focus, and adding it to
                // window doesn't work properly in IE.
                SeadragonUtils.addEvent(document, "keydown", onPageKeyDown);

                onContainerEnter();     // mouse will be inside container now
            } else {
                // restore previous values for overflow
                bodyStyle.overflow = bodyOverflow;
                docStyle.overflow = docOverflow;

                // IE6 needed to overwrite the body width/height also
                bodyStyle.width = bodyWidth;
                bodyStyle.height = bodyHeight;

                // return to inheriting style
                canvasStyle.backgroundColor = "";
                canvasStyle.color = "";

                // make container be inline on page again, and auto z-index
                containerStyle.position = "relative";
                containerStyle.zIndex = "";

                parent.appendChild(container);
                prevContainerSize = SeadragonUtils.getElementSize(parent);

                // remove keyboard listener for esc key
                SeadragonUtils.removeEvent(document, "keydown", onPageKeyDown);

                onContainerExit();      // mouse will likely be outside now
            }

            if (viewport) {
                var oldBounds = viewport.getBounds();
                viewport.resize(prevContainerSize);
                var newBounds = viewport.getBounds();

                if (fullPage) {
                    // going to fullpage, remember how much bounds changed by.
                    fsBoundsDelta = new SeadragonPoint(newBounds.width / oldBounds.width,
                        newBounds.height / oldBounds.height);
                } else {
                    // leaving fullpage, negate how much the fullpage zoomed by.
                    // note that we have to negate the bigger of the two changes.
                    // we have to zoom about the center of the new bounds, but
                    // that's NOT the zoom point. so we have to manually update
                    // first so that that center becomes the viewport center.
                    viewport.update();
                    viewport.zoomBy(Math.max(fsBoundsDelta.x, fsBoundsDelta.y),
                            null, true);
                }

                forceRedraw = true;
                eventManager.trigger("resize", self);
                updateOnce();
            }
        };

        this.setMouseNavEnabled = function (enabled) {
            innerTracker.setTracking(enabled);
        };

        this.setVisible = function (visible) {
            // important: don't explicitly say "visibility: visible", because
            // the W3C spec actually says children of hidden elements that have
            // "visibility: visible" should still be rendered. that's usually
            // not what we (or developers) want. browsers are inconsistent in
            // this regard, but IE seems to follow this spec.
            container.style.visibility = visible ? "" : "hidden";
        };

        this.showMessage = function (message, delay) {
            if (!delay) {
                setMessage(message);
                return;
            }

            window.setTimeout(function () {
                if (!self.isOpen()) {
                    setMessage(message);
                }
            }, delay);
        };

        // Methods -- EVENT HANDLING

        this.addEventListener = function (eventName, handler) {
            eventManager.addListener(eventName, handler);
        };

        this.removeEventListener = function (eventName, handler) {
            eventManager.removeListener(eventName, handler);
        };

        this.unload = function () {
            if (self.loopId) {
                cancelAnimationFrame(self.loopId);
                self.loopId = null;
            }
        }

        // Constructor

        initialize();

    };

})();

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

	self.player 		= player;
	self.taskManager 	= taskManager;
	self.trackData 		= trackData;
	self.orchestrator	= orchestrator;
	self.status 		= "loading";


	Utils.extendsPrototype(this, _super);

    var keyframes           	= trackData.keyframes;   // Data structure to keep track of all displays/keyframes
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
						  "height"	: (500*keyframes[i].size.y/100) + "px"};
			self.taskManager.loadTask(parseFloat(keyframes[i].time - keyframes[i-1].time), keyframeData, _UIControl, keyframes[i].time);
		}
		self.status = "ready";


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
			_image.onload = function (event) {
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
		this.savedState = {
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
		return this.savedState;
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
		//this.savedState = state	
	};

		/* 
		I/P: none
		interpolates between current state and next keyframe
		O/P: none
		*/

		//******* Intentionally left out because I don't know how animation work... (ereif)
		function animate(){

	// 		// animate to next keyframe after where we are right now
	// 		var targetKeyFrame = getNextKeyframe(timeManager.getElapsedSeconds())

	//          media.onload =function(){
	//                         var  mediaobj = new Kinetic.Image(){
	//                 //set properties x,y,height, width followed by
	//                 image : media
	//                          });
	//             	 layer.add(mediaobj); //add the kinetic image to the stage’s layer
	//             	stage.add(layer); //add layer to the stage
	            
	//             	var animation = new Kintetic.Animation(function(frame){
	//                	 //define animation as desired},layer);
	//             	animation.start();

	// 		// When current animation has finished, begin next animation
	// this.animation.addEventListener("animationFinished", (function (event) {
	// 	this.animate() //This will start animation to the next keyframe
	// 		}

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

        //FOR ANIMATION TESTING PURPOSES (the blue square shows that finalPosition is correct, but with tweenLite, it is somehow impossible to animate there correctly when you have other animations going?) 
        // var test = $(document.createElement("div")).css({
        //     	"position" : "absolute",
        //     	"height": "10px",
        //     	"width": "10px",
        //     	"left": finalPosition.x,
        //     	"top": finalPosition.y,
        //     	"background-color": "blue"
        //     })
        //     $("#ITEHolder").append(test)

        // TweenLite.killTweensOf(_UIControl)
        // TweenLite.to(_UIControl, 1, {
        // 	y: finalPosition.y,
        // 	x: finalPosition.x
        // }, Ease.easeOutExpo);     

        // Animate to target location
        _UIControl.stop();
        _UIControl.animate({
        	top: finalPosition.y,
        	left: finalPosition.x
        }, "slow", "linear");
 
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

        // Animate to target zoom
        // TweenLite.to(_UIControl, .1, {
        // 	y: newY,
        // 	x: newX,
        // 	width: newW + "px"
        // }, Ease.easeOutExpo);   

        _UIControl.stop();
        _UIControl.css({
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

	self.player 		= player;
	self.taskManager 	= taskManager;
	self.trackData 		= trackData;
	self.orchestrator	= orchestrator;
	self.status 		= "loading";


	Utils.extendsPrototype(this, _super);

    var keyframes           	= trackData.keyframes;   // Data structure to keep track of all displays/keyframes
	this.trackInteractionEvent 	= new ITE.PubSubStruct();
	interactionHandlers 		= {},
	movementTimeouts 			= [],
	this.trackData   			= trackData;

    //DOM related
    var _deepZoom,
    	_UIControl,
    	_viewer;

	//Start things up...
    initialize()

   /** 
	* I/P: none
	* Initializes track, creates UI, and attachs handlers
	* O/P: none
	*/
	function initialize(){
		_super.initialize()


        if(Seadragon.Config) {
            Seadragon.Config.visibilityRatio = 0.8; // TODO see why Seadragon.Config isn't defined; should it be?
        }

		//Create UI and append to ITEHolder
		_UIControl = $(document.createElement("div"))
        	.addClass("UIControl")
			.on('mousedown scroll click mousemove resize', function(evt) {
            	evt.preventDefault();
        	})
        	.css("z-index", 0);
		$("#ITEHolder").append(_UIControl);

		//_viewer is the actual seadragon viewer.  It is appended to UIControl.
		_viewer	= new Seadragon.Viewer(_UIControl[0])
        _viewer.setMouseNavEnabled(false);
        _viewer.clearControls();

        // _deepZoom is the canvas with the deepZoom image files
        _deepZoom = $(_viewer.canvas)
			.addClass("deepZoomImage");

		var i, keyframeData;

		for (i=1; i<keyframes.length; i++) {
			keyframeData={
						  "opacity"	: keyframes[i].opacity,
						  "top"		: (500*keyframes[i].pos.y/100) + "px",
						  "left"	: (1000*keyframes[i].pos.x/100) + "px",
						  "width"	: (1000*keyframes[i].size.x/100) + "px",
						  "height"	: (500*keyframes[i].size.y/100) + "px"};
			self.taskManager.loadTask(parseFloat(keyframes[i].time - keyframes[i-1].time), keyframeData, _UIControl, keyframes[i].time);
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
        	_viewer.openDzi("../../Assets/TourData/" + this.trackData.assetUrl);
	};

   /** 
	* I/P: none
	* Grabs current actual state of image, and sets savedState to it 
	* returns savedState
	* O/P: savedState
	*/
	this.getState = function(){
		this.savedState = {
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
		return this.savedState;
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
		//this.savedState = state	
	};

		/* 
		I/P: none
		interpolates between current state and next keyframe
		O/P: none
		*/

		//******* Intentionally left out because I don't know how animation will work yet... (ereif)
		function animate(){
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

    	(self.orchestrator.status === 1) ? self.player.pause() : null

        var scale = res.scale,
            trans = res.translation,
            pivot = res.pivot;

        _viewer.viewport.zoomBy(scale, _viewer.viewport.pointFromPixel(new Seadragon.Point(pivot.x, pivot.y)), false);
        _viewer.viewport.panBy(_viewer.viewport.deltaPointsFromPixels(new Seadragon.Point(trans.x, trans.y)), false);
        _viewer.viewport.applyConstraints();
    }
    
    /**
     * Scroll/pinch-zoom handler for makeManipulatable on the deepzoom image
     * @method dzScroll
     * @param {Number} scale          scale factor
     * @param {Object} pivot          location of event (x,y)
     */
    function mediaScroll(scale, pivot) {
    	(self.orchestrator.status === 1) ? self.player.pause() : null
        
        mediaManip({
            scale: scale,
            translation: {
                x: 0,
                y: 0
            },
            pivot: pivot
        });
    }
   

    /** 
	* I/P: none
	* Initializes handlers 
	*/
    function attachHandlers() {

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


ITE.TaskManager = function(){

	self = this;

	this.timeline = new TimelineLite({
		onUpdate: this.updateFunction

	});

	//timer of entire tour
	this.timeManager = new ITE.TimeManager();
    
    this.state = 'starting';

	this.getElapsedTime = function(){
		return this.timeManager.getElapsedOffset();
	};	

	this.loadTask = function(duration,nextKeyframeData,asset,offsetParam){
        this.timeline.add(TweenLite.to(asset,duration,nextKeyframeData),offsetParam);
        this.timeline.pause();
        nextKeyframeData.ease = Linear.easeNone;

	};

	this.play = function(){ 
		if (this.state === "paused"){
			this.state = "playing";
	    }
		this.timeline.play();
		console.log("this.timeline: " + this.timeline._totalDuration)
		console.log("this.timeline: " + Object.keys(this.timeline))
		this.timeManager.startTimer();
	};

	this.pause = function(){
		this.state = "paused";
		this.timeline.pause();
		this.timeManager.stopTimer();
	};

	this.seek= function(seekedTime){
		this.timeManager.addElapsedTime(seekedTime);
		this.timeline.seek(seekedTime);

	};

	this.updateFunction= function(){};
};


/*************/
window.ITE = window.ITE || {};

ITE.Orchestrator = function(player) {
	status = 3;		// Current status of Orchestrator (played (1), paused (2), loading (3), buffering(4))
									// Defaulted to ‘loading’
	var	self = this,
		narrativeSeekedEvent 	= new ITE.PubSubStruct(),
		narrativeLoadedEvent 	= new ITE.PubSubStruct(),
		stateChangeEvent 		= new ITE.PubSubStruct();

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
					trackManager.push(new ITE.ImageProvider(trackData, self.player, self.taskManager, self));
					break;
				case "video" : 
					trackManager.push(new ITE.VideoProvider(trackData));
					break;
				case "audio" : 
					trackManager.push(new ITE.AudioProvider(trackData));
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
		// self.taskManager.scheduledTasks.sort(function(a, b){return a.timerOffset-b.timerOffset});
		self.taskManager.play();
		this.status = 1;
	}

	function triggerCurrentTracks (tasks) {
		this.status = 1
		//var currentElaspedTime = this.taskManager.getElapsedTime();

		for (task in tasks){
			if (tasks.hasOwnProperty(task)){
				task.track.play(task.offset, task.keyframe);
			};
		};
	};

	function pause(){
		self.taskManager.pause();
		this.status = 2;
	}

	function seek(seekTime){
	}

	function setVolume(newVolumeLevel){
	    this.volumeChangedEvent.publish({ "volume" : newVolumeLevel });
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
			if (track.providerID === "video" || track.providerID === "audio") {
				volumeChangedEvent.subscribe(track.changeVolume)
			}
			// Subscribes everything to other orchestrator events
			narrativeSeekedEvent.subscribe(track.seek)
			narrativeLoadedEvent.subscribe(track.load)

			//add each keyframe as a scheduled task
			for (j = 0; j < track.keyframes.length; j++){
				var keyframe = track.keyframes[j]
				self.taskManager.loadTask(keyframe.offset, keyframe, track);
			}
		}
	}
	this.trackManager = trackManager;
	this.unload = unload;
	this.play = play;
	this.triggerCurrentTracks = triggerCurrentTracks;
	this.pause = pause;
	this.seek = seek;
	this.setVolume = setVolume;
	this.captureKeyframe = captureKeyframe;
	this.areAllTracksReady = areAllTracksReady;
	this.initializeTracks = initializeTracks;
	this.status = status;
}



/*************/
window.ITE = window.ITE || {};

ITE.Player = function (options) { //acts as ITE object that contains the orchestrator, etc
   var  orchestrator            = new ITE.Orchestrator(this),

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
                setInitVolume:              100,
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
    var volumeButton,
        volumeLevel,
        playPauseButton,
        loopButton,
        progressBar,
        fullScreenButton,
        progressIndicator,

    //Other atributes
        currentVolumeLevel, //Percentage
        timeOffset,
        isMuted,
        isLooped,
        isFullScreen,

    //Other miscellaneous variables
        Utils               = new ITE.Utils();

    this.Orchestrator = orchestrator;

    var onLoadPlayerEvent = new ITE.PubSubStruct();
    // onLoadPlayerEvent.subscribe(this.Orchestrator.load, "loadTourObj", this.Orchestrator);
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

        //Attaches all necessary UI details of the player including controls to the parentEle
        if (!options.hideControls){
            attachVolume();
            attachPlay();
            attachLoop();
            attachProgressBar();
            attachFullScreen();
            attachProgressIndicator();
        };

        this.playerParent.append(ITEHolder);
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
            currentVolumeLevel = playerConfiguration.setInitVolume;
            var volumeContainer = $(document.createElement("div"))
                .addClass("volumeContainer");

            var volumeButtonContainer = $(document.createElement("div"))
                .addClass("volumeButtonContainer");

                volumeButton = $(document.createElement("img"))
                .addClass("volumeButton")
                .attr("src", "ITEPlayerImages/volume.png")
                .on("click", toggleMute);

            var volumeLevelContainer = $(document.createElement("div"))
                .addClass("volumeLevelContainer")
                .on({
                    "click": function(e){
                        setVolume(e);
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

                playPauseButton = $(document.createElement("img"))
                .addClass("playPauseButton")
                .attr("src", "ITEPlayerImages/pause.png")
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

                loopButton = $(document.createElement("img"))
                .addClass("loopButton")
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

            progressBar = $(document.createElement("div"))
                .addClass("progressBar")

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

                progressIndicator = $(document.createElement("div"))
                .addClass("progressIndicator")
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

                fullScreenButton = $(document.createElement("img"))
                .addClass("fullScreenButton")
                .attr("src", "ITEPlayerImages/fullScreen.png")
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
        console.log("Tour is playing")
        playPauseButton.attr("src", "ITEPlayerImages/pause.png")
    };


    /*
    * I/P:   none
    * Pauses tour
    * O/P:   none
    */
    function pause() {
        orchestrator.pause();
        console.log("Tour is paused")
        playPauseButton.attr("src", "ITEPlayerImages/play.png")
    };

    /*
    * I/P:   none
    * Seeks tour to a specfied spot
    * O/P:   none
    */
    function seek(e) {
        if (playerConfiguration.allowSeek){
            console.log("Tour was seeked")
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
    function setVolume(e) {
        volumeLevel.css({
            height : Math.abs(e.pageY - volumeLevel.parent().offset().top - volumeLevel.parent().height())
        });
        currentVolumeLevel = volumeLevel.height()*100/(volumeLevel.parent().height());
        //orchestrator.setVolume(newVolumeLevel);

        console.log("volume set to " + currentVolumeLevel +  "%")
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
        console.log("tour is muted")
        volumeButton.css("opacity" , ".5")
        volumeLevel.css("height" , "0")
    }

    /*
    * I/P:   none
    * Sets mute to be true and changes UI accordingly
    * O/P:   none
    */ 
    function unMute(){
        isMuted = false;
        console.log("tour is not muted")
        volumeButton.css("opacity" , "1")
        volumeLevel.css("height" , currentVolumeLevel*(volumeLevel.parent().height())/100 + "%")
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
        console.log("tour is fullscreen")
        fullScreenButton.css("opacity" , "1")
    };

   /**
    * I/P:    none
    * Removes fullscreen and changes UI accordingly
    * O/P:    none
    */ 
    function disableFullScreen() {
        isFullScreen = false;
        console.log("tour is not fullscreen")
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
        console.log("tour is looped")
        loopButton.css("opacity" , "1")
    };

   /**
    * I/P:    none
    * Sets tour to not be in loop and changes UI accordingly
    * O/P:    none
    */ 
    function unLoop() {
        isLooped = false;
        console.log("tour is not looped")
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
    this.currentVolumeLevel = currentVolumeLevel;
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

	this.currentAnimation		= null; // Current animation, if any (between two different states of the asset)
										// Saved as variable to make pausing and playing easier

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
	I/P: none
		Starts or resumes tour
		Called when tour is played
		Starts animation, if needed
	O/P: none
	*/
	this.play = function(){
	// Resets state to be where it was when track was paused
		this.savedState && this.setState(this.savedState);

	// // Set current status to “played”
	// 	this.setCurrentStatus(1);
	};

	/* 
	I/P: none
		Pauses animation
		sets savedState to match state when tour is paused
		sets status to paused
	O/P: none
	*/
	this.pause = function(){
		// Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		this.getState();


		// // Sets currentStatus to paused
		// this.setStatus(2);
	};

	/* 
	I/P: none
		Seeks animation from a given offset state
	O/P: none
	*/
	this.seek = function(seekTime){
		// Stops/cancels animation, if there is one
		currentAnimation && currentAnimation.stop();

		// Sets savedState to be state when tour is paused so that we can restart the tour from where we left off
		var seekState = animationProvider.interpolate(seekTime, previousKeyFrame(), nextKeyFrame()) //NOTE: this interpolates between the two keyframes to return the state at the given time. I’m not sure exactly what the syntax will be for this, but I know it’s possible in most of the animation libraries we’ve looked at.
			this.setState(state)
			this.play()
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
	this.setState = function(state){
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

TAG.Util.makeNamespace('TAG.TourAuthoring.MenuInputFormats');
TAG.Util.makeNamespace('TAG.TourAuthoring.EditorMenu');

TAG.TourAuthoring.MenuInputFormats = {
    minSec: 1,      // 00:00.00 (min:sec.centisecs)
    sec: 2,         // 00 (sec)
    percent: 3      // 0 - 100 (%)
};

TAG.TourAuthoring.MenuType = {
    display: 1,
    keyframe: 2,
    track: 3
};


/**
 * Menu for track, display and keyframe editing
 * @class TAG.Authoring.EditorMenu
 * @constructor
 * @param {Object} spec          value from MenuType enum specifying menu layout
 * @param {Object} my            track's shared my object
 * @return {Object} that         the main DOM object
 */
TAG.TourAuthoring.EditorMenu = function (spec, my) {
    "use strict";
    var that = {
            getMenuCloseable: getMenuCloseable,
            open: open,
            close: close,
            forceClose: forceClose,
            addInput: addInput,
            addTitle: addTitle,
            addButton: addButton,
        },                                                                                                                        // object containing all the public methods of the class
        menu = $(document.createElement('div')),                                                                                  // the main menu div
        arrow = $(document.createElement('img')),                                                                                 // the arrow icon on the menu
        menuType = spec.type,                                                                                                     // property of the spec object passed in, sets the type of the menu                                                                                         
        parent = spec.parent,                                                                                                     // the parent display to which the menu is attached
        trackBody = my.timeline.getTrackBody(),                                                                                   // the track on which the editor menu lies
        OPACITY = 0.95,                                                                                                           // opacity of the menu display on screen
        menuCloseable = true,                                                                                                     // boolean specyfying whether or not the menu can be closed
        power = Math.pow(10, TAG.TourAuthoring.Constants.menuDecimals);                                                          // returns the base exponent of the constant passed in

        /**
         * Contains one object for every input in the menu
         * Input objects have parameters:
         * @param {HTML Element} input             The actual HTML input element
         * @param {Value}        format            Format of input, value from MenuInputFormats enum
         * @param {Function}     accessCallback    Function for obtaining current value of linked variable
         * @param {Function}     updateCallback    Function for updating value of linked variable
         */
        var inputObjects = [];

    menu.addClass("displayMenu");


    /**Initializes the menu html
     * @method createHTML
     */
    (function createHTML() {
        var width,
            arrowSrc;

        menu.css({
            "position": "fixed",
            "color": "rgb(256, 256, 256)",
            //'width': width,
            'background-color': 'rgba(0,0,0,' + OPACITY + ')',
            'padding-top': '3px',
            'padding-left': '2px',
            'padding-right': '2px',
            'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex + 7,
            'border-radius': '15px',
            'width': '13%'
        });

        // set width according to menu type
        switch (menuType) {     
            case TAG.TourAuthoring.MenuType.display:
                width = '25%';
                break;
            case TAG.TourAuthoring.MenuType.keyframe:
                width = '18%';
                break;
            case TAG.TourAuthoring.MenuType.track:
                width = '20%';
                break;
        }

        // change css according to menu type
        switch (menuType) {     
            case TAG.TourAuthoring.MenuType.display:
                break;
            case TAG.TourAuthoring.MenuType.keyframe:
                break;
            case TAG.TourAuthoring.MenuType.track:
                menu.css({
                    'left': '18%',
                    'padding': '.5%',
                    'margin-top': '1%',
                    'float': 'left',
                    'clear': 'left',
                    'border-radius': '5%'
                });
                break;
        }

        my.track.append(menu);
        menu.hide();
        my.timeline.setisMenuOpen(false);

        // general event bindings for the menu
        menu.on('MSPointerDown', function (ev) {
            inputObjects.map(updateInput);
            ev.stopImmediatePropagation();
        });
        menu.on('mousedown', function (event) {
            inputObjects.map(updateInput);
            event.stopImmediatePropagation();
        });
        menu.on('click', function (event) {
            inputObjects.map(updateInput);
            event.stopImmediatePropagation();
        });

        // set arrow image according to menu type
        switch (menuType) {         
            case TAG.TourAuthoring.MenuType.display:
            case TAG.TourAuthoring.MenuType.keyframe:
                arrowSrc = tagPath+"images/icons/KeyframeInfo-Opaque.png";
                break;
            case TAG.TourAuthoring.MenuType.track:
                arrowSrc = tagPath + "images/icons/LeftPoint-Opaque.png";
                break;
        }

        arrow.attr("src", arrowSrc);
        arrow.css({
            position: 'fixed',
            height: '45px',
            width: '54px',
            'z-index': TAG.TourAuthoring.Constants.aboveRinZIndex + 5,
            'opacity': OPACITY
        });

        // set arrow image css according to menu type
        switch (menuType) {
            case TAG.TourAuthoring.MenuType.track:
                arrow.css({
                    left: '14%',
                    height: '6%',
                    width: '4%'
                });
                break;
            default:
                arrow.css({
                    'margin-top': '-1px'
                });
                break;
        }

        my.track.append(arrow);
        arrow.hide();
    })();

    /**returns the boolean specifying if the menu can be closed
     * @method getMenuCloseable
     * @return {Boolean} menuCloseable
     */
    function getMenuCloseable() {
        return menuCloseable;
    }

    /**Opens the editor menu
     * @method open
     * @param {Event} evt   evt from interaction event, used to reposition menu
     */
    function open(evt) {
        var close = my.timeline.getCloseMenu();                 // close existing menus
        if (close) { close(); }
        if (my.that.getEventsPaused()) { return; }           
         
        //deselect all tracks and open the menu
        my.timeline.allDeselected();
        my.timeline.setisMenuOpen(true);
        my.timeline.setCloseMenu(forceClose);
        my.that.updateTracksEventsPaused(true);

        // update menu position and contents
        if (evt) { updateMenuPos(evt); }
        resetInputs();

        // remove current selections
        my.currentDisplay = null;
        if (my.currentKeyframe) {
            my.currentKeyframe.setDeselected();
            my.currentKeyframe = null;
        }

        // reattach handlers if they were removed
        if (!menu.data('events') || !(menu.data('events').click)) {
            menu.on('click', function (event) {
                inputObjects.map(updateInput);
                event.stopImmediatePropagation();
            });
        }
        if (!menu.data('events') || !(menu.data('events').MSPointerDown)) {
            menu.on('MSPointerDown', function (ev) {
                inputObjects.map(updateInput);
                ev.stopImmediatePropagation();
            });
        }
        if (!menu.data('events') || !(menu.data('events').mousedown)) {
            menu.on('mousedown', function (event) {
                inputObjects.map(updateInput);
                event.stopImmediatePropagation();
            });
        }

        // logic to close menu
        my.root.on('mousedown.editorMenu', function (event) {
            var i,
                ancestryCheck = false;
            for (i = 0; i < inputObjects.length; i++) { // TODO
                if ($(event.target).parents().index(inputObjects[i].input) === -1) {
                    ancestryCheck = true;
                    break;
                }
            }
            that.close();           //only closes if clicked off menu
        });
    }
    
    /**Close menu
     * Doesn't fire if menuCloseable is set
     * Call only from my.root close handler
     * @method close
     * @param {Boolean} preventClose
     */
    function close(preventClose) {
        forceClose(preventClose);
    }
    
    /**Actually closes menu, no menuCloseable check
     * Call everywhere except my.root handler
     * @method forceClose
     * @param {Boolean} preventClose
     */
    function forceClose(preventClose) {
        var i;

        my.root.off('mousedown.editorMenu');
        my.timeline.setisMenuOpen(false);
        my.timeline.setCloseMenu(null);
        my.that.updateTracksEventsPaused(false);

        menu.hide();
        arrow.hide();

        // save current input states
        if (!preventClose) {
            for (i = 0; i < inputObjects.length; i++) {
                updateInput(inputObjects[i]);
            }
        }
    }
    

    //////////////////
    // CONSTRUCTION //
    //////////////////

    /**Adds an input element to the menu
     * @method addInput
     * @param {String}   name               Name of element (appears on menu)
     * @param            format             MenuInputFormat type
     * @param {Function} accessCallback     Function for obtaining current value of linked variable
     * @param {Function} updateCallback     Function for updating value of linked variable
     */
    function addInput(name, format, accessCallback, updateCallback) {
        var inputObj = {},
            inputContainer = $(document.createElement('div')),
            inputGroup = $(document.createElement('div')),
            input = $(document.createElement('input')),
            units = $(document.createElement('text'));

        // set up input
        input.attr('type', 'text');
        input.val(convertToString(accessCallback(), format)); // TODO: ??? do I need to parse to proper format?
        input.css({
            width: '23%',
            position: 'absolute',
            right: '27%'
        });
        input.on('click', function (ev) {
            input.select();
            ev.stopImmediatePropagation();
        });
        input.on('MSPointerDown', function (ev) {
            ev.stopImmediatePropagation();
        });
        input.keypress(function (evt) { // update on enter push
            if (evt.keyCode === 13) {
                updateInput(inputObj);
                resetInputs();
            }
        });

        // set up units
        units.css({
            'position': 'absolute',
            'float': 'right',
            'font-size': '80%',
            'right': '10px'
        });

        // change text when for different formats of an input
        switch (format) {
            case TAG.TourAuthoring.MenuInputFormats.minSec:
                units.text('min:sec');
                break;
            case TAG.TourAuthoring.MenuInputFormats.sec:
                units.text('secs');
                break;
            case TAG.TourAuthoring.MenuInputFormats.percent:
                units.text('percent');
        }

        // assemble container and attach to menu
        inputContainer.css({
            width: "95%",
            'margin-left': 'auto',
            'margin-right': 'auto',
            'font-size': TAG.Util.getFontSize(57),
            'padding-top': '3%',
        });
        inputContainer.append(name);
        inputContainer.append(input);
        inputContainer.append(units);
        menu.append(inputContainer);

        // assemble object
        inputObj.input = input;
        inputObj.accessCallback = accessCallback;
        inputObj.updateCallback = updateCallback;
        inputObj.format = format;
        inputObjects.push(inputObj);
    }
    
    /**Adds text w/ no related input or button
     * @method addTitle
     * @param {String} title     Text to appear
     */
    function addTitle(title) {
        var titlediv = $(document.createElement('label'));
        titlediv.text(title);
        titlediv.css({
            "left": "auto",
            "top": "auto",
            "position": "relative",
            "font-size": TAG.Util.getFontSize(71.5),
            "color": "rgb(256, 256, 256)",
            "display": "block",
            'padding': '4%',
            'text-align': 'center'
        });
        menu.append(titlediv);
    }
    
    /**Adds button to screen (click to fire)
     * @method addButton
     * @param {String}       title     Text to appear in button
     * @param {CSS property} floatPos  Side of screen to float to
     * @param {Function}     callback  Function to fire when clicked
     */
    function addButton(title, floatPos, callback) {
        var buttondiv = $(document.createElement('label'));
        buttondiv.text(title);//sets button text
        buttondiv.css({
            "left": "0%",
            "position": "relative",
            "top": "5%",
            "font-size": TAG.Util.getFontSize(57),
            "color": "rgb(256, 256, 256)",
            "display": "block",
            'padding': '10px 0',
            'text-align': 'center',
            'margin-left': '3%',
            'margin-right': '3%',
            float: floatPos
        });

        // additional css edits:
        switch (menuType) {
            case TAG.TourAuthoring.MenuType.track:
                buttondiv.css({
                    'width': '93%',
                    'height': '16%',
                    'border-style': 'solid',
                    'border-width': '2px',
                    'margin-left': '3%',
                    'margin-right': '3%',
                    'margin-bottom': '3%',
                    //'padding-bottom': '2%',
                    top: ''
                });
                break;
        }

        menu.append(buttondiv);
        if (IS_WINDOWS) {
            TAG.Util.makeManipulatableWin(buttondiv[0], {
                onTapped: callback
            });
        } else {
            TAG.Util.makeManipulatable(buttondiv[0], {
                onTapped: callback
            });
        }
        
        return buttondiv;
    }
    
    /**Updates linked variable with new value in input
     * @method updateInput
     * @param {HTML Element} inputObj      Input to update
     */
    function updateInput(inputObj) {
        var command,
            oldValue = inputObj.accessCallback(),
            newValue = inputObj.input.val(),
            num_clamped;

        /**Log clamping undo/redo
         * @method logHelper
         * @param {} disp
         * @param {} cinit
         * @param {} cnew
         */
        function logHelper(disp, cinit, cnew) {
            var clamp_command = {
                execute: function () { disp.setTimes(cnew); },
                unexecute: function () {
                    console.log("init: " + cinit.inStart + ", new: " + cnew.inStart);
                    disp.setTimes(cinit);
                },
            };
            my.undoManager.logCommand(clamp_command);
            disp.has_been_clamped = false;
        }

        // if input is valid, push to callback
        if (isValidInput(newValue)) {
            // convert text to proper return format
            newValue = convertToUpdateFormat(newValue, inputObj.format);
            if (Math.abs(oldValue - newValue) > TAG.TourAuthoring.Constants.epsilon) {
                my.timeline.getClampedDisplays().length = 0;
                command = {
                    execute: function () {
                        inputObj.updateCallback(newValue);
                        inputObj.input.val(convertToString(inputObj.accessCallback(), inputObj.format));
                        my.update();
                    },
                    unexecute: function () {
                        inputObj.updateCallback(oldValue);
                        inputObj.input.val(convertToString(inputObj.accessCallback(), inputObj.format));
                        my.update();
                    }
                };
                command.execute();
                my.undoManager.logCommand(command);

                num_clamped = my.timeline.getClampedDisplays().length;
                for (var i = 0; i < num_clamped; i++) {
                    var disp = my.timeline.getClampedDisplays()[i];
                    logHelper(disp, disp.clamped_init, disp.clamped_new);
                }
                my.undoManager.combineLast(num_clamped + 1);
            }
        }
        // update val with new internal value
        inputObj.input.val(convertToString(inputObj.accessCallback(), inputObj.format));
    }

    /**Resets inputs to match current state of associated variables
     * @method resetInputs
     */
    function resetInputs() {
        var i,
            inputObj;

        for (i = 0; i < inputObjects.length; i++) {
            inputObj = inputObjects[i];
            inputObj.input.val(convertToString(inputObj.accessCallback(), inputObj.format));
        }
    }

    /**Updates position of menu and brings it on-screen
     * @method updateMenuPos
     * @param {Event} evt   Interaction event object
     */
    function updateMenuPos(evt) {
        var menuLeft,
            menuTop,
            arrowLeft,
            arrowTop,
            trackLim;

        menu.show();
        arrow.show();

        switch (menuType) {
            case TAG.TourAuthoring.MenuType.display:
            case TAG.TourAuthoring.MenuType.keyframe:
                menuLeft = my.track.offset().left + evt.position.x - (menu.width() / 2);
                arrowLeft = menuLeft + (menu.width() / 2) - (arrow.width() / 2);
                arrowTop = my.track.offset().top;
                menuTop = arrowTop - menu.height()-3; // 10 is top margin of menu
                menuLeft = Math.min(menuLeft, $(document).width() - menu.width());
                break;
            case TAG.TourAuthoring.MenuType.track:
                menuTop = my.track.offset().top + my.track.height() / 2 - menu.height() / 2;
                arrowTop = menuTop + menu.height() / 2 - arrow.height() / 2;
                menuTop = Math.min(menuTop, (trackBody.offset().top + trackBody.height()) / 2 + $(document).height() / 2 - menu.height());

                // keep left the same
                menuLeft = menu.offset().left;
                arrowLeft = arrow.offset().left;
                break;
        }

        menu.css({
            left: menuLeft + "px",
            top: menuTop + 'px'
        });
        arrow.css({
            left: arrowLeft + 'px',
            top: arrowTop + 'px'
        });
    }

    ///////////
    // UTILS //
    ///////////

    /**Performs input validation
     * @method isValidInput
     * @param {String} inputstr     string to check
     * @return {Boolean} boolean    whether input is valid or not
     */
    function isValidInput(inputstr) {                       //works for both mm:ss and seconds input
        var i,
            letter,
            coloncounter = 0;

        if (!inputstr) {
            return false;
        }

        for (i = 0; i < inputstr.length; i) {               //for each character in string
            letter = inputstr.charAt(i);
            if (letter === ':') {
                coloncounter++;
            }
            if (coloncounter > 1 || (isNaN(parseFloat(letter)) && letter != "." && letter != ':')) {//if too many colons, or any 
                return false;                               //if too many colons or any character invalid
            }
            i = i + 1;
        }
        return true;                                        //no problems!!
    }

    /**Converts string to number according to input format type
     * @method convertToUpdateFormat
     * @param {String} valuestr         new value in string form
     * @param {Value}  format           MenuInputFormat value specifying input format
     * @return {Value} updated String   input value in update required format
     */
    function convertToUpdateFormat(valuestr, format) {
        var min,
            sec;

        switch (format) {
            case TAG.TourAuthoring.MenuInputFormats.minSec:
                // 'min:sec': --> secs
                valuestr = valuestr.split(':');
                if (valuestr.length === 1) { // no min at all
                    return parseFloat(valuestr[0]);
                } else {
                    if (valuestr[0]) min = parseFloat(valuestr[0]);
                    else min = 0; // catch case where input is ':sec'
                    sec = parseFloat(valuestr[1]);
                    return sec + 60 * min;
                } break;

            case TAG.TourAuthoring.MenuInputFormats.sec:
                // 'secs' --> secs
            case TAG.TourAuthoring.MenuInputFormats.percent:
                // 'percent' --> percent
                return parseFloat(valuestr);
        }
    }

    /**Converts value (typically from accessCallback) to string
     * to place in input HTML element
     * @method convertToString
     * @param {Number}  value     Value as number
     * @param {Format]  format    MenuInputFormat type specifying format to parse number to
     * @return {String} string    value converted to string
     */
    function convertToString(value, format) {
        var min,
            sec;
        switch (format) {
            case TAG.TourAuthoring.MenuInputFormats.minSec:
                // 'min:sec': --> secs
                min = Math.floor(value / 60);
                if (min < 10) {
                    min = '0' + min;
                }
                sec = value % 60;
                sec = roundDecimals(sec);
                if (sec < 10) {
                    sec = '0' + sec;
                }
                return min + ':' + sec;

            case TAG.TourAuthoring.MenuInputFormats.sec:
                // 'secs' --> secs
            case TAG.TourAuthoring.MenuInputFormats.percent:
                // 'percent' --> percent
                return roundDecimals(value) + '';
        }
    }

    /**Round number to have only
     * @method roundDecimals
     * TAG.TourAuthoring.Constants.menuDecimals decimal places
     * @param {Number} num       number to round
     * @return {Number} number   rounded number
     */
    
    function roundDecimals(num) {
        return Math.round(num * power) / power;
    }

    return that;
};
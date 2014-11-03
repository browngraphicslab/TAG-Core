
TAG.Telemetry = (function () {

    var metaDataRequests = [],
        sessionDataRequests = [],
		sendFreq = 1,  // telemetry data is sent once every sendFreq-th log
	    bversion = browserVersion(),
	    platform = navigator.platform,
        pushMetaDataCount = 0;


    /**
	 * Get the current browser version
	 * Borrowed from http://stackoverflow.com/questions/5916900/detect-version-of-browser
	 * @method browserVersion
	 */
    function browserVersion() {
        var ua = navigator.userAgent, tem,
	    M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) || [];
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+(\.\d+)?)/g.exec(ua) || [];
            return 'IE ' + (tem[1] || '');
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/([\.\d]+)/i)) != null) M[2] = tem[1];
        return M.join(' ');
    }


    /**
    * Push the main_tobj onto the requests once at the beginning of the session.
    */
    function pushMetaData() { //called in core.js on startup if telemetry is switched on.
        if (pushMetaDataCount < 1) {
            if (TELEMETRY_SWITCH === 'on') {
                pushMetaDataCount++;
                console.log("pushmetadata called in telemetry.js");
                var date = new Date();
                var property = {
                    token: "metadata",
                };

                var main_tobj = {
                    tagserver: localStorage.ip || '',
                    browser: bversion,
                    platform: platform,
                    time_stamp: date.getTime(),
                    time_human: date.toString(),
                    machine_id: localStorage.machId,
                    session_id: TELEMETRY_SESSION_ID,
                };

                metaDataRequests.push(property);
                metaDataRequests.push(main_tobj);
                postMetaDataRequests();
                console.log("metadataobj is " + " " + main_tobj);
            }
        }
    }


    /**
	 * Register an element with the telemetry module
	 * @method registerTelemetry
	 * @param {jQuery Obj} element      the element or the jQuery selector to which we'll attach a telemetry event handler
	 * @param {String} etype            the type of event (e.g., 'mousedown') for which we'll create the handler
	 * @param {String} ttype            the type of telemetry request to log
	 * @param {Function} preHandler     do any pre-handling based on current state of TAG, add any additional
	 *                                     properties to the eventual telemetry object. Accepts the telemetry
	 *                                     object to augment and the event, and returns true if we should abort
	 *                                     further handling.
	 */
    function register(element, etype, ttype, preHandler) {
        console.log("register called in telemetry.js");
        
        $(element).on(etype + '.tag_telemetry', function (evt) {

            //TODO: Check for ttype and set the required properties for each ttype to null using switch-case statements. These properties will be set in the prehandler when a particular element is registered depending on its ttype. All other generic properties are set here. 
            // A compact way to define all 'ttype' classes in one method and also include other functionality like stop telemetry_timer etc. Get rid of the custom fields here. Concatenate all the new properties
            //set by the prehandler into xml files (using another method created in this file itself). Probably create a new function in a new file with the switch statements.
            var property = {
                token: "sessiondata",
            };
            if (window.PointerEvent && evt.pointerType) {
                
            }

            var tobj = {
                ttype: ttype,
                session_id: TELEMETRY_SESSION_ID,
                machine_id: localStorage.machId
                //input_device: (window.PointerEvent && evt.pointerType) ? evt.pointerType : null
            };
            tobj.is_splitscreen = TAG.Util.Splitscreen.isOn();
            TAG.TelemetryEvents.initEventProperties(tobj);
            console.log("sessiondataobj is " + " " + tobj);

            // if preHandler returns true, return
            if ((preHandler && preHandler(tobj, evt)) || TELEMETRY_SWITCH === 'off') {
                return;
            }
            
            sessionDataRequests.push(property);
            sessionDataRequests.push(tobj);



            if (sessionDataRequests.length >= sendFreq - 1) { // tweak this later

                postSessionDataRequests();
            }
        });
    }

    //Manually record events from the existing event handlers instead of registering an additional handler
    function recordEvent(ttype, preHandler) {
        console.log("record called in telemetry.js");
        var tobj = {
            ttype: ttype,
            session_id: TELEMETRY_SESSION_ID,
            machine_id: localStorage.machId,
            input_device: null
        };
        tobj.is_splitscreen = TAG.Util.Splitscreen.isOn();
        TAG.TelemetryEvents.initEventProperties(tobj);
        // if preHandler returns true, return
        if ((preHandler && preHandler(tobj)) || TELEMETRY_SWITCH === 'off') {
            return;
        }
        sessionDataRequests.push(tobj);
        if (sessionDataRequests.length >= sendFreq - 1) { // tweak this later			    
            postSessionDataRequests();
        }
       
    }

    /**
	 * Make a request to the telemetry server using the requests variable
	 * @method postTelemetryRequests
	 */
    function postMetaDataRequests() {
        console.log("post metadata requests called");
        var data = JSON.stringify(metaDataRequests);

        metaDataRequests.length = 0;

        $.ajax({
            type: 'POST',
            url: 'http://browntagserver.com:12043/',
            data: data, // this should be encrypted.toString() for encrypting the data
            async: true, // this is the default, but just make it explicit
            success: function () {
                console.log('POST request to server worked');
            },
            error: function (e) {
                console.log('telemetry error! look at node output...');
            }
        });
    }

    function postSessionDataRequests() {
        console.log("post session data requests called");
        var data = JSON.stringify(sessionDataRequests);

        sessionDataRequests.length = 0;

        $.ajax({
            type: 'POST',
            url: 'http://browntagserver.com:12043/',
            data: data, // this should be encrypted.toString() for encrypting the data
            async: true, // this is the default, but just make it explicit
            success: function () {
                console.log('POST request to server worked');
            },
            error: function (e) {
                console.log('telemetry error! look at node output...');
            }
        });
    }

    return {
        register: register,
        recordEvent: recordEvent,
        pushMetaData: pushMetaData
    }
})();
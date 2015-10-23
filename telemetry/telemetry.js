
TAG.Telemetry = (function () {

    var sessionDataRequests = [],
		sendFreq = 50,  // telemetry data is sent once every sendFreq-th log
        folder;
    Windows.Storage.KnownFolders.picturesLibrary.createFolderAsync
        ("TAG Telemetry", Windows.Storage.CreationCollisionOption.openIfExists)
        .done(function success(newFolder) {
            folder = newFolder;
        });


    /**
	 * Record an event with the telemetry module
	 * @method recordEvent
	 * @param {String} ttype            the type of telemetry request to log
	 * @param {Function} preHandler     do any pre-handling based on current state of TAG, add any additional
	 *                                     properties to the eventual telemetry object. Accepts the telemetry
	 *                                     object to augment and the event, and returns true if we should abort
	 *                                     further handling.
	 */
    
    function recordEvent(ttype, preHandler) {
        // doNothing("record called in telemetry.js");
        var today_date = new Date();
        var tobj = {
            ttype: ttype,
            //session_id: TELEMETRY_SESSION_ID,
            //machine_id: localStorage.machId,
            date_time: today_date.toTimeString()
        };        
        TAG.TelemetryEvents.initEventProperties(tobj);
        // if preHandler returns true, return
        if ((preHandler && preHandler(tobj)) || TELEMETRY_SWITCH === 'off') {
            return;
        }
        sessionDataRequests.push(tobj);
        if (sessionDataRequests.length >= sendFreq) {
            folder.createFolderAsync(today_date.getMonth() + 1 + "-" + today_date.getDate() + "-" + today_date.getFullYear(), Windows.Storage.CreationCollisionOption.openIfExists)
                .then(function (folder) {
                    folder.createFileAsync(parseInt(today_date.getTime() / 1000) + ".txt",
                    Windows.Storage.CreationCollisionOption.replaceExisting)
                    .then(function (file) {
                        Windows.Storage.FileIO.writeTextAsync(file, JSON.stringify(sessionDataRequests));
                });
            });
            sessionDataRequests = [];
        }
       
    }

    return {
        recordEvent: recordEvent,
    }
})();
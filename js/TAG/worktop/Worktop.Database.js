var TAG = TAG || LADS || {},
    LADS = LADS || TAG || {};

TAG.Util.makeNamespace("Worktop.Database");

/*
    Worktop.Database contains the cache object for all requests and contains mostly private non-static
    methods used by TAG.Worktop.Database.  Functions in here are generally functions that require the cache,
    although some requests here don't currently modify or use the cache, but they could be modified in the future
    to be smarted about caching (such as updating the cache and incrementing the count when a doq is posted).
*/
Worktop.Database = function (mainID) {
    var HTTP_PORT = LADS.Worktop.Database.HTTP_PORT;
    var HTTPS_PORT = LADS.Worktop.Database.HTTPS_PORT;
    var FILE_PORT = LADS.Worktop.Database.FILE_PORT;

    if (localStorage.ip === "137.117.37.220") localStorage.ip = "browntagserver.com"; // Switch to new domain for HTTPS
    var _baseURL = localStorage.ip ? localStorage.ip : "browntagserver.com";  // url of the server
    localStorage.ip = _baseURL; // keep localStorage.ip current

    var useServer = true;

    var CACHE_PREFIX = 'tag_cache.'

    var _cache;
    // Uncomment to reset cache on startup
    //delete localStorage[CACHE_PREFIX + _baseURL];
    if (localStorage[CACHE_PREFIX + _baseURL]) {
        _cache = JSON.parse(localStorage[CACHE_PREFIX + _baseURL]);
    } else {
        var _cache = {
            main: null,
            tours: null,
            exhibs: null,
            artworks: null,
            feedback: null,
            media: null,
            doqs: {},
            doqMedia: {},
            doqMaps: {},
            linqs: {}
        };
    }

    if (mainID && _cache.main && _cache.main.Identifier) {
        if (mainID !== _cache.main.Identifier) _cache = {};
    }


    var _static = LADS.Worktop.Database;
    var _util = LADS.Util;

    // writeCache function debounces calls to write the cache to disk
    var writeCache = $.debounce(250, function () {
        //COMMENTED OUT FOR AUG15 RELEASE MUST FIGURE OUT WHY CACHE IS FILLING UP SO FAST?!?
       // localStorage[CACHE_PREFIX + _baseURL] = JSON.stringify(_cache);
    });

    return {
        getURL: getURL,
        getFileURL: getFileURL,
        getSecureURL: getSecureURL,
        setURL: setURL,
        setBaseURL: setBaseURL,

        getExhibitions: getExhibitions,
        getArtworks: getArtworks,
        getTours: getTours,
        getAssocMedia: getAssocMedia,
        getDoq: getDoq,
        getFeedback: getFeedback,
        getMain: getMain,
        getAssocMediaTo: getAssocMediaTo,
        getArtworksAssocTo: getArtworksAssocTo,
        getLinq: getLinq,
        getArtworksIn: getArtworksIn,
        getAssocMediaIn: getAssocMediaIn,
        getMaps: getMaps,

        putTour: putTour,
        putExhibition: putExhibition,
        putFeedback: putFeedback,
        putArtwork: putArtwork,
        putMap: putMap,
        putHotspot: putHotspot,

        postTour: postTour,
        postExhibition: postExhibition,
        postArtwork: postArtwork,
        postHotspot: postHotspot,
        postIframeAssocMedia: postIframeAssocMedia,
        postTextAssocMedia: postTextAssocMedia,
        postMap: postMap,
        postMain: postMain,
        addSortOptions: addSortOptions,

        deleteDoq: deleteDoq,
        batchDeleteDoq: batchDeleteDoq,
        deleteLinq: deleteLinq,
    };

    ///////////////
    // NEW STUFF //
    ///////////////

    function getExhibitions(handlers) {
        getRequest(
            "Exhibitions",
            safeCache('exhibs', 'doqs'),
            safeCache('exhibs', 'count'),
            handlers);
    }

    function getArtworks(handlers) {
        getRequest(
            "Artworks",
            safeCache('artworks', 'doqs'),
            safeCache('artworks', 'count'),
            handlers);
    }

    function getTours(handlers) {
        getRequest(
            "Tours",
            safeCache('tours', 'doqs'),
            safeCache('tours', 'count'),
            handlers);
    }

    // TODO: PLEASE NO - bmost //TODO: PLEASE YES - jjfu :P
    function addSortOptions(guid, handlers, throwOnWarn) {
        getRequest(
            "AddSortOptions",
            safeCache('doqs', guid),
            safeCache(false, false, 'doqs', guid, 'Metadata', 'Count'),
            handlers,
            { "Guid": guid });
    }

    function getAssocMedia(handlers) {
        getRequest(
            "AllAssociatedMedia",
            safeCache('media', 'doqs'),
            safeCache('media', 'count'),
            handlers);
    }

    function getFeedback(handlers) {
        getRequest(
            "Feedback",
            safeCache('feedback', 'doqs'),
            safeCache('feedback', 'count'),
            handlers);
    }

    function getDoq(guid, handlers) {
        getRequest(
            "Doq",
            safeCache('doqs', guid),
            safeCache('doqs', guid, 'Metadata', 'Count'),
            handlers,
            { "Guid": guid });
    }

    function getMain(handlers) {
        getRequest(
            "Main",
            safeCache('main'),
            safeCache(true, false, 'main', 'Metadata', 'MainCount'),
            handlers);
    }

    function getAssocMediaTo(guid, handlers) {
        getRequest(
            "AssociatedMedia",
            safeCache('doqMedia', guid, 'doqs'),
            safeCache('doqMedia', guid, 'LinqCount'),
            handlers,
            { "Guid": guid });
    }

    function getArtworksAssocTo(guid, handlers) {
        getRequest(
            "ArtworksAssociated",
            safeCache('doqMedia', guid, 'doqs'),
            safeCache('doqMedia', guid, 'LinqCount'),
            handlers,
            { "Guid": guid });
    }

    function getLinq(guid1, guid2, handlers) {
        getRequest(
            "Linq",
            safeCache('linqs', guid1, guid2, 'linq'),
            safeCache(false, false, 'linqs', guid1, guid2, 'Count'),
            handlers,
            { "Guid1": guid1, "Guid2": guid2 });
    }

    function getMaps(guid, handlers) {//given an artwork guid and get all the maps for the artwork
        getRequest(
            "Maps",
            safeCache('doqMaps', guid, 'doqs'),
            safeCache('doqMaps', guid, 'MapCount'),
            handlers,
            { "Guid": guid });

    }

    function getArtworksIn(guid, handlers) {
        getRequest(
            "ArtworksIn",
            safeCache('artIn', guid, 'art'),
            safeCache('artIn', guid, 'Count'),
            handlers,
            { "Guid": guid });
    }

    function getAssocMediaIn(guid, handlers) {
        getRequest(
            "AssocMediaIn",
            safeCache('assocMediaIn', guid, 'assocMedia'),
            safeCache('assocMediaIn', guid, 'Count'),
            handlers,
            { "Guid": guid });
    }

    function postTour(guid, options, handlers, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.tour, "ChangeTour", throwOnWarn);
        sortedOptions.urlOptions.Guid = guid;
        postRequest(
            'ChangeTour',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            true);
    }

    function postExhibition(guid, options, handlers, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.exhibition, "ChangeExhibition", throwOnWarn);
        sortedOptions.urlOptions.Guid = guid;
        postRequest(
            'ChangeExhibition',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            true);
    }

    function postArtwork(guid, options, handlers, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.artwork, "ChangeArtwork", throwOnWarn);
        sortedOptions.urlOptions.Guid = guid;
        postRequest(
            'ChangeArtwork',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            true);
    }

    function postMap(guid, options, handlers, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.map, "ChangeMap", throwOnWarn);
        sortedOptions.urlOptions.Guid = guid;
        postRequest(
            'ChangeMap',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            true);
    }

    function postHotspot(guid, options, handlers, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.hotspot, "ChangeHotspot", throwOnWarn);
        sortedOptions.urlOptions.Guid = guid;
        postRequest(
            'ChangeAssociatedMedia',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            true);
    }

    function postIframeAssocMedia(options, handlers, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.hotspot, "CreateIframeAssocMedia", throwOnWarn);
        postRequest(
            'CreateIframeAssocMedia',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            true);
    }

    function postTextAssocMedia(options, handlers, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.hotspot, "CreateTextAssocMedia", throwOnWarn);
        postRequest(
            'CreateTextAssocMedia',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            true);
    }

    function postMain(options, handlers, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.main, "ChangeMain", throwOnWarn);
        postRequest(
            'Main',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            true,
            safeCache('main', 'Metadata', 'MainCount').get());
    }


    function putTour(options, handlers, returnDoq, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.tour, "CreateTour", throwOnWarn);
        putRequest(
            'CreateTour',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            returnDoq,
            true);
    }

    function putExhibition(options, handlers, returnDoq, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.exhibition, "CreateExhibition", throwOnWarn);
        putRequest(
            'CreateExhibition',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            returnDoq,
            true);
    }

    function putFeedback(options, handlers, returnDoq, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.feedback, "CreateFeedback", throwOnWarn);
        putRequest(
            'CreateFeedback',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            returnDoq);
    }

    function putArtwork(options, handlers, returnDoq, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.artwork, "CreateArtwork", throwOnWarn);
        putRequest(
            'CreateArtwork',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            returnDoq,
            true);
    }

    function putMap(options, handlers, returnDoq, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.artwork, "CreateArtwork", throwOnWarn);
        putRequest(
            'CreateMap',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            returnDoq,
            true);
    }

    function putHotspot(options, handlers, returnDoq, throwOnWarn) {
        options = options || {};
        var sortedOptions = checkKeys(options, _static.params.hotspot, "CreateHotspot", throwOnWarn);
        putRequest(
            'CreateHotspot',
            handlers,
            sortedOptions.urlOptions,
            sortedOptions.bodyOptions,
            returnDoq,
            true);
    }


    function deleteDoq(guid, handlers) {
        deleteRequest(
            'Doq',
            handlers,
            { Guid: guid },
            true);
    }

    function batchDeleteDoq(guids, guid, handlers) {
        batchDeleteRequest(
            'Doq',
            handlers,
            {isBatch: "true"},
            {GuidList: guids},
            true);
    }

    function deleteLinq(guid, handlers) {
        deleteRequest(
            'Linq',
            handlers,
            { Guid: guid },
            true);
    }

    /////////////////////
    // PRIVATE METHODS //
    /////////////////////

    /*
      handlers:
        success
        error
        errorCache

      cacheLoc is a cache location returned from safeCache containing the doq/qos
      clientCount is a cache location returned from safeCache containg the doq's count
      cacheFn is generally not required, but allows you to set a custom caching function
      secure makes the request use https
    */
    function getRequest(type, cacheLoc, clientCount, handlers, urlOptions, cacheFn, secure) {
        handlers = handlers || {};
        urlOptions = urlOptions || {};
        var cacheFn = cacheFn || cacheFunc(cacheLoc, clientCount);
        var count = -1;
        if (typeof clientCount.get === "function") {
            count = clientCount.get();
            if (!count && count !== 0) {
                count = -1;
            }
        }
        urlOptions.Count = count;
        var ajaxHandlers = {
            200: _static.convertToDocHandler(_util.multiFnHandler(handlers.success, cacheFn, doqCache), handlers.error),
            304: _util.safeCallHandler(handlers.success, cacheLoc.get()),
            401: handleAuth(handlers.unauth),
            error: _util.multiFnHandler(handlers.error, errorCacheHandler(handlers.errorCache, cacheLoc.get()))
        };
        _static.asyncRequest('GET', type, urlOptions, null, ajaxHandlers, secure);
    }

    function errorCacheHandler(fn, cacheVal) {
        if (cacheVal) {
            return _util.safeCallHandler(fn, cacheVal);
        } else {
            return function () { };
        }
    }

    /*
      handlers:
        success
        error
        unauth

       returnDoq makes the request returnt he doq's xml
    */
    function putRequest(type, handlers, urlOptions, bodyOptions, returnDoq, secure) {
        handlers = handlers || {};
        urlOptions = urlOptions || {};
        urlOptions.Token = LADS.Auth.getToken();
        urlOptions.ReturnDoq = returnDoq;
        var ajaxHandlers = {
            200: (returnDoq && _static.convertToDocHandler(handlers.success, handlers.error)) || handlers.success,
            401: handleAuth(handlers.unauth),
            error: handlers.error,
        }
        _static.asyncRequest('PUT', type, urlOptions, bodyOptions, ajaxHandlers, secure);
    }

    /*
      handlers:
        success
        error
        unauth
        conflict
    */
    function deleteRequest(type, handlers, urlOptions, secure) {
        handlers = handlers || {};
        urlOptions = urlOptions || {};
        urlOptions.Token = LADS.Auth.getToken();

        if (safeCache('doqs', urlOptions.Guid).get()) {
            urlOptions.Count = safeCache('doqs', urlOptions.Guid).get().Metadata.Count || 0;
        } else {
            urlOptions.Count = 1;
        }

        var ajaxHandlers = {
            200: handlers.success,
            401: handleAuth(handlers.unauth),
            409: handlers.conflict,
            error: handlers.error,
        }
        _static.asyncRequest('DELETE', type, urlOptions, null, ajaxHandlers, secure);
    }


    function batchDeleteRequest(type, handlers, urlOptions, bodyOptions, secure, cacheCount) {
        handlers = handlers || {};
        urlOptions = urlOptions || {};
        urlOptions.Token = LADS.Auth.getToken();
        var cacheLoc = safeCache('doqs', urlOptions.Guid).get();
        if (cacheCount !== 0) {
            cacheCount = cacheCount || (cacheLoc && cacheLoc.Metadata && safeCache('doqs', urlOptions.Guid).get().Metadata.Count) || 0;
        }
        urlOptions.Count = cacheCount;

        var ajaxHandlers = {
            200: handlers.success,
            401: handleAuth(handlers.unauth),
            409: handlers.conflict,
            error: handlers.error,
        }
        _static.asyncRequest('DELETE', type, urlOptions, bodyOptions, ajaxHandlers, secure);
    }

    /*
      handlers:
        success
        error
        unauth
        conflict
      cacheCount is a custom cache counter (used if the count isn't stored in the doq)
    */
    function postRequest(type, handlers, urlOptions, bodyOptions, secure, cacheCount) {
        handlers = handlers || {};
        urlOptions = urlOptions || {};
        urlOptions.Token = LADS.Auth.getToken();
        var cacheLoc = safeCache('doqs', urlOptions.Guid).get();
        if (cacheCount !== 0) {
            cacheCount = cacheCount || (cacheLoc && cacheLoc.Metadata && safeCache('doqs', urlOptions.Guid).get().Metadata.Count) || 0;
        }
        urlOptions.Count = cacheCount;

        var ajaxHandlers = {
            200: handlers.success,
            401: handleAuth(handlers.unauth),
            409: handlers.conflict,
            error: handlers.error,
        }
        _static.asyncRequest('POST', type, urlOptions, bodyOptions, ajaxHandlers, secure);
    }

    /*
        Checks if the keys provided in options are valid in the dictionary provided as params
        throwOnWarn causes an exception if a key isn't found in params
    */
    function checkKeys(options, params, name, throwOnWarn) {
        var urlOptions = {};
        var bodyOptions = {};
        $.each(options, function (key, val) {
            if (!_util.contains(params.url, key) && !_util.contains(params.body, key)) {
                if (throwOnWarn) {
                    throw "'" + key + "' is not a valid request parameter for " + name;
                } else {
                    console.log("Warning: '" + key + "' is not a valid request parameter for " + name);
                }
            }
            if (_util.contains(params.body, key)) {
                bodyOptions[key] = val;
            } else {
                urlOptions[key] = val;
            }
        });
        return {
            bodyOptions: bodyOptions,
            urlOptions: urlOptions,
        };
    }

    /*
        Authentication handler
    */
    function handleAuth(fail) {
        return function (jqXHR, ajaxCall) {
            LADS.Auth.authenticate(function () { ajaxCall.setToken(LADS.Auth.getToken()).call() }, fail)
        }
    }

    /*
        Caches a doq or array of doqs
    */
    function doqCache(doq) {
        if (doq && doq[0]) {
            $.each(doq, function (i, d) {
                safeCache('doqs', d.Identifier).set(d);
            });
        } else if (doq) {
            safeCache('doqs', doq.Identifier).set(doq);
        }
    }

    /*
        Returns an object with the functions set() and get()
        which set and return the cache value at the specified location respectively
        
        Specify the cache location as a varargs argument (ex. safeCache('main', 'Metadata'))
        If the first argument is a boolean then it sets getEnabled which controls whether
        or not the get() function is enabled
        If the second argument is a boolean then it sets setEnabled which controls whether
        or not the set() function is enabled.  This also assumes the ifrst argument is a boolean.
    */
    function safeCache(getEnabled, setEnabled) {
        var stopGet, stopSet;
        var skipArgs = 0;
        if (typeof setEnabled === "boolean") {
            stopSet = !setEnabled;
            stopGet = !getEnabled;
            skipArgs = 2;
        } else if (typeof getEnabled === "boolean") {
            stopGet = !getEnabled;
            skipArgs = 1;
        }
        var args = [];
        for (var j = skipArgs; j < arguments.length; j++) {
            args[j - skipArgs] = arguments[j];
        }
        return {
            set: function (val) {
                if (stopSet) return;
                var current = _cache;
                for (var i = 0; i < args.length - 1; i++) {
                    if (!current[args[i]]) {
                        current[args[i]] = {};
                    }
                    current = current[args[i]];
                }
                current[args[i]] = val;
                writeCache();
            },
            get: function () {
                if (stopGet) return;
                var current = _cache;
                for (var i = 0; i < args.length - 1; i++) {
                    if (!current[args[i]]) {
                        current[args[i]] = {};
                    }
                    current = current[args[i]];
                }
                return current[args[i]];
            }
        }
        return current[arguments[i]];
    }

    /*
        Default caching function for get requests, assumes the new count is in the status text of the response
    */
    function cacheFunc(cacheLoc, cacheCount) {
        return function (data, jqXHR) {
            cacheLoc.set(data);
            cacheCount.set(parseInt(jqXHR.statusText));
        }
    }

    ///////////////////
    // END NEW STUFF //
    ///////////////////

    function setBaseURL(url) {
        _baseURL = url;
    }

    // set server URL
    function setURL(url) {
        _baseURL = url;
    }

    // get server URL
    function getURL() {
        return "http://" + _baseURL + ':' + HTTP_PORT;
    }

    function getSecureURL() {
        var useHttps = LADS.Worktop.Database.checkSetting('UseHTTPS');
        if (useHttps && useHttps.toLowerCase() === 'true') {
            return "https://" + _baseURL + ':' + HTTPS_PORT;
        } else {
            return "http://" + _baseURL + ':' + HTTP_PORT;
        }
    }

    function getFileURL() {
        return "http://" + _baseURL + ':' + FILE_PORT;
    }
};

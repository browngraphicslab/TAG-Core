var TAG = TAG || LADS || {};

TAG.Util.makeNamespace("TAG.Worktop.Database");

/*
    Contains static methods for accessing the database.  Holds an instance of Worktop.Database
    where many of the requests are sent to to access the cache, but all requests ultimately
    use asyncRequest.

    See issue #205 (http://tagissuetracker.cs.brown.edu:3000/issues/205) for info on the protocol.
    Refer to individual functions or issue #205 for info on each request.
*/
TAG.Worktop.Database = (function () {
    var _db,
        _main,
        HTTP_PORT = '8080',
        HTTPS_PORT = '9001',
        FILE_PORT = '8086';

    var util = TAG.Util;

    // If true an exception will be thrown if a post/put request is made with an invalid parameter
    var strict = true;

    // Parameters for post/put requests
    // Body parameters MUST be specified properly for the various put/post functions to move
    // the appropriate parameters into the body.
    var params = {
        exhibition: {
            url: ['Name', 'Sub1', 'Sub2', 'Background', 'Img1', 'Img2', 'Private', 'Font', 'SortOptions', 'Timeline','AssocMediaView', 'AddSortOptions'],
            body: ['Description', 'AddIDs', 'RemoveIDs']
        },
        artwork: {
            url: ['Name', 'Title', 'Artist', 'Year', 'Month', 'Day', 'TimelineYear', 'TimelineMonth', 'TimelineDay', 'Preview', 'Thumbnail', 'Deepzoom', 'Source', 'Duration', 'Converted', 'Locked'],
            body: ['Description', 'Location', 'AddIDs', 'RemoveIDs', 'InfoFields', 'Duration', 'RichLocationHistory', 'AddMaps', 'RemoveMaps']
        },
        tour: {
            url: ['Name', 'Thumbnail', 'Private'],
            body: ['Description', 'Content', 'RelatedArtworks']
        },
        hotspot: {
            url: ['Name', 'Year', 'Month', 'Day', 'TimelineYear', 'TimelineMonth', 'TimelineDay', 'ContentType', 'Duration', 'Source', 'LinqTo', 'X', 'Y', 'W', 'H', 'LinqType', 'Thumbnail', "Converted"],
            body: ['Description', 'AddIDs', 'RemoveIDs','Text']
        },
        map: {
            url: ['Name', 'Thumbnail', 'Source'],
            body: ['AdditionalInfo', 'Description']
        },
        feedback: {
            url: ['SourceID', 'SourceType'],
            body: ['Description']
        },
        main: {
            url: ['Name', 'OverlayColor', 'OverlayTrans', 'Location', 'Background', 'Icon', 'IconColor', 'BackgroundColor', 'BackgroundOpacity', 'FontFamily', 'PrimaryFontColor', 'SecondaryFontColor', 'BaseFontSize', 'Font', 'IdleTimerDuration','isKioskLocked'],
            body: ['Info']
        }
    };

    return {
        HTTP_PORT: HTTP_PORT,
        HTTPS_PORT: HTTPS_PORT,
        FILE_PORT: FILE_PORT,

        getURL: getURL,
        getSecureURL: getSecureURL,
        setURL: setURL,
        getFileURL: getFileURL,

        fixPath: fixPath,
        fixFontFilePath: fixFontFilePath,
        checkAuth: checkAuth,
        changeServer: changeServer,
        checkSetting: checkSetting,

        // Not sure if these should be kept or not
        getMuseumName: getMuseumName,
        getMuseumLoc: getMuseumLoc,
        getMuseumInfo: getMuseumInfo,
        getStartPageBackground: getStartPageBackground,
        getMuseumLogo: getMuseumLogo,
        getMuseumOverlayColor: getMuseumOverlayColor,
        getMuseumOverlayTransparency: getMuseumOverlayTransparency,
        getLogoBackgroundColor: getLogoBackgroundColor,
        getMuseumBackgroundColor: getMuseumBackgroundColor,
        getBackgroundColor: getMuseumBackgroundColor, // TODO merging
        getMuseumBackgroundOpacity: getMuseumBackgroundOpacity,
        getBackgroundOpacity: getMuseumBackgroundOpacity, // TODO merging
        getMuseumFontFamily: getMuseumFontFamily,
        getFontFamily: getMuseumFontFamily, // TODO merging
        getMuseumPrimaryFontColor: getMuseumPrimaryFontColor,
        getPrimaryFontColor: getMuseumPrimaryFontColor, // TODO merging
        getMuseumSecondaryFontColor: getMuseumSecondaryFontColor,
        getSecondaryFontColor: getMuseumSecondaryFontColor, // TODO merging
        getBaseFontSize: getBaseFontSize,
        getOptionalFeatures: getOptionalFeatures,
        getCustomFont: getCustomFont,
        getIdleTimerDuration: getIdleTimerDuration,
        getLocked: getLocked,
        getKioskLocked : getKioskLocked,

        asyncRequest: asyncRequest,
        convertToDocHandler: convertToDocHandler,
        params: params,
        convertToTextHandler: convertToTextHandler,

        // HEAD
        clearToken: clearToken,
        checkToken: checkToken,

        // GET
        getExhibitions: getExhibitions,
        getFeedback: getFeedback,
        getArtworks: getArtworks,
        getTours: getTours,
        getArtworksAndTours: getArtworksAndTours,
        getMain: getMain,
        getAssocMedia: getAssocMedia,
        getLinq: getLinq,
        getAssocMediaTo: getAssocMediaTo,
        getArtworksAssocTo: getArtworksAssocTo,
        getArtworksIn: getArtworksIn,
        getAssocMediaIn: getAssocMediaIn,
        getMaps: getMaps,
        getSalt: getSalt,
        getAuth: getAuth,
        getVersion: getVersion,
        getDoq: getDoq,
        changePass: changePass,
        getConvertedCheck: getConvertedCheck, //video conversion
        getConvertedVideoCheck: getConvertedVideoCheck, //video conversion
        convertVideo: convertVideo,

        // DELETE
        deleteDoq: deleteDoq,
        batchDeleteDoq: batchDeleteDoq,
        deleteLinq: deleteLinq,

        // PUT
        createTour: createTour,
        createExhibition: createExhibition,
        createFeedback: createFeedback,
        createArtwork: createArtwork,
        createHotspot: createHotspot,
        createIframeAssocMedia: createIframeAssocMedia,
        createTextAssocMedia: createTextAssocMedia,
        createMap: createMap,

        // POST
        changeTour: changeTour,
        changeExhibition: changeExhibition,
        changeArtwork: changeArtwork,
        changeHotspot: changeHotspot,
        changeMap: changeMap,
        changeMain: changeMain,
        addSortOptions: addSortOptions,
        uploadImage: uploadImage,
    }

    ///////////////
    // NEW STUFF //
    ///////////////

    ///////////////////////////////
    // Worktop.Database Wrappers //
    ///////////////////////////////
    // Unless otherwise noted handles (success, unauth, conflict, error) are called
    // with two arguments, the first being the jqXHR object for the request (http://api.jquery.com/jQuery.ajax/#jqXHR)
    // and the second being an object ajaxCall which has two methods, call and force.
    // call will redo the ajaxCall exactly as it was, force will redo the ajax call, but set
    // Force=true in the request overwriting in the case of a conflict.
    //
    // The following handlers exist for the various different function:
    //      success: Called when the request is successful
    //      unauth: Called when the token provided was invalid and the user 
    //              didn't input the password when prompted (ie. they clicked cancel)
    //      conflict: Called when there is a conflict
    //      error: Called for any other error
    //      errorCache: Called if there is an error with the cached doq/doqs as the argument

    ///////////////////
    // HEAD REQUESTS //
    ///////////////////

    /*
        Clears a token from the server so it can no longer be used
            token: The token to clear
            success: See above
            error: See above
    */
    function clearToken(token, success, error) {
        asyncRequest('HEAD', 'ClearToken', { Token: token }, null, { success: success, error: error }, true);
    }

    /*
        Checks if a token is valid
            token: The token to check
            success: See above
            unauth: Called if the token is not valid
            error: See above
    */
    function checkToken(token, success, unauth, error) {
        asyncRequest('HEAD', 'CheckToken', { Token: token }, null, { success: success, 401: unauth, error: error }, true);
    }

    //////////////////
    // GET REQUESTS //
    //////////////////

    /*
        Gets all exhibitions
            success: Called on success with the doq array as the argument
            error: See above
            errorCache: see above
    */
    function getExhibitions(success, error, errorCache) {
        _db = _db || new Worktop.Database();
        _db.getExhibitions({ success: success, error: error, errorCache: errorCache });
    }

    /*
        Gets all feedback
            success: Called on success with the doq array as the argument
            error: See above
            errorCache: see above
    */
    function getFeedback(success, error, errorCache) {
        _db = _db || new Worktop.Database();
        _db.getFeedback({ success: success, error: error, errorCache: errorCache });
    }

    /*
        Gets all artworks
            success: Called on success with the doq array as the argument
            error: See above
            errorCache: see above
    */
    function getArtworks(success, error, errorCache) {
        _db = _db || new Worktop.Database();
        _db.getArtworks({ success: success, error: error, errorCache: errorCache });
    }

    /*
        Gets all tours
            success: Called on success with the doq array as the argument
            error: See above
            errorCache: see above
    */
    function getTours(success, error, errorCache) {
        _db = _db || new Worktop.Database();
        _db.getTours({ success: success, error: error, errorCache: errorCache });
    }

    /*
        Gets all artworks and all tours. Hacky way to do this right now; should be a separate server function
            success: Called on Success with the doq array as the argument
            error: See above
            errorCache: See above
    */
    function getArtworksAndTours(success, error, errorCache) {
        var components = [];
        getArtworks(function (artworks) {
            components = artworks;
            getTours(function (tours) {
                success(components.concat(tours));
            }, error, errorCache);
        }, error, errorCache);
    }

    /*
        Gets a doq
            guid: The guid of the doq to get
            success: Called on success with the doq as the argument
            error: See above
            errorCache: see above
    */
    function getDoq(guid, success, error, errorCache) {
        _db = _db || new Worktop.Database();
        _db.getDoq(guid, { success: success, error: error, errorCache: errorCache });
    }

    /*
        Gets the main doq
            success: Called on success with the doq as the argument
            error: See above
            errorCache: see above
    */
    function getMain(success, error, errorCache) {
        _db = _db || new Worktop.Database();
        _db.getMain({
            success: function (main) {
                _main = main;
                success && success(main);
            }, error: error, errorCache: errorCache
        });
    }

    /*
        Gets all associated media
            success: Called on success with the doq array as the argument
            error: See above
            errorCache: see above
    */
    function getAssocMedia(success, error, errorCache) {
        _db = _db || new Worktop.Database();
        _db.getAssocMedia({ success: success, error: error, errorCache: errorCache });
    }

    /*
        Gets the linq between two doqs
            guid1: guid of one doq in the linq
            guid2: guid of the other doq in the linq
            success: Called on success with the linq as the argument
            error: See above
            errorCache: see above
    */
    function getLinq(guid1, guid2, success, error, errorCache) {
        _db = _db || new Worktop.Database();
        _db.getLinq(guid1, guid2, { success: success, error: error, errorCache: errorCache });
    }

    /*
        Gets all associated media to an artwork (gets all linqs to a doq)
            guid: Guid of the artwork/doq to get doqs linqed to
            success: Called on success with the doq array as the argument
            error: See above
            errorCache: see above
    */
    function getAssocMediaTo(guid, success, error, errorCache) {
        _db = _db || new Worktop.Database();
        _db.getAssocMediaTo(guid, { success: success, error: error, errorCache: errorCache });
    }

    /*
        Gets all artworks a media is associated to
            guid: Guid of the media
            success: Called on success with the doq array as the argument
            error: see above
            errorCache: see above
    */
    function getArtworksAssocTo(guid, success, error, errorCache) {
        _db = _db || new Worktop.Database();
        _db.getArtworksAssocTo(guid, { success: success, error: error, errorCache: errorCache });
    }

    /*
        Gets all artworks in an exhibition
            guid: Guid of the exhibition
            success: Called on success with the doq array as the argument
            error: See above
            errorCache: see above
    */
    function getArtworksIn(guid, success, error, errorCache) {
        _db = _db || new Worktop.Database();
        _db.getArtworksIn(guid, { success: success, error: error, errorCache: errorCache });
    }

    function getAssocMediaIn(guid, success, error, errorCache) {
        _db = _db || new Worktop.Database();
        _db.getAssocMediaIn(guid, { success: success, error: error, errorCache: errorCache });
    }
    /*
        Gets maps related to given artwork
            guid: artowork guid
            success: called on success with array of map doqs as argument
            error: see above
            errorCache: see above
    */
    function getMaps(guid, success, error, errorCache) {
        // TODO
        _db = _db || new Worktop.Database();
        _db.getMaps(guid, { success: success, error: error, errorCache: errorCache });
        //success([]);
    }

    /*
        Gets the salt from the server
            success: Called with the salt as the argument
            error: See above
    */
    function getSalt(success, error) {
        asyncRequest(
            'GET',
            'Salt',
            null,
            null,
            { success: convertToTextHandler(success), error: error },
            true);
    }

    /*
        Checks if the password and salt are valid
            password: plain text password
            salt: salt provided by the server (see getSalt)
            success: Called with the token as the argument
            unauth: Called if the login fails because the password was wrong
            error: See above
    */
    function getAuth(password, salt, success, unauth, error) {
        asyncRequest(
            'GET',
            'Auth',
            { Hash: TAG.Auth.hashPass(password, salt) },
            null,
            { success: convertToTextHandler(success), 401: unauth, error: error },
            true);
    }


    /*
        Gets the version of the server
            success: Called on success with the version as a string as the argument
            error: See above
    */
    function getVersion(success, error) {
        _db = _db || new Worktop.Database();
        asyncRequest(
            'GET',
            'CheckVersion',
            null,
            null,
            { success: convertToStatusHandler(success), error: error });
    }

    /*
        Changes the password
            oldpass: Plaintext of the old password
            salt: Salt provided by the server (see getSalt)
            newpass: Plaintext of new password
            success: Called on success with the new token as the argument
            unauth: Called if the password is wrong
            error: See above
    */
    function changePass(oldpass, salt, newpass, success, unauth, error) {
        asyncRequest(
            'POST',
            'ChangePassword',
            { OldHash: TAG.Auth.hashPass(oldpass, salt), NewPass: newpass },
            null,
            { success: convertToTextHandler(success), unauth: unauth, error: error },
            true);
    }
    //check for files. 
    function getConvertedCheck(success, error, fileName,basefilename) {
        asyncRequest(
            'GET',
            'ConvertedCheck',
            {
                "FileName": fileName,
                "BaseFileName": basefilename,
            },
            null,
            { success: convertToTextHandler(success), error: error });
    }

    function getConvertedVideoCheck(success, error, guid) {
        asyncRequest(
            'GET',
            'ConvertedVideoCheck',
            { "guid": guid },
            null,
            { success: convertToStatusHandler(success), error: error });
    }
    function convertVideo(success, error, newFileName, fileExtension, baseFileName, doq,forTour) {
        asyncRequest(
            'POST',
            'ConvertVideo',
            { "FileName": newFileName, "Extension": fileExtension, "BaseFileName": baseFileName, "Identifier": doq,"ForTour":forTour },
            null,
            { success: convertToTextHandler(success), error: error }
            , true);
    }

    //////////////////
    // PUT REQUESTS //
    //////////////////

    /*
        Create a tour
            options: Values for the new tour in a dictionary:
                Name: Name of the tour
                Thumbnail: Thumbnail URL
                Private: Private state
                Description: Tour description
                Content: Tour content (JSON for RIN data)
                RelatedArtworks: JSON of related artworks
            All options are optional.  Providing unspported options in strict mode will throw an exception.

            success: Success handler (called if the tour is successfully created) with the new doq as the argument if returnDOq is true
            unauth: Unauthorized handler (called when a user fails to login)
            error: Called for any other errors
            returnDoq: If true the newly created tour will be returned from the server and passed to the success handler
    */
    function createTour(options, success, unauth, error, returnDoq) {
        _db = _db || new Worktop.Database();
        _db.putTour(options, { success: success, error: error, unauth: unauth }, returnDoq, strict);
    }

    /*
    Create an exhibition
        options: Values for the new exhibition in a dictionary:
            Name: Name of the exhibition
            Sub1: Subheading 1 of the exhibition
            Sub2: Subheading 2 of the exhibition
            Background: BG Image URL
            Img1: Desc image 1 URL
            Img2: Desc image 2 URL (unused)
            Private: Exhibition private state (boolean)
            Description: Exhibition description
            AddIDs: Comma separated list of artwork IDs to add to the exhibition
        All options are optional.  Providing unspported options in strict mode will throw an exception.

        success: Success handler (called if the tour is successfully created) with the new doq as the argument if returnDOq is true
        unauth: Unauthorized handler (called when a user fails to login)
        error: Called for any other errors
        returnDoq: If true the newly created tour will be returned from the server and passed to the success handler
    */
    function createExhibition(options, success, unauth, error, returnDoq) {
        _db = _db || new Worktop.Database();
        _db.putExhibition(options, { success: success, error: error, unauth: unauth }, returnDoq, strict);
    }

    /*
        Create Feedback
            text: Description text for the feedback
            sourceType: Type of the source (Exhibition, Artwork, Tour)
            sourceID: GUID of the source doq
            success: Called on successful creation
            error: Called on error
    */
    function createFeedback(text, sourceType, sourceID, success, error) {
        _db = _db || new Worktop.Database();
        text = text || "No Text";
        _db.putFeedback({ SourceID: sourceID, SourceType: sourceType, Description: text }, { success: success, error: error }, false, strict);
    }

    /* Create an artwork
        options: Values for the new artwork in a dictionary:
            Name: Name of the artwork
            Title: title of the artork (not used?)
            Artist: Artist of the artwork
            Year: Year of the artwork
            Preview: preview image URL
            Thumbnail: thumbnail image URL
            Deepzoom: Deepzoom URL
            InfoFields: JSON of custom info fields
            Description: Description of artwork
            Location: JSON of location info
            AddIDs: Comma separated list of associated media IDs to add to the exhibition
        All options are optional.  Providing unspported options in strict mode will throw an exception.

        success: Success handler (called if the artwork is successfully created) with the new doq as the argument if returnDoq is true
        unauth: Unauthorized handler (called when a user fails to login)
        error: Called for any other errors
        returnDoq: If true the newly created artwork will be returned from the server and passed to the success handler
    */
    function createArtwork(options, success, unauth, error, returnDoq) {
        _db = _db || new Worktop.Database();
        _db.putArtwork(options, { success: success, error: error, unauth: unauth }, returnDoq, strict);
    }

    /* Create a hotspot/associated media
        options: Values for the new hotspot in a dictionary:
            Name: Name of the hotspot
            ContentType: Content type of the hotspot
            Duration: Duration of the hotspot
            Source: Source URL for the hotspot
            LinqTo: GUID of a doq to create a linq with
            X: The x position of the linq (requires LinqTo)
            Y: The y position of the linq (requires LinqTo)
            LinqType: The type of the linq (requires LinqTo)
            Description: Description of the hotspot
        All options are optional (except LinqTo if X, Y, or LinqType is set).  Providing unspported options in strict mode will throw an exception.

        success: Success handler (called if the hotspot is successfully created) with the new doq as the argument if returnDoq is true
        unauth: Unauthorized handler (called when a user fails to login)
        error: Called for any other errors
        returnDoq: If true the newly created hotspot will be returned from the server and passed to the success handler
    */
    function createHotspot(options, success, unauth, error, returnDoq) {
        _db = _db || new Worktop.Database();
        _db.putHotspot(options, { success: success, error: error, unauth: unauth }, returnDoq, strict);
    }

    function createMap(options, success, unauth, error, returnDoq) {
        _db = _db || new Worktop.Database();
        _db.putMap(options, { success: success, error: error, unauth: unauth }, returnDoq, strict);
    }

    ///////////////////
    // POST REQUESTS //
    ///////////////////

    /*
        Change a tour
            options: New values for the tour in a dictionary:
                Name: Name of the tour
                Thumbnail: Thumbnail URL
                Private: Private state
                Description: Tour description
                Content: Tour content (JSON for RIN data)
            All options are optional.  Providing unspported options in strict mode will throw an exception.

            success: Success handler (called if the tour is successfully changed)
            unauth: Unauthorized handler (called when a user fails to login)
            conflict: Called if the client's version of the doq is out of date
            error: Called for any other errors
    */
    function changeTour(guid, options, success, unauth, conflict, error) {
        _db = _db || new Worktop.Database();
        if (typeof guid !== "string" && guid && guid.Identifier) guid = guid.Identifier;
        _db.postTour(guid, options, { success: success, unauth: unauth, conflict: conflict, error: error }, strict);
    }

    /*
    Change an exhibition
        options: New values for the exhibition in a dictionary:
            Name: Name of the exhibition
            Sub1: Subheading 1 of the exhibition
            Sub2: Subheading 2 of the exhibition
            Background: BG Image URL
            Img1: Desc image 1 URL
            Img2: Desc image 2 URL (unused)
            Private: Exhibition private state (boolean)
            Description: Exhibition description
            AddIDs: Comma separated list of artwork IDs to add to the exhibition
            RemoveIDs: Comma separated list of artwork IDs to remove from the exhibition
            Timeline: whether the timeline for the given collection is shown
        All options are optional.  Providing unspported options in strict mode will throw an exception.

        success: Success handler (called if the tour is successfully changed)
        unauth: Unauthorized handler (called when a user fails to login)
        conflict: Called if the client's version of the doq is out of date
        error: Called for any other errors
    */
    function changeExhibition(guid, options, success, unauth, conflict, error) {
        _db = _db || new Worktop.Database();
        if (typeof guid !== "string" && guid && guid.Identifier) guid = guid.Identifier;
        _db.postExhibition(guid, options, { success: success, unauth: unauth, conflict: conflict, error: error }, strict);
    }

    function addSortOptions(guid, success, unauth, conflict, error) {
        _db = _db || new Worktop.Database();
        _db.addSortOptions(guid, { success: success, unauth: unauth, conflict: conflict, error: error }, strict);
    }
    /*
    Change an artwork
        options: New values for the artwork in a dictionary:
            Name: Name of the artwork
            Title: title of the artork (not used?)
            Artist: Artist of the artwork
            Year: Year of the artwork
            Month: Month of artwork
            Day: Day of artwork
            TimelineYear: Year artwork displayed on timeline
            TimelineMonth: Month artwork displayed on timeline
            TimelineDay: Day artwork displayed on timeline
            Preview: preview image URL
            Thumbnail: thumbnail image URL
            Deepzoom: Deepzoom URL
            InfoFields: JSON of custom info fields
            Description: Description of artwork
            Location: JSON of location info
            AddIDs: Comma separated list (string) of associated media IDs to add to the exhibition
            RemoveIDs: Same as addIDs, but associated media to remove
            Duration: duration of a video artwork
            Source: source of video artwork
        All options are optional.  Providing unspported options in strict mode will throw an exception.

        success: Success handler (called if the artwork is successfully changed)
        unauth: Unauthorized handler (called when a user fails to login)
        conflict: Called if the client's version of the doq is out of date
        error: Called for any other errors
    */
    function changeArtwork(guid, options, success, unauth, conflict, error) {
        _db = _db || new Worktop.Database();
        if (typeof guid !== "string" && guid && guid.Identifier) guid = guid.Identifier;
        _db.postArtwork(guid, options, { success: success, unauth: unauth, conflict: conflict, error: error }, strict);
    }

    /*
    Change a hotspot/associated media
        options: New values for the hotspot in a dictionary:
            Name: Name of the hotspot
            Year: Year of the media
            Month: Month of media
            Day: Day of media
            TimelineYear: Year media displayed on timeline
            TimelineMonth: Month media displayed on timeline
            TimelineDay: Day media displayed on timeline
            ContentType: Content type of the hotspot
            Duration: Duration of the hotspot
            Source: Source URL for the hotspot
            LinqTo: GUID of a doq to create a linq with or a doq that the hotspot is already linqed to
            X: The x position of the linq (requires LinqTo)
            Y: The y position of the linq (requires LinqTo)
            LinqType: The type of the linq (requires LinqTo)
            Description: Description of the hotspot
            Thumbnail: URL for a thumbnail (used for videos)
        All options are optional (except LinqTo if X, Y, or LinqType are used).  Providing unspported options in strict mode will throw an exception.

        success: Success handler (called if the hotspot is successfully changed)
        unauth: Unauthorized handler (called when a user fails to login)
        conflict: Called if the client's version of the doq is out of date
        error: Called for any other errors
    */
    function changeHotspot(guid, options, success, unauth, conflict, error) {
        _db = _db || new Worktop.Database();
        if (typeof guid !== "string" && guid && guid.Identifier) guid = guid.Identifier;
        _db.postHotspot(guid, options, { success: success, unauth: unauth, conflict: conflict, error: error }, strict);
    }

    // TODO document
    function createIframeAssocMedia(options, success, unauth, conflict, error) {
        _db = _db || new Worktop.Database();
        _db.postIframeAssocMedia(options, { success: success, unauth: unauth, conflict: conflict, error: error }, strict);
    }

    /*
    Add a Text associated media
        options: New values for the text assoc media in a dictionary:
            Name: Name of the text
            Text: Content of the text

        success: Success handler (called if the hotspot is successfully changed)
        unauth: Unauthorized handler (called when a user fails to login)
        conflict: Called if the client's version of the doq is out of date
        error: Called for any other errors
    */
    function createTextAssocMedia(options, success, unauth, conflict, error) {
        _db = _db || new Worktop.Database();
        _db.postTextAssocMedia(options, { success: success, unauth: unauth, conflict: conflict, error: error }, strict);
    }

    /*
    Change a map doq
        guid: guid of map
        options:
            Name: name of the map
            AdditionalInfo: any additional information about the map (e.g., a date string)
            Description: description of the map
        success: success handler called if map is changed successfully
        unauth: see above
        conflict: see above
        error: see above
    */
    function changeMap(guid, options, success, unauth, conflict, error) {
        _db = _db || new Worktop.Database();
        if (typeof guid !== "string" && guid && guid.Identifier) guid = guid.Identifier;
        _db.postMap(guid, options, { success: success, unauth: unauth, conflict: conflict, error: error }, strict);
    }

    /*
    Change the main doq (start page)
        options: New values for main in a dictionary:
            Name: Museum name
            OverlayColor: Overlay color
            OverlayTrans: Overlay transparency
            Location: Museum loaction
            Background: BG image URL
            Icon: Icon image URL
            IconColor: Icon color
            Info: Museum info
            BackgroundColor: Background color
            BackgroundOpacity: Background Opacity
            PrimaryFontColor: Primary Font Color
            SecondaryFontColor: Secondary Font color
            BaseFontSize: Base Font Size

            surbhi below...
            

            
        All options are optional.  Providing unspported options in strict mode will throw an exception.

        success: Success handler (called if main is successfully changed)
        unauth: Unauthorized handler (called when a user fails to login)
        conflict: Called if the client's version of the doq is out of date
        error: Called for any other errors
    */
    function changeMain(options, success, unauth, conflict, error) {
        _db = _db || new Worktop.Database();
        _db.postMain(options, { success: success, unauth: unauth, conflict: conflict, error: error }, strict);
    }

    /*
        Uploads an image with a data url
            dataURL: data URL for the image
            success: Called on success with the image's url as the argument
            unauth: See above
            error: See above
    */
    function uploadImage(dataURL, success, unauth, error) {
        asyncRequest(
            'POST',
            'FileUploadDataURL',
            { Token: TAG.Auth.getToken() },
            null,
            { success: convertToTextHandler(success), unauth: unauth, error: error },
            true,
            dataURL);

    }

    /////////////////////
    // DELETE REQUESTS //
    /////////////////////

    /*
        Delete a doq
            guid: GUID of the doq to delete
            success: See above
            error: See above
            unauth: See above
            conflict: See above
    */
    function deleteDoq(guid, success, unauth, conflict, error) {
        _db = _db || new Worktop.Database();
        if (typeof guid !== "string" && guid && guid.Identifier) guid = guid.Identifier;
        _db.deleteDoq(guid, { success: success, error: error, unauth: unauth, conflict: conflict });
    }

    /*
        Delete multiple doqs
            guids: GUIDs of the doqs to delete
            success: See above
            error: See above
            unauth: See above
            conflict: See above
    */
    function batchDeleteDoq(guids, success, unauth, conflict, error) {
        _db = _db || new Worktop.Database();
        _db.batchDeleteDoq(guids, { success: success, error: error, unauth: unauth, conflict: conflict });
    }

    /*
        Delete a linq
            guid: GUID of the linq to delete
            success: See above
            error: See above
            unauth: See above
            conflict: See above
    */
    function deleteLinq(guid, success, unauth, conflict, error) {
        _db = _db || new Worktop.Database();
        if (typeof guid !== "string" && guid && guid.Identifier) guid = guid.Identifier;
        _db.deleteLinq(guid, { success: success, error: error, unauth: unauth, conflict: conflict });
    }

    /////////////////////////
    // STATIC UTIL METHODS //
    /////////////////////////

    /*
        Converts a function expecting a doq to a handler for asyncRequest
        Returns a function that is the new handler to be used
            handler: A function that takes a doq as an argument
            error: Called if there is an error parsing the doq
    */
    function convertToDocHandler(handler, error) {
        return function (jqXHR, ajaxCall) {
            var doq;
            try {
                doq = new Worktop.Doq(jqXHR.responseText)
            } catch (exception) {
                util.safeCall(error, jqXHR, ajaxCall);
            }
            if (doq && (doq.Name || doq.Offset)) {
                util.safeCall(handler, doq, jqXHR);
            } else if (doq && doq[0]) {
                util.safeCall(handler, doq, jqXHR);
            } else if (doq) {
                util.safeCall(handler, [], jqXHR);
            }
        }
    }

    /*
        Converts a function expecting a string to a handler for asyncRequest
        Returns a functio that is the new handler to be used
            handler: A function that takes a string as an argument
    */
    function convertToTextHandler(handler) {
        return function (jqXHR, ajaxCall) {
            util.safeCall(handler, jqXHR.responseText);
        }
    }

    /*
        Converts a function expecting a string from the status text to a handler for asyncRequest
        Returns a functio that is the new handler to be used
            handler: A functio that takes a string as an argument
    */
    function convertToStatusHandler(handler) {
        return function (jqXHR, ajaxCall) {
            util.safeCall(handler, jqXHR.statusText);
        }
    }

    /*
      Makes an asynchronous request with the 'Type' parameter of the URL set to type
      and the rest of the parameters set according to the urlOptions dictionary.
      The body is populated from the bodyOptions dictionary using the server
      recognized format.
      Handlers is a dictionary of handler functions with the keys being success,
      error, or the error/success code number you want to handle, for example:
      handlers = {
        success: doOnSuccess();
        404: notFound();
        401: notAuthorized();
      }
      Any HTTP response is supported, see the issue tracker (redmine #205) for info on the status
      codes the server might respond with.  Handlers are called with the jqXHR object
      (http://api.jquery.com/jQuery.ajax/#jqXHR) as the first argument, and a function
      to redo the request as the second argument.  This can be useful if the user needs
      to authenticate and the request needs to be repeated.
        method: HTTP method (GET, POST, PUT, DELETE, HEAD)
        type: Type of the request (ex. CreateArtwork)
        urlOptions: key/value options to be put into the url string
        bodyOptions: key/value options to be put into the body of the request
        handlers: see above
        secure: if true the request uses https if the server requires it, otherwise uses http
        customBody: if set then the body of the request is set to this parameter, otherwise the body is created from bodyOptions
                    note that this will overwrite bodyoptions
        customAddress: Uses the specified address instead of the address stoed in _db

      Returns an object with the following methods:
        call: will redo the ajax request exactly as specified
        force: will redo the ajax request with Force=true to force an update if there is a conflict
    */
    function asyncRequest(method, type, urlOptions, bodyOptions, handlers, secure, customBody, customAddress) {
        if (!type) return false;

        handlers = handlers || {};
        urlOptions = urlOptions || {};
        bodyOptions = bodyOptions || {};

        // Temporary override to ignore all conflicts.
        urlOptions.Force = "true";

        // Set up the URL with options
        var url = (customAddress ? customAddress : (secure ? _db.getSecureURL() : _db.getURL())) + "/?Type=" + type;
        $.each(urlOptions, function (key, val) {
            url = url + "&" + key + "=" + escape(val);
        });

        // Set up body with options
        var boundary, body;
        if (Object.keys(bodyOptions).length) {
            boundary = findBoundary(bodyOptions);
            body = "Boundary:" + boundary;
            boundary = "\r\n" + boundary + "\r\n";
            $.each(bodyOptions, function (key, val) {
                body = body + boundary + key + ":" + escape(val);
            });
        }

        var ajaxCall = {
            call: function () {
                $.ajax({
                    type: method,
                    url: url,
                    cache: false,
                    dataType: "text",
                    async: true,
                    processData: false,
                    data: customBody || body,
                    success: function (data, textStatus, jqXHR) {
                        if (!handlers[jqXHR.status])
                            util.safeCall(handlers.success, jqXHR, ajaxCall);

                        util.safeCall(handlers[jqXHR.status], jqXHR, ajaxCall);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        if (!handlers[jqXHR.status])
                            util.safeCall(handlers.error, jqXHR, ajaxCall);

                        util.safeCall(handlers[jqXHR.status], jqXHR, ajaxCall);
                    }
                });
            },
            force: function () {
                url = url + '&Force=true';
                ajaxCall.call();
            },
            setToken: function (token) {
                url = removeToken(url);
                url = url + "&Token=" + token;
                return ajaxCall;
            }
        }
        ajaxCall.call();
    }

    function removeToken(url) {
        var start = url.indexOf('&Token=');
        var end = url.indexOf('&', start + 1);
        var substr = url.substring(start, end);
        return url.replace(substr, '');
    }

    /*
        Finds a boundary for the body of a request given key/value pairs of options
            bodyOptions: key/value pairs to be inserted to the body
        Returns an appropriate boundary that isn't found in the keys or values provided
    */
    function findBoundary(bodyOptions) {
        var boundary = "----";
        var found = false;
        do {
            found = false;
            boundary = boundary + "-";
            $.each(bodyOptions, function (key, val) {
                if (TAG.Util.contains(key, boundary)) {
                    found = true;
                    return false;
                }
                if (TAG.Util.contains(val, boundary)) {
                    found = true;
                    return false;
                }
            });
        } while (found);
        return boundary;
    }



    /////////////////////////////////////
    // ANYTHING BELOW MIGHT BE DELETED //
    /////////////////////////////////////

    function load(repo, callback, error) {
        // Load database
        if (!_db)
            _db = new Worktop.Database(repo);
        _db.getMain({
            success: function (main) {
                _main = main;
                callback(main)
            }, error: error
        });
        //// Populate
        //if (callback) { // not in use right now
        //    var doq;
        //    // use local xml when useServer = false
        //    var name = "Main";
        //    var url;
        //    if (_db.useServer)
        //        url = _db.getURL() + "/?Type=Doq&Name=" + name;
        //    else
        //        url = "testXML/" + name + ".xml";

        //    var request = $.ajax({
        //        url: url,
        //        cache: false, // forces browser to not cache the data
        //        dataType: "text",
        //        async: true,
        //        success: function (data) {

        //            if (request.responseText) {
        //                _main = new Worktop.Doq(request.responseText);

        //                callback();
        //            }

        //        },
        //        error: function (err) {
        //            return;
        //        }
        //    });
        //}
        //else {

        //    _main = _db.getDoqByName("Main");
        //}
    }

    function reloadMain(callback) {
        if (callback) {
            var doq;
            var name = "Main";
            var url;
            if (_db.useServer)
                url = _db.getURL() + "/?Type=Doq&Name=" + name;
            else
                url = "testXML/" + name + ".xml";

            var request = $.ajax({
                url: url,
                cache: false, // forces browser to not cache the data
                dataType: "text",
                async: true,
                success: function (data) {
                    if (request.responseText) {
                        _main = new Worktop.Doq(request.responseText);
                        callback();
                    } else {
                    }
                },
                error: function (err) {
                    return;
                }
            });
        }
        else {
            _main = _db.getDoqByName("Main");
        }
    }

    function checkSetting(key, onSuccess) {
        if (onSuccess) {
            _db.getMain({
                success: function (main) {
                    onSuccess(main.Metadata['Setting_' + key]);
                }
            });
        } else {
            return _main.Metadata['Setting_' + key];
        }
    }

    function isExhibitionDirty() {
        return _exhibitionDirty;
    }

    function setExhibitionDirty(value) {
        _exhibitionDirty = value;
    }

    function getMuseumName() {
        return _main.Metadata["MuseumName"];
    }

    function getLocked() {
        return _main.Metadata["Locked"];
    }

    function getMuseumOverlayColor() {
        return _main.Metadata["OverlayColor"] || '000000';
    }

    function getMuseumOverlayTransparency() {
        return _main.Metadata["OverlayTransparency"];
    }

    function getMuseumLoc() {
        return _main.Metadata["MuseumLoc"];
    }

    function getMuseumInfo() {
        return _main.Metadata["MuseumInfo"];
    }

    /////////
    function getMuseumBackgroundColor() {
        return _main.Metadata["BackgroundColor"] || '000000';
    }

    function getKioskLocked() {
        return _main.Metadata["isKioskLocked"] || 'true';
    }

    function getMuseumBackgroundOpacity() {
        return _main.Metadata["BackgroundOpacity"] || '70'; // '0' is true
    }

    function getMuseumPrimaryFontColor() {
        return _main.Metadata["PrimaryFontColor"] || '#FFFFFF';
    }

    function getMuseumSecondaryFontColor() {
        return _main.Metadata["SecondaryFontColor"] || '#FFFFFF';
    }

    function getMuseumFontFamily() {
        return _main.Metadata["FontFamily"] || 'Segoe UI Light';
    }
    //////////
    function getCustomFont() {
        return TAG.Worktop.Database.fixFontFilePath(_main.Metadata["Font"]);
    }

    function getOptionalFeatures() {
        return _main.Metadata["OptionalFeatures"];
    }

    function getBaseFontSize() {
        return _main.Metadata["BaseFontSize"] || "1.77";
    }

    function getStartPageBackground() {
        return TAG.Worktop.Database.fixPath(_main.Metadata["BackgroundImage"]);
    }

    function getMuseumLogo() {
        return TAG.Worktop.Database.fixPath(_main.Metadata["Icon"]);
    }

    function getLogoBackgroundColor() {
        return _main.Metadata["IconColor"];
    }

    function getOverlayColor() {
        return _main.Metadata["OverlayColor"];
    }
    function getOverlayTransparency() {
        return _main.Metadata["OverlayTransparency"];
    }

    function getIdleTimerDuration() {
        return _main.Metadata["IdleTimerDuration"] || '2';
    }

    function getMainGuid() {
        return _main.Identifier;
    }

    function getExhibitionBackgroundImage() {
        // return getExhibitions(true)[0].Metadata["BackgroundImage"];
    }

    // 
    function getDoqXML(guid, callback) {
        if (callback) {
            _db.getDoqByGUID(guid, function () {
                callback(getXML(guid));
            });
        } else {
            _db.getDoqByGUID(guid);
            return getXML(guid);
        }
    }

    // get doq links using GUID - see worktop.database.js
    function getDoqLinqs(guid, callback) {
        if (callback) {
            _db.getDoqLinqsByGUID(guid, callback);
        } else
            return _db.getDoqLinqsByGUID(guid);
    }

    function getLinqXML(guid, callback) {
        if (callback) {
            var linq;
            if (_db.useServer)
                url = _db.getURL() + "/?Type=Linq&Guid=" + guid;
            else
                url = "testXML/" + guid + ".xml";

            var request = $.ajax({
                url: url,
                dataType: "text",
                cache: false, // forces browser to not cache the data
                async: true,
                success: function () {
                    if (request.responseText) {
                        try {
                            new Worktop.Doq(request.responseText);
                            var xmlToParse = getXML(guid);
                            var xmlHotspot = $.parseXML(xmlToParse);
                            callback(false, xmlHotspot);
                        }
                        catch (err) {
                            console.log("error in getLinqXML: " + err);
                            getLinqXML(guid, callback);
                        }
                    }
                }
            });

            request.fail(function (request, error) {
                console.log(error);
            });

        }
        else {

            _db.getLinqByGUID(guid);
            return getXML(guid);
        }

    }

    // helper function for sorting a specified set
    function sortHelper(toSort) {
        toSort.sort(function (a, b) {
            if (a.Name < b.Name) {
                return -1;
            } else if (a.Name > b.Name) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    // get all exhibitions
    //function getExhibitions(callback) {
    //    _db.getExhibitions({ success: callback });
    //    return;
    //    if (_exhibitionDirty) {
    //        if (callback) {
    //            var exhibits;
    //            var guid = _main.Identifier;
    //            var doq, url;
    //            if (_db.useServer)
    //                url = _db.getURL() + "/?Type=DoqsInFolder&Guid=" + guid;
    //            else
    //                url = "testXML/" + guid + "_Content.xml";


    //            var request = $.ajax({
    //                url: url,
    //                dataType: "text",
    //                cache: false, // forces browser to not cache the data
    //                async: true,
    //                success: function (data) {
    //                    _exhibitions = [];
    //                    if (request.responseText) {
    //                        try {
    //                            exhibits = new Worktop.Doq(request.responseText);
    //                            if (exhibits[0]) {
    //                                $.each(exhibits, function (i, e) {
    //                                    if (e.Metadata.Type == "Exhibit") {
    //                                        _exhibitions.push(e);
    //                                    }
    //                                });
    //                            }
    //                            _exhibitionDirty = false;
    //                            sortHelper(_exhibitions);
    //                            callback(_exhibitions);
    //                        }
    //                        catch (err) {
    //                            console.log("error in getExhibitions: " + err);
    //                            callback([]);
    //                        }
    //                    } else {
    //                        callback([]);
    //                    }
    //                },
    //                error: function (err) {
    //                    console.log("ajax fails in getExhibition");
    //                }
    //            });
    //        } else {
    //               _exhibitions = [];
    //                var exhibits = _db.getDoqsInFolderByGUID(_main.Identifier);
    //                if (exhibits[0]) {
    //                    $.each(exhibits, function (i, e) {
    //                        if (e.Metadata.Type == "Exhibit") {
    //                            _exhibitions.push(e);
    //                        }
    //                    });
    //                }

    //                sortHelper(_exhibitions);
    //            return _exhibitions;
    //        }
    //    } else { // if has cache
    //        if (callback) {
    //            sortHelper(_exhibitions);
    //            callback(_exhibitions);

    //        } else {
    //            sortHelper(_exhibitions);
    //            return _exhibitions;
    //        }
    //    }

    //}

    /**
     * Soft delete a hotspot by deleting both the hotspot linq and doq files
     */
    function deleteHotspot(linqID, doqID, onSuccess, onFail, onError) {
        // _db.deleteLinq(linqID);
        var url = _db.getSecureURL() + "/?Type=Linq&Guid=" + linqID + "&token=" + TAG.Auth.getToken();

        var request = $.ajax({
            type: 'DELETE',
            url: url,
            async: true,
            success: function (data) {
                url = _db.getSecureURL() + "/?Type=Doq&Guid=" + doqID + "&token=" + TAG.Auth.getToken();

                $.ajax({
                    type: 'DELETE',
                    url: url,
                    async: true,
                    success: function (data) {
                        onSuccess && onSuccess();
                    },
                    error: function () {
                        if (request.statusText === "Unauthorized")
                            checkAuth(function () { deleteHotspot(linqID, doqID, onSuccess, onFail, onError); }, onFail);
                        else
                            onError && onError();
                    },
                });
            },
            error: function () {
                if (request.statusText === "Unauthorized")
                    checkAuth(function () { deleteHotspot(linqID, doqID, onSuccess, onFail, onError); }, onFail);
                else
                    onError && onError();
            }
        });
    }

    // get URL - see worktop.database.js
    function getURL() {
        return _db.getURL();
    }
    // get URL - see worktop.database.js
    function getSecureURL() {
        return _db.getSecureURL();
    }

    function getFileURL() {
        return _db.getFileURL();
    }

    // set URL - see worktop.databse.js
    function setURL(url) {
        _db.setURL(url);
    }

    // create a new exhibition
    function createNewExhibition(onSuccess, onFail, onError) {
        _exhibitionDirty = true;
        if (onSuccess) {
            var request = $.ajax({
                url: _db.getSecureURL() + "/?Type=CreateExhibition&Guid=" + TAG.Worktop.Database.getCreatorID() + "&token=" + TAG.Auth.getToken(),
                type: "PUT",
                dataType: "text",
                async: true,
                success: function (data) {
                    var result;
                    if (request.responseText) {
                        try {
                            result = new Worktop.Doq(request.responseText);
                            onSuccess && onSuccess(result);
                        }
                        catch (err) {
                            onError && onError();
                        }
                    } else {
                        checkAuth(function () { createNewExhibition(onSuccess, onFail, onError); }, onFail);
                    }
                },
                error: function () {
                    if (request.statusText === "Unauthorized")
                        checkAuth(function () { createNewExhibition(onSuccess, onFail, onError); }, onFail);
                    else
                        onError && onError();
                }
            });
        }
        else {
            _db.createNewExhibition();
        }
    }

    // Non-async version depricated, always give an onSuccess function
    //function createTour(onSuccess, onFail, onError) {
    //    _db.putTour(null, { success: onSuccess, unauth: onFail, error: onError }, true);
    //    return;
    //    setDirty("Tour");
    //    if (onSuccess) {
    //        _db.createTour(onSuccess, onFail, onError);
    //    } else {
    //        return _db.createTour();
    //    }
    //}

    // get all artwork
    function getAllArtworks(callback) {
        _db.getArtworks({ success: callback });
        return;
        _artworkDirty = true;
        if (callback) {

            // TODO: will run if(_artworkDirty){} immediately 
            if (!_db.isUseServer()) {

                var request = $.ajax({
                    url: 'testXML/AllArtworks.xml',
                    dataType: "text",
                    cache: false, // forces browser to not cache the data
                    async: true,
                    success: function () {
                        if (request.responseText) {
                            _artworks = new Worktop.Doq(request.responseText);
                            callback(_artworks);
                        }

                    },
                    error: function (err) {
                    }
                });
            }

            if (_artworkDirty) {
                var doq;
                var url = getURL() + "/?Type=DoqsInFolder&Name=Artworks";

                var request = $.ajax({
                    url: url,
                    dataType: "text",
                    cache: false, // forces browser to not cache the data
                    async: true,
                    success: function () {
                        if (request.responseText) {
                            _artworks = new Worktop.Doq(request.responseText);
                            _artworkDirty = false;
                            callback(_artworks);
                        }
                    },
                    error: function (err) {
                    }
                });
            } else {
                callback(_artworks);
            }
        } else {

            if (!_db.isUseServer()) {

                var request = $.ajax({
                    url: 'testXML/AllArtworks.xml',
                    dataType: "text",
                    cache: false, // forces browser to not cache the data
                    async: false,
                    error: function (err) {
                        return;
                    }
                });
                if (request.responseText) {
                    try {
                        _artworks = new Worktop.Doq(request.responseText);
                    }
                    catch (err) {
                        console.log("error in getAllArtworks: " + err);
                        getAllArtworks(callback);
                    }
                }
                return _artworks;
            }

            if (_artworkDirty) {
                var doq;
                var url = getURL() + "/?Type=DoqsInFolder&Name=Artworks";

                var request = $.ajax({
                    url: url,
                    dataType: "text",
                    cache: false, // forces browser to not cache the data
                    async: false,
                    error: function (err) {
                        return;
                    }
                });

                if (request.responseText) {
                    try {
                        _artworks = new Worktop.Doq(request.responseText);
                    }
                    catch (err) {
                        console.log("error in getAllArtworks: " + err.message);
                        getAllArtworks(callback);
                    }
                }
                _artworkDirty = false;
            }
            return _artworks;
        }
    }

    // get a specified doq by its GUID
    function getDoqByGuid(guid, flag, callback, error) {
        //any reason why this wasn't returning anything before?
        if (callback) {
            var url;
            if (_db.useServer)
                url = _db.getURL() + "/?Type=Doq&Guid=" + guid;
            else
                url = "testXML/" + guid + ".xml";

            var request = $.ajax({
                url: url,
                dataType: "text",
                cache: false, // forces browser to not cache the data
                async: true,
                success: function () {
                    if (request.responseText) {
                        //try {
                        var newDoq = new Worktop.Doq(request.responseText);
                        callback(newDoq, flag);
                        //}
                        //catch (err) {
                        //console.log("bad xml response in getDoqByGuid: " + err.message);
                        // getDoqByGuid(guid, flag, callback);
                        //}
                    }
                },
                error: function (err) {
                    console.log(err);
                    error && error();
                }
            });
        }
        else
            return _db.getDoqByGUID(guid);
    }

    // get doq by name - see Worktop.Database.js
    function getDoqByName(name) {
        return _db.getDoqByName(name);
    }

    function updateCache(guid, xml) {

        _cacheXML[guid] = xml;
    }

    function getXML(guid) {
        return _cacheXML[guid];
    }

    /* 
     * The pushXML(...) method takes an XML object and a GUID. It then parses the XML
     * object, converts it into text, and then sends the text-based XML to the server.
     * If the XML was valid and accepted by the server, the method success() is called.
     */
    function pushXML(data, guid, type, onSuccess, onFail, onError) {

        setDirty(type);

        var xmlstr = "";
        if (typeof data == 'string') {
            xmlstr = data;
        } else {
            xmlstr = parseXML(data.childNodes[0], xmlstr);
        }
        var url = _db.getSecureURL() + "/?Type=Doq&Guid=" + guid + "&token=" + TAG.Auth.getToken();

        var isAsync = !!onSuccess;

        $.ajax({
            type: 'POST',
            url: url,
            data: xmlstr,
            async: isAsync,
            success: function () {
                onSuccess && onSuccess();
            },
            error: function (err, err2, status) {
                if ($("#dialogOverlay").length > 0) {
                    $("#dialogOverlay").hide();
                }
                if (status === "Unauthorized") {
                    checkAuth(function () { pushXML(data, guid, type, onSuccess, onFail, onError); }, onFail);
                }
                else
                    onError && onError();
            },
            dataType: 'text'
        });
    }

    /* 
 * The pushLinq(...) method takes an XML object and a GUID. It then parses the XML
 * object, converts it into text, and then sends the text-based XML to the server.
 * If the XML was valid and accepted by the server, the method success() is called.
 */
    function pushLinq(data, guid, type, onSuccess, onFail, onError) {

        setDirty(type);

        var xmlstr = "";
        if (typeof data == 'string') {
            xmlstr = data;
        } else {
            xmlstr = parseXML(data.childNodes[0], xmlstr);
        }
        var url = _db.getSecureURL() + "/?Type=Linq&Guid=" + guid + "&token=" + TAG.Auth.getToken();

        $.ajax({
            type: 'POST',
            url: url,
            data: xmlstr,
            async: false,
            success: function () {
                onSuccess && onSuccess();
            },
            error: function (err, err2, status) {
                if (status === "Unauthorized")
                    checkAuth(function () { pushLinq(data, guid, type, onSuccess, onFail, onError); }, onFail);
                else
                    onError && onError();
            },
            dataType: 'text'
        });
    }
    /* 
     * The parse(...) method a string   . It then parses the XML
     * object, converts it into text, and then sends the text-based XML to the server.
     * If the XML was valid and accepted by the server, the method success() is called.
     */
    function parseXML(data, xmlstring) {
        if (data.tagName) {
            xmlstring = xmlstring.concat("<" + data.tagName);
            for (var i = data.attributes.length - 1; i >= 0; i--) {
                xmlstring = xmlstring.concat(" " + data.attributes[i].nodeName + "=\"" + data.attributes[i].nodeValue + "\"");
            }
            xmlstring = xmlstring.concat(">");

            for (var i = 0; i < data.childNodes.length; i++) {
                xmlstring = parseXML(data.childNodes[i], xmlstring);
            }

            xmlstring = xmlstring.concat("</" + data.tagName + ">");
        }
        else {
            xmlstring = xmlstring.concat(data.data);
        }
        return xmlstring;
    }

    function createEmptyDoq(getMainCreatorID) {
        return _db.createEmptyDoq(_main.CreatorID);
    }

    function createLinq(guid1, guid2) {
        return _db.createLinq();
    }

    // create image hotspot
    //function createHotspot(creatorID, artworkGUID, onSuccess, onFail, onError) {
    //    if (onSuccess) {
    //        var url = _db.getSecureURL() + "/?Type=CreateHotspot&Guid=" + creatorID + "&Guid2=" + artworkGUID + "&token=" + LADS.Auth.getToken();

    //        var request = $.ajax({
    //            url: url,
    //            type: "PUT",
    //            dataType: "text",
    //            async: true,
    //            success: function () {
    //                onSuccess && onSuccess(true, request.responseXML);
    //            },
    //            error: function () {
    //                if (request.statusText === "Unauthorized")
    //                    checkAuth(function () { createHotspot(creatorID, artworkGUID, onSuccess, onFail, onError); }, onFail);
    //                else
    //                    onError && onError();
    //            },
    //        });

    //    }
    //    else
    //    return _db.createHotspot(creatorID, artworkGUID, onSuccess, onFail, onError);
    //}

    function getCreatorID() {
        return _main.CreatorID;
    }

    // get parent doq
    function parentDoq(guid1, guid2) {
        var url = _db.getURL() + "/?Type=AddParent&Guid=" + guid1 + "&Guid2=" + guid2;

        $.ajax({
            type: 'POST',
            url: url,
            dataType: 'text'
        });

        setDirty("Artwork");
    }

    // set artwork dirty 
    function setArtworkDirty() {
        _artworkDirty = true;
    }

    // bool for dirty artwork
    function isArtworkDirty() {
        return _artworkDirty;
    }

    // upload image
    //function uploadImage(dataurl, onSuccess, onFail, onError) {
    //    var location = _db.uploadImage(dataurl, getCreatorID(), onSuccess, onFail, onError);
    //    return location;
    //}

    function checkAuth(onSuccess, onCancel) {
        TAG.Auth.authenticate(onSuccess, onCancel);
    }

    // get all tours
    function getAllTours(callback) {
        _db.getTours({ success: callback });
        return;
        // bmost: Temporarily making it so that tours don't get cached.
        // If a curator changes a tour on one machine, other machines
        // will have the old tour cached.
        _tourDirty = true;
        if (_tourDirty) {
            if (callback) {
                var name = "Tour";
                var doq, tours;
                _tours = [];
                var url = _db.getURL() + "/?Type=DoqsInFolder&Name=" + name;
                var request = $.ajax({
                    url: url,
                    dataType: "text",
                    cache: false, // forces browser to not cache the data
                    async: true,
                    success: function (data) {
                        _tours = [];
                        if (request.responseText) {
                            try {
                                tours = new Worktop.Doq(request.responseText);

                                if (tours && tours[0]) {
                                    $.each(tours, function (i, t) {
                                        _tours.push(t);
                                    });
                                    _tourDirty = false;
                                } else {
                                    _tourDirty = true;
                                }
                                sortHelper(_tours);
                                callback(_tours);
                            } catch (e) {
                                callback([]);
                            }
                        }
                    },
                    error: function (err) {
                        console.log("ajax fail in getAlltours");
                    }
                });

            }
            else {
                _tours = [];
                var tours = _db.getDoqsInFolderByName("Tour");
                if (tours && tours[0]) {
                    $.each(tours, function (i, t) {
                        _tours.push(t);
                    });
                }
                sortHelper(_tours);
                return _tours;
            }
        } else {
            if (callback) {
                callback(_tours);
            } else {
                return _tours;
            }
        }
    }

    function getAllFeedback(onSuccess, onError) {
        _db.getFeedback({ success: onSuccess, error: onError });
        return;
        var url = _db.getURL() + "/?Type=DoqsInFolder&Name=Feedback";
        var request = $.ajax({
            url: url,
            dataType: "text",
            cache: false, // forces browser to not cache the data
            async: true,
            success: function (data) {
                if (request.responseText) {
                    try {
                        feedback = new Worktop.Doq(request.responseText);
                        onSuccess(feedback[0] ? feedback : []);
                    } catch (e) {
                        console.log(e.message);
                        onError && onError();
                    }
                }
            },
            error: function (err) {
                console.log("ajax fail in getAllFeedback");
                onError && onError();
            }
        });
    }

    function testIp(onSuccess, onError) {
        var name = "Tour";
        var doq, tours;
        _tours = [];
        var url = _db.getURL() + "/?Type=DoqsInFolder&Name=" + name;
        var request = $.ajax({
            url: url,
            dataType: "text",
            cache: false, // forces browser to not cache the data
            async: true,
            success: function (data) {
                onSuccess();
            },
            error: function (err) {
                onError();
            }
        });

    }



    //function checkToken(token, onSuccess, onFail, onError) {
    //    var url = _db.getSecureURL() + "/?Type=CheckToken&Name=" + token;
    //    var request = $.ajax({
    //        type: 'HEAD',
    //        url: url,
    //        async: true,
    //        cache: false,
    //        success: function () {
    //            if (request.statusText === "OK") {
    //                onSuccess && onSuccess();
    //            }
    //            else {
    //                onFail && onFail();
    //            }
    //        },
    //        error: function (err) {
    //            if (request.statusText === "Unauthorized") {
    //                onFail && onFail();
    //            } else {
    //                onError && onError();
    //            }
    //        }
    //    });
    //}

    // use this at some point to validate that the inputted ip address is actually the ip address for a TAG server
    // we can have an array of valid ips on the server
    function validateIp(ip, onSuccess, onError) {
        var url = _db.getURL() + "/?Type=IP&Name=" + ip; // type=IP -- deal with this in server.cs ?
        var request = $.ajax({
            type: 'HEAD',
            url: url,
            async: true,
            password: password,
            success: function () {
                if (request.statusText === "Authorized") {
                    onSuccess();
                }
                else {
                    onError();
                }
            },
            error: function (err) {
                if (request.statusText === "Authorized") {
                    onSuccess();
                }
                else {
                    onError();
                }
            }
        });
    }

    /*
        Change the server to newAddress
        If oldPass is supplied then authoring password for the old
        server is checked
        onConnect is called on successful connection to the new server
        onFail is called otherwise
        After this function is successful everything is updated to use the new server,
        but the current page will need to be reloaded
    */
    function changeServer(newAddress, oldPass, onConnect, onFail) {
        newAddress = TAG.Util.formatAddress(newAddress);
        if (oldPass) {
            getSalt(function (salt) {
                getAuth(oldPass, salt, checkServer, onFail, onFail);
            }, onFail);
        } else {
            checkServer();
        }
        function checkServer() {
            var connectionTimeout,
                timedOut;

            asyncRequest('GET', 'CheckVersion', null, null, { success: success, error: error }, false, null, 'http://' + newAddress + ':8080');
            function success(jqXHR, ajaxCall) {
                if(!timedOut) {
                    clearTimeout(connectionTimeout);
                    var version = jqXHR.statusText;
                    var mainID = jqXHR.responseText;
                    localStorage.ip = newAddress;
                    _db = new Worktop.Database(mainID);
                    onConnect && onConnect();
                }
            }
            function error() {
                if(!timedOut) {
                    clearTimeout(connectionTimeout);
                    onFail && onFail();
                }
            }

            connectionTimeout = setTimeout(function() {
                timedOut = true;
                onFail && onFail();
            }, 10000); // 10 second timeout to show error message
        }
    }

    // set specified screen to dirty
    function setDirty(type) {
        switch (type) {
            case "Exhibition":
            case "Exhibitions":
                _exhibitionDirty = true;
                break;
            case "Artwork":
                _artworkDirty = true;
                break;
            case "Tour":
                _tourDirty = true;
                break;
        }
    }

    function hash(n) {
        return ((0x0000FFFF & n) << 16) + ((0xFFFF0000 & n) >> 16);
    }

    function fixPath(path) {
        if (path) {
            if (path.indexOf('blob:') !== -1) {
                return path;
            } else if (path.indexOf('http') !== -1) {
                path = path.replace(/http.?.?\/\/[^\/]*/, '');
            }
            if (path.indexOf('/') !== 0) {
                path = '/' + path;
            }
            return _db.getFileURL() + path;
        }
    }

    function fixFontFilePath(path) {
        if (path) {
            if (path.indexOf('/') !== 0) path = '/' + path;
            return path;
        }
    }

    function deprecated(fn) {
        var name = "";
        try {
            name = fn.toString().split('function ')[1].split('(')[0].trim() + ' ';
        } catch (exception) {
            console.log(exception);
        }
        return function () {
            console.log("Warning: Call to deprecated function " + name + "in TAG.Worktop.Database");
            var passedArgs = [];
            for (var i = 0; i < arguments.length; i++) {
                passedArgs[i] = arguments[i];
            }
            return fn.apply(null, passedArgs);
        }
    }
})();
// JavaScript source code
TAG.Util.makeNamespace("TAG.Layout.WillVideo");

/**
 * TAG video player -- a wrapper around the standard html5 video element
 * @class TAG.Layout.VideoPlayer
 * @constructor
 * @param {Doq} videoSrc     the doq representing our video
 * @param {Doq} collection   the parent collection of this video
 * @param {Object} prevInfo  some info about where we came from on the collections page:
 *                   .artworkPrev     string representing where we came from
 *                   .prevScroll      value of the scrollbar from new catalog page
 * @return {Object}          the object representing public information about the video page
 *                           (at the moment, just the root of the DOM)
 */
TAG.Layout.WillVideo = function (videoSrc, collection, prevInfo) {
    "use strict";

    var that = {};

    var root = TAG.Util.getHtmlAjax('WillVideo.html'),
        video = root.find('#video'),
        sourceMP4,
        sourceWEBM,
        sourceOGV,
        videoElt = video[0],
        DURATION = parseFloat(videoSrc.Metadata.Duration),
        bottomBar = root.find('#bottomBar'),
        topBar = root.find('#topBar'),
        play = root.find('#playPauseButton'),
        vol = root.find('#videoControlsButton'),
        loop = root.find('#loopButton'),
        sliderPoint = root.find("#sliderPoint"),
        sliderContainer = root.find('#sliderContainer'),
        currTime,
        poster = (videoSrc.Metadata.Thumbnail && !videoSrc.Metadata.Thumbnail.match(/.mp4/)) ? TAG.Worktop.Database.fixPath(videoSrc.Metadata.Thumbnail) : '',
        source = TAG.Worktop.Database.fixPath(videoSrc.Metadata.Source),
        locked = TAG.Worktop.Database.getLocked(),     //Check for locked
        sourceWithoutExtension = source.substring(0, source.lastIndexOf('.')),
        lastStop = 0,
        lastPauseTime = Date.now() / 1000,
        lastError,
        errorDiv = $(document.createElement('div')).attr('id', 'errorDiv'),
        errorAppended = false,
        currentTimeDisplay = root.find('#currentTimeDisplay'),
        backButton = root.find('#backButton'),
        linkButton = root.find('#linkButton'),
        linkButtonContainer = root.find('#linkContainer');

    errorDiv.text("There was an error during video playback, please wait while we restart the video...")
            .css({
                'left': '20%',
                'top': '50%',
                'position': 'relative',
                'font-size': '120%',
            });

    // UNCOMMENT IF WE WANT IDLE TIMER IN Video PLAYER
    // idleTimer = TAG.Util.IdleTimer.TwoStageTimer();
    // idleTimer.start();

    // init the video player status
    initPage();
    timeToZero();
    initVideoPlayHandlers();

    /**
     * Return to the collections page from the video player.
     * @method goBack
     */
    function goBack() {
        videoElt.pause();
        video.attr('src', "");

        // UNCOMMENT IF WE WANT IDLE TIMER IN TOUR PLAYER
        // idleTimer.kill();
        // idleTimer = null;

        var backInfo = { backArtwork: videoSrc, backScroll: prevScroll };
        var collectionsPage = TAG.Layout.CollectionsPage({
            backScroll: prevScroll,
            backArtwork: videoSrc,
            backCollection: collection,
            backTag: prevTag,
            backMult: prevMult,
            twoDeep: true,
            hideKeywords: true,
            backPreviewPos: prevPreviewPos,
            backSearch: prevSearch
        });

        // collectionsPage.getRoot().css({ 'overflow-x': 'hidden' }); // TODO should be default in .styl file
        TAG.Util.UI.slidePageRightSplit(root, collectionsPage.getRoot(), function () {
            artworkPrev = "catalog";
            if (!IS_WINDOWS) {
                if (collectionsPage.getState().exhibition === collection) {
                    collectionsPage.showArtwork(videoSrc, prevMult && prevMult)();
                }
            }
        });

        currentPage.name = TAG.Util.Constants.pages.COLLECTIONS_PAGE;
        currentPage.obj = collectionsPage;
    }

    function loop() {

    }

    /**
     * Take video to time 0 and pause.
     * @method timeToZero
     */
    function timeToZero() {
        if (videoElt.currentTime !== 0) {
            videoElt.currentTime = 0;
            videoElt.pause();
        }
        play.attr('src', tagPath + 'js/rin/web/systemResources/themeresources/images/play.png');
    }

    /**
     * Play video and change play button image
     * @method playVideo
     */
    function playVideo() {
        doNothing('PLAY VID');
        errorDiv.remove();
        errorAppended = false;
        videoElt.play();
        topBar.css('display', 'none');
        play.attr('src', tagPath + 'js/rin/web/systemResources/themeresources/images/pause.png');
        TAG.Telemetry.recordEvent("VideoPlayer", function (tobj) {
            tobj.current_video = videoSrc.Identifier;
            tobj.collection = prevExhib.Identifier;
            tobj.interaction = "play_video";
        });
    }

    /**
     * Pause video and change play button image
     * @method pauseVideo
     */
    function pauseVideo() {
        doNothing('PAUSE VID');
        videoElt.pause();
        lastStop = videoElt.currentTime;
        lastPauseTime = Date.now() / 1000;
        topBar.css('display', 'inline');
        play.attr('src', tagPath + 'js/rin/web/systemResources/themeresources/images/play.png');
        TAG.Telemetry.recordEvent("VideoPlayer", function (tobj) {
            tobj.current_video = videoSrc.Identifier;
            tobj.collection = prevExhib.Identifier;
            tobj.interaction = "pause_video";
        });
    }

    /**
     * Play or pause video depending on its current state
     * @method toggleVideo
     */
    function toggleVideo() {
        videoElt.paused === true ? playVideo() : pauseVideo();
    }

    /**
     * Set up handlers for video element and play/pause button
     * @method initVideoPlayHandlers
     */
    function initVideoPlayHandlers() {
        video.on('loadedmetadata', initSeekHandlers);

        // set up play button
        play.attr('src', tagPath + 'js/rin/web/systemResources/themeresources/images/play.png');
        play.on('click', toggleVideo);

        // set up mute button
        vol.attr('src', tagPath + 'js/rin/web/systemResources/themeresources/images/volume.png');
        $(vol).on('click', function () {
            TAG.Telemetry.recordEvent("VideoPlayer", function (tobj) {
                tobj.current_video = videoSrc.Identifier;
                tobj.collection = prevExhib.Identifier;
                tobj.interaction = "video_volume";
            });
            videoElt.muted = !videoElt.muted;
            vol.css("opacity", (videoElt.muted ? ".5" : "1"))
        });

        // when video ends, return to collections page after a short delay
        video.on('ended', function () {
            setTimeout(goBack, 300);
        });

        // set up loop button
        loop.on('click', function () {

        });

        // Update the seek bar as the video plays
        video.on("timeupdate", function () {
            var value,
                minutes,
                seconds,
                adjMin;

            // Calculate the slider value and update the slider value
            value = ($('#sliderContainer').width() / videoElt.duration) * videoElt.currentTime;
            sliderPoint.css('width', value);

            minutes = Math.floor(videoElt.currentTime / 60);
            seconds = Math.floor(videoElt.currentTime % 60);
            if (String(minutes).length < 2) {
                adjMin = '0' + minutes;
            } else {
                adjMin = minutes;
            }
            currentTimeDisplay.text(adjMin + ":" + (seconds < 10 ? "0" : "") + seconds);
        });

        if (!IS_WEBAPP) {
            bottomBar.css({
                'height': '7%',
                'background-color': "rgba(0, 0, 0, .5)"
            });
            sliderPoint.css('background-color', 'white');

            sliderContainer.css({
                "border": "1px solid rgb(250,250,250)",
                "width": "70%",
                "left": '15%',
                "height": "20%",
                "bottom": "40%"
            })



        }
    }

    /**
     * Set up handlers for the seekbar
     * @method initSeekHandlers
     */
    function initSeekHandlers() {
        sliderContainer.on('mousedown', function (evt) {
            var time = videoElt.duration * (evt.offsetX / $('#sliderContainer').width());
            if (!isNaN(time)) {
                videoElt.currentTime = time;
                lastStop = videoElt.currentTime;
            }
        });

        // set up mousedown handler for the seekbar
        sliderContainer.on('mousedown', function (e) {
            e.stopPropagation();
            var origPoint = e.pageX,
                origTime = videoElt.currentTime,
                timePxRatio = DURATION / sliderContainer.width(), // sec/px
                currPx,
                minutes,
                seconds;

            currTime = Math.max(0, Math.min(videoElt.duration, origTime));
            currPx = currTime / timePxRatio;
            minutes = Math.floor(currTime / 60);
            seconds = Math.floor(currTime % 60);

            if (("" + minutes).length < 2) {
                minutes = "0" + minutes;
            }
            TAG.Telemetry.recordEvent("VideoPlayer", function (tobj) {
                tobj.current_video = videoSrc.Identifier;
                tobj.collection = prevExhib.Identifier;
                tobj.interaction = "video_seek";
            });
            // set up mousemove handler now that mousedown has happened
            $('body').on('mousemove.seek', function (evt) {
                var currPoint = evt.pageX,
                    timeDiff = (currPoint - origPoint) * timePxRatio;

                currTime = Math.max(0, Math.min(videoElt.duration, origTime + timeDiff));
                currPx = currTime / timePxRatio;
                minutes = Math.floor(currTime / 60);
                seconds = Math.floor(currTime % 60);

                if (("" + minutes).length < 2) {
                    minutes = "0" + minutes;
                }

                // Update the video time and slider values
                if (!isNaN(currTime)) {
                    $('#currentTimeDisplay').text(minutes + ":" + (seconds < 10 ? "0" : "") + seconds);
                    videoElt.currentTime = currTime;
                    sliderPoint.css('width', currPx);
                }

            });

            // when the mouse is released or leaves iframe, remove the mousemove handler and set time
            $('body').on('mouseup.seek mouseleave.seek', function () {
                $('body').off('mousemove.seek');
                $('body').off('mouseup.seek');
                $('body').off('mouseleave.seek');
                $('#currentTimeDisplay').text(minutes + ":" + (seconds < 10 ? "0" : "") + seconds);
                videoElt.currentTime = currTime;
                sliderPoint.css('width', currPx);
            });
        });
    }

    /**
     * Initialize misc parts of the video player
     * @method initPage
     */
    function initPage() {
        idleTimer && idleTimer.kill();
        idleTimer = null;
        // set attributes of video element
        video.attr({
            // poster: poster,
            fileName: sourceWithoutExtension,
            identifier: videoSrc.Identifier,
            controls: false,
            preload: 'none',
        });

        //Adding sources for the video file
        sourceMP4 = sourceWithoutExtension + ".mp4";
        sourceWEBM = sourceWithoutExtension + ".webm";
        sourceOGV = sourceWithoutExtension + ".ogv";

        //video[0] converts the jQuery object 'video' into an HTML object, allowing us to use innerHTML on it
        //videoElt.innerHTML  = '<source src="' + sourceMP4  + '" type='+"'"+'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'+"'"+'>';
        //videoElt.innerHTML += '<source src="' + sourceWEBM + '" type='+"'"+'video/webm; codecs="vorbis, vp8"'+"'"+'>';
        //videoElt.innerHTML += '<source src="' + sourceOGG  + '" type='+"'"+'video/ogg; codecs="theora, vorbis"'+"'"+'>';
        videoElt.innerHTML = '<source src="' + sourceMP4 + '" type="video/mp4">';
        videoElt.innerHTML += '<source src="' + sourceWEBM + '" type="video/webm">';
        videoElt.innerHTML += '<source src="' + sourceOGV + '" type="video/ogv">';

        //lucy vk- this error handler is a patch for an issue we had with video playback in Chrome.
        //after pausing and then restarting the video, Chrome would throw a network error. This also happens when 
        //trying to seek to times in the video that are not loaded.  For now, 
        //when that error is thrown, we catch it and then reset the video sources and reload the video and attempt to
        //start playback from the time at which the error was thrown
        videoElt.onerror = function (err) {
            switch (err.target.error.code) {
                case err.target.error.MEDIA_ERR_NETWORK:
                    doNothing("caught network error");
                    initPage();
                    videoElt.load();
                    var timeOffset = Date.now() / 1000 - lastPauseTime;
                    //if playback fails after reloading the video, we display an error message and then wait
                    //3 seconds before replaying the video from the beginning. The timeout and message 
                    //are for the benefit of the person watching the video. The message also displays when seeking to an unloaded time
                    if (lastError === lastStop) {
                        if (!errorAppended) {
                            root.append(errorDiv);
                            errorAppended = true;
                        }
                        setTimeout(function () {
                            doNothing("couldn't restart, waited then tried again");
                            initPage();
                            videoElt.load();
                            playVideo();
                        }, 3000);
                        return;
                    }
                    lastError = lastStop;
                    videoElt.currentTime = lastStop + timeOffset;
                    playVideo();
                    break;
            }
        }
        // set text of time display
        currentTimeDisplay.text("00:00");

        // set up back button
        if (locked !== videoSrc.Identifier) {
            backButton.attr('src', tagPath + 'images/icons/Back.svg');
        } else {
            backButton.hide();
        }
        backButton.on('mousedown', function () {
            TAG.Util.UI.cgBackColor("backButton", backButton, false);
            TAG.Telemetry.recordEvent("VideoPlayer", function (tobj) {
                tobj.current_video = videoSrc.Identifier;
                tobj.collection = prevExhib.Identifier;
                tobj.interaction = "back_button";
            });
        });
        backButton.on('mouseleave', function () {
            TAG.Util.UI.cgBackColor("backButton", backButton, true);
        });

        backButton.on('click', goBack);

        //add bottom fade
        bottomBar.css({

        });

        if (IS_WEBAPP) {
            linkButton.attr('src', tagPath + 'images/link.svg');
            linkButton.on('click', function () {
                var linkOverlay = TAG.Util.UI.showPageLink(urlToParse, {
                    tagpagename: 'video',
                    tagguid: videoSrc.Identifier,
                    prevpage: prevExhib.Identifier
                });

                root.append(linkOverlay);
                linkOverlay.fadeIn(500, function () {
                    linkOverlay.find('.linkDialogInput').select();
                });
            });
        } else {
            linkButtonContainer.remove();
        }
    }

    /**
     * Return the root of the video page
     * @method getRoot
     * @return {jQuery object}   root of the video page
     */
    function getRoot() {
        return root;
    }
    that.getRoot = getRoot;

    return that;
};

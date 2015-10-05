// JavaScript source code
TAG.Util.makeNamespace("TAG.Layout.WillVideo");

/**
 * TAG video player -- a wrapper around the standard html5 video element for the Nobel Exhibit
 * @class TAG.Layout.WillVideo
 * @return {Object}          the object representing public information about the video page
 *                           (at the moment, just the root of the DOM)
 */
TAG.Layout.WillVideo = function () {
    "use strict";

    var that = {};

    var root = TAG.Util.getHtmlAjax('WillVideo.html'),
        video = root.find('#video'),
        touchToExplore = root.find('#touchToExplore'),
        videoElt = video[0],
        currTime;
    
    touchToExplore.text("TOUCH TO EXPLORE");
    

    video.click(function () {
        loadWill();
    });
    touchToExplore.click(function () {
        loadWill();
    });

    // init the video player status
    initPage();
    timeToZero();


    /**
     * Take video to time 0 and pause.
     * @method timeToZero
     */
    function timeToZero() {
        if (videoElt.currentTime !== 0) {
            videoElt.currentTime = 0;
            videoElt.pause();
        }
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
            controls: false,
            preload: 'none',
        });
        videoElt.innerHTML = '<source src="' + tagPath + 'images/testvid.mp4' + '" type="video/mp4">';
    }

    function loadWill() {
        root.remove();
        var will = TAG.Layout.NobelWill(1);
    }

    /**
     * Return the root of the video page
     * @method getRoot
     * @return {jQuery object}   root of the video page
     */
    function getRoot() {
        return root;
    }
    function playVid() {
        videoElt.play();
    }
    that.getRoot = getRoot;
    that.playVid = playVid;

    return that;
};

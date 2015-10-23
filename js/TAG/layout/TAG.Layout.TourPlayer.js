TAG.Util.makeNamespace("TAG.Layout.TourPlayer");

/**
 * Player for RIN tours
 * @param tour         RIN tour in Javascript object (pre-parsed from JSON)
 * @param exhibition   exhibition we came from (if any) (doq object)
 * @param prevInfo   object containing previous page info 
 *    artworkPrev      value is 'artmode' when we arrive here from the art viewer
 *    prevScroll       value of scrollbar from new catalog page
 * @param artmodeOptions      options to pass into TAG.Layout.ArtworkViewer
 * @param tourObj      the tour doq object, so we can return to the proper tour in the collections screen
 * @param idletimer    the idle timer 
 * @param nobel
 */
TAG.Layout.TourPlayer = function (tour, exhibition, prevInfo, artmodeOptions, tourObj, idletimer,tourNameString) {
    "use strict";
    var artworkPrev;
	var prevExhib = exhibition;
    var prevSearch = prevSearch;
    var prevS;

    var self = this;
    var rinPath = IS_WINDOWS ? tagPath + 'js/WIN8_RIN/web' : tagPath + 'js/RIN/web';
    var ispagetoload = pageToLoad && (pageToLoad.pagename === 'tour');
    this.iteTour = tour;
    var tagContainer = $('#tagRoot');
    var initialOverlay

    

    var player,
        root = TAG.Util.getHtmlAjax('TourPlayer.html'),
        rinPlayer = root.find('#ITEContainer'),
        backButtonContainer = root.find('#backButtonContainer'),
        backButton = root.find('#backButton'),
        linkButtonContainer = root.find('#linkContainer'),
        linkButton = root.find('#linkButton'),
        overlayOnRoot = root.find('#overlayOnRoot'),
        bigThumbnailContainer = root.find('#bigThumbnailContainer'),
        bigThumbnail = root.find('#bigThumbnail'),
        bigPlayButton = root.find('#bigPlayButton'),
        w = $('#tagRoot').width(),
        h = $('#tagRoot').height();
    
    var cancelLoad = false;

    if (w / h > 16 / 9) { // make sure player is 16:9
        root.css({
            'width': h * 16 / 9 + 'px',
            'left': (w - h * 16 / 9) / 2 + 'px'
        });
        rinPlayer.css({
            width: root.css('width'),
            height: h + 'px'
        });
    } else if (w / h <= 16 / 9) {
        root.css({
            'height': w * 9 / 16 + 'px',
            'top': (h - w * 9 / 16) / 2 + 'px'
        });
        rinPlayer.css({
            width: w + 'px',
            height: root.css('height')
        })
    }
    
    // UNCOMMENT IF WE WANT IDLE TIMER IN TOUR PLAYER
    // idleTimer = TAG.Util.IdleTimer.TwoStageTimer();
    // idleTimer.start();
    idleTimer && idleTimer.kill();
    //idleTimer = null;
    backButton.attr('src', tagPath+'images/Back.png');
    backButton.css('width', '7.5%');

    //clicked effect for back button
    backButton.on('mousedown', function(){
        TAG.Util.UI.cgBackColor("backButton", backButton, false);
    });
    backButton.on('mouseleave', function () {
        TAG.Util.UI.cgBackColor("backButton", backButton, true);
    });

    backButton.on('click', goBack);
    backButtonContainer.on('click', goBack);

    var prevpagelink;
    if(prevExhib===null){
        prevpagelink = null;
    }else{
        prevpagelink = prevExhib.Identifier
    }

    // if(IS_WEBAPP) {
    //     linkButton.attr('src', tagPath+'images/link.svg');
    //     linkButton.on('click', function() {
    //         var linkOverlay = TAG.Util.UI.showPageLink(urlToParse, {
    //             tagpagename: 'tour',
    //             tagguid: tourObj.Identifier,
    //             prevpage: prevpagelink,
    //             tagonlytour: false
    //         });

    //         root.append(linkOverlay);
    //         linkOverlay.fadeIn(500, function() {
    //             linkOverlay.find('.linkDialogInput').select();
    //         });
    //     });
    // } else {
        linkButtonContainer.remove();
    // }

    if(ispagetoload) {
        pageToLoad.pagename = '';
        if(pageToLoad.onlytour) {
            backButtonContainer.remove();
            linkButtonContainer.remove();
        } else {
            backButtonContainer.css('display', 'none');
            linkButtonContainer.css('display', 'none');
        }
        if(tourObj && tourObj.FilePath) {
            bigThumbnail.attr('src', TAG.Layout.Spoof().fixPath(tourObj.FilePath));
            bigPlayButton.attr('src', tagPath + 'images/icons/Play.svg');
            bigThumbnailContainer.css('display', 'block');

            bigPlayButton.on('click', startTour);
            bigThumbnail.on('click', startTour);
        }
    }

    /**
     * Simulate a click on the RIN play button. Used by tour embedding code.
     * 
     * bleveque: I wrote, but strongly dislike, this. I would prefer to
     * call the click handler directly rather than fake a click event. The handler for 
     * the play button is somewhere in the RIN code; instead of digging
     * for it, calling it, and making sure that it also changes the button
     * element, I decided to do this and wait for ITE to make everything better. 
     *
     * @method startTour
     */
    function startTour() {
        bigThumbnailContainer.remove();
        $('.rin_PlayPauseContainer').find('input').trigger('click');
        if(!pageToLoad.onlytour) {
            backButtonContainer.css('display', 'block');
            linkButtonContainer.css('display', 'block');
        }
    }

    function reloadTourData(data) {
        this.iteTour = data;
    }
    this.reloadTourData = reloadTourData;

    function getTourData() {
        return this.iteTour;
    }
    this.getTourData = getTourData;


    /*
    * I/P:   none
    * show overlay when loading into the tour
    * O/P:   none
    */
    function makeInitialOverlay() {
        initialOverlay = $(TAG.Util.UI.blockInteractionOverlay(1));
        initialOverlay.css({"background-color":"black"})
        initialOverlay.css('display', 'block')
        var infoDiv = $(document.createElement('div'));
        infoDiv.css({
            "color": "white",
            "background-color": "transparent",
            "text-align": "center",
            "top": "59%",
            "display": "block",
            "position": "absolute",
            "font-size": "3em",
            "width": '100%',
            "height": "100%",
            "overflow": "visible",
            "word-wrap": "break-word"
        })
        infoDiv.text("Loading Interactive Tour...");
        infoDiv.attr('id', 'infoDiv')
        /*
        var tourVideoContainer = $(document.createElement('div')).attr('id', 'tourVideoContainer');
        var tourVideo = $(document.createElement('video')).attr('id', 'tourVideo');
        tourVideoContainer.css({
            'background-color': 'black',
            'position': 'absolute',
            'width': '100%',
            'height': '100%',
            'top': '0%',
            'text-align': 'center',
            'z-index': '50002',
        });
        tourVideo.css({
            'position': 'relative',
            'width': '100%',
            'height': '100%',
            'z-index': '1005'
        });
        tourVideo.attr({
            controls: false,
            preload: 'none',
            loop: true
        });
        videoElt = tourVideo[0],
        videoElt.innerHTML = '<source src="' + tagPath + 'images/NW_instruction_video.mov' + '" type="video/mp4">';
        tourVideoContainer.append(tourVideo);
        initialOverlay.append(tourVideoContainer);
        videoElt.play();

        */

        var moreinfoDiv = $(document.createElement('div'));
        moreinfoDiv.css({
            "color": "white",
            "background-color": "transparent",
            "text-align": "center",
            "top": "70%",
            "display": "block",
            "position": "absolute",
            "font-size": "2em",
            "width": '100%',
            "height": "100%",
            "overflow": "visible",
            "word-wrap": "break-word"
        })
        moreinfoDiv.text("Tap on artworks to learn more");
        moreinfoDiv.attr('id', 'moreinfoDiv')

        TAG.Util.showLoading(initialOverlay, '10%', '42.5%', '45%')//to show the loading screen
        initialOverlay.append(infoDiv);
        initialOverlay.append(moreinfoDiv);
        $("#ITEContainer").append(initialOverlay);
        initialOverlay.append($("#backButton"));
        $("#blockInteractionOverlay").css({"background-color":"black"})
    }

    /*
    * I/P:   none
    * hide the overlay when loading into the tour
    * O/P:   none
    */
    function hideInitialOverlay() {
        if (player && player.isInitialLoading() === true) {
            $("#backButtonContainer").append($("#backButton"));
            player.doneInitialLoading()
            TAG.Util.hideLoading(initialOverlay)
            $('#infoDiv').remove();
            $('#moreinfoDiv').remove();
        }
    }
    this.hideInitialOverlay = hideInitialOverlay

    var startPlayback = function () {
        window.ITE = window.ITE || {};
        var testOptions = {
            attachVolume: true,
            attachLoop: true,
            attachPlay: true,
            attachProgressBar: true,
            attachFullScreen: true,
            attachProgressIndicator: true,
            fadeControlskey: false,
            hideControls: true,
            autoPlay: false,
            autoLoop: false,
            setMute: false,
            setInitVolume: 1,
            allowSeek: true,
            setFullScreen: false,
            setStartingOffset: 0,
            setEndTime: NaN
        };
        var nobelDoq = []
        var needed = 0;
        var returned = 0;
        function doqReturn(doq) {
            returned++;
            for (var i = 0 ; i < nobelDoq.length; i++) {
                if (doq && doq.Identifier === nobelDoq[i]) {
                    nobelDoq[i] = doq;
                    break;
                }
            }
        }
        var spoof = TAG.Layout.Spoof();
        for (var i = 0; i < self.iteTour.tracks.length; i++) {
            if (self.iteTour.tracks[i].guid && self.iteTour.tracks[i].guid !== null && self.iteTour.tracks[i].guid !== [] && self.iteTour.tracks[i].guid !== '') {
                nobelDoq.push(self.iteTour.tracks[i].guid);
                spoof.getDoq(self.iteTour.tracks[i].guid, doqReturn,
                    function () {
                        console.log("error getting doq in tourplayer")
                    }, function () {
                        console.log("error getting doq in tourplayer .")
                    });
                needed++;

            }
            else {
                nobelDoq.push(false)
            }
        }

        function pollForData() {
            if (!cancelLoad) {
                if (returned < needed) {
                    setTimeout(pollForData, 250);
                }
                else {
                    donePolling();
                }
            }
        }
        function donePolling() {
            if (!cancelLoad) {
                makeInitialOverlay()
                setTimeout(function () {
                    $("#startPageLoadingOverlay").remove();
                    player = new ITE.Player(testOptions, self, rinPlayer, idleTimer, nobelDoq);
                    player.load(self.getTourData());
                }, 1001)
                return true;
            }
            $("#startPageLoadingOverlay").remove();
            return false;
        }
        pollForData();
        $("#backButton").click(function () {
            cancelLoad = true;
            return false;
        })
    }

    function goBack() {
        if (player) {
            player.pause();
            player.unload();
            player.cancelLoad();
            $(document).data("tourPlaying",false)
        }
        var willRoot = $("#willOverlayRoot")
        willRoot.css({ "background-color": "transparent" })
        willRoot.animate({ left: "100%" }, 1000, "easeInOutQuart", function () {
            willRoot.die()
            willRoot.remove()
        })
    }
    this.goBack = goBack;
    this.getInitialOverlay = function () { return initialOverlay }

    this.getTourName = function () {
        return tourNameString ? tourNameString : ""
    }

    return {
        getRoot: function () {
            return root;
        },
        goBack:this.goBack,
        startPlayback: startPlayback
    };

};

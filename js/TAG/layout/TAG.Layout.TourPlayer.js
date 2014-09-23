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
 */
TAG.Layout.TourPlayer = function (tour, exhibition, prevInfo, artmodeOptions, tourObj) {
    "use strict";
    var artworkPrev;
    var prevScroll = prevInfo.prevScroll;
    var prevPreviewPos = prevInfo.prevPreviewPos;
	var prevExhib = exhibition;
    var prevTag = prevInfo.prevTag;
    var prevMult = prevInfo.prevMult;
    var prevS
    var rinPath = IS_WINDOWS ? tagPath+'js/WIN8_RIN/web' : tagPath+'js/RIN/web';
    var ispagetoload = pageToLoad && (pageToLoad.pagename === 'tour');

    var tagContainer = $('#tagRoot');

    var player,
        root = TAG.Util.getHtmlAjax('TourPlayer.html'),
        rinPlayer = root.find('#rinPlayer'),
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

    if (h * 16 / 9 < w) { // make sure player is 16:9
        root.css({
            'width': h * 16 / 9 + 'px',
            'left': (w - h*16/9)/2 + 'px'
        });
    } else if (w * 9/16 < h) {
        root.css({
            'height': w * 9 / 16 + 'px',
            'top': (h - w * 9 / 16) / 2 + 'px'
        });
    }

    // UNCOMMENT IF WE WANT IDLE TIMER IN TOUR PLAYER
    // idleTimer = TAG.Util.IdleTimer.TwoStageTimer();
    // idleTimer.start();
    idleTimer && idleTimer.kill();
    idleTimer = null;

    backButton.attr('src', tagPath+'images/Back_wshadow.svg');

    //clicked effect for back button
    backButton.on('mousedown', function(){
        TAG.Util.UI.cgBackColor("backButton", backButton, false);
    });
    backButton.on('mouseleave', function () {
        TAG.Util.UI.cgBackColor("backButton", backButton, true);
    });

    backButton.on('click', goBack);

    if(IS_WEBAPP) {
        linkButton.attr('src', tagPath+'images/link.svg');
        linkButton.on('click', function() {
            var linkOverlay = TAG.Util.UI.showPageLink(urlToParse, {
                tagpagename: 'tour',
                tagguid: tourObj.Identifier,
                prevpage: prevExhib.Identifier,
                tagonlytour: false
            });

            root.append(linkOverlay);
            linkOverlay.fadeIn(500, function() {
                linkOverlay.find('.linkDialogInput').select();
            });
        });
    } else {
        linkButtonContainer.remove();
    }

    if(ispagetoload) {
        pageToLoad.pagename = '';
        if(pageToLoad.onlytour) {
            backButtonContainer.remove();
            linkButtonContainer.remove();
        } else {
            backButtonContainer.css('display', 'none');
            linkButtonContainer.css('display', 'none');
        }
        if(tourObj && tourObj.Metadata && tourObj.Metadata.Thumbnail) {
            bigThumbnail.attr('src', TAG.Worktop.Database.fixPath(tourObj.Metadata.Thumbnail));
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

    function goBack () {

        var artmode, collectionsPage;

        // UNCOMMENT IF WE WANT IDLE TIMER IN TOUR PLAYER
        // idleTimer.kill();
        // idleTimer = null;
        
        if(player) {
            player.pause();
            player.screenplayEnded.unsubscribe();
            player.unload();
        }

        if(!player || rinPlayer.children().length === 0) {
            return; // if page hasn't loaded yet, don't exit (TODO -- should have slide page overlay)
        }

        backButton.off('click'); // prevent user from clicking twice

        if (artmodeOptions) {
            artmode = new TAG.Layout.ArtworkViewer(artmodeOptions);
            TAG.Util.UI.slidePageRightSplit(root, artmode.getRoot());

            currentPage.name = TAG.Util.Constants.pages.ARTWORK_VIEWER;
            currentPage.obj  = artmode;
        } else {
            var backInfo = { backArtwork: tourObj, backScroll: prevScroll };
            collectionsPage = new TAG.Layout.CollectionsPage({
                backScroll: prevScroll,
                backArtwork: tourObj,
                backCollection: exhibition,
                backTag : prevTag,
                backMult : prevMult,
                backPreviewPos : prevPreviewPos
            });
            TAG.Util.UI.slidePageRightSplit(root, collectionsPage.getRoot(), function () {
                artworkPrev = "catalog";
                if (!IS_WINDOWS) {
                    if (collectionsPage.getState().exhibition === exhibition) {
                        collectionsPage.showArtwork(tourObj, prevMult && prevMult)();
                    }
                }
			});
        
            currentPage.name = TAG.Util.Constants.pages.COLLECTIONS_PAGE;
            currentPage.obj  = collectionsPage;         
        }
        // TODO: do we need this next line?
        // tagContainer.css({ 'font-size': '11pt', 'font-family': "'source sans pro regular' sans-serif" }); // Quick hack to fix bug where rin.css was overriding styles for body element -jastern 4/30
    }

    return {
        getRoot: function () {
            return root;
        },
        startPlayback: function () { // need to call this to ensure the tour will play when you exit and re-enter a tour, since sliding functionality and audio playback don't cooperate
            rin.processAll(null, rinPath).then(function () {
                var options = 'systemRootUrl='+rinPath+'/&autoplay='+(ispagetoload ? 'false' : 'true')+'&loop=false';
                // create player
                player = rin.createPlayerControl(rinPlayer[0], options);
                for (var key in tour.resources) {
                    if (tour.resources.hasOwnProperty(key)) {
                        if (typeof tour.resources[key].uriReference === 'string') {
                            tour.resources[key].uriReference = TAG.Worktop.Database.fixPath(tour.resources[key].uriReference);
                        }
                    }
                }
                player.loadData(tour, function () {});
                if(!ispagetoload) {
                    player.screenplayEnded.subscribe(function() { // at the end of a tour, go back to the collections view
                        setTimeout(goBack, 1000);
                    });
                }
            });
        }
    };

};

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
    var rinPath = IS_WINDOWS ? tagPath + 'js/WIN8_RIN/web' : tagPath + 'js/RIN/web';
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
            'left': (w - h * 16 / 9) / 2 + 'px'
        });
    } else if (w * 9 / 16 < h) {
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

    backButton.attr('src', tagPath + 'images/Back_wshadow.svg');

    //clicked effect for back button
    backButton.on('mousedown', function () {
        TAG.Util.UI.cgBackColor("backButton", backButton, false);
    });
    backButton.on('mouseleave', function () {
        TAG.Util.UI.cgBackColor("backButton", backButton, true);
    });

    backButton.on('click', goBack);

    if (IS_WEBAPP) {
        linkButton.attr('src', tagPath + 'images/link.svg');
        linkButton.on('click', function () {
            var linkOverlay = TAG.Util.UI.showPageLink(urlToParse, {
                tagpagename: 'tour',
                tagguid: tourObj.Identifier,
                prevpage: prevExhib.Identifier,
                tagonlytour: false
            });

            root.append(linkOverlay);
            linkOverlay.fadeIn(500, function () {
                linkOverlay.find('.linkDialogInput').select();
            });
        });
    } else {
        linkButtonContainer.remove();
    }

    if (ispagetoload) {
        pageToLoad.pagename = '';
        if (pageToLoad.onlytour) {
            backButtonContainer.remove();
            linkButtonContainer.remove();
        } else {
            backButtonContainer.css('display', 'none');
            linkButtonContainer.css('display', 'none');
        }
        if (tourObj && tourObj.Metadata && tourObj.Metadata.Thumbnail) {
            bigThumbnail.attr('src', TAG.Worktop.Database.fixPath(tourObj.Metadata.Thumbnail));
            bigPlayButton.attr('src', tagPath + 'images/icons/Play.svg');
            bigThumbnailContainer.css('display', 'block');

            bigPlayButton.on('click', startTour);
            bigThumbnail.on('click', startTour);
        }
    }


    //sidebar stuff

    var sideBar = root.find('#sideBar'),
    toggler = root.find('#toggler'),
    togglerImage = root.find('#togglerImage'),
    info = root.find('#info'),
    screenWidth = $('#tagRoot').width(),

    FIX_PATH = TAG.Worktop.Database.fixPath,
    PRIMARY_FONT_COLOR = TAG.Worktop.Database.getMuseumPrimaryFontColor(),
    SECONDARY_FONT_COLOR = TAG.Worktop.Database.getMuseumSecondaryFontColor(),
    FONT = TAG.Worktop.Database.getMuseumFontFamily();

    sideBar.disableSelection();
    sideBar.attr('unselectable', 'on');
    sideBar.css({
        '-moz-user-select': '-moz-none',
        '-o-user-select': 'none',
        '-khtml-user-select': 'none',
        '-webkit-user-select': 'none',
        '-ms-user-select': 'none',
        'user-select': 'none'
    });
    sideBar.bind('selectstart', function () { return false; });
    sideBar.css('visibility', 'hidden');
    /**
     * Makes the artwork viewer sidebar
     * @method makeSidebar
     */
    function makeSidebar(mapslength) {
        var backBttnContainer = root.find("#backBttnContainer"),
            sideBarSections = root.find('#sideBarSections'),
            sideBarInfo = root.find('#sideBarInfo'),
            infoTitle = root.find('#infoTitle'),
            infoArtist = root.find('#infoArtist'),
            infoYear = root.find('#infoYear'),
            assetContainer = root.find('#assetContainer'),
            isBarOpen = false,
            item,
            fieldTitle,
            fieldValue,
            infoCustom,
            i,
            curr,
            descriptionDrawer,
            sidebarIconImg = root.find("#sidebarIconImg");

        sidebarIconImg.attr("src", tagPath + 'images/icons/sidebarIcon.png');
        sidebarIconImg.hide();
        
        sideBar.css('visibility', 'visible');
        sideBar.hide();
        sideBar.data({ isOpen: false, isHidden: true });

        sideBarInfo.css({
            'height': sideBarSections.height() - 25 + 'px'
        });
        togglerImage.attr("src", tagPath + 'images/icons/Open.svg');

        infoTitle.css({
            'color': '#' + PRIMARY_FONT_COLOR,
            //'font-family': FONT
        });

        infoArtist.css({
            'color': '#' + PRIMARY_FONT_COLOR,
            //'font-family': FONT
        });

        infoYear.css({
            'color': '#' + PRIMARY_FONT_COLOR,
            //'font-family': FONT
        });

        sideBar.css('min-width', 0.22 * screenWidth);

        togglerImage.css('left', '0%');

        sideBar.css({
            "left": '-' + (0.22 * screenWidth) + 'px'
        });

        // toggler to hide/show sidebar
        toggler.on('click', function () {
            var opts = {}
            var isOpen = sideBar.data("isOpen");

            if (isOpen) {
                opts.left = '-' + (0.22 * screenWidth) + 'px';
            } else {
                opts.left = '0%'; 
            }

            sideBar.animate(opts, 500, function () {
                if (isOpen) {
                    togglerImage.attr('src', tagPath + 'images/icons/Open.svg');
                    sideBar.data({ isOpen: false });
                } else {
                    togglerImage.attr('src', tagPath + 'images/icons/Close.svg');
                    sideBar.data({ isOpen: true })
                }
            });
        });
    }
    makeSidebar();

    /**
     * Create a drawer (e.g., for list of related tours or the artwork's description) 
     * @param {String} title            title of the drawer
     * @param {jQuery obj} topContents  an element to be included before the main contents of the drawer
     * @return {jQuery obj}             the drawer
     */
    function createDrawer(title, topContents, assocMediaToShow) {
        var drawer = $(document.createElement('div')).addClass('drawer'),
            drawerHeader = $(document.createElement('div')).addClass('drawerHeader'),
            label = $(document.createElement('div')).addClass('drawerLabel'),
            toggleContainer = $(document.createElement('div')).addClass('drawerToggleContainer'),
            toggle = $(document.createElement('img')).addClass("drawerPlusToggle"),
            drawerContents = $(document.createElement('div')).addClass("drawerContents"),
            i;

        label.addClass('primaryFont');
        label.text(title);
        label.css({
            'color': '#' + PRIMARY_FONT_COLOR,
            //'font-family': FONT
        });
        toggle.attr({
            src: tagPath + 'images/icons/plus.svg',
            expanded: false
        });

        drawer.append(drawerHeader);
        drawerHeader.append(label);
        drawerHeader.append(toggleContainer);
        toggleContainer.append(toggle);

        drawer.append(drawerContents);
        topContents && drawerContents.append(topContents);
        var drawerToggle = function (evt) {
            if (toggle.attr('expanded') !== 'true') {
                root.find(".drawerPlusToggle").attr({
                    src: tagPath + 'images/icons/plus.svg',
                    expanded: false
                });

                root.find(".drawerContents").slideUp();

                toggle.attr({
                    src: tagPath + 'images/icons/minus.svg',
                    expanded: true
                });
            } else {
                toggle.attr({
                    src: tagPath + 'images/icons/plus.svg',
                    expanded: false
                });

            }

            drawerContents.slideToggle();
        }

        //have the toggler icon minus when is is expanded, plus otherwise.
        drawerHeader.on('click', drawerToggle);

        drawer.contents = drawerContents;

        return drawer;
    }

    function loadSidebarContent(doq) {
        if (!doq) {
            return;
        }
        var backBttnContainer = root.find("#backBttnContainer"),
            sideBarSections = root.find('#sideBarSections'),
            sideBarInfo = root.find('#sideBarInfo'),
            infoTitle = root.find('#infoTitle'),
            infoArtist = root.find('#infoArtist'),
            infoYear = root.find('#infoYear'),
            assetContainer = root.find('#assetContainer'),
            isBarOpen = false,
            item,
            fieldTitle,
            fieldValue,
            infoCustom,
            i,
            curr,
            descriptionDrawer;

        infoTitle.text(doq.Name);
        infoArtist.text(doq.Metadata.Artist);
        infoYear.text(doq.Metadata.Year);

        assetContainer.empty();
        $(".infoCustom").remove();

        // add more information for the artwork if curator added in the authoring mode
        for (item in doq.Metadata.InfoFields) {
            if (doq.Metadata.InfoFields.hasOwnProperty(item)) {
                fieldTitle = item;
                fieldValue = doq.Metadata.InfoFields[item];
                infoCustom = $(document.createElement('div'));
                infoCustom.addClass('infoCustom');
                infoCustom.text(fieldTitle + ': ' + fieldValue);
                infoCustom.css({
                    'color': '#' + PRIMARY_FONT_COLOR,
                    //'font-family': FONT
                });
                infoCustom.appendTo(info);
            }
        }

        // make sure the info text fits in the div (TODO is this necessary?)
        TAG.Util.fitText(info, 1.1);

        // create drawers
        if (doq.Metadata.Description) {
            descriptionDrawer = createDrawer("Description");
            descriptionDrawer.contents.html(Autolinker.link(doq.Metadata.Description.replace(/\n/g, "<br />"), { email: false, twitter: false }));
            if (IS_WINDOWS) {
                var links = descriptionDrawer.find('a');
                links.each(function (index, element) {
                    $(element).replaceWith(function () {
                        return $.text([this]);
                    });
                });
            }
            assetContainer.append(descriptionDrawer);
        }
        //when the #info div's size is not too large, the text inside metadata fields is made as much visible as possible

        info.css({
            'overflow-y': 'auto',
            'max-height': sideBar.height() * 2 / 5 - (info.offset().top - sideBar.offset().top) + 'px',

        });

        assetContainer.css({
            'max-height': sideBarInfo.height() - info.height() + (info.offset().top - sideBar.offset().top) + 'px'
        });

        if (sideBar.data("isHidden")) {
            sideBar.css({
                "left": '-' + (0.22 * screenWidth) + 'px'
            });
            togglerImage.attr('src', tagPath + 'images/icons/Open.svg');
            sideBar.show();

            var opts = {}
            opts.left = '0%';
            sideBar.animate(opts, 500, function () {
                togglerImage.attr('src', tagPath + 'images/icons/Close.svg');
            });

            sideBar.data({ isOpen: true, isHidden: false });
        } else {
            if (!sideBar.data("isOpen") && sideBar.data("artworkGuid") && sideBar.data("artworkGuid") === doq.Metadata.artworkGuid) {
                sideBar.data({ isOpen: false });
            } else if (!sideBar.data("isOpen") && sideBar.data("artworkGuid") && sideBar.data("artworkGuid") !== doq.Metadata.artworkGuid) {
                var opts = {}
                opts.left = '0%';
                sideBar.animate(opts, 500, function () {
                    togglerImage.attr('src', tagPath + 'images/icons/Close.svg');
                });
                sideBar.data({ isOpen: true });
            }
        }
        sideBar.data({ artworkGuid: doq.Metadata.artworkGuid });
    }
    //sidebar stuff


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
        if (!pageToLoad.onlytour) {
            backButtonContainer.css('display', 'block');
            linkButtonContainer.css('display', 'block');
        }
    }

    function goBack() {

        var artmode, collectionsPage;

        // UNCOMMENT IF WE WANT IDLE TIMER IN TOUR PLAYER
        // idleTimer.kill();
        // idleTimer = null;

        if (player) {
            player.pause();
            player.screenplayEnded.unsubscribe();
            player.unload();
        }

        if (!player || rinPlayer.children().length === 0) {
            return; // if page hasn't loaded yet, don't exit (TODO -- should have slide page overlay)
        }

        backButton.off('click'); // prevent user from clicking twice

        if (artmodeOptions) {
            artmode = new TAG.Layout.ArtworkViewer(artmodeOptions);

            var newPageRoot = artmode.getRoot();
            newPageRoot.data('split', root.data('split') === 'R' ? 'R' : 'L');

            TAG.Util.UI.slidePageRightSplit(root, newPageRoot);

            currentPage.name = TAG.Util.Constants.pages.ARTWORK_VIEWER;
            currentPage.obj = artmode;
        } else {
            var backInfo = { backArtwork: tourObj, backScroll: prevScroll };
            collectionsPage = new TAG.Layout.CollectionsPage({
                backScroll: prevScroll,
                backArtwork: tourObj,
                backCollection: exhibition,
                backTag: prevTag,
                backMult: prevMult,
                backPreviewPos: prevPreviewPos
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
            currentPage.obj = collectionsPage;
        }
        // TODO: do we need this next line?
        // tagContainer.css({ 'font-size': '11pt', 'font-family': "'source sans pro regular' sans-serif" }); // Quick hack to fix bug where rin.css was overriding styles for body element -jastern 4/30
    }

    return {
        getRoot: function () {
            return root;
        },
        startPlayback: function () { // need to call this to ensure the tour will play when you exit and re-enter a tour, since sliding functionality and audio playback don't cooperate
            var sidebarDoqGuids = JSON.parse(tourObj.Metadata.RelatedArtworks);
            var sidebarDoqs = {};

            if (sidebarDoqGuids.length === 0) {
                loadTour();
            }
            var doqsPolled = 0;

            for (var i = 0; i < sidebarDoqGuids.length; i++) {
                TAG.Worktop.Database.getDoq(sidebarDoqGuids[i], function (doq) {
                    if (doq) {
                        var validDoq = false;
                        for (var item in doq.Metadata.InfoFields) {
                            if (doq.Metadata.InfoFields.hasOwnProperty(item)) {
                                validDoq = true;
                                break;
                            }
                        }
                        if (doq.Metadata.Artist || doq.Metadata.Year || doq.Metadata.Description) {
                            validDoq = true
                        }
                        if (validDoq) {
                            sidebarDoqs[doq.Identifier] = doq;
                        }
                        else {
                            sidebarDoqs[doq.Identifier] = null;
                        }
                        doqsPolled++
                    }

                    if (doqsPolled === sidebarDoqGuids.length) {
                        loadTour();
                    }
                },
                    function () {
                        console.log("error getting doq in tourplayer")
                    }, function () {
                        console.log("error getting doq in tourplayer .")
                    });
            }

            function loadTour() {
                rin.processAll(null, rinPath).then(function () {
                    var options = 'systemRootUrl=' + rinPath + '/&autoplay=' + (ispagetoload ? 'false' : 'true') + '&loop=false';
                    // create player
                    player = rin.createPlayerControl(rinPlayer[0], options);
                    for (var key in tour.resources) {
                        if (tour.resources.hasOwnProperty(key)) {
                            if (typeof tour.resources[key].uriReference === 'string') {
                                tour.resources[key].uriReference = TAG.Worktop.Database.fixPath(tour.resources[key].uriReference);
                            }
                        }
                    }
                    player.loadData(tour, function () { }, sidebarDoqs, loadSidebarContent);
                    if (!ispagetoload) {
                        player.screenplayEnded.subscribe(function () { // at the end of a tour, go back to the collections view
                            setTimeout(goBack, 1000);
                        });
                    }
                });
            }
        }
    };

};

﻿TAG.Util.makeNamespace("TAG.Util.Splitscreen");

/**
 * Utility functions for splitscreen mode.
 * @class TAG.Util.Splitscreen
 * @constructor
 * @return {Object}               some public methods
 */

TAG.Util.Splitscreen = (function () {
    "use strict";
    var on = false,
        viewerL = null,
        viewerR = null;

    return {
        init: init,
        exit: exitSplitscreen,
        isOn: isOn,
        setOn: setOn,
        setViewers: setViewers,
    };

    /**
     * Returns whether we're in splitscreen mode
     * @method isOn
     * @return {Boolean}       whether we're in splitscreen mode
     */
    function isOn() {
        return on;
    }

    /**
     * Sets whether we're in splitscreen mode
     * @method setOn
     * @param {Boolean} state       whether we should be in splitscreen mode
     */
    function setOn(state) {
        on = state;
    }

    /**
     * Sets the seadragon viewer for a certain artwork viewer root
     * @method setViewers
     * @param {jQuery obj} root              root of the artwork viewer
     * @param {AnnotatedImage} zoomimage     the AnnotatedImage object from which we'll get the viewer
     */
    function setViewers(root, zoomimage) {
        if (root.data('split') === "L") {
            viewerL = zoomimage.viewer;
        }
        if (root.data('split') === 'R') {
            viewerR = zoomimage.viewer;
        }
    }


    /**
     * Starts splitscreen
     * @method init
     * @param {jQuery obj} rootL     DOM root element (as JQuery obj) to go in left screen
     * @param {jQuery obj} rootR     DOM root element (as JQuery obj) to go in right screen
     */
    function init(rootL, rootR) {
        on = true;

        // initialize meta-containers
        var Lscreen = $(document.createElement('div')),
            Rscreen = $(document.createElement('div')),
            splitbar = $(document.createElement('div')),
            spliticon = $(document.createElement('img'));

        // left screen
        Lscreen.attr('id', 'metascreen-L');
        Lscreen.append(rootL);
        Lscreen.css({
            'position': 'absolute',
            'left': '0%',
            'top': '0%',
            'width': '49.5%',
            'height': '100%',
            'z-index': '999',
            'overflow': 'hidden',
        });

        if(rootL.attr('id') === 'newCatalogRoot') {
            rootL.find('.bottomButton').css("float", "left");
        };

        // right screen
        Rscreen.attr('id', 'metascreen-R');
        Rscreen.append(rootR);
        Rscreen.css({
            'position': 'absolute',
            'left': '50.5%',
            'top': '0%',
            'width': '49.5%',
            'height': '100%',
            'z-index': '998', // Rscreen should be lower than Lscreen so left-transitions can work
            'overflow': 'hidden',
        });

        // center divider
        splitbar.attr('id', 'splitbar');
        splitbar.css({
            'position': 'absolute',
            'left': '49.5%',
            'top': '0%',
            'width': '1%',
            'height': '100%',
            'z-index': '1000',
            'background-color': '#191915',
        });

        // buttons
        var exitL = makeExitButton('R'),
            exitR = makeExitButton('L');
        exitL.css({ left: '-350%', width: "300%" });
        exitR.css({ right: '-350%', width: "300%" });
        splitbar.append(exitL).append(exitR);

        $('#tagRoot').append(Lscreen).append(splitbar).append(Rscreen);

        /**
         * Helper function for making exit buttons
         * Inner function of init()
         * @method makeExitButton
         * @param {String} side     the side the button is going to go on ('L' or 'R')
         * @return {jQuery obj}     the exit button
         */
        function makeExitButton(side) {
            var exit = $(document.createElement('img'));
            exit.attr('src', tagPath + 'images/icons/x.svg');
            exit.css({
                'cursor': 'pointer',
                'position': 'absolute',
                'top': '94%',
                'width': '115%',
                'height': 'auto',
            });
            exit.on('click', function () {
                exitSplitscreen(side);
            });
            return exit;
        }
    }

    /**
     * Exits splitscreen, making the specified side fullscreen and removing the other
     * @method exitSplitscreen
     * @param newside   The side to be made fullscreen, either 'R' or 'L'
     */
    function exitSplitscreen(newside) {
        var oldside,
            pickedScreen = $('#metascreen-' + newside).detach(),
            root = $(pickedScreen.children('.rootPage')[0]); // only child should be root

        on = false;
        console.log($("#annotatedImageViewer").length)
        root.data('split', 'L');
        
        // remove all unnecessary metacontainers and contents
        if (newside === 'L') {
            $('#metascreen-R').remove();

            if (viewerL) {
                $(viewerL.container).css({ 'width': '100%', 'height': '100%' });
                viewerL.clearOverlays();
                /**
                var newLContainerSize = {
                    x: $(viewerL.container).width(),
                    y: $(viewerL.container).height()
                };
                viewerL.viewport.resize(newLContainerSize, false);
                viewerL.viewport.applyConstraints();
                viewerL.viewport.update();
                **/
            }
            viewerR = null;

        } else {
            $('#metascreen-L').remove();

            if (viewerR) {
                $(viewerR.container).css({ 'width': '100%', 'height': '100%' });
                viewerR.clearOverlays();
               // viewerR.viewport.applyConstraints();
               // viewerR.viewport.update();
            }
            //viewerR.viewport.panTo(new Seadragon.Point(outerContainerPivot.x,outerContainerPivot.y));
            viewerL = null;

        }
        $('#splitbar').remove();

        $('#tagRoot').append(root);

        fixLayoutsOnExit();

        if (viewerL) {
           // viewerL.scheduleUpdate();
            //viewerL.viewport.applyConstraints();
        }
        if (viewerR) {
            //viewerR.scheduleUpdate();
            //viewerR.viewport.applyConstraints();
        }
        viewerL = null;
        viewerR = null;

        /**
         * All the layout specific edits that need to be made upon exit
         * Theoretically, all of this should get wrapped into layout classes
         * but not sure the class pattern used allows for it
         * TODO document
         */
        function fixLayoutsOnExit() {
            // debugger;
            // Layout specific edits
            if (root.attr('id') === 'artmodeRoot') { // Fix sidebar, toggler, and splitscreen button
                var sideBar = root.find('#sideBar'),
                    toggler = root.find('#toggler'),
                    togglerImage = root.find('#togglerImage'),
                    splitscreenContainer = root.find('#splitscreenContainer'),
                    seadragonManipContainer = root.find('#seadragonManipContainer'),
                    splitscreenIcon = root.find('.splitscreen-icon'),
                    locationHistoryDiv = root.find('#locationHistory');
                    //locationHistoryPanel = root.find('.locationHistoryPanel'),
                    //locationHistoryToggle = root.find('.locationHistoryToggle'),
                    //locationHistoryToggleIcon = root.find('.locationHistoryToggleIcon'),
                    //locationHistoryText = root.find('.locationHistoryContainer').find('img'),
                    //locationHistoryIcon = root.find('.locationHistoryContainer').find('div'),
                    //lhmapsuffix = (newside === 'R') ? 'R' : '',
                    //lhmap = root.find('.lpMapDiv'),
                    //sidebarsize = window.innerWidth * 0.2,
                //locsize = window.innerWidth * 0.8;
                locationHistoryDiv.css({ "color": "#" + TAG.Worktop.Database.getMuseumPrimaryFontColor() });
                sideBar.css({
                    'left': '0%',
                    'right' : 'auto'
                });
                toggler.css({
                    'position': 'absolute',
                    'left': 'auto',
                    'right': '-12%',
                    borderTopRightRadius: "10px",
                    borderBottomRightRadius: "10px",
                    borderTopLeftRadius: "0px",
                    borderBottomLeftRadius: "0px",
                });
                togglerImage.attr("src", tagPath + 'images/icons/Close.svg')
                            .css({
                                'left': '0%',
                                'right': 'auto'
                              });
                seadragonManipContainer.css({
                    'right': '0%',
                    'left': 'auto'
                });
                splitscreenContainer.css('display', 'block');
                //locationHistoryToggle.css({
                //    left: '87.5%',
                //    'border-bottom-right-radius': '10px',
                //    'border-top-right-radius': '10px'
                //});
                //$(locationHistoryToggleIcon).attr('src', 'images/icons/Left.png');
                //locationHistoryText.css("opacity", "1.0"); // reset location history opacity to 1.0
                //locationHistoryIcon.css("opacity", "1.0");
                //lhmap.attr('id', 'lpMapDiv');
            } else if (root.attr('id') === 'newCatalogRoot') {
                root.find('#backButtonArea').css('display', 'inline');
                root.find('.bottomButton').css({
                    "float": "right",
                    "display" : "block"
                });

                //all the many re-adjustments for the keywords row
                root.find("#keywords").css({
                    'display': 'inline',
                    'z-index': 'inherit',
                    'padding': '0%',  
                    'width': '100%',
                    'background-color': 'transparent',
                    'border-radius': '0px',
                    'text-align': 'left'
                });
                root.find("#searchButton").css({
                    'font-size': '90%',
                    'padding-bottom': '0.03%',
                    'padding-top': '0.07%',
                    'margin-top': '0%'
                });
                root.find("#filterByKeywords").empty().unbind()
                    .css({
                        'display': 'none',
                        'cursor': 'auto'
                    });              
                root.find('.ui-dropdownchecklist-selector').each(function (index, element) {
                    var selector = $(element);
                    var maxW;
                    if (index % 2 === 0) {
                        maxW = $("#tagRoot").width() * 0.04 + 'px';
                    } else {
                        maxW = $("#tagRoot").width() * 0.12 + 'px';
                    }
                    selector.css({ 'max-width': maxW });
                    if (index % 2 === 0) {
                        selector.find('.ui-dropdownchecklist-text').css('width', 'auto');
                    } else {
                        selector.css({ 'width': 'auto' });
                    }
                    var selectorH = root.find("#searchInput").height();
                    if (!IS_WINDOWS){
                        selectorH = selectorH * 1.4;
                    }
                    selector.parent().css({ 'height': selectorH + 'px' });
                    selector.parent().find('.selector-dropdown').css({
                        'width': ($("#tagRoot").width() * 0.01015) + 'px',
                        'float': 'right',
                        'top': '25%'
                    });
                    selector.parent().css({ 'width': 'auto' });
                    if (index % 2 != 0) {
                        selector.parent().css({ 'width': selector.parent().outerWidth() * 1.1 + 'px' });
                    }
                    selector.parent().parent().find('.ui-dropdownchecklist-dropcontainer-wrapper') // Once the width of the selector box is set...
                            .css('width', selector.parent().outerWidth() + 'px'); // Change the width of the actual dropdownchecklist to be the same.
                    
                });
                
                //adjust styling for windows
                if (!IS_WINDOWS){
                    $(".selector-dropdown").css('top','-1px');
                }

                root.find("#searchInput").css({
                    'width': $("#searchInput").width() * 2
                });
                root.find(".sortButton").css({
                    'max-width': $("#tagRoot").width() * 0.15 + 'px',
                });
                root.find("#divide").css({ 'margin-top': '0%' });
                root.find("#artworksButton").css({ 'margin-top': '0%' });
                root.find("#assocMediaButton").css({ 'margin-top': '0%' });
                root.find("#filterWrapper").css({ 'float': 'none' });


                root.find('#collectionMenu').css('width', '35%');

                root.find('#infoButton').show();
                //adjust position of tiles to take description into account
                if (parseInt(root.find('#infoDiv').css('margin-left')) >= 0) {
                    root.find('#infoDiv').css('width', '25%');
                    root.find("#tileDiv").css({ 'margin-left': '0%', 'left': root.find('#infoDiv').width() });
                }
                root.find("#toggleRow").css('width',"20%");
            } else if (root.hasClass('videoPlayer')) {
                root.find('#playPauseButton').attr('src', 'images/icons/PlayWhite.svg');
            } else if (root.hasClass('exhibition')) { // Restore defaults to exhibition
                root.find('.leftbar-header').css({
                    height: '5%',
                });
                root.find('.exhibition-label').css({
                    width: '50%',
                });
                root.find('.videos-label').css({
                    width: '50%',
                });
                root.find('.selectExhibition').css({
                    'font-size': '1.5em',
                    'letter-spacing': 'inherit',
                });
                root.find('.exhibition-title').css({
                    'font-size': '5.7em',
                    'letter-spacing': 'inherit',
                });
                root.find('.exhibition-subtitle-1').css({
                    'font-size': '3em',
                    'letter-spacing': 'inherit',
                });
                root.find('.exhibition-subtitle-2').css({
                    'font-size': '2em',
                    'letter-spacing': 'inherit',
                });
                root.find('#catalogBackButton').css({
                    'display': 'block'
                });
                root.find('.feedback-icon').css({
                    'display': 'inline'
                });
                root.find('#exhibition-label').css({
                    'display': 'block'
                });
                root.find('#tutorialButton').show();
                root.find('#infoButton').show();
                //if (root.find('#infoDiv').width() !== 0) {
                //    root.find('#infoDiv').css('width', '25%');
                //    root.find("#tileDiv").css({ 'margin-left': '0%' ,'left': infoDiv.width()});
                //}

                //$('.exhibition-selection').css('font-size', '200%');//LADS.Util.getMaxFontSizeEM(root.find('.exhibition-selection .exhibition-title').text(), 1.5, $(window).width() * 0.75 * 0.8, .2 * root.find(".exhibition-selection").height()));

                // dz - dynamic font sizing
                var size = 0.096 * 0.45 * $(window).height();
                var exhibTitleSize = LADS.Util.getMaxFontSizeEM('W', 0.25, 9999, size * 0.85, 0.1);

                // exhibition selector text sizees
                $('.exhibition-selection .exhibition-title').css({
                    'font-size': exhibTitleSize,
                });

                //LADS.Util.getMaxFontSizeEM(root.find('.exhibition-selection .exhibition-title').text(), 1.5, $(window).width() * 0.75 * 0.8, .2 * root.find(".exhibition-selection").height()));

                // "collections" text - give this an ID instead of a class
                root.find('#exhibition-label').css('font-size', LADS.Util.getMaxFontSizeEM('Collections', 1, $(window).width() * 0.1, 1000));

                // big exhibition name text = give this an ID instead of a class
                root.find('.exhibition-name-div').css('font-size', LADS.Util.getMaxFontSizeEM(root.find('.exhibition-name-div').text(), 1.5, $(window).width() * 0.75 * 0.8, .2 * root.find(".exhibition-info").height()));

                var imgW = .40 * $(".contentdiv").width();
                var imgH = imgW / 1.4;
                root.find('.img-container').css({
                    height: imgH + "px",
                    width: imgW + "px"
                });
                root.find('.explore-text').css("font-size", LADS.Util.getMaxFontSizeEM("Explore", .5, .5 * root.find('.explore-tab').width(), .7 * root.find('.explore-tab').height()));
            }
        }
    }
})();
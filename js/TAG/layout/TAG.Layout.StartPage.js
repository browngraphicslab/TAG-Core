TAG.Util.makeNamespace("TAG.Layout.StartPage");


/**
* The start page for TAG, which contains mueseum info, server preferences and credits.
* @class TAG.Layout.StartPage
* @constructor
*
* @param {Object} options
* @param {Function} startPageCallback
* @return {Object} that                 collection of public methods and properties
*/
TAG.Layout.StartPage = function (options, startPageCallback) {
    "use strict"; ////////////////////////////////////////////////

    SPENT_TIMER = new TelemetryTimer(); //global timer to measure time spent
    SETTINGSVIEW_TIMER = new TelemetryTimer(); //global timer to measure time spent in settings view

    var isPreview;
    options && function () {isPreview = options.isPreview; }();
    options = TAG.Util.setToDefaults(options, TAG.Layout.StartPage.default_options);
    options.tagContainer = $("#tagRoot");

    var root = TAG.Util.getHtmlAjax('../tagcore/html/SplashScreenOverlay.html'), // use AJAX to load html from .html file
        //overlay = root.find('#overlay'),
        //primaryFont = root.find('.primaryFont'),
        //secondaryFont = root.find('.secondaryFont'),
        //serverTagBuffer = root.find('#serverTagBuffer'),
        //serverSetUpContainer = root.find('#serverSetUpContainer'),
        //authoringButtonContainer = root.find('#authoringButtonContainer'),
        //authoringButtonBuffer = root.find('#authoringButtonBuffer'),
        //loginDialog = root.find('#loginDialog'),
        goToCollectionsButton = root.find('#goToCollectionsButton'),
        serverInput = root.find('#serverInput'),
        authoringInput = root.find('#passwordInput'),
        serverError = root.find('#serverError'),
        passwordError = root.find('#passwordError'),
        serverSubmit = root.find('#serverSubmit'),
        passwordSubmit = root.find('#passwordSubmit'),
        //tutorialButton = root.find('#tutorialButton'),
        serverURL,
        tagContainer,
        newUser = options.newUser,
        mainDoq,
        PRIMARY_FONT_COLOR = options.primaryFontColor ? options.primaryFontColor : null,
        SECONDARY_FONT_COLOR = options.secondaryFontColor ? options.secondaryFontColor : null;
    serverInput.attr('placeholder', localStorage.ip);
    serverInput.attr('value', localStorage.ip);

    //PREVIEW STYLING
    isPreview && function () {
        serverInput.css({ 'min-height': '0px','min-width': '0px',});
        serverSubmit.css({ 'min-height': '0px', 'min-width': '0px', });
        authoringInput.css({ 'min-height': '0px', 'min-width': '0px', });
        passwordSubmit.css({ 'min-height': '0px', 'min-width': '0px', });
    }();

    //INFO POPUP - todo styl

    /*tutorialButton.attr('src', tagPath + 'images/icons/question_mark.svg')
        .addClass('bottomButton')
        .on('mousedown', function () {
            TAG.Util.createTutorialPopup();
        }).css({
            'cursor': 'pointer',
            'display': 'block',
            'float': 'left',
            'height': '3.5%',
            'max-height': '50px',
            'width': 'auto',
            'bottom': '0%',
            'margin': '0px 0px 1.5% 1.5%',
            'position': 'absolute',
        });*/

    // TODO merging TAG.Telemetry.register(goToCollectionsButton, 'click', 'start_to_collections');
    //                     tobj.mode = 'Kiosk';
    if (localStorage.ip && localStorage.ip.indexOf(':') !== -1) {
        localStorage.ip = localStorage.ip.split(':')[0];
    }
    
    serverURL = 'http://' + (localStorage.ip ? localStorage.ip + ':8080' : "browntagserver.com:8080");
    tagContainer = options.tagContainer || $('body');

    //Comment out this conditional block to disable access to authoring for the web
    // if (!IS_WINDOWS) {
    //     authoringInput.prop('disabled', true);
    //     authoringInput.css('opacity', '0.5');
    //     passwordSubmit.css('opacity', '0.5');
    // }
    
    testConnection();
    if(newUser){
        telemetryDialogDisplay();
    }

    
    //applyCustomization();
    function telemetryDialogDisplay(){
        var tagContainer = $('#tagRoot');
        var telemetryDialogoverlay = $(TAG.Util.UI.PopUpConfirmation(function(){
            TELEMETRY_SWITCH = 'off';
            localStorage.tagTelemetry = "off";
            //telemetryDialogOverlay.remove();
        },
            "To improve the Touch Art Gallery experience, we're trying to collect more information about how users like you use our application. Do you mind us collecting information on your usage?",
            "Yes, I mind",null,
            function(){
                TELEMETRY_SWITCH = 'on';
                localStorage.tagTelemetry = "on";
                //telemetryDialogOverlay.remove();
            },
            tagContainer,null,null,true
        ));

        
        root.append(telemetryDialogoverlay);
        
        telemetryDialogoverlay.show();
        adjustHeights(document.getElementById("popupmessage"));

        function adjustHeights(elem) {
            var fontstep = 0.1;
            if ($(elem).height() > $(elem).parent().height() || $(elem).width() > $(elem).parent().width()) {
                $(elem).css('font-size', (($(elem).css('font-size').substr(0, 2) - fontstep)) + 'px').css('line-height', (($(elem).css('font-size').substr(0, 2))) + 'px');
                adjustHeights(elem);
            }
        }
        // Creating Overlay
        /*
        var telemetryDialogOverlay = $(document.createElement('div'));
        telemetryDialogOverlay.attr('id', 'telemetryDialogOverlay');
        telemetryDialogOverlay.addClass('dialogBoxOverlay');
        tagContainer.prepend(telemetryDialogOverlay);

        // Creating Dialog Box Container (required for centering)
        var telemetryDialogContainer = $(document.createElement('div'));
        telemetryDialogContainer.attr('id', 'telemetryDialogContainer');
        telemetryDialogContainer.addClass('dialogBoxContainer');
        telemetryDialogOverlay.append(telemetryDialogContainer);
        telemetryDialogContainer.css({
                'position': 'relative'
        });

        // Creating Dialog Box
        var telemetryDialog = $(document.createElement('div'));
        telemetryDialog.attr('id', 'telemetryDialog');
        telemetryDialog.addClass('dialogBox');
        telemetryDialogContainer.append(telemetryDialog);
        telemetryDialog.css({
                'height':'26%'
        });

        // Content
        var telemetryDialogPara = $(document.createElement('p'));
        telemetryDialogPara.attr('id', 'dialogBoxPara');
        //telemetryDialogPara.css({"margin-top": "5%"});
        telemetryDialogPara.text("To improve the Touch Art Gallery experience, we're trying to collect more information about how users like you use our application. Do you mind us collecting information on your usage?");
        telemetryDialog.append(telemetryDialogPara);

        // Button Container
        var telemetryButtonRow = $(document.createElement('div'));
        telemetryButtonRow.attr('id', 'telemetryButtonRow');
        telemetryDialog.append(telemetryButtonRow);
        telemetryButtonRow.css({
            'display': 'block',
            'height' : '13%',
            'position': 'relative',
            'width': '90%',
            'margin-left': '5%',
            'margin-top':'10%'
        });

        var yesButton = $(document.createElement('button'));
        yesButton.attr('id', 'yesButton');
        yesButton.text('Yes, I mind');
        telemetryButtonRow.append(yesButton);
        yesButton.css({
            'position': 'relative',
            'width': '30%',
            'height': '100%',
            'color': '#fff',
            'font-family': '"Segoe UI",serif',
            'font-size': '80%',
            'font-weight': 'normal',
            'background-color': 'transparent',
            'cursor': 'pointer',
            'padding': '0px 0px 0px 0px',
            'border-radius' : '3.5px',
            'border' : '1px solid white',
            'margin': '0',
            'float': 'left',
            'margin-left' : '0%',
            'margin-top' : '1px'
        });

        var noButton = $(document.createElement('button'));
        noButton.attr('id', 'noButton');
        noButton.text('No, I don\'t mind');
        telemetryButtonRow.append(noButton);
        noButton.css({
            'position': 'relative',
            'width': '40%',
            'height': '100%',
            "background-color": "white",
            'color': 'black',
            'font-family': '"Segoe UI",serif',
            'font-weight': 'normal',
            'cursor': 'pointer',
            'float': 'right',
            'font-size': '80%',
            'padding': '0px 0px 0px 0px',
            'border-radius' : '3.5px',
            'border' : '1px solid white'
        });

        noButton.click(function () {
            TELEMETRY_SWITCH = 'on';
            localStorage.tagTelemetry = "on";
            telemetryDialogOverlay.remove();
        });

        yesButton.click(function(){
            TELEMETRY_SWITCH = 'off';
            localStorage.tagTelemetry = "off";
            telemetryDialogOverlay.remove();
        });
        */


    }

    /**
     * Test internet and server connections
     * @param options             Object
     *            internetURL     url of alternate site against which we'll test connectivity
     */
    function testConnection(options) {
        var internetURL = (options && options.internetURL) || "http://www.google.com/",
            connectionTimeout,
            timedOut;

        //console.log("checking server url: " + serverURL);
        $.ajax({
            url: serverURL,
            dataType: "text",
            async: true,
            cache: false,
            success: function () {
                if (!timedOut) {
                    clearTimeout(connectionTimeout);
                    successConnecting();
                }
            },
            error: function (err) {
                if(!timedOut) {
                    clearTimeout(connectionTimeout);
                    $.ajax({  // TODO: not a solid way to do this
                        url: internetURL,
                        dataType: "text",
                        async: false,
                        cache: false,
                        success: function () {
                            if (!timedOut) {
                                clearTimeout(connectionTimeout);
                                tagContainer.empty();
                                tagContainer.append((new TAG.Layout.InternetFailurePage("Server Down")).getRoot());
                            }
                        },
                        error: function (err) {
                            if(!timedOut) {
                                clearTimeout(connectionTimeout);
                                tagContainer.empty();
                                tagContainer.append((new TAG.Layout.InternetFailurePage("No Internet")).getRoot());
                            }
                        }
                    });
                }
            }
        });

        connectionTimeout = setTimeout(function() {
            timedOut = true;
            tagContainer.empty();
            tagContainer.append((new TAG.Layout.InternetFailurePage("Server Down")).getRoot());
        }, 10000); // 10 second timeout to show internet failure page
    }

    function successConnecting() {
        TAG.Worktop.Database.getVersion(function (ver) {
            if (parseFloat(ver) < 1.5) {
                tagContainer.empty();
                tagContainer.append((new TAG.Layout.InternetFailurePage("Old Server")).getRoot());
            } else {
                TAG.Worktop.Database.getMain(loadHelper, function () {
                    tagContainer.empty();
                    tagContainer.append((new TAG.Layout.InternetFailurePage("Server Down")).getRoot());
                });
            }
        }, function () {
            tagContainer.empty();
            tagContainer.append((new TAG.Layout.InternetFailurePage("Server Down")).getRoot());
        });
    }

    var that = {};    
    var backgroundColor,
        logoContainer,
        touchHint,
        handGif;    

    /**
    * sets up the entire visual layout and images of the splash screen
    * @method loadHelper
    * @param {Object} main     contains all image paths and museum info
    */
    function loadHelper(main) {
        mainDoq = main;
        if (PRIMARY_FONT_COLOR == null) {
            PRIMARY_FONT_COLOR = mainDoq.Metadata["PrimaryFontColor"];
        }

        if (SECONDARY_FONT_COLOR == null) {
            SECONDARY_FONT_COLOR = mainDoq.Metadata["SecondaryFontColor"];
        }

        if (SECONDARY_FONT_COLOR[0] !== '#') {
            SECONDARY_FONT_COLOR = '#' + SECONDARY_FONT_COLOR;
        }
        if (PRIMARY_FONT_COLOR[0] !== '#') {
            PRIMARY_FONT_COLOR = '#' + PRIMARY_FONT_COLOR;
        }

        if (startPageCallback) {
            startPageCallback(root);
        }

        TAG.Util.Constants.set("START_PAGE_SPLASH", tagPath+"images/birdtextile.jpg");
        // if(!allowServerChange) {
        //  $('#serverTagBuffer').remove();
        // }
    
        // if(!allowAuthoringMode){
        //     $('#authoringButtonBuffer').remove();
        // }
        
        if (TAG.Worktop.Database.getLocked() != undefined && TAG.Worktop.Database.getLocked() != "undefined") {
            goToCollectionsButton.text("Go to Artwork");
        }
        
        goToCollectionsButton.on('click', function () {
            if (TAG.Worktop.Database.getLocked() != undefined && TAG.Worktop.Database.getLocked() != "undefined") {
                TAG.Worktop.Database.getArtworks(function (result) {
                    $.each(result, function (index, artwork) {
                        if (artwork.Identifier === TAG.Worktop.Database.getLocked()) {
                            if (artwork.Metadata.Type === "VideoArtwork") { // video                  
                                var videoPlayer = TAG.Layout.VideoPlayer(artwork);
                                TAG.Util.UI.slidePageLeftSplit(root, videoPlayer.getRoot());

                                currentPage.name = TAG.Util.Constants.pages.VIDEO_PLAYER;
                                currentPage.obj = videoPlayer;

                            } else {
                                var artworkViewer = TAG.Layout.ArtworkViewer({
                                    doq: artwork,
                                });
                                var newPageRoot = artworkViewer.getRoot();
                                newPageRoot.data('split', root.data('split') === 'R' ? 'R' : 'L');

                                TAG.Util.UI.slidePageLeftSplit(root, newPageRoot);

                                currentPage.name = TAG.Util.Constants.pages.ARTWORK_VIEWER;
                                currentPage.obj = artworkViewer;
                            }
                               
                        }
                    });
                });

                return false;
            } else {
                switchPage();
            }
        });
        
        setImagePaths(main);
        setUpCredits();
        setUpInfo(main);
        applyCustomization(main);
        initializeHandlers();

        openDialog();
        // authoringButtonBuffer.on('click', function (evt) {
        //     evt.stopPropagation();
        // });

        //opens the collections page on touch/click
        function switchPage() {
            var collectionsPage;

            goToCollectionsButton.off('click');
            collectionsPage = TAG.Layout.CollectionsPage(); // TODO merging
            TAG.Util.UI.slidePageLeft(collectionsPage.getRoot());

            currentPage.name = 2; // TODO merging TAG.Util.Constants.pages.COLLECTIONS_PAGE;
            currentPage.obj  = collectionsPage;
        }

        // Test for browser compatibility
        if(!isBrowserCompatible()) {
            handleIncompatibleBrowser();
        }
    }   
    
    var saveClick = $.debounce(500, false, function (e) {
        var address = serverInput.val();
        switch (address) {
            case 'tagunicorn':
                var unicorn = $(document.createElement('img'));
                unicorn.attr('src', tagPath + 'images/unicorn.jpg');
                unicorn.css({
                    width: '100%',
                    height: '100%',
                    'z-index': 2147483647, // we really want this unicorn to show up
                    display: 'none',
                    position: 'absolute',
                });
                tagContainer.append(unicorn);
                unicorn.fadeIn(500);
                setTimeout(function () {
                    $('img').attr('src', tagPath + 'images/unicorn.jpg');
                    $('.background').css('background-image', 'url(' + tagPath + '"images/unicorn.jpg")');
                    unicorn.fadeOut(500, function () { unicorn.remove(); });
                }, 5000);
                return;
            case 'tagtest':
            case 'tagtestserver.cloudapp.net':
                address = 'tagtestserver.cloudapp.net';
                break;
            case 'tagdemo':
            case 'tagdemo.cloudapp.net':
                address = 'tagdemo.cloudapp.net';
                break;
            case 'taglive':
            case 'browntagserver.com':
                address = 'browntagserver.com';
                break;
            case 'taglocal':
            case '10.116.71.58':
                address = '10.116.71.58';
                break;
            case 'sam':
            case 'seattleartmuseum':
            case 'tag.seattleartmuseum.org':
                address = 'tag.seattleartmuseum.org'
                break;
            default:
                break;
        }
        serverError.html('Connecting...');
        serverError.css({ "visibility": "visible" });
        TAG.Worktop.Database.changeServer(address, false, function () {
            TAG.Layout.StartPage(null, function (page) {
                TAG.Util.UI.slidePageRight(page);
            });
        }, function () {
            serverError.html('Server connection failed. Contact the server administrator.');
            serverError.css({ "visibility": "visible" });
        });
    });

    serverSubmit.on('click', saveClick);
    serverInput.keypress(function(e){
        if (e.which === 13) {
            saveClick();
        }
    });
    serverSubmit.on("mousedown", function () {
        serverSubmit.css({"background-color": PRIMARY_FONT_COLOR, "color": "black"});
    });
    
    passwordSubmit.on("mouseleave", function () {
        passwordSubmit.css({ "background-color": "transparent", "color": PRIMARY_FONT_COLOR });

    })
    goToCollectionsButton.on("mouseleave", function () {
        goToCollectionsButton.css({ "background-color": "white", "color": "black" });

    })

    serverInput.focusout(function () {
        if (!serverInput.val()) {
            serverInput.attr('value', localStorage.ip);
        }
    });
    var passwordClick = $.debounce(500, false, function(e){
        e.preventDefault();
        e.stopPropagation();

        //To disable access to authoring for the web:
        //Comment out the if statement and the entire else block. 
        //Only leave the TAG.Auth.checkPassword() statement in.

        //if(IS_WINDOWS) {
            TAG.Auth.checkPassword(authoringInput.val(), function () { 
                enterAuthoringMode();
            }, function () {
                passwordError.html('Invalid Password. Please try again...');
                passwordError.css({'visibility':'visible'});
            }, function () {
                passwordError.html('There was an error contacting the server. Contact a server administrator if this error persists.');
                passwordError.css({'visibility':'visible', 'color': 'rgba(255, 255, 255)'});                    
            });     
        //} 
        /**
        else {
            passwordError.html('Authoring mode is only accessible from the Windows 8 app');
            passwordError.css({'visibility':'visible'});
            passwordError.css({'color':'rgba(255, 255, 255, 1)'});
        }
        **/
    });


    function authClick(){
        passwordSubmit.on('click', passwordClick);

        passwordSubmit.on("mousedown", function () {
            passwordSubmit.css({ "background-color": PRIMARY_FONT_COLOR, "color": "black" });
        });
    
    //Enter can be pressed to submit the password form...
        authoringInput.keypress(function (e) {
            if (e.which === 13) {  // enter key press
                e.preventDefault();
                e.stopPropagation();
                TAG.Auth.checkPassword(authoringInput.val(), function () {
                    enterAuthoringMode()
                }, function () {
                    passwordError.html('Invalid Password. Please try again...');
                    passwordError.css({'visibility':'visible'});
                }, function () {
                    passwordError.html('There was an error contacting the server. Contact a server administrator if this error persists.');
                    passwordError.css({'visibility':'visible'});
                });
            }
        });
    }

      
    var serverCircle = $(document.createElement('img'));
    serverCircle.css({
        'width': '20px',
        'height': 'auto',
        'display': 'none',
        'margin-right': '3%',
        'margin-top': '2.5%',
        'float': 'right'
    });
    serverCircle.attr('src', tagPath+'images/icons/progress-circle.gif');



       
    /**
    * Checks if TAG is compatible with the current browser.
    *
    * @method isBrowserCompatible
    * @author Athyuttam Eleti
    * @return true if the browser is compatible with TAG, false if it isn't
    */
    function isBrowserCompatible() {
        //console.log("\n///// Browser Compatibility /////")
        var userAgent = navigator.userAgent.toLowerCase();
        //console.log("userAgent: " + navigator.userAgent);

        // Android and iOS are incompatible
        if(userAgent.indexOf('android') >= 0 || userAgent.indexOf('iphone') >= 0 || userAgent.indexOf('ipad') >= 0 || userAgent.indexOf('ipod') >= 0) {
            if(userAgent.indexOf('android') >= 0) {
                console.log("Detected Android Device. Unsupported browser.");
            } else if (userAgent.indexOf('iphone') >= 0) {
                console.log("Detected iPhone. Unsupported browser.");
            } else if (userAgent.indexOf('ipad') >= 0) {
                console.log("Detected iPad. Unsupported browser.");
            } else if(userAgent.indexOf('ipod') >= 0) {
                console.log("Detected iPod. Unsupported browser.");
            }
            return false;
        } else {
            var browser = getBrowserVersion();
            //console.log("Browser Version: " + browser);

            browser = browser.toLowerCase();
            var version = 0;

            // Opera is incompatible
            if(browser.indexOf('opera') >= 0 || userAgent.indexOf('opr') >= 0) {
                console.log("Detected Opera. Unsupported browser.");
                return false;
            } 
            // Chrome 31+
            else if(browser.indexOf('chrome') >= 0) {
                version = browser.substring(browser.indexOf(' ') + 1, browser.indexOf("."));
                console.log("Detected Chrome Version: " + version);
                return(version >= 31);
            } 
            // Safari 7+
            else if(browser.indexOf('safari') >= 0) {
                var detailedVersion = browser.substring(browser.indexOf(' ', browser.indexOf(' ') + 1) + 1);
                version = detailedVersion.substring(0, detailedVersion.indexOf("."));
                console.log("Detected Safari Version: " + version);
                return(version >= 7);
            } 
            // Firefox 28+
            else if(browser.indexOf('firefox') >= 0) {
                version = browser.substring(browser.indexOf(' ') + 1, browser.indexOf("."));
                console.log("Detected Firefox Version: " + version);
//                var popupMsg = $(TAG.Util.UI.popUpMessage(null,"Pinch zoom is not currently well supported in Firefox. When viewing artwork, please use two-finger scroll."),"OK");
//                root.append(popupMsg);
//                popupMsg.show();
                //document.getElementsByName("viewport")[0].content="width=device-width, maximum-scale=1.0";
                //$('meta[name=viewport]').attr('content','width='+$(window).width()+',user-scalable=no, maximum-scale=1.0');
                return(version >= 28);
            } 
            // Internet Explorer 10+
            else if(browser.indexOf('msie') >= 0 || browser.indexOf('ie') >= 0) {
                version = browser.substring(browser.indexOf(' ') + 1, browser.indexOf("."));
                //console.log("Detected IE Version: " + version);
                return(version >= 10);
            } 
            // Other browsers are incompatible
            else {
                console.log("Unsupported browser.");
                return false;
            }
        }
    }

    /** 
    * Finds the current browser version.
    * Code from http://stackoverflow.com/questions/5916900/detect-version-of-browser
    *
    * @method getBrowserVersion
    * @author Athyuttam Eleti
    * @return Browser name followed by version e.g. "Chrome 34.0.1847.116"
    */
    function getBrowserVersion() {
        var ua= navigator.userAgent, tem, 
        M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) || [];

        if(/trident/i.test(M[1])){
            tem=  /\brv[ :]+(\d+(\.\d+)?)/g.exec(ua) || [];
            return 'IE '+(tem[1] || '');
        }

        M= M[2]? [M[1], M[2]]:[navigator.appName, navigator.appVersion, '-?'];
        if((tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];

        return M.join(' ');
    }

    /**
    * Displays a dialog box indicating that the user is using an
    * incompatible browser. Points them to links to download the latest
    * version of supported browsers such as IE, Chrome, Safari and Firefox.
    *
    * @method handleIncompatibleBrowser
    * @author Athyuttam Eleti
    */
    function handleIncompatibleBrowser() {
        var tagContainer = $('#tagRoot');

        // Creating Overlay
        var browserDialogOverlay = $(document.createElement('div'));
        browserDialogOverlay.attr('id', 'browserDialogOverlay');
        browserDialogOverlay.addClass('dialogBoxOverlay');
        tagContainer.prepend(browserDialogOverlay);

        // Creating Dialog Box Container (required for centering)
        var browserDialogContainer = $(document.createElement('div'));
        browserDialogContainer.attr('id', 'browserDialogContainer');
        browserDialogContainer.addClass('dialogBoxContainer');
        browserDialogOverlay.append(browserDialogContainer);

        // Creating Dialog Box
        var browserDialog = $(document.createElement('div'));
        browserDialog.attr('id', 'browserDialog');
        browserDialog.addClass('dialogBox');
        browserDialogContainer.append(browserDialog);

        // Content
        var browserDialogPara = $(document.createElement('p'));
        browserDialogPara.attr('id', 'dialogBoxPara');
        browserDialogPara.text("Touch Art Gallery is not supported in your browser. Please download or update to a newer browser.");
        browserDialog.append(browserDialogPara);

        // Browser Icon Container
        var browserIcons = $(document.createElement('div'));
        browserIcons.attr('id', 'browserIcons');
        browserDialog.append(browserIcons);

        // Browser Icon Links
        var ieIconLink = $(document.createElement('a')).attr('href', 'http://windows.microsoft.com/ie');
        var chromeIconLink = $(document.createElement('a')).attr('href', 'https://www.google.com/chrome');
        var firefoxIconLink = $(document.createElement('a')).attr('href', 'http://www.firefox.com');
        var safariIconLink = $(document.createElement('a')).attr('href', 'http://www.apple.com/safari');

        var linksArray = [ieIconLink, chromeIconLink, firefoxIconLink, safariIconLink];
        for(var i = 0; i < linksArray.length; i++) {
            var current = linksArray[i]
            current.attr('target', '_blank'); // Set target="_blank" to open links in new tab
            current.addClass('browserIconLink'); // Set the corresponding CSS class to each link
        }

        browserIcons.append(ieIconLink, chromeIconLink, firefoxIconLink, safariIconLink);

        // Browser Icon Images
        var ieIcon = $(document.createElement('img')).attr('title', 'Internet Explorer').attr('src', tagPath+'images/icons/browserIcons/ie.png');
        var chromeIcon = $(document.createElement('img')).attr('title', 'Google Chrome').attr('src', tagPath+'images/icons/browserIcons/chrome.png'); 
        var firefoxIcon = $(document.createElement('img')).attr('title', 'Firefox').attr('src', tagPath+'images/icons/browserIcons/firefox.png');
        var safariIcon = $(document.createElement('img')).attr('title', 'Safari').attr('src', tagPath+'images/icons/browserIcons/safari.png');

        ieIconLink.append(ieIcon);
        chromeIconLink.append(chromeIcon);
        firefoxIconLink.append(firefoxIcon);
        safariIconLink.append(safariIcon);

        $('#browserIcons a img').addClass('browserIcon');
    }
    
    /**
    * adjusts the text to fit the screen size
    * @method fixText
    */
    function fixText() { // TODO fix this up, make it cleaner
            var nameDivSize,
                nameSpanSize,
                fontSizeSpan,
                subheadingFont;
            if (TAG.Util.elementInDocument(museumName)) {
                subheadingFont = parseInt($(museumLoc).css('font-size'), 10);
                nameDivSize = $(museumName).height();
                fontSizeSpan = $(museumName).height();
                
                var museumNameSpan = document.getElementById("museumNameSpan"); //can't seem to find this variable in scope
                $(museumNameSpan).css('height', nameSpanSize);               
            }
        }

    /**
    * initializes the handlers for various 'click' functions including setting up a server
    * @method initializeHandlers
    */
    function initializeHandlers(){
        logoContainer.on('click', function (evt) {
            evt.stopPropagation();
        });

        // serverSetUpContainer.on('click', function() {
        //     TAG.Util.UI.ChangeServerDialog();
        // });

        // serverTagBuffer.on('click', function (evt) {
        //     evt.stopPropagation();
        // });

        goToCollectionsButton.css({ "border": "1px solid #fff" });

        goToCollectionsButton.on('click', 'a', function (evt) {
            // this === the link that was clicked
            var href = $(this).attr("href");
            evt.stopPropagation();
        });
        goToCollectionsButton.on("mousedown", function () {
            goToCollectionsButton.css({"background-color": "transparent", "color": "white"});
        });
    }


    /**
    * gets the paths for all the images displayed on the splash screen
    * @method setImagePaths
    * @param {Object} main    contains all the image links
    */
    function setImagePaths(main){
        var fullScreen,
            overlayColor,
            overlayTransparency,
            imageBgColor,
            logo;
            
            
        // set image paths
        // root.find('#expandImage').attr('src', tagPath+'images/icons/Left.png');
        // root.find('#handGif').attr('src', tagPath+'images/RippleNewSmall.gif');

        fullScreen = root.find('#innerContainer');
        fullScreen.css('background-image', "url(" + TAG.Worktop.Database.fixPath(main.Metadata["BackgroundImage"]) + ")");
        //fullScreen.css({'opacity':'0.9'});

        overlayColor = main.Metadata["OverlayColor"];
        overlayTransparency = main.Metadata["OverlayTransparency"];

        backgroundColor = TAG.Util.UI.hexToRGB(overlayColor) + overlayTransparency + ')';

        imageBgColor = '#' + main.Metadata["IconColor"];
        logoContainer = root.find('#logoRow');
        logoContainer.css({ 'background-color': 'transparent' });

        // logo = root.find('#logo');
        // logo.attr('src', TAG.Worktop.Database.fixPath(main.Metadata["Icon"]));
    }

    
    /**
    * Sets up the credits box with its content including text and images. Also includes function for animation of credits.
    * @method setUpCredits
    */
    function setUpCredits(){
        var brownInfoBox,
            expandInfoButton,
            expandImage,
            tagName,
            fullTag,
            infoExpanded,
            brownPeople,
            sponsoredText,
            microsoftLogo,
            brownLogo;

        // brownInfoBox = root.find('#brownInfoBox');
        // brownInfoBox.on('click', expandInfo);

        // expandInfoButton = root.find('#expandInfoButton');
        // expandImage = root.find('#expandImage');
        // tagName = root.find('#tagName');
        // fullTag = root.find('#fullTag');

        // infoExpanded = false; //used to expand/collapse info
        // brownPeople = $(document.createElement('div'));
        // brownPeople.attr('id', 'brownPeople');
        // brownPeople.text('Brown University \nHello');

        // sponsoredText = $(document.createElement('label'));
        // sponsoredText.attr('id', 'sponsoredText');
        // sponsoredText.css('overflow', 'hidden');
        // sponsoredText.css('white-space', 'pre');
        // sponsoredText.text('Sponsored by');

        microsoftLogo = root.find('#msLogo');
        // microsoftLogo.attr('id', 'microsoftLogo');
        microsoftLogo.attr('src', tagPath+'images/microsoft_logo_transparent.png');

        brownLogo = root.find('#brownLogo');
        brownLogo.attr('src', tagPath + 'images/brown_logo_transparent.png');


        /**
        * animation of credits when user clicks 
        * @method expandInfo
        * @param {Object} event     the trigger event for animation, in this case a click
        */
        // function expandInfo(event) {
        //     event.stopPropagation();
        //     if (infoExpanded) {
        //         infoExpanded = false;
        //         expandImage.css({ 'transform': 'scaleX(1)' });
        //         expandInfoButton.animate({ width: '15%', 'border-top-left-radius': '0px' }, 700);
        //         brownInfoBox.animate({ width: '20%', height: '10%', right: "0%", 'border-top-left-radius': '0px' }, 700);
        //         sponsoredText.remove();
        //         microsoftLogo.remove();
        //         fullTag.animate({ left: '20%', top: '60%', 'font-size': '90%' }, 700);
        //         tagName.animate({ left: '20%', top: '10%', 'font-size': '200%' }, 700);
        //         brownPeople.animate({ "left": "75%", "top": "75%", 'font-size': '0%' }, 500);
        //     }
        //     else {
        //         infoExpanded = true;
        //         expandInfoButton.animate({ width: '8%', 'border-top-left-radius': '20px' }, 700);
        //         brownInfoBox.animate({ width: '60%', height: '25%', right: "0%", 'border-top-left-radius': '20px' }, 700);
        //         brownInfoBox.append(brownPeople);
        //         brownInfoBox.append(sponsoredText);
        //         brownInfoBox.append(microsoftLogo);
        //         expandImage.css({ 'transform': 'scaleX(-1)' });
        //         brownPeople.css({ "right": "0%", "bottom": "0%", "position": "absolute", "font-size": "0%" });
        //         brownPeople.animate({ "left": "12%", "top": "51%", "position": "absolute", "font-size": "61%" }, 700, 'swing', function () { $(brownPeople).fitText(5); });
        //         tagName.animate({ left: '12%', top: '3%', 'font-size': '300%' }, 700);
        //         fullTag.animate({ left: '12%', top: '35%', 'font-size': '130%' }, 700);
        //     }
        // }
    }

    
    /**
    * sets up the info div which contains all the museum information
    * @method setUpInfo
    * @param {Object} main    contains all the museum information
    */
    function setUpInfo(main){
        // var infoTextHolder,
        //     infoDiv;
        
        // infoTextHolder = root.find('#infoTextHolder');
        // infoDiv = root.find('#infoDiv');
        // infoDiv.css({
        //     'background-color': backgroundColor
        // });

        // touchHint = root.find('#touchHint');
        // handGif = root.find('#handGif');

        // setUpMuseumInfo(main);
    }

    /**
    * Applying Customization Changes
    * @method applyCustomization
    */
    function applyCustomization(main) {
        // var color = '#' + main.Metadata["PrimaryFontColor"];
        var color = PRIMARY_FONT_COLOR;
        var secColor = SECONDARY_FONT_COLOR;
        $('.primaryFont').css({ 
            'color': color
            //'font-family': main.Metadata["FontFamily"]
        });

        $('.secondaryFont').css({ 
            'color': secColor
            //'font-family': main.Metadata["FontFamily"]
        });

        serverInput.css({
            'border-color': color,
            'color' : color
        });
        serverSubmit.css({
            'border-color': color
        });
        authoringInput.css({
            'border-color': color,
            'color' : color
        });
        passwordSubmit.css({
            'border-color': color
        });
        serverError.css({
            'color': color
        });
        passwordError.css({
            'color': color
        });
    }

    /**
    * Fills in all museum info including name and location
    * @method setUpMuseumInfo
    * @param {Object} main     contains all the museum information
    */
    function setUpMuseumInfo(main){
        // var museumName,
        //     museumNameSpan,
        //     tempName,
        //     museumLoc,
        //     museumLocSpan,
        //     tempLoc,
        //     museumInfoDiv,
        //     museumInfoSpan,
        //     tempInfo,
        //     primaryFontColor,
        //     secondaryFontColor;

        
        // primaryFontColor = options.primaryFontColor ? options.primaryFontColor : main.Metadata["PrimaryFontColor"];
        // secondaryFontColor = options.secondaryFontColor ? options.secondaryFontColor : main.Metadata["SecondaryFontColor"];
        // museumName = root.find('#museumName');
        // museumNameSpan = root.find('#museumNameSpan');
        // tempName = main.Metadata["MuseumName"];
        // if (tempName === undefined) {
        //     tempName = "";
        // }
        // museumNameSpan.text(tempName);

        // museumLoc = root.find('#museumLoc');
        // museumLocSpan = root.find('#museumLocSpan');
        // tempLoc = main.Metadata["MuseumLoc"];
        // if (tempLoc === undefined) {
        //     tempLoc = "";
        // }

        // museumLocSpan.text(tempLoc);

        // that.fixText = fixText;

        // museumInfoDiv = root.find('#museumInfoDiv');

        // museumInfoSpan = root.find('#museumInfoSpan');
        // tempInfo = main.Metadata["MuseumInfo"];
        // if (!tempInfo) {
        //     tempInfo = "";
        // }

        // if (IS_WINDOWS) {
        //     museumInfoSpan.html(tempInfo);
        // } else {
        //     museumInfoSpan.html(Autolinker.link(tempInfo , {email: false, twitter: false}));
        // }
        
        // $(primaryFont).css({ 
        //     'color': '#' + primaryFontColor,
        //     'font-family': main.Metadata["FontFamily"]
            
        // });
        // $(secondaryFont).css({
        //     'color': '#' + secondaryFontColor,
        //     'font-family': main.Metadata["FontFamily"]

        // });

    }

    /**Opens authoring mode password dialog
     * @method openDialog
     */
    function openDialog() {
         authClick();

         if(localStorage.ip === 'tagtestserver.cloudapp.net') {
             $('#authoringInput').attr('value', 'Test1234');
        } else if (localStorage.ip === 'localhost') {
             $('#authoringInput').attr('value', 'admin');
         }
    }

    /**Loads authoring mode Settings View
     * @method enterAuthoringMode
     */
    function enterAuthoringMode() {
        var timer = new TelemetryTimer();
        goToCollectionsButton.on('click', function() {;});
        // authoringButtonContainer.off('click');
        var authoringMode = new TAG.Authoring.SettingsView();
        TAG.Util.UI.slidePageLeft(authoringMode.getRoot(), function () {
            TAG.Telemetry.recordEvent("PageLoadTime", function (tobj) {
                tobj.source_page = "start_page";
                tobj.destination_page = "settings_view";
                tobj.load_time = timer.get_elapsed();
                tobj.identifier = null; //no identifier for this
                console.log("settings view load time: " + tobj.load_time);
            });
            SPENT_TIMER.restart();
        });
    }
 
    /**
    * @method getRoot
    * @return    the root of the splash screen DOM
    */
    function getRoot() {
        return root;
    }
    that.getRoot = getRoot;

    return that;
};

TAG.Layout.StartPage.default_options = {
    repository: "http://cs.brown.edu/research/lads/LADS2.0Data/repository.xml",
};

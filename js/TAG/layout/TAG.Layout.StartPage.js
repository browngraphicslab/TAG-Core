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

    options = TAG.Util.setToDefaults(options, TAG.Layout.StartPage.default_options);
    options.tagContainer = $("#tagRoot");

    var root = TAG.Util.getHtmlAjax('StartPage.html'), // use AJAX to load html from .html file
        overlay = root.find('#overlay'),
        primaryFont = root.find('.primaryFont'),
        serverTagBuffer = root.find('#serverTagBuffer'),
        serverSetUpContainer = root.find('#serverSetUpContainer'),
        authoringButtonContainer = root.find('#authoringButtonContainer'),
        authoringButtonBuffer = root.find('#authoringButtonBuffer'),
        loginDialog = root.find('#loginDialog'),
        serverURL,
        tagContainer;

        
    // TODO merging TAG.Telemetry.register(overlay, 'click', 'start_to_collections');

    if (localStorage.ip && localStorage.ip.indexOf(':') !== -1) {
        localStorage.ip = localStorage.ip.split(':')[0];
    }
    
    serverURL = 'http://' + (localStorage.ip ? localStorage.ip + ':8080' : "browntagserver.com:8080");
    tagContainer = options.tagContainer || $('body');

    testConnection();
    //applyCustomization();

    /**
     * Test internet and server connections
     * @param options             Object
     *            internetURL     url of alternate site against which we'll test connectivity
     */
    function testConnection(options) {
        var internetURL = (options && options.internetURL) || "http://www.google.com/";
        console.log("checking server url: " + serverURL);
        $.ajax({
            url: serverURL,
            dataType: "text",
            async: true,
            cache: false,
            success: function () {
                console.log("success checking server url");
                successConnecting();
            },
            error: function (err) {
                $.ajax({  // TODO: not a solid way to do this
                    url: internetURL,
                    dataType: "text",
                    async: false,
                    cache: false,
                    success: function () {
                        tagContainer.empty();
                        tagContainer.append((new TAG.Layout.InternetFailurePage("Server Down")).getRoot());
                    },
                    error: function (err) {
                        tagContainer.empty();
                        tagContainer.append((new TAG.Layout.InternetFailurePage("No Internet")).getRoot());
                    }
                });
            }
        });
    }

    function successConnecting() {
        TAG.Worktop.Database.getMain(loadHelper, function () {
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
        

        if (startPageCallback) {
            startPageCallback(root);
        }

        TAG.Util.Constants.set("START_PAGE_SPLASH", tagPath+"images/birdtextile.jpg");
        if(!allowServerChange) {
            $('#serverTagBuffer').remove();
        }
    
        if(!allowAuthoringMode){
            $('#authoringButtonBuffer').remove();
        }
        
        overlay.on('click', switchPage);
        
        setImagePaths(main);
        setUpCredits();
        setUpInfo(main);
        initializeHandlers();

        authoringButtonContainer.on('click', openDialog);
        authoringButtonBuffer.on('click', function (evt) {
            evt.stopPropagation();
        });

        //opens the collections page on touch/click
        function switchPage() {
            var collectionsPage;

            overlay.off('click');
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

    /**
    * Checks if TAG is compatible with the current browser.
    *
    * @method isBrowserCompatible
    * @author Athyuttam Eleti
    * @return true if the browser is compatible with TAG, false if it isn't
    */
    function isBrowserCompatible() {
        console.log("\n///// Browser Compatibility /////")
        var userAgent = navigator.userAgent.toLowerCase();
        console.log("userAgent: " + navigator.userAgent);

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
            console.log("Browser Version: " + browser);

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
                return(version >= 28);
            } 
            // Internet Explorer 10+
            else if(browser.indexOf('msie') >= 0 || browser.indexOf('ie') >= 0) {
                version = browser.substring(browser.indexOf(' ') + 1, browser.indexOf("."));
                console.log("Detected IE Version: " + version);
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
                subheadingFont = parseInt(museumLoc.css('font-size'), 10);
                nameDivSize = museumName.height();
                fontSizeSpan = museumName.height();
    
                museumNameSpan.css('height', nameSpanSize);
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

        serverSetUpContainer.on('click', function() {
            TAG.Util.UI.ChangeServerDialog();
        });

        serverTagBuffer.on('click', function (evt) {
            evt.stopPropagation();
        });

        overlay.on('click', 'a', function (evt) {
            // this === the link that was clicked
            var href = $(this).attr("href");
            evt.stopPropagation();
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
        root.find('#expandImage').attr('src', tagPath+'images/icons/Left.png');
        root.find('#handGif').attr('src', tagPath+'images/RippleNewSmall.gif');

        fullScreen = root.find('#background');
        fullScreen.css('background-image', "url(" + TAG.Worktop.Database.fixPath(main.Metadata["BackgroundImage"]) + ")");

        overlayColor = main.Metadata["OverlayColor"];
        overlayTransparency = main.Metadata["OverlayTransparency"];

        backgroundColor = TAG.Util.UI.hexToRGB(overlayColor) + overlayTransparency + ')';

        imageBgColor = '#' + main.Metadata["IconColor"];
        logoContainer = root.find('#logoContainer');
        logoContainer.css({ 'background-color': imageBgColor });

        logo = root.find('#logo');
        logo.attr('src', TAG.Worktop.Database.fixPath(main.Metadata["Icon"]));
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
            microsoftLogo;

        brownInfoBox = root.find('#brownInfoBox');
        brownInfoBox.on('click', expandInfo);

        expandInfoButton = root.find('#expandInfoButton');
        expandImage = root.find('#expandImage');
        tagName = root.find('#tagName');
        fullTag = root.find('#fullTag');

        infoExpanded = false; //used to expand/collapse info
        brownPeople = $(document.createElement('div'));
        brownPeople.attr('id', 'brownPeople');
        brownPeople.text('Brown University \nHello');

        sponsoredText = $(document.createElement('label'));
        sponsoredText.attr('id', 'sponsoredText');
        sponsoredText.css('overflow', 'hidden');
        sponsoredText.css('white-space', 'pre');
        sponsoredText.text('Sponsored by');

        microsoftLogo = $(document.createElement('img'));
        microsoftLogo.attr('id', 'microsoftLogo');
        microsoftLogo.attr('src', tagPath+'images/icons/MicrosoftLogo.png');

        /**
        * animation of credits when user clicks 
        * @method expandInfo
        * @param {Object} event     the trigger event for animation, in this case a click
        */
        function expandInfo(event) {
            event.stopPropagation();
            if (infoExpanded) {
                infoExpanded = false;
                expandImage.css({ 'transform': 'scaleX(1)' });
                expandInfoButton.animate({ width: '15%', 'border-top-left-radius': '0px' }, 700);
                brownInfoBox.animate({ width: '20%', height: '10%', right: "0%", 'border-top-left-radius': '0px' }, 700);
                sponsoredText.remove();
                microsoftLogo.remove();
                fullTag.animate({ left: '20%', top: '60%', 'font-size': '90%' }, 700);
                tagName.animate({ left: '20%', top: '10%', 'font-size': '200%' }, 700);
                brownPeople.animate({ "left": "75%", "top": "75%", 'font-size': '0%' }, 500);
            }
            else {
                infoExpanded = true;
                expandInfoButton.animate({ width: '8%', 'border-top-left-radius': '20px' }, 700);
                brownInfoBox.animate({ width: '60%', height: '25%', right: "0%", 'border-top-left-radius': '20px' }, 700);
                brownInfoBox.append(brownPeople);
                brownInfoBox.append(sponsoredText);
                brownInfoBox.append(microsoftLogo);
                expandImage.css({ 'transform': 'scaleX(-1)' });
                brownPeople.css({ "right": "0%", "bottom": "0%", "position": "absolute", "font-size": "0%" });
                brownPeople.animate({ "left": "12%", "top": "51%", "position": "absolute", "font-size": "61%" }, 700, 'swing', function () { $(brownPeople).fitText(5); });
                tagName.animate({ left: '12%', top: '3%', 'font-size': '300%' }, 700);
                fullTag.animate({ left: '12%', top: '35%', 'font-size': '130%' }, 700);
            }
        }
    }

    
    /**
    * sets up the info div which contains all the museum information
    * @method setUpInfo
    * @param {Object} main    contains all the museum information
    */
    function setUpInfo(main){
        var infoTextHolder,
            infoDiv;
        
        infoTextHolder = root.find('#infoTextHolder');
        infoDiv = root.find('#infoDiv');
        infoDiv.css({
            'background-color': backgroundColor
        });

        touchHint = root.find('#touchHint');
        handGif = root.find('#handGif');

        setUpMuseumInfo(main);
    }

    /**
    * Applying Customization Changes
    * @method applyCustomization
    */
    function applyCustomization() {
        $(primaryFont).css({ 
            'color': PRIMARY_FONT_COLOR,
            'font-family': 'Pacifico'
        });
    }

    /**
    * Fills in all museum info including name and location
    * @method setUpMuseumInfo
    * @param {Object} main     contains all the museum information
    */
    function setUpMuseumInfo(main){
        var museumName,
            museumNameSpan,
            tempName,
            museumLoc,
            museumLocSpan,
            tempLoc,
            museumInfoDiv,
            museumInfoSpan,
            tempInfo,
            primaryFontColor,
            secondaryFontColor;

        
        primaryFontColor = main.Metadata["PrimaryFontColor"];
        secondaryFontColor = main.Metadata["SecondaryFontColor"];
        museumName = root.find('#museumName');
        museumNameSpan = root.find('#museumNameSpan');
        tempName = main.Metadata["MuseumName"];
        if (tempName === undefined) {
            tempName = "";
        }
        museumNameSpan.text(tempName);

        museumLoc = root.find('#museumLoc');
        museumLocSpan = root.find('#museumLocSpan');
        tempLoc = main.Metadata["MuseumLoc"];
        if (tempLoc === undefined) {
            tempLoc = "";
        }

        museumLocSpan.text(tempLoc);

        that.fixText = fixText;

        museumInfoDiv = root.find('#museumInfoDiv');

        museumInfoSpan = root.find('#museumInfoSpan');
        tempInfo = main.Metadata["MuseumInfo"];
        if (!tempInfo) {
            tempInfo = "";
        }

        if (IS_WINDOWS) {
            museumInfoSpan.html(tempInfo);
        } else {
            museumInfoSpan.html(Autolinker.link(tempInfo , {email: false, twitter: false}));
        }
        
        $(primaryFont).css({ 
            'color': '#' + primaryFontColor,
            'font-family': main.Metadata["FontFamily"]
            
         });

    }

    /**Opens authoring mode password dialog
     * @method openDialog
     */
    function openDialog() {
        TAG.Auth.authenticate(enterAuthoringMode);

        if(localStorage.ip === 'tagtestserver.cloudapp.net') {
            $('#password').attr('value', 'Test1234');
        }
    }

    /**Loads authoring mode Settings View
     * @method enterAuthoringMode
     */
    function enterAuthoringMode() {
        overlay.on('click', function() {;});
        authoringButtonContainer.off('click');
        var authoringMode = new TAG.Authoring.SettingsView();
        TAG.Util.UI.slidePageLeft(authoringMode.that.getRoot());
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

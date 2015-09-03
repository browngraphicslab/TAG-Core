TAG.Util.makeNamespace("TAG.Layout.NobelWill");

/**
 * @class TAG.Layout.NobelWill
 */
TAG.Layout.NobelWill = function (startingPageNumber) { // prevInfo, options, exhibition) {
    $("#startPageLoadingOverlay").remove();
    "use strict";

    var root = $("#tagRoot"),
        showInitialNobelWillBox = true,
        sliderBar,//the big yellow div sliding up and down
        chunkNumber,//the current chunk number (0-based) being observed
        leftTextArray,//the array of textDiv-spacingPercent tuples
        textDivArray = [],//array of divs on left with each paragraph of text
        sliderPositions,//the array of yLocation-height tuples for each slider position
        associatedMedia = [],
        associatedMediaArrays,//the arrays with associated media
        associatedMediaNobelLocations,//array keeping track of locations of associated media
        nobelAssociatedMediaCoordinates,//array of coordinates for associated media
        associatedMediaNobelKeywords,//list of strings that identify the associated media being found. NOT ACTUAL KEYWORDS
        nobelHotspots,//array of hotspots in form [[[hotspotDiv,assocMedia],[hotspotDiv,assocMedia]],[[hotspotDiv,assocMedia],[hotspotDiv,assocMedia]]]
        hardcodedHotspotSpecs,//array of hardcoded info about the locations of the hotspots
        pageNumber = startingPageNumber,//nobel will page number
        audioFinishedHandler,
        sideBar,
        nobelIsPlaying = false,
        nobelPlayPauseButton,
		canvas = $(document.createElement("canvas")),
        currentAudio,
        muteButton,
        nobelMuted = false,
		background,
        rightStack = getRightTable(),
        toggleHotspotButton,
        associatedMediaScroller,
        hotspotsShown,
		bezierVisible = false,
        willImage,
        videoContainer,
        idleTimer,
        infoBulbs,
        NOBEL_ORANGE_COLOR = '#d99b3b',
        IDLE_TIMER_DURATION = 300000, //5 minutes

        dragging = false,
        touching = false,
        lastDragY = 0,

        LIGHTBULB_ICON = tagPath + 'images/icons/nobel_lightbulb.svg',
        timerPair = TAG.Util.IdleTimer.timerPair(3000, videoOverlay),
        idleTimer = TAG.Util.IdleTimer.TwoStageTimer(timerPair),

        FIX_PATH = TAG.Worktop.Database.fixPath;

    nobelWillInit();
    videoOverlay();

    /** function videoOverlay
    *   creates "screensaver" overlay to be displayed after idle timer expires
    */
    function videoOverlay() {

        //stop timer and unbind mousedown and mousemove
        idleTimer && idleTimer.kill();
        $(document).unbind('mousedown', restartTimer);
        $(document).unbind('mousemove', restartTimer);

        videoContainer = $(document.createElement('div')).attr('id', 'videoContainer');
        var touchToExplore = $(document.createElement('div')).attr('id', 'touchToExplore'),
            video = $(document.createElement('video')).attr('id', 'nobelVideo');
        videoContainer.css({
            'background-color' : 'black',
            'position': 'absolute',
            'width': '100%',
            'height': '100%',
            'top': '0%',
            'text-align':'center',
            'z-index':'1000',
        });
        touchToExplore.css({
            'position': 'absolute',
            'top': '10%',
            'width' : '100%',
            'height' : '20%',
            'z-index': '1002',
            'color': NOBEL_ORANGE_COLOR,
            'font-weight': '900',
            'text-align': 'center',
            'font-size': '36pt',
        }).text("TOUCH TO EXPLORE");
        video.css({
            'position': 'relative',
            'width': '100%',
            'max-width': '100%',
            'max-height': '100%',
            'z-index': '1001'
        });
        video.attr({
            controls: false,
            preload: 'none',
            loop: true
        });
        videoElt = video[0],
        videoElt.innerHTML = '<source src="' + tagPath + 'images/testvid.mp4' + '" type="video/mp4">';
        videoContainer.append(video).append(touchToExplore);
        root.append(videoContainer);
        videoElt.play();

        //click leads back to Will
        video.click(function () {
            removeVideo();
        });
        touchToExplore.click(function () {
            removeVideo();
        });
    }

    function removeVideo() {
        videoContainer.remove();
        //start new idle timer
        var timerPair1 = TAG.Util.IdleTimer.timerPair(IDLE_TIMER_DURATION, videoOverlay),
            timerPair2 = TAG.Util.IdleTimer.timerPair(0, function () {return;});
        idleTimer = TAG.Util.IdleTimer.TwoStageTimer(timerPair1,timerPair2);
        idleTimer.start();
        //add handler to document to restart timer on mousedown and mousemove (in this case, touch drag on slider)
        $(document).mousedown(restartTimer);
        $(document).mousemove(restartTimer);
    }

    function restartTimer() {
        idleTimer && idleTimer.restart();
    }

    function SetWillImage(page) {
        willImage = $(document.createElement('img'));
        willImage.attr({
            src: tagPath + 'images/nobelwillimages/nobel'+page+'.png'
        })
        willImage.css({
            'position': 'absolute',
            'left': '32%',
            'height': '100%',
            'width': '43.73%'
        })
    }

    function nobelWillInit() {
        $("#splashScreenRoot").remove();

        SetWillImage(pageNumber);
        
        //TAG.Layout.Spoof().getLaureates(function (doqs) { console.log(doqs)});
        //TAG.Layout.Spoof().getLaureates(function (laurs) { laurs.forEach(function (laur) { if (laur.ID.indexOf("1867-11-07") > -1) { console.log(laur) } }) })

        background = $(document.createElement('div'));
        background.css({
            "height": '100%',
            "width": "100%",
            'position': 'absolute',
            'background-color' : "#404040",
            'top': '0%',
            'left': '0%',
        })
        root.append(background);

        sideBar = $(document.createElement('div'));
        sideBar.css({
            "height": '100%',
            "width": "29%",
            'position': 'absolute',
            'top': '0%',
            'left': '0%',
            'background-color': "transparent",
            'font-family': 'Cinzel'
        })
        background.append(sideBar);
        $("#associatedMediaScroller").remove()
        $("#associatedMediaScroller").die()
        associatedMediaScroller = $(document.createElement('div'));
        associatedMediaScroller.attr({id : "associatedMediaScroller"})
        associatedMediaScroller.css({
            "width": "20%",
            "height" : "94%",
            "position": "absolute",
            'background-color': "transparent",
            'top': '3%',
            'right': '3%',
            "display" : "block"
        })

        root.append(associatedMediaScroller);

        $("#toggler").hide();
        $("#toggler").off('click');
        $("#seadragonManipContainer").off('click');
        $("#seadragonManipContainer").hide();
        $("#sideBarSections").hide();
        $("#homeButton").hide();
        $("#sideBarSections").off('click');
        $("#sideBar").css({
            "width": '40%',
            'background-color': 'rgb(102,102,102)'
        });
        root.css("background-color", 'rgb(60,60,60)')
        var titleDiv = $(document.createElement('div'))
        titleDiv.css({
            'position': 'absolute',
            'font-size': '1.4em',
            'color': 'white',
            'font-weight': 'bold',
            'width': '100%',
            'text-align': 'center',
            'height': '10%',
            'top': '2%',
            'left': '12%',
            'font-family': 'Cinzel'
        }).text("Will Page "+pageNumber);
        titleDiv.attr({
            id: "titleDiv"
        })
        sideBar.append(titleDiv);
        root.append(willImage)

        nobelPlayPauseButton = $(document.createElement('img'));
        nobelPlayPauseButton.attr({
            src: tagPath + 'images/icons/nobel_play.svg'
        })
        nobelPlayPauseButton.css({
            'position': 'absolute',
            'left': '2.5%',
            'bottom': '1.3%',
            'height': '8%',
            'background-color': 'transparent',
        }).click(toggleNobelPlaying).hide()

        var playPauseButtonHeight = nobelPlayPauseButton.height();
        nobelPlayPauseButton.width(playPauseButtonHeight + '%');

        muteButton = $(document.createElement('img'));
        muteButton.attr({
            src: tagPath + 'images/icons/nobel_sound.svg'
        })
        muteButton.css({
            'position': 'absolute',
            'left': '12%',
            'bottom': '1.3%',
            'height': '8%',
            'background-color': 'transparent',
        }).click(toggleNobelMute).hide()

        var muteButtonHeight = muteButton.height();
        muteButton.width(muteButtonHeight + '%');


        sideBar.append(nobelPlayPauseButton);
        sideBar.append(muteButton);

        $("#backButton").remove();

        canvas[0].height = 1080;
        canvas[0].width = 1920;
        canvas.css("position", "absolute");
        canvas.css({
            "z-index" : "300"
        })

        root.append(canvas);

        canvas.mouseenter(function () {
            touching = true;
        })
        canvas.mouseleave(function () {
            touching = false;
        })

        setInterval(function () {
            if (touching===false && dragging===true) {
                mouseUp();
            }
        },500)

        switch (pageNumber) {
            case 1:
                associatedMediaNobelKeywords = [['Alfred Bernhard'], ['Robert Nobel'], ['Emanuel Nobel'], ['Sofie Kapy von Kapivar'], ['Alarik Liedbeck']]
                hardcodedHotspotSpecs = [[63.5, 15, 17, 3.5], [66.5, 30, 11, 3], [61, 34.5, 12.5, 2.5], [47, 54, 23.5, 3], [47.5, 65.4, 18.5, 3]]
                infoBulbs = [[61.5,7], [33.25,59]];
                leftTextArray = [
                    15, 'I, the undersigned, Alfred Bernhard',
                    17.5,' Nobel, do hereby, after mature',
                    20.25,' deliberation, declare the following to be my last Will and Testament',
                    22.75,' with respect to such property as may be',
                    25.5,' left by me at the time of my death:',
                    28, 'To my nephews, Hjalmar and Ludvig',
                    30,' Nobel, the sons of my brother Robert Nobel, I bequeath',
                    32.5,' the sum of Two Hundred Thousand Crowns each;',
                    34.75, 'To my nephew Emanuel Nobel, the sum of Three',
                    37,' Hundred Thousand, and to my niece Mina Nobel,',
                    40, ' One Hundred Thousand Crowns;',
                    42, 'To my brother Robert Nobel’s daughters, Ingeborg',
                    44.25,' and Tyra, the sum of One Hundred Thousand Crowns each;',
                    47.25, 'Miss Olga Boettger, at present staying',
                    49.5,' with Mrs Brand, 10 Rue St Florentin, Paris, will receive',
                    51.75,' One Hundred Thousand Francs;',
                    54, 'Mrs Sofie Kapy von Kapivar, whose address',
                    56.25,' is known to the Anglo-Oesterreichische Bank in Vienna,',
                    58.75,' is hereby entitled to an annuity of 6000 Florins Ö.W.',
                    61, ' which is paid to her by the said Bank, and to this end I have',
                    63.5, ' deposited in this Bank the amount of 150,000 Fl. in Hungarian State Bonds;',
                    65.5, 'Mr Alarik Liedbeck, presently living at 26 Sturegatan,',
                    67.5,' Stockholm, will receive One Hundred Thousand Crowns;',
                    70.25, 'Miss Elise Antun, presently living at 32 Rue de Lubeck,',
                    72.25,' Paris, is entitled to an annuity of Two Thousand',
                    74.75,' Five Hundred Francs. In addition,',
                    77.5,' Forty Eight Thousand Francs owned',
                    79.75,' by her are at present in my custody, and shall be refunded;',
                    82.5, 'Mr Alfred Hammond, Waterford, Texas,',
                    84.75, ' U.S.A. will receive Ten Thousand Dollars;',
                    86.5,'The Misses Emy and Marie Winkelmann,' 
                ]
                sliderPositions = [
                    [14.5, 13],
                    [17.5, 13],
                    [20.25, 12.75],
                    [22.75, 12.5],
                    [25.5, 12],
                    [28, 12.25],
                    [30, 12.5],
                    [32.5, 12.5],
                    [34.5, 12.75],
                    [37, 12.75],
                    [40, 12.25],
                    [42, 12.25],
                    [44.25, 12.5],
                    [47.25, 12],
                    [49, 12.5],
                    [51.5, 12],
                    [53.5, 12.25],
                    [56, 12.25],
                    [58.25, 12.25],
                    [61, 11.75],
                    [63, 12.5],
                    [65.5, 12.25],
                    [67.25, 12.5],
                    [69.75, 12.25],
                    [71.75, 12.5],
                    [74.5, 12],
                    [76.5, 11.75]
                ]

                /*
                sliderPositions = [
                    [14, 13.5],
                    [27.5, 12.25],
                    [40, 11.75],
                    [51.75,11.75],
                    [63.2, 11.8],
                    [74.75, 11],
                    [85.5, 6],
                ]*/
                break;
            case 2:
                associatedMediaNobelKeywords = [['Georges Fehrenbach'], ['estate'], ['fund'], ['greatest benefit to mankind'], ['physics'], ['chemical'], ['physiology or medicine'], ['Literature']];
                hardcodedHotspotSpecs = [[53, 39.75, 14, 3.75], [75.5, 58, 5, 3.5], [46.5, 66, 4.5, 3.5], [64.25, 70.5, 9.25, 2.5], [75.25, 72, 6, 3], [69, 76.75, 13, 2.5], [62.5, 81, 20, 2.5], [65.5, 83.5, 16.25, 2.5]]

                leftTextArray = [
                    5, 'Potsdamerstrasse, 51, Berlin, will', 'receive Fifty Thousand Marks each;', 
                    'Mrs Gaucher, 2 bis Boulevard du Viaduc, Nimes' , 'France will receive One Hundred Thousand Francs;',
                    'My servants, Auguste Oswald and his wife', 'Alphonse Tournand, employed in my laboratory', 'at San Remo, will each receive an annuity of One','Thousand Francs;',
                    'My former servant, Joseph Girardot, 5, Place', 'St. Laurent, Châlons sur Saône, France, is', 'entitled to an annuity of Five Hundred Francs,', 'and my former gardener, Jean Lecof, at present with','Mrs Desoutter, receveur Curaliste, Mesnil, Aubry pour', 'Ecouen, S.& O., France, will receive an annuity of Three Hundred', 'Francs;',
                    'Mr Georges Fehrenbach, 2, Rue Compiègne,','Paris, is entitled to an annual pension of Five Thousand', 'Francs from January 1, 1896 to January 1, 1899,', 'when the said pension shall discontinue;',
                    'A sum of Twenty Thousand Crowns each, which', 'has been placed in my custody, is the property of my brother’s', 'children, Hjalmar, Ludvig, Ingeborg and Tyra, and shall be', 'repaid to them.',
                    'The whole of my remaining realizable estate shall be', 'dealt with in the following way: the capital, invested in safe', 'securities by my executors, shall constitute a', 'fund, the interest on which shall be annually distributed in the form of prizes', 'to those who, during the preceding year, shall have conferred the greatest', 'benefit to mankind. The said interest shall be divided into five equal', 'parts, which shall be apportioned as follows: one part to the person who shall', 'have made the most important discovery or invention within the field of physics;', 'one part to the person who shall have made the most important chemical', 'discovery or improvement; one part to the person who shall have made the most', 'important discovery within the domain of physiology or medicine; one part to', 'the person who shall have produced in the field of literature',
                ]
                sliderPositions = [
                    [7.75, 12.5],
                    [11, 11.5],
                    [12.25, 12.25],
                    [14, 12.5],
                    [16.5, 13.25],
                    [18.5, 12],
                    [20.5, 13.25],
                    [24, 12],
                    [24.75, 12.25],
                    [26.5, 12.75],
                    [28.75, 12.75],
                    [31.25, 12.75],
                    [33.5, 12],
                    [35, 13.25],
                    [38.75, 12.25],
                    [39, 13.5], 
                    [41.5, 14.25],
                    [44, 13.5], //18
                    [47.5, 12.5],
                    [48.5, 13.5],
                    [51.5, 13.25],
                    [53.75, 13],
                    [57.25, 12.5],
                    [57.75, 13],
                    [61, 12.25],
                    [63.25, 12],
                    [65.5, 11.75],
                    [67.75, 11.75],
                    [70, 11.5],
                    [72, 11.75],
                    [74.25, 12.5]
                ]
                break;
            case 3:
                associatedMediaNobelKeywords = [['peace'], ['Swedish Academy of Sciences'], ['Caroline Institute'], ['Academy'], ['a committee of five persons to be elected by the Norwegian Storting'], ['Scandinavian or not'], ['Ragnar Sohlman'], ['Paris'], ['San Remo'], ['Glasgow'], ['Petersburg'], ['Stockholm']];
                hardcodedHotspotSpecs = [[69.75, 14.25, 3, 2.5], [71.5, 16.75, 5, 2.25], [54.5, 21.75, 12.5, 2.5], [53.5, 24.5, 8, 1.75], [53, 26.5, 7.25, 2.25], [58, 38.5, 13.75, 2.5], [71.25, 43, 5.5, 2.5], [61, 64, 4, 2.5], [68.5, 64, 8, 2.5], [51.25, 70.25, 6.25, 2.5], [66.5, 81.75, 7.25, 2.5], [76.75, 84.5, 5.75, 2.5]]


                leftTextArray = [
                    9, 'the most outstanding work in an ideal direction; and one part to the',
                    11.25, 'person who shall have done the most or the best work for fraternity',
                    13.5, 'between nations, for the abolition or reduction of standing armies',
                    15.75, 'and for the holding and promotion of peace congresses.',
                    18, 'The prizes for physics and chemistry shall be awarded by the Swedish',
                    20.25, 'Academy of Sciences; that for physiological or medical',
                    22.5, 'work by the Caroline Institute in Stockholm; that for literature',
                    24.75, 'by the Academy in Stockholm, and that for champions of peace',
                    27, 'by a committee of five persons to be elected',
                    29.25, 'by the Norwegian Storting. It is my express',
                    31.5, 'wish that in awarding the prizes no consideration whatever',
                    34, 'shall be given to the nationality of the candidates,',
                    36.5, 'but that the most worthy shall receive the prize,',
                    38.75, 'whether he be a Scandinavian or not.',
                    42, 'As Executors of my testamentary dispositions,', 
                    44.25, 'I hereby appoint Mr Ragnar Sohlman,',
                    46.75, 'resident at Bofors, Värmland, and Mr',
                    49.25, 'Rudolf Lilljequist, 31 Malmskillnadsgatan, Stockholm,',
                    51.5, 'and at Bengtsfors near Uddevalla. To compensate',
                    53.75, 'for their pains and attention, I grant to Mr,',
                    56, 'Ragnar Sohlman, who will presumably have to',
                    58.25, 'devote most time to this matter, One Hundred Thousand Crowns,',
                    60.25, 'and to Mr Rudolf Lilljequist, Fifty Thousand Crowns;',
                    63, 'At the present time, my property consists',
                    65.25, 'in part of real estate in Paris and San Remo, and',
                    67.75, 'in part of securities deposited as follows: with The Union Bank of Scotland',
                    69.75, 'Ltd in Glasgow and London, Le Crédit Lyonnais,',
                    72, 'Comptoir National d’Escompte, and with Alphen Messin',
                    74.5, '& Co. in Paris; with the stockbroker M.V. Peter of Banque',
                    76.75, 'Transatlantique, also in Paris; with Direction',
                    79, 'der Disconto Gesellschaft and Joseph Goldschmidt',
                    81.25, '& Cie, Berlin; with the Russian Central Bank, and with',
                    83.5, 'Mr Emanuel Nobel in Petersburg; with',
                    85.75, 'Skandinaviska Kredit Aktiebolaget in Gothenburg and Stockholm,'
                ]
                sliderPositions = [
                    [7.75, 12.5],
                    [11, 11.5],
                    [13.25, 11.5],
                    [15.5, 11.5],
                    [17.75, 11.5],
                    [20, 11.5],
                    [22.25, 11.5],
                    [24.5, 11.5],
                    [26.75, 11.5],
                    [29, 11.5],
                    [31.25, 12],
                    [33.75, 12],
                    [36.25, 12],
                    [38.5, 12.5],
                    [41.75, 12],
                    [44, 11.5],
                    [46.5, 12],
                    [49, 11.5],
                    [51.25, 11.5],
                    [53.5, 11.5],
                    [55.75, 11.5],
                    [58, 11.5],
                    [60, 11.25],
                    [62.75, 12],
                    [65, 11.5],
                    [67.5, 11.5],
                    [69.5, 11.5],
                    [71.75, 11.5],
                    [74.25, 11.25],
                    [76.5, 11.5],
                    [78.75, 11.5],
                    [81, 11.5],
                    [83.25, 11.5],
                    [85.5, 11.5]
                ]
                break;
            case 4:
                associatedMediaNobelKeywords = [['strong box'], ['crematorium']];
                hardcodedHotspotSpecs = [[48, 10.75, 7.3, 2.75], [66.75, 36.75, 10, 2.75]]
                leftTextArray = [
                    8.5, 'in Enskilda Banden in Stockholm and in',
                    10.75, 'and in my strong-box at 59, Avenue Malakoff, Paris; further',
                    13, 'to this are accounts receivable, patents, patent fees',
                    15.5, 'or so-called royalties etc. in connection with which my',
                    17.75, 'Executors will find full information in my papers',
                    19.75, 'and books.',
                    22, 'This Will and Testament is up to now the only one valid,',
                    24, 'and revokes all my previous testamentary',
                    26.5, 'dispositions, should any such exist after my death.',
                    29, 'Finally, it is my express wish that following my death',
                    31, 'my veins shall be opened,and when this has been done and',
                    33, 'competent Doctors have confirmed clear signs of death,',
                    35, 'my remains shall be',
                    37.5, 'cremated in a so-called crematorium.',
                    39.5, 'Paris, 27 November, 1895', 
                    45, 'Alfred Bernhard Nobel',
                    50, 'That Mr Alfred Bernhard Nobel, being of sound mind,',
                    53, 'has of his own free will declared the above',
                    55.5, 'to be his last Will and Testament, and that he has signed the same, we have, in his presence and the presence of each other,',
                    59, 'hereunto subscribed our names as witnesses:',
                    62, 'Sigurd Ehrenborg        R. W. Strehlenert',
                    64.5, 'former Lieutenant        Civil Engineer', 
                    67, '86 Boulevard Haussmann        8, Rue Auber, Paris', 
                    71, 'Thos Nordenfelt        Leonard Hwass', 
                    74, 'Constructor        Civil Engineer', 
                    76.5, '4, Passage Caroline        4, Passage Caroline'
                ]
                sliderPositions = [
                    [7.75, 12],
                    [10.5, 11.5],
                    [12.75, 11.5],
                    [15.25, 11.5],
                    [17.5, 11],
                    [19.5, 11.5],
                    [21.75, 11],
                    [23.75, 11.25],
                    [26.25,11],
                    [28.75, 10.75],
                    [30.75, 12],
                    [32.75, 15],
                    [34.75, 17],
                    [37.25, 17.5],
                    [39.25, 20],
                    [44.75, 16],
                    [49.75, 14.5],
                    [52.75, 13.5],
                    [55.25, 14],
                    [58.75, 14.5],
                    [60.75, 15],
                    [64.25, 16],
                ]
                break;
        }
        for (var i = 0; i < infoBulbs.length; i++) {
            var div = $(document.createElement("div"));
            div.css({
                "left": infoBulbs[i][0] + "%",
                "height": "45px",
                "width": "45px",
                "position": 'absolute',
                "top": infoBulbs[i][1]+"%",
                "z-index": "550",
                "float": "right",
                "top": infoBulbs[i][1] + "%",
            })
            var img = $(document.createElement("img"));
            img.attr({
                src: LIGHTBULB_ICON,
            });
            img.addClass('lightbulb');
            img.attr({ id: i + associatedMediaNobelKeywords.length })
            div.popupNumber = i + associatedMediaNobelKeywords.length
            img.css({
                "height" : "100%",
                "width" : "100%"
            }).click(function () {
                showLargePopup(this.id);
            })
            div.append(img);
            root.append(div);
        }

        var placeInChunk = 0;
        var currentChunkNumberIteratingOver = 0;
        for (var i = 0; i < associatedMediaNobelKeywords.length; i++) {
            var currMedia = associatedMediaNobelKeywords[i];
            if(currentChunkNumberIteratingOver !== currMedia[1]){
                placeInChunk = 1;
                currentChunkNumberIteratingOver = currMedia[1];
            }
            else
            {
                placeInChunk++;
            }
            associatedMedia[i] = makeAsocciatedMediaDiv(currMedia[0], null, currMedia[1], placeInChunk,i);
        }
        var currentHeight = 0;
        for (var i = 0; i < leftTextArray.length; i++) {
            if (isNaN(leftTextArray[i])) {
                var tempText = $(document.createElement('div'));
                tempText.css({
                    'position': 'absolute',
                    'background-color': "transparent",
                    'left': '15.5%',
                    'width': '100%',
                    'color': 'black',
                    'height': '5%',
                    'top': currentHeight + '%',
                    'font-size': '.475em',
                }).text(leftTextArray[i]);
                currentHeight += 1.75;
                tempText.attr('class', 'textChunkDiv');
                sideBar.append(tempText);
                textDivArray.push(tempText);
            }
            else {
                currentHeight = leftTextArray[i];
            }

            /*
            tempText.css({
                'position': 'absolute',
                'background-color': "transparent",
                'left': '22.5%',
                'width': '80%',
                'color': 'black',
                'height': leftTextArray[i][1] > 65 ? 65 - leftTextArray[i][1] + "%" : '25%',
                'top': leftTextArray[i][1] + '%',
                'font-size': '.475em',
            });
            if (leftTextArray[i][0].length < 10) {
                for (var j = 0; j < leftTextArray[i][0].length; j++) {
                    var temp2 = $(document.createElement('div'));
                    temp2.css({
                        'position': 'absolute',
                        'background-color': "transparent",
                        'left': '0%',
                        'width': '50%',
                        'color': 'inherit',
                        'height': '9%',
                        'top': (j) * 9 + leftTextArray[i][1] + '%',
                        'font-size': 'inherit'
                    }).text(leftTextArray[i][0][j][0])
                    if (leftTextArray[i][0][j].length === 2) {
                        var temp3 = $(document.createElement('div'));
                        temp3.css({
                            'position': 'absolute',
                            'background-color': "transparent",
                            'left': parseInt(tempText.css('width')) / 2 + '%',
                            'width': '50%',
                            'color': 'inherit',
                            'height': '9%',
                            'top': (j) * 9 + leftTextArray[i][1] + '%',
                            'font-size': 'inherit'
                        }).text(leftTextArray[i][0][j][1])
                        tempText.append(temp3);
                    }
                    tempText.append(temp2);
                }
            }
            else {
                tempText.text(leftTextArray[i][0])
            }*/
        }
        showNobelInitialPopup(
            function () {
                var leftArrow = $(document.createElement('img'));
                var rightArrow = $(document.createElement('img'));
                leftArrow.attr({
                    id: 'leftPageArrow',
                    src: tagPath + 'images/icons/left_nobel_icon.svg'
                })
                rightArrow.attr({
                    id: 'rightPageArrow',
                    src: tagPath + 'images/icons/right_nobel_icon.svg'
                })
                leftArrow.css({
                    'position': 'absolute',
                    'background-color': 'transparent',
                    'width': '50px',
                    'bottom': '20px',
                    'left': "31.75%",
                    'z-index': '599'
                });
                leftArrow.click(function () {
                    pauseNobel();
                    goPrevPage();
                })
                rightArrow.css({
                    'position': 'absolute',
                    'width': '50px',
                    'background-color': 'transparent',
                    'bottom': '20px',
                    'left': "69.75%",
                    'z-index': '599'
                });
                rightArrow.click(
                    function () {
                        pauseNobel();
                        nextPage()
                    }
                )

                switch (pageNumber) {
                    case 1:
                        rightArrow.css({
                            "left": "69.75%",
                            "bottom": "50px"
                        })
                        break;
                    case 2:
                        leftArrow.css({
                            "left": "37.75%",
                            "bottom": "22px"
                        })
                        rightArrow.css({
                            "left": "69.5%",
                            "bottom": "22px"
                        })
                        break;
                    case 3:
                        leftArrow.css({
                            "left": "34.25%",
                            "bottom": "22px"
                        })
                        rightArrow.css({
                            "left": "69.75%",
                            "bottom": "22px"
                        })
                        break;
                    case 4:
                        leftArrow.css({
                            "left": "36.75%",
                            "bottom": "30px"
                        })
                        break;
                }

                //var arrowWidth = rightArrow.width();
                //rightArrow.css('height', arrowWidth + '%');
                //leftArrow.css('height', arrowWidth + '%');

                root.append(rightArrow);
                root.append(leftArrow);

                if (pageNumber === 4) {
                    rightArrow.hide();
                }
                if (pageNumber === 1) {
                    leftArrow.hide();
                }
                var hiddenInnerds = $(document.createElement('div'));
                hiddenInnerds.css({
                    'position': 'absolute',
                    'background-color': NOBEL_ORANGE_COLOR,
                    'opacity': '0',
                    'left': '0%',
                    'width': '100%',
                    'height': '100%',
                }).click(pauseNobel)

                var sliderBarInnerds = $(document.createElement('div'));
                sliderBarInnerds.css({
                    'position': 'absolute',
                    'background-color': NOBEL_ORANGE_COLOR,
                    'opacity': '.4',
                    'left': '40.75%',
                    'width': '59.25%',
                    'height': '100%',
                }).click(pauseNobel)

                switch (pageNumber) {
                    case 1:
                        sliderBarInnerds.css({ "left": "42.5%", "width": "57.5%" })
                        break;
                    case 2:
                        sliderBarInnerds.css({ "left": "43.6%", "width": "56.4%" })
                        break;
                    case 3:
                        sliderBarInnerds.css({ "left": "42.5%", "width": "57.5%" })
                        break;
                    case 4:
                        sliderBarInnerds.css({ "left": "43.5%", "width": "56.5%" })
                        break;
                }

                sliderBar = $(document.createElement('div'));
                sliderBar.attr('id', 'sliderBar');
                sliderBar.append(hiddenInnerds);
                sliderBar.append(sliderBarInnerds);
                sliderBar.css({
                    'position': 'absolute',
                    'background-color': 'transparent',
                    'border': '3px solid '+NOBEL_ORANGE_COLOR,
                    'border-radius': '12px',
                    'left': '1%',
                    'width': '75.5%',
                    'height': '10%',
                    'z-index': '500'
                }).click(pauseNobel)
                sideBar.mouseup(function (e) {
                	mouseUp(e)
                })
                willImage.mouseup(function (e) {
                	mouseUp(e)
                })
                background.mouseup(function (e) {
                	mouseUp(e)
                })
                sliderBar.mousedown(function (e) {
                    touching = true;
                    dragging = true;
                    lastDragY = e.clientY;
                })
                sliderBar.mouseup(function (e) {
                	mouseUp(e)
                })
                canvas.mouseup(function (e) {
                    mouseUp(e)
                })
                $("#associatedMediaScroller").mouseup(function (e) {
                	mouseUp(e)
                })
                $("#associatedMediaScroller").mousemove(function (e) {
                	mouseMove(e)
                })
                sliderBar.mousemove(function (e) {
                    touching = true;
                	mouseMove(e)
                })
                sideBar.mousemove(function (e) {
                    touching = true;
                	mouseMove(e)
                })
                willImage.mousemove(function (e) {
                    touching = true;
                	mouseMove(e)
                })
                background.mousemove(function (e) {
                    touching = true;
                	mouseMove(e)
                })

                canvas.mousemove(function (e) {
                    touching = true;
                    mouseMove(e)
                })


                sideBar.css('z-index', '10');
                var up = $(document.createElement('img'))
                var down = $(document.createElement('img'))
                up.attr({
                    id: 'upIcon',
                    src: tagPath + 'images/icons/up_nobel_icon.svg'
                })
                up.css({
                    'position': 'absolute',
                    'background-color': "transparent",
                    'max-height': '25px',
                    'max-width': '25px',
                    'min-height': '25px',
                    'min-width': '25px',
                    'left': '1.5%',
                })
                up.css({
                    'bottom': 'calc(50% + 15px)'
                }).mousedown(function (e) {
                    touching = true;
                    dragging = true;
                    lastDragY = e.clientY;
                }).mouseup(function (e) {
                    mouseUp(e)
                }).mousemove(function (e) {
                    touching = true;
                    mouseMove(e)
                })
                up.click(
                    function () {
                        if (nobelIsPlaying === true) {
                            pauseNobel()
                            prevChunk(checkForHotspots);
                        }
                        else {
                        	prevChunk(checkForHotspots);
                        }
                    }
                )
                down.attr({
                    id: 'downIcon',
                    src: tagPath + 'images/icons/down_nobel_icon.svg'
                })
                down.css({
                    'position': 'absolute',
                    'background-color': "transparent",
                    'max-height': '25px',
                    'max-width': '25px',
                    'min-height': '25px',
                    'min-width': '25px',
                    'left': '1.5%'
                }).mousedown(function (e) {
                    touching = true;
                    dragging = true;
                    lastDragY = e.clientY;
                }).mousemove(function (e) {
                    touching = true;
                    mouseMove(e)
                })
                down.css({
                    'top': 'calc(50% + 15px)'
                }).mouseup(function (e) {
                    mouseUp(e)
                })
                down.click(
                    function () {
                        if (nobelIsPlaying === true) {
                            pauseNobel();
                            nextChunk(checkForHotspots);
                        }
                        else {
                        	nextChunk(checkForHotspots);
                        }
                    }
                )

                sliderBar.append(down)
                sliderBar.append(up)
                root.append(sliderBar);

                makeNobelHotspots(associatedMediaNobelKeywords, hardcodedHotspotSpecs)

                setChunkNumber(0, null, 1);

                for (var i = 0; i < associatedMedia.length; i++) {
                	associatedMedia[i].checkHeight();
                }

                var j = 1
                /*
                var test = function () {
                    setTimeout(function () {
                        setChunkNumber(j, test);
                        j = (j + 1) % textDivArray.length;
                    }, 2500)
                }*/
                //test();
                // var soundTest = makeAndPlaySound(function () { console.log("DONE!") });
            }
        )
    }
    function percentToPx(percent) {
    	return (percent / 100) * sideBar.height();
    }
    function mouseUp(e) {
    	if (dragging) {
    		if (e===undefined || e.clientX > 100) {
    			var lineMiddle = sliderBar.offset().top + (sliderBar.height() / 2);
    			var closest = 0;
    			var closestDist = 5000000;
    			for (var i = 0; i < sliderPositions.length ; i++) {
    				var middle = percentToPx(sliderPositions[i][0]) + (percentToPx(sliderPositions[i][1]) / 2);
    				if (Math.abs(lineMiddle - middle) < closestDist) {
    					closestDist = Math.abs(lineMiddle - middle);
    					closest = i;
    				}
    			}
    			setChunkNumber(closest, checkForHotspots, 400);
    		}
    		dragging = false;
    	}
    }
    function mouseMove(e) {
    	if (dragging) {
    		var diff = e.clientY - lastDragY;
    		lastDragY = e.clientY;
    		sliderBar.css({
    			"top": sliderBar.offset().top + diff + "px"
    		})
    		for (var i = 0; i < nobelHotspots.length; i++) {
    			if (nobelHotspots[i][0].MiddleY > sliderBar.offset().top && nobelHotspots[i][0].MiddleY < sliderBar.offset().top + (sliderBar.height())) {
    				rightStack.addMedia(nobelHotspots[i][1]);
    			}
    			else {
    				rightStack.removeMedia(nobelHotspots[i][1]);
    			}
    		}
    	}
    }
    function checkForHotspots() {
    	dragging = false;
    	var ctx = canvas[0].getContext("2d");
    	ctx.clearRect(0, 0, 1080, 1920);
    	var w = canvas[0].width;
    	canvas[0].width = 1;
    	canvas[0].width = w;
        canvas.css({"opacity" : "0"})

    	for (var i = 0; i < nobelHotspots.length; i++) {
    		nobelHotspots[i][1].stop(true, true);
    		if (nobelHotspots[i][0].MiddleY > sliderBar.offset().top && nobelHotspots[i][0].MiddleY < sliderBar.offset().top + (sliderBar.height())) {
    			nobelHotspots[i][1].fadeIn();

    			var div = nobelHotspots[i][0];
    			function percentToPxLeft(percent) {
    				return (percent / 100) * sideBar.height();
    			}

    			function percentToPxTop(percent) {
    				return (percent / 100) * background.width();
    			}

    			ctx.beginPath();
    			ctx.moveTo(div.offset().left + div.width() + 4, div.offset().top + (div.height() / 2));
    			var finalx = nobelHotspots[i][1].offset().left;
    			var finaly = nobelHotspots[i][1].offset().top + (nobelHotspots[i][1].height() / 2);
    			ctx.bezierCurveTo(finalx, div.offset().top + (div.height() / 2), div.offset().left + div.width() + 4, finaly, finalx, finaly)
    			ctx.lineWidth = 3.5;
    			ctx.strokeStyle = NOBEL_ORANGE_COLOR;
    			ctx.stroke();
    		}
    		else {
    		     nobelHotspots[i][1].hide();
    		}
    	}
    	canvas.animate({ opacity: 1 }, 400, 'easeInOutQuart')
    	bezierVisible = true;
    }

    function hideBezier() {
    	if (bezierVisible) {
    		var ctx = canvas[0].getContext("2d");
    		ctx.clearRect(0, 0, 1080, 1920);
    		var w = canvas[0].width;
    		canvas[0].width = 1;
    		canvas[0].width = w;
    		bezierVisible = false;
    	}
    }

    function makeAsocciatedMediaDiv(string, imageurl, chunkN, numberInChunk, number) {
        var middlespace = 25;
        var numberOfMedia = 0;
        for (var i = 0; i < associatedMediaNobelKeywords.length; i++) {
            if (associatedMediaNobelKeywords[i][1] === chunkN) {
                numberOfMedia++ ;
            }
        }
        var height = Math.min((100 - middlespace) / numberOfMedia,30);
        var gap = middlespace / (numberOfMedia + 1);

        var div = $(document.createElement('div'));
        div.css({
            "background-color": "#dfdcdd",
            "border": "2px solid " + NOBEL_ORANGE_COLOR,
            "border-radius" : "3.5px",
            "left": "2.5%",
            "display" : "block",
            "top": numberInChunk * height + "%",
            "position" : "static",
            "border-color": NOBEL_ORANGE_COLOR,
            "display": "flex",
            "height": "auto",
			"margin-bottom" : "12px"
        })

        root.append(div);

        var info = getPopupInfo(number);

        var picWrapper = $(document.createElement("div"));
        picWrapper.css({
        	"position": " relative",
        	"height": "30%",
			"width" : "30%"
        })

		div.append(picWrapper)

        var pic = $(document.createElement("img"));
        pic.attr({ src: info.image })

		var ratio = pic.height() / pic.width()

        pic.css({
        	"width": "100%",
			"height" : "auto",
        	"left": "12px",
        	"top": "12px",
			"position" : "relative"
        })
        picWrapper.append(pic);

        div.picWrapper = picWrapper;

        //div.css({"min-height" : pic.width()*ratio*.3+ 24+"px"})

        var rightDiv = $(document.createElement('div'));
        rightDiv.css({
        	"position": "relative",
        	"width": "65%",
        	"height": "auto",
            "color" : "black",
			"left" : "24px"
        })

        var title = $(document.createElement('div'));
        title.css({
        	"width": "100%",
        	"top": "12px",
        	"position": "relative",
        	"color": "black",
			"height" : "auto"
        }).text(string);

        rightDiv.append(title);

		div.title = title

        div.append(rightDiv);

        var descWhole = $(document.createElement('div'));
        descWhole.css({
        	"width": "100%",
        	"position": "relative",
        	"height": "auto"
        })
        rightDiv.append(descWhole);

		div.descWhole = descWhole

        var img = $(document.createElement("img"));
        img.attr({
            src: LIGHTBULB_ICON,
        });
        img.addClass('lightbulb');
        img.css({
        	"right": "8px",
        	"height": "45px",
        	"width": "45px",
        	"position": 'absolute',
        	"bottom": "0px",
        	"z-index": "550",
        	"float": "right"
        }).click(function () {
        	showLargePopup(div.medianumber)
        })
        descWhole.append(img);
        var desc = $(document.createElement('div'));
        desc.css({
        	"width": "77.5%",
        	"position": "relative",
        	"font-size": ".45em",
        	"height": "auto",
        	"top": '12px',
        	"color": "black",
			'bottom' : "50px"
        }).text(info.shortText);
        descWhole.append(desc);
        var spacer = $(document.createElement('div'));
        spacer.css({
        	"height": "12px",
			"width" : "100%",
			"position": "relative",
        })
        descWhole.append(spacer);
        div.attr({ attr: string });
        associatedMediaScroller.append(div);
        div.hide();

        div.medianumber = number;
    	//div.height(titleHeight + 40 + desc.height());

		div.css({"height":"auto"})

    	/*
        div.fadeIn = function () {
            div.animate({ opacity : 1 }, 400, 'easeInOutQuart');
        }
        div.fadeOut = function () {
            div.animate({ opacity: 0 }, 400, 'easeInOutQuart');
        }*/
        div.getTop = function () {
            return div.css("top");
        }
        div.setTop = function (t) {
            div.animate({ top: t + '%'}, 400, 'easeInOutQuart');
        }
        div.chunkNumber = chunkN;
        div.numberInChunk = numberInChunk;
        div.Identifier = chunkN + "#" + numberInChunk;

        div.checkHeight = function () {
        	div.descWhole.css({
				"min-height" : div.picWrapper.height() + 12 - div.title.height() +'px'
        	})
        }


        div.mouseup(function (e) {
        	mouseUp(e)
        })

        div.mousemove(function (e) {
        	mouseMove(e)
        })
        return div;
    }

    function toggleNobelMute() {
        if (nobelMuted === false) {
            nobelMute()
        }
        else if (nobelMuted === true) {
            nobelUnmute();
        }
    }
    function nobelMute() {
        nobelMuted = true;
        muteButton.attr({
            src: tagPath + 'images/icons/nobel_mute.svg'
        })
        if (currentAudio) {
            currentAudio.volume = 0;
        }
    }
    function nobelUnmute() {
        nobelMuted = false;
        muteButton.attr({
            src: tagPath + 'images/icons/nobel_sound.svg'
        })
        if (currentAudio) {
            currentAudio.volume = 1;
        }
    }
    function toggleNobelPlaying() {
        if (nobelIsPlaying) {
            pauseNobel();
        }
        else {
            playNobel();
        }
    }
    function pauseNobel() {
        stopAudio();
        nobelIsPlaying = false;
        nobelPlayPauseButton.attr({
            src: tagPath + '/images/icons/nobel_play.svg'
        })
    }
    function stopAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.removeEventListener('ended', audioFinishedHandler);
            $("#audioFile").off();
        }
    }
    function getAudioSource() {
        return tagPath + 'images/nobel_sounds/' + pageNumber + '_' + chunkNumber + '.mp3'
    }
    function playNobel() {
        if (currentAudio && currentAudio.paused === false) {
            currentAudio.addEventListener('ended', incrNext);
        }
        else {
            makeAndPlaySound(incrNext);
        }
        nobelIsPlaying = true;
        nobelPlayPauseButton.attr({
            src: tagPath + '/images/icons/nobel_pause.svg'
        })
    }

    function incrNext() {
        if (pageNumber === 4 && chunkNumber === textDivArray.length - 1) {
            pauseNobel();
        }
        if (chunkNumber === textDivArray.length - 1) {
            nextChunk(nextPage);
        }
        else if (nobelIsPlaying === true) {
            nextChunk(incrNext);
        }
    }
    function hideNobelAssociatedMedia() {
    	$("#annotatedImageAssetCanvas").css("z-index", '50');
    	var ctx = canvas[0].getContext("2d");
    	ctx.clearRect(0, 0, 1080, 1920);
    	var w = canvas[0].width;
    	canvas[0].width = 1;
    	canvas[0].width = w;
    	for (var j = 0; j < associatedMedia.length; j++) {
    		if (rightStack.indexOf(associatedMedia[j]) === -1) {
    			associatedMedia[j].fadeOut();
    		}
        }
    }
    /*
    * makes an audio file, plays it, and attaces a handler to fire when the audio finishes
    * @param function callback      callback function after the audio is done 
    */
    function makeAndPlaySound(callback) {
        stopAudio();
        $(".audioFile").remove();
        $(".audioFile").die();
        var soundTest = $(document.createElement('audio'));
        soundTest.attr({
            src: getAudioSource(),
            id: 'audioFile'
        })
        soundTest[0].play();
        audioFinishedHandler = soundTest[0].addEventListener('ended', function () { callback && callback(); });
        soundTest[0].volume = nobelMuted ? 0 : 1;

        currentAudio = soundTest[0]
        return soundTest[0];
    }
    /*
    *
    *goes to the previous nobel will page
    */
    function goPrevPage() {
        if (pageNumber > 0) {

            idleTimer.kill();
            infoBulbs = []
            associatedMedia = []
            pageNumber-=1
            sliderBar.remove();
            stopAudio();
            willImage.remove();
            willImage.die();
            $("#upIcon").remove();
            $("#downIcon").remove();
            $("#rightPageArrow").remove();
            $("#leftPageArrow").remove();
            $(".textChunkDiv").remove();
            $("#titleDiv").remove();
            $('.lightbulb').remove();
            $("#annotatedImageAssetCanvas").remove();
            $(".nobelHotspot").remove();
            $("#nobelPlayPauseButton").remove();
            $("#audioFile").off();
            $("#audioFile").remove();
            $("#audioFile").die();
            sliderBar.die();
            $("#upIcon").die();
            $("#downIcon").die();
            $("#rightPageArrow").die();
            $("#leftPageArrow").die();
            $(".textChunkDiv").die();
            $("#titleDiv").die();
            $("#annotatedImageAssetCanvas").die();
            $(".nobelHotspot").die();
            $("#nobelPlayPauseButton").die();
            $('.lightbulb').die();
            textDivArray = [];
            nobelWillInit();
        }
    }

    /*
    *
    *goes to the next nobel will page
    * @param boolean isPlaying      to set the status to playing upon loading next page
    */
    function nextPage(isPlaying) {
        if (pageNumber < 4) {

            idleTimer.kill();

            infoBulbs = []

            pageNumber += 1
            associatedMedia = []
            //annotatedImage && annotatedImage.unload();
            sliderBar.remove();
            stopAudio();
            willImage.remove();
            willImage.die();
            $("#upIcon").remove();
            $("#downIcon").remove();
            $("#rightPageArrow").remove();
            $("#leftPageArrow").remove();
            $(".textChunkDiv").remove();
            $("#titleDiv").remove();
            $("#nobelPlayPauseButton").remove();
            $("#annotatedImageAssetCanvas").remove();
            $(".nobelHotspot").remove();
            $("#audioFile").off();
            $("#audioFile").remove();
            $('.lightbulb').remove();
            $("#audioFile").die();
            sliderBar.die();
            $("#upIcon").die();
            $("#downIcon").die();
            $("#rightPageArrow").die();
            $("#leftPageArrow").die();
            $(".textChunkDiv").die();
            $("#titleDiv").die();
            $("#annotatedImageAssetCanvas").die();
            $(".nobelHotspot").die();
            $("#nobelPlayPauseButton").die();
            $('.lightbulb').die();
            textDivArray = [];
            nobelWillInit();
            if (isPlaying === true) {
                setTimeout(function () {
                    playNobel();
                }, 2500)
            }
        }
    }

    /*
    * parses through associated media and associated them with a hotspot.  also creates the hotspot div
    * @param names array[string]        the array of strings that identify the associated media by name
    */
    function makeNobelHotspots(names, hotSpotInfo) {
        nobelHotspots = [];
        for (var i = 0; i < associatedMedia.length; i++) {
			console.log("making nobel hotspot")
            var div = $(document.createElement('img'));
            div.css({
                'position': 'absolute',
                'background-color': 'rgb(200,20,20)',
                'opacity': '.3',
                'border': '2px solid red',
                'font-size': '.6em',
                'border-radius': '5px',
                'left': hotSpotInfo[i][0]-8.25 + '%',
                'top': hotSpotInfo[i][1] + '%',
                'width': hotSpotInfo[i][2] + '%',
                'height': hotSpotInfo[i][3] + '%',
            })
            div.attr({
                id: associatedMedia[i].Identifier,
                class: 'nobelHotspot'
            });

            function percentToPxLeft(percent) {
            	return (percent / 100) * sideBar.height();
            }

            function percentToPxTop(percent) {
            	return (percent / 100) * background.width();
            }

            div.click(function () {
                pauseNobel();
            })
            div.assocMedia = associatedMedia[i];
            root.append(div);
            div.MiddleY = div.offset().top + (div.height() / 2);
            nobelHotspots.push([div, associatedMedia[i]]);
            div.mouseenter(function () {
                touching = true;
            })
        }
    }
    /**
    * decrements the chunk number
    * @param function callback     function to be called upon completion
    */
    function prevChunk(callback) {
        setChunkNumber(chunkNumber - 1, callback ? callback : null)
    }

    /**
    * incremenets the chunk number
    * @param function callback     function to be called upon completion
    */
    function nextChunk(callback) {
        setChunkNumber(chunkNumber + 1, callback ? callback : null)
    }

    /**
    * set the current chunk, highlights the right text, moves the sliderbar to the right spot, hides or shows the up and down arrows, clears the associated media; and enables the right associated media
    * @param double chunk        the chunk number to be set
    * @param function callback     function to be called upon completion
    * @param int duration          for the excpetionally picky a duration of animation can be specified in milliseconds
    */
    function setChunkNumber(chunk, callback, duration) {
        if (chunk === textDivArray.length && nobelIsPlaying === true) {
            stopAudio();
            nextPage(true);
            return;
        }
        if (chunk >= 0 && chunk < (textDivArray.length - 4)) {
            hideNobelAssociatedMedia();
            stopAudio();

            for (var i = 0; i < textDivArray.length; i++) {
                if (i>=chunk && i<chunk+5) {
                    fadeText(textDivArray[i], 'white', null, duration || 1000)
                }
                else {
                    fadeText(textDivArray[i], 'black', null, duration || 1000)
                }
            }
            if (chunk === 0) {
                $("#upIcon").fadeOut(duration || 1000, 'easeInOutQuart');
            }
            else {
                $("#upIcon").fadeIn(duration || 1000, 'easeInOutQuart');
            }
            if (chunk === sliderPositions.length - 1) {
                $("#downIcon").fadeOut(duration || 1000, 'easeInOutQuart');
            }
            else {
                $("#downIcon").fadeIn(duration || 1000, 'easeInOutQuart');
            }
            moveSliderBar(sliderPositions[chunk][0] / 100, sliderPositions[chunk][1] / 100, callback ? function () { if (nobelIsPlaying) { makeAndPlaySound(callback) }; checkForHotspots() } : function () { if (nobelIsPlaying) { makeAndPlaySound() }; checkForHotspots() }, duration || 1000);

            /*
            //TODO :  add enabling associated media
            if (associatedMediaNobelLocations) {
                for (var i = 0; i < associatedMediaNobelLocations.length; i++) {
                    associatedMediaNobelLocations[i] = false;
                }
            }*/
            chunkNumber = chunk;
        }

    }
    /**
    * fades the text color to the passed in color on the passed in div
    * @param div textDiv           the div to change color
    * @param finalColor string      the color the change into
    * @param function callback     function to be called upon completion
    * @param int duration          for the excpetionally picky a duration of animation can be specified in milliseconds
    */
    function fadeText(textDiv, finalColor, callback, duration) {
        textDiv.animate({ color: finalColor }, duration || 1000, 'easeInOutQuart', callback ? callback : null);
    }

    /**
     * moves the top of the slider bar to a location on the screen in terms of percent Y of root page
     * @param double percentY       the fraction of the height the slider bar will be moved tof, between 0 and 1 (except 1 would put the bar below the bottom of the screen)
     * @param double height         the percent of the root page screen in height the bar should be tall
     * @param function callback     function to be called upon completion
     * @param int duration          for the excpetionally picky a duration of animation can be specified in milliseconds
     */
    function moveSliderBar(y, height, callback, duration) {
        y *= 100;
        height *= 100;
        sliderBar.animate({ top: y + '%', height: height + '%' }, duration || 1000, 'easeInOutQuart', callback ? callback : null);
    }

    /**
     * Initializes the popup informative window before the nobel will exploration begins
     * @param function onClose      the function called after the window is closed
     */

    function showNobelInitialPopup(onClose) {
        if (pageNumber > 0 || showInitialNobelWillBox === false) {
            onClose && onClose()
            return;
        }
        showInitialNobelWillBox = false;
        var popup = $(document.createElement('div'))
        popup.css({
            'display': 'block',
            'position': 'absolute',
            'opacity': '1',
            'border-radius': '18px',
            'border-color': NOBEL_ORANGE_COLOR,
            'border': '8px solid ' + NOBEL_ORANGE_COLOR,
            'width': '60%',
            'height': '50%',
            'top': '25%',
            'left': '20%',
            'background-color': 'black',
            'z-index': '99999999'
        })
        var popupTopBar = $(document.createElement('div'));
        var popupLeftBar = $(document.createElement('div'));
        var popupRightBar = $(document.createElement('div'));
        var popupLeftTopBar = $(document.createElement('div'));
        var popupLeftBottomBar = $(document.createElement('div'));
        var nobelIcon = $(document.createElement('img'));
        var closeX = $(document.createElement('img'));

        nobelIcon.attr({
            src: tagPath + 'images/icons/nobel_icon.png',
            id: 'nobelIcon'
        })
        nobelIcon.css({
            'position': 'absolute',
            'width': '90%',
            'height': '80%',
            'left': '18%',
            'top': '5%'
        })
        popupRightBar.append(nobelIcon);
        popupTopBar.append(closeX);
        closeX.attr({
            src: tagPath + 'images/icons/x.svg',
            id: 'closeX'
        })
        closeX.css({
            'left': '94.85%',
            'position': 'absolute',
            'top': '15%',
            'height': '54%'
        })
        popupTopBar.css({
            'height': '15%',
            'position': 'absolute',
            'width': '100%',
        })

        popupLeftBar.css({
            'height': '85%',
            'position': 'absolute',
            'width': '65%',
            'top': '15%',
            'color': 'white'
        })

        popupRightBar.css({
            'height': '85%',
            'position': 'absolute',
            'width': '35%',
            'top': '15%',
            'left': '60%',
        })

        popupLeftTopBar.css({
            'height': '18%',
            'position': 'absolute',
            'width': '92%',
            'left': '8%',
            'font-size': '1.25em',
            'font-weight': 'bold',
            'color': 'white',
            'font-family': 'Cinzel'
        }).text("Alfred Nobel's Will")

        popupLeftBottomBar.css({
            'top': ' 18%',
            'height': '82%',
            'position': 'absolute',
            'left': '8%',
            'width': '92%',
            'font-size': '.82em',
            'color': 'white'
        }).text('Alfred Nobel was a wealthy inventor and industrialist who \nlived in the 19th century. During his lifetime he built up a \nvast fortune. His handwritten will is four pages long and \nwritten in Swedish; in it he expresses a wish to let the majority of his realizable estate form the foundation for \na prize to those who "shall have conferred the greatest \nbenefit to mankind” in the fields of physics, chemistry, \nmedicine, literature and peace work.')

        var temp = $(TAG.Util.UI.blockInteractionOverlay(.3));//add blocking div to stop all interaction
        temp.css({
            "display": 'block',
            'z-index': '9999999'
        })
        popupLeftBar.append(popupLeftTopBar);
        popupLeftBar.append(popupLeftBottomBar);
        popup.append(popupTopBar);
        popup.append(popupLeftBar);
        popup.append(popupRightBar);
        root.append(temp)
        root.append(popup)
        closeX.click(function () {
            temp.remove();
            popup.remove();
            if (onClose) {
                onClose();
            }
        })
        $("#startPageLoadingOverlay").remove();
    }
    function getRightTable() {
        var list = [];/*
        var head = "top";
        list.direction = function () {
        	return head;
        }
        list.switchHead = function() {
            if (head === "top") {
                head = "bottom"
            }
            else {
                head = "top";
            }
            for (var i = 0; i < list.length; i++) {
                list[i].setTop(100 - list[i].getTop() - list[i].height());
            }
        }
        list.update = function () {
        	if (list.length > 0) {
        		if (head === "top") {
        			var currHeight = 0;
        			for (var i = 0; i < list.length; i++) {
        				list[i].setTop(currHeight);
        				currHeight += list[i].height();
        			}
        		}
        		else {
        			var currHeight = 100;
        			for (var i = list.length-1; i > -1; i--) {
        				list[i].setTop(currHeight - list[i].height());
        				currHeight -= list[i].height();
        			}
        		}
        	}
        }*/
        list.addMedia = function (media) {
        	if (list.indexOf(media === -1)) {
				/*
        		if (head == "top") {
        			list.push(media)
        		}
        		else {
        			list.unshift(media);
        		}*/
        		list.push(media);
        		media.show()
        		media.checkHeight();
        		list.hideBez();
        	}
        }
        list.removeMedia = function (media) {
        	if (list.indexOf(media !== -1)) {
				/*
        		if (head == "top") {
        			list.shift();
        		}
        		else {
        			list.pop();
        		}*/
        		list.remove(media);
        		media.hide();
        		list.hideBez();
        	}
        }
        list.hideBez = function () {
        	hideBezier();
        }
        return list;
    }
    function showLargePopup(mediaNumber) {
    	var blocker = $(document.createElement('div'));
    	blocker.show();
    	blocker.css({
    		"width": "100%",
    		"height": "100%",
    		"background-color": "rgba(250,250,250,.55)",
    		"position": "absolute",
			"z-index" : "1000",
    	}).attr({
			id : "blocker"
    	})
    	root.append(blocker);
    	var info = getPopupInfo(mediaNumber);
    	var text = $(document.createElement('div'));
    	var title = $(document.createElement('div'));
    	var popup = $(document.createElement('div'));

    	popup.css({
    		"width": "78%",
    		'height': "66%",
    		"left": "11%",
			"top" : "17%",
    		"border": "3px solid " + NOBEL_ORANGE_COLOR,
    		"border-radius": "10px",
    		"background-color": "black",
			"position" : "absolute"
    	})

    	blocker.append(popup);
    	var pixWidth = popup.width()/2

    	text.css({
    		"width": "35%",
    		'height': "85%",
    		"left": "50%",
    		"top": "10%",
    		"position": "absolute",
    		'font-size': ".625em",
			'overflow' : 'hidden'
    	}).text(info.text);
    	title.css({
    		"width": "40%",
    		'height': "8%",
    		"left": "50%",
    		"top": "2.5%",
    		"position": "absolute",
    		"font-weight": "bold",
			'font-size' : "1.25em"
    	}).text(info.title)

		var closeX = $(document.createElement("img"))
    	closeX.attr({
    		src: tagPath + 'images/icons/x.svg',
    		id: 'closeX'
    	})
    	closeX.css({
    		'left': '10px',
    		'position': 'absolute',
    		'top': '10px',
    		'height': '45px',
    		'width': '45px',
            "z-index" : "1000",
    	}).click(function () {
    		$("#blocker").remove()
    	})

    	popup.append(closeX);

    	img = $(document.createElement('img'));
    	img.css({
    		"height": "90%",
    		"width": "auto",
    		"left": "5%",
    		"top": "5%",
			"position" : 'absolute'
    	})
    	console.log(info.image);
    	img.attr({
    		src : info.image
    	})
    	popup.append(img);
    	popup.append(title);
    	popup.append(text);
    	var imgwidth = img.width();
    	img.css({
			"left" : (pixWidth-imgwidth)/2 + "px"
    	})

    	function createExtra(extra) {
    	    var bd = $(document.createElement('div'));
    	    bd.css({
    	        "position": 'relative',
    	        'width': "140px",
                'height' : "140px",
    	        "border": "3px solid " + NOBEL_ORANGE_COLOR,
    	        "border-radius": "10px",
    	        "margin-bottom": "5%",
    	        'color': 'red'
    	    })
    		var d = $(document.createElement('img'));
    		d.css({
    			"position": 'absolute',
    			'width': "140px",
    			"border-radius": "5px",
    			'height': "140px",
    		})
    		d.attr({
				src : extra[0]
    		})
    		var t = $(document.createElement('div'));
    		t.css({
    		    "position": 'absolute',
                "left" : "5px",
    		    'width': "130px",
    		    'color': "black",
                "background-color" : "transparent",
                "font-size" : ".5em"
    		}).text(extra[1])
    		bd.append(d)
            bd.append(t)
			return bd
    	}

    	var extras = $(document.createElement('div')); //Tours and galleries
    	extras.css({
    		"width": "10%",
    		"height": "95%",
    		"top": "2.5%",
    		"right": "2.5%",
			"position" : "absolute"
    	})
    	popup.append(extras);
    	if (info.collections.length > 0) {
    		var gallery = $(document.createElement('div'));
    		gallery.css({
    			"width": "100%",
    			"height": "5%",
    			"color": "white",
				"font-size" : ".8em"
    		}).text("GALLERY")
			extras.append(gallery)
    		for (var i = 0; i < info.collections.length; i++) {
    			extras.append(createExtra(info.collections[i]));
    		}
    	}
    	if (info.tours.length > 0) {
    		var tour = $(document.createElement('div'));
    		tour.css({
    			"width": "100%",
    			"height": "5%",
    			"color": "white",
    			"font-size": ".8em"
    		}).text("TOUR")
    		extras.append(tour)
    		for (var i = 0; i < info.tours.length; i++) {
    			extras.append(createExtra(info.tours[i]));
    		}
    	}
    }

    function getPopupInfo(number) {
        var info = {};


		//START HARDCODING INFO AREA

    	var titles = [
			["Alfred Bernhard", "Robert Nobel","Emanuel Nobel", "Sofie Kapy von Kapivar","Alarik Liedbeck","PLACEHOLDER", "PLACEHOLDER 2"],
			[],
			["peace", "Swedish Academy of Sciences", "the Caroline Institute", "the Academy in Stockholm", "a committee of five persons to be elected by the Norwegian Storting", "whether he be a Scandinavian or not", "Ragnar Sohlman", "my property", "Bofors", "Paris", "San Remo"],
			["patents", "crematorium"]
    	]
    	var images = [
			['Popup_1_1.png', 'Popup_1_2.png', 'Popup_1_3.png', 'Popup_1_4.png', 'Popup_1_5.png', 'Popup_1_5.png','Popup_1_5.png'],
			[],
			['Popup_3_1.png', 'Popup_3_2.png', 'Popup_3_3.png', 'Popup_3_4.png', 'Popup_3_5.png', 'Popup_3_6.png', 'Popup_3_7.png', 'Popup_3_8.png', '', 'Popup_3_10.png', 'Popup_3_11.png'],
			['Popup_4_1.png', 'Popup_4_2.png']
    	]
    	var texts = [
			[
				"Over the course of his life, Alfred Nobel (1833–1896) experienced many different places. He grew up in rather simple circumstances in 1830’s Stockholm. He spent his youth in St. Petersburg, Russia, after his father had established himself as an inventor there. From St. Petersburg, he set off on study trips to Europe and North America. When his parents returned to Stockholm, Nobel joined them there, and together with his father, he attempted to develop new explosives. In the 1860’s, his efforts to put his inventions into profitable production carried him on lengthy business trips and visits to factories in many locations, such as Krümmel, outside Hamburg, Germany, where in 1865, he took up residence. In 1873, Nobel moved to Paris to make his home in what was perhaps the most vibrant metropolis of the day. In Paris, he continued his work as an inventor and increased his wealth, yet he was also plagued by risky business ventures and legal disputes. Toward the end of his life, he settled in San Remo, Italy, where he died on December 10, 1896.",
				"Robert Nobel (1829–96) was Alfred Nobel’s oldest brother. Robert Nobel was involved in the early establishment of the explosives industry. He started a dynamite factory outside Helsinki, and for a few years up to 1870, he was the head of the dynamite factory at Vinterviken outside Stockholm. After a trip to the Caucasus in 1873, Robert Nobel became a pioneer in the oil industry in Baku. In 1881 he ended his active participation in the company, and returned to Sweden.",
				"Emanuel Nobel (1859–1932) was a nephew to Alfred Nobel. After the death of his father, Ludvig Nobel, Emanuel Nobel took over leadership of the Nobel brothers’ oil company. At first, Alfred Nobel seems to have doubted Emanuel’s ability to run the large company, but Emanuel proved that he was equal to the task.",
				"Alfred Nobel, never married. However he had a long relationship with an Austrian woman, Sofie Hess (1851–1919). Alfred Nobel met Sofie Hess during a visit to Baden bei Wien in 1876. This relationship was everything but harmonious. For a while, Alfred seems to have been happy and in love, despite all of his business worries. Soon, however, he became dissatisfied in his relationship with Sofie, yet he did not seem to want to break up with her. He scolded her for being irresponsible and childish. Alfred and Sofie’s drawn-out and uneasy relationship finally came to an end. In 1890, Sofie became pregnant. The father was another man, Nicolaus Kapy von Kapivar, whom she eventually married.",
				"Alarik Liedbeck (1834–1912) and Alfred Nobel had known one another since childhood. In 1866, Liedbeck became head of the nitroglycerin factory at Vinterviken outside Stockholm. Liedbeck remained in this position until 1875, but worked together with Alfred Nobel on the establishment of new factories abroad. Liedbeck moved to Paris in 1876 to work for the Nobel company’s “syndicate,” which was intended to provide technical consultation to dynamite factories in other countries. In 1879, Liedbeck returned to Stockholm. His collaboration with Alfred Nobel continued until his death.",
                "PLACEHOLDER TEXT",
                "PLACEHOLDER TEXT 2"
			],
			[],
			[
                "Alfred Nobel was interested in social issues, and had a special interest in the peace movement. Nobel’s engagement in the cause for world peace was in part inspired by his acquaintance with Bertha von Suttner, and in part by the use of his inventions in war and terrorist attacks. Peace was the fifth and final prize area that Nobel mentioned in his will.",
                "The Royal Swedish Academy of Sciences was formed in 1739 by Carl Linnaeus and a number of other Swedsih scientists. It is an independent organisation whose overall objective is to promote the sciences and strengthen their influence in society. Alfred Nobel blev 1884 utländsk ledamot i akademien.",
                "Karolinska Institutet  is a medical university in Stockholm, Sweden. It was founded in 1810 on Kungsholmen on the west side of Stockholm; the main campus was relocated decades later to Solna, just outside Stockholm. The donation made in the will was not the first that Alfred Nobel made to Karolinska Institutet. In 1890 he donated 50,000 Swedish to the institute in order to create a fund in the memory of his mother Andriette Nobel.",
                "When Alfred Nobel wrote “the Academy in Stockholm,” it was not entirely clear whether he meant the Swedish Academy or the Royal Academy of Sciences. However the interpretation was that he meant the Swedish Academy. The Swedish Academy was founded in 1786 by King Gustav III. The primary purpose of the Academy is to further the 'purity, strength, and sublimity of the Swedish language'.",
                "At the time when Alfred Nobel wrote his will, Sweden and Norway were joined in a union with a common foreign policy. However, Norway had a parliament, the Storting, and Alfred Nobel tasked the Storting with electing a committee, which was to award a peace prize. Despite its members being appointed by a parliament, the committee is a private body.",
                "Over the course of his life, Alfred Nobel experienced many different places. This is an important background to his express wish that no consideration be given to the nationality of the Nobel Prize candidates.",
                "Ragnar Sohlman (1870–1948) was Alfred Nobel’s assistant during the years 1893–96. He began his career with Nobel in Paris, and later also worked with Nobel in San Remo, as well as at Nobel’s experimental laboratory in Bofors, Sweden in 1896–97. In Alfred Nobel’s will, Sohlman, along with Rudolph Lilljequist, was appointed an executor of Nobel’s estate. It was largely due to Sohlman’s work that the Nobel Foundation could be established in 1900. Sohlman was the acting director of the Nobel Foundation during the period 1929–1946.",
                "During his later years Nobel took an interest in ammunition and weapons technology. In 1893 he bought the weapons factory at Bofors, outside the town of Karlskoga in western Sweden. There, Björkborn mansion became Nobel's last home in Sweden. His assistant Ragnar Sohlman worked at the laboratory of the factory.",
                "Alfred Nobel's inventions and companies made him a very rich man. In today's money the estate would be worth approximately 200 million US dollars. According to an estate inventory made after his death his assets in different countries were as follows: \n" +
                    "Country		Amount in Swedish Kronor \n" +
                    "Sweden		5,796,140.00 \n" +
                    "Norway		94,472.28 \n" +
                    "Germany		6,152,250.95 \n" +
                    "Austria		228,754.20 \n" +
                    "France		7,280,817.23 \n" +
                    "Scotland	3,913,938.67 \n" +
                    "England		3,904,235.32 \n" +
                    "Italy		630,410.10 \n" +
                    "Russia		5,232,773.45 \n" +
                    "Total		33,233,792.20", 
                "Alfred Nobel had spent time in Paris in his youth, and at the age of 40, he bought a house there. In the years before this, he had lived in Hamburg, but he had spent most of that time traveling, and his “home” there seems to have been more of a provisory nature. He continued to travel extensively even after he had moved to Paris, but he had definitely found a more permanent residence. He had also gained a home that reflected his financial, social and cultural status.",
                "Around 1890, Alfred Nobel decided to leave Paris, and, in 1891, he bought a villa in San Remo, Italy."
			],
			[
                "Alfred Nobel's incomes came from different sources. The companies he had established with various business partners generated profits, which Nobel received a share of. The patents he held also generated incomes. He held approximately 355 patents in different countries.",
                "Alfred Nobel was a member of the French Cremation Society. In the version of his will that he wrote in 1893, Nobel left money to societies that promoted cremation. Nobel’s fear of 'premature burial' (being buried before one was dead) may have prompted his involvement in the cremation movement. He expressed this fear in the description he wrote about himself when his brother Ludvig asked for an autobiographical article: 'Greatest and only request: to not be buried alive.'" 
			]
    	]
    	var collections = [
			[[[tagPath + 'images/nobelwillimages/ToursAndCollections/aage_n_bohr.jpg',"collection title with a few words in the title!","link"],[tagPath + 'images/nobelwillimages/ToursAndCollections/aage_n_bohr.jpg',"collection title with a few words in the title!","link"]], [], [], [], [],[], []],
			[[], [], []],
			[[], [], [], []],
			[[], [], []]
    	]
    	var tours = [
			[[], [], [],[],[],[], []],
			[[], [], []],
			[[], [], []],
			[[], [], []]
    	]
    	var shortTexts = [
			[
				"short sentence or two about a person 1.  The max length should be more than 30-40 words I've been told.  If so, we might have to reconsider the sizing.  This is probably about the max length of a chunk of text here will be",
				"short sentence or two about a person 2.  The max length should be more than 30-40 words I've been told.  If so, we might have to reconsider the sizing.  This is probably about the max length of a chunk of text here will be",
				"short sentence",
				"short sentence or two about a person 4.  The max length should be more than 30-40 words I've been told.  If so, we might have to reconsider the sizing.  This is probably about the max length of a chunk of text here will be",
				"short sentence or two about a person 5.  The max length should be more than 30-40 words I've been told.  If so, we might have to reconsider the sizing.  This is probably about the max length of a chunk of text here will be",
			],
			[],
			[],
			[]
    	]


    	//END HARDCODING INFO AREA


    	info.image = tagPath + 'images/nobelwillimages/NobelWillPopupImages/'+images[pageNumber-1][number];
    	info.text = texts[pageNumber - 1][number];
    	info.shortText = shortTexts[pageNumber - 1][number];
    	info.collections = collections[pageNumber-1][number];
    	info.tours = tours[pageNumber - 1][number];
    	info.title = titles[pageNumber - 1][number];

    	return info;
    }
    
};


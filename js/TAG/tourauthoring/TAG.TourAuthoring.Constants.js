/* global LADS: true, WinJS: false */
LADS.Util.makeNamespace('LADS.TourAuthoring.Constants');

/**
 * List of constants used across multiple files and locations
 */
LADS.TourAuthoring.Constants = (function () {
    "use strict";
    return {
        aboveRinZIndex: 100000000,                                                          // ridiculous number to beat out RIN's ridiculous z-indexes so we can put things on top of it
        keyframeSize: 21,                                                                   // radius in px, should be small but large enough to recieve touch
        innerKeyframeSize: 17,                                                              // radius of circle that appears when keyframe is selected
        keyframeStrokeW: 5,                                                                 // width of the keyframe circle's perimeter line
        keyframeLineW: 3,
        fadeBtnSize: 15,                                                                    // size of fade button
        rinBorder: 2,                                                                      
        minZoom: 1,                                                                         // min zoom percentage
        maxZoom: 100,                                                                       // max zoom percentage
        handleColor: '#DAD9CC',                                                             // 
        keyframeColor: '#296B2F',                                                           // color of artwork display's keyframe circles
        audioKeyframeColor: '#283F53',                                                      // color of the audio track's keyframes
        selectedKeyframeColor: '#6B293F',                                                   // dark green color of selected keyframe
        displayColor: '#81AD62',                                                            // color of timeline display
        inkDisplayColor: "#AAAAAA",                                                         // color of ink track displays
        selectedDisplayColor: '#143417',
        selectedInkDisplayColor: '#2E2E2E',                                                 // color of a selected ink track display
        inkDragHandleRadius: 20,                                                            // handle to drag at the edges of the ink track display
        doubleTap: 400,                                                                     // double tapping interval (in milliseconds)
        trackHeight: 96,                                                                    // height of a track
        minimizedTrackHeight: 36,                                                           // height of a minimized track block
        esOffset: 0.05,                                                                     // displays on same track need at least this much space btw them to show up properly
        timeRulerSize: 54,                                                                  // size of the timeline rule
        defaultVolume: 0.8,                                                                 // default volume of audio tracks
        epsilon: 0.01,
        menuDecimals: 2,                                                                    // number of decimals to round to in menu inputs
        maxTourLength: 15 * 60,                                                             // max tour length in seconds elapsed
        minMediaLength: 5,                                                                  // min length of a display in seconds elapsed
        inkTrackOffset: 0,                                                                  // this functionality is probably obsolete
        defaultFade: 0.5,                                                                   // default fade times of a display in seconds
        displayEpsilon: 0.5
    };
})();
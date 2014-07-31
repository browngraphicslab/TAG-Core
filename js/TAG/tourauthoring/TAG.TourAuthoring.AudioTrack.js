﻿TAG.Util.makeNamespace('TAG.TourAuthoring.AudioTrack');

/**Creates an Audio track
 * @class TAG.TourAuthoring.AudioTrack
 * @constructor
 * @param spec  Specifications (see Track class for details);
 * @param my    After superclass is called, will contain displays and keyframes arrays
 *              Don't pass in unless you are subclassing this
 */
TAG.TourAuthoring.AudioTrack = function (spec, my) {
    "use strict";

    // Call super-constructor
    spec.type = TAG.TourAuthoring.TrackType.audio;
    my = my || {};
    var that = TAG.TourAuthoring.Track(spec, my);
    my.track.addClass('audio');
    return that;
};
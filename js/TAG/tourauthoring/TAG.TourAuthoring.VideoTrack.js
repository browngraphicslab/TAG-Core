TAG.Util.makeNamespace('TAG.TourAuthoring.VideoTrack');

/**Creates a Video track
 * @class TAG.TourAuthoring.VideoTrack
 * @constructor 
 * @param {Object} spec  Specifications (see Track class for details);
 * @param {Object} my    After superclass is called, will contain displays and keyframes arrays
 *                       Don't pass in unless you are subclassing this
 */
TAG.TourAuthoring.VideoTrack = function (spec, my) {
    "use strict";

    // Call super-constructor
    spec.type = TAG.TourAuthoring.TrackType.video;
    my = my || {};
    var that = TAG.TourAuthoring.Track(spec, my);
    my.track.addClass('video');
    return that;
};
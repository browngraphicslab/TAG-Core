TAG.Util.makeNamespace('TAG.TourAuthoring.ImageTrack');

/**Creates an Image track
 * @class TAG.TourAuthoring.ImageTrack
 * @param {Object} spec              Specifications (see Track class for details);
 * @param spec.thumbnail
 * @param {Object} my                After superclass is called, will contain displays and keyframes arrays
 *                                   Don't pass in unless you are subclassing this
 */
TAG.TourAuthoring.ImageTrack = function (spec, my) {
    "use strict";

    // Call super-constructor
    spec.type = TAG.TourAuthoring.TrackType.image;
    my = my || {};
    var that = TAG.TourAuthoring.Track(spec, my);
    my.track.addClass('image');
    return that;
};
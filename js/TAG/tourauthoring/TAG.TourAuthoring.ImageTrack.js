LADS.Util.makeNamespace('LADS.TourAuthoring.ImageTrack');

/**Creates an Image track
 * @class LADS.TourAuthoring.ImageTrack
 * @param {Object} spec              Specifications (see Track class for details);
 * @param spec.thumbnail
 * @param {Object} my                After superclass is called, will contain displays and keyframes arrays
 *                                   Don't pass in unless you are subclassing this
 */
LADS.TourAuthoring.ImageTrack = function (spec, my) {
    "use strict";

    // Call super-constructor
    spec.type = LADS.TourAuthoring.TrackType.image;
    my = my || {};
    var that = LADS.TourAuthoring.Track(spec, my);
    my.track.addClass('image');
    return that;
};
TAG.Util.makeNamespace('TAG.TourAuthoring.ArtworkTrack');

/**Creates an Artwork track
 * @class TAG.TourAuthoring.ArtworkTrack
 * @constructor
 * @param {Object} spec              Specifications (see Track class for details);
 * @param spec.thumbnail
 * @param {Object} my     After superclass is called, will contain displays and keyframes arrays
 *               Don't pass in unless you are subclassing this
 */
TAG.TourAuthoring.ArtworkTrack = function (spec, my) {
    "use strict";

    // Call super-constructor
    spec.type = TAG.TourAuthoring.TrackType.artwork;
    my = my || {};
    var that = TAG.TourAuthoring.Track(spec, my);
    my.track.addClass('artwork');
    return that;
};
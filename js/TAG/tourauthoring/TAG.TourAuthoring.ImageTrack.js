TAG.Util.makeNamespace('TAG.TourAuthoring.ImageTrack');

/**
 * Creates an Image track
 * @param spec              Specifications (see Track class for details);
 * @param spec.thumbnail
 * @param my                After superclass is called, will contain displays and keyframes arrays
 *              Don't pass in unless you are subclassing this
 */
TAG.TourAuthoring.ImageTrack = function (spec, my) {
    "use strict";

    // Call super-constructor
    spec.type = TAG.TourAuthoring.TrackType.image;
    my = my || {};
    var that = TAG.TourAuthoring.Track(spec, my);

    my.track.addClass('image');
    //my.svg.classed('image', true);

    // Artwork-specific functions

    // Keyframes

    // Export to RIN format

    // Associated Inks
    //TAG.TourAuthoring.InkablePart(that, my);

    return that;
};
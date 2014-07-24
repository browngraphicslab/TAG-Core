TAG.Util.makeNamespace('TAG.TourAuthoring.ArtworkTrack');

/**
 * Creates an Artwork track
 * @param spec              Specifications (see Track class for details);
 * @param spec.thumbnail
 * @param my     After superclass is called, will contain displays and keyframes arrays
 *              Don't pass in unless you are subclassing this
 */
TAG.TourAuthoring.ArtworkTrack = function (spec, my) {
    "use strict";

    // Call super-constructor
    spec.type = TAG.TourAuthoring.TrackType.artwork;
    my = my || {};
    var that = TAG.TourAuthoring.Track(spec, my);

    my.track.addClass('artwork');
    //my.svg.classed('artwork', true);

    // Artwork-specific functions

    // Keyframes

    // Export to RIN format

    // Associated Inks
    //TAG.TourAuthoring.InkablePart(that, my);

    return that;
};
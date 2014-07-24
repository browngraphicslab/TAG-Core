TAG.Util.makeNamespace('TAG.TourAuthoring.InkablePart');

/**
 * Mix-in / part adding Inkability to tracks - currently not used
 * @param that      the object you want to add inkability to
 * @param my        shared & protected variables
 *                  'assets' parameter (array) will be added
 */
TAG.TourAuthoring.InkablePart = function (that, my) {
    "use strict";

    my.assets = [];
    function addAsset (asset) {
        assets.push(asset);
    };
    that.addAsset = addAsset;

    function removeAsset () {
        // TODO
    };
    that.removeAsset = removeAsset;

    return that;
};
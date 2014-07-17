TAG.Util.makeNamespace("TAG.Util.Constants");

TAG.Util.Constants = (function (options) {
    "use strict";

    var constants = {

    };

    var pages = {
        START_PAGE:       0,
        COLLECTIONS_PAGE: 1,
        ARTWORK_VIEWER:   2,
        VIDEO_PLAYER:     3,
        TOUR_PLAYER:      4,
        AUTHORING_HUB:    5,
        ARTWORK_EDITOR:   6,
        TOUR_AUTHORING:   7
    };


    return{
        pages: pages,
        get: getConstant,
        set: setConstant
    };

    function getConstant(name, defaultVal) {
        return constants[name] || defaultVal;
    }
    function setConstant(name, value) {
        constants[name] = value;
    }
})();
TAG.Util.makeNamespace('TAG.TourAuthoring.Command');

/**Interface representing an action taken by the user
 * Stored in the undo/redo stack, used for multi-level undo/redo
 * @class TAG.TourAuthoring.Command
 * @constructor
 * @param {Object} spec      An object with the following keys:
 *                      execute: Function to execute the command
 *                      unexecute: Function to undo the command
 */
TAG.TourAuthoring.Command = function (spec, my) {
    "use strict";

    var that = {};
    that.execute = spec.execute;
    that.unexecute = spec.unexecute;
    that.savedState = false;
    return that;
};
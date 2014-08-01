TAG.Util.makeNamespace('TAG.TourAuthoring.UndoManager');

/**Keeps track of commands and changes issued by program and order of issuing
 * Can unexecute or execute (undo / redo) these commands
 * @class TAG.TourAuthoring.UndoManager
 * @constructor
 * @return {Object} that                public methods of the class
 */
TAG.TourAuthoring.UndoManager = function () {
    "use strict";

    var that = {                                                // object containing the public methods of the class
            logCommand: logCommand,
            dirtyStateGetter: dirtyStateGetter,
            undoStackSize: undoStackSize,
            setPrevFalse: setPrevFalse,
            setInitialized: setInitialized,
            undo: undo,
            redo: redo,
            clear: clear,
            greyOutBtn: greyOutBtn,
            combineLast: combineLast
        },
        undoStack = [],                                         // stack keeps track of the order of commands to undo actions
        redoStack = [],                                         // stack keeps track of the order of commands to redo actions
        initialized = false,                                    // used to prevent undoStack from updating when timeline is opening
        undoStackSizeOriginal = 0,                              // default stack size is 0
        stackSize = 75;                                         // max size is 75

    ////////////////////
    // PUBLIC METHODS //
    ////////////////////

    /**Log a command that has just been executed, ie. add it to the undo stack
     * @method logCommand
     * @param command       TAG.TourAuthoring.Command that was just run
     */
    function logCommand(command) {
        if (initialized === true) {
            if (command.savedState === undefined)
                command.savedState = false;
            if (redoStack.length > 0) {
                redoStack = []; // when should do this?
                $('.redoButton').css({ 'opacity': '0.4' });
                console.log("clear redoStack?");
            }
            undoStack.push(command);
            $('.undoButton').css({ 'opacity': '1.0' });
            if (undoStack.length > stackSize) {
                var diff = undoStack.length - stackSize;
                undoStack.splice(0, diff);
            }
        }
    }
    
    /**Function returns the savedState of the element in the top of the stack, which determines if timeline is dirty or not
     * @method dirtyStateGetter
     */
    function dirtyStateGetter() {
        if (undoStack.length > 0) {
            console.log("SAVED STATE //TOP//FROM DSG// ===" + undoStack[undoStack.length - 1].savedState);
            return undoStack[undoStack.length - 1].savedState;
        }
        return true;
    }
   
    /**Returns undoStack size
     * @method undoStackSize
     * @return {Number} undoStack.length
     */
    function undoStackSize() {
        return undoStack.length;
    }
    
    /**Sets the savedState of the top element in undoStack to true, and the rest to false 
     * @method setPrevFalse
     */
    function setPrevFalse() {
        if (undoStack.length > 0) {
            undoStack[undoStack.length - 1].savedState = true;
            for (var i = 0; i < undoStack.length - 1; i++) {
                undoStack[i].savedState = false;
            }
        }
    }
    
    /**Called by loadRIN method in timeline class
     * @method setInitialized
     * @param {Boolean} boolVal
     */
    function setInitialized(boolVal) {
        initialized = boolVal;
    }
    
    /**Undoes the last action when the 'undo' button is clicked
     * @method undo
     */
    function undo() {
        var toUndo;
        if (undoStack.length > 0) {
            toUndo = undoStack.pop();
            toUndo.unexecute();
            redoStack.push(toUndo);
            $('.redoButton').css({ 'opacity': '1.0' });
            if (undoStack.length === 0) {
                $('.undoButton').css({ 'opacity': '0.4' });
            }
        } else {
            $('.undoButton').css({ 'opacity': '0.4' });
        }
    }
    
    /**Redoes the last undone action when redo button is clicked
     * @method redo
     */
    function redo() {
        if (redoStack.length > 0) {
            var toRedo = redoStack.pop();
            toRedo.execute();
            undoStack.push(toRedo);
            $('.undoButton').css({ 'opacity': '1.0' });
            if (redoStack.length === 0) {
                $('.redoButton').css({ 'opacity': '0.4' });
            }
        } else {
            $('.redoButton').css({ 'opacity': '0.4' });
        }
    }
    
    /**Clears undo / redo stack
     * Called on save or after loading
     * @method clear
     */
    function clear() {
        undoStack = [];
        redoStack = [];
    }
    
    /**Greys out the undo/redo buttons when there is no possible action
     * @method greyOutBtn
     */
    function greyOutBtn() {
        $('.undoButton').css({ 'opacity': '1.0' });
        $('.redoButton').css({ 'opacity': '1.0' });
        if (undoStack.length < 1) {
            $('.undoButton').css({ 'opacity': '0.4' });
        }
        if (redoStack.length < 1) {
            $('.redoButton').css({ 'opacity': '0.4' });
        }
    }
    
    /**Utility for combining together multiple commands
     * (Originally used for tying auto-creation of displays together with track creation)
     * @method combineLast
     * @param n     Number of commands to tie together
     */
    function combineLast(n) {
        var command, i;
        n = n || 2;
        command = {
            execute: function () {
                for (i = 0; i < n; i++) {
                    redo();
                }
            },
            unexecute: function () {
                for (i = 0; i < n; i++) {
                    undo();
                }
            }
        };
        logCommand(command);
    }
    
    return that;
};
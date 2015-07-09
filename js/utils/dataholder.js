/*
 * dz/lz - DataHolder
 * 
 * DataHolder is designed to be a centralized place to store all tour authoring data.
 */

function DataHolder() {
    "use strict";
    this._trackArray = [];
    this._scoreFunctionMin = function (a) {
        return a.bound;
    };
    this._selectedTrack;

    this._lastPreviewerHeight;

    //multi-select heaps used for storing the movement constraints
    this._leftExternal = new binaryHeap(this._scoreFunctionMin);
    this._leftInternal = new binaryHeap(this._scoreFunctionMin);
    this._rightExternal = new binaryHeap(this._scoreFunctionMin);
    this._rightInternal = new binaryHeap(this._scoreFunctionMin);

    this._dispComparator = function (a, b) {
        if (a.display.getStart() < b.display.getStart()) {
            return -1;
        } else if (a.display.getStart() > b.display.getStart()) {
            return 1;
        } else {
            return 0;
        }
    };

    this._kfComparator = function (a, b) {
        if (a.getTime() < b.getTime()) {
            return -1;
        } else if (a.getTime() > b.getTime()) {
            return 1;
        } else {
            return 0;
        }
    };

    this._dispValuation = function (value, container) {
        if (!container) {
            return false;
        } else if (value < container.display.getStart()) {
            return -1;
        } else if (value > container.display.getStart()) {
            return 1;
        } else {
            return 0;
        }
    }

    this._kfValuation = function (value, keyframe) {
        if (!keyframe) {
            return false;
        } else if (value < keyframe.getTime()) {
            return -1;
        } else if (value > keyframe.getTime()) {
            return 1;
        } else {
            return 0;
        }
    }
};

DataHolder.prototype.getLastPreviewerHeight = function () {
    return this._lastPreviewerHeight;
}

DataHolder.prototype.setLastPreviewerHeight = function (height) {
    this._lastPreviewerHeight = height;
}

DataHolder.prototype.reInitHeaps = function () {
    this._leftExternal = new binaryHeap(this._scoreFunctionMin);
    this._leftInternal = new binaryHeap(this._scoreFunctionMin);
    this._rightExternal = new binaryHeap(this._scoreFunctionMin);
    this._rightInternal = new binaryHeap(this._scoreFunctionMin);
}

/* TRACKS */
DataHolder.prototype.insertTrack = function (trackObj, index) {

    // DEBUG
    //var dupCheck = [];
    //for (var i = 0; i < this._trackArray.length; i++) {
    //    dupCheck.push(this._trackArray[i]);
    //}

    //if (dupCheck.indexOf(trackObj) >= 0) {
    //    console.log("DUPLICATE TRACK!");
    //}
    // end debug

    var newTrack = {
        track: trackObj,
        displays: new AVLTree(this._dispComparator, this._dispValuation),
    }
    trackObj.setStorageContainer(newTrack);


    if (typeof index === "undefined" || index === null) {
        this._trackArray.push(newTrack);
    } else {
        // if index is specified we are inserting before the track at the specified index
        this._trackArray.splice(index, 0, newTrack);
    }

    // step 2: sort track array and update tracks with array indices for positional awareness
    this.mapTracks(function (current, i) {
        current.track.updatePos(i);
    });
    // make sure the position record is within the trackObj - this is essential for O(1) lookup
    return newTrack;
};

DataHolder.prototype.removeTrack = function (trackObj) {
    // find track dataholder object using its array index, stored by the track object
    var toRemove = this._trackArray[trackObj.getPos()];

    // remove track from array
    this._trackArray.splice(trackObj.getPos(), 1);
    // update array
    this.mapTracks(function (current, i) {
        current.track.updatePos(i);
    });

    // return the dataholder object
    return toRemove;
};

// ----- for selectTrack and getSelectedTrack -----
// NOTE: takes in a TRACK OBJECT - this is not the same as the container object that is inserted
// into this._trackArray!
//
// It is the same as the .track object stored within the container, e.g. this._trackArray[5].track
DataHolder.prototype.selectTrack = function (trackObj) {
    this._selectedTrack = trackObj;
};

DataHolder.prototype.getSelectedTrack = function () {
    return this._selectedTrack;
};

DataHolder.prototype.indexOfTrack = function (trackObj) {
    var i;
    for (i = 0; i < this._trackArray.length; i++) {
        var current = this._trackArray[i];
        if (current.track = trackObj) {
            return i;
        }
    }
    return false;
};

DataHolder.prototype.mapTracks = function (action) {
    this._trackArray.map(action);
};

//note: display also calls getType(), on my.getType(), so look to replace there if possible?
DataHolder.prototype.getType = function (trackObj) {
    return trackObj.getType();
};

DataHolder.prototype.getInkEnabled = function (trackObj) {
    return trackObj.getInkEnabled();
};

DataHolder.prototype.getInkLink = function (trackObj) {
    return trackObj.getInkLink();
};

DataHolder.prototype.getTracks = function () {
    return this._trackArray;
};

DataHolder.prototype.numTracks = function () {
    return this._trackArray.length;
};

DataHolder.prototype.getTrackByIndex = function (index) {
    return this._trackArray[index].track;
}

DataHolder.prototype.findTrackByTitle = function (title) {
    var i;
    for (i = 0; i < this._trackArray.length; i++) {
        if (this._trackArray[i].track.getTitle() === title) {
            return this._trackArray[i].track;
        }
    }
    return null;
}


/* 
    * DISPLAYS 
    * Displays are stored in a container along with a sub-AVL tree for the display's keyframes.
    * They are aware of their own container for O(1) access to a display's keyframes as well as 
    * to facilitate searching within the AVL tree.
    * 
    */
DataHolder.prototype.addDisplay = function (trackNum, displayObj) {
    var parentTrack = this._trackArray[trackNum];
    var keyframes = new AVLTree(this._kfComparator, this._kfValuation);
    var newDisplay = {
        display: displayObj,
        keyframes: keyframes,
        displayTree: parentTrack.displays,
        hostTrack: parentTrack.track,
    }
    parentTrack.displays.add(newDisplay);
    displayObj.setStorageContainer(newDisplay);
    displayObj.setKeyframeTree(keyframes);
    this.mapDisplays(parentTrack, function (disp, i) {
        disp.display.setID(i);
    });

    return newDisplay;
};

DataHolder.prototype.mapDisplays = function (track, action) {
    track.displays.map(action);
}

DataHolder.prototype.removeDisplay = function (trackNum, displayObj) {
    var parentTrack = this._trackArray[trackNum];
    var toRemove = displayObj.getStorageContainer();
    return parentTrack.displays.remove(toRemove);
};

DataHolder.prototype.findDisplay = function (trackNum, displayObj) {
    var parentTrack = this._trackArray[trackNum];
    var toFind = displayObj.getStorageContainer();
    return parentTrack.displays.find(toFind);
};

DataHolder.prototype.findPreviousDisplay = function (trackNum, displayObj) {
    var parentTrack = this._trackArray[trackNum];
    var toFind = displayObj.getStorageContainer();
    return parentTrack.displays.findPrevious(toFind);
};

DataHolder.prototype.findNextDisplay = function (trackNum, displayObj) {
    var parentTrack = this._trackArray[trackNum];
    var toFind = displayObj.getStorageContainer();
    return parentTrack.displays.findNext(toFind);
};

DataHolder.prototype.minDisplay = function (trackNum) {
    var parentTrack = this._trackArray[trackNum];
    return parentTrack.displays.min();
};

DataHolder.prototype.maxDisplay = function (trackNum) {
    var parentTrack = this._trackArray[trackNum];
    return parentTrack.displays.max();
};

DataHolder.prototype.replaceKeyframes = function (displayObj, kfClone) {
    displayObj.getStorageContainer().keyframes = kfClone;
};

DataHolder.prototype.getDisplays = function (trackNum) {
    return this._trackArray[trackNum] && this._trackArray[trackNum].displays;
};


/* 
    * KEYFRAMES 
    * These don't need a container object because they are the lowest "unit"
    *
    */
DataHolder.prototype.addKeyframe = function (displayObj, keyframe) {
    var parentDisplay = displayObj.getStorageContainer();
    parentDisplay.keyframes.add(keyframe);
    return newKeyframe;
};

DataHolder.prototype.removeKeyframe = function (displayObj, keyframe) {
    var parentDisplay = displayObj.getStorageContainer();
    return parentDisplay.keyframes.remove(keyframe);
};

DataHolder.prototype.findKeyframe = function (displayObj, keyframe) {
    var parentDisplay = displayObj.getStorageContainer();
    return parentDisplay.keyframes.find(keyframe);
};

DataHolder.prototype.findPrevKeyframe = function (displayObj, keyframe) {
    var parentDisplay = displayObj.getStorageContainer();
    return parentDisplay.keyframes.findPrevious(keyframe);
};

DataHolder.prototype.findNextKeyframe = function (displayObj, keyframe) {
    var parentDisplay = displayObj.getStorageContainer();
    return parentDisplay.keyframes.findNext(keyframe);
};

DataHolder.prototype.firstKeyframe = function (displayObj) {
    var parentDisplay = displayObj.getStorageContainer();
    return parentDisplay.keyframes.min();
};

DataHolder.prototype.lastKeyframe = function (displayObj) {
    var parentDisplay = displayObj.getStorageContainer();
    return parentDisplay.keyframes.max();
};

DataHolder.prototype.mapKeyframes = function (display, action) {
    display.keyframes.map(action);
};

DataHolder.prototype.getKeyframes = function (display) {
    return display.keyframes;
};

ITE.utils = function(){ //contains utility functions
    var extends = function (child, super) { //CHECK IF CORRECT
        child.prototype = super;
    }

    var sanitizeConfiguration = function (playerConfiguration, options){
        if (typeof options.attachVolume === 'boolean'){
            playerConfiguration.attachVolume  = options.attachVolume;
        }
        if (typeof options.attachLoop === 'boolean'){
            playerConfiguration.attachLoop  = options.attachLoop;
        }
        if (typeof options.attachPlay === 'boolean'){
            playerConfiguration.attachPlay  = options.attachPlay;
        }
        if (typeof options.attachProgressBar === 'boolean'){
            playerConfiguration.attachProgressBar  = options.attachProgressBar;
        }
        if (typeof options.attachFullScreen === 'boolean'){
            playerConfiguration.attachFullScreen  = options.attachFullScreen;
        }
        if (typeof options.attachProgressIndicator === 'boolean'){
            playerConfiguration.attachProgressIndicator  = options.attachProgressIndicator;
        }
        if (typeof options.hideControls === 'boolean'){
            playerConfiguration.hideControls  = options.hideControls;
        }
        if (typeof options.autoPlay === 'boolean'){
            playerConfiguration.autoPlay  = options.autoPlay;
        }
        if (typeof options.autoLoop === 'boolean'){
            playerConfiguration.autoLoop  = options.autoLoop;
        }
        if (typeof options.setMute === 'boolean'){
            playerConfiguration.setMute  = options.setMute;
        }
        if ((typeof options.setInitVolume === 'number') && (0 < options.setInitVolume) && (100 > options.setInitVolume){
            playerConfiguration.setInitVolume  = options.setInitVolume;
        }
        if (typeof options.allowSeek === 'boolean'){
            playerConfiguration.allowSeek  = options.allowSeek;
        }
        if (typeof options.setFullScreen === 'boolean'){
            playerConfiguration.setFullScreen  = options.setFullScreen;
        }
        if ((typeof options.setStartingOffset === 'number'){
            playerConfiguration.setStartingOffset  = options.setStartingOffset;
        }
    }

};

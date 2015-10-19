/**
 * TAG idle timer class. Wraps idle timer-related
 * functions in a contained scope.
 * @class TAG.Util.IdleTimer
 * @constructor
 * @return {Object}      a couple public methods
 */

var TAG = TAG || {};
TAG.Util.IdleTimer = (function() {
    var overlay,
        stageTwoDuration,
        overlayInterval,
        tourIsPlaying = false;

     /**
      * This two-stage timer takes in two duration-callback pairs. The stage one 
      * callback is put on a timeout configured to the pre-specified duration
      * which will tick down until the callback executes or until it is restarted. 
      * Upon the stage one callback's execution, the stage two callback's timeout
      * is then started. However, if the second callback's timeout is reset, it will 
      * restart the entire timer back to stage one. Upon the second callback's 
      * execution, the timer will sit idle until the reset method is invoked.
      * @method TwoStageTimer
      * @param {Object} stageOne         the stage one timer pair (see timerPair helper function below)
      * @param {Object} stageTwo         the stage two timer pair
      */
    function TwoStageTimer(stageOne, stageTwo) {
        stageOne = stageOne || {};
        stageTwo = stageTwo || {};
        var s1d = 60000, 
            s1c = stageOne.callback || defaultStageOne,          // stage one callback
            s2d = stageTwo.duration || 10000,                    // duration of stage two timer
            s2c = stageTwo.callback || defaultStageTwo,          // stage two callback
            s1TimeoutID = null,          // stage one timeout
            s2TimeoutID = null,          // stage two timeout
            started     = false;         // whether the TwoStageTimer has started

        stageTwoDuration = s2d;

        /**
         * Start the timer (the first stage)
         * @method start
         */
        function start() {
            //if (jQuery.data(document.body, "isKiosk") == true && $.find("video").length == 0 && tourIsPlaying == false) {
            if (!tourIsPlaying) {
                doNothing("timer start")
                if(idleDuration !== 0) { // default is no idle timer
                    s1TimeoutID = setTimeout(fireS1, s1d);
                    started = true;

                }
            }
            else {
                kill();
            }
        }

        /**
         * Kill the timer by stopping both timeouts and setting started to false
         * @method kill
         */
        function kill() {
            doNothing("timer killed")
            s1TimeoutID && clearTimeout(s1TimeoutID);
            s2TimeoutID && clearTimeout(s2TimeoutID);
            overlayInterval && clearInterval(overlayInterval);
            started = false;
        }

        /**
         * Returns whether or not the timer is stopped
         * @method isStopped
         * @return {Boolean}       this._started
         */
        function isStopped() {
            return started;
        }


        /*
        * Pass in a boolean to set the idle timer's knowledge of a tour playing.  will not play if the boolean is true
        */
        function tourPlaying(isTourPlaying) {
            tourIsPlaying = isTourPlaying;
        }
        function getTourPlaying() {
            return tourIsPlaying
        }
        /**
         * A general restart method -- clears timeouts and intervals and
         * restarts stage one timeout
         * @method restart
         */
        function restart() {
            s1TimeoutID && clearTimeout(s1TimeoutID);
            s2TimeoutID && clearTimeout(s2TimeoutID);
            overlayInterval && clearInterval(overlayInterval);

            start();
        }

        /**
         * Reinitialize the timer with new timerPairs
         * method reinitialize
         * @param {timerPair} newS1         new stage one timerPair
         * @param {timerPair} newS2         new stage two timerPair
         */
        function reinitialize(newS1, newS2) {
            clearTimeout(s1TimeoutID);
            clearTimeout(s2TimeoutID);
            s1d = newS1.duration;
            s1c = newS1.callback;
            s2d = newS2.duration;
            s2c = newS2.callback;
            s1TimeoutID = null;
            s2TimeoutID = null;

            stageTwoDuration = s2d;

            started = false;

            overlayInterval && clearInterval(overlayInterval);
        }

        /**
         * Private method to fire stage one timer
         * @method fireS1
         */
        function fireS1() {
            s1c();
            s2TimeoutID = setTimeout(fireS2, s2d);
        }

        /**
         * Private method to fire stage two timer
         * @method fireS2
         */
        function fireS2() {
            s2c();
            started = false;
        }

        return {
            start:        start,
            kill:         kill,
            isStopped:    isStopped,
            restart:      restart,
            reinitialize: reinitialize,
            s1d: s1d,
            tourPlaying: tourPlaying,
            getTourPlaying:getTourPlaying
        };
    }

    /**
     * Create a timerPair object
     * @method timerPair
     * @param {Number} duration       length of timer
     * @param {Function} callback     function to be called when timer expires
     */
    function timerPair(duration, callback) {
        return {
            duration: duration,
            callback: callback
        }
    }

    /**
     * Create default stage one timerPair
     * @method defaultStageOne
     * @return {Object}               default stage one pair
     */
    function defaultStageOne() {
        return createIdleOverlay();
    }

    /**
     * Create default stage two timerPair
     * @method defaultStageTwo
     * @return {Object}               default stage two pair
     */
    function defaultStageTwo() {
        return returnHome();
    }

    /**
     * Create default idle timer warning overlay -- default
     * stage one callback
     * @method createIdleOverlay
     */
    function createIdleOverlay() {
        var textRegion    = $(document.createElement('div')).addClass('idleTimerTextRegion'),
            clock         = $(document.createElement('div')).addClass('idleTimerClock'),
            time          = 0,
            origDate      = new Date(),
            origTime      = origDate.getTime(),
            width;

        overlay = $(TAG.Util.UI.blockInteractionOverlay(0.8));
        
        // do this in styl file
        overlay.css({
            'text-align': 'center'
        });

        textRegion.css({
            'font-size': '2em',
            'left':  '10%',
            'position': 'absolute',
            'text-align': 'center',
            'top':   '30%',
            'width': '80%'
        });

        clock.css({
            'background-color': 'white',
            'border': '2px solid #ffffff',
            'border-radius': '50%',
            'display': 'block',
            'left': '45%',
            'position': 'absolute',
            'top': '50%',
            'width': '10%'
        });

        textRegion.html('Starting a new session when the timer below expires.<br />Tap anywhere to continue exploring.');

        overlay.append(textRegion);
        overlay.append(clock);

        $('#tagRoot').append(overlay);
        overlay.fadeIn();

        width = clock.width();
        clock.css('height', width + 'px');

        // when overlay is clicked, restart timer and remove overlay
        overlay.on('click', function() {
            overlay.off('click');
            idleTimer && idleTimer.restart(); // uses the global idleTimer (declared in Gruntfile.js)
            removeIdleOverlay();
        });

        // create ticking clock
        overlayInterval = setInterval(function() {
            var percentDone,
                gradString,
                date = new Date();

            time        = date.getTime() - origTime;
            percentDone = Math.min(time / stageTwoDuration, 1);
            gradString  = percentDone <= 0.5 ?
                            'linear-gradient('+(90+360*percentDone)+'deg, transparent 50%, black 50%), linear-gradient(90deg, black 50%, transparent 50%)' :
                            'linear-gradient('+(90+360*(percentDone - 0.5))+'deg, transparent 50%, white 50%), linear-gradient(90deg, black 50%, transparent 50%)'

            clock.css('background-image', gradString);

            if(percentDone >= 1) {
                clearInterval(overlayInterval);
            }
        }, 10);
    }

    /**
     * Remove the default warning overlay
     * @method removeIdleOverlay
     */
    function removeIdleOverlay() {
        overlay && overlay.fadeOut(overlay.remove);
    }

    /**
     * Returns to home page -- default stage two callback
     * @method returnHome
     */
    function returnHome() {
        return;

        TAG.Util.Splitscreen.setOn(false);
        TELEMETRY_SESSION_ID = TAG.Util.IdCreator();

        if(currentPage.name !== TAG.Util.Constants.pages.COLLECTIONS_PAGE || !currentPage.obj || !currentPage.obj.loadFirstCollection) {
            catalog = new TAG.Layout.CollectionsPage();
            TAG.Util.UI.slidePageRight(catalog.getRoot());
        } else {
            removeIdleOverlay();
            currentPage.obj.loadFirstCollection();
        }
    }

    /**
     * Restart the idle timer; this is a utility function and could be defined elsewhere
     * @method restartIdleTimer
     */
    function restartTimer() {
        idleTimer && idleTimer.restart();
        //doNothing('idle timer started');
    }

    return {
        TwoStageTimer: TwoStageTimer,
        timerPair: timerPair,
        restartTimer: restartTimer,
        removeIdleOverlay: removeIdleOverlay
    };
})();

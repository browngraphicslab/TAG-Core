/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

/// <reference path="../contracts/DiscreteKeyframeESBase.js" />
/// <reference path="../contracts/IExperienceStream.js" />
/// <reference path="../contracts/IOrchestrator.js" />
/// <reference path="../core/Common.js" />
/// <reference path="../core/EventLogger.js" />
/// <reference path="../core/PlayerConfiguration.js" />
/// <reference path="../core/ResourcesResolver.js" />
/// <reference path="../core/TaskTimer.js" />

(function (rin) {
    "use strict";
    var PhotosynthES = function (orchestrator, esData) {
        this.stateChangedEvent = new rin.contracts.Event();
        this._orchestrator = orchestrator;
        this._userInterfaceControl = rin.util.createElementWithHtml(PhotosynthES.elementHTML).firstChild;
        this._esData = esData;
    };

    PhotosynthES.prototype = {
        load: function (experienceStreamId) {
            this.setState(rin.contracts.experienceStreamState.ready);
        },
        play: function () {
        },
        pause: function () {
        },
        unload: function () {
        },
        getState: function () {
            return this._state;
        },
        setState: function (value) {
            if (this._state === value) return;
            var previousState = this._state;
            this._state = value;
            this.stateChangedEvent.publish(new rin.contracts.ESStateChangedEventArgs(previousState, value, this));
        },
        stateChangedEvent: new rin.contracts.Event(),
        getUserInterfaceControl: function () { return this._userInterfaceControl; },

        _userInterfaceControl: rin.util.createElementWithHtml(""),
        _orchestrator: null,
        _esData: null
    };

    PhotosynthES.elementHTML = "<div style='width:100%;height:100%;position:absolute;color:white;font-size:24px'>Photosynth ES Placeholder: This is placeholder ES until we get HTML5 version...</div>";

    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.PhotosynthExperienceStream", function (orchestrator, esData) { return new PhotosynthES(orchestrator, esData); });
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.PhotosynthES", function (orchestrator, esData) { return new PhotosynthES(orchestrator, esData); });

})(window.rin = window.rin || {});
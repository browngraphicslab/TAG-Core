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
    // ES for hosting Ink elements clips.
    var InkES = function (orchestrator, esData) {
        InkES.parentConstructor.apply(this, arguments);
        this._orchestrator = orchestrator;
        this._userInterfaceControl = rin.util.createElementWithHtml(InkES.elementHTML).firstChild;
        this._rinInkContainer = this._userInterfaceControl.getElementsByClassName("rinInkContainer")[0];
        this._esData = esData;
        this.link = null;

        if (esData.data.linkToExperience) {
            this.link = esData.data.linkToExperience;
            this.embeddedItem = this.link.embedding;
        }
    };

    rin.util.extend(rin.contracts.DiscreteKeyframeESBase, InkES);

    InkES.prototypeOverrides = {
        // Load and initialize the video.
        load: function (experienceStreamId) {
            var self = this;

            //// Check if valid link and hook up events
            function findLinkedES() {
                // Get the linked ES instance
                var allESes = self._orchestrator.getCurrentESItems();
                self.linkedES = allESes.firstOrDefault(function (es) {
                    return es.id === self.link.experienceId;
                });

                if (self.linkedES && self.linkedES.experienceStream &&
                    self.linkedES.experienceStream.getState() === "ready" &&
                    self.linkedES.experienceStream.viewportChangedEvent && self.linkedES.experienceStream.raiseViewportUpdate) {

                    self.linkedES.experienceStream.viewportChangedEvent.subscribe(function (newViewport) {
                        self.viewportChanged(newViewport);
                    });

                    self.loadInkItems();
                    self.linkedES.experienceStream.raiseViewportUpdate();
                    return;
                }
                else {
                    setTimeout(findLinkedES, 1000);
                }
            }

            if (self.link.enabled) {
                findLinkedES();
            }
            else {
                self.loadInkItems();
            }
        },

        loadInkItems: function () {
            var self = this;
            // Load all ink items here
            if (self.embeddedItem.element === "box") {
                self.embeddedItem.uiElement = document.createElement("div");
            }
            else {
                return;
            }

            self._rinInkContainer.appendChild(self.embeddedItem.uiElement);
            self.embeddedItem.uiElement.style.position = "absolute";
            self.embeddedItem.uiElement.style.background = "rgba(50,50,230,.5)";

            if (!self.link.enabled) {
                setInterval(function () { //TODO: Change this and listen to resize events
                    self.viewportChanged({ "x": 0, "y": 0, "width": self._rinInkContainer.clientWidth, "height": self._rinInkContainer.clientHeight });
                }, 500);
            }

            this.setState(rin.contracts.experienceStreamState.ready);
        },

        viewportChanged: function (viewport) {
            if (this.link.enabled) {
                this._rinInkContainer.style.left = viewport.x + "px";
                this._rinInkContainer.style.top = viewport.y + "px";
                this._rinInkContainer.style.width = viewport.width + "px";
                this._rinInkContainer.style.height = viewport.height + "px";
            }

            // update all ink items
            this.embeddedItem.uiElement.style.left = this.embeddedItem.region.x * viewport.width + "px";
            this.embeddedItem.uiElement.style.top = this.embeddedItem.region.y * viewport.height + "px";
            this.embeddedItem.uiElement.style.width = this.embeddedItem.region.width * viewport.width + "px";
            this.embeddedItem.uiElement.style.height = this.embeddedItem.region.height * viewport.height + "px";
        },
        //// Play the video.
        play: function () {
        },
        // Pause the video.
        pause: function () {
        },
        _interactionControls: null
    };

    InkES.elementHTML = "<div style='height:100%;width:100%;position:absolute;background:transparent'><div class='rinInkContainer' style='height:100%;width:100%;left:0px;top:0px;position:absolute;background:transparent'></div></div>";
    rin.util.overrideProperties(InkES.prototypeOverrides, InkES.prototype);
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.InkExperienceStream", function (orchestrator, esData) { return new InkES(orchestrator, esData); });
})(window.rin = window.rin || {});

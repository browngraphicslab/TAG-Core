/// 
/*!
* RIN Core JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

(function (rin) {
    "use strict";
    /*jshint newcap:false*/
    rin.embeddedArtifacts = rin.embeddedArtifacts || {};

    // Module to help with loading artifact visuals
    rin.embeddedArtifacts.embeddedArtifactsController = function (orchestrator) {
        var self = this;

        orchestrator.currentESItemsChanged.subscribe(function (changeData) {
            var i, esInfo;
            if (changeData.removedItems)
                for (i = 0; i < changeData.removedItems.length; i++) {
                    esInfo = changeData.removedItems[i];
                    if (!esInfo || !esInfo.experienceStream) continue;
                    if (!esInfo.esData || !esInfo.esData.data || !esInfo.esData.data.EmbeddedArtifacts) continue;
                    if (esInfo.experienceStream && esInfo.experienceStream.embeddedArtifacts && esInfo.experienceStream.embeddedArtifacts == null) continue;

                    self.removeEAComponents(esInfo);
                }

            if (changeData.addedItems)
                for (i = 0; i < changeData.addedItems.length; i++) {
                    esInfo = changeData.addedItems[i];
                    if (!esInfo || !esInfo.experienceStream || !esInfo.experienceStream.getEmbeddedArtifactsProxy) continue;
                    if (!esInfo.esData || !esInfo.esData.data || !esInfo.esData.data.EmbeddedArtifacts) continue;
                    if (esInfo.experienceStream && esInfo.experienceStream.embeddedArtifacts && esInfo.experienceStream.embeddedArtifacts != null) continue;

                    self.addEAComponents(esInfo);
                }
        }, "eaController");

        this.unload = function () {
            var currentItems = orchestrator.getCurrentESItems();
            if (currentItems)
                for (var i = 0; i < currentItems.length; i++) {
                    var esInfo = currentItems[i];
                    if (!esInfo || !esInfo.experienceStream) continue;
                    if (!esInfo.esData || !esInfo.esData.data.EmbeddedArtifacts) continue;
                    if (esInfo.experienceStream && esInfo.experienceStream.embeddedArtifacts && esInfo.experienceStream.embeddedArtifacts != null) continue;

                    self.removeEAComponents(esInfo);
                }
        };

        function createDataCollection(a, id) {
            var collection = {
                collectionId: id,
                forEach: function (func) {
                    a.forEach(function (val, index) {
                        func(val, val.id, collection);
                    });
                }
            };
            return collection;
        }

        var testEngineHelper = {
            newGroupPolicy: function (policyId, collection, provider) {
                return rin.embeddedArtifacts.newDefaultGroupPolicy(policyId, collection, provider, orchestrator);
            }
        };

        this.addEAComponents = function (esInfo) {
            if (!esInfo || !esInfo.experienceStream) return;
            var le = rin.embeddedArtifacts.newLayoutEngine(testEngineHelper, orchestrator);
            esInfo.experienceStream.embeddedArtifacts = { "layoutEngine": le, "host": null, "updateLoopTimerID": null };

            // Download EA data from the specified source.
            var downloadHelper = new rin.internal.AjaxDownloadHelper(
                orchestrator.getResourceResolver().resolveResource(esInfo.esData.data.EmbeddedArtifacts.datasource));
            downloadHelper.getContent(function (eaData) {
                var eaJsonData = JSON.parse(eaData);
                var testCollection = createDataCollection(eaJsonData, "eaDataCollection");

                function loadEAComponents() {
                    if (esInfo.experienceStream.getState() === "ready") { // TODO: may need to use a better approach to make sure the code inside runs only after the ES is loaded.
                        // TODO: passing layout engine to ES proxy might not be the best but to avoid creating another event, im using this method for now.
                        var providerProxy = esInfo.experienceStream.getEmbeddedArtifactsProxy(le); // ES needs to call le.render({}) anytime the ES updates itself.
                        var eaContainer = providerProxy.getEmbeddedArtifactsContainer();

                        var host = new rin.embeddedArtifacts.ArtifactHost(eaContainer,
                            new rin.internal.OrchestratorProxy(orchestrator));
                        esInfo.experienceStream.embeddedArtifacts.host = host;

                        // Hide EAs while the narrative is playing if configured to do so.
                        if (esInfo.esData.data.EmbeddedArtifacts.hideDuringPlay && esInfo.esData.data.EmbeddedArtifacts.hideDuringPlay === true) {
                            // Check current status and update the host.
                            if (orchestrator.getPlayerState() === rin.contracts.playerState.playing)
                                host.hide();

                            // Monitor status changes and update the host.
                            orchestrator.playerStateChangedEvent.subscribe(function (state) {
                                if (state.currentState === rin.contracts.playerState.pausedForExplore)
                                    host.show();
                                else if (state.currentState === rin.contracts.playerState.playing)
                                    host.hide();
                            }, esInfo.id);

                            // Hide EAs on transition events
                            orchestrator.playerESEvent.subscribe(function (state) {
                                if (state && state.eventId === rin.contracts.esEventIds.resumeTransitionEvent &&
                                    state.sender._esData.experienceId === esInfo.experienceId) {
                                    if (state.eventData.transitionState === "started")
                                        host.hide();
                                    else if (state.eventData.transitionState === "interrupted")
                                        host.show();
                                }
                            }, esInfo.id);
                        }

                        le.addPipeline(testCollection, esInfo.esData.data.EmbeddedArtifacts.policies, providerProxy, host);

                        // Below loop is to ensure that any layout changes in EA visuals are applied even if the ES dosent call render().
                        var updateLoop = function() {

                            rin.internal.debug.assert(orchestrator.getIsOnStage(esInfo.experienceStream));
                            le.render({});
                        };

                        esInfo.experienceStream.embeddedArtifacts.updateLoopTimerID = setInterval(updateLoop, 500);
                    }
                    else if (esInfo.experienceStream.getState() !== "error") {
                        setTimeout(loadEAComponents, 500);
                    }
                }
                loadEAComponents();
            });
        };

        this.removeEAComponents = function (esInfo) {
            if (esInfo && esInfo.experienceStream && esInfo.experienceStream.embeddedArtifacts && esInfo.experienceStream.embeddedArtifacts.host) {
                clearInterval(esInfo.experienceStream.embeddedArtifacts.updateLoopTimerID);
                orchestrator.playerStateChangedEvent.unsubscribe(esInfo.id);
                orchestrator.playerESEvent.unsubscribe(esInfo.id);
                esInfo.experienceStream.embeddedArtifacts.host.removeAll(true);
                esInfo.experienceStream.embeddedArtifacts = null;
            }
        };
    };
})(window.rin = window.rin || {});
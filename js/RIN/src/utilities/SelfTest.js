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
/// <reference path="../contracts/IOrchestrator.js"/>
/// <reference path="../core/Common.js">
/// <reference path="../core/Orchestrator.js">

(function (rin) {
    "use strict";
    rin.internal = rin.internal || {};
    rin.internal.SelfTester = function (orchestrator) {
        var self = this,
            timer = new rin.internal.Timer(),
            getNextInterval = function () {
                return rin.util.randInt(self.minimumTimeInterval, self.maximumTimeInterval);
            },
            narrativeDuration = 0,
            allScreenplays,
            numberOfScreenplays,
            lastDeepState = null,
            selfTestOptions = null,
            startTime = Date.now(),
            callback = function (isInDeepState) {
                if (!isInDeepState) orchestrator.playerControl.play();
            },
            initialize = function (options) {
                startTime = Date.now();
                self.minimumTimeInterval = self.minimumTimeInterval || 1;
                self.maximumTimeInterval = self.maximumTimeInterval || (orchestrator && orchestrator.getNarrativeInfo() && orchestrator.getNarrativeInfo().totalDuration) || 3;
                narrativeDuration = orchestrator.getNarrativeInfo().totalDuration;
                allScreenplays = orchestrator.getSegmentInfo().screenplays;
                numberOfScreenplays = Object.keys(allScreenplays).length;
                selfTestOptions = options || {
                    deepstateReloadOption: function () {
                        return false;
                    }
                };
            },
            logEvent = function (message) {
                self.logMessageEvent.publish("Time:" + ((Date.now() - startTime) / 1000  | 0)+ " " + message);
            },
            doOperation = function () {
                var opCode = Math.floor(rin.util.randInt(0, 8)),
                    currrentTimeOffset = orchestrator.getCurrentLogicalTimeOffset(),
                    esWithInteractionControls,
                    nextOffset,
                    nextScreenplay;
                switch (opCode) {
                    case 0:
                    case 1:
                    case 2:
                        if (orchestrator.getPlayerState() === rin.contracts.playerState.playing) {
                            logEvent(">>> Self Tester issues a pause at " + currrentTimeOffset);
                            orchestrator.playerControl.pause();
                        } else if (orchestrator.getPlayerState() === rin.contracts.playerState.pausedForExplore) {
                            logEvent(">>> Self Tester issues a play at " + currrentTimeOffset);
                            orchestrator.playerControl.play();
                        }
                        break;
                    case 3:
                        nextOffset = rin.util.rand(0, narrativeDuration);
                        logEvent(">>> Self Tester issues a pause to " + nextOffset);
                        orchestrator.playerControl.pause(nextOffset);
                        break;
                    case 4:
                        nextOffset = rin.util.rand(0, narrativeDuration);
                        logEvent(">>> Self Tester issues a play to " + nextOffset);
                        orchestrator.playerControl.play(nextOffset);
                        break;
                    case 5:
                        esWithInteractionControls = orchestrator.getCurrentESItems().firstOrDefault(function (item) {
                            return typeof item.experienceStream.getInteractionControls === 'function';
                        });
                        if (esWithInteractionControls) {
                            logEvent(">>> Self Tester starts interaction with " + esWithInteractionControls.experienceId);
                            orchestrator.startInteractionMode(esWithInteractionControls.experienceStream);
                            setTimeout(function () {
                                self.interactionEvent.publish();
                            }, 100);
                        }
                        break;
                    case 6:
                        if (!lastDeepState) {
                            logEvent(">>> Self Tester retrieves deep state Url");
                            lastDeepState = orchestrator.playerControl.getDeepStateUrl();
                        } else {
                            logEvent(">>> Self Tester navigates to deepStateUrl with reload = " + selfTestOptions.deepstateReloadOption());
                            var deepstateUrl = orchestrator.playerControl.resolveDeepstateUrlFromAbsoluteUrl(lastDeepState);
                            if (selfTestOptions.deepstateReloadOption()) {
                                orchestrator.playerControl.unload();
                                orchestrator.playerControl.load(deepstateUrl, callback);
                            }
                            else {
                                orchestrator.seekUrl(deepstateUrl, callback);
                            }
                            lastDeepState = null;
                        }
                        break;
                    case 7:
                        var nextScpId = rin.util.randInt(0, numberOfScreenplays) | 0; // (| 0) Strips the floating point part
                        nextScreenplay = Object.keys(allScreenplays)[nextScpId];
                        nextOffset = rin.util.rand(0, narrativeDuration);
                        logEvent(">>> Self Tester plays screenplay: " + nextScreenplay + " at offset:" + nextOffset);
                        narrativeDuration = orchestrator.esItemsManager.getScreenPlayInterpreter(nextScreenplay).getEndTime();
                        orchestrator.playerControl.play(nextOffset, nextScreenplay);
                        break;
                }
            };

        timer.tick = function () {
            doOperation();
            timer.intervalSeconds = getNextInterval();
        };

        this.logMessageEvent = new rin.contracts.Event();
        this.interactionEvent = new rin.contracts.Event();

        this.minimumTimeInterval = 0;
        this.maximumTimeInterval = 0;

        this.startSelfTest = function (options) {
            initialize(options);
            timer.intervalSeconds = getNextInterval();
            timer.start();
        };
        this.stopSelfTest = function () {
            timer.stop();
        };    
    };
}(window.rin = window.rin || {}));
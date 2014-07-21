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

    // Code audio es to provide background as well as foreground audio.
    var AudioES = function (orchestrator, esData) {
        AudioES.parentConstructor.apply(this, arguments);
        this._orchestrator = orchestrator;

        this._userInterfaceControl = rin.util.createElementWithHtml(AudioES.elementHTML);
        this._audio = this._userInterfaceControl.firstChild;
        this._esData = esData;

        this._isBackgroundAudioMode = this._esData.data.markers && this._esData.data.markers.isBackgroundAudioMode;
        if (this._isBackgroundAudioMode) {
            this._audio.loop = true;
        }

        var esBaseVolume = (this._esData.data.markers && this._esData.data.markers.baseVolume) || 1;
        if (typeof esBaseVolume === "number") {
            this._esBaseVolume = esBaseVolume < 0 ? 0 : esBaseVolume > 1 ? 1 : esBaseVolume;
        }

        var pauseVolumeDefault = this._isBackgroundAudioMode ? this._esBaseVolume : 0;
        var pauseVolume = (this._esData.data.markers && this._esData.data.markers.pauseVolume) || pauseVolumeDefault;
        if (typeof pauseVolume === "number") {
            this._pauseVolume = pauseVolume < 0 ? 0 : pauseVolume > 1 ? 1 : pauseVolume;
        }

        this._url = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);
    };

    rin.util.extend(rin.contracts.DiscreteKeyframeESBase, AudioES);

    AudioES.prototypeOverrides = {
        // Load and initialize the ES.
        load: function (experienceStreamId) {
            // Call load on parent to init the keyframes.
            AudioES.parentPrototype.load.call(this, experienceStreamId);

            if (!this._url) throw new Error("Audio source not found!");

            var isIOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
            if (isIOS) {
                this._orchestrator.eventLogger.logErrorEvent("Audio is not supported in safari since it cannot be programmatically started. Disabling audio ES: " + experienceStreamId);
                this._userInterfaceControl.innerHTML = "";
                this.setState(rin.contracts.experienceStreamState.error);
                return;
            }

            var self = this;
            // Set to buffering till the audio is loaded.
            this.setState(rin.contracts.experienceStreamState.buffering);
            rin.internal.debug.write("Load called for " + this._url);

            // Handle any error while loading audio.
            this._audio.onerror = function (error) {
                var errorString = "Audio failed to load. Error: " + (self._audio.error ? self._audio.error.code : error) + "<br/>Url: " + self._url;
                var esInfo = self._orchestrator.debugOnlyGetESItemInfo();
                if (esInfo) {
                    errorString += "<br/>ES Info: {0}:{1} <br/>Lifetime {2}-{3}".rinFormat(esInfo.providerName, esInfo.id,
                    esInfo.beginOffset, esInfo.endOffset);
                }
                self._orchestrator.eventLogger.logErrorEvent(errorString);
                self.setState(rin.contracts.experienceStreamState.error);
            };

            // Handle load complete of audio.
            this._audio.oncanplay = function () {
                rin.internal.debug.write("oncanplay called from " + self._url);
                if (self._desiredAudioPositon >= 0 && Math.abs(self._audio.currentTime - self._desiredAudioPositon) > 0.01 /*epsilon*/) {
                    self._seekAudio(self._desiredAudioPositon);
                    self._desiredAudioPositon = -1;
                }
            };

            // Handle ready state change to get notified on buffering start and stop.
            this._audio.onreadystatechange = function () {
                self.readyStateCheck();
            };

            // Constantly check if the audio is ready and update the state as necessary.
            this.readyStateCheck = function () {
                var state = self.getState();
                if ((self._isMediaLoaded && state === rin.contracts.experienceStreamState.ready) || state === rin.contracts.experienceStreamState.error) return;

                if (self._audio.readyState === self.const_ready_state) {
                    if (!self._isMediaLoaded) {
                        self._isMediaLoaded = true;
                        self.setState(rin.contracts.experienceStreamState.ready);
                        self._startBackgroundAudioOnReady();
                    }
                }
                else {
                    if (!self._isBackgroundAudioMode) self.setState(rin.contracts.experienceStreamState.buffering);
                    setTimeout(self.readyStateCheck, 250);
                }
            };

            // Set audio sources with all supported formats
            var baseUrl = (this._url.substr(0, this._url.lastIndexOf('.')) || this._url) + ".";
            for (var i = 0; i < this._supportedFormats.length; i++) {
                var srcElement = document.createElement("source");
                srcElement.setAttribute("type", this._supportedFormats[i].type);
                srcElement.setAttribute("src", baseUrl + this._supportedFormats[i].ext);
                this._audio.appendChild(srcElement);
            }

            if (this._isBackgroundAudioMode) {
                self.setState(rin.contracts.experienceStreamState.ready);
            }

            this.readyStateCheck();
        },
        // Unload the ES.
        unload: function () {
            try {
                this._audio.pause();
                var srcElements = this._audio.getElementsByTagName("source");
                for (var i = srcElements.length - 1; i >= 0; i--) {
                    var srcElement = srcElements[i];
                    srcElement.parentNode.removeChild(srcElement);
                }
                this._audio.removeAttribute("src");
                this._audio.load(); //As per Best practices  - http://dev.w3.org/html5/spec-author-view/video.html#best-practices-for-authors-using-media-elements
            } catch (e) { rin.internal.debug.assert(!e); } // Ignore errors on unload.
        },
        // Play from the given offset.
        play: function (offset, experienceStreamId) {
            try {
                var preserveContinuity = this._isBackgroundAudioMode; //ToDO: enable this after everest. && this._currentExperienceStreamId !== experienceStreamId;
                if (preserveContinuity) {
                    this._startMarker = this._audio.currentTime;
                }
                else {
                    var effectiveOffset = this._isBackgroundAudioMode ? ((this._startMarker + offset) % this._audio.duration) : offset;
                    this._seekAudio(effectiveOffset);
                }

                this._updateMute();
                var effectiveVolume = this._computeEffectiveVolume(this._esBaseVolume);
                this._playPauseActionCount++;
                this._animateVolume(this.const_animation_time, effectiveVolume);
                this._audio.play();
            } catch (e) {
                rin.internal.debug.assert(false, "exception at audio element " + e.Message);
            }

            // Call play on parent to maintain keyframe integrity.
            AudioES.parentPrototype.play.call(this, offset, experienceStreamId);
        },
        // Pause at the given offset.
        pause: function (offset, experienceStreamId) {
            try {
                var preserveContinuity = this._isBackgroundAudioMode; //ToDO: enable this after everest. && this._currentExperienceStreamId !== experienceStreamId;
                if (!preserveContinuity) {
                    var effectiveOffset = this._isBackgroundAudioMode ? ((this._startMarker + offset) % this._audio.duration) : offset;
                    this._seekAudio(effectiveOffset);
                }

                var effectiveVolume = this._orchestrator.getIsOnStage() ? this._computeEffectiveVolume(this._pauseVolume) : 0;
                this._playPauseActionCount++;
                var localPlayPauseActionCount = this._playPauseActionCount; // This takes care of multiple calls to _animateVolume. Callback will be called only for last play or pause action.
                this._animateVolume(this.const_animation_time, effectiveVolume, function () {
                    if (localPlayPauseActionCount === this._playPauseActionCount && !this._isBackgroundAudioMode) this._audio.pause();
                }.bind(this));
            } catch (e) {
                rin.internal.debug.assert(false, "exception at audio element " + e.Message);
            }

            // Call pause on parent to maintain keyframe integrity.
            AudioES.parentPrototype.pause.call(this, offset, experienceStreamId);
        },
        // Set the base volume for the ES. This will get multiplied with the keyframed volume to get to the final applied volume.
        setVolume: function (baseVolume) {
            this._orchestratorVolume = baseVolume;
            var effectiveVolume = this._computeEffectiveVolume();
            this._animateVolume(this.const_animation_time, effectiveVolume);
        },

        // Mute or Unmute the audio.
        setIsMuted: function () {
            this._updateMute();
        },

        onESEvent: function (sender, eventId, eventData) {
            if (eventId === rin.contracts.esEventIds.playerConfigurationChanged) {
                this._updateMute();
            }
            else if (eventId === rin.contracts.esEventIds.popupDisplayEvent) {
                if (eventData && eventData.displayed && eventData.hasAudio) {
                    this._animateVolume(this.const_animation_time, 0);
                }
                else if (eventData && eventData.displayed === false && eventData.hasAudio) {
                    var effectiveVolume = this._computeEffectiveVolume();
                    this._animateVolume(this.const_animation_time, effectiveVolume);
                }
            }
        },

        _startBackgroundAudioOnReady: function () {
            if (!this._isBackgroundAudioMode) return;

            //TODO: After everest, pass right offset and screenplayId to play/pause methods.
            if (this._orchestrator.getPlayerState() === rin.contracts.playerState.playing) {
                this.play();
            }
            else {
                this.pause();
            }
        },

        // Seek to a position in the audio.
        _seekAudio: function (offset) {
            var epsilon = 0.4; // Ignore minute seeks.
            if (Math.abs(this._audio.currentTime - offset) < epsilon) return;

            // See if the video element is ready.
            if (this._audio.readyState === this.const_ready_state) {
                // In IE, video cannot seek before its initialTime. This property doesn't exist in Chrome.
                if (this._audio.initialTime) {
                    offset = Math.max(offset, this._audio.initialTime);
                }

                rin.internal.debug.assert(this._audio.seekable);
                // See if we can seek to the specified offset.
                if (this._audio.seekable) {
                    for (var i = 0; i < this._audio.seekable.length; i++) {
                        if (this._audio.seekable.start(i) <= offset && offset <= this._audio.seekable.end(i)) {
                            this._audio.currentTime = offset;
                            break;
                        }
                    }
                }
                this._desiredAudioPositon = offset;
            }
            else {
                this._desiredAudioPositon = offset;
            }
        },
        // Apply/Interpolate to a keyframe.
        displayKeyframe: function (keyframeData, nextKeyframeData, interpolationOffset) {
            var currentKeyframeVolume, nextKeyframeVolume = null;

            // Load current keyframe.
            if (keyframeData) {
                currentKeyframeVolume = this._getKeyframeVolume(keyframeData);

                // start volume interpolation to next key volume if one is present.
                if (nextKeyframeData !== null) {
                    nextKeyframeVolume = this._getKeyframeVolume(nextKeyframeData);
                    var keyframeDuration = nextKeyframeData.offset - keyframeData.offset;
                    var animation = new rin.internal.DoubleAnimation(keyframeDuration, currentKeyframeVolume, nextKeyframeVolume);
                    currentKeyframeVolume = animation.getValueAt(interpolationOffset);
                    this._audio.volume = currentKeyframeVolume;
                    this._animateVolume(keyframeDuration - interpolationOffset, nextKeyframeVolume);
                }
                else {
                    this._audio.volume = currentKeyframeVolume;
                }
            }
        },

        _getKeyframeVolume: function (keyframe) {
            if (keyframe && keyframe.state && keyframe.state.sound) {
                return keyframe.state.sound.volume;
            }
            else if (keyframe && keyframe.data && keyframe.data["default"]) {
                var data = rin.internal.XElement(keyframe.data["default"]);
                if (data) return parseFloat(data.attributeValue("Volume"));
            }
            return 1;
        },

        _getCurrentKeyframeVolume: function () {
            // TODO: narend: Post everest, convert base to use continuous interpolation and return current interpolated value.
            return 1;
        },

        _computeEffectiveVolume: function (multiplicationFactor) {
            return this._orchestratorVolume * this._getCurrentKeyframeVolume() * ((typeof multiplicationFactor === "number") ? multiplicationFactor : 1);
        },

        // Interpolate volume for smooth fade in and out.
        _animateVolume: function (animationTime, targetVolume, onComplete) {
            if (this._activeVolumeAnimation !== null) {
                this._activeVolumeAnimation.stop();
                this._activeVolumeAnimation = null;
            }

            if (Math.abs(this._audio.volume - targetVolume) <= 0.02 /*epsilon*/) {
                if (onComplete) onComplete();
                return;
            }

            var self = this;
            var volumeAnimation = new rin.internal.DoubleAnimation(animationTime, this._audio.volume, targetVolume);
            var volumeAnimationStoryboard = new rin.internal.Storyboard(
                volumeAnimation,
                function (value) {
                    self._audio.volume = Math.min(1, Math.max(0, value));
                },
                function () {
                    self._activeVolumeAnimation = null;
                    if (onComplete) onComplete();
                });

            volumeAnimationStoryboard.begin();
            this._activeVolumeAnimation = volumeAnimationStoryboard;
        },
        _updateMute: function () {
            var playerConfiguration = this._orchestrator.getPlayerConfiguration();
            var isMuted = playerConfiguration.isMuted || (playerConfiguration.activePopup && playerConfiguration.activePopup.hasAudio)
                || (this._isBackgroundAudioMode && playerConfiguration.isMusicMuted) || (!this._isBackgroundAudioMode && playerConfiguration.isNarrativeMuted);
            this._audio.muted = !!isMuted;
        },
        const_ready_state: 4,
        const_animation_time: 1.0,
        _desiredAudioPositon: -1, // Store audio seek location in case of audio is not yet ready.
        _url: null,
        _activeVolumeAnimation: null, // storyboard of an active volume interpolation.
        _orchestratorVolume: 1, // volume from orchestrator.
        _pauseVolume: 0, // volume during pause
        _esBaseVolume: 1, // base volume set at the ES level
        _startMarker: 0, // trim start of the audio clip.
        _playPauseActionCount: 0,
        _interactionControls: null,
        _isBackgroundAudioMode: false,
        _isMediaLoaded: false,
        // List of formats supported by the ES. Browser will pick the first one which it supports.
        // All the below sources are added to the Audio tag irrespective of the source file format.
        _supportedFormats: [
            { ext: "ogg", type: "audio/ogg; codecs=\"theora, vorbis\"" },
            { ext: "mp3", type: "audio/mp3" },
            { ext: "mp4", type: "audio/mp4" },
            { ext: "aac", type: "audio/aac" },
            { ext: "wav", type: "audio/wav" }
        ]
    };

    AudioES.elementHTML = "<audio style='height:0;width:0' preload='auto'>Sorry, Your browser does not support HTML5 audio.</audio>";
    rin.util.overrideProperties(AudioES.prototypeOverrides, AudioES.prototype);
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.AudioExperienceStream", function (orchestrator, esData) { return new AudioES(orchestrator, esData); });
})(window.rin = window.rin || {});
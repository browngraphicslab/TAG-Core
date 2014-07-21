/// <reference path="../../../web/lib/rin-core-1.0.js" />

/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

(function (rin) {
    /*jshint validthis:true, shadow:true, newcap:false*/
    /*global $:true, ko:true*/
    "use strict";

    //Image Experience Provider
    var ImageES = (function (_super) {
        //Setting up the inheritance
        var __extends = function (d, b) {
            function __() { this.constructor = d; }
            __.prototype = b.prototype;
            d.prototype = new __();
        };

        //Extending the ImageES from _super class
        __extends(ImageES, _super);
        function ImageES(orchestrator, esData) {
            /// <summary>Image Experience Provider</summary>
            /// <param name="orchestrator" type="rin.OrchestratorProxy">Orchestrator Proxy element which can be used to called the core methods and listen to core events</param>
            /// <param name="esData" type="object">Experience Data for the provider to initialize and process</param>
            //Initialize the base class
            _super.call(this, orchestrator, esData);
            this._orchestrator = orchestrator;
            this._esData = esData;
            this.isDragging = false;
            this.lastTouchPoint = { "x": 0, "y": 0 };
            this._isImageLoaded = false;
            this._isContainerLoaded = false;
            this.viewportChangedEvent = new rin.contracts.Event();

            this._esData.data = this._esData.data || {};
            this._esData.data.defaultKeyframe = this._esData.data.defaultKeyframe || {
                "state": {
                    "viewport": {
                        "region": {
                            "center": {
                                "x": 0,
                                "y": 0
                            },
                            "span": {
                                "x": 0,
                                "y": 0
                            }
                        }
                    }
                }
            };

            //Load the text as a element html
            this._userInterfaceControl = convertToHtmlDom(ELEMENTHTML).firstChild;
            this._image = this._userInterfaceControl.firstChild;
            if (esData.resourceReferences && esData.resourceReferences[0] && esData.resourceReferences[0].resourceId) {
                //Get the first resource and take it as the resource to be loaded.
                this._url = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);
            }
        }
        //Public Functions and overrides for the DiscreteKeyframeESBase functions
        ImageES.prototype.load = function (experienceStreamId) {
            var self = this;

            ///<summary>Loads a specific experience stream Id and its key frames</summary>
            ///<param name="experienceStreamId" type="String">Id of the experience stream to be loaded</param>
            this.addSliverInterpolator("viewport", function (sliverId, state) {
                return new rin.Ext.Interpolators.linearViewportInterpolator(state);
            });

            _super.prototype.load.call(this, experienceStreamId);

            //Set the state to buffering
            this.setState(rin.contracts.experienceStreamState.buffering);

            //Add a load event listener
            this._image.addEventListener("load", function () {
                /// <summary>Set the state to ready once the image load is complete</summary>
                this._isImageLoaded = true;
            }.bind(this));

            //Add abort and error event listeners
            this._image.addEventListener("abort", function () {
                /// <summary>Set the state to error if image errors out</summary>

                //Set the state to error
                this.setState(rin.contracts.experienceStreamState.error);
            }.bind(this));
            this._image.addEventListener("error", function () {
                /// <summary>Set the state to error if image errors out</summary>

                //Set the state to error
                this.setState(rin.contracts.experienceStreamState.error);
            }.bind(this));

            this._initInteractionHandlers();

            // Keep checking if all required components of the ES are ready
            function checkReadyState() {
                if (self.setState() === rin.contracts.experienceStreamState.error) // Stop the loop in case of an error.
                    return;

                if (self._isImageLoaded && self._userInterfaceControl.clientWidth > 0)
                {
                    setTimeout(function () {
                        self._resetImagePosition();

                        self.setState(rin.contracts.experienceStreamState.ready);
                    }, 300);
                    return;
                }
                setTimeout(checkReadyState, 300);
            }
            checkReadyState();

            //Set the image source
            this._image.src = this._url;
        };

        ImageES.prototype._resetImagePosition = function () {
            var self = this;
            // position the image in the center of the screen by default
            var widthScale = Math.min(1, self._userInterfaceControl.clientWidth / self._image.naturalWidth);
            var heightScale = Math.min(1, self._userInterfaceControl.clientHeight / self._image.naturalHeight);
            var scale = Math.min(widthScale, heightScale);

            var translateX = (self._userInterfaceControl.clientWidth - (self._image.naturalWidth * scale)) / 2;
            var translateY = (self._userInterfaceControl.clientHeight - (self._image.naturalHeight * scale)) / 2;

            self._image.style.height = (self._image.naturalHeight * scale) + "px";
            self._image.style.width = (self._image.naturalWidth * scale) + "px";
            self._image.style.top = translateY + "px";
            self._image.style.left = translateX + "px";

            self._viewportUpdated();
        };

        ImageES.prototype._initInteractionHandlers = function () {
            var self = this, msGesture = null;

            // If running on IE 10/RT, enable multitouch support.
            if (window.navigator.msPointerEnabled && typeof (MSGesture) !== "undefined") {
                this._image.addEventListener("MSPointerDown", function (e) {
                    self._orchestrator.startInteractionMode();

                    if (!msGesture) {
                        msGesture = new window.MSGesture();
                        msGesture.target = self._image;
                    }

                    msGesture.addPointer(e.pointerId);

                    e.stopPropagation();
                    e.preventDefault();
                }, false);

                this._image.addEventListener("MSGestureChange", function (e) {
                    if (e.translationX !== 0 || e.translationY !== 0) {
                        self._translateImage(e.translationX, e.translationY);
                    }

                    if (e.scale !== 1) {
                        self._scaleImage(e.scale, e.offsetX, e.offsetY);
                    }
                    e.stopPropagation();
                    e.preventDefault();
                });

                this._image.addEventListener("MSGestureEnd", function (e) {
                    if(msGesture) msGesture.stop();
                }, false);

                this._image.addEventListener("MSGestureStart", function (e) {
                    e.stopPropagation();
                }, false);
            } else {

                //Add the event listener for detecting interactions
                this._image.addEventListener("mousedown", function (event) {
                    /// <summary>Bind the mouse down to raise an interaction event</summary>

                    this.lastTouchPoint = { "x": event.x, "y": event.y };
                    this.isDragging = true;
                    this._image.setCapture();

                    //Intimate Orchestrator that the user has interacted
                    this._orchestrator.startInteractionMode();
                    return false;
                }.bind(this));

                this._image.addEventListener("mouseup", function (event) {
                    this._image.releaseCapture();
                    this.isDragging = false;
                    return false;
                }.bind(this));

                this._image.addEventListener("mousemove", function (event) {
                    if (this.isDragging === true) {
                        var diffx = event.x - this.lastTouchPoint.x;
                        var diffy = event.y - this.lastTouchPoint.y;
                        this.lastTouchPoint.x = event.x;
                        this.lastTouchPoint.y = event.y;

                        this._translateImage(diffx, diffy);
                    }
                    return false;
                }.bind(this));
            }

            this._image.addEventListener("mousewheel", function (event) {
                //Intimate Orchestrator that the user has interacted
                this._orchestrator.startInteractionMode();

                var scale = (event.wheelDelta > 0 ? ZOOMINSTEP : ZOOMOUTSTEP) * Math.abs(event.wheelDelta / 120);

                this._scaleImage(scale, event.offsetX, event.offsetY);

                return false;
            }.bind(this));
        };

        ImageES.prototype.raiseViewportUpdate = function () {
            this.viewportChangedEvent.publish({
                "x": this._currentViewport.region.center.x, "y": this._currentViewport.region.center.y,
                "width": this._currentViewport.region.span.x, "height": this._currentViewport.region.span.y
            });
        };

        ImageES.prototype.displayKeyframe = function (keyframeData) {
            /// <summary>Pauses a specific experience stream Id at the specified offset</summary>
            /// <param name="keyframeData" type="object">The keyframe data in the form of sliver containing viewport details</param>

            if (this.getState() !== rin.contracts.experienceStreamState.ready) {
                // Not ready yet, do not attempt to show anything.
                return;
            }

            if (keyframeData && keyframeData.state && keyframeData.state.viewport) {
                this._fitImage(keyframeData.state.viewport);
            }
        };

        ImageES.prototype.addedToStage = function() {
            // TODO: better way to hide the player controls if inside an popup?
            $(this._image).parents('.rin_popup_es_container')
                .find('.rin_Footer').addClass('rin_hide_footer');
        };

        ImageES.prototype.unload = function () {
            ///<summary>unloads a specific experience stream Id and its key frames</summary>
            //Clean-up the code here
        };
        //Interaction Controls
        ImageES.prototype.getInteractionControls = function () {
            /// <summary>Gets the interaction Controls. This is done asynchronously</summary>

            if (!this._interactionControls) {
                this._interactionControls = document.createElement("div");
                //Request Pan Zoom Controls from the orchestrator
                this._orchestrator.getInteractionControls([
                    rin.contracts.interactionControlNames.panZoomControl
                ],
                function (wrappedInteractionControls) {
                    //Load the controls into as interaction controls 
                    rin.util.assignAsInnerHTMLUnsafe(this._interactionControls, wrappedInteractionControls.innerHTML);
                    //Use knockout framework to bind the commands
                    ko.applyBindings(this, this._interactionControls);
                }.bind(this));
            }
            //Return the container element. After the orchestrator fetches the controls, it would be loaded inside this div
            return this._interactionControls;
        };

        //Pan Zoom Control Commands
        ImageES.prototype.goHomeCommand = function () {
            /// <summary>Resets the Image to fit the screen</summary>
            this._resetImagePosition();
        };
        ImageES.prototype.zoomOutCommand = function () {
            /// <summary>Zooms out the image by a standard scale</summary>
            this._scaleImage(ZOOMOUTSTEP);
        };
        ImageES.prototype.zoomInCommand = function () {
            /// <summary>Zooms in the image by a standard scale</summary>
            this._scaleImage(ZOOMINSTEP);
        };
        ImageES.prototype.panLeftCommand = function () {
            /// <summary>Moves the image left by a standard scale</summary>
            this._translateImage(-1 * PANSTEP, 0);
        };
        ImageES.prototype.panRightCommand = function () {
            /// <summary>Moves the image right by a standard scale</summary>
            this._translateImage(PANSTEP, 0);
        };
        ImageES.prototype.panUpCommand = function () {
            /// <summary>Moves the image up by a standard scale</summary>
            this._translateImage(0, -1 * PANSTEP);
        };
        ImageES.prototype.panDownCommand = function () {
            /// <summary>Moves the image down by a standard scale</summary>
            this._translateImage(0, PANSTEP);
        };

        //To get the state of the Experience at any given point of time - Used generally on the authoring side
        ImageES.prototype.captureKeyframe = function () {
            /// <summary>Get the current state.</summary>
            if (!this._currentViewport) {
                return "";
            }
            return {
                "state": {
                    "viewport": {
                        "region": {
                            "span": {
                                "x": this._currentViewport.region.span.x,
                                "y": this._currentViewport.region.span.y
                            },
                            "center": {
                                "x": this._currentViewport.region.center.x,
                                "y": this._currentViewport.region.center.y
                            }
                        }
                    }
                },
                "data": {
                    "contentType": "ZoomableImage"
                }
            };
        };

        //Defining Private variables
        ImageES.prototype._orchestrator = null, //rin.internal.OrchestratorProxy,
        ImageES.prototype._esData = null, //Object,
        ImageES.prototype._interactionControls = null, //HTMLElement,
        ImageES.prototype._url = null, //String,
        ImageES.prototype._currentViewport = null, //ViewPort,
        ImageES.prototype._image = null, //HTMLImageElement,

        //"Private Helper Functions
        ImageES.prototype._viewportUpdated = function () {
            /// <summary>Stores the image dimensions</summary>
            var top = parseFloat(this._image.style.top);
            var left = parseFloat(this._image.style.left);
            var width = parseFloat(this._image.style.width);
            var height = parseFloat(this._image.style.height);
            this._currentViewport = new ViewPort({
                center: new TwoDCoordinates(left, top),
                span: new TwoDCoordinates(width, height)
            });

            this.raiseViewportUpdate();
            var playerState = this._orchestrator.getPlayerState();
            if (playerState === rin.contracts.playerState.pausedForExplore || playerState === rin.contracts.playerState.stopped) {
                this._orchestrator.onESEvent(rin.contracts.esEventIds.stateTransitionEventId, { isUserInitiated: true, transitionState: "completed" });
            }
        };
        ImageES.prototype._translateImage = function (xAxis, yAxis) {
            /// <summary>Moves the image by applying the transform property by x and y pixels.</summary>
            /// <param name="xAxis" type="float">Horizontal translation in pixels</param>
            /// <param name="yAxis" type="float">Vertical translation in pixels</param>
            this._currentViewport.region.center.x += xAxis;
            this._currentViewport.region.center.y += yAxis;
            this._fitImage(this._currentViewport);
        };
        ImageES.prototype._scaleImage = function (scale, x, y) {
            /// <summary>Scales the image by using the transform property</summary>
            /// <param name="scale" type="float">Scaling factor</param>

            if (x || y) {
                var changeInWidth = (this._image.clientWidth * scale) - this._image.clientWidth;
                var changeInHeight = (this._image.clientHeight * scale) - this._image.clientHeight;

                var leftPercentage = x / this._image.clientWidth;
                var topPercentage = y / this._image.clientHeight;
                this._translateImage(-leftPercentage * changeInWidth, -topPercentage * changeInHeight);
            }

            this._currentViewport.region.span.x *= scale;
            this._currentViewport.region.span.y *= scale;
            this._fitImage(this._currentViewport);
        };
        ImageES.prototype._fitImage = function (viewport) {
            /// <summary>Fits the image to the specified viewport</summary>
            /// <param name="viewport" type="Viewport">Viewport Sliver to set the image</param>
            var left = viewport.region.center.x;
            var top = viewport.region.center.y;
            var width = viewport.region.span.x;
            var height = viewport.region.span.y;
            
            this._image.style.top = top+ "px";
            this._image.style.left = left + "px";
            this._image.style.width = width + "px";
            this._image.style.height = height + "px";
            this._viewportUpdated();
        };
        return ImageES;
    })(rin.contracts.InterpolatedKeyframeESBase);

    //Registerning the ES in the es factory so that orchestrator can invoke it
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.ImageExperienceStream", function (orchestrator, esData) { return new ImageES(orchestrator, esData); });

    //Utility functions
    var convertToHtmlDom = function (htmlString) {
        return rin.util.createElementWithHtml(htmlString);
    };

    //Defining Constants
    var ZOOMINSTEP = 1.2,
        ZOOMOUTSTEP = 0.8,
        PANSTEP = 20,
        ELEMENTHTML = "<div style='position:absolute;left:0px;top:0px;height:100%; width:100%;'><img class='rin_selectDisable' style='position:absolute;left:0px;top:0px;height:100%; width:100%;'></img></div>";

    //"Private" Helper Classes
    var TwoDCoordinates = (function () {
        function TwoDCoordinates(x, y) {
            this.x = x;
            this.y = y;
        }
        TwoDCoordinates.prototype.toString = function () {
            return '{x:' + this.x + ',y:' + this.y + '}';
        };
        return TwoDCoordinates;
    })();

    var ViewPort = (function () {
        function ViewPort(region) {
            this.region = region;
        }
        return ViewPort;
    })();

}(window.rin = window.rin || {}));
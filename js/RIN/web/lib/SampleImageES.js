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

            //Load the text as a element html
            this._userInterfaceControl = convertToHtmlDom(ELEMENTHTML).firstChild;
            if (esData.resourceReferences && esData.resourceReferences[0] && esData.resourceReferences[0].resourceId) {
                //Get the first resource and take it as the resource to be loaded.
                this._url = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);
            }
        }
        //Public Functions and overrides for the DiscreteKeyframeESBase functions
        ImageES.prototype.load = function (experienceStreamId) {
            ///<summary>Loads a specific experience stream Id and its key frames</summary>
            ///<param name="experienceStreamId" type="String">Id of the experience stream to be loaded</param>

            _super.prototype.load.call(this, experienceStreamId);

            //Set the state to buffering
            this.setState(rin.contracts.experienceStreamState.buffering);

            //Add a load event listener
            this._userInterfaceControl.addEventListener("load", (function (event) {
                /// <summary>Set the state to ready once the image load is complete</summary>

                //Set the state to ready
                this.setState(rin.contracts.experienceStreamState.ready);

                //Store the image dimensions
                this._storeImageDimensions();
            }).bind(this));

            //Add abort and error event listeners
            this._userInterfaceControl.addEventListener("abort", (function (event) {
                /// <summary>Set the state to error if image errors out</summary>

                //Set the state to error
                this.setState(rin.contracts.experienceStreamState.error);
            }).bind(this));
            this._userInterfaceControl.addEventListener("error", (function (event) {
                /// <summary>Set the state to error if image errors out</summary>

                //Set the state to error
                this.setState(rin.contracts.experienceStreamState.error);
            }).bind(this));

            //Add the event listener for detecting interactions
            this._userInterfaceControl.addEventListener("mousedown", (function (event) {
                /// <summary>Bind the mouse down to raise an interaction event</summary>

                //Intimate Orchestrator that the user has interacted
                this._orchestrator.startInteractionMode();
            }).bind(this));

            //Set the image source
            this._userInterfaceControl.src = this._url;
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
                (function (wrappedInteractionControls) {
                    //Load the controls into as interaction controls 
                    this._interactionControls.innerHTML = wrappedInteractionControls.innerHTML;
                    //Use knockout framework to bind the commands
                    ko.applyBindings(this, this._interactionControls);
                }).bind(this));
            }
            //Return the container element. After the orchestrator fetches the controls, it would be loaded inside this div
            return this._interactionControls;
        };

        //Pan Zoom Control Commands
        ImageES.prototype.goHomeCommand = function () {
            /// <summary>Resets the Image to fit the screen</summary>
            var defaultViewport =  new ViewPort({
                center: new TwoDCoordinates(DEFAULTCENTERX, DEFAULTCENTERY),
                span: new TwoDCoordinates(DEFAULTWIDTH, DEFAULTHEIGHT)
            });
            this._fitImage(defaultViewport);
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
            this._translateImage(PANSTEP, 0);
        };
        ImageES.prototype.panRightCommand = function () {
            /// <summary>Moves the image right by a standard scale</summary>
            this._translateImage(-1 * PANSTEP, 0);
        };
        ImageES.prototype.panUpCommand = function () {
            /// <summary>Moves the image up by a standard scale</summary>
            this._translateImage(0,PANSTEP);
        };
        ImageES.prototype.panDownCommand = function () {
            /// <summary>Moves the image down by a standard scale</summary>
            this._translateImage(0, -1 * PANSTEP);
        };

        //To get the state of the Experience at any given point of time
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
                }
            };
        };

        //Defining Private variables
        ImageES.prototype._orchestrator = null, //rin.internal.OrchestratorProxy,
        ImageES.prototype._esData = null, //Object,
        ImageES.prototype._interactionControls = null, //HTMLElement,
        ImageES.prototype._url = null, //String,
        ImageES.prototype._currentViewport = null, //ViewPort,
        ImageES.prototype._userInterfaceControl = null, //HTMLImageElement,

        //"Private Helper Functions
        ImageES.prototype._storeImageDimensions = function () {
            /// <summary>Stores the image dimensions</summary>
            var top = parseFloat(this._userInterfaceControl.style.top);
            var left = parseFloat(this._userInterfaceControl.style.left);
            var width = parseFloat(this._userInterfaceControl.style.width);
            var height = parseFloat(this._userInterfaceControl.style.height);
            this._currentViewport = new ViewPort({
                center: new TwoDCoordinates(left + width / 2, top + height / 2),
                span: new TwoDCoordinates(width, height)
            });
        };
        ImageES.prototype._translateImage = function (xAxis, yAxis) {
            /// <summary>Moves the image by applying the transform property by x and y pixels.</summary>
            /// <param name="xAxis" type="float">Horizontal translation in pixels</param>
            /// <param name="yAxis" type="float">Vertical translation in pixels</param>
            this._currentViewport.region.center.x += xAxis;
            this._currentViewport.region.center.y += yAxis;
            this._fitImage(this._currentViewport);
        };
        ImageES.prototype._scaleImage = function (scale) {
            /// <summary>Scales the image by using the transform property</summary>
            /// <param name="scale" type="float">Scaling factor</param>
            this._currentViewport.region.span.x *= scale;
            this._currentViewport.region.span.y *= scale;
            this._fitImage(this._currentViewport);
        };
        ImageES.prototype._fitImage = function (viewport) {
            /// <summary>Fits the image to the specified viewport</summary>
            /// <param name="viewport" type="Viewport">Viewport Sliver to set the image</param>
            var width = viewport.region.span.x;
            var height = viewport.region.span.y;

            //Clamp width and height
            width = Math.max(Math.min(width, MAXWIDTH), MINWIDTH);
            height = Math.max(Math.min(height, MAXHEIGHT), MINHEIGHT);

            var left = (viewport.region.center.x - width / 2);
            var top = (viewport.region.center.y - height / 2);

            //Clamp left and top
            left = Math.max(Math.min(left, MAXLEFT), MINLEFT);
            top = Math.max(Math.min(top, MAXTOP), MINTOP);

            //Set back to the UI control
            this._userInterfaceControl.style.top = top + "%";
            this._userInterfaceControl.style.left = left + "%";
            this._userInterfaceControl.style.width = width + "%";
            this._userInterfaceControl.style.height = height + "%";
            this._storeImageDimensions();
        };
        return ImageES;
    })(rin.contracts.DiscreteKeyframeESBase);

    //Registerning the ES in the es factory so that orchestrator can invoke it
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.SampleImageExperienceStream", function (orchestrator, esData) { return new ImageES(orchestrator, esData); });

    //Utility functions
    var convertToHtmlDom = function (htmlString) {
        var div = document.createElement("div");
        div.innerHTML = htmlString;
        return div;
    }

    //Defining Constants
    var ZOOMINSTEP = 1.2,
        ZOOMOUTSTEP = 0.8,
        PANSTEP = 20,
        MAXWIDTH = 200,
        MAXHEIGHT = 200,
        MAXTOP = 95,
        MAXLEFT = 95,
        MINWIDTH = 5,
        MINHEIGHT = 5,
        MINTOP = -95,
        MINLEFT = -95,
        DEFAULTCENTERX = 50,
        DEFAULTCENTERY = 50,
        DEFAULTWIDTH = 100,
        DEFAULTHEIGHT = 100,
        ELEMENTHTML = "<img style='position:absolute;left:0%;top:0%;height:100%; width:100%;'></img>";

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

}(window.rin));
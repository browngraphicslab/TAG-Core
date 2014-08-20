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
/// <reference path="../../../web/js/seadragon-0.8.9.js" />
/// <reference path="../core/TaskTimer.js" />


window.rin = window.rin || {};

(function (rin) {
    // ES for displaying deepzoom images.
    var DeepZoomES = function (orchestrator, esData) {
        DeepZoomES.parentConstructor.apply(this, arguments);
        var self = this;
        
        this._orchestrator = orchestrator;
        this._userInterfaceControl = rin.util.createElementWithHtml(DeepZoomES.elementHtml).firstChild; // Experience stream UI DOM element.
        this._seadragonClip = this._userInterfaceControl.getElementsByClassName("seadragonClip")[0];
        this._seadragonClipContents = this._userInterfaceControl.getElementsByClassName("seadragonClipContents")[0];
        this._seadragonContainer = this._userInterfaceControl.getElementsByClassName("seadragonContainer")[0];
        this._seadragonElement = null;
        this._esData = esData;
        this._url = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId); // Resolved url to the DZ image.
        this.viewportChangedEvent = new rin.contracts.Event();
        this.applyConstraints = orchestrator.getPlayerConfiguration().playerMode !== rin.contracts.playerMode.AuthorerEditor;
        this.old_left = 0;
        this.old_top = 0;
        this.old_width = 0;
        this.old_height = 0;
        this.msGesture = null;
        this.cover = $(document.createElement('div'));
        this.proxy = $(document.createElement('div'));
        this.proxy.attr('data-proxy', escape(this._esData.experienceId));
        this.proxy.data({
            'x': 0,
            'y': 0,
            'w': 0,
            'h': 0
        });
        this.proxy.css({ "background": "rgba(0,0,0,0)", "width": "0px", "height": "0px" });

        esData.data = esData.data || {};
        esData.data.defaultKeyframe = esData.data.defaultKeyframe || {
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

        // Set viewport visibility constrains
        Seadragon.Config.visibilityRatio = typeof esData.data.viewportConstrainRatio === "undefined" ? 0.05 : esData.data.viewportConstrainRatio;
        if (esData.data.viewportClamping && esData.data.viewportClamping !== this.viewportClampingOptions.none) {
            this.viewportClampingMode = esData.data.viewportClamping;
            Seadragon.Config.visibilityRatio = 1; // This is required to support viewport clamping.
        }

        // Monitor interactions on the ES
        $(this._userInterfaceControl).bind("mousedown mousewheel", function (e) {
            self._orchestrator.startInteractionMode();
            self._orchestrator.onESEvent(rin.contracts.esEventIds.interactionActivatedEventId, null);
            //self._userInterfaceControl.focus();
        });
        $(this._userInterfaceControl).bind("DOMMouseScroll", function(e) {
            console.log("*************************************")
            self._orchestrator.startInteractionMode();
        });

        // Handle key events for panning
        this._userInterfaceControl.addEventListener('keydown', function (e) {
            if (e.keyCode === '37') //left arrow
                self.panLeftCommand();
            else if (e.keyCode === '38') //up arrow
                self.panUpCommand();
            else if (e.keyCode === '39') //right arrow
                self.panRightCommand();
            else if (e.keyCode === '40') //down arrow 
                self.panDownCommand();
        }, true);
        this.updateEA = null;
    };

    rin.util.extend(rin.contracts.InterpolatedKeyframeESBase, DeepZoomES);

    DeepZoomES.prototypeOverrides = {
        getEmbeddedArtifactsProxy: function (layoutEngine) {
            var provider = this;
            this.updateEA = function () { layoutEngine.render({}); };
            return new function () {
                var tmpRegion = { center: { x: 0, y: 0 }, span: { x: 0, y: 0 } };
                var tmpPoint = new Seadragon.Point();
                this.getEmbeddedArtifactsContainer = function () {
                    return provider._seadragonClipContents;
                };
                this.convertPointToScreen2D = function (inPoint, outPoint) {
                    tmpPoint.x = inPoint.x;
                    tmpPoint.y = inPoint.y;
                    var result = provider._viewer.viewport.pixelFromPoint(tmpPoint, true);
                    outPoint.x = result.x;
                    outPoint.y = result.y;
                    return true;
                };
                this.convertPointToWorld2D = function (inPoint, outPoint) {
                    tmpPoint.x = inPoint.x;
                    tmpPoint.y = inPoint.y;
                    var result = provider._viewer.viewport.pointFromPixel(tmpPoint, true);
                    outPoint.x = result.x;
                    outPoint.y = result.y;
                    return true;
                };
                this.getScreenDimensions = function (r) {
                    r.span.x = provider._userInterfaceControl.clientWidth;
                    r.span.y = provider._userInterfaceControl.clientHeight;
                    r.center.x = r.span.x / 2;
                    r.center.y = r.span.y / 2;
                };

                this.currentNormalizedZoom = function () {
                    return provider._viewer.viewport.getZoom(true);
                };
            };
        },

        // Load and initialize the ES.
        load: function (experienceStreamId) {
            var self = this;
            this.addSliverInterpolator("viewport", function (sliverId, state) {
                return new rin.Ext.Interpolators.linearViewportInterpolator(state);
            });

            DeepZoomES.parentPrototype.load.call(self, experienceStreamId);

            self.setState(rin.contracts.experienceStreamState.buffering); // Set to buffering till the ES is loaded.
            rin.internal.debug.write("Load called for " + self._url);

            self._viewer = new Seadragon.Viewer(self._seadragonContainer, !self.applyConstraints);
            self._viewer.clearControls();

            // Raise state transition event anytime the state of the ES has changed, like a pan or zoom.
            self._viewer.addEventListener('animationfinish', function () {
                var playerState = self._orchestrator.getPlayerState();
                if (playerState === rin.contracts.playerState.pausedForExplore || playerState === rin.contracts.playerState.stopped) {
                    self._orchestrator.onESEvent(rin.contracts.esEventIds.stateTransitionEventId, { isUserInitiated: true, transitionState: "completed" });
                }
            });
            
            /// Regex for matching zoom.it urls
            var zoomItMatch = self._url.match(new RegExp("http://(www\\.)?zoom\\.it/(\\w+)\\s*"));

            // Default animation time used for panning and zooming.
            Seadragon.Config.animationTime = 0.5;

            // Function to open the dzi if source is not a zoom.it url.
            function openDzi(dzi) {
                self._viewer.addEventListener('open', function (openedViewer) {
                    self._viewer.addEventListener('animation', function (viewer) { self.raiseViewportUpdate(); });
                    //self._viewer.addEventListener('animationstart', function (viewer) { self.raiseViewportUpdate(); });
                    self._viewer.addEventListener('animationfinish', function (viewer) { self.raiseViewportUpdate(); });
                    
                    self._seadragonElement = self._seadragonContainer.firstChild;
                    self.setState(rin.contracts.experienceStreamState.ready);
                    
                    self._orchestrator.getPlayerRootControl().addEventListener("resize", function () {
                            if (self.getState() === "ready") {
                                self._updateViewportClip(self._viewer);
                                //if (self.applyConstraints)
                                openedViewer.viewport.applyConstraints(true);
                            }
                    }, true);
                    self.initTouch();
                    self._updateViewportClip(openedViewer);
                    //if (self.applyConstraints)
                        openedViewer.viewport.applyConstraints(true);
                    self.raiseViewportUpdate();
                });

                self._viewer.addEventListener('error', function (openedViewer) {
                    rin.internal.debug.write("Deepzoom ES got into error state.");
                    self.setState(rin.contracts.experienceStreamState.error);
                });

                self._viewer.openDzi(dzi);
            }

            // Function to open a zoom.it url.
            function onZoomitresponseonse(response) {
                if (response.status !== 200) {
                    // e.g. the URL is malformed or the service is down
                    rin.internal.debug.write(response.statusText);
                    self._orchestrator.eventLogger.logErrorEvent("Error in loading deepzoom {0}. Error: {1}", self._url, response.statusText);
                    self.setState(rin.contracts.experienceStreamState.error);
                    return;
                }

                var content = response.content;

                if (content && content.ready) { // Image is ready!!
                    openDzi(content.dzi);
                } else if (content.failed) { // zoom.it couldnt process the image
                    rin.internal.debug.write(content.url + " failed to convert.");
                    self._orchestrator.eventLogger.logErrorEvent("Error in loading deepzoom {0}. Error: {1}", self._url, "failed to convert");
                    self.setState(rin.contracts.experienceStreamState.error);
                } else { // image is still under processing
                    rin.internal.debug.write(content.url + " is " + Math.round(100 * content.progress) + "% done.");
                    self.setState(rin.contracts.experienceStreamState.error);
                }
            }

            if (zoomItMatch) {
                // Using JSONP approach to to load a zoom.it url.
                var imageID = zoomItMatch[2];

                $.ajax({
                    url: "http://api.zoom.it/v1/content/" + imageID,
                    dataType: "jsonp",
                    success: onZoomitresponseonse
                });
            }
            else {
                openDzi(this._url);
            }
        },

        unload: function () {
            this._viewer.unload();
            this.cover.remove();
            this.proxy.remove();
        },

        // Pause the player.
        pause: function (offset, experienceStreamId) {
            DeepZoomES.parentPrototype.pause.call(this, offset, experienceStreamId);
        },
        
        // Apply a keyframe to the ES.
        displayKeyframe: function (keyframeData) {
            if (this.getState() !== rin.contracts.experienceStreamState.ready || !keyframeData.state) return; // Not ready yet, do not attempt to show anything.
            
            if (this.msGesture) {
                this.msGesture.stop();
                this.cover.hide();
            }

            var viewport = keyframeData.state.viewport;
            if (viewport) {
                var rect = new Seadragon.Rect(viewport.region.center.x, viewport.region.center.y, viewport.region.span.x, viewport.region.span.y);
                this._viewer.viewport.fitBounds(rect, true);
            }
        },

        raiseViewportUpdate: function(){
            this._updateViewportClip(this._viewer);
        },

        _updateViewportClip: function (viewer) {
            // Update EAs if present
            if (this.updateEA !== null) this.updateEA();

            // Get pixel coordinates of the DZ image
            var topLeft = viewer.viewport.pixelFromPoint(new Seadragon.Point(0, 0), true);
            var bottomRight = viewer.viewport.pixelFromPoint(new Seadragon.Point(1, viewer.source.height / viewer.source.width), true);
            var panelW = this._userInterfaceControl.clientWidth;
            var panelH = this._userInterfaceControl.clientHeight;

            // Apply viewport clamping
            var percentageAdjustment;
            if (this.viewportClampingMode !== this.viewportClampingOptions.none) {
                var adjOffset = 0;
                if (viewer.source.height <= viewer.source.width) {
                    if (this.viewportClampingMode === this.viewportClampingOptions.all) {
                        percentageAdjustment = panelH / viewer.source.height;
                        var proportionalWidth = viewer.source.width * percentageAdjustment;
                        adjOffset = panelW - proportionalWidth;
                    }
                    Seadragon.Config.minZoomDimension = panelH + (adjOffset > 0 ? adjOffset * viewer.source.height / viewer.source.width : 0);
                } else {
                    if (this.viewportClampingMode === this.viewportClampingOptions.all) {
                        percentageAdjustment = panelW / viewer.source.width;
                        var proportionalHeight = viewer.source.height * percentageAdjustment;
                        adjOffset = panelH - proportionalHeight;
                    }
                    Seadragon.Config.minZoomDimension = panelW + (adjOffset > 0 ? adjOffset * viewer.source.width / viewer.source.height : 0);
                }
            }

            // Apply the clip on the image
            this._seadragonClipContents.style.width = panelW + "px";
            this._seadragonClipContents.style.height = panelH + "px";

            var newLeft = topLeft.x;
            var newTop = topLeft.y;

            var newWidth = bottomRight.x - topLeft.x;
            var newHeight = bottomRight.y - topLeft.y;
            //console.log("nL = " + newLeft + ", nT = " + newTop + ", nW = " + newWidth + ", nH = " + newHeight);

            if (!this.proxy[0].parentNode) {
                var viewerElt = $("#rinplayer").length ? $("#rinplayer") : $("#rinPlayer");
                viewerElt.append(this.proxy);
            }
            this.proxy.data({
                x: newLeft, y: newTop,
                w: newWidth, h: newHeight
            });


            this.old_left = newLeft;
            this.old_top = newTop;
            this.old_width = newWidth;
            this.old_height = newHeight;

            if (newLeft > 0) {
                this._seadragonClip.style.left = newLeft + "px";
                this._seadragonClipContents.style.left = -newLeft + "px";
            }
            else {
                this._seadragonClip.style.left = "0px";
                this._seadragonClipContents.style.left = "0px";
                newLeft = 0;
            }
            if (newTop > 0) {
                this._seadragonClip.style.top = newTop + "px";
                this._seadragonClipContents.style.top = -newTop + "px";
            }
            else {
                this._seadragonClip.style.top = "0px";
                this._seadragonClipContents.style.top = "0px";
                newTop = 0;
            }

            this._seadragonClip.style.width = Math.min(panelW, (bottomRight.x - newLeft)) + "px";
            this._seadragonClip.style.height = Math.min(panelH, (bottomRight.y - newTop)) + "px";

            var pushstate = {
                x: this.old_left, y: this.old_top,
                width: this.old_width, height: this.old_height
            };
			//console.log(this.old_left + ", " + this.old_top);
			//console.log(this.old_width + ", " + this.old_height);
            this.viewportChangedEvent.publish(pushstate);
            return pushstate;
        }, 

        // Handle touch input for zoom and pan.
        touchHandler: function (event, cover) {
            var touches = event.changedTouches,
             first = touches ? touches[0] : { screenX: event.screenX, screenY: event.screenY, clientX: event.clientX, clientY: event.clientY, target: event.target },
             type = "";
            switch (event.type) {
                case "mousedown":
                case "touchstart":
                    type = "mousedown"; cover.show(); break;
                case "MSPointerDown":
                    type = "mousedown"; cover.show(); break;
                case "mousemove":
                case "touchmove":
                    type = "mousemove"; break;
                case "MSPointerMove":
                    type = "mousemove"; break;
                case "mouseup":
                case "touchend":
                    type = "mouseup"; this.lastFirst = this.lastSecond = null; cover.hide(); break;
                case "MSPointerUp":
                    type = "mouseup"; this.lastFirst = this.lastSecond = null; cover.hide(); break;
                default: return;
            }
            var simulatedEvent = document.createEvent("MouseEvent");
            simulatedEvent.initMouseEvent(type, true, true, window, 1,
                        first.screenX, first.screenY,
                        first.clientX, first.clientY, false,
                        false, false, false, 0, null);

            first.target.dispatchEvent(simulatedEvent);
            event.preventDefault();
            //self.raiseViewportUpdate();
            return false;
        },
		
		makeManipulatable: function (element, functions, stopOutside, noAccel) {
			console.log("makeManip called");
			var hammer = new Hammer(element, {
				hold_threshold: 3,
				drag_min_distance: 9,
				drag_max_touches: 10,
				hold_timeout: 600,
				tap_max_distance: 15,
				doubletap_distance: 17,
				doubletap_interval: 200,
				swipe: false
			});

			var lastTouched = null,
				that = this,
				manipulating = false,
				isDown = false,
				$element = $(element);

			var lastPos = {},
				lastEvt,
				timer,
				currentAccelId = 0,
				lastScale = 1;

			// general event handler
			function manipulationHandler(evt) {
				var translation;
				if (evt.gesture) {
					// Update Dir
					getDir(evt, true);
					var pivot = { x: evt.gesture.center.pageX - $element.offset().left, y: evt.gesture.center.pageY - $element.offset().top };
					var rotation = evt.gesture.rotation; // In degrees
					if (!lastPos.x && lastPos.x !== 0) {
						translation = { x: evt.gesture.deltaX, y: evt.gesture.deltaY };
					} else {
						translation = { x: evt.gesture.center.pageX - lastPos.x, y: evt.gesture.center.pageY - lastPos.y };
					}
					var scale = evt.gesture.scale - lastScale;
					lastScale = evt.gesture.scale;
					lastPos.x = evt.gesture.center.pageX;
					lastPos.y = evt.gesture.center.pageY;
					lastEvt = evt;
					if (typeof functions.onManipulate === "function") {
						functions.onManipulate({ pivot: pivot, translation: translation, rotation: rotation, scale: 1 + scale }, evt);
					}
					clearTimeout(timer);
					timer = setTimeout(function () {
						var dir = getDir(evt);
						if (evt.gesture.pointerType !== "mouse" && !noAccel)
							accel(30 * dir.vx, 30 * dir.vy, null, currentAccelId);
					}, 5);
					//if ((evt.type === "pinch" || evt.type === "pinchin" || evt.type === "pinchout") && typeof functions.onScroll === "function")
					//    functions.onScroll(1 + scale, pivot);
				} else {
					// Update Dir
					getDir(evt, true);
					var pivot = { x: evt.pageX - $element.offset().left, y: evt.pageY - $element.offset().top };
					// var rotation = evt.gesture.rotation; // In degrees // Don't need rotation...
					if (false && !lastPos.x && lastPos.x !== 0) { // TODO need this?
						translation = { x: evt.gesture.deltaX, y: evt.gesture.deltaY };
					} else {
						translation = { x: evt.pageX - lastPos.x, y: evt.pageY - lastPos.y };
					}
					var scale = evt.gesture.scale - lastScale; /////////////////// HEREHEHEHEHEHRHERIEREIRHER ///
					lastScale = evt.gesture.scale;
					lastPos.x = evt.pageX;
					lastPos.y = evt.pageY;
					lastEvt = evt;
					if (typeof functions.onManipulate === "function") {
						functions.onManipulate({ pivot: pivot, translation: translation, rotation: rotation, scale: 1 + scale }, evt);
					}
					clearTimeout(timer);
					timer = setTimeout(function () {
						var dir = getDir(evt);
						if (evt.gesture.pointerType !== "mouse" && !noAccel)
							accel(30 * dir.vx, 30 * dir.vy, null, currentAccelId);
					}, 5);
				}
			}

			function processPinch(evt) {
				var pivot = { x: evt.gesture.center.pageX - $element.offset().left, y: evt.gesture.center.pageY - $element.offset().top };
				var scale = evt.gesture.scale - lastScale;
				var rotation = evt.gesture.rotation; // In degrees
				var translation;
				if (!lastPos.x && lastPos.x !== 0) {
					translation = { x: 0, y: 0};
				} else {
					translation = { x: evt.gesture.center.pageX - lastPos.x, y: evt.gesture.center.pageY - lastPos.y };
				}
				lastPos.x = evt.gesture.center.pageX;
				lastPos.y = evt.gesture.center.pageY;
				getDir(evt, true);
				if (scale !== lastScale && typeof functions.onScroll === "function")
					functions.onScroll(1 + scale, pivot);
				if (typeof functions.onManipulate === "function")
					functions.onManipulate({ pivot: pivot, translation: translation, rotation: rotation, scale: 1 }, evt);

				lastScale = evt.gesture.scale;
			}

			// mousedown
			var dragStart;
			function processDown(evt) {
				lastScale = 1;
				isDown = true;
				dragStart = evt.gesture.center;
				lastEvt = null;
				lastTouched = evt.srcElement;
				currentAccelId++;
				resetDir();
				clearTimeout(timer);
			}

			// mouse move
			function processMove(evt) {
                isDown && manipulationHandler(evt);
			}

			// requestAnimationFrame polyfill by Erik Möller
			// fixes from Paul Irish and Tino Zijdel
			(function () {
				var lastTime = 0;
				var vendors = ['ms', 'moz', 'webkit', 'o'];
				for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
					window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
					window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
				}

				if (!window.requestAnimationFrame)
					window.requestAnimationFrame = function (callback, element) {
						var currTime = Date.now();
						var timeToCall = Math.max(0, 16 - (currTime - lastTime));
						var id = window.setTimeout(function () { callback(currTime + timeToCall); },
						  timeToCall);
						lastTime = currTime + timeToCall;
						return id;
					};

				if (!window.cancelAnimationFrame)
					window.cancelAnimationFrame = function (id) {
						clearTimeout(id);
					};
			}());

			function accel(vx, vy, delay, id) {
				if (!lastEvt) return;
				if (currentAccelId !== id) return;
				if (Math.abs(vx) <= 4 && Math.abs(vy) <= 4) {
					return;
				}
				var offset = $element.offset();
				delay = delay || 5;
				var pivot = { x: lastEvt.gesture.center.pageX - offset.left, y: lastEvt.gesture.center.pageY - offset.top };
				var rotation = 0; // In degrees
				var translation = { x: vx, y: vy };
				var scale = 1;
				if (typeof functions.onManipulate === "function")
					functions.onManipulate({ pivot: pivot, translation: translation, rotation: rotation, scale: scale }, lastEvt);
				timer = setTimeout(function () {
					accel(vx * 0.95, vy * 0.95, delay, id);
				}, delay);
				//timer = window.requestAnimationFrame(accel(vx * .95, vy * .95, delay, id), $element);
			}

			// mouse release
			function processUp(evt) {
				//evt.stopPropagation();
				isDown = false;
				lastPos = {};
				var dir = getDir(evt);
				if (evt.gesture.pointerType === "mouse" && !noAccel)
					accel(30 * dir.vx, 30 * dir.vy, null, currentAccelId);
				if (typeof functions.onRelease === "function")
					functions.onRelease(evt);

				//var dir = getDir(evt);
				//resetDir();
				//setTimeout(function () {
					//accel(30 * dir.vx, 30 * dir.vy, null, currentAccelId);
				//}, 1);
				//accel(30 * evt.gesture.velocityX * (evt.gesture.center.pageX > dragStart.pageX ? 1 : -1),//(Math.abs(evt.gesture.angle) < 90 ? 1 : -1),
				//    30 * evt.gesture.velocityY * (evt.gesture.center.pageY > dragStart.pageY ? 1 : -1));//evt.gesture.angle / Math.abs(evt.gesture.angle));
			}

			var firstEvtX, firstEvtY, changeX, changeY, prevEvt;
			function resetDir() {
				firstEvtX = null;
				firstEvtY = null;
				changeX = 0;
				changeY = 0;
				prevEvt = null;
			}

			function getDir(evt, noReturn) {
				if (!firstEvtX) {
					firstEvtX = evt;
					//console.log("firstEvtX SETA");
					firstEvtX.currentDir = firstEvtX.gesture.deltaX / Math.abs(firstEvtX.gesture.deltaX) || 0;
					if (!prevEvt) {
						prevEvt = evt;
						return { vx: 0, vy: 0 };
					}
				} else {
					if (evt.gesture.deltaX > prevEvt.gesture.deltaX && firstEvtX.currentDir !== 1) {
						firstEvtX = evt;
						//console.log("firstEvtX SETB");
						firstEvtX.currentDir = 1;
					} else if (evt.gesture.deltaX < prevEvt.gesture.deltaX && firstEvtX.currentDir !== -1) {
						firstEvtX = evt;
						//console.log("firstEvtX SETC");
						firstEvtX.currentDir = -1;
					}
				}
				if (!firstEvtY) {
					firstEvtY = evt;
					//console.log("firstEvtY SETA");
					firstEvtY.currentDir = firstEvtY.gesture.deltaY / Math.abs(firstEvtY.gesture.deltaY) || 0;
				} else {
					if (evt.gesture.deltaY > prevEvt.gesture.deltaY && firstEvtY.currentDir !== 1) {
						firstEvtY = evt;
						//console.log("firstEvtY SETB");
						firstEvtY.currentDir = 1;
					} else if (evt.gesture.deltaY < prevEvt.gesture.deltaY && firstEvtY.currentDir !== -1) {
						firstEvtY = evt;
						//console.log("firstEvtY SETC");
						firstEvtY.currentDir = -1;
					}
				}
				prevEvt = evt;
				if (!noReturn) {
					return {
						vx: ((evt.gesture.deltaX - firstEvtX.gesture.deltaX) / (evt.gesture.timeStamp - firstEvtX.gesture.timeStamp)) || 0,
						vy: ((evt.gesture.deltaY - firstEvtY.gesture.deltaY) / (evt.gesture.timeStamp - firstEvtY.gesture.timeStamp)) || 0,
					};
				}
			}

			// scroll wheel
			function processScroll(evt) {
                var dragStart = evt.gesture.center;
                var pivot     = { x: evt.x - $element.offset().left, y: evt.y - $element.offset().top };
				var delta     = evt.wheelDelta;
                if (delta < 0){
                    delta = 1.0 / 1.1;
                } else {
                    delta = 1.1;
                };
				evt.cancelBubble = true;
                if (typeof functions.onScroll === "function") { 
                    functions.onScroll(delta, pivot);
                }
			}
			
			function processScrollFirefox(evt) {
				//console.log("capturing wheel events");
//				var pivot = { x: evt.x - $element.offset().left, y: evt.y - $element.offset().top };
//				var delta = -evt.detail;
//				//console.log("delta captured " + delta);
//				/*
//				if (delta < 0) { 
//					console.log("here; " + delta);
//					delta = 1.0 / 1.1;
//				} else { 
//					console.log("there; " + delta);
//					delta = 1.1;
//				}
//				*/
//				if (delta < 0) delta = 1.0 / 3;
//            	else delta = 3;
//				evt.cancelBubble = true;
//				if (typeof functions.onScroll === "function") { 
//					functions.onScroll(delta, pivot);
//				}
                var dragStart = evt.gesture.center;              
				var pivot     = { x: evt.clientX - $element.offset().left, y: evt.clientY - $element.offset().top };
                var delta     = - evt.detail;
				if (delta < 0){
                    delta = 1.0 / 1.1;
                } else {
                    delta = 1.1;
                };
                evt.cancelBubble = true;
                if (typeof functions.onScroll === "function") { 
                    functions.onScroll(delta, pivot);
                };
			}

			hammer.on('touch', processDown);
			hammer.on('drag', function(evt){
				processMove(evt);
			});
			hammer.on('pinch', processPinch);
			hammer.on('release', processUp);
			element.onmousewheel = processScroll;
			//element.addEventListener("MozMousePixelScroll", processScrollFirefox);
			element.addEventListener("DOMMouseScroll", processScrollFirefox);
            // $(element).on('mousemove', function(evt) {
            //     processMove(evt);
            // });

			// double tap
			var doubleTappedHandler, event;
			if (typeof functions.onDoubleTapped === "function") {
				doubleTappedHandler = function (evt) {
					if (evt.gesture.srcEvent.button > 0 || evt.gesture.srcEvent.buttons == 2) {
						return;
					}
					event = {};
					event.position = {};
					event.position.x = evt.gesture.center.pageX - $(element).offset().left;
					event.position.y = evt.gesture.center.pageY - $(element).offset().top;
					functions.onDoubleTapped(event);
				};
				hammer.on('doubletap', doubleTappedHandler);
			}

			// short tap, i.e. left-click
			var tappedHandler = null;
			if (typeof functions.onTapped === "function") {
				tappedHandler = function (evt) {
					if (evt.gesture.srcEvent.button > 0) {
						evt.stopPropagation();
						event = {};
						event.gesture = evt.gesture;
						event.position = {};
						event.position.x = evt.gesture.center.pageX - $(element).offset().left;
						event.position.y = evt.gesture.center.pageY - $(element).offset().top;
						if (functions.onTappedRight) {
							functions.onTappedRight(event);
						}
						return;
					}
					event = {};
					event.position = {};
					event.button = evt.button;
					event.gesture = evt.gesture;
					event.position.x = evt.gesture.center.pageX - $(element).offset().left;
					event.position.y = evt.gesture.center.pageY - $(element).offset().top;
					functions.onTapped(event);
				};
				hammer.on('tap', tappedHandler);
				//gr.addEventListener('tapped', tappedHandler);
			}

			var releasedHandler = null;
			if (typeof functions.onRelease === "function") {
				releasedHandler = function (evt) {
					event = {};
					event.position = {};
					event.position.x = evt.gesture.center.pageX - $(element).offset().left;
					event.position.y = evt.gesture.center.pageY - $(element).offset().top;
					functions.onRelease(event);
				};
				hammer.on('release', releasedHandler);
			}

			//var debugLog = function(evt) {
			//    console.log(evt.type);
			//}

			//hammer.on('release hold tap touch drag doubletap', debugLog);

			// long-press, i.e. right-click
			var holdHandler = null;
			var rightClickHandler = null;
			var stopNextClick = false;
			if (typeof functions.onTappedRight === "function") {
				holdHandler = function (evt) {
					evt.stopPropagation();
					stopNextClick = true;
					event = {};
					event.gesture = evt.gesture;
					event.position = {};
					event.position.x = evt.gesture.center.pageX - $element.offset().left;
					event.position.y = evt.gesture.center.pageY - $element.offset().top;
					functions.onTappedRight(event);
				};
				rightClickHandler = function (evt) {
					evt.stopPropagation();
					event = {};
					event.button = evt.button;
					event.gesture = evt.gesture;
					event.position = {};
					event.position.x = evt.pageX - $element.offset().left;
					event.position.y = evt.pageY - $element.offset().top;
					functions.onTappedRight(event);
				};
				element.addEventListener("MSPointerDown", function (evt) {
					console.log(evt);
					if (stopNextClick) {
						console.log("STOPPING CLICK");
						evt.stopPropagation();
						setTimeout(function () {
							stopNextClick = false;
						}, 1);
						return;
					}
				}, true);
				element.addEventListener("mouseup", function (evt) {
					console.log("CLICK");
					if (stopNextClick) {
						console.log("STOPPING CLICK");
						evt.stopPropagation();
						setTimeout(function () {
							stopNextClick = false;
						}, 1);
						return;
					}
					if (evt.button === 2) {
						rightClickHandler(evt);
					}

				}, true);

				hammer.on('hold', holdHandler);
			}

			return {
				cancelAccel: function () {
					currentAccelId++;
					clearTimeout(timer);
				}
			};
			
			//return gr;
		},

        // Initialize touch gestures.
        initTouch: function () {
			console.log("ALKWEFJIEWOJFASFISHEWIOFHSIEDHFIHEWIFHWEHFEHFIOWHEFOHIHWEIOFHIEWOHFOWEUHFWOEIUFHEWOFIHEWFIHWEUIOFHEWFUIOHEWFUIOHWEFIOHEWOFUIHEWIFUHEFIOHEWOFIUHEWFIOHWEFUIHEF");
            var self = this,
                node = self._viewer.drawer.elmt,
                cover = this.cover;

            // set up touch cover
            cover.css({
                position: 'absolute',
                top: '0px',
                left: '0px',
                width: '100%',
                height: '100%',
                'z-index': '100000000000000000000'
            });
            cover.hide();
            //$('#tagRoot').append(cover);

            // If running on IE 10/RT, enable multitouch support.
            //Disabled ie handlers since pinch zooming was not working. In future, reenable, and fix scrolling bug. For now, run hammer handlers in all cases.
           /* if (window.navigator.msPointerEnabled && typeof (MSGesture) !== "undefined") { 
                var onmspointerdown = function (e) {
                    self._orchestrator.startInteractionMode();
                    self._orchestrator.onESEvent(rin.contracts.esEventIds.interactionActivatedEventId, null);

                    if (!self.msGesture) {
                        self.msGesture = new MSGesture();
                        self.msGesture.target = node;
                    }

                    self.msGesture.addPointer(e.pointerId);

                    e.stopPropagation();
                    e.preventDefault();

                    cover.show();
                };
                Seadragon.Utils.addEvent(node, "MSPointerDown", onmspointerdown);
                cover[0].addEventListener('MSPointerDown', onmspointerdown, true);

                // bleveque: added this to remove cover on mouseUp -- make sure it still works with bimanual pinch zoom
                var onmspointerup = function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    cover.hide();
					
					// !!debug!!
					console.log("mouseup");
                };
                Seadragon.Utils.addEvent(node, "MSPointerUp", onmspointerup);
                cover[0].addEventListener('MSPointerUp', onmspointerup, true);
				

                var onmsgesturechanged = function (e) {
					console.log("logging mouse data");
					console.log(e.scale);
					console.log(e.translationX);
					console.log(e.translationY);
                    self._viewer.viewport.panBy(self._viewer.viewport.deltaPointsFromPixels(new Seadragon.Point(-e.translationX, -e.translationY), true), false);
                    //if (self.applyConstraints)
                        self._viewer.viewport.applyConstraints(true);
                    e.stopPropagation();
                    cover.show(); // we added MSPointerUp to hide the cover, so we want to show it again on gesture changed (e.g. bimanual pinch zooming)
					
					// !!debug!!
					console.log("gesture changed");
                };
                Seadragon.Utils.addEvent(node, "MSGestureChange", onmsgesturechanged);
                cover[0].addEventListener('MSGestureChange', onmsgesturechanged, true);

                var onmsgestureend = function (e) {
                    if (self.msGesture) self.msGesture.stop();
                    cover.hide();
					
					// !!debug!!
					console.log("gesture end");
                };
                Seadragon.Utils.addEvent(node, "MSGestureEnd", onmsgestureend);
                cover[0].addEventListener('MSGestureEnd', onmsgestureend, true);

                var onmsgesturestart = function (e) {
                    e.stopPropagation();
                    cover.show();
					
					// !!debug!!
					console.log("gesture start");
                };
                Seadragon.Utils.addEvent(node, "MSGestureStart", onmsgesturestart);
                cover[0].addEventListener('MSGestureStart', onmsgesturestart, true);
            } */
           // else { // Not IE 10, use normal single touch handlers.
                var handler = function (event) {
                    return self.touchHandler(event, cover);
                };
				
				// begin new handler section - dz
				// now using hammer to do interactions
				// DZ elements are stored in "node"
				

				self.makeManipulatable(node, {
					onTapped: function (res) {
						self._orchestrator.startInteractionMode(); // bleveque: was this._orch.....
						self._orchestrator.onESEvent(rin.contracts.esEventIds.interactionActivatedEventId, null);
					},
                    onScroll: dzScroll,
					onManipulate: function (res) {
						console.log("logging mouse data");
						console.log(res.translation.x);
						console.log(res.translation.y);
						self._viewer.viewport.panBy(self._viewer.viewport.deltaPointsFromPixels(new Seadragon.Point(-res.translation.x, -res.translation.y), true), false);
                        self._viewer.viewport.applyConstraints(true);
						self.raiseViewportUpdate();
					}
				});
                function dzScroll(delta, pivot) { //function to handle deep zoom scrolling
                    // debugger;
                    self._viewer.viewport.zoomBy(delta, self._viewer.viewport.pointFromPixel(new Seadragon.Point(pivot.x, pivot.y)));
                    self._viewer.viewport.applyConstraints();
                }


				/*
				self.makeManipulatable(self._seadragonContainer.firstChild, {
					onManipulate: function (res) {
					console.log("moving seadragon element");
						self._viewer.viewport.panBy(self._viewer.viewport.deltaPointsFromPixels(new Seadragon.Point(-res.translation.x, -res.translation.y), true), false);
						console.log("pan");
                        self._viewer.viewport.applyConstraints(true);
						console.log("constrain");
						self.raiseViewportUpdate();
						console.log("viewport update");
					},
				});
				*/
				
				self.makeManipulatable(cover[0], {
					onManipulate: function (res) {
						self._viewer.viewport.panBy(self._viewer.viewport.deltaPointsFromPixels(new Seadragon.Point(-res.translation.x, -res.translation.y), true), false);
                        self._viewer.viewport.applyConstraints(true);
						self.raiseViewportUpdate();
					},
				});
				
				// old mouse handlers
				/*
				// mousedown handlers
				Seadragon.Utils.addEvent(node, "mousedown", function () { 
					//console.log("mousedown, adding mousemove handlers");
					//Seadragon.Utils.addEvent(node, "mousemove", onmousemove);
					//cover[0].addEventListener('mousemove', onmousemove, true);
					//console.log("mousemove handlers added");
				});
                cover[0].addEventListener('mousedown', function () { 
					console.log("mousedown, adding mousemove handlers");
					Seadragon.Utils.addEvent(node, "mousemove", onmousemove);
					cover[0].addEventListener('mousemove', onmousemove, true);
					console.log("mousemove handlers added");
				}, true);
				
				// mouseup handlers
				Seadragon.Utils.addEvent(node, "mouseup", function () { 
					console.log("mouseup, removing mousemove handlers");
					Seadragon.Utils.removeEvent(node, "mousemove", onmousemove);
					cover[0].removeEventListener('mousemove', onmousemove, true);
					console.log("mousemove handlers removed");
				});
                cover[0].addEventListener('mouseup', function () { 
					console.log("mouseup, removing mousemove handlers");
					Seadragon.Utils.removeEvent(node, "mousemove", onmousemove);
					cover[0].removeEventListener('mousemove', onmousemove, true);
					console.log("mousemove handlers removed");
				}, true);

				
				Seadragon.Utils.addEvent(node, "touchstart", onmspointerdown);
                cover[0].addEventListener('touchstart', onmspointerdown, true);
				Seadragon.Utils.addEvent(node, "touchend", onmspointerup);
                cover[0].addEventListener('touchend', onmspointerup, true);
				Seadragon.Utils.addEvent(node, "touchmove", onmsgesturechanged);
                cover[0].addEventListener('touchmove', onmsgesturechanged, true);
				
				
                self._userInterfaceControl.addEventListener("touchstart", handler, true);
                self._userInterfaceControl.addEventListener("touchmove", handler, true);
                self._userInterfaceControl.addEventListener("touchend", handler, true);
                self._userInterfaceControl.addEventListener("touchcancel", handler, true);
                cover.on('touchstart', handler);
                cover.on('touchmove', handler);
                cover.on('touchend', handler);
                cover.on('touchcancel', handler);
				*/
				
				//self._userInterfaceControl.addEventListener("mousedown", handler, true);
                //self._userInterfaceControl.addEventListener("mousemove", handler, true);
                //self._userInterfaceControl.addEventListener("mouseup", handler, true);
                //cover.on('mousedown', handler);
                //cover.on('mousemove', handler);
                //cover.on('mouseup', handler);

                self._userInterfaceControl.addEventListener("MSPointerDown", handler, true);
                self._userInterfaceControl.addEventListener("MSPointerMove", handler, true);
                self._userInterfaceControl.addEventListener("MSPointerUp", handler, true);
                cover.addEventListener('MSPointerDown', handler, true);
                cover.addEventListener('MSPointerMove', handler, true);
                cover.addEventListener('MSPointerUp', handler, true);
           // } 
        },

        // Get an instance of the interaction controls for this ES.
        getInteractionControls: function () {
            var self = this;
            if (!self.interactionControls) { // Check for a cached version. If not found, create one.
                self.interactionControls = document.createElement("div");

                this._orchestrator.getInteractionControls([rin.contracts.interactionControlNames.panZoomControl],
                    function (wrappedInteractionControls) {
                        // Populate the container div with the actual controls.
                        rin.util.assignAsInnerHTMLUnsafe(self.interactionControls, wrappedInteractionControls.innerHTML);
                        // Bind the controls with its view-model.
                        ko.applyBindings(self, self.interactionControls);
                    });
            }

            // Return the cached version or the container div, it will be populated once the interaction control is ready.
            return this.interactionControls;
        },

        // Zoom in to the image by a predefined amount.
        zoomInCommand: function () {
            this._viewer.viewport.zoomBy(1.2, null, false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        // Zoom out from the image by a predefined amount.
        zoomOutCommand: function () {
            this._viewer.viewport.zoomBy(0.8, null, false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        // Pan the image by a predefined amount.
        panLeftCommand: function () {
            this._viewer.viewport.panBy(new Seadragon.Point(-this.panDistance / this._viewer.viewport.getZoom(true), 0), false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        // Pan the image by a predefined amount.
        panRightCommand: function () {
            this._viewer.viewport.panBy(new Seadragon.Point(this.panDistance / this._viewer.viewport.getZoom(true), 0), false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        // Pan the image by a predefined amount.
        panUpCommand: function () {
            this._viewer.viewport.panBy(new Seadragon.Point(0, -this.panDistance / this._viewer.viewport.getZoom(true)), false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        // Pan the image by a predefined amount.
        panDownCommand: function () {
            this._viewer.viewport.panBy(new Seadragon.Point(0, this.panDistance / this._viewer.viewport.getZoom(true)), false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        goHomeCommand: function () {
            this._viewer.viewport.goHome(false);
            //if (this.applyConstraints)
                this._viewer.viewport.applyConstraints(true);
        },
        // Get a keyframe of the current state.
        captureKeyframe: function () {
            if (!this._viewer || !this._viewer.viewport) return "";
            var rect = this._viewer.viewport.getBounds();
            
            return {
                "state": {
                    "viewport": {
                        "region": {
                            "center": {
                                "x": rect.x,
                                "y": rect.y
                            },
                            "span": {
                                "x": rect.width,
                                "y": rect.height
                            }
                        }
                    }
                }
            };
        },

        _viewer: null,
        panDistance: 0.2,
        interactionControls: null,
        applyConstraints: true,
        isExplorable: true,
        viewportClampingOptions: { all: "all", letterbox: "letterbox", none: "none" },
        viewportClampingMode: "none"
    };

    rin.util.overrideProperties(DeepZoomES.prototypeOverrides, DeepZoomES.prototype);
    DeepZoomES.keyframeFormat = "<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Viewport_X='{0}' Viewport_Y='{1}' Viewport_Width='{2}' Viewport_Height='{3}'/>";
    DeepZoomES.elementHtml = "<div style='height:100%;width:100%;position:absolute;background:transparent;pointer-events:none;' tabindex='0'><div class='seadragonClip' style='height:100%;width:100%;position:absolute;background:transparent;left:0px;top:0px;overflow:hidden;pointer-events:auto;' tabindex='0'><div class='seadragonClipContents' style='height:333px;width:600px;position:absolute;'><div class='seadragonContainer' style='height:100%;width:100%;position:absolute;' tabindex='0'></div></div></div></div>";
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.DeepZoomExperienceStream", function (orchestrator, esData) { return new DeepZoomES(orchestrator, esData); });
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.ZoomableMediaExperienceStream", function (orchestrator, esData) { return new DeepZoomES(orchestrator, esData); });
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.ZoomableMediaExperienceStreamV2",
     function (orchestrator, esData) 
     { 
        var resourceUrl = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);
        if(rin.util.endsWith(resourceUrl, ".jpg") || rin.util.endsWith(resourceUrl, ".jpeg") || rin.util.endsWith(resourceUrl, ".png"))
        {
            var factoryFunction = rin.ext.getFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.ImageExperienceStream");
            return factoryFunction(orchestrator, esData);
        }
        else
        {
            return new DeepZoomES(orchestrator, esData); 
        }
     });    
})(rin);
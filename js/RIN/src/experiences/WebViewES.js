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

window.rin = window.rin || {};

(function (rin) {
    /*global $:true, ko:true*/
    "use strict";
    // ES for displaying web pages.
    var WebViewES = function (orchestrator, esData) {
        WebViewES.parentConstructor.apply(this, arguments);
        var self = this;
        this._orchestrator = orchestrator;
        this._userInterfaceControl = rin.util.createElementWithHtml(WebViewES.elementHTML).firstChild;
        this._iFrame = $("iframe", this._userInterfaceControl)[0]; // IFrame used to load the webpage
        this._controlDiv = $(".controlElement", this._userInterfaceControl)[0]; // Div sitting over the IFrame to intercept user interactions.
        this._esData = esData;
        this._url = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);
        this._cssPath = esData && esData.data && esData.data.cssPath;

        $(this._controlDiv).bind("mousedown", function () {
            self._controlDiv.style.display = "none"; // Remove the overlay div so that the user can interact with the web page.
            self._orchestrator.startInteractionMode();
        });
        $(this._controlDiv).bind("mousewheel", function () {
            self._controlDiv.style.display = "none"; // Remove the overlay div so that the user can interact with the web page.
            self._orchestrator.startInteractionMode();
        });
    };

    rin.util.extend(rin.contracts.DiscreteKeyframeESBase, WebViewES);

    WebViewES.prototypeOverrides = {
        // Load the ES and start loading the webpage.
        load: function () {
            if (!this._url)
                throw new Error("WebView source not found!");

            var self = this;
            this.setState(rin.contracts.experienceStreamState.buffering);

            // Load the page in the IFrame
            this._iFrame.onerror = function (source) {
                rin.internal.debug.write("error while loading iframe " + source);
                self.setState(rin.contracts.experienceStreamState.error);
                return true;
            };
            this._iFrame.src = this._url;
            this._iFrame.onload = function () {
                try {
                    if (self._cssPath) {
                        var css = document.createElement("link");
                        css.href = self._cssPath;
                        css.type = "text/css";
                        css.rel = "stylesheet";
                        var head = getHeadNode(self._iFrame.contentDocument);
                        head.appendChild(css);
                    }
                }
                catch (err) {
                    rin.internal.debug.write("error on iframe load " + err);
                }
                finally {
                    self.setState(rin.contracts.experienceStreamState.ready);
                }
            };
        },
        play: function () {
            // Add the overlay div back in place to monitor for interactions.
            this._controlDiv.style.display = "block";
        },
        pause: function () {
            // Add the overlay div back in place to monitor for interactions.
            this._controlDiv.style.display = "block";
        },
        _url: null
    };

    rin.util.overrideProperties(WebViewES.prototypeOverrides, WebViewES.prototype);
    WebViewES.elementHTML = "<div style='height:100%;width:100%;position:absolute;border:0px;'><iframe style='overflow:hidden;height:100%;width:100%;position:absolute;border:none;'></iframe><div class='controlElement' style='height:100%;width:100%;position:absolute;background-color:rgba(1,1,1,.001);'></div></div>";
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.WebViewExperienceStream", function (orchestrator, esData) { return new WebViewES(orchestrator, esData); });

    //Helper methods

    // Adds a node to the doc - To Do Optimize this for cross-browser and Win 8 standards.
    var addElement = function (doc, element, referenceNode, referenceType) {
        var refChild = referenceNode || doc.lastChild;
        if(referenceType === "before")
            doc.insertBefore(element, refChild);
        else
            refChild.parentNode.appendChild(element);
    },
    // Adds a node to the doc.
    createAndAddElement = function (doc, nodeName, attributes, referenceNode, referenceType) {
        var element = doc.createElement(nodeName),
            attrs = attributes || [],
            attributeName;
        for (attributeName in attrs) {
            if (attrs.hasOwnProperty(attributeName)) {
                element.setAttribute(attributeName, attrs[attributeName]);
            }
        }
        addElement(doc, element, referenceNode, referenceType);
        return element;
    },
    // Gets the first matching node by tag name or undefined.
    getFirstNodeByTagNameSafe = function (doc, nodeName) {
        var nodes = doc.getElementsByTagName(nodeName);
        return nodes && (nodes.length > 0 ? nodes[0] : undefined);
    },
    // Gets the body node or undefined.
    getBodyNode = function (doc) {
        var body = doc.body || getFirstNodeByTagNameSafe(doc, "body");
        return body;
    },
    // Gets the head node or undefined.
    getHeadNode = function (doc) {
        var head = doc.head || getFirstNodeByTagNameSafe(doc, "head") || createAndAddElement(doc, "head", null, getBodyNode(doc), "before");
        return head;
    };


})(window.rin);
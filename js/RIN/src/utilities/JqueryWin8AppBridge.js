/// <reference path="Common.js"/>
/// <reference path="../../../web/js/base.js" />

if (window.MSApp && WinJS && WinJS.xhr) {
    (function (rin) {
        "use strict";
        var RinXHR = function () {
            if (!(this instanceof RinXHR))
                return new RinXHR();
        };
        rin.util.extend(jQuery.ajaxSettings.xhr, RinXHR);
        RinXHR.prototypeOverrides = {
            open: function (type, url, async, username, password) {
                this._options = {
                    type: type,
                    url: url,
                    user: username,
                    password: password
                };
            },
            setRequestHeader: function (key, value) {
                if (!this._options.headers)
                    this._options.headers = {};
                this._options.headers[key] = value;
            },
            send: function (data) {
                var self = this,
                    //on complete or failure
                    completeOrFailure = function (response) {
                        var onreadystatechange = self.onreadystatechange;
                        rin.util.overrideProperties(response, self);
                        self.getAllResponseHeaders = function () { };
                        if (onreadystatechange) {
                            onreadystatechange();
                        }
                    };
                self._options.data = data;
                self._xhr = WinJS.xhr(self._options).then(completeOrFailure, completeOrFailure);
            },
            abort: function () {
                if (this._xhr) {
                    this._xhr.abort();
                }
            },
            _xhr: null,
            _options: null,
            onreadystatechange: null
        };
        rin.util.overrideProperties(RinXHR.prototypeOverrides, RinXHR.prototype);
        jQuery.ajaxSettings.xhr = RinXHR;
        jQuery.ajaxSettings.crossDomain = false;
    }(window.rin));
}
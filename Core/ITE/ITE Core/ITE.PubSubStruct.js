window.ITE = window.ITE || {};
ITE.PubSubStruct = function () {

	var callbackItems = {};
    this.subscribe = function (callback, id, context) {
        callbackItems[id || callback] = { callback: callback, context: context || this };
    };

    this.unsubscribe = function (id) {
        delete callbackItems[id];
     };

     this.publish = function (eventArgs, isAsync) {
        for (var id in callbackItems) {
            var callbackItem = callbackItems[id];
            if (isAsync) {
                (function (callbackItem) {
                    setTimeout(function () {callbackItem.callback.call(callbackItem.context, eventArgs);}, 0);})(callbackItem);
            }
            else {
                callbackItem.callback.call(callbackItem.context, eventArgs);
            }
        }
    };

    return this;
};
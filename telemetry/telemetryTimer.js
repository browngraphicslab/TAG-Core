TAG.Telemetry.Timer = (function () {

    var start_time = null;

    return {
        start : start,
        kill : kill
    };

    function start() {
        start_time = new Date().getTime() / 1000; //time in seconds since 1/1/1970
    }

    function kill() {
        return (new Date().getTime() / 1000) - start_time;
    }

})();
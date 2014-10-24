var TelemetryTimer = function () {

    this.start_time = new Date().getTime() / 1000;

    this.restart = function() {
        this.start_time = new Date().getTime() / 1000;
    }

    this.get_elapsed = function() {
        return (new Date().getTime() / 1000) - this.start_time;
    }

};
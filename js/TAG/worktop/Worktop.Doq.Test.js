TAG.Util.makeNamespace("Worktop.Doq.Test");

Worktop.Doq.Test = function () {
    //var doq = Worktop.Database.getDoqByGUID("guid");

    var doq;
    $.ajax({
        url: 'js/TAG/worktop/main_test.xml',
        dataType: "text",
        success: function (data) {
            doNothing(data);
            doq = new Worktop.Doq(data);
            run();
        }
    });

    this.getTagTest = function () {
        var $exhibitions = doq.getTags("Name");
        var $blorg = doq.getTags("Blorg");

        // Prints out all matching tag values and attributes
        $exhibitions.each(function (index, element) {
            doNothing("name ", index, ": ", $(element).text());
            doNothing("\t artist: ", $(element).attr("artist"));
        });

        doNothing("length of jQuery object with no matching tags: ", $blorg.length);
    };

    this.containsTagTest = function () {
        var validTag = doq.contains("Type");
        var invalidTag = doq.contains("BLORG");
        doNothing("doq contains 'Type' tag: ", validTag);
        doNothing("doq contains 'BLORG' tag: ", invalidTag);
    };

    this.getTagValueTest = function () {
        var validTags = [];
        for (var i = 0; i < 3; ++i) {
            validTags.push(doq.getTagValue("Name", i, "uh-oh not found"));
        }
        doNothing("valid tags: ", validTags);
        var invalidTag = doq.getTagValue("BLORG", 0, "not found");
        doNothing("invalid tag value: ", invalidTag);
    };

    // run all tests
    /*

    */
    var that = this;
    function run() {
        for (var method in that) {
            if (typeof that[method] == 'function') {
                doNothing(method);
                doNothing("----------------------");
                that[method]();
            }
        }
    }

}
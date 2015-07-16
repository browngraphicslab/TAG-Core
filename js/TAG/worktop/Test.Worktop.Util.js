TAG.Util.makeNamespace("Test.Worktop.Util");

Test.Worktop.Util = function () {
    var url = "main_test.xml";
    var doq = Worktop.Util.Doq('blah');
    var xml = $.ajax({
        type: "GET",
        url: "main_test.xml",
        dataType: "xml",
        success: function (xml) {
            doq = new Worktop.Util.Doq(xml);
        }
    });

    doNothing(xml);

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

    for (var method in this) {
        if (typeof this[method] == 'function') {
            doNothing(method);
            doNothing("----------------------");
            this[method]();
        }
    }
}

new Test.Worktop.Util();
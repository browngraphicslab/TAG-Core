TAG.Util.makeNamespace("TAG.Document.Doq");
TAG.Document.Doq = function (options) {
    options = TAG.Util.setToDefaults(options, TAG.Document.Doq.default_args);
    var DoqType = options.DoqType;
    var metaDict = options.metaDict;
    var xmlLocation = options.XMLLocation;

    this.metadataContains = function (str) {
        return metaDict.contains(str);
    };
    this.metadataSet = function (str, value) {
        metaDict.set(str, value);
    };
    this.metadataGet = function (str) {
        var toReturn = metaDict.get(str);
        if (!toReturn) toReturn = "Unknown";
        return toReturn;
    };
    this.metadataMatch = function (str, value) {
        return metaDict.match(str, value);
    };
    this.metadataGetKeys = function () {
        return metaDict.getKeys();
    };
    this.reload = function () {
        this = TAG.Document.DocFromXML(xmlLocation);
    };
    this.xmlLocation = function () {
        return xmlLocation;
    };

};

TAG.Document.Doq.DoqType = Object.freeze(
{
    EMPTY: { value: 0 },
    IMAGE: { value: 1 }
});

TAG.Document.Doq.default_args = (function () {
    md = new TAG.Document.Metadata.MetadataDict();
    md.type = TAG.Document.Doq.DoqType.EMPTY;
    return {
        MetaDict: md,
        XMLLocation: ""
    };
})();

TAG.Document.DocFromXML = function (url) {
    var xmlhttp = TAG.Util.makeXmlRequest(url);
    var xml = xmlhttp.responseXML;
    var nodes = xml.documentElement.querySelectorAll("DOQ,MetadataList");
    return new TAG.Document.Doq(
    {
        metaDict: TAG.Document.Metadata.MetadataDictFromXML(nodes[0]),
        XMLLocation:url
    });
};

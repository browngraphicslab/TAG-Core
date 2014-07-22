
module.exports = function (grunt) {
    'use strict';

    grunt.registerMultiTask('mergeJSON', 'Merges the JSON files', function () {

        function postProcess(mergedData) {
            if (mergedData.doNotOverride !== undefined) {
                delete mergedData.doNotOverride;
            }
            for (var prop in mergedData) {
                if (mergedData[prop] && typeof mergedData[prop] === "object") {
                    postProcess(mergedData[prop]);
                }
            }
            return mergedData;
        }

        // Replaces properties in 'toObject' with the ones in 'fromObject' but not add any extra.
        // If fromObject has special property "doNotCopy:bool" it will be ignored.
        // If toObject has a property called doNotCopy it will be summarily deleted!
        function overrideProperties(toObject, fromObject) {
            if (toObject.doNotCopy) {
                delete toObject.doNotCopy;
            }
            if (!toObject.doNotOverride && !fromObject.doNotCopy) {
                for (var prop in fromObject) {
                    if (toObject[prop] && typeof toObject[prop] === "object") {
                        overrideProperties(toObject[prop],fromObject[prop]);
                    }
                    else {
                        toObject[prop] = fromObject[prop];
                    }
                }
            }
            return toObject;
        }

        // Iterate over all src-dest file pairs.
        this.files.forEach(function (f) {

            // Concat specified files.
            var src = f.src.filter(function (filepath) {

                // Warn on and remove invalid source files (if nonull was set).
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }

            }).map(function (filepath) {
                // Read file source.
                var fileContents = grunt.file.read(filepath);

                // Convert to json
                var tempJsonData = JSON.parse(fileContents);

                return tempJsonData;

            }).reduce(overrideProperties);

            postProcess(src);

            // Write the destination file.
            grunt.file.write(f.dest, "[" + JSON.stringify(src[0], null, 4) + "]");

            // Print a success message.
            grunt.log.writeln('File "' + f.dest + '" created.');
        });
    });

};
#!/usr/bin/env node

'use strict';

process.title = 'grunt';

// Especially badass external libs.
var findup = require('findup-sync');
var resolve = require('resolve').sync;

// Internal libs.
var options = require('./node_modules/cli').options;
//var completion = require('../lib/completion');
var info = require('./node_modules/info');
var path = require('path');

var basedir = process.cwd();
var gruntpath;

// Do stuff based on CLI options.
if ('completion' in options) {
  completion.print(options.completion);
} else if (options.version) {
  info.version();
} else if (options.gruntfile) { //Note: if both `gruntfile` and `base` are set, use `gruntfile`
  basedir = path.resolve(path.dirname(options.gruntfile));
} else if (options.base) {
  basedir = path.resolve(options.base);
}

try {
  gruntpath = resolve('grunt', {basedir: basedir});
} catch (ex) {
  gruntpath = findup('lib/grunt.js');
  // No grunt install found!
  if (!gruntpath) {
    if (options.version) { process.exit(); }
    if (options.help) { info.help(); }
    info.fatal('Unable to find local grunt.', 99);
  }
}

// Everything looks good. Require local grunt and run it.
require(gruntpath).cli();
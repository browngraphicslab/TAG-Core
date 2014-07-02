module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: '\n/*************/\n'
      },
      dist: {
        src: ['ITE Core/ITE.Utils.js',
              'ITE Core/ITEManual/ITE.PubSubStruct.js',
              'ITE Core/ITEManual/ITE.TimeManager.js',
              //'ITE Core/ITEManual/ITE.TaskManager.js',
              'ITE Core/ITEManual/ITE.Orchestrator.js',
              'ITE Core/ITE.Player/ITE.Player.js',
              'ITE Core/ITEManual/ITE.ImageProvider.js',
              'ITE Core/ITEManual/ITE.ProviderInterfacePrototype.js'],
        dest: 'ITECore.js'
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['concat']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.registerTask('default', ['concat']);

};
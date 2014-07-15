module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: '\n/*************/\n'
      },
      dist: {
        src: ['ITE Core/Utils/ITE.Utils.js',
              'Dependencies/Hammer.js',
              'Dependencies/TimelineLite.min.js',

              'Dependencies/seadragon/src/Seadragon.Core.js',
              'Dependencies/seadragon/src/Seadragon.Config.js',
              'Dependencies/seadragon/src/Seadragon.Strings.js',
              'Dependencies/seadragon/src/Seadragon.Debug.js',
              'Dependencies/seadragon/src/Seadragon.Profiler.js',
              'Dependencies/seadragon/src/Seadragon.Point.js',
              'Dependencies/seadragon/src/Seadragon.Rect.js',
              'Dependencies/seadragon/src/Seadragon.Spring.js',
              'Dependencies/seadragon/src/Seadragon.Utils.js',
              'Dependencies/seadragon/src/Seadragon.MouseTracker.js',
              'Dependencies/seadragon/src/Seadragon.EventManager.js',
              'Dependencies/seadragon/src/Seadragon.ImageLoader.js',
              'Dependencies/seadragon/src/Seadragon.Buttons.js',
              'Dependencies/seadragon/src/Seadragon.TileSource.js',
              'Dependencies/seadragon/src/Seadragon.DisplayRect.js',
              'Dependencies/seadragon/src/Seadragon.DeepZoom.js',
              'Dependencies/seadragon/src/Seadragon.Viewport.js',
              'Dependencies/seadragon/src/Seadragon.Drawer.js',
              'Dependencies/seadragon/src/Seadragon.Viewer.js',

              'ITE Core/Utils/TAG.Util.js',
              'ITE Core/ITEManual/ITE.PubSubStruct.js',
              'ITE Core/ITEManual/ITE.ImageProvider.js',
              'ITE Core/ITEManual/ITE.DeepZoomProvider.js',
              'ITE Core/ITEManual/ITE.TimeManager.js',
              'ITE Core/ITEManual/ITE.TaskManager.js',
              'ITE Core/ITEManual/ITE.Orchestrator.js',
              'ITE Core/ITEManual/ITE.Player.js',
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
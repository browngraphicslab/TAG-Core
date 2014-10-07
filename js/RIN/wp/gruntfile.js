/*global module:true, require: true */

module.exports = function(grunt) {


    // Wordpress installation location (for now this is a fixed relative path and assumes
    // that wordpress has been installed in a a folder called "deepdive" that is a sibling
    // to the project root. We can make this more customizable later on if needed.
    var wproot = '../../deepdive/';

    // banners for JS and HTML
    var bannerTemplate = '<%= pkg.name %> | <%= pkg.homepage %> | <%= grunt.template.today("yyyy-mm-dd") %>',
        jsBanner = '/*! ' + bannerTemplate + ' */\n',
        htmlBanner = '<!-- ' + bannerTemplate + ' -->\n';

    // project configuration
    var config = {
        
        pkg: grunt.file.readJSON('package.json'),
        
        concat: { },
        
        jshint: {
            options: { 
                curly: true, eqeqeq: true, immed: true, latedef: true, newcap: true, noarg: true, sub: true, undef: true, boss: true, eqnull: true, browser: true,
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    Modernizr: true
                }
            },
            all: [
                'gruntfile.js'
            ]
        },

        less: { 
            theme: {
                files: {
                    // declaered below (so that we generate the filename dynamically)
                }
            }
        },

        clean: { },

        copy: {
            theme: {
                files: [
                    {
                        expand: true, 
                        src: ['gwlib/**'], 
                        dest: wproot + '/wp-content/themes/'
                    },
                    {
                        expand: true, 
                        src: ['herothemetrust/**'], 
                        dest: wproot + '/wp-content/themes/'
                    }
                ]
            },
        },
        
        cssmin: { },

        sprite: { },
        
        imagemin: { },

        watch: { 
            files: [
                'gruntfile.js',
                'gwlib/**',
                'gwlib-less/**',
                'herothemetrust/**'
            ],
            tasks: ['default']
        }
        
    };
    
    // add less options (doing it this way so that file key can be dynamic)
    config['less']['theme']['files'][wproot + '/wp-content/themes/gwlib/style.css'] = 'gwlib-less/style.less';
    config['less']['theme']['files'][wproot + '/wp-content/themes/gwlib/start.css'] = 'gwlib-less/start.less';

    // config    
    grunt.initConfig(config);

    // load plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-imagemin');

    // don't load this on windows (because of difficult installation of the package)
    if (require('os').platform() !== 'win32') {
        grunt.loadNpmTasks('grunt-spritesmith');
    }

    // sprite generation
    grunt.registerTask('images', ['sprite', 'imagemin']);
    
    // default task
    grunt.registerTask('default', [
        'copy',
        'less'
    ]);
    

};
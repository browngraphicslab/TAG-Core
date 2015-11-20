/*global module:true, require: true */

module.exports = function(grunt) {

    // load local grunt tasks and helpers
    grunt.loadTasks('tools/grunt/');

    // banners for JS and HTML
    var bannerTemplate = '<%= pkg.name %> | <%= pkg.homepage %> | <%= grunt.template.today("yyyy-mm-dd") %>',
        jsBanner = '/*! ' + bannerTemplate + ' */\n',
        jsCoreLicense =
        '/*!<%= grunt.util.linefeed %>' +
        ' * RIN Core JavaScript Library v1.0 <%= grunt.util.linefeed %>' +
        ' * http://research.microsoft.com/rin<%= grunt.util.linefeed %>' +
        ' *<%= grunt.util.linefeed %>' +
        ' * Copyright 2012-2013, Microsoft Research<%= grunt.util.linefeed %>' +
        ' * <placeholder for RIN License><%= grunt.util.linefeed %>' +
        ' *<%= grunt.util.linefeed %>' +
        ' * Date: <%= grunt.template.today("yyyy-mm-dd") %><%= grunt.util.linefeed %>' +
        ' */<%= grunt.util.linefeed %>',
        jsExperiencesLicense =
        '/*! <%= grunt.util.linefeed %>' +
        ' * RIN Experience Provider JavaScript Library v1.0<%= grunt.util.linefeed %>' +
        ' * http://research.microsoft.com/rin<%= grunt.util.linefeed %>' +
        ' *<%= grunt.util.linefeed %>' +
        ' * Copyright 2012-2013, Microsoft Research<%= grunt.util.linefeed %>' +
        ' * <placeholder for RIN License><%= grunt.util.linefeed %>' +
        ' *<%= grunt.util.linefeed %>' +
        ' * Date: <%= grunt.template.today("yyyy-mm-dd") %><%= grunt.util.linefeed %>' +
        ' */<%= grunt.util.linefeed %>',
        htmlBanner = '<!-- ' + bannerTemplate + ' -->\n';

    // generate a timestamped rin directory name for cdn deployment
    var rinTime = grunt.template.today('yyyy-mm-dd-HH-MM');

    // project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                banner: jsBanner
            },
            core: {
                src: [

                    // contracts
                    'src/contracts/IExperienceStream.js',
                    'src/contracts/IOrchestrator.js',
                    'src/contracts/DiscreteKeyframeESBase.js',
                    'src/contracts/InterpolatedKeyframeESBase.js',

                    // storyboard
                    'src/storyboard/BasicInterpolators.js',
                    'src/storyboard/nonLinearStoryboard.js',
                    'src/storyboard/trajectory.js',
                    'src/storyboard/ViewportInterpolator2D.js',

                    // embedded artifacts
                    'src/embededArtifacts/diagnostics.js',
                    'src/embededArtifacts/defaultBase2DGroupPolicy.js',
                    'src/embededArtifacts/defaultZoom2DItemPolicy.js',
                    'src/embededArtifacts/ambientAudioPolicy.js',
                    'src/embededArtifacts/layoutEngine.js',
                    'src/embededArtifacts/InteractionBehaviorService.js',
                    'src/embededArtifacts/artifactHost.js',
                    'src/embededArtifacts/embeddedArtifactsController.js',

                    // core functionality
                    'src/core/Common.js',
                    'src/core/ESItem.js',
                    'src/core/ESItemsManager.js',
                    'src/core/ESTimer.js',
                    'src/core/EventLogger.js',
                    'src/core/Orchestrator.js',
                    'src/core/OrchestratorProxy.js',
                    'src/core/Player.js',
                    'src/core/PlayerConfiguration.js',
                    'src/core/PlayerControl.js',
                    'src/core/ResourcesResolver.js',
                    'src/core/RinDataProxy.js',
                    'src/core/ScreenPlayInterpreter.js',
                    'src/core/StageAreaManager.js',
                    'src/core/TaskTimer.js',
                    'src/core/TransitionService.js',
                    'src/experiences/BufferingES.js',
                    'src/experiences/ESTimerES.js',
                    'src/experiences/PlaceholderES.js',
                    'src/experiences/PreloaderES.js',
                    'src/experiences/PlayerControllerES.js',

                    // default controller
                    'src/player/DefaultController.js',
                    'src/player/ControllerViewModel.js',

                    // xml and xrin helpers
                    'src/utilities/XmlHelper.js',
                    'src/utilities/SelfTest.js',
                    'src/utilities/RinDebugger.js'
                ],
                dest: 'web/lib/rin-core-1.0.js'
            },
            experiences: {
                src: [
                    'src/experiences/Namespace.js',

                    // experiences
                    'src/experiences/ImageES.js',
                    'src/experiences/DeepZoomES.js',
                    'src/experiences/VideoES.js',
                    'src/experiences/AudioES.js',
                    'src/experiences/MapES.js',
                    'src/experiences/PhotosynthES.js',
                    'src/experiences/PanoramicES.js',
                    'src/experiences/ContentBrowserES.js',
                    'src/experiences/OverlayES.js',
                    'src/experiences/InkES.js',
                    'src/experiences/WebViewES.js',
                    'src/experiences/RinES.js',
                    'src/experiences/LiteDiscreteES.js',
                    'src/experiences/LiteInterpolatedES.js',
                    'src/experiences/ImageCompareES.js',

                    // controls
                    'src/controls/PopupControl.js',

                    // interaction controls
                    'src/InteractionControls/CoreInteractionControlFactories.js',

                    // behaviors
                    'src/behaviors/PopupBehavior.js',

                    // embedded artifacts
                    'src/embededArtifacts/basicBehaviors.js',
                    'src/embededArtifacts/basicArtifacts.js',

                    // rin helper classes
                    'src/utilities/Gestures.js',
                    'src/utilities/JSONLoader.js',
                    'src/utilities/ESData.js'
                ],
                dest: 'web/lib/rin-experiences-1.0.js'
            },
            panoviewer: {
                options: {
                    // wrap output in an anonymous function
                    banner: jsBanner + '(function(){\n',
                    footer: '}());'
                },
                src: [
                    'panoviewer/src/renderer/Quirks.js',
                    'panoviewer/src/renderer/RendererCheckCSS3D.js',
                    'panoviewer/src/renderer/RendererCheckWebGL.js',
                    'panoviewer/src/math/*.js',
                    'panoviewer/src/common/Config.js',
                    'panoviewer/src/common/Utils.js',
                    'panoviewer/src/renderer/Renderer.js',
                    'panoviewer/src/renderer/RendererUtils.js',
                    'panoviewer/src/common/MemoryCache.js',
                    'panoviewer/src/common/DomainThrottle.js',
                    'panoviewer/src/common/PriorityNetworkDownloader.js',
                    'panoviewer/src/common/FloodFill.js',
                    'panoviewer/src/libs/CSSMatrix.js',
                    'panoviewer/src/renderer/RendererCSS3D.js',
                    'panoviewer/src/renderer/RendererWebGL.js',
                    'panoviewer/src/graphics/Viewport.js',
                    'panoviewer/src/graphics/PerspectiveCamera.js',
                    'panoviewer/src/common/ClassicSpring.js',
                    'panoviewer/src/common/SimpleSpline.js',
                    'panoviewer/src/viewer/RMLStore.js',
                    'panoviewer/src/common/BallisticPath.js',
                    'panoviewer/src/viewer/RotationalFixedPositionCameraController.js',
                    'panoviewer/src/viewer/TiledImagePyramid.js',
                    'panoviewer/src/viewer/TiledImagePyramidCoverageMap.js',
                    'panoviewer/src/viewer/TiledImagePyramidCuller.js',
                    'panoviewer/src/viewer/PhotosynthRml.js',
                    'panoviewer/src/viewer/Panorama.js',
                    'panoviewer/src/viewer/AttributionControlNoJQuery.js',
                    'panoviewer/src/viewer/GestureHelper.js',
                    'panoviewer/src/viewer/PanoTouchHelper.js',
                    'panoviewer/src/viewer/RWWViewer.js'
                ],
                dest: 'web/lib/pano-viewer.js'
            },
            rinStyles: {
                src: ['web/systemResources/themeResources/**/*.part.css'],
                dest: 'web/systemResources/themeResources/rin.css'
            }
        },
        concatTmpl: {
            options: {
                banner: htmlBanner
            },
            rin: {
                src: ['web/systemResources/themeResources/**/*.tmpl.htm'],
                dest: 'web/systemResources/themeResources/rinTemplates.htm'
            }
        },
        // jshint: {
        //     // js hint
        //     options: {
        //         curly: false,
        //         eqeqeq: true,
        //         immed: true,
        //         latedef: true,
        //         newcap: true,
        //         noarg: true,
        //         sub: true,
        //         undef: true,
        //         boss: true,
        //         eqnull: true,
        //         browser: true,
        //         loopfunc: true,
        //         laxbreak: true,
        //         laxcomma: true,
        //         globals: {
        //             jQuery: true,
        //             console: true,
        //             module: true,
        //             rin: true,
        //             Backbone: true,
        //             _: true,
        //             PxLoader: true,
        //             PxLoaderVideo: true,
        //             Video: true,
        //             THREE: true,
        //             Stats: true,
        //             Modernizr: true,
        //             i18n: true
        //         }
        //     },
        //     all: [
        //         'Gruntfile.js',
        //         'tools/grunt/*.js',

        //         // opting in for new or revised files
        //         'panoviewer/src/common/MemoryCache.js',
        //         'panoviewer/src/viewer/PanoTouchHelper.js',
        //         'src/experiences/ImageCompareES.js',
        //         'web/narratives/imagecompare/narrative.js'

        //         // TODO: enable JSHint for RIN sources
        //         , '<%= concat.core.src %>'
        //         , '<%= concat.experiences.src %>'
        //     ],

        //     // TODO: fix mixed tabs/spaces and merge with section above
        //     ignoreMixedTabsAndSpaces: {
        //         options: { smarttabs: true },
        //         files: {
        //             src: [
        //                 'web/narratives/everest3m/**/*.js'
        //             ]
        //         }
        //     }
        // },
        uglify: {
            core: {
                options: {
                    banner: jsBanner + jsCoreLicense
                },
                files: {
                    '<%= concat.core.dest %>': ['<%= concat.core.dest %>']
                }
            },
            experiences: {
                options: {
                    banner: jsBanner + jsExperiencesLicense
                },
                files: {
                    '<%= concat.experiences.dest %>': ['<%= concat.experiences.dest %>']
                }
            },
            helperLibs: {
                options: {
                    banner: jsBanner
                },
                files: {
                    '<%= concat.panoviewer.dest %>': ['<%= concat.panoviewer.dest %>']
                }
            }
        },
        clean: {
            sdk: [
                'sdk-archives/rin-sdk/',
                'sdk-archives/rin-sdk-Azure/'
            ]
        },
        copy: {
            sdk: {
                files: [
                    {
                        expand: true,
                        cwd: 'doc/',
                        src: [
                            //Documentation
                            'RIN JavaScript Player Documentation.docx',
                            'RIN JavaScript SDK Documentation.docx'
                        ],
                        dest: 'sdk-archives/rin-sdk/doc/'
                    },
                    {
                        expand: true,
                        cwd: 'web/lib/',
                        src: [
                            //Required Libraries
                            'jquery.easing.1.3.js',
                            'jquery.pxtouch.min.js',
                            'pano-viewer.js',
                            'seadragon-0.8.9-rin.js',
                            'rin-core-1.0.js',
                            'rin-experiences-1.0.js'
                        ],
                        dest: 'sdk-archives/rin-sdk/web/lib/'
                    },
                    {
                        // System Resources
                        expand: true,
                        cwd: 'web/systemResources/',
                        src: [ '**' ],
                        dest: 'sdk-archives/rin-sdk/web/systemResources/'
                    },
                    {
                        // Sample Html files
                        expand: true,
                        cwd: 'web/sdkFiles',
                        src: [ '**[!Azure*]' ],
                        dest: 'sdk-archives/rin-sdk/web/'
                    },
                    {
                        // Sample Experiences
                        expand: true,
                        cwd: 'web/lib/',
                        src: [
                            'HelloWorldExperience.js',
                            'SampleImageES.js'
                        ],
                        dest: 'sdk-archives/rin-sdk/web/lib/'
                    },
                    {
                        // Sample narratives
                        expand: true,
                        cwd: 'web/narratives/',
                        src: [
                            'lite/**',
                            'sample/**'
                        ],
                        dest: 'sdk-archives/rin-sdk/web/narratives/'
                    },

                    //Azure Version
                    {
                        expand: true,
                        cwd: 'doc/',
                        src: [
                            //Documentation
                            'RIN JavaScript Player Documentation.docx',
                            'RIN JavaScript SDK Documentation.docx'
                        ],
                        dest: 'sdk-archives/rin-sdk-Azure/doc/'
                    },
                    {
                        // Sample Html files
                        expand: true,
                        cwd: 'web/sdkFiles/Azure',
                        src: [ '**' ],
                        dest: 'sdk-archives/rin-sdk-Azure/web/'
                    },
                    {
                        // Sample Experiences
                        expand: true,
                        cwd: 'web/lib/',
                        src: [
                            'HelloWorldExperience.js',
                            'SampleImageES.js'
                        ],
                        dest: 'sdk-archives/rin-sdk-Azure/web/lib/'
                    },
                    {
                        // Sample narratives
                        expand: true,
                        cwd: 'web/narratives/',
                        src: [
                            'lite/**',
                            'sample/**'
                        ],
                        dest: 'sdk-archives/rin-sdk-Azure/web/narratives/'
                    }
                ]
            }
        },
        cssmin: {
            rin: {
                src: '<%= concat.rinStyles.dest %>',
                dest: '<%= concat.rinStyles.dest %>'
            }
        },
        compress:{
            sdk: {
                options: {
                    archive: 'sdk-archives/rin-sdk.zip'
                },
                files: [
                  {
                      expand: true,
                      cwd: 'sdk-archives/rin-sdk/',
                      src: ['**']
                  }
                ]
            },
            sdkAzure: {
                options: {
                    archive: 'sdk-archives/rin-sdk-Azure.zip'
                },
                files: [
                  {
                      expand: true,
                      cwd: 'sdk-archives/rin-sdk-Azure/',
                      src: ['**']
                  }
                ]
            }
        },
        qunit: {
            options: {
                // some tests take longer than 5 sec default
                timeout: 30 * 1000,
                verbose: true
            },
            all: {
                options: {
                    urls: [
                        'http://localhost:8000/tests/RINUnitTests.html'
                    ]
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 8000,
                    base: 'web'
                }
            }
        },
        watch: {
            files: [
                'Gruntfile.js',
                '<%= concat.core.src %>',
                '<%= concat.experiences.src %>',
                '<%= concat.panoviewer.src %>',
                'web/systemResources/themeResources/**/*.part.css'
            ],
            tasks: ['default']
        }
    });

    // log each QUnit test as it is run
    var currentModule, currentTest;
    grunt.event.on('qunit.begin', function() {
        grunt.log.writeln('');
        grunt.log.write('.');
    });
    grunt.event.on('qunit.moduleStart', function(name) {
        currentModule = name;
    });
    grunt.event.on('qunit.testStart', function(name) {
        currentTest = (currentModule ? currentModule + ': ' : '') + name;
        grunt.log.writeln(currentTest);
    });

    // load plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jst');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-compress');
    
    grunt.registerTask('default', [
        // 'jshint',
        'concat:core',
        'concat:experiences',
        'concat:panoviewer',
        'concat:rinStyles',
        'concatTmpl:rin'
    ]);

    // ship version with minified sources
    grunt.registerTask('ship', [
        'default',
        'uglify',
        'cssmin',
        'test'
    ]);

    grunt.registerTask('test', ['connect', 'qunit']);

    // sdk shipping
    grunt.registerTask('sdk-ship', [
        'default',
        'clean:sdk', //Remove the temporary directory
        'uglify',
        'cssmin',
        'test',
        'copy:sdk',
        'compress:sdk',
        'compress:sdkAzure',
        'clean:sdk' //Remove the temporary directory
    ]);
};
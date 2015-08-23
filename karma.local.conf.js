module.exports = function(config) {
    config.set({
        //logLevel: 'LOG_DEBUG',

        reporters: ['spec', 'coverage'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun : true,

        autoWatch : false,

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        port: 9876,

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: [
            'mocha',
            'browserify'
        ],

        files: [
            'src/**/*.js',
            'test/**/test*.js'
        ],

        // list of files to exclude
        exclude: [],

        preprocessors: {
            'test/**/test*.js': ['browserify'],
            'src/**/*.js': ['browserify', 'coverage']
        },

        coverageReporter: {
            reporters: [
                { type: 'html' },
                { type: 'lcovonly' }
            ],
            instrumenters: { isparta : require('isparta') },
            instrumenter: {
                '**/*.js': 'isparta'
            }
        },

        browserify: {
            debug: true,
            transform: [
                [
                    'babelify', {plugins: ['babel-plugin-espower']}
                ]
            ]
        },

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: [
            'PhantomJS'//, 'Firefox'
        ]

    });
};

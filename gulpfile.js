// gulpfile.js
// Heavily inspired by Mike Valstar's solution:
//   http://mikevalstar.com/post/fast-gulp-browserify-babelify-watchify-react-build/
//
// npyl: patched for multiple configs & removed coffeeify
"use strict";

var     babelify   = require('babelify'),
        browserify = require('browserify'),
        buffer     = require('vinyl-buffer'),
        gulp       = require('gulp'),
        livereload = require('gulp-livereload'),
        merge      = require('merge'),
        rename     = require('gulp-rename'),
        source     = require('vinyl-source-stream'),
        watchify   = require('watchify');
const regeneratorRuntime = require("regenerator-runtime");  // for await, async support

var streaming_client_config = {
    js: {
        src: './src/_browserify/_streaming-client.js',  // Entry point
        outputDir: './src/scripts',                     // Directory to save bundle to
        outputFile: 'streaming-client.js'               // Name to use for bundle
    },
}

var microphone_stream_config = {
    js: {
        src: './src/_browserify/_console-microphone.js',// Entry point
        outputDir: './src/scripts',                     // Directory to save bundle to
        outputFile: 'console-microphone.js'             // Name to use for bundle
    },
}

// configs array
var configs = [streaming_client_config, microphone_stream_config]

// This method makes it easy to use common bundling options in different tasks
function bundle (bundler, config) {

    // Add options to add to "base" bundler passed as parameter
    bundler
      .bundle()                                                     // Start bundle
      .pipe(source(config.js.src))                                  // Entry point
      .pipe(buffer())                                               // Convert to gulp pipeline
      .pipe(rename(config.js.outputFile))                           // Rename output from 'main.js'
                                                                    //   to 'bundle.js'
      .pipe(gulp.dest(config.js.outputDir))                         // Save 'bundle' to build/
      .pipe(livereload());                                          // Reload browser if relevant
}

gulp.task('bundle', function () {

    // for each config
    configs.forEach(function(config) {
        var bundler = browserify(config.js.src).transform(babelify, { 
            presets: [[ '@babel/preset-env' ]],
            plugins: [[ '@babel/transform-runtime', { regenerator: true }]]
        });
        bundle(bundler, config);
    });

    return new Promise(function(resolve, reject) {
        console.log("HTTP Server Started");
        resolve();
    });
})
(function(root) {
    "use strict";

    //
    // Imports
    //
    var fs = require("fs");
    var gulp = require("gulp");
    var eslint = require("gulp-eslint");
    var uglify = require("gulp-uglify");
    var mocha = require("gulp-spawn-mocha");
    var rename = require("gulp-rename");
    var karma = require("karma").server;
    var path = require("path");
    var bower = require("gulp-bower");
    var mergeJson = require("gulp-merge-json");
    var concat = require("gulp-concat");
    var debug = require("gulp-debug");
    var es = require("event-stream");

    //
    // Constants
    //
    var SOURCE_FILES = [
        "data/headers.js",
        "data/hostnames.js",
        "data/multi-headers.js",
        "src/cdn-detector.js"
    ];

    //
    // Task Definitions
    //
    gulp.task("lint", function() {
        return gulp.src(["*.js", "src/*.js", "test/*.js"])
            .pipe(eslint())
            .pipe(eslint.format());
    });

    gulp.task("merge-json", function(cb) {
        return es.merge(
            gulp.src("data/headers.json")
                .pipe(mergeJson("headers.js", false, [], false, "var CdnDetectorHeaders"))
                .pipe(gulp.dest("./data")),

            gulp.src("data/hostnames.json")
                .pipe(mergeJson("hostnames.js", false, false, false, "var CdnDetectorHostnames"))
                .pipe(gulp.dest("./data")),

            gulp.src("data/multi-headers.json")
                .pipe(mergeJson("multi-headers.js", false, [], false, "var CdnDetectorMultiHeaders"))
                .pipe(gulp.dest("./data"))
        );
    });

    gulp.task("dist", ["merge-json"], function() {
        return gulp.src(SOURCE_FILES)
            .pipe(debug())
            .pipe(concat("cdn-detector.js"))
            .pipe(gulp.dest("dist"));
    });

    gulp.task("compress", ["merge-json"], function() {
        return gulp.src(SOURCE_FILES)
            .pipe(concat("cdn-detector.min.js"))
            .pipe(uglify({ mangle: true }))
            .pipe(gulp.dest("dist"));
    });

    gulp.task("mocha", function() {
        return gulp.src("test/test.js",
            {
                read: false
            })
            .pipe(mocha());
    });

    gulp.task("mocha-tap", ["mocha"], function() {
        return gulp.src(
            "test/test.js",
            {
                read: false
            })
            .pipe(mocha({
                reporter: "tap",
                output: "./test/mocha.tap"
            }));
    });

    gulp.task("bower", function() {
        return bower();
    });

    gulp.task("karma", ["bower", "mocha", "mocha-tap", "dist", "compress"], function(done) {
        return karma.start({
            configFile: path.join(__dirname, "karma.config.js"),
            singleRun: true
        }, done);
    });

    gulp.task("all", ["default"]);
    gulp.task("test", ["mocha", "mocha-tap", "karma"]);
    gulp.task("default", ["bower", "lint", "merge-json", "dist", "compress", "test"]);
    gulp.task("travis", ["default"]);
}());

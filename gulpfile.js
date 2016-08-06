var gulp = require('gulp'),
    util = require('gulp-util'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    sourcemaps = require('gulp-sourcemaps');

gulp.task('copy', function () {
    return gulp.src('src/validation.js')
        .pipe(gulp.dest('dist'));
});

gulp.task('min', ['copy'], function (cb) {
    return gulp.src('dist/validation.js')
        .pipe(sourcemaps.init())
        .pipe(uglify({
            preserveComments: 'license'
        }).on('error', util.log))
        .pipe(rename('validation.min.js'))
        .pipe(sourcemaps.write('/'))
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['min']);

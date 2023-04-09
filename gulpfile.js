var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var log = require('gulplog');
var rename = require('gulp-rename');
var htmlmin = require('gulp-htmlmin');
var csso = require('gulp-csso');
var autoprefixer = require('gulp-autoprefixer');
var through = require('through');

var isDist = process.argv.indexOf('serve') === -1;


gulp.task('copy-resources', function() {
    gulp.src('./dev/scripts/*.js').pipe(gulp.dest('./scripts'));
});

gulp.task('css', function () {
    return gulp.src('dev/styles/index.css')
    .pipe(isDist ? csso() : through())
    .pipe(isDist ? autoprefixer('last 2 versions', { map: false }) : through())
    .pipe(rename('index.min.css'))
    .pipe(gulp.dest('stylesheets/'));
});

gulp.task('js-index', function () {
    var b = browserify({
      entries: 'dev/scripts/index.js',
      debug: true
    });
  
    return b.bundle()
      .pipe(source('dev/scripts/index.js'))
      .pipe(buffer())
      .pipe(isDist ? uglify() : through())
        .on('error', log.error)
      .pipe(rename('index.min.js'))
      .pipe(gulp.dest('scripts/'));
});



gulp.task('css-watch', ['css'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('js-guess-watch', ['js-guess'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('js-index-watch', ['js-index'], function (done) {
    browserSync.reload();
    done();
});


gulp.task('js', ['js-index']);


gulp.task('html', function () {

    return gulp.src('dev/*.html')
        .pipe(isDist ? htmlmin({collapseWhitespace: true}) : through())
        .pipe(gulp.dest('./'));
});

gulp.task('html-watch', ['html'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('serve', function () {

    browserSync.init({
        server: {
            baseDir: "./"
        }
    });

    gulp.watch('dev/*.html', ['html-watch']);

    gulp.watch('dev/styles/index.css', ['css-watch']);
    gulp.watch('dev/scripts/index.js', ['js-index-watch']);
});

gulp.task('default', ['html', 'js', 'css', 'copy-resources']);
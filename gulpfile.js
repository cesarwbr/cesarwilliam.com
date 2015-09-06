'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync');
var cp = require('child_process');
var config = require('./gulp.config')();
var gulpsync = require('gulp-sync')(gulp);
var deploy = require('gulp-gh-pages');

var $ = require('gulp-load-plugins')({
    lazy: true
});

gulp.task('deploy', ['build-site'], function () {
    return gulp.src('. / _site /**/ * ')
        .pipe(deploy());
});

/**
 * Show help with main and sub tasks
 */
gulp.task('help', $.taskListing);

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    log('Jekyll building...');
    browserSync.notify('reloading now...');
    return cp.spawn('jekyll', ['build'], {
            stdio: 'inherit'
        })
        .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    log('Jekyll rebuilding...');
    browserSync.reload();
});

gulp.task('build-site', gulpsync.sync(['jade', 'jekyll-build',
    'build-assets',
    'wiredep'
]));

gulp.task('build-assets', ['styles', 'images', 'js']);

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['build-site'], function () {
    log('Synchronizing File System --> Browser');
    browserSync({
        server: {
            baseDir: config.site
        }
    });
});

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('styles', function () {
    log('Compiling SASS --> CSS');

    return gulp.src(config.sass + '**/*.scss')
        .pipe($.plumber())
        .pipe($.sass().on('error', $.sass.logError))
        .pipe($.autoprefixer(['last 15 versions', '> 1%', 'ie 8',
            'ie 7'
        ], {
            cascade: true
        }))
        .pipe(gulp.dest(config.css));

});

gulp.task('images', function () {
    log('Reducing images...');
    // TODO reduce images
    return gulp.src(config.largeImg + '**')
        .pipe(gulp.dest(config.img));
});

gulp.task('js', function () {
    return gulp.src(config.javascript + '**')
        .pipe(gulp.dest(config.js));
});

gulp.task('wiredep', function () {
    log('Wire up the bower css js and our app js into the html');
    var options = config.getWiredepDefaultOptions();
    var wiredep = require('wiredep').stream;

    return gulp
        .src(config.index)
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.css + '/**/*.css'), {
            relative: true
        }))
        .pipe($.inject(gulp.src(config.js + '/**/*.js'), {
            relative: true
        }))
        .pipe(gulp.dest(config.site));
});

/**
 * Compile Jade files
 */
gulp.task('jade', function () {
    return gulp.src(config.jade + '*.jade')
        .pipe($.jade())
        .pipe(gulp.dest(config.includes));
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch(config.sass + '**', ['styles', browserSync.reload]);
    gulp.watch(['index.html', config.layouts + '*.html',
        config.includes + '*'
    ], [
        'build-site'
    ]);
    gulp.watch(config.jade + '*.jade', ['jade']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);

///////////////////
function log(msg) {
    if (typeof (msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}

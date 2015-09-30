/**
 * Check if tis is ok
 */

var gulp = require('gulp');
var browserSync = require('browser-sync');
var cp = require('child_process');
var config = require('./gulp.config')();
var helper = require('./gulp.helper')();
var gulpsync = require('gulp-sync')(gulp);
var deploy = require('gulp-gh-pages');

var $_ = require('gulp-load-plugins')({
    lazy: true
});

// Deploy to server
gulp.task('deploy', ['build-site'], function () {
    return gulp.src('./_site/**/*')
        .pipe(deploy());
});

/**
 * Show help with main and sub tasks
 */
gulp.task('help', $_.taskListing);

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    helper.log('Jekyll building...');
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
    helper.log('Jekyll rebuilding...');
    browserSync.reload();
});

gulp.task('build-site', gulpsync.sync(['jade', 'jekyll-build',
    'build-assets',
    'optimize'
]));

gulp.task('build-assets', ['styles', 'images', 'js']);

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['build-site'], function () {
    helper.log('Synchronizing File System --> Browser');
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
    helper.log('Compiling SASS --> CSS');

    return gulp.src(config.sass + '**/*.scss')
        .pipe($_.plumber())
        .pipe($_.sass().on('error', $_.sass.logError))
        .pipe($_.autoprefixer(['last 15 versions', '> 1%', 'ie 8',
            'ie 7'
        ], {
            cascade: true
        }))
        .pipe(gulp.dest(config.css));

});

gulp.task('images', function () {
    helper.log('Reducing images...');

    return gulp.src(config.largeImg + '**')
        .pipe($_.imagemin({
            optimizationLevel: 4
        }))
        .pipe(gulp.dest(config.img));
});

gulp.task('js', function () {
    helper.log('Copy all js files');
    return gulp.src(config.javascript + '**')
        .pipe(gulp.dest(config.js));
});

gulp.task('inject', function () {
    helper.log('Wire up the bower css js and our app js into the html');
    var options = config.getWiredepDefaultOptions();
    var wiredep = require('wiredep').stream;

    return gulp
        .src(config.index)
        .pipe(wiredep(options))
        .pipe($_.inject(gulp.src(config.css + '/**/*.css'), {
            relative: true
        }))
        .pipe($_.inject(gulp.src(config.js + '/**/*.js'), {
            relative: true
        }))
        .pipe(gulp.dest(config.site));
});

/**
 * Compile Jade files
 */
gulp.task('jade', function () {
    return gulp.src(config.jade + '*.jade')
        .pipe($_.jade())
        .pipe(gulp.dest(config.includes));
});

gulp.task('optimize', ['styles', 'images', 'js', 'inject'], function optimize() {
    helper.log('Optimizing the javascript, css, html');
    var assets = $_.useref.assets({
        searchPath: config.site
    });

    var cssFilter = $_.filter('**/*.css', {
        restore: true
    });

    var jsLibFilter = $_.filter('**/' + config.optimized.lib, {
        restore: true
    });
    var jsAppFilter = $_.filter('**/' + config.optimized.app, {
        restore: true
    });

    return gulp
        .src(config.index)
        .pipe(assets)
        // css
        .pipe(cssFilter) // filter css
        .pipe($_.csso()) // sso
        .pipe(cssFilter.restore) // css filter restore
        // js lib
        .pipe(jsLibFilter) // filter js
        .pipe($_.uglify()) // uglify
        .pipe(jsLibFilter.restore) // js filter restore
        // js app
        .pipe(jsAppFilter)
        .pipe($_.uglify())
        .pipe(jsAppFilter.restore)
        // take care of revision and replace name
        .pipe($_.rev()) // set revision number for js and css
        .pipe(assets.restore()) // restore assets
        .pipe($_.useref()) // in html replace all files with defined comment Eg.: assets/css/app.css
        .pipe($_.revReplace()) // in html replace the Eg.: app.css with the version
        .pipe(gulp.dest(config.site));
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

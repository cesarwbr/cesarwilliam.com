'use strict';

module.exports = function () {
    var site = './_site/';
    var assets = './assets/';
    var layouts = './_layouts/';

    var config = {
        // Build
        site: site,
        css: site + 'assets/css/',
        index: site + 'index.html',
        // Source
        assets: assets,
        sass: assets + 'css/',
        jade: '_jadefiles/',
        includes: '_includes/',
        layouts: layouts,
        defaultLayout: layouts + 'default.html',
        /**
         * Bower and NPM locations
         */
        bower: {
            json: require('./bower.json'),
            directory: './bower_components',
            ignorePath: '..'
        },
        packages: [
            './package.json',
            './bower.json'
        ]

    };

    config.getWiredepDefaultOptions = function () {
        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath,
            cwd: layouts
        };
        return options;
    };

    return config;
};

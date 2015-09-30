var $_ = require('gulp-load-plugins')({
    lazy: true
});

module.exports = function () {
    var log = function (msg) {
        if (typeof (msg) === 'object') {
            for (var item in msg) {
                if (msg.hasOwnProperty(item)) {
                    $_.util.log($_.util.colors.blue(msg[item]));
                }
            }
        } else {
            $_.util.log($_.util.colors.blue(msg));
        }
    };

    return {
        log: log
    };
};

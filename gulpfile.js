var gulp = require('gulp');
var replace = require('gulp-replace');
var uglify = require('gulp-uglifyjs');

gulp.task('default', function() {
    gulp.src('declarative-view.js')
        .pipe(replace('var _DEV_ = true;', ''))
        .pipe(uglify('declarative-view.min.js', {
            mangle: true,
            compress: {
                global_defs: {
                    '_DEV_': false
                },
                unused: true
            }
        }))
        .pipe(gulp.dest('./'))
    ;
});
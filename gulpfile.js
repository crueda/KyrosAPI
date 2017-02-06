var gulp = require('gulp');
var scp = require('gulp-scp');
var notify = require('gulp-notify');
var rsync = require("rsyncwrapper");
var gutil = require('gulp-util');
var apidoc = require('gulp-apidoc');
var markdown = require('gulp-markdown');
var runSequence = require('run-sequence');
var rename = require("gulp-rename");
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');


gulp.task('default', function() {
  // place code for your default task here
});


// --------------------------------------------------------------------------------
// Actualizar en produccion
// --------------------------------------------------------------------------------
gulp.task('pro', ['upload-app-pro', 'upload-properties-pro', 'upload-appjs-pro'], function() {
  console.log('Actualizado el entorno de producción!');
});

gulp.task('pro-doc', ['apidoc', 'gen-changelog'], function() {
  rsync({
    ssh: true,
    src: '/Applications/MAMP/htdocs/dockyrosapi',
    dest: 'root@172.26.7.3:/var/www/html/dockyrosapi',
    recursive: true,
    syncDest: true,
    args: ['--verbose']
  }, function(error, stdout, stderr, cmd) {
      gutil.log(stdout);
  });
});

// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// Subir ficheros a produccion
// --------------------------------------------------------------------------------
gulp.task('upload-app-pro', function() {
  rsync({
    ssh: true,
    src: '/Users/Carlos/Workspace/Kyros/KyrosAPI/app',
    dest: 'root@192.168.28.251:/opt/KyrosAPI/',
    recursive: true,
    syncDest: true,
    args: ['--verbose']
  }, function(error, stdout, stderr, cmd) {
      gutil.log(stdout);
  });
});

gulp.task('upload-properties-pro', function () {
    gulp.src('/Users/Carlos/Workspace/Kyros/KyrosAPI/kyrosapi.properties')
        .pipe(scp({
            host: '192.168.28.251',
            user: 'root',
            port: 22,
            path: '/opt/KyrosAPI'
        }));
});

gulp.task('upload-appjs-pro', function () {
    gulp.src('/Users/Carlos/Workspace/Kyros/KyrosAPI/api.js')
        .pipe(scp({
            host: '192.168.28.251',
            user: 'root',
            port: 22,
            path: '/opt/KyrosAPI'
        }));
});



// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// Generacion del la apidoc
// --------------------------------------------------------------------------------
gulp.task('apidoc',function(done){
  apidoc({
      src: "/Users/Carlos/Workspace/Kyros/KyrosAPI/app/routes/",
        dest: "/Applications/MAMP/htdocs/dockyrosapi",
        debug: true,
        includeFilters: [ ".*\\.js$" ]
      },done);
});
// --------------------------------------------------------------------------------


// --------------------------------------------------------------------------------
// Generacion del changelog
// --------------------------------------------------------------------------------
gulp.task('gen-changelog', function () {
    return gulp.src('/Users/Carlos/Workspace/Kyros/KyrosAPI/CHANGELOG.md')
        .pipe(markdown())
        .pipe(gulp.dest('/Applications/MAMP/htdocs/dockyrosapi'))
        .pipe(gulp.src("/Applications/MAMP/htdocs/dockyrosapi/changelog.html"));

});

// --------------------------------------------------------------------------------



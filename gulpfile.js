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
// Actualizar en demos
// --------------------------------------------------------------------------------
//gulp.task('demos', ['upload-app-demos', 'upload-properties-demos', 'upload-appjs-demos'], function() {
gulp.task('demos', ['upload-app-demos', 'upload-appjs-demos'], function() {
  console.log('Actualizado el entorno de demos!');
});


// --------------------------------------------------------------------------------
// Actualizar en produccion
// --------------------------------------------------------------------------------
//gulp.task('pro1', ['upload-app-pro1', 'upload-properties-pro1', 'upload-appjs-pro1'], function() {
gulp.task('pro1', ['upload-app-pro1', 'upload-appjs-pro1'], function() {
  console.log('Actualizado el entorno de producción 1 !');
});

//gulp.task('pro2', ['upload-app-pro2', 'upload-properties-pro2', 'upload-appjs-pro2'], function() {
gulp.task('pro2', ['upload-app-pro2', 'upload-appjs-pro2'], function() {
  console.log('Actualizado el entorno de producción 2 !');
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
// Subir ficheros a demos
// --------------------------------------------------------------------------------
gulp.task('upload-app-demos', function() {
  rsync({
    ssh: true,
    src: '/Users/Carlos/Workspace/Kyros/KyrosAPI/app',
    dest: 'root@192.168.28.244:/opt/KyrosAPI/',
    recursive: true,
    syncDest: true,
    args: ['--verbose']
  }, function(error, stdout, stderr, cmd) {
      gutil.log(stdout);
  });
});

gulp.task('upload-properties-demos', function () {
    gulp.src('/Users/Carlos/Workspace/Kyros/KyrosAPI/kyrosapi.properties')
        .pipe(scp({
            host: '192.168.28.244',
            user: 'root',
            port: 22,
            path: '/opt/KyrosAPI'
        }));
});

gulp.task('upload-appjs-demos', function () {
    gulp.src('/Users/Carlos/Workspace/Kyros/KyrosAPI/api.js')
        .pipe(scp({
            host: '192.168.28.244',
            user: 'root',
            port: 22,
            path: '/opt/KyrosAPI'
        }));
});


// --------------------------------------------------------------------------------
// Subir ficheros a produccion
// --------------------------------------------------------------------------------
gulp.task('upload-app-pro1', function() {
  rsync({
    ssh: true,
    src: '/Users/Carlos/Workspace/Kyros/KyrosAPI/app',
    dest: 'root@192.168.28.136:/opt/KyrosAPI/',
    recursive: true,
    syncDest: true,
    args: ['--verbose']
  }, function(error, stdout, stderr, cmd) {
      gutil.log(stdout);
  });
});

gulp.task('upload-properties-pro1', function () {
    gulp.src('/Users/Carlos/Workspace/Kyros/KyrosAPI/kyrosapi.properties')
        .pipe(scp({
            host: '192.168.28.136',
            user: 'root',
            port: 22,
            path: '/opt/KyrosAPI'
        }));
});

gulp.task('upload-appjs-pro1', function () {
    gulp.src('/Users/Carlos/Workspace/Kyros/KyrosAPI/api.js')
        .pipe(scp({
            host: '192.168.28.136',
            user: 'root',
            port: 22,
            path: '/opt/KyrosAPI'
        }));
});

gulp.task('upload-app-pro2', function() {
  rsync({
    ssh: true,
    src: '/Users/Carlos/Workspace/Kyros/KyrosAPI/app',
    dest: 'root@192.168.28.137:/opt/KyrosAPI/',
    recursive: true,
    syncDest: true,
    args: ['--verbose']
  }, function(error, stdout, stderr, cmd) {
      gutil.log(stdout);
  });
});

gulp.task('upload-properties-pro2', function () {
    gulp.src('/Users/Carlos/Workspace/Kyros/KyrosAPI/kyrosapi.properties')
        .pipe(scp({
            host: '192.168.28.137',
            user: 'root',
            port: 22,
            path: '/opt/KyrosAPI'
        }));
});

gulp.task('upload-appjs-pro2', function () {
    gulp.src('/Users/Carlos/Workspace/Kyros/KyrosAPI/api.js')
        .pipe(scp({
            host: '192.168.28.137',
            user: 'root',
            port: 22,
            path: '/opt/KyrosAPI'
        }));
});



// --------------------------------------------------------------------------------

gulp.task('upload-tests', function () {
    gulp.src('/Users/Carlos/Workspace/Kyros/KyrosAPI/test/remote/*.js')
        .pipe(scp({
            host: '172.26.6.50',
            user: 'root',
            port: 22,
            path: '/opt/testKyrosApi/test'
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



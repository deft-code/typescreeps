/*jshint esversion: 6, node: true */
'use strict';

const log = require('fancy-log');
const clean = require('gulp-clean');
const gulp = require('gulp');
const gulpDotFlatten = require('./libs/gulp-dot-flatten.js');
const PluginError = require('gulp-util').PluginError;
const ts = require('gulp-typescript');
const tslint = require('gulp-tslint');
const tsProject = ts.createProject('tsconfig.json', { typescript: require('typescript') });

/*********/
/* TASKS */
/*********/


gulp.task('lint', function() {
  log('linting ...');
  return gulp.src('src/**/*.ts')
    .pipe(tslint({ formatter: 'prose' }))
    .pipe(tslint.report({
      summarizeFailureOutput: true,
      emitError: true
    }));
});


gulp.task('clean', function () {
  return gulp.src(['dist/', 'distjs/'], { read: false, allowEmpty: true })
    .pipe(clean());
});

gulp.task('compile', ['clean'], function () {
    return tsProject.src()
      .pipe(tsProject())
      .on('error', (err) => global.compileFailed = true)
      .js.pipe(gulp.dest('distjs'));
  })

gulp.task('flatten', ['compile'], function () {
    return gulp.src('distjs/**/*.js')
      .pipe(gulpDotFlatten(0))
      .pipe(gulp.dest('dist'));
  }
)

gulp.task('upload', ['flatten'], function () {
  return gulp.src('dist/*.js')
    .pipe(gulpScreepsUpload(config.user.email, config.user.password, buildConfig.branch, 0));
});

gulp.task('copyLocal', ['flatten'], function() {
  return gulp.src('dist/*')
    .pipe(gulp.dest("/home/nickte/.config/Screeps/scripts/localhost___21025/default"))
});

gulp.task('copyLocalPlus', ['flatten'], function() {
  return gulp.src('dist/*')
    .pipe(gulp.dest("/home/nickte/.config/Screeps/scripts/server1_screepspl_us___21025/default"))
});

gulp.task('watchUpload', function () {
  gulp.watch('src/**/*.ts', gulp.series('upload'))
    .on('all', function(event, path, stats) {
      console.log('');
      log('File ' + path + ' was ' + event + 'ed, running tasks...');
    })
    .on('error', function () {
      log('Error during build tasks: aborting');
    });
});

gulp.task('watchLocal', function () {
  gulp.watch('src/**/*.ts', gulp.series('copyLocal'))
      .on('all', function(event, path, stats) {
        log('File ' + path + ' was ' + event + 'ed, running tasks...');
      })
      .on('error', function () {
        log.error('Error during build tasks: aborting');
      });
});

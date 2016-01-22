/**
 * gulp配置文件
 *
 */
var gulp = require('gulp');
//一.开发
//1.清理文件、文件夹，用于重新打包时候清理环境
var clean = require("gulp-clean");
//2.less编译与css压缩处理。gulp-less插件(http://npm.taobao.org/package/gulp-less)
var less = require('gulp-less');
var lesssourcemap = require('gulp-less-sourcemap');

var path = require('path');
//4.实时检测
var connect = require('gulp-connect');
//5.js hint
var jshint = require('gulp-jshint');
//重命名
var rename = require('gulp-rename');
//消息通知
var notify = require('gulp-notify');

//二.发布
//压缩css
var minifyCss = require('gulp-minify-css');
//改名
var rev = require('gulp-rev');
var revCollector = require('gulp-rev-collector');
//3.合并js文件
var concat = require('gulp-concat');
//压缩js
var uglify = require('gulp-uglify');
//seajs打包
//var seajscombo = require('gulp-seajs-combo');

//图片压缩
var imagemin = require('gulp-imagemin');

//html合并
var contentIncluder = require('gulp-content-includer');

//配置文件,路径
var paths = {
    src: "src",
    dest: "assets"
};

//1.CSS功能：less编译css(可生成SourceMap)、css合并、压缩、css文件替换名称、对应html替换css路径名称
//清空所有编译后的资源
gulp.task("clean-all", function () {
    return gulp.src([paths.dest, paths.src + "/build", paths.src + "/css", paths.src + "/app/", paths.src + "/scripts/concat"], {
        read: false
    }).pipe(clean({force: true}))
        .pipe(notify({message: 'clean all complete'}));
});
//发布：清空输出文件、文件夹清理。针对输出的目录
gulp.task("clean-release", function () {
    return gulp.src(paths.dest, {
        read: false
    }).pipe(clean({force: true}))
        .pipe(notify({message: 'clean task complete'}));
});
//清理css文件夹
gulp.task('clean-css', function () {
    return gulp.src(paths.src + '/css/', {
        read: false
    }).pipe(clean({force: true}));
});
//清理app文件夹
gulp.task('clean-app', function () {
    return gulp.src(paths.src + '/app/**/*.*', {
        read: false
    }).pipe(clean({force: true}));
});
//方案1：只编译less到css
//编译less生成sourceMap,到对应css目录
gulp.task('lessSourceMap', ['clean-css'], function () {
    return gulp.src([paths.src + '/less/**/*.less', "!" + paths.src + '/less/mixins/**/*'])
        .pipe(lesssourcemap({
            paths: [path.join(__dirname, 'less', 'includes')],
            sourceMap: {
                sourceMapRootpath: paths.src + '/less/' // Optional absolute or relative path to your LESS files
            }
        }))
        .pipe(gulp.dest(paths.src + '/css/'))
});
//
gulp.task('less', ['clean-css'], function () {
    return gulp.src([paths.src + '/less/**/*.less', "!" + paths.src + '/less/mixins/**/*'])
        .pipe(less({
            paths: [path.join(__dirname, 'less', 'includes')]
        }))
        .pipe(gulp.dest(paths.src + '/css/'))
});
//方案2：编译less到build目录后，改名至css
//清理临时build下css文件目录
gulp.task('clean-build', function () {
    return gulp.src(paths.src + '/build/', {
        read: false
    }).pipe(clean({force: true}));
});
//拷贝css到编译环境
gulp.task('copyCssToBuild', ['lessSourceMap', 'concat-css'], function () {
    return gulp.src(paths.src + '/css/**/*.*')
        .pipe(minifyCss())
        .pipe(gulp.dest(paths.src + '/build/css/'));
});
//将css重命名，先执行less编译
gulp.task('cssRevPre', ['copyCssToBuild'], function () {
    return gulp.src(paths.src + '/build/css/**/*')
        .pipe(rev())
        .pipe(gulp.dest(paths.src + '/css/'))
        .pipe(rev.manifest('rev-css-manifest.json'))
        .pipe(gulp.dest(paths.src + '/build/'));
});
//★读取css重命名后的json文件
gulp.task('cssRev', ['cssRevPre'], function () {
    gulp.src([paths.src + '/build/rev-css-manifest.json', '../**/*.jsp', '../**/*.html'])
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(gulp.dest('../'));
});

//编译less并压缩，不输出sourceMap
gulp.task('cssmin', ['lessSourceMap', 'concat-css'], function () {
    return gulp.src(paths.src + '/css/**/*')
        //.pipe(gulp.dest(paths.dest + '/css/'))
        //.pipe(rename({suffix: '.min'}))
        .pipe(minifyCss())
        .pipe(gulp.dest(paths.dest + '/css/'))
    //提醒任务完成
    //.pipe(notify({message: 'cssmin task complete'}));
});

//JS部分
//清理输出目录的图片文件夹
gulp.task('clean-js', function () {
    return gulp.src(paths.dest + '/scripts/lib/plugin/', {
        read: false
    }).pipe(clean({force: true}));
});
//合并js
gulp.task('concat', ['clean-js'], function () {
    return gulp.src([paths.src + '/scripts/lib/plugin/*.js'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(concat('jquery.plugins.js'))
        .pipe(gulp.dest(paths.src + "/scripts/concat/lib/plugin/"))
    //.pipe(rename({suffix: '.min'}))
    //.pipe(uglify())
    //.pipe(gulp.dest(paths.dest + "/scripts/concat/lib/plugin/"))
    //提醒任务完成
    //.pipe(notify({message: 'concat task complete'}));
});
//合并css
gulp.task('concat-css', ['lessSourceMap'], function () {
    return gulp.src([paths.src + '/css/lib/**/*.css'])
        .pipe(concat('lib.css'))
        .pipe(gulp.dest(paths.src + "/css/lib/"))
});
//压缩js
gulp.task('jsmin', ['concat'], function () {
    return gulp.src([paths.src + '/scripts/**/*.js'])
        //.pipe(jshint('.jshintrc'))
        //.pipe(jshint.reporter('default'))
        .pipe(gulp.dest(paths.dest + "/scripts/"))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify({
            mangle: {except: ['require']}
        }))
        .pipe(gulp.dest(paths.dest + "/scripts/"))
    //提醒任务完成
    //.pipe(notify({message: 'Script task complete'}));
});
//gulp.task('seajs', ['jsmin'], function () {
//    return gulp.src([
//        paths.src + '/scripts/sea-modules/main/lucky.sea.js',
//        paths.src + '/scripts/sea-modules/main/spa.sea.js',
//        paths.src + '/scripts/sea-modules/main/seajs-demo.js'
//    ])
//        .pipe(seajscombo({
//
//        }))
//        .pipe(gulp.dest(paths.dest + "/scripts/sea-modules/main"))
//});
//清理输出目录的图片文件夹
gulp.task('clean-images', function () {
    return gulp.src(paths.dest + '/images/', {
        read: false
    }).pipe(clean({force: true}));
});
//图片压缩
gulp.task('images', ['clean-images'], function () {
    return gulp.src(paths.src + '/images/*')
        .pipe(imagemin({optimizationLevel: 3, progressive: true, interlaced: true}))
        .pipe(gulp.dest(paths.dest + '/images'))
    //.pipe(notify({message: 'Images task complete'}));
});
//清理临时build下css文件目录
gulp.task('clean-html', function () {
    return gulp.src(paths.dest + '/app/', {
        read: false
    }).pipe(clean({force: true}));
});
//html的include到一个文件
gulp.task('html-include', function () {
    gulp.src([paths.src + '/html/**/*.html', "!" + paths.src + '/html/include'])
        .pipe(contentIncluder({
            includerReg: /<!\-\-include\s+"([^"]+)"\-\->/g
        }))
        //.pipe(rename('index.html'))
        .pipe(gulp.dest(paths.src + '/app/'));
});
//html发布
gulp.task('html-release', ['clean-release'], function () {
    gulp.src([paths.src + '/html/**/*.html', "!" + paths.src + '/html/include'])
        .pipe(contentIncluder({
            includerReg: /<!\-\-include\s+"([^"]+)"\-\->/g
        }))
        .pipe(gulp.dest(paths.src + '/app/'))
        .pipe(gulp.dest(paths.dest + '/app/'));
});
//创建服务器
gulp.task('connect', function () {
    connect.server({
        host: '127.0.0.1',           //Server host
        root: paths.src,
        port: 8888,
        livereload: true

    });
});
//创建服务器
gulp.task('connect-release', function () {
    connect.server({
        host: '127.0.0.1',           //Server host
        root: paths.dest,
        port: 8889,
        livereload: true

    });
});
//重新reload
gulp.task('html-reload', function () {
    gulp.src(paths.src + '/**/*.html')
        .pipe(connect.reload());
});
//启动web服务器
gulp.task('watch-server', function () {
    gulp.watch([paths.src + '/html/**/*.html', paths.src + '/app/**/*.html', paths.src + '/css/**/*.css'], ['html-reload']);
});

gulp.task('watcher-less', ['lessSourceMap'], function () {
    gulp.watch(paths.src + '/less/**/*.less', ['lessSourceMap', 'concat-css']); //当less文件发生改变时，自动编译成css
});
gulp.task('watcher-html', ['html-include'], function () {
    gulp.watch(paths.src + '/html/**/*.*', ['html-include', 'html-reload']); //当less文件发生改变时，自动编译成css
});
gulp.task('watcher-js', ['concat'], function () {
    gulp.watch(paths.src + '/scripts/**/*.*', ['concat', 'html-reload']); //当less文件发生改变时，自动编译成css
});
//gulp任务
//初始化所需文件
gulp.task('install', ['clean-all', 'copyProject']); //定义默认任务
//默认
gulp.task('default', ['clean-all', 'lessSourceMap', 'concat', 'images', 'html-include']); //定义默认任务
//开发模式
gulp.task('dev', ['clean-all', 'lessSourceMap', 'concat-css', 'concat', 'html-include', 'watcher-less', 'watcher-js', 'watcher-html', 'connect', 'watch-server']); //可以监听的任务
//发布常规编译后的版本
gulp.task('release', ['clean-release', 'lessSourceMap', 'concat-css', 'cssmin', 'jsmin', 'images', 'html-release', 'connect-release']);
//发布重新更名后的版本
//cssRev编译less,改名压缩css
gulp.task('releaseRev', ['clean-all', 'cssRev', 'cssmin', 'jsmin', 'images', 'html-release']); //可以监听的任务
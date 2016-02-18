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
var seajscombo = require('gulp-seajs-combo');

//图片压缩
var imagemin = require('gulp-imagemin');

//html合并
var contentIncluder = require('gulp-content-includer');

//htmlprocessor
var htmlprocessor = require('gulp-htmlprocessor');
//配置文件,路径
var paths = {
    src: "src",
    dest: "assets"
};

//1.CSS功能：less编译css(可生成SourceMap)、css合并、压缩、css文件替换名称、对应html替换css路径名称
//清空所有编译后的资源
gulp.task("clean-all", function () {
    return gulp.src([paths.dest, paths.src + "/build", paths.src + "/css", paths.src + "/app/", paths.src + "/js/concat"], {
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
    return gulp.src(paths.src + '/css/**/*.*', {
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
//编译less并压缩，不输出sourceMap
gulp.task('cssmin', ['less'], function () {
    return gulp.src([paths.src + '/css/**/*.css', '!' + paths.src + '/css/_include/*.css'])
        .pipe(gulp.dest(paths.dest + '/css/'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifyCss({compatibility: 'ie7'}))
        .pipe(gulp.dest(paths.dest + '/css/'))
    //提醒任务完成
    //.pipe(notify({message: 'cssmin task complete'}));
});

//JS部分
//清理输出目录的图片文件夹
gulp.task('clean-js', function () {
    return gulp.src([paths.dest + '/js/*.min.js', paths.dest + '/js/xyz-mobile/dist/*.js', paths.dest + '/js/xyz-pc/dist/*.js', paths.dest + '/js/lib.js'], {
        read: false
    }).pipe(clean({force: true}));
});
//合并js
gulp.task('concat', ['clean-js'], function () {
    return gulp.src([paths.src + '/js/lib/*.js', paths.src + '/js/dist/'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(concat('lib.js'))
        .pipe(gulp.dest(paths.src + "/js/"))
});
//合并css
gulp.task('concat-css', ['less'], function () {
    return gulp.src([paths.src + '/css/lib/**/*.css'])
        .pipe(concat('lib.css'))
        .pipe(gulp.dest(paths.src + "/css/"))
});
//seajscombo
gulp.task('seajscombo', ['concat'], function () {
    var seajsPluginPaths = "./../../../sea-modules/";
    var seajsPaths = "./../../sea-modules/";
    return gulp.src([paths.src + '/js/xyz-mobile/modules/*.js'])
        .pipe(seajscombo({
            map: {
                "$": seajsPluginPaths + "gallery/zepto/1.0.1/zepto.js",
                "jquery": seajsPaths + "gallery/jquery/jquery-sea",
                "zepto": seajsPaths + "gallery/zepto/1.0.1/zepto.js",
                "cookie": seajsPaths + "gallery/cookie/1.0.2/cookie"
            }
        }))
        .pipe(gulp.dest(paths.src + "/js/xyz-mobile/dist"))

});
//seajscombo
gulp.task('seajscombo-pc', ['concat'], function () {
    //内部插件引用地址
    var seajsPluginPaths = "./../../../sea-modules/";
    //外部模块引用的通用地址
    var seajsPaths = "./../../sea-modules/";
    var seajsModulesPaths = "./../../";
    return gulp.src([paths.src + '/js/xyz-pc/main/*.js'])
        .pipe(seajscombo({
            map: {
                "../../js/xyz-pc/modules/gulpstudy": seajsModulesPaths + "xyz-pc/modules/gulpstudy",
                "$": seajsPluginPaths + "gallery/jquery/jquery-sea",
                "jquery": seajsPaths + "gallery/jquery/jquery-sea",
                "zepto": seajsPaths + "gallery/zepto/1.0.1/zepto.js",
                "cookie": seajsPaths + "gallery/cookie/1.0.2/cookie"
            }
        }))
        .pipe(gulp.dest(paths.src + "/js/xyz-pc/dist"))

});
//gulp.task('seajscombo', ['concat'], function () {
//    var seajsPaths = "./../../";
//    return gulp.src([paths.src + '/js/sea-modules/main/*.js'])
//        .pipe(seajscombo({
//            map: {
//                "$": seajsPaths + "gallery/zepto/1.0.1/zepto"
//            }
//        }))
//        .pipe(gulp.dest(paths.src + "/js/sea-modules/dist"))
//
//});
//压缩js
gulp.task('jsmin', ['seajscombo-pc'], function () {
    return gulp.src([paths.src + '/js/**/*.js'])
        //.pipe(jshint('.jshintrc'))
        //.pipe(jshint.reporter('default'))
        //TODO 两种方案，一种是minjs
        //TODO Delete 是否需要保留原先的文件
        //.pipe(uglify({
        //    mangle: {except: ['require']}
        //}))
        .pipe(gulp.dest(paths.dest + "/js/"))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify({
            mangle: {except: ['require', '$', 'define']}
        }))
        .pipe(gulp.dest(paths.dest + "/js/"))
    //提醒任务完成
    //.pipe(notify({message: 'Script task complete'}));
});
//清理输出目录的图片文件夹
gulp.task('clean-img', function () {
    return gulp.src(paths.dest + '/img/', {
        read: false
    }).pipe(clean({force: true}));
});
//图片压缩
gulp.task('img', ['clean-img'], function () {
    return gulp.src(paths.src + '/img/**/*.*')
        .pipe(imagemin({optimizationLevel: 3, progressive: true, interlaced: true}))
        .pipe(gulp.dest(paths.dest + '/img'))
    //.pipe(notify({message: 'img task complete'}));
});
//清理临时build下css文件目录
gulp.task('clean-html', function () {
    return gulp.src(paths.dest + '/app/', {
        read: false
    }).pipe(clean({force: true}));
});
//html的include到一个文件
gulp.task('html-include', ['clean-html'], function () {
    gulp.src([paths.src + '/html/**/*.html', "!" + paths.src + '/html/_include/**/*.html'])
        .pipe(contentIncluder({
            includerReg: /<!\-\-include\s+"([^"]+)"\-\->/g
        }))
        //.pipe(rename('index.html'))
        .pipe(gulp.dest(paths.src + '/app/'));
});
//html发布
gulp.task('html-release', ['clean-release'], function () {
    gulp.src([paths.src + '/html/**/*.html', "!" + paths.src + '/html/_include/**/*.html'])
        .pipe(contentIncluder({
            includerReg: /<!\-\-include\s+"([^"]+)"\-\->/g
        }))
        .pipe(gulp.dest(paths.src + '/app/'))
    //.pipe(gulp.dest(paths.dest + '/app/'))
    //.pipe(gulp.dest(paths.dest + '/app/'));
});

gulp.task('html-processor', ['html-include'], function () {
    gulp.src(paths.src + '/app/**/*.html')
        .pipe(htmlprocessor({
            environment: 'dev',
            data: {
                message: ".min"
            }
        }))
        .pipe(gulp.dest(paths.dest + '/app/'));
});
gulp.task('html-processor-release', ['html-release'], function () {
    gulp.src(paths.src + '/app/**/*.html')
        .pipe(htmlprocessor({
            environment: 'dev',
            data: {
                message: ".min"
            }
        }))
        .pipe(gulp.dest(paths.dest + '/app/'));
});
//处理seajs的引用问题，引用min文件
gulp.task('html-processor-seajs', ['html-processor-release'], function () {
    gulp.src(paths.src + '/app/**/*.html')
        .pipe(htmlprocessor({
            environment: 'dist'
            //customBlockTypes: ['custom-blocktype.js']
        }))
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
        port: 8888,
        livereload: true

    });
});
//重新reload
gulp.task('html-reload', function () {
    gulp.src(paths.src + '/**/*.html')
        .pipe(connect.reload());
});
//重新reload
gulp.task('html-less-reload', ['clean-css', 'less'], function () {
    gulp.src(paths.src + '/**/*.html')
        .pipe(connect.reload());
});
//启动web服务器
gulp.task('watch-server', ['less'], function () {
    gulp.watch([paths.src + '/**/*.html'], ['html-reload']);
});

gulp.task('watcher-less', ['clean-css', 'less'], function () {
    gulp.watch(paths.src + '/less/**/*.less', ['less', 'html-less-reload']); //当less文件发生改变时，自动编译成css
});
gulp.task('watcher-html', ['html-reload'], function () {
    gulp.watch(paths.src + '/**/*.html', ['html-include', 'html-reload']); //当less文件发生改变时，自动编译成css
});
gulp.task('watcher-html-processor', function () {
    gulp.watch(paths.src + '/**/*.html', ['html-processor', 'html-reload']); //当less文件发生改变时，自动编译成css
});
gulp.task('watcher-js', ['concat'], function () {
    gulp.watch(paths.src + '/js/**/*.js', ['concat', 'html-reload']); //当less文件发生改变时，自动编译成css
});

//拷贝fonts文件夹
gulp.task('copy-fonts', ['clean-release'], function () {
    return gulp.src(paths.src + '/fonts/**/*.*')
        .pipe(gulp.dest(paths.dest + '/fonts'))
    //.pipe(notify({message: 'img task complete'}));
});
//拷贝额外的css文件
gulp.task('copy-css-other', ['less'], function () {
    return gulp.src(paths.src + '/othercss/**/*.*')
        .pipe(gulp.dest(paths.src + '/css/othercss'))
    //.pipe(notify({message: 'img task complete'}));
});
//gulp任务
//默认
gulp.task('default', ['clean-all', 'lessSourceMap', 'concat', 'img', 'html-include']); //定义默认任务
//开发模式
gulp.task('dev', ['clean-all', 'less', 'copy-css-other', 'concat', 'watcher-less', 'watcher-js', 'html-include', 'html-processor', 'connect', 'watcher-html']); //可以监听的任务
//发布常规编译后的版本
gulp.task('release', ['clean-release', 'copy-fonts', 'less', 'concat', 'concat-css', 'cssmin', 'seajscombo', 'seajscombo-pc', 'jsmin', 'img', 'html-release', 'html-processor-release', 'html-processor-seajs', 'connect-release']);

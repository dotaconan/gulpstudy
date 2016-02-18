#gulpstudy示例demo

该案例旨在gulp插件使用示范

#使用方法

##安装nodejs环境

##直接解压集成好gulp的node_modules.rar(无node_modules.rar动态联网安装需要执行install.bat)

##开发环境：

###1.执行dev.bat

gulp.task('dev', ['clean-all', 'less', 'copy-css-other', 'concat', 'watcher-less', 'watcher-js', 'html-include', 'html-processor', 'connect', 'watcher-html']);

执行：清理目录，编译less，拷贝文件，合并文件，监听less文件改动，监听js文件改动，html文件引入，html文件资源替换，创建web服务器，监听html文件改动

###2.打开谷歌浏览器，输入http://127.0.0.1:8888/app/demolist.html

利用谷歌浏览器查看页面引用的资源情况

##发布环境：先停止开发时的服务器，可以按 Ctrl+C终止dev.bat

###1.执行release.bat

gulp.task('release', ['clean-release', 'copy-fonts', 'less', 'concat', 'concat-css', 'cssmin', 'seajscombo', 'seajscombo-pc', 'jsmin', 'img', 'html-release', 'html-processor-release', 'html-processor-seajs', 'connect-release']);

执行：清理发布目录，拷贝字体文件，编译less，合并css，css压缩，压缩seajs，js压缩，图片压缩，编译html，创建web服务器用于查看发布后的文件调试

###2.打开谷歌浏览器，输入http://127.0.0.1:8888/app/demolist.html

利用谷歌浏览器查看页面引用的资源情况。对比之前资源，js/css均打包，请求数目变小

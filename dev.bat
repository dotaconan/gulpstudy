echo gulp clean-all  清空开发环境
echo gulp clean-all
echo gulp.task('dev', ['clean-all', 'less', 'copy-css-other', 'concat', 'watcher-less', 'watcher-js', 'html-include', 'html-processor', 'connect', 'watcher-html']); //可以监听的任务
gulp dev
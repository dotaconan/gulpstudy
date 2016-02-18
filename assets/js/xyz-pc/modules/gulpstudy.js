/**
 * Created by Administrator on 16-1-14.
 */
/*文件入口*/
define(function (require, exports, module) {

    //引入通用库
    var cookie = require('cookie');
    //引入模块
    var xyzuiSlide = require('../controls/slide/xyzui-slide-sea');
    //引入插件中依赖其他插件的库文件
    var xyzuiDialog = require('../controls/dialog/xyzui-dialog-sea');



    $(document).ready(function () {

    });
    //console.log($);
    //console.log(luckySlide);
    console.log(cookie);
    console.log(xyzuiSlide);
    console.log(xyzuiDialog);
    // console.log(luckySelect);

    module.exports = {
        $: $,
        cookie: cookie
    }
});
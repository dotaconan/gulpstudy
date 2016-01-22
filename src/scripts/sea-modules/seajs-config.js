/**
 * Created on 2016/1/4.
 */
seajs.config({
    //文件编码
    charset: "utf-8",
    base: "../scripts/sea-modules",
    alias: {
        "$": "gallery/jquery/jquery.sea.js",
        //slide插件
        'ui.slide.sea': 'gallery/slide/1.0.0/ui.slide.sea.js'
    }
});

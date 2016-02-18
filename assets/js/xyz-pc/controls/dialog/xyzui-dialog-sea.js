/**
 * Created by lucheng0902 on 2016/1/5.
 */
define(function (require, exports, module) {
    //依赖模块jquery
    var $ = require('$');
    var Drag = require('../drag/xyzui-drag-sea');

    //构造函数
    function Dialog(element, options) {
        this.$element = $(element);
        this.options = $.extend({}, Dialog.DEFAULTS, $(element).data(), options);
        this.init();
    };


    var dismiss = '[data-xyz="dialog"]';
    Dialog.VERSION = "1.0.0";


    Dialog.DEFAULTS = {
        //弹窗标题
        title: '默认标题',
        //宽度
        width: 400,
        //高度
        height: 'auto',
        //位置
        position: ['center', 'center'],
        //是否自动打开
        autoOpen: false,
        //按钮
        button: null,
        //模板
        template: '<div class="hc-dialog">' +
        '<div class="hc-dialogHd">' +
        '<a href="javascript:;" class="hc-close fa fa-times" title="关闭"></a>' +
        '<h4></h4>' +
        '</div>' +
        '<div class="hc-dialogBd"></div>' +
        '<div class="hc-dialogFt"></div>' +
        '</div>'
    };


    //初始化
    Dialog.prototype.init = function () {
        this.title = this.options.title;
        this.width = this.options.width;
        this.height = this.options.height;
        this.position = this.options.position;
        this.autoOpen = this.options.autoOpen;
        this.button = this.options.button;
        this.template = this.options.template;
        this.creatDom();
        this.attr();
        this.event();
    };
    //DOM构建
    Dialog.prototype.creatDom = function () {
        this.$dialogObj = $(this.template).appendTo($('body'))
        this.$dialogObj.find('.hc-dialogBd').append(this.$element.show());
        //按钮构建
        if (this.button) {
            this.$dialogObj.addClass('hc-hasFooter');
            var html = '';
            for (var i = 0; i < this.button.length; i++) {
                if (this.button[i].recommend == true) {
                    html += '<button type="button" class="ue-button recommend">' + this.button[i].label + '</button>';
                } else {
                    html += '<button type="button" class="ue-button">' + this.button[i].label + '</button>';
                }
            }
            this.$dialogObj.find('.hc-dialogFt').append(html);
        } else {
            this.$dialogObj.find('.hc-dialogFt').remove();
        }
    };
    //绑定属性集合
    Dialog.prototype.attr = function () {
        this.setWidth(this.width);
        this.setHeight(this.height);
        this.$header = this.setTitle(this.title)
        this.setPosition(this.position);
    };
    //绑定事件集合
    Dialog.prototype.event = function () {
        var _this = this;
        if (this.button) {
            this.buttonEvent();
        }
        if (this.autoOpen) {
            this.open();
        }
        var drag = new Drag(this.$dialogObj, {handle: $('.hc-dialogHd h4')});

        this.$dialogObj.find('.hc-dialogHd .hc-close').on('click', function () {
            _this.$dialogObj.hide();
        });
        $(window).resize(function () {
            _this.setPosition(_this.position);
        });
    };
    //按钮事件绑定
    Dialog.prototype.buttonEvent = function () {
        var _this = this;
        this.$dialogObj.on('click', '.hc-dialogFt .ue-button', function () {
            _this.button[$(this).index()].callback.call(_this.$element, _this.$element);
        });
    };
    //定位方法
    Dialog.prototype.setPosition = function (position) {
        this.position = position;
        var _left, _top;
        switch (this.position[0]) {
            case 'center' :
                _left = ($(window).width() - this.$dialogObj.outerWidth()) / 2;
                break;
            case 'left' :
                _left = 0;
                break;
            case 'right' :
                _left = $(window).width() - this.$dialogObj.outerWidth();
                break;
            default :
                _left = this.position[0]
        }
        switch (this.position[1]) {
            case 'center' :
                _top = ($(window).height() - this.$dialogObj.outerHeight()) / 2;
                break;
            case 'top' :
                _top = 0;
                break;
            case 'bottom' :
                _top = $(window).height() - this.$dialogObj.outerHeight();
                break;
            default :
                _top = this.position[1]
        }
        this.$dialogObj.css({left: _left, top: _top});
    };
    //设置对话框标题方法
    Dialog.prototype.setTitle = function (_title) {
        this.$dialogObj.find('.hc-dialogHd h4').html(_title);
    };
    //设置对话框宽度方法
    Dialog.prototype.setWidth = function (_width) {
        this.$dialogObj.css('width', _width);
        this.setPosition(this.position);
    };
    //设置对话框高度方法
    Dialog.prototype.setHeight = function (_height) {
        this.$dialogObj.css('height', _height);
        this.setPosition(this.position);
    };
    //打开方法
    Dialog.prototype.open = function () {
        this.$dialogObj.show();
    };
    //关闭方法
    Dialog.prototype.close = function () {
        this.$dialogObj.hide();
    };
    //设置属性、方法
    Dialog.prototype.setProp = function (key, value) {
        var _this = this;
        //console.log(this[key]);
        //console.log(arguments);
        //传入
        this[key].apply(_this, [value]);
    };
    // 对外提供对象
    module.exports = Dialog;

});//end CMD
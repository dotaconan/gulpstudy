/**
 * 弹出层
 * @author geliang
 */
define("focus/touch-modal/0.1.2/touch-modal-debug", [ "underscore-debug", "$-debug", "events-debug" ], function(require, exports, module) {
    var _ = require("underscore-debug");
    var $ = require("$-debug");
    var Events = require("events-debug");
    var Modal = function(element, options) {
        _.bindAll(this);
        this.$el = $(element);
        this.options = options || {};
        //遮罩层
        this.$mask = $("<div></div>");
        this.$mask.appendTo($("body")).hide();
        // 绑定关闭的元素事件
        this.$el.on("click", '[data-action="hideModal"]', this.hide);
        this.$mask.tap(this.hide);
        this.bodyTapHighlight = $("body").css("-webkit-tap-highlight-color");
        $(window).resize(this.setStyle);
    };
    Modal.prototype = {
        constructor: Modal,
        // 显示
        show: function() {
            this.setStyle();
            this.showMask();
            this.$el.fadeIn(300);
        },
        // 显示一段时间后隐藏
        showPeriod: function(duration) {
            this.show();
            this.hideTimer = setTimeout(_.bind(this.hide, this), duration);
        },
        // 隐藏
        hide: function(duration) {
            clearTimeout(this.hideTimer);
            this.$el.fadeOut(300, this.hideMask);
            this.trigger("hide");
        },
        showMask: function() {
            this.$mask.fadeIn();
            // zepto 1.0 的 show() 会把 opacity 改为1
            this.isShow = true;
            $("body").css("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
        },
        hideMask: function() {
            this.$mask.hide();
            this.$el.css("top", "-5000px");
            this.isShow = false;
            $("body").css("-webkit-tap-highlight-color", this.bodyTapHighlight);
        },
        // 计算并设置元素的 css 样式
        setStyle: function(e) {
            if (e && !this.isShow) {
                return;
            }
            // 先让 el 显示出来，以便计算其尺寸
            this.$el.css({
                "z-index": 9990,
                position: "absolute",
                top: "-5000px",
                display: "block"
            });
            //弹出层位置
            var top = ($(window).height() - this.$el.offset().height) / 2 + (window.scrollTop || window.scrollY);
            var left = ($(window).width() - this.$el.offset().width) / 2 + (window.scrollLeft || window.scrollX);
            this.$el.css({
                top: top > 0 ? top : 0,
                left: left > 0 ? left : 0,
                "z-index": 9990,
                position: "absolute"
            });
            //遮罩尺寸
            var width = Math.max(document.documentElement.scrollWidth, document.documentElement.offsetWidth, document.body.scrollWidth);
            var height = Math.max(document.documentElement.scrollHeight, document.documentElement.offsetHeight, document.body.scrollHeight);
            this.$mask.css({
                position: "absolute",
                background: "black",
                "z-index": 9980,
                width: width + "px",
                height: height + "px",
                top: 0,
                left: 0,
                margin: 0,
                padding: 0,
                opacity: .15
            });
        },
        $: function(selector) {
            return this.$el.find(selector);
        }
    };
    Events.mixTo(Modal);
    return Modal;
});

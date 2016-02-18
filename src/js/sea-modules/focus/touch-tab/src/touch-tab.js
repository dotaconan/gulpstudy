/**
 * tab 控件
 * @author geliang
 */
define(function (require, exports, module) {
    var _ = require('underscore');
    var $ = require('$');

    var Tab = function (navs, options) {
        _.bindAll(this);

        options = options || {};
        this.$navs = $(navs);
        this.activeClass = options.activeClass || 'active';
        this.bindEvent();
    };

    Tab.prototype = {
        constructor : Tab,

        bindEvent : function () {
            var _this = this;
            this.$navs.click(this.handleNavClick);
        },

        handleNavClick : function (e) {
            e.preventDefault();
            var target = $(e.target);
            target.parent().addClass(this.activeClass);
            target.parent().siblings().removeClass(this.activeClass);
            this.show(target.attr('href'));
            // 滚动到nav可见
            window.scrollTo(0, target.offset().top);
        },

        show : function (id) {
            $(id).show();
            $(id).siblings().hide();
        }
    }

    return Tab;
});
/**
 * 滚动选择器，与 iScroll 对象对应
 * @author geliang
 */
define(function (require, exports, module) {
    var _ = require('underscore');
    var $ = require('$');
    var Events = require('events');
    var iScroll = require('iscroll');

    var ScrollPicker = function (element, options) {
        _.bindAll(this);
        Events.mixTo(this);

        this.$list = $(element).find('.lists');
        this.iscroll = new iScroll(this.$list[0], {
            vScrollbar : false,
            hScrollbar : false,
            snap : 'li',
            onScrollMove : this.handleScroll,
            onScrollEnd : this.handlePick
        });

        this.render(options);
    };

    ScrollPicker.prototype = {
        constructor : ScrollPicker,

        // 处理滚动结束，即选择事件，会触发自身的 picked 事件
        handlePick : function () {
            // iScroll 会认为最后一个元素也能被 scroll 到，这里做一下防御
            if (this.iscroll.currPageY >= this.iscroll.pagesY.length - 2) {
                this.iscroll.scrollToPage(0, this.iscroll.pagesY.length - 3, 0);
                return;
            }

            if (this.$currEl) {
                this.$currEl.removeClass('current');
            }
            this.$currEl = this.$list.find('li').eq(this.iscroll.currPageY + 1);
            this.$currEl.addClass('current');
            this.value = this.$currEl.data('value');
            this.trigger('picked');
        },

        handleScroll : function () {
        	console.log(this.iscroll.pagesY, this.iscroll.currPageY)
        },

        // 渲染，会根据 options.data 来重新渲染选项
        render : function (options) {
            if (!options || !options.data) {
                return;
            }
            this.$list.find('li[data-value]').remove();
            _.each(options.data, function (item) {
                this.$list.find('li:last').before('<li data-value="' + item[1] + '">' + item[0] + '</li>');
            }, this);
        },

        getIndex : function () {
            return this.iscroll.currPageY;
        },

        gotoIndex : function (index) {
            this.iscroll.refresh();
            this.iscroll.scrollToPage(0, index, 0);
        }
    };

    return ScrollPicker;
});
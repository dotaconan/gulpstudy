/**
 * 类似 HTML5 中 detail/summary 的控件
 * @author geliang
 */
define(function (require, exports, module) {
    var $ = require('$');
    var _ = require('underscore');

    var Folder = function (options) {
        _.bindAll(this);

        this.options = options;
        this.$summary = $(options.summary);
        this.$detail = $(options.detail);

        this.$summary.tap(this.handleSummaryTap);
    };

    Folder.prototype = {
        constructor : Folder,

        handleSummaryTap : function () {
            var isExpand = this.isExpand();

            // 有动画
            if (this.options.speed) {
                if (isExpand) {
                    var newHeight = 0;
                    this.$detail.css('height', this.detailHeight());
                } else {
                    var newHeight = this.detailHeight();
                }
                this.$detail.animate({
                    'height' : newHeight
                }, this.options.speed, 'ease');
            } else {
                this.$detail.toggle();
            }

            // 回调
            if (this.options.callback) {
                this.options.callback.call(this, !isExpand);
            }

            this.$summary.data('expand', !isExpand);
        },

        isExpand : function () {
            return !!this.$summary.data('expand');
        },

        // 展开
        expand : function () {
            if (!this.isExpand()) {
                this.handleSummaryTap();
            }
        },

        detailHeight : function () {
            var height = 0;
            this.$detail.children().each(function () {
                height += $(this).offset().height;
            });
            return height;
        }
    };

    return Folder;
});
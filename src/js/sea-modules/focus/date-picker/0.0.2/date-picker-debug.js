define("focus/date-picker/0.0.2/date-picker-debug", [ "underscore-debug", "$-debug", "events-debug", "moment-debug", "modal-debug", "./scroll-picker-debug", "iscroll-debug", "./date-picker-debug.html" ], function(require) {
    var _ = require("underscore-debug");
    var $ = require("$-debug");
    var Events = require("events-debug");
    var moment = require("moment-debug");
    var Modal = require("modal-debug");
    var ScrollPicker = require("./scroll-picker-debug");
    var html = require("./date-picker-debug.html");
    var YEAR_START = 1900;
    var YEAR_END = 2030;
    var DatePicker = function() {
        _.bindAll(this);
        Events.mixTo(this);
        this.$el = $(html).appendTo("body");
        this.modal = new Modal(this.$el);
        this.init();
    };
    DatePicker.prototype = {
        constructor: DatePicker,
        init: function() {
            this.yearPicker = new ScrollPicker(this.$el.find(".date")[0], {
                data: generateDateRange(YEAR_START, YEAR_END)
            });
            this.monthPicker = new ScrollPicker(this.$el.find(".date")[1], {
                data: generateDateRange(1, 12)
            });
            this.dayPicker = new ScrollPicker(this.$el.find(".date")[2]);
            this.yearPicker.on("picked", this.handleYearMonthPick);
            this.monthPicker.on("picked", this.handleYearMonthPick);
            this.dayPicker.on("picked", this.handleDayPick);
            this.$el.find(".cancel").tap(this.hide);
            this.$el.find(".submit").tap(this.submit);
        },
        // 显示，参数可以传递 date，表示需要显示的日期，默认为今天
        // date 参数类型可以为字符串 '2010-01-01' 或者 moment 对象
        show: function(options) {
            this.modal.show();
            options = options || {};
            var date = options.date || moment();
            if (_.isString(date)) {
                date = moment(date);
            }
            this.yearPicker.gotoIndex(date.year() - YEAR_START);
            this.monthPicker.gotoIndex(date.month() - 0);
            this.dayPicker.gotoIndex(date.date() - 1);
        },
        hide: function() {
            this.modal.hide();
        },
        submit: function() {
            this.hide();
            this.trigger("submit", this.date);
        },
        // 选择了年月以后，要改变日期的可选范围（28 29 30 31）
        handleYearMonthPick: function() {
            if (!this.yearPicker.value || !this.monthPicker.value) {
                return;
            }
            var days = moment([ this.yearPicker.value, this.monthPicker.value - 1 ]).daysInMonth();
            var oldIndex = this.dayPicker.getIndex();
            this.dayPicker.render({
                data: generateDateRange(1, days)
            });
            this.dayPicker.gotoIndex(oldIndex || 0);
        },
        // 选择日期，当选择了年月之后，也会触发日期的选择
        handleDayPick: function() {
            this.date = moment([ this.yearPicker.value, this.monthPicker.value - 1, this.dayPicker.value ]);
            this.$el.find(".date-title").text(this.date.format("YYYY-MM-DD ddd"));
            this.renderFestival();
        },
        // 渲染日期
        renderFestival: function() {
            if (moment().startOf("day").isSame(this.date)) {
                // 今天
                this.$el.find(".date-descr").text("今天");
            } else {
                this.$el.find(".date-descr").text("");
            }
        }
    };
    // 类方法，用于为 input text 提供日历的效果
    DatePicker.create = function(elements) {
        if (!DatePicker.instance) {
            // 只有一个实例，服务所有输入框
            DatePicker.instance = new DatePicker();
            DatePicker.instance.on("submit", function(date) {
            	$(DatePicker.relatedInput)
            	.val(date.format('YYYY-MM-DD'))
                .attr('formnovalidate', false)
                .trigger('change');
//              让input发生校验
            });
        }
        $(elements).focus(function() {
            if (this.readOnly || this.disabled) {
                return;
            }
            // 取消校验
            $(this).attr("formnovalidate", true);
            // 不显示键盘， blur可能不生效所以 hack一下
            this.blur();
            this.disabled = true;
            var _this = this;
            setTimeout(function() {
                _this.disabled = false;
            }, 1);
            // 显示日历
            DatePicker.instance.show({
                date: this.value
            });
            DatePicker.relatedInput = this;
        });
    };
    moment.lang("zh", {
        weekdaysShort: "周日 周一 周二 周三 周四 周五 周六".split(" ")
    });
    // 生成一种特定格式的数组用于 ScrollPicker
    // 形如 [['01', 1], ['02', 2], ... ['12', 12]]
    function generateDateRange(start, end) {
        return _.map(_.range(start, end + 1), function(i) {
            var text = i > 9 ? i : "0" + i;
            return [ text, i ];
        });
    }
    return DatePicker;
});

/**
 * 滚动选择器，与 iScroll 对象对应
 * @author geliang
 */
define("focus/date-picker/0.0.2/scroll-picker-debug", [ "underscore-debug", "$-debug", "events-debug", "iscroll-debug" ], function(require, exports, module) {
    var _ = require("underscore-debug");
    var $ = require("$-debug");
    var Events = require("events-debug");
    var iScroll = require("iscroll-debug");
    var ScrollPicker = function(element, options) {
        _.bindAll(this);
        Events.mixTo(this);
        this.$list = $(element).find(".lists");
        this.iscroll = new iScroll(this.$list[0], {
            vScrollbar: false,
            hScrollbar: false,
            snap: "li",
            onScrollEnd: this.handlePick
        });
        this.render(options);
    };
    ScrollPicker.prototype = {
        constructor: ScrollPicker,
        // 处理滚动结束，即选择事件，会触发自身的 picked 事件
        handlePick: function() {
            // iScroll 会认为最后一个元素也能被 scroll 到，这里做一下防御
            if (this.iscroll.currPageY >= this.iscroll.pagesY.length - 2) {
                this.iscroll.scrollToPage(0, this.iscroll.pagesY.length - 3, 0);
                return;
            }
            if (this.$currEl) {
                this.$currEl.removeClass("current");
            }
            this.$currEl = this.$list.find("li").eq(this.iscroll.currPageY + 1);
            this.$currEl.addClass("current");
            this.value = this.$currEl.data("value");
            this.trigger("picked");
        },
        // 渲染，会根据 options.data 来重新渲染选项
        render: function(options) {
            if (!options || !options.data) {
                return;
            }
            this.$list.find("li[data-value]").remove();
            _.each(options.data, function(item) {
                this.$list.find("li:last").before('<li data-value="' + item[1] + '">' + item[0] + "</li>");
            }, this);
        },
        getIndex: function() {
            return this.iscroll.currPageY;
        },
        gotoIndex: function(index) {
            this.iscroll.refresh();
            this.iscroll.scrollToPage(0, index, 0);
        }
    };
    return ScrollPicker;
});

define("focus/date-picker/0.0.2/date-picker-debug.html", [], '<div class="md-input-date" style="display: none;">\n    <div class="ly-clearFix title">\n        <div class="ly-left date-title"></div>\n        <div class="ly-right date-descr"></div>\n    </div>\n    <div class="content">\n        <div class="dates ly-clearFix">\n            <div class="date">\n                <a href="javascript:void(0);" class="tri tri-up"></a>\n                <a href="javascript:void(0);" class="tri tri-down"></a>\n\n                <div class="lists">\n                    <ul>\n                        <li></li>\n                        <li></li>\n                    </ul>\n                    <span class="hex hex1"></span>\n                    <span class="hex hex2"></span>\n                </div>\n            </div>\n            <div class="date">\n                <a href="javascript:void(0);" class="tri tri-up"></a>\n                <a href="javascript:void(0);" class="tri tri-down"></a>\n\n                <div class="lists">\n                    <ul>\n                        <li></li>\n                        <li></li>\n                    </ul>\n                    <span class="hex hex1"></span>\n                    <span class="hex hex2"></span>\n                </div>\n            </div>\n            <div class="date">\n                <a href="javascript:void(0);" class="tri tri-up"></a>\n                <a href="javascript:void(0);" class="tri tri-down"></a>\n\n                <div class="lists">\n                    <ul>\n                        <li></li>\n                        <li></li>\n                    </ul>\n                    <span class="hex hex1"></span>\n                    <span class="hex hex2"></span>\n                </div>\n            </div>\n        </div>\n    </div>\n    <div class="action">\n        <a href="javascript:void(0)" title="" class="cancel">取消</a>\n        <a href="javascript:void(0)" title="" class="submit">确定</a>\n    </div>\n</div>');

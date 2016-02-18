define(function (require) {
    var _ = require('underscore');
    var $ = require('$');
    var Events = require('events');
    var moment = require('moment');
    var Modal = require('modal');
    var ScrollPicker = require('./scroll-picker');
    var html = require('./date-picker.html');

    var YEAR_START = 1900;
    var YEAR_END = 2030;

    var DatePicker = function () {
        _.bindAll(this);
        Events.mixTo(this);

        this.$el = $(html).appendTo('body');
        this.modal = new Modal(this.$el);
        this.init();
    };

    DatePicker.prototype = {
        constructor : DatePicker,

        init : function () {
            this.yearPicker = new ScrollPicker(this.$el.find('.date')[0], {
                data : generateDateRange(YEAR_START, YEAR_END)
            });
            this.monthPicker = new ScrollPicker(this.$el.find('.date')[1], {
                data : generateDateRange(1, 12)
            });
            this.dayPicker = new ScrollPicker(this.$el.find('.date')[2]);

            this.yearPicker.on('picked', this.handleYearMonthPick);
            this.monthPicker.on('picked', this.handleYearMonthPick);
            this.dayPicker.on('picked', this.handleDayPick);

            this.$el.find('.cancel').tap(this.hide);
            this.$el.find('.submit').tap(this.submit);
        },

        // 显示，参数可以传递 date，表示需要显示的日期，默认为今天
        // date 参数类型可以为字符串 '2010-01-01' 或者 moment 对象
        show : function (options) {
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

        hide : function () {
            this.modal.hide();
        },

        submit : function () {
            this.hide();
            this.trigger('submit', this.date);
        },

        // 选择了年月以后，要改变日期的可选范围（28 29 30 31）
        handleYearMonthPick : function () {
            if (!this.yearPicker.value || !this.monthPicker.value) {
                return;
            }
            var days = moment([this.yearPicker.value, this.monthPicker.value - 1]).daysInMonth();
            var oldIndex = this.dayPicker.getIndex();
            this.dayPicker.render({
                data : generateDateRange(1, days)
            });
            this.dayPicker.gotoIndex(oldIndex || 0);
        },

        // 选择日期，当选择了年月之后，也会触发日期的选择
        handleDayPick : function () {
            this.date = moment([this.yearPicker.value, this.monthPicker.value - 1, this.dayPicker.value]);
            this.$el.find('.date-title').text(this.date.format('YYYY-MM-DD ddd'));
            this.renderFestival();
        },

        // 渲染日期
        renderFestival : function () {
            if (moment().startOf('day').isSame(this.date)) {
                // 今天
                this.$el.find('.date-descr').text('今天');
            } else {
                this.$el.find('.date-descr').text('');
            }
        }
    };

    // 类方法，用于为 input text 提供日历的效果
    DatePicker.create = function (elements) {
        if (!DatePicker.instance) {
            // 只有一个实例，服务所有输入框
            DatePicker.instance = new DatePicker();
            DatePicker.instance.on('submit', function (date) {
            	$(DatePicker.relatedInput)
            	.val(date.format('YYYY-MM-DD'))
                .attr('formnovalidate', false)
                .trigger('change');
//              让input发生校验
            });
        }

        $(elements).focus(function () {
            if (this.readOnly || this.disabled) {
                return;
            }
            // 取消校验
            $(this).attr('formnovalidate', true);

            // 不显示键盘， blur可能不生效所以 hack一下
            this.blur();
            this.disabled = true;
            var _this = this;
            setTimeout(function () {
                _this.disabled = false;
            }, 1);

            // 显示日历
            DatePicker.instance.show({date : this.value});
            DatePicker.relatedInput = this;
        });
    };

    moment.lang('zh', {
        weekdaysShort : '周日 周一 周二 周三 周四 周五 周六'.split(' ')
    });

    // 生成一种特定格式的数组用于 ScrollPicker
    // 形如 [['01', 1], ['02', 2], ... ['12', 12]]
    function generateDateRange(start, end) {
        return _.map(_.range(start, end + 1), function (i) {
            var text = i > 9 ? i : '0' + i;
            return [text, i];
        });
    }

    return DatePicker;
});
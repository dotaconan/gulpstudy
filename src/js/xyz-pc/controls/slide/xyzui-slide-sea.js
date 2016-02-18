/**
 * Created by lucheng0902 on 2016/1/5.
 */
define(function (require, exports, module) {
    //依赖模块jquery
    var $ = require('$');

    function Slide(element, options) {
        this.$element = $(element);
        this.options = $.extend({}, Slide.DEFAULTS, $(element).data(), options);
        this.init();
    };
    Slide.DEFAULTS = {
        //自动播放
        autoRun: false,
        //切换间隔时间
        interval: 2000,
        //动画持续时间
        speed: 250,
        //切换动画效果
        effect: 'move',//none,fade,move
        //事件触发方式
        trigger: 'mousedown',//mousedown,mouseover
        //模板
        template: '<a class="arrow prev" href="javascript:;"></a><a class="arrow next" href="javascript:;"></a><div class="number"></div>'
    };
    //初始化
    Slide.prototype.init = function () {
        this.autoRun = this.$element.attr('data-slide-autoRun') || this.options.autoRun;
        this.interval = this.$element.attr('data-slide-interval') || this.options.interval;
        this.speed = this.$element.attr('data-slide-speed') || this.options.speed;
        this.effect = this.$element.attr('data-slide-effect') || this.options.effect;
        this.trigger = this.$element.attr('data-slide-trigger') || this.options.trigger;
        this.template = this.options.template;
        //单个滚动元素的宽度
        this.width = this.$element.find("ul li").width();
        //单个滚动元素的高度
        this.height = this.$element.find("ul li").height();
        //所有滚动元素的个数
        this.number = this.$element.find("ul li").size();
        this.creatDom();
        this.event();
    };
    //DOM构建
    Slide.prototype.creatDom = function () {
        this.setCurrentObj(0);
        this.$element.append(this.template).attr({'onselectstart': 'return false', 'unselecttable': 'on'});
    };
    //绑定事件集合
    Slide.prototype.event = function () {
        this.arrowEvent();
        this.navigationEvent();
        //自动播放初始化
        if (this.autoRun) {
            var _this = this;
            _this.autoPlay(_this.getCurrentIndex());
            _this.$element.hover(function () {//鼠标移入暂停自动播放
                clearInterval(_this.startPlay);
            }, function () {//移出继续自动播放
                _this.autoPlay(_this.getCurrentIndex());
            });
        }
    };
    //获取当前显示对象的索引值
    Slide.prototype.getCurrentIndex = function () {
        return this.$element.find("ul li:visible").index();
    };
    //设置当前显示对象
    Slide.prototype.setCurrentObj = function (index) {
        switch (this.effect) {
            case 'none':
                this.$element.find("ul li:eq(" + index + ")").show().siblings('li').hide();
                break;
            case 'fade':
                this.$element.find("ul li:eq(" + index + ")").fadeIn(this.speed).siblings('li').fadeOut(this.speed);
                break;
            case 'move':
                var current = this.getCurrentIndex();
                if (current > index) {//向左滚动
                    var left = -this.width;
                } else {//向右滚动
                    var left = this.width;
                }
                this.$element.find("ul li:eq(" + index + ")").css('left', left).show().animate({'left': 0}, this.speed);
                this.$element.find("ul li:eq(" + current + ")").animate({'left': -left}, this.speed, function () {
                    $(this).hide().css('left', 0)
                });
                break;
        }
    };
    //设置当前标记对象
    Slide.prototype.setCurrentNavigation = function (index) {
        this.$element.find(".number span:eq(" + index + ")").addClass('current').siblings('span').removeClass('current');
    };
    //箭头事件绑定
    Slide.prototype.arrowEvent = function () {
        var _this = this;
        this.$element.on(this.trigger, '.arrow.prev', function () {
            var i = _this.getCurrentIndex();
            if (i == 0) {
                i = _this.number
            }
            _this.switchover(i - 1);
        });
        this.$element.on(this.trigger, '.arrow.next', function () {
            var i = _this.getCurrentIndex();
            if (i == _this.number - 1) {
                i = -1
            }
            _this.switchover(i + 1);
        });
    };
    //导航标记事件绑定
    Slide.prototype.navigationEvent = function () {
        var _this = this;
        //构建DOM结构
        for (var a = 1; a <= this.number; a++) {
            this.$element.find(".number").append('<span title="第' + a + '张"></span>');
        }
        //标记状态初始化
        this.setCurrentNavigation(0);
        //标记绑定事件
        this.$element.on(this.trigger, '.number span', function () {
            _this.switchover($(this).index());
        });
    }
    //自动播放函数
    Slide.prototype.autoPlay = function (i) {
        var _this = this;
        _this.startPlay = setInterval(function () {
            if (i < _this.number - 1) {
                i++
            } else {
                i = 0
            }
            _this.switchover(i);
        }, _this.interval);
    };
    //切换事件函数
    Slide.prototype.switchover = function (i) {
        if (this.$element.find("ul li:animated").size() == 0) {//上一轮动画执行完才能执行下一轮动画
            this.setCurrentObj(i)
            this.setCurrentNavigation(i);
        }
    };
    //data初始化
    $(function () {
        $('[data-toggle=Slide]').Slide();
    });
    //组件封装处理
    function Plugin(option) {
        var args = Array.prototype.slice.call(arguments, 1)
        var returnValue = this;
        this.each(function () {
            var $this = $(this),
                data = $this.data('hc.Slide'),
                options = typeof option === 'object' && option;
            if (!data) {
                $this.data('hc.Slide', (data = new Slide($this, options)));
            }
            if (typeof option === 'string') {
                returnValue = data[option].apply(data, args);
            }
        });
        return returnValue;
    };
    var old = $.fn.Slide;
    $.fn.Slide = Plugin;
    $.fn.Slide.Constructor = Slide;
    $.fn.Slide.noConflict = function () {
        $.fn.Slide = old;
        return this;
    };
    module.exports = Slide;
    return Slide;
});
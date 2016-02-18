/**
 * Created by lucheng0902 on 2016/1/5.
 */
define(function (require, exports, module) {
    //依赖模块jquery
    var $ = require('$');

    //构造函数
    var Drag = function (element, options) {
        this.$element = $(element);
        this.options = $.extend({}, Drag.DEFAULTS, $(element).data(), options);
        this.init();
    };
    Drag.DEFAULTS = {
        //拖动对象手柄
        handle: null,
        //拖动的方向
        axis: null,//横向:'X'，纵向:'Y'，，区分大小写，默认:null无限制
        //拉杆槽对象
        groove: null,
        //拖动的范围
        scope: null,//传入父级jquery对象，默认以浏览器窗口为界
        //鼠标指针形状
        cursor: 'move',
        //拖动开始的回调
        onStart: function () {
        },
        //拖动中的回调
        onDrag: function () {
        },
        //拖动完成的回调
        onEnd: function () {
        }
    };
    //初始化
    Drag.prototype.init = function () {
        this.$handle = this.options.handle ? this.options.handle : this.$element;//不传入手柄对象则拖动对象为其本身
        this.axis = this.options.axis;
        this.$scope = this.options.scope;
        this.groove = this.options.groove;
        this.onStart = this.options.onStart;
        this.onDrag = this.options.onDrag;
        this.onEnd = this.options.onEnd;
        this.$handle.css('cursor', this.options.cursor);
        this.mouseDown();
    };
    //拖动开始
    Drag.prototype.mouseDown = function () {
        var _this = this;
        this.$handle.bind('mousedown', function (e) {
            _this.startX = e.clientX;
            _this.startY = e.clientY;
            _this.distanceX = 0;
            _this.distanceY = 0;
            _this.startLeft = _this.$element.offset().left;
            _this.startTop = _this.$element.offset().top;
            _this.packLeft = _this.startLeft - _this.$element.position().left;
            _this.packTop = _this.startTop - _this.$element.position().top;
            _this.nowLeft = _this.startLeft;
            _this.nowTop = _this.startTop;
            _this.objWidth = _this.$element.outerWidth();
            _this.objHeight = _this.$element.outerHeight();
            _this.$scopeWidth = _this.$scope ? _this.$scope.outerWidth() : $(window).width();
            _this.$scopeHeight = _this.$scope ? _this.$scope.outerHeight() : $(window).height();
            _this.$scopeLeft = _this.$scope ? _this.$scope.offset().left : 0;
            _this.$scopeTop = _this.$scope ? _this.$scope.offset().top : 0;
            _this.onStart.call(_this.$element, _this.$element);
            $(document).bind({
                'mousemove': function () {
                    _this.mouseMove()
                }, 'mouseup': function () {
                    _this.mouseUp()
                }
            });
            e.preventDefault();
        });
    };
    //拖动中
    Drag.prototype.mouseMove = function () {
        var currentX = event.clientX,
            currentY = event.clientY,
            distanceX = currentX - this.startX,
            distanceY = currentY - this.startY;
        //判断轴向
        switch (this.axis) {
            case 'X':
                this.nowLeft = this.startLeft + distanceX;
                break;
            case 'Y':
                this.nowTop = this.startTop + distanceY;
                break;
            default:
                this.nowLeft = this.startLeft + distanceX;
                this.nowTop = this.startTop + distanceY;
                break;
        }
        //判断边界
        this.nowLeft = this.nowLeft + this.objWidth > this.$scopeWidth + this.$scopeLeft ? this.$scopeWidth + this.$scopeLeft - this.objWidth : this.nowLeft > this.$scopeLeft ? this.nowLeft : this.$scopeLeft;
        this.nowTop = this.nowTop + this.objHeight > this.$scopeHeight + this.$scopeTop ? this.$scopeHeight + this.$scopeTop - this.objHeight : this.nowTop > this.$scopeTop ? this.nowTop : this.$scopeTop;
        //回调
        this.onDrag.call(this.$element, this.$element);
        //赋值
        this.$element.css({
            'left': this.axis == 'Y' ? null : this.nowLeft - this.packLeft,
            'top': this.axis == 'X' ? null : this.nowTop - this.packTop
        });
        if (this.axis == 'Y') {
            this.$scope.find(this.groove).height(this.$scope.height() - parseInt(this.$element.css('top')));
        } else {
            this.$scope.find(this.groove).width(this.$element.css('left'));
        }
    };
    //拖动结束
    Drag.prototype.mouseUp = function (e) {
        $(document).unbind('mousemove mouseup');
        this.onEnd.call(this.$element, this.$element);
    };
    //设置拖动点位置百分比(单点拉杆效果)
    Drag.prototype.setPercent = function (percent) {
        switch (this.axis) {
            case 'X':
                this.$element.css('left', (this.$scope.outerWidth() - this.$element.outerWidth()) * percent);
                this.$scope.find(this.groove).width((this.$scope.outerWidth() - this.$element.outerWidth()) * percent);
                break;
            case 'Y':
                this.$element.css('top', (this.$scope.outerHeight() - this.$element.outerHeight()) * percent);
                this.$scope.find(this.groove).height((this.$scope.outerWidth() - this.$element.outerWidth()) * percent);
                break;
        }
    };
    //获取拖动点位置百分比(单点拉杆效果)
    Drag.prototype.getPercent = function () {
        var percent;
        switch (this.axis) {
            case 'X':
                percent = parseInt(this.$element.css('left')) / (this.$scope.outerWidth() - this.$element.outerWidth());
                break;
            case 'Y':
                percent = 1 - parseInt(this.$element.css('top')) / (this.$scope.outerHeight() - this.$element.outerHeight());
                break;
        }
        return percent;
    };

    // 对外提供对象
    module.exports = Drag;
    //return Drag
});//end CMD
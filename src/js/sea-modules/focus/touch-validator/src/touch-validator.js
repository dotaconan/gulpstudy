/**
 * 触屏版校验器，与 jq validator 保持配置兼容
 * @author geliang
 */
define(function (require, exports, module) {
    var _ = require('underscore');
    var $ = require('$');
    var Util = require('./touch-validator-util');
    var RuleMethods = require('./touch-validator-methods');

    var Validator = function (selector, options) {
        _.bindAll(this);

        this.$form = $(selector);
        this.settings = _.extend({}, Validator.defaults, options);

        this.storeRules();
        this.init();
    };

    _.extend(Validator.prototype, {

        // 保存规则
        storeRules : function () {
            this.rules = this.settings.rules || {};
            _.each(this.rules, function (value, key) {
                this.rules[key] = Util.normalizeRule(value);
            }, this);
        },

        init : function () {
            this.valueCache = {};
            this.pendingRequest = 0;
            this.ajaxRequests = {};
            this.pending = {};
            this.reset();

            this.$form.on('focusin focusout', '[type="text"], [type="password"], [type="file"], select, textarea, ' +
                '[type="number"], [type="search"] ,[type="tel"], [type="url"], ' +
                '[type="email"], [type="datetime"], [type="date"], [type="month"], ' +
                '[type="week"], [type="time"], [type="datetime-local"], ' +
                '[type="range"], [type="color"] ', this.handleFieldEvent);
            this.$form.on('click', '[type="radio"], [type="checkbox"], select, option', this.handleFieldEvent);
            this.$form.prop('noValidate', true).on('submit', this.handleSubmit);
        },

        // 处理表单域的事件
        handleFieldEvent : function (e) {
            var eventType = 'on' + e.type;
            if (this.settings[eventType]) {
                this.settings[eventType].call(this, e.target, e);
            }
        },

        // 处理表单提交
        handleSubmit : function (e) {
            if (this.validateForm()) {
                // 如果有ajax尚未返回
                if (this.pendingRequest > 0) {
                    this.formNeedSubmit = true; // 标识表单需要提交
                    return false;
                }

                if (this.settings.submitHandler) {
                    this.settings.submitHandler.call(this, this.$form[0], e);
                    return false;
                }
            } else {
                return false;
            }
        },

        // 校验整个表单，若未通过则显示错误提示
        validateForm : function () {
            var result = this.checkForm();
            this.errors().hide();
            if (!result) {
                this.showErrors();
            }
            return result;
        },

        // 校验一个元素，若未通过则显示错误提示
        // http://docs.jquery.com/Plugins/Validation/Validator/element
        validateElement : function (element) {
            if ($(element).is(this.settings.ignore)) {
                return true;
            }
            element = this.validationTargetFor(element);
            this.reset();
            var result = this.check(element);
            if (result) {
                this.errorsFor(element).hide();
				$(element).parents('.item').removeClass('highlight');
            } else {
                this.showErrors();
            }
            return result;
        },

        // 校验元素，返回校验结果true/false，同时会将
        check : function (element) {
            element = this.validationTargetFor(element);
            var rules = this.rulesFor(element);
            var val = $(element).val();

            for (var method in rules) {
                var rule = { method : method, parameters : rules[method] };
                try {
                    var result = Validator.methods[method].call(this, val, element, rule.parameters);

                    if (result === "pending") {
                        return true;
                    }

                    if (!result) {
                        this.addError(element, rule);
                        return false;
                    }
                } catch (e) {
                    if (this.settings.debug && window.console) {
                        console.log("exception occured when checking element " + element.id + ", check the '" + rule.method + "' method", e);
                    }
                    throw e;
                }
            }
            return true;
        },

        // 校验整个表单
        checkForm : function () {
            this.reset();
            _.each(this.allElements(), function (element) {
                this.check(element);
            }, this);
            return this.errorList.length === 0;
        },

        // 展示错误提示
        showErrors : function (errors) {
            // 高亮
            if (this.settings.highlight) {
                _.each(this.errorList, function (error) {
                    this.settings.highlight.call(this, error.element);
                }, this);
            }
            // 去除高亮
            if (this.settings.unhighlight) {
                var errorElements = _(this.errorList).map(function (v) {
                    return v.element;
                });
                _(this.allElements().not(errorElements)).each(function (element) {
                    this.settings.unhighlight.call(this, element);
                }, this);
            }
            this.settings.showErrors.call(this);
        },

        // 将错误信息添加到全局缓存中，以便后续处理
        addError : function (element, rule) {
            var message = this.messageFor(element, rule);
            this.errorList.push({
                message : message,
                element : element
            });
            this.errorMap[element.name] = message;
        },


        // 获取针对元素某校验方法的错误提示
        messageFor : function (element, rule) {
            var message = this.settings.messages[element.name];
            if (typeof message === 'object') {
                message = message[rule.method];
            }
            if (!message) {
                message = Validator.methodMessages[rule.method] || '缺少错误提示';
            }

            // 处理 function 与格式化
            var msgReg = /\$?\{(\d+)\}/g;
            if (typeof message === "function") {
                message = message.call(this, rule.parameters, element);
            } else if (msgReg.test(message)) {
                message = Validator.formatMessage(message.replace(msgReg, '{$1}'), rule.parameters);
            }
            return message;
        },

        // 获取所有表单域元素
        allElements : function () {
            var rulesCache = {};
            var _this = this;

            // select all valid inputs inside the form (no submit or reset buttons)
            var elements = this.$form
                .find("input, select, textarea")
                .not('[type="submit"], [type="reset"], [type="image"], [disabled]')
                .not(this.settings.ignore)
                .filter(function () {
                    // select only the first element for each name, and only those with rules specified
                    if (this.name in rulesCache || _.isEmpty(_this.rulesFor(this))) {
                        return false;
                    } else {
                        rulesCache[this.name] = true;
                        return true;
                    }
                });
            return elements;
        },

        // 获取元素上所有的校验规则
        rulesFor : function (element) {
            var data = _.extend({}, this.rules[element.name]);

            // make sure required is at front
            if (data.required) {
                var param = data.required;
                delete data.required;
                data = $.extend({required : param}, data);
            }
            return data;
        },

        validationTargetFor : function (element) {
            // if radio/checkbox, validate first element in group instead
            if (Util.checkable(element)) {
                element = Util.findByName(element).not(this.settings.ignore)[0];
            }
            return element;
        },

        reset : function () {
            this.errorList = [];
            this.errorMap = {};
            this.currentElements = $([]);
        },

        // 获取元素对应的错误提示
        errorsFor : function (element) {
            var name = this.idOrName(element);
            return this.errors().filter('[for="' + name + '"]');
        },

        idOrName : function (element) {
            return Util.checkable(element) ? element.name : element.id || element.name;
        },

        // 所有的错误提示
        errors : function () {
            var errorClass = this.settings.errorClass.replace(' ', '.');
            return $(this.settings.errorElement + "." + errorClass, this.$form);
        },

        // 显示错误提示标签
        showErrorLabel : function (element, message) {
            var label = this.errorsFor(element);
            if (label.length > 0) {
                // refresh error/success class
                label.html(message || '').show();
            } else {
                // create label
                label = $('<' + this.settings.errorElement + '/>')
                    .attr('for', this.idOrName(element))
                    .addClass(this.settings.errorClass)
                    .html(message || '');
                if (this.settings.errorPlacement) {
                    this.settings.errorPlacement.call(this, label, $(element));
                } else {
                  label.insertAfter(element);
                }
            }
        },

        startRequest : function (element) {
            if (!this.pending[element.name]) {
                this.pendingRequest++;
                this.pending[element.name] = true;
            }
        },

        stopRequest : function (element, valid) {
            this.pendingRequest--;
            // sometimes synchronization fails, make sure pendingRequest is never < 0
            if (this.pendingRequest < 0) {
                this.pendingRequest = 0;
            }
            delete this.pending[element.name];
            if (valid && this.pendingRequest === 0 && this.formNeedSubmit && this.checkForm()) {
                this.$form.submit();
                this.formNeedSubmit = false;
            } else if (!valid && this.pendingRequest === 0 && this.formNeedSubmit) {
                this.formNeedSubmit = false;
            }
        },

        previousValue : function (element) {
            var data = $(element).data('previousValue');
            if (!data) {
                var defaultValue = {
                    old : null,
                    valid : true
                };
                $(element).data('previousValue', JSON.stringify(defaultValue));
            }
            return !!data ? JSON.parse(data) : defaultValue;
        }
    });

    _.extend(Validator, {
        defaults : {
            errorClass : "error",
            errorElement : "label",
            ignore : 'null', // magic
            messages : {},
	        highlight : function(element){
				$(element).parents('.item').addClass('highlight');
			},
			unhighlight : false,
//	        unhighlight : function(element){
//				$(element).parents('.item').removeClass('highlight');
//			},
			errorPlacement : function(label, element){
				element.parents('.item').after(label);
			},

            onfocusout : function (element, event) {
                if (!Util.checkable(element)) {
                    this.validateElement(element);
                }
            },

            showErrors : function () {
                _.each(this.errorList, function (error) {
                    this.showErrorLabel(error.element, error.message);
                }, this);
            }
        },

        // http://docs.jquery.com/Plugins/Validation/Validator/addMethod
        addMethod : function (name, method, message) {
            Validator.methods[name] = method;
            Validator.methodMessages[name] = message;
        },

        // http://docs.jquery.com/Plugins/Validation/Validator/setDefaults
        setDefaults : function (settings) {
            _.extend(this.defaults, settings);
        }
    }, RuleMethods, Util);

    return Validator;
});
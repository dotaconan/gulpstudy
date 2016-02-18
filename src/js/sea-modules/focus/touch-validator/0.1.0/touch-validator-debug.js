/**
 * 触屏版校验框架的工具方法
 * @author geliang
 */
define("focus/touch-validator/0.1.0/touch-validator-util-debug", [ "$-debug" ], function(require, exports, module) {
    var $ = require("$-debug");
    var Util = {
        // Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
        normalizeRule: function(data) {
            if (typeof data === "string") {
                var transformed = {};
                $.each(data.split(/\s/), function() {
                    transformed[this] = true;
                });
                data = transformed;
            }
            return data;
        },
        // 是不是 单选/复选
        checkable: function(element) {
            return /radio|checkbox/i.test(element.type);
        },
        // rules中的依赖处理
        depend: function(param, element) {
            switch (typeof param) {
              case "boolean":
                return param;

              case "string":
                return $(param, element.form).length > 0;

              case "function":
                return param(element);

              default:
                return true;
            }
        },
        // 根据元素类型取值
        elementValue: function(element) {
            var type = $(element).attr("type");
            var val = $(element).val();
            if (type === "radio" || type === "checkbox") {
                val = $('input[name="' + $(element).attr("name") + '"]:checked').val();
            } else {
                if (typeof val === "string") {
                    val = val.replace(/\r/g, "");
                }
            }
            return val;
        },
        // 根据元素name找所有的元素
        findByName: function(element) {
            return $('[name="' + element.name + '"]', element.form);
        },
        // 获取文本框内容长度，或者多选框被选中项的个数
        getLength: function(value, element) {
            switch (element.nodeName.toLowerCase()) {
              case "select":
                return $("option:selected", element).length;

              case "input":
                if (this.checkable(element)) {
                    return this.findByName(element).filter(":checked").length;
                } else {
                    return value.length;
                }
            }
        },
        // 格式化错误信息，将 {0} 之类的进行替换
        formatMessage: function(source, params) {
            if (params.constructor !== Array) {
                params = [ params ];
            }
            $.each(params, function(i, n) {
                source = source.replace(new RegExp("\\{" + i + "\\}", "g"), n);
            });
            return source;
        }
    };
    return Util;
});

/**
 * 触屏版校验框架的校验方法
 * @author geliang
 */
define("focus/touch-validator/0.1.0/touch-validator-methods-debug", [ "./touch-validator-util-debug", "$-debug", "underscore-debug" ], function(require, exports, module) {
    var $ = require("$-debug");
    var _ = require("underscore-debug");
    var Util = require("./touch-validator-util-debug");
    var RuleMethods = {
        methods: {
            // http://docs.jquery.com/Plugins/Validation/Methods/required
            required: function(value, element, param) {
                // check if dependency is met
                if (!Util.depend(param, element)) {
                    return true;
                }
                if (element.nodeName.toLowerCase() === "select") {
                    // could be an array for select-multiple or a string, both are fine this way
                    var val = $(element).val();
                    return val && val.length > 0;
                } else if (Util.checkable(element)) {
                    return Util.getLength(value, element) > 0;
                } else {
                    return $.trim(value).length > 0;
                }
            },
            // http://docs.jquery.com/Plugins/Validation/Methods/remote
            remote: function(value, element, param) {
                if (RuleMethods.optional(element)) {
                    return true;
                }
                if (this.pending[element.name]) {
                    return "pending";
                }
                var previous = this.previousValue(element);
                if (previous.old === value) {
                    return previous.valid;
                }
                previous.old = value;
                var validator = this;
                this.startRequest(element);
                param = typeof param === "string" ? {
                    url: param
                } : param;
                var data = {};
                data[element.name] = value;
                $.ajax($.extend({
                    uid: "validate" + element.name,
                    dataType: "json",
                    data: data,
                    // 防止同一时间多次发送，会将上一次的发送abort掉
                    beforeSend: function(xhr, settings) {
                        if (validator.ajaxRequests[settings.uid]) {
                            validator.ajaxRequests[settings.uid].abort();
                        }
                        validator.ajaxRequests[settings.uid] = xhr;
                    },
                    success: function(response) {
                        var valid = response === true || response === "true";
                        if (valid) {
                            validator.errorsFor(element).hide();
                        } else {
                            if (!validator.settings.messages[element.name]) {
                                validator.settings.messages[element.name] = {};
                            }
                            previous.message = validator.settings.messages[element.name].remote = response;
                            validator.addError(element, {
                                method: "remote"
                            });
                            validator.showErrors();
                        }
                        previous.valid = valid;
                        $(element).data("previousValue", JSON.stringify(previous));
                        validator.stopRequest(element, valid);
                    }
                }, param));
                return "pending";
            },
            // http://docs.jquery.com/Plugins/Validation/Methods/minlength
            minlength: function(value, element, param) {
                var length = _.isArray(value) ? value.length : Util.getLength($.trim(value), element);
                return RuleMethods.optional(element) || length >= param;
            },
            // http://docs.jquery.com/Plugins/Validation/Methods/maxlength
            maxlength: function(value, element, param) {
                var length = _.isArray(value) ? value.length : Util.getLength($.trim(value), element);
                return RuleMethods.optional(element) || length <= param;
            },
            // http://docs.jquery.com/Plugins/Validation/Methods/rangelength
            rangelength: function(value, element, param) {
                var length = _.isArray(value) ? value.length : Util.getLength($.trim(value), element);
                return RuleMethods.optional(element) || length >= param[0] && length <= param[1];
            },
            // http://docs.jquery.com/Plugins/Validation/Methods/min
            min: function(value, element, param) {
                return RuleMethods.optional(element) || parseInt(value) >= Util.depend(param, element);
            },
            // http://docs.jquery.com/Plugins/Validation/Methods/max
            max: function(value, element, param) {
                return RuleMethods.optional(element) || parseInt(value) <= Util.depend(param, element);
            },
            // http://docs.jquery.com/Plugins/Validation/Methods/range
            range: function(value, element, param) {
                return RuleMethods.optional(element) || value >= param[0] && value <= param[1];
            },
            // http://docs.jquery.com/Plugins/Validation/Methods/email
            email: function(value, element) {
                // contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
                return RuleMethods.optional(element) || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(value);
            },
            // http://docs.jquery.com/Plugins/Validation/Methods/equalTo
            equalTo: function(value, element, param) {
                var target = $(param);
                return value === target.val();
            }
        },
        methodMessages: {
            required: "请填写该字段",
            remote: "请修正该字段",
            email: "请输入正确的Email",
            url: "请输入正确的URL",
            number: "请输入合法的数字",
            digits: "请输入数字",
            equalTo: "请再次输入相同的值",
            maxlength: "请输入长度最大为{0}的字符串",
            minlength: "请输入长度至少为{0}的字符串",
            rangelength: "请输入长度在{0}到{1}之间的字符串",
            range: "请输入介于{0}和{1}之间的数字",
            max: "请输入最大为{0}的数字",
            min: "请输入最小为{0}的数字"
        },
        // 是否为空
        optional: function(element) {
            var val = Util.elementValue(element);
            return !RuleMethods.methods.required.call(this, val, element);
        }
    };
    return RuleMethods;
});

/**
 * 触屏版校验器，与 jq validator 保持配置兼容
 * @author geliang
 */
define("focus/touch-validator/0.1.0/touch-validator-debug", [ "./touch-validator-util-debug", "./touch-validator-methods-debug", "underscore-debug", "$-debug" ], function(require, exports, module) {
    var _ = require("underscore-debug");
    var $ = require("$-debug");
    var Util = require("./touch-validator-util-debug");
    var RuleMethods = require("./touch-validator-methods-debug");
    var Validator = function(selector, options) {
        _.bindAll(this);
        this.$form = $(selector);
        this.settings = _.extend({}, Validator.defaults, options);
        this.storeRules();
        this.init();
    };
    _.extend(Validator.prototype, {
        // 保存规则
        storeRules: function() {
            this.rules = this.settings.rules || {};
            _.each(this.rules, function(value, key) {
                this.rules[key] = Util.normalizeRule(value);
            }, this);
        },
        init: function() {
            this.valueCache = {};
            this.pendingRequest = 0;
            this.ajaxRequests = {};
            this.pending = {};
            this.reset();
            this.$form.on("focusin focusout", '[type="text"], [type="password"], [type="file"], select, textarea, ' + '[type="number"], [type="search"] ,[type="tel"], [type="url"], ' + '[type="email"], [type="datetime"], [type="date"], [type="month"], ' + '[type="week"], [type="time"], [type="datetime-local"], ' + '[type="range"], [type="color"] ', this.hanldeFieldEvent);
            this.$form.on("click", '[type="radio"], [type="checkbox"], select, option', this.hanldeFieldEvent);
            this.$form.prop("noValidate", true).on("submit", this.handleSubmit);
        },
        // 处理表单域的事件
        hanldeFieldEvent: function(e) {
            var eventType = "on" + e.type;
            if (this.settings[eventType]) {
                this.settings[eventType].call(this, e.target, e);
            }
        },
        // 处理表单提交
        handleSubmit: function(e) {
            if (this.validateForm()) {
                // 如果有ajax尚未返回
                if (this.pendingRequest > 0) {
                    this.formNeedSubmit = true;
                    // 标识表单需要提交
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
        validateForm: function() {
            var result = this.checkForm();
            this.errors().hide();
            if (!result) {
                this.showErrors();
            }
            return result;
        },
        // 校验一个元素，若未通过则显示错误提示
        // http://docs.jquery.com/Plugins/Validation/Validator/element
        validateElement: function(element) {
            if ($(element).is(this.settings.ignore)) {
                return true;
            }
            element = this.validationTargetFor(element);
            this.reset();
            var result = this.check(element);
            if (result) {
                this.errorsFor(element).hide();
            } else {
                this.showErrors();
            }
            return result;
        },
        // 校验元素，返回校验结果true/false，同时会将
        check: function(element) {
            element = this.validationTargetFor(element);
            var rules = this.rulesFor(element);
            var val = $(element).val();
            for (var method in rules) {
                var rule = {
                    method: method,
                    parameters: rules[method]
                };
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
        checkForm: function() {
            this.reset();
            _.each(this.allElements(), function(element) {
                this.check(element);
            }, this);
            return this.errorList.length === 0;
        },
        // 展示错误提示
        showErrors: function(errors) {
            // 高亮
            if (this.settings.highlight) {
                _.each(this.errorList[i], function(error) {
                    this.settings.highlight.call(this, error.element);
                }, this);
            }
            // 去除高亮
            if (this.settings.unhighlight) {
                var errorElements = _(this.errorList).map(function() {
                    return this.element;
                });
                _(this.allElements().not(errorElements)).each(function(element) {
                    this.settings.unhighlight.call(this, element);
                }, this);
            }
            this.settings.showErrors.call(this);
        },
        // 将错误信息添加到全局缓存中，以便后续处理
        addError: function(element, rule) {
            var message = this.messageFor(element, rule);
            this.errorList.push({
                message: message,
                element: element
            });
            this.errorMap[element.name] = message;
        },
        // 获取针对元素某校验方法的错误提示
        messageFor: function(element, rule) {
            var message = this.settings.messages[element.name];
            if (typeof message === "object") {
                message = message[rule.method];
            }
            if (!message) {
                message = Validator.methodMessages[rule.method] || "缺少错误提示";
            }
            // 处理 function 与格式化
            var msgReg = /\$?\{(\d+)\}/g;
            if (typeof message === "function") {
                message = message.call(this, rule.parameters, element);
            } else if (msgReg.test(message)) {
                message = Validator.formatMessage(message.replace(msgReg, "{$1}"), rule.parameters);
            }
            return message;
        },
        // 获取所有表单域元素
        allElements: function() {
            var rulesCache = {};
            var _this = this;
            // select all valid inputs inside the form (no submit or reset buttons)
            var elements = this.$form.find("input, select, textarea").not('[type="submit"], [type="reset"], [type="image"], [disabled]').not(this.settings.ignore).filter(function() {
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
        rulesFor: function(element) {
            var data = _.extend({}, this.rules[element.name]);
            // make sure required is at front
            if (data.required) {
                var param = data.required;
                delete data.required;
                data = $.extend({
                    required: param
                }, data);
            }
            return data;
        },
        validationTargetFor: function(element) {
            // if radio/checkbox, validate first element in group instead
            if (Util.checkable(element)) {
                element = Util.findByName(element).not(this.settings.ignore)[0];
            }
            return element;
        },
        reset: function() {
            this.errorList = [];
            this.errorMap = {};
            this.currentElements = $([]);
        },
        // 获取元素对应的错误提示
        errorsFor: function(element) {
            var name = this.idOrName(element);
            return this.errors().filter('[for="' + name + '"]');
        },
        idOrName: function(element) {
            return Util.checkable(element) ? element.name : element.id || element.name;
        },
        // 所有的错误提示
        errors: function() {
            var errorClass = this.settings.errorClass.replace(" ", ".");
            return $(this.settings.errorElement + "." + errorClass, this.$form);
        },
        // 显示错误提示标签
        showErrorLabel: function(element, message) {
            var label = this.errorsFor(element);
            if (label.length > 0) {
                // refresh error/success class
                label.html(message || "").show();
            } else {
                // create label
                label = $("<" + this.settings.errorElement + "/>").attr("for", this.idOrName(element)).addClass(this.settings.errorClass).html(message || "");
                if (this.settings.errorPlacement) {
                    this.settings.errorPlacement.call(this, label, $(element));
                } else {
                    label.insertAfter(element);
                }
            }
        },
        startRequest: function(element) {
            if (!this.pending[element.name]) {
                this.pendingRequest++;
                this.pending[element.name] = true;
            }
        },
        stopRequest: function(element, valid) {
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
        previousValue: function(element) {
            var data = $(element).data("previousValue");
            if (!data) {
                var defaultValue = {
                    old: null,
                    valid: true
                };
                $(element).data("previousValue", JSON.stringify(defaultValue));
            }
            return !!data ? JSON.parse(data) : defaultValue;
        }
    });
    _.extend(Validator, {
        defaults: {
            errorClass: "error",
            errorElement: "label",
            ignore: "null",
            // magic
            messages: {},
            onfocusout: function(element, event) {
                if (!Util.checkable(element)) {
                    this.validateElement(element);
                }
            },
            showErrors: function() {
                _.each(this.errorList, function(error) {
                    this.showErrorLabel(error.element, error.message);
                }, this);
            }
        },
        // http://docs.jquery.com/Plugins/Validation/Validator/addMethod
        addMethod: function(name, method, message) {
            Validator.methods[name] = method;
            Validator.methodMessages[name] = message;
        },
        // http://docs.jquery.com/Plugins/Validation/Validator/setDefaults
        setDefaults: function(settings) {
            _.extend(this.defaults, settings);
        }
    }, RuleMethods, Util);
    return Validator;
});
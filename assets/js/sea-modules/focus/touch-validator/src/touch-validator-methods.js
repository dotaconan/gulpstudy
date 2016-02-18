/**
 * 触屏版校验框架的校验方法
 * @author geliang
 */
define(function (require, exports, module) {
    var $ = require('$');
    var _ = require('underscore');
    var Util = require('./touch-validator-util');

    var RuleMethods = {

        methods : {
            // http://docs.jquery.com/Plugins/Validation/Methods/required
            required : function (value, element, param) {
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
            remote : function (value, element, param) {
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

                param = typeof param === "string" ? {url : param} : param;
                var data = {};
                data[element.name] = value;
                $.ajax($.extend({
                    uid : "validate" + element.name,
                    dataType : "json",
                    data : data,
                    // 防止同一时间多次发送，会将上一次的发送abort掉
                    beforeSend : function (xhr, settings) {
                        if (validator.ajaxRequests[settings.uid]) {
                            validator.ajaxRequests[settings.uid].abort();
                        }
                        validator.ajaxRequests[settings.uid] = xhr;
                    },

                    success : function (response) {
                        var valid = response === true || response === "true";
                        if (valid) {
                            validator.errorsFor(element).hide();
                        } else {
                            if (!validator.settings.messages[element.name]) {
                                validator.settings.messages[element.name] = {};
                            }
                            previous.message = validator.settings.messages[element.name].remote = response;
                            validator.addError(element, {method : 'remote'});
                            validator.showErrors();
                        }
                        previous.valid = valid;
                        $(element).data('previousValue', JSON.stringify(previous));
                        validator.stopRequest(element, valid);
                    }
                }, param));
                return "pending";
            },

            // http://docs.jquery.com/Plugins/Validation/Methods/minlength
            minlength : function (value, element, param) {
                var length = _.isArray(value) ? value.length : Util.getLength($.trim(value), element);
                return RuleMethods.optional(element) || length >= param;
            },

            // http://docs.jquery.com/Plugins/Validation/Methods/maxlength
            maxlength : function (value, element, param) {
                var length = _.isArray(value) ? value.length : Util.getLength($.trim(value), element);
                return RuleMethods.optional(element) || length <= param;
            },

            // http://docs.jquery.com/Plugins/Validation/Methods/rangelength
            rangelength : function (value, element, param) {
                var length = _.isArray(value) ? value.length : Util.getLength($.trim(value), element);
                return RuleMethods.optional(element) || ( length >= param[0] && length <= param[1] );
            },

            // http://docs.jquery.com/Plugins/Validation/Methods/min
            min : function (value, element, param) {
                return RuleMethods.optional(element) || parseInt(value) >= Util.depend(param, element);
            },

            // http://docs.jquery.com/Plugins/Validation/Methods/max
            max : function (value, element, param) {
                return RuleMethods.optional(element) || parseInt(value) <= Util.depend(param, element);
            },

            // http://docs.jquery.com/Plugins/Validation/Methods/range
            range : function (value, element, param) {
                return RuleMethods.optional(element) || ( value >= param[0] && value <= param[1] );
            },

            // http://docs.jquery.com/Plugins/Validation/Methods/email
            email : function (value, element) {
                // contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
                return RuleMethods.optional(element) || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(value);
            },

            number : function (value, element) {
                return RuleMethods.optional(element) || /^\d+$/i.test(value);
            },

            // http://docs.jquery.com/Plugins/Validation/Methods/equalTo
            equalTo : function (value, element, param) {
                var target = $(param);
                return value === target.val();
            }
        },

        methodMessages : {
            required : '请填写该字段',
            remote : '请修正该字段',
            email : '请输入正确的Email',
            url : '请输入正确的URL',
            number : '请输入合法的数字',
            digits : '请输入数字',
            equalTo : '请再次输入相同的值',
            maxlength : '请输入长度最大为{0}的字符串',
            minlength : '请输入长度至少为{0}的字符串',
            rangelength : '请输入长度在{0}到{1}之间的字符串',
            range : '请输入介于{0}和{1}之间的数字',
            max : '请输入最大为{0}的数字',
            min : '请输入最小为{0}的数字'
        },

        // 是否为空
        optional : function (element) {
            var val = Util.elementValue(element);
            return !RuleMethods.methods.required.call(this, val, element);
        }
    };

    return RuleMethods;
});
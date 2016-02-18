/**
 * 触屏版校验框架的工具方法
 * @author geliang
 */
define(function (require, exports, module) {
    var $ = require('$');

    var Util = {

        // Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
        normalizeRule : function (data) {
            if (typeof data === "string") {
                var transformed = {};
                $.each(data.split(/\s/), function () {
                    transformed[this] = true;
                });
                data = transformed;
            }
            return data;
        },

        // 是不是 单选/复选
        checkable : function (element) {
            return (/radio|checkbox/i).test(element.type);
        },

        // rules中的依赖处理
        depend : function (param, element) {
            switch (typeof param) {
                case 'boolean':
                    return param;
                case 'string':
                    return $(param, element.form).length > 0;
                case 'function':
                    return param(element);
                default:
                    return true;
            }
        },

        // 根据元素类型取值
        elementValue : function (element) {
            var type = $(element).attr('type');
            var val = $(element).val();
            if (type === 'radio' || type === 'checkbox') {
                val = $('input[name="' + $(element).attr('name') + '"]:checked').val();
            } else {
                if (typeof val === 'string') {
                    val = val.replace(/\r/g, "");
                }
            }
            return val;
        },

        // 根据元素name找所有的元素
        findByName : function (element) {
            return $('[name="' + element.name + '"]', element.form);
        },

        // 获取文本框内容长度，或者多选框被选中项的个数
        getLength : function (value, element) {
            switch (element.nodeName.toLowerCase()) {
                case 'select':
                    return $("option:selected", element).length;
                case 'input':
                    if (this.checkable(element)) {
                        return this.findByName(element).filter(':checked').length;
                    } else {
                        return value.length;
                    }
            }
        },

        // 格式化错误信息，将 {0} 之类的进行替换
        formatMessage : function (source, params) {
            if (params.constructor !== Array) {
                params = [ params ];
            }
            $.each(params, function (i, n) {
                source = source.replace(new RegExp("\\{" + i + "\\}", "g"), n);
            });
            return source;
        }
    }

    return Util;
});
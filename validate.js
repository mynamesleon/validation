window.validation = window.validation || (function ($) {
    'use strict';

    var rules = {},
        app = {};

    rules = {

        alpha: function (val) {
            return (/^[a-zA-Z\s]+$/).test(val);
        },

        // https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
        email: function (val) {
            return (/^[a-zA-Z0-9.!#$%&'*+\/=?\^_`{|}~\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/).test(val);
        },

        min: function (val, min) {
            return parseFloat(val) >= parseInt(min, 10);
        },

        max: function (val, max) {
            return parseFloat(val) <= parseInt(max, 10);
        },

        match: function (val, match) {
            return val === match;
        },

        minlength: function (val, min) {
            return val.length >= parseInt(min, 10);
        },

        maxlength: function (val, max) {
            return val.length <= parseInt(max, 10);
        },

        // http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric#1830844
        number: function (val) {
            return !isNaN(parseFloat(val)) && isFinite(val);
        },

        checked: function () {

        },

        unchecked: function () {

        },

        required: function (val) {
            return val !== '' && val !== -1 && val !== null;
        },

        confirm: function (val, selector) {
            return val === $(selector).val();
        },

        regex: function (val, reg) {
            return new RegExp(reg).test(val);
        },

        date: function (val) {
            return !/Invalid|NaN/.test(new Date(val).toString());
        },

        // https://gist.github.com/dperini/729294
        url: function (val) {
            (/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[\/?#]\S*)?$/i).test(val);
        }
    };

    app = {

        /*
         * genererate full string of error classes based on an array of srings
         * @param a {array}
         * @return {string}
         */
        ruleClasses: function (a) {
            var i = 0,
                result = [],
                length = a.length;

            for (i = 0; i < length; i += 1) {
                result.push('failed-' + a[i].split(':')[0]);
            }

            return result.join(' ');
        },

        /*
         * get data from all inputs in the form
         * @param $form {jQuery object}
         * @param attribute {string} optional: attribute to use - defaults to name
         */
        getFormData: function ($form, attribute) {
            var data,
                $inputs;

            if (typeof $form !== 'object') {
                return;
            }

            // handle primary vars
            data = {};
            $inputs = $form.find('input, select, textarea');
            attribute = attribute || 'name';

            // value handling
            function getValue($input, attr) {
                var inputType = $input.attr('type');
                if (inputType === 'checkbox' || inputType === 'radio') {
                    // filter radios and checkboxes by selected attribute in case they are grouped
                    // default to -1 if no value can be found
                    return $inputs.filter('[' + attribute + '="' + attr + '"]').filter(':checked').val() || -1;
                } else {
                    return $input.val();
                }
            }

            // update data object with input value
            function setDataFromInput(index, elem) {
                var $input = $(elem),
                    attr = $input.attr(attribute),
                    currentDataPoint,
                    attrArray,
                    dataEntry,
                    value,
                    i;

                // do not proceed if attribute does not exist for that element
                if (typeof attr === 'undefined') {
                    return;
                }

                // data handling
                // handle recursive entry creation for chosen attribute
                if (attr.indexOf('.') > -1) {
                    currentDataPoint = data;
                    attrArray = attr.split('.');

                    for (i = 0; i < attrArray.length - 1; i += 1) {
                        if (typeof currentDataPoint[attrArray[i]] === 'undefined') {
                            currentDataPoint[attrArray[i]] = {};
                        }
                        currentDataPoint = currentDataPoint[attrArray[i]];
                    }

                    currentDataPoint[attrArray[attrArray.length - 1]] = getValue($input, attr);
                } else {
                    // standard case
                    data[attr] = getValue($input, attr);
                }
            }

            // call and return
            $inputs.each(setDataFromInput);
            return data;
        },

        validate: {

            /*
             * trigger validation on whole form - validates all set form elements
             * @param e {object}: event object
             */
            all: function (e) {
                var $holder = $(this),
                    $elems = $(this).find('[data-validation]');

                e.stopPropagation();
                $elems.each(app.validate.element);

                if ($elems.filter('.validation-failed').length) {
                    e.preventDefault();
                    $holder.addClass('validation-failed').triggerHandler('validation.failed', app.getFormData($holder));
                } else {
                    $holder.removeClass('validation-failed').triggerHandler('validation.passed', app.getFormData($holder));
                }
            },

            /*
             *
             */
            element: function (e) {
                var $el = $(this),
                    rulesString = $el.data('validation'),
                    rulesArray = rulesString.split(' '),
                    val = $el.val(),
                    result = true,
                    rulesLength,
                    currentRule,
                    funcToCall,
                    tempRule,
                    param,
                    i;

                if (typeof e === 'object') {
                    e.stopPropagation();
                }

                // handle required when value is empty
                if (val === '') {
                    // if element is marked as required, and value is empty, have it fail validation
                    if ((' ' + rulesString + ' ').indexOf(' required ') !== -1) {
                        result = 'required';
                    }
                } else {
                    rulesLength = rulesArray.length;

                    for (i = 0; i < rulesLength; i += 1) {
                        currentRule = rulesArray[i];
                        param = undefined;

                        if (currentRule.indexOf(':') > -1) {
                            tempRule = currentRule.split(':');

                            // use shift and join to handle multiple colons in value
                            currentRule = tempRule.shift();
                            param = tempRule.join(':');
                        }

                        funcToCall = rules[currentRule];

                        if (currentRule !== 'required' && currentRule !== '' && typeof funcToCall === 'function') {
                            if (funcToCall(val, param) === false) {
                                result = currentRule;
                                break;
                            }
                        }
                    }
                }

                // remove the rule classes e.g. failed-number
                $el.removeClass(app.ruleClasses(rulesArray));

                // toggle remaining needed classes and trigger validation event
                if (result === true) {
                    $el.removeClass('validation-failed').triggerHandler('validation.passed');
                } else {
                    $el.addClass('validation-failed failed-' + result).triggerHandler('validation.failed', result);
                }

                return result;
            }
        },

        /*
         * given holder element as context
         */
        prep: function () {
            var $form = $(this);

            if ($form.data('validation-bound') !== true) {
                // handle full submit
                if (this.nodeName === 'FORM') {
                    $form.on('submit', app.validate.all);
                } else {
                    $form.on('click', '.validation-trigger', app.validate.all);
                }

                // handle individual inputs
                $form.data('validation-bound', true)
                    .on('change', '[data-validation]', app.validate.element);
            }
        },

        /*
         *
         */
        apply: function () {
            $('[data-validation="true"]').each(app.prep);
        }
    };

    app.apply();

    return {
        rules: rules,
        apply: app.apply,
        getFormData: app.getFormData
    };

}(window.jQuery));

window.validation = window.validation || (function ($) {
    'use strict';

    var rules = {},
        app = {};

    /*
     * all validation rules, called in element context - arguments that apply to each are:
     * @param val {string}: input value
     * @param misc {string} optional: additional provided value from validation rule - e.g. from min:5, this would be '5'
     * @return {boolean}
     */
    rules = {

        required: function (val) {
            return app.validate.required.call(this, val);
        },

        alpha: function (val) {
            return (/^[a-zA-Z\s]+$/).test(val);
        },

        // https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
        email: function (val) {
            return (/^[a-zA-Z0-9.!#$%&'*+\/=?\^_`{|}~\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/).test(val);
        },

        min: function (val, min) {
            return parseFloat(val) >= parseFloat(min, 10);
        },

        max: function (val, max) {
            return parseFloat(val) <= parseFloat(max, 10);
        },

        match: function (val, match) {
            return val === match;
        },

        minlength: function (val, min) {
            // todo: handle minlength for radios and checkboxes
            return val.length >= parseInt(min, 10);
        },

        maxlength: function (val, max) {
            // todo: handle maxlength for radios and checkboxes
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
            return (/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[\/?#]\S*)?$/i).test(val);
        }
    };

    app = {

        /*
         * get data from all inputs in the form
         * @param $form {jQuery object}
         * @param attribute {string} optional: attribute to use - defaults to name
         */
        getFormData: function ($form, attribute) {
            var $inputs = $form.find('input, select, textarea').not('[type="submit"]'),
                data = {};

            if (typeof $form !== 'object') {
                return;
            }

            // default attribute handling
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
            $inputs.each(function () {
                var $input = $(this),
                    attr = $input.attr(attribute),
                    attrArray = attr.split('.'),
                    currentDataPoint = data,
                    dataEntry,
                    length,
                    value,
                    i;

                // do not proceed if attribute does not exist for that element
                if (typeof attr === 'undefined') {
                    return;
                }

                // standard case
                if (attr.indexOf('.') === -1) {
                    data[attr] = getValue($input, attr);
                    return;
                }

                // handle recursive entry creation for chosen attribute
                for (i = 0; i < length - 1; i += 1) {
                    if (typeof currentDataPoint[attrArray[i]] === 'undefined') {
                        currentDataPoint[attrArray[i]] = {};
                    }
                    currentDataPoint = currentDataPoint[attrArray[i]];
                }
                currentDataPoint[attrArray[length - 1]] = getValue($input, attr);
            });

            return data;
        },

        /*
         * toggle element classes based on validation, and trigger custom events
         * @param $el {jQuery object}
         * @param result {boolean|string}: true if validation has passed, otherwise string indicating failed rule
         */
        setElementClasses: function ($el, result) {
            // remove all rule classes e.g. failed-number
            $el.removeClass(function () {
                var result = ['validation-failed'],
                    i;

                for (i in rules) {
                    if (rules.hasOwnProperty(i)) {
                        result.push('failed-' + i);
                    }
                }

                return result.join(' ');
            });

            // toggle remaining needed classes and trigger validation event
            if (result === true) {
                $el.triggerHandler('validation.passed');
            } else {
                $el.addClass('validation-failed failed-' + result).triggerHandler('validation.failed', result);
            }
        },

        validate: {

            /*
             * trigger validation on whole form - validates all set form elements
             * @param e {object}: event object
             */
            all: function (e) {
                var $holder = $(this),
                    $elems = $holder.find('[data-validation]').filter('input, textarea');

                $elems.each(app.validate.element);

                if ($elems.filter('.validation-failed').length) {
                    e.preventDefault();
                    $holder.addClass('validation-failed').triggerHandler('validation.failed', app.getFormData($holder));
                } else {
                    $holder.removeClass('validation-failed').triggerHandler('validation.passed', app.getFormData($holder));
                }
            },

            /*
             * required rule stored here to prevent being overidden - called in element context
             * @param val {string}
             * @return {boolean}
             */
            required: function (val) {
                var $elem = $(this),
                    name = $elem.attr('name');

                // handle select
                if (this.nodeName.toLowerCase() === 'select') {
                    return val && val.length > 0;
                }

                // handle radio and checkbox
                if (/radio|checkbox/i.test($elem.attr('type'))) {
                    if (typeof name !== 'undefined') {
                        return $('[name="' + name + '"]').filter(':checked').length > 0;
                    } else {
                        return $elem.prop('checked');
                    }
                }

                // default
                return val.length > 0;
            },

            /*
             * cycle through all rules for an element
             * @param el {HTMLElement}
             * @param rulesArr {array}: array of rule strings
             * @aram value {string}: element value
             * @return {boolean|string}: a string containing the failed rule, or true if validation passed
             */
            rules: function (el, rulesArr, value) {
                var $el = $(el),
                    length = rulesArr.length,
                    result = true,
                    currentRule,
                    funcToCall,
                    splitRule,
                    param,
                    i;

                // cycle through remaining rules
                for (i = 0; i < length; i += 1) {
                    currentRule = rulesArr[i];
                    param = undefined;

                    // extract any provided param - use shift and join to handle multiple colons in value
                    if (currentRule.indexOf(':') > -1) {
                        splitRule = currentRule.split(':');
                        currentRule = splitRule.shift();
                        param = splitRule.join(':');
                    }

                    funcToCall = rules[currentRule];

                    // ignore empty string, required (handled elsewhere), and anything not a function
                    if (currentRule !== 'required' && currentRule !== '' && typeof funcToCall === 'function') {
                        if (funcToCall.call(el, value, param) === false) {
                            result = currentRule;
                            break;
                        }
                    }
                }

                return result;
            },

            /*
             *
             */
            element: function (e) {
                var $el = $(this),
                    rulesString = $el.data('validation'),
                    result = true,
                    currentRule,
                    funcToCall,
                    tempRule,
                    param,
                    i;

                // todo: handle required case on change for radio and checkbox groups

                // use required function to check if value is empty
                if (!app.validate.required.call(this, $el.val())) {
                    // only run required check, and only if included, otherwise pass validation
                    result = (' ' + rulesString + ' ').indexOf(' required ') !== -1 ? 'required' : true;
                } else {
                    // if value is not empty, cycle through any remaining rules
                    result = app.validate.rules(this, rulesString.split(' '), $el.val());
                }

                app.setElementClasses($el, result);
                return result;
            }
        },

        /*
         * given holder element as context
         */
        prep: function () {
            var $form = $(this);

            // do not proceed if events for this form are already bound
            if ($form.data('validation-bound') === true) {
                return;
            }

            // bind full submit handling to the form submit event if using a normal form
            if (this.nodeName === 'FORM') {
                $form.on('submit', app.validate.all);
            }

            // also bind to validation-trigger elements
            $form.on('click', '.validation-trigger', function () {
                // use only the closest form, to allow nested forms
                app.validate.all.call($(this).closest('[data-validation="true"]'));
            });

            // handle individual inputs
            $form.data('validation-bound', true)
                .on('change', 'input[data-validation], textarea[data-validation]', app.validate.element);
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

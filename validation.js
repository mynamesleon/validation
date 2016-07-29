(function ($) {
    'use strict';

    // todo: handling if name attribute does not exist on element(s)
    // todo: handling for default error messages
    // todo: handle minlength for checkboxes
    // todo: handle maxlength for checkboxes
    // todo: handling for checked - search by name and filter by any that are checked
    // todo: handling for unchecked - search by name and filter by any that are checked
    // todo: parse selector in 'confirm' properly, rather than relying on eval
    // todo: need better handling for removing error classes in 'setClasses' method, ideally using a pre-prepared string

    var app = {},

        /*
         * object to be returned
         */
        result = {},

        /*
         * regex storage
         */
        regex = {

            // used to allow spaces in 'regex' and 'confirm' rules
            spaceIndicator: '{!space}',

            // letters only
            alpha: new RegExp('^[a-zA-Z\\s]+$'),

            // letters + numbers
            alphanumeric: new RegExp('^[a-z0-9]+$', 'i'),

            // run against turning the string into a date object
            date: new RegExp('Invalid|NaN'),

            // https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
            email: new RegExp([
                '^[a-zA-Z0-9.!#$%&\'*+\/=?\\^_`{|}~\\-]',
                '+@[a-zA-Z0-9]',
                '(?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?',
                '(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)',
                '*$'
            ].join('')),

            // https://gist.github.com/dperini/729294
            url: new RegExp([
                '^',
                // protocol identifier
                '(?:(?:https?|ftp)://)',
                // user:pass authentication
                '(?:\\S+(?::\\S*)?@)?',
                '(?:',
                // ip address exclusion
                // private & local networks
                '(?!(?:10|127)(?:\\.\\d{1,3}){3})',
                '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})',
                '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})',
                // ip address dotted notation octets
                // excludes loopback network 0.0.0.0
                // excludes reserved space >= 224.0.0.0
                // excludes network & broacast addresses
                // (first & last ip address of each class)
                '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])',
                '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}',
                '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))',
                '|',
                // host name
                '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)',
                // domain name
                '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*',
                // tld identifier
                '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))',
                // tld may end with dot
                '\\.?',
                ')',
                // port number
                '(?::\\d{2,5})?',
                // resource path
                '(?:[/?#]\\S*)?',
                '$'
            ].join(''), 'i')
        },

        /*
         * all validation rules, called in element context - arguments that apply to each are:
         * @param val {string}: input value
         * @param misc {string} optional: additional provided value from validation rule - e.g. from min:5, this would be '5'
         *      there should be no spaces in this, as the rules are split by spaces
         *      {!space} can be included in the string to signify where a space should be e.g. confirm:#main{!space}.elem
         * @return {boolean}
         */
        rules = {

            required: function (val) {
                return app.rules.required.call(this, val);
            },

            alpha: function (val) {
                return regex.alpha.test(val);
            },

            alphanumeric: function (val) {
                return regex.alphaNumeric.test(val);
            },

            email: function (val) {
                return regex.email.test(val);
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
                return val.length >= parseInt(min, 10);
            },

            maxlength: function (val, max) {
                return val.length <= parseInt(max, 10);
            },

            number: function (val) {
                // http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric#1830844
                return !isNaN(parseFloat(val)) && isFinite(val);
            },

            checked: function () {

            },

            unchecked: function () {

            },

            confirm: function (val, selector) {
                // reminder: spaces in the selector must be replaced with {!space}
                selector = selector.split(regex.spaceIndicator).join(' ');

                // if it starts with a $, assume full jquery selector has been provided and use eval to assess it
                if (selector.charAt(0) === '$') {
                    selector = eval(selector);
                }

                return val === $(selector).val();
            },

            regex: function (val, reg) {
                // reminder: spaces in the regular expression must be replaced with {!space}
                return new RegExp(reg.split(regex.spaceIndicator).join(' ')).test(val);
            },

            date: function (val) {
                return !regex.date.test(new Date(val).toString());
            },

            url: function (val) {
                return regex.url.test(val);
            }
        },

        /*
         * store default error messages
         */
        messages = {
            required: '',
            alpha: '',
            alphanumeric: '',
            email: '',
            min: '',
            max: '',
            match: '',
            minlength: '',
            maxlength: '',
            number: '',
            checked: '',
            unchecked: '',
            confirm: '',
            regex: '',
            date: '',
            url: ''
        };

    /*
     * primary functions namespace
     */
    app = {

        /*
         * get data from all inputs in the form
         * @param $form {jQuery object}
         * @param attribute {string} optional: attribute to use - defaults to name
         */
        getFormData: function ($form, attribute) {
            // handle defaults
            $form = $form || $('[data-validation="set"]');
            attribute = attribute || 'name';

            if (typeof $form !== 'object') {
                return;
            }

            var $inputs = $form.find('input, select, textarea').not('[type="submit"]'),
                data = {};

            // update data object with input value
            $inputs.each(function () {
                var $input = $(this),
                    attr = $input.attr(attribute),
                    attrArray = attr.split('.'),
                    length = attrArray.length,
                    currentDataPoint = data,
                    i;

                // do not proceed if attribute does not exist for that element
                if (typeof attr === 'undefined') {
                    return;
                }

                // standard case
                if (attr.indexOf('.') === -1) {
                    data[attr] = app.element.getValue($input, attribute);
                    return;
                }

                // handle recursive entry creation for chosen attribute
                for (i = 0; i < length - 1; i += 1) {
                    if (typeof currentDataPoint[attrArray[i]] === 'undefined') {
                        currentDataPoint[attrArray[i]] = {};
                    }
                    currentDataPoint = currentDataPoint[attrArray[i]];
                }
                currentDataPoint[attrArray[length - 1]] = app.element.getValue($input, attribute);
            });

            return data;
        },

        /*
         * object for internal rule handling that will not be exposed
         */
        rules: {

            /*
             * rules to create 'is{rule}' aliases for
             */
            aliases: [
                'required',
                'alpha',
                'alphanumeric',
                'email',
                'equalto',
                'format',
                'number',
                'numeric',
                'checked',
                'unchecked',
                'date',
                'url'
            ],

            /*
             * setup all rule and message aliases
             */
            setAliases: function () {
                var aliases = app.rules.aliases,
                    length = aliases.length,
                    i;

                // rule aliases
                rules.format = rules.regex;
                rules.numeric = rules.number;
                rules.equals = rules.equalto = rules.match;

                for (i = 0; i < length; i += 1) {
                    rules['is' + aliases[i]] = rules[aliases[i]];
                }

                // message aliases
                messages.format = messages.regex;
                messages.numeric = messages.number;
                messages.equals = messages.equalto = messages.match;

                for (i = 0; i < length; i += 1) {
                    messages['is' + aliases[i]] = messages[aliases[i]];
                }
            },

            /*
             * required rule stored here to prevent being overidden - called in element context
             * @param val {string}
             * @return {boolean}
             */
            required: function (val) {
                var $elem = $(this);

                // handle select - check that a value exists, is not empty, and is not 0 or -1
                if ($elem[0].nodeName.toLowerCase() === 'select') {
                    return val && val.length > 0 && val !== '0' && val !== '-1';
                }

                // handle radio and checkbox
                if (/radio|checkbox/i.test($elem.attr('type'))) {
                    return $elem.filter(':checked').length > 0;
                }

                // default
                return val.length > 0;
            }

        },

        /*
         * object to hold specific methods for element handling
         */
        element: {

            /*
             * get element value
             * @param $el {jQuery object}
             * @param attr {string} optional
             */
            getValue: function ($el, attribute) {
                attribute = attribute || 'name';
                var result = [],
                    $elems;

                if (/radio|checkbox/i.test($el.attr('type'))) {
                    $elems = $('[' + attribute + '="' + $el.attr(attribute) + '"]').filter(':checked');
                } else {
                    $elems = $el;
                }

                // cycle through elements and add values to handle input groups
                if ($elems.length) {
                    $elems.each(function () {
                        result.push($(this).val());
                    });
                } else {
                    result.push(-1);
                }

                // join group values with commas
                return result.join(',');
            },

            /*
             * toggle element classes based on validation, and trigger custom events
             * @param $el {jQuery object}
             * @param result {boolean|string}: true if validation has passed, otherwise string indicating failed rule
             */
            setClasses: function ($el, result) {
                // remove all rule classes e.g. failed-number
                $el.removeClass(function () {
                    var result = ['validation-failed'],
                        i;

                    for (i in rules) {
                        if (rules.hasOwnProperty(i)) {
                            result.push('validation-failed-' + i);
                        }
                    }

                    return result.join(' ');
                });

                // toggle remaining needed classes and trigger validation event
                // use triggerHandler to prevent event bubbling
                if (result === true) {
                    $el.triggerHandler('validation.passed');
                } else {
                    $el.addClass('validation-failed validation-failed-' + result).triggerHandler('validation.failed', result);
                }
            },

            /*
             * build space delimitted rules string
             */
            getRules: function ($el) {
                var result = [],
                    o = {};

                if ($el.length === 1) {
                    return $el.data('validation');
                }

                $el.each(function () {
                    var s = $(this).data('validation'),
                        a = [],
                        l,
                        i;

                    if (typeof s === 'undefined') {
                        return;
                    }

                    a = s.split(' ');
                    l = a.length;

                    for (i = 0; i < l; i += 1) {
                        if (typeof o[a[i]] === 'undefined') {
                            result.push(a[i]);
                            o[a[i]] = true;
                        }
                    }
                });
                return result.join(' ');
            }

        },

        /*
         * validate methods for individual elements, all elements, and cycling through rules
         */
        validate: {

            /*
             * trigger validation on whole form - validates all set form elements
             * @param e {object}: event object
             * @return {boolean}: if validation has passed
             */
            all: function (e) {
                var $holder = $(this),
                    $elems = $holder.find('input[data-validation], select[data-validation], textarea[data-validation]');

                $elems.each(app.validate.element);

                if ($elems.filter('.validation-failed').length) {
                    $holder.addClass('validation-failed').triggerHandler('validation.failed', app.getFormData($holder));
                    return false; // return value, and prevents default action if event is passed in
                }

                $holder.removeClass('validation-failed').triggerHandler('validation.passed', app.getFormData($holder));
                return true;
            },

            /*
             * cycle through all rules for an element
             * @param $el {jQuery object}
             * @param rulesArr {array}: array of rule strings
             * @aram value {string}: element value
             * @return {boolean|string}: a string containing the failed rule, or true if validation passed
             */
            rules: function ($el, rulesArr, value) {
                var length = rulesArr.length,
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

                    currentRule = currentRule.toLowerCase();
                    funcToCall = rules[currentRule];

                    // ignore empty string, required (handled elsewhere), and anything not a function
                    if (currentRule !== 'required' && currentRule !== 'isrequired' && currentRule !== '' && typeof funcToCall === 'function') {
                        if (funcToCall.call($el, value, param) === false) {
                            result = currentRule;
                            break;
                        }
                    }
                }

                return result;
            },

            /*
             * validate an individual element
             * @param e {object}: event object
             * @return {string|boolean}: returns the first failed rule, or true if validation has passed
             */
            element: function (e) {
                var $el = $(this),
                    rulesString = app.element.getRules($el),
                    value = app.element.getValue($el),
                    result = true;

                // handle radio and input groups
                // select all elements with that name and remake the rules string
                if (/radio|checkbox/i.test($el.attr('type'))) {
                    $el = $('[name="' + $el.attr('name') + '"]');
                    rulesString = app.element.getRules($el);
                }

                // use required function to check if value is empty
                if (!app.rules.required.call($el, value)) {
                    // if "required" is in the validation attribute, set result var to "required", otherwise pass validation
                    result = / required | isrequired /i.test(' ' + rulesString + ' ') ? 'required' : true;
                } else {
                    // if value is not empty, cycle through any remaining rules
                    result = app.validate.rules($el, rulesString.split(' '), value);
                }

                app.element.setClasses($el, result);
                return result;
            }
        },

        /*
         * given holder element as context
         */
        prep: function () {
            // reset the data-validation attribute so that events are not bound on subsequent init calls
            var $form = $(this).attr('data-validation', 'set');

            // bind full submit handling to the form submit event if using a normal form
            if (this.nodeName === 'FORM') {
                $form.on('submit', app.validate.all);
            }

            // bind to validation-trigger elements - use the closest form to allow nested forms
            $form.on('click', '.validation-trigger', function (e) {
                app.validate.all.call($(this).closest('[data-validation="set"]'), e);
            });

            // bind individual input change events
            $form.on('change', 'input[data-validation], select[data-validation], textarea[data-validation]', function (e) {
                app.validate.element.call(this, e);
            });
        },

        /*
         * primary setup method
         */
        init: function () {
            $('[data-validation="true"]').each(app.prep);
        }
    };

    // setup rule aliases
    app.rules.setAliases();

    // handle returned object
    result = app.init;
    result.rules = rules;
    result.init = app.init;
    result.messages = messages;
    result.getFormData = app.getFormData;

    /*
     * method to trigger validation
     * @param elem {HTMLElement|jQuery object} optional: can be specific or multiple input element(s), or a holder
     * @return {boolean|undefined}: if all elements passed validation - returns undefined if no validation checks were made
     */
    result.validate = function (elem) {
        // validate all set forms by default
        var $elems = $(elem || '[data-validation="set"]');

        // handle if no elements exist
        if (!$elems.length) {
            return;
        }

        // validate
        return (/input|select|textarea/i).test($elems[0].nodeName)
            ? !$elems.each(app.validate.element).filter('validation-failed').length
            : app.validate.all.call($elems);
    };

    // set window level validation var
    window.validation = window.validation || result;

}(window.jQuery));

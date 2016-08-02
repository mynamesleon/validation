/*
 * validation
 * Leon Slater
 * http://mynamesleon.com
 * github.com/mynamesleon/validation
 */

(function (root, factory) {
    'use strict';

    if (typeof root.define === 'function' && root.define.amd) {
        // AMD. Register as an anonymous module.
        root.define(['jQuery'], function ($) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.validation = factory($));
        });
    } else {
        // Browser globals
        root.validation = factory(root.jQuery);
    }

}(this, function ($) {
    'use strict';

    // todo: handle minlength for checkboxes
    // todo: handle maxlength for checkboxes
    // todo: handling for checked - search by name and filter by any that are checked
    // todo: handling for unchecked - search by name and filter by any that are checked
    // todo: parse selector in 'confirm' properly, rather than relying on eval
    // todo: need better handling for removing error classes in 'setClasses' method, ideally using a pre-prepared string

    var version = '0.0.1',

        /*
         * all validation rules, called in element context - arguments that apply to each are:
         * @param val {string}: input value
         * @param misc {string} optional: additional provided value from validation rule - e.g. from min:5, this would be '5'
         *      there should be no spaces in this, as the rules are split by spaces
         *      {!space} can be included in the string to signify where a space should be e.g. confirm:#main{!space}.elem
         * @return {boolean}
         */
        rules = {

            /*
             * required rule - the rule in this object is not called internally
             * @param val {string}
             * @return {boolean}
             */
            required: function (val) {
                // handled internally
            },

            /*
             * letters only
             * @param val {string}
             * @return {boolean}
             */
            alpha: function (val) {
                return (/^[a-zA-Z\s]+$/).test(val);
            },

            /*
             * letters and numbers only
             * @param val {string}
             * @return {boolean}
             */
            alphanumeric: function (val) {
                return (/^[a-z0-9]+$/i).test(val);
            },

            /*
             * email test - allows formats as simple as name@domain
             * https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
             * @param val {string}
             * @return {boolean}
             */
            email: function (val) {
                return new RegExp([
                    '^[a-zA-Z0-9.!#$%&\'*+\/=?\\^_`{|}~\\-]+@[a-zA-Z0-9]',
                    '(?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?',
                    '(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)*$'
                ].join('')).test(val);
            },

            /*
             * minimum number
             * @param val {string}
             * @param min {string|number}
             * @return {boolean}
             */
            min: function (val, min) {
                return parseFloat(val) >= parseFloat(min, 10);
            },

            /*
             * maximum number
             * @param val {string}
             * @param max {string|number}
             * @return {boolean}
             */
            max: function (val, max) {
                return parseFloat(val) <= parseFloat(max, 10);
            },

            /*
             * match a specific value
             * @param val {string}
             * @param match {string}
             * @return {boolean}
             */
            match: function (val, match) {
                return val === match;
            },

            /*
             * minlength of a string, or minimum number of checked inputs
             * @param val {string}
             * @param min {string|number}
             * @return {boolean}
             */
            minlength: function (val, min) {
                return val.length >= parseFloat(min, 10);
            },

            /*
             * maxlength of a string, or maximum number of checked inputs
             * @param val {string}
             * @param max {string|number}
             * @return {boolean}
             */
            maxlength: function (val, max) {
                return val.length <= parseFloat(max, 10);
            },

            /*
             * number only
             * http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric#1830844
             * @param val {string}
             * @return {boolean}
             */
            number: function (val) {
                return !isNaN(parseFloat(val)) && isFinite(val);
            },

            /*
             * must be checked
             * @return {boolean}
             */
            checked: function () {

            },

            /*
             * must be unchecked
             * @return {boolean}
             */
            unchecked: function () {

            },

            /*
             * test value against the value of another input - must use {!space} for spaces needed in the selector
             * @param val {string}
             * @param selector {string|jQuery object}
             * @return {boolean}
             */
            confirm: function (val, selector) {
                // reminder: spaces in the selector must be replaced with {!space}
                if (typeof selector === 'string') {
                    selector = selector.split('{!space}').join(' ');

                    // if it starts with a $, assume full jquery selector has been provided and use eval to assess it
                    if (selector.charAt(0) === '$') {
                        selector = eval(selector);
                    }
                }

                return val === $(selector).val();
            },

            /*
             * custom regular expression check - must use {!space} for spaces needed in regex
             * @param val {string}
             * @param reg {string|object}: will be a string when included in the validation data attribute
             * @return {boolean}
             */
            regex: function (val, reg) {
                if (typeof reg === 'string') {
                    return new RegExp(reg.split('{!space}').join(' ')).test(val);
                } else if (Object.prototype.toString.call(reg) === '[object RegExp]') {
                    return reg.test(val);
                }
            },

            /*
             * date test
             * @param val {string}
             * @return {boolean}
             */
            date: function (val) {
                return !(/Invalid|NaN/).test(new Date(val).toString());
            },

            /*
             * url test
             * https://gist.github.com/dperini/729294
             * @param val {string}
             * @return {boolean}
             */
            url: function (val) {
                return new RegExp([
                    '^(?:(?:https?|ftp)://)(?:\\S+(?::\\S*)?@)?',
                    '(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})',
                    '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})',
                    '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})',
                    '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])',
                    '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}',
                    '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|',
                    '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)',
                    '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*',
                    '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))\\.?)',
                    '(?::\\d{2,5})?(?:[/?#]\\S*)?$'
                ].join(''), 'i').test(val);
            }
        },


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

                var $inputs = $form.find('input, select, textarea').not('[type="submit"], [type="button"]'),
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
             * element handling
             */
            element: {

                /*
                 * check if element is checkbox or radio type
                 * @param elem {HTMLElement|jQuery object}
                 */
                isCheckable: function (elem) {
                    return (/radio|checkbox/i).test($(elem).attr('type'));
                },

                /*
                 * get element value
                 * @param $el {jQuery object}
                 * @param attribute {string} optional: attribute to use when selecting multiple elements
                 */
                getValue: function ($el, attribute) {
                    var result = [],
                        $elems;

                    attribute = attribute || 'name';

                    if (app.element.isCheckable($el)) {
                        $elems = $('[' + attribute + '="' + $el.attr(attribute) + '"]');
                        $elems = ($elems.length ? $elems : $el).filter(':checked');
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
                        stored = {};

                    // if only one element, return the validation data from it
                    if ($el.length === 1) {
                        return $el.data('validation');
                    }

                    // if multiple, cycle and add
                    $el.each(function () {
                        var rules = $(this).data('validation'),
                            arr = [],
                            length,
                            i;

                        // continue if no validation rules are specified on the element
                        if (typeof rules === 'undefined') {
                            return;
                        }

                        arr = rules.split(' ');
                        length = arr.length;

                        for (i = 0; i < length; i += 1) {
                            // check that the validation rule has not been added already
                            if (typeof stored[arr[i]] === 'undefined') {
                                result.push(arr[i]);
                                // update stored object to indicate that this rule has been added
                                stored[arr[i]] = true;
                            }
                        }
                    });
                    return result.join(' ');
                }

            },

            /*
             * validate storage
             */
            validate: {

                /*
                 * required rule stored here to prevent being overidden - called in element context
                 * @param val {string}
                 * @return {boolean}
                 */
                required: function (val) {
                    var $elem = $(this);

                    // handle select - check that a value exists, is not empty, and is not 0 or -1
                    if ($elem[0].nodeName === 'SELECT') {
                        return val && val.length > 0 && val !== '0' && val !== '-1';
                    }

                    // handle radio and checkbox
                    if (app.element.isCheckable($elem)) {
                        return $elem.filter(':checked').length > 0;
                    }

                    // default
                    return val.length > 0;
                },

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
                        return false; // return value, and prevents default action if event object is passed in
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
                        result = true,
                        $tempEl;

                    // handle radio and input groups
                    // select all elements with that name and remake the rules string
                    if (app.element.isCheckable($el)) {
                        $tempEl = $('[name="' + $el.attr('name') + '"]');
                        $el = $tempEl.length ? $tempEl : $el;
                        rulesString = app.element.getRules($el);
                    }

                    // use required function to check if value is empty
                    if (!app.validate.required.call($el, value)) {
                        // return 'required' or 'isrequired' if in validation rules, otherwise pass
                        result = (' ' + rulesString.toLowerCase() + ' ').indexOf(' required ') > -1 ? 'required'
                                : (' ' + rulesString.toLowerCase() + ' ').indexOf(' isrequired ') > -1 ? 'isrequired'
                                : true;
                    } else {
                        // if value is not empty, cycle through any remaining rules
                        result = app.validate.rules($el, rulesString.split(' '), value);
                    }

                    app.element.setClasses($el, result);
                    return result;
                },

                /*
                 * method to trigger validation based on element - used in API
                 * @param elem {HTMLElement|jQuery object} optional: can be specific or multiple input element(s), or a holder
                 * @param event {object} optional: event object
                 * @return {boolean|undefined}: if all elements passed validation - returns undefined if no validation checks were made
                 */
                handle: function (elem, event) {
                    // validate all set forms by default
                    var $elems = $(elem || '[data-validation="set"]');

                    // handle if no elements exist
                    if (!$elems.length) {
                        return;
                    }

                    // validate
                    return (/input|select|textarea/i).test($elems[0].nodeName)
                        ? !$elems.each(app.validate.element).filter('validation-failed').length
                        : app.validate.all.call($elems, event);
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
                $form.on('change', 'input, select, textarea', function (e) {
                    if (typeof $(this).data('validation') !== 'undefined' || (app.element.isCheckable($(this)) && $('[name="' + $(this).attr('name') + '"][data-validation]').length)) {
                        app.validate.element.call(this, e);
                    }
                });
            },

            /*
             * primary setup method
             */
            init: function () {
                $('[data-validation="true"]').each(app.prep);
            }
        };


    // set rule aliases
    rules.numeric = rules.number;
    rules.equals = rules.equalto = rules.match;
    rules.format = rules.pattern = rules.regex;
    $.each([
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
    ], function (index, entry) {
        rules['is' + entry] = rules[entry];
    });


    // expose
    return {
        rules: rules,
        init: app.init,
        version: version,
        getFormData: app.getFormData,
        validate: app.validate.handle
    };

}));

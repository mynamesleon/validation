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

    // todo: parse selector in 'confirm' properly, rather than relying on eval
    // todo: need better handling for removing error classes in 'setClasses' method, ideally using a pre-prepared string

    var app = {},

        /*
         * all validation rules called in element context
         * should always return a boolean
         */
        rules = {

            /*
             * required rule - the rule in this object is not called internally
             * @param val {string}
             * @return {boolean}
             */
            required: {
                validate: function (val) {
                    return app.validate.required.call(this, val);
                }
            },

            /*
             * letters only
             * @param val {string}
             * @return {boolean}
             */
            alpha: {
                regex: /^[a-zA-Z\s]+$/,
                validate: function (val) {
                    return rules.alpha.regex.test(val);
                }
            },

            /*
             * letters and numbers only
             * @param val {string}
             * @return {boolean}
             */
            alphanumeric: {
                regex: /^[a-z0-9]+$/i,
                validate: function (val) {
                    return rules.alphanumeric.regex.test(val);
                }
            },

            /*
             * email test - allows formats as simple as name@domain
             * https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
             * @param val {string}
             * @return {boolean}
             */
            email: {
                regex: new RegExp([
                    '^[a-zA-Z0-9.!#$%&\'*+\/=?\\^_`{|}~\\-]+@[a-zA-Z0-9]',
                    '(?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?',
                    '(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)*$'
                ].join('')),
                validate: function (val) {
                    return rules.email.regex.test(val);
                }
            },

            /*
             * minimum number
             * @param val {string}
             * @param min {string|number}
             * @return {boolean}
             */
            min: {
                validate: function (val, min) {
                    return parseFloat(val) >= parseFloat(min);
                }
            },

            /*
             * maximum number
             * @param val {string}
             * @param max {string|number}
             * @return {boolean}
             */
            max: {
                validate: function (val, max) {
                    return parseFloat(val) <= parseFloat(max);
                }
            },

            /*
             * range between numbers
             * @param val {string}
             * @param range {string}: space (if not in data attribute), comma, hyphen, underscore, pipe or colon delimited
             * @return {boolean}
             */
            range: {
                separators: /[,-_|:]/g,
                validate: function (val, range) {
                    var min = (range = range.replace(rules.range.separators, ' ').split(' '))[0],
                        max = range[1];

                    return (val = parseFloat(val)) >= parseFloat(min) && val <= parseFloat(max);
                }
            },

            /*
             * match a specific value
             * @param val {string}
             * @param match {string}
             * @return {boolean}
             */
            match: {
                validate: function (val, match) {
                    return val === match;
                }
            },

            /*
             * minlength of a string, or minimum number of checked inputs
             * @param val {string}
             * @param min {string|number}
             * @return {boolean}
             */
            minlength: {
                validate: function (val, min) {
                    var toCheck = (app.element.isCheckable($(this)) ? app.element.getByAttribute($(this), 'name').filter(':checked') : val).length;

                    return toCheck >= parseFloat(min);
                }
            },

            /*
             * maxlength of a string, or maximum number of checked inputs
             * @param val {string}
             * @param max {string|number}
             * @return {boolean}
             */
            maxlength: {
                validate: function (val, max) {
                    var toCheck = (app.element.isCheckable($(this)) ? app.element.getByAttribute($(this), 'name').filter(':checked') : val).length;

                    return toCheck <= parseFloat(max);
                }
            },

            /*
             * range between character length
             * @param val {string}
             * @param range {string}: space (if not in data attribute), comma, hyphen, underscore, pipe or colon delimited
             * @return {boolean}
             */
            rangelength: {
                separators: /[,-_|:]/g,
                validate: function (val, range) {
                    var rangeArr = range.replace(rules.rangelength.separators, ' ').split(' '),
                        toCheck = (app.element.isCheckable($(this)) ? app.element.getByAttribute($(this), 'name').filter(':checked') : val).length;

                    return toCheck >= parseFloat(rangeArr[0]) && toCheck <= parseFloat(rangeArr[1]);
                }
            },

            /*
             * word count minimum
             * @param val {string}
             * @param min {string}
             * @return {boolean}
             */
            minwords: {
                validate: function (val, min) {
                    return $.trim(val).split(/\s+/).length >= parseFloat(min);
                }
            },

            /*
             * word count maximum
             * @param val {string}
             * @param min {string}
             * @return {boolean}
             */
            maxwords: {
                validate: function (val, max) {
                    return $.trim(val).split(/\s+/).length <= parseFloat(max);
                }
            },

            /*
             * word count range
             * @param val {string}
             * @param range {string}: space (if not in data attribute), comma, hyphen, underscore, pipe or colon delimited
             * @return {boolean}
             */
            rangewords: {
                separators: /[,-_|:]/g,
                validate: function (val, range) {
                    var rangeArr = range.replace(rules.rangewords.separators, ' ').split(' '),
                        toCheck = $.trim(val).split(/\s+/).length;

                    return toCheck >= parseFloat(rangeArr[0]) && toCheck <= parseFloat(rangeArr[1]);
                }
            },

            /*
             * number only - allows decimals
             * http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric#1830844
             * @param val {string}
             * @return {boolean}
             */
            number: {
                validate: function (val) {
                    return !isNaN(parseFloat(val)) && isFinite(val);
                }
            },

            /*
             * integer only (allows negatives)
             * @param val {string}
             * @return {boolean}
             */
            integer: {
                regex: /^-?\d+$/,
                validate: function (val) {
                    return rules.integer.regex.test(val);
                }
            },

            /*
             * digits only
             * @param val {string}
             * @return {boolean}
             */
            digits: {
                regex: /^\d+$/,
                validate: function (val) {
                    return rules.digits.regex.test(val);
                }
            },

            /*
             * must be checked
             * @return {boolean}
             */
            checked: {
                validate: function (val) {
                    return typeof val === 'undefined' ? app.element.getByAttribute($(this), 'name').filter(':checked').length > 0 : val !== '-1';
                }
            },

            /*
             * must be unchecked
             * @return {boolean}
             */
            unchecked: {
                validate: function (val) {
                    return typeof val === 'undefined' ? app.element.getByAttribute($(this), 'name').filter(':checked').length === 0 : val === '-1';
                }
            },

            /*
             * test value against the value of another input - must use {!space} for spaces needed in the selector
             * @param val {string}
             * @param selector {string|jQuery object}
             * @return {boolean}
             */
            confirm: {
                validate: function (val, selector) {
                    // reminder: spaces in the selector must be replaced with {!space}
                    if (typeof selector === 'string') {
                        selector = selector.split('{!space}').join(' ');

                        // if it starts with a $, assume full jquery selector has been provided and use eval to assess it
                        if (selector.charAt(0) === '$') {
                            selector = eval(selector);
                        }
                    }

                    return val === $(selector).val();
                }
            },

            /*
             * custom regular expression check - must use {!space} for spaces needed in regex
             * @param val {string}
             * @param reg {string|object}: will be a string when included in the validation data attribute
             * @return {boolean}
             */
            regex: {
                toStringProto: Object.prototype.toString,
                validate: function (val, reg) {
                    if (typeof reg === 'string') {
                        return new RegExp(reg.split('{!space}').join(' ')).test(val);
                    } else if (rules.regex.toStringProto.call(reg) === '[object RegExp]') {
                        return reg.test(val);
                    }
                }
            },

            /*
             * date test
             * @param val {string}
             * @return {boolean}
             */
            date: {
                regex: /Invalid|NaN/,
                validate: function (val) {
                    return !rules.date.regex.test(new Date(val).toString());
                }
            },

            /*
             * url test
             * https://gist.github.com/dperini/729294
             * @param val {string}
             * @return {boolean}
             */
            url: {
                regex: new RegExp([
                    '^(?:(?:https?|ftp)://)',
                    '(?:\\S+(?::\\S*)?@)?',
                    '(?:',
                    '(?!(?:10|127)(?:\\.\\d{1,3}){3})',
                    '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})',
                    '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})',
                    '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])',
                    '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}',
                    '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|',
                    '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)',
                    '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*',
                    '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))',
                    '\\.?)',
                    '(?::\\d{2,5})?',
                    '(?:[/?#]\\S*)?',
                    '$'
                ].join(''), 'i'),
                validate: function (val) {
                    return rules.url.regex.test(val);
                }
            },

            /*
             * ipv4 test - allows leading zeros
             * source: regular expressions cookbook second edition (august 2012) section 8.16 (p.469)
             * @param val {string}
             * @return {boolean}
             */
            ipaddress: {
                // ipv4 test - allows leading zeros
                // source: regular expressions cookbook second edition (august 2012) section 8.16 (p.469)
                ipv4: new RegExp([
                    '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}',
                    '(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
                    '(\/([0-9]|[1-2][0-9]|3[0-2]))?', // allow cidr notation
                    '$'
                ].join('')),

                // ipv6 test
                ipv6: new RegExp([
                    '^\\s*',
                    '(',
                    '(([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|',
                    '(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|',
                    '(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|',
                    '(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|',
                    '(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|',
                    '(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|',
                    '(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|',
                    '(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))',
                    ')',
                    '(%.+)?\\s*(\/(\\d|\\d\\d|1[0-1]\\d|12[0-8]))?$' // allow cidr notation
                ].join('')),

                validate: function (val) {
                    return rules.ipaddress.ipv4.test(val) || rules.ipaddress.ipv6.test(val);
                }
            },

            /*
             * credit card check
             * @param val {string}
             * @return {boolean}
             */
            creditcard: {
                allowed: new RegExp('[^0-9 \\-]+'),
                nonDigits: /\D/g,
                validate: function (val) {
                    // accept spaces, digits and dashes only
                    if (rules.creditcard.allowed.test(val)) {
                        return false;
                    }

                    var numToCheck = 0,
                        bEven = false,
                        currentDigit,
                        nDigit = 0,
                        n;

                    // remove anything that is not a digit
                    val = val.replace(rules.creditcard.nonDigits, '');

                    // estimated min and max length to allow
                    if (val.length < 13 || val.length > 19) {
                        return false;
                    }

                    for (n = val.length - 1; n >= 0; n -= 1) {
                        currentDigit = val.charAt(n);
                        nDigit = parseInt(currentDigit, 10);
                        if (bEven) {
                            if ((nDigit *= 2) > 9) {
                                nDigit -= 9;
                            }
                        }
                        numToCheck += nDigit;
                        bEven = !bEven;
                    }

                    return (numToCheck % 10) === 0;
                }
            },

            /*
             * colour validation
             * @param val {string}
             * @param types {string|array} optional: string or array of colour types
             *      allowed colour types: keywords, hex, hsl, hsla, rgb, rgba - defaults to all
             *      can be comma, space, hyphen, underscore, pipe, or colon delimited as a string
             *      cannot be space delimited when used in data-validation attribute
             */
            colour: {
                separators: /[,-_|:]/g,

                keywords: [
                    'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black', 'blanchedalmond', 'blue',
                    'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk',
                    'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
                    'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue',
                    'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey',
                    'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
                    'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
                    'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow',
                    'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
                    'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine',
                    'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise',
                    'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive',
                    'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip',
                    'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon',
                    'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow',
                    'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'transparent', 'turquoise', 'violet', 'wheat', 'white',
                    'whitesmoke', 'yellow', 'yellowgreen'
                ],

                regex: {
                    hex: [
                        /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i
                    ],
                    hsl: [
                        /^hsl\((\s*(-?\d+)\s*,)(\s*(\b(0?\d{1,2}|100)\b%)\s*,)(\s*(\b(0?\d{1,2}|100)\b%)\s*)\)$/
                    ],
                    hsla: [
                        /^hsla\((\s*(-?\d+)\s*,)(\s*(\b(0?\d{1,2}|100)\b%)\s*,){2}(\s*(0?(\.\d+)?|1(\.0+)?)\s*)\)$/
                    ],
                    rgb: [
                        /^rgb\((\s*(\b([01]?\d{1,2}|2[0-4]\d|25[0-5])\b)\s*,){2}(\s*(\b([01]?\d{1,2}|2[0-4]\d|25[0-5])\b)\s*)\)$/,
                        /^rgb\((\s*(\b(0?\d{1,2}|100)\b%)\s*,){2}(\s*(\b(0?\d{1,2}|100)\b%)\s*)\)$/
                    ],
                    rgba: [
                        /^rgba\((\s*(\b([01]?\d{1,2}|2[0-4]\d|25[0-5])\b)\s*,){3}(\s*(0?(\.\d+)?|1(\.0+)?)\s*)\)$/,
                        /^rgba\((\s*(\b(0?\d{1,2}|100)\b%)\s*,){3}(\s*(0?(\.\d+)?|1(\.0+)?)\s*)\)$/
                    ]
                },

                validate: function (val, types) {
                    var keywords = rules.colour.keywords,
                        expr = rules.colour.regex,
                        thisType,
                        i,
                        j;

                    // if using a colour input, test against the hex regex straight away
                    if ($(this).attr('type') === 'color') {
                        return expr.hex[0].test(val);
                    }

                    // default to allow all types
                    types = types || ['keywords', 'hex', 'hsl', 'hsla', 'rgb', 'rgba'];

                    // if types passed in as a string, replace the possible separators and make array
                    if (typeof types === 'string') {
                        types = types.replace(rules.colour.separators, ' ').split(' ');
                    }

                    // keywords check
                    if ($.inArray('keywords', types) > -1 && $.inArray(val, keywords) > -1) {
                        return true;
                    }

                    // cycle through types
                    for (i = 0; i < types.length; i += 1) {
                        thisType = types[i];
                        // if we have expressions for that type, check them
                        if (typeof expr[thisType] === 'object') {
                            for (j = 0; j < expr[thisType].length; j += 1) {
                                // if it passes, return true immediately
                                if (expr[thisType][j].test(val)) {
                                    return true;
                                }
                            }
                        }
                    }

                    // return false by default
                    return false;
                }
            },

            /*
             * add a test to the exposed rules
             * @param name {string}
             * @param test {function}
             */
            addTest: function (name, test) {
                // add to exposed rules object - set as new function to hide internal rule logic
                if (typeof app.rules[name] === 'undefined') {
                    app.rules[name] = function (val) {
                        if (typeof val === 'undefined' || val === null) {
                            throw new Error('No value was provided for the validation test');
                        }
                        return test.apply(this, arguments);
                    };
                }
                // add to internal rules object - set as new function that uses .call for speed benefit over .apply
                // no need to add empty value check this time as a string value will always be provided to internal rules
                if (typeof rules[name] === 'undefined') {
                    rules[name] = {
                        validate: function (val, param) {
                            return test.call(this, val, param);
                        }
                    }
                }
            },

            /*
             * set rule aliases and add rules to application object to be exposed
             */
            setRules: function () {
                var i,
                    k,
                    thisAlias,
                    aliases = [
                        'required', 'alpha', 'alphanumeric', 'email', 'equalto', 'format', 'pattern', 'number', 'numeric', 'integer',
                        'digits', 'ip', 'ipaddress', 'checked', 'unchecked', 'date', 'url', 'creditcard', 'color', 'colour'
                    ];

                // set specific aliases
                rules.ip = rules.ipaddress;
                rules.color = rules.colour;
                rules.numeric = rules.number;
                rules.format = rules.pattern = rules.regexp = rules.regex;
                rules.equals = rules.equalto = rules.matches = rules.match;

                // create is- aliases
                for (i = 0; i < aliases.length; i += 1) {
                    thisAlias = aliases[i];
                    rules['is' + thisAlias] = rules[thisAlias];
                }

                // add rules to internal application object
                for (k in rules) {
                    if (rules.hasOwnProperty(k) && typeof rules[k] !== 'function') {
                        rules.addTest(k, rules[k].validate);
                    }
                }
            }
        };


    /*
     * main application methods
     */
    app = {

        /*
         * internal storage for rules
         */
        rules: {},


        /*
         * get data from all inputs in the form
         * @param $form {jQuery object}
         * @param attribute {string} optional: attribute to use - defaults to name
         * @return {object}
         */
        getFormData: function ($form, attribute) {
            // handle defaults
            $form = $form || $('[data-validation="set"]');
            attribute = attribute || 'name';

            // default to finding all inouts on the page if no validation has been set
            if (typeof $form !== 'object' || !$form.length) {
                $form = $(document);
            }

            var $inputs = $form.find('input, select, textarea').not('[type="submit"], [type="button"]'),
                data = {};

            // update data object with input value
            $inputs.each(function () {
                var $input = $(this),
                    attr = $input.attr(attribute),
                    currentDataPoint = data,
                    attrArray,
                    length,
                    i;

                // do not proceed if attribute does not exist for that element
                if (typeof attr === 'undefined') {
                    return;
                }

                // handle key style naming e.g. primary[secondary][tertiary]
                if (attr.indexOf('[') > -1 && attr.indexOf(']') > -1) {
                    attr = attr.split('[').join('.').split(']').join('');
                }

                // standard case
                if (attr.indexOf('.') === -1) {
                    data[attr] = app.element.getValue($input, attribute);
                    return;
                }

                // set needed vars for recursive entry creation for chosen attribute
                attrArray = attr.split('.');
                length = attrArray.length;

                // set the level in the object that we want to add the new property
                for (i = 0; i < length - 1; i += 1) {
                    if (typeof currentDataPoint[attrArray[i]] === 'undefined') {
                        currentDataPoint[attrArray[i]] = {};
                    }
                    currentDataPoint = currentDataPoint[attrArray[i]];
                }

                // use length - 1 so the final entry in the array is used as the property name
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
             * get all elements with matching attribute value
             * @param $el {jQuery object}
             * @param attribute {string} optional: defaults to 'name'
             * @return {jQuery object}: returns $el if none were founding with matching attribute value
             */
            getByAttribute: function ($el, attribute) {
                attribute = attribute || 'name';
                var $result = $('[' + attribute + '="' + $el.attr(attribute) + '"]');
                return $result.length ? $result : $el;
            },

            /*
             * get element value
             * @param $el {jQuery object}
             * @param attribute {string} optional: attribute to use when selecting multiple elements
             */
            getValue: function ($el, attribute) {
                var result = [];
                attribute = attribute || 'name';

                // get by name for radio or input types
                if (app.element.isCheckable($el)) {
                    $el = app.element.getByAttribute($el, 'name').filter(':checked');
                }

                // cycle through elements to handle elements with the same name
                $el.each(function () {
                    var value = $(this).val();
                    // check for array e.g. multi-select
                    if ($.isArray(value)) {
                        value = value.join(',');
                    }
                    result.push(value);
                });

                // if nothing has been added to the result, set to -1 by default
                if (result.length === 0) {
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

                    for (i in app.rules) {
                        if (app.rules.hasOwnProperty(i)) {
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
                    funcToCall = rules[currentRule].validate; // only ever use internally stored rules

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
                    value = app.element.getValue($el),
                    result = true,
                    rulesString,
                    $tempEl;

                // handle radio and input types - select all elements with that name
                if (app.element.isCheckable($el)) {
                    $el = app.element.getByAttribute($el, 'name');
                }

                // fetch rules once we have all the necessary elements
                rulesString = app.element.getRules($el);

                // use required function to check if value is empty
                if (!app.validate.required.call($el, value)) {
                    // return 'required' or 'isrequired' if in validation rules, otherwise pass
                    result = (' ' + rulesString.toLowerCase() + ' ').indexOf(' required ') > -1 ? 'required' : (' ' + rulesString.toLowerCase() + ' ').indexOf(' isrequired ') > -1 ? 'isrequired' : true;
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
                var prevent = typeof $(this).data('validation') === 'undefined'
                    // check if the form itself has a parent form to prevent change event firing multiple times in nested forms
                    || $form.parent().closest('[data-validation="set"]').length
                    // if radio or checkbox, check if any in the same group have a data-validation attribute
                    || (app.element.isCheckable($(this)) && !app.element.getByAttribute($(this), 'name').filter('[data-validation]').length);

                if (!prevent) {
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


    // set all internal rules
    rules.setRules();

    // expose
    return {
        init: app.init,
        rules: app.rules, // expose rules for external use
        addTest: rules.addTest,
        getFormData: app.getFormData,
        validate: app.validate.handle
    };

}));

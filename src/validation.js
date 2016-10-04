/**
 * validation
 * Leon Slater
 * http://mynamesleon.com
 * github.com/mynamesleon/validation
 * @license: MIT
 */

/** @namespace validation */
(function (root, factory) {
    'use strict';
    if (typeof root.define === 'function' && root.define.amd) {
        // AMD. Register as an anonymous module.
        root.define(['jQuery'], function ($) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.validation = factory(root, $));
        });
    } else {
        // Browser globals
        root.validation = factory(root, root.jQuery);
    }
}(this, function (root, $) {
    'use strict';

    var app = {},

        /**
         * all validation rules called in element context
         * should always return a boolean
         */
        rules = {

            /**
             * required
             * @param val {string}
             * @return {boolean}
             */
            required: {
                validate: function (val) {
                    var $elem = $(this);

                    // handle select - '0' and '-1' values will still pass, as they may be intended
                    if ($elem.is('select')) {
                        return val && val.length > 0;
                    }

                    // handle radio and checkbox
                    if (app.element.isCheckable($elem)) {
                        return $elem.filter(':checked').length > 0;
                    }

                    // handle any non string values just in case
                    if (typeof val !== 'string') {
                        return !!val;
                    }

                    // default
                    return val.length > 0;
                }
            },

            /**
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

            /**
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

            /**
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

            /**
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

            /**
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

            /**
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

            /**
             * range between numbers
             * @param val {string}
             * @param range {string}: comma, underscore, pipe or colon delimited
             * @return {boolean}
             */
            range: {
                separators: /[\,\_\|\:]/g, // do not split by hyphen in case negative value is used
                validate: function (val, range) {
                    var rangeArr = range.replace(rules.range.separators, ' ').split(' '),
                        toCheck = parseFloat(val);

                    return toCheck >= parseFloat(rangeArr[0]) && toCheck <= parseFloat(rangeArr[1]);
                }
            },

            /**
             * minlength of a string, or minimum number of checked inputs
             * @param val {string}
             * @param min {string|number}
             * @return {boolean}
             */
            minlength: {
                validate: function (val, min) {
                    var toCheck = (app.element.isCheckable($(this))
                        ? app.element.getByAttribute($(this), 'name').filter(':checked')
                        : val).length;

                    return toCheck >= parseFloat(min);
                }
            },

            /**
             * maxlength of a string, or maximum number of checked inputs
             * @param val {string}
             * @param max {string|number}
             * @return {boolean}
             */
            maxlength: {
                validate: function (val, max) {
                    var toCheck = (app.element.isCheckable($(this))
                        ? app.element.getByAttribute($(this), 'name').filter(':checked')
                        : val).length;

                    return toCheck <= parseFloat(max);
                }
            },

            /**
             * range between character length
             * @param val {string}
             * @param range {string}: comma, hyphen, underscore, pipe or colon delimited
             * @return {boolean}
             */
            rangelength: {
                separators: /[\,\-\_\|\:]/g,
                validate: function (val, range) {
                    var rangeArr = range.replace(rules.rangelength.separators, ' ').split(' '),
                        toCheck = (app.element.isCheckable($(this))
                                   ? app.element.getByAttribute($(this), 'name').filter(':checked')
                                   : val).length;

                    return toCheck >= parseFloat(rangeArr[0]) && toCheck <= parseFloat(rangeArr[1]);
                }
            },

            /**
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

            /**
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

            /**
             * word count range
             * @param val {string}
             * @param range {string}: comma, hyphen, underscore, pipe or colon delimited
             * @return {boolean}
             */
            rangewords: {
                separators: /[\,\-\_\|\:]/g,
                validate: function (val, range) {
                    var rangeArr = range.replace(rules.rangewords.separators, ' ').split(' '),
                        toCheck = $.trim(val).split(/\s+/).length;

                    return toCheck >= parseFloat(rangeArr[0]) && toCheck <= parseFloat(rangeArr[1]);
                }
            },

            /**
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

            /**
             * integer only - allows negatives, but not decimals
             * @param val {string}
             * @return {boolean}
             */
            integer: {
                regex: /^-?\d+$/,
                validate: function (val) {
                    return rules.integer.regex.test(val);
                }
            },

            /**
             * digits only - no decimal or negative values allowed
             * @param val {string}
             * @return {boolean}
             */
            digits: {
                regex: /^\d+$/,
                validate: function (val) {
                    return rules.digits.regex.test(val);
                }
            },

            /**
             * must be checked - becomes an alias for required when used on a radio or checkbox
             * @param val {string}
             * @return {boolean}
             */
            checked: {
                validate: function (val) {
                    return app.element.isCheckable($(this))
                        ? app.element.getByAttribute($(this), 'name').filter(':checked').length > 0
                        : val !== '-1';
                }
            },

            /**
             * must be unchecked
             * @param val {string}
             * @return {boolean}
             */
            unchecked: {
                validate: function (val) {
                    return app.element.isCheckable($(this))
                        ? app.element.getByAttribute($(this), 'name').filter(':checked').length === 0
                        : val === '-1';
                }
            },

            /**
             * mac address validation
             * @param val {string}
             * @return {boolean}
             */
            mac: {
                regex: [
                    /^([0-9A-Fa-f]{2}[:\-]){5}([0-9A-Fa-f]{2})$/,
                    /^([0-9A-Fa-f]{4}\.){2}([0-9A-Fa-f]{4})$/
                ],
                validate: function (val) {
                    return rules.mac.regex[0].test(val) || rules.mac.regex[1].test(val);
                }
            },

            /**
             * test value against the value of another input - must use {!space} for spaces needed in the selector
             * @param val {string}
             * @param selector {string|jQuery object}: if string, can include basic jQuery methods
             *      e.g. "$(this).parent().prev().find('input[type=\"text\"]')"
             *      deliberately restricted so that each jQuery method used can only take one string paramater
             *      specific handling is included to handle the 'this' keyword in the string
             * @return {boolean}
             */
            confirm: {
                validate: function (val, selector) {
                    var a = [],
                        $element = $(this),
                        $current,
                        length,
                        func,
                        arg,
                        i;

                    // if it starts with a $, and ends with ')', assume full jquery selector has been provided
                    // allow use of $(this) at start only
                    // allow use of simple chained methods - only let them accept one string parameter e.g. $(this).parents('.elem').find('input')
                    if (typeof selector === 'string' && selector.charAt(0) === '$' && selector.charAt(selector.length - 1) === ')') {
                        // add in '(empty)' for methods that will take no argument
                        a = $.trim((selector + ' ').split('()').join('(empty)').replace(') ', '')).split(/[\)\(]/g);
                        length = a.length;

                        // things get messy now...
                        for (i = 0; i < length; i += 2) {
                            func = a[i];
                            arg = a[i + 1];

                            // handle the function to be used
                            if (func === '$' && typeof $current === 'undefined') {
                                // handle starting case
                                // if given 'this', use current context; if given empty, set to undefined, otherwise use as is
                                $current = $(arg === 'this' ? this : arg === 'empty' ? undefined : arg.substr(1, arg.length - 2));
                            } else if (func.slice(0, 1) !== '.') {
                                // if not starting case, make sure 'func' starts with a '.' to indicate a jQuery method
                                app.error([
                                    'confirm rule: Incorrectly formatted jQuery selector function \n',
                                    'Only basic methods (e.g. .parent(), .find(), etc.) are permitted,',
                                    'and only a single string argument will be accepted for them'
                                ].join(''));
                                return false; // ensure the rule fails
                            } else {
                                // get the next jQuery method
                                func = func.replace('.', '');

                                // update $current
                                // once past starting case, only allow undefined or strings
                                if (arg === 'empty') {
                                    $current = $current[func]();
                                } else {
                                    $current = $current[func](arg.substr(1, arg.length - 2));
                                }

                                // error handling
                                if (typeof $current === 'object' && !$current.length) {
                                    app.error([
                                        'confirm rule: Failed to parse your selector \n',
                                        'The element you were after could not be found'
                                    ].join(''));
                                    return false; // ensure the rule fails
                                }
                            }
                        }

                        if (typeof $current !== 'object') {
                            app.error('confirm rule: Your selector must return an element');
                            return false;
                        }
                    }

                    if (typeof $current === 'undefined') {
                        $current = $(selector);
                    }

                    // trigger validation on this element on change event for the selector
                    if ($current.data('validation-confirm-change-bound') !== true) {
                        $current.data('validation-confirm-change-bound', true).on('change', function () {
                            app.validate.element.call($element);
                        });
                    }

                    return val === $current.val();
                }
            },

            /**
             * custom regular expression check - must use {!space} for spaces needed in expression
             * @param val {string}
             * @param reg {string|object}
             * @return {boolean}
             */
            regex: {
                toStringProto: Object.prototype.toString,
                validate: function (val, reg) {
                    var flags,
                        arr;

                    if (typeof reg === 'string') {
                        // if the string begins with '/', format from /regex/flags to new RegExp(regex, flags)
                        if (reg.charAt(0) === '/') {
                            arr = reg.split('/');
                            flags = arr.pop();
                            arr.shift();
                            reg = arr.join('/');
                        }
                        return new RegExp(reg, flags).test(val);
                    } else if (rules.regex.toStringProto.call(reg) === '[object RegExp]') {
                        return reg.test(val);
                    }
                }
            },

            /**
             * date test
             * @param val {string}
             * @return {boolean}
             */
            date: {
                regex: /Invalid|NaN/,
                isoregex: /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/,
                validate: function (val, iso) {
                    if (iso === 'iso') {
                        return rules.date.isoregex.test(val);
                    } else if (!!iso) {
                        app.error('date validation rule: the specified type \'' + iso + '\' is not checkable');
                    }
                    return !rules.date.regex.test(new Date(val).toString());
                }
            },

            /**
             * url test
             * https://gist.github.com/dperini/729294
             * @param val {string}
             * @return {boolean}
             */
            url: {
                regex: new RegExp([
                    '^',
                    // protocol identifier
                    '(?:(?:https?|ftp)://)',
                    // user:pass authentication
                    '(?:\\S+(?::\\S*)?@)?',
                    '(?:',
                    // IP address exclusion
                    // private & local networks
                    '(?!(?:10|127)(?:\\.\\d{1,3}){3})',
                    '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})',
                    '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})',
                    // IP address dotted notation octets
                    // excludes loopback network 0.0.0.0
                    // excludes reserved space >= 224.0.0.0
                    // excludes network & broacast addresses
                    // (first & last IP address of each class)
                    '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])',
                    '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}',
                    '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))',
                    '|',
                    // host name
                    '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)',
                    // domain name
                    '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*',
                    // TLD identifier
                    '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))',
                    // TLD may end with dot
                    '\\.?',
                    ')',
                    // port number
                    '(?::\\d{2,5})?',
                    // resource path
                    '(?:[/?#]\\S*)?',
                    '$'
                ].join(''), 'i'),
                validate: function (val) {
                    return rules.url.regex.test(val);
                }
            },

            /**
             * ip address testing allowing cidr notation
             * expressions derived from regular expressions cookbook second edition (august 2012)
             * @param val {string}
             * @return {boolean}
             */
            ipaddress: {
                separators: /[\,\-\_\|\:]/g,

                expr: {
                    ipv4: new RegExp([
                        '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}',
                        '(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
                        '(\/([0-9]|[1-2][0-9]|3[0-2]))?', // allow cidr notation
                        '$'
                    ].join('')),
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
                    ].join(''))
                },

                validate: function (val, types) {
                    var expr = rules.ipaddress.expr,
                        thisType,
                        i;

                    types = $.trim(types) || ['ipv4', 'ipv6'];

                    if (typeof types === 'string') {
                        types = types.split(rules.ipaddress.separators);
                    }

                    // cycle through types
                    for (i = 0; i < types.length; i += 1) {
                        thisType = types[i];
                        // if we have an expression for that type, check it
                        if (typeof expr[thisType] === 'object') {
                            // if it passes, return true immediately
                            if (expr[thisType].test(val)) {
                                return true;
                            }
                        } else {
                            app.error('ipaddress validation rule: the specified type \'' + thisType + '\' is not checkable');
                        }
                    }

                    // return false by default
                    return false;
                }
            },

            /**
             * credit card check
             * @param val {string}
             * @return {boolean}
             */
            creditcard: {
                notAllowed: new RegExp('[^0-9 \\-]+'),
                nonDigits: /\D/g,
                validate: function (val) {
                    // accept spaces, digits and dashes only
                    if (rules.creditcard.notAllowed.test(val)) {
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

            /**
             * colour validation
             * @param val {string}
             * @param types {string|array} optional: string or array of colour types
             *      allowed colour types: keywords, hex, hsl, hsla, rgb, rgba - defaults to all
             *      can be comma, hyphen, underscore, pipe, or colon delimited as a string
             */
            colour: {
                separators: /[\,\-\_\|\:]/g,

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
                    types = $.trim(types) || ['keywords', 'hex', 'hsl', 'hsla', 'rgb', 'rgba'];

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
                        } else {
                            app.error('colour validation rule: the specified type \'' + thisType + '\' is not checkable');
                        }
                    }

                    // return false by default
                    return false;
                }
            },

            /**
             * add a test to the internal rules
             * @param name {string}
             * @param test {function}
             * @return {boolean}: whether the test has been successfully added
             */
            addTest: function (name, test) {
                if (typeof name !== 'string' || typeof test !== 'function') {
                    app.error('validation.addTest(): A string and a function are required to add a validation test');
                    return false;
                }

                // only store rules as lowercase for consistency, and to protect methods
                name = name.toLowerCase();

                // do not override any existing rules
                if (typeof rules[name] === 'undefined') {
                    rules[name] = {
                        validate: function (val, param) {
                            return test.call(this, val, param);
                        }
                    };

                    // regenerate string of error classes when a new rule is added
                    rules.setErrorClassString();
                    return true;
                }
                return false;
            },

            /**
             * set rule aliases
             */
            setRuleAliases: function () {
                var i,
                    j,
                    thisAlias,
                    aliases = [
                        'required', 'alpha', 'alphanumeric', 'email', 'equalto', 'format', 'pattern', 'number', 'numeric', 'integer',
                        'digits', 'ip', 'ipaddress', 'checked', 'unchecked', 'mac', 'date', 'url', 'uri', 'creditcard', 'color', 'colour'
                    ],
                    length = aliases.length;

                // set specific aliases
                rules.uri = rules.url;
                rules.ip = rules.ipaddress;
                rules.color = rules.colour;
                rules.numeric = rules.number;
                rules.pattern = rules.regexp = rules.regex;
                rules.equals = rules.equalto = rules.matches = rules.match;

                // create is- aliases
                for (i = 0; i < length; i += 1) {
                    thisAlias = aliases[i];
                    rules['is' + thisAlias] = rules[thisAlias];
                }
            },

            /**
             * generate array of all available rules to be exposed
             * generate space delimited string of all rule error classes
             */
            setErrorClassString: function () {
                var i,
                    a = [],
                    r = ['validation-failed'];

                for (i in rules) {
                    if (rules.hasOwnProperty(i) && typeof rules[i] === 'object' && $.isArray(rules[i]) === false) {
                        a.push(i); // add to array of rules to be exposed
                        r.push('validation-failed-' + i); // rule error class
                        r.push('validation-failed-not-' + i); // negated rule error class
                    }
                }

                if (root.validation) {
                    root.validation.rules = a;
                }
                rules.allRules = a;
                rules.errorClassString = r.join(' ');
            }
        };

    /**
     * main application methods
     */
    app = {

        /**
         * helper method for throwing errors
         * @param message {string}: error message
         */
        error: function (message) {
            if (root.validation.debug) {
                throw new Error(message);
            }
        },

        /**
         * get data from all inputs in the form
         * @param $form {jQuery object} optional: defaults to using the forms with validation set, or the whole page
         * @param attribute {string} optional: attribute to use - defaults to name
         * @return {object}
         */
        getFormData: function ($form, attribute) {
            // handle defaults
            $form = $($form || '[data-validation="set"]');
            attribute = attribute || 'name';

            // default to finding all inouts on the page if no validation has been set
            if (typeof $form !== 'object' || !$form.length) {
                $form = $(document);
            }

            var $inputs = $form.add($form.find('input, select, textarea')).not('[type="submit"], [type="button"]'),
                data = {};

            // update data object with input value
            $inputs.each(function () {
                if (!/input|select|textarea/i.test(this.nodeName)) {
                    return;
                }

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
                length = attrArray.length - 1;

                // set the level in the object that we want to add the new property
                for (i = 0; i < length; i += 1) {
                    if (typeof currentDataPoint[attrArray[i]] !== 'object') {
                        currentDataPoint[attrArray[i]] = {};
                    }
                    currentDataPoint = currentDataPoint[attrArray[i]];
                }

                // use length - 1 so the final entry in the array is used as the property name
                currentDataPoint[attrArray[length]] = app.element.getValue($input, attribute);
            });

            return data;
        },

        /**
         * element handling
         */
        element: {

            /**
             * check if element is checkbox or radio type
             * @param $elem {jQuery object}
             * @return {boolean}
             */
            isCheckable: function ($elem) {
                return (/radio|checkbox/i).test($elem.attr('type'));
            },

            /**
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

            /**
             * get element value
             * @param $el {jQuery object}
             * @param attribute {string} optional: attribute to use when selecting multiple elements
             * @return {string}
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

                // always return a string - join group values with commas
                return result.join(',');
            },

            /**
             * toggle element classes based on validation, and trigger custom events
             * @param $el {jQuery object}
             * @param result {boolean|string}: true if validation has passed, otherwise string indicating failed rule
             */
            setClasses: function ($el, result) {
                // remove all rule classes e.g. failed-number
                // look for error messages by name attribute first, then check id
                var attr = $el.removeClass(rules.errorClassString).attr('name') || $el.attr('id'),
                    $errors = attr ? $('[data-validation-for="' + attr + '"]') : undefined;

                // toggle remaining needed classes and trigger validation event
                // use triggerHandler to prevent event bubbling
                if (result === true) {
                    $el.trigger('validation.field.passed').triggerHandler('validation.passed');
                } else {
                    $el.addClass('validation-failed validation-failed-' + (result.indexOf('!') === 0 ? result.replace('!', 'not-') : result))
                        .trigger('validation.field.failed', result).triggerHandler('validation.failed', result);
                }

                // if any error messages exist, hide them, and show the correct one if validation failed
                if ($errors && $errors.length) {
                    $errors.hide();
                    if (result !== true) {
                        $errors.filter('[data-validation="' + result + '"]').show();
                    }
                }
            },

            /**
             * build space delimitted rules string
             * @param $el {jQuery object}: elements to use when getting validation rules
             * @return {string}
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
                    var elemRules = $(this).data('validation'),
                        arr = [],
                        length,
                        i;

                    // continue if no validation rules are specified on the element
                    if (typeof elemRules === 'undefined') {
                        return;
                    }

                    arr = elemRules.split(' ');
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
                return $.trim((' ' + result.join(' ') + ' ').replace(/ !required | !isrequired /g, ' '));
            }

        },

        /**
         * validate storage
         */
        validate: {

            /**
             * trigger validation on whole form - validates all set form elements
             * @param e {object}: event object
             * @return {boolean}: if validation has passed
             */
            all: function (e) {
                var $holder = $(this),
                    data = app.getFormData($holder),
                    $elems = $holder.find('input[data-validation], select[data-validation], textarea[data-validation]');

                $elems.each(app.validate.element);

                if ($elems.filter('.validation-failed').length) {
                    $holder.addClass('validation-failed').trigger('validation.section.failed', data)
                        .triggerHandler('validation.failed', data);

                    // return value, and prevents default action if event object is passed in
                    return false;
                }

                $holder.removeClass('validation-failed').trigger('validation.section.passed', data)
                    .triggerHandler('validation.passed', data);

                return true;
            },

            /**
             * test an individual rule
             * @param $el {jQuery object}
             * @param value {string}
             * @param currentRule {string}
             * @param checkRequired {boolean}: internal only - whether to run a standard check on the required rule
             * @return {string|undefined}: returns the rule if the check fails, otherwise returns nothing
             */
            rule: function ($el, value, currentRule, checkRequired) {
                var bool = false,
                    splitCurrent,
                    splitRule,
                    param,
                    i;

                // ignore empty strings - result of too many spaces separating rules
                // if negating required, return immediately so that the value is treated as optional
                if (currentRule === '' || currentRule === '!required' || currentRule === '!isrequired') {
                    return;
                }

                // extract any provided param - use shift and join to handle multiple colons in value
                if (currentRule.indexOf(':') > -1) {
                    splitRule = currentRule.split(':');
                    currentRule = splitRule.shift();
                    param = splitRule.join(':').split('{!space}').join(' ');
                }

                // all validation rules are stored as lower case
                currentRule = currentRule.toLowerCase().split('{!space}').join(' ');

                // handle exclamation marks before the rule - use loop to handle multiple
                // e.g. '!!rule!name' equates to 'not not rule!name'
                while (currentRule.indexOf('!') === 0) {
                    bool = !bool;
                    currentRule = currentRule.replace('!', '');
                }

                // check that the rule exists
                if (typeof rules[currentRule] !== 'object') {
                    return app.error('Validation rule \'' + currentRule + '\' does not exist.');
                }

                // only proceed on required rule when called via validation.validate
                if (checkRequired === false && (currentRule === 'required' || currentRule === 'isrequired')) {
                    return;
                }

                // run the check - if it fails, return the rule
                if (rules[currentRule].validate.call($el, value, param) === bool) {
                    return (bool ? '!' : '') + currentRule;
                }
            },

            /**
             * cycle through all rules for an element
             * @param $el {jQuery object}
             * @param rulesArr {array}: array of rule strings
             * @param value {string}: element value
             * @param checkRequired {boolean}: internal only
             * @return {boolean|string}: a string containing the failed rule, or true if validation passed
             */
            rules: function ($el, rulesArr, value, checkRequired) {
                var length = rulesArr.length,
                    result = true,
                    i;

                // cycle through remaining rules
                for (i = 0; i < length; i += 1) {
                    result = app.validate.rule($el, value, rulesArr[i], checkRequired);
                    if (typeof result === 'string') {
                        return result;
                    }
                }

                return true;
            },

            /**
             * validate an individual element
             * @return {string|boolean}: returns the first failed rule, or true if validation has passed
             */
            element: function () {
                var $el = $(this),
                    value = app.element.getValue($el),
                    isCheckable = app.element.isCheckable($el),
                    result = true,
                    rulesString;

                // for radio and input types, select all elements with that name
                if (isCheckable) {
                    $el = app.element.getByAttribute($el, 'name');
                }

                // fetch rules once we have all the necessary elements
                rulesString = app.element.getRules($el);

                if ($.trim(rulesString) === '') {
                    return;
                }

                // if radio or checkbox, make checked an alias for required
                if (isCheckable) {
                    rulesString = $.trim((' ' + rulesString + ' ').replace(/ checked | ischecked /i, ' required '));
                }

                // use required function to check if value is empty
                if (!rules.required.validate.call($el, value)) {
                    // return 'required' or 'isrequired' if in validation rules, otherwise pass
                    result = (' ' + rulesString.toLowerCase() + ' ').indexOf(' required ') > -1
                        ? 'required'
                        : (' ' + rulesString.toLowerCase() + ' ').indexOf(' isrequired ') > -1
                        ? 'isrequired'
                        : true;
                } else {
                    // if value is not empty, cycle through any remaining rules
                    result = app.validate.rules($el, rulesString.split(' '), value, false);
                }

                app.element.setClasses($el, result);
                return result;
            },

            /**
             * trigger validation based on element(s) or string - when checking a string, also takes a string or array of rules to test
             * @param value {HTMLElement|jQuery object|string|array}:
             *      if form element(s) (input, select, textarea), will validate those elements
             *      if any other element, will validate all form elements inside
             *      if given a string, will validate that string against the rules in tests param
             *      if array, will cycle through entries running tests against each one
             * @param tests {string|array} optional: set of rules to run against the value(s)
             *      use space delimitted string e.g. 'required alpha minlength:5' or array e.g. ['required', 'alpha', 'minlength:5']
             *      is not used if the value param is not a string
             * @return {boolean|string}: if validating an element, returns true if it it passes, false if not
             *      if validating a string, returns true if it passes, or the first rule that fails
             *      if validating an array, returns true if all entries pass the tests, false if any fail
             *      validation assumed to have passed if testing a string against non-existent rule(s) (unless debugging)
             *      also returns false if element does not exist
             */
            handle: function (value, tests, checkRequired) {
                var $elems,
                    i;

                // handle null or undefined - force to an empty string to prevent errors
                if (typeof value === 'undefined' || value === null) {
                    app.error('validation.validate(): first arg should be a string (or array of strings) or element');
                    value = '';
                }

                // handle element case - always used internally
                if (typeof value === 'object' && !$.isArray(value)) {
                    if (!($elems = $(value)).length) {
                        app.error('validation.validate(): element could not be found');
                    }
                    return $elems.is('input, select, textarea')
                        ? $elems.each(app.validate.element).filter('.validation-failed').length === 0
                        : app.validate.all.call($elems);
                } else {
                    // value case - accessible from API
                    tests = tests || '';
                    // turn into array
                    if (typeof tests === 'string') {
                        tests = tests.split(' ');
                    }
                    // handle array of values
                    if ($.isArray(value)) {
                        for (i = 0; i < value.length; i += 1) {
                            if (app.validate.handle(value[i], tests, true) !== true) {
                                return false;
                            }
                        }
                        return true;
                    }
                    // set context to an empty object when calling
                    return app.validate.rules({}, tests, value, checkRequired || false);
                }
            }
        },

        /**
         * given holder element as context
         */
        prep: function () {
            // reset the data-validation attribute so that events are not bound on subsequent init calls
            var $form = $(this).attr('data-validation', 'set');

            // bind full submit handling to the form submit event if using a normal form
            if (this.nodeName === 'FORM') {
                $form.on('submit', function (e) {
                    return app.validate.handle(this);
                });
            }

            // bind to validation-trigger elements - use the closest form to allow nested forms
            $form.on('click', '.validation-trigger', function (e) {
                if (!$form.parent().closest('[data-validation="set"]').length) {
                    app.validate.handle($(this).closest('[data-validation="set"]'));
                }
            });

            // bind individual input change events
            $form.on('change', 'input, select, textarea', function (e) {
                // check if the form itself has a parent form as we only want to fire the delegated event once
                var prevent = $form.parent().closest('[data-validation="set"]').length ||
                    // if radio or checkbox, check if any in the same group have a data-validation attribute
                    // otherwise, just check if validation attribute exists on the element
                    (app.element.isCheckable($(this))
                        ? !app.element.getByAttribute($(this), 'name').filter('[data-validation]').length
                        : typeof $(this).data('validation') === 'undefined');

                if (!prevent) {
                    app.validate.handle(this);
                }
            });
        },

        /**
         * primary setup method
         */
        init: function () {
            $('[data-validation="true"]').each(app.prep);
        }
    };

    // set rules aliases
    rules.setRuleAliases();

    // generate string of error classes for use in setClasses method
    rules.setErrorClassString();

    // expose
    return {
        init: app.init,
        debug: false,
        addTest: rules.addTest,
        getFormData: app.getFormData,
        rules: rules.allRules,
        validate: function (value, rules) {
            return app.validate.handle(value, rules, true);
        }
    };

}));

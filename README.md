# validation - work in progress
A simple client side validation library that both does and doesn't interfere.

It doesn't attach itself to input change events or form submit events, nor does it manipulate the DOM for you by automatically displaying errors or setting classnames... unless you want it to...

You can either use the exposed `validate` method to check a value against a set of rules, and then set classes/display error messages as you please based on the result, or you can trigger the validation using data attributes in your HTML and have it set classes and display errors for you.

### Usage
##### validate method
You can test values against the built-in rules manually using `validation.validate(value, rules)` where `value` is a string and `rules` is either a space-delimited set of rules, or an array of rules, e.g. `validation.validate(value, 'alpha alphanumeric')` - the library will then test the value against the chosen rules in sequence, returning `true` if the value passes all of the provided rules, or it will return the first failed rule as a string. E.g. `validation.validate('test', 'email')` will return `'email'`, but `validation.validate('lorem@ipsum.dolor', 'email')` will return `true`.

Certain rules might require additional parameters such as `minlength` or `maxwords` - these can be provided to the rule via a simple colon syntax e.g. `validation.validate(value, ['minlength:5', 'maxlength:200'])` (this example can also be achieved via `validation.validate(value, 'rangelength:5:200')`).

The `validate` method can also accept an array of values to check against the specified rules. In this case, the method only returns a boolean - `true` if all of the values have passed, `false` if any one of them fails.

##### data attributes
As well as the `validate` method, the validation library can also makes use of a data attribute API to run client side validation on your forms for you, attaching all of the necessary JavaScript events and setting error classes automatically - all you have to do is use the `data-validation` attribute on the relevant elements in your HTML, and then initialise it using `validation.init()`.

The data API differentiates between **form elements** and **form sections**, allowing you to have nested forms, or clearly separated form sections as necessary. At least one section is required, and change events are then bound to the form elements inside. A section is indicated by setting the attribute to true, e.g. `<form data-validation="true">`. This can be set on any element, but when set on a `<form>` tag it will also attach a submit event to the form, preventing it from submitting if any of the elements inside have failed their respective validation. (Note: after the `init` method is called, the attribute is changed from "true" to "set" to indicate to the script which sections have already had their events bound)

Setting the validation rules on elements is then done in the same way, this time using space delimited sets of rules instead of setting it to true, e.g. `<input type="text" data-validation="required alphanumeric minlength:10" />`. Unliked with the `validate` method mentioned above, this time we have to specify if it is a required field, otherwise it is considered optional and the value will only be checked against the validation rules if a value exists, otherwise it will allow the input to remain empty.

Notes:
1. When setting the rules on checkbox or radio button groups, you only have to set the data attribute on one of them, and its validation rules will be applied to the whole group (or you can set it on all of them if you prefer).
2. If the section you're validating is not a `<form>` tag, you can set the class "validation-trigger" on any buttons, anchors, etc. inside that you want to trigger the validation when clicked.
3. The rules are separated by spaces, but on occasion you may need to indicate that a space is supposed to be included for certain rule parameters, or if a custom rule has been added that included a space in the name. This can be indicated via the following: "{!space}". E.g.
```html
`<input type="text" data-validation="required custom{!space}rule matches:this{!space}text" />`
```

##### validate method again
As well as its usage specified above, the `validate` method can take an element, or sets of elements, to have their validation manually triggered. It can accept jQuery objects, or standard HTML element collections. If form elements are passed to the method (inputs, selects, textareas), it will trigger the validation rules for each of them specified in their data attribute. If any other HTML element is passed to it, it will find any form elements inside and validate them. E.g.

```js
validation.validate($('form'));
validation.validate(document.getElementsByTagName('input'));
```

##### classnames and jQuery events
There are no specific classes added if the validation passes, only if it fails. A generic "validation-failed" class is added to both form elements and sections that fail validation. An additional class is added to the form elements based on the validation rule that failed e.g. "validation-failed-alpha".

Custom jQuery events are triggered on the form elements and sections to indicate if validation has passed or failed via `validation.passed` and `validation.failed` events respectively. When triggered on a section the event is passed the form data within that section as a JavaScript object,

Things to consider when using the custom events:
1. The events do not bubble
2. When the validation for a section is triggered, the appropriate event fires on the closest parent form section only - it does not fire on any other sections further up the DOM tree, or on any of its descendants (the same principle applies to the "validation-failed" class)
3. The events will always fire on form elements before they fire on the parent section
4. After an attempt has been made to submit a section, change events on form elements within that section will trigger the validation for the entire section, including all form elements inside it. This is done to enable certain expected behaviours, such as comparing the values of two fields

### Validation Rules
There are a selection of built in validation rules, as well as the ability to add your own custom rules if necessary. If you are unsure of what of values might pass or fail certain rules, there are many examples in `test/tests.js`. The built in validation rules are as follows:

##### required
**behaviour:** checks that the element has a value, that at least one checkbox/radio button in the group is selected, that the value of the chosen option in a dropdown is not an empty string (0 or -1 are permitted as they may be intentional)
**aliases:** isrequired

##### alpha
**behaviour:** value does not contain spaces, numbers, or special characters - only letters
**aliases:** isalpha

##### alphanumeric
**behaviour:** value does not contain spaces, or special characters - only letters and numbers
**aliases:** isalphanumberic

##### email
**behaviour:** value is a valid email address, [as defined in the HTML spec](https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address), which allows examples such as test@test
**aliases:** isemail

##### match
**behaviour:** value exactly matches a specific value e.g. 'match:thisvalue' or 'match:this{!space}value{!space}with{!space}spaces'
**aliases:** matches, equalto, equals, isequalto

##### min
**behaviour**: number check - value is equal to or greater than the specified number e.g. 'min:5', 'min:-5'

##### max
**behaviour**: number check - value is equal to or less than the specified number e.g. 'max:5', 'max:-5'

##### range
**behaviour**: number check - value is equal to or between than the specified numbers e.g. 'range:10:20'

##### minlength
**behaviour**: character check - value has at least this many characters e.g. 'minlength:10'

##### maxlength
**behaviour**: character check - value does not exceed this many characters e.g. 'maxlength:200'

##### rangelength
**behaviour**: character check - number of characters is between the specified numbers (only positives allowed) e.g. 'rangelength:10:200'

##### minwords
**behaviour**: word count - must have at least this many words e.g. 'minwords:10'

##### maxwords
**behaviour**: word count - must not have more than this many words e.g. 'maxwords:100'

##### rangewords
**behaviour**: word count - must have between this many words (inclusive - only positives allowed) e.g. 'rangewords:10:100'

##### number
**behaviour:** value must be a number (allows trailing or preceding spaces e.g. ' 12.5', '12.5 ')
**aliases:** numeric, isnumber, isnumeric

##### integer
**behaviour:** value must be an integer (does not allow preceding or trailing spaces)
**aliases:** isinteger

##### digits
**behaviour:** value must only contain digits (forced positive integer check)
**aliases:** isdigits

##### checked
**behaviour:** at least one checkbox within the group is selected, or the value is not -1 (this is replaced by a 'required' check internally when used on a radio button or checkbox)
**aliases:** ischecked

##### unchecked
**behaviour:** must not have any checkboxes within the group selected (or value must be -1)
**aliases:** isunchecked

##### confirm
**behaviour:** check that the value matches the value contained inside another input, useful for 'confirm password' or 'confirm email' fields - must be passed a jQuery selector e.g. 'confirm:#an-id', 'confirm:#an-ids>.direct-child', 'confirm:#an-ids{!space}.child'.
This can also accept basic jQuery function syntax e.g. 'confirm:$(".element").find(".something")'
**note:** remember to escape strings as necessary

##### regex
**behaviour:** check the value against a chosen regular expression e.g. 'regex:^[a-zA-Z0-9]*$' - if you need to include flags, you can use the full regex syntax including slashes e.g. 'regex:/\D/g'
**aliases:** regexp, pattern, ispattern

##### date
**behaviour:** must be a valid date string - simply checks the value against the regular expression `/Invalid|NaN/`
**aliases:** isdate

##### url
**behaviour:** must be a valid url
**aliases:** isurl

##### ipaddress
**behaviour:** must be a valid ip address - allows ipv4 or ipv6 addresses, including CIDR notation
**aliases:** ip, isip, isipaddress

##### creditcard
**behaviour:** must be a valid credit card number
**aliases:** iscreditcard

##### colour
**behaviour:** must be a valid colour string - allows keywords, hex, hsl, hsla, rgb, and rgba strings by default. Can also specify which type of colours strings to allow e.g. 'colour:hex:rgb:keywords'
**aliases:** color, iscolor, iscolour

### Custom validation tests
You can add your own custom rules via the `addTest` method. This accepts two arguments: a string used as the name for the rule (this will be set to lowercase), and the function to run, which needs to return a boolean. The function is also provided 2 arguments: the value to be checked, and any parameters included (as a string). For example, we might add an equivalent of the `match` check as follows:
```js
validation.addTest('customtest', function (val, match) {
    return val === match;
});
```
The function returns a boolean indicating if your test was successfully added, and can then be used either via the `validate` method: `validation.validate(value, customtest:something)` or included in the data attribute in your HTML: `<input type="text" data-validation="required customtest:something" />`

### debug mode
By default, the script handles potential errors silently, but you can enable debug mode if necessary (advised for development only) via by setting the `debug` property to a truthy value e.g. `validation.debug = true;`.

Example errors this will highlight that would otherwise be handled silently:
1. if the `validate` method is passed a null or undefined value, or a non-existing element
2. if attempting to add a test without a name and/or function specified for it
3. if attempting to test a value against a non-existing rule

### Global Object
For reference, the global validation object that is exposed is as follows:
```js
{
    // initialises the data-attribute variant
    init: function () {},
    // used to enable/disable debug mode to show errors rather than fail silently
    debug: false,
    // used to add a custom test to the set of rules - the name will be set to lowercase
    addTest: function (testName, testFunction) {},
    // get all of the form data as a JavaScript object inside of a specified element
    // will select all form elements by default of no context point is provided
    getFormData: function ($context) {},
    // an array of all the available rules, including aliases
    // the array is also updated every time a custom test is added
    rules: [],
    // run certain rules against a value or set of values
    // or trigger validation on form elements (or descendant form elements of a parent item)
    validate: function (value, rules) {}
}
```

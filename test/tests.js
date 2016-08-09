var num = 0,
    expect = chai.expect,
    $validForm = $('#valid-holder'),
    $invalidForm = $('#invalid-holder'),
    createInput = function (type, rules, value) {
        var input = ['<input type="text" data-validation="'],
            id = type + '-' + (Date.now() + (num += 1) + Math.round(Math.random() * 10));
        // add rules
        input.push(rules);
        input.push('"');
        // add value
        if (value) {
            input.push(type === 'checkbox' || type === 'radio' ? 'checked="' : 'value="');
            input.push(value);
            input.push('"');
        }
        // add randomly generated id
        input.push('id="');
        input.push(id);
        input.push('"');
        // close
        input.push('/>');
        return $(input.join(''));
    };

describe('In basic use it...', function () {

    it('should be accessible from \'validation\' variable', function () {
        expect(typeof validation === 'object').to.equal(true);
    });

    it('should fail silently if the \'validate\' method is passed a null or undefined value, or a non-existing element', function () {
        expect(validation.validate()).to.equal(false);
        expect(validation.validate(null)).to.equal(false);
        expect(validation.validate($('.no-element'))).to.equal(false);
    });

    it('should be possible to extend the tests with a custom rule', function () {
        expect(validation.addTest('testrule', function (val, param) {
            return param === 'hello' && val === 'hello';
        })).to.equal(true);
        expect(validation.validate('hello', 'testrule:hello')).to.equal(true);
        expect(validation.validate('hello', 'testrule')).to.equal('testrule');
        expect(validation.validate('not hello', 'testrule:hello')).to.equal('testrule');
        expect(validation.validate('not hello', 'testrule:not-hello')).to.equal('testrule');
    });

    it('should return false if attempting to add a test without a name and/or function specified for it', function () {
        expect(validation.addTest()).to.equal(false);
        expect(validation.addTest('name')).to.equal(false);
        expect(validation.addTest(null, function () {})).to.equal(false);
    });

    it('should return true if attempting to test a value against a non-existent rule', function () {
        expect(validation.validate('test', 'ruledoesnotexist')).to.equal(true);
    });

    it('should be able to chain rules together, returning true if they all pass, or a string indicating the failed rule', function () {
        expect(validation.validate('hello', 'required alpha minlength:4 maxlength:6 minwords:0 maxwords:5')).to.equal(true);
        expect(validation.validate('hello', 'required minlength:4 numeric')).to.equal('numeric');
        expect(validation.validate('hello', 'required alpha minlength:4 maxlength:6 minwords:2')).to.equal('minwords');
    });

});

describe('When Debugging it...', function () {

    it('should error if the \'validate\' method is passed a null or undefined value, or a non-existing element', function () {
        validation.debug = true;
        expect(validation.validate).to.throw(Error);
        expect(validation.validate.bind(null)).to.throw(Error);
        expect(validation.validate.bind($('.no-element'))).to.throw(Error);
        validation.debug = false;
    });

    it('should error if attempting to add a test without a name and/or function specified for it', function () {
        validation.debug = true;
        expect(validation.addTest).to.throw(Error);
        expect(validation.addTest.bind('name')).to.throw(Error);
        expect(validation.addTest.bind(null, function () {})).to.throw(Error);
        validation.debug = false;
    });

    it('should error if attempting to test a value against a non-existing rule', function () {
        var test = function () {
            validation.validate('test', 'ruledoesnotexist');
        };
        validation.debug = true;
        expect(test).to.throw(Error);
        validation.debug = false;
    });

});

describe('For the main rules it...', function () {

    it('should be able to approve a required value', function () {
        var rule = 'required',
            $input = createInput('text', 'required');

        ['', 0, false].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });

        expect(validation.validate($input, rule)).to.equal(false);

        ['hello', true, 1, $input.val('value')].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });
    });

    it('should be able to approve an alpha value', function () {
        var rule = 'alpha',
            $input = createInput('text', 'alpha', 'some text');

        ['alpha', 'BRAVO', 'ChArLiE', $input].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });

        ['0', '-alpha_', '***,.', 'bravo77'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });

        expect(validation.validate($input.val('m1x3d'))).to.equal(false);
    });

    it('should be able to approve an alphanumeric value', function () {
        var rule = 'alphanumeric',
            $input = createInput('text', 'alphanumeric', 's0m3t3xt');

        ['a1pha', '8RAVO', 'ChAr1i3', 'de1tA', 'echo', '1234567890', $input].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });

        ['1.1', '--', '@£$%&'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });

        expect(validation.validate($input.val('m1x3d*-*&'))).to.equal(false);
    });

    it('should be able to approve an email address', function () {
        var rule = 'email',
            $input = createInput('email', 'email', 'test@test.com');

        ['test@test.com', 'a_start-email@domain-name.com', 'a@a', $input].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });

        ['üñîçøðé@üñîçøðé.com', 'Abc.example.com', 'A@b@c@example.com', 'a"b(c)d,e:f;gi[j\k]l@example.com',
         'just"not"right@example.com', 'this is"not\allowed@example.com', 'this\ still\"not\\allowed@example.com'
        ].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });

        expect(validation.validate($input.val('not email'))).to.equal(false);
    });

    it('should be able to check if a value is greater than or equal to another (min test)', function () {
        var rule = 'min',
            $input = createInput('text', 'min:5', '70');
        [
            ['10', 'min:10'],
            ['-6', 'min:-7'],
            ['10000', 'min:30'],
            [$input, 'min:5']
        ].forEach(function (i) {
            expect(validation.validate(i[0], i[1])).to.equal(true);
        });

        [
            ['10', 'min:11'],
            ['-6', 'min:1'],
            ['10000', 'min:30000'],
            [50, 'min']
        ].forEach(function (i) {
            expect(validation.validate(i[0], i[1])).to.equal(rule);
        });

        expect(validation.validate($input.val('4'))).to.equal(false);
    });

    it('should be able to check if a value is less than or equal to another (max test)', function () {
        var rule = 'max',
            $input = createInput('text', 'max:50', '7');
        [
            ['10', 'max:180'],
            ['-6', 'max:-2'],
            ['-10000', 'max:0'],
            [$input, 'max:50']
        ].forEach(function (i) {
            expect(validation.validate(i[0], i[1])).to.equal(true);
        });

        [
            ['10', 'max:9'],
            ['-6', 'max:-20'],
            ['10000', 'max:1000']
        ].forEach(function (i) {
            expect(validation.validate(i[0], i[1])).to.equal(rule);
        });

        expect(validation.validate($input.val('54'))).to.equal(false);
    });

    it('should be able to check that a number is between two others (range test)', function () {
        var rule = 'range',
            $input = createInput('text', 'range:4:10', '7');
        [
            ['10', 'range:5:180'],
            ['-6', 'range:-10:-2'],
            ['-10000', 'range:-20000:0'],
            [$input, 'range:4:10']
        ].forEach(function (i) {
            expect(validation.validate(i[0], i[1])).to.equal(true);
        });

        [
            ['10', 'range:1:9'],
            ['-6', 'range:-20:-10'],
            ['10000', 'range:1000:2000']
        ].forEach(function (i) {
            expect(validation.validate(i[0], i[1])).to.equal(rule);
        });

        expect(validation.validate($input.val('11'))).to.equal(false);
    });

    it('should be able to check that a value exactly matches another', function () {
        expect(validation.validate('-@3-_=+""\\lkia678', 'match:-@3-_=+""\\lkia678')).to.equal(true);
        expect(validation.validate('lcdksjvs', 'match:-@3-_=+""\\')).to.equal('match');

    });

    it('should be able to check that a value has a minimum number of characters', function () {
        expect(validation.validate('more than two', 'minlength:2')).to.equal(true);
        expect(validation.validate('less than twenty', 'minlength:20')).to.equal('minlength');
    });

    it('should be able to check that a value has a maximum number of characters', function () {
        expect(validation.validate('less than twenty', 'maxlength:20')).to.equal(true);
        expect(validation.validate('more than sixteen', 'maxlength:16')).to.equal('maxlength');
    });

    it('should be able to check that a value\'s character count is between two points', function () {
        expect(validation.validate('less than twenty', 'rangelength:1:20')).to.equal(true);
        expect(validation.validate('more than sixteen', 'rangelength:10:16')).to.equal('rangelength');
    });

    it('should be able to check that a value has a minimum number of words', function () {
        expect(validation.validate('more than two', 'minwords:2')).to.equal(true);
        expect(validation.validate('less than twenty', 'minwords:20')).to.equal('minwords');
    });

    it('should be able to check that a value has a maximum number of words', function () {
        expect(validation.validate('less than twenty', 'maxwords:20')).to.equal(true);
        expect(validation.validate('more than two', 'maxwords:2')).to.equal('maxwords');
    });

    it('should be able to check that a value\'s word count is between two points', function () {
        expect(validation.validate('less than twenty', 'rangewords:1:20')).to.equal(true);
        expect(validation.validate('less than ten', 'rangewords:10:16')).to.equal('rangewords');
    });

    it('should be able to approve a number', function () {
        var rule = 'number';
        ['10', '-10', '10.55', '-10.55'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });
        ['10.55test', '-10.55test', 'clearly not a number'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });
    });

    it('should be able to approve an integer', function () {
        var rule = 'integer';
        ['10', '-10'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });
        ['10.55', '-10.55', '10.55test', 'test10.55', 'clearly not an integer'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });
    });

    it('should be able to check that a value only contains digits', function () {
        var rule = 'digits';
        expect(validation.validate('10', rule)).to.equal(true);
        ['-10', '10.55', '-10.55', '10.55test', 'test10.55', 'clearly no digits'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });
    });

    it('should be able to check that a radio or checkbox is selected', function () {
        var rule = 'checked';
        expect(validation.validate('1', rule)).to.equal(true);
        expect(validation.validate('-1', rule)).to.equal(rule);
    });

    it('should be able to check that a radio or checkbox is not selected', function () {
        var rule = 'unchecked';
        expect(validation.validate('-1', rule)).to.equal(true);
        expect(validation.validate('1', rule)).to.equal(rule);
    });

    it('should be able to confirm that a value matches that of another form element (that exists on the page)', function () {
        var $input = createInput('text', 'required', 'value in here'),
            id = $input.attr('id');

        $validForm.append($input); // it must exist on the page
        expect(validation.validate('value in here', 'confirm:#' + id)).to.equal(true);
        expect(validation.validate('value in here', 'confirm:$("#' + id + '")')).to.equal(true);
        expect(validation.validate('value in here', 'confirm:$("#' + id + '").val()')).to.equal(true);

        expect(validation.validate('value in here', 'confirm:#does-not-exist')).to.equal('confirm');
        expect(validation.validate('value in here', 'confirm:$("#does-not-exist")')).to.equal('confirm');
        expect(validation.validate('not the value', 'confirm:#' + id)).to.equal('confirm');
        expect(validation.validate('not the value', 'confirm:$("#' + id + '")')).to.equal('confirm');

        expect(validation.validate(createInput('text', 'confirm:#' + id, 'not the value'))).to.equal(false);
    });

    // 'regex date url ipaddress creditcard colour addTest setAliases setErrorClassString ip color numeric regexp pattern format matches equalto equals isrequired isalpha isalphanumeric isemail isequalto isformat ispattern isnumber isnumeric isinteger isdigits isip isipaddress ischecked isunchecked isdate isurl iscreditcard iscolor iscolour'

    //        it('should be able to approve', function () {
    //            var rule = '';
    //            is.forEach(function (i) {
    //                expect(validation.validate(i, rule)).to.equal(true);
    //            });
    //
    //            not.forEach(function (i) {
    //                expect(validation.validate(i, rule)).to.equal(rule);
    //            });
    //        });

    it('should be able to approve credit card numbers', function () {
        ['378282246310005', '371449635398431', '378734493671000', '5610591081018250', '30569309025904', '38520000023237',
         '6011111111111117', '6011000990139424', '3530111333300000', '3566002020360505', '5555555555554444', '5105105105105100',
         '4111111111111111', '4012888888881881', '4222222222222', '5019717010103742', '6331101999990016'
        ].forEach(function (i) {
            expect(validation.validate(i, 'creditcard')).to.equal(true);
        });
    });

});

//var ips = {
//    valid: ["0.0.0.0", "192.168.1.1", "255.255.255.255", "0000:0000:0000:0000:0000:0000:0000:0000", "fe00::1", "fe80::217:f2ff:fe07:ed62", "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff", "2001:0db8:0000:85a3:0000:0000:ac1f:8001"],
//    invalid: ["10.168.0001.100", "0.0.0.256", "256.255.255.255", "256.0.0.0", "192.168. 224.0", "192.168.224.0 1", "02001:0000:1234:0000:0000:C1C0:ABCD:0876", "2001:0000:1234:0000:00001:C1C0:ABCD:0876", "2001:0000:1234: 0000:0000:C1C0:ABCD:0876", "2001:0000:1234:0000:0000:C1C0:ABCD:0876 0", "3ffe:0b00:0000:0001:0000:0000:000a", "FF02:0000:0000:0000:0000:0000:0000:0000:0001", "::1111:2222:3333:4444:5555:6666::", "3ffe:b00::1::a"],
//    validcidrs: ["192.168.1.1/12", "192.168.1.1/32", "0000:0000:0000:0000:0000:0000:0000:0000/01", "0000:0000:0000:0000:0000:0000:0000:0000/19", "0000:0000:0000:0000:0000:0000:0000:0000/99", "0000:0000:0000:0000:0000:0000:0000:0000/100", "0000:0000:0000:0000:0000:0000:0000:0000/119", "0000:0000:0000:0000:0000:0000:0000:0000/128", "::1/128", "2001:db8::/48"],
//    invalidcidrs: ["192.168.1.1/", "192.168.1.1/12.34", "192.168.1.1/01", "192.168.1.1/33", "0000:0000:0000:0000:0000:0000:0000:0000/", "0000:0000:0000:0000:0000:0000:0000:0000/012", "0000:0000:0000:0000:0000:0000:0000:0000/129", "0000:0000:0000:0000:0000:0000:0000:0000/130"]
//}, i, j;

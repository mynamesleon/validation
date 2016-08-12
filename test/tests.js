var num = 0,
    expect = chai.expect,
    $validForm = $('#valid-holder'),
    $invalidForm = $('#invalid-holder'),
    createInput = function (type, rules, value) {
        var input = ['<input type="' + type + '" data-validation="'],
            id = type + '-' + (Date.now() + (num += 1) + Math.round(Math.random() * 10));
        // add rules
        input.push(rules);
        input.push('"');
        // add value
        if (value && !/checkbox|radio/.test(type)) {
            input.push('value="');
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

    it('should return true if the \'validate\' method is passed a null or undefined value, or a non-existing element', function () {
        expect(validation.validate()).to.equal(true);
        expect(validation.validate(null)).to.equal(true);
        expect(validation.validate($('.no-element'))).to.equal(true);
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

    it('should be able to check a required value', function () {
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

    it('should be able to validate an alpha value', function () {
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

    it('should be able to validate an alphanumeric value', function () {
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

    it('should be able to validate an email address', function () {
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
        var $input = createInput('text', 'match:pokemon', 'pokemon');
        expect(validation.validate($input)).to.equal(true);
        expect(validation.validate('-@3-_=+""\\lkia678', 'match:-@3-_=+""\\lkia678')).to.equal(true);
        expect(validation.validate($input.val('not pokemon'))).to.equal(false);
        expect(validation.validate('lcdksjvs', 'match:-@3-_=+""\\')).to.equal('match');
    });

    it('should be able to check that a value has a minimum number of characters', function () {
        var $input = createInput('text', 'minlength:2', 'pokemon');
        expect(validation.validate($input)).to.equal(true);
        expect(validation.validate('more than two', 'minlength:2')).to.equal(true);
        expect(validation.validate($input.val('a'))).to.equal(false);
        expect(validation.validate('less than twenty', 'minlength:20')).to.equal('minlength');
    });

    it('should be able to check that a value has a maximum number of characters', function () {
        var $input = createInput('text', 'maxlength:5', 'hello');
        expect(validation.validate($input)).to.equal(true);
        expect(validation.validate('less than twenty', 'maxlength:20')).to.equal(true);
        expect(validation.validate($input.val('hello there'))).to.equal(false);
        expect(validation.validate('more than sixteen', 'maxlength:16')).to.equal('maxlength');
    });

    it('should be able to check that a value\'s character count is between two points', function () {
        var $input = createInput('text', 'rangelength:5:10', 'hello');
        expect(validation.validate($input)).to.equal(true);
        expect(validation.validate('less than twenty', 'rangelength:1:20')).to.equal(true);
        expect(validation.validate($input.val('hi'))).to.equal(false);
        expect(validation.validate('more than sixteen', 'rangelength:10:16')).to.equal('rangelength');
    });

    it('should be able to check that a value has a minimum number of words', function () {
        var $input = createInput('text', 'minwords:2', 'hello there');
        expect(validation.validate($input)).to.equal(true);
        expect(validation.validate('more than two', 'minwords:2')).to.equal(true);
        expect(validation.validate($input.val('hello'))).to.equal(false);
        expect(validation.validate('less than twenty', 'minwords:20')).to.equal('minwords');
    });

    it('should be able to check that a value has a maximum number of words', function () {
        var $input = createInput('text', 'maxwords:1', 'hello');
        expect(validation.validate($input)).to.equal(true);
        expect(validation.validate('less than twenty', 'maxwords:20')).to.equal(true);
        expect(validation.validate($input.val('hello there'))).to.equal(false);
        expect(validation.validate('more than two', 'maxwords:2')).to.equal('maxwords');
    });

    it('should be able to check that a value\'s word count is between two points', function () {
        var $input = createInput('text', 'rangewords:1:3', 'hello there');
        expect(validation.validate($input)).to.equal(true);
        expect(validation.validate('less than twenty', 'rangewords:1:20')).to.equal(true);
        expect(validation.validate($input.val('this is a longer sentence'))).to.equal(false);
        expect(validation.validate('less than ten', 'rangewords:10:16')).to.equal('rangewords');
    });

    it('should be able to validate a number', function () {
        var rule = 'number',
            $input = createInput('text', 'number', '1.5');

        expect(validation.validate($input)).to.equal(true);
        ['10', '-10', '10.55', '-10.55'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });
        expect(validation.validate($input.val('hi'))).to.equal(false);
        ['10.55test', '-10.55test', 'clearly not a number'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });
    });

    it('should be able to validate an integer', function () {
        var rule = 'integer',
            $input = createInput('text', 'integer', '-10');

        expect(validation.validate($input)).to.equal(true);
        ['10', '-10'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });
        expect(validation.validate($input.val('1.5'))).to.equal(false);
        ['10.55', '-10.55', '10.55test', 'test10.55', 'clearly not an integer'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });
    });

    it('should be able to check that a value only contains digits', function () {
        var rule = 'digits',
            $input = createInput('text', 'digits', '10');

        expect(validation.validate($input)).to.equal(true);
        expect(validation.validate('10', rule)).to.equal(true);
        expect(validation.validate($input.val('-10'))).to.equal(false);
        ['-10', '10.55', '-10.55', '10.55test', 'test10.55', 'clearly no digits'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });
    });

    it('should be able to check that a radio or checkbox is selected', function () {
        var rule = 'checked',
            $input = createInput('checkbox', 'checked').prop('checked', true);

        $invalidForm.append($input);
        expect(validation.validate($input)).to.equal(true);
        expect(validation.validate('1', rule)).to.equal(true);
        expect(validation.validate('-1', rule)).to.equal(rule);

        $input.prop('checked', false);
        expect(validation.validate($input)).to.equal(false);
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

    it('should be able to check a value against a custom regular expression', function () {
        var $input = createInput('text', 'regex:^[a-zA-Z0-9]+$', 'value');
        expect(validation.validate('test', 'regex:^[a-zA-Z\\s]+$')).to.equal(true);
        expect(validation.validate('t3st', 'regex:^[a-zA-Z\\s]+$')).to.equal('regex');
        expect(validation.validate($input)).to.equal(true);
        expect(validation.validate($input.val('this-is-hyphenated'))).to.equal(false);
    });

    it('should be able to validate a date', function () {
        var rule = 'date',
            $input = createInput('text', rule, '2020-12-25');

        ['2014/03/10', '10/03/2014', 'March 5 2045', $input].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });

        ['25/10/2015', 'some random string', 'March 15th 2045'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });

        expect(validation.validate($input.val('2014/76/57'))).to.equal(false);
    });

    it('should be able to validate a url', function () {
        var rule = 'url',
            $input = createInput('text', rule, 'http://www.mynamesleon.com');

        [
            'http://✪df.ws/123',
            'http://userid:password@example.com:8080',
            'http://userid:password@example.com:8080/',
            'http://userid@example.com',
            'http://userid@example.com/',
            'http://userid@example.com:8080',
            'http://userid@example.com:8080/',
            'http://userid:password@example.com',
            'http://userid:password@example.com/',
            'http://142.42.1.1/',
            'http://142.42.1.1:8080/',
            'http://➡.ws/䨹',
            'http://⌘.ws',
            'http://⌘.ws/',
            'http://foo.com/blah_(wikipedia)#cite-1',
            'http://foo.com/blah_(wikipedia)_blah#cite-1',
            'http://foo.com/unicode_(✪)_in_parens',
            'http://foo.com/(something)?after=parens',
            'http://☺.damowmow.com/',
            'http://code.google.com/events/#&product=browser',
            'http://j.mp',
            'ftp://foo.bar/baz',
            'http://foo.bar/?q=Test%20URL-encoded%20stuff',
            'http://مثال.إختبار',
            $input
        ].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });

        [
            'http://',
            'http://.',
            'http://..',
            'http://../',
            'http://?',
            'http://??',
            'http://??/',
            'http://#',
            'http://##',
            'http://##/',
            'http://foo.bar?q=Spaces should be encoded',
            '//',
            '//a',
            '///a',
            '///',
            'http:///a',
            'foo.com',
            'rdar://1234',
            'h://test',
            'http:// shouldfail.com',
            ':// should fail',
            'http://foo.bar/foo(bar)baz quux',
            'ftps://foo.bar/',
            'http://-error-.invalid/',
            'http://-a.b.co',
            'http://a.b-.co',
            'http://0.0.0.0',
            'http://10.1.1.0',
            'http://10.1.1.255',
            'http://224.1.1.1',
            'http://1.1.1.1.1',
            'http://123.123.123',
            'http://3628126748',
            'http://.www.foo.bar/',
            'http://.www.foo.bar./',
            'http://10.1.1.1',
            'http://10.1.1.254'
        ].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });

        expect(validation.validate($input.val('www.missing-protocol.com'))).to.equal(false);
    });

    it('should be able to validate ip addresses', function () {
        var rule = 'ipaddress',
            $input = createInput('text', rule, '0.0.0.0'),
            ips = {
                valid: ['0.0.0.0', '192.168.1.1', '255.255.255.255', '0000:0000:0000:0000:0000:0000:0000:0000', 'fe00::1', 'fe80::217:f2ff:fe07:ed62', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', '2001:0db8:0000:85a3:0000:0000:ac1f:8001'],
                invalid: ['10.168.0001.100', '0.0.0.256', '256.255.255.255', '256.0.0.0', '192.168. 224.0', '192.168.224.0 1', '02001:0000:1234:0000:0000:C1C0:ABCD:0876', '2001:0000:1234:0000:00001:C1C0:ABCD:0876', '2001:0000:1234: 0000:0000:C1C0:ABCD:0876', '2001:0000:1234:0000:0000:C1C0:ABCD:0876 0', '3ffe:0b00:0000:0001:0000:0000:000a', 'FF02:0000:0000:0000:0000:0000:0000:0000:0001', '::1111:2222:3333:4444:5555:6666::', '3ffe:b00::1::a'],
                validcidrs: ['192.168.1.1/12', '192.168.1.1/32', '0000:0000:0000:0000:0000:0000:0000:0000/01', '0000:0000:0000:0000:0000:0000:0000:0000/19', '0000:0000:0000:0000:0000:0000:0000:0000/99', '0000:0000:0000:0000:0000:0000:0000:0000/100', '0000:0000:0000:0000:0000:0000:0000:0000/119', '0000:0000:0000:0000:0000:0000:0000:0000/128', '::1/128', '2001:db8::/48'],
                invalidcidrs: ['192.168.1.1/', '192.168.1.1/12.34', '192.168.1.1/01', '192.168.1.1/33', '0000:0000:0000:0000:0000:0000:0000:0000/', '0000:0000:0000:0000:0000:0000:0000:0000/012', '0000:0000:0000:0000:0000:0000:0000:0000/129', '0000:0000:0000:0000:0000:0000:0000:0000/130']
            };

        ips.valid.forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });
        ips.validcidrs.forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });
        expect(validation.validate($input)).to.equal(true);

        ips.invalid.forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });
        ips.invalidcidrs.forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });
        expect(validation.validate($input.val('10.168.0001.100'))).to.equal(false);
    });

    it('should be able to validate credit card numbers', function () {
        var rule = 'creditcard',
            $input = createInput('text', rule, '371449635398431');

        ['378282246310005', '371449635398431', '378734493671000', '5610591081018250', '30569309025904', '38520000023237',
         '6011111111111117', '6011000990139424', '3530111333300000', '3566002020360505', '5555555555554444', '5105105105105100',
         '4111111111111111', '4012888888881881', '4222222222222', '5019717010103742', '6331101999990016', $input
        ].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });

        expect(validation.validate('6356565786896346', rule)).to.equal(rule);
        expect(validation.validate($input.val('6356565786896346'))).to.equal(false);
    });

    it('should be able to validate a colour', function () {
        var rule = 'colour',
            $input = createInput('text', rule + ':rgb', 'rgb(255,0,156)');

        ['rgb(255,0,156)', 'rgba(255,0,156,0.7)', 'hsl(86,100%,50%)', 'hsla(86, 100%, 50%, 1)', '#333', '#454545', 'aliceblue', $input].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(true);
        });

        ['rgb(255,0)', 'rgba(255,0,156)', 'hsl(86,100,50)', 'hsla(86, 100%, 50%)', '#32', '#45454', 'something', 'foxred'].forEach(function (i) {
            expect(validation.validate(i, rule)).to.equal(rule);
        });

        expect(validation.validate($input.val('rgb(255,255)'))).to.equal(false);
    });

});

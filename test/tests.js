var expect = chai.expect;

describe('validation', function () {

    describe('use', function () {

        it('should be accessible from \'validation\' variable', function () {
            expect(typeof validation === 'object').to.equal(true);
        });

        it('should error if the \'validate\' method is not passed a value', function () {
            expect(validation.validate).to.throw(Error);
        });

        it('should be possible to extend the tests with a custom rule', function () {
            validation.addTest('testrule', function (val, param) {
                return param === 'hello' && val === 'hello';
            });
            expect(validation.validate('hello', 'testrule:hello')).to.equal(true);
            expect(validation.validate('hello', 'testrule')).to.equal('testrule');
            expect(validation.validate('not hello', 'testrule:hello')).to.equal('testrule');
            expect(validation.validate('not hello', 'testrule:not-hello')).to.equal('testrule');
        });

        it('should error if attempting to add a test without a name and/or function specified for it', function () {
            expect(validation.addTest).to.throw(Error);
            expect(validation.addTest.bind('name')).to.throw(Error);
            expect(validation.addTest.bind(null, function () {})).to.throw(Error);
        });

        it('should be able to chain rules together, returning true if they all pass, or a string indicating the failed rule', function () {
            expect(validation.validate('hello', 'required alpha minlength:4 maxlength:6 minwords:0 maxwords:5')).to.equal(true);
            expect(validation.validate('hello', 'required minlength:4 numeric')).to.equal('numeric');
            expect(validation.validate('hello', 'required alpha minlength:4 maxlength:6 minwords:2')).to.equal('minwords');
        });

    });

    describe('rules', function () {

        it('should be able to approve a required value', function () {
            var rule = 'required';
            ['hello', true, 1].forEach(function (i) {
                expect(validation.validate(i, rule)).to.equal(true);
            });

            ['', 0, null, false].forEach(function (i) {
                expect(validation.validate(i, rule)).to.equal(rule);
            });
        });

        it('should be able to approve an alpha value', function () {
            var rule = 'alpha';
            ['alpha', 'BRAVO', 'ChArLiE'].forEach(function (i) {
                expect(validation.validate(i, rule)).to.equal(true);
            });

            ['0', '-alpha_', '***,.', 'bravo77'].forEach(function (i) {
                expect(validation.validate(i, rule)).to.equal(rule);
            });
        });

        it('should be able to approve an alphanumeric value', function () {
            var rule = 'alphanumeric';
            ['a1pha', '8RAVO', 'ChAr1i3', 'de1tA', 'echo', '1234567890'].forEach(function (i) {
                expect(validation.validate(i, rule)).to.equal(true);
            });

            ['1.1', '--', '@£$%&'].forEach(function (i) {
                expect(validation.validate(i, rule)).to.equal(rule);
            });
        });

        it('should be able to approve an email address', function () {
            var rule = 'email';
            ['test@test.com', 'a_start-email@domain-name.com', 'a@a'].forEach(function (i) {
                expect(validation.validate(i, rule)).to.equal(true);
            });

            ['üñîçøðé@üñîçøðé.com', 'Abc.example.com', 'A@b@c@example.com', 'a"b(c)d,e:f;gi[j\k]l@example.com',
             'just"not"right@example.com', 'this is"not\allowed@example.com', 'this\ still\"not\\allowed@example.com'
            ].forEach(function (i) {
                expect(validation.validate(i, rule)).to.equal(rule);
            });
        });

        it('should be able to check if a value is greater than or equal to another (min test)', function () {
            var rule = 'min';
            [
                ['10', 'min:10'],
                ['-6', 'min:-7'],
                ['10000', 'min:30']
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
        });

        it('should be able to check if a value is less than or equal to another (max test)', function () {
            var rule = 'max';
            [
                ['10', 'max:180'],
                ['-6', 'max:-2'],
                ['-10000', 'max:0']
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
        });

        it('should be able to check that a number is between two others (range test)', function () {
            var rule = 'range';
            [
                ['10', 'range:5:180'],
                ['-6', 'range:-10:-2'],
                ['-10000', 'range:-20000:0']
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

        });

        it('should be able to check that a value exactly matches another', function () {
            var rule = 'match';
            [
                ['10', 'match:10'],
                ['rsjdsfdslkfjdslvn', 'match:rsjdsfdslkfjdslvn'],
                ['-@3-_=+""\\lkia678', 'match:-@3-_=+""\\lkia678']
            ].forEach(function (i) {
                expect(validation.validate(i[0], i[1])).to.equal(true);
            });

            [
                ['a', 'match:b'],
                ['6', 'match:7'],
                ['lcdksjvs', 'match:-@3-_=+""\\']
            ].forEach(function (i) {
                expect(validation.validate(i[0], i[1])).to.equal(rule);
            });

        });
        // 'match minlength maxlength rangelength minwords maxwords rangewords number integer digits checked unchecked confirm regex date url ipaddress creditcard colour addTest setAliases setErrorClassString ip color numeric regexp pattern format matches equalto equals isrequired isalpha isalphanumeric isemail isequalto isformat ispattern isnumber isnumeric isinteger isdigits isip isipaddress ischecked isunchecked isdate isurl iscreditcard iscolor iscolour'

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

});

//var ips = {
//    valid: ["0.0.0.0", "192.168.1.1", "255.255.255.255", "0000:0000:0000:0000:0000:0000:0000:0000", "fe00::1", "fe80::217:f2ff:fe07:ed62", "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff", "2001:0db8:0000:85a3:0000:0000:ac1f:8001"],
//    invalid: ["10.168.0001.100", "0.0.0.256", "256.255.255.255", "256.0.0.0", "192.168. 224.0", "192.168.224.0 1", "02001:0000:1234:0000:0000:C1C0:ABCD:0876", "2001:0000:1234:0000:00001:C1C0:ABCD:0876", "2001:0000:1234: 0000:0000:C1C0:ABCD:0876", "2001:0000:1234:0000:0000:C1C0:ABCD:0876 0", "3ffe:0b00:0000:0001:0000:0000:000a", "FF02:0000:0000:0000:0000:0000:0000:0000:0001", "::1111:2222:3333:4444:5555:6666::", "3ffe:b00::1::a"],
//    validcidrs: ["192.168.1.1/12", "192.168.1.1/32", "0000:0000:0000:0000:0000:0000:0000:0000/01", "0000:0000:0000:0000:0000:0000:0000:0000/19", "0000:0000:0000:0000:0000:0000:0000:0000/99", "0000:0000:0000:0000:0000:0000:0000:0000/100", "0000:0000:0000:0000:0000:0000:0000:0000/119", "0000:0000:0000:0000:0000:0000:0000:0000/128", "::1/128", "2001:db8::/48"],
//    invalidcidrs: ["192.168.1.1/", "192.168.1.1/12.34", "192.168.1.1/01", "192.168.1.1/33", "0000:0000:0000:0000:0000:0000:0000:0000/", "0000:0000:0000:0000:0000:0000:0000:0000/012", "0000:0000:0000:0000:0000:0000:0000:0000/129", "0000:0000:0000:0000:0000:0000:0000:0000/130"]
//}, i, j;

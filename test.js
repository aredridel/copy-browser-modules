var copyAMDTo = require('./');

var test = require('tape');
var path = require('path');

test('trivial', function (t) {
    copyAMDTo(path.resolve(__dirname, 'test-fixtures/trivial'), '').then(function (d) {
        t.ok(d);
    }).catch(t.error).finally(t.end);
});

test('nested', function (t) {
    copyAMDTo(path.resolve(__dirname, 'test-fixtures/nested'), '').then(function (d) {
        t.ok(d);
    }).catch(t.error).finally(t.end);
});

test('overlap', function (t) {
    copyAMDTo(path.resolve(__dirname, 'test-fixtures/overlap')).then(t.fail).catch(function (e) {
        t.ok(e);
        t.equal(e.message, 'Overlapping packages found: component1');
    }).finally(t.end);
});

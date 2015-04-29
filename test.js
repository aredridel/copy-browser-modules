var copyAMDTo = require('./');

var test = require('tape');
var path = require('path');
var rimraf = require('rimraf');
var rsvp = require('rsvp');

test('trivial', function (t) {
    copyAMDTo(path.resolve(__dirname, 'test-fixtures/trivial'), 'tmp').then(function (d) {
        t.ok(d);
    }).catch(t.error).finally(cleanup).finally(t.end);
});

test('nested', function (t) {
    copyAMDTo(path.resolve(__dirname, 'test-fixtures/nested'), 'tmp').then(function (d) {
        t.ok(d);
    }).catch(t.error).finally(cleanup).finally(t.end);
});

test('overlap', function (t) {
    copyAMDTo(path.resolve(__dirname, 'test-fixtures/overlap'), 'tmp').then(t.fail).catch(function (e) {
        t.ok(e);
        t.equal(e.message, 'Overlapping packages found: component1');
    }).finally(cleanup).finally(t.end);
});

function cleanup() {
    return new rsvp.Promise(function (a) {
        rimraf('tmp', a);
    });
}

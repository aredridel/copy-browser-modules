var copyAMDTo = require('./');

var test = require('tape');
var path = require('path');
var rimraf = require('rimraf');
var rsvp = require('rsvp');
var fs = require('fs');

test('trivial', function (t) {
    copyAMDTo(path.resolve(__dirname, 'test-fixtures/trivial'), 'tmp').then(function (d) {
        t.ok(d);
        return checkExists('tmp');
    }).catch(t.error).finally(cleanup).finally(t.end);
});

test('nested', function (t) {
    copyAMDTo(path.resolve(__dirname, 'test-fixtures/nested'), 'tmp').then(function (d) {
        t.ok(d);
        return checkExists('tmp');
    }).catch(t.error).finally(cleanup).finally(t.end);
});

test('irrelevant modules excluded', function (t) {
    copyAMDTo(path.resolve(__dirname, 'test-fixtures/irrelevant'), 'tmp').then(function (d) {
        t.ok(d);
        return checkNotExists('tmp/irrelevant1');
    }).catch(t.error).finally(cleanup).finally(t.end);
});

test('overrides work', function (t) {
    copyAMDTo(path.resolve(__dirname, 'test-fixtures/override'), 'tmp').then(function (d) {
        t.ok(d);
        return checkExists('tmp/component1');
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

function checkNotExists(file) {
    return new Promise(function (a, r) {
        fs.stat(file, function (err) {
            if (err) {
                if (err.code === 'ENOENT') {
                    a();
                } else {
                    r(err);
                }
            } else {
                r(new Error("File exists: " + file));
            }
        });
    });
}

function checkExists(file) {
    return new Promise(function (a, r) {
        fs.stat(file, function (err) {
            if (err) {
                r(err);
            } else {
                a();
            }
        });
    });
}

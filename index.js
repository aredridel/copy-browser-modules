var rpt = require('read-package-tree');
var iferr = require('iferr');
var rsvp = require('rsvp');
var path = require('path');
var selectFiles = require('./select-files');
var copyDir = require('copy-dir');
var fs = require('fs');

function collectAMD(root) {
    return new rsvp.Promise(function (accept, reject) {
        rpt(root, iferr(reject, function (data) {
            var out = [];
            var packages = {};
            var duplicates = {};
            data.children.forEach(processPackage);

            function processPackage(c) {
                if (!c.package.amd) return;
                var pkg = typeof c.package.amd === 'object' ? extendedMinusAMD(c.package, c.package.amd) : c.package;
                var pkgroot = c.path;

                if (packages[c.package.name]) {
                    duplicates[c.package.name] = c;
                } else {
                    packages[c.package.name] = c;
                }

                pkg.location = path.relative(root, pkgroot);

                out.push(pkg);
                c.children.forEach(processPackage);
            }

            if (Object.keys(duplicates).length) {
                reject(new Error("Overlapping packages found: " + Object.keys(duplicates).join(", ")));
            } else {
                accept(out);
            }
        }));
    });
}

function extendedMinusAMD(/* ... */) {
    var out = {};
    for (var i = 0; i < arguments.length; i++) {
        for (var k in arguments[i]) {
            if (k === 'amd') continue;
            out[k] = arguments[i][k];
        }
    }
    return out;
}

function collectFiles(root) {
    return function (pkg) {
        if (pkg.files) {
            return pkg;
        } else {
            return selectFiles(path.resolve(root, pkg.location)).then(function (files) {
                pkg.files = files;
                return pkg;
            });
        }
    };
}

function writeJSON(file, data) {
    return new rsvp.Promise(function (a, r) {
        fs.writeFile(file, JSON.stringify(data), iferr(r, a));
    });
}

function copyFromTo(root, dir) {
    return function (pkgs) {
        return rsvp.all(pkgs.map(function (pkg) {
            var target = path.resolve(dir, pkg.name);
            var source = path.resolve(root, pkg.location);
            return new rsvp.Promise(function (accept, reject) {
                copyDir(source, target, function (stat, p, file) {
                    return ~pkg.files.indexOf(file);
                }, iferr(reject, accept));
            }).then(function () {
                return writeJSON(path.resolve(target, 'package.json'), pkg);
            }).then(function () {
                return pkg;
            });
        }));
    };
}

module.exports = function copyAMDTo(root, dir) {
    return collectAMD(root).then(function (pkgs) {
        return rsvp.map(pkgs, collectFiles(root));
    }).then(copyFromTo(root, dir));
};


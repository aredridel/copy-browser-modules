var rpt = require('read-package-tree');
var iferr = require('iferr');
var rsvp = require('rsvp');
var path = require('path');
var selectFiles = require('./select-files');
var Nfstream = require('fstream-npm');
var fstream = require('fstream');
var fs = require('fs');
var mkdirp = require('mkdirp');

function collectBrowser(root) {
    return new rsvp.Promise(function (accept, reject) {
        rpt(root, iferr(reject, function (rootPkg) {
            var out = [];
            var packages = {};
            var duplicates = {};
            var overrides = (rootPkg.package.browserPackage && rootPkg.package.browserPackage.overrides) || {};
            rootPkg.children.forEach(processPackage);

            function processPackage(c) {
                var browser = overrides[c.package.name] || c.package.browserPackage || (c.package.keywords && ~c.package.keywords.indexOf("browser"));
                if (!browser) return;
                var pkg = typeof browser === 'object' ? extendedMinusBrowser(c.package, browser) : c.package;
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

function extendedMinusBrowser(/* ... */) {
    var out = {};
    for (var i = 0; i < arguments.length; i++) {
        for (var k in arguments[i]) {
            if (k === 'browserPackage') continue;
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

function copyFromTo(root, dir, each) {
    return function (pkgs) {
        return rsvp.all(pkgs.map(function (pkg) {
            var target = path.resolve(dir, pkg.name);
            var source = path.resolve(root, pkg.location);
            return new rsvp.Promise(function (accept, reject) {
                mkdirp(target, iferr(reject, function () {
                    new Nfstream({ path: source, package: pkg }).pipe(new fstream.Writer(target)).on('close', accept).on('error', reject);
                }));
            }).then(function () {
                return writeJSON(path.resolve(target, 'package.json'), pkg);
            }).then(function () {
                if (each) {
                    each(pkg);
                }
                return pkg;
            });
        }));
    };
}

module.exports = function copyBrowserTo(root, dir, each) {
    return collectBrowser(root).then(function (pkgs) {
        return rsvp.map(pkgs, collectFiles(root));
    }).then(copyFromTo(root, dir, each));
};


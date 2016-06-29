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
                var browser = overrides[c.package.name] || c.package.browserPackage;
                if (!browser) return;
                var pkg = typeof browser === 'object' ? extendedCleanedMinusBrowser(c.package, browser) : c.package;
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

function extendedCleanedMinusBrowser(/* ... */) {
    var out = {};
    for (var i = 0; i < arguments.length; i++) {
        for (var k in arguments[i]) {
            if (k === 'browserPackage') continue;
            if (k[0] === '_') continue;
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
        fs.writeFile(file, JSON.stringify(data, null, 2), iferr(r, a));
    });
}

function copyFromTo(root, dest, each, docroot) {
    return function (pkgs) {
        return rsvp.all(pkgs.map(function (pkg) {
            var target = path.resolve(docroot, dest, pkg.name);
            var source = path.resolve(root, pkg.location);
            return new rsvp.Promise(function (accept, reject) {
                mkdirp(target, iferr(reject, function () {
                    var reader = new Nfstream({ path: source, package: pkg });
                    var writer = new fstream.Writer(target);
                    reader.on('package', function (p) {
                        // Clobber the files with our fixed up copy.
                        p.files = pkg.files;
                    });
                    writer.on('close', accept);
                    writer.on('error', reject);
                    reader.pipe(writer);
                }));
            }).then(function () {
                pkg.location = path.relative(docroot, target);
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

module.exports = function copyBrowserTo(options) {
    var root, dest, each, docroot;
    if (arguments.length > 1 && arguments.length <= 3) {
        root = arguments[0];
        dest = arguments[1];
        each = arguments[2];
        docroot = process.cwd();
    } else {
        root = options.src;
        dest = options.dest;
        each = options.each;
        docroot = options.basePath || process.cwd();
    }

    return collectBrowser(root).then(function (pkgs) {
        return rsvp.map(pkgs, collectFiles(root));
    }).then(copyFromTo(root, dest, each, path.resolve(docroot)));
};


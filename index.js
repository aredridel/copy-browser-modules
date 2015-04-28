var rpt = require('read-package-tree');
var iferr = require('iferr');
var rsvp = require('rsvp');
var path = require('path');

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
            return new rsvp.Promise(function (accept, reject) {
                console.log(pkg, root);
                accept(pkg);
            });
        }
    };
}

module.exports = function copyAMDTo(root, dir) {
    return collectAMD(root).then(collectFiles(root))//.then(copyTo(dir));
};


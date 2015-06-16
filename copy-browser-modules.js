#!/usr/bin/env node

var copyBrowserTo = require('./');

if (process.argv.length === 4) {
    copyBrowserTo(process.argv[2], process.argv[3]).catch(function (err) {
        console.warn(err);
        process.exit(1);
    });
} else {
    console.warn("Use: " + process.argv.slice(0, 2).join(" ") + " source target");
    process.exit(2);
}

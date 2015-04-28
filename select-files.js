"use strict";

var fs = require('fs');
var path = require('path');
var iferr = require('iferr');
var rsvp = require('rsvp');

module.exports = function selectFiles(dir) {
    return getIgnores(dir).then(function (ignores) {
        return readDir(dir).then(function (entries) {
            return entries.filter(function (e) {
                return shouldPackageEntry(e, ignores);
            });
        });
    });
};

function readFile(file) {
    return new rsvp.Promise(function (accept, reject) {
        fs.readFile(file, iferr(reject, accept));
    });
}

function readDir(file) {
    return new rsvp.Promise(function (accept, reject) {
        fs.readdir(file, iferr(reject, accept));
    });
}

function getIgnores(dir) {
    return readFile(path.resolve(dir, '.npmignore')).catch(function (err) {
        if (err.code === 'ENOENT') {
            return readFile(path.resolve(dir, '.gitignore')).catch(function (e) {
                if (e.code === 'ENOENT') {
                    return '';
                } else {
                    throw e;
                }
            });
        } else {
            throw err;
        }
    }).then(parse);
}

function parse(file) {
    return file.toString().split(/\r?\n/).filter(function (e) {
        return !e.match(/^\s*$/) || !e.match(/^#/);
    });
}

function shouldPackageEntry(entry, ignores) {
    // This will be written with updated, amd-shaped version
    if (entry === 'package.json') return false;

    // readme files should never be ignored.
    if (entry.match(/^readme(\.[^\.]*)$/i)) return true;

    // license files should never be ignored.
    if (entry.match(/^(license|licence)(\.[^\.]*)?$/i)) return true;

    // changelogs should never be ignored.
    if (entry.match(/^(changes|changelog|history)(\.[^\.]*)?$/i)) return true;

    // If you need this, all bets are off.
    if (entry === 'node_modules') return false;

    // some files are *never* allowed under any circumstances
    if (entry === '.git' ||
        entry === '.lock-wscript' ||
        entry.match(/^\.wafpickle-[0-9]+$/) ||
        entry === 'CVS' ||
        entry === '.svn' ||
        entry === '.hg' ||
        entry.match(/^\..*\.swp$/) ||
        entry === '.DS_Store' ||
        entry.match(/^\._/) ||
        entry === 'npm-debug.log'
        ) {
        return false;
    }

    for (var i in ignores) {
        if (typeof ignores[i] === 'string') {
            if (entry === ignores[i]) return false;
        } else {
            if (entry.match(ignores[i])) return false;
            // FIXME should use minimatch
        }
    }

    return true;
}

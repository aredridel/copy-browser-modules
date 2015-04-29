Collects AMD modules from `node_modules` and dumps them somewhere as commonjs
Packages/A style packages (note that this is similar to but not the same as
node modules), ready to use with requirejs.

First, it scans the tree of `node_modules`, detecting and erroring if AMD
modules overlap. There is no support for node style nesting dependencies and
search path from each module.

Then it takes that list of modules and copies them to the target directory.

An example:


```
var copyAMDTo = require('copy-amd-modules');

copyAMDTo(__dirname, 'public/js/amd')
    .then(function() {
        console.log("Modules copied to 'public/js/amd'")
    }).catch(function (err) {
        console.warn("An error occurred");
        console.warn(err.stack);
    });
```
.

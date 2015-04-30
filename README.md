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

Module format
-------------

Modules are expected to end up in something approaching CommonJS Packages/A
style. That means no nested dependencies, no `node_modules`, but `package.json`
is still used. Because we're coopting the npm registry here, sometimes we need
different information between the node and AMD versions of things. If you put
an `amd` property in your `package.json` with a truthy value, the module will
be considered AMD-friendly. If that property is set to an object, the written
`package.json` in the built tree will have these properties merged into the
root and `amd` left out.

This tool respects the `files` key, so an AMD-only extract can be provided by
providing an `amd.files` property.

Overrides
---------

The `package.json` for your app can include a section like so:

```
    "amd": {
        "overrides": {
            "packagename": {
```

which will be used as the `amd` property for each package's `package.json`
instead of what's there, allowing applications to use libraries that don't
follow the convention yet despite shipping AMD modules.

This is only supported at the root as this is not to be a convention for the
consumption of others, but only used in the interim until the convention
catches on for AMD packages in the registry. Please make PRs against upstream
`package.json` files!

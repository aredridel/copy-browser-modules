Collects AMD modules from `node_modules` and dumps them somewhere as commonjs style packages, ready to use with requirejs

First, scan the tree of `node_modules`, detecting and erroring if modules overlap.

Then taking that list of modules and copying them to the target

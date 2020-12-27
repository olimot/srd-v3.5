require('ts-node').register({
  compilerOptions: { isolatedModules: false, module: 'commonjs' },
});

const scriptfn = require(`../src/workbench/${process.argv[2] || 'index'}`);

const retval = scriptfn.default(...process.argv.slice(3));

if (retval && retval.then) retval.then(console.log, console.error).then(() => process.exit());
else console.log(retval);

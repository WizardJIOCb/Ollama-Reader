// Script to update the build script to use ESM format instead of CJS
// This resolves the import.meta.url issue in the server build

const fs = require('fs');

// Read the build script
const buildScriptPath = 'script/build.ts';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Replace the format from "cjs" to "esm"
const updatedBuildScript = buildScript.replace(
    /format: "cjs",/,
    'format: "esm",'
);

// Also update the output file extension from .cjs to .mjs
const finalBuildScript = updatedBuildScript.replace(
    /outfile: "dist\/index\.cjs",/,
    'outfile: "dist/index.mjs",'
);

// Write the updated build script back to file
fs.writeFileSync(buildScriptPath, finalBuildScript);
console.log('Updated build script to use ESM format and .mjs extension');// Script to update the build script to use ESM format instead of CJS
// This resolves the import.meta.url issue in the server build

const fs = require('fs');

// Read the build script
const buildScriptPath = 'script/build.ts';
let buildScript = fs.readFileSync(buildScriptPath, 'utf8');

// Replace the format from "cjs" to "esm"
const updatedBuildScript = buildScript.replace(
    /format: "cjs",/,
    'format: "esm",'
);

// Also update the output file extension from .cjs to .mjs
const finalBuildScript = updatedBuildScript.replace(
    /outfile: "dist\/index\.cjs",/,
    'outfile: "dist/index.mjs",'
);

// Write the updated build script back to file
fs.writeFileSync(buildScriptPath, finalBuildScript);
console.log('Updated build script to use ESM format and .mjs extension');
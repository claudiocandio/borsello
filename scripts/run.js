/*
npm install @babel/polyfill
npm install @babel/register
npm install @babel/core
npm install @babel/preset-env
npm install ed25519.js
*/

require('@babel/polyfill')
require('@babel/register')({
  presets: [ '@babel/env' ]
})

if (process.argv.length <= 2) {
  console.log("Usage: " + __filename + " some_es6_file.js");
  process.exit(-1);
}

var param = process.argv[2];
//console.log('Run: ' + param);

module.exports = require('./' + param)

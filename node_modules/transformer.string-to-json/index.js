var Conversion = require('transformer-conversion');
var tString = require('transformer.string');
var tJson = require('transformer.json');
// require any other modules you may need here.

module.exports = Conversion(tString, tJson, convert);

function convert(str) {
  return JSON.parse(str);
};

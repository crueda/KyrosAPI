var transformer = require('dat-transformer');

module.exports = new transformer.Type({
  // @context and type filled in automatically.
  'id': 'json',
  'description': 'JSON - JavaScript Object Notation',
  'schema': "string"
});

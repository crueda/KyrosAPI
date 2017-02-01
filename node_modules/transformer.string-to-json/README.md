# transformer.string-to-json

[Transformer](http://github.com/jbenet/transformer) conversion: string to json

This module is a transformer conversion, published on npm. Read more about transformer at:

- the transformer website: <http://transform.datadex.io>
- the transformer repository: <http://github.com/jbenet/transformer>

## Usage

Use this module through transformer.

### Javascript

```js
var transformer = require('dat-transformer');
var tStringToJson = transformer('string', 'json');
tStringToJson('{"beep": "boop"}'); // {"beep": "boop"}
```

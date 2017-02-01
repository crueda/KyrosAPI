artsholland
===========

Unofficial API module for Arts Holland

[![Build Status](https://travis-ci.org/fvdm/nodejs-artsholland.svg?branch=master)](https://travis-ci.org/fvdm/nodejs-artsholland)

Docs: <http://dev.artsholland.com/documentation/restapi>


DEPRECATED
----------

The Arts Holland API is no longer available rendering this module useless.
All methods provided with this module will fail.


Usage
-----

### event ( callback )

Lists and describes all events.

```js
app.event( console.log )
```


### event ( cidn, callback )

Describe event with `cidn`.

```js
app.event( 123, console.log )
```


### event ( cidn )

Returns an object with the following functions:


### event().venue ( callback )

Lists and describes all venues in which event with `cidn` takes place.

```js
app.event( 123 ).venue( console.log )
```


Unlicense
---------

<https://github.com/fvdm/nodejs-artsholland/blob/master/UNLICENSE>

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org>


Author
------

[Franklin van de Meent](https://frankl.in)

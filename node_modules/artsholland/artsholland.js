/*
Name:          nodejs-artsholland
Description:   Node.js module to access Arts Holland API methods
Source:        https://github.com/fvdm/nodejs-artsholland
Feedback:      https://github.com/fvdm/nodejs-artsholland/issues
License:       Unlicense / Public Domain

Service:       Arts Holland
Service URL:   http://artsholland.com
Service API:   http://dev.artsholland.com/documentation/restapi


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
*/

var http = require('http'),
    querystring = require('querystring')


// API key
module.exports.apikey = ''


// Event
module.exports.event = function( one, two, three ) {
	
	if( typeof one == 'function' ) {
		
		// event( oneCallback )
		talk( 'event', one )
		
	} else if( typeof one == 'object' && typeof two == 'function' ) {
		
		// event( oneFilter, twoCallback )
		talk( 'event', one, two )
		
		
	} else if( typeof one == 'string' && typeof two == 'function' ) {
		
		// event( oneCIDN, twoCallback )
		talk( 'event/'+ one, two )
		
	} else if( typeof one == 'string' && two == undefined ) {
		
		// var event = event( oneCIDN )
		return {
			
			// event( oneCIDN ).venue( fourCallback )
			venue: function( four ) {
				talk( 'event/'+ one +'/venue', four )
			},
			
			// event( oneCIDN ).production( fourCallback )
			production: function( four ) {
				talk( 'event/'+ one +'/production', four )
			},
			
			// event( oneCIDN ).room( fourCallback )
			room: function( four ) {
				talk( 'event/'+ one +'/room', four )
			},
			
			// event( oneCIDN ).attachment( fourCallback )
			attachment: function( four ) {
				talk( 'event/'+ one +'/attachment', four )
			},
			
			offering: function( four ) {
				if( typeof four == 'function' ) {
					
					// event( oneCIDN ).offering( fourCallback )
					talk( 'event/'+ one +'/offering', four )
					
				} else if( typeof four == 'string' ) {
					return {
						
						// event( oneCIDN ).offering( fourName ).price( fiveCallback )
						price: function( fcb ) {
							talk( 'event/'+ one +'/offering/'+ four +'/price', five )
						}
						
					}
				}
			}
		}
	}
}

// Venue
module.exports.venue = function( one, two, three ) {
	
	if( typeof one == 'function' ) {
		
		// venue( oneCallback )
		talk( 'venue', one )
		
	} else if( typeof one == 'object' && typeof two == 'function' ) {
		
		// venue( oneFilter, twoCallback )
		talk( 'venue', one, two )
		
		
	} else if( typeof one == 'string' && typeof two == 'function' ) {
		
		// venue( oneCIDN, twoCallback )
		talk( 'venue/'+ one, two )
		
	} else if( typeof one == 'string' && two == undefined ) {
		
		// var venue = venue( oneCIDN )
		return {
			
			// venue( oneCIDN ).event( fourCallback )
			event: function( four ) {
				talk( 'venue/'+ one +'/event', four )
			},
			
			// venue( oneCIDN ).production( fourCallback )
			production: function( four ) {
				talk( 'venue/'+ one +'/production', four )
			},
			
			// venue( oneCIDN ).room( fourCallback )
			room: function( four ) {
				talk( 'venue/'+ one +'/room', four )
			},
			
			// venue( oneCIDN ).attachment( fourCallback )
			attachment: function( four ) {
				talk( 'venue/'+ one +'/attachment', four )
			}
			
		}
	}
}

// Production
module.exports.production = function( one, two, three ) {
	
	if( typeof one == 'function' ) {
		
		// production( oneCallback )
		talk( 'production', one )
		
	} else if( typeof one == 'object' && typeof two == 'function' ) {
		
		// production( oneFilter, twoCallback )
		talk( 'production', one, two )
		
		
	} else if( typeof one == 'string' && typeof two == 'function' ) {
		
		// production( oneCIDN, twoCallback )
		talk( 'production/'+ one, two )
		
	} else if( typeof one == 'string' && two == undefined ) {
		
		// var production = production( oneCIDN )
		return {
			
			// production( oneCIDN ).event( fourCallback )
			event: function( four ) {
				talk( 'production/'+ one +'/event', four )
			},
			
			// production( oneCIDN ).production( fourCallback )
			venue: function( four ) {
				talk( 'production/'+ one +'/venue', four )
			}
			
		}
	}
},

module.exports.genre = function( filters, cb ) {
	talk( 'genre', filters, cb )
}

module.exports.venuetype = function( filters, cb ) {
	talk( 'venuetype', filters, cb )
}


// Communicate
function talk( path, fields, cb ) {
	if( !cb && typeof fields == 'function' ) {
		var cb = fields
		var fields = {}
	}
	
	// prevent multiple callbacks
	var complete = false
	var doCallback = function( err, data ) {
		if( ! complete ) {
			complete = true
			cb( err, data )
		}
	}
	
	// build request
	fields.apiKey = module.exports.apikey
	fields = querystring.stringify( fields )
	
	var options = {
		host:	'api.artsholland.com',
		path:	'/rest/'+ path +'?'+ fields,
		method:	'GET',
		headers: {
			'User-Agent':	'artsholland.js (https://github.com/fvdm/nodejs-artsholland)',
			Accept:		'application/json'
		}
	}
	
	var request = http.request( options )
	
	// process response
	request.on( 'response', function( response ) {
		var data = []
		var size = 0
		
		response.on( 'data', function( chunk ) {
			data.push( chunk )
			size += chunk.length
		})
		
		response.on( 'close', function() {
			var err = new Error('request dropped')
			err.responseCode = response.statusCode || null
			err.responseHeaders = response.headers || null
			doCallback( err )
		})
		
		response.on( 'end', function() {
			var err = null
			
			if( data.length >= 0 ) {
				// process buffer
				var buf = new Buffer( size )
				var pos = 0;
				
				for( var d in data ) {
					data[d].copy( buf, pos )
					pos += data[d].length
				}
				
				data = buf.toString().trim()
				
				// validate
				if( ! data.match( /^(\{.*\}|\[.*\])$/ ) ) {
					err = new Error('not json')
					err.responseBody = data
				} else {
					data = JSON.parse( data )
				}
			} else {
				// no data
				err = new Error('invalid response')
				err.responseBody = null
			}
			
			// HTTP status
			if( response.statusCode !== 200 ) {
				err = new Error('http error')
				err.responseBody = data
			}
			
			// do callback
			if( err instanceof Error ) {
				err.request = options
				err.responseCode = response.statusCode || null
				err.responseHeaders = response.headers || null
				doCallback( err )
			} else {
				doCallback( null, data )
			}
		})
	})
	
	// request error
	request.on( 'error', function( error ) {
		var err = new Error('request error')
		err.requestError = error
		err.request = options
		doCallback( err )
	})
	
	// complete request
	request.end()
}

var SHA256 = require("crypto-js/sha256");
var crypto = require('crypto') ;

//console.log(SHA256("Message"));


var CryptoJS = require("crypto-js");
//console.log(CryptoJS.HmacSHA1("Message", "Key"));

var crypt = require("crypto-js");
//console.log(CryptoJS.HmacSHA1("Message", "Key"));



var ciphers = crypto.getCiphers();
//console.log(ciphers); // ['aes-128-cbc', 'aes-128-ccm', ...]


var md5 = require('md5');

console.log("md5---->"+md5('crueda'));



// Nodejs encryption with CTR
var crypto = require('crypto'),
    algorithm = 'rc4-hmac-md5',
    password = 'd6F3Efeq';

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

var hw = encrypt("hello world")
// outputs hello world
console.log(encrypt(hw));
console.log(decrypt(hw));


function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

var crypt = require('crypt3');
console.log( "-->" );

console.log( "-->" + crypt('6Xz7sS6fEmnWScMb6Ayf363e5cdqF4Kh') );
//kQoDjJXfaUgOU
//kQoDjJXfaUgOU

//d79abf23b2ea0257722e644c1dfd157a
//a91af6dca3b6d85a4884a7aec211ad96344d1bef417f

if( crypt('6Xz7sS6fEmnWScMb6Ayf363e5cdqF4Kh', '$1$SrkubyRm$DEQU3KupUxt4yfhbK1HyV/') !== '$1$SrkubyRm$DEQU3KupUxt4yfhbK1HyV/' ) {
    console.error('Access denied!');
    return;
}


/*
var ffi = require('ffi');

var libcrypt = ffi.Library('libcrypt', {
  'crypt': ['string', ['string', 'string']]
});

console.log(libcrypt.crypt('aa', 'bb'));
*/
/**
 *	Password is a class to implement password encryption as used
 *	on Unix systems. It is compatible with the crypt(3c) system function.
 *	This version is a based on the DES encryption algorithm in
 *	Andrew Tanenbaum's book "Computer Networks". It was rewritten
 *	in C and used in Perl release 4.035. This version was rewritten
 *	in Java by David Scott, Siemens Ltd., Australia.
 *
 *	For further details on the methods in this class, refer to the
 *	Unix man pages for crypt(3c).
 */

 /*
//console.log(randomInt(1,32000));
r= randomInt(1,32000);

//Random r = new Random();
		var salts = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./";
		var letter1 = salts.charAt(r+1 & 63);
		var letter2 = salts.charAt(r+1 & 63);
		var salt = "" + letter1 + letter2;

    var password = "crueda";

    	var pw = password ;
     var saltc = salt ;
     var pwb = new byte[66] ;
    var result = new char[13] ;
    var new_etr = new byte[etr.length] ;
     var n = 0 ;
     var m = 0 ;

     while ( m < pw.length && n < 64 ) {
     	for ( var j = 6 ; j >= 0 ; j-- ) {
     		pwb[n++] = (byte)(( pw[m] >> j ) & 1 ) ;
         }//for
         m++ ;
         pwb[n++] = 0 ;
     }//while
     while ( n < 64 ) {
         pwb[n++] = 0 ;
     }//while

     definekey ( pwb ) ;
     for ( n = 0 ; n < 66 ; n++ ) {
     	pwb[n] = 0 ;
     }//for

     System.arraycopy ( etr, 0, new_etr, 0 , new_etr.length ) ;
     EP = new_etr ;
     for ( var i = 0 ; i < 2 ; i++ ) {
     	var c = saltc[i] ;
         result[i] = c ;
         if ( c > 'Z' ) {
             c -= 6 + 7 + '.' ;   // c was a lowercase letter
         } else if ( c > '9' ) {
             c -= 7 + '.' ;    // c was a uppercase letter
         } else {
             c -= '.' ;        // c was a digit, '.' or '/'
         }//if                 // now, 0 <= c <= 63

         for ( var j = 0 ; j < 6 ; j++ ) {
         	if ((( c >> j ) & 1) == 1 ) {
         		var t         = (byte)(6*i + j) ;
                 var temp      = new_etr[t] ;
                 new_etr[t]     = new_etr[t+24] ;
                 new_etr[t+24]  = temp ;
             }//if
         }//for
     }//for

     if ( result[1] == 0 ) {
     	result[1] = result[0] ;
     }//if
     for ( var i = 0 ; i < 25 ; i++ ) {
     	encrypt ( pwb, 0 ) ;
     }//for
     EP = etr ;
     m = 2 ;
     n = 0 ;
     while ( n < 66 ) {
     	var c = 0 ;
         for ( var j = 6 ; j > 0 ; j-- ) {
         	c <<= 1 ;
             c |= pwb[n++] ;
         }//for
         c += '.' ;        // becomes >= '.'
         if ( c > '9' ) {
             c += 7 ;    // not in [./0-9], becomes upper
         }//if
         if ( c > 'Z' ) {
             c += 6 ;    // not in [A-Z], becomes lower
         }//if

         result[m++] = c ;
       }//while

       //return ( new String ( result ) );
       console.log ( new String ( result ) );
*/

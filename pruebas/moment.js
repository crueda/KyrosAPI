var moment = require('moment');

console.log("start");


var fecha = moment("2017-02-01T22:05:41Z",'YYYY-MM-DDTHH:mm:ssZ');
console.log ("fecha->"+fecha);


var start = moment().startOf('day');
console.log ("start->"+Number(start));
var date = start.format("HH:mm:ss");
console.log ("start->"+date);


var now = moment(new Date(1487286000000));
var dateFormat = now.format("YYYY-MM-DDTHH:mm:ssZ");
console.log ("dateFormat->"+dateFormat);

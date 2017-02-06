var GoogleMapsAPI = require('googlemaps');

var publicConfig = {
  key: 'AIzaSyD68KmxQFlbJuxJ6r2DLBBNmK4aY7z5xpo',
  //key: 'AIzaSyBsQQLArKxzsD2jKsa3r3GCpu9vazkg6Lw',
  stagger_time:       1000, // for elevationPath 
  encode_polylines:   false,
  secure:             true, // use https 
  proxy:              'http://127.0.0.1:9999' // optional, set a proxy for HTTP requests 
};
//var gmAPI = new GoogleMapsAPI(publicConfig);

var gmAPI = new GoogleMapsAPI(publicConfig);
var params = {
  center: '444 W Main St Lock Haven PA',
  zoom: 15,
  size: '500x400',
  maptype: 'roadmap',
  markers: [
    {
      location: '300 W Main St Lock Haven, PA',
      label   : 'A',
      color   : 'green',
      shadow  : true
    },
    {
      location: '444 W Main St Lock Haven, PA',
      icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=cafe%7C996600'
    }
  ],
  style: [
    {
      feature: 'road',
      element: 'all',
      rules: {
        hue: '0x00ff00'
      }
    }
  ],
  path: [
    {
      color: '0x0000ff',
      weight: '5',
      points: [
        '41.139817,-77.454439',
        '41.138621,-77.451596'
      ]
    }
  ]
};
gmAPI.staticMap(params); // return static map URL 
gmAPI.staticMap(params, function(err, binaryImage) {
  // fetch asynchronously the binary image 
  console.log(binaryImage);
  //var buf = new Buffer(binaryImage, 'binary');
  //console.log(buf.toString('hex'));
});

// reverse geocode API 
var reverseGeocodeParams = {
  "latlng":        "51.1245,-0.0523",
  "result_type":   "postal_code",
  "language":      "en",
  "location_type": "APPROXIMATE"
};
 
gmAPI.reverseGeocode(reverseGeocodeParams, function(err, result){
  console.log(result);
});
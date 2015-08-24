var _          = require('lodash'),
    Promise    = require('bluebird'),
    LightGroup = require('../hue').LightGroup;

var g = new LightGroup(1,2,3, 4);
    g.bri(255);

Promise.reduce(_.range(100000), function() {
    return g.blink(50).then(function(){
        return Promise.delay(1000)
    });
});

var _          = require('lodash'),
    Promise    = require('bluebird'),
    LightGroup = require('../hue').LightGroup,
    Light      = require('../hue').Light;

var hue1 = new Light(3),
    hue2 = new Light(4);
var lights = [hue1, hue2];
_.each(lights, function(light){
    light.bri(255).sat(255);
});
Promise.reduce(_.range(100000), function() {
    return Promise.all(_.map(lights, function(light){
        return light.alert(50).then(function(){
            return Promise.delay(500)
        });
    }));
});

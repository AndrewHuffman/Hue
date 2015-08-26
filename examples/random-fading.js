var _          = require('lodash'),
    Promise    = require('bluebird'),
    LightGroup = require('../hue').LightGroup,
    Light      = require('../hue').Light;

var lights = [new Light(3), new Light(4)];
_.each(lights, function(light){
    // light.bri(255).sat(255);
});
function randrgb(){return _.random(0,255)}
var x = 0;
Promise.reduce(_.range(100000), function() {
    return Promise.all(_.map(lights, function(light){
        light.bri(255).sat(255);
        light.color('rgb('+randrgb()+','+randrgb()+','+randrgb()+')');
        light.delay(25);
        return light.set('on', true).done().then(function(){
            return Promise.delay(1000);
        });
    }));
});

var kitchen    = new LightGroup(1,2),
    livingRoom = new LightGroup(3,4);
kitchen.bri(255);
livingRoom.bri(255);
Promise.reduce(_.range(100000), function() {
    return kitchen.blink(50).then(function(){
        return Promise.delay(1000)
    });
});

Promise.reduce(_.range(100000), function() {
    return livingRoom.blink(50).then(function(){
        return Promise.delay(1000)
    });
});

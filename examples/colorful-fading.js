var _          = require('lodash'),
    Promise    = require('bluebird'),
    LightGroup = require('../hue').LightGroup,
    Light      = require('../hue').Light;

function synced(lights, func, delay, step) {
    step = !_.isNumber(step) ? 10 : step;
    return Promise.all(_.map(lights, function(light){
        light.delay(fade);
        return light[func](fade).then(function(){
            return Promise.delay(step);
        });
    }));
}
function offset(lights, func, fade, step) {
    step = !_.isNumber(step) ? 10 : step;
    return _.reduce(lights, function(promise, light){
        light.delay(fade);
        return promise.then(function(){
            var theFunc;
            if (_.isString(func)) {
                theFunc = light[func].bind(light);
            } else if (_.isFunction(func)) {
                theFunc = func.bind(light);
            }
            return theFunc(fade).then(function(){
                return Promise.delay(step);
            });
        });
    }, Promise.resolve());
}
function colorfulBlink(lights, colors, fade, delay) {
    _.each(lights, function(light){
        light.color(colors[_.random(0, colors.length-1)]);
    });
    return synced(lights, 'on', fade, delay).then(function(){
        return offset(lights, 'off', fade, delay);
    }).then(function(){
        return synced(lights, 'on', fade, delay);
    });
}

function doAgain(lights, fade, step) {
    return function() {
        return Promise.delay(step).then(function(){
            return colorfulBlink(lights, colors, fade, step);
        });
    }
}

var l3     = new Light(3),
    l4     = new Light(4);
    lights = [l3, l4],
    colors = ['red', 'blue', 'green', 'purple'];
lights =  _.map(lights, function(l){return l.bri(255).sat(255)});
var fade = 25,
    step = 25;
Promise.reduce(_.range(10000), function(){
    return colorfulBlink(lights, colors, fade, step)
        .then(doAgain(lights, fade, step));
});

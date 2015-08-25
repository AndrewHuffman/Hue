var _          = require('lodash'),
    Promise    = require('bluebird'),
    LightGroup = require('../hue').LightGroup,
    Light      = require('../hue').Light;

function synced(lights, func, delay, step) {
    step = !_.isNumber(step) ? 10 : step;
    return Promise.all(_.map(lights, function(light){
        light.delay(fade);
        return light[func]().then(function(){
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
            return theFunc().then(function(){
                return Promise.delay(step);
            });
        });
    }, Promise.resolve());
}
function colorfulBlink(lights, colors, fade, delay) {
    var x = 0;
    return synced(lights, 'on', fade, delay).then(function(){
        _.each(lights, function(light){
            var colorIdx = _.random(0, colors.length-1);
            var color = colors[colorIdx];
            light.color(color);
        });
        return offset(lights, 'off', fade, delay);
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
    colors = ['red', 'blue', 'green', 'purple', 'orange', 'white', 'cyan'];
var fade = 100,
    step = 100;
Promise.reduce(_.range(10000), function(){
    return colorfulBlink([l3, l4], colors, fade, step)
        .then(doAgain(lights, fade, step));
});

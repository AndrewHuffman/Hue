/* eslint-enable */
var request = require('superagent'),
    _       = require('lodash'),
    Promise = require('bluebird'),
    util    = require('util');

var inspect = util.inspect.bind(util);

var ip      = '10.0.1.2',
    api     = '23a38fb2987495716a761ce1b5e8d83',
    baseUrl = 'http://'+ip+'/api/'+api+'';

function log() { console.log.apply(console, _.toArray(arguments) ) }
function dir(obj) { console.log(inspect(obj, {depth:3, color:true}))}
function error() { console.error.apply(error, _.toArray(arguments) ) }

function hueapi(method /*[, arg1 [, arg2 ] ...]*/) {
    var defer = Promise.defer();
    var args = _.toArray(arguments);
    var uriArgs = uriArgs = _.filter(args, function(arg){return !_.isObject(arg)});
        uriArgs = uriArgs.slice(1, args.length-1);
    var dataArgs = _.filter(args, _.isObject);
    var uri = uriArgs.join('/');
    var url = baseUrl+'/'+uri;
    var req = request[method](url)
    // log(url)
    // dir(dataArgs)
    // log('----');
    if (dataArgs.length > 0) {
        req = req.send(dataArgs[0]);
    }
    req.end(function(err, res) {
        if (err) {
            // error('ERR> '+inspect(err));
            defer.reject(err)
        } else {
            defer.resolve(res)
            // log('>>>')
            // dir(res.body)
            // log('<<<')
        }
    });
    return defer.promise;
}
function Light(id) {
    this.id = id;
    this.state = {};
}
function isLight(light) {
    return light.constructor === Light;
}
util.inherits(Light, Object);
_.merge(Light.prototype, {
    set: function() {
        args = _.flatten(_.toArray(arguments));
        if (_.isObject(args[0])) {
            this.state = _.merge(this.state, args[0]);
        } else {
            var key = args[0],
                val = args[1];
            if (_.isUndefined(val)) {
                delete this.state[key];
            } else {
                this.state[key] = val;
            }
        }
        return this;
    },
    on: function(delay) {
        delay = delay || 0;
        this.delay(delay);
        this.set({on:true})
        return this.done();
    },
    off: function(delay) {
        delay = delay || 0;
        this.delay(delay);
        this.set({on:false})
        return this.done();
    },
    blink: function(delay) {
        delay = delay || 100;
        this.delay(delay);
        function wait() {
            return function() {
                return Promise.delay(delay);
            }
        }
        var off = this.off.bind(this),
            on  = this.on.bind(this);

            return this.on()
            .then(wait())
            .then(function(){
                return off();
            })
            .then(wait())
            .then(function(){
                return on();
            })
            .then(wait())
            .then(function(){
                return off();
            });
    },
    delay: function(delay) {
        delay = delay || 0;
        return this.set('transitiontime', delay)
    },
    cycle: function(attr) {
        var cycleX = this.state[attr] || 0;
        return function(step) {
            var maxes = {
                hue: 65536,
                bri: 256,
                sat: 256
            }, max  = maxes[attr],
               val   = Math.round(Math.abs(Math.sin(cycleX)*maxes[attr]));
              cycleX+=step;
              this.set(attr, val);
            //TODO: make oscilate...i can't spell
            // if (cycleX > max) {
            //     step = step * -1;
            // }
            // },  val = Math.round(Math.abs(Math.sin(cycleX)*maxes[attr]));
            // this.set(attr, val);
        }.bind(this);
    },
    hue: function(hue) {
        hue = hue % 65536;
        this.set('hue', hue);
        return this;
    },
    bri: function(bri) {
        bri = bri % 256;
        this.set('bri', bri);
        return this;
    },
    sat: function(sat) {
        sat = sat % 256;
        this.set('sat', sat);
        return this;
    },
    done: function() {
        dir(this.state)
        return hueapi('put', 'lights', this.id, 'state', this.state);
    }
});
function LightGroup(lights) {
    if (!(this instanceof LightGroup)) {
        throw new TypeError('Must call with new.');
    }
    this.lights = [];
    lights = _.toArray(arguments);
    dir(lights)
    _.each(lights, function(id) {
        this.lights.push(new Light(id))
    }.bind(this));
}

util.inherits(LightGroup, Object);

LightGroup.prototype.add = function(light) {
    if (_.isNumber(light)) {
        this.lights.push(new Light(light));
    } else if (_.isObject(light) && isLight(light)) {
        this.lights.push(light)
    } else {
        throw new TypeError('Invlaid light type: ' + light);
    }
}
_.each(_.functions(Object.create(Light.prototype)), function(lightFunc) {
    LightGroup.prototype[lightFunc] = function() {
        dir(this.lights);
        var args = _.toArray(arguments);
        return _.reduce(this.lights, function(lastPromise, light) {
            return lastPromise.then(function(){
                return light[lightFunc].apply(light, args);
            });
        }, Promise.resolve());
    };
});

var l3 = new Light(3),
    l4 = new Light(4),
    l1 = new Light(1),
    l2 = new Light(2);

var cycle3Hue = l3.cycle('hue'),
    cycle4Hue = l4.cycle('hue');
    c3Bri     = l3.cycle('bri'),
    c4Bri     = l4.cycle('bri');
    l3.delay(10);
    l4.delay(10);

function cycleHues() {
    l3.sat(255);
    l4.sat(255);
    cycle3Hue(0.01);
    cycle4Hue(0.02);
    c3Bri(0.01);
    c4Bri(0.02);
    return Promise.all([l4.done(), l3.done()]);
}

function alertCycle() {
    var lights = [l1, l2, l3, l4];
    function next(){
        return Promise
            .delay(100)
            .then(function(){
                return Promise.all(_.map(lights, function(light){
                    return light.done()
                }));
            });
    }
    _.each(lights, function(light) {
        light.set('on', true);
        light.delay(0);
    });
    return next().then(function(){
        _.each(lights, function(light) {
            light.bri(255).sat(255);
        });
        return next();
    }).then(function(){
        _.each(lights, function(light) {
            light.bri(0);
        });
        return next()
    }).then(function(){
        _.each(lights, function(light) {
            light.sat(255);
        });
        return next();
    }).then(function(){
        _.each(lights, function(light) {
            light.sat(255);
        })
        return next();
    });
}



// var kitchen    = new LightGroup(1,2),
//     livingRoom = new LightGroup(3,4);
//
// kitchen.off();
// livingRoom.bri(255);
// var l3 = new Light(3),
//     l4 = new Light(4);
// var l3hue = l3.cycle('hue'),
//     l4hue = l4.cycle('hue'),
//     l3bri = l3.cycle('bri'),
//     l4bri = l4.cycle('bri'),
//     l3sat = l3.cycle('sat'),
//     l4sat = l4.cycle('sat');
// l3.sat(255);
// l4.sat(255);
// Promise.reduce(_.range(100000), function(next, n) {
//     l3hue(0.01);
//     l4hue(0.005);
//     l3bri(0.01);
//     l4bri(0.01);
//     // l3sat(0.02);
//     // l4sat(0.02);
//     return Promise.all([l3.done(), l4.done()]).then(function(){
//         return Promise.delay(25);
//     })
// });
// Promise.reduce(_.range(100000), function(next, n) {
//     return alertCycle().then(function(){
//         return Promise.delay(100);
//     });
// });
var g = new LightGroup(1,2,3, 4);
    g.bri(255);
    // g.blink().then(function(){
    //     g.bri(0);
    //     return g.blink()
    // }).then(function(){
    //
    // })
Promise.reduce(_.range(100000), function() {
    return g.blink(100).then(function(){
        return Promise.delay(1000)
    });
});

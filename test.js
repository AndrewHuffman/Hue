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
    log(url)
    dir(dataArgs)
    log('----');
    if (dataArgs.length > 0) {
        req = req.send(dataArgs[0]);
    }
    req.end(function(err, res) {
        if (err) {
            error('ERR> '+inspect(err));
            defer.reject(err)
        } else {
            defer.resolve(res)
            log('>>>')
            dir(res.body)
            log('<<<')
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
        dir(this.state)
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
    delay: function(delay) {
        delay = delay || 0;
        return this.set('transitiontime', delay)
    },
    cycle: function(attr) {
        var cycleX = this.state[attr] || 0,
            diff   = 0.01;
        this.delay(0);
        return function(step) {
            var maxes = {
                hue: 65536,
                bri: 256,
                sat: 256
            }, max  = maxes[attr]
               val  = cycleX % max;
            cycleX+=step;
            // },  val = Math.round(Math.abs(Math.sin(cycleX)*maxes[attr]));
            this.set(attr, val);
            // cycleX+=diff;
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
    this.lights = [];
    lights = lights || [];
    if (_.isArray(lights) || arguments.length > 1) {
        lights = _.flatten(_.toArray(arguments));
        _.each(lights, this.add.bind(this));
    } else {
        this.add(lights);
    }
}
util.inherits(LightGroup, Object)
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
        var args = _.toArray(arguments);
        _.each(this.lights, function(light) {
            light[lightFunc].apply(light, args);
        });
    };
});
var l3 = new Light(3),
    l4 = new Light(4);
// l3.hue(30000);
var cycle3Hue = l3.cycle('hue'),
    cycle4Hue = l4.cycle('hue');
    // c3Bri  = l3.cycle('bri'),
    // c4Bri  = l4.cycle('bri');
function cycleHues() {
    cycle3Hue(100);
    cycle4Hue(1000)
    l3.sat(255)
    l4.sat(255)
    l3.bri(0)
    l4.bri(0)
    // c3Bri();
    // c4Bri();
    return Promise.all([l4.done(), l3.done()]);
}
var l3 = new Light(3),
    l4 = new Light(4);
function alertCycle() {
    function step(next){ return Promise.delay(250).then(function(){return next}) }
    return Promise.all([l3.on(), l4.on()])
    // return Promise.resolve()
        .then(function(){
            l3.bri(255);
            l4.bri(255);
            l3.sat(255);
            l4.sat(255);
            return step(Promise.all([l3.done(), l4.done()]))
        }).then(function(){
            l3.bri(0)
            l4.bri(0)
            return step(Promise.all([l3.done(), l4.done()]))
        }).then(function(){
            l3.sat(0);
            l4.sat(0);
            return step(Promise.all([l3.done(), l4.done()]))
        }).then(function(){
            l3.sat(255);
            l4.sat(255);
            return Promise.all([l3.done(), l4.done()]).then(step)
        }).then(function(){
            return Promise.all([l3.off(), l4.off()]).then(step)
        });
}
Promise.reduce(_.range(65535), function(next, n) {
    return alertCycle().then(function(){
        return Promise.delay(10);
    })
});

# Hue.js
A Node.js library for controlling [Philips Hue](http://www2.meethue.com/en-us/) lights.

## :construction: Under Construction :construction:

This library is not yet complete!

## Usage

```javascript
var lamp = new Light(1);
lamp.on()
.then(function(){
    lamp.delay(100);
    return lamp.hue(12000);
})

var kitchen = new LightGroup(1,2);
lamp.off();
```

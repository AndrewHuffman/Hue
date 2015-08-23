#!/usr/bin/ruby

def cycle(max, diff)
    x=0
    lambda {
        nextVal=(Math.cos(x)*max).abs.round
        x+=diff
        nextVal
    }
end
hue=cycle(65535, 0.1)
sat=cycle(127, 0.1)
bri=cycle(255, 0.09)
puts bri
loop do
    bri1 = bri2 = bri.call()
    sat1 = sat2 = sat.call()+127
    hue1 = hue2 = hue.call()
    cmd1="--bri #{bri1} --hue #{hue1} --sat #{sat2} --light 3"
    cmd2="--bri #{bri2} --hue #{hue2} --sat #{sat2} --light 4"
    puts cmd1
    puts cmd2
    `/usr/local/bin/philips-hue #{cmd1}`
    `/usr/local/bin/philips-hue #{cmd1}`
end

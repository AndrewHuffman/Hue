#!/bin/bash
IP=10.0.1.2
API=23a38fb2987495716a761ce1b5e8d83
toggle_light() {
    TOGGLE=$HOME/.toggle
    URL="http://$IP/api/$API/lights/3/state"
    if [ ! -e $TOGGLE ]; then
        touch $TOGGLE
        LIGHT_STATE=true
    else
        rm $TOGGLE
        LIGHT_STATE=false
    fi
    curl -s -H 'Content-Type: application/json' -X PUT -d '{ "on": '$LIGHT_STATE'  }' $URL
}
toggle_light

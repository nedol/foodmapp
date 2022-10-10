'use strict'

import proj from 'ol/proj';
import {OLMap} from '../map/map'
import {Import} from "../import/import";
import {Events} from '../map/events/events';

(function($) {
    $.fn.longTap = function(longTapCallback) {
        return this.each(function(){
            var elm = this;
            var pressTimer;
            $(elm).on('touchend', function (e) {
                clearTimeout(pressTimer);
            });
            $(elm).on('touchstart', function (e) {
                // Set timeout
                pressTimer = window.setTimeout(function () {
                    longTapCallback.call(elm);
                }, 500)
            });
        });
    }
})(jQuery);




(function($) {
    $.fn.dblTap = function(dblTapCallback) {
        var timer = 0;
        return this.each(function(){
            if(timer == 0) {
                timer = 1;
                timer = setTimeout(function(){ timer = 0; }, 600);
            }
            else { alert("double tap"); timer = 0; }
        });
    }
})(jQuery);

export class User{

    constructor(uObj){
        this.path = host_port;
        this.date = new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));

        this.user_ovl;

        this.map = new OLMap();

        if(uObj) {
            this.map.Init(uObj.latitude, uObj.longitude);

            uObj.date = this.date;

            this.uid = uObj.set.uid;
            this.psw = uObj.set.psw;
            this.promo = uObj.set.promo;
            this.prolong = uObj.set.prolong;
            this.email = uObj.set.profile.email;

            this.profile = new Profile(uObj.set.profile);
            this.profile.InitDeliverProfile(this);
        }

        this.import = new Import(this.map);
        this.isShare_loc = false;

        this.events = new Events(this.map);
    }

    SendLocation(loc){

        if (this.isShare_loc) {
            let location = proj.toLonLat(loc);
            location[0] = parseFloat(location[0].toFixed(6));
            location[1] = parseFloat(location[1].toFixed(6));
            let data_obj = {
                proj: d2d,
                user: window.user.constructor.name.toLowerCase(),
                func: 'sharelocation',
                uid: window.user.uid,
                supuid: this.email,
                date: this.date,
                location: location
            };

            window.network.SendMessage(data_obj, function (data) {
                console.log(data);
            });

            if(window.user.user_ovl ) {
                window.user.user_ovl.overlay.setPosition(loc);
            }

        }
    }
}
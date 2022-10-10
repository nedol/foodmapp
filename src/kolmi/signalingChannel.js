'use strict';

import {log} from './utils'

export class SignalingChannel{

    constructor(url) {


        this.url = url;
        if(!this.ws)
            this.ws = new WebSocket(this.url);

        $(this.ws).on('error', function (error) {
            log('Connect Error: ' + error.toString());
        });

        $(this.ws).on('close', function () {
            log('echo-protocol Connection Closed');
            window.user.SendCheck();
        });

        $(this.ws).on('message', function (message) {
            if (message.type === 'message') {
                log("Received: '" + message.originalEvent.data + "'");
                window.user.OnMessage(JSON.parse(message.originalEvent.data ));
            }
        });
    }

    SendMessage(rtc_par,cb){
        let that= this;
        if(that.ws.readyState!=1) {
            that.ws = new WebSocket(this.url);
            $(that.ws).on('open', (connection) => {
                that.ws.send(JSON.stringify(rtc_par));
            });
            $(that.ws).on('message', function (message) {
                if (message.type === 'message') {
                    log("Received: '" + message.originalEvent.data + "'");
                    window.user.OnMessage(JSON.parse(message.originalEvent.data ));
                }
            });
            return;
        }
        try {
            that.ws.send(JSON.stringify(rtc_par));
        }catch(ex){
            return false;
        }
        return true;
    }


}


// WEBPACK FOOTER //
// rtc/signalingChannel.js
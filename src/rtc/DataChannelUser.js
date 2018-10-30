'use strict'
export {DataChannelUser}
import {DataChannel} from "./DataChannel";



class DataChannelUser extends DataChannel{
    constructor(rtc,pc){
        super (rtc, pc);

        let that = this;

        // this.dc.onopen = () => {
        //     console.log('OnOpenDataChannel');
        // }

        pc.con.ondatachannel = (event)=> {
            console.log('Receive Channel Callback');

            this.dc = event.channel;//change dc

            this.dc.onopen = () => {
                this.dc.onopen = null;
                if (that.dc.readyState==='open') {
                    console.log(that.pc.pc_key+" datachannel open");

                    if(that.pc.pc_key === that.rtc.main_pc) {
                        that.sendCnt();
                    }
                }
                return true;
            }
        };

        this.dc.onmessage = function (event) {
            let data = JSON.parse(event.data);

            if(data.func==='forward'){
                that.forward = data.email;
                that.rtc.CreateChannel(data,'all');
                return;
            }
            if(that.rtc.constructor.name ==='RTCUserList') {
                that.rtc.OnUserDCMessage(data);
                return;
            }

            try {
                that.rtc.OnMessage(data, that);
            }catch(ex){

            }

        };

    }

    SendData(data){
        if(this.forward){
            data.email = this.forward;
            this.forward = '';
            data.func = 'answer';
        }
        this.dc.send(JSON.stringify(data), function (data) {
            console.log(data);
        });
    }

    sendCnt() {
        let that = this;
        let par = {};
        par.proj = 'rtc';
        par.uid = that.rtc.uid;
        par.func = 'datach';
        par.call = that.rtc.call_num;
        par.role = that.rtc.role;
        par.email = that.rtc.email.from;

        if(that.dc.readyState==='open') {
            that.SendData(par);
        }

        let cnt_call = 3;
        let inter = setInterval(function () {
            cnt_call--;
            //$($('[abonent="'+ that.rtc.email.from +'"]')[0].contentDocument).find('.call_cnt').html(String(cnt_call));
            $('iframe[src*="'+ that.rtc.email.from +'"]')[0].contentWindow.postMessage({email: that.rtc.email.from,element:'.call_cnt',html:String(cnt_call)},'*');
            if (cnt_call === 0) {
                clearInterval(inter);
            }
        },1000);
    }

}
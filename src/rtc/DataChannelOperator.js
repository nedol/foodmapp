'use strict'
export {DataChannelOperator}
import {DataChannel} from "./DataChannel";
import {getParameterByName,  log} from '../utils'



class DataChannelOperator extends DataChannel{
    constructor(rtc,pc){
        super (rtc, pc);

        this.cb;
        let that = this;
        let request;

        pc.con.ondatachannel = (event)=> {
            log('Receive Channel Callback', this.rtc);
            this.dc = event.channel;//change dc
        };

        this.dc.onopen = ()=>{

            if(that.pc.pc_key === that.rtc.main_pc || that.pc.pc_key ==='reserve') {
                log(that.pc.pc_key+" datachannel open", that.rtc);
            }
        };

        this.dc.onmessage = function (event) {
            let data = JSON.parse(event.data);

            if(data.func==='request' && data.email===that.rtc.email.from){
                that.request = data.email;
                that.rtc.CreateChannel(data,'all');
            }else if(data.func==='forward'){
                if(that.rtc.user) {//forward
                    that.rtc.user.DC.SendData(data);
                }
            }else if(data.func==='answer'){
                if(that.rtc.user) {//
                    that.rtc.user.DC.SendData(data);
                }else{
                    that.rtc.OnMessage(data, that);
                }
            }else {
                that.rtc.OnMessage(data, that);
            }
        };

    }

    SendData(data){
        if(this.request){
            this.request = '';
        }
        this.dc.send(JSON.stringify(data), function (data) {
            console.log(data);
        });
    }

}
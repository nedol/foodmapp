'use strict'
export {DataChannel}

class DataChannel {
    constructor(rtc,pc){
        this.rtc = rtc;
        this.pc = pc;
        this.call_num = 3;
        this.dc = pc.con.createDataChannel(pc.pc_key+" data channel");
        this.forward;


        this.dc.onclose = function () {
            console.log("datachannel close");
        };

        let that = this;

    }


}
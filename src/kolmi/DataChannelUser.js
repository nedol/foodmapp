'use strict'

import {DataChannel} from "./DataChannel";
import {RTCUser} from "./rtc_user";


export class DataChannelUser extends DataChannel{
    constructor(rtc,pc){
        super (rtc, pc);

        let that = this;
        that.cnt_call = 0;
        // this.dc.onopen = () => {
        //     console.log('OnOpenDataChannel');
        // }

        this.dc.onclose = () => {
            // rtc.OnMessage({func:'mute'});
        };

        pc.StartEvents();


        pc.con.ondatachannel = (event)=> {
            console.log('Receive Channel Callback');

            this.dc = event.channel;//change dc

            this.dc.onopen = () => {
                //this.dc.onopen = null;
                if (that.dc.readyState==='open') {
                    console.log(that.pc.pc_key+" datachannel open");

                }

                if(that.cnt_call === 0) {
                    that.cnt_call = 5;
                    that.SendDCCnt();
                }

                return true;
            }
        };

        let data = '';
        let receiveBuffer = [];
        let receivedSize = 0;
        $(this.dc).off("message");
        this.dc.onmessage = function (event) {
            try {
                let parsed = JSON.parse(event.data);
                if (parsed.type==="eom") {
                    that.rtc.OnMessage(JSON.parse(data), that);
                    data = '';
                    return;
                }
                data += parsed.slice;
                if (parsed.file) {
                    $('#dataProgress').attr('max',parsed.length);
                }
                if (parsed.type==="eof") {
                    const received = new Blob(receiveBuffer);
                    receiveBuffer = [];

                    receivedSize = 0;
                    if(confirm("Получен файл: "+parsed.file+". Размер: "+parsed.length+" Сохранить?")){
                        $('#download_href').text("Получен файл: "+parsed.file+". Размер: "+parsed.length+" Сохранить?");
                        $('#download_href').attr('href',URL.createObjectURL(received));
                        $('#download_href').attr('download',parsed.file);
                        $('#download_href')[0].click();
                    }
                    setTimeout(function () {
                        $('#dataProgress').css('display','none');
                    },2000)

                    return;
                }
            }catch(ex){
                data = '';
                if(!event.data.byteLength)
                    return;

                $('#dataProgress').css('display','block');
                receivedSize += event.data.byteLength;
                receiveBuffer.push(event.data);

                $('#dataProgress').attr('value',receivedSize);
            }

        };
    }

    SendFile(data, name){
        // if(this.forward){
        //     data.email = this.forward;
        //     this.forward = '';
        //     data.func = 'answer';
        // }
        try {
            if(this.dc.readyState==='open') {
                let size = 16384;
                const numChunks = Math.ceil(data.byteLength / size);

                this.dc.send(JSON.stringify({file:name,length:data.byteLength}), function (data) {
                    console.log(data);
                });
                for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
                    const slice = data.slice(o, o + size);
                    $('#dataProgress').attr('value', o + size);
                    this.dc.send(slice, function (data) {
                        console.log(data);
                    });
                }
                setTimeout(function () {
                    $('#dataProgress').css('display','none');
                },2000);

                this.dc.send(JSON.stringify({type:'eof',file:name,length:data.byteLength}), function (data) {
                    console.log(data);
                });
            }
        }catch(ex){
            console.log(ex);
        }
    }

    SendData(data, cb){
        // if(this.forward){
        //     data.email = this.forward;
        //     this.forward = '';
        //     data.func = 'answer';
        // }
        try {
            $(this.dc).on('message',function (ev) {
                if(cb)
                    cb();
            });

            if(this.dc.readyState==='open') {
                data = JSON.stringify(data);
                let size = 16384;
                const numChunks = Math.ceil(data.length / size)

                for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
                    this.dc.send(JSON.stringify({slice:data.substr(o, size)}), function (data) {
                        console.log(data);
                    });
                }
                this.dc.send(JSON.stringify({type:'eom'}), function (data) {
                    console.log(data);
                });

                }
        }catch(ex){
            console.log(ex);
        }
    }


    SendDCCnt(){
        let that = this;
        let par = {};
        par.proj = 'rtc';
        par.uid = that.rtc.uid;
        par.func = 'cnt';
        par.call = that.rtc.call_num;
        par.role = that.rtc.role;
        par.email = that.rtc.email.from;
        par.profile = localStorage.getItem("kolmi_abonent");

        if(that.dc.readyState==='open') {
            that.SendData(par);

            //that.rtc.pcPull[that.rtc.main_pc].params['loc_cand'] = [];
        }

        if($('.localSound')[0].played.length===0){
            window.user.localSound.play();
        }

        $('.localSound').on('ended',function () {
            window.user.localSound.pause();
        });

        that.inter = setInterval(function () {
            that.cnt_call--;

            $('.call_cnt').text(that.cnt_call);
            if (that.cnt_call === 0) {
                clearInterval(that.inter);
                if(that.rtc.role==='user') {
                    return;

                }
            }

        },2000);
    }

    SendDCHangup(cb){
        let par = {};
        par.proj = 'rtc';
        par.func = 'mute';
        par.role = this.rtc.role;

        this.SendData(par,cb);
    }

    SendDCClose(cb){
        let par = {};
        par.proj = 'rtc';
        par.func = 'close';
        par.role = this.rtc.role;

        this.SendData(par, cb);
    }

    SendDCCall(cb){
        let par = {};
        par.proj = 'rtc';
        par.func = 'call';
        par.role = this.rtc.role;

        this.SendData(par, cb);
    }

    SendDCTalk(cb){
        let par = {};
        par.proj = 'rtc';
        par.func = 'talk';
        par.role = this.rtc.role;

        this.SendData(par, cb);
    }

    SendDCCand(cand,key,msg) {

        let par = {};
        par.proj = 'rtc';
        par.func = 'offer';
        par.cand = cand;
        par.trans = key;
        par.abonent = this.rtc.abonent;
        par.msg = msg;

        this.SendData(par);
    }


    SendDCDesc(desc,key,msg) {

        let par = {};
        par.proj = 'rtc';
        par.func = 'offer';
        par.desc = desc;
        par.trans = key;
        par.abonent = this.rtc.abonent;
        par.msg = msg;

        this.SendData(par);
    }

    SendDCOffer(key,msg) {

        let par = {};
        par.proj = 'rtc';
        par.func = 'offer';
        par.desc = this.pc.params['loc_desc'];
        par.cand = this.pc.params['loc_cand'];
        par.trans = key;
        par.abonent = this.rtc.abonent;
        par.msg = msg;

        this.SendData(par);

    }

    SendDCVideoOK(cb){
        let par = {};
        par.proj = 'rtc';
        par.func = 'video';
        par.role = this.rtc.role;

        this.SendData(par, cb);
    }

    SendRedirect(abonent) {

        let par = {};
        par.proj = 'rtc';
        par.func = 'redirect';
        par.trans = 'all';
        par.abonent = abonent;

        if(this.dc.readyState==='open') {
            this.SendData(par);
            this.rtc.OnMessage({func: 'mute'});
            let date_str = new Date().toLocaleString("es-CL");
            $(".call_text")[0].innerHTML += '<div>'+(date_str)+' Вызов переадресован '+abonent.name+'<div/>';
        }
    }

}


// WEBPACK FOOTER //
// rtc/DataChannelUser.js
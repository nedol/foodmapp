'use strict';
export {RTCUser}


import {Network} from '../network.js';
import {RTCBase} from "./rtc_base";
import {DataChannelUser} from "./DataChannelUser";
import {getParameterByName,  log} from '../utils'
import {InitEvents} from './events'


var crypto = require('crypto');
function md5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}


class RTCUser extends RTCBase{

    constructor(uid, abonent, components, func, network) {
        super('user');

        this.SetComponents($('object'), abonent, uid, components);
        this.func = func;
        this.uid = uid;
        this.email.from = abonent;
        localStorage.setItem('rtc_'+this.role, this.uid);
        //console.log(adapter.browserDetails.browser);

        this.remoteAudio = $('#remoteAudio_'+uid)[0]?$('#remoteAudio_'+uid)[0]:'';
        this.localSound =  $('#localSound_'+uid)[0]?$('#localSound_'+uid)[0]:'';
        this.localVideo =  $('#localVideo_'+uid)[0]?$('#localVideo_'+uid)[0]:'';
        this.remoteVideo = $('#remoteVideo_'+uid)[0]?$('#remoteVideo_'+uid)[0]:'';

        this.addVideo = $('#addVideo_'+uid)[0];

        let that = this;

        this.network = network;

        if(!that.send_req_func) {
            let par = {};
            par.proj = 'rtc';
            par.func = 'check';
            par.email = that.email.from;
            par.uid = that.uid;
            par.role = that.role;
            par.trans = 'all';
            that.send_req_func = that.network.postRequest(par);
        }


        $(window).on('beforeunload', function (ev) {
            that.SendClose(that.uid);
        });


        $('#addVideo_'+that.uid).on('click',function (ev) {
            that.onAddVideo(ev);
        });

        if(func && func.includes('Init')){
            that.Init();
        }
    }

    Init() {
        let that = this;

        let transAr=['relay','all'];
        if(that.main_pc){
            that.InitRTC(that.offerOptions,that.main_pc, that.onInitRTC);
        }else {
            for (let i in transAr) {
                setTimeout(function () {
                    if (that.pcPull[transAr[i]] && transAr[i] !== that.main_pc) {
                        that.pcPull[transAr[i]].con.close();
                        that.pcPull[transAr[i]] = null;
                        delete that.pcPull[transAr[i]];
                    }
                    that.InitRTC(that.offerOptions, transAr[i], that.onInitRTC);
                },i*100);
            }
        }
    }

    onInitRTC(that, pc_key) {

    }

    CreateChannel(data, pc_key) {

        this.offerOptions.offerToReceiveVideo =0;
        this.offerOptions.iceRestart = 1;
        this.InitRTC(this.offerOptions, pc_key, function (that, pc_key) {
            that.GetUserMedia(function () {
                that.OnMessage(data);
            });
        });
    }


    onIceStateChange(pc, event) {
        let that = this;
        if (pc) {

            if(pc.con.iceConnectionState==='new'){
                log(pc.pc_key +' ICE state change event: new', that);
            }

            if(pc.con.iceConnectionState==='checking'){
                log(pc.pc_key +' ICE state change event: checking', that);

            }

            if(pc.con.iceConnectionState==='disconnected'){

            }

            if(pc.con.iceConnectionState==='failed'){
                log(pc.pc_key +' ICE state change event: failed', that);
                pc.DC = null;
                delete that.pcPull[pc.pc_key];
                pc.con.close();
            }

            if(pc.con.iceConnectionState==='connected') {
                //that.signch.eventSource.close();
                log(pc.pc_key +' ICE state change event: connected', that);

                if(!that.main_pc || pc.pc_key==='all') {
                    that.main_pc = pc.pc_key;

                }else if(pc.pc_key!=='reserve' && that.main_pc!==pc.pc_key) {
                    pc.DC = null;
                    delete that.pcPull[pc.pc_key];
                    pc.con.close();
                    log(pc.pc_key +' ICE state: closed and deleted', that);
                    return;
                }


                pc.DC =  new DataChannelUser(that, pc);//pcPull.createDataChannel("user channel");
                that.DC = pc.DC;


                if(that.offerOptions.offerToReceiveVideo===1) {

                    $('#kolmi_if_'+that.uid)[0].contentWindow.postMessage({email:that.email.from,element:'#callButton_'+that.uid,style:{'height':'95%','width':'95%'}}, "*");

                    $(that.addVideo).css('display', 'none');
                }

                if(!that.iframe) {
                    $('#browser_but_' + that.uid).css('display', 'block');
                }

                $('#kolmi_if_'+that.uid)[0].contentWindow.postMessage({email: that.email.from, element:'#callObject_'+that.uid,style:{'opacity':'1'}}, "*");
                $('#kolmi_if_'+that.uid)[0].contentWindow.postMessage({email: that.email.from, element:'#callButton_'+that.uid,style:{'transform':'rotate(0deg)'}}, "*");

            }

            if(pc.con.iceConnectionState==='completed') {
                log(pc.pc_key +' ICE state change event: completed', that);

            }
            log(pc.pc_key +' ICE state change event: '+ event.type, that);
        }
    }

    OnMessageIFrame(that,data) {
        if (data.func) {
            that[data.func](data);
            return;
        }
        if(data.event === 'load'){
            if(typeof that.OnLoadIFrame  === "function")
                that.OnLoadIFrame();
            if(that.func && that.func.includes('call')){
                data.event='call';
            }
        }
        if (data.event === 'call') {

            if (data.call_cnt)
                that.call_cnt = data.call_cnt;

            if(Object.keys(that.pcPull).length===0) {
                that.Init( function (that,pc_key) {
                    that.GetUserMedia(function () {
                        that.email.from = data.email;
                        that.pcPull[pc_key].SendOffer();
                    });
                });

            }else {

                that.GetUserMedia(function () {
                    for (let key in that.pcPull) {
                        that.pcPull[key].params['loc_desc'] = 'offer';
                        that.iframe = data.iframe;
                        that.pcPull[key].SendCall(data.email);
                    }
                });
            }

        }else if(data.event === 'close'){
            that.SendClose(that.uid);
        }
    }

    OnMessage(data, dc) {
        let that = this;

        if(data.func==='forward'){

        }

        if(data.check){
            if(!that.DC) {
                that.Init();

                $('#kolmi_if_'+that.uid)[0].contentWindow.postMessage({
                    email: that.email.from,
                    element: '.callObject',
                    style: {'visibility': 'visible', 'opacity': .5}
                }, "*");
                $('#kolmi_if_'+that.uid)[0].contentWindow.postMessage({
                    email: that.email.from,
                    element: '.callButton',
                    style: {'transform': 'rotate(130deg)'}
                }, "*");

                $('#kolmi_if_'+that.uid)[0].contentWindow.postMessage({
                    email: that.email.from,
                    element: '.call-queue',
                    html: data.queue
                }, "*");
            }
        }

        if(data.close){
            log('PC was deleted from server');
            that.hangup();
        }

        if(data.res ==='OK'){
            log("received: " + data.res + " from "+ that.role, that);

            if(!that.pcPull['reserve']) {
                that.InitRTC(that.offerOptions, 'reserve', function () {
                    that.GetUserMedia(function () {

                    });
                });
                //that.pcPull['reserve'] = that.pcPull[that.main_pc];

            }

            $(that.remoteAudio).prop('muted',false);

            for(let key in that.pcPull) {
                that.remoteStream = that.pcPull[key].con.getRemoteStreams()[0];
                if(that.remoteStream) {
                    that.remoteAudio.srcObject = that.remoteStream;
                    $("video_container").css('display','block');
                }
            }

            that.AppendBrowser(that.uid);
            $(that.addVideo).css('display', 'block');
            $('#browser_but_' + that.uid).css('display', 'block');
            $('#browser_but_' + that.uid).on('click', that, function (ev) {
                InitEvents();
                that.OpenBrowser(ev);
            });
        }

        if (data.desc) {
            if(that.pcPull[data.trans]){
                that.pcPull[data.trans].params['rem_desc'] = data.desc;
                that.pcPull[data.trans].setRemoteDesc(data.desc);
            }
        }
        if (data.cand) {
            if(that.pcPull[data.trans]) {
                if (that.pcPull[data.trans].con.signalingState === 'closed') {
                    return;
                }
                try {
                    that.pcPull[data.trans].params['rem_cand'] = data.cand;
                    that.pcPull[data.trans].con.addIceCandidate(data.cand);

                    log(' Remote ICE candidate: \n' + (data.cand ? JSON.stringify(data.cand) : '(null)'), that);
                } catch (ex) {
                    console.log(ex);
                }
            }
        }

        if(data.confirm){
            log(' Video confirm request');
            let result = confirm(data.confirm);
            if(result) {
                that.offerOptions.offerToReceiveVideo = 1;
                that.offerOptions.iceRestart = 1;
                that.InitRTC( that.offerOptions,that.main_pc, function () {
                    that.GetUserMedia(function () {
                        that.DC.SendData({'camera': result});
                    });

                    $('#container').width('200');

                    $('#kolmi_if_'+that.uid)[0].contentWindow.postMessage({email: that.email.from, element:'.callObject',style:{'height':'100%','width':'100%'}}, "*");

                });
            }
        }
        if (data.camera){

            that.offerOptions.offerToReceiveVideo = 1;
            that.offerOptions.iceRestart = 1;
            that.SendClose(that.uid,'all')
            that.SendClose(that.uid,'relay');
            that.InitRTC(that.offerOptions, that.main_pc, function () {
                that.GetUserMedia(function () {
                    let pc = that.pcPull[that.main_pc];
                    pc.DC = new DataChannelUser(that, pc);
                    pc.params = {};
                    log('pc createOffer start', that);
                    pc.con.createOffer(
                        that.offerOptions
                    ).then(
                        desc => pc.onCreateOfferSuccess(desc),
                        pc.onCreateOfferError
                    );

                });

                $('#kolmi_if_'+that.uid)[0].contentWindow.postMessage({email: that.email.from, element:'.callObject',style:{'opacity': 1}}, "*");

                $(that.addVideo).css('display', 'none');

            });
        }

        if(data.browser){
            $('.browser')[0].contentWindow.postMessage({email:that.email.from,func:'InputMessage', args:[data]},'*')

            if(data.browser.msg.includes('https://') || data.browser.msg.includes('http://') ){
                 $('.browser')[0].contentWindow.postMessage({email:that.email.from,func:'InsertElements', args:[{id:md5(data.browser.msg),type:0,func:'InsertIFrame',url:data.msg}]},'*')

            }
        }

        if(data.data && data.data.html){
            //$('#browser')[0].contentWindow.InputHtml(data.html);
            $('.browser')[0].contentWindow.postMessage({email:that.email.from,func:'InputHtml', args:[data.data.html]},'*');
        }

        if(data.event){
            //$('#browser')[0].contentWindow.TriggerEvent(data.event);
           //$('#browser')[0].contentWindow.postMessage({func:'TriggerEvent', args:[data.html]},'*')

        }

        if(data.element==='.call-queue'){
            $('#kolmi_if_'+ data.uid).each(function () {
                this.contentWindow.postMessage(data,'*');
            });
            $('#kolmi_if_list_'+ data.uid).each(function () {
                this.contentWindow.postMessage(data,'*');
            });
        }
    }


    hangup(){
        let that = this;

        $('#kolmi_if_'+that.uid)[0].contentWindow.postMessage({email: that.email.from, element:'.callObject',style:{'visibility': 'hidden','opacity':.5}}, "*");
        $('#kolmi_if_'+that.uid)[0].contentWindow.postMessage({email: that.email.from, element:'.callButton',style:{'transform':'rotate(130deg)'}}, "*");

        $('.browser_container').css('display','none');

        if (that.localStream) {
            const videoTracks = that.localStream.getVideoTracks();
            videoTracks.forEach(videoTrack => {
                videoTrack.stop();
                that.localStream.removeTrack(videoTrack);
                that.localStream = null;
            });
        }
    }



}


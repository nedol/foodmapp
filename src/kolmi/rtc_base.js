'use strict';
export {RTCBase}

import {log} from './utils'

import {Peer} from './Peer'
import {DataChannelUser} from "./DataChannelUser";
import {SignalingChannel} from './signalingChannel.js';
// import {VideoRecorder} from "./recorder";

(function($) {
    $.fn.longTap = function(longTapCallback) {
        return this.each(function(){
            var elm = this;
            var start;
            var cnt = 0;
            $(elm).on('touchend mouseup', function (e) {
                e.preventDefault();
                var dt = new Date();
                if((dt.getTime() - start)<500)
                    ;//window.user.onCallButtonClick(e);
                else
                    longTapCallback.call(elm);
            });
            $(elm).on('touchstart mousedown', function (e) {
                // Set timeout
                var dt = new Date();
                start = dt.getTime();
            });
        });
    }
})(jQuery);

function listener(event) {
    if (event.origin != 'https://nedol.ru') {
        return;
    }

    if(JSON.parse(event.data)['onclose']){
        document.getElementById(JSON.parse(event.data)['remove']).remove();
        let arr = document.getElementsByClassName('kolmi');
        for(let fr in arr){
            if(arr[fr].tagName.toLowerCase() === 'iframe'){
                arr[fr].contentWindow.postMessage(JSON.stringify({'onclose':'profile'}))
            }
        }

    }
}


class RTCBase{

    constructor(trans,role, em, uid) {

        let that = this;

        this.role = role;
        this.trans = trans;
        this.em = em;
        this.uid = uid;

        this.path = "https://nedol.ru/rtc/";
        if(location.hostname==='localhost')
            this.path = 'http://localhost:63342/kolmi/dist/';

        if(!this.signch) {
            this.signch = new SignalingChannel(host_ws);
        }

        this.email={'from':'','to':''}
        this.pcPull = {};
        this.main_pc;

        this.origin = location.origin;
        this.url;
        this.call_num = 100;

        this.localStream;
        this.remoteStream;

        this.startTime;

        this.phone='';

        // this.vr = new VideoRecorder();
        // this.vr.open();

    }

    OnMessage(data) {}

    SendCheck(){
        let par = {};
        par.proj = 'rtc';
        par.func = 'check';
        par.status = 'check';
        par.role = this.role;
        par.trans = this.trans;
        par.em = this.em;
        par.uid = this.uid;
        par.abonent = this.abonent;

        this.signch.SendMessage(par);
    }

    SendOffer(key) {

        let that = this;

        //log('pcPull createOffer start', that);
        that.pcPull[key].con.createOffer(this.type=
            {
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 1,
            }
        ).then(
            desc => that.pcPull[key].onCreateOfferSuccess(desc),
            that.pcPull[key].onCreateOfferError
        );

    }

    SendVideoOffer(key){
        let that = this;
        that.pcPull[key].params['loc_desc'] = '';
        that.pcPull[key].params['loc_cand'] = '';

        that.pcPull[key].con.createOffer(
            that.type={
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 1,
                iceRestart:1
            }
        ).then(
            desc => that.pcPull[key].onCreateVideoOfferSuccess(desc),
            that.pcPull[key].onCreateOfferError
        );

    }


    onIceStateChange(pc, event) {
        let that = this;
        if (pc) {

            if(pc.con.iceConnectionState==='new'){
                log(pc.pc_key +' ICE state change event: new', that);
            }

            if(pc.con.iceConnectionState==='checking'){
                log(pc.pc_key +' ICE state change event: checking', that);
                that.checking_tmr = setTimeout(function () {
                    pc.con.restartIce();
                },5000)

            }

            if(pc.con.iceConnectionState==='disconnected'){
                log(pc.pc_key +' ICE state change event: disconnected', that);
                pc.con.restartIce();

            }

            if(pc.con.iceConnectionState==='connected') {
                //that.signch.eventSource.close();
                clearTimeout(that.checking_tmr);
                log(pc.pc_key +' ICE state change event: connected', that);
                that.main_pc = pc.pc_key;

                //that.DC = new DataChannelUser(that, pc);
            }

            if(pc.con.iceConnectionState=== "failed") {
                /* possibly reconfigure the connection in some way here */
                log(pc.pc_key +' ICE state change event: failed', that);
                /* then request ICE restart */
                pc.con.restartIce();

            }

            if(pc.con.iceConnectionState==='completed') {
                log(pc.pc_key +' ICE state change event: completed', that);

            }
            log(pc.pc_key +' ICE state change event: '+ event.type, that);
        }
    }


    TransFile() {
        let that = this;
        async function handleFileInputChange() {
            const file = $('#fileInput')[0].files[0];
            if (!file) {
                log('No file chosen');
            } else {
                // sendFileButton.disabled = false;
            }
            if (file.size === 0) {
                return;
            }
            $('#dataProgress').css('display','block');
            $('#dataProgress').attr('max', file.size);

            let fileReader = new FileReader();
            $(fileReader).on('load', e => {
                log('FileRead.onload ', e);
                that.DC.SendFile(e.target.result,file.name);
            });
            fileReader.readAsArrayBuffer(file);
        }
        $('#fileInput').off('change');
        $('#fileInput').on('change', handleFileInputChange);
        $('#fileInput').trigger('click');
    }

    EventsHandlers(){

        $('.callButton').on('click',function () {
            return false;
        });
        $('.callObject').on('click',function () {
            return false;
        });

    }

    get RemoteStream(){
        return this.remoteStream;
    }

    InitRTC(pc_key, cb) {

        let that = this;

        that.url = {
            "urls": [
                "turn:delivery-angels.com:3478?transport=udp",
                "turn:delivery-angels.com:3478?transport=tcp",
                "turn:delivery-angels.com:5349?transport=udp",
                "turn:delivery-angels.com:5349?transport=tcp"
            ],
            "username": "guest", "credential": "password"
            // "urls": [
            //     "turn:numb.viagenie.ca:3478?transport=udp",
            //     "turn:numb.viagenie.ca:3478?transport=tcp"
            // ],
            // "username": "nedol@ya.ru", "credential": "hover386"
        }

        let pc_config = {
            iceTransportPolicy: 'all',
            lifetimeDuration: "86400s",
            rtcpMuxPolicy: "require",
            bundlePolicy: "balanced",
            iceServers: [
                {
                    "urls": [
                        // "stun:64.233.161.127:19302",
                        // "stun:[2A00:1450:4010:C01::7F]:19302",
                        //"stun:stun.l.google.com:19302",
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                        "stun:stun3.l.google.com:19302",
                        "stun:stun4.l.google.com:19302"
                    ]
                }
                , that.url
            ]
        };
        if(that.pcPull[pc_key]){
            if(that.DC) {
                that.DC.dc.close();
                //that.DC = null
            }
            if(that.pcPull[pc_key].con) {
                that.pcPull[pc_key].con.close();
                //that.pcPull[pc_key].con = null
            }
        }

        let params = that.pcPull[pc_key]?that.pcPull[pc_key].params:{};
        that.pcPull[pc_key] = new Peer(that, pc_config, pc_key);
        that.pcPull[pc_key].signch = that.signch;
        that.pcPull[pc_key].params = params;

        setTimeout(function () {
            that.DC = new DataChannelUser(that, that.pcPull[pc_key]);
        },0);


        //log('Starting call', that);
        this.startTime = Date.now();

        cb();
    }

    GetUserMedia(opts,cb){
        let that = this;
        navigator.mediaDevices.getUserMedia(opts)
            .then(stream => this.gotStream(stream,cb))
            .catch(function (e) {
                if(e.name === 'NotFoundError' || e.name === 'NotReadableError') {
                    if(opts.audio)
                        alert("Something wrong with mic?");
                    if(opts.video)
                        alert("Something wrong with camera?");

                    cb(false);
                }
            });
    }

    gotStream(stream, cb) {

        //log('Received local stream', this);

        if(!this.localStream)
            this.localStream = stream;

        this.getTracks(stream,cb);
    }

    getTracks(stream, cb){
        let that = this;

        stream.getTracks().forEach(track => {
            for(let key in that.pcPull) {
                if(key==='reserve')
                     continue;
                if(that.pcPull[key].con.iceConnectionState ==='disconnected' ||
                    that.pcPull[key].con.iceConnectionState ==='closed')
                    continue;

                that.localStream.addTrack(track);
                that.pcPull[key].sender = that.pcPull[key].con.addTrack(
                    track,
                    that.localStream);

                if(track.kind==='video') {
                    that.localVideo.srcObject = null;
                    that.localVideo.srcObject = that.localStream;
                    that.remoteAudio.srcObject = null;
                    that.localSound.muted = 'true';
                    $('.callButton').attr('status','talk');

                }else if(track.kind==='audio') {
                    //that.remoteAudio.srcObject = null;
                    //that.localSound.srcObject = that.localStream;
                }

            }
        });

        var videoTracks = this.localStream.getVideoTracks();
        var audioTracks = this.localStream.getAudioTracks();

        if (videoTracks.length > 0) {
            log('Using video device: ' + videoTracks[0].label, that);
        }
        if (audioTracks.length > 0) {
            log('Using audio device: ' + audioTracks[0].label, that);
        }
        cb(true);
    }


    SendStatus(status){
        let par = {};
        par.proj = 'rtc';
        par.func = 'status';
        par.role = this.role;
        par.trans = this.trans;
        par.uid = this.uid;
        par.em = this.em;
        par.status = status;
        this.signch.SendMessage(par);
    }


    RemoveTracks(){
        let that = this;
        if (that.localStream) {
            const videoTracks = that.localStream.getVideoTracks();
            videoTracks.forEach(videoTrack => {
                if (videoTrack.readyState == 'live' && videoTrack.kind === 'video') {
                    videoTrack.stop();
                }

                that.localStream.removeTrack(videoTrack);

            });
            const audioTracks = that.localStream.getAudioTracks();
            audioTracks.forEach(audioTrack => {
                if (audioTrack.readyState == 'live' && audioTrack.kind === 'audio') {
                    audioTrack.stop();
                }
                that.localStream.removeTrack(audioTrack);
            });
        }
    }


}




// WEBPACK FOOTER //
// rtc/rtc_base.js
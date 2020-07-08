'use strict';
export {RTCUser}

import {SignalingChannel} from './signalingChannel.js';
const urlencode = require('urlencode');
var md5 = require('js-md5')
const utils = require('../utils/utils');
// require("./lib/common.js")

$(document).on('readystatechange', function () {

    if (document.readyState !== 'complete') {
        return;
    }
    let user = new RTCUser();
    user.start();
});

class RTCUser{

    constructor() {

        this.uid;
        this.pc;
        this.rtc_params = {};
        this.localAudio = document.getElementById('localAudio')?document.getElementById('localAudio'):'';
        this.localVideo = document.getElementById('localVideo')?document.getElementById('localVideo'):'';
        this.remoteVideo = document.getElementById('remoteVideo')?document.getElementById('remoteVideo'):'';

        this.startTime;
        this.callButton = document.getElementById('callButton');

        this.signch = new SignalingChannel();

        this.offerOptions = {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        };

        $(this.localAudio).on('loadedmetadata', function() {
            trace('Local audio loadedmetadata');
        });
    }

    start() {

        $(this.callButton).on('click', this, function (ev) {
            ev.data.call()
        });

        this.uid = localStorage.getItem('rtc_client_2')?localStorage.getItem('rtc_client_2'):md5(JSON.stringify(new Date()));
        localStorage.setItem('rtc_client_2', this.uid);

        let pc_config = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

        this.pc = new RTCPeerConnection(pc_config);
        this.call();
    }

    call() {

        let this_obj = this;
        if ($('#callButton').attr('src') === './img/ph_call_1.png') {
            hangup();
            $('#callButton').attr('src', './img/ph_call_0.png');
            return;
        }

        trace('Starting call');
        this.startTime = window.performance.now();

        let par = {};
        par.proj = 'vr';
        par.func = 'rem_params';
        par.uid = this.uid;
        this.signch.SendParamsWaitingAnswer(par,this, function (data) {
            for(let key in data) {
                this_obj.rtc_params['rem_desc'] = data[key].rem_desc;
                this_obj.setRemoteDesc(this_obj.pc,data[key].rem_desc);
                this_obj.rtc_params['rem_cand'] = data[key].rem_cand;
                this_obj.pc.addIceCandidate(data[key].rem_cand)
            }
        });
        this.pc.ontrack = function (e) {

        };
        $(this.pc).on('track', this, function (ev) {
            trace(ev);
            if (ev.data.remoteVideo.srcObject !== ev.originalEvent.streams[0]) {
                ev.data.remoteVideo.srcObject = ev.originalEvent.streams[0];
                trace('pc2 received remote stream');
            }
        });


        trace('Created local peer connection object pc');
        this.pc.onicecandidate = function (e) {
            if(!this_obj.rtc_params['loc_cand']) {
                this_obj.rtc_params['loc_cand']= e.candidate;
                this_obj.onIceCandidate(e);
            }
        };
        this.pc.oniceconnectionstatechange = function(e) {
            this_obj.onIceStateChange(this_obj.pc, e);

        };
    }

    gotRemoteStream(e, this_obj) {
        if (this_obj.remoteVideo.srcObject !== e.streams[0]) {
            this_obj.remoteVideo.srcObject = e.streams[0];
            trace('pc2 received remote stream');
        }
    }

    setRemoteDesc(pc, desc) {
       trace('setRemoteDescription start');
        let this_obj = this;

       this.pc.setRemoteDescription(desc).then(
            function () {
                this_obj.rtc_params['rem_desc'] = this_obj.pc.remoteDescription;
                if(!this_obj.rtc_params['loc_cand'])
                    this_obj.pc.createAnswer().then(
                        desc=>this_obj.onCreateAnswerSuccess(this_obj,desc),
                        this_obj.onCreateSessionDescriptionError
                    );

                this_obj.onSetRemoteSuccess(this_obj.pc);
            },
           this_obj.onSetSessionDescriptionError
        );
    }

    onCreateSessionDescriptionError(error) {
        trace('Failed to create session description: ' + error.toString());
    }


    onCreateAnswerSuccess(this_obj,desc) {
        trace('Answer from pc 2:\n' + desc.sdp);
        trace('pc setLocalDescription start');
        this_obj.pc.setLocalDescription(desc).then(
            function() {
                this_obj.rtc_params['loc_desc'] = this_obj.pc.localDescription;
                this_obj.onSetLocalSuccess(this_obj.pc);
            },
            this_obj.onSetSessionDescriptionError
        );
    }

    onSetLocalSuccess(pc) {
        trace(' setLocalDescription complete');
    }

    onSetRemoteSuccess(pc) {
        trace(' setRemoteDescription complete');

    }

    onSetSessionDescriptionError(error) {
        trace('Failed to set session description: ' + error.toString());
    }


    onIceCandidate(ev) {
        let this_obj = this;
        let par = {};
        par.proj = 'vr';
        par.func = 'rem_params';
        par.uid = this.uid;
        par.desc = this.rtc_params['loc_desc'];
        par.cand = ev.candidate;
        this.signch.SendParamsWaitingAnswer(par, this, function (data) {
            trace(data);
        });

        trace(' ICE candidate: \n' + (event.candidate ?
                event.candidate.candidate : '(null)'));
    }

    onAddIceCandidateSuccess(pc) {
        trace(' addIceCandidate success');

    }

    onAddIceCandidateError(pc, error) {
        trace(' failed to add ICE Candidate: ' + error.toString());
    }

    onIceStateChange(pc, event) {
        if (pc) {
            trace(' ICE state: ' + pc.iceConnectionState);
            trace('ICE state change event: ', event);
        }
    }

    hangup() {
        trace('Ending call');
       this.pc.close();
       this.pc = null;
    }
}


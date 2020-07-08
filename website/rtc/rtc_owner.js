'use strict';
export {RTCOwner}

import {SignalingChannel} from './signalingChannel.js';
const urlencode = require('urlencode');
var md5 = require('js-md5')
const utils = require('../utils/utils');
// require("./lib/common.js")

$(document).on('readystatechange', function () {

    if (document.readyState !== 'complete') {
        return;
    }

    let owner = new RTCOwner();
    owner.start();
});

class RTCOwner{

    constructor() {

        this.client;
        this.uid;
        this.pc;
        this.rtc_params = {};
        this.localAudio = document.getElementById('localAudio')?document.getElementById('localAudio'):'';
        this.localVideo = document.getElementById('localVideo')?document.getElementById('localVideo'):'';
        this.remoteVideo = document.getElementById('remoteVideo')?document.getElementById('remoteVideo'):'';
        this.localStream;
        this.startTime;
        this.callButton = document.getElementById('callButton');

        this.signch = new SignalingChannel();

        this.sender;

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

        trace('Requesting local stream');
        let this_obj = this;
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        })
            .then(stream => this_obj.gotStream(stream, this_obj))
            .catch(function (e) {
                alert('getUserMedia() error: ' + e.name);
            });

        this.uid = localStorage.getItem('rtc_client_1')?localStorage.getItem('rtc_client_1'):md5(JSON.stringify(new Date()));
        localStorage.setItem('rtc_client_1', this.uid);

        let pc_config = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

        this.pc = new RTCPeerConnection(pc_config);

    }

    gotStream(stream, this_obj) {
        trace('Received local stream');
        if(this_obj.localVideo)
            this_obj.localVideo.srcObject = stream;
        if(this_obj.remoteVideo)
            this_obj.remoteVideo.srcObject = stream;
        this_obj.localStream = stream;
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

        this.localStream.getTracks().forEach(
            function (track) {
                this_obj.sender = this_obj.pc.addTrack(
                    track,
                    this_obj.localStream
                );
            }
        );

        var videoTracks = this.localStream.getVideoTracks();
        var audioTracks = this.localStream.getAudioTracks();

        if (videoTracks.length > 0) {
            trace('Using video device: ' + videoTracks[0].label);
        }
        if (audioTracks.length > 0) {
            trace('Using audio device: ' + audioTracks[0].label);
        }
        //
        trace('Added local stream to pc');

        trace('pc createOffer start');
        this.pc.createOffer(
            this_obj.offerOptions
        ).then(
            desk=>this_obj.onCreateOfferSuccess(desk,this_obj),
            this_obj.onCreateSessionDescriptionError
        );

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

    setRemoteDesc(pc, desc) {
       trace('setRemoteDescription start');
       let this_obj = this;
       this.pc.setRemoteDescription(desc).then(
            function () {
                this_obj.onSetRemoteSuccess(this_obj.pc);
            },
           this_obj.onSetSessionDescriptionError
        );
/*
        this.localStream.getTracks().forEach(
            function (track) {
                if(this_obj.sender)
                    this_obj.pc.removeTrack(this_obj.sender);
                this_obj.sender = this_obj.pc.addTrack(
                    track,
                    this_obj.localStream
                );
            }
        );*/
    }

    onCreateSessionDescriptionError(error) {
        trace('Failed to create session description: ' + error.toString());
    }

    onCreateOfferSuccess(desc,this_obj) {
        trace('Offer from pc' + desc.sdp);
        trace('pc setLocalDescription start');
        this_obj.pc.setLocalDescription(desc).then(
            function () {
                this_obj.rtc_params['loc_desc'] = this_obj.pc.localDescription;
                this_obj.onSetLocalSuccess(this_obj.pc);
            },
           this.onSetSessionDescriptionError
        );

        trace('setRemoteDescription start');
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
        this.signch.SendParamsWaitingAnswer(par,this, function (data) {
            for(let key in data) {
                try {
                    this_obj.rtc_params['rem_desc'] = data[key].rem_desc;
                    this_obj.setRemoteDesc(this_obj.pc, data[key].rem_desc);
                    this_obj.rtc_params['rem_cand'] = data[key].rem_cand;
                    this_obj.pc.addIceCandidate(data[key].rem_cand);
                }catch(ex){
                    trace(ex);
                }
            }
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


'use strict';
export {Peer};
import {getParameterByName, log} from '../utils'

class Peer{

    constructor(rtc, pc_config, pc_key){

        this.con = new RTCPeerConnection(pc_config);
        this.rtc = rtc;
        this.pc_key = pc_key;

        this.params = {};
        this.localStream;

        this.network;
        this.sender;


    }

    SendOffer() {

        let that = this;
        let par = {};
        par.proj = 'rtc';
        par.func = 'offer';
        par.role = this.rtc.role;
        par.uid = this.rtc.uid;
        par.email = this.rtc.email.from;
        par.desc = this.params['loc_desc'];
        par.cand = this.params['loc_cand'];
        par.status = 'offer';
        par.trans = that.pc_key;

        if(that.rtc.DC && that.rtc.DC.dc.readyState==='open'){
            that.rtc.DC.SendData(par);
        }else {
            this.signch.SendRequest(par);
        }
    }

    SendCall(email) {

        let that = this;
        let par = {};
        par.proj = 'rtc';
        par.func = 'call';
        par.role = this.rtc.role;
        par.email = email;
        par.uid = this.rtc.uid;
        par.desc = this.params['loc_desc'];
        par.cand = this.params['loc_cand'];
        par.status = 'call';
        par.trans = that.pc_key;

        if(that.rtc.DC && that.rtc.DC.dc.readyState==='open'){
            that.rtc.DC.SendData(par);
        }else {
            this.signch.SendRequest(par);
        }
    }

    StartEvents(){
        let that = this;
        this.con.ontrack  = function (ev) {
            if(that.pc_key=== 'reserve'){
                return;
            }
            if (that.rtc.remoteAudio.srcObject !== ev.streams[0]) {
                that.rtc.remoteStream = ev.streams[0];
                //log('pc2 received remote stream', that);
                $(that.rtc.remoteStream).on('addtrack',function (ev) {
                    //log('addtrack in remote stream', that);
                });
                if(that.rtc.remoteStream) {
                    if(that.rtc.offerOptions.offerToReceiveAudio===1) {
                        that.rtc.remoteAudio.srcObject = that.rtc.remoteStream;
                    }
                    if(that.rtc.offerOptions.offerToReceiveVideo===1){

                        $(that.rtc.remoteVideo)[0].srcObject = that.rtc.remoteStream;
                        $("#video_container").css('display','block');
                        $(that.rtc.addVideo).css('visibility','hidden');
                        $(that.rtc.remoteVideo).on('click',function (ev) {
                            $(this).css('z-index',10);
                            $('#browser_container').css('z-index',9);
                        })
                    }
                }
            }
        }

        this.con.onicecandidate =  (e)=> {
            if(!this.params['loc_cand']) {
                this.params['loc_cand']= e.candidate;
                this.onIceCandidate(e);
            }
        };
        this.con.oniceconnectionstatechange = function(e) {
            that.rtc.onIceStateChange(that,e);
        };

    }

    onIceCandidate(ev) {
        let that = this;
        that.SendOffer();
    }


    onCreateAnswerSuccess(desc) {
        let that = this;
        log('Answer from pcPull 2:\n'/* + desc.sdp*/, this);
        log('setLocalDescription start', that);
        that.con.setLocalDescription(desc).then(
            function() {
                that.params['loc_desc'] = that.con.localDescription;
                //log('onSetLocalSuccess', that);
                if(that.params['loc_desc'] && that.params['loc_cand']) {
                   that.SendOffer();
                }
            },
            that.onSetAnswerError
        );
    }

    setRemoteDesc(desc) {

        let that = this;
        log('setRemoteDescription start', that);
        this.con.setRemoteDescription(desc).then(
            function () {
                that.params['rem_desc'] = that.con.remoteDescription;
                if(!that.params['loc_cand'])
                    that.con.createAnswer().then(
                        desc=>that.onCreateAnswerSuccess(desc),
                        that.onCreateAnswerError
                    );
            },
            that.onSetRemoteDescriptionError
        );
    }

    onCreateAnswerError(error) {
        log('Failed to create answer: ' + error.toString(), this);
    }

    onSetRemoteDescriptionError(error) {
        log('Failed to set remote description: ' + error.toString(), this);
    }
    onCreateOfferSuccess(desc) {
        let that = this;
        log('Offer created' /* + desc.sdp*/, that);
        log('setLocalDescription start', that);

        this.con.setLocalDescription(desc).then(
            function () {
                that.params['loc_desc'] = that.con.localDescription;
                log(' setLocalDescription complete', that);
                if(that.params['loc_cand']) {
                    that.onIceCandidate();
                }
            },
            this.onSetOfferError
        );

        log('setRemoteDescription start', that);
    }

    onSetOfferError(error) {
        log('Failed to set offer: ' + error.toString(), this);
    }


    onSetAnswerError(error) {
        log('Failed to set session description: ' + error.toString(), this);
    }

    onAddIceCandidateSuccess(pc) {
        log(' addIceCandidate success', this);

    }

    onAddIceCandidateError(pc, error) {
        log(' failed to add ICE Candidate: ' + error.toString(), this);
    }

    onCreateOfferError(error) {
        log('Failed to create session description: ' + error.toString(), this);
    }

    onAddVideo(ev) {
        let that = this;
        let msg = "Do you mind to turn on the cameras?";
        //log("Send message to confirm:"+msg, that);
        if (that.rtc.DC  && that.rtc.DC.dc.readyState==='open') {
            that.rtc.DC.SendData({'confirm': msg});
        }
    }

    Cancel(){
        this.close();
    }

}
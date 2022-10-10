'use strict';
export {Peer};
import {getParameterByName, log} from './utils'

class Peer{

    constructor(rtc, pc_config, pc_key){

        this.con = new RTCPeerConnection(pc_config);
        this.rtc = rtc;
        this.pc_key = pc_key;
        this.params = {};
    }

    SendDesc(desc,cb) {

        let that = this;
        let par = {};
        par.proj = 'rtc';
        par.func = 'call';
        par.trans = that.rtc.trans;
        par.role = this.rtc.role;
        par.em = this.rtc.em;
        par.uid = this.rtc.uid;
        par.desc = desc;//.sdp.replace(/max-message-size:([0-9]+)/g, 'max-message-size:'+262144+'\r\n');
        par.status = 'call';
        par.abonent = this.rtc.abonent;
        par.oper_uid = this.rtc.oper_uid;

        this.rtc.signch.SendMessage(par,function () {
            cb();
        });

    }

    SendCand(cand,cb) {

        let that = this;
        let par = {};
        par.proj = 'rtc';
        par.func = 'call';
        par.role = this.rtc.role;
        par.uid = this.rtc.uid;
        par.em = this.rtc.em;
        par.cand = cand;
        par.status = 'call';
        par.trans = that.rtc.trans;
        par.abonent = this.rtc.abonent;
        par.oper_uid = this.rtc.oper_uid;

        this.rtc.signch.SendMessage(par,function () {
            cb();
        });

    }

    SendOffer(cb) {

        let that = this;
        let par = {};
        par.proj = 'rtc';
        par.func = 'offer';
        par.trans = that.rtc.trans;
        par.role = this.rtc.role;
        par.uid = this.rtc.uid;
        par.em = this.rtc.em;
        par.desc = this.params['loc_desc'];//.sdp.replace(/max-message-size:([0-9]+)/g, 'max-message-size:'+262144+'\r\n');
        par.cand = this.params['loc_cand'];
        par.status = 'offer';

        par.abonent = this.rtc.abonent;

        this.rtc.signch.SendMessage(par,function () {
            cb();
        });

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
                $(that.rtc.remoteStream).on('addtrack', function (ev) {
                    log('addtrack in remote stream', that);
                });
            }

            if(that.rtc.remoteStream) {
                if(ev.track.kind==='audio') {

                    that.rtc.remoteAudio.srcObject = null;
                    that.rtc.remoteAudio.srcObject = that.rtc.remoteStream;
                }
                if(ev.track.kind==='video'){
                    that.rtc.remoteVideo.srcObject = null;
                    that.rtc.remoteVideo.srcObject = that.rtc.remoteStream;
                    that.rtc.remoteVideo.style.display = 'block';

                    //window.frameElement.style.height = '330px';
                    $('.callButton').attr('status','talk');

                    that.rtc.localSound.muted = true;
                    that.rtc.DC.SendDCVideoOK(()=>{});

                    $(that.rtc.remoteVideo).on('click',function (ev) {

                    })
                }
            }

        }

        let timr;
        if(that.rtc.role==='operator') {
            this.con.onicecandidate = (e) => {
                let that = this;
                if (e.candidate) {
                    if (!this.params['loc_cand'])
                        this.params['loc_cand'] = [];
                    this.params['loc_cand'].push(e.candidate);
                    if (timr)
                        clearTimeout(timr);
                    timr = setTimeout(() => {
                        if (this.rtc.DC && this.rtc.DC.dc.readyState === 'open') {
                            let msg = '';
                            if (this.rtc.type && this.rtc.type.offerToReceiveVideo === 1)
                                msg = {confirm: "Do you mind to turn on the cameras?"};
                            this.rtc.DC.SendDCOffer(that.pc_key, msg);
                        } else {
                            this.SendOffer(function () {
                                this.rtc.pcPull['all'].params['loc_cand']='';
                                this.rtc.pcPull['all'].params['loc_desc']='';
                            });
                        }

                    }, 500)
                }
            };
        }else if (that.rtc.role==='user'){
            this.con.onicecandidate =  (e)=> {
                let that = this;
                if(e.candidate) {
                    if(!this.params['loc_cand'])
                        this.params['loc_cand'] = [];
                    this.params['loc_cand'].push(e.candidate);

                    if(this.rtc.DC && this.rtc.DC.dc.readyState==='open'){
                        let msg='';
                        if(this.rtc.type && this.rtc.type.offerToReceiveVideo===1)
                            msg = {confirm: "Do you mind to turn on the cameras?"};
                        this.rtc.DC.SendDCCand(e.candidate,that.pc_key, msg);
                    }else{
                        this.SendCand(e.candidate,function () {

                        });
                    }
                }
            };
        }
        this.con.oniceconnectionstatechange = function(e) {
            that.rtc.onIceStateChange(that,e);
        };
        this.con.onremovestream = function(e) {

        };
        this.con.onsignalingstatechange= function(e) {

        };
        this.con.onconnectionstatechange= function(e) {
            console.log();
        };

    }


    onCreateAnswerSuccess(desc) {
        let that = this;
        log('Answer from pcPull 2:'/* + desc.sdp*/, this);
        log('setLocalDescription start', that);
        that.con.setLocalDescription(desc).then(
            function() {
                that.params['loc_desc'] = that.con.localDescription;
                log('onSetLocalDescriptionSuccess', that);
                that.SendDesc(desc,function () {

                });
            },
            that.onSetAnswerError
        );
    }

    setRemoteDesc(desc) {

        let that = this;
        log('setRemoteDescription start', that);
        log('Peer connectionState:'+this.con.connectionState, that);

        this.con.setRemoteDescription(desc).then(
            function () {
                that.params['rem_desc'] = that.con.remoteDescription;
                if (that.con.remoteDescription.type === 'offer') {
                    that.con.createAnswer().then(
                        desc => that.onCreateAnswerSuccess(desc),
                        that.onCreateAnswerError
                    );
                }
            },
            function (error) {
                log('Failed to set remote description: ' + error.toString(), this);

            }
        );
    }

    onCreateAnswerError(error) {
        log('Failed to create answer: ' + error.toString(), this);
    }

    onCreateOfferSuccess(desc) {
        let that = this;
        log('Offer created' /* + desc.sdp*/, that);
        log('setLocalDescription start', that);

        that.con.setLocalDescription(desc).then(
            function () {
                that.params['loc_desc'] = that.con.localDescription;
                log(' setLocalDescription complete', that);
                // if(that.params['loc_cand'] && that.params['loc_cand'][0]) {
                //      that.SendOffer();
                // }
            },
            that.onSetOfferError
        );
    }

    onCreateVideoOfferSuccess(desc, msg) {
        let that = this;
        log('Offer created' /* + desc.sdp*/, that);
        log('setLocalDescription start', that);

        that.con.setLocalDescription(desc).then(
            function () {
                that.params['loc_desc'] = that.con.localDescription;
                log(' setLocalDescription complete', that);
                that.rtc.DC.SendDCDesc(desc,that.pc_key);
           },
            that.onSetOfferError
        );
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

    onCreateSessionDescriptionError(ev){

    }

    Cancel(){
        this.close();
    }

}


// WEBPACK FOOTER //
// rtc/Peer.js


//////////////////
// WEBPACK FOOTER
// ./src/Peer.js
// module id = 343
// module chunks = 0
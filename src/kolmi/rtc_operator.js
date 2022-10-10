'use strict';
export {RTCOperator}


import {SignalingChannel} from './signalingChannel.js';
import {RTCBase} from "./rtc_base";

import {log} from './utils'
//


var crypto = require('crypto');
function md5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}



class RTCOperator extends RTCBase{

    constructor(trans,role, em, uid) {
        super(trans,role,em, uid);

        this.checking_tmr;

        this.remoteAudio = $('.remoteAudio')[0]?$('.remoteAudio')[0]:'';
        this.localSound =  $('.localSound')[0]?$('.localSound')[0]:'';
        this.localVideo =  $('.localVideo')[0]?$('.localVideo')[0]:'';
        this.remoteVideo =  $('.remoteVideo')[0]?$('.remoteVideo')[0]:'';
        this.remoteVideo.id = "remoteVideo_"+uid;

        $('.callButton').attr('status','inactive');
        $('.callObject').css('display', 'block');

        $('.fa-spinner').css('display','none');

        this.EventsHandlers();
    }

    Init(cb){
        let that = this;

        if(!this.signch) {
            this.signch = new SignalingChannel(host_ws);
        }

        this.type = '';
        let transAr=[that.trans];
        that.main_pc = '';
        for (let i in transAr) {
            that.InitRTC(transAr[i],function () {
                cb();
            });
        }
    }


    SendOffer(key) {

        let that = this;

        try {
            // Fix up for prefixing
            window.AudioContext = window.AudioContext||window.webkitAudioContext;
            let audioCtx = new AudioContext();
            window.user.localSoundSrc = audioCtx.createMediaElementSource(window.user.localSound );
            window.user.localSoundSrc.connect(audioCtx.destination);
        }
        catch(e) {
            log('Web Audio API is not supported in this browser');
        }

        that.pcPull[key].params['loc_desc'] = '';
        that.pcPull[key].params['loc_cand'] = '';

        //log('pcPull createOffer start', that);
        that.pcPull[key].con.createOffer(this.type=
            {
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 0,
                iceRestart:1
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


    EventsHandlers() {
        super.EventsHandlers();
        let that = this;

        window.addEventListener("message", function (e) {

            if (JSON.parse(e.data)['onclose'] === 'profile') {

            }
        });


        $('.callButton').longTap(function (ev) {
            $("[data-toggle='dropdown']").dropdown("toggle");
            $(".dropdown-item").off('click');
            $(".dropdown-item").on('click', function (ev) {

                if (ev.target.id === 'trans_file') {
                    if (that.DC)
                        that.TransFile();
                }
            })
        });



        $('.callButton').on('click touchstart', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if (that.role === 'operator') {

                if ($(ev.target).attr('status') === 'inactive') {

                    that.Init(function () {
                        if (that.pcPull['all'].con.signalingState !== 'closed') {

                            that.GetUserMedia({audio: 1, video: 0}, function (res) {
                                if (res) {
                                    if ($(ev.target).attr('status') === 'inactive') {
                                        that.SendOffer('all');
                                        $(ev.target).attr('status', 'active');
                                    }
                                }

                            });
                        }
                    });

                } else if ($(ev.target).attr('status') === 'active') {

                    $(ev.target).attr('status', 'inactive');
                    that.RemoveTracks();
                    //if (that.signch.ws.readyState === 1)
                    //    that.signch.ws.close();
                    // that.signch = null;

                    if (that.DC) {
                        that.DC.dc.close();
                        //that.DC = null
                    }

                    that.SendStatus('close');


                } else if ($(ev.target).attr('status') === 'call') {

                    $(ev.target).attr('status', 'talk');
                    $(that.remoteAudio).prop('muted', false);
                    $(that.localSound).prop('muted', true);
                    // $('.call_text').css('display', 'none');

                    if (that.DC) {
                        that.DC.SendDCTalk();
                        clearInterval(that.DC.inter);
                    }

                    that.SendStatus('talk');


                    $('i.video').css('display', 'inline-block');

                    $('i.video').on('click', () => {
                        $('i.video').off('click');
                        that.localSound.muted = 'true';
                        $(that.localVideo).css('display', 'inline-block');
                        if (that.DC.dc.readyState === 'open') {
                            that.GetUserMedia({video: 1}, function () {
                                that.SendVideoOffer(that.main_pc);
                            });
                        }
                    });

                } else if ($(ev.target).attr('status') === 'talk') {

                    $(ev.target).attr('status', 'inactive');
                    if (that.DC)
                        clearInterval(that.DC.inter);
                    that.RemoveTracks();
                    $('i.video').css('display', 'none');
                    that.localVideo.style.display = 'none';
                    that.remoteVideo.style.display = 'none';
                    if (that.DC)
                        that.DC.SendDCHangup(() => {

                        });
                    //that.SendStatus('close');

                    $(ev.target).trigger('click');


                    //TODO:$('#addVideo',$('.browser')[0].contentWindow.document).css('display', 'none');

                }
            }

        });
    }

    OnMessage(data) {

        let that = this;

        log(data,that);

        if (window.user.role === 'operator') {
             if (data.operators) {
                if (data.operators[that.uid] && data.operators[that.uid].role === "operator") {
                    if (data.operators[that.uid].status === 'offer') {
                        $('.callObject').css('display', 'block');
                        $('.callButton').attr('status','active');
                    }
                    if (data.operators[that.uid].status === 'close') {
                        $('.callObject').css('display', 'none');
                        $('.callButton').attr('status','inactive');
                    }
                }
            }

            if (data.func === 'mute') {

                $(that.remoteAudio).prop('muted', true);
                $(that.localSound).prop('muted', true);
                $('video').css('display','none');
                $('i.video').css('display','none');
                // $('.call_text').css('display','none');

                $('.callButton').attr('status','inactive');
                if(that.DC)
                    clearInterval(that.DC.inter);
                that.RemoveTracks();
                $('i.video').css('display','none');
                that.localVideo.style.display = 'none';
                that.remoteVideo.style.display = 'none';
                if(that.DC)
                    that.DC.SendDCHangup(() => {

                    });
                //that.SendStatus('close');

                $('.callButton').trigger('click');

            }

            if (data.func === 'talk') {
                $('.callButton').attr('status','talk');
                $(that.remoteAudio).prop('muted', false);
                $(that.localSound).prop('muted', true);
                $('i.video').css('display','inline-block');
                // $('.call_text').css('display','none');

                $('i.video').on('click',()=> {
                    $('i.video').off('click');
                    that.localSound.muted= 'true';
                    $(that.localVideo).css('display','inline-block');
//                        $('i.video').replaceWith(that.localVideo);
                    if(that.DC.dc.readyState === 'open') {
                        that.GetUserMedia({video:1}, function () {
                            that.SendVideoOffer(that.main_pc);
                        });
                    }
                });
                clearInterval(that.DC.inter);
            }


            if (data.call || data.func === 'call') {
                log("received call: " + data.call + " from " + that.role, that);

                $('.remoteAudio').prop('muted', true);
                $('.localSound').prop('muted', false);
                $('.localSound')[0].play();

                $('.callButton').attr('status','call');
                // $('.call_text').css('display','block');

                that.remoteVideo.srcObject = null;
                that.remoteVideo.style.display = 'block';
                that.remoteVideo.style.top = '70px';
                if(data.profile) {
                    let avatar = JSON.parse(data.profile).avatar;
                    that.remoteVideo.poster = avatar;
                    let date_str = new Date().toLocaleString("es-CL");
                    let txt = date_str +' Вызов от '+JSON.parse(data.profile).name;
                    $(".call_text")[0].innerHTML += '<div>'+txt+'<div/>';
                }

            }
        }

        if (data.func === 'video') {

        }

        if (data.camera) {

            that.localVideo.attr('src', that.localStream);

        }

        if (data.desc) {
            if(that.pcPull[data.trans].con.connectionState==="failed")
                that.pcPull[data.trans].con.restartIce();

            if (that.pcPull[data.trans]) {
                that.pcPull[data.trans].params['rem_desc'] = data.desc;
                that.pcPull[data.trans].setRemoteDesc(data.desc);
            }
        }
        if (data.cand) {
            if (that.pcPull[data.trans]) {
                if (that.pcPull[data.trans].con.signalingState === 'closed') {
                    return;
                }
                try {
                    that.pcPull[data.trans].params['rem_cand'] = data.cand;
                    if (Array.isArray(data.cand)) {
                        for (let c in data.cand) {
                            that.pcPull[data.trans].con.addIceCandidate(data.cand[c]);
                            //log(' Remote ICE candidate: \n' + (data.cand[c] ? JSON.stringify(data.cand[c]) : '(null)'), that);
                        }
                    } else {
                        that.pcPull[data.trans].con.addIceCandidate(data.cand);
                        //log(' Remote ICE candidate: \n' + (data.cand ? JSON.stringify(data.cand) : '(null)'), that);
                    }


                } catch (ex) {
                    log(ex);
                }
            }
        }
    }


}




// WEBPACK FOOTER //
// rtc/rtc_operator.js


//////////////////
// WEBPACK FOOTER
// ./src/rtc_operator.js
// module id = 176
// module chunks = 0
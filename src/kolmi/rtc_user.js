'use strict';


import {RTCBase} from "./rtc_base";
import {getParameterByName, log} from './utils'


import {log} from './utils'

require('bootstrap');

export class RTCUser extends RTCBase{


    constructor(trans,role, em, uid) {
        super(trans,role, em, uid);
        let that = this;
        this.abonent = getParameterByName('abonent');

        this.checking_tmr;

        this.remoteAudio = $('.remoteAudio')[0]?$('.remoteAudio')[0]:'';
        this.localSound =  $('.localSound')[0]?$('.localSound')[0]:'';
        this.localVideo =  $('.localVideo')[0]?$('.localVideo')[0]:'';
        this.remoteVideo =  $('.remoteVideo')[0]?$('.remoteVideo')[0]:'';
        this.remoteVideo.id = "remoteVideo_"+uid;

        this.Init(() => {
            $('.callButton').attr('status','inactive');
            $('.fa-spinner').css('display','none');
        });

        this.SendCheck();

        this.EventsHandlers();
    }



    Init(cb){
        let that = this;
        this.type = '';
        let transAr=[/*'relay',*/this.trans];
        that.main_pc = '';
        for (let i in transAr) {
            that.InitRTC(transAr[i],function () {
                cb();
            });
        }
    }

    Call(){
        let that = this;
        this.GetUserMedia({audio: 1, video: 0}, function () {
            $('.browser_container').css('display', 'none');
            $('.remoteVideo').css('display', 'none');
            $(that.remoteAudio).prop('muted', true);
            $(that.localSound).prop('muted', false);
            $(that.localSound)[0].play();

            let par = {};
            par.proj = 'rtc';
            par.func = 'call';
            par.status = 'call';
            par.role = that.role;
            par.trans = that.trans;
            par.em = that.em;
            par.uid = that.uid;
            par.abonent = that.abonent;

            that.signch.SendMessage(par);
        });
    }

    EventsHandlers() {
        super.EventsHandlers();
        let that = this;

        function openProfile(id) {
            let signin_obj =
                '<OBJECT id="user_profile" class="row" data="../kolmi/html/signin.html?uid=' + id + '&v=4">' +
                'Warning: signin.html could not be included.' +
                '</OBJECT>';

            parent.postMessage(JSON.stringify({append: signin_obj}), "*");
        }

        function RedirectCall() {
            $(window.parent.document).contents().find('.kolmi_operator')
        }

        $('.callButton').longTap(function (ev) {
            $("[data-toggle='dropdown']").dropdown("toggle");
            $(".dropdown-item").off('click');
            $(".dropdown-item").on('click', function (ev) {
                if (ev.target.id === 'redirect_call') {
                    RedirectCall(ev.target.id);
                }
                if (ev.target.id === 'open_profile') {
                    openProfile(ev.target.id);
                }
                if (ev.target.id === 'trans_file') {
                    that.TransFile(ev.target.id);
                }
            })
        });

        window.addEventListener("message", function (e) {
            if (JSON.parse(e.data)['onclose'] === 'profile') {
                that.Call();
            }
        });

        $('.callButton').on('click touchstart', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            try {
                // Fix up for prefixing
                if (!window.AudioContext) {
                    window.AudioContext = window.AudioContext || window.webkitAudioContext;
                    let audioCtx = new AudioContext();
                    window.user.localSoundSrc = audioCtx.createMediaElementSource(window.user.localSound);
                    window.user.localSoundSrc.connect(audioCtx.destination);
                }
            }
            catch (e) {
                log('Web Audio API is not supported in this browser');
            }

            if ($(ev.target).attr('status') === 'inactive' || $(ev.target).attr('status') === 'active') {
                if (!localStorage.getItem('kolmi_abonent'))
                    openProfile(window.id);
                else {
                    that.Call();
                }

            } else if ($(ev.target).attr('status') === 'call') {
                $(ev.target).attr('status', 'active');
                $(that.remoteAudio).prop('muted', true);
                $(that.localSound).prop('muted', true);


                if (that.DC) {
                    clearInterval(that.DC.inter);
                    that.DC.SendDCHangup(function () {

                    });
                    that.Init(() => {
                        that.SendCheck();
                    });
                }

            } else if ($(ev.target).attr('status') === 'talk') {
                $(ev.target).attr('status', 'inactive');
                that.RemoveTracks();
                $(this.localSound).prop('muted', true);
                $('video').css('display', 'none');
                $('i.video').css('display', 'none');
                if (that.DC) {
                    clearInterval(that.DC.inter);
                    that.DC.SendDCHangup(function () {

                    });
                    that.Init(() => {
                        that.SendCheck();
                    });
                }

                //TODO:$('#addVideo',$('.browser')[0].contentWindow.document).css('display', 'none');
                //$(that.remoteVideo)[0].srcObject = null;
                $('.browser_container').css('display', 'none');
                $('.remoteVideo').css('display', 'none');
            }

        });
    }


    OnMessage(data) {

        let that = this;

        log(data,that);

        if (window.user.role === 'user') {

            let that = this;

            if (data.status === 'close') {

                $('.callButton').attr('status','inactive');

            }else if(data.status === 'wait'){
                $('.callButton').attr('status','call');
            }

            if (data.operators) {
                if (data.operators[that.abonent] &&
                    data.operators[that.abonent].trans=== that.trans) {
                    if (data.operators[that.abonent].status === 'offer') {
                        // $('.callObject').css('display', 'block');
                        $('.callButton').attr('status','active');
                        that.pcPull[data.operators[that.abonent].trans].params['rem_desc'] = data.operators[that.abonent].desc;
                        that.pcPull[data.operators[that.abonent].trans].params['rem_cand'] = data.operators[that.abonent].cand;
                    }
                    else if (data.operators[that.abonent].status === 'close'
                        // && data.operators[that.abonent].uid ===that.oper_uid
                    ) {
                        // $('.callObject').css('display', 'none');
                        $('i.video').css('display', 'none');
                        that.remoteVideo.style.display = 'none';
                        $(that.remoteAudio).prop('muted', true);
                        $(that.localSound).prop('muted', true);
                        if(that.DC)
                            clearInterval(that.DC.inter);
                        that.RemoveTracks();

                        $('.callButton').attr('status','inactive');

                        // that.SendStatus('close');

                    }
                }

            }

            if (data.operator && data.operator.em === that.abonent) {

                // $('.callObject').css('display', 'block');
                if($('.callButton').attr('status')==='inactive')
                    $('.callButton').attr('status','active');
                that.pcPull[data.operator.trans].params['rem_desc'] = data.operator.desc;
                that.pcPull[data.operator.trans].params['rem_cand'] = data.operator.cand;
            }

            if (data.func === 'mute') {

                $(that.remoteAudio).prop('muted', true);
                $(that.localSound).prop('muted', true);
                if(that.DC)
                    clearInterval(that.DC.inter);
                that.RemoveTracks();
                $('i.video').css('display','none');
                that.localVideo.style.display = 'none';
                that.remoteVideo.style.display = 'none';
                if(that.DC) {
                    that.DC.dc.close();
                    that.DC = null;
                }

                $('.callButton').attr('status', 'inactive');

                that.InitRTC('all',function () {

                });

                that.SendCheck();
            }

            if (data.func === 'talk') {
                $('.callButton').attr('status','talk');
                $(that.remoteAudio).prop('muted', false);
                $(that.localSound).prop('muted', true);
                $('i.video').css('display','inline-block');

                //window.parent.$.closest('img.kolmi').parent().append(that.remoteVideo);

                $('i.video').on('click',()=> {
                    $('i.video').off('click');
                    that.localSound.muted= 'true';
                    $(that.localVideo).css('display','inline-block');
//                        $('i.video').replaceWith(that.localVideo);
                    if(that.DC.dc.readyState === 'open') {

                        that.GetUserMedia({audio:0,video:1}, function () {
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

                //window.user.localSound.play();
                $('.callButton').attr('status','call');

                //window.parent.$('img.kolmi').parent().append(that.remoteVideo);

                that.remoteVideo.srcObject = null;

                $('.callButton').attr('status','call');

            }

        }

        if (data.func === 'redirect') {

            that.abonent = data.abonent.abonent;
            that.pcPull['all'].params = data.abonent.pcPull;
            that.InitRTC('all',function () {
                that.Call();
            });
        }

        if (data.func === 'cnt') {
            // $('.callObject').css('display', 'block');
            $('.callButton').attr('status','call');
        }

        if (data.camera) {
            that.localVideo.attr('src', that.localStream);
        }

        if(data.oper_uid){
            that.oper_uid = data.oper_uid;
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
// rtc/rtc_user.js


//////////////////
// WEBPACK FOOTER
// ./src/rtc_user.js
// module id = 176
// module chunks = 0
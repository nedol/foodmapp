'use strict'
export {RTCOperator};
import {Network} from '../network.js';
import {RTCBase} from "./rtc_base";
// import {adapter} from 'webrtc-adapter'
import {DataChannelOperator} from "./DataChannelOperator";
import {DataChannelUser} from "./DataChannelUser";
//import {VideoRecorder} from "./media/recorder";
import {getParameterByName, log} from '../utils'
var crypto = require('crypto');
function md5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}
import {InitEvents} from './events'


$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        alert('В этом браузере нет поддержки EventSource.');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }
    let abonent = getParameterByName('abonent');
    $('object').each(function (i) {
        let components = this.attributes.components.value;
        let uid = md5(JSON.stringify(new Date()));
        new RTCOperator(uid,abonent,components);
    });
});



class RTCOperator extends RTCBase{

    constructor(uid,abonent,components, network) {
        super('operator');

        this.SetComponents($('object'),abonent,uid,components);

        this.uid = uid;
        localStorage.setItem('rtc_'+this.role, this.uid);
        this.video = true;

        this.email.from = abonent;

        let that = this;

        this.user;
        this.network = network;

        this.network.InitSSE(this, function () {
            if(!that.network.send_req_func) {
                let par = {};
                par.proj = 'rtc';
                par.func = 'check';
                par.uid = that.uid;
                par.role = that.role;
                par.email = that.email.from;
                par.status = 'check';
                par.trans = 'all';
                that.network.postRequest(par, function (res) {
                    that.network.send_req_func = res;
                });
            }
        });

        this.remoteAudio = $('#remoteAudio_'+uid)[0]?$('#remoteAudio_'+uid)[0]:'';
        this.localSound = $('.localSound')[0]?$('.localSound')[0]:'';
        this.localVideo = $('.localVideo')[0]?$('.localVideo')[0]:'';
        this.addVideo = $('#addVideo_'+uid)[0];
        this.remoteVideo = $('#remoteVideo_'+uid)[0]?$('#remoteVideo_'+uid)[0]:'';


        $(window).on('beforeunload', function (ev) {
            that.SendClose(that.uid);
        });

        $('#addVideo').on('click',function (ev) {
            that.onAddVideo(ev);
        });

    }

    OnLoadIFrame(email,id){
        let that = this;

        $('#'+id)[0].contentWindow.postMessage({
            email: email,
            element: '.callObject',
            style: {'visibility': 'visible', 'opacity': .5}
        }, "*");
        $('#'+id)[0].contentWindow.postMessage({
            email: email,
            element: '.callButton',
            style: {'transform': 'rotate(130deg)'}
        }, "*");
        $('#'+id)[0].contentWindow.postMessage({
            email: email,
            element: '.call-queue',
            html:'0'
        }, "*");
    }

    OnMessageIFrame(that,data) {
        if (data.func) {
            that[data.func](data);
            return;
        }
        if(data.event === 'load'){
            if(typeof that.OnLoadIFrame  === "function") {
                that.OnLoadIFrame(data.email,data.iframe);
            }
        }
        if (data.event === 'call') {

            if (data.call_cnt)
                that.call_cnt = data.call_cnt;

            if (!data.iframe.includes('_if_list')) {
                that.Init(function (that, pc_key) {

                });

            } else {

                let uid = md5(JSON.stringify(new Date()));
                // $('body').append(
                //     '<object  abonent="' + data.email + '"></object>'
                // );

                //that.iframe = data.uid;

                that.user  = new RTCUserList(data.iframe, data.email, 'audio browser video', 'Init,call');
                that.user.tr_id = data.uid;
                that.user.parent = that;
                that.user.remoteAudio = that.remoteAudio;
                that.user.remoteVideo = that.remoteVideo;
                that.AppendBrowser(data.uid);
                that.user.InitRTC(that.user.offerOptions,'all',function (that,pc_key) {
                    that.OnMessageIFrame(that,data);
                })

            }

        }else if(data.event === 'connect'){
            $('#kolmi_if_list_'+that.iframe).closest('tr').find('#browser_but_'+that.iframe).css('display','block');
        }else if(data.event === 'close'){
            that.SendClose(that.uid);
        }
    }

    Init(cb){
        let that = this;
        let transAr=['relay','all'];
        if(that.main_pc) {
            that.InitRTC(that.offerOptions, that.main_pc, that.onInitRTC);
        }else{

            for (let i in transAr) {
                setTimeout(function () {
                    if (that.pcPull[transAr[i]] && transAr[i] !== that.main_pc) {
                        that.pcPull[transAr[i]].con.close();
                        that.pcPull[transAr[i]] = null;
                        delete that.pcPull[transAr[i]];
                    }
                    that.InitRTC(that.offerOptions, transAr[i],  that.onInitRTC);
                },i*100);
            }
        }
        cb();
    }

    onInitRTC(that,pc_key) {

        $('#addVideo').off('click');
        $('#addVideo').on('click',that,that.onAddVideo);

        if(!that.pcPull[pc_key].DC && that.pcPull[pc_key].con.signalingState ==='stable') {
            that.pcPull[pc_key].DC = new DataChannelOperator(that, that.pcPull[pc_key]);//pcPull.createDataChannel("user channel");
        }

        that.GetUserMedia(function () {
            $(that.callObject).css('opacity', '1');
           //log('pcPull createOffer start', that);
            that.pcPull[pc_key].con.createOffer(
                that.offerOptions
            ).then(
                desk => that.pcPull[pc_key].onCreateOfferSuccess(desk),
                that.pcPull[pc_key].onCreateOfferError
            );

        });

    }

    CreateChannel(data, pc_key) {

        this.offerOptions.offerToReceiveVideo =0;
        this.offerOptions.iceRestart = 1;
        this.InitRTC(this.offerOptions, pc_key, function (that, pc_key) {
            that.GetUserMedia(function () {
                that.pcPull[pc_key].DC = new DataChannelOperator(that, that.pcPull[pc_key]);
                if(data.func==='request'){
                    that.pcPull[pc_key].con.createOffer(
                        that.offerOptions
                    ).then(
                        desk => that.pcPull[pc_key].onCreateOfferSuccess(desk),
                        that.pcPull[pc_key].onCreateOfferError
                    );
                }else {
                    that.OnMessage(data);
                }

            });
        });
    }


    onIceStateChange(pc, event) {
        let that = this;
        if (pc) {
            log(pc.pc_key +' ICE state: ' + pc.con.iceConnectionState, that);

            if(pc.con.iceConnectionState==='new'){
                log(pc.pc_key +' ICE state change event: new', that);
            }
            if(pc.iceConnectionState==='checking'){
                log(pc.pc_key +' ICE state change event: checking', that);

            }
            if(pc.con.iceConnectionState==='connected'){
                //hat.signch.eventSource.close();
                log(pc.pc_key +' ICE state change event: connected', that);

                $('#kolmi_if_'+that.uid)[0].contentWindow.postMessage({
                    email: that.email.from,
                    element: '#callObject_'+that.uid,
                    style: {'visibility': 'visible', 'opacity': 1}
                }, "*");
                $('#kolmi_if_'+that.uid)[0].contentWindow.postMessage({
                    email: that.email.from,
                    element: '#callButton_'+that.uid,
                    style: {'transform': 'rotate(0deg)'}
                }, "*");


                if(!that.main_pc || pc.pc_key==='all') {
                    that.main_pc = pc.pc_key;
                    InitEvents();

                }else if(pc.pc_key!=='reserve' && that.main_pc!==pc.pc_key) {
                    pc.DC = null;
                    delete that.pcPull[pc.pc_key];
                    pc.con.close();
                    log(pc.pc_key +' ICE state: closed and deleted', that);
                    return;
                }

                if(that.role==='user') {
                    pc.DC = new DataChannelUser(that, that.pcPull[pc.pc_key]);
                }

                that.DC = pc.DC;

                if(that.offerOptions.offerToReceiveVideo===1) {

                    $('#kolmi_if_'+that.uid)[0].contentWindow.postMessage({email:that.email.from,element:'.callObject',style:{'opacity':'1'}}, "*");

                    $('#addVideo',$('.browser')[0].contentWindow.document).css('display', 'none');

                }
            }

            if(pc.con.iceConnectionState==='disconnected'){
                log(pc.pc_key +' ICE state change event: disconnected', that);
                // if(pc.pc_key===that.main_pc){
                //     this.localStream.getTracks().forEach(track => {
                //         if(that.pcPull['reserve'] && that.pcPull['reserve'].signalingState==='stable')
                //         that.pcPull['reserve'].sender = that.pcPull['reserve'].addTrack(
                //             track,
                //             that.localStream)
                //     });
                //     that.remoteStream = that.pcPull['reserve'].con.getRemoteStreams()[0];
                //     if(that.remoteStream) {
                //         that.remoteAudio.srcObject = that.remoteStream;
                //         $("video_container").css('display','block');
                //     }
                //
                // }else if (pc.pc_key==='reserve'){
                //     if(that.pcPull[that.main_pc] && that.pcPull[that.main_pc].DC && that.pcPull[that.main_pc].DC.dc.readyState==='open') {
                //         //that.DC = that.pcPull[that.main_pc].rtc.DC;
                //     }
                // }else{
                //     pc = null;
                //     return;
                // }
            }

            if(pc.con.iceConnectionState==='completed'){
                log(pc.pc_key +' ICE state change event: completed', that);

            }

            if(pc.con.iceConnectionState==='failed'){
                log(pc.pc_key +' ICE state change event: failed', that);
                delete that.pcPull[pc.pc_key];
            }

        }
    }



    OnMessage(data, dc) {
        let that = this;

        if(data.check){

        }
        if(data.close){
            log('PC was deleted from server');
            that.hangup();
        }


        if(data.operators){

            for(let uid in data.operators){
                let  item = data.operators[uid];
                if(item.status==='close'){
                    $('#remoteVideo_list_'+uid).closest('tr').remove();
                    return;
                }
                if(item.status==='busy'){
                    $('iframe#kolmi_if_list_'+uid).css('visibility','hidden');
                    return;
                }

                let iframe = (item.status==='offer' && that.email.from!==item.email)?'' +
                    '<iframe id="kolmi_if_list_'+uid+'" uid="'+uid+'" src="'+that.path+'user.ru.html?uid='+uid+'&iframe=kolmi_if_list_'+ uid +'&abonent='+item.email+'"'+
                    'style="width: 40px' +
                    ';height:40px;z-index: 100" frameborder="0" scrolling="no"></iframe>':'';
                let str =
                    '\n<tr>'+
                    '\n   <td>'+uid+'</td>' +
                    '\n   <td>'+item.email+'</td>' +
                    '\n   <td><video id="remoteVideo_list_'+uid+'"  autoplay muted   poster="https://nedol.ru/rtc/img/person.png"' +
                    '      style="width:40px;height:40px;"></video></td>' +
                    '\n   <td>'+iframe+'</td>'+
                    '\n   <td><button  id="forward_but_list_' + uid + '" src="" style="display:none;position:absolute;width:5%;height:7%;"></button></td>'+
                    '\n   <td><button  id="browser_but_list_' + uid + '" src="" style="display:none;position:absolute;width:5%;height:7%;"></button></td>'+
                    '\n   <td><button  id="addVideo_list_' + uid + '" title="Выслать запрос на включение камеры" src="" style="display:none;position:absolute;width:5%;height:7%;"></button></td>'+
                    '\n</tr>\n';


                if(item.status==='main'){
                    return;//TODO:
                }

                if($('#remoteVideo_list_'+uid)[0]) {
                    //if is already on the table
                    $('#remoteVideo_list_'+uid).closest('tr')[0].outerHTML = str;
                }else {
                    $('#operators_table').find('tbody').append(str);
                }

            };

        }

        if(data.call) {
            log("received call: " + data.call + " from " + that.role, that);

            $('#remoteAudio_'+that.uid).prop('muted', true);
            $('#localSound_'+that.uid).prop('muted', false);
            $('#localSound_'+that.uid)[0].play();

            let cnt_call = 0;
            let inter = setInterval(function () {
                cnt_call++;
                $(that.call_cnt).html(String(data.call-cnt_call));
                if (cnt_call === data.call) {
                    clearInterval(inter);
                    if (that.DC.dc.readyState==='open') {
                        that.DC.SendData({'res': 'OK'});
                    }
                    that.AppendBrowser(that.uid);
                    $("#browser_container_"+that.uid).find('.browser')[0].contentWindow.postMessage({email:that.email.from,element:'#addVideo',style:{display:'inline-block'}},'*');
                    $('#remoteAudio_'+that.uid).prop('muted', false);
                    $('#localSound_'+that.uid).prop('muted', true);

                    $("#browser_but_" + that.uid).css('display', 'block');
                    $('#browser_but_' + that.uid).on('click', that, function (ev) {
                        InitEvents();
                        that.OpenBrowser(ev);
                    });

                    $(that.addVideo).css('display', 'block');

                    if(!that.pcPull['reserve']) {
                        //that.InitRTC(that.offerOptions, 'reserve', that.onInitRTC);TODO:
                        that.pcPull['reserve'] = that.pcPull[that.main_pc];
                        that.pcPull['reserve'].pc_key = 'reserve';
                        that.pcPull['reserve'].DC = new DataChannelOperator(that, that.pcPull['reserve']);
                    }

                    $('.browser')[0].contentWindow.postMessage({email:that.email.from,element:'#html_container',func:'LoadForm',args:[that.path+"html/signin.html#signin_form"]},'*');

                    // $('#html_container',$('#browser')[0].contentWindow.document).
                    // load("./html/signin.html#signin_form", function( response, status, xhr){
                    //     $(this).css('visibility','visible');
                    // });

                    // $.ajax({
                    //     url : "./html/signin.html#signin_form",
                    //     type : "get",
                    //     async: true,
                    //     success : function(signin) {
                    //
                    //         $('#html_container', $('.browser')[0].contentWindow.document).empty();
                    //         $('#html_container', $('.browser')[0].contentWindow.document).append($(signin)[13]);
                    //
                    //        },
                    //     error: function() {
                    //         log();
                    //     }
                    // });
                }
            },1000);
        }

        if(data.res ==='OK'){
            //log("received: " + data.res + " from "+ that.role, that);

            $('#remoteAudio_'+that.uid).prop('muted',false);

            for(let key in that.pcPull) {
                that.remoteStream = that.pcPull[key].con.getRemoteStreams()[0];
                if (that.remoteStream) {
                    that.remoteAudio.srcObject = that.remoteStream;
                    $('#addVideo', $('.browser')[0].contentWindow.document).css('display', 'inline-block');
                }
            }

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
            let result = confirm(data.confirm);
            if(result) {

                that.offerOptions.offerToReceiveVideo = 1;
                that.offerOptions.iceRestart = 1;
                that.InitRTC( that.offerOptions,that.main_pc,function () {
                    //that.pcPull[that.main_pc].DC = new DataChannelOperator(that, that.pcPull[that.main_pc]);//pcPull.createDataChannel("user channel");
                    that.GetUserMedia(function () {
                        that.DC.SendData({'camera': result});
                    });
                });

                //$('#container').width('200');

            }
        }

        if (data.camera){

            that.offerOptions.offerToReceiveVideo = 1;
            that.offerOptions.iceRestart = 1;
            that.SendClose(that.uid,'all')
            that.SendClose(that.uid,'relay');
            that.InitRTC(that.offerOptions, that.main_pc,function () {
                let pc = that.pcPull[that.main_pc];
                that.pcPull[that.main_pc].DC = new DataChannelOperator(that, that.pcPull[that.main_pc]);//pcPull.createDataChannel("user channel");

                pc.params = {};
                that.GetUserMedia(function () {
                    //log('pcPull createOffer start', that);
                    pc.con.createOffer(
                        that.offerOptions
                    ).then(
                        desk => pc.onCreateOfferSuccess(desk),
                        pc.onCreateOfferError
                    );

                    $('#kolmi_if_' + that.uid)[0].contentWindow.postMessage({
                        email: data.operators[i].email,
                        element: '.callObject',
                        style: {'opacity': 1}
                    }, "*");
                    $('#addVideo',$('.browser')[0].contentWindow.document).css('display', 'none');
                    // $('#container').width('200');
                    // $('#container').height('160');

                });
            });
        }

        if(data.browser){

            $('.browser')[0].contentWindow.postMessage({func:'InputMessage', args:[data]},'*');

            if(data.browser.msg.includes('https://') || data.browser.msg.includes('http://') ){
                if(data.browser.msg.includes('nedol.ru/bonmenu/')) {
                    data.browser.msg = data.browser.msg.replace("pano.html", "admin.html")
                }
                //TODO:$('#browser')[0].contentWindow.InsertElements([{id:md5(data.browser),type:0,func:'InsertIFrame',url:data.browser}]);
                //$('#browser')[0].contentWindow.postMessage({func:'InputMessage', args:[data.msg]},'*')
            }
        }

        if(data.data && data.data.html){
            //$('#browser')[0].contentWindow.InputHtml(data.html);
            $('.browser')[0].contentWindow.postMessage({func:'InputHtml', args:[data.data.html]},'*')
        }

        if(data.event){
            //TODO:$('#browser')[0].contentWindow.TriggerEvent(data.event);
            //$('#browser')[0].contentWindow.postMessage({func:'TriggerEvent', args:[data.html]},'*');
        }

        if(data.msg==='sse'){

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
        super.hangup(function () {

            $('.callButton').css({'transform': 'rotate(130deg)'});

            that.offerOptions.offerToReceiveVideo = 0;
            that.offerOptions.iceRestart = 1;
        })

    }

}

'use strict';
export {RTCBase}

import {Peer} from './Peer'

import {getParameterByName, getOfferKey, log} from '../utils'


class RTCBase{

    constructor(role) {

        let that = this;

        this.path = "https://nedol.ru/rtc/";
        if(location.hostname==='localhost')
            this.path = 'http://localhost:63342/rtc/dist/';

        this.mediaSource = new MediaSource();
        this.role = role;
        this.class;
        this.uid;

        this.email={'from':'','to':''}
        this.pcPull = {};
        this.main_pc;

        this.origin = location.origin;
        this.url;
        this.call_num = 3;

        this.localStream;
        this.remoteStream;

        this.startTime;

        this.offerOptions = {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 0
        };

        this.phone='';

        $(this.localAudio).on('loadedmetadata', function() {
            //log('Local audio loadedmetadata', that);
        });

        function listener(event) {
            if (event.origin !== 'http://localhost:63342' && event.origin !== 'https://nedol.ru') {
                return;
            }

            if (!event.data.email)
                return;

            if(event.data.func==='forward'){
                if(that.DC) {
                    that.DC.SendData(event.data);
                }
                return;
            }

            that.OnMessageIFrame(that,event.data);
        }

        if (window.addEventListener) {
            window.addEventListener("message", listener);
        }

    }

    SetComponents(obj,abonent, uid,components) {

        let br_but = components.includes('browser')?
            '\n<button  id="browser_but_' + uid + '" src="" style="display:none;position:fixed;z-index: 1000;bottom:13%; left:0;width:40px;height:36px;"></button>':'';

        if (components.includes('video')) {
            $(obj).parent().find('img').after(
                br_but+
                '\n<!-- KOLMI VIDEO-->' +
                '<video class="remoteVideo" id="remoteVideo_' + uid + '"  autoplay muted  poster="https://nedol.ru/rtc/img/person.png"' +
                '   style="display:block;position:absolute;height:30%;left:50%;right: 50%; top: 40%;transform: translate(-50%,-50%);"></video>' +
                '<!-- KOLMI VIDEO-->' +
                '<!-- KOLMI ADD VIDEO-->' +
                '\n<button id="addVideo_' + uid + '"  title="Выслать запрос на включение камеры"' +
                '   style="display:none;position:fixed;left:0;bottom: 2%;z-index: 1000">' +
                '   <img src="https://nedol.ru/rtc/img/outline-video_call-24px.svg">' +
                '</button>\n<!-- KOLMI ADD VIDEO-->');

        }

        if (components.includes('audio')) {
            $(obj).after(
                '\n<!-- KOLMI IFRAME-->' +
                '\n<iframe class="kolmi_if" id="kolmi_if_'+ uid + '" uid="'+uid+'" ' +
                '   src="'+this.path+'user.ru.html?uid='+ uid +'&iframe=kolmi_if_'+ uid +'&abonent=' + abonent + '"' +
                '   style="position:fixed;bottom:2%; right:0;width: 40px;height:40px;z-index: 1000" frameborder="0" scrolling="no">' +
                '</iframe>' +
                '\n<!-- KOLMI IFRAME-->' +
                '\n<!-- KOLMI AUDIO-->' +
                '\n<div id="audio_' + uid + '">\n' +
                '    <audio class="remoteAudio" id="remoteAudio_' + uid + '" autoplay muted></audio>\n' +
                '    <audio class="localSound" id="localSound_' + uid + '"  muted src="https://nedol.ru/rtc/assets/call.mp3"></audio>\n' +
                '</div>\n<!-- KOLMI AUDIO-->\n');
        }

        $(obj).remove();
    }

    AppendBrowser(uid){
        $('body').append(
            '\n<!-- KOLMI BROWSER-->' +
            '\n<div class="browser_container" id="browser_container_'+uid+'" \n'+
            '        style="display:none;   position: fixed;\n' +
            '        overflow-x: hidden; overflow-y: hidden; z-index:2147483646; margin: auto;\n' +
            '        width:75%;  height: 90%; left: 5%; top: 5%;\n' +
            '        border: solid 0px lightslategrey;\n' +
            '        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);">\n' +
            '        <input type="image" class="move_browser" src="https://nedol.ru/rtc/browser/images/ic_move.png"  draggable="false" style="position: absolute;\n' +
            '        display:block; top:0px; left:0px; width:40px; height:40px;  z-index:2;opacity: .3"/>\n' +
            '        <input type="image" class="resize_browser" src="https://nedol.ru/rtc/browser/images/ic_resize.png" width=40px; height=40px;   draggable="false"\n' +
            '               style="position: absolute; display:block; bottom:0px; right:0px; z-index:2;opacity: .3"/>\n' +
            '        <input type="image" class="close_browser" src="https://nedol.ru/rtc/browser/images/ic_stop.png"  style="position: absolute;\n' +
            '        display:block; bottom:0px; left:0px; width:30px; height:30px;  z-index:2;"/>\n' +
            '        <iframe class="browser" uid="'+uid+'" src = "'+this.path+'browser.ru.html" style="position:absolute;overflow:hidden;" width="100%" height="100%"></iframe>\n' +
            '    </div>\n<!-- KOLMI BROWSER-->');

    }

    get RemoteStream(){
        return this.remoteStream;
    }

    InitRTC(offerOptions, pc_key, cb) {

        let that = this;

        if (getParameterByName('area') === 'wi') {
            that.url = {
                "urls": [
                    "turn:104.211.157.62:3478?transport=udp",
                    "turn:104.211.157.62:3478?transport=tcp"
                ],
                "username": "user", "credential": "password123"
            }
        } else {
            that.url = {
                "urls": [
                    "turn:137.116.227.42:3478?transport=udp",
                    "turn:137.116.227.42:3478?transport=tcp"
                ],
                "username": "user", "credential": "password123"
            }
        }

        let pc_config = {
            iceTransportPolicy: (pc_key==='reserve'?that.main_pc:pc_key),
            lifetimeDuration: "86400s",
            rtcpMuxPolicy: "require",
            bundlePolicy: "balanced",
            iceServers: [
                {
                    "urls": [
                        // "stun:64.233.161.127:19302",
                        // "stun:[2A00:1450:4010:C01::7F]:19302",
                        //"stun:stun.l.google.com:19302",
                        // "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                        "stun:stun3.l.google.com:19302",
                        "stun:stun4.l.google.com:19302"
                    ]
                }
                , that.url
            ]
        };

        that.offerOptions.offerToReceiveAudio = offerOptions.offerToReceiveAudio;
        that.offerOptions.offerToReceiveVideo = offerOptions.offerToReceiveVideo;

        that.pcPull[pc_key] = new Peer(that, pc_config, pc_key);
        that.pcPull[pc_key].network = that.network;
        that.pcPull[pc_key].params = {};
        that.pcPull[pc_key].StartEvents();
        cb(that, pc_key);


        log('Starting call', that);
        this.startTime = Date.now();
    }

    GetUserMedia(cb){
        let that = this;
        navigator.mediaDevices.getUserMedia({
            audio: this.offerOptions.offerToReceiveAudio,
            video: this.offerOptions.offerToReceiveVideo
        })
            .then(stream => this.gotStream(stream,cb))
            .catch(function (e) {
                if(e.name === 'NotFoundError' || e.name === 'NotReadableError') {
                    if(that.offerOptions.offerToReceiveVideo)
                        alert("Something wrong with camera?");
                    else if(that.offerOptions.offerToReceiveAudio)
                        alert("Something wrong with mic?");
                }
            });
    }

    GetUserCamera(cb){
        let that = this;
        navigator.mediaDevices.getUserMedia({
            audio: this.offerOptions.offerToReceiveAudio,
            video: this.offerOptions.offerToReceiveVideo
        })
            .then(stream => this.gotCameraStream(stream,cb))
            .catch(function (e) {
                if(e.name === 'NotFoundError' || e.name === 'NotReadableError') {
                    if(that.offerOptions.offerToReceiveVideo)
                        alert("Something wrong with camera?");
                    else if(that.offerOptions.offerToReceiveAudio)
                        alert("Something wrong with mic?");
                }
            });
    }

    gotCameraStream(stream, cb){
        cb(stream);
    }

    gotStream(stream, cb) {
        //log('Received local stream', this);
        if(this.localVideo && this.localVideo.style.display==='block')
            this.localVideo.srcObject = stream;

        this.localStream = stream;

        this.getTracks(cb);
    }

    getTracks(cb){
        let that = this;

        this.localStream.getTracks().forEach(track => {
            for(let key in that.pcPull) {
                if(key==='reserve')
                    continue;
                that.pcPull[key].sender = that.pcPull[key].con.addTrack(
                    track,
                    that.localStream)
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
        cb();
    }



    onAddVideo(ev) {
        let that = this;
        let msg = "Do you mind to turn on the cameras?";
        log("Send message to confirm:"+msg, that);

        if (that.DC.dc.readyState === 'open') {
            that.DC.SendData({'confirm': msg});
        } else {
            let par = {};
            par.proj = 'rtc';
            par.uid = that.uid;
            par.func = 'datach';
            par.msg = {"confirm":msg};
            par.role = that.role;
            par.email = that.email.from;

            that.network.postRequest(par);
        }
    }

    OpenBrowser(data){

        let uid = data.data.uid;

        try {
            $('#browser_container_'+uid).css('display','block');
            $('#browser_container_'+uid).find('.browser')[0].contentWindow.postMessage({func:'SetUser', args:[{role:data.data.role,email:data.data.email.from}]},'*')


        }catch(ex){
            log(ex);
        }
    }

    SendDataBrowser(data){
        if(this.DC && this.DC.dc.readyState==='open'){
            this.DC.SendData(data);
            this.OnMessage(data);
        }
    }

    SendEventBrowser(data){

        $('.browser_container').css('z-index',10);

        if(this.DC && this.DC.dc.readyState==='open'){
            //this.DC.SendData(JSON.stringify(data));
        }
    }

    SendStatus(uid, trans, status){
        let par = {};
        par.proj = 'rtc';
        par.func = 'status';
        par.uid = uid;
        par.role = this.role;
        par.trans = trans;
        par.status = status;
        this.network.postRequest(par);
    }

    SendClose(uid, trans){
        let par = {};
        par.proj = 'rtc';
        par.func = 'close';
        par.uid = uid;
        par.role = this.role;
        par.trans = trans;
        par.status = 'close';
        this.network.postRequest(par);
    }


    hangup(cb) {
        let that = this;
        log('Ending call', that);

        //TODO:$('#addVideo',$('.browser')[0].contentWindow.document).css('display', 'none');
        //$(that.remoteVideo)[0].srcObject = null;
        $('.browser_container').css('display','none');
        $('.remoteVideo').css('display','none');

        if(that.localStream) {
            const videoTracks = that.localStream.getVideoTracks();
            videoTracks.forEach(videoTrack => {
                videoTrack.stop();
                that.localStream.removeTrack(videoTrack);
            });
            const audioTracks = that.localStream.getAudioTracks();
            audioTracks.forEach(audioTracks => {
                audioTracks.stop();
                that.localStream.removeTrack(audioTracks);
                that.localStream = null;
            });
        }

        for(let key in that.pcPull) {
            if(that.pcPull[key].DC) {
                that.pcPull[key].DC.dc.close();
            }
            that.pcPull[key].param = {};
        }
        //
        that.pcPull = {};

        cb();
    }

}


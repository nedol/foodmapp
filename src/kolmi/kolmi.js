'use strict';

//import {VideoRecorder} from "./media/recorder";
import {getParameterByName, log} from './utils'
var crypto = require('crypto');
function md5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}

import {RTCUser} from'./rtc_user';
import {RTCOperator} from'./rtc_operator';

let trans =  getParameterByName('trans');
let role =  getParameterByName('role');
let em = getParameterByName('em')?getParameterByName('em'):'user@kolmi';

let uid = md5(JSON.stringify(Date.now())+em);

//sessionStorage.setItem('kolmi_'+role+'_'+uid);
window.id = uid;

$(window).on('load', function () {

    if (!window.EventSource) {
        alert('В этом браузере нет поддержки EventSource.');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }

    setTimeout(function () {
        if(role==='user') {
            window.user  = new RTCUser( trans, role, em, uid);
            window.user.localSound.src = "./assets/Phone_Ringing_8x.mp3";

            //window.parent.$('head').append($('<link href="http://localhost:63342/kolmi/dist/kolmi/assets/vendor/icofont/icofont.min.css" rel="stylesheet">'));
        }else if(role==='operator'){
            window.user  = new RTCOperator( trans,role, em, uid);
            window.user.localSound.src = "./assets/call.mp3";
        }
    },100);

    window.CloseFrame = function () {
        if(this.user.DC)
            this.user.DC.SendDCHangup(()=>{
                $('.callButton').removeClass('talk');
                $('.callButton').removeClass('call');
                $(this.user.remoteAudio).prop('muted', true);
                $(this.user.localSound).prop('muted', true);
                $(window.parent.document).contents().find('#kolmi_pane').empty();

            });
    }


});



// WEBPACK FOOTER //
// rtc/rtc_operator.js
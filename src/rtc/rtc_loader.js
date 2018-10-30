'use strict';

import {RTCUser} from "./rtc_user";

import md5 from 'js-md5'

$(document).on('readystatechange', function () {

    if (document.readyState !== 'complete') {
        return;
    }

    $('object[abonent]').each(function (i) {
        let abonent = this.attributes.abonent.value;
        let components = this.attributes.components.value;
        let uid = md5(String(new Date()))+i;
        new RTCUser(uid,abonent,components);
    });


});
'use strict'

import {CustomerSettings} from "./customer.settings";

import 'bootstrap'

window.cs;
$(document).ready(function () {

    if (!window.EventSource) {
        alert('В этом браузере нет поддержки EventSource.');
        return;
    }
    // parent
    window.cs = new CustomerSettings(parent.db, parent.user.uid);
    cs.Open();

    var readURL = function(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $('.avatar').attr('src', e.target.result);
                $('.avatar').siblings('input:file').attr('changed',true);
            }

            reader.readAsDataURL(input.files[0]);
        }
    }


    $(".file-upload").on('change', function(){
        readURL(this);
    });
});
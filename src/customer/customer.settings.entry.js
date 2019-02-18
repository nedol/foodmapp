'use strict'

import {CustomerSettings} from "./customer.settings";

import 'bootstrap'
import {DB} from "../map/storage/db"
// global.jQuery = require('jquery');
$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        alert('В этом браузере нет поддержки EventSource.');
        return;
    }

    window.db = new DB('Customer', function () {
        window.cs = new CustomerSettings(window.db);
        window.cs.Open();
    });

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
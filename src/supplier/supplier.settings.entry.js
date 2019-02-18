'use strict'


import {SupplierSettings} from "./supplier.settings";
import {DB} from "../map/storage/db"

import 'bootstrap'
// global.jQuery = require('jquery');

$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        alert('В этом браузере нет поддержки EventSource.');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }
    // parent

    window.db = new DB('Supplier', function () {
        window.cs = new SupplierSettings(window.db);
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
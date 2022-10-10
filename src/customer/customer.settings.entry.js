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


    $(".file-upload").on('change', function(e){
        try {
            loadImage(
                e.target.files[0],
                function (img, data) {
                    if (img.type === "error") {
                        console.error("Error loading image ");
                    } else {
                        let this_img = img.toDataURL();

                        setTimeout(function () {
                            $('.avatar').attr('src', this_img);

                            $('.avatar').siblings('input:file').attr('changed', true);
                            console.log("Original image width: ", data.originalWidth);
                            console.log("Original image height: ", data.originalHeight);
                        },200)
                    }
                },
                {
                    orientation: true,
                    maxWidth: 600,
                    maxHeight: 300,
                    minWidth: 100,
                    minHeight: 50,
                    canvas: true
                }
            );
        }catch(ex){

        }

    });
});
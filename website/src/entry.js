'use strict'

import {RTCOwner} from '../rtc/rtc_owner'

require('aframe-orbit-controls-component-2');
require('aframe-text-geometry-component');
require('aframe-animation-component');
let TWEEN = require('@tweenjs/tween.js');

import 'aframe-gif-shader'
// import 'aframe-gif-component'

require("../dist/lib/arrow-key-rotation.js")
require("../dist/lib/play-on-window-click.js")
require("../dist/lib/play-on-vrdisplayactivate-or-enter-vr.js")
require("../dist/lib/hide-once-playing.js")

require("../dist/lib/plugins.js")


//window.demoMode = (utils.getParameterByName('dm')==='0'?false:true);

$(document).on('readystatechange', function () {

    if (document.readyState !== 'complete') {
        return;
    }

    $('#cube_menu')[0].setAttribute('visible','false');
    // $('a-sky')[0].setAttribute('visible','false');
    // $('a-videosphere')[0].setAttribute('visible','true');
    // //$('a-videosphere')[0].setAttribute('src','#start');



    // $.grep($('.iframe'), function (el) {
    //
    //     LoadAssets($(el).attr('iframe')+'.html');
    // });



    $(".to_pano").on('click touchstart', this, function (ev) {
        $('#space')[0].setAttribute('src',this.getAttribute('src'));
        $('#cube_menu')[0].setAttribute('visible','false');
        $('#grid')[0].setAttribute('visible','false');
        $('.back_but')[0].setAttribute('visible','true');
    });


    $(".back_but").on('click touchstart', this, function (ev) {

        $('#cube_menu')[0].setAttribute('visible','true');
        $('#space')[0].setAttribute('src','./img/milkyway_pano.jpg');
        $('#grid')[0].setAttribute('visible','true');

        $('.back_but')[0].setAttribute('visible','false');

        var video = $('a-videosphere')[0].components.material.material.map.image;
        if (!video) { return; }
        $('a-videosphere')[0].setAttribute('src','');
        video.load();
        video.pause();

        $('a-videosphere')[0].setAttribute('visible','false');
        $('#hall_set')[0].setAttribute('visible', 'false');

    });

    function LoadAssets(filename){

        $('#loader').load(filename+' a-assets', function (ev) {

            let assets = $(this).find('a-assets').html();
            let scene  = $(this).find('a-scene').html();
            //
            $('#main_assets').append(assets);

           $.each($('#main_assets').find('[src]'), function ( i ,el) {

               var ext = $(el).attr('src').split('.').pop();

               if (ext==="mp4") {
                   getVideoDataUri($(el).parent(), $(el).attr('src'), ext, function (data) {
                       $(el).attr('src', data);
                   });
               }

           });

            $(this).empty();

        });
    }

    function getVideoDataUri(video, url, ext, callback) {

        $.ajax(url,)

    }

    function getDataUri(url, ext, callback) {

        var image = new Image();

        image.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
            canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

            canvas.getContext('2d').drawImage(this, 0, 0);

            // Get raw image data
            //callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));

            // ... or get as Data URI
            callback(canvas.toDataURL('image/'+ext));
        };

        image.src = url;
    }


});

window.BackToMain  = function () {
    $('iframe').css('display','none');
    $('iframe').attr('src','');
    $("#scene").css('display','block');

}


//////////////////
// WEBPACK FOOTER
// ./entry.js
// module id = 199
// module chunks = 0
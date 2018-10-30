export {Menu};
import {InitAuth,OnClickAuth} from './auth.js'
import {Drag} from '../storage/drag.js';

class Menu {

    constructor(map) {
        this.map = map;
        this.drag = new Drag(map);
        this.init();
    }

    init() {
        let that  = this;

        $('#menu_include').css('display', 'block');

        if (localStorage.getItem("data_src")) {
            let ds = JSON.parse(localStorage.getItem("data_src"));
            for (let i in ds) {
                let item = ds[i];
                $("[data_src=" + item + "]").trigger('click', true);
            }
        }

        if (localStorage.getItem("drag") === 'true') {
            $("[drag]").trigger('click', true);
        }

        $('input:file').change(function (evt) {

            //listFiles(evt);
            let files = $("input[type='file']")[0].files;
            handleFileSelect(evt, files)
        });

        InitAuth();

        this.drag.InitFileImport();

        $('#menu_container').on('click', function () {
            if (!$('#menu_items').is(':visible'))
                $('#menu_items').slideToggle('slow', function () {

                });
        });

        $('#ar').on('click', this.OnClickAR);

        $('#settings').on('click', function () {
            // require("imports-loader?this=>window!../../lib/jquery.mobile-1.4.5.min.js");
            that.map.settings.OnClickSettings();

        });


        // $('#audio_list').on('click', OnOpenRecords);
        // $('#photo_list').on('click', OnOpenPhotos);
        $('#import').on('click', this.OnClickImport);

        $('#auth').on('click', function () {
            // require("imports-loader?this=>window!../../lib/jquery.mobile-1.4.5.min.js");
            require.ensure(['./auth'], function () {
                let au = require('./auth');
                au.OnClickAuth();
            });
        });
    };


    OnClickImport(el) {
        $("#file").trigger('click');
    }

    OnClickAR(el) {
        //TODO:
        let img = new Image();
        img.src = '../ar/ar.html';
        let w = img.width;
        let h = img.height;

        window.open('../ar/ar.html', '', "width=" + w + ", height=" + h);
    }

    OnClickMenuItem(el) {

        $(el).attr('state', $(el).attr('state') === '1' ? '0' : '1');
        $(el).css('opacity', $(el).attr('state') === '1' ? 1 : 0.3);

        //Map.getLayers().get($(el).attr('id')).setVisible(($(el).attr('state')==='0'?false:true));

        let cats = $(".offer").toArray();
        cats = jQuery.map(cats, function (el) {
            return {id: $(el).attr('id'), state: $(el).attr('state')};
        });
    }
}
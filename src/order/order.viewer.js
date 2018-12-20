'use strict'
export {OrderViewer}

var urlencode = require('urlencode');
require('bootstrap/js/modal.js');
require('bootstrap/js/tooltip.js');
require('bootstrap/js/tab.js');
// require('bootstrap/dist/css/bootstrap.css');
// require('font-awesome/css/font-awesome.css');

import {Dict} from '../dict/dict.js';
const langs = require("../dict/languages");

var moment = require('moment');

var md5 = require('md5');
var isJSON = require('is-json');

import {utils} from "../utils/utils";

class OrderViewer {

    constructor(){
        this.changed = false;
        this.order ;
        this.dict;

    }


    OpenOrderCustomers(objs) {

        this.orders = objs;

        let ordv = $("#order_viewer").clone();
        $(ordv).attr('id','order_viewer_clone');
        $(ordv).insertAfter($("#order_viewer"));

        ordv.modal({
            show: true,
            keyboard:true
        });

        ordv.find('.modal-title-date').text(this.orders.date +" ("+this.orders.period+")");

        ordv.off('hide.bs.modal');
        ordv.on('hide.bs.modal', this,this.CloseMenu);

        ordv.find('.toolbar').css('display', 'block');

        for(let c in this.orders) {
            let data = JSON.parse(objs[c].data);
            let cbdisabled = '';
            if (objs[c].status === 'approved')
                cbdisabled = 'disabled';
            let checked = objs[c].status === 'approved' ? 'checked' : '';
            for (let o in data) {
                $("<tr>" +
                    "<td class='tablesorter-no-sort'>" +
                    "<label  class=\"btn\">" +
                    "<input type=\"checkbox\" class=\"checkbox-inline\" " + cbdisabled + " cusem=" + objs[c].cusem + " " + checked + " style=\"display: none\">" +
                    "<i class=\"fa fa-square-o fa-2x\"></i>" +
                    "<i class=\"fa fa-check-square-o fa-2x\"></i>" +
                    "</label>" +
                    "</td>" +
                    "<td data-translate='" + o + "'>Title</td>" +
                    "<td>" + data[o].qnty + "</td>" +
                    "<td>" + objs[c].address + "</td>" +
                    "<td>" + objs[c].dist + "</td>" +
                    "<td>" + objs[c].period + "</td>" +
                    "<td class='tablesorter-no-sort'>" +
                    (objs[c].comment ? "<span class='tacomment'>" + objs[c].comment + "</span>" : '') +
                    "</td>" +
                    "<td>" + "0" + "</td>" +
                    "<td class='tablesorter-no-sort notoday' >" +
                    "<label  class=\"btn\">" +
                    "<input type=\"checkbox\" class=\"checkbox-inline\">" +
                    "<i class=\"fa fa-square-o fa-2x\"></i>" +
                    "<i class=\"fa fa-check-square-o fa-2x\"></i>" +
                    "</label>" +
                    "</td>" +
                    "</tr>").appendTo($(ordv).find('.tablesorter').find('tbody'));
            }
        }

        setTimeout(function () {
            $(ordv).find('.tablesorter').tablesorter({
                theme: 'blue',
                widgets: ['zebra', 'column'],
                usNumberFormat: false,
                sortReset: true,
                sortRestart: true,
                sortInitialOrder: 'desc'
            });
        },1000);



        // let sp = $('.sp_dlg');
        // $(sp).selectpicker();
        // let evnts = $._data($(sp).get(0), "events");
        //
        this.lang = window.sets.lang;
        window.dict.set_lang(window.sets.lang,ordv);
        // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');

        // if(!evnts['changed.bs.select']) {
        //     $(sp).on('changed.bs.select', this, this.OnChangeLang);
        // }

    }

    OnChangeLang(ev) {
        ev.preventDefault(); // avoid to execute the actual submit of the form.
        ev.stopPropagation();
        let menu = ev.data;
        menu.SaveOffer(ev,window.user.menu.lang);

        let sel_lang = $('.sp_dlg option:selected').val().toLowerCase().substring(0, 2);

        window.dict.Translate('en',sel_lang, function () {
            window.dict.set_lang(sel_lang, $("#offer_viewer"));
            window.user.menu.lang = sel_lang;
        });
    }


    CloseMenu(ev) {
        ev.data.offers = '';
        $('#order_viewer_clone').remove();
    }
}



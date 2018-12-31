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


        this.ordv = $("#order_viewer").clone();
        $(this.ordv).attr('id','order_viewer_clone');
        $(this.ordv).insertAfter($("#order_viewer"));

        this.ordv.modal({
            show: true,
            keyboard:true
        });


        this.ordv.off('hide.bs.modal');
        this.ordv.on('hide.bs.modal', this,this.CloseMenu);

        this.ordv.find('.toolbar').css('display', 'block');

    }


    OpenOrderCustomers(objs) {
        let that = this;
        this.orders = objs;
        this.ordv.find('.modal-title-date').text(this.orders[0].date +" ("+this.orders[0].period+")");

        for(let c in this.orders) {
            let data = objs[c].data;

            for (let o in data) {
                if(o ==='comment'){
                    continue;
                }
                let checked = objs[c].data[o].status === 'approved' ? 'checked' : '';
                let cbdisabled = '';
                if (objs[c].data[o].status === 'approved')
                    cbdisabled = 'disabled';
                let row = "<tr>" +
                    "<td class='tablesorter-no-sort'>" +
                        "<label  class=\"btn\">" +
                        "<input type=\"checkbox\" class=\"approved checkbox-inline\" " + cbdisabled + " cusuid=" + objs[c].cusuid + " " + checked + " " +
                            "style=\"display: none\" order="+o+">" +
                        "<i class=\"fa fa-square-o fa-2x\"></i>" +
                        "<i class=\"fa fa-check-square-o fa-2x\"></i>" +
                        "</label>" +
                    "</td>" +
                    "<td data-translate='" + o + "'>Title</td>" +
                    "<td>" + data[o].qnty + "</td>" +
                    "<td>" + data[o].price + "</td>" +
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
                    "</tr>";
                    $(row).appendTo($(this.ordv).find('.tablesorter').find('tbody'));
                    $('input:checkbox').on('change', function (ev) {
                        let checked = $(ev.target).is(':checked')?'approved':'';
                        let ord = $(ev.target).attr('order');
                        that.orders[c].data[ord].status = checked ;
                    });
            }
        }

        setTimeout(function () {
            $(that.ordv).find('.tablesorter').tablesorter({
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
        window.dict.set_lang(window.sets.lang,this.ordv);
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

        ev.data.SaveOrder(ev);
        ev.data.offers = '';
        $('#order_viewer_clone').remove();
    }

    SaveOrder(ev) {
        for(let o in this.orders) {
            let obj = this.orders[o];
            window.user.ApproveOrder(obj.title, obj.date,obj);
        }
    }
}



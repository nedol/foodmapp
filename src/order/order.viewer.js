'use strict'
export {OrderViewer}

var urlencode = require('urlencode');
require('bootstrap/js/modal.js');
require('bootstrap/js/tooltip.js');
require('bootstrap/js/tab.js');
// require('bootstrap/dist/css/bootstrap.css');
// require('font-awesome/css/font-awesome.css');

import proj from 'ol/proj';
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


        this.ordv = $("#order_viewer");
        $(this.ordv).resizable();
        $(this.ordv).draggable();
        this.ordv.find('.toolbar').css('display', 'block');

    }

    InitOrders(objs) {
        let that = this;
        this.orders = objs;
        // if(this.orders.length>0)
        //     $(this.ordv).css('display','block');
        //$('a[href="#orders"]').parent('li').addClass('active');
        //this.ordv.find('.modal-title-date').text(this.orders[0].date +" ("+this.orders[0].period+")");
        let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
        //$(this.ordv).find('#tbl_orders').find('tbody').empty();

        $(".category[state='1']").each(function (i, cat) {
            let tab = cat.title;
            $('<li class="tab_inserted"><a cat="'+cat.id+'" data-toggle="tab" contenteditable="true"  data-translate="'+md5(tab)+'"  href="#'+tab+'"' +
                ' style="color:grey;margin:1px;">'+cat.title+'</a>' +
                '</li>').insertBefore($('#orders_add_tab_li'));
            $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted" style="border: none">'+
                '</div>').insertBefore($('#orders_add_tab_div'));

            let tbl_clone = $('#tbl_orders').clone();
            $(tbl_clone).attr('id','tbl_orders_'+tab)
            $(tbl_clone).appendTo('#' + tab);
            fillTableOrders(tbl_clone, tab);

        });

        $('#orders_add_tab_li').css('visibility','visible');
        $('#orders_add_item').css('visibility','visible');

        function fillTableOrders(tbl, tab){

            for (let c in that.orders) {
                let data = objs[c].data;

                for (let o in data) {
                    if (o === 'comment') {
                        continue;
                    }
                    if(data[o].cat!==tab)
                        continue;

                    let checked = objs[c].data[o].status === 'approved' ? 'checked' : '';
                    let cbdisabled = '';
                    if (objs[c].data[o].status === 'approved')
                        cbdisabled = 'disabled';
                    let row = "<tr style='text-align: center;'>" +
                        "<td class='tablesorter-no-sort'>" +
                        "<label  class=\"btn\">" +
                        "<input type=\"checkbox\" class=\"approve checkbox-inline\" " + cbdisabled + " cusuid=" + objs[c].cusuid + " " + checked + " " +
                        "style=\"display: none\" title=\"" + o + "\">" +
                        "<i class=\"fa fa-square-o fa-2x\"></i>" +
                        "<i class=\"fa fa-check-square-o fa-2x\"></i>" +
                        "</label>" +
                        "</td>" +
                        "<td data-translate='" + o + "'></td>" +
                        "<td>" + data[o].pack + "</td>" +
                        "<td>" + data[o].price + "</td>" +
                        "<td>" + data[o].qnty + "</td>" +
                        "<td onclick='window.user.viewer.OnClickAddress(that)'>" + objs[c].address + "</td>" +
                        "<td>" + objs[c].dist + "</td>" +
                        "<td>" + objs[c].period + "</td>" +
                        "<td class='tablesorter-no-sort'>" +
                        "<span class='tacomment'>" + objs[c].comment + "</span>" +
                        "</td>" +
                        "<td>" + "" + "</td>" +
                        "<td>" + "0" + "</td>" +
                        "<td class='tablesorter-no-sort notoday' >" +
                        "<label  class=\"btn\">" +
                        "<input type=\"checkbox\" class=\"checkbox-inline\">" +
                        "<i class=\"fa fa-square-o fa-2x\"></i>" +
                        "<i class=\"fa fa-check-square-o fa-2x\"></i>" +
                        "</label>" +
                        "</td>" +
                        "</tr>";

                    $(row).appendTo($(tbl).find('tbody'));

                    $('input:checkbox').on('change', function (ev) {
                        let checked = $(ev.target).is(':checked') ? 'approved' : '';
                        let ord = $(ev.target).attr('order');
                        that.orders[c].data[ord].status = checked;
                    });

                    window.db.GetApproved(date, window.user.uid, objs[c].cusuid, o, function (appr) {
                        if (appr && appr.data.qnty === data[o].qnty &&
                            appr.data.price === data[o].price) {
                            $(".approve[title='" + appr.title + "'][cusuid=" + objs[c].cusuid + "]").attr('checked', 'checked');
                            $(".approve[title='" + appr.title + "'][cusuid=" + objs[c].cusuid + "]").attr('disabled', 'true');
                        }
                    });
                }
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
            that.lang = window.sets.lang;
            window.dict.set_lang(window.sets.lang,that.ordv);
        },1000);


        $(this.ordv).find('.close_browser').off('click touchstart');
        $(this.ordv).find('.close_browser').on('click touchstart', this,  that.Close);
        // let sp = $('.sp_dlg');
        // $(sp).selectpicker();
        // let evnts = $._data($(sp).get(0), "events");
        //

        // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');

        // if(!evnts['changed.bs.select']) {
        //     $(sp).on('changed.bs.select', this, this.OnChangeLang);
        // }

    }


    Close(ev) {
        ev.data.orders = '';
        $('tbody').empty();
        $('.tab_inserted').remove();
        $('.div_tab_inserted').remove();
        $(ev.data.ordv).css('display','none');
    }

    OnClickAddress(td) {
        let adr = $(td).text();
        window.user.map.geo.SearchLocation(adr, function (bound, lat, lon) {
            let loc = proj.fromLonLat([parseFloat(lon), parseFloat(lat)]);
            window.user.map.MoveToLocation(loc);
            //window.user.map.SetBounds({sw_lat: bound[0], sw_lng: bound[2], ne_lat: bound[1], ne_lng: bound[3]});
            //window.user.map.ol_map.getView().setZoom(15);
            //window.user.map.ol_map.getView().changed();
        });
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


    SaveOrder(ev) {
        let orders = this.orders;
        $('.approve:checked').each(function (i,item) {
            if(!orders[i])
                return;
            let obj = orders[i];
            window.user.ApproveOrder(obj, $(item).attr('title'));
        })
    }
}



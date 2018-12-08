'use strict'
export {OfferOrder}

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


class OfferOrder {

    constructor(){
        this.changed = false;
        this.offer ;
        this.dict;

        this.arCat = [];

        this.location = [];

        this.address;

        this.active_class = 'w3-border w3-border-grey w3-round-large';

    }


    OpenOffer(em, period, offer, dict, latlon) {
        let that = this;
        this.email = em;
        this.offer = offer;
        this.dict = new Dict(dict);


        this.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
        this.period = period;
        let order;
        let ls = JSON.parse(localStorage.getItem('customer'));
        if(ls[this.date] && ls[this.date][em]){
            order= ls[this.date][em];
        }

        this.address = ls.address;
        if (!this.address) {
            window.admin.map.geo.SearchPlace(latlon, 18, function (obj) {
                that.address = obj;
                $('.address').text(obj.street + "," + obj.house);
            });
        } else {
            $('.address').text(this.address);
        }


        let ovc_2 = $("#offer_order").clone();
        $(ovc_2).attr('id','offer_order_clone');
        $(ovc_2).insertAfter($("#offer_order"));

        localStorage.setItem('dict',JSON.stringify(window.dict.dict));

        ovc_2.modal({
            show: true,
            keyboard:true
        });
        this.parent = event.data;

        ovc_2.find('.modal-title-date').text($('.dt_val')[0].value.split(' ')[0]);
        ovc_2.off('hide.bs.modal');
        ovc_2.on('hide.bs.modal', this,this.CloseMenu);

        window.dict.set_lang(window.sets.lang,ovc_2[0]);

        ovc_2.find('.toolbar').css('display', 'block');

        for (let tab in this.offer) {
            if(!tab || this.offer[tab].length===0) continue;
            if($('[href="#'+tab+'"]').length===0) {
                $('<li class="tab_inserted"><a data-toggle="tab"  contenteditable="false" data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a>' +
                    '</li>').insertBefore(ovc_2.find('.add_tab_li'));
                $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted dropdown" style="border: none">' +
                    '</div>').insertBefore(ovc_2.find('.add_tab_div'));
            }

            for (let i in this.offer[tab]) {

                let tmplt = $('#menu_item_tmplt').clone();
                $('#menu_item_tmplt').attr('id', tab + '_' + i);
                let menu_item = $('#' + tab + '_' + i)[0];
                $(menu_item).attr("class", 'menu_item');
                $(menu_item).css('display', 'block');

                $(menu_item).find('.item_title').attr('contenteditable', 'false');
                $(menu_item).find('.item_price').attr('contenteditable', 'false');

                $(menu_item).find('.item_content').addClass('collapse');
                $(menu_item).find('.item_title').attr('data-toggle','collapse');
                $(menu_item).find('.item_title').attr('href','.collapse');


                if(this.offer[tab][i].title){
                    try {
                        $(menu_item).find('.item_title').text(window.dict.dict[this.offer[tab][i].title][window.sets.lang]);
                    }catch(ex){
                        ;
                    }
                    $(menu_item).find('.item_title').attr('data-translate', this.offer[tab][i].title);
                    if(order && order.order && order.order[this.offer[tab][i].title]){
                        $(menu_item).find('.btn').text(order.order[this.offer[tab][i].title]['qnty']);
                        $(menu_item).attr('ordered', order.order[this.offer[tab][i].title]['qnty']);
                        $(menu_item).find('.btn').removeClass('btn-default');
                        $(menu_item).find('.btn').addClass('btn-success');
                    }
                }
                $(menu_item).find('.item_price').text(this.offer[tab][i].price);

                //$(menu_item).find('.content_text').text(urlencode.decode(window.dict.dict[this.menu[tab][i].content][window.sets.lang]));
                $(menu_item).find('.content_text').attr('contenteditable', 'false');
                $(menu_item).find('.content_text').attr('data-translate', this.offer[tab][i].content);
                if(this.offer[tab][i].content)
                    $(menu_item).find('.content_text').css('visibility','visible');
                if(this.offer[tab][i].width)
                    $(menu_item).find('.content_text').css('width',(this.offer[tab][i].width));

                // if(this.offer[tab][i].height)
                //     $(menu_item).find('.content_text').css('height',(this.offer[tab][i].height));


                if(this.offer[tab][i].img) {
                    $(menu_item).find('.img-fluid').css('visibility', 'visible');
                    $(menu_item).find('.img-fluid').attr('src', this.offer[tab][i].img);
                    $(menu_item).find('.img-fluid').css('left',this.offer[tab][i].img_left);
                }

                $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);

                ovc_2.find('#' + tab).append(menu_item);

                $(tmplt).insertAfter('#offer_order');

                if ($(menu_item).find('.item_content').css('display') == 'block'
                    && $(menu_item).find('.img-fluid').attr('src')===''
                    && $(menu_item).find('.content_text').text()===""){
                    $(menu_item).find('.item_content').slideToggle("fast");
                }

                $(menu_item).find('li').on('click', function(ev){
                    $(menu_item).find('.btn').focus();
                    $(menu_item).find('.btn').text(ev.target.text).val();

                    $(menu_item).find('.btn').removeClass('btn-default');
                    $(menu_item).find('.btn').addClass('btn-success');
                    $(menu_item).attr('ordered', ev.target.text);

                });
            }
        }

        if(order && order.order) {
            $('.comment').text(order.order.comment);
        }

        // let sp = $('.sp_dlg');
        // $(sp).selectpicker();
        // let evnts = $._data($(sp).get(0), "events");
        //
        this.dict.set_lang(window.sets.lang,ovc_2[0]);
        // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');

        $($('.tab_inserted')[0]).find('a').trigger('click');

        $(ovc_2).find('.publish_order').off('click touchstart');
        $(ovc_2).find('.publish_order').on('click touchstart',this,function (ev) {
            window.admin.PublishOrder(ev.data.GetOrderItems(ev.data.lang,true),ev.data.address);
        });

    }

    CloseMenu(ev) {
        let that = ev.data;
        that.SaveOrder(ev,window.sets.lang);
        ev.data.offer = '';
        $('#offer_order_clone').remove();
    }

    GetOrderItems(lang){
        let that = this;
        let obj = {order:{}};
        $('.menu_item[ordered]').each(function (index, val) {
            if($(this).attr('ordered')==='0'){
                return;
            }
            obj.order[$(val).find('.item_title').attr('data-translate')] = {
                qnty: $(val).find('button[data-toggle=dropdown]').text()
            }
        });
        obj['email'] = this.email;
        obj['comment'] = $('#offer_order_clone').find('.comment')[0].value;
        obj['date'] = this.date;
        obj['period'] = this.period;
        obj['address'] = $('#offer_order_clone').find('.address').text();
        return obj;
    }

    SaveOrder(ev, lang) {

        let that = ev.data;
        let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');//class_obj.date;
        let items = this.GetOrderItems(lang);
        window.admin.UpdateOrderLocal( items , that.email, date);
    }


}



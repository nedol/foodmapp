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

    constructor(dict){
        this.changed = false;
        this.offer ;
        this.dict;

        this.arCat = [];

        this.location = [];

        this.address;

        this.dict = new Dict(dict);

        this.active_class = 'w3-border w3-border-grey w3-round-large';

        this.ovc = $("#offer_order").clone();
        $(this.ovc).attr('id','offer_order_clone');
        $(this.ovc).insertAfter($("#offer_order"));
        this.ovc.modal({
            show: true,
            keyboard:true
        });

        this.ovc.find('.modal-title-date').text($('.dt_val')[0].value.split(' ')[0]);
        this.ovc.off('hide.bs.modal');
        this.ovc.on('hide.bs.modal', this,this.CloseMenu);

        $(this.ovc).find('.publish_order').off('click touchstart');
        $(this.ovc).find('.publish_order').on('click touchstart',this,function (ev) {
            window.user.PublishOrder(ev.data.GetOrderItems(ev.data.lang,true),ev.data.address, (data)=> {
                let status = window.dict.getDictValue(window.sets.lang,data.status);
                $(this.ovc).find('.ord_status').css('color','white');
                $(this.ovc).find('.ord_status').text(status);
            });
        });

    }


    OpenOffer(obj) {
        let that = this;
        this.email = obj.email;
        this.offer = JSON.parse(obj.data);

        let latlon = [obj.latitude,obj.longitude];

        this.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
        this.period = obj.period;
        let order;
        let ls = JSON.parse(localStorage.getItem('customer'));
        if(ls[this.date] && ls[this.date][this.email]){
            order= ls[this.date][this.email];
        }

        this.address = ls.address;
        if (!this.address) {
            window.user.map.geo.SearchPlace(latlon, 18, function (obj) {
                that.address = obj;
                $('.address').text(obj.street + "," + obj.house);
            });
        } else {
            $('.address').text(this.address);
        }


        if(order.status) {
            this.status = order.status;
            let status = window.dict.getDictValue(window.sets.lang,order.status);
            $(this.ovc).find('.ord_status').css('color', 'white');
            $(this.ovc).find('.ord_status').text(status);
        }

        localStorage.setItem('dict',JSON.stringify(window.dict.dict));


        this.parent = event.data;



        window.dict.set_lang(window.sets.lang,this.ovc[0]);

        this.ovc.find('.toolbar').css('display', 'block');

        for (let tab in this.offer) {
            if(!tab || this.offer[tab].length===0) continue;
            if($('[href="#'+tab+'"]').length===0) {
                $('<li class="tab_inserted"><a data-toggle="tab"  contenteditable="false" data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a>' +
                    '</li>').insertBefore(this.ovc.find('.add_tab_li'));
                $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted dropdown" style="border: none">' +
                    '</div>').insertBefore(this.ovc.find('.add_tab_div'));
            }

            for (let i in this.offer[tab]) {

                let tmplt = $('#menu_item_tmplt').clone();
                $('#menu_item_tmplt').attr('id', tab + '_' + i);
                let menu_item = $('#' + tab + '_' + i)[0];
                $(menu_item).attr("class", 'menu_item');
                $(menu_item).css('display', 'block');

                $(menu_item).find('.item_title').attr('contenteditable', 'false');
                //$(menu_item).find('.item_price').attr('contenteditable', 'false');


                $(menu_item).find('.item_content').attr('id', 'content_' + tab + '_' + i);
                $(menu_item).find('.item_title').attr('data-target','#content_' + tab + '_' + i);


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
                    $(menu_item).find('.img-fluid').css('top',this.offer[tab][i].img_top);
                }

                $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);

                this.ovc.find('#' + tab).append(menu_item);

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

        window.db.GetOrder(this.date, obj.email, window.user.email, function (res) {
            if(res!==-1){
                let obj_data = JSON.parse(res.data.order);
                let keys =  Object.keys(obj_data);

                for(let k in keys){
                    if(keys[k]==='comment'){
                        $('.comment').text(obj_data.comment);
                    }else {
                        let qnty = obj_data[keys[k]].qnty;
                        $('.item_title[data-translate=' + keys[k] + ']').siblings('.dropdown').find('button').text(qnty);
                        let price = obj_data[keys[k]].price;
                        $('.item_title[data-translate=' + keys[k] + ']').siblings('.item_price').text(price);
                        $('.item_title[data-translate='+keys[k]+']').closest('.menu_item').attr('ordered','');
                    }
                }
            }
        });

        // let sp = $('.sp_dlg');
        // $(sp).selectpicker();
        // let evnts = $._data($(sp).get(0), "events");
        //
        this.dict.set_lang(window.sets.lang,this.ovc[0]);
        // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');

        $($('.tab_inserted')[0]).find('a').trigger('click');



    }

    CloseMenu(ev) {
        let that = ev.data;
        that.SaveOrder(ev,window.sets.lang);
        that.offer = '';
        $('#offer_order_clone').remove();
    }

    GetOrderItems(){
        let that = this;
        let obj = {order:{}};
        $('.menu_item[ordered]').each(function (index, val) {
            if($(this).attr('ordered')==='0'){
                return;
            }
            obj.order[$(val).find('.item_title').attr('data-translate')] = {
                qnty: $(val).find('button[data-toggle=dropdown]').text(),
                price: $(val).find('.item_price').text()
            }
        });
        obj.order.comment = $('#offer_order_clone').find('.comment')[0].value;
        obj.order = JSON.stringify(obj.order);
        obj['supem'] = this.email;
        obj['cusem'] = window.user.email;
        obj['date'] = this.date;
        obj['period'] = this.period;
        obj['address'] = $('#offer_order_clone').find('.address').text();
        obj['status'] = this.status;
        return obj;
    }

    SaveOrder(ev, lang) {

        let that = ev.data;
        let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');//class_obj.date;
        let items = this.GetOrderItems();
        window.user.UpdateOrderLocal( items , that.email, date);
    }


}



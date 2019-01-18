'use strict'
export {OfferOrder}

var urlencode = require('urlencode');
require('jquery-ui')
require('jquery-ui-touch-punch');
require('jquery.ui.touch');
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

        this.active_class = 'w3-border w3-border-grey w3-round-large';

        this.ovc = $("#offer_order").clone();
        $(this.ovc).attr('id','offer_order_clone');
        $(this.ovc).insertAfter($("#offer_order"));

        this.ovc.css('display','inline-block');
        this.ovc.draggable();

        $(this.ovc).find('.comment').on('click',this.ovc,function (ev) {
            $(ev.data).css('width','auto');
        });

        $(this.ovc).addTouch();

        this.ovc.find('.modal-title-date').text($('.dt_val')[0].value.split(' ')[0]);

        $(this.ovc).find('.publish_order').off('click touchstart');
        $(this.ovc).find('.publish_order').on('click touchstart',this,function (ev) {
            let that = ev.data;
            let items = ev.data.GetOrderItems(ev.data.lang,true);
            window.user.PublishOrder(items,(data)=> {
                let status = window.dict.getDictValue(window.sets.lang,Object.keys(data)[1]);
                $(that.ovc).find('.ord_status').css('color','white');
                $(that.ovc).find('.ord_status').text(status + "\r\n"+ data.published);
                that.status = Object.keys(data)[1];

                window.db.GetSettings(function (obj) {
                    obj[0].address = items.address;
                    window.db.SetObject('setStore',obj[0], function () {

                    });
                });
            });
        });

        $('.close_browser').on('click touchstart', this, function (ev) {
            let that = ev.data;
            that.SaveOrder(ev,window.sets.lang);
            that.offer = '';
            $(that.ovc).remove();
        });
    }

    OpenOffer(obj) {
        let that = this;
        this.uid = obj.uid;
        this.profile = obj.profile;
        this.offer = obj.data;
        obj.supuid = obj.email;
        let latlon = [obj.latitude,obj.longitude];

        this.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
        this.period = obj.period;

        window.dict.set_lang(window.sets.lang,this.ovc[0]);

        this.dict = new Dict(obj.dict.dict);
        const options = {
            componentRestrictions: {country: "ru", "city":"Moscow"}
        };

        this.ovc.find('.toolbar').css('display', 'block');

        this.ovc.find('li.publish_order').addClass('disabled');

        let str = "Заказ на доставку\r\n"+$('.dt_val')[0].value+"("+$('.sel_period').text()+")";
        this.ovc.find('.order_div').text(str);

        window.db.GetSettings(function (obj) {
            if(obj[0].profile && obj[0].profile.address)
                that.ovc.find('.address').text(obj[0].profile.address);
        });


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
                //$(menu_item).find('.item_price').attr('contenteditable', 'true');//TODO:for premium tariff

                $(menu_item).find('.item_price').text(this.offer[tab][i].price);

                $(menu_item).find('.item_content').attr('id', 'content_' + tab + '_' + i);
                $(menu_item).find('.item_title').attr('data-target','#content_' + tab + '_' + i);

                if(this.offer[tab][i].title){
                    $(menu_item).find('.item_title').attr('data-translate', this.offer[tab][i].title);
                }

                if(this.offer[tab][i].packlist) {
                    $(menu_item).find('.pack_container').css('display','block').addClass('col-xs-4');
                    $.each(this.offer[tab][i].packlist, function (i, data) {
                        $(menu_item).find('.pack_list').append("<li href='#'><a role='packitem'>" + i + "</a></li>");
                        $(menu_item).find('.item_pack').text(i);
                        $(menu_item).find('.item_price').text(data);
                        $(menu_item).find('.item_pack').attr('packlist',JSON.stringify(data));
                    });
                }
                //$(menu_item).find('.content_text').text(urlencode.decode(window.dict.dict[this.menu[tab][i].content][window.sets.lang]));
                $(menu_item).find('.content_text').attr('contenteditable', 'false');
                $(menu_item).find('.content_text').attr('data-translate', this.offer[tab][i].content);
                if(this.offer[tab][i].content)
                    $(menu_item).find('.content_text').css('visibility','visible');
                if(this.offer[tab][i].width)-
                    $(menu_item).find('.content_text').css('width',(this.offer[tab][i].width));

                if(this.offer[tab][i].img) {
                    $(menu_item).find('.img-fluid').css('visibility', 'visible');
                    $(menu_item).find('.img-fluid').attr('src', this.offer[tab][i].img.src);
                    $(menu_item).find('.img-fluid').css('left',!this.offer[tab][i].img.left?0:this.offer[tab][i].img.left);
                    $(menu_item).find('.img-fluid').css('top', this.offer[tab][i].img.top);
                    this.MakeDraggable($(menu_item).find('.img-fluid'));
                }

                $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);

                this.ovc.find('#' + tab).append(menu_item);

                $(menu_item).find('.gallery').attr('id', 'gallery_' + tab + '_' + i);

                $.each(this.offer[tab][i].cert, function (i, data) {
                    let img = new Image();
                    img.src = data.src;
                    //$(img).offset(data.pos); TODO:
                    img.height = '50';
                    $(menu_item).find('.gallery').append(img);
                    $(img).on('click', that.onClickCert);
                });

                $(tmplt).insertAfter('#offer_order');

                if ($(menu_item).find('.item_content').css('display') == 'block'
                    && $(menu_item).find('.img-fluid').attr('src')===''
                    && $(menu_item).find('.content_text').text()===""){
                    $(menu_item).find('.item_content').slideToggle("fast");
                }

                $(menu_item).find('li>a[role=qntyitem]').on('click', function(ev){
                    that.changed = true;
                    $(menu_item).find('.btn').focus();
                    $(menu_item).find('.btn').text(ev.target.text).val();

                    $(menu_item).find('.btn').removeClass('btn-default');
                    $(menu_item).find('.btn').addClass('btn-success');
                    $(menu_item).attr('ordered', ev.target.text);
           
                });
                $(menu_item).find('li>a[role=packitem]').on('click', {that: that, off:this.offer[tab][i]},function(ev){
                    that.changed = true;
                    let pl = ev.data.off.packlist;
                    $(menu_item).find('.item_pack').text($(ev.target).text());
                    $(menu_item).find('.item_price').text(pl[$(ev.target).text()]);
                });
            }
        }

        this.RedrawOrder(obj);

        this.dict.set_lang(window.sets.lang,this.ovc[0]);
        // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');

        $($('.tab_inserted')[0]).find('a').trigger('click');

        window.db.GetOrders(this.date,obj.uid,function (arObj) {
            if(arObj.length>0){
                for(let o in arObj) {
                    let order = arObj[o];
                    that.address = order.address;
                    if (!that.address) {
                        window.user.map.geo.SearchPlace(latlon, 18, function (obj) {
                            that.address = obj;
                            $('.address').text(obj.street + "," + obj.house);
                        });
                    } else {
                        if(that.address)
                            $('.address').text(that.address);
                    }

                    if(order.published) {
                        that.published = order.published;
                        let status = window.dict.getDictValue(window.sets.lang, "published");
                        $(that.ovc).find('.ord_status').css('color', 'white');
                        $(that.ovc).find('.ord_status').text(status + " "+order.published);
                    }

                    if(order.comment){
                        $(that.ovc).find('.comment').text(that.dict.getDictValue(window.sets.lang, order.comment));
                    }

                }
                if($('.menu_item[ordered]')[0])
                    $('li.publish_order.disabled').removeClass('disabled');
            }
        });

        $(this.ovc).find('.supplier_profile').on('click touchstart',function () {
            $('.browser_container').css('display','block');
        });


    }

    onClickCert(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if(!$(this).attr('height'))
            $(this).attr('height','50');
        else {
            $(this).removeAttr('height');
        }
        return false;
    };

    MakeDraggable(el){
        $(el).draggable({
            start: function () {
                console.log("drag start");
            },
            drag: function () {
                return false;//$(el).attr('drag', true);
            },
            stop: function () {
                // var rel_x = parseInt($(el).position().left / window.innerWidth * 100);
                // $(el).css('right', rel_x + '%');
                // var rel_y = parseInt($(el).position().top / window.innerHeight * 100);
                // $(el).css('bottom', rel_y + '%');
            }
        });
    }

    RedrawOrder(obj){
        let that = this;
        window.db.GetOrder(this.date, obj.uid, window.user.uid, function (res) {
            if(res!==-1){
                let keys = Object.keys(res.data);
                //$('.sel_period').text(res.period);
                for(let k in keys){
                    if(keys[k]==='comment'){
                        $('.comment').text(that.dict.getDictValue(window.user.lang, res.data.comment));
                    }else {
                        window.db.GetApproved(that.date,obj.uid,window.user.uid,keys[k],function (appr) {
                            if(appr &&
                                //res.period ===appr.period &&
                                res.data[keys[k]].price===appr.data.price &&
                                res.data[keys[k]].pack===appr.data.pack &&
                                res.data[keys[k]].qnty===appr.data.qnty) {
                                $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.ordperiod').text(appr.period );
                                $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.appr_div').attr('approved', that.date);
                                $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.appr_div').css('visibility', 'visible');
                                $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.ordperiod').css('visibility', 'visible');
                            }
                        });

                        let qnty = res.data[keys[k]].qnty;
                        $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('button').text(qnty);
                        let price = res.data[keys[k]].price;
                        $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.item_price').text(price);
                        let pack = res.data[keys[k]].pack;
                        $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.item_pack').text(pack);
                        $('.item_title[data-translate='+keys[k]+']').closest('.menu_item').attr('ordered','');
                    }
                }
            }

            $('.menu_item').find('li').on('click', function (ev) {
                this.changed = true;
                if($(ev.target).text()!=='0'){
                    $(this).closest('.menu_item').attr('ordered',$(ev.target).text());
                    $('li.publish_order.disabled').removeClass('disabled');
                }else{
                    $(this).closest('.menu_item').removeAttr('ordered');
                    if($('.menu_item[ordered]')[0]) {
                        $('li.publish_order.disabled').removeClass('disabled');
                    }else{
                        $('li.publish_order').addClass('disabled');
                    }
                }
            })
        });
    }

    GetOrderItems(){
        let that = this;
        let obj = {data:{}};
        $('.menu_item[ordered]').each(function (index, val) {
            if($(this).attr('ordered')==='0'){
                return;
            }
            obj.data[$(val).find('.item_title').attr('data-translate')] = {
                qnty: $(val).find('button[data-toggle=dropdown]').text(),
                price: $(val).find('.item_price').text(),
                pack: $(val).find('.item_pack').text()
            }

        });

        if($('#offer_order_clone').find('.comment')[0])
            obj['comment'] = $('#offer_order_clone').find('.comment')[0].value;
        obj['supuid'] = this.uid;
        obj['cusuid'] = window.user.uid;
        obj['date'] = this.date;
        obj['period'] = $('.sel_period').text();
        obj['address'] = $('#offer_order_clone').find('.address').val();
        obj['published'] = this.published;

        return obj;
    }

    SaveOrder(ev, lang) {

        let that = ev.data;
        let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');//class_obj.date;
        let items = this.GetOrderItems();
        window.user.UpdateOrderLocal( items );

        window.user.PublishOrder(items, (data) => {
            let status = window.dict.getDictValue(window.sets.lang, Object.keys(data)[1]);
            $(that.ovc).find('.ord_status').css('color', 'white');
            $(that.ovc).find('.ord_status').text(status + "\r\n" + data.published);
            that.status = Object.keys(data)[1];
            window.db.GetSettings(function (obj) {
                obj[0].address = items.address;
                window.db.SetObject('setStore', obj[0], function () {

                });
            });
        });
    }
}



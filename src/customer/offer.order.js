'use strict'
export {OfferOrder}

var urlencode = require('urlencode');
require('jquery-ui')
require('jquery-ui-touch-punch');
require('jquery.ui.touch');
require('bootstrap/js/tooltip.js');
require('bootstrap/js/tab.js');

let _ = require('lodash')
// require('bootstrap/dist/css/bootstrap.css');
// require('font-awesome/css/font-awesome.css');

require("../../lib/bootstrap-rating/bootstrap-rating.js")

import {Dict} from '../dict/dict.js';

const langs = require("../dict/languages");

// var moment = require('moment');

var md5 = require('md5');
var isJSON = require('is-json');

import {utils} from "../utils/utils";


class OfferOrder {

    constructor(){
        let that = this;
        this.changed = false;
        this.offer ;

        this.arCat = [];

        this.location = [];

        this.address;

        this.active_class = 'w3-border w3-border-grey w3-round-large';

        this.ovc = $("#offer_order");

        this.ovc.draggable();
        this.ovc.resizable({
            //aspectRatio: 16 / 9
        });

        $(this.ovc).addTouch();

        this.ovc.find('.modal-title-date').text($('.dt_val')[0].value.split(' ')[0]);

        $(this.ovc).find('.publish_order').off('click touchstart');
        $(this.ovc).find('.publish_order').on('click touchstart',this,function (ev) {
            let that = ev.data;
            let items = ev.data.GetOrderItems(ev.data.lang,true);
            window.user.PublishOrder(items,(data)=> {
                let status = window.dict.getDictValue(window.sets.lang,Object.keys(data)[1]);
                // $(that.ovc).find('.ord_status').css('color','white');
                $(that.ovc).find('.ord_status').text(status + "\r\n"+ data.published);
                that.status = Object.keys(data)[1];

                window.db.GetSettings(function (obj) {
                    obj[0].address = items.address;
                    window.db.SetObject('setStore',obj[0], function () {

                    });
                });
            });
        });

        $(this.ovc).find('.close_browser').on('click touchstart', this, function (ev) {
            let that = ev.data;

            if(!that.SaveOrder(ev,window.sets.lang))
                return false;
            that.offer = '';
            $(that.ovc).find('.add_tab_div').empty();
            $(that.ovc).find('.div_tab_inserted').remove();
            $(that.ovc).find('.tab_inserted').remove();
            $(that.ovc).find('.rating_container').empty();
            $(that.ovc).find('.pack_list').empty();

            $(that.ovc).css('display','none');
        });

    }


    OpenOffer(obj) {
        let that = this;
        this.uid = obj.uid;
        this.profile = obj.profile;
        this.offer = obj.data;
        obj.supuid = obj.uid;
        this.rating = obj.rating;
        let latlon = [obj.latitude,obj.longitude];

        this.ovc.css('display','block');

        this.ovc.find('.rating_container').append('<input type="hidden" class="rating"   data-filled="fa fa-star fa-3x  custom-star" data-empty="fa fa-star-o fa-3x  custom-star"/>');
        this.ovc.find('.rating').rating('rate',obj.rating);
        //this.ovc.find('.custom-star').val(obj.rating);

        $('.email').text(obj.profile.email);
        $('.name').css('display','block').text(obj.profile.name?obj.profile.name:obj.profile.email.split('@')[0]);
        window.db.GetSupApproved(obj.uid, function (res) {
            that.appr = res;
        });

        this.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
        this.period = obj.period;

        window.dict.set_lang(window.sets.lang,this.ovc[0]);

        this.dict = new Dict(obj.dict.dict);
        const options = {
            componentRestrictions: {country: "ru", "city":"Moscow"}
        };

        window.user.profile.OpenSupplierProfile(this,$(that.ovc), that.rating);

        this.ovc.find('.avatar').attr('src',obj.profile.avatar);

        this.ovc.find('.toolbar').css('display', 'block');

        this.ovc.find('li.publish_order').addClass('disabled');

        if(obj.profile.type==='marketer')
           this.ovc.find('.address').css('display','none');
        else
           this.ovc.find('.address').css('display','block');

        window.db.GetSettings(function (obj) {
            if(obj[0].profile && obj[0].profile.address)
                that.ovc.find('.address').val(obj[0].profile.address);
        });

        $(".category[state='1']").each(function (i, cat) {
            let tab = $(cat).text();
        //for (let tab in this.offer) {
            if(!tab || !that.offer[tab])
                return;
            if($('[href="#'+tab+'"]').length===0) {
                $('<li class="tab_inserted"><a data-toggle="tab"  contenteditable="false" data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a>' +
                    '</li>').insertBefore(that.ovc.find('#add_tab_li'));
                $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted dropdown" style="border: none">' +
                    '</div>').insertBefore(that.ovc.find('#add_tab_div'));
            }

            for (let i in that.offer[tab]) {

                let menu_item  = $('#menu_item_tmplt').clone();
                $(menu_item).attr('id', tab + '_' + i);

                $(menu_item).attr('class','menu_item');
                $(menu_item).css('display', 'block');

                $(menu_item).find('.item_title').attr('contenteditable', 'false');
                //$(menu_item).find('.item_price').attr('contenteditable', 'true');//TODO:for premium tariff

                $(menu_item).find('.item_price').text(that.offer[tab][i].price);

                $(menu_item).find('.item_content').attr('id', 'content_' + tab + '_' + i);
                $(menu_item).find('.item_title').attr('data-target','#content_' + tab + '_' + i);

                $(menu_item).find('.amount').val(0);
                $(menu_item).find('.amount').text(0);


                if(that.offer[tab][i].title){
                    $(menu_item).find('.item_title').attr('data-translate', that.offer[tab][i].title);
                }

                $(menu_item).find('.content_text').attr('contenteditable', 'false');
                if(that.offer[tab][i].content_text)
                    $(menu_item).find('.content_text').attr('data-translate',that.offer[tab][i].content_text.value);
                if(that.offer[tab][i].content_text)
                    $(menu_item).find('.content_text').css('visibility','visible');

                if(that.offer[tab][i].img) {
                    $(menu_item).find('.img-fluid').css('visibility', 'visible');
                    $(menu_item).find('.img-fluid').attr('src', that.offer[tab][i].img.src);
                }

                $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);

                let setPrice = function (packlist, mi) {
                    if(mi) menu_item = mi;
                    $(menu_item).find('.pack_list').empty();
                    let pl = packlist;
                    let ml = that.offer[tab][i].markuplist;
                    $(menu_item).find('.item_pack').attr('packlist', JSON.stringify(pl));
                    for (let p in pl) {
                        if (!i)
                            continue;
                        let ml_val;
                        if(!ml || !ml[p])
                            ml_val = 0;
                        else
                            ml_val= parseInt(ml[p]);
                        let data = parseInt(pl[p])+ml_val;

                        $(menu_item).find('.item_price').attr('base', pl[p]);
                        pl[p] = data;
                        $(menu_item).find('.dropdown').css('visibility', 'visible');
                        $(menu_item).find('.pack_list').append("<li href='#'><a role='packitem' >" + p + "</a></li>");
                        $(menu_item).find('.item_pack').text(p);
                        $(menu_item).find('.caret').css('visibility', 'visible');
                        $(menu_item).find('.pack_list').addClass('dropdown-menu');
                        $(menu_item).find('.item_pack').attr('data-toggle', 'dropdown');
                        //$(menu_item).find('.item_pack').addClass('dropdown-toggle');
                        $(menu_item).find('.item_pack').attr('pack', p);

                        $(menu_item).find('.item_price').text(data);
                    }
                }

                if(that.offer[tab][i].owner) {
                    $(menu_item).find('.item_title').attr('owner', that.offer[tab][i].owner);
                    window.db.GetSupplier(new Date(window.user.date),that.offer[tab][i].owner,function (offer) {
                        let title = that.offer[tab][i].title;
                        let incl = _.find(offer.data[tab],{title:title});
                        setPrice(incl.packlist,menu_item);

                        $(menu_item).find('li>a[role=packitem]').on('click', {that: that, off:incl},function(ev){
                            that.changed = true;
                            let pl = incl.packlist;
                            $(menu_item).find('.item_pack').text($(ev.target).text());
                            $(menu_item).find('.item_price').text(pl[$(ev.target).text()]);
                        });

                        $(menu_item).find('.content_text').attr('contenteditable', 'false');
                        if(incl.content_text)
                            $(menu_item).find('.content_text').attr('data-translate', incl.content_text.value);
                        if(incl.content_text)
                            $(menu_item).find('.content_text').css('visibility','visible');

                        if(incl.img) {
                            $(menu_item).find('.img-fluid').css('visibility', 'visible');
                            $(menu_item).find('.img-fluid').attr('src', incl.img.src);
                            $(menu_item).find('.img-fluid').css('left',!incl.img.left?0:(incl.img.left/incl.width)*100+'%');
                            $(menu_item).find('.img-fluid').css('top', !incl.img.top?0:incl.img.top);
                        }

                        $.each(incl.cert, function (ind, data) {
                            let img = new Image();
                            img.src = data.src;
                            //$(img).offset(data.pos); TODO:
                            img.height = '100';
                            $(menu_item).find('.gallery').append(img);
                            $(img).on('click', that.onClickCert);
                        });

                        that.ovc.find('#' + tab).append(menu_item);
                        that.dict.dict = Object.assign(offer.dict.dict,that.dict.dict);
                        that.dict.set_lang(window.sets.lang,that.ovc[0]);
                    });

                }else{
                    setPrice(that.offer[tab][i].packlist);
                    that.ovc.find('#' + tab).append(menu_item);
                }

                $(menu_item).find('li>a[role=packitem]').on('click', {that: that, off:that.offer[tab][i]},function(ev){
                    that.changed = true;
                    let pl = ev.data.off.packlist;
                    $(menu_item).find('.item_pack').text($(ev.target).text());
                    $(menu_item).find('.item_price').text(pl[$(ev.target).text()]);
                });

                $(menu_item).find('.item_content').on('shown.bs.collapse', function (e) {
                    $(this).find('.content').off();
                    $(this).find('.content').on( 'change keyup keydown paste cut', 'textarea', function (){
                        $(this).height(0).height(this.scrollHeight);
                    }).find( 'textarea' ).change();
                });

                for(let c in that.offer[tab][i].cert) {
                    let img = new Image();
                    img.src = that.offer[tab][i].cert[c].src;
                    //$(img).offset(data.pos); TODO:
                    img.height = '100';
                    $(menu_item).find('.gallery').append(img);
                    $(img).on('click', that.onClickCert);
                }

                if ($(menu_item).find('.item_content').css('display') === 'block'
                    && $(menu_item).find('.img-fluid').attr('src')===''
                    && $(menu_item).find('.content_text').text()===""){
                    $(menu_item).find('.item_content').slideToggle("fast");
                }
            }
        });


        this.RedrawOrder(obj);

        this.dict.set_lang(window.sets.lang,that.ovc[0]);
        // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');

        $($('.tab_inserted a')[0]).tab('show');

        window.db.GetSupOrders(new Date(this.date),obj.uid,function (arObj) {
            if(arObj.length>0){
                for(let o in arObj) {
                    let order = arObj[o];
                    that.address = order.address;

                    if (!that.address) {
                        window.user.map.geo.SearchPlace(latlon, 18, function (obj) {
                            that.address = obj;
                            if(obj.city && obj.street && obj.house)
                                $('.address').val(obj.city+ "," + obj.street + "," + obj.house);
                        });
                    } else {
                        if(that.address)
                            $(that.ovc).find('.address').val(that.address);
                    }

                    if(order.published) {
                        that.published = order.published;
                        let status = window.dict.getDictValue(window.sets.lang, "published");
                        //$(that.ovc).find('.ord_status').css('color', 'white');
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

    }

    onClickCert(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if(!$(this).attr('height'))
            $(this).attr('height','100');
        else {
            $(this).removeAttr('height');
        }
        return false;
    };


    RedrawOrder(obj){
        let that = this;
        window.db.GetOrder(new Date(this.date), obj.uid, window.user.uid, function (res) {
            if(res!==-1){
                let keys = Object.keys(res.data);
                //$('.sel_period').text(res.period);
                for(let k in keys){
                    if(keys[k]==='comment'){
                        $('.comment').text(that.dict.getDictValue(window.user.lang, res.data.comment));
                    }else {
                        window.db.GetApproved(new Date(that.date),obj.uid,window.user.uid,keys[k],function (appr) {
                            if(appr &&
                                //res.period ===appr.period &&
                                res.data[keys[k]].price===appr.data.price &&
                                res.data[keys[k]].pack===appr.data.pack &&
                                res.data[keys[k]].qnty===appr.data.qnty) {
                                $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.ordperiod').text(appr.period );
                                $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.approved').attr('approved', that.date);
                                $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.period_div').css('visibility', 'visible');

                                //$('.address').attr('disabled','true');
                                // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.increase').css('visibility','hidden');
                                // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.reduce').css('visibility','hidden');
                                // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.item_pack').attr('data-toggle','');
                            }
                        });


                        if(res.data[keys[k]].qnty>0) {
                            $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.amount').val(res.data[keys[k]].qnty);
                            $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.amount').text(res.data[keys[k]].qnty);

                            let price = res.data[keys[k]].price;
                            $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.item_price').text(price);
                            let pack = res.data[keys[k]].pack;
                            $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.item_pack').text(pack);
                            $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').attr('ordered', '');
                        }
                    }
                }
            }
        });
    }

    GetOrderItems(){
        let that = this;

        let obj = {data:{}};
        $('.menu_item').each(function (index, val) {

            let tab = $(val).closest('.tab-pane').attr('id');

            if(parseInt($(val).find('button.amount').val())!==0 &&  parseInt($(val).find('button.amount').text())===0){
                $(val).attr('deleted', true);
            }else if(parseInt($(val).find('button.amount').text())===0){
                return;
            }

            obj.data[$(val).find('.item_title').attr('data-translate')] = {
                cat:tab,
                owner:$(val).find('.item_title').attr('owner'),
                qnty: parseInt($(val).find('button.amount').text()),
                price: $(val).find('.item_price').text(),
                pack: $(val).find('.item_pack').text().trim(),
                status:$(val).attr('deleted')?'deleted':'published'
            }

            if($('#offer_order').find('.comment')[0])
                obj['comment'] = $('#offer_order').find('.comment')[0].value;
            obj['supuid'] = that.uid;
            obj['cusuid'] = window.user.uid;
            obj['date'] = that.date;
            obj['period'] = $('.sel_period').text();
            obj['address'] = $('#offer_order').find('.address').val();

        });

        return obj;
    }

    SaveOrder(ev, lang) {

        let that = ev.data;
        let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');//class_obj.date;
        let items = this.GetOrderItems();

        let q =  _.findKey(items.data, function(o) { return o.qnty >0; });
        if(q)
            if(that.profile.type==='deliver' && !$('#offer_order').find('.address').val()){
                alert($('#offer_order').find('.address').attr('placeholder'));
                return false;
            }
        if(items.date) {
            window.user.UpdateOrderLocal(items);

            window.user.PublishOrder(items, (data) => {
                let status = window.dict.getDictValue(window.sets.lang, Object.keys(data)[1]);
                //$(that.ovc).find('.ord_status').css('color', 'white');
                $(that.ovc).find('.ord_status').text(status + "\r\n" + data.published);
                that.status = Object.keys(data)[1];
                window.db.GetSettings(function (obj) {
                    ;
                });
            });
        }

        return true;
    }
}



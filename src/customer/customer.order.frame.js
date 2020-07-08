'use strict'

import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';

const EventSource = NativeEventSource || EventSourcePolyfill;
// OR: may also need to set as global property
window.EventSource =  NativeEventSource || EventSourcePolyfill;

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');
require('bootstrap');
require('bootstrap-select');
require("../../lib/bootstrap-rating/bootstrap-rating.js")
require("../../lib/jquery-comments-master/js/jquery-comments.js");

import {Dict} from '../dict/dict.js';

import {Utils} from "../utils/utils";
let utils = new Utils();

import proj from 'ol/proj';
// require('jquery.nicescroll')
var moment = require('moment/moment');

let _ = require('lodash')

var md5 = require('md5');

$(window).on('load', () => {
    let iOSdevice = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)
    if (iOSdevice)
        $('[role="tablist"] .nav-link').each((i,e) => {
            if (!$(e).attr('href'))
                $(e).attr('href', $(e).data('target'))
        });

});

    $.fn.autoResize = function(options) {

        // Just some abstracted details,
        // to make plugin users happy:
        var settings = $.extend({
            onResize : function(){},
            animate : true,
            animateDuration : 150,
            animateCallback : function(){},
            extraSpace : 20,
            limit: 1000
        }, options);

        // Only textarea's auto-resize:
        this.filter('textarea').each(function(){

            // Get rid of scrollbars and disable WebKit resizing:
            var textarea = $(this).css({resize:'none','overflow-y':'hidden'}),

                // Cache original height, for use later:
                origHeight = textarea.height(),

                // Need clone of textarea, hidden off screen:
                clone = (function(){

                    // Properties which may effect space taken up by chracters:
                    var props = ['height','width','lineHeight','textDecoration','letterSpacing'],
                        propOb = {};

                    // Create object of styles to apply:
                    $.each(props, function(i, prop){
                        propOb[prop] = textarea.css(prop);
                    });

                    // Clone the actual textarea removing unique properties
                    // and insert before original textarea:
                    return textarea.clone().removeAttr('id').removeAttr('name').css({
                        position: 'absolute',
                        top: 0,
                        left: -9999
                    }).css(propOb).attr('tabIndex','-1').insertBefore(textarea);

                })(),
                lastScrollTop = null,
                updateSize = function() {

                    // Prepare the clone:
                    clone.height(0).val($(this).val()).scrollTop(10000);

                    // Find the height of text:
                    var scrollTop = Math.max(clone.scrollTop(), origHeight) + settings.extraSpace,
                        toChange = $(this).add(clone);

                    // Don't do anything if scrollTip hasen't changed:
                    if (lastScrollTop === scrollTop) { return; }
                    lastScrollTop = scrollTop;

                    // Check for limit:
                    if ( scrollTop >= settings.limit ) {
                        $(this).css('overflow-y','');
                        return;
                    }
                    // Fire off callback:
                    settings.onResize.call(this);

                    // Either animate or directly apply height:
                    settings.animate && textarea.css('display') === 'block' ?
                        toChange.stop().animate({height:scrollTop}, settings.animateDuration, settings.animateCallback)
                        : toChange.height(scrollTop);
                };

            // Bind namespaced handlers to appropriate events:
            textarea
                .unbind('.dynSiz')
                .bind('keyup.dynSiz', updateSize)
                .bind('keydown.dynSiz', updateSize)
                .bind('change.dynSiz', updateSize);

        });

        // Chain:
        return this;

    };

$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        window.alert('В этом браузере нет поддержки EventSource.');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }


    console.log($('#cus_link').attr('href'));
    if(window.parent.sets.css)
        $('#cus_link').attr('href', '../css/' + window.parent.sets.css+'.css?v='+String(Date.now()));


    window.InitCustomerOrder = function (data, targ_title) {
        window.cus_oder = new CustomerOrder();
        window.cus_oder.openFrame(data,targ_title, function () {

        });

        window.cus_oder.InitRating();
    };


});

export class CustomerOrder{
    constructor(){

        this.path  ="http://localhost:63342/d2d/server";
        if(host_port.includes('nedol.ru'))
            this.path = host_port;

        this.ovc = $('body');

        this.ovc.find('.nav-link').on('click touchstart', function (ev) {
            // $('#sup_profile_container').css('display','block');
            let href = $(this).attr('href');
            $(href).css('display','block');

            href = $(this).closest('.nav').find('.active').attr('href');

            $(href).css('display','none');
        });

    }

    openFrame(obj, targ_title, cb) {

        let that = this;
        this.uid = obj.uid;
        this.profile = obj.profile;
        this.offer = obj.data;
        obj.supuid = obj.uid;
        this.rating = obj.rating;
        let latlon = [obj.latitude,obj.longitude];
        let diff =  new Date().getTime() - new Date(obj.published).getTime();
        let days = Math.floor(diff / (1000 * 60 * 60 * 24));
        let isDelayed =  days  - 30;//week after publication
        this.ovc.css('display','block');
        this.last = 0;

        let type= {'ru':'самовывоз ','en':'Pickup'}[window.parent.sets.lang];
        if(this.profile.type==="deliver")
            type= {'ru':'доставку ','en':'Delivery'}[window.parent.sets.lang];

        if(isDelayed)
            this.ovc.find('.actual_price').text({'ru':'Цены на '+type ,'en': type+' Prices For '}[window.parent.sets.lang]+obj.published.split('T')[0]);

        this.ovc.find('#shop_name').text(obj.profile.name);

        this.ovc.find('.rating_container').append('<input type="hidden" class="rating"   data-filled="fa fa-star fa-3x  custom-star" data-empty="fa fa-star-o fa-3x  custom-star"/>');
        this.ovc.find('.rating').rating('rate',obj.rating);
        this.ovc.find('.custom-star').val(obj.rating);
        this.moveend;

        $('#client_frame_container',window.parent.document).css('height','100%');

        $('#address_loc').on('click',this,(ev)=> {
            let h = $('#address_loc').parent().offset().top+$('#address_loc').width()+2;
            if( parseInt($('#client_frame_container',window.parent.document).css('height'))<100){
                $('#client_frame_container',window.parent.document).css('height','100%');
                $(window.parent.user.map.ol_map).off('moveend');
                if($('#address').val().includes(';'))
                    window.parent.user.map.geo.SearchPlace($('#address').val().split(';'),19,function (res) {
                        $('#address').val(res.city+','+res.street+','+res.house);
                    });
            }else {
                $('#client_frame_container', window.parent.document).css('height', h);
                $(window.parent.user.map.ol_map).on('moveend', (ev) => {
                    that.moveend = ev;
                    let loc = proj.toLonLat(ev.target.focus_);
                    $('#address').attr('loc', JSON.stringify([loc[1], loc[0]]));
                    $('#address').val(String(loc[1].toFixed(6)) + ';' + String(loc[0].toFixed(6)));
                });
                console.log();
            }
        });


        $('a[data-toggle="tab"]').on('click touchstart',(ev)=> {
            $('#client_frame_container',window.parent.document).css('height','100%');
            $(window.parent.user.map.ol_map).off('moveend');
            if($('#address').val().includes(';'))
                window.parent.user.map.geo.SearchPlace($('#address').val().split(';'),19,function (res) {
                    $('#address').val(res.city+','+res.street+','+res.house);
                });
        });

        this.ovc.find('#close_frame').off();
        this.ovc.find('#close_frame').on('click touchstart', this, function (ev) {
            let that = ev.data;

            ev.preventDefault();
            ev.stopPropagation();

            let items = that.GetOrderItems();
            let profile = {
                type: window.parent.user.profile.profile.type,
                email: $('#email').val().toLowerCase(),
                avatar: $('.avatar')[0].src.split('/')[5],
                lang: window.parent.user.profile.profile.lang,
                name: $('#name').val(),
                worktime: $('#worktime').val(),
                mobile: $('#mobile').val(),
                place: $('#place').val(),
                delivery: $('#delivery').val()
            }

            if(Object.keys(items.data).length===0){
                $('.menu_item').remove();
                $(frameElement).css('display','none');
                $('#client_frame_container',window.parent.document).css('display','none');
                return;
            }

            if(!that.offer ||
                md5(JSON.stringify(profile)) !== md5(JSON.stringify(that.profile))) {

                let lang = window.parent.sets.lang;
                let confirm = window.confirm({"ru":"Сохранить заказ?","en":"Save the order?"}[lang]);

                if(confirm) {
                    if(that.profile.type==='deliver' && !$('#address').val()){
                        alert($('#address').attr('placeholder'));
                        $('#address').focus();
                        return;
                    }
                    that.SaveOrder(items,function (res) {
                        if(res) {
                            $('.menu_item').remove();
                            $(frameElement).css('display', 'none');
                            $('#client_frame_container', window.parent.document).css('display', 'none');
                        }
                    });
                }else{
                    $('.menu_item').remove();
                    $(frameElement).css('display','none');
                    $('#client_frame_container',window.parent.document).css('display','none');
                }
            }else{
                $(frameElement).css('display','none');
                $('#client_frame_container',window.parent.document).css('display','none');
            }
        });

        this.ovc.find('.name').css('display','block').text(obj.profile.name?obj.profile.name:obj.profile.email.split('@')[0]);
        window.parent.db.GetSupApproved(obj.uid, function (res) {
            that.appr = res;
            that.FillProfile(obj);
        });

        this.date = window.parent.user.date;
        this.period = obj.period;

        window.parent.dict.set_lang(window.parent.sets.lang,this.ovc[0]);

        this.dict = new Dict(obj.dict.dict);
        const options = {
            componentRestrictions: {country: "ru", "city":"Moscow"}
        };

        this.ovc.find('.toolbar').css('display', 'block');

        this.ovc.find('li.publish_order').addClass('disabled');

        if(obj.profile.type==='deliver')
            this.ovc.find('#address').parent().css('display','block');

        this.ovc.find('.tab-content').on('scroll', function (ev) {
            that.ovc.find(".carousel_collapse").css('display','none');
        });

        $('.nav-tabs a').on('shown.bs.tab', function(event){
            var x = $(event.target).text();         // active tab
            var y = $(event.relatedTarget).text();  // previous tab
        });

        window.parent.db.GetSettings(function (obj) {
            if(obj[0].profile && obj[0].profile.address)
                that.ovc.find('#address').val(obj[0].profile.address);
        });


        function initOrder(targ_title){
            $(".category",window.parent.document).each(function (i, cat) {

                if(i==0)
                    openTab(cat, 'active');
                else{
                    setTimeout(function (cat) {
                        openTab(cat);
                    },0, cat);
                }

                setTimeout(function () {
                    let empty = $('#menu_item_tmplt').clone();
                    // $(empty).addClass('menu_item');
                    $(empty).attr('id', 'menu_item_empty');
                    $(empty).insertAfter($('#' + $(cat).attr('cat') + '_' + String($(".menu_item[id^='"+$(cat).attr('cat')+"']").length-1)));

                    if(targ_title){
                        let dict_val = that.dict.getValByKey(window.parent.sets.lang,targ_title);
                        let tab = $(".item_title:contains('"+dict_val+"')").closest('.tab-pane').attr('id');
                        $('.nav-link[href="#'+tab+'"]').trigger('click');
                        $('#'+tab).find('.card-link').trigger('click');
                    }else{
                        $($('.nav-link')[0]).trigger('click');
                        // $('.card-link').trigger('click');
                    }


                }, 500);

            });

            function openTab(cat, active) {
                let cat_title = $(cat).attr('cat');
                let cat_id = $(cat).attr('id');
                let cat_img = $(cat).attr('src');
                let state = '';
                let cat_tab ;
                if(that.offer[cat_id]){
                    cat_tab = cat_id;
                }else if(that.offer[cat_title]){
                    cat_tab = cat_title;
                    cat_id = cat_title;
                }else{
                    return;
                }

                if ($('[href="#tab_' + cat_tab + '"]').length === 0) {
                    $('<li class="'+active+'" tab_inserted nav-item " '+state+'>' +
                        '<img class="nav-link" data-toggle="tab"  contenteditable="false" data-translate="' + md5(cat_tab) + '"  href="#tab_' + cat_tab + '" src="'+cat_img+'"  title="'+cat_tab+'">' +
                        '</li>').insertBefore(that.ovc.find('#add_tab_li'));
                    $(
                        '<div id="tab_' + cat_tab + '" class="tab-pane div_tab_inserted" style="border: border: 1px solid grey;">' +
                            '<div id="accordion">'+
                            '</div>'+
                        '</div>').insertBefore(that.ovc.find('#add_tab_div'));
                }

                // $('#'+tab).niceScroll();

                for (let i in that.offer[cat_id]) {
                    setTimeout(function(){
                        openItem(cat_id,i);
                    },100);
                }
            }

            function openItem(cat_tab,i) {

                    let menu_item = $('#menu_item_tmplt').clone();
                    $(menu_item).attr('id', cat_tab + '_' + i);

                    $(menu_item).attr('class', 'menu_item');
                    $(menu_item).css('display', 'block');

                    if(that.offer[cat_tab][i].brand){

                        if($('#tab_' + cat_tab).find('img[src="'+that.offer[cat_tab][i].brand.logo+'"]').length===0) {

                            $('#tab_' + cat_tab).find('#accordion').append
                            ('<div class="card">' +
                                '<div class="card-header sticky">' +
                                    '<a class="card-link" data-toggle="collapse" href="#tab_'+cat_tab+ that.offer[cat_tab][i].brand.logo.split('/')[5] + '">' +
                                    '<img src="' + that.offer[cat_tab][i].brand.logo + '"  height="40px"/>' +
                                '</div>' +
                                '<div id="tab_'+cat_tab+that.offer[cat_tab][i].brand.logo.split('/')[5]+'" class="collapse" data-parent="#accordion">'+
                                    '<div class="card-body">'+
                                    '</div>'+
                                '</div>'+
                                '<p class="item_cnt">0</p>'+
                            '</div>');
                        }
                    }

                    if(that.offer[cat_tab][i].brand){
                        if(targ_title===that.offer[cat_tab][i].title)
                            $('#tab_'+cat_tab+that.offer[cat_tab][i].brand.logo.split('/')[5]).find('.card-body').prepend(menu_item);
                        else
                            $('#tab_'+cat_tab+that.offer[cat_tab][i].brand.logo.split('/')[5]).find('.card-body').append(menu_item);
                    }else{
                        if(targ_title===that.offer[cat_tab][i].title)
                            that.ovc.find('#tab_' + cat_tab).prepend(menu_item);
                        else
                            that.ovc.find('#tab_' + cat_tab).append(menu_item);
                    }

                    // $(menu_item).find('.item_title').attr('contenteditable', 'false');
                    //$(menu_item).find('.item_price').attr('contenteditable', 'true');//TODO:for premium tariff


                    $(menu_item).find('.item_content').attr('id', 'content_' + cat_tab + '_' + i);
                    $(menu_item).find('.item_title').attr('data-target', '#content_' + cat_tab + '_' + i);

                    //$(menu_item).find('.item_title').append("<a class='dropdown-item' role='packitem'>0</a>");


                    $(menu_item).find('.item_title').on('click',function (el) {
                        $(menu_item).find('.item_content').collapse("toggle");
                    });

                    $(menu_item).find('.ord_amount').val(0);
                    $(menu_item).find('.ord_amount').text(0);
                    $(menu_item).find('.extra_amount').val(0);
                    $(menu_item).find('.extra_amount').text(0);

                    // if($('[data-translate="'+that.offer[cat_tab][i].title+'"]').length>0)
                    //     return; TODO: дублирование продукта по названию
                    if (that.offer[cat_tab][i].title) {
                        $(menu_item).find('.item_title').attr('data-translate', that.offer[cat_tab][i].title);
                    }


                    if(!that.offer[cat_tab][i].packlist)
                        return;


                    if (that.offer[cat_tab][i].content_text.value && that.offer[cat_tab][i].content_text.value!=='d41d8cd98f00b204e9800998ecf8427e') {
                        $(menu_item).find('.item_title').siblings('span').css('display','block');
                        $(menu_item).find('.content_text').attr('contenteditable', 'false');
                        $(menu_item).find('.content_text').attr('data-translate', that.offer[cat_tab][i].content_text.value);
                    }

                    // if (that.offer[cat_tab][i].img) {
                    //     let src = '';
                    //     if(!that.offer[cat_tab][i].img.src.includes('http')) {
                    //         if(that.offer[cat_tab][i].img.src==='empty.png'){
                    //             src = "../images/empty.png";
                    //         }else {
                    //             src = that.path + "/images/" + that.offer[cat_tab][i].img.src;
                    //         }
                    //     }else
                    //         src = that.offer[cat_tab][i].img.src;
                    //
                    //     $(menu_item).find('.img-fluid').parent().css('display', 'block');
                    //     $(menu_item).find('.img-fluid').attr('src', src);
                    //
                    // }

                    //$(menu_item).find('.img-fluid').attr('id', 'img_' + cat_tab + '_' + i);

                    let setPrice = function (packlist, mi) {
                        if (mi) menu_item = mi;
                        $(menu_item).find('.pack_list').empty();

                        let pl = utils.ReverseObject(packlist);
                        let ml = that.offer[cat_tab][i].markuplist;
                        $(menu_item).find('.pack_btn').attr('packlist', JSON.stringify(pl));
                        for (let p in pl) {
                            if (!i)
                                continue;
                            let ml_val;
                            if (!ml || !ml[p])
                                ml_val = 0;
                            else
                                ml_val = parseFloat(ml[p]);

                            let data;
                            if(pl[p].price)
                                data = window.parent.sets.currency==="₽"?(parseFloat(pl[p].price)+ ml_val):(parseFloat(pl[p].price)+ ml_val).toFixed(2);
                            else
                                data = window.parent.sets.currency==="₽"?(parseFloat(pl[p])+ ml_val):(parseFloat(pl[p])+ ml_val).toFixed(2);

                            if(!data) {
                                $(menu_item).find('.order_container').css('visibility','hidden');
                                continue;
                            }

                            $(menu_item).find('.item_price').attr('base', pl[p].price);
                            if (!$('.carousel_price[title=' + that.offer[cat_tab][i].title + ']').text())
                                $('.carousel_price[title=' + that.offer[cat_tab][i].title + ']').text(data);
                            if(data)
                                pl[p] = data;
                            $('a[href="#tab_' + cat_tab + '"]').css('display', 'block');
                            $(menu_item).find('.dropdown').css('visibility', 'visible');
                            // if(that.profile.type==='deliver' && (!that.offer[cat_tab][i].markuplist || !that.offer[cat_tab][i].markuplist[p]))
                            //     continue;
                            $(menu_item).find('.pack_list').append("<a class='dropdown-item' role='packitem'>" + p + "</a>");
                            $(menu_item).find('.pack_btn').text(p);
                            $(menu_item).find('.pack_btn').attr('pack', p);

                            let price  = {'ru':(data?data:""),'en':(data?data:"")}[window.parent.sets.lang];

                            if(that.offer[cat_tab][i].haggle ==='true') {
                                $(menu_item).find('.item_price').attr('contenteditable', 'true');
                                $(menu_item).find('.item_price').attr('placeholder',price);
                            }else{
                                $(menu_item).find('.item_price').removeAttr('placeholder');
                                $(menu_item).find('.item_price').text(price);
                            }

                            if($(menu_item).find('a.dropdown-item').length>1) {
                                $(menu_item).find('.pack_btn').addClass('dropdown-toggle');
                                $(menu_item).find('.pack_btn').attr('data-toggle','dropdown');
                            }
                        }
                    }


                    if (that.profile.type==='marketer' || that.profile.type==='deliver' || that.profile.type==='foodtruck'){

                        let title = that.offer[cat_tab][i].title;
                        let deliver = $('.deliver_but', window.parent.document).attr('supuid');

                        if (deliver)
                            window.parent.db.GetSupplier(window.parent.user.date, deliver, (obj)=> {
                                let key = _.findKey(obj.data, function (o) {
                                    for (let i in o) {
                                        if (o[i].title !== title || o[i].owner!=that.uid)
                                            continue;
                                        else
                                            return true;
                                    }
                                });
                            });

                        if(isDelayed<0) {
                            setPrice(that.offer[cat_tab][i].packlist);
                        }else{
                            $(menu_item).find('.order_container').css('display','none');
                        }



                        that.dict.set_lang(window.parent.sets.lang, $('#'+$(menu_item).attr('id')));

                        let item_cnt = parseInt($(menu_item).closest('.card').find('.item_cnt').text().replace('(','').replace(')',''));
                        ++item_cnt;
                        $(menu_item).closest('.card').find('.item_cnt').text('('+item_cnt+')');

                        $(menu_item).find('a[role=packitem]').on('click', {off: that.offer[cat_tab][i]}, function (ev) {
                            that.changed = true;
                            $(this).closest('.menu_item').find('.pack_btn').text($(ev.target).text());
                            let pl = ev.data.off.packlist;
                            let price  = {'ru':(pl[$(ev.target).text()]?pl[$(ev.target).text()]:""),
                                'en':(pl[$(ev.target).text()]?(pl[$(ev.target).text()]):'')}[window.parent.sets.lang];
                            if(that.offer[cat_tab][i].haggle ==='true') {
                                $(this).closest('.menu_item').find('.item_price').attr('contenteditable', 'true');
                                $(this).closest('.menu_item').find('.item_price').attr('placeholder',price?price:price.price);
                            }else{
                                $(menu_item).find('.item_price').removeAttr('placeholder');
                                $(this).closest('.menu_item').find('.item_price').text(price?price:price.price);
                            }
                        });


                        if(that.offer[cat_tab][i].img) {
                            let src = that.offer[cat_tab][i].img.src;
                            if (!that.offer[cat_tab][i].img.src.includes('http'))
                                src = that.path + "/images/" + that.offer[cat_tab][i].img.src;
                            if ($(menu_item).find('img[src="' + src + '"]').length === 0) {
                                $(menu_item).find('.carousel-inner').append(
                                    '<div class="carousel-item">' +
                                    '<img  class="carousel-img img-fluid mx-auto d-block" src=' + src + '>' +
                                    '</div>');
                            }
                        }


                        for (let c in that.offer[cat_tab][i].cert) {
                            let src = that.offer[cat_tab][i].cert[c].src;;
                            if(!that.offer[cat_tab][i].cert[c].src.includes('http'))
                                src = that.path + "/images/" + that.offer[cat_tab][i].cert[c].src;
                            if($(menu_item).find('img[src="'+src+'"]').length===0) {
                                $(menu_item).find('.carousel-inner').append(
                                    '<div class="carousel-item">' +
                                    '<img  class="carousel-img img-fluid mx-auto d-block" src=' + src + '>' +
                                    '</div>');
                            }



                            $(menu_item).find('.cert_container').find('img').draggable(
                                {delay:0},
                                {scroll: true},
                                {
                                    create: function( event, ui ) {
                                        $(menu_item).find('.cert_container').find('img').css('left',that.offer[cat_tab][i].cert[c].left);
                                        $(menu_item).find('.cert_container').find('img').css('top',that.offer[cat_tab][i].cert[c].top);
                                    },
                                    start: function (ev) {

                                    },
                                    drag: function (ev) {
                                        return true;
                                        //$(el).attr('drag', true);
                                    },
                                    stop: function (ev) {

                                    }
                                });
                            $(menu_item).find('.cert_container').find('img').draggable( "destroy" );

                        }
                        $($(menu_item).find('.carousel-inner').find('.carousel-item')[0]).addClass('active');
                        $(menu_item).find('.carousel').carousel({interval: 2000});
                        cb();
                    }



                    if ($(menu_item).find('.item_content').css('display') === 'block'
                        && $(menu_item).find('.img-fluid').attr('src') === ''
                        && $(menu_item).find('.card-text').text() === "") {
                        $(menu_item).find('.item_content').slideToggle("fast");
                    }

                    $(menu_item).find('.item_content').on('shown.bs.collapse', function (e) {
                        let h = $(this).closest('.content_div')[0].scrollHeight;
                        $(this).find('.content').off();
                        $(this).find('.content').on('change keyup keydown paste cut', 'textarea', function () {
                            $(this).height(0).height(h - 50);//this.scrollHeight);
                        }).find('textarea').change();
                    });

                    $.each(that.offer[cat_tab][i].extra, function (e, el){
                        if(!el)
                            return;
                        $(menu_item).find('.extra_collapse').css('display','block');
                        let row = $(menu_item).find('.extras').find('.tmplt').clone();
                        $(row).removeClass('tmplt');
                        if(el.title) {
                            $(menu_item).find('.extras').append(row);
                        }
                        $(row).find('.extra_title').text(el.title);
                        $(row).find('.extra_price').text(el.price);
                    });

                $(menu_item).find('.increase').on('click',function (ev) {
                    let amnt = parseInt($(this).siblings('.extra_amount').text())+1;
                    $(this).siblings('.extra_amount').text(amnt);
                });
                $(menu_item).find('.reduce').on('click',function (ev) {
                    if(parseInt($(this).siblings('.extra_amount').text())>0){
                        let amnt = parseInt($(this).siblings('.extra_amount').text())-1;
                        $(this).siblings('.extra_amount').text(amnt);
                    }
                });

                $(menu_item).find('.increase_ord').on('click',function (ev) {
                    let amnt = parseInt($(this).siblings('.ord_amount').text())+1;
                    let price = $(menu_item).find('.item_price').text();
                    if(!price)
                        price = $(menu_item).find('.item_price').attr('placeholder');
                    $(this).siblings('.ord_amount').text(amnt);
                    let cur_pack = $(menu_item).find('.pack_btn').text();
                    $(menu_item).find('.dropdown-item:contains('+cur_pack+')').attr('ordlist',JSON.stringify({qnty:amnt,price:price}));
                });
                $(menu_item).find('.reduce_ord').on('click',function (ev) {
                    if(parseInt($(this).siblings('.ord_amount').text())>0){
                        let amnt = parseInt($(this).siblings('.ord_amount').text())-1;
                        let price = $(menu_item).find('.item_price').text();
                        if(!price)
                            price = $(menu_item).find('.item_price').attr('placeholder');
                        $(this).siblings('.ord_amount').text(amnt);
                        let cur_pack = $(menu_item).find('.pack_btn').text();
                        $(menu_item).find('.dropdown-item:contains('+cur_pack+')').attr('ordlist',JSON.stringify({qnty:amnt,price:price}));
                        if(parseInt($(this).siblings('.ord_amount').text())===0) {
                            $(this).closest('.menu_item').attr('deleted', true);
                            return false;
                        }
                    }
                });

                    that.RedrawOrder(that.uid,menu_item);

            }



            // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');
            $(".collapse").on('shown.bs.collapse', function(ev){
                $(ev.delegateTarget).closest('.card').find('.item_cnt').css('display','none');
            });
            $(".collapse").on('hide.bs.collapse', function(ev){
                $(ev.delegateTarget).closest('.card').find('.item_cnt').css('display','block');
            });

            $('li.active a').tab('show');
            $('.tab_inserted  img:first').tab('show');
            $('.tab_inserted  img:first').addClass('active');

            window.parent.db.GetSupOrders(new Date(that.date), obj.uid, function (arObj) {
                if (arObj.length > 0) {
                    for (let o in arObj) {
                        let order = arObj[o];
                        that.address = order.address;

                        if (!that.address) {
                            window.parent.user.map.geo.SearchPlace(latlon, 18, function (obj) {
                                that.address = obj;
                                if (obj.city && obj.street && obj.house)
                                    $('.address').val(obj.city + "," + obj.street + "," + obj.house);
                            });
                        } else {
                            if (that.address)
                                $(that.ovc).find('#address').val(that.address);
                        }

                        if (order.published) {
                            that.published = order.published;
                            let status = window.parent.dict.getDictValue(window.parent.sets.lang, "published");
                            //$(that.ovc).find('.ord_status').css('color', 'white');
                            $(that.ovc).find('.ord_status').text(status + " " + order.published);
                        }

                        if (order.comment) {
                            $(that.ovc).find('.comment').text(that.dict.getDictValue(window.sets.lang, order.comment));
                        }

                    }
                    if ($('.menu_item[ordered]')[0])
                        $('li.publish_order.disabled').removeClass('disabled');
                }

            });
        };

        setTimeout(function (targ_title) {
            initOrder(targ_title);
            $('.loader', $(window.parent.document).contents()).css('display','none');
            $('textarea').autoResize();
        },200,targ_title);


    }

    onClickImage(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        let mi = $(ev.data);
        $(mi).find('.img-fluid').attr('src',this.src);
        return true;
    };

    FillProfile(obj){
        let profile = obj.profile;

        this.InitSupplierReview(obj);

        // // $('input').prop('readonly', true);
        // // $('input').attr('placeholder', '');
        // $('.avatar').attr('src',this.path+'/server/images/'+profile.thmb);
        $('input').attr('title', '');
        $('#name').val(profile.name);
        $('#email').val(profile.email);
        $('#mobile').val(profile.mobile);
        $('#address').val(profile.address);
        $('#place').val(profile.place);
        $('#worktime').val(profile.worktime);
    }

    InitSupplierReview(sup){
       let lang = window.parent.sets.lang;
       this.InitProfileSupplier({supplier:sup,user:'Customer'},
            {   //comments settings
                readOnly:(sup.appr && sup.appr.cusuid===window.parent.user.uid)?false:true,
                profilePictureURL: this.path+'/images/'+sup.profile.avatar,
                enableEditing: true,
                enableDeleting:false,
                enableReplying: false,
                textareaPlaceholderText: {'en':'Leave Review','ru':'Оставить отзыв'}[lang],
                newestText: {'ru':'Новые','en':'New'}[lang],
                oldestText: {'ru':'Старые','en':'Old'}[lang],
                popularText:{'ru':'Популярные','en':'Popular'}[lang],
                sendText: {'ru':'Послать','en':'Send'}[lang],
                deleteText:  {'ru':'Удалить','en':'Delete'}[lang],
                replyText: {'ru':'Ответить','en':'Reply'}[lang],
                editText: {'ru':'Измененный','en':'Changed'}[lang],
                editedText: {'ru':'Изменить','en':'Change'}[lang],
                youText: {'ru':'Я','en':'Me'}[lang],
                saveText: {'ru':'Сохранить','en':'Save'}[lang],
                hideRepliesText: {'ru':'Скрыть','en':'hide'}[lang],
                noCommentsText: {'ru':'Отзывы отсутствуют','en':'No Reviews'}[window.parent.sets.lang],
                maxRepliesVisible: 5
            });
    }

    InitProfileSupplier(user, settings) {

        this.InitComments(user, settings);
        // this.profile_sup.InitRateSupplier();

        if(!user.supplier.profile.avatar) {
            utils.LoadImage("https://nedol.ru/d2d/dist/images/avatar_2x.png", function (src) {
                $('.avatar').attr('src', src);
            });
        }else{
            $('.avatar').attr('src', this.path+'/images/'+user.supplier.profile.avatar);
            $('#profile_img').attr('src', this.path+'/images/'+user.supplier.profile.avatar);
        }
        // $('img.avatar').after("<h6>Загрузить мою фотографию...</h6>");
        // $('img.avatar').on('click',function (ev) {
        //     $(this).siblings('.file-upload').trigger('click');
        // });
        var readURL = function (input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    $('.avatar').attr('src', e.target.result);
                    $('.avatar').on('load',function (ev) {
                        ev.preventDefault();
                        let k = 70/$(this).height();
                        utils.createThumb_1(this, $(this).width()*k, $(this).height()*k, function (thmb) {
                            $('.avatar').attr('thmb', thmb.src);
                        });
                    });
                    // $('.avatar').on('load',function (ev) {
                    //     let thmb = utils.createThumb_1($('.avatar')[0]);
                    //     $('.avatar').attr('thmb',thmb);
                    // })

                    $('.avatar').siblings('input:file').attr('changed', true);
                }
                reader.readAsDataURL(input.files[0]);
            }
        }


        $(".file-upload").on('change', function () {
            readURL(this);
        });

        // $( "#period_list" ).selectable({
        //     stop: function() {
        //         let result = '';
        //         $( ".ui-selected", this ).each(function(i) {
        //             let index = $( "#period_list li" ).index( this );
        //             if(i===0)
        //                 result = $($( "#period_list li")[index]).text().split(' - ')[0];
        //             if($( ".ui-selected").length===i+1)
        //                 result+=" - "+ $($( "#period_list li")[index]).text().split(' - ')[1];
        //         });
        //         $('.sel_period').val(result);
        //         $( ".sel_period ").dropdown("toggle");
        //
        //     }
        // });

        $('input').prop( "readonly", false );

    }

    InitComments(obj, settings){
        let this_obj = obj;
        $('img.avatar').attr('src', settings.profilePictureURL);
        //settings.profilePictureURL = this.path+'/images/'+this.profile.avatar;
        $('#comments-container').comments(Object.assign(settings,{
            getComments: function(success, error) {
                let par = {
                    proj:'d2d',
                    user:window.parent.user.constructor.name.toLowerCase(),
                    func:'getcomments',
                    supuid:obj.supplier.uid
                }
                window.parent.network.postRequest(par, function (data) {

                    if(data) {
                        var commentsArray = [];
                        for(let i in data) {
                            let com = JSON.parse(data[i].data);
                            commentsArray.push(com);
                        }

                        success(commentsArray);
                    }
                })
            },
            postComment: function(data, success, error) {
                if(window.parent.user.profile && window.parent.user.profile.name) {
                    data['fullname'] = window.parent.user.profile.name;
                }else if(window.parent.user.email){
                    data['fullname'] = window.parent.user.email.split('@')[0];
                }else {
                    data['fullname'] = 'Покупатель';
                }

                data['created_by_current_user'] = false;
                let par = {
                    proj:'d2d',
                    user:window.parent.user.constructor.name.toLowerCase(),
                    func:'setcomments',
                    supuid: this_obj.supplier.uid,
                    cusuid:window.parent.user.uid,
                    data:data
                }
                window.parent.network.postRequest(par, function (res) {
                    if(!res.err) {
                        data['created_by_current_user'] = true;
                        success(saveComment(data));
                    }
                });
            },
            putComment: function(data, success, error) {
                data['created_by_current_user'] = false;
                let par = {
                    proj:'d2d',
                    user: window.parent.user.constructor.name.toLowerCase(),
                    func:'setcomments',
                    supuid:this_obj.supplier.supuid,
                    cusuid:window.parent.user.uid,
                    data:data
                }
                window.parent.network.postRequest(par, function (res) {
                    data['created_by_current_user'] = true;
                    success(saveComment(data));
                });
            },
            deleteComment: function(commentJSON, success, error) {

            }

        }));
        let usersArray;
        let saveComment = function(data) {

            // Convert pings to human readable format
            $(data.pings).each(function(index, id) {
                var user = usersArray.filter(function(user){return user.id == id})[0];
                data.content = data.content.replace('@' + id, '@' + user.fullname);
            });

            return data;
        }

    }

    InitRating() {
        let that = this;
        let data_obj = {
            proj: "d2d",
            user:window.parent.user.constructor.name.toLowerCase(),
            func: "getrating",
            supuid: this.uid
        }
        window.parent.network.postRequest(data_obj, function (data) {
            if (data.rating)
                $('.rating').rating('rate', data.rating);
            that.InitRateSupplier();
        });


    }

    InitRateSupplier(){
        let that = this;

        $('input.rating').on('change', function (ev) {
            let data_obj ={
                proj:"d2d",
                user: window.parent.user.constructor.name.toLowerCase(),
                func:"ratesup",
                cusuid: window.parent.user.uid,
                psw: window.parent.user.psw,
                supuid: that.uid,
                value: $('.rating').val()
            }
            window.parent.network.postRequest(data_obj, function (data) {
                if(data.rating)
                    $('.rating').rating('rate',data.rating);
            });
        });
    }

    RedrawOrder(uid,menu_item){
        let that = this;

        $(menu_item).find('.pack_list').on('click',function (ev) {
            try {
                let obj = JSON.parse($(ev.target).attr('ordlist'));
                if (obj.qnty) {
                    $(menu_item).find('button.ord_amount ').text(obj.qnty);
                }else
                    $(menu_item).find('button.ord_amount ').text(0);
            }catch(ex){
                $(menu_item).find('button.ord_amount ').text(0);
            }

        });
        window.parent.db.GetOrder(new Date(this.date), uid, window.parent.user.uid, function (res) {
            if(res!==-1){
                that.order = res;

                let keys = Object.keys(res.data);
                //$('.sel_period').text(res.period);
                for(let k in keys){
                    if(keys[k]==='comment'){
                        $('.comment').text(that.dict.getDictValue(window.parent.user.lang, res.data.comment));
                    }else {
                        window.parent.db.GetApproved(new Date(that.date),uid,window.parent.user.uid,keys[k],function (appr) {
                            if(appr &&
                                //res.period ===appr.period &&
                                res.data[keys[k]].price===appr.data.price &&
                                res.data[keys[k]].pack===appr.data.pack &&
                                res.data[keys[k]].qnty===appr.data.qnty) {
                                $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.ordperiod').text(appr.period );
                                $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.approved').attr('approved', that.date);
                                $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.period_div').css('visibility', 'visible');

                                $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.item_price').css('color', 'red');

                                //$('.address').attr('disabled','true');
                                // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.increase').css('visibility','hidden');
                                // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.reduce').css('visibility','hidden');
                                // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.pack_btn').attr('data-toggle','');
                            }
                        });

                        if(res.data[keys[k]].ordlist) {

                            let ordlist = res.data[keys[k]].ordlist;
                            for (let q in ordlist) {
                                if (ordlist[q].qnty > 0) {
                                    $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.dropdown-item:contains('+q+')').attr('ordlist',JSON.stringify(ordlist[q]));

                                    $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.ord_amount').val(ordlist[q].qnty);
                                    $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.ord_amount').text(ordlist[q].qnty);

                                    let price = ordlist[q].price;
                                    $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.item_price').text(price);
                                    //$('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.item_price').css('color', 'grey');

                                    $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.pack_btn').text(q);
                                    $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').attr('ordered', '');
                                }
                            }
                        }
                        if(res.data[keys[k]].extralist) {

                            let extralist = res.data[keys[k]].extralist;
                            for (let q in extralist) {
                                if (extralist[q].qnty > 0) {
                                    $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.extra_title:contains("'+q+'")').closest(".row").find('.extra_amount').val(extralist[q].qnty).text(extralist[q].qnty);

                                    let price = extralist[q].price;
                                    //$('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.extra_price').text(price);
                                    //$('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.item_price').css('color', 'grey');

                                    // $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.pack_btn').text(q);
                                    // $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').attr('ordered', '');
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    GetOrderItems(){
        let that = this;

        let obj = {data:{}};
        $('.menu_item').each(function (i, el) {

            let tab = $(el).closest('.tab-pane').attr('id');

            if(parseInt($(el).find('button.ord_amount').val())!==0 &&  parseInt($(el).find('button.amount').text())===0){
                $(el).attr('deleted', true);
            }else if(parseInt($(el).find('button.ord_amount').text())===0){
                return;
            }

            let ordlist = {};
            let ar = $(el).find('.dropdown-item').toArray();
            for(let ddi in ar){
                if($(ar[ddi]).attr('ordlist')) {
                    let ol = JSON.parse($(ar[ddi]).attr('ordlist'));
                    ordlist[$(ar[ddi]).text()] = {qnty: parseInt(ol.qnty), price: ol.price?parseFloat(ol.price):$(ar[ddi]).attr('placeholder')};
                }
            }

            let extralist={};
            $(el).find('.extra_amount').each(function(i,el){
                if(parseInt($(el).text())>0){
                    extralist[$(el).closest('.row').find('.extra_title').text()] = {qnty: parseInt($(el).text()),price:parseFloat($(el).closest('.row').find('.extra_price').text())};
                }
            });


            obj.data[$(el).find('.item_title').attr('data-translate')] = {
                cat:tab.split('_')[1],
                ordlist:ordlist,
                extralist:extralist,
                status:$(el).attr('deleted')?'deleted':'published',
                email: window.parent.user.profile.profile.email,
                mobile: window.parent.user.profile.profile.mobile
            }

            if($('#order_pane').find('.comment')[0])
                obj['comment'] = $('#order_pane').find('.comment')[0].value;
            obj['supuid'] = that.uid;
            obj['cusuid'] = window.parent.user.uid;
            obj['date'] = that.date;
            obj['period'] = that.profile.type==='foodtruck'? moment().add(30, 'm').format('HH:mm'):$(window.parent.document).find('.sel_period').text();
            obj['address'] = $('#address').val();

        });

        return obj;
    }

    SaveOrder(items,cb) {

        let that = this;

        $('.loader').css('display','block');

        if($('#address').val()){
            window.parent.db.GetSettings((obj) =>{
                obj[0].profile.address = $('#address').val();
                window.parent.db.SetObject('setStore', obj[0], (res) => {

                });
            });
        }


        if(Object.keys(items.data).length>0) {

            window.parent.user.PublishOrder(items, (data) => {
                window.parent.user.UpdateOrderLocal(data, function (res) {

                });
                let status = window.parent.dict.getDictValue(window.parent.sets.lang, Object.keys(data)[1]);
                //$(that.ovc).find('.ord_status').css('color', 'white');
                $(that.ovc).find('.ord_status').text(status + "\r\n" + data.published);
                that.status = Object.keys(data)[1];
                $('.loader').css('display','none');
                cb(items);

            });
        }

    }
}
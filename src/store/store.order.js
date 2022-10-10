'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');

require('bootstrap');

import {CartCustomer} from "../customer/customer.cart";

import {Dict} from '../dict/dict.js';

import {Utils} from "../utils/utils";
let utils = new Utils();

let _ = require('lodash')

var md5 = require('md5');

$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        window.alert('В этом браузере нет поддержки EventSource.');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }

    let iOSdevice = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)
    if (iOSdevice)
        $('[role="tablist"] .nav-link').each((i,e) => {
            if (!$(e).attr('href'))
                $(e).attr('href', $(e).data('target'))
        });


    console.log($('#cus_link').attr('href'));
    if(window.parent && window.parent.sets.css)
        $('#cus_link').attr('href', '../css/' + window.parent.sets.css+'.css?v='+String(Date.now()));


    window.InitCustomerOrder = function (data, targ_title) {
        window.order = new StoreOrder();
        window.order.openFrame(data,targ_title, function () {

        });
    };
});


export class StoreOrder{
    constructor(){

        this.path = host_port;

        this.ovc = $('body');

        // this.ovc.find('.nav-link').on('click touchstart', function (ev) {
        //     // $('#sup_profile_container').css('display','block');
        //     let href = $(this).attr('href');
        //     $(href).css('display','block');
        //
        //     href = $(this).closest('.nav').find('.active').attr('href');
        //
        //     $(href).css('display','none');
        // });
    }

    addTab(cat_tab, active){
        let that = this;
        let cat_str = '';
        if($(window.parent.document).contents().find('#'+cat_tab).closest('.cat_div')[0])
            cat_str = $(window.parent.document).contents().find('#'+cat_tab).closest('.cat_div')[0].outerHTML;
        else if(!cat_str)// let cat_str = cat_img?'<img class="nav-link" data-toggle="tab"  contenteditable="false" data-translate="' + md5(cat_tab) + '"  href="#tab_' + cat_tab + '" src="'+cat_img+'"  title="'+cat_tab+'">':
            cat_str =
                '<div class="cat_div  text-center" data-toggle="tab" href="#tab_'+cat_tab+'">'+
                '<span id="'+cat_tab+'" class="category icofont-brand-natgeo"  extra="false" title="'+cat_tab+'" state="0"></span>'+
                '<i class="title">'+cat_tab+'</i>'+
                '<span class="cat_cnt badge badge-pill badge-secondary">0</span>'+
                '</div>';
        if ($('[href="#tab_' + cat_tab + '"]').length === 0) {
            $(cat_str).insertBefore(that.ovc.find('#add_tab_li'));
            $('<div id="tab_' + cat_tab + '" class="tab-pane div_tab_inserted '+active+'" style="border: border: 1px solid grey;">' +
                '<div class="filter_div collapse"></div>'+
                '<div id="accordion"></div>'+
                '<div class="tab_row flex-container"></div>'+
                '</div>').insertBefore(that.ovc.find('#add_tab_div'));
        }
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
        //TODO:
        // let cat_incl = $("#cat_incl",window.parent.document);
        // cat_incl.css('position','relative');
        // cat_incl.find('#categories').css('display','block');
        // cat_incl.insertAfter('#top_nav');

        if($('.kolmi').length===0) {

            let kolmi = $('iframe.kolmi_tmplt').clone();
            $(kolmi).css('display', 'block')
                .attr('class', 'kolmi')
                .attr('src', '../kolmi/kolmi.html?trans=all&role=user&abonent='+obj.profile.email);
            $('iframe.kolmi_tmplt').after(kolmi);
        }

        let type= {'ru':'самовывоз ','en':'Pickup'}[window.parent.sets.lang];
        if(this.profile.type==="deliver")
            type= {'ru':'доставку ','en':'Delivery'}[window.parent.sets.lang];

        if(isDelayed)
            this.ovc.find('.actual_price').text({'ru':'Цены на '+type ,'en': type+' Prices For '}[window.parent.sets.lang]+obj.published.split('T')[0]);

        this.ovc.find('#shop_name').text(obj.profile.name);

        that.FillProfile(obj);

        this.ovc.find('.save').off();
        this.ovc.find('.save').on('click touchstart', this, function (ev) {
            let that = ev.data;

            ev.preventDefault();
            ev.stopPropagation();

            that.GetUserProfileItems();

            let items = that.GetOrderItems();

            if(Object.keys(items.data).length===0){
                $('.menu_item').remove();
                $('.kolmi')[0].contentWindow.CloseFrame();
                $(frameElement).css('display','none');
                $('#client_frame_container',window.parent.document).css('display','none');

                return;
            }

            if(that.offer) {

                let lang = window.parent.sets.lang;
                let confirm = window.confirm({"ru":"Сохранить заказ?","en":"Save the order?"}[lang]);

                if(confirm) {
                    that.SaveOrder(items,function (res) {
                        if(res) {
                            // $('.menu_item').remove();
                            // $('.kolmi')[0].contentWindow.CloseFrame();
                            // $(frameElement).css('display','none');
                            // $('#client_frame_container',window.parent.document).css('display','none');
                            $('.ord_cnt').text(Object.keys(items.data).length);
                        }
                    });

                }else{
                    $('.menu_item').remove();
                    $('.kolmi')[0].contentWindow.CloseFrame();
                    $(frameElement).css('display','none');
                    $('#client_frame_container',window.parent.document).css('display','none');
                }
            }
        });

        window.parent.db.GetSupApproved(obj.uid, function (res) {
            that.appr = res;
            //that.FillSupProfile(obj.profile);
        });

        this.date = window.parent.user.date;
        this.period = obj.period;

        try {
            window.parent.dict.set_lang(window.parent.sets.lang, this.ovc[0]);
        }catch (ex){

        }

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

            let i=0;
            for (let t in that.offer){

                if(i==0) {
                    i++;
                    openTab(t, 'active');
                }else{
                    setTimeout(function (t) {
                        openTab(t,'');
                    },0, t);
                }

                setTimeout(function () {
                    let empty = $('#menu_item_tmplt').clone();
                    // $(empty).addClass('menu_item');
                    $(empty).attr('id', 'menu_item_empty');
                    $(empty).insertAfter($('#' + t + '_' + String($(".menu_item[id^='"+t+"']").length-1)));

                    if(targ_title){
                        let dict_val = that.dict.getValByKey(window.parent.sets.lang,targ_title);
                        let tab = $(".item_title:contains('"+dict_val+"')").closest('.tab-pane').attr('id');
                        //$('.nav-link[href="#'+tab+'"]').trigger('click');
                        //$('#'+tab).find('.card-link').toggle(true);
                    }else{
                        //$($('.nav-link')[0]).trigger('click');

                    }
                }, 500);

            }

            function openTab(t, active) {
                let cat = $(".category#"+t,window.parent.document);

                let cat_title = $(cat).attr('cat')?$(cat).attr('cat'):t;
                let cat_id = $(cat).attr('id')?$(cat).attr('id'):t;
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

                that.addTab(cat_tab,active);

                $('.cat_div').on('click',function () {
                    $(this).removeClass('active');
                });

                $('input.category').css('opacity','1');
                $('input.category').attr('state','1');

                $('#tab_' + cat_tab).find('.filter_div').css('visibility','visible');
                $('#tab_' + cat_tab).find('.filter_div').append('<div class="prop_name">'+
                    '<div class="form-check">'+
                    '<input type="checkbox" class="prop_check form-check-input"'+
                    ' style="transform: scale(2);-webkit-transform: scale(2);">'+
                    '<label class="form-check-label">заказы</label>'+
                    '</div></div>').find(':checkbox').on('click',function (ev) {
                        if($(ev.target).prop('checked'))
                            $('#tab_' + cat_tab).find('.ord_amount[value="0"]').closest('.menu_item').css('display','none');
                        else{
                            $('#tab_' + cat_tab).find('.menu_item').css('display','block');
                        }

                });

                for (let i in that.offer[cat_id]) {
                    //setTimeout(function(){
                        openItem(cat_id,i);
                    //},100);
                }

                $('#'+cat_id).siblings('.cat_cnt').text($('#tab_' + cat_tab).find('.menu_item').length)
            }

            function openItem(cat_tab,i) {

                let menu_item = $('#menu_item_tmplt').clone();
                $(menu_item).attr('id', cat_tab + '_' + i);

                $(menu_item).addClass('menu_item');
                $(menu_item).addClass('card')
                $(menu_item).css('display', 'block');
                //$(menu_item).addClass('col');

                if(that.offer[cat_tab][i].brand){

                    if($('#tab_' + cat_tab).find('img[src="' +that.path+'images/'+that.offer[cat_tab][i].brand.logo+'"]').length===0) {

                        $('#tab_' + cat_tab).find('#accordion').append
                        ('<div class="card">' +
                            '<div class="card-header sticky">' +
                            '<a class="card-link" data-toggle="collapse" href="#tab_'+cat_tab+ that.offer[cat_tab][i].brand.logo + '">' +
                            '<img class="brand_img" src="'+that.path+'images/'+ that.offer[cat_tab][i].brand.logo + '"/>' +
                            '<p class="item_cnt">0</p>'+
                            '</div>' +
                            '<div id="tab_'+cat_tab+that.offer[cat_tab][i].brand.logo+'" class="collapse show" data-parent="#accordion">'+
                            '<div class="card-body"></div>'+
                            '</div>'+
                            '</div>');
                    }
                }

                if(that.offer[cat_tab][i].brand){
                    if(targ_title===that.offer[cat_tab][i].title)
                        $('#tab_'+cat_tab+that.offer[cat_tab][i].brand.logo).find('.card-body').prepend(menu_item);
                    else
                        $('#tab_'+cat_tab+that.offer[cat_tab][i].brand.logo).find('.card-body').append(menu_item);
                }else{
                    if(targ_title===that.offer[cat_tab][i].title)
                        that.ovc.find('#tab_' + cat_tab).find('.tab_row').prepend(menu_item);
                    else
                        that.ovc.find('#tab_' + cat_tab).find('.tab_row').append(menu_item);
                }


                $(menu_item).find('.item_content').attr('id', 'content_' + cat_tab + '_' + i);
                if(that.offer[cat_tab][i].prop || that.offer[cat_tab][i].content_text) {
                    $(menu_item).find('.item_desc').css('display', 'block')
                    $(menu_item).find('.item_desc').attr('data-target', '#content_' + cat_tab + '_' + i);
                }
                if(that.offer[cat_tab][i].prop) {

                    $('<div>').load("../html/tmplt/prop.tmplt.html",function (el) {
                        for(let p in that.offer[cat_tab][i].prop){
                            if(!$('#tab_' + cat_tab).find('.filter_div').find('#prop_'+p)[0])
                                $('#tab_' + cat_tab).find('.filter_div').append('<div id="prop_'+p.replace(/\s+/g, '')+'" class="prop_name">'+p+'</div>');
                            if($('#tab_' + cat_tab).find('.filter_div').find('label:contains('+that.offer[cat_tab][i].prop[p]+')')[0])
                                continue;
                            let cpy = $(el).clone();
                            cpy.find('label').text(String(that.offer[cat_tab][i].prop[p]));
                            cpy.find('label').val(that.offer[cat_tab][i].prop[p]);

                            $(cpy).find(':checkbox').on('click', function (ev) {
                                if($(ev.target).prop('checked'))
                                    $('.val.col:contains("'+that.offer[cat_tab][i].prop[p]+'")').closest('.menu_item').css('display','block');
                                else {
                                    $('#tab_' + cat_tab).find('.menu_item').css('display', 'none');
                                    let ar = $('.prop_check:checked').toArray();
                                    for(let c in ar){
                                        let v = $(ar[c]).siblings('label').text();
                                        $('.val.col:contains("'+v+'")').closest('.menu_item').css('display', 'block');
                                    }
                                }
                            })
                            $('#tab_' + cat_tab).find('.filter_div').find('#prop_'+p.replace(/\s+/g, '')).append(cpy);
                        }
                    });
                }

                $(menu_item).find('.item_desc').on('click',function (el) {
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

                if(that.offer[cat_tab][i].content_text)
                    if (that.offer[cat_tab][i].content_text.value && that.offer[cat_tab][i].content_text.value!=='d41d8cd98f00b204e9800998ecf8427e') {
                        $(menu_item).find('.item_title').siblings('span').css('display','block');
                        $(menu_item).find('.content_text').attr('contenteditable', 'false');
                        $(menu_item).find('.content_text').attr('data-translate', that.offer[cat_tab][i].content_text.value);
                    }

                if(that.offer[cat_tab][i].prop){
                    for(let p in that.offer[cat_tab][i].prop){
                        let row = $(menu_item).find('.prop_tmplt').clone();
                        row.removeClass('prop_tmplt');
                        row.find('.prop').text(p);
                        row.find('.val').text(that.offer[cat_tab][i].prop[p]);
                        $(menu_item).find('.item_content').append(row);
                    }
                }

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

                        if(that.offer[cat_tab][i].bargain ==='true') {
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
                        if(that.offer[cat_tab][i].bargain ==='true') {
                            $(this).closest('.menu_item').find('.item_price').attr('contenteditable', 'true');
                            $(this).closest('.menu_item').find('.item_price').attr('placeholder',price.price?price.price:price);
                            $(menu_item).find('.item_price').removeAttr('placeholder');
                            $(this).closest('.menu_item').find('.item_price').text(price.price?price.price:price);
                        }else{
                            $(this).closest('.menu_item').find('.item_price').text(price.price?price.price:price);
                        }
                    });


                    if(that.offer[cat_tab][i].img) {
                        let src = that.offer[cat_tab][i].img.src;
                        if (!that.offer[cat_tab][i].img.src.includes('http'))
                            src = that.path + "images/" + that.offer[cat_tab][i].img.src;
                        if ($(menu_item).find('img[src="' + src + '"]').length === 0) {
                            $(menu_item).find('.carousel-inner').append(
                                '<div class="carousel-item">' +
                                '<img  class="card_img" src=' + src + '>' +
                                '</div>');
                        }
                    }


                    for (let c in that.offer[cat_tab][i].cert) {
                        let src = that.offer[cat_tab][i].cert[c].src;;
                        if(!that.offer[cat_tab][i].cert[c].src.includes('http'))
                            src = that.path + "images/" + that.offer[cat_tab][i].cert[c].src;
                        if($(menu_item).find('img[src="'+src+'"]').length===0) {
                            $(menu_item).find('.carousel-inner').append(
                                '<div class="carousel-item">' +
                                '<img  class="card_img" src=' + src + '>' +
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
                    let h = 0;
                    if($(this).closest('.content_div')[0])
                        h = $(this).closest('.content_div')[0].scrollHeight;
                    $(this).find('.content').off();
                    $(this).find('.content').on('change keyup keydown paste cut', 'textarea', function () {
                        $(this).height(0).height(h - 50);//this.scrollHeight);
                    }).find('textarea').change();
                });

                $.each(that.offer[cat_tab][i].extra, function (e, el){
                    if(!el)
                        return;
                    $(menu_item).find('.extra_collapse').css('display','block');
                    let row = $(menu_item).find('.tmplt').clone();
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


            // $('li.active a').tab('show');
            // $('.tab_inserted  img:first').tab('show');
            // $('.tab_inserted  img:first').addClass('active');


            window.parent.db.GetSupOrders(new Date(that.date), obj.uid, function (arObj) {
                window.parent.user.orders = arObj;
                if (arObj.length > 0) {
                    $('.ord_cnt').text(arObj.length);
                    for (let o in arObj) {
                        let order = arObj[o];
                        that.address = order.address;
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

        this.InitSupplierReview(obj);
        let profile = obj.profile;

        $('input').attr('title', '');
        $('#sup_name').val(profile.name);
        $('#sup_email').val(profile.email);
        $('#sup_mobile').val(profile.mobile);
        $('#sup_address').val(profile.address);
        $('#sup_place').val(profile.place);
        $('#sup_worktime').val(profile.worktime);
    }

    InitSupplierReview(sup){
        let par = {
            proj: "d2d",
            user: window.parent.user.constructor.name.toLowerCase(),
            func: 'getcomments',
            supuid: sup.supuid,
            readOnly:(sup.appr && sup.appr.cusuid===window.parent.user.uid)?false:true,
            profilePictureURL: this.path+'images/'+sup.profile.avatar,
            enableEditing: true,
            enableDeleting:false,
            enableReplying: false,
            maxRepliesVisible: 5
        }
        Object.assign(par,comment_obj.user[window.parent.sets.lang]);
        this.InitProfileSupplier({supplier:sup,user:'Customer'},par);
    }

    GetUserProfileItems(){
        let that  = this;
        $('.tab-pane').each(function (i, tab) {
            if($(tab).attr('id')==='user_pane') {
                window.parent.db.GetSettings(function (data) {
                    let profile = data[0].profile;
                    if(!profile)
                        profile = {};

                    $(tab).find('input[changed]').each(function (index, inp) {
                        if($(this).attr('type')==='file'){
                            profile['avatar'] = $(this).siblings('img').attr('src');
                            return;
                        }
                        profile[inp.id] = $(inp).val();
                    });
                    data[0]['profile'] = profile;
                    window.parent.db.SetObject('setStore', data[0], function (res) {

                    });
                });

            }
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
                        window.parent.db.GetApproved(new Date(that.date),uid,window.parent.user.uid,function (appr) {
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

        if($('#address').val() || $('#email').val() || $('#mobile').val()){
            window.parent.db.GetSettings((obj) =>{
                obj[0].profile.address = $('#address').val();
                obj[0].profile.email = $('#email').val();
                obj[0].profile.mobile = $('#mobile').val();
                window.parent.db.SetObject('setStore', obj[0], (res) => {

                });
            });
        }


        if(Object.keys(items.data).length>0) {

            window.parent.user.PublishOrder(items, (data) => {
                window.parent.user.UpdateOrderLocal(data);
                let status = window.parent.dict.getDictValue(window.parent.sets.lang, Object.keys(data)[1]);
                //$(that.ovc).find('.ord_status').css('color', 'white');
                $(that.ovc).find('.ord_status').text(status + "\r\n" + data.published);
                that.status = Object.keys(data)[1];
                $('.loader').css('display','none');
                cb(items);

            });
        }

    }

    SaveProfile(){

    }

    OnClickUserCart(ev){

        $('tbody').empty();
        window.cart = new CartCustomer();
        window.cart.InitUserOrders();
    }

    OnClickUserProfile(ev){

        let that = this;
        window.parent.db.GetSettings(function (data) {
            if(data[0] && data[0].profile) {

                for (let i in data[0].profile) {
                    if (i === 'avatar') {
                        if(!data[0].profile[i].includes('http') && !data[0].profile[i].includes('data')) {
                            let src = that.path+'images/' +data[0].profile[i];
                            $('.avatar').attr('src', src);
                        }else{
                            $('.avatar').attr('src',data[0].profile[i]);
                        }
                        continue;
                    }
                    if (i)
                        $('input[id=' + i + ']').val(data[0].profile[i]);
                }
            }

            if($('#mobile').val() || $('#email').val()){
                $('.reg_reminder').css('display','none');
            }
        });


        $(".file-upload").off();
        $(".file-upload").on('change', function(e) {
            try {
                loadImage(
                    e.target.files[0],
                    function (img, data) {
                        if (img.type === "error") {
                            console.error("Error loading image ");
                        } else {

                            let this_img = img.toDataURL();

                            setTimeout(function () {

                                $('.user_avatar').attr('src', this_img);

                                $('.user_avatar').siblings('input:file').attr('changed', true);
                                console.log("Original image width: ", data.originalWidth);
                                console.log("Original image height: ", data.originalHeight);
                            },200)

                        }
                    },
                    {
                        orientation: true,
                        maxWidth: 600,
                        maxHeight: 300,
                        minWidth: 100,
                        minHeight: 50,
                        canvas: true
                    }
                );
            } catch (ex) {
                console.log(ex);
            }
        })

     }
}
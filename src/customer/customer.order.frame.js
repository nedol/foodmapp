'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');
require('bootstrap');
require('bootstrap-select');
require("../../lib/bootstrap-rating/bootstrap-rating.js")
require("../../lib/jquery-comments-master/js/jquery-comments.js")

import {Dict} from '../dict/dict.js';

import {Utils} from "../utils/utils";
let utils = new Utils();

import proj from 'ol/proj';
// require('jquery.nicescroll')

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

    (function($) {
        $.fn.longTap = function(longTapCallback) {
            return this.each(function(){
                var elm = this;
                var pressTimer;
                $(elm).on('touchend mouseup', function (e) {
                    clearTimeout(pressTimer);
                });
                $(elm).on('touchstart mousedown', function (e) {
                    // Set timeout
                    pressTimer = window.setTimeout(function () {
                        longTapCallback.call(elm);
                    }, 500)
                });
            });
        }
    })(jQuery);


    window.InitCustomerOrder = function (data) {
        window.cus_oder = new CustomerOrder();
        window.cus_oder.openFrame(data, function () {
            return;
        });

        window.cus_oder.InitRating();
    };


});

class CustomerOrder{
    constructor(){

        this.path  ="http://localhost:63342/d2d/server";
        if(host_port.includes('nedol.ru'))
            this.path = host_port;

        this.ovc = $('body');

        this.ovc.find('.nav-link').on('click', function (ev) {
            // $('#sup_profile_container').css('display','block');
            let href = $(this).attr('href');
            $(href).css('display','block');

            href = $(this).closest('.nav').find('.active').attr('href');

            $(href).css('display','none');
        });

    }

    openFrame(obj, cb) {

        let that = this;
        this.uid = obj.uid;
        this.profile = obj.profile;
        this.offer = obj.data;
        obj.supuid = obj.uid;
        this.rating = obj.rating;
        let latlon = [obj.latitude,obj.longitude];
        let diff =  new Date().getTime() - new Date(obj.published).getTime();
        let days = Math.floor(diff / (1000 * 60 * 60 * 24));
        let isDelayed =  days  - 7;//week after publication
        this.ovc.css('display','block');

        this.ovc.find('#shop_name').text(obj.profile.name);

        this.ovc.find('.rating_container').append('<input type="hidden" class="rating"   data-filled="fa fa-star fa-3x  custom-star" data-empty="fa fa-star-o fa-3x  custom-star"/>');
        this.ovc.find('.rating').rating('rate',obj.rating);
        this.ovc.find('.custom-star').val(obj.rating);

        // $( "#pack_list" ).selectable({
        //     stop: function() {
        //
        //     }
        // });
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

        $('a[data-toggle="tab"]').on('click',(ev)=> {
            $('#client_frame_container',window.parent.document).css('height','100%');
            $(window.parent.user.map.ol_map).off('moveend');
            if($('#address').val().includes(';'))
                window.parent.user.map.geo.SearchPlace($('#address').val().split(';'),19,function (res) {
                    $('#address').val(res.city+','+res.street+','+res.house);
                });
        });

        this.ovc.find('#close_frame').off();
        this.ovc.find('#close_frame').on('click', this, function (ev) {
            let that = ev.data;

            let confirm = window.confirm("Сохранить заказ?");
            if(confirm) {
                let items = that.SaveOrder(that.cus_oder, window.parent.sets.lang, function (res) {

                });

                let q =  _.findKey(items.data, function(o) { return o.qnty >0; });
                if(q)
                    if(that.profile.type==='deliver' && !$('#address').val()){
                        alert($('#address').attr('placeholder'));
                        $('#address').focus();
                        return false;
                    }else {


                    }

            }
            $(frameElement).css('display','none');
            $('#client_frame_container',window.parent.document).css('display','none');
            setTimeout(function () {
                $(frameElement).remove();

            }, 1000);
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

        function initOrder(){
            $(".category[state=\"1\"]",window.parent.document).each(function (i, cat) {
                let cat_tab = $(cat).attr('cat');
                let cat_img = $(cat).attr('src');
                let state = $(cat).attr('state')==='0'?'style=\"display: none;\"':'';
                if (!cat_tab || !that.offer[cat_tab])
                    return;
                if ($('[href="#' + cat_tab + '"]').length === 0) {
                    $('<li class="tab_inserted nav-item " '+state+'>' +
                        '<img class="nav-link" data-toggle="tab"  contenteditable="false" data-translate="' + md5(cat_tab) + '"  href="#' + cat_tab + '" src="'+cat_img+'"  title="'+cat_tab+'">' +
                        '</li>').insertBefore(that.ovc.find('#add_tab_li'));
                    $('<div id="' + cat_tab + '" class="tab-pane div_tab_inserted" style="border: border: 1px solid grey;">' +
                        // '<div class="row"><div>' +
                        '</div>').insertBefore(that.ovc.find('#add_tab_div'));
                }

                // $('#'+tab).niceScroll();
                let last = 0;
                for (let i in that.offer[cat_tab]) {
                    last = i;
                    let menu_item = $('#menu_item_tmplt').clone();
                    $(menu_item).attr('id', cat_tab + '_' + i);

                    $(menu_item).attr('class', 'menu_item');
                    $(menu_item).css('display', 'block');

                    // $(menu_item).find('.item_title').attr('contenteditable', 'false');
                    //$(menu_item).find('.item_price').attr('contenteditable', 'true');//TODO:for premium tariff

                    $(menu_item).find('.item_price').text(that.offer[cat_tab][i].price);

                    $(menu_item).find('.item_content').attr('id', 'content_' + cat_tab + '_' + i);
                    $(menu_item).find('.item_title').attr('data-target', '#content_' + cat_tab + '_' + i);

                    // $(menu_item).find('.item_title').longTap(function (el) {
                    //     $(menu_item).find('.item_content').collapse('show');
                    // });
                    $(menu_item).find('.item_title').on('click',function (el) {
                        $(menu_item).find('.item_content').collapse("toggle");
                    });

                    $(menu_item).find('.amount').val(0);
                    $(menu_item).find('.amount').text(0);

                    if (that.offer[cat_tab][i].title) {
                        $(menu_item).find('.item_title').attr('data-translate', that.offer[cat_tab][i].title);
                    }

                    $(menu_item).find('.content_text').attr('contenteditable', 'false');
                    if (that.offer[cat_tab][i].content_text)
                        $(menu_item).find('.content_text').attr('data-translate', that.offer[cat_tab][i].content_text.value);
                    if (that.offer[cat_tab][i].content_text)
                        $(menu_item).find('.content_text').css('visibility', 'visible');

                    if (that.offer[cat_tab][i].img) {
                        let src = '';
                        if(!that.offer[cat_tab][i].img.src.includes('http'))
                            src = that.path + "/images/" +  that.offer[cat_tab][i].img.src;
                        else
                            src = that.offer[cat_tab][i].img.src;

                        $(menu_item).find('.img-fluid').css('visibility', 'visible');
                        $(menu_item).find('.img-fluid').parent().css('display', 'block');
                        $(menu_item).find('.img-fluid').attr('src', src);
                        let active = '';
                        if (!$('.carousel-inner').find('.active')[0])
                            active = 'active';
                        if (!that.offer[cat_tab][i].owner) {
                            $('.carousel-indicators').append('<li class="' + active + '" data-slide-to="' + that.offer[cat_tab][i].title + '" data-target="#carouselExampleIndicators"></li>');
                            let item = '<div class="carousel-item ' + active + '">' +
                                '<h1 class="carousel_price" title="' + that.offer[cat_tab][i].title + '"></h1>' +
                                '<img class="d-block img-fluid img-responsive" src=' + src + ' alt="slide"  style="width: 900px;height: 250px;object-fit: contain ;"></div>';
                            $('.carousel-inner').append(item);
                        } else {
                            $('.carousel_collapse').css('display', 'block');
                        }
                    }

                    $(menu_item).find('.img-fluid').attr('id', 'img_' + cat_tab + '_' + i);

                    let setPrice = function (packlist, mi) {
                        if (mi) menu_item = mi;
                        $(menu_item).find('.pack_list').empty();
                        let pl = packlist;
                        let ml = that.offer[cat_tab][i].markuplist;
                        $(menu_item).find('.pack_btn').attr('packlist', JSON.stringify(pl));
                        for (let p in pl) {
                            if (!i)
                                continue;
                            let ml_val;
                            if (!ml || !ml[p])
                                ml_val = 0;
                            else
                                ml_val = parseInt(ml[p]);
                            let data = parseInt(pl[p]) + ml_val;

                            $(menu_item).find('.item_price').attr('base', pl[p]);
                            if (!$('.carousel_price[title=' + that.offer[cat_tab][i].title + ']').text())
                                $('.carousel_price[title=' + that.offer[cat_tab][i].title + ']').text(data);
                            pl[p] = data;
                            $('a[href="#' + cat_tab + '"]').css('display', 'block');
                            $(menu_item).find('.dropdown').css('visibility', 'visible');
                            if(that.profile.type==='deliver' && !that.offer[cat_tab][i].markuplist[p])
                                continue;
                            $(menu_item).find('.pack_list').append("<a class='dropdown-item' role='packitem'>" + p + "</a>");
                            $(menu_item).find('.pack_btn').text(p);
                            $(menu_item).find('.caret').css('visibility', 'visible');
                            $(menu_item).find('.pack_btn').attr('pack', p);

                            $(menu_item).find('.item_price').text(data);
                        }
                    }

                    if (that.offer[cat_tab][i].owner) {
                        $(menu_item).find('.item_title').attr('owner', that.offer[cat_tab][i].owner);
                        window.parent.db.GetSupplier(new Date(window.parent.user.date), that.offer[cat_tab][i].owner, function (offer) {
                            let title = that.offer[cat_tab][i].title;
                            let incl = _.find(offer.data[cat_tab], {title: title});
                            if (!incl)
                                return;
                            $('a[href="#' + cat_tab + '"]').css('display', 'block');
                            $(menu_item).find('.card-text').attr('contenteditable', 'false');
                            if (incl.content_text)
                                $(menu_item).find('.card-text').attr('data-translate', incl.content_text.value);
                            if (incl.content_text)
                                $(menu_item).find('.card-text').css('visibility', 'visible');

                            if (incl.img) {
                                $(menu_item).find('.img-fluid').css('visibility', 'visible');
                                let src = '';
                                if(!that.offer[cat_tab][i].img.src.includes('http'))
                                    src = that.path + "/images/" +  that.offer[cat_tab][i].img.src;
                                else
                                    src = that.offer[cat_tab][i].img.src;

                                $(menu_item).find('.img-fluid').attr('src', src);
                                // $(menu_item).find('.img-fluid').css('left',!incl.img.left?0:(incl.img.left/incl.width)*100+'%');
                                // $(menu_item).find('.img-fluid').css('top', !incl.img.top?0:incl.img.top);
                            }

                            $.each(incl.cert, function (ind, data) {
                                let img = new Image();
                                let src = '';
                                if(!data.src.includes('http'))
                                    src = that.path + "/images/" + data.src;
                                else
                                    src = data.src;

                                img.src = src;
                                //$(img).offset(data.pos); TODO:
                                // img.style.height = '90%';
                                img.width = '90';

                                $(menu_item).find('.cert_container').append(img);
                                $(img).on('click', menu_item, that.onClickImage);
                            });

                            if (that.offer[cat_tab][i].img && that.profile.type === 'deliver') {
                                let src = '';
                                if(!that.offer[cat_tab][i].img.src.includes('http'))
                                    src = that.path + "/images/" + that.offer[cat_tab][i].img.src;
                                else
                                    src =  that.offer[cat_tab][i].img.src;

                                $(menu_item).find('.img-fluid').css('visibility', 'visible');
                                // $(menu_item).find('.img-fluid').css('display', 'none');
                                $(menu_item).find('.img-fluid').attr('src', src);
                                let active = '';
                                if (!$('.carousel-inner').find('.active')[0])
                                    active = 'active';
                                $('.carousel-indicators').append('<li class="' + active + '" data-slide-to="' + that.offer[cat_tab][i].title + '" data-target="#carouselExampleIndicators"></li>');
                                let item = '<div class="carousel-item ' + active + '">' +
                                    '<h1 class="carousel_price" title="' + that.offer[cat_tab][i].title + '"></h1>' +
                                    '<img class="d-block img-fluid img-responsive" src=' + src + ' alt="slide"  style="width: 900px;height: 250px;object-fit: contain ;"></div>';
                                $('.carousel-inner').append(item);
                            }

                            if(isDelayed<0){
                                setPrice(incl.packlist, menu_item);
                            }else{
                                $(menu_item).find('.order_container').css('display','none');
                            }

                            $(menu_item).find('a[role=packitem]').on('click', {off: incl}, function (ev) {
                                that.changed = true;
                                let pl = incl.packlist;
                                $(menu_item).find('.pack_btn').text($(ev.target).text());
                                $(menu_item).find('.item_price').text(pl[$(ev.target).text()]);
                            });

                            that.ovc.find('#' + cat_tab).append(menu_item);
                            that.dict.dict = Object.assign(offer.dict.dict, that.dict.dict);
                            that.dict.set_lang(window.parent.sets.lang, that.ovc[0]);
                        });

                    } else {
                        //deliver
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
                                // if (key) {
                                //TODO: знак службы доставки
                                //     $(menu_item).find('.deliver_but').css('display', 'block');
                                //     $(menu_item).find('.deliver_but').attr('supuid', $('#deliver_but', window.parent.document).attr('supuid'));
                                // }
                            });

                        if(isDelayed<0) {
                            setPrice(that.offer[cat_tab][i].packlist);
                        }else{
                            $(menu_item).find('.order_container').css('display','none');
                        }

                        that.ovc.find('#' + cat_tab).append(menu_item);

                        $(menu_item).find('a[role=packitem]').on('click', {off: that.offer[cat_tab][i]}, function (ev) {
                            that.changed = true;
                            $(this).closest('.menu_item').find('.pack_btn').text($(ev.target).text());
                            let pl = ev.data.off.packlist;
                            $(this).closest('.menu_item').find('.item_price').text(pl[$(ev.target).text()]);
                        });

                        if (that.offer[cat_tab][i].cert.length > 1)
                            $(menu_item).find('.cert_container').css('display', 'block');
                        for (let c in that.offer[cat_tab][i].cert) {
                            let img = new Image();
                            if(!that.offer[cat_tab][i].cert[c].src.includes('http'))
                                img.src = that.path + "/images/" + that.offer[cat_tab][i].cert[c].src;
                            else
                                img.src =  that.offer[cat_tab][i].cert[c].src;
                            //$(img).offset(data.pos); TODO:
                            img.width = '90';
                            // img.style.height = '100%';

                            $(menu_item).find('.cert_container').append(img);
                            cb();
                            $(img).on('click', menu_item, that.onClickImage);
                        }
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
                }

                setTimeout(function () {
                    let empty = $('#menu_item_tmplt').clone();
                    // $(empty).addClass('menu_item');
                    $(empty).attr('id', 'menu_item_empty');
                    $(empty).insertAfter($('#' + cat_tab + '_' + last));

                }, 200)


                //
                // if($('.carousel-inner').children().length<=1)
                //    $(".carousel_collapse").css('display','none');


            });
            that.RedrawOrder(obj);
            that.dict.set_lang(window.parent.sets.lang, that.ovc[0]);

            // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');

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

        setTimeout(function () {
            initOrder();
        },1000);

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
    }


    InitSupplierReview(sup){

       this.InitProfileSupplier({supplier:sup,user:'Customer'},
            {   //comments settings
                readOnly: (this.appr && this.appr.cusuid===window.parent.user.uid)?false:true,
                profilePictureURL: this.path+'/images/'+sup.profile.avatar,
                enableEditing: true,
                enableDeleting:false,
                enableReplying: false,
                textareaPlaceholderText: 'Оставить отзыв',
                newestText: 'Новые',
                oldestText: 'Старые',
                popularText: 'Популярные',
                sendText: 'Послать',
                // deleteText: 'Удалить',
                replyText: 'Ответить',
                editText: 'Изменить',
                editedText: 'Измененный',
                youText: 'Я',
                saveText: 'Сохранить',
                hideRepliesText: 'Скрыть',
                noCommentsText: 'Отзывы отсутствуют',
                maxRepliesVisible: 3
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

        $( "#period_list" ).selectable({
            stop: function() {
                let result;
                $( ".ui-selected", this ).each(function(i) {
                    let index = $( "#period_list li" ).index( this );
                    if(i===0)
                        result = $($( "#period_list li")[index]).text().split(' - ')[0];
                    if($( ".ui-selected").length===i+1)
                        result+=" - "+ $($( "#period_list li")[index]).text().split(' - ')[1];
                });
                $('.sel_period').val(result);
                $( ".sel_period ").dropdown("toggle");

            }
        });

        $('input').prop( "readonly", false );

    }


    InitComments(obj, settings){
        let this_obj = obj;
        $('img.avatar').attr('src', settings.profilePictureURL);
        settings.profilePictureURL = window.parent.user.profile.avatar;
        $('#comments-container').comments(Object.assign(settings,{
            getComments: function(success, error) {
                let par = {
                    proj:'d2d',
                    user:window.parent.user.constructor.name.toLowerCase(),
                    func:'getcomments',
                    supuid:obj.supplier.uid
                }
                window.parent.network.postRequest(par, function (data) {
                    usersArray = [
                        {
                            id: 1,
                            fullname: "Current User",
                            email: "current.user@viima.com",
                            profile_picture_url: "https://viima-app.s3.amazonaws.com/media/public/defaults/user-icon.png"
                        }];
                    if(!data.err)
                        success(data);
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

    RedrawOrder(obj){
        let that = this;
        window.parent.db.GetOrder(new Date(this.date), obj.uid, window.parent.user.uid, function (res) {
            if(res!==-1){
                let keys = Object.keys(res.data);
                //$('.sel_period').text(res.period);
                for(let k in keys){
                    if(keys[k]==='comment'){
                        $('.comment').text(that.dict.getDictValue(window.parent.user.lang, res.data.comment));
                    }else {
                        window.parent.db.GetApproved(new Date(that.date),obj.uid,window.parent.user.uid,keys[k],function (appr) {
                            if(appr &&
                                //res.period ===appr.period &&
                                res.data[keys[k]].price===appr.data.price &&
                                res.data[keys[k]].pack===appr.data.pack &&
                                res.data[keys[k]].qnty===appr.data.qnty) {
                                $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.ordperiod').text(appr.period );
                                $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.approved').attr('approved', that.date);
                                $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.period_div').css('visibility', 'visible');

                                //$('.address').attr('disabled','true');
                                // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.increase').css('visibility','hidden');
                                // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.reduce').css('visibility','hidden');
                                // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.pack_btn').attr('data-toggle','');
                            }
                        });

                        if(res.data[keys[k]].qnty>0) {
                            $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.amount').val(res.data[keys[k]].qnty);
                            $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.amount').text(res.data[keys[k]].qnty);

                            let price = res.data[keys[k]].price;
                            $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.item_price').text(price);
                            let pack = res.data[keys[k]].pack;
                            $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.pack_btn').text(pack);
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
                pack: $(val).find('.pack_btn').text().trim(),
                status:$(val).attr('deleted')?'deleted':'published'
            }

            if($('#order_pane').find('.comment')[0])
                obj['comment'] = $('#order_pane').find('.comment')[0].value;
            obj['supuid'] = that.uid;
            obj['cusuid'] = window.parent.user.uid;
            obj['date'] = that.date;
            obj['period'] = $(window.parent.document).find('.sel_period').text();
            obj['address'] = $('#address').val();

        });

        return obj;
    }

    SaveOrder(ev, lang) {

        let that = this;

        if($('#address').val()){
            window.parent.db.GetSettings((obj) =>{
                obj[0].profile.address = $('#address').val();
                window.parent.db.SetObject('setStore', obj[0], (res) => {

                });
            });
        }
        let items = this.GetOrderItems();
        if(Object.keys(items.data).length>0) {
            window.parent.user.UpdateOrderLocal(items);

            window.parent.user.PublishOrder(items, (data) => {
                let status = window.parent.dict.getDictValue(window.parent.sets.lang, Object.keys(data)[1]);
                //$(that.ovc).find('.ord_status').css('color', 'white');
                $(that.ovc).find('.ord_status').text(status + "\r\n" + data.published);
                that.status = Object.keys(data)[1];
                window.parent.db.GetSettings(function (obj) {
                    ;
                });
            });
        }

        return items;
    }
}
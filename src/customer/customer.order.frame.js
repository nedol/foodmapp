'use strict'

require("../../lib/bootstrap-rating/bootstrap-rating.js")
require('bootstrap/js/tab.js');
require('bootstrap/js/collapse.js')
import {Dict} from '../dict/dict.js';
import {ProfileSupplier} from "../profile/profile.supplier";


let _ = require('lodash')

var md5 = require('md5');

$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        $('.alert').text('В этом браузере нет поддержки EventSource.').addClass('show');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }
    window.InitCustomerOrder = function (data) {
        window.cus_oder = new CustomerOrder();
        window.cus_oder.OpenOffer(data);
    };


});

class CustomerOrder{
    constructor(){

        this.path  = window.location.origin +"/d2d/";
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
    OpenOffer(obj) {
        let that = this;
        this.uid = obj.uid;
        this.profile = obj.profile;
        this.offer = obj.data;
        obj.supuid = obj.uid;
        this.rating = obj.rating;
        let latlon = [obj.latitude,obj.longitude];

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

        $('.close').on('click',this,function (ev) {
            let items = that.SaveOrder(that.cus_oder, window.parent.sets.lang, function (res) {

            });

            let q =  _.findKey(items.data, function(o) { return o.qnty >0; });
            if(q)
                if(that.profile.type==='deliver' && !$('#address').val()){
                    alert($('#address').attr('placeholder'));
                    $('#address').focus();
                    return false;
                }

            if($('#client_frame_container',window.parent.document).find('.client_frame').length>0) {
                $('#client_frame_container',window.parent.document).empty();
                $('#client_frame_container',window.parent.document).css('display', 'none');
            }
        });

        this.FillProfile(obj);

        $('.name').css('display','block').text(obj.profile.name?obj.profile.name:obj.profile.email.split('@')[0]);
        window.parent.db.GetSupApproved(obj.uid, function (res) {
            that.appr = res;
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


        window.parent.db.GetSettings(function (obj) {
            if(obj[0].profile && obj[0].profile.address)
                that.ovc.find('#address').val(obj[0].profile.address);
        });

        $(window.parent.document).find(".category[state='1']").each(function (i, cat) {
            let tab = $(cat).text();
            //for (let tab in this.offer) {
            if(!tab || !that.offer[tab])
                return;
            if($('[href="#'+tab+'"]').length===0) {
                $('<li class="tab_inserted"><a class="nav-link" data-toggle="tab"  contenteditable="false" data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a>' +
                    '</li>').insertBefore(that.ovc.find('#add_tab_li'));
                $('<div id="'+tab+'" class="tab-pane active div_tab_inserted" style="border: border: 2px solid grey;">' +
                    // '<div class="row"><div>' +
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
                    let src = that.path+ "/images/"+that.offer[tab][i].img.src;
                    $(menu_item).find('.img-fluid').css('visibility', 'visible');
                    // $(menu_item).find('.img-fluid').css('display', 'none');
                    $(menu_item).find('.img-fluid').attr('src', src);
                    let active= '';
                    if(!$('.carousel-inner').find('.active')[0])
                        active = 'active';
                    $('.carousel-indicators').append('<li class="'+active+'" data-slide-to="'+that.offer[tab][i].title+'" data-target="#carouselExampleIndicators"></li>');
                    let item ='<div class="carousel-item '+active+'">'+
                    '<h1 class="carousel_price" title="'+that.offer[tab][i].title+'"></h1>'+
                    '<img class="d-block img-fluid img-responsive" src='+src+' alt="slide"  style="width: 900px;height: 250px;object-fit: contain ;"></div>';
                    $('.carousel-inner').append(item);
                }

                $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);

                let setPrice = function (packlist, mi) {
                    if(mi) menu_item = mi;
                    $(menu_item).find('.pack_list').empty();
                    let pl = packlist;
                    let ml = that.offer[tab][i].markuplist;
                    $(menu_item).find('.pack_btn').attr('packlist', JSON.stringify(pl));
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
                        if(!$('.carousel_price[title='+that.offer[tab][i].title+']').text())
                            $('.carousel_price[title='+that.offer[tab][i].title+']').text(data+'р/'+p);
                        pl[p] = data;
                        $(menu_item).find('.dropdown').css('visibility', 'visible');
                        $(menu_item).find('.pack_list').append("<a class='dropdown-item' role='packitem'>" + p + "</a>");
                        $(menu_item).find('.pack_btn').text(p);
                        $(menu_item).find('.caret').css('visibility', 'visible');
                        $(menu_item).find('.pack_btn').attr('pack', p);

                        $(menu_item).find('.item_price').text(data);
                    }

                }

                if(that.offer[tab][i].owner) {
                    $(menu_item).find('.item_title').attr('owner', that.offer[tab][i].owner);
                    window.parent.db.GetSupplier(new Date(window.parent.user.date),that.offer[tab][i].owner,function (offer) {
                        let title = that.offer[tab][i].title;
                        let incl = _.find(offer.data[tab],{title:title});


                        $(menu_item).find('a[role=packitem]').on('click', {off:incl},function(ev){
                            that.changed = true;
                            let pl = incl.packlist;
                            $(menu_item).find('.pack_btn').text($(ev.target).text());
                            $(menu_item).find('.item_price').text(pl[$(ev.target).text()]);
                        });

                        $(menu_item).find('.card-text').attr('contenteditable', 'false');
                        if(incl.content_text)
                            $(menu_item).find('.card-text').attr('data-translate', incl.content_text.value);
                        if(incl.content_text)
                            $(menu_item).find('.card-text').css('visibility','visible');

                        if(incl.img) {
                            $(menu_item).find('.img-fluid').css('visibility', 'visible');
                            $(menu_item).find('.img-fluid').attr('src',  that.path+"/images/"+incl.img.src);
                            $(menu_item).find('.img-fluid').css('left',!incl.img.left?0:(incl.img.left/incl.width)*100+'%');
                            $(menu_item).find('.img-fluid').css('top', !incl.img.top?0:incl.img.top);
                        }

                        $.each(incl.cert, function (ind, data) {
                            let img = new Image();
                            img.src = that.path+"/images/"+data.src;
                            //$(img).offset(data.pos); TODO:
                            img.height = '100';
                            $(menu_item).find('.cert_container').append(img);
                            $(img).on('click',menu_item, that.onClickImage);
                        });

                        if(that.offer[tab][i].img && that.profile.type==='deliver') {
                            let src = that.path+"/images/"+that.offer[tab][i].img.src;
                            $(menu_item).find('.img-fluid').css('visibility', 'visible');
                            // $(menu_item).find('.img-fluid').css('display', 'none');
                            $(menu_item).find('.img-fluid').attr('src', src);
                            let active= '';
                            if(!$('.carousel-inner').find('.active')[0])
                                active = 'active';
                            $('.carousel-indicators').append('<li class="'+active+'" data-slide-to="'+that.offer[tab][i].title+'" data-target="#carouselExampleIndicators"></li>');
                            let item ='<div class="carousel-item '+active+'">'+
                                '<h1 class="carousel_price" title="'+that.offer[tab][i].title+'"></h1>'+
                                '<img class="d-block img-fluid img-responsive" src='+src+' alt="slide"  style="width: 900px;height: 250px;object-fit: contain ;"></div>';
                            $('.carousel-inner').append(item);
                        }

                        setPrice(incl.packlist,menu_item);

                        that.ovc.find('#' + tab).append(menu_item);
                        that.dict.dict = Object.assign(offer.dict.dict,that.dict.dict);
                        that.dict.set_lang(window.parent.sets.lang,that.ovc[0]);
                    });

                }else{
                    setPrice(that.offer[tab][i].packlist);
                    that.ovc.find('#' + tab).append(menu_item);
                    $(menu_item).find('a[role=packitem]').on('click', {off:that.offer[tab][i]},function(ev){
                        that.changed = true;
                        $(this).closest('.menu_item').find('.pack_btn').text($(ev.target).text());
                        let pl = ev.data.off.packlist;
                        $(this).closest('.menu_item').find('.item_price').text(pl[$(ev.target).text()]);
                    });
                }

                for(let c in that.offer[tab][i].cert) {
                    let img = new Image();
                    img.src = that.path+"/images/"+that.offer[tab][i].cert[c].src;
                    //$(img).offset(data.pos); TODO:
                    img.height = '100';
                    $(menu_item).find('.cert_container').append(img);
                    $(img).on('click',menu_item, that.onClickImage);
                }

                if ($(menu_item).find('.item_content').css('display') === 'block'
                    && $(menu_item).find('.img-fluid').attr('src')===''
                    && $(menu_item).find('.card-text').text()===""){
                    $(menu_item).find('.item_content').slideToggle("fast");
                }

                $(menu_item).find('.item_content').on('shown.bs.collapse', function (e) {
                    let h = $(this).closest('.content_div')[0].scrollHeight;
                    $(this).find('.content').off();
                    $(this).find('.content').on( 'change keyup keydown paste cut', 'textarea', function (){
                        $(this).height(0).height(h-50);//this.scrollHeight);
                    }).find( 'textarea' ).change();
                });
            }
            //
            // if($('.carousel-inner').children().length<=1)
            //    $(".carousel_collapse").css('display','none');

            let empty = $('#menu_item_tmplt').clone();
            // $(empty).addClass('menu_item');
            $(empty).attr('id','menu_item_empty');
            $(empty).insertAfter($('.menu_item').last());
        });


        this.RedrawOrder(obj);

        this.dict.set_lang(window.parent.sets.lang,that.ovc[0]);
        // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');

        $($('.tab_inserted a')[0]).tab('show');

        window.parent.db.GetSupOrders(new Date(this.date),obj.uid,function (arObj) {
            if(arObj.length>0){
                for(let o in arObj) {
                    let order = arObj[o];
                    that.address = order.address;

                    if (!that.address) {
                        window.parent.user.map.geo.SearchPlace(latlon, 18, function (obj) {
                            that.address = obj;
                            if(obj.city && obj.street && obj.house)
                                $('.address').val(obj.city+ "," + obj.street + "," + obj.house);
                        });
                    } else {
                        if(that.address)
                            $(that.ovc).find('#address').val(that.address);
                    }

                    if(order.published) {
                        that.published = order.published;
                        let status = window.parent.dict.getDictValue(window.parent.sets.lang, "published");
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

       this.InitProfileSupplier({supuid:sup.uid,user:window.parent.user.constructor.name},
            {   //comments settings
                readOnly: (sup.appr && sup.appr.cusuid===window.parent.user.uid)?false:true,
                profilePictureURL: this.path+'/images/'+sup.profile.avatar,
                enableEditing: true,
                enableDeleting:false,
                enableReplying: false,
                textareaPlaceholderText: 'Оставить комментарий',
                newestText: 'Новые',
                oldestText: 'Старые',
                popularText: 'Популярные',
                sendText: 'Послать',
                replyText: 'Ответить',
                editText: 'Изменить',
                editedText: 'Измененный',
                youText: 'Я',
                saveText: 'Сохранить',
                hideRepliesText: 'Скрыть'
            });
    }

    InitProfileSupplier(user, settings) {

        this.profile_sup = new ProfileSupplier();
        this.profile_sup.InitComments(user, settings);
        this.profile_sup.InitRateSupplier();
        this.profile_sup.InitSettingsSupplier();

        if(user.constructor.name==='Supplier') {
            if(!user.profile.profile.avatar) {
                utils.LoadImage("https://nedol.ru/d2d/dist/images/avatar_2x.png", function (src) {
                    $('.avatar').attr('src', src);
                });
            }else{
                $('.avatar').attr('src', this.path+'/images/'+user.profile.profile.avatar);
            }
            $('img.avatar').after("<h6>Загрузить мою фотографию...</h6>");
            $('img.avatar').on('click',function (ev) {
                $(this).siblings('.file-upload').trigger('click');
            });
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
        else if(user.user==='Customer'){
            //$('input').prop( "readonly", true );
        }
    }


    InitComments(obj, settings){

        $('img.avatar').attr('src', settings.profilePictureURL);
        settings.profilePictureURL = window.parent.user.profile.avatar;
        $('#comments-container').comments(Object.assign(settings,{
            getComments: function(success, error) {
                let par = {
                    proj:'d2d',
                    user:window.parent.user.constructor.name.toLowerCase(),
                    func:'getcomments',
                    supuid:obj.uid
                }
                window.parent.network.postRequest(par, function (data) {
                    usersArray = [
                        {
                            id: 1,
                            fullname: "Current User",
                            email: "current.user@viima.com",
                            profile_picture_url: "https://viima-app.s3.amazonaws.com/media/public/defaults/user-icon.png"
                        }];
                    success(data);
                })
            },
            postComment: function(data, success, error) {
                if(window.parent.user.profile && window.parent.user.profile.name) {
                    data['fullname'] = window.parent.user.profile.name;
                }else if(window.parent.user.email){
                    data['fullname'] = window.parent.user.email.split('@')[0];
                }else
                    data['fullname'] = 'Пользователь';

                data['created_by_current_user'] = false;
                let par = {
                    proj:'d2d',
                    user:window.parent.user.constructor.name.toLowerCase(),
                    func:'setcomments',
                    supuid:obj.supuid,
                    cusuid:obj.cusuid,
                    data:data
                }
                window.parent.network.postRequest(par, function (res) {
                    data['created_by_current_user'] = true;
                    success(saveComment(data));
                });
            },
            putComment: function(data, success, error) {
                let par = {
                    proj:'d2d',
                    user: window.parent.user.constructor.name.toLowerCase(),
                    func:'setcomments',
                    supuid:obj.supuid,
                    cusuid:obj.cusuid,
                    data:data
                }
                window.parent.network.postRequest(par, function (res) {
                    success(saveComment(data));
                });
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
        let data_obj = {
            proj: "d2d",
            user:window.parent.user.constructor.name.toLowerCase(),
            func: "getrating",
            psw: window.parent.user.psw,
            supuid: window.parent.user.uid
        }
        window.parent.network.postRequest(data_obj, function (data) {
            if (data.rating)
                $('.rating').rating('rate', data.rating);
        });
    }

    InitRateSupplier(){

        $('input.rating').on('change', function (ev) {
            let data_obj ={
                proj:"d2d",
                user: window.parent.user.constructor.name.toLowerCase(),
                func:"ratesup",
                cusuid: window.parent.user.uid,
                psw: window.parent.user.psw,
                supuid: window.parent.user.viewer.uid,
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
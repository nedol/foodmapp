'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');
require('bootstrap');
require('bootstrap-select');

require("../../lib/jquery-comments-master/js/jquery-comments.js")
require("../../lib/bootstrap-rating/bootstrap-rating.min.js")

require('tablesorter/dist/js/jquery.tablesorter.js');
// require('tablesorter/dist/js/jquery.tablesorter.widgets.js');
// require('tablesorter/dist/js/widgets/widget-scroller.min.js');
// require('tablesorter/dist/js/widgets/widget-grouping.min.js');
//
// import 'tablesorter/dist/css/theme.default.min.css';
// import 'tablesorter/dist/css/widget.grouping.min.css';

import comment_obj from "../../dist/assets/vendor/jquery-comments/params.json";

import {Utils} from "../utils/utils";



let utils = new Utils();
let _ = require('lodash');
let md5 = require('md5');

$(window).on('load', () => {
    let iOSdevice = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)
    if (iOSdevice)
        $('[role="tablist"] .nav-link').each((i,e) => {
            if (!$(e).attr('href'))
                $(e).attr('href', $(e).data('target'))
        });

});

$(document).on('readystatechange', function () {

    if (document.readyState !== 'complete') {
        return;
    }

    window.InitDeliverOffer = function () {
        if(!window.order ) {
            window.order = new DeliverOffer();
            window.order.OpenOffer();
        }else{

            window.order.InitTabsByCategories();
            window.order.InitOrderByOffer();
        }
    };

    if(window.parent.sets.css)
        $('#cus_link').attr('href', '../css/' + window.parent.sets.css+'.css?v='+String(Date.now()));

    let readURL = function(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $('.avatar').attr('src',e.target.result);
                $('.avatar').siblings('input:file').attr('changed',true);
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    $(".file-upload").on('change', function(e){
        let el = this;
        try {
            loadImage(
                e.target.files[0],
                function (img, data) {
                    if (img.type === "error") {
                        console.error("Error loading image ");
                    } else {

                        let this_img = img.toDataURL();

                        setTimeout(function () {

                            $('.avatar').attr('src', this_img);

                            $('.avatar').siblings('input:file').attr('changed', true);
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
    });

});

export class DeliverOffer{
    constructor(){
        let that = this;

        this.path = host_port;
        this.uid = window.parent.user.uid;
        this.profile = window.parent.user.profile.profile;
        this.offer = window.parent.user.offer.stobj.data;
        this.promo = window.parent.user.promo;
        this.prolong = window.parent.user.prolong;
        this.rating = window.parent.user.rating;

        this.date = window.parent.user.date;

        this.body = $('body');
        this.body.find('.save').off();
        this.body.find('.save').on('click touchstart', this, function (ev) {
            ev.preventDefault();
            ev.stopPropagation();

            if($('[href="#profile_pane"]').hasClass('active')) {
                that.SaveProfile(function (ev_prof) {
                    if (!ev_prof) {
                        alert(window.parent.sysdict.getValByKey(window.parent.sets.lang, "03870ff3038eb6709c2c0ab02bac5563"));
                    }
                    $('.loader').css('display', 'none');
                });
            }else if($('[href="#editor_pane"]').hasClass('active')) {
                let items = that.GetOfferItems(window.parent.sets.lang);
                $('.loader').css('display', 'block');
                $.each($(':checkbox:checked.approve'), function (i, el) {
                    window.parent.db.GetOrder(window.parent.user.date, window.parent.user.uid, $(el).attr('cusuid'), function (obj) {
                        window.parent.user.ApproveOrder(obj, $(el).attr('title'));
                    });
                });

                window.parent.user.PublishOffer(items['remote'], window.parent.user.date, ev.data, function (obj) {
                    $('.loader').css('display', 'none');
                    if (!items) {
                        return false;
                    }
                    try {
                        window.parent.user.offer.stobj.published = obj.published;
                        window.parent.user.offer.stobj.data = JSON.parse(obj.offer);
                        let local = {
                            data: JSON.parse(obj.offer),
                            date: window.parent.user.offer.stobj.date,
                            longitude: window.parent.user.offer.stobj.longitude,
                            latitude: window.parent.user.offer.stobj.latitude,
                            radius: window.parent.user.offer.stobj.radius
                        };
                        window.parent.user.offer.SetOfferDB(local);
                    } catch (ex) {
                        console.log(ex);
                    }

                    let ind = $("li.tab_inserted.active").val();
                    let active = $($("li.active").find('img')[ind]).text();

                });

                $('.loader').css('display', 'none');
            }
        });

        this.body.find('.close_frame').off();
        this.body.find('.close_frame').on('click touchstart', this, function (ev) {
            ev.preventDefault();
            ev.stopPropagation();

            let that = ev.data;

            let items = that.GetOfferItems(window.parent.sets.lang);

            let confirm = window.confirm(window.parent.sysdict.getValByKey(window.parent.sets.lang, "8f11493a45b374d08387a61c85b288ef"));
            if (confirm) {
                $('.loader', $(window.parent.document).contents()).css('display', 'block');

                $.each($(':checkbox:checked.approve'), function (i, el) {
                    window.parent.db.GetOrder(window.parent.user.date, window.parent.user.uid, $(el).attr('cusuid'), function (obj) {
                        window.parent.user.ApproveOrder(obj, $(el).attr('title'));
                    });
                });

                that.SaveProfile(function (ev_prof) {
                    if (!ev_prof) {
                        alert(window.parent.sysdict.getValByKey(window.parent.sets.lang, "03870ff3038eb6709c2c0ab02bac5563"));
                    } else {

                        window.parent.user.PublishOffer(items['remote'], window.parent.user.date, ev.data, function (obj) {
                            if ($(window.parent.document).find(".category[state='1']").length ===0 || !items) {
                                $(frameElement).css('display','none');
                                $('#deliver_frame_container',window.parent.document).css('display','none');
                                return false;
                            }
                            try {
                                window.parent.user.offer.stobj.published = obj.published;
                                window.parent.user.offer.stobj.data = JSON.parse(obj.offer);
                                let local = {data:JSON.parse(obj.offer), date:window.parent.user.offer.stobj.date,
                                    longitude:window.parent.user.offer.stobj.longitude,latitude:window.parent.user.offer.stobj.latitude,
                                    radius:window.parent.user.offer.stobj.radius};
                                window.parent.user.offer.SetOfferDB(local);
                            } catch (ex) {
                                console.log(ex);
                            }

                            let ind = $("li.tab_inserted.active").val();
                            let active = $($("li.active").find('img')[ind]).text();

                        });
                    }
                });

            }else{
                $('.filter_div').remove();
                $('.card').remove();
                $(frameElement).css('display','none');
                $('#deliver_frame_container',window.parent.document).css('display','none');

            }

            $('.loader').css('display', 'none');
        });

        $('.nav-tabs a').on('shown.bs.tab', function(event){
            var x = $(event.target).text();         // active tab
            // var y = $(event.relatedTarget).text();  // previous tab
            // if($(event.currentTarget).attr('href')==='#editor_pane' || $(event.currentTarget).attr('href')==='#profile')
            //     $('#add_item').css('display','block');
            // else
            //     $('#add_item').css('display','none')  ;
        });

    }

    addTab(cat_tab, cat_img, state){
        let that = this;
        let cat_str = '';
        if(state==='0')
            return;
        if($(window.parent.document).contents().find('#'+cat_tab).closest('.cat_div')[0])
            cat_str = $(window.parent.document).contents().find('#'+cat_tab).closest('.cat_div')[0].outerHTML;
        else if(!cat_str)// let cat_str = cat_img?'<img class="nav-link" data-toggle="tab"  contenteditable="false" data-translate="' + md5(cat_tab) + '"  href="#tab_' + cat_tab + '" src="'+cat_img+'"  title="'+cat_tab+'">':
            cat_str =
                '<span class="cat_div  text-center" data-toggle="tab" href="#tab_'+cat_tab+'">'+
                '<span id="'+cat_tab+'" class="category icofont-brand-natgeo"  extra="true" title="'+cat_tab+'" state="0"></span>'+
                '<h5 class="title" contenteditable="true">'+cat_tab+'</h5>'+
                '<h6><span class="cat_cnt badge badge-pill badge-secondary">0</span></h6>'+
                '</div>';
        if ($('[href="#tab_' + cat_tab + '"]').length === 0) {
            //$('#menu_tabs').prepend(cat_str);
            $(cat_str ).insertBefore(that.body.find('#add_tab_li'));
            $('<div id="tab_' + cat_tab + '" class="div_tab_inserted tab-pane" '+state+'>' +
                '<div class="filter_div collapse show"></div>'+
                '</div>').insertBefore($('#add_tab_div'));
        }
    }

    OpenOffer() {
        let that = this;

        if($('.kolmi').length===0) {

            let kolmi = $('iframe.kolmi_tmplt').clone();
            $(kolmi).css('display', 'block')
                .attr('class', 'kolmi')
                .attr('src', '../kolmi/kolmi.html?trans=all&role=operator&em=' + window.parent.user.email);
            $('#kolmi_pane').append(kolmi);
        }

        if(this.profile.name || this.profile.email)
            $('.name').css('display','block').text(this.profile.name?this.profile.name:this.profile.email.split('@')[0]);
        window.parent.db.GetSupApproved(this.uid, function (res) {
            that.appr = res;
        });

        window.parent.dict.set_lang(window.parent.sets.lang,this.body[0]);

        this.dict = window.parent.dict;

        let cats= [];
        for (let tab in that.offer) {
            cats.push($('.category[cat="'+tab+'"]', window.parent.document).attr('id'));
        }

        if(window.parent.user.profile.address)
            that.body.find('.address').val(window.parent.user.profile.address);

        if(window.parent.user.settings){
            for(let par in window.parent.user.settings){
                $('#settings').find('select#'+par).find('option[value='+window.parent.user.settings[par]+']').attr('selected', true);
            }
        }

        $('img.avatar').after("<h6>"+window.parent.sysdict.getValByKey(window.parent.sets.lang,"9f2021284ca26bc3dc2862add9ca84c6")+"</h6>");
        $('img.avatar').on('click',function (ev) {
            $(this).siblings('.file-upload').trigger('click');
        });


        $('#add_tab_li').on('click', function (ev) {

            let text = "Введите наименование категории";
            let hint = "";
            let cat_tab = prompt(text, hint);
            let img = null;

            window.order.addTab(cat_tab,img,1);
        });

        setTimeout(function () {
            that.InitTabsByCategories();
            that.InitOrderByOffer();
            $('#deliver_frame_container',window.parent.document).css('height','100%');

            let isDown = false, isScroll = false ;
            let startX;
            let scrollLeft;

            that.FillProfile(that.profile);

            that.InitDeliverReview(that);

            $('.table-responsive').on("mousedown", function(e) {
                isDown = true;
                this.classList.add("active");
                startX = e.pageX - this.offsetLeft;
                scrollLeft = this.scrollLeft;
            });
            $('.table-responsive').on("mouseleave", function() {

                isDown = false;
                this.classList.remove("active");
            });
            $('.table-responsive').on("mouseup", function() {

                setTimeout(function () {
                    isScroll = false;
                },100);
                isDown = false;
                this.classList.remove("active");
                return false;
            });
            $('.table-responsive').on("mousemove", function(e) {

                if (!isDown) return;
                isScroll = true;
                e.preventDefault();
                const x = e.pageX - this.offsetLeft;
                const walk = x - startX;
                this.scrollLeft = scrollLeft - walk;
            });

            //
        },500);
    }

    InitOrderByOffer() {

        $('.menu_item').off();
        $('.menu_item').remove();
        $('.tab_inserted').remove();

        let that = this;
        let isEditable = true;
        for (let t in that.offer){

            let img = $(".category#"+t,window.parent.document).attr('src');
            if(that.offer[t].img)
                img = that.offer[t].img;
            window.order.addTab(t,img,$(".category#"+t,window.parent.document).attr('state'));
            openTab(t);
        }

        $($('.cat_div')[0]).addClass('active');
        $($($('.cat_div')[0]).attr('href')).addClass('active');

        function openTab(tab) {

            for (let i in that.offer[tab]) {
                if(i=== '0')
                    openOffer(tab,i)
                else {
                    setTimeout(function (i) {
                        openOffer(tab,i)
                    }, 0,i);
                }
            }

            $('[href="#tab_' + tab + '"]').on('show.bs.tab', function (ev) {
                if (ev.relatedTarget) {
                    //let items = that.getTabItems($(ev.relatedTarget).text(), window.sets.lang);
                    //window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, 'published');
                }
            });

            $('[href="#tab_' + tab + '"]').on('hide.bs.tab', function (ev) {
                if (ev.target) {
                    //let items = that.getTabItems($(ev.target).text(), window.sets.lang);
                    //window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, this.status);
                }
            });

            setTimeout(function () {
                $('#'+tab).siblings('.cat_cnt').text($('#tab_' + tab).find('.menu_item').length)
            },100);

        }

        function openOffer(tab, i) {

            let extra = $(".category#" + tab, window.parent.document).attr('extra');
            let menu_item = $('#menu_item_tmplt').clone();
            $(menu_item).attr('id', tab + '_' + i);
            $(menu_item).attr("class", 'menu_item');
            $(menu_item).css('display', 'block');

            $(menu_item).find('.publish:checkbox').attr('id', 'item_cb_' + i);
            $(menu_item).find('.publish:checkbox').attr('pos', i);
            $(menu_item).find('.publish:checkbox').attr('tab', tab);

            $(menu_item).find('.item_cb').css('visibility', 'visible');

            if (that.offer[tab][i].checked == 'true') {
                $(menu_item).find('.publish:checkbox').prop('checked', true);
                if (that.published)
                    isEditable = false;
            } else {
                isEditable = true;
            }

            if (that.offer[tab][i].title) {
                $(menu_item).find('.item_title').attr('data-translate', that.offer[tab][i].title);
            }

            if (that.profile.type === 'deliver') {
                if (that.offer[tab][i].dict_name) {
                    that.dict.dict[that.offer[tab][i].title] = that.offer[tab][i].dict_name;
                }
            }

            $(menu_item).find('.item_title').attr('data-target', '#content_' + tab + '_' + i);
            // $(menu_item).find('.item_title').attr('contenteditable', 'true');
            $(menu_item).find('.item_title').attr('contenteditable', isEditable);

            $(menu_item).find('.item_price').attr('contenteditable', isEditable);
            // $(menu_item).find('.item_price').val(that.offer[tab][i].packlist[0].price?that.offer[tab].price:that.offer[tab].price.price);

            if (that.offer[tab][i].brand) {
                $(menu_item).find('.brand').css('visibility', 'visible');
                let src = '';
                if (that.offer[tab][i].brand.logo.includes('http') || that.offer[tab][i].brand.logo.includes('base64'))
                    src = that.offer[tab][i].brand.logo;
                else {
                    src = that.path + '/images/' + that.offer[tab][i].brand.logo;
                }

                src = src.replace('http://localhost:63342', '..');
                $(menu_item).find('.brand').attr('src', src);
            }

            that.fillPacklist(menu_item, tab, i);

            $(menu_item).find('.item_pack').attr('packlist', JSON.stringify(that.offer[tab][i].packlist));
            $(menu_item).find('.item_price').on('focusout', {that: that, mi: $(menu_item)}, function (ev) {
                $(menu_item).find('.add_pack').css('visibility', 'hidden');
                that.OnClickAddPack(ev);
            });

            $(menu_item).find('.item_price').on('click touchstart', that, function (ev) {
                //$(menu_item).find('.add_pack').css('visibility', 'visible');
                //$(this).focus();
            });

            $(menu_item).find('.item_qnty').on('focusout', {that: that, mi: $(menu_item)}, function (ev) {
                that.OnClickAddPack(ev);
            });

            for (let c in that.offer[tab][i].cert) {
                let src = that.offer[tab][i].cert[c].src;

                if (!that.offer[tab][i].cert[c].src.includes('data:image'))
                    src = that.path + "/images/" + that.offer[tab][i].cert[c].src;
                if ($(menu_item).find('img[src="' + src + '"]').length === 0) {
                    $(menu_item).find('.carousel-inner').append(
                        '<div class="carousel-item">' +
                        // '<img  class="img-fluid mx-auto d-block" src=' + src + '>' +
                        '<img  class="carousel-img img-fluid" src=' + src + '>' +
                        '</div>');
                }

                $(menu_item).find('.cert_container').find('img').longTap(function () {
                    let active = $(menu_item).find('.cert_container').find('.active');
                    active.removeClass('carousel-item');
                    $(menu_item).find('.cert_container').find('img').draggable(
                        {delay: 0},
                        {cursor: "crosshair"},
                        {
                            start: function (ev) {
                            },
                            drag: function (ev) {
                                //$(el).attr('drag', true);
                            },
                            stop: function (ev) {
                                // $(menu_item).find('.cert_container').find('img').draggable('destroy');
                                //$(menu_item).find('.active').addClass('carousel-item');
                                $(menu_item).find('.cert_container').find('img').attr('drag_left', $(ev.target).css('left'));
                                $(menu_item).find('.cert_container').find('img').attr('drag_top', $(ev.target).css('top'));
                            }
                        });
                });
            }

            $($(menu_item).find('.carousel-inner').find('.carousel-item')[0]).addClass('active');
            //$(menu_item).find('.carousel').carousel({interval: 3000});
            $(menu_item).find('.carousel').attr('id', 'carousel_' + tab + '_' + i);
            $(menu_item).find('.carousel').append(
                '<a class="carousel-control-prev" href="#carousel_' + tab + '_' + i + '">' +
                '<span class="carousel-control-prev-icon"></span>' +
                '</a>' +
                '<a class="carousel-control-next" href="#carousel_' + tab + '_' + i + '">' +
                '<span class="carousel-control-next-icon"></span>' +
                '</a>');

            // Enable Carousel Controls
            $(menu_item).find(".carousel-control-prev").click(function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                $('#carousel_' + tab + '_' + i).carousel("prev");
                menu_item.find('.carousel').carousel('pause');
            });

            $(menu_item).find(".carousel-control-next").click(function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                $('#carousel_' + tab + '_' + i).carousel("next");
                menu_item.find('.carousel').carousel('pause');
            });

            menu_item.find('img').doubleTap(function (ev) {
                if (confirm({
                        'ru': 'Удалить изображение?',
                        'en': 'Remove image?',
                        'fr': 'Supprimer l\'image ?'
                    }[that.lang])) {
                    $(this).closest('.carousel-item').remove();
                    menu_item.find('.carousel').carousel("next");
                    $($(menu_item).find('.carousel-inner').find('.carousel-item')[0]).addClass('active');
                    menu_item.find('.carousel').carousel('pause');
                }
            });

            if(!$('#tab_' + tab).find('.pub_div')[0]) {
                $('#tab_' + tab).find('.filter_div').append(
                    '<div class="pub_div form-check">' +
                    '     <input type="checkbox" checked class="form-check-input"  value="published"' +
                    '         style="transform: scale(1.5);-webkit-transform: scale(1.5);">' +
                    '    <label class="form-check-label">опубликовано</label>' +
                    '</div>');
                $('#tab_' + tab).find('.filter_div').append(
                    '<div class="pub_div form-check">' +
                    '     <input type="checkbox" checked class="form-check-input"  value="unpublished"' +
                    '         style="transform: scale(1.5);-webkit-transform: scale(1.5);">' +
                    '    <label class="form-check-label">н/опубликовано</label>' +
                    '</div>');
            }

            if(that.offer[tab][i].prop) {
                $('#tab_' + tab).find('.filter_div').css('visibility','visible');

                $('<div>').load("../html/tmplt/prop.tmplt.html",function (el) {
                    $('.filter_div').draggable();
                    for(let p in that.offer[tab][i].prop) {
                        if (!$('#tab_' + tab).find('.filter_div').find('#prop_' + p)[0])
                            $('#tab_' + tab).find('.filter_div').append('<div id="prop_' + p.replace(/\s+/g, '') + '" class="prop_name">' + p + '</div>');

                        for (let v in that.offer[tab][i].prop[p]) {

                            if ($('#tab_' + tab).find('.filter_div').find('label:contains(' + that.offer[tab][i].prop[p][v] + ')')[0])
                                continue;
                            let cpy = $(el).clone();
                            cpy.find('.prop_check').val(that.offer[tab][i].prop[p][v]);
                            cpy.find('label').text(that.offer[tab][i].prop[p][v]);

                            $(cpy).find(':checkbox').on('change', function (ev) {

                                $('.menu_item').css('display', 'none');

                                $.each( $('input.prop_check'), function (i,el ) {
                                    if($(el).prop('checked')){
                                        $('.prop_val[value="'+$(el).val()+'"]').closest('.menu_item').css('display', 'block');
                                    }
                                })
                            });
                            $('#tab_' + tab).find('.filter_div').find('#prop_' + p.replace(/\s+/g, '')).append(cpy);
                        }
                    }
                });
            }

            if(that.offer[tab][i].content_text)
                if (that.offer[tab][i].content_text.value && that.offer[tab][i].content_text.value!=='d41d8cd98f00b204e9800998ecf8427e') {
                    $(menu_item).find('.item_title').siblings('span').css('display','block');
                    // $(menu_item).find('.content_text').attr('contenteditable', 'false');
                    $(menu_item).find('.content_text').attr('data-translate', that.offer[tab][i].content_text.value);
                }


            $(':checkbox').on('change', function (ev) {

                if($(ev.target).prop('checked')) {
                    if ($(ev.target).attr('value')==='published') {
                        $.each($('.publish:checked').closest('.menu_item'), function (i, item) {
                            $(item).css('display','block');
                        });
                    }else if($(ev.target).attr('value')==='unpublished'){
                        $.each($('.publish:not(:checked)').closest('.menu_item'), function (i, item) {
                            $(item).css('display','block');
                        });
                    }
                }else {
                    if ($(ev.target).attr('value')=== 'published') {
                        $.each($('.publish:checked').closest('.menu_item'), function (i, item) {
                            $(item).css('display', 'none');
                        });
                    } else if ($(ev.target).attr('value')=== 'unpublished') {
                        $.each($('.publish:not(:checked)').closest('.menu_item'), function (i, item) {
                            $(item).css('display', 'none');
                        });
                    }
                }
            });
            //menu_item.find('.prop.container').empty();
            for(let k in that.offer[tab][i].prop){
                for(let v in that.offer[tab][i].prop[k]) {
                    let row = menu_item.find('.row.tmplt').clone();
                    row.removeClass('tmplt');
                    row.addClass('prop');
                    row.find('.add_prop_div').remove();
                    row.find('.input').attr("contenteditable", true);
                    row.find('.prop_key').val(k);
                    row.find('.prop_val').val(that.offer[tab][i].prop[k][v]);
                    row.find('.prop_val').attr('value',that.offer[tab][i].prop[k][v]);
                    menu_item.find('.prop.container').append(row);
                }
            }

            if(that.offer[tab][i].bargain==='true'){
                $(menu_item).find('.bargain:checkbox').prop('checked',"true");
            }

            if(extra==='true'){
                $(menu_item).find("[data-target='.extras']").css('display','block');
                $(menu_item).find('.extras').attr('id','extra'+ tab + '_' + i);
                $(menu_item).find("[data-target='.extras']").attr('data-target','#extra'+ tab + '_' + i);
            }

            $.each(that.offer[tab][i].extra, function (e, el){
                if(!el)
                    return;
                let row = $($(menu_item).find('.add_title_div')[0]).closest('.row').clone();
                row.addClass('extra');
                row.find('.extra_title').text(el.title);
                row.find('.extra_price').text(el.price);
                row.find('.input').attr('contenteditable',true);
                row.find('.add_extra_div').remove();
                if(el.title)
                    $($(menu_item).find('.add_title_div')[0]).closest('.row').parent().append(row);
            });


            $('#tab_' + tab).append(menu_item);//добавить продукт в закладку

            that.lang = window.parent.sets.lang;
            window.parent.dict.set_lang(window.parent.sets.lang, $("#"+menu_item.attr('id')));

            $(menu_item).find('input:file').on('change', menu_item, that.onLoadImage);

            $(menu_item).find('.img-fluid').attr('id', 'ap_' + tab + '_' + i);
            $(menu_item).find('.fa-image').on('click touchstart', menu_item, function (ev) {
                let menu_item = $(this).closest('.menu_item');
                //let vis = $(menu_item).find('.img-fluid').css('visibility');
                ev.target = $(menu_item).find('.img-fluid')[0];
                ev.mi = $(menu_item).attr('id');
                that.OnClickImport(ev);

            });

            if (that.offer[tab][i].brand) {
                $(menu_item).find('.brand_img').css('visibility', 'visible');
                let src = '';
                if(that.offer[tab][i].brand.logo.includes('http') || that.offer[tab][i].brand.logo.includes('base64'))
                    src = that.offer[tab][i].brand.logo;
                else {
                    src = that.path+'/images/' + that.offer[tab][i].brand.logo;
                }

                src = src.replace('http://localhost:63342', '..');
                $(menu_item).find('.brand_img').attr('src', src);


            }

            $(menu_item).find('.brand_img').attr('id', 'brand_' + tab + '_' + i);
            $(menu_item).find('.brand').on('click touchstart', menu_item, function (ev) {
                let menu_item = $(this).closest('.menu_item');
                //let vis = $(menu_item).find('.img-fluid').css('visibility');
                ev.target = $(menu_item).find('.brand_img')[0];
                ev.mi = $(menu_item).attr('id');
                that.OnClickImport(ev);
            });

            $(menu_item).find('.brand_img').on('dragend', function () {
                $('.brand_img').remove();
            });

            $(menu_item).find('.brand_img').on('click touchstart', menu_item, function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
            });

            $(menu_item).find('.brand_img').doubleTap(function (ev) {
                $(this).remove();
            });

            $(menu_item).find('.img_cert').on('click touchstart', menu_item, function (ev) {
                let menu_item = $(this).closest('.menu_item');
                ev.target = $(menu_item).find('.cert_container')[0];
                ev.mi = $(menu_item).attr('id');
                that.OnClickAddCert(ev);
            });

            $(menu_item).find('.toolbar').css('display', 'block');

            $(menu_item).find('.orders').attr('id', 'orders' + tab + '_' + i);
            $(menu_item).find('.order_ctrl').attr('data-toggle', 'collapse');
            $(menu_item).find('.order_ctrl').attr('data-target', '#orders' + tab + '_' + i)

            $(menu_item).find('.tablesorter').attr('id', 'ordtable_' + that.offer[tab][i].title);

            $(menu_item).find('a[role=packitem]').on('click touchstart', {
                that: that,
                mi: $(menu_item)
            }, that.OnClickPack);

            $('a[href="#' + tab + '"]').css('color', 'blue');

            $(menu_item).find('.item_title').collapse('hide');

            // $(menu_item).find('.cert_container').sortable({
            //     connectWith: "div",
            //     placeholder: "ui-state-highlight"
            // });
            $(menu_item).find('.add_extra').on('click', that.onAddExtra);
            $(menu_item).find('.add_prop').on('click', that.onAddProp);
        }

        $('li.active a').on('show.bs.tab', function (ev) {
            if (ev.relatedTarget) {
                //let items = that.getTabItems($(ev.relatedTarget).text(), window.sets.lang);
                //window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, 'published');
            }
            // $('.tab_inserted  img:first').tab('show');
            // $('.tab_inserted img:first').addClass('active');

        });

        //$('li.active a').tab('show');

        //$('.tab_inserted  img:first').trigger('click');

        if (window.parent.user.date.getDate() === new Date().getDate()) {
            $('.notoday').removeClass('notoday');
        }

        window.parent.db.GetSupOrders(new Date(that.date), window.parent.user.uid, function (res) {

            $.each(res, function (i, item) {

                let data = res[i].data;
                let inv_period = '', inv_qnty = '', tr_class = '', tr_disabled = '', tr_style = '';
                if (res[i].period !== that.offer.period) {
                    inv_period = "style='color:red'";
                }
                let kAr = Object.keys(data);
                let calcDistance = new Promise(
                    function (resolve, reject) {
                        if (!that.location)
                            resolve('undefined');
                        window.parent.user.map.geo.GetDistanceToPlace(that.location, res[i].address, function (res) {
                            resolve(res);
                        });
                    }
                );
                //calcDistance.then(function (dist) {
                function setOwner(k){

                    window.parent.db.GetOffer(new Date(that.date), function (off) {
                        if (off.length>=1) {
                            let ar = off[0].data[res[i].data[k].cat]
                            let r = _.find(ar, 'title', k);
                            if(r)
                                $(".owner[title='" + k + "']").text(r.owner?r.owner:'');
                        }
                    });
                }

                for (let k in kAr) {

                    for (let o in data[kAr[k]].ordlist) {

                        $('.item_title[data-translate=' + kAr[k] + ']').closest('.menu_item').find('.order_ctrl').css('visibility', 'visible');

                        if (data[kAr[k]].deleted) {//deleted
                            inv_qnty = "title='deleted' style='color:red'";
                            tr_style = "color:red;text-decoration:line-through";
                            tr_disabled = "disabled";

                        }

                        let mi = $('.item_title[data-translate=' + kAr[k] + ']').closest('.menu_item');
                        let price = mi.find('.item_price').val();
                        if (data[kAr[k]].price !== price) {
                            tr_class += " inv_price";
                        }
                        let num = data[kAr[k]].num?data[kAr[k]].num:'na';

                        let rsrv, remain = '&nbsp;'
                        try {
                            rsrv = that.offer[data[kAr[k]].cat][i].packlist[o]['rsrv']?
                                that.offer[data[kAr[k]].cat][i].packlist[o]['rsrv'] : 0;
                            remain = parseInt(that.offer[data[kAr[k]].cat][i].packlist[o]['qnty']) - rsrv;
                            if(remain==='NaN')
                                remain = '';
                        }catch(ex){

                        }

                        let kolmi = $('iframe.kolmi_tmplt').clone();
                        $(kolmi).css('display', 'block')
                            .css('margin', '0 auto')
                            .attr('class', 'kolmi')
                            .attr('src', '../rtc/kolmi.html?&role=user&uid=' + md5(res[i].cusuid) + '&abonent='+res[i].cusuid);


                        let tr = "<tr class='tr_item' style='text-align: center;" + tr_style + "' " + tr_disabled + ">" +
                            "<td>" + num + "</td>" +
                            "<td>" +
                            "<input type='checkbox'  class='checkbox-inline approve' title='" + kAr[k] + "' cusuid=" + res[i].cusuid + " " +
                            "style='transform: scale(1.5);-webkit-transform: scale(1.5);'>" +
                            "<a style='font-size: x-small; margin: 10px 10px'>"+remain+"</a>"+
                            "</td>" +
                            "<td>" + data[kAr[k]].cat + "</td>" +
                            "<td style='word-break:break-all;'>" + that.dict.getValByKey(that.lang, kAr[k]) + "</td>" +
                            "<td>" + o+ "</td>" +
                            "<td " + inv_qnty + ">" + data[kAr[k]].ordlist[o].qnty + "</td>" +
                            "<td>" + String(data[kAr[k]].ordlist[o].price) + "</td>" +
                            "<td>" +
                            (data[kAr[k]].email ? data[kAr[k]].email : 'no email') + "<br>" + (data[kAr[k]].mobile ? data[kAr[k]].mobile : 'no mobile') +
                            "</td>" +
                            "<td class='owner' title='" + kAr[k] + "'>" + setOwner(kAr[k]) + "</td>" +
                            "<td " + inv_period + ">" + res[i].period + "</td>" +
                            "<td class='tablesorter-no-sort'>" +
                            (res[i].comment ? "<span class='tacomment'>" + res[i].comment + "</span>" : '') +
                            "</td>" +
                            "<td style='text-align: center;'>" +
                            kolmi[0].outerHTML+
                            "</td>" +
                            "<td>" + "0" + "</td>" +
                            "</tr>";

                        $(tr).appendTo($('tbody'));


                        $('.approve').on('click',function (ev) {
                            //if(remain==='&nbsp;')
                            //    return; TODO: remains
                            let pl = JSON.parse(mi.find('.item_pack').attr('packlist'));
                            pl[o]['rsrv'] = pl[o]['rsrv']? pl[o]['rsrv']:0;

                            if ($(this)[0].checked == true) {
                                $(this).closest('td').find('a').text(remain - data[kAr[k]].ordlist[o].qnty);
                                pl[o]['rsrv'] = pl[o]['rsrv'] - data[kAr[k]].ordlist[o].qnty;
                            }else {
                                $(this).closest('td').find('a').text(remain);
                                pl[o]['rsrv'] = pl[o]['rsrv'] + data[kAr[k]].ordlist[o].qnty;
                            }
                            mi.find('.item_pack').attr('packlist', JSON.stringify(pl));

                        });

                        if (window.parent.user.profile.profile.type === 'marketer') {
                            $('.marketer').css('display', 'none');
                            $('.complete').attr('disabled', 'true');
                        }
                        window.parent.db.GetApproved(new Date(date), window.parent.user.uid, res[i].cusuid, kAr[k], function (appr) {
                            if (appr && appr.data.qnty === res[i].data[kAr[k]].qnty &&
                                appr.data.price === res[i].data[kAr[k]].price) {
                                $(".approve[title='" + kAr[k] + "'][cusuid=" + res[i].cusuid + "]").attr('checked', 'checked');
                                $(".approve[title='" + kAr[k] + "'][cusuid=" + res[i].cusuid + "]").attr('disabled', 'true');

                            }
                        });
                    }

                    for (let e in data[kAr[k]].extralist) {

                        let tr = "<tr class='tr_item'>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td  style='text-align: center;'>" + e+ "</td>" +
                            "<td  style='text-align: center;'>" + data[kAr[k]].extralist[e].qnty + "</td>" +
                            "<td  style='text-align: center;'>" + String(data[kAr[k]].extralist[e].price) + "</td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "</tr>";

                        $(tr).appendTo($('tbody'));
                    }
                }
            });

            $('.tablesorter').tablesorter({
                theme: 'blue',
                headers: {
                    0: { sorter: "checkbox" }
                    //3: { sorter: "select" }
                    // 6: { sorter: "inputs" }
                    // 7: defaults to "shortDate", but set to "weekday-index" ("group-date-weekday") or "time" ("group-date-time")
                },
                widgets: ['group', 'zebra', 'column'],
                usNumberFormat: false,
                sortReset: true,
                sortRestart: true,
                sortInitialOrder: 'desc',
                widthFixed: true,
                widgetOptions: {
                    group_collapsible: true,  // make the group header clickable and collapse the rows below it.
                    group_collapsed: false, // start with all groups collapsed (if true)
                    group_saveGroups: true,  // remember collapsed groups
                    group_saveReset: '.group_reset', // element to clear saved collapsed groups
                    group_count: " ({num})", // if not false, the "{num}" string is replaced with the number of rows in the group

                    // apply the grouping widget only to selected column
                    group_forceColumn: [],   // only the first value is used; set as an array for future expansion
                    group_enforceSort: true, // only apply group_forceColumn when a sort is applied to the table

                    // checkbox parser text used for checked/unchecked values
                    group_checkbox: ['checked', 'unchecked'],

                    // change these default date names based on your language preferences (see Globalize section for details)
                    group_months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                    group_week: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                    group_time: ["AM", "PM"],

                    // use 12 vs 24 hour time
                    group_time24Hour: false,
                    // group header text added for invalid dates
                    group_dateInvalid: 'Invalid Date',
                },
                // this function is used when "group-date" is set to create the date string
                // you can just return date, date.toLocaleString(), date.toLocaleDateString() or d.toLocaleTimeString()
                // reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#Conversion_getter
                group_dateString: function (date) {
                    return date.toLocaleString();
                },

                group_formatter: function (txt, col, table, c, wo, data) {
                    // txt = current text; col = current column
                    // table = current table (DOM); c = table.config; wo = table.config.widgetOptions
                    // data = group data including both group & row data
                    if (col === 7 && txt.indexOf("GMT") > 0) {
                        // remove "GMT-0000 (Xxxx Standard Time)" from the end of the full date
                        // this code is needed if group_dateString returns date.toString(); (not localeString)
                        txt = txt.substring(0, txt.indexOf("GMT"));
                    }
                    // If there are empty cells, name the group "Empty"
                    return txt === "" ? "Empty" : txt;
                }
            });

            $('.order_amnt').text($('.tr_item').length);

            that.orders = res;

        });


        $('#add_item').off();
        $('#add_item').on('click touchstart', that, that.AddOfferItem);

        $('.input').click(function (ev) {
            $(this).focus();
        });

        $("#editor_pane").find('.publish_offer_ctrl').off('click touchstart');
        $("#editor_pane").find('.publish_offer_ctrl').on('click touchstart', this, function (ev) {
            window.parent.user.PublishOffer(ev.data.GetOfferItems(ev.data.lang, true)['remote'], that.date, ev.data, function (obj) {

            });
        });

        $('[data-toggle="popover"]').popover();

        try {
            window.parent.sysdict.set_lang(window.parent.sets.lang, this.body[0]);
        }catch (ex){

        }

        setTimeout(function () {
            that.ord_items = that.GetOfferItems(that.lang);
        },500);

    }

    InitTabsByCategories() {

        let that = this;

        $('.category[state="1"]',window.parent.document).each(function (i, cat) {
            let extra = $(cat).attr('extra');
            let cat_tab = $(cat).attr('id');
            let cat_img = $(cat).attr('src');

            that.addTab(cat_tab,cat_img,'1');

            $('.dropdown').css('visibility', 'visible');
            $('#order_menu_button').css('visibility', 'visible');

            $('#add_tab_li').css('visibility', 'visible');

            $('.cat_div').on('click',function () {
                $('.cat_div').removeClass('active');
            });
            //$("#offer_pane").resizable();

            function selectText(el) {
                $(el).focus();
                document.execCommand('selectAll', false, null);
            }

            this.lang = window.parent.sets.lang;
            window.parent.sysdict.set_lang(window.parent.sets.lang, $("#menu_item_tmplt"));
            window.parent.sysdict.set_lang(window.parent.sets.lang, $("#editor_pane"));

            $('#promo').val(that.promo);

            $('#prolong option[value="'+that.prolong+'"]').prop('selected',true);

        });


        $('li.active a').on('show.bs.tab', function (ev) {
            if (ev.relatedTarget) {
                //let items = that.getTabItems($(ev.relatedTarget).text(), window.sets.lang);
                //window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, 'published');
            }
            // $('.tab_inserted  img:first').tab('show');
            // $('.tab_inserted img:first').addClass('active');

        });

        //$('li.active a').tab('show');

        //$('.tab_inserted  img:first').trigger('click');

        if (window.parent.user.date.getDate() === new Date().getDate()) {
            $('.notoday').removeClass('notoday');
        }

        window.parent.db.GetSupOrders(new Date(that.date), window.parent.user.uid, function (res) {

            $.each(res, function (i, item) {

                let data = res[i].data;
                let inv_period = '', inv_qnty = '', tr_class = '', tr_disabled = '', tr_style = '';
                if (res[i].period !== that.offer.period) {
                    inv_period = "style='color:red'";
                }
                let kAr = Object.keys(data);
                let calcDistance = new Promise(
                    function (resolve, reject) {
                        if (!that.location)
                            resolve('undefined');
                        window.parent.user.map.geo.GetDistanceToPlace(that.location, res[i].address, function (res) {
                            resolve(res);
                        });
                    }
                );
                //calcDistance.then(function (dist) {
                function setOwner(k){

                    window.parent.db.GetOffer(new Date(date), function (off) {
                        if (off.length>=1) {
                            let ar = off[0].data[res[i].data[k].cat]
                            let r = _.find(ar, 'title', k);
                            if(r)
                                $(".owner[title='" + k + "']").text(r.owner?r.owner:'');
                        }
                    });
                }

                for (let k in kAr) {

                    for (let o in data[kAr[k]].ordlist) {

                        $('.item_title[data-translate=' + kAr[k] + ']').closest('.menu_item').find('.order_ctrl').css('visibility', 'visible');

                        if (data[kAr[k]].deleted) {//deleted
                            inv_qnty = "title='deleted' style='color:red'";
                            tr_style = "color:red;text-decoration:line-through";
                            tr_disabled = "disabled";

                        }

                        let mi = $('.item_title[data-translate=' + kAr[k] + ']').closest('.menu_item');
                        let price = mi.find('.item_price').val();
                        if (data[kAr[k]].price !== price) {
                            tr_class += " inv_price";
                        }
                        let num = data[kAr[k]].num?data[kAr[k]].num:'na';

                        let rsrv, remain = '&nbsp;'
                        try {
                            rsrv = that.offer[data[kAr[k]].cat][i].packlist[o]['rsrv']?
                                that.offer[data[kAr[k]].cat][i].packlist[o]['rsrv'] : 0;
                            remain = parseInt(that.offer[data[kAr[k]].cat][i].packlist[o]['qnty']) - rsrv;
                            if(remain==='NaN')
                                remain = '';
                        }catch(ex){

                        }

                        let kolmi = $('iframe.kolmi_tmplt').clone();
                        $(kolmi).css('display', 'block')
                            .css('margin', '0 auto')
                            .attr('class', 'kolmi')
                            .attr('src', '../rtc/kolmi.html?&role=user&uid=' + md5(res[i].cusuid) + '&abonent='+res[i].cusuid);


                        let tr = "<tr class='tr_item' style='text-align: center;" + tr_style + "' " + tr_disabled + ">" +
                            "<td>" + num + "</td>" +
                            "<td>" +
                            "<input type='checkbox'  class='checkbox-inline approve' title='" + kAr[k] + "' cusuid=" + res[i].cusuid + " " +
                            "style='transform: scale(1.5);-webkit-transform: scale(1.5);'>" +
                            "<a style='font-size: x-small; margin: 10px 10px'>"+remain+"</a>"+
                            "</td>" +
                            "<td>" + data[kAr[k]].cat + "</td>" +
                            "<td style='word-break:break-all;'>" + that.dict.getValByKey(that.lang, kAr[k]) + "</td>" +
                            "<td>" + o+ "</td>" +
                            "<td " + inv_qnty + ">" + data[kAr[k]].ordlist[o].qnty + "</td>" +
                            "<td>" + String(data[kAr[k]].ordlist[o].price) + "</td>" +
                            "<td>" +
                            (data[kAr[k]].email ? data[kAr[k]].email : 'no email') + "<br>" + (data[kAr[k]].mobile ? data[kAr[k]].mobile : 'no mobile') +
                            "</td>" +
                            "<td class='owner' title='" + kAr[k] + "'>" + setOwner(kAr[k]) + "</td>" +
                            "<td " + inv_period + ">" + res[i].period + "</td>" +
                            "<td class='tablesorter-no-sort'>" +
                            (res[i].comment ? "<span class='tacomment'>" + res[i].comment + "</span>" : '') +
                            "</td>" +
                            "<td style='text-align: center;'>" +
                            kolmi[0].outerHTML+
                            "</td>" +
                            "<td>" + "0" + "</td>" +
                            "</tr>";

                        $(tr).appendTo($('tbody'));


                        $('.approve').on('click',function (ev) {
                            //if(remain==='&nbsp;')
                            //    return; TODO: remains
                            let pl = JSON.parse(mi.find('.item_pack').attr('packlist'));
                            pl[o]['rsrv'] = pl[o]['rsrv']? pl[o]['rsrv']:0;

                            if ($(this)[0].checked == true) {
                                $(this).closest('td').find('a').text(remain - data[kAr[k]].ordlist[o].qnty);
                                pl[o]['rsrv'] = pl[o]['rsrv'] - data[kAr[k]].ordlist[o].qnty;
                            }else {
                                $(this).closest('td').find('a').text(remain);
                                pl[o]['rsrv'] = pl[o]['rsrv'] + data[kAr[k]].ordlist[o].qnty;
                            }
                            mi.find('.item_pack').attr('packlist', JSON.stringify(pl));

                        });

                        if (window.parent.user.profile.profile.type === 'marketer') {
                            $('.marketer').css('display', 'none');
                            $('.complete').attr('disabled', 'true');
                        }
                        window.parent.db.GetApproved(new Date(date), window.parent.user.uid, res[i].cusuid, kAr[k], function (appr) {
                            if (appr && appr.data.qnty === res[i].data[kAr[k]].qnty &&
                                appr.data.price === res[i].data[kAr[k]].price) {
                                $(".approve[title='" + kAr[k] + "'][cusuid=" + res[i].cusuid + "]").attr('checked', 'checked');
                                $(".approve[title='" + kAr[k] + "'][cusuid=" + res[i].cusuid + "]").attr('disabled', 'true');

                            }
                        });
                    }

                    for (let e in data[kAr[k]].extralist) {

                        let tr = "<tr class='tr_item'>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td  style='text-align: center;'>" + e+ "</td>" +
                            "<td  style='text-align: center;'>" + data[kAr[k]].extralist[e].qnty + "</td>" +
                            "<td  style='text-align: center;'>" + String(data[kAr[k]].extralist[e].price) + "</td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "<td></td>" +
                            "</tr>";

                        $(tr).appendTo($('tbody'));
                    }
                }
            });

            $('.tablesorter').tablesorter({
                theme: 'blue',
                headers: {
                    0: { sorter: "checkbox" }
                    //3: { sorter: "select" }
                    // 6: { sorter: "inputs" }
                    // 7: defaults to "shortDate", but set to "weekday-index" ("group-date-weekday") or "time" ("group-date-time")
                },
                widgets: ['group', 'zebra', 'column'],
                usNumberFormat: false,
                sortReset: true,
                sortRestart: true,
                sortInitialOrder: 'desc',
                widthFixed: true,
                widgetOptions: {
                    group_collapsible: true,  // make the group header clickable and collapse the rows below it.
                    group_collapsed: false, // start with all groups collapsed (if true)
                    group_saveGroups: true,  // remember collapsed groups
                    group_saveReset: '.group_reset', // element to clear saved collapsed groups
                    group_count: " ({num})", // if not false, the "{num}" string is replaced with the number of rows in the group

                    // apply the grouping widget only to selected column
                    group_forceColumn: [],   // only the first value is used; set as an array for future expansion
                    group_enforceSort: true, // only apply group_forceColumn when a sort is applied to the table

                    // checkbox parser text used for checked/unchecked values
                    group_checkbox: ['checked', 'unchecked'],

                    // change these default date names based on your language preferences (see Globalize section for details)
                    group_months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                    group_week: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                    group_time: ["AM", "PM"],

                    // use 12 vs 24 hour time
                    group_time24Hour: false,
                    // group header text added for invalid dates
                    group_dateInvalid: 'Invalid Date',
                },
                // this function is used when "group-date" is set to create the date string
                // you can just return date, date.toLocaleString(), date.toLocaleDateString() or d.toLocaleTimeString()
                // reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#Conversion_getter
                group_dateString: function (date) {
                    return date.toLocaleString();
                },

                group_formatter: function (txt, col, table, c, wo, data) {
                    // txt = current text; col = current column
                    // table = current table (DOM); c = table.config; wo = table.config.widgetOptions
                    // data = group data including both group & row data
                    if (col === 7 && txt.indexOf("GMT") > 0) {
                        // remove "GMT-0000 (Xxxx Standard Time)" from the end of the full date
                        // this code is needed if group_dateString returns date.toString(); (not localeString)
                        txt = txt.substring(0, txt.indexOf("GMT"));
                    }
                    // If there are empty cells, name the group "Empty"
                    return txt === "" ? "Empty" : txt;
                }
            });

            $('.order_amnt').text($('.tr_item').length);

            that.orders = res;

        });


        $('#add_item').off();
        $('#add_item').on('click touchstart', that, that.AddOfferItem);

        $('.input').click(function (ev) {
            $(this).focus();
        });

        $("#editor_pane").find('.publish_offer_ctrl').off('click touchstart');
        $("#editor_pane").find('.publish_offer_ctrl').on('click touchstart', this, function (ev) {
            window.parent.user.PublishOffer(ev.data.GetOfferItems(ev.data.lang, true)['remote'], that.date, ev.data, function (obj) {

            });
        });

        $('[data-toggle="popover"]').popover();
    }

    fillPacklist(menu_item, tab,i){
        let that= this;
        let pl = '';
        if (that.offer[tab][i].packlist)
            pl = utils.ReverseObject(that.offer[tab][i].packlist);
        else return;

        $(menu_item).find('.pack_list').empty();
        for (let l in pl) {
            if (!l) {
                delete that.offer[tab][i].packlist[l];
                continue;
            }
            let price = pl[l].price?pl[l].price:pl[l];
            let qnty = pl[l].qnty;
            let rsrv = pl[l].rsrv;
            $(menu_item).find('.pack_container').css('visibility', 'visible');
            $(menu_item).find('.pack_list').append("<a class='dropdown-item' href='#' role='packitem' >" + l + "</a>");
            $(menu_item).find('.item_pack').text(l);
            $(menu_item).find('.item_pack').attr('pack', l);
            $(menu_item).find('.item_pack').on('focusout', that, function (ev) {
                let that = ev.data;
                let pack = $(menu_item).find('.item_pack').attr('pack');
                if ($(this).val() === '') {
                    $(menu_item).find('a:contains(' + pack + ')').remove();
                    let pl = JSON.parse($(menu_item).find('.item_pack').attr('packlist'));
                    delete pl[pack];
                    $(this).attr('packlist', JSON.stringify(pl));
                }
            });

            $(menu_item).find('.item_price').val(price);
            $(menu_item).find('.item_qnty').val(qnty);
        }
    }

    FillProfile(profile){

        // $('input').prop('readonly', true);
        // $('input').attr('placeholder', '');
        if(profile.avatar)
            $('.avatar').attr('src',this.path+'/images/'+profile.avatar);
        else
            $('.avatar').attr('src', 'https://delivery-angels.com/d2d/dist/images/user.png');
        $('input').attr('title', '');
        $('#name').val(profile.name);
        $('#email').val(profile.email);
        $('#mobile').val(profile.mobile);
        $('#address').val(profile.address);
        $('#place').val(profile.place);
        $('#worktime').val(profile.worktime);
        if(profile.type==='deliver') {
            $('#delivery').parent().css('display','block');
            if (profile.delivery)
                $('#delivery').val(profile.delivery);
        }

    }

    InitProfileSupplier(user, settings) {

        // this.profile_sup = new ProfileSupplier(user);
        this.InitComments(user, settings);
        this.InitRating();

        if(window.parent.user.profile.profile.name) {
            $('#map_link').css('display','block');
            $('#map_link').attr('href',"https://nedol.ru/"+window.parent.user.profile.profile.name);

        }
    }

    InitDeliverReview(sup){

        let par = {
            readOnly: (sup.appr && sup.appr.cusuid === window.parent.user.uid) ? false : true,
            profilePictureURL: sup.profile.avatar ? this.path + '/images/' + sup.profile.avatar : 'https:///delivery-angels.com/d2d/dist/images/user.png',
            enableEditing: true,
            enableDeleting: false,
            enableReplying: false
        }
        Object.assign(par,comment_obj.supplier[window.parent.sets.lang]);
        this.InitProfileSupplier({supuid:sup.uid,user:window.parent.user.constructor.name},par);
    }

    InitComments(obj, settings){
        let this_obj = obj;
        $('img.avatar').attr('src', settings.profilePictureURL);
        //settings.profilePictureURL = this.path+'/images/'+this.profile.avatar;

        $('#comments-container').comments(Object.assign(settings,{
            getComments: function(success, error) {
                let par = {
                    proj: "d2d",
                    user: window.parent.user.constructor.name.toLowerCase(),
                    func: 'getcomments',
                    supuid: obj.supuid
                }

                window.parent.network.SendMessage(par, function (data) {
                    var commentsArray = [];
                    if(data.resAr) {
                        for(let i in data.resAr) {
                            let com = JSON.parse(data.resAr[i].data);
                            commentsArray.push(com);
                        }
                    }
                    success(commentsArray);
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
                    supuid: this_obj.supuid,
                    cusuid:window.parent.user.uid,
                    data:data
                }
                window.parent.network.SendMessage(par, function (res) {
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
                    supuid:this_obj.supuid,
                    cusuid:window.parent.user.uid,
                    data:data
                }
                window.parent.network.SendMessage(par, function (res) {
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
        let data_obj = {
            proj: "d2d",
            user:window.parent.user.constructor.name.toLowerCase(),
            func: "getrating",
            psw: window.parent.user.psw,
            supuid: window.parent.user.uid
        }
        window.parent.network.SendMessage(data_obj, function (data) {
            if (data.resAr && data.resAr.rating)
                $('.rating').rating('rate', data.resAr.rating);
        });
    }

    OnClickAddPack(ev) {

        let menu_item = ev.data.mi;
        let that = ev.data.that;

        $('.add_pack').css('visibility', 'hidden');
        let pack = $(menu_item).find('.item_pack').val();
        let price = $(menu_item).find('.item_price').val();
        let qnty = $(menu_item).find('.item_qnty').val()

        let pl = $(menu_item).find('.item_pack').attr('packlist');
        if (pl)
            pl = JSON.parse(pl);
        else
            pl = {};

        let res = $.grep(pl, function (item, i) {
            return (pack && item.pack === pack);
        });
        if (res.length === 0) {
            pl[pack] = {price:price,qnty:qnty};
        }
        $(menu_item).find('.pack_list').empty();
        // $(menu_item).find('.pack_list').append("<li><a role='packitem' style='color: red'>добавить</a></li>");
        for (let i in pl) {
            if (i) {
                $(menu_item).find('.pack_list').append("<a class='dropdown-item' href='#' role='packitem'>" + i + "</a>");
            }
        }

        $(menu_item).find('.item_pack').addClass('dropdown-toggle');
        $(menu_item).find('.item_pack').attr('data-toggle','dropdown');
        $(menu_item).find('.pack_list').addClass('dropdown-menu');
        $(menu_item).find('.caret').css('visibility', 'visible');

        $(menu_item).find('a[role=packitem]').on('click touchstart', {
            that: that,
            mi: $(menu_item)
        }, that.OnClickPack);

        $(menu_item).find('.item_pack').attr('packlist', JSON.stringify(pl));
        $(menu_item).find('.item_pack').val(pack);
        $(menu_item).find('.item_price').val(price);
        $(menu_item).find('.item_qnty').val(qnty);

        $(menu_item).find('.item_pack').dropdown("toggle");

    }

    OnClickPack(ev){
        let menu_item = ev.data.mi;
        let that = ev.data.that;

        let pl = JSON.parse($(menu_item).find('.item_pack').attr('packlist'));
        let price = pl[$(ev.target).text()].price;
        let qnty = pl[$(ev.target).text()].qnty;
        $(menu_item).find('.item_pack').val($(ev.target).text());
        $(menu_item).find('.item_pack').attr('pack',$(ev.target).text());
        $(menu_item).find('.item_price').val(price);
        $(menu_item).find('.item_qnty').val(qnty);

    }

    AddOfferItem(ev) {

        let that = ev.data;

        // if($('.menu_item').length>=parseInt($('#items_limit').val())) {
        //    return true;
        // }

        let tab = $('.cat_div.active').find('.category').attr('id');

        if (!tab)
            return;

        ev.preventDefault(); // avoid to execute the actual submit of the form.
        ev.stopPropagation();

        var pos = $('.menu_item[id^="'+tab+'"]').length;
        let tmplt;
        if (pos < 1){
            tmplt = $('#menu_item_tmplt').clone();
        }else{
            tmplt = $($('.menu_item[id^="'+tab+'"]')[pos-1]).clone();
        }

        let menu_item = tmplt;//$('#menu_item_tmplt').clone();
        $(menu_item).attr('id', tab+'_'+ pos);
        $(menu_item).attr('class', 'menu_item');
        $(menu_item).css('display', 'block');

        $(menu_item).find('.item_title').text('');
        $(menu_item).find('.carousel-img').remove();

        $(menu_item).find('.extra_ctrl').attr('data-target','#extra_'+ tab + '_' + pos);

        $(menu_item).find('.pack_container').replaceWith($(tmplt).find('.pack_container')[0]);
        $(menu_item).find('.price_div').replaceWith($(tmplt).find('.price_div')[0]);

        $(menu_item).find('.publish:checkbox').attr('id', 'item_cb_' + pos);
        $(menu_item).find('.publish:checkbox').attr('pos', pos);
        $(menu_item).find('.publish:checkbox').attr('tab', tab);
        $('.btn').css('visibility', 'visible');

        $(menu_item).find('.content_text').attr('contenteditable', 'true');
        // $(menu_item).find('.item_title').attr('contenteditable', 'true');
        $(menu_item).find('.item_price').attr('contenteditable', 'true');

        //$(menu_item).find('.item_title').text($('#item_title').text());
        let hash = md5(new Date().getTime());
        //window.dict.dict[hash] = {};
        //$(menu_item).find('.item_title').attr('data-translate',hash);

        $(menu_item).find('.item_title').attr('data-target','#content_' +tab.replace('#','') + pos);

        function focusOut(ev) {
            let res =$.grep($(".item_title"), function (n, i) {
                return (n.value && n.value === ev.target.value)
            });
            if(res.length>1) {
                $(ev.currentTarget).off('focusout');
                alert({ru:"Названия продуктов не должны повторяться",en:"Name of product should be unique"}[window.parent.sets.lang]);
                $(this).select();
                setTimeout(function () {
                    $(ev.currentTarget).on('focusout',focusOut);
                },200);
            }
        }
        $(menu_item).find('.item_title').on('focusout', focusOut);

        hash = md5(new Date().getTime()+1);
        //window.dict.dict[hash] = {};
        $(menu_item).find('.content_text').attr('data-translate', hash);
        $(menu_item).find('.img-fluid').attr('id','img_'+tab.replace('#','')+'_'+pos);

        $(menu_item).find('.put_image').css('display', 'block');

        that.mi_id = menu_item.attr('id');

        $(menu_item).find('input:file').on('change',menu_item, that.onLoadImage);

        if($(".category[id=\""+tab+"\"]",window.parent.document).attr('extra')==='true'){
            $(menu_item).find("[data-target='.extras']").css('display','block');
            $(menu_item).find('.extras').attr('id','extra_'+ tab + '_' + pos);
            $(menu_item).find("[data-target='.extras']").attr('data-target','#extra_'+ tab + '_' + pos);
        }

        $(menu_item).find('.fa-image').on('click touchstart', menu_item, function (ev) {
            let menu_item = $(ev.data);
            let vis = $(menu_item).find('.img-fluid').css('visibility');

            ev.target = $(menu_item).find('.img-fluid')[0];
            ev.mi = menu_item.attr('id');
            that.OnClickImport(ev);
        });

        $(menu_item).find('.item_price').on('focusout',{that:that, mi:$(menu_item)}, function (ev) {
            $(menu_item).find('.add_pack').css('visibility', 'hidden');
            that.OnClickAddPack(ev);
        });

        $(menu_item).find('.add_content').on('click touchstart',function () {
            $(this).closest('.menu_item').find('.item_content').slideDown("slow");
            let vis = $(this).closest('.menu_item').find('.content_text').css('visibility');
            if (vis === 'visible'){
                vis = 'hidden';
            }else{
                vis='visible';
            }
            $(this).closest('.menu_item').find('.content_text').css('visibility',vis);
            $(this).closest('.menu_item').find('.content_text').focus();
        });


        $(menu_item).find('.item_pack').on('focusout', that, function (ev) {
            let that = ev.data;
            let pack = $(menu_item).find('.item_pack').attr('pack');
            if ($(this).val() === '') {
                $(menu_item).find('a:contains(' + pack + ')').remove();
                let pl = JSON.parse($(menu_item).find('.item_pack').attr('packlist'));
                delete pl[pack];
                $(this).attr('packlist', JSON.stringify(pl));
            }
        });


        $(menu_item).find('.brand_img').attr('id', 'brand_' + tab + '_' + $('.brand_img').length);
        $(menu_item).find('.brand').on('click', menu_item, function (ev) {
            let menu_item = $(this).closest('.menu_item');
            //let vis = $(menu_item).find('.img-fluid').css('visibility');
            ev.target = $(menu_item).find('.brand_img')[0];
            ev.mi = $(menu_item).attr('id');
            that.OnClickImport(ev);
        });

        $(menu_item).find('.brand').on('dragend', function () {
            $(this).remove();
        });

        $(menu_item).find('.cert_container').attr('id', 'gallery_' + tab.replace('#','') + '_' + pos);

        $(menu_item).find('.add_pack').attr('id', 'pack_' + tab.replace('#','') );
        $(menu_item).find('.add_pack').on('click touchstart', {mi:$(menu_item),that:that},that.OnClickAddPack);

        if(pos>1) {
            $(menu_item).find('.pack_container').replaceWith( $('div#' + tab + '_' + String(pos - 1)).find('.pack_container').clone());
            $(menu_item).find('.price_div').replaceWith( $('div#' + tab + '_' + String(pos - 1)).find('.price_div').clone());
            $(menu_item).find('a[role=packitem]').on('click touchstart', {
                that: that,
                mi: $(menu_item)
            }, that.OnClickPack);
        }
        $(menu_item).find('.add_prop').on('click', that.onAddProp);

        $(menu_item).find('.add_extra').on('click', that.onAddExtra);

        $('#tab_'+tab).append(menu_item[0]);

        $(menu_item).find('.item_title').focus();
        $(menu_item).find('.item_title')[0].scrollIntoView();

        $(menu_item).find('.toolbar').css('display', 'block');

        if ($(menu_item).find('.item_content').css('display') == 'block')
            $(menu_item).find('.item_content').slideToggle("fast");

        //$(tmplt).insertAfter('#editor_pane');

        //window.parent.dict.set_lang(window.parent.sets.lang, $(menu_item));

    }

    onAddProp(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        let row = $(ev.target).closest('.row.prop').clone();
        row.find('.input').prop("contenteditable", true);
        row.find('.input').text('');
        row.find('.add_prop_div').remove();
        $(ev.target).closest('.prop.container').append(row);
        setTimeout(function(){
            row.find('.prop_key[contenteditable=true]').focus();
        },100);

        return row;
    };

    onAddExtra(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        let row = $(ev.target).closest('.row').clone();
        row.find('.add_extra_div').remove();
        row.addClass('extra');
        row.find('.input').prop("contenteditable", true);
        row.find('.input').text('');
        $(ev.target).closest('.row').parent().append(row);
        setTimeout(function () {
            $(row).find('.extra_title').focus();
        },100);
    };

    OnClickImport(ev){
        let menu_item = $('#'+ev.mi);
        $(menu_item).find('input:file').attr('menu_item', JSON.stringify({id:ev.mi,target:$(ev.target).attr("class").split(/\s+/)}));
        $(menu_item).find('input:file').focus();
        $(menu_item).find('input:file').trigger(ev);
        //$(menu_item).find('.fa-image').css('visibility', 'hidden');
    }



    onLoadImage (ev) {
        let menu_item = $(ev.data);
        let el = JSON.parse($(menu_item).find('input:file').attr('menu_item'));
        try {
            loadImage(
                ev.target.files[0],
                function (img, data) {
                    if (img.type === "error") {
                        console.error("Error loading image ");
                    } else {

                        if (el.target[0] === "brand_img") {
                            $("#" + el.id).find('.brand_img').attr('src', img.toDataURL());

                            $("#" + el.id).css('visibility', 'visible');
                            return;
                        }
                        let tab = $('.div_tab_inserted.active').attr('id');

                        $(img).addClass("carousel-img img-fluid mx-auto d-block");


                        let i = menu_item.find('.carousel-img').length;

                        menu_item.find('.carousel-inner').find('.carousel-item').removeClass('active');
                        let carousel_item = $('<div class="carousel-item active"></div>');
                        $(carousel_item).append(img);
                        menu_item.find('.carousel-inner').append(carousel_item);

                        //$(menu_item).find('.cert_container').find('img').draggable('destroy');

                        $(img).longTap(function () {
                            let active = $(menu_item).find('.cert_container').find('.active');
                            active.removeClass('carousel-item');
                            $(img).draggable(
                                {delay: 0},
                                {cursor: "crosshair"},
                                {
                                    start: function (ev) {
                                    },
                                    drag: function (ev) {
                                        //$(el).attr('drag', true);
                                    },
                                    stop: function (ev) {
                                        $(img).draggable('destroy');
                                        $(menu_item).find('.active').addClass('carousel-item');
                                        $(menu_item).find('.active').attr('drag_left', $(ev.target).css('left'));
                                        $(menu_item).find('.active').attr('drag_top', $(ev.target).css('top'));
                                    }
                                });
                        });

                        //$(menu_item).find('.carousel').carousel({interval: 3000});
                        menu_item.find('.carousel').attr('id', 'carousel_' + menu_item.attr('id'));
                        if (menu_item.find('.carousel-control-prev').length === 0) {
                            menu_item.find('.carousel').append(
                                '<a class="carousel-control-prev" href="#carousel_' + tab + '_' + i + '">' +
                                '<span class="carousel-control-prev-icon"></span>' +
                                '</a>' +
                                '<a class="carousel-control-next" href="#carousel_' + tab + '_' + i + '">' +
                                '<span class="carousel-control-next-icon"></span>' +
                                '</a>');
                        }

                        // Enable Carousel Controls
                        menu_item.find(".carousel-control-prev").click(function (ev) {
                            ev.preventDefault();
                            ev.stopPropagation();
                            $('#carousel_' + menu_item.attr('id')).carousel("prev");
                            menu_item.find('.carousel').carousel('pause');
                        });

                        menu_item.find(".carousel-control-next").click(function (ev) {
                            ev.preventDefault();
                            ev.stopPropagation();
                            $('#carousel_' + menu_item.attr('id')).carousel("next");
                            menu_item.find('.carousel').carousel('pause');
                        });

                        $(img).doubleTap(function (ev) {
                            if (confirm({
                                    'ru': 'Удалить изображение?',
                                    'en': 'Remove image?',
                                    'fr': 'Supprimer l\'image ?'
                                }[window.parent.sets.lang])) {
                                $(this).closest('.carousel-item').remove();
                                menu_item.find('.carousel').carousel("next");
                                $($(menu_item).find('.carousel-inner').find('.carousel-item')[0]).addClass('active');
                                menu_item.find('.carousel').carousel('pause');
                            }
                        });

                        $(img).on('dblclick', function (ev) {
                            ev.preventDefault();
                            ev.stopPropagation();
                            if (confirm({
                                    'ru': 'Удалить изображение?',
                                    'en': 'Remove image?',
                                    'fr': 'Supprimer l\'image ?'
                                }[window.parent.sets.lang])) {
                                $(this).closest('.carousel-item').remove();
                                menu_item.find('.carousel').carousel("next");
                                $($(menu_item).find('.carousel-inner').find('.carousel-item')[0]).addClass('active');
                                menu_item.find('.carousel').carousel('pause');
                            }
                        });

                        //$(menu_item.find('.carousel-inner').find('.carousel-item')[0]).addClass('active');
                        menu_item.find('.carousel').carousel('pause');

                        console.log("Original image width: ", data.originalWidth);
                        console.log("Original image height: ", data.originalHeight);

                    }
                },
                {
                    orientation: true,
                    maxWidth: 500,
                    maxHeight: 300,
                    minWidth: 100,
                    minHeight: 300,
                    canvas: true
                }
            )
        } catch (ex) {

        }
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
                                $('.card-title a[data-translate=' + keys[k] + ']').closest('.menu_item').find('.ordperiod').text(appr.period );
                                $('.card-title a[data-translate=' + keys[k] + ']').closest('.menu_item').find('.approved').attr('approved', that.date);
                                $('.card-title a[data-translate=' + keys[k] + ']').closest('.menu_item').find('.period_div').css('visibility', 'visible');

                                //$('.address').attr('disabled','true');
                                // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.increase').css('visibility','hidden');
                                // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.reduce').css('visibility','hidden');
                                // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.item_pack').attr('data-toggle','');
                            }
                        });

                        if(res.data[keys[k]].qnty>0) {
                            $('.card-title a[data-translate=' + keys[k] + ']').closest('.menu_item').find('.amount').val(res.data[keys[k]].qnty);
                            $('.card-title a[data-translate=' + keys[k] + ']').closest('.menu_item').find('.amount').text(res.data[keys[k]].qnty);

                            let price = res.data[keys[k]].price;
                            $('.card-title a[data-translate=' + keys[k] + ']').closest('.menu_item').find('.item_price').val(price);
                            let pack = res.data[keys[k]].pack;
                            $('.card-title a[data-translate=' + keys[k] + ']').closest('.menu_item').find('.item_pack').text(pack);
                            $('.card-title a[data-translate=' + keys[k] + ']').closest('.menu_item').attr('ordered', '');
                        }
                    }
                }
            }
        });
    }

    GetOfferItems(lang){
        let that = this;
        let offerObj = {remote:{}};
        that.arCat = [];

        $('.item_title').click();

        $('#editor_pane').find('.div_tab_inserted').each((index, val)=> {

            let tab = $(val).attr('id').split('_')[1];
            let title = $('span#'+tab).siblings('.title').text();
            let value = tab;//
            if(!$('.category#'+value,$(window.parent.document).contents())[0])
                value = title;
            if($('.nav-link[href="#tab_'+tab+'"]').is('div')){
                value = $('.nav-link[href="#tab_'+tab+'"]').text();
            }

            if (value) {
                if (!window.parent.dict.dict[md5(value)]) {
                    window.parent.dict.dict[md5(value)] = {};
                }
                window.parent.dict.dict[md5(value)][lang] = value;
            } else {
                $(val).empty();
                return true;
            }

            let checked = $(val).find('.menu_item').find('.publish:checkbox').prop('checked');

            let miAr = $(val).find('.menu_item');
            // offerObj['local'][value] = [];
            offerObj['remote'][value] = [];

            for (let i = 0; i < miAr.length; i++) {

                let item = {};
                item.checked = JSON.stringify($(miAr[i]).find('.publish:checkbox').prop('checked'));

                let title = $(miAr[i]).find('.item_title');
                let key = $(title).attr('data-translate');
                let text = $(miAr[i]).find('.item_title').text();

                if (text.length === 0 || !text.trim()) {
                    continue;
                }
                if(!window.parent.dict.dict[key]) {
                    window.parent.dict.dict[key] = {};
                }

                if (text !== window.parent.dict.dict[key][lang]) {
                    let obj = Object.assign({},window.parent.dict.dict[key]);
                    delete window.parent.dict.dict[key];
                    key = md5('title_'+miAr[i].id);
                    window.parent.dict.dict[key] = obj;
                    window.parent.dict.dict[key][lang] = text;
                    $(title).attr('data-translate',key);
                }
                item.title = key;

                if($(miAr[i]).find('.content_text').css('visibility')==='visible') {
                    let cont_text = $(miAr[i]).find('.content_text');
                    key = $(cont_text).attr('data-translate');
                    text = $(cont_text).val();//.replace(/'/g,'%27').replace(/\n/g,'%0D').replace(/"/g,'%22');
                    if(!window.parent.dict.dict[key]) {
                        window.parent.dict.dict[key] = {};
                    }
                    if (text !== window.parent.dict.dict[key][lang]) {
                        let obj = Object.assign({},window.parent.dict.dict[key]);
                        delete window.parent.dict.dict[key];
                        key = md5('content_text_'+miAr[i].id);
                        window.parent.dict.dict[key] = obj;
                        window.parent.dict.dict[key][lang] = text;
                        $(cont_text).attr('data-translate',key);
                    }
                    item.content_text = {value:key};

                }else{
                    if(item.content)
                        delete item.content;
                }

                if($(miAr[i]).find('.brand_img').attr('src')){
                    if($(miAr[i]).find('.brand_img').attr('src').includes('http')) {
                        item.brand = {logo: $(miAr[i]).find('.brand_img').attr('src').split('/').pop()};
                    }else {
                        item.brand = {logo: $(miAr[i]).find('.brand_img').attr('src')};
                    }

                }else {
                    delete item.brand;
                }


                $.each($(miAr[i]).find('.prop.row'), function (i,el) {
                    if($(el).find('.prop_key').val() && $(el).find('.prop_val').val()) {
                        if(!item.prop) {
                            item.prop = {};
                        }
                        if(!item.prop[$(el).find('.prop_key').val()])
                            item.prop[$(el).find('.prop_key').val()] = [];
                        item.prop[$(el).find('.prop_key').val()].push($(el).find('.prop_val').val());
                    }
                });

                item.packlist = $(miAr[i]).find('.item_pack').attr('packlist');
                if(item.packlist) {
                    item.packlist = JSON.parse(item.packlist);
                }

                item.bargain = JSON.stringify($(miAr[i]).find('.bargain:checkbox').prop('checked'));

                item.cert = [];
                $.each($(miAr[i]).find('.carousel-inner').find('.img-fluid'), function (i, el){
                    let src = el.src?el.src:el.toDataURL();
                    if(src.includes('empty.png'))
                        return;

                    if(src.includes("http://") || src.includes("https://")) {
                        item.cert.push ({src: src.split('/').pop()});
                    }else {
                        item.cert.push({src: src});
                    }
                });
                item.extra = [];
                $.each($(miAr[i]).find('.row.extra'), function (i, el){
                    if(!$(el).find('.extra_title').text())
                        return;
                    item.extra[i] = {};
                    item.extra[i].title = $(el).find('.extra_title').text();
                    item.extra[i].price = $(el).find('.extra_price').text();
                });

                if(!_.includes(that.arCat,value))
                    that.arCat.push(value);

                //offerObj['local'][value].push(item);


                offerObj['remote'][value].push(item);

            }
            if(offerObj['remote'][value].length==0)
                delete offerObj['remote'][value];
            // if(offerObj['local'][value].length==0)
            //     delete offerObj['local'][value];
        });

        return offerObj;
    }

    SaveOffer(items) {

        let ind = $("li.tab_inserted.active").val();
        let active = $($("li.active").find('img')[ind]).text();

        // if(active) {
        //     items = this.getTabItems(active, lang);
        // }
        if(items['local'])
            window.parent.user.UpdateOfferLocal(this.offer,items['local'], window.parent.user.offer.stobj.location , window.parent.dict.dict);
    }

    SaveProfile(cb){

        let that = this;

        if($('.avatar')[0].src.includes('base64')){

            let k = 200/  $('.avatar').height();
            utils.createThumb_1($('.avatar')[0],$('.avatar').width()*k, $('.avatar').height()*k, function (avatar) {
                uploadProfile(avatar.src,cb);

            });
        }else{
            uploadProfile(window.parent.user.profile.profile.avatar,cb);
        }


        function uploadProfile(avatar,cb) {

            let data_post = {
                proj: 'd2d',
                user: window.parent.user.constructor.name,
                func: 'updprofile',
                uid: window.parent.user.uid,
                psw: window.parent.user.psw,
                profile: {
                    type: window.parent.user.profile.profile.type,
                    email: $('#email').val().toLowerCase(),
                    avatar: avatar,
                    lang: window.parent.user.profile.profile.lang,
                    name: $('#name').val(),
                    worktime: $('#worktime').val(),
                    mobile: $('#mobile').val(),
                    place: $('#place').val(),
                    delivery: $('#delivery').val()
                },
                promo: $('#promo').val(),
                prolong: $('#prolong  option:selected').val()
            }

            window.parent.network.SendMessage(data_post, function (res) {

                let res_ = res.profile;

                window.parent.db.GetSettings(function (obj) {

                    let set = _.find(obj, {uid: window.parent.user.uid});
                    if(set.settings)
                        delete set.settings;
                    set.profile = data_post.profile;
                    set.promo = data_post.promo;
                    set.prolong = data_post.prolong;

                    if(res_ ) {
                        if (res_) {
                            set.profile.avatar = res_.avatar;
                        }
                        window.parent.db.SetObject('setStore', set, function (res) {
                            $('#user', window.parent.document).attr('src', that.path + '/images/' + res_.avatar);
                            $('#user',$('#fd_frame_tmplt', window.parent.document).contents()).attr('src', that.path + '/images/' + res_.avatar);
                            that.profile = set.profile;
                            window.parent.user.profile.profile = set.profile;
                            window.parent.user.promo = data_post.promo;
                            window.parent.user.prolong = data_post.prolong;
                            cb(true);
                        });
                    }else{
                        cb(false);
                    }
                });
            });
        }
    }

    SaveSettings(){

        let settings = {};
        $('#settings').find('select').each(function (i,item) {
            settings[$(item).attr('id')] = $(item).closest('div').find('.sel_prolong').val();
        });

        window.parent.db.GetSettings(function (obj) {
            let _ = require('lodash');
            let set = _.find(obj, {uid:window.parent.user.uid});
            set.settings = settings;

            window.parent.db.SetObject('setStore',set,function (res) {
                window.parent.user.profile.profile =  set.profile;
                window.parent.user.settings = settings;
            });
            let data_obj ={
                proj:"d2d",
                user: window.parent.user.constructor.name.toLowerCase(),
                func:"setsup",
                psw: window.parent.user.psw,
                uid: window.parent.user.uid
                //profile:set.profile
            }
            data_obj['settings'] = settings;
            //data_obj['profile'] = set.profile;
            window.parent.network.SendMessage(data_obj, function (data) {

            });
        });

    }

}



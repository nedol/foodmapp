'use strict'
require('webpack-jquery-ui');
require('webpack-jquery-ui/css');

require('jquery-ui-touch-punch');
require('bootstrap');
require('bootstrap-select');

require("../../lib/jquery-comments-master/js/jquery-comments.js")
require("../../lib/bootstrap-rating/bootstrap-rating.min.js")

require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');
import {Dict} from '../dict/dict.js';
import {ProfileSupplier} from "../profile/profile.supplier";
import 'tablesorter/dist/css/theme.default.min.css';

import {Utils} from "../utils/utils";
let utils = new Utils();

let _ = require('lodash')

let md5 = require('md5');


$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        window.parent.alert('В этом браузере нет поддержки EventSource.');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }
    window.InitSupplierOffer = function (data) {
        if(!window.sup_off )
            window.sup_off = new SupplierOffer();
        window.sup_off.OpenOffer(data);
    };



    $('img.avatar').after("<h6>Загрузить мою фотографию...</h6>");
    $('img.avatar').on('click',function (ev) {
        $(this).siblings('.file-upload').trigger('click');
    });


    $(".file-upload").on('change', function(e){
        loadImage(
            e.target.files[0],
            function (img, data) {
                if(img.type === "error") {
                    console.error("Error loading image ");
                } else {
                    $('.avatar').attr('src', img.toDataURL());

                    $('.avatar').siblings('input:file').attr('changed',true);
                    console.log("Original image width: ", data.originalWidth);
                    console.log("Original image height: ", data.originalHeight);
                }
            },
            {
                orientation:true,
                maxWidth: 600,
                maxHeight: 300,
                minWidth: 100,
                minHeight: 50,
                canvas: true
            }
        );

    });

});

class SupplierOffer{
    constructor(){

        this.ovc = $('body');
        this.ovc.find('.close').off();
        this.ovc.find('.close').on('click', this, function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            let that = ev.data;
            function closeWindow() {
                $('.menu_item').remove();
                $('.tab_inserted').remove();
                $(frameElement).parent().css('display', 'none');
            };

            let confirm = window.confirm("Сохранить и опубликовать?");
            if(confirm) {
                if ($(window.parent.document).find(".category[state='1']").length > 0) {

                    let items = that.SaveOffer(window.parent.sets.lang);
                    if (!items)
                        return false;

                    if (that.changed) {

                        //if ($('.menu_item').find('input:checked[tab]').length > 0) {

                            window.parent.user.PublishOffer(items['remote'], window.parent.user.date, ev.data, function (obj) {
                                window.parent.user.offer.stobj = obj;
                            });
                        //}
                    }
                }

                if (that.profile_tab_changed) {
                    that.SaveProfile(function () {
                        that.SaveSettings();
                    });
                }

                setTimeout(function () {
                    closeWindow();
                }, 300);
            }else{
                closeWindow();
            }

            this.profile_tab_changed = false;
        });

        $('.nav-tabs a').on('shown.bs.tab', (event)=>{
            var x = $(event.target).text();         // active tab
            this.profile_tab_changed =true;
            var y = $(event.relatedTarget).text();  // previous tab
        });

    }

    OpenOffer(obj) {
        $('.menu_item').off();
        $('.menu_item').remove();
        $('.tab_inserted').remove();
        $('.div_tab_inserted').remove();

        this.path  ="http://localhost:63342/d2d/server";
        if(host_port.includes('nedol.ru'))
            this.path = host_port;

        let that = this;
        this.uid = obj.uid;
        this.profile = obj.profile;
        this.offer = obj.data;
        obj.supuid = obj.uid;
        this.rating = obj.rating;
        let latlon = [obj.latitude,obj.longitude];

        let date = window.parent.user.date;


        $('.name').css('display','block').text(obj.profile.name?obj.profile.name:obj.profile.email.split('@')[0]);
        window.parent.db.GetSupApproved(obj.uid, function (res) {
            that.appr = res;
        });

        window.parent.dict.set_lang(window.parent.sets.lang,this.ovc[0]);

        this.dict = new Dict(obj.dict);

        this.FillProfile(this.profile);

        this.InitSupplierReview(this);

        if(obj.profile.type==='marketer')
            this.ovc.find('.address').css('display','block');
        else
            this.ovc.find('.address').css('display','block');

        window.parent.db.GetSettings(function (obj) {
            if(obj[0].profile && obj[0].profile.address)
                that.ovc.find('.address').val(obj[0].profile.address);
        });

        function initOrder() {

            $(window.parent.document).find(".category[state='1']").each(function (i, cat) {
            let cat_tab = $(cat).text();
            if ($('[href="#' + cat_tab + '"]').length === 0) {
                $('<li class="tab_inserted nav-item"><a class="nav-link" data-toggle="tab"  contenteditable="false" data-translate="' + md5(cat_tab) + '"  href="#' + cat_tab + '">' + cat_tab + '</a>' +
                    '</li>').insertBefore(that.ovc.find('#add_tab_li'));
                $('<div id="' + cat_tab + '" class="div_tab_inserted tab-pane" style="border: none">' +
                    '</div>').insertBefore($('#add_tab_div'));
            }

            $('.dropdown').css('visibility', 'visible');
            $('#order_menu_button').css('visibility', 'visible');

            $('#add_tab_li').css('visibility', 'visible');

            let isEditable = true;

            //$("#offer_pane").resizable();

            function selectText(el) {
                $(el).focus();
                document.execCommand('selectAll', false, null);
            }

            this.lang = window.parent.sets.lang;
            window.parent.sysdict.set_lang(window.parent.sets.lang, $("#menu_item_tmplt"));
            window.parent.sysdict.set_lang(window.parent.sets.lang, $("#editor"));

            $('#add_tab_li').css('display', 'block');


            for (let tab in that.offer) {
                if (cat_tab !== tab) continue;
                let last = 0;
                for (let i in that.offer[tab]) {
                    last = i;
                    let menu_item = $('#menu_item_tmplt').clone();
                    $(menu_item).attr('id', tab + '_' + i);
                    $(menu_item).attr("class", 'menu_item');
                    $(menu_item).css('display', 'block');

                    $(menu_item).find(':checkbox').attr('id', 'item_cb_' + i);
                    $(menu_item).find(':checkbox').attr('pos', i);
                    $(menu_item).find(':checkbox').attr('tab', tab);

                    $(menu_item).find('.item_cb').css('visibility', 'visible');

                    if (that.offer[tab][i].checked == 'true') {
                        $(menu_item).find(':checkbox').prop('checked', true);
                        if (that.published)
                            isEditable = false;
                    } else {
                        isEditable = true;
                    }

                    $(menu_item).find(':checkbox').on('change', that, function (ev) {
                        ev.data.changed = true;
                    });

                    $(menu_item).find('.item_title').attr('contenteditable', isEditable);

                    if (that.offer[tab][i].title) {
                        $(menu_item).find('.item_title').attr('data-translate', that.offer[tab][i].title);
                    }

                    $(menu_item).find('.item_price').attr('contenteditable', isEditable);
                    $(menu_item).find('.item_price').val(that.offer[tab][i].price);

                    $(menu_item).find('.item_content').attr('id', 'content_' + tab + '_' + i);
                    $(menu_item).find('.item_title').attr('data-target', '#content_' + tab + '_' + i);
                    $(menu_item).find('.item_title').attr('contenteditable', 'true');

                    $(menu_item).find('.item_title').on('dblclick', function () {
                        $(menu_item).find('.item_content').collapse('show');
                    })

                    $(menu_item).find('.item_title').on('focus', function () {
                        $(menu_item).find('.item_content').collapse('hide');
                    });

                    $(menu_item).find('.content_text').attr('contenteditable', 'true');
                    if (that.offer[tab][i].content_text)
                        $(menu_item).find('.content_text').attr('data-translate', that.offer[tab][i].content_text.value);

                    if (that.offer[tab][i].img) {
                        $(menu_item).find('.img-fluid').css('visibility', 'visible');
                        let src = that.offer[tab][i].img.src.replace('https://nedol.ru', '..');
                        src = src.replace('http://localhost:63342', '..');
                        $(menu_item).find('.img-fluid').attr('src', src);
                        //$(menu_item).find('.img-fluid').draggable({ containment: '#content_' + tab + '_' + i, scroll: false });
                    }

                    $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);

                    let pl = that.offer[tab][i].packlist;
                    $(menu_item).find('.pack_list').empty();
                    for (let i in pl) {
                        if (!i)
                            continue;
                        let data = pl[i];
                        $(menu_item).find('.pack_container').css('visibility', 'visible');
                        $(menu_item).find('.pack_list').append("<a class='dropdown-item' href='#' role='packitem' >" + i + "</a>");
                        $(menu_item).find('.item_pack').text(i);
                        $(menu_item).find('.item_pack').attr('pack', i);
                        $(menu_item).find('.item_pack').on('focusout', that, function (ev) {
                            let that = ev.data;
                            let pack = $(menu_item).find('.item_pack').attr('pack');
                            if ($(that).val() === '') {
                                $(menu_item).find('a:contains(' + pack + ')').remove();
                                let pl = JSON.parse($(menu_item).find('.item_pack').attr('packlist'));
                                delete pl[pack];
                                $(that).attr('packlist', JSON.stringify(pl));
                            }
                        });

                        $(menu_item).find('.item_price').val(data);

                    }
                    $(menu_item).find('.item_pack').attr('packlist', JSON.stringify(that.offer[tab][i].packlist));
                    $(menu_item).find('.item_price').on('focusout', {that: that, mi: $(menu_item)}, function (ev) {
                        $(menu_item).find('.add_pack').css('visibility', 'hidden');
                        that.OnClickAddPack(ev);
                    });

                    $(menu_item).find('.item_price').on('click touchstart', that, function (ev) {
                        //$(menu_item).find('.add_pack').css('visibility', 'visible');
                        //$(this).focus();
                    });

                    $.each(that.offer[tab][i].cert, function (i, data) {
                        let img = new Image();
                        img.src = data.src;
                        img.class = 'image';
                        //$(img).offset(data.pos);TODO:
                        img.width = '90';
                        img.style = 'padding:1px';

                        $(menu_item).find('.cert_container').append(img);
                        $(img).on('click', {id: $(menu_item).attr('id')}, that.onClickImage);
                        $(img).on('dblclick', function () {
                            $(img).remove();
                        })
                        // let img_top = $(img).offset().top;
                        // $(img).draggable({ axis: "y"} ,{
                        //     start: function (ev) {
                        //         img_top = $(img).offset().top;
                        //     },
                        //     drag: function (ev) {
                        //         //$(el).attr('drag', true);
                        //     },
                        //     stop: function (ev) {
                        //         console.log("drag stop");
                        //         if($(img).offset().top-img_top >$(img).height()/2)
                        //             $(img).remove();
                        //         else{
                        //             $(img).offset().top = img_top;
                        //         }
                        //     }
                        // });
                    });

                    $('#' + tab).append(menu_item);//добавить продукт в закладку

                    $(menu_item).find('input:file').on('change', this, that.OnImportImage);

                    $(menu_item).find('.img-fluid').attr('id', 'ap_' + tab + '_' + i);
                    $(menu_item).find('.img-fluid').on('click', menu_item, function (ev) {
                        let menu_item = $(this).closest('.menu_item');
                        //let vis = $(menu_item).find('.img-fluid').css('visibility');
                        ev.target = $(menu_item).find('.img-fluid')[0];
                        ev.mi = $(menu_item).attr('id');
                        that.OnClickImport(ev);
                        $(menu_item).find('.toolbar').insertAfter($(menu_item).find('.item_content'));

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

                    $(menu_item).find('a[role=packitem]').on('click', {
                        that: that,
                        mi: $(menu_item)
                    }, that.OnClickPack);

                    $('a[href="#' + tab + '"]').css('color', 'blue');

                    $(menu_item).find('.item_title').collapse('hide');

                    // $(menu_item).find('.cert_container').sortable({
                    //     connectWith: "div",
                    //     placeholder: "ui-state-highlight"
                    // });

                    // $(menu_item).find('.cert_container').find('img').draggable({
                    //
                    // });
                }

                $('#' + tab).disableSelection();

                $('[href="#' + tab + '"]').on('show.bs.tab', function (ev) {
                    if (ev.relatedTarget) {
                        //let items = that.getTabItems($(ev.relatedTarget).text(), window.sets.lang);
                        //window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, 'published');
                    }
                });

                $('[href="#' + tab + '"]').on('hide.bs.tab', function (ev) {
                    if (event.target) {
                        //let items = that.getTabItems($(ev.target).text(), window.sets.lang);
                        //window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, this.status);
                    }
                });
            }
        });

            $($('.tab_inserted a')[0]).tab('show');
            $($('.tab_inserted')[0]).addClass('active');

            $('.tab_inserted').on('click', function (ev) {
                $('.tab_inserted').removeClass('active');
                $(this).addClass('active');
            });

            if (window.parent.user.date.getDate() === new Date().getDate()) {
                $('.notoday').removeClass('notoday');
            }

            window.parent.db.GetSupOrders(new Date(date), window.parent.user.uid, function (res) {

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

                for (let k in kAr) {

                    $('.item_title[data-translate=' + kAr[k] + ']').closest('.menu_item').find('.order_ctrl').css('visibility', 'visible');
                    $('.item_title[data-translate=' + kAr[k] + ']').closest('.menu_item').find('.order_amnt').css('visibility', 'visible');
                    $('.item_title[data-translate=' + kAr[k] + ']').closest('.menu_item').find('.order_amnt').text(data[kAr[k]].qnty);
                    if (data[kAr[k]].status === 'deleted') {//deleted
                        inv_qnty = "title='deleted' style='color:red'";
                        tr_style = "color:red";
                        tr_disabled = "disabled";
                    }

                    let price = $('.item_title[data-translate=' + kAr[k] + ']').closest('.menu_item').find('.item_price').val();
                    if (data[kAr[k]].price !== price) {
                        tr_class += " inv_price";
                    }

                    //if published:
                    // $('.item_title[data-translate=' + kAr[k] + ']').attr('contenteditable','false');
                    // $('.item_title[data-translate=' + kAr[k] + ']').closest('.menu_item').find('.input').attr('contenteditable','false');
                    // $('.item_title[data-translate=' + kAr[k] + ']').closest('.row').find(':checkbox').attr('disabled','');
                    $("<tr style='text-align: center;" + tr_style + "' " + tr_disabled + ">" +
                        "<td class='tablesorter-no-sort'>" +
                        "<label  class='btn'>" +
                        "<input type='checkbox' class='checkbox-inline approve' title='" + kAr[k] + "' orderdate='" + res[i].date + "' cusuid=" + res[i].cusuid + " style='display: none'>" +
                        "<i class='fa fa-square-o fa-2x' style='position:relative; color: #7ff0ff; top:-10px;'></i>" +
                        "<i class='fa fa-check-square-o fa-2x' style='position:relative; color: #7ff0ff; top:-10px;'></i>" +
                        "</label>" +
                        "</td>" +

                        "<td " + inv_qnty + ">" + data[kAr[k]].qnty + "</td>" +
                        "<td>" + data[kAr[k]].pack + "</td>" +
                        "<td class='marketer'>" + data[kAr[k]].price + "</td>" +
                        "<td>" + (res[i].profile ? res[i].profile.name : '') + "</td>" +
                        "<td></td>" +
                        "<td " + inv_period + ">" + res[i].period + "</td>" +
                        "<td class='tablesorter-no-sort'>" +
                        (res[i].comment ? "<span class='tacomment'>" + res[i].comment + "</span>" : '') +
                        "</td>" +
                        "<td  class='marketer'>" +
                        //      "<script src=\"https://nedol.ru/rtc/common.js\"></script>" +
                        //      "<script src=\"https://nedol.ru/rtc/host.js\"></script>" +
                        //      "<script src=\"https://nedol.ru/rtc/loader.js\"></script>" +
                        //      "<object   abonent=\"nedol@narod.ru\" components=\"audio browser video\"></object>" +
                        "</td>" +
                        "<td>" + "0" + "</td>" +

                        "<td class='tablesorter-no-sort'>" +
                        "<label  class=\"btn\">" +
                        "<input type=\"checkbox\" disabled class=\"notoday checkbox-inline complete\">" +
                        "<i class=\"fa fa-square-o fa-2x\"></i>" +
                        "<i class=\"fa fa-check-square-o fa-2x\"></i>" +
                        "</label>" +
                        "</td>" +

                        "</tr>").appendTo($('.item_title[data-translate=' + kAr[k] + ']').closest('.menu_item').children('.orders').css('visibility', 'visible').find('tbody'));

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

                    setTimeout(function () {
                        let pagerOptions = {
                            // target the pager markup - see the HTML block below
                            container: $(".pager"),
                            ajaxUrl: null,
                            customAjaxUrl: function (table, url) {
                                return url;
                            },
                            ajaxError: null,
                            ajaxObject: {dataType: 'json'},
                            ajaxProcessing: null,
                            processAjaxOnInit: true,
                            output: '{startRow:input} – {endRow} / {totalRows} rows',
                            updateArrows: true,
                            page: 0,
                            size: 10,
                            savePages: true,
                            storageKey: 'tablesorter-pager',
                            pageReset: 0,
                            fixedHeight: true,
                            removeRows: false,
                            countChildRows: false,
                            cssNext: '.next', // next page arrow
                            cssPrev: '.prev', // previous page arrow
                            cssFirst: '.first', // go to first page arrow
                            cssLast: '.last', // go to last page arrow
                            cssGoto: '.gotoPage', // select dropdown to allow choosing a page
                            cssPageDisplay: '.pagedisplay', // location of where the "output" is displayed
                            cssPageSize: '.pagesize', // page size selector - select dropdown that sets the "size" option
                            // class added to arrows when at the extremes (i.e. prev/first arrows are "disabled" when on the first page)
                            cssDisabled: 'disabled', // Note there is no period "." in front of this class name
                            cssErrorRow: 'tablesorter-errorRow' // ajax error information row
                        };
                        $('#ordtable_' + kAr[k]).tablesorter({
                            theme: 'blue',
                            widgets: ['zebra', 'column'],
                            usNumberFormat: false,
                            sortReset: true,
                            sortRestart: true,
                            sortInitialOrder: 'desc',
                            widthFixed: true
                        })
                        //.tablesorterPager(pagerOptions);
                    }, 1000);
                }
            });

            that.orders = res;

        });

            //
            that.lang = window.parent.sets.lang;
            window.parent.dict.set_lang(window.parent.sets.lang, $("#editor"));

            $('.item_content').on('shown.bs.collapse', function (e) {
                let h = $(this).closest('.content_div')[0].scrollHeight;
                $(this).find('.content').off();
                $(this).find('.content').on('change keyup keydown paste cut', 'textarea', function () {
                    $(this).height(0).height(h);//this.scrollHeight);
                }).find('textarea').change();
                $(this).find('.content_text').focus();
            });

            $('#add_item').off();
            $('#add_item').on('click', that, that.AddOfferItem);


            $('.input').click(function (ev) {
                that.changed = true;
                $(this).focus();
            });

            $("#editor").find('.publish_offer_ctrl').off('click touchstart');
            $("#editor").find('.publish_offer_ctrl').on('click touchstart', this, function (ev) {
                window.parent.user.PublishOffer(ev.data.GetOfferItems(ev.data.lang, true)['remote'], date, ev.data, function (obj) {

                });
            });

            //$("#offer_pane").draggable();
    }

        setTimeout(function () {
            initOrder();
            $('#supplier_frame_container',window.parent.document).css('height','100%');
        },500);

    }

    FillProfile(profile){
        // $('input').prop('readonly', true);
        // $('input').attr('placeholder', '');
        $('.avatar').attr('src',this.path+'/images/'+profile.avatar);
        $('input').attr('title', '');
        $('#name').val(profile.name);
        $('#email').val(profile.email);
        $('#mobile').val(profile.mobile);
        $('#address').val(profile.address);
        $('#place').val(profile.place);
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
                $('.avatar').attr('src', user.profile.profile.avatar);
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

    InitSupplierReview(sup){

       this.InitProfileSupplier({supuid:sup.uid,user:window.parent.user.constructor.name},
            {   //comments settings
                readOnly: (sup.appr && sup.appr.cusuid===window.parent.user.uid)?false:true,
                profilePictureURL: this.path+'/images/'+ sup.profile.avatar,
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

    OnClickAddPack(ev) {

        let menu_item = ev.data.mi;
        let that = ev.data.that;

        $('.add_pack').css('visibility', 'hidden');
        let pack = $(menu_item).find('.item_pack').val();
        let price = $(menu_item).find('.item_price').val()

        let pl = $(menu_item).find('.item_pack').attr('packlist');
        if (pl)
            pl = JSON.parse(pl);
        else
            pl = {};

        let res = $.grep(pl, function (item, i) {
            return (pack && item.pack === pack);
        });
        if (res.length === 0) {
            pl[pack] = price;
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

        $(menu_item).find('a[role=packitem]').on('click', {
            that: that,
            mi: $(menu_item)
        }, that.OnClickPack);

        $(menu_item).find('.item_pack').attr('packlist', JSON.stringify(pl));
        $(menu_item).find('.item_pack').val(pack);
        $(menu_item).find('.item_price').val(price);

        $(menu_item).find('.item_pack').dropdown("toggle");

    }

    OnClickPack(ev){
        let menu_item = ev.data.mi;
        let that = ev.data.that;
        {
            that.changed = true;
            let pl = JSON.parse($(menu_item).find('.item_pack').attr('packlist'));
            let price = pl[$(ev.target).text()];
            $(menu_item).find('.item_pack').val($(ev.target).text());
            $(menu_item).find('.item_pack').attr('pack',$(ev.target).text());
            $(menu_item).find('.item_price').val(price);
        }
    }

    AddOfferItem(ev){

        let that = ev.data;

        // if($('.menu_item').length>=parseInt($('#items_limit').val())) {
        //    return true;
        // }

        ev.data.changed = true;

        let tab = $('.tab_inserted.active').text();
        //alert('tab:'+tab);
        if(!tab)
            return;

        ev.preventDefault(); // avoid to execute the actual submit of the form.
        ev.stopPropagation();

        var pos = $('.menu_item').length;
        let tmplt = $('#menu_item_tmplt').clone();
        $('#menu_item_tmplt').attr('id', 'menu_item_'+ pos);
        let menu_item = $('#menu_item_'+ pos);
        $(menu_item).attr('class','menu_item');
        $(menu_item).css('display','block');
        $(menu_item).find(':checkbox').attr('id', 'item_cb_' + pos);
        $(menu_item).find(':checkbox').attr('pos', pos);
        $(menu_item).find(':checkbox').attr('tab', tab);
        $('.btn').css('visibility','visible');

        $(menu_item).find('.content_text').attr('contenteditable', 'true');
        $(menu_item).find('.item_title').attr('contenteditable', 'true');
        $(menu_item).find('.item_price').attr('contenteditable', 'true');

        //$(menu_item).find('.item_title').text($('#item_title').text());
        let hash = md5(new Date().getTime());
        //window.dict.dict[hash] = {};
        //$(menu_item).find('.item_title').attr('data-translate',hash);

        $(menu_item).find('.item_content').attr('id', 'content_'+tab.replace('#','')+ pos);
        $(menu_item).find('.item_title').attr('data-target','#content_' +tab.replace('#','') + pos);

        $(menu_item).find('.item_title').on('dblclick', function () {
            $(menu_item).find('.item_content').collapse('show');
        });

        $(menu_item).find('.item_title').on('focus', function () {
            $(menu_item).find('.item_content').collapse('hide');
        });

        hash = md5(new Date().getTime()+1);
        //window.dict.dict[hash] = {};
        // $(menu_item).find('.content_text').attr('data-translate', hash);
        $(menu_item).find('.img-fluid').attr('id','img_'+tab.replace('#','')+'_'+pos);

        $(menu_item).find('.put_image').css('display', 'block');

        $(menu_item).find('.checkbox').change(function () {

        });

        $(menu_item).find('input:file').on('change', this, that.OnImportImage);

        $(menu_item).find('.img-fluid').on('click touchstart', menu_item, function (ev) {
            let menu_item = $(ev.data);
            let vis = $(menu_item).find('.img-fluid').css('visibility');

            ev.target = $(menu_item).find('.img-fluid')[0];
            ev.mi = menu_item.attr('id');
            that.OnClickImport(ev);
            $(menu_item).find('.toolbar').insertAfter($(menu_item).find('.item_content'));

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

        $(menu_item).find('.align_center_bottom').click(function (ev) {
            let pos = $(menu_item).find('.img-fluid').parent().width()/2 -
                $(menu_item).find('.img-fluid').width()/2;
            $(menu_item).find('.img-fluid').css('left', pos);
        });
        $(menu_item).find('.align_left').click(function (ev) {
            $(menu_item).find('.img-fluid').css('right','');
            $(menu_item).find('.img-fluid').css('left','5px');
        });
        $(menu_item).find('.align_right').click(function (ev) {
            $(menu_item).find('.img-fluid').css('left','')
            $(menu_item).find('.img-fluid').css('right','5px');
        });

        $(menu_item).find('.input').click(function (ev) {
            that.changed = true;
        });

        $(menu_item).find('.cert_container').attr('id', 'gallery_' + tab.replace('#','') + '_' + pos);

        $(menu_item).find('.add_pack').attr('id', 'pack_' + tab.replace('#','') );
        $(menu_item).find('.add_pack').on('click', {mi:$(menu_item),that:that},that.OnClickAddPack);

        $('#'+tab).append(menu_item[0]);

        $(menu_item).find('.item_title').focus();

        $(menu_item).find('.toolbar').css('display', 'block');

        if ($(menu_item).find('.item_content').css('display') == 'block')
            $(menu_item).find('.item_content').slideToggle("fast");

        $(tmplt).insertAfter('#editor');

        window.parent.dict.set_lang(window.parent.sets.lang, $(menu_item));

        return true;
    }


    onClickImage(ev) {
        // ev.preventDefault();
        // ev.stopPropagation();
        let mi = $('#'+ev.data.id);
        $(mi).find('.img-fluid').attr('src',this.src);
        $(mi).find('.img-fluid').focus();
    };

    OnClickImport(ev){
        let menu_item = $('#'+ev.mi);
        $(menu_item).find('input:file').attr('func_el', JSON.stringify({func:'load_img',id:$(ev.target).attr('id')}));
        $(menu_item).find('input:file').focus();
        $(menu_item).find('input:file').trigger(ev);

        this.changed = true;
    }

    OnImportImage(ev){
        let that = ev.data;
        let  files = $(this)[0].files;
        let el = JSON.parse($(this).attr('func_el'));
        utils.HandleFileSelect(ev, files, function (data, smt) {
            if(data) {
                if(el.func==='load_img') {
                    let img  = new Image();//'<img src="'+data+'" height="50" >';
                    img.class = 'image';
                    img.src = data;
                    // img.height = '100';
                    img.width = '90';
                    img.style='padding:10px';
                    img.id = md5(data);

                    $("#" + el.id).attr('src', data);

                    $("#" + el.id).css('visibility', 'visible');
                    // $("#" + el.id).closest('.menu_item').find('.item_content').slideDown("slow");
                    $("#" + el.id).closest('.menu_item').find('.cert_container').append(img);
                    $(img).draggable({
                        start: function (ev) {
                            console.log("drag start");
                        },
                        drag: function (ev) {
                            //$(el).attr('drag', true);
                        },
                        stop: function (ev) {
                            console.log("drag stop");
                            if($(img).position().left>$(img).width()-20)
                                $(img).remove();
                        }
                    });
                    $(img).on('click touchstart',{id:$("#" + el.id).closest('.menu_item').attr('id')},window.sup_off.onClickImage);
                    let thumb = false;
                    $("#" + el.id).on('load', function (ev) {

                        if (!thumb) {
                            // let k = 200/$("#" + el.id).height();
                            // utils.createThumb($("#" + el.id)[0], $("#" + el.id).width()*k, $("#" + el.id).height()*k, function (thmb) {
                            //     thumb = true;
                            //     $("#" + el.id).attr('src', thmb.src);
                            // });

                            //$("#" + el.id).attr('thmb', utils.createThumb($("#" + el.id)[0]));
                        }

                    });
                }

            }
        });

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
        let offerObj = {local:{}, remote:{}};
        that.arCat = [];

        $('.item_title').trigger('click');

        $('#editor').find('.div_tab_inserted').each((index, val)=> {

            $(val).addClass('active');
            let tab = $(val).attr('id');
            let value = $('a[href="#'+tab+'"]').text();
            let cat;
            if(value) {
                if(!window.parent.dict.dict[md5(value)]){
                    window.parent.dict.dict[md5(value)] = {};
                }
                window.parent.dict.dict[md5(value)][lang] = value;
            }else{
                $(val).empty();
                return true;
            }

            let checked = $(val).find('.menu_item').find(':checkbox').prop('checked');

            let miAr = $(val).find('.menu_item');
            offerObj['local'][value] = [];
            offerObj['remote'][value] = [];

            for (let i = 0; i < miAr.length; i++) {

                let item = {};
                item.checked = JSON.stringify($(miAr[i]).find(':checkbox').prop('checked'));

                let title = $(miAr[i]).find('.item_title');
                let key = $(title).attr('data-translate');
                let text = $(miAr[i]).find('.item_title').val();

                if (text.length === 0 || !text.trim()) {
                    continue;
                }
                if(!window.parent.dict.dict[key]) {
                    window.parent.dict.dict[key] = {};
                }

                if (text !== window.parent.dict.dict[key][lang]) {
                    let obj = Object.assign({},window.parent.dict.dict[key]);
                    delete window.parent.dict.dict[key];
                    key = md5(text);
                    window.parent.dict.dict[key] = obj;
                    window.parent.dict.dict[key][lang] = text;
                    $(title).attr('data-translate',key);
                }
                item.title = key;

                if($(miAr[i]).find('.content_text').css('visibility')==='visible') {
                    let cont_text = $(miAr[i]).find('.content_text');
                    let w = $(cont_text).width();
                    let h = $(cont_text).height();
                    let l = $(cont_text).css('left');
                    let ofs = $(cont_text).offset();
                    key = $(cont_text).attr('data-translate');
                    text = $(cont_text).val().replace(/'/g,'%27').replace(/\n/g,'%0D').replace(/"/g,'%22');
                    if(!window.parent.dict.dict[key]) {
                        window.parent.dict.dict[key] = {};
                    }
                    if (text !== window.parent.dict.dict[key][lang]) {
                        let obj = Object.assign({},window.parent.dict.dict[key]);
                        delete window.parent.dict.dict[key];
                        key = md5(text);
                        window.parent.dict.dict[key] = obj;
                        window.parent.dict.dict[key][lang] = text;
                        $(cont_text).attr('data-translate',key);
                    }
                    item.content_text = {value:key};
                    item.content_text.width = w;
                    item.content_text.height = h;
                    item.content_text.left = l;

                }else{
                    if(item.content)
                        delete item.content;
                }
                item.width = $(miAr[i]).width()>0?$(miAr[i]).width():$('#offer_editor').width();

                if($(miAr[i]).find('.img-fluid').css('visibility')==='visible') {
                    item.img = {src:$(miAr[i]).find('.img-fluid').attr('src')};
                    let left =$(miAr[i]).find('.img-fluid').css('left');
                    item.img.left  = String(left).includes('%')?(parseInt(left)/100)*item.width: parseInt(left);
                    item.img.top = parseInt($(miAr[i]).find('.img-fluid').css('top'));

                }else {
                    delete item.img;
                }


                item.packlist = $(miAr[i]).find('.item_pack').attr('packlist');
                if(item.packlist) {
                    item.packlist = JSON.parse(item.packlist);
                }else{
                    item.price = $(miAr[i]).find('.item_price').val();
                    if(!item.price)
                        continue;
                }

                item.cert = [];
                $.each($(miAr[i]).find('.cert_container').children(), function (i, el) {
                    if(el.src.includes('http://placehold.it/400x700'))
                        return;
                    item.cert.push({src:el.src,pos:$(el).position()});
                });

                $.each($(miAr[i]).find('.orders').find('input:checkbox:checked'), function (i, el) {
                    window.parent.db.GetOrder(window.parent.user.date, window.parent.user.uid, $(el).attr('cusuid'),function (obj) {
                        window.parent.user.ApproveOrder(obj,$(el).attr('title'));
                    });
                });

                cat = $(window.parent.document).find('.category[title="'+value+'"]').attr('id');
                if(!cat)
                    cat='1000';
                if(!_.includes(that.arCat,parseInt(cat)))
                    that.arCat.push(parseInt(cat));

                offerObj['local'][value].push(item);

                if(item.checked==='true') {
                    offerObj['remote'][value].push(item);
                }
            }
            if(offerObj['remote'][value].length==0)
                delete offerObj['remote'][value];
            if(offerObj['local'][value].length==0)
                delete offerObj['local'][value];
        });

        return offerObj;
    }

    SaveOffer(lang) {

        let ind = $("li.tab_inserted.active").val();
        let active = $($("li.active").find('a')[ind]).text();
        let items  = this.GetOfferItems(lang,ind);
        // if(active) {
        //     items = this.getTabItems(active, lang);
        // }
        window.parent.user.UpdateOfferLocal(this.offer,items['local'], window.parent.user.offer.stobj.location , window.parent.dict.dict);
        return items;
    }

    SaveProfile(cb){

        let that = this;
        // if(!this.changed)//TODO:test uncomment
        //     return;
        if($('.avatar')[0].src.includes('data:image')){

            let k = 200/  $('.avatar').height();
            utils.createThumb_1($('.avatar')[0],$('.avatar').width()*k, $('.avatar').height()*k, function (avatar) {
                k = 50/  $('.avatar').height();
                utils.createThumb_1($('.avatar')[0],$('.avatar').width()*k, $('.avatar').height()*k, function (thmb) {
                    uploadProfile(that,avatar.src,thmb.src,cb);
                });
            });
        }else{
            uploadProfile(that,window.parent.user.profile.profile.avatar,window.parent.user.profile.profile.thmb,cb);
        }


        function uploadProfile(that,avatar,thmb,cb) {

            let data_post = '';
            data_post = {
                proj: 'd2d',
                user: window.parent.user.constructor.name,
                func: 'updprofile',
                uid: window.parent.user.uid,
                psw: window.parent.user.psw,
                profile: {
                    type: window.parent.user.profile.profile.type,
                    email: $('#email').val().toLowerCase(),
                    avatar: avatar,
                    thmb: thmb,
                    lang: window.parent.user.profile.profile.lang,
                    name: $('#name').val(),
                    worktime: $('#worktime').val(),
                    mobile: $('#mobile').val(),
                    place: $('#place').val(),
                }
            }

            window.parent.network.postRequest(data_post, function (res) {
                let res_ = res;

                window.parent.db.GetSettings(function (obj) {

                    let set = _.find(obj, {uid: window.parent.user.uid});
                    set.profile = data_post.profile;

                    if(res_.profile) {
                        set.profile.avatar = res_.profile.avatar;
                        set.profile.thmb = res_.profile.thmb;
                    }
                    window.parent.db.SetObject('setStore', set, function (res) {
                        $('#user_2', window.parent.document).find('img').attr('src',that.path+'/images/'+ set.profile.avatar);
                        that.profile = set.profile;
                        window.parent.user.profile.profile = set.profile;
                        cb();
                    });
                });
            });
        }
    }

    SaveSettings(){
        if(!this.changed)
            return;
        this.changed = false;

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
            window.parent.network.postRequest(data_obj, function (data) {

            });
        });

    }

}
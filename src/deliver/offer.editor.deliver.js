'use strict'
export {OfferEditorDeliver}

require('webpack-jquery-ui/draggable');
require('jquery-ui-touch-punch');

require('bootstrap');

require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');

let Dict = require('../dict/dict.js');
const langs = require("../dict/languages");

var Url = require('url-parse');
// var moment = require('moment');


import {Utils} from "../utils/utils";
import {Profile} from "../profile/profile";
let utils = new Utils();

class OfferEditorDeliver{


    constructor(){

        this.changed = false;

        this.arCat = [];


        this.path  = window.location.origin +"/d2d/";
        if(host_port.includes('nedol.ru'))
            this.path = host_port;

    }

    OpenOffer() {
        let date = new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));
        let offAr =[], supAr = [];
        window.db.GetOffer(date,(of)=> {
            this.fillEditor(of);
            window.db.GetAllSuppliers(date,(ar)=> {
                var _ = require('lodash');
                supAr = ar;
                let union = _.unionBy(offAr,supAr,'supuid');
            });
        });

        window.db.GetSettings(function (set) {
            window.user.profile = new Profile(set[0].profile);
            window.user.profile.InitDeliverProfile();
        });

    }

    fillEditor(ar) {
        var md5 = require('md5');
        let that = this;

        $(".category[state='1']").each(function (i, cat) {
            let tab = cat.title;
            if(!$('#'+tab)[0]) {
                $('<li class="tab_inserted"><a cat="' + cat.id + '" data-toggle="tab" data-translate="' + md5(tab) + '"  href="#' + tab + '"' +
                    ' style="color:grey;margin:1px;">' + cat.title + '</a>' +
                    '</li>').insertBefore($('#add_tab_li'));
                $('<div id="' + tab + '" class="tab-pane fade div_tab_inserted" style="border: none">' +
                    '</div>').insertBefore($('#add_tab_div'));
            }
        });

        $('.dropdown').css('visibility','visible');
        $('#order_menu_button').css('visibility','visible');
        $('#add_tab_li').css('visibility','visible');
        $('#add_item').css('visibility','visible');

        let isEditable = true;
        this.ovc = $("#offer_editor");
        this.ovc .css('display','block');
        this.ovc .resizable();

        this.ovc.find('.packing_header').css('display','inline-block');
        this.ovc.find('.markup_header').css('display','none');
        this.ovc.find('.price_header').css('display','inline-block');
        this.ovc.find('.total_header').css('display','inline-block');
        this.ovc.find('.orders_header').css('display','inline-block');
        this.ovc.find('.packing_div').css('display','inline-block');
        this.ovc.find('.price_div').css('display','inline-block');
        this.ovc.find('.markup_div').css('display','none');
        this.ovc.find('.total_div').css('display','inline-block');
        this.ovc.find('.orders_div').css('display','inline-block');


        this.ovc.find('.avatar').on('click touchstart',function () {
             $("#offer_editor").find('.browser').css('display', 'block');
             $("#offer_editor").find('.modal-content').css('display','none');
         });

        function selectText(el) {
            $(el).focus();
            document.execCommand('selectAll', false, null);
        }

        $(".content_text").dblclick(function () {
            selectText($(this));
        });
        let str = " \r\n"+$('.dt_val')[0].value.split(' ')[0]+" \r\n("+$('.sel_period').text()+")";
        this.ovc .find('.modal-title').text(str);
        // if(that.offer.published)
        //     $("#offer_editor").find('.offer_status').text($('#published').text()+'\r\n'+that.offer.published);


        this.lang = window.sets.lang;
        window.sysdict.set_lang(window.sets.lang,$("#menu_item_tmplt"));
        window.sysdict.set_lang(window.sets.lang,$("#offer_editor"));

        $('#add_item').css('display', 'block');
        $('#add_tab_li').css('display','block');

        let markup ="0";

        for(let of in ar) {
            let offer = ar[of];
            that.offer = offer;
            if(offer)
            for (let tab in offer.data) {
                if (!tab)
                    continue;

                for (let i in offer.data[tab]) {
                    let menu_item = $('#menu_item_tmplt').clone();

                    if(offer.data[tab][i].owner){
                        $(menu_item).attr("owner", offer.data[tab][i].owner);
                    }else{
                        offer.data[tab][i].supuid = offer.supuid;
                        $(menu_item).attr("owner", offer.supuid);
                    }
                    let t = tab;
                    window.db.GetSupplier(new Date(window.user.date), $(menu_item).attr("owner"), function (sup) {
                        $(menu_item).find('.item_title').attr('data-translate', offer.data[tab][i].title);
                        var base = _.find(sup.data[t], { title:offer.data[tab][i].title });
                        let pack = $(menu_item).find('.item_pack').text();
                        $(menu_item).find('.item_total').val(parseInt(base.packlist[pack])+parseInt(offer.data[tab][i].markuplist[pack]));
                        $(menu_item).find('.item_price').val(parseInt(base.packlist[pack]));
                        window.dict.dict = Object.assign(sup.dict.dict, window.dict.dict);
                        that.lang = window.sets.lang;
                        window.dict.set_lang(window.sets.lang,$(menu_item));

                    });

                    $(menu_item).attr('id', tab +'_'+ of +'_' + i);
                    $(menu_item).attr("class", 'menu_item');

                    $(menu_item).find(':checkbox').attr('id', 'item_cb_' + i);
                    $(menu_item).find(':checkbox').attr('pos', i);
                    $(menu_item).find(':checkbox').attr('tab', tab);

                    $(menu_item).find('.item_cb').css('visibility', 'visible');

                    if(offer.supuid!==window.user.uid) {
                        $(menu_item).find(':checkbox').prop('checked', false);

                    }else {
                        if (offer.data[tab][i].checked == 'true') {
                            $(menu_item).find(':checkbox').prop('checked', true);
                            if (that.published)
                                isEditable = false;
                        } else {
                            isEditable = true;
                        }
                    }

                    $(menu_item).find(':checkbox').on('change', this, function (ev) {
                        ev.data.changed = true;
                    });

                    $(menu_item).find('.item_title').attr('contenteditable', isEditable);

                    let items = $('.item_title[data-translate='+ offer.data[tab][i].title+']');
                    if(items.length>0) {//check duplicated items
                        let item = _.find(items, function(item) {
                            let mi = $(item).closest('.row').parent();
                            return $(mi).attr('owner')===offer.data[tab][i].supuid;
                        });

                        if(item)
                            continue;
                    }

                    if (offer.data[tab][i].title) {
                        $(menu_item).find('.item_title').attr('data-translate', offer.data[tab][i].title);
                    }

                    $(menu_item).find('.item_content').attr('id', 'content_' + tab +'_'+of+ '_' + i);
                    $(menu_item).find('.item_title').attr('data-target', '#content_' + tab +'_'+of+ '_' + i);
                    $(menu_item).find('.item_title').attr('contenteditable', 'true');

                    $(menu_item).find('.content_text').attr('contenteditable', 'true');
                    if (offer.data[tab][i].content_text)
                        $(menu_item).find('.content_text').attr('data-translate', offer.data[tab][i].content_text.value);
                    if (offer.data[tab][i].content_text)
                        $(menu_item).find('.content_text').css('visibility', 'visible');

                    if (offer.data[tab][i].img) {
                        $(menu_item).find('.img-fluid').css('visibility', 'visible');
                        $(menu_item).find('.img-fluid').attr('hash',offer.data[tab][i].img.src);
                        $(menu_item).find('.img-fluid').attr('src', that.path+'/images/'+offer.data[tab][i].img.src);
                    }

                    $(menu_item).find('.img-fluid').attr('id', 'img_' + tab +'_'+of+ '_' + i);
                    $(menu_item).find('.pack_list').empty();
                    let pl = offer.data[tab][i].markuplist;
                    $(menu_item).find('.item_pack').attr('markuplist', JSON.stringify(pl));
                    for (let p in pl) {
                        if (!p)
                            continue;
                        let data = parseInt(pl[p]);
                        $(menu_item).find('.item_price').attr('base',data);


                        pl[p] = data;
                        $(menu_item).find('.dropdown').css('visibility', 'visible');
                        $(menu_item).find('.pack_list').append("<li href='#'><a role='packitem' >" + p + "</a></li>");
                        $(menu_item).find('.item_pack').text(p);
                        $(menu_item).find('.caret').css('visibility', 'visible');
                        $(menu_item).find('.pack_list').addClass('dropdown-menu');
                        $(menu_item).find('.item_pack').attr('data-toggle', 'dropdown');
                        //$(menu_item).find('.item_pack').addClass('dropdown-toggle');
                        $(menu_item).find('.item_pack').attr('pack', i);


                        $(menu_item).find('.item_pack').on('focusout', that, function (ev) {
                            let that = ev.data;
                            let pack = $(menu_item).find('.item_pack').attr('pack');
                            if ($(this).text() === '') {
                                $(menu_item).find('a:contains(' + pack + ')').remove();
                                let pl = JSON.parse($(menu_item).find('.item_pack').attr('packlist'));
                                delete pl[pack];
                                $(this).attr('packlist', JSON.stringify(pl));
                            }
                            //$(menu_item).find('.add_pack').css('visibility', 'hidden');
                        });

                    }


                    $(menu_item).find('.gallery').attr('id', 'gallery_' + tab +'_'+of+ '_' + i);

                    $.each(offer.data[tab][i].cert, function (i, data) {
                        let img = new Image();
                        img.src = data.src;
                        //$(img).offset(data.pos);TODO:
                        img.height = '100';
                        $(menu_item).find('.gallery').append(img);
                        $(img).on('click', that.onClickCert);
                        that.MakeDraggable(img);
                    });


                    $(menu_item).css('display', 'block');
                    $('#' + tab).append(menu_item);//добавить продукт в закладку

                    //$(tmplt).insertAfter('#offer_editor');

                    if ($(menu_item).find('.item_content').css('display') == 'block'
                        && $(menu_item).find('.img-fluid').attr('src') === ''
                        && $(menu_item).find('.content_text').text() === "") {
                        $(menu_item).find('.item_content').slideToggle("fast");
                    }

                    $(menu_item).find('.add_picture').attr('id', 'ap_'  + tab +'_'+of+ '_' + i);
                    $(menu_item).find('.add_picture').on('click', this, function (ev) {
                        let menu_item = $(this).closest('.menu_item');
                        let vis = $(menu_item).find('.img-fluid').css('visibility');
                        if (vis === 'visible') {
                            $(menu_item).find('.img-fluid').css('visibility', 'hidden');
                        } else {
                            ev.target = $(menu_item).find('.img-fluid')[0];
                            that.OnClickImport(ev);
                            $(menu_item).find('.toolbar').insertAfter($(menu_item).find('.item_content'));
                        }
                    });

                    $(menu_item).find('.add_content').on('click touchstart', menu_item, function (ev) {
                        let menu_item = $(ev.data);
                        $(menu_item).find('.item_content').slideDown("slow");
                        let vis = $(this).closest('.menu_item').find('.content_text').css('visibility');
                        if (vis === 'visible') {
                            vis = 'hidden';
                        } else {
                            vis = 'visible';
                        }

                        $(menu_item).find('.content_text').css('visibility', vis);
                        $(menu_item).find('.content_text').focus();
                    });

                    $(menu_item).find('.add_cert').attr('id', 'ac_' + tab +'_'+of+ '_' + i);
                    $(menu_item).find('.add_cert').on('click', this, function (ev) {
                        let menu_item = $(this).closest('.menu_item');
                        ev.target = $(menu_item).find('.gallery')[0];
                        that.OnClickAddCert(ev);
                        $(menu_item).find('.toolbar').insertAfter($(menu_item).find('.item_content'));
                    });

                    $(menu_item).find('.toolbar').css('display', 'block');

                    $(menu_item).find('.orders').attr('id', 'orders'  + tab +'_'+of+ '_' + i);
                    $(menu_item).find('.order_ctrl').attr('data-toggle', 'collapse');
                    $(menu_item).find('.order_ctrl').attr('data-target', '#orders'  + tab +'_'+of+ '_' + i)

                    $(menu_item).find('.tablesorter').attr('id', 'ordtable_' + offer.data[tab][i].title);

                    $(menu_item).find('li>a[role=packitem]').on('click', {
                        that: that,
                        mi: $(menu_item)
                    }, that.OnClickPack);

                    $('a[href="#' + tab + '"]').css('color', 'blue');
                }

                $('#' + tab).sortable({
                    placeholder: "ui-state-highlight"
                });
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

            $($('.tab_inserted a')[0]).tab('show');

            if(new Date(window.user.date).getDate()=== new Date().getDate()){
                $('.notoday').removeClass('notoday');
            }

        }//for offer array

        $('.item_content').on('shown.bs.collapse', function (e) {
            $(this).find('.content').off();
            $(this).find('.content').on( 'change keyup keydown paste cut', 'textarea', function (){
                $(this).height(0).height(this.scrollHeight);
            }).find( 'textarea' ).change();
        });

        that.HandleOrders(window.user.date);
        //
        this.lang = window.sets.lang;
        window.dict.set_lang(window.sets.lang,$("#offer_editor"));

        //$('.content_text').resizable();

        let evnts = $._data($('#add_tab').get(0), "events");

        evnts = $._data($('#add_item').get(0), "events");
        if(!evnts || !evnts['click']) {
            $('#add_item').on('click', this, this.AddOfferItem);
        }

        $('input:file').on('change', this, that.OnImportImage);

        $('.input').click(function (ev) {
            that.changed = true;
            $(this).focus();
        });

        $("#offer_editor").find('.publish_offer_ctrl').off('click touchstart');
        $("#offer_editor").find('.publish_offer_ctrl').on('click touchstart', this, function (ev) {
            window.user.PublishOffer(ev.data.GetOfferItems(ev.data.lang,true)['remote'],date, ev.data, function (obj) {

            });
        });


        $('.close_browser').off('click touchstart');
        $('.close_browser').on('click touchstart', this,  that.CloseMenu);

        that.MakeDraggable($("#offer_editor"));

    }

    HandleOrders(date){
        let that = this;
        window.db.GetSupOrders(date, window.user.uid, function (res) {

            for(let i in res){
                let data = res[i].data;
                let inv_period = '', tr_class = '';

                let kAr = Object.keys(data);
                let calcDistance = new Promise(
                    function (resolve, reject) {
                        if (!that.location)
                            resolve('undefined');
                        window.user.map.geo.GetDistanceToPlace(that.location, res[i].address, function (res) {
                            resolve(res);
                        });
                    }
                );
                calcDistance.then(function (dist) {
                    for (let k in kAr) {
                        let mi = $('.item_title[data-translate=' + kAr[k] + ']').closest('.menu_item[owner='+res[i].data[kAr[k]].owner+']');
                        if(!mi[0])
                            continue;
                        $(mi).find('.order_ctrl').css('visibility', 'visible');
                        $(mi).find('.order_amnt').css('visibility', 'visible');
                        $(mi).find('.order_amnt').text(data[kAr[k]].qnty);
                        let inv_qnty = '', tr_style = '', tr_disabled = '', del='';
                        if (data[kAr[k]].status === 'deleted') {//deleted
                            '<span class="glyphicon glyphicon-remove">'
                            inv_qnty = "title='deleted' style='color:red'";
                            tr_style = "color:red";
                            tr_disabled = "disabled";
                            del="<span class='glyphicon glyphicon-remove'  style='position:relative; color: red; left:-20px;top:-10px;'></span>";
                        }

                        let price = $('.item_title[data-translate=' + kAr[k] + ']').closest('.row').find('.item_price').text();
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
                            del+
                            "</label>" +
                            "</td>" +
                            "<td class='owner' title='" + kAr[k] + "' cusuid=" + res[i].cusuid + ">" + data[kAr[k]].owner + "</td>" +
                            "<td " + inv_qnty + ">" + data[kAr[k]].qnty + "</td>" +
                            "<td>" + data[kAr[k]].pack + "</td>" +
                            "<td class='marketer'>" + data[kAr[k]].price + "</td>" +
                            "<td>" + res[i].address + "</td>" +
                            "<td>" + parseInt(dist) + "</td>" +
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
                            "</tr>").appendTo($(mi).find('.orders').css('visibility', 'visible').find('tbody'));

                        if (window.user.profile.profile.type === 'marketer') {
                            $('.marketer').css('display', 'none');
                            $('.approve').attr('disabled', 'true');
                            $('.complete').attr('disabled', 'true');
                        }
                        window.db.GetSupplier(new Date(window.user.date),data[kAr[k]].owner, function (obj) {
                            $(".owner[title='" + kAr[k] + "'][cusuid=" + res[i].cusuid + "]").text(obj.profile.name +'\r\n'+obj.profile.place);
                        });
                        window.db.GetApproved(new Date(window.user.date), window.user.uid, res[i].cusuid, kAr[k], function (appr) {
                            if (appr && appr.data.qnty === res[i].data[kAr[k]].qnty &&
                                appr.data.price === res[i].data[kAr[k]].price) {
                                $(".approve[title='" + kAr[k] + "'][cusuid=" + res[i].cusuid + "]").attr('checked', 'checked');
                                $(".approve[title='" + kAr[k] + "'][cusuid=" + res[i].cusuid + "]").attr('disabled', 'true');
                            }
                        });

                        setTimeout(function () {
                            $('#ordtable_' + kAr[k]).tablesorter({
                                theme: 'blue',
                                widgets: ['zebra', 'column'],
                                usNumberFormat: false,
                                sortReset: true,
                                sortRestart: true,
                                sortInitialOrder: 'desc',
                                widthFixed: true
                            })
                        }, 1000);
                    }
                })
                    .catch(function (error) {
                        // ops, mom don't buy it
                        console.log(error.message);
                    });
            }
            that.orders = res;
            //window.user.offer.viewer.InitOrders(res);

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

    OnClickAddPack(ev) {

        let menu_item = ev.data.mi;
        let that = ev.data.that;

        $('.add_pack').css('visibility', 'hidden');
        let pack = $(menu_item).find('.item_pack').text();
        let price = $(menu_item).find('.item_price').text()

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
                $(menu_item).find('.pack_list').append("<li href='#'><a role='packitem'>" + i + "</a></li>");
            }
        }

        $(menu_item).find('.item_pack').addClass('dropdown-toggle');
        $(menu_item).find('.item_pack').attr('data-toggle','dropdown');
        $(menu_item).find('.pack_list').addClass('dropdown-menu');
        $(menu_item).find('.caret').css('visibility', 'visible');

        $(menu_item).find('li>a[role=packitem]').on('click', {
            that: that,
            mi: $(menu_item)
        }, that.OnClickPack);

        $(menu_item).find('.item_pack').attr('packlist', JSON.stringify(pl));
        $(menu_item).find('.item_pack').text(pack);
        $(menu_item).find('.item_price').text(price);

        $(menu_item).find('.item_pack').dropdown("toggle");

    }

    OnClickPack(ev){
        let menu_item = ev.data.mi;
        let that = ev.data.that;
        {
            that.changed = true;
            let pl = JSON.parse($(menu_item).find('.item_pack').attr('packlist'));
            let price = pl[$(ev.target).text()];
            $(menu_item).find('.item_pack').text($(ev.target).text());
            $(menu_item).find('.item_pack').attr('pack',$(ev.target).text());
            $(menu_item).find('.item_price').text(price);
        }
    }

    OnClickImport(ev){

        $('input:file').attr('func_el', JSON.stringify({func:'load_img',id:$(ev.target).attr('id')}));
        $('input:file').focus().trigger(ev);

        this.changed = true;
    }

    OnImportImage(ev){
        let that = ev.data;
        let  files = $("input[type='file']")[0].files;
        let el = JSON.parse($(ev.target).attr('func_el'));
        utils.HandleFileSelect(ev, files, function (data, smt) {
            if(data) {
                if(el.func==='load_img') {
                    $("#" + el.id).attr('src', data);
                    let thumb = false;
                    $("#" + el.id).css('visibility', 'visible');
                    $("#" + el.id).closest('.menu_item').find('.item_content').slideDown("slow");
                    $("#" + el.id).on('load', function (ev) {
                        if (!thumb) {
                            // let k = 200/$("#" + el.id).height();
                            // utils.createThumb($("#" + el.id)[0], $("#" + el.id).width()*k, $("#" + el.id).height()*k, function (thmb) {
                            //     thumb = true;
                            //     $("#" + el.id).attr('src', thmb.src);
                            // });

                            //$("#" + el.id).attr('thmb', utils.createThumb($("#" + el.id)[0]));
                        }

                        that.MakeDraggable(this);
                    });
                }else if(el.func==='add_cert') {
                    let img  = new Image();//'<img src="'+data+'" height="50" >';
                    img.class = 'cert';
                    img.src = data;
                    img.height = '50';
                    $("#" + el.id).append(img);
                    $(img).on('click',that.onClickImage);
                    that.MakeDraggable(img);
                }

            }
        });

    }

    OnClickAddCert(ev){
        let text = $('div[data-translate="3e68ad9b7ced9994b62721c5af7c5fbc"]').text();
        let addr = prompt(text);
        if(addr) {
            $(ev.target).attr('src', addr);
        }else{
            $('input.file').attr('func_el', JSON.stringify({func:'add_cert',id:$(ev.target).attr('id')}));
            $('input.file').trigger('click');
        }

        this.changed = true;
    }

    MakeDraggable(el){
        $(el).draggable({
            start: function (ev) {
                console.log("drag start");
            },
            drag: function (ev) {
                //$(el).attr('drag', true);
            },
            stop: function (ev) {
                // var rel_x = parseInt($(el).position().left / window.innerWidth * 100);
                // $(el).css('right', rel_x + '%');
                // var rel_y = parseInt($(el).position().top / window.innerHeight * 100);
                // $(el).css('bottom', rel_y + '%');
            }
        });
    }

    AddOfferItem(ev){
        var md5 = require('md5');
        let that = ev.data;

        // if($('.menu_item').length>=parseInt($('#items_limit').val())) {
        //    return true;
        // }

        ev.data.changed = true;

        let tab = $('#menu_tabs').find('li.active').find('a').attr('href');
        if(!tab)
            return;

        ev.preventDefault(); // avoid to execute the actual submit of the form.
        ev.stopPropagation();

        var pos = $('.menu_item').length;
        let tmplt = $('#menu_item_tmplt').clone();
        $('#menu_item_tmplt').attr('id', 'menu_item_'+ pos);
        let menu_item = $('#menu_item_'+ pos);
        $(menu_item).addClass('menu_item');
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

        hash = md5(new Date().getTime()+1);
        //window.dict.dict[hash] = {};
        // $(menu_item).find('.content_text').attr('data-translate', hash);
        $(menu_item).find('.img-fluid').attr('id','img_'+tab.replace('#','')+'_'+pos);

        $(menu_item).find('.put_image').css('display', 'block');

        $(menu_item).find('.checkbox').change(function () {

        });
        $(menu_item).find('.item_pack').on('focusin', that,(ev)=> {
            $(menu_item).find('.add_pack').css('visibility', 'visible');
        });
        $(menu_item).find('.add_picture').on('click touchstart',menu_item,function (ev) {
            let menu_item = $(ev.data);
            let vis = $(menu_item).find('.img-fluid').css('visibility');
            if (vis === 'visible'){
                $(menu_item).find('.img-fluid').css('visibility','hidden');
            }else {
                ev.target = $(menu_item).find('.img-fluid')[0];
                that.OnClickImport(ev);
                $(menu_item).find('.toolbar').insertAfter($(menu_item).find('.item_content'));
            }
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

        $(menu_item).find('.gallery').attr('id', 'gallery_' + tab.replace('#','') + '_' + pos);

        $(menu_item).find('.add_cert').attr('id', 'ac_' + tab.replace('#','') + '_' + pos);
        $(menu_item).find('.add_cert').on('click',this,function (ev) {
            let menu_item = $(this).closest('.menu_item');
            ev.target = $(menu_item).find('.gallery')[0];
            that.OnClickAddCert(ev);
            $(menu_item).find('.toolbar').insertAfter($(menu_item).find('.item_content'));
        });


        $(menu_item).find('.add_pack').attr('id', 'pack_' + tab.replace('#','') );
        $(menu_item).find('.add_pack').on('click', {mi:$(menu_item),that:that},that.OnClickAddPack);

        $(tab).append(menu_item[0]);

        $(menu_item).find('.item_title').focus();

        $(menu_item).find('.toolbar').css('display', 'block');

        if ($(menu_item).find('.item_content').css('display') == 'block')
           $(menu_item).find('.item_content').slideToggle("fast");

        $(tmplt).insertAfter('#offer_editor');

        window.dict.set_lang(window.sets.lang, $(menu_item));

        return true;
    }

    OnDeleteItem(ev){
        if (confirm("Delete the item")) {
            let menu_item = $(ev.target).closest('.menu_item');
            let hash = $(menu_item).find('.content_text').attr('data-translate');
            if($('[data-translate='+hash+']').length<=1)
                delete window.dict.dict[$(menu_item).find('.item_title').attr('data-translate')];
            hash = $(menu_item).find('.content_text').attr('data-translate');
            if($('[data-translate='+hash+']').length<=1)
                delete window.dict.dict[$(menu_item).find('.content_text').attr('data-translate')];
            $(menu_item).remove();

            this.changed = true;
        }
    }

    CancelMenu(ev){
        ev.stopPropagation();
        ev.preventDefault();
        let isCancel = confirm("Cancel the reservation?");
        if (isCancel) {
            let menu = ev.data.menu_id;
            let table = ev.data.table_id;
            let time = $('.sel_period').text();
            ev.data = ev.data.parent;
            $("#offer_editor").find('.cancel_menu').off(ev);
            if(this.order[ev.data.uid][table][menu]){
                let reserve = Object.assign({},ev.data.order);
                delete reserve[time][ev.data.uid][table][menu];
                ev.data.UpdateReservation(ev,table,reserve[time],function (ev) {
                    $('#offer_editor').modal('hide');
                });
            }
        }

        $('#order_menu_button').dropdown("toggle")
    }

    GetOfferItems(lang){
        var md5 = require('md5');
        let that = this;
        let offerObj = {local:{}, remote:{}};
        that.arCat = [];

        $('.item_title').trigger('click');

        $('#offer_editor').find('.div_tab_inserted').each((index, val)=> {

            $(val).addClass('active');
            let tab = $(val).attr('id');
            let value = $('a[href="#'+tab+'"]')[0].value;
            let cat;
            if(value) {
                cat = $('.category[title="'+value+'"]').attr('id');
                if(!cat)
                    cat='1000';
                that.arCat.push(parseInt(cat));

                if(!window.dict.dict[md5(value)]){
                    window.dict.dict[md5(value)] = {};
                }
                window.dict.dict[md5(value)][lang] = value;
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
                if(item.checked==='false')
                    continue;
                let title = $(miAr[i]).find('.item_title');
                let key = $(title).attr('data-translate');
                let text = $(miAr[i]).find('.item_title').val();

                if (text.length === 0 || !text.trim())
                    continue;
                if(!window.dict.dict[key]) {
                    window.dict.dict[key] = {};
                }

                if (text !== window.dict.dict[key][lang]) {
                    let obj = Object.assign({},window.dict.dict[key]);
                    delete window.dict.dict[key];
                    key = md5(text);
                    window.dict.dict[key] = obj;
                    window.dict.dict[key][lang] = text;
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
                    text = $(cont_text).text().replace(/'/g,'%27').replace(/\n/g,'%0D').replace(/"/g,'%22');
                    if(!window.dict.dict[key]) {
                        window.dict.dict[key] = {};
                    }
                    if (text !== window.dict.dict[key][lang]) {
                        let obj = Object.assign({},window.dict.dict[key]);
                        //delete window.dict.dict[key];
                        key = md5(text);
                        window.dict.dict[key] = obj;
                        window.dict.dict[key][lang] = text;
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

                    item.img = {src: $(miAr[i]).find('.img-fluid').attr('hash')};

                }else {
                    delete item.img;
                }

                item.markuplist = $(miAr[i]).find('.item_pack').attr('markuplist');
                if(item.markuplist)
                    item.markuplist = JSON.parse(item.markuplist);

                item.price = parseInt($(miAr[i]).find('.item_price').attr('base'));
                if(!item.price)
                    continue;

                item.cert = [];
                $.each($(miAr[i]).find('.gallery').children(), function (i, el) {
                    item.cert.push({src:el.src,pos:$(el).position()});
                });

                $.each($(miAr[i]).find('.orders').find('input:checkbox:checked'), function (i, el) {
                    window.db.GetOrder(new Date(window.user.date), window.user.uid, $(el).attr('cusuid'),function (obj) {
                        window.user.ApproveOrder(obj,$(el).attr('title'));
                    });
                });

                item.owner = $(miAr[i]).attr('owner');
                if(!item.owner)
                    continue;

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

    SaveOffer(ev, lang) {

        let ind = $("li.tab_inserted.active").val();
        let active = $($("li.active").find('a')[ind]).text();
        let items  = this.GetOfferItems(lang,ind);

        window.user.UpdateOfferLocal(this.offer, items['local'], window.dict.dict);
        return items;
    }

    CloseMenu(ev) {
        let that = ev.data;
        //if(ev.data.changed)
        let items = that.SaveOffer(ev,window.sets.lang);

        if(that.changed) {
            if ($('.menu_item').find('input:checked').length > 0 && window.user.ValidateOffer(items['remote'])) {
                window.user.PublishOffer(items['remote'], window.user.date, ev.data, function (obj) {
                    window.user.offer.stobj = obj;
                });
            }
        }

        window.user.profile.SaveProfile();

        let orders = that.orders;
        // $('.approve:checked').each(function (i,item) {
        //     if(!orders[i])
        //         return;
        //     let obj = orders[i];
        //     window.user.ApproveOrder(obj, $(item).attr('title'));
        // })

        $("#offer_editor").css('display','none');

        $("#offer_editor").off('hide.bs.modal');
        $('.item_title').off('click');
        //$('#add_item').off('click',this.AddOfferItem);
        //$('.modal-body').find('.add_tab').off('click', this.AddTab);
        $('.div_tab_inserted').remove();

        //$('.sp_dlg').off('changed.bs.select');
        $("#offer_editor").find('.toolbar').css('display', 'none');
        $('input:file').off('change');


        $('.menu_item').remove();
        $('.tab_inserted').remove();

    }

    OnChangeLang(ev) {
        ev.preventDefault(); // avoid to execute the actual submit of the form.
        ev.stopPropagation();
        let menu = ev.data;
        menu.SaveOffer(ev,window.user.menu.lang);

        let sel_lang = $('.sp_dlg option:selected').val().toLowerCase().substring(0, 2);

        window.dict.Translate('en',sel_lang, function () {
            window.dict.set_lang(sel_lang, $("#offer_editor"));
            window.user.menu.lang = sel_lang;
        });
    }

    OnMessage(data){//TODO:
        if(data.func ==='ordered'){
            $('tbody').empty();
            this.HandleOrders(data.order.date);

        }
        if(data.func ==='sharelocation'){
            let loc = data.location;

        }

    }

}



'use strict'
export {OfferEditor}

require('webpack-jquery-ui/draggable');
require('jquery-ui-touch-punch');

require('bootstrap/js/tooltip.js');
require('bootstrap/js/tab.js');

require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');

let Dict = require('../dict/dict.js');
const langs = require("../dict/languages");

var moment = require('moment');

var md5 = require('md5');
var isJSON = require('is-json');

import {Utils} from "../utils/utils";
import {OrderViewer} from "../order/order.viewer";

let utils = new Utils();

class OfferEditor{


    constructor(obj, date){

        this.changed = false;

        this.arCat = [];

    }

     OpenOffer() {

        let that = this;
        let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        $(".category[state='1']").each(function (i, cat) {
            let tab = cat.title;
            $('<li class="tab_inserted"><a cat="'+cat.id+'" data-toggle="tab" contenteditable="true"  data-translate="'+md5(tab)+'"  href="#'+tab+'"' +
                ' style="margin:1px;color:white; background-color:black">'+cat.title+'</a>' +
                '</li>').insertBefore($('#add_tab_li'));
            $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted" style="border: none">'+
                '</div>').insertBefore($('#add_tab_div'));
        });

        this.offer =  window.user.offer.stobj;
        this.location = window.user.offer.stobj.location;

        $('.dropdown').css('visibility','visible');
        $('#order_menu_button').css('visibility','visible');
        $('#add_tab_li').css('visibility','visible');
        $('#add_item').css('visibility','visible');

        let isEditable = true;

        $("#offer_editor").css('display','block');
        $("#offer_editor").resizable();

        function selectText(el) {
            $(el).focus();
            document.execCommand('selectAll', false, null);
        }

        $(".content_text").dblclick(function () {
            selectText($(this));
        });
        let str = "Предложение по доставке \r\n"+$('.dt_val')[0].value.split(' ')[0]+" \r\n("+$('.sel_period').text()+")";
        $("#offer_editor").find('.modal-title').text(str);
        if(that.offer.published)
            $("#offer_editor").find('.offer_status').text('Опубликовано:\r\n'+that.offer.published);


        this.lang = window.sets.lang;
        window.sysdict.set_lang(window.sets.lang,$("#menu_item_tmplt"));
        window.sysdict.set_lang(window.sets.lang,$("#offer_editor"));

        $('#add_item').css('display', 'block');
        $('#add_tab_li').css('display','block');

        for (let tab in this.offer.data) {
            if(!tab) continue;

            for (let i in this.offer.data[tab]) {
                let menu_item = $('#menu_item_tmplt').clone();
                $(menu_item).attr('id', tab + '_' + i);
                $(menu_item).attr("class", 'menu_item');
                $(menu_item).css('display', 'block');

                $(menu_item).find(':checkbox').attr('id', 'item_cb_' + i);
                $(menu_item).find(':checkbox').attr('pos', i);
                $(menu_item).find(':checkbox').attr('tab', tab);
                $('.btn').css('visibility','visible');

                if (this.offer.data[tab][i].checked == 'true') {
                    $(menu_item).find(':checkbox').prop('checked', true);
                    if(that.published)
                        isEditable = false;
                }else{
                    isEditable = true;
                }

                $(menu_item).find(':checkbox').on('change', this, function (ev) {
                    ev.data.changed = true;
                });

                $(menu_item).find('.item_title').attr('contenteditable', isEditable);

                if(this.offer.data[tab][i].title){
                    $(menu_item).find('.item_title').attr('data-translate', this.offer.data[tab][i].title);
                }

                $(menu_item).find('.item_price').attr('contenteditable', isEditable);
                $(menu_item).find('.item_price').text(this.offer.data[tab][i].price);

                $(menu_item).find('.item_content').attr('id', 'content_' + tab + '_' + i);
                $(menu_item).find('.item_title').attr('data-target','#content_' + tab + '_' + i);
                $(menu_item).find('.item_title').attr('contenteditable', 'true');

                $(menu_item).find('.content_text').attr('contenteditable', 'true');
                $(menu_item).find('.content_text').attr('data-translate',this.offer.data[tab][i].content);
                if(this.offer.data[tab][i].content)
                    $(menu_item).find('.content_text').css('visibility','visible');
                if(this.offer.data[tab][i].width)
                    $(menu_item).find('.content_text').css('width',(this.offer.data[tab][i].width/this.offer.data[tab][i].parent.width)*100+'%');

                $(menu_item).find('.content_text').css('left',this.offer.data[tab][i].position.left);

                if(this.offer.data[tab][i].img) {
                    $(menu_item).find('.img-fluid').css('visibility', 'visible');
                    $(menu_item).find('.img-fluid').attr('src', this.offer.data[tab][i].img.src);
                    $(menu_item).find('.img-fluid').css('left',!this.offer.data[tab][i].img.left?0:(this.offer.data[tab][i].img.left/this.offer.data[tab][i].parent.width)*100+'%');
                    $(menu_item).find('.img-fluid').css('top', !this.offer.data[tab][i].img.top?0:this.offer.data[tab][i].img.top);

                    $(menu_item).find('.img-fluid').draggable({ containment: '#content_' + tab + '_' + i, scroll: false });
                }

                $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);

                let pl = this.offer.data[tab][i].packlist;
                for(let i in pl){
                    if(!i)
                        continue;
                    let data = pl[i];
                    $(menu_item).find('.pack_container').css('visibility','visible');
                    $(menu_item).find('.pack_list').append("<li href='#'><a role='packitem' >" + i + "</a></li>");
                    $(menu_item).find('.item_pack').text(i);
                    $(menu_item).find('.caret').css('visibility', 'visible');
                    $(menu_item).find('.pack_list').addClass('dropdown-menu');
                    $(menu_item).find('.item_pack').attr('data-toggle','dropdown');
                    //$(menu_item).find('.item_pack').addClass('dropdown-toggle');
                    $(menu_item).find('.item_pack').attr('pack',i);

                    $(menu_item).find('.item_pack').on('focusout',that,function(ev){
                        let that = ev.data;
                        let pack = $(menu_item).find('.item_pack').attr('pack');
                        if($(this).text()==='') {
                            $(menu_item).find('a:contains(' + pack + ')').remove();
                            let pl = JSON.parse($(menu_item).find('.item_pack').attr('packlist'));
                            delete pl[pack];
                            $(this).attr('packlist', JSON.stringify(pl));
                        }
                        $(menu_item).find('.add_pack').css('visibility', 'hidden');
                    });

                    $(menu_item).find('.item_price').text(data);
                    $(menu_item).find('.item_price').on('focusout',that, function (ev) {
                        $(menu_item).find('.add_pack').css('visibility', 'hidden');
                    });
                }
                $(menu_item).find('.item_pack').attr('packlist',JSON.stringify(this.offer.data[tab][i].packlist));

                $(menu_item).find('.item_pack').on('focusin', that,(ev)=> {
                    $(menu_item).find('.add_pack').css('visibility', 'visible');
                    $(this).focus();
                });
                $(menu_item).find('.item_price').on('focusin', that,(ev)=> {
                    $(menu_item).find('.add_pack').css('visibility', 'visible');
                    $(this).focus();
                });

                $(menu_item).find('.add_pack').attr('id', 'pack_' + tab + '_' + i);

                $(menu_item).find('.add_pack').on('click', {mi:$(menu_item),that:this}, this.OnClickAddPack);

                $(menu_item).find('.rem_pack').on('click', function (ev) {

                    let list = $(this).closest('.row').siblings('.pack_container').find('.pack_list');
                    list[0].removeChild(list[0].childNodes[list[0].childNodes.length-1]);
                    let pl = $(menu_item).find('.item_pack').attr('packlist');
                    if(pl)
                        pl = JSON.parse(pl);
                    pl.pop();
                    $(menu_item).find('.item_pack').attr('packlist',JSON.stringify(pl));
                });

                $(menu_item).find('.gallery').attr('id', 'gallery_' + tab + '_' + i);

                $.each(this.offer.data[tab][i].cert, function (i, data) {
                    let img = new Image();
                    img.src = data.src;
                    //$(img).offset(data.pos);TODO:
                    img.height = '50';
                    $(menu_item).find('.gallery').append(img);
                    $(img).on('click', that.onClickCert);
                    that.MakeDraggable(img);
                });

                $('#' + tab).append(menu_item);//добавить продукт в закладку

                //$(tmplt).insertAfter('#offer_editor');

                if ($(menu_item).find('.item_content').css('display') == 'block'
                    && $(menu_item).find('.img-fluid').attr('src')===''
                    && $(menu_item).find('.content_text').text()===""){
                    $(menu_item).find('.item_content').slideToggle("fast");
                }

                $(menu_item).find('.content_text').draggable({ containment: '#content_' + tab + '_' + i, scroll: false });


                $(menu_item).find('.add_picture').attr('id', 'ap_' + tab + '_' + i);
                $(menu_item).find('.add_picture').on('click',this,function (ev) {
                    let menu_item = $(this).closest('.menu_item');
                    let vis = $(menu_item).find('.img-fluid').css('visibility');
                    if (vis === 'visible'){
                        $(menu_item).find('.img-fluid').css('visibility','hidden');
                    }else {
                        ev.target = $(menu_item).find('.img-fluid')[0];
                        that.OnClickImport(ev);
                        $(menu_item).find('.toolbar').insertAfter($(menu_item).find('.item_content'));
                    }
                });

                $(menu_item).find('.add_content').on('click touchstart',menu_item,function (ev) {
                    let menu_item = $(ev.data);
                    $(menu_item).find('.item_content').slideDown("slow");
                    let vis = $(this).closest('.menu_item').find('.content_text').css('visibility');
                    if (vis === 'visible'){
                        vis = 'hidden';
                    }else{
                        vis='visible';
                    }

                    $(menu_item).find('.content_text').css('visibility',vis);
                    $(menu_item).find('.content_text').focus();
                });

                $(menu_item).find('.add_cert').attr('id', 'ac_' + tab + '_' + i);
                $(menu_item).find('.add_cert').on('click',this,function (ev) {
                    let menu_item = $(this).closest('.menu_item');
                    ev.target = $(menu_item).find('.gallery')[0];
                    that.OnClickAddCert(ev);
                    $(menu_item).find('.toolbar').insertAfter($(menu_item).find('.item_content'));
                });

                $(menu_item).find('.toolbar').css('display', 'block');

                $(menu_item).find('.orders').attr('id', 'orders' + tab + '_' + i);
                $(menu_item).find('.order_ctrl').attr('data-toggle','collapse');
                $(menu_item).find('.order_ctrl').attr('data-target', '#orders' + tab + '_' + i)

                $(menu_item).find('.tablesorter').attr('id', 'ordtable_' + this.offer.data[tab][i].title);

                $(menu_item).find('li>a[role=packitem]').on('click',{that:that, mi:$(menu_item)}, that.OnClickPack);

            }

            $('[href="#'+tab+'"]').on('show.bs.tab',function (ev) {
                if(ev.relatedTarget) {
                    //let items = that.getTabItems($(ev.relatedTarget).text(), window.sets.lang);
                    //window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, 'published');
                }
            });

            $('[href="#'+tab+'"]').on('hide.bs.tab',function (ev) {
                if(event.target) {
                    //let items = that.getTabItems($(ev.target).text(), window.sets.lang);
                    //window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, this.status);
                }
            });
        }

        $($('.tab_inserted a')[0]).tab('show');

        if(window.user.date=== moment().format('YYYY-MM-DD')){
            $('.notoday').removeClass('notoday');
        }

        window.db.GetSupOrders(date, window.user.uid, function (res) {

            $.each(res, function (i, item) {

               let data = res[i].data;
               let inv_period = '', inv_qnty = '', tr_disabled='',tr_style = '';
               if(res[i].period!==that.offer.period){
                   inv_period = "style='color:red'";
               }
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
                        $('.item_title[data-translate=' + kAr[k] + ']').closest('.row').find('.order_ctrl').css('visibility', 'visible');
                        $('.item_title[data-translate=' + kAr[k] + ']').closest('.row').find('.order_amnt').css('visibility', 'visible');
                        $('.item_title[data-translate=' + kAr[k] + ']').closest('.row').find('.order_amnt').text(data[kAr[k]].qnty);
                        if(data[kAr[k]].status==='deleted') {//deleted
                            inv_qnty = "title='deleted' style='color:red'";
                            tr_style =  "color:red";
                            tr_disabled = "disabled";
                        }

                        let price = $('.item_title[data-translate=' + kAr[k] + ']').closest('.row').find('.item_price').text();
                        let inv_price="";
                        if(data[kAr[k]].price!==price){
                            inv_price = "style='color:red'";
                        }

                        //if published:
                        // $('.item_title[data-translate=' + kAr[k] + ']').attr('contenteditable','false');
                        // $('.item_title[data-translate=' + kAr[k] + ']').closest('.menu_item').find('.input').attr('contenteditable','false');
                        // $('.item_title[data-translate=' + kAr[k] + ']').closest('.row').find(':checkbox').attr('disabled','');
                        $("<tr style='text-align: center;"+tr_style+"' "+tr_disabled+">" +
                            "<td class='tablesorter-no-sort'>"+
                                "<label  class='btn'>" +
                                "<input type='checkbox' class='checkbox-inline approve' title='"+kAr[k]+"' orderdate='"+res[i].date +"' cusuid=" + res[i].cusuid + " style='display: none'>" +
                                "<i class='fa fa-square-o fa-2x' style='position:relative; color: #7ff0ff; top:-10px;'></i>" +
                                "<i class='fa fa-check-square-o fa-2x' style='position:relative; color: #7ff0ff; top:-10px;'></i>" +
                                "</label>" +
                            "</td>" +
                            "<td "+ inv_qnty+">"  + data[kAr[k]].qnty + "</td>" +
                            "<td>" + data[kAr[k]].pack + "</td>" +
                            "<td "+inv_price+">" + data[kAr[k]].price + "</td>" +
                            "<td>" + res[i].address + "</td>" +
                            "<td>" + parseInt(dist) + "</td>" +
                            "<td "+inv_period+">" + res[i].period + "</td>" +
                            "<td class='tablesorter-no-sort'>"+
                            (res[i].comment?"<span class='tacomment'>" + res[i].comment + "</span>":'') +
                            "</td>"+
                            "<td>" +
                                // "<script src=\"https://nedol.ru/rtc/common.js\"></script>" +
                                // "<script src=\"https://nedol.ru/rtc/host.js\"></script>" +
                                // "<script src=\"https://nedol.ru/rtc/loader.js\"></script>" +
                                // "<object   abonent=\"nedol@narod.ru\" components=\"audio browser video\"></object>" +
                            "</td>" +
                            "<td>" +"0"+ "</td>" +

                            "<td class='tablesorter-no-sort notoday' >" +
                                "<label  class=\"btn\">" +
                                "<input type=\"checkbox\" class=\"checkbox-inline complete\">" +
                                "<i class=\"fa fa-square-o fa-2x\"></i>" +
                                "<i class=\"fa fa-check-square-o fa-2x\"></i>" +
                                "</label>" +
                            "</td>" +
                            "</tr>").appendTo($('.item_title[data-translate=' + kAr[k] + ']').closest('.row').siblings('.orders').css('visibility','visible').find('tbody'));

                            window.db.GetApproved(date, window.user.uid,res[i].cusuid, kAr[k],function (appr) {
                                if(appr && appr.data.qnty===res[i].data[kAr[k]].qnty &&
                                    appr.data.price===res[i].data[kAr[k]].price) {
                                    $(".approve[title='" + kAr[k] + "'][cusuid=" + res[i].cusuid + "]").attr('checked', 'checked');
                                    $(".approve[title='" + kAr[k] + "'][cusuid=" + res[i].cusuid + "]").attr('disabled', 'true');
                                }
                            });

                            setTimeout(function () {
                                let pagerOptions = {
                                    // target the pager markup - see the HTML block below
                                    container: $(".pager"),
                                    ajaxUrl: null,
                                    customAjaxUrl: function(table, url) { return url; },
                                    ajaxError: null,
                                    ajaxObject: { dataType: 'json' },
                                    ajaxProcessing: null,
                                    processAjaxOnInit: true,
                                    output: '{startRow:input} – {endRow} / {totalRows} rows',
                                    updateArrows: true,
                                    page: 0,
                                    size: 10,
                                    savePages : true,
                                    storageKey:'tablesorter-pager',
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
                                $('#ordtable_'+ kAr[k]).tablesorter({
                                    theme: 'blue',
                                    widgets: ['zebra', 'column'],
                                    usNumberFormat: false,
                                    sortReset: true,
                                    sortRestart: true,
                                    sortInitialOrder: 'desc',
                                    widthFixed: true
                                })
                                //.tablesorterPager(pagerOptions);
                            },1000);

                    }



                })
                    .catch(function (error) {
                        // ops, mom don't buy it
                        console.log(error.message);
                    });
            });
        });

        //
        this.lang = window.sets.lang;
        window.dict.set_lang(window.sets.lang,$("#offer_editor"));

        $('.content_text').resizable();

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
        $("#offer_editor").find('.publish_offer_ctrl').on('click touchstart',this,function (ev) {
            window.user.PublishOffer(ev.data.GetOfferItems(ev.data.lang,true)['remote'],date, ev.data.location, function (obj) {

            });
        });

        $("#offer_editor").find('.show_orders_ctrl').off('click touchstart');
        $("#offer_editor").find('.show_orders_ctrl').on('click touchstart',this,function (ev) {
            window.db.GetSupOrders(date,window.user.uid,function (objs) {
                let orderViewer = new OrderViewer();
                orderViewer.OpenOrderCustomers(objs);
            });
        });

        $('.close_browser').off('click touchstart');
        $('.close_browser').on('click touchstart', this,  that.CloseMenu);

        that.MakeDraggable($("#offer_editor"));

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

        $(menu_item).find('.item_pack').attr('data-toggle','dropdown');
        $(menu_item).find('.pack_list').addClass('dropdown-menu');
        $(menu_item).find('.caret').css('visibility', 'visible');

        $(menu_item).find('li>a[role=packitem]').on('click', {
            that: that,
            mi: $(menu_item)
        }, that.OnClickPack);

        $(menu_item).find('.item_pack').attr('packlist', JSON.stringify(pl));
        $(menu_item).find('.item_pack').text('');
        $(menu_item).find('.item_price').text('');

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
        let text = $('div[data-translate="3e68ad9b7ced9994b62721c5af7c5fbc"]').text();
        let addr = prompt(text);
        if(addr) {
            $(ev.target).attr('src', addr);
        }else{
            $('input.file').attr('func_el', JSON.stringify({func:'load_img',id:$(ev.target).attr('id')}));
            $('input.file').trigger('click');
        }

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
                            let k = 200/$("#" + el.id).height();
                            utils.createThumb($("#" + el.id)[0], $("#" + el.id).width()*k, $("#" + el.id).height()*k, function (thmb) {
                                thumb = true;
                                $("#" + el.id).attr('src', thmb.src);
                            });
                        }
                        that.MakeDraggable(this);
                    });
                }else if(el.func==='add_cert') {
                    let img  = new Image();//'<img src="'+data+'" height="50" >';
                    img.class = 'cert';
                    img.src = data;
                    img.height = '50';
                    $("#" + el.id).append(img);
                    $(img).on('click',that.onClickCert);
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

        let that = ev.data;

        // if($('.menu_item').length>=parseInt($('#items_limit').val())) {
        //    return true;
        // }

        ev.data.changed = true;

        let tab = $('.nav-tabs').find('li.active').find('a').attr('href');
        if(!tab)
            return;

        ev.preventDefault(); // avoid to execute the actual submit of the form.
        ev.stopPropagation();

        var pos = $('.menu_item').length;
        let tmplt = $('#menu_item_tmplt').clone();
        $('#menu_item_tmplt').attr('id', 'menu_item_'+ pos);
        let menu_item = $('#menu_item_'+ pos);
        $(menu_item).attr("class",'menu_item');
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
        let that = this;
        let offerObj = {local:{}, remote:{}};
        that.arCat = [];

        $('.item_title').trigger('click');

        $('.div_tab_inserted').each(function (index, val) {

            $(val).addClass('active');
            let tab = $(val).attr('id');
            let value = $('a[href="#'+tab+'"]').text();
            let cat;
            if(value) {
                cat = $('.category[title='+value+']').attr('id');
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

            let checked = $(this).find('.menu_item').find(':checkbox').prop('checked');

            let miAr = $(this).find('.menu_item');
            offerObj['local'][value] = [];
            offerObj['remote'][value] = [];

            for (let i = 0; i < miAr.length; i++) {

                let item = {};
                item.checked = JSON.stringify($(miAr[i]).find(':checkbox').prop('checked'));

                let title = $(miAr[i]).find('.item_title');
                let key = $(title).attr('data-translate');
                let text = $(miAr[i]).find('.item_title').text();

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
                    let pos = $(cont_text).position();
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
                    item.content = key;
                    item.width = w;
                    item.height = h;
                    item.position = pos;
                    item.offset = ofs;

                }else{
                    if(item.content)
                        delete item.content;
                }

                if($(miAr[i]).find('.img-fluid').css('visibility')==='visible') {
                    item.img = {src:$(miAr[i]).find('.img-fluid').attr('src')};

                    item.img.left  = parseInt($(miAr[i]).find('.img-fluid').css('left'));
                    item.img.top = parseInt($(miAr[i]).find('.img-fluid').css('top'));

                    item.img.position = $(miAr[i]).find('.img-fluid').position();
                    item.img.offset = $(miAr[i]).find('.img-fluid').offset();
                }else {
                    delete item.img;
                }

                item.parent = {
                    width:$(miAr[i]).width(),
                    height:$(miAr[i]).height(),
                    position:$(miAr[i]).position(),
                    offset:$(miAr[i]).offset()
                };

                item.packlist = $(miAr[i]).find('.item_pack').attr('packlist');
                if(item.packlist) {
                    item.packlist = JSON.parse(item.packlist);
                }else{
                    item.price = $(miAr[i]).find('.item_price').text();
                    if(!item.price)
                        continue;
                }

                item.cert = [];
                $.each($(miAr[i]).find('.gallery').children(), function (i, el) {
                    item.cert.push({src:el.src,pos:$(el).position()});
                });

                $.each($(miAr[i]).find('.orders').find('input:checkbox:checked'), function (i, el) {
                    window.db.GetOrder(window.user.date, window.user.uid, $(el).attr('cusuid'),function (obj) {
                        window.user.ApproveOrder(obj);
                    });
                });

                offerObj['local'][value].push(item);
                offerObj['local'].parent
                if(item.checked==='true') {
                    offerObj['remote'][value].push(item);
                }
            }

        });

        return offerObj;
    }

    SaveOffer(ev, lang) {

        let ind = $("li.tab_inserted.active").val();
        let active = $($("li.active").find('a')[ind]).text();
        let items  = this.GetOfferItems(lang,ind);
        // if(active) {
        //     items = this.getTabItems(active, lang);
        // }
        window.user.UpdateOfferLocal(active, items['local'], this.location, window.dict.dict);
        return items;
    }

    CloseMenu(ev) {
        let that = ev.data;
        //if(ev.data.changed)
        let items = that.SaveOffer(ev,window.sets.lang);

        if(that.changed) {
            if ($('.menu_item').find('input:checked').length > 0 && window.user.ValidateOffer(items['remote'])) {
                window.user.PublishOffer(items['remote'], window.user.date, ev.data.location, function (obj) {
                    window.user.offer.stobj = obj;
                });
            }
        }

        $("#offer_editor").css('display','none');

        $("#offer_editor").find('.tab-pane').empty();

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



}



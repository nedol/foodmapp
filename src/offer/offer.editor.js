'use strict'
export {OfferEditor}


require('bootstrap/js/modal.js');
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

let utils = new Utils();

class OfferEditor{


    constructor(obj, date){

        this.changed = false;

        this.obj;
        this.status;


        this.arCat = [];
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

    OpenOffer() {

        let that = this;
        let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        this.offer =  window.user.offer.stobj;
        this.location = window.user.offer.stobj.location;

        $('.dropdown').css('visibility','visible');
        $('#order_menu_button').css('visibility','visible');
        $('#add_tab_li').css('visibility','visible');
        $('#add_item').css('visibility','visible');

        let isEditable = true;

        $("#offer_editor").modal({
            show: true,
            keyboard:true
        });

        function selectText(el) {
            $(el).focus();
            document.execCommand('selectAll', false, null);
        }

        $(".content_text").dblclick(function () {
            selectText($(this));
        });
        let str = "Предложение по доставке \r\n"+$('.dt_val')[0].value.split(' ')[0]+" \r\n("+$('.sel_time').text()+")";
        $("#offer_editor").find('.modal-title').text(str);
        if(that.offer.published)
            $("#offer_editor").find('.offer_status').text('Опубликовано:\r\n'+that.offer.published);

        $("#offer_editor").off('hide.bs.modal');
        $("#offer_editor").on('hide.bs.modal', this,this.CloseMenu);

        this.lang = window.sets.lang;
        window.sysdict.set_lang(window.sets.lang,$("#menu_item_tmplt"));
        window.sysdict.set_lang(window.sets.lang,$("#offer_editor"));

        $('#add_item').css('display', 'block');
        $('#add_tab_li').css('display','block');

        for (let tab in this.offer.data) {
            if(!tab) continue;

            if($('[href="#'+tab+'"]').length===0) {
                $('<li class="tab_inserted"><a data-toggle="tab"  contenteditable="'+isEditable+'" data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a>' +
                    '</li>').insertBefore($('#add_tab_li'));
                $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted dropdown" style="border: none">' +
                    '</div>').insertBefore($('#add_tab_div'));
            }

            for (let i in this.offer.data[tab]) {
                let tmplt = $('#menu_item_tmplt').clone();
                $('#menu_item_tmplt').attr('id', tab + '_' + i);
                let menu_item = $('#' + tab + '_' + i)[0];
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

                //$(menu_item).find('.content_text').text(urlencode.decode(window.dict.dict[this.menu[tab][i].content][window.sets.lang]));
                $(menu_item).find('.content_text').attr('contenteditable', 'true');
                $(menu_item).find('.content_text').attr('data-translate',this.offer.data[tab][i].content);
                if(this.offer.data[tab][i].content)
                    $(menu_item).find('.content_text').css('visibility','visible');
                if(this.offer.data[tab][i].width)
                    $(menu_item).find('.content_text').css('width',(this.offer.data[tab][i].width));

                if(this.offer.data[tab][i].height)
                    $(menu_item).find('.content_text').css('height',(this.offer.data[tab][i].height));

                if(this.offer.data[tab][i].img) {
                    $(menu_item).find('.img-fluid').css('visibility', 'visible');
                    $(menu_item).find('.img-fluid').attr('src', this.offer.data[tab][i].img.src);
                    $(menu_item).find('.img-fluid').css('left',!this.offer.data[tab][i].img.left?0:this.offer.data[tab][i].img.left);
                    $(menu_item).find('.img-fluid').css('top', !this.offer.data[tab][i].img.top?0:this.offer.data[tab][i].img.top);

                    that.MakeDraggable($(menu_item).find('.img-fluid'));
                }

                $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);

                $.each(this.offer.data[tab][i].packlist, function (i, data) {
                    $(menu_item).find('.pack_list').append("<li href='#'><a role='menuitem' >" + data.pack + " " + data.price + "</a></li>");
                    $(menu_item).find('.item_pack').text(data.pack);
                    $(menu_item).find('.item_pack_price').text(data.price);
                });
                $(menu_item).find('.item_pack').attr('packlist',JSON.stringify(this.offer.data[tab][i].packlist));

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

                $('#' + tab).append(menu_item);

                $(tmplt).insertAfter('#offer_editor');

                if ($(menu_item).find('.item_content').css('display') == 'block'
                    && $(menu_item).find('.img-fluid').attr('src')===''
                    && $(menu_item).find('.content_text').text()===""){
                    $(menu_item).find('.item_content').slideToggle("fast");
                }

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

                $(menu_item).find('.add_pack').attr('id', 'pack_' + tab + '_' + i);
                $(menu_item).find('.add_pack').on('click', function (ev) {
                    let pack = $(this).closest('.row').siblings('.pack_container').find('.item_pack').text();
                    let price = $(this).closest('.row').siblings('.pack_container').find('.item_pack_price').text();
                    $(this).closest('.row').siblings('.pack_container').find('.pack_list').append("<li><a>"+pack+"  "+price+"</a></li>");
                    let pl = $(menu_item).find('.item_pack').attr('packlist');
                    if(pl)
                        pl = JSON.parse(pl);
                    else pl = [];
                    pl.push({pack:pack,price:price});
                    $(menu_item).find('.item_pack').attr('packlist',JSON.stringify(pl));
                });

                $(menu_item).find('.rem_pack').on('click', function (ev) {

                    let list = $(this).closest('.row').siblings('.pack_container').find('.pack_list');
                    list[0].removeChild(list[0].childNodes[list[0].childNodes.length-1]);
                    let pl = $(menu_item).find('.item_pack').attr('packlist');
                    if(pl)
                        pl = JSON.parse(pl);
                    pl.pop();
                    $(menu_item).find('.item_pack').attr('packlist',JSON.stringify(pl));
                });

                $(menu_item).find('.toolbar').css('display', 'block');

                $(menu_item).find('.orders').attr('id', 'orders' + tab + '_' + i);
                $(menu_item).find('.order_ctrl').attr('data-toggle','collapse');
                $(menu_item).find('.order_ctrl').attr('data-target', '#orders' + tab + '_' + i)

                $(menu_item).find('.tablesorter').attr('id', 'ordtable_' + this.offer.data[tab][i].title);

            }

            $('[href="#'+tab+'"]').on('show.bs.tab',function (ev) {
                if(ev.relatedTarget) {
                    let items = that.getTabItems($(ev.relatedTarget).text(), window.sets.lang);
                    window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, 'published');
                }
            });

            $('[href="#'+tab+'"]').on('hide.bs.tab',function (ev) {
                if(event.target) {
                    //let items = that.getTabItems($(ev.target).text(), window.sets.lang);
                    //window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, this.status);
                }
            });
        }

        if(window.user.date=== moment().format('YYYY-MM-DD')){
            $('.notoday').removeClass('notoday');
        }

        window.db.GetOrders(date, window.user.uid, function (res) {

            for (let i in res) {
                let data = res[i].data;
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
                        //if published:
                        // $('.item_title[data-translate=' + kAr[k] + ']').attr('contenteditable','false');
                        // $('.item_title[data-translate=' + kAr[k] + ']').closest('.menu_item').find('.input').attr('contenteditable','false');
                        // $('.item_title[data-translate=' + kAr[k] + ']').closest('.row').find(':checkbox').attr('disabled','');
                        $("<tr style='text-align: center'>" +
                            "<td class='tablesorter-no-sort'>"+
                                "<label  class='btn'>" +
                                "<input type='checkbox' class='checkbox-inline approve' title='"+kAr[k]+"' orderdate='"+res[i].date +"' cusuid=" + res[i].cusuid + " style='display: none'>" +
                                "<i class='fa fa-square-o fa-2x' style='position:relative; color: #7ff0ff; top:-10px;'></i>" +
                                "<i class='fa fa-check-square-o fa-2x' style='position:relative; color: #7ff0ff; top:-10px;'></i>" +
                                "</label>" +
                            "</td>" +
                            "<td>" + data[kAr[k]].qnty + "</td>" +
                            "<td>" + data[kAr[k]].price + "</td>" +
                            "<td>" + res[i].address + "</td>" +
                            "<td>" + parseInt(dist) + "</td>" +
                            "<td>" + res[i].period + "</td>" +
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
            }
        });

        //
        this.lang = window.sets.lang;
        window.dict.set_lang(window.sets.lang,$("#offer_editor"));
        // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');

        // if(!evnts['changed.bs.select']) {
        //     $(sp).on('changed.bs.select', this, this.OnChangeLang);
        // }

        let evnts = $._data($('#add_tab').get(0), "events");
        if(!evnts || !evnts['click'])
            $('#add_tab').on('click', this, this.AddTab);

        evnts = $._data($('#add_item').get(0), "events");
        if(!evnts || !evnts['click']) {
            $('#add_item').on('click', this, this.AddOfferItem);
        }

        $('input:file').change(function(ev) {
            //listFiles(evt);
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

                        // loadImage(
                        //     files[0],
                        //     function (img) {
                        //         $(img).attr('org', data);
                        //         $("#" + el.id).append($(img));
                        //         $(img).on('click',that.onClickCert);
                        //     },
                        //     {maxHeight: 700,maxWidth:1000} // Options
                        // );

                        // let img  = new Image();//'<img src="'+data+'" height="50" >';
                        // img.src = data;
                        // $(img).on('load', function (ev) {
                        //     let thumb = false;
                        //     if (!thumb) {
                        //         let k = 700/$(this).height();
                        //         utils.createThumb(img, $(img).width()*k, $(img).height()*k, function (thmb) {
                        //             thumb = true;
                        //             $(img).attr('src', thmb.src);
                        //         });
                        //     }
                        // });

                    }

                }
            });
        });

        $('.input').click(function (ev) {
            that.changed = true;
        });

        $("#offer_editor").find('.publish_offer_ctrl').off('click touchstart');
        $("#offer_editor").find('.publish_offer_ctrl').on('click touchstart',this,function (ev) {
            window.user.PublishOffer(ev.data.GetOfferItems(ev.data.lang,true)['remote'],date, ev.data.location, function (obj) {

            });
        });

        $("#offer_editor").find('.delete_offer_ctrl').off('click touchstart');
        $("#offer_editor").find('.delete_offer_ctrl').on('click touchstart',this,function (ev) {
            if(confirm($('#delete_offer').text())) {
                window.user.offer.DeleteOffer(date, function (obj) {

                });
            }
        });
    }

    OnClickImport(ev){
        let text = $('div[data-translate="3e68ad9b7ced9994b62721c5af7c5fbc"]').text();
        let addr = prompt(text);
        if(addr) {
            $(ev.target).attr('src', addr);
        }else{
            $('.modal').find('.file').attr('func_el', JSON.stringify({func:'load_img',id:$(ev.target).attr('id')}));
            $('.modal').find('.file').trigger('click');
        }

        this.changed = true;
    }


    OnClickAddCert(ev){
        let text = $('div[data-translate="3e68ad9b7ced9994b62721c5af7c5fbc"]').text();
        let addr = prompt(text);
        if(addr) {
            $(ev.target).attr('src', addr);
        }else{
            $('.modal').find('.file').attr('func_el', JSON.stringify({func:'add_cert',id:$(ev.target).attr('id')}));
            $('.modal').find('.file').trigger('click');
        }

        this.changed = true;
    }

    MakeDraggable(el){
        $(el).draggable({
            start: function () {
                console.log("drag start");
            },
            drag: function () {
                $(el).attr('drag', true);
            },
            stop: function () {
                // var rel_x = parseInt($(el).position().left / window.innerWidth * 100);
                // $(el).css('right', rel_x + '%');
                // var rel_y = parseInt($(el).position().top / window.innerHeight * 100);
                // $(el).css('bottom', rel_y + '%');
            }
        });
    }

    AddTab(ev){

        ev.preventDefault(); // avoid to execute the actual submit of the form.
        ev.stopPropagation();
        let tab = 'tab_'+String($('.tab-pane').length-1);

        ev.data.changed = true;
        let cats ='';
        $(".category[state='1']").each(function (i, cat) {
            let text =  md5(cat.title);
            cats +='<a href="#" cat="'+cat.id+'" onclick="OnClickCat(this,)"' +
                 //'$(this).parent().parent().find("a[data-toggle=tab]").text($(this).text());'+
                 //+'$(this).parent().parent().find("a[data-toggle=tab]").attr("href","'+cat.id+'");' +
                 '>'+cat.title+'</a>';
        });

        $('<li class="tab_inserted  dropdown"><a data-toggle="tab" contenteditable="true" data-translate="'+md5(tab)+'"  href="#'+tab+'"></a>' +
                '<div class="dropdown-content">'+
                    cats+
                '</div>'+
            '</li>').insertBefore($('#add_tab_li'));

        $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted" style="border: none">'+
            '</div>').insertBefore($('#add_tab_div'));

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
        $(menu_item).find('.add_picture').on('click',menu_item,function (ev) {
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

        $(tab).append(menu_item[0]);

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
            let time = $('.sel_time').text();
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

    getTabItems(tab,lang,active){
        let that = this;
        let offerObj = {};
        that.arCat = [];

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
        }

        let checked = $(this).find('.menu_item').find(':checkbox').prop('checked');
        if (!checked && active) {
            delete that.arCat[parseInt(cat)];
        } else {
            let miAr = $('#'+tab).find('.menu_item');
            offerObj[value] = [];

            for (let i = 0; i < miAr.length; i++) {
                let item = {};
                item.checked = JSON.stringify($(miAr[i]).find(':checkbox').prop('checked'));
                if(active && item.checked==='false'){
                    continue; //active only
                }
                let title = $(miAr[i]).find('.item_title');
                let hash = $(title).attr('data-translate');
                let text = $(miAr[i]).find('.item_title').text();

                if (text.length === 0 || !text.trim())
                    continue;
                if(!window.dict.dict[hash]) {
                    window.dict.dict[hash] = {};
                }
                if (text !== window.dict.dict[hash][lang]) {
                    let obj = Object.assign({},window.dict.dict[hash]);
                    delete window.dict.dict[hash];
                    hash = md5(text);
                    window.dict.dict[hash] = obj;
                    window.dict.dict[hash][lang] = text;
                    $(title).attr('data-translate',hash);
                }
                item.title = hash;
                item.price = $(miAr[i]).find('.item_price').text();

                if($(miAr[i]).find('.content_text').css('visibility')==='visible') {
                    let cont_text = $(miAr[i]).find('.content_text');
                    let w = $(cont_text).width();
                    let h = $(cont_text).height();
                    hash = $(cont_text).attr('data-translate');
                    text = $(cont_text).val().replace(/'/g,'%27').replace(/\n/g,'%0D').replace(/"/g,'%22');
                    if(!window.dict.dict[hash]) {
                        window.dict.dict[hash] = {};
                    }
                    if (text !== window.dict.dict[hash][lang]) {
                        let obj = Object.assign({},window.dict.dict[hash]);
                        //delete window.dict.dict[hash];
                        hash = md5(text);
                        window.dict.dict[hash] = obj;
                        window.dict.dict[hash][lang] = text;
                        $(cont_text).attr('data-translate',hash);
                    }
                    item.content = hash;
                    item.width = w;
                    item.height = h;
                }else{
                    if(item.content)
                        delete item.content;
                }

                if($(miAr[i]).find('.img-fluid').css('visibility')==='visible') {
                    item.img = {src:$(miAr[i]).find('.img-fluid').attr('src')};
                    if(parseInt($(miAr[i]).find('.img-fluid').css('left'))!==0)
                        item.img.left  = $(miAr[i]).find('.img-fluid').css('left');
                    if(parseInt($(miAr[i]).find('.img-fluid').css('top'))!==0)
                        item.img.top = $(miAr[i]).find('.img-fluid').css('top');// / window.innerHeight * 100))+'%';

                }else {
                    delete item.img;
                }

                $.each($(miAr[i]).find('.orders').find('input:checked'), function (i, el) {
                    window.user.ApproveOrder({
                        title: item.title,
                        date:window.user.date,
                        period:$('.sel_time'),
                        supuid:window.user.uid,
                        cusuid:$(el).attr('cusuid')
                    });
                });

                offerObj[value].push(item);
            }
        }

        return offerObj;
    }

    GetOfferItems(lang){
        let that = this;
        let offerObj = {local:{}, remote:{}};
        that.arCat = [];

        $('.div_tab_inserted').each(function (index, val) {

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

                item.price = $(miAr[i]).find('.item_price').text();
                if(!item.price)
                    continue;


                if($(miAr[i]).find('.content_text').css('visibility')==='visible') {
                    let cont_text = $(miAr[i]).find('.content_text');
                    let w = $(cont_text).width();
                    let h = $(cont_text).height();
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
                }else{
                    if(item.content)
                        delete item.content;
                }

                if($(miAr[i]).find('.img-fluid').css('visibility')==='visible') {
                    item.img = {src:$(miAr[i]).find('.img-fluid').attr('src')};
                    if(parseInt($(miAr[i]).find('.img-fluid').css('left'))!==0)
                        item.img.left  = $(miAr[i]).find('.img-fluid').css('left');
                    if(parseInt($(miAr[i]).find('.img-fluid').css('top'))!==0)
                        item.img.top = $(miAr[i]).find('.img-fluid').css('top');// / window.innerHeight * 100))+'%';
                }else {
                    delete item.img;
                }

                item.packlist = $(miAr[i]).find('.item_pack').attr('packlist');
                if(item.packlist)
                    item.packlist = JSON.parse(item.packlist);

                item.cert = [];
                $.each($(miAr[i]).find('.gallery').children(), function (i, el) {
                    item.cert.push({src:el.src,pos:$(el).position()});
                });

                $.each($(miAr[i]).find('.orders').find('input:checked'), function (i, el) {
                    window.db.GetOrder(window.user.date, window.user.uid, $(el).attr('cusuid'),function (obj) {
                        window.user.ApproveOrder(obj);
                    });
                });

                offerObj['local'][value].push(item);
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

        $("#offer_editor").find('.tab-pane').empty();

        $("#offer_editor").off('hide.bs.modal');
        $('.item_title').off('click');
        //$('#add_item').off('click',this.AddOfferItem);
        //$('.modal-body').find('.add_tab').off('click', this.AddTab);
        $('.div_tab_inserted').remove();
        $('.tab_inserted').remove();
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



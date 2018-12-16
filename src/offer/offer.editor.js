'use strict'
export {OfferEditor}

var urlencode = require('urlencode');
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
        this.location;

        this.period;

        this.arCat = [];

        this.active_class = 'w3-border w3-border-grey w3-round-large';
    }


    OpenOffer() {

        let that = this;
        let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        this.offer = window.user.store[date].data;
        this.status = window.user.store[date].status;
        this.location = window.user.store[date].location;

        $('.dropdown').css('visibility','visible');
        $('#order_menu_button').css('visibility','visible');
        $('#add_tab_li').css('visibility','visible');
        $('#add_item').css('visibility','visible');

        let isEditable = true;

        $("#offer_editor").modal({
            show: true,
            keyboard:true
        });

        this.lang = window.sets.lang;
        window.dict.set_lang(window.sets.lang,$("#menu_item_tmplt"));

        function selectText(el) {
            $(el).focus();
            document.execCommand('selectAll', false, null);
        }

        $(".content_text").dblclick(function () {
            selectText($(this));
        });

        $("#offer_editor").find('.modal-title').text("Menu for ");
        $("#offer_editor").find('.modal-title').attr('data-translate', md5('Menu for'));
        $("#offer_editor").find('.modal-title-date').text($('.dt_val')[0].value.split(' ')[0]);
        $("#offer_editor").off('hide.bs.modal');
        $("#offer_editor").on('hide.bs.modal', this,this.CloseMenu);

        $('#add_item').css('display', 'block');
        $('#add_tab_li').css('display','block');

        for (let tab in this.offer) {
            if(!tab) continue;
            if($('[href="#'+tab+'"]').length===0) {
                $('<li class="tab_inserted"><a data-toggle="tab"  contenteditable="'+isEditable+'" data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a>' +
                    '</li>').insertBefore($('#add_tab_li'));
                $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted dropdown" style="border: none">' +
                    '</div>').insertBefore($('#add_tab_div'));
            }

            for (let i in this.offer[tab]) {
                let tmplt = $('#menu_item_tmplt').clone();
                $('#menu_item_tmplt').attr('id', tab + '_' + i);
                let menu_item = $('#' + tab + '_' + i)[0];
                $(menu_item).attr("class", 'menu_item');
                $(menu_item).css('display', 'block');

                $(menu_item).find(':checkbox').attr('id', 'item_cb_' + i);
                $(menu_item).find(':checkbox').attr('pos', i);
                $(menu_item).find(':checkbox').attr('tab', tab);
                $('.btn').css('visibility','visible');


                if (this.offer[tab][i].checked == 'true') {
                    $(menu_item).find(':checkbox').prop('checked', true);
                    if(that.status==='published')
                        isEditable = false;
                }else{
                    isEditable = true;
                }

                $(menu_item).find(':checkbox').on('change', this, function (ev) {
                    ev.data.changed = true;
                });

                $(menu_item).find('.item_title').attr('contenteditable', isEditable);

                if(this.offer[tab][i].title){

                    $(menu_item).find('.item_title').attr('data-translate', this.offer[tab][i].title);
                }

                $(menu_item).find('.item_price').attr('contenteditable', isEditable);
                $(menu_item).find('.item_price').text(this.offer[tab][i].price);

                $(menu_item).find('.item_content').attr('id', 'content_' + tab + '_' + i);
                $(menu_item).find('.item_title').attr('data-target','#content_' + tab + '_' + i);

                //$(menu_item).find('.content_text').text(urlencode.decode(window.dict.dict[this.menu[tab][i].content][window.sets.lang]));
                $(menu_item).find('.content_text').attr('contenteditable', 'true');
                $(menu_item).find('.content_text').attr('data-translate',this.offer[tab][i].content);
                if(this.offer[tab][i].content)
                    $(menu_item).find('.content_text').css('visibility','visible');
                if(this.offer[tab][i].width)
                    $(menu_item).find('.content_text').css('width',(this.offer[tab][i].width));

                if(this.offer[tab][i].height)
                    $(menu_item).find('.content_text').css('height',(this.offer[tab][i].height));

                $(menu_item).find('.content_text').on('dblclick', function (ev) {
                    let img = $(menu_item).find('.img-fluid')[0];
                    let img_os = $(menu_item).find('.img-fluid').offset();
                    return;//TODO
                    if(ev.offsetX <  img_os.left+img.width && ev.offsetX > img_os.left &&
                        ev.offsetY < img_os.top+img.height && ev.offsetY > img_os.top )
                        $(menu_item).find('.img-fluid').trigger(ev);
                });

                if(this.offer[tab][i].img) {
                    $(menu_item).find('.img-fluid').css('visibility', 'visible');
                    $(menu_item).find('.img-fluid').attr('src', this.offer[tab][i].img);
                    $(menu_item).find('.img-fluid').css('left',!this.offer[tab][i].img_left?0:this.offer[tab][i].img_left);
                    $(menu_item).find('.img-fluid').css('top', !this.offer[tab][i].img_top?0:this.offer[tab][i].img_top);

                    that.MakeDraggable($(menu_item).find('.img-fluid'));
                }

                $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);

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

                $(menu_item).find('.toolbar').css('display', 'block');

                $(menu_item).find('.orders').attr('id', 'orders' + tab + '_' + i);
                $(menu_item).find('.order_ctrl').attr('data-toggle','collapse');
                $(menu_item).find('.order_ctrl').attr('data-target', '#orders' + tab + '_' + i)

                $(menu_item).find('.tablesorter').attr('id', 'ordtable_' + this.offer[tab][i].title);

            }

            $('[href="#'+tab+'"]').on('show.bs.tab',function (ev) {
                if(ev.relatedTarget) {
                    let items = that.getTabItems($(ev.relatedTarget).text(), window.sets.lang);
                    window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, this.status);
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




        if(this.status==='published' || this.status==='approved') {

            window.db.GetOrders(date, window.user.email, function (res) {

                for (let i in res) {
                    let data = JSON.parse(res[i].data);
                    let kAr = Object.keys(data);
                    let calcDistance = new Promise(
                        function (resolve, reject) {
                            if (!that.location)
                                resolve('undefined');
                            window.user.map.geo.GetDistanceToPlace(that.location, res[i].address, function (res) {
                                if (res) {
                                    resolve(res);
                                } else {
                                    var reason = 'undefined';
                                    reject(reason);
                                }
                            });
                        }
                    );
                    calcDistance.then(function (dist) {
                        for (let k in kAr) {

                            let checked = res[i].status === 'approved' ? 'checked' : '';
                            let cbdisabled='';
                            if(res[i].status==='approved')
                                cbdisabled = 'disabled';
                            $('.item_title[data-translate=' + kAr[k] + ']').siblings('.order_ctrl').css('visibility', 'visible');
                            $("<tr>" +
                                "<td class='tablesorter-no-sort'>"+
                                    "<label  class=\"btn\">" +
                                    "<input type=\"checkbox\" class=\"checkbox-inline\" "+cbdisabled+" cusem=" + res[i].cusem + " " + checked + " style=\"display: none\">" +
                                    "<i class=\"fa fa-square-o fa-2x\"></i>" +
                                    "<i class=\"fa fa-check-square-o fa-2x\"></i>" +
                                    "</label>" +
                                "</td>" +
                                "<td>" + data[kAr[k]].qnty + "</td>" +
                                "<td>" + res[i].address + "</td>" +
                                "<td>" + parseInt(dist) + "</td>" +
                                "<td>" + res[i].period + "</td>" +
                                "<td class='tablesorter-no-sort'>"+
                                (data.comment?"<span class='tacomment'>" + data.comment + "</span>":'') +
                                "</td>"+
                                "<td>" +"0"+ "</td>" +

                                "<td class='tablesorter-no-sort notoday' >" +
                                    "<label  class=\"btn\">" +
                                    "<input type=\"checkbox\" class=\"checkbox-inline\">" +
                                    "<i class=\"fa fa-square-o fa-2x\"></i>" +
                                    "<i class=\"fa fa-check-square-o fa-2x\"></i>" +
                                    "</label>" +
                                "</td>" +
                                "</tr>").appendTo($('.item_title[data-translate=' + kAr[k] + ']').closest('.row').siblings('.orders').css('visibility','visible').find('tbody'));

                                setTimeout(function () {

                                    $('#ordtable_'+ kAr[k]).tablesorter({
                                        theme: 'blue',
                                        widgets: ['zebra', 'column'],
                                        usNumberFormat: false,
                                        sortReset: true,
                                        sortRestart: true,
                                        sortInitialOrder: 'desc'
                                    });

                                },1000);
                        }
                    })
                        .catch(function (error) {
                            // ops, mom don't buy it
                            console.log(error.message);
                        });
                }
            });
        }

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
        if(!evnts || !evnts['click'])
            $('#add_item').on('click', this, this.AddOfferItem);

        $('input:file').change(function(ev) {
            //listFiles(evt);
            let  files = $("input[type='file']")[0].files;
            let el = $(ev.target).attr('el_id');
            utils.HandleFileSelect(ev, files, el, function (data, el, smt) {
                if(data) {
                    $("#" + el).attr('src', data);
                    let thumb = false;
                    $("#" + el).css('visibility','visible');
                    $("#" + el).closest('.menu_item').find('.item_content').slideDown("slow");

                    $("#" + el).on('load', {el:el}, function (ev) {
                        if(!thumb)
                            utils.createThumb($("#" + ev.data.el)[0], $("#" + ev.data.el).width(), $("#" + ev.data.el).height(), el, function (thmb, el) {
                                thumb = true;
                                $("#" + el).attr('src', thmb.src);
                            });

                        that.MakeDraggable(this);
                    })

                }
            });
        });

        $("#offer_editor").find('.publish_offer_ctrl').off('click touchstart');
        $("#offer_editor").find('.publish_offer_ctrl').on('click touchstart',this,function (ev) {
            window.user.PublishOffer(ev.data.GetOfferItems(ev.data.lang,true),date, ev.data.location, function (obj) {
                that.obj = obj;
                that.status = obj[window.user.date].status;
            });
        });

        $("#offer_editor").find('.delete_offer_ctrl').off('click touchstart');
        $("#offer_editor").find('.delete_offer_ctrl').on('click touchstart',this,function (ev) {
            if(confirm($('#delete_offer').text())) {
                window.user.DeleteOffer(date, function (obj) {

                });
            }
        });
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
                var rel_x = parseInt($(el).position().left / window.innerWidth * 100);
                $(el).css('right', rel_x + '%');
                var rel_y = parseInt($(el).position().top / window.innerHeight * 100);
                $(el).css('bottom', rel_y + '%');
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

        $('<li class="tab_inserted  dropdown"><a data-toggle="tab" contenteditable="true" data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a>' +
                '<div class="dropdown-content">'+
                    cats+
                '</div>'+
            '</li>').insertBefore($('#add_tab_li'));

        $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted" style="border: none">'+
            '</div>').insertBefore($('#add_tab_div'));

    }

    AddOfferItem(ev){

        let that = ev.data;

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

        $(menu_item).find('.item_title').text($('#item_title').text());
        let hash = md5(new Date().getTime());
        //window.dict.dict[hash] = {};
        $(menu_item).find('.item_title').attr('data-translate',hash);

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

    OnClickImport(ev){
        let text = $('div[data-translate="3e68ad9b7ced9994b62721c5af7c5fbc"]').text();
        let addr = prompt(text);
        if(addr) {

            $(ev.target).attr('src', addr);
            // $(ev.target).on('load', {el:ev.target}, function (ev) {
            //     createThumb($(ev.data.el)[0], $(ev.data.el).width(), $(ev.data.el).height(), ev.data.img, function (thmb, el) {
            //         $(el).attr('src', thmb.src);
            //         $(el).css('visibility', 'visible');
            //     });
            // })

        }else{
            $('.modal').find('.file').attr('el_id', $(ev.target).attr('id'));
            $('.modal').find('.file').trigger('click');
        }

        this.changed = true;
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
                    item.img = $(miAr[i]).find('.img-fluid').attr('src');
                    if(parseInt($(miAr[i]).find('.img-fluid').position().left)!=0)
                        item.img_left = parseInt($(miAr[i]).find('.img-fluid').position().left);
                    if(parseInt($(miAr[i]).find('.img-fluid').position().top)!=0)
                        item.img_top = parseInt($(miAr[i]).find('.img-fluid').position().top);// / window.innerHeight * 100))+'%';
                }else {
                    delete item.img;
                }

                $.each($(miAr[i]).find('.orders').find('input:checked'), function (i, el) {
                    window.user.UpdateOrderStatus(window.user.date, window.user.email, $(el).attr('cusem'));
                });

                offerObj[value].push(item);
            }
        }

        return offerObj;
    }

    GetOfferItems(lang,active){
        let that = this;
        let offerObj = {};
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
                return;
            }

            let checked = $(this).find('.menu_item').find(':checkbox').prop('checked');

            let miAr = $(this).find('.menu_item');
            offerObj[value] = [];

            for (let i = 0; i < miAr.length; i++) {
                let item = {};
                item.checked = JSON.stringify($(miAr[i]).find(':checkbox').prop('checked'));

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
                    item.img = $(miAr[i]).find('.img-fluid').attr('src');
                    if(parseInt($(miAr[i]).find('.img-fluid').position().left)!=0)
                        item.img_left = parseInt($(miAr[i]).find('.img-fluid').position().left);
                    if(parseInt($(miAr[i]).find('.img-fluid').position().top)!=0)
                        item.img_top = parseInt($(miAr[i]).find('.img-fluid').position().top);// / window.innerHeight * 100))+'%';
                }else {
                    delete item.img;
                }

                $.each($(miAr[i]).find('.orders').find('input:checked'), function (i, el) {
                    window.db.GetOrder(window.user.date, window.user.email, $(el).attr('cusem'),function (obj) {
                        obj.status = 'approved';
                        window.db.SetObject('orderStore', obj, function (res) {
                            let data_obj = {
                                "proj": "d2d",
                                "func": "updateorderstatus",
                                "uid": window.user.uid,
                                "cusem": $(el).attr('cusem'),
                                "supem": window.user.email,
                                "date": window.user.date,
                                "status":  'approved',
                                "lang": window.sets.lang
                            };

                            window.user.network.postRequest(data_obj, function (data) {
                                console.log(data);
                            });
                        });
                    });
                });

                offerObj[value].push(item);
        }

        });

        return offerObj;
    }

    SaveOffer(ev, lang) {

        let active = $("li.tab_inserted.active").text();
        let items  = this.GetOfferItems(lang,active);
        // if(active) {
        //     items = this.getTabItems(active, lang);
        // }
        window.user.UpdateOfferLocal(null, items, this.location, window.dict.dict, this.status);
    }

    CloseMenu(ev) {
        let that = ev.data;
        //if(ev.data.changed)
        that.SaveOffer(ev,window.sets.lang);

        var r = confirm($('#do_publish_offer').text());
        if (r == true) {
            window.user.PublishOffer(ev.data.GetOfferItems(ev.data.lang,true),window.user.date, ev.data.location, function (obj) {
                that.obj = obj;
                that.status = obj[window.user.date].status;
            });
        } else {

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



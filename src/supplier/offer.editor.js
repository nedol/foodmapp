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

// var moment = require('moment');
//
var md5 = require('md5');
var isJSON = require('is-json');

import {Utils} from "../utils/utils";
let utils = new Utils();

class OfferEditor{


    constructor(){

        this.changed = false;

        this.arCat = [];

        this.off_frame = $("#supplier_frame");

    }

    InitSupplierOffer(){
        let that = this;

        this.location = window.user.offer.stobj.location;

        $('#supplier_frame_container').css('display', 'block');

        this.offer = window.user.offer.stobj;
        this.offer.profile = window.user.profile.profile;
        this.offer.uid =  window.user.uid;
        this.offer.dict = window.dict.dict;

        that.off_frame[0].contentWindow.InitSupplierOffer(this.offer);
        // $('#client_frame_container').draggable();
        // $('#client_frame_container').resizable({
        //     aspectRatio: 16 / 9
        // });
    }


    OnClickAddCert(ev){
        let menu_item = ev.mi;
        $(menu_item).find('input.file').attr('func_el', JSON.stringify({func:'add_cert',id:$(ev.target).attr('id')}));
        $(menu_item).find('input.file').trigger('click');

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
                console.log("drag stop");
                // var rel_x = parseInt($(el).position().left / window.innerWidth * 100);
                // $(el).css('right', rel_x + '%');
                // var rel_y = parseInt($(el).position().top / window.innerHeight * 100);
                // $(el).css('bottom', rel_y + '%');
                $(ev.target).remove();

            }
        });
    }

    AddOfferItem(ev){

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

        $(menu_item).find('input:file').on('change', this, that.OnImportImage);

        $(menu_item).find('.add_picture').on('click touchstart',menu_item,function (ev) {
            let menu_item = $(ev.data);
            let vis = $(menu_item).find('.img-fluid').css('visibility');

            ev.target = $(menu_item).find('.img-fluid')[0];
            ev.mi = menu_item;
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

        $('#offer_editor').find('.div_tab_inserted').each((index, val)=> {

            $(val).addClass('active');
            let tab = $(val).attr('id');
            let value = $('a[href="#'+tab+'"]').text();
            let cat;
            if(value) {
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

                let title = $(miAr[i]).find('.item_title');
                let key = $(title).attr('data-translate');
                let text = $(miAr[i]).find('.item_title').val();

                if (text.length === 0 || !text.trim()) {
                    continue;
                }
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
                    text = $(cont_text).val().replace(/'/g,'%27').replace(/\n/g,'%0D').replace(/"/g,'%22');
                    if(!window.dict.dict[key]) {
                        window.dict.dict[key] = {};
                    }
                    if (text !== window.dict.dict[key][lang]) {
                        let obj = Object.assign({},window.dict.dict[key]);
                        delete window.dict.dict[key];
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
                        window.user.ApproveOrder(obj,$(el).attr('title'));
                    });
                });

                cat = $('.category[title="'+value+'"]').attr('id');
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

    SaveOffer(ev, lang) {

        let ind = $("li.tab_inserted.active").val();
        let active = $($("li.active").find('a')[ind]).text();
        let items  = this.GetOfferItems(lang,ind);
        // if(active) {
        //     items = this.getTabItems(active, lang);
        // }
        window.user.UpdateOfferLocal(this.offer,items['local'], this.location, window.dict.dict);
        return items;
    }

    CloseMenu(ev) {
        let that = ev.data;
        //if(ev.data.changed)
        let items = that.SaveOffer(ev,window.sets.lang);

        if(that.changed) {
            if ($('.menu_item').find('input:checked[tab]').length > 0 && window.user.ValidateOffer(items['remote'])) {
                window.user.PublishOffer(items['remote'], window.user.date, ev.data, function (obj) {
                    window.user.offer.stobj = obj;
                });
            }
        }

        window.user.profile.SaveProfile();
        window.user.profile.SaveSettings();

        that.SaveOrder();

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

    SaveOrder(ev) {
        let orders = this.orders;
        try {
            $('.approve:checked').each(function (i, item) {
                if (!orders[i])
                    return;
                let obj = orders[i];
                window.user.ApproveOrder(obj, $(item).attr('title'));
            })
        }catch(ex){
            console.error();
        }
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



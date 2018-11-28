'use strict'
export {OfferViewer}

var urlencode = require('urlencode');
require('bootstrap/js/modal.js');
require('bootstrap/js/tooltip.js');
require('bootstrap/js/tab.js');
// require('bootstrap/dist/css/bootstrap.css');
// require('font-awesome/css/font-awesome.css');

let Dict = require('../dict/dict.js');
const langs = require("../dict/languages");

var moment = require('moment');

var md5 = require('md5');
var isJSON = require('is-json');

import {utils} from "../utils/utils";

class OfferViewer {

    constructor(){
        this.changed = false;
        this.offer ;

        this.arCat = [];

        this.location = [];

        this.active_class = 'w3-border w3-border-grey w3-round-large';

    }


    OpenOffer(event) {

        this.offer = event.data.offer.offer;

        localStorage.setItem('dict',JSON.stringify(window.dict.dict));

        $("#offer_dialog").modal({
            show: true,
            keyboard:true
        });
        this.parent = event.data;

        $("#offer_dialog").find('.modal-title').text("Menu for ");
        $("#offer_dialog").find('.modal-title').attr('data-translate', md5('Menu for'));
        $("#offer_dialog").find('.modal-title-date').text($('.dt_val')[0].value.split(' ')[0]);
        $("#offer_dialog").off('hide.bs.modal');

        $('#add_item').css('display', 'block');
        $('#add_tab_li').css('display','block');
        $("#offer_dialog").find('.toolbar').css('display', 'block');

        for (let tab in this.offer) {
            if(!tab) continue;
            if($('[href="#'+tab+'"]').length===0) {
                $('<li class="tab_inserted"><a data-toggle="tab"  contenteditable="true" data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a>' +
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

                $(menu_item).find('.item_title').attr('contenteditable', 'true');
                $(menu_item).find('.item_price').attr('contenteditable', 'true');
                if(this.offer[tab][i].title){
                    try {
                        $(menu_item).find('.item_title').text(window.dict.dict[this.offer[tab][i].title][window.sets.lang]);
                    }catch(ex){
                        ;
                    }
                    $(menu_item).find('.item_title').attr('data-translate', this.offer[tab][i].title);
                }
                $(menu_item).find('.item_price').text(this.offer[tab][i].price);

                //$(menu_item).find('.content_text').text(urlencode.decode(window.dict.dict[this.menu[tab][i].content][window.sets.lang]));
                $(menu_item).find('.content_text').attr('contenteditable', 'true');
                $(menu_item).find('.content_text').attr('data-translate', this.offer[tab][i].content);
                if(this.offer[tab][i].content)
                    $(menu_item).find('.content_text').css('visibility','visible');
                if(this.offer[tab][i].width)
                    $(menu_item).find('.content_text').css('width',(this.offer[tab][i].width));

                // if(this.offer[tab][i].height)
                //     $(menu_item).find('.content_text').css('height',(this.offer[tab][i].height));

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
                    $(menu_item).find('.img-fluid').css('left',this.offer[tab][i].img_left);
                }

                $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);

                $('#' + tab).append(menu_item);

                $(tmplt).insertAfter('#offer_dialog');

                if ($(menu_item).find('.item_content').css('display') == 'block'
                    && $(menu_item).find('.img-fluid').attr('src')===''
                    && $(menu_item).find('.content_text').text()===""){
                    $(menu_item).find('.item_content').slideToggle("fast");
                }

                if (this.offer[tab][i].status == 'true') {
                    $(menu_item).find(':checkbox').prop('checked', true);
                }
                $(menu_item).find(':checkbox').on('change', this, function (ev) {
                    ev.data.changed = true;
                });

                $(menu_item).find('.add_picture').attr('id', 'ap_' + tab + '_' + i);
                $(menu_item).find('.add_picture').on('click',this,function (ev) {
                    let menu_item = $(this).closest('.menu_item');
                    let vis = $(menu_item).find('.img-fluid').css('visibility');
                    if (vis === 'visible'){
                        $(menu_item).find('.img-fluid').css('visibility','hidden');
                    }else {
                        ev.target = $(menu_item).find('.img-fluid')[0];
                        ev.type = 'dblclick';
                        $($(menu_item).find('.img-fluid')[0]).trigger(ev);
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
            }
        }

        // let sp = $('.sp_dlg');
        // $(sp).selectpicker();
        // let evnts = $._data($(sp).get(0), "events");
        //
        this.lang = window.sets.lang;
        window.dict.set_lang(window.sets.lang,$("#offer_dialog"));
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
                                moveImage($("#" + el));
                            });
                    })

                }
            });
        });

        $("#offer_dialog").find('.publish_offer').off('click touchstart');
        $("#offer_dialog").find('.publish_offer').on('click touchstart',this,function (ev) {
            let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
            ev.data.parent.PublishOffer(ev.data.GetOfferItems(ev.data.lang,true),date, ev.data.location);
        });
    }

    OnChangeLang(ev) {
        ev.preventDefault(); // avoid to execute the actual submit of the form.
        ev.stopPropagation();
        let menu = ev.data;
        menu.SaveOffer(ev,window.admin.menu.lang);

        let sel_lang = $('.sp_dlg option:selected').val().toLowerCase().substring(0, 2);

        window.dict.Translate('en',sel_lang, function () {
            window.dict.set_lang(sel_lang, $("#offer_dialog"));
            window.admin.menu.lang = sel_lang;
        });
    }



}



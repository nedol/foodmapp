'use strict'
export {OfferViewer}

var urlencode = require('urlencode');
require('bootstrap/js/modal.js');
require('bootstrap/js/tooltip.js');
require('bootstrap/js/tab.js');
// require('bootstrap/dist/css/bootstrap.css');
// require('font-awesome/css/font-awesome.css');

import {Dict} from '../dict/dict.js';
const langs = require("../dict/languages");

var moment = require('moment');

var md5 = require('md5');
var isJSON = require('is-json');

import {utils} from "../utils/utils";

class OfferViewer {

    constructor(){
        this.changed = false;
        this.editor ;
        this.dict;

        this.arCat = [];

        this.location = [];

        this.active_class = 'w3-border w3-border-grey w3-round-large';

    }


    OpenOffer(em, period, offer, dict) {

        this.email = em;
        this.editor = offer;
        this.dict = new Dict(dict);
        this.period = period;

        let ovc_2 = $("#offer_viewer").clone();
        $(ovc_2).attr('id','offer_viewer_clone');
        $(ovc_2).insertAfter($("#offer_viewer"));

        $('.dropdown').css('visibility','hidden');
        $('#add_tab_li').css('visibility','hidden');
        $('#add_item').css('visibility','hidden');

        localStorage.setItem('dict',JSON.stringify(window.dict.dict));

        ovc_2.modal({
            show: true,
            keyboard:true
        });
        this.parent = event.data;

        ovc_2.find('.modal-title').text("Offer for ");
        ovc_2.find('.modal-title').attr('data-translate', md5('Menu for'));
        ovc_2.find('.modal-title-date').text($('.dt_val')[0].value.split(' ')[0]);
        ovc_2.off('hide.bs.modal');
        ovc_2.on('hide.bs.modal', this,this.CloseMenu);

        ovc_2.find('.toolbar').css('display', 'block');

        for (let tab in this.editor) {
            if(!tab || this.editor[tab].length===0) continue;
            if($('[href="#'+tab+'"]').length===0) {
                $('<li class="tab_inserted"><a data-toggle="tab"  contenteditable="false" data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a>' +
                    '</li>').insertBefore(ovc_2.find('.add_tab_li'));
                $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted dropdown" style="border: none">' +
                    '</div>').insertBefore(ovc_2.find('.add_tab_div'));
            }

            for (let i in this.editor[tab]) {

                let tmplt = $('#menu_item_tmplt').clone();
                $('#menu_item_tmplt').attr('id', tab + '_' + i);
                let menu_item = $('#' + tab + '_' + i)[0];
                $(menu_item).attr("class", 'menu_item');
                $(menu_item).css('display', 'block');

                $(menu_item).find('.item_title').attr('contenteditable', 'false');
                $(menu_item).find('.item_price').attr('contenteditable', 'false');
                if(this.editor[tab][i].title){
                    try {
                        $(menu_item).find('.item_title').text(window.dict.dict[this.editor[tab][i].title][window.sets.lang]);
                    }catch(ex){
                        ;
                    }
                    $(menu_item).find('.item_title').attr('data-translate', this.editor[tab][i].title);
                }
                $(menu_item).find('.item_price').text(this.editor[tab][i].price);

                $(menu_item).find('.item_content').addClass('collapse');
                $(menu_item).find('.item_title').attr('data-toggle','collapse');
                $(menu_item).find('.item_title').attr('href','.collapse');

                //$(menu_item).find('.content_text').text(urlencode.decode(window.dict.dict[this.menu[tab][i].content][window.sets.lang]));
                $(menu_item).find('.content_text').attr('contenteditable', 'false');
                $(menu_item).find('.content_text').attr('data-translate', this.editor[tab][i].content);
                if(this.editor[tab][i].content)
                    $(menu_item).find('.content_text').css('visibility','visible');
                if(this.editor[tab][i].width)
                    $(menu_item).find('.content_text').css('width',(this.editor[tab][i].width));

                // if(this.editor[tab][i].height)
                //     $(menu_item).find('.content_text').css('height',(this.editor[tab][i].height));


                if(this.editor[tab][i].img) {
                    $(menu_item).find('.img-fluid').css('visibility', 'visible');
                    $(menu_item).find('.img-fluid').attr('src', this.editor[tab][i].img);
                    $(menu_item).find('.img-fluid').css('left',this.editor[tab][i].img_left);
                }

                $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);

                ovc_2.find('#' + tab).append(menu_item);

                $(tmplt).insertAfter('#offer_viewer');

                if ($(menu_item).find('.item_content').css('display') == 'block'
                    && $(menu_item).find('.img-fluid').attr('src')===''
                    && $(menu_item).find('.content_text').text()===""){
                    $(menu_item).find('.item_content').slideToggle("fast");
                }
            }
        }

        // let sp = $('.sp_dlg');
        // $(sp).selectpicker();
        // let evnts = $._data($(sp).get(0), "events");
        //
        this.lang = window.sets.lang;
        this.dict.set_lang(window.sets.lang,ovc_2);
        // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');

        // if(!evnts['changed.bs.select']) {
        //     $(sp).on('changed.bs.select', this, this.OnChangeLang);
        // }

    }

    OnChangeLang(ev) {
        ev.preventDefault(); // avoid to execute the actual submit of the form.
        ev.stopPropagation();
        let menu = ev.data;
        menu.SaveOffer(ev,window.user.menu.lang);

        let sel_lang = $('.sp_dlg option:selected').val().toLowerCase().substring(0, 2);

        window.dict.Translate('en',sel_lang, function () {
            window.dict.set_lang(sel_lang, $("#offer_viewer"));
            window.user.menu.lang = sel_lang;
        });
    }


    CloseMenu(ev) {
        ev.data.editor = '';
        $('#offer_viewer_clone').remove();
    }
}



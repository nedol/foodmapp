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

    constructor(dict){
        this.changed = false;
        this.offer ;
        this.dict = new Dict(dict);

        this.arCat = [];

        this.location = [];

        this.active_class = 'w3-border w3-border-grey w3-round-large';
        this.period = $('.sel_period').text();
        this.ovc = $("#offer_viewer").clone();
        $(this.ovc).attr('id','offer_viewer_clone');
        $(this.ovc).insertAfter($("#offer_viewer"));

        this.ovc.css('display','inline-block');
        this.ovc.draggable();

        this.ovc.find('.modal-title').text("Delivery for ");
        this.ovc.find('.modal-title').attr('data-translate', md5('Delivery for'));
        this.ovc.find('.modal-title-date').text($('.dt_val')[0].value.split(' ')[0]);

        this.ovc.find('.toolbar').css('display', 'block');

        this.lang = window.sets.lang;
        window.sysdict.set_lang(window.sets.lang,$("#menu_item_tmplt"));
        window.sysdict.set_lang(window.sets.lang,$(this.ovc));

        $('.close_browser').off('click touchstart');
        $('.close_browser').on('click touchstart', this, function (ev) {
            let that = ev.data;
            that.offer = '';
            $(that.ovc).remove();
        });

    }


    OpenOffer(offer) {
        let that = this;
        this.uid = offer.uid;
        this.offer = offer.data;

        this.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');


        $('.dropdown').css('visibility','hidden');
        $('#add_tab_li').css('visibility','hidden');
        $('#add_item').css('visibility','hidden');

        this.dict = new Dict(offer.dict.dict);

        $(".category[state='1']").each(function (i, cat) {
            let tab = cat.title;
            if(!tab || that.offer[tab].length===0)
                return;
            if($('[href="#'+tab+'"]').length===0) {
                $('<li class="tab_inserted"><a data-toggle="tab"  contenteditable="false" data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a>' +
                    '</li>').insertBefore(that.ovc.find('.add_tab_li'));
                $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted dropdown" style="border: none">' +
                    '</div>').insertBefore(that.ovc.find('.add_tab_div'));
            }

            for (let i in that.offer[tab]) {

                let tmplt = $('#menu_item_tmplt').clone();
                $('#menu_item_tmplt').attr('id', tab + '_' + i);
                let menu_item = $('#' + tab + '_' + i)[0];
                $(menu_item).attr("class", 'menu_item');
                $(menu_item).css('display', 'block');
                $('#add_item').css('visibility','hidden');

                $(menu_item).find('.item_title').attr('contenteditable', 'false');
                $(menu_item).find('.item_price').attr('contenteditable', 'false');

                $(menu_item).find('.item_content').attr('id', 'content_' + tab + '_' + i);
                $(menu_item).find('.item_title').attr('data-target','#content_' + tab + '_' + i);


                if(that.offer[tab][i].title){
                    try {
                        $(menu_item).find('.item_title').text(that.dict.dict[that.offer[tab][i].title][window.sets.lang]);
                    }catch(ex){
                        ;
                    }
                    $(menu_item).find('.item_title').attr('data-translate', that.offer[tab][i].title);
                }

                $(menu_item).find('.item_price').text(that.offer[tab][i].price);

                let pl = that.offer[tab][i].packlist;
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


                    $(menu_item).find('.item_price').text(data);
                    $(menu_item).find('.item_price').on('focusout',that, function (ev) {
                        // let that = ev.data;
                        // if($(this).text()===''){
                        //     //удалить из списка
                        //    let pack = $(this).closest('.row').find('.item_pack').text();
                        //    $(menu_item).find('a:contains('+pack+')').remove();
                        // }else if($(this).closest('.row').find('.item_pack').text()){
                        //     //добавить в список
                        //     let pl = JSON.parse($(this).closest('.row').find('.item_pack').attr('packlist'));
                        //     if(!pl[$(this).closest('.row').find('.item_pack').text()]) {
                        //         $(menu_item).find('.pack_list').append("<li href='#'><a role='packitem' >" + $(this).closest('.row').find('.item_pack').text() + "</a></li>");
                        //         pl[$(this).closest('.row').find('.item_pack').text()] = $(this).text();
                        //         $(this).closest('.row').find('.item_pack').attr('packlist', JSON.stringify(pl));
                        //     }
                        // }
                    });
                }

                //$(menu_item).find('.content_text').text(urlencode.decode(window.dict.dict[this.menu[tab][i].content][window.sets.lang]));
                $(menu_item).find('.content_text').attr('contenteditable', 'false');
                $(menu_item).find('.content_text').attr('data-translate', that.offer[tab][i].content);
                if(that.offer[tab][i].content)
                    $(menu_item).find('.content_text').css('visibility','visible');
                if(that.offer[tab][i].width)
                    $(menu_item).find('.content_text').css('width',(that.offer[tab][i].width));

                if(that.offer[tab][i].img) {
                    $(menu_item).find('.img-fluid').css('visibility', 'visible');
                    $(menu_item).find('.img-fluid').attr('src', that.offer[tab][i].img.src);
                    $(menu_item).find('.img-fluid').css('left',!that.offer[tab][i].img.left?0:that.offer[tab][i].img.left);
                    $(menu_item).find('.img-fluid').css('left',that.offer[tab][i].img.top);
                    that.MakeDraggable($(menu_item).find('.img-fluid'));
                }

                $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);

                that.ovc.find('#' + tab).append(menu_item);

                $(tmplt).insertAfter('#offer_viewer');

                if ($(menu_item).find('.item_content').css('display') == 'block'
                    && $(menu_item).find('.img-fluid').attr('src')===''
                    && $(menu_item).find('.content_text').text()===""){
                    $(menu_item).find('.item_content').slideToggle("fast");
                }
            }
        });

        //
        this.lang = window.sets.lang;
        this.dict.set_lang(window.sets.lang,this.ovc);
        // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');

        // if(!evnts['changed.bs.select']) {
        //     $(sp).on('changed.bs.select', this, this.OnChangeLang);
        // }

    }

    MakeDraggable(el){
        $(el).draggable({
            start: function () {
                console.log("drag start");
            },
            drag: function () {
                return false;//$(el).attr('drag', true);
            },
            stop: function () {
                // var rel_x = parseInt($(el).position().left / window.innerWidth * 100);
                // $(el).css('right', rel_x + '%');
                // var rel_y = parseInt($(el).position().top / window.innerHeight * 100);
                // $(el).css('bottom', rel_y + '%');
            }
        });
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
        ev.data.offer = '';
        $('#offer_viewer_clone').remove();
    }
}



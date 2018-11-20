'use strict'
export {Menu}
require('bootstrap')
const langs = require("../dict/languages");

var md5 = require('md5');
var isJSON = require('is-json');
import {Import} from "./import/import"

class Menu {

    constructor(){
        this.parent;
        this.menu_date;
        this.menu_obj={};
        this.lang;
        this.import = new Import();
    }

    // геттер
    get menuObj() {
        return this.menu_obj;
    }

    set menuObj(menu_obj){
        this.menu_obj = menu_obj;
    }

    // геттер
    get menuDate() {
        return this.menu_date;
    }

    set menuDate(date){
        this.menu_date = date;
    }

    AddMenuItem(ev){

        let this_obj = ev.data;

        let tab = $('.nav-tabs').find('.active').children().attr('href');
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

        $(menu_item).find('.content_text').attr('contenteditable', 'true');
        $(menu_item).find('.item_title').attr('contenteditable', 'true');
        $(menu_item).find('.item_price').attr('contenteditable', 'true');

        $(menu_item).find('.item_title').text('item_title');
        let hash = md5(new Date());
        window.dict.dict[hash] = {};
        $(menu_item).find('.item_title').attr('data-translate',hash);
        $(menu_item).find('.item_price').text('1 €');
        $(menu_item).find('.content_text').text('content_text');
        hash = md5(new Date()+1);
        window.dict.dict[hash] = {};
        $(menu_item).find('.content_text').attr('data-translate', hash);
        $(menu_item).find('.img-fluid').attr('src', './images/banner.png');
        $(menu_item).find('.img-fluid').attr('id','img_'+tab.replace('#','')+'_'+pos);
        $(menu_item).find('.img-fluid').on('click', this_obj.OnClickImport);
        $(menu_item).find('.put_image').css('display', 'block');

        $(menu_item).find('.delete_item').css('display','block');
        $(menu_item).find('.delete_item').on('click', this_obj.OnDeleteItem);

        $(menu_item).find('.checkbox').change(function () {
            
        });

        $(tab).append($(menu_item)[0]);

        $(tmplt).insertAfter('#menu_dialog');

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
        }
    }

    OnClickImport(ev){

        $('#file').attr('el_id', $(ev.target).attr('id'));
        $("#file").trigger('click');
    }

}



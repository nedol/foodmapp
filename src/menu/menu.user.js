'use strict'
export {MenuUser}
require('bootstrap/js/modal.js');
// require('bootstrap/js/dropdown.js');
require('bootstrap/js/tooltip.js');
require('bootstrap/js/tab.js');
const langs = require("../dict/languages");
var urlencode = require('urlencode');
var md5 = require('md5');
var isJSON = require('is-json');

var moment = require('moment');

import {Menu} from "./menu"

class MenuUser extends Menu{

    constructor(){
        super();
        this.changed = false;
        this.order ;
        this.this_order;
        this.menu ;
        this.table_id ;
        this.menu_id ;
    }

    // геттер
    get menuObj() {
        return this.menu_obj;
    }

    set menuObj(menu_obj){
        this.menu_obj = menu_obj;
    }


    OpenOrder(event) {
//event.data.order,event.data.date,event.target.parentEl.id,event.target.id,event.data.menu_obj
        let time = $('.sel_time').text();
        this.order = event.data.order[time][event.data.uid];;
        this.menu = this.menu_obj;
        this.table_id = event.target.parentEl.id;
        this.menu_id = event.currentTarget.id;

        $("#menu_dialog").modal({
            show: true,
            keyboard:true
        });

        this.parent = event.data;

        $("#menu_dialog").find('.input').on('change', this, function (ev) {
            ev.data.changed = true;
        });

        $("#menu_dialog").find('input').on('change', this, function (ev) {
            ev.data.changed = true;
        });

        $("#menu_dialog").find('.cancel_menu').off('click touchstart');
        $("#menu_dialog").find('.cancel_menu').on('click touchstart',this,function (ev) {
            ev.data.CancelMenu(ev);
        });

        $('#add_item').css('display','none');
        $("#menu_dialog").find('.cancel_menu').css('display','inline-block');
        $("#menu_dialog").find('.modal-title').attr('data-translate', md5('Order for'));
        $("#menu_dialog").find('.modal-title').text("Order for ");
        $("#menu_dialog").find('.modal-title-date').text($('#datetimepicker').data("DateTimePicker").date().format('DD.MM.YYYY'));
        $("#menu_dialog").find('.modal-table-number').css('display','inline-block');
        $("#menu_dialog").find('.modal-table-number').text("Table # "+this.table_id.replace('table_',''));
        $("#menu_dialog").find('.modal-menu-number').css('display','inline-block');
        $("#menu_dialog").find('.modal-menu-number').text("Menu # "+this.menu_id.replace('menu_',''));

        $("#menu_dialog").on('hide.bs.modal',
            {this:this, table_id:this.table_id,menu_id:this.menu_id},this.CloseOrder);
        $("#menu_dialog").find('.modal-footer').css('display', 'block');

        $("#menu_dialog").find('.comment').attr('id',this.table_id+'_'+this.menu_id+'_comment');

        this.FillMenu();

    }

    FillMenu(){

        for (let tab in this.menu) {
            if (!tab) continue;
            if ($('[href="#' + tab + '"]').length === 0) {

                $('<li class="tab_inserted"><a data-toggle="tab"  data-translate="' + md5(tab) + '"  href="#' + tab + '">' + tab + '</a></li>').appendTo($('.nav-tabs'));

                $('<div id="' + tab + '" class="tab-pane fade tab_inserted" style="border: none"></div>').appendTo($('.tab-content'));
            }

            for (let i in this.menu[tab]) {
                if (this.menu[tab][i]['status'] === 'false')
                    continue;
                let tmplt = $('#menu_item_tmplt').clone();
                $('#menu_item_tmplt').attr('id', tab + '_' + i);
                let menu_item = $('#' + tab + '_' + i);
                $(menu_item).attr("class", 'menu_item');

                if(!this.table_id) {
                    $(menu_item).find('.btn').css('display','none');
                }
                $(menu_item).find(':checkbox').attr('id', 'item_cb_' + i);
                $(menu_item).find(':checkbox').attr('pos', i);
                $(menu_item).find(':checkbox').attr('tab', tab);

                $(menu_item).find(':checkbox').on('change', this, function (ev) {
                    ev.data.changed = true;
                });

                $(menu_item).find('.item_content').slideUp("slow");

                $(menu_item).attr('contenteditable', 'false');

                $(menu_item).find('.item_title').text(this.menu[tab][i].title);
                $(menu_item).find('.item_title').attr('data-translate', this.menu[tab][i].title);
                $(menu_item).find('.item_price').text(this.menu[tab][i].price);
                $(menu_item).find('.content_text').text(this.menu[tab][i].content);
                $(menu_item).find('.content_text').attr('data-translate', this.menu[tab][i].content);
                $(menu_item).find('.content_text').prop("disabled", true)

                $(menu_item).find('.img-fluid').attr('src', this.menu[tab][i].img);
                $(menu_item).find('.img-fluid').css('left',this.menu[tab][i].img_left);

                if(this.menu[tab][i].width)
                    $(menu_item).find('.content_text').css('width',(this.menu[tab][i].width));
                if(this.menu[tab][i].height)
                    $(menu_item).find('.content_text').css('height','200px'/*(this.menu[tab][i].height)*/);

                $(menu_item).css('display', 'block');

                $('#' + tab).append(menu_item);

                $(menu_item).find('.item_title').off('click');
                $(menu_item).find('.item_title').on('click', function (ev) {
                    ev.preventDefault(); // avoid to execute the actual submit of the form.
                    ev.stopPropagation();
                    $(menu_item).find('.item_content').slideToggle("slow");
                    $(this).toggleClass("active");
                });

                $(tmplt).insertAfter('.tab-content');

                if(this.order)
                    if (this.order[this.table_id] && this.order[this.table_id][this.menu_id]) {
                        this.this_order = this.order[this.table_id][this.menu_id];
                        if (this.order[this.table_id][this.menu_id]['comment']) {
                            $("#menu_dialog").find('.comment').val(urlencode.decode(this.order[this.table_id][this.menu_id]['comment']));
                        }

                        let title = $(menu_item).find('.item_title').text();

                        if (this.order[this.table_id][this.menu_id]['order'] &&
                            this.order[this.table_id][this.menu_id]['order'][title]) {
                                if (this.order[this.table_id][this.menu_id]['order'][title]['ordered']) {
                                    $(menu_item).find(':checkbox').prop('checked', 'true');
                                }
                                if (this.order[this.table_id][this.menu_id]['order'][title]['accepted']) {
                                    $(menu_item).find(':checkbox').prop('disabled', 'true');
                                    $(menu_item).find('.glyphicon-time').css('display', 'inline-block');
                                    $(menu_item).find('.item_title').css('color', 'red');
                                }
                                if (!this.order[this.table_id][this.menu_id]['order'][title]['ordered']
                                    && !this.order[this.table_id][this.menu_id]['order'][title]['accepted']) {
                                    //$(menu_item).find(':checkbox').prop('disabled', 'false');
                                    $(menu_item).find('.glyphicon-time').css('display', 'none');
                                    $(menu_item).find('.item_title').css('color', 'white');
                                }
                        }
                    }
                
            }
        }

        $('.nav-tabs a:first').tab('show');

        window.dict.Translate('en',window.sets.lang,function () {
            //$('.sp_dlg').find('option:selected').prop("selected", false);
            $($('.sp_dlg').find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');
            window.dict.set_lang(window.sets.lang,$("#menu_dialog") );
        });
    }

    CloseOrder(ev) {

        let class_obj =  ev.data.this.parent;
        let date = class_obj.date;
        let menu_id = ev.data.menu_id;
        let table_id = ev.data.table_id;
        let order =  class_obj.order[$('.sel_time').text()];

        if(!order[class_obj.uid])
            return;
        let menus = order[class_obj.uid][table_id];
        let input = {[table_id]:menus};

        let miAr = $('.menu_item').toArray();
        for (let p in miAr) {
            let key = $(miAr[p]).find('.item_title').attr('data-translate');
            if(!order[class_obj.uid][table_id])
                order[class_obj.uid][table_id] = {};
            if (order[class_obj.uid][table_id][menu_id] && order[class_obj.uid][table_id][menu_id].status === 'accepted')
                continue;

            input[table_id][menu_id] = order[class_obj.uid][table_id][menu_id];

            if ($("#menu_dialog").find('.comment').val().length>1){
                if($("#menu_dialog").find('.comment').attr('id')===table_id+'_'+menu_id+'_comment')
                    input[table_id][menu_id]['comment']=$("#menu_dialog").find('.comment').val();
            }
            if ($(miAr[p]).find(':checkbox').prop('checked')){
                if(order[class_obj.uid][table_id][menu_id])
                    input[table_id][menu_id].order[key] = {"ordered":new moment().format()};
            }else{
                try {
                    if (order[class_obj.uid][table_id][menu_id]['order'][key]['ordered']) {
                        delete input[table_id][menu_id].order[key];
                    }
                }catch(ex){
                    ;
                }
            }
        }

        let local = localStorage.getItem(date);
        let arr;
        if(!local)
            arr = [];
        else
            arr = JSON.parse(local);
        arr.push(order);
        //localStorage.setItem(date, JSON.stringify(arr));
        if(ev.data.this.changed) {
            class_obj.UpdateOrder(input, table_id, menu_id, date);
        }

        ev.data.this.changed = false;
        class_obj.menu.table_id = '';

        $("#menu_dialog").off('hide.bs.modal');

        $('.item_title').off('click');

        $('#add_item').off('click');

        $("#menu_dialog").find('.tab-pane').empty();

        $("#menu_dialog").find('.comment_input').val('');

        $("#menu_dialog").find('.modal-footer').css('display','none');
        $("#menu_dialog").find('.comment').val('');
        $("#menu_dialog").find('.cancel_menu').css('display','none');

    }

    OpenMenu(event) {
//event.data.order,event.data.date,event.target.parentEl.id,event.target.id,event.data.menu_obj
        this.menu = event.data.menu.menu_obj;

        $('#add_item').css('display', 'none');

        $("#menu_dialog").modal({
            show: true,
            keyboard:true
        });
        this.parent = event.data;

        $('#add_item').css('display','none');

        $("#menu_dialog").find('.modal-title').text("Menu for ");
        $("#menu_dialog").find('.modal-title').attr('data-translate', md5('Menu for'));
        $("#menu_dialog").find('.modal-title-date').text($('#datetimepicker').data("DateTimePicker").date().format('DD.MM.YYYY'));
        $("#menu_dialog").on('hide.bs.modal', this,this.CloseMenu);

        $("#menu_dialog").find('.modal-table-number').css('display','none');
        $("#menu_dialog").find('.modal-menu-number').css('display','none');


        $('#add_tab_li').css('display','none');

        this.FillMenu();

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
            $("#menu_dialog").find('.cancel_menu').off(ev);
            if(this.order[table][menu]){
                let reserve = Object.assign({},ev.data.order);
                delete reserve[time][ev.data.uid][table][menu];
                ev.data.UpdateReservation(ev,table,reserve[time],function (ev) {
                    $('#menu_dialog').modal('hide');
                });
            }
        }

    }

    CloseMenu(ev) {

        $("#menu_dialog").find('.tab-pane').empty();

        $("#menu_dialog").off('hide.bs.modal');
        $('.item_title').off('click');
        //$('#add_item').off('click',this.AddMenuItem);
        //$('.modal-body').find('.add_tab').off('click', this.AddTab);
        $('.tab_inserted').remove();
        $('.sp_dlg').off('changed.bs.select', this.OnChangeLang);
        $("#menu_dialog").find('.cancel_menu').css('display','none');

    }
}



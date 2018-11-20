'use strict'
export {MenuAdmin}

let utils = require('../utils');
var urlencode = require('urlencode');
require('bootstrap/js/modal.js');
// require('bootstrap/js/dropdown.js');
require('bootstrap/js/tooltip.js');
require('bootstrap/js/tab.js');
// require('bootstrap/dist/css/bootstrap.css');
// require('font-awesome/css/font-awesome.css');
// require('summernote/dist/summernote.css');
// require('summernote');
let Dict = require('../dict/dict.js');
const langs = require("../dict/languages");

var moment = require('moment');

var md5 = require('md5');
var isJSON = require('is-json');
import {Import} from "./import/import"
import {Menu} from "./menu"
import {createThumb} from "../utils";

class MenuAdmin extends Menu{

    constructor(){
        super();
        this.admin;
        this.uid;
        this.changed = false;
        this.order ;
        this.menu ;
        this.table_id ;
        this.menu_id ;
        this.from;
        this.to;
        this.active_class = 'w3-border w3-border-grey w3-round-large';
    }

    // геттер
    get menuObj() {
        return this.menu_obj;
    }

    set menuObj(menu_obj){
        this.menu_obj = menu_obj;
    }


    OpenMenu(event) {

        this.menu = event.data.menu.menu_obj;

        $("#menu_dialog").modal({
            show: true,
            keyboard:true
        });
        this.parent = event.data;

        function selectText(el) {
            $(el).focus();
            document.execCommand('selectAll', false, null);
        }

        function moveImage(image){
            $(image).mousedown(function() {
                $(this).data("dragging", true);
                //console.log("dragging","true");
            });

            $(image).mouseup(function() {
                $(this).data("dragging", false);
                //console.log("dragging","false");
            });

            $(image).mousemove(function(e) {
                if (!$(this).data("dragging"))
                    return;
                //console.log("X:"+ ((e.clientX - $(this).width())-120)+"  Y:"+ (e.clientY - $(this).height()/2))
                $(this).css("left", e.clientX - $(this).width()-120);
                //$(this).css("top", e.clientY - ($(this).height()/2 +20));
                // $(this).offset({
                //     left: e.pageX,
                //     top: e.pageY + 20
                // });
            });
        }

        $(".content_text").dblclick(function () {
            selectText($(this));
        });

        $("#menu_dialog").find('.modal-title').text("Menu for ");
        $("#menu_dialog").find('.modal-title').attr('data-translate', md5('Menu for'));
        $("#menu_dialog").find('.modal-title-date').text($('.dt_val')[0].value.split(' ')[0]);
        $("#menu_dialog").on('hide.bs.modal', this,this.CloseMenu);

        $('#add_item').css('display', 'block');
        $('#add_tab_li').css('display','block');
        $("#menu_dialog").find('.toolbar').css('display', 'block');

        for (let tab in this.menu) {
            if(!tab) continue;
            if($('[href="#'+tab+'"]').length===0) {
                $('<li class="tab_inserted" draggable="true" ondragstart="drag(event)"><a data-toggle="tab"  contenteditable="true" data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a></li>').insertBefore($('#add_tab_li'));
                $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted" style="border: none"></div>').insertBefore($('#add_tab_div'));
            }

            for (let i in this.menu[tab]) {
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
                if(this.menu[tab][i].title){
                   try {
                       $(menu_item).find('.item_title').text(window.dict.dict[this.menu[tab][i].title][window.sets.lang]);
                   }catch(ex){
                       ;
                    }
                    $(menu_item).find('.item_title').attr('data-translate', this.menu[tab][i].title);
                }
                $(menu_item).find('.item_price').text(this.menu[tab][i].price);

                //$(menu_item).find('.content_text').text(urlencode.decode(window.dict.dict[this.menu[tab][i].content][window.sets.lang]));
                $(menu_item).find('.content_text').attr('contenteditable', 'true');
                $(menu_item).find('.content_text').attr('data-translate', this.menu[tab][i].content);
                if(this.menu[tab][i].content)
                    $(menu_item).find('.content_text').css('visibility','visible');
                if(this.menu[tab][i].width)
                    $(menu_item).find('.content_text').css('width',(this.menu[tab][i].width));

                // if(this.menu[tab][i].height)
                //     $(menu_item).find('.content_text').css('height',(this.menu[tab][i].height));

                $(menu_item).find('.content_text').on('dblclick', function (ev) {
                    let img = $(menu_item).find('.img-fluid')[0];
                    let img_os = $(menu_item).find('.img-fluid').offset();
                    return;//TODO
                    if(ev.offsetX <  img_os.left+img.width && ev.offsetX > img_os.left &&
                        ev.offsetY < img_os.top+img.height && ev.offsetY > img_os.top )
                        $(menu_item).find('.img-fluid').trigger(ev);
                });

                if(this.menu[tab][i].img) {
                    $(menu_item).find('.img-fluid').css('visibility', 'visible');
                    $(menu_item).find('.img-fluid').attr('src', this.menu[tab][i].img);
                    $(menu_item).find('.img-fluid').css('left',this.menu[tab][i].img_left);
                    moveImage($(menu_item).find('.img-fluid'));
                }

                $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);
                $(menu_item).find('.img-fluid').on('dblclick', this.OnClickImport);

                $('#' + tab).append(menu_item);

                $(tmplt).insertAfter('#menu_dialog');

                if ($(menu_item).find('.item_content').css('display') == 'block'
                    && $(menu_item).find('.img-fluid').attr('src')===''
                    && $(menu_item).find('.content_text').text()===""){
                    $(menu_item).find('.item_content').slideToggle("fast");
                }

                if (this.menu[tab][i].status == 'true') {
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

        //window.dict.set_lang(window.sets.lang,$("#menu_dialog"));
        let sp = $('.sp_dlg');
        $(sp).selectpicker();
        let evnts = $._data($(sp).get(0), "events");

        this.lang = window.sets.lang;
        window.dict.set_lang(window.sets.lang,$("#menu_dialog"));
        $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');

        if(!evnts['changed.bs.select']) {
            $(sp).on('changed.bs.select', this, this.OnChangeLang);
        }

        evnts = $._data($('#add_tab').get(0), "events");
        if(!evnts || !evnts['click'])
            $('#add_tab').on('click', this, this.AddTab);

        evnts = $._data($('#add_item').get(0), "events");
        if(!evnts || !evnts['click'])
            $('#add_item').on('click', this, this.AddMenuItem);

        $('input:file').change(function(ev) {
            //listFiles(evt);
            let  files = $("input[type='file']")[0].files;
            let el = $(ev.target).attr('el_id');
            window.admin.menu.import.handleFileSelect(ev, files, el, function (data, el, smt) {
                if(data) {
                    $("#" + el).attr('src', data);
                    let thumb = false;
                    $("#" + el).css('visibility','visible');
                    $("#" + el).closest('.menu_item').find('.item_content').slideDown("slow");

                    $("#" + el).on('load', {el:el}, function (ev) {
                        if(!thumb)
                            createThumb($("#" + ev.data.el)[0], $("#" + ev.data.el).width(), $("#" + ev.data.el).height(), el, function (thmb, el) {
                                thumb = true;
                                $("#" + el).attr('src', thmb.src);
                                moveImage($("#" + el));
                            });
                    })

                }
            });
        });
    }


    AddTab(ev){

        ev.preventDefault(); // avoid to execute the actual submit of the form.
        ev.stopPropagation();
        let tab = 'tab_'+$('.tab-pane').length;

        ev.data.changed = true;

        $('<li class="tab_inserted"><a data-toggle="tab" contenteditable="true" data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a></li>').insertBefore($('#add_tab_li'));

        $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted" style="border: none">'+'</div>').insertBefore($('#add_tab_div'));

    }

    AddMenuItem(ev){

        let this_obj = ev.data;

        ev.data.changed = true;

        let tab = $('.nav-tabs').find('li.active').find('a').attr('href');
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
        $(menu_item).find('.item_price').text('1');
        $(menu_item).find('.content_text').text('content_text');
        hash = md5(new Date()+1);
        window.dict.dict[hash] = {};
        $(menu_item).find('.content_text').attr('data-translate', hash);
        $(menu_item).find('.img-fluid').attr('src', './images/banner.png');
        $(menu_item).find('.img-fluid').attr('id','img_'+tab.replace('#','')+'_'+pos);
        $(menu_item).find('.img-fluid').on('dblclick', this_obj.OnClickImport);
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
                $(menu_item).find('.img-fluid').trigger(ev);
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

        $(tab).append(menu_item);

        if ($(menu_item).find('.item_content').css('display') == 'block')
           $(menu_item).find('.item_content').slideToggle("fast");

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

    OpenOrder(event) {
//event.data.order,event.data.date,event.target.parentEl.id,event.target.id,event.data.menu_obj
        this.admin = event.data;
        let time = $('.sel_time').text();
        this.from = time.split(' - ')[0];
        this.to = time.split(' - ')[1];
        this.order = event.data.order[time]?event.data.order[time]:{};

        this.menu = this.menu_obj;
        this.table_id = event.target.parentEl.id;
        this.menu_id = event.target.id;


        $("#menu_dialog").modal({
            show: true,
            keyboard:true
        });

        this.parent = event.data;
        let lang = $('.selectpicker option:selected').val().toLowerCase().substring(0, 2);

        let sp = $('.sp_dlg');
        $(sp).selectpicker();
        $(sp).change(this,function(ev) {
            let sel_lang = $('.sp_dlg option:selected').val().toLowerCase().substring(0, 2);
            if(lang!==sel_lang){
                ev.data.changed = true;
                window.dict.Translate(false, sel_lang,  function () {

                });
            }
            window.dict.set_lang(sel_lang,$("#menu_dialog") );
            window.admin.menu.lang = sel_lang;

        });

        $("#menu_dialog").find('.toolbar').css('display', 'none');

        $('#add_item').css('display','none');

        $('#add_tab_li').css('display','none');

        $("#menu_dialog").find('.modal-title').attr('data-translate', md5('Order for'));
        //$("#menu_dialog").find('.modal-title').text("Order for ");
        $("#menu_dialog").find('.modal-title-date').text($('#datetimepicker').data("DateTimePicker").date().format('DD.MM.YYYY'));
        $("#menu_dialog").find('.modal-table-number').css('display','inline-block');
        $("#menu_dialog").find('.modal-table-number').text("Table # "+this.table_id.replace('table_',''));
        $("#menu_dialog").find('.modal-menu-number').css('display','inline-block');
        $("#menu_dialog").find('.modal-menu-number').text("Menu # "+this.menu_id.replace('menu_',''));
        $("#menu_dialog").on('hide.bs.modal',
            {this:this, table_id:event.target.parentEl.id,menu_id:event.target.id},this.CloseOrder);

        $("#menu_dialog").find('.cancel_menu').off('click touchstart');
        $("#menu_dialog").find('.cancel_menu').on('click touchstart',this,function (ev) {
            ev.data.CancelMenu(ev);
        });

        $("#menu_dialog").find('.cancel_menu').css('display','inline-block');

        for(let u in this.order) {
            if(this.order[u][this.table_id] && this.order[u][this.table_id][this.menu_id]) {
                this.uid = u;
                if (this.from && this.to) {

                    $("#menu_dialog").find('.pre_order_but').text('Pre-Orders');
                    $('<span class="caret"></span></button>').appendTo($("#menu_dialog").find('.pre_order_but'));
                    $("#menu_dialog").find('.pre_order_div').css('display', 'inline-block');

                    let item = this.order[u][this.table_id][this.menu_id];
                    $(item).sort(function (a, b) {
                        return parseInt(a.from.replace(':', '')) - parseInt(b.from.replace(':', ''));
                    });

                    // $('<li><a href="#"  onclick="window.admin.menu.OnClickTimeRange(this)" i="' + u + '" table="' + this.table_id
                    //     + '" menu="' + this.menu_id + '" from="' + item.from + '" to="' + item.to + '">' + item.from + '-'
                    //     + item.to + '</a></li>').appendTo($('.pre_order_list'));

                    // this.from = item.from;
                    // this.to = item.to;
                    //$("#menu_dialog").find('.time_range[from="' + item.from + '"]').addClass(this.active_class);

                }
            }
        }
        this.FillOrder();
    }

    OnClickTimeRange(el){
        let from = $(el).attr('from');
        let to = $(el).attr('to');
        let item = this.order[$(el).attr('i')][$(el).attr('table')][$(el).attr('menu')];
        if (item.from === from && item.to === to) {

            $("#menu_dialog").find('.time_range').removeClass(this.active_class);
            $("#menu_dialog").find('.time_range[from="' + from + '"]').addClass(this.active_class);
            $("#menu_dialog").find('.tab-pane').empty();
            // $("#menu_dialog").find('li.tab_inserted').empty();
            $("#menu_dialog").find('.pre_order_but').text(from+'-'+to);
            $('<span class="caret"></span></button>').appendTo($("#menu_dialog").find('.pre_order_but'));
            this.from = from;
            this.to = to;
            this.FillOrder();

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
            $("#menu_dialog").find('.cancel_menu').off(ev);
            if(this.order[ev.data.uid][table][menu]){
                let reserve = Object.assign({},ev.data.order);
                delete reserve[time][ev.data.uid][table][menu];
                ev.data.UpdateReservation(ev,table,reserve[time],function (ev) {
                    $('#menu_dialog').modal('hide');
                });
            }
        }

        $('#order_menu_button').dropdown("toggle")
    }

    FillOrder(){

        for (let tab in this.menu) {
            if(!tab) continue;
            if($('[href="#'+tab+'"]').length===0) {
                $('<li class="tab_inserted"><a data-toggle="tab"  data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a></li>').insertBefore($('#add_tab_li'));
                $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted" style="border: none"></div>').insertBefore($('#add_tab_div'));
            }

            for (let i in this.menu[tab]) {
                if(this.menu[tab][i]['status']==='false')
                    continue;
                let tmplt = $('#menu_item_tmplt').clone();
                $('#menu_item_tmplt').attr('id', tab + '_' + i);
                let menu_item = $('#' + tab + '_' + i);
                $(menu_item).attr("class", 'menu_item');

                $(menu_item).find(':checkbox').attr('id', 'item_cb_' + i);
                $(menu_item).find(':checkbox').attr('pos', i);
                $(menu_item).find(':checkbox').attr('tab', tab);

                $(menu_item).find(':checkbox').on('change', this, function (ev) {
                    ev.data.changed = true;
                });

                $(menu_item).find('.item_content').slideUp("slow");

                $(menu_item).attr('contenteditable', 'false');

                $(menu_item).find('.img-fluid').css('visibility','visible');
                $(menu_item).find('.content_text').css('visibility','visible');

                $(menu_item).find('.item_title').text(urlencode.decode(this.menu[tab][i].title));
                $(menu_item).find('.item_title').attr('data-translate', this.menu[tab][i].title);
                $(menu_item).find('.item_price').text(this.menu[tab][i].price);
                $(menu_item).find('.content_text').text(this.menu[tab][i].content);
                $(menu_item).find('.content_text').attr('data-translate', this.menu[tab][i].content);
                if(this.menu[tab][i].width)
                    $(menu_item).find('.content_text').css('width',(this.menu[tab][i].width));
                $(menu_item).find('.img-fluid').attr('src', this.menu[tab][i].img);
                $(menu_item).find('.img-fluid').css('left',this.menu[tab][i].img_left);

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

                $("#menu_dialog").find('.modal-footer').attr('contenteditable', 'false');

                if(this.order && this.order['comment']) {
                    $("#menu_dialog").find('.comment').css('display', 'block');
                    $("#menu_dialog").find('.comment').val(urlencode.decode(this.order['comment']));
                }

                let title = this.menu[tab][i].title;
                for(let t in this.order) {
                    if (this.order[t][this.table_id] &&
                        this.order[t][this.table_id][this.menu_id] &&
                        this.order[t][this.table_id][this.menu_id]['order'] &&
                        this.order[t][this.table_id][this.menu_id]['order'][title]) {
                        let order = this.order[t][this.table_id][this.menu_id];
                        if (order['order'][title]['ordered']) {
                            //$("#menu_dialog").find('[from="' + order.from + '"]').css('color', 'red');

                            $(menu_item).find('.item_title').css('color', 'red');
                            $("#menu_dialog").find('a[href="#' + tab + '"]').css('color', 'red');
                            $("#menu_dialog").find('.pre_order_but').css('color', 'red');

                        } else if (order['order'][title]['status'] === '') {
                            $("#menu_dialog").find('[from="' + order.from + '"]').css('color', '');
                            $(menu_item).find('.item_title').css('color', '');
                            $("#menu_dialog").find('a[href="#' + tab + '"]').css('color', '');
                        }
                        if (order['order'][title]['accepted']) {
                            $(menu_item).find(':checkbox').prop('checked', true);
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
            window.admin.menu.lang = window.sets.lang;
        });
    }

    CloseOrder(ev) {

        let class_obj =  ev.data.this.parent;
        let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
        let menu_id = ev.data.menu_id;
        let table_id = ev.data.table_id;
        let this_order = ev.data.this.order;
        let from = class_obj.menu.from;
        let to = class_obj.menu.to;
        let u = ev.data.this.uid?ev.data.this.uid:window.admin.uid;

        let miAr = $('.menu_item').toArray();
        for (let p in miAr) {
            let key = $(miAr[p]).find('.item_title').attr('data-translate');
            if ($(miAr[p]).find(':checkbox').prop('checked')) {
                //let obj = {[u]:{[table_id]:{[menu_id]:{"from":"13:00","to":"14:00","order":{[key]:{"status":"accepted"}}}}}};
                if(u ===window.admin.uid) {
                    if (!this_order[u])
                        this_order[u] = {};
                }

                if (!this_order[u][table_id])
                    this_order[u][table_id] = {};

                if (!this_order[u][table_id][menu_id]) {
                    this_order[u][table_id][menu_id] = {};
                }

                if (!this_order[u][table_id][menu_id]['order'])
                    this_order[u][table_id][menu_id]['order'] = {};

                if (!this_order[u][table_id][menu_id]['order'][key])
                    this_order[u][table_id][menu_id]['order'][key] = {};
                if (!this_order[u][table_id][menu_id]['order'][key]['accepted'])
                    this_order[u][table_id][menu_id]['order'][key]['accepted'] =
                        new moment().format();

            }else{
                try {
                    if (this_order[u][table_id][menu_id]['order'][key]['accepted'])
                        this_order[u][table_id][menu_id]['order'][key]['accepted'] = "";
                }catch(ex){
                    //console.log(ex);
                }
            }
        }


        //localStorage.setItem(date, JSON.stringify(order));
        if(ev.data.this.changed) {
            class_obj.UpdateOrder(this_order, date);
        }

        ev.data.this.changed = false;
        ev.data.table_id = null;

        $(':checkbox').prop('checked', false);

        $("#menu_dialog").off('hide.bs.modal');
        $('#add_item').off('click');
        $('.item_title').off('click');
        //$('.sp_dlg').off('change');
        $("#menu_dialog").find('.comment').val('');
        $("#menu_dialog").find('.comment').css('display','none');

        $("#menu_dialog").find(':checked').prop('checked', false);

        $("#menu_dialog").find('.tab-pane').empty();

        $('.pre_order_list').empty();
        $("#menu_dialog").find('.pre_order_div').css('display', 'none');


        $("#menu_dialog").find('.modal-table-number').text('');
        $("#menu_dialog").find('.modal-menu-number').text('');

    }

    SaveMenu(ev, lang) {

        let class_obj = ev.data.parent;
        let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');//class_obj.date;
        var menuObj = {};


        $('div.div_tab_inserted').each(function (index, value) {
            let id = $(value).attr('id');
            let val = $($('[data-translate="' + md5(id) + '"]')[0]).text();

            if (!window.dict.dict[md5(id)]) {
                window.dict.dict[md5(id)] = {[lang]: val};
            }

            window.dict.dict[md5(id)][lang] = val;

            let miAr = $(this).find('.menu_item');
            if (miAr.length === 0) {
                return;
            } else {
                let val = $('[href="#' + $(this).attr('id') + '"]').text();
                menuObj[id] = [];

                for (let i = 0; i < miAr.length; i++) {
                    let item = {};
                    item.status = JSON.stringify($(miAr[i]).find(':checkbox').prop('checked'));
                    let title = $(miAr[i]).find('.item_title');
                    let hash = $(title).attr('data-translate');
                    let text = $(miAr[i]).find('.item_title').text();

                    if (text.length === 0 || !text.trim())
                        continue;
                    if(!window.dict.dict[hash])
                        window.dict.dict[hash] = {};
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
                        if(!window.dict.dict[hash])
                            window.dict.dict[hash] = {};
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
                        delete item.content;
                    }

                    if($(miAr[i]).find('.img-fluid').css('visibility')==='visible') {
                        item.img = $(miAr[i]).find('.img-fluid').attr('src');
                        item.img_left = parseFloat((parseInt($(miAr[i]).find('.img-fluid').css('left'))/$(miAr[i]).width())).toFixed(2)*100+'%';
                    }else {
                        delete item.img;
                    }

                    menuObj[id].push(item);
                }
            }
        });

        window.admin.UpdateMenu(menuObj, window.dict.dict, date);

    }

    CloseMenu(ev) {
        let menu = ev.data;
        //if(ev.data.changed)
        menu.SaveMenu(ev,$('.sp_dlg option:selected').val());

        $("#menu_dialog").find('.tab-pane').empty();

        $("#menu_dialog").off('hide.bs.modal');
        $('.item_title').off('click');
        //$('#add_item').off('click',this.AddMenuItem);
        //$('.modal-body').find('.add_tab').off('click', this.AddTab);
        $('.div_tab_inserted').remove();
        $('.tab_inserted').remove();
        $('.sp_dlg').off('changed.bs.select');
        $("#menu_dialog").find('.toolbar').css('display', 'none');
        $('input:file').off('change');
    }

    OnChangeLang(ev) {
        ev.preventDefault(); // avoid to execute the actual submit of the form.
        ev.stopPropagation();
        let menu = ev.data;
        menu.SaveMenu(ev,window.admin.menu.lang);

        let sel_lang = $('.sp_dlg option:selected').val().toLowerCase().substring(0, 2);

        window.dict.Translate('en',sel_lang, function () {
            window.dict.set_lang(sel_lang, $("#menu_dialog"));
            window.admin.menu.lang = sel_lang;
        });
    }

}



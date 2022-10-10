'use strict'

require('bootstrap');
// require('bootstrap-select');
// import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';

// const EventSource = NativeEventSource || EventSourcePolyfill;
// OR: may also need to set as global property
// window.EventSource =  NativeEventSource || EventSourcePolyfill;

import 'tablesorter/dist/css/theme.default.min.css';
// import 'tablesorter/dist/css/theme.blue.css';
// import 'tablesorter/dist/css/dragtable.mod.min.css';

require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');
// require('tablesorter/dist/js/widgets/widget-scroller.min.js');
// require('tablesorter/dist/js/extras/jquery.dragtable.mod.min.js');

import {Dict} from '../dict/dict.js';

import {Utils} from "../utils/utils";
let utils = new Utils();

window.InitProfileUser = function () {

    window.profile_cus = new ProfileCustomer();

    var readURL = function(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $('.avatar').attr('src', e.target.result);
                $('.avatar').siblings('input:file').attr('changed',true);
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    $(".file-upload").on('change', function(){
        readURL(this);
    });
}



class ProfileCustomer{
    constructor(tab){
        let that = this;
        window.user = this;

        that.InitUserOrders();
        that.fillProfileForm();

        $('.submit').on('click', this, function (ev) {
            ev.data.OnSubmit();
        });

        $('input').on('change', function (ev) {
            $(this).attr('changed', true);
        });

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

    fillProfileForm(){
        let that = this;
        window.parent.db.GetSettings(function (data) {
            if(data[0] && data[0].profile) {
                that.uid = data[0].uid;
                that.psw = data[0].psw;
                that.profile = data[0].profile;

                for (let i in data[0].profile) {
                    if (i === 'avatar') {
                        $('.avatar').attr('src', data[0].profile[i]);
                        continue;
                    }
                    if (i)
                        $('input[id=' + i + ']').val(data[0].profile[i]);
                }
            }

            if($('#mobile').val() || $('#email').val()){
                $('.reg_reminder').css('display','none');
            }
        });
    }

    Close(cb) {
        $('.loader', $(window.parent.document).contents()).css('display','block');
        let items = this.GetProfileItems();
        $('tbody').empty();
        $.tablesorter.destroy( $('table')[0], true, function () {
            
        });
        this.OnSubmit(cb);
    }

    GetProfileItems(){
        let that  = this;
        $('.tab-pane').each(function (i, tab) {
            if($(tab).attr('id')==='profile') {
                window.parent.db.GetSettings(function (data) {
                    let profile= '';
                    if(!data[0] && !data[0].profile)
                        profile = {};
                    else
                        profile = data[0].profile;
                    $(tab).find('input[changed]').each(function (index, inp) {
                        if($(this).attr('type')==='file'){
                            profile['avatar'] = $(this).siblings('img').attr('src');
                            return;
                        }
                        profile[inp.id] = $(inp).val();
                    });
                    data[0]['profile'] = profile;
                    window.parent.db.SetObject('setStore', data[0], function (res) {

                    });
                });
            }else if($(tab).attr('id')==='orders'){
                that.SaveOrderItems(function () {
                    
                });
            }
        });
    }

    OnSubmit(cb){
        let that = this;
        try {
        let k = 50/ $('.avatar').height();

        let func = "confirmem"
        if(window.parent.user.psw ){
            func = "updprofile"
        }

         let data_post ={
            proj:'d2d',
            user:window.parent.user.constructor.name,
            func:func,
            uid: window.parent.user.uid,
            psw: window.parent.user.psw,
            profile: {
                email: $('#email').val(),
                avatar: $('.avatar').attr('src'),
                lang: $('html').attr('lang'),
                name: $('#name').val(),
                mobile: $('#mobile').val(),
                place: $('#place').val(),
            }
        }

        window.parent.user.profile.profile  = data_post.profile;
        window.parent.network.postRequest(data_post, function (res) {

            if(!res || res.length===0) {
                return;
            }
            delete data_post.proj;
            delete data_post.func;
            delete data_post.uid;
            delete data_post.host;
            if (res && !res.err) {

                window.parent.db.GetSettings(function (obj) {
                    if (!obj[0])
                        obj[0] = {};

                    if(res.psw)
                        obj[0].psw = res.psw;
                    else
                        obj[0].psw = data_post.psw;
                    window.parent.user.psw = obj[0].psw;
                    obj[0].profile = data_post.profile;

                    window.parent.db.SetObject('setStore', obj[0], function (res) {

                    });

                });
            } else {
                alert(res.err);
            }

        });

        }catch(ex) {

        }

        cb();
    }

    InitUserOrders(tab_active){
        let that = this;

        $('#menu_item_style').load('./customer.frame.'+window.parent.sets.lang+'.html #menu_item_style', function (response, status, xhr) {

        });

        that.path  ="http://localhost:63342/d2d/server";
        if(host_port.includes('nedol.ru'))
            that.path = host_port;

        that.FillOrders();

    }

    FillOrders(){
        let that = this;
        let date = window.parent.user.date;
        that.sum = 0;
        window.parent.db.GetCusOrders(window.parent.user.date,(res)=> {
            window.parent.user.orders = res;

            for(let i in window.parent.user.orders){
                let order = window.parent.user.orders[i];
                let dict;
                $('#menu_item_tmplt').load('./customer.frame.'+window.parent.sets.lang+'.html #menu_item_tmplt', function (response, status, xhr) {

                    let element = $(that).find('td.title');
                    let inv_period = '', inv_qnty = '', tr_class='', tr_disabled='',tr_style = '';

                    for(let item in order.data) {
                        if (order.supuid && !$("tr."+order.supuid)[0]) {
                            $("<tr class='supuid " + order.supuid + "' style='text-align: center; font-weight: bold;" + tr_style + "' " + tr_disabled + ">" +
                                "<td class='sup_name tablesorter-no-sort'></td>" +
                                "<td  class='address tablesorter-no-sort' style='color: #0033cc'><a class='place'>" + order.address + "</a></td>" +
                                "<td " + inv_period + ">" + order.period + "</td>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td></td>" +
                            "</tr>"+
                            "<tr  class='pay_supuid "+ order.supuid + "' style='text-align: center;'>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td class='tablesorter-no-sort' style='text-align: right;'><a href='#'>"+{'en':'Pay:','ru':'Оплатить:'}[window.parent.sets.lang]+"</a></td>" +
                                "<td class='ord_sum tablesorter-no-sort'>0</td>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td></td>"+
                            "</tr>"
                            ).appendTo($('tbody'));
                        }

                        window.parent.db.GetSupplier(new Date(window.parent.user.date), order.supuid, function (sup) {
                            if (sup != -1) {
                                $("tr."+order.supuid).find('.sup_name').text(sup.profile.name);
                                let sum = 0;
                                dict = new Dict(sup.dict.dict);
                                for(let o in order.data[item].ordlist) {
                                    let ord = order.data[item].ordlist[o];
                                    let extlist = '';
                                    for(let e in order.data[item].extralist) {
                                        extlist += "<tr style='text-align: center;'>" +
                                            "<td></td>" +
                                            "<td></td>" +
                                            "<td></td>" +
                                            "<td>"+e+"</td>" +
                                            "<td></td>" +
                                            "<td>"+order.data[item].extralist[e].qnty+"</td>" +
                                            "<td>"+order.data[item].extralist[e].price+"</td>" +
                                            "<td></td>" +
                                            "<td></td>" +
                                            "<td></td>" +
                                            "</tr>";

                                        sum += parseInt(order.data[item].extralist[e].qnty) * order.data[item].extralist[e].price.toFixed(2);
                                    }
                                    $("<tr style='text-align: center;" + tr_style + "' " + tr_disabled + ">" +
                                        "<td class='tablesorter-no-sort'>" +
                                        "<label  class='item_cb btn'  style='width: 4%;margin-right:20px;visibility:visible'>" +
                                        "<input type='checkbox' disabled='disabled' class='checkbox-inline approve'  title='" + item + "' orderdate='" + order.date + "' cusuid=" + order.cusuid + " " +
                                        "style='transform: scale(2,2);'>" +
                                        "</label></td>" +
                                        "<td></td>" +
                                        "<td></td>" +
                                        "</td>" +
                                        "<td>" + dict.getValByKey(window.parent.sets.lang, item) + "</td>" +
                                        "<td>" + o + "</td>" +
                                        "<td " + inv_qnty + ">" + ord.qnty + "</td>" +
                                        "<td class='price'>" + ord.price + "</td>" +
                                        "<td class='tablesorter-no-sort'>" +
                                        (order.comment ? "<span class='tacomment'>" + order.comment + "</span>" : '') +
                                        "</td>" +
                                        "<td  class='marketer'>" +
                                        //      "<script src=\"https://nedol.ru/rtc/common.js\"></script>" +
                                        //      "<script src=\"https://nedol.ru/rtc/host.js\"></script>" +
                                        //      "<script src=\"https://nedol.ru/rtc/loader.js\"></script>" +
                                        //      "<object   abonent=\"nedol@narod.ru\" components=\"audio browser video\"></object>" +
                                        "</td>" +
                                        "<td  class='trash'>" +
                                        "<i class='fa fa-trash' style='-webkit-transform: scale(1.5);transform: scale(1.5);'" +
                                        " onclick='window.user.DeleteOrder(this)'></i>" +
                                        "</td>" +
                                        "</tr>"+extlist).insertAfter($("tr.supuid." + order.supuid));

                                    sum += parseFloat($("tr.pay_supuid."+order.supuid).find('td.ord_sum').text())+ parseFloat(ord.price) *ord.qnty;

                                    if (sup.profile.place && sup.profile.type === 'marketer' || sup.profile.place && sup.profile.type === 'foodtruck') {
                                        $("tr." + order.supuid).find('.address').find('.place').text(sup.profile.place);
                                        $("tr." + order.supuid).find('.address').find('.delivery').text("забрать");

                                    }
                                }
                                $("tr.pay_supuid."+order.supuid).find('td.ord_sum').text(sum);
                            }
                        });


                        window.parent.db.GetApproved(new Date(date), order.supuid,order.cusuid, item,function (appr) {
                            if(appr && appr.data.qnty===order.data[item].qnty &&
                                appr.data.price===order.data[item].price) {
                                $(".approve[title='" + item + "'][cusuid=" + order.cusuid + "]").prop('checked','checked');
                                $(".approve[title='" + item + "'][cusuid=" + order.cusuid + "]").attr('disabled', 'true');
                            }
                        });
                    }

                    $('table').tablesorter({
                        theme: 'blue',
                        widgets: ['zebra','columns', 'scroller' ],
                        resizable_includeFooter:true,
                        usNumberFormat: false,
                        sortReset: true,
                        sortRestart: true,
                        sortInitialOrder: 'desc',
                        widthFixed: true,
                        widgetOptions : {
                            scroller_height : 100,
                            // scroll tbody to top after sorting
                            scroller_upAfterSort: true,
                            // pop table header into view while scrolling up the page
                            scroller_jumpToHeader: true,
                            // In tablesorter v2.19.0 the scroll bar width is auto-detected
                            // add a value here to override the auto-detected setting
                            scroller_barWidth : null
                            // scroll_idPrefix was removed in v2.18.0
                            // scroller_idPrefix : 's_'
                        }
                    });

                });
            }
        });

    }

    DeleteOrder(el) {
        let that = this;
        if(confirm({'ru':"Удалить из заказа?",'en':'Remove from order?'}[window.parent.sets.lang])){
            $(el).closest('tr').remove();
            that.SaveOrderItems(function () {
                $('tbody').empty();
                that.FillOrders();
                return;
            });
        }
    }

    SaveOrderItems(cb){

        for(let o in window.parent.user.orders) {
            let order = window.parent.user.orders[o];
            for(let p in order.data) {
                if ($('input[title="' + p + '"]').length > 0) {
                    window.parent.db.SetObject('orderStore', order, function (res) {

                    });
                }else{
                    delete order.data[p];
                    window.parent.db.SetObject('orderStore', order, function (res) {
                        cb();
                    });
                }
            }
        }

        window.parent.user.SetOrdCnt();

    }


}


//////////////////
// WEBPACK FOOTER
// ./src/profile/profile.customer.js
// module id = 774
// module chunks = 9
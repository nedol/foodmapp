'use strict'

require('bootstrap');
// require('bootstrap-select');
import 'bootstrap/dist/css/bootstrap.css'
// import 'tablesorter/dist/css/theme.default.min.css';
// import 'tablesorter/dist/css/theme.blue.css';
// import 'tablesorter/dist/css/dragtable.mod.min.css';

require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');
// require('tablesorter/dist/js/widgets/widget-scroller.min.js');
// require('tablesorter/dist/js/extras/jquery.dragtable.mod.min.js');
let _ = require('lodash');

import {UtilsMap} from "../utils/utils.map.js";
import proj from 'ol/proj';
var moment = require('moment/moment');
import 'tablesorter/dist/css/theme.default.min.css';
import 'tablesorter/dist/css/theme.blue.css'
import 'tablesorter/dist/css/widget.grouping.min.css';
import {Dict} from '../dict/dict.js';
import {Utils} from "../utils/utils";


let utils = new Utils();

window.InitCartCustomer = function () {

    if(!window.cart_cus)
        window.cart_cus = new CartCustomer();
    window.cart_cus.InitUserOrders();

}



export class CartCustomer{
    constructor(tab){
        let that = this;
        window.user = this;
        // $('#menu_item_style').load('./customer.frame.'+window.parent.sets.lang+'.html #menu_item_style', function (response, status, xhr) {
        //
        // });

    }

    Close(cb) {
        window.user.SaveOrderItems(function(){
            $('tbody').empty();
            cb();
        });

        // $.tablesorter.destroy( $('table')[0], true, function () {
        //
        // });


    }

    InitUserOrders(){
        let that = this;
        $('tbody').empty();
        that.path  ='https://delivery-angels.ru/server/';
        if(host_port.includes('delivery-angels.ru'))
            that.path = host_port;
        $('#menu_item_tmplt').load('./customer.frame.html #menu_item_tmplt', function (response, status, xhr) {
            window.cart_cus = that;
            that.FillOrders();

        })
    }

    async FillOrders() {
        let that = this;

        $('.tablesorter').tablesorter({
            theme: 'bootstrap',
            headers: {
                // disable sorting of the first & second column - before we would have to had made two entries
                // note that "first-name" is a class on the span INSIDE the first column th cell
                '.nosorting': {
                    // disable it by setting the property sorter to false
                    sorter: false
                }
            },
            widthFixed: true,
            headerTemplate: '{content} {icon}', // Add icon for various themes
            widgets: ['zebra'],
            widgetOptions: {
                zebra: ["normal-row", "alt-row"]
            }
        });

        let date = window.parent.user.date;
        that.sum = 0;

        function defineAddressTextarea(sup){
            let val= '';
            if(sup.profile.type === 'deliver') {
                if (window.parent.user.profile.profile.address) {
                    val = window.parent.user.profile.profile.address;
                }
            }else{
                val= (sup.profile.place !== '' ? sup.profile.place : (sup.latitude + ';' + sup.longitude));
            }

            let ta = "<textarea type='text' class='form-control delivery_adr' style='width:300px;' placeholder='"+
            window.parent.sysdict.getDictValue(window.parent.sets.lang, 'введите адрес доставки')+"'>"+val+
            "</textarea>";

            return ta;
        }

        let order;
        for (let i in window.parent.user.orders) {
            if(!Object.keys(window.parent.user.orders[i].data)[0])
                continue;
            order = window.parent.user.orders[i];
            if(order.status && order.status.deleted)
                continue;
            let dict;

            let element = $(that).find('td.title');
            let inv_period = '', inv_qnty = '', tr_class = '', tr_disabled = '';
            //TODO:
            let pay = "<a href='#'>" + {'en': 'Pay:', 'ru': 'Оплатить:'}[window.parent.sets.lang] + "</a>";

            let promise = new Promise((resolve, reject) => {

                window.parent.db.GetSupplier(window.parent.user.date, order.supuid, async function (sup) {

                    let sel_period =
                        "<div style='margin-right: 10px; margin-left: 10px'>" +
                        "<input type='date' id='ts_date' style='width:100%;border-width: 0px;border-bottom-width: 1px;'>"+
                        "<div class='dropdown'  style='width:100%;'>" +
                        "<div class='sel_period btn btn-block dropdown-toggle' data-toggle='dropdown'" +
                        "    style='float:left;background-color:white;font-size: normal'>06:00 - 22:00" +
                        "</div>" +
                        "<div class='period_list dropdown-menu'>" +
                        "<a class='dropdown-item' href='#'>06:00 - 08:00</a>" +
                        "<a class='dropdown-item' href='#'>08:00 - 10:00</a>" +
                        "<a class='dropdown-item' href='#'>10:00 - 12:00</a>" +
                        "<a class='dropdown-item' href='#'>12:00 - 14:00</a>" +
                        "<a class='dropdown-item' href='#'>14:00 - 16:00</a>" +
                        "<a class='dropdown-item' href='#'>16:00 - 18:00</a>" +
                        "<a class='dropdown-item' href='#'>18:00 - 20:00</a>" +
                        "<a class='dropdown-item' href='#'>20:00 - 22:00</a>" +
                        "</div></div></div>";
                    let adr = defineAddressTextarea(sup);

                    let sum = 0;
                    for (let item in order.data) {

                        if (sup != -1) {

                            dict = new Dict(sup.dict.dict);
                            for (let o in order.data[item].ordlist) {
                                let ord = order.data[item].ordlist[o];
                                let extlist = '';
                                for (let e in order.data[item].extralist) {
                                    extlist += "<tr style='text-align: center;'>" +
                                        "<td></td>" +
                                        "<td>" + e + "</td>" +
                                        "<td>" + order.data[item].extralist[e].qnty + "</td>" +
                                        "<td>" + order.data[item].extralist[e].price + "</td>" +
                                        "<td></td>" +
                                        "<td></td>" +
                                        "<td></td>" +
                                        "<td></td>" +
                                        "</tr>";

                                    sum += parseInt(order.data[item].extralist[e].qnty) * order.data[item].extralist[e].price;
                                }
                                if (ord.qnty !== 0) {
                                    if (order.supuid && !$("tr." + order.supuid)[0]) {
                                        $("<tr class='supuid " + order.supuid + "' style='font-weight: bold;'>" +
                                            "<td class='ord_num tablesorter-no-sort'></td>" +
                                            "<td></td>" +
                                            "<td class='qnty'></td>" +
                                            "<td class='price'></td>" +
                                            "<td></td>" +
                                            "<td></td>" +
                                            "<td class='rtc'></td>" +
                                            "</tr>" +

                                            "<tr class='pay_supuid' supuid='" + order.supuid + "' profile_type='"+sup.profile.type+"'  tyle='text-align: center;'>" +
                                            "<td></td>" +
                                            "<td colspan='2'>" +
                                            "<i class='waiting_appr' style='display:none;font-size:15px'>" + window.parent.sysdict.getDictValue(window.parent.sets.lang, 'ждем подтверждения') + "</i>" +
                                            '<button type="button" class="publish_order" onclick="window.cart_cus.OnClickPublish(this)"' +
                                            ' style="display:none; border: 0px;width: auto;height:auto;background-color:#ccc;border-radius: 2px;">' + window.parent.sysdict.getDictValue(window.parent.sets.lang, "Заказать") + '' +
                                            '</button>' +
                                            "</td>" +
                                            "<td class='ord_sum tablesorter-no-sort'>0</td>" +
                                            "<td colspan='2' class='address tablesorter-no-sort' style='color: #0033cc; " +
                                            "display: flex;flex-direction: row;flex-wrap: nowrap;align-content: center;justify-content: flex-start;align-items: flex-start;'>" +
                                            sel_period + adr+
                                            "</td>" +
                                            "</tr>"
                                        ).appendTo($('tbody'));

                                    }
                                    const cat = order.data[item].cat;

                                    let src = '';
                                    let obj = _.find(sup.data[cat], { 'title': item });
                                        if(obj)
                                            src = obj.cert[0].src;

                                    const insert = $("<tr class='order_item'" +
                                        " orderdate='" + order.date + "' supuid='" + order.supuid + "' cusuid='" + order.cusuid + "' " +
                                        "title='" + item + "'  status='" + order.status + "'>" +
                                        "<td class='tablesorter-no-sort'>" +
                                        "</td>" +
                                        "</td>" +
                                        "<td class='row'>" +

                                        "<div class='col'>" +
                                        "<div>" + dict.getValByKey(window.parent.sets.lang, item) + "</div>" +
                                        "<div>" + o + "</div>" +
                                        "<div>" +
                                        "<img class='col' src='"+that.path+'images/'+src+"' style='width: auto; max-height: 80px'>" +
                                        "</div>" +
                                        "</div>" +
                                        "</td>" +
                                        "<td class='qnty'  unit='" + o + "'>" +

                                        "<span class='reduce_ord ctrl' onclick=window.user.onReduceClick(this,'"+order.supuid+"') " +
                                        "style='vertical-align:middle; font-size: large;color: blue'>" +
                                        "<i class='icofont-minus'></i>" +
                                        "</span>" +
                                        "<button class='ord_amount btn' style='border:0;background-color: transparent;outline: none;'>" + ord.qnty + "</button>" +
                                        "<span class='increase_ord ctrl' onclick=window.user.onIncreaseClick(this,'"+order.supuid+"')" +
                                        " style='vertical-align: middle ; font-size: large;color: red'>" +
                                        "<i class='icofont-plus'></i>" +
                                        "</span>" +
                                        "</div>" +
                                        "<div>" +
                                        "<i class='fa fa-trash' style='bottom: 0;right: 0;color:grey;-webkit-transform: scale(1.2);transform: scale(1.2);'" +
                                        " onclick=window.user.DeleteOrder(this)></i>" +
                                        "</div>" +
                                        "</td>" +
                                        "<td class='price'>" + ord.price + "</td>" +
                                        "<td class='comments tablesorter-no-sort'>" +
                                        "<textarea  class='tacomment' rows='4' style='width: 95%' placeholder='"+window.parent.sysdict.getDictValue(window.parent.sets.lang,'комментарии')+"'>" +
                                        (order.comments?order.comments:'')+
                                        "</textarea>" +
                                        "</td>" +
                                        "</tr>" +
                                        "<tr style='height: 5px;'></tr>" + extlist);

                                    if (order.status){
                                        if(order.status.ordered || order.status.approved)
                                            insert.insertAfter($("tr.supuid." + order.supuid));
                                        else if (order.status.checked)
                                            insert.insertBefore($("tr.pay_supuid[supuid='" + order.supuid + "']"));
                                    }

                                    sum += (parseFloat($("tr.pay_supuid[supuid='" + order.supuid + "']").find('td.ord_sum').text()) + parseFloat(ord.price) * ord.qnty);

                                    // if (sup.profile.place && sup.profile.type === 'marketer' || sup.profile.place && sup.profile.type === 'foodtruck') {
                                    //     $("tr." + order.supuid).find('.address').find('.place').text(sup.profile.place);
                                    //     $("tr." + order.supuid).find('.address').find('.delivery').text("забрать");
                                    //
                                    // }

                                }
                            }

                            $('.publish_order', $('tr.pay_supuid[supuid="' + order.supuid + '"]')).css('display', '');

                            if(order.status && order.status.ordered) {
                                $(".waiting_appr").css('display', '');
                                $('.publish_order', $('tr.pay_supuid[supuid="' + order.supuid + '"]')).css('display', 'none');
                            }
                        }

                        $('tr[supuid="' + order.supuid + '"]:first .comments').attr('rowspan', $('tr[supuid="' + order.supuid + '"]').length);

                        $('tr[supuid="' + order.supuid + '"]:not(:first) .tacomment').remove();
                        $('tr[supuid="' + order.supuid + '"] .tacomment').css('height', $('tr[supuid="' + order.supuid + '"] .tacomment').parent().css('height'))

                        if ( order.status && order.status.approved) {
                            $(".waiting_appr").css('display','').addClass('fa fa-handshake-o').text('');
                            $("tr." + order.supuid).find('.ord_num').text(order.number);
                        }
                    }

                    $("tr.pay_supuid[supuid='" + order.supuid + "']").find('td.ord_sum').text((sum).toFixed(0));

                    function isFloat(n) {
                        return n === +n && n !== (n|0);
                    }

                    async function setDeliveryAddress(supuid,resolve) {
                        let del_cost = '';//
                        let del_insert;
                        let dist = 0;
                        if($('.delivery_adr').val()) {
                            let loc_1;

                            let adr = $('.delivery_adr').val().split(';');

                            let promise = new Promise(function (res,reject) {

                                if(isFloat(parseFloat(adr[0])) && isFloat(parseFloat(adr[1]))){
                                    loc_1 = [parseFloat(adr[0]), parseFloat(adr[1])];
                                    res();
                                }else{
                                    let loc = JSON.parse(localStorage.getItem('cur_loc'));
                                    window.parent.user.map.geo.SearchPlace([loc.lat,loc.lon], 15, function (obj) {
                                        window.parent.user.map.geo.SearchLocation(obj.city+","+adr[0], function (loc) {
                                            loc_1 = loc;
                                            if(loc_1) {
                                                loc_1 = [proj.toLonLat(loc_1)[1],proj.toLonLat(loc_1)[0]];
                                            }else{
                                                loc_1 = window.parent.sets.coords.cur;
                                            }
                                            res();
                                        });

                                    })
                                }
                            });

                            await promise;

                            let utils = new UtilsMap();
                            dist = utils.getDistanceFromLatLonInKm(
                                loc_1[0],loc_1[1],
                                sup.latitude, sup.longitude);

                            if(dist && dist>sup.radius/1000){
                                $('.publish_order', $('tr.pay_supuid[supuid="' + order.supuid + '"]')).css('display','none');
                                del_insert = $(
                                    "<tr tr_delivery>" +
                                    "<td colspan='4'></td>"+
                                    "<td colspan='2'>"+window.parent.sysdict.getValByKey(window.parent.lang,"03489ebf8a5647ae07ac6b10408a5084")+"</td>" +
                                    "</tr>");
                                $("tr[tr_delivery]").remove();
                                del_insert.insertBefore($("tr.pay_supuid[supuid='" + supuid + "']"));
                                resolve();
                                return;
                            }
                            $('[tr_delivery]').remove();
                            if(dist) {
                                del_cost = parseFloat(sup.profile.del_price_per_dist) * Math.ceil(dist);
                            }else
                                del_cost = parseFloat(sup.profile.del_price_per_dist) * Math.ceil(sup.radius/1000);
                                del_insert = $(
                                    "<tr tr_delivery>" +
                                    "<td colspan='3'>Стоимость доставки: ("+Math.ceil(dist)+" km.)</td>" +
                                    "<td>" + del_cost + "</td>" +
                                    "<td></td>" +
                                    "<td></td>" +
                                    "</tr>");
                            order.delivery = {cost:del_cost, dist:Math.ceil(dist)};

                            if($('[tr_delivery]')[0])
                                $('[tr_delivery]').remove();
                            //$('.publish_order', $('tr.pay_supuid[supuid="' + supuid + '"]')).css('display','');
                            $("tr.pay_supuid[supuid='" + supuid + "']").find('td.ord_sum').text(sum+del_cost);
                            del_insert.insertBefore($("tr.pay_supuid[supuid='" + supuid + "']"));

                        }else {
                            $("tr[supuid='" + supuid + "']").find('.delivery_adr')[0].scrollIntoView();
                            $("tr[supuid='" + supuid + "']").find('.delivery_adr').focus();
                            $('.publish_order', $('tr.pay_supuid[supuid="' + supuid + '"]')).css('display','none');
                        }

                        resolve();
                    }

                    if(sup.profile.type === 'deliver' && sup.profile.del_price_per_dist) {
                        let del_prom = new Promise((resolve, reject) => {
                            setDeliveryAddress(order.supuid,resolve);
                            $("tr[supuid='" + order.supuid + "']").find('.delivery_adr').on('change', function (ev) {
                                let supuid = $(this).closest('tr').attr('supuid');
                                setDeliveryAddress(supuid,resolve);
                            });
                        });
                        await del_prom;
                    }

                    $('.sel_period').text( sup.profile.worktime? sup.profile.worktime:'06:00 - 22:00')

                    if(order.period)
                        $('.sel_period').text(order.period);

                    $('.dropdown-item').on('click', function (ev) {
                        $(ev.target).closest('.period_list').siblings('.sel_period').text($(ev.target).text());
                    });

                    $("tr[supuid='" + order.supuid + "']").find('input#ts_date').val(moment().format('YYYY-MM-DD'));

                    resolve();

                });
            });

            await promise;

            window.parent.sysdict.set_lang(window.parent.sets.lang,$('.tablesorter')[0])
        }

    }

    OnClickPublish(but){
        let supuid = $(but).closest('tr').attr('supuid');
        if($(but).closest('tr').attr('profile_type') === 'deliver' && !$('.pay_supuid[supuid="'+supuid+'"] .delivery_adr').val()) {
            $('.pay_supuid[supuid="'+supuid+'"] .delivery_adr').focus();
            $('.pay_supuid[supuid="'+supuid+'"] .delivery_adr').trigger('click');

            return;
        }
        $('[status="checked"][supuid="'+supuid+'"]').attr('status','ordered');

        let order = _.find(window.parent.user.orders, { 'supuid': supuid});
        order.period =  $('[supuid="'+supuid+'"] .sel_period').text();
        order.address = $('.pay_supuid[supuid="'+supuid+'"] .delivery_adr').val();
        order.comments = $('.order_item[supuid="'+supuid+'"] .tacomment').val();
        order.status = {ordered:window.parent.user.date};


        _.forEach(order.data, async function (value, key) {
            if (order.status.checked)
                order.status = {ordered:window.parent.user.date};

            for(let p in order.data) {
                let key = $('[title="' + p + '"] .qnty').attr('unit');
                //let key = _.findKey(order.data[p].ordlist,'qnty');
                if(key) {
                    order.data[p].ordlist[key]['qnty'] = parseInt($('[title="' + p + '"] .qnty .ord_amount').text());
                }
            }
            let promise = new Promise((resolve, reject) => {
                window.parent.user.PublishOrder(order, (data) => {
                    resolve(data);
                });
            });
            let data = await promise;
            window.parent.user.UpdateOrderLocal(data,()=>{});

            $('.publish_order',$('tr.pay_supuid[supuid="'+ supuid+'"]')).css('display', 'none');
            $('.loader').css('display', 'none');
            $(but).siblings('.waiting_appr').css('display', '');
            $('th[tabindex="0"]')[0].scrollIntoView();

        });

    }

    onIncreaseClick(el, supuid, order){
        $(el).siblings('.ord_amount').text(parseInt($(el).siblings('.ord_amount').text())+1);
        let sum = 0;
        let ar = $('.order_item[supuid="'+supuid+'"]').toArray();
        for(let i in ar) {
            let price = parseFloat($($('.order_item[supuid="'+supuid+'"]')[i]).find('td.price').text())
            let qnty = parseFloat($($('.order_item[supuid="'+supuid+'"]')[i]).find('td .ord_amount').text())

            sum+=price*qnty;
        }
        $(el).closest('tr').siblings('tr.pay_supuid[supuid=' + supuid + ']').find('.ord_sum').text(sum.toFixed(2))
        $(el).closest('tr').siblings('tr.pay_supuid[supuid=' + supuid + ']').find('.publish_order').css('display','');
        $(el).closest('tr').siblings('tr.pay_supuid[supuid=' + supuid + ']').find('.waiting_appr').css('display','none');

    }


    onReduceClick(el, supuid, order){

        if(parseInt($(el).siblings('.ord_amount').text())>0)
            $(el).siblings('.ord_amount').text(parseInt($(el).siblings('.ord_amount').text())-1);
        let sum = 0;
        let ar = $('.order_item[supuid="'+supuid+'"]').toArray();
        for(let i in ar) {
            let price = parseFloat($($('.order_item[supuid="'+supuid+'"]')[i]).find('td.price').text())
            let qnty = parseFloat($($('.order_item[supuid="'+supuid+'"]')[i]).find('td.qnty').text());

            sum+=price*qnty;
        }
        $(el).closest('tr').siblings('tr.pay_supuid[supuid=' + supuid + ']').find('.ord_sum').text(sum.toFixed(2));
        $(el).closest('tr').siblings('tr.pay_supuid[supuid=' + supuid + ']').find('.waiting_appr').css('display','none');
        $(el).closest('tr').siblings('tr.pay_supuid[supuid=' + supuid + ']').find('.publish_order').css('display','');
        if(sum===0)
            $(el).closest('tr').siblings('tr.pay_supuid[supuid=' + supuid + ']').find('.publish_order').css('display','none')
    }

    DeleteOrder(el) {
        let that = this;
        if(confirm(window.parent.sysdict.getDictValue(window.parent.sets.lang,"Удалить из заказа?"))){
            $(el).closest('tr').find('.qnty').text('0');
            window.parent.user.DeleteOrder(that.date,$(el).closest('tr').attr('title'),function () {
                that.SaveOrderItems(()=>{
                    $('tbody').empty();
                    that.FillOrders();
                })

                return;
            });
        }
    }

    async SaveOrderItems(cb){

        for(let o in window.parent.user.orders) {
            let order = window.parent.user.orders[o];
            for(let p in order.data) {
                if ($('[title="' + p + '"] .qnty:contains("0")').length>0) {
                    let key = $('[title="' + p + '"] .qnty:contains("0")').attr('unit');
                    //let key = _.findKey(order.data[p].ordlist,'qnty');
                    if(key) {
                        order.data[p].ordlist[key]['qnty'] = 0;
                        delete order.data[p].extralist;
                    }
                }
            }

            order.address = $('.delivery_adr').val();

            window.parent.db.SetObject('orderStore', order, function (res) {

            });
        }

        window.parent.user.SetOrdCnt();

        if(cb)
            cb();

    }


}


//////////////////
// WEBPACK FOOTER
// ./src/profile/profile.customer.js
// module id = 774
// module chunks = 9
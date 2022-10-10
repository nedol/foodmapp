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

        that.path  ="http://localhost:63342/d2d/server";
        if(host_port.includes('delivery-angels.com'))
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

        let order;
        for (let i in window.parent.user.orders) {
            if(!Object.keys(window.parent.user.orders[i].data)[0])
                continue;
            order = window.parent.user.orders[i];
            let dict;

            let element = $(that).find('td.title');
            let inv_period = '', inv_qnty = '', tr_class = '', tr_disabled = '';
            //TODO:
            let pay = "<a href='#'>" + {'en': 'Pay:', 'ru': 'Оплатить:'}[window.parent.sets.lang] + "</a>";

            let promise = new Promise((resolve, reject) => {

                window.parent.db.GetSupplier(window.parent.user.date, order.supuid, function (sup) {

                    let sel_period = sup.profile.worktime;
                    if (sup.profile.type === 'deliver') {
                        sel_period = "<div class='dropdown  d-inline-block'>" +
                            "<div class='sel_period btn btn-block dropdown-toggle' data-toggle='dropdown'" +
                            "    style='float:left;background-color:white;font-size: small'> 06:00 - 24:00" +
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
                            "<a class='dropdown-item' href='#'>22:00 - 24:00</a>" +
                            "</div>" +
                            "</div>"
                    }

                    for (let item in order.data) {

                        if (sup != -1) {
                            let sum = 0;

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
                                            "<td class='sup_name tablesorter-no-sort'></td>" +
                                            "<td></td>" +
                                            "<td class='qnty'></td>" +
                                            "<td class='price'></td>" +
                                            "<td></td>" +
                                            "<td></td>" +
                                            "<td class='rtc'></td>" +
                                            "</tr>" +

                                        "<tr class='pay_supuid' supuid='" + order.supuid + "' profile_type='"+sup.profile.type+"'  tyle='text-align: center;'>" +
                                            "<td></td>" +
                                            "<td class='tablesorter-no-sort' style='text-align: center;'>" +
                                            "</td>" +
                                            "<td>" +
                                            '<button type="button" class="publish_order" onclick="window.cart_cus.OnClickPublish(this)"' +
                                            ' style="display:none; border: 0px;width: auto;height:auto;background-color:white;border-radius: 2px;">' + window.parent.sysdict.getDictValue(window.parent.sets.lang, "Заказать") + '' +
                                            '</button>' +
                                            "</td>" +
                                            "<td class='ord_sum tablesorter-no-sort'>0</td>" +
                                            "<td  class='address tablesorter-no-sort' style='color: #0033cc'>" +
                                            (sup.profile.type === 'deliver' ?
                                                ("<textarea type='text' class='form-control delivery_adr' placeholder= '"+
                                                    (!window.parent.user.profile.profile.address?
                                                    window.parent.sysdict.getDictValue(window.parent.sets.lang,'введите адрес доставки'):
                                                    window.parent.user.profile.profile.address)
                                                    +"'>"+order.address+"</textarea>")
                                                : ('&#10240;')
                                    ) +
                                            "</td>" +
                                            "<td>" +
                                            "</td>" +
                                            "<td></td>" +
                                        "</tr>"
                                        ).appendTo($('tbody'));
                                        $("tr." + order.supuid).find('.sup_name').text(sup.profile.name);
                                    }

                                    let insert = $("<tr class='order_item'" +
                                        " orderdate='" + order.date + "' supuid='" + order.supuid + "' cusuid='" + order.cusuid + "' " +
                                            "title='" + item + "'  status='" + order.data[item].status + "'>" +
                                        "<td class='tablesorter-no-sort'>" +
                                        "<i class='place' rowspan='4'>" +
                                            (!$('tr.order_item[supuid=' + order.supuid +']')[0] && sup.profile.type === 'marketer' ? sup.profile.place : '') +
                                        "</i>" +
                                        "</td>" +
                                        "</td>" +
                                        "<td class='row'>" +
                                        // "<img class='col' src='"+order.data[item].image+"' style='max-width: 60px; max-height: 60px'>" +
                                        "<div class='col'>" +
                                        "<div>" + dict.getValByKey(window.parent.sets.lang, item) + "</div>" +
                                        "<div>" + o + "</div>" +
                                        "<div><img src=''></div>" +
                                        "</div>" +
                                        "</td>" +
                                        "<td class='qnty'  unit='" + o + "'>" +
                                        "<div>" +
                                        "<i class='waiting_appr' style='display:none;font-size:10px'>" + window.parent.sysdict.getDictValue(window.parent.sets.lang, 'ждем подтверждения') + "</i>" +
                                        "</div>" +
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
                                        " onclick='window.user.DeleteOrder(this)'></i>" +
                                        "</div>" +
                                        "</td>" +
                                        "<td class='price'>" + ord.price + "</td>" +
                                        "<td class='period'></td>" +
                                        "<td class='comments tablesorter-no-sort'>" +
                                        "<textarea  class='tacomment' rows='4' cols='30'>" +
                                        (order.comments?order.comments:'')+
                                        "</textarea>" +
                                        "</td>" +
                                        "<td  class='marketer'>" +
                                        "</td>" +
                                        "</tr>" +
                                        "<tr></tr>" + extlist);

                                    if (order.data[item]['status'] == 'ordered' || order.data[item]['status'] == 'approved')
                                        insert.insertAfter($("tr.supuid." + order.supuid));
                                    else if (order.data[item]['status'] == 'checked')
                                        insert.insertBefore($("tr.pay_supuid[supuid='" + order.supuid + "']"));

                                    sum += (parseFloat($("tr.pay_supuid[supuid='" + order.supuid + "']").find('td.ord_sum').text()) + parseFloat(ord.price) * ord.qnty);

                                    // if (sup.profile.place && sup.profile.type === 'marketer' || sup.profile.place && sup.profile.type === 'foodtruck') {
                                    //     $("tr." + order.supuid).find('.address').find('.place').text(sup.profile.place);
                                    //     $("tr." + order.supuid).find('.address').find('.delivery').text("забрать");
                                    //
                                    // }

                                    if ($('tr[status="checked"][supuid="' + order.supuid + '"]')[0])
                                        $('.publish_order', $('tr.pay_supuid[supuid="' + order.supuid + '"]')).css('display', '');
                                }


                                    window.parent.db.GetApproved(date, order.supuid, order.cusuid, function (appr) {
                                        if (appr && appr.data && appr.data[item].ordlist && appr.data[item].ordlist[o] &&
                                            order.data && order.data[item] && order.data[item].ordlist &&  order.data[item].ordlist[o] &&
                                            appr.data[item].ordlist[o].qnty === order.data[item].ordlist[o].qnty &&
                                            appr.data[item].ordlist[o].price === order.data[item].ordlist[o].price) {
                                            $("[title='" + item + "'][cusuid=" + order.cusuid + "] .waiting_appr").css('display','').addClass('fa fa-handshake-o').text('');

                                        }
                                    });
                            }

                            $("tr[status='ordered'][supuid='" + order.supuid + "'] .waiting_appr").css('display', '');

                            $("tr.pay_supuid[supuid='" + order.supuid + "']").find('td.ord_sum').text(sum.toFixed(2));

                        }

                        $('tr[supuid="' + order.supuid + '"]:first .tacomment').attr('rowspan', $('tr[supuid="' + order.supuid + '"]').length + 1);
                        $('tr[supuid="' + order.supuid + '"]:not(:first) .tacomment').remove();

                    }

                    $("tr[supuid='" + order.supuid + "'] .period:last").append(sel_period);

                    if(order.period)
                        $('.sel_period').text(order.period);

                    $('.dropdown-item').on('click', function (ev) {
                        $(ev.target).closest('.period_list').siblings('.sel_period').text($(ev.target).text());
                    });

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
        _.forEach(order.data, async function (value, key) {
            if (order.data[key]['status'] === 'checked')
                order.data[key]['status'] = 'ordered';

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

        });

        $('.publish_order',$('tr.pay_supuid[supuid="'+ supuid+'"]')).css('display', 'none');
        $('.loader').css('display', 'none');
        $('[status="ordered"] .waiting_appr').css('display', '');

        $('th[tabindex="0"]')[0].scrollIntoView();
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
        $(el).closest('td').find('.waiting_appr').css('display','none');

    }


    onReduceClick(el, supuid, order){

        if(parseInt($(el).siblings('.ord_amount').text())>0)
            $(el).siblings('.ord_amount').text(parseInt($(el).siblings('.ord_amount').text())-1);
        let sum = 0;
        let ar = $('.order_item[supuid="'+supuid+'"]').toArray();
        for(let i in ar) {
            let price = parseFloat($($('.order_item[supuid="'+supuid+'"]')[i]).find('td.price').text())
            let qnty = parseFloat($($('.order_item[supuid="'+supuid+'"]')[i]).find('td.qnty').text())
            sum+=price*qnty;
        }
        $(el).closest('tr').siblings('tr.pay_supuid[supuid=' + supuid + ']').find('.ord_sum').text(sum.toFixed(2))
        $(el).closest('tr').siblings('tr.pay_supuid[supuid=' + supuid + ']').find('.publish_order').css('display','');
        $(el).closest('td').find('.waiting_appr').css('display','none');
    }

    DeleteOrder(el) {
        let that = this;
        if(confirm(window.parent.sysdict.getDictValue(window.parent.sets.lang,"Удалить из заказа?"))){
            $(el).closest('tr').find('.qnty').text('0');
            that.SaveOrderItems(function () {
                $('tbody').empty();
                that.FillOrders();
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

            let promise = new Promise((resolve, reject) => {
                window.parent.user.PublishOrder(order, (data) => {
                    resolve(data);
                });
            });

            await promise;

            order.date = order.date;
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
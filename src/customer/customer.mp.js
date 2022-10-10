'use strict'

require('bootstrap');
// require('bootstrap-select');
import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';

const EventSource = NativeEventSource || EventSourcePolyfill;
// OR: may also need to set as global property
window.EventSource =  NativeEventSource || EventSourcePolyfill;

// import 'tablesorter/dist/css/theme.default.min.css';
// import 'tablesorter/dist/css/theme.blue.css';
// import 'tablesorter/dist/css/dragtable.mod.min.css';

require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');
// require('tablesorter/dist/js/widgets/widget-scroller.min.js');
// require('tablesorter/dist/js/extras/jquery.dragtable.mod.min.js');

import 'tablesorter/dist/css/theme.default.min.css';
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
        $('input').on('change', function (ev) {
            $(this).attr('changed', true);
        });

    }

    Close(cb) {

        $('tbody').empty();
        $.tablesorter.destroy( $('table')[0], true, function () {
            
        });
        cb();
    }

    InitUserOrders(){
        let that = this;

        that.path  ="http://localhost:63342/d2d/server";
        if(host_port.includes('delivery-angels.com'))
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
                    //TODO:
                    let pay = "<a href='#'>"+{'en':'Pay:','ru':'Оплатить:'}[window.parent.sets.lang]+"</a>";

                    for(let item in order.data) {
                        if (order.supuid && !$("tr."+order.supuid)[0]) {
                            $("<tr class='supuid " + order.supuid + "' style='text-align: center; font-weight: bold;" + tr_style + "' " + tr_disabled + ">" +
                                "<td class='sup_name tablesorter-no-sort'></td>" +
                                "<td  class='address tablesorter-no-sort' style='color: #0033cc'><a class='place'>" + order.address + "</a></td>" +
                                "<td " + inv_period + ">" + order.period + "</td>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td class='qnty'></td>" +
                                "<td class='price'></td>" +
                                "<td></td>" +
                                "<td class='rtc'></td>" +
                                "<td></td>" +
                            "</tr>"+
                            "<tr  class='pay_supuid "+ order.supuid + "' style='text-align: center;'>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td></td>" +
                                "<td class='tablesorter-no-sort' style='text-align: right;'></td>" +
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

                                        sum += parseInt(order.data[item].extralist[e].qnty) * order.data[item].extralist[e].price;
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
                                        //      "<script src=\"https://delivery-angels.com/rtc/common.js\"></script>" +
                                        //      "<script src=\"https://delivery-angels.com/rtc/host.js\"></script>" +
                                        //      "<script src=\"https://delivery-angels.com/rtc/loader.js\"></script>" +
                                        //      "<object   abonent=\"nedol@narod.ru\" components=\"audio browser video\"></object>" +
                                        "</td>" +
                                        "<td  class='trash'>" +
                                        "<i class='fa fa-trash' style='-webkit-transform: scale(1.5);transform: scale(1.5);'" +
                                        " onclick='window.user.DeleteOrder(this)'></i>" +
                                        "</td>" +
                                        "</tr><tr></tr>"+extlist).insertAfter($("tr.supuid." + order.supuid));

                                    sum += (parseFloat($("tr.pay_supuid."+order.supuid).find('td.ord_sum').text())+ parseFloat(ord.price) *ord.qnty);

                                    if (sup.profile.place && sup.profile.type === 'marketer' || sup.profile.place && sup.profile.type === 'foodtruck') {
                                        $("tr." + order.supuid).find('.address').find('.place').text(sup.profile.place);
                                        $("tr." + order.supuid).find('.address').find('.delivery').text("забрать");

                                    }
                                }
                                $("tr.pay_supuid."+order.supuid).find('td.ord_sum').text(sum.toFixed(2));
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

                    $('.tablesorter').tablesorter({
                        theme: 'blue',
                        headers: {
                            0: { sorter: "checkbox" }
                            //3: { sorter: "select" }
                            // 6: { sorter: "inputs" }
                            // 7: defaults to "shortDate", but set to "weekday-index" ("group-date-weekday") or "time" ("group-date-time")
                        },
                        widgets: ['group', 'zebra', 'column'],
                        usNumberFormat: false,
                        sortReset: true,
                        sortRestart: true,
                        sortInitialOrder: 'desc',
                        widthFixed: true,
                        widgetOptions: {
                            group_collapsible: true,  // make the group header clickable and collapse the rows below it.
                            group_collapsed: false, // start with all groups collapsed (if true)
                            group_saveGroups: true,  // remember collapsed groups
                            group_saveReset: '.group_reset', // element to clear saved collapsed groups
                            group_count: " ({num})", // if not false, the "{num}" string is replaced with the number of rows in the group

                            // apply the grouping widget only to selected column
                            group_forceColumn: [],   // only the first value is used; set as an array for future expansion
                            group_enforceSort: true, // only apply group_forceColumn when a sort is applied to the table

                            // checkbox parser text used for checked/unchecked values
                            group_checkbox: ['checked', 'unchecked'],

                            // change these default date names based on your language preferences (see Globalize section for details)
                            group_months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                            group_week: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                            group_time: ["AM", "PM"],

                            // use 12 vs 24 hour time
                            group_time24Hour: false,
                            // group header text added for invalid dates
                            group_dateInvalid: 'Invalid Date',
                        },
                        // this function is used when "group-date" is set to create the date string
                        // you can just return date, date.toLocaleString(), date.toLocaleDateString() or d.toLocaleTimeString()
                        // reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#Conversion_getter
                        group_dateString: function (date) {
                            return date.toLocaleString();
                        },

                        group_formatter: function (txt, col, table, c, wo, data) {
                            // txt = current text; col = current column
                            // table = current table (DOM); c = table.config; wo = table.config.widgetOptions
                            // data = group data including both group & row data
                            if (col === 7 && txt.indexOf("GMT") > 0) {
                                // remove "GMT-0000 (Xxxx Standard Time)" from the end of the full date
                                // this code is needed if group_dateString returns date.toString(); (not localeString)
                                txt = txt.substring(0, txt.indexOf("GMT"));
                            }
                            // If there are empty cells, name the group "Empty"
                            return txt === "" ? "Empty" : txt;
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
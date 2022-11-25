'use strict';

import proj from 'ol/proj';

require('bootstrap');
// require('bootstrap-select');
import 'bootstrap/dist/css/bootstrap.css';
// import 'tablesorter/dist/css/theme.default.min.css';
// import 'tablesorter/dist/css/theme.blue.css';
// import 'tablesorter/dist/css/dragtable.mod.min.css';

require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');
// require('tablesorter/dist/js/widgets/widget-scroller.min.js');
// require('tablesorter/dist/js/extras/jquery.dragtable.mod.min.js');
let _ = require('lodash');

import 'tablesorter/dist/css/theme.default.min.css';
import 'tablesorter/dist/css/theme.bootstrap_2.min.css';
import 'tablesorter/dist/css/widget.grouping.min.css';
import { CartCustomer } from '../customer/customer.cart';
import { Dict } from '../dict/dict.js';

let moment = require('moment/moment');
import { Utils } from '../utils/utils';
import { UtilsMap } from '../utils/utils.map';
let utils = new Utils();

window.InitCartCustomer = function () {
  if (!window.cart_cus) window.cart_cus = new CartCustomerStore();
  window.cart_cus.InitUserOrders();
};

export class CartCustomerStore extends CartCustomer {
  constructor() {
    super();
    let that = this;
    window.user = this;
    // $('#menu_item_style').load('./customer.frame.'+window.parent.sets.lang+'.html #menu_item_style', function (response, status, xhr) {
    //
    // });
  }

  async FillOrders() {
    let that = this;

    this.path = 'http://localhost:5500/d2d/server';
    if (host_port.includes('delivery-angels'))
      this.path = 'https://delivery-angels.store/server';
    else this.path = host_port;

    this.image_path = image_path;

    $('.tablesorter').tablesorter({
      theme: 'bootstrap',
      headers: {
        // disable sorting of the first & second column - before we would have to had made two entries
        // note that "first-name" is a class on the span INSIDE the first column th cell
        '.nosorting': {
          // disable it by setting the property sorter to false
          sorter: false,
        },
      },
      widthFixed: true,
      headerTemplate: '{content} {icon}', // Add icon for various themes
      widgets: ['zebra'],
      widgetOptions: {
        zebra: ['normal-row', 'alt-row'],
      },
    });

    let date = window.parent.user.date;
    that.sum = 0;

    let order;
    for (let i in window.parent.user.orders) {
      if (!Object.keys(window.parent.user.orders[i].data)[0]) continue;
      order = window.parent.user.orders[i];
      if (order.status && order.status['deleted']) continue;
      let dict;

      let element = $(that).find('td.title');
      let inv_period = '',
        inv_qnty = '',
        tr_class = '',
        tr_disabled = '';
      //TODO:
      let pay =
        "<a href='#'>" +
        { en: 'Pay:', ru: 'Оплатить:' }[window.parent.sets.lang] +
        '</a>';

      let promise = new Promise((resolve, reject) => {
        window.parent.db.GetSupplier(
          window.parent.user.date,
          order.supuid,
          async function (sup) {
            let sel_period =
              "<div style='margin-right: 10px; margin-left: 10px'>" +
              '<div>' +
              "<input type='date' id='ts_date' style='width:100%;border-width: 0px;border-bottom-width: 1px;'>" +
              '</div>' +
              "<div class='dropdown'  style='width:100%;'>" +
              "<div class='sel_period btn btn-block dropdown-toggle' data-toggle='dropdown'" +
              "    style='float:left;background-color:white;font-size: normal'>06:00 - 22:00" +
              '</div>' +
              "<div class='period_list dropdown-menu'>" +
              "<a class='dropdown-item' href='#'>06:00 - 08:00</a>" +
              "<a class='dropdown-item' href='#'>08:00 - 10:00</a>" +
              "<a class='dropdown-item' href='#'>10:00 - 12:00</a>" +
              "<a class='dropdown-item' href='#'>12:00 - 14:00</a>" +
              "<a class='dropdown-item' href='#'>14:00 - 16:00</a>" +
              "<a class='dropdown-item' href='#'>16:00 - 18:00</a>" +
              "<a class='dropdown-item' href='#'>18:00 - 20:00</a>" +
              "<a class='dropdown-item' href='#'>20:00 - 22:00</a>" +
              '</div></div></div>';

            let sum = 0;
            for (let item in order.data) {
              if (sup != -1) {
                dict = new Dict(sup.dict.dict);
                for (let o in order.data[item].ordlist) {
                  let ord = order.data[item].ordlist[o];
                  let extlist = '';
                  for (let e in order.data[item].extralist) {
                    extlist +=
                      "<tr style='text-align: center;'>" +
                      '<td></td>' +
                      '<td>' +
                      e +
                      '</td>' +
                      '<td>' +
                      order.data[item].extralist[e].qnty +
                      '</td>' +
                      '<td>' +
                      order.data[item].extralist[e].price +
                      '</td>' +
                      '<td></td>' +
                      '<td></td>' +
                      '<td></td>' +
                      '<td></td>' +
                      '</tr>';

                    sum +=
                      parseInt(order.data[item].extralist[e].qnty) *
                      order.data[item].extralist[e].price;
                  }
                  if (ord.qnty !== 0) {
                    if (order.supuid && !$('tr.' + order.supuid)[0]) {
                      $(
                        "<tr class='supuid " +
                          order.supuid +
                          "' style='font-weight: bold;'>" +
                          "<td class='ord_num tablesorter-no-sort'></td>" +
                          '<td></td>' +
                          "<td class='qnty'></td>" +
                          "<td class='price'></td>" +
                          '<td></td>' +
                          '<td></td>' +
                          "<td class='rtc'></td>" +
                          '</tr>' +
                          "<tr class='pay_supuid' supuid='" +
                          order.supuid +
                          "' profile_type='" +
                          sup.profile.type +
                          "'  tyle='text-align: center;'>" +
                          '<td></td>' +
                          "<td colspan='2'>" +
                          "<i class='waiting_appr' style='display:none;font-size:15px'>" +
                          window.parent.sysdict.getDictValue(
                            window.parent.sets.lang,
                            'ждем подтверждения'
                          ) +
                          '</i>' +
                          '<button type="button" class="publish_order" onclick="window.cart_cus.OnClickPublish(this)"' +
                          ' style="display:none; border: 0px;width: auto;height:auto;background-color:#ccc;border-radius: 2px;">' +
                          window.parent.sysdict.getDictValue(
                            window.parent.sets.lang,
                            'Заказать'
                          ) +
                          '' +
                          '</button>' +
                          '</td>' +
                          "<td class='ord_sum tablesorter-no-sort'>0</td>" +
                          "<td colspan='2' class='address tablesorter-no-sort' style='color: #0033cc; " +
                          "display: flex;flex-direction: row;flex-wrap: nowrap;align-content: center;justify-content: flex-start;align-items: flex-start;'>" +
                          sel_period +
                          (sup.profile.type === 'deliver'
                            ? "<textarea type='text' class='form-control delivery_adr' style='width:300px;' placeholder= '" +
                              (!window.parent.user.profile.profile.address
                                ? window.parent.sysdict.getDictValue(
                                    window.parent.sets.lang,
                                    'введите адрес доставки'
                                  )
                                : window.parent.user.profile.profile.address) +
                              "'>" +
                              window.parent.user.profile.profile.address +
                              '</textarea>'
                            : "<textarea type='text' readonly class='form-control sup_adr' style='width:300px;'>" +
                              (sup.profile.place !== ''
                                ? sup.profile.place
                                : sup.latitude + ';' + sup.longitude) +
                              '</textarea>') +
                          '</td>' +
                          '</tr>'
                      ).appendTo($('tbody'));
                    }
                    const cat = order.data[item].cat;

                    let src = _.find(sup.data[cat], { title: item }).cert[0]
                      .src;

                    const insert = $(
                      "<tr class='order_item'" +
                        " orderdate='" +
                        order.date +
                        "' supuid='" +
                        order.supuid +
                        "' cusuid='" +
                        order.cusuid +
                        "' " +
                        "title='" +
                        item +
                        "'  status='" +
                        order.data[item].status +
                        "'>" +
                        "<td class='tablesorter-no-sort'>" +
                        "<div style='height: 80px;display: inline-flex;'>" +
                        "<img class='col' src='" +
                        that.image_path +
                        src +
                        "'>" +
                        '</div>' +
                        '</td>' +
                        '</td>' +
                        "<td class='row'>" +
                        "<div class='col'>" +
                        '<div>' +
                        dict.getValByKey(window.parent.sets.lang, item) +
                        '</div>' +
                        '<div>' +
                        o +
                        '</div>' +
                        '</div>' +
                        '</td>' +
                        "<td class='qnty'  unit='" +
                        o +
                        "'>" +
                        "<span class='reduce_ord ctrl' onclick=window.user.onReduceClick(this,'" +
                        order.supuid +
                        "') " +
                        "style='vertical-align:middle; font-size: large;color: blue'>" +
                        "<i class='icofont-minus'></i>" +
                        '</span>' +
                        "<button class='ord_amount btn' style='border:0;background-color: transparent;outline: none;'>" +
                        ord.qnty +
                        '</button>' +
                        "<span class='increase_ord ctrl' onclick=window.user.onIncreaseClick(this,'" +
                        order.supuid +
                        "')" +
                        " style='vertical-align: middle ; font-size: large;color: red'>" +
                        "<i class='icofont-plus'></i>" +
                        '</span>' +
                        '</div>' +
                        '<div>' +
                        "<i class='fa fa-trash' style='bottom: 0;right: 0;color:grey;-webkit-transform: scale(1.2);transform: scale(1.2);'" +
                        ' onclick=window.user.DeleteOrder(this)></i>' +
                        '</div>' +
                        '</td>' +
                        "<td class='price'>" +
                        ord.price +
                        '</td>' +
                        "<td class='comments tablesorter-no-sort'>" +
                        "<textarea  class='tacomment' rows='4' style='width: 95%' placeholder='" +
                        window.parent.sysdict.getValByKey(
                          window.parent.lang,
                          'a5d491060952aa8ad5fdee071be752de'
                        ) +
                        "'>" +
                        (order.comments ? order.comments : '') +
                        '</textarea>' +
                        '</td>' +
                        '</tr>' +
                        "<tr style='height: 5px;'></tr>" +
                        extlist
                    );

                    if (
                      order.data[item]['status'] == 'ordered' ||
                      order.data[item]['status'] == 'approved'
                    )
                      insert.insertAfter($('tr.supuid.' + order.supuid));
                    else if (order.data[item]['status'] == 'checked')
                      insert.insertBefore(
                        $("tr.pay_supuid[supuid='" + order.supuid + "']")
                      );

                    sum +=
                      parseFloat(
                        $("tr.pay_supuid[supuid='" + order.supuid + "']")
                          .find('td.ord_sum')
                          .text()
                      ) +
                      parseFloat(ord.price) * ord.qnty;

                    // if (sup.profile.place && sup.profile.type === 'marketer' || sup.profile.place && sup.profile.type === 'foodtruck') {
                    //     $("tr." + order.supuid).find('.address').find('.place').text(sup.profile.place);
                    //     $("tr." + order.supuid).find('.address').find('.delivery').text("забрать");
                    //
                    // }
                  }
                }

                if (order.status && order.status['ordered']) {
                  $('.waiting_appr').css('display', '');
                } else {
                  $(
                    '.publish_order',
                    $('tr.pay_supuid[supuid="' + order.supuid + '"]')
                  ).css('display', '');
                }
              }

              $('tr[supuid="' + order.supuid + '"]:first .comments').attr(
                'rowspan',
                $('tr[supuid="' + order.supuid + '"]').length - 1
              );

              $(
                'tr[supuid="' + order.supuid + '"]:not(:first) .tacomment'
              ).remove();
              $('tr[supuid="' + order.supuid + '"] .tacomment').css(
                'height',
                $('tr[supuid="' + order.supuid + '"] .tacomment')
                  .parent()
                  .css('height')
              );

              if (order.status && order.status['approved']) {
                $('.waiting_appr')
                  .css('display', '')
                  .addClass('fa fa-handshake-o')
                  .text('');
                $('tr.' + order.supuid)
                  .find('.ord_num')
                  .text(order.number);
              }
            }

            $("tr.pay_supuid[supuid='" + order.supuid + "']")
              .find('td.ord_sum')
              .text(sum.toFixed(0));

            function isFloat(n) {
              return n === +n && n !== (n | 0);
            }

            async function setDeliveryAddress(resolve) {
              let del_cost = ''; //
              let del_insert;
              let dist = 0;
              if ($('.delivery_adr').val()) {
                let loc_1;

                let adr = $('.delivery_adr').val().split(';');

                let promise = new Promise(function (res, reject) {
                  if (
                    isFloat(parseFloat(adr[0])) &&
                    isFloat(parseFloat(adr[1]))
                  ) {
                    loc_1 = [parseFloat(adr[0]), parseFloat(adr[1])];
                    res();
                  } else {
                    window.parent.user.map.geo.SearchLocation(
                      adr[0],
                      function (loc) {
                        loc_1 = loc;
                        if (loc_1) {
                          loc_1 = [loc_1[1], loc_1[0]];
                        } else {
                          loc_1 = window.parent.sets.coords.cur;
                        }
                        res();
                      }
                    );
                  }
                });

                await promise;

                let utils = new UtilsMap();
                dist = utils.getDistanceFromLatLonInKm(
                  loc_1[0],
                  loc_1[1],
                  sup.latitude,
                  sup.longitude
                );

                if (dist && dist > sup.radius / 1000) {
                  $(
                    '.publish_order',
                    $('tr.pay_supuid[supuid="' + order.supuid + '"]')
                  ).css('display', 'none');
                  del_insert = $(
                    '<tr tr_delivery>' +
                      "<td colspan='4'></td>" +
                      "<td colspan='2'>" +
                      window.parent.sysdict.getValByKey(
                        window.parent.lang,
                        '03489ebf8a5647ae07ac6b10408a5084'
                      ) +
                      '</td>' +
                      '</tr>'
                  );
                  del_insert.insertBefore(
                    $("tr.pay_supuid[supuid='" + order.supuid + "']")
                  );
                  resolve();
                  return;
                }
                $('[tr_delivery]').remove();
                if (dist) {
                  del_cost =
                    parseFloat(sup.profile.del_price_per_dist) *
                    Math.ceil(dist);
                } else
                  del_cost =
                    parseFloat(sup.profile.del_price_per_dist) *
                    Math.ceil(sup.radius / 1000);
                if (del_cost)
                  del_insert = $(
                    '<tr tr_delivery>' +
                      "<td colspan='3'>Стоимость доставки (" +
                      Math.ceil(dist) +
                      ' km.)</td>' +
                      '<td>' +
                      del_cost.toFixed(2) +
                      '</td>' +
                      '<td></td>' +
                      '<td></td>' +
                      '</tr>'
                  );

                if ($('[tr_delivery]')[0]) $('[tr_delivery]').remove();
                $(
                  '.publish_order',
                  $('tr.pay_supuid[supuid="' + order.supuid + '"]')
                ).css('display', '');
                $("tr.pay_supuid[supuid='" + order.supuid + "']")
                  .find('td.ord_sum')
                  .text(sum + (del_cost ? del_cost : 0));
                if (del_insert)
                  del_insert.insertBefore(
                    $("tr.pay_supuid[supuid='" + order.supuid + "']")
                  );
              } else {
                $("tr[supuid='" + order.supuid + "']")
                  .find('.delivery_adr')[0]
                  .scrollIntoView();
              }

              resolve();
            }

            if (
              sup.profile.type === 'deliver' &&
              sup.profile.del_price_per_dist
            ) {
              let del_prom = new Promise((resolve, reject) => {
                setDeliveryAddress(resolve);
                $("tr[supuid='" + order.supuid + "']")
                  .find('.delivery_adr')
                  .on('change', function (ev) {
                    setDeliveryAddress(resolve);
                  });
              });
              await del_prom;
            }

            $('.sel_period').text(
              sup.profile.worktime ? sup.profile.worktime : '06:00 - 22:00'
            );

            if (order.period) $('.sel_period').text(order.period);

            $('.dropdown-item').on('click', function (ev) {
              $(ev.target)
                .closest('.period_list')
                .siblings('.sel_period')
                .text($(ev.target).text());
            });

            $("tr[supuid='" + order.supuid + "']")
              .find('input#ts_date')
              .val(moment().format('YYYY-MM-DD'));

            resolve();
          }
        );
      });

      await promise;

      window.parent.sysdict.set_lang(
        window.parent.sets.lang,
        $('.tablesorter')[0]
      );
    }
  }

  async SaveOrderItems(cb) {
    for (let o in window.parent.user.orders) {
      let order = window.parent.user.orders[o];
      for (let p in order.data) {
        if ($('[title="' + p + '"] .qnty:contains("0")').length > 0) {
          let key = $('[title="' + p + '"] .qnty:contains("0")').attr('unit');
          //let key = _.findKey(order.data[p].ordlist,'qnty');
          if (key) {
            order.data[p].ordlist[key]['qnty'] = 0;
            delete order.data[p].extralist;
          }
        }
      }

      order.date = moment($('#ts_date').val()).format('YYYY-MM-DD');

      order.address = $('.delivery_adr').val();

      window.parent.db.SetObject('orderStore', order, function (res) {});
    }

    window.parent.user.SetOrdCnt();

    if (cb) cb();
  }

  DeleteOrder(supuid) {
    let that = this;

    $('tbody').empty();
    $('.ord_cnt').text(0);
    let obj = window.parent.user.orders[0];
    window.parent.user.orders[0].data = {};
    if (obj.status) {
      obj.supuid = supuid;
      obj.status = 'deleted';
      window.parent.user.PublishOrder(obj, () => {});
    }

    return;
  }

  DeleteFromOrder(el) {
    $('tbody').empty();
    let title = $(el).closest('.order_item').attr('title');
    delete window.parent.user.orders[0].data[title];
    $('.ord_cnt').text(Object.keys(window.parent.user.orders[0].data).length);
    if (Object.keys(window.parent.user.orders[0].data).length > 0)
      this.FillOrders();
    else if (window.parent.user.orders[0].status)
      this.DeleteOrder(window.parent.sets.supuid);
  }
}

//////////////////
// WEBPACK FOOTER
// ./src/profile/profile.customer.js
// module id = 774
// module chunks = 9

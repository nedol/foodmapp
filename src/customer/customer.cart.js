'use strict';

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

import { UtilsMap } from '../utils/utils.map.js';
import proj from 'ol/proj';
var moment = require('moment/moment');
import 'tablesorter/dist/css/theme.default.min.css';
import 'tablesorter/dist/css/theme.blue.css';
import 'tablesorter/dist/css/widget.grouping.min.css';
import { Dict } from '../dict/dict.js';
import { Utils } from '../utils/utils';

let utils = new Utils();

window.InitCartCustomer = function () {
  if (!window.cart_cus) window.cart_cus = new CartCustomer();
  window.cart_cus.InitUserOrders();
};

export class CartCustomer {
  constructor(tab) {
    let that = this;
    window.user = this;
    // $('#menu_item_style').load('./customer.frame.'+window.parent.sets.lang+'.html #menu_item_style', function (response, status, xhr) {
    //
    // });
  }

  Close(cb) {
    window.user.SaveOrderItems(function () {
      $('tbody').empty();
      cb();
    });

    // $.tablesorter.destroy( $('table')[0], true, function () {
    //
    // });
  }

  InitUserOrders() {
    let that = this;
    $('tbody').empty();
    that.path = 'https://nedol.ru/server/';
    if (host_port.includes('nedol.ru')) that.path = host_port;

    that.image_path = image_path;

    $('#menu_item_tmplt').load(
      './customer.frame.html #menu_item_tmplt',
      function (response, status, xhr) {
        window.cart_cus = that;
        that.FillOrders();
      }
    );
  }

  CheckDeliverAddress(adr) {
    return new Promise(function (resolve, reject) {
      let loc_1 = [parseFloat(adr[0]), parseFloat(adr[1])];
      if (
        utils.isFloat(parseFloat(adr[0])) &&
        utils.isFloat(parseFloat(adr[1]))
      ) {
        resolve(loc_1);
      } else {
        let loc = JSON.parse(localStorage.getItem('cur_loc'));
        window.parent.user.map.geo.SearchPlace(
          [loc.lat, loc.lon],
          15,
          function (obj) {
            window.parent.user.map.geo.SearchLocation(
              obj.city + ',' + adr,
              function (loc) {
                loc_1 = loc;
                if (loc_1) {
                  loc_1 = [proj.toLonLat(loc_1)[1], proj.toLonLat(loc_1)[0]];
                } else {
                  loc_1 = proj.toLonLat(window.parent.sets.coords.cur);
                }
                resolve(loc_1);
              }
            );
          }
        );
      }
    });
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

    function defineAddressTextarea(sup) {
      let val = '';

      if (sup.profile.type === 'marketer') {
        val = sup.profile.place;
        //sup.profile.place !== ''
        //   ? sup.profile.place
        //   : sup.latitude + ';' + sup.longitude;
      } else if (sup.profile.type === 'foodtruck') {
        val = sup.address;
      } else if (sup.profile.type === 'deliver') {
        val = order.address
          ? order.address
          : window.parent.user.profile.profile.address
          ? window.parent.user.profile.profile.address
          : '';
      }

      if (!order.status.checked) {
        val = order.address;
      }

      let ta =
        "<textarea type='text' class='form-control delivery_adr' style='width:100%;' placeholder='" +
        window.parent.sysdict.getDictValue(
          window.parent.sets.lang,
          'введите адрес доставки'
        ) +
        "'>" +
        val +
        '</textarea>';

      return ta;
    }

    let order;
    for (let i in window.parent.user.orders) {
      if (!Object.keys(window.parent.user.orders[i].data)[0]) continue;
      order = window.parent.user.orders[i];
      if (order.status && order.status.deleted) continue;
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
              "<div style='margin-right: 10px; margin-left: 10px;'>" +
              "<input type='date' id='ts_date' style='width:100%;border-width: 0px;border-bottom-width: 1px;text-align:center;'>" +
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

            let adr = defineAddressTextarea(sup);

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
                          "<td colspan='1' style='display: inline-flex;'>" +
                          "<i class='order_delivery' style='display:none;'>" +
                          window.parent.sysdict.getDictValue(
                            window.parent.sets.lang,
                            'ждем подтверждения'
                          ) +
                          '</i>' +
                          '<button type="button" class="pickup_order order" onclick="window.cart_cus.OnClickPickup(this)"' +
                          ' style="display:none;">' +
                          window.parent.sysdict.getDictValue(
                            window.parent.sets.lang,
                            'Зарезервировать'
                          ) +
                          '' +
                          '</button>' +
                          '<button type="button" class="delivery_order order" onclick="window.cart_cus.OnClickDelivery(this)"' +
                          ' style="display:none;">' +
                          window.parent.sysdict.getDictValue(
                            window.parent.sets.lang,
                            'Заказать доставку'
                          ) +
                          '' +
                          '</button>' +
                          '</td>' +
                          "<td  class='address tablesorter-no-sort' style='color: #0033cc; " +
                          "align-content: center;justify-content: flex-start;align-items: flex-start;'>" +
                          adr +
                          '</td>' +
                          '<td>' +
                          sel_period +
                          '</td > ' +
                          "<td class='ord_sum tablesorter-no-sort'>0</td>" +
                          '</tr>'
                      ).appendTo($('tbody'));
                    }
                    const cat = order.data[item].cat;

                    let src = '';
                    let obj = _.find(sup.data[cat], { title: item });
                    if (obj) src = obj.cert[0].src;

                    if (order.address) {
                    }

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
                        '<div>' +
                        "<img class='col' src='" +
                        that.image_path +
                        src +
                        "' style='width: auto; max-height: 80px'>" +
                        '</div>' +
                        '</td>' +
                        '</td>' +
                        "<td class='row'>" +
                        "<div class='col'>" +
                        '<div class="item_title">' +
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
                        window.parent.sysdict.getDictValue(
                          window.parent.sets.lang,
                          'комментарии'
                        ) +
                        "'>" +
                        (order.comments ? order.comments : '') +
                        '</textarea>' +
                        '</td>' +
                        '</tr>' +
                        '<tr></tr>' +
                        extlist
                    );

                    if (order.data[item].status) {
                      if (
                        order.data[item].status === 'ordered' ||
                        order.data[item].status === 'approved'
                      )
                        insert.insertAfter($('tr.supuid.' + order.supuid));
                      else if (order.data[item].status === 'checked')
                        insert.insertBefore(
                          $("tr.pay_supuid[supuid='" + order.supuid + "']")
                        );
                    }

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

                if (
                  sup.profile.type === 'deliver' ||
                  //продавец с доставкой
                  ((sup.profile.type === 'marketer' ||
                    sup.profile.type === 'foodtruck') &&
                    sup.profile.delivery &&
                    order.status &&
                    order.status.checked)
                ) {
                  $(
                    '.delivery_order',
                    $('tr.pay_supuid[supuid="' + order.supuid + '"]')
                  ).css('display', '');
                }
                if (
                  (sup.profile.type === 'marketer' ||
                    sup.profile.type === 'foodtruck') &&
                  order.status &&
                  order.status.checked
                ) {
                  $(
                    '.pickup_order',
                    $('tr.pay_supuid[supuid="' + order.supuid + '"]')
                  ).css('display', '');
                }

                if (order.status && !order.status.checked) {
                  $(
                    '.order_delivery',
                    $('tr.pay_supuid[supuid="' + order.supuid + '"]')
                  ).css('display', '');
                  $(
                    '.order',
                    $('tr.pay_supuid[supuid="' + order.supuid + '"]')
                  ).css('display', 'none');
                  $(
                    '.delivery_adr',
                    $('tr.pay_supuid[supuid="' + order.supuid + '"]')
                  )
                    .attr('disabled', 'true')
                    .attr('placeholder', '');
                }
              }

              $('tr[supuid="' + order.supuid + '"]:first .comments').attr(
                'rowspan',
                $('tr[supuid="' + order.supuid + '"]').length
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

              if (order.status && order.status.approved) {
                $(
                  '.order_delivery',
                  $("tr.pay_supuid[supuid='" + order.supuid + "']")
                )
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
              .text(sum.toFixed(2));

            async function setDeliveryAddress(supuid, resolve) {
              const context = $("tr.pay_supuid[supuid='" + supuid + "']");
              let del_cost = ''; //
              let del_insert;
              let dist = 0;

              if (order.status.checked)
                if ($('.delivery_adr', context).val()) {
                  let adr = $('.delivery_adr', context).val().split(';');

                  const loc_1 = await that.CheckDeliverAddress(adr[0]);
                  if (!loc_1) {
                    $('.delivery_adr', context).val('');
                    $('.delivery_order', context).css('display', '');
                    $('.order_deliver', context).css('display', 'none');
                    return;
                  }

                  $('.delivery_adr', context).removeClass('alarm');

                  let utils = new UtilsMap();
                  dist = utils.getDistanceFromLatLonInKm(
                    loc_1[0],
                    loc_1[1],
                    sup.latitude,
                    sup.longitude
                  );

                  if (dist && dist > sup.radius / 1000) {
                    $('.pickup_order', context).css('display', 'none');

                    $('.delivery_adr', context).val('');
                    $('.delivery_adr', context)
                      .addClass('alarm')
                      .attr(
                        'placeholder',
                        window.parent.sysdict.getValByKey(
                          window.parent.sets.lang,
                          '03489ebf8a5647ae07ac6b10408a5084'
                        )
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
                        "<td colspan='3'>Стоимость доставки: (" +
                        Math.ceil(dist) +
                        ' km.)</td>' +
                        '<td>' +
                        del_cost +
                        '</td>' +
                        '<td></td>' +
                        '<td></td>' +
                        '</tr>'
                    );
                  order.delivery = { cost: del_cost, dist: Math.ceil(dist) };

                  if ($('[tr_delivery]', context))
                    $('[tr_delivery]', context).remove();
                  //$('.pickup_order', $('tr.pay_supuid[supuid="' + supuid + '"]')).css('display','');
                  $('td.ord_sum', context).text(
                    sum + (del_cost ? del_cost : 0)
                  );
                  if (del_insert)
                    del_insert.insertBefore(
                      $("tr.pay_supuid[supuid='" + supuid + "']")
                    );
                } else {
                  const el = $('.delivery_adr', context);
                  if (el[0]) el[0].scrollIntoView();
                  el.focus();
                  $('.pickup_order', context).css('display', 'none');
                }

              resolve();
            }

            if (sup.profile.type === 'deliver') {
              let del_prom = new Promise((resolve, reject) => {
                setDeliveryAddress(order.supuid, resolve);
                $("tr[supuid='" + order.supuid + "']")
                  .find('.delivery_adr')
                  .on('change', function (ev) {
                    let supuid = $(this).closest('tr').attr('supuid');
                    setDeliveryAddress(supuid, resolve);
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
              .val(moment(window.parent.user.date).format('YYYY-MM-DD'));

            resolve();
          }
        );
      });

      await promise;

      window.parent.sysdict.set_lang(
        window.parent.sets.lang,
        $('.tablesorter')[0]
      );

      $('.sel_period').on('change', that.OnChangePeriod);
    }
  }

  OnChangePeriod(ev) {}

  OnClickPickup(but) {
    let supuid = $(but).closest('tr').attr('supuid');
    if (
      $(but).closest('tr').attr('profile_type') === 'deliver' &&
      !$('.pay_supuid[supuid="' + supuid + '"] .delivery_adr').val()
    ) {
      $('.pay_supuid[supuid="' + supuid + '"] .delivery_adr').focus();
      $('.pay_supuid[supuid="' + supuid + '"] .delivery_adr').trigger('click');

      return;
    }
    $('[status="checked"][supuid="' + supuid + '"]').attr('status', 'ordered');

    let order = _.find(window.parent.user.orders, { supuid: supuid });
    order.period = $('[supuid="' + supuid + '"] .sel_period').text();
    order.address = $(
      '.pay_supuid[supuid="' + supuid + '"] .delivery_adr'
    ).val();
    order.comments = $('.order_item[supuid="' + supuid + '"] .tacomment').val();
    order.status = { ordered: window.parent.user.date };

    _.forEach(order.data, async function (value, key) {
      if (order.status.checked)
        order.status = { ordered: window.parent.user.date };

      for (let p in order.data) {
        let key = $('[title="' + p + '"] .qnty').attr('unit');
        //let key = _.findKey(order.data[p].ordlist,'qnty');
        if (key) {
          order.data[p].ordlist[key]['qnty'] = parseInt(
            $('[title="' + p + '"] .qnty .ord_amount').text()
          );
        }
      }
      let promise = new Promise((resolve, reject) => {
        window.parent.user.PublishOrder(order, (data) => {
          resolve(data);
        });
      });
      let data = await promise;
      window.parent.user.UpdateOrderLocal(data, () => {});

      $('.order', $('tr.pay_supuid[supuid="' + supuid + '"]')).css(
        'display',
        'none'
      );
      $('.loader').css('display', 'none');
      $(but).siblings('.order_delivery').css('display', '');
      $('th[tabindex="0"]')[0].scrollIntoView();
    });
  }

  async OnClickDelivery(but) {
    let supuid = $(but).closest('tr').attr('supuid');

    let order = _.find(window.parent.user.orders, { supuid: supuid });

    if (!$('.delivery_adr', $(but).closest('tr')).text()) {
      $('.pickup_order').css('display', 'none');
      return;
    }

    $('.delivery_adr', $(but).closest('tr')).text(
      window.parent.user.profile.profile.address
    );
    const address = window.parent.user.profile.profile.address;

    const loc = await this.CheckDeliverAddress(address);

    if (loc) {
      $('.delivery_adr', $(but).closest('tr')).text(address);

      order = _.find(window.parent.user.orders, { supuid: supuid });
      order.status = { ordered: window.parent.user.date };
      order.address = address;
      $('[status="checked"][supuid="' + supuid + '"]').attr(
        'status',
        'ordered'
      );
    } else {
      $('.pay_supuid[supuid="' + supuid + '"] .delivery_adr').val('');
      // $('.pay_supuid[supuid="' + supuid + '"] .delivery_adr')
      $('.pickup_order', $('tr.pay_supuid[supuid="' + supuid + '"]')).css(
        'display',
        'none'
      );

      return;
    }

    let promise = new Promise((resolve, reject) => {
      window.parent.user.PublishOrder(order, (data) => {
        resolve(data);
      });
    });

    let data = await promise;

    window.parent.user.UpdateOrderLocal(data, () => {});

    $(
      '.pickup_order, .delivery_order',
      $('tr.pay_supuid[supuid="' + supuid + '"]')
    ).css('display', 'none');
    $('.loader').css('display', 'none');
    $(but).siblings('.order_delivery').css('display', '');
    $('th[tabindex="0"]')[0].scrollIntoView();

    //return;

    if (
      $(but).closest('tr').attr('profile_type') === 'deliver' &&
      !$('.pay_supuid[supuid="' + supuid + '"] .delivery_adr').val()
    ) {
      $('.pay_supuid[supuid="' + supuid + '"] .delivery_adr').focus();
      $('.pay_supuid[supuid="' + supuid + '"] .delivery_adr').trigger('click');

      return;
    }
    $('[status="checked"][supuid="' + supuid + '"]').attr('status', 'ordered');

    let order_ = _.find(window.parent.user.orders, { supuid: supuid });
    order.period = $('[supuid="' + supuid + '"] .sel_period').text();
    order.address = $(
      '.pay_supuid[supuid="' + supuid + '"] .delivery_adr'
    ).val();
    order.comments = $('.order_item[supuid="' + supuid + '"] .tacomment').val();
    order.status = { ordered: window.parent.user.date };

    _.forEach(order.data, async function (value, key) {
      if (order.status.checked)
        order.status = { ordered: window.parent.user.date };

      for (let p in order.data) {
        let key = $('[title="' + p + '"] .qnty').attr('unit');
        //let key = _.findKey(order.data[p].ordlist,'qnty');
        if (key) {
          order.data[p].ordlist[key]['qnty'] = parseInt(
            $('[title="' + p + '"] .qnty .ord_amount').text()
          );
        }
      }
      let promise = new Promise((resolve, reject) => {
        window.parent.user.PublishOrder(order, (data) => {
          resolve(data);
        });
      });
      let data = await promise;
      window.parent.user.UpdateOrderLocal(data, () => {});

      $('.pickup_order', $('tr.pay_supuid[supuid="' + supuid + '"]')).css(
        'display',
        'none'
      );
      $('.loader').css('display', 'none');
      $(but).siblings('.order_delivery').css('display', '');
      $('th[tabindex="0"]')[0].scrollIntoView();
    });
  }

  onIncreaseClick(el, supuid, order) {
    $(el)
      .siblings('.ord_amount')
      .text(parseInt($(el).siblings('.ord_amount').text()) + 1);
    let sum = 0;
    let ar = $('.order_item[supuid="' + supuid + '"]').toArray();
    for (let i in ar) {
      let price = parseFloat(
        $($('.order_item[supuid="' + supuid + '"]')[i])
          .find('td.price')
          .text()
      );
      let qnty = parseFloat(
        $($('.order_item[supuid="' + supuid + '"]')[i])
          .find('td .ord_amount')
          .text()
      );

      sum += price * qnty;
    }
    $(el)
      .closest('tr')
      .siblings('tr.pay_supuid[supuid=' + supuid + ']')
      .find('.ord_sum')
      .text(sum.toFixed(2));
    $(el)
      .closest('tr')
      .siblings('tr.pay_supuid[supuid=' + supuid + ']')
      .find('.pickup_order')
      .css('display', '');
    $(el)
      .closest('tr')
      .siblings('tr.pay_supuid[supuid=' + supuid + ']')
      .find('.order_delivery')
      .css('display', 'none');
  }

  onReduceClick(el, supuid, order) {
    if (parseInt($(el).siblings('.ord_amount').text()) > 0)
      $(el)
        .siblings('.ord_amount')
        .text(parseInt($(el).siblings('.ord_amount').text()) - 1);
    let sum = 0;
    let ar = $('.order_item[supuid="' + supuid + '"]').toArray();
    for (let i in ar) {
      let price = parseFloat(
        $($('.order_item[supuid="' + supuid + '"]')[i])
          .find('td.price')
          .text()
      );
      let qnty = parseFloat(
        $($('.order_item[supuid="' + supuid + '"]')[i])
          .find('td.qnty')
          .text()
      );

      sum += price * qnty;
    }
    $(el)
      .closest('tr')
      .siblings('tr.pay_supuid[supuid=' + supuid + ']')
      .find('.ord_sum')
      .text(sum.toFixed(2));
    $(el)
      .closest('tr')
      .siblings('tr.pay_supuid[supuid=' + supuid + ']')
      .find('.order_delivery')
      .css('display', 'none');
    $(el)
      .closest('tr')
      .siblings('tr.pay_supuid[supuid=' + supuid + ']')
      .find('.pickup_order')
      .css('display', '');
    if (sum === 0)
      $(el)
        .closest('tr')
        .siblings('tr.pay_supuid[supuid=' + supuid + ']')
        .find('.pickup_order')
        .css('display', 'none');
  }

  DeleteOrder(el) {
    let that = this;
    if (
      confirm(
        window.parent.sysdict.getDictValue(
          window.parent.sets.lang,
          'Удалить из заказа?'
        )
      )
    ) {
      window.parent.user.DeleteOrder(
        that.date,
        $(el).closest('tr').attr('title'),
        function () {
          $(el).closest('tr').find('.qnty').text('0');
          that.SaveOrderItems(() => {
            $('tbody').empty();
            that.FillOrders();
          });
          return;
        }
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
            order.data[p].status = {
              deleted: moment().format('YYYY-MM-DD h:mm:ss'),
            };
            delete order.data[p].extralist;
          }
        }
      }

      // order.address = $('.delivery_adr').val();

      window.parent.db.SetObject('orderStore', order, function (res) {});
    }

    window.parent.user.SetOrdCnt();

    if (cb) cb();
  }
}

//////////////////
// WEBPACK FOOTER
// ./src/profile/profile.customer.js
// module id = 774
// module chunks = 9

//////////////////
// WEBPACK FOOTER
// ./src/customer/customer.cart.js
// module id = 702
// module chunks = 2

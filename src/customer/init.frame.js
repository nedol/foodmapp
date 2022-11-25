'use strict';
export { OfferOrder };

var urlencode = require('urlencode');

// require('webpack-jquery-ui/draggable');

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');

// require('jquery-ui');
// require('jquery-ui-touch-punch');

// require('bootstrap/dist/css/bootstrap.css');
// require('font-awesome/css/font-awesome.css');

const langs = require('../dict/languages');

import { utils } from '../utils/utils';

class OfferOrder {
  constructor() {
    let that = this;
    this.changed = false;
    this.offer;

    this.arCat = [];

    this.location = [];

    this.address;

    this.customer_frame = $('#customer_frame');

    this.customer_frame.addTouch();

    this.customer_frame.find('.modal-title-date').text($('.dt_val').text());

    this.customer_frame.find('.publish_order').off('click touchstart');
    this.customer_frame
      .find('.publish_order')
      .on('click touchstart', this, function (ev) {
        let that = ev.data;
        let items = ev.data.GetOrderItems(ev.data.lang, true);
        window.user.PublishOrder(items, (data) => {
          let status = window.dict.getDictValue(
            window.sets.lang,
            Object.keys(data)[1]
          );
          // $(that.ovc).find('.ord_status').css('color','white');
          $(that.ovc)
            .find('.ord_status')
            .text(status + '\r\n' + data.published);
          that.status = Object.keys(data)[1];

          window.db.GetSettings(function (obj) {
            obj[0].address = items.address;
            window.db.SetObject('setStore', obj[0], function () {});
          });
        });
      });
  }

  InitCustomerOrder(obj, targ_title) {
    let that = this;
    $('.loader').css('display', 'block');

    if (this.customer_frame[0].contentWindow.InitCustomerOrder) {
      this.customer_frame.css('height', '100%');
      this.customer_frame[0].contentWindow.InitCustomerOrder(obj, targ_title);
    } else {
      this.customer_frame.attr('src', './customer/customer.frame.html?v=' + v);

      this.customer_frame.on('load', function () {
        this.contentWindow.InitCustomerOrder(obj, targ_title);
      });
    }

    $(this.customer_frame).css('display', 'inline-block');

    // $('#client_frame_container').draggable();
    // $('#client_frame_container').resizable({
    //     aspectRatio: 16 / 9
    // });
  }

  onClickCert(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    if (!$(this).attr('height')) $(this).attr('height', '100');
    else {
      $(this).removeAttr('height');
    }
    return false;
  }

  OnMessage(data) {
    //TODO:
    if (data.func === 'approved') {
      this.RedrawOrder({ uid: data.order.supuid });
    }
    if (data.func === 'sharelocation') {
      let loc = data.location;
    }
  }
}

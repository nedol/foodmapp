'use strict';

require('webpack-jquery-ui/draggable');
require('webpack-jquery-ui/css');
// require('jquery-ui-touch-punch');

require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');

let Dict = require('../dict/dict.js');
const langs = require('../dict/languages');

// var moment = require('moment');
//
var md5 = require('md5');
// var isJSON = require('is-json');

import { Utils } from '../utils/utils';
let utils = new Utils();

export class OfferDeliver {
  constructor() {
    this.changed = false;

    this.arCat = [];
    this.off_frame = $('#deliver_frame');
  }

  InitDeliverOffer(obj) {
    let that = this;

    this.location = window.user.offer.stobj.location;
    $('#deliver_frame_container').css('display', 'block');

    this.offer = obj;
    this.offer.profile = obj.profile;
    this.offer.uid = obj.uid;
    this.offer.dict = obj.dict;
    this.offer.promo = window.user.promo;
    this.offer.prolong = window.user.prolong;

    const v = new Date().valueOf();
    this.off_frame.attr('src', './deliver/deliver.frame.html?v=' + v);

    this.off_frame.off('load');
    this.off_frame.on('load', function () {
      that.off_frame[0].contentWindow.InitDeliverOffer(that.offer);
    });
    this.off_frame.css('display', 'block');
    //this.off_frame.attr('src',"./deliver/deliver.frame.ru.html?v="+String(Date.now()));

    $('#deliver_frame_container').prepend(this.off_frame[0]);
  }
}

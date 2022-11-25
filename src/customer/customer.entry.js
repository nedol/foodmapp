'use strict';

require('../../global');

import { Customer } from './customer';
import { Сетка } from '../../network';
import { DB } from '../map/storage/db';

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
// require('jquery-ui-touch-punch');

import { Utils } from '../utils/utils';
let utils = new Utils();

(function Entry() {
  if (document.readyState !== 'complete') {
    return;
  }

  window.sets.lang = utils.getParameterByName('lang');

  window.sets.store = utils.getParameterByName('store');

  window.sets.country_code = utils.getParameterByName('cc');
  window.sets.currency = { gb: '£', us: '$', eu: '€', ru: '₽' }[
    window.sets.country_code
  ];
  if (window.sets.country_code === null) {
    window.sets.currency = '';
  }

  window.sets.css = utils.getParameterByName('css');

  $('title').text({ ru: 'Продуктовая карта', en: 'FoodMap' }[window.sets.lang]);

  $(window).on('orientationchange', function (event) {
    console.log();
  });

  window.network = new Сетка(host_ws);

  let uObj = {};
  window.db = new DB('Customer', function () {
    window.db.GetSettings(function (set) {
      window.user = new Customer();
      if (set[0]) {
        uObj = set[0];

        window.user.SetParams(uObj);
      } else {
        let md5 = require('md5');
        uObj = { uid: md5(new Date()) };
        window.db.SetObject('setStore', uObj, function (res) {
          window.user.SetParams(uObj);
        });
      }
    });
  });
})();

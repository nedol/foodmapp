'use strict';

import('../../lib/glyphicons/glyphicons.css');

require('../../global');

import { Utils } from '../utils/utils';

import { Сетка } from '../../network';
import { DB } from '../map/storage/db';
import { Supplier } from './supplier';

let moment = require('moment');

let _ = require('lodash');

let utils = new Utils();

let urlencode = require('urlencode');

// window.sets.lang = localStorage.getItem('d2d_lang');
// if(!window.sets.lang)
window.sets.lang = utils.getParameterByName('lang');

window.sets.css = utils.getParameterByName('css');

import '../../dist/css/supplier.css';

import QRCode from 'qrcode';

window.user = '';

let load_paused = false;

(async function Entry() {
  if (document.readyState !== 'complete') {
    return;
  }

  let promise = new Promise((resolve, reject) => {
    $.getJSON('../src/host/host.json', function (data) {
      window.con_param = data;
      resolve();
    });
  });
  let res = await promise;

  window.network = new Сетка(window.con_param.host_ws);

  window.db = new DB('Supplier', function () {
    window.db.GetSettings(function (set_) {
      let set = set_;
      if (set[0]) {
        QRCode.toCanvas(
          $('#qr_canvas')[0],
          window.con_param.host_port +
            'dist/customer.html?lang=' +
            window.parent.sets.lang +
            '&supem=' +
            set[0].profile.email,
          function (error) {
            if (error) console.error(error);
            console.log('success!');
          }
        );
      }

      $('#qr_div').click(() => {
        load_paused = !load_paused;
        if (!load_paused) load();
      });

      setTimeout(() => {
        if (!load_paused) load();
      }, 1000);

      function load() {
        let uObj = {};

        let psw_hash = utils.getParameterByName('psw_hash');
        let market = utils.getParameterByName('market');
        if (psw_hash || !set[0]) {
          toReg(psw_hash, function (uid, psw, lat, lon, data) {
            window.location.replace(
              window.location.href.split('&')[0] + '&css=supplier'
            );
          });
        } else if (set[0]) {
          window.db.GetAllOffers(function (res) {
            let sup = {};
            if (set[0].profile.type === 'foodtruck') {
              const ar = _.filter(res, function (offer) {
                return moment(offer.date).isSameOrAfter(
                  moment().format('YYYY-MM-DD')
                );
              });

              sup = ar[0] ? ar[0] : set[0];
            } else {
              if (!res[0]) {
                sup = {
                  date: moment().format('YYYY-MM-DD'),
                  latitude: 0,
                  longitude: 0,
                };
              } else {
                const ar = _.filter(res, function (offer) {
                  return moment(offer.date).isSameOrBefore(
                    moment().format('YYYY-MM-DD')
                  );
                });
                sup = ar[ar.length - 1];
                sup.date = moment().format('YYYY-MM-DD');
              }
            }
            // res.date = moment().format('l');
            // window.db.SetObject('offerStore', res, function () {
            //
            // });

            window.user = new Supplier(set[0], sup);

            $('#qr_div').click(() => {
              this.load_paused = !this.load_paused;
              if (!this.load_paused) load();
            });
          });
        }
      }
    });
  });
})();

function toReg(psw_hash, cb) {
  const that = this;

  var data_post = {
    proj: 'd2d',
    user: 'Supplier',
    func: 'reguser',
    host: location.origin,
    psw_hash: psw_hash,
  };

  window.network.SendMessage(data_post, function (obj) {
    delete data_post.proj;
    delete data_post.func;
    delete data_post.host;
    localStorage.clear();
    let set;

    if (obj.supplier && obj.supplier.profile) {
      set = {
        uid: obj.supplier.uid,
        psw: obj.supplier.psw,
        promo: obj.supplier.promo,
        prolong: obj.supplier.prolong,
        profile: JSON.parse(obj.supplier.profile),
      };
    } else {
      obj.supplier = [{ profile: {}, data: {} }];
      set = {
        uid: obj.uid,
        psw: obj.psw,
        profile: data_post.profile ? data_post.profile : { email: '' },
      };
    }

    window.db.ClearStore('setStore', function () {
      window.db.SetObject('setStore', set, function (res) {
        window.db.ClearStore('offerStore', function () {
          if (obj.supplier && obj.supplier.data_ar) {
            for (let d in obj.supplier.data_ar) {
              let offer = {
                date: moment(obj.supplier.data_ar[d].date_).format(
                  'YYYY-MM-DD'
                ),
                data: obj.supplier.data_ar[d]
                  ? JSON.parse(urlencode.decode(obj.supplier.data_ar[d].data))
                  : {},
                latitude: obj.supplier.data_ar[d].latitude,
                longitude: obj.supplier.data_ar[d].longitude,
                address: obj.supplier.data_ar[d].address,
              };

              window.db.SetObject('offerStore', offer, () => {});

              localStorage.setItem(
                'cur_loc',
                JSON.stringify({
                  latitude: obj.supplier.data_ar[d].latitude,
                  longitude: obj.supplier.data_ar[d].longitude,
                  time: 0,
                })
              );
            }
          }
        });
        window.db.ClearStore('dictStore', function () {
          if (obj.supplier.dict) {
            let dict = JSON.parse(obj.supplier.dict).dict;
            if (dict) {
              recursDict(dict, Object.keys(dict), 0, set, function (ev) {
                cb(
                  obj.supplier.uid,
                  obj.supplier.psw,
                  obj.supplier.data,
                  obj.supplier.lat,
                  obj.supplier.lon
                );
              });
            } else {
              cb(
                obj.supplier.uid,
                obj.supplier.psw,
                obj.supplier.data,
                obj.supplier.lat,
                obj.supplier.lon
              );
            }
          } else {
            cb(
              obj.supplier.uid,
              obj.supplier.psw,
              obj.supplier.data,
              obj.supplier.lat,
              obj.supplier.lon
            );
          }
        });
      });
    });

    function recursDict(dict, keys, i, set, cb) {
      try {
        window.db.SetObject(
          'dictStore',
          { hash: keys[i], obj: dict[keys[i]] },
          function (res) {
            if (dict[keys[i + 1]])
              recursDict(dict, Object.keys(dict), i + 1, set, cb);
            else {
              cb();
            }
          }
        );
      } catch (ex) {
        cb();
      }
    }
  });
}

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

window.network = new Сетка(host_ws);

window.db = new DB('Supplier', function () {
  window.db.GetSettings(function (set_) {
    let set = set_;
    if (set[0]) {
      QRCode.toCanvas(
        $('#qr_canvas')[0],
        host_port +
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
            if (!res[res.length - 1]) {
              sup = {
                date: moment().format('YYYY-MM-DD'),
                latitude: 0,
                longitude: 0,
              };
            } else {
              sup = res[res.length - 1];
            }
          } else {
            if (!res[0]) {
              sup = {
                date: moment().format('YYYY-MM-DD'),
                latitude: 0,
                longitude: 0,
              };
            } else {
              sup = res[0];
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

function toReg(psw_hash, cb) {
  let that = this;

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

    if (obj.supplier && obj.supplier[0].profile) {
      set = {
        uid: obj.supplier[0].uid,
        psw: obj.supplier[0].psw,
        promo: obj.supplier[0].promo,
        prolong: obj.supplier[0].prolong,
        profile: JSON.parse(obj.supplier[0].profile),
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
          if (obj.supplier && obj.supplier[0].data_ar) {
            for (let d in obj.supplier[0].data_ar) {
              if (_.isString(obj.supplier[0].data_ar[d])) {
                obj.supplier[0].data_ar[d] = JSON.parse(
                  obj.supplier[0].data_ar[d]
                );
              }

              let date = moment().format('YYYY-MM-DD');
              let offer = {
                date: moment(obj.supplier[0].data_ar[d].date).format(
                  'YYYY-MM-DD'
                ),
                data: obj.supplier[0].data_ar[d]
                  ? JSON.parse(
                      urlencode.decode(obj.supplier[0].data_ar[d].data)
                    )
                  : {},
                latitude: obj.supplier[0].data_ar[d].latitude,
                longitude: obj.supplier[0].data_ar[d].longitude,
              };

              localStorage.setItem(
                'cur_loc',
                JSON.stringify({
                  latitude: obj.supplier[0].data_ar[d].latitude,
                  longitude: obj.supplier[0].data_ar[d].longitude,
                  time: 0,
                })
              );

              window.db.SetObject('offerStore', offer, () => {});
            }
          }
        });
        window.db.ClearStore('dictStore', function () {
          if (obj.supplier[0].dict) {
            let dict = JSON.parse(obj.supplier[0].dict).dict;
            if (dict) {
              recursDict(dict, Object.keys(dict), 0, set, function (ev) {
                cb(
                  obj.supplier[0].uid,
                  obj.supplier[0].psw,
                  obj.supplier[0].data,
                  obj.supplier[0].lat,
                  obj.supplier[0].lon
                );
              });
            } else {
              cb(
                obj.supplier[0].uid,
                obj.supplier[0].psw,
                obj.supplier[0].data,
                obj.supplier[0].lat,
                obj.supplier[0].lon
              );
            }
          } else {
            cb(
              obj.supplier[0].uid,
              obj.supplier[0].psw,
              obj.supplier[0].data,
              obj.supplier[0].lat,
              obj.supplier[0].lon
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

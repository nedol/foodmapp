'use strict';

import { UtilsMap } from '../utils/utils.map.js';
import { Dict } from '../dict/dict.js';
import { Events } from '../map/events/events';
import { OLMap } from '../map/map';

import { Profile } from '../profile/profile';
import { Import } from '../import/import';
import { OfferOrder } from './init.frame';
import { Utils } from '../utils/utils';
import { CategoriesMap } from '../categories/categories.map';

import proj from 'ol/proj';

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui');
// require('jquery-ui-touch-punch');
require('bootstrap');

require('../../lib/bootstrap-rating/bootstrap-rating.min.js');
var moment = require('moment/moment');

let utils = new Utils();
let util_map = new UtilsMap();

window.TriggerEvent = function (el, ev) {
  $(el).trigger(ev);
};

jQuery.loadScript = function (url, callback) {
  jQuery.ajax({
    url: url,
    dataType: 'script',
    success: callback,
    async: true,
  });
};

jQuery.longTap = function (longTapCallback) {
  return this.each(function () {
    var elm = this;
    var pressTimer;
    $(elm).on('touchend mouseup', function (e) {
      clearTimeout(pressTimer);
    });
    $(elm).on('touchstart mousedown', function (e) {
      // Set timeout
      pressTimer = window.setTimeout(function () {
        longTapCallback.call(elm);
      }, 500);
    });
  });
};

export class Customer {
  constructor() {
    this.date = moment().format('YYYY-MM-DD');
    $('.dt_val').val(this.date);
    this.isShare_loc = true;
  }

  SetParams(uObj) {
    this.uid = uObj.uid;
    this.psw = uObj.psw;
    this.email = ''; //!!! no need to registrate
    if (uObj['profile'] && uObj['profile'].email)
      this.email = uObj['profile'].email;
    this.profile = new Profile(uObj.profile);

    this.orders = [];
    this.InitUser();
  }

  async InitUser() {
    let that = this;

    let promise = new Promise((resolve, reject) => {
      $.getJSON('../src/dict/sys.dict.json?v=' + v, function (data) {
        window.sysdict = new Dict(data);
        window.db.GetStorage('dictStore', function (rows) {
          window.dict = new Dict(rows);
          resolve(window.dict);
        });
      });
    });

    let res = await promise;

    window.sysdict.set_lang(window.sets.lang, $('body'));

    window.sets.store = utils.getParameterByName('store');

    setTimeout(function () {
      if ($('.kolmit').length === 0) {
        let kolmit = $('iframe.kolmit_tmplt').clone();
        $(kolmit)
          .css('display', 'block')
          .attr('class', 'kolmit')
          .attr(
            'src',
            '../kolmit/iframe.html?abonent=kolmit@d2d&em=' + window.user.email
          );
        $('iframe.kolmit_tmplt').after(kolmit);
      }
    }, 3000);

    that.SetOrders(function () {});

    let market = 'food';
    if (utils.getParameterByName('market'))
      market = utils.getParameterByName('market');

    $('#category_container').load(
      './html/categories/' + market + '.html?v=' + v + ' #cat_incl',
      () => {
        this.categories = new CategoriesMap(this);
        $('#category_include').css('display', 'block');
        window.sysdict.set_lang(window.sets.lang, $('#categories'));
      }
    );

    // $('#profile_frame_div').resizable();

    $('#profile_but').on('click', this.OnClickUserProfile);
    $('#cart_but').on('click', this.OnClickUserCart);

    $('.collapse_link').on('click touchstart', function (ev) {
      $('.collapse').collapse('toggle');
    });

    $('.nav-link').on('click touchstart', function (ev) {
      $('.collapse').collapse('show');
    });

    $('.cart_frame').attr('src', './customer/cart.customer.html?v=' + v);
    $('.cart_frame').on('load', function () {
      window.sysdict.set_lang(
        window.sets.lang,
        $('body', $('.cart_frame').contents())
      );
    });

    $('#cart_frame_div').resizable();

    this.DateTimePickerEvents();

    $('.dt_val').trigger('change');

    let lonlat = [0, 0];

    that.map = new OLMap();

    this.import = new Import(this.map);

    if (utils.getParameterByName('supem')) {
      lonlat = await that.import.ImportSupByEmail(
        utils.getParameterByName('supem')
      );
    }

    that.map.Init(lonlat[1], lonlat[0], async function () {
      $('#splash').css('display', 'none');
    });

    that.map.ol_map.on('click', function (event) {
      if (!event.loc_mode) event.loc_mode = false;
      that.OnMapClick(event);
    });

    that.import.GetOrderCustomer(() => {});
    // that.import.GetApprovedCustomer(that.uid);

    this.events = new Events(this.map);

    that.import.LoadDataByKey(window.user.uid, 'demo', function (res) {});
  }

  // SendLocation(loc){
  //
  //     if (this.isShare_loc) {
  //
  //         if (window.user.user_ovl) {
  //             window.user.user_ovl.overlay.setPosition(loc);
  //         }
  //     }
  //
  // }

  OnMapClick(event) {
    let that = this;
    if (!event.loc_mode) {
      that.map.geo.StopLocation();
      window.user.isShare_loc = false;
    }

    if (isNaN(event.coordinate[0]) || isNaN(event.coordinate[1])) return;

    // $('.menu_item', $('.client_frame').contents()).remove();
    // $('#client_frame_container').css('display','none');
    // $('.carousel-indicators', $('.client_frame').contents()).empty();
    // $('.carousel-inner', $('.client_frame').contents()).empty();

    var degrees = proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');

    var lonlat = proj.toLonLat(event.coordinate);
    $('#locText').text(lonlat[1].toFixed(6) + ' ' + lonlat[0].toFixed(6));
    // and add it to the Map

    window.sets.coords.cur = event.coordinate;

    var time = new Date().getTime();

    localStorage.setItem(
      'cur_loc',
      '{"lon":' +
        lonlat[0] +
        ',' +
        '"lat":' +
        lonlat[1] +
        ', "time":' +
        time +
        ',"zoom":' +
        that.map.ol_map.getView().getZoom() +
        '}'
    );

    if (!event.loc_mode && $('#categories').is(':visible'))
      $('#categories').slideToggle('slow', function () {
        $('.dropdown-menu').removeClass('show');
      });
    if (!event.loc_mode && $('.sup_menu').is(':visible')) {
      $('.sup_menu').animate({ width: 'toggle' });
    }

    if (!event.loc_mode && $('#menu_items').is(':visible'))
      $('#menu_items').slideToggle('slow', function () {});

    that.map.ol_map.forEachFeatureAtPixel(
      event.pixel,
      function (feature, layer) {
        // that.map.ol_map.getFeaturesAtPixel(event.pixel, null, function (feature, layer) {

        let closest = feature.getGeometry().getClosestPoint(event.pixel);

        if (feature) {
          if (feature.features && feature.features.length > 1) {
            //cluster

            var coordinates = [];
            $.each(feature.features, function (key, feature) {
              coordinates.push(feature.getGeometry().flatCoordinates);
            });

            var extent = extent.boundingExtent(coordinates);
            var buf_extent = extent.buffer(extent, 5);
            //ol.extent.applyTransform(extent, transformFn, opt_extent)
            that.map.ol_map
              .getView()
              .fit(buf_extent, { duration: window.sets.animate_duration });

            that.map.ol_map.getView().animate(
              {
                center: feature.getGeometry().flatCoordinates,
                duration: window.sets.animate_duration,
              },
              function () {}
            );
          } else {
            if (
              (feature.values_.features &&
                (!feature.values_.features[0].values_.object ||
                  !moment(
                    feature.values_.features[0].values_.object.date
                  ).isSame(that.date))) ||
              (feature.values_.object &&
                !moment(feature.values_.object.date).isSame(that.date))
            ) {
              return;
              if (that.map.ol_map.getLayers().array_) {
                for (let l in that.map.ol_map.getLayers().array_) {
                  let src = that.map.ol_map.getLayers().array_[l].getSource();
                  if (src && src.getClosestFeatureToCoordinate) {
                    let feat = src.getClosestFeatureToCoordinate(closest);
                    if (
                      feat.values_ &&
                      feat.values_.features &&
                      feat.values_.features[0].values_.object.profile.type ===
                        'marketer'
                    ) {
                      let ln_clos = proj.toLonLat(closest);
                      let ln_feat = proj.toLonLat(
                        feat.values_.features[0].values_.geometry
                          .flatCoordinates
                      );
                      const distanceBetweenPoints = function (
                        latlng1,
                        latlng2
                      ) {
                        var line = new ol.geom.LineString([latlng1, latlng2]);
                        return Math.round(line.getLength() * 100) / 100;
                      };
                      let dist = distanceBetweenPoints(ln_clos, ln_feat);
                      if (dist < 0.1) {
                        feature = feat;
                        break;
                      } else {
                        return;
                      }
                    }
                  } else continue;
                }
              } else {
                return;
              }
            }

            if (
              feature.values_.features &&
              feature.values_.features.length === 1
            )
              feature = feature.values_.features[0];

            if (feature.values_.type === 'supplier') {
              window.db.GetSupplier(
                window.user.date,
                feature.values_.object.uid,
                function (obj) {
                  if (obj !== -1) {
                    if (window.user.constructor.name === 'Customer') {
                      if (!window.user.viewer) {
                        window.user.viewer = new OfferOrder();
                      }
                      window.user.viewer.InitCustomerOrder(obj);
                    }
                  }
                }
              );
            } else if (feature.values_.type === 'foodtruck') {
              that.map.Carousel([feature.object]);
            }
          }
        }
        return true;
      }
    );
  }

  DateTimePickerEvents() {
    let that = this;

    $('.dt_val').on('change', this, function (ev) {
      that.date = moment($(this).val()).format('YYYY-MM-DD');

      if (that.import) that.import.GetApprovedCustomer(that.uid);

      that.SetOrders(() => {});

      if (that.map) {
        that.map.EmptyMap();
        that.map.ol_map.dispatchEvent('moveend');

        // window.user.import.LoadDataByKey(window.user.uid,'М11',function (res) {
        //
        // });
      }
    });
  }

  UpdateOrderLocal(obj, cb) {
    let that = this;
    obj.date = moment(obj.date).format('YYYY-MM-DD');
    window.db.SetObject('orderStore', obj, (res) => {
      this.SetOrders(function () {
        cb();
      });
      that.SetOrdCnt();
    });
  }

  UpdateDict(dict, cb) {
    if (window.demoMode) {
      window.dict.dict = dict;
      cb();
      return;
    }

    let data_obj = {
      proj: 'd2d',
      func: 'updatedict',
      admin: JSON.stringify({
        uid: this.uid,
        lon: this.lon_param,
        lat: this.lat_param,
      }),
      dict: JSON.stringify(dict)
        .replace(/'/g, '%27')
        .replace(/\n/g, '%0D')
        .replace(/\n/g, '%0D')
        .replace(/"/g, '"'),
    };
    $.ajax({
      url: host_port,
      method: 'POST',
      dataType: 'json',
      data: data_obj,
      async: true, // asynchronous request? (synchronous requests are discouraged...)
      success: function (resp) {
        //$("[data-translate='" + this.key + "']").parent().val(resp);
        cb();
      },
      error: function (xhr, status, error) {
        //let err = eval("(" + xhr.responseText + ")");
        console.log(error.Message);
        //alert(xhr.responseText);
      },

      complete: function (data) {},
    });
  }

  PublishOrder(obj, cb) {
    let that = this;

    obj.proj = 'd2d';
    obj.user = window.user.constructor.name.toLowerCase();
    obj.func = 'updateorder';
    obj.psw = that.psw;
    obj.cusuid = that.uid;
    obj.supuid = obj.supuid;
    obj.date = moment(obj.date).format('YYYY-MM-DD');

    window.network.SendMessage(obj, function (data) {
      if (data && data.published) {
        obj.proj = '';
        obj.func = '';
        obj.published = data.published;
        cb(obj);
      }
    });
  }

  DeleteOrder(date, title, cb) {
    let that = this;

    let obj = {};
    obj.proj = 'd2d';
    obj.user = window.user.constructor.name.toLowerCase();
    obj.func = 'deleteorder';
    obj.psw = that.psw;
    obj.cusuid = that.uid;
    obj.date = moment(date).format('YYYY-MM-DD');
    obj.order = title;
    obj.status = 'deleted';

    window.network.SendMessage(obj, function (data) {
      if (data.result.affectedRows > 0) {
        cb(data);
      }
    });
  }
  //layers
  OnClickDeliver(el) {
    window.db.GetSupplier(
      window.user.date,
      el.attributes.supuid.value,
      function (obj) {
        if (obj !== -1) {
          if (!window.user.viewer) {
            window.user.viewer = new OfferOrder();
          }
          window.user.viewer.InitCustomerOrder(obj);
        }
      }
    );
  }

  OnClickUserProfile(ev) {
    $('#profile_frame').css('display', 'block');

    $('#profile_frame').attr('src', './customer/profile.customer.html?v=' + v);
    $('#profile_frame').on('load', function () {});

    // $('.close_browser',$('.profile_frame').contents()).off('touchstart click');
    // $('.close_browser',$('.profile_frame').contents()).on('touchstart click', function (ev) {
    //     ev.preventDefault();
    //     ev.stopPropagation();
    //     $('.close_browser',$('.profile_frame').contents().contentDocument)
    //     $('#profile_frame_div').css('display', 'none');
    //     $('.loader').css('display','none');
    //
    // });
  }

  OnClickUserCart(ev) {
    $('#cart_frame_div').css('display', 'block');
    //$('cart_frame').on('load', function () {
    //$('.cart_frame').off();

    $('.cart_frame')[0].contentWindow.InitCartCustomer();

    $('.close_browser', $('.cart_frame').contents()).off('touchstart click');
    $('.close_browser', $('.cart_frame').contents()).on(
      'touchstart click',
      function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        $('.cart_frame')[0].contentWindow.cart_cus.Close(function () {
          $('#cart_frame_div').css('display', 'none');
          $('.loader').css('display', 'none');
        });
      }
    );
    //})
  }

  OnMessage(data) {
    let that = this;
    if (data.func === 'approved') {
      data.order.date = moment(data.order.date).format('YYYY-MM-DD');
      window.db.GetOrder(
        data.order.date,
        data.order.supuid,
        data.order.cusuid,
        function (ord) {
          if (ord === -1) return;
          ord.data[data.order.title].approved = data.order.data.approved;
          window.db.SetObject('orderStore', ord, (res) => {
            if (that.viewer) that.viewer.OnMessage(data);
          });
        }
      );
    }
    if (data.func === 'updateorder') {
      window.db.SetObject('orderStore', data, (res) => {});
    }
    if (data.func === 'supupdate') {
      window.db.GetObject(
        'supplierStore',
        data.obj.date,
        data.obj.email,
        function (res) {
          let obj = res;
          if (!obj) {
            obj = data.obj;
          }
          let urlencode = require('urlencode');
          obj.data = JSON.parse(urlencode.decode(data.obj.offer));
          obj.dict = JSON.parse(data.obj.dict);
          let loc = data.obj.location;
          obj.latitude = loc[1];
          obj.longitude = loc[0];
          delete obj.location;
          delete obj.offer;
          delete obj.proj;
          delete obj.func;
          let layers = window.user.map.ol_map.getLayers();
          window.db.SetObject('supplierStore', obj, function (res) {
            let catAr = JSON.parse(obj.categories);
            for (let c in catAr) {
              let l = layers.get(catAr[c]);
              let feature = l.vector.getFeatureById(obj.hash);
              if (feature) {
                let point = feature.getGeometry();
                let loc = ol.fromLonLat([obj.longitude, obj.latitude]);
                if (
                  point.flatCoordinates[0] !== loc[0] &&
                  point.flatCoordinates[1] !== loc[1]
                )
                  window.user.map.SetFeatureGeometry(feature, loc);
              }
            }
          });
        }
      );
    }
    if (data.func === 'sharelocation') {
      let loc = data.location;
      window.db.GetObject(
        'supplierStore',
        window.user.date,
        data.email,
        function (obj) {
          if (!obj) {
            obj = {};
          }
          obj.latitude = loc[1];
          obj.longitude = loc[0];
          let layers = window.user.map.ol_map.getLayers();
          window.db.SetObject('supplierStore', obj, function (res) {
            let catAr = JSON.parse(obj.categories);
            for (let c in catAr) {
              let l = layers.get(catAr[c]);
              let feature = l.vector.getFeatureById(obj.hash);
              if (feature) {
                let point = feature.getGeometry();
                let loc = ol.proj.fromLonLat([obj.longitude, obj.latitude]);
                if (
                  point.flatCoordinates[0] !== loc[0] &&
                  point.flatCoordinates[1] !== loc[1]
                )
                  window.user.map.SetFeatureGeometry(feature, loc);
              }
            }
          });
        }
      );
    }
  }

  SetOrdCnt() {
    let that = this;

    let cnt = 0;
    let num = 0;
    $('.ord_cnt').text(cnt);
    for (let i in this.orders) {
      let order = this.orders[i];
      for (let item in order.data) {
        if (order.data[item] && order.data[item].ordlist) {
          _.findKey(order.data[item].ordlist, function (o) {
            num += o.qnty;
          });
          $('.ord_cnt').text(num);
          $('#cart_but').parent().css('display', 'block');
        }
      }
    }
  }

  SetOrders(cb) {
    window.db.GetCusOrders(window.user.date, (res) => {
      this.orders = [];
      for (let i in res) {
        this.orders.push(res[i]);
      }

      this.SetOrdCnt();
      cb();
    });
  }
}

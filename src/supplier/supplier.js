'use strict';

import { Utils } from '../utils/utils';
let utils = new Utils();

import 'tablesorter/dist/css/theme.default.min.css';

import { OLMap } from '../map/map';

import proj from 'ol/proj';

import Extent from 'ol/extent';

import { OverlayItem } from '../map/overlay/overlay';

import { Profile } from '../profile/profile';

import { Import } from '../import/import';
import { OfferSupplier } from './init.offer.supplier';
import { OfferOrder } from './init.frame';

var urlencode = require('urlencode');

var ColorHash = require('color-hash');

import { Events } from '../map/events/events';
import { Offer } from '../offer/offer';
import { Dict } from '../dict/dict.js';

import { longTab, doubleTap } from '../utils/utils';

let moment = require('moment/moment');

require('../../lib/DragDropTouch.js');
require('../../lib/blueimp-load-image/js/load-image.all.min.js');

export class Supplier {
  constructor(set, sup) {
    this.path = 'http://localhost:5500/d2d/server';
    if (host_port.includes('nedol.ru')) this.path = 'https://nedol.ru/server';
    else this.path = host_port;

    this.image_path = image_path;

    this.date = moment(sup.date).format('YYYY-MM-DD');

    this.user_ovl;

    if (sup) {
      let that = this;

      this.editor = new OfferSupplier(); //offer editor

      this.uid = set.uid;
      this.psw = set.psw;
      this.promo = set.promo;
      this.email = set.profile.email;

      this.profile = new Profile(set.profile);
      this.profile.InitSupplierProfile(this);

      this.offer = new Offer({
        date: this.date,
        latitude: sup.latitude,
        longitude: sup.longitude,
        radius: sup.radius,
        data: sup.data,
      });

      this.DateTimePickerEvents();
      $('.dt_val').val(this.date);
      if (!moment(sup.date).isSame(moment())) {
        $('.dt_val').css('color', 'red');
      }

      this.map = new OLMap();
      setTimeout(() => {
        this.map.Init(sup.latitude, sup.longitude, () => {});
        this.import = new Import(this.map);
        this.events = new Events(this.map);
        this.InitUser(function () {});
      }, 300);

      this.isShare_loc = false;
    }
  }

  DateTimePickerEvents() {
    let that = this;

    setTimeout(function () {
      $('.dt_val').trigger('change');
      that.map.Init(
        that.offer.stobj.latitude,
        that.offer.stobj.longitude,
        () => {}
      );
    }, 1000);

    $('.dt_val').on('change', this, function (ev) {
      that.date = moment($(this).val()).format('YYYY-MM-DD');

      if (moment(that.date).isSame(moment(), 'day')) {
        $(this).css('color', 'black');
      }

      that.offer.stobj.date = that.date;

      let layers = that.map.ol_map.getLayers();
      layers.forEach(function (layer, i, layers) {
        if (layer.type === 'VECTOR') {
          if (layer.getSource()) layer.getSource().clear(true);
          if (layer.getSource().source) {
            layer.getSource().source.clear(true);
          }
        }
      });

      if (that.map.layers && that.map.layers.circleLayer) {
        let source = that.map.layers.circleLayer.getSource();
        source.clear();
      }

      $('#user').css('visibility', 'visible');

      if (that.user_ovl) {
        that.user_ovl.RemoveOverlay();
        that.user_ovl = '';
      }

      //that.map.GetObjectsFromStorage();

      window.db.GetAllOffers(function (res) {
        let obj = _.find(res, { date: that.date });
        if (obj) {
          obj.date = that.date;

          that.offer.stobj = obj;

          window.db.SetObject('offerStore', obj, function (res) {
            getOfferData();
          });
        } else {
          getOfferData();
        }
      });

      function getOfferData() {
        if (that.offer.stobj.data) {
          let not_empty = $.grep(that.offer.stobj.data, function (el, i) {
            return el && !_.isEmpty(el.data);
          });

          setTimeout(function () {
            if (that.offer.stobj.longitude && that.offer.stobj.latitude)
              that.map.MoveToLocation(
                proj.fromLonLat([
                  that.offer.stobj.longitude,
                  that.offer.stobj.latitude,
                ]),
                null,
                function () {}
              );
          }, 100);
        }

        window.user.editor.InitSupplierOffer();

        that.offer.stobj.profile = that.profile.profile;
        // that.offer.stobj.profile.type = 'marketer';
        that.offer.stobj.profile.lang = window.sets.lang;

        if (!that.offer.stobj.latitude && !that.offer.stobj.longitude) {
          that.offer.stobj.latitude = 0.1;
          that.offer.stobj.longitude = 0.1;
          that.offer.stobj.location = proj.fromLonLat([0.1, 0.1]);
          $('#loc_ctrl').trigger('click');
        }

        $('#user_container')
          .find('img')
          .attr('src', that.image_path + that.profile.profile.avatar);
        $('#user_container').on('click', function () {
          $(that.editor.off_frame).css('height', '100%');
          $('#add_item', $(that.editor.off_frame).contents()).css(
            'display',
            ''
          );
          $('.close_frame', $(that.editor.off_frame).contents())
            .parent()
            .css('display', '');
        });
      }

      that.import.GetOrderSupplier(function () {});
    });
  }

  InitUser(cb) {
    let that = this;

    let market = 'food';
    if (utils.getParameterByName('market'))
      market = utils.getParameterByName('market');

    // $('#category_container').load('./html/categories/'+market+'.'+window.sets.lang+'.html?v='+String(Date.now())+' #cat_incl',()=> {
    //     this.categories = new Categories(this);
    //     // $('#category_include').css('display', 'block');
    //
    // });

    $.getJSON(
      '../src/dict/sys.dict.json?v=' + new Date().valueOf(),
      function (data) {
        window.sysdict = new Dict(data);
        window.sysdict.set_lang(window.sets.lang, $('body'));
        window.sysdict.set_lang(window.sets.lang, $('#categories'));

        window.db.GetStorage('dictStore', function (rows) {
          window.dict = new Dict(rows);
        });

        cb();
      }
    );

    //$('.open_off_editor').on('click', this, this.editor.OpenOffer);

    this.map.ol_map.on('click', function (event) {
      if (!event.loc_mode) {
        that.map.geo.StopLocation();
        window.user.isShare_loc = false;
      }

      let lonlat;

      if (event.coordinate) {
        lonlat = proj.toLonLat(event.coordinate);
        $('#locText').text(lonlat[1].toFixed(6) + ' ' + lonlat[0].toFixed(6));
        // and add it to the Map

        window.sets.coords.cur = event.coordinate;
      }

      //$('#datetimepicker').data("DateTimePicker").hide();

      var time = new Date().getTime();
      lonlat = proj.toLonLat(window.sets.coords.cur);
      localStorage.setItem(
        'cur_loc',
        '{"lon":' +
          lonlat[0] +
          ',' +
          '"lat":' +
          lonlat[1] +
          ', "time":' +
          time +
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

      if (event.pixel)
        that.map.ol_map.forEachFeatureAtPixel(
          event.pixel,
          function (feature, layer) {
            //let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

            let closest = feature.getGeometry().getClosestPoint(event.pixel);

            if (feature.values_)
              if (
                feature.values_.features &&
                feature.values_.features.length > 1
              ) {
                //cluster

                var coordinates = [];
                $.each(feature.values_.features, function (key, feature) {
                  coordinates.push(feature.getGeometry().flatCoordinates);
                });

                var extent = Extent.boundingExtent(coordinates);
                var buf_extent = Extent.buffer(extent, 5);
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
                if (feature) {
                  if (
                    feature.values_.features &&
                    feature.values_.features.length === 1
                  )
                    feature = feature.values_.features[0];

                  if (feature.values_.type === 'supplier') {
                    window.db.GetSupplier(
                      moment(window.user.date).format('YYYY-MM-DD'),
                      feature.values_.object.uid,
                      function (obj) {
                        if (obj !== -1) {
                          //window.user.viewer = new OfferDeliver(obj.dict);
                          //$("a[href=#profile]").text('Мой профиль')

                          if (!window.user.viewer) {
                            window.user.viewer = new OfferOrder();
                          }
                          window.user.viewer.InitCustomerOrder(obj);

                          return true;
                        }
                      }
                    );
                  }
                }
              }
          }
        );
    });
  }

  UpdateOfferLocal(offer, loc, dict) {
    let sup = Object.assign(this.offer.stobj);
    if (sup) {
      for (let tab in offer) {
        for (let i in offer[tab]) {
          if (!sup.data[tab]) {
            sup.data[tab] = offer[tab];
          }
          if (!sup.data[tab][i]) {
            sup.data[tab].push({ img: {} });
          }
          if (
            offer[tab] &&
            offer[tab][i] &&
            offer[tab][i].img &&
            offer[tab][i].img.left
          )
            sup.data[tab][i].img.left = offer[tab][i].img.left;
          if (
            offer[tab] &&
            offer[tab][i] &&
            offer[tab][i].img &&
            offer[tab][i].img.top
          )
            sup.data[tab][i].img.top = offer[tab][i].img.top;
        }
        sup.data[tab] = offer[tab];
        sup.date = window.user.date;
        sup.period = $('.sel_period').text();
        this.offer.stobj.data[tab] = offer[tab];
      }
    } else {
      sup = {
        date: window.user.date,
        period: $('.sel_period').text(),
        latitude: loc[0],
        longitude: loc[1],
        data: offer,
      };
    }

    this.offer.SetOfferDB(sup, dict);
  }

  ValidateOffer(data) {
    return true; //TODO:
    for (let tab in data) {
      if (data[tab].length === 0) return false;
      for (let i in data[tab])
        if (
          !data[tab][i].checked ||
          !parseInt(data[tab][i].price) ||
          !data[tab][i].title
        ) {
          return false;
        }
    }
    return true;
  }

  async PublishOffer(menu, date, data, cb) {
    let that = this;
    if (
      window.user.constructor.name === 'Customer' &&
      !this.offer.stobj.latitude &&
      !this.offer.stobj.longitude
    ) {
      this.PickRegion();

      cb();
      return;
    }
    try {
      let data_obj = {
        proj: 'd2d',
        user: window.user.constructor.name.toLowerCase(),
        func: 'updateoffer',
        host: window.location.origin,
        uid: that.uid,
        psw: that.psw,
        categories: data.arCat,
        date: date,
        location: [this.offer.stobj.longitude, this.offer.stobj.latitude],
        address: $('#adr_text', $(document).contents()).text(),
        offer: urlencode.encode(JSON.stringify(menu)),
        dict: JSON.stringify(window.dict),
      };

      let promise = new Promise(function (resolve, reject) {
        window.network.SendMessage(data_obj, function (res) {
          let data = res;
          if (data && data.result && data.result.affectedRows > 0) {
            $('.loader').css('display', 'none');

            // alert(
            //     window.sysdict.getDictValue(window.parent.sets.lang, 'Опубликовано'),
            //     null, 1000);

            $('#user_2').removeClass('unpublished');
            $('#user_2').addClass('published');
            resolve(data);
          }
          if (data.err) {
            alert(
              window.sysdict.getDictValue(
                window.parent.sets.lang,
                'Ошибка сохранения данных'
              ) + JSON.stringify(data.err),
              null,
              3000
            );
          }

          return;
        });
      });

      let res = await promise;
      cb(res, data_obj);
    } catch (ex) {
      cb();
    }
  }

  CopyNextWeek() {
    const that = this;
    return new Promise(function (resolve, reject) {
      let data_obj = {
        proj: 'd2d',
        user: window.user.constructor.name.toLowerCase(),
        func: 'copynextweek',
        host: window.location.origin,
        uid: that.uid,
        psw: that.psw,
        date: that.date,
      };

      $('.loader').css('display', 'block');

      window.network.SendMessage(data_obj, (res) => {
        if (res) {
          $('.loader').css('display', 'none');
          for (let o in res['supplier']) {
            res['supplier'][o].data = JSON.parse(
              urlencode.decode(res['supplier'][o].data)
            );
            res['supplier'][o].date = moment(res['supplier'][o].date).format(
              'YYYY-MM-DD'
            );

            window.db.SetObject('offerStore', res['supplier'][o], () => {});
          }
          resolve(res);
        } else {
          reject();
        }
      });
    });
  }

  PickRegion() {
    let that = this;
    alert($('#choose_region').text());
    $('[data-dismiss=modal]').trigger('click');

    let user_2 = $('#user').clone()[0];
    $(user_2).attr('id', 'user_2');
    let status;
    if (!that.offer.stobj.published) status = 'unpublished';
    else status = 'published';
    $(user_2).addClass(status);
    that.user_ovl = new OverlayItem(
      that.map,
      user_2,
      that.map.ol_map.getView().getCenter()
    );
    $('#user').css('visibility', 'hidden');
  }

  ApproveOrder(obj) {
    let data_obj = {
      proj: 'd2d',
      func: 'updateorder',
      uid: window.user.uid,
      psw: window.user.psw,
      user: window.user.constructor.name,
      date: obj.date,
      number: obj.number,
      period: obj.period,
      supuid: obj.supuid,
      cusuid: obj.cusuid,
      status: 'approved',
    };

    window.network.SendMessage(data_obj, function (resp) {
      if (resp['err']) {
      } else {
        delete data_obj.proj;
        delete data_obj.func;
        delete data_obj.psw;
        delete data_obj.user;
        data_obj.status = 'approved';
        window.db.SetObject('approvedStore', data_obj, function (res) {});
      }
    });
  }

  SendLocation() {
    return; //TODO:

    let location = proj.toLonLat(window.sets.coords.cur);
    location[0] = parseFloat(location[0].toFixed(6));
    location[1] = parseFloat(location[1].toFixed(6));
    let data_obj = {
      proj: 'd2d',
      user: window.user.constructor.name.toLowerCase(),
      func: 'updatelocation',
      uid: window.user.uid,
      supuid: this.email,
      date: this.date,
      location: location,
    };

    window.network.SendMessage(data_obj, (data) => {
      console.log(data);

      if (data && data.result && data.result.affectedRows > 0) {
        $('.loader').css('display', 'none');
      }
    });

    if (window.user.user_ovl) {
      window.user.user_ovl.overlay.setPosition(loc);
    }
  }

  OnMessage(data) {
    if (data.func === 'ordered') {
      //TODO:
      window.db.SetObject('orderStore', data.order, (res) => {
        for (let ord in data.order.data) {
          $('[data-translate=' + ord + ']').attr('status', 'ordered');
        }
      });
    }
    if (data.func === 'sharelocation') {
      let loc = data.location;
      window.db.GetObject(
        'supplierStore',
        window.user.date,
        data.email,
        function (obj) {
          if (obj != -1) {
            obj.latitude = loc[1];
            obj.longitude = loc[0];
            let layers = window.user.map.ol_map.getLayers();
            window.db.SetObject('supplierStore', obj, function (res) {
              let catAr = JSON.parse(obj.categories);
              for (let c in catAr) {
                let l = layers.get(catAr[c]);
                let feature = l.values_.vector.getFeatureById(obj.hash);
                if (feature) {
                  let point = feature.getGeometry();
                  let loc = proj.fromLonLat([obj.longitude, obj.latitude]);
                  if (
                    point.flatCoordinates[0] !== loc[0] &&
                    point.flatCoordinates[1] !== loc[1]
                  )
                    window.user.map.SetFeatureGeometry(feature, loc);
                }
              }
            });
          }
        }
      );
    }
  }
}

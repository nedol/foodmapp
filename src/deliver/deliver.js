'use strict';

import { Utils } from '../utils/utils';
let utils = new Utils();

import 'tablesorter/dist/css/theme.default.min.css';

import { OLMap } from '../map/map';

import proj from 'ol/proj';
import Point from 'ol/geom/point';
import Feature from 'ol/feature';

import { Profile } from '../profile/profile';

import { Import } from '../import/import';
import { OfferDeliver } from './init.offer.deliver';
import { OfferOrder } from './init.supplier.frame';
import { Events } from '../map/events/events';

require('webpack-jquery-ui/css');
// require('jquery-ui-touch-punch');
require('bootstrap');
require('webpack-jquery-ui');

var urlencode = require('urlencode');

var ColorHash = require('color-hash');

import { Offer } from '../offer/offer';
import { Dict } from '../dict/dict.js';

import { CategoriesMap } from '../categories/categories.map';

import { longTab, doubleTap } from '../utils/utils';

require('../../lib/DragDropTouch.js');
require('../../lib/blueimp-load-image/js/load-image.all.min.js');
let moment = require('moment/moment');

export class Deliver {
  constructor(set, uObj) {
    this.path = 'http://localhost:5500/d2d/server';
    if (host_port.includes('nedol.ru'))
      this.path = 'https://delivery-angels.store/server';
    else this.path = host_port;

    this.image_path = image_path;

    this.date = moment().format('YYYY-MM-DD');

    this.user_ovl;

    if (uObj) {
      let that = this;

      this.editor = new OfferDeliver(); //offer editor

      this.uid = set.uid;
      this.psw = set.psw;
      this.promo = set.promo;
      this.email = set.profile.email;

      this.profile = new Profile(set.profile);
      this.profile.InitSupplierProfile(this);

      this.map = new OLMap();

      this.offer = new Offer({
        date: this.date,
        latitude: uObj.latitude,
        longitude: uObj.longitude,
        radius: uObj.radius,
        data: uObj.data,
      });

      setTimeout(function () {
        that.map.Init(uObj.latitude, uObj.longitude, () => {});
      }, 300);

      this.import = new Import(this.map);

      this.isShare_loc = false;

      this.events = new Events(this.map);
    }
  }

  async InitUser(cb) {
    let that = this;

    let data = await (await fetch('../src/dict/sys.dict.json?v=2')).json();

    window.sysdict = new Dict(data);
    window.sysdict.set_lang(window.sets.lang, $('body'));
    window.sysdict.set_lang(window.sets.lang, $('#categories'));

    window.db.GetStorage('dictStore', function (rows) {
      window.dict = new Dict(rows);
    });

    $('#category_container').load(
      './html/categories/food.html?v=' + String(Date.now()) + ' #cat_incl',
      () => {
        this.categories = new CategoriesMap(this);
        $('#category_include').css('display', 'block');
      }
    );

    $('.open_off_editor').on('click', this, this.editor.OpenOffer);

    this.DateTimePickerEvents();

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

        //window.sets.coords.cur = event.coordinate;
        // lonlat = proj.toLonLat(event.coordinate);
      }

      // var time = new Date().getTime();

      // localStorage.setItem("cur_loc", "{\"lon\":" + lonlat[0] + "," +
      //     "\"lat\":" + lonlat[1] + ", \"time\":" + time + "}");

      // if (!event.loc_mode && $('#categories').is(':visible'))
      //     $('#categories').slideToggle('slow', function () {
      //         $('.dropdown-menu').removeClass('show');
      //     });

      // if (!event.loc_mode && $('.sup_menu').is(':visible')) {
      //     $('.sup_menu').animate({'width': 'toggle'});
      // }

      // if (!event.loc_mode && $('#menu_items').is(':visible'))
      //     $('#menu_items').slideToggle('slow', function () {
      //     });

      if (event.pixel)
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
                  !feature.values_.features ||
                  !feature.values_.features[0].values_.object
                )
                  return;

                if (
                  feature.values_.features[0] &&
                  feature.values_.features.length === 1
                )
                  feature = feature.values_.features[0];

                if (feature.values_.type === 'supplier') {
                  window.db.GetSupplier(
                    window.user.date,
                    feature.values_.object.uid,
                    function (obj) {
                      if (obj !== -1) {
                        if (window.user.constructor.name === 'Deliver') {
                          if (!window.user.viewer) {
                            window.user.viewer = new OfferOrder();
                          }
                          window.user.viewer.InitSupplierOffer(obj);
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
    });

    cb();
  }

  DateTimePickerEvents() {
    let that = this;

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

    that.map.GetObjectsFromStorage();

    (function getOfferData() {
      if (that.offer.stobj.data) {
        let not_empty = $.grep(that.offer.stobj.data, function (el, i) {
          return el && !_.isEmpty(el.data);
        });

        setTimeout(function () {
          if (
            that.offer.stobj.location &&
            that.offer.stobj.location[0] &&
            that.offer.stobj.location[1]
          )
            that.map.MoveToLocation(
              that.offer.stobj.location,
              'SetCurPosition',
              () => {}
            );
        }, 100);
      }

      let user_cont = $('#user_container').clone()[0];
      $(user_cont).find('img').attr('id', 'user_2');
      let pos;
      $('#user_container').draggable(
        { delay: 100 },
        {
          //cancel: ".non_draggable",
          start: function (ev) {
            console.log('drag start');
            pos = $(this).offset();
          },
          drag: function (ev) {
            //$(el).attr('drag', true);
          },
          stop: function (ev) {
            console.log('drag stop');

            let pixel = [ev.originalEvent.clientX, ev.originalEvent.clientY]; //$('#user_container').offset();//;
            let coor = that.map.ol_map.getCoordinateFromPixel(pixel); //([pixel.left,pixel.top]);
            window.user.offer.stobj.location = coor;
            that.user_ovl.overlay.values_.position = coor;

            let source = that.map.layers.circleLayer.getSource();
            source
              .getFeatureById('radius_' + window.user.uid)
              .values_.geometry.setCenter(coor);

            that.map.ol_map.render();
            $(this).offset(pos);
          },
        }
      );

      let status;
      if (!that.offer.stobj.published) status = 'unpublished';
      else status = 'published';

      $(user_cont).find('img').addClass(status);

      that.offer.stobj.profile = that.profile.profile;
      that.offer.stobj.profile.type = 'deliver';
      that.offer.stobj.profile.lang = window.sets.lang;

      let cur_loc, coor;
      if (localStorage.getItem('cur_loc')) {
        cur_loc = JSON.parse(localStorage.getItem('cur_loc'));
        coor = proj.fromLonLat([cur_loc.lon, cur_loc.lat]);
        that.offer.stobj.latitude = cur_loc.lat;
        that.offer.stobj.longitude = cur_loc.lon;
      }
      if (!coor && localStorage.getItem('gps_loc')) {
        cur_loc = JSON.parse(localStorage.getItem('gps_loc'));
        coor = proj.fromLonLat([cur_loc.lon, cur_loc.lat]);
        that.offer.stobj.latitude = cur_loc.lat;
        that.offer.stobj.longitude = cur_loc.lon;
      }

      if (!coor) {
        that.offer.stobj.latitude = 0;
        that.offer.stobj.longitude = 0;
        coor = proj.fromLonLat(['0', '0']);
      }

      //$('#loc_ctrl').trigger('click');
      // that.map.MoveToLocation(coor, "SetCurPosition", () => {
      // });

      that.map.CreateOverlay(that.offer.stobj, function () {
        if (that.profile.profile.avatar) {
          $('#user_container')
            .find('img')
            .attr('src', that.image_path + that.profile.profile.avatar);
          $('#user').attr('src', that.image_path + that.profile.profile.avatar);
        }
      });

      $('#map').on('drop', function (ev, data) {
        ev.preventDefault();
        let coor;
        if (data) coor = data.coordinate;
        else {
          let pixel = [ev.originalEvent.clientX, ev.originalEvent.clientY];
          coor = that.map.ol_map.getCoordinateFromPixel(pixel);
        }
        if (!that.offer.stobj) that.offer.stobj = {};
        that.offer.stobj.location = coor;
        that.offer.stobj.longitude = proj.toLonLat(coor)[0];
        that.offer.stobj.latitude = proj.toLonLat(coor)[1];
        if (!window.user.user_ovl) {
          let user_cont = $('#user_container').clone()[0];
          $(user_cont).find('img').attr('id', 'user_2');

          if (that.profile.profile.avatar)
            $(user_cont)
              .find('img')
              .attr('src', that.image_path + that.profile.profile.avatar);
          else
            $(user_cont)
              .find('img')
              .attr(
                'src',
                that.image_path + '4ca7b7589b452a63ef7c34acdc61ad48'
              );

          let status;
          if (!that.offer.stobj.published) status = 'unpublished';
          else status = 'published';
          $(user_cont).addClass(status);
          that.offer.stobj.profile = that.profile.profile;
          that.offer.stobj.profile.type = 'marketer';
          that.offer.stobj.profile.lang = window.sets.lang;
          that.offer.stobj.uid = window.user.uid;
          that.map.CreateOverlay(that.offer.stobj, function () {});

          //$('#user').css('visibility', 'hidden');
        } else {
          window.user.user_ovl.overlay.values_.position = coor;
          if (window.user.user_ovl.modify)
            window.user.user_ovl.modify.features_.array_[0].values_.geometry.setCenter(
              coor
            );
          window.user.user_ovl.overlay.changed();
        }

        window.db.GetOffer(window.user.offer.stobj.date, function (of) {
          if (of[0]) {
            of[0].location = coor;
            window.db.SetObject('offerStore', of[0], (res) => {});
          }
        });
      });

      that.import.GetOrderSupplier(function () {
        var md5 = require('md5');
        window.db.GetSupOrders(
          moment(window.user.date).format('YYYY-MM-DD'),
          window.user.uid,
          function (objs) {
            let type = 'customer';
            for (let o in objs) {
              window.user.map.geo.SearchLocation(
                objs[o].address,
                function (bound, lat, lon) {
                  if (lat && lon) {
                    let loc = proj.fromLonLat([
                      parseFloat(lon),
                      parseFloat(lat),
                    ]);
                    var markerFeature = new Feature({
                      geometry: new Point(loc),
                      labelPoint: new Point(loc),
                      //name: cursor.value.title ? cursor.value.title : "",
                      //tooltip: cursor.value.title ? cursor.value.title : "",
                      type: type,
                      object: objs[o],
                    });
                    var id_str = md5(window.user.date + objs[o].cusuid);
                    markerFeature.setId(id_str);

                    let layer = that.map.ol_map.getLayers().get(type);
                    if (!layer) {
                      layer = that.map.layers.CreateLayer(type, '1');
                    }
                    let source = layer.values_.vector;

                    if (
                      !source.getFeatureById(markerFeature.getId()) &&
                      markerFeature.values_.object.date === window.user.date
                    )
                      that.map.layers.AddCluster(layer, markerFeature);
                  }
                }
              );
            }
          }
        );
      });

      that.import.GetApprovedSupplier(function (res) {});
    })();
  }

  UpdateOfferLocal(offer) {
    this.offer.SetOfferDB(offer);
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
      window.user.constructor.name === 'Deliver' &&
      (!this.offer.stobj.latitude ||
        !this.offer.stobj.longitude ||
        Object.keys(menu).length === 0)
    ) {
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
        radius: that.offer.stobj.radius ? that.offer.stobj.radius : 1000,
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
            resolve({
              offer: JSON.stringify(menu),
              dict: data_obj.dict,
              latitude: that.offer.stobj.latitude,
              longitude: that.offer.stobj.longitude,
            });
          }
        });
      });

      let res = await promise;
      cb(res, data_obj);
    } catch (ex) {
      cb();
    }
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
        window.db.SetObject('approvedStore', data_obj, function (res) {});
      }
    });
  }

  SendLocation(loc) {
    if (this.isShare_loc) {
      let location = proj.toLonLat(loc);
      location[0] = parseFloat(location[0].toFixed(6));
      location[1] = parseFloat(location[1].toFixed(6));
      let data_obj = {
        proj: d2d,
        user: window.user.constructor.name.toLowerCase(),
        func: 'sharelocation',
        uid: window.user.uid,
        supuid: this.email,
        date: this.date,
        location: [this.offer.stobj.longitude, this.offer.stobj.latitude],
      };

      window.network.postRequest(data_obj, function (data) {
        console.log(data);
      });

      if (window.user.user_ovl) {
        window.user.user_ovl.overlay.setPosition(loc);
      }
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

//////////////////
// WEBPACK FOOTER
// ./src/deliver/deliver.js
// module id = 762
// module chunks = 2

'use strict';

import { Utils } from '../utils/utils';
let utils = new Utils();

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui');
require('jquery-ui-touch-punch');

let moment = require('moment/moment');
// let shortHash = require('shorthash');
// let md5 = require('md5');
import BingMaps from 'ol/source/BingMaps.js';

import Map from 'ol/map';
import View from 'ol/view';
import Layer from 'ol/layer/layer';
import Tile from 'ol/layer/tile';
import TileLayer from 'ol/layer/tile';
import Cluster from 'ol/source/cluster';

import XYZ from 'ol/source/xyz';
import OSM from 'ol/source/osm';
import interaction from 'ol/interaction';
import control from 'ol/control';
import Projection from 'ol/proj/projection';
import Point from 'ol/geom/point';
import DeviceOrientation from 'ol/deviceorientation';

import proj from 'ol/proj';
import Draw from 'ol/interaction/draw';
import Style from 'ol/style/style';
import Fill from 'ol/style/fill';
import Stroke from 'ol/style/stroke';

import Modify from 'ol/interaction/modify';
import Snap from 'ol/interaction/snap';

import Circle from 'ol/geom/circle';
import Collection from 'ol/collection';
import Feature from 'ol/feature';
import { Geo } from './location/geolocation';

import { Animate } from './animate/animate';
import { Layers } from './layers/layers';

import { OfferOrder } from '../customer/init.frame';

import { OverlayItem } from '../map/overlay/overlay';

import { Carousel } from './carousel/carousel';
import ColorHash from 'color-hash';

// import proj4 from 'ol/proj/proj4';
// import {register} from 'ol/proj/proj4';
// import {get as getProjection} from 'ol/proj';

export class OLMap {
  constructor() {
    //let full_screen = new control.FullScreen();
    //full_screen.setTarget('full_screen');
    window.sets.app_mode = 'd2d';

    this.path = 'http://localhost:5500/d2d/server';
    if (window.con_param.host_port.includes('delivery-angels'))
      this.path = 'https://delivery-angels.store/server';
    else this.path = window.con_param.host_port;

    this.image_path = window.con_param.image_path;

    window.sets.app_mode = 'd2d';

    this.lat_param = utils.getParameterByName('lat');
    this.lon_param = utils.getParameterByName('lon');
    this.zoom_param = utils.getParameterByName('zoom');

    if (!this.ol_map) {
      this.ol_map = new Map({
        layers: [
          new TileLayer({
            preload: Infinity,
            source: new BingMaps({
              key: window.sets.bing_key,
              imagerySet: 'Road',
            }),
          }),
        ],
        // layers: [
        //   new Tile({
        //     source: new OSM(),
        //   }),
        // ],
        // layers: [
        //   new Tile({
        //     preload: 4,
        //     source: new XYZ({
        //       url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibmVkb2wiLCJhIjoiY2s3ejJzbXViMDF1bTNvbXRzZ3ZqMnFqNCJ9.QGsoAD2JcX-6bmpbKjvmWw',
        //     }),
        //   }),
        // ],
        //interactions: interaction.defaults({altShiftDragRotate: false, pinchRotate: false}),
        controls: control
          .defaults({
            zoom: false,
            attribution: false,
            rotate: false,
            attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
              collapsible: false,
            }),
          })
          .extend([
            // full_screen
          ]),
        target: 'map',
      });
    }

    this.mapEvents();

    this.geo = new Geo(this);

    this.animate = new Animate(this);

    this.layers = new Layers(this);

    this.carousel = new Carousel();

    this.carousel.CarouselEvents(this);

    this.featureAr = {};
  }

  Init(lat, lon, cb) {
    const that = this;

    that.lat_param = lat;
    that.lon_param = lon;

    // setTimeout(function () {
    let time = new Date().getTime();

    if (utils.getParameterByName('lat') && utils.getParameterByName('lon')) {
      let lat = utils.getParameterByName('lat');
      let lon = utils.getParameterByName('lon');
      window.sets.coords.cur = proj.fromLonLat([
        parseFloat(lon),
        parseFloat(lat),
      ]);
    } else if (lat && lon) {
      localStorage.setItem(
        'cur_loc',
        '{"lon":' +
          lon +
          ',' +
          '"lat":' +
          lat +
          ', "time":' +
          time +
          ',"zoom":"15"}'
      );
      window.sets.coords.cur = proj.fromLonLat([
        parseFloat(lon),
        parseFloat(lat),
      ]);
    } else {
      let c = '';
      let cur_loc = JSON.parse(localStorage.getItem('cur_loc'));
      if (!cur_loc || !cur_loc.lat || !cur_loc.lon) {
        let lonlat = [parseFloat('0'), parseFloat('0')];
        that.lat_param = lonlat[1];
        that.lon_param = lonlat[0];
        if (window.sets.coords.gps[0] != 0 && window.sets.coords.gps[1] != 0) {
          lonlat = window.sets.coords.gps;
        }
        //
        localStorage.setItem(
          'cur_loc',
          '{"lon":' +
            lonlat[0] +
            ',' +
            '"lat":' +
            lonlat[1] +
            ', "time":' +
            time +
            ',"zoom":"15"}'
        );
      }

      try {
        c = JSON.parse(localStorage.getItem('cur_loc'));
      } catch (ex) {}

      window.sets.coords.cur = proj.fromLonLat([
        parseFloat(c.lon),
        parseFloat(c.lat),
      ]);
    }

    // proj4.defs('EPSG:21781',
    //     '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 ' +
    //     '+x_0=600000 +y_0=200000 +ellps=bessel ' +
    //     '+towgs84=660.077,13.551,369.344,2.484,1.783,2.939,5.66 +units=m +no_defs');
    // register(proj4);
    // const swissProjection = getProjection('EPSG:21781');

    that.ol_map.setView(
      new View({
        center: window.sets.coords.cur,
        projection: new Projection({
          code: 'EPSG:3857', //'EPSG:4326', //
          units: 'm',
        }),
        zoom: 17,
      })
    );

    setTimeout(() => {
      that.ol_map.getView().animate(
        {
          center: window.sets.coords.cur,
          zoom: that.zoom_param ? that.zoom_param : 15,
          duration: window.sets.animate_duration * 4,
        },
        function () {
          //$("#marker").trigger("change:cur_pos", [window.sets.coords.cur, "Event"]);
          let latlon = proj.toLonLat(window.sets.coords.cur);
          $('#locText').text(latlon[1].toFixed(6) + ' ' + latlon[0].toFixed(6));
          $('#zoom_but').val(that.zoom_param ? that.zoom_param : 15);
          cb();
        }
      );
    }, 300);
  }

  EmptyMap() {
    const that = this;
    let layers = this.ol_map.getLayers();

    layers.forEach(function (layer, i, layers) {
      // if (layer.getSource().setStyle)
      //   layer.getSource().setStyle(null);

      that.ol_map.renderSync();

      if (layer.type === 'VECTOR') {
        layer.getSource().clear();
        layer.getSource().refresh();
      }
    });
    let overlays = that.ol_map.getOverlays();
    overlays.forEach(function (overlay) {
      that.ol_map.removeOverlay(overlay);
    });
  }

  tempOpenStore(feature) {
    if (feature.profile.email === utils.getParameterByName('supem')) {
      window.db.GetSupplier(window.user.date, feature.uid, (obj) => {
        if (obj !== -1) {
          if (window.user.constructor.name === 'Customer') {
            if (!window.user.viewer) {
              window.user.viewer = new OfferOrder();
            }
            window.user.viewer.InitCustomerOrder(obj);
            this.tempOpenStore = function () {}; //re-assigned
          }
        }
      });
    }
  }

  SetFeatures(objs) {
    const that = this;
    for (let o in objs) {
      //alert(JSON.stringify(objs[o]));
      if (objs[o].deleted) continue;
      var feature = new Feature({
        geometry: new Point(
          proj.fromLonLat([objs[o].longitude, objs[o].latitude])
        ),
        labelPoint: new Point(
          proj.fromLonLat([objs[o].longitude, objs[o].latitude])
        ),
        //name: cursor.value.title ? cursor.value.title : "",
        //tooltip: cursor.value.title ? cursor.value.title : "",
        categories: JSON.parse(objs[o].categories),
        type: 'supplier',
        object: objs[o],
      });
      feature.setId(objs[o].uid);

      let c = 0;

      for (let tab in objs[o].data) {
        let catAr = $('.category[state=1]').toArray(); //features[f].values_.categories[c++];

        let res = $.grep(catAr, function (el, i) {
          return el.id === tab;
        });
        if (res.length === 0) continue;

        if (!objs[o].profile) {
          continue;
        }

        // if (
        //   window.user.constructor.name === 'Customer' &&
        //   objs[o].profile.type === 'foodtruck'
        // ) {
        //   // if ($('iframe#' + objs[o].uid).length === 0) {
        //   //   that.CreateOverlay(objs[o]);
        //   //   that.CreateCircle(objs[o]);
        //   // }
        //   continue;
        // }

        let layer = that.ol_map
          .getLayers()
          .get(tab + '_' + objs[o].profile.type);
        if (!layer) {
          layer = that.layers.CreateLayer(
            tab + '_' + objs[o].profile.type,
            '1'
          );
        }

        let source = layer.getSource();
        if (source.source) source = source.source;

        if (objs[o].uid === window.user.uid) {
          continue;
        }

        if (
          objs[o].profile.type === 'deliver' &&
          window.user.constructor.name === 'Supplier'
        )
          continue;

        feature.uid = objs[o].uid;

        if (
          objs[o].profile.type &&
          (objs[o].profile.type.toLowerCase() === 'marketer' ||
            objs[o].profile.type.toLowerCase() === 'foodtruck')
        ) {
          if (
            source.getFeatureById(objs[o].uid + objs[o].date)
            // ||
            // source
            //   .getFeatureById(objs[o].uid + objs[o].date)
            //   .values_.object.date.valueOf() !== objs[o].date.valueOf()
          ) {
            continue;
          }

          // if (objs[o].profile.type.toLowerCase() === 'foodtruck') {
          //   var p1 = ol.proj.transform(
          //     [103.986908, 1.353199],
          //     'EPSG:4326',
          //     'EPSG:3857'
          //   );
          //   var p2 = ol.proj.transform(
          //     [103.986498, 1.353864],
          //     'EPSG:4326',
          //     'EPSG:3857'
          //   );
          //   var p3 = ol.proj.transform(
          //     [103.986498, 1.353864],
          //     'EPSG:4326',
          //     'EPSG:3857'
          //   );
          //   var p4 = ol.proj.transform(
          //     [103.988247, 1.358454],
          //     'EPSG:4326',
          //     'EPSG:3857'
          //   );
          //   feature = new ol.Feature({
          //     geometry: new ol.geom.MultiLineString([
          //       [p1, p2],
          //       [p4, p3],
          //     ]),
          //     name: 'camera',
          //   });
          // }

          feature.id_ = objs[o].uid + objs[o].date;
          source.addFeature(feature);

          let dist = 100;

          if (objs[o].profile.type.toLowerCase() === 'foodtruck') {
            dist = 20;
          }
          objs[o].img = './images/ic_' + tab + '.png';
          let clusterSource = new Cluster({
            distance: dist,
            source: source,
          });

          layer.setSource(clusterSource);

          that.tempOpenStore(objs[o]);
        } else if (
          objs[o].profile.type.toLowerCase() === 'deliver' &&
          window.user.constructor.name === 'Customer'
        ) {
          if (
            that.layers.circleLayer &&
            that.layers.circleLayer.getSource().getFeatureById(objs[o].uid)
            // ||
            // source
            //   .getFeatureById(objs[o].uid + objs[o].date)
            //   .values_.object.date.valueOf() !== objs[o].date.valueOf()
          ) {
            continue;
          }

          objs[o].img = objs[o].profile.thmb;
          // let clusterSource = new  Cluster({
          //     distance: 150,
          //     source: source
          // });
          // layer.setSource(clusterSource);

          var colorHash = new ColorHash();
          let clr = colorHash.rgb(objs[o].uid);

          let style = new Style({
            // fill: new style.Fill_({
            //     color: 'rgba(255, 255, 255, 0)'
            // }),
            stroke: new Stroke({
              color: 'rgba(' + clr[0] + ',' + clr[1] + ',' + clr[2] + ', 1)',
              width: 1,
            }),
          });

          if (!that.layers.circleLayer) {
            that.layers.CreateCircleLayer(style);
          }

          that.layers.circleLayer.getSource().addFeature(feature);

          let radiusFeature = '';
          if (objs[o].radius_feature) {
            radiusFeature = objs[o].radius_feature;
          } else {
            radiusFeature = new Feature({
              geometry: new Circle(
                proj.fromLonLat([objs[o].longitude, objs[o].latitude]),
                objs[o].radius
              ),
              //name: cursor.value.title ? cursor.value.title : "",
              //tooltip: cursor.value.title ? cursor.value.title : "",
              obj: objs[o],
            });

            radiusFeature.setId(objs[o].uid);

            objs[o].radius_feature = radiusFeature;

            let col = new Collection();
            col.push(radiusFeature);
            let draw = new Draw({
              geometryName: 'circle',
              source: source,
              type: 'Circle',
              features: col,
              style: style,
            });
            // if (!circle_source.getFeatureById(objs[o].uid))
            //     circle_source.addFeature(radiusFeature);

            that.layers.PutDeliversOnMap();
          }
        }
      }
    }
  }

  GetObjectsFromStorage(area) {
    const that = this;
    let period = $('.sel_period').text().split(' - ');
    $('.cat_cnt').text('0');

    $('.mp_open').prop('disabled', true);

    if (area) {
      setTimeout(function () {
        window.db.GetRangeDeliver(
          moment(window.user.date).format('YYYY-MM-DD'),
          parseFloat(area[0]),
          parseFloat(area[2]),
          parseFloat(area[1]),
          parseFloat(area[3]),
          function (features) {
            if (features.length === 0) {
              let layers = that.ol_map.getLayers();
              for (let l in layers.array_) {
                let layer = layers.array_[l];
                if (
                  layer.type === 'VECTOR' &&
                  layer !== that.layers.circleLayer
                ) {
                  if (layer.getSource()) layer.getSource().clear(true);
                  if (layer.getSource().source) {
                    layer.getSource().clear(true);
                  }
                }
              }
              $('.carousel-inner').empty();
              $('#items_carousel').css('display', 'none');
              //$('.nav-link').addClass('disabled');
            } else {
              features = _.orderBy(
                features,
                function (o) {
                  return new moment(o.date).format('YYYYMMDD');
                },
                ['desc']
              );

              //thomaskekeisen.de/en/blog/array-date-sort-lodash-momentjs/
              that.SetFeatures(features);
              that.carousel.SetFeatures(features);
            }
          }
        );
      }, 100);

      //delivers

      window.db.GetAllSuppliers(window.user.date, function (features) {
        _.forEach(features, function (f) {
          if (
            f.profile.type === 'marketer' &&
            Date(window.user.date) > Date(f.date)
          ) {
            // window.db.SetObject('supplierStore', f, function (cat) {});
          }
        });
      });
    } else {
      window.db.GetAllSuppliers(window.user.date, function (features) {
        that.SetFeatures(features);
      });
    }
  }

  OnItemClick(el) {
    const that = this;
    this.geo.StopLocation();
    window.db.GetSupplier(
      moment(window.user.date).format('YYYY-MM-DD'),
      $(el).attr('supuid'),
      function (obj) {
        if (obj.profile.type !== 'deliver') {
          let loc =
            window.user.constructor.name === 'Supplier'
              ? window.user.offer.stobj.location
              : proj.fromLonLat([obj.longitude, obj.latitude]);
          that.ol_map.getView().animate(
            {
              center: loc,
              zoom: 17,
              duration: window.sets.animate_duration * 2,
            },
            function (ev) {}
          );
        }

        if (window.user.constructor.name === 'Supplier') {
          window.user.editor.InitSupplierOffer();
          return;
        }
        if (window.user.constructor.name === 'Customer') {
          if (!window.user.viewer) {
            window.user.viewer = new OfferOrder();
          }
          window.user.viewer.InitCustomerOrder(obj, $(el).attr('title'));
        }
      }
    );
  }

  SetMarkersArExt(cat, jsAr) {
    var obj = jsAr.shift();
    window.db.SetObject('supplierStore', obj, function (cat) {
      if (jsAr.length === 0) this.GetObjectsFromStorage();
      else this.SetMarkersArExt(cat, jsAr);
    });
  }

  FlyToLocation(location) {
    const that = this;
    this.animate.flyTo(location, function () {
      //Marker.overlay.setPosition(data.data[data.data.length-1]);
      let latlon = proj.toLonLat(location);
      $('#locText').text(latlon[1].toFixed(6) + ' ' + latlon[0].toFixed(6));
      $('#zoom_but').val(that.zoom_param ? that.zoom_param : 15);
    });
  }

  MoveToLocation(location, orig, cb) {
    const that = this;
    if (
      (window.user.constructor.name === 'Supplier' ||
        window.user.constructor.name === 'Deliver') &&
      orig === 'SetCurPosition'
    ) {
      window.user.map.geo.StopLocation();
    }
    that.ol_map.getView().animate(
      {
        center: location,
        //,duration: window.sets.animate_duration * 2,
      },
      function () {
        //$("#marker").trigger("change:cur_pos", [window.sets.coords.cur, "Event"]);
        let latlon = '';
        if (location) {
          latlon = proj.toLonLat(location);
          $('#locText').text(latlon[1].toFixed(6) + ' ' + latlon[0].toFixed(6));
        }
        if (
          window.user.constructor.name === 'Supplier' ||
          window.user.constructor.name === 'Deliver'
        ) {
          if (window.user.user_ovl) {
            window.user.user_ovl.overlay.values_.position = location;
            window.user.user_ovl.overlay.changed();
            let loc = proj.toLonLat(location);
            window.user.offer.stobj.latitude = loc[1];
            window.user.offer.stobj.longitude = loc[0];
            if (window.user.user_ovl.modify) {
              window.user.user_ovl.modify.features_.array_[0].values_.geometry.setCenter(
                location
              );
              window.user.user_ovl.modify.changed();
            }
            cb();
          }
        }

        try {
          $('#loc_ctrl[data-toggle="tooltip"]').tooltip('dispose');
        } catch (ex) {}
        cb();
      }
    );
  }

  MoveToBound(bound) {
    let location = proj.fromLonLat([
      parseFloat(bound[2]),
      parseFloat(bound[0]),
    ]);
    this.MoveToLocation(location, null, function () {});
  }

  SetBounds(obj) {
    try {
      this.ol_map
        .getView()
        .fit(
          proj.transformExtent(
            [
              parseFloat(obj.sw_lng),
              parseFloat(obj.sw_lat),
              parseFloat(obj.ne_lng),
              parseFloat(obj.ne_lat),
            ],
            'EPSG:4326',
            'EPSG:3857'
          ),
          {
            duration: window.sets.animate_duration,
          }
        ); // [minlon, minlat, maxlon, maxlat]
    } catch (ex) {
      alert(ex);
    }
  }

  SetFeatureGeometry(feature, loc) {
    feature.setGeometry(new geom.Point(loc));
  }

  mapEvents() {
    const that = this;

    $('#map').on('focusout', () => {
      console.log();
    });

    this.ol_map.on('movestart', function (event) {
      //this.dispatchEvent('click');
    });

    this.ol_map.on('moveend', function (event) {
      if (event) {
        var time = new Date().getTime();
        let lonlat = proj.toLonLat(that.ol_map.getView().getCenter());
        if (
          isNaN(lonlat[0]) ||
          isNaN(lonlat[1]) ||
          lonlat[0] === 0.0 ||
          lonlat[1] === 0.0
        )
          return;
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
            that.ol_map.getView().getZoom() +
            '}'
        );

        if (window.user.constructor.name === 'Supplier') {
          //window.user.offer.stobj.location = that.ol_map.getView().getCenter();

          return;
        }
        if (window.user.constructor.name === 'Deliver') {
          var zoom = parseInt(that.ol_map.getView().getZoom()).toString();

          if (window.user.user_ovl)
            $(window.user.user_ovl.overlay.element).css('width', '50px');
        }
        if (window.user.import) window.user.import.ImportDataByLocation(event);
      }
    });

    this.ol_map.getView().on('change:resolution', function (event) {
      var zoom = parseInt(that.ol_map.getView().getZoom()).toString();

      if (
        $('.fd_frame') &&
        $('.fd_frame').contents()[0] &&
        $('.fd_frame').contents()[0].body
      ) {
        $('.fd_frame').trigger('load');

        let w = (Math.pow(zoom, 3) / 50).toFixed(2);
        $('.fd_frame').css('width', w);

        //$('.fd_frame')[0].ovl.values_.offset = [-w / 2, -w / 2];
      }

      $('#zoom_but').val(zoom);
      if (zoom >= 9) $('#zoom_but').css('color', 'blue');
      else $('#zoom_but').css('color', 'black');

      var bounce = that.ol_map.getView().calculateExtent(that.ol_map.getSize());
    });

    this.ol_map.on('pointerdrag', function (event) {
      //TODO: положение маркера по клику $("#marker").trigger("change:cur_pos", ["Custom", event]);

      try {
        that.coord.cur = event.target.focus_;
      } catch (ex) {}
    });
  }

  CreateOverlay(obj, cb) {
    const that = this;
    let fd_frame = $('#fd_frame_tmplt').clone();
    $(fd_frame).attr('id', obj.uid);
    $(fd_frame).addClass('fd_frame');
    $(fd_frame).css('display', 'block');

    var zoom = parseInt(that.ol_map.getView().getZoom()).toString();

    $(fd_frame).css('max-width', '100px');
    $(fd_frame).css('max-height', '100px');

    if ($('#' + obj.uid).length === 0) {
      let loc = obj.location
        ? obj.location
        : proj.fromLonLat([obj.longitude, obj.latitude]);
      obj.location = loc;

      $(fd_frame).on('load', function (ev) {
        $(fd_frame).off('load');
        if (!window.user.user_ovl && $(fd_frame)[0]) {
          window.user.user_ovl = new OverlayItem(that, $(fd_frame)[0], obj);
          //cb();

          obj.dict = window.dict;
          if (window.user.constructor.name === 'Deliver')
            window.user.editor.InitDeliverOffer(obj);

          setTimeout(function () {
            $('#user', $(fd_frame).contents()).on(
              'click touchstart',
              function () {
                $(fd_frame).attr('supuid', obj.uid);

                if (window.user.constructor.name === 'Supplier')
                  window.user.editor.InitSupplierOffer();
                else if (window.user.constructor.name === 'Customer') {
                  that.OnItemClick(fd_frame);
                }
              }
            );
            $('#user', $(fd_frame).contents()).attr(
              'src',
              that.image_path + obj.profile.avatar
            );
          }, 2000);
        }
      });

      $('#foodtrucks').append(fd_frame);
    }
  }

  CreateCircle(offer) {
    const that = this;
    let layer;
    if (that.layers.circleLayer) {
      layer = that.layers.circleLayer;
    } else {
      let style = new Style({
        // fill: new style.Fill_({
        //     color: 'rgba(255, 255, 255, .2)'
        // }),
        stroke: new Stroke({
          color: 'rgba(255, 0, 0, 1)',
          width: 1,
        }),
      });

      that.layers.CreateCircleLayer(style);
      layer = that.layers.circleLayer;
    }

    var source = layer.getSource();

    var radiusFeature = new Feature({
      geometry: new Circle(offer.location, offer.radius ? offer.radius : 1000),
      //name: cursor.value.title ? cursor.value.title : "",
      //tooltip: cursor.value.title ? cursor.value.title : "",
      type: offer.profile.type,
      object: offer,
    });

    radiusFeature.un('click', function (ev) {});

    radiusFeature.setId('radius_' + offer.uid);
    radiusFeature.supuid = offer.uid;
    source.addFeature(radiusFeature);

    if (!this.collection) this.collection = new Collection();
    this.collection.push(radiusFeature);
    that.draw = new Draw({
      geometryName: 'circle',
      source: source,
      type: 'Circle',
      features: that.collection,
    });

    //that.map.ol_map.addInteraction(that.draw);
    that.snap = new Snap({ source: source });
    that.ol_map.addInteraction(that.snap);
    if (window.user.constructor.name !== 'Customer') {
      that.modify = new interaction.Modify({ source: source });
      that.modify.addEventListener('modifyend', function (ev) {
        let radius = parseFloat(
          ev.features.array_[0].values_.geometry.getRadius().toFixed(2)
        );
        window.db.GetOffer(
          moment(window.user.date).format('YYYY-MM-DD'),
          function (of) {
            if (of[0]) {
              of[0].radius = radius;
              window.db.SetObject('offerStore', of[0], (res) => {
                window.user.offer.stobj.radius = radius;
              });
            }
          }
        );
      });
      that.map.ol_map.addInteraction(that.modify);
    }

    that.draw.addEventListener('drawstart', function (ev) {});
    that.draw.addEventListener('drawend', function (ev) {
      // that.map.ol_map.removeInteraction(that.draw);
      that.overlay.values_.position = ev.target.sketchCoords_[0];
    });
  }
}

//////////////////
// WEBPACK FOOTER
// ./src/map/map.js
// module id = 573
// module chunks = 1 2

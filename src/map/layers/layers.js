export { Layers };

import VectorLayer from 'ol/layer/vector';
import VectorSource from 'ol/source/vector';

import Cluster from 'ol/source/cluster';
import Style from 'ol/style/style';
import Circle from 'ol/style/circle';
import Icon from 'ol/style/icon';
import Fill from 'ol/style/fill';
import Text from 'ol/style/text';
import TextPlacement from 'ol/style/text';
import Stroke from 'ol/style/stroke';
import MultiLineString from 'ol/geom/multilinestring';

import Observable from 'ol/observable';

import { UtilsMap } from '../../utils/utils.map.js';
let moment = require('moment/moment');

class Layers {
  constructor(map) {
    this.map = map;
    const that = this;
    this.ar = [];
    this.flag = true;
    this.path = window.con_param.host_port;
    this.image_path = window.con_param.image_path;
    this.zoom = this.map.ol_map.getView().getZoom();
  }
  PutDeliversOnMap() {
    const that = this;
    let source;
    if (that.circleLayer) {
      source = that.circleLayer.getSource();
    } else {
      return;
    }
    let features = source.getFeatures();

    for (let f in features) {
      let util = new UtilsMap();
      if (util.IsInsideRadius(that.map, features[f])) {
        if (
          $('.deliver_but[supuid=' + features[f].values_.object.uid + ']')
            .length === 0
        ) {
          let deliver_but =
            '<div><input type="image" class="deliver_but"' +
            'src="' +
            that.image_path +
            features[f].values_.object.profile.avatar +
            '"' +
            ' supuid=' +
            features[f].values_.object.uid +
            '></div>';
          $('#deliver_container').append(deliver_but);
          $('#deliver_container').css('display', 'block');

          // $('#deliver_but').attr('src',that.path +"/server/images/"+features[f].obj.profile.avatar);
        }

        if (that.circleLayer.style_.fill_)
          that.circleLayer.style_.fill_.color_ = 'rgba(255, 255, 255, 0.2)';
      } else {
        if (features[f].values_.object)
          $('.deliver_but[supuid=' + features[f].values_.object.uid + ']')
            .parent()
            .remove();
        // that.circleLayer.style_.fill_.color_ = 'rgba(255, 255, 255, 0)'
      }
    }

    let pos = JSON.parse(localStorage.getItem('deliver_pos'));
    if (pos) $('#deliver_container').offset({ top: pos.top, left: pos.left });
    $('#deliver_container').draggable(
      { delay: 100 },
      {
        start: function (ev) {},
        drag: function (ev) {
          $('.deliver_but').attr('drag', 'true');
        },
        stop: function (ev) {
          $('.deliver_but').attr('drag', 'false');

          let left = $('#deliver_container').position().left;
          // $(el).css('right', rel_x + '%');
          let top = $('#deliver_container').position().top;
          // $(el).css('bottom', rel_y + '%');
          localStorage.setItem(
            'deliver_pos',
            JSON.stringify({ top: top, left: left })
          );
        },
      }
    );
    $('.deliver_but').off();
    $('.deliver_but').on('click touchstart', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      setTimeout(function () {
        if ($('.deliver_but').attr('drag') !== 'true')
          window.user.OnClickDeliver(ev.currentTarget);
      }, 200);
    });
  }

  CreateCircleLayer(style) {
    this.circleLayer = new VectorLayer({
      source: new VectorSource(),
      style: style,
    });
    this.map.ol_map.getLayers().push(this.circleLayer);
    this.map.ol_map.getLayers().set('radius', this.circleLayer, true);
  }

  SetMapVisible(map) {
    let layers = this.map.ol_map.getLayers();
    layers.forEach(function (layer, i, layers) {
      if (layer.map_type) {
        layer.setVisible(true);
      }
    });

    $("[map='" + map + "']").attr('checked', 'checked');
  }

  CreateLayer(cat, state) {
    let that = this;
    let style;
    let features = [];

    let vectorSource = new VectorSource({
      features: features,
    });

    let clusterSource = new Cluster({
      distance: 50, //parseInt(50, 10),
      source: vectorSource,
    });
    let id_str = '';

    let vectorLayer = new VectorLayer({
      map_type: false,
      source: vectorSource,
      vector: () => {
        return vectorSource;
      },
      cluster: clusterSource,
      style: function (cluster_feature, atr) {
        let period = $('.sel_period').text().split(' - ');
        let features = cluster_feature.values_.features
          ? cluster_feature.values_.features
          : [cluster_feature];

        if (features || (features && features.length > 0)) {
          $.each(features, (key, feature) => {
            if (!feature) {
              features.splice(key, 1);
              return;
            }
            id_str = feature.getId();

            try {
              if (
                moment(feature.values_.object.date).isBefore(
                  window.user.date
                ) ||
                moment(feature.values_.object.date).isAfter(window.user.date)
              ) {
                if (clusterSource.getFeatureById(id_str)) {
                  let f = clusterSource.getFeatureById(id_str);
                  clusterSource.removeFeature(f);
                }
                if (vectorSource.getFeatureById(id_str)) {
                  let f = vectorSource.getFeatureById(id_str);
                  vectorSource.removeFeature(f);
                }
              } else {
                that.zoom = that.map.ol_map.getView().getZoom();

                let style = getObjectStyle(feature.values_.object);
                cluster_feature.setStyle(style);
              }
            } catch (ex) {
              console.log(JSON.stringify(ex));
            }
          });
        } else if (cluster_feature) {
        }

        function getObjectStyle(obj, appr) {
          if (!obj || parseInt(obj.status) === 0) return null;
          function stringDivider(str, width, spaceReplacer) {
            if (str.length > width) {
              var p = width;
              while (p > 0 && str[p] != ' ' && str[p] != '-') {
                p--;
              }
              if (p > 0) {
                var left;
                if (str.substring(p, p + 1) == '-') {
                  left = str.substring(0, p + 1);
                } else {
                  left = str.substring(0, p);
                }
                var right = str.substring(p + 1);
                return (
                  left +
                  spaceReplacer +
                  stringDivider(right, width, spaceReplacer)
                );
              }
            }
            return str;
          }

          let ic_clust = './images/truck.png';
          let scale = 1;
          let opacity = 1;
          let logo = obj.logo;

          let diff = new Date().getTime() - new Date(obj.date).getTime();
          var days = Math.floor(diff / (1000 * 60 * 60 * 24));

          //TODO: delayed features
          obj.delayed = false;
          // if (days >= 30)//просрочен
          //     obj.delayed = true;
          let thmb = that.image_path + obj.profile.avatar;
          scale = Math.pow(that.zoom, 3) / 30000;
          let wt = _.values(
            _.find(obj.profile.worktime, (item) => {
              const day = moment(obj.date).weekday();
              if (item['w_' + day]) {
                return item;
              }
            })
          )[0];
          if (!obj.profile.worktime) {
            wt = '08:00-20:00';
          }
          if (obj.profile.type === 'marketer') {
            if (that.zoom < 10 && features.length === 1)
              //non cluster
              return null;
            if (that.zoom < 10 && features.length > 1) {
              ic_clust = obj.img;
              scale = Math.pow(that.map.ol_map.getView().getZoom(), 3) / 10000;
            }
            if (that.zoom >= 10 && features.length === 1) {
              scale =
                Math.pow(that.map.ol_map.getView().getZoom(), 5) / (5 * 1.0e6);
            }

            // if (!wt) return null;
          } else if (obj.profile.type === 'deliver') {
            // if(that.map.ol_map.getView().getZoom()<15)
            //     return;
            ic_clust = obj.img;
            scale = Math.pow(that.map.ol_map.getView().getZoom(), 3) / 10000;
            opacity = 0;
          } else if (obj.profile.type === 'foodtruck') {
            // if(that.map.ol_map.getView().getZoom()<15)
            //     return;
            //thmb = that.image_path + obj.img; //obj.profile.avatar;
            //ic_clust = obj.img;
            scale = Math.pow(that.map.ol_map.getView().getZoom(), 5) / 4000000;
            if (moment(obj.date).isSame(window.user.date) && wt) {
              opacity = 1;
            } else {
              opacity = 0.3;
            }
          }

          //TODO:
          // if(days>=30) {
          //     opacity /= days-30;
          // }
          // if(days>30){
          //     opacity = 0.3;
          // }

          let iconItem = new Icon(
            /** @type {olx.style.IconOptions} */ ({
              //size: [500,500],
              //img: image,
              //imgSize:
              scale: obj.delayed ? scale / 2.5 : scale, //cl_feature.I.features.length>1 || obj.image.indexOf('/categories/')!== -1?0.3:1.0,//
              // anchor: [0.5,0.5],
              // anchorOrigin: 'top-left',//'bottom-left',
              //offset: [20, 20],
              offsetOrigin: 'top-left',
              // anchorXUnits: 'pixel',
              // anchorYUnits: 'pixel',
              color: obj.delayed ? [200, 200, 200] : [255, 255, 255],
              opacity: opacity,
              src: obj.profile.avatar ? thmb : './images/user.png',
              crossOrigin: 'anonymous',
              fill: new Fill({
                color: 'gray',
              }),
            })
          );

          let iconStyle;
          if (features.length > 1 && obj.profile.type !== 'foodtruck') {
            //cluster
            const cat = _.intersection(
              features[0].values_.categories,
              features[1].values_.categories
            );

            ic_clust = './images/ic_' + cat + '.png';
            let iconCluster = new Icon(
              /** @type {olx.style.IconOptions} */ ({
                //size: [100,100],
                //img: image,
                //imgSize:
                crossOrigin: 'anonymous',
                scale: scale, //cl_feature.I.features.length>1 || obj.image.indexOf('/categories/')!== -1?0.3:1.0,//
                // anchor: [40, 40],
                // anchorOrigin: 'top-right',
                offset: [0, 0],
                // anchorXUnits: 'pixel',
                // anchorYUnits: 'pixel',
                color: [255, 255, 255, 1],
                opacity: 0.9,
                src: ic_clust,
              })
            );

            let label = features.length.toString();
            iconStyle = new Style({
              text: new Text({
                text: label,
                font: (60 * scale).toFixed(0) + 'px serif',
                textAlign: 'end',
                //scale: .1,
                offsetX: (100 * scale).toFixed(0),
                offsetY: (-100 * scale).toFixed(0),
                fill: new Fill({
                  color: 'blue',
                }),
                stroke: new Stroke({
                  color: 'white',
                  width: 2,
                }),
              }),
              image: iconCluster,
              zIndex: 20,
            });

            //source.clear();
          } else {
            let nameAr = obj.profile.name.split(' ');
            let label = nameAr.join('\n');
            let canvas = document.createElement('canvas');
            let context = canvas.getContext('2d');
            let width = context.measureText(label).width;
            iconStyle = new Style({
              image: iconItem,
              zIndex: 20,
            });

            if (!moment(obj.date).isSame(window.user.date))
              iconStyle.text_ = new Text({
                text: moment(obj.date).format('DD.MM.YYYY'),
                font: (30 * scale).toFixed(0) + 'px serif',
                placement: 'point',
                textAlign: 'right',
                //scale: 1.5,
                // offsetX: 0, //width/2,
                // offsetY: 25,
                // offsetX: 60,
                // offsetY: -30,
                textBaseline: 'top',
                fill: new Fill({
                  color: 'blue',
                }),
                stroke: new Stroke({
                  color: 'white',
                  width: 2,
                }),
              });

            try {
              if (that.circleLayer) {
                let source = that.circleLayer.getSource();
                if (obj.radius_feature) source.addFeature(obj.radius_feature);
              }
            } catch (ex) {}
          }

          //circle_style.image_.setScale(that.map.ol_map.getView().getZoom());
          //TODO
          let shadowStyle = new Style({
            stroke: new Stroke({
              color: 'rgba(0,0,0,0.5)',
              width: 100,
            }),
            zIndex: 1,
          });

          style = [iconStyle, shadowStyle];

          return style;
        }
      },
    });

    let arr = this.map.ol_map.getLayers().getArray();
    let res = $.grep(arr, function (el, i) {
      return el === vectorLayer;
    });
    if (res.length <= 0) {
      this.map.ol_map.getLayers().push(vectorLayer);
      this.map.ol_map.getLayers().set(cat, vectorLayer, true);
    }

    vectorLayer.setProperties({ opacity: 1.0, contrast: 1.0 }); //setBrightness(1);
    vectorLayer.setVisible(state === '0' ? false : true);

    return vectorLayer;
  }

  EmptyLayer() {}

  SetFlash(feature) {
    let duration = 3000;

    if (feature.interval) return;

    function flash(feature) {
      let start = new Date().getTime();
      let listenerKey;

      function animate(event) {
        let vectorContext = event.vectorContext;
        let frameState = event.frameState;
        let flashGeom = feature.getGeometry().clone();
        let elapsed = frameState.time - start;
        let elapsedRatio = elapsed / duration;
        // radius will be 5 at start and 30 at end.
        let radius = easing.easeOut(elapsedRatio) * 25 + 5;
        let opacity = easing.easeOut(1 - elapsedRatio);

        let style = new Style({
          image: new Circle({
            radius: radius,
            snapToPixel: false,
            stroke: new Stroke({
              color: 'rgba(255, 0, 0, ' + opacity + ')',
              width: 0.25 + opacity,
            }),
          }),
        });

        vectorContext.setStyle(style);
        vectorContext.drawGeometry(flashGeom);
        if (elapsed > duration) {
          Observable.unByKey(listenerKey);
          return;
        }

        d2d_map.ol_map.render();
        // tell OpenLayers to continue postcompose animation
      }

      listenerKey = d2d_map.ol_map.on('postcompose', animate);
    }

    feature.interval = setInterval(function () {
      flash(feature);
    }, 3000);
  }

  AddCluster(layer, new_features) {
    let vectorSource = layer.vector;

    vectorSource.addFeature(new_features);

    let clusterSource = new source.Cluster({
      distance: 100, //parseInt(50, 10),
      source: vectorSource,
    });

    layer.setSource(clusterSource);
  }

  AddOverlayRecurs() {
    if (this.flag && this.ar.length > 0) {
      let obj = this.ar.shift();
      this.flag = false;
      let obj_id = GetObjId(obj.latitude, obj.longitude);
      if (obj.overlay.startsWith('http') || obj.overlay.startsWith('./')) {
        if ($('#' + obj_id + '_include').length === 0) {
          DownloadOverlay(obj.overlay, obj);
          //test OverlayFrame(obj.overlay, obj)
        } else {
          this.flag = true;
          this.AddOverlayRecurs();
        }
      } else {
        $('#locText').before(obj.overlay);
        this.flag = true;
        this.AddOverlayRecurs();
      }
    }
  }
}

//////////////////
// WEBPACK FOOTER
// ./src/map/layers/layers.js
// module id = 438
// module chunks = 0

//////////////////
// WEBPACK FOOTER
// ./src/map/layers/layers.js
// module id = 665
// module chunks = 0

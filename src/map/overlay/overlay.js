import { Utils } from '../../utils/utils';

//import {User} from "../menu/user";
import Overlay from 'ol/overlay';

import Collection from 'ol/collection';

import Feature from 'ol/feature';

import Modify from 'ol/interaction/modify';
import Draw from 'ol/interaction/draw';
import Snap from 'ol/interaction/snap';
import Circle from 'ol/geom/circle';

import Style from 'ol/style/style';
import Stroke from 'ol/style/stroke';

import proj from 'ol/proj';

let utils = new Utils();

(function ($) {
  $.fn.doubleTap = function (doubleTapCallback) {
    return this.each(function () {
      var elm = this;
      var lastTap = 0;
      $(elm).on('touchstart', function (e) {
        var now = new Date().valueOf();
        var diff = now - lastTap;
        lastTap = now;
        if (diff < 250) {
          if ($.isFunction(doubleTapCallback)) {
            doubleTapCallback.call(elm);
          }
        }
      });
    });
  };
})(jQuery);

export class OverlayItem {
  constructor(map, element, offer) {
    this.map = map;
    const that = this;
    this.draw;
    this.modify;
    this.snap; // global so we can remove them later
    this.offer = offer;

    let domRect = element.getBoundingClientRect();
    this.overlay = new Overlay({
      element: element,
      position: offer.location,
      positioning: 'center-center', //'top-left'//'bottom-right',//'center-center',//'bottom-right',//'top-left',//'bottom-left',
      offset: [
        -parseInt($(element).css('width')) / 4,
        -parseInt($(element).css('height')) / 2,
      ],
      //offset: [0,0],
      //anchor: [-150,50],
      autoPan: true,
    });

    if (window.user.profile.profile.type === 'deliver')
      this.CreateCircle(offer);

    element.ovl = this.overlay;

    this.map.ol_map.addOverlay(this.overlay);

    $(element).on('map:pointerdrag', function (ev) {
      try {
        // var offset = $(this).offset();
        // var center = proj.transform(that.map.ol_map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
        // var coor = proj.transform(this.ovl.getPosition(), 'EPSG:3857', 'EPSG:4326');
        // var x = utils.LatLonToMeters(center[0], 0, coor[0], 0);
        // x = center[0] > coor[0] ? x : -x;
        // var y = utils.LatLonToMeters(0, center[1], 0, coor[1]);
        // y = center[1] < coor[1] ? y : -y;
      } catch (ex) {}
    });

    $('#user', $(element).contents()).on(
      'click touchstart',
      window.user,
      function (ev) {
        if (window.user.constructor.name === 'Deliver')
          window.user.editor.OpenOffer();
        else if (window.user.constructor.name === 'Supplier')
          window.user.editor.InitSupplierOffer();
        else if (window.user.constructor.name === 'Customer') {
          $(element).attr('supuid', that.offer.uid);
          that.map.OnItemClick(element);
        }
      }
    );

    this.map.ol_map.getView().on('change:resolution', function (ev) {});

    this.overlay.on('change:position', function (e) {
      //$('#browser_container').css('display','inline-block');
      console.log();
    });

    this.overlay.on('change:positioning', function (e) {
      //$('#browser_container').css('display','inline-block');
      console.log();
    });

    this.overlay.on('change:map', function (e) {
      //$('#browser_container').css('display','inline-block');
      console.log();
    });

    this.overlay.on('stop_location', function (e, param1, param2) {});

    $('.overlay').on('change:cur_pos', function (evt, coor, param2) {});

    this.map.ol_map.getView().on('change:center', function (event) {
      $(element).trigger('change:center', [event]);
    });

    this.map.ol_map.on('moveend', function (event) {
      $(element).trigger('map:moveend', [event]);
    });

    this.map.ol_map.on('movestart', function (event) {
      $(element).trigger('map:movestart', [event]);
    });

    this.map.ol_map.on('pointerdrag', function (event) {
      $(element).trigger('map:pointerdrag', [event]);
    });
  }

  CreateCircle(offer) {
    const that = this;
    let layer;
    if (window.user.map.layers.circleLayer) {
      layer = window.user.map.layers.circleLayer;
    } else {
      let style = new Style({
        // fill: new _ol_style_Fill_({
        //     color: 'rgba(255, 255, 255, .2)'
        // }),
        stroke: new Stroke({
          color: 'rgba(255, 0, 0, 1)',
          width: 1,
        }),
      });

      window.user.map.layers.CreateCircleLayer(style);
      layer = window.user.map.layers.circleLayer;
    }

    var source = layer.getSource();

    that.radiusFeature = new Feature({
      geometry: new Circle(
        proj.fromLonLat([offer.longitude, offer.latitude]),
        offer.radius ? offer.radius : 1000
      ),
      //name: cursor.value.title ? cursor.value.title : "",
      //tooltip: cursor.value.title ? cursor.value.title : "",
      type: window.user.profile.type,
      object: offer,
    });

    setTimeout(function () {
      let extent = that.radiusFeature.values_.geometry.getExtent();
      //ol.extent.applyTransform(extent, transformFn, opt_extent)
      window.user.map.ol_map
        .getView()
        .fit(extent, { duration: window.sets.animate_duration });
    }, 200);

    that.radiusFeature.un('click', function (ev) {});

    that.radiusFeature.setId('radius_' + window.user.uid);
    that.radiusFeature.supuid = window.user.uid;
    source.addFeature(that.radiusFeature);

    if (!this.collection) this.collection = new Collection();
    this.collection.push(that.radiusFeature);
    that.draw = new Draw({
      geometryName: 'circle',
      source: source,
      type: 'Circle',
      features: that.collection,
    });

    //that.map.ol_map.addInteraction(that.draw);
    that.snap = new Snap({ source: source });
    that.map.ol_map.addInteraction(that.snap);
    if (window.user.constructor.name === 'Deliver') {
      that.modify = new Modify({ source: source });
      that.modify.addEventListener('modifyend', function (ev) {
        let radius = parseFloat(
          ev.features.array_[0].values_.geometry.getRadius().toFixed(2)
        );
        window.user.offer.stobj.radius = radius;
        window.db.SetObject('offerStore', window.user.offer.stobj, (res) => {});
      });
      that.map.ol_map.addInteraction(that.modify);
    }

    that.draw.addEventListener('drawstart', function (ev) {});
    that.draw.addEventListener('drawend', function (ev) {
      // that.map.ol_map.removeInteraction(that.draw);
      that.overlay.values_.position = ev.target.sketchCoords_[0];
    });
  }

  DownloadOverlay(url, obj) {
    var id_str = GetObjId(obj.latitude, obj.longitude);
    if ($("[id='" + id_str + '_ovl_container' + "']").length === 0) {
      let data_obj = {
        url: url + '?v=' + Date.now(),
        obj: obj,
      };

      window.network.SendMessage(data_obj, function (data) {
        var id_str = GetObjId(this.obj.latitude, this.obj.longitude);
        var replacements = {
          _id_: id_str,
          _lat_: this.obj.latitude,
          _lon_: this.obj.longitude,
          _cat_: this.obj.category,
        };

        if (obj.logo) replacements['logo'] = obj.logo;

        var newNode = data.replace(/_\w+_/g, function (all) {
          return all in replacements ? replacements[all] : all;
        });

        if ($("[id='" + id_str + '_ovl_container' + "']").length === 0) {
          $(document).on('overlay', function (e) {
            //console.log("InitLayers");
          });

          var div_ovl = $('#ovl_container').clone();
          $(div_ovl).attr('id', id_str + '_ovl_container');
          $(div_ovl).attr('ovl_cat', this.obj.category);
          $(div_ovl).attr('class', 'overlay');
          $(div_ovl).attr('src', data);

          $(newNode).appendTo(div_ovl);
          $(div_ovl).appendTo('#html_container');

          var logo = $(div_ovl).find('.logo');
          if (logo) {
            var logo_id = localStorage.getItem(obj.logo_id);
            $(logo).attr('src', logo_id);
          }

          var lon = parseFloat(this.obj.longitude);
          var lat = parseFloat(this.obj.latitude);

          jQuery.fn.InitOverlay = (function () {
            var ovl = new OverlayItem(
              id_str,
              $('#' + id_str + '_ovl_container')[0],
              proj.fromLonLat([lon, lat])
            );
          })();

          var zoom = d2d_map.ol_map.getView().getZoom();

          $('#' + this.obj.id + '_include')
            .find('.overlay_img')
            .css('height', String(zoom * 4) + 'px');
          $('#' + this.obj.id + '_include')
            .find('.overlay_img')
            .css('width', String(zoom * 4) + 'px');
        }
      });
    }
  }

  DownloadOverlayIFrame(url, obj) {
    var id_str = GetObjId(obj.latitude, obj.longitude);

    if ($("[id='" + id_str + '_ovl_container' + "']").length === 0) {
      var div_ovl = $('#html_container').clone();
      $(div_ovl).attr('id', id_str + '_ovl_container');
      $(div_ovl).attr('ovl_cat', obj.category);
      $(div_ovl)
        .find('iframe')
        .attr('src', url + '?v=' + Date.now());
      $(div_ovl)
        .find('iframe')
        .attr('id', id_str + '_ovlframe');
      $(div_ovl).find('iframe').on('load', OnLoadOvlFrame);
      $(div_ovl)
        .find('iframe')
        .css('opacity', obj.status === '2' ? 0.5 : 1);
      $(div_ovl).appendTo('#html_container');

      var lon = parseFloat(obj.longitude);
      var lat = parseFloat(obj.latitude);

      jQuery.fn.InitOverlay = (function () {
        var ovl = new OverlayItem(
          id_str,
          $('#' + id_str + '_ovl_container')[0],
          proj.fromLonLat([lon, lat])
        );
      })();

      // $("#" + this.obj.id + "_include").find('.overlay_img').css('height', String(zoom * 4) + 'px');
      // $("#" + this.obj.id + "_include").find('.overlay_img').css('width', String(zoom * 4) + 'px');
    }
  }

  OnLoadOvlFrame(ev) {
    var iframe = ev.target;

    db.GetObject(iframe.id.split('_')[0], function (obj) {
      if (typeof $('#' + iframe.id)[0].contentWindow.GetTips === 'function') {
        if (obj.category == 3 && obj.status !== '1') return;

        function ReplyValidation(res, el) {
          // alert("Правильно!");
          if (res) {
            var obj_id = iframe.id.split('_')[0];

            db.SetObjectAttr(obj_id, 'status', '2');

            User.level++;
            $('#' + iframe.id)[0].remove();
            $(clone).remove();

            db.SetObjectAttr(MD5('uname'), 'level', User.level);
          } else {
            if (User.level > 0) {
              User.level--;
              db.SetObjectAttr(MD5('uname'), 'level', User.level);
            }
            $(el).remove();
          }
        }

        var tips = $('#' + iframe.id)[0].contentWindow.GetTips(ReplyValidation);
        var clone = $(tips).clone();
        for (var i = 0; i < clone.length; i++) {
          $(clone[i]).insertAfter(iframe);
          $(clone[i]).css('display', 'block');
          $(clone[i]).on('click', function () {
            iframe.contentWindow.OnClickTip(this, function (res, el) {
              // alert("Правильно!");
              if (res) {
                var obj_id = iframe.id.split('_')[0];

                db.SetObjectAttr(obj_id, 'status', '2');

                User.level++;
                $('#' + iframe.id)[0].remove();
                $(clone).remove();

                db.SetObjectAttr(MD5('uname'), 'level', User.level);
              } else {
                if (User.level > 0) {
                  User.level--;
                  db.SetObjectAttr(MD5('uname'), 'level', User.level);
                }
                $(el).remove();
              }
            });
          });
        }
      }
    });

    iframe.style.display = 'block';
    iframe.style.height = '100px'; //iframe.contentWindow.document.body.scrollHeight + "px";
    iframe.style.width = '100px'; //iframe.contentWindow.document.body.scrollWidth + "px";
  }

  OverlayFrame(url, obj) {
    var id_str = GetObjId(obj.latitude, obj.longitude);

    if ($("[id='" + id_str + '_ovl_container' + "']").length === 0) {
      //$('link[rel=import]:last').attr('href',obj.overlay);

      $(document).on('overlay', function (e) {
        //console.log("InitLayers");
      });

      var ovl_frame = $('#ovl_frame').clone();
      $(ovl_frame).attr('id', id_str + '_ovl_frame');
      $(ovl_frame).attr('ovl_cat', obj.category);
      $(ovl_frame).attr('src', url + '?v=' + String(new Date().getTime()));

      $(ovl_frame).appendTo('#html_container');

      var lon = parseFloat(obj.longitude);
      var lat = parseFloat(obj.latitude);

      jQuery.fn.InitOverlay = (function () {
        setTimeout(function () {
          var ovl = new OverlayItem(
            id_str,
            $('#' + id_str + '_ovl_frame')[0],
            proj.fromLonLat([lon, lat])
          );
          flag = true;
          AddOverlayRecurs();
        }, 100);
      })();

      var zoom = d2d_map.ol_map.getView().getZoom();

      $('#' + obj.id + '_include')
        .find('.overlay_img')
        .css('height', String(zoom * 4) + 'px');
      $('#' + obj.id + '_include')
        .find('.overlay_img')
        .css('width', String(zoom * 4) + 'px');
    }
  }

  RemoveOverlay() {
    const that = this;
    that.map.ol_map.removeOverlay(that.overlay);
  }
}

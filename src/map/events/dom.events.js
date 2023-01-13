'use strict';
export { DOMEvents };

var moment = require('moment/moment');

//import Extent from 'ol/extent';
import { Dict } from '../../dict/dict.js';

class DOMEvents {
  constructor() {
    const that = this;

    $(window).on('orientationchange', function () {
      console.log('screen width ' + screen.width);
      console.log(
        'search_but left position ' + $('#search_but').position().left
      );
      console.log('search_but top position ' + $('#search_but').position().top);

      // $("#zoom_but").css('left', parseInt(screen.width - 50) + 'px');
      //
      // $("#search_but").css('left', parseInt(screen.width - 50 /*$("#search_but").css('left')*/) + 'px');
      // $("#search_but").css('top', parseInt(screen.height - $("#search_but").css('top')) + 'px');
      //
      // $("#loc_ctrl").css('left', parseInt(screen.width - 50/*- $("#loc_ctrl").css('left')*/) + 'px');
      // $("#loc_ctrl").css('top', parseInt(screen.height - $("#loc_ctrl").css('top')) + 'px');
    });

    $('#loc_ctrl').on('click', this, (ev) => {
      window.user.map.geo.ToggleLocation(ev);
      if (window.user.SendLocation && !window.user.isShare_loc) {
        // if (window.user.date === moment().format('YYYY-MM-DD') &&
        //     window.user.store[window.user.date].status) {
        //     if (confirm("Share Your Location?")) {
        //         window.user.isShare_loc = true;
        //     }
        // }
      }
    });

    let hint = '',
      search_text = '';

    $('#search_but').on('click', this, function (ev) {
      if (!hint)
        hint =
          window.sysdict.dict['ee2faeed038501c1deab01c7b54f2fa9'][
            window.sets.lang
          ];

      if ($('#search_but').attr('drag') === 'true') {
        $('#search_but').attr('drag', false);
        return;
      }
      if (!search_text)
        search_text =
          window.sysdict.dict['c6c0914deb2bca834b0faba62016256f'][
            window.sets.lang
          ];

      if ($('#search_but').attr('hint')) {
        hint = $('#search_but').attr('hint');
      }

      let search = prompt(search_text, hint);
      $('#search_but').attr('hint', search);

      if (search && search.split(',').length >= 1) {
        hint = search;
        window.user.map.geo.SearchLocation(search, function (loc) {
          if (loc) {
            window.user.map.MoveToLocation(loc, null, function () {});
          }
        });
      } else {
        let searchAr = [];
        window.db.GetAllSuppliers(window.user.date, function (features) {
          for (let f in features) {
            for (let a in features[f].data) {
              let dict = new Dict(features[f].dict.dict);
              for (let i in features[f].data[a]) {
                let val = dict.getValByKey(
                  window.sets.lang,
                  features[f].data[a][i].title
                );
                if (val.toLowerCase().includes(search.toLowerCase())) {
                  searchAr.push({
                    uid: features[f].uid,
                    profile: features[f].profile,
                    dict: features[f].dict,
                    obj: features[f].data[a][i],
                    loc: [features[f].longitude, features[f].latitude],
                  });
                }
              }
            }
          }
          $('.search_browser').off('load');
          $('.search_browser').on('load', function () {
            $('.search_browser')[0].contentWindow.InitCustomerSearch(searchAr);
            $('.search_browser').parent().css('display', 'block');
            $('.close_browser', $('.search_browser').contents()).off(
              'touchstart click'
            );
            $('.close_browser', $('.search_browser').contents()).on(
              'touchstart click',
              function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                $('.search_browser')[0].contentWindow.cus_search.Close(
                  function () {
                    $('.search_browser').parent().css('display', 'none');
                  }
                );
              }
            );
          });
          $('.search_browser').attr('src', './customer/search.result.html');
        });
      }
    });

    // TODO: $("#search_but").draggable({
    //     start: function () {
    //         console.log("drag start");
    //     },
    //     drag: function () {
    //         $("#search_but").attr('drag', true);
    //     },
    //     stop: function () {
    //         var rel_x = parseInt($("#search_but").position().left / window.innerWidth * 100);
    //         $("#search_but").css('right', rel_x + '%');
    //         var rel_y = parseInt($("#search_but").position().bottom / window.innerHeight * 100);
    //         $("#search_but").css('top', rel_y + '%');
    //     }
    // });

    //TODO: $("#loc_ctrl").draggable({
    //     distance: 20,
    //     start: function () {
    //         console.log("");
    //     },
    //     drag: function () {
    //         $("#loc_ctrl").attr('drag', true);
    //     },
    //     stop: function () {
    //         var rel_x = parseInt($("#loc_ctrl").position().left / window.innerWidth * 100);
    //         $("#loc_ctrl").css('left', rel_x + '%');
    //         var rel_y = parseInt($("#loc_ctrl").position().top / window.innerHeight * 100);
    //         $("#loc_ctrl").css('top', rel_y + '%');
    //     }
    // });

    var zoom_y_0;
    var drag_zoom;
    $('#zoom_but').draggable({
      axis: 'y',
      revert: true,
      delay: 50,
      start: function () {
        zoom_y_0 = $('#zoom_but').position();
        drag_zoom = true;

        setTimeout(function () {
          var zoom_y_1 = $('#zoom_but').position();
          if (zoom_y_0.top > zoom_y_1.top) SetMapZoomInRec();
          else SetMapZoomOutRec();
        }, 10);

        function SetMapZoomInRec() {
          var zoom = parseInt(window.user.map.ol_map.getView().getZoom());
          that.SetMapZoom(
            zoom + 1,
            window.user.map.ol_map.getView().getCenter(),
            function () {
              // Map.render();
              var to = setTimeout(function () {
                if (drag_zoom) SetMapZoomInRec();
                else clearTimeout(to);
              }, 100);
            }
          );
        }

        function SetMapZoomOutRec() {
          var zoom = parseInt(window.user.map.ol_map.getView().getZoom());
          that.SetMapZoom(
            zoom - 1,
            window.user.map.ol_map.getView().getCenter(),
            function () {
              var to = setTimeout(function () {
                if (drag_zoom) SetMapZoomOutRec();
                else clearTimeout(to);
              }, 100);
            }
          );
        }
      },
      drag: function () {},
      stop: function () {
        drag_zoom = false;
        var y = parseInt(($(this).position().top / window.innerHeight) * 100);
        $(this).css('top', y + '%');
      },
    });
  }

  CheckDeleteFeature(feature, coordinate, layer) {
    var rect = $('#bucket')[0].getBoundingClientRect();
    var lb = this.map.ol_map.getCoordinateFromPixel([rect.left, rect.bottom]);
    var rb = this.map.ol_map.getCoordinateFromPixel([rect.right, rect.bottom]);
    var rt = this.map.ol_map.getCoordinateFromPixel([rect.right, rect.top]);
    var lt = this.map.ol_map.getCoordinateFromPixel([rect.left, rect.top]);
    var coordinates = [lb, rb, rt, lt];
    var bucket_ext = ol.Extent.boundingExtent(coordinates);
    var feature_ext = feature.getGeometry().getExtent();
    var ext = ol.Extent.getIntersection(bucket_ext, feature_ext);
    if (!ol.Extent.isEmpty(ext)) {
      var hash = feature.values_.features[0].getId();
      if (hash) {
        var obj = JSON.parse(localStorage.getItem(hash));
        obj.status = 0;
        localStorage.setItem(hash, JSON.stringify(obj));
        if (layer) layer.getSource().removeFeature(feature);
      }
    }
  }

  SetMapZoom(zoom, coor, callback) {
    window.user.map.ol_map.getView().animate(
      {
        zoom: zoom,
        duration: window.sets.animate_duration,
        center: coor,
      },
      function () {
        callback();
      }
    );

    if (parseInt($('#zoom_but').text) !== parseInt(zoom))
      $('#zoom_but').val(parseInt(zoom));
    if (zoom >= 14) $('#zoom_but').css('color', 'blue');
    else $('#zoom_but').css('color', 'black');
  }
}

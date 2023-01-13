'use strict';

import { UtilsMap } from '../../utils/utils.map.js';
import { Dict } from '../../dict/dict.js';
import proj from 'ol/proj';
import moment from 'moment';

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');

require('bootstrap');
// require('jquery-ui-touch-punch');

export class Carousel {
  constructor() {
    this.path = window.con_param.host_port;

    this.image_path = window.con_param.image_path;

    this.shuffled = {};

    this.MakeDraggableCarousel($('#items_carousel')[0]);
  }

  CarouselEvents(map) {
    const that = this;

    try {
      map.ol_map.on('moveend', function (event) {
        let extent = map.ol_map.getView().calculateExtent();
        let tr_ext = proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
        if (
          isNaN(tr_ext[1]) ||
          isNaN(tr_ext[3]) ||
          isNaN(tr_ext[0]) ||
          isNaN(tr_ext[2])
        )
          return;

        if (window.user.import.data_updated) {
          map.GetObjectsFromStorage([
            tr_ext[1],
            tr_ext[3],
            tr_ext[0],
            tr_ext[2],
          ]);
          map.layers.PutDeliversOnMap();
        }
      });
    } catch (ex) {
      console.log('InitLayers');
    }

    $('.nav-link').on('show.bs.tab', function (ev) {
      let el = this;
      setTimeout(function () {
        if ($(el).attr('drag') !== 'true') {
          let href = ev.target.hash;
          that.id = $(href).attr('id');
          let shuffled = that.shuffle(that.htmlAr[that.id]);
          $(href).find('.carousel-inner').append(shuffled);
          $($(href).find('.carousel-inner').find('.carousel-item')[0]).addClass(
            'active'
          );

          if (that.id === 'delivery') {
            $('#pickup').find('.carousel-inner').empty();
          } else if (that.id === 'pickup') {
            $('#delivery').find('.carousel-inner').empty();
          }

          $('#items_carousel').carousel({ interval: 2000 });
          //$('#items_carousel').carousel('cycle');
          $('#items_carousel').trigger('show');
        }
      }, 200);
    });

    $('.nav-link').on('hide.bs.tab', function (ev) {
      $('#items_carousel').carousel({ interval: 0 });
      let href = ev.target.hash;
      $(href)
        .find('.carousel-inner')
        .find('.carousel-item')
        .removeClass('active');
    });
  }

  shuffle(array) {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  async SetFeatures(features) {
    const that = this;

    $('#items_carousel').carousel({ interval: 2000 });
    $('#items_carousel').carousel('dispose');

    that.featureAr = {};
    that.htmlAr = { pickup: [], delivery: [] };
    let el_id = '';

    // $('.tab-pane').find('.carousel-inner').empty();

    $('.nav-link[href]', $('#items_carousel')).addClass('disabled');

    for (let f in features) {
      let util = new UtilsMap();
      if (!features[f]) {
        delete features[f];
        continue;
      }
      if (features[f].profile.type === 'deliver') {
        if (
          !util.IsInsideRadiusCoor(
            window.user.map,
            [features[f].latitude, features[f].longitude],
            features[f].radius
          )
        ) {
          delete features[f];
          continue;
        }
        el_id = 'delivery';
        // if(!$('.nav-link[href].active')[0],$('#items_carousel')) {
        //     $('.nav-link[href="#delivery"]',$('#items_carousel')).addClass('active')
        //     $('.tab-pane#delivery',$('#items_carousel')).addClass('active')
        // }
      } else if (features[f].profile.type === 'marketer') {
        el_id = 'pickup';

        // if(!$('.nav-link[href].active',$('#items_carousel'))[0]) {
        //     $('.nav-link[href="#pickup"]',$('#items_carousel')).addClass('active')
        //     $('.tab-pane#pickup',$('#items_carousel')).addClass('active')
        // }
      }

      let diff =
        new Date().getTime() - new Date(features[f].published).getTime();
      var days = Math.floor(diff / (1000 * 60 * 60 * 24));
      days = days - 30;
      if (days >= 0)
        //просрочен
        features[f].delayed = true;

      let cat_cnt_1 = 0,
        main_cnt = 0;

      for (let cat_tab in features[f].data) {
        if (
          $('.category[id=' + cat_tab + ']', $('#category_container')).length >
          0
        ) {
          let cat_cnt = $('img[id="' + cat_tab + '"]', $('#category_container'))
            .parent()
            .find('.cat_cnt')
            .text();
          $('img[id="' + cat_tab + '"]', $('#category_container'))
            .parent()
            .find('.cat_cnt')
            .text(parseInt(cat_cnt) + 1);

          main_cnt = parseInt(
            $(
              $('img[id="' + cat_tab + '"]', $('#category_container'))
                .closest('.dropdown-menu')
                .siblings('.cat_cnt')[0]
            ).text()
          );
          $(
            $('img[id="' + cat_tab + '"]', $('#category_container'))
              .closest('.dropdown-menu')
              .siblings('.cat_cnt')[0]
          ).text(main_cnt + 1);
        }
        if (
          $(
            ".category[state='1'][id=" + cat_tab + ']',
            $('#category_container')
          ).length === 0
        )
          continue;

        cat_cnt_1++;
      }
      //TODO: delayed features
      // if(features[f].delayed === true)
      //     continue;

      let supplier = features[f];
      let dict = new Dict(supplier.dict.dict);
      let active = 'active';
      for (let tab in features[f].data) {
        if (
          $(".category[state='1'][id=" + tab + ']').length === 0 ||
          features[f].date !== window.user.date
        )
          continue;

        $(
          '.mp_open[user_type="' +
            (features[f].profile.type === 'foodtruck'
              ? 'marketer'
              : features[f].profile.type) +
            '"]'
        ).prop('disabled', false);

        for (let i in features[f].data[tab]) {
          i = parseInt(i);
          let item = features[f].data[tab][i];
          // if ($(".carousel-item[title=" + item.title + "]").length > 0)
          //     continue;

          let title = dict.getValByKey(
            window.sets.lang,
            item.title,
            features[f].profile.lang
          );

          if ($('.word').find('.word_btn').length > 0) {
            let res = $.grep($('.word').find('.word_btn'), function (el, i) {
              return title.toLowerCase().includes(el.value.toLowerCase());
            });

            if (res.length === 0) continue;
          }

          let car_numb = 1;
          car_numb =
            Math.ceil(features[f].data[tab].length / cat_cnt_1) > 0
              ? Math.ceil(features[f].data[tab].length / cat_cnt_1)
              : 1;
          //ограничение кол-ва позиций карусели в зав-ти от кол-ва выбранных элементов
          // if($(".carousel-item[supuid="+obj.uid+"]").length>=car_numb)
          //     continue;

          let src = '';
          if (item.cert && item.cert[0]) {
            if (!item.cert[0].src.includes('http')) {
              src = that.image_path + item.cert[0].src;
            } else {
              src = item.cert[0].src;
            }
          } else if (item.img) {
            if (!item.img.src.includes('http')) {
              src = that.image_path + item.img.src;
            } else {
              src = item.img.src;
            }
          }

          let price = '';
          if (!item.packlist) continue;

          let keys = Object.keys(item.packlist);

          let promise = new Promise((resolve, reject) => {
            $('<div/>').load('./html/carousel.item.html', function (data) {
              resolve($(data).clone());
            });
          });

          let html = await promise;

          for (let k in keys) {
            try {
              price = parseFloat(item.packlist[keys[k]].price);
            } catch (ex) {
              continue;
            }

            let prev_price = '';
            try {
              prev_price = parseFloat(item.prev_packlist[keys[k]].price);
            } catch (ex) {
              continue;
            }

            //TODO:let font_size = ((Math.round(100/title.length)+.2)>2?2:(Math.round(100/title.length)+.2)) +"em";

            promise = new Promise((resolve, reject) => {
              $(html).attr('title', item.title);
              $(html).attr('tab', tab);
              $(html).attr('supuid', features[f].uid);
              $(html).find('.carousel_title').text(title);
              $(html).find('.carousel_img').attr('src', src);
              $(html).find('.carousel_price').text(price);
              if (prev_price && prev_price - price > 0) {
                $(html).find('.carousel_price').text(prev_price);
                $(html)
                  .find('.discount')
                  .css('display', '')
                  .text(
                    '-' + Math.floor(((prev_price - price) / price) * 100) + '%'
                  );
                $(html)
                  .find('.dscnt_price')
                  .css('visibility', 'visible')
                  .text(price);
                active = '';
                if (that.htmlAr[el_id]) {
                  that.htmlAr[el_id].push(html[0].outerHTML);
                  that.featureAr[item.title] = item;
                }
              }

              resolve(that.htmlAr);
            });

            let res = await promise;

            break;
          }
        }
      }
    }

    // $('.nav-link').removeClass('active');
    // $('#'+id).addClass('active');
    // $('.carousel').removeClass('active');
    // $('.nav-link[href="#'+id+'"]').addClass('active');

    if (
      that.htmlAr['delivery'].length == 0 &&
      that.htmlAr['pickup'].length == 0
    ) {
      $('.carousel-item').remove();
      $('.nav-link').removeClass('active');
    }

    for (let tab in that.htmlAr) {
      if (that.cur_tab) tab = that.cur_tab;

      if (that.htmlAr[tab].length > 0) {
        $('[href="#' + tab + '"]').removeClass('disabled');

        $('#items_carousel').css('display', 'block');

        let shuffled = that.shuffle(that.htmlAr[tab]);

        //$('.tab-pane.active').find('.carousel-item').remove();

        // let diff = _.difference(shuffled, that.shuffled[tab]);
        // for(let i in diff){
        //     $('.carousel-item[title="'+$(diff[i]).attr("title")+'"]').remove();
        // }
        // let diffWith = _.differenceWith(shuffled, that.shuffled[tab], _.isEqual);

        $('#' + tab)
          .find('.carousel-inner')
          .append(shuffled);
        that.shuffled[tab] = shuffled;

        $('#' + tab)
          .find('.carousel-inner')
          .find('.carousel-item')
          .removeClass('active');
        $(
          $('#' + tab)
            .find('.carousel-inner')
            .find('.carousel-item')[0]
        ).addClass('active');

        if (tab === 'delivery') {
          if (that.htmlAr['pickup'].length === 0)
            $('.nav-link[href="#pickup"]', $('#items_carousel')).addClass(
              'disabled'
            );
          else {
            $('.nav-link[href="#pickup"]', $('#items_carousel')).removeClass(
              'disabled'
            );
          }
          $('#pickup').find('.carousel-inner').empty();
        } else if (tab === 'pickup') {
          if (that.htmlAr['delivery'].length === 0)
            $('.nav-link[href="#delivery"]', $('#items_carousel')).addClass(
              'disabled'
            );
          else {
            $('.nav-link[href="#delivery"]', $('#items_carousel')).removeClass(
              'disabled'
            );
          }
          $('#delivery').find('.carousel-inner').empty();
        }
        $('.nav-link[href]').removeClass('active');
        $('.nav-link[href="#' + tab + '"]').addClass('active');
        $('#' + tab).addClass('active');
        //$('#items_carousel').carousel({interval: 2000});

        $('#items_carousel').carousel('cycle');

        break;
      } else {
        $('#items_carousel').css('display', 'none');
        that.cur_tab = '';
        continue;
      }
    }
    $('#items_carousel').trigger('show');
    //$($('.carousel-inner').find('.carousel-item')[0]).addClass('active');
  }

  MakeDraggableCarousel(el) {
    const that = this;

    let carus_pos = JSON.parse(localStorage.getItem('carousel_pos'));
    if (carus_pos) $(el).offset({ top: carus_pos.top, left: carus_pos.left });

    $(el).draggable(
      {
        // delay: 200,
        containment: 'body',
      },
      {
        start: function (ev) {
          console.log('drag start');
          $(el).find('.carousel-item').attr('drag', 'true');
          $(el).find('.nav-link').attr('drag', 'true');
        },
        drag: function (ev) {},
        stop: function (ev) {
          let left = $(el).position().left;
          // $(el).css('right', rel_x + '%');
          let top = $(el).position().top;
          // $(el).css('bottom', rel_y + '%');
          $(el).find('.carousel-item').attr('drag', 'false');
          $(el).find('.nav-link').attr('drag', 'false');
          localStorage.setItem(
            'carousel_pos',
            JSON.stringify({ top: top, left: left })
          );
          // $(el).draggable("disable")
        },
      }
    );

    $(el).draggable('enable');

    $('.nav-item').on('click touchstart', function (ev) {
      // ev.preventDefault();
      // ev.stopPropagation();
      let el = this;
      setTimeout(function () {
        if ($(el).find('.nav-link').attr('drag') !== 'true') {
          $(el).find('.nav-link').tab('show');
          that.cur_tab = $(el).find('.nav-link').attr('href').substring(1);
        }
      }, 200);
    });
    //
    $('.carousel-inner').on('click touchstart', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      let el = this;
      setTimeout(function () {
        if ($(el).attr('drag') !== 'true')
          window.user.map.OnItemClick($(el).find('.carousel-item.active')[0]);
      }, 200);
    });
  }
}

//////////////////
// WEBPACK FOOTER
// ./src/map/carousel/carousel.js
// module id = 683
// module chunks = 1 2

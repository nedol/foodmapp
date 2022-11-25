'use strict';

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');

require('bootstrap');

import { CartCustomerStore } from '../customer/customer.cart.store';
import { Dict } from '../dict/dict.js';
import { Utils } from '../utils/utils';
import proj from 'ol/proj';
//
// import  "../../dist/css/order.3.css"
// import "../../dist/css/cart.css"

let utils = new Utils();

let _ = require('lodash');
var moment = require('moment/moment');
var md5 = require('md5');

$(document).on('readystatechange', function () {
  if (document.readyState !== 'complete') {
    return;
  }

  let iOSdevice =
    !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
  if (iOSdevice)
    $('[role="tablist"] .nav-link').each((i, e) => {
      if (!$(e).attr('href')) $(e).attr('href', $(e).data('target'));
    });

  $('#splash', window.parent.document).css('display', 'none');

  console.log($('#cus_link').attr('href'));
  if (window.parent && window.parent.sets.css)
    $('#cus_link').attr(
      'href',
      '../css/' + window.parent.sets.css + '.css?v=' + String(Date.now())
    );

  window.InitCustomerOrder = function (data, targ_title) {
    window.order = new StoreOrder();
    window.order.openFrame(data, targ_title, function () {});
  };

  $('body').on('beforeunload', function () {
    window.remove();
    document.close();
  });
});

export class StoreOrder {
  constructor() {
    this.path = 'http://localhost:5500/d2d/server';
    if (host_port.includes('delivery-angels'))
      this.path = 'https://delivery-angels.store/server';
    else this.path = host_port;

    this.image_path = image_path;

    this.ovc = $('body');

    // this.ovc.find('.nav-link').on('click touchstart', function (ev) {
    //     // $('#sup_profile_container').css('display','block');
    //     let href = $(this).attr('href');
    //     $(href).css('display','block');
    //
    //     href = $(this).closest('.nav').find('.active').attr('href');
    //
    //     $(href).css('display','none');
    // });
  }

  addTab(cat_tab, active) {
    let that = this;
    let cat_str = '';
    if (
      $(window.parent.document)
        .contents()
        .find('#' + cat_tab)
        .closest('.cat_div')[0]
    )
      cat_str = $(window.parent.document)
        .contents()
        .find('#' + cat_tab)
        .closest('.cat_div')[0].outerHTML;
    else if (!cat_str)
      // let cat_str = cat_img?'<img class="nav-link" data-toggle="tab"  contenteditable="false" data-translate="' + md5(cat_tab) + '"  href="#tab_' + cat_tab + '" src="'+cat_img+'"  title="'+cat_tab+'">':
      cat_str =
        '<div class="cat_div  text-center" data-toggle="tab" href="#tab_' +
        cat_tab +
        '">' +
        '<span id="' +
        cat_tab +
        '" class="category icofont-brand-natgeo"  extra="false" title="' +
        cat_tab +
        '" state="0"></span>' +
        '<i class="title">' +
        cat_tab +
        '</i>' +
        '<span class="cat_cnt badge badge-pill badge-secondary">0</span>' +
        '</div>';
    if ($('[href="#tab_' + cat_tab + '"]').length === 0) {
      $(cat_str).insertBefore(that.ovc.find('#add_tab_li'));
      $(
        '<div id="tab_' +
          cat_tab +
          '" class="tab-pane div_tab_inserted ' +
          active +
          '" style="border: border: 1px solid grey;">' +
          '<div class="filter_div collapse"></div>' +
          '<div id="accordion"></div>' +
          '<div class="tab_row flex-container"></div>' +
          '</div>'
      ).insertBefore(that.ovc.find('#add_tab_div'));
    }
  }

  openFrame(obj, targ_title, cb) {
    let that = this;
    this.uid = obj.uid;
    this.profile = obj.profile;
    this.offer = obj.data;
    obj.supuid = obj.uid;
    this.rating = obj.rating;
    let latlon = [obj.latitude, obj.longitude];
    let diff = new Date().getTime() - new Date(obj.published).getTime();
    let days = Math.floor(diff / (1000 * 60 * 60 * 24));
    let isDelayed = days - 30; //week after publication
    this.ovc.css('display', 'block');
    this.last = 0;
    //TODO:
    // let cat_incl = $("#cat_incl",window.parent.document);
    // cat_incl.css('position','relative');
    // cat_incl.find('#categories').css('display','block');
    // cat_incl.insertAfter('#top_nav');

    if ($('.kolmit').length === 0) {
      let kolmit = $('iframe.kolmit_tmplt').clone();
      $(kolmit)
        .css('display', 'block')
        .attr('class', 'kolmit')
        .attr(
          'src',
          '../kolmit/user/iframe.html?abonent=d2d@kolmits&operator=' +
            obj.profile.email
        );
      $('iframe.kolmit_tmplt').after(kolmit);
    }

    let type = { ru: 'самовывоз ', en: 'Pickup' }[window.parent.sets.lang];
    if (this.profile.type === 'deliver')
      type = { ru: 'доставку ', en: 'Delivery' }[window.parent.sets.lang];

    if (isDelayed)
      this.ovc
        .find('.actual_price')
        .text(
          { ru: 'Цены на ' + type, en: type + ' Prices For ' }[
            window.parent.sets.lang
          ] + obj.published.split('T')[0]
        );

    this.ovc.find('#shop_name').text(obj.profile.name);

    that.FillProfile(obj);

    $('.dropdown button').text(window.parent.sets.lang);
    $('a[role=langitem]:contains(' + window.parent.sets.lang + ')').css(
      'display',
      'none'
    );
    $('a[role=langitem]').on('click', function () {
      $('#close_browser').trigger('click');
      window.parent.location.replace(
        '../customer.store.html?lang=' +
          $(this).text() +
          '&supuid=' +
          window.parent.sets.supuid +
          '&market=food&css=order.3'
      );
    });

    this.ovc.find('.save').off();
    this.ovc.find('.save').on('click touchstart', this, function (ev) {
      let that = ev.data;

      ev.preventDefault();
      ev.stopPropagation();

      that.GetUserProfileItems();

      let items = that.GetOrderItems();

      if (Object.keys(items.data).length === 0) {
        $('.menu_item').remove();
        $('.kolmit')[0].contentWindow.CloseFrame();
        $(frameElement).css('display', 'none');
        $('#client_frame_container', window.parent.document).css(
          'display',
          'none'
        );

        return;
      }

      if (that.offer) {
        let lang = window.parent.sets.lang;

        that.SaveOrder(function (res) {
          if (res) {
            window.parent.user.orders[0] = res;
            $('.ord_cnt').text(Object.keys(items.data).length);
            if (!$('#address').val() || !$('#mobile').val())
              $('[href="#user_pane"]').trigger('click');
            else $('[href="#cart_pane"]').trigger('click');
          }
        });
      }
    });

    this.date = window.parent.user.date;
    this.period = obj.period;

    try {
      window.parent.sysdict.set_lang(window.parent.sets.lang, this.ovc[0]);
    } catch (ex) {}

    this.dict = new Dict(obj.dict.dict);
    const options = {
      componentRestrictions: { country: 'ru', city: 'Moscow' },
    };

    this.OpenUserProfile();

    this.ovc.find('.toolbar').css('display', 'block');

    this.ovc.find('li.publish_order').addClass('disabled');

    this.ovc.find('.tab-content').on('scroll', function (ev) {
      that.ovc.find('.carousel_collapse').css('display', 'none');
    });

    $('.nav-tabs a').on('shown.bs.tab', function (event) {
      var x = $(event.target).text(); // active tab
      var y = $(event.relatedTarget).text(); // previous tab
      if ($(this).attr('href') === '#user_pane')
        if (that.profile.type === 'deliver') {
          //$("[href='#user_pane']").trigger('click');
          if (!$('#mobile').val()) $('#mobile').focus();
          if (!$('#address').val()) $('#address').focus();

          $('#address_loc').off();
          $('#address_loc').on('click', this, (ev) => {
            ev.preventDefault();
            ev.stopPropagation();

            if (
              parseInt(
                $('#client_frame_container', window.parent.document).css(
                  'height'
                )
              ) < 300
            ) {
              $('#client_frame_container', window.parent.document).css(
                'height',
                '100%'
              );
              $('#menu_tabs').css('display', 'block');
              $('#save_frame').css('display', 'block');
              $('#locator', window.parent.document).css('display', 'none');
              $(window.parent.user.map.ol_map).off('moveend');
              if ($('#address').val().includes(';')) {
                let zoom = parseInt(
                  window.parent.user.map.ol_map.getView().getZoom()
                );
                window.parent.user.map.geo.SearchPlace(
                  $('#address').val().split(';'),
                  zoom,
                  function (res) {
                    try {
                      $('#address').val(res.street + ',' + res.house);
                      $('#address').focus();
                      //$('#address')[0].select();
                      $('#address').trigger('click');
                      return false;
                    } catch (ex) {}
                  }
                );
              }
            } else {
              $('#menu_tabs').css('display', 'none');
              let h =
                $('#address_loc').parent().offset().top +
                8 +
                $('#address_loc').width() +
                2;
              $('#client_frame_container', window.parent.document).css(
                'height',
                h
              );
              $('#save_frame').css('display', 'none');
              $('#locator', window.parent.document).css('display', 'block');
              window.parent.user.map.ol_map.getView().setZoom(19);
              let gps = JSON.parse(localStorage.getItem('gps_loc'));
              let loc = [gps.lon, gps.lat];
              window.parent.user.map.MoveToLocation(loc, null, () => {
                $(window.parent.user.map.ol_map).on('moveend', (ev) => {
                  that.moveend = ev;
                  if (!ev.target.focus_) return;
                  let loc = ev.target.focus_;
                  $('#address').attr('loc', JSON.stringify([loc[1], loc[0]]));
                  $('#address').val(
                    String(loc[1].toFixed(6)) + ';' + String(loc[0].toFixed(6))
                  );
                });
              });
            }
          });
        }
      if ($(this).attr('href') === '#cart_pane') that.OpenUserCart(event);
    });

    $('.nav-tabs a').on('hide.bs.tab', function (event) {
      // var x = $(event.target).text();         // active tab
      // var y = $(event.relatedTarget).text();  // previous tab
      if ($(this).attr('href') === '#user_pane') {
        that.SaveProfile();
        if (!window.parent.user.orders[0]) window.parent.user.orders[0] = {};
        window.parent.user.orders[0].address = $('#address').val();
      }
      if ($(this).attr('href') === '#order_pane') {
      }
    });

    window.parent.db.GetSettings(function (obj) {
      if (obj[0].profile && obj[0].profile.address) {
        that.ovc.find('#address').val(obj[0].profile.address);
      }
    });

    function initOrder(targ_title) {
      $('.menu_item').remove();

      let i = 0;
      for (let t in that.offer) {
        if (i == 0) {
          i++;
          openTab(t, 'active');
        } else {
          //setTimeout(function (t) {
          openTab(t, '');
          //},0, t);
        }

        $($('.cat_div')[0]).trigger('click');

        let empty = $('#menu_item_tmplt').clone();
        // $(empty).addClass('menu_item');
        $(empty).attr('id', 'menu_item_empty');
        $(empty).addClass('menu_item');
        $(empty).insertAfter(
          $('#' + t + '_' + String($(".menu_item[id^='" + t + "']").length - 1))
        );

        if (targ_title) {
          let dict_val = that.dict.getValByKey(
            window.parent.sets.lang,
            targ_title,
            that.profile.lang
          );
          //$('[href="#order_pane"]').addClass('active');
          let tab = $(".item_title:contains('" + dict_val + "')")
            .closest('.tab-pane')
            .attr('id');
          $('#' + tab).addClass('active');
          $('[href="#' + tab + '"]').trigger('click');
          //$(".item_title:contains('"+dict_val+"')").closest('.menu_item').prependTo('#'+tab);
          $(".item_title:contains('" + dict_val + "')")
            .closest('.menu_item')[0]
            .scrollIntoView();
        } else {
          $('[href="#order_pane"]').trigger('click');
          // $('.card-link').trigger('click');
        }
      }

      function openTab(t, active) {
        let cat = $('.category#' + t, window.parent.document);

        let cat_title = $(cat).attr('cat') ? $(cat).attr('cat') : t;
        let cat_id = $(cat).attr('id') ? $(cat).attr('id') : t;
        let cat_img = $(cat).attr('src');
        let state = '';
        let cat_tab;
        if (that.offer[cat_id]) {
          cat_tab = cat_id;
        } else if (that.offer[cat_title]) {
          cat_tab = cat_title;
          cat_id = cat_title;
        } else {
          return;
        }

        that.addTab(cat_tab, cat_img, active);

        $('.cat_div[href="#tab_' + cat_tab + '"]').on('click', function (ev) {
          $('.cat_div').removeClass('active');
          $(this).addClass('active');
          $('.div_tab_inserted').removeClass('active');
          $($(this).attr('href')).addClass('active');
        });

        for (let i in that.offer[cat_id]) {
          if (!openItem(cat_id, i)) continue;
        }

        $('#' + cat_id)
          .siblings('.cat_cnt')
          .text($('#tab_' + cat_tab).find('.menu_item').length);
      }

      function openItem(cat_tab, i) {
        let menu_item = $('#menu_item_tmplt').clone();
        $(menu_item).attr('id', cat_tab + '_' + i);

        $(menu_item).addClass('menu_item');
        $(menu_item).css('display', 'block');

        if (that.offer[cat_tab][i].brand) {
          if (
            $('#tab_' + cat_tab).find(
              'img[src="' +
                that.image_path +
                that.offer[cat_tab][i].brand.logo +
                '"]'
            ).length === 0
          ) {
            $('#tab_' + cat_tab)
              .find('#accordion')
              .append(
                '<div class="card">' +
                  '<div class="card-header sticky">' +
                  '<a class="card-link" data-toggle="collapse" href="#tab_' +
                  cat_tab +
                  that.offer[cat_tab][i].brand.logo +
                  '">' +
                  '<img class="brand_img" src="' +
                  that.image_path +
                  that.offer[cat_tab][i].brand.logo +
                  '"/>' +
                  '<p class="item_cnt">0</p>' +
                  '</div>' +
                  '<div id="tab_' +
                  cat_tab +
                  that.offer[cat_tab][i].brand.logo +
                  '" class="collapse show" data-parent="#accordion">' +
                  '<div class="card-body flex-container"></div>' +
                  '</div>' +
                  '</div>'
              );
          }
        }

        if (that.offer[cat_tab][i].prop) {
          $('.icofont-filter').css('visibility', 'visible');
          $('#tab_' + cat_tab)
            .find('.filter_div')
            .css('visibility', 'visible');

          $('<div>').load('../html/tmplt/prop.tmplt.html', function (el) {
            for (let p in that.offer[cat_tab][i].prop) {
              for (let v in that.offer[cat_tab][i].prop[p]) {
                if (
                  !$('#tab_' + cat_tab)
                    .find('.filter_div')
                    .find('#prop_' + p)[0]
                )
                  $('#tab_' + cat_tab)
                    .find('.filter_div')
                    .append(
                      '<div id="prop_' +
                        p.replace(/\s+/g, '') +
                        '" class="prop_name">' +
                        p +
                        '</div>'
                    );
                if (
                  $('#tab_' + cat_tab)
                    .find('.filter_div')
                    .find(
                      'label:contains(' +
                        that.offer[cat_tab][i].prop[p][v] +
                        ')'
                    )[0]
                )
                  continue;
                let cpy = $(el).clone();
                cpy.find('label').text(that.offer[cat_tab][i].prop[p][v]);
                cpy.find('label').val(that.offer[cat_tab][i].prop[p][v]);
                cpy
                  .find(':checkbox')
                  .attr('value', that.offer[cat_tab][i].prop[p][v]);

                $('#tab_' + cat_tab)
                  .find('.filter_div')
                  .find('#prop_' + p.replace(/\s+/g, ''))
                  .append(cpy);
              }
            }
          });
        }

        $(menu_item)
          .find('.item_desc')
          .on('click', function (el) {
            $(menu_item).find('.item_content').collapse('toggle');
          });

        $(menu_item).find('.ord_amount').val(0);
        $(menu_item).find('.ord_amount').text(0);
        $(menu_item).find('.extra_amount').val(0);
        $(menu_item).find('.extra_amount').text(0);

        // if($('[data-translate="'+that.offer[cat_tab][i].title+'"]').length>0)
        //     return; TODO: дублирование продукта по названию
        if (that.offer[cat_tab][i].title) {
          $(menu_item)
            .find('.item_title')
            .attr('data-translate', that.offer[cat_tab][i].title);
        }

        if (!that.offer[cat_tab][i].packlist) return false;

        if (that.offer[cat_tab][i].prop) {
          for (let p in that.offer[cat_tab][i].prop) {
            let row = $(menu_item).find('.prop_tmplt').clone();
            row.removeClass('prop_tmplt');
            row.find('.prop_name').text(p);
            row.find('.prop_val').text(that.offer[cat_tab][i].prop[p]);
            row.find('.prop_val').attr('value', that.offer[cat_tab][i].prop[p]);
            $(menu_item).find('.item_content').append(row);
          }
        }

        $(menu_item)
          .find('.item_content')
          .attr('id', 'content_' + cat_tab + '_' + i);

        if (that.offer[cat_tab][i].content_text)
          if (
            that.offer[cat_tab][i].content_text.value &&
            that.offer[cat_tab][i].content_text.value !==
              'd41d8cd98f00b204e9800998ecf8427e'
          ) {
            let str = that.dict.getValByKey(
              window.parent.sets.lang,
              that.offer[cat_tab][i].content_text.value,
              that.profile.lang
            );
            if (str && str.trim().length > 0) {
              $(menu_item)
                .find('.item_title')
                .siblings('span')
                .css('display', 'block');
              $(menu_item)
                .find('.content_text')
                .attr('contenteditable', 'false');
              $(menu_item).find('.content_text').text(str);
              $(menu_item).find('.item_desc').css('display', 'block');
              $(menu_item)
                .find('.item_desc')
                .attr('data-target', '#content_' + cat_tab + '_' + i);
            }
          }

        function CheckDiscount(pl, prev_pl, p) {
          if (!prev_pl || !prev_pl[p]) return;
          let prev_price = parseFloat(prev_pl[p].price).toString();
          let price = parseFloat(pl[p].price ? pl[p].price : pl[p]).toString(); //+старый формат
          if (prev_price - price > 0) {
            $(menu_item).find('.item_price').text(prev_price);
            $(menu_item)
              .find('.discount')
              .css('display', '')
              .text(
                '-' + Math.floor(((prev_price - price) / price) * 100) + '%'
              );
            $(menu_item)
              .find('.dscnt_price')
              .css('visibility', 'visible')
              .text(parseFloat(pl[p].price).toString());
          } else {
            $(menu_item).find('.discount').css('display', 'none');
            $(menu_item).find('.dscnt_price').css('visibility', 'hidden');
            $(menu_item).find('.item_price').text(price);
          }
        }

        let setPrice = function (packlist, prev_pl, mi) {
          if (mi) menu_item = mi;
          $(menu_item).find('.pack_list').empty();

          let pl = utils.ReverseObject(packlist);
          $(menu_item).find('.pack_btn').attr('packlist', JSON.stringify(pl));
          for (let p in pl) {
            if (!i) continue;
            let ml_val = pl[p].markup ? parseFloat(pl[p].markup) : 0;

            let data;
            if (pl[p].price)
              data = (
                parseFloat(pl[p].price.replace(/[^.-a-z0-9+]+/gi, '')) + ml_val
              ).toFixed(2);
            else data = (parseFloat(pl[p]) + ml_val).toFixed(2);

            if (!data) {
              $(menu_item).find('.order_container').css('visibility', 'hidden');
              continue;
            }

            $(menu_item).find('.item_price').attr('base', pl[p].price);
            if (
              !$(
                '.carousel_price[title=' + that.offer[cat_tab][i].title + ']'
              ).text()
            )
              $(
                '.carousel_price[title=' + that.offer[cat_tab][i].title + ']'
              ).text(data);
            if (data) {
              if (pl[p].price) pl[p].price = data;
              else pl[p] = data;
            }
            $('a[href="#tab_' + cat_tab + '"]').css('display', 'block');
            $(menu_item).find('.dropdown').css('visibility', 'visible');
            // if(that.profile.type==='deliver' && (!that.offer[cat_tab][i].markuplist || !that.offer[cat_tab][i].markuplist[p]))
            //     continue;
            $(menu_item)
              .find('.pack_list')
              .append(
                "<a class='dropdown-item' role='packitem' pack='" +
                  p +
                  "' data-translate='" +
                  p +
                  "'></a>"
              );

            $(menu_item).find('.pack_btn').attr('data-translate', p);
            $(menu_item).find('.pack_btn').attr('pack', p);

            data = parseFloat(data).toString();
            let price = data ? data : '';

            if (that.offer[cat_tab][i].bargain === 'true') {
              $(menu_item).find('.item_price').attr('contenteditable', 'true');
              $(menu_item).find('.item_price').attr('placeholder', price);
            } else {
              $(menu_item).find('.item_price').removeAttr('placeholder');
              $(menu_item).find('.item_price').text(price);
            }

            if ($(menu_item).find('a.dropdown-item').length > 1) {
              $(menu_item).find('.pack_btn').addClass('dropdown-toggle');
              $(menu_item).find('.pack_btn').attr('data-toggle', 'dropdown');
            }
            CheckDiscount(pl, prev_pl, p);
          }
        };

        if (
          that.profile.type === 'marketer' ||
          that.profile.type === 'deliver' ||
          that.profile.type === 'foodtruck'
        ) {
          let title = that.offer[cat_tab][i].title;
          let deliver = $('.deliver_but', window.parent.document).attr(
            'supuid'
          );

          if (deliver)
            window.parent.db.GetSupplier(
              window.parent.user.date,
              deliver,
              (obj) => {
                if (obj) {
                  let key = _.findKey(obj.data, function (o) {
                    for (let i in o) {
                      if (o[i].title !== title || o[i].owner != that.uid)
                        return false;
                      else return true;
                    }
                  });
                }
              }
            );

          setPrice(
            that.offer[cat_tab][i].packlist,
            that.offer[cat_tab][i].prev_packlist
          );

          let item_cnt = parseInt(
            $(menu_item)
              .closest('.card')
              .find('.item_cnt')
              .text()
              .replace('(', '')
              .replace(')', '')
          );
          ++item_cnt;
          $(menu_item)
            .closest('.card')
            .find('.item_cnt')
            .text('(' + item_cnt + ')');

          $(menu_item)
            .find('a[role=packitem]')
            .on('click', { off: that.offer[cat_tab][i] }, function (ev) {
              that.changed = true;
              $(this)
                .closest('.menu_item')
                .find('.pack_btn')
                .text($(ev.target).text());
              let pl = ev.data.off.packlist;
              let prev_pl = ev.data.off.prev_packlist;
              let price = pl[$(ev.target).attr('pack')];

              if (that.offer[cat_tab][i].bargain === 'true') {
                $(this)
                  .closest('.menu_item')
                  .find('.item_price')
                  .attr('contenteditable', 'true');
                $(this)
                  .closest('.menu_item')
                  .find('.item_price')
                  .attr(
                    'placeholder',
                    parseFloat(price.price ? price.price : price).toString()
                  );
                $(menu_item).find('.item_price').removeAttr('placeholder');
                $(this)
                  .closest('.menu_item')
                  .find('.item_price')
                  .text(
                    parseFloat(price.price ? price.price : price).toString()
                  );
              } else {
                $(this)
                  .closest('.menu_item')
                  .find('.item_price')
                  .text(
                    parseFloat(price.price ? price.price : price).toString()
                  );
              }
              if (prev_pl)
                CheckDiscount(pl, prev_pl, $(ev.target).attr('pack'));
            });

          if (that.offer[cat_tab][i].img) {
            let src = that.offer[cat_tab][i].img.src;
            if (!that.offer[cat_tab][i].img.src.includes('http'))
              src = that.image_path + that.offer[cat_tab][i].img.src;
            if ($(menu_item).find('img[src="' + src + '"]').length === 0) {
              $(menu_item)
                .find('.carousel-inner')
                .append(
                  '<div class="carousel-item">' +
                    '<img  class="card_img" src=' +
                    src +
                    '>' +
                    '</div>'
                );
            }
          }

          for (let c in that.offer[cat_tab][i].cert) {
            let src = that.offer[cat_tab][i].cert[c].src;
            if (!that.offer[cat_tab][i].cert[c].src.includes('http'))
              src = that.image_path + that.offer[cat_tab][i].cert[c].src;
            if ($(menu_item).find('img[src="' + src + '"]').length === 0) {
              $(menu_item)
                .find('.carousel-inner')
                .append(
                  '<div class="carousel-item">' +
                    '<img  class="card_img" src=' +
                    src +
                    '>' +
                    '</div>'
                );
            }
          }

          $(
            $(menu_item).find('.carousel-inner').find('.carousel-item')[0]
          ).addClass('active');
          $(menu_item).find('.carousel').carousel('cycle');
        }

        if (
          $(menu_item).find('.item_content').css('display') === 'block' &&
          $(menu_item).find('.img-fluid').attr('src') === '' &&
          $(menu_item).find('.card-text').text() === ''
        ) {
          $(menu_item).find('.item_content').slideToggle('fast');
        }

        $(menu_item)
          .find('.item_content')
          .on('shown.bs.collapse', function (e) {
            let h = 0;
            if ($(this).closest('.content_div')[0])
              h = $(this).closest('.content_div')[0].scrollHeight;
            $(this).find('.content').off();
            $(this)
              .find('.content')
              .on('change keyup keydown paste cut', 'textarea', function () {
                $(this)
                  .height(0)
                  .height(h - 50); //this.scrollHeight);
              })
              .find('textarea')
              .change();
          });

        $.each(that.offer[cat_tab][i].extra, function (e, el) {
          if (!el) return;
          $(menu_item).find('.extra_collapse').css('display', 'block');
          let row = $(menu_item).find('.row.tmplt_extra').clone();
          $(row).removeClass('tmplt_extra');
          $(row).css('height', 'auto');
          $(row).css('visibility', 'visible');

          $(row).find('.extra_title').attr('data-translate', e);
          $(row).find('.extra_price').text(el.price);
          // $(row).insertBefore($(menu_item).find('.row.tmplt_extra'));
          $(menu_item).find('.extras').append(row);
        });

        $(menu_item)
          .find('.increase')
          .on('click', function (ev) {
            let amnt = parseInt($(this).siblings('.extra_amount').text()) + 1;
            $(this).siblings('.extra_amount').text(amnt);
          });
        $(menu_item)
          .find('.reduce')
          .on('click', function (ev) {
            if (parseInt($(this).siblings('.extra_amount').text()) > 0) {
              let amnt = parseInt($(this).siblings('.extra_amount').text()) - 1;
              $(this).siblings('.extra_amount').text(amnt);
            }
          });

        $(menu_item)
          .find('.increase_ord')
          .on('click', function (ev) {
            let amnt = parseInt($(this).siblings('.ord_amount').text()) + 1;
            let price = $(menu_item).find('.item_price').text();
            if (
              $(menu_item).find('.dscnt_price').css('visibility') === 'visible'
            )
              price = $(menu_item).find('.dscnt_price').text();
            if (!price)
              price = $(menu_item).find('.item_price').attr('placeholder');

            $(menu_item)
              .add('checked')
              .removeClass('ordered')
              .removeClass('approved');

            $(this).siblings('.ord_amount').text(amnt);
            let cur_pack = $(menu_item).find('.pack_btn').text();
            $(menu_item)
              .find('.dropdown-item:contains(' + cur_pack + ')')
              .attr('ordlist', JSON.stringify({ qnty: amnt, price: price }));
          });
        $(menu_item)
          .find('.reduce_ord')
          .on('click', function (ev) {
            if (parseInt($(this).siblings('.ord_amount').text()) > 0) {
              let amnt = parseInt($(this).siblings('.ord_amount').text()) - 1;
              let price = $(menu_item).find('.item_price').text();
              if (
                $(menu_item).find('.dscnt_price').css('visibility') ===
                'visible'
              )
                price = $(menu_item).find('.dscnt_price').text();

              if (!price)
                price = $(menu_item).find('.item_price').attr('placeholder');

              $(menu_item)
                .add('checked')
                .removeClass('ordered')
                .removeClass('approved');

              $(this).siblings('.ord_amount').text(amnt);
              let cur_pack = $(menu_item).find('.pack_btn').text();
              $(menu_item)
                .find('.dropdown-item:contains(' + cur_pack + ')')
                .attr('ordlist', JSON.stringify({ qnty: amnt, price: price }));
              if (parseInt($(this).siblings('.ord_amount').text()) === 0) {
                $(this).closest('.menu_item').attr('deleted', true);
                return false;
              }
            }
          });

        if (that.offer[cat_tab][i].brand) {
          $('#tab_' + cat_tab + that.offer[cat_tab][i].brand.logo)
            .find('.card-body')
            .append(menu_item);
        } else {
          that.ovc
            .find('#tab_' + cat_tab)
            .find('.tab_row')
            .append(menu_item);
        }

        that.dict.set_lang(
          window.parent.sets.lang,
          $('#' + $(menu_item).attr('id')),
          that.profile.lang
        );

        that.RedrawOrder(that.uid, menu_item);

        return true;
      }

      // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');
      $('.collapse').on('shown.bs.collapse', function (ev) {
        $(ev.delegateTarget)
          .closest('.card')
          .find('.item_cnt')
          .css('display', 'none');
      });
      $('.collapse').on('hide.bs.collapse', function (ev) {
        $(ev.delegateTarget)
          .closest('.card')
          .find('.item_cnt')
          .css('display', 'block');
      });

      $('li.active a').tab('show');
      $('.tab_inserted  img:first').tab('show');
      $('.tab_inserted  img:first').addClass('active');

      $(that.ovc)
        .find('#address')
        .attr(
          'placeholder',
          window.parent.sysdict.getDictValue(
            window.parent.sets.lang,
            'введите адрес доставки'
          )
        );

      // window.parent.db.GetSupOrders(that.date, obj.uid, function (arObj) {
      //     if (arObj.length > 0) {
      //         for (let o in arObj) {
      //             let order = arObj[o];
      //             if(order.status['deleted'])
      //                 continue;
      //
      //             that.address = window.parent.user.profile.profile.address;
      //
      //             if (!that.address) {
      //                 window.parent.user.map.geo.SearchPlace(latlon, 18, function (obj) {
      //                     that.address = obj;
      //                     if (obj.street && obj.house)
      //                         $(that.ovc).find('#address').val(obj.street + "," + obj.house);
      //                 });
      //             } else {
      //                 if (that.address)
      //                     $(that.ovc).find('#address').val(that.address);
      //             }
      //
      //             if (order.published) {
      //                 that.published = order.published;
      //                 let status = window.parent.dict.getDictValue(window.parent.sets.lang, "published");
      //                 //$(that.ovc).find('.ord_status').css('color', 'white');
      //                 $(that.ovc).find('.ord_status').text(status + " " + order.published);
      //             }
      //
      //             if (order.comment) {
      //                 $(that.ovc).find('.comment').text(that.dict.getDictValue(window.sets.lang, order.comment));
      //             }
      //
      //         }
      //         if ($('.menu_item.ordered')[0])
      //             $('li.publish_order.disabled').removeClass('disabled');
      //     }
      //
      // });
    }

    setTimeout(
      function (targ_title) {
        that.SetOrders(() => {
          initOrder(targ_title);
        });

        $('.loader', $(window.parent.document).contents()).css(
          'display',
          'none'
        );
      },
      1200,
      targ_title
    );
  }

  SetOrders(cb) {
    window.parent.db.GetCusOrders(window.parent.user.date, (res) => {
      window.parent.user.orders = [];
      for (let i in res) {
        if (res[i].status && res[i].status['deleted']) continue;
        window.parent.user.orders.push(res[i]);
      }

      this.SetOrdCnt();
      cb();
    });
  }

  SetOrdCnt() {
    let cnt = 0;
    let num = 0;
    $('.ord_cnt').text(cnt);
    for (let i in window.parent.user.orders) {
      let order = window.parent.user.orders[i];
      for (let item in order.data) {
        if (order.data[item] && order.data[item].ordlist) {
          _.findKey(order.data[item].ordlist, function (o) {
            num += o.qnty;
          });
          $('.ord_cnt').text(num);
        }
      }
    }
  }

  onClickImage(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    let mi = $(ev.data);
    $(mi).find('.img-fluid').attr('src', this.src);
    return true;
  }

  FillProfile(obj) {
    this.InitProfileSupplier(obj);
    let profile = obj.profile;

    $('input').attr('title', '');
    $('#sup_name').val(profile.name);
    $('#sup_email').val(profile.email);
    $('#sup_mobile').val(profile.mobile);
    $('#sup_address').val(profile.address);
    $('#sup_place').val(profile.place);
    $('#sup_worktime').val(profile.worktime);
  }

  InitProfileSupplier(obj) {
    if (!obj.profile.avatar) {
      utils.LoadImage(
        'https://delivery-angels.store/dist/images/avatar_2x.png',
        function (src) {
          $('#sup_avatar').attr('src', src);
        }
      );
    } else {
      $('#sup_avatar').attr('src', this.image_path + obj.profile.avatar);
      $('#profile_img').attr('src', this.image_path + obj.profile.avatar);
    }

    $('input').prop('readonly', false);
  }

  InitSupplierReview(sup) {
    let par = {
      proj: 'd2d',
      user: window.parent.user.constructor.name.toLowerCase(),
      func: 'getcomments',
      supuid: sup.supuid,
      readOnly:
        sup.appr && sup.appr.cusuid === window.parent.user.uid ? false : true,
      profilePictureURL: this.image_path + sup.profile.avatar,
      enableEditing: true,
      enableDeleting: false,
      enableReplying: false,
      maxRepliesVisible: 5,
    };
    Object.assign(par, comment_obj.user[window.parent.sets.lang]);
    this.InitProfileSupplier({ supplier: sup, user: 'Customer' }, par);
  }

  GetUserProfileItems() {
    let that = this;
    $('.tab-pane').each(function (i, tab) {
      if ($(tab).attr('id') === 'user_pane') {
        window.parent.db.GetSettings(function (data) {
          let profile = data[0].profile;
          if (!profile) profile = {};

          $(tab)
            .find('input[changed]')
            .each(function (index, inp) {
              if ($(this).attr('type') === 'file') {
                profile['avatar'] = $(this).siblings('img').attr('src');
                return;
              }
              profile[inp.id] = $(inp).val();
            });
          data[0]['profile'] = profile;
          window.parent.db.SetObject('setStore', data[0], function (res) {});
        });
      }
    });
  }

  RedrawOrder(uid, menu_item) {
    let that = this;

    $(menu_item)
      .find('.pack_list')
      .on('click', function (ev) {
        try {
          let obj = JSON.parse($(ev.target).attr('ordlist'));
          if (obj.qnty) {
            $(menu_item).find('button.ord_amount ').text(obj.qnty);
          } else $(menu_item).find('button.ord_amount ').text(0);
        } catch (ex) {
          $(menu_item).find('button.ord_amount ').text(0);
        }
      });
    window.parent.db.GetOrder(
      this.date,
      uid,
      window.parent.user.uid,
      function (res) {
        if (res !== -1) {
          that.order = res;
          if (res.status && res.status['deleted']) return;

          let keys = Object.keys(res.data);
          //$('.sel_period').text(res.period);
          for (let k in keys) {
            if (keys[k] === 'comment') {
              $('.comment').text(
                that.dict.getDictValue(
                  window.parent.user.lang,
                  res.data.comment
                )
              );
            } else {
              window.parent.db.GetApproved(
                that.date,
                uid,
                window.parent.user.uid,
                function (appr) {
                  if (
                    appr &&
                    //res.period ===appr.period &&
                    res.data[keys[k]].price === appr.data.price &&
                    res.data[keys[k]].pack === appr.data.pack &&
                    res.data[keys[k]].qnty === appr.data.qnty
                  ) {
                    $('.item_title[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .find('.ordperiod')
                      .text(appr.period);
                    $('.item_title[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .find('.approved')
                      .attr('approved', that.date);
                    $('.item_title[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .find('.period_div')
                      .css('visibility', 'visible');

                    $('.item_title[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .find('.item_price')
                      .css('color', 'red');

                    //$('.address').attr('disabled','true');
                    // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.increase').css('visibility','hidden');
                    // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.reduce').css('visibility','hidden');
                    // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.pack_btn').attr('data-toggle','');
                  }
                }
              );

              if (res.data[keys[k]].ordlist) {
                let ordlist = res.data[keys[k]].ordlist;
                for (let q in ordlist) {
                  if (ordlist[q].qnty > 0) {
                    $('.item_title[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .find('.dropdown-item:contains(' + q + ')')
                      .attr('ordlist', JSON.stringify(ordlist[q]));

                    $('.item_title[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .find('.ord_amount')
                      .val(ordlist[q].qnty);
                    $('.item_title[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .find('.ord_amount')
                      .text(ordlist[q].qnty);

                    let price = ordlist[q].price;
                    $('.item_title[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .find('.item_price')
                      .text(price);
                    //$('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.item_price').css('color', 'grey');

                    $('.item_title[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .find('.pack_btn')
                      .text(q);
                    $('.item_title[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .attr('ordered', '');
                  }
                }
              }
              if (res.data[keys[k]].extralist) {
                let extralist = res.data[keys[k]].extralist;
                for (let q in extralist) {
                  if (extralist[q].qnty > 0) {
                    $('.item_title[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .find('.extra_title:contains("' + q + '")')
                      .closest('.row')
                      .find('.extra_amount')
                      .val(extralist[q].qnty)
                      .text(extralist[q].qnty);

                    let price = extralist[q].price;
                    //$('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.extra_price').text(price);
                    //$('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.item_price').css('color', 'grey');

                    // $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').find('.pack_btn').text(q);
                    // $('.item_title[data-translate=' + keys[k] + ']').closest('.menu_item').attr('ordered', '');
                  }
                }
              }
            }
          }
        }
      }
    );
  }

  GetOrderItems() {
    let that = this;

    let obj = { data: {} };
    $('.menu_item').each(function (i, el) {
      let tab = $(el).closest('.tab-pane').attr('id');

      let ordlist = {};
      let ar = $(el).find('.dropdown-item').toArray();
      for (let ddi in ar) {
        if ($(ar[ddi]).attr('ordlist')) {
          let ol = JSON.parse($(ar[ddi]).attr('ordlist'));
          ordlist[$(ar[ddi]).text()] = {
            qnty: parseInt(ol.qnty),
            price: ol.price
              ? parseFloat(ol.price)
              : $(ar[ddi]).attr('placeholder'),
          };
        }
      }

      let extralist = {};
      $(el)
        .find('.extra_amount')
        .each(function (i, el) {
          if (parseInt($(el).text()) > 0) {
            extralist[$(el).closest('.row').find('.extra_title').text()] = {
              qnty: parseInt($(el).text()),
              price: parseFloat(
                $(el).closest('.row').find('.extra_price').text()
              ),
            };
          }
        });

      if (
        parseInt($(el).find('button.ord_amount').text()) !== 0 ||
        $(el).hasClass('ordered') ||
        $(el).hasClass('approved')
      ) {
        obj.data[$(el).find('.item_title').attr('data-translate')] = {
          cat: tab.split('_')[1],
          ordlist: ordlist,
          extralist: extralist,
          status: $(this).hasClass('ordered')
            ? 'ordered'
            : $(el).hasClass('approved')
            ? 'approved'
            : 'checked',
          email: window.parent.user.profile.profile.email,
          mobile: window.parent.user.profile.profile.mobile,
        };
      }

      if ($('#order_pane').find('.comment')[0])
        obj['comment'] = $('#order_pane').find('.comment')[0].value;
      obj['supuid'] = that.uid;
      obj['cusuid'] = window.parent.user.uid;
      obj['date'] = that.date;
      obj['period'] =
        that.profile.type === 'foodtruck'
          ? moment().add(30, 'm').format('HH:mm')
          : $(window.parent.document).find('.sel_period').text();
      obj['address'] =
        that.profile.type === 'deliver' ? $('#address').val() : '';
    });

    return obj;
  }

  SaveOrder(cb) {
    let that = this;

    $('.loader').css('display', 'block');

    let items = that.GetOrderItems();

    if (Object.keys(items.data).length > 0) {
      window.parent.user.SaveOrder(items, (data) => {
        let status = window.parent.dict.getDictValue(
          window.parent.sets.lang,
          Object.keys(data)[1]
        );
        //$(that.ovc).find('.ord_status').css('color', 'white');
        $(that.ovc)
          .find('.ord_status')
          .text(status + '\r\n' + data.published);
        that.status = Object.keys(data)[1];
        $('.loader').css('display', 'none');
        cb(data);
      });
    } else {
      $('.loader').css('display', 'none');
    }
  }

  SaveProfile() {
    let func = 'confirmem';
    if (window.parent.user.psw) {
      func = 'updprofile';
    }

    let data_post = {
      proj: 'd2d',
      user: 'customer',
      func: func,
      uid: window.parent.user.uid,
      psw: window.parent.user.psw,
      profile: {
        email: $('#email').val(),
        lang: $('html').attr('lang'),
        name: $('#name').val(),
        mobile: $('#mobile').val(),
        address: $('#address').val(),
      },
    };

    window.parent.user.profile.profile = data_post.profile;
    window.parent.network.SendMessage(data_post, function (res) {
      if (!res || res.length === 0) {
        return;
      }
      delete data_post.proj;
      delete data_post.func;
      delete data_post.uid;
      delete data_post.host;
      if (res && !res.err) {
        let res_ = res;
        window.parent.db.GetSettings(function (obj) {
          if (!obj[0]) obj[0] = {};

          if (res.psw) obj[0].psw = res.psw;
          else obj[0].psw = data_post.psw;
          window.parent.user.psw = obj[0].psw;
          obj[0].profile = data_post.profile;
          obj[0].profile.name = data_post.profile.name;
          obj[0].profile.lang = data_post.profile.lang;
          obj[0].profile.mobile = data_post.profile.mobile;
          obj[0].profile.email = data_post.profile.email;
          obj[0].profile.address = data_post.profile.address;

          window.parent.db.SetObject('setStore', obj[0], function (res) {});
        });
      } else {
        alert(res.err);
      }
    });

    if ($('#address').val() || $('#email').val() || $('#mobile').val()) {
      window.parent.db.GetSettings((obj) => {
        obj[0].profile.address = $('#address').val();
        obj[0].profile.email = $('#email').val();
        obj[0].profile.mobile = $('#mobile').val();
        window.parent.db.SetObject('setStore', obj[0], (res) => {});
      });
    }
  }

  OpenUserCart(ev) {
    $('tbody').empty();
    window.cart = new CartCustomerStore();
    window.cart.InitUserOrders();
  }

  OpenUserProfile(ev) {
    let that = this;
    window.parent.db.GetSettings(function (data) {
      if (data[0] && data[0].profile) {
        for (let i in data[0].profile) {
          if (i === 'avatar') {
            if (
              !data[0].profile[i].includes('http') &&
              !data[0].profile[i].includes('data')
            ) {
              let src = that.image_path + data[0].profile[i];
              $('.avatar').attr('src', src);
            } else {
              $('.avatar').attr('src', data[0].profile[i]);
            }
            continue;
          }
          if (i) $('input[id=' + i + ']').val(data[0].profile[i]);
        }
      }

      if ($('#mobile').val() || $('#email').val()) {
        $('.reg_reminder').css('display', 'none');
      }
    });
  }
}

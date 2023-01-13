'use strict';

import 'bootstrap';

// require('webpack-jquery-ui');
// require('webpack-jquery-ui/css');
// require('jquery-ui-touch-punch');

// require('bootstrap-select');

// require('../../lib/jquery-comments-master/js/jquery-comments.js');
// require('../../lib/bootstrap-rating/bootstrap-rating.min.js');

require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');
require('tablesorter/dist/js/widgets/widget-filter.min.js');
require('tablesorter/dist/js/widgets/widget-pager.min.js');

import 'tablesorter/dist/css/theme.default.min.css';

// import noUiSlider from 'nouislider';
// import 'nouislider/distribute/nouislider.css';
//
var urlencode = require('urlencode');
import proj from 'ol/proj';

import QRCode from 'qrcode';

// const { getVatNumberInfos } = require('@adriantombu/vat-number');
var VATValidator = require('vatcode-validator');

import comment_obj from '../../dist/assets/vendor/jquery-comments/params.json';

import { Utils } from '../utils/utils';

import { CategoriesOffer } from '../categories/categories.offer';
import { longTab, doubleTap } from '../utils/utils';

let utils = new Utils();
let _ = require('lodash');
let md5 = require('md5');
let moment = require('moment/moment');

$(window).on('load', () => {
  let iOSdevice =
    !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
  if (iOSdevice)
    $('[role="tablist"] .nav-link').each((i, e) => {
      if (!$(e).attr('href')) $(e).attr('href', $(e).data('target'));
    });
});

$(document).on('readystatechange', function () {
  if (document.readyState !== 'complete') {
    return;
  }

  window.InitSupplierOffer = function (stobj) {
    if (!window.offer) {
      window.offer = new SupplierOffer(stobj);
      $('img.avatar').after('<span class="dnld_img fa fa-image fa-2x"></span>');
    } else {
      $('.menu_item').remove();
      window.offer.date = stobj.date;
      window.offer.offer = stobj.data;
      window.offer.address = 'foodtruck'
        ? stobj.address
        : window.parent.user.profile.profile.address;

      $('#adr_text', $(window.parent.document)).val(window.offer.address);
    }

    window.offer.InitTabsByCategories(function () {
      window.offer.OpenOffer();
    });
  };
  // if(window.parent.sets.css)
  //     $('#cus_link').attr('href', '../css/' + window.parent.sets.css+'.css?v='+String(Date.now()));

  let readURL = function (input) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();

      reader.onload = function (e) {
        $('.avatar').attr('src', e.target.result);
        $('.avatar').siblings('input:file').attr('changed', true);
      };
      reader.readAsDataURL(input.files[0]);
    }
  };

  window.OnClickCheck = function (el) {
    let ch = $(el).prop('checked');
    $('.tr_item[cusuid=' + $(el).attr('cusuid') + '] .approve').prop(
      'checked',
      ch
    );
  };
});

export class SupplierOffer {
  constructor(stobj) {
    const that = this;

    this.path = window.parent.con_param.host_port;

    this.image_path = window.parent.con_param.image_path;

    this.uid = window.parent.user.uid;
    this.profile = window.parent.user.profile.profile;
    this.offer = stobj.data;

    this.address = stobj.address ? stobj.address : profile.address;
    this.promo = window.parent.user.promo;
    this.prolong = window.parent.user.prolong;
    this.rating = window.parent.user.rating;

    this.date = window.parent.user.date;

    this.changed = false;

    this.body = $('body');

    $('.slider-range').slider({
      range: true,
      min: 6,
      max: 22,
      step: 1,
      values: [8, 20],

      slide: function (event, ui) {
        $($(this).find('.start')[0]).text(ui.values[0]);
        $($(this).find('.end')[0]).text(ui.values[1]);

        $('#min-price').html(ui.values[0]);

        // let suffix = '';
        // if (ui.values[1] == $('#max-price').data('max')) {
        //   suffix = ' +';
        // }
        $('#max-price').html(ui.values[1]);

        $('#save_offer').addClass('tosave');
      },
    });

    $('.start,.end', document).on('touchend', function (ev) {
      //$(this).closest('.ui-slider-handle').text($(this).text());
      // $(this).find('.start').text('8');
      // $(this).find('.end').text('20');
    });

    $('.dayoff').on('click', function () {
      $(this).siblings('.price-slider').find('.start').text('');
      $(this).siblings('.price-slider').find('.end').text('');
    });

    $('#splash', window.parent.document).css('display', 'none');

    $('#adr_text', $(window.parent.document)).val(this.address);

    $('#adr_text', window.parent.document).on('change', () => {
      $('#save_offer').addClass('tosave');
    });

    $('#vat').on('change', async () => {
      if (!VATValidator.isValid($('#vat').val())) {
        $('#vat')
          .val('')
          .attr('placeholder', 'Input valid VAT number')
          .css('color', 'red');
      } else {
        $('#vat').css('color', 'black');
      }
    });

    window.parent.user.map.ol_map.on('moveend', function (ev) {
      if (!ev.target.focus_) return;

      let loc = proj.toLonLat(ev.target.focus_);
      window.parent.user.offer.stobj.latitude = Number(loc[1].toFixed(6));
      window.parent.user.offer.stobj.longitude = Number(loc[0].toFixed(6));
      window.parent.user.offer.stobj.location = ev.target.focus_;

      window.parent.user.map.geo.SearchPlace(
        [
          window.parent.user.offer.stobj.latitude,
          window.parent.user.offer.stobj.longitude,
        ],
        19,
        function (obj) {
          if (obj.city && obj.street && obj.house) {
            $('#adr_text', window.parent.document).val(
              obj.city + ',' + obj.street + ',' + obj.house
            );
            $('#save_offer').addClass('tosave');
          } else {
            $('#adr_text', window.parent.document).text('');
          }
        }
      );
    });

    this.days = [];

    if (that.profile.type === 'foodtruck') {
      this.days.push(moment(this.date).format('MM/DD/YYYY'));

      window.parent.db.GetAllOffers(function (res) {
        const ar = _.filter(res, function (offer) {
          return moment(offer.date).isBetween(
            moment().subtract(7, 'days'),
            moment().add(7, 'days')
          );
        });
        that.days = _.map(ar, (d) => {
          return moment(d.date).format('MM/DD/YYYY');
        });
      });
    }

    $('#datepicker').datepicker({
      beforeShowDay: function (d) {
        let style = '';
        let inAr = $.inArray($.datepicker.formatDate('mm/dd/yy', d), that.days);
        switch (inAr) {
          case -1:
            style = 'ui-state-free';
            break;

          default:
            if (moment(d).isSame(moment(), 'day')) {
              style = 'ui-state-current';
            } else {
              style = 'ui-state-active';
            }
        }
        return [true, style];
      },

      onUpdateDatepicker: function () {
        const cpy =
          "<span id='copy_offer' class='fa fa-calendar-plus-o' title='Save To Next Week'></span>";
        $('#ui-datepicker-div').append(cpy);
        $('#ui-datepicker-div')
          .find('#copy_offer')
          .off('click')
          .on('click', () => {
            if (confirm('Copy Offers To Next Week?')) {
              that.copyNextWeek();
            }
          });
        const del =
          "<span id='delete_offer' class='fa fa-calendar-minus-o' title='Delete This Day Offer'></span>";
        $('#ui-datepicker-div').append(del);
        $('#ui-datepicker-div')
          .find('#delete_offer')
          .off('click')
          .on('click', () => {
            if (confirm('Delete This Day Offer?')) {
              that.DeleteOffer();
            }
          });

        // $('#ui-datepicker-div').append($('#delete_offer'));
      },
    });

    $('#datepicker').datepicker(
      'setDate',
      moment(this.date).format('MM/DD/YYYY')
    );

    if (moment(that.date).isSame(moment(), 'day')) {
      $('#datepicker').css('color', 'blue');
    } else {
      $('#datepicker').css('color', 'black');
    }

    $('#datepicker').on('change', function (ev) {
      if (moment($('#datepicker').val()).isSame(moment(), 'day')) {
        $('#datepicker').css('color', 'blue');
      } else {
        $('#datepicker').css('color', 'black');
      }
      $('#save_offer').css('color', '#0088bb'); //iframe context
      window.parent.user.ChangeDatePicker($(this).val());
    });

    $('.sel_period').on('click', function () {
      noUiSlider.create(this, {
        start: [20, 80],
        connect: true,
        range: {
          min: 0,
          max: 100,
        },
      });
    });

    $('.file-upload').on('change', function (e) {
      let el = this;
      try {
        loadImage(
          e.target.files[0],
          function (img, data) {
            if (img.type === 'error') {
              console.error('Error loading image ');
            } else {
              let this_img = img.toDataURL();

              setTimeout(function () {
                $('.avatar').attr('src', this_img);

                $('.avatar').siblings('input:file').attr('changed', true);
                console.log('Original image width: ', data.originalWidth);
                console.log('Original image height: ', data.originalHeight);
              }, 200);
            }
          },
          {
            orientation: true,
            maxWidth: 600,
            maxHeight: 300,
            minWidth: 400,
            minHeight: 200,
            canvas: true,
          }
        );
      } catch (ex) {
        console.log(ex);
      }
    });

    this.body.find('#save_offer').off();
    this.body.find('#save_offer').on('click touchstart', this, function (ev) {
      ev.preventDefault();
      ev.stopPropagation();

      that.saveFrame($('.nav-link.active').attr('href'));

      $('#save_offer').css('color', '#0088BB');
    });

    this.body.find('.show_map').off();
    this.body.find('.show_map').on('click touchstart', this, function (ev) {
      ev.preventDefault();
      ev.stopPropagation();

      $('#dtp_container', window.parent.document).css('display', 'none');

      $('.loader', window.parent.document).css('display', 'block');

      //that.saveFrame($('.nav-link.active').attr('href'));

      $('.nav-tabs')[0].scrollIntoView();

      // $('#ordtable tbody').empty();

      $('.loader', window.parent.document).css('display', 'none');
      // $('#supplier_frame',window.parent.document).css('display','none');
      $('#add_item').css('display', 'none');
      $('.show_map').parent().css('display', 'none');
      $('#save_offer').parent().css('visibility', 'hidden');
      $(window.frameElement).css('height', '45px');
    });

    $('.nav-item').on('click', function (ev_prof) {
      if ($(this).find('.dt_val')[0]) return;
      if ($('.category[state=1]')[0]) $('#add_item').css('display', '');
      $('.show_map').parent().css('display', '');
      $('#save_offer').parent().css('visibility', 'visible');
      $(window.frameElement).css('height', '100%');

      //that.saveFrame('#editor_pane');
    });

    $('.nav-tabs a').on('click', function (ev) {
      //var rel_href = $(ev.currentTarget).attr('href');  // previous tab
      //that.saveFrame(rel_href);
    });

    $('.nav-tabs a').on('shown.bs.tab', function (ev) {
      var targ_href = $(ev.target).attr('href'); // active tab
      var rel_href = $(ev.relatedTarget).attr('href'); // previous tab

      $('.collapse:not(#collapse_lang, .item_body)').addClass('show');

      $(ev.target).attr('pane_hash', md5($(targ_href)[0].innerHTML));

      if (!$(ev.relatedTarget).attr('pane_hash')) return;

      //TOD0:
      // if($(ev.relatedTarget).attr('pane_hash') === md5($(rel_href)[0].innerHTML))
      //     return;

      //that.saveFrame(rel_href);
    });
  }

  getSchedule() {
    let ar = [];
    $('.selector').each(function () {
      const key = this.id.split('_')[1];
      const start = $($(this).find('.ui-slider-handle')[0]).text();
      const end = $($(this).find('.ui-slider-handle')[1]).text();
      if (start && end) ar.push({ [this.id]: [start, end] });
    });
    return ar;
  }

  saveFrame(rel_href) {
    const that = this;

    $('#save_offer').removeClass('tosave');

    if (rel_href === '#orders_pane') {
      $.each($('.cus_foot :checked'), function (i, el) {
        window.parent.db.GetOrder(
          moment($(el).closest('.cus_foot').attr('orddate')).format(
            'YYYY-MM-DD'
          ),
          window.parent.user.uid,
          $(el).attr('cusuid'),
          function (obj) {
            obj.number = $(el).closest('td').siblings('[number]').text();
            window.parent.user.ApproveOrder(obj);
          }
        );
      });
    } else if (rel_href === '#profile_pane') {
      that.SaveProfile(function (ev_prof) {
        if (!ev_prof) {
          alert(
            window.parent.sysdict.getValByKey(
              window.parent.sets.lang,
              '03870ff3038eb6709c2c0ab02bac5563'
            )
          );
        }
        $('.loader').css('display', 'none');
      });
    } else if (rel_href === '#editor_pane') {
      let items = that.GetOfferItems(window.parent.sets.lang);
      $('.loader').css('display', 'block');

      window.parent.user.offer.stobj.dict = window.parent.dict;

      that.days.push(
        moment(window.parent.user.offer.stobj.date).format('MM/DD/YYYY')
      );

      window.parent.user.offer.stobj.data = items['remote'];
      let local = {
        data: window.parent.user.offer.stobj.data,
        date: moment(window.parent.user.offer.stobj.date).format('YYYY-MM-DD'),
        longitude: window.parent.user.offer.stobj.longitude,
        latitude: window.parent.user.offer.stobj.latitude,
        address: $('#adr_text', window.parent.document).val(),
      };

      window.parent.user.offer.SetOfferDB(local);

      window.parent.user.PublishOffer(
        items['remote'],
        moment(window.parent.user.date).format('YYYY-MM-DD'),
        that,
        function (obj, data_obj) {
          $('.loader').css('display', 'none');
          if (moment($('.dt_val').val()).isSame(moment(), 'day')) {
            $('.dt_val').css('color', 'blue');
          } else {
            $('.dt_val').css('color', 'black');
          }
          if (!data_obj) {
            return false;
          }
          try {
          } catch (ex) {
            console.log(ex);
          }

          let ind = $('li.tab_inserted.active').val();
          let active = $($('li.active').find('img')[ind]).text();
        }
      );
    }
  }

  async copyNextWeek() {
    const res = await window.parent.user.CopyNextWeek();
    const dates = _.map(res.supplier, (offer) => {
      return moment(offer.date).format('MM/DD/YYYY');
    });
    this.days = _.union(this.days, dates);
  }

  async DeleteOffer() {
    const date = await window.parent.user.DeleteOffer();
    if (date) {
      if (this.profile.type === 'foodtruck') {
        this.days = _.without(
          this.days,
          moment(this.date).format('MM/DD/YYYY')
        );
      }

      $('#datepicker').datepicker('setDate', moment(date).format('MM/DD/YYYY'));

      this.date = date;
    }
  }

  addTab(cat_tab, state) {
    const that = this;
    let cat_str = '';
    if (state === '0') return;
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
        '<span class="cat_div  text-center" data-toggle="tab" href="#tab_' +
        cat_tab +
        '">' +
        '<span id="' +
        cat_tab +
        '" class="category icofont-brand-natgeo"  extra="true" title="' +
        cat_tab +
        '" state="0"></span>' +
        '<h5 class="title" contenteditable="true">' +
        cat_tab +
        '</h5>' +
        '<h6><span class="cat_cnt badge rounded-pill bg-secondary">0</span></h6>' +
        '</div>';
    if ($('[href="#tab_' + cat_tab + '"]').length === 0) {
      //$('#menu_tabs').prepend(cat_str);
      $(cat_str).insertBefore(that.body.find('#add_tab_li'));
      $(
        '<div id="tab_' +
          cat_tab +
          '" class="div_tab_inserted tab-pane" ' +
          state +
          '>' +
          '<div class="filter_div collapse show"></div>' +
          '</div>'
      ).insertBefore($('#add_tab_div'));
      $('.icofont-filter').css('display', '');
    }
  }

  OpenOffer() {
    const that = this;

    if ($('.kolmit').length === 0) {
      let kolmit = $('iframe.kolmit_tmplt').clone();
      $(kolmit)
        .css('display', 'block')
        .attr('class', 'kolmit')
        .attr(
          'src',
          '../kolmit/user/iframe.html?abonent=d2d@kolmit&em=' +
            window.parent.user.email
        );
      $('#kolmit_pane').append(kolmit);
    }

    if (this.profile.name || this.profile.email)
      $('.name')
        .css('display', 'block')
        .text(
          this.profile.name
            ? this.profile.name
            : this.profile.email.split('@')[0]
        );

    window.parent.dict.set_lang(window.parent.sets.lang, this.body[0]);

    this.dict = window.parent.dict;

    $('#lang_sel button').html(
      $(
        '#lang_sel [role=langitem][value=' + window.parent.sets.lang + '] span'
      )[0].outerHTML
    );

    $('#lang_sel').val(window.parent.sets.lang);
    $('#lang_sel [role=langitem]').on('click', function () {
      window.parent.sets.lang = $(this).attr('value');
      //window.parent.sysdict.set_lang(window.parent.sets.lang,that.body[0]);
      that.dict.set_lang(window.parent.sets.lang, $('.menu_item'));
      $('#lang_sel button').html($(this).find('span')[0].outerHTML);
      $('#lang_sel button').trigger('click');
    });

    let cats = [];
    for (let tab in that.offer) {
      cats.push(
        $('.category[cat="' + tab + '"]', window.parent.document).attr('id')
      );
    }

    if (window.parent.user.profile.address)
      that.body.find('.address').val(this.address);

    if (window.parent.user.settings) {
      for (let par in window.parent.user.settings) {
        $('#settings')
          .find('select#' + par)
          .find('option[value=' + window.parent.user.settings[par] + ']')
          .attr('selected', true);
      }
    }

    $('#add_tab_li').on('click', function (ev) {
      let text = 'Введите наименование категории';
      let hint = '';
      let cat_tab = prompt(text, hint);
      let img = null;

      window.offer.addTab(cat_tab, 1);
    });

    that.InitOrderByOffer();

    $('#supplier_frame_container', window.parent.document).css(
      'height',
      '100%'
    );

    let isDown = false,
      isScroll = false;
    let startX;
    let scrollLeft;

    that.FillProfile(that.profile);

    that.InitSupplierReview(that);

    $('.table-responsive').on('mousedown', function (e) {
      isDown = true;
      this.classList.add('active');
      startX = e.pageX - this.offsetLeft;
      scrollLeft = this.scrollLeft;
    });
    $('.table-responsive').on('mouseleave', function () {
      isDown = false;
      this.classList.remove('active');
    });
    $('.table-responsive').on('mouseup', function () {
      setTimeout(function () {
        isScroll = false;
      }, 100);
      isDown = false;
      this.classList.remove('active');
      return false;
    });
    $('.table-responsive').on('mousemove', function (e) {
      if (!isDown) return;
      isScroll = true;
      e.preventDefault();
      const x = e.pageX - this.offsetLeft;
      const walk = x - startX;
      this.scrollLeft = scrollLeft - walk;
    });
  }

  InitOrderByOffer() {
    $('.menu_item').off();
    $('.menu_item').remove();
    $('.tab_inserted').remove();

    const that = this;
    let isEditable = true;

    $('.empty_div').append($('#add_item'));

    if (window.parent.user.profile.profile.type === 'foodtruck') {
      $('#copy-offer').css('display', 'block');
      $('#delete_offer').css('display', 'block');
      $('#address').parent().css('display', 'none');
    }

    for (let t in that.offer) {
      //
      // let img = $(".category#"+t,window.parent.document).attr('src');
      // if(that.offer[t].img)
      //     img = that.offer[t].img;
      // window.offer.addTab(t,$(".category#"+t,window.parent.document).attr('state'));
      openTab(t);
    }

    setTimeout(function () {
      that.ord_items = ''; //that.GetOfferItems(that.lang);

      $('.collapse:not(#collapse_lang, .item_body)').addClass('show');
      //$('.item_title').trigger("click");
      $('[href="#editor_pane"]').attr(
        'pane_hash',
        md5($('#editor_pane')[0].innerHTML)
      );

      $('#' + $($('.menu_item')[0]).attr('cat')).trigger('click');

      // $('.category#'+$($('.menu_item')[0]).attr('cat')).siblings('.cat_cnt').text($('.category#'+$('.menu_item')).length);

      $('textarea, input:not(input:file), :checkbox, .form-control')
        .not('.dt_val')
        .not('#copy_offer')
        .on('change', (ev) => {
          $('#save_offer').addClass('tosave');
        });

      $('input:file').on('change', function (ev) {
        $('#save_offer').addClass('tosave');
      });

      _.forEach($('.main_category'), function (main_cat) {
        let sum = 0;
        _.forEach($('.cat_div', $(main_cat).parent()), (el) => {
          let tab = $(el).attr('href').split('#tab_')[1];

          $('.cat_div[href="#tab_' + tab + '"]')
            .find('.cat_cnt')
            .text($('[cat="' + tab + '"]').length);
          sum += $('[cat="' + tab + '"]').length;
        });
        $(main_cat).siblings('.cat_cnt').text(sum);
      });
    }, 300);

    function openTab(tab) {
      for (let i in that.offer[tab]) {
        $('#add_item').css('display', 'block');

        if (i === '0') {
          openOffer(tab, i);
        } else {
          setTimeout(
            function (i) {
              openOffer(tab, i, that);
            },
            10,
            i
          );
        }
      }
    }

    function openOffer(tab, i) {
      let extra = $('.category#' + tab, window.parent.document).attr('extra');
      let menu_item = $('#menu_item_tmplt').clone();
      $(menu_item).attr('id', tab + '_' + i);
      $(menu_item).attr('cat', tab);
      $(menu_item).attr('class', 'menu_item');
      $(menu_item).css('display', 'block');

      $(menu_item)
        .find('.publish:checkbox')
        .attr('id', 'item_cb_' + i);
      $(menu_item).find('.publish:checkbox').attr('pos', i);
      $(menu_item).find('.publish:checkbox').attr('tab', tab);

      $(menu_item).find('.item_cb').css('visibility', 'visible');

      if (that.offer[tab][i].checked == 'true') {
        $(menu_item).find('.publish:checkbox').prop('checked', true);
        if (that.published) isEditable = false;
      } else {
        isEditable = true;
      }

      if (that.offer[tab][i].title) {
        $(menu_item)
          .find('.item_title')
          .attr('data-translate', that.offer[tab][i].title);
      }

      if (that.profile.type === 'supplier') {
        if (that.offer[tab][i].dict_name) {
          that.dict.dict[that.offer[tab][i].title] =
            that.offer[tab][i].dict_name;
        }
      }

      $(menu_item)
        .find('.item_body_coll')
        .attr('data-target', '#content_' + tab + '_' + i);

      $(menu_item)
        .find('.item_body')
        .attr('id', 'content_' + tab + '_' + i)
        .on('show.bs.collapse', () => {
          _.forEach(menu_item.find('.img-fluid.carousel-img'), (el) => {
            const val = $(el).attr('val');
            $(el).attr('src', val);
          });
          $('.prop_div', menu_item).collapse('hide');
        });

      $(menu_item).find('.item_title').attr('contenteditable', isEditable);

      $(menu_item).find('.item_price').attr('contenteditable', isEditable);
      // $(menu_item).find('.item_price').val(that.offer[tab][i].packlist[0].price?that.offer[tab].price:that.offer[tab].price.price);

      $(menu_item)
        .find('.offer_filter')
        .attr('data-target', '#prop_' + tab + '_' + i);

      $(menu_item)
        .find('.prop_div')
        .attr('id', 'prop_' + tab + '_' + i);

      if (that.offer[tab][i].brand) {
        $(menu_item).find('.brand').css('visibility', 'visible');
        let src = '';
        if (
          that.offer[tab][i].brand.logo.includes('http') ||
          that.offer[tab][i].brand.logo.includes('base64')
        )
          src = that.offer[tab][i].brand.logo;
        else {
          src = that.image_path + that.offer[tab][i].brand.logo;
        }

        src = src.replace('http://localhost:5502', '..');
        $(menu_item).find('.brand').attr('src', src);
      }

      that.fillPacklist(menu_item, tab, i);

      that.inputImagesVal(tab, i, that, menu_item);

      // $(menu_item).find('.item_pack').attr('packlist', JSON.stringify(that.offer[tab][i].packlist));
      // $(menu_item).find('.item_price').on('focusout', {that: that, mi: $(menu_item)}, function (ev) {
      //     $(menu_item).find('.add_pack').css('visibility', 'hidden');
      //     that.OnClickAddPack(ev);
      // });
      //
      // $(menu_item).find('.item_price').on('click touchstart', that, function (ev) {
      //     //$(menu_item).find('.add_pack').css('visibility', 'visible');
      //     //$(this).focus();
      // });
      //
      // $(menu_item).find('.item_qnty').on('focusout', {that: that, mi: $(menu_item)}, function (ev) {
      //     that.OnClickAddPack(ev);
      // });

      if (!$('#tab_' + tab).find('.pub_div')[0]) {
        $('#tab_' + tab)
          .find('.filter_div')
          .append(
            '<div class="pub_div form-check">' +
              '     <input type="checkbox" checked class="form-check-input"  value="published"' +
              '         style="transform: scale(1.5);-webkit-transform: scale(1.5);">' +
              '    <label class="form-check-label">опубликовано</label>' +
              '</div>'
          );
        $('#tab_' + tab)
          .find('.filter_div')
          .append(
            '<div class="pub_div form-check">' +
              '     <input type="checkbox" checked class="form-check-input"  value="unpublished"' +
              '         style="transform: scale(1.5);-webkit-transform: scale(1.5);">' +
              '     <label class="form-check-label">н/опубликовано</label>' +
              '</div>'
          );
      }

      if (that.offer[tab][i].prop) {
        $('#tab_' + tab)
          .find('.filter_div')
          .css('visibility', 'visible');

        $('<div>').load('../html/tmplt/prop.tmplt.html', function (el) {
          $('.filter_div').draggable();
          for (let p in that.offer[tab][i].prop) {
            if (
              !$('#tab_' + tab)
                .find('.filter_div')
                .find('#prop_' + p)[0]
            )
              $('#tab_' + tab)
                .find('.filter_div')
                .append(
                  '<div id="prop_' +
                    p.replace(/\s+/g, '') +
                    '" class="prop_name">' +
                    p +
                    '</div>'
                );

            for (let v in that.offer[tab][i].prop[p]) {
              if (
                $('#tab_' + tab)
                  .find('.filter_div')
                  .find(
                    'label:contains(' + that.offer[tab][i].prop[p][v] + ')'
                  )[0]
              )
                continue;

              let cpy = $(el).clone();
              cpy.find('.prop_check').val(that.offer[tab][i].prop[p][v]);
              cpy.find('label').text(that.offer[tab][i].prop[p][v]);

              $(cpy)
                .find(':checkbox')
                .on('change', function (ev) {
                  $('.menu_item').css('display', 'none');

                  $.each($('input.prop_check'), function (i, el) {
                    if ($(el).prop('checked')) {
                      $('.prop_val[value="' + $(el).val() + '"]')
                        .closest('.menu_item')
                        .css('display', 'block');
                    }
                  });
                });
              $('#tab_' + tab)
                .find('.filter_div')
                .find('#prop_' + p.replace(/\s+/g, ''))
                .append(cpy);
            }
          }
        });
      }

      if (that.offer[tab][i].content_text)
        if (
          that.offer[tab][i].content_text.value &&
          window.parent.dict.getValByKey(
            window.parent.sets.lang,
            that.offer[tab][i].content_text.value
          )
        ) {
          $(menu_item)
            .find('.item_title')
            .siblings('span')
            .css('display', 'block');
          // $(menu_item).find('.content_text').attr('contenteditable', 'false');
          $(menu_item)
            .find('.content_text')
            .attr('data-translate', that.offer[tab][i].content_text.value);
        }

      $(':checkbox').on('change', function (ev) {
        if ($(ev.target).prop('checked')) {
          if ($(ev.target).attr('value') === 'published') {
            $.each(
              $('.publish:checked').closest('.menu_item'),
              function (i, item) {
                $(item).css('display', 'block');
              }
            );
          } else if ($(ev.target).attr('value') === 'unpublished') {
            $.each(
              $('.publish:not(:checked)').closest('.menu_item'),
              function (i, item) {
                $(item).css('display', 'block');
              }
            );
          }
        } else {
          if ($(ev.target).attr('value') === 'published') {
            $.each(
              $('.publish:checked').closest('.menu_item'),
              function (i, item) {
                $(item).css('display', 'none');
              }
            );
          } else if ($(ev.target).attr('value') === 'unpublished') {
            $.each(
              $('.publish:not(:checked)').closest('.menu_item'),
              function (i, item) {
                $(item).css('display', 'none');
              }
            );
          }
        }
      });
      //menu_item.find('.prop.container').empty();
      //fill prop list
      for (let k in that.offer[tab][i].prop) {
        for (let v in that.offer[tab][i].prop[k]) {
          let row = menu_item.find('.prop.tmplt').clone();
          row.removeClass('tmplt');
          row.find('.add_prop_div').remove();
          row.find('.input').attr('contenteditable', true);
          row.find('.prop_key').val(k);
          row.find('.prop_val').val(that.offer[tab][i].prop[k][v]);
          row.find('.prop_val').attr('value', that.offer[tab][i].prop[k][v]);

          $(menu_item).find('.prop.tmplt').before(row);
        }
      }

      if (that.offer[tab][i].bargain === 'true') {
        $(menu_item).find('.bargain:checkbox').prop('checked', 'true');
      }

      if (extra === 'true') {
        $(menu_item).find("[data-target='.extras']").css('display', 'block');
        $(menu_item)
          .find('.extras')
          .attr('id', 'extra' + tab + '_' + i);
        $(menu_item)
          .find("[data-target='.extras']")
          .attr('data-target', '#extra' + tab + '_' + i);
      }

      $.each(that.offer[tab][i].extra, function (e, el) {
        if (!el) return;
        let row = $($(menu_item).find('.add_title_div')[0])
          .closest('.add_row')
          .clone();
        row.addClass('extra');
        row.find('.extra_title').attr('data-translate', e);
        row.find('.extra_price').val(el.price);
        row.find('.input').attr('contenteditable', true);
        row.find('.add_extra_div').css('visible', 'hidden');
        $($(menu_item).find('.add_title_div')[0])
          .closest('.extras')
          .prepend(row);
      });

      menu_item.insertBefore($('#editor_pane .empty_div')); //добавить продукт в закладку

      that.lang = window.parent.sets.lang;
      window.parent.dict.set_lang(
        window.parent.sets.lang,
        $('#' + menu_item.attr('id'))
      );

      $(menu_item).find('input:file').on('change', menu_item, that.onLoadImage);

      $(menu_item)
        .find('.img-fluid')
        .attr('id', 'ap_' + tab + '_' + i);
      $(menu_item)
        .find('.dnld_img')
        .on('click touchstart', menu_item, function (ev) {
          let menu_item = $(this).closest('.menu_item');
          //let vis = $(menu_item).find('.img-fluid').css('visibility');
          ev.target = $(menu_item).find('.empty')[0];
          ev.mi = $(menu_item).attr('id');
          that.OnClickImport(ev);
        });

      $(menu_item)
        .find('.rem_img')
        .on('click touchstart', menu_item, function (ev) {
          let menu_item = $(this).closest('.menu_item');
          //let vis = $(menu_item).find('.img-fluid').css('visibility');
          ev.target = $(menu_item)
            .find('.carousel-item.active')
            .find('.img-fluid:not(".empty")')[0];
          ev.mi = $(menu_item).attr('id');
          that.RemoveImg(ev.target, menu_item);
        });

      if (that.offer[tab][i].brand) {
        $(menu_item).find('.brand_img').css('visibility', 'visible');
        let src = '';
        if (
          that.offer[tab][i].brand.logo.includes('http') ||
          that.offer[tab][i].brand.logo.includes('base64')
        )
          src = that.offer[tab][i].brand.logo;
        else {
          src = that.image_path + that.offer[tab][i].brand.logo;
        }

        src = src.replace('http://localhost:5502', '..');
        $(menu_item).find('.brand_img').attr('src', src);
      }

      $(menu_item)
        .find('.brand_img')
        .attr('id', 'brand_' + tab + '_' + i);
      $(menu_item)
        .find('.brand')
        .on('click touchstart', menu_item, function (ev) {
          let menu_item = $(this).closest('.menu_item');
          //let vis = $(menu_item).find('.img-fluid').css('visibility');
          ev.target = $(menu_item).find('.brand_img')[0];
          ev.mi = $(menu_item).attr('id');
          that.OnClickImport(ev);
        });

      $(menu_item)
        .find('.brand_img')
        .on('dragend', function () {
          $('.brand_img').attr('src', '');
        });

      $(menu_item)
        .find('.brand_img')
        .doubleTap(function (ev) {
          $(this).attr('src', '');
        });

      $(menu_item)
        .find('.brand_img')
        .on('click touchstart', menu_item, function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
        });

      $(menu_item)
        .find('.img_cert')
        .on('click touchstart', menu_item, function (ev) {
          let menu_item = $(this).closest('.menu_item');
          ev.target = $(menu_item).find('.cert_container')[0];
          ev.mi = $(menu_item).attr('id');
          that.OnClickAddCert(ev);
        });

      $(menu_item).find('.toolbar').css('display', 'block');

      $(menu_item)
        .find('.orders')
        .attr('id', 'orders' + tab + '_' + i);
      $(menu_item).find('.order_ctrl').attr('data-toggle', 'collapse');
      $(menu_item)
        .find('.order_ctrl')
        .attr('data-target', '#orders' + tab + '_' + i);

      $(menu_item)
        .find('.tablesorter')
        .attr('id', 'ordtable_' + that.offer[tab][i].title);

      $(menu_item)
        .find('a[role=packitem]')
        .on(
          'click touchstart',
          {
            that: that,
            mi: $(menu_item),
          },
          that.OnClickPack
        );

      $('a[href="#' + tab + '"]').css('color', 'blue');

      $(menu_item).find('.item_title').collapse('hide');

      // $(menu_item).find('.cert_container').sortable({
      //     connectWith: "div",
      //     placeholder: "ui-state-highlight"
      // });
      $(menu_item).find('.add_extra').on('click', that.onAddExtra);
      $(menu_item).find('.add_prop').on('click', that.onAddProp);
      $(menu_item).find('.add_pack').on('click', that.onAddPack);
    }

    if (window.parent.user.date === moment().format('YYYY-MM-DD')) {
      $('.notoday').removeClass('notoday');
    }

    $('#add_item').off();
    $('#add_item').on('click touchstart', that, that.AddOfferItem);

    $('.input').click(function (ev) {
      $(this).focus();
    });

    $("a[href='#editor_pane']").off('click touchstart');
    $("a[href='#editor_pane']").on('click touchstart', this, function (ev) {});

    $('[data-toggle="popover"]').popover();

    try {
      window.parent.sysdict.set_lang(window.parent.sets.lang, this.body[0]);
    } catch (ex) {}
  }

  RemoveImg(el, menu_item) {
    menu_item.find('.carousel').carousel('pause');
    if (
      confirm(
        {
          ru: 'Удалить изображение?',
          en: 'Remove image?',
          fr: "Supprimer l'image?",
          nl: 'Een beeld verwijderen?',
        }[window.parent.sets.lang]
      )
    ) {
      $(el).closest('.carousel-item.active').remove();
      $(
        $(menu_item).find('.carousel-inner').find('.carousel-item')[0]
      ).addClass('active');
      $('#save_offer').addClass('tosave');
    }
    menu_item.find('.carousel').carousel('next');
  }

  inputImagesVal(tab, i, that, menu_item) {
    for (let c in that.offer[tab][i].cert) {
      let src = that.offer[tab][i].cert[c].src;

      if (!that.offer[tab][i].cert[c].src.includes('data:image'))
        src = that.image_path + that.offer[tab][i].cert[c].src;
      if ($(menu_item).find('img[src="' + src + '"]').length === 0) {
        $(menu_item)
          .find('.carousel-inner')
          .append(
            '<div class="carousel-item">' +
              // '<img  class="img-fluid mx-auto d-block" src=' + src + '>' +
              '<img  class="carousel-img img-fluid" val=' +
              src +
              '>' +
              '</div>'
          );
      }
    }

    $($(menu_item).find('.carousel-inner').find('.carousel-item')[0]).addClass(
      'active'
    );
    //$(menu_item).find('.carousel').carousel({interval: 3000});
    $(menu_item)
      .find('.carousel')
      .attr('id', 'carousel_' + tab + '_' + i);
    $(menu_item)
      .find('.carousel')
      .append(
        '<a class="carousel-control-prev" href="#carousel_' +
          tab +
          '_' +
          i +
          '">' +
          '<span class="carousel-control-prev-icon"></span>' +
          '</a>' +
          '<a class="carousel-control-next" href="#carousel_' +
          tab +
          '_' +
          i +
          '">' +
          '<span class="carousel-control-next-icon"></span>' +
          '</a>'
      );

    // Enable Carousel Controls
    $(menu_item)
      .find('.carousel-control-prev')
      .click(function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        $('#carousel_' + tab + '_' + i).carousel('prev');
        menu_item.find('.carousel').carousel('pause');
      });

    $(menu_item)
      .find('.carousel-control-next')
      .click(function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        $('#carousel_' + tab + '_' + i).carousel('next');
        menu_item.find('.carousel').carousel('pause');
      });
  }

  InitTabsByCategories(cb) {
    const that = this;
    let market = 'food';

    $('#menu_tabs').load(
      '../html/categories/' +
        market +
        '.html?v=' +
        String(Date.now()) +
        ' .categories',
      () => {
        window.db = window.parent.db;
        that.categories = new CategoriesOffer();
        $('#cat_incl').css('bottom', 'auto');
        if (cb) cb();
      }
    );

    // $('.category[state="1"]',window.parent.document).each(function (i, cat) {
    //     let extra = $(cat).attr('extra');
    //     let cat_tab = $(cat).attr('id');
    //     let cat_img = $(cat).attr('src');
    //
    //     that.addTab(cat_tab,cat_img,'1');
    //
    //     $('.dropdown').css('visibility', 'visible');
    //     $('#order_menu_button').css('visibility', 'visible');
    //
    //     $('#add_tab_li').css('visibility', 'visible');
    //
    //     $('.cat_div').on('click',function () {
    //         $('.cat_div').removeClass('active');
    //     });
    //     //$("#offer_pane").resizable();
    //
    //     function selectText(el) {
    //         $(el).focus();
    //         document.execCommand('selectAll', false, null);
    //     }
    //
    //     this.lang = window.parent.sets.lang;
    //     window.parent.sysdict.set_lang(window.parent.sets.lang, $("#menu_item_tmplt"));
    //     window.parent.sysdict.set_lang(window.parent.sets.lang, $("#editor_pane"));
    //
    $('#promo').val(that.promo);

    if (window.parent.user.date === moment().format('YYYY-MM-DD')) {
      $('.notoday').removeClass('notoday');
    }

    $('#orders_pane').find('tbody').empty();

    window.parent.db.GetSupOrders(
      moment(that.date).format('YYYY-MM-DD'),
      window.parent.user.uid,
      function (res) {
        let dateAr = _.groupBy(res, 'date');
        for (let d in dateAr) {
          _.forEach(dateAr[d], function (item, i) {
            // $("a[href='#orders_pane']").trigger('click');

            let data = item.data;
            let inv_period = '',
              inv_qnty = '',
              tr_class = '',
              tr_disabled = '',
              tr_style = '';
            if (item.period !== that.offer.period) {
              inv_period = "style='color:red'";
            }
            let kAr = Object.keys(data);
            let calcDistance = new Promise(function (resolve, reject) {
              if (!that.location) resolve('undefined');
              window.parent.user.map.geo.GetDistanceToPlace(
                that.location,
                item.address,
                function (res) {
                  resolve(res);
                }
              );
            });

            //calcDistance.then(function (dist) {
            function setOwner(k) {
              window.parent.db.GetOffer(new Date(that.date), function (off) {
                if (off.length >= 1) {
                  let ar = off[0].data[item.data[k].cat];
                  let r = _.find(ar, 'title', k);
                  if (r)
                    $(".owner[title='" + k + "']").text(r.owner ? r.owner : '');
                }
              });
            }

            let total = 0,
              qnty = 0;

            let appr = '';

            for (let k in kAr) {
              let tr =
                "<tr class='cus_head' style='text-align: center;'  cusuid=" +
                item.cusuid +
                ' orddate=' +
                item.date +
                '>' +
                '<td></td>' +
                '<td>' +
                item.date +
                '<br>' +
                item.period +
                '</td>' +
                '<td><span>' +
                item.address +
                '</span></td>' +
                '<td></td>' +
                '<td></td>' +
                '<td></td>' +
                '<td></td>' +
                "<td style='text-align: center;'>" +
                // kolmit[0].outerHTML+
                '</td>' +
                '</tr>';
              if (
                !$(
                  'tr.cus_head[cusuid="' +
                    item.cusuid +
                    '"][orddate="' +
                    item.date +
                    '"]'
                )[0]
              ) {
                $(tr).appendTo($('tbody', $('#orders_pane')[0]));
              }

              for (let o in data[kAr[k]].ordlist) {
                $('.item_title[data-translate=' + kAr[k] + ']')
                  .closest('.menu_item')
                  .find('.order_ctrl')
                  .css('visibility', 'visible');

                if (data[kAr[k]].ordlist[o].qnty == 0) {
                  //deleted
                  inv_qnty = "title='deleted' style='color:red'";
                  tr_style = 'color:red;text-decoration:line-through';
                  tr_disabled = 'disabled';
                }

                let mi = $(
                  '.item_title[data-translate=' + kAr[k] + ']'
                ).closest('.menu_item');
                let price = mi.find('.item_price').val();
                if (data[kAr[k]].price !== price) {
                  tr_class += ' inv_price';
                }
                let num = data[kAr[k]].num ? data[kAr[k]].num : 'na';

                let rsrv,
                  remain = '&nbsp;';
                try {
                  rsrv = that.offer[data[kAr[k]].cat][i].packlist[o]['rsrv']
                    ? that.offer[data[kAr[k]].cat][i].packlist[o]['rsrv']
                    : 0;
                  remain =
                    parseInt(
                      that.offer[data[kAr[k]].cat][i].packlist[o]['qnty']
                    ) - rsrv;
                  if (remain === 'NaN') remain = '';
                } catch (ex) {}

                let kolmit = $('iframe.kolmit_tmplt').clone();
                $(kolmit)
                  .css('display', 'block')
                  .css('margin', '0 auto')
                  .attr('class', 'kolmit')
                  .attr(
                    'src',
                    '../kolmit/iframe.html?&role=user&uid=' +
                      md5(item.cusuid) +
                      '&abonent=' +
                      item.cusuid
                  );
                total +=
                  data[kAr[k]].ordlist[o].price * data[kAr[k]].ordlist[o].qnty;
                let cat = $(
                  '.category#' + data[kAr[k]].cat,
                  window.parent.document
                ).attr('cat');

                let tr =
                  "<tr class='tr_item' cusuid=" +
                  item.cusuid +
                  ' orddate=' +
                  item.date +
                  " style='text-align: center;" +
                  tr_style +
                  "' " +
                  tr_disabled +
                  '>' +
                  '<td></td>' +
                  '<td>' +
                  // "<input  type='checkbox'  class='checkbox-inline approve' " +
                  // "cusuid="+res[i].cusuid+" title="+kAr[k]+
                  // "  style='transform: scale(1.5);-webkit-transform: scale(1.5);'>" +
                  '</td>' +
                  '<td></td>' +
                  "<td title style='word-break:break-all;'>" +
                  window.parent.dict.getValByKey(that.lang, kAr[k]) +
                  '</td>' +
                  '<td>' +
                  o +
                  '</td>' +
                  '<td qnty>' +
                  data[kAr[k]].ordlist[o].qnty +
                  '</td>' +
                  '<td price>' +
                  String(data[kAr[k]].ordlist[o].price) +
                  '</td>' +
                  "<td class='tablesorter-no-sort'>" +
                  (dateAr[d].comment
                    ? "<span class='tacomment'>" + item.comment + '</span>'
                    : '') +
                  '</td>' +
                  '</tr>';

                $(tr).insertAfter(
                  $(
                    'tr.cus_head[cusuid="' +
                      item.cusuid +
                      '"][orddate="' +
                      item.date +
                      '"]'
                  )[0]
                );

                // $('.approve').on('click',function (ev) {
                //     //if(remain==='&nbsp;')
                //     //    return; TODO: remains
                //     let pl = JSON.parse(mi.find('.item_pack').attr('packlist'));
                //     pl[o]['rsrv'] = pl[o]['rsrv']? pl[o]['rsrv']:0;
                //
                //     if ($(this)[0].checked == true) {
                //         $(this).closest('td').find('a').text(remain - data[kAr[k]].ordlist[o].qnty);
                //         pl[o]['rsrv'] = pl[o]['rsrv'] - data[kAr[k]].ordlist[o].qnty;
                //     }else {
                //         $(this).closest('td').find('a').text(remain);
                //         pl[o]['rsrv'] = pl[o]['rsrv'] + data[kAr[k]].ordlist[o].qnty;
                //     }
                //     mi.find('.item_pack').attr('packlist', JSON.stringify(pl));
                //
                // });

                if (window.parent.user.profile.profile.type === 'marketer') {
                  $('.marketer').css('display', 'none');
                  $('.complete').attr('disabled', 'true');
                }
              }

              for (let e in data[kAr[k]].extralist) {
                let tr =
                  "<tr class='tr_item'>" +
                  '<td></td>' +
                  '<td></td>' +
                  '<td></td>' +
                  '<td></td>' +
                  "<td  style='text-align: center;'>" +
                  e +
                  '</td>' +
                  "<td  style='text-align: center;'>" +
                  data[kAr[k]].extralist[e].qnty +
                  '</td>' +
                  "<td  style='text-align: center;'>" +
                  String(data[kAr[k]].extralist[e].price) +
                  '</td>' +
                  '<td></td>' +
                  '<td></td>' +
                  '<td></td>' +
                  '<td></td>' +
                  '<td></td>' +
                  '<td></td>' +
                  '</tr>';

                $(tr).appendTo($('tbody', $('#orders_pane')[0]));
              }

              tr =
                "<tr class='cus_foot' style='text-align: center;'  cusuid=" +
                item.cusuid +
                ' orddate=' +
                item.date +
                '>' +
                '<td number>' +
                window.parent.user.uid.slice(0, 2) +
                item.cusuid.slice(0, 2) +
                '/' +
                new Date(item.date).getDate() +
                '</td>' +
                "<td style='text-align: center;'>" +
                "<input type='checkbox'  class='checkbox-inline approve' " +
                " title='" +
                kAr[k] +
                "' cusuid=" +
                item.cusuid +
                " onclick='window.OnClickCheck(this)'" +
                "  style='transform: scale(1.5);-webkit-transform: scale(1.5);'>" +
                '</td>' +
                '<td></td>' +
                '<td></td>' +
                '<td></td>' +
                '<td></td>' +
                '<td>' +
                total.toFixed(2) +
                '</td>' +
                "<td style='text-align: center;'>" +
                // kolmit[0].outerHTML+
                '</td>' +
                '</tr>';

              if (
                !$(
                  'tr.cus_foot[cusuid="' +
                    item.cusuid +
                    '"][orddate="' +
                    item.date +
                    '"]'
                )[0]
              ) {
                $(tr).appendTo($('tbody', $('#orders_pane')[0]));
              } else {
                $(
                  'tr.cus_foot[cusuid="' +
                    item.cusuid +
                    '"][orddate="' +
                    item.date +
                    '"]'
                ).replaceWith(tr);
              }

              if (item.status['deleted']) {
                $(
                  'tr.cus_foot[cusuid="' +
                    item.cusuid +
                    '"][orddate="' +
                    item.date +
                    '"]'
                )
                  .find('.approve')
                  .css('display', 'none')
                  .after(
                    '<i class="icofont-close" style="color:red" data-translate="3e741d3cdf3c445925a16e77a49a4fe8">order canceled</i>'
                  );
              } else if (item.status['approved']) {
                $(
                  'tr.cus_foot[cusuid="' +
                    item.cusuid +
                    '"][orddate="' +
                    item.date +
                    '"]'
                )
                  .find('.approve')
                  .prop('checked', 'true');
              }
            }
          });
        }

        $('.order_amnt').text($('.tr_item').length);

        that.orders = res;
      }
    );

    $('#add_item').off();
    $('#add_item').on('click touchstart', that, that.AddOfferItem);

    $('.input').click(function (ev) {
      $(this).focus();
    });

    $('[data-toggle="popover"]').popover();
  }

  fillPacklist(menu_item, tab, i) {
    const that = this;
    let pl = '';
    if (that.offer[tab][i].packlist)
      pl = utils.ReverseObject(that.offer[tab][i].packlist);
    else return;

    for (let l in pl) {
      const row = $(menu_item).find('.tmplt.pack').clone();
      $(menu_item).find('.tmplt.pack').before(row);
      row.removeClass('tmplt');
      row.find('.add_pack_div').css('visibility', 'hidden');
      row.find('.bargain_div').remove();
      row.find('input').prop('contenteditable', true);
      row.find('.item_pack').attr('data-translate', md5(l));
      row.find('.item_pack').val(l);
      row.find('.item_price').val(pl[l].price ? pl[l].price : pl[l]); //version conflist solution
      row.find('.item_qnty').val(pl[l].qnty);
    }
  }

  FillProfile(profile) {
    // $('input').prop('readonly', true);
    // $('input').attr('placeholder', '');
    if (profile.avatar) {
      if (profile.avatar.includes('base64'))
        $('.avatar').attr('src', profile.avatar);
      else $('.avatar').attr('src', this.image_path + profile.avatar);
    } else $('.avatar').attr('src', this.path + '/dist/images/user.png');

    _.forEach(profile.worktime, (val) => {
      const key = Object.keys(val)[0];
      $('.selector[id=' + key + ']')
        .find('.start')
        .text(val[key][0])
        .parent()
        .css('left', (100 / 16) * (val[key][0] - 6) + '%');
      $('.selector[id=' + key + ']')
        .find('.end')
        .text(val[key][1])
        .parent()
        .css('left', (100 / 16) * (val[key][1] - 6) + '%');
    });

    $('input').attr('title', '');
    $('#name').val(profile.name);
    $('#email').val(profile.email);
    $('#mobile').val(profile.mobile);
    $('#address').val(this.address);
    $('#place').val(this.address);
    $('#vat').val(profile.vat);
    // $('#delivery').prop('checked', profile.delivery);
  }

  InitProfileSupplier(user, settings) {
    // this.InitComments(user, settings);
    // this.InitRating();

    if (window.parent.user) {
      let arr = Object.keys(window.parent.user.offer.stobj.data);
      arr = JSON.stringify(
        arr.map((str) => {
          return Number(str);
        })
      );

      $('#map_link').css('display', 'block');
      $('#map_link').attr(
        'href',
        this.path +
          'dist/customer.html?lang=' +
          window.parent.sets.lang +
          '&market=food&supuid=' +
          window.parent.user.uid +
          '&cat=' +
          arr +
          '&zoom=21&lat=' +
          window.parent.user.offer.stobj.latitude +
          '&lon=' +
          window.parent.user.offer.stobj.longitude
      );

      QRCode.toCanvas(
        $('#qr_canvas')[0],
        window.parent.con_param.host_port +
          'dist/customer.html?lang=' +
          window.parent.sets.lang +
          '&supem=' +
          this.profile.email,
        function (error) {
          if (error) console.error(error);
          console.log('success!');
        }
      );
    }
  }

  InitSupplierReview(sup) {
    let par = {
      readOnly:
        sup.appr && sup.appr.cusuid === window.parent.user.uid ? false : true,
      profilePictureURL: sup.profile.avatar
        ? this.image_path + sup.profile.avatar
        : this.path + '/dist/images/user.png',
      enableEditing: true,
      enableDeleting: false,
      enableReplying: false,
    };
    Object.assign(par, comment_obj.supplier[window.parent.sets.lang]);
    this.InitProfileSupplier(
      { supuid: sup.uid, user: window.parent.user.constructor.name },
      par
    );
  }

  InitComments(obj, settings) {
    let this_obj = obj;
    $('img.avatar').attr('src', settings.profilePictureURL);
    //settings.profilePictureURL = this.path+'/images/'+this.profile.avatar;

    $('#comments-container').comments(
      Object.assign(settings, {
        getComments: function (success, error) {
          let par = {
            proj: 'd2d',
            user: window.parent.user.constructor.name.toLowerCase(),
            func: 'getcomments',
            supuid: obj.supuid,
          };

          window.parent.network.SendMessage(par, function (data) {
            var commentsArray = [];
            if (data.resAr) {
              for (let i in data.resAr) {
                let com = data.resAr[i].content;
                commentsArray.push(com);
              }
            }
            success(commentsArray);
          });
        },
        postComment: function (data, success, error) {
          if (window.parent.user.profile && window.parent.user.profile.name) {
            data['fullname'] = window.parent.user.profile.name;
          } else if (window.parent.user.email) {
            data['fullname'] = window.parent.user.email.split('@')[0];
          } else {
            data['fullname'] = 'Покупатель';
          }

          data['created_by_current_user'] = false;
          let par = {
            proj: 'd2d',
            user: window.parent.user.constructor.name.toLowerCase(),
            func: 'setcomments',
            supuid: this_obj.supuid,
            cusuid: window.parent.user.uid,
            data: data,
          };
          window.parent.network.SendMessage(par, function (res) {
            if (!res.err) {
              data['created_by_current_user'] = true;
              success(saveComment(data));
            }
          });
        },
        putComment: function (data, success, error) {
          data['created_by_current_user'] = false;
          let par = {
            proj: 'd2d',
            user: window.parent.user.constructor.name.toLowerCase(),
            func: 'setcomments',
            supuid: this_obj.supuid,
            cusuid: window.parent.user.uid,
            data: data,
          };
          window.parent.network.SendMessage(par, function (res) {
            data['created_by_current_user'] = true;
            success(saveComment(data));
          });
        },
        deleteComment: function (commentJSON, success, error) {},
      })
    );
    let usersArray;
    let saveComment = function (data) {
      // Convert pings to human readable format
      $(data.pings).each(function (index, id) {
        var user = usersArray.filter(function (user) {
          return user.id == id;
        })[0];
        data.content = data.content.replace('@' + id, '@' + user.fullname);
      });

      return data;
    };
  }

  InitRating() {
    let data_obj = {
      proj: 'd2d',
      user: window.parent.user.constructor.name.toLowerCase(),
      func: 'getrating',
      psw: window.parent.user.psw,
      supuid: window.parent.user.uid,
    };
    window.parent.network.SendMessage(data_obj, function (data) {
      if (data.resAr && data.resAr.rating)
        $('.rating').rating('rate', data.resAr.rating);
    });
  }

  OnClickPack(ev) {
    let menu_item = ev.data.mi;
    const that = ev.data.that;

    let pl = JSON.parse($(menu_item).find('.item_pack').attr('packlist'));
    let price = pl[$(ev.target).text()].price;
    let qnty = pl[$(ev.target).text()].qnty;
    $(menu_item).find('.item_pack').val($(ev.target).text());
    $(menu_item).find('.item_pack').attr('pack', $(ev.target).text());
    $(menu_item).find('.item_price').val(price);
    $(menu_item).find('.item_qnty').text(qnty);
  }

  AddOfferItem(ev) {
    const that = ev.data;

    // if($('.menu_item').length>=parseInt($('#items_limit').val())) {
    //    return true;
    // }

    let tab = $('.category[state=1]').attr('id');

    if (!tab) return;

    ev.preventDefault(); // avoid to execute the actual submit of the form.
    ev.stopPropagation();

    var pos = $('.menu_item[id^="' + tab + '"]').length;
    let tmplt;
    if (pos < 1) {
      tmplt = $('#menu_item_tmplt').clone();
    } else {
      tmplt = $($('.menu_item[id^="' + tab + '"]')[pos - 1]).clone();
    }

    let menu_item = tmplt; //$('#menu_item_tmplt').clone();
    menu_item.insertBefore($('#editor_pane .empty_div'));

    menu_item.attr('cat', tab);
    menu_item.attr('id', tab + '_' + pos);
    menu_item.attr('class', 'menu_item');
    menu_item.css('display', 'block');
    menu_item.attr('cat', tab);

    menu_item.find('.item_title').val('');
    menu_item.find('.content_text').val('');
    menu_item.find('.carousel-img').remove();

    // menu_item.find('.pack_container').replaceWith($(tmplt).find('.pack_container')[0]);
    // menu_item.find('.price_div').replaceWith($(tmplt).find('.price_div')[0]);
    menu_item.find('.publish:checkbox').prop('checked', false);
    menu_item.find('.publish:checkbox').attr('id', 'item_cb_' + pos);
    menu_item.find('.publish:checkbox').attr('pos', pos);
    menu_item.find('.publish:checkbox').attr('tab', tab);
    $('.btn').css('visibility', 'visible');

    menu_item.find('.content_text').attr('contenteditable', 'true');
    // menu_item.find('.item_title').attr('contenteditable', 'true');
    menu_item.find('.item_price').attr('contenteditable', 'true');

    //menu_item.find('.item_title').text($('#item_title').text());

    //window.dict.dict[hash] = {};
    //menu_item.find('.item_title').attr('data-translate',hash);

    menu_item
      .find('.item_title')
      .attr('data-target', '#content_' + tab.replace('#', '') + pos);
    menu_item
      .find('.item_body_coll')
      .attr('data-target', '#content_' + tab + '_' + pos);

    menu_item
      .find('.item_body')
      .attr('id', 'content_' + tab + '_' + pos)
      .on('show.bs.collapse', () => {
        _.forEach(menu_item.find('.img-fluid.carousel-img'), (el) => {
          const val = $(el).attr('val');
          $(el).attr('src', val);
        });
        $('.prop_div', menu_item).collapse('hide');
      });

    // function focusOut(ev) {
    //     let res =$.grep($(".item_title"), function (n, i) {
    //         return (n.value && n.value === ev.target.value)
    //     });
    //     if(res.length>1) {
    //         $(ev.currentTarget).off('focusout');
    //         alert({ru:"Названия продуктов не должны повторяться",en:"Name of product should be unique"}[window.parent.sets.lang]);
    //         $(this).select();
    //         setTimeout(function () {
    //             $(ev.currentTarget).on('focusout',focusOut);
    //         },200);
    //     }
    // }
    // menu_item.find('.item_title').on('focusout', focusOut);

    //window.dict.dict[hash] = {};
    let hash = md5(new Date().getTime() + 'content_text');
    menu_item.find('.content_text').attr('data-translate', hash);
    hash = md5(new Date().getTime() + 'item_title');
    menu_item.find('.item_title').attr('data-translate', hash);

    menu_item.find('.item_pack').attr('data-translate', '');

    menu_item
      .find('.img-fluid')
      .attr('id', 'img_' + tab.replace('#', '') + '_' + pos);

    menu_item.find('.put_image').css('display', 'block');

    that.mi_id = menu_item.attr('id');

    menu_item.find('input:file').on('change', menu_item, that.onLoadImage);

    if (
      $('.category[id="' + tab + '"]', window.parent.document).attr('extra') ===
      'true'
    ) {
      menu_item.find("[data-target='.extras']").css('display', 'block');
      menu_item.find('.extras').attr('id', 'extra_' + tab + '_' + pos);
      menu_item
        .find("[data-target='.extras']")
        .attr('data-target', '#extra_' + tab + '_' + pos);
    }

    menu_item
      .find('.fa-image')
      .on('click touchstart', menu_item, function (ev) {
        let menu_item = $(ev.data);
        let vis = menu_item.find('.img-fluid').css('visibility');

        ev.target = menu_item.find('.img-fluid')[0];
        ev.mi = menu_item.attr('id');
        that.OnClickImport(ev);
      });

    menu_item.find('.add_content').on('click touchstart', function () {
      $(this).closest('.menu_item').find('.item_content').slideDown('slow');
      let vis = $(this)
        .closest('.menu_item')
        .find('.content_text')
        .css('visibility');
      if (vis === 'visible') {
        vis = 'hidden';
      } else {
        vis = 'visible';
      }
      $(this)
        .closest('.menu_item')
        .find('.content_text')
        .css('visibility', vis);
      $(this).closest('.menu_item').find('.content_text').focus();
    });

    // menu_item.find('.item_pack').on('focusout', that, function (ev) {
    //     const that = ev.data;
    //     let pack = menu_item.find('.item_pack').attr('pack');
    //     if ($(this).val() === '') {
    //         menu_item.find('a:contains(' + pack + ')').remove();
    //         let pl = JSON.parse(menu_item.find('.item_pack').attr('packlist'));
    //         delete pl[pack];
    //         $(this).attr('packlist', JSON.stringify(pl));
    //     }
    // });

    menu_item
      .find('.brand_img')
      .attr('id', 'brand_' + tab + '_' + $('.brand_img').length);
    menu_item.find('.brand').on('click', menu_item, function (ev) {
      let menu_item = $(this).closest('.menu_item');
      //let vis = menu_item.find('.img-fluid').css('visibility');
      ev.target = menu_item.find('.brand_img')[0];
      ev.mi = menu_item.attr('id');
      that.OnClickImport(ev);
    });

    menu_item.find('.brand').on('dragend', function () {
      $(this).remove();
    });

    menu_item
      .find('.cert_container')
      .attr('id', 'gallery_' + tab.replace('#', '') + '_' + pos);

    menu_item.find('.add_pack').attr('id', 'pack_' + tab.replace('#', ''));
    menu_item
      .find('.add_pack')
      .on('click touchstart', { mi: menu_item, that: that }, that.onAddPack);
    menu_item.find('.add_prop').on('click', that.onAddProp);

    menu_item.find('.add_extra').on('click', that.onAddExtra);

    menu_item.find('.item_title').focus();
    menu_item.find('.item_title')[0].scrollIntoView();

    menu_item.find('.toolbar').css('display', 'block');

    if (menu_item.find('.item_content').css('display') == 'block')
      menu_item.find('.item_content').slideToggle('fast');

    //window.parent.dict.set_lang(window.parent.sets.lang, $(menu_item));
    $('textarea, input, :checkbox, .form-control', menu_item).on(
      'change',
      (ev) => {
        $('#save_offer').addClass('tosave');
      }
    );
  }

  onAddProp(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    let row = $(ev.target).closest('.prop_container').find('.tmplt').clone();
    row.removeClass('tmplt');
    row.find('.input').prop('contenteditable', true);
    row.find('.input').text('');
    row.find('.add_prop_div').find('.add_prop').css('visibility', 'hidden');
    $(ev.target).closest('.prop_container').find('.tmplt').before(row);
    // setTimeout(function(){
    //     row.find('.prop_key[contenteditable=true]').focus();
    // },100);
  }

  onAddPack(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    let row = $(ev.target).closest('.pack_container').find('.tmplt').clone();
    row.removeClass('tmplt');
    row.find('.input').prop('contenteditable', true);
    row.find('.input').text('');
    row.find('.add_pack_div').find('.add_pack').css('visibility', 'hidden');
    row.find('.bargain_div').remove();
    $(ev.target).closest('.pack_container').find('.tmplt').before(row);
    // setTimeout(function(){
    //     row.find('.item_pack[contenteditable=true]').focus();
    // },100);
  }

  onAddExtra(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    let row = $(ev.target).closest('.add_row').clone();
    row.find('.add_extra_div').remove();
    row.addClass('extra');
    row.find('.input').prop('contenteditable', true);
    row.find('.input').text('');
    $(ev.target).closest('.add_row').parent().append(row);
    setTimeout(function () {
      $(row).find('.extra_title').focus();
    }, 100);
  }

  OnClickImport(ev) {
    let menu_item = $('#' + ev.mi);
    $(menu_item)
      .find('input:file')
      .attr(
        'menu_item',
        JSON.stringify({
          id: ev.mi,
          target: $(ev.target).attr('class').split(/\s+/),
        })
      );
    $(menu_item).find('input:file').focus();
    $(menu_item).find('input:file').trigger(ev);
    //$(menu_item).find('.fa-image').css('visibility', 'hidden');
  }

  onLoadImage(ev) {
    let menu_item = $(ev.data);
    let el = JSON.parse($(menu_item).find('input:file').attr('menu_item'));
    try {
      loadImage(
        ev.target.files[0],
        function (img, data) {
          if (img.type === 'error') {
            console.error('Error loading image ');
          } else {
            if (el.target[0] === 'brand_img') {
              $('#' + el.id)
                .find('.brand_img')
                .attr('src', img.toDataURL());

              $('#' + el.id).css('visibility', 'visible');

              $('#save_offer').addClass('tosave');

              return;
            }
            let tab = $('.div_tab_inserted.active').attr('id');

            $(img).addClass('carousel-img img-fluid mx-auto d-block');

            let i = menu_item.find('.carousel-img').length;

            menu_item
              .find('.carousel-inner')
              .find('.carousel-item')
              .removeClass('active');
            let carousel_item = $('<div class="carousel-item active"></div>');
            $(carousel_item).append(
              '<img src=' +
                img.toDataURL() +
                ' class="carousel-img img-fluid mx-auto d-block">'
            );
            menu_item.find('.carousel-inner').append(carousel_item);

            //$(menu_item).find('.carousel').carousel({interval: 3000});
            menu_item
              .find('.carousel')
              .attr('id', 'carousel_' + menu_item.attr('id'));
            if (menu_item.find('.carousel-control-prev').length === 0) {
              menu_item
                .find('.carousel')
                .append(
                  '<a class="carousel-control-prev" href="#carousel_' +
                    tab +
                    '_' +
                    i +
                    '">' +
                    '<span class="carousel-control-prev-icon"></span>' +
                    '</a>' +
                    '<a class="carousel-control-next" href="#carousel_' +
                    tab +
                    '_' +
                    i +
                    '">' +
                    '<span class="carousel-control-next-icon"></span>' +
                    '</a>'
                );
            }

            // Enable Carousel Controls
            menu_item.find('.carousel-control-prev').click(function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              $('#carousel_' + menu_item.attr('id')).carousel('prev');
              menu_item.find('.carousel').carousel('pause');
            });

            menu_item.find('.carousel-control-next').click(function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              $('#carousel_' + menu_item.attr('id')).carousel('next');
              menu_item.find('.carousel').carousel('pause');
            });

            $(img).doubleTap(function (ev) {
              if (
                confirm(
                  {
                    ru: 'Удалить изображение?',
                    en: 'Remove image?',
                    fr: "Supprimer l'image ?",
                  }[window.parent.sets.lang]
                )
              ) {
                $(this).closest('.carousel-item').remove();
                menu_item.find('.carousel').carousel('next');
                $(
                  $(menu_item).find('.carousel-inner').find('.carousel-item')[0]
                ).addClass('active');
                menu_item.find('.carousel').carousel('pause');
              }
            });

            //$(menu_item.find('.carousel-inner').find('.carousel-item')[0]).addClass('active');
            menu_item.find('.carousel').carousel('pause');
          }
        },
        {
          orientation: true,
          maxWidth: 500,
          maxHeight: 300,
          minWidth: 100,
          minHeight: 300,
          canvas: true,
        }
      );
    } catch (ex) {}
  }

  GetOfferItems(lang) {
    const that = this;
    let offerObj = { remote: {} };
    that.arCat = [];

    //$('.item_title').click();

    //
    // if (value) {
    //     if (!window.parent.dict.dict[md5(value)]) {
    //         window.parent.dict.dict[md5(value)] = {};
    //     }
    //     window.parent.dict.dict[md5(value)][lang] = value;
    // } else {
    //     $(val).empty();
    //     return true;
    // }

    // let checked = $(val).find('.menu_item').find('.publish:checkbox').prop('checked');

    let miAr = $('.menu_item');

    for (let i = 0; i < miAr.length; i++) {
      let item = {};

      let value = $(miAr[i]).attr('cat');
      // offerObj['local'][value] = [];
      if (!offerObj['remote'][value]) offerObj['remote'][value] = [];

      item.checked = JSON.stringify(
        $(miAr[i]).find('.publish:checkbox').prop('checked')
      );

      item.cert = [];
      $.each(
        $(miAr[i]).find('.carousel-inner').find('.img-fluid'),
        function (i, el) {
          let src = el.src ? el.src : $(el).attr('val'); //el.toDataURL();
          if (src.includes('empty.png')) {
            return;
          }

          if (src.includes('http://') || src.includes('https://')) {
            item.cert.push({ src: src.split('/').pop() });
          } else {
            item.cert.push({ src: src });
          }
        }
      );

      let title = $(miAr[i]).find('.item_title');
      let key = $(title).attr('data-translate');
      let text = $(miAr[i]).find('.item_title').val();

      if (text.length === 0 || !text.trim()) {
        continue;
      }
      if (!window.parent.dict.dict[key]) {
        window.parent.dict.dict[key] = {};
      }

      if (text && text !== window.parent.dict.dict[key][lang]) {
        window.parent.dict.dict[key][lang] = text;
        window.parent.db.SetObject(
          'dictStore',
          { hash: key, obj: window.parent.dict.dict[key] },
          () => {}
        );
      }
      item.title = key;

      if ($(miAr[i]).find('.content_text').css('visibility') === 'visible') {
        let cont_text = $(miAr[i]).find('.content_text');
        key = $(cont_text).attr('data-translate');
        text = $(cont_text).val(); //.replace(/'/g,'%27').replace(/\n/g,'%0D').replace(/"/g,'%22');
        if (!key) {
          key = md5('content_text_' + miAr[i].id + text);
          $(cont_text).attr('data-translate', key);
        }
        if (!window.parent.dict.dict[key]) {
          window.parent.dict.dict[key] = {};
        }
        if (text && text !== window.parent.dict.dict[key][lang]) {
          let obj = Object.assign({}, window.parent.dict.dict[key]);
          delete window.parent.dict.dict[key];
          window.parent.db.DeleteObject('dictStore', key, () => {});
          window.parent.dict.dict[key] = obj;
          window.parent.dict.dict[key][lang] = text;
          window.parent.db.SetObject(
            'dictStore',
            { hash: key, obj: window.parent.dict.dict[key] },
            () => {}
          );
        }

        item.content_text = { value: key };
      } else {
        if (item.content) delete item.content;
      }

      if ($(miAr[i]).find('.brand_img').attr('src')) {
        if ($(miAr[i]).find('.brand_img').attr('src').includes('http')) {
          item.brand = {
            logo: $(miAr[i]).find('.brand_img').attr('src').split('/').pop(),
          };
        } else {
          item.brand = { logo: $(miAr[i]).find('.brand_img').attr('src') };
        }
      } else {
        delete item.brand;
      }

      $.each($(miAr[i]).find('.prop'), function (i, el) {
        if ($(el).find('.prop_key').val() && $(el).find('.prop_val').val()) {
          if (!item.prop) {
            item.prop = {};
          }
          if (!item.prop[$(el).find('.prop_key').val()])
            item.prop[$(el).find('.prop_key').val()] = [];
          item.prop[$(el).find('.prop_key').val()].push(
            $(el).find('.prop_val').val()
          );
        }
      });

      $.each($(miAr[i]).find('.pack'), async function (p, el) {
        if (!item.packlist) item.packlist = {};

        if (
          $(el).find('.item_pack').val() &&
          $(el).find('.item_price ').val()
        ) {
          key = $(el).find('.item_pack').attr('data-translate');
          let text = $(el).find('.item_pack').val();

          if (key !== text) {
            delete item.packlist[key];
            key = text;
          }

          if (!key) {
            key = md5('item_pack_' + miAr[i].id + p + text);
            $(el).find('.item_pack').attr('data-translate', key);
          }

          if (!window.parent.dict.dict[key]) {
            window.parent.dict.dict[key] = {};
          }
          if (text && text !== window.parent.dict.dict[key][lang]) {
            let obj = Object.assign({}, window.parent.dict.dict[key]);
            delete window.parent.dict.dict[key];
            //let delete_key = new Promise( function (resolve, reject) {
            window.parent.db.DeleteObject('dictStore', key, () => {
              //resolve();
            });
            // });
            // await delete_key;

            window.parent.dict.dict[key] = obj;
            window.parent.dict.dict[key][lang] = text;
            window.parent.db.SetObject(
              'dictStore',
              { hash: key, obj: window.parent.dict.dict[key] },
              () => {}
            );
          }

          if (!item.packlist[key]) item.packlist[key] = {};

          item.packlist[key].qnty = $(el).find('.item_qnty').val().trim();
          item.packlist[key].price = $(el).find('.item_price').val().trim();

          if (!item.packlist[key].price.split('.')[1])
            item.packlist[key].price += '.00';

          if (
            item.packlist[key].price.split('.')[1] &&
            item.packlist[key].price.split('.')[1].length >= 1 &&
            item.packlist[key].price.split('.')[1].length < 2
          )
            item.packlist[key].price += '0';

          // if(key!==text){
          //     item.packlist[text] = Object.assign({} , item.packlist[key]);
          //     delete item.packlist[key];
          // }
        }
      });

      item.bargain = JSON.stringify(
        $(miAr[i]).find('.bargain:checkbox').prop('checked')
      );

      item.extra = {};
      $.each($(miAr[i]).find('.add_row'), function (e, el) {
        if (!$(el).find('.extra_title').val()) return;
        key = $(el).find('.extra_title').attr('data-translate');
        let text = $(el).find('.extra_title').val();
        if (!window.parent.dict.dict[key]) {
          window.parent.dict.dict[key] = {};
        }
        if (text && text !== window.parent.dict.dict[key][lang]) {
          let obj = Object.assign({}, window.parent.dict.dict[key]);
          delete window.parent.dict.dict[key];
          window.parent.db.DeleteObject('dictStore', key, () => {});
          if (!key) key = md5('extra_title' + miAr[i].id + e + text);
          window.parent.dict.dict[key] = obj;
          window.parent.dict.dict[key][lang] = text;
          $(el).find('.extra_title').attr('data-translate', key);
          window.parent.db.SetObject(
            'dictStore',
            { hash: key, obj: window.parent.dict.dict[key] },
            () => {}
          );
        }

        if (!item.extra[key]) item.extra[key] = {};
        item.extra[key].price = $(el).find('.extra_price').val().trim();
      });

      if (!_.includes(that.arCat, parseInt(value)))
        that.arCat.push(parseInt(value));

      //offerObj['local'][value].push(item);

      offerObj['remote'][value].push(item);
    }

    return offerObj;
  }

  SaveOffer(items) {
    let ind = $('li.tab_inserted.active').val();
    let active = $($('li.active').find('img')[ind]).text();

    // if(active) {
    //     items = this.getTabItems(active, lang);
    // }

    if (items['local'])
      window.parent.user.UpdateOfferLocal(
        this.offer,
        items['local'],
        proj.fromLonLat(
          window.parent.user.offer.stobj.longitude,
          window.parent.user.offer.stobj.latitude
        ),
        window.parent.dict.dict
      );
  }

  SaveProfile(cb) {
    const that = this;

    if ($('.avatar')[0].src.includes('base64')) {
      let k = 200 / $('.avatar').height();
      utils.createThumb_1(
        $('.avatar')[0],
        $('.avatar').width() * k,
        $('.avatar').height() * k,
        function (avatar) {
          uploadProfile(avatar.src, cb);
        }
      );
    } else {
      uploadProfile(window.parent.user.profile.profile.avatar, cb);
    }

    function uploadProfile(avatar, cb) {
      let data_post = {
        proj: 'd2d',
        user: window.parent.user.constructor.name,
        func: 'updprofile',
        uid: window.parent.user.uid,
        psw: window.parent.user.psw,
        profile: {
          type: window.parent.user.profile.profile.type,
          email: $('#email').val().toLowerCase(),
          avatar: avatar,
          lang: window.parent.user.profile.profile.lang,
          name: $('#name').val(),
          worktime: that.getSchedule(),
          mobile: $('#mobile').val(),
          address: $('#address').val(),
          vat: $('#vat').val(),
          // delivery: $('#delivery')[0].checked,
          delivery_price: $('#delivery_price').val(),
        },
        promo: $('#promo').val(),
        prolong: $('#prolong  option:selected').val(),
      };

      window.parent.network.SendMessage(data_post, function (res) {
        let res_ = res.profile;

        window.parent.db.GetSettings(function (obj) {
          let set = _.find(obj, { uid: window.parent.user.uid });
          if (set.settings) delete set.settings;
          set.profile = data_post.profile;
          set.promo = data_post.promo;
          set.prolong = data_post.prolong;

          if (res_) {
            if (res_) {
              set.profile.avatar = res_.avatar;
            }
            window.parent.db.SetObject('setStore', set, function (res) {
              $('#user', window.parent.document).attr(
                'src',
                that.image_path + res_.avatar
              );
              $(
                '#user',
                $('#fd_frame_tmplt', window.parent.document).contents()
              ).attr('src', that.image_path + res_.avatar);
              that.profile = set.profile;
              window.parent.user.profile.profile = set.profile;
              window.parent.user.promo = data_post.promo;
              window.parent.user.prolong = data_post.prolong;
              cb(true);
            });
          } else {
            cb(false);
          }
        });
      });
    }
  }

  SaveSettings() {
    let settings = {};
    $('#settings')
      .find('select')
      .each(function (i, item) {
        settings[$(item).attr('id')] = $(item)
          .closest('div')
          .find('.sel_prolong')
          .val();
      });

    window.parent.db.GetSettings(function (obj) {
      let _ = require('lodash');
      let set = _.find(obj, { uid: window.parent.user.uid });
      set.settings = settings;

      window.parent.db.SetObject('setStore', set, function (res) {
        window.parent.user.profile.profile = set.profile;
        window.parent.user.settings = settings;
      });
      let data_obj = {
        proj: 'd2d',
        user: window.parent.user.constructor.name.toLowerCase(),
        func: 'setsup',
        psw: window.parent.user.psw,
        uid: window.parent.user.uid,
        //profile:set.profile
      };
      data_obj['settings'] = settings;
      //data_obj['profile'] = set.profile;
      window.parent.network.SendMessage(data_obj, function (data) {});
    });
  }
}

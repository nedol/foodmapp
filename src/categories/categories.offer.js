'use strict';

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
// require('jquery-ui-touch-punch');

import { Categories } from '../../src/categories/categories.js';

import { MPCustomer } from '../customer/customer.mp.js';
import { Utils } from '../utils/utils';
let utils = new Utils();

export class CategoriesOffer extends Categories {
  constructor() {
    super();
    this.initCategories();
  }

  initCategories() {
    let inputs = $('.main_category').attr('state', 0).css('opacity', 0.3);

    let catAr = [];
    let state_cat = localStorage.getItem('state_category');

    inputs = $('.category').attr('state', 0).css('opacity', 0.3);

    $('.category').on('click', this, this.OnClickCategory);

    $('.cat_menu ').on('click', function () {
      if (!$('#categories').is(':visible'))
        $('#categories').slideToggle('slow', function () {});
    });

    $('.main_category').off();
    $('.main_category').longTap(function (ev) {
      if ($(this).attr('visible') === 'true')
        $(this).parent().find('.category[state="0"]').trigger('click');
      else $(this).parent().find('.category[state="1"]').trigger('click');
      $(this).css('opacity', $(this).attr('visible') === 'true' ? '1' : '0.3');
      $(this).attr(
        'visible',
        $(this).attr('visible') === 'true' ? 'false' : 'true'
      );
      return true;
    });

    let isDown = false,
      isScroll = false;
    let startX;
    let scrollLeft;

    $('.dropdown-menu').on('mousedown', function (e) {
      isDown = true;
      this.classList.add('active');
      startX = e.pageX - this.offsetLeft;
      scrollLeft = this.scrollLeft;
    });
    $('.dropdown-menu').on('mouseleave', function () {
      isDown = false;
      this.classList.remove('active');
    });
    $('.dropdown-menu').on('mouseup', function () {
      setTimeout(function () {
        isScroll = false;
      }, 100);
      isDown = false;
      this.classList.remove('active');
      return false;
    });
    $('.dropdown-menu').on('mousemove', function (e) {
      if (!isDown) return;
      isScroll = true;
      e.preventDefault();
      const x = e.pageX - this.offsetLeft;
      const walk = x - startX;
      this.scrollLeft = scrollLeft - walk;
    });

    $('#categories').on('click', function (e) {
      if (!isScroll) $('.dropdown-menu').removeClass('show');
    });

    $('.dropdown').on('hide.bs.dropdown', function (e) {
      if (!e.clickEvent) {
        // There is no `clickEvent` property in the `e` object when the `button` (or any other trigger) is clicked.
        // What we usually want to happen in such situations is to hide the dropdown so we let it hide.
        return true;
      }
      return false;
    });
  }

  OnClickCategory(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    $('#add_item').css('display', 'block');

    $('.category[state=1]').css('opacity', 0.2).attr('state', '0');
    $('.main_category').css('opacity', 0.2).attr('state', '0');

    let el = ev.target;

    $(el).attr('state', $(el).attr('state') === '1' ? '0' : '1');
    $(el).css('opacity', $(el).attr('state') === '1' ? 1 : 0.2);
    $(el)
      .closest('.dropdown-menu')
      .siblings('.main_category')
      .css('opacity', 1)
      .attr('state', '1');

    $('.menu_item').css('display', 'none');
    $('.menu_item[cat=' + $(el).attr('id') + ']').css('display', '');
    $(el)
      .siblings('.cat_cnt')
      .text($('.menu_item[cat=' + $(el).attr('id') + ']').length);
    let ar = $(el).closest('.cat_div').siblings('.cat_div').find('.cat_cnt');
    var total = 0;
    $.each(ar, function (i, item) {
      total += parseInt($(item).text());
    });
    $(el)
      .closest('.dropup')
      .children('.cat_cnt')
      .text(total + parseInt($(el).siblings('.cat_cnt').text()));

    // $(el).closest('.dropup').find('.main_category').attr('src',$(el).attr('src'))[0].scrollIntoView(true);

    // $('#menu_tabs').prepend($(el).closest('.sub_cat'));
  }
}

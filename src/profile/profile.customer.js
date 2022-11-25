'use strict';
let md5 = require('md5');
//
require('bootstrap');

$(document).on('readystatechange', function () {
  if (document.readyState !== 'complete') {
    return;
  }

  $(function () {
    window.profile_cus = new ProfileCustomer();
  });
});

class ProfileCustomer {
  constructor(tab) {
    let that = this;
    window.user = this;

    that.path = host_port;

    that.image_path = image_path;

    that.fillProfileForm(function () {
      that.items_start = that.GetProfileItems();
    });

    $('.dropdown button').text(window.parent.sets.lang);
    $('a[role=langitem]:contains(' + window.parent.sets.lang + ')').css(
      'display',
      'none'
    );
    $('a[role=langitem]').on('click', function () {
      $('#close_browser').trigger('click');
      window.parent.location.replace(
        '../customer.html?lang=' + $(this).text() + '&market=food&css=order.3'
      );
    });

    window.parent.sysdict.set_lang(window.parent.sets.lang, $('body'));

    $('#close_browser').off();
    $('#close_browser').on('click', this, function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      $('.loader', $(window.parent.document).contents()).css(
        'display',
        'block'
      );

      that.Close(() => {
        $('#profile_frame', $(window.parent.document).contents()).css(
          'display',
          'none'
        );
        $('.loader', $(window.parent.document).contents()).css(
          'display',
          'none'
        );
      });
    });
  }

  fillProfileForm(cb) {
    let that = this;
    let data = window.parent.user.profile;
    if (data && data.profile) {
      that.uid = data.uid;
      that.psw = data.psw;
      that.profile = data.profile;

      for (let i in data.profile) {
        if (i === 'avatar') {
          if (
            !data.profile[i].includes('http') &&
            !data.profile[i].includes('data')
          ) {
            let src = that.image_path + data.profile[i];
            $('.avatar').attr('src', src);
          } else {
            $('.avatar').attr('src', data.profile[i]);
          }
          continue;
        }
        if (i) $('input[id=' + i + ']').val(data.profile[i]);
      }
    }

    if ($('#mobile').val() || $('#email').val()) {
      $('.reg_reminder').css('display', 'none');
    }

    cb();
  }

  Close(cb) {
    $('tbody').empty();
    let items = this.GetProfileItems();
    if (md5(JSON.stringify(this.items_start)) != md5(JSON.stringify(items)))
      this.OnSubmit(cb);
    else cb();
  }

  GetProfileItems() {
    let that = this;

    let profile = {};
    let arrInp = $('input').toArray();
    for (let i in arrInp) {
      if ($(arrInp[i]).attr('type') === 'file') {
        if ($(arrInp[i]).siblings('img').attr('src').includes('http')) {
          if (that.profile && that.profile.avatar)
            profile['avatar'] = that.profile.avatar;
        } else profile['avatar'] = $(arrInp[i]).siblings('img').attr('src');
      } else profile[arrInp[i].id] = $(arrInp[i]).val();
    }
    return profile;
  }

  OnSubmit(cb) {
    let that = this;
    try {
      let func = 'confirmem';
      if (window.parent.user.psw) {
        func = 'updprofile';
      }

      let data_post = {
        proj: 'd2d',
        user: window.parent.user.constructor.name,
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
    } catch (ex) {}

    cb();
  }
}

//////////////////
// WEBPACK FOOTER
// ./src/profile/profile.customer.js
// module id = 774
// module chunks = 9

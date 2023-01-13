export { CustomerSettings };

import { Сетка } from '../../network';

import { Utils } from '../utils/utils';
let utils = new Utils();

class CustomerSettings {
  constructor(db) {
    this.db = db;
  }

  Open() {
    const that = this;
    this.network = new Сетка(host_port);
    that.fillForm();

    $('.submit').on('click', this, function (ev) {
      let form = $('form');
      ev.data.OnSubmit(form);
      $('.loader', $(window.parent.document).contents()).css(
        'display',
        'block'
      );
    });

    $('input').on('change', function (ev) {
      $(this).attr('changed', true);
    });
  }

  fillForm() {
    this.db.GetSettings(function (data) {
      if (data[0] && data[0].profile)
        for (let i in data[0].profile) {
          if (i === 'avatar') {
            $('.avatar').attr('src', data[0].profile[i]);
            continue;
          }
          if (i) $('input[id=' + i + ']').val(data[0].profile[i]);
        }
    });
  }

  Close() {
    let items = this.GetProfileItems();
  }

  GetProfileItems() {
    const that = this;
    $('.tab-pane').each(function (i, tab) {
      if ($(tab).attr('id') === 'profile') {
        that.db.GetSettings(function (data) {
          let profile = data[0].profile;
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
          that.db.SetObject('setStore', data[0], function (res) {});
        });
      }
    });
  }

  OnSubmit(form) {
    const that = this;

    let k = 50 / $(form).find('.avatar').height();
    utils.createThumb_1(
      $('.avatar')[0],
      $('.avatar').width() * k,
      $('.avatar').height() * k,
      function (avatar) {
        var data_post = {
          proj: 'd2d',
          user: 'Customer',
          func: 'confirmem',
          host: location.origin,
          profile: {
            avatar: avatar.src,
            lang: $('html').attr('lang'),
            email: urlencode.encode($(form).find('#email').val().toLowerCase()),
            name: $(form).find('#name').val(),
            address: $(form).find('#address').val(),
            mobile: $(form).find('#mobile').val(),
          },
        };

        this.network.SendMessage(data_post, function (res) {
          delete data_post.proj;
          delete data_post.func;
          that.db.GetSettings(function (obj) {
            obj[0].profile = data_post;
            that.db.SetObject('setStore', obj[0], function (res) {
              alert(
                'На указанный вами email-адрес была выслана ссылка для входа в программу'
              );
            });
          });
        });
      }
    );
  }
}

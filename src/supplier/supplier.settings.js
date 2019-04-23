'use strict'

export {SupplierSettings}


import {DB} from "../map/storage/db";
import 'bootstrap';

import {Utils} from "../utils/utils";
let utils = new Utils();


$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        $('.alert').text('В этом браузере нет поддержки EventSource.').addClass('show');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }

    // parent
    window.alert = function (text) {
        $(".alert h4").text(text);
        $(".alert").removeClass("in").show();
        $(".alert").delay(200).addClass("in").fadeOut(3000);
    }
});

class SupplierSettings {
    constructor(){

        // this.network = new Network(host_port);
        //this.fillForm();
        $('input[type="submit"]').on('click', this, function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            let form = $('.form');
            ev.data.OnSubmit(form);
        });
        // $('.avatar').attr('src',location.origin+'/door2door/dist/images/avatar_2x.png');
    }

    Open() {
        let that = this;

        $('input').on('change', function (ev) {
           $(this).attr('changed', true);
        });
    }

    OnSubmit(form){
        var urlencode = require('urlencode');
        let that = this;
        console.log('OnSubmit');
        let k = 200/  $(form).find('.avatar').height();
        utils.createThumb_1($('.avatar')[0],$('.avatar').width()*k, $('.avatar').height()*k, function (avatar) {
            k = 50/  $(form).find('.avatar').height();
            utils.createThumb_1($('.avatar')[0],$('.avatar').width()*k, $('.avatar').height()*k, function (thmb) {
            var data_post = {
                proj: 'd2d',
                user: "Supplier",
                func: 'confirmem',
                host: location.origin.replace('https://','http://'),
                promo: $(form).find('#promo').val(),
                profile: {
                    type: 'marketer',
                    avatar:avatar.src,
                    thmb: thmb.src,
                    email: $(form).find('#email').val(),
                    name: $(form).find('#name').val(),
                    place: $(form).find('#place').val(),
                    mobile: $(form).find('#mobile').val(),
                    lang: $('html').attr('lang')
                }
            }

                $.ajax({
                    url: host_port,
                    type: "POST",
                    contentType: 'application/x-www-form-urlencoded',
                    crossDomain: true,
                    data: JSON.stringify(data_post),
                    dataType: "json",
                    success: function (obj) {
                        if (obj.err) {
                            alert(obj.err);
                            return true;
                        }
                        delete data_post.proj;
                        delete data_post.func;
                        delete data_post.profile.email;
                        delete data_post.host;
                        data_post.profile.avatar = obj.avatar;
                        data_post.profile.thmb = obj.thmb;
                        window.db = new DB('Supplier', function () {
                            window.db.SetObject('setStore', {uid: obj.uid, psw: obj.psw, profile: data_post.profile}, function (res) {
                                alert('На указанный email-адрес была выслана ссылка для входа в программу');
                            });
                        });
                    },
                    error: function (xhr, status) {
                        setTimeout(function () {
                            that.OnSubmit(form)
                        },500);
                        console.log("error");
                    }
                });

        });
    });
    }

    fillForm(){
        window.db.GetSettings(function (data) {
            if(data[0])
                for(let i in data[0].profile){
                    if(i==='avatar'){
                        $('.avatar').attr('src',data[0].profile[i]);
                        continue;
                    }
                    if(i)
                        $('input[id='+i+']').val(data[0].profile[i]);
                }
        });

    }

    Close() {
        let items = this.GetProfileItems();
    }

    GetProfileItems(){
        let that  = this;
        $('.tab-pane').each(function (i, tab) {
            if($(tab).attr('id')==='profile') {
                that.db.GetSettings(function (data) {
                    let profile = data[0].profile;
                    $(tab).find('input[changed]').each(function (index, inp) {
                        if($(this).attr('type')==='file'){
                            profile['avatar'] = $(this).siblings('img').attr('src');
                            return;
                        }
                        profile[inp.id] = $(inp).val();
                    });
                    data[0]['profile'] = profile;
                    that.db.SetObject('setStore', data[0], function (res) {
                        
                    });
                });

            }
        });
    }

}

$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        alert('В этом браузере нет поддержки EventSource.');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }
    // parent

    window.cs = new SupplierSettings();


    var readURL = function(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $('.avatar').attr('src', e.target.result);
                $('.avatar').siblings('input:file').attr('changed',true);
            }
            reader.readAsDataURL(input.files[0]);
        }
    }


    $(".file-upload").on('change', function(){
        readURL(this);
    });
});


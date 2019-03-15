'use strict'

export {DeliverSettings}

require('jquery-ui')
import {DB} from "../map/storage/db"

import 'bootstrap'
import {Network} from "../../network";

$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        alert('В этом браузере нет поддержки EventSource.');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }
    // parent

    window.db = new DB('Deliver', function () {
        window.ds = new DeliverSettings(window.db);
    });

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

class DeliverSettings {
    constructor(db){
        this.db = db;
        this.network = new Network(host_port);
        this.fillForm();
        $('.submit').on('click', this, function (ev) {
            let form = $('.form');
            ev.data.OnSubmit(form);
        });
    }

    Open() {
        let that = this;

        $('input').on('change', function (ev) {
           $(this).attr('changed', true);
        });
    }

    OnSubmit(form){
        let that = this;

        var data_post ={
            proj:'d2d',
            user:"Deliver",
            func:'confirmem',
            type:'deliver',
            host:location.origin,
            //avatar:$(form).find('.avatar').attr('src'),
            lang: $('html').attr('lang'),
            email:$(form).find('#email').val(),
            name:$(form).find('#name').val(),
            address:$(form).find('#address').val(),
            mobile:$(form).find('#mobile').val(),
            promo:$(form).find('#promo').val()
        }

        this.network.postRequest(data_post, function (obj) {
            if(obj.err || obj.code){
                alert(obj.err+obj.code);
                return;
            }
            delete data_post.proj; delete data_post.func; delete data_post.email;
            that.db.SetObject('setStore',{uid:obj.uid,psw:obj.psw,profile: data_post}, function (res) {
                alert('На указанный email-адрес была выслана ссылка для входа в программу');
                window.location.replace("../dist/deliver.html?lang="+data_post.lang);
            });
        });
    }

    fillForm(){
        this.db.GetSettings(function (data) {
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


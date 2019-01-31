'use strict'

export {SupplierSettings}

require('jquery-ui')
import {Network} from "../../network";



class SupplierSettings {
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
            proj:$(form).find('#proj').val(),
            user:"Supplier",
            func:$(form).find('#func').val(),
            avatar:$(form).find('.avatar').attr('src'),
            lang: $('html').attr('lang'),
            email:$(form).find('#email').val(),
            name:$(form).find('#name').val(),
            address:$(form).find('#address').val(),
            mobile:$(form).find('#mobile').val()
        }

        this.network.postRequest(data_post, function (obj) {
            delete data_post.proj; delete data_post.func;
            that.db.SetObject('setStore',{uid:obj.uid,psw:obj.psw,profile: data_post}, function (res) {
                alert('На указанный вами email-адрес была выслана ссылка для входа в программу');
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


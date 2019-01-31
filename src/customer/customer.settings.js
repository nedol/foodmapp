export {CustomerSettings}

import {Network} from "../../network";

class CustomerSettings {
    constructor(db){
        this.db = db;

    }

    Open() {
        let that = this;
        this.network = new Network(host_port);
        that.fillForm();

        $('.submit').on('click', this, function (ev) {
            let form = $('.form');
            ev.data.OnSubmit(form);
        });

        $('input').on('change', function (ev) {
           $(this).attr('changed', true);
        });
    }

    fillForm(){
        this.db.GetSettings(function (data) {
            if(data[0] && data[0].profile)
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

    OnSubmit(form){
        let that = this;

        var data_post ={
            proj:$(form).find('#proj').val(),
            user:"Customer",
            func:$(form).find('#func').val(),
            avatar:$(form).find('.avatar').attr('src'),
            lang: $('html').attr('lang'),
            email:$(form).find('#email').val(),
            name:$(form).find('#name').val(),
            address:$(form).find('#address').val(),
            mobile:$(form).find('#mobile').val()
        }

        this.network.postRequest(data_post, function (res) {
            delete data_post.proj; delete data_post.func;
            that.db.GetSettings(function (obj) {
                obj[0].profile = data_post;
                that.db.SetObject('setStore',obj[0], function (res) {
                    alert('На указанный вами email-адрес была выслана ссылка для входа в программу');
                });
            });

        });
    }
}


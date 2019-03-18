'use strict'

export {SupplierSettings}

require('jquery-ui')
import {Network} from "../../network";
import {Utils} from "../utils/utils";
let utils = new Utils();


class SupplierSettings {
    constructor(db){
        this.db = db;
        this.network = new Network(host_port);
        this.fillForm();
        $(document).on('submit', this, function (ev) {
            let form = $('.form');
            ev.data.OnSubmit(form);
            return false;
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
        let that = this;
        let k = 50/  $(form).find('.avatar').height();
        utils.createThumb_1($('.avatar')[0],$('.avatar').width()*k, $('.avatar').height()*k, function (thmb) {

            var data_post = {
                proj: 'd2d',
                user: "Supplier",
                func: 'confirmem',
                host: location.origin,
                promo: $(form).find('#promo').val(),
                profile: {
                    type: 'marketer',
                    avatar: $(form).find('.avatar').attr('src'),
                    thmb: thmb.src,
                    email: $(form).find('#email').val(),
                    name: $(form).find('#name').val(),
                    place: $(form).find('#place').val(),
                    mobile: $(form).find('#mobile').val(),
                    lang: $('html').attr('lang')
                }
            }

            that.network.postRequest(data_post, function (obj) {
                if (obj.err) {
                    alert(obj.err);
                    return;
                }
                delete data_post.proj;
                delete data_post.func;
                delete data_post.profile.email;
                delete data_post.host;

                that.db.SetObject('setStore', {uid: obj.uid, psw: obj.psw, profile: data_post.profile}, function (res) {
                    alert('На указанный email-адрес была выслана ссылка для входа в программу');
                });
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


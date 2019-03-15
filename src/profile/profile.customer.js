'use strict'

require('bootstrap');
require('webpack-jquery-ui/draggable');
require('jquery-ui-touch-punch');
import {Dict} from '../dict/dict.js';

import {Utils} from "../utils/utils";
let utils = new Utils();

window.InitProfileUser = function (obj, avatar) {

    window.profile_cus = new ProfileCustomer();

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
}



class ProfileCustomer{
    constructor(){
        let that = this;
        that.fillProfileForm();

        that.InitUserOrders();

        $('.submit').on('click', this, function (ev) {
            ev.data.OnSubmit();
        });

        $('input').on('change', function (ev) {
            $(this).attr('changed', true);
        });

    }

    MakeDraggable(el){
        $(el).draggable({
            start: function (ev) {
                console.log("drag start");

            },
            drag: function (ev) {
                //$(el).attr('drag', true);

            },
            stop: function (ev) {

                // var rel_x = parseInt($(el).position().left / window.innerWidth * 100);
                // $(el).css('right', rel_x + '%');
                // var rel_y = parseInt($(el).position().top / window.innerHeight * 100);
                // $(el).css('bottom', rel_y + '%');
            }
        });
    }

    fillProfileForm(){
        let that = this;
        window.parent.db.GetSettings(function (data) {
            if(data[0] && data[0].profile) {
                that.uid = data[0].uid;
                that.psw = data[0].psw;
                that.profile = data[0].profile;

                for (let i in data[0].profile) {
                    if (i === 'avatar') {
                        $('.avatar').attr('src', data[0].profile[i]);
                        continue;
                    }
                    if (i)
                        $('input[id=' + i + ']').val(data[0].profile[i]);
                }
            }
        });

    }

    Close() {
        let items = this.GetProfileItems();
        return this.OnSubmit();
    }

    GetProfileItems(){
        let that  = this;
        $('.tab-pane').each(function (i, tab) {
            if($(tab).attr('id')==='profile') {
                window.parent.db.GetSettings(function (data) {
                    let profile= '';
                    if(!data[0].profile)
                        profile = {};
                    else
                        profile = data[0].profile;
                    $(tab).find('input[changed]').each(function (index, inp) {
                        if($(this).attr('type')==='file'){
                            profile['avatar'] = $(this).siblings('img').attr('src');
                            return;
                        }
                        profile[inp.id] = $(inp).val();
                    });
                    // data[0]['profile'] = profile;
                    // window.parent.db.SetObject('setStore', data[0], function (res) {
                    //
                    // });
                });
            }else if($(tab).attr('id')==='orders'){
                that.SaveOrderItems();
            }
        });
    }

    OnSubmit(){
        let that = this;

        let k = 50/ $('.avatar').height();
        utils.createThumb_1($('.avatar')[0],$('.avatar').width()*k, $('.avatar').height()*k, function (thmb) {

            let form = $('.tab-content');
            let data_post = {
                proj: $(form).find('#proj').val(),
                host: location.origin,
                user: "Customer",
                func: "confirmem",
                uid: window.parent.user.uid,
                psw: window.parent.user.psw,
                profile: {
                    user:'customer',
                    email: $('#email').val(),
                    avatar: $('.avatar').attr('src'),
                    thmb: thmb.src,
                    lang: $('html').attr('lang'),
                    name: $('#name').val(),
                    mobile: $('#mobile').val(),
                    address: $('#address').val()
                }
            }

            try {
                window.parent.network.postRequest(data_post, function (res) {

                    delete data_post.proj;
                    delete data_post.func;
                    delete data_post.uid;
                    delete data_post.host;
                    if (!res.err) {
                        window.parent.db.GetSettings(function (obj) {
                            if (!obj[0])
                                obj[0] = {};
                            else {
                                if ((!obj[0].profile || !obj[0].profile.email) && data_post.profile.email) {

                                    delete data_post.profile.email;
                                    alert('На указанный вами email-адрес была выслана ссылка для входа в программу');
                                }
                            }

                            if (res.psw)
                                obj[0].psw = res.psw;
                            obj[0].profile = data_post.profile;

                            window.parent.db.SetObject('setStore', obj[0], function (res) {

                            });

                            return true;
                        });
                    } else {
                        alert(res.err);
                    }

                });
            }
            catch
                (ex) {

            }
        });


        return true;
    }

    InitUserOrders(){
        let that = this;
        window.parent.db.GetCusOrders(window.parent.user.date, function (res) {
            for(let i in res){
                let order = res[i];

                for(let item in order.data) {
                    let ovc = $(window.parent.menu_item_tmplt).clone();

                    window.parent.db.getSupplier(new Date(window.parent.user.date), order.supuid,function (res) {
                        if(res!=-1) {
                            let dict = new Dict(res.dict.dict);
                            dict.set_lang(window.parent.sets.lang, ovc[0]);
                        }
                    });
                    $(ovc).attr('id', 'ovc'+ '_' + i);
                    $(ovc).css('display','block');
                    $(ovc).addClass('menu_item');
                    $(ovc).attr('order',item);
                    $(ovc).find('.supuid').val(order.supuid);
                    $(ovc).find('.item_title').text(item);
                    $(ovc).find('.item_title').attr('contenteditable', 'false');
                    $(ovc).find('.item_price').text(order.data[item].price);
                    $(ovc).find('.item_price').attr('contenteditable', 'false');
                    $(ovc).find('.period_div').css('visibility', 'visible');
                    $(ovc).find('.approved').css('visibility', 'hidden');
                    $(ovc).find('.ordperiod').text(order.period);
                    if(item){
                        $(ovc).find('.item_title').attr('data-translate', item);
                    }
                    $(ovc).find('.amount').text(order.data[item].qnty);
                    $(ovc).find('.pack_container').css('visibility','visible');
                    $(ovc).find('.item_pack').text(order.data[item].pack);
                    $(ovc).find('li>a[role=packitem]').on('click', {that: that, off:order.data[item]},function(ev){
                        that.changed = true;
                        let pl = ev.data.off.packlist;
                        $(ovc).find('.item_pack').text($(ev.target).text());
                        $(ovc).find('.item_price').text(pl[$(ev.target).text()]);
                    });
                    $('.ord_container').append(ovc);

                }
            }
        });
    }

    SaveOrderItems(){
        $('.menu_item').each(function (i,ovc) {

            window.parent.db.GetOrder(
                window.parent.user.date,
                $(ovc).find('.supuid').val(),
                window.parent.user.uid, function (res) {
                    if(res!==-1){
                        res.data[$(ovc).attr('order')].qnty = parseInt($(ovc).find('.amount').text());
                        window.parent.db.SetObject('orderStore', res,function (res) {

                        })
                    }
                });
        });
    }


}
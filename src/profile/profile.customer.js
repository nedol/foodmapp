'use strict'

require('bootstrap');
require('webpack-jquery-ui/draggable');
require('jquery-ui-touch-punch');
import {Dict} from '../dict/dict.js';


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
        this.OnSubmit();
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
                    data[0]['profile'] = profile;
                    window.parent.db.SetObject('setStore', data[0], function (res) {

                    });
                });
            }
        });
    }

    OnSubmit(){
        let that = this;
        let form = $('.tab-content');
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

        window.parent.network.postRequest(data_post, function (res) {
            delete data_post.proj; delete data_post.func;
            window.parent.db.GetSettings(function (obj) {
                obj[0].profile = data_post;
                window.parent.db.SetObject('setStore',obj[0], function (res) {
                    alert('На указанный вами email-адрес была выслана ссылка для входа в программу');
                });
            });

        });
    }

    InitUserOrders(){
        let that = this;
        window.parent.db.GetCusOrders(window.parent.user.date, function (res) {
            for(let i in res){
                let order = res[i];

                for(let item in order.data) {
                    let ovc = $(window.parent.menu_item_tmplt).clone();

                    window.parent.db.getSupplier(window.parent.user.date, '', '', order.supuid,function (res) {
                        if(res!=-1) {
                            let dict = new Dict(res.dict.dict);
                            dict.set_lang(window.parent.sets.lang, ovc[0]);
                        }
                    });
                    $(ovc).attr('id', 'ovc'+ '_' + i);
                    $(ovc).css('display','block');
                    $(ovc).addClass('menu_item');
                    $(ovc).find('.item_title').attr('contenteditable', 'false');
                    $(ovc).find('.item_price').text(order.data[item].price);
                    $(ovc).find('.item_title').text(item);
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


}
'use strict'

require('bootstrap');
// require('bootstrap-select');

require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');
import 'tablesorter/dist/css/theme.default.min.css';
import {Dict} from '../dict/dict.js';

import {Utils} from "../utils/utils";
let utils = new Utils();

window.InitProfileUser = function () {

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
        try {
        let k = 50/ $('.avatar').height();
        utils.createThumb_1($('.avatar')[0],$('.avatar').width()*k, $('.avatar').height()*k, function (thmb) {

            let form = $('.tab-content');
            let data_post = {
                proj: $(form).find('#proj').val(),
                host: location.origin,
                user:'customer',
                func: "confirmem",
                uid: window.parent.user.uid,
                psw: window.parent.user.psw,
                profile: {
                    email: $('#email').val(),
                    avatar: $('.avatar').attr('src'),
                    thmb: thmb.src,
                    lang: $('html').attr('lang'),
                    name: $('#name').val(),
                    mobile: $('#mobile').val(),
                    address: $('#address').val()
                }
            }


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

        });

        }catch(ex) {

        }

        return true;
    }

    InitUserOrders(){
        let that = this;
        let date = window.parent.user.date;
        $('#menu_item_style').load('./customer/customer.frame.html #menu_item_style', function (response, status, xhr) {

        });
        window.parent.db.GetCusOrders(window.parent.user.date, function (res) {
            that.path  ="http://localhost:63342/d2d/server";
            if(host_port.includes('nedol.ru'))
                that.path = host_port;
            for(let i in res){
                let order = res[i];
                $('#menu_item_tmplt').load('./customer/customer.frame.html #menu_item_tmplt', function (response, status, xhr) {
                    let element = $(this).find('td.title');
                    let inv_period = '', inv_qnty = '', tr_class='', tr_disabled='',tr_style = '';
                    for(let item in order.data) {
                        let title = new Promise(function (resolve, reject) {
                            if (res[i].supuid) {
                                window.parent.db.GetSupplier(new Date(window.parent.user.date), res[i].supuid, function (sup) {
                                    if (res != -1) {
                                        let dict = new Dict(sup.dict.dict);
                                        resolve(element,dict.getValByKey(window.parent.sets.lang,item));
                                    }else{
                                        resolve(element,'undefined');
                                    }
                                });
                            } else {
                                resolve(element,'undefined');
                            }
                        });


                        $("<tr style='text-align: center;"+tr_style+"' "+tr_disabled+">" +
                            "<td class='tablesorter-no-sort'>"+
                            "<label  class='item_cb btn'  style='width: 4%;margin-right:20px;visibility:visible'>" +
                            "<input type='checkbox' class='checkbox-inline approve' title='"+item+"' orderdate='"+res[i].date +"' cusuid=" + res[i].cusuid + " style='display: none'>" +
                            "<i class='fa fa-square-o fa-2x'></i>" +
                            "<i class='fa fa-check-square-o fa-2x'></i>" +
                            "</label>" +
                            "</td>" +
                            "<td class='title'></td>" +
                            "<td "+ inv_qnty+">"  + order.data[item].qnty + "</td>" +
                            "<td>" + order.data[item].pack + "</td>" +
                            "<td class='marketer'>" + order.data[item].price + "</td>" +
                            "<td>"+order.address+"</td>" +
                            "<td "+inv_period+">" + order.period + "</td>" +
                            "<td class='tablesorter-no-sort'>"+
                            (order.comment?"<span class='tacomment'>" + order.comment + "</span>":'') +
                            "</td>"+
                            "<td  class='marketer'>" +
                            //      "<script src=\"https://nedol.ru/rtc/common.js\"></script>" +
                            //      "<script src=\"https://nedol.ru/rtc/host.js\"></script>" +
                            //      "<script src=\"https://nedol.ru/rtc/loader.js\"></script>" +
                            //      "<object   abonent=\"nedol@narod.ru\" components=\"audio browser video\"></object>" +
                            "</td>" +
                            "</tr>").appendTo($('tbody'));

                        title.then(function(el,value) {
                            $(el).text(value);
                        });

                        window.parent.db.GetApproved(new Date(date), window.parent.user.uid,res[i].cusuid, item,function (appr) {
                            if(appr && appr.data.qnty===res[i].data[item].qnty &&
                                appr.data.price===res[i].data[item].price) {
                                $(".approve[title='" + item + "'][cusuid=" + res[i].cusuid + "]").attr('checked', 'checked');
                                $(".approve[title='" + item + "'][cusuid=" + res[i].cusuid + "]").attr('disabled', 'true');
                            }
                        });



                    }
                });
            }
        });
    }

    SaveOrderItems(){
        $('.menu_item').each(function (i,ovc) {

            window.parent.db.GetOrder(
                window.parent.user.date,
                $(ovc).attr('supuid'),
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
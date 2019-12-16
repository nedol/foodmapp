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
    constructor(tab){
        let that = this;
        window.user = this;

        that.InitUserOrders();
        that.fillProfileForm();

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
                    data[0]['profile'] = profile;
                    window.parent.db.SetObject('setStore', data[0], function (res) {

                    });
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

        let form = $('.tab-content');
        let data_post = {
            proj: $(form).find('#proj').val(),
            host: location.origin,
            user: 'customer',
            func: "confirmem",
            uid: window.parent.user.uid,
            psw: window.parent.user.psw,
            profile: {
                email: $('#email').val(),
                avatar: $('.avatar').attr('src'),
                lang: $('html').attr('lang'),
                name: $('#name').val(),
                mobile: $('#mobile').val(),
                address: $('#address').val()
            }
        }

        window.parent.user.profile.profile  = data_post.profile;
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



        }catch(ex) {

        }

        return true;
    }

    InitUserOrders(tab_active){
        let that = this;
        let date = window.parent.user.date;
        $('#menu_item_style').load('./customer/customer.frame.html #menu_item_style', function (response, status, xhr) {

        });

        that.path  ="http://localhost:63342/d2d/server";
        if(host_port.includes('nedol.ru'))
            that.path = host_port;

        window.parent.db.GetCusOrders(window.parent.user.date,(res)=> {
            window.parent.user.orders = res;

            for(let i in window.parent.user.orders){
                let order = window.parent.user.orders[i];
                let dict;
                $('#menu_item_tmplt').load('./customer/customer.frame.html #menu_item_tmplt', function (response, status, xhr) {
                    let element = $(that).find('td.title');
                    let inv_period = '', inv_qnty = '', tr_class='', tr_disabled='',tr_style = '';

                    for(let item in order.data) {

                        if (order.supuid) {
                            window.parent.db.GetSupplier(new Date(window.parent.user.date), order.supuid, function (sup) {
                                if (sup != -1) {
                                    dict = new Dict(sup.dict.dict);
                                    $('td[data-translate="'+item+'"]').text(dict.getValByKey(window.parent.sets.lang,item));
                                    if(sup.profile.place) {
                                        $('td[data-translate="' + item + '"]').siblings('.address').find('.place').text(sup.profile.place);
                                        $('td[data-translate="' + item + '"]').siblings('.address').find('.delivery').text("самовывоз");

                                    }
                                }
                            });
                        }


                        $("<tr style='text-align: center;"+tr_style+"' "+tr_disabled+">" +
                            "<td class='tablesorter-no-sort'>"+
                                "<label  class='item_cb btn'  style='width: 4%;margin-right:20px;visibility:visible'>" +
                                "<input type='checkbox' class='checkbox-inline approve'  title='"+item+"' orderdate='"+order.date +"' cusuid=" + order.cusuid + " style='display: none'>" +
                                "<i class='fa fa-square-o fa-2x'></i>" +
                                "<i class='fa fa-check-square-o fa-2x'></i>" +
                                "</label>" +
                            "</td>" +
                            "<td class='title' data-translate="+item+"></td>" +
                            "<td>" + order.data[item].pack + "</td>" +
                            "<td "+ inv_qnty+">"  + order.data[item].qnty + "</td>" +
                            "<td class='marketer'>" + order.data[item].price *order.data[item].qnty + "</td>" +
                            "<td  class='address'><a class='delivery'>доставка</a><br><a class='place'>"+order.address+"</a></td>" +
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
                            "<td  class='trash'>" +
                            "<i class='fa fa-trash fa-2x' onclick='window.user.DeleteOrder(this,\""+order.date+"\",\""+item+"\")'></i>"+
                            "</td>" +
                            "</tr>").appendTo($('tbody'));


                        window.parent.db.GetApproved(new Date(date), order.supuid,order.cusuid, item,function (appr) {
                            if(appr && appr.data.qnty===order.data[item].qnty &&
                                appr.data.price===order.data[item].price) {
                                $(".approve[title='" + item + "'][cusuid=" + order.cusuid + "]").prop('checked','checked');
                                $(".approve[title='" + item + "'][cusuid=" + order.cusuid + "]").attr('disabled', 'true');
                            }
                        });
                    }
                });
            }

        });

    }

    DeleteOrder(el,date, title) {

        if(confirm("Удалить из заказа?")){
            window.parent.user.DeleteOrder(date, title,function () {
                $(el).closest('tr').remove();
            });
        }
    }

    SaveOrderItems(){

        for(let o in window.parent.user.orders) {
            let order = window.parent.user.orders[o];
            for(let p in order.data) {
                if ($('input[title="' + p + '"]').length > 0) {
                    window.parent.db.SetObject('orderStore', order, function (res) {

                    });
                }else{
                    delete order.data[p];
                    window.parent.db.SetObject('orderStore', order, function (res) {

                    });
                }
            }
        }

        window.parent.user.SetOrdCnt();


    }


}


//////////////////
// WEBPACK FOOTER
// ./src/profile/profile.customer.js
// module id = 774
// module chunks = 9
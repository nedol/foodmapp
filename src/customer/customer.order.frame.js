'use strict'


require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');

require('bootstrap');
// require('bootstrap-select');
require("../../lib/bootstrap-rating/bootstrap-rating.js")
require("../../lib/jquery-comments-master/js/jquery-comments.js");

import {Dict} from '../dict/dict.js';
import proj from 'ol/proj';
import comment_obj from "../../dist/assets/vendor/jquery-comments/params.json";

import {Utils} from "../utils/utils";

import {CustomerOrderFrameEditor} from './customer.order.frame.editor.js';

let utils = new Utils();

var moment = require('moment/moment');

import * as _ from 'lodash';


$(window).on('load', () => {
    let iOSdevice = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)
    if (iOSdevice)
        $('[role="tablist"] .nav-link').each((i,e) => {
            if (!$(e).attr('href'))
                $(e).attr('href', $(e).data('target'))
        });

});

$(document).on('readystatechange', function () {

    if (document.readyState !== 'complete') {
        return;
    }

    // if(window.parent && window.parent.sets.css)
    //     $('#cus_link').attr('href', '../css/' + window.parent.sets.css+'.css?v='+window.parent.v);


    window.InitCustomerOrder = function (data, targ_title) {

        window.order = new CustomerOrder();

        window.order.dict = new Dict(data.dict.dict);
        window.order.editor.dict = window.order.dict;
        window.order.editor.openFrame(data,targ_title, function () {

        });


        window.order.FillProfile(data);

        window.order.InitRating();
    };

});



export class CustomerOrder{
    constructor(){

        this.path = 'https://delivery-angels.ru/server/';

        this.editor = new CustomerOrderFrameEditor();
        this.editor.path = this.path;

        // this.ovc.find('.nav-link').on('click touchstart', function (ev) {
        //     // $('#sup_profile_container').css('display','block');
        //     let href = $(this).attr('href');
        //     $(href).css('display','block');
        //
        //     href = $(this).closest('.nav').find('.active').attr('href');
        //
        //     $(href).css('display','none');
        // });
    }


    onClickImage(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        let mi = $(ev.data);
        $(mi).find('.img-fluid').attr('src',this.src);
        return true;
    };

    FillProfile(obj){
        let profile = obj.profile;

        this.InitSupplierReview(obj);

        if(profile.type ==='deliver') {
            $('#sup_delivery').closest('div').css('display', 'block');
            if(obj.profile.del_price_per_dist)
                $('#sup_delivery').val({'ru':'стоимость доставки ' ,'en': 'delivery cost ','fr':' lieferpreis prix '}[window.parent.sets.lang]+obj.profile.del_price_per_dist);
            if(obj.profile.del_no_less_than) {
                $('#sup_delivery').val($('#sup_delivery').val() + '\n\r' + {
                    'ru': 'сумма заказа не менее ',
                    'en': 'order cost no less ',
                    'fr': ' le coût de la commande n\'est pas inférieur à  '
                }[window.parent.sets.lang] + obj.profile.del_no_less_than);
            }
            $('#sup_delivery').val($('#sup_delivery').val()+'\n\r'+profile.delivery);
        }

        $('input').attr('title', '');
        $('#sup_name').val(profile.name);
        $('#sup_email').val(profile.email);
        $('#sup_mobile').val(profile.mobile);
        $('#sup_address').val(profile.address);
        $('#sup_place').val(profile.place);
        $('#sup_worktime').val(profile.worktime);
    }

    InitSupplierReview(sup){
        let par = {
            proj: "d2d",
            user: window.parent.user.constructor.name.toLowerCase(),
            func: 'getcomments',
            supuid: sup.supuid,
            readOnly:(sup.appr && sup.appr.cusuid===window.parent.user.uid)?false:true,
            profilePictureURL: this.path+'images/'+sup.profile.avatar,
            enableEditing: true,
            enableDeleting:false,
            enableReplying: false,
            maxRepliesVisible: 5
        }
        Object.assign(par,comment_obj.user[window.parent.sets.lang]);
        this.InitProfileSupplier({supplier:sup,user:'Customer'},par);
    }

    InitProfileSupplier(user, settings) {

        this.InitComments(user, settings);
        // this.profile_sup.InitRateSupplier();

        if(!user.supplier.profile.avatar) {
            utils.LoadImage("https://delivery-angels.ru/d2d/dist/images/avatar_2x.png", function (src) {
                $('#sup_avatar').attr('src', src);
            });
        }else{
            $('#sup_avatar').attr('src', this.path+'images/'+user.supplier.profile.avatar);
            $('#profile_img').attr('src', this.path+'images/'+user.supplier.profile.avatar);
        }

        $('input').prop( "readonly", false );

    }

    InitComments(obj, settings){
        let this_obj = obj;
        $('img.avatar').attr('src', settings.profilePictureURL);
        //settings.profilePictureURL = this.path+'/images/'+this.profile.avatar;
        $('#comments-container').comments(Object.assign(settings,{
            getComments: function(success, error) {
                let par = {
                    proj:'d2d',
                    user:window.parent.user.constructor.name.toLowerCase(),
                    func:'getcomments',
                    supuid:obj.supplier.uid
                }
                window.parent.network.SendMessage(par, function (data) {
                    var commentsArray = [];
                    if(data.resAr && data.resAr.length>0 ) {
                        for(let i in data.resAr) {
                            let com = data.resAr[i].data;
                            commentsArray.push(com);
                        }
                    }
                    success(commentsArray);
                })
            },
            postComment: function(data, success, error) {
                if(window.parent.user.profile && window.parent.user.profile.name) {
                    data['fullname'] = window.parent.user.profile.name;
                }else if(window.parent.user.email){
                    data['fullname'] = window.parent.user.email.split('@')[0];
                }else {
                    data['fullname'] = 'Покупатель';
                }

                data['created_by_current_user'] = false;
                let par = {
                    proj:'d2d',
                    user:window.parent.user.constructor.name.toLowerCase(),
                    func:'setcomments',
                    supuid: this_obj.supplier.uid,
                    cusuid:window.parent.user.uid,
                    data:data
                }
                window.parent.network.SendMessage(par, function (res) {
                    if(!res.err) {
                        data['created_by_current_user'] = true;
                        success(saveComment(data));
                    }
                });
            },
            putComment: function(data, success, error) {
                data['created_by_current_user'] = false;
                let par = {
                    proj:'d2d',
                    user: window.parent.user.constructor.name.toLowerCase(),
                    func:'setcomments',
                    supuid:this_obj.supplier.supuid,
                    cusuid:window.parent.user.uid,
                    data:data
                }
                window.parent.network.SendMessage(par, function (res) {
                    data['created_by_current_user'] = true;
                    success(saveComment(data));
                });
            },
            deleteComment: function(commentJSON, success, error) {

            }

        }));
        let usersArray;
        let saveComment = function(data) {

            // Convert pings to human readable format
            $(data.pings).each(function(index, id) {
                var user = usersArray.filter(function(user){return user.id == id})[0];
                data.content = data.content.replace('@' + id, '@' + user.fullname);
            });

            return data;
        }

    }

    InitRating() {
        let that = this;
        let data_obj = {
            proj: "d2d",
            user:window.parent.user.constructor.name.toLowerCase(),
            func: "getrating",
            supuid: this.uid
        }
        window.parent.network.SendMessage(data_obj, function (data) {
            if (data && data.rating) {
                $('.rating').rating('rate', data.rating);
                that.InitRateSupplier();
            }
        });


    }

    InitRateSupplier(){
        let that = this;

        $('input.rating').on('change', function (ev) {
            let data_obj ={
                proj:"d2d",
                user: window.parent.user.constructor.name.toLowerCase(),
                func:"ratesup",
                cusuid: window.parent.user.uid,
                psw: window.parent.user.psw,
                supuid: that.uid,
                value: $('.rating').val()
            }
            window.parent.network.SendMessage(data_obj, function (data) {
                if(data.rating)
                    $('.rating').rating('rate',data.rating);
            });
        });
    }

}


//////////////////
// WEBPACK FOOTER
// ./src/customer/customer.order.frame.js
// module id = 738
// module chunks = 3


//////////////////
// WEBPACK FOOTER
// ./src/customer/customer.order.frame.js
// module id = 750
// module chunks = 3
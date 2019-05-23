'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');
require("../../lib/jquery-comments-master/js/jquery-comments.js")
require("../../lib/bootstrap-rating/bootstrap-rating.min.js")


// global.jQuery = require('jquery');

import {Utils} from "../utils/utils";
let utils = new Utils();

window.InitProfileSupplier = function (user, settings) {

    window.profile_sup = new ProfileSupplier();
    //window.profile_sup.InitComments(user, settings);
    window.profile_sup.InitRateSupplier();
    //window.profile_sup.InitSettingsSupplier();

    if(user.constructor.name==='Supplier') {
        if(!user.profile.profile.avatar) {
            utils.LoadImage("https://nedol.ru/d2d/dist/images/avatar_2x.png", function (src) {
                $('.avatar').attr('src', src);
            });
        }else{
            $('.avatar').attr('src', user.profile.profile.avatar);
        }
        $('img.avatar').after("<h6>Загрузить мою фотографию...</h6>");
        $('img.avatar').on('click',function (ev) {
            $(this).siblings('.file-upload').trigger('click');
        });
        var readURL = function (input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    $('.avatar').attr('src', e.target.result);
                    $('.avatar').on('load',function (ev) {
                        ev.preventDefault();
                        let k = 70/$(this).height();
                        utils.createThumb_1(this, $(this).width()*k, $(this).height()*k, function (thmb) {
                            $('.avatar').attr('thmb', thmb.src);
                        });
                    });
                    // $('.avatar').on('load',function (ev) {
                    //     let thmb = utils.createThumb_1($('.avatar')[0]);
                    //     $('.avatar').attr('thmb',thmb);
                    // })

                    $('.avatar').siblings('input:file').attr('changed', true);
                }
                reader.readAsDataURL(input.files[0]);
            }
        }


        $(".file-upload").on('change', function () {
            readURL(this);
        });

        $( "#period_list" ).selectable({
            stop: function() {
                let result;
                $( ".ui-selected", this ).each(function(i) {
                    let index = $( "#period_list li" ).index( this );
                    if(i===0)
                        result = $($( "#period_list li")[index]).text().split(' - ')[0];
                    if($( ".ui-selected").length===i+1)
                        result+=" - "+ $($( "#period_list li")[index]).text().split(' - ')[1];
                });
                $('.sel_period').val(result);
                $( ".sel_period ").dropdown("toggle");

            }
        });

        $('input').prop( "readonly", false );
    }
    else if(user.user==='Customer'){
        //$('input').prop( "readonly", true );
    }
}



export class ProfileSupplier{
    constructor(){
        $('#prolong').on('input', function (ev) {
            
        });
        this.changed = false;
        $('input').change(()=> {
            this.changed = true;
        });
        $('.dropdown').on('hide.bs.dropdown',()=> {
            this.changed = true;
        })
    }

    InitComments(obj, settings){

        $('img.avatar').attr('src', settings.profilePictureURL);
        settings.profilePictureURL = window.parent.user.profile.avatar;
        $('#comments-container').comments(Object.assign(settings,{
            getComments: function(success, error) {
                let par = {
                    proj:'d2d',
                    user:window.parent.user.constructor.name.toLowerCase(),
                    func:'getcomments',
                    supuid:obj.uid
                }
                window.parent.network.postRequest(par, function (data) {
                    usersArray = [
                        {
                            id: 1,
                            fullname: "Current User",
                            email: "current.user@viima.com",
                            profile_picture_url: "https://viima-app.s3.amazonaws.com/media/public/defaults/user-icon.png"
                        }];
                    success(data);
                })
            },
            postComment: function(data, success, error) {
                if(window.parent.user.profile && window.parent.user.profile.name) {
                    data['fullname'] = window.parent.user.profile.name;
                }else if(window.parent.user.email){
                    data['fullname'] = window.parent.user.email.split('@')[0];
                }else
                    data['fullname'] = 'Пользователь';

                data['created_by_current_user'] = false;
                let par = {
                    proj:'d2d',
                    user:window.parent.user.constructor.name.toLowerCase(),
                    func:'setcomments',
                    supuid:obj.supuid,
                    cusuid:obj.cusuid,
                    data:data
                }
                window.parent.network.postRequest(par, function (res) {
                    data['created_by_current_user'] = true;
                    success(saveComment(data));
                });
            },
            putComment: function(data, success, error) {
                let par = {
                    proj:'d2d',
                    user: window.parent.user.constructor.name.toLowerCase(),
                    func:'setcomments',
                    supuid:obj.supuid,
                    cusuid:obj.cusuid,
                    data:data
                }
                window.parent.network.postRequest(par, function (res) {
                    success(saveComment(data));
                });
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
        let data_obj = {
            proj: "d2d",
            user:window.parent.user.constructor.name.toLowerCase(),
            func: "getrating",
            psw: window.parent.user.psw,
            supuid: window.parent.user.uid
        }
        window.parent.network.postRequest(data_obj, function (data) {
            if (data.rating)
                $('.rating').rating('rate', data.rating);
        });
    }

    InitRateSupplier(){

        $('input.rating').on('change', function (ev) {
            let data_obj ={
                proj:"d2d",
                user: window.parent.user.constructor.name.toLowerCase(),
                func:"ratesup",
                cusuid: window.parent.user.uid,
                psw: window.parent.user.psw,
                supuid: window.parent.user.viewer.uid,
                value: $('.rating').val()
            }
            window.parent.network.postRequest(data_obj, function (data) {
                if(data.rating)
                    $('.rating').rating('rate',data.rating);
            });
        });
    }

    InitSettingsSupplier(){
        window.parent.db.GetSettings(function (obj) {
            if(obj[0].settings) {
                $('input#prolong').val(obj[0].settings.prolong);
            }
        });
    }

    SetRating(val){
        $('.rating').rating('rate',val);
    }
    SetRatingReadonly(){
        $('.rating').attr('data-readonly', 'true');
    }

    SaveProfile(uid, psw){
        let _ = require('lodash');
        let that = this;
        // if(!this.changed)//TODO:test uncomment
        //     return;
        utils.createThumb_1($('.avatar')[0],70,70,function (thmb) {

            let data_post='';
            data_post ={
                proj:'d2d',
                user:window.parent.user.constructor.name,
                func:'updprofile',
                uid: uid,
                psw: psw,
                profile: {
                    type:window.parent.user.profile.profile.type,
                    email: $('#email').val(),
                    avatar: $('.avatar').attr('src'),
                    thmb: thmb.src,
                    lang: $('html').attr('lang'),
                    name: $('#name').val(),
                    worktime: $('#worktime').val(),
                    mobile: $('#mobile').val(),
                    place: $('#place').val(),
                }
            }

            window.parent.network.postRequest(data_post, function (res) {

                window.parent.db.GetSettings( function (obj) {

                    let set = obj;//_.find(obj, {uid:window.parent.user.uid});
                    set.profile = data_post.profile;
                    window.parent.db.SetObject('setStore',set, function (res) {

                    });
                });
            });
        });

    }

}
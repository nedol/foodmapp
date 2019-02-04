'use strict'
import {DB} from "../map/storage/db"

var { Textcomplete, Textarea } = require('textcomplete');
require("../../lib/jquery-comments-master/js/jquery-comments.js")
require("../../lib/bootstrap-rating/bootstrap-rating.min.js")

require('bootstrap');

global.jQuery = require('jquery');

window.InitProfileSupplier = function (obj, settings) {

    window.profile_sup = new ProfileSupplier(window.parent.db);
    window.profile_sup.InitComments(obj, settings);
    window.profile_sup.InitRateSupplier();
    window.profile_sup.InitSettingsSupplier();

    if(obj.user==='Supplier') {
        $('img.avatar').after("<h6>Загрузить мою фотографию...</h6>");
        $('img.avatar').on('click',function (ev) {
            $(this).siblings('.file-upload').trigger('click');
        });
        var readURL = function (input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    $('.avatar').attr('src', e.target.result);
                    $('.avatar').siblings('input:file').attr('changed', true);
                }
                reader.readAsDataURL(input.files[0]);
            }
        }


        $(".file-upload").on('change', function () {
            readURL(this);
        });
    }
}



class ProfileSupplier{
    constructor(){

    }

    InitComments(obj, settings){

        $('img.avatar').attr('src', settings.profilePictureURL);
        $('#comments-container').comments(Object.assign(settings,{
            getComments: function(success, error) {
                let par = {
                    proj:'d2d',
                    user:window.parent.user.constructor.name.toLowerCase(),
                    func:'getcomments',
                    supuid:obj.supuid
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
            if(obj[0].settings)
                $('#settings').find(':input.prolong').bootstrapToggle(obj[0].settings.prolong?'on':'off')
        });
    }

    SetRating(val){
        $('.rating').rating('rate',val);
    }
    SetRatingReadonly(){
        $('.rating').attr('data-readonly', 'true');
    }

    SaveProfile(form){
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

        window.parent.network.postRequest(data_post, function (obj) {
            delete data_post.proj; delete data_post.func;
            that.db.SetObject('setStore',{uid:obj.uid,psw:obj.psw,profile: data_post}, function (res) {

            });
        });
    }


    SaveSettings(){
        let settings = {};
        $('#settings').find(':input').each(function (i,item) {
            settings[$(item).attr('class')] = $(item).prop('checked');
        });

        window.parent.db.GetSettings(function (obj) {
            obj[0].settings = settings;
            obj[0].profile.avatar = $('#profile').find('.avatar').attr('src');
            window.parent.db.SetObject('setStore',obj[0],function (res) {
                window.parent.user.profile.profile =  obj[0].profile;
            });
            let data_obj ={
                proj:"d2d",
                user: window.parent.user.constructor.name.toLowerCase(),
                func:"setsup",
                psw: window.parent.user.psw,
                uid: window.parent.user.uid
            }
            data_obj['settings'] = settings;
            data_obj['profile'] = obj[0].profile;
            window.parent.network.postRequest(data_obj, function (data) {

            });
        });

    }

}
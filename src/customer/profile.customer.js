'use strict'

require('bootstrap');
// require('bootstrap-select');
import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';

const EventSource = NativeEventSource || EventSourcePolyfill;
// OR: may also need to set as global property
window.EventSource =  NativeEventSource || EventSourcePolyfill;

import 'tablesorter/dist/css/theme.default.min.css';
// import 'tablesorter/dist/css/theme.blue.css';
// import 'tablesorter/dist/css/dragtable.mod.min.css';

require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');
// require('tablesorter/dist/js/widgets/widget-scroller.min.js');
// require('tablesorter/dist/js/extras/jquery.dragtable.mod.min.js');

import {Dict} from '../dict/dict.js';

import {Utils} from "../utils/utils";
let utils = new Utils();

window.InitProfileUser = function () {

    window.profile_cus = new ProfileCustomer();

    $(".file-upload").off();
    $(".file-upload").on('change', function(e) {
        try {
            loadImage(
                e.target.files[0],
                function (img, data) {
                    if (img.type === "error") {
                        console.error("Error loading image ");
                    } else {

                        let this_img = img.toDataURL();

                        setTimeout(function () {

                            $('.avatar').attr('src', this_img);

                            $('.avatar').siblings('input:file').attr('changed', true);
                            console.log("Original image width: ", data.originalWidth);
                            console.log("Original image height: ", data.originalHeight);
                        },200)

                    }
                },
                {
                    orientation: true,
                    maxWidth: 600,
                    maxHeight: 300,
                    minWidth: 100,
                    minHeight: 50,
                    canvas: true
                }
            );
        } catch (ex) {
            console.log(ex);
        }
    })

}



export class ProfileCustomer{
    constructor(tab){
        let that = this;
        window.user = this;

        that.path = host_port;

        that.fillProfileForm();

        $('.close_browser').off();
        $('.close_browser').on('click', this, function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            $('.loader', $(window.parent.document).contents()).css('display','block');
            that.Close(()=>{
                $('#profile_frame_div',$(window.parent.document).contents()).css('display', 'none');
                $('.loader', $(window.parent.document).contents()).css('display','none');
            });
        });

        $('input').on('change', function (ev) {
            $(this).attr('changed', true);
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
                        if(!data[0].profile[i].includes('http') && !data[0].profile[i].includes('data')) {
                            let src = that.path+'/images/' +data[0].profile[i];
                            $('.avatar').attr('src', src);
                        }else{
                            $('.avatar').attr('src',data[0].profile[i]);
                        }
                        continue;
                    }
                    if (i)
                        $('input[id=' + i + ']').val(data[0].profile[i]);
                }
            }

            if($('#mobile').val() || $('#email').val()){
                $('.reg_reminder').css('display','none');
            }
        });
    }

    Close(cb) {
        let items = this.GetProfileItems();
        $('tbody').empty();
        this.OnSubmit(cb);
    }

    GetProfileItems(){
        let that  = this;
        $('.tab-pane').each(function (i, tab) {
            if($(tab).attr('id')==='profile') {
                window.parent.db.GetSettings(function (data) {
                    let profile= '';
                    if(!data[0] && !data[0].profile)
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
                that.SaveOrderItems(function () {
                    
                });
            }
        });
    }

    OnSubmit(cb){
        let that = this;
        try {

        let func = "confirmem"
        if(window.parent.user.psw ){
            func = "updprofile"
        }

            let data_post ={
                proj:'d2d',
                user:window.parent.user.constructor.name,
                func:func,
                uid: window.parent.user.uid,
                psw: window.parent.user.psw,
                profile: {
                    email: $('#email').val(),
                    avatar: $('.avatar').attr('src'),
                    lang: $('html').attr('lang'),
                    name: $('#name').val(),
                    mobile: $('#mobile').val(),
                    place: $('#place').val(),
                }
            }

            window.parent.user.profile.profile  = data_post.profile;
            window.parent.network.SendMessage(data_post, function (res) {

                if(!res || res.length===0) {
                    return;
                }
                delete data_post.proj;
                delete data_post.func;
                delete data_post.uid;
                delete data_post.host;
                if (res && !res.err) {

                    window.parent.db.GetSettings(function (obj) {
                        if (!obj[0])
                            obj[0] = {};

                        if(res.psw)
                            obj[0].psw = res.psw;
                        else
                            obj[0].psw = data_post.psw;
                        window.parent.user.psw = obj[0].psw;
                        obj[0].profile = data_post.profile;
                        let src = res.profile.avatar;
                        if(!res.profile.avatar.includes('http') && !res.profile.avatar.includes('data')) {
                            src = that.path +'images/'+res.profile.avatar;
                        }
                        obj[0].profile.avatar = src;

                        window.parent.db.SetObject('setStore', obj[0], function (res) {

                        });

                    });
                } else {
                    alert(res.err);
                }

            });

        }catch(ex) {

        }

        cb();
    }

}


//////////////////
// WEBPACK FOOTER
// ./src/profile/profile.customer.js
// module id = 774
// module chunks = 9
'use strict'


import {Сетка} from "../../network";
import {DB} from "../map/storage/db";

import {Utils} from "../utils/utils";
let utils = new Utils();

import {Dict} from '../dict/dict.js';

$(document).on('readystatechange', function () {

    if (document.readyState !== 'complete') {
        return;
    }

    window.network = new Сетка(host_ws);

    window.cs = new SupplierSettings();

    var readURL = function(input) {
        if (input.files && input.files[0]) {

        }
    }

    $.getJSON('../../src/dict/sys.dict.json?v=2', function (data) {
        window.sysdict = new Dict(data);
        window.sysdict.set_lang( utils.getParameterByName('lang'), $('body'));
    });


    $(".file-upload").on('change', function(e){
        loadImage(
            e.target.files[0],
            function (img, data) {
                if(img.type === "error") {
                    console.error("Error loading image ");
                } else {
                    $('.avatar').attr('src', img.toDataURL());

                    $('.avatar').siblings('input:file').attr('changed',true);
                    console.log("Original image width: ", data.originalWidth);
                    console.log("Original image height: ", data.originalHeight);
                }
            },
            {
                orientation:true,
                maxWidth: 600,
                maxHeight: 300,
                minWidth: 100,
                minHeight: 50,
                canvas: true
            }
        );

    });
});



export class SupplierSettings {
    constructor(){

        // this.network = new Сетка(host_port);
        //this.fillForm();
        $('input[type="submit"]').on('click', this, function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            let form = $('form');
            ev.data.OnSubmit(form);
        });
    }

    Open() {
        let that = this;

        $('input').on('change', function (ev) {
           $(this).attr('changed', true);
        });
    }

    OnSubmit(form) {
        var urlencode = require('urlencode');
        let that = this;
        if (!$(form).find('#place').val()) {
            $(form).find('#place').focus();
            return;
        }
        if (!$(form).find('#market').val()) {
            $(form).find('#market').focus();
            return;
        }

        let k = 200 / $(form).find('.avatar').height();
        utils.createThumb_1($('.avatar')[0], $('.avatar').width() * k, $('.avatar').height() * k, function (avatar) {
            var data_post = {
                proj: 'd2d',
                user: "Supplier",
                func: 'confirmem',
                host: location.origin,
                promo: $(form).find('#promo').val(),
                profile: {
                    market: $(form).find('#market').val(),
                    type: $(':checked').val(),
                    avatar: avatar.src,
                    email: $(form).find('#email').val().toLowerCase(),
                    name: $(form).find('#name').val(),
                    place: $(form).find('#place').val(),
                    mobile: $(form).find('#mobile').val(),
                    lang: $('html').attr('lang')
                }
            }

            $('.loader').css('display', 'block');

            window.network.SendMessage(data_post, function (obj) {
                $('.loader').css('display', 'none');
                if (obj.err) {
                    alert(window.sysdict.getDictValue( utils.getParameterByName('lang'),obj.err));
                    return true;
                }
                delete data_post.proj;
                delete data_post.func;
                delete data_post.host;
                data_post.profile.avatar = obj.avatar;
                window.db = new DB('Supplier', function () {
                    //localStorage.clear();
                    window.db.ClearStore('setStore', function () {
                        window.db.SetObject('setStore', {
                            market: $(form).find('#market').val(),
                            uid: obj.uid,
                            psw: obj.psw,
                            promo: data_post.promo,
                            profile: data_post.profile
                        }, function (res) {
                            alert(window.sysdict.getValByKey($('html').attr('lang'),'1a82a60f6461f27f40b6596c09ade00d'));
                            if (window.location.hostname === 'localhost') {
                                window.location.replace("http://" + window.location.host + "/d2d/dist/supplier.html?uid=" + obj.uid + "&lang=" + $('html').attr('lang') + "&market=" + $(form).find('#market').val());
                            } else {
                                window.location.replace("../supplier.html?uid=" + obj.uid + "&lang=" + $('html').attr('lang') + "&market=" + $(form).find('#market').val());
                            }

                            obj = '';
                        });
                        window.db.ClearStore('offerStore', function () {

                            let offer = {
                                date: 'tmplt',
                                data: {}

                            };

                            window.db.SetObject('offerStore', offer, function () {

                            });
                        });

                        window.db.ClearStore('dictStore', function () {

                        });

                    });
                });

            });
        });
    }

    fillForm(){
        window.db.GetSettings(function (data) {
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

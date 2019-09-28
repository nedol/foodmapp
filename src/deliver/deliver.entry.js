'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');

import("../../lib/glyphicons/glyphicons.css");

require("../../global");

import '../../lib/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min';
import '../../lib/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css';

require('bootstrap');
require('bootstrap-select');

import {Utils} from "../utils/utils";

import {Network} from "../../network";
import {DB} from "../map/storage/db";
import {Deliver} from './deliver';
import proj from 'ol/proj';

let utils = new Utils();
window.sets.lang = utils.getParameterByName('lang');

$(window).on( "orientationchange", function( event ) {
    let scale = window.innerWidth > window.innerHeight?(window.innerHeight)/300:(window.innerWidth)/300;
    $('#datetimepicker').css('transform', 'scale('+scale+','+scale+')');
});

$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        alert('В этом браузере нет поддержки EventSource.').addClass('show');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }



    //!!! jquery polyfill
    $.ajaxPrefilter(function (options, original_Options, jqXHR) {
        options.async = true;
    });


    initDP();

    window.db = new DB('Deliver', function () {

        window.db.GetSettings(function (set) {
            var _ = require('lodash');
            let uObj = {};

            let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
            if(utils.getParameterByName('psw_hash') || !set[0]){
                toReg(function (uid, psw, data) {
                    window.location.replace(window.location.href.split('&')[0]+'&uid='+uid);
                })
            }else if(set[0]) {
                uObj['set'] = set[0];
                // window.db.DeleteObject('setStore',uObj['set'].uid);
                // return;
                window.network = new Network(host_port);

                window.user = new Deliver(uObj);
                window.user.IsAuth_test(function () {

                });
            }
        });
    });

    function toReg(cb){

        let that = this;
        let psw_hash = utils.getParameterByName('psw_hash');

        var data_post = {
            proj: 'd2d',
            user: "Deliver",
            func: 'reguser',
            host: location.origin,
            psw_hash:psw_hash,
            profile: {
                type: 'marketer',
                lang: $('html').attr('lang')
            }
        }


        $.ajax({
            url: host_port,
            type: "POST",
            // contentType: 'application/x-www-form-urlencoded',
            crossDomain: true,
            data: JSON.stringify(data_post),
            dataType: "json",
            success: function (obj) {

                if (obj.err) {
                    // alert('Mysql problem');
                    setTimeout(function () {
                        //toReg(cb)
                    },1000);
                    return true;
                }
                delete data_post.proj;
                delete data_post.func;
                delete data_post.host;
                localStorage.clear();
                let set;
                if(obj.deliver && obj.deliver[0].profile){
                    set =  {uid: obj.deliver[0].uid, psw: obj.deliver[0].psw, profile: JSON.parse(obj.deliver[0].profile)};

                }else{
                    set = {uid: obj.uid, psw: obj.psw, profile: data_post.profile};
                }

                window.db.ClearStore('setStore', function () {
                    window.db.SetObject('setStore',set, function (res) {
                        if(obj.deliver) {
                            window.db.ClearStore('offerStore', function () {
                                if (obj.deliver[0].data) {
                                    let offer = {
                                        date: 'tmplt',
                                        data: JSON.parse(obj.deliver[0].data)

                                    };
                                    window.db.SetObject('offerStore', offer, function () {

                                    });

                                    offer = {
                                        date: new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD')),
                                        data: JSON.parse(obj.deliver[0].data),
                                        location: proj.fromLonLat([obj.deliver[0].lon, obj.deliver[0].lat]),
                                    };
                                    window.db.SetObject('offerStore', offer, function () {

                                    });
                                }
                            });
                            window.db.ClearStore('dictStore', function () {
                                let dict = JSON.parse(obj.deliver[0].dict).dict;
                                if (dict) {
                                    recursDict(dict, Object.keys(dict), 0, set, cb);
                                }
                            });
                        }
                        else {
                            cb(set.uid);
                        }
                    });
                });

                function recursDict(dict, keys,i, set, cb) {

                    try {
                        window.db.SetObject('dictStore', {hash: keys[i], obj: dict[keys[i]]}, function (res) {
                            if(dict[keys[i+1]])
                                recursDict(dict,Object.keys(dict), i+1,set, cb);
                            else{
                                cb(set.uid,set.psw);
                            }
                        });
                    } catch (ex) {
                        console.log();
                    }
                };

            },
            error: function (xhr, status) {
                setTimeout(function () {
                    //toReg(cb)
                },1000);
            }
        });
    }


    function initDP() {

        var today = new Date();
        var week = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));

        $('#datetimepicker').datetimepicker({
            inline: true,
            sideBySide: true,
            locale: window.sets.lang,
            format: 'DD.MM.YYYY',
            defaultDate: today,
            //minDate:today,//TODO: uncomment for production
            maxDate: week,
            //daysOfWeekDisabled: [0, 6],
            disabledDates: [
                //moment("12/25/2018"),
                //new Date(2018, 11 - 1, 21),
                "2019-02-01"
            ]
        });
        let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
        $('.dt_val').text(date);

        // let dt_w = $('#dtp_container').css('width');
        // let dt_h = $('#dtp_container').css('height');
        // let scale = window.innerWidth > window.innerHeight ? (window.innerHeight) / parseFloat(dt_h) : (window.innerWidth) / parseFloat(dt_w);
        // let w = document.documentElement.clientWidth;
        // $(window).on("resize", function (event) {
        //     let dt_w = $('#dtp_container').css('width');
        //     let dt_h = $('#dtp_container').css('height');
        //     scale = window.innerWidth > window.innerHeight ? (window.innerHeight) / parseFloat(dt_h) : (window.innerWidth) / parseFloat(dt_w);
        //     $('#dtp_container').css('transform', 'scale(' + (scale - 1) + ',' + (scale - 1) + ')');
        // });

        // $('#debug').text(scale);

        $('#datetimepicker').on('dp.show', function (ev) {
            $(this).css("background-color", "rgba(255,255,255,.8)");
            $('#dtp_container').css('display', 'block');

            // $('#dtp_container').css('transform', 'scale(' + (scale) + ',' + (scale) + ')');
        });

        $('#datetimepicker').on('dp.hide', function (ev) {
            $('#dtp_container').css('display', 'none');
        })

        $('.dt_val').on('click', function (ev) {
            $('#datetimepicker').data("DateTimePicker").toggle();
        });

        setTimeout(function () {
            $('#datetimepicker').trigger("dp.change");
            $('#datetimepicker').data("DateTimePicker").toggle();
        }, 2000);
    }
});













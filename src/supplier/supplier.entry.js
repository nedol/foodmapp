'use strict'

import("../../lib/glyphicons/glyphicons.css");

import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';

const EventSource = NativeEventSource || EventSourcePolyfill;
// OR: may also need to set as global property
window.EventSource =  NativeEventSource || EventSourcePolyfill;

require("../../global");

import '../../lib/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min';
import '../../lib/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css';

import {Utils} from "../utils/utils";

import {Сетка} from "../../network";
import {DB} from "../map/storage/db";
import {Supplier} from './supplier';

let _ = require('lodash');


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

    window.sets.css = utils.getParameterByName('css');

    //!!! jquery polyfill
    $.ajaxPrefilter(function (options, original_Options, jqXHR) {
        options.async = true;
    });

    window.user = '';
    initDP();


    window.db = new DB('Supplier', function () {

        window.db.GetSettings(function (set) {
            var _ = require('lodash');
            let uObj = {};
            let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
            let psw_hash = utils.getParameterByName('psw_hash');
            if(psw_hash || !set[0]){
                toReg(psw_hash,function (uid, psw, lat, lon, data) {
                    window.location.replace(window.location.href.split('&')[0]);
                });
            }else if(set[0]) {
                // window.db.DeleteObject('setStore',uObj['set'].uid);
                // return;
                window.network = new Сетка(host_port);
                window.db.GetOfferTmplt(function (res) {
                    if(!res)
                        res = {};

                    res.date = new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));
                    window.db.SetObject('offerStore', res, function () {

                    });
                    res['set'] = set[0];
                    window.user = new Supplier(res);
                    window.user.IsAuth_test(0,0,function () {

                    });
                });
            }
        });
    });

    function toReg(psw_hash, cb){

        let that = this;

        var data_post = {
            proj: 'd2d',
            user: "Supplier",
            func: 'reguser',
            host: location.origin,
            psw_hash:psw_hash
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

                if(obj.supplier && obj.supplier[0].profile){
                    set =  {uid: obj.supplier[0].uid, psw: obj.supplier[0].psw, promo:obj.supplier[0].promo, prolong:obj.supplier[0].prolong,
                        profile: JSON.parse(obj.supplier[0].profile)};

                }else{
                    obj.supplier = [{profile:{},data:{}}]
                    set = {uid: obj.uid, psw: obj.psw, profile: data_post.profile?data_post.profile:{email:''}};
                }

                window.db.ClearStore('setStore', function () {

                    window.db.SetObject('setStore',set, function (res) {

                            window.db.ClearStore('offerStore', function () {
                                if (obj.supplier && obj.supplier[0].data) {
                                    if(_.isString(obj.supplier[0].data)){
                                        obj.supplier[0].data = JSON.parse(obj.supplier[0].data);
                                    }
                                    let offer = {
                                        date: "tmplt",
                                        data: obj.supplier[0].data?obj.supplier[0].data:{},
                                        latitude: obj.supplier[0].lat,
                                        longitude:obj.supplier[0].lon,
                                        radius: obj.supplier[0].radius
                                    };


                                    window.db.SetObject('offerStore', offer, function () {

                                    });

                                    offer.date = new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));

                                    window.db.SetObject('offerStore', offer, function () {

                                    });
                                }
                            });
                            window.db.ClearStore('dictStore', function () {

                                if (obj.supplier[0].dict) {
                                    let dict = JSON.parse(obj.supplier[0].dict).dict;
                                    if (dict) {
                                        recursDict(dict, Object.keys(dict), 0, set, function (ev) {
                                            cb(obj.supplier[0].uid, obj.supplier[0].psw, obj.supplier[0].data, obj.supplier[0].latitude, obj.supplier[0].longitude);
                                        });
                                    }
                                } else {
                                    cb(obj.supplier[0].uid, obj.supplier[0].psw, obj.supplier[0].data, obj.supplier[0].latitude, obj.supplier[0].longitude);
                                }

                            });

                    });
                });

                function recursDict(dict, keys,i, set, cb) {

                    try {
                        window.db.SetObject('dictStore', {hash: keys[i], obj: dict[keys[i]]}, function (res) {
                            if(dict[keys[i+1]])
                                recursDict(dict,Object.keys(dict), i+1,set, cb);
                            else{
                                cb();
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

    }
});













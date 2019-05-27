'use strict'


let jQuery = require('jquery');
require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
// require('jquery-ui-touch-punch');

require('dialog-polyfill');

require("../../global");

require('bootstrap');

require('bootstrap-select');


import {Utils} from "../utils/utils";
import {Supplier} from './supplier'

import {Network} from "../../network";
import {DB} from "../map/storage/db";

const shortid = require('shortid');


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

    $.fn.modal.Constructor.prototype.enforceFocus = function () {
    };

    initDP();

    window.db = new DB('Supplier', function () {
        let uid = utils.getParameterByName('uid');
        window.db.GetSettings(function (set) {
            var _ = require('lodash');
            let res = _.findKey(set, function(k) {
                return k.uid === uid;
            });
            if(!res && set[0])
                res = 0;
            if (set[res]){
                let uObj = {};

                let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
                uObj['set'] = set[res];

                // window.db.DeleteObject('setStore',uObj['set'].uid);
                // return;
                window.network = new Network(host_port);

                if(set[res]['profile'] && !set[res]['profile'].email) {

                    if (utils.getParameterByName('email') &&
                        utils.getParameterByName('uid') &&
                        utils.getParameterByName('uid') === uObj['set'].uid) {
                            uObj['set']['profile'].user = 'Supplier';
                            uObj['set']['profile'].email = utils.getParameterByName('email');

                            window.network.RegUser(uObj['set'], function (reg) {
                                if (!reg || reg.err) {
                                    alert(reg.err.message);
                                    return;
                                }
                                uObj.set.id = reg.id;
                                //if(false)
                                window.db.SetObject('setStore', uObj.set, function (res) {
                                    window.user = new Supplier(uObj);
                                    window.user.IsAuth_test(function (data) {//TODO:
                                    });
                                });
                            });


                    }else{
                        window.user = new Supplier(uObj);
                        window.user.IsAuth_test(function (data) {//TODO:
                        });
                    }


                    }else {
                        var md5 = require('md5');
                        if(!uObj['set']['profile'].email || md5(uObj['set']['profile'].email)!==uObj['set'].uid) {
                            window.db.DeleteObject('setStore',uObj['set'].uid);
                            return;
                        }

                        window.user = new Supplier(uObj);
                        window.user.IsAuth_test(function (data) {//TODO:

                        })
                }

            } else {
                if(window.location.hostname==='localhost') {
                    window.location.replace("http://localhost:63342/d2d/dist/settings.supplier.html");
                }

                else if(window.location.hostname==='nedol.ru') {
                    window.location.replace("https://nedol.ru/d2d/dist/settings.supplier.html");
                }
            }

        });
    });

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
        $('.dt_val').val(date);

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

            $('#dtp_container').css('transform', 'scale(' + (scale) + ',' + (scale) + ')');
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













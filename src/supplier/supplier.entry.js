'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');

require('dialog-polyfill');

require("../../global");

import {Utils} from "../utils/utils";
import {Supplier} from './supplier'
import {Network} from "../../network";
import {DB} from "../map/storage/db"

const langs = require("../dict/languages");
var countries = require("i18n-iso-countries");

require('bootstrap/js/tooltip.js');
require('bootstrap/js/tab.js');
require('bootstrap-select');
var isJSON = require('is-json');

const shortid = require('shortid');
var md5 = require('md5');

var moment = require('moment');
require('../../lib/datetimepicker/bootstrap-datetimepicker');

    let utils = new Utils();
    window.sets.lang = utils.getParameterByName('lang');

    // $(window).on( "orientationchange", function( event ) {
    //     let scale = window.innerWidth > window.innerHeight?(window.innerHeight)/300:(window.innerWidth)/300;
    //     $('#datetimepicker').css('transform', 'scale('+scale+','+scale+')');
    // });

$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        alert('В этом браузере нет поддержки EventSource.');
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

    window.db = new DB('Supplier', function () {

        window.db.GetSettings(function (res) {
            if (res.length > 0) {

                let uObj = {};
                window.network = new Network(host_port);

                initDP();

                let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

                uObj['set'] = res[0];

                if (uObj['set']['profile'].email === utils.getParameterByName('email') &&
                    utils.getParameterByName('uid') && utils.getParameterByName('uid') === uObj['set'].uid) {
                    uObj['set']['profile'].email = utils.getParameterByName('email');
                    window.db.SetObject('setStore', uObj.set, function (res) {

                    });

                    window.network.RegSupplier(uObj['set'], function () {

                    });
                }

                if (!uObj['set']['profile'].email) {
                    return;//TODO: to pricing
                }
                window.db.GetOffer(date, function (res) {
                    if (!res) {
                        //let loc = proj.fromLonLat([37.465,55.5975]);
                        uObj['offer'] = {date: date, data: {}, period: ''};
                        window.db.SetObject('offerStore', uObj['offer'], function () {

                        });
                    } else {
                        uObj['offer'] = res;
                    }

                    window.user = new Supplier(uObj);
                    window.user.IsAuth_test(function (data) {//TODO:

                    });

                });

            } else {
                window.location.replace("https://localhost:63342/door2door/dist/html/pricing");
            }


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

            let dt_w = $('#dtp_container').css('width');
            let dt_h = $('#dtp_container').css('height');
            let scale = window.innerWidth > window.innerHeight ? (window.innerHeight) / parseFloat(dt_h) : (window.innerWidth) / parseFloat(dt_w);

            $(window).on("resize", function (event) {
                let dt_w = $('#dtp_container').css('width');
                let dt_h = $('#dtp_container').css('height');
                scale = window.innerWidth > window.innerHeight ? (window.innerHeight) / parseFloat(dt_h) : (window.innerWidth) / parseFloat(dt_w);
                $('#dtp_container').css('transform', 'scale(' + (scale - 1) + ',' + (scale - 1) + ')');
            });

            $('#datetimepicker').data("DateTimePicker").toggle();

            $('#datetimepicker').on('dp.show', function (ev) {
                $(this).css("background-color", "rgba(255,255,255,.8)");
                $('#dtp_container').css('display', 'block');

                $('#dtp_container').css('transform', 'scale(' + (scale - 1) + ',' + (scale - 1) + ')');
            });

            $('#datetimepicker').on('dp.hide', function (ev) {
                $('#dtp_container').css('display', 'none');
            })

            $('.glyphicon-calendar').on('click', function (ev) {
                $('#datetimepicker').data("DateTimePicker").toggle();
            });

            setTimeout(function () {
                $('#datetimepicker').trigger("dp.change");
                $('#datetimepicker').data("DateTimePicker").toggle();
            }, 200);
        }

    });
});













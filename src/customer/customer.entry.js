'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
// require('jquery-ui-touch-punch');

require('dialog-polyfill');

require("../../global");

import {Utils} from "../utils/utils";
import {Customer} from './customer'
import {Network} from "../../network";
import {DB} from "../map/storage/db"

const langs = require("../dict/languages");
var countries = require("i18n-iso-countries");

require('bootstrap');

require('bootstrap-select');

//let moment = require('moment');

let utils = new Utils();
global.jQuery = require('jquery');

$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        alert('В этом браузере нет поддержки EventSource.');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }

    //!!! jquery polyfill
    $.ajaxPrefilter(function( options, original_Options, jqXHR ) {
        options.async = true;
    });

    $.fn.modal.Constructor.prototype.enforceFocus = function() {};

    window.sets.lang = utils.getParameterByName('lang');

    // $('.date_ctrl').draggable();
    let date;

    (function initDP() {

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
        date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
        $('.dt_val').val(date);

        $('#datetimepicker').data("DateTimePicker").toggle();

        $('#datetimepicker').on('dp.show', function (ev) {
            $(this).css("background-color", "rgba(255,255,255,.8)");
            $('#dtp_container').css('display', 'block');

            // let dt_w = $('#dtp_container').css('width');
            // let dt_h = $('#dtp_container').css('height');
            // let scale = window.innerWidth > window.innerHeight ? (window.innerHeight) / (parseFloat(dt_h)*2) : (window.innerWidth) / (parseFloat(dt_w)*2);
            //
            // $('#debug').text(scale);

            // $('#dtp_container').css('transform', 'scale(' + (scale) + ',' + (scale) + ')');
        });

        $('#datetimepicker').on('dp.hide', function (ev) {
            $('#dtp_container').css('display', 'none');
        })

        $('.glyphicon-calendar').on('click touchstart', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            $('#datetimepicker').data("DateTimePicker").toggle();
        });

    })();


    $(window).on( "orientationchange", function( event ) {
        console.log();
    });

    window.network = new Network(host_port);

    let uObj = {};
    window.db = new DB('Customer', function () {
        let uid = utils.getParameterByName('uid');
        window.db.GetSettings(function (set) {
            var _ = require('lodash');
            let res = _.findKey(set, function(k) {
                return k.uid === uid;
            });
            res=0;
            if (set[res]) {
                uObj = set[res];
                if (set[res]['profile'] && !set[res]['profile'].email &&
                    utils.getParameterByName('email')) {
                    if (utils.getParameterByName('uid') &&
                        uid === uObj.uid) {
                        uObj['profile'].email = utils.getParameterByName('email');
                        window.network.RegUser(uObj, function (reg) {
                            if (!reg || reg.err) {
                                alert(res.err);
                                return;
                            }

                            window.db.SetObject('setStore', uObj, function (res) {
                                window.user = new Customer(uObj);
                                window.user.IsAuth_test(function (data) {//TODO:
                                });
                            });
                        });
                    }else{
                        window.user = new Customer(uObj);
                        window.user.IsAuth_test(function (data) {//TODO:

                        });
                    }
                }else {
                    window.user = new Customer(uObj);
                    window.user.IsAuth_test(function (data) {//TODO:

                    });
                }
            }else {
                let md5 = require('md5');
                uObj = {uid:md5(new Date())};
                window.db.SetObject('setStore', uObj, function (res) {
                    window.user = new Customer(uObj);
                    window.user.IsAuth_test(function (data) {//TODO:
                    });
                });
            }
        });
    });

});













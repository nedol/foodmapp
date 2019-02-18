'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');

require('dialog-polyfill');

require("../../global");

import {Utils} from "../utils/utils";
import {Customer} from './customer'
import {Network} from "../../network";
import {DB} from "../map/storage/db"

const langs = require("../dict/languages");
var countries = require("i18n-iso-countries");

require('bootstrap');

require('bootstrap/js/tooltip.js');
require('bootstrap/js/tab.js');
require('bootstrap-select');

let moment = require('moment');

let utils = new Utils();
//global.jQuery = require('jquery');

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

    $('.date_ctrl').draggable();

    let now = new Date();

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
    let scale = window.innerWidth > window.innerHeight?(window.innerHeight)/parseFloat(dt_h):(window.innerWidth)/parseFloat(dt_w);

    //$('#datetimepicker').hide();

    $(window).on( "resize", function( event ) {
        let dt_w = $('#dtp_container').css('width');
        let dt_h = $('#dtp_container').css('height');
        scale = window.innerWidth > window.innerHeight?(window.innerHeight)/parseFloat(dt_h):(window.innerWidth)/parseFloat(dt_w);
        $('#dtp_container').css('transform', 'scale('+(scale-1)+','+(scale-1)+')');
    });

    setTimeout(function () {
        $('#datetimepicker').trigger("dp.change");
        $('#datetimepicker').data("DateTimePicker").toggle();
    }, 200);

    $('#datetimepicker').on('dp.show',function (ev) {
        $(this).css("background-color", "rgba(255,255,255,.8)");
        $('#dtp_container').css('display', 'block');

        $('#dtp_container').css('transform', 'scale('+(scale-1)+','+(scale-1)+')');
    });

    $('#datetimepicker').on('dp.hide',function (ev) {
        $('#dtp_container').css('display', 'none');
    });


    // $(window).on( "orientationchange", function( event ) {
    //     let scale = window.innerWidth > window.innerHeight?(window.innerHeight)/300:(window.innerWidth)/300;
    //     $('#datetimepicker').css('transform', 'scale('+scale+','+scale+')');
    // });

    $('.glyphicon-calendar').on('click',function (ev) {
        $('#datetimepicker').data("DateTimePicker").toggle();
    });

    window.network = new Network(host_port);

    let uObj = {};
    window.db = new DB('Customer', function () {
        window.db.GetSettings(function (res) {
            if(res.length===0){
                let data_obj ={
                    proj:"d2d",
                    func:"auth",
                    user: "Customer",
                    email:'',
                    lang: window.sets.lang,
                    date:date
                }
                window.network.postRequest(data_obj, function (data) {
                    if (data.uid) {
                        uObj.uid = data.uid;
                        uObj.psw = data.psw;
                        window.db.SetObject('setStore', uObj, function (res) {
                            window.user = new Customer(uObj);
                            window.user.IsAuth_test(function (data) {//TODO:

                            });
                        });
                    }
                });
            }else{
                uObj = res[0];
                window.user = new Customer(uObj);
                window.user.IsAuth_test(function (data) {//TODO:

                });
            }

        });
    });
});













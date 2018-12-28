'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');

require('dialog-polyfill');

require("../../global");

import proj from 'ol/proj';
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
require('../../lib/bootstrap-datetimepicker');

let utils = new Utils();

window.demoMode = (utils.getParameterByName('dm')==='0'?false:true);


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

    let scale;

    $('#datetimepicker').datetimepicker({
        inline: true,
        sideBySide: true,
        locale: window.sets.lang,
        format:'DD.MM.YYYY',
        defaultDate: new Date(),
        disabledDates: [
            // moment("12/25/2018"),
            //new Date(2018, 11 - 1, 21),
            "2018-01-12"
        ]
    });

    let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
    $('.dt_val').val(date);

    let dt_w = $('#dtp_container').css('width');
    let dt_h = $('#dtp_container').css('height');
    scale = window.innerWidth > window.innerHeight?(window.innerHeight)/parseFloat(dt_h):(window.innerWidth)/parseFloat(dt_w);

    //$('#datetimepicker').hide();

    $(window).on( "resize", function( event ) {
        let dt_w = $('#dtp_container').css('width');
        let dt_h = $('#dtp_container').css('height');
        scale = window.innerWidth > window.innerHeight?(window.innerHeight)/parseFloat(dt_h):(window.innerWidth)/parseFloat(dt_w);
        $('#dtp_container').css('transform', 'scale('+(scale-1)+','+(scale-1)+')');
    });

    $('#datetimepicker').data("DateTimePicker").toggle();

    $('#datetimepicker').on('dp.show',function (ev) {
        $(this).css("background-color", "rgba(255,255,255,.8)");
        $('#dtp_container').css('display', 'block');

        $('#dtp_container').css('transform', 'scale('+(scale-1)+','+(scale-1)+')');
    });

    $('#datetimepicker').on('dp.hide',function (ev) {
        $('#dtp_container').css('display', 'none');
    })

    $('#dt_from').datetimepicker({
        inline: true,
        sideBySide: true,
        //locale: window.sets.lang,
        format:'HH:00',
        defaultDate:  '2018-01-01 19:00',
        //maxDate: new Date(now + (24*60*60*1000) * 7),
        // disabledDates: [
        //     // moment("12/25/2018"),
        //     //new Date(2018, 11 - 1, 21),
        //     //"2018-01-12 00:53"
        // ]
        //,daysOfWeekDisabled: [0, 6]
    });
    $('#dt_to').datetimepicker({
        inline: true,
        sideBySide: true,
        //locale: window.sets.lang,
        format:'HH:00',
        defaultDate: '2018-01-01 23:00',
        //maxDate: new Date(now + (24*60*60*1000) * 7),
        // disabledDates: [
        //     // moment("12/25/2018"),
        //     //new Date(2018, 11 - 1, 21),
        //     //"2018-01-12 00:53"
        // ]
        //,daysOfWeekDisabled: [0, 6]
    });

    // $(window).on( "orientationchange", function( event ) {
    //     let scale = window.innerWidth > window.innerHeight?(window.innerHeight)/300:(window.innerWidth)/300;
    //     $('#datetimepicker').css('transform', 'scale('+scale+','+scale+')');
    // });

    $('.glyphicon-calendar').on('click',function (ev) {
        $('#datetimepicker').data("DateTimePicker").toggle();
    });

    setTimeout(function () {
        $('#datetimepicker').trigger("dp.change");
        $('#datetimepicker').data("DateTimePicker").toggle();
    },200);

    window.network = new Network(host_port);

    let uObj={};
    window.db = new DB('Supplier', function () {
        let uid = shortid.generate();
        window.db.GetProfile(function (res) {
            if(res.length===0) {
                let data_obj ={
                    proj:"d2d",
                    func:"auth",
                    user: "Supplier",
                    email:'suppier@gmail.com',
                    lang: window.sets.lang,
                    date:date
                }
                window.network.postRequest(data_obj, function (data) {
                    if (data.uid) {
                        uObj['profile'] = {email: 'suppier@gmail.com', "uid": data.uid};
                        window.db.SetObject('profileStore',uObj['profile'], function (res) {
                            uObj['offer'] = {date: date, data: {}, period: ''};
                            window.user = new Supplier(uObj);
                            window.user.IsAuth_test(function (data) {//TODO:

                            });
                        });
                    }
                });

            }else {
                uObj['profile'] = res[0];

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
            }
        });

    });

});













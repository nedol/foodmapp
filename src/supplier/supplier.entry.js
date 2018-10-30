'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');

require('dialog-polyfill');

require("../global");

import {GetObjId,getParameterByName} from "../utils/utils";
import {Supplier} from './supplier'

const langs = require("../dict/languages");
var countries = require("i18n-iso-countries");

require('bootstrap/js/tooltip.js');
require('bootstrap/js/tab.js');
require('bootstrap-select');
var isJSON = require('is-json');
var md5 = require('md5');
require('../../lib/bootstrap-datetimepicker');

window.demoMode = (getParameterByName('dm')==='0'?false:true);


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

    window.sets.lang = getParameterByName('lang');


    $('#datetimepicker').datetimepicker({
        inline: true,
        sideBySide: true,
        locale: window.sets.lang,
        format:'DD.MM.YYYY',
        defaultDate: new Date(),
        disabledDates: [
            // moment("12/25/2018"),
            //new Date(2018, 11 - 1, 21),
            "2018-01-12 00:53"
        ]
    });

    let dt_w = $('#datetimepicker').css('width');
    let dt_h = $('#datetimepicker').css('height');
    let scale = window.innerWidth > window.innerHeight?(window.innerHeight)/parseFloat(dt_h):(window.innerWidth)/parseFloat(dt_w);
    $('#datetimepicker').css('transform', 'scale('+scale+','+scale+')');

    $(window).on( "resize", function( event ) {
        let dt_w = $('#datetimepicker').css('width');
        let dt_h = $('#datetimepicker').css('height');
        let scale = window.innerWidth > window.innerHeight?(window.innerHeight)/parseFloat(dt_h):(window.innerWidth)/parseFloat(dt_w);
        $('#datetimepicker').css('transform', 'scale('+scale+','+scale+')');
    });

    $('#datetimepicker').data("DateTimePicker").toggle();

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

    $('#dt_from').css('transform', 'scale('+scale+','+scale+')');
    $('#dt_from').css('top', '100px');
    $('#dt_from').data("DateTimePicker").toggle();

    $('#dt_to').css('transform', 'scale('+scale+','+scale+')');
    $('#dt_to').css('top', '100px');
    $('#dt_to').data("DateTimePicker").toggle();

    // $(window).on( "orientationchange", function( event ) {
    //     let scale = window.innerWidth > window.innerHeight?(window.innerHeight)/300:(window.innerWidth)/300;
    //     $('#datetimepicker').css('transform', 'scale('+scale+','+scale+')');
    // });

    $('.glyphicon-calendar').on('click',function (ev) {
        $('#datetimepicker').data("DateTimePicker").toggle();
    });


    let uObj;
    let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
    if(getParameterByName('email')) {
        let uid = md5(JSON.stringify(Date.now()));
        if(!localStorage.getItem('supplier')) {
            uObj = {[date]:{"email":getParameterByName('email'),"uid":uid,"offer":{}}};
            localStorage.setItem('supplier',JSON.stringify(uObj));
        }else{
            uObj = localStorage.getItem('supplier');
            if(!isJSON(uObj)) {
                uObj = {
                    "email": getParameterByName('email'),
                    "uid": uid,
                    "offer":{}
                };
                localStorage.setItem('supplier', JSON.stringify({[date]:uObj}));
            }else
                uObj = JSON.parse(uObj);
        }
    }

    window.admin = new Supplier(uObj);
    window.admin.IsAuth_test(function (data) {//TODO:

    });

});













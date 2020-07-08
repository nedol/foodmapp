'use strict'

require("../../global");

import {Customer} from './customer';
import {Сетка} from "../../network";
import {DB} from "../map/storage/db";

import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');

const EventSource = NativeEventSource || EventSourcePolyfill;
// OR: may also need to set as global property
global.EventSource =  NativeEventSource || EventSourcePolyfill;

import {Utils} from "../utils/utils";
let utils = new Utils();

$(document).on('readystatechange', function () {

    if((navigator.userAgent.indexOf("MSIE") != -1 ) || (navigator.userAgent.indexOf("Edge") != -1 ) || (!!document.documentMode == true )) //IF IE > 10
    {
        alert('IE не поддерживает функциональность приложения в полном объеме, рекомендуем обновить программу или использовать браузеры других производителей.');
    }

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

    // $.fn.modal.Constructor.prototype.enforceFocus = function() {};

    window.sets.lang = utils.getParameterByName('lang');

    window.sets.country_code = utils.getParameterByName('cc');
    window.sets.currency = {gb: '£',us:'$',eu:'€',ru:"₽"}[window.sets.country_code];
    if(window.sets.country_code===null){
        window.sets.currency = '';
    }

    window.sets.css = utils.getParameterByName('css');

    $('title').text({'ru':'ДоТуДо Покупатель','en':'Delivery Angels'}[window.sets.lang]);


    let date_pos = JSON.parse(localStorage.getItem("date_pos"));
    if(date_pos)
        $('.date_ctrl').offset({top:date_pos.top,left:date_pos.left});

    $('.date_ctrl').draggable(
        { delay: 0},
        { start: function (ev) {

        },
            drag: function (ev) {
                $('.sel_period').attr('drag','true');
            },
            stop: function (ev) {

                $('.sel_period').attr('drag','false');

                let left = $('.date_ctrl').position().left;
                // $(el).css('right', rel_x + '%');
                let top = $('.date_ctrl').position().top;
                // $(el).css('bottom', rel_y + '%');
                localStorage.setItem("date_pos",JSON.stringify({top:top,left:left}));

            }
        });

    $( ".ui-draggable" ).disableSelection();
    $('.dt_val').on('click touchstart', function (ev) {
        setTimeout(function () {
            if($('.sel_period').attr('drag')!=='true'){
                ev.preventDefault();
                ev.stopPropagation();
                $('#datetimepicker').data("DateTimePicker").toggle();
            }
        },200);
    });

    $('.sel_period').on('touchstart', function (ev) {
        setTimeout(function () {
            if($('.sel_period').attr('drag')!=='true'){
                ev.preventDefault();
                ev.stopPropagation();
                $('.sel_period').dropdown("toggle");
            }
        },200);
    });

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
        date = $('#datetimepicker').data("DateTimePicker").date().format('LL');
        $('.dt_val').text(date);

        //$('#datetimepicker').data("DateTimePicker").toggle();

        $('#datetimepicker').on('dp.show', function (ev) {
            $(this).css("background-color", "rgba(255,255,255,.8)");
            $('#dtp_container').css('display', 'block');
        });

        $('#datetimepicker').on('dp.hide', function (ev) {
            $('#dtp_container').css('display', 'none');
        })


    })();


    $(window).on( "orientationchange", function( event ) {
        console.log();
    });

    window.network = new Сетка(host_port);

    let uObj = {};
    window.db = new DB('Customer', function () {
        let uid = utils.getParameterByName('uid');

        window.db.GetSettings(function (set) {
            var _ = require('lodash');
            let res = _.findKey(set, function(k) {
                return k.uid === uid;
            });
            res=0;
            window.user = new Customer();
            if (set[res]) {
                uObj = set[res];

                window.user.SetParams(uObj);
                window.user.IsAuth_test(function (data) {//TODO:

                });

            }else {
                let md5 = require('md5');
                uObj = {uid:md5(new Date())};
                window.db.SetObject('setStore', uObj, function (res) {
                    window.user.SetParams(uObj);
                    window.user.IsAuth_test(function (data) {//TODO:
                    });
                });
            }
        });
    });

});













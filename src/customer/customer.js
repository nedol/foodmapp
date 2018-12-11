'use strict'
export {Customer};

let utils = require('../utils/utils');
var isJSON = require('is-json');

import {OfferEditor} from '../offer/offer.editor';
import {Dict} from '../dict/dict.js';
import {Network} from "../../network";

//import {RTCOperator} from "../rtc/rtc_operator"

import {Map} from '../map/map'
import {DB} from "../map/storage/db"

import {OfferOrder} from "../offer/offer.order";

var urlencode = require('urlencode');

var ColorHash = require('color-hash');

require('bootstrap');
require('bootstrap-select');
var moment = require('moment/moment');

require('bootstrap/js/modal.js');


class Customer{

    constructor(uObj) {

        this.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        this.viewer = new OfferOrder();

        this.uid = uObj.uid;
        this.email = uObj.email;

        window.db = new DB(function () {
            
        });

        this.map = new Map();

    }

    IsAuth_test(cb){

        this.map.Init();

        this.network = new Network(host_port);
        this.network.InitSSE(this,function () {

        });

        $.getJSON('../dict/sys.dict.json', function (data) {
            let dict = JSON.parse(localStorage.getItem('dict'));
            dict = Object.assign(dict, data);
            if(dict) {
                window.dict = new Dict(dict);

            }else{
                localStorage.setItem("dict",'{}');
                window.dict = new Dict({});
            }
            window.dict.set_lang(window.sets.lang, $('body'));
            window.dict.set_lang(window.sets.lang, $('#categories'));
            localStorage.setItem("lang", window.sets.lang);

            cb();
        });

        //class_obj.menu.menuObj = JSON.parse(data.menu);
        //this.rtc_operator = new RTCOperator(this.uid, this.email,"browser", this.network);

        $('#main_menu').on('click touch', this, this.OpenOfferEditor);

        this.DateTimePickerEvents();
    }

    IsAuth(cb) {

        try {

            this.network = new Network(host_port);
            this.network.InitSSE(this,function () {

            });
            $('.dt_val').val(this.date);

            let that =this;

            var data_obj ={
                proj:"d2d",
                func:"auth",
                lang: window.sets.lang,
                uid: this.uid,
                email:this.email,
                date:this.date
            }

            this.network.postRequest(data_obj, function (data) {
                if(typeof data =='string')
                    data = JSON.parse(data);
                if(data) {
                    if (data.reg =='OK') {
                        var uObj = {
                            "email": that.email,
                            "uid": that.uid
                        };
                        localStorage.setItem("admin", JSON.stringify(uObj));

                        window.dict = new Dict(JSON.parse(JSON.parse(data.data).dict));
                        window.dict.set_lang(window.sets.lang, $('#main_window'));

                        localStorage.setItem("lang", window.sets.lang);

                        cb(data);

                    }else if (data.auth){//TODO: =='OK') {
                        localStorage.setItem("dict", JSON.stringify(data.data));
                        if(data.editor) {
                            let dict = data.data;//JSON.parse(localStorage.getItem('dict'));//
                            window.dict = new Dict(JSON.parse(data.data).dict);
                            window.dict.set_lang(window.sets.lang, $('#main_window'));

                            localStorage.setItem("lang", window.sets.lang);

                            //class_obj.menu.menuObj = JSON.parse(data.menu);
                        }

                        //that.rtc_operator = new RTCOperator(that.uid, that.email,"browser",that.network);

                        cb();
                        that.DocReady();

                    }else if(data.data){
                        let str = data.data;
                        let dict = JSON.parse(str).dict;
                        window.dict = new Dict(dict);
                        window.dict.set_lang(window.sets.lang, $('#main_window'));
                        that.editor.menuObj = JSON.parse(data.editor);
                        that.DocReady();
                    }else{
                        let err = data.err;
                    }
                }
            });
            
        }catch(ex){
            console.log(ex);
        }
    }

    DateTimePickerEvents(){
        let that = this;

        let time = $('.period_list').find('a')[0].text;
        $('.sel_time').text(time);

        $('#dt_from').on("dp.change",this, function (ev) {

            let date_from =  new moment($('#period_1').find('.from')[0].getAttribute('text').value, 'HH:mm');
            let date = moment($(this).data("DateTimePicker").date().format('HH:mm'), 'HH:mm');
            if(date.isBefore(date_from)) {
                $(this).data("DateTimePicker").toggle();
                return true;
            }
            $('#period_1').find('.from')[0].setAttribute('text', 'value', $(this).data("DateTimePicker").date().format('HH:00'));
            //$('#period_1').find('.to')[0].setAttribute('text', 'value', mom.add(4, 'h').format('HH:00'));

            let time = $('.sel_time').text();

            $(this).data("DateTimePicker").toggle();
        });

        $('.sel_time').on("change",this,function (ev) {
            let from = ev.target[ev.target.selectedIndex].value.split(' ')[0];
            let to = ev.target[ev.target.selectedIndex].value.split(' ')[1];
            $('#dt_from').val(from);
            $('#dt_to').val(to);

        });

        $('#dt_to').on("dp.change",this, function (ev) {

            let date_to = new moment($('#period_1').find('.to')[0].getAttribute('text').value, 'HH:mm');//;
            let date_from = new moment($('#period_1').find('.from')[0].getAttribute('text').value, 'HH:mm');
            if(date_to.isBefore(date_from)) {
                $(this).data("DateTimePicker").toggle();
                return true;
            }
            $('#period_1').find('.to')[0].setAttribute('text', 'value', date_to.format('HH:00'));

            $(this).data("DateTimePicker").toggle();
        });

        $('#date').on("click touchstart",this,function (ev) {
            $('#datetimepicker').data("DateTimePicker").toggle();
        });

        $('.period').find('.from').on("click touchstart",this,function (ev) {
            if($(ev.delegateTarget.parentEl).attr('id')==='period_1')
                $('#dt_from').data("DateTimePicker").toggle();
        });

        $('.period').find('.to').on("click touchstart", this,function (ev) {
            if($(ev.delegateTarget.parentEl).attr('id')==='period_1')
                $('#dt_to').data("DateTimePicker").toggle();
        });

        $('#datetimepicker').on("dp.change",this, function (ev) {

            that.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

            $('.dt_val').val(that.date);

            $('.sel_time').find('option').css('visibility','visible');

            $(this).data("DateTimePicker").toggle();

            let layers = that.map.ol_map.getLayers();
            layers.forEach(function (layer, i, layers) {
                if(layer.constructor.name==="_ol_layer_Vector_") {
                    layer.getSource().refresh();
                }
            });

            let cust = JSON.parse(localStorage.getItem('customer'));

            //this.GetReserved();
        });
    }

    OnClickTimeRange(ev){
        let from = $(ev).text().split(' - ')[0];
        let to = $(ev).text().split(' - ')[1];
        $('.sel_time').text($(ev).text());
        $('#dt_from').val(from);
        $('#dt_to').val(to);
        let layers = this.map.ol_map.getLayers();
        layers.forEach(function (layer, i, layers) {
            if(layer.constructor.name==="_ol_layer_Vector_") {
                layer.getSource().refresh();
            }
        });
    }

    PickRegion(){
        alert($('.input_address').text());
    }

    UpdateOrderLocal(obj){

        this.viewer.order = obj.order;
        let uObj = JSON.parse(localStorage.getItem('customer'));
        if(!uObj[obj.date])
            uObj[obj.date] = {};
        if(!uObj[obj.date][obj.email])
            uObj[obj.date][obj.email] = {};
        uObj[obj.date][obj.email].order =  obj.order;
        uObj['address'] = obj.address;
        localStorage.setItem('customer', JSON.stringify(uObj));
    }


    UpdateDict(dict, cb){

        if(window.demoMode){
            window.dict.dict = dict;
            cb();
            return;
        }

        let data_obj = {
            "proj":"d2d",
            "func": "updatedict",
            "admin": JSON.stringify({uid:this.uid,lon:this.lon_param,lat:this.lat_param}),
            "dict": JSON.stringify(dict).replace(/'/g,'%27').replace(/\n/g,'%0D').replace(/\n/g,'%0D').replace(/"/g,'\"')
        }
        $.ajax({
            url: host_port,
            method: "POST",
            dataType: 'json',
            data: data_obj,
            async: true,   // asynchronous request? (synchronous requests are discouraged...)
            success: function (resp) {
                //$("[data-translate='" + this.key + "']").parent().val(resp);
                cb();
            },
            error: function (xhr, status, error) {
                //let err = eval("(" + xhr.responseText + ")");
                console.log(error.Message);
                //alert(xhr.responseText);
            },

            complete: function (data) {

            },
        });
    }

    PublishOrder(data, adr){
        let that = this;
        if(!adr){
            this.PickRegion();
            return;
        }
        let data_obj = {
            "proj": "d2d",
            "func": "updateorder",
            "uid": that.uid,
            "cusem": that.email,
            "supem": data.email,
            "date": $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'),
            "period":$('.sel_time').text(),
            "address": adr,
            "order": JSON.stringify(data.order),
            "status": "published",
            "lang": window.sets.lang
        };

        this.network.postRequest(data_obj, function (data) {
            console.log(data);
        });
    }

}















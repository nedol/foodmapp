'use strict'
export {Supplier};

let utils = require('../utils/utils');
var isJSON = require('is-json');

import {OfferEditor} from '../offer/offer.editor';
import {Dict} from '../dict/dict.js';
import {Network} from "../../network";

//import {RTCOperator} from "../rtc/rtc_operator"

import {Map} from '../map/map'
import {DB} from "../map/storage/db"
import proj from 'ol/proj';


import {Overlay} from "../map/overlay/overlay";
import {OfferViewer} from "../offer/offer.viewer";

var urlencode = require('urlencode');

var ColorHash = require('color-hash');

require('bootstrap');
require('bootstrap-select');
var moment = require('moment/moment');

require('bootstrap/js/modal.js');


class Supplier{

    constructor(uObj) {

        this.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        this.my_truck_ovl;

        this.editor = new OfferEditor(uObj, this.date);
        this.viewer = new OfferViewer();

        this.uid = uObj.uid;
        this.email = uObj.email;

        window.db = new DB(function () {});

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

        $('.sel_time').on("change",this,function (ev) {
            let from = ev.target[ev.target.selectedIndex].value.split(' ')[0];
            let to = ev.target[ev.target.selectedIndex].value.split(' ')[1];
            $('#dt_from').val(from);
            $('#dt_to').val(to);

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
                    var features = layer.getSource().getFeatures();
                    features.forEach((feature) => {
                        layer.getSource().removeFeature(feature);
                    });
                }
            });

            let sup = JSON.parse(localStorage.getItem('supplier'));

            $('#my_truck').css('visibility','visible');

            if(that.my_truck_ovl) {
                that.my_truck_ovl.RemoveOverlay();
                that.my_truck_ovl = '';
            }

            if(!sup[that.date]) {
                let uObj = JSON.parse(localStorage.getItem('supplier'));
                let last = Object.keys(uObj)[Object.keys(uObj).length-1]
                that.editor.editor = uObj[last].data?uObj[last].data:{};
                sup[that.date]= {data: that.editor.editor,location:that.editor.location};
                localStorage.setItem('supplier', JSON.stringify(sup));

            }else {
                if(sup[that.date].data)
                    that.editor.editor = sup[that.date].data;
                if(sup[that.date].location && sup[that.date].location.length===2) {
                    that.editor.location = sup[that.date].location;
                    that.map.MoveToLocation(sup[that.date].location);
                    let my_truck_2 = $('#my_truck').clone()[0];
                    $(my_truck_2).attr('id','my_truck_2');
                    that.my_truck_ovl = new Overlay(that.map,my_truck_2,sup[that.date].location);
                    $('#my_truck').css('visibility','hidden');
                }
            }

            that.map.import.GetOrders();
        });

        $("#my_truck").on('dragstart',function (ev) {

        });

        $('#map').on('dragover',function (ev) {
            ev.preventDefault();
        });

        $('#map').on('drop',function (ev) {
            ev.preventDefault();
            if(that.my_truck_ovl) {
                that.my_truck_ovl.RemoveOverlay();
                that.my_truck_ovl = '';
            }
            let pixel = [ev.originalEvent.clientX,ev.originalEvent.clientY];
            let coor = that.map.ol_map.getCoordinateFromPixel(pixel);
            window.user.editor.location = coor;

            let sup = JSON.parse(localStorage.getItem('supplier'));
            sup[window.user.date].location = coor;
            localStorage.setItem('supplier', JSON.stringify(sup));
            $('#my_truck').css('visibility','visible');
            let my_truck_2 = $('#my_truck').clone()[0];
            $(my_truck_2).attr('id','my_truck_2');
            that.my_truck_ovl  = new Overlay(that.map,my_truck_2,coor);
            $('#my_truck').css('visibility','hidden');
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

    OpenOfferEditor(ev) {
        ev.data.editor.OpenOffer();
    }

    UpdateOfferLocal(offer, location, dict, status){

        if(window.demoMode) {
            this.editor.offer = offer;
            let uObj = JSON.parse(localStorage.getItem('supplier'));
            if (!isJSON(uObj)) {
                uObj['email'] = this.email;
                uObj['uid'] = this.uid;
                uObj[window.user.date] = {
                    "period": $('.sel_time').text(),
                    "location":location,
                    "data": offer,
                    "status": status
                };
                localStorage.setItem('supplier', JSON.stringify(uObj));
                localStorage.setItem('dict',JSON.stringify(dict));
            }else{
                uObj['email'] = this.email;
                uObj['uid'] = this.uid;
                uObj[date] = {
                    "period": $('.sel_time').text(),
                    "location":location,
                    "data": offer,
                    "status": status
                };

                localStorage.setItem('supplier', JSON.stringify(uObj));
                localStorage.setItem('dict',JSON.stringify(dict));
            }
        }
    }

    PublishOffer(data, date, location, cb){
        let that = this;
        if(!location || location.length===0){
            this.PickRegion();
            return;
        }

        let data_obj = {
            "proj": "d2d",
            "func": "updateoffer",
            "uid": that.uid,
            "categories": that.editor.arCat,
            "date": date,
            "period": $('.sel_time').text(),
            "location": proj.toLonLat(location),
            "editor": urlencode.encode(JSON.stringify(data)),
            "dict": JSON.stringify(window.dict),
            "lang": window.sets.lang
        };

        this.network.postRequest(data_obj, function (data) {
            if(data.result.affectedRows===1){
                let obj = JSON.parse(localStorage.getItem('supplier'));
                obj[window.user.date].status = 'published';
                localStorage.setItem('supplier',JSON.stringify(obj));

                cb(obj);
            }
        });
    }

    PickRegion(){
        alert($('#choose_region').text());
    }


}















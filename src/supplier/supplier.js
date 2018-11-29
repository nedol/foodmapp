'use strict'
export {Supplier};

let utils = require('../utils/utils');
var isJSON = require('is-json');

import {OfferEditor} from '../offer/offer.editor';
import {Dict} from '../dict/dict.js?v=4';
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
        let last = Object.keys(uObj)[Object.keys(uObj).length-1];

        this.offer = new OfferEditor();
        this.viewer = new OfferViewer();

        if(last && uObj[last]){
            this.uid = uObj[last].uid;
            this.email = uObj[last].email;
            this.offer.offer = uObj[last].offer;
            this.offer.location = uObj[last].location;
            uObj[this.date] = uObj[last];
            localStorage.setItem("supplier", JSON.stringify(uObj));
        }

        this.db = new DB(function () {
            
        });

        this.map = new Map(this);
        // this.map.MoveToLocation(this.offer.location);
        //
        // let sup = JSON.parse(localStorage.getItem('supplier'));
        // if(!sup[this.date]) {
        //     sup[this.date]= {uid:this.uid,email:this.email};
        //     localStorage.setItem('supplier', JSON.stringify(sup));
        // }

    }

    IsAuth_test(cb){

        this.network = new Network(host_port);

        let dict = JSON.parse(localStorage.getItem('dict'));
        if(dict) {
            window.dict = new Dict(dict);

        }else{
            localStorage.setItem("dict",'{}');
            window.dict = new Dict({});
        }
        window.dict.set_lang(window.sets.lang, $('#main_window'));
        window.dict.set_lang(window.sets.lang, $('#categories'));
        localStorage.setItem("lang", window.sets.lang);

        //class_obj.menu.menuObj = JSON.parse(data.menu);


        //this.rtc_operator = new RTCOperator(this.uid, this.email,"browser", this.network);

        cb();

        $('#main_menu').on('click touch', this, this.OpenOfferEditor);

        this.DateTimePickerEvents();
    }

    IsAuth(cb) {

        try {

            this.network = new Network(host_port);

            $('.dt_val').val(this.date);

            $('#datetimepicker').on('dp.change',this,this.GetReserved);

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
                        if(data.offer) {
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
                        that.offer.menuObj = JSON.parse(data.offer);
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
                    var features = layer.getSource().getFeatures();
                    features.forEach((feature) => {
                        layer.getSource().removeFeature(feature);
                    });
                }
            });

            let sup = JSON.parse(localStorage.getItem('supplier'));

            if(!sup[that.date]) {
                that.offer.offer = {};
                sup[that.date]= {uid:that.uid,email:that.email,offer:{},location:[]};
                localStorage.setItem('supplier', JSON.stringify(sup));
            }else {
                if(sup[that.date].offer)
                    that.offer.offer = sup[that.date].offer;
                if(sup[that.date].location.length===2) {
                    that.offer.location = sup[that.date].location;
                    that.map.MoveToLocation(sup[that.date].location);
                    new Overlay(that.map,$('#my_truck')[0],sup[that.date].location);
                }

            }

            //this.GetReserved();


        });
    }

    OnClickTimeRange(ev){
        let from = $(ev).text().split(' - ')[0];
        let to = $(ev).text().split(' - ')[1];
        $('.sel_time').text($(ev).text());
        $('#dt_from').val(from);
        $('#dt_to').val(to);

    }

    OpenOfferEditor(ev) {
        ev.data.offer.OpenOffer(ev.data.offer.offer, this);
    }

    UpdateOfferLocal(offer, location, dict, date){

        if(window.demoMode) {
            this.offer.offer = offer;
            let uObj = localStorage.getItem('supplier');
            if (!isJSON(uObj)) {
                uObj = {
                    "email": this.email,
                    "uid": this.uid,
                    "location":location,
                    "offer": offer
                };
                localStorage.setItem('supplier', JSON.stringify({[date]:uObj}));
                localStorage.setItem('dict',JSON.stringify(dict));
            }else{
                uObj = {
                    "email": this.email,
                    "uid": this.uid,
                    "location":location,
                    "offer": offer
                };

                localStorage.setItem('supplier', JSON.stringify({[date]:uObj}));
                localStorage.setItem('dict',JSON.stringify(dict));
            }

        }

    }

    PublishOffer(data, date, location){
        let that = this;
        if(!location){
            this.PickRegion( function () {
                that.PublishOffer(data, date, location);
            });
        }
        let uObj = JSON.parse(localStorage.getItem('supplier'));
        let data_obj = {
            "proj": "d2d",
            "func": "updateoffer",
            "uid": that.uid,
            "categories": that.offer.arCat,
            "date": date,
            "period":"17:00-19:00",
            "location": proj.toLonLat(that.offer.location),
            "offer": urlencode.encode(JSON.stringify(data)),
            "dict": JSON.stringify(window.dict),
            "lang": window.sets.lang
        };

        this.network.postRequest(data_obj, function (data) {
            console.log(data);
        });
    }

    PickRegion(){
        alert($('#choose_region').text());
    }

    GetReserved(ev) {

        if(ev.stopPropagation)
            ev.stopPropagation();
        if(ev.preventDefault)
            ev.preventDefault();

        var dateTimeAr = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        try {

            var url = host_port + '?' + //
                "proj=d2d"+
                "&admin="+ ev.data.uid +
                "&func=getreserved" +
                "&date=" + dateTimeAr +
                "&lang=" + window.sets.lang;

            console.log(url);

            $.ajax({
                url: url,
                method: "GET",
                dataType: 'json',
                processData: false,
                async: true,   // asynchronous request? (synchronous requests are discouraged...)
                cache: false,
                crossDomain: true,
                success: function (resp, msg) {


                },
                error: function (xhr, status, error) {
                    //var err = eval("(" + xhr.responseText + ")");

                    console.log(error.Message);
                    console.log(xhr.responseText);

                },
                complete: function (data) {
                    //alert(data.responseText);
                },
            });

        } catch (ex) {
            console.log(ex);
        }
    }



    UpdateReservation(event, table_id, data_obj,cb) {

        let time = $('.sel_time').text();
        if(!this.order[time])
            this.order[time]={};
        if (!this.order[time][this.uid])
            this.order[time][this.uid] = {};
        if (!this.order[time][this.uid][table_id])
            this.order[time][this.uid][table_id] = data_obj?data_obj[this.uid][table_id]:
                {'menu_1':{'order':{}},'menu_2':{'order':{}}};

        if(window.demoMode) {
            this.ClearTableReserve();
            this.SetTables(this.order,this);
            return;
        }
        let url = host_port;
        let data =
            "proj=d2d"+
            "&func=updatereservation"+
            "&user="+localStorage.getItem('user')+
            "&time="+time+
            "&date="+event.data.date+
            "&table="+table_id+
            "&menus="+urlencode.encode(JSON.stringify(this.order[time][this.uid][table_id]))+
            "&lang="+window.sets.lang;
//'{"'+res[0].id + '":{"order": {},"from":"'+$('#period_1').find('.from')[0].getAttribute('text').value+'","to":"'+$('#period_1').find('.to')[0].getAttribute('text').value+'"}}';

        $.ajax({
            url: url,
            method: "POST",
            dataType: 'json',
            data: data,
            class_obj:event.data,
            cb:cb,
            success: function (resp) {
                let arr = resp;
                if(isJSON(resp))
                    arr = JSON.parse(resp);
                if(resp.user) {
                    localStorage.setItem("user", resp.user);//
                }
                if(!arr) {
                    new TWEEN.Tween($('#target')[0].object3D.position).to({
                        y: 0,
                        x: 0,//_x * visible_width,
                        z: 0 //_y * visible_height
                    }, 1000)
                        .repeat(0)//Infinity)
                        .onUpdate(function () { // Called after tween.js updates
                            //document.querySelector('#camera').setAttribute('camera', 'fov', '60');
                        })
                        .easing(TWEEN.Easing.Quadratic.In).start();
                } else {

                }
            },
            error: function(xhr, status, error){
                //let err = eval("(" + xhr.responseText + ")");
                localStorage.removeItem("user");//
                console.log(error.Message);
                //alert(xhr.responseText);
            },
            complete: function (data) {
                //alert(data.responseText);
                if(this.cb)
                    this.cb();
            },
        });
    }

    UpdateOrder(order, date) {

        let time = $('.sel_time').text();
        this.order[time] = order;

        if(window.demoMode){

            this.ClearTableReserve();
            this.SetTables(this.order,this);

            return;
        }

        let url = host_port
        let data =
            "proj=bm"+
            "&func=updateorder"+
            "&admin="+localStorage.getItem('admin')+
            "&lat="+this.lat_param+
            "&lon="+this.lon_param+
            "&date="+date+
            "&order="+JSON.stringify(this.order).replace(/'/g,'%27').replace(/\n/g,'%0D').replace(/\n/g,'%0D').replace(/"/g,'\"')+
            "&lang="+window.sets.lang;

        $.ajax({
            url: url,
            method: "POST",
            dataType: 'json',
            data: data,
            class_obj:this,
            success: function (resp) {
                let arr = resp;
                if(isJSON(resp))
                    arr = JSON.parse(resp);
                if(!arr) {

                } else {

                    if(arr.msg)
                        console.log(arr.msg);

                }
            },
            error: function(xhr, status, error){
                //let err = eval("(" + xhr.responseText + ")");
                console.log(error.Message);
                alert(xhr.responseText);
            },
            complete: function (data) {
                //alert(data.responseText);
            },
        });
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

}















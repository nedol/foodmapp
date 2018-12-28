'use strict'
export {Supplier};

let utils = require('../utils/utils');
var isJSON = require('is-json');

import {Offer} from '../offer/offer';
import {Dict} from '../dict/dict.js';
import {Network} from "../../network";

//import {RTCOperator} from "../rtc/rtc_operator"

import {OLMap} from '../map/map'


import proj from 'ol/proj';
import Point from 'ol/geom/point';
import Feature from 'ol/feature';

import {Overlay} from "../map/overlay/overlay";


let md5 = require('md5');

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

        this.offer = new Offer(uObj);

        this.uid = uObj.profile.uid;
        this.email = uObj.profile.email;

        this.map = new OLMap();

        this.isShare_loc = false;

    }

    IsAuth_test(cb){

        this.map.Init();
        window.network.InitSSE(this,function () {

        });

        $.getJSON('../dict/sys.dict.json', function (data) {
            window.sysdict = new Dict(data);
            window.sysdict.set_lang(window.sets.lang, $('body'));
            window.sysdict.set_lang(window.sets.lang, $('#categories'));

            window.db.GetStorage('dictStore', function (rows) {
                window.dict = new Dict(rows);
            });

            cb();
        });

        //class_obj.menu.menuObj = JSON.parse(data.menu);
        //this.rtc_operator = new RTCOperator(this.uid, this.email,"browser", window.network);

        $('#main_menu').on('click touch', this, this.offer.OpenOfferEditor);

        this.DateTimePickerEvents();
    }

    IsAuth(cb) {

        try {

            window.network = new Network(host_port);
            window.network.InitSSE(this,function () {

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

            window.network.postRequest(data_obj, function (data) {
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
                        if(data.data) {
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
                        that.editor.menuObj = JSON.parse(data.data);
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

            $('#my_truck').css('visibility','visible');


            if(that.my_truck_ovl) {
                that.my_truck_ovl.RemoveOverlay();
                that.my_truck_ovl = '';
            }

            that.offer.GetOfferDB(that.date, function (res) {
                if(!res) {//TODO:
                    that.offer.GetAllOffersDB(function (res) {
                        that.offer.stobj.data = res[0].data;
                    });

                }else {
                    that.offer.stobj.date = res.date;
                    if(res.data)
                        that.offer.stobj.data = res.data;
                    if(that.offer.stobj.location && that.offer.stobj.location.length===2) {
                        that.offer.editor.location = res.location;
                    }
                }

                if(that.offer.stobj.location) {
                    that.map.MoveToLocation(that.offer.stobj.location);
                    let my_truck_2 = $('#my_truck').clone()[0];
                    $(my_truck_2).attr('id', 'my_truck_2');
                    let status;
                    if (!that.offer.stobj.published)
                        status = 'unpublished';
                    else
                        status = 'published';
                    $(my_truck_2).addClass(status);
                    that.my_truck_ovl = new Overlay(that.map, my_truck_2, that.offer.stobj.location);
                    $('#my_truck').css('visibility', 'hidden');
                }

            });

            that.map.import.DownloadOrders(function () {
                window.db.GetOrders(window.user.date, window.user.email, function (objs) {
                    if(objs!=-1){
                        let type = 'customer';
                        for(let o in objs) {
                            window.user.map.geo.SearchLocation(objs[o].address, function (bound, lat, lon) {
                                let loc = proj.fromLonLat([parseFloat(lon),parseFloat(lat)]);
                                var markerFeature = new Feature({
                                    geometry: new Point(loc),
                                    labelPoint: new Point(loc),
                                    //name: cursor.value.title ? cursor.value.title : "",
                                    //tooltip: cursor.value.title ? cursor.value.title : "",
                                    type:type,
                                    object: objs[o]
                                });
                                var id_str = md5(window.user.date+objs[o].cusem);
                                markerFeature.setId(id_str);

                                let layer = that.map.ol_map.getLayers().get(type);
                                if (!layer) {
                                    layer = that.map.layers.CreateLayer(type, '1');
                                }
                                let source = layer.values_.vector;

                                if (!source.getFeatureById(markerFeature.getId()) && markerFeature.values_.object.date===window.user.date)
                                    that.map.layers.AddCluster(layer, markerFeature);
                            });
                        }
                    }
                });
            });
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
            that.offer.stobj.location = coor;

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

    UpdateOfferLocal(tab, offer, location, dict){

        let uObj = this.offer.stobj;
        if (uObj) {
            for(let tab in offer)
                if(!tab)
                    continue;
            for(let i in offer[tab]){
                if(!uObj.data[tab])
                    uObj.data[tab] = {};
                if(uObj.data[tab][i] && !offer[tab][i].img_left)
                    offer[tab][i].img_left = uObj.data[tab][i].img_left;
                if(uObj.data[tab][i] && !offer[tab][i].img_top)
                    offer[tab][i].img_top = uObj.data[tab][i].img_top;
            }
            uObj.data[tab] = offer[tab];
            uObj.period = $('.sel_time').text();
            this.offer.stobj.data[tab] = offer[tab];
            }else {
                uObj = {
                    "date":window.user.date,
                    "period": $('.sel_time').text(),
                    "location": location,
                    "data": offer
                };
            }
            this.offer.SetOfferDB(uObj,dict);
    }

    ValidateOffer(data){
        return true;//TODO:
        for(let tab in data) {
            if(data[tab].length===0)
                return false;
            for(let i in data[tab])
            if (!data[tab][i].checked || !parseInt(data[tab][i].price) || !data[tab][i].title){
                return false;
            }
        }
        return true;
    }


    PublishOffer(data, date, location, cb){
        let that = this;
        if(!this.offer.stobj.location || location.length===0){
            this.PickRegion();
            return;
        }

        let data_obj = {
            "proj": "d2d",
            "func": "updateoffer",
            "uid": that.uid,
            "email":that.email,
            "categories": that.offer.editor.arCat,
            "date": date,
            "period": $('.sel_time').text(),
            "location": proj.toLonLat(location),
            "offer": urlencode.encode(JSON.stringify(data)),
            "dict": JSON.stringify(window.dict)
        };

        window.network.postRequest(data_obj, function (res) {
            let data = res;
            if(data.err){
                console.log(data.err.code);
            }else if(data.result.affectedRows===1){
                that.offer.GetOfferDB(window.user.date, function (obj) {
                    obj.published = res.published;
                    that.offer.SetOfferDB(obj);
                    cb(obj);
                })

                $("#my_truck_2").removeClass('unpublished');
                $("#my_truck_2").addClass('published');
            }
        });
    }

    PickRegion(){
        let that = this;
        alert($('#choose_region').text());
        $('[data-dismiss=modal]').trigger('click');

        let my_truck_2 = $('#my_truck').clone()[0];
        $(my_truck_2).attr('id', 'my_truck_2');
        let status;
        if (!that.offer.stobj.published)
            status = 'unpublished';
        else
            status = 'published';
        $(my_truck_2).addClass(status);
        that.my_truck_ovl = new Overlay(that.map, my_truck_2, that.map.ol_map.getView().getCenter());
        $('#my_truck').css('visibility', 'hidden');
    }

    ApproveOrder(date,title,obj){

        let data_obj = {
            "proj": "d2d",
            "func": "approveorder",
            "uid": window.user.uid,
            "orderobj":{date:$(el).attr('orderdate'),supem:window.user.email, cusem:$(el).attr('cusem')},
            "title":title,
            "data": obj.data[title]
        }

        window.user.network.postRequest(data_obj, function (resp) {
            if(resp['err']){

            }else {
                obj.data[Object.keys(obj.data)[0]].approved = moment().format('YYYY-MM-DD h:mm:ss');
                window.db.SetObject('approveStore', obj, function (res) {
                });
            }
        });
    }

    SendLocation(loc){

        if (this.isShare_loc) {
                let location = proj.toLonLat(loc);
               location[0] = parseFloat(location[0].toFixed(6));
               location[1] = parseFloat(location[1].toFixed(6));
                let data_obj = {
                    "proj": "d2d",
                    "func": "sharelocation",
                    "uid": window.user.uid,
                    "supem": this.email,
                    "date": this.date,
                    "location": location
                };

                window.user.network.postRequest(data_obj, function (data) {
                    console.log(data);
                });

            if(window.user.my_truck_ovl ) {
                window.user.my_truck_ovl.overlay.setPosition(loc);
            }
        }
    }



    OnMessage(data){
        if(data.func ==='ordered'){//TODO:
            window.db.SetObject('orderStore',data.order,(res)=>{
                for(let ord in data.order.data) {
                    $('[data-translate='+ord+']').attr('status','ordered');
                }
            });

        }
        if(data.func ==='sharelocation'){
            let loc = data.location;
            window.db.GetObject('supplierStore',window.user.date,data.email, function (obj) {
                if(obj!=-1) {
                    obj.latitude = loc[1];
                    obj.longitude = loc[0];
                    let layers = window.user.map.ol_map.getLayers();
                    window.db.SetObject('supplierStore', obj, function (res) {
                        let catAr = JSON.parse(obj.categories);
                        for (let c in catAr) {
                            let l = layers.get(catAr[c])
                            let feature = l.values_.vector.getFeatureById(obj.hash);
                            if (feature) {
                                let point = feature.getGeometry();
                                let loc =  proj.fromLonLat([obj.longitude, obj.latitude]);
                                if(point.flatCoordinates[0]!==loc[0] && point.flatCoordinates[1]!==loc[1])
                                    window.user.map.SetFeatureGeometry(feature,loc);
                            }
                        }

                    });
                }
            });
        }
    }


}















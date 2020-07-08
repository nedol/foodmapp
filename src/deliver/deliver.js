'use strict'


require('webpack-jquery-ui/draggable');

require('jquery-ui-touch-punch');

require('popper.js');
require('bootstrap');

import {Utils} from "../utils/utils";
let utils = new Utils();


import "add-to-homescreen/dist/style/addtohomescreen.css"
import "add-to-homescreen/dist/addtohomescreen.min.js"

import '../../lib/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min';
import '../../lib/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css';

import 'tablesorter/dist/css/theme.default.min.css';

import {OLMap} from '../map/map'

import proj from 'ol/proj';
import Point from 'ol/geom/point';
import Feature from 'ol/feature';

import {Overlay} from "../map/overlay/overlay";

import {Profile} from "../profile/profile";

import {Import} from "../import/import";
import {OfferDeliver} from "./init.offer.deliver";
import {OfferOrder} from "./init.frame";
import {Events} from '../map/events/events';

var urlencode = require('urlencode');

var ColorHash = require('color-hash');


import {Offer} from '../offer/offer';
import {Dict} from '../dict/dict.js';

const MSG_NO_REG = 0x0001;

(function($) {
    $.fn.longTap = function(longTapCallback) {
        return this.each(function(){
            var elm = this;
            var pressTimer;
            $(elm).on('touchend', function (e) {
                clearTimeout(pressTimer);
            });
            $(elm).on('touchstart', function (e) {
                // Set timeout
                pressTimer = window.setTimeout(function () {
                    longTapCallback.call(elm);
                }, 500)
            });
        });
    }
})(jQuery);

(function($) {
    $.fn.dblTap = function(dblTapCallback) {
        var timer = 0;
        return this.each(function(){
            if(timer == 0) {
                timer = 1;
                timer = setTimeout(function(){ timer = 0; }, 600);
            }
            else { alert("double tap"); timer = 0; }
        });
    }
})(jQuery);

$(document).on("click" , "#target" , function() {

});

require("../../lib/DragDropTouch.js");
require("../../lib/blueimp-load-image/js/load-image.all.min.js");


export class Deliver{

    constructor(uObj) {
        addToHomescreen();

        this.path  ="http://localhost:63342/d2d/server";
        if(host_port.includes('nedol.ru'))
            this.path = host_port;

        this.date = new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));

        this.user_ovl;

        if(uObj) {

            let that = this;

            this.editor = new OfferDeliver();//offer editor

            this.uid = uObj.set.uid;
            this.psw = uObj.set.psw;
            this.promo = uObj.set.promo;
            this.prolong = uObj.set.prolong;
            this.email = uObj.set.profile.email;

            this.profile = new Profile(uObj.set.profile);
            this.profile.InitSupplierProfile(this);

            this.offer = new Offer(this.date, uObj);
            this.map = new OLMap();
            this.map.Init(uObj.latitude, uObj.longitude);
            this.offer.stobj.data = uObj.data;
            uObj.date = this.date;
            window.db.SetObject("offerStore", uObj, function(){

            });

            this.import = new Import(this.map);

            this.isShare_loc = false;

            this.events = new Events(this.map);
        }

    }


    IsAuth_test(lat, lon,cb){
        let that = this;

        window.network.InitSSE(this,function () {

        });

        $.getJSON('../src/dict/sys.dict.json?v=2', function (data) {
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

        $('.open_off_editor').on('click', this, this.editor.OpenOffer);

        this.DateTimePickerEvents();

        this.map.ol_map.on('click', function (event) {
            if (!event.loc_mode) {
                that.map.geo.StopLocation();
                window.user.isShare_loc = false;
            }

            if(event.coordinate) {
                var latlon = proj.toLonLat(event.coordinate);
                $('#locText').text(latlon[1].toFixed(6) + " " + latlon[0].toFixed(6));
                // and add it to the Map

                window.sets.coords.cur = event.coordinate;
            }

            $('#datetimepicker').data("DateTimePicker").hide();

            var time = new Date().getTime();
            localStorage.setItem("cur_loc", "{\"lon\":" + window.sets.coords.cur[0] + "," +
                "\"lat\":" + window.sets.coords.cur[1] + ", \"time\":" + time + "}");

            if (!event.loc_mode && $('#categories').is(':visible'))
                $('#categories').slideToggle('slow', function () {
                    $('.dropdown-menu').removeClass('show');
                });

            if (!event.loc_mode && $('.sup_menu').is(':visible')) {
                $('.sup_menu').animate({'width': 'toggle'});
            }

            if (!event.loc_mode && $('#menu_items').is(':visible'))
                $('#menu_items').slideToggle('slow', function () {
                });

            if(event.pixel)
                that.map.ol_map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
                    let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

                    let closest = feature.getGeometry().getClosestPoint(event.pixel);

                    if(feature.values_)
                        if(feature.values_.features && feature.values_.features.length >1) {//cluster

                            var coordinates = [];
                            $.each(feature.values_.features, function (key, feature) {
                                coordinates.push(feature.getGeometry().flatCoordinates);
                            });

                            var extent = Extent.boundingExtent(coordinates);
                            var buf_extent = Extent.buffer(extent, 5);
                            //ol.extent.applyTransform(extent, transformFn, opt_extent)
                            that.map.ol_map.getView().fit(buf_extent, {duration: window.sets.animate_duration});

                            that.map.ol_map.getView().animate({
                                    center: feature.getGeometry().flatCoordinates, duration: window.sets.animate_duration
                                },
                                function () {

                                });
                        }else {

                            if(feature){
                                if(feature.values_.features && feature.values_.features.length === 1)
                                    feature = feature.values_.features[0];

                                if (feature.values_.type === 'supplier') {
                                    window.db.GetSupplier(new Date(window.user.date), feature.values_.object.uid, function (obj) {
                                        if (obj !== -1) {
                                            //window.user.viewer = new OfferDeliver(obj.dict);
                                            //$("a[href=#profile]").text('Мой профиль')

                                            if (!window.user.viewer) {
                                                window.user.viewer = new OfferOrder();
                                            }
                                            window.user.viewer.InitCustomerOrder(obj);

                                            return true;

                                        }
                                    });
                                } else if (feature.values_.type === 'customer') {
                                    window.db.GetSupOrders(date, feature.values_.object.supuid, function (objs) {
                                        let orderViewer = new OrderViewer();
                                        orderViewer.InitOrders(objs);

                                        return true;
                                    });
                                }

                            }
                        }

                });
        });

    }


    DateTimePickerEvents(){
        let that = this;

        // $('.date').on("click",this,function (ev) {
        //     $('#datetimepicker').data("DateTimePicker").toggle();
        // });

        // $('.dt_val').on('change',function (ev) {
        //     $('#datetimepicker').data("DateTimePicker").viewDate($('.dt_val').val());
        //     $('#datetimepicker').trigger("dp.change");
        //
        // });
        $('#datetimepicker').on("dp.change",this, function (ev) {

            that.date = new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));

            $('.dt_val').text($('#datetimepicker').data("DateTimePicker").date().format('LL'));

            $('.sel_period').find('option').css('visibility','visible');

            $(this).data("DateTimePicker").toggle();

            let layers = that.map.ol_map.getLayers();
            layers.forEach(function (layer, i, layers) {
                if (layer.type === "VECTOR") {
                    if (layer.getSource())
                        layer.getSource().clear(true);
                    if (layer.getSource().source) {
                        layer.getSource().source.clear(true);
                    }
                }
            });

            if(that.map.layers && that.map.layers.circleLayer) {
                let source = that.map.layers.circleLayer.getSource();
                source.clear();
            }

            $('.sel_period').text('06:00 - 24:00');


            $('#user').css('visibility','visible');


            if(that.user_ovl) {
                that.user_ovl.RemoveOverlay();
                that.user_ovl = '';
            }

            that.map.GetObjectsFromStorage();


            if(that.prolong==='1') {
                window.db.GetOfferTmplt(function (obj) {
                    if(obj) {
                        obj.date = that.date;
                        window.db.SetObject('offerStore', obj, function (res) {
                            getOfferData();
                        });
                    }else{
                        getOfferData();
                    }
                });
            }else{
                getOfferData();
            }

            function getOfferData() {
                if(that.offer.stobj.data) {
                    let not_empty = $.grep(that.offer.stobj.data, function (el, i) {
                        return (el && !_.isEmpty(el.data));
                    });

                    setTimeout(function () {
                        if (that.offer.stobj.location && that.offer.stobj.location[0] && that.offer.stobj.location[1])
                            that.map.MoveToLocation(that.offer.stobj.location, null, function () {

                            });
                    }, 100);
                }

                let user_cont = $('#user_container').clone()[0];
                $(user_cont).find('img').attr('id', 'user_2');
                let pos;
                $('#user_container').draggable(
                    {delay:100},
                    {
                        //cancel: ".non_draggable",
                        start: function (ev) {
                            console.log("drag start");
                            pos = $(this).offset();
                        },
                        drag: function (ev) {
                            //$(el).attr('drag', true);
                        },
                        stop: function (ev) {
                            console.log("drag stop");

                            let pixel =[ev.originalEvent.clientX, ev.originalEvent.clientY]; //$('#user_container').offset();//;
                            let coor = that.map.ol_map.getCoordinateFromPixel(pixel);//([pixel.left,pixel.top]);
                            window.user.offer.stobj.location = coor;
                            that.user_ovl.overlay.values_.position = coor;

                            that.map.ol_map.render();
                            $(this).offset(pos);
                        }
                    });


                let status;
                if (!that.offer.stobj.published)
                    status = 'unpublished';
                else
                    status = 'published';

                $(user_cont).find('img').addClass(status);

                that.offer.stobj.profile = that.profile.profile;
                that.offer.stobj.profile.type = 'deliver';
                that.offer.stobj.profile.lang = window.sets.lang;

                if(!that.offer.stobj.latitude &&  !that.offer.stobj.longitude) {
                    that.offer.stobj.latitude = 0;
                    that.offer.stobj.longitude = 0;

                    $('#loc_ctrl').trigger('click');
                }

                that.map.CreateOverlay(that.offer.stobj, function () {
                    if(that.profile.profile.avatar) {
                        $('#user_container').find('img').attr('src', that.path + '/images/' + (that.profile.profile.avatar));
                        $('#user').attr('src', that.path + '/images/' + (that.profile.profile.avatar));
                    }
                });



                $('#map').on('drop',function (ev, data) {
                    ev.preventDefault();
                    let coor;
                    if(data)
                        coor = data.coordinate;
                    else {
                        let pixel = [ev.originalEvent.clientX, ev.originalEvent.clientY];
                        coor = that.map.ol_map.getCoordinateFromPixel(pixel);
                    }
                    if(!that.offer.stobj)
                        that.offer.stobj = {};
                    that.offer.stobj.location = coor;
                    that.offer.stobj.longitude = proj.toLonLat(coor)[0];
                    that.offer.stobj.latitude = proj.toLonLat(coor)[1];
                    if(!window.user.user_ovl) {
                        let user_cont = $('#user_container').clone()[0];
                        $(user_cont).find('img').attr('id', 'user_2');

                        if (that.profile.profile.avatar)
                            $(user_cont).find('img').attr('src',  that.path + '/images/' + that.profile.profile.avatar);
                        else
                            $(user_cont).find('img').attr('src', that.path + '/images/' + '4ca7b7589b452a63ef7c34acdc61ad48');

                        let status;
                        if (!that.offer.stobj.published)
                            status = 'unpublished';
                        else
                            status = 'published';
                        $(user_cont).addClass(status);
                        that.offer.stobj.profile = that.profile.profile;
                        that.offer.stobj.profile.type = 'marketer';
                        that.offer.stobj.profile.lang = window.sets.lang;
                        that.offer.stobj.uid = window.user.uid;
                        that.map.CreateOverlay(that.offer.stobj, function () {

                        });

                        //$('#user').css('visibility', 'hidden');
                    }else{
                        window.user.user_ovl.overlay.values_.position = coor;
                        if(window.user.user_ovl.modify)
                            window.user.user_ovl.modify.features_.array_[0].values_.geometry.setCenter(coor);
                        window.user.user_ovl.overlay.changed();
                    }

                    window.db.GetOffer(new Date(window.user.date),function (of) {
                        if(of[0]) {
                            of[0].location = coor;
                            window.db.SetObject('offerStore', of[0], res => {

                            });
                        }
                    });
                });


                that.import.GetOrderSupplier(function () {
                    var md5 = require('md5');
                    window.db.GetSupOrders(window.user.date, window.user.uid, function (objs) {

                        let type = 'customer';
                        for(let o in objs) {
                            window.user.map.geo.SearchLocation(objs[o].address, function (bound, lat, lon) {
                                if(lat && lon) {
                                    let loc = proj.fromLonLat([parseFloat(lon), parseFloat(lat)]);
                                    var markerFeature = new Feature({
                                        geometry: new Point(loc),
                                        labelPoint: new Point(loc),
                                        //name: cursor.value.title ? cursor.value.title : "",
                                        //tooltip: cursor.value.title ? cursor.value.title : "",
                                        type: type,
                                        object: objs[o]
                                    });
                                    var id_str = md5(window.user.date + objs[o].cusuid);
                                    markerFeature.setId(id_str);

                                    let layer = that.map.ol_map.getLayers().get(type);
                                    if (!layer) {
                                        layer = that.map.layers.CreateLayer(type, '1');
                                    }
                                    let source = layer.values_.vector;

                                    if (!source.getFeatureById(markerFeature.getId()) && markerFeature.values_.object.date === window.user.date)
                                        that.map.layers.AddCluster(layer, markerFeature);
                                }
                            });
                        }

                    });
                });

                that.import.GetApprovedSupplier(function (res) {

                });
            }

        });

        $("#map").on('dragstart',function (ev) {

        });

        $('#map').on('dragover',function (ev) {
            ev.preventDefault();
        });

    }


    UpdateOfferLocal(offer){
        this.offer.SetOfferDB(offer);
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


    PublishOffer(menu, date, data, cb){

        let that = this;
        if(window.user.constructor.name==="Customer" && (!this.offer.stobj.location || location.length===0)){
            this.PickRegion();
            return;
        }
        try {
            let data_obj = {
                proj: 'd2d',
                user: window.user.constructor.name.toLowerCase(),
                func: 'updateoffer',
                host: window.location.origin,
                uid: that.uid,
                psw: that.psw,
                categories: data.arCat,
                date: date,
                location: proj.toLonLat(this.offer.stobj.location),
                radius: that.offer.stobj.radius ? that.offer.stobj.radius : '1000',
                offer: urlencode.encode(JSON.stringify(menu)),
                dict: JSON.stringify(window.dict)
            };

            window.network.postRequest(data_obj, function (res) {
                let data = res;
                if (data && data.result.affectedRows > 0) {
                    $('.loader').css('display', 'none');
                    alert({ru:"Опубликовано: " + res.published,en:"Published:" + res.published}[window.parent.sets.lang], null, 3000);

                    $("#user_2").removeClass('unpublished');
                    $("#user_2").addClass('published');
                    cb(data);

                }
                if (data && data.err.includes('регистрацию')) {
                    if (confirm(data.err)) {
                        //alert({text:data.err,link:data.link},'alert-warning');
                        window.location.replace(data.link);
                    }
                }
                return;
            });

        }catch(ex){
            cb();
        }
    }

    PickRegion(){
        let that = this;
        alert($('#choose_region').text());
        $('[data-dismiss=modal]').trigger('click');

        let user_2 = $('#user').clone()[0];
        $(user_2).attr('id', 'user_2');
        let status;
        if (!that.offer.stobj.published)
            status = 'unpublished';
        else
            status = 'published';
        $(user_2).addClass(status);
        that.user_ovl = new Overlay(that.map, user_2, that.map.ol_map.getView().getCenter());
        $('#user').css('visibility', 'hidden');
    }

    ApproveOrder(obj, title){

        let data_obj = {
            proj: 'd2d',
            func: 'approveorder',
            uid: window.user.uid,
            psw: window.user.psw,
            user: window.user.constructor.name,
            date:obj.date,
            period: obj.period,
            supuid:obj.supuid,
            cusuid:obj.cusuid,
            title: title,
            data: obj.data[title]
        }

        window.network.postRequest(data_obj, function (resp) {
            if(resp['err']){

            }else {
                window.db.SetObject('approvedStore', data_obj,function (res) {

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
                proj: d2d,
                user: window.user.constructor.name.toLowerCase(),
                func: 'sharelocation',
                uid: window.user.uid,
                supuid: this.email,
                date: this.date,
                location: location
            };

            window.network.postRequest(data_obj, function (data) {
                console.log(data);
            });

            if(window.user.user_ovl ) {
                window.user.user_ovl.overlay.setPosition(loc);
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















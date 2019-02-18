'use strict'
export {Deliver};

let utils = require('../utils/utils');
var isJSON = require('is-json');

import {Offer} from '../offer/offer';
import {Dict} from '../dict/dict.js';
require('bootstrap');

import 'eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min';
import 'eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css';

import {OLMap} from '../map/map'
import proj from 'ol/proj';
import Point from 'ol/geom/point';
import Feature from 'ol/feature';
import {Overlay} from "../map/overlay/overlay";
import {Profile} from "../profile/profile";
import {OrderViewer} from "../order/order.viewer";

import {Import} from "../import/import";
import {OfferEditorDeliver} from "../offer/offer.editor.deliver";

let md5 = require('md5');

var urlencode = require('urlencode');

var ColorHash = require('color-hash');

require('bootstrap');
require('bootstrap-select');

require('bootstrap/js/modal.js');


class Deliver{

    constructor(uObj) {

        this.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        this.my_truck_ovl;

        this.offer = new Offer(this.date,uObj);
        this.editor = new OfferEditorDeliver();//offer editor

        this.uid = uObj.set.uid;
        this.psw = uObj.set.psw;
        this.email = uObj.set.profile.email;

        this.profile = new Profile(uObj.set.profile);
        this.profile.InitSupplierProfile();

        this.map = new OLMap();

        this.viewer = new OrderViewer();

        this.import = new Import(this.map);

        this.isShare_loc = false;

    }

    IsAuth_test(cb){
        let that = this;

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

        this.GetOffersDeliver();

        //class_obj.menu.menuObj = JSON.parse(data.menu);
        //this.rtc_operator = new RTCOperator(this.uid, this.email,"browser", window.network);

        $('.open_off_editor').on('click touch', this, this.offer.OpenOfferEditor);
        $('.open_my_profile').on('click touch', this, this.profile.OpenMyProfile);

        this.DateTimePickerEvents();

        $( "#period_list" ).selectable({
            stop: function() {
                var result;
                $( ".ui-selected", this ).each(function(i) {
                    let index = $( "#period_list li" ).index( this );
                    if(i===0)
                        result = $($( "#period_list li")[index]).text().split(' - ')[0];
                    if($( ".ui-selected").length===i+1)
                        result+=" - "+ $($( "#period_list li")[index]).text().split(' - ')[1];
                });
                $('.sel_period').text(result);

                window.db.GetOffer(that.date, function (off) {
                    if(off) {
                        off.period = result;
                        window.db.SetObject('offerStore', off, function (res) {

                        });
                    }
                });
            }
        });

    }

    GetOffersDeliver() {

        let that = this;
        try {

            var data_obj ={
                proj:"d2d",
                user: this.constructor.name.toLowerCase(),
                func:"getoffers",
                uid: this.uid,
                psw: this.psw,
                email:this.email,
                date:this.date
            }

            window.network.postRequest(data_obj, function (data) {
                if(data.offer) {
                    let of_data ={date:window.user.date,data:{},supuid:''};
                    for (let i in data.offer) {
                        //delete data.offer[i].id;delete data.offer[i].supuid;
                        data.offer[i].data = JSON.parse(data.offer[i].data);
                        data.offer[i].uid = data.offer[i].supuid;
                        let dict_obj = JSON.parse(data.offer[i].dict).dict;
                        if (!window.dict)
                            window.dict = {dict: {}}
                        window.dict.dict = Object.assign(window.dict.dict, dict_obj);

                        window.db.SetObject('supplierStore', data.offer[i], function (res) {

                        });
                    }
                }
            });

        }catch(ex){
            console.log(ex);
        }
    }

    DateTimePickerEvents(){
        let that = this;

        $('#date').on("click touchstart",this,function (ev) {
            $('#datetimepicker').data("DateTimePicker").toggle();
        });


        $('#datetimepicker').on("dp.change",this, function (ev) {

            that.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

            $('.dt_val').val(that.date);

            $('.sel_period').find('option').css('visibility','visible');

            $(this).data("DateTimePicker").toggle();

            let layers = that.map.ol_map.getLayers();
            layers.forEach(function (layer, i, layers) {
                if(layer.constructor.name==="_ol_layer_Vector_") {
                    if(layer.getSource()) {
                        let features = layer.getSource().getFeatures();
                        features.forEach((feature) => {
                            layer.getSource().removeFeature(feature);
                        });
                    }
                }
            });

            $('.sel_period').text('06:00 - 24:00');

            if(!window.user.email)
                return;

            $('#my_truck').css('visibility','visible');

            let source = that.map.layers.circleLayer.getSource();
            source.clear();

            if(that.my_truck_ovl) {
                that.my_truck_ovl.RemoveOverlay();
                that.my_truck_ovl = '';
            }

            window.db.GetOffer(that.date, function (off) {
                if(off) {
                    if(!off.period)
                        off.period = '06:00 - 24:00';
                    $('.sel_period').text(off.period );
                }
            });

            that.offer.GetOfferDB(that.date, function (res) {
                if(!res) {
                    that.offer.GetOfferDB('tmplt',function (res) {
                        if(!res){
                            that.offer.stobj = {date:that.date}
                        }else{
                            that.offer.stobj = res;
                            that.offer.stobj.date = that.date;
                            delete that.offer.stobj.published;
                        }
                    });

                }else {
                    that.offer.stobj = res;
                }

                if(that.offer.stobj && that.offer.stobj.location) {

                    let my_truck_2 = $('#my_truck').clone()[0];
                    $(my_truck_2).attr('id', 'my_truck_2');
                    let status;
                    if (!that.offer.stobj.published)
                        status = 'unpublished';
                    else
                        status = 'published';
                    $(my_truck_2).addClass(status);
                    that.offer.stobj.radius = 1000;
                    that.my_truck_ovl = new Overlay(that.map, my_truck_2, that.offer.stobj);
                    $('#my_truck').on('click touchstart', (ev)=> {
                        if(that.offer.stobj.location)
                            that.map.MoveToLocation(that.offer.stobj.location);
                    });


                    setTimeout(()=>{
                        that.map.MoveToLocation(that.offer.stobj.location);
                    },300);

                }

                $('#map').on('drop',function (ev) {
                    ev.preventDefault();

                    let pixel = [ev.originalEvent.clientX, ev.originalEvent.clientY];
                    let coor = that.map.ol_map.getCoordinateFromPixel(pixel);
                    window.user.offer.stobj.location = coor;
                    if(!that.my_truck_ovl) {
                        let my_truck_2 = $('#my_truck').clone()[0];
                        $(my_truck_2).attr('id', 'my_truck_2');
                        let status;
                        if (!that.offer.stobj.published)
                            status = 'unpublished';
                        else
                            status = 'published';
                        $(my_truck_2).addClass(status);
                        that.my_truck_ovl = new Overlay(that.map, my_truck_2, that.offer.stobj);
                        //$('#my_truck').css('visibility', 'hidden');
                    }

                    that.my_truck_ovl.overlay.values_.position = coor;
                    that.my_truck_ovl.overlay.changed();
                    that.my_truck_ovl.modify.features_.array_[0].values_.geometry.setCenter(coor);
                    that.my_truck_ovl.modify.changed();

                    window.db.GetOffer(window.user.date,function (of) {
                        if(of) {
                            of.location = coor;
                            window.db.SetObject('offerStore', of, res => {

                            });
                        }
                    })
                });

            });

            that.import.GetOrderSupplier(function () {
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
        });

        $("#my_truck").on('dragstart',function (ev) {

        });

        $('#map').on('dragover',function (ev) {
            ev.preventDefault();
        });

    }

    OnClickTimeRange(ev){
        let that = this;
        let from = $(ev).text().split(' - ')[0];
        let to = $(ev).text().split(' - ')[1];
        $('.sel_period').text($(ev).text());
        $('#dt_from').val(from);
        $('#dt_to').val(to);
        let layers = this.map.ol_map.getLayers();
        layers.forEach(function (layer, i, layers) {
            if(layer.constructor.name==="_ol_layer_Vector_") {
                layer.getSource().refresh();
            }
        });
        window.db.GetOffer(that.date, function (off) {
            if(off) {
                off.period = $(ev).text();
                window.db.SetObject('offerStore', off, function (res) {

                });
            }
        })
    }

    UpdateOfferLocal(tab, offer, location, dict){

        let uObj = Object.assign(this.offer.stobj);
        uObj.data={};
        if (uObj) {
            for (let tab in offer) {
                for (let i in offer[tab]) {
                    if (!uObj.data[tab]) {
                        uObj.data[tab] = offer[tab];
                    }
                    if(!uObj.data[tab][i]){
                        uObj.data[tab].push({img:{}});
                    }
                    if(offer[tab][i].img) {
                        if (offer[tab] && offer[tab][i] && offer[tab][i].img.left)
                            uObj.data[tab][i].img.left = offer[tab][i].img.left;
                        if (offer[tab] && offer[tab][i] && offer[tab][i].img.top)
                            uObj.data[tab][i].img.top = offer[tab][i].img.top;
                    }
                }
                uObj.data[tab] = offer[tab];
                uObj.period = $('.sel_period').text();
                this.offer.stobj.data[tab] = offer[tab];
            }
        }else {
            uObj = {
                date:window.user.date,
                period: $('.sel_period').text(),
                location: location,
                data: offer
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


    PublishOffer(menu, date, data, cb){

        let that = this;
        if(!this.offer.stobj.location || location.length===0){
            this.PickRegion();
            return;
        }

        let data_obj = {
            proj: 'd2d',
            user: window.user.constructor.name.toLowerCase(),
            func: 'updateoffer',
            uid: that.uid,
            psw: that.psw,
            categories: that.editor.arCat,
            date: date,
            period: $('.sel_period').text(),
            location: proj.toLonLat(this.offer.stobj.location),
            radius: window.user.offer.stobj.radius,
            offer: urlencode.encode(JSON.stringify(menu)),
            dict: JSON.stringify(window.dict)
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















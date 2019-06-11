'use strict'
export {Customer};

let utils = require('../utils/utils');

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');

import {OrderViewer} from "../order/order.viewer";

require('../../lib/bootstrap-rating/bootstrap-rating.min.js')

import {Dict} from '../dict/dict.js';

//import {RTCOperator} from "../rtc/rtc_operator"

import {OLMap} from '../map/map';
import proj from 'ol/proj';
import Extent from 'ol/extent';

var urlencode = require('urlencode');

var ColorHash = require('color-hash');

import 'eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min';
import 'eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css';
import {Profile} from "../profile/profile";
import {Import} from "../import/import";
import {OfferOrder} from "./init.frame";

var moment = require('moment/moment');

window.TriggerEvent = function (el, ev) {
    $(el).trigger(ev);
}




class Customer{

    constructor(uObj) {

        this.date = new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));

        this.uid = uObj.uid;
        this.psw = uObj.psw;
        this.email = '';//!!! no need to registrate
        if(uObj['profile'] && uObj['profile'].email)
            this.email = uObj['profile'].email;
        this.profile = new Profile(uObj.profile);
        this.map = new OLMap();

        this.import = new Import(this.map);

    }

    IsAuth_test(cb){
        let that = this;

        this.map.Init();

        window.network.InitSSE(this,function () {

        });

        $.getJSON('../src/dict/sys.dict.json', function (data) {
            window.sysdict = new Dict(data);
            window.sysdict.set_lang(window.sets.lang, $('body'));
            window.sysdict.set_lang(window.sets.lang, $('#categories'));

            window.db.GetStorage('dictStore', function (rows) {
                window.dict = new Dict(rows);
            });
            cb();
        });

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

                let layers = that.map.ol_map.getLayers();
                layers.forEach(function (layer, i, layers) {
                    if(layer.constructor.name==="_ol_layer_Vector_") {
                        layer.getSource().refresh();
                    }
                });
                //not offer but selected period store
                window.db.SetObject('offerStore',{date:that.date,period:result},function (res) {

                });
            }
        });

        //class_obj.menu.menuObj = JSON.parse(data.menu);
        //this.rtc_operator = new RTCOperator(this.uid, this.email,"browser", window.network);
        // window.db.GetOffer(this.date,function (res) {
        //     if(res){
        //         $('.sel_period').text(res.period);
        //     }else{
        //         let time = $($('.period_list li')[0]).text();
        //         $('.sel_period').text(time);
        //     }
        // });
        this.DateTimePickerEvents();

        window.user.map.geo.SearchLocation("Москва, ФудСити",function (bound) {
            window.user.map.MoveToBound(bound);//{sw_lat: bound[0], sw_lng: bound[2], ne_lat: bound[1], ne_lng: bound[3]});

            $('#datetimepicker').trigger("dp.change");

        });

        this.map.ol_map.on('click', function (event) {
            if (!event.loc_mode) {
                that.map.geo.StopLocation();
                window.user.isShare_loc = false;
            }

            // $('.menu_item', $('.client_frame').contents()).remove();
            // $('#client_frame_container').css('display','none');
            // $('.carousel-indicators', $('.client_frame').contents()).empty();
            // $('.carousel-inner', $('.client_frame').contents()).empty();

            var degrees = proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');

            var latlon = proj.toLonLat(event.coordinate);
            $('#locText').text(latlon[1].toFixed(6) + " " + latlon[0].toFixed(6));
            // and add it to the Map

            window.sets.coords.cur = event.coordinate;

            $('#datetimepicker').data("DateTimePicker").hide();

            var time = new Date().getTime();
            localStorage.setItem("cur_loc", "{\"lon\":" + window.sets.coords.cur[0] + "," +
                "\"lat\":" + window.sets.coords.cur[1] + ", \"time\":" + time + "}");

            if (!event.loc_mode && $('#categories').is(':visible'))
                $('#categories').slideToggle('slow', function () {

                });
            if (!event.loc_mode && $('.sup_menu').is(':visible')) {
                $('.sup_menu').animate({'width': 'toggle'});
            }

            if (!event.loc_mode && $('#menu_items').is(':visible'))
                $('#menu_items').slideToggle('slow', function () {
                });



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
                                        if (window.user.constructor.name === 'Customer') {
                                            if (!window.user.viewer) {
                                                window.user.viewer = new OfferOrder();
                                            }
                                            window.user.viewer.InitCustomerOrder(obj);
                                        }
                                    }
                                });
                            } else if (feature.values_.type === 'customer') {
                                window.db.GetSupOrders(date, feature.values_.object.supuid, function (objs) {
                                    let orderViewer = new OrderViewer();
                                    orderViewer.InitOrders(objs);
                                });
                            }
                        }
                    }

                return true;
            });
        });

    }


    DateTimePickerEvents(){
        let that = this;

        $('#dt_from').on("dp.change",this, function (ev) {

            let date_from =  new moment($('#period_1').find('.from')[0].getAttribute('text').value, 'HH:mm');
            let date = moment($(this).data("DateTimePicker").date().format('HH:mm'), 'HH:mm');
            if(date.isBefore(date_from)) {
                $(this).data("DateTimePicker").toggle();
                return true;
            }
            $('#period_1').find('.from')[0].setAttribute('text', 'value', $(this).data("DateTimePicker").date().format('HH:00'));
            //$('#period_1').find('.to')[0].setAttribute('text', 'value', mom.add(4, 'h').format('HH:00'));

            let time = $('.sel_period').text();

            $(this).data("DateTimePicker").toggle();
        });

        $('.sel_period').on("dp.change",this,function (ev) {
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

        $('#date').on("click",this,function (ev) {
            $('#datetimepicker').data("DateTimePicker").toggle();
        });

        $('.period').find('.from').on("click",this,function (ev) {
            if($(ev.delegateTarget.parentEl).attr('id')==='period_1')
                $('#dt_from').data("DateTimePicker").toggle();
        });

        $('.period').find('.to').on("click", this,function (ev) {
            if($(ev.delegateTarget.parentEl).attr('id')==='period_1')
                $('#dt_to').data("DateTimePicker").toggle();
        });

        $('#datetimepicker').on("dp.change",this, function (ev) {

            that.date = new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));

            $('.dt_val').val($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));

            $('.sel_period').find('option').css('visibility','visible');
            $('.sel_period').text('06:00 - 24:00');

            $(this).data("DateTimePicker").toggle();

            $('#deliver_but').css('display','none');

            if (ev) {
                window.user.import.ImportDataByLocation(ev);
            }

            setTimeout(()=>{
                //TODO: that.map.MoveToLocation(that.offer.stobj.location);
            },300);

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

            $("#items_carousel").carousel('dispose');
            $('.carousel-item').remove();

            let source = that.map.layers.circleLayer.getSource();
            //source.clear();

             that.import.GetApprovedCustomer(function () {

            });

            //that.map.GetObjectsFromStorage();
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
        //not offer but selected period store
        window.db.SetObject('offerStore',{date:that.date,period:$(ev).text()},function (res) {

        });
    }

    PickRegion(){
        // alert($('.input_address').text());
    }

    UpdateOrderLocal(obj){
        obj.date = new Date(obj.date);
        window.db.SetObject('orderStore',obj,(res)=>{

        });

        this.viewer.order = obj.data;
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

    PublishOrder(obj,cb) {
        let that = this;

        obj.proj = "d2d";
        obj.user = window.user.constructor.name.toLowerCase(),
            obj.func = "updateorder";
        obj.psw = that.psw;
        obj.cusuid = that.uid;
        obj.supuid = obj.supuid;

        window.network.postRequest(obj, function (data) {
            if (data.published) {
                if (data.published) {
                    cb(data);
                    obj.proj = '';
                    obj.func = '';
                    obj.published = data.published;
                    that.UpdateOrderLocal(obj);
                }
            }
        });
    };
    //layers
    OnClickDeliver(el){
        window.db.GetSupplier(new Date(window.user.date), el.attributes.supuid.value, function (obj) {
            if (obj !== -1) {
                if (!window.user.viewer) {
                    window.user.viewer = new OfferOrder();
                }
                window.user.viewer.InitCustomerOrder(obj);
            }
        });
    }


    OnClickUserProfile(li){

        $('#my_profile_container').css('display','block');
        $('#my_profile_container iframe').on('load',function () {
            $('#my_profile_container iframe').off();
            $('#my_profile_container iframe')[0].contentWindow.InitProfileUser();

            $('.close_browser',$('#my_profile_container iframe').contents()).on('touchstart click', function (ev) {
                if($('#my_profile_container iframe')[0].contentWindow.profile_cus.Close())
                    $('#my_profile_container').css('display', 'none');
            });
        });
        $('#my_profile_container iframe').attr('src',"./profile.customer.html");


        // this.MakeDraggable($( "#my_profile_container" ));
        // $( "#my_profile_container" ).resizable({});



        //this.MakeDraggable($('body', $('#my_profile_container iframe').contents()));

    }

    // MakeDraggable(el){
    //     $(el).draggable({
    //         start: function (ev) {
    //             console.log("drag start");
    //
    //         },
    //         drag: function (ev) {
    //             //$(el).attr('drag', true);
    //
    //         },
    //         stop: function (ev) {
    //
    //             // var rel_x = parseInt($(el).position().left / window.innerWidth * 100);
    //             // $(el).css('right', rel_x + '%');
    //             // var rel_y = parseInt($(el).position().top / window.innerHeight * 100);
    //             // $(el).css('bottom', rel_y + '%');
    //         }
    //     });
    // }

    OnMessage(data){
        let that = this;
        if(data.func ==='approved'){
            data.order.date = new Date(data.order.date.split('T')[0]);
            window.db.GetOrder(data.order.date, data.order.supuid,data.order.cusuid, function (ord) {
                if(ord===-1)
                    return;
                ord.data[data.order.title].approved = data.order.data.approved;
                window.db.SetObject('orderStore', ord, (res)=> {
                    if(that.viewer)
                        that.viewer.OnMessage(data);
                });
            });
        }
        if(data.func ==='updateorder'){
            window.db.SetObject('orderStore',data,res=>{

            });
        }
        if(data.func ==='supupdate'){
            window.db.GetObject('supplierStore',data.obj.date,data.obj.email, function (res) {
                let obj = res;
                if(!obj) {
                    obj = data.obj;
                }
                obj.data = JSON.parse(urlencode.decode(data.obj.offer));
                obj.dict = JSON.parse(data.obj.dict);
                let loc = data.obj.location;
                obj.latitude = loc[1];
                obj.longitude = loc[0];
                delete obj.location; delete obj.offer; delete obj.proj; delete obj.func;
                let layers = window.user.map.ol_map.getLayers();
                window.db.SetObject('supplierStore',obj,function (res) {
                    let catAr = JSON.parse(obj.categories);
                    for (let c in catAr) {
                        let l = layers.get(catAr[c])
                        let feature = l.values_.vector.getFeatureById(obj.hash);
                        if (feature) {
                            let point = feature.getGeometry();
                            let loc = proj.fromLonLat([obj.longitude, obj.latitude]);
                            if (point.flatCoordinates[0] !== loc[0] && point.flatCoordinates[1] !== loc[1])
                                window.user.map.SetFeatureGeometry(feature, loc);
                        }
                    }
                });

            });
        }
        if(data.func ==='sharelocation'){
            let loc = data.location;
            window.db.GetObject('supplierStore',window.user.date,data.email, function (obj) {
                if(!obj) {
                    obj = {};
                }
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
                            let loc = proj.fromLonLat([obj.longitude, obj.latitude]);
                            if (point.flatCoordinates[0] !== loc[0] && point.flatCoordinates[1] !== loc[1])
                                window.user.map.SetFeatureGeometry(feature, loc);
                        }
                    }
                });
            });
        }
    }
}


class UserRegistry {
    constructor(){


    }

    OpenRegistry(){

        $("#auth_dialog").modal({
            show: true,
            keyboard:true
        });

        $("#auth_dialog").find(':submit').on('click', function () {
            $('#register').submit(function(e) {
                e.preventDefault(); // avoid to execute the actual submit of the form.

                let email = $(this).find('input[type="email"]').val();

                var data_obj ={
                    proj:"d2d",
                    func:"auth",
                    lang: window.sets.lang,
                    uid: this.uid,
                    email:email
                }

                window.network.postRequest(data_obj, function (data) {
                    let str = JSON.stringify({"email": email});//JSON.stringify()
                    localStorage.setItem('d2d_user',str);//
                });

                return false;
            });
        });
    }

}












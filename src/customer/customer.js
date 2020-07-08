'use strict'
export {Customer};

import {OrderViewer} from "../order/order.viewer";
import {Dict} from '../dict/dict.js';
import {Events} from '../map/events/events';
import {OLMap} from '../map/map';
import proj from 'ol/proj';
import Extent from 'ol/extent';
import '../../lib/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min';
import '../../lib/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css';
import {Profile} from "../profile/profile";
import {Import} from "../import/import";
import {OfferOrder} from "./init.frame";

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');
require('bootstrap');
require('bootstrap-select');
require('../../lib/bootstrap-rating/bootstrap-rating.min.js');

//import {RTCOperator} from "../rtc/rtc_operator"
// var ColorHash = require('color-hash');


import {Utils} from "../utils/utils";
import {Categories} from "../categories/categories";
let utils = new Utils();


window.TriggerEvent = function (el, ev) {
    $(el).trigger(ev);
}

jQuery.loadScript = function (url, callback) {
    jQuery.ajax({
        url: url,
        dataType: 'script',
        success: callback,
        async: true
    });
}

jQuery.longTap = function(longTapCallback) {
    return this.each(function(){
        var elm = this;
        var pressTimer;
        $(elm).on('touchend mouseup', function (e) {
            clearTimeout(pressTimer);
        });
        $(elm).on('touchstart mousedown', function (e) {
            // Set timeout
            pressTimer = window.setTimeout(function () {
                longTapCallback.call(elm);
            }, 500)
        });
    });
}



class Customer{

    constructor() {
        this.date = new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));
    }

    SetParams(uObj){
        this.uid = uObj.uid;
        this.psw = uObj.psw;
        this.email = '';//!!! no need to registrate
        if (uObj['profile'] && uObj['profile'].email)
            this.email = uObj['profile'].email;
        this.profile = new Profile(uObj.profile);

        this.orders = '';
    }

    IsAuth_test(cb){
        let that = this;

        console.log(navigator.userAgent);

        if(!this.profile.profile.email && !this.profile.profile.mobile) {

            setTimeout(function () {
                $(that.map.ol_map).trigger('moveend');
            },3000);

            this.map = new OLMap();
            this.import = new Import(this.map);

            this.events = new Events(this.map);

            that.import.LoadDataByKey(window.user.uid, 'demo', function (res) {

            });

            that.map.Init(0,0);

            that.map.EmptyMap();
            that.import.GetApprovedCustomer(that.uid);
            that.map.ol_map.on('click', function (event) {
                if(!event.loc_mode)
                    event.loc_mode = false;
                that.OnMapClick(event);
            });
        }

        $('#category_container').load('./html/categories/food.'+window.sets.lang+'.html?v='+String(Date.now())+' #cat_incl',()=> {
            this.categories = new Categories(this);

        });

        $('#profile_but').on('click touchstart',{data:'orders'}, this.OnClickUserProfile);

        that.MakeDraggableCarousel($('#items_carousel')[0]);

        window.network.InitSSE(this,function () {

        });

        $.getJSON('../src/dict/sys.dict.json?v='+new Date().valueOf(), function (data) {
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
                let result = '';
                $( ".ui-selected", this ).each(function(i) {
                    let index = $( "#period_list a" ).index( this );
                    if(i===0)
                    result = $($( "#period_list a")[index]).text().split(' - ')[0];
                    if($( ".ui-selected").length===i+1)
                        result+=" - "+ $($( "#period_list a")[index]).text().split(' - ')[1];
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

        this.DateTimePickerEvents();

        $('#datetimepicker').trigger("dp.change");




    }


    OnMapClick(event) {
        let that = this;
        if (!event.loc_mode) {
            that.map.geo.StopLocation();
            window.user.isShare_loc = false;
        }

        if(isNaN(event.coordinate[0]) || isNaN(event.coordinate[1]))
            return;

        // $('.menu_item', $('.client_frame').contents()).remove();
        // $('#client_frame_container').css('display','none');
        // $('.carousel-indicators', $('.client_frame').contents()).empty();
        // $('.carousel-inner', $('.client_frame').contents()).empty();

        var degrees = proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');

        var lonlat = proj.toLonLat(event.coordinate);
        $('#locText').text(lonlat[1].toFixed(6) + " " + lonlat[0].toFixed(6));
        // and add it to the Map

        window.sets.coords.cur = event.coordinate;

        $('#datetimepicker').data("DateTimePicker").hide();

        var time = new Date().getTime();

        localStorage.setItem("cur_loc", "{\"lon\":" + lonlat[0] + "," +
            "\"lat\":" + lonlat[1] + ", \"time\":" + time + ",\"zoom\":"+that.map.ol_map.getView().getZoom()+"}");

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


        that.map.ol_map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
        // that.map.ol_map.getFeaturesAtPixel(event.pixel, null, function (feature, layer) {
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
                        }else if(feature.values_.type === 'foodtruck'){
                            that.map.Carousel([feature.values_.object]);
                        }
                    }
                }

        });

    }

    DateTimePickerEvents(){
        let that = this;

        $('#dt_from').on("dp.change",this, function (ev) {
            let moment = require('moment/moment');
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

            $('.dt_val').text($('#datetimepicker').data("DateTimePicker").date().format('LL'));

            $('.sel_period').find('option').css('visibility','visible');
            $('.sel_period').text('06:00 - 24:00');

            $(this).data("DateTimePicker").toggle();

            if(that.import)
                that.import.GetApprovedCustomer(that.uid);

            that.SetOrdCnt();

            if(that.map) {
                that.map.EmptyMap();
                that.map.ol_map.dispatchEvent('moveend');
                // window.user.import.LoadDataByKey(window.user.uid,'М11',function (res) {
                //
                // });
            }

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
            if(layer.type==="VECTOR") {
                layer.getSource().refresh();
            }
        });
        //not offer but selected period store
        window.db.SetObject('offerStore',{date:that.date,period:$(ev).text()},function (res) {

        });
    }


    UpdateOrderLocal(obj){
        let that = this;
        obj.date = new Date(obj.date);
        window.db.SetObject('orderStore',obj,(res)=>{
            that.SetOrdCnt();
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
        obj.user = window.user.constructor.name.toLowerCase();
        obj.func = "updateorder";
        obj.psw = that.psw;
        obj.cusuid = that.uid;
        obj.supuid = obj.supuid;

        window.network.postRequest(obj, function (data) {
            if (data && data.published) {
                obj.proj = '';
                obj.func = '';
                obj.published = data.published;
                cb(obj);
            }
        });
    };


    DeleteOrder(date,title,cb){
        let that = this;

        let obj = {};
        obj.proj = "d2d";
        obj.user = window.user.constructor.name.toLowerCase();
        obj.func = "deleteorder";
        obj.psw = that.psw;
        obj.cusuid = that.uid;
        obj.date = moment(date).format('YYYY-MM-DD');
        obj.order = title;

        window.network.postRequest(obj, function (data) {
            if (data.result.affectedRows>0) {
                cb(data);
            }
        });
    }
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


    OnClickUserProfile(ev){

        let tab = ev.data.data;
        $('#my_profile_container iframe').attr('src','./customer/profile.customer.'+window.sets.lang+'.html?v='+new Date().valueOf());

        $('#my_profile_container').css('display','block');

        $('#my_profile_container iframe').on('load', function () {

            $('#my_profile_container iframe').off();

            $('#my_profile_container iframe')[0].contentWindow.InitProfileUser();

            $('.tab-pane', $('#my_profile_container iframe').contents()).removeClass('active');
            $('.tab-pane', $('#my_profile_container iframe').contents()).addClass('fade');

            $('#' + tab, $('#my_profile_container iframe').contents()).addClass('active');
            $('#' + tab, $('#my_profile_container iframe').contents()).removeClass('fade');


            //$('#' + tab, $('#my_profile_container iframe').contents()).trigger('click touchstart');

            $('.close_browser',$('#my_profile_container iframe').contents()).off('touchstart click');
            $('.close_browser',$('#my_profile_container iframe').contents()).on('touchstart click', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                $('#my_profile_container iframe')[0].contentWindow.profile_cus.Close(function () {
                    $('#my_profile_container').css('display', 'none');
                    $('.loader').css('display','none');
                });
            });
        })
    }

    MakeDraggableCarousel(el){
        let that = this;

            let carus_pos = JSON.parse(localStorage.getItem("carousel_pos"));
            if (carus_pos)
                $(el).offset({top: carus_pos.top, left: carus_pos.left});
            $(el).draggable(
                {delay: 100},
                {
                    start: function (ev) {
                        console.log("drag start");
                        $(el).find('.carousel-item').attr('drag', 'true');
                        $(el).find('.nav-link').attr('drag', 'true');
                    },
                    drag: function (ev) {

                    },
                    stop: function (ev) {

                        let left = $(el).position().left;
                        // $(el).css('right', rel_x + '%');
                        let top = $(el).position().top;
                        // $(el).css('bottom', rel_y + '%');
                        $(el).find('.carousel-item').attr('drag', 'false');
                        $(el).find('.nav-link').attr('drag', 'false');
                        localStorage.setItem("carousel_pos", JSON.stringify({top: top, left: left}));
                        $(el).draggable("disable")
                    }
                });

            $(el).draggable("disable");

            $('.carousel-inner').on('click touchstart', function (ev) {
                let el = this;
                setTimeout(function () {
                    if ($(el).attr('drag') !== 'true')
                        that.map.OnItemClick($(el).find('.carousel-item')[0]);
                }, 200);
            });

    }

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
                let urlencode = require('urlencode');
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

    SetOrdCnt() {
        window.db.GetCusOrders(window.user.date,(res)=> {
            this.orders = res;
            let cnt = 0;
            $('.ord_cnt').text(cnt);
            for(let i in res){
                let order = res[i];
                for(let item in order.data) {
                    if(order.data[item] && order.data[item].ordlist) {
                        let num = 0;
                        _.findKey(order.data[item].ordlist, function(o){
                            num+=o.qnty;
                        });
                        $('.ord_cnt').text(num);
                    }
                }
            }
        });
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












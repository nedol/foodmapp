'use strict'
export {OLMap};

import {Utils} from "../utils/utils";
let utils = new Utils();

// let shortHash = require('shorthash');
// let md5 = require('md5');

import map from 'ol/map';
import View from 'ol/view';
import TileLayer from 'ol/layer/tile';
import Cluster from 'ol/source/cluster';

import XYZ from 'ol/source/xyz';
import interaction from 'ol/interaction';
import control from 'ol/control';
import Projection from 'ol/proj/projection';
import Point from 'ol/geom/point';
import DeviceOrientation from 'ol/deviceorientation';

import proj from 'ol/proj';
import Draw from 'ol/interaction/draw';
import _ol_style_Style_ from 'ol/style/style';
import _ol_style_Fill_ from 'ol/style/fill';
import _ol_style_Stroke_ from 'ol/style/stroke';

import Modify from 'ol/interaction/modify';
import Snap from 'ol/interaction/snap';

import Circle from 'ol/geom/circle';
import Collection from 'ol/collection';
import Feature from 'ol/feature';
import {Geo} from './location/geolocation';


import {Animate} from "./animate/animate";
import {Layers} from './layers/layers';
import {Events} from './events/events';

import {OfferOrder} from "../customer/init.frame";
import {Marker} from "./marker/marker";
import {Dict} from '../dict/dict.js';

import {Overlay} from "../map/overlay/overlay";
import {UtilsMap} from "../utils/utils.map.js";



class OLMap {

    constructor() {
        //let full_screen = new ol.control.FullScreen();
        //full_screen.setTarget('full_screen');
        window.sets.app_mode = 'd2d';

        this.path  ="http://localhost:63342/d2d/server";
        if(host_port.includes('nedol.ru'))
            this.path = host_port;

        window.sets.app_mode = 'd2d';

        this.lat_param = utils.getParameterByName('lat');
        this.lon_param = utils.getParameterByName('lon');
        this.zoom_param = utils.getParameterByName('zoom');

        var projection = new Projection({
            code: 'EPSG:3857',//'EPSG:4326', //
            units: 'm'
        });

        if (!this.ol_map) {
            this.ol_map = new map({
                layers: [
                    new TileLayer({
                        preload: 4,
                        source: new XYZ({
                            url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibmVkb2wiLCJhIjoiY2s3ejJzbXViMDF1bTNvbXRzZ3ZqMnFqNCJ9.QGsoAD2JcX-6bmpbKjvmWw'
                        })
                    })
                ],
                interactions: interaction.defaults({altShiftDragRotate: false, pinchRotate: false}),
                controls: control.defaults({
                    zoom: false,
                    attribution: false,
                    rotate: false,
                    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                        collapsible: false
                    })
                }).extend([
                    // full_screen
                ]),
                target: 'map',
                view: new View({
                    center: proj.fromLonLat( [parseFloat('0.0'), parseFloat('51.4934')]),
                    projection:projection,
                    zoom: 17
                })
            });

        }

        this.mapEvents();

        this.geo = new Geo(this);

        this.animate = new Animate(this);

        this.layers = new Layers(this);


        this.feature = new Feature(this);

        this.featureAr = {};

        var rotateMap = false;
        var deviceOrientation = new DeviceOrientation();

        deviceOrientation.on('change', function(event) {

        });

        deviceOrientation.on('change:heading', function(event) {

        });
        deviceOrientation.setTracking(true);

        //$('#items_carousel').carousel({interval:2000});
        $('#items_carousel').carousel("cycle");
    }

    Init(lat, lon) {
        let that = this;

        that.lat_param = lat;
        that.lon_param = lon;


        setTimeout(function () {

            that.CarouselEvents();

            let time = new Date().getTime();
            // let cl = localStorage.getItem('cur_loc');
            // cl = JSON.parse(cl);
            // if (cl != null && cl.time < 1503824276869) {
            //     localStorage.clear();
            // }

            let c ='';
            if (!localStorage.getItem("cur_loc")) {

                let lonlat = [parseFloat('37.47'), parseFloat('55.6')];

                localStorage.setItem("cur_loc", "{\"lon\":" + lonlat[0] + "," +
                    "\"lat\":" + lonlat[1] + ", \"time\":" + time + ",\"zoom\":"+that.ol_map.getView().getZoom()+"}");
            }else{
                try {
                    c = JSON.parse(localStorage.getItem("cur_loc"));
                }catch(ex){

                }
            }


            if (that.lat_param && that.lon_param)
                window.sets.coords.cur = proj.fromLonLat([parseFloat(that.lon_param), parseFloat(that.lat_param)]);
            else if (c)
                window.sets.coords.cur = proj.fromLonLat([parseFloat(c.lon), parseFloat(c.lat)]);

            if(utils.getParameterByName('lat') && utils.getParameterByName('lon')){
                let lat = utils.getParameterByName('lat');
                let lon = utils.getParameterByName('lon');
                window.sets.coords.cur = proj.fromLonLat([parseFloat(lon), parseFloat(lat)]);
            }

            that.ol_map.getView().animate({
                center: window.sets.coords.cur,
                zoom: that.zoom_param ? that.zoom_param : 15,
                duration: window.sets.animate_duration * 2,

            }, function () {
                //$("#marker").trigger("change:cur_pos", [window.sets.coords.cur, "Event"]);
                let latlon = proj.toLonLat(window.sets.coords.cur);
                $('#locText').text(latlon[1].toFixed(6) + " " + latlon[0].toFixed(6));
                $("#zoom_but").text(that.zoom_param ? that.zoom_param : 15);
            });

        }, 300);
    }

    EmptyMap(){
        let that = this;
        let layers = this.ol_map.getLayers();
        layers.forEach(function (layer, i, layers) {
            if(layer.type==="VECTOR") {
                layer.getSource().clear();
                layer.getSource().refresh();
            }
        });
        let overlays = this.ol_map.getOverlays();
        overlays.forEach(function (overlay) {
            that.ol_map.removeOverlay(overlay);
        });
    }


    SetFeatures(objs) {
        let that = this;
        for (let o in objs) {
            //alert(JSON.stringify(objs[o]));
            if(objs[o].deleted)
                continue;
            var markerFeature = new Feature({
                geometry: new Point(proj.fromLonLat([objs[o].longitude, objs[o].latitude])),
                labelPoint: new Point(proj.fromLonLat([objs[o].longitude,objs[o].latitude])),
                //name: cursor.value.title ? cursor.value.title : "",
                //tooltip: cursor.value.title ? cursor.value.title : "",
                categories: JSON.parse(objs[o].categories),
                type:'supplier',
                object: objs[o]
            });
            markerFeature.setId(objs[o].uid);

            let c = 0;

            for(let tab in objs[o].data) {

                let cat = $(".category[state=1]").attr('id');//features[f].values_.categories[c++];

                if(!Object.keys(objs[o].data).includes(cat))
                    continue;

                if (!cat || !objs[o].profile) {

                    continue;
                }

                if(window.user.constructor.name ==='Customer' && objs[o].profile.type==='foodtruck'){
                    if($('iframe#'+objs[o].uid).length===0) {
                        that.CreateOverlay(objs[o]);
                        that.CreateCircle(objs[o]);
                    }
                    continue;
                }

                let layer = that.ol_map.getLayers().get(cat + "_" + objs[o].profile.type);
                if (!layer) {
                    layer = that.layers.CreateLayer(cat + "_" + objs[o].profile.type, '1');
                }

                let source = layer.values_.vector;

                if (objs[o].uid === window.user.uid) {

                    continue;
                }

                if(objs[o].profile.type==='deliver' && window.user.constructor.name ==='Supplier')
                    continue;

                if (!source.getFeatureById(markerFeature.getId())) {

                    source.addFeature(markerFeature);

                    markerFeature.uid = objs[o].uid;

                    if (objs[o].profile.type && objs[o].profile.type.toLowerCase() === 'marketer') {
                        objs[o].img = "./images/ic_" + cat + ".png";
                        let clusterSource = new Cluster({
                            distance: 20,
                            source: source
                        });

                        layer.setSource(clusterSource);

                    }else if(objs[o].profile.type.toLowerCase() === 'deliver' && window.user.constructor.name==="Customer"){

                        objs[o].img = objs[o].profile.thmb;
                        let clusterSource = new Cluster({
                            distance: 150,
                            source: source
                        });
                        layer.setSource(clusterSource);

                        let ColorHash = require('color-hash');
                        var colorHash = new ColorHash();
                        let clr = colorHash.rgb(objs[o].uid);

                        let style =  new _ol_style_Style_({
                            // fill: new _ol_style_Fill_({
                            //     color: 'rgba(255, 255, 255, 0)'
                            // }),
                            stroke: new _ol_style_Stroke_({
                                color: clr,
                                width: 1
                            })
                        });

                        // if(window.user.profile.profile.type==="deliver")
                        //     return;
                        if(!that.layers.circleLayer){
                            that.layers.CreateCircleLayer(style);
                        }

                        let circle_source = that.layers.circleLayer.getSource();

                        let radiusFeature = '';
                        if (objs[o].radius_feature) {
                            radiusFeature = objs[o].radius_feature;
                        } else {

                            radiusFeature = new Feature({
                                geometry: new Circle(proj.fromLonLat([objs[o].longitude, objs[o].latitude]), objs[o].radius),
                                //name: cursor.value.title ? cursor.value.title : "",
                                //tooltip: cursor.value.title ? cursor.value.title : "",
                                obj: objs[o]
                            });

                            radiusFeature.setId(objs[o].uid);

                            objs[o].radius_feature = radiusFeature;

                            let col = new Collection();
                            col.push(radiusFeature);
                            let draw = new Draw({
                                geometryName: 'circle',
                                source: source,
                                type: 'Circle',
                                features: col,
                                style: style
                            });
                            if (!circle_source.getFeatureById(objs[o].uid))
                                circle_source.addFeature(radiusFeature);
                        }
                    }
                }
            }

        }
    }

    GetObjectsFromStorage(area) {
        let that = this;
        let period = $('.sel_period').text().split(' - ');
        $('.cat_cnt').text('0');

        if(area) {

            setTimeout(function () {
                window.db.GetRangeDeliver(window.user.date,
                    parseFloat(area[0]), parseFloat(area[2]), parseFloat(area[1]), parseFloat(area[3]), function (features) {
                        if(features.length===0){
                            let layers = that.ol_map.getLayers();
                            for(let l in layers.array_) {
                                let layer = layers.array_[l];
                                if (layer.type === "VECTOR" && layer!==that.layers.circleLayer) {
                                    if (layer.getSource())
                                        layer.getSource().clear(true);
                                    if (layer.getSource().source) {
                                        layer.getSource().source.clear(true);
                                    }
                                }
                            }
                            $('.carousel-inner').empty();

                        }else {
                            that.SetFeatures(features);
                            that.Carousel(features);
                        }

                    });

            },100);

            //delivers

            window.db.GetAllSuppliers(window.user.date,function (features) {

                var delivers = _.remove(features, function(f) {
                    return f.profile.type==='deliver';
                });
                that.SetFeatures(delivers);
            })
        }else {
            window.db.GetAllSuppliers(window.user.date,function (features) {
                that.SetFeatures(features);
            })
        }
    }

    Carousel(features){

        let that = this;

        $('#items_carousel').css('display','none').carousel('dispose');
        $('.carousel-inner').empty();

        that.featureAr = {};
        that.htmlAr = {pickup:[],delivery:[]};
        let el_id = '';

        for (let f in features) {
            let util = new UtilsMap();
            if (!features[f]) {
                delete features[f];
                continue;
            }
            if(features[f].profile.type === 'deliver') {
                if (!util.IsInsideRadiusCoor(window.user.map, [features[f].latitude, features[f].longitude], features[f].radius)) {
                    delete features[f];
                    continue;
                }
                el_id = 'delivery';
            }else if(features[f].profile.type === 'marketer'){
                el_id = 'pickup';
            }

            let diff = new Date().getTime() - new Date(features[f].published).getTime();
            var days = Math.floor(diff / (1000 * 60 * 60 * 24));
            days = days - 30;
            if (days >= 0)//просрочен
                features[f].delayed = true;

            let cat_cnt_1 = 0, main_cnt = 0;

            for (let tab in features[f].data) {
                if ($(".category[id=" + tab + "]").length > 0) {
                    let cat_cnt = $('input[id="'+tab+'"]').parent().find('.cat_cnt').text()
                    $('input[id="'+tab+'"]').parent().find('.cat_cnt').text(parseInt(cat_cnt)+1)

                    main_cnt  = parseInt($($('input[id="'+tab+'"]').closest('.dropdown-menu').siblings().find('.cat_cnt')[0]).text());
                    $($('input[id="'+tab+'"]').closest('.dropdown-menu').siblings().find('.cat_cnt')[0]).text(main_cnt+1);
                }
                if ($(".category[state='1'][id=" + tab + "]").length === 0)
                    continue;

                cat_cnt_1++;
            }

            if(features[f].delayed === true)
                continue;

            let supplier = features[f];
            let dict = new Dict(supplier.dict.dict);

            for (let tab in features[f].data) {

                if ($(".category[state='1'][id=" + tab + "]").length === 0)
                    continue;

                for (let i in  features[f].data[tab]) {
                    i = parseInt(i);
                    let item = features[f].data[tab][i];
                    if ($(".carousel-item[title=" + item.title + "]").length > 0)
                        continue;

                    let title = dict.getValByKey(window.sets.lang, item.title);

                    if($('.word').find('.word_btn').length>0) {
                        let res = $.grep($('.word').find('.word_btn'), function (el, i) {
                            return title.toLowerCase().includes(el.value.toLowerCase());
                        });

                        if(res.length===0)
                            continue;
                    }

                    let car_numb = 1;
                    car_numb = Math.ceil(features[f].data[tab].length / cat_cnt_1) > 0 ? Math.ceil(features[f].data[tab].length / cat_cnt_1) : 1;
                    //ограничение кол-ва позиций карусели в зав-ти от кол-ва выбранных элементов
                    // if($(".carousel-item[supuid="+obj.uid+"]").length>=car_numb)
                    //     continue;

                    let src = '';
                    if(item.cert && item.cert[0]) {
                        if (!item.cert[0].src.includes('http')) {
                            src = that.path + "/images/" + item.cert[0].src;
                        } else {
                            src = item.cert[0].src;
                        }
                    }else if(item.img) {
                        if (!item.img.src.includes('http')) {
                            src = that.path + "/images/" + item.img.src;
                        } else {
                            src = item.img.src;
                        }
                    }

                    let price = '';
                    try {
                        price = (!window.sets.currency ? '' : window.sets.currency) +
                            (Object.values(item.packlist)[0].price ? Object.values(item.packlist)[0].price : Object.values(item.packlist)[0]);
                    }catch(ex){

                    }

                    let html = '<div class="carousel-item" title="' + item.title + '" tab="' + tab + '" supuid="' + features[f].uid + '">' +
                        '<h1 class="carousel_title carousel-caption">' + title + '</h1>' +
                        '<img class="carousel_img" src=' + src + ' alt="slide">' +
                        '<h1 class="carousel_price carousel-caption">' + price + '</h1>' +
                        '</div>';

                    that.htmlAr[el_id].push(html);
                    that.featureAr[item.title]= item;

                }
            }
        }

        if(that.htmlAr['pickup'].length===0){
            $('#pickup').removeClass('active');
            $('#delivery').addClass('active');
            $('.nav-link[href="#pickup"]').removeClass('active');
            $('.nav-link[href="#delivery"]').addClass('active');
        }

        $('#items_carousel').css('display','block');

        let id = $('.tab-pane.active').attr('id');

        let shuffled = that.shuffle(that.htmlAr[id]);

        $('#' + id).find('.carousel-inner').append(shuffled);
        $($('#' + id).find('.carousel-inner').find('.carousel-item')[0]).addClass('active');

        //$('#items_carousel').carousel({pause: false});
        // $('#items_carousel').carousel({interval: 2000});
        $('#items_carousel').carousel('cycle');



    }

    CarouselEvents(){
        let that =this;

            function onClick(ev) {
                $('#items_carousel').draggable("enable");
                $(this).off('click touchstart');
                $(this).click();
                $(this).on('click touchstart', onClick);
            }

            $('.nav-link').on('click touchstart', onClick);


            $('a[data-toggle="tab"]').on('show.bs.tab', function (ev) {
            let el = this;
            setTimeout(function () {
                if ($(el).attr('drag') !== 'true') {
                    let href = ev.target.hash;
                    let id = $(href).attr('id');
                    let shuffled = that.shuffle(that.htmlAr[id]);
                    $(href).find('.carousel-inner').append(shuffled);
                    $($(href).find('.carousel-inner').find('.carousel-item')[0]).addClass('active');
                    // $('#items_carousel').carousel({interval: 2000});
                    $('#items_carousel').carousel('cycle');

                }
            },200);

        });

        $('a[data-toggle="tab"]').on('hide.bs.tab', function (ev) {
            $('#items_carousel').carousel('pause');
            let href = ev.target.hash;
            $(href).find('.carousel-inner').find('.carousel-item').removeClass('active');
            $(href).find('.carousel-inner').empty();
        });
    }


    shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        while (0 !== currentIndex) {

            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    OnItemClick(el){
        let that = this;
        this.geo.StopLocation();
        window.db.GetSupplier(window.user.date,$(el).attr('supuid'), function (obj) {

            if(obj.profile.type!=='deliver') {

                let loc = window.user.constructor.name === 'Supplier' ? window.user.offer.stobj.location : proj.fromLonLat([obj.longitude, obj.latitude]);
                that.ol_map.getView().animate({
                    center: loc,
                    zoom: 17,
                    duration: window.sets.animate_duration * 2
                }, function (ev) {


                });
            }

            if(window.user.constructor.name==='Supplier') {
                window.user.editor.InitSupplierOffer();
                return;
            }
            if(window.user.constructor.name==='Customer') {
                if (!window.user.viewer) {
                    window.user.viewer = new OfferOrder();
                }
                window.user.viewer.InitCustomerOrder(obj, $(el).attr('title'));
            }
        });

    }

    SetMarkersArExt(cat, jsAr) {

        var obj = jsAr.shift();
        window.db.SetObject('supplierStore',obj, function (cat) {
            if (jsAr.length === 0)
                this.GetObjectsFromStorage();
            else
                this.SetMarkersArExt(cat, jsAr);
        });
    }

    FlyToLocation(location){
        let that = this;
        this.animate.flyTo(location, function () {
            //Marker.overlay.setPosition(data.data[data.data.length-1]);
        });
    }

    MoveToLocation(location, orig, cb) {
        let that = this;
        if((window.user.constructor.name==='Supplier' || window.user.constructor.name==='Deliver') && orig==='SetCurPosition')
            that.geo.StopLocation();
        that.ol_map.getView().animate({
            center: location
            //,duration: window.sets.animate_duration * 2,

        }, function () {
            //$("#marker").trigger("change:cur_pos", [window.sets.coords.cur, "Event"]);
            let latlon = '';
            if(location) {

                latlon = proj.toLonLat(location);
                $('#locText').text(latlon[1].toFixed(6) + " " + latlon[0].toFixed(6));
            }
            if(window.user.constructor.name==='Supplier' || window.user.constructor.name==='Deliver') {

                if(window.user.user_ovl){
                        window.user.offer.stobj.location = location;
                        window.user.user_ovl.overlay.values_.position = location;
                        window.user.user_ovl.overlay.changed();
                        let loc = proj.toLonLat(window.user.offer.stobj.location);
                        window.user.offer.stobj.latitude = loc[1];
                        window.user.offer.stobj.longitude = loc[0];
                        if (window.user.user_ovl.modify) {
                            window.user.user_ovl.modify.features_.array_[0].values_.geometry.setCenter(location);
                            window.user.user_ovl.modify.changed();
                        }
                        cb();
                    }
            }

            $('#loc_ctrl[data-toggle="tooltip"]').tooltip("dispose");

            cb();
        });
    }

    MoveToBound(bound){
        let location = proj.fromLonLat([parseFloat(bound[2]), parseFloat(bound[0])]);
        this.MoveToLocation(location, null, function () {

        });
    }

    SetBounds(obj) {
        try {
            this.ol_map.getView().fit(proj.transformExtent([parseFloat(obj.sw_lng), parseFloat(obj.sw_lat), parseFloat(obj.ne_lng), parseFloat(obj.ne_lat)], 'EPSG:4326', 'EPSG:3857'), {
                duration: window.sets.animate_duration
            }); // [minlon, minlat, maxlon, maxlat]
        } catch (ex) {
            alert(ex);
        }
    }

    SetFeatureGeometry(feature, loc){
        feature.setGeometry( new Point(loc));
    }

    mapEvents(){

        let that= this;
        this.ol_map.on('movestart', function (event) {
            //this.dispatchEvent('click');

        });

        this.ol_map.on('moveend', function (event) {

            if (event) {
                // if (window.user.constructor.name === 'Supplier')
                //     return;

            var time = new Date().getTime();
            let lonlat  = proj.toLonLat(that.ol_map.getView().values_.center);
            if(isNaN(lonlat[0]) || isNaN(lonlat[1]) || lonlat[0]===0.0 || lonlat[1]===0.0)
                return;
            localStorage.setItem("cur_loc", "{\"lon\":" + lonlat[0] + "," +
                "\"lat\":" + lonlat[1] + ", \"time\":" + time + ",\"zoom\":"+that.ol_map.getView().getZoom()+"}");
            if(window.user.import)
                window.user.import.ImportDataByLocation(event);

            }
        });

        this.ol_map.getView().on('change:resolution', function (event) {

            var zoom = parseInt(that.ol_map.getView().getZoom()).toString();

            if($('.fd_frame') && $('.fd_frame').contents()[0] && $('.fd_frame').contents()[0].body) {
                $('.fd_frame').trigger('load');

                let w = (Math.pow(zoom, 3) / 50).toFixed(2);
                $('.fd_frame').css('width', w);

                //$('.fd_frame')[0].ovl.values_.offset = [-w / 2, -w / 2];
            }

            $("#zoom_but").text(zoom);
            if (zoom >= 9)
                $("#zoom_but").css('color', 'blue');
            else
                $("#zoom_but").css('color', 'black');

            var bounce = that.ol_map.getView().calculateExtent(that.ol_map.getSize());
        });

        this.ol_map.on('pointerdrag', function (event) {
            $("#marker").trigger("change:cur_pos", ["Custom", event]);
            try {
                that.coord.cur = event.target.focus_;
            } catch (ex) {

            }
        });
    }

    CreateOverlay(obj, cb) {
        let that = this;
        let fd_frame = $('#fd_frame_tmplt').clone();
        $(fd_frame).attr('id',obj.uid);
        $(fd_frame).addClass('fd_frame');
        $(fd_frame).css('display','block');

        var zoom = parseInt(that.ol_map.getView().getZoom()).toString();
        let w = (Math.pow(zoom,3)/50).toFixed(2);
        $(fd_frame).css('width',w);

        if($('#'+obj.uid).length===0) {

            let loc = obj.location?obj.location:proj.fromLonLat([obj.longitude, obj.latitude]);
            obj.location = loc;

            $(fd_frame).on('load', function (ev) {
                $(fd_frame).off('load');
                if(!window.user.user_ovl ) {
                    window.user.user_ovl = new Overlay(that, $(fd_frame)[0], obj);
                    cb();
                    setTimeout(function () {

                        $("#user", $(fd_frame).contents()).on('click touchstart', function () {
                            $(fd_frame).attr('supuid', obj.uid);
                            obj.dict = window.dict;
                            if (window.user.constructor.name === 'Deliver')
                                window.user.editor.InitDeliverOffer(obj);
                            else if (window.user.constructor.name === 'Supplier')
                                window.user.editor.InitSupplierOffer();
                            else if (window.user.constructor.name === 'Customer') {
                                that.OnItemClick(fd_frame);
                            }
                        });
                        $('#user', $(fd_frame).contents()).attr('src', that.path + '/images/' + obj.profile.avatar);

                    }, 1500);
                }
            });
            $('#foodtrucks').append(fd_frame);
        }

    }

    CreateCircle(offer) {
        let that = this;
        let layer;
        if(that.layers.circleLayer) {
            layer = that.layers.circleLayer;
        }else{
            let style =  new _ol_style_Style_({
                // fill: new _ol_style_Fill_({
                //     color: 'rgba(255, 255, 255, .2)'
                // }),
                stroke: new _ol_style_Stroke_({
                    color: 'rgba(255, 0, 0, 1)',
                    width: 1
                })
            });

            that.layers.CreateCircleLayer(style);
            layer = that.layers.circleLayer;
        }

        var source = layer.getSource();

        var radiusFeature = new Feature({
            geometry: new Circle(offer.location,offer.radius?offer.radius:1000),
            //name: cursor.value.title ? cursor.value.title : "",
            //tooltip: cursor.value.title ? cursor.value.title : "",
            type:offer.profile.type,
            object: offer
        });

        radiusFeature.un('click', function (ev) {

        });

        radiusFeature.setId('radius_'+offer.uid);
        radiusFeature.supuid = offer.uid;
        source.addFeature(radiusFeature);


        if(!this.collection)
            this.collection = new Collection();
        this.collection.push(radiusFeature);
        that.draw = new Draw({
            geometryName:'circle',
            source: source,
            type: 'Circle',
            features:that.collection
        });

        //that.map.ol_map.addInteraction(that.draw);
        that.snap = new Snap({source: source});
        that.ol_map.addInteraction(that.snap);
        if(window.user.constructor.name!=='Customer') {
            that.modify = new Modify({source: source});
            that.modify.addEventListener('modifyend', function (ev) {
                let radius = parseFloat(ev.features.array_[0].values_.geometry.getRadius().toFixed(2));
                window.db.GetOffer(new Date(window.user.date),function (of) {
                    if(of[0]) {
                        of[0].radius = radius;
                        window.db.SetObject('offerStore', of[0], res => {
                            window.user.offer.stobj.radius = radius;
                        });
                    }
                })
            });
            that.map.ol_map.addInteraction(that.modify);
        }

        that.draw.addEventListener('drawstart', function (ev) {

        });
        that.draw.addEventListener('drawend', function (ev) {
            // that.map.ol_map.removeInteraction(that.draw);
            that.overlay.values_.position = ev.target.sketchCoords_[0];
        });

    }
}
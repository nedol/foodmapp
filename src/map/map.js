'use strict'
export {OLMap};

import {Utils} from "../utils/utils";
let utils = new Utils();

import map from 'ol/map';
import View from 'ol/view';
import TileLayer from 'ol/layer/tile';
import Cluster from 'ol/source/cluster';
import OSM from 'ol/source/osm';
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

import Circle from 'ol/geom/circle';
import Collection from 'ol/collection';
import Feature from 'ol/feature';
import {Geo} from './location/geolocation';

import {Categories} from "./categories/categories";
import {Animate} from "./animate/animate";
import {DB} from './storage/db';
import {Layers} from './layers/layers';
import {Events} from './events/events';

import {OfferOrder} from "../customer/init.frame";
import {Marker} from "./marker/marker";
import {Dict} from '../dict/dict.js';


class OLMap {

    constructor() {
        //let full_screen = new ol.control.FullScreen();
        //full_screen.setTarget('full_screen');
        window.sets.app_mode = 'd2d';

        this.path  ="http://localhost:63342/d2d/server";
        if(host_port.includes('nedol.ru'))
            this.path = host_port;

        this.lat_param = utils.getParameterByName('lat');
        this.lon_param = utils.getParameterByName('lon');
        this.zoom_param = utils.getParameterByName('zoom');

        var projection = new Projection({
            code: 'EPSG:3857',//'EPSG:4326', //
            units: 'm'
        });


        let view =new View({
            center: proj.fromLonLat([this.lon_param, this.lat_param]),
            //rotation: Math.PI / 5,
            // extent: proj.get("EPSG:3857").getExtent(),
            projection:projection,
            zoom: 17
        });

        this.osm = new OSM();
        
        if (!this.ol_map) {
            this.ol_map = new map({
                layers: [
                    new TileLayer({
                        preload: 4,
                        source: this.osm
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
                view: view
            });

        }

        this.mapEvents();

        this.marker = new Marker( this, document.getElementById('marker'));
        this.geo = new Geo(this);

        this.animate = new Animate(this);

        $('#category_container').load('./html/categories/food.html?v=12 #cat_incl',()=> {
            this.categories = new Categories(this);

        });

        setTimeout(()=> {
            this.layers = new Layers(this);
        },100);

        this.feature = new Feature(this);

        var rotateMap = false;
        var deviceOrientation = new DeviceOrientation();

        deviceOrientation.on('change', function(event) {

        });

        deviceOrientation.on('change:heading', function(event) {

            // var heading = event.target.getHeading() || 0;
            //
            // var viewRotation = 0;
            // var markerRotation = 0;
            // if (rotateMap) {
            //     viewRotation = -heading;
            //     view.setCenter(this.geo.getPosition());
            // } else {
            //     markerRotation = heading;
            // }
            // view.setRotation(viewRotation);
            // // positionMarkerIcon.setRotation(markerRotation)
            // // positionFeature.setStyle(new ol.style.Style({
            // //     image: positionMarkerIcon
            // // }));
        });
        deviceOrientation.setTracking(true);
    }

    Init() {
        let that = this;

        this.events = new Events(this);

        if (window.sets.app_mode !== 'demo') {

            if (!window.db)
                window.db = new DB(function () {

                });


            //TODO: this.ol_map.addInteraction(new Feature(this));

        }

        $(window).on( "orientationchange", function( event ) {
            console.log();
        });

        setTimeout(function () {

            let time = new Date().getTime();
            // let cl = localStorage.getItem('cur_loc');
            // cl = JSON.parse(cl);
            // if (cl != null && cl.time < 1503824276869) {
            //     localStorage.clear();
            // }


            if (!localStorage.getItem("cur_loc")) {

                let coor = proj.fromLonLat([parseFloat('37.47'), parseFloat('55.6')])

                localStorage.setItem("cur_loc", "{\"lon\":" + coor[0] + "," +
                    "\"lat\":" + coor[1] + ", \"time\":" + time + "}");
            }

            let c = JSON.parse(localStorage.getItem("cur_loc"));

            if (this.lat_param && this.lon_param)
                window.sets.coords.cur = proj.fromLonLat([parseFloat(that.lon_param), parseFloat(that.lat_param)]);
            else if (c)
                window.sets.coords.cur = [parseFloat(c.lon), parseFloat(c.lat)];
            else
                return;

            if(utils.getParameterByName('lat')){
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

    GetObjectsFromStorage(area) {
        let that = this;
        let period = $('.sel_period').text().split(' - ');
        $('.cat_cnt').text('0');

        function setFeatures(objs) {

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

                    let cat = $(".category[cat=" +tab + "][state=1]").attr('id');//features[f].values_.categories[c++];

                    if (!cat || !objs[o].profile) {

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

                    if (!source.getFeatureById(markerFeature.getId())) {

                        source.addFeature(markerFeature);

                        if (objs[o].profile.type.toLowerCase() === 'marketer') {
                            objs[o].img = "./images/ic_" + cat + ".png";
                            let clusterSource = new Cluster({
                                distance: 20,
                                source: source
                            });

                            layer.setSource(clusterSource);

                            $("#items_carousel").on('slide.bs.carousel', function (ev) {
                                let tab = $(ev.relatedTarget).attr('tab');
                                if($(".category[state='1'][cat="+tab+"]").length===0) {
                                    $(ev.relatedTarget).remove();
                                    $(this).carousel('next');
                                }
                            });

                        }else if(objs[o].profile.type.toLowerCase() === 'deliver'){

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

                            if(window.user.constructor.name==="Deliver")
                                return;
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

        if(area) {

            setTimeout(function () {
                window.db.GetRangeSupplier(window.user.date,
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
                            setFeatures(features);
                            that.Carousel(features);
                        }

                    });
            },100);


            //delivers

            window.db.GetAllSuppliers(window.user.date,function (features) {

                var delivers = _.remove(features, function(f) {
                    return f.profile.type==='deliver';
                });
                setFeatures(delivers);
            })
        }else {
            window.db.GetAllSuppliers(window.user.date,function (features) {
                setFeatures(features);
            })
        }
    }

    Carousel(features){

        let that = this;

        $('#items_carousel').carousel('dispose');
        $('.carousel-item').remove();


        for (let f in features) {

            if (!features[f] || features[f].profile.type === 'deliver') {
                delete features[f];
                continue;
            }

            let diff = new Date().getTime() - new Date(features[f].published).getTime();
            var days = Math.floor(diff / (1000 * 60 * 60 * 24));
            days = days - 7;
            if (days >= 0)//просрочен
                features[f].delayed = true;
        }

        let cat_cnt_1 = 0, main_cnt = 0;
        for (let f in features) {

            for (let tab in features[f].data) {
                if ($(".category[cat=" + tab + "]").length > 0) {

                    let cat_cnt = $('input[cat="'+tab+'"]').parent().find('.cat_cnt').text()
                    $('input[cat="'+tab+'"]').parent().find('.cat_cnt').text(parseInt(cat_cnt)+1)

                    main_cnt  = parseInt($($('input[cat="'+tab+'"]').closest('.dropdown-menu').siblings().find('.cat_cnt')[0]).text());
                    $($('input[cat="'+tab+'"]').closest('.dropdown-menu').siblings().find('.cat_cnt')[0]).text(main_cnt+1);
                }
                if ($(".category[state='1'][cat=" + tab + "]").length === 0)
                    continue;

                cat_cnt_1++;
            }

            if(features[f].delayed === true)
                continue;

            let supplier = features[f];
            let dict = new Dict(supplier.dict.dict);

            for (let tab in features[f].data) {

                if ($(".category[state='1'][cat=" + tab + "]").length === 0)
                    continue;

                for (let i in features[f].data[tab]) {
                    i = parseInt(i);
                    let item = features[f].data[tab][i];
                    if ($(".carousel-item[title=" + item.title + "]").length > 0)
                        continue;

                    let car_numb = 1;
                    car_numb = Math.ceil(features[f].data[tab].length / cat_cnt_1) > 0 ? Math.ceil(features[f].data[tab].length / cat_cnt_1) : 1;
                    //ограничение кол-ва позиций карусели в зав-ти от кол-ва выбранных элементов
                    // if($(".carousel-item[supuid="+obj.uid+"]").length>=car_numb)
                    //     continue;

                    let src = '';
                    if (!item.img.src.includes('http'))
                        src = that.path + "/images/" + item.img.src
                    else
                        src = item.img.src;

                    let active = '';
                    if (!$('.carousel-inner').find('.active')[0])
                        active = 'active';
                    let title = dict.getValByKey(window.sets.lang, item.title);
                    let html = '<div class="carousel-item ' + active + ' " title="' + item.title + '" tab="' + tab + '" supuid="' + features[f].uid + '">' +
                        '<h1 class="carousel_title carousel-caption">' + title + '</h1>' +
                        '<img class="carousel_img" src=' + src + ' alt="slide">' +
                        '<h1 class="carousel_price carousel-caption">' + Object.values(item.packlist)[0] + ' &#x20bd;' + '</h1>' +
                        '</div>';

                    if (i == 0 && $('.carousel-item').length > 0)
                        $($('.carousel-item')[0]).after(html);
                    else
                        $('.carousel-inner').append(html);

                }
            }
        }


        if (that.carousel_interval)
            clearInterval(that.carousel_interval);

        let dir = Math.floor(Math.random() * 10)>5?'next':'prev';

        that.carousel_interval= setInterval(function () {
            if($('.carousel-item').length>0) {
                $('#items_carousel').carousel(dir);
            }
        }, 3000);

    }

    OnItemClick(el){
        let that = this;
        this.geo.StopLocation();
        window.db.GetSupplier(window.user.date,$(el).attr('supuid'), function (obj) {
            that.ol_map.getView().animate({
                center: proj.fromLonLat([obj.longitude,obj.latitude]),
                zoom: 20,
                duration: window.sets.animate_duration * 2
            },function (ev) {
                if (window.user.constructor.name === 'Customer') {
                    if (!window.user.viewer) {
                        window.user.viewer = new OfferOrder();
                    }
                    window.user.viewer.InitCustomerOrder(obj, $(el).attr('title'));
                }
            });
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

    MoveToLocation(location) {
        let that = this;
        that.ol_map.getView().animate({
            center: location,
            duration: window.sets.animate_duration * 2,

        }, function () {
            //$("#marker").trigger("change:cur_pos", [window.sets.coords.cur, "Event"]);
            if(location) {
                let latlon = proj.toLonLat(location);
                $('#locText').text(latlon[1].toFixed(6) + " " + latlon[0].toFixed(6));
            }

            if(!window.sets.loc_mode && window.user.constructor==='Supplier')
                window.user.editor.InitSupplierOffer();

            $('#loc_ctrl[data-toggle="tooltip"]').tooltip("dispose");

        });
    }

    MoveToBound(bound){
        let location = proj.fromLonLat([parseFloat(bound[2]), parseFloat(bound[0])]);
        this.MoveToLocation(location);
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
                if (window.user.constructor.name === 'Supplier')
                    return;
                if(window.sets.coords.cur[0]!==0 && window.sets.coords.cur[1]!==0) {
                    if(window.user.import)
                        window.user.import.ImportDataByLocation(event);

                }
            }
        });

        this.ol_map.getView().on('change:resolution', function (event) {

            var zoom = parseInt(that.ol_map.getView().getZoom()).toString();

            $("#zoom_but").text(zoom);
            if (zoom >= 14)
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

}
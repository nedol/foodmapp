export {d2d_map}

import {Categories} from "./categories/categories";
// import 'ol/ol.css';

import map from 'ol/map';
import View from 'ol/view';
import TileLayer from 'ol/layer/tile';
import XYZ from 'ol/source/xyz';
import interaction from 'ol/interaction';
import control from 'ol/control';
import proj from 'ol/proj';

import {Animate} from "./animate/animate";
import {Route} from "./location/route";
import {geo} from "./location/geolocation";

require('../user/panel/panel.js');
require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');

import {DB} from './storage/db.js';
//import {ddd, ddd_obj} from './ddd/ddd';

import {StartLocation,SearchPlace,StopLocation} from "./panel/panel";

require('expose-loader?resize!../lib/jquery.ae.image.resize.min.js');
require('./events/feature_events.js');


require('expose-loader?Storage!./storage/storage.js');
// require('expose-loader?DB!./storage/db.js');


import {getParameterByName,GetObjId} from './utils/utils';
import {Categories} from '../user/categories/categories';
import {Layers} from '../user/layers/layers';
import {Events} from '../user/events/events';
import {DOMEvents} from '../user/events/dom_events';

require("../global");
import {Settings} from "./menu/settings";
import {Menu} from "./menu/menu.js";
import {DownloadOverlay} from "./overlay/overlay";
import {Order} from './order';
import {ImportData} from './import/import_data';
let md5 = require('md5');
let isJSON = require('is-json');
let utils = require('../utils');

let d2d_map, order, DDD ;

$(document).ready(function () {

    $('#ol-container').css('visibility', 'visible');

    d2d_map = new Map();
    let uObj;
    let uid = md5(JSON.stringify(Date.now()));
    if(!localStorage.getItem('supplier')) {
        uObj = {"email":utils.getParameterByName('email'),"uid":uid};
        localStorage.setItem('user',JSON.stringify(uObj));
    }else{
        uObj = localStorage.getItem('user');
        if(!isJSON(uObj)) {
            uObj = {
                "email": utils.getParameterByName('email'),
                "uid": uid
            };
            localStorage.setItem('user', JSON.stringify(uObj));
        }else
            uObj = JSON.parse(uObj);
    }
    order = new Order(uid);
});

class Map {

    constructor(mode) {
        //let full_screen = new ol.control.FullScreen();
        //full_screen.setTarget('full_screen');

        window.sets.app_mode = mode ? mode : getParameterByName('mode');
        if (!window.sets.app_mode)
            window.sets.app_mode = 'id';

        this.lat_param = '55.739';//getParameterByName('lat');
        this.lon_param = '37.687';//getParameterByName('lon');
        this.zoom_param = '15';//getParameterByName('zoom');


        this.osm;
        if (!this.ol_map) {
            this.ol_map = new map({
                layers: [
                    this.osm = new TileLayer({
                        source: new XYZ({
                            url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            crossOrigin: 'null'
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
//            full_screen
                ]),
                target: 'map',
                view: new View({
                    center: proj.fromLonLat([this.lon_param, this.lat_param]),
                    //rotation: Math.PI / 5,
                    extent: proj.get("EPSG:3857").getExtent(),
                    zoom: 17
                })
            });
            this.ol_map.getLayers().set("OSM", this.osm, true);
        }

        this.geo = new geo(this);
        this.offer = new Menu(this);
        this.animate = new Animate(this);
        this.settings = new Settings(this);
        this.categories = new Categories(this);
        this.layers = new Layers(this);
        this.events = new Events(this);
        this.domEvents = new DOMEvents(this);
        this.import_data = new ImportData(this);

        this.init();
    }

    init() {
        let that = this;

        if (window.sets.app_mode !== 'demo') {

            this.categories.InitCategories();

            if (!window.db)
                window.db = new DB(function () {
                    if (window.sets.app_mode === 'quest')
                        window.db.getFile("mega_route", function (data) {
                            //let obj = JSON.parse(data);
                            if (data.data) {
                                new Route().DrawRoute(data.data);

                                this.animate.flyTo(data.data[data.data.length - 1], function () {
                                    //Marker.overlay.setPosition(data.data[data.data.length-1]);
                                });
                            }
                        });
                });

            this.layers.InitLayers();

            this.domEvents.InitDOMEvents();

            this.events.InitEvents();

            this.ol_map.addInteraction(new feature.Drag());

            $('#loc_ctrl').on('click', StartLocation)
            $('#loc_ctrl').on('ontouchstart', StartLocation);

            $('#pin').on('click', StopLocation);
            $('#pin').on('ontouchstart', StopLocation);

            $('#search_but').on('click', SearchPlace);
            $('#search_but').on('ontouchstart', SearchPlace);

        }

        setTimeout(function () {
            if (this.lat_param && this.lon_param) {
                window.sets.coords.cur = proj.fromLonLat([parseFloat(that.lon_param), parseFloat(that.lat_param)]);
                let latlon = proj.toLonLat(window.sets.coords.cur);
                that.GetSuppliers(that.lat_param, that.lon_param);
            }
            let time = new Date().getTime();
            let cl = localStorage.getItem('cur_loc');
            cl = JSON.parse(cl);
            if (cl != null && cl.time < 1503824276869) {
                localStorage.clear();
            }

            if (!localStorage.getItem("cur_loc")) {

                let coor = proj.fromLonLat([parseFloat('-0.128105'), parseFloat('51.507340')])

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


    GetObjects(cat) {
        let that = this;
        window.db.getRange(cat, window.area[0], window.area[2], window.area[1], window.area[3], function (cat, features) {
            let layer = that.ol_map.getLayers().get(cat);

            if (!layer) {
                layer = that.layers.CreateLayer(cat, '1');
            }

            let source = layer.values_.vector;
            $.each(features, function (key, f) {
                if (f.values_.object.overlay && f.values_.object.overlay.includes('ddd')) {
                    if (DDD)
                        DDD.CheckDownload3D(f.values_.object);
                } else if (!source.getFeatureById(f.getId()))
                    that.layers.AddCluster(layer, f);
            });

        });
    }

    SetMarkersArExt(cat, jsAr) {

        var obj = jsAr.shift();
        window.db.setFile(obj, function (cat) {
            if (jsAr.length === 0)
                this.GetObjectsFromStorage(cat);
            else
                this.SetMarkersArExt(cat, jsAr);
        });
    }

    GetSuppliers(lat, lon) {
        try {
            var url = host_port + '?' + //
                "proj=d2d" +
                "&func=get_suppliers" +
                "&lat=" + lat +
                "&lon=" + lon;

            $.ajax({
                url: url,
                method: "GET",
                dataType: 'json',
                processData: false,
                async: true,   // asynchronous request? (synchronous requests are discouraged...)
                cache: false,
                crossDomain: true,
                error: function (xhr, status, error) {
                    //var err = eval("(" + xhr.responseText + ")");
                    console.log(error.Message);
                },
                complete: function (data) {

                    var obj = JSON.parse(data.responseText)[0];
                    if (obj) {
                        obj.longitude = parseFloat(obj.longitude);
                        obj.latitude = parseFloat(obj.latitude);
                        var obj_id = GetObjId(obj.latitude, obj.longitude);
                        if (obj.overlay) {
                            if ($("#" + obj_id + "_include").length === 0) {
                                if (obj.overlay.includes('.ddd.')) {
                                    new ddd_obj(obj).Download3d();
                                    //$('a-scene')[0].renderer.render();
                                } else {
                                    DownloadOverlay(obj.overlay, obj);
                                }
                            }
                        }
                    }
                },
            });

        } catch (ex) {
            console.log();
        }
    }
}
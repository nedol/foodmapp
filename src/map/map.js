'use strict'
export {Map}

import map from 'ol/map';
import View from 'ol/view';
import Vector from 'ol/layer/vector';
import TileLayer from 'ol/layer/tile';
import XYZ from 'ol/source/xyz';
import interaction from 'ol/interaction';
import control from 'ol/control';
import proj from 'ol/proj';

import {Geo} from './location/geolocation';
import {Menu} from './menu/menu';
import {Categories} from "./categories/categories";
import {Animate} from "./animate/animate";
import {DB} from './storage/db';
import {Layers} from './layers/layers';
import {Events} from './events/events';

import {Feature} from "./events/feature.events";
import {Panel} from "./panel/panel";
import {Import} from "./import/import";
import {Marker} from "./marker/marker"

class Map {

    constructor(sup) {
        //let full_screen = new ol.control.FullScreen();
        //full_screen.setTarget('full_screen');
        window.sets.app_mode = 'd2d';
        this.supplier = sup;

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
                    })]
                ,
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


        this.marker = new Marker( this, document.getElementById('marker'));
        this.geo = new Geo(this);
        this.menu = new Menu(this);
        this.animate = new Animate(this);
        //this.settings = new Settings(this);
        this.categories = new Categories(this);
        this.layers = new Layers(this);
        this.events = new Events(this);
        this.feature = new Feature(this);
        this.panel = new Panel(this);
        this.import = new Import(this);

        this.init();
    }

    init() {
        let that = this;

        if (window.sets.app_mode !== 'demo') {

            if (!window.db)
                window.db = new DB(function () {

                });


            //TODO: this.ol_map.addInteraction(new Feature(this));

        }

        setTimeout(function () {
            if (that.lat_param && that.lon_param) {
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


    GetObjectsFromStorage(cats, area) {
        let that = this;

        window.db.getRange( that.supplier.date, cats, parseFloat(area[0]),  parseFloat(area[2]),  parseFloat(area[1]),  parseFloat(area[3]), function (features) {
            for(let f in features) {
                for(let c in features[f].values_.categories) {
                    let cat = features[f].values_.categories[c];
                    let layer = that.ol_map.getLayers().get(cat);
                    if (!layer) {
                        layer = that.layers.CreateLayer(cat, '1');
                    }

                    let source = layer.values_.vector;
                    if (!source.getFeatureById(features[f].getId())) {
                        that.layers.AddCluster(layer, features[f]);
                    }
                }
            }
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

    MoveToLocation(location){
        let that = this;
        this.animate.flyTo(location, function () {
            //Marker.overlay.setPosition(data.data[data.data.length-1]);
        });
    }
}
'use strict'
export {OLMap};

import map from 'ol/map';
import View from 'ol/view';
import TileLayer from 'ol/layer/tile';
import Cluster from 'ol/source/cluster';
import OSM from 'ol/source/osm';
import interaction from 'ol/interaction';
import control from 'ol/control';

import Point from 'ol/geom/point';
import proj from 'ol/proj';

import {Geo} from './location/geolocation';

import {Categories} from "./categories/categories";
import {Animate} from "./animate/animate";
import {DB} from './storage/db';
import {Layers} from './layers/layers';
import {Events} from './events/events';

import {Feature} from "./events/feature.events";

import {Marker} from "./marker/marker";



class OLMap {

    constructor() {
        //let full_screen = new ol.control.FullScreen();
        //full_screen.setTarget('full_screen');
        window.sets.app_mode = 'd2d';

        this.lat_param = '55.739';//getParameterByName('lat');
        this.lon_param = '37.687';//getParameterByName('lon');
        this.zoom_param = '15';//getParameterByName('zoom');

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

        }



        this.marker = new Marker( this, document.getElementById('marker'));
        this.geo = new Geo(this);

        this.animate = new Animate(this);
        this.categories = new Categories(this);
        this.layers = new Layers(this);
        this.feature = new Feature(this);

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

        setTimeout(function () {

            let time = new Date().getTime();
            // let cl = localStorage.getItem('cur_loc');
            // cl = JSON.parse(cl);
            // if (cl != null && cl.time < 1503824276869) {
            //     localStorage.clear();
            // }


            if (!localStorage.getItem("cur_loc")) {

                let coor = proj.fromLonLat([parseFloat('37.460546'), parseFloat('55.669308')])

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
        let period = $('.sel_period').text().split(' - ');
        window.db.GetRangeSupplier(window.user.date, period[0], period[1],
            parseFloat(area[0]),  parseFloat(area[2]),  parseFloat(area[1]),  parseFloat(area[3]), function (features) {
            for(let f in features) {
                let c = 0;
                $.each(features[f].values_.object.data, function (i,item) {
                    let cat = $(".category[title="+i+"]").attr('id');//features[f].values_.categories[c++];

                    if(!item[0])
                        return;

                    let layer = that.ol_map.getLayers().get(cat);
                    if (!layer) {
                        layer = that.layers.CreateLayer(cat, '1');
                    }

                    let source = layer.values_.vector;

                    if(features[f].values_.object.uid===window.user.uid)
                        return;
                    if (!source.getFeatureById(features[f].getId()) &&
                        features[f].values_.object.date===window.user.date) {
                        //that.layers.AddCluster(layer, features[f]);
                        source.addFeature(features[f]);

                        let clusterSource = new Cluster({
                            distance: 100,//parseInt(50, 10),
                            source: source
                        });

                        layer.setSource(clusterSource);
                    }
                });
            }
        });
    }

    SetMarkersArExt(cat, jsAr) {

        var obj = jsAr.shift();
        window.db.SetObject('supplierStore',obj, function (cat) {
            if (jsAr.length === 0)
                this.GetObjectsFromStorage(cat);
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
            zoom: that.zoom_param ? that.zoom_param : 15,
            duration: window.sets.animate_duration * 2,

        }, function () {
            //$("#marker").trigger("change:cur_pos", [window.sets.coords.cur, "Event"]);
            let latlon = proj.toLonLat(location);
            $('#locText').text(latlon[1].toFixed(6) + " " + latlon[0].toFixed(6));
            $("#zoom_but").text(that.zoom_param ? that.zoom_param : 15);
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

}
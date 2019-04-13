export {Layers};

import layerVector from 'ol/layer/vector';
import srcVector from 'ol/source/vector';
import BingMaps from 'ol/source/bingmaps';
import TileLayer from 'ol/layer/tile';
import OSM from 'ol/source/osm';
import proj from 'ol/proj';
import Cluster from 'ol/source/cluster';
import _ol_style_Style_ from 'ol/style/style';
import _ol_style_Circle_ from 'ol/style/circle';
import _ol_style_Icon_ from 'ol/style/icon';
import _ol_style_Fill_ from 'ol/style/fill';
import Text from 'ol/style/text';
import _ol_style_Stroke_ from 'ol/style/stroke';
import RegularShape from 'ol/style/regularshape';

import {Utils} from "../../utils/utils";
import source from 'ol/source/source';
import Observable from 'ol/observable';

import {UtilsMap} from "../../utils/utils.map.js";


class Layers {
    constructor(map){
        this.map = map;
        let that = this;
        this.ar = [];
        this.flag = true;
        this.path  = './../..';
        if(location.origin.includes('localhost'))
            this.path = 'https://nedol.ru'

        try {
            //osm.setVisible(false);

            let sourceBingMaps = new BingMaps({
                key: window.sets.bing_key,
                imagerySet: 'Road',
                culture: 'ru'
            });

            let bingMapsRoad = new TileLayer({
                preload: Infinity,
                source: sourceBingMaps,
                map_type: true,
                url: 'http://[…]/{z}/{x}/{y}.png',
                crossOrigin: 'null'
            });

            bingMapsRoad.setVisible(true);
            map.ol_map.getLayers().push(bingMapsRoad, true);
            map.ol_map.getLayers().set("Bing", bingMapsRoad, true);

            if(!that.circleLayer) {
                that.circleLayer = new layerVector({
                    source: new srcVector(),
                    style: new _ol_style_Style_({
                        fill: new _ol_style_Fill_({
                            color: 'rgba(255, 255, 255, 0.1)'
                        }),
                        stroke: new _ol_style_Stroke_({
                            color: 'rgba(255, 0, 0, 0.5)',
                            width: 1
                        })
                    })
                });
            }
            that.map.ol_map.getLayers().push(that.circleLayer);
            that.map.ol_map.getLayers().set('radius', that.circleLayer, true);

            that.map.ol_map.on('moveend', function (event) {
                let source = that.circleLayer.getSource();
                let features = source.getFeatures();
                let utils = new UtilsMap();
                for(let f in features){
                    let radius = features[f].values_.geometry.getRadius();
                    let center = features[f].values_.geometry.getCenter();
                    let map_center = that.map.ol_map.getView().getCenter();
                    let dist = //utils.getCoordsDistance( that.map.ol_map,center,event.coordinate);
                    utils.getDistanceFromLatLonInKm(proj.toLonLat(center)[1],proj.toLonLat(center)[0],proj.toLonLat(map_center)[1],proj.toLonLat(map_center)[0]);
                    if(dist*1800<=radius && features[f].values_.obj.uid){
                        $('#deliver_but').css('display','block');
                        $('#deliver_but').attr('src',that.path +"/server/images/"+features[f].values_.obj.profile.avatar)
                        $('#deliver_but').attr('supuid',features[f].values_.obj.uid);

                    }else{
                        $('#deliver_but').css('display','none');
                    }
                }
            });


        } catch (ex) {
            console.log("InitLayers");
        }
    }

    SetMapVisible(map) {

        let layers = this.map.ol_map.getLayers();
        layers.forEach(function (layer, i, layers) {
            if (layer.values_.map_type) {
                layer.setVisible(false);
            }
        });

        $("[map='" + map + "']").attr("checked", "checked");

        switch (map) {
            case "osm":
                layers.get("OSM").setVisible(true);
                break;
            case "google":
                layers.get("Google").setVisible(true);
                break;
            case "bing":
                layers.get("Bing").setVisible(true);
                break;
        }
    }

    CreateLayer(cat, state) {
        let that = this;
        let style;
        let features = [];

        let vectorSource = new srcVector({
            features: features
        });


        let clusterSource = new Cluster({
            distance: 100,//parseInt(50, 10),
            source: vectorSource
        });
        let id_str='';

        let vectorLayer = new layerVector({
            map_type: false,
            source: vectorSource,
            vector: vectorSource,
            cluster: clusterSource,
            style: function (cluster_feature, atr) {

                let period = $('.sel_period').text().split(' - ');
                let features = cluster_feature.values_.features?cluster_feature.values_.features:[cluster_feature];
                let rem_feat = [];
                if (cluster_feature.values_ || (features && features.length > 0)){

                    $.each(features,  (key, feature)=> {
                        if(feature.getId()===id_str)
                            return;
                        id_str = feature.getId();
                        setTimeout(function () {
                            id_str = '';
                        },300);

                        if (feature.values_.object.date.valueOf() === new Date(window.user.date).valueOf()) {

                            if(window.user.constructor.name==="Supplier"){
                                if(feature.values_.object.profile.type==='marketer')
                                    return;
                            }

                            let style = getObjectStyle(feature.values_.object);
                            cluster_feature.setStyle(style);

                        }else{
                            vectorSource.removeFeature(feature);
                        }
                    });
                }
                else if(cluster_feature.values_){
                    ;
                }

                function getObjectStyle(obj, appr) {

                    if (!obj || parseInt(obj.status) === 0)
                        return null;
                    let source = that.circleLayer.getSource();
                    let ic_clust = "./images/truck.png";
                    let scale = 1;
                    let opacity;
                    if ( obj.apprs<1)
                        opacity = 0.9;
                    else
                        opacity = 1.0;
                    let logo = obj.logo;
                    scale = Math.pow(that.map.ol_map.getView().getZoom(),3)/30000;
                    if(obj.profile.type==='marketer'){
                        if(that.map.ol_map.getView().getZoom()<15 && features.length===1)//non cluster
                            return;
                        ic_clust = obj.img;
                        scale = Math.pow(that.map.ol_map.getView().getZoom(),3)/30000;
                    }else if(obj.profile.type==='deliver'){
                        // if(that.map.ol_map.getView().getZoom()<15)
                        //     return;
                        ic_clust = obj.img;
                        scale = Math.pow(that.map.ol_map.getView().getZoom(),3)/10000;
                        opacity = 0;
                    }

                    let thmb = window.location.origin +"/d2d/server/images/"+obj.profile.avatar;
                    if(host_port.includes('nedol.ru'))
                        thmb = host_port +"/images/"+obj.profile.avatar;

                        let iconItem = new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
                        //size: [100,100],
                        //img: image,
                        //imgSize:
                        scale: scale, //cl_feature.I.features.length>1 || obj.image.indexOf('/categories/')!== -1?0.3:1.0,//
                        anchor: [70, 70],
                        anchorOrigin: 'bottom-left',
                        offset: [0, 0],
                        anchorXUnits: 'pixel',
                        anchorYUnits: 'pixel',
                        color: [255, 255, 255, 1],
                        opacity: opacity,
                        src: obj.profile.avatar?thmb: "./images/user.png",
                        crossOrigin: 'anonymous'
                    }));
                    let iconCluster= new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
                        //size: [100,100],
                        //img: image,
                        //imgSize:
                        crossOrigin: 'anonymous',
                        scale: scale*2, //cl_feature.I.features.length>1 || obj.image.indexOf('/categories/')!== -1?0.3:1.0,//
                        anchor: [40*scale*10*2, 40*scale*10*2],
                        anchorOrigin: 'bottom-left',
                        offset: [0, 0],
                        anchorXUnits: 'pixel',
                        anchorYUnits: 'pixel',
                        color: [255, 255, 255, 1],
                        opacity: opacity,
                        src: ic_clust
                    }));
                    let iconStyle;
                    if (features.length > 1) {//cluster
                        iconStyle = new _ol_style_Style_({
                            text: new Text({
                                text: cluster_feature.values_.features.length.toString(),
                                font: (140*scale).toFixed(0)+'px serif',
                                align: 'left',
                                //scale: .1,
                                offsetX: scale*200,
                                offsetY: scale*70,
                                fill: new _ol_style_Fill_({
                                    color: 'blue'
                                }),
                                stroke: new _ol_style_Stroke_({
                                    color: 'white',
                                    width: 2
                                })
                            }),
                            image: iconCluster,
                            zIndex: 20
                        });

                        //source.clear();
                    } else {

                        iconStyle = new _ol_style_Style_({
                            text: new Text({
                                text: (obj.overlay === '' || !obj.overlay ? obj.title : ''),
                                font: '8px serif',
                                align: 'center',
                                //scale: 1.5,
                                offsetX: 15,
                                offsetY: 0,
                                baseline: 'top',
                                fill: new _ol_style_Fill_({
                                    color: 'red'
                                }),
                                stroke: new _ol_style_Stroke_({
                                    color: 'white',
                                    width: 2
                                })
                            }),
                            image: iconItem,
                            zIndex: 20
                        });
                        try {
                            if (obj.radius_feature)
                                source.addFeature(obj.radius_feature);
                        }catch (ex){

                        }

                    }


                    //circle_style.image_.setScale(that.map.ol_map.getView().getZoom());
                    //TODO
                    let shadowStyle = new _ol_style_Style_({
                        stroke: new _ol_style_Stroke_({
                            color: 'rgba(0,0,0,0.5)',
                            width: 100
                        }),
                        zIndex: 1
                    });

                    style = [iconStyle, shadowStyle];

                    return style;
                }
            }

        });

        let arr = this.map.ol_map.getLayers().getArray();
        let res = $.grep(arr, function (el, i) {
            return el === vectorLayer;
        });
        if (res.length <= 0) {
            this.map.ol_map.getLayers().push(vectorLayer);
            this.map.ol_map.getLayers().set(cat, vectorLayer, true);
        }


        vectorLayer.setProperties({opacity: 1.0, contrast: 1.0});//setBrightness(1);
        vectorLayer.setVisible(state === '0' ? false : true);

        return vectorLayer;

    }

    SetFlash(feature) {

        let duration = 3000;


        if (feature.interval)
            return;

        function flash(feature) {
            let start = new Date().getTime();
            let listenerKey;

            function animate(event) {

                let vectorContext = event.vectorContext;
                let frameState = event.frameState;
                let flashGeom = feature.getGeometry().clone();
                let elapsed = frameState.time - start;
                let elapsedRatio = elapsed / duration;
                // radius will be 5 at start and 30 at end.
                let radius = ol.easing.easeOut(elapsedRatio) * 25 + 5;
                let opacity = ol.easing.easeOut(1 - elapsedRatio);

                let style = new _ol_style_Style_({
                    image: new _ol_style_Circle_({
                        radius: radius,
                        snapToPixel: false,
                        stroke: new _ol_style_Stroke_({
                            color: 'rgba(255, 0, 0, ' + opacity + ')',
                            width: 0.25 + opacity
                        })
                    })
                });


                vectorContext.setStyle(style);
                vectorContext.drawGeometry(flashGeom);
                if (elapsed > duration) {
                    Observable.unByKey(listenerKey);
                    return;
                }

                d2d_map.ol_map.render();
                // tell OpenLayers to continue postcompose animation

            }

            listenerKey = d2d_map.ol_map.on('postcompose', animate);
        }


        feature.interval = setInterval(function () {
            flash(feature);
        }, 3000);

    }

    AddCluster(layer, new_features) {

        let vectorSource = layer.values_.vector;

        vectorSource.addFeature(new_features);

        let clusterSource = new Cluster({
            distance: 100,//parseInt(50, 10),
            source: vectorSource
        });

        layer.setSource(clusterSource);
    }


    AddOverlayRecurs() {
        if (this.flag && this.ar.length > 0) {
            let obj = this.ar.shift();
            this.flag = false;
            let obj_id = GetObjId(obj.latitude, obj.longitude);
            if ((obj.overlay.startsWith("http") || obj.overlay.startsWith("./"))) {
                if ($("#" + obj_id + "_include").length === 0) {
                    DownloadOverlay(obj.overlay, obj);
                    //test OverlayFrame(obj.overlay, obj)
                } else {
                    this.flag = true;
                    this.AddOverlayRecurs();
                }

            } else {
                $('#locText').before(obj.overlay);
                this.flag = true;
                this.AddOverlayRecurs();
            }

        }

    }

    getCoordsDistance(map,firstPoint, secondPoint, projection) {
        projection = projection || 'EPSG:4326';

        length = 0;
        var sourceProj = map.getView().getProjection();
        var c1 = proj.transform(firstPoint, sourceProj, projection);
        var c2 = proj.transform(secondPoint, sourceProj, projection);

        var wgs84Sphere = new Sphere(6378137);
        length += wgs84Sphere.haversineDistance(c1, c2);

        return length;
    }
}


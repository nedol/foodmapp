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
import Draw from 'ol/interaction/draw';
import Snap from 'ol/interaction/snap';
import Circle from 'ol/geom/circle';
import Collection from 'ol/collection';
import Feature from 'ol/feature';
import {utils} from "../../utils/utils";
import source from 'ol/source/source';
import Observable from 'ol/observable';

import {Overlay} from "../overlay/overlay";


class Layers {
    constructor(map){
        this.map = map;
        let that = this;
        this.ar = [];
        this.flag = true;
        that.circleLayer;

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

            let map_strg = localStorage.getItem("map");

            if(!that.circleLayer) {
                that.circleLayer = new layerVector({
                    source: new srcVector(),
                    style: new _ol_style_Style_({
                        fill: new _ol_style_Fill_({
                            color: 'rgba(255, 255, 255, 0.3)'
                        }),
                        stroke: new _ol_style_Stroke_({
                            color: '#ff6579',
                            width: 1
                        })
                    })
                });
            }
            that.map.ol_map.getLayers().push(that.circleLayer);
            that.map.ol_map.getLayers().set('radius', that.circleLayer, true);


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
                        window.db.GetSupplierFeature(new Date(window.user.date),feature.values_.object.uid,function (res) {
                            if(res[0]!==-1) {
                                if (feature.values_.object.date.valueOf() === new Date(window.user.date).valueOf()) {

                                    if(window.user.constructor.name==="Supplier"){
                                        if(feature.values_.object.profile.type==='marketer')
                                            return;
                                    }

                                    let style = getObjectStyle(feature.values_.object, res[0].values_.object);
                                    cluster_feature.setStyle(style);

                                    if(window.user.constructor.name==="Customer") {
                                        if(feature.values_.object.profile.type==='marketer')
                                            return;

                                        let source = that.circleLayer.getSource();

                                        let radiusFeature='';
                                        if(feature.values_.object.radius_feature) {
                                            radiusFeature = feature.values_.object.radius_feature;
                                        }else {
                                            radiusFeature = new Feature({
                                                geometry: new Circle(proj.fromLonLat([res[0].values_.object.longitude, res[0].values_.object.latitude]), res[0].values_.object.radius)
                                                //name: cursor.value.title ? cursor.value.title : "",
                                                //tooltip: cursor.value.title ? cursor.value.title : "",
                                            });

                                            feature.values_.object.radius_feature = radiusFeature;

                                            let col = new Collection();
                                            col.push(radiusFeature);
                                            let draw = new Draw({
                                                geometryName: 'circle',
                                                source: source,
                                                type: 'Circle',
                                                features: col
                                            });
                                            source.addFeature(radiusFeature);
                                        }

                                    }

                                }else{
                                    vectorSource.removeFeature(feature);
                                }
                            }else{
                                vectorSource.removeFeature(feature);
                            }
                        });
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

                    let logo = obj.logo;
                    scale = Math.pow(that.map.ol_map.getView().getZoom(),2)/300;
                    if(obj.profile.type==='marketer'){

                        ic_clust = obj.img;
                        scale = Math.pow(that.map.ol_map.getView().getZoom(),2)/500;
                    }
                    let opacity;
                    if ( obj.apprs<1)
                        opacity = 0.9;
                    else
                        opacity = 1.0;


                    let iconItem = new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
                        // size: [50,50],
                        //img: image,
                        //imgSize:
                        scale: obj.profile.thmb?scale:scale*.5, //cl_feature.I.features.length>1 || obj.image.indexOf('/categories/')!== -1?0.3:1.0,//
                        anchor: obj.profile.thmb?[20, 20]:[40, 40],
                        anchorOrigin: 'bottom-left',
                        offset: [0, 0],
                        anchorXUnits: 'pixel',
                        anchorYUnits: 'pixel',
                        color: [255, 255, 255, 1],
                        opacity: opacity,
                        src: obj.profile.thmb?obj.profile.thmb: "./images/user.png"
                    }));
                    let iconCluster= new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
                        //size: [100,100],
                        //img: image,
                        //imgSize:
                        scale: .2, //cl_feature.I.features.length>1 || obj.image.indexOf('/categories/')!== -1?0.3:1.0,//
                        anchor: [20, 20],
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
                                font: '12px serif',
                                align: 'right',
                                //scale: .1,
                                offsetX: 25,
                                offsetY: -5,
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

                        if(that.map.ol_map.getView().getZoom()<15)
                            return;

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
}


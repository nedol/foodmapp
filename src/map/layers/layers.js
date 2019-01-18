export {Layers};

import layerVector from 'ol/layer/vector';
import srcVector from 'ol/source/vector';
import BingMaps from 'ol/source/bingmaps';
import TileLayer from 'ol/layer/tile';
import OSM from 'ol/source/osm';
import Cluster from 'ol/source/cluster';
import Style from 'ol/style/style';
import Icon from 'ol/style/icon';
import Fill from 'ol/style/fill';
import Text from 'ol/style/text';
import Stroke from 'ol/style/stroke';


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

            // if(map_strg)
            //     SetMapVisible(map_strg);

            $(".category").each(function (i, el) {
                let cat = $(el).attr("id");
                let state = $(el).attr("state");
                that.CreateLayer(cat, state);
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

        let vectorLayer = new layerVector({
            map_type: false,
            source: vectorSource,
            vector: vectorSource,
            cluster: clusterSource,
            style: function (cluster_feature, atr) {

                let period = $('.sel_period').text().split(' - ');
                let features = cluster_feature.values_.features;
                let rem_feat = [];
                if (features.length > 0) {
                    $.each(features, function (key, feature) {
                        let id_str = feature.getId();
                        window.db.getSupplier(window.user.date,period[0],period[1],feature.values_.object.uid,function (res) {
                            if(res!==-1) {
                                if (feature.values_.object.date === window.user.date) {
                                    let style = getObjectStyle(feature.values_.object);
                                    if (style)
                                        cluster_feature.setStyle(style);
                                }else{
                                    vectorSource.removeFeature(feature);
                                }
                            }else{
                                vectorSource.removeFeature(feature);
                            }
                        });
                        if(feature.values_.object.supuid && feature.values_.object.cusuid)
                            window.db.GetOrder(window.user.date,feature.values_.object.supuid, feature.values_.object.cusuid,function (res) {
                                if(res!==-1) {
                                    if (feature.values_.object.date === window.user.date) {
                                        let style = getObjectStyle(feature.values_.object);
                                        if (style)
                                            cluster_feature.setStyle(style);
                                    }else{
                                        vectorSource.removeFeature(feature);
                                    }
                                }else{
                                    vectorSource.removeFeature(feature);
                                }
                            });
                    });
                }

                function getObjectStyle(obj) {

                    if (!obj || parseInt(obj.status) === 0)
                        return null;

                    let logo = '';
                    let scale = 1;

                    logo = obj.logo;
                    scale = .3;//Map.getView().getZoom()/obj.ambit;

                    let opacity;
                    if (parseInt(obj.status) === 2 && obj.category !== '12')
                        opacity = 0.3;
                    else
                        opacity = 1.0

                    let icon = new Icon(/** @type {olx.style.IconOptions} */ ({
                        //size: [50,40],
                        //img: img ? [img.width, img.height] : undefined,
                        scale: scale, //cl_feature.I.features.length>1 || obj.image.indexOf('/categories/')!== -1?0.3:1.0,//
                        anchor: [0, 0],
                        anchorOrigin: 'bottom-left',
                        offset: [0, 0],
                        anchorXUnits: 'pixel',
                        anchorYUnits: 'pixel',
                        color: [255, 255, 255, 1.0],
                        opacity: opacity,
                        src: logo
                    }));
                    let iconStyle;
                    if (features.length > 1) {
                        iconStyle = new Style({
                            text: new Text({
                                text: cluster_feature.values_.features.length.toString(),
                                font: '12px serif',
                                align: 'right',
                                scale: 1.2,
                                offsetX: 40,
                                offsetY: -5,
                                fill: new Fill({
                                    color: 'blue'
                                }),
                                stroke: new Stroke({
                                    color: 'white',
                                    width: 2
                                })
                            }),
                            image: icon,
                            zIndex: 2
                        });
                    } else {

                        iconStyle = new Style({
                            text: new Text({
                                text: (obj.overlay === '' || !obj.overlay ? obj.title : ''),
                                font: '8px serif',
                                align: 'center',
                                scale: 1.5,
                                offsetX: 15,
                                offsetY: 0,
                                baseline: 'top',
                                fill: new Fill({
                                    color: 'red'
                                }),
                                stroke: new Stroke({
                                    color: 'white',
                                    width: 2
                                })
                            }),
                            image: icon,
                            zIndex: 2
                        });
                    }


                    // setTimeout(function (feature,style) {
                    //     style.setImage( new ol.style.Icon({
                    //         src: ic_8,
                    //         rotateWithView: true,
                    //         anchor: [.5, .5],
                    //         anchorXUnits: 'pixel', anchorYUnits: 'pixel',
                    //         opacity: 1
                    //     }));
                    //     feature.setStyle(style); !!!
                    // },100,cl_feature, iconStyle);


                    //TODO
                    let shadowStyle = new Style({
                        stroke: new Stroke({
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

                let style = new Style({
                    image: new ol.style.Circle({
                        radius: radius,
                        snapToPixel: false,
                        stroke: new Stroke({
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


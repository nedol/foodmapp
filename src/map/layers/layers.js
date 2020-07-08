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

            // if(!that.circleLayer && window.user.profile.profile.type!=='deliver') {
            //     this.CreateCircleLayer();
            // }

            that.map.ol_map.on('moveend', function (event) {

                let extent = that.map.ol_map.getView().calculateExtent();
                let tr_ext = proj.transformExtent(extent,'EPSG:3857','EPSG:4326');
                if(isNaN(tr_ext[1]) || isNaN(tr_ext[3]) || isNaN(tr_ext[0]) || isNaN(tr_ext[2]))
                    return;
                that.map.GetObjectsFromStorage([tr_ext[1],tr_ext[3],tr_ext[0],tr_ext[2]]);

                let source;
                if(that.circleLayer) {
                    source = that.circleLayer.getSource();
                }else {
                    return;
                }

                let features = source.getFeatures();
                let utils = new UtilsMap();

                for(let f in features){
                    let util = new UtilsMap();
                    if(util.IsInsideRadius(that.map, features[f])){
                        if($('.deliver_but[supuid='+features[f].values_.obj.uid+']').length===0) {
                            let deliver_but =
                                '<div><input type="image" class="deliver_but"'+
                                'src="'+that.path +"/server/images/"+features[f].values_.obj.profile.avatar+'"' +
                                ' supuid=' +features[f].values_.obj.uid+'></div>';
                            $('#deliver_container').append(deliver_but);
                            $('#deliver_container').css('display','block');

                            // $('#deliver_but').attr('src',that.path +"/server/images/"+features[f].values_.obj.profile.avatar);
                        }

                        if(that.circleLayer.style_.fill_)
                            that.circleLayer.style_.fill_.color_ = 'rgba(255, 255, 255, 0.2)';

                    }else{
                        if(features[f].values_.obj)
                            $('.deliver_but[supuid='+features[f].values_.obj.uid+']').parent().remove();
                        // that.circleLayer.style_.fill_.color_ = 'rgba(255, 255, 255, 0)'
                    }
                }

                let pos = JSON.parse(localStorage.getItem("deliver_pos"));
                if(pos)
                    $('#deliver_container').offset({top:pos.top,left:pos.left});
                $('#deliver_container').draggable(
                    { delay: 100},
                    { start: function (ev) {

                    },
                        drag: function (ev) {
                            $('.deliver_but').attr('drag','true');
                        },
                        stop: function (ev) {

                            $('.deliver_but').attr('drag','false');

                            let left = $('#deliver_container').position().left;
                            // $(el).css('right', rel_x + '%');
                            let top = $('#deliver_container').position().top;
                            // $(el).css('bottom', rel_y + '%');
                            localStorage.setItem("deliver_pos",JSON.stringify({top:top,left:left}));

                        }
                    });
                    $('.deliver_but').off();
                    $('.deliver_but').on('click touchstart', function (ev) {
                        setTimeout(function () {
                            if($('.deliver_but').attr('drag')!=='true')
                                window.user.OnClickDeliver(ev.currentTarget);
                        },200);
                    });
            });


        } catch (ex) {
            console.log("InitLayers");
        }
    }

    CreateCircleLayer(style){

        this.circleLayer = new layerVector({
            source: new srcVector(),
            style: style
        });
        this.map.ol_map.getLayers().push(this.circleLayer);
        this.map.ol_map.getLayers().set('radius', this.circleLayer, true);
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
            distance: 50,//parseInt(50, 10),
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
                        // if(feature.getId()===id_str)
                        //     return;
                        id_str = feature.getId();
                        setTimeout(function () {
                            id_str = '';
                        },300);

                        if (feature.values_.object.date.valueOf() === new Date(window.user.date).valueOf()) {

                            // if(window.user.constructor.name==="Supplier"){
                            //     if(feature.values_.object.profile.type==='marketer')
                            //         return;
                            // }

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
                    function stringDivider(str, width, spaceReplacer) {
                        if (str.length > width) {
                            var p = width;
                            while (p > 0 && (str[p] != ' ' && str[p] != '-')) {
                                p--;
                            }
                            if (p > 0) {
                                var left;
                                if (str.substring(p, p + 1) == '-') {
                                    left = str.substring(0, p + 1);
                                } else {
                                    left = str.substring(0, p);
                                }
                                var right = str.substring(p + 1);
                                return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
                            }
                        }
                        return str;
                    }

                    let ic_clust = "./images/truck.png";
                    let scale = 1;
                    let opacity = 1;
                    // if ( obj.apprs<1)
                    //     opacity = 0.9;
                    // else
                    //     opacity = 0.5;
                    let logo = obj.logo;

                    let diff = new Date().getTime() - new Date(obj.published).getTime();
                    var days = Math.floor(diff / (1000 * 60 * 60 * 24));

                    if (days >= 30)//просрочен
                        obj.delayed = true;

                    let zoom = that.map.ol_map.getView().getZoom();
                    scale = Math.pow(zoom,3)/30000;
                    if(obj.profile.type==='marketer'){
                        if(zoom<12 && features.length===1)//non cluster
                            return;
                        ic_clust = obj.img;
                        scale = Math.pow(that.map.ol_map.getView().getZoom(),4)/600000;

                    }else if(obj.profile.type==='deliver'){
                        // if(that.map.ol_map.getView().getZoom()<15)
                        //     return;
                        ic_clust = obj.img;
                        scale = Math.pow(that.map.ol_map.getView().getZoom(),3)/10000;
                        opacity = 0;
                    }else if(obj.profile.type==='foodtruck'){
                        // if(that.map.ol_map.getView().getZoom()<15)
                        //     return;
                        ic_clust = obj.img;
                        scale = Math.pow(that.map.ol_map.getView().getZoom(),3)/10000;
                        opacity = 1;
                    }

                    if(days>=30) {
                        opacity /= days-30;
                    }
                    if(days>30){
                        opacity = 0.3;
                    }

                        let thmb = window.location.origin +"/d2d/server/images/"+obj.profile.avatar;
                        if(host_port.includes('nedol.ru/server'))
                            thmb = host_port +"/images/"+obj.profile.avatar;


                        let iconItem = new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
                            //size: [300,500],
                            //img: image,
                            //imgSize:
                            scale: obj.delayed?scale/1.5:scale, //cl_feature.I.features.length>1 || obj.image.indexOf('/categories/')!== -1?0.3:1.0,//
                            // anchor: [0.5,0.5],
                            // anchorOrigin: 'top-left',//'bottom-left',
                            offset: [0, 0],
                            offsetOrigin:  'top-left',
                            // anchorXUnits: 'pixel',
                            // anchorYUnits: 'pixel',
                            color: obj.delayed?[200, 200, 200]:[255, 255, 255],
                            opacity: opacity,
                            src: obj.profile.avatar?thmb: "./images/user.png",
                            crossOrigin: 'anonymous',
                            fill: new _ol_style_Fill_({
                                color: 'gray'
                            })
                        }));

                    let iconStyle;
                    if (features.length > 1) {//cluster
                        ic_clust = "./images/user.png";
                        let iconCluster= new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ ({
                            //size: [100,100],
                            //img: image,
                            //imgSize:
                            crossOrigin: 'anonymous',
                            scale: scale, //cl_feature.I.features.length>1 || obj.image.indexOf('/categories/')!== -1?0.3:1.0,//
                            // anchor: [40, 40],
                            // anchorOrigin: 'top-right',
                            offset: [0, 0],
                            // anchorXUnits: 'pixel',
                            // anchorYUnits: 'pixel',
                            color: [255, 255, 255, 1],
                            opacity: 0.5,
                            src: ic_clust
                        }));

                        let label  = cluster_feature.values_.features.length.toString();
                        iconStyle = new _ol_style_Style_({
                            text: new Text({
                                text: label,
                                font: (90*scale).toFixed(0)+'px serif',
                                textAlign: 'end',
                                //scale: .1,
                                offsetX:0,
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
                        let nameAr = obj.profile.name.split(" ");
                        let label  = nameAr.join('\n');
                        let canvas = document.createElement('canvas');
                        let context = canvas.getContext('2d');
                        let width = context.measureText(label).width;
                        iconStyle = new _ol_style_Style_(
                            {
                            // text: new Text({
                            //     text: zoom>=18?label:'',
                            //     font: (80*scale).toFixed(0)+'px serif',
                            //     placement: 'point',
                            //     align: 'center',
                            //     //scale: 1.5,
                            //     offsetX: 0,//width/2,
                            //     offsetY: 25,
                            //     baseline: 'bottom',
                            //     fill: new _ol_style_Fill_({
                            //         color: 'gray'
                            //     }),
                            //     stroke: new _ol_style_Stroke_({
                            //         color: 'white',
                            //         width: 2
                            //     })
                            // }),
                            image: iconItem,
                            zIndex: 20
                        });
                        try {
                            if(that.circleLayer) {
                                let source = that.circleLayer.getSource();
                                if (obj.radius_feature)
                                    source.addFeature(obj.radius_feature);
                            }
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

    EmptyLayer(){

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


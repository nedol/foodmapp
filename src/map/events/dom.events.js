'use strict'
export {DOMEvents};

import {Overlay} from "../overlay/overlay";
var moment = require('moment/moment');

import Extent from 'ol/extent';
import {Dict} from '../../dict/dict.js';

class DOMEvents {
    constructor(map) {
        this.map = map;

        let that = this;

        $(window).on("orientationchange", function () {

            console.log("screen width " + screen.width);
            console.log("search_but left position " + $("#search_but").position().left);
            console.log("search_but top position " + $("#search_but").position().top);

            // $("#zoom_but").css('left', parseInt(screen.width - 50) + 'px');
            //
            // $("#search_but").css('left', parseInt(screen.width - 50 /*$("#search_but").css('left')*/) + 'px');
            // $("#search_but").css('top', parseInt(screen.height - $("#search_but").css('top')) + 'px');
            //
            // $("#loc_ctrl").css('left', parseInt(screen.width - 50/*- $("#loc_ctrl").css('left')*/) + 'px');
            // $("#loc_ctrl").css('top', parseInt(screen.height - $("#loc_ctrl").css('top')) + 'px');

        });

        $('#loc_ctrl').on('click', this, ev=> {
            window.user.map.geo.StartLocation(ev);
            if(window.user.SendLocation && !window.user.isShare_loc){
                if (window.user.date === moment().format('YYYY-MM-DD') &&
                    window.user.store[window.user.date].status) {
                    if (confirm("Share Your Location?")) {
                        window.user.isShare_loc = true;
                    }
                }
            }
        });

        $('#pin').on('click', this, ev=>{
            window.user.map.geo.StopLocation(ev);
            window.user.isShare_loc = false;
        });

        $('#search_but').on('click', this, function (ev) {

            if ($("#search_but").attr('drag') === 'true') {
                $("#search_but").attr('drag', false);
                return;
            }
            let text = "Input location name";
            let hint = "London, Trafalgar Square";
            if (window.window.sets.lang === 'ru') {

                if ($('#search_but').attr('hint')) {
                    hint = $('#search_but').attr('hint');
                } else {

                    text = "Введите наименование товара или адрес";
                    hint = "Москва,  улица Адмирала Корнилова, 10";//"кофе";//
                }
            }
            let search = prompt(text, hint);
            $('#search_but').attr('hint', search);

            if (search.split(',').length>2) {
                window.user.map.geo.SearchLocation(search, function (bound) {
                    if(bound)
                        window.user.map.MoveToBound(bound);//{sw_lat: bound[0], sw_lng: bound[2], ne_lat: bound[1], ne_lng: bound[3]});
                });
            }else{
                window.db.GetAllSuppliers(window.user.date,function (features) {
                    for(let f in features){
                        for(let a in features[f].data){
                            let dict = new Dict(features[f].dict.dict);
                            for(let i in features[f].data[a]) {
                                let val  = dict.getValByKey(window.sets.lang, features[f].data[a][i].title);
                                if(val.toLowerCase().includes(search.toLowerCase())){
                                    ;
                                }
                            }
                        }
                    }
                });
            }
        });


        // TODO: $("#search_but").draggable({
        //     start: function () {
        //         console.log("drag start");
        //     },
        //     drag: function () {
        //         $("#search_but").attr('drag', true);
        //     },
        //     stop: function () {
        //         var rel_x = parseInt($("#search_but").position().left / window.innerWidth * 100);
        //         $("#search_but").css('right', rel_x + '%');
        //         var rel_y = parseInt($("#search_but").position().bottom / window.innerHeight * 100);
        //         $("#search_but").css('top', rel_y + '%');
        //     }
        // });

        //TODO: $("#loc_ctrl").draggable({
        //     distance: 20,
        //     start: function () {
        //         console.log("");
        //     },
        //     drag: function () {
        //         $("#loc_ctrl").attr('drag', true);
        //     },
        //     stop: function () {
        //         var rel_x = parseInt($("#loc_ctrl").position().left / window.innerWidth * 100);
        //         $("#loc_ctrl").css('left', rel_x + '%');
        //         var rel_y = parseInt($("#loc_ctrl").position().top / window.innerHeight * 100);
        //         $("#loc_ctrl").css('top', rel_y + '%');
        //     }
        // });

        var zoom_y_0;
        var drag_zoom;
        $("#zoom_but").draggable({
            axis: "y",
            revert: true,
            delay: 50,
            start: function () {
                zoom_y_0 = $("#zoom_but").position();
                drag_zoom = true;

                setTimeout(function () {
                    var zoom_y_1 = $("#zoom_but").position();
                    if (zoom_y_0.top > zoom_y_1.top)
                        SetMapZoomInRec();
                    else
                        SetMapZoomOutRec();
                }, 10);

                function SetMapZoomInRec() {
                    var zoom = parseInt(that.map.ol_map.getView().getZoom());
                    that.SetMapZoom(zoom + 1, that.map.ol_map.getView().getCenter(), function () {
                        // Map.render();
                        var to = setTimeout(function () {
                            if (drag_zoom)
                                SetMapZoomInRec();
                            else
                                clearTimeout(to);
                        }, 100);
                    });
                }

                function SetMapZoomOutRec() {
                    var zoom = parseInt(that.map.ol_map.getView().getZoom());
                    that.SetMapZoom(zoom - 1, that.map.ol_map.getView().getCenter(), function () {
                        var to = setTimeout(function () {
                            if (drag_zoom)
                                SetMapZoomOutRec();
                            else
                                clearTimeout(to);
                        }, 100);
                    });
                }

            },
            drag: function () {

            },
            stop: function () {
                drag_zoom = false;
                var y = parseInt($(this).position().top / window.innerHeight * 100);
                $(this).css('top', y + '%');
            }
        });

    };

    CheckDeleteFeature(feature, coordinate, layer) {

        var rect = $("#bucket")[0].getBoundingClientRect();
        var lb = this.map.ol_map.getCoordinateFromPixel([rect.left, rect.bottom]);
        var rb = this.map.ol_map.getCoordinateFromPixel([rect.right, rect.bottom]);
        var rt = this.map.ol_map.getCoordinateFromPixel([rect.right, rect.top]);
        var lt = this.map.ol_map.getCoordinateFromPixel([rect.left, rect.top]);
        var coordinates = [lb, rb, rt, lt];
        var bucket_ext = Extent.boundingExtent(coordinates);
        var feature_ext = feature.getGeometry().getExtent();
        var ext = Extent.getIntersection(bucket_ext, feature_ext);
        if (!Extent.isEmpty(ext)) {
            var hash = feature.values_.features[0].getId();
            if (hash) {
                var obj = JSON.parse(localStorage.getItem(hash));
                obj.status = 0;
                localStorage.setItem(hash, JSON.stringify(obj));
                if (layer)
                    layer.getSource().removeFeature(feature);
            }
        }
    }

    SetMapZoom(zoom, coor, callback) {

        this.map.ol_map.getView().animate({
            zoom: zoom,
            duration: window.sets.animate_duration,
            center: coor
        }, function () {
            callback();
        });

        if (parseInt($("#zoom_but").text) !== parseInt(zoom))
            $("#zoom_but").text(parseInt(zoom));
        if (zoom >= 14)
            $("#zoom_but").css('color', 'blue');
        else
            $("#zoom_but").css('color', 'black');


    }
}
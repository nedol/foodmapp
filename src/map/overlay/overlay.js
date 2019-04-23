export {Overlay};

import {Utils} from "../../utils/utils";

//import {User} from "../menu/user";
import _ol_Overlay_  from "ol/overlay";
import proj from 'ol/proj';
import Collection from 'ol/collection';

import Feature from 'ol/feature';
import layerVector from 'ol/layer/vector';
import srcVector from 'ol/source/vector';
import _ol_style_Style_ from 'ol/style/style';
import _ol_style_Circle_ from 'ol/style/circle';
import _ol_style_Icon_ from 'ol/style/icon';
import _ol_style_Fill_ from 'ol/style/fill';
import Text from 'ol/style/text';
import _ol_style_Stroke_ from 'ol/style/stroke';
import interaction_ from 'ol/interaction';
import Modify from 'ol/interaction/modify';
import Draw from 'ol/interaction/draw';
import Snap from 'ol/interaction/snap';
import Circle from 'ol/geom/circle';

let utils = new Utils();

(function($) {
    $.fn.doubleTap = function(doubleTapCallback) {
        return this.each(function(){
            var elm = this;
            var lastTap = 0;
            $(elm).on('touchstart', function (e) {
                var now = (new Date()).valueOf();
                var diff = (now - lastTap);
                lastTap = now ;
                if (diff < 250) {
                    if($.isFunction( doubleTapCallback ))
                    {
                        doubleTapCallback.call(elm);
                    }
                }
            });
        });
    }
})(jQuery);

class Overlay {

    constructor(map, element, offer) {

        this.map = map;
        let that = this;
        this.draw;
        this.modify;
        this.snap; // global so we can remove them later

        let domRect = $(element)[0].getBoundingClientRect();
        this.overlay = new _ol_Overlay_({
            element: element,
            position: offer.location,
            positioning: 'center-center',//'bottom-right',//'top-left',//'bottom-left',
            offset: [0,0]
        });
        if(window.user.profile.profile.type==='deliver')
            this.CreateCircle(offer);

        element.ovl = this.overlay;

        $(element).on('map:pointerdrag', function (ev) {

            try {
                // var offset = $(this).offset();
                // var center = proj.transform(that.map.ol_map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
                // var coor = proj.transform(this.ovl.getPosition(), 'EPSG:3857', 'EPSG:4326');
                // var x = utils.LatLonToMeters(center[0], 0, coor[0], 0);
                // x = center[0] > coor[0] ? x : -x;
                // var y = utils.LatLonToMeters(0, center[1], 0, coor[1]);
                // y = center[1] < coor[1] ? y : -y;
            }catch(ex){
            }
        });

        this.map.ol_map.addOverlay(this.overlay);

        // this.transition = setTimeout(function () {
        //
        //     $(element).addClass("ovl_scale");
        //     $(element).trigger("scale");
        //     var scale = 1;//Math.pow((Map.getView().getZoom()/15),3).toFixed(3);
        //     $(element).css('transform', 'scale(' + scale + ')');
        //     // $(element).css('transition', 'transform 100ms');
        // }, 5);

        $(element).on('dblclick', window.user, function (ev) {
            if(window.user.profile.profile.type==='deliver')
                window.user.editor.OpenOffer();
            else
                window.user.editor.InitSupplierOffer();

        });

        $(element).doubleTap(function (el) {
            if(window.user.profile.profile.type==='deliver')
                window.user.editor.OpenOffer();
            else
                window.user.editor.InitSupplierOffer();
        })

        this.map.ol_map.getView().on('change:resolution', function (ev) {

            // var scale = Math.pow((this.getZoom()/15),3).toFixed(3);
            // $(element).css('width', parseInt(parseInt($(element).attr('width'))*scale));
            // $(element).css('height', parseInt(parseInt($(element).attr('width'))*scale));
            //
            // $(element).css('transition', 'transform 100ms');
            // $("#"+$(element).attr('id')+"_img").height(scale);
            // $("#"+$(element).attr('id')+"_img").width(scale);
            $( element ).trigger("change:zoom", [event]);
        });

        this.overlay.on('change:position', function (e) {
            //$('#browser_container').css('display','inline-block');
            console.log();
        });

        this.overlay.on('change:positioning', function (e) {
            //$('#browser_container').css('display','inline-block');
            console.log();
        });

        this.overlay.on('change:map', function (e) {
            //$('#browser_container').css('display','inline-block');
            console.log();
        });

        this.overlay.on('stop_location', function (e, param1, param2) {

        });

        $(".overlay").on("change:cur_pos", function (evt, coor, param2) {

        });

        this.map.ol_map.getView().on('change:center', function (event) {
            $(element).trigger("change:center", [event]);
        });

        this.map.ol_map.on('moveend', function (event) {

            $(element).trigger("map:moveend", [event]);
        });

        this.map.ol_map.on('movestart', function (event) {
            $(element).trigger("map:movestart", [event]);
        });

        this.map.ol_map.on('pointerdrag', function (event) {
            $(element).trigger("map:pointerdrag", [event]);
        });


    };

    CreateCircle(offer) {
        let that = this;
        let layer = window.user.map.layers.circleLayer;
        var source = layer.getSource();

        var radiusFeature = new Feature({
            geometry: new Circle(offer.location,offer.radius?offer.radius:1000)
            //name: cursor.value.title ? cursor.value.title : "",
            //tooltip: cursor.value.title ? cursor.value.title : "",
        });

        radiusFeature.setId('radius_feature');
        source.addFeature(radiusFeature);

        let col = new Collection();
        col.push(radiusFeature);
        that.draw = new Draw({
            geometryName:'circle',
            source: source,
            type: 'Circle',
            features:col
        });

        //that.map.ol_map.addInteraction(that.draw);
        that.snap = new Snap({source: source});
        that.map.ol_map.addInteraction(that.snap);

        that.modify = new Modify({source: source});

        that.map.ol_map.addInteraction(that.modify);

        that.draw.addEventListener('drawstart', function (ev) {

        });
        that.draw.addEventListener('drawend', function (ev) {
           // that.map.ol_map.removeInteraction(that.draw);
            that.overlay.values_.position = ev.target.sketchCoords_[0];
        });
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
    }

    DownloadOverlay(url, obj) {

        var id_str = GetObjId(obj.latitude, obj.longitude);
        if ($("[id='" + id_str + '_ovl_container' + "']").length === 0)
            $.ajax({
                url: url + "?v=" + Date.now(),
                obj: obj,
                method: "GET",
                dataType: 'text',
                processData: false,
                async: true,   // asynchronous request? (synchronous requests are discouraged...)
                cache: false,
                crossDomain: true,
                success: function (data) {

                    var id_str = GetObjId(this.obj.latitude, this.obj.longitude);
                    var replacements = {
                        '_id_': id_str,
                        '_lat_': this.obj.latitude,
                        '_lon_': this.obj.longitude,
                        '_cat_': this.obj.category
                    }

                    if (obj.logo)
                        replacements["logo"] = obj.logo;

                    var newNode = data.replace(/_\w+_/g, function (all) {
                        return all in replacements ? replacements[all] : all;
                    });

                    if ($("[id='" + id_str + '_ovl_container' + "']").length === 0) {

                        $(document).on("overlay", function (e) {
                            //console.log("InitLayers");
                        });

                        var div_ovl = $("#ovl_container").clone();
                        $(div_ovl).attr('id', id_str + '_ovl_container');
                        $(div_ovl).attr('ovl_cat', this.obj.category);
                        $(div_ovl).attr('class', 'overlay');
                        $(div_ovl).attr('src', data);

                        $(newNode).appendTo(div_ovl);
                        $(div_ovl).appendTo("#html_container");

                        var logo = $(div_ovl).find('.logo');
                        if (logo) {
                            var logo_id = localStorage.getItem(obj.logo_id);
                            $(logo).attr('src', logo_id);
                        }

                        var lon = parseFloat(this.obj.longitude);
                        var lat = parseFloat(this.obj.latitude);

                        jQuery.fn.InitOverlay =
                            function () {
                                var ovl = new Overlay(
                                    id_str,
                                    $('#' + id_str + '_ovl_container')[0],
                                    ol.proj.fromLonLat([lon, lat]));
                            }();

                        var zoom = d2d_map.ol_map.getView().getZoom();

                        $("#" + this.obj.id + "_include").find('.overlay_img').css('height', String(zoom * 4) + 'px');
                        $("#" + this.obj.id + "_include").find('.overlay_img').css('width', String(zoom * 4) + 'px');

                    }
                },

                error: function (xhr, status, error) {
                    //var err = eval("(" + xhr.responseText + ")");
                    console.log(error.Message);
                },
                complete: function (data) {
                    flag = true;
                    if ($.isFunction('AddOverlayRecurs'))
                        eval('AddOverlayRecurs()');
                },
            });
    }

    DownloadOverlayIFrame(url, obj) {

        var id_str = GetObjId(obj.latitude, obj.longitude);

        if ($("[id='" + id_str + '_ovl_container' + "']").length === 0) {

            var div_ovl = $("#html_container").clone();
            $(div_ovl).attr('id', id_str + '_ovl_container');
            $(div_ovl).attr('ovl_cat', obj.category);
            $(div_ovl).find('iframe').attr('src', url + "?v=" + Date.now());
            $(div_ovl).find('iframe').attr('id', id_str + '_ovlframe');
            $(div_ovl).find('iframe').on('load', OnLoadOvlFrame);
            $(div_ovl).find('iframe').css('opacity', obj.status === '2' ? .5 : 1);
            $(div_ovl).appendTo("#html_container");

            var lon = parseFloat(obj.longitude);
            var lat = parseFloat(obj.latitude);

            jQuery.fn.InitOverlay =
                function () {
                    var ovl = new Overlay(
                        id_str,
                        $('#' + id_str + '_ovl_container')[0],
                        ol.proj.fromLonLat([lon, lat]));
                }();


            // $("#" + this.obj.id + "_include").find('.overlay_img').css('height', String(zoom * 4) + 'px');
            // $("#" + this.obj.id + "_include").find('.overlay_img').css('width', String(zoom * 4) + 'px');

        }
    }

    OnLoadOvlFrame(ev) {

        var iframe = ev.target;

        db.GetObject(iframe.id.split('_')[0], function (obj) {

            if (typeof $('#' + iframe.id)[0].contentWindow.GetTips === "function") {

                if (obj.category == 3 && obj.status !== '1')
                    return;

                function ReplyValidation(res, el) {
                    // alert("Правильно!");
                    if (res) {
                        var obj_id = iframe.id.split('_')[0];

                        db.SetObjectAttr(obj_id, 'status', '2');

                        User.level++;
                        $('#' + iframe.id)[0].remove();
                        $(clone).remove();

                        db.SetObjectAttr(MD5("uname"), 'level', User.level);

                    } else {
                        if (User.level > 0) {
                            User.level--;
                            db.SetObjectAttr(MD5("uname"), 'level', User.level);
                        }
                        $(el).remove();
                    }
                }


                var tips = $('#' + iframe.id)[0].contentWindow.GetTips(ReplyValidation);
                var clone = $(tips).clone();
                for (var i = 0; i < clone.length; i++) {
                    $(clone[i]).insertAfter(iframe);
                    $(clone[i]).css('display', 'block');
                    $(clone[i]).on('click', function () {
                        iframe.contentWindow.OnClickTip(this, function (res, el) {
                            // alert("Правильно!");
                            if (res) {
                                var obj_id = iframe.id.split('_')[0];

                                db.SetObjectAttr(obj_id, 'status', '2');

                                User.level++;
                                $('#' + iframe.id)[0].remove();
                                $(clone).remove();

                                db.SetObjectAttr(MD5("uname"), 'level', User.level);

                            } else {
                                if (User.level > 0) {
                                    User.level--;
                                    db.SetObjectAttr(MD5("uname"), 'level', User.level);
                                }
                                $(el).remove();
                            }
                        });
                    });
                }
            }
        });

        iframe.style.display = "block";
        iframe.style.height = '100px';//iframe.contentWindow.document.body.scrollHeight + "px";
        iframe.style.width = '100px';//iframe.contentWindow.document.body.scrollWidth + "px";
    }

    OverlayFrame(url, obj) {

        var id_str = GetObjId(obj.latitude, obj.longitude);

        if ($("[id='" + id_str + '_ovl_container' + "']").length === 0) {
            //$('link[rel=import]:last').attr('href',obj.overlay);

            $(document).on("overlay", function (e) {
                //console.log("InitLayers");
            });

            var ovl_frame = $("#ovl_frame").clone();
            $(ovl_frame).attr('id', id_str + '_ovl_frame');
            $(ovl_frame).attr('ovl_cat', obj.category);
            $(ovl_frame).attr('src', url + "?v=" + String(new Date().getTime()));

            $(ovl_frame).appendTo("#html_container");

            var lon = parseFloat(obj.longitude);
            var lat = parseFloat(obj.latitude);

            jQuery.fn.InitOverlay =
                function () {
                    setTimeout(function () {
                        var ovl = new Overlay(
                            id_str,
                            $('#' + id_str + '_ovl_frame')[0],
                            ol.proj.fromLonLat([lon, lat]));
                        flag = true;
                        AddOverlayRecurs();

                    }, 100);
                }();

            var zoom = d2d_map.ol_map.getView().getZoom();

            $("#" + obj.id + "_include").find('.overlay_img').css('height', String(zoom * 4) + 'px');
            $("#" + obj.id + "_include").find('.overlay_img').css('width', String(zoom * 4) + 'px');

        }


    }

    RemoveOverlay() {
        let that = this;
        that.map.ol_map.removeOverlay(that.overlay);
    }

}
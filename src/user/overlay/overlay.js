export {RemoveOverlay,DownloadOverlay};
import {User} from "../menu/user";
import {d2d_map} from "../user.entry";
import ol_ovl from "ol/overlay";


function Overlay(id, element, coor){

        var iframe= $(element).find("iframe");
        var width = $(iframe).width();
        var height = $(iframe).height();

        this.overlay = new ol_ovl({
            id: id,
            element: element,
            positioning: 'bottom-right',
            offset: [width,width/2]
        });

        element.ovl =  this.overlay;

        $(element).on('map:pointerdrag', function (ev) {

            var offset = $(this).offset();
            var center = ol.proj.transform(d2d_map.ol_map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
            var coor = ol.proj.transform(this.ovl.getPosition(), 'EPSG:3857', 'EPSG:4326');
            var x = LatLonToMeters(center[0],0,coor[0],0);
            x= center[0]>coor[0]? x:-x;
            var y = LatLonToMeters(0,center[1],0,coor[1]);
            y= center[1]<coor[1]? y:-y;

            ev.offset = {'x':x,'y':y};
            if(iframe[0].contentWindow)
                iframe[0].contentWindow.MapMoveEvent(ev);
        });

        this.coordinates = coor;

        this.overlay.setPosition(this.coordinates);

        d2d_map.ol_map.addOverlay(this.overlay);

        this.transition = setTimeout(function() {

            $(element).addClass("ovl_scale");
            $(element).trigger("scale");
            var scale = 1;//Math.pow((Map.getView().getZoom()/15),3).toFixed(3);
            $(element).css('transform', 'scale('+scale+')');
            // $(element).css('transition', 'transform 100ms');
        }, 5);


        $("#"+$(element).attr('id')+"_img").on('click', function (e) {
            console.log("on click");
            // $("#"+$(element).attr('id')+"_img").attr('src','./images/gifs/McDonalds/RonaldMcDonalds_128.gif');
        });

        $("#"+$(element).attr('id')+"_img").on('touchstart', function (ev) {

        });


        d2d_map.ol_map.getView().on('change:resolution',  function (ev) {

            //var scale = Math.pow((Map.getView().getZoom()/15),3).toFixed(3);
            //$(element).css('transform', 'scale('+scale+')');
            ev.zoom = d2d_map.ol_map.getView().getZoom();
            if(iframe[0].contentWindow)
                iframe[0].contentWindow.ZoomChanged(ev);

            // $(element).css('transition', 'transform 100ms');
            // $("#"+$(element).attr('id')+"_img").height(scale);
            // $("#"+$(element).attr('id')+"_img").width(scale);
            //$( element ).trigger("change:zoom", [event]);
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

        $(".overlay").on("change:cur_pos",function ( evt, coor, param2) {

        });

    d2d_map.ol_map.getView().on('change:center', function (event) {
            $( element ).trigger("change:center", [event]);
        });

    d2d_map.ol_map.on('moveend', function (event) {

            $( element ).trigger("map:moveend", [event]);
        });

    d2d_map.ol_map.on('movestart', function (event) {
            $( element ).trigger("map:movestart", [event]);
        });

    ol_map.on('pointerdrag', function (event) {
            $( element ).trigger("map:pointerdrag", [event]);
        });

    };

function DownloadOverlay(url, obj) {

    var id_str = GetObjId(obj.latitude, obj.longitude);
    if ($("[id='" +id_str+'_ovl_container' + "']").length === 0)
    $.ajax({
        url: url+"?v="+Date.now(),
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

            if ($("[id='" +id_str+'_ovl_container' + "']").length === 0) {

                $(document).on("overlay", function (e) {
                    //console.log("InitLayers");
                });

                var div_ovl = $("#ovl_container").clone();
                $(div_ovl).attr('id',id_str+'_ovl_container');
                $(div_ovl).attr('ovl_cat', this.obj.category);
                $(div_ovl).attr('class',  'overlay');
                $(div_ovl).attr('src',data);

                $(newNode).appendTo(div_ovl);
                $(div_ovl).appendTo("#html_container");

                var logo = $(div_ovl).find('.logo');
                if(logo) {
                    var logo_id = localStorage.getItem(obj.logo_id);
                    $(logo).attr('src',logo_id);
                }

                var lon = parseFloat(this.obj.longitude);
                var lat = parseFloat(this.obj.latitude);

                jQuery.fn.InitOverlay =
                    function (){
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
            if($.isFunction('AddOverlayRecurs'))
                eval('AddOverlayRecurs()');
        },
    });
}

function DownloadOverlayIFrame(url, obj) {

        var id_str = GetObjId(obj.latitude, obj.longitude);

        if ($("[id='" + id_str + '_ovl_container' + "']").length === 0) {

            var div_ovl = $("#html_container").clone();
            $(div_ovl).attr('id', id_str + '_ovl_container');
            $(div_ovl).attr('ovl_cat', obj.category);
            $(div_ovl).find('iframe').attr('src', url+"?v="+Date.now());
            $(div_ovl).find('iframe').attr('id',id_str+'_ovlframe');
            $(div_ovl).find('iframe').on('load', OnLoadOvlFrame);
            $(div_ovl).find('iframe').css('opacity', obj.status==='2'?.5:1);
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

function OnLoadOvlFrame(ev){

        var iframe = ev.target;

        db.GetObject(iframe.id.split('_')[0],function (obj) {

            if(typeof $('#'+iframe.id)[0].contentWindow.GetTips === "function") {

                if (obj.category==3 && obj.status!=='1')
                    return;

                function ReplyValidation(res,el){
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


                var tips = $('#'+iframe.id)[0].contentWindow.GetTips(ReplyValidation);
                var clone = $(tips).clone();
                for(var i = 0; i<clone.length;i++) {
                    $(clone[i]).insertAfter(iframe);
                    $(clone[i]).css('display','block');
                    $(clone[i]).on('click',function(){
                        iframe.contentWindow.OnClickTip(this, function (res, el) {
                            // alert("Правильно!");
                            if(res) {
                                var obj_id = iframe.id.split('_')[0];

                                db.SetObjectAttr(obj_id, 'status', '2');

                                User.level++;
                                $('#' + iframe.id)[0].remove();
                                $(clone).remove();

                                db.SetObjectAttr(MD5("uname"), 'level', User.level);

                            }else{
                                if(User.level>0) {
                                    User.level--;
                                    db.SetObjectAttr(MD5("uname"),'level',User.level);
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

function OverlayFrame(url, obj) {

        var id_str = GetObjId(obj.latitude, obj.longitude);

        if ($("[id='" +id_str+'_ovl_container' + "']").length === 0) {
            //$('link[rel=import]:last').attr('href',obj.overlay);

            $(document).on("overlay", function (e) {
                //console.log("InitLayers");
            });

            var ovl_frame = $("#ovl_frame").clone();
            $(ovl_frame).attr('id',id_str+'_ovl_frame');
            $(ovl_frame).attr('ovl_cat', obj.category);
            $(ovl_frame).attr('src', url+"?v="+String(new Date().getTime()));

            $(ovl_frame).appendTo("#html_container");

            var lon = parseFloat(obj.longitude);
            var lat = parseFloat(obj.latitude);

            jQuery.fn.InitOverlay =
            function (){
                setTimeout(function () {
                    var ovl = new Overlay(
                        id_str,
                        $('#'+id_str+'_ovl_frame')[0],
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

function RemoveOverlay(id_str) {

        if($("#" + id_str + '_ovl_container').length>0){
            var ovl= d2d_map.ol_map.getOverlayById(id_str);
            $(ovl.values_.element).removeClass("ovl_scale");
            setTimeout(function () {
                d2d_map.ol_map.removeOverlay(ovl);
                //$("#" + id_str + '_ovl_container').remove();//no need
            }, 800);
        }
    }

function StartNewQuest(lat, lon) {

        var loc;
        if(coords.gps)
            loc = ol.proj.toLonLat(coords.gps);
        else if(Marker.overlay.getPosition()){
            loc = ol.proj.toLonLat(Marker.overlay.getPosition());
        }

        app_mode='quest';

        new Route([[lat,lon],[loc[1],loc[0]]]);
    }
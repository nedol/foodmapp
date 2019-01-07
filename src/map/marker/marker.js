export {Marker};
import proj from 'ol/proj';
import _ol_Overlay_  from "ol/overlay";
import {distanceBetweenPoints} from "../../utils/utils";

class Marker{
    
    constructor(map, element) {
        this.map = map;

        this.overlay = new _ol_Overlay_({
            element: element,
            positioning: [0.0, 0.0],
            offset: 'center-center'
        });

        this.map.ol_map.addOverlay(this.overlay);

        $('#marker').css("visibility", "visible");

        let that = this;

        this.map.ol_map.on('click', function (event) {
            var zoom = this.getView().getZoom();
            var latlon = proj.toLonLat(event.coordinate);
            var center = proj.toLonLat(this.getView().getCenter());

            // var x = distanceBetweenPoints(center, latlon, 'x') * Math.sign(latlon[0] - center[0]);
            // var y = distanceBetweenPoints(center, latlon, 'y') * Math.sign(center[1] - latlon[1]);
            // $('#kolobot').attr('position', x / zoom + ' ' + 0 + ' ' + y / zoom);
        });

        $('#marker').on('touchstart click', function (ev) {
            //$('#browser_container').css('display','inline-block');

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

        $('#marker').on('stop_location', function (e, param1, param2) {
            if(!window.sets.loc_mode)
                $('#marker>img').attr("src", "../src/map/marker/images/kolobot.png");
        });

        $("#marker").on("change:cur_pos",function ( evt, coor, param2) {
            that.overlay.setPosition([param2.coordinate[0], param2.coordinate[1]]);
        });

        this.map.ol_map.getView().on('change:center', function (event) {
            // if($('#marker>img').attr("src")!== "./images/android_1.png")
            //     $('#marker>img').attr("src", "./images/android_1.png");
            // else
            //     $('#marker>img').attr("src", "./images/android_1.png");
            // Map.render();
            // console.log($('#marker>img').attr("src"));
        });

        this.map.ol_map.on('moveend', function (event) {
            if(!window.sets.loc_mode)
                $('#marker>img').attr("src", "../src/map/marker/images/kolobot.png?v=4.71");
            else
                $('#marker>img').attr("src", "../src/map/marker/images/kolobot_walking.gif?v=4.71");
        });

        this.map.ol_map.on('movestart', function (event) {

            $('#marker>img').attr("src", "../src/map/marker/images/kolobot_running.gif?v=4.71");
        });
    }

}
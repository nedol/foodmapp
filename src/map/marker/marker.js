
import  Overlay  from "ol/overlay";
import {distanceBetweenPoints} from "../../utils/utils";

export class Marker{
    
    constructor(map, element) {
        this.map = map;

        this.overlay = new Overlay({
            element: element,
            position: window.sets.coords.gps,//map.ol_map.getView().getCenter(),
            positioning: 'center-center',//'top-left'//'bottom-right',//'center-center',//'bottom-right',//'top-left',//'bottom-left',
            offset: [-parseInt($(element).css('width')),-parseInt($(element).css('height'))],
            //offset: [0,0],
            // anchor: [-150,50],
            autoPan:true
        });

        this.map.ol_map.addOverlay(this.overlay);

        $('#marker').css("visibility", "visible");

        let that = this;


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

        $("#marker").on("change:gps_pos",function ( evt, coor, param2) {
            setTimeout(function () {
                that.overlay.setPosition(window.sets.coords.gps);
            },10);
        });

        this.map.ol_map.getView().on('change:center', function (event) {
            // if($('#marker>img').attr("src")!== "../src/map/marker/images/kolobot.png")
            //     $('#marker>img').attr("src", "../src/map/marker/images/kolobot.png");
            // else
            //     $('#marker>img').attr("src", "../src/map/marker/images/kolobot.png");
            //that.map.ol_map.render();
            // console.log($('#marker>img').attr("src"));
            //that.overlay.setPosition([event.target.values_.center[0], event.target.values_.center[1]]);
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
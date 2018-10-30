export {Events};
import proj from 'ol/proj';
import {ImportData} from "../import/import_data";
import {StopLocation} from "../panel/panel";

class Events {

    constructor(map){
        this.map = map;
    }

    InitEvents() {
        let that = this;
        $(window).on("orientationchange", function (event) {
            this.map.ol_map.updateSize();
            console.log("the orientation of the device is now " + screen.orientation.angle);
        });

        // When the user clicks anywhere outside of the modal, close it
        $(window).on('click', function (event) {
            console.log();
        });

        $('.close').on('click', function () {
            $('#settings_modal').css('display', 'none');
            $('#auth_modal').css('display', 'none');
        });

        $('.close_browser').on('touchstart', function (ev) {
            $(this).parent().css('display', 'none');
            $('#browser')[0].contentWindow.StopPlaying();
        });


        $('.close_browser').on('click', function (ev) {
            $(this).parent().css('display', 'none');
            $('#browser')[0].contentWindow.StopPlaying();
        });

        $(".move_browser").mousedown(function () {
            $(this).data("move", true);
        });

        $(".move_browser").mouseup(function () {
            $(this).data("move", false);
        });
        //TODO: find solution in rtc project
        $(".move_browser").mousemove(function (e) {
            if (!$(this).data("move"))
                return;
            if (e.clientX - $(this).width() / 2 < 0 || e.clientY - 10 < 0) {
                $(this).parent().css("left", 0);
                $(this).parent().css("top", 0);
            } else {
                $(this).parent().css("left", e.clientX - $(this).width() / 2);
                $(this).parent().css("top", e.clientY - 10);
            }

            var leftop = {
                'left': e.clientX - $(this).width() / 2,
                'top': e.clientY - 10
            };
            localStorage.setItem("browser_l_t", JSON.stringify(leftop));

        });

        $(".move_browser").on('touchstart', function (e) {
            $(this).data("move", true);
        });

        $(".move_browser").on('touchend', function (e) {
            $(this).data("move", false);
        });

        $(".move_browser").on('touchmove', function (e) {
            if (!$(this).data("move"))
                return;
            $(this).parent().css("left", e.originalEvent.changedTouches["0"].clientX - $(this).width() / 2);
            $(this).parent().css("top", e.originalEvent.changedTouches["0"].clientY);

            var leftop = {
                'left': e.originalEvent.changedTouches["0"].clientX - $(this).width() / 2,
                'top': e.originalEvent.changedTouches["0"].clientY
            };
            localStorage.setItem("browser_l_t", JSON.stringify(leftop));
            e.preventDefault();
        });

        $(".resize_browser").on('touchstart', function () {
            $(this).data("resize", true);
        });

        $(".resize_browser").on('touchend', function () {
            $(this).data("resize", false);
        });
//TODO: find solution in rtc project
        $(".resize_browser").on('touchmove', function (e) {
            if (!$(this).data("resize"))
                return;

            $(this).parent().css("width", parseInt(e.originalEvent.changedTouches["0"].clientX)
                - parseInt($(this).parent().css("left")) + $(this).width() / 2);

            $(this).parent().css("height", e.originalEvent.changedTouches["0"].clientY + $(this).height() / 2
                - parseInt($(this).parent().css("top")));
            localStorage.setItem("browser_w_h",
                JSON.stringify({
                        width: e.originalEvent.changedTouches["0"].clientX - $(this).width() / 2,
                        height: e.originalEvent.changedTouches["0"].clientY + $(this).height() / 2 - parseInt($(this).parent().css("top"))
                    }
                ));
        });

        $(".resize_browser").mousedown(function () {
            $(this).data("resize", true);
        });

        $(".resize_browser").mouseup(function () {
            $(this).data("resize", false);
        });

        $(".resize_browser").mousemove(function (e) {
            if (!$(this).data("resize"))
                return;
            $(this).parent().css("width", e.clientX - parseInt($(this).parent().css("left")) + $(this).width() / 2);
            $(this).parent().css("height", e.clientY + $(this).height() / 2 - parseInt($(this).parent().css("top")));
            localStorage.setItem("browser_w_h",
                JSON.stringify({
                    width: e.clientX - $(this).width() / 2,
                    height: e.clientY + $(this).height() / 2 - parseInt($(this).parent().css("top"))
                }));
        });

        this.map.ol_map.on('click', function (event) {
            //console.log("map click");
            if (!event.loc_mode)
                StopLocation();

            var degrees = proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');

            if (window.sets.app_mode !== 'quest')
                $("#marker").trigger("change:cur_pos", [event.coordinate, event]);

            var latlon = proj.toLonLat(event.coordinate);
            $('#locText').text(latlon[1].toFixed(6) + " " + latlon[0].toFixed(6));
            // and add it to the Map

            window.sets.coords.cur = event.coordinate;
            var time = new Date().getTime();
            localStorage.setItem("cur_loc", "{\"lon\":" + window.sets.coords.cur[0] + "," +
                "\"lat\":" + window.sets.coords.cur[1] + ", \"time\":" + time + "}");

            if (!event.loc_mode && $('#categories').is(':visible'))
                $('#categories').slideToggle('slow', function () {

                });

            if (!event.loc_mode && $('#menu_items').is(':visible'))
                $('#menu_items').slideToggle('slow', function () {
                });

        });

        that.map.ol_map.on('movestart', function (event) {

            //Map.getLayers().item(0).setProperties({opacity: 1.0, contrast:1.0});//setBrightness(1);

            //var extent = Map.getView().calculateExtent(Map.getSize());

            if (!event.loc_mode && $('#categories').is(':visible'))
                $('#categories').slideToggle('slow', function () {

                });

            if (!event.loc_mode && $('#menu_items').is(':visible'))
                $('#menu_items').slideToggle('slow', function () {
                });

        });

        that.map.ol_map.on('pointerdrag', function (event) {
            $("#marker").trigger("change:cur_pos", ["Custom", event]);
            try {
                coord.cur = event.target.T;
            } catch (ex) {

            }
        });

        that.map.ol_map.on('moveend', function (event) {

            if (event)
                that.map.import_data.ImportData(event);

        });

        this.map.ol_map.getView().on('change:resolution', function (event) {

            var zoom = parseInt(that.map.ol_map.getView().getZoom()).toString();

            $("#zoom_but").text(zoom);
            if (zoom >= 14)
                $("#zoom_but").css('color', 'blue');
            else
                $("#zoom_but").css('color', 'black');

            var bounce = that.map.ol_map.getView().calculateExtent(that.map.ol_map.getSize());
        });

        function OnPropertyChange(event) {
            that.map.ol_map.dispatchEvent('movestart');
            that.map.ol_map.getView().un('propertychange', OnPropertyChange);
            that.map.ol_map.on('moveend', function () {
                that.map.ol_map.on('propertychange', OnPropertyChange);
            });

        };
        that.map.ol_map.getView().on('propertychange',  OnPropertyChange);


        // Map.getView().on('change:center', function (event) {
        //
        // });
    };
}
export {MapEvents}

import proj from 'ol/proj';

class MapEvents{

    constructor(map){

        this.map = map

        let that = this;

        this.map.ol_map.on('click', function (event) {
            if (!event.loc_mode) {
                that.map.panel.StopLocation();
            }

            var degrees = proj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');

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

        this.map.ol_map.on('movestart', function (event) {

            //Map.getLayers().item(0).setProperties({opacity: 1.0, contrast:1.0});//setBrightness(1);

            //var extent = Map.getView().calculateExtent(Map.getSize());

            if (!event.loc_mode && $('#categories').is(':visible'))
                $('#categories').slideToggle('slow', function () {

                });

            if (!event.loc_mode && $('#menu_items').is(':visible'))
                $('#menu_items').slideToggle('slow', function () {
                });

        });

        this.map.ol_map.on('pointerdrag', function (event) {
            $("#marker").trigger("change:cur_pos", ["Custom", event]);
            try {
                that.coord.cur = event.target.focus_;
            } catch (ex) {

            }
        });

        this.map.ol_map.on('moveend', function (event) {

            if (event)
                that.map.import.ImportData(event);

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

        this.map.ol_map.getView().on('propertychange',  OnPropertyChange);


        // Map.getView().on('change:center', function (event) {
        //
        // });
    }
}
export {MapEvents}

import proj from 'ol/proj';
import Extent from 'ol/extent';

class MapEvents{

    constructor(map){

        this.map = map;

        let that = this;

        $(window).on("orientationchange", function (event) {
            if( that.map.ol_map)
                that.map.ol_map.updateSize();
            console.log("the orientation of the device is now " + screen.orientation.angle);
        });

        // When the user clicks anywhere outside of the modal, close it
        $(window).on('click', function (event) {
            console.log();
        });

        this.map.ol_map.on('click', function (event) {
            if (!event.loc_mode) {
                that.map.geo.StopLocation();
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

            that.map.ol_map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
                let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');
                let period = $('.sel_time').text().split(' - ');
                if(feature.values_.features.length===1) {
                    window.db.getFile(date, period[0],period[1],feature.values_.features[0].values_.object.email, function (obj) {
                        if(obj!==-1)
                        if (!window.admin.viewer.offer) {
                            let offer = JSON.parse(obj.offer);
                            window.admin.viewer.OpenOffer(obj.email, obj.period, offer, JSON.parse(obj.dict),[obj.latitude, obj.longitude]);
                        }
                    });
                }else{//cluster
                    var coordinates = [];
                    $.each(feature.values_.features, function (key, feature) {
                        coordinates.push(feature.getGeometry().flatCoordinates);
                    });

                    var extent = Extent.boundingExtent(coordinates);
                    var buf_extent = Extent.buffer(extent, 5);
                    //ol.extent.applyTransform(extent, transformFn, opt_extent)
                    that.map.ol_map.getView().fit(buf_extent, {duration: window.sets.animate_duration});

                    that.map.ol_map.getView().animate({
                        center: feature.getGeometry().flatCoordinates, duration: window.sets.animate_duration
                        },
                        function () {

                        });
                }
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
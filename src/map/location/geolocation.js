export {Geo};
import Geolocation from 'ol/geolocation';
import proj from 'ol/proj';


import {Feature} from "../events/feature.events";


class Geo {

    constructor(map) {
        this.map = map;
        this.init();
    }

    init() {

        let that = this;

        var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };
// //standart geolocation
        if ("geolocation" in navigator) {
            /* geolocation is available */
            navigator.geolocation.getCurrentPosition(function (position) {
                //console.log("position:"+JSON.stringify(position));
                var time = new Date().getTime();
                var coordinates = proj.fromLonLat([position.coords.longitude, position.coords.latitude]);
                //coords.gps_coord = coordinates;
                //SetCurPosition(coordinates);
                // localStorage.setItem("cur_loc","{\"lon\":"+coordinates[0]+","+
                //     "\"lat\":"+coordinates[1]+", \"time\":"+time+"}");
                if (coordinates)
                    window.postMessage(coordinates, '*');//http://nedol.ru');

            }, function (positionError) {
                console.log("Error: " + positionError);
            });
        } else {
            /* geolocation IS NOT available */
            console.log(positionError);
        }

        function geo_success(position) {
            var time = new Date().getTime();
            //do_something(position.coords.latitude, position.coords.longitude);
            var coordinates = proj.fromLonLat([position.coords.longitude, position.coords.latitude]);
            //coords.gps_coord = coordinates;
            // localStorage.setItem("cur_loc","{\"lon\":"+coordinates[0]+","+
            //     "\"lat\":"+coordinates[1]+", \"time\":"+time+"}");
            if (coordinates)
                window.postMessage(coordinates, '*');//http://nedol.ru');
        }

        function geo_error() {
            console.log("Sorry, no position available.");
        }

        //var watchID = navigator.geolocation.watchPosition(geo_success, geo_error, options);

        let geolocation = new Geolocation({
            projection: 'EPSG:3857',//'EPSG:4326',//3857
            tracking: true,
            trackingOptions: options
        });

        var request = function () {
            /*
             if(period===1000){
             clearInterval(loc_interval);
             period=5000;
             loc_interval = setInterval(request, period);
             }
             */

            geolocation.on('error', function (error) {
                console.log(error.toString());
                //            var info = document.getElementById('info');
                //            info.innerHTML = error.message;
                //            info.style.display = '';
            });

            var accuracyFeature = new Feature(this.map);
            geolocation.on('change:accuracyGeometry', function (ev) {
                //TODO: accuracyFeature.feature.setGeometry(geolocation.getAccuracyGeometry());
            });


            // geolocation.on('change:position', function() {
            //     var coords = geolocation.getPosition();
            //
            //     var time = new Date().getTime();
            //     localStorage.setItem("cur_loc","{\"lon\":"+coords[0]+","+
            //         "\"lat\":"+coords[1]+", \"time\":"+time+"}");
            //     if(coords) {
            //         window.postMessage(coords, '*');//http://nedol.ru');
            //     }
            //
            //     return;
            // });

            geolocation.on('change:speed', function () {
                var speed = geolocation.getSpeed();

            });

            var coords = geolocation.getPosition();
            var time = new Date().getTime();

            if (coords) {
                that.ChangeGPSPosition(that,coords);

            }
        }

        var loc_interval = setInterval(request, 1000);

    }

    ChangeGPSPosition(that,coor) {

        $("#location_img").css("visibility", 'visible');
        var time = new Date().getTime();
        window.sets.coords.gps = coor;

        var latlon = proj.toLonLat(window.sets.coords.gps);

        // ReverseGeocoding(latlon, 15, function (res) {
        //     var adr = res;
        // });

        if (window.sets.loc_mode) {
            this.SetCurPosition(that,window.sets.coords.gps);
            localStorage.setItem("cur_loc", "{\"lon\":" + window.sets.coords.cur[0] + "," +
                "\"lat\":" + window.sets.coords.cur[1] + ", \"time\":" + time + "}");
        }
    }
    SetCurPosition(that,coordinate) {

        try {
            var size = that.map.ol_map.getSize();// @type {ol.Size}
            //alert(loc.toString());

            if(that.map.ol_map.getView().getCenter()[0]!==coordinate[0] ||
                that.map.ol_map.getView().getCenter()[1]!==coordinate[1])
                that.map.MoveToLocation(coordinate);

            var latlon = proj.toLonLat(coordinate);
            window.sets.coords.gps = coordinate;

            that.map.ol_map.dispatchEvent({'type': 'click', 'coordinate': coordinate, 'loc_mode': true});

            var pixel = that.map.ol_map.getPixelFromCoordinate(coordinate);

            var feature = that.map.ol_map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                return feature;
            });
            if (feature)
                feature.OnClickFeature(feature);

        } catch (ex) {
            console.log(ex);
        }

        $('#locText').text(latlon[1].toFixed(6) + " " + latlon[0].toFixed(6));

    }
}




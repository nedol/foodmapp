export {Geo};
import Geolocation from 'ol/geolocation';
import proj from 'ol/proj';
import {Utils} from "../../utils/utils";


class Geo {

    constructor(map) {
        this.map = map;
        this.period;
        this.init();
        this.isMoved = true;
        this.isTileLoaded = '';
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

             if(that.period===1000){
                clearInterval(loc_interval);
                that.period=5000;
                loc_interval = setInterval(request, that.period);
             }


            geolocation.on('error', function (error) {
                console.log(error.toString());
            });

            geolocation.on('change:accuracyGeometry', function (ev) {
                //TODO: accuracyFeature.feature.setGeometry(geolocation.getAccuracyGeometry());
            });


            geolocation.on('change:position', function() {

            });

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


        // for(let l in that.map.ol_map.getLayers().array_) {
        //     if (that.map.ol_map.getLayers().array_[l].type === 'TILE') {
        //         that.map.ol_map.getLayers().array_[l].getSource().on('tileloadend', function () {
        //             that.isTileLoaded = true;
        //             that.map.ol_map.getLayers().array_[l].getSource().un('tileloadend');
        //         });
        //     }
        // }

    }

    ChangeGPSPosition(that,coor) {

        $("#location_img").css("visibility", 'visible');

        if(window.sets.coords.cur===coor)
            return;
        window.sets.coords.gps = coor;
        //TODO: поиск текущего места
        // let cur_loc = JSON.parse(localStorage.getItem("cur_loc"));
        // if(!cur_loc.address) {
        //     latlon = [latlon[1], latlon[0]];
        //     this.SearchPlace(latlon, 16, function (res) {
        //
        //         cur_loc.address = res;
        //         localStorage.setItem("cur_loc", JSON.stringify(cur_loc));
        //     });
        // }
        this.SetCurPosition(that,coor);

        if(window.user.SendLocation)
            window.user.SendLocation(coor);

    }

    SetCurPosition(that,coor) {

        try {
            var time = new Date().getTime();
            let lonlat = proj.toLonLat(coor);

            localStorage.setItem("gps_loc", "{\"lon\":" + lonlat[0] + "," +
                "\"lat\":" + lonlat[1] + ", \"time\":" + time + "}");

            var size = that.map.ol_map.getSize();// @type {ol.Size}
            //alert(loc.toString());
            
            if(window.sets.loc_mode && (that.map.ol_map.getView().getCenter()[0]!==coor[0] ||
                that.map.ol_map.getView().getCenter()[1]!==coor[1])) {

                if(!that.isTileLoaded) {
                    that.isTileLoaded = true;
                    that.map.MoveToLocation(coor, "SetCurPosition", function () {
                        for(let l in that.map.ol_map.getLayers().array_) {
                            if (that.map.ol_map.getLayers().array_[l].type === 'TILE') {
                                that.map.ol_map.getLayers().array_[l].getSource().on('tileloadend', function () {

                                    that.isTileLoaded = '';
                                    this.un('tileloadend');
                                });
                            }
                            let time = new Date().getTime();
                            localStorage.setItem("cur_loc", "{\"lon\":" + lonlat[0] + "," +
                                "\"lat\":" + lonlat[1] + ", \"time\":" + time + ",\"zoom\":" + that.map.ol_map.getView().getZoom() + "}");
                            break;
                        }
                     });

                }

            }

            // var pixel = that.map.ol_map.getPixelFromCoordinate(coordinate);
            //
            // var feature = that.map.ol_map.forEachFeatureAtPixel(pixel, function (feature, layer) {
            //     return feature;
            // });
            // if (feature)
            //     feature.OnClickFeature(feature);

        } catch (ex) {
            console.log(ex);
        }

    }

    StartLocation() {

        if ($("#loc_ctrl").attr('drag') === 'true') {
            $("#loc_ctrl").attr('drag', false);
            return;
        }
        try {
            window.sets.loc_mode = !window.sets.loc_mode;
            if (window.sets.loc_mode) {
                if (window.sets.coords.gps[0] !== 0 && window.sets.coords.gps[1] !== 0) {

                    $('#pin').css('display', 'block');

                    //$('#marker>img').attr("src", "./marker/images/kolobot_walking.gif");
                }
            } else {
                this.StopLocation();
            }

        } catch (ex) {
            alert(ex);
        }
    }

    StopLocation() {

        window.sets.loc_mode = false;

        $('#marker').trigger('stop_location');
        $('#pin').css('display', 'none');
        //$('#loc_img').removeAttr( "style" );
    }

    SearchLocation(place, cb) {
        var urlencode = require('urlencode');
        let that = this;

        let fadr = urlencode.encode(place);
        //
        // let here =
        //     {
        //         url: 'https://geocoder.ls.hereapi.com/6.2/geocode.json',
        //         type: 'GET',
        //         dataType: 'jsonp',
        //         jsonp: 'jsoncallback',
        //         data: {
        //             searchtext: place,
        //             //mapview: '42.3902,-71.1293;42.3312,-71.0228',
        //             gen: '9',
        //             apiKey: 'qJ0yfS-igVDE9eFQW9wHbSD6TLcThiTcz3jF_gLmDjU'
        //         },
        //         error: function (data) {
        //             console.log(data);
        //         },
        //         success:function(data, res) {
        //
        //             if (!data || res!=='success' ) {
        //                 cb(null);
        //                 return;
        //             }
        //             let lat = data.Response.View[0].Result[0].Location.DisplayPosition.Latitude;
        //             let lon = data.Response.View[0].Result[0].Location.DisplayPosition.Longitude;
        //             let location = proj.fromLonLat([parseFloat(lon), parseFloat(lat)]);
        //             cb(location);
        //         }
        //     };

        let nominatim =
            {
                url: "https://nominatim.openstreetmap.org/search", //
                //url:locationiq,//nominatim, //
                data: {
                    polygon: 1,
                    addressdetails: 1,
                    format: "json",
                    q: place,
                    "accept-language": window.sets.lang
                },
                method: "GET",
                dataType: "json",
                success: function (data){

                        if (!data[0] || !data[0].boundingbox) {
                            cb(null);
                            return;
                        }
                        let bound = data[0].boundingbox;
                        let lat = data[0].lat;
                        let lon = data[0].lon;
                        let location = proj.fromLonLat([parseFloat(lon), parseFloat(lat)]);
                        window.sets.country_code = data[0].address.country_code;
                        window.sets.currency = {gb: '£',us:'$',eu:'€'}[window.sets.country_code];
                        cb(location);
                    }
                };

        let query =
            "https://nominatim.openstreetmap.org/reverse?format=geojson&lat=52.5487429714954&lon=-1.81602098644987&zoom=18&addressdetails=1";
        let mapques =
            "https://open.mapquestapi.com/geocoding/v1/reverse?key=KEY&location=30.333472,-81.470448&includeRoadMetadata=true&includeNearestIntersection=true";
        let locationiq =
            "https://locationiq.org/v1/search.php";

        let photon =
            "https://photon.komoot.de/api/?q=berlin&lat=52.3879&lon=13.0582";

        $.ajax(nominatim);
    }

    SearchPlace(latlon, zoom, cb) {

        let here =
            {
            url: 'https://reverse.geocoder.ls.hereapi.com/6.2/reversegeocode.json',
            type: 'GET',
            dataType: 'jsonp',
            jsonp: 'jsoncallback',
            data: {
                prox: latlon,
                mode: 'retrieveAddresses',
                maxresults: '1',
                gen: '9',
                apiKey: 'qJ0yfS-igVDE9eFQW9wHbSD6TLcThiTcz3jF_gLmDjU'
            }
        };

        let reverse =
            "https://nominatim.openstreetmap.org/reverse?format=json&lat="+latlon[0]+"&lon="+latlon[1]+"&zoom="+zoom+"&addressdetails=2&accept-language="+window.sets.lang;
        let mapques =
            "https://open.mapquestapi.com/geocoding/v1/reverse?key=KEY&location=30.333472,-81.470448&includeRoadMetadata=true&includeNearestIntersection=true";
        let locationiq =
            "https://locationiq.org/v1/search.php";
        //let here = "https://geocoder.cit.api.here.com/6.2/geocode.json?searchtext=200%20S%20Mathilda%20Sunnyvale%20CA&app_ id=DemoAppId01082013GAL&app_code=AJKnXv84fjrb0KIHawS0Tg&gen=8";


        $.ajax({
            url: reverse,
            method: "GET",
            dataType: "json",
            success: function (data) {
                let resp = JSON.stringify(data, null, 4);
                let obj = {city:data.address.state,street: data.address.road,house:data.address.house_number?data.address.house_number:''};
                cb(obj);
            },
            error: function (data) {
                console.log(data);
                cb();
            }
        });
    }



    GetDistanceToPlace(loc, place, cb){
        let lonlat = proj.toLonLat(loc);
        this.SearchLocation(place, function (bound, lat, lon) {
            if(!bound)
                cb('undefined');
            else
                cb(new Utils().LatLonToMeters(lonlat[1], lonlat[0], lat, lon));
        });
    }
}




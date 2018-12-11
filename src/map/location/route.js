export {Route};


class Route {
    constructor(map, arCoor) {
        this.query = 0;
        this.arPoints;
        this.offset = 0;
        this.arLoc = [];
        if (arCoor)
            DataRequest(arCoor, 0);

        function DataRequest(arCoor, index) {

            var url = 'http://dev.virtualearth.net/REST/V1/Routes/Walking?';
            var key = '&key=' + bing_key;
            var opt = 'optmz=distance';
            //'&optmz=distance&rpo=Points&tl=0.00000344978,0.0000218840,0.000220577,0.00188803,0.0169860,0.0950130,0.846703';
            var wp = '';
            for (var i = 0; i < arCoor.length; i++) {
                wp += 'wp.' + i + '=' + arCoor[i][0] + ',' + arCoor[i][1] + '&';
            }
            var req = url + wp + opt + key;// +'&'+ opt;
            //TODO: viaWaypoint vwp
            query++;
            $.ajax({
                url: req,
                method: "GET",
                dataType: "jsonp",
                jsonp: "jsonp",
                index: index,
                error: function (e) {
                    alert(e.statusText);
                }
            })
                .done(function (data, res, par) {
                    processResult(data, res, par, this.index);
                }).fail(function (error) {
                console.log(error);
            }).always(function () {
                //console.log("");
            });
        }

        function processResult(data, res, par, index) {
            query--;
            if (data.statusCode !== 200) {
                return;
            }
            arPoints = data.resourceSets["0"].resources["0"].routeLegs["0"].itineraryItems;

            for (var i = 0; i < arPoints.length; i++) {
                var latlon_0 = arPoints[i].maneuverPoint.coordinates;
                var point = ol.proj.transform([latlon_0[1], latlon_0[0]], 'EPSG:4326', 'EPSG:3857');
                var res = jQuery.grep(arLoc, function (item) {
                    return item[0] === point[0] && item[1] === point[1];
                });
                if (res.length === 0)
                    arLoc.splice(i + index + offset, 0, point);
                if (i < arPoints.length - 1) {
                    var latlon_1 = arPoints[i + 1].maneuverPoint.coordinates;
                    var dist = getDistanceFromLatLonInKm(
                        latlon_0[1], latlon_0[0], latlon_1[1], latlon_1[0]
                    );

                    if (dist > 3 && arPoints.length > 2) {
                        DataRequest([latlon_0, latlon_1], i + index);
                    }
                }

            }

            if (index !== 0)
                offset += arPoints.length - 2;

            if (query === 0) {

                Route.prototype.DrawRoute(arLoc);
                window.db.SetObject({id: 'mega_route', data: arLoc});
                flyTo(arLoc[arLoc.length - 1], function () {
                });
                return;
            }
        }


        Route.prototype.DrawRoute = function (arLoc) {

            var geom = new ol.geom.LineString(arLoc);

            var routeFeature = new ol.Feature({
                type: 'route',
                geometry: geom
            });

            var vectorLine = new ol.source.Vector({});
            vectorLine.addFeature(routeFeature);

            var vectorLineLayer = new ol.layer.Vector({
                source: vectorLine,
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: '#00FF00',
                        weight: 4
                    }),
                    stroke: new ol.style.Stroke({
                        lineDash: [2, 3],
                        lineDashOffset: 5,
                        color: "grey",
                        width: 2
                    })
                })
            });

            d2d_map.ol_map.getLayers().push(vectorLineLayer);
            d2d_map.ol_map.getLayers().set('route', vectorLineLayer, true);
            vectorLineLayer.setProperties({opacity: 1.0, contrast: 1.0});
            vectorLineLayer.setVisible(true);

        }
    }
}
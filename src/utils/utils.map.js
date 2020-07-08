export {UtilsMap}
import proj from 'ol/proj';
// import Sphere from 'ol/sphere';
class UtilsMap{

    GetCoordsDistance(map,firstPoint, secondPoint, projection) {
        projection = projection || 'EPSG:4326';

        length = 0;
        var sourceProj = map.getView().getProjection();
        var c1 = proj.transform(firstPoint, sourceProj, projection);
        var c2 = proj.transform(secondPoint, sourceProj, projection);

        var wgs84Sphere = new Sphere(6378137);
        length += wgs84Sphere.haversineDistance(c1, c2);

        return length;
    }
    getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2){

        function deg2rad(deg) {
            return deg * (Math.PI/180)
        }

        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1);
        var a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c; // Distance in km
        return d;
    }

    IsInsideRadius(map, feature) {

        let radius = feature.values_.geometry.getRadius();
        let center = feature.values_.geometry.getCenter();
        let map_center = map.ol_map.getView().getCenter();
        let dist = //utils.getCoordsDistance( that.map.ol_map,center,event.coordinate);
            this.getDistanceFromLatLonInKm(proj.toLonLat(center)[1], proj.toLonLat(center)[0], proj.toLonLat(map_center)[1], proj.toLonLat(map_center)[0]);
        if (feature.values_.obj && feature.values_.obj.uid)
            if (dist * 1400 <= radius) {
                return true;
            }

        return false;
    }

    IsInsideRadiusCoor(map, center, radius) {

        let map_center = map.ol_map.getView().getCenter();
        let dist = //utils.getCoordsDistance( that.map.ol_map,center,event.coordinate);
            this.getDistanceFromLatLonInKm(center[0], center[1], proj.toLonLat(map_center)[1], proj.toLonLat(map_center)[0]);
            if (dist* 1400 <= radius) {
                return true;
            }

        return false;
    }
    //
    // mapFormatLength(projection, line) {
    //     var length;
    //     var coordinates = line.getCoordinates();
    //     length = 0;
    //     for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    //         var c1 = ol.proj.transform(coordinates[i], projection, 'EPSG:4326');
    //         var c2 = ol.proj.transform(coordinates[i + 1], projection, 'EPSG:4326');
    //         length += mapConst.wgs84Sphere.haversineDistance(c1, c2);
    //     }
    //     var output;
    //     if (length > 1000) {
    //         output = (Math.round(length / 1000 * 100) / 100) +
    //             ' ' + 'km';
    //     } else {
    //         output = (Math.round(length * 100) / 100) +
    //             ' ' + 'm';
    //     }
    //     return output;
    // }
}
export {ImportData};

import proj from 'ol/proj';
import {User} from "../menu/user";

class ImportData {

    constructor(map){
        this.map = map;
        this.areasAr = jQuery.makeArray();
    }

    GetDataSrc() {

        var ds = JSON.parse(localStorage.getItem("data_src"));
        var ar = [];
        for (var i in ds) {
            ar[ds[i]] = true;
        }
        if ($("[cat=wiki]").attr('state') === '1')
            ar['wiki'] = true;

        return ar;
    };

    ImportData(event) {
        let that = this;
        if (!window.sets.coords.cur)
            return;
        var LotLat = proj.toLonLat(window.sets.coords.cur);

        if (this.map.ol_map.getView().getZoom() >= 14) {
            try {
                $(".category[state='1']").each(function (i, item) {

                    var area = [
                        (parseFloat(LotLat[1].toFixed(1)) - 0.05).toFixed(2),
                        (parseFloat(LotLat[1].toFixed(1)) + 0.05).toFixed(2),
                        (parseFloat(LotLat[0].toFixed(1)) - 0.05).toFixed(2),
                        (parseFloat(LotLat[0].toFixed(1)) + 0.05).toFixed(2)
                    ];
                    window.area = area;
                    var str = "osm_" + $(item).attr('id') + "_" + area;

                    if (that.GetDataSrc()['osm']) {
                        //console.log("GetDataSrc()['osm']:"+GetDataSrc()['osm']);
                        if (!IsDownloadedArea(str)) {

                        }
                    }

                    var str = "gp_" + $(item).attr('id') + "_" + area;
                    if (that.GetDataSrc()['google'])
                        if (!IsDownloadedArea(str)) {
                            //GetGoogleData(queryAr.attr('id'), area);
                            that.areasAr.push(str);
                        }

                    str = "id_" + $(item).attr('id') + "_" + User.level + "_" + area;

                    if (!IsDownloadedArea(str)) {
                        // that.GetIDData($(item).attr('id'), str, LotLat, Order.level, function (res) {
                        //     if (res)
                        //         that.areasAr.push(str);
                        // });

                    }

                    if (window.db)
                        that.map.GetObjects($(item).attr('id'));

                });
            } catch (ex) {
                console.log(ex);
            }
        }

        function IsDownloadedArea(area) {
            var res = $.grep(that.areasAr, function (el, index) {
                return el === area;
            });

            return res.length > 0 ? true : false;
        }
    }
}
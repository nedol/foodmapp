export {Import};

import proj from 'ol/proj';
var md5 = require('md5');
var urlencode = require('urlencode');

class Import {

    constructor(map){
        this.map = map;
        this.areasAr = [];
    }

    ImportData(event) {
        let that = this;
        if (!window.sets.coords.cur)
            return;
        var LotLat = proj.toLonLat(this.map.ol_map.getView().getCenter());//(window.sets.coords.cur);

        if (this.map.ol_map.getView().getZoom() >= 9) {
            try {

                let cats= [];
                $(".category[state='1']").each(function (i, cat) {
                    cats.push(parseInt(cat.id));
                });

                let area = [
                    (parseFloat(LotLat[1].toFixed(1)) - 0.05).toFixed(2),
                    (parseFloat(LotLat[1].toFixed(1)) + 0.05).toFixed(2),
                    (parseFloat(LotLat[0].toFixed(1)) - 0.05).toFixed(2),
                    (parseFloat(LotLat[0].toFixed(1)) + 0.05).toFixed(2)
                ];

                let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

                if (!IsDownloadedArea(date+"_"+cats + "_" + area)) {
                    let uid = that.map.supplier.uid;
                    that.LoadSupplierData(uid, cats, area, function (res) {
                        that.areasAr.push(date+"_"+cats +  "_" +  area);
                    });
                }

                if (window.db)
                    that.map.GetObjectsFromStorage(cats, area);

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

    LoadSupplierData(uid, cats, area, cb ) {
        let that =  this;
        try{
            let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

            let data_obj = {
                "proj": "d2d",
                "func": "get_suppliers",
                "uid": uid,
                "categories": cats,
                "date": date,
                "period":"17:00-19:00",
                "areas": area
            };

            that.map.supplier.network.postRequest(data_obj, function (data) {
                if(data) {
                    processResult(data);
                }
            });

        }catch (ex) {
            console.log();
        }

        function processResult(res) {
            try {
                res = JSON.parse(urlencode.decode(res));
                if (res) {
                    cb(true);
                    for (let i in res) {
                        let obj = res[i];
                        if(!obj)
                            continue;
                        obj = formatObject(obj);
                        window.db.setFile(obj, function (bool) {

                        });
                    }

                }else{
                    cb(false);
                }
            }catch(ex){
                console.log();
            }
        }

        function formatObject(obj) {
            let hash = md5(JSON.stringify({offer: obj.data,dict: obj.dict}));
            return {
                email: obj.email,
                date: obj.date,
                period: obj.period,
                categories: obj.cats,
                longitude: obj.lon,
                latitude: obj.lat,
                logo: "../dist/images/truck.png",
                offer: obj.data,
                dict: obj.dict,
                hash: hash
            };
        }
    }


}
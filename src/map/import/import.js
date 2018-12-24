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
                    let uid = window.user.uid;
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
                "func": "getsuppliers",
                "uid": uid,
                "categories": cats,
                "date": date,
                "period":$('.sel_time').text(),
                "areas": area,
                "user":window.user.constructor.name
            };

            window.user.network.postRequest(data_obj, function (data) {
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
                        if(obj.email===window.user.email && obj.date===window.user.date){

                            if(!Object.keys(window.user.offer.data)[0] && obj) {
                                window.db.SetObject('dictStore',obj.dict, function (res) {

                                });
                                window.user.offer  = obj;
                                window.user.offer.location = proj.fromLonLat([obj.longitude,obj.latitude]);
                                obj.location = window.user.offer.location;
                                window.db.SetObject('offerStore', obj, function (res) {
                                    $('#datetimepicker').trigger("dp.change");
                                });
                            }

                            continue;
                        }
                        window.db.SetObject('supplierStore',obj, function (success) {

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
                data: JSON.parse(obj.data),
                dict: JSON.parse(obj.dict),
                hash: hash
            };
        }
    }


    DownloadOrders(cb) {
        try {
            let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

            let data_obj = {
                "proj": "d2d",
                "func": "getorders",
                "uid": window.user.uid,
                "date": date
            };

            window.user.network.postRequest(data_obj, function (data) {
                if(data) {
                    processResult(data);
                }

                cb();
            });

            function processResult(res) {
                try {
                    if (res) {
                        for (let i in res) {
                            let obj = res[i];
                            if(!obj)
                                continue;
                            obj.logo =  "../dist/images/user.png";
                            obj.data = JSON.parse(obj.data);
                            obj.status = JSON.parse(obj.status);
                            window.db.SetObject('orderStore', obj, function (success) {

                            });
                        }

                    }
                }catch(ex){
                    console.log();
                }
            }
        }catch(ex){
            
        }
    }
}
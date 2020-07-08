export {Import};

import proj from 'ol/proj';
var md5 = require('md5');
var urlencode = require('urlencode');

class Import {

    constructor(map){
        this.map = map;
        this.areasAr = [];
        $('#datetimepicker').on("dp.change",this, (ev)=> {
            this.areasAr = [];

        });
    }

    ImportDataByLocation(event) {
        let that = this;
        if (!window.sets.coords.cur)
            return;

        var LotLat = proj.toLonLat(this.map.ol_map.getView().getCenter());//(window.sets.coords.cur);

        if (this.map.ol_map.getView().getZoom() >= 9) {
            try {

                let cats= [];
                if($(".category[state='1']").length===0)//первый запуск
                    $(".category").each(function (i, cat) {
                        //cats.push(parseInt(cat.id));
                    });
                else
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
                    //for(let c in cats) {
                        that.LoadSupplierData(uid, cats, area, function (res) {
                            that.areasAr.push(date + "_" + cats + "_" + area);

                            // let extent = that.map.ol_map.getView().calculateExtent();
                            // let tr_ext = proj.transformExtent(extent,'EPSG:3857','EPSG:4326');
                            // that.map.GetObjectsFromStorage([tr_ext[1],tr_ext[3],tr_ext[0],tr_ext[2]]);

                        });
                        that.LoadDeliverData(uid, cats, area, function (res) {
                            that.areasAr.push(date + "_" + cats + "_" + area);

                            // let extent = that.map.ol_map.getView().calculateExtent();
                            // let tr_ext = proj.transformExtent(extent,'EPSG:3857','EPSG:4326');
                            // that.map.GetObjectsFromStorage([tr_ext[1],tr_ext[3],tr_ext[0],tr_ext[2]]);

                        });
                    //}
                }
                setTimeout(function () {
                    let extent = that.map.ol_map.getView().calculateExtent();
                    let tr_ext = proj.transformExtent(extent,'EPSG:3857','EPSG:4326');
                    //that.map.GetObjectsFromStorage([tr_ext[1],tr_ext[3],tr_ext[0],tr_ext[2]]);
                }, 1000)


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

    LoadDataByKey(uid, key, cb ) {
        let that =  this;
        try{
            let date = new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));

            let data_obj = {
                proj: "d2d",
                user: window.user.constructor.name.toLowerCase(),
                func: "getbykey",
                uid: uid,
                date: date,
                key: key
            };

            window.network.postRequest(data_obj, function (data) {
                if(data) {
                    that.processResult(data, cb);
                    //that.map.GetObjectsFromStorage(area);
                }

            });

        }catch (ex) {
            console.log();
        }
    }

    LoadSupplierData(uid, cats, area, cb ) {
        let that =  this;
        try{
            let date = new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));

            let data_obj = {
                proj: "d2d",
                user: window.user.constructor.name.toLowerCase(),
                func: "getsuppliers",
                uid: uid,
                lang: window.sets.lang,
                categories: cats,
                date: date,
                areas: area
            };

            window.network.postRequest(data_obj, function (data) {
                if(data) {
                    that.processResult(data, cb);
                    //that.map.GetObjectsFromStorage(area);
                }

            });

        }catch (ex) {
                                                                                                                                                                                                                                                                                                                                                                                                console.log();
        }

    }

    LoadDeliverData(uid, cats, area, cb ) {
        let that =  this;
        try{
            let date = new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));

            let data_obj = {
                proj: "d2d",
                user: window.user.constructor.name.toLowerCase(),
                func: "getdelivers",
                uid: uid,
                lang: window.sets.lang,
                categories: cats,
                date: date,
                areas: area
            };

            window.network.postRequest(data_obj, function (data) {
                if(data) {
                    that.processResult(data, cb);
                    //that.map.GetObjectsFromStorage(area);
                }

            });

        }catch (ex) {
            console.log();
        }

    }

    processResult(res, cb) {
        let that = this;
        try {
            res = JSON.parse(urlencode.decode(res));

            if (res) {
                cb(true);
                for (let i in res) {
                    let obj = res[i];
                    if(!obj || !obj.profile)
                        continue;
                    obj = that.formatObject(obj);

                    let moment = require('moment');

                    if(obj.uid ===window.user.uid && moment(obj.date).isSame(window.user.date)){

                        if((!window.user.offer.stobj ||!Object.keys(window.user.offer.stobj.data)[0]) && obj) {

                        //     window.db.SetObject('dictStore',obj.dict, function (res) {
                        //
                        //     });
                        //     window.user.offer  = obj;
                        //     window.user.offer.location = proj.fromLonLat([obj.longitude,obj.latitude]);
                        //     obj.location = window.user.offer.location;
                        //     window.db.SetObject('offerStore', obj, function (res) {
                        //         $('#datetimepicker').trigger("dp.change");
                        //     });
                        }

                        continue;
                    }

                    window.db.SetObject('supplierStore',obj, function (success) {
                        that.map.SetFeatures([obj]);
                    });
                }

            }else{
                cb(false);
            }
        }catch(ex){
            console.log();
        }
    }

    formatObject(obj) {

        return {
            uid: obj.uid,
            date: new Date(obj.date),
            period: obj.period,
            categories: obj.cats,
            longitude: obj.lon,
            latitude: obj.lat,
            radius:obj.radius,
            logo: "../dist/images/truck.png",
            data: JSON.parse(obj.data),
            dict: obj.dict?JSON.parse(obj.dict):{},
            rating: obj.rating?JSON.parse(obj.rating).value:'',
            profile: obj.profile?JSON.parse(obj.profile):'',
            apprs: obj.apprs,//общее кол-во подтверждений
            published: obj.published,
            deleted: obj.deleted
        };
    }

    GetOrderSupplier(cb) {

        let data_obj = {
            proj: "d2d",
            user: window.user.constructor.name.toLowerCase(),
            func: "getorder",
            uid: window.user.uid,
            psw: window.user.psw,
            date: window.user.date
        };

        window.network.postRequest(data_obj, function (data) {

            if(data){
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
                        obj.date = new Date(obj.date);
                        obj.date.setHours(3);
                        obj.dict = obj.dict?JSON.parse(obj.dict):obj.dict;
                        obj.cus_profile =  obj.cus_profile?JSON.parse(obj.cus_profile):obj.cus_profile;
                        obj.logo =  "../dist/images/user.png";
                        if(obj.data)
                            obj.data = JSON.parse(obj.data);
                        if(obj.status)
                            obj.status = JSON.parse(obj.status);
                        window.db.SetObject('orderStore', obj, function (success) {

                        });
                    }

                }
            }catch(ex){
                console.log();
            }
        }
    }

    GetApprovedCustomer(supuid){
        let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        let data_obj = {
            proj: "d2d",
            user: window.user.constructor.name.toLowerCase(),
            func: "getapproved",
            uid: window.user.uid,
            supuid:'0c69c928179e2eac917acfbe88ec1946',
            date: date
        };

        window.network.postRequest(data_obj, function (data) {
            if(data) {
                processResult(data);
            }
        });

        function processResult(res) {
            try {
                if (res) {
                    for(let i in res) {
                        res[i].data = JSON.parse(res[i].data);
                        res[i].date = new Date(res[i].date);
                        res[i].date.setHours(3);
                        window.db.SetObject('approvedStore',res[i],function (res) {

                        });
                    }
                }
            }catch(ex){
                console.log();
            }
        }
    }

    GetApprovedSupplier(){
        let date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        let data_obj = {
            proj: "d2d",
            user: window.user.constructor.name.toLowerCase(),
            func: "getapproved",
            uid: window.user.uid,
            supuid: window.user.email,
            date: date
        };

        window.network.postRequest(data_obj, function (data) {
            if(data) {
                processResult(data);
            }
        });

        function processResult(res) {
            try {
                if (res) {
                    for(let i in res) {
                        let data_obj = JSON.parse(res[i].data);
                        window.db.GetOrder(res[i].date, res[i].supuid, res[i].cusuid, function (ord) {
                            if(ord!=-1 && ord.data[res[i].title]) {
                                ord.data[res[i].title].approved = data_obj.approved;
                                window.db.SetObject('orderStore', ord, function (res) {

                                });
                            }
                        });
                    }
                }
            }catch(ex){
                console.log();
            }
        }
    }

    SetLead(sup, cus){
        let that =  this;
        try{
            let date = new Date($('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD'));

            let data_obj = {
                proj: "d2d",
                user: window.user.constructor.name.toLowerCase(),
                func: "setlead",
                supuid: sup,
                cusuid: cus,
                date: date
            };

            window.network.postRequest(data_obj, function (data) {


            });
        }catch(ex){

        }
    }
}
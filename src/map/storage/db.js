export {DB};
import {utils} from '../../utils/utils';
//import Point from 'ol/geom/point';
//import Feature from 'ol/feature';
//import proj from 'ol/proj';
var md5 = require('md5');

class DB {

    constructor(user, f) {

        this.DBcon;
        this.version = 56;

        if (!window.indexedDB) {
            alert("Ваш браузер не поддерживат стабильную версию IndexedDB. Некоторые функции будут недоступны");
        }

        this.iDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
            this.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction,
            this.baseName = user+ ".D2DStore",
            this.supplierStore = "supplierStore",
            this.orderStore =  "orderStore",
            this.apprStore = "approvedStore",
            this.offerStore = "offerStore",
            this.dictStore = "dictStore",
            this.settingsStore = "setStore";

        if (!this.DBcon) {
            this.connectDB(function (con) {
                let first =false;
                if(!DB.prototype.DBcon)
                    first = true;
                DB.prototype.DBcon = con;
                if(first)
                    f();
            });
        }
    }

    logerr(err) {
        console.log(err);
    }


    connectDB(f) {
        var that = this;
        try {
            var request = this.iDB.open(this.baseName, this.version);
            request.onerror = function (err) {
                
            };
            request.onsuccess = function (e) {
                console.log("DB open onsuccess");
                f(request.result);

            }

            request.onupgradeneeded = function (e) {

                var db = e.target.result;
                db.onerror = function (event) {
                    console.log(event);
                };

                try {
                    //db.deleteObjectStore(that.settingsStore);
                    let vSetStore = db.createObjectStore(that.settingsStore, {keyPath: "uid"});
                    vSetStore.createIndex("uid", "uid", {unique: true});
                }catch(ex){

                }

                try {
                    //db.deleteObjectStore(that.offerStore);
                    let vOfferStore = db.createObjectStore(that.offerStore,
                        {keyPath: ["date"]}//{autoIncrement: true}
                        );
                    vOfferStore.createIndex("date", ["date"], {unique: true});
                }catch(ex){

                }

                try {
                    //db.deleteObjectStore(that.dictStore);
                    let vDictStore = db.createObjectStore(that.dictStore, {keyPath: "hash"});
                    vDictStore.createIndex("hash", "hash", {unique: true});
                }catch(ex){

                }

                try {
                    //db.deleteObjectStore(that.supplierStore);
                    let vSupplierStore = db.createObjectStore(that.supplierStore, {keyPath: ["date", "uid"]});
                    vSupplierStore.createIndex("date", ["date"], {unique: false});
                    vSupplierStore.createIndex("dateuid", ["date","uid"], {unique: true});

                }catch(ex){

                }

                try{
                    //db.deleteObjectStore(that.orderStore);
                    let vOrderStore = db.createObjectStore(that.orderStore, {keyPath: ["date", "supuid", "cusuid"]});
                    vOrderStore.createIndex("date", "date", {unique: false});
                    vOrderStore.createIndex("datesupuidcusuid", ["date","supuid", "cusuid"], {unique: true});
                    vOrderStore.createIndex("datesupuid", ["date","supuid"], {unique: false});
                    vOrderStore.createIndex("status", "status", {unique: false});

                }catch(ex){

                }

                try{
                    //db.deleteObjectStore(that.apprStore);
                    let vApprStore = db.createObjectStore(that.apprStore, {keyPath: ["date", "supuid", "cusuid"]});
                    vApprStore.createIndex("datesupcus", ["date", "supuid", "cusuid"], {unique: true});
                    vApprStore.createIndex("sup", ["supuid"], {unique: false});
                }catch(ex){

                }

                that.connectDB(f);
            };

        } catch (ex) {
            console.log('connectDB:' + ex);
        }
    }

    //unified storage function
    SetObject(storeName, obj, f) {
        var objectStore = DB.prototype.DBcon.transaction([storeName], "readwrite").objectStore(storeName);
        if(objectStore) {
            var request = objectStore.put(obj);
            request.onerror = function (err) {
                console.log(err);
                if (f)
                    f(false);
            };
            request.onsuccess = function () {
                if (f)
                    f(true);
            }
        }
    }

    ClearStore(storeName, cb){
        let objectStoreRequest = DB.prototype.DBcon.transaction([storeName], "readwrite").objectStore(storeName).clear();

        objectStoreRequest.onsuccess = function(event) {
            // report the success of our request
            cb();
        };
    }


    GetStorage(storeName, f) {

        var rows = {},
            store = DB.prototype.DBcon.transaction([storeName], "readonly").objectStore(storeName);

        if (store.mozGetAll)
            store.mozGetAll().onsuccess = function (e) {
                f(e.target.result);
            };
        else
            store.openCursor().onsuccess = function (e) {
                var cursor = e.target.result;
                if (cursor) {
                    rows[cursor.value.hash] = cursor.value.obj;
                    cursor.continue();
                }
                else {
                    f(rows);
                }
            };
    }

    GetSupplierFeature( date,uid, cb) {

        if(!this.DBcon)
            return;

        var tx = DB.prototype.DBcon.transaction([this.supplierStore], "readonly");
        var objectStore = tx.objectStore(this.supplierStore);
        let idateuid = objectStore.index("dateuid");

        var ar = [];

        idateuid.openCursor().onsuccess = function (event) {

            var cursor = event.target.result;
            if (cursor) {
                //
                // if(cursor.value.date!==date1)
                //     cursor.continue();

                //let period = cursor.value.period.split('-');

                var markerFeature = new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([cursor.value.longitude, cursor.value.latitude])),
                    labelPoint: new ol.geom.Point(ol.proj.fromLonLat([cursor.value.longitude, cursor.value.latitude])),
                    //name: cursor.value.title ? cursor.value.title : "",
                    //tooltip: cursor.value.title ? cursor.value.title : "",
                    categories: JSON.parse(cursor.value.categories),
                    type:'supplier',
                    object: cursor.value
                });

                markerFeature.setId(cursor.value.uid);
                ar.push(markerFeature);

                try {
                    cursor.continue();
                }catch (ex){
                    console.log();
                }
            }
        };

        tx.oncomplete = function () {
            cb(ar);
        }
    }

    GetSupplier( date,uid, cb) {

        if(!this.DBcon)
            return;

        var tx = DB.prototype.DBcon.transaction([this.supplierStore], "readonly");
        var objectStore = tx.objectStore(this.supplierStore);
        let idateuid = objectStore.index("dateuid");
        let request = idateuid.get([date,uid]);
        request.onsuccess = function (event) {
            try {
                cb(this.result);
            }catch (ex){
                console.log(ex);
            }
        };
    }

    GetRangeSupplier(date, lat_0, lon_0, lat_1, lon_1, f) {

        if(!this.DBcon)
            return;

        var tx = DB.prototype.DBcon.transaction([this.supplierStore], "readonly");
        var objectStore = tx.objectStore(this.supplierStore);
        var idateuid = objectStore.index("dateuid");

        var features = [];

        idateuid.openCursor().onsuccess = function (event) {

            let cursor = event.target.result;
            if (cursor) {
                if(lat_0<cursor.value.latitude && lat_1>cursor.value.latitude &&
                    lon_0<cursor.value.longitude && lon_1>cursor.value.longitude)
                    if(cursor.value.date === date)
                        features.push(cursor.value);

                cursor.continue();
            }
        };

        tx.oncomplete = function () {
            f(features);
        }

    }

    GetRangeCatSupplier(date, lat_0, lon_0, lat_1, lon_1, cat, f) {

        if(!this.DBcon)
            return;

        var tx = DB.prototype.DBcon.transaction([this.supplierStore], "readonly");
        var objectStore = tx.objectStore(this.supplierStore);
        var idateuid = objectStore.index("dateuid");

        var features = [];

        idateuid.openCursor().onsuccess = function (event) {

            let cursor = event.target.result;
            if (cursor) {
                if(lat_0<cursor.value.latitude && lat_1>cursor.value.latitude &&
                    lon_0<cursor.value.longitude && lon_1>cursor.value.longitude)
                    if(cursor.value.date === date)
                        if(cursor.value.data[cat])
                            features.push(cursor.value);

                cursor.continue();
            }
        };

        tx.oncomplete = function () {
            f(features);
        }

    }



    GetRangeDeliver(date, lat_0, lon_0, lat_1, lon_1, f) {

        if(!this.DBcon)
            return;

        var tx = DB.prototype.DBcon.transaction([this.supplierStore], "readonly");
        var objectStore = tx.objectStore(this.supplierStore);
        var idateuid = objectStore.index("dateuid");

        var features = [];

        idateuid.openCursor().onsuccess = function (event) {

            let cursor = event.target.result;
            if (cursor) {
                if((lat_0<cursor.value.latitude && lat_1>cursor.value.latitude &&
                    lon_0<cursor.value.longitude && lon_1>cursor.value.longitude) ||
                    cursor.value.profile.type==='deliver')
                    if(cursor.value.date === date)
                        features.push(cursor.value);

                cursor.continue();
            }
        };

        tx.oncomplete = function () {
            f(features);
        }

    }

    GetAllSuppliers(date,cb) {

        let tx = DB.prototype.DBcon.transaction([this.supplierStore], "readonly");
        var objectStore = tx.objectStore(this.supplierStore);
        let ind = objectStore.index("dateuid");
        let ar = [];
        ind.openCursor().onsuccess = function (event) {

            var cursor = event.target.result;
            if (cursor) {
                if(cursor.value.date === date)
                    ar.push(cursor.value);
            }
            try {
                cursor.continue();
            }catch (ex){
                console.log();
            }
        };
        tx.oncomplete = function () {
            cb(ar);
        }

        // objectStore.getAll().onsuccess = function(event) {
        //     cb(event.target.result);
        // };
    }

    GetDictValue(hash, cb){
        let tx = DB.prototype.DBcon.transaction([this.dictStore], "readonly");
        let objectStore = tx.objectStore(this.dictStore);
        let ind = objectStore.index("hash");
        var request = ind.get([hash]);
        request.onerror = function (ev) {
            cb(-1);
        }
        request.onsuccess = function (ev) {
            if(this.result){
                cb(this.result);
            }else{
                cb(-1);
            }
        };
    }


    GetSupOrders(date, supuid, cb){
        if(!this.DBcon)
            return;
        let tx = DB.prototype.DBcon.transaction([this.orderStore], "readonly");
        var objectStore = tx.objectStore(this.orderStore);
        let idatesupuid = objectStore.index("datesupuid");
        let ar = [];
        idatesupuid.openCursor().onsuccess = function (event) {

            var cursor = event.target.result;
            if (cursor) {
                if(cursor.value.date === date) {
                    ar.push(cursor.value);
                }
            }
            try {
                cursor.continue();
            }catch (ex){
                console.log();
            }
        };
        tx.oncomplete = function () {
            cb(ar);
        }
    }

    GetCusOrders(date, cb){
        if(!this.DBcon)
            return;
        let tx = DB.prototype.DBcon.transaction(this.orderStore, "readonly");
        var objectStore = tx.objectStore(this.orderStore);
        let idate = objectStore.index("date");
        let ar = [];
        idate.openCursor().onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                if(cursor.value.date === date) {
                    ar.push(cursor.value);
                }
                try {
                    cursor.continue();
                }catch (ex){
                    console.log();
                }
            }
        };
        tx.oncomplete = function () {
            cb(ar);
        }
    }

    GetOrder(date, supuid, cusuid, cb){

        let tx = DB.prototype.DBcon.transaction(this.orderStore, "readonly");
        var objectStore = tx.objectStore(this.orderStore);
        let ind = objectStore.index("datesupuidcusuid");
        var request = ind.get([date,supuid, cusuid]);
        request.onerror = function (ev) {
            cb(-1);
        }
        request.onsuccess = function (ev) {
            if(this.result){
                cb(this.result);
            }else{
                cb(-1);
            }
        };
    }

    DeleteOrder(date, supuid, cusuid, cb) {

        var request = DB.prototype.DBcon.transaction('orderStore', "readwrite").objectStore('orderStore').delete([date, supuid,cusuid]);
        request.onerror = function (ev) {
            console.log(ev);
        };
        request.onsuccess = function () {
            console.log("File delete from DB:");
            cb();
        }

    }

    GetObject(storeName, date, email,  cb) {

        if (!email || !date)
            return;
        try {
            let objectStore = DB.prototype.DBcon.transaction(storeName, "readonly").objectStore(storeName);
            let index = objectStore.index("dateemail");
            var request = index.get([date,email]);
            request.onerror = this.logerr;
            request.onsuccess = function (ev) {
                cb(this.result);
            }
        } catch (ex) {
            console.log(ex);
        }
    }

    DeleteObject(store, uid, cb) {

        var request = DB.prototype.DBcon.transaction(store, "readwrite").objectStore(store).delete(uid);
        request.onerror = function (ev) {
            console.log(ev);
        };
        request.onsuccess = function () {
            console.log("File delete from DB:");
            if(cb)
                cb();
        }

    }

    GetSettings(cb) {

        let tx = DB.prototype.DBcon.transaction([this.settingsStore], "readonly");
        var objectStore = tx.objectStore(this.settingsStore);
        let ind = objectStore.index("uid");

        var ar = [];
        ind.openCursor().onsuccess = function (event) {

            var cursor = event.target.result;
            if (cursor) {
                ar.push(cursor.value);
            }
            try {
                cursor.continue();
            }catch (ex){
                console.log();
            }
        };
        tx.oncomplete = function () {
            cb(ar);
        }

    }

    GetOfferTmplt(cb){
        var tx = DB.prototype.DBcon.transaction([this.offerStore], "readonly");
        var objectStore = tx.objectStore(this.offerStore);
        var objectStoreRequest = objectStore.get("tmplt");

        objectStoreRequest.onsuccess = function(event) {
            // report the success of our request
            if(objectStoreRequest.result)
                cb(objectStoreRequest.result);
            else cb();
        };
    }

    GetOffer(date,  cb) {
        try {

            var tx = DB.prototype.DBcon.transaction([this.offerStore], "readonly");
            var objectStore = tx.objectStore(this.offerStore);
            if (!date)
                return;
            try {
                let index = objectStore.index("date");
                var request = index.get([date]);
                request.onerror = this.logerr;
                request.onsuccess = function (ev) {
                    cb(this.result);
                }
            } catch (ex) {
                console.log(ex);
            }
        } catch (ex) {

        }
    }

    IsOffer(key, cb){
        var tx = DB.prototype.DBcon.transaction([this.offerStore], "readonly");
        var objectStore = tx.objectStore(this.offerStore);
        let request = objectStore.getKey([key]);
        request.onsuccess = (event) => {
            cb(event.target.result);
        };
    }

    GetAllOffers(cb) {
        let tx = DB.prototype.DBcon.transaction([this.offerStore], "readonly");
        var objectStore = tx.objectStore(this.offerStore);
        let ind = objectStore.index("date");
        var ar = [];
        ind.openCursor().onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                if(cursor.value.date!=='tmplt')
                    ar.push(cursor.value);

                try {
                    cursor.continue();
                } catch (ex) {
                    console.log();
                }
            }
        };

        tx.oncomplete = function () {
            cb(ar);
        }

    }

    GetLastOffer(cb) {
        let objectStore = DB.prototype.DBcon.transaction('offerStore', "readonly").objectStore('offerStore');
        objectStore.getAll().onsuccess = function(event) {
            cb(event.target.result[event.target.result.length-1]);
        };
    }

    GetApproved(date, supuid, cusuid, cb){
        try {
            let objectStore = DB.prototype.DBcon.transaction('approvedStore', "readonly").objectStore('approvedStore');
            let index = objectStore.index("datesupcus");
            var request = index.get([date,supuid, cusuid]);
            request.onerror = this.logerr;
            request.onsuccess = function (ev) {
                cb(this.result);
            }
        } catch (ex) {
            console.log(ex);
        }
    }

    GetSupApproved(supuid, cb){
        //TODO: проверить нужна ли дата date
        try {
            let objectStore = DB.prototype.DBcon.transaction('approvedStore', "readonly").objectStore('approvedStore');
            let index =  objectStore.index('sup');
            var request = index.get([supuid]);
            request.onerror = this.logerr;
            request.onsuccess = function (ev) {
                cb();
            }
        } catch (ex) {
            console.log(ex);
        }
    }
}



//////////////////
// WEBPACK FOOTER
// ./src/map/storage/db.js
// module id = 401
// module chunks = 1 2 8 9
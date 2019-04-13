export {DB};
import {utils} from '../../utils/utils';
import Point from 'ol/geom/point';
import Feature from 'ol/feature';
import proj from 'ol/proj';
var md5 = require('md5');

class DB {

    constructor(user, f) {

        this.DBcon;
        this.version = 30;

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
                DB.prototype.DBcon = con;
            });
            setTimeout(function () {
                f();
            }, 200);
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

                var db = event.target.result;
                db.onerror = function (event) {
                    console.log(event);
                };

                try {
                    let vSetStore = db.createObjectStore(that.settingsStore, {keyPath: ["uid"]});
                    vSetStore.createIndex("uid", "uid", {unique: true});
                }catch(ex){

                }

                try {
                    //db.deleteObjectStore(that.offerStore);
                    let vOfferStore = db.createObjectStore(that.offerStore, {keyPath: ["date"]});
                    vOfferStore.createIndex("date", "date", {unique: true});
                }catch(ex){

                }

                try {
                    //db.deleteObjectStore(that.dictStore);
                    let vDictStore = db.createObjectStore(that.dictStore, {keyPath: ["hash"]});
                    vDictStore.createIndex("hash", "hash", {unique: true});
                }catch(ex){

                }

                try {
                    //db.deleteObjectStore(that.supplierStore);
                    let vSupplierStore = db.createObjectStore(that.supplierStore, {keyPath: ["date", "uid"]});
                    vSupplierStore.createIndex("date", ["date"], {unique: false});
                    vSupplierStore.createIndex("dateuid", ["date","uid"], {unique: true});
                    vSupplierStore.createIndex("datelatlon",["date","latitude","longitude"],{unique: true});

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
                    let vApprStore = db.createObjectStore(that.apprStore, {keyPath: ["date", "supuid", "cusuid", "title"]});
                    vApprStore.createIndex("datesupcustitle", ["date", "supuid", "cusuid", "title"], {unique: true});
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
        var objectStore = this.DBcon.transaction([storeName], "readwrite").objectStore(storeName);
        var request = objectStore.put(obj);
        request.onerror = function (err) {
            console.log(err);
            if(f)
                f(false);
        };
        request.onsuccess = function () {
            if(f)
                f(true);
        }
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

        var tx = this.DBcon.transaction([this.supplierStore], "readonly");
        var objectStore = tx.objectStore(this.supplierStore);
        let idateuid = objectStore.index("dateuid");
        var lowerBound = [date, uid];
        var upperBound = [date, uid];
        let boundKeyRange = IDBKeyRange.bound(lowerBound,upperBound, false);

        var features = [];

        idateuid.openCursor(boundKeyRange).onsuccess = function (event) {

            var cursor = event.target.result;
            if (cursor) {
                //
                // if(cursor.value.date!==date1)
                //     cursor.continue();

                //let period = cursor.value.period.split('-');

                var markerFeature = new Feature({
                    geometry: new Point(proj.fromLonLat([cursor.value.longitude, cursor.value.latitude])),
                    labelPoint: new Point(proj.fromLonLat([cursor.value.longitude, cursor.value.latitude])),
                    //name: cursor.value.title ? cursor.value.title : "",
                    //tooltip: cursor.value.title ? cursor.value.title : "",
                    categories: JSON.parse(cursor.value.categories),
                    type:'supplier',
                    object: cursor.value
                });

                markerFeature.setId(cursor.value.uid);
                features.push(markerFeature);

                try {
                    cursor.continue();
                }catch (ex){
                    console.log();
                }
            }
        };

        tx.oncomplete = function () {
            cb(features);
        }
    }

    GetSupplier( date,uid, cb) {

        if(!this.DBcon)
            return;

        var tx = this.DBcon.transaction([this.supplierStore], "readonly");
        var objectStore = tx.objectStore(this.supplierStore);
        let idateuid = objectStore.index("dateuid");
        var lowerBound = [date, uid];
        var upperBound = [date, uid];
        let boundKeyRange = IDBKeyRange.bound(lowerBound,upperBound, false);

        var features = [];

        idateuid.openCursor(boundKeyRange).onsuccess = function (event) {

            var cursor = event.target.result;
            if (cursor) {
                try {
                    cb(cursor.value);
                }catch (ex){
                    console.log();
                }
            }
        };
    }

    GetRangeSupplier(date, lat_0, lon_0, lat_1, lon_1, f) {

        if(!this.DBcon)
            return;

        var tx = this.DBcon.transaction([this.supplierStore], "readonly");
        var objectStore = tx.objectStore(this.supplierStore);
        var ilatlon = objectStore.index("datelatlon");
        var lowerBound = [date,lat_0,lon_0];
        var upperBound = [date,lat_1,lon_1];
        let boundKeyRange = IDBKeyRange.bound(lowerBound,upperBound, false);

        var features = [];

        ilatlon.openCursor(boundKeyRange).onsuccess = function (event) {

            var cursor = event.target.result;
            if (cursor) {
                features.push(cursor.value);
            }
            try {
                cursor.continue();
            }catch (ex){
                console.log();
            }
        };

        tx.oncomplete = function () {
            f(features);
        }

    }

    GetAllSuppliers(date,cb) {
        let objectStore = this.DBcon.transaction('supplierStore', "readonly").objectStore('supplierStore');
        let ind = objectStore.index("date");
        ind.getAll([date]).onsuccess = function(event) {
            cb(event.target.result);
        };
    }

    GetDictValue(hash, cb){
        let tx = this.DBcon.transaction([this.dictStore], "readonly");
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
        let tx = this.DBcon.transaction([this.orderStore], "readonly");
        let objectStore = tx.objectStore(this.orderStore);
        let idatesupuid = objectStore.index("datesupuid");
        var request = idatesupuid.getAll([date,supuid]);
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

    GetCusOrders(date, cb){
        if(!this.DBcon)
            return;
        let tx = this.DBcon.transaction([this.orderStore], "readonly");
        let objectStore = tx.objectStore(this.orderStore);
        let idate = objectStore.index("date");
        var request = idate.getAll(date);
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

    GetOrder(date, supuid, cusuid, cb){

        let tx = this.DBcon.transaction([this.orderStore], "readonly");
        let objectStore = tx.objectStore(this.orderStore);
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

    DeleteOrder(date, supuid, cusuid) {

        var request = DB.prototype.DBcon.transaction('orderStore', "readwrite").objectStore('orderStore').delete([date, supuid,cusuid]);
        request.onerror = function (ev) {
            console.log(ev);
        };
        request.onsuccess = function () {
            console.log("File delete from DB:");
        }

    }

    GetObject(storeName, date, email,  cb) {

        if (!email || !date)
            return;
        try {
            let objectStore = this.DBcon.transaction(storeName, "readonly").objectStore(storeName);
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

        var request = DB.prototype.DBcon.transaction(store, "readwrite").objectStore(store).delete([uid]);
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
        try {
            let objectStore = this.DBcon.transaction('setStore', "readonly").objectStore('setStore');
            var request = objectStore.getAll();
            request.onerror = this.logerr;
            request.onsuccess = function (ev) {
                cb(this.result);
            }
        } catch (ex) {
            console.log(ex);
        }
    }

    GetOfferTmplt(cb){
        var tx = this.DBcon.transaction([this.offerStore], "readonly");
        var objectStore = tx.objectStore(this.offerStore);
        var myIndex = objectStore.index('date');
        myIndex.get("tmplt");
        myIndex.openCursor().onsuccess = function(event) {
            // report the success of our request
            cb(event.target.result.value);
        };
    }

    GetOffer(date,  cb) {
        try {

            var tx = this.DBcon.transaction([this.offerStore], "readonly");
            var objectStore = tx.objectStore(this.offerStore);
            var idate = objectStore.index("date");
            var lowerBound = new Date(date);
            lowerBound.setHours(lowerBound.getHours() - 1);
            var upperBound = new Date(date);
            upperBound.setHours(upperBound.getHours()+1);
            let boundKeyRange = IDBKeyRange.bound(lowerBound, upperBound,false);

            var ar = [];

            idate.openCursor(boundKeyRange).onsuccess = function (event) {

                var cursor = event.target.result;
                if (cursor) {
                    ar.push(cursor.value);
                }
                try {
                    cursor.continue();
                } catch (ex) {
                    console.log();
                }
            };

            tx.oncomplete = function () {
               cb(ar);
            }
        } catch (ex) {

        }
    }

    IsOffer(key, cb){
        let objectStore = this.DBcon.transaction('offerStore', "readonly").objectStore('offerStore');
        let request = objectStore.getKey([key]);
        request.onsuccess = (event) => {
            cb(event.target.result);
        };
    }

    GetAllOffers(cb) {
        let objectStore = this.DBcon.transaction('offerStore', "readonly").objectStore('offerStore');
        objectStore.getAll().onsuccess = function(event) {
            cb(event.target.result);
        };
    }

    GetLastOffer(cb) {
        let objectStore = this.DBcon.transaction('offerStore', "readonly").objectStore('offerStore');
        objectStore.getAll().onsuccess = function(event) {
            cb(event.target.result[event.target.result.length-1]);
        };
    }

    GetApproved(date, supuid, cusuid, title, cb){
        try {
            let objectStore = this.DBcon.transaction('approvedStore', "readonly").objectStore('approvedStore');
            let index = objectStore.index("datesupcustitle");
            var request = index.get([date,supuid, cusuid, title]);
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
            let objectStore = this.DBcon.transaction('approvedStore', "readonly").objectStore('approvedStore');
            let index =  objectStore.index('sup');
            var request = index.get([supuid]);
            request.onerror = this.logerr;
            request.onsuccess = function (ev) {
                cb(this.result);
            }
        } catch (ex) {
            console.log(ex);
        }
    }
}

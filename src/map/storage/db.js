export {DB};
import {utils} from '../../utils/utils';
import Point from 'ol/geom/point';
import Feature from 'ol/feature';
import proj from 'ol/proj';
var md5 = require('md5');

class DB {

    constructor(user, f) {

        this.DBcon;
        this.version = 16;

        if (!window.indexedDB) {
            console.log("Ваш браузер не поддерживат стабильную версию IndexedDB. Некоторые функции будут недоступны");
        }

        this.iDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
            this.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction,
            this.baseName = user+ ".D2DStore",
            this.supplierStore = "supplierStore",
            this.orderStore =  "orderStore",
            this.offerStore = "offerStore",
            this.dictStore = "dictStore",
            this.profileStore = "profileStore";

        if (!this.DBcon) {
            this.connectDB(function (con) {
                DB.prototype.DBcon = con;
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
            request.onerror = this.logerr;
            request.onsuccess = function (e) {
                console.log("DB open onsuccess");
                //request.onupgradeneeded(e);
                f(request.result);
            }

            request.onupgradeneeded = function (event) {

                var db = event.target.result;
                db.onerror = function (event) {
                    console.log(event);
                };

                try {
                    let vProfileStore = db.createObjectStore(that.profileStore, {keyPath: ["email"]});
                    vProfileStore.createIndex("email", "email", {unique: true});
                    vProfileStore.createIndex("tariff", "tariff", {unique: false});
                }catch(ex){

                }

                try {
                    let vOfferStore = db.createObjectStore(that.offerStore, {keyPath: ["date"]});
                    vOfferStore.createIndex("date", "date", {unique: false});
                }catch(ex){

                }

                try {
                    let vDictStore = db.createObjectStore(that.dictStore, {keyPath: ["hash"]});
                    vDictStore.createIndex("hash", "hash", {unique: true});
                }catch(ex){

                }

                try {
                    db.deleteObjectStore(that.supplierStore);
                }catch(ex){

                }
                let vSupplierStore = db.createObjectStore(that.supplierStore, {keyPath: ["date", "email"]});
                    vSupplierStore.createIndex("datehash", ["date","hash"], {unique: true});
                    vSupplierStore.createIndex("dateemail", ["date","email"], {unique: true});
                    vSupplierStore.createIndex("datelatlon",["date","latitude","longitude"],{unique: true});


                try{
                    db.deleteObjectStore(that.orderStore);
                }catch(ex){

                }
                let vOrderStore = db.createObjectStore(that.orderStore, {keyPath: ["date", "supem", "cusem"]});
                vOrderStore.createIndex("data", "data", {unique: false});
                vOrderStore.createIndex("datesupemcusem", ["date","supem", "cusem"], {unique: true});
                vOrderStore.createIndex("datesupem", ["date","supem"], {unique: false});
                vOrderStore.createIndex("status", "status", {unique: false});

                that.connectDB(f);
            };

        } catch (ex) {
            console.log('connectDB:' + ex);
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

    getSupplier( date, e1start, e1end, email, cb) {

        if (!email || !date)
            return;
        try {
            let objectStore = this.DBcon.transaction(this.supplierStore, "readonly").objectStore(this.supplierStore);
            let idateemail = objectStore.index("dateemail");
            var request = idateemail.get([date,email]);
            request.onerror = this.logerr;
            request.onsuccess = function (ev) {

                if(this.result){
                    let period = this.result.period.split('-');
                    if(parseInt(e1start) >= parseInt(period[0]) && parseInt(e1start) <= parseInt(period[1])
                        || parseInt(period[0]) >= parseInt(e1start) && parseInt(period[0]) <= parseInt(e1end)) {
                        cb(this.result);
                    }else{
                       cb(-1);
                    }
                }else{
                    cb(-1);
                }
            }
        } catch (ex) {
            console.log(ex);
        }
    }

    GetRangeSupplier(date, e1start, e1end, lat_0, lon_0, lat_1, lon_1, f) {

        if(!this.DBcon)
            return;

        var tx = this.DBcon.transaction([this.supplierStore], "readonly");
        var objectStore = tx.objectStore(this.supplierStore);
        var ilatlon = objectStore.index("datelatlon");
        var lowerBound = [date,lat_0,lon_0];
        var upperBound = [date,lat_1,lon_1];
        let boundKeyRange = IDBKeyRange.bound(lowerBound,upperBound);

        var features = [];

        ilatlon.openCursor(boundKeyRange).onsuccess = function (event) {

            var cursor = event.target.result;
            if (cursor) {

                if(cursor.value.date!==date)
                    cursor.continue();

                let period = cursor.value.period.split('-');

                if(parseInt(e1start) >= parseInt(period[0]) && parseInt(e1start) <= parseInt(period[1])
                    || parseInt(period[0]) >= parseInt(e1start) && parseInt(period[0]) <= parseInt(e1end)) {

                    var markerFeature = new Feature({
                        geometry: new Point(proj.fromLonLat([cursor.value.longitude, cursor.value.latitude])),
                        labelPoint: new Point(proj.fromLonLat([cursor.value.longitude, cursor.value.latitude])),
                        //name: cursor.value.title ? cursor.value.title : "",
                        //tooltip: cursor.value.title ? cursor.value.title : "",
                        categories: JSON.parse(cursor.value.categories),
                        type:'supplier',
                        object: cursor.value
                    });
                    var id_str = md5(cursor.value.email);
                    markerFeature.setId(cursor.value.hash);
                    features.push(markerFeature);
                }

                cursor.continue();
            }
        };

        tx.oncomplete = function () {
            f(features);
        }

    }

    SetObject(storeName, obj, f) {

        var objectStore = this.DBcon.transaction([storeName], "readwrite").objectStore(storeName);
        var request = objectStore.put(obj);
        request.onerror = function (err) {
            console.log(err);
            f(false);
        };
        request.onsuccess = function () {
            f(true);
        }
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

    GetOrders(date, supem,  cb){
        if(!this.DBcon)
            return;
        let tx = this.DBcon.transaction([this.orderStore], "readonly");
        let objectStore = tx.objectStore(this.orderStore);
        let idatesupem = objectStore.index("datesupem");
        var request = idatesupem.getAll([date,supem]);
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

    GetOrder(date, supem, cusem, cb){

        let tx = this.DBcon.transaction([this.orderStore], "readonly");
        let objectStore = tx.objectStore(this.orderStore);
        let ind = objectStore.index("datesupemcusem");
        var request = ind.get([date,supem, cusem]);
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

    delObject(storeName,file) {

        var request = DB.prototype.DBcon.transaction([storeName], "readwrite").objectStore(storeName).delete(file);
        request.onerror = logerr;
        request.onsuccess = function () {
            console.log("File delete from DB:", file);
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

    GetProfile(email,  cb) {
        try {
            let objectStore = this.DBcon.transaction('profileStore', "readonly").objectStore('profileStore');
            let index = objectStore.index('email');
            var request = index.get(email);
            request.onerror = this.logerr;
            request.onsuccess = function (ev) {
                cb(this.result);
            }
        } catch (ex) {
            console.log(ex);
        }
    }

    GetOffer(date,  cb) {
        try {
            let objectStore = this.DBcon.transaction('offerStore', "readonly").objectStore('offerStore');
            let index = objectStore.index("date");
            var request = index.get(date);
            request.onerror = this.logerr;
            request.onsuccess = function (ev) {
                cb(this.result);
            }
        } catch (ex) {
            console.log(ex);
        }
    }

    GetAllOffers(cb) {
        let objectStore = this.DBcon.transaction('offerStore', "readonly").objectStore('offerStore');
        objectStore.getAll().onsuccess = function(event) {
            cb(event.target.result);
        };
    }
}

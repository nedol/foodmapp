export {DB};
import {utils} from '../../utils/utils';
import Point from 'ol/geom/point';
import Feature from 'ol/feature';
import proj from 'ol/proj';
var md5 = require('md5');

class DB {

    constructor(f) {

        this.DBcon;
        this.version = 4;

        if (!window.indexedDB) {
            console.log("Ваш браузер не поддерживат стабильную версию IndexedDB. Некоторые функции будут недоступны");
        }

        this.iDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
            this.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction,
            this.baseName = "D2DStore",
            this.storeName = "supplierStore",
            this.imgStoreName = "imagesStore";


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
                //that.DeleteDB(that.iDB,that.baseName,function (db) {
                var db = event.target.result;
                db.onerror = function (event) {
                    console.log(event);
                };
                let vObjectStore = db.createObjectStore(that.storeName, {keyPath: ["date", "email"]});
                vObjectStore.createIndex("datehash", ["date","hash"], {unique: true});
                vObjectStore.createIndex("dateemail", ["date","email"], {unique: true});
                vObjectStore.createIndex("datelatlon",["date","latitude","longitude"],{unique: true});
                vObjectStore.createIndex("categories", "categories", {unique: false});
                vObjectStore.createIndex("offer", "offer", {unique: false});
                vObjectStore.createIndex("dict", "dict", {unique: false});
                vObjectStore.createIndex("latitude", "latitude", {unique: false});
                vObjectStore.createIndex("longitude", "longitude", {unique: false});
                vObjectStore.createIndex("period", "period", {unique: false});
                let vImgStore = db.createObjectStore(that.imgStoreName, {keyPath: "hash"});
                that.connectDB(f);
            //});
            };

        } catch (ex) {
            console.log('connectDB:' + ex);
        }
    }

    DeleteDB(iDB,name,cb) {

        var DBDeleteRequest = iDB.deleteDatabase(name);

        DBDeleteRequest.onerror = function(event) {
            console.log("Error deleting database.");
        };

        DBDeleteRequest.onsuccess = function(event) {
            console.log("Database deleted successfully");
            cb(event.target.result);
        };

        cb();
    }

    getStorage(f) {

        var rows = [],
            store = DB.prototype.DBcon.transaction([this.storeName], "readonly").objectStore(storeName);

        if (store.mozGetAll)
            store.mozGetAll().onsuccess = function (e) {
                f(e.target.result);
            };
        else
            store.openCursor().onsuccess = function (e) {
                var cursor = e.target.result;
                if (cursor) {
                    rows.push(cursor.value);
                    cursor.continue();
                }
                else {
                    f(rows);
                }
            };
    }

    getFile(date, e1start, e1end, email, f) {

        if (!email || !date)
            return;
        try {
            let objectStore = this.DBcon.transaction(this.storeName, "readonly").objectStore(this.storeName);
            let idateemail = objectStore.index("dateemail");
            var request = idateemail.get([date,email]);
            request.onerror = this.logerr;
            request.onsuccess = function (ev) {

                if(this.result){
                    let period = this.result.period.split('-');
                    if(e1start > period[0] && e1start < period[1] || period[0] > e1start && period[0] < e1end) {
                        f(this.result);
                    }
                }else{
                   return -1;
                }
            }
        } catch (ex) {
            console.log(ex);
        }
    }

    getRange(date, e1start, e1end, lat_0, lon_0, lat_1, lon_1, f) {

        if(!this.DBcon)
            return;

        var tx = this.DBcon.transaction([this.storeName], "readonly");
        var objectStore = tx.objectStore(this.storeName);
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

                if(e1start > period[0] && e1start < period[1] || period[0] > e1start && period[0] < e1end) {

                    var markerFeature = new Feature({
                        geometry: new Point(proj.fromLonLat([cursor.value.longitude, cursor.value.latitude])),
                        labelPoint: new Point(proj.fromLonLat([cursor.value.longitude, cursor.value.latitude])),
                        //name: cursor.value.title ? cursor.value.title : "",
                        //tooltip: cursor.value.title ? cursor.value.title : "",
                        categories: JSON.parse(cursor.value.categories),
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

    setFile(obj, f) {

        var objectStore = this.DBcon.transaction([this.storeName], "readwrite").objectStore(this.storeName);
        var request = objectStore.put(obj);
        request.onerror = function (err) {
            console.log(err);
            f(false);
        };
        request.onsuccess = function () {
            f(true);
        }
    }

    delFile(file) {

        var request = DB.prototype.DBcon.transaction([this.storeName], "readwrite").objectStore(this.storeName).delete(file);
        request.onerror = logerr;
        request.onsuccess = function () {
            console.log("File delete from DB:", file);
        }
    }

    GetObject(id_str, f) {

        window.db.getFile(id_str, null, function (res) {

            if (res !== -1) {
                f(res);
            }
        });
    }

}

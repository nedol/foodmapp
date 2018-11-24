export {DB};
import {utils} from '../../utils/utils';
import Point from 'ol/geom/point';
import Feature from 'ol/feature';
import proj from 'ol/proj';
//var DB = DB || {};
class DB {

    constructor(f) {

        this.DBcon;
        this.version = 1;

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
        var func = this;
        try {
            var request = this.iDB.open(this.baseName, this.version);
            request.onerror = this.logerr;
            request.onsuccess = function (e) {
                console.log("DB open onsuccess");
                //request.onupgradeneeded(e);
                f(request.result);
            }

            request.onupgradeneeded = function (e) {
                //this.iDB.DeleteDB(function () {
                var db = event.target.result;
                db.onerror = function (event) {
                    console.log(event);
                };
                let vObjectStore = db.createObjectStore('objectesStore', {keyPath: "uid"});
                vObjectStore.createIndex("uid", "uid", {unique: true});
                vObjectStore.createIndex("hash", "hash", {unique: false});
                vObjectStore.createIndex("categories", "categories", {unique: false});
                vObjectStore.createIndex("offer", "offer", {unique: false});
                vObjectStore.createIndex("latlon", ["latitude", "longitude"], {unique: false});
                let vImgStore = db.createObjectStore('imagesStore', {keyPath: "hash"});
                func.connectDB(f);
            };

        } catch (ex) {
            console.log('connectDB:' + ex);
        }
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

    getFile(file_id, obj, f) {

        if (!file_id)
            return;
        try {
            var request = this.DBcon.transaction([this.storeName], "readonly").objectStore(this.storeName).get(file_id);
            request.onerror = logerr;
            request.onsuccess = function () {
                //console.log("File get from DB:"+request.result);
                f(this.result ? this.result : -1, file_id, obj);
            }
        } catch (ex) {

        }
    }

    getRange(cat, lat_0, lon_0, lat_1, lon_1, f) {

        if(!this.DBcon)
            return;
        var tx = this.DBcon.transaction([this.storeName], "readonly");
        var objectStore = tx.objectStore(this.storeName);
        var features = [];
        var icat = objectStore.index("category");
        var boundKeyRange = IDBKeyRange.only(cat);

        icat.openCursor(boundKeyRange).onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                cat = cursor.value.category;
                var markerFeature = new Feature({
                    geometry: new Point(proj.fromLonLat([cursor.value.longitude, cursor.value.latitude])),
                    labelPoint: new Point(proj.fromLonLat([cursor.value.longitude, cursor.value.latitude])),
                    name: cursor.value.title ? cursor.value.title : "",
                    tooltip: cursor.value.title ? cursor.value.title : "",
                    object: cursor.value
                });
                var id_str = GetObjId(cursor.value.latitude, cursor.value.longitude);
                markerFeature.setId(id_str);
                if (cursor.value.latitude <= lat_1 && cursor.value.longitude <= lon_1 &&
                    cursor.value.latitude >= lat_0 && cursor.value.longitude >= lon_0)
                    features.push(markerFeature);
                cursor.continue();
            }
        };

        tx.oncomplete = function () {
            f(cat, features);
        }

    }

    setFile(obj, f) {

        var objectStore = this.DBcon.transaction([this.storeName], "readwrite").objectStore(this.storeName);
        var request = objectStore.put(obj);
        request.onerror = function (err) {
            console.log(err);
            f(obj.category);
        };
        request.onsuccess = function () {
            f(obj.category);
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


    GetObjectAttr(id_str, attr, f) {

        window.db.getFile(id_str, null, function (res, id_str, obj) {

            if (res !== -1) {
                uObj = JSON.parse(res.data);
                f(uObj[attr]);
            }
        });
    }

    SetObjectAttr(id_str, attr, new_val) {

        window.db.getFile(id_str, null, function (res, id_str, obj) {

            if (res !== -1) {
                res[attr] = new_val;
                window.db.setFile(res, function (cat) {

                });
            }
        });
    }
}

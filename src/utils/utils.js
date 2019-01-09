export {Utils}
let http = require('http');
let https = require('https');

$.fn.setCursorPosition = function(pos) {
    this.each(function(index, elem) {
        if (elem.setSelectionRange) {
            elem.setSelectionRange(pos, pos);
        } else if (elem.createTextRange) {
            var range = elem.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    });
    return this;
};

class Utils{

    getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    toJSONLocal(date) {
        var local = new Date(date);
        local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return local.toJSON().slice(0, 10);
    }

    QueryMethod(protocol,options, postData, res, cb) {
        let http_;
        if(protocol==='http')
            http_ = http;
        else if(protocol==='https')
            http_ = https;
        var req = http_.request(options, function (res) {
            console.log('Status: ' + res.statusCode);
            console.log('Headers: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', function (body) {
                console.log('Body: ' + body);
                cb(body, res);
            });
    });
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
        cb('error', res);
    });
    // write data to request body
    if (postData)
        req.write(postData);
    req.end();

    }

    resizeBase64Img(base64, width, height) {
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext("2d");
        var deferred = $.Deferred();
        $("<img/>").attr("src", "data:image/gif;base64," + base64).load(function() {
            context.scale(width/this.width,  height/this.height);
            context.drawImage(this, 0, 0);
            deferred.resolve($("<img/>").attr("src", canvas.toDataURL()));
        });
        return deferred.promise();
    }

    createThumb(base, w, h, callback) {
        var c = document.createElement("canvas"),    // create a canvas
            ctx = c.getContext("2d"),                // get context
            img = new Image();                       // final image
            img.crossOrigin="anonymous";
        c.width = w;                                 // set size = thumb
        c.height = h;
        ctx.drawImage(base, 0, 0, w, h);            // draw in frame
        img.onload = function() {                    // handle async loading
            callback(this);                // provide image to callback
        };
        img.src = c.toDataURL();                     // convert canvas to URL
    }

    isIntersec(from, from_1, to, to_1) {
        if((from >=from_1 && to<=to_1)||
        (from <=from_1 && to>=to_1)||
        (from <= from_1 && to>from_1 && to<=to_1) ||
        (from >= from_1 && from<to_1 && to>=to_1)){
            return true;
        }else{
            return false;
        }
    }
    getObjects(obj, key, val) {
        var objects = [];
        for (var i in obj) {
            if (!obj.hasOwnProperty(i)) continue;
            if (typeof obj[i] == 'object') {
                objects = objects.concat(this.getObjects(obj[i], key, val));
            } else if (i == key && obj[key] == val) {
                objects.push(obj);
            }
        }
        return objects;
    }
    LatLonToMeters(lat1, lon1, lat2, lon2){  // generally used geo measurement function
        var R = 6378.137; // Radius of earth in KM
        var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
        var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        return d * 1000; // meters
    }

    HandleFileSelect(evt, files, cb) {
        evt.stopPropagation();
        evt.preventDefault();
        let that = this;
        this.reader = new FileReader();

        if(!files && evt.originalEvent.dataTransfer)
            files = evt.originalEvent.dataTransfer.files; // FileList object.
        // files is a FileList of File objects. List some properties.
        for (let i = 0, f; f = files[i]; i++) {
            console.log('HandleFileSelect:'+f.type);
            switch (f.type) {
                case "audio/mp3": case "audio/amr": case "audio/wav":  case "video/mp4": case "ogg":

                that.LoadFile(f, function (obj) {
                    cb(obj);
                });
                break;
                case "image/jpeg":   case "image/jpg":
                case "image/png":
                case "image/gif":
                    that.LoadImage(f, function (obj) {
                        if(!obj)
                            return null;
                        cb(obj);
                    });
                    break;
            }
        }
    }
    LoadImage(f, cb){

        var reader = new FileReader();

        reader.onload = function (e) {
            cb(e.target.result);
        }

        reader.readAsDataURL(f);

    }
    LoadFile(f, callback) {

        this.reader.onerror = errorHandler;
        this.reader.onabort = function(e) {
            alert('File read cancelled');
        };
        this.reader.onload = (function (f) {
            return function (e) {
                console.log("data:" );
                HandleResults(this.reader.result);
            }
        })(f);

        this.reader.readAsDataURL(f);
        //reader.readAsBinaryString(f);
        //reader.readAsArrayBuffer(f);

        function errorHandler(evt) {
            switch(evt.target.error.code) {
                case evt.target.error.NOT_FOUND_ERR:
                    alert('File Not Found!');
                    break;
                case evt.target.error.NOT_READABLE_ERR:
                    alert('File is not readable');
                    break;
                case evt.target.error.ABORT_ERR:
                    break; // noop
                default:
                    alert('An error occurred reading this file.');
            };
        }

        function HandleResults(res){

            let coor = [];
            let ctype, func, cat;
            if (f.type.indexOf("audio/") !== -1) {
                ctype = '1';
                func = 'InsertAudio';
                cat = '0'
            }
            let fAr = f.name.split('_');
            if (f.name.indexOf('id_') !== -1 && fAr[1].indexOf('.') !== -1 && fAr[2].indexOf('.') !== -1) {
                coor[0] = parseFloat(fAr[2].split('h')[0]);
                coor[1] = parseFloat(fAr[1]);

            } else {

            }

            //let obj_id = GetObjId(coor[1],coor[0]);
            // let hash = MD5(obj_id);
            // img_db.setFile({id:hash,data:data});


            let obj = {
                category: cat,
                type: ctype,
                filename: f.name,
                id: obj_id,
                longitude: coor[0],
                latitude: coor[1],
                ambit: 50,
                status: '1',
                image: "..src/categories/images/ic_0.png",//icon
                //scale: scale,
                url: hash,
                caption: f.name,
                func: func
            }

        }
    }
    LoadThmb(f, options, callback){

        loadImage(
            f,
            function (thmb) {
                let logo_data = thmb.toDataURL("image/jpeg");
                callback(logo_data);
            },
            options
        );
    }

}
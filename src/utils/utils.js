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

Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + parseInt(days));
    return this;
};

// parent
window.alert_ = function(msg,type,fadeout){
    if(typeof msg ==='string') {
        msg = {text: msg}
    }
    $(".alert_container").css('display','block');
    if(type)
        $(".alert").addClass(type);
    $(".alert").find('a').text(msg.text);
    $(".alert").find('a').attr('href',msg.link);
    $(".alert").removeClass("in").show();
    $(".alert").delay(200).addClass("in");
    if(fadeout)
        $(".alert").fadeOut(fadeout);
    $('.alert button').on('click touchstart',function (ev) {
        $(".alert_container").css('display','none')
    });
}

class Utils{

    JSONParse(result) {
        try {
            return JSON.parse(result);
        } catch (e) {
            throw e;
        }
    }

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

    isJSON(str) {
        try {
            var obj = JSON.parse(str);
            if (obj && typeof obj === 'object' && obj !== null) {
                return true;
            }
        } catch (err) {}
        return false;
    }

    parseURL(url) {
        var parser = document.createElement('a'),
            searchObject = {},
            queries, split, i;
        // Let the browser do the work
        parser.href = url;
        // Convert query string to object
        queries = parser.search.replace(/^\?/, '').split('&');
        for( i = 0; i < queries.length; i++ ) {
            split = queries[i].split('=');
            searchObject[split[0]] = split[1];
        }
        return {
            protocol: parser.protocol,
            host: parser.host,
            hostname: parser.hostname,
            port: parser.port,
            pathname: parser.pathname,
            search: parser.search,
            searchObject: searchObject,
            hash: parser.hash
        };
    }

    ValidateEmail(inputText){
        var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if(inputText.value.match(mailformat))
        {
            return true;
        }
        else
        {
            return false;
        }
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

    loadScript(src, callback) {

        var head = document.getElementsByTagName('head')[0],
            script = document.createElement('script');
        done = false;
        script.setAttribute('src', src);
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('charset', 'utf-8');
        script.onload = script.onreadstatechange = function() {
            if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
                done = true;
                script.onload = script.onreadystatechange = null;
                if (callback) {
                    callback();
                }
            }
        }
        head.insertBefore(script, head.firstChild);
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

    createThumb(el, maxWidth){
        var thmbImg = loadImage.scale(
            $(el)[0], // img or canvas element
            {maxWidth: maxWidth?maxWidth:50}
        );
        return thmbImg.src;
    }

    createThumb_1(base, w, h, callback) {
        var c = document.createElement("canvas"),    // create a canvas
            ctx = c.getContext("2d"),                // get context
            img = new Image();                       // final image
            img.crossOrigin="anonymous";
        c.width = w;                                 // set size = thumb
        c.height = h;
        ctx.drawImage(base, 0, 0, w, h);             // draw in frame
        img.onload = function() {                   // handle async loading
            callback(this);                // provide image to callback
        };
        img.src = c.toDataURL();             // convert canvas to URL
    }

    resetOrientation(srcBase64, srcOrientation, callback) {
        var img = new Image();

        img.onload = function() {
            var width = img.width,
                height = img.height,
                canvas = document.createElement('canvas'),
                ctx = canvas.getContext("2d");

            // set proper canvas dimensions before transform & export
            if (4 < srcOrientation && srcOrientation < 9) {
                canvas.width = height;
                canvas.height = width;
            } else {
                canvas.width = width;
                canvas.height = height;
            }

            // transform context before drawing image
            switch (srcOrientation) {
                case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
                case 3: ctx.transform(-1, 0, 0, -1, width, height ); break;
                case 4: ctx.transform(1, 0, 0, -1, 0, height ); break;
                case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
                case 6: ctx.transform(0, 1, -1, 0, height , 0); break;
                case 7: ctx.transform(0, -1, -1, 0, height , width); break;
                case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
                default: break;
            }

            // draw image
            ctx.drawImage(img, 0, 0);

            // export base64
            callback(canvas.toDataURL());
        };

        img.src = srcBase64;
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

    LoadImage_new(f, cb){

        var reader = new FileReader();

        reader.onload = function (e) {
            cb(e.target.result);
        }

        reader.readAsDataURL(f);
    }

    LoadImage(f, callback){

        loadImage(
            f,
            function (img) {
                let or = (img.width >= img.height) ? 'l' : 'p';
                let options = [];
                options['canvas'] = true;
                options['orientation'] = true;
                if (or === 'l') {
                    options['minWidth'] = 70;
                    options['maxHeight'] = 50;
                } else if (or === 'p') {
                    options['minHeight'] = 70;
                    options['maxWidth'] = 50;
                }

                callback(img.toDataURL(f.type));

            },
            {
                orientation:true,
                canvas:true,
                maxWidth: 1000,
                maxHeight: 600
            }// Options
        );

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
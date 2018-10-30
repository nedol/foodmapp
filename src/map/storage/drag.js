export {Drag};

class Drag {

    constructor(map) {
        this.map = map;
        this.reader;
        this.dropZone;
    }


    InitFileImport() {

        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            // Great success! All the File APIs are supported.
        } else {
            alert('The File APIs are not fully supported in this browser.');
        }


        // Setup the dnd listeners.
        // $("map").on('dragstart', handleDragStart);
        // $("map").on('dragleave', handleDragLeave);
        $('body').on('dragover', this.handleDragOver);
        $('body').on('drop', this.handleFileSelect);

        // let map = document.getElementById('map');
        // FileAPI.event.on(map, 'drop', function (evt/**Event*/) {
        //     evt.preventDefault();
        //     handleFileSelect(evt);
        // });

    }

    handleDragStart(evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }

    handleDragLeave(evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }

    handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.originalEvent.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

    handleFileSelect(evt, files) {
        evt.stopPropagation();
        evt.preventDefault();

        this.reader = new FileReader();

        if (!files && evt.originalEvent.dataTransfer)
            files = evt.originalEvent.dataTransfer.files; // FileList object.
        // files is a FileList of File objects. List some properties.
        for (let i = 0, f; f = files[i]; i++) {
            console.log('handleFileSelect:' + f.type);
            switch (f.type) {
                case "audio/mp3":
                case "audio/amr":
                case "audio/wav":
                case "video/mp4":
                case "ogg":

                    LoadFile(f, function (obj) {
                        SetMarkerMap(obj);
                        AddToRecords(obj);
                        view.animate({
                                center: ol.proj.fromLonLat([obj.lon, obj.lat]),
                                duration: 1000
                            }, function () {

                            }
                        );
                    });
                    break;
                case "image/jpeg":
                case "image/jpg":
                case "image/png":
                case "image/gif":
                    LoadImage(f, function (obj) {
                        if (!obj)
                            return;
                        SetMarkerMap(obj);
                        AddToPhotos(obj);
                        view.animate({
                                center: ol.proj.fromLonLat([obj.longitude, obj.latitude]),
                                duration: 1000
                            }, function () {

                            }
                        );
                    });
                    break;
            }
        }

        // FileList object.
        for (let i = 0; i < files.length; i++) {
            files[i].getAsString(function (link) {
                this.SetLinkMarker(link);
            });
        }

    }

    LoadImage(f, callback) {

        loadImage(f, function (img) {
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

                ProcessImg(img, f);

                function ProcessImg(img, f) {

                    let data = img.toDataURL(f.type);
                    let coor = [];
                    let ctype, func, cat;
                    if (f.type.indexOf("image/") !== -1) {
                        ctype = '1';
                        func = 'InsertImage';
                        cat = '12'
                    }
                    let fAr = f.name.split('_');
                    if (f.name.indexOf('id_') !== -1 && fAr[1].indexOf('.') !== -1 && fAr[2].indexOf('.') !== -1) {
                        coor[0] = parseFloat(fAr[2].split('h')[0]);
                        coor[1] = parseFloat(fAr[1]);

                    } else {
                        let marker_pos = Marker.overlay.getPosition();
                        if ($('#mouse_pos_div').text().length > 6)
                            coor = JSON.parse("[" + $('#mouse_pos_div').text() + "]");
                        if (!coor[0] && !coor[1])
                            coor = ol.proj.toLonLat(Marker.overlay.getPosition());
                        if (!coor[0] && !coor[1])
                            coor = ol.proj.transform(d2d_map.ol_map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');

                    }

                    let obj_id = GetObjId(coor[1], coor[0]);
                    let hash = MD5(obj_id);
                    window.db.setFile({hash: hash, data: data});

                    this.LoadThmb(f, options, function (logo_data) {

                        let obj = {
                            category: cat,
                            id: obj_id,
                            longitude: coor[0],
                            latitude: coor[1],
                            ambit: 50,
                            status: '1',
                            logo_data: logo_data,//"./categories/images/ic_12.png",//icon
                            //scale: scale,
                            url: hash,
                            caption: f.name,
                            func: 'InsertImage'
                        };
                        if (obj.longitude && obj.latitude)
                            callback(obj);
                        else
                            callback(null);
                    });

                }

            },
            {
                orientation: true,
                canvas: true
                //maxWidth: 600,
                //maxHeight: 300
            }// Options
        );

    }

    LoadThmb(f, options, callback) {

        loadImage(
            f,
            function (thmb) {
                let logo_data = thmb.toDataURL("image/jpeg");
                callback(logo_data);
            },
            options
        );
    }

    LoadFile(f, callback) {

        this.reader.onerror = errorHandler;
        this.reader.onabort = function (e) {
            alert('File read cancelled');
        };
        this.reader.onload = (function (f) {
            return function (e) {
                console.log("data:");
                HandleResults(reader.result);
            }
        })(f);

        this.reader.readAsDataURL(f);
        //reader.readAsBinaryString(f);
        //reader.readAsArrayBuffer(f);
    }

    errorHandler(evt) {
        switch (evt.target.error.code) {
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
        }
    }

    HandleResults(res) {

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
            if ($('#mouse_pos_div').text().length > 6) {
                coor = JSON.parse("[" + $('#mouse_pos_div').text() + "]");
            } else {
                coor = ol.proj.toLonLat(Marker.overlay.getPosition());
            }
        }

        let obj_id = GetObjId(coor[1], coor[0]);
        let hash = MD5(obj_id);
        img_db.setFile({id: hash, data: data});


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

        if (musicmetadata)
            getMusicMetaData(obj, callback);
        else {
            callback(obj);
        }


    }


    getMusicMetaData(obj, callback) {
        try {
            musicmetadata(e.target.result, function (err, result) {
                if (err) {
                    callback(obj);
                    throw err;
                }

                let album = result.album ? result.album + " " : "";
                let artist = result.artist[0] ? result.artist[0] + " " : "";
                let title = artist + album + " " + result.title;

                let picture = result.picture[0];
                //let url = URL.createObjectURL(new Blob([picture.data], {'type': 'image/' + picture.format}));
                //reader.readAsDataURL(new Blob([picture.data]));
                let blob = new Blob([picture.data], {'type': 'image/' + picture.format});
                let options = [];
                options['canvas'] = true;
                options['orientation'] = true;
                options['maxWidth'] = 50;
                options['maxHeight'] = 50;
                LoadThmb(blob, options, function (logo_data) {
                    obj = {
                        category: cat,
                        type: ctype,
                        filename: f.name,
                        hash: hash,//md(coor[1] + "_" + coor[0]),
                        lon: coor[0],
                        lat: coor[1],
                        ambit: 50,
                        status: '1',
                        logo_data: logo_data,
                        //scale: scale,
                        url: hash,
                        caption: title ? title : f.name,
                        func: func
                    };
                    callback(obj);
                });
            });
        } catch (ex) {
            callback(obj);
            console.log("exception musicmetadata");
        }
    }


    SetFileMarker(f, arBuf, marker_coor) {

        if (f === 'undefined')
            return;


        let coor = [];
        let ctype, func, cat;

        if (f.type.indexOf("audio/") !== -1) {
            ctype = '1';
            func = 'InsertAudio';
            cat = '1'
        }
        let fAr = f.name.split('_');
        if (f.name.indexOf('id_') !== -1 && fAr[1].indexOf('.') !== -1 && fAr[2].indexOf('.') !== -1) {
            coor[0] = parseFloat(fAr[2].split('h')[0]);
            coor[1] = parseFloat(fAr[1]);

        } else {
            try {
                if (!marker_coor)
                    coor = JSON.parse("[" + $('#mouse_pos_div').text() + "]");
                else
                    coor = ol.proj.toLonLat(marker_coor);

            } catch (ex) {

            }
        }

        if (cat === '1') {
            success_records(hash, null, coor, cat, func);
        }

    }


    success_photos(hash, logo_data, coor, cat, func) {

        if (hash) {
            let obj = {
                category: cat,
                filename: f.name,
                hash: hash,//md(coor[1] + "_" + coor[0]),
                lon: coor[0],
                lat: coor[1],
                ambit: 50,
                status: '1',
                logo_data: logo_data,//"./categories/images/ic_12.png",//icon
                //scale: scale,
                url: hash,
                caption: f.name,
                func: func
            };

        }


    }

    success_records(hash, src, coor, cat, func) {
        let obj = {
            category: cat,
            type: '1',
            filename: f.name,
            hash: hash,//md(coor[1] + "_" + coor[0]),
            lon: coor[0],
            lat: coor[1],
            ambit: 50,
            status: '1',
            image: "..src/categories/images/ic_0.png",//icon
            //scale: scale,
            url: hash,
            caption: f.name,
            func: func
        };

        SetMarkerMap(obj);
        AddToRecords(obj);

        view.animate({
                center: ol.proj.fromLonLat([coor[0], coor[1]]),
                duration: 1000
            }, function () {
            }
        );
    }

    SetLinkMarker(link) {

        if (!link)
            return;


        let coor = ol.proj.transform(d2d_map.ol_map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
        try {
            coor = JSON.parse("[" + $('#mouse_pos_div').text() + "]");
        } catch (ex) {

        }
        let id_str = GetObjId(this.obj.lat, this.obj.lon);
        this.SetMarkerMap({
            category: 10,
            id: id_str,
            lon: coor[0],
            lat: coor[1],
            ambit: 50,
            status: '1',
            image: "./categories/images/webpage.png",
            //scale: 0.3,
            url: link,
            caption: link,
            func: "InsertIFrame"
        });
    }

    sendRequest() {

        let func, cat, ctype, icon;
        let formData = new FormData();
        if (f.type.indexOf("audio/") !== -1) {
            formData.append('table', 'records_' + lang);
            formData.append('ctype', ctype = '1');
            formData.append('category', cat = '1');
            func = 'InsertAudio';
            icon = './categories/images/ic_1.png';
        } else if (f.type.indexOf("image/") !== -1) {
            formData.append('table', 'photos');
            formData.append('ctype', ctype = '2');
            formData.append('category', cat = '12');
            func = 'InsertImage';
        }

        formData.append('section', 'general');
        formData.append('action', 'previewImg');
        // Main magic with files here
        formData.append('type', 'data');
        formData.append('user', user);
        formData.append('file', src);
        formData.append('lang', 'ru');
        formData.append('filename', f.name);
        formData.append('size', byteLength(src));
        formData.append('cur_lat', coor[0]);
        formData.append('cur_lng', coor[1]);

        $.ajax({
            url: http + host + "/php/upload_file.php?XDEBUG_SESSION_START=PHPSTORM",
            type: "POST",
            data: formData, //new FormData(img.outerHTML),
            dataType: 'json',
            contentType: false,
            cache: false,
            processData: false,
            crossDomain: true,
            //beforeSend: function(xhr){xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded")},
            success: function (data) {
                let d = data[0];
                if (d.error === '1') {
                    let obj = JSON.parse(localStorage.getItem(d.hash));

                    if (obj) {
                        //set status for existing obj
                        obj.status = 1;
                        localStorage.setItem(obj.hash, JSON.stringify(obj));
                        let coor = ol.proj.fromLonLat([obj.lon, obj.lat]);

                        view.animate({
                            center: coor,
                            duration: 1000
                        }, function () {
                            Marker.overlay.setPosition(coor)
                        });
                    }
                    else {
                        if (cat === '12') {
                            success_photos(cat, Array.isArray(data) ? data : JSON.parse(data), func);
                        } else if (cat === '1') {
                            success_records(cat, Array.isArray(data) ? data : JSON.parse(data), func);
                        }
                    }
                } else {

                    if (cat === '12') {
                        success_photos(cat, Array.isArray(data) ? data : JSON.parse(data), func);
                    } else if (cat === '1') {
                        success_records(cat, Array.isArray(data) ? data : JSON.parse(data), func);
                    }
                }
            },
            error: function () {
                console.log();
            }
        });
    }
}
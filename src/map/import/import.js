export {Import};

import proj from 'ol/proj';
var md5 = require('md5');

class Import {

    constructor(map){
        this.map = map;
        this.areasAr = [];
    }

    ImportData(event) {
        let that = this;
        if (!window.sets.coords.cur)
            return;
        var LotLat = proj.toLonLat(window.sets.coords.cur);

        if (this.map.ol_map.getView().getZoom() >= 14) {
            try {

                let cats= [];
                $(".category[state='1']").each(function (i, cat) {
                    cats.push(parseInt(cat.id));
                });

                var area = [
                    (parseFloat(LotLat[1].toFixed(1)) - 0.05).toFixed(2),
                    (parseFloat(LotLat[1].toFixed(1)) + 0.05).toFixed(2),
                    (parseFloat(LotLat[0].toFixed(1)) - 0.05).toFixed(2),
                    (parseFloat(LotLat[0].toFixed(1)) + 0.05).toFixed(2)
                ];

                let str = cats +  "_" +  area;

                if (!IsDownloadedArea(cats +  "_" +  area)) {
                    let uid = that.map.supplier.uid;
                    that.LoadSupplierData(uid, cats, area, function (res) {
                        if (res)
                            that.areasAr.push(cats +  "_" +  area);
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

    LoadSupplierData(uid, cats,area, cb ) {
        let that =  this;

        function processResult(res) {

            // var res = $.grep($(res), function (el, i) {
            //     return el.object === 'object'
            // });

            if (res.length > 0) {

                let markerArr = [];

                for (var i = 0; i < res.length; i++) {
                    var obj = res[i];

                    if (obj.area) {
                        that.areasAr.push(obj.area);
                        continue;
                    }

                    cat = obj.category;

                    if (obj.logo) {
                        //var id_str = GetObjId(obj.latitude,obj.longitude);
                        obj.logo = "data:image/*;base64," + obj.logo;
                    }

                    addToArr(markerArr, obj);

                }

                if(markerArr.length>0)
                    that.map.SetMarkersArExt(cat, markerArr);


            }
            cb(true);
        }

        function addToArr(jsAr,obj) {

            jsAr.push({
                owner: obj.owner,
                id: md5(parseFloat(obj.latitude),parseFloat(obj.longitude)),
                url: obj.url,//.replace("http","https"),
                category: obj.category,
                level: obj.level,
                func: obj.func,
                caption: obj.caption,
                title: obj.title,
                longitude: parseFloat(obj.longitude),
                latitude: parseFloat(obj.latitude),
                logo: obj.logo,
                owner: obj.owner,
                owner_email: obj.owner_email,
                overlay: obj.overlay
            });

        }


        try{
            var url = host_port+'/?'+ //
                "proj=d2d"+
                "&func=get_suppliers"+
                "&uid="+ uid+
                "&cats="+cats+
                "&areas="+area+
                "&lang="+window.sets.lang;

            $.ajax({
                url: url,
                method: "GET",
                dataType: 'json',
                processData:false,
                async: true,   // asynchronous request? (synchronous requests are discouraged...)
                cache: false,
                crossDomain: true,
                success: processResult,
                error: function(xhr, status, error){
                    //var err = eval("(" + xhr.responseText + ")");
                    console.log(error.Message);
                    console.warn(xhr.responseText);
                    cb(false);
                },
                complete: function (data) {
                    //alert(data.responseText);
                },
            });

        }catch (ex) {
            console.log();
        }

    }


}
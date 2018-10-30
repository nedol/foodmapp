export {GetIDData};

import {d2d_map} from "../user_entry";
import {GetObjId} from "../utils/utils";
import {areasAr} from "./import";

function GetIDData(cat, area_str,latlng,level, cb ) {

    function processResult(res) {

        // var res = $.grep($(res), function (el, i) {
        //     return el.object === 'object'
        // });

        if (res.length > 0) {

            var markerArr = jQuery.makeArray();
            var htmlArr = jQuery.makeArray();
            for (var i = 0; i < res.length; i++) {
                var obj = res[i];

                if (obj.area) {
                    areasAr.push(obj.area);
                    continue;
                }

                cat = obj.category;
                switch (obj.ctype) {
                    case '1':
                        obj.func = 'InsertAudio';
                        break;
                    case '2':
                        obj.func = 'InsertImage';
                        break;
                    case '0':
                    case '4':
                    case '6':
                        obj.func = 'InsertIFrame';
                        break;
                    case '8'://regional categories
                        continue;//TODO
                }

                if (obj.url)
                    obj.caption = "<a href='#'  onclick=OpenNewWindow('" + obj.url.toString() + "','" + obj.title + "');>" + obj.title + "</a>";

                else
                    obj.caption = (obj.title ? obj.title : '');

                if (obj.logo) {
                    //var id_str = GetObjId(obj.latitude,obj.longitude);
                    obj.logo = "data:image/*;base64," + obj.logo;
                }

                if(obj.ctype==4/*web*/) {
                    addToArr(htmlArr, obj);

                }else {
                    addToArr(markerArr, obj);
                }
            }

            if(markerArr.length>0)
                d2d_map.SetMarkersArExt(cat, markerArr);
            if(htmlArr.length>0)
                d2d_map.SetMarkersArExt(cat, htmlArr);

        }
        cb(true);
    }

    function addToArr(jsAr,obj) {

        jsAr.push({
            owner: obj.owner,
            id: GetObjId(parseFloat(obj.latitude),parseFloat(obj.longitude)),
            url: obj.url,//.replace("http","https"),
            category: obj.category,
            level: obj.level,
            type: obj.ctype,
            func: obj.func,
            caption: obj.caption,
            title: obj.title,
            longitude: parseFloat(obj.longitude),
            latitude: parseFloat(obj.latitude),
            ambit: obj.ambit,
            scale: 0.3,
            status: '1',
            logo: obj.logo,
            owner: obj.owner,
            owner_email: obj.owner_email,
            overlay: obj.overlay
        });




    }


try{
     var url = http+host_port+'/?'+ //
        "proj=id"+
        "&func=import_data"+
        "&areas="+area_str+
        "&lang="+window.sets.lang;
    /*   fetch( url )
        .then(function (resp) {
            return resp.json()
        })
        .then(function (json) {
            processResult(json);
        });*/

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


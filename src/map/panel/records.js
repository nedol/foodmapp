export {InitRecords};

var recordsAr = $.makeArray();

function InitRecords() {

    var temp = JSON.parse(localStorage.getItem("records"));
    if(temp) {
        recordsAr = recordsAr.concat(temp);
    }else{
        recordsAr[0] = {'up_date':JSON.stringify($.now())};
        localStorage.setItem("records", JSON.stringify(recordsAr));
    }

};

function AddToRecords(obj){

    console.log('AddToRecords');
    if(obj.id) {
        if(localStorage.getItem(obj.id)) {
            if($.inArray(obj.id,recordsAr)===-1)
                recordsAr.push(obj.id);
        }else{
            localStorage.setItem(obj.id, JSON.stringify(obj));
        }

        recordsAr[0] = {'up_date':JSON.stringify($.now())};
        localStorage.setItem("records", JSON.stringify(recordsAr));

        if($('#container').hasScrollBar()){
            $('#panel').css('pointer-events','initial');
        }
    }
}

function OnOpenRecords(){

    $("#panel_title").find('h2').text('My Records');

    var cur_coor = ol.proj.toLonLat(coords.cur);

    function sortByDistance(a, b){
        var obj_1 = JSON.parse(localStorage.getItem(a.hash));
        var obj_2 = JSON.parse(localStorage.getItem(b.hash));
        if(!obj_1 || !obj_2)
            return;
        if(getDistanceFromLatLonInKm(cur_coor[1],cur_coor[0],obj_1.latitude,obj_1.longitude) <
            getDistanceFromLatLonInKm(cur_coor[1],cur_coor[0],obj_2.latitude,obj_2.longitude))
            return -1
        else
            return 1;
    }
    recordsAr.sort(sortByDistance);

    $('#panel').find('.panel_img').attr('src','./images/ic_mic_list.png');

    if(!$('#panel').is(':visible')) {

        var cnt = 0;
        var ar =  $.merge([], recordsAr);

        function Recurs(ar) {
            if(ar.length<=0) {

                $('#cnt').css('visibility', 'visible');
                $('#cnt').text("("+cnt+")");
                return;
            }
            var obj_id =  ar.shift();
            var obj = localStorage.getItem(obj_id);
            if (obj) {
                obj = JSON.parse(obj);
                window.db.getFile(MD5(obj.id), function (res) {
                    if (res !== -1) {
                        cnt++;
                        BuildRecords(obj, res.data);
                    }
                    Recurs(ar);
                });

            }else if(ar.length>0){
                Recurs(ar);
            }
        }
        Recurs(ar);

        if($('#menu_items').is(':visible'))
            $('#menu_items').slideToggle('slow',function () {
                $("#panel").animate({width: 'toggle'}, 300, null,function () {
            });
        });

    }else{
        CloseRecords();
    }
}

function CloseRecords() {
    if($('#panel').is(':visible')) {
        $('#container').empty();
        $("#panel").animate({width: 'toggle'}, 300);
    }
}

function BuildRecords(obj, data) {

    var item = $('.audio_item').eq(0);
    var newDiv = $(item).clone();
    newDiv.css('display', 'block');
    newDiv.appendTo($('#container'));
    var title = $(newDiv).find('.title');
    $(title).text(obj.caption);
    $(title).on('input', function () {
        var obj_0 = JSON.parse(localStorage.getItem(obj.hash));
        obj_0.caption = $(this).text();
        localStorage.setItem(obj.hash,JSON.stringify(obj_0));
    });

    $(title).focusout( function () {
        $(this).attr('contenteditable','false');
    });

    if(obj.logo_data)
        $(newDiv).find('.logo').attr('src',obj.logo_data);
    else
        $(newDiv).find('.logo').attr('src','..src/categories/images/ic_0.png"');

    $(newDiv).find('audio').attr('src',data);
    $(newDiv).find('audio').attr('id', obj.hash);
    $(newDiv).find('audio').css('width', '130');
    $(newDiv).css("cursor","pointer");

    var locate = ol.proj.fromLonLat([obj.lon, obj.lat]);
    $(newDiv).find('.logo').attr('locate', JSON.stringify( locate ));

    if(IsLogin())
        $(newDiv).find('.share').css('display','table-cell');

}


function OnClickAudioLogo(el){
    var obj = JSON.parse($(el).attr('locate'));
    view.animate({
        center: [obj[0],obj[1]],
        duration: 1000
    }, function () {
        Marker.overlay.setPosition( [obj[0],obj[1]])
    });
}

function OnClickShare(el){
    OpenShareDialog($(el).parent()[0].innerHTML);
}

function MakeEditable(el) {
    $(el).attr('contenteditable','true');
}


function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("hash", ev.target.id);
    ev.dataTransfer.setData("element", this);
}

function drop(ev) {
    ev.preventDefault();
}

function ShareRecord() {

    try {

        var url = http + host + "/php/export/share.php";

        var formData = new FormData();
        //var bl = localStorage.getItem("favourites");
        var str = $.makeArray();
        if(buckList) {
            for(var val in buckList) {
                if(localStorage.getItem(buckList[val]))
                    str.push(JSON.stringify(localStorage.getItem(buckList[val])));
                else
                    str.push(JSON.stringify(buckList[val]));
            }
            formData.append("bl", JSON.stringify(str));
        }
        if(photosAr!=='undefined')
            formData.append("pl",JSON.stringify(photosAr));

        formData.append("sid",uObj.sid);

        formData.append("XDEBUG_SESSION_START","PHPSTORM");

        $.ajax({
            url: url,
            method: "POST",
            dataType: 'json',
            // headers: {"access-control-allow-origin": "some value"},
            data:formData,
            contentType: false,
            cache: false,
            processData: false,
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: function (data) {
                if(data) {
                    for(var i=0; i<data.length; i++) {
                        if (data[i].bl) {
                            var str = data[i].bl;
                            buckList = JSON.parse(str);
                            //buckList = $.merge( bl, buckList);
                            localStorage.setItem("favourites", JSON.stringify(buckList));
                        }
                        if (data[i].pl) {
                            var str = data[i].pl;
                            photosAr = JSON.parse(str);
                            localStorage.setItem("photos", JSON.stringify(photosAr));
                        }
                        if (data[i].msg)
                            console.log(data[i].msg);


                    }
                }
            },
            error: function (xhr, status, error) {
                //var err = eval("(" + xhr.responseText + ")");
                console.log(error.Message);
            },
            complete: function (data) {
                console.log(data.responseText);
            },
        });

    }catch(ex){
        console.log(ex);
    }
}
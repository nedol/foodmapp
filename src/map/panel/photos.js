export {InitPhotos};
var photosAr = [];

function InitPhotos() {

    var temp = JSON.parse(localStorage.getItem("photos"));
    if(temp) {
        photosAr = photosAr.concat(temp);
    }else{
        photosAr[0] = {'up_date':JSON.stringify($.now())};
        localStorage.setItem("photos", JSON.stringify(photosAr));
    }

}

function AddToPhotos(obj){

    if(obj.id) {
        if(localStorage.getItem(obj.id)) {
            if($.inArray(obj.id,photosAr)===-1)
                photosAr.push(obj.id);
        }else{
            localStorage.setItem(obj.id, JSON.stringify(obj));
        }

        photosAr[0] = {'up_date':JSON.stringify($.now())};
        localStorage.setItem("photos", JSON.stringify(photosAr));

    }
}

function OnOpenPhotos(el){

    $("#panel_title").find('h2').text('My Photos');

    var cur_coor = ol.proj.toLonLat(coords.cur);

    function sortByDistance(a, b){

        var obj_1 = JSON.parse(localStorage.getItem(a));
        var obj_2 = JSON.parse(localStorage.getItem(b));
        if(!obj_1 || !obj_2)
            return;
        if(getDistanceFromLatLonInKm(cur_coor[1],cur_coor[0],obj_1.latitude,obj_1.longitude) <
            getDistanceFromLatLonInKm(cur_coor[1],cur_coor[0],obj_2.latitude,obj_2.longitude))
            return -1
        else
            return 1;
    }
    photosAr.sort(sortByDistance);

    if(!$('#panel').is(':visible')) {

        $('#panel').find('.panel_img').attr('src','./images/ic_photo_list.png');
        var cnt = 0;
        var ar =  $.merge([], photosAr);

        function Recurs(ar) {
            if(ar.length<=0) {

                $('#cnt').css('visibility', 'visible');
                $('#cnt').text("("+cnt+")");

                $( "#sortable1" ).sortable().disableSelection();

                return;
            }
            Recurs(ar);

            var obj_hash =  ar.shift();
            var obj = localStorage.getItem(obj_hash);
            if (obj) {
                obj = JSON.parse(obj);
                if(obj.status>0) {
                    window.db.getFile(MD5(obj.id), function (res) {
                        if (res !== -1) {
                            cnt++;
                            BuildPhotos(obj, res.data);
                        }
                        Recurs(ar);
                    });
                }
            }else if(ar.length>0){
                Recurs(ar);
            }
        }

        if($('#menu_items').is(':visible'))
            $('#menu_items').slideToggle('slow',function () {
                $("#panel").animate({width: 'toggle'}, 300, null,function () {
                });
            });

        setTimeout(function () {
            if($('#container').hasScrollBar()){
                $('#panel').css('pointer-events','initial');
            }
        },100);



    }else{
        ClosePhotos();
    }
}

function ClosePhotos() {
    if($('#panel').is(':visible')) {
        $('#container').empty();
        $("#panel").animate({width: 'toggle'}, 300,null,function () {
            console.log();
        });
    }
}

function BuildPhotos(obj, data) {

    var item = $('.image_item').eq(0);
    var newDiv = $(item).clone();
    newDiv.css('display', 'block');

    var photo = $(newDiv).find(".photo").eq(0);
    photo.attr('src', data);
    photo.attr('id', obj.id);
    photo.attr('width', '120');
    photo.attr('height', 'auto');
    photo.css("cursor","pointer");
    //photo.css("z-index",'15');

    var locate = ol.proj.fromLonLat([obj.longitude, obj.latitude]);

    photo.attr('locate', JSON.stringify( locate ));
    //photo.html("<a href='#'  onclick='OnClickPhoto("+JSON.stringify(locate)+");'></a>");

    var title = $(newDiv).find(".title").eq(0);
    title.text(obj.caption);
    $(title).on('input', function () {
        var obj_0 = JSON.parse(localStorage.getItem(obj.hash));
        obj_0.caption = $(this).text();
        localStorage.setItem(obj.hash,JSON.stringify(obj_0));
    });

    $(title).focusout( function () {
        $(this).attr('contenteditable','false');
    });

    newDiv.appendTo($('#container'));

}

function OnClickPhoto(el) {

    var obj = JSON.parse($(el).attr('locate'));
    view.animate({
        center: [obj[0],obj[1]],
        duration: 1000
    }, function () {
        Marker.overlay.setPosition( [obj[0],obj[1]])
    });

    // OpenNewWindow(el.src,el.value);
}
function MakeEditable(el) {
    $(el).attr('contenteditable','true');
}


function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    console.log('drag start');
    ev.dataTransfer.setData("hash", ev.target.id);
    ev.dataTransfer.setData("element", this);
}

function drop(ev) {
    ev.preventDefault();
    var hash = ev.dataTransfer.getData("hash");
    if(ev.target.className === 'share') {
        Share(hash);
    }
    else if(ev.target.className === 'delete') {
        var img = document.getElementById(hash);
        $('#container').find($(img).parent()).remove();
        //Delete(data);
    }
}

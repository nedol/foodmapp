// import

var IsAnimate = true;
var interupt, processResult;
var cur_div;
var dnld_timeout, final_timeout;
var screenY;
var up_down;
var isStopPlaying;
var lang = 'en';

var mObjectAr = jQuery.makeArray();
var mAudioAr = jQuery.makeArray();

if (localStorage.getItem("lang")) {
    lang = localStorage.getItem("lang");
}

document.onreadystatechange = function(){
    if(document.readyState === 'complete'){
        //LoadPage_0('test');
    }
}

window.addEventListener('error', function(e) {
    var ie = window.event || {};
    var errMsg = e.message || ie.errorMessage || "404 error on " + window.location;
    var errSrc = (e.id || ie.errorUrl) + ': ' + (e.lineno || ie.errorLine);
    //alert(errMsg+errSrc);
}, true);

$( document ).ready( function(){

});

$( document ).ajaxError(function(jqXHR,  textStatus, errorThrown) {
    console.log(JSON.stringify(jqXHR));
    console.log("AJAX error: " + textStatus + ' : ' + errorThrown);
});

function ShowAlert(str){

    $("#span_alert").text(str);//.delay(3000);

}

function SoftInput(obj){

    try{

        $(':focus').val(obj.msg);

        //Alert($(':focus').toString());

    }catch(e){
        //Alert(e.toString());
    }
}



function CleanContent(){
    //jQuery('html,body').empty();
    location.reload();
}


function scrollToTop(element, callback){

    if(IsAnimate && element instanceof Object){
        ////ShowAlert(IsAnimate);
        $('html, body').stop().animate({
            scrollTop: $(element).offset().top
            ////scrollTop: $('#your-id').offset().top
            ////scrollTop: $('.your-class').offset().top
        }, 1300, 'swing', function() {
            //console.log("Finished animating"+$(element).offset().top);
            callback();
        });
    }
}

function scrollToBottom(element, callback){

    if(IsAnimate && element instanceof Object){
        $('html, body').stop().animate({
            scrollTop: $(element).offset().top - window.innerHeight + $(element).height()+25
        }, 1300,'swing',function(){
            callback();
        });
    }
}

function LoadingResource(obj){
    try{
        if(interupt!=="undefined")
            $("[isLoaded='false']").each(function(){
                clearTimeout($(this).attr('dnld_timeout'));
                $(this).attr('dnld_timeout',setTimeout(interupt.func, 7000));
                //ShowAlert(($(this).attr('dnld_timeout')));
            });
    }catch(ex){

    }
}


window.StopPlaying = function(){
    isStopPlaying = true;
    var audios = document.getElementsByTagName('audio');
    for(var i = 0, len = audios.length; i < len;i++){
        if(audios[i].getAttribute('id')!=="audio_0")
            if(audios[i].paused == false ){
                audios[i].pause();
            }
    }
}

function LoadPage_0 (caption){

    var obj =
        {
            'func':'InsertIFrame',
            'url':'http://nedol.ru',
            'id':'start_page',
            'caption':caption
        };

    var sAr= [];
    sAr.push(obj);

    InsertElements(sAr);
}


window.InsertElements = function(sAr){
    IsAnimate = true;
    try{
        //$("span").text("mAr.length:"+mAr.length);

        for (var i = 0; i < sAr.length;i++){
            if(sAr[i].type==='1')
                mAudioAr.push(sAr[i]);
            else
                mObjectAr.push(sAr[i]);

        }

        Dispatch();

        /*
         $.each( mImageAr, function( key, value ) {
         alert( key + ": " + value );
         });
         */

    }catch(ex){
        console.log(ex);
    }

}

function Dispatch() {

    if (mObjectAr.length > 0) {

        switch (mObjectAr[0].func) {
            case 'InsertIFrame':
                InsertIFrame(mObjectAr[0]);
                break;
            case 'InsertImage':
                InsertImage(mObjectAr[0]);
                break;
        }
    }

    if (mAudioAr.length > 0) {
        InsertAudio(mAudioAr[0]);
    }
}


var touchstart_func =  function(event){
    //$("span").text(" Y: " + event.originalEvent.touches[0].screenY);
    up_down = false;
    screenY = event.originalEvent.touches[0].screenY;
};

var touchmove_func =  function(event){

    if(up_down)
        return;

    if(screenY > event.originalEvent.touches[0].screenY){
        //$("span").text("tap up: screenY:"+screenY+" eventY:"+event.originalEvent.touches[0].screenY);
        up_down = "up";
    }else{
        up_down = "down";
        //$("span").text("tap down: screenY:"+screenY+" eventY:"+event.originalEvent.touches[0].screenY);

// Alert($("body").html());
        event.preventDefault();
        event.stopPropagation();
    }
    //$(newDiv).unbind('touchmove');

};

var touchend_func =  function(event){
    if(up_down==="down") {

        cur_div = $(cur_div).prev();// $(newDiv.prev());
        //$("span").text("down:"+$(cur_div).attr("id")+" "+($(cur_div).attr("id")==="img_container").toString());

        try {
            while (!jQuery.isEmptyObject($(cur_div))) {
                if ($(cur_div).find(".iframe").attr("isLoaded") == "true" ||
                    $(cur_div).find('.div_img').length>0 ||
                    $(cur_div).find('.div_audio').length>0
                ) {
                    $(cur_div).bind('touchmove', touchmove_func);
                    IsAnimate = true;
                    scrollToTop(cur_div, function () {

                    });
                    break;
                } else {
                    cur_div = $(cur_div).prev();
                    //$("span").text("prev:" + $(cur_div).attr("class").toString());
                    if ($(cur_div).attr("class") === null)
                        break;
                    if ($(cur_div).attr("id").toString() === "img_container")
                        break;
                }
            }
        } catch (ex) {

        }
    }else if(up_down==='up'){
        //$("span").text("up:"+$(cur_div).attr("id")+" "+($(cur_div).attr("id")==="img_container").toString());
    }
};


function InsertIFrame(obj_0){

    var newFrame ;

    try{

        $(".div_iframe").each( function( index, element) {
            //alert( "id:"+ $( element).attr( "id"));
            if($( element).attr( "id")===obj_0.id+"_container")
                $( element).remove();
        });

        var obj =  mObjectAr.shift();

        var if_0 = $('#iframe_container');
        var newDiv = $(if_0).clone();
        $(newDiv).attr( "id",obj_0.id+"_div");

        newFrame = $(newDiv).find(".timeline").eq(0);
        $(newFrame).attr( "id",obj_0.id+"_iframe");
///////////////////////////////////////////////////////////////////////////////////////////////////////////
        interupt = {
            func: function InteruptLoad() {
                if($(newFrame).width() != $(window).width() || $(newFrame).height != $(window).height()){
                    //$("span").text("1:"+dnld_timeout);
                    if( $(newFrame).attr('isLoaded')===false){
                        ////ShowAlert("2:"+$(newFrame).attr('isLoaded'));
                        $(newFrame).remove();
                    }

                    $(newDiv).find(".progress").attr('src',"./images/ic_no_preview.png");
                    clearTimeout(dnld_timeout);
                    clearTimeout(final_timeout);

                    if(typeof mObjectAr[0]!=='undefined') {
                        ////ShowAlert("length"+mIFrameAr.length+" mImageAr:"+mIFrameAr[0]);
                        InsertIFrame(mObjectAr[0]);
                    }
                }
            }
        }

        processResult  = {
            func: function processResult(data, textStatus, jqXHR) {

                clearTimeout(dnld_timeout);

                var content_len = 1;
                try {
                    if($($(this)[0]).contents())
                        content_len = $($(this)[0]).find('body>*').length;
                } catch (e) {
                    console.log("download error:"+e);
                }

                if (content_len <= 0) {

                    $(newDiv).find(".progress").attr('src', "./images/ic_no_preview.png");
                    $(newDiv).find('.div_iframe').eq(0).fadeOut(100);
                    $(newFrame).attr('isLoaded', false);
                    $(newImg).css('display', 'inline-block');
                    //alert("download error:"+e);
                    //HtmlViewer.IFrameLoad("");

                } else {
                    $(newFrame).height(window.innerHeight - 50);
                    $(newFrame).width(window.innerWidth - 20);
                    //alert("load:"+$(newFrame).attr('isLoaded'));
                    $(newDiv).find(".progress").remove();
                    $(newDiv).css('padding-bottom', '20px');
                    $(newDiv).find(".div_iframe").eq(0).css('display', 'block');
                    $(newDiv).find(".favourites").eq(0).attr('id', obj_0.id+"_favourites");
                    $(newDiv).find("#prev").on('click', function () {
                        window.history.back();
                    });

                    /*
                     $(newDiv).find("#scroll_div_right").on('tapmove', function(e){
                     //alert('tapmove'); work!

                     });*/

                    //$(newDiv).bind('touchstart',touchstart_func);
                    //$(newDiv).bind('touchmove',touchmove_func);
                    //$(newDiv).bind('touchend',touchend_func);

                    $(document).on('scroll', function (e) {
                        //$("span").text('scroll:'+$(newDiv).offset().top); //works
                        e.preventDefault();
                        e.stopPropagation();
                        //return false;
                    });


                    $('a[target="_blank"]').each(function () {
                        $(this).remove();
                    });

                    if ($(newFrame).attr('isLoaded') === 'false') {
                        IsAnimate = true;
                        scrollToTop($(newDiv).find(".title_div"), function () {

                            /*
                            var canvas = document.querySelector("canvas");
                            html2canvas(newFrame,
                                {
                                    canvas: canvas,
                                    logging: true, //Enable log (use Web Console for get Errors and Warnings)
                                    proxy:"../../php/utils/html2canvasproxy.php"
                                }).then(function(canvas) {
                                console.log('Drew on the existing canvas');
                                var img = new Image();
                                img.onload = function() {
                                    this.onload = null;
                                    //TODO document.body.appendChild(this);
                                };
                                img.onerror = function() {
                                    img.onerror = null;
                                    if(window.console.log) {
                                        window.console.log("Not loaded image from canvas.toDataURL");
                                    } else {
                                        alert("Not loaded image from canvas.toDataURL");
                                    }
                                };
                                var data = canvas.toDataURL("image/png");
                                img.src = data;
                            });*/
                            // var node = document.getElementsByClassName('timeline')[0];
                            // domtoimage.toPng(node)
                            //     .then(function (dataUrl) {
                            //         var img = new Image();
                            //         img.src = dataUrl;
                            //         document.body.appendChild(img);
                            //     })
                            //     .catch(function (error) {
                            //         console.error('oops, something went wrong!', error);
                            //     });
                        });
                    }

                    $(newFrame).attr('isLoaded', true);

                }

                //ShowAlert(" mIFrameAr:"+mIFrameAr[0]);
                if (typeof mObjectAr[0] !== 'undefined') {
                    ////ShowAlert("length"+mIFrameAr.length+" mImageAr:"+mIFrameAr[0]);
                    InsertIFrame(mObjectAr[0]);
                }
            }
        }

        clearTimeout(dnld_timeout);
        dnld_timeout = setTimeout(interupt.func, 5000);
        $(newFrame).attr('dnld_timeout',dnld_timeout);
        final_timeout = setTimeout(interupt.func, 10000);

        if(obj.id){

            var title_text = $(newDiv).find(".title")[0];
            $(title_text).html(obj.caption);

            $(newDiv).css('display',"block");
            $(newDiv).attr('id', obj.id+"_container");
            $(newDiv).attr('class', "container");


            //newFrame.style="-webkit-transform:scale(1.0);-moz-transform-scale(0.5);" ;
            $(newFrame).css( '-webkit-transform','scale(1.0)');
            $(newFrame).attr('id', obj.id);

            $(newFrame).attr('frameBorder',"0");
            //$(newDiv).find('.progress').eq(0).attr('id','progress_active');
            $(newFrame).attr('isLoaded',false);

            $('#bottom').before($(newDiv));
            $(newDiv).after('<div style=\"display: block; height: 10px\"></div>');
            cur_div = $(newDiv);
            //  Title

            try {

                if((obj.url.includes("https://") || obj.url.includes("../"))
                    && obj.status!=='3'
                    && !obj.url.includes("facebook.")
                    && !obj.url.includes("vk.com")) {
                    $(newFrame).attr('src', obj.url);//http==='https://'? obj.url.replace("http://","https://"):obj.url);
                    $(newFrame).on('load', processResult.func);
                }else {
                    $.ajax({
                        url: obj.url.replace("http:", location.protocol),
                        method: "GET",
                        dataType: 'jsonp',
                        crossDomain: true,
                        timeout: 5000,
                        // headers: request_headers,
                        success: function () {
                            $(newFrame).attr('src', obj.url.replace("http:", location.protocol));//http==='https://'? obj.url.replace("http://","https://"):obj.url);
                            $(newFrame).on('load', processResult.func);
                        },
                        error: function (parsedjson) {
                            if (parsedjson.status == "200") {
                                $(newFrame).attr('src', obj.url.replace("http:", location.protocol));//http==='https://'? obj.url.replace("http://","https://"):obj.url);
                                $(newFrame).on('load', processResult.func);
                            } else {
                                // Handle error
                            }
                        }
                    });
                }

                //var win = window.frames.target;
                //$(newFrame).eq(0).html('<object id="browser" type="text/html" data='+obj.url+'  width="100%" height="100%" ></object>');
            }catch (ex){
                console.log(ex);
            }

            scrollToBottom(title_text, function(){

                while($('.container').size()>30){
                    $( "body" ).find('.container').eq(0).remove();
                }

                while($('[isLoaded=true]').size()>5){

                    $( "body" ).find( "[isLoaded=true]").eq(0).parent().find("#scroll_div_right").remove();
                    $( "body" ).find( "[isLoaded=true]").eq(0).parent().find("#scroll_div_left").remove();
                    $( "body" ).find( "[isLoaded=true]").eq(0).remove();
                }
            });

        }

        ////////////////////////////////////////////////////////////////////////////////////////

        var imgOwner = $(newDiv).find(".owner_logo").eq(0);
        if(obj.owner === "google places"){
            //alert("owner:"+obj.owner);
            $(imgOwner).attr('src', "./images/google.png");

        }else if(obj.owner === 'osm'){
            //alert("owner:"+obj.owner);
            $(imgOwner).attr('src', "./images/osm_logo.png");
        }else if(obj.owner === 'wikipedia'){
            //alert("owner:"+obj.owner);
            $(imgOwner).attr('src', "./images/wiki_logo.png");
        }

        $(imgOwner).css("visibility","visible");

        var newImg = $(newDiv).find(".favourites").eq(0);

        $(newImg).click( function() {
            ////ShowAlert('click favourites');
            //HtmlViewer.DeployAudio(audio.userId,audio.fileId,audio.url,audio.hash);
            $(newImg).attr('src','../images/ic_heart_red.png');
            window.parent.AddToFavourites(obj.id);
        });


        ////////////////////////////////////////////////////////////////////////////////////////

        var onscroll_event = false;

        ////////////////////////////////////////////////////////////////////////////////////////////////////

        if(typeof $(newFrame).attr('src')==="undefined" || $(newFrame).attr('src')===""){

            if(typeof mObjectAr[0]!=='undefined') {
                ////ShowAlert("length"+mIFrameAr.length+" mImageAr:"+mIFrameAr[0]);
                InsertIFrame(mObjectAr[0]);
            }
            return;
        }

    }catch(ex){
        $(newFrame).remove();
        if(typeof mObjectAr[0]!=='undefined') {
            //ShowAlert("Ex:"+ex);
            //InsertIFrame(mIFrameAr[0]);
        }
    }
}



function InsertImage(img_0){
    try{

        var img = jQuery.extend(true, {}, img_0);

        mObjectAr.shift();

        ////ShowAlert(obj.hash);
        var if_0 = $('#img_container');
        var newDiv = $(if_0).clone();
        $(newDiv).css('display',"block");
        $(newDiv).attr('id', img.id+"_container");
        $(newDiv).attr('class', "container");
        $(newDiv).find('.progress').attr('id','progress_active');

        var newImg = $(newDiv).find('#img_0');
        ////ShowAlert(obj.url);

        window.parent.db.getFile(MD5(img.id), function (res) {
            if(res!==-1) {
                $(newImg).attr('src', res.data);
            }else{
                $.ajax({
                    url: http+host+"/php/get_file.php?url="+img.url+"hash="+img.id+"&table=photos&XDEBUG_SESSION_START=PHPSTORM",
                    type: "GET",
                    processData:false,
                    async: true,   // asynchronous request? (synchronous requests are discouraged...)
                    cache: false,   // with this, you can force the browser to not make cache of the retrieved data
                    dataType: "text",
                    success: function (data) {
                        var img = JSON.parse(data);
                        $(newImg).attr('src', img.content);
                    },//,dataType: "json"
                    error: function(){
                        console.log();
                    },
                    complete: function (data) {
                        //alert(data.responseText);
                    },
                });
            }
        });

        //$(newImg).attr('src', img.url);

        $(newImg).attr('id',img.id);
        $(newImg).attr('width', '100%');
        $(newImg).attr('height', '100%');

        $('#bottom').before($(newDiv));

        $(newDiv).after('<div style=\"display: block; height: 10px\"></div>');

        cur_div = $(newDiv);

        if(!$.fn.isEmpty(img.id)){

            var title_text = $(newDiv).find(".title")[0];
            $(title_text).html(img.caption);
            $(title_text).on('input', function () {
                var obj = JSON.parse(localStorage.getItem(img.id));
                obj.caption = $(this).text();
                localStorage.setItem(img.id,JSON.stringify(obj));
            });

            var poiImg = $(newDiv).find(".favourites");
            if(img.class != 'msg_assist' && img.class!='photo'){
                $(poiImg).attr('id', img.id);
            }else{
                $(poiImg).hide();
            }

            //scrollToBottom(title_text);
        }

        var dnld_timeout = setTimeout( function() {

            if($(newImg).width() != $(window).width() || $(newImg).height != $(window).height()){

                $(newImg).remove();
                $(newDiv).find("#progress_active").remove();
            }

            if(mObjectAr[0]) {
                Dispatch();
            }else{
                clearTimeout(dnld_timeout);
            }

        }, 10000);

        //clearTimeout(dnld_timeout);//DEBUG

        $(newDiv).find(".favourites").eq(0).attr('id',img.id);

        $(newImg).on('load',function() {

            clearTimeout(dnld_timeout);

            $(newDiv).find("#progress_active").remove();

            var img = new Image();
            img.src = $(newImg).attr('src');
            img.onload = function () {
                var w = this.width;
                var h = this.height;
                $(newImg).width($(newImg).parent().width());

                //$(newImg).removeAttr('width');
                $(newImg).height(h*($(newImg).width()/w));

                // newImg = loadImage.scale(
                //     img, // img or canvas element
                //     {maxWidth: $(newImg).parent().width()}
                // );

                scrollToTop($(newImg), function () {

                });

                if(mObjectAr[0]) {
                    Dispatch();
                }

            }

            $(newDiv).css('padding-bottom','20px');

            scrollToTop(newDiv, function () {

            });

            //$(newDiv).bind('touchstart',touchstart_func);
            //$(newDiv).bind('touchmove',touchmove_func);
            //$(newDiv).bind('touchend',touchend_func);

            //HtmlViewer.IFrameLoad(this.id);
        });

    }catch(e){
        //ShowAlert(e.toString());
    }
    //  Title

}

function InsertAudio(audio){
    //var audio = jQuery.extend(true, {}, audio);
    var audio = mAudioAr.shift();
    audio = jQuery.extend(true, {}, audio);

    var audio_div = document.getElementById('audio_container');
    var newDiv = audio_div.cloneNode(true);

    $(audio_div).attr('id','div_'+audio.id);
    //$(audio_div).attr('class', audio.class);
    $(newDiv).find(".favourites").eq(0).attr('id',audio.id);

    $(newDiv).css('display','block');
    $('#bottom').before($(newDiv));
    $(newDiv).after('<div style=\"display: block; height: 10px\"></div>');

    var donate = $(newDiv).find('.donate');
    if(audio.owner_email){
        $(donate).css("display","block");
        $(donate).attr("owner_email",audio.owner_email);
        $(donate).attr("owner",audio.owner);
    }

    if(!$.fn.isEmpty(audio.id)){

        var title_text = $(newDiv).find(".title")[0];
        $(title_text).html(audio.caption);

        scrollToBottom(title_text, function () {

        });
    }

    try{
        var player = $(newDiv).find("audio");

        window.parent.db.getFile(MD5(audio.id), function (res) {
            if(res==-1)
                $(player).attr('src', audio.url);
            else
                $(player).attr('src', res.data);
        })

        //var canPlayOgg = !!audio.canPlayType && audio.canPlayType('audio/ogg; codecs="vorbis"') != "";

        $(player).attr('class', 'audio_player');
        $(player).attr('id','audio_player_'+audio.id);
        ////ShowAlert("IsPlaying():"+IsPlaying().toString(16));

        $(player).on('loadeddata', function () {
            if (IsPlaying() === 0) {
                if($(this).attr('id')=== $(player).attr('id'))
                    $(this).trigger('play', true);
                // $(player).prop('autoplay',true);
            }
            if(mAudioAr[0]) {
                ////ShowAlert("length"+mIFrameAr.length+" mImageAr:"+mIFrameAr[0]);
                InsertAudio(mAudioAr[0]);
            }
        });

        $(player).on('play', function () {
            //$(this).delay(1000);
            IsAnimate = true;
            isStopPlaying = false;

            scrollToTop($(newDiv).find(".title"), function () {
                
            });

        });

        $(player).on('canplay', function () {

            $(newDiv).find(".progress").remove();
            $(newDiv).bind('touchstart', touchstart_func);
            $(newDiv).bind('touchmove', touchmove_func);
            $(newDiv).bind('touchend', touchend_func);

            var favourites = $(newDiv).find('.favourites');
            $(favourites).css('visibility', 'visible');
            $(favourites).click(function () {
                $(favourites).attr('src','../images/ic_heart_red.png');
                window.parent.AddToFavourites(audio.id);
                window.parent.db.getFile(MD5(audio.id), function (res) {
                    if(res===-1){
                        // jQuery.get(audio.url,//http+host + "/php/get_file.php?url="+audio.url+ "&hash=" + audio.hash + "&table=records_" + lang + "&XDEBUG_SESSION_START=PHPSTORM",
                        //     function (data) {
                        //         if (data) {
                        //             AddToFavourites(audio.hash);
                        //             setFile({hash: audio.hash, data: "data:audio/mp3;base64," + data});
                        //             var item = JSON.parse(localStorage.getItem(audio.hash));
                        //             item.status = '1';
                        //             var str = JSON.stringify(item);//JSON.stringify()
                        //             localStorage.setItem(audio.hash, str);
                        //         }
                        //     },
                        //     'text');
                        $.ajax({
                            url: http+ host + "/php/get_file.php?url="+audio.url+"&XDEBUG_SESSION_START=PHPSTORM",
                            type: "GET",
                            processData: false,
                            async: true,   // asynchronous request? (synchronous requests are discouraged...)
                            cache: false,   // with this, you can force the browser to not make cache of the retrieved data
                            dataType: "text",
                            headers: {"Access-Control-Request-Method": "GET",
                                      "Access-Control-Request-Headers": "Content-Type"},
                            success: function (data) {
                                if(data) {
                                    window.db.setFile({id: audio.id, data: "data:audio/mp3;base64," + data});
                                    var item = JSON.parse(localStorage.getItem(audio.id));
                                    item.status = '1';
                                    var str = JSON.stringify(item);//JSON.stringify()
                                    localStorage.setItem(audio.id, str);
                                }

                            },//,dataType: "json"
                            error: function (xhr, status){
                                if(xhr.responseText) {

                                }
                            },
                            complete: function (data) {
                                if(data.responseText) {
                                    //setFile({hash: audio.hash, data: "data:audio/mp3;base64,"+data.responseText});
                                }
                                console.log();
                            },
                        });
                    }else{

                        var item = JSON.parse(localStorage.getItem(audio.id));
                        item.status = '1';
                        var str = JSON.stringify(item);//JSON.stringify()
                        localStorage.setItem(audio.id,str);
                    }
                });

            });

        });

        $(player).on('pause', function () {
            //ShowAlert('pause');
            // if(!IsPlaying())
            //     PlayNext($(this));

        });

        $(player).on('error', function (error) {
            //ShowAlert(error.code);
            $(newDiv).find(".progress").remove();
            //PlayNext($(this));
            //IsPlaying();
        });

        $(player).on('ended', function () {
            console.log("audio onended");
            PlayNext($(this));
            IsPlaying();
        });

        $(player).on('abort', function () {
            //$(this).next().trigger('play');
        });

        $(player).on('suspend', function () {
        });

        $(player).on('stalled', function () {

        });

        $(donate).on('click',  function() {
            ////ShowAlert('click favourites:'+audio.hash);
            //HtmlViewer.DeployAudio(audio.userId,audio.fileId,audio.url,audio.hash);

            Donate($(this).attr('owner'),$(this).attr('owner_email'));
        });

        //scrollTo(bottom);
        /*
         $("#"+audio.fileId).ready(function(){
         $("#first_div").fadeOut();
         });*/

    }catch(e){
        ShowAlert(e.toString());
    }
}

function IsPlaying() {
    var isPlaying = 0;
    var audios = document.getElementsByTagName('audio');
    for (var i = 0, len = audios.length; i < len; i++) {
        if (audios[i].getAttribute('id') !== "audio_0")
            if (audios[i].paused == false || audios[i].autoplay) {
                isPlaying++;
            }
    }
    return isPlaying;
}

function PlayNext(el) {

    var index = $('.audio_player').index($(el));
    var next = $('.audio_player')[index + 1];
    ////ShowAlert($(next).prop("tagName").toString());
    if ($(next).attr("class") === "audio_player")
        $(next).trigger('play');
}

function OpenNewWindow(event, str, title){

    window.open(event, str, "width=300, height=300");
    //event.preventDefault();
    scrollToBottom($('#bottom'), function () {

    });
}

function Donate(owner, email){
    var cur = 'RUB';
    if(lang=="en"){
        cur = "USD";
    }
    var url =
        //"http://a07513cy.bget.ru/travelnotes/php/donation.en.php?email="+email+"&lang=EN";
        "https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business="+email+"&"
        + "lc="+lang+"&item_name=InfoDesk&no_note=0&currency_code="+cur+"&"
        + "bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHostedGuest";

    window.open(url, owner, "width=500, height=500");
    //event.preventDefault();
    scrollToBottom($('#bottom'), function () {

    });
}
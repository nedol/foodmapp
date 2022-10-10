export {InitEvents};

function InitEvents(){

        $(window).on("orientationchange", function (event) {

            console.log("the orientation of the device is now " + screen.orientation.angle);
        });

        // When the user clicks anywhere outside of the modal, close it
        $(window).on('click', function (event) {
            console.log();
        });

        $('.close').on('click', function () {
            $('#settings_modal').css('display', 'none');
            $('#auth_modal').css('display', 'none');
        });

        $('.close_browser').on('touchstart', function (ev) {
            $(this).parent().css('display', 'none');
            $('.browser')[0].contentWindow.postMessage({func:'StopPlaying'},'*');
        });


        $('.close_browser').on('click', function (ev) {
            $(this).parent().css('display', 'none');
            $('.browser')[0].contentWindow.postMessage({func:'StopPlaying'},'*');
        });

        $(".move_browser").mousedown(function () {
            $(this).data("move", true);
        });

        $(".move_browser").mouseup(function () {
            $(this).data("move", false);
        });

        $(window).mousemove(function (e) {


        });

        $(".move_browser").on('touchstart', function (e) {
            $(this).data("move", true);
        });

        $(".move_browser").on('touchend', function (e) {
            $(this).data("move", false);
        });

        $(".move_browser").on('touchmove', function (e) {

        });

        $(".resize_browser").on('touchstart', function () {
            $(this).data("resize", true);
        });

        $(".resize_browser").on('touchend', function () {
            $(this).data("resize", false);
        });

        $(".resize_browser").on('touchmove', function (e) {
            if (!$(this).data("resize"))
                return;

            $(this).parent().css("width", parseInt(e.originalEvent.changedTouches["0"].clientX)
                - parseInt($(this).parent().css("left")) + $(this).width() / 2);

            $(this).parent().css("height", e.originalEvent.changedTouches["0"].clientY + $(this).height() / 2
                - parseInt($(this).parent().css("top")));
            localStorage.setItem("browser_w_h",
                JSON.stringify({
                        width: e.originalEvent.changedTouches["0"].clientX - $(this).width() / 2,
                        height: e.originalEvent.changedTouches["0"].clientY + $(this).height() / 2 - parseInt($(this).parent().css("top"))
                    }
                ));
        });

        $(".resize_browser").mousedown(function () {
            $(this).data("resize", true);
        });

        $(".resize_browser").mouseup(function () {
            $(this).data("resize", false);
        });

        $('body').on("mousemove",function (e) {
            if (!$(".resize_browser").data("resize"))
                return;
            $(".resize_browser").parent().css("width", e.clientX - parseInt($(".resize_browser").parent().css("left")) + $(".resize_browser").width() / 2);
            $(".resize_browser").parent().css("height", e.clientY + $(".resize_browser").height() / 2 - parseInt($(".resize_browser").parent().css("top")));
            localStorage.setItem("browser_w_h",
                JSON.stringify({
                    width: e.clientX ,
                    height: e.clientY - parseInt($(".resize_browser").parent().css("top"))
                }));
            console.log("Body X:"+e.clientX+" "+"Y:"+e.clientY+" ");
        });

        // $("body").mousemove(function (e) {
        //     if (!$(this).data("resize"))
        //         return;
        //     $(this).parent().css("width", e.clientX - parseInt($(this).parent().css("left")) + $(this).width() / 2);
        //     $(this).parent().css("height", e.clientY + $(this).height() / 2 - parseInt($(this).parent().css("top")));
        //     localStorage.setItem("browser_w_h",
        //         JSON.stringify({
        //             width: e.clientX - $(this).width() / 2,
        //             height: e.clientY + $(this).height() / 2 - parseInt($(this).parent().css("top"))
        //         }));
        //     console.log("Body X:"+e.clientX+" "+"Y:"+e.clientY+" ");
        // });


};


// WEBPACK FOOTER //
// rtc/events.js
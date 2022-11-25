
// import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';

// const EventSource = NativeEventSource || EventSourcePolyfill;
// // OR: may also need to set as global property
// window.EventSource =  NativeEventSource || EventSourcePolyfill;

$(document).on('readystatechange', function () {

    if (!window.EventSource) {
        window.alert('В этом браузере нет поддержки EventSource.');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }

    $(window).on('load', () => {
        let iOSdevice = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)
        if (iOSdevice)
            $('[role="tablist"] .nav-link').each((i,e) => {
                if (!$(e).attr('href'))
                    $(e).attr('href', $(e).data('target'))
            })
    })

    window.InitFoodtruckOrder = function (data, targ_title) {
        window.ft_oder = new FoodtruckOrder(data);
        window.ft_oder.openFrame(data,targ_title, function () {

        });

        window.cus_oder.InitRating();
    };
});

export class FoodtruckOrder{

    constructor(data){
        this.data = data;
    }
}
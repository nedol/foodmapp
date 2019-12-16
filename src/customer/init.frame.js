'use strict'
export {OfferOrder}

var urlencode = require('urlencode');

require('webpack-jquery-ui/draggable');

require('webpack-jquery-ui/css');
require('jquery-ui-touch-punch');


// require('bootstrap/dist/css/bootstrap.css');
// require('font-awesome/css/font-awesome.css');



const langs = require("../dict/languages");


import {utils} from "../utils/utils";


class OfferOrder {

    constructor(){
        let that = this;
        this.changed = false;
        this.offer ;

        this.arCat = [];

        this.location = [];

        this.address;

        this.ord_frame = $("#client_frame");

        this.ord_frame.addTouch();

        this.ord_frame.find('.modal-title-date').text($('.dt_val').text());

        this.ord_frame.find('.publish_order').off('click touchstart');
        this.ord_frame.find('.publish_order').on('click touchstart',this,function (ev) {
            let that = ev.data;
            let items = ev.data.GetOrderItems(ev.data.lang,true);
            window.user.PublishOrder(items,(data)=> {
                let status = window.dict.getDictValue(window.sets.lang,Object.keys(data)[1]);
                // $(that.ovc).find('.ord_status').css('color','white');
                $(that.ovc).find('.ord_status').text(status + "\r\n"+ data.published);
                that.status = Object.keys(data)[1];

                window.db.GetSettings(function (obj) {
                    obj[0].address = items.address;
                    window.db.SetObject('setStore',obj[0], function () {

                    });
                });
            });
        });
    }

    InitCustomerOrder(obj, targ_title){
        let that = this;
        let client_frame = $('.client_frame_tmplt').clone();
        $(client_frame).removeClass('client_frame_tmplt');
        $(client_frame).addClass('client_frame');


        $(client_frame).on('load', function () {
            client_frame[0].contentWindow.InitCustomerOrder(obj, targ_title);
        });

        $(client_frame).css('display', 'inline-block');
        $('#client_frame_container').css('display', 'inline');

        $('#client_frame_container').empty();
        $('#client_frame_container').prepend(client_frame[0]);
        // $('#client_frame_container').draggable();
        // $('#client_frame_container').resizable({
        //     aspectRatio: 16 / 9
        // });
    }


    onClickCert(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if(!$(this).attr('height'))
            $(this).attr('height','100');
        else {
            $(this).removeAttr('height');
        }
        return false;
    };




    OnMessage(data){//TODO:
        if(data.func ==='approved'){
            this.RedrawOrder({uid:data.order.supuid});

        }
        if(data.func ==='sharelocation'){
            let loc = data.location;

        }

    }
}



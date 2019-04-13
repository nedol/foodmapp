'use strict'
export {OfferOrder}

var urlencode = require('urlencode');
require('jquery-ui')
// require('jquery-ui-touch-punch');
require('jquery.ui.touch');
require('bootstrap/js/tooltip.js');

// require('bootstrap/dist/css/bootstrap.css');
// require('font-awesome/css/font-awesome.css');



const langs = require("../dict/languages");

// var moment = require('moment');

var isJSON = require('is-json');

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

        this.ord_frame.find('.modal-title-date').text($('.dt_val')[0].value.split(' ')[0]);

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

    InitCustomerOrder(obj){
        let that = this;
        let client_frame = $('.client_frame_tmplt').clone();
        $(client_frame).removeClass('client_frame_tmplt');
        $(client_frame).addClass('client_frame');

        $(client_frame).on('load', function () {
            client_frame[0].contentWindow.InitCustomerOrder(obj);
        });

        $(client_frame).css('display', 'inline-block');
        $('#client_frame_container').css('display', 'inline');
        let w = document.documentElement.clientWidth;
       // if(window.devicePixelRatio<1.5)
            w='500px';
        $(client_frame).css('width',w);

        $('#client_frame_container').append(client_frame);

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



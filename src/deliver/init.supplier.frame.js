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

        this.supplier_frame = $("#supplier_frame");

        this.supplier_frame.addTouch();

        this.supplier_frame.find('.modal-title-date').text($('.dt_val').text());

    }

    InitCustomerOrder(obj, targ_title){
        let that = this;
        $('.loader').css('display','block');

        if(this.supplier_frame[0].contentWindow.InitCustomerOrder) {
            this.supplier_frame.css('height','100%');
            this.supplier_frame[0].contentWindow.InitCustomerOrder(obj, targ_title);
        }else{
            this.supplier_frame.attr('src','./deliver/customer.frame.html?v='+28);

            this.supplier_frame.on('load', function () {
                this.contentWindow.InitCustomerOrder(obj, targ_title);
            });
        }

        $(this.supplier_frame).css('display', 'inline-block');

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



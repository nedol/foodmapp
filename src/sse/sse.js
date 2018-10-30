'use strict'
var isJSON = require('is-json');

module.exports = class SSE{

    constructor(){

        this.eventSource = new window.EventSource(host_port+'?proj=rtc&trans=all&sse=1&uid='+that.uid+'&role='+that.role+'&email='+that.email.from
            //,{withCredentials: true}
        );
        this.eventSource.onerror = function(e) {
            if (this.readyState == EventSource.CONNECTING) {
                //console.log("Соединение порвалось, пересоединяемся...");
            } else {
                //console.log("Ошибка, состояние: " + this.readyState);
            }
        };
        this.eventSource.onopen = function(e) {
            console.log("Соединение открыто");
            setTimeout(function () {
                cb();
            },100);

        };
        this.eventSource.onmessage = function (e) {
            //console.log(e.data);
            that.OnMessage(JSON.parse(e.data));

        };
        this.eventSource.addEventListener('sse', (e) => {
            console.log(e.data);
            // => Hello world!
        });

    }


    SetOrderUpdLstnr(user, class_obj,cb){

        let url = host_port + '?' + //
            user +
            "&proj=bm"+
            "&func=getreserved" +
            "&order_hash="+class_obj.order_hash+
            "&lat=" + class_obj.lat_param +
            "&lon=" + class_obj.lon_param +
            "&date=" + $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD') +
            "&lang=" + window.sets.lang;

        $.ajax({
            url: url,
            method: "GET",
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded',
            cache: false,
            processData: true,
            user: user,
            this_obj:this,
            class_obj:class_obj,
            callback:cb,
            success: function (resp) {
                if(typeof resp !=='object')
                    resp =JSON.parse(resp);
                this.callback(resp,this.class_obj);
            },
            complete: function (resp) {
                setTimeout(function (user,class_obj,this_obj, cb) {
                    this_obj.SetOrderUpdLstnr(user,class_obj,cb);
                },1000,this.user,this.class_obj, this.this_obj,this.callback);
            }
        });
    }

    SetOrderAdminUpdLstnr( order_data, cb){

        var url =  host_port + '?' + //
            "func=upd_order_admin"+
            "&order_data="+order_data;
        $.ajax({
            url: url,
            method: "GET",
            dataType: 'json',
            contentType: false,
            cache: false,
            processData: false,
            crossDomain: true,
            order_data: order_data,
            this_obj:this,
            callback:cb,
            success: function (data) {
                if(data.data.func==='UpdateOrderAdmin'){
                    this.callback(data.data);
                }
            },
            complete: function (data) {
                setTimeout(function (this_obj,order_data,cb) {
                    this_obj.SetOrderAdminUpdLstnr(order_data,cb);
                },1000, this.this_obj,this.order_data,this.callback);
            }
        });
    }

}


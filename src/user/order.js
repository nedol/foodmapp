'use strict'
export {Order};

let md5 = require('md5');
var isJSON = require('is-json');
let utils = require('../utils');
var urlencode = require('urlencode');
import {MenuUser} from '../menu/menu.user';

var moment = require('moment');

var ColorHash = require('color-hash');


class Order{

    constructor(uid) {

       this.uid = uid;
       this.lat_param = '33.03' ;//getParameterByName('lat');
       this.lon_param = '57.05';//getParameterByName('lon');
       this.zoom_param = '11';//getParameterByName('zoom');
       this.email = utils.getParameterByName('admin');

       this.offer = new MenuUser();

       this.order={};

        let colorHash = new ColorHash();
        this.color = colorHash.hex(uid);

        let obj = localStorage.getItem("user");

        if (isJSON(obj)) {

            let uObj = JSON.parse(obj);
            this.uname = uObj.uname;
            this.psw = uObj.psw;
            this.email = uObj.email;
            this.uid = uObj.uid;
        }
    }


    DocReady() {

        $(window).on('touchstart', this, function (ev) {
            //ev.preventDefault();
            ev.stopPropagation();
            // if(!$("#datetimepicker").data("DateTimePicker").isHide){
            //     $("#datetimepicker").data("DateTimePicker").hide().isHide = true;
            // }
        });

        //$('#flr')["0"].gif.play();

        let time = $('.period_list').find('a')[0].text;


        $("#lang_text").on('touch', this, function (event) {
            event.preventDefault();
            event.stopPropagation();
            $('#select_lang').css('visibility', 'visible');
            $('.selectpicker').selectpicker('toggle');

        });
    }

    GetReserved(ev) {

        if(ev.stopPropagation)
            ev.stopPropagation();
        if(ev.preventDefault)
            ev.preventDefault();

        ev.data.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        try {

            let url = host_port + '?' + //
                "proj=d2d"+
                "&user="+ localStorage.getItem('user')+
                "&func=getreserved" +
                "&lat=" + (ev?ev.data.lat_param:this.lat_param) +
                "&lon=" + (ev?ev.data.lon_param:this.lon_param) +
                "&date=" + ev.data.date +
                "&lang=" + window.sets.lang;

            //console.log(url);

            $.ajax({
                url: url,
                method: "GET",
                dataType: 'json',
                processData: false,
                async: true,   // asynchronous request? (synchronous requests are discouraged...)
                cache: false,
                crossDomain: true,
                class_obj:ev?ev.data:this,
                success: function (resp, msg) {

                    if(isJSON(resp))
                        resp =JSON.parse(resp);

                    if(resp.msg) {
                        // new TWEEN.Tween($('#target')[0].object3D.position).to({
                        //     y: 0,
                        //     x: 0,//_x * visible_width,
                        //     z: 0 //_y * visible_height
                        // }, 1000)
                        //     .repeat(0)//Infinity)
                        //     .onUpdate(function () { // Called after tween.js updates
                        //         document.querySelector('#camera').setAttribute('camera', 'fov', '60');
                        //     })
                        //     .easing(TWEEN.Easing.Quadratic.In).start();

                        return;
                    }

                    if(resp.offer)
                        this.class_obj.offer.menuObj = resp.offer;


                },
                error: function (xhr, status, error) {
                    //let err = eval("(" + xhr.responseText + ")");
                    for (let i = 0; i < $('.reserve').length; i++) {
                        $('.reserve')[i].object3D.el.object3D.visible = false;
                        $('.reserve')[i].object3D.el.object3D.el.setAttribute('text', 'value', 'reserved');
                    }

                    for (let i = 0; i < $('.offer').length; i++) {
                        if ($('.offer')[i].object3D.visible) {
                            $($('.offer')[i]).detach();
                            i--;
                        }
                    }
                    console.log(error.Message);
                    console.log(xhr.responseText);

                },
                complete: function (data) {
                    //alert(data.responseText);
                },
            });

        } catch (ex) {
            console.log();
        }
    }

    ConfirmReservation(event,table_id,reserve) {

        if (localStorage.getItem("user") || window.demoMode) {
            if(!localStorage.getItem("user"))
                localStorage.setItem("user",md5(new Date()));
            let isConfirm = confirm("Confirm your reservation");
            if (isConfirm) {
               event.data.UpdateReservation(event,table_id, reserve );
            }
        } else {
            event.data.OpenUserDialog(event.target.id);
        }

    }

    UpdateOrder(order, table_id,menu_id, date) {

        let time = $('.sel_time').text();
        if (this.order[time][this.uid][table_id])
            this.order[time][this.uid][table_id][menu_id] = order[table_id][menu_id];

        if(window.demoMode) {

            this.ClearTableReserve();
            this.SetTables(this.order,this);
            return;
        }

        let url = http+host_port;
        let data =
            "proj=d2d"+
            "&func=updateorder"+
            "&user="+localStorage.getItem('user')+
            "&lat="+this.lat_param+
            "&lon="+this.lon_param+
            "&time="+time+
            "&date="+ date+
            "&order="+urlencode.encode(JSON.stringify(order))+
            "&table="+table_id+
            "&offer="+menu_id+
            "&lang="+window.sets.lang;

        $.ajax({
            url: url,
            method: "POST",
            dataType: 'json',
            data: data,
            crossDomain: true,
            class_obj:this,
            success: function (resp) {

                let arr = resp;
                if(isJSON(resp))
                    arr = JSON.parse(resp);
                if(!arr) {
                    new TWEEN.Tween($('#target')[0].object3D.position).to({
                        y: 0,
                        x: 0,//_x * visible_width,
                        z: 0 //_y * visible_height
                    }, 1000)
                        .repeat(0)//Infinity)
                        .onUpdate(function () { // Called after tween.js updates
                            document.querySelector('camera').setAttribute('camera', 'fov', '60');
                        })
                        .easing(TWEEN.Easing.Quadratic.In).start();
                } else {

                    if(arr.msg)
                        console.log(arr.msg);
                }
            },
            error: function(xhr, status, error){
                //let err = eval("(" + xhr.responseText + ")");
                console.log(error.Message);
                //alert(xhr.responseText);
            },
            complete: function (data) {
                //alert(data.responseText);
            },
        });
    }

    UpdateReservation(event, table_id, data_obj,cb) {

        let time = $('.sel_time').text();
        if(!this.order[time])
            this.order[time]={};
        if (!this.order[time][this.uid])
            this.order[time][this.uid] = {};
        if (!this.order[time][this.uid][table_id])
            this.order[time][this.uid][table_id] = data_obj?data_obj[this.uid][table_id]:
                {'menu_1':{'order':{}},'menu_2':{'order':{}}};

        if(window.demoMode) {
            this.ClearTableReserve();
            this.SetTables(this.order,this);
            return;
        }
        let url = host_port;
        let data =
            "proj=d2d"+
            "&func=updatereservation"+
            "&user="+localStorage.getItem('user')+
            "&lat="+event.data.lat_param+
            "&lon="+event.data.lon_param+
            "&time="+time+
            "&date="+event.data.date+
            "&table="+table_id+
            "&menus="+urlencode.encode(JSON.stringify(this.order[time][this.uid][table_id]))+
            "&lang="+window.sets.lang;
//'{"'+res[0].id + '":{"order": {},"from":"'+$('#period_1').find('.from')[0].getAttribute('text').value+'","to":"'+$('#period_1').find('.to')[0].getAttribute('text').value+'"}}';

        $.ajax({
            url: url,
            method: "POST",
            dataType: 'json',
            data: data,
            class_obj:event.data,
            cb:cb,
            success: function (resp) {
                let arr = resp;
                if(isJSON(resp))
                    arr = JSON.parse(resp);
                if(resp.user) {
                    localStorage.setItem("user", resp.user);//
                }
            },
            error: function(xhr, status, error){
                //let err = eval("(" + xhr.responseText + ")");
                localStorage.removeItem("user");//
                console.log(error.Message);
                //alert(xhr.responseText);
            },
            complete: function (data) {
                //alert(data.responseText);
                if(this.cb)
                    this.cb();
            },
        });
    }

    ClearTableReserve() {


        $('.offer').attr('class', 'free');
        $('.reserve').attr('class', 'free');
        $('.free').off();
        $('.free').on('touch', this, this.OnFreeTouch);

        for (let i = 0; i < $('.free').length; i++) {
            if ($('.free')[i].object3D.visible) {
                $('.free')[i].setAttribute('visible', false);
                $('.free')[i].setAttribute('text', 'value', 'click to reserve');
                $('.free')[i].setAttribute('text', 'color', '#808080');
                $('.free')[i].setAttribute('text', 'wrapCount', '8');
                $('.free')[i].setAttribute('material', 'color', 'white');
                i--;
            }
        }

    }

    OpenUserDialog(table_id) {

        $('#registry_but').click(this,function(event) {
            event.preventDefault(); // avoid to execute the actual submit of the form.
            event.stopPropagation();
            event.data.uid = md5(JSON.stringify(Date.now()));
            event.data.uname = $('#auth_body').find('input[type="text"]').val();
            event.data.email = $('#auth_body').find('input[type="email"]').val();

            if(!event.data.uname || !event.data.email)
                return true;
            let str = JSON.stringify({"uid":event.data.uid,"email": event.data.email,"uname": event.data.uname});//
            localStorage.setItem("user", str);//
            event.data.UpdateReservation(event,table_id, event.data.order[event.data.uid]);
            $('#auth_dialog').modal('toggle');
        });

        $('#auth_dialog').modal();
    }

}



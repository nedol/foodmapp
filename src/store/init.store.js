'use strict'

import {Сетка} from "../../network";
import {DB} from "../map/storage/db";
import {Utils} from "../utils/utils";
import {Categories} from "../categories/categories.js";
let utils = new Utils();

var urlencode = require('urlencode');

import {Profile} from "../profile/profile";
import {OLMap} from '../map/map';
import {Dict} from '../dict/dict.js';
import {Import} from "../import/import";

var moment = require('moment/moment');



$(document).on('readystatechange', function () {
    window.network = new Сетка(host_ws);
    window.sets = {};
    window.sets.lang = utils.getParameterByName('lang');
    window.sets.store = utils.getParameterByName('store');
    window.sets.supuid = utils.getParameterByName('supuid')
    window.sets.coords = {};

    let uObj = {};
    window.db = new DB('Customer', function () {
        let uid = utils.getParameterByName('uid');

        window.db.GetSettings(function (set) {
            var _ = require('lodash');
            let res = _.findKey(set, function(k) {
                return k.uid === uid;
            });
            res=0;
            window.user = new Customer();
            if (set[res]) {
                uObj = set[res];

                window.user.SetParams(uObj);
                window.user.InitUser(function (data) {//TODO:

                });

            }else {
                let md5 = require('md5');
                uObj = {uid:md5(new Date())};
                window.db.SetObject('setStore', uObj, function (res) {
                    window.user.SetParams(uObj);
                    window.user.InitUser(function (data) {//TODO:
                    });
                });
            }
        });
    });
});

export class Customer{

    constructor() {
        this.date = moment().format('YYYY-MM-DD');

        this.load_paused = false;

        this.path  ="http://localhost:5500/d2d/server";
        if(host_port.includes('delivery-angels'))
            this.path = "https://delivery-angels.ru/server";
        else
            this.path = host_port;

        this.image_path  = image_path;
    }

    SetParams(uObj){
        this.uid = uObj.uid;
        this.psw = uObj.psw;
        this.email = '';//!!! no need to registrate
        if (uObj['profile'] && uObj['profile'].email)
            this.email = uObj['profile'].email;
        this.profile = new Profile(uObj.profile);

        this.orders = '';

        this.map
    }

    InitUser(cb){
        let that = this;

        console.log(navigator.userAgent);


        let market = 'food';
        if(utils.getParameterByName('market'))
            market = utils.getParameterByName('market')

        $('#category_container').load('./html/categories/'+market+'.html?v='+String(Date.now())+' #cat_incl',()=> {
            this.categories = new Categories(this);

        });

        $('.profile_frame').attr('src','./customer/profile.customer.'+window.sets.lang+'.html');
        $('.cart_frame').attr('src','./customer/cart.customer.'+window.sets.lang+'.html');
        

        if(window.sets.supuid) {
            let par = {
                proj: 'd2d',
                user:'customer',
                func: "getstore",
                supuid: window.sets.supuid,
                date: window.user.date,
            }

            window.network.SendMessage(par, function (data) {
                function formatObject(obj) {

                    return {
                        uid: obj.uid,
                        date: obj.date,
                        period: obj.period,
                        categories: obj.cats,
                        logo: "../dist/images/truck.png",
                        data: JSON.parse(obj.data.replace(new RegExp('https://nedol.ru/server/images/', 'g'),'')),
                        dict: obj.dict?JSON.parse(obj.dict):{},
                        rating: obj.rating?JSON.parse(obj.rating).value:'',
                        profile: obj.profile?JSON.parse(obj.profile):''
                    };
                }
                if(data) {
                    let processData = function (res, cb) {
                        let that = this;
                        try {
                            if (res.resAr) {

                                    let obj = res.resAr[0];
                                    if(!obj || !obj.profile)
                                        return;
                                    obj = formatObject(obj);

                                    if(obj.uid ===window.user.uid && moment(obj.date).isSame(window.user.date)){

                                        if((!window.user.offer.stobj ||!Object.keys(window.user.offer.stobj.data)[0]) && obj) {

                                            //     window.db.SetObject('dictStore',obj.dict, function (res) {
                                            //
                                            //     });
                                            //     window.user.offer  = obj;
                                            //     window.user.offer.location = proj.fromLonLat([obj.longitude,obj.latitude]);
                                            //     obj.location = window.user.offer.location;
                                            //     window.db.SetObject('offerStore', obj, function (res) {
                                            //         $('#datetimepicker').trigger("dp.change");
                                            //     });
                                        }
                                    }

                                    window.db.SetObject('supplierStore',obj, function (success) {
                                        cb(obj)
                                    });


                            }else{
                                cb(false);
                            }
                        }catch(ex){
                            console.log();
                        }
                    }
                    processData(data,function (obj) {
                        if (obj) {
                            if (window.user.constructor.name === 'Customer') {
                                that.InitStoreOrder(obj, '');
                            }
                        }
                    });
                }
            });
        }

        $.getJSON('../src/dict/sys.dict.json?v='+new Date().valueOf(), function (data) {
            window.sysdict = new Dict(data);
            window.sysdict.set_lang(window.sets.lang, $('body'));
            window.sysdict.set_lang(window.sets.lang, $('#categories'));

            window.db.GetStorage('dictStore', function (rows) {
                window.dict = new Dict(rows);
            });
            cb();
        });

    }

    InitStoreOrder(obj, targ_title){
        let that = this;
        //$('.loader').css('display','block');
        $('#splash').css('display','block');
        $('#splash').find('img').attr('src',that.image_path+obj.profile.avatar);


        QRCode.toCanvas(
            $('#qr_canvas')[0], 
            "https://delivery-angels.ru/d2d/dist/customer.store.html?lang="+window.parent.sets.lang+"&market=food&supuid="+window.parent.user.uid, 
            function (error) {
                if (error) console.error(error)
                    console.log('success!');
            }
        );

        $('#qr_div').click(()=>{
            this.load_paused = !this.load_paused;
            if(!this.load_paused)
                load();
        })

        function load(){

            let client_frame = $('.client_frame_tmplt').clone();
            client_frame.attr('src','./customer/store.html?v='+new Date().valueOf());
            $(client_frame).removeClass('client_frame_tmplt');
            $(client_frame).addClass('client_frame');


            client_frame.on('load', function () {
                client_frame[0].contentWindow.InitCustomerOrder(obj, targ_title);

                that.map = new OLMap();
                that.map.Init(0,0, function () {
                });

                that.import = new Import();
                that.import.GetOrderCustomer(()=>{});
            });



                client_frame.css('display', 'inline-block');
                $('#client_frame_container').css('display', 'inline');

                $('#client_frame_container').empty();
                $('#client_frame_container').prepend(client_frame[0]);

                $('#qr_div').css('display','none');
            }
        

            setTimeout(()=>{
                if(!this.load_paused)
                    load();
            }, 2000);
  
    

    }

    UpdateOrderLocal(obj, cb){
        let that = this;
        obj.date = moment(obj.date).format('YYYY-MM-DD');
        window.db.SetObject('orderStore',obj,(res)=>{
            cb();
        });
    }


    SaveOrder(items,cb) {

        let that = this;

        $('.loader').css('display','block');

        if($('#address').val()){
            window.parent.db.GetSettings((obj) =>{
                if(!obj[0].profile)
                    obj[0].profile = {};
                obj[0].profile.address = $('#address').val();
                window.parent.db.SetObject('setStore', obj[0], (res) => {

                });
            });
        }

        window.parent.user.UpdateOrderLocal(items, function (res) {
            cb(items);
            $('.loader').css('display', 'none');
        });

    }

    PublishOrder(obj,cb) {
        let that = this;

        obj.proj = "d2d";
        obj.user = window.user.constructor.name.toLowerCase();
        obj.func = "updateorder";
        obj.psw = that.psw;
        obj.cusuid = that.uid;
        obj.date = moment(obj.date).format('YYYY-MM-DD');

        window.network.SendMessage(obj, function (data) {
            if (data && data.published) {
                obj.proj = '';
                obj.func = '';
                cb(obj);
            }
        });
    };


    DeleteOrder(obj,cb){
        let that = this;

        obj.proj = "d2d";
        obj.user = window.user.constructor.name.toLowerCase();
        obj.func = "updateorder";
        obj.psw = that.psw;
        obj.cusuid = that.uid;
        obj.date = moment(date).format('YYYY-MM-DD');
        obj.order = title;
        obj.status = 'deleted';

        window.network.SendMessage(obj, function (data) {
            if (data.result.affectedRows>0) {
                cb(data);
            }
        });
    }
    //layers


    OnMessage(data) {
        let that = this;

        if(data.func ==='approved'){
            window.db.GetOrder(data.order.date, data.order.supuid,data.order.cusuid, function (ord) {
                if(ord===-1)
                    return;
                ord.data[data.order.title].approved = data.order.data.approved;
                window.db.SetObject('orderStore', ord, (res)=> {
                    if(that.viewer)
                        that.viewer.OnMessage(data);
                });
            });
        }
        if(data.func ==='updateorder'){
            window.db.SetObject('orderStore',data,res=>{

            });
        }
        if(data.func ==='supupdate'){
            window.db.GetObject('supplierStore',data.obj.date,data.obj.email, function (res) {
                let obj = res;
                if(!obj) {
                    obj = data.obj;
                }
                let urlencode = require('urlencode');
                obj.data = JSON.parse(urlencode.decode(data.obj.offer));
                obj.dict = JSON.parse(data.obj.dict);
                let loc = data.obj.location;
                obj.latitude = loc[1];
                obj.longitude = loc[0];
                delete obj.location; delete obj.offer; delete obj.proj; delete obj.func;
                let layers = window.user.map.ol_map.getLayers();
                window.db.SetObject('supplierStore',obj,function (res) {
                    let catAr = JSON.parse(obj.categories);
                    for (let c in catAr) {
                        let l = layers.get(catAr[c])
                        let feature = l.values_.vector.getFeatureById(obj.hash);
                        if (feature) {
                            let point = feature.getGeometry();
                            let loc = proj.fromLonLat([obj.longitude, obj.latitude]);
                            if (point.flatCoordinates[0] !== loc[0] && point.flatCoordinates[1] !== loc[1])
                                window.user.map.SetFeatureGeometry(feature, loc);
                        }
                    }
                });

            });
        }
        if(data.func ==='sharelocation'){
            let loc = data.location;
            window.db.GetObject('supplierStore',window.user.date,data.email, function (obj) {
                if(!obj) {
                    obj = {};
                }
                obj.latitude = loc[1];
                obj.longitude = loc[0];
                let layers = window.user.map.ol_map.getLayers();
                window.db.SetObject('supplierStore', obj, function (res) {
                    let catAr = JSON.parse(obj.categories);
                    for (let c in catAr) {
                        let l = layers.get(catAr[c])
                        let feature = l.values_.vector.getFeatureById(obj.hash);
                        if (feature) {
                            let point = feature.getGeometry();
                            let loc = proj.fromLonLat([obj.longitude, obj.latitude]);
                            if (point.flatCoordinates[0] !== loc[0] && point.flatCoordinates[1] !== loc[1])
                                window.user.map.SetFeatureGeometry(feature, loc);
                        }
                    }
                });
            });
        }
    }


}



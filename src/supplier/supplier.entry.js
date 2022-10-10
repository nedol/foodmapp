'use strict'

import("../../lib/glyphicons/glyphicons.css");

require("../../global");


import {Utils} from "../utils/utils";

import {Сетка} from "../../network";
import {DB} from "../map/storage/db";
import {Supplier} from './supplier';

let moment = require('moment');

let _ = require('lodash');


let utils = new Utils();

// window.sets.lang = localStorage.getItem('d2d_lang');
// if(!window.sets.lang)
    window.sets.lang = utils.getParameterByName('lang');

    window.sets.css = utils.getParameterByName('css');

    window.user = '';

    window.network = new Сетка(host_ws);

    window.db = new DB('Supplier', function () {

        window.db.GetSettings(function (set_) {
            let set = set_;
            var _ = require('lodash');
            let uObj = {};

            let psw_hash = utils.getParameterByName('psw_hash');
            let market = utils.getParameterByName('market');
            if(psw_hash || !set[0]){
                toReg(psw_hash,function (uid, psw, lat, lon, data) {
                    window.location.replace(window.location.href.split('&')[0]+'&css=supplier');
                });
            }else if(set[0]) {

                window.db.GetAllOffers(function (res) {
                    if (!res[0])
                        res[0] = {date: moment().format('YYYY-MM-DD'), latitude: 0, longitude: 0};

                    // res.date = moment().format('l');
                    // window.db.SetObject('offerStore', res, function () {
                    //
                    // });

                    window.user = new Supplier(set[0],res[res.length-1]);
                    window.user.InitUser(function () {

                    });

                });
            }
        });
    });

    function toReg(psw_hash, cb){

        let that = this;

        var data_post = {
            proj: 'd2d',
            user: "Supplier",
            func: 'reguser',
            host: location.origin,
            psw_hash:psw_hash
        }


        window.network.SendMessage(data_post,function(obj){

                delete data_post.proj;
                delete data_post.func;
                delete data_post.host;
                localStorage.clear();
                let set;

                if(obj.supplier && obj.supplier[0].profile){
                    set =  {uid: obj.supplier[0].uid, psw: obj.supplier[0].psw, promo:obj.supplier[0].promo, prolong:obj.supplier[0].prolong,
                        profile: JSON.parse(obj.supplier[0].profile)};

                }else{
                    obj.supplier = [{profile:{},data:{}}]
                    set = {uid: obj.uid, psw: obj.psw, profile: data_post.profile?data_post.profile:{email:''}};
                }

                window.db.ClearStore('setStore', function () {

                    window.db.SetObject('setStore',set, function (res) {

                            window.db.ClearStore('offerStore', function () {
                                if (obj.supplier && obj.supplier[0].data) {
                                    if(_.isString(obj.supplier[0].data)){
                                        obj.supplier[0].data = JSON.parse(obj.supplier[0].data);
                                    }
                                    let date = moment().format('YYYY-MM-DD');
                                    let offer = {
                                        date: date,
                                        data: obj.supplier[0].data?obj.supplier[0].data:{},
                                        latitude: obj.supplier[0].lat,
                                        longitude:obj.supplier[0].lon
                                    };

                                    localStorage.setItem('cur_loc',JSON.stringify({lat:obj.supplier[0].lat,longitude:obj.supplier[0].lon, time:0}))

                                    window.db.SetObject('offerStore', offer, function () {

                                    });

                                    offer.date = moment().format('YYYY-MM-DD')
                                    window.db.SetObject('offerStore', offer, function () {

                                    });
                                }
                            });
                            window.db.ClearStore('dictStore', function () {

                                if (obj.supplier[0].dict) {
                                    let dict = JSON.parse(obj.supplier[0].dict).dict;
                                    if (dict) {
                                        recursDict(dict, Object.keys(dict), 0, set, function (ev) {
                                            cb(obj.supplier[0].uid, obj.supplier[0].psw, obj.supplier[0].data, obj.supplier[0].latitude, obj.supplier[0].longitude);
                                        });
                                    }else{
                                        cb(obj.supplier[0].uid, obj.supplier[0].psw, obj.supplier[0].data, obj.supplier[0].latitude, obj.supplier[0].longitude);
                                    }
                                } else {
                                    cb(obj.supplier[0].uid, obj.supplier[0].psw, obj.supplier[0].data, obj.supplier[0].latitude, obj.supplier[0].longitude);
                                }
                            });

                    });
                });

                function recursDict(dict, keys,i, set, cb) {

                    try {
                        window.db.SetObject('dictStore', {hash: keys[i], obj: dict[keys[i]]}, function (res) {
                            if(dict[keys[i+1]])
                                recursDict(dict,Object.keys(dict), i+1,set, cb);
                            else{
                                cb();
                            }
                        });
                    } catch (ex) {
                        cb();
                    }
                };
        });

    }















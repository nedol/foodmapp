'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');

import("../../lib/glyphicons/glyphicons.css");

require("../../global");

import {Utils} from "../utils/utils";

import {Сетка} from "../../network";
import {DB} from "../map/storage/db";
import {Deliver} from './deliver';

var moment = require('moment/moment');

let utils = new Utils();
window.sets.lang = utils.getParameterByName('lang');


$(document).on('readystatechange', function () {

    if (document.readyState !== 'complete') {
        return;
    }

    window.sets.css = utils.getParameterByName('css');

    window.network = new Сетка(host_ws);

    window.db = new DB('Deliver', function () {

        window.db.GetSettings(function (set) {
            var _ = require('lodash');
            let uObj = {};
            let psw_hash = utils.getParameterByName('psw_hash');

            if(psw_hash || !set[0]){
                toReg(psw_hash,function (uid, psw, data) {
                    window.location.replace(window.location.href.split('&')[0]+'&css=supplier');
                })
            }else if(set[0]) {

                let date = moment().format('YYYY-MM-DD');
                window.db.GetAllOffers(function (res) {
                    if (!res[0])
                        res[0] = {date: date, latitude: 0, longitude: 0};

                    // res.date = moment().format('l');
                    // window.db.SetObject('offerStore', res, function () {
                    //
                    // });

                    window.user = new Deliver(set[0],res[res.length-1]);
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
            user: "Deliver",
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

            if(obj.deliver && obj.deliver[0].profile){
                set =  {uid: obj.deliver[0].uid, psw: obj.deliver[0].psw, promo:obj.deliver[0].promo, prolong:obj.deliver[0].prolong,
                    profile: JSON.parse(obj.deliver[0].profile)};

            }else{
                obj.deliver = [{profile:{},data:{}}]
                set = {uid: obj.uid, psw: obj.psw, profile: data_post.profile?data_post.profile:{email:''}};
            }

            window.db.ClearStore('setStore', function () {

                window.db.SetObject('setStore',set, function (res) {

                    window.db.ClearStore('offerStore', function () {
                        if (obj.deliver && obj.deliver[0].data) {
                            if(_.isString(obj.deliver[0].data)){
                                obj.deliver[0].data = JSON.parse(obj.deliver[0].data);
                            }
                            let date = moment().format('YYYY-MM-DD');
                            let offer = {
                                date: date,
                                data: obj.deliver[0].data?obj.deliver[0].data:{},
                                latitude: obj.deliver[0].lat,
                                longitude:obj.deliver[0].lon,
                                radius: obj.deliver[0].radius
                            };

                            localStorage.setItem('cur_loc',JSON.stringify({lat:obj.deliver[0].lat,lon:obj.deliver[0].lon, time:0}));

                            window.db.SetObject('offerStore', offer, function () {

                            });
                        }
                    });
                    window.db.ClearStore('dictStore', function () {

                        if (obj.deliver[0].dict) {
                            let dict = JSON.parse(obj.deliver[0].dict).dict;
                            if (dict) {
                                recursDict(dict, Object.keys(dict), 0, set, function (ev) {
                                    cb();
                                });
                            }else{
                                cb();
                            }
                        } else {
                            cb();
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

});















//////////////////
// WEBPACK FOOTER
// ./src/deliver/deliver.entry.js
// module id = 761
// module chunks = 2
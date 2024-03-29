'use strict'

var https = require('https');
//const vr_server= require('./vreport/server')
var mysql = require('mysql');

let http = require("http");

let globaljs = require('./global');
let utils = require('./utils.js');

let Dict = require('./dict/dict');

//var urlencode = require('urlencode');

const path = require('path')
const url = require('url');
var Email = require('./email/email');
let email = new Email();

var md5 = require('md5.js');


//const translate = require('google-translate-api');//ISO 639-1

let con_param = globaljs.con_param;//change every 8 min

let con_obj;

let bing_api_token

String.prototype.replaceAll = function(search, replace){
    return this.split(search).join(replace);
}



module.exports = {

    HandleRequest( q, ws) {

            try {

                switch (q.proj) {
                    case'rtc':
                        let RTC = require('./rtc/rtc');
                        try {
                            let rtc = new RTC();
                            rtc.dispatch(q, ws);
                        } catch (ex) {
                            //res.end(JSON.stringify({error:'ServerError'}));
                            return;
                        }
                        break;

                    case'd2d':

                        let D2D = require('./d2d/d2d');
                        let Supplier = require('./d2d/supplier');
                        let Customer = require('./d2d/customer');
                        let d2d = '';

                        if (q.user && q.user.toLowerCase() === 'supplier') {
                            d2d = new Supplier();
                        } else if (q.user && q.user.toLowerCase() === 'deliver') {
                            d2d = new Supplier();
                        } else if (q.user && (q.user.toLowerCase() === 'customer')) {
                            d2d = new Customer();
                        } else {
                            d2d = new D2D();
                        }
                        StartConnection(function (mysql_con) {
                            d2d.dispatch(q, ws, global.mysql_pool);
                        });
                        break;
                    default:
                        console.log();
                        break;
                }
            }catch(ex){

            }

    }
}



function StartConnection(cb) {

    if(!global.mysql_pool) {

        console.error('CONNECTING');
        global.mysql_pool = mysql.createPool(con_param);

        global.mysql_pool.getConnection(function (err, connection) {
            if (err) {
                console.error('CONNECT FAILED', err.code);
                if(connection) {
                    connection.end(function (err) {
                        if (err) {
                            console.log(err.message);
                        }
                        console.log("пул закрыт");
                        StartConnection(cb);
                    });
                }else{
                    StartConnection(cb);
                }

            }
            else {
                console.error('CONNECTED');
                cb();
            }
        });
        global.mysql_pool.on('error', function (err) {
            this.end(function(err) {
                if (err) {
                    console.log(err.message);
                }
                console.log("пул закрыт");
                StartConnection(cb);
            });
        });
    }else{
        cb();
    }

}

function InitDict(q, cb) {

    var sql = "SELECT obj.id, obj.data as data"+
        " FROM  objects as obj"+
        " WHERE obj.latitude="+q.lat+" AND obj.longitude="+q.lon;

    con_obj.query(sql, function (err, result) {
        if (err)
            throw err;
        if (result.length > 0) {
            if(isJSON(result[0].data)){
                cb( new Dict(JSON.parse(result[0].data)));
            }else{
                cb();
            }
        }
    });
}

function InitUser(q, res) {

    var sql =  "SELECT obj.id, obj.owner, obj.data as obj_data, obj.ddd as ddd, o.data as order_data, DATE_FORMAT(o.date,'%Y-%m-%d') as date"+
        " FROM  objects as obj, orders as o"+
        " WHERE obj.latitude="+q.lat+" AND obj.longitude="+q.lon+
        " AND obj.id=o.obj_id AND (o.data IS NOT NULL OR o.data='') ORDER BY o.date DESC";

    con_obj.query(sql, function (err, result) {
        if (err)
            throw err;

        if (result.length > 0) {

            //res.writeHead(200, {'Content-Type': 'application/json'});
            res.writeHead(200,{'Content-Type': 'text/event-stream'});
            res.end(JSON.stringify({
                data: result[0].obj_data,
                ddd: result[0].ddd,
                menu: result[0].order_data,
                maxdate:result[0].date
            }));

        }else {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({msg: 'Initialization is impossible'}));
        }
    });

}

function InitAdmin(q, res) {

    var sql = "SELECT obj.id, obj.owner, obj.data as obj_data, o.data as menu_data"+
        " FROM  objects as obj, orders as o"+
        " WHERE obj.latitude="+q.lat+" AND obj.longitude="+q.lon+
        " AND obj.id=o.obj_id AND o.data<>''  AND o.data IS NOT NULL"+
        " ORDER BY o.date DESC LIMIT 1";

    con_obj.query(sql, function (err, result) {
        if (err) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({err:err}));
        }
        if(result.length>0) {
            let owner;
            if(isJSON(result[0].owner)){
                owner = JSON.parse(result[0].owner);
            }else {
                //console.log('Wrong data format');
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end('Wrong data format');
                return;
            }
            let menu_data = (result[0].menu_data);//?result[0].menu_data:"{\"menu\":[\"tab_1\"]}";


            if (owner.uid == q.uid) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({auth: 'OK', data: result[0].obj_data, menu: menu_data}));
                return;
            }
            if (!owner.uid) {
                owner.uid = q.uid;
                sql = "UPDATE objects SET owner='" + JSON.stringify(owner) + "'" +
                    " WHERE id=" + result["0"].id;

                con_obj.query(sql, function (err, result) {
                    if (err)
                        throw err;
                    if (result) {
                        InitAdmin(q, res);
                    }
                });
            }else{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({msg:'Demo Mode',auth: 'ERROR',data: result[0].obj_data, menu: menu_data}));
            }

        }else{
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({"data": result[0].obj_data,"menu": "[tab_1]"}));
        }
    });

}

function select_query(q, res) {


    let sql = "SELECT DATE_FORMAT(o.date,'%Y-%m-%d') as date, o.data as order_data, o.reserved as reserved" +
        " FROM  orders as o, objects as obj" +
        " WHERE DATE_FORMAT(o.date,'%Y-%m-%d')='" + q.date + "' AND obj.latitude=" + q.lat + " AND obj.longitude=" + q.lon +
        " AND o.obj_id = obj.id" +
        " ORDER BY o.date DESC LIMIT 1";

    //console.log(sql);

    con_obj.query(sql, function (err, result) {
        if (err) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({err: err}));
        }
        if(result && result[0]) {
            handleMysqlResult(q, res, result);

        }else{
            //res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({"menu":'undefined'}))
        }
    });
}



// wget https://nodejs.org/dist/v9.7.0/node-v9.7.0-linux-x64.tar.x
//     tar xJf node-v9.7.0-linux-x64.tar.xz --strip 1
// rm node-v9.7.0-linux-x64.tar.xz
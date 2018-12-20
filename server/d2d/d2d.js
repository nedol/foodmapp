'use strict'
let moment = require('moment');

let utils = require('../utils');
var md5 = require('md5');
var isJSON = require('is-json');
var urlencode = require('urlencode');
const translate = require('google-translate-api');//ISO 639-1

var intersection = require('array-intersection');

global.resObj = {};

module.exports = class D2D {

    constructor(){

    }
    dispatch(q, res) {

        if (q.sse) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });

            res.write(utils.formatSSE({msg:'sse'}));

            resObj[q.email] = res;

        } else {
            try {
                switch (q.func) {
                    case 'init':
                        this.init(q, res);
                        break;
                    case 'auth':
                        this.Auth(q, res);
                        break;
                    case 'updateorderstatus':
                        this.UpdateOrderStatus(q, res);
                        break;
                    case 'updateorder':
                        this.UpdateOrder(q, res);
                        break;
                    case 'updateoffer':
                        this.UpdateOffer(q, res);
                        break;
                    case 'translate':
                        this.translate(q, res);
                        break;
                    case 'getorders':
                        this.GetOrders(q, res);
                        break;
                    case 'getsuppliers':
                        this.GetSuppliers(q, res);
                        break;
                    case 'sharelocation':
                        this.ShareLocation(q, res);
                        break;

                    default:
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end();
                        break;

                }
            } catch (ex) {
                console.log(ex);
            }
        }
    }

    init(q, res) {

        var sql =  "SELECT obj.id, obj.owner, obj.data as obj_data, obj.ddd as ddd, o.data as order_data, DATE_FORMAT(o.date,'%Y-%m-%d') as date"+
            " FROM  objects as obj, orders as o"+
            " WHERE obj.latitude="+q.lat+" AND obj.longitude="+q.lon+
            " AND obj.id=o.obj_id AND (o.data IS NOT NULL OR o.data='') ORDER BY o.date DESC";

        global.con_obj.query(sql, function (err, result) {
            if (err)
                throw err;

            if (result.length > 0) {

                //res.writeHead(200, {'Content-Type': 'application/json'});
                res.writeHead(200,{'Content-Type': 'text/event-stream'});
                res.end(JSON.stringify({
                    data: result[0].obj_data,
                    ddd: result[0].ddd,
                    offer: result[0].order_data,
                    maxdate:result[0].date
                }));

            }else {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({msg: 'Initialization is impossible'}));
            }
        });

    }


    Auth(q, res) {

        var sql = "SELECT obj.id, obj.owner, obj.data as obj_data, o.data as menu_data" +
            " FROM  orders as o" +
            " WHERE " +
            " obj.id=o.obj_id AND o.data<>''  AND o.data IS NOT NULL" +
            " ORDER BY o.date DESC LIMIT 1";

        global.con_obj.query(sql, function (err, result) {
            try{
                if (err) {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({err: err}));
                }
                if (result.length > 0) {
                    let owner;
                    if (isJSON(result[0].owner)) {
                        owner = JSON.parse(result[0].owner);
                    } else {
                        //console.log('Wrong data format');
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end('Wrong data format');
                        return;
                    }
                    let menu_data = (result[0].menu_data);//?result[0].menu_data:"{\"offer\":[\"tab_1\"]}";


                    if (owner.uid == q.uid) {
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({auth: 'OK', data: result[0].obj_data, offer: menu_data}));
                        return;
                    }
                    if (!owner.uid) {
                        owner.uid = q.uid;
                        sql = "UPDATE objects SET owner='" + JSON.stringify(owner) + "'" +
                            " WHERE id=" + result["0"].id;

                        global.con_obj.query(sql, function (err, result) {
                            if (err)
                                throw err;
                            if (result) {
                                auth(q, res);
                            }
                        });
                    } else {
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({
                            msg: 'Demo Mode',
                            auth: 'ERROR',
                            data: result[0].obj_data,
                            offer: menu_data
                        }));
                    }

                } else {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({"data": result[0].obj_data, "offer": "[tab_1]"}));
                }

            }catch(ex) {

            }
        });

    }

    select_query(q, res) {

        let sql = "SELECT DATE_FORMAT(o.date,'%Y-%m-%d') as date, o.data as order_data, o.reserved as reserved" +
            " FROM  orders as o, objects as obj" +
            " WHERE DATE_FORMAT(o.date,'%Y-%m-%d')='" + q.date + "' AND obj.latitude=" + q.lat + " AND obj.longitude=" + q.lon +
            " AND o.obj_id = obj.id" +
            " ORDER BY o.date DESC LIMIT 1";

        //console.log(sql);
        let obj_this = this;
        global.con_obj.query(sql, function (err, result) {
            if (err) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({err: err}));
            }
            if(result && result[0]) {
                obj_this.handleMysqlResult(q, res, result);

            }else{
                //res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({"offer":'undefined'}))
            }
        });
    }

    UpdateOffer(q, res){

        let sql =
            "SELECT of.id as offer_id, DATE_FORMAT(of.date,'%Y-%m-%d') as date" +
            " FROM  supplier as sup, offers as of"+
            " WHERE of.sup_uid=sup.uid AND sup.uid=\""+q.uid+"\"" +
            " AND of.date=\""+q.date+"\""+
            " ORDER BY of.id DESC";

        global.con_obj.query(sql, function (err, result) {
            if (err) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({err: err}));
                return;
            }
            let values, sql;
            if(result.length>0) {
                if (q.dict && q.offer) {// && result[0].obj_data.length<q.dict.length){

                    values = [urlencode.decode(q.offer), result[0].offer_id];

                    sql = "UPDATE offers SET data=?   WHERE id=?";
                    //console.log(sql);

                    global.con_obj.query(sql, values, function (err, result) {
                        if (result) {
                            values = [q.dict, q.uid];
                            sql = "UPDATE supplier SET dict=?   WHERE uid=?";
                            global.con_obj.query(sql, values, function (err, result) {

                            });
                        }
                    });
                }

                if (new Date(result[0].date) >= new Date(q.date)) {
                    values = [urlencode.decode(q.offer), JSON.stringify(q.categories), q.location[0].toFixed(6),q.location[1].toFixed(6), q.period, result[0].offer_id];
                    sql =
                        'UPDATE offers SET data=?, categories=?, longitude=?, latitude=?, period=? WHERE id=?';
                }
            }else {
                values = [q.uid, urlencode.decode(q.offer),JSON.stringify(q.categories), q.location[0].toFixed(6),q.location[1].toFixed(6), q.date, q.period];
                sql =
                    'INSERT INTO offers SET sup_uid=?, data=?, categories=?, longitude=?, latitude=?, date=?, period=?';
            }
            global.con_obj.query(sql, values, function (err, result) {
                if (err) {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({err: err}));
                    return;
                }
                if (result) {
                    res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
                    res.end(JSON.stringify({result: result}));
                }
            });
        });
    }

    UpdateOrder(q, res){
        let that = this;
        let status = 'published';
        let sql =
            "SELECT ord.*, tar.options as tariff"+ // cus.email as cusem,  DATE_FORMAT(of.date,'%Y-%m-%d') as date" +
            " FROM  customer as cus, orders as ord, tariff as tar"+
            " WHERE ord.supem=\'"+q.supem+"\'  AND cus.uid=\'"+q.uid+"\'" +
            " AND cus.tariff=tar.id AND tar.applicant=\"c\"" +
            " AND cus.email=ord.cusem AND ord.date=\""+q.date+"\"" +
            " ORDER BY ord.id DESC";

        global.con_obj.query(sql, function (err, sel) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            if (err) {
                res.end(JSON.stringify({err: err}));
                return;
            }
            let values, sql;
            if(sel.length>0) {
                let cusem = sel[0].cusem;
                if(Object.keys(q.order).length<=3){//'{}'
                    status = 'deleted';
                } else if(sel[0].status==='approved'){
                    res.end(JSON.stringify({msg:'couldn\'t change approved order'}));
                    return;
                }

                values = [q.order, q.address, status, sel[0].id];

                sql = "UPDATE orders SET data=?, address=?, status=? WHERE id=?";

                global.con_obj.query(sql, values, function (err, result) {
                    if (result) {
                        res.end(JSON.stringify({result: result, status:status}));

                        if(global.resObj[q.supem] && global.resObj[q.supem].connection.writable) {
                            sel[0].data = q.order;
                            sel[0].status = status;
                            global.resObj[q.supem].write(utils.formatSSE({func:'updateorder',order:sel[0]}));
                        }
                    }
                });

                if (new Date(sel[0].date) >= new Date(q.date)) {
                   if(sel[0].status==='approved')
                       status = 'approved';
                    values = [q.order, q.period, status, sel[0].id];
                    sql ='UPDATE orders SET data=?, period=?,status=? WHERE id=?';
                }
            }else {
                status = 'published';
                values = [q.cusem, q.supem, q.order, q.address, q.date, q.period,status];
                sql = 'INSERT INTO orders SET cusem=?, supem=?, data=?, address=?, date=?, period=?, status=?';
            }
            global.con_obj.query(sql, values, function (err, result) {
                if (err) {
                    res.end(JSON.stringify({err: err}));
                    return;
                }
                if (result) {
                    if(global.resObj[q.supem] && global.resObj[q.supem].connection.writable)
                        resObj[q.supem].write(utils.formatSSE({func:'updateorder',order:sel[0]}));
                    res.end(JSON.stringify({result: result, status:status}));
                }
            });
        });
    }

    UpdateOrderStatus(q, res){
        let that = this;
        let sql =
            "SELECT ord.*,  DATE_FORMAT(of.date,'%Y-%m-%d') as date" +
            " FROM  supplier as sup, offers as of, customer as cus, orders as ord"+
            " WHERE sup.email=\'"+q.supem+"\' AND sup.uid=\'"+q.uid+"\'" +
            " AND of.sup_uid=sup.uid AND cus.email=ord.cusem AND ord.cusem=\""+q.cusem+"\" AND ord.date=\""+q.date+"\"" +
            " AND ord.date=\'"+q.date+"\'"+
            " ORDER BY of.id DESC";

        global.con_obj.query(sql, function (err, sel) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            if (err) {
                res.end(JSON.stringify({err: err}));
                return;
            }
            let values, sql;
            if(sel.length>0) {
                values = [ q.status, sel[0].id];

                sql = "UPDATE orders SET status=? WHERE id=?";
            }
            global.con_obj.query(sql, values, function (err, result) {
                if (err) {
                    res.end(JSON.stringify({err: err}));
                    return;
                }
                res.end(JSON.stringify({result: result}));

                if(global.resObj[q.cusem] && global.resObj[q.cusem].connection.writable) {
                    sel[0].status = q.status;
                    global.resObj[q.cusem].write(utils.formatSSE({func:'updateorderstatus',order:sel[0]}));
                }
            });
        });
    }

    updatedict(q, res){

        var sql_select = "SELECT obj.id as obj_id, obj.data as data" +
            " FROM objects as obj" +
            " WHERE obj.latitude=" + admin.lat + " AND obj.longitude=" + admin.lon;

        global.con_obj.query(sql_select, function (err, result) {

            if (result.length > 0) {



            }else{

            }
        });
    }

    translate(q, res) {

        let data = JSON.parse(q.data);
        let to = q.to;
        let cnt = 0;
        res.writeHead(200, "OK", {'Content-Type': 'text/plain'});

        var curriedDoWork = function(obj,trans) {
            cnt++;
            console.log(trans.text + obj.key);
            obj.data[obj.key][obj.to] = trans.text;
            obj.data[obj.key][trans.from.language.iso] = obj.src;
            if(obj.length===cnt) {
                obj.res.end(JSON.stringify(obj.data));
            }

        };

        for(let w=0; w<Object.keys(data).length; w++) {
            let key = Object.keys(data)[w];
            let from = Object.keys(data[key])[0];
            let obj = {res:res,key:key, data:data, to:to, from:from, src:data[key][from],length:Object.keys(data).length};
            //https://github.com/matheuss/google-translate-api

            new translate(data[key][from], {to: to}).then(curriedDoWork.bind(null, obj),function (ev) {
                console.log(ev);
            });

        }

    }

    GetSuppliers(q, res){

//////////////////////////////////////////////////////////////////////////////////////////////////////
        let sql = " SELECT of.date as date, of.period as period, sup.email as email, of.categories as cats, " +
            "of.latitude as lat, of.longitude as lon, of.data as data, sup.dict as dict"+
            " FROM  supplier as sup, offers as of"+
            " WHERE sup.uid = of.sup_uid" +
            " AND of.latitude>="+ q.areas[0] +" AND of.latitude<="+q.areas[1] +
            " AND of.longitude>=" + q.areas[2] + " AND of.longitude<=" +q.areas[3]+
            " AND of.date=\""+q.date+"\"";

        global.con_obj.query(sql, function (err, result) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            if (err) {
                res.end(JSON.stringify({'err':err}));
                return;
            }
            let now = moment().format('YYYY-MM-DD');
            sql = "UPDATE "+ q.user+" SET region='"+q.areas.toString()+"', date=\""+now+"\" WHERE uid=\""+q.uid+"\"";

            global.con_obj.query(sql, function (err, result) {
                if (err) {
                    console.log(JSON.stringify({'err':err}));
                }
            });

            if(result.length>0) {
                for(let i in result) {
                    let cats = JSON.parse(result[i].cats);
                    if (intersection(cats, q.categories).length > 0) {

                    }else{
                        delete result[i];
                    }
                }

                res.write(urlencode.encode(JSON.stringify(result)));
            }

            res.end();

        });

    }

    ShareLocation(q, res){

        let sql = " SELECT sup.email as email" +
            " FROM supplier as sup" +
            " WHERE" +
            " SPLIT_STR(sup.region,',',1)<\'"+q.location[1]+"\' AND SPLIT_STR(sup.region,',',2)>'"+q.location[1]+"\'"+
            " AND SPLIT_STR(sup.region,',',3)<\'"+q.location[0]+"\' AND SPLIT_STR(sup.region,',',4)>'"+q.location[0]+"\'"+
            " UNION" +
            " SELECT cus.email as email" +
            " FROM customer as cus" +
            " WHERE " +
            " SPLIT_STR(cus.region,',',1)<'"+q.location[1]+ "' AND SPLIT_STR(cus.region,',',2)>'"+q.location[1]+"\'"+
            " AND SPLIT_STR(cus.region,',',3)<'"+q.location[0]+ "' AND SPLIT_STR(cus.region,',',4)>'"+q.location[0]+"\'";

        global.con_obj.query(sql, function (err, result) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            if (err) {
                res.end(JSON.stringify({'err': err}));
                return;
            }
            if(result.length>0){
                for(let r in result){
                    let sse = resObj[result[r].email];
                    if(sse){
                        sse.write(utils.formatSSE({"func":"sharelocation","email":q.supem,"location":q.location}));
                    }
                }

            }
            res.end(JSON.stringify({func: 'sharelocation',result:result.length}));

        });
    }


    GetOrders(q, res) {
        let sql = "SELECT ord.* " +
            " FROM orders as ord, supplier as sup" +
            " WHERE ord.supem=sup.email " +
            " AND LOWER(sup.uid)='" + q.uid+"' AND ord.date='"+q.date+"'"+
            " AND ord.status<>'deleted'";

        global.con_obj.query(sql, function (err, result) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            if (err) {
                console.log(JSON.stringify({'err':err}));
            }

            if(result.length>0){
                res.write(JSON.stringify(result));
            }
            res.end();
        });
    }
}
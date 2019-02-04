'use strict'
let D2D = require('./d2d')

let Email = require( "../email/email");
let moment = require('moment');

let utils = require('../utils');
let fs = require('fs');
var md5 = require('md5');
const shortid = require('shortid');
var isJSON = require('is-json');
var urlencode = require('urlencode');
const translate = require('google-translate-api');//ISO 639-1
var intersection = require('array-intersection');


var requrl = '';

module.exports = class Customer extends D2D{

    constructor(){
        super()
    }

    Auth(q, res, req) {
        let values, sql, uid;
        let psw = shortid.generate();
        if(q.user==='Customer'){
            uid = md5(new Date())
            values = [uid, psw,'tariff'];
            sql = "REPLACE INTO customer SET  uid=?, psw=?, tariff=?";
        }else if(q.user==='Supplier'){
            uid = md5(q.email);
            values = [uid, psw, q.email,'tariff'];
            sql = "REPLACE INTO supplier SET uid=?, psw=?, email=?, tariff=?";
        }
        global.con_obj.query(sql, values, function (err, result) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            try{
                if (err) {
                    res.end(JSON.stringify({err: err}));
                }else{
                    res.end(JSON.stringify({uid: uid,psw:psw}));
                }
            }catch(ex) {
                res.end(JSON.stringify({err: ex}));
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

    UpdateOrder(q, res){
        let that = this;
        let status;
        let now = moment().format('YYYY-MM-DD h:mm:ss');
        let sql =
            "SELECT ord.*"+ //, tar.options as tariff"+ // cus.email as cusuid,  DATE_FORMAT(of.date,'%Y-%m-%d') as date" +
            " FROM  supplier as sup, customer as cus, orders as ord" +
            //", tariff as tar"+
            " WHERE sup.uid=ord.supuid  AND ord.supuid=\'"+q.supuid+"\'  AND ord.cusuid=\'"+q.cusuid+"\'" +
            " AND cus.psw=\""+q.psw+"\"" +
            //" AND cus.tariff=tar.id AND tar.applicant=\"c\"" +
            " AND cus.uid=ord.cusuid AND ord.date=\""+q.date+"\"" +
            " ORDER BY ord.id DESC";

        global.con_obj.query(sql, function (err, sel) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            if (err) {
                res.end(JSON.stringify({err: err}));
                return;
            }
            let values, sql;
            if(sel.length>0) {
                values = [JSON.stringify(q.data), q.comment, q.period, q.address, now, sel[0].id];
                sql = 'UPDATE orders SET data=?, comment=?, period=?, address=?, published=? WHERE id=?';
            }else {
                values = [q.cusuid, q.supuid, JSON.stringify(q.data), q.comment,q.address, q.date, q.period,now];
                sql = 'INSERT INTO orders SET cusuid=?, supuid=?, data=?, comment=?, address=?, date=?, period=?, published=?';
            }
            global.con_obj.query(sql, values, function (err, result) {
                if (err) {
                    res.end(JSON.stringify({err: err}));
                    return;
                }

                if(global.resObj[q.supuid] && global.resObj[q.supuid].connection.writable) {
                    delete q.uid;
                    delete q.func;
                    delete q.proj;
                    resObj[q.supuid].write(utils.formatSSE({func: 'ordered', order: q}));
                }
                res.end(JSON.stringify({result: result, published:now}));

            });
        });
    }

    UpdateOrderStatus(q, res){
        let that = this;
        let sql =
            "SELECT ord.*,  DATE_FORMAT(of.date,'%Y-%m-%d') as date" +
            " FROM  supplier as sup, offers as of, customer as cus, orders as ord"+
            " WHERE sup.email=\'"+q.supuid+"\' AND sup.uid=\'"+q.uid+"\'" +
            " AND of.sup_uid=sup.uid AND cus.email=ord.cusuid AND ord.cusuid=\""+q.cusuid+"\" AND ord.date=\""+q.date+"\"" +
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

                if(global.resObj[q.cusuid] && global.resObj[q.cusuid].connection.writable) {
                    sel[0].status = q.status;
                    global.resObj[q.cusuid].write(utils.formatSSE({func:'updateorderstatus',order:sel[0]}));
                }
            });
        });
    }

    GetRating(q, res, cb){
        let sql = " SELECT sup.rating as rating"+
            " FROM  supplier as sup"+
            " WHERE sup.uid = '"+ q.supuid+"'";

        global.con_obj.query(sql, function (err, result) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            if (err) {
                res.end(JSON.stringify({'err': err}));
                return;
            }
            try {
                let rating = JSON.parse(result[0].rating);
                res.end(JSON.stringify({rating: rating.value}));

            }catch(ex){
                res.end();
            }

        });
    }

    RateSupplier(q, res, cb){
        let sql = " SELECT sup.rating as rating"+
            " FROM  supplier as sup"+
            " WHERE sup.uid = '"+ q.supuid+"'";

        global.con_obj.query(sql, function (err, result) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            if (err) {
                res.end(JSON.stringify({'err': err}));
                return;
            }
            try {
                let rating = {};
                if(result[0].rating) {
                    rating = JSON.parse(result[0].rating);
                    rating[q.cusuid] = q.value;

                }else{
                    rating[q.cusuid]=q.value;
                }

                let sum = 0, cnt = 0;
                for (let k in rating) {
                    if(k==='value')
                        continue;
                    sum += parseFloat(rating[k]);
                    cnt++;
                }

                rating.value = (sum/cnt).toFixed(1);

                sql = " UPDATE   supplier  SET rating='" + JSON.stringify(rating) +"'"+
                    " WHERE supplier.uid = '" + q.supuid+"'";
                global.con_obj.query(sql, function (err, result) {
                    if (err) {
                        res.end(JSON.stringify({'err': err}));
                        return;
                    }
                    res.end(JSON.stringify({rating: (sum/cnt).toFixed(1)}));
                });
            }catch(ex){
                res.end();
            }

        });
    }

    ShareLocation(q, res, cb){

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
            if (!res._header)
                res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
            if (err) {
                res.end(JSON.stringify({'err': err}));
                return;
            }
            if(result.length>0){
                for(let r in result){
                    let sse = resObj[result[r].email];
                    if(sse){
                        sse.write(utils.formatSSE({"func":"sharelocation","email":q.supuid,"location":q.location}));
                    }
                }
            }
            if(cb) {
                cb();
            }else{
                res.end(JSON.stringify({func: 'sharelocation', result: result.length}));
            }
        });
    }

    GetApproved(q, res) {

        let sql =
            "SELECT appr.* " +
            " FROM customer as cus, approved as appr" +
            " WHERE cus.uid='"+q.uid +"' AND appr.cusuid=cus.uid"+
            " AND appr.date='"+q.date+"'";

        global.con_obj.query(sql, function (err, result) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            if (err) {
                console.log(JSON.stringify({'err':err}));
            }

            if(result && result.length>0){
                res.write(JSON.stringify(result));
            }
            res.end();
        });
    }


}
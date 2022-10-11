'use strict'
let D2D = require('./d2d')

let Email = require( "../email/email");
let moment = require('moment');
var _ = require('lodash');
let utils = require('../utils');
let fs = require('fs');
var md5 = require('md5');
const shortid = require('shortid');
// var isJSON = require('is-json');
var urlencode = require('urlencode');
//const translate = require('google-translate-api');//ISO 639-1
// var intersection = require('array-intersection');

var requrl = '';

const IMG_SIZE_LIMIT = 500000;

module.exports = class Customer extends D2D{

    constructor(){
        super()
    }

    ConfirmEmail(q, ws) {

        let that = this;
        let sql = "SELECT user.*" +
            " FROM "+q.user.toLowerCase()+" as user" +
            " WHERE (user.email='"+q.profile.email+"') AND user.email<>''";

        this.mysql_con.query(sql, function (err, result) {
            if (err)
                throw err;

            function insertUser(uid, psw,q) {
                let now = moment().format('YYYY-MM-DD');
                let values = [uid, psw, q.profile.email, JSON.stringify(q.profile),now];
                let sql = "INSERT INTO " + q.user.toLowerCase() + " SET  uid=?, psw=?, email=?, profile=?, date=?";

                that.mysql_con.query(sql, values, function (err, result) {

                    if (err) {
                        ws.send(urlencode.encode(JSON.stringify({
                            func:q.func,
                            err: 'Неверные данные'})));
                        return;
                    } else {
                        ws.send(urlencode.encode(JSON.stringify({
                            func:q.func,
                            res: result, uid:uid, psw:psw, profile: q.profile
                        })));
                    }
                });
            }

            if (result.length > 0) {
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    "err": "the email is already in use"
                })));

            } else {
                let psw = shortid.generate();

                if(q.profile.avatar) {
                    that.replaceImg_2(q.profile.avatar, function (avatar) {
                        q.profile.avatar = avatar;
                        insertUser(q.uid, psw,q);
                    });
                }else{
                    insertUser(q.uid, psw,q);
                }


            }
        });
    }

    UpdProfile(q, ws) {
        let that = this;

        let values, sql;

        values = [JSON.stringify(q.profile), q.uid, q.psw];
        sql = "REPLACE INTO customer SET  profile=?,uid=?, psw=?";

        that.mysql_con.query(sql, values, function (err, result) {
            if (err) {
                throw err;
            }
            ws.send(urlencode.encode(JSON.stringify({
                func:q.func,
                profile: q.profile
            })));
        });
    }


    RegUser(q, ws) {

        let that = this;

        var sql =  "SELECT user.*, COUNT(em.email) as em_cnt"+
            " FROM "+q.user.toLowerCase()+" as user, (SELECT email FROM "+q.user.toLowerCase()+" WHERE email='"+q.profile.email+"') as em"+
            " WHERE  uid='"+q.uid+"' AND psw='"+q.psw+"'";


        this.mysql_con.query(sql, function (err, result) {
            if (err) {
                throw err;
            }

            if (result.length === 0) {
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    "err": "Аккаунт не используется в системе"
                })));
                return;
            } else {
                if(result[0].em_cnt>0){
                    ws.send(urlencode.encode(JSON.stringify({
                        func:q.func,
                        "err": "Email уже используется в системе"
                    })));
                    return;
                }
                let values, sql;
                if(result[0].profile)
                    if(JSON.parse(result[0].profile).email===q.profile.email) {
                        that.replaceImg_2(q.profile.avatar, function (avatar) {
                            that.replaceImg_2(q.profile.thmb, function (thmb) {
                                q.profile.avatar = avatar;
                                q.profile.thmb = thmb;
                                values = [q.profile.email, JSON.stringify(q.profile), result[0].id];
                                sql = "UPDATE  " + q.user.toLowerCase() + "  SET  email=?, profile=? WHERE id=?";
                                that.mysql_con.query(sql, values, function (err, res_upd) {

                                    if (err) {
                                        ws.send(urlencode.encode(JSON.stringify({
                                            func:q.func,
                                            err: err
                                        })));
                                        return;
                                    }
                                    ws.send(urlencode.encode(JSON.stringify({
                                        func:q.func,
                                        id: result[0].id
                                    })));
                                });
                            });
                        });
                    }
            }
        });
    }


    GetOrder(q, ws){
        let sql =
            "SELECT * " +
            " FROM orders as ord" +
            " WHERE ord.cusuid='"+q.uid+"'"+
            " AND ord.date='"+q.date+"'";

        this.mysql_con.query(sql, (err, result)=> {
            if (err) {
                throw err;
            }

            let resAr = [];
            if(result.length>0) {
                for(let i in result){
                    resAr.push(result[i]);
                }
            }

            ws.send(
                urlencode.encode(
                    JSON.stringify({
                            func: q.func,
                            result: resAr
                        }
                    )
                    , 'utf8')
            );
        });

    }

//     UpdateOrder(q, ws){
//         let that = this;
//         let status;
//         let now = moment().format('YYYY-MM-DD h:mm:ss');
//         let sql =
//             "SELECT ord.*"+ //, tar.options as tariff"+ // cus.email as cusuid,  DATE_FORMAT(of.date,'%Y-%m-%d') as date" +
//             " FROM  customer as cus, orders as ord" +
//             //", tariff as tar"+
//             " WHERE ord.supuid='"+q.supuid+"'  AND ord.cusuid='"+q.cusuid+"'" +
//             " AND cus.psw=\""+q.psw+"\"" +
//             //" AND cus.tariff=tar.id AND tar.applicant=\"c\"" +
//             " AND cus.uid=ord.cusuid AND ord.date=\""+q.date+"\"" +
//             " ORDER BY ord.id DESC";
//
//         this.mysql_con.query(sql, function (err, sel) {
//             if (err) {
//                 throw err;
//             }
//             ws.writeHead(200, {'Content-Type': 'application/json'});
//             let values, sql;
//             if(sel.length>0) {
//                 values = [JSON.stringify(q.data), q.comment, q.period, q.address, now, sel[0].id];
//                 sql = 'UPDATE orders SET data=?, comment=?, period=?, address=?, published=? WHERE id=?';
//             }else {
//                 values = [q.cusuid, q.supuid, JSON.stringify(q.data), q.comment,q.address, q.date, q.period,now];
//                 sql = 'INSERT INTO orders SET cusuid=?, supuid=?, data=?, comment=?, address=?, date=?, period=?, published=?';
//             }
//             that.mysql_con.query(sql, values, function (err, result) {
//                 if (err) {
//                     ws.send(JSON.stringify({err: err}));
//                     return;
//                 }
//
//                 if(global.resObj[q.supuid] && global.resObj[q.supuid].connection.writable) {
//                     delete q.uid; delete q.func; delete q.proj;
//                     resObj[q.supuid].write(utils.formatSSE({func: 'ordered', order: q}));
//                 }
//                 ws.send(JSON.stringify({result: result, published:now}));
//
//             });
//         });
//     }
//
    DeleteOrder(q, ws){
        let that = this;
        let sql =
            "SELECT ord.* "+
            " FROM orders as ord "+
            " WHERE ord.cusuid='"+q.cusuid+"' AND ord.date='"+q.date+"'"+
            " ORDER BY ord.id DESC";

        this.mysql_con.query(sql, function (err, ords) {
            if (err) {
                throw err;
            }

            let values, sql;
            if(ords.length>0) {
                for (let o in ords) {

                    let order = JSON.parse(ords[o].data);

                    if(order[q.order]) {

                        order[q.order]['deleted'] = moment().format('YYYY-MM-DD h:mm:ss');

                        values = [q.status, JSON.stringify(order), ords[o].id];

                        sql = "UPDATE orders SET status=?,data=? WHERE id=?";

                        that.mysql_con.query(sql, values, function (err, result) {
                            if (err) {
                                throw err;
                            }

                            ws.send(urlencode.encode(JSON.stringify({
                                func:q.func,
                                result: result
                            })));

                            if (global.resObj[q.supuid] && global.resObj[q.supuid].readyState===1) {
                                global.resObj[q.cusuid].send(urlencode.encode(JSON.stringify({
                                    func: q.func,
                                    order: q.title
                                })));
                            }
                        });

                    }else {
                        continue;
                    }
                }
            }
        });
    }
//
//
    GetStore(q, ws){

//////////////////////////////////////////////////////////////////////////////////////////////////////
        let sql = " SELECT " +
            " '"+q.date+"' as date, of.categories as cats, " +
            " of.latitude as lat, of.longitude as lon, of.radius, of.data as data, " +
            " of.deleted as deleted,"+
            " sup.uid as uid, sup.dict as dict, sup.profile as profile, sup.rating as rating " +
            " FROM  supplier as sup, " +
            //"promo, " +
            "offers as of" +
            " WHERE sup.uid ='"+q.supuid+"'"+
            " AND of.supuid = sup.uid"+
            // " AND LCASE(sup.promo)=LCASE(promo.code)"+
            " AND of.date  = (SELECT MAX(of.date) FROM offers as of WHERE of.supuid=sup.uid)"+
            " AND of.deleted IS NULL "+
            " UNION "+
            " SELECT " +
            " '"+q.date+"' as date, of.categories as cats, " +
            " of.latitude as lat, of.longitude as lon, of.radius, of.data as data, " +
            " of.deleted as deleted,"+
            " del.uid as uid, del.dict as dict, del.profile as profile, del.rating as rating " +
            " FROM  deliver as del, " +
            //"promo, " +
            "offers as of" +
            " WHERE del.uid ='"+q.supuid+"'"+
            " AND of.supuid = del.uid"+
            // " AND LCASE(sup.promo)=LCASE(promo.code)"+
            " AND of.date  = (SELECT MAX(of.date) FROM offers as of WHERE of.supuid=del.uid)"+
            " AND of.deleted IS NULL ";
        //console.log(sql);

        this.mysql_con.query(sql, (err, result)=> {
            if (err) {
                throw err;
            }

            if(result.length>0) {
                let resAr = [];

                for(let i in result){
                    let cats = JSON.parse(result[i].cats);
                    // if (intersection(cats.map(String), q.categories).length ===0)
                    //     continue;
                    let offer = JSON.parse(result[i].data);
                    for(let c in offer) {
                        _.remove(offer[c], function(n) {
                            return n.checked === 'false'
                        });
                    }

                    for(let c in offer) {
                        if(offer[c].length===0)
                            offer = _.omit(offer,c);
                    }

                    result[i].data = JSON.stringify(offer);
                    resAr.push(result[i]);
                }

                ws.send(
                    urlencode.encode(
                        JSON.stringify({
                            func:q.func,
                            resAr: resAr
                        }
                        )
                        ,'utf8')
                );
            }else {

            }
        });
    }

    GetRating(q, ws, cb){
        let sql = " SELECT sup.rating as rating"+
            " FROM  supplier as sup"+
            " WHERE sup.uid = '"+ q.supuid+"'";

        this.mysql_con.query(sql, function (err, result) {
            if (err) {
                throw err;
            }

            try {
                let rating = JSON.parse(result[0].rating);
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    rating: rating.value
                })));

            }catch(ex){

            }

        });
    }

    RateSupplier(q, ws, cb){
        let sql = " SELECT sup.rating as rating"+
            " FROM  supplier as sup"+
            " WHERE sup.uid = '"+ q.supuid+"'";

        this.mysql_con.query(sql, (err, result)=> {
            if (err) {
                throw err;
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
                this.mysql_con.query(sql, function (err, result) {
                    if (err) {
                        throw err;
                    }
                    ws.send(urlencode.encode(JSON.stringify({
                        func:q.func,
                        rating: (sum/cnt).toFixed(1)
                    })));
                });
            }catch(ex){

            }

        });
    }

    ShareLocation(q, ws, cb){

        let sql = " SELECT sup.email as email" +
            " FROM supplier as sup" +
            " WHERE" +
            " SPLIT_STR(sup.region,',',1)<'"+q.location[1]+"' AND SPLIT_STR(sup.region,',',2)>'"+q.location[1]+"'"+
            " AND SPLIT_STR(sup.region,',',3)<'"+q.location[0]+"' AND SPLIT_STR(sup.region,',',4)>'"+q.location[0]+"'"+
            " UNION" +
            " SELECT cus.email as email" +
            " FROM customer as cus" +
            " WHERE " +
            " SPLIT_STR(cus.region,',',1)<'"+q.location[1]+ "' AND SPLIT_STR(cus.region,',',2)>'"+q.location[1]+"'"+
            " AND SPLIT_STR(cus.region,',',3)<'"+q.location[0]+ "' AND SPLIT_STR(cus.region,',',4)>'"+q.location[0]+"'";

        this.mysql_con.query(sql, function (err, result) {
            if (err) {
                throw err;
            }

            if(result.length>0){
                for(let r in result){
                    let sse = resObj[result[r].email];
                    if(sse){
                        ws.send(urlencode.encode(JSON.stringify({
                            func:q.func,
                            email:q.supuid,
                            location:q.location
                        })));
                    }
                }
            }
            if(cb) {
                cb();
            }else{
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    result: result.length
                })));
            }
        });
    }


    UpdateOrder(q, ws){
        let that = this;
        let now = moment().format('YYYY-MM-DD h:mm:ss');
        let sql =
            "SELECT ord.*, sup.email as email, sup.dict as dict, ord.date as date"+
            " FROM  supplier as sup, orders as ord" +
            //", tariff as tar"+
            " WHERE sup.uid=ord.supuid  AND ord.supuid=\'"+q.supuid+"\'  AND ord.cusuid=\'"+q.cusuid+"\'" +
            " AND ord.date=\'"+q.date+"\'"+
            " UNION "+
            " SELECT ord.*, del.email as email, del.dict as dict, ord.date as date"+//  DATE_FORMAT(of.date,'%Y-%m-%d') as date" +
            " FROM  deliver as del, orders as ord" +
            " WHERE del.uid=ord.supuid  AND ord.supuid=\'"+q.supuid+"\'  AND ord.cusuid=\'"+q.cusuid+"\'" +
            " AND ord.date=\'"+q.date+"\'";


        this.mysql_con.query(sql, function (err, sel) {
            if (err) {
                throw err;
            }
            let sql_cmd = "REPLACE INTO"
            let statusObj = {};
            if(sel[0]) {
                //sql_cmd = "UPDATE";

                if(q.status!=='ordered')
                    statusObj = JSON.parse(sel[0].status);

                if (statusObj['approve'] && q.status!=='deleted') {
                    ws.send(urlencode.encode(JSON.stringify({
                        func: q.func,
                        err: sel
                    })));
                    return;
                }
            }

            q.status = now;
            statusObj = q.status;

            let values, sql;

            values = [q.cusuid, q.supuid, JSON.stringify(q.data), JSON.stringify(q.delivery), q.comment,q.address, q.date, q.period,JSON.stringify(statusObj)];
            sql = sql_cmd+' orders SET cusuid=?, supuid=?, data=?, delivery=?, comment=?, address=?, date=?, period=?, status=?';

            that.mysql_con.query(sql, values, function (err, result) {
                if (err) {
                    ws.send(urlencode.encode(JSON.stringify({
                        func: q.func,
                        err: err
                    })));
                    return;
                }

                let order="";
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    result:result,
                    published:now
                })));

                if(global.resObj[q.supuid] && global.resObj[q.supuid].readyState===1) {
                    delete q.uid;
                    delete q.func;
                    delete q.proj;
                    resObj[q.supuid].send(urlencode.encode(JSON.stringify({
                        func: q.func,
                        order: q
                    })));
                }

                try {

                    let cnt = 0;
                    if (sel[0] && sel[0].email) {

                        for (let i in q.data) {
                            // if (!ws._header)
                            //     ws.writeHead(200, {'Content-Type': 'application/json'});
                            // ws.send(JSON.stringify({i:i,dict:JSON.parse(sel[0].dict).dict}));
                            // return;
                            if (JSON.parse(sel[0].dict).dict[i] && JSON.parse(sel[0].dict).dict[i]['ru'])
                                order += (++cnt) + ". " + JSON.parse(sel[0].dict).dict[i]['ru'] + " " + q.data[i].pack + " Кол-во:" + q.data[i].qnty + " Цена:" + q.data[i].price + "<br>";
                        }


                        let em = new Email();
                        let html = "По вашему предложению был сформирован заказ:<br> " + order +
                            "<p>Для подтверждения заказа перейдите  <a href='https://delivery-angels.ru/d2d/dist/supplier.html?lang=ru&order_date=" + sel[0].date + "'>по ссылке</a>";

                        em.SendMail("nedol@yandex.ru", sel[0].email, "ДоТуДо. Оповещение о новом заказе", html, function (result) {

                        });
                    }
                }catch(ex){

                }
            });
        });
    }


}
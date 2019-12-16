'use strict'
let Email = require( "../email/email");
let moment = require('moment');

let utils = require('../utils');
let fs = require('fs');
let os = require('os');
var md5 = require('md5');
const shortid = require('shortid');

var urlencode = require('urlencode');
const translate = require('google-translate-api');//ISO 639-1
var intersection = require('array-intersection');

global.resObj = {};

var requrl = '';

module.exports = class D2D {

    constructor(){
        this.mysql_con;
    }
    dispatch(q, res, req, mysql_con) {
        this.mysql_con = mysql_con;

        requrl = req.headers.origin;

        if (q.sse) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });

            res.write(utils.formatSSE({msg:'sse'}));

            resObj[q.uid] = res;

        } else {
            try {
                switch (q.func) {
                    case 'confirmem':
                        this.ConfirmEmail(q, res);
                        break;
                    case 'reguser':
                        this.RegUser(q, res);
                        break;
                    case 'updprofile':
                        this.UpdProfile(q, res);
                        break;
                    case 'auth':
                        this.Auth(q, res);
                        break;
                    case 'getrating':
                        this.GetRating(q, res);
                        break;
                    case 'ratesup':
                        this.RateSupplier(q, res);
                        break;
                    case 'setsup':
                        this.SettingsSupplier(q, res);
                        break;
                    case 'getcomments':
                        this.GetComments(q,res);
                        break;
                    case 'setcomments':
                        this.SetComments(q,res);
                        break;
                    case 'updateorderstatus':
                        this.UpdateOrderStatus(q, res);
                        break;
                    case 'updateorder':
                        this.UpdateOrder(q, res);
                        break;
                    case 'approveorder':
                        this.ApproveOrder(q, res);
                        break;
                    case 'getoffers':
                        this.GetOffers(q, res);
                        break;
                    case 'updateoffer':
                        this.UpdateOffer(q, res);
                        break;
                    case 'translate':
                        this.translate(q, res);
                        break;
                    case 'getorder':
                        this.GetOrder(q, res);
                        break;
                    case 'getapproved':
                        this.GetApproved(q, res);
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
                res.end(JSON.stringify({err:ex}));
            }
        }
    }

    ConfirmEmail(q, res) {

        let that = this;
        let sql = "SELECT user.*" +
            " FROM "+q.user.toLowerCase()+" as user" +
            " WHERE (user.email='"+q.profile.email+"') AND user.email<>''";

        this.mysql_con.query(sql, function (err, result) {
            if (err)
                throw err;

            if (result.length > 0) {

                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({"err": "указанный email адрес используется в системе"}));

            } else {
                let values, sql, uid;
                let psw = shortid.generate();
                uid = md5(new Date()+q.profile.email);

                res.writeHead(200, {'Content-Type': 'application/json'});
                that.replaceImg_2(q.profile.avatar, function (avatar) {
                    setTimeout(function () {
                        that.replaceImg_2(q.profile.thmb, function (thmb) {
                            q.profile.avatar = avatar;
                            q.profile.thmb = thmb;
                            values = [uid, psw, q.profile.email,'tariff', q.promo, JSON.stringify(q.profile)];
                            sql = "INSERT INTO " + q.user.toLowerCase() + " SET  uid=?, psw=?, email=?, tariff=? ,promo=?, profile=?";

                            that.mysql_con.query(sql, values, function (err, result) {

                                if (err) {
                                    res.end(JSON.stringify({err: 'Неверные данные'}));
                                    return;
                                }else {

                                    let em = new Email();
                                    let html = "<a href=" + q.host + "/d2d/dist/"+q.user.toLowerCase()+".html?lang=ru&psw_hash="+md5(psw)+"><h1>Перейдите в приложение</h1></a><p>Удачной торговли!</p>";

                                    em.SendMail("d2d@nedol.ru", q.profile.email, "Подтверждение регистрации пользователя", html, function (result) {
                                        res.end(JSON.stringify({
                                            result: result,
                                            uid: uid,
                                            psw: psw,
                                            email: q.profile.email,
                                            avatar: q.profile.avatar,
                                            thmb:q.profile.thmb
                                        }));

                                        let values = [uid, q.profile.email, 'https://nedol.ru/d2d/dist/supplier.html?lang=ru&psw_hash='+md5(psw)];

                                        let sql = "INSERT INTO psw_hash SET  uid=?, email=?, url=?";
                                        that.mysql_con.query(sql, values, function (err, result) {

                                        });
                                    });

                                    if(q.profile.phone) {

                                    }
                                }
                            });
                        });
                    },100);
                });
            }
        });
    }


    RegUser(q, res) {

        let that = this;

        let values, sql, uid;

        if(q.psw_hash){

            let sql = "SELECT user.uid as uid, user.*," +
                " (SELECT data FROM offers WHERE supuid=uid ORDER BY date DESC LIMIT 1) as data, " +
                " (SELECT latitude FROM offers WHERE supuid=uid ORDER BY date DESC LIMIT 1) as lat, " +
                " (SELECT longitude FROM offers WHERE supuid=uid ORDER BY date DESC LIMIT 1) as lon " +
                " FROM "+q.user.toLowerCase()+" as user" +
                " WHERE MD5(user.psw)='"+q.psw_hash+"'";

            // if(!res._header)
            //     res.writeHead(200, {'Content-Type': 'application/json'});
            // res.end(JSON.stringify(sql));
            // return;

            this.mysql_con.query(sql, function (err, result) {
                if (err)
                    throw err;

                if (result.length > 0) {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({
                        [q.user.toLowerCase()]: result
                    }));
                }else{
                    newAcnt(that.mysql_con,q, res);
                }
            });

        }else {
            newAcnt(this.mysql_con,q, res);
        }

        function newAcnt(mysql_con,q, res) {

            let psw = shortid.generate();
            uid = md5(new Date()+psw);

            values = [uid, psw];
            sql = "INSERT INTO " + q.user.toLowerCase() + " SET  uid=?, psw=?";

            mysql_con.query(sql, values, function (err, result) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                if (err) {
                    res.end(JSON.stringify({err: JSON.stringify(err)}));
                    that.mysql_con.release();
                    return true;
                } else {
                    res.end(JSON.stringify({
                        result: result,
                        uid: uid,
                        psw: psw
                    }));
                    // let values = [uid, 'email', 'https://nedol.ru/d2d/dist/supplier.html?lang=ru&psw_hash='+md5(psw)];
                    //
                    // let sql = "INSERT INTO psw_hash SET  uid=?, email=?, url=?";
                    // mysql_con.query(sql, values, function (err, result) {
                    //
                    // });
                }
            });
        }
    }

    updateOfferDB(q, res, sql, values,now){
        let that = this;
        this.mysql_con.query(sql, values, function (err, result) {
            if (err) {
                throw err;
            }

            values = [q.dict, q.uid];
            sql = "UPDATE supplier SET dict=?  WHERE uid=?";
            that.mysql_con.query(sql, values, function (err, res_1){
                that.BroadcastOffer(q, res, function () {
                    if (!res._header)
                        res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
                    if (res.writable)
                        res.end(JSON.stringify({result: result,published:now}));
                });
            });
        });
    }

    replaceImg(offer, cb) {
        let ofobj = JSON.parse(offer);
        for(let tab in ofobj) {
            for (let item in ofobj[tab]) {

                if(ofobj[tab][item].img && ofobj[tab][item].img.src.includes('base64')) {

                    const base64Data = ofobj[tab][item].img.src.replace(/^data:([A-Za-z-+/]+);base64,/, '');
                    const hash = md5(base64Data);
                    fs.writeFile('../server/images/' + hash, base64Data, 'base64', (err) => {

                    });
                    offer = offer.replace(ofobj[tab][item].img.src,hash);
                }
                if(ofobj[tab][item].brand && ofobj[tab][item].brand.logo && ofobj[tab][item].brand.logo.includes('base64')) {

                    const base64Data = ofobj[tab][item].brand.logo.replace(/^data:([A-Za-z-+/]+);base64,/, '');
                    const hash = md5(base64Data);
                    fs.writeFile('../server/images/' + hash, base64Data, 'base64', (err) => {

                    });
                    offer = offer.replace(ofobj[tab][item].brand.logo,'https://nedol.ru/server/images/'+hash);
                }
                for(let c in ofobj[tab][item].cert){
                    if(!ofobj[tab][item].cert[c].src.includes('base64'))
                        continue;
                    const base64Data = ofobj[tab][item].cert[c].src.replace(/^data:([A-Za-z-+/]+);base64,/, '');
                    const hash = md5(base64Data);
                    fs.writeFile('../server/images/'+hash, base64Data, 'base64', (err) => {

                    });
                    offer = offer.replace(ofobj[tab][item].cert[c].src,hash);
                }
            }
        }
        cb(offer);
    }

    replaceImg_2(src, cb, res) {

        try {
            if (!src || src.includes('http')) {
                cb(src);
                return;
            }
        }catch(ex){
            cb(src);
            return;
        }

        const base64Data = src.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        const hash = md5(base64Data);
        let hn  = os.hostname();

        fs.writeFile('../server/images/'+hash, base64Data, 'base64', (err) => {
            cb(hash);
        });
    }

    BroadcastOffer(q, res, cb){

        let sql = " SELECT sup.uid as uid" +
            " FROM supplier as sup" +
            " WHERE" +
            " sup.uid<>'"+q.uid+"'"+
            " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(sup.region,',',1)," +
            "       LENGTH(SUBSTRING_INDEX(sup.region,',',1 -1)) + 1)," +
            "       ',', '')<"+q.location[1]+
            " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(sup.region,',',2)," +
            "       LENGTH(SUBSTRING_INDEX(sup.region,',',2 -1)) + 1)," +
            "       ',', '')>"+q.location[1]+
            " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(sup.region,',', 3)," +
            "       LENGTH(SUBSTRING_INDEX(sup.region,',', 3 -1)) + 1)," +
            "       ',', '')<"+q.location[0]+
            " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(sup.region,',', 4)," +
            "       LENGTH(SUBSTRING_INDEX(sup.region,',', 4 -1)) + 1)," +
            "       ',', '')>"+q.location[0]+
            " UNION" +
            " SELECT cus.uid as uid" +
            " FROM customer as cus" +
            " WHERE " +
            " REPLACE(SUBSTRING(SUBSTRING_INDEX(cus.region,',',1)," +
            "       LENGTH(SUBSTRING_INDEX(cus.region,',',1 -1)) + 1)," +
            "       ',', '')<"+q.location[1]+
            " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(cus.region,',',2)," +
            "       LENGTH(SUBSTRING_INDEX(cus.region,',',2 -1)) + 1)," +
            "       ',', '')>"+q.location[1]+
            " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(cus.region,',', 3)," +
            "       LENGTH(SUBSTRING_INDEX(cus.region,',', 3 -1)) + 1)," +
            "       ',', '')<"+q.location[0]+
            " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(cus.region,',', 4)," +
            "       LENGTH(SUBSTRING_INDEX(cus.region,',', 4 -1)) + 1)," +
            "       ',', '')>"+q.location[0];

        this.mysql_con.query(sql, function (err, sel) {
            if (err) {
                throw err;
            }
            if (!res._header)
                res.writeHead(200, "OK", {'Content-Type': 'text/plain'});

            if(sel.length>0){
                for(let r in sel){
                    let sse = resObj[sel[r].uid];
                    if(sse){
                        sse.write(utils.formatSSE({"func":"supupdate","obj":q}));
                    }
                }
            }

            if(cb) {
                cb(sel.length);
            }else{
                res.end(JSON.stringify({func: 'sharelocation', result: sel.length}));
            }
        });
    }

    UpdateOrder(q, res){
        let that = this;
        let status;
        let now = moment().format('YYYY-MM-DD h:mm:ss');
        let sql =
            "SELECT ord.*, sup.email as email, sup.dict as dict, ord.date as date"+//  DATE_FORMAT(of.date,'%Y-%m-%d') as date" +
            " FROM  supplier as sup, orders as ord" +
            //", tariff as tar"+
            " WHERE sup.uid=ord.supuid  AND ord.supuid=\'"+q.supuid+"\'  AND ord.cusuid=\'"+q.cusuid+"\'" +
            " AND ord.date=\'"+q.date+"\'"+
            " UNION "+
            "            SELECT ord.*, del.email as email, del.dict as dict, ord.date as date"+//  DATE_FORMAT(of.date,'%Y-%m-%d') as date" +
            "             FROM  deliver as del, orders as ord" +
            "             WHERE del.uid=ord.supuid  AND ord.supuid=\'"+q.supuid+"\'  AND ord.cusuid=\'"+q.cusuid+"\'" +
            "             AND ord.date=\'"+q.date+"\'";

        // if (!res._header)
        //     res.writeHead(200, {'Content-Type': 'application/json'});
        //
        // res.end(JSON.stringify(sql));
        // return;

        this.mysql_con.query(sql, function (err, sel) {

            if (err) {
                throw err;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});


            let values, sql;
            if(sel.length>0) {
                values = [JSON.stringify(q.data), q.comment, q.period, q.address, now, sel[0].id];
                sql = 'UPDATE orders SET data=?, comment=?, period=?, address=?, published=? WHERE id=?';
            }else {
                values = [q.cusuid, q.supuid, JSON.stringify(q.data), q.comment,q.address, q.date, q.period,now];
                sql = 'INSERT INTO orders SET cusuid=?, supuid=?, data=?, comment=?, address=?, date=?, period=?, published=?';
            }


            that.mysql_con.query(sql, values, function (err, result) {
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


                // if (!res._header)
                //     res.writeHead(200, {'Content-Type': 'application/json'});
                // res.end(JSON.stringify(sel[0].email));
                // return;
                let order="";
                let cnt = 0;
                if(sel[0].email) {

                    for(let i in q.data){
                        order+=(++cnt)+". "+JSON.parse(sel[0].dict).dict[i]['ru']+" "+q.data[i].pack+" Кол-во:"+ q.data[i].qnty +" Цена:"+q.data[i].price+"<br>";
                    }
                    let em = new Email();
                    let html = "По вашему предложению был сформирован заказ:<br> " +order+
                        "<p>Для подтверждения заказа перейдите  <a href='https://nedol.ru/d2d/dist/supplier.html?lang=ru&order_date="+sel[0].date+"'>по ссылке</a>";

                    em.SendMail("d2d@nedol.ru", sel[0].email, "ДоТуДо. Оповещение о новом заказе", html, function (result) {

                    });
                }
                res.write(JSON.stringify(order));
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

        this.mysql_con.query(sql, function (err, sel) {
            if (err) {
                throw err;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});

            let values, sql;
            if(sel.length>0) {
                values = [ q.status, sel[0].id];

                sql = "UPDATE orders SET status=? WHERE id=?";
            }
            that.mysql_con.query(sql, values, function (err, result) {
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

    updatedict(q, res){

        var sql_select = "SELECT obj.id as obj_id, obj.data as data" +
            " FROM objects as obj" +
            " WHERE obj.latitude=" + admin.lat + " AND obj.longitude=" + admin.lon;

        this.mysql_con.query(sql_select, function (err, result) {
            if (err) {
                throw err;
            }
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
        let that = this;
//////////////////////////////////////////////////////////////////////////////////////////////////////
        let sql =
            " SELECT " +
            " '"+q.date.split('T')[0]+"' as date, of.categories as cats, " +
            " of.latitude as lat, of.longitude as lon, of.radius, of.data as data, " +
            " of.published as published, of.deleted as deleted,"+
            " sup.uid as uid, sup.dict as dict, sup.profile as profile, sup.rating as rating, " +
            " apprs.totals as apprs"+//общее кол-во подтверждений
            " FROM  supplier as sup, promo, offers as of," +
            " (" +
            " SELECT COUNT(*) as  totals" +
            " FROM supplier as sup, approved as appr" +
            " WHERE appr.supuid=sup.uid" +
            " AND appr.date='"+q.date.split('T')[0]+"'" +
            " ) AS apprs"+
            " WHERE sup.uid = of.supuid"+
            " AND LCASE(sup.promo)=LCASE(promo.code)"+
            " AND of.latitude>="+ q.areas[0] +" AND of.latitude<="+q.areas[1] +
            " AND of.longitude>=" + q.areas[2] + " AND of.longitude<=" +q.areas[3]+
            " AND (of.date='"+q.date.split('T')[0]+"' OR " +
            " (sup.prolong=1 AND (SELECT id  FROM offers WHERE supuid LIKE sup.uid ORDER BY published DESC LIMIT 1)= of.id))" +
            " AND of.published IS NOT NULL AND of.deleted IS NULL " +
            " UNION" +
            " (SELECT '"+q.date.split('T')[0]+"' as date, of.categories as cats, " +
            " of.latitude as lat, of.longitude as lon, of.radius, of.data as data, " +
            " of.published as published, of.deleted as deleted,"+
            " del.uid as uid, del.dict as dict, del.profile as profile, del.rating as rating, " +
            " apprs.totals as apprs"+//общее кол-во подтверждений" +
            " FROM  deliver as del, offers as of," +
            " (" +
            " SELECT COUNT(*) as  totals" +
            " FROM deliver as del, approved as appr" +
            " WHERE appr.supuid=del.uid" +
            " AND appr.date='"+q.date.split('T')[0]+"'" +
            " ) AS apprs"+
            " WHERE " +
            " of.date in (SELECT MAX(offers.date) FROM offers WHERE supuid=del.uid)" +
            " AND del.uid = of.supuid"+
            // " AND of.latitude>="+ q.areas[0] +" AND of.latitude<="+q.areas[1] +
            // " AND of.longitude>=" + q.areas[2] + " AND of.longitude<=" +q.areas[3]+
            " AND (of.date='"+q.date.split('T')[0]+"' OR del.prolong=1)" +
            " AND of.published IS NOT NULL AND of.deleted IS NULL)";

        //
        // if (!res._header)
        //     res.writeHead(200, {'Content-Type': 'application/json'});
        // res.end(JSON.stringify(sql));
        // return;

        that.mysql_con.query(sql, function (err, result) {
            if (err) {
                throw err;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});

            // if (!res._header)
            //     res.writeHead(200, {'Content-Type': 'application/json'});
            // res.end(JSON.stringify(result));
            // return;

            let now = moment().format('YYYY-MM-DD');
            sql = "UPDATE "+ q.user+" SET region='"+q.areas.toString()+"', date='"+now+"' WHERE uid='"+q.uid+"'";

            that.mysql_con.query(sql, function (err, result) {
                if (err) {
                    throw err;
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

    GetRating(q, res, cb){
        let sql = " SELECT sup.rating as rating"+
            " FROM  supplier as sup"+
            " WHERE sup.uid = '"+ q.supuid+"'";

        this.mysql_con.query(sql, function (err, result) {
            if (err) {
                throw err;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});

            try {
                let rating = JSON.parse(result[0].rating);
                res.end(JSON.stringify({rating: rating.value}));

            }catch(ex){
                res.end();
            }

        });
    }

    GetComments(q, res) {
        let sql =
            "SELECT data" +
            " FROM comm" +
            " WHERE supuid='"+q.supuid +"'";

        this.mysql_con.query(sql, function (err, result) {
            if (err) {
                throw err;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});

            let array = [];
            for(let d in result) {
                array.push(JSON.parse(result[d].data));
            }
            res.end(JSON.stringify(array));
        });

    }

    SetComments(q,res){
        let that = this;
        this.replaceImg_2(q.data.profile_picture_url, (path)=> {
            try{
                q.data.profile_picture_url = path;
                let values = [q.supuid, JSON.stringify(q.data)];
                let sql = "REPLACE INTO comm SET supuid=?, data=?";
                that.mysql_con.query(sql, values, function (err, result) {

                    if (err) {
                        throw err;
                    }

                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end();
                });
            }catch(ex){
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({err:'Network err'}));
            }
        });

    }

}
// if (!res._header)
//     res.writeHead(200, {'Content-Type': 'application/json'});
// res.end(JSON.stringify(html));
// return;
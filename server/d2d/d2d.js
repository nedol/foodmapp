'use strict'
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

global.resObj = {};

var requrl = '';

module.exports = class D2D {

    constructor(){

    }
    dispatch(q, res, req) {

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
            " WHERE user.email='"+q.email+"'";

        global.con_obj.query(sql, function (err, result) {
            if (err)
                throw err;

            if (result.length > 0) {

                res.writeHead(200, {
                    'Content-Type': 'text/event-stream; charset=utf-8',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });
                res.end(JSON.stringify({"err":"указанный email адрес используется в системе"}));

            } else {
                let values, sql, uid;
                let psw = shortid.generate();
                uid = md5(q.email);

                res.writeHead(200, {'Content-Type': 'application/json'});

                values = [uid, psw, 'tariff',q.promo];
                sql = "INSERT INTO "+q.user.toLowerCase()+" SET  uid=?, psw=?, tariff=? ,promo=?";
                global.con_obj.query(sql, values, function (err, result) {
                    if (err) {
                        res.end(JSON.stringify({err:'Неверные данные'}));
                        return;
                    }

                    let em = new Email();
                    let html = "<a href=" + requrl + "/door2door/dist/" + q.user.toLowerCase() + ".html?uid=" + uid + "&email=" + q.email + "&lang=ru><h1>Перейдите в приложение</h1></a><p>That was easy!</p>";

                    em.SendMail("nedol.infodesk@gmail.com", q.email, "Подтверждение регистрации пользователя", html, function (result) {
                        res.end(JSON.stringify({uid: uid, psw: psw, email: q.email}));
                    });
                });
            }
        });
    }


    RegUser(q, res) {

        let that = this;

        var sql =  "SELECT user.*, COUNT(em.email) as em_cnt"+
            " FROM "+q.user.toLowerCase()+" as user, (SELECT email FROM "+q.user.toLowerCase()+" WHERE email='"+q.profile.email+"') as em"+
            " WHERE  uid='"+q.uid+"' AND psw='"+q.psw+"'";

        global.con_obj.query(sql, function (err, result) {
            if (err) {
                res.end();
                return;
            }
            res.writeHead(200, {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            if (result.length === 0) {
                res.end(JSON.stringify({"err": "Аккаунт не используется в системе"}));

            } else {
                if(result[0].em_cnt>0){
                    res.end(JSON.stringify({"err": "Email уже используется в системе"}));
                    return;
                }
                let values, sql;
                if(md5(q.profile.email)===q.uid)
                    that.replaceImg_2(q.profile.avatar,function (avatar) {

                        q.profile.avatar = avatar;
                        values = [q.profile.email,JSON.stringify(q.profile),result[0].id];
                        sql = "UPDATE  "+q.user.toLowerCase()+"  SET  email=?, profile=? WHERE id=?";
                        global.con_obj.query(sql, values, function (err, res_upd) {

                            if (err) {
                                res.end(JSON.stringify({err:err}));
                                return;
                            }
                            res.end(JSON.stringify({id:result[0].id,promo:result[0].promo}));
                        });

                    });
            }
        });
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


    updateOfferDB(q, res, sql, values,now){
        let that = this;
        global.con_obj.query(sql, values, function (err, result) {
            if (!res._header)
                res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
            if (err) {
                res.end(JSON.stringify({err: err}));
            }else {
                values = [q.dict, q.uid];
                sql = "UPDATE supplier SET dict=?  WHERE uid=?";
                global.con_obj.query(sql, values, function (err, res_1){
                    that.BroadcastOffer(q, res, function () {
                        if (!res._header)
                            res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
                        if (res.writable)
                            res.end(JSON.stringify({result: result,published:now}));
                    });
                });
            }
        });
    }

    replaceImg(offer, cb) {
        let ofobj = JSON.parse(offer);
        for(let tab in ofobj) {
            for (let item in ofobj[tab]) {
                if(!ofobj[tab][item].img.src || ofobj[tab][item].img.src.includes(requrl)>0)
                    continue;
                const base64Data = ofobj[tab][item].img.src.replace(/^data:([A-Za-z-+/]+);base64,/, '');
                const hash = md5(base64Data);
                fs.writeFile('../server/images/'+hash, base64Data, 'base64', (err) => {

                });
                for(let c in ofobj[tab][item].cert){
                    const base64Data = ofobj[tab][item].cert[c].src.replace(/^data:([A-Za-z-+/]+);base64,/, '');
                    const hash = md5(base64Data);
                    fs.writeFile('../server/images/'+hash, base64Data, 'base64', (err) => {

                    });

                    offer = offer.replace(ofobj[tab][item].cert[c].src,requrl+'/door2door/server/images/'+hash);
                }
                offer = offer.replace(ofobj[tab][item].img.src,requrl+'/door2door/server/images/'+hash);
            }
        }
        cb(offer);
    }

    replaceImg_2(src, cb) {
        try {
            if (!src || src.includes(requrl) > 0) {
                cb(src);
                return;
            }
        }catch(ex){
            cb(src);
            return;
        }
        const base64Data = src.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        const hash = md5(base64Data);

        fs.writeFile('../server/images/'+hash, base64Data, 'base64', (err) => {
            cb(requrl+'/door2door/server/images/'+hash);
        });
    }

    BroadcastOffer(q, res, cb){

        let sql = " SELECT sup.email as email" +
            " FROM supplier as sup" +
            " WHERE" +
            " sup.email<>\'"+q.email+"\'"+
            " AND SPLIT_STR(sup.region,',',1)<\'"+q.location[1]+"\' AND SPLIT_STR(sup.region,',',2)>'"+q.location[1]+"\'"+
            " AND SPLIT_STR(sup.region,',',3)<\'"+q.location[0]+"\' AND SPLIT_STR(sup.region,',',4)>'"+q.location[0]+"\'"+
            " UNION" +
            " SELECT cus.email as email" +
            " FROM customer as cus" +
            " WHERE " +
            " SPLIT_STR(cus.region,',',1)<'"+q.location[1]+ "' AND SPLIT_STR(cus.region,',',2)>'"+q.location[1]+"\'"+
            " AND SPLIT_STR(cus.region,',',3)<'"+q.location[0]+ "' AND SPLIT_STR(cus.region,',',4)>'"+q.location[0]+"\'";

        global.con_obj.query(sql, function (err, sel) {
            if (!res._header)
                res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
            if (err) {
                res.end(JSON.stringify({'err': err}));
                return;
            }
            if(sel.length>0){
                for(let r in sel){
                    let sse = resObj[sel[r].email];
                    if(sse){
                        sse.write(utils.formatSSE({"func":"supupdate","obj":q}));
                    }
                }
            }
            if(cb) {
                cb();
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
        let sql = " SELECT of.date as date, of.period as period, sup.uid as uid, of.categories as cats, " +
            " of.latitude as lat, of.longitude as lon, of.radius, of.data as data, sup.dict as dict, sup.profile as profile," +
            " sup.rating as rating, " +
            "apprs.totals as apprs"+//общее кол-во подтверждений
            " FROM  supplier as sup, offers as of," +
            " (" +
            " SELECT COUNT(*) as  totals" +
            " FROM supplier as sup, approved as appr" +
            " WHERE sup.uid=uid AND appr.supuid=sup.uid" +
            " AND appr.date='" + q.date + "'" +
            " ) AS apprs"+
            " WHERE sup.uid = of.supuid"+
            " AND of.latitude>="+ q.areas[0] +" AND of.latitude<="+q.areas[1] +
            " AND of.longitude>=" + q.areas[2] + " AND of.longitude<=" +q.areas[3]+
            " AND of.date=\""+q.date+"\" AND of.published IS NOT NULL AND of.deleted IS NULL";

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

    GetComments(q, res) {
        let sql =
            "SELECT data" +
            " FROM comm" +
            " WHERE supuid='"+q.supuid +"'";

        global.con_obj.query(sql, function (err, result) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            if (err) {
                console.log(JSON.stringify({'err':err}));
                res.end(JSON.stringify({'err':err}));
            }
            let array = [];
            for(let d in result) {
                array.push(JSON.parse(result[d].data));
            }
            res.end(JSON.stringify(array));
        });

    }

    SetComments(q,res){

        this.replaceImg_2(q.data.profile_picture_url, function (path) {
            q.data.profile_picture_url = path;
            let values = [q.supuid, JSON.stringify(q.data)];
            let sql = "REPLACE INTO comm SET supuid=?, data=?";
            global.con_obj.query(sql, values, function (err, result) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                if (err) {
                    console.log(JSON.stringify({'err':err}));
                }
                res.end();
            });
        });
    }

}
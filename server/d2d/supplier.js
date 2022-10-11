'use strict'
let D2D = require('./d2d')

let Email = require( "../email/email");

let utils = require('../utils');
let fs = require('fs');
var md5 = require('md5');
const shortid = require('shortid');
// var isJSON = require('is-json');
var urlencode = require('urlencode');
// const translate = require('google-translate-api');//ISO 639-1
// var intersection = require('array-intersection');
var urlencode = require('urlencode');

const _ = require('lodash');

let moment = require('moment');

var path = require('path');

const IMG_SIZE_LIMIT = 500000;

const MSG_NO_REG = 0x0001;

module.exports = class Supplier extends D2D{


    constructor(){
        super();
    }

    isValidSupplier(q, ws, cb){
        let that = this;

        var sql =  "SELECT sup.*"+
            " FROM  "+q.user.toLowerCase()+ " as sup"+
            " WHERE sup.uid='"+q.uid+"' AND sup.psw='"+q.psw+"'";

        this.mysql_con.query(sql, function (err, result) {
            if (err) {
                throw err;
            }

            cb(result);
        });

    }


    ConfirmEmail(q, ws) {

        let that = this;
        let sql = "SELECT user.*" +
            " FROM "+q.user.toLowerCase()+" as user" +
            " WHERE (user.email='"+q.profile.email+"') AND user.email<>''";


        this.mysql_con.query(sql, function (err, result) {
            if (err)
                throw err;

            if (result.length > 0) {
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    "err": "указанный email адрес используется в системе"})));

            } else {
                let values, sql, uid;
                let psw = shortid.generate();
                uid = md5(new Date()+q.profile.email);

                that.replaceImg_2(q.profile.avatar, function (avatar) {
                    setTimeout(function () {
                        that.replaceImg_2(q.profile.thmb, function (thmb) {
                            q.profile.avatar = avatar;
                            q.profile.thmb = thmb;
                            values = [uid, psw, q.profile.email,0, q.promo, JSON.stringify(q.profile)];
                            sql = "REPLACE INTO " + q.user.toLowerCase() + " SET  uid=?, psw=?, email=?, tariff=? ,promo=?, profile=?";

                            that.mysql_con.query(sql, values, function (err, result) {
                                if (err) {
                                    ws.send(urlencode.encode(JSON.stringify({
                                        func:q.func,
                                        err: {ru:'Неверные данные'+JSON.stringify(err),en:'Wrong data'}[q.profile.lang]})));
                                    return;
                                }else {
                                    let em = new Email();
                                    let text = {ru:"<h1>Перейдите в приложение</h1></a><p>Удачной торговли!</p>",en:"<h1>Go to the app</h1></a><p>Have a fun!</p>",fr:"<h1>Accéder à l'application</h1></a><p>Amusez-vous bien!</p>"}[q.profile.lang]
                                    let html = "<a href=" + q.host + "/d2d/dist/"+q.user.toLowerCase()+".html?market="+q.profile.market+"&lang="+q.profile.lang+"&psw_hash="+md5(psw)+">"+text;

                                    em.SendMail("nedol@narod.ru", q.profile.email, {ru:"Подтверждение регистрации пользователя",en:"User registration confirmation",fr:"Confirmation de l'enregistrement de l'utilisateur"}[q.profile.lang], html, function (result) {
                                        ws.send(urlencode.encode(JSON.stringify({
                                            func:q.func,
                                            result: result,
                                            uid: uid,
                                            psw: psw,
                                            email: q.profile.email,
                                            avatar: q.profile.avatar,
                                            thmb:q.profile.thmb
                                        })));

                                        let values = [uid, q.profile.email, 'https://delivery-angels.ru/d2d/dist/supplier.html?lang='+q.profile.lang+'&psw_hash='+md5(psw)];

                                        let sql = "INSERT INTO psw_hash SET  uid=?, email=?, url=?";
                                        that.mysql_con.query(sql, values, function (err, result) {

                                        });
                                    });

                                    if (q.profile.mobile) {
                                        var request = require('request');
                                        request.post('https://api.46elks.com/a1/sms', {
                                            auth: {
                                                username: 'uafd265749477ae9a9808a628b4f59c1a', // Specify your API username
                                                password: '3F7F13B62853F96EBE469761AA8477B2' // Specify your API password
                                            },
                                            form: {
                                                from : 'D2D', // The sender of the SMS, up to 11 characters
                                                to : q.profile.mobile, // The number that will receive the text message
                                                message : {ru:"Перейдите в приложение: ",en:"Go To App: "}[q.profile.lang] + q.host + "/d2d/dist/"+q.user.toLowerCase()+".html?lang="+q.profile.lang+"&psw_hash="+md5(psw),
                                            }
                                        }, function(err, ws, body) {
                                            if (ws.statusCode == 200) {
                                                console.log("Sent! The API responded:")
                                                console.log(JSON.parse(body))
                                            } else {
                                                console.log("Error:")
                                                console.log(body)
                                            }
                                        })
                                    }
                                }
                            });
                        });
                    },100);
                });
            }
        });
    }

    UpdProfile(q, ws) {

        let that = this;

        var sql =  "SELECT  *"+
            " FROM  "+q.user.toLowerCase()+
            " WHERE uid='"+q.uid+"' AND  psw='"+q.psw+"'";

        this.mysql_con.query(sql, function (err, result) {
            if (err)
                throw err;

            if (result.length > 0) {
                let profile,values, sql;

                if(!q.profile.avatar || fs.existsSync(path.join(__dirname, '../images/' + q.profile.avatar))){
                    values = [q.profile.email.toLowerCase(), JSON.stringify(q.profile), result[0].tariff, q.promo, q.uid, q.psw];
                    sql = "UPDATE "+q.user.toLowerCase()+ " SET email=?, profile=?, tariff=?, promo=? WHERE uid=? AND psw=?";

                    setTimeout(function () {

                        that.mysql_con.query(sql, values, function (err, result) {
                            if (err) {
                                throw err;
                            }

                            ws.send(urlencode.encode(JSON.stringify({
                                func:q.func,
                                profile: q.profile})));
                        });
                    },100);
                }else if(q.profile.avatar && q.profile.avatar.length<IMG_SIZE_LIMIT) {

                    that.replaceImg_2(q.profile.avatar, function (avatar) {
                        // if (!ws._header)
                        //     ws.writeHead(200, {'Content-Type': 'application/json'});
                        // ws.send(urlencode.encode(JSON.stringify(avatar));
                        // return;
                        q.profile.avatar = avatar;
                        values = [q.profile.email.toLowerCase(), JSON.stringify(q.profile), result[0].tariff, q.promo, q.uid, q.psw];

                        sql = "UPDATE  "+q.user.toLowerCase()+ " SET email=?, profile=?, tariff=?, promo=? WHERE uid=? AND psw=?";

                        setTimeout(function () {
                            that.mysql_con.query(sql, values, function (err, result) {
                                if (err) {
                                    throw err;
                                }
                                ws.send(urlencode.encode(JSON.stringify({
                                    func:q.func,
                                    profile: q.profile})));
                            });
                        },100);
                    },ws);
                }else{
                    ws.send(urlencode.encode(JSON.stringify({
                        func:q.func,
                        "err":"Превышен размер изображения"})));
                }
            }else{
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    err: 'Пройдите регистрацию'})));
            }
        });
    }

    UpdateOfferItem(q, ws){
        let that = this;

        this.isValidSupplier(q,ws, function (result) {

            if (result.length <=0) {
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    err:'Пройдите регистрацию',link:'https://delivery-angels.ru/d2d/dist/settings.supplier.en.html'
                })));
                return;
            }

            let now = moment().format('YYYY-MM-DD h:mm:ss');

            let sql =
                "SELECT of.*, sup.uid as supuid" +
                " FROM   "+q.user.toLowerCase()+ " as sup, offers as of"+
                " WHERE of.supuid=sup.uid AND sup.uid='" +q.uid+"'"+
                " AND (of.date<='"+q.date+"')" +
                " AND of.published IS NOT NULL AND of.deleted IS NULL"+
                " ORDER BY of.id DESC LIMIT 1";

            that.mysql_con.query(sql, function (err, sel) {
                if (err) {
                    throw err;
                }

                let values;

                if(sel.length>0) {
                    if (q.dict && q.offer) {// && result[0].obj_data.length<q.dict.length){

                        let item = urlencode.decode(q.offer);
                        that.replaceImg(item,function (item) {
                            let item_p = JSON.parse(item);
                            let offer = JSON.parse(sel[0].data);
                            let cat = Object.keys(item_p)[0];
                            let title = item_p[Object.keys(item_p)[0]][0].title;
                            let index = _.findIndex(offer[cat],{title:title});
                            if(index===-1) {
                                offer[cat].push(item_p[cat][0]);
                            }else {
                                offer[cat][index] = item_p[cat][0];
                            }

                            let catsAr = JSON.parse(sel[0].categories);
                            index = catsAr.indexOf(q.categories[0]);
                            if(index===-1) {
                                catsAr.push(q.categories[0]);
                            }
                            values = [JSON.stringify(offer), q.location[1], q.location[0], JSON.stringify(catsAr),  q.radius, sel[0].id];
                            let sql_upd = "UPDATE offers SET data=?, latitude=?, longitude=?, categories=?, radius=? WHERE id=?";
                            that.updateOfferDB(q, ws, sql_upd, values, now);
                            if(sel[0].deliver) {
                                //copy offer to deliver's offer
                                //that.updateOfferDeliver(q, ws, sel[0].deliver,offer);
                                //that.updateOfferDeliver(q, ws, sel[0].deliver,offer);//TODO:
                            }
                        });
                    }

                }else {
                    let offer = urlencode.decode(q.offer);
                    that.replaceImg(offer,function (offer) {
                        let date = moment(q.date).format('YYYY-MM-DD');
                        values = [q.uid,offer,JSON.stringify(q.categories), parseFloat(q.location[0]),parseFloat(q.location[1]), date, q.radius];

                        sql = 'REPLACE INTO offers SET supuid=?, data=?, categories=?, longitude=?, latitude=?, date=?, radius=?';

                        that.updateOfferDB(q, ws, sql, values,now);
                    });
                }
            });
        });
    }

    UpdateOffer(q, ws){
        let that = this;

        this.isValidSupplier(q,ws, function (result) {

            if (result.length <=0) {
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    err:'Пройдите регистрацию',link:'https://delivery-angels.ru/d2d/dist/settings.'+q.user.toLowerCase()+'.en.html'
                })));
                return;
            }

            let now = moment().format('YYYY-MM-DD h:mm:ss');

            let sql =
                "SELECT of.*, sup.uid as supuid, sup.misc as misc" +
                " FROM   "+q.user.toLowerCase()+ " as sup, offers as of"+
                " WHERE of.supuid=sup.uid AND sup.uid='" +q.uid+"'"+
                " AND (of.date='"+q.date+"')" +
                " AND of.published IS NOT NULL AND of.deleted IS NULL"+
                " ORDER BY of.id DESC";

            that.mysql_con.query(sql, function (err, sel) {
                if (err) {
                    throw err;
                }

                let values;

                if(sel.length>0) {
                    if (q.dict && q.offer) {// && result[0].obj_data.length<q.dict.length){

                        let offer = urlencode.decode(q.offer);
                        that.replaceImg(offer,function (offer) {
                            values = [offer, q.location[1], q.location[0], JSON.stringify(q.categories),  q.radius, sel[0].id];
                            let sql_upd = "UPDATE offers SET data=?, latitude=?, longitude=?, categories=?, radius=? WHERE id=?";
                            that.updateOfferDB(q, ws, sql_upd, values, now);
                            if(sel[0].deliver) {
                                //copy offer to deliver's offer
                                //that.updateOfferDeliver(q, ws, sel[0].deliver,offer);
                            }
                        });
                    }

                }else {
                    let offer = urlencode.decode(q.offer);
                    that.replaceImg(offer,function (offer) {
                        let date = moment(q.date).format('YYYY-MM-DD');
                        values = [q.uid,offer,JSON.stringify(q.categories), parseFloat(q.location[0]),parseFloat(q.location[1]), date, q.radius];

                        sql = 'REPLACE INTO offers SET supuid=?, data=?, categories=?, longitude=?, latitude=?, date=?, radius=?';

                        that.updateOfferDB(q, ws, sql, values,now);
                    });
                }
            });
        });
    }

    updateOfferDeliver(q, ws, deliver, offer){

        let sql =
            "SELECT of.*" +
            " FROM   "+q.user.toLowerCase()+ " as del, offers as of"+
            " WHERE del.uid=of.supuid AND del.uid='"+deliver+"'"+
            " AND of.date='"+q.date+"'";

        this.mysql_con.query(sql, (err, sel)=> {
            if (err) {
                throw err;
            }
            if(sel[0] && sel[0].data){
                let del_obj = JSON.parse(sel[0].data);
                let sup_obj = JSON.parse(offer);
                for(let tab in sup_obj){
                    for(let of in sup_obj[tab]) {
                        if(!del_obj[tab] || !del_obj[tab][of])
                            continue;
                        if (sup_obj[tab][of].title === del_obj[tab][of].title) {
                            let pl = sup_obj[tab][of].packlist;
                            for (let k in pl) {
                                let price = parseInt(pl[k]);
                                let t = pl[k].replace(price, '');
                                price = parseInt(pl[k]) * 1.2;//markup
                                pl[k] = price + t;
                            }
                            del_obj[tab][of].packlist = pl;
                            let values = [JSON.stringify(del_obj), sel[0].id];
                            sql = "UPDATE offers SET data=? WHERE id=?";
                            this.mysql_con.query(sql, values, function (err, sel) {
                                if (err) {
                                    ws.send(urlencode.encode(JSON.stringify({
                                        func:q.func,
                                        err: err})));
                                    return;
                                }
                            });
                        }
                    }
                }
            }
        });
    }

    updateOfferDB(q, ws, sql, values,now){
        let that = this;

        this.mysql_con.query(sql, values, function (err, result) {
            if (err) {
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    err: err
                })));
                return;
                throw err;
            }


            let offer = values[0];
            values = [q.dict, q.uid];
            sql = "UPDATE  "+q.user.toLowerCase()+ " SET dict=?  WHERE uid=?";
            setTimeout(function () {
                that.mysql_con.query(sql, values, function (err, res_1){
                    that.BroadcastOffer(q, ws, function () {
                         if (ws.readyState===1)
                            ws.send(urlencode.encode(JSON.stringify({
                                func:q.func,
                                result: result,published:now,offer:offer
                            })));
                    });
                });
            },100);

        });
    }

    BroadcastOffer(q, ws, cb){

        let sql = " SELECT sup.uid as uid" +
            " FROM "+q.user.toLowerCase()+" as sup" +
            " WHERE" +
            " sup.uid<>\'"+q.uid+"\'"+
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
  
            if(sel.length>0){
                for(let r in sel){
                    let sse = resObj[sel[r].uid];
                    if(sse){
                        sse.send(urlencode.encode(JSON.stringify({
                            func:q.func,
                            obj:q})));
                    }
                }
            }
            if(cb) {
                cb();
            }else{
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    result: sel.length
                })));
            }
        });
    }

    UpdateOrder(q, ws){
        let that = this;
        let status;
        let now = moment().format('YYYY-MM-DD h:mm:ss');
        let sql =
            "SELECT ord.*"+ //, tar.options as tariff"+ // cus.email as cusuid,  DATE_FORMAT(of.date,'%Y-%m-%d') as date" +
            " FROM   "+q.user.toLowerCase()+ " as sup, customer as cus, orders as ord" +
            //", tariff as tar"+
            " WHERE sup.uid=ord.supuid  AND ord.supuid=\'"+q.supuid+"\'  AND ord.cusuid=\'"+q.cusuid+"\'" +
            " AND cus.psw='"+q.psw+"'" +
            //" AND cus.tariff=tar.id AND tar.applicant='c'" +
            " AND cus.uid=ord.cusuid AND ord.date='"+q.date+"'" +
            " ORDER BY ord.id DESC";

        this.mysql_con.query(sql, (err, sel)=> {
            if (err) {
                throw err;
            }
  
            let values, sql;
            if(sel.length>0) {
                values = [JSON.stringify(q.data), q.comment, q.period, q.address, now, sel[0].id];
                sql = 'UPDATE orders SET data=?, comment=?, period=?, address=?, published=? WHERE id=?';
            }else {
                values = [q.cusuid, q.supuid, JSON.stringify(q.data), q.comment,q.address, q.date, q.period,now];
                sql = 'INSERT INTO orders SET cusuid=?, supuid=?, data=?, comment=?, address=?, date=?, period=?, published=?';
            }
            this.mysql_con.query(sql, values, function (err, result) {
                if (err) {
                    ws.send(urlencode.encode(JSON.stringify({
                        func:q.func,
                        err: err
                    })));
                    return;
                }

                if(global.resObj[q.supuid] && global.resObj[q.supuid].connection.writable) {
                    delete q.uid;
                    delete q.func;
                    delete q.proj;
                    resObj[q.supuid].write(utils.formatSSE({func: 'ordered', order: q}));
                }
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    result: result, published:now
                })));

            });
        });
    }

    ApproveOrder(q,ws){
            let that = this;
            let status;
            let now = moment().format('YYYY-MM-DD h:mm:ss');
            let sql =
                "SELECT ord.*"+ //, tar.options as tariff"+ // cus.email as cusuid,  DATE_FORMAT(of.date,'%Y-%m-%d') as date" +
                " FROM   "+q.user.toLowerCase()+ " as sup, customer as cus, orders as ord" +
                //", tariff as tar"+
                " WHERE sup.uid=ord.supuid  AND ord.supuid=\'"+q.supuid+"\'  AND ord.cusuid=\'"+q.cusuid+"\'" +
                " AND cus.psw='"+q.psw+"'" +
                //" AND cus.tariff=tar.id AND tar.applicant='c'" +
                " AND cus.uid=ord.cusuid AND ord.date='"+q.date+"'" +
                " ORDER BY ord.id DESC";

            this.mysql_con.query(sql, (err, sel)=> {
                if (err) {
                    throw err;
                }

                let values, sql;
                if(sel.length>0) {
                    values = [q.number, q.comment, now, q.status, sel[0].id];
                    sql = 'UPDATE orders SET number=?, comment=?,  published=?, status=? WHERE id=?';
                }else{
                    ws.send(urlencode.encode(JSON.stringify({
                        func:q.func,
                        result: {err:'no order',number:q.number}
                    })));
                    return;
                }
                this.mysql_con.query(sql, values, function (err, result) {
                    if (err) {
                        ws.send(urlencode.encode(JSON.stringify({
                            func:q.func,
                            err: err
                        })));
                        return;
                    }

                    delete q.uid;
                    delete q.func;
                    delete q.proj;

                    ws.send(urlencode.encode(JSON.stringify({
                        func:q.func,
                        result: result, published:now
                    })));

                });
            });
    }

    UpdateOrderStatus(q, ws){
        let that = this;
        let sql =
            "SELECT ord.*,  DATE_FORMAT(of.date,'%Y-%m-%d') as date" +
            " FROM   "+q.user.toLowerCase()+ " as sup, offers as of, customer as cus, orders as ord"+
            " WHERE sup.email='"+q.supuid+"' AND sup.uid='"+q.uid+"'" +
            " AND of.sup_uid=sup.uid AND cus.email=ord.cusuid AND ord.cusuid='"+q.cusuid+"' AND ord.date='"+q.date+"'" +
            " AND ord.date='"+q.date+"'"+
            " ORDER BY of.id DESC";

        this.mysql_con.query(sql, (err, sel)=> {
            if (err) {
                throw err;
            }
   
            let values, sql;
            if(sel.length>0) {
                values = [ q.status, sel[0].id];
                sql = "UPDATE orders SET status=? WHERE id=?";
            }
            this.mysql_con.query(sql, values, function (err, result) {
                if (err) {
                    throw err;
                }
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    result: result
                })));

                if(global.resObj[q.cusuid] && global.resObj[q.cusuid].connection.writable) {
                    sel[0].status = q.status;
                    global.resObj[q.cusuid].send(urlencode.encode(JSON.stringify({
                        func:q.func,
                        order:sel[0]
                    })));
                }
            });
        });
    }

    GetRating(q, ws, cb){
        let sql = " SELECT sup.rating as rating"+
            " FROM   "+q.user.toLowerCase()+ " as sup"+
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

    SettingsSupplier(q, ws, cb){
        let that = this;
        let sql = " SELECT *"+
            " FROM  "+q.user.toLowerCase()+" as sup"+
            " WHERE sup.uid = '"+ q.supuid+"' AND sup.psw = '"+q.psw+"'";

        this.mysql_con.query(sql, (err, result)=> {
            if (err) {
                throw err;
            }

            if (err) {
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    'err': err})));
                return;
            }
        });
    }

    ShareLocation(q, ws, cb){

        let sql = " SELECT sup.email as email" +
            " FROM "+q.user.toLowerCase()+" as sup" +
            " WHERE" +
            " SPLIT_STR(sup.region,',',1)<\'"+q.location[1]+"\' AND SPLIT_STR(sup.region,',',2)>'"+q.location[1]+"\'"+
            " AND SPLIT_STR(sup.region,',',3)<\'"+q.location[0]+"\' AND SPLIT_STR(sup.region,',',4)>'"+q.location[0]+"\'"+
            " UNION" +
            " SELECT cus.email as email" +
            " FROM customer as cus" +
            " WHERE " +
            " SPLIT_STR(cus.region,',',1)<'"+q.location[1]+ "' AND SPLIT_STR(cus.region,',',2)>'"+q.location[1]+"\'"+
            " AND SPLIT_STR(cus.region,',',3)<'"+q.location[0]+ "' AND SPLIT_STR(cus.region,',',4)>'"+q.location[0]+"\'";

        this.mysql_con.query(sql, function (err, result) {
            if (err) {
                throw err;
            }
            if (!ws._header)
                ws.writeHead(200, "OK", {'Content-Type': 'text/plain'});

            if(result.length>0){
                for(let r in result){
                    let sse = resObj[result[r].email];
                    if(sse){
                        sse.send(urlencode.encode(JSON.stringify({
                            func:q.func,
                            "email":q.supuid,"location":q.location
                        })));
                    }
                }
            }
            if(cb) {
                cb();
            }else{
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    result: result.length})));
            }
        });
    }

    GetOrder(q, ws) {

        // let sql =
        //     "SELECT ord.*, sup.dict" +
        //     " FROM orders as ord, "+q.user.toLowerCase()+"as sup, approved as appr" +
        //     " WHERE ord.supuid=sup.uid " +
        //     " AND sup.uid='" + q.uid+"' AND sup.psw='"+q.psw +"'"+
        //     " AND (ord.date='"+q.date+"'"+
        //     " OR ord.data NOT LIKE CONCAT('%',appr.title, '%') " +
        //     " AND DAY(appr.date)=DAY(NOW()))";

        let sql=
            " SELECT ord.*, sup.dict" +
            // ", cus.profile as cus_profile " +
            " FROM orders as ord, "+q.user.toLowerCase()+" as sup" +
            // ", customer as cus" +
            " WHERE ord.supuid=sup.uid " +
            // " AND cus.uid=ord.cusuid"+
            " AND sup.uid='" + q.uid+"'"+
            " AND sup.psw='"+q.psw +"'"+
            " AND ord.date='"+q.date+"'" ;
        // " UNION" +
        // " SELECT ord.*,NULL,NULL " +
        // " FROM  orders as ord,  approved as appr  " +
        // " WHERE  " +
        // " ord.date='"+q.date+"'" +
        // " AND appr.date=ord.date"+
        // " AND ord.data NOT LIKE CONCAT('%',appr.title, '%') "

        // ws.writeHead(200, {'Content-Type': 'application/json'});
        // ws.send(urlencode.encode(JSON.stringify(sql));
        // return;

        this.mysql_con.query(sql, function (err, result) {
            if (err) {
                throw err;
            }

            if(result && result.length>0){
                ws.send(urlencode.encode(JSON.stringify({
                    func:q.func,
                    result:result
                })));
            }

        });
    }



    UpdateOrder(q, ws){
        let that = this;
        let now = moment().format('YYYY-MM-DD h:mm:ss');
        let sql =
            "SELECT ord.*, sup.email as email, sup.dict as dict, ord.date as date"+//  DATE_FORMAT(of.date,'%Y-%m-%d') as date" +
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

            let statusObj = JSON.parse(sel[0].status);
            statusObj[q.status] = now;

            let values, sql;

            values = [q.number,q.comment,now,JSON.stringify(statusObj),q.cusuid, q.supuid, q.date];
            sql = 'UPDATE orders SET  number=?, comment=?, published=?, status=? WHERE cusuid=? AND supuid=? AND date=?';

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



    GetOffers(q, ws) {
        let sql = " SELECT off.*"+
            " FROM  "+q.user.toLowerCase()+" as sup, offers as off"+
            " WHERE sup.uid = '"+ q.uid+"' AND sup.psw = '"+q.psw+"'" +
            " AND off.supuid=sup.uid " +
            // " AND off.date<(NOW() + INTERVAL sup.prolong DAY)"+
            " AND off.date>NOW()";

        this.mysql_con.query(sql, function (err, result) {
            if (err) {
                throw err;
            }

            ws.send(urlencode.encode(JSON.stringify({
                func:q.func,
                offer:result})));
        });
    }
}

// ws.writeHead(200, {'Content-Type': 'application/json'});
// ws.send(urlencode.encode(JSON.stringify(result));
// return;
// return;

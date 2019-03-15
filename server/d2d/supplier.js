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

const IMG_SIZE_LIMIT = 500000;

module.exports = class Supplier extends D2D{


    constructor(){
        super()

    }


    UpdProfile(q, res) {

        let that = this;

        var sql =  "SELECT sup.*"+
            " FROM  supplier as sup"+
            " WHERE sup.uid='"+q.uid+"' AND sup.psw='"+q.psw+"'";

        global.con_obj.query(sql, function (err, result) {
            if (err)
                throw err;

            if (result.length > 0) {
                let profile,values, sql;
                if(q.profile.avatar && q.profile.avatar.length<IMG_SIZE_LIMIT &&
                    q.profile.thmb && q.profile.thmb.length<IMG_SIZE_LIMIT) {
                    that.replaceImg_2(q.profile.avatar, function (avatar) {
                        that.replaceImg_2(q.profile.thmb, function (thmb) {
                            q.profile.avatar = avatar;
                            q.profile.thmb = thmb;
                            q.profile.email = result[0].email;
                            values = [JSON.stringify(q.profile), result[0].tariff, q.uid, q.psw];
                            sql = "UPDATE supplier SET   profile=?, tariff=? WHERE uid=? AND psw=?";
                            setTimeout(function () {
                                global.con_obj.query(sql, values, function (err, result) {
                                    if (err) {
                                        throw err;
                                    }
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.end(JSON.stringify({profile: q.profile}));
                                });
                            },100);
                        });
                    });
                }else{
                    res.end(JSON.stringify({"err":"Превышен размер изображения"}));
                }
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

    OnClickUserProfile(li){

        $('#profile_container').css('display','block');
        $('#profile_container iframe').attr('src',"../src/profile/profile.customer.html");
        $('#profile_container iframe').off();
        $('#profile_container iframe').on('load',function () {
            $('#profile_container iframe')[0].contentWindow.InitProfileUser();

            $('.close_browser',$('#profile_container iframe').contents()).on('touchstart click', function (ev) {
                $('#profile_container iframe')[0].contentWindow.profile_cus.Close();
                $('#profile_container').css('display', 'none');
            });
        });
        this.MakeDraggable($( "#profile_container" ));
        $( "#profile_container" ).resizable({});



        //this.MakeDraggable($('body', $('#profile_container iframe').contents()));

    }

    UpdateOffer(q, res){
        let that = this;
        let now = moment().format('YYYY-MM-DD h:mm:ss');
        let sql =
            "SELECT of.*, sup.uid as supuid, deluid.uid as deliver" +
            " FROM  supplier as sup, offers as of, (SELECT del.uid FROM deliver as del WHERE LOCATE('"+q.uid+"',del.suppliers)>0) as deluid "+
            " WHERE of.supuid=sup.uid AND sup.uid=\""+q.uid+"\" AND sup.psw=\""+q.psw +"\"" +
            " AND of.date=\""+q.date+"\" AND of.published IS NOT NULL AND of.deleted IS NULL"+
            " ORDER BY of.id DESC";

        global.con_obj.query(sql, function (err, sel) {
            if (err) {
                throw err;
            }
            let values;
            if(sel.length>0) {
                if (q.dict && q.offer) {// && result[0].obj_data.length<q.dict.length){
                    let offer = urlencode.decode(q.offer);
                    that.replaceImg(offer,function (offer) {
                        values = [offer, q.location[1], q.location[0], q.radius, sel[0].id];
                        let sql_upd = "UPDATE offers SET data=?, latitude=?, longitude=?, radius=? WHERE id=?";
                        that.updateOfferDB(q, res, sql_upd, values, now);
                        if(sel[0].deliver) {
                            //copy offer to deliver's offer
                            //that.updateOfferDeliver(q, res, sel[0].deliver,offer);
                        }
                    });
                }
                if(sel[0].prolong>0){
                    let date = moment(q.date).add(sel[0].prolong, 'days').format('YYYY-MM-DD');

                    let sql_ins = "REPLACE INTO offers SET ";
                    for(let key in sel[0]){
                        if(key==='id')
                            continue;
                        if(key==='date')
                            sql_ins += key+"='"+date+"',";
                        else
                            sql_ins += key+"='"+sel[0][key]+"',";
                    }
                    sql_ins = sql_ins.replace(/,(\s+)?$/, '');
                    global.con_obj.query(sql_ins,function (err, sel) {
                        if (err) {
                            res.end(JSON.stringify({err: err}));
                            return;
                        }
                    });
                }

            }else {
                let offer = urlencode.decode(q.offer);
                that.replaceImg(offer,function (offer) {
                    values = [q.uid,offer,JSON.stringify(q.categories), q.location[0].toFixed(6),q.location[1].toFixed(6), q.date];
                    sql = 'REPLACE INTO offers SET supuid=?, data=?, categories=?, longitude=?, latitude=?, date=?';
                    that.updateOfferDB(q, res, sql, values,now);
                });
            }

        });
    }

    updateOfferDeliver(q, res, deliver, offer){

        let sql =
            "SELECT of.*" +
            " FROM  deliver as del, offers as of"+
            " WHERE del.uid=of.supuid AND del.uid=\""+deliver+"\""+
            " AND of.date=\""+q.date+"\"";

        global.con_obj.query(sql, function (err, sel) {
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
                            global.con_obj.query(sql, values, function (err, sel) {
                                if (err) {
                                    res.write(JSON.stringify({err: err}));
                                    return;
                                }
                            });
                        }
                    }
                }
            }
        });
    }

    updateOfferDB(q, res, sql, values,now){
        let that = this;
        global.con_obj.query(sql, values, function (err, result) {
            if (err) {
                throw err;
            }

            res.writeHead(200, "OK", {'Content-Type': 'text/plain'});

            values = [q.dict, q.uid];
            sql = "UPDATE supplier SET dict=?  WHERE uid=?";
            setTimeout(function () {
                global.con_obj.query(sql, values, function (err, res_1){
                    that.BroadcastOffer(q, res, function () {
                        if (!res._header)
                            res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
                        if (res.writable)
                            res.end(JSON.stringify({result: result,published:now}));
                    });
                });
            },100);

        });
    }

    BroadcastOffer(q, res, cb){

        let sql = " SELECT sup.uid as uid" +
            " FROM supplier as sup" +
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

        global.con_obj.query(sql, function (err, sel) {
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

    ApproveOrder(q,res){
        let now = moment().format('YYYY-MM-DD h:mm:ss');
        let values = [q.date,q.period, q.supuid, q.cusuid, q.title, JSON.stringify(q.data)];
        let sql = "REPLACE INTO approved SET date=?, period=?, supuid=?, cusuid=?, title=?, data=?";
        global.con_obj.query(sql, values, function (err, result) {
            if (err) {
                throw err;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});

            if(global.resObj[q.cusuid] && global.resObj[q.cusuid].connection.writable) {
                delete q.uid;
                delete q.func;
                delete q.proj;
                resObj[q.cusuid].write(utils.formatSSE({func: 'approved', order: q}));
            }
            res.end(JSON.stringify({result: result, approved:now}));

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
            if (err) {
                throw err;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});

            let values, sql;
            if(sel.length>0) {
                values = [ q.status, sel[0].id];

                sql = "UPDATE orders SET status=? WHERE id=?";
            }
            global.con_obj.query(sql, values, function (err, result) {
                if (err) {
                    throw err;
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

    SettingsSupplier(q, res, cb){
        let that = this;
        let sql = " SELECT *"+
            " FROM  supplier as sup"+
            " WHERE sup.uid = '"+ q.supuid+"' AND sup.psw = '"+q.psw+"'";

        global.con_obj.query(sql, function (err, result) {
            if (err) {
                throw err;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});

            that.replaceImg_2(q.profile.avatar,function (path) {
                q.profile.avatar = path;
                let values = [JSON.stringify(q.profile), q.settings.prolong];
                sql = " UPDATE   supplier  SET  profile=?, prolong=?"+
                    " WHERE supplier.uid = '" + q.uid+"'";
                global.con_obj.query(sql, values,function (err, result) {
                    if (err) {
                        res.end(JSON.stringify({'err': err}));
                        return;
                    }
                    res.end();
                });
            });
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
            if (err) {
                throw err;
            }
            if (!res._header)
                res.writeHead(200, "OK", {'Content-Type': 'text/plain'});

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

    GetOrder(q, res) {

        // let sql =
        //     "SELECT ord.*, sup.dict" +
        //     " FROM orders as ord, supplier as sup, approved as appr" +
        //     " WHERE ord.supuid=sup.uid " +
        //     " AND sup.uid='" + q.uid+"' AND sup.psw='"+q.psw +"'"+
        //     " AND (ord.date='"+q.date+"'"+
        //     " OR ord.data NOT LIKE CONCAT('%',appr.title, '%') " +
        //     " AND DAY(appr.date)=DAY(NOW()))";

         let sql=
             " SELECT ord.*, cus.profile as profile, sup.dict " +
             " FROM orders as ord, supplier as sup, customer as cus" +
             " WHERE ord.supuid=sup.uid  AND ord.cusuid=cus.uid" +
             " AND sup.uid='" + q.uid+"'"+
             " AND sup.psw='"+q.psw +"'"+
             " AND ord.date='"+q.date+"'" +
             " UNION" +
             " SELECT ord.*,NULL,NULL " +
             " FROM  orders as ord,  approved as appr  " +
             " WHERE  " +
             " ord.date='"+q.date+"'" +
             " AND appr.date=ord.date"+
             " AND ord.data NOT LIKE CONCAT('%',appr.title, '%') ";


        global.con_obj.query(sql, function (err, result) {
            if (err) {
                throw err;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});

            if(result && result.length>0){
                res.write(JSON.stringify(result));
            }
            res.end();
        });
    }


    GetApproved(q, res) {

        let sql =
            "SELECT appr.* " +
            " FROM supplier as sup, approved as appr" +
            " WHERE sup.uid='"+q.uid +"' AND appr.supuid=sup.uid"+
            " AND appr.date='"+q.date+"'";

        global.con_obj.query(sql, function (err, result) {
            if (err) {
                throw err;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});


            if(result && result.length>0){
                res.write(JSON.stringify(result));
            }
            res.end();
        });
    }



    GetOffers(q, res) {
        let sql = " SELECT off.*"+
            " FROM  supplier as sup, offers as off"+
            " WHERE sup.uid = '"+ q.uid+"' AND sup.psw = '"+q.psw+"'" +
            " AND off.supuid=sup.uid " +
            " AND off.date<(NOW() + INTERVAL sup.prolong DAY)"+
            " AND off.date>NOW()"+
            " AND sup.prolong>0";
        global.con_obj.query(sql, function (err, result) {
            if (err) {
                throw err;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});

            res.end(JSON.stringify({offer:result}));
        });
    }
}
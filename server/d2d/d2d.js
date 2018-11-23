'use strict'

let utils = require('../utils');
var md5 = require('md5');
var isJSON = require('is-json');
var urlencode = require('urlencode');
const translate = require('google-translate-api');//ISO 639-1

var intersection = require('array-intersection');

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

        } else {
            try {
                switch (q.func) {
                    case 'init':
                        this.init(q, res);
                        break;
                    case 'auth':
                        this.auth(q, res);
                        break;
                    case 'getreserved':
                        this.getreserved(q, res);
                        break;
                    case 'updatereservation':
                        this.updatereservation(q, res);
                        break;
                    case 'updateorder':
                        if (q.admin)
                            this.updateorderadmin(q, res);
                        else
                            this.updateorderuser(q, res);
                        break;
                    case 'UpdateOffer':
                        this.UpdateOffer(q, res);
                        break;
                    case 'translate':
                        this.translate(q, res);
                        break;
                    case 'updatedict':
                        this.updatedict(q, res);
                        break;
                    case 'upd_reserve':
                        res.writeHead(200, {'Content-Type': 'text/event-stream'});
                        res.end(JSON.stringify({'data': 'no data'}));
                        break;
                    case 'getorderupd':
                        this.getorderupd(q, res);
                        break;
                    case 'upd_order_admin':
                        let order;
                        if (isJSON(q.order_data)) {
                            order = JSON.parse(q.order_data);
                        } else {
                            //console.log('Wrong data format');
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            res.end('Wrong data format');
                            return;
                        }
                        res.writeHead(200, {'Content-Type': 'text/event-stream'});
                        if (global.upd_order_admin)
                            if (order.table === global.upd_order_admin.data.table && order.date === global.upd_order_admin.data.date) {
                                res.end(JSON.stringify(global.upd_order_admin));
                                break;
                            }
                        res.end(JSON.stringify({data: 'no data'}));
                        break;

                    case 'get_suppliers':
                        this.GetSuppliers(q, res);
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


    auth(q, res) {

        var sql = "SELECT obj.id, obj.owner, obj.data as obj_data, o.data as menu_data" +
            " FROM  objects as obj, orders as o" +
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

    handleMysqlResult(q, res, result){

        var ColorHash = require('color-hash');
        var order = {"reseed": []};

        if(!result[0].reserved || md5(result[0].reserved) === q.order_hash){
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({"offer":md5(result[0].order_data)}));
            return;
        }

        if(!result[0].order_data) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({"offer":'undefined'}));
            return;

        }else {

            let user = (isJSON(urlencode.decode(q.user)) ? JSON.parse(urlencode.decode(q.user)) : q.admin);

            let data;
            if (!result[0].reserved){
                data = "";
            }
            else if(isJSON(result[0].reserved)) {
                data = JSON.parse(result[0].reserved);
            }else {
                //console.log('Wrong data format');
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end('Wrong data format');
                return;
            }

            let order_data = isJSON(result[0].order_data)?JSON.parse(result[0].order_data):result[0].order_data;
            var order = {"reserved": {}, "offer": order_data};
            if (result[0].reserved && result[0].reserved!=='undefined') {
                if(q.admin){
                    var users = data;
                    for (var u in users) {
                        order.reserved[u] = users[u];
                    }
                }else if(q.user){
                    for(let t in data) {
                        for (let u in data[t]) {
                            if(!order.reserved[t])
                                order.reserved[t] = {};
                            if (user && user.uid !== u) {
                                data[t][md5(u)] = Object.assign({}, (data[t][u]));
                                delete  data[t][u];
                                order.reserved[t][md5(u)] = data[t][md5(u)];
                            } else {
                                order.reserved[t][u] = data[t][u];
                            }
                        }
                    }
                }
            }
            order.order_hash = md5(result[0].reserved);
            order.reserved = urlencode.encode(JSON.stringify(order.reserved));
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(order));
        }

    }

    getreserved(q, res){
        this.select_query(q, res);
    }

    updateorderuser(q, res){

        var sql_select = "SELECT o.reserved, o.id as order_id" +
            " FROM  orders as o, objects as obj" +
            " WHERE obj.latitude=" + q.lat + " AND obj.longitude=" + q.lon  +
            " AND DATE_FORMAT(o.date,'%Y-%m-%d')='" + q.date + "'" ;

        global.con_obj.query(sql_select, function (err, result) {
            if (err){
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({err:err}));
                return;
            }

            let select;
            if(isJSON(result[0].reserved)) {
                select = JSON.parse(result[0].reserved);
            }else{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end();
                return;
            }
            let order;
            if(isJSON(urlencode.decode(q.order))){
                order = JSON.parse(urlencode.decode(q.order));
            }else{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end();
                return;
            }

            let table = q.table;
            let menu = q.offer;
            let time = q.time;
            let user;
            let duser = urlencode.decode(q.user);
            let dadmin = urlencode.decode(q.admin);
            if(dadmin!=="undefined" && isJSON(dadmin)) {
                user = JSON.parse(dadmin);
            }
            if(duser!=="undefined"  && isJSON(duser)) {
                user = JSON.parse(duser);
            }

            if(!select[time])
                select[time] = {};
            if(!select[time][user.uid])
                select[time][user.uid] = {};
            if(!select[time][user.uid][table])
                select[time][user.uid][table] = {};

            if (order[table])
                select[time][user.uid][table] = order[table];

// res.writeHead(200, {'Content-Type': 'application/json'});
// res.end();
// return;
            var sql = "UPDATE orders SET reserved='" + JSON.stringify(select) + "'" +
                " WHERE id=" + result["0"].order_id;


            global.con_obj.query(sql, function (err, result) {
                if (err){
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({err:err}));
                    return;
                }
                if (result) {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({msg:'The oder was updated'}));

                    this.SetOrderUpd(JSON.stringify({data:{date:q.date,func:'GetOrder'}}));
                    setTimeout(function () {
                        process.env.upd_order = JSON.stringify({data:'no data'});
                    },1500);
                }
            });
        });
    }

    SetOrderUpd(data){
        process.env.upd_order = data;
    }

    updateorderadmin(q, res){

        let user;
        let duser =urlencode.decode(q.user);
        let dadmin =urlencode.decode(q.admin);
        if(dadmin!=="undefined"  && isJSON(dadmin)) {
            user = JSON.parse(dadmin);
        }else{
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end();
            return;
        }
        if(duser!=="undefined"  && isJSON(duser)) {
            user = JSON.parse(duser);
        }

        var sql_select = "SELECT o.reserved, o.id as order_id" +
            " FROM  orders as o, objects as obj" +
            " WHERE obj.latitude=" + q.lat + " AND obj.longitude=" + q.lon  +
            " AND DATE_FORMAT(o.date,'%Y-%m-%d')='" + q.date + "'" ;


        global.con_obj.query(sql_select, function (err, result) {
            if (err ||  !result[0]) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({err: err}));
                return;
            }

            let order ;
            if(isJSON(urlencode.decode(q.order))){
                order = JSON.parse(urlencode.decode(q.order));
            }else{
                this.getreserved(q, res);
                return;
            }

            var sql = "UPDATE orders SET reserved='" + JSON.stringify(order) + "'" +
                " WHERE id=" + result["0"].order_id;

            global.con_obj.query(sql, function (err, result) {
                if (err){
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({err:err}));
                    return;
                }
                if (result) {
                    this.getreserved(q, res, this._connection);
                    global.upd_order_admin =
                        {data:{func:'UpdateOrderAdmin',date:q.date,order:order}};
                    setTimeout(function () {
                        global.upd_order_admin = null;
                    }, 1100);
                }
            });
        });
    }

    UpdateOffer(q, res){

        let offer = urlencode.decode(q.offer);
        if(isJSON(offer)){
            offer = JSON.parse(offer);
        }else{
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end();
            return;
        }

        var sql_select =
            "SELECT o.id as offer_id, o.data as offer, DATE_FORMAT(o.date,'%Y-%m-%d') as date" +
            " FROM  offers as o, supplier as sup" +
            " WHERE o.sup_uid=sup.uid AND sup.uid=\""+q.supplier+"\""+
            " AND date=\""+q.date+"\""+
            " ORDER BY o.id DESC";

        global.con_obj.query(sql_select, function (err, result) {
            if (err) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({err: err}));
                return;
            }
            let values;
            if(result.length>0) {
                if (q.dict && result[0].offer) {// && result[0].obj_data.length<q.dict.length){
                    let data = JSON.parse(result[0].offer);
                    let dict = q.dict;

                    data.dict = JSON.parse(dict);
                    values = [JSON.stringify(data)];

                    var sql = "UPDATE offers SET data=?   WHERE id=" + result[0].offer_id;
                    //console.log(sql);

                    global.con_obj.query(sql, values, function (err, result) {
                        if (result) {

                        }
                    });
                }

                if (new Date(result[0].date) >= new Date(q.date)) {
                    values = [urlencode.decode(q.offer), result[0].order_id, q.date];
                    var sql =
                        ' UPDATE offers SET  data=?' +
                        ' WHERE id =? AND DATE_FORMAT(date,"%Y-%m-%d")  =?';
                }
            }else{
                values = [q.supplier,JSON.stringify(offer),q.date,q.period];
                var sql = 'INSERT INTO offers SET sup_uid=?, data=?, date=?, period=?';
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

    updatereservation(q, res){

        var sql = "SELECT *, o.id as order_id " +
            " FROM  orders as o, objects as obj" +
            " WHERE  o.obj_id=obj.id AND obj.latitude=" + q.lat + " AND obj.longitude=" + q.lon +
            " AND DATE_FORMAT(o.date,'%Y-%m-%d')='" + q.date + "'";

        global.con_obj.query(sql, function (err, result) {
            if (err){
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({err:err}));
                return;
            }

            if(!result[0]){
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({msg:'No reservation data for the date'}));
                return;
            }

            let user;
            if(isJSON(urlencode.decode(q.user))){
                user = JSON.parse(urlencode.decode(q.user));
            }else{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end();
                return;
            }
            let menus;
            if((q.menus && isJSON(urlencode.decode(q.menus)) || q.menus==="{}")) {
                menus = JSON.parse(urlencode.decode(q.menus));
            }else{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end();
                return;
            }
            let time = q.time;
            let query = {[time]:{[user.uid]:{email:user.email,uname:user.uname, [q.table]:menus}}};
            let cancel = false;
            let input = {};

            if(result[0].reserved && result[0].reserved!=='undefined') {
                var select;
                if(isJSON(result[0].reserved)){
                    select = JSON.parse(result[0].reserved);
                }else{
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end();
                    return;
                }
                input = Object.assign({}, select);
                if(!input[time])
                    input[time] = {};
                if (select[time][user.uid]) {
                    input[time][user.uid][q.table] = menus;
                    //input[user.uid].reserved[t][q.table] = menus;

                } else {
                    input[time][user.uid] = {};
                    input[time][user.uid][q.table] = query[time][user.uid][q.table];
                }
            }else{
                input = query;
            }

            sql = "UPDATE orders SET reserved='" + JSON.stringify(input) + "'" +
                " WHERE id=" + result["0"].order_id;

            let this_obj = this;
            global.con_obj.query(sql,  function (err, result) {
                if (err){
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({err:err}));
                    return;
                }

                if (result) {
                    if(!cancel) {
                        this_obj.initdict(q, function (dict) {
                            let user;
                            if(isJSON(urlencode.decode(q.user))) {
                                user = JSON.parse(urlencode.decode(q.user));
                            }else{
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                return;
                            }
                            //let msg = dict.getDict()['a10ccf20b9307e0a8e26ecca77a63541']['en'];
                            email.SendMail("nedol@narod.ru", user.email, "New Table Reservation", 'Test Message');
                        });
                    }else{
                        //TODO
                        // InitDict(q, function (dict) {
                        //     let user = JSON.parse(urlencode.decode(q.user));
                        //     let msg = dict.getDict()['04bd09bce3173f943374c299c3b52df9']['en']
                        //     email.SendMail("nedol@narod.ru", user.email, "Table Reservation Canceled", msg);
                        // });
                    }
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({user:q.user,msg: "Table reservation was succesfully updated"}));

                }else {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({msg: "No table was updated"}));
                }

                process.env.upd_reserve = JSON.stringify({data:{date:q.date,func:'GetReserved'}});
                setTimeout(function () {
                    process.env.upd_reserve = JSON.stringify({data: 'no data'});
                }, 1500);

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

        let arCoor = q.areas.split(',');
        let catsAr = q.cats.split(',');

//////////////////////////////////////////////////////////////////////////////////////////////////////
        let sql = " SELECT * , SPLIT_STR(of.categories, ',') as catar"+
            " FROM  supplier as sup, offer as of, offer_data as ofd"+
            " WHERE sup.uid = of.sup_uid AND of.data_id = ofd.id" +
            " AND latitude>"+ arCoor[0] +" AND latitude<"+arCoor[1] +
            " AND longitude>" + arCoor[2] + " AND longitude<" +arCoor[3];

        global.con_obj.query(sql, function (err, result) {

            if (err) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({'err':err}));
                return;
            }

            if(intersection(result.catar,catsAr).length >0){
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(result));
            }else{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end();
            }



        });

    }
}
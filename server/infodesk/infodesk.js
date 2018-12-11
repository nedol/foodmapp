/**
 * Created by android on 04.05.2018.
 */

var mysql = require('mysql');


module.exports =  class Infodesk{

    constructor(){

    }

    dispatch(req, q, res) {

        switch (q.func) {
            case 'init':
                this.InitMySQL( q, res);
                break;
            case 'import_data':
                this.ImportData(req, q, res);
                break;
            case 'import_obj':
                this.ImportObject(req, q, res);
                break;
        }
    }

    InitDict(q, cb) {

        var con = mysql.createConnection(con_param);
        var sql = "SELECT obj.id, obj.data as data"+
            " FROM  objects as obj"+
            " WHERE obj.latitude="+q.lat+" AND obj.longitude="+q.lon;

        global.con_obj.query(sql, function (err, result) {
            if (err) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({err:err}));
            }
            if (result.length > 0) {
                cb( new Dict(JSON.parse(result[0].data)));
            }
        });
    }

    InitMySQL (q, res) {

        var sql = "SELECT obj.id, obj.data as data"+
            " FROM  objects as obj"+
            " WHERE obj.latitude="+q.lat+" AND obj.longitude="+q.lon;

        global.con_obj.query(sql, function (err, result) {
            if (err) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({err:err}));
            }
            if (result.length > 0) {
                //res.writeHead(200, {'Content-Type': 'application/json'});
                res.writeHead(200,{'Content-Type': 'text/event-stream'});
                res.end(JSON.stringify({data: result[0].data}));
                return;
            } else {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({msg: 'Initialization is impossible'}));
            }
        });

    }

    Auth(req, q, res) {

        var sql = "SELECT obj.id, obj.owner, o.data as data"+
            " FROM  objects as obj, orders as o"+
            " WHERE obj.latitude="+q.lat+" AND obj.longitude="+q.lon+
            " AND obj.id=o.obj_id AND (o.data IS NOT NULL OR o.data='') ORDER BY o.date DESC";

        global.con_obj.query(sql, function (err, result) {
            if (err) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({err:err}));
            }
            if(result.length>0) {

                let owner = JSON.parse(result[0].owner);
                let menu = JSON.parse(result[0].data).editor
                if (menu){
                    var jsonfile = require('jsonfile')
                    var file = './editor/' + menu + '.json'
                    jsonfile.readFile(file, function (err, obj) {
                        if ( err || obj === null) {
                            obj={};
                        }

                        if (owner.uid == q.uid) {
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify({auth: 'OK',editor:obj}));
                            return;
                        }
                        if (!owner.uid) {
                            owner.uid = q.uid;
                            sql = "UPDATE objects_" + q.lang + " SET owner='" + JSON.stringify(owner) + "'" +
                                " WHERE id=" + result["0"].id;

                            global.con_obj.query(sql, function (err, result) {
                                if (err)
                                    throw err;
                                if (result) {
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.end(JSON.stringify({reg: 'OK'}));
                                }
                            });
                        }else{
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify({msg: 'Registration is impossible'}));
                        }
                    });


                }else {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({msg: 'Registration is impossible'}));
                }
            }else{
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({msg: 'There\'s no such object.'}));
            }
        });
    }

    ImportData(req, q, res){

        let ar = q.areas.split('_');
        let arCoor = ar[3].split(',');

        let tags_sql = "tags LIKE \'%#sightseeing%\'";

//////////////////////////////////////////////////////////////////////////////////////////////////////
        let sql = " SELECT * "+
            " FROM  objects"+
            " WHERE latitude>"+ arCoor[0] +" AND latitude<"+arCoor[1] +
            " AND longitude>" + arCoor[2] + " AND longitude<" +arCoor[3] +
            " AND (category=" + ar[1]+" OR "+tags_sql +")"+
            " AND (status=0 OR status=1) AND level<="+ar[2];

        global.con_obj.query(sql, function (err, result) {

            if (err) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({'err':err}));
                return;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(result));

        });

    }

    ImportObject(req, q, res){

        let sql = " SELECT * "+
            " FROM  objects"+
            " WHERE latitude='" + q.lat +"' AND longitude='" + q.lon +"'"+
            " AND (status=0 OR status=1)";

        // res.writeHead(200, {'Content-Type': 'application/json'});
        // res.end(JSON.stringify({'sql': sql}));
        // return;

        global.con_obj.query(sql, function (err, result) {

            if (err) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({'err':err}));
            }
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(result));
        });
    }
}
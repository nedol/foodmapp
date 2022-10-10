'use strict'

const server = require('../server')

let Email = require( "../email/email");
let moment = require('moment');

let utils = require('../utils');
let fs = require('fs');
let os = require('os');
var md5 = require('md5');

var mysql = require('mysql');
let globaljs = require('..//global');
let con_param = globaljs.con_param;//change every 8 min
let con_obj;

class  PriceApproval {

    constructor(){
        this.mysql_con ='';
        StartConnection( (mc)=> {
            this.mysql_con = mc;
            this.GetExpiresAssortment();
        });
    }



    GetExpiresAssortment(){
        let that = this;
//////////////////////////////////////////////////////////////////////////////////////////////////////
        let sql =
            " SELECT *"+
            " FROM offers as of, supplier as sup, messages as msg"+
            " WHERE of.supuid=sup.uid  AND msg.name ='Resave Assortment'"+
            " GROUP BY of.supuid"+
            " HAVING DATEDIFF(CURDATE() , of.published)=6"+
            " ORDER BY published DESC";

        //
        // if (!res._header)
        //     res.writeHead(200, {'Content-Type': 'application/json'});
        // res.end(JSON.stringify(sql));
        // return;

        that.mysql_con.query(sql, function (err, result) {
            if (err) {
                throw err;
            }
            let em = new Email();

            for(let i in result) {

                let html =   result[i].text;
                em.SendMail("nedol.d2d@gmail.com", //from
                    "d2d@delivery-angels.ru", //to
                    "Подтверждение текущих цен", html, function (result) {

                });
            }
        });
    }



}


const pa  = new PriceApproval();


function StartConnection(cb) {

    console.error('CONNECTING');
    if(!global.mysql_pool) {
        global.mysql_pool = mysql.createPool(con_param);
    }
    global.mysql_pool.getConnection(function (err, connection) {
        if (err) {
            console.error('CONNECT FAILED', err.code);
            if(con_obj)
                con_obj.destroy();
            throw err;
        }
        else {
            con_obj = connection;
            console.error('CONNECTED');
            cb(con_obj);
        }
    });
    global.mysql_pool.on('error', function (err) {
        con_obj = '';
    });

}
// if (!res._header)
//     res.writeHead(200, {'Content-Type': 'application/json'});
// res.end(JSON.stringify(html));
// return;
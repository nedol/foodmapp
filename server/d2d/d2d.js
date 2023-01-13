'use strict';
let Email = require('../email/email');
let moment = require('moment');

let utils = require('../utils');
let fs = require('fs');
let os = require('os');
var md5 = require('md5');
const shortid = require('shortid');

var urlencode = require('urlencode');
//const translate = require('google-translate-api');//ISO 639-1
// var intersection = require('array-intersection');//TODO: lodash

var _ = require('lodash');

var path = require('path');

global.resObj = {};

module.exports = class D2D {
  constructor() {}

  dispatch(q, ws, mysql_con) {
    this.mysql_con = mysql_con;

    try {
      switch (q.func) {
        case 'confirmem':
          this.ConfirmEmail(q, ws);
          return;
          break;
        case 'reguser':
          this.RegUser(q, ws);
          break;
        case 'updprofile':
          this.UpdProfile(q, ws);
          break;
        case 'auth':
          this.Auth(q, ws);
          break;
        case 'getrating':
          this.GetRating(q, ws);
          break;
        case 'ratesup':
          this.RateSupplier(q, ws);
          break;
        case 'setsup':
          this.SettingsSupplier(q, ws);
          break;
        case 'getcomments':
          this.GetComments(q, ws);
          break;
        case 'setcomments':
          this.SetComments(q, ws);
          break;
        case 'updateorderstatus':
          this.UpdateOrderStatus(q, ws);
          break;
        case 'updateorder':
          this.UpdateOrder(q, ws);
          break;
        case 'deleteorder':
          this.DeleteOrder(q, ws);
          break;
        case 'getoffers':
          this.GetOffers(q, ws);
          break;
        case 'updateoffer':
          this.UpdateOffer(q, ws);
          break;
        case 'updateofferitem':
          this.UpdateOfferItem(q, ws);
          break;
        case 'deleteoffer':
          this.DeleteOffer(q, ws);
          break;
        case 'translate':
          //this.translate(q, ws);
          break;
        case 'getorder':
          this.GetOrder(q, ws);
          break;
        case 'getstore':
          this.GetStore(q, ws);
          break;
        case 'getsuppliers':
          this.GetSuppliers(q, ws);
          break;
        case 'getdelivers':
          // this.GetDelivers(q, ws);
          break;
        case 'getbykey':
          this.GetByKey(q, ws);
        case 'getbyemail':
          this.GetByEmail(q, ws);
          break;
        case 'sharelocation':
          this.ShareLocation(q, ws);
          break;

        default:
          break;
      }
    } catch (ex) {
      console.log(JSON.stringify(ex));
    }
  }

  RegUser(q, ws) {
    let that = this;

    let values, sql, uid;

    if (q.psw_hash) {
      let sql =
        'SELECT user.uid  as uid, user.psw, user.promo, user.profile,' +
        ' user.dict as dict' +
        ' FROM ' +
        q.user.toLowerCase() +
        ' as user ' +
        ' WHERE ' +
        " STRCMP(MD5(user.psw),'" +
        q.psw_hash +
        "')=0";

      this.mysql_con.query(sql, (err, result) => {
        if (err) throw err;

        if (result.length > 0) {
          sql =
            'SELECT * FROM offers as of WHERE supuid="' +
            result[0].uid +
            '" AND  DATE (date) >= DATE("' +
            moment().format('YYYY-MM-DD') +
            '") ';
          console.log(sql);

          this.mysql_con.query(sql, (err, data) => {
            if (err) throw err;

            if (data) result[0].data_ar = data;

            ws.send(
              urlencode.encode(
                JSON.stringify({
                  func: q.func,
                  [q.user.toLowerCase()]: result,
                })
              )
            );
          });
        } else {
          newAcnt(that.mysql_con, q, ws);
        }
      });
    } else {
      newAcnt(this.mysql_con, q, ws);
    }

    function newAcnt(mysql_con, q, ws) {
      let psw = shortid.generate();
      uid = md5(new Date() + psw);

      values = [uid, psw];
      sql = 'INSERT INTO ' + q.user.toLowerCase() + ' SET  uid=?, psw=?';

      mysql_con.query(sql, values, function (err, result) {
        if (err) {
          ws.send(
            JSON.stringify({
              func: q.func,
              err: JSON.stringify(err),
            })
          );

          return true;
        } else {
          ws.send(
            urlencode.encode(
              JSON.stringify({
                func: q.func,
                result: result,
                uid: uid,
                psw: psw,
              })
            )
          );
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

  replaceImg(offer, cb) {
    let ofobj = JSON.parse(offer);
    for (let tab in ofobj) {
      for (let item in ofobj[tab]) {
        if (ofobj[tab][item].cert) {
          for (let c in ofobj[tab][item].cert) {
            if (ofobj[tab][item].cert[c].src.includes('base64')) {
              const base64Data = ofobj[tab][item].cert[c].src.replace(
                /^data:([A-Za-z-+/]+);base64,/,
                ''
              );
              const hash = md5(base64Data);
              fs.writeFile(
                path.join(__dirname, '../images/' + hash),
                base64Data,
                'base64',
                (err) => {}
              );
              offer = offer.replace(ofobj[tab][item].cert[c].src, hash);
            }
          }
        }
        if (
          ofobj[tab][item].brand &&
          ofobj[tab][item].brand.logo &&
          ofobj[tab][item].brand.logo.includes('base64')
        ) {
          const base64Data = ofobj[tab][item].brand.logo.replace(
            /^data:([A-Za-z-+/]+);base64,/,
            ''
          );
          const hash = md5(base64Data);
          fs.writeFile(
            path.join(__dirname, '../images/' + hash),
            base64Data,
            'base64',
            (err) => {}
          );
          offer = offer.replace(ofobj[tab][item].brand.logo, hash);
        }
        for (let c in ofobj[tab][item].cert) {
          if (!ofobj[tab][item].cert[c].src.includes('base64')) continue;
          const base64Data = ofobj[tab][item].cert[c].src.replace(
            /^data:([A-Za-z-+/]+);base64,/,
            ''
          );
          const hash = md5(base64Data);
          fs.writeFile(
            path.join(__dirname, '../images/' + hash),
            base64Data,
            'base64',
            (err) => {}
          );
          offer = offer.replace(ofobj[tab][item].cert[c].src, hash);
        }
      }
    }
    cb(offer);
  }

  replaceImg_2(src, cb, ws) {
    try {
      if (!src || src.includes('http')) {
        cb(src);
        return;
      }
    } catch (ex) {
      cb(src);
      return;
    }

    const base64Data = src.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    const hash = md5(base64Data);
    let hn = os.hostname();

    fs.writeFile(
      path.join(__dirname, '../images/' + hash),
      base64Data,
      'base64',
      (err) => {
        if (err) {
          console.error(JSON.stringify(err));
          cb(err);
        } else cb(hash);
      }
    );
  }

  GetSuppliers(q, ws) {
    let that = this;
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    let sql =
      ' SELECT ' +
      ' date, of.categories as cats, ' +
      ' of.latitude as lat, of.longitude as lon, of.radius, of.data as data, ' +
      ' of.published as published, of.deleted as deleted,' +
      ' sup.uid as uid, sup.dict as dict, sup.profile as profile, sup.rating as rating, ' +
      ' apprs.totals as apprs' + //общее кол-во подтверждений
      ' FROM  supplier as sup, promo, offers as of,' +
      ' (' +
      ' SELECT COUNT(*) as  totals' +
      ' FROM supplier as sup, approved as appr' +
      ' WHERE appr.supuid=sup.uid' +
      " AND appr.date='" +
      q.date.split('T')[0] +
      "'" +
      ' ) AS apprs' +
      ' WHERE sup.uid = of.supuid' +
      " AND profile LIKE CONCAT('%','\"type\":\"marketer\"', '%')" +
      ' AND LCASE(sup.promo)=LCASE(promo.code)' +
      ' AND of.latitude>=' +
      q.areas[0] +
      ' AND of.latitude<=' +
      q.areas[1] +
      ' AND of.longitude>=' +
      q.areas[2] +
      ' AND of.longitude<=' +
      q.areas[3] +
      ' AND (' +
      " (SELECT id  FROM offers WHERE supuid LIKE sup.uid AND DATE(date)<=DATE('" +
      moment(q.date).format('YYYY-MM-DD') +
      "') ORDER BY date DESC LIMIT 1)= of.id" +
      ' OR ' +
      " (SELECT id  FROM offers WHERE supuid LIKE sup.uid AND date>=DATE('" +
      moment(q.date).subtract(7, 'days').format('YYYY-MM-DD') +
      "') ORDER BY date ASC LIMIT 1)= of.id" +
      ' )' +
      ' AND of.deleted IS NULL ' +
      ' ORDER by uid, date ASC';

    //console.log(sql);

    that.mysql_con.query(sql, async function (err, result) {
      if (err) {
        throw err;
      }

      let resAr = [];
      let promise = new Promise(function (resolve, reject) {
        if (result.length > 0) {
          for (let o in result) {
            let cats = JSON.parse(result[o].cats);

            if (_.intersection(cats.map(String), q.categories).length === 0)
              continue;
            let offer = JSON.parse(result[o].data);
            for (let c in offer) {
              _.remove(offer[c], function (n) {
                return n.checked === 'false';
              });
            }

            for (let c in offer) {
              if (offer[c].length === 0) offer = _.omit(offer, c);
              else {
                for (let i in offer[c]) {
                  if (
                    result[parseInt(o) - 1] &&
                    result[parseInt(o) - 1].uid === result[o].uid
                  )
                    if (JSON.parse(result[parseInt(o) - 1].data)[c])
                      if (JSON.parse(result[parseInt(o) - 1].data)[c][i])
                        if (
                          JSON.parse(result[parseInt(o) - 1].data)[c][i]
                            .packlist
                        ) {
                          // let key = Object.keys(offer[c][i].packlist)[0];
                          let x = _.findKey(
                            JSON.parse(result[parseInt(o) - 1].data)[c],
                            { title: offer[c][i].title }
                          );
                          if (x)
                            offer[c][i].prev_packlist = JSON.parse(
                              result[parseInt(o) - 1].data
                            )[c][x].packlist;
                        }
                }
              }
            }

            if (
              result[parseInt(o) + 1] &&
              result[parseInt(o) + 1].uid === result[o].uid
            )
              continue;
            result[o].data = JSON.stringify(offer);
            //if(moment(result[i].date.toISOString()).diff(moment(q.date),'days')===0) {
            result[o].date = moment().format('YYYY-MM-DD');
            resAr.push(result[o]);
            //}
          }

          resolve();
        }
        resolve();
      });

      await promise;

      that.GetFoodtrucks(q, ws, resAr);

      //that.GetDelivers(q, ws, resAr);
    });
  }

  GetFoodtrucks(q, ws, resAr) {
    let that = this;
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    let sql =
      ' SELECT date, of.categories as cats, ' +
      ' of.latitude as lat, of.longitude as lon, of.radius, of.data as data,  of.published as published, of.deleted as deleted, ' +
      ' sup.uid as uid, sup.dict as dict, sup.profile as profile, sup.rating as rating,  apprs.totals as apprs ' +
      ' FROM  supplier as sup, promo, offers as of, ' +
      ' (SELECT COUNT(*) as  totals FROM deliver as sup, approved as appr WHERE appr.supuid=sup.uid ' +
      " AND appr.date='" +
      q.date +
      "'" +
      ' ) AS apprs' +
      ' WHERE sup.uid = of.supuid AND LCASE(sup.promo)=LCASE(promo.code)  ' +
      " AND profile LIKE CONCAT('%','\"type\":\"foodtruck\"', '%')" +
      ' AND of.latitude BETWEEN ' +
      q.areas[0] +
      '  AND ' +
      q.areas[1] +
      ' AND of.longitude BETWEEN ' +
      q.areas[2] +
      '  AND ' +
      q.areas[3] +
      // " AND of.latitude>="+ q.areas[0] +" AND of.latitude<="+q.areas[1] +
      // " AND of.longitude>=" + q.areas[2] + " AND of.longitude<=" +q.areas[3]+
      " AND DATE(of.date)<= DATE('" +
      moment(q.date).add(7, 'days').format('YYYY-MM-DD') +
      "')" +
      " AND DATE(of.date)>=DATE('" +
      moment(q.date).format('YYYY-MM-DD') +
      "')" +
      ' AND of.published IS NOT NULL AND of.deleted IS NULL' +
      ' ORDER by uid, date ASC';

    //console.log(sql);

    that.mysql_con.query(sql, function (err, result) {
      if (err) {
        throw err;
      }

      if (result.length > 0 && result[0].cats) {
        for (let i in result) {
          let cats = JSON.parse(result[i].cats);

          let offer = JSON.parse(result[i].data);
          for (let c in offer) {
            _.remove(offer[c], function (n) {
              if (n) return n.checked === 'false';
            });
          }
          result[i].data = JSON.stringify(offer);

          if (_.intersection(cats.map(String), q.categories).length === 0) {
            continue;
          } else {
            // result[i].date = q.date.split('T')[0];
            resAr.push(result[i]);
          }
        }
      }

      ws.send(
        urlencode.encode(
          JSON.stringify({
            func: q.func,
            resAr: resAr,
          }),
          'utf8'
        )
      );
      // let now = moment().format('YYYY-MM-DD');
      // sql = "UPDATE "+ q.user+" SET region='"+q.areas.toString()+"', date='"+now+"' WHERE uid='"+q.uid+"'";
      //
      // that.mysql_con.query(sql, function (err, result) {
      //     if (err) {
      //         throw err;
      //     }
      // });
    });
  }

  GetDelivers(q, ws, resAr) {
    let that = this;
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    let sql =
      ' SELECT date, of.categories as cats, ' +
      ' of.latitude as lat, of.longitude as lon, of.radius, of.data as data,  of.published as published, of.deleted as deleted, ' +
      ' sup.uid as uid, sup.dict as dict, sup.profile as profile, sup.rating as rating,  apprs.totals as apprs ' +
      ' FROM  deliver as sup, promo, offers as of, ' +
      ' (SELECT COUNT(*) as  totals FROM deliver as sup, approved as appr WHERE appr.supuid=sup.uid ' +
      " AND appr.date='" +
      q.date +
      "'" +
      ' ) AS apprs' +
      ' WHERE sup.uid = of.supuid AND LCASE(sup.promo)=LCASE(promo.code)  ' +
      " AND profile LIKE CONCAT('%','\"type\":\"deliver\"', '%')" +
      ' AND of.latitude BETWEEN ' +
      q.areas[0] +
      '  AND ' +
      q.areas[1] +
      ' AND of.longitude BETWEEN ' +
      q.areas[2] +
      '  AND ' +
      q.areas[3] +
      // " AND of.latitude>="+ q.areas[0] +" AND of.latitude<="+q.areas[1] +
      // " AND of.longitude>=" + q.areas[2] + " AND of.longitude<=" +q.areas[3]+
      " AND of.date>'" +
      moment(q.date).subtract(7, 'days').calendar() +
      "'" +
      ' AND of.published IS NOT NULL AND of.deleted IS NULL' +
      ' AND published  = (SELECT MAX(published) FROM offers WHERE supuid=sup.uid)' +
      ' ORDER by uid, date ASC';

    //console.log(sql);

    that.mysql_con.query(sql, function (err, result) {
      if (err) {
        throw err;
      }

      if (result.length > 0 && result[0].cats) {
        for (let i in result) {
          let cats = JSON.parse(result[i].cats);

          let offer = JSON.parse(result[i].data);
          for (let c in offer) {
            _.remove(offer[c], function (n) {
              if (n) return n.checked === 'false';
            });
          }
          result[i].data = JSON.stringify(offer);

          if (_.intersection(cats.map(String), q.categories).length === 0) {
            continue;
          } else {
            result[i].date = q.date.split('T')[0];
            resAr.push(result[i]);
          }
        }
      }

      ws.send(
        urlencode.encode(
          JSON.stringify({
            func: q.func,
            resAr: resAr,
          }),
          'utf8'
        )
      );
      // let now = moment().format('YYYY-MM-DD');
      // sql = "UPDATE "+ q.user+" SET region='"+q.areas.toString()+"', date='"+now+"' WHERE uid='"+q.uid+"'";
      //
      // that.mysql_con.query(sql, function (err, result) {
      //     if (err) {
      //         throw err;
      //     }
      // });
    });
  }

  BroadcastOffer(q, ws, cb) {
    let sql =
      ' SELECT sup.uid as uid' +
      ' FROM supplier as sup' +
      ' WHERE' +
      " sup.uid<>'" +
      q.uid +
      "'" +
      " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(sup.region,',',1)," +
      "       LENGTH(SUBSTRING_INDEX(sup.region,',',1 -1)) + 1)," +
      "       ',', '')<" +
      q.location[1] +
      " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(sup.region,',',2)," +
      "       LENGTH(SUBSTRING_INDEX(sup.region,',',2 -1)) + 1)," +
      "       ',', '')>" +
      q.location[1] +
      " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(sup.region,',', 3)," +
      "       LENGTH(SUBSTRING_INDEX(sup.region,',', 3 -1)) + 1)," +
      "       ',', '')<" +
      q.location[0] +
      " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(sup.region,',', 4)," +
      "       LENGTH(SUBSTRING_INDEX(sup.region,',', 4 -1)) + 1)," +
      "       ',', '')>" +
      q.location[0] +
      ' UNION' +
      ' SELECT cus.uid as uid' +
      ' FROM customer as cus' +
      ' WHERE ' +
      " REPLACE(SUBSTRING(SUBSTRING_INDEX(cus.region,',',1)," +
      "       LENGTH(SUBSTRING_INDEX(cus.region,',',1 -1)) + 1)," +
      "       ',', '')<" +
      q.location[1] +
      " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(cus.region,',',2)," +
      "       LENGTH(SUBSTRING_INDEX(cus.region,',',2 -1)) + 1)," +
      "       ',', '')>" +
      q.location[1] +
      " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(cus.region,',', 3)," +
      "       LENGTH(SUBSTRING_INDEX(cus.region,',', 3 -1)) + 1)," +
      "       ',', '')<" +
      q.location[0] +
      " AND REPLACE(SUBSTRING(SUBSTRING_INDEX(cus.region,',', 4)," +
      "       LENGTH(SUBSTRING_INDEX(cus.region,',', 4 -1)) + 1)," +
      "       ',', '')>" +
      q.location[0];

    this.mysql_con.query(sql, function (err, sel) {
      if (err) {
        throw err;
      }

      if (sel.length > 0) {
        for (let r in sel) {
          let sse = resObj[sel[r].uid];
          if (sse) {
            ws.send(
              urlencode.encode(
                JSON.stringify({
                  func: q.func,
                  obj: q,
                })
              )
            );
          }
        }
      }

      if (cb) {
        cb(sel.length);
      } else {
        ws.send(
          urlencode.encode(
            JSON.stringify({
              func: q.func,
              result: sel.length,
            })
          )
        );
      }
    });
  }

  updatedict(q, ws) {
    var sql_select =
      'SELECT obj.id as obj_id, obj.data as data' +
      ' FROM objects as obj' +
      ' WHERE obj.latitude=' +
      admin.lat +
      ' AND obj.longitude=' +
      admin.lon;

    this.mysql_con.query(sql_select, function (err, result) {
      if (err) {
        throw err;
      }
      if (result.length > 0) {
      } else {
      }
    });
  }

  translate(q, ws) {
    let data = JSON.parse(q.data);
    let to = q.to;
    let cnt = 0;

    var curriedDoWork = function (obj, trans) {
      cnt++;
      //console.log(trans.text + obj.key);
      obj.func = q.func;
      obj.data[obj.key][obj.to] = trans.text;
      obj.data[obj.key][trans.from.language.iso] = obj.src;
      if (obj.length === cnt) {
        obj.ws.send(urlencode.encode(JSON.stringify(obj.data)));
      }
    };

    for (let w = 0; w < Object.keys(data).length; w++) {
      let key = Object.keys(data)[w];
      let from = Object.keys(data[key])[0];
      let obj = {
        ws: ws,
        key: key,
        data: data,
        to: to,
        from: from,
        src: data[key][from],
        length: Object.keys(data).length,
      };
      //https://github.com/matheuss/google-translate-api

      new translate(data[key][from], { to: to }).then(
        curriedDoWork.bind(null, obj),
        function (ev) {
          console.log(ev);
        }
      );
    }
  }

  GetByKey(q, ws) {
    let that = this;
    let sql =
      ' SELECT ' +
      " '" +
      q.date.split('T')[0] +
      "' as date, of.categories as cats, " +
      ' of.latitude as lat, of.longitude as lon, of.radius, of.data as data, ' +
      ' of.published as published, of.deleted as deleted,' +
      ' sup.uid as uid, sup.dict as dict, sup.profile as profile, sup.rating as rating, ' +
      ' apprs.totals as apprs' + //общее кол-во подтверждений
      ' FROM  supplier as sup, promo, offers as of,' +
      ' (' +
      ' SELECT COUNT(*) as  totals' +
      ' FROM supplier as sup, approved as appr' +
      ' WHERE appr.supuid=sup.uid' +
      " AND appr.date='" +
      q.date.split('T')[0] +
      "'" +
      ' ) AS apprs' +
      ' WHERE sup.uid=of.supuid' +
      ' AND published  = (SELECT MAX(published) FROM offers as of WHERE of.supuid=sup.uid)' +
      ' AND LCASE(sup.profile) LIKE \'%"place":"%%' +
      q.key.toLowerCase() +
      "%' GROUP BY sup.uid";
    // if (!ws._header)
    //     ws.writeHead(200, {'Content-Type': 'application/json'});
    // ws.send(JSON.stringify(sql));
    // return;

    this.mysql_con.query(sql, function (err, result) {
      if (err) {
        throw err;
      }
      if (result.length > 0) {
        ws.send(
          urlencode.encode(
            JSON.stringify({
              func: q.func,
              result: result,
            })
          )
        );
      }
    });
  }

  GetByEmail(q, ws) {
    let that = this;
    let sql =
      ' SELECT  of.categories as cats, ' +
      ' of.latitude as lat, of.longitude as lon, of.radius, of.data as data, ' +
      ' of.published as published, of.deleted as deleted,' +
      ' sup.uid as uid, sup.dict as dict, sup.profile as profile, sup.rating as rating, ' +
      ' apprs.totals as apprs' + //общее кол-во подтверждений
      ' FROM  ' +
      q.user +
      ' as sup, promo, offers as of' +
      ' WHERE sup.email="' +
      q.em +
      '"' +
      ' AND  sup.email = of.supuid' +
      ' AND published  = (SELECT MAX(published) FROM offers as of WHERE of.supuid=sup.uid)' +
      ' ORDER BY of.date DESC';
    // if (!ws._header)
    //     ws.writeHead(200, {'Content-Type': 'application/json'});
    // ws.send(JSON.stringify(sql));
    // return;
    console.log(sql);

    this.mysql_con.query(sql, function (err, result) {
      if (err) {
        throw err;
      }
      if (result.length > 0) {
        ws.send(
          urlencode.encode(
            JSON.stringify({
              func: q.func,
              result: result,
            })
          )
        );
      }
    });
  }

  GetRating(q, ws) {
    let sql =
      ' SELECT sup.rating as rating' +
      ' FROM  ' +
      q.user +
      ' as sup' +
      " WHERE sup.uid = '" +
      q.supuid +
      "'";

    this.mysql_con.query(sql, function (err, result) {
      if (err) {
        throw err;
      }
      let rating = '0';
      if (result[0]) rating = JSON.parse(result[0].rating);

      ws.send(
        urlencode.encode(
          JSON.stringify({
            func: q.func,
            rating: rating.value,
          })
        )
      );
    });
  }

  GetComments(q, ws) {
    let sql = 'SELECT data' + ' FROM comm' + " WHERE supuid='" + q.supuid + "'";

    this.mysql_con.query(sql, function (err, result) {
      if (err) {
        throw err;
      }

      let array = [];
      for (let d in result) {
        array.push(JSON.parse(result[d].data));
      }
      ws.send(
        urlencode.encode(
          JSON.stringify({
            func: q.func,
            resAr: array,
          })
        )
      );
    });
  }

  SetComments(q, ws) {
    let that = this;
    this.replaceImg_2(q.data.profile_picture_url, (path) => {
      try {
        q.data.profile_picture_url = path;
        let values = [q.supuid, JSON.stringify(q.data)];
        let sql = 'REPLACE INTO comm SET supuid=?, data=?';
        that.mysql_con.query(sql, values, function (err, result) {
          if (err) {
            throw err;
          }
          ws.send(
            urlencode.encode(
              JSON.stringify({
                func: q.func,
                result: result,
              })
            )
          );
        });
      } catch (ex) {
        ws.send(
          urlencode.encode(
            JSON.stringify({
              func: q.func,
              err: 'Network err',
            })
          )
        );
      }
    });
  }
};
// if (!ws._header)
//     ws.writeHead(200, {'Content-Type': 'application/json'});
// ws.send(JSON.stringify(html));
// return;

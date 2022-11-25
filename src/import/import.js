export { Import };

import proj from 'ol/proj';
var md5 = require('md5');
var urlencode = require('urlencode');
let moment = require('moment/moment');

class Import {
  constructor() {
    let that = this;
    this.areasAr = [];
    $('.dt_val').on('change', function (ev) {
      that.areasAr = [];

      that.date = moment($(this).val()).format('YYYY-MM-DD');

      window.db.GetAllSuppliers(window.user.date, function (features) {
        window.user.map.SetFeatures(features);
      });
    });

    this.date;

    this.data_updated = false;
    this.prom = true;
  }

  ImportSupByEmail(em) {
    let promise = new Promise((resolve, reject) => {
      let that = this;
      try {
        let data_obj = {
          proj: 'd2d',
          user: window.user.constructor.name.toLowerCase(),
          func: 'getbyemail',
          em: em,
        };

        window.network.SendMessage(data_obj, function (data) {
          if (data) {
            that.processResult(data);
            //that.map.GetObjectsFromStorage(area);
            if (data.result[0]) {
              window.user.map.FlyToLocation(
                proj.fromLonLat([data.result[0].lon, data.result[0].lat])
              );
            }

            if (!data.result[0]) resolve([0, 0]);
            else resolve([data.result[0].lon, data.result[0].lat]);
          }
        });
      } catch (ex) {
        console.log();
      }
    });

    return promise;
  }

  ImportDataByLocation(event) {
    let that = this;
    if (!window.sets.coords.cur) return;

    var LotLat = proj.toLonLat(window.user.map.ol_map.getView().getCenter()); //(window.sets.coords.cur);

    if (window.user.map.ol_map.getView().getZoom() >= 9) {
      try {
        let cats = [];
        if ($(".category[state='1']").length === 0)
          //первый запуск
          $('.category').each(function (i, cat) {
            //cats.push(parseInt(cat.id));
          });
        else
          $(".category[state='1']").each(function (i, cat) {
            cats.push(cat.id);
          });

        let area = [
          (parseFloat(LotLat[1].toFixed(1)) - 0.05).toFixed(2),
          (parseFloat(LotLat[1].toFixed(1)) + 0.05).toFixed(2),
          (parseFloat(LotLat[0].toFixed(1)) - 0.05).toFixed(2),
          (parseFloat(LotLat[0].toFixed(1)) + 0.05).toFixed(2),
        ];

        let date = window.user.date;

        if (!IsDownloadedArea(date + '_' + cats + '_' + area)) {
          let uid = window.user.uid;

          that.LoadSupplierData(uid, cats, area, function (res) {
            that.areasAr.push(date + '_' + cats + '_' + area);

            let extent = window.user.map.ol_map.getView().calculateExtent();
            let tr_ext = proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
            window.user.map.GetObjectsFromStorage([
              tr_ext[1],
              tr_ext[3],
              tr_ext[0],
              tr_ext[2],
            ]);
          });
          that.LoadDeliverData(uid, cats, area, function (res) {
            that.areasAr.push(date + '_' + cats + '_' + area);

            let extent = window.user.map.ol_map.getView().calculateExtent();
            let tr_ext = proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
            window.user.map.GetObjectsFromStorage([
              tr_ext[1],
              tr_ext[3],
              tr_ext[0],
              tr_ext[2],
            ]);
          });
        }
        // setTimeout(function () {
        //     let extent = window.user.map.ol_map.getView().calculateExtent();
        //     let tr_ext = proj.transformExtent(extent,'EPSG:3857','EPSG:4326');
        //     that.map.GetObjectsFromStorage([tr_ext[1],tr_ext[3],tr_ext[0],tr_ext[2]]);
        // }, 1000)
      } catch (ex) {
        console.log(ex);
      }
    }

    function IsDownloadedArea(area) {
      var res = $.grep(that.areasAr, function (el, index) {
        return el === area;
      });

      return res.length > 0 ? true : false;
    }
  }

  LoadDataByKey(uid, key, cb) {
    let that = this;
    try {
      let date = window.user.date;

      let data_obj = {
        proj: 'd2d',
        user: window.user.constructor.name.toLowerCase(),
        func: 'getbykey',
        uid: uid,
        date: date,
        key: key,
      };

      window.network.SendMessage(data_obj, function (data) {
        if (data) {
          that.processResult(data, cb);
          //that.map.GetObjectsFromStorage(area);
        }
      });
    } catch (ex) {
      console.log();
    }
  }

  LoadSupplierData(uid, cats, area, cb) {
    let that = this;
    try {
      let date = window.user.date;

      let data_obj = {
        proj: 'd2d',
        user: window.user.constructor.name.toLowerCase(),
        func: 'getsuppliers',
        uid: uid,
        lang: window.sets.lang,
        categories: cats,
        date: date,
        areas: area,
      };

      window.network.SendMessage(data_obj, function (data) {
        if (data.resAr) {
          that.processResult(data.resAr, cb);
          that.data_updated = true;
        }
      });
    } catch (ex) {
      console.log();
    }
  }

  LoadDeliverData(uid, cats, area, cb) {
    let that = this;
    try {
      let date = window.user.date;

      let data_obj = {
        proj: 'd2d',
        user: window.user.constructor.name.toLowerCase(),
        func: 'getdelivers',
        uid: uid,
        lang: window.sets.lang,
        categories: cats,
        date: date,
        areas: area,
      };

      window.network.SendMessage(data_obj, function (data) {
        if (data.resAr) {
          that.processResult(data.resAr, cb);
          //that.map.GetObjectsFromStorage(area);
        }
      });
    } catch (ex) {
      console.log();
    }
  }

  processResult(res, cb) {
    let that = this;
    try {
      if (res) {
        for (let i in res) {
          let obj = res[i];
          if (!obj || !obj.profile) continue;
          obj = that.formatObject(obj);

          let moment = require('moment');

          if (
            obj.uid === window.user.uid &&
            moment(obj.date).isSame(window.user.date)
          ) {
            if (
              (!window.user.offer.stobj ||
                !Object.keys(window.user.offer.stobj.data)[0]) &&
              obj
            ) {
              //     window.db.SetObject('dictStore',obj.dict, function (res) {
              //
              //     });
              //     window.user.offer  = obj;
              //     window.user.offer.location = proj.fromLonLat([obj.longitude,obj.latitude]);
              //     obj.location = window.user.offer.location;
              //     window.db.SetObject('offerStore', obj, function (res) {
              //         $('#datetimepicker').trigger("dp.change");
              //     });
            }

            continue;
          }

          window.db.SetObject('supplierStore', obj, (success) => {
            // if(success)
            //     window.user.map.SetFeatures([obj]);
          });
        }

        cb(true);
      } else {
        cb(false);
      }
    } catch (ex) {
      console.log();
    }
  }

  formatObject(obj) {
    return {
      uid: obj.uid,
      date: moment(obj.date).format('YYYY-MM-DD'),
      period: obj.period,
      categories: obj.cats,
      longitude: obj.lon,
      latitude: obj.lat,
      address: obj.addr,
      radius: obj.radius,
      logo: '../dist/images/truck.png',
      data: JSON.parse(
        obj.data.replace(
          new RegExp('https://delivery-angels.store/server/images/', 'g'),
          ''
        )
      ),
      dict: obj.dict ? JSON.parse(obj.dict) : {},
      rating: obj.rating ? JSON.parse(obj.rating).value : '',
      profile: obj.profile ? JSON.parse(obj.profile) : '',
      apprs: obj.apprs, //общее кол-во подтверждений
      published: obj.published,
      deleted: obj.deleted,
    };
  }

  GetOrderSupplier(cb) {
    let data_obj = {
      proj: 'd2d',
      user: window.user.constructor.name.toLowerCase(),
      func: 'getorder',
      uid: window.user.uid,
      psw: window.user.psw,
      date: window.user.date,
    };

    window.network.SendMessage(data_obj, function (data) {
      if (data) {
        processResult(data);
      }
      cb();
    });

    function processResult(res) {
      try {
        if (res) {
          for (let i in res.result) {
            let obj = res.result[i];
            if (!obj) continue;
            obj.date = moment(obj.date).format('YYYY-MM-DD');
            obj.status = JSON.parse(obj.status);
            obj.dict = obj.dict ? JSON.parse(obj.dict) : obj.dict;
            obj.delivery = obj.delivery
              ? JSON.parse(obj.delivery)
              : obj.delivery;
            obj.cus_profile = obj.cus_profile
              ? JSON.parse(obj.cus_profile)
              : obj.cus_profile;
            obj.logo = '../dist/images/user.png';
            if (obj.data) obj.data = JSON.parse(obj.data);
            // if(obj.status)
            //     obj.status = JSON.parse(obj.status);
            window.db.SetObject('orderStore', obj, function (success) {});
          }
        }
      } catch (ex) {
        console.log();
      }
    }
  }

  GetOrderCustomer(cb) {
    let data_obj = {
      proj: 'd2d',
      user: window.user.constructor.name.toLowerCase(),
      func: 'getorder',
      uid: window.user.uid,
      psw: window.user.psw,
      date: window.user.date,
    };

    window.network.SendMessage(data_obj, function (data) {
      if (data) {
        processResult(data);
      }
      cb();
    });

    function processResult(res) {
      try {
        if (res) {
          for (let i in res.result) {
            let obj = res.result[i];
            if (!obj) continue;
            obj.date = moment(obj.date).format('YYYY-MM-DD');
            obj.status = JSON.parse(obj.status);
            obj.dict = obj.dict ? JSON.parse(obj.dict) : obj.dict;
            obj.cus_profile = obj.cus_profile
              ? JSON.parse(obj.cus_profile)
              : obj.cus_profile;
            obj.logo = '../dist/images/user.png';
            if (obj.data) obj.data = JSON.parse(obj.data);
            // if(obj.status)
            //     obj.status = JSON.parse(obj.status);
            window.db.SetObject('orderStore', obj, function (success) {});
          }
        }
      } catch (ex) {
        console.log();
      }
    }
  }

  GetApprovedCustomer(supuid) {
    let date = window.user.date;

    let data_obj = {
      proj: 'd2d',
      user: window.user.constructor.name.toLowerCase(),
      func: 'getapproved',
      uid: window.user.uid,
      supuid: supuid,
      date: date,
    };

    window.network.SendMessage(data_obj, function (data) {
      if (data) {
        processResult(data);
      }
    });

    function processResult(res) {
      try {
        if (res.result) {
          for (let i in res.result) {
            let data = res.result[i];
            (data.date = moment(data.date).format('YYYY-MM-DD')),
              (data.data = JSON.parse(res.result[i].data));
            window.db.SetObject('approvedStore', data, function (res) {});
          }
        }
      } catch (ex) {
        console.log();
      }
    }
  }

  GetApprovedSupplier() {
    let date = moment().format('YYYY-MM-DD');

    let data_obj = {
      proj: 'd2d',
      user: window.user.constructor.name.toLowerCase(),
      func: 'getapproved',
      uid: window.user.uid,
      supuid: window.user.email,
      date: date,
    };

    window.network.SendMessage(data_obj, function (data) {
      if (data) {
        processResult(data);
      }
    });

    function processResult(res) {
      try {
        if (res) {
          for (let i in res) {
            let data_obj = JSON.parse(res[i].data);
            window.db.GetOrder(
              res[i].date,
              res[i].supuid,
              res[i].cusuid,
              function (ord) {
                if (ord != -1 && ord.data[res[i].title]) {
                  ord.data[res[i].title].approved = data_obj.approved;
                  window.db.SetObject('orderStore', ord, function (res) {});
                }
              }
            );
          }
        }
      } catch (ex) {
        console.log();
      }
    }
  }

  SetLead(sup, cus) {
    let that = this;
    try {
      let date = moment().format('YYYY-MM-DD');

      let data_obj = {
        proj: 'd2d',
        user: window.user.constructor.name.toLowerCase(),
        func: 'setlead',
        supuid: sup,
        cusuid: cus,
        date: date,
      };

      window.network.SendMessage(data_obj, function (data) {});
    } catch (ex) {}
  }
}

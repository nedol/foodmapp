'use strict';
export { Offer };
import { OrderViewer } from '../order/order.viewer';
let _ = require('lodash');

import proj from 'ol/proj';

class Offer {
  constructor(uObj) {
    this.stobj = uObj; //db stored object
    this.viewer = new OrderViewer();
  }

  GetOfferDB(date, cb) {
    window.db.GetOffer(date, function (res) {
      cb(res);
    });
  }

  GetAllOffersDB(cb) {
    window.db.GetAllOffers(function (res) {
      cb(res);
    });
  }

  SetOfferDB(items) {
    const that = this;
    window.db.SetObject('offerStore', items, function (res) {});
    if (window.dict.dict) {
      for (let i in window.dict.dict) {
        try {
          window.db.SetObject(
            'dictStore',
            { hash: i, obj: window.dict.dict[i] },
            function (res) {}
          );
        } catch (ex) {
          console.log();
        }
      }
    }
  }

  AddOfferDB(obj, dict) {
    if (!this.stobj) this.stobj = {};
    this.stobj.data = obj.data;
    window.db.GetOffer(obj.date, function (set) {
      let tabs = Object.keys(obj.data);
      if (set[0] && set[0].data)
        tabs = _.assign(Object.keys(obj.data), Object.keys(set[0].data));
      let unchecked;
      for (let t in tabs) {
        let tab = tabs[t];
        let customizer = function (objValue, srcValue) {
          if (_.isArray(objValue)) {
            return objValue.concat(srcValue);
          }
        };
        if (set[0] && set[0].data) {
          unchecked = _.filter(obj.data[tab], { checked: 'false' });
          set[0].data[tab] = _.differenceBy(
            set[0].data[tab],
            unchecked,
            'supuid'
          );
          obj.data[tab] = _.unionBy(obj.data[tab], set[0].data[tab], 'title'); //,new customizer(set.data[tab], obj.data[tab]));
          obj.data[tab] = _.filter(obj.data[tab], { checked: 'true' });
        }
      }

      window.db.SetObject('offerStore', obj, function (res) {});
      if (dict) {
        for (let i in dict) {
          try {
            window.db.SetObject(
              'dictStore',
              { hash: i, obj: dict[i] },
              function (res) {}
            );
          } catch (ex) {
            console.log();
          }
        }
      }
    });
  }

  DeleteOfferItem(date, cat, item) {
    window.db.GetOffer(date, (arOf) => {
      let ind = _.findIndex(arOf.data[cat], { title: item.title });
      if (ind !== -1) {
        arOf.data[cat].splice(ind, 1);
        window.db.SetObject('offerStore', arOf, function (res) {});
      }
    });
  }

  GetOfferLonLat(loc) {
    return proj.toLonLat(loc);
  }
}

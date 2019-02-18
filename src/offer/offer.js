'use strict'
export {Offer}
import {OfferEditor} from './offer.editor';
import {OrderViewer} from "../order/order.viewer";
class Offer{

    constructor(date,uObj){

        this.stobj = uObj.offer;//db stored object
        this.viewer = new OrderViewer();

    }

    GetOfferDB(date, cb){
        window.db.GetOffer(date, function (res) {
            cb(res);
        });
    }

    GetAllOffersDB(cb){
        window.db.GetAllOffers(function (res) {
            cb(res);
        });
    }

    SetOfferDB(obj, dict,cb) {
        this.stobj.data = obj.data;
        window.db.SetObject('offerStore',obj,function (res) {
            obj.date = 'tmplt';
            window.db.SetObject('offerStore',obj);
        });
        if(dict){
            for(let i in dict){
                try {
                    window.db.SetObject('dictStore', {hash: i, obj: dict[i]}, function (res) {

                    });
                }catch(ex){
                    console.log();
                }
            }
        }
    }

    DeleteOffer(){
        //TODO:
    }




}
'use strict'
export {Offer}
import {OfferEditor} from './offer.editor';
class Offer{

    constructor(uObj){

        this.stobj = uObj.offer;//db stored object
        this.editor = new OfferEditor();//offer editor
        this.viewer;
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

    SetOfferDB(obj, dict) {
        this.stobj.data = obj.data;
        window.db.SetObject('offerStore',obj,function (res) {

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


    OpenOfferEditor(ev) {
        ev.data.offer.editor.OpenOffer();
    }

}
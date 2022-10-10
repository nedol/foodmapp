'use strict'
let md5 = require('md5.js');

const fs = require('fs');

const utils = require('../utils');
let _ = require('lodash');

let log4js = require('log4js');
log4js.configure({
    appenders: { users: { type: 'file', filename: 'users.log' }},
    categories: { default: { appenders: ['users'], level: 'all' } }
});
const logger = log4js.getLogger('users');

global.rtcPull = {'user':{}, 'operator':{}};


module.exports = class RTC {

    constructor() {

    }


    dispatch(q , ws) {
        console.log("func:"+q.func+" "+q.role+":"+q.uid);
        switch (q.func) {
            case 'check':
                this.SetParams(q, ws);

                if(q.role==='user'){
                    let cnt_queue = 0;
                    let item = _.find(global.rtcPull[q.role][q.trans][q.em],{uid:q.uid})
                    try {
                        // for (let uid in global.rtcPull[q.role][q.trans]) {
                        //     if (global.rtcPull[q.role][q.trans][q.em][uid])
                        //         if (global.rtcPull[q.role][q.trans][q.em][uid].status === 'call' ||
                        //             global.rtcPull[q.role][q.trans][q.em][uid].status === 'wait')
                        //             if (global.rtcPull[q.role][q.trans][q.em][uid].uid === q.uid) {
                        //                 cnt_queue++;
                        //             }
                        // }

                    }catch(ex){

                    }
                    item.ws.send(encodeURIComponent(JSON.stringify({
                            check: true,
                            queue: String(cnt_queue)
                        })));

                    this.SendOperatorStatus(q);

                }

                break;

            case 'offer':

                this.SetParams( q, ws);
                this.BroadcastOperatorStatus(q, 'offer');

                break;

            case 'call':
                this.SetParams( q, ws);
                this.HandleCall( q);

                break;

            case 'status':
                if(q.status==='call'){
                    if(q.role==='operator') {
                        let item = _.find(global.rtcPull[q.role][q.trans][q.em],{uid:q.uid});
                        item.status = 'busy';
                        this.BroadcastOperatorStatus(q, 'busy');
                        // global.rtcPull['operator'][q.trans][q.em].shift();
                    }
                    break;
                }
                if(q.status==='close') {
                    let item = _.find(global.rtcPull[q.role][q.trans][q.em],{uid:q.uid});
                    item.status = q.status;
                    if(q.role==='operator')
                        this.BroadcastOperatorStatus(q, 'close');
                    //this.RemoveAbonent(q);
                    break;
                }

                this.SetParams( q, ws);
                
                break;

            case 'datach':
                this.SetParams( q, ws);
                this.HandleCall( q, ws);
                ws.send(encodeURIComponent(JSON.stringify({msg: 'empty'})));
                break;
        }

    }

    SendOperators( q , ws){

        let operators = {};

        for(let trans in global.rtcPull) {
            for (let em in global.rtcPull[q.role][trans]) {
                for (let uid in global.rtcPull[q.role][em]) {
                    if (global.rtcPull[q.role][trans][em][uid] !== 'operator')
                        continue;

                    let email = global.rtcPull[q.role][trans][em][uid].email;

                    var domain = em.split("@")[1];
                    let req_dom = q.email.split("@")[1];
                    let status = global.rtcPull[q.role][trans][em][uid].status;
                    if (domain === req_dom) {
                        operators[uid] = {
                            trans: trans,
                            status: status,
                            queue: global.queue[q.role][trans][em][global.rtcPull[q.role][trans][em][uid].uid]
                        }
                    }
                }
            }
        }

        ws.send(encodeURIComponent(JSON.stringify({operators: operators})));
    }

    RemoveAbonent(q){
        global.rtcPull[q.role][q.trans][q.em][q.uid]= _.omit(global.rtcPull[q.role][q.trans][q.em][q.uid], q.uid);
    }

    SetParams(q, ws){
        let that = this;

        if(!global.rtcPull[q.role][q.trans])
            global.rtcPull[q.role][q.trans] = {};

        if(!global.rtcPull[q.role][q.trans][q.em])
            global.rtcPull[q.role][q.trans][q.em] = [];

        let item = _.find(global.rtcPull[q.role][q.trans][q.em],{uid:q.uid});
        if(!item) {
            item = {};
            global.rtcPull[q.role][q.trans][q.em].push(item);
        }

        item.uid = q.uid;
        item.ws = ws;
        item.status = q.status;
        item.abonent = q.abonent;
        item.oper_uid = q.oper_uid;
        if (q.desc)
            item.desc = q.desc;
        if (q.cand)
            item.cand = q.cand;



        ws.onclose = function (ev) {
            if(q.role==='operator') {
                let item = _.find(global.rtcPull[q.role][q.trans][q.em],{uid:q.uid});
                item.status = 'close';
                that.BroadcastOperatorStatus(q, 'close');

                global.rtcPull[q.role][q.trans][q.em].splice(q.uid,1);

            }else if(q.role="user"){
                if(global.rtcPull[q.role][q.trans]){
                    that.SendUserStatus(q);
                    let index = _.indexOf(global.rtcPull[q.role][q.trans][q.em],{uid:q.uid});
                    global.rtcPull[q.role][q.trans][q.em].splice(index,1);
                }
            }

        };
    }

    BroadcastOperatorStatus(q, status){

        try {
            let queue = 0;
            if(!global.rtcPull['user'][q.trans])
                return;
            for (let uid in global.rtcPull['user'][q.trans][q.em]) {
                if (q.uid && global.rtcPull['user'][q.trans][q.em][uid]) {
                    queue++;
                }
            }
            let role = (q.role === 'operator' ? 'user' : 'operator');

            let operators = {[q.em]:{}};
            for (let uid in global.rtcPull['operator'][q.trans][q.em]) {
                operators[q.em][uid] = {
                    role: q.role,
                    trans: q.trans,
                    em: q.em,
                    uid: q.uid,
                    status: global.rtcPull['operator'][q.trans][q.em][uid].status,
                    queue: queue
                }
            }

            for (let em in global.rtcPull[role][q.trans]) {
                for (let uid in global.rtcPull[role][q.trans][em]) {
                    let item = global.rtcPull[role][q.trans][em][uid];
                    let offer = _.find(operators[q.em],{status:'offer'});
                    if (offer
                        && item.abonent === q.em
                        && item.uid !== q.uid) {
                            if(item.status==='wait') {
                                let oper = _.find(global.rtcPull['operator'][q.trans][q.em], {uid: q.uid});
                                let remAr = {
                                    trans: q.trans,
                                    oper_uid: q.uid,
                                    desc: oper.desc,
                                    cand: oper.cand
                                }
                                item.ws.send(encodeURIComponent(JSON.stringify(remAr)));
                            }else {
                                item.ws.send(encodeURIComponent(JSON.stringify({operators: operators})));
                            }

                        }else {
                            item.ws.send(encodeURIComponent(JSON.stringify({operators: operators})));
                        }
                    }
            }
        }catch(ex){
            console.log(ex)
        }
    }

    SendOperatorStatus(q){
        if (global.rtcPull['operator'] && global.rtcPull['operator'][q.trans]
            && global.rtcPull['operator'][q.trans][q.abonent]){

            for(let uid in global.rtcPull['operator'][q.trans][q.abonent]){
                if(global.rtcPull['operator'][q.trans][q.abonent][uid].status==='offer') {
                    let operator = {
                        trans: q.trans,
                        em: q.abonent,
                        uid:uid,
                        status: global.rtcPull['operator'][q.trans][q.abonent][uid].status,
                        desc:global.rtcPull['operator'][q.trans][q.abonent][uid].desc,
                        cand:global.rtcPull['operator'][q.trans][q.abonent][uid].cand
                    }

                    if (q.role === 'user') {
                        let item = _.find(global.rtcPull['user'][q.trans][q.em],{uid:q.uid})
                        item.ws.send(encodeURIComponent(JSON.stringify({operator: operator})));
                    }
                }
            }
        }
    }

    SendUserStatus(q){
        let item = _.find(global.rtcPull[q.role][q.trans][q.em],{uid:q.uid});
        let user = {
            func:'mute',
            uid:q.abonent,
            trans:q.trans
        };
        if(global.rtcPull['operator'][q.trans]) {
            let oper = _.find(global.rtcPull['operator'][q.trans][q.abonent], {uid: q.oper_uid});
            if (oper)
                oper.ws.send(encodeURIComponent(JSON.stringify(user)));
        }
    }


    HandleCall( q){
        if(q.role === 'user'){
            if(q.desc || q.cand){
                let remAr = {
                    "desc": q.desc,
                    "cand": q.cand,
                    "trans": q.trans,
                    "abonent": q.em
                }
                let item = _.find(global.rtcPull['operator'][q.trans][q.abonent],{uid:q.oper_uid});
                item.ws.send(encodeURIComponent(JSON.stringify(remAr)));

            }else{
                let item = _.find(global.rtcPull['user'][q.trans][q.em],{uid:q.uid})
                if (item.abonent === q.abonent) {
                    let k = '';
                    try {
                        for (k in global.rtcPull['operator'][q.trans][q.abonent]) {
                            if (global.rtcPull['operator'][q.trans][q.abonent][k].status === 'offer' &&
                                global.rtcPull['operator'][q.trans][q.abonent][k].ws.readyState === 1) {
                                break;
                            } else
                                k = '';
                        }
                    }catch(ex){

                    }

                    if(k) {
                        let remAr = {
                            trans: q.trans,
                            oper_uid: global.rtcPull['operator'][q.trans][q.abonent][k].uid,
                            desc: global.rtcPull['operator'][q.trans][q.abonent][k].desc,
                            cand: global.rtcPull['operator'][q.trans][q.abonent][k].cand
                        }
                        item.ws.send(encodeURIComponent(JSON.stringify(remAr)));
                        //console.log('after HandleCall:user '+JSON.stringify(remAr));
                    }else{
                        item.status='wait';
                        let remAr = {
                            trans: q.trans,
                            status:'wait'
                        }
                        item.ws.send(encodeURIComponent(JSON.stringify(remAr)));
                    }
                }
            }
        }
    }

}
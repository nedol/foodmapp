'use strict'

export {Network}
import axios from 'axios';//
//import axios from 'axios-cancel';
//import io from 'socket.io-client';


class Network{

    constructor(url) {
        this.host = url;
        this.work = true;
        //this.CancelToken = axios.CancelToken;
        this.cancel;
        this.send_req_func;

    }

    Init(user, cb){
        let par = {
            proj:'d2d',
            user:user
        }
        this.postRequest(par, function (res) {
            cb();
        });
    }

    InitSSE(user, cb){
        this.eventSource = new window.EventSource(host_port+'?proj=d2d&sse=1&uid='+user.uid+'&user='+user.constructor.name
            //,{withCredentials: true}
        );
        this.eventSource.onerror = function(e) {
            if (this.readyState == EventSource.CONNECTING) {
                console.log("Соединение порвалось, пересоединяемся...");
            } else {
                console.log("Ошибка, состояние: " + this.readyState);
            }
        };
        this.eventSource.onopen = function(e) {
            console.log("Соединение открыто");
            setTimeout(function () {
                cb();
            },100);

        };
        this.eventSource.onmessage = function (e) {
            console.log(e.data);
            window.user.OnMessage(JSON.parse(e.data));
            //return Promise.resolve("Dummy response to keep the console quiet");
        };
        this.eventSource.addEventListener('sse', (e) => {
            console.log(e.data);
            // => Hello world!
        });
    }

    Cancel(){

        this.work = false;
    }


    postRequest(par, cb){
        let that = this;
        let post_par = JSON.stringify(par);
        let cb_this = cb;
        this.repeat = true;
        axios.post(this.host, post_par,
            {
                crossDomain: true
            }
        )
            .then(function (response) {
                that.repeat = false;
                cb_this(response.data);
            })
            .catch(function (error) {//waiting for rem_client

                setTimeout(function () {
                    if(that.repeat) {
                        that.repeat = false;
                        that.postRequest(par, cb);
                    }else{
                        cb_this();
                    }
                },300);
                //cb_this({err:error});
            });

    }

    RegUser(obj, cb){
        let post_obj = {};
        post_obj.proj = 'd2d';
        post_obj.uid = obj.uid;
        post_obj.psw = obj.psw;
        post_obj.user = obj.profile.user;
        post_obj.func = 'reguser';
        post_obj.profile = obj.profile;

        this.postRequest(post_obj, function (res) {
            cb(res);
        });
    }

}
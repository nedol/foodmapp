'use strict'

export {Network}
import axios from 'axios';//
//import axios from 'axios-cancel';
//import io from 'socket.io-client';


class Network{

    constructor(url){
        this.host = url;
        this.work = true;
        this.CancelToken = axios.CancelToken;
        this.cancel;
        this.send_req_func;

    }

    InitSSE(that, cb){
        this.eventSource = new window.EventSource(host_port+'?proj=d2d&sse=1&uid='+that.uid
            //,{withCredentials: true}
        );
        this.eventSource.onerror = function(e) {
            if (this.readyState == EventSource.CONNECTING) {
                //console.log("Соединение порвалось, пересоединяемся...");
            } else {
                //console.log("Ошибка, состояние: " + this.readyState);
            }
        };
        this.eventSource.onopen = function(e) {
            console.log("Соединение открыто");
            setTimeout(function () {
                cb();
            },100);

        };
        this.eventSource.onmessage = function (e) {
            //console.log(e.data);
            //that.OnMessage(JSON.parse(e.data));

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

        let post_par = JSON.stringify(par);

        axios.post(this.host, post_par
            , { crossdomain: true }
        )
            .then(function (response) {
                cb(response.data);
            })
            .catch(function (error) {//waiting for rem_client
                console.log(error);
            });

    }

}
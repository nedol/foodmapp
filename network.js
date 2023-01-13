'use strict';

import { Utils } from './src/utils/utils.js';
let utils = new Utils();
let log = utils.log;
var urlencode = require('urlencode');

export class Сетка {
  constructor(url) {
    this.url = url;
    this.timeout = 10000;
    this.alive = false;
    if (!this.ws) {
      this.ws = new WebSocket(this.url);
      this.ws.callbacks = {};
      this.ListenMessage();
    }

    $(this.ws).on('error', function (error) {
      log('Connect Error: ' + error.toString());
    });

    $(this.ws).on('close', (ev) => {
      log('echo-protocol Connection Closed');
      let cbs = this.ws.callbacks;
      this.ws = new WebSocket(this.url);
      this.ws.callbacks = cbs;
      this.ListenMessage();
    });

    $(this.ws).on('open', (ev) => {});
  }

  ListenMessage() {
    $(this.ws).on('message', (message) => {
      if (message.type === 'message') {
        //log("Received: '" + message.originalEvent.data + "'");
        let data = JSON.parse(urlencode.decode(message.originalEvent.data));
        this.ws.callbacks[data.func].cb(data);
      }
    });
  }

  SendMessage(par, cb) {
    let that = this;

    try {
      if (this.ws.readyState >= 2) {
        let cbs = this.ws.callbacks;
        this.ws = new WebSocket(this.url);
        this.ws.callbacks = cbs;
        this.ListenMessage();
      }
      if (this.ws.readyState === 1) {
        this.ws.callbacks[par.func] = { cb: cb };
        if (par.func === 'updateorder') {
          this.alive = true;
        }
        this.ws.send(urlencode.encode(JSON.stringify(par)));
      } else {
        setTimeout(() => {
          this.ws.callbacks[par.func] = { cb: cb };
          that.SendMessage(par, cb);
        }, 300);
      }
    } catch (ex) {
      return false;
    }
    return true;
  }

  KeepAlive() {
    setInterval(() => {
      if (this.ws.readyState === 1 /*&& this.alive*/)
        //TODO:
        this.ws.send(encodeURIComponent('foodmapp'));
    }, this.timeout);
  }
}

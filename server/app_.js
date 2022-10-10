'use strict';
const server= require('./server')
const ws = require('ws');
const urlencode = require('urlencode');
const shortid = require('shortid');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 3000 });

wss.on('connection', function connection(ws) {
    ws.id = shortid.generate();
    ws.on('message', function (message) {
        try {
            var q = JSON.parse(urlencode.decode(message));
            server.HandleRequest(q, ws)
        }catch(ex){

        }
    });
});

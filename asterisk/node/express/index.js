// index.js

'use strict';

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var client = require('ari-client');


client.connect('http://localhost:8088', 'asterisk', 'asterisk')
  .then(function (ari) {

    var chanArr = []

    ari.on('StasisStart', function(event, incoming) {
      incoming.answer()
        .then(function() {
          return getOrCreateBridge(incoming)
        })
        .then(function(bridge) {
          return joinBridge(bridge, incoming)
        })
        .catch(function(err) {});
    });


    function getOrCreateBridge (channel) {
      return ari.bridges.list()
        .then(function (bridges) {
          var bridge = bridges.filter(function (candidate) {
            return candidate['bridge_type'] === 'mixing';
          })[0];

          if (!bridge) {
            bridge = ari.Bridge();

            return bridge.create({type: 'mixing'});
          }
          else {
            return bridge;
          }
        });
    }

    function joinBridge (bridge, channel) {
      bridge.on('ChannelLeftBridge', function (event, instances) {
        console.log('Channel left the bridge: ' + event.channel.id);
        var b = instances.bridge;
        if (b.channels.length === 1) {
          b.startMoh()
        }
        if (b.channels.length === 0 && b.id === bridge.id) {
          bridge.destroy()
            .catch(function (err) {});
        }
      });

      chanArr.push({channel: channel.id})
      io.emit('conference', {'bridge': bridge.id, 'channels': chanArr});

      console.log('Adding channel ' + channel.id + ' to bridge ' +  bridge.id);
      console.log('Channels in bridge:' +  bridge.channels.length);
      if (bridge.channels.length > 0){
        bridge.stopMoh()
      }
      else{
        bridge.startMoh()
      }

      return bridge.addChannel({channel: channel.id})
    }

    ari.start('bridge');

  }) // end ari client
  .done()


app.use(express.static(__dirname + '/bower_components'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

var chats = [];

io.on('connection', function(client) {
    console.log('Client connected...');

    client.on('join', function(data) {
        console.log(data);
        client.emit('messages', 'Hello from server');
    });

    client.on('messages', function(msg){
      chats.push(msg)
      client.emit('messages', msg);
      client.emit('chats', chats)
    });

});


console.log('Listening on port 8000');
server.listen(8000);

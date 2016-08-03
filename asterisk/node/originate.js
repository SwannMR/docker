'use strict';


var client = require('ari-client');

var ENDPOINT = 'SIP/201';

// replace ari.js with your Asterisk instance
client.connect('http://localhost:8088', 'asterisk', 'asterisk')
  .then(function (ari) {

    // Use once to start the application to ensure this listener will only run
    // for the incoming channel
    ari.once('StasisStart', function (event, incoming) {

      incoming.answer()
        .then(function () {
          console.log('Incoming Call: ' + incoming.id);
          console.log(event.channel);
          // Get channel variables
          incoming.getChannelVar({channelId: incoming.id, variable: 'SIPCALLID'})
            .then(function (variable) {
              console.log(variable);
            });

          originate(incoming);
        });

    });

    function originate (incoming) {
      // Hangup call
      incoming.once('StasisEnd', function (event, channel) {
        outgoing.hangup({channel: outgoing.id})
        .then(function() {
          console.log('Hanging up caller:' + outgoing.caller.number);
        })
        .catch(function(err) {
          console.log('Caller already hangup');
        });
      });

      incoming.on('ChannelDtmfReceived', function(event, channel) {
        var digit = event.digit;
        console.log(digit);
      })

      var outgoing = ari.Channel();
      outgoing.on('ChannelDtmfReceived', function (event, channel){
        console.log(event.digit);
      })
      outgoing.once('ChannelDestroyed', function (event, channel) {
        incoming.hangup({channel: incoming.id})
          .then(function() {
            console.log('Hanging up callee:' + incoming.caller.number);
          })
          .catch(function(err) {
            console.log('Callee already hangup');
          });
      });

      outgoing.once('StasisStart', function (event, outgoing) {
        console.log("Stasis Outgoing Channel");
        console.log(event.channel);
        var bridge = ari.Bridge();

        outgoing.once('StasisEnd', function (event, channel) {
          bridge.destroy();
        });

        outgoing.answer()
          .then(function () {
            console.log('Creating Bridge');
            return bridge.create({type: 'mixing'});
          }).then(function (bridge) {
            console.log('Bridging ' + incoming.id + ' and ' + outgoing.id);
            return bridge.addChannel({channel: [incoming.id, outgoing.id]});
          })
          .catch(function (err) {});
      });

      var playback = ari.Playback();
      incoming.play({media: 'sound:vm-dialout'}, playback)
        .then(function(){
          incoming.ring({channel: incoming.id})
        })
        .then(function () {
          // Originate call from incoming channel to endpoint
          return outgoing.originate({
            endpoint: ENDPOINT,
            callerId: '200',
            app: 'originate',
            appArgs: 'dialed'
          });
        })
        .catch(function (err) {});
    }

    // can also use ari.start(['app-name'...]) to start multiple applications
    ari.start('originate');
})
.done(); // program will crash if it fails to connect

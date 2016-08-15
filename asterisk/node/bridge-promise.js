'use strict';

/* This application will simulate a conference. The first caller in the
   bridge will hear music until a second person joins.
*/

var client = require('ari-client');
var channelArray = []

client.connect('http://localhost:8088', 'asterisk', 'asterisk')
  .then(function (ari) {

    ari.on('StasisStart', function(event, incoming) {
      let enswitchCallid = event.args[0];
      console.log('Enswitch Callid ' + enswitchCallid);
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
        if (b.channels.length === 0 && b.id === bridge.id) {
          bridge.destroy()
            .catch(function (err) {});
        }
      });

      console.log('Adding channel ' + channel.id + ' to bridge ' +  bridge.id);
      console.log('Channels in bridge:' +  bridge.channels.length);

      if (bridge.channels.length > 0){
        bridge.stopMoh()
      }
      else{
        bridge.startMoh()
      }

      return bridge.addChannel({channel: channel.id})
/*        .then(function (bridge) {
          return channel.startMoh();
        });*/
    }

    ari.start('bridge');

  }) // end ari client
  .done()

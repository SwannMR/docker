
'use strict';

var client = require('ari-client');

client.connect('http://localhost:8088', 'asterisk', 'asterisk',

    function (err, ari) {

  // use once to start the application
  ari.on('StasisStart', function (event, incoming) {
    console.log(event.channel);
    console.log("\n");
    incoming.answer(function (err) {
      getOrCreateBridge(incoming);
    });
  });

  function getOrCreateBridge (channel) {
    ari.bridges.list(

    function (err, bridges) {

      var bridge = bridges.filter(function (candidate) {
        return candidate['bridge_type'] === 'holding';
      })[0];

      if (!bridge) {
        bridge = ari.Bridge();
        bridge.create({type: 'holding'},

            function (err, bridge) {

          bridge.on('ChannelLeftBridge', function(event, instances) {
            cleanupBridge(event, instances, bridge);
          });
          joinHoldingBridgeAndPlayMoh(bridge, channel);
        });
      } else {
        // Add incoming channel to existing holding bridge and play
        // music on hold
        joinHoldingBridgeAndPlayMoh(bridge, channel);
      }
    });
  }

  function cleanupBridge (event, instances, bridge) {

    var holdingBridge = instances.bridge;
    if (holdingBridge.channels.length === 0 &&
        holdingBridge.id === bridge.id) {

      bridge.destroy(function (err) {});
    }
  }


  function joinHoldingBridgeAndPlayMoh (bridge, channel) {

    bridge.addChannel({channel: channel.id}, function (err) {
      channel.startMoh(function (err) {});
    });
  }

  // can also use ari.start(['app-name'...]) to start multiple applications
  ari.start('bridge');
});

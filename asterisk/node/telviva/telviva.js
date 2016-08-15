'use strict';

const client = require('ari-client');

let bridges = []

client.connect('http://localhost:8088', 'asterisk', 'asterisk')
.then(function (ari) {

    function onStasisStart(event, channel) {
      console.log('Channel ' + channel.id + ' entered stasis. Do something');
      console.log(event.args);
      if (event.args[0] != 'dialed'){
        originate(ari, channel)
      }
    }

    function onStasisEnd(event, channel){
      console.log('Channel ' + channel.id + ' has exited statis');
    }

  ari.on('StasisStart', onStasisStart);
  ari.on('StasisEnd', onStasisEnd);
  ari.start('telviva')
})
.catch(function (err){
  console.log(err);
})

function originate(ari, channel){
  let callHandler = Object();
  callHandler.outgoing = ari.Channel();
  callHandler.incoming = channel;

  callHandler.outgoing.originate({
    endpoint: 'SIP/201',
    app: 'telviva',
    appArgs: 'dialed'
  })
  .catch(function (err) {
    console.log(err);
  })

  callHandler.outgoing.on('StasisStart', function(event, outgoing) {
    callHandler.bridge = ari.Bridge();

    outgoing.answer()
    .then( () => channel.answer() )
    .then( () => callHandler.bridge.create({type: 'mixing'}) )
    .then( () => callHandler.bridge.addChannel({channel: [channel.id, outgoing.id]}) )
    .then( () => {
      bridges.push(callHandler)
      console.log(bridges);
      })
    .catch( (err) => {console.log(err)} )
  })

}

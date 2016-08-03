'use strict';

var client = require('ari-client');
var util = require('util');

client.connect('http://localhost:8088', 'asterisk', 'asterisk')
  .then(function (ari) {

    ari.once('StasisStart', function (event, incoming) {
      incoming.answer()
        .then(function() {
          console.log(event.channel);
        })
        .then(function () {
          play(incoming, 'sound:hello-world')
            .then(function () {return incoming.hangup()})
        })
        .catch(function (err) {});
    });

    //////////////////
    /// Playback a message
    //////////////////

    function play(channel, sound){
      var playback = ari.Playback();

      return new Promise(function (resolve, reject) {
        playback.on('PlaybackFinished', function(event, playback) {
          resolve(playback);
        });
        channel.play({media: sound}, playback)
          .catch(function(err) {
            console.log(err);
            reject(err);
          });
      });
    }

  ari.start('hello-world');
})
.done();

/**
 * frisby.js: Twitter Example
 * (C) 2012, Vance Lucas
 */
var frisby = require('../lib/frisby');


frisby.create('Get Brightbit Twitter feed')
  .get('https://api.twitter.com/1/statuses/user_timeline.json?screen_name=brightbit')
    .expectStatus(200)
    .expectHeaderContains('content-type', 'application/json')
    .expectJSON('0', {
      place: function(val) { expect(val).toMatchOrBeNull("Oklahoma City, OK"); }, // Custom matcher callback
      user: {
        verified: false,
        location: "Oklahoma City, OK",
        url: "http://brightb.it"
      },
    })
    .expectJSONTypes('*', {
      id_str: String,
      retweeted: Boolean,
      in_reply_to_screen_name: function(val) { expect(val).toBeTypeOrNull(String); }, // Custom matcher callback
      user: {
        verified: Boolean,
        location: String,
        url: String
      }
    })
.toss();


frisby.create('Ensure each tweet has base attributes')
  .get('https://api.twitter.com/1/statuses/user_timeline.json?screen_name=brightbit')
    .expectStatus(200)
    .expectHeaderContains('content-type', 'application/json')
    .expectJSONTypes('*', {
      id_str: String,
      retweeted: Boolean,
      in_reply_to_screen_name: function(val) { expect(val).toBeTypeOrNull(String); }, // Custom matcher callback
      user: {
        verified: Boolean,
        location: String,
        url: String
      }
    })
.toss();


frisby.create('Ensure Twitter has at least one list that is "NBA"')
  .get('https://api.twitter.com/1/lists/all.json?screen_name=twitter')
    .expectStatus(200)
    .expectHeaderContains('content-type', 'application/json')
    .expectJSONTypes('?', {
      name: "NBA",
      full_name: "@twitter/nba-7",
      id_str: "42840851",
      description: "All verified NBA players on Twitter",
      mode: "public"
    })
.toss();


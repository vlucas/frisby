/**
 * frisby.js: Twitter Example
 * (C) 2011, Vance Lucas
 */
var frisby = require('../lib/frisby');

// Global setup for all tests
frisby.globalSetup({
  request: {
    headers:{'Accept': 'application/json'}
  }
});


frisby.toss('Get Brightbit Twitter feed')
  .get('https://api.twitter.com/1/statuses/user_timeline.json?include_entities=true&include_rts=true&screen_name=brightbit&count=2')
  .expectStatus(200)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSON('0', {
    id_str: "138694438598868993",
    user: {
      verified: false,
      location: "Oklahoma City, OK",
      url: "http://brightb.it"
    }
  })
  .expectJSONTypes('0', {
    id_str: String,
    retweeted: Boolean,
    user: {
      verified: Boolean,
      location: String,
      url: String
    }
  })
.run();
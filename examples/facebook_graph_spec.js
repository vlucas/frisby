/**
 * frisby.js: Main Frisby test package
 * (C) 2011, Vance Lucas
 */
var frisby = require('../lib/frisby');

// Global setup for all tests
frisby.globalSetup({
  request: {
    headers:{'Accept': 'application/json'}
  }
});


frisby.toss('Get Brightbit Facebook Page')
  .get('https://graph.facebook.com/111848702235277')
  .expectStatus(200)
  .expectHeaderContains('content-type', 'application/json')
  .expectBodyJSONTypes({
    id: String,
    likes: Number,
    can_post: Boolean
  })
  .expectBodyJSONContains({
    id: "111848702235277",
    website: "http://brightb.it"
  })
.run();


// Setup for this test only
frisby.toss('Get Brightbit Facebook Page with custom Accept header')
  .addHeader('Accept', 'text/javascript') // Overrides global 'Accept' header set above
  .get('https://graph.facebook.com/111848702235277')
  .expectStatus(200)
  .expectHeaderContains('content-type', 'text/javascript')
.run();


// Test error reponse
frisby.toss('Get Brightbit Facebook Page Likes')
  .get('https://graph.facebook.com/111848702235277/likes')
  .expectStatus(400)
  .expectBodyJSONTypes('error', {
    message: String,
    type: String
  })
  .expectBodyJSONContains('error', {
    type: "OAuthException"
  })
.run();
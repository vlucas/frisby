/**
 * frisby.js: Facebook usage example
 * (C) 2012, Vance Lucas
 */
var frisby = require('../lib/frisby');

// Global setup for all tests
frisby.globalSetup({
  request: {
    headers:{'Accept': 'application/json'}
  }
});


frisby.create('Get Brightbit Facebook Page')
  .get('https://graph.facebook.com/111848702235277')
  .expectStatus(200)
  .expectHeaderContains('content-type', 'application/json')
  .expectJSONTypes({
    id: String,
    likes: Number,
    is_published: Boolean
  })
  .expectJSON({
    id: "111848702235277",
    website: "http://brightb.it"
  })
.toss();


// Test error reponse
frisby.create('Get Brightbit Facebook Page Likes')
  .get('https://graph.facebook.com/111848702235277/likes')
  .expectStatus(400)
  .expectJSONTypes({
    error: {
      message: String,
      type: String
    }
  })
  .expectJSON({
    error: {
      type: "OAuthException"
    }
  })
.toss();

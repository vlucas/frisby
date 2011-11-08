/**
 * frisby.js: Main Frisby test package
 * (C) 2011, Vance Lucas
 */
var frisby = require('../lib/frisby');


frisby.toss('Get Brightbit Facebook Page')
  .get('https://graph.facebook.com/111848702235277')
  .expectStatus(200)
  .expectHeaderContains('content-type', 'text/javascript')
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


// With custom headers
frisby.toss('Get Brightbit Facebook Page with custom Accept header')
  .setup({
    request: {
      headers: {
        'Accept': 'application/json'
      }
    }
  })
  .get('https://graph.facebook.com/111848702235277')
  .expectStatus(200)
  .expectHeaderContains('content-type', 'application/json')
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
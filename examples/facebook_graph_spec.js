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
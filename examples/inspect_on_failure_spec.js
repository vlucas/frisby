/**
 * frisby.js: inspectOnFailure usage example
 */

var frisby = require('../lib/frisby');

// Global setup for all tests
frisby.globalSetup({
  request: {
    headers:{'Accept': 'application/json'},
    inspectOnFailure: true
  }
});

frisby.create('Automatically call .inspectJSON() on failed expectations')
  .get('https://graph.facebook.com/111848702235277')
  .expectStatus(600) // A failing expectation, triggering inspection
.toss();

var frisby = require('../lib/frisby');


//
// Tests run like normal Frisby specs but with 'mock' specified with a 'mock-request' object
// These work without further 'expects' statements because Frisby generates and runs Jasmine tests
//
describe('Frisby live running httpbin tests', function() {

  it('Frisby basicAuth should work', function() {

    frisby.create('test with httpbin for valid basic auth')
      .get('http://httpbin.org/basic-auth/frisby/passwd')
      .auth('frisby', 'passwd')
      .expectStatus(200)
    .toss();

  });

  it('should pass in param hash to request call dependency', function() {

    frisby.create('test with httpbin for valid basic auth')
      .get('http://httpbin.org/redirect/3', { followRedirect: false, maxRedirects: 1 })
      .expectStatus(302)
    .toss();

  });

});

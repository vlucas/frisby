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

  it('sending binary data via put or post requests should work', function() {

      var data = [];

      for(var i=0; i< 1024; i++)
        data.push(Math.round(Math.random()*256))


      frisby.create('POST random binary data')
        .post('http://httpbin.org/post',
              new Buffer(data),
              {
                  json : false,
                  headers : {
                      "content-type" : "application/octet-stream"
                  }
              })
          .expectStatus(200)
          .expectHeaderContains('content-type', 'application/json')
          .expectJSON({
                  data : 'data:application/octet-stream;base64,'+ new Buffer(data).toString('base64'),
                  headers: {
                      "Content-Type": "application/octet-stream",
                      "Content-Length" : "1024"
                  },
                  url: "http://httpbin.org/post",
                  json : null,
                  files: {},
                  form: {}
              })
          .expectJSONTypes({
                  data: String
              })
      .toss();

      frisby.create('PUT random binary data')
        .put('http://httpbin.org/put',
              new Buffer(data),
              {
                  json : false,
                  headers : {
                      "content-type" : "application/octet-stream"
                  }
              })
          .expectStatus(200)
          .expectHeaderContains('content-type', 'application/json')
          .expectJSON({
                  data : 'data:application/octet-stream;base64,'+ new Buffer(data).toString('base64'),
                  headers: {
                      "Content-Type": "application/octet-stream",
                      "Content-Length" : "1024"
                  },
                  url: "http://httpbin.org/put",
                  json : null,
                  files: {},
                  form: {}
              })
          .expectJSONTypes({
                  data: String
              })
      .toss();

  });

});

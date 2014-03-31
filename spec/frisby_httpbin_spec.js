var frisby = require('../lib/frisby');
var fs = require('fs');
var path = require('path');
var util = require('util');
var Readable = require('stream').Readable;

function StringStream(string, options) {
    Readable.call(this, options);

    this.writable = false;
    this.readable = true;
    this.string = string;
}
util.inherits(StringStream, Readable);

StringStream.prototype._read = function (ignore) {
    this.push(this.string);
    this.push(null);
};

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

  describe('Frisby digestAuth', function() {

    it('should not work if digest not set', function() {

      frisby.create('test with httpbin for invalid digest auth')
        .auth('frisby', 'passwd')
        .get('http://httpbin.org/digest-auth/auth/frisby/passwd')
        .expectStatus(401)
      .toss();

    });


    /*
    // Digest auth against httpbin not working for some reason
    // but working fine against my own servers running digest auth
    it('should work if digest set', function() {

      frisby.create('test with httpbin for valid digest auth')
        .auth('frisby', 'passwd', true)
        .get('http://httpbin.org/digest-auth/auth/frisby/passwd')
        .expectStatus(200)
      .toss();

    });
    */

  });

  it('should pass in param hash to request call dependency', function() {

    frisby.create('test with httpbin for valid basic auth')
      .get('http://httpbin.org/redirect/3', { followRedirect: false, maxRedirects: 1 })
      .expectStatus(302)
    .toss();

  });

  it('sending binary data via put or post requests using Buffer objects should work', function() {

      var data = [];

      for(var i=0; i< 1024; i++)
        data.push(Math.round(Math.random()*256))


      frisby.create('POST random binary data via Buffer object')
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

      frisby.create('PUT random binary data via Buffer object')
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

  it('PATCH requests with Buffer and Stream objects should work.', function() {
      var patchCommand = 'Patch me!';

      frisby.create('PATCH via Buffer object')
          .patch('http://httpbin.org/patch',
          new Buffer(patchCommand),
          {
              json : false,
              headers : {
                  "content-type" : "text/plain"
              }
          })
          .expectStatus(200)
          .expectHeaderContains('content-type', 'application/json')
          .expectJSON({
              data : patchCommand.toString(),
              headers: {
                  "Content-Type": "text/plain",
                  "Content-Length" : String(patchCommand.length)
              },
              url: "http://httpbin.org/patch",
              json : null,
              files: {},
              form: {}
          })
          .expectJSONTypes({
              data: String
          })
          .toss();

      frisby.create('PATCH via Stream object')
          .patch('http://httpbin.org/patch',
          new StringStream(patchCommand),
          {
              json : false,
              headers : {
                  "content-type" : "text/plain",
                  "content-length" : String(patchCommand.length)
              }
          })
          .expectStatus(200)
          .expectHeaderContains('content-type', 'application/json')
          .expectJSON({
              data : patchCommand.toString(),
              headers: {
                  "Content-Type": "text/plain",
                  "Content-Length" : String(patchCommand.length)
              },
              url: "http://httpbin.org/patch",
              json : null,
              files: {},
              form: {}
          })
          .expectJSONTypes({
              data: String
          })
          .toss();

  });

  it('sending binary data via put or post requests using Stream objects should work', function() {
        var filePath = path.resolve(__dirname, './logo-frisby.png');
        var fileSize = fs.statSync(filePath).size;
        var fileContent = fs.readFileSync(filePath);

        /*
         * NOTE: Using a Stream with httpbin.org requires to set the Content-Length header to not use chunked
         *       HTTP transfer. When chunked httpbin does return an empty data field. However not setting the
         *       Content-Length
         */

        frisby.create('POST frisby logo to http://httpbin.org/post using a Stream')
            .post('http://httpbin.org/post',
                fs.createReadStream(filePath),
                {
                    json: false,
                    headers: {
                        "content-type": "application/octet-stream",
                        "content-length": fileSize
                    }
                })
                .expectStatus(200)
                .expectHeaderContains('content-type', 'application/json')
                .expectJSON({
                    data: 'data:application/octet-stream;base64,' + fileContent.toString('base64'),
                    headers: {
                        "Content-Type": "application/octet-stream",
                        "Content-Length": String(fileSize)
                    },
                    url: 'http://httpbin.org/post'
                })
                .expectJSONTypes({
                    data: String
                })
                .toss();

        frisby.create('PUT frisby logo to http://httpbin.org/put using a Stream')
            .put('http://httpbin.org/put',
                fs.createReadStream(filePath),
                {
                    json: false,
                    headers: {
                        "Content-Type": "application/octet-stream",
                        "Content-Length": fileSize
                    }
                })
                .expectStatus(200)
                .expectHeaderContains('content-type', 'application/json')
                .expectJSON({
                    data: 'data:application/octet-stream;base64,' + fileContent.toString('base64'),
                    headers: {
                        "Content-Type": "application/octet-stream",
                        "Content-Length": String(fileSize)
                    },
                    url: 'http://httpbin.org/put'
                })
                .expectJSONTypes({
                    data: String
                })
                .toss();
    });

});

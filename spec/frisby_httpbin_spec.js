var frisby = require('../lib/frisby');
var fs = require('fs');
var path = require('path');
var util = require('util');
var Readable = require('stream').Readable;
var FormData = require('form-data');

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

  it('sending multipart/from-data encoded bodies should work', function () {

    var logoPath = path.resolve(__dirname, '../spec/logo-frisby.png');

    var binaryData = [0xDE, 0xCA, 0xFB, 0xAD];

    function makeFormData() {
      var form = new FormData();

      form.append('field_a', 'A');
      form.append('field_b', 'B');

      form.append('buffer', new Buffer(binaryData), {
        contentType: 'application/octet-stream',
        filename: 'test.bin'               // using Buffers, we need to pass a filename to make form-data set the content-type
      });

      form.append('file_1', fs.createReadStream(logoPath), {
        knownLength: fs.statSync(logoPath).size         // we need to set the knownLength so we can call  form.getLengthSync()
      });

      form.append('file_2', fs.createReadStream(__filename), {
        knownLength: fs.statSync(__filename).size       // we need to set the knownLength so we can call  form.getLengthSync()
      });
      return form;
    }

    var form = makeFormData();

    frisby.create('POST frisby logo to http://httpbin.org/post')
      .post('http://httpbin.org/post',
      form,
      {
        json: false,
        headers: {
          'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
          'content-length': form.getLengthSync()
        }
      })
      .expectStatus(200)
      .expectHeaderContains('content-type', 'application/json')
      .expectJSON({
        data: '', // empty, data is returned in the files and form propierties
        headers: {
          "Content-Type": 'multipart/form-data; boundary=' + form.getBoundary()
        },
        url: 'http://httpbin.org/post',
        json: null,
        files: {
          buffer: 'data:application/octet-stream;base64,' + new Buffer(binaryData).toString('base64'),
          file_1: 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64'),
          file_2: fs.readFileSync(__filename).toString()
        },
        form: {
          field_a: 'A',
          field_b: 'B'
        }
      })
      .expectJSONTypes({
        data: String,
        form: {
          field_a: String,
          field_b: String
        },
        files: {
          buffer: String,
          file_1: String,
          file_2: String
        }
      })
      .toss();

    form = makeFormData();  // FormData is a Stream and it has been consumed!

    frisby.create('PUT frisby logo to http://httpbin.org/post')
      .put('http://httpbin.org/put',
      form,
      {
        json: false,
        headers: {
          'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
          'content-length': form.getLengthSync()
        }
      })
      .expectStatus(200)
      .expectHeaderContains('content-type', 'application/json')
      .expectJSON({
        data: '', // empty, data is returned in the files and form propierties
        headers: {
          "Content-Type": 'multipart/form-data; boundary=' + form.getBoundary()
        },
        url: 'http://httpbin.org/put',
        json: null,
        files: {
          buffer: 'data:application/octet-stream;base64,' + new Buffer(binaryData).toString('base64'),
          file_1: 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64'),
          file_2: fs.readFileSync(__filename).toString()
        },
        form: {
          field_a: 'A',
          field_b: 'B'
        }
      })
      .expectJSONTypes({
        data: String,
        form: {
          field_a: String,
          field_b: String
        },
        files: {
          buffer: String,
          file_1: String,
          file_2: String
        }
      })
      .toss();

    form = makeFormData();  // FormData is a Stream and it has been consumed!

    frisby.create('PATCH frisby logo to http://httpbin.org/post')
      .patch('http://httpbin.org/patch',
      form,
      {
        json: false,
        headers: {
          'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
          'content-length': form.getLengthSync()
        }
      })
      .expectStatus(200)
      .expectHeaderContains('content-type', 'application/json')
      .expectJSON({
        data: '', // empty, data is returned in the files and form propierties
        headers: {
          "Content-Type": 'multipart/form-data; boundary=' + form.getBoundary()
        },
        url: 'http://httpbin.org/patch',
        json: null,
        files: {
          buffer: 'data:application/octet-stream;base64,' + new Buffer(binaryData).toString('base64'),
          file_1: 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64'),
          file_2: fs.readFileSync(__filename).toString()
        },
        form: {
          field_a: 'A',
          field_b: 'B'
        }
      })
      .expectJSONTypes({
        data: String,
        form: {
          field_a: String,
          field_b: String
        },
        files: {
          buffer: String,
          file_1: String,
          file_2: String
        }
      })
      .toss();

  })
});

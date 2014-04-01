/**
 * frisby.js: browser file upload (multipart/form-data) example using Streams and Buffers (RFC 2388)
 *
 * This is useful for testing a server side API dealing with file uploads initiated by a browser.
 *
 * author: Stefan Kreutter
 */
var frisby = require('../lib/frisby');
var fs = require('fs');
var path = require('path');
var FormData = require('form-data');

var logoPath = path.resolve(__dirname, '../spec/logo-frisby.png');

var binaryData = [0xDE, 0xCA, 0xFB, 0xAD];

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




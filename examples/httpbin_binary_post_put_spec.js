/**
 * frisby.js: Binary Data PUT/POST Example (to httpbin.org)
 *
 * Testing binary data with POST and PUT requests can be done using a Buffer or a Stream
 *
 * Buffer:
 *  - pass the binary data as a Buffer (second param to post)
 *  - set the json option to false (third param)
 *  - add a "content-type" header with value "application/octet-stream" to the options (third param)
 *
 * Stream:
 *  - pass the binary data as a ReadStream (second param to post)
 *  - set the json option to false (third param)
 *  - add a "content-type" header with value "application/octet-stream" to the options (third param)
 *  - add a "content-length" header with value to the options (third param)
 *
 * NOTE: using Streams to send data without setting the content-length does also work but results in a chunked
 *       transfer-encoding. In this case httpbin.org does return an empty data field.
 *
 *
 * httpbin.org/post replies with the data encoded in a base64 string
 *
 * author: Stefan Kreutter
 */

var frisby = require('../lib/frisby');
var fs = require('fs');
var path = require('path');

var filePath = path.resolve(__dirname, '../spec/logo-frisby.png');
var fileSize = fs.statSync(filePath).size;
var fileContent = fs.readFileSync(filePath);

frisby.create('POST frisby logo to http://httpbin.org/post using a Buffer object')
    .post('http://httpbin.org/post',
        fileContent,
        {
            json: false,
            headers: {
                "content-type": "application/octet-stream"
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
            url: "http://httpbin.org/post",
            json: null,
            files: {},
            form: {}
        })
        .expectJSONTypes({
            data: String
        })
        .toss();

frisby.create('PUT frisby logo to http://httpbin.org/put  using a Buffer object')
    .put('http://httpbin.org/put',
        fileContent,
        {
            json: false,
            headers: {
                "content-type": "application/octet-stream"
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
            url: "http://httpbin.org/put",
            json: null,
            files: {},
            form: {}
        })
        .expectJSONTypes({
            data: String
        })
        .toss();

frisby.create('POST frisby logo to http://httpbin.org/post using a Stream')
    .post('http://httpbin.org/post',
        fs.createReadStream(filePath),
        {
            json: false,
            headers: {
                "content-type": "application/octet-stream",
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
                "Content-type": "application/octet-stream",
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
            url: 'http://httpbin.org/put'
        })
        .expectJSONTypes({
            data: String
        })
        .toss();


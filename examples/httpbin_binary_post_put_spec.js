/**
 * frisby.js: Binary Data PUT/POST Example (to httpbin.org)
 *
 * In order to send binary data using a POST request you need to:
 *  - pass the binary data as a Buffer (second param to post)
 *  - set the json option to false (third param)
 *  - add a "content-type" header with value "application/octet-stream" to the options (third param)
 *
 * httpbin.org/post replies with the data encoded in a base64 string
 *
 * author: Stefan Kreutter
 */
var frisby = require('../lib/frisby');
var fs = require('fs');
var path = require('path');

var logo = fs.readFileSync(path.resolve(__dirname, '../spec/logo-frisby.png'));

frisby.create('POST frisby logo to http://httpbin.org/post')
    .post('http://httpbin.org/post',
        logo,
        {
            json: false,
            headers: {
                "content-type": "application/octet-stream"
            }
        })
        .expectStatus(200)
        .expectHeaderContains('content-type', 'application/json')
        .expectJSON({
            data: 'data:application/octet-stream;base64,' + logo.toString('base64'),
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Length": "4168"
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

frisby.create('PUT frisby logo to http://httpbin.org/post')
    .put('http://httpbin.org/put',
        logo,
        {
            json: false,
            headers: {
                "content-type": "application/octet-stream"
            }
        })
        .expectStatus(200)
        .expectHeaderContains('content-type', 'application/json')
        .expectJSON({
            data: 'data:application/octet-stream;base64,' + logo.toString('base64'),
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Length": "4168"
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


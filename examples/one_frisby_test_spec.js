/**
 * frisby.js: how to run only one frisby test
 * DO NOT RUN THIS WITH OTHERS TESTS, THIS WILL DISABLE OTHER TESTS
 *
 * Author: He Sicong
 */

var frisby = require('../lib/frisby');

frisby.globalSetup({
    request: {
        headers:{'Accept': 'application/json'}
    }
});

frisby.create('Should NOT run this failed test')
    .get('https://graph.facebook.com/111848702235277')
    .expectStatus(400)
    .toss();

frisby.create('Should only run this test')
    .get('https://graph.facebook.com/111848702235277')
    .expectStatus(200)
    .ttoss();
'use strict';

const frisby = require('../src/frisby');
const mocks = require('./fixtures/http_mocks');

const testHost = 'http://api.example.com';

describe('Frisby expectNot()', function() {

  it('expectHeader should not match', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.get(testHost + '/users/1')
      .expectNot('header', 'Content-Type', 'application/json-NOT')
      .done(doneFn);
  });

  it('expectStatus should not match', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.get(testHost + '/users/1')
      .expectNot('status', 999)
      .done(doneFn);
  });

});

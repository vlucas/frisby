'use strict';

const frisby = require('../src/frisby');
const mocks = require('./fixtures/http_mocks');

const testHost = 'http://api.example.com';

describe('Frisby', function() {

  it('expectStatus should match', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('status', 200)
      .done(doneFn);
  });

  it('expectHeader should match exactly', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('header', 'Content-Type', 'application/json')
      .done(doneFn);
  });

  it('expectHeader should match regardless of case', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('header', 'conTent-tYpe', 'application/json')
      .done(doneFn);
  });

});

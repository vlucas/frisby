'use strict';

const frisby = require('../src/frisby');
const mocks = require('./fixtures/http_mocks');

const testHost = 'http://api.example.com';

describe('Frisby expect json', function() {

  it('should match exact JSON', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('json', {
        id: 1,
        email: 'joe.schmoe@example.com'
      })
      .done(doneFn);
  });

  it('should error with extra key', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expectNot('json', {
        id: 1,
        id2: 2,
        email: 'joe.schmoe@example.com'
      })
      .done(doneFn);
  });

  it('should error with missing key', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expectNot('json', {
        email: 'joe.schmoe@example.com'
      })
      .done(doneFn);
  });

  it('should error with matching keys, but incorrect values', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expectNot('json', {
        id: 1,
        email: 'joe.schmoe@example.net'
      })
      .done(doneFn);
  });

  it('should match from data via fromJSON', function(doneFn) {
    frisby.fromJSON({
        foo: 'bar'
      })
      .expect('json', {
        foo: 'bar'
      })
      .done(doneFn);
  });

});

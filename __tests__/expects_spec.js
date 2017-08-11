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

  it('expectHeader should match with regex', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('header', 'Content-Type', /json/)
      .done(doneFn);
  });

  it('expectHeader should not match with bad regex', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expectNot('header', 'Content-Type', /jsonx/)
      .done(doneFn);
  });

  it('expectHeader should only check for header existence when third argument is not supplied', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('header', 'Content-Type')
      .done(doneFn);
  });

  it('expectHeader should fail check for header existence when third argument is not supplied and header is not present', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expectNot('header', 'Custom-Header')
      .done(doneFn);
  });

  it('expectHeader should match array header', function(doneFn) {
    mocks.use(['arrayHeader']);

    frisby.fetch(testHost + '/array-header')
      .expect('header', 'array', 'one')
      .expect('header', 'array', /one|two/)
      .done(doneFn);
  });

  it('expectHeader should not match array header', function(doneFn) {
    mocks.use(['arrayHeader']);

    frisby.fetch(testHost + '/array-header')
      .expectNot('header', 'array', 'three')
      .expectNot('header', 'array', /three|four/)
      .done(doneFn);
  });

  it('expectBodyContains should match string', function(doneFn) {
    mocks.use(['getContent']);

    frisby.fetch(testHost + '/contents/1')
      .expect('bodyContains', 'something')
      .done(doneFn);
  });

  it('expectBodyContains should match regex', function(doneFn) {
    mocks.use(['getContent']);

    frisby.fetch(testHost + '/contents/1')
      .expect('bodyContains', /something/)
      .done(doneFn);
  });

});

'use strict';

const frisby = require('../src/frisby');
const mocks = require('./fixtures/http_mocks');

const testHost = 'http://api.example.com';

describe('Frisby', function() {

  it('Test expectStatus works as... well, expected', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('status', 200)
      .done(doneFn);
  });

  it('should support JSON natively', function (doneFn) {
    mocks.use(['createUser2']);

    frisby.post(testHost + '/users', {
        body: {
          email: 'user@example.com',
          password: 'password'
        }
      })
      .expect('status', 201)
      .done(doneFn);
  });

  it('should allow custom expect handlers to be registered and used', function (doneFn) {
    mocks.use(['getUser1']);

    // Add our custom expect handler
    frisby.addExpectHandler('customUserResponse', function(response) {
      let json = response._body;
      expect(json.id).toBe(1);
      expect(json.email).toBe('joe.schmoe@example.com');
    });

    // Use it!
    frisby.get(testHost + '/users/1')
      .expect('customUserResponse')
      .done(doneFn);

    // Remove said custom handler
    frisby.removeExpectHandler('customUserResponse');
  });

  it('should allow custom expect functions to be used without registering them', function (doneFn) {
    mocks.use(['getUser1']);

    frisby.get(testHost + '/users/1')
      .then(function (json) {
        expect(json.id).toBe(1);
        expect(json.email).toBe('joe.schmoe@example.com');
      })
      .done(doneFn);
  });

  it('should allow POST with empty request body', function (doneFn) {
    mocks.use(['postError']);

    frisby.post(testHost + '/error')
      .expect('status', 400)
      .expect('json', {
        result: 'error'
      })
      .done(doneFn);
  });

  it('should use new responseBody when returning another Frisby spec from then()', function (doneFn) {
    mocks.use(['getUser1', 'getUser2WithDelay']);

    frisby.get(testHost + '/users/1')
      .expect('jsonContains', { id: 1 })
      .then(frisby.get(testHost + '/users/2')
          .expect('jsonContains', { id: 2 })
      )
      .then(function (user2) {
        expect(user2.id).toBe(2);
      })
      .done(doneFn);
  });

  it('should use new responseBody when returning another Frisby spec inside then()', function (doneFn) {
    mocks.use(['getUser1', 'getUser2WithDelay']);

    frisby.get(testHost + '/users/1')
      .expect('jsonContains', { id: 1 })
      .then(function () {
        return frisby.get(testHost + '/users/2')
          .expect('jsonContains', { id: 2 });
      })
      .then(function (user2) {
        expect(user2.id).toBe(2);
      })
      .done(doneFn);
  });

  it('should use new responseBody when returning another Frisby spec inside then() with multiple specs chained', function (doneFn) {
    mocks.use(['getUser1', 'getUser2WithDelay']);

    frisby.get(testHost + '/users/1')
      .expect('jsonContains', { id: 1 })
      .then(function () {
        mocks.use(['getUser1WithDelay']);

        return frisby.get(testHost + '/users/1')
          .expect('jsonContains', { id: 2 });
      })
      .then(function (user1) {
        expect(user1.id).toBe(1);
      })
      .then(function () {
        return frisby.get(testHost + '/users/2')
          .expect('jsonContains', { id: 2 });
      })
      .then(function (user2) {
        expect(user2.id).toBe(2);
      })
      .done(doneFn);
  });

  it('use function allows modifications for current Frisby spec', function(doneFn) {
    mocks.use(['getUser1WithAuth']);

    let withAuthHeader = function (spec) {
      spec.setup({
        request: {
          headers: { 'authorization': 'Basic Auth' }
        }
      });
    };

    frisby.use(withAuthHeader)
      .fetch(testHost + '/users/1/auth')
      .expect('status', 200)
      .done(doneFn);
  });

  it('frisby setup merges options with previous options already set', function(doneFn) {
    mocks.use(['twoHeaders']);

    // Should merge headers so both are present
    frisby.setup({
        request: {
          headers: { 'One': 'one' }
        }
      })
      .setup({
        request: {
          headers: { 'Two': 'two' }
        }
      })
      .fetch(testHost + '/two-headers')
      .expect('status', 200)
      .done(doneFn);
  });

  it('frisby setup second parameter replaces setup options instead of merging them', function(doneFn) {
    mocks.use(['getUser1WithAuth']);

    // Second call uses 'true' as 2nd argument, so it should overwrite options
    frisby.setup({
        request: {
          headers: { 'authorizationX': 'Basic AuthX' }
        }
      })
      .setup({
        request: {
          headers: { 'authorization': 'Basic Auth' }
        }
      }, true)
      .fetch(testHost + '/users/1/auth')
      .expect('status', 200)
      .done(doneFn);
  });
});

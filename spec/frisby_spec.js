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
    frisby.addExpectHandler('customUserResponse', function(expect, response) {
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
});

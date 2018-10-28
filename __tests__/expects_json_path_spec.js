'use strict';

const frisby = require('../src/frisby');
const Joi = frisby.Joi;
const mocks = require('./fixtures/http_mocks');

const testHost = 'http://api.example.com';

describe('expect(\'json\', <path>, <value>)', function() {

  describe('json', function() {
    it('should get single array object at known position', function(doneFn) {
      mocks.use(['getUsers']);

      frisby.fetch(testHost + '/users')
        .expect('json', 'data.0', {
          id: 1,
          email: 'joe.schmoe@example.com'
        })
        .done(doneFn);
    });

    it('should get single array object at known position using bracket', function(doneFn) {
      mocks.use(['getUsers']);

      frisby.fetch(testHost + '/users')
        .expect('json', 'data[0]', {
          id: 1,
          email: 'joe.schmoe@example.com'
        })
        .done(doneFn);
    });

    it('should get single array object at known position and test for single value', function(doneFn) {
      mocks.use(['getUsers']);

      frisby.fetch(testHost + '/users')
        .expect('json', 'data.0.id', 1)
        .done(doneFn);
    });

    it('should test one of the values in an array', function(doneFn) {
      mocks.use(['getUsers']);

      frisby.fetch(testHost + '/users')
        .expect('json', 'data.?', {
          id: 1,
          email: 'joe.schmoe@example.com'
        })
        .done(doneFn);
    });

    it('should test one of the values in an array for a single field', function(doneFn) {
      mocks.use(['getUsers']);

      frisby.fetch(testHost + '/users')
        .expect('json', 'data.?.email', 'joe.schmoe@example.com')
        .done(doneFn);
    });

    it('should test one of the values in an object', function(doneFn) {
      mocks.use(['getUsersName']);

      frisby.fetch(testHost + '/users.name')
        .expect('json', 'data.?', {
          id: 1,
          email: 'joe.schmoe@example.com'
        })
        .done(doneFn);
    });

    it('should test one of the values in an object for a single field', function(doneFn) {
      mocks.use(['getUsersName']);

      frisby.fetch(testHost + '/users.name')
        .expect('json', 'data.?.email', 'joe.schmoe@example.com')
        .done(doneFn);
    });

    it('should error on an empty array (1)', function(doneFn) {
      frisby.setup({ request: { inspectOnFailure: false } })
        .fromJSON([])
        .expect('json', '*', 1)
        .catch(function (err) {
          expect(err.message).toContain("Expected '*' not found");
        })
        .done(doneFn);
    });

    it('should error in an empty array (2)', function(doneFn) {
      frisby.setup({ request: { inspectOnFailure: false } })
        .fromJSON([])
        .expect('json', '?', 1)
        .catch(function (err) {
          expect(err.message).toContain("Expected '?' not found");
        })
        .done(doneFn);
    });

    it('should error in an empty object', function(doneFn) {
      frisby.setup({ request: { inspectOnFailure: false } })
        .fromJSON({})
        .expect('json', '&', 1)
        .catch(function (err) {
          expect(err.message).toContain("Expected '&' not found");
        })
        .done(doneFn);
    });
  });

  describe('jsonTypes', function() {
    it('should test every object in an array', function(doneFn) {
      mocks.use(['getUsers']);

      frisby.fetch(testHost + '/users')
        .expect('jsonTypes', 'data.*', {
          id: Joi.number(),
          email: Joi.string().email()
        })
        .done(doneFn);
    });

    it('should test every object in an array for a single value', function(doneFn) {
      mocks.use(['getUsers']);

      frisby.fetch(testHost + '/users')
        .expect('jsonTypes', 'data.*.id', Joi.number())
        .done(doneFn);
    });

    it('should test every object in an object', function(doneFn) {
      mocks.use(['getUsersName']);

      frisby.fetch(testHost + '/users.name')
        .expect('jsonTypes', 'data.&', {
          id: Joi.number(),
          email: Joi.string().email()
        })
        .done(doneFn);
    });

    it('should test every object in an object for a single value', function(doneFn) {
      mocks.use(['getUsersName']);

      frisby.fetch(testHost + '/users.name')
        .expect('jsonTypes', 'data.&.id', Joi.number())
        .done(doneFn);
    });

    it('should test every object in an object (2)', function(doneFn) {
      mocks.use(['getUsersName']);

      frisby.fetch(testHost + '/users.name')
        .expect('jsonTypes', 'data.*', {
          id: Joi.number(),
          email: Joi.string().email()
        })
        .done(doneFn);
    });

    it('should test every object in an object for a single value (2)', function(doneFn) {
      mocks.use(['getUsersName']);

      frisby.fetch(testHost + '/users.name')
        .expect('jsonTypes', 'data.*.id', Joi.number())
        .done(doneFn);
    });
  });

});


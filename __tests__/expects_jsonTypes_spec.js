'use strict';

const frisby = require('../src/frisby');
const Joi = frisby.Joi;
const mocks = require('./fixtures/http_mocks');

const testHost = 'http://api.example.com';

describe('expect(\'jsonTypes\')', function() {

  it('should match exact JSON', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('jsonTypes', {
        id: Joi.number(),
        email: Joi.string()
      })
      .done(doneFn);
  });

  it('should error with extra key', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expectNot('jsonTypes', {
        id: Joi.number().required(),
        id2: Joi.number().required(),
        email: Joi.string().email().required()
      })
      .done(doneFn);
  });

  it('should error with missing key', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expectNot('jsonTypes', {
        email: Joi.number()
      })
      .done(doneFn);
  });

  it('should error with matching keys, but incorrect value types', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expectNot('json', {
        id: Joi.string(),
        email: Joi.number()
      })
      .done(doneFn);
  });

  it('should match from data via fromJSON', function(doneFn) {
    frisby.fromJSON({
        foo: 'bar'
      })
      .expect('jsonTypes', {
        foo: Joi.string()
      })
      .done(doneFn);
  });

  it('should match JSON in using provided path', function(doneFn) {
    frisby.fromJSON({
        one: {
          two: {
            three: 3
          }
        }
      })
      .expect('jsonTypes', 'one.two', {
        three: Joi.number()
      })
      .done(doneFn);
  });

  it('should match JSON with nested structure and no path', function(doneFn) {
    frisby.fromJSON({
        one: {
          foo: 'bar',
          two: {
            three: 3
          }
        }
      })
      .expect('jsonTypes', {
        one: {
          foo: Joi.string(),
          two: {
            three: Joi.number()
          }
        }
      })
      .done(doneFn);
  });

  it('should match JSON with nested structure and single path', function(doneFn) {
    frisby.fromJSON({
        one: {
          foo: 'bar',
          two: {
            three: 3
          }
        }
      })
      .expect('jsonTypes', 'one', {
        foo: Joi.string(),
        two: {
          three: Joi.number()
        }
      })
      .done(doneFn);
  });

  it('should fail JSON with nested structure and incorrect type', function(doneFn) {
    frisby.fromJSON({
        one: {
          foo: 'bar',
        }
      })
      .expectNot('jsonTypes', 'one', {
        foo: Joi.number()
      })
      .done(doneFn);
  });

  it('should validate JSON with single value', function(doneFn) {
    frisby.fromJSON({
        one: {
          foo: 'bar',
          two: {
            three: 3
          }
        }
      })
      .expect('jsonTypes', 'one.two.three', Joi.number())
      .done(doneFn);
  });

  it('should match JSON with array of objects and asterisk path (each)', function (doneFn) {
    frisby.fromJSON({
        "offers": [{"name": "offer1"}, {"name": "offer2"}]
      })
      .expect('jsonTypes', 'offers.*', {
        "name": Joi.string()
      })
      .done(doneFn);
  });

  it('should ignore additional JSON keys', function (doneFn) {
    frisby.fromJSON({
        "name": "john",
        "foo": "bar"
      })
      .expect('jsonTypes', {
        "name": Joi.string()
      })
      .done(doneFn);
  });
});

describe('expect(\'jsonTypesStrict\')', function() {

  it('should error on additional JSON keys not accounted for', function (doneFn) {
    frisby.fromJSON({
        "name": "john",
        "foo": "bar"
      })
      .expect('jsonTypesStrict', {
        "name": Joi.string(),
        "foo": Joi.string()
      })
      .expectNot('jsonTypesStrict', {
        "name": Joi.string()
      })
      .done(doneFn);
  });
});

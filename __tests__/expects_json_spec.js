'use strict';

const frisby = require('../src/frisby');
const mocks = require('./fixtures/http_mocks');

const testHost = 'http://api.example.com';

describe('expect(\'json\')', function() {

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

  it('should NOT error with missing key', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('json', {
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
      foo: 'bar',
      bar: 'baz'
    })
      .expect('json', {
        foo: 'bar'
      })
      .done(doneFn);
  });

  it('should error with incorrect nested key value', function(doneFn) {
    frisby.fromJSON({
      one: {
        two: {
          three: 3
        }
      }
    })
      .expectNot('json', {
        one: {
          two: {
            three: 4
          }
        }
      })
      .done(doneFn);
  });

  it('should match JSON content using provided path and object', function(doneFn) {
    frisby.fromJSON({
      one: {
        two: {
          three: 3
        }
      }
    })
      .expect('json', 'one.two', {
        three: 3
      })
      .done(doneFn);
  });

  it('should match single value using json', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('json', 'id', 1)
      .done(doneFn);
  });

  it('should match single value using RegExp', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('json', 'email', /joe\.\w+@\w+\.\w{3}/)
      .done(doneFn);
  });

  it('should match single null value using json', function(doneFn) {
    frisby.fromJSON({
      foo: null
    })
      .expect('json', 'foo', null)
      .done(doneFn);
  });

  it('should match array using json', function(doneFn) {
    frisby.fromJSON(['a', 1, true, null])
      .expect('json', ['a', 1, true, null])
      .then(function() {
        return frisby.fromJSON(['a', 1, true, null])
          .expect('json', ['a', 1, true]);
      })
      .then(function() {
        return frisby.fromJSON(['a', 1, true, null])
          .expect('json', [1, null]);
      })
      .then(function() {
        return frisby.fromJSON([{a: 0}, {b: 1}, {c: 2}, [0, 1, 2]])
          .expect('json', [{a: 0}, {b: 1}, {c: 2}, [0, 1, 2]]);
      })
      .then(function() {
        return frisby.fromJSON([{a: 0}, {b: 1}, {c: 2}, [0, 1, 2]])
          .expect('json', [{a: 0}, {b: 1}, {c: 2}]);
      })
      .then(function() {
        return frisby.fromJSON([{a: 0}, {b: 1}, {c: 2}, [0, 1, 2]])
          .expect('json', [{b: 1}, [0, 1, 2]]);
      })
      .done(doneFn);
  });

  it('should error different array using json', function(doneFn) {
    frisby.fromJSON(['a', 1, true, null])
      .expectNot('json', ['a', 0, true, null])
      .then(function() {
        return frisby.fromJSON(['a', 1, true, null])
          .expectNot('json', ['a', 1, true, null, false]);
      })
      .then(function() {
        return frisby.fromJSON(['a', 1, true, null])
          .expectNot('json', [0, null]);
      })
      .then(function() {
        return frisby.fromJSON([{a: 0}, {b: 1}, {c: 2}, [0, 1, 2]])
          .expectNot('json', [{a: 0}, {b: 1}, {c: 1}, [0, 1, 2]]);
      })
      .then(function() {
        return frisby.fromJSON([{a: 0}, {b: 1}, {c: 2}, [0, 1, 2]])
          .expectNot('json', [{a: 0}, {b: 1}, {c: 1}]);
      })
      .then(function() {
        return frisby.fromJSON([{a: 0}, {b: 1}, {c: 2}, [0, 1, 2]])
          .expectNot('json', [{b: 1}, [0, 1, 1]]);
      })
      .then(function() {
        return frisby.fromJSON({a: 0})
          .expectNot('json', [{a: 0}]);
      })
      .done(doneFn);
  });

});

describe('expect(\'jsonStrict\')', function() {
  it('should match exact JSON', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('jsonStrict', {
        id: 1,
        email: 'joe.schmoe@example.com'
      })
      .done(doneFn);
  });

  it('should error with extra key', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expectNot('jsonStrict', {
        id: 1,
        id2: 2,
        email: 'joe.schmoe@example.com'
      })
      .done(doneFn);
  });

  it('should error with missing key', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expectNot('jsonStrict', {
        email: 'joe.schmoe@example.com'
      })
      .done(doneFn);
  });

  it('should error with matching keys, but incorrect values', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expectNot('jsonStrict', {
        id: 1,
        email: 'joe.schmoe@example.net'
      })
      .done(doneFn);
  });

  it('should match from data via fromJSON', function(doneFn) {
    frisby.fromJSON({
      foo: 'bar'
    })
      .expect('jsonStrict', {
        foo: 'bar'
      })
      .done(doneFn);
  });

  it('should match single value using json', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('jsonStrict', 'id', 1)
      .done(doneFn);
  });

  it('should match single null value using json', function(doneFn) {
    frisby.fromJSON({
      foo: null
    })
      .expect('jsonStrict', 'foo', null)
      .done(doneFn);
  });

});

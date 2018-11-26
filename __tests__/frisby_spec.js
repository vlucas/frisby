'use strict';

const assert = require('assert');
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

  it('should handle a 204 response with no content', function(doneFn) {
    mocks.use(['noContent']);

    frisby.fetch(testHost + '/contents/none')
      .expect('status', 204)
      .done(doneFn);
  });

  it('should handle a 204 response with no content and then()', function(doneFn) {
    mocks.use(['noContent']);

    frisby.fetch(testHost + '/contents/none')
      .expect('status', 204)
      .then((res) => {
        expect(res.body).toEqual('');
      })
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
      let json = response.json;
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
      .then(function (res) {
        let json = res.json;

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

  it('should allow DELETE with request body', function (doneFn) {
    mocks.use(['deleteUsers']);

    frisby.delete(testHost + '/users', {
      body: {
        data: [
          {id: 2},
          {id: 3}
        ]
      }
    })
      .expect('status', 200)
      .expect('json', {
        data: [
          {id: 2},
          {id: 3}
        ]
      })
      .done(doneFn);
  });

  it('should allow DELETE with text request body', function (doneFn) {
    mocks.use(['deleteContent']);

    frisby.delete(testHost + '/contents/1', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'something something'
    })
      .expect('status', 200)
      .expect('bodyContains', 'something something')
      .done(doneFn);
  });

  it('should call Frisby spec delete()', function(doneFn) {
    mocks.use(['deleteUser1']);

    frisby.setup({ request: { inspectOnFailure: false } })
      .delete(testHost + '/users/1')
      .expect('status', 204)
      .done(doneFn);
  });

  it('should use new responseBody when returning another Frisby spec from then()', function (doneFn) {
    mocks.use(['getUser1', 'getUser2WithDelay']);

    frisby.get(testHost + '/users/1')
      .expect('json', { id: 1 })
      .then(frisby.get(testHost + '/users/2')
        .expect('json', { id: 2 })
      )
      .then(function (res) {
        expect(res.json.id).toBe(2);
      })
      .done(doneFn);
  });

  it('should use new responseBody when returning another Frisby spec inside then()', function (doneFn) {
    mocks.use(['getUser1', 'getUser2WithDelay']);

    frisby.get(testHost + '/users/1')
      .expect('json', { id: 1 })
      .then(function () {
        return frisby.get(testHost + '/users/2')
          .expect('json', { id: 2 });
      })
      .then(function (res) {
        expect(res.json.id).toBe(2);
      })
      .done(doneFn);
  });

  it('should use new responseBody when returning another Frisby spec inside then() with multiple specs chained', function (doneFn) {
    mocks.use(['getUser1', 'getUser2WithDelay']);

    frisby.get(testHost + '/users/1')
      .expect('json', { id: 1 })
      .then(function () {
        mocks.use(['getUser1WithDelay']);

        return frisby.get(testHost + '/users/1')
          .expect('json', { id: 1 });
      })
      .then(function (res) {
        expect(res.json.id).toBe(1);
      })
      .then(function () {
        return frisby.get(testHost + '/users/2')
          .expect('json', { id: 2 });
      })
      .then(function (res) {
        expect(res.json.id).toBe(2);
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

  it('frisby timeout is configurable per spec', function(doneFn) {
    mocks.use(['timeout']);

    // Test timeout by catching timeout error and running assertions on it
    frisby.timeout(10)
      .use(function (spec) {
        expect(spec.timeout()).toBe(10);
      })
      .fetch(testHost + '/timeout')
      .catch(function (err) {
        expect(err.name).toBe('FetchError');
      })
      .done(doneFn);
  });

  it('should allow custom headers to be set for future requests', function(doneFn) {
    mocks.use(['setCookie', 'requireCookie']);

    // Call path only
    frisby.get(testHost + '/cookies/set')
      .expect('status', 200)
      .expect('header', 'Set-Cookie')
      .then((res) => {
        let cookie1 = res.headers.get('Set-Cookie');

        return frisby.get(testHost + '/cookies/check', {
          headers: {
            'Cookie': cookie1
          }
        })
          .expect('status', 200);
      })
      .done(doneFn);
  });

  it('baseUrl sets global baseUrl to be used with all relative URLs', function(doneFn) {
    mocks.use(['getUser1']);

    // Set baseUrl
    frisby.baseUrl(testHost);

    // Call path only
    frisby.fetch('/users/1')
      .expect('status', 200)
      .done(doneFn);
  });

  it('should accept urls which include multibyte characters', function(doneFn) {
    mocks.use(['multibyte']);

    frisby.fetch(testHost + '/こんにちは')
      .expect('status', 200)
      .done(doneFn);
  });

  it('should auto encode URIs that do not use fetch() with the urlEncode: false option set', function(doneFn) {
    mocks.use(['urlEncoded']);

    frisby.get(testHost + '/ftp//etc/os-release%00.md')
      .expect('status', 200)
      .done(doneFn);
  });

  it('should not encode URIs that use fetch() with the urlEncode: false option set', function(doneFn) {
    mocks.use(['notUrlEncoded']);

    frisby.fetch(testHost + '/ftp//etc/os-release%00.md', {}, { urlEncode: false })
      .expect('status', 200)
      .done(doneFn);
  });

  it('should throw an error and a deprecation warning if you try to call v0.x frisby.create()', function() {
    assert.throws(function(err) {
      // OLD style of Frisby - will not work (throws error)
      frisby.create('this will surely throw an error!')
        .expectStatus(200)
        .toss();
    }, /ERROR/i);
  });

  it('should be able to extend FrisbySpec with a custom class', function() {
    let OriginalFrisbySpec = frisby.FrisbySpec;

    class FrisbySpecExtended extends OriginalFrisbySpec {
      customMethod() {
        return true;
      }
    }

    // Have frisby use our class
    frisby.FrisbySpec = FrisbySpecExtended;

    let actual = frisby.fromJSON({}).customMethod();
    let expected = true;

    assert.equal(actual, expected);

    // Restore original FrisbySpec class
    frisby.FrisbySpec = OriginalFrisbySpec;
  });

  it('should use new responseBody when returning another Frisby spec inside catch()', function (doneFn) {
    mocks.use(['getUser1', 'getUser2WithDelay']);

    frisby.get(testHost + '/users/10')
      .expect('json', { id: 10 })
      .then(function (res) {
        fail('this function will never be called.');
      })
      .catch(function (err) {
        expect(err.name).toContain('FetchError');

        return frisby.setup({ request: { inspectOnFailure: false } })
          .get(testHost + '/users/1')
          .expect('json', { id: 10 });
      })
      .then(function (res) {
        fail('this function will never be called.');
      })
      .catch(function (err) {
        expect(err.name).toContain('AssertionError');

        return frisby.get(testHost + '/users/2')
          .expect('json', { id: 2 });
      })
      .then(function (res) {
        expect(res.json.id).toBe(2);
      })
      .done(doneFn);
  });

  it('should output invalid body and reason in error message', function(doneFn) {
    mocks.use(['invalidJSON']);

    frisby.setup({ request: { inspectOnFailure: false } })
      .get(testHost + '/res/invalid')
      .then(function (res) {
        fail('this function will never be called.');
      })
      .catch(function (err) {
        expect(err.message).toMatch(/^Invalid json response /);
        expect(err.message).toMatch(/body: '.*'/);
        expect(err.message).toMatch(/reason: '.+'/);
      })
      .done(doneFn);
  });

  it('receive response body as raw buffer', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.setup({ request: { rawBody: true } })
      .get(testHost + '/users/1')
      .expect('status', 200)
      .expect('header', 'Content-Type', /json/)
      .then(res => {
        expect(res.json).toBeUndefined();
        expect(res.body).not.toBeInstanceOf(String);
        return String.fromCharCode.apply(null, new Uint8Array(res.body));
      })
      .then(text => {
        expect(text).toContain('joe.schmoe@example.com');
      })
      .done(doneFn);
  });
});

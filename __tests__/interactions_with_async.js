'use strict';
const assert = require('assert');
const frisby = require('../src/frisby');
const mocks = require('./fixtures/http_mocks');

const testHost = 'http://api.example.com';

describe('Frisby async interactions', function () {
  it('should resolve with response upon then()', function (done) {
    mocks.use(['getUser1']);

    frisby.get(testHost + '/users/1')
      .then((res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body, '{"id":1,"email":"joe.schmoe@example.com"}');

        done();
      });
  });

  it('should call with nothing the callback passed to done()', function (done) {
    mocks.use(['getUser1']);

    frisby.get(testHost + '/users/1')
      .done(function () {
        assert.equal(arguments.length, 0);

        done();
      });
  });

  it('should resolve with error upon then()', function (done) {
    mocks.use(['networkError']);

    frisby.get(testHost + '/bad-network')
      .then(() => {
        assert.fail('Should have failed.');
        done();
      }, (err) => {
        assert(err.message.includes('Network failed.'));
        done();
      });
  });

  it('should resolve with error upon catch()', function (done) {
    mocks.use(['networkError']);

    frisby.get(testHost + '/bad-network')
      .catch((err) => {
        assert(err.message.includes('Network failed.'));
        done();
      });
  });

  it('should resolve with spec upon then(), no fetch()', function (done) {
    frisby.setup({})
      .then((spec) => {
        assert(spec instanceof frisby.FrisbySpec);

        done();
      });
  });

  it('should throw upon done() without fetch()', function (done) {
    assert.throws(() => {
      frisby.setup().done();

      done();
    });
  });

  it('should throw upon catch() without fetch()', function (done) {
    assert.throws(() => {
      frisby.setup().done();

      done();
    });
  });
});

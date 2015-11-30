'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getExpectHandlers = getExpectHandlers;

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var assert = _chai2.default.assert;

var expects = {

  // HTTP status
  'status': function expectStatus(response, statusCode) {
    assert.equal(response.status, statusCode);
  }

};

function getExpectHandlers() {
  return expects;
}
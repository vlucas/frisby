'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.version = undefined;
exports.createWithAction = createWithAction;
exports.fetch = fetch;
exports.post = post;
exports.addExpectHandler = addExpectHandler;

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

var _spec = require('./frisby/spec.js');

var _spec2 = _interopRequireDefault(_spec);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Export Frisby version from package.json
 */
var version = exports.version = _package2.default.version;

/**
 * Create a new FrisbySpec test with specified name
 */
function createWithAction(action, params) {
  var test = new _spec2.default();
  return test[action].apply(test, params);
}
function fetch() {
  for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
    params[_key] = arguments[_key];
  }

  return createWithAction('fetch', params);
}
function post() {
  for (var _len2 = arguments.length, params = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    params[_key2] = arguments[_key2];
  }

  return createWithAction('post', params);
}

function addExpectHandler(expectName, expectFn) {
  return _spec2.default.addExpectHandler(expectName, expectFn);
}
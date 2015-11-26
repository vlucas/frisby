'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.version = undefined;
exports.create = create;
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
function create(testName) {
  return new _spec2.default(testName);
}

function addExpectHandler(expectName, expectFn) {
  return _spec2.default.addExpectHandler(expectName, expectFn);
}
'use strict';

let pkg = require('../package.json');
let FrisbySpec = require('./frisby/spec.js');


/**
 * Export Frisby version from package.json
 */
const version = pkg.version;

/**
 * Create a new FrisbySpec test with specified name
 */
function createWithAction(action, args) {
  let frisby = new FrisbySpec();
  let params = Array.prototype.slice.call(args);
  return frisby[action].apply(frisby, params);
}
function fetch() {
  return createWithAction('fetch', arguments);
}
function get() {
  return createWithAction('get', arguments);
}
function patch() {
  return createWithAction('patch', arguments);
}
function post() {
  return createWithAction('post', arguments);
}
function put() {
  return createWithAction('put', arguments);
}
function del() {
  return createWithAction('del', arguments);
}
function fromJSON() {
  return createWithAction('fromJSON', arguments);
}

function addExpectHandler(expectName, expectFn) {
  return FrisbySpec.addExpectHandler(expectName, expectFn);
}
function removeExpectHandler(expectName, expectFn) {
  return FrisbySpec.removeExpectHandler(expectName, expectFn);
}

module.exports = { version, createWithAction, fetch, get: get, patch, post, put, del, fromJSON, addExpectHandler, removeExpectHandler };

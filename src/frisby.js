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
function createWithAction(action, params) {
  let test = new FrisbySpec();
  return test[action].apply(test, params);
}
function fetch() {
  return createWithAction('fetch', arguments);
}
function get() {
  return createWithAction('get', arguments);
}
function post() {
  return createWithAction('post', arguments);
}
function del() {
  return createWithAction('delete', arguments);
}

function addExpectHandler(expectName, expectFn) {
  return FrisbySpec.addExpectHandler(expectName, expectFn);
}

module.exports = { createWithAction, fetch, get: get, post, del, addExpectHandler };

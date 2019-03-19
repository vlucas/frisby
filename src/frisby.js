'use strict';

const _ = require('lodash');
const Joi = require('joi');
const pkg = require('../package.json');
const FormData = require('form-data');
const FrisbySpec = require('./frisby/spec.js');
const utils = require('./frisby/utils.js');


/**
 * Export Frisby version from package.json
 */
const version = pkg.version;

const _globalSetupDefaults = {
  request: {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'frisby/' + version + ' (+https://github.com/vlucas/frisby)',
    },
    rawBody: false,
    inspectOnFailure: true,
    timeout: 5000,
  },
};
let _globalSetup = _.cloneDeep(_globalSetupDefaults);

/**
 * Set global base URL for all your frisby tests
 */
function baseUrl(url) {
  _.merge(_globalSetup, {
    request: {
      baseUrl: url,
    },
  });
}

/**
 * Throw custom error for those who didn't lock their 'frisby' versions, and get v2 instead of v0.8.5... tsk tsk
 *
 * @throws Error
 */
function create(name) {
  throw new Error(`
    [ERROR] frisby.create() has been removed from Frisby v2.x. If you want
    to continue using the previous latest version of Frisby 0.x, lock your
    package.json version of frisby to "0.8.5".

    To install and continue using v0.8.5 (unsupported):
    npm install frisby@0.8.5 --save-dev

    If you would like to upgrade to v2, see:
    https://github.com/vlucas/frisby/wiki/Upgrading
  `);
}

/**
 * Create a new FrisbySpec test with specified name
 */
function createWithAction(action, args) {
  let frisby = new module.exports.FrisbySpec();

  // Use current global setup options
  frisby.setup(_globalSetup);

  // Call action with given args
  let params = Array.prototype.slice.call(args);
  return frisby[action].apply(frisby, params);
}

/**
 * Create and return new FormData instance
 */
function formData() {
  return new FormData();
}

/**
 * Global setup for Frisby
 *
 * @param {Object} opts
 */
function globalSetup(opts) {
  _globalSetup = _.merge(_.cloneDeep(_globalSetupDefaults), opts);
}

/**
 * HTTP helpers
 */
function del() {
  return createWithAction('del', arguments);
}
function fetch() {
  return createWithAction('fetch', arguments);
}
function fromJSON() {
  return createWithAction('fromJSON', arguments);
}
function get() {
  return createWithAction('get', arguments);
}
function head() {
  return createWithAction('head', arguments);
}
function options() {
  return createWithAction('options', arguments);
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
function setup() {
  return createWithAction('setup', arguments);
}
function timeout() {
  return createWithAction('timeout', arguments);
}
function use() {
  return createWithAction('use', arguments);
}

/**
 * Global expect handlers for custom expectations
 */
function addExpectHandler(expectName, expectFn) {
  return module.exports.FrisbySpec.addExpectHandler(expectName, expectFn);
}
function removeExpectHandler(expectName, expectFn) {
  return module.exports.FrisbySpec.removeExpectHandler(expectName, expectFn);
}

module.exports = {
  addExpectHandler,
  baseUrl,
  create,
  del,
  delete: del,
  fetch,
  FrisbySpec,
  formData,
  fromJSON,
  get: get,
  globalSetup,
  head,
  Joi,
  options,
  patch,
  post,
  put,
  removeExpectHandler,
  setup,
  timeout,
  use,
  utils,
  version,
};

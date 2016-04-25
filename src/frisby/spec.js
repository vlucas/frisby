'use strict';

// NPM
let _ = require('lodash');
let fetch = require('node-fetch');

// Frisby
let expectHandlers = require('./expects');


class FrisbySpec {
  constructor() {
    this._fetch;
    this._response;
    this._expects = [];
  }

  /**
   * Fetch given URL with params (passthru to 'fetch' API)
   */
  fetch(url, params) {
    this._fetch = fetch(url, params || {})
      .then((response) => {
        this._response = response;
        return response.json();
      }).then((json) => {
        this._response.json = json;
      });

    return this;
  }

  /**
   * GET convenience wrapper
   */
  get(url) {
    return this.fetch(url);
  }

  /**
   * POST convenience wrapper
   * Auto-encodes JSON if 'body' is typeof object
   */
  post(url, params) {
    let postParams = {
      method: 'post'
    };

    // Auto-encode JSON body
    if (_.isObject(params.body)) {
      params.body = JSON.stringify(params.body);
    }

    _.merge(postParams, params || {});

    return this.fetch(url, postParams);
  }

  /**
   * DELETE convenience wrapper
   */
  del(url) {
    return this.fetch(url, { method: 'delete' });
  }

  /**
   * Chain calls to execute after fetch()
   */
  then(fn) {
    this._ensureHasFetched();
    this._fetch.then(fn);

    return this;
  }

  /**
   * Run test expectations
   */
  _runExpects() {
    this._ensureHasFetched();

    // Run all expectations
    this.then(() => {
      for(let i = 0; i < this._expects.length; i++) {
        this._expects[i].call(this, this._response);
      }
    });
  }

  /**
   * Inspectors (to inspect data that the test is returning)
   * ==========================================================================
   */

  inspectResponse() {
    this.then(() => {
      console.log(this._response);
    });

    return this;
  }

  /**
   * Expectations (wrappers around Jasmine methods)
   * ==========================================================================
   */

  /**
   * Add expectation for current test
   */
  expect(expectName) {
    if (typeof expectHandlers[expectName] === 'undefined') {
      throw new Error("Expectation '" + expectName + "' is not defined.");
    }

    let expectValues = arguments;
    return this._addExpect(() => {
      expectHandlers[expectName].apply(this, [this._response].concat(expectValues));
    });
  }

  /**
   * Private methods (not meant to be part of the public API, and NOT to be
   * relied upon by consuming code - these names may change!)
   * ==========================================================================
   */

  /**
   * Ensure fetch() has been called already
   */
  _ensureHasFetched() {
    if (typeof this._fetch === 'undefined') {
      throw new Error('Frisby spec not started. You must call fetch() first to begin a Frisby test.');
    }
  }

  /**
   * Add expectation to execute after HTTP call is done
   */
  _addExpect(fn) {
    this._expects.push(fn);
    return this;
  }

  /**
   * Static methods (mainly ones that affect all Frisby tests)
   * ==========================================================================
   */
  static addExpectHandler(expectName, expectFn) {
    expectHandlers[expectName] = expectFn;
  }
  static removeExpectHandler(expectName) {
    delete expectHandlers[expectName];
  }
}

module.exports = FrisbySpec;

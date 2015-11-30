// NPM
import _ from 'lodash';
import fetch from 'node-fetch';

// Frisby
import { getExpectHandlers } from './expects';
let expectHandlers = getExpectHandlers();

export default class FrisbySpec {
  constructor(testName) {
    this._testName = testName;
    this._fetch;
    this._response;
    this._assertions = [];
  }

  /**
   * Fetch given URL with params (passthru to 'fetch' API)
   */
  fetch(url, params = {}) {
    this._fetch = fetch(url, params)
      .then((response) => {
        this._response = response;
        return response.json();
      }).then((json) => {
        this._response.json = json;
      });

    return this;
  }

  /**
   * POST convenience wrapper
   * Auto-encodes JSON if 'body' is typeof object
   */
  post(url, params = {}) {
    let postParams = {
      method: 'post'
    };

    // Auto-encode JSON body
    if (_.isObject(params.body)) {
      params.body = JSON.stringify(params.body);
    }

    _.merge(postParams, params);

    return this.fetch(url, postParams);
  }

  /**
   * DELETE convenience wrapper
   */
  delete(url, params = {}) {
    let deleteParams = {
      method: 'delete'
    };

    _.merge(deleteParams, params);

    return this.fetch(url, deleteParams);
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
   * Generate Jasmine test from Frisby instructions
   */
  toss() {
    this._ensureHasFetched();

    // Requires Jasmine for 'it' function
    it(this._testName, (doneFn) => {

      this.then(() => {
        this._runAssertions();
        doneFn.call(null);
      });

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
   * Assertions (wrappers around Jasmine methods)
   * ==========================================================================
   */

  /**
   * Add assertions for current test
   */
  expect(expectName, ...expectValues) {
    if (typeof expectHandlers[expectName] === 'undefined') {
      throw new Error("Expectation '" + expectName + "' is not defined.");
    }

    return this._addAssertion(() => {
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
  _addAssertion(fn) {
    this._assertions.push(fn);
    return this;
  }

  /**
   * Run/execute all defined expect statements made for this test
   */
  _runAssertions() {
    for(let i = 0; i < this._assertions.length; i++) {
      this._assertions[i].call(this, this._response);
    }
  }

  /**
   * Static methods (mainly ones that affect all Frisby tests)
   * ==========================================================================
   */
  static addExpectHandler(expectName, expectFn) {
    expectHandlers[expectName] = expectFn;
  }
}

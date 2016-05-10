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
   * Load JSON directly for use
   */
  fromJSON(json) {
    let jsonString = JSON.stringify(json);

    // Prepare headers
    let headers = new fetch.Headers();
    headers.set('Content-Type', 'application/json');

    // Prepare Response object
    this._response = new fetch.Response(jsonString, {
      url: '/',
      status: 200,
      statusText: 'OK',
      headers: headers,
      size: jsonString.length,
      timeout: 0
    });

    // Resolve as promise
    this._fetch = fetch.Promise.resolve(this._response)
      .then(response => response.json())
      .then((responseBody) => {
        this._response._body = responseBody;
        this._runExpects();

        return responseBody;
      }).catch(this._fetchErrorHandler);

    return this;
  }

  /**
   * Fetch given URL with params (passthru to 'fetch' API)
   */
  fetch(url, params) {
    this._fetch = fetch(url, params || {})
      .then((response) => {
        this._response = response;

        if (response.headers.get('Content-Type') === 'application/json') {
          return response.json();
        }
        return response.text();
      }).then((responseBody) => {
        this._response._body = responseBody;
        this._runExpects();

        return responseBody;
      }).catch(this._fetchErrorHandler);

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
    this._fetch.then((responseBody) => {
      fn(responseBody);
      return responseBody;
    }).catch(this._fetchErrorHandler);

    return this;
  }

  /**
   * Used for 'done' function in Jasmine async tests
   * Ensures any errors get pass
   */
  done(doneFn) {
    this._fetch.then(() => doneFn());
  }

  _fetchErrorHandler(err) {
    // Hack alert: This is the easiest way I found to fail an async Jasmine
    // test (ex. in a Promise chain) and still show the full error and stack
    // trace to the user
    expect(err.stack).toBeNull();
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

    return this;
  }

  /**
   * Inspectors (to inspect data that the test is returning)
   * ==========================================================================
   */

  inspectResponse() {
    return this.then(() => { this.inspectLog("\nResponse:", this._response); });
  }

  inspectBody() {
    return this.then(() => { this.inspectLog("\nBody:", this._response._body); });
  }

  inspectStatus() {
    return this.then(() => { this.inspectLog("\nStatus:", this._response.status); });
  }

  inspectHeaders() {
    console.log("\n");
    return this.then(() => {
      this.inspectLog('Headers:');
      let headers = this._response.headers._headers;
      for (let key in headers) {
        this.inspectLog("\t" + key + ': ' + headers[key]);
      }
    });
  }

  inspectLog() {
    let params = Array.prototype.slice.call(arguments);
    console.log.apply(null, params);
    return this;
  }

  /**
   * Expectations (wrappers around Jasmine methods)
   * ==========================================================================
   */

  /**
   * Add expectation for current test (expects)
   */
  expect(expectName) {
    let expectArgs = Array.prototype.slice.call(arguments).slice(1);
    return this._getExpectRunner(expectName, expectArgs, true);
  }

  /**
   * Add negative expectation for current test (expects.not)
   */
  expectNot(expectName) {
    let expectArgs = Array.prototype.slice.call(arguments).slice(1);
    return this._getExpectRunner(expectName, expectArgs, false);
  }

  /**
   * Private methods (not meant to be part of the public API, and NOT to be
   * relied upon by consuming code - these names may change!)
   * ==========================================================================
   */

  /**
   * Used internally for expect and expectNot to add expectations and then run them
   */
  _getExpectRunner(expectName, expectArgs, expectPass) {
    let expectHandler;
    let expectFn = expect; // Global - from Jasmine

    if (_.isFunction(expectName)) {
      expectHandler = expectName;
    } else {
      expectHandler = expectHandlers[expectName];
      if (typeof expectHandler === 'undefined') {
        throw new Error("Expectation '" + expectName + "' is not defined.");
      }
    }

    // Use negative expectation if we don't expect the test to pass
    if (expectPass === false) {
      expectFn = value => expect(value).not;
    }

    return this._addExpect((response) => {
      expectHandler.apply(this, [expectFn, response].concat(expectArgs));
    });
  }

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

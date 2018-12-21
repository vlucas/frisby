'use strict';

// NPM
const _ = require('lodash');
const fetch = require('node-fetch');
const FormData = require('form-data');
const TIMEOUT_DEFAULT = 5000;

// Frisby
const FrisbyResponse = require('./response');
const expectHandlers = require('./expects');


class FrisbySpec {
  constructor() {
    this._fetch;
    this._request;
    this._response;

    this._timeout;
    this._setupDefaults = {};
  }

  /**
   * Call function to do some setup for this spec/test
   */
  use(fn) {
    fn(this);
    return this;
  }

  /**
   * Setup defaults (probably from globalSetup(), but can be also be called per test)
   */
  setup(opts, replace) {
    this._setupDefaults = replace ? opts : _.merge(this._setupDefaults, opts);
    return this;
  }

  /**
   * Timeout getter/setter
   *
   * @param {number} timeout - Max. timeout in milliseconds
   */
  timeout(timeout) {
    // GETTER
    if (!timeout) {
      return this._timeout || (this._setupDefaults.request && this._setupDefaults.request.timeout) || TIMEOUT_DEFAULT;
    }

    // SETTER
    this._timeout = timeout;
    return this;
  }

  /**
   * Load JSON directly for use
   *
   * @param {Object} json - JSON to use as HTTP response
   */
  fromJSON(json) {
    let jsonString = JSON.stringify(json);

    // Prepare headers
    let headers = new fetch.Headers();
    headers.set('Content-Type', 'application/json');

    // Prepare Response object
    let fetchResponse = new fetch.Response(jsonString, {
      url: '/',
      status: 200,
      statusText: 'OK',
      headers: headers,
      size: _.isUndefined(jsonString) ? 0 : jsonString.length,
      timeout: 0
    });

    // Resolve as promise
    this._fetch = Promise.resolve(fetchResponse)
      .then(response => {
        this._response = new FrisbyResponse(response);
        return response.text()
          .then(text => {
            let response = this._response;
            response._body = text;
            if (text.length > 0) {
              response._json = JSON.parse(text);
            }
          });
      })
      .then(() => {
        return this._response;
      });

    return this;
  }

  getBaseUrl() {
    return this._setupDefaults.request && this._setupDefaults.request.baseUrl ? this._setupDefaults.request.baseUrl : false;
  }

  _formatUrl(url, urlEncode = true) {
    let newUrl = urlEncode ? encodeURI(url) : url;
    let baseUrl = this.getBaseUrl();

    // Prepend baseUrl if set, and if URL supplied is a path
    if (url.startsWith('/') && baseUrl) {
      newUrl = baseUrl + url;
    }

    return newUrl;
  }

  _fetchParams(params = {}) {
    let fetchParams = _.cloneDeep(this._setupDefaults.request);

    // Form handling - send correct form headers
    if (params.body instanceof FormData) {
      delete fetchParams.headers['Content-Type'];
    }

    return _.merge(fetchParams, params);
  }

  /**
   * Fetch given URL with params (passthru to 'fetch' API)
   */
  fetch(url, params = {}, options = {}) {
    let fetchParams = this._fetchParams(params);
    this._request = new fetch.Request(this._formatUrl(url, options.urlEncode), fetchParams);

    this._fetch = fetch(this._request, { timeout: this.timeout() }) // 'timeout' is a node-fetch option
      .then(response => {
        this._response = new FrisbyResponse(response);
        if (this._setupDefaults.request && this._setupDefaults.request.rawBody) {
          return response.arrayBuffer()
            .then(buffer => {
              this._response._body = buffer;
            });
        }

        return response.textConverted()
          .then(text => {
            let response = this._response;
            response._body = text;
            // Auto-parse JSON
            if (response.headers.has('Content-Type') && response.headers.get('Content-Type').includes('json') && response.status !== 204 && text.length > 0) {
              try {
                response._json = JSON.parse(text);
              } catch(e) {
                return Promise.reject(new TypeError(`Invalid json response body: '${text}' at ${this._request.url} reason: '${e.message}'`));
              }
            }
          });
      })
      .then(() => {
        return this._response;
      });

    return this;
  }

  /**
   * GET convenience wrapper
   */
  get(url, params) {
    return this.fetch(url, params);
  }

  /**
   * PATCH convenience wrapper
   */
  patch(url, params) {
    return this._requestWithBody('PATCH', url, params);
  }

  /**
   * POST convenience wrapper
   */
  post(url, params) {
    return this._requestWithBody('POST', url, params);
  }

  /**
   * PUT convenience wrapper
   */
  put(url, params) {
    return this._requestWithBody('PUT', url, params);
  }

  /**
   * DELETE convenience wrapper
   */
  del(url, params) {
    return this._requestWithBody('DELETE', url, params);
  }

  delete(url, params) {
    return this.del(url, params);
  }

  /**
   *
   */
  _requestWithBody(method, url, params) {
    let postParams = { method };

    // Auto-encode JSON body if NOT FormData
    if (params && _.isObject(params.body)) {
      if (!(params.body instanceof FormData)) {
        params.body = JSON.stringify(params.body);
      }
    }

    // Auto-set 'body' from 'params' JSON if 'body' and 'headers' are not provided (assume sending raw body only)
    if (params && _.isUndefined(params.body) && _.isUndefined(params.headers)) {
      postParams.body = JSON.stringify(params);
    }

    return this.fetch(url, Object.assign(postParams, params || {}));
  }

  /**
   * Chain calls to execute after fetch()
   */
  then(onFulfilled, onRejected) {
    if (onFulfilled instanceof FrisbySpec) {
      return onFulfilled;
    }

    this._ensureHasFetched();
    this._fetch = this._fetch.then(response => {
      let result = onFulfilled ? onFulfilled(response) : null;

      if (result) {
        return result;
      } else {
        return response;
      }
    }, err => onRejected ? onRejected(err) : Promise.reject(err));
    return this;
  }

  /**
   * Used for 'done' function in Jasmine async tests
   * Ensures any errors get pass
   */
  done(doneFn) {
    this._ensureHasFetched();
    this._fetch = this._fetch.then(() => doneFn());
    return this;
  }

  /**
   * Custom error handler (Promise catch)
   */
  catch(onRejected) {
    this._ensureHasFetched();
    this._fetch = this._fetch.catch(err => onRejected ? onRejected(err) : Promise.reject(err));
    return this;
  }

  /**
   * Return internal promise used by Frisby.js
   * Note: Using this will break the chainability of Frisby.js method calls
   */
  promise() {
    return this._fetch;
  }

  /**
   * Inspectors (to inspect data that the test is returning)
   * ==========================================================================
   */

  inspectResponse() {
    return this.then(() => { this.inspectLog('\nResponse:', this._response); });
  }

  inspectRequest() {
    return this.then(() => { this.inspectLog('\nRequest:', this._request); });
  }

  inspectRequestHeaders() {
    return this.then(() => {
      this.inspectLog('\nRequest Headers:');
      let headers = this._request.headers.raw();

      for (let key in headers) {
        this.inspectLog(`\t${key}: ${headers[key]}`);
      }
    });
  }

  inspectBody() {
    return this.then(() => { this.inspectLog('\nBody:', this._response.body); });
  }

  inspectJSON() {
    return this.then(() => { this.inspectLog('\nJSON:', JSON.stringify(this._response.json, null, 4)); });
  }

  inspectStatus() {
    return this.then(() => { this.inspectLog('\nStatus:', this._response.status); });
  }

  inspectHeaders() {
    return this.then(() => {
      this.inspectLog('\nResponse Headers:');
      let headers = this._response.headers.raw();

      for (let key in headers) {
        this.inspectLog(`\t${key}: ${headers[key]}`);
      }
    });
  }

  inspectLog(...args) {
    console.log.call(null, ...args); // eslint-disable-line no-console
    return this;
  }

  _inspectOnFailure() {
    if (this._setupDefaults.request && this._setupDefaults.request.inspectOnFailure) {
      if (this._response) {
        let response = this._response;
        if (response.json) {
          this.inspectLog('\nFAILURE Status:', response.status, '\nJSON:', JSON.stringify(response.json, null, 4));
        } else {
          this.inspectLog('\nFAILURE Status:', response.status, '\nBody:', response.body);
        }
      }
    }
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
    return this.then(this._getExpectRunner(expectName, expectArgs, true));
  }

  /**
   * Add negative expectation for current test (expects.not)
   */
  expectNot(expectName) {
    let expectArgs = Array.prototype.slice.call(arguments).slice(1);
    return this.then(this._getExpectRunner(expectName, expectArgs, false));
  }

  /**
   * Private methods (not meant to be part of the public API, and NOT to be
   * relied upon by consuming code - these names may change!)
   * ==========================================================================
   */

  /**
   * Used internally for expect and expectNot to return expectation function and then run it
   */
  _getExpectRunner(expectName, expectArgs, expectPass) {
    let expectHandler;

    if (_.isFunction(expectName)) {
      expectHandler = expectName;
    } else {
      expectHandler = expectHandlers[expectName];
      if (typeof expectHandler === 'undefined') {
        throw new Error("Expectation '" + expectName + "' is not defined.");
      }
    }

    return response => {
      let didFail = false;

      try {
        expectHandler.apply(this, [response].concat(expectArgs));
      } catch(e) {
        didFail = true;

        // Re-throw error if pass is expected; else bury it
        if (expectPass === true) {
          this._inspectOnFailure();
          throw e;
        }
      }

      if (!expectPass && !didFail) {
        this._inspectOnFailure();

        let fnArgs = expectArgs.map(a => a.toString()).join(', ');
        throw new Error(`expectNot('${expectName}', ${fnArgs}) passed and was supposed to fail`);
      }
    };
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

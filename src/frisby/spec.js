import _ from 'lodash';
import fetch from 'node-fetch';

export default class FrisbySpec {
  constructor(testName) {
    this.testName = testName;
    this.fetch;
    this.response;
    this.responseJson;
    this.expects = [];
  }

  /**
   * Create new test
   */
  fetch(url, params = {}) {
    this.fetch = fetch(url, params)
      .then((response) => {
        this.response = response;
        return response;
      });

    return this;
  }

  /**
   * Chain calls to execute after fetch()
   */
  then(fn) {
    this._ensureHasFetched();
    this.fetch.then(fn);

    return this;
  }

  /**
   * Generate Jasmine test from Frisby instructions
   */
  toss() {
    this._ensureHasFetched();

    // Requires Jasmine
    it(this.testName, (doneFn) => {

      this.then(() => {
        for(let i = 0; i < this.expects.length; i++) {
          this.expects[i].call(this, this.response);
        }

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
      console.log(this.response);
    });

    return this;
  }

  /**
   * Expectations (wrappers around Jasmine methods)
   * ==========================================================================
   */

  expectStatus(statusCode) {
    this.expects.push(function expectStatus(response) {
      expect(response.status).toBe(statusCode);
    });

    return this;
  }

  /**
   * Private methods (not meant to be part of the public API)
   * ==========================================================================
   */

  /**
   * Ensure fetch() has been called already
   */
  _ensureHasFetched() {
    if (typeof this.fetch === 'undefined') {
      throw new Error('Frisby spec not started. You must call fetch() first to begin a Frisby test.');
    }
  }
}

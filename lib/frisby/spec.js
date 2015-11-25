'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FrisbySpec = (function () {
  function FrisbySpec(testName) {
    _classCallCheck(this, FrisbySpec);

    this.testName = testName;
    this._fetch;
    this.response;
    this.responseJson;
    this.expects = [];
  }

  /**
   * Create new test
   */

  _createClass(FrisbySpec, [{
    key: 'fetch',
    value: function fetch(url) {
      var _this = this;

      var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      this._fetch = (0, _nodeFetch2.default)(url, params).then(function (response) {
        _this.response = response;
        return response;
      });

      return this;
    }

    /**
     * Chain calls to execute after fetch()
     */

  }, {
    key: 'then',
    value: function then(fn) {
      this._ensureHasFetched();
      this._fetch.then(fn);

      return this;
    }

    /**
     * Generate Jasmine test from Frisby instructions
     */

  }, {
    key: 'toss',
    value: function toss() {
      var _this2 = this;

      this._ensureHasFetched();

      // Requires Jasmine for 'it' function
      it(this.testName, function (doneFn) {

        _this2.then(function () {
          for (var i = 0; i < _this2.expects.length; i++) {
            _this2.expects[i].call(_this2, _this2.response);
          }

          doneFn.call(null);
        });
      });
    }

    /**
     * Inspectors (to inspect data that the test is returning)
     * ==========================================================================
     */

  }, {
    key: 'inspectResponse',
    value: function inspectResponse() {
      var _this3 = this;

      this.then(function () {
        console.log(_this3.response);
      });

      return this;
    }

    /**
     * Expectations (wrappers around Jasmine methods)
     * ==========================================================================
     */

  }, {
    key: 'expectStatus',
    value: function expectStatus(statusCode) {
      return this._expects(function expectStatus(response) {
        expect(response.status).toBe(statusCode);
      });
    }

    /**
     * Private methods (not meant to be part of the public API)
     * ==========================================================================
     */

    /**
     * Ensure fetch() has been called already
     */

  }, {
    key: '_ensureHasFetched',
    value: function _ensureHasFetched() {
      if (typeof this._fetch === 'undefined') {
        throw new Error('Frisby spec not started. You must call fetch() first to begin a Frisby test.');
      }
    }

    /**
     * Add expectation to execute after HTTP call is done
     */

  }, {
    key: '_expects',
    value: function _expects(fn) {
      this.expects.push(fn);
      return this;
    }
  }]);

  return FrisbySpec;
})();

exports.default = FrisbySpec;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // NPM


// Frisby


var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

var _expects = require('./expects');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var expectHandlers = (0, _expects.getExpectHandlers)();

var FrisbySpec = function () {
  function FrisbySpec() {
    _classCallCheck(this, FrisbySpec);

    this._fetch;
    this._response;
    this._expects = [];
  }

  /**
   * Fetch given URL with params (passthru to 'fetch' API)
   */


  _createClass(FrisbySpec, [{
    key: 'fetch',
    value: function fetch(url) {
      var _this = this;

      var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      this._fetch = (0, _nodeFetch2.default)(url, params).then(function (response) {
        _this._response = response;
        return response.json();
      }).then(function (json) {
        _this._response.json = json;
      });

      return this;
    }

    /**
     * POST convenience wrapper
     * Auto-encodes JSON if 'body' is typeof object
     */

  }, {
    key: 'post',
    value: function post(url) {
      var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var postParams = {
        method: 'post'
      };

      // Auto-encode JSON body
      if (_lodash2.default.isObject(params.body)) {
        params.body = JSON.stringify(params.body);
      }

      _lodash2.default.merge(postParams, params);

      return this.fetch(url, postParams);
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
     * Run test expectations
     */

  }, {
    key: '_runExpects',
    value: function _runExpects() {
      var _this2 = this;

      this._ensureHasFetched();

      // Run all expectations
      this.then(function () {
        for (var i = 0; i < _this2._expects.length; i++) {
          _this2._expects[i].call(_this2, _this2._response);
        }
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
        console.log(_this3._response);
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

  }, {
    key: 'expect',
    value: function expect(expectName) {
      var _this4 = this;

      for (var _len = arguments.length, expectValues = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        expectValues[_key - 1] = arguments[_key];
      }

      if (typeof expectHandlers[expectName] === 'undefined') {
        throw new Error("Expectation '" + expectName + "' is not defined.");
      }

      return this._addExpect(function () {
        expectHandlers[expectName].apply(_this4, [_this4._response].concat(expectValues));
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
    key: '_addExpect',
    value: function _addExpect(fn) {
      this._expects.push(fn);
      return this;
    }

    /**
     * Static methods (mainly ones that affect all Frisby tests)
     * ==========================================================================
     */

  }], [{
    key: 'addExpectHandler',
    value: function addExpectHandler(expectName, expectFn) {
      expectHandlers[expectName] = expectFn;
    }
  }]);

  return FrisbySpec;
}();

exports.default = FrisbySpec;
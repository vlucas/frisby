'use strict';

const assert = require('assert');
const _ = require('lodash');
const Joi = require('joi');
const utils = require('./utils');

/**
 * Runs obviously true assertion to increment assertion count because using
 * Node's built-in 'assert' library does not increment the assertion count in
 * Jasmine and others
 */
function incrementAssertionCount() {
  if (_.isFunction(expect)) {
    // Jasmine
    expect(true).toBe(true);
  }
}

const expects = {

  status(response, statusCode) {
    incrementAssertionCount();

    assert.strictEqual(response.status, statusCode);
  },

  bodyContains(response, value) {
    incrementAssertionCount();
    let body = response.body;

    if (value instanceof RegExp) {
      // RegExp
      assert.notEqual(body.match(value), null, `Value '${value}' not found in response body`);
    } else {
      assert.ok(body.indexOf(value) !== -1, `Value '${value}' not found in response body`);
    }
  },

  header(response, header, headerValue) {
    let headers = response.headers;
    let responseHeader = headers.get(header);

    incrementAssertionCount();

    if (responseHeader) {
      if (!headerValue) {
        assert.ok(headers.has(header));
      } else if (headerValue instanceof RegExp) {
        // RegExp
        assert.notEqual(responseHeader.match(headerValue), null, 'Header regex did not match for header ' + header);
      } else {
        // String
        assert.equal(responseHeader.toLowerCase(), headerValue.toLowerCase());
      }
    } else {
      throw new Error("Header '" + header + "' not present in HTTP response");
    }
  },

  json(response, _path, _json) {
    let json = _json ? _json : _path;
    let path = _json ? _path : false;

    incrementAssertionCount();

    utils.withPath(path, response._body, function jsonContainsAssertion(jsonChunk) {
      let failMsg = "Response [ " + JSON.stringify(jsonChunk) + " ] does not contain provided JSON [ " + JSON.stringify(json) + " ]";
      assert.ok(_.some([jsonChunk], json), failMsg);
    });
  },

  jsonStrict(response, _path, _json) {
    let json = _json ? _json : _path;
    let path = _json ? _path : false;

    incrementAssertionCount();

    utils.withPath(path, response._body, function jsonAssertion(jsonChunk) {
      assert.deepEqual(json, jsonChunk);
    });
  },

  jsonTypes(response, _path, _json) {
    let json = _json ? _json : _path;
    let path = _json ? _path : false;

    incrementAssertionCount();

    utils.withPath(path, response._body, function jsonTypesAssertion(jsonChunk) {
      let result = Joi.validate(jsonChunk, json, { allowUnknown: true });

      if (result.error) {
        throw result.error;
      }
    });
  },

  jsonTypesStrict(response, _path, _json) {
    let json = _json ? _json : _path;
    let path = _json ? _path : false;

    incrementAssertionCount();

    utils.withPath(path, response._body, function jsonTypesAssertion(jsonChunk) {
      let result = Joi.validate(jsonChunk, json);

      if (result.error) {
        throw result.error;
      }
    });
  },

};

module.exports = expects;

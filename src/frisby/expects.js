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
  if (typeof expect !== 'undefined' && _.isFunction(expect)) {
    // Jasmine
    expect(true).toBe(true);
  }
}

const expects = {

  status(response, statusCode) {
    incrementAssertionCount();

    assert.strictEqual(response.status, statusCode, `HTTP status ${statusCode} !== ${response.status}`);
  },

  bodyContains(response, value) {
    incrementAssertionCount();
    let body = response.body;

    if (value instanceof RegExp) {
      // RegExp
      assert.ok(value.test(body), `Value '${value}' not found in response body`);
    } else {
      assert.ok(body.indexOf(value) !== -1, `Value '${value}' not found in response body`);
    }
  },

  header(response, header, headerValue) {
    let headers = response.headers;

    incrementAssertionCount();

    assert.ok(headers.has(header), `Header '${header}' not present in HTTP response`);

    if (headerValue) {
      let responseHeader = headers.get(header).split(/, */);

      if (headerValue instanceof RegExp) {
        // RegExp
        assert.ok(responseHeader.some(function (resHeader) {
          return headerValue.test(resHeader);
        }), `Header regex did not match for header '${header}': '${responseHeader}'`);
      } else {
        // String
        assert.ok(responseHeader.some(function (resHeader) {
          return resHeader.toLowerCase() == headerValue.toLowerCase();
        }), `Header value '${headerValue}' did not match for header '${header}': '${responseHeader}'`);
      }
    }
  },

  json(response, _path, _json) {
    let json = _.isUndefined(_json) ? _path : _json;
    let path = _.isUndefined(_json) ? false : _path;

    incrementAssertionCount();

    utils.withPath(path, response.json, function jsonContainsAssertion(jsonChunk) {
      let failMsg = `Response [ ${JSON.stringify(jsonChunk)} ] does not contain provided JSON [ ${JSON.stringify(json)} ]`;
      let regExpFailMsg = `Response [ ${JSON.stringify(jsonChunk)} ] does not match provided RegExp [ ${json} ]`;

      if (_.isArray(json)) {
        // Array test
        assert.ok(_.differenceWith(json, jsonChunk, _.isEqual).length === 0, failMsg);
      } else if (json instanceof RegExp) {
        // RegExp test
        assert.ok(json.test(jsonChunk), regExpFailMsg);
      } else if (_.isObject(json)) {
        // Object test
        assert.ok(_.some([jsonChunk], json), failMsg);
      } else {
        // Single value test
        assert.equal(jsonChunk, json);
      }
    });
  },

  jsonStrict(response, _path, _json) {
    let json = _.isUndefined(_json) ? _path : _json;
    let path = _.isUndefined(_json) ? false : _path;

    incrementAssertionCount();

    utils.withPath(path, response.json, function jsonAssertion(jsonChunk) {
      assert.deepEqual(json, jsonChunk);
    });
  },

  jsonTypes(response, _path, _json) {
    let json = _.isUndefined(_json) ? _path : _json;
    let path = _.isUndefined(_json) ? false : _path;

    incrementAssertionCount();

    let options = { allowUnknown: true };
    if (path) {
      options.language = { root: path };
    }

    utils.withPath(path, response.json, function jsonTypesAssertion(jsonChunk) {
      let result = Joi.validate(jsonChunk, json, options);

      if (result.error) {
        throw result.error;
      }
    });
  },

  jsonTypesStrict(response, _path, _json) {
    let json = _.isUndefined(_json) ? _path : _json;
    let path = _.isUndefined(_json) ? false : _path;

    incrementAssertionCount();

    let options = {};
    if (path) {
      options.language = { root: path };
    }

    utils.withPath(path, response.json, function jsonTypesAssertion(jsonChunk) {
      let result = Joi.validate(jsonChunk, json, options);

      if (result.error) {
        throw result.error;
      }
    });
  },

};

module.exports = expects;

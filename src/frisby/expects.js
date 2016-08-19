'use strict';

const assert = require('assert');
const _ = require('lodash');
const Joi = require('joi');
const utils = require('./utils');

const expects = {

  status(response, statusCode) {
    assert.equal(response.status, statusCode);
  },

  header(response, header, headerValue) {
    let headers = response.headers;
    let responseHeader = headers.get(header);

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

    utils.withPath(path, response._body, function jsonAssertion(jsonChunk) {
      assert.deepEqual(json, jsonChunk);
    });
  },

  jsonContains(response, _path, _json) {
    let json = _json ? _json : _path;
    let path = _json ? _path : false;

    utils.withPath(path, response._body, function jsonContainsAssertion(jsonChunk) {
      let failMsg = "Response [ " + JSON.stringify(jsonChunk) + " ] does not contain provided JSON [ " + JSON.stringify(json) + " ]";
      assert.ok(_.some([jsonChunk], json), failMsg);
    });
  },

  jsonTypes(response, _path, _json) {
    let json = _json ? _json : _path;
    let path = _json ? _path : false;

    utils.withPath(path, response._body, function jsonTypesAssertion(jsonChunk) {
      let result = Joi.validate(jsonChunk, json, { allowUnknown: true });

      if (result.error) {
        throw result.error;
      }
    });
  }

};

module.exports = expects;
'use strict';

const expects = {

  status(expect, response, statusCode) {
    expect(response.status).toBe(statusCode);
  },

  header(expect, response, header, headerValue) {
    let headers = response.headers;

    if (headers.get(header)) {
      expect(headers.get(header).toLowerCase()).toEqual(headerValue.toLowerCase());
    } else {
      throw new Error("Header '" + header + "' not present in HTTP response");
    }
  },

  'json': function expectJson(expect, response, json) {
    expect(json).toEqual(response._body);
  },

  jsonContains(expect, response, json) {
    expect(response._body).toEqual(jasmine.objectContaining(json));
  }

};

module.exports = expects;

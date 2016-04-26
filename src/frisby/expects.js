'use strict';

let expects = {

  // Response Status
  'status': function expectStatus(response, statusCode) {
    expect(response.status).toBe(statusCode);
  },

  // Response Header
  'header': function expectHeader(response, header, headerValue) {
    let headers = response.headers;

    if (headers.get(header)) {
      expect(headers.get(header).toLowerCase()).toEqual(headerValue.toLowerCase());
    } else {
      throw new Error("Header '" + header + "' not present in HTTP response");
    }
  }

};

module.exports = expects;

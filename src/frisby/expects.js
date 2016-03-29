'use strict';

let expects = {

  // HTTP status
  'status': function expectStatus(response, statusCode) {
    expect(response.status).toBe(statusCode);
  }

};

module.exports = expects;

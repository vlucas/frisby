import chai from 'chai';
let assert = chai.assert;

let expects = {

  // HTTP status
  'status': function expectStatus(response, statusCode) {
    assert.equal(response.status, statusCode);
  }

};

export function getExpectHandlers() {
  return expects;
}

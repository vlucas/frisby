'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getExpectHandlers = getExpectHandlers;
var expects = {

  // HTTP status
  'status': function expectStatus(response) {
    expect(response.status).toBe(arguments.length <= 1 ? undefined : arguments[1]);
  }

};

function getExpectHandlers() {
  return expects;
}
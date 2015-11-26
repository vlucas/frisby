let expects = {

  // HTTP status
  'status': function expectStatus(response, ...params) {
    expect(response.status).toBe(params[0]);
  }

};

export function getExpectHandlers() {
  return expects;
}

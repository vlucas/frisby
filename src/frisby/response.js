'use strict';

class FrisbyResponse {
  constructor(fetchResponse) {
    this._response = fetchResponse;
  }

  get status() {
    return this._response.status;
  }

  get body() {
    return this._body;
  }

  get headers() {
    return this._response.headers;
  }

  get json() {
    // @TODO: Just return body for now, but should check header or something to ensure we actually have a JSON response...
    return this._body;
  }
}

module.exports = FrisbyResponse;

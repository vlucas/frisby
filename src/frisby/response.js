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
    return this._json;
  }
}

module.exports = FrisbyResponse;

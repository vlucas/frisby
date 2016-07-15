'use strict';

var nock = require('nock');

var mockHost = 'http://api.example.com';
var mocks = {

  /**
   * Users
   */
  getUser1: function() {
    return nock(mockHost)
      .get('/users/1')
      .reply(200, {
        id: 1,
        email: 'joe.schmoe@example.com'
      });
  },

  getUser1WithAuth: function() {
    return nock(mockHost, {
        reqheaders: { 'authorization': 'Basic Auth' },
        badheaders: ['authorizationX']
      })
      .get('/users/1/auth')
      .reply(200, {
        id: 1,
        email: 'joe.schmoe@example.com'
      });
  },

  getUser1WithDelay: function() {
    return nock(mockHost)
      .get('/users/1')
      .delay(500)
      .reply(200, {
        id: 1,
        email: 'joe.schmoe@example.com'
      });
  },

  getUser2: function() {
    return nock(mockHost)
      .get('/users/2')
      .reply(200, {
        id: 2,
        email: 'testy.mctestface@example.com'
      });
  },

  getUser2WithDelay: function() {
    return nock(mockHost)
      .get('/users/2')
      .delay(500)
      .reply(200, {
        id: 2,
        email: 'testy.mctestface@example.com'
      });
  },

  deleteUser1: function() {
    return nock(mockHost)
      .delete('/users/1')
      .reply(204);
  },

  createUser2: function() {
    return nock(mockHost)
      .post('/users', {
        email: 'user@example.com',
        password: 'password'
      })
      .reply(201, {
        id: 2,
        email: 'user@example.com'
      });
  },

  /**
   * Headers
   */

  twoHeaders: function() {
    return nock(mockHost, {
        reqheaders: {
          'One': 'one',
          'Two': 'two'
        }
      })
      .get('/two-headers')
      .reply(200, {
        one: 1,
        two: 2
      });
  },

  /**
   * Errors
   */
  postError: function() {
    return nock(mockHost)
      .post('/error')
      .reply(400, {
        result: 'error'
      });
  }

};


/**
 * Specify which mocks to setup and use
 */
module.exports.use = function (mocksRequested, callback) {
  mocksRequested.forEach(function(mockName) {
    if (typeof mocks[mockName] === 'undefined') {
      throw new Error("Mock '" + mockName + "' is not defined in 'mocks' object. Unknown mock requested.");
    }

    var result = mocks[mockName].call(this);

    if (callback) {
      callback.call(this, result);
    }
  });
};

var nock = require('nock');

var mockHost = 'http://api.example.com';
var mocks = {

  getUser1: function() {
    return nock(mockHost)
      .get('/users/1')
      .reply(200, {
        id: 1,
        email: 'joe.schmoe@example.com'
      });
  },

  deleteUser1: function() {
    return nock(mockHost)
      .delete('/users/1')
      .reply(200, {});
  },

  userCreate: function() {
    return nock(mockHost)
      .post('/users', {
        email: 'user@example.com',
        password: 'password'
      })
      .reply(201, {
        id: 2,
        email: 'user@example.com'
      });
  }

};


/**
 * Specify which mocks to setup and use
 */
module.exports.use = function (mocksRequested) {
  mocksRequested.forEach(function(mockName) {
    if (typeof mocks[mockName] === 'undefined') {
      throw new Error("Mock '" + mockName + "' is not defined in 'mocks' object. Unknown mock requested.");
    }

    mocks[mockName].call(this);
  });
};

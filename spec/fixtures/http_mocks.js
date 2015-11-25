var nock = require('nock');

var mocks = {

  user1: function() {
    return nock('http://api.example.com')
      .get('/users/1')
      .reply(200, {
        id: 1,
        username: 'joeschmoe',
        email: 'joe.schmoe@example.com'
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

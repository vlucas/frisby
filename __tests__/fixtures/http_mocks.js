'use strict';

const nock = require('nock');

const mockHost = 'http://api.example.com';
const mocks = {

  /**
   * Users
   */
  getUsers() {
    return nock(mockHost)
      .get('/users')
      .reply(200, {
        data: [
          {
            id: 1,
            email: 'joe.schmoe@example.com'
          },
          {
            id: 2,
            email: 'testy.mctestface@example.com'
          }
        ]
      });
  },

  getUsersName() {
    return nock(mockHost)
      .get('/users.name')
      .reply(200, {
        data: {
          joe: {
            id: 1,
            email: 'joe.schmoe@example.com'
          },
          testy: {
            id: 2,
            email: 'testy.mctestface@example.com'
          }
        }
      });
  },

  getUser1() {
    return nock(mockHost)
      .get('/users/1')
      .reply(200, {
        id: 1,
        email: 'joe.schmoe@example.com'
      });
  },

  getUser1WithAuth() {
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

  getUser1WithDelay() {
    return nock(mockHost)
      .get('/users/1')
      .delay(500)
      .reply(200, {
        id: 1,
        email: 'joe.schmoe@example.com'
      });
  },

  getUser2() {
    return nock(mockHost)
      .get('/users/2')
      .reply(200, {
        id: 2,
        email: 'testy.mctestface@example.com'
      });
  },

  getUser2WithDelay() {
    return nock(mockHost)
      .get('/users/2')
      .delay(500)
      .reply(200, {
        id: 2,
        email: 'testy.mctestface@example.com'
      });
  },

  deleteUser1() {
    return nock(mockHost)
      .delete('/users/1')
      .reply(204);
  },

  deleteUsers() {
    return nock(mockHost)
      .delete('/users')
      .reply(200, (uri, requestBody) => {
        return requestBody;
      });
  },

  createUser2() {
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
   * Content
   */
  noContent() {
    return nock(mockHost)
      .get('/contents/none')
      .reply(204);
  },

  getContent() {
    return nock(mockHost)
      .get('/contents/1')
      .reply(200, 'Something something something something');
  },

  deleteContent() {
    return nock(mockHost)
      .delete('/contents/1')
      .reply(200, (uri, requestBody) => {
        return requestBody;
      });
  },

  /**
   * File handling
   */
  fileContents() {
    let logoImage = __dirname + '/frisby-logo.png';

    return nock(mockHost)
      .get('/files/logo.png')
      .replyWithFile(200, logoImage, {
        'Content-Type': 'image/png'
      });
  },

  fileUploadPng() {
    return nock(mockHost)
      .post('/upload')
      .reply(200, 'File Uploaded!', {
        'Content-Type': 'image/png'
      });
  },

  /**
   * Headers
   */
  twoHeaders() {
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

  arrayHeader() {
    return nock(mockHost)
      .get('/array-header')
      .reply(200, 'Array Header.', {
        array: ['zero', 'one', 'two']
      });
  },

  /**
   * Cookies
   */
  setCookie() {
    return nock(mockHost, {
    })
      .get('/cookies/set')
      .reply(200, {
        setcookie: 1
      }, {
        'Set-Cookie': 'frisbyjs=1; path=/; expires=Wed, 01 Jan 2199 21:47:33 -0000; secure; HttpOnly'
      });
  },

  requireCookie() {
    return nock(mockHost, {
      reqheaders: {
        'Cookie': /frisbyjs/
      }
    })
      .get('/cookies/check')
      .reply(200, {
        id: 1,
        email: 'joe.schmoe@example.com'
      });
  },

  /**
   * Multibyte
   */
  multibyte() {
    return nock(mockHost)
      .get('/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF') // こんにちは
      .reply(200, 'hello');
  },

  /**
   * URL encoding option
   */
  urlEncoded() {
    return nock(mockHost)
      .get('/ftp//etc/os-release%2500.md')
      .reply(200, 'hello');
  },

  notUrlEncoded() {
    return nock(mockHost)
      .get('/ftp//etc/os-release%00.md')
      .reply(200, 'hello');
  },

  /**
   * Errors
   */
  timeout() {
    return nock(mockHost)
      .get('/timeout')
      .delay(500)
      .reply(200, {
        timout: 2000
      });
  },

  postError() {
    return nock(mockHost)
      .post('/error')
      .reply(400, {
        result: 'error'
      });
  },

  invalidJSON() {
    return nock(mockHost)
      .get('/res/invalid')
      .reply(200, '{"aaa":}', {
        'Content-Type': 'application/json'
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

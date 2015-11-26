var frisby = require('../lib/frisby');

// Setup and use mocks
var mocks = require('./fixtures/http_mocks');

var testHost = 'http://api.example.com';

describe('Frisby', function() {

  it('should throw exception if fetch() is not called', function() {
    expect(function() {
      frisby.create('should require fetch() to be called first').toss();
    }).toThrow(new Error('Frisby spec not started. You must call fetch() first to begin a Frisby test.'));
  });


  describe('should allow the creation of single tests', function() {
    mocks.use(['user1']);

    frisby.create('Test expectStatus works as... well, expected')
      .fetch(testHost + '/users/1')
      .expect('status', 200)
      .toss();
  });


  describe('should default to JSON support', function() {
    mocks.use(['userCreate']);

    frisby.create('should support JSON natively')
      .post(testHost + '/users', {
        body: {
          email: 'user@example.com',
          password: 'password'
        }
      })
      .expect('status', 201)
      .toss();
  });

  describe('should allow custom expect handlers to be registered', function() {
    mocks.use(['user1']);

    // Add our custom expect handler
    frisby.addExpectHandler('customUserResponse', function(response) {
      var json = response.json;
      expect(json.id).toBe(1);
      expect(json.email).toBe('joe.schmoe@example.com');
    });

    // Use it!
    frisby.create('should validate user1 using custom expect handler')
      .fetch(testHost + '/users/1')
      .expect('customUserResponse')
      .toss();
  });
});

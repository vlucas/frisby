var frisby = require('../lib/frisby');
var assert = require('chai').assert;

// Setup and use mocks
var mocks = require('./fixtures/http_mocks');

var testHost = 'http://api.example.com';

describe('Frisby', function() {

  it('should throw exception if fetch() is not called', function() {
    assert.throws(function() {
      frisby.create('should require fetch() to be called first').toss();
    }, Error);
  });


  describe('should allow the creation of single tests', function() {
    mocks.use(['getUser1']);

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
    mocks.use(['getUser1']);

    // Add our custom expect handler
    frisby.addExpectHandler('customUserResponse', function(response) {
      var json = response.json;
      assert.equal(json.id, 1);
      assert.equal(json.email, 'joe.schmoe@example.com');
    });

    // Use it!
    frisby.create('should validate user1 using custom expect handler')
      .fetch(testHost + '/users/1')
      .expect('customUserResponse')
      .toss();
  });


  describe('should allow nested tosses', function() {
    mocks.use(['getUser1', 'deleteUser1']);
    var frisbyCount = 0;

    // Fetch user
    frisby.create('first fetch user 1')
      .fetch(testHost + '/users/1')
      .expect('status', 200)
      .then(function(response) {
        frisbyCount++;

        // THEN delete the same user
        frisby.create('then delete user 1')
          .delete(testHost + '/users/1')
          .expect('status', 205)
          .then(function() {
            frisbyCount++;
            assert.equal(frisbyCount, 2);
          })
          .toss();

      })
      .toss();
  });

  it('should be true', function() {
    assert.isTrue(true);

    it('should be false', function() {
      assert.isTrue(false);
    });
  });
});

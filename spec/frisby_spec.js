var frisby = require('../src/frisby');

// Setup and use mocks
var mocks = require('./fixtures/http_mocks');

var testHost = 'http://api.example.com';

describe('Frisby', function() {

  it('Test expectStatus works as... well, expected', function(doneFn) {
    mocks.use(['getUser1']);

    frisby.fetch(testHost + '/users/1')
      .expect('status', 200)
      .then(doneFn);
  });



  it('should support JSON natively', function (doneFn) {
    mocks.use(['createUser2']);

    expect(true).toBeTruthy();

    frisby.post(testHost + '/users', {
        body: {
          email: 'user@example.com',
          password: 'password'
        }
      })
      .expect('status', 201)
      .then(doneFn);
  });

  if('should allow custom expect handlers to be registered and used', function (doneFn) {
    mocks.use(['getUser1']);

    // Add our custom expect handler
    frisby.addExpectHandler('customUserResponse', function(response) {
      var json = response.json;
      expect(json.id).toBe(1);
      expect(json.email).toBe('joe.schmoe@example.com');
    });

    // Use it!
    frisby.fetch(testHost + '/users/1')
      .expect('customUserResponse')
      .then(doneFn);

    // Remove said custom handler
    frisby.removeExpectHandler('customUserResponse');
  });

  it('should', function (done) {

    done();
  });
});

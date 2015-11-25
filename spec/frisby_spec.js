var frisby = require('../lib/frisby');

// Setup and use mocks
var mocks = require('./fixtures/http_mocks');
mocks.use(['user1']);

var testHost = 'http://api.example.com';

describe('Frisby structure', function() {

  it('should throw exception', function() {
    expect(function() {
      frisby.create('should require fetch() to be called first').toss();
    }).toThrow(new Error('Frisby spec not started. You must call fetch() first to begin a Frisby test.'));
  });

  describe('should allow the creation single tests', function() {

    frisby.create('Test expectStatus works as... well, expected')
      .fetch(testHost + '/users/1')
      .expectStatus(200)
      .toss();

  });

});

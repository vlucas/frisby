var frisby = require('../src/frisby');
var assert = require('chai').assert;

// Setup and use mocks
var mocks = require('./fixtures/http_mocks');

var testHost = 'http://api.example.com';

describe('Frisby nested calls', function() {

  it('should allow nested tosses', function(doneFn) {
    mocks.use(['getUser1', 'deleteUser1']);
    var frisbyCount = 0;

    // Fetch user
    frisby.fetch(testHost + '/users/1')
      .expect('status', 200)
      .then(function(response) {
        console.log('> 1 then()');
        frisbyCount++;

        // THEN delete the same user
        frisby.del(testHost + '/users/1')
          .expect('status', 205)
          .then(function() {
            console.log('> 2 then()');
            frisbyCount++;
            assert.equal(frisbyCount, 22);
          })
          .then(doneFn);
      });
  });

});

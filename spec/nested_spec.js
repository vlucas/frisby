'use strict';

const frisby = require('../src/frisby');
const mocks = require('./fixtures/http_mocks');

const testHost = 'http://api.example.com';

describe('Frisby nested calls', function() {

  it('should allow nested tosses', function(doneFn) {
    mocks.use(['getUser1', 'deleteUser1']);
    var frisbyCount = 0;

    // Fetch user
    frisby.fetch(testHost + '/users/1')
      .expect('status', 200)
      .then(function(response) {
        frisbyCount++;

        // THEN delete the same user
        frisby.del(testHost + '/users/1')
          .expect('status', 204)
          .then(function() {
            frisbyCount++;
            expect(frisbyCount).toEqual(2);
          })
          .done(doneFn);
      });
  });

  it('should allow provide previous requests response header', function(doneFn) {
    mocks.use(['provideHeaders']);

    // Fetch headers
    frisby.fetch(testHost + '/provideheaders')
      .expect('status', 200)
      .then(function(body, headers) {
            expect(headers.get('Some-Headers')).toEqual('Some-Value');
          })
          .done(doneFn);
      });

});

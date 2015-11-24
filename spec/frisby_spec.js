var frisby = require('../lib/frisby.js');

var testLocation = 'https://www.google.com';

describe('Frisby structure', function() {

  describe('should allow the creation single tests', function() {

    frisby.create('Test expectStatus works as... well, expected')
      .fetch(testLocation)
      .expectStatus(200)
      .toss();

  });

  // it('should allow the creation of test suites for grouping', function() {
  //
  //   frisby.describe('my frisby test suite', function(suite) {
  //
  //     fetch(testLocation + '/test')
  //       .expectStatus(200)
  //       .toss();
  //
  //   });
  //
  // });

});

var frisby = require('../lib/frisby');
var mockRequest = require('mock-request');

// JSON to use in mock tests
var fixtures = {
  arrayOfObjects: {
      test_subjects: [{
        test_str: "I am a string one!",
        test_str_same: "I am the same...",
        test_int: 42
      }, {
        test_str: "I am a string two!",
        test_str_same: "I am the same...",
        test_int: 43
      }, {
        test_str: "I am a string three!",
        test_str_same: "I am the same...",
        test_int: 44
      }],
      other_data: false,
      some_string: 'somewhere'
    }
};

//
// Tests run like normal Frisby specs but with 'mock' specified with a 'mock-request' object
// These work without further 'expects' statements because Frisby generates and runs Jasmine tests
//
describe('Frisby matchers', function() {

  it('expectStatus for mock request should return 404', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/not-found')
      .respond({
        statusCode: 404
      })
    .run();

    var f1 = frisby.create('test with httpbin for array of JSON objects')
      .get('http://mock-request/not-found', {mock: mockFn})
      .expectStatus(404)
      .toss();
  });

  
  it('expectJSON should test EACH object in an array with path ending with asterisk', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create('test with httpbin for array of JSON objects')
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSON('test_subjects.*', { // * == EACH object in here should match
        test_str_same: "I am the same...",
        test_int: function(val) { expect(val).toMatch(/\d+/); }
      })
      .toss();
  });


  it('expectJSON should match ONE object in an array with path ending with question mark', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create('test with httpbin for array of JSON objects')
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSON('test_subjects.?', { // ? == ONE object in here should match (contains)
        test_str: "I am a string two!",
        test_int: 43
      })
      .toss();
  });


  it('expectJSONLength should properly count arrays, strings, and objects', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create('test with httpbin for array of JSON objects')
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONLength('test_subjects', 3)
      .expectJSONLength('test_subjects.0', 3)
      .expectJSONLength('some_string', 9)
      .toss();
  });

});

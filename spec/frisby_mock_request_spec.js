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


  it('expectJSON should NOT match ONE object in an array with path ending with question mark', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create('Mock should not match one of the objects')
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSON('test_subjects.?', { // ? == ONE object in 'test_subjects' array
        test_str: "I am a string two nonsense!",
        test_int: 4433
      })
      .exceptionHandler(function(e) {
        // Expect Excepiton from 'expectJSON' due to no match being found
        expect(e.message).toEqual("Expected 'I am a string three!' to match 'I am a string two nonsense!' on key 'test_str'");
      })
      .toss();
  });


  it('expectJSONTypes should NOT match ONE object in an array with path ending with question mark', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create('Mock should not match one of the objects')
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONTypes('test_subjects.?', { // ? == ONE object in 'test_subjects' array
        test_str: Boolean,
        test_int: String
      })
      .exceptionHandler(function(e) {
        // Expect Excepiton from 'expectJSONTypes' due to no match being found
        expect(e.message).toEqual("Expected 'string' to be type 'boolean' on key 'test_str'");
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


  it('TEST FROM USER - should NOT pass', function() {
    // Mock API
    var mockFn = mockRequest.mock()
      .get('/test-complex-nesting')
      .respond({
        statusCode: 201,
        body: { response: 
          { code: 201,
           data: 
            { id: 2863928,
              user_id: 104,
              username: 'test_john3000',
              user_avatar_url: 
               { px_24x24: 'http://example.com/18d083672fcbf860755882ca6eb225c0_24x24.png',
                 px_48x48: 'http://example.com/18d083672fcbf860755882ca6eb225c0_48x48.png',
                 px_128x128: 'http://example.com/18d083672fcbf860755882ca6eb225c0_128x128.png',
                 px_512x512: 'http://example.com/18d083672fcbf860755882ca6eb225c0_512x512.png' },
              title: 'Test Title',
              highlight_color: null,
              content: 
               { rich: false,
                 yvml: '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE ex-note SYSTEM "http://example.com/pub/exml_1_0.dtd">\n<ex-note>Test Note</ex-note>',
                 html: 'Test Note',
                 html_android: 'Test Note',
                 html_ios: 'Test Note',
                 text: 'Test Note' },
              language_tag: 'en',
              version_id: 1,
              references: [
                {
                  "usfm": "GEN.1.1",
                  "human": "Genesis 1:1",
                }
              ],
              url: '/notes/2863928/test-title',
              short_url: 'http://shrt.ly/aSAJ4',
              user_status: 'public',
              system_status: 'new',
              created_dt: '2012-02-23 20:14:23+00',
              published_dt: null,
              updated_dt: '2012-02-23 20:14:23.687663+00' },
           buildtime: '2012-02-23T20:14:23+00:00' } }
      })
    .run();

    var f1 = frisby.create('test with mock complex and nested data')
      .get('http://mock-request/test-complex-nesting', {mock: mockFn})
      .expectStatus(201)
      .expectJSON('response.data', {
        "id": function(r) { expect(r).toBeType(Number); },
        "user_id": function(r) { expect(r).toBeType(Number); },
        "username": "test_john3000",
        "user_avatar_url": {
          "px_128x128": function(r) { expect(r).toBeType(Number); },
          "px_24x24": function(r) { expect(r).toBeType(String); },
          "px_48x48": function(r) { expect(r).toBeType(String); },
          "px_512x512": function(r) { expect(r).toBeType(String); }
        },
        "title": "Test Title",
        "content": {
          "rich": function(r) { expect(r).toBeType(Boolean); },
          "yvml": '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE ex-note SYSTEM "http://example.com/pub/exml_1_0.dtd">\n<ex-note>Test Note</ex-note>',
          "text": "Test Note",
          "html": "Test Note",
          "html_android": "Test Note",
          "html_ios": "Test Note"
        },
        "language_tag": "en",
        "references": [
          {
            "usfm": "GEN.1.1",
            "human": "Genesis 1:1",
          }
        ],
        "version_id": 1,
        "created_dt": function(r) { expect(r).toBeType(String) },
        "published_dt": function(r) { expect(r).toBeTypeOrNull(String) },
        "updated_dt": function(r) { expect(r).toBeType(String) },
        "url": function(r) { expect(r).toBeType(String) },
        "short_url": function(r) { expect(r).toBeType(String) },
        "user_status": "public",
        "system_status": "new"
      })
      .toss();
  });

});

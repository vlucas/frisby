var nock = require('nock');
var frisby = require('../lib/frisby');
var mockRequest = require('mock-request');

// Built-in node.js
var fs = require('fs');
var path = require('path');

// Test global setup
var defaultGlobalSetup = frisby.globalSetup();
var mockGlobalSetup = function() {
  frisby.globalSetup({
    timeout: 3000,
    request: {
      headers: {
        'Test'   : 'One',
        'Referer': 'http://frisbyjs.com'
      }
    }
  });
}
var restoreGlobalSetup = function() {
  frisby.globalSetup(defaultGlobalSetup);
}

// JSON to use in mock tests
var fixtures = {
  arrayOfObjects: {
      test_subjects: [{
        test_str: "I am a string one!",
        test_str_same: "I am the same...",
        test_int: 42,
        test_optional: null
      }, {
        test_str: "I am a string two!",
        test_str_same: "I am the same...",
        test_int: 43,
        test_optional: null
      }, {
        test_str: "I am a string three!",
        test_str_same: "I am the same...",
        test_int: 44,
        test_optional: 'Some String'
      }],
      other_data: false,
      some_string: 'somewhere'
    }
};

// Nock to intercept HTTP upload request
var mock = nock('http://httpbin.org', { allowUnmocked: true })
  .post('/file-upload')
  .reply(200, {
    name: 'Test Upload',
    file: '/some/path/logo-frisby.png'
  });

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

    var f1 = frisby.create(this.description)
      .get('http://mock-request/not-found', {mock: mockFn})
      .expectStatus(404)
      .toss();
  });

  it('gloablSetup should set timeout to 3000', function() {
    mockGlobalSetup();
    var f1 = frisby.create(this.description)
    expect(f1.timeout()).toBe(3000);
    restoreGlobalSetup();
  });

  it('gloablSetup should set local request headers', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    mockGlobalSetup();
    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .after(function(err, res, body) {
        expect(this.current.outgoing.headers['test']).toBe('One');
        expect(this.current.outgoing.headers['referer']).toBe('http://frisbyjs.com');

        restoreGlobalSetup();
      })
      .toss();
  });

  it('addHeaders should override gloablSetup request headers', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    mockGlobalSetup();
    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .addHeaders({ 'Test': 'Two' })
      .after(function(err, res, body) {
        // Local addHeaders should override global
        expect(this.current.outgoing.headers['test']).toBe('Two');

        restoreGlobalSetup();
      })
      .toss();
  });

  it('addHeaders should override globalSetup request headers and not taint other Frisby tests', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array-ex')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();
    var mockFn2 = mockRequest.mock()
    .get('/test-object-array-ex2')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    mockGlobalSetup();

    var f1 = frisby.create(this.description + ' - mock test one')
      .get('http://mock-request/test-object-array-ex', {mock: mockFn})
      .addHeaders({ 'Test': 'Two' })
      .after(function(err, res, body) {
        // Local addHeaders should override global
        expect(this.current.outgoing.headers['test']).toBe('Two');
      })
    .toss();

    var f2 = frisby.create(this.description + ' - mock test two')
      .get('http://mock-request/test-object-array-ex2', {mock: mockFn2})
      .addHeaders({ 'Test': 'Three' })
      .after(function(err, res, body) {
        // Local addHeaders should override global
        expect(this.current.outgoing.headers['test']).toBe('Three');
      })
    .toss();

    restoreGlobalSetup();
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

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSON('test_subjects.*', { // * == EACH object in here should match
        test_str_same: "I am the same...",
        test_int: function(val) { expect(val).toMatch(/\d+/); }
      })
      .toss();
  });


  it('expectJSON should test EACH object in an array with path ending with asterisk and use toBeTypeOrNull callback properly', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSON('test_subjects.*', { // * == EACH object in here should match
        test_str_same: 'I am the same...'
      })
      .toss();
  });


  it('expectJSONTypes should test EACH object in an array with path ending with asterisk and use toBeTypeOrNull callback properly', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONTypes('test_subjects.*', { // * == EACH object in here should match
        test_str_same: String,
        test_optional: function(val) { expect(val).toBeTypeOrNull(String); }
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

    var f1 = frisby.create(this.description)
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

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .not().expectJSON('test_subjects.?', { // ? == ONE object in 'test_subjects' array
        test_str: "I am a string two nonsense!",
        test_int: 4433
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

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .not().expectJSONTypes('test_subjects.?', { // ? == ONE object in 'test_subjects' array
        test_str: Boolean,
        test_int: String
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

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONLength('test_subjects', 3)
      .expectJSONLength('test_subjects.0', 4)
      .expectJSONLength('some_string', 9)
      .toss();
  });

  it('expectJSONLength should support an asterisk in the path to test all elements of an array', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONLength('test_subjects.*', 4)
      .toss();
  });

  it('expectJSONLength should properly count arrays, strings, and objects using <=', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONLength('test_subjects', '<=3')
      .expectJSONLength('test_subjects.0', '<=4')
      .expectJSONLength('some_string', '<=9')
      .toss();
  });

  it('expectJSONLength should support an asterisk in the path to test all elements of an array using <=', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONLength('test_subjects.*', '<=4')
      .toss();
  });

  it('expectJSONLength should properly count arrays, strings, and objects using <', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONLength('test_subjects', '<4')
      .expectJSONLength('test_subjects.0', '<5')
      .expectJSONLength('some_string', '<10')
      .toss();
  });

  it('expectJSONLength should support an asterisk in the path to test all elements of an array using <', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONLength('test_subjects.*', '<5')
      .toss();
  });

  it('expectJSONLength should properly count arrays, strings, and objects using >=', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONLength('test_subjects', '>=3')
      .expectJSONLength('test_subjects.0', '>=4')
      .expectJSONLength('some_string', '>=9')
      .toss();
  });

  it('expectJSONLength should support an asterisk in the path to test all elements of an array using >=', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONLength('test_subjects.*', '>=4')
      .toss();
  });

  it('expectJSONLength should properly count arrays, strings, and objects using >', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONLength('test_subjects', '>2')
      .expectJSONLength('test_subjects.0', '>3')
      .expectJSONLength('some_string', '>8')
      .toss();
  });

  it('expectJSONLength should support an asterisk in the path to test all elements of an array using >', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONLength('test_subjects.*', '>3')
      .toss();
  });

  it('expectJSONLength should properly count arrays, strings, and objects testing string number', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONLength('test_subjects', '3')
      .expectJSONLength('test_subjects.0', '4')
      .expectJSONLength('some_string', '9')
      .toss();
  });

  it('expectJSONLength should support an asterisk in the path to test all elements of an array testing string number', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/test-object-array')
      .respond({
        statusCode: 200,
        body: fixtures.arrayOfObjects
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/test-object-array', {mock: mockFn})
      .expectJSONLength('test_subjects.*', '4')
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
                  "human": "Genesis 1:1"
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

    var f1 = frisby.create(this.description)
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
            "human": "Genesis 1:1"
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


  it('expectStatus for mock request should return 404', function() {
    // Mock API
    var mockFn = mockRequest.mock()
    .get('/not-found')
      .respond({
        statusCode: 404
      })
    .run();

    var f1 = frisby.create(this.description)
      .get('http://mock-request/not-found', {mock: mockFn})
      .expectStatus(404)
      .toss();
  });


  it('Frisby basicAuth should set the correct HTTP Authorization header', function() {

    // Mock API
    var mockFn = mockRequest.mock()
    .get('/basic-auth')
      .respond({
        statusCode: 200,
        headers: {
          Authorization: 'Basic ZnJpc2J5OnBhc3N3ZA=='
        }
      })
    .run();

    frisby.create(this.description)
      .get('http://mock-request/basic-auth', {mock: mockFn})
      .auth('frisby', 'passwd')
      .expectStatus(200)
      .expectHeader('Authorization', 'Basic ZnJpc2J5OnBhc3N3ZA==')
      .after(function(err, res, body) {

        // Check to ensure outgoing HTTP request is the correct basic auth
        expect(this.current.outgoing.headers.authorization).toBe('Basic ZnJpc2J5OnBhc3N3ZA==');

      })
    .toss();

  });


  it('Invalid URLs should fail with an error message', function() {

    frisby.create(this.description)
      .get('invalid-url')
      .expectStatus(500)
      .timeout(5)
      .exceptionHandler(function(e) {
        expect(e.message).toContain('Destination URL may be down or URL is invalid');
      })
    .toss();

  });

  it('should handle file uploads', function() {
    // Intercepted with 'nock'
    frisby.create(this.description)
      .post('http://httpbin.org/post', {
          name: 'Test Upload',
          file: fs.createReadStream(path.join(__dirname, 'logo-frisby.png'))
        }, { form: true })
      .expectStatus(200)
    .toss();
  });

  it('headers should be regex matchable', function() {
    nock('http://httpbin.org', { allowUnmocked: true })
      .post('/path')
      .reply(201, "The payload", {'Location': '/path/23'});

    frisby.create(this.description)
      .post('http://httpbin.org/path', {foo: 'bar'})
      .expectStatus(201)
      .expectHeaderToMatch('location', /^\/path\/\d+$/)
      .toss();
  });
});

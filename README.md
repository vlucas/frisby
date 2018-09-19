# Frisby

[![NPM](https://nodei.co/npm/frisby.png)](https://nodei.co/npm/frisby/)
[![Build
Status](https://travis-ci.org/vlucas/frisby.png?branch=master)](https://travis-ci.org/vlucas/frisby)

![Frisby.js](https://www.frisbyjs.com/assets/frisbyjs.png)

## Introduction

Frisby.js an API testing tool built on top of
[Jest](https://facebook.github.io/jest/) that makes testing API endpoints easy,
fast and fun.

## Installation

Install Frisby v2.x from NPM into your project:

    npm install frisby --save-dev

## Creating Tests

### Simple Example

The minimum setup to run a single test expectation.

```javascript
const frisby = require('frisby');

it('should be a teapot', function () {
  // Return the Frisby.js Spec in the 'it()' (just like a promise)
  return frisby.get('http://httpbin.org/status/418')
    .expect('status', 418);
});
```

### Nested Dependent HTTP Calls

A more complex example with nested dependent Frisby tests with Frisby's Promise-style `then` method.

```javascript
const frisby = require('frisby');
const Joi = frisby.Joi; // Frisby exposes Joi for convenience

describe('Posts', function () {
  it('should return all posts and first post should have comments', function () {
    return frisby.get('http://jsonplaceholder.typicode.com/posts')
      .expect('status', 200)
      .expect('jsonTypes', '*', {
        userId: Joi.number(),
        id: Joi.number(),
        title: Joi.string(),
        body: Joi.string()
      })
      .then(function (res) { // res = FrisbyResponse object
        let postId = res.json[0].id;

        // Get first post's comments
        // RETURN the FrisbySpec object so function waits on it to finish - just like a Promise chain
        return frisby.get('http://jsonplaceholder.typicode.com/posts/' + postId + '/comments')
          .expect('status', 200)
          .expect('json', '*', {
            postId: postId
          })
          .expect('jsonTypes', '*', {
            postId: Joi.number(),
            id: Joi.number(),
            name: Joi.string(),
            email: Joi.string().email(),
            body: Joi.string()
          });
      });
  });
});
```

## Built-In Expect Handlers

Frisby comes with many handy built-in expect handlers to help you test the HTTP
response of your API.

 * `status` - Check HTTP status
 * `header` - Check HTTP header key + value
 * `json` - Match json structure + values (RegExp can be used)
 * `jsonStrict` - Match EXACT json structure + values (extra keys not tested for cause test failures)
 * `jsonTypes` - Match json structure + value types
 * `jsonTypesStrict` - Match EXACT json structure + value types (extra keys not tested for cause test failures)
 * `bodyContains` - Match partial body content (string or regex)

## Define Custom Expect Handlers

When Frisby's built-in expect handlers are not enough, or if you find yourself
running the same expectations in multiple places in your tests, you can define
your own custom expect handler once, and then run it from anywhere in your
tests.

```javascript
beforeAll(function () {
  // Add our custom expect handler
  frisby.addExpectHandler('isUser1', function (response) {
    let json = response.body;

    // Run custom Jasmine matchers here
    expect(json.id).toBe(1);
    expect(json.email).toBe('testy.mctesterpants@example.com');
  });
});

// Use our new custom expect handler
it('should allow custom expect handlers to be registered and used', function () {
  return frisby.get('https://api.example.com/users/1')
    .expect('isUser1')
});

afterAll(function () {
  // Remove said custom handler (if needed)
  frisby.removeExpectHandler('isUser1');
});
```

## Using Jasmine Matchers Directly

Any of the [Jasmine matchers](http://jasmine.github.io/2.4/introduction.html)
can be used inside the `then` method to perform additional or custom tests on
the response data.

```javascript
const frisby = require('frisby');

it('should be user 1', function () {
  return frisby.get('https://api.example.com/users/1')
    .then(function (res) {
      expect(res.json.id).toBe(1);
      expect(res.json.email).toBe('testy.mctesterpants@example.com');
    });
});
```

## Running Tests

Frisby uses Jasmine style assertion syntax, and uses
[Jest](https://facebook.github.io/jest/) to run tests.

Jest can run sandboxed tests in parallel, which fits the concept of HTTP
testing very nicely so your tests run much faster.

### Install Jest

    npm install --save-dev jest

### Create your tests

    mkdir __tests__
    touch __tests__/api.spec.js

### Run your tests from the CLI

    cd your/project
    jest

### Documentation

Documentation is hosted at [frisbyjs.com](http://frisbyjs.com/), the
documentation pages has separate
[repository](https://github.com/vlucas/frisby-site).

## License

Licensed under the [BSD 3-Clause](http://opensource.org/licenses/BSD-3-Clause)
license.

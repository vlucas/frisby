# Frisby

[![NPM](https://nodei.co/npm/frisby.png)](https://nodei.co/npm/frisby/)
[![Build
Status](https://travis-ci.org/vlucas/frisby.png?branch=v2)](https://travis-ci.org/vlucas/frisby)

## Introduction

Frisby.js an API testing tool built on top of Jasmine that makes testing API
endpoints easy, fast and fun.

## Installation

Install Frisby from NPM into your project:

    npm install frisby --save-dev

## Creating Tests

Frisby tests start with `frisby` followed by one of `get`, `post`, `put`,
`del`, `head`, `fetch`.

All of the HTTP method conveience methods use `fetch` internally, as Frisby.js is based
on the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) web standard.

## Examples

Sometimes the best way yo learn is by example, with real code.

### Simple Example

The minimum setup to run a single test expectation.

```javascript
const frisby = require('frisby');
const Joi = frisby.Joi; // Frisby exposes Joi for convenince

it('should be a teapot', function (done) {
  frisby.get('http://httpbin.org/status/418')
    .expect('status', 418)
    .done(done);
});
```

### Nested Dependent HTTP Calls

A more complex example with nested dependent frisby tests with Frisby's Promise-style `then` method.

```javascript
const frisby = require('frisby');
const Joi = frisby.Joi; // Frisby exposes Joi for convenince

describe('Posts', function () {
  it('should return all posts and first post should have comments', function (done) {
    frisby.get('http://jsonplaceholder.typicode.com/posts')
      .expect('status', 200)
      .expect('jsonTypes', '*', {
        userId: Joi.number(),
        id: Joi.number(),
        title: Joi.string(),
        body: Joi.string()
      })
      .then(function (json) {
        let postId = json[0].id;

        // Get first post's comments
        // RETURN the FrisbySpec object so the 'done' function waits on it to finish - just like a Promise chain
        reutrn frisby.get('http://jsonplaceholder.typicode.com/posts/' + postId + '/comments')
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
      })
      .done(done);
  });
});
```

## Built-In Expect Handlers

Frisby comes with many handy built-in expect handlers to help you test the HTTP
response of your API.

 * `status` - Check HTTP status
 * `header` - Check HTTP header key + value
 * `json` - Match json structure + values
 * `jsonTypes` - Match json structure + values

## Define Custom Expect Handlers

When Frisby's built-in expect handlers are not enough, or if you find yourself
running the same expectations in multiple places in your tests, you can define
your own custom expect handler once, and then run it from anywhere in your
tests.

```javascript
// Add our custom expect handler
frisby.addExpectHandler('isUser1', function (response) {
  let json = response._body;

  // Run custom Jasmine matchers here
  expect(json.id).toBe(1);
  expect(json.email).toBe('testy.mctesterpants@example.com');
});

// Use our new custom expect handler
it('should allow custom expect handlers to be registered and used', function (doneFn) {
  frisby.get('https://api.example.com/users/1')
    .expect('isUser1')
    .done(doneFn);
});

// Remove said custom handler (if needed)
frisby.removeExpectHandler('isUser1');
```

## Using Jasmine Matchers Directly

Any of the [Jasmine matchers](http://jasmine.github.io/2.4/introduction.html)
can be used inside the `then` method to perform additional or custom tests on
the response data.

```javascript
const frisby = require('frisby');
const Joi = frisby.Joi; // Frisby exposes Joi for convenince

it('should be user 1', function (done) {
  frisby.get('https://api.example.com/users/1')
    .then(function (json) {
      expect(json.id).toBe(1);
      expect(json.email).toBe('testy.mctesterpants@example.com');
    })
    .done(done);
});
```

## Running Tests

Frisby is built on top of the jasmine BDD spec framework, and uses
[jasmine-node test runner](https://github.com/mhevery/jasmine-node) to run spec
tests in a specified target directory.

### File naming conventions

Files must end with `spec.js` to run with jasmine-node.

Suggested file naming is to append the filename with `_spec`, like
`mytests_spec.js` and `moretests_spec.js`

### Install jasmine-node

    npm install -g jasmine-node

### Run it from the CLI

    cd your/project
    jasmine-node .

### Documentation
Documentation is hosted at [frisbyjs.com](http://frisbyjs.com/), the
documentation pages has separate
[repositiory](https://github.com/vlucas/frisby-site).

## License
Licensed under the [BSD 3-Clause](http://opensource.org/licenses/BSD-3-Clause)
license.

# Frisby

A node.js NPM module that makes testing API endpoints easy.


## Installation

Install Frisby from NPM:

    npm install frisby


## Creating Tests

Frisby tests start with `frisby.toss` with a description of the test followed by one of `get`, `post`, `put`, `delete`, or `head`, and ending with `run` to generate the resulting jasmine spec test. There is a `expectStatus` method built in to more easily test HTTP status codes. Any other jasmine `expect` tests should be done inside the `after` callback.

Each set of unique sequences or API endpoint tests should be started with new `frisby.toss` method calls instead of trying to chain multiple HTTP requests together.

```javascript

var frisby = require('../lib/frisby');

var URL = 'http://localhost:3000/';
var URL_AUTH = 'http://username:password@localhost:3000/';

frisby.toss('GET user johndoe')
  .globalSetup({
    request: {
      headers: { 'Referer': 'http://google.com' }
    }
  })
  .get(URL + '/users/3.json')
  .expectStatus(200)
  .after(function(err, res, body) {
  	var user = JSON.parse(body);

  	// Normal jasmine style assertions
  	expect(1+1).toEqual(2);

  	// Use data from previous result in next test
    frisby.toss('Update user')
      .put(URL_AUTH + '/users/' + user.id + '.json', {tags: ['jasmine', 'bdd']})
      .expectStatus(200)
    .run();
  })
.run();

```

## Running Tests

Frisby is built on top of the jasmine BDD spec framework, and uses the excellent [jasmine-node test runner](https://github.com/mhevery/jasmine-node) to run spec tests in a specified target directory.  

### File naming conventions

Files must end with `spec.js` to run with jasmine-node.

Suggested file naming is to append the filename with `_spec`, like `mytests_spec.js` and `moretests_spec.js`

### Install jasmine-node

    npm install -g jasmine-node

### Run it from the CLI

    cd your/project
    jasmine-node .
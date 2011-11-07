# Frisby

A node.js NPM module that makes testing API endpoints easy.


## Installation

Install Frisby from NPM:

    npm install frisby


## Creating Tests

```javascript

var frisby = require('../lib/frisby');


// TESTS
// ====================================================
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
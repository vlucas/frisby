# Frisby

A node.js NPM module that makes testing API endpoints easy, fast and fun.


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

frisby.globalSetup({ // globalSetup is for ALL requests
  request: {
    headers: { 'X-Auth-Token': 'fa8426a0-8eaf-4d22-8e13-7c1b16a9370c' }
  }
});

frisby.create('GET user johndoe')
  .get(URL + '/users/3.json')
  .expectStatus(200)
  .expectJSONTypes({
    id: Number,
    username: String,
    is_admin: Boolean
  })
  .expectJSON({
    id: 3,
    username: 'johndoe',
    is_admin: false
  })
  // 'afterJSON' automatically parses response body as JSON and passes it as an argument
  .afterJSON(function(user) {
  	// You can use any normal jasmine-style assertions here
  	expect(1+1).toEqual(2);

  	// Use data from previous result in next test
    frisby.create('Update user')
      .put(URL_AUTH + '/users/' + user.id + '.json', {tags: ['jasmine', 'bdd']})
      .expectStatus(200)
    .toss();
  })
.toss();

```

Any of the [Jasmine matchers](https://github.com/pivotal/jasmine/wiki/Matchers) can be used inside the `after` and `afterJSON` callbacks to perform additional or custom tests on the response data.

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

## License
Licensed under the [MIT](http://opensource.org/licenses/MIT)/[BSD](http://opensource.org/licenses/BSD-3-Clause) license.

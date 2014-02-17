var nock = require('nock');
var frisby = require('../lib/frisby');
var path = require('path');

// Nock to intercept HTTP requests for testing
nock('http://example.com', { allowUnmocked: false })
  .persist()
  // @link http://json-schema.org/example1.html
  .get('/response1')
  .reply(200, {
    "id": 1,
    "name": "A green door",
    "price": 12.50,
    "tags": ["home", "green"]
  })
  .get('/response2')
  .reply(200, {
    response: {
      "id": 1,
      "name": "A green door",
      "price": 12.50,
      "tags": ["home", "green"]
    }
  })
  .get('/response_x')
  .reply(200, {
    response: {
      data: {
        "id_x": 1,
        "name_x": "A green door",
        "price_x": 12.50,
        "tags_x": ["home", "green"]
      }
    }
  })
  .get('/response-array')
  .reply(200, {
    items: [
      {
        "id": 1,
        "name": "A green door",
        "price": 12.50,
        "tags": ["home", "green"]
      },
      {
        "id": 2,
        "name": "A blue door",
        "price": 13.50,
        "tags": ["home", "blue"]
      },
      {
        "id": 3,
        "name": "A screen door",
        "price": 21.25,
        "tags": ["home", "screen", "door"]
      }
    ]
  })
;

//
// Tests
//
describe('Frisby JSONSchema', function() {

  it('should accept and validate JSONSchema object', function() {
    frisby.create(this.description)
      .get('http://example.com/response1')
      .expectStatus(200)
      .expectJSONSchema({
        "$schema": "http://json-schema.org/draft-04/schema#",
        "title": "Product",
        "description": "A product from Acme's catalog",
        "type": "object",
        "properties": {
          "id": {
            "description": "The unique identifier for a product",
            "type": "integer"
          },
          "name": {
            "description": "Name of the product",
            "type": "string"
          },
          "price": {
            "type": "number",
            "minimum": 0,
            "exclusiveMinimum": true
          },
          "tags": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "minItems": 1,
            "uniqueItems": true
          }
        },
        "required": ["id", "name", "price"]
      })
    .toss();
  });

  it('should accept and validate JSONSchema file with relative path', function() {
    frisby.create(this.description)
      .get('http://example.com/response1')
      .expectStatus(200)
      .expectJSONSchema('fixtures/json_schema/response1.json')
    .toss();
  });

  it('should accept and validate JSONSchema file with full root path', function() {
    frisby.create(this.description)
      .get('http://example.com/response1')
      .expectStatus(200)
      .expectJSONSchema(path.join(__dirname, 'fixtures/json_schema/response1.json'))
    .toss();
  });

  it('should accept and validate JSONSchema object with path syntax', function() {
    frisby.create(this.description)
      .get('http://example.com/response2')
      .expectStatus(200)
      .expectJSONSchema('response', {
        "$schema": "http://json-schema.org/draft-04/schema#",
        "title": "Product",
        "description": "A product from Acme's catalog",
        "type": "object",
        "properties": {
          "id": {
            "description": "The unique identifier for a product",
            "type": "integer"
          },
          "name": {
            "description": "Name of the product",
            "type": "string"
          },
        },
      })
    .toss();
  });

  it('should accept and validate JSONSchema file with jsonPath syntax', function() {
    frisby.create(this.description)
      .get('http://example.com/response2')
      .expectStatus(200)
      .expectJSONSchema('response', 'fixtures/json_schema/response1.json')
    .toss();
  });

  it('should accept and validate JSONSchema file with jsonPath array syntax', function() {
    frisby.create(this.description)
      .get('http://example.com/response-array')
      .expectStatus(200)
      .expectJSONSchema('items.*', 'fixtures/json_schema/response1.json')
    .toss();
  });

  it('should accept and validate JSONSchema file with jsonPath syntax', function() {
    frisby.create(this.description)
      .get('http://example.com/response_x')
      .expectStatus(200)
      .not().expectJSONSchema('response.data', 'fixtures/json_schema/response1.json')
    .toss();
  });
});

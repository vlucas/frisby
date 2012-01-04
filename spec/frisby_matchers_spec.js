var frisby = require('../lib/frisby');
var mockRequest = require('mock-request')


describe('Frisby matchers', function() {

  it('toContainJSON should match exactly', function() {
    // Set fake JSON body
    var testJson = {
      test_str: "I am a string!",
      test_int: 42,
      test_float: 42.42
    };

    // Expectation
    expect(testJson).toContainJson({
      test_str: "I am a string!",
      test_int: 42,
      test_float: 42.42
    });
  });


  it('toContainJSON should match callbacks', function() {
    // Set fake JSON body
    var testJson = {
      test_str: "I am a string!",
      test_int: 42,
      test_float: 42.42
    };

    // Expectation
    expect(testJson).toContainJson({
      test_str: "I am a string!",
      test_int: function(val) { expect(val).toMatch(/\d+/); }
    });
  });


  it('toContainJSON should not match with undefined variable', function() {
    // Set fake JSON body
    var testJson = {
      test_str: "I am a string!",
      test_int: 42,
      test_float: 42.42
    };

    // Expectation
    expect(testJson).not.toContainJson(undefined);
  });


  it('JSONTypes should match String', function() {
    // Set fake JSON body
    var testJson = {
      test_str: "I am a string!",
      test_int: 42,
      test_float: 42.42
    };

    // Expectation
    expect(testJson).toContainJsonTypes({
      test_str: String,
      test_int: Number
    });
  });


  it('JSONTypes should match String', function() {
    // Set fake JSON body
    var testJson = {
      test_str: "I am a string!",
      test_int: 42,
      test_float: 42.42
    };

    // Expectation
    expect(testJson).toContainJsonTypes({
      test_str: String,
      test_int: Number
    });
  });


  it('JSONTypes should not match String for integer type', function() {
    // Expectation
    expect({
      test_int: 42,
    }).not.toContainJsonTypes({
      test_int: String,
    });
  });


  it('JSONTypes should not match Number for string type', function() {
    // Expectation
    expect({
      test_str: "I am a string!",
    }).not.toContainJsonTypes({
      test_str: Number,
    });
  });


  it('JSONTypes should not match with non-existent JSON key', function() {
    // Set fake JSON body
    var testJson = {
      test_str: "I am a string!",
      test_int: 42,
      test_float: 42.42
    };

    // Expectation
    expect(testJson).not.toContainJsonTypes({
      test_str: String,
      test: String // Key that does not exist
    });
  });

});

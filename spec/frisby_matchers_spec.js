frisby = require('../lib/frisby');


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

});

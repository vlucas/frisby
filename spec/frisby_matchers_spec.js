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
    expect(testJson).not.toContainJson({
      test_str: "I am NOT a string!",
      test_int: "43",
      test_float: 43.43
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


  it('toContainJSON should NOT match with invalid callbacks', function() {
    // Set fake JSON body
    var testJson = {
      test_str: "I am a string!",
      test_int: 42,
      test_float: 42.42
    };

    // Expectation
    expect(testJson).toContainJson({
      test_str: "I am a string!",
      test_int: function(val) { expect(val).not.toMatch('blah'); }
    });
  });


  it('Callbacks should be able to use matcher toBeTypeOrNull', function() {
    // Set fake JSON body
    var testJson = {
      test_str: "I am a string!",
      test_optional: null,
      test_nest: {
        nested_optional: null
      }
    };

    // Expectation
    expect(testJson).toContainJson({
      test_str: "I am a string!",
      test_optional: function(val) { expect(val).toBeTypeOrNull(String); },
      test_nest: {
        nested_optional: function(val) { expect(val).toBeTypeOrNull(String); }
      }
    });
  });

  it('Callbacks should be able to use matcher toBeTypeOrUndefined', function() {
    // Set fake JSON body
    var testJson = {
      test_str: "I am a string!",
      test_optional: "I am optional key",
      test_nest: {
        nested_optional: "I am optional key too"
      }
    };

    // Expectation
    expect(testJson).toContainJson({
      test_str: "I am a string!",
      test_optional: function(val) { expect(val).toBeTypeOrUndefined(String); },
      test_optional_nonexist: function(val) { expect(val).toBeTypeOrUndefined(String); },
      test_nest: {
        nested_optional: function(val) { expect(val).toBeTypeOrUndefined(String); },
        nested_optional_nonexist: function(val) { expect(val).toBeTypeOrUndefined(String); }
      }
    });
  });

  it('toContainJSON should match callbacks that return boolean true', function() {
    // Set fake JSON body
    var testJson = {
      test_str: "I am a string!",
      test_int: 42,
      test_float: 42.42
    };

    // Expectation
    expect(testJson).toContainJson({
      test_str: "I am a string!",
      test_int: function(val) { return true; }
    });
  });


  it('toContainJSON should NOT match callbacks that return boolean false', function() {
    // Set fake JSON body
    var testJson = {
      test_str: "I am a string!",
      test_int: 42,
      test_float: 42.42
    };

    // Expectation
    expect(testJson).not.toContainJson({
      test_str: "I am a string!",
      test_int: function(val) { return false; }
    });
  });


  it('toContainJSON should pass when callbacks return anything other than boolean false', function() {
    // Set fake JSON body
    var testJson = {
      test_str: "I am a string!",
      test_int: 42,
      test_float: 42.42
    };

    // Expectation
    expect(testJson).toContainJson({
      test_str: function(val) { return 'anything other than boolean false'; },
      test_int: function(val) { return 42; },
      test_float: function(val) { return; }
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


  it('toContainJSON should not match with non-existent JSON key', function() {
    // Set fake JSON body
    var testJson = {
      test_str: "I am a string!",
      test_int: 42,
      test_float: 42.42
    };

    // Expectation
    expect(testJson).not.toContainJson({
      test_str: "I am a string!",
      test: "Some random value that won't match anyways" // Key that does not exist
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


  it('toContainJson should continue checking matches after nested object', function() {
    // Expectation
    expect({
      test_str: "I am a string!",
      test_obj: {
        foo: 'bar',
        bar: 'baz'
      },
      test_int: 42
    }).not.toContainJson({
      test_str: "I am a string!",
      test_obj: {
        foo: 'bar',
        bar: 'baz'
      },
      test_int: 4242
    });
  });


  it('toContainJson should fail on non-matching objects inside an array', function() {
    // Expectation
    expect({
      test_str: "I am a string!",
      test_objs: [
        { foo: 'bar' },
        { bar: 'baz' }
      ],
      test_int: 42
    }).not.toContainJson({
      test_str: "I am a string!",
      test_objs: [
        { foo: 'bar' },
        { bar: 'barX' }
      ],
      test_int: 42
    });
  });

});

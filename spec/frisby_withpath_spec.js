var frisby = require('../lib/frisby');

describe('Frisby withPath syntax', function() {

  it('should work with single string path', function() {
    frisby.withPath('response', {
        response: {
          foo: 'bar',
          bar: 'baz',
          one: 1
        }
      }, function(jsonBody) {
      expect(jsonBody).toEqual({
        foo: 'bar',
        bar: 'baz',
        one: 1
      });
    });
  });

  it('should work with nested dot-separated string path', function() {
    frisby.withPath('response.data', {
        response: {
          data: {
            foo: 'bar',
            bar: 'baz',
            one: 1
          }
        }
      }, function(jsonBody) {
      expect(jsonBody).toEqual({
        foo: 'bar',
        bar: 'baz',
        one: 1
      });
    });
  });

  it('should work with asterisk to iterate over array of objects', function() {
    var count = 0;
    frisby.withPath('response.items.*', {
        response: {
          items: [{
              foo: 'bar',
              bar: 'baz',
              one: 1
            },{
              foo: 'bar',
              bar: 'baz',
              one: 1
            },{
              foo: 'bar',
              bar: 'baz',
              one: 1
            }
          ]
        }
      }, function(jsonBody) {
        ++count;
        expect(jsonBody).toEqual({
          foo: 'bar',
          bar: 'baz',
          one: 1
        });
    });
    expect(count).toEqual(3);
  });

  it('should work with question mark to match at least one of the items in an array', function() {
    var count = 0;
    frisby.withPath('response.items.?', {
        response: {
          items: [{
              foo: 'bar',
              bar: 'baz',
              one: 1
            },{
              foo: 'bar2',
              bar: 'baz2',
              one: 2
            },{
              foo: 'bar3',
              bar: 'baz3',
              one: 3
            }
          ]
        }
      }, function(jsonBody) {
        ++count;
        // Exception should not be shown because at least ONE iteration will not throw an exception
        if(jsonBody.foo !== 'bar') {
          throw new Error('Property foo did not match bar');
        }
    });
    expect(count).toEqual(3);
  });

  it('should work with ampersand to iterate over keys of objects', function() {
    var count = 0;
    frisby.withPath('response.&', {
        response: {
          foo: 'bar',
          bar: 'baz',
          one: 'one'
        }
      }, function(jsonBody) {
        ++count;
        expect(jsonBody).toBeType(String);
    });
    expect(count).toEqual(3);
  });
});

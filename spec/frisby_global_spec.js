frisby = require('../lib/frisby');


describe('Frisby object setup', function() {

  it('global setup should be empty', function() {
    expect({
      request: {
        headers: {}
      }
    }).toEqual(frisby.globalSetup());
  });

  it('should have empty request properties on creation', function() {
    var f1 = frisby.create('test 1');

    expect({
      headers: {}
    }).toEqual(f1.current.request);
  });

  it('should be independent of other Frisby objects', function() {
    var f1 = frisby.create('test 1');
    var f2 = frisby.create('test 2');

    // Equal setup
    expect(f1.current.request).toEqual(f2.current.request);

    // Different describe statements
    expect(f1.current.describe).not.toEqual(f2.current.describe);

    // Add header only to f1
    f1.addHeaders({
      'Accept': 'application/json'
    });
    f2.addHeaders({
      'Accept': 'application/x-www-form-urlencoded'
    });

    // Different setup
    expect(f1.current.request).not.toEqual(f2.current.request);
  });

});

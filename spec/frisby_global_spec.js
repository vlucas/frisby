frisby = require('../lib/frisby');


describe('Frisby object setup', function() {
  
  it('global setup should be empty', function() {
    expect({
      request: {
        headers: {}
      }
    }).toEqual(frisby.globalSetup());
  })

  it('should be empty on creation', function() {
    var f1 = frisby.create('test 1');

    expect({
      request: {
        headers: {}
      }
    }).toEqual(f1._setup);
  });

  it('should be independent of other Frisby objects', function() {
    var f1 = frisby.create('test 1');
    var f2 = frisby.create('test 2');

    // Equal setup
    expect(f1._setup).toEqual(f2._setup);

    // Different describe statements
    expect(f1.current.describe).not.toEqual(f2.current.describe);

    // Add header only to f1
    f1.setup({
      request: {
        headers: {
          'Accept': 'application/json'
        }
      }
    });
    f2.setup({
      request: {
        headers: {
          'Accept': 'application/x-www-form-urlencoded'
        }
      }
    });

    // Different setup
    expect(f1.setup()).not.toEqual(f2.setup());
  });

});

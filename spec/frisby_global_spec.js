frisby = require('../lib/frisby');


describe('Frisby object setup', function() {

  it('global setup should be empty', function() {
    expect({
      request: {
        headers: {},
        json: false
      }
    }).toEqual(frisby.globalSetup());
  });

  it('should have empty request properties on creation', function() {
    var f1 = frisby.create('test 1');

    expect({
      headers: {},
      json: false
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

    it('should default to json = false', function() {
        expect({
            request: {
                headers: {},
                json: false
            }
        }).toEqual(frisby.globalSetup());

        expect(frisby.create('mytest').get('/path').current.outgoing.json).toEqual(false);
    });


    it('should switch to json default = true when global config is configured json', function() {
        frisby.globalSetup().request.json = true;
        expect({
            request: {
                headers: {},
                json: true
            }
        }).toEqual(frisby.globalSetup());

        expect(frisby.create('mytest').get('/path').current.outgoing.json).toEqual(true);
    });

    it('should be overridable by the params parameter json=false', function() {
        frisby.globalSetup().request.json = true;
        expect({
            request: {
                headers: {},
                json: true
            }
        }).toEqual(frisby.globalSetup());

        expect(frisby.create('mytest').get('/path', {json:false}).current.outgoing.json).toEqual(false);
    });


});

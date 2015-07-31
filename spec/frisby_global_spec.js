var frisby = require('../lib/frisby');

describe('Frisby object setup', function() {

  it('global setup should be empty', function() {
    expect({
      request: {
        headers: {},
        inspectOnFailure: false,
        json: false,
        baseUri: ''
      }
    }).toEqual(frisby.globalSetup());
  });

  it('should have empty request properties on creation', function() {
    var f1 = frisby.create('test 1');

    expect({
      headers: {},
      inspectOnFailure: false,
      json: false,
      baseUri: ''
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
        inspectOnFailure: false,
        json: false,
        baseUri: ''
      }
    }).toEqual(frisby.globalSetup());

    expect(frisby.create('mytest').get('/path').current.outgoing.json).toEqual(false);
  });

  it('should switch to json default = true when global config is configured json', function() {
    frisby.globalSetup({
      request: {
        headers: {},
        inspectOnFailure: false,
        json: true
      }
    });

    expect({
      request: {
        headers: {},
        inspectOnFailure: false,
        json: true
      }
    }).toEqual(frisby.globalSetup());

    expect(frisby.create('mytest').get('/path').current.outgoing.json).toEqual(true);
  });

  it('should be overridable by the params parameter json=false', function() {
    frisby.globalSetup({
      request: {
        headers: {},
        inspectOnFailure: false,
        json: true
      }
    });

    expect({
      request: {
        headers: {},
        inspectOnFailure: false,
        json: true
      }
    }).toEqual(frisby.globalSetup());

    expect(frisby.create('mytest').get('/path', {
      json: false
    }).current.outgoing.json).toEqual(false);
  });

  it('should switch to inspectOnFailure default = true when global config is configured inspectOnFailure', function() {
    frisby.globalSetup({
      request: {
        headers: {},
        inspectOnFailure: true,
        json: false
      }
    });

    expect({
      request: {
        headers: {},
        inspectOnFailure: true,
        json: false
      }
    }).toEqual(frisby.globalSetup());

    expect(frisby.create('mytest').get('/path').current.outgoing.inspectOnFailure).toEqual(true);
  });

  it('should be overridable by the params parameter inspectOnFailure=false', function() {
    frisby.globalSetup({
      request: {
        headers: {},
        inspectOnFailure: true,
        json: false
      }
    });

    expect({
      request: {
        headers: {},
        inspectOnFailure: true,
        json: false
      }
    }).toEqual(frisby.globalSetup());

    expect(frisby.create('mytest').get('/path', {
      inspectOnFailure: false
    }).current.outgoing.inspectOnFailure).toEqual(false);
  });

});

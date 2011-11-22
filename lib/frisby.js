/**
 * frisby.js: Main Frisby test package
 * (C) 2011, Vance Lucas
 */
var qs = require('querystring'),
  request = require('request'),
  _ = require('underscore');


// FRISBY
// ====================================================
var _frisbyGlobalSetup = {
  request: {
    headers: {}
  }
};

var globalSetup = function(opts) {
  if(typeof opts !== "undefined") {
    _frisbyGlobalSetup = opts;
    if(typeof _frisbyGlobalSetup.request === "undefined") {
      _frisbyGlobalSetup.request = {};
      _frisbyGlobalSetup.request.headers = {};
    }
  }
  return _frisbyGlobalSetup;
};

function toss(msg) {
  var current = {
    describe: null,
    itInfo: null,
    it: null,
    expects: [],
    after: []
  };
  var _setup = globalSetup();
  var _currentRequestFinished = false;

  // Public return 
  var p = {
    current: current,
    _setup: _setup,

    globalSetup: function(opts) {
      globalSetup(opts);
      return this;
    },

    setup: function(opts) {
      this._setup = _.extend(this._setup, opts);
      if(typeof this._setup.request === "undefined") {
        this._setup.request = {};
        this._setup.request.headers = {};
      }
      return this;
    },

    reset: function() {
      this._setup = globalSetup();
      if(typeof this._setup.request === "undefined") {
        this._setup.request = {};
        this._setup.request.headers = {};
      }
      return this;
    },

    // HTTP header setting methods
    addHeader: function(header, content) {
      this._setup.request.headers[header+"".toLowerCase()] = content+"".toLowerCase();
      return this;
    },
    removeHeader: function (key, value) {
      delete this._setup.request.headers[key+"".toLowerCase()];
      return this;
    },
    setHeaders: function (headers) {
      _.each(headers, function(val, key) {
        this.addHeader(key, val);
      });
      return this;
    },
    

    // Timeout default
    _timeout: 5000,

    // Hold current responseType
    _responseType: 'json',
    responseType: function(type) {
      this._responseType = type;
      return this;
    },

    // New test
    toss: toss,

    // HTTP Request
    get: function (/* [uri, params] */) {
      var args = Array.prototype.slice.call(arguments);
      args.splice(1, -1, null);
      return this._request.apply(this, ['get'].concat(args));
    },
    post: function (/* [uri, data, params] */) {
      var args = Array.prototype.slice.call(arguments);
      return this._request.apply(this, ['post'].concat(args));
    },
    put: function (/* [uri, data, params] */) {
      var args = Array.prototype.slice.call(arguments);
      return this._request.apply(this, ['put'].concat(args));
    },
    del: function (/* [uri, data, params] */) {
      var args = Array.prototype.slice.call(arguments);
      return this._request.apply(this, ['delete'].concat(args));
    },
    head: function (/* [uri, params] */) {
      var args = Array.prototype.slice.call(arguments);
      args.splice(1, -1, null);
      return this._request.apply(this, ['head'].concat(args));
    },

    _request: function (/* method [uri, data, params] */) {
      var self    = this,
          args    = Array.prototype.slice.call(arguments),
          method  = args.shift(),
          uri     = typeof args[0] === 'string' && args.shift(),
          data    = typeof args[0] === 'object' && args.shift(),
          params  = typeof args[0] === 'object' && args.shift(),
          port    = this.port && this.port !== 80 ? ':' + this.port : '',
          fullUri,
          outgoing = {
            uri: null,
            body: null,
            method: 'GET',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          };
      
      // Merge 'setup' request options for current request
      _.extend(outgoing, this._setup.request);

      // Ensure we have at least one 'content-type' header
      if(typeof outgoing.headers['Content-Type'] === "undefined") {
        outgoing.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      // Set outgoing URI
      outgoing.uri = uri;
      
      //
      // If the user has provided data, assume that it is query string 
      // and set it to the `body` property of the options. 
      //
      if (data) {
        // if JSON data
        if(outgoing.json) {
          outgoing.body = JSON.stringify(data);
        } else {
          // Default to 'application/x-www-form-urlencoded'
          outgoing.body = qs.stringify(data);
        }
      }
      
      //
      // Set the `uri` and `method` properties of the request options `outgoing`
      // using the information provided to this instance and `_request()`.
      //
      outgoing.method = method;
      
      //
      // Create the description for this test.
      //
      this.current.itInfo = method.toUpperCase() + ' ' + outgoing.uri;
      
      //
      // Add the topic for the specified request to the context of the current
      // batch used by this suite. 
      //
      this.current.it = function () {
        _currentRequestFinished = false;
        var self = this;
        request(outgoing, function(err, res, body) {
          _currentRequestFinished = {err: err, res: res, body: body, req: outgoing};
        });
      };

      this._setup = globalSetup();

      return this;
    },

    // HTTP status expect helper
    expectStatus: function(statusCode) {
      this.current.expects.push(function() {
        expect(_currentRequestFinished.res.statusCode).toEqual(statusCode);
      })
      return this;
    },

    // HTTP header expect helper
    expectHeader: function(header, content) {
      var header = header+"".toLowerCase();
      this.current.expects.push(function() {
        if(typeof _currentRequestFinished.res.headers[header] !== "undefined") {
          expect(_currentRequestFinished.res.headers[header].toLowerCase()).toEqual(content.toLowerCase());
        } else {
          fail("Header '" + header.toLowerCase() + "' not present in HTTP response");
        }
      });
      return this;
    },

    // HTTP header expect helper (less strict version using 'contains' instead of strict 'equals')
    expectHeaderContains: function(header, content) {
      var header = header+"".toLowerCase();
      this.current.expects.push(function() {
        if(typeof _currentRequestFinished.res.headers[header] !== "undefined") {
          expect(_currentRequestFinished.res.headers[header].toLowerCase()).toContain(content.toLowerCase());
        } else {
          fail("Header '" + header.toLowerCase() + "' not present in HTTP response");
        }
      });
      return this;
    },

    // HTTP body expect helper
    expectBodyContains: function(content) {
      this.current.expects.push(function() {
        if(typeof _currentRequestFinished.body !== "undefined") {
          expect(_currentRequestFinished.body).toContain(content);
        } else {
          fail("No HTTP response body was present or HTTP response was empty");
        }
      });
      return this;
    },

    // Helper to check parse HTTP response body as JSON and check key types
    expectJSONTypes: function(/* [tree], jsonTest */) {
      var self     = this,
          args     = Array.prototype.slice.call(arguments),
          path     = typeof args[0] === 'string' && args.shift(),
          jsonTest = typeof args[0] === 'object' && args.shift();

      this.current.expects.push(function() {
        var jsonBody = JSON.parse(_currentRequestFinished.body);
        // Use given path to check deep objects
        if(path) {
          _.each(path.split('.'), function(val) {
            jsonBody = jsonBody[val];
            expect(typeof jsonBody).toEqual("object");
          });
        }
        // Check each matching key/val
        var errorKeys = [];
        _.each(jsonTest, function(val, key) {
           if(typeof jsonBody[key] !== "undefined") {
            // Convert type literal to prototype for correct result
            var kt = self.toType(jsonTest[key]);
            if(kt === "function") {
              jsonTest[key] = jsonTest[key].prototype;
            } else if(kt === "object") {
              // NESTED expectJSON
              if(path) {
                self.expectJSONTypes(path+'.'+key, jsonTest[key]);
              } else {
                self.expectJSONTypes(key, jsonTest[key]);
              }
            }

            // Type check on key
            expect(self.toType(jsonBody[key])).toEqual(self.toType(jsonTest[key]));
          } else {
            errorKeys.push(key);
          }
        });
        
        if(errorKeys.length > 0) {
          throw new Error("Keys (" + errorKeys.join(', ') + ") not present in JSON Response body");
        }
      });
      return this;
    },


    // Helper to check parse HTTP response body as JSON and check key types
    expectJSON: function(jsonTest) {
      var self     = this,
          args     = Array.prototype.slice.call(arguments),
          path     = typeof args[0] === 'string' && args.shift(),
          jsonTest = typeof args[0] === 'object' && args.shift();
      
      this.current.expects.push(function() {
        var jsonBody = JSON.parse(_currentRequestFinished.body);
        // Use given path to check deep objects
        if(path) {
          _.each(path.split('.'), function(val) {
            jsonBody = jsonBody[val];
            expect(typeof jsonBody).toEqual("object");
          });
        }
        // Check each matching key/val
        var errorKeys = [];
        _.each(jsonTest, function(val, key) {
          var kt = typeof jsonTest[key];
          if(kt === "object") {
            // NESTED expectJSON
            if(path) {
              self.expectJSON(path+'.'+key, jsonTest[key]);
            } else {
              self.expectJSON(key, jsonTest[key]);
            }
          } else if(kt === "function") {
            // Custom matcher function
            var res = jsonTest[key](jsonBody[key]);
            if(typeof res === "boolean") {
              expect(res).toBeTruthy();
            }
          } else if(kt !== "undefined") {
            // Jasmine matcher
            expect(jsonBody[key]).toMatch(jsonTest[key]);
          } else {
            errorKeys.push(key);
          }
        });

        if(errorKeys.length > 0) {
          throw new Error("Keys (" + errorKeys.join(', ') + ") not present in JSON Response body");
        }
      });
      return this;
    },


    toType: function(obj) {
      return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
    },


    // Debugging helper to inspect HTTP request sent by Frisby
    inspectRequest: function() {
      this.after(function(err, res, body) {
        console.log(_currentRequestFinished.req);
      });
      return this;
    },

    // Debugging helper to inspect HTTP response recieved from server
    inspectResponse: function() {
      this.after(function(err, res, body) {
        console.log(res);
      });
      return this;
    },

    // Debugging helper to inspect HTTP response body content recieved from server
    inspectBody: function() {
      this.after(function(err, res, body) {
        console.log(body);
      });
      return this;
    },

    // Callback function to run after test is completed
    after: function(cb) {
      this.current.after.push(function() {
        cb.call(this, _currentRequestFinished.err, _currentRequestFinished.res, _currentRequestFinished.body);
      });
      return this;
    },

    // Callback function to run after test is completed
    // Helper to also automatically convert response body to JSON
    afterJSON: function(cb) {
      this.current.after.push(function() {
        var bodyJSON = JSON.parse(_currentRequestFinished.body);
        cb.call(this, bodyJSON);
      });
      return this;
    },

    run: function() {
      var self = this;
      // Assemble all Jasmine tests and RUN them!
      describe(self.current.describe, function() {

        // Custom matchers
        beforeEach(function() {
          this.addMatchers({
            toMatchOrBeNull: function(expected) {
              return (new RegExp(expected).test(this.actual)) || (this.actual === null);
            },
            toMatchOrBeEmpty: function(expected) {
              return (new RegExp(expected).test(this.actual)) || (this.actual === null) || (this.actual === "");
            }
          });
        });

        // Spec test
        it(self.current.itInfo, function() {
          // Run "it" spec
          self.current.it();

          // Timeout for HTTP call
          waitsFor(function(){
            return _currentRequestFinished;
          }, "HTTP Request timed out before completing", self._timeout);

          // Run Asserts
          runs(function() {
            var i;
            // REQURES count for EACH loop iteration (i.e. DO NOT OPTIMIZE THIS LOOP)
            // Some 'expects' helpers add more tests when executed (recursive 'expectJSON' and 'expectJSONTypes', with nested JSON syntax etc.)
            for(i=0; i < self.current.expects.length; i++) {
              self.current.expects[i]();
            }
          });

          // AFTER callback
          if(self.current.after) {
            _.each(self.current.after, function(fn) {
              runs(function() {
                fn.call(self);
              });
            });
          }
        })
      })
    }
  };

  // Set frisby message
  p.current.describe = msg;

  // Setup for current request
  p.reset();

  return p;
}


// Public methods and properties
exports.toss = toss;
exports.globalSetup = globalSetup;
exports.version = '0.1.0';
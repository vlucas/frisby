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
  request: {}
};
function toss(msg) {
  var _setup  = _frisbyGlobalSetup;
  var current = {
    describe: null,
    itInfo: null,
    it: null,
    expects: [],
    after: []
  };
  var _currentRequestFinished = false;

  // Public return 
  var p = {
    current: current,

    globalSetup: function(opts) {
      _frisbyGlobalSetup = opts;
      _setup = opts;
      return this;
    },

    setup: function(opts) {
      _setup = _.extend(_setup, opts);
      return this;
    },

    // Timeout default
    _timeout: 3000,

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
      _.extend(outgoing, _setup.request);

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
        if(_currentRequestFinished.res.headers[header] !== "undefined") {
          expect(_currentRequestFinished.res.headers[header].toLowerCase()).toEqual(content.toLowerCase());
        } else {
          fail("Header '" + header.toLowerCase() + "' not present in HTTP response");
        }
      });
      return this;
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
    inspectResponseBody: function() {
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

    run: function() {
      var self = this;
      // Assemble all Jasmine tests and RUN them!
      describe(self.current.describe, function() {
        it(self.current.itInfo, function() {
          // Run "it" spec
          self.current.it();

          // Timeout for HTTP call
          waitsFor(function(){
            return _currentRequestFinished;
          }, "HTTP Request timed out before completing", self._timeout);

          // Run Asserts
          runs(function() {
            _.each(self.current.expects, function(expect) {
              expect();
            });
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

  return p;
}


// Public methods and properties
exports.toss = toss;
exports.version = '0.0.2';
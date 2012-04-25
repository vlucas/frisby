//
// Frisby.js
// (c) 2011 Vance Lucas, Brightbit, LLC
//
// Frisby is a library designed to easily test REST API endpoints and their responses with node.js and Jasmine
//
// Frisby is distributed under the BSD license
// http://www.opensource.org/licenses/bsd-license.php
//
var qs = require('qs')
  ,  util = require('util')
  , request = require('request')
  , _ = require('underscore');


//
// Frisby global setup object config
//
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


var _toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
};


//
// Frisby object
//
function Frisby(msg) {
  // Setup
  this._setup = globalSetup();

  // Optional exception handler
  this._exceptionHandler = false;

  // Spec storage
  this.current = {
    outgoing: {},
    describe: msg,
    itInfo: null,
    it: null,
    expects: [],
    after: [],

    // Response storage
    response: {
      error: null,
      status: null,
      headers: [],
      body: null
    }
  };
  this.currentRequestFinished = false;

  // Default timeout
  this._timeout = 5000;

  // Response type
  this.responseType = 'json';

  return this;
}


//
// Timeout getter and setter
// 
// @param int Timeout in seconds
//
Frisby.prototype.timeout = function(t) {
  var t = t || null;
  if(null === t) {
    return this._timeout;
  }
  this._timeout = t;
  return this;
};


//
// Setup params for tests
// 
// @param {Object}
//
Frisby.prototype.setup = function(opts) {
  if(_.isUndefined(opts)) {
    return this._setup;
  }
  var oldSetup = this._setup;
  this._setup = opts;
  if(typeof this._setup.request === "undefined") {
    this._setup.request = {};
    this._setup.request.headers = {};
  }
  return this;
};


//
// Reset Frisby global and setup options
//
Frisby.prototype.reset = function() {
  this._setup = globalSetup();
  if(typeof this._setup.request === "undefined") {
    this._setup.request = {};
    this._setup.request.headers = {};
  }
  return this;
};


//
// Add HTTP header by key and value
//
// @param string header key
// @param string header value content
//
Frisby.prototype.addHeader = function(header, content) {
  this._setup.request.headers[header+"".toLowerCase()] = content+"".toLowerCase();
  return this;
};


//
// Remove HTTP header from outgoing request by key
//
// @param string header key
//
Frisby.prototype.removeHeader = function (key) {
  delete this._setup.request.headers[key+"".toLowerCase()];
  return this;
};


Frisby.prototype.setHeaders = function (headers) {
  _.each(headers, function(val, key) {
    this.addHeader(key, val);
  });
  return this;
};


//
// Return response type
// 
// @param {Object}
//
Frisby.prototype.responseType = function(type) {
  this.responseType = type;
  return this;
};


//
// HTTP Basic Auth
// 
// @param string username
// @param string password
//
Frisby.prototype.auth = function(user, pass) {
  authHash = new Buffer(user + ':' + pass).toString('base64');
  this.addHeader('Authorization', 'Basic ' + authHash);
  return this;
};


// HTTP Request
Frisby.prototype.get = function (/* [uri, params] */) {
  var args = Array.prototype.slice.call(arguments);
  args.splice(1, -1, null);
  return this._request.apply(this, ['get'].concat(args));
};

Frisby.prototype.post = function (/* [uri, data, params] */) {
  var args = Array.prototype.slice.call(arguments);
  return this._request.apply(this, ['post'].concat(args));
};

Frisby.prototype.put = function (/* [uri, data, params] */) {
  var args = Array.prototype.slice.call(arguments);
  return this._request.apply(this, ['put'].concat(args));
};

Frisby.prototype.delete = function (/* [uri, data, params] */) {
  var args = Array.prototype.slice.call(arguments);
  return this._request.apply(this, ['delete'].concat(args));
};

Frisby.prototype.head = function (/* [uri, params] */) {
  var args = Array.prototype.slice.call(arguments);
  args.splice(1, -1, null);
  return this._request.apply(this, ['head'].concat(args));
};

Frisby.prototype._request = function (/* method [uri, data, params] */) {
  var self    = this,
      args    = Array.prototype.slice.call(arguments),
      method  = args.shift(),
      uri     = typeof args[0] === 'string' && args.shift(),
      data    = typeof args[0] === 'object' && args.shift(),
      params  = typeof args[0] === 'object' && args.shift(),
      port    = this.port && this.port !== 80 ? ':' + this.port : '',
      fullUri,
      outgoing = {
        json: params.json || false,
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
      outgoing.headers['Content-Type'] = 'application/json';
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
  // Store outgoing request on current Frisby object for inspection if needed
  //
  this.current.outgoing = outgoing;
  
  //
  // Create the description for this test based on the METHOD and URL
  //
  this.current.itInfo = method.toUpperCase() + ' ' + outgoing.uri;
  
  // 
  // Determine test runner function (request or provided mock)
  // 
  var runner = params.mock || request;

  //
  // Add the topic for the specified request to the context of the current
  // batch used by this suite. 
  //
  this.current.it = function () {
    self.currentRequestFinished = false;
    runner(outgoing, function(err, res, body) {

      // Throw exception on error to prevent cryptic messages
      if(err) {
        var e = new Error("Destination URL may be down or URL is invalid.\nTrying: '" + self.current.outgoing.method.toUpperCase() + " " + self.current.outgoing.uri + "'\nGot: '" + err + "'\n");
        if(self.exceptionHandler()) {
          self._exceptionHandler.call(self, e);
        } else {
          throw e;
        }
      }

      self.currentRequestFinished = {err: err, res: res, body: body, req: outgoing};

      // Store relevant current response parts
      self.current.response = {
        error: err,
        status: (res ? res.statusCode : 500),
        headers: (res ? res.headers : {}),
        body: body
      };
    });
  };

  this._setup = globalSetup();

  return this;
};



// HTTP status expect helper
Frisby.prototype.expectStatus = function(statusCode) {
  var self = this;
  this.current.expects.push(function() {
    expect(self.current.response.status).toEqual(statusCode);
  })
  return this;
};

// HTTP header expect helper
Frisby.prototype.expectHeader = function(header, content) {
  var self = this;
  var header = header+"".toLowerCase();
  this.current.expects.push(function() {
    if(typeof self.current.response.headers[header] !== "undefined") {
      expect(self.current.response.headers[header].toLowerCase()).toEqual(content.toLowerCase());
    } else {
      fail("Header '" + header.toLowerCase() + "' not present in HTTP response");
    }
  });
  return this;
};

// HTTP header expect helper (less strict version using 'contains' instead of strict 'equals')
Frisby.prototype.expectHeaderContains = function(header, content) {
  var self = this;
  var header = header+"".toLowerCase();
  this.current.expects.push(function() {
    if(typeof self.current.response.headers[header] !== "undefined") {
      expect(self.current.response.headers[header].toLowerCase()).toContain(content.toLowerCase());
    } else {
      fail("Header '" + header.toLowerCase() + "' not present in HTTP response");
    }
  });
  return this;
};

// HTTP body expect helper
Frisby.prototype.expectBodyContains = function(content) {
  var self = this;
  this.current.expects.push(function() {
    if(typeof self.current.response.body !== "undefined") {
      expect(self.current.response.body).toContain(content);
    } else {
      fail("No HTTP response body was present or HTTP response was empty");
    }
  });
  return this;
};

// Helper to check parse HTTP response body as JSON and check key types
Frisby.prototype.expectJSONTypes = function(/* [tree], jsonTest */) {
  var self     = this,
      args     = Array.prototype.slice.call(arguments),
      path     = typeof args[0] === 'string' && args.shift(),
      jsonTest = typeof args[0] === 'object' && args.shift(),
      type     = null;

  this.current.expects.push(function() {
    var jsonBody = _jsonParse(self.current.response.body);
    // Use given path to check deep objects
    if(path) {
      _.each(path.split('.'), function(segment) {
        // Must be array if special characters are present
        if("*" === segment || "?" === segment ) {
          var jt = _toType(jsonBody);
          type = segment;

          if("array" !== jt) {
            throw new TypeError("Expected '" + path + "' to be Array (got '" + jt + "' from JSON response)");
          }
        } else {
          jsonBody = jsonBody[segment];
          var jt = _toType(jsonBody);

          // Must be object
          if("object" !== jt && "array" !== jt) {
            throw new TypeError("Expected '" + path + "' to be object or array (got '" + jt + "' from JSON response)");
          } 
        }
      });
    }
    
    // EACH item in array should match
    if("*" === type) {
      _.each(jsonBody, function(json) {
        expect(json).toContainJsonTypes(jsonTest);
      });

    // ONE item in array should match
    } else if("?" === type) {
      var itemCount = jsonBody.length;
      var errorCount = 0;
      var errorLast;

      for(var i = 0; i < itemCount; i++) {
        try {
          var result = _jsonContainsTypes(jsonBody[i], jsonTest);
        } catch (e) {
          errorCount++;
          errorLast = e; 
        }
      };

      // If all errors, test fails
      if(itemCount === errorCount) {
        if(errorLast) {
          throw errorLast;
        } else {
          throw new Error("Expected one object in path '" + path + "' to match provided JSON types");
        }
      }

    // Normal matcher
    } else {
      expect(jsonBody).toContainJsonTypes(jsonTest);
    }
  });
  return this;
};


// Helper to check parse HTTP response body as JSON and check key types
Frisby.prototype.expectJSON = function(jsonTest) {
  var self     = this,
      args     = Array.prototype.slice.call(arguments),
      path     = typeof args[0] === 'string' && args.shift(),
      jsonTest = typeof args[0] === 'object' && args.shift(),
      params   = typeof args[0] === 'object' && args.shift(),
      type     = null;
  
  this.current.expects.push(function() {
    var jsonBody = _jsonParse(self.current.response.body);
    // Use given path to check deep objects
    if(path) {
      _.each(path.split('.'), function(segment) {
        // Must be array if special characters are present
        if("*" === segment || "?" === segment) {
          var jt = _toType(jsonBody);
          type = segment;

          if("array" !== jt) {
            throw new TypeError("Expected '" + path + "' to be Array (got '" + jt + "' from JSON response)");
          }
        } else {
          jsonBody = jsonBody[segment];
          var jt = _toType(jsonBody);

          // Must be object
          if("object" !== jt && "array" !== jt) {
            throw new TypeError("Expected '" + path + "' to be object or array (got '" + jt + "' from JSON response)");
          } 
        }
      });
    }

    // EACH item in array should match
    if("*" === type) {
      _.each(jsonBody, function(json) {
        expect(json).toContainJson(jsonTest);
      });

    // ONE item in array should match
    } else if("?" === type) {
      var itemCount = jsonBody.length;
      var errorCount = 0;
      var errorLast;

      for(var i = 0; i < itemCount; i++) {
        try {
          var result = _jsonContains(jsonBody[i], jsonTest);
        } catch (e) {
          errorCount++;
          errorLast = e; 
        }
      };

      // If all errors, test fails
      if(itemCount === errorCount) {
        if(errorLast) {
          throw errorLast;
        } else {
          throw new Error("Expected one object in path '" + path + "' to match provided JSON values");
        }
      }

    // Normal matcher
    } else {
      expect(jsonBody).toContainJson(jsonTest);
    }
  });
  return this;
};


// Helper to check parse HTTP response body as JSON and check array or object length
Frisby.prototype.expectJSONLength = function(expectedLength) {
  var self           = this,
      args           = Array.prototype.slice.call(arguments),
      path           = typeof args[0] === 'string' && args.shift(),
      expectedLength = typeof args[0] === 'number' && args.shift(),
      type           = null;

  this.current.expects.push(function() {
    var jsonBody = _jsonParse(self.current.response.body);
    // Use given path to check deep objects
    if(path) {
      _.each(path.split('.'), function(segment) {
        // Traverse down path
        jsonBody = jsonBody[segment];

        if(_.isUndefined(jsonBody)) {
          throw new Error("Expected path '" + path + "' ");
        }
      });
    }

    var len = 0;
    if(_toType(jsonBody) == 'object') {
      len = Object.keys(jsonBody).length;
    } else {
      len = jsonBody.length;
    }

    // Generate useful error message if values don't match
    if(len !== expectedLength) {
      throw new Error("Expected JSON length to be '" + expectedLength + "', got '" + len + "'" + (path ? (" in path '" + path + "'") : ""));
    }
  });
  return this;
};


// Debugging helper to inspect HTTP request sent by Frisby
Frisby.prototype.inspectRequest = function() {
  var self = this;
  this.after(function(err, res, body) {
    console.log(self.currentRequestFinished.req);
  });
  return this;
};

// Debugging helper to inspect HTTP response recieved from server
Frisby.prototype.inspectResponse = function() {
  this.after(function(err, res, body) {
    console.log(res);
  });
  return this;
};

// Debugging helper to inspect HTTP response body content recieved from server
Frisby.prototype.inspectBody = function() {
  this.after(function(err, res, body) {
    console.log(body);
  });
  return this;
};

// Debugging helper to inspect JSON response body content recieved from server
Frisby.prototype.inspectJSON = function() {
  this.after(function(err, res, body) {
    console.log(util.inspect(_jsonParse(body), false, 10, true));
  });
  return this;
};

// Debugging helper to inspect HTTP response code recieved from server
Frisby.prototype.inspectStatus = function() {
  this.after(function(err, res, body) {
    console.log(res.statusCode);
  });
  return this;
};

// Callback function to run after test is completed
Frisby.prototype.after = function(cb) {
  var self = this;
  this.current.after.push(function() {
    cb.call(this, self.current.response.error, self.currentRequestFinished.res, self.current.response.body);
  });
  return this;
};

// Callback function to run after test is completed
// Helper to also automatically convert response body to JSON
Frisby.prototype.afterJSON = function(cb) {
  var self = this;
  this.current.after.push(function() {
    var bodyJSON = _jsonParse(self.current.response.body);
    cb.call(this, bodyJSON);
  });
  return this;
};

// Exception handler callback function
Frisby.prototype.exceptionHandler = function(fn) {
  if(_.isUndefined(fn)) {
    return this._exceptionHandler;
  }
  this._exceptionHandler = fn;
  return this;
};

//
// Methods to manually set parts of the response for matcher testing
//

// Set response from JSON object
Frisby.prototype.setResponseJSON = function(json) {
  this.currentRequestFinished = true;
  this.current.response.body = JSON.stringify(json);
  return json;
};

// Set raw response body
Frisby.prototype.setResponseBody = function(body) {
  this.currentRequestFinished = true;
  this.current.response.body = body;
  return body;
};

// Set response headers
Frisby.prototype.setResponseHeaders = function(/* array */ headers) {
  this.current.response.headers = headers;
  return headers;
};

// Set single response header by key with specified value
Frisby.prototype.setResponseHeader = function(key, value) {
  this.current.response.headers[key.toLowerCase()] = value.toLowerCase();
  return this.current.response.headers[key.toLowerCase()];
};


//
// Toss (Run the current Frisby test)
//
Frisby.prototype.toss = function() {
  var self = this;

  // Assemble all Jasmine tests and RUN them!
  describe('Frisby Test: ' + self.current.describe, function() {

    // Spec test
    it(self.current.describe + "\n\t[ " + self.current.itInfo + " ]", function() {
      // Run "it" spec
      self.current.it();

      // Timeout for HTTP call
      waitsFor(function(){
        return self.currentRequestFinished;
      }, "HTTP Request timed out before completing", self._timeout);

      // Run Asserts
      runs(function() {
        var i;
        // REQURES count for EACH loop iteration (i.e. DO NOT OPTIMIZE THIS LOOP)
        // Some 'expects' helpers add more tests when executed (recursive 'expectJSON' and 'expectJSONTypes', with nested JSON syntax etc.)
        for(i=0; i < self.current.expects.length; i++) {
          if(false !== self._exceptionHandler) {
            try {
              self.current.expects[i]();
            } catch(e) {
              self._exceptionHandler.call(self, e);
            }
          } else {
            self.current.expects[i]();
          }
        }
      });

      // AFTER callback
      if(self.current.after) {
        _.each(self.current.after, function(fn) {
          runs(function() {
            if(false !== self._exceptionHandler) {
              try {
                fn.call(self);
              } catch(e) {
                self._exceptionHandler(e);
              }
            } else {
              fn.call(self);
            }
          });
        });
      }
    });
  });
};
// Backwards-compatible alias "run"
Frisby.prototype.run = Frisby.prototype.toss;


//
// Add custom Frisby matchers to Jasmine
//
beforeEach(function() {
  this.addMatchers({
    toMatchOrBeNull: function(expected) {
      this.message = function() {
        return "Expected '" + this.actual + "' to match '" + expected + "' or be null";
      }
      return (new RegExp(expected).test(this.actual)) || (this.actual === null);
    },
    toMatchOrBeEmpty: function(expected) {
      this.message = function() {
        return "Expected '" + this.actual + "' to match '" + expected + "' or be empty";
      }
      return (new RegExp(expected).test(this.actual)) || (this.actual === null) || (this.actual === "");
    },
    toBeType: function(expected) {
      var aType = _toType(this.actual);
      var eType = _toType(expected);
      // Function is not a valid JSON type
      if("function" === eType) {
        eType = _toType(expected.prototype);
      }
      // Custom failure message
      this.message = function() {
        return "Expected '" + aType + "' to be type '" + eType + "'";
      }
      // Test
      return aType === eType;
    },
    toBeTypeOrNull: function(expected) {
      var aType = _toType(this.actual);
      var eType = _toType(expected);
      // Function is not a valid JSON type
      if("function" === eType) {
        eType = _toType(expected.prototype);
      }
      // Custom failure message
      this.message = function() {
        return "Expected '" + aType + "' to be type '" + eType + "' or null";
      }
      // Test
      return (this.actual === null) || (_toType(this.actual) === eType);
    },
    toContainJson: function(expected) {
      this.message = function() {
        return "Actual JSON did not match expected";
      }

      // Way of allowing custom failure message - by thowing expections in utility function
      try {
        return _jsonContains(this.actual, expected);
      } catch(e) {
        // Set message to exception
        this.message = function() {
          return e.message;
        }
        return false;
      }
    },
    toContainJsonTypes: function(expected) {
      this.message = function() {
        return "Actual JSON types did not match expected";
      }

      // Way of allowing custom failure message - by thowing expections in utility function
      try {
        return _jsonContainsTypes(this.actual, expected);
      } catch(e) {
        // Set message to exception
        this.message = function() {
          return e.message;
        }
        return false;
      }
    }
  });
});


// 
// Parse body as JSON, ensuring not to re-parse when body is already an object (thanks @dcaylor)
//
function _jsonParse(body) {
  return (typeof body === "object") ? body : JSON.parse(body);
}


function _jsonContains(jsonBody, jsonTest) {
  if(typeof jsonTest !== "object") {
    throw new TypeError("Expected valid JavaScript object to be given, got " + typeof expected);
  }

  // Type check first to prevent potentially confusing errors
  var aType = _toType(jsonBody);
  var eType = _toType(jsonTest);
  // Function is not a valid JSON type
  if("function" === eType) {
    eType = _toType(jsonTest.prototype);
  }
  if(aType !== eType) {
    throw new Error("Expected '" + aType + "' to be type '" + eType + "' for comparison");
  }

  // Check each matching key/val
  var errorKeys = [];
  for(key in jsonTest) {

    // Ensure property exists
    if(jsonBody && jsonBody.hasOwnProperty(key)) {
      var kt = typeof jsonTest[key];
      if(kt === "object") {
        // NESTED expectJSON
        _jsonContains(jsonBody[key], jsonTest[key]);
        continue;
      } else if(kt === "function") {
        var keyType = jsonTest[key].prototype;

        // User-supplied callback (anonymous function)
        if(_toType(keyType) === "object" && arguments.callee.caller.name === "") {
          // Custom matcher function
          var res = jsonTest[key].call(this, jsonBody[key]);
          if(typeof res === "boolean") {
            if(true !== res) {
              throw new Error("Expected callback function on key '" + key + "' to return true");
            }
          }
          // Don't do any further assertions for user
          continue;
        }
      } else if(kt !== "undefined") {
        // Jasmine 'toMatch' matcher
        var test = (jsonBody[key] === jsonTest[key]);
        if(!test) {
          throw new Error("Expected " + _toType(jsonBody[key]) + " '" + jsonBody[key] + "' to match " + _toType(jsonTest[key]) + " '" + jsonTest[key] + "' on key '" + key + "'");
        }
      }
    } else {
      errorKeys.push(key);
    }
  };

  if(errorKeys.length > 0) {
    throw new Error("Keys ['" + errorKeys.join("', '") + "'] not present in JSON Response body");
  }

  return true;
}


function _jsonContainsTypes(jsonBody, jsonTest) {
  // Check each matching key/val
  var errorKeys = [];
  for(key in jsonTest) {
    if(typeof jsonBody[key] !== "undefined") {
      // Convert type literal to prototype for correct result
      var kt = _toType(jsonTest[key]);
      if(kt === "function") {
        var keyType = jsonTest[key].prototype;

        // User-supplied callback (anonymous function)
        if(_toType(keyType) === "object" && arguments.callee.caller.name === "") {
          // Custom matcher function
          var res = jsonTest[key](jsonBody[key]);
          if(typeof res === "boolean") {
            if(true !== res) {
              throw new Error("Expected callback function on key '" + key + "' to return true");
            }
          }
          // Don't do any further assertions for user
          continue;
        } else {
          jsonTest[key] = keyType;
        }
      } else if(kt === "object") {
        // NESTED expectJSON
        _jsonContainsTypes(jsonBody[key], jsonTest[key]);
        continue;
      }

      // Type check on key (custom Jasmine matcher)
      var aType = _toType(jsonBody[key]);
      var eType = _toType(jsonTest[key]);
      // Function is not a valid JSON type
      if("function" === eType) {
        eType = _toType(jsonTest[key].prototype);
      }
      if(aType !== eType) {
        throw new Error("Expected '" + aType + "' to be type '" + eType + "' on key '" + key + "'");
      }

    } else {
      errorKeys.push(key);
    }
  };
  
  if(errorKeys.length > 0) {
    throw new Error("Keys ['" + errorKeys.join("', '") + "'] not present in JSON Response body");
  }

  return true;
}


// 
// Main Frisby method used to start new spec tests
//
exports.create = function(msg) {
  return new Frisby(msg);
};
exports.toss = exports.create;


// Public methods and properties
exports.globalSetup = globalSetup;
exports.version = '0.4.5';

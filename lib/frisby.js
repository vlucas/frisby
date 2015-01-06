//
// Frisby.js
// (c) 2011-2014 Vance Lucas, Brightbit, LLC
//
// Frisby is a library designed to easily test REST API endpoints and their responses with node.js and Jasmine
//
// Frisby is distributed under the BSD license
// http://www.opensource.org/licenses/bsd-license.php
//
var qs = require('qs')
  , util = require('util')
  , request = require('request')
  , _ = require('underscore')
  , JSONSchemaValidator = require('jsonschema').Validator
  , stackTrace = require('stack-trace')
  , fs = require('fs')
  , fspath = require('path')
  , Stream = require('stream').Stream;


//
// Frisby global setup object config
//
var _frisbyGlobalSetup = {
  request: {
    headers: {},
    inspectOnFailure: false,
    json: false,
    baseUri: ''
  }
};
var globalSetup = function(opts) {
  if(typeof opts !== "undefined") {
    _frisbyGlobalSetup = opts;
    if(typeof _frisbyGlobalSetup.request === "undefined") {
      _frisbyGlobalSetup.request = {};
      _frisbyGlobalSetup.request.headers = {};
      _frisbyGlobalSetup.request.inspectOnFailure = false;
      _frisbyGlobalSetup.request.json = false;
      _frisbyGlobalSetup.request.baseUri = '';
    }
  }
  return _frisbyGlobalSetup;
};


var _toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
};


// Path execution method
var _withPath = function(path, jsonBody, callback) {
  var self = this
    , type = false;

  try {
    // Use given path to check deep objects
    if(path) {
      var pathParts = path.split('.');
      _.each(path.split('.'), function(segment) {
        var jt = _toType(jsonBody);
        // Must be array if special characters are present
        if("*" === segment || "?" === segment) {
          type = segment;

          if("array" !== jt) {
            throw new TypeError("Expected '" + path + "' to be Array (got '" + jt + "' from JSON response)");
          }
        } else if("&" === segment) {
          type = segment;

          if("object" !== jt) {
            throw new TypeError("Expected '" + path + "' to be Object (got '" + jt + "' from JSON response)");
          }
        } else {
          jsonBody = jsonBody[segment];

          // Must be object
          if("object" !== jt && "array" !== jt) {
            throw new TypeError("Expected '" + path + "' to be object or array (got '" + jt + "' from JSON response)");
          }
        }
      });
    }
  } catch(e) {
    throw e;
  }

  // EACH item in array should match
  if("*" === type || "&" === type) {
    _.each(jsonBody, function(json) {
      callback.call(null, json);
    });

  // ONE item in array should match
  } else if("?" === type) {
    var itemCount = jsonBody.length;
    var errorCount = 0;
    var errorLast;

    for(var i = 0; i < itemCount; i++) {
      try {
        var result = callback.call(null, jsonBody[i]);
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
    return callback.call(null, jsonBody);
  }
};


var cloneObject = function(obj) {
  var clone = {};
  for(var i in obj) {
    if(typeof(obj[i])=="object")
      clone[i] = cloneObject(obj[i]);
    else
      clone[i] = obj[i];
  }
  return clone;
};


//
// Frisby object
//
function Frisby(msg) {
  // Clone globalSetup (not reference)
  var _gs = cloneObject(globalSetup());
  // _gs may contain mixed-cased header names, the code expects lowercase however.
  if(_gs.request && _gs.request.headers) {
    var _tmpHeaders = {};
    _.each(_gs.request.headers, function(val, key) {
      _tmpHeaders[(key+"").toLowerCase()] = val+"";
    });
    _gs.request.headers = _tmpHeaders;
  }

  // Optional exception handler
  this._exceptionHandler = false;

  // Spec storage
  this.current = {
    outgoing: {},
    describe: msg,
    itInfo: null,
    it: null,
    isNot: false, // For Jasmine test negation
    expects: [],
    after: [],
    retry: _gs.retry || 0,
    retry_backoff: _gs.retry_backoff || 1000,

    // Custom vars added to test HTTP Request (like headers)
    request: _gs.request,

    // Response storage
    response: {
      error: null,
      status: null,
      headers: [],
      body: null,
      time: 0
    }
  };
  this.currentRequestFinished = false;

  // Default timeout
  this._timeout = _gs.timeout || 5000;

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
// Reset Frisby global and setup options
//
Frisby.prototype.reset = function() {
  this.current.request = {
    headers: {}
  };
  return this;
};


//
// Set negation test
//
Frisby.prototype.not = function() {
  this.current.isNot = true;
  return this;
};


//
// Add HTTP header by key and value
//
// @param string header key
// @param string header value content
//
Frisby.prototype.addHeader = function(header, content) {
  this.current.request.headers[(header+"").toLowerCase()] = content+"";
  return this;
};

//
// Add group of HTTP headers together
//
Frisby.prototype.addHeaders = function (headers) {
  var self = this;
  _.each(headers, function(val, key) {
    self.addHeader(key, val);
  });
  return this;
};
Frisby.prototype.setHeaders = function(headers) {
  console.warn("\nMethod 'setHeaders' is DEPRECATED and will be removed soon. Please use 'addHeaders' method instead.\nIn Spec: '" + this.current.describe + "'\n");
  return this.addHeaders(headers);
};

//
// Remove HTTP header from outgoing request by key
//
// @param string header key
//
Frisby.prototype.removeHeader = function (key) {
  delete this.current.request.headers[(key+"").toLowerCase()];
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
// @param boolean digest
//
Frisby.prototype.auth = function(user, pass, digest) {
  this.current.outgoing.auth = {
    sendImmediately: !digest,
    user: user,
    pass: pass
  };
  return this;
};


// HTTP Request
Frisby.prototype.get = function (/* [uri, params] */) {
  var args = Array.prototype.slice.call(arguments);
  args.splice(1, -1, null);
  return this._request.apply(this, ['GET'].concat(args));
};

Frisby.prototype.patch = function (/* [uri, data, params] */) {
  var args = Array.prototype.slice.call(arguments);
  return this._request.apply(this, ['PATCH'].concat(args));
};

Frisby.prototype.post = function (/* [uri, data, params] */) {
  var args = Array.prototype.slice.call(arguments);
  return this._request.apply(this, ['POST'].concat(args));
};

Frisby.prototype.put = function (/* [uri, data, params] */) {
  var args = Array.prototype.slice.call(arguments);
  return this._request.apply(this, ['PUT'].concat(args));
};

Frisby.prototype.delete = function (/* [uri, data, params] */) {
  var args = Array.prototype.slice.call(arguments);
  return this._request.apply(this, ['DELETE'].concat(args));
};

Frisby.prototype.head = function (/* [uri, params] */) {
  var args = Array.prototype.slice.call(arguments);
  args.splice(1, -1, null);
  return this._request.apply(this, ['HEAD'].concat(args));
};

Frisby.prototype.options = function (/* [uri, params] */) {
    var args = Array.prototype.slice.call(arguments);
    args.splice(1, -1, null);
    return this._request.apply(this, ['OPTIONS'].concat(args));
};

var _hasHeader = function (headername, headers) {
  var headerNames = Object.keys(headers || {});
  var lowerNames = headerNames.map(function (name) {return name.toLowerCase()});
  var lowerName = headername.toLowerCase()
  for (var i=0;i<lowerNames.length;i++) {
    if (lowerNames[i] === lowerName) return headerNames[i]
  }
  return false
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
        json: params.json || (_frisbyGlobalSetup && _frisbyGlobalSetup.request && _frisbyGlobalSetup.request.json || false),
        uri: null,
        body: params.body || null,
        method: 'GET',
        headers: {}
      };

  // Explicit setting of 'body' param overrides data
  if(params.body) {
    data = params.body;
  }

  // Merge 'current' request options for current request
  _.extend(outgoing, this.current.request, params || {});

  // Normalize content-type

  var contentTypeKey = _hasHeader('content-type', outgoing.headers);
  if(contentTypeKey !== 'content-type') {
      outgoing.headers['content-type'] = outgoing.headers[contentTypeKey];
      delete outgoing.headers[contentTypeKey];
  }

  // Ensure we have at least one 'content-type' header
  if(_.isUndefined(outgoing.headers['content-type'])) {
    outgoing.headers['content-type'] = 'application/x-www-form-urlencoded';
  }

  // Set outgoing URI
  outgoing.uri = (_frisbyGlobalSetup && _frisbyGlobalSetup.request && _frisbyGlobalSetup.request.baseUri || '') + uri;

  //
  // If the user has provided data, assume that it is query string
  // and set it to the `body` property of the options.
  //
  if (data) {
    // if JSON data
    if(outgoing.json) {
      outgoing.headers['content-type'] = 'application/json';
      outgoing.body = data;
    } else if(!outgoing.body) {
      if(data instanceof Buffer) {
        outgoing.body = data;
      } else if (!(data instanceof Stream)) {
        outgoing.body = qs.stringify(data);
      }
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
    var start = (new Date).getTime();
    var runCallback = function(err, res, body) {

      // Timeout is now handled by request
      if(err) {
        body = "Destination URL may be down or URL is invalid, " + err;
      }

      var diff = (new Date).getTime() - start;

      self.currentRequestFinished = {err: err, res: res, body: body, req: outgoing};

      // Convert header names to lowercase
      var headers = {};
      res && _.each(res.headers, function(val, key) {
        headers[(key+"").toLowerCase()] = val;
      });
      // Store relevant current response parts
      self.current.response = {
        error: err,
        status: (res ? res.statusCode : 500),
        headers: headers,
        body: body,
        time: diff
      };
    };

    outgoing['timeout'] = self._timeout;

    var req = null;

    // Handle forms (normal data with {form: true} in params options)
    if(!_.isUndefined(params.form) && params.form === true) {
      delete outgoing.headers['content-type'];
      req = runner(outgoing, runCallback);
      var form = req.form();
      for(field in data) {
        form.append(field, data[field]);
      }
    } else {
      req = runner(outgoing, runCallback);
    }

    if((data instanceof Stream) && (outgoing.method === 'POST' || outgoing.method === 'PUT' || outgoing.method === 'PATCH'))  {
        data.pipe(req);
    }

  };

  return this;
};

// Max Response time expect helper
Frisby.prototype.expectMaxResponseTime = function(milliseconds) {
  var self = this;
  this.current.expects.push(function() {
    expect(self.current.response.time).toBeLessThan(milliseconds);
  })
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
  var header = (header+"").toLowerCase();
  this.current.expects.push(function() {
    if(typeof self.current.response.headers[header] !== "undefined") {
      expect(self.current.response.headers[header].toLowerCase()).toEqual(content.toLowerCase());
    } else {
      throw new Error("Header '" + header + "' not present in HTTP response");
    }
  });
  return this;
};

// HTTP header expect helper (less strict version using 'contains' instead of strict 'equals')
Frisby.prototype.expectHeaderContains = function(header, content) {
  var self = this;
  var header = (header+"").toLowerCase();
  this.current.expects.push(function() {
    if(typeof self.current.response.headers[header] !== "undefined") {
      expect(self.current.response.headers[header].toLowerCase()).toContain(content.toLowerCase());
    } else {
      throw new Error("Header '" + header + "' not present in HTTP response");
    }
  });
  return this;
};

// HTTP header expect helper regular expression match
Frisby.prototype.expectHeaderToMatch = function(header, pattern) {
    var self = this;
    var header = (header+"").toLowerCase();
    this.current.expects.push(function() {
        if(typeof self.current.response.headers[header] !== "undefined") {
            expect(self.current.response.headers[header].toLowerCase()).toMatch(pattern);
        } else {
            throw new Error("Header '" + header + "' does not match pattern '" + pattern + "' in HTTP response");
        }
    });
    return this;
};

// HTTP body expect helper
Frisby.prototype.expectBodyContains = function(content) {
  var self = this;
  this.current.expects.push(function() {
    if(!_.isUndefined(self.current.response.body)) {
      expect(self.current.response.body).toContain(content);
    } else {
      throw new Error("No HTTP response body was present or HTTP response was empty");
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
    var jt = _toType(jsonBody);
    try {
      // Use given path to check deep objects
      if(path) {
        _.each(path.split('.'), function(segment) {
          jt = _toType(jsonBody);

          // Must be array if special characters are present
          if("*" === segment || "?" === segment ) {
            type = segment;

            // Must be array
            if("array" !== jt) {
              throw new TypeError("Expected '" + path + "' to be Array (got '" + jt + "' from JSON response)");
            }
          } else if("&" === segment) {
            type = segment;

            // Must be object
            if("object" !== jt) {
              throw new TypeError("Expected '" + path + "' to be Object (got '" + jt + "' from JSON response)");
            }
          } else {
            jsonBody = jsonBody[segment];

            // Must be object or array
            if("object" !== jt && "array" !== jt) {
              throw new TypeError("Expected '" + path + "' to be object or array (got '" + jt + "' from JSON response)");
            }
          }
        });
      }
    } catch(e) {
      if(!self.current.isNot) {
        throw e;
      }
    }

    // EACH item in array should match
    if("*" === type || "&" === type) {
      _.each(jsonBody, function(json) {
        expect(json).toContainJsonTypes(jsonTest, self.current.isNot);
      });

    // ONE item in array should match
    } else if("?" === type) {
      var itemCount = jsonBody.length;
      var errorCount = 0;
      var errorLast;

      for(var i = 0; i < itemCount; i++) {
        try {
          var result = _jsonContainsTypes(jsonBody[i], jsonTest, self.current.isNot);
        } catch (e) {
          errorCount++;
          errorLast = e;
        }
      };

      // If all errors, test fails
      if(itemCount === errorCount && !self.current.isNot) {
        if(errorLast) {
          throw errorLast;
        } else {
          throw new Error("Expected one object in path '" + path + "' to match provided JSON types");
        }
      }

    // Normal matcher
    } else {
      expect(jsonBody).toContainJsonTypes(jsonTest, self.current.isNot);
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
    try {
      // Use given path to check deep objects
      if(path) {
        _.each(path.split('.'), function(segment) {
          var jt = _toType(jsonBody);
          // Must be array if special characters are present
          if("*" === segment || "?" === segment) {
            type = segment;

            if("array" !== jt) {
              throw new TypeError("Expected '" + path + "' to be Array (got '" + jt + "' from JSON response)");
            }
          } else if("&" === segment) {
            type = segment;

            if("object" !== jt) {
              throw new TypeError("Expected '" + path + "' to be Object (got '" + jt + "' from JSON response)");
            }
          } else {
            jsonBody = jsonBody[segment];

            // Must be object
            if("object" !== jt && "array" !== jt) {
              throw new TypeError("Expected '" + path + "' to be object or array (got '" + jt + "' from JSON response)");
            }
          }
        });
      }
    } catch(e) {
      if(!self.current.isNot) {
        throw e;
      }
    }

    // EACH item in array should match
    if("*" === type || "&" === type) {
      _.each(jsonBody, function(json) {
        expect(json).toContainJson(jsonTest, self.current.isNot);
      });

    // ONE item in array should match
    } else if("?" === type) {
      var itemCount = jsonBody.length;
      var errorCount = 0;
      var errorLast;

      for(var i = 0; i < itemCount; i++) {
        try {
          var result = _jsonContains(jsonBody[i], jsonTest, self.current.isNot);
        } catch (e) {
          errorCount++;
          errorLast = e;
        }
      };

      // If all errors, test fails
      if(itemCount === errorCount && !self.current.isNot) {
        if(errorLast) {
          throw errorLast;
        } else {
          throw new Error("Expected one object in path '" + path + "' to match provided JSON values");
        }
      }

    // Normal matcher
    } else {
      expect(jsonBody).toContainJson(jsonTest, self.current.isNot);
    }
  });
  return this;
};


// Helper to validate JSON response against provided JSONSchema structure or document
Frisby.prototype.expectJSONSchema = function(path, jsonSchema) {
  var self       = this,
      args       = Array.prototype.slice.call(arguments),
      path       = typeof args[0] === 'string' && args.shift(),
      jsonSchema = (typeof args[0] === 'object' || typeof args[0] === 'string') && args.shift();

  // If called with only a single argument, ensure path is null
  if(_.isUndefined(jsonSchema) || !jsonSchema) {
    jsonSchema = path;
    path = false;
  }

  // String = file path
  if(typeof jsonSchema === 'string') {
    var jsonSchemaFile = jsonSchema;
    // Allows relative file paths from Frisby specs
    if(!fs.existsSync(jsonSchemaFile)) {
      var trace       = stackTrace.parse(new Error());
      var callingFile = trace[1].getFileName();
      var callingDir  = fspath.dirname(callingFile)
      jsonSchemaFile = fspath.join(callingDir, jsonSchema);
    }
    var data        = fs.readFileSync(jsonSchemaFile, 'utf-8');
    jsonSchema      = JSON.parse(data);
  }

  this.current.expects.push(function() {
    var jsonBody = _jsonParse(self.current.response.body);
    // With path syntax
    _withPath.call(self, path, jsonBody, function(jsonChunk) {
      var jsVal = new JSONSchemaValidator();
      var res = jsVal.validate(jsonChunk, jsonSchema);
      if(res.valid === true) {
        // Use assertion to keep assertion count accurate
        expect(res.valid).toBeTruthy();
      } else if (self.current.isNot) {
        // Inverse expectation
        expect(res.valid).toBeFalsy();
      } else {
        // JSONSchema failures - show each one to user
        throw new Error("JSONSchema validation failed with the following errors: \n\t> " +
          res.errors.map(function(err, field) { return err.stack.replace('instance', path); }).join("\n\t> ")
        );
      }
    });
  });

  return this;
};


// Helper to check parse HTTP response body as JSON and check array or object length
Frisby.prototype.expectJSONLength = function(expectedLength) {
  var self           = this,
      args           = Array.prototype.slice.call(arguments),
      path           = typeof args[0] === 'string' && args.shift(), // optional 1st parameter
      expectedLength = (typeof args[0] === 'number' || typeof args[0] === 'string') && args.shift(), // 1st or 2nd parameter
      type           = null,
      lengthSegments = {
        "count": parseInt(/\d+/.exec(expectedLength), 10),
        "sign": /\D+/.exec(expectedLength)
      };

  if (lengthSegments.sign && typeof lengthSegments.sign === 'object') {
    lengthSegments.sign = lengthSegments.sign[0].replace(/^\s+|\s+$/g, ''); // trim
  }

  this.current.expects.push(function() {
    var jsonBody = _jsonParse(self.current.response.body);
    // Use given path to check deep objects
    if(path) {
      _.each(path.split('.'), function(segment) {

        // Must be array if special characters are present
        if("*" === segment) {
          var jt = _toType(jsonBody);
          type = segment;

          if("array" !== jt) {
            throw new TypeError("Expected '" + path + "' to be Array (got '" + jt + "' from JSON response)");
          }
        } else {
          // Traverse down path
          jsonBody = jsonBody[segment];
        }

        if(_.isUndefined(jsonBody)) {
          throw new Error("expectJSONLength expected path '" + path + "' ");
        }
      });
    }

    // Callback that does the work
    var expectLength = function(jsonBody, lengthSegments) {
      var len = 0;
      if(_toType(jsonBody) == 'object') {
        len = Object.keys(jsonBody).length;
      } else {
        len = jsonBody.length;
      }

      switch (lengthSegments.sign) {
        case "<=":
          if(!(len <= lengthSegments.count)) { // Generate useful error message if values don't match
            throw new Error("Expected JSON length to be less than or equal '" + lengthSegments.count + "', got '" + len + "'" + (path ? (" in path '" + path + "'") : ""));
          }
          expect(len).toBeLessThan(lengthSegments.count+1);
          break;
        case "<":
          if(!(len < lengthSegments.count)) { // Generate useful error message if values don't match
            throw new Error("Expected JSON length to be less than '" + lengthSegments.count + "', got '" + len + "'" + (path ? (" in path '" + path + "'") : ""));
          }
          expect(len).toBeLessThan(lengthSegments.count);
          break;
        case ">=":
          if(!(len >= lengthSegments.count)) { // Generate useful error message if values don't match
            throw new Error("Expected JSON length to be greater than or equal '" + lengthSegments.count + "', got '" + len + "'" + (path ? (" in path '" + path + "'") : ""));
          }
          expect(len).toBeGreaterThan(lengthSegments.count-1);
          break;
        case ">":
          if(!(len > lengthSegments.count)) { // Generate useful error message if values don't match
            throw new Error("Expected JSON length to be greater than '" + lengthSegments.count + "', got '" + len + "'" + (path ? (" in path '" + path + "'") : ""));
          }
          expect(len).toBeGreaterThan(lengthSegments.count);
          break;
        case null:
          if(len !== lengthSegments.count) {
            throw new Error("Expected JSON length to be '" + lengthSegments.count + "', got '" + len + "'" + (path ? (" in path '" + path + "'") : ""));
          }
          expect(len).toBe(lengthSegments.count);
          break;
      } //end switch
    }

    // EACH item in array should match
    if("*" === type) {
      _.each(jsonBody, function(json) {
        expectLength(json, lengthSegments);
      });
    } else {
      expectLength(jsonBody, lengthSegments);
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

// Debugging helper to inspect HTTP response received from server
Frisby.prototype.inspectResponse = function() {
  this.after(function(err, res, body) {
    console.log(res);
  });
  return this;
};

// Debugging helper to inspect the HTTP headers that are returned from the server
Frisby.prototype.inspectHeaders = function(){
  this.after(function(err, res, body) {
    console.log(res.headers);
  });
  return this;
};

// Debugging helper to inspect HTTP response body content received from server
Frisby.prototype.inspectBody = function() {
  this.after(function(err, res, body) {
    console.log(body);
  });
  return this;
};

// Debugging helper to inspect JSON response body content received from server
Frisby.prototype.inspectJSON = function() {
  this.after(function(err, res, body) {
    console.log(util.inspect(_jsonParse(body), false, 10, true));
  });
  return this;
};

// Debugging helper to inspect HTTP response code received from server
Frisby.prototype.inspectStatus = function() {
  this.after(function(err, res, body) {
    console.log(res.statusCode);
  });
  return this;
};

Frisby.prototype.retry = function(count, backoff) {
  this.current.retry = count;
  if(typeof backoff !== "undefined") {
    this.current.retry_backoff = backoff;
  }
  return this;
};

Frisby.prototype.waits = function(millis) {
  this.current.waits = millis;
  return this;
}

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
Frisby.prototype.toss = function(retry) {
  var self = this;
  if (typeof retry === "undefined") {
    retry = self.current.retry;
  }

  // Assemble all Jasmine tests and RUN them!
  describe('Frisby Test: ' + self.current.describe, function() {

    // Spec test
    it("\n\t[ " + self.current.itInfo + " ]", function() {
      // Ensure "it" scope is accessible to tests
      var it = this;

      if (self.current.waits > 0) {
        waits(self.current.waits);
      }

      // Don't retry POST
      var retries = (self.current.outgoing.method.toUpperCase() == "POST") ? 0 : self.current.retry;

      // we need to loop for the first run + how many times we want to retry
      // they will abort if the test succeeds
      for (var x = 0; x < retries + 1; x++) {
        runs(function() {
          if (typeof this.n === "undefined") {
            this.n = 0;
          }
          else {
            this.n += 1;
          }
          if (this.abort) {
            return;
          }

          if (this.n > 0) {
            it.results_.totalCount = it.results_.passedCount = it.results_.failedCount = 0;
            it.results_.skipped = false;
            it.results_.items_ = [];

            process.stdout.write('R');

            waits(self.current.retry_backoff);
          }

          // Run "it" spec
          self.current.it();

          waitsFor(function(){
            return self.currentRequestFinished;
          }, "HTTP Request timed out before completing", self._timeout);

          // Run Asserts
          runs(function() {
            if (self.currentRequestFinished) {
              var i;
              self.current.expectsFailed = true;

              // if you have no expects, they can't fail
              if (self.current.expects.length == 0) {
                retry = -1;
                this.abort = true;
                self.current.expectsFailed = false;
              }

              // REQUIRES count for EACH loop iteration (i.e. DO NOT OPTIMIZE THIS LOOP)
              // Some 'expects' helpers add more tests when executed (recursive 'expectJSON' and 'expectJSONTypes', with nested JSON syntax etc.)
              for(i=0; i < self.current.expects.length; i++) {
                if(false !== self._exceptionHandler) {
                  try {
                    self.current.expects[i].call(it);
                  } catch(e) {
                    self._exceptionHandler.call(self, e);
                  }
                } else {
                  self.current.expects[i].call(it);
                }
              }

              if (it.results_.failedCount == 0) {
                retry = -1;
                this.abort = true;
                self.current.expectsFailed = false;
              }
            }
            else {
              it.results_.failedCount = 1;
            }
          });
        });
      }

      runs(function() {
        // AFTER callback
        if(self.current.after) {

          if (self.current.expectsFailed && self.current.outgoing.inspectOnFailure) {
            console.log(self.current.itInfo + ' has FAILED with the following response:');
            self.inspectStatus();
            self.inspectJSON();
          };

          // REQUIRES count for EACH loop iteration (i.e. DO NOT OPTIMIZE THIS LOOP)
          // this enables after to add more after to do things (like inspectJSON)
          for(i=0; i < self.current.after.length; i++) {
            var fn = self.current.after[i];
            if(false !== self._exceptionHandler) {
              try {
                fn.call(self);
              } catch(e) {
                self._exceptionHandler(e);
              }
            } else {
              fn.call(self);
            }
          }
        }
      })
    });
  });
};


//
// Add custom Frisby matchers to Jasmine (globally)
//
jasmine.Matchers.prototype.toMatchOrBeNull = function(expected) {
  this.message = function() {
    return "Expected '" + this.actual + "' to match '" + expected + "' or be null";
  }
  return (new RegExp(expected).test(this.actual)) || (this.actual === null);
};
jasmine.Matchers.prototype.toMatchOrBeEmpty = function(expected) {
  this.message = function() {
    return "Expected '" + this.actual + "' to match '" + expected + "' or be empty";
  }
  return (new RegExp(expected).test(this.actual)) || (this.actual === null) || (this.actual === "");
};
jasmine.Matchers.prototype.toBeType = function(expected) {
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
};
jasmine.Matchers.prototype.toBeTypeOrNull = function(expected) {
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
};
jasmine.Matchers.prototype.toBeTypeOrUndefined = function(expected) {
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
  return (this.actual === undefined) || (_toType(this.actual) === eType);
};
jasmine.Matchers.prototype.toContainJson = function(expected, isNot) {
  this.message = function() {
    return "Actual JSON did not match expected";
  }

  // Way of allowing custom failure message - by throwing exceptions in utility function
  try {
    return _jsonContains(this.actual, expected);
  } catch(e) {
    // Fail test if there is a match failure and it is not an inverse test (for non-match)
    if(!this.isNot && !isNot) {
      this.spec.fail(e);
    }
  }
};
jasmine.Matchers.prototype.toContainJsonTypes = function(expected, isNot) {
  this.message = function() {
    return "Actual JSON types did not match expected";
  }

  // Way of allowing custom failure message - by throwing exceptions in utility function
  try {
    return _jsonContainsTypes(this.actual, expected);
  } catch(e) {
    // Fail test if there is a match failure and it is not an inverse test (for non-match)
    if(!this.isNot && !isNot) {
      this.spec.fail(e);
    }
  }
};


//
// Parse body as JSON, ensuring not to re-parse when body is already an object (thanks @dcaylor)
//
function _jsonParse(body) {
  json = "";
  try {
    json = (typeof body === "object") ? body : JSON.parse(body);
  } catch(e) {
    throw new Error("Error parsing JSON string: " + e.message + "\n\tGiven: " + body);
  }
  return json;
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
    if(jsonBody) {
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

      // Do an assertion so assertion count will be consistent
      expect(true).toBeTruthy();
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

      // Do an assertion so assertion count will be consistent
      expect(true).toBeTruthy();
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

exports.withPath = _withPath;

// Public methods and properties
exports.globalSetup = globalSetup;
exports.version = '0.8.5';

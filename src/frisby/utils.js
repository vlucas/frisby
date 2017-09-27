'use strict';

const _ = require('lodash/core');

// Path execution method
function withPath(path, jsonBody, callback) {
  let type = false;

  // Execute immediately with no path
  if (!path) {
    return callback(jsonBody);
  }

  // Use given path to check deep objects
  _.each(path.split('.'), function (segment) {
    let jt = typeof jsonBody;
    // Must be array if special characters are present
    if ("*" === segment || "?" === segment) {
      type = segment;

      if (!_.isArray(jsonBody)) {
        throw new TypeError("Expected '" + path + "' to be Array (got '" + jt + "' from JSON response)");
      }
    } else if ("&" === segment) {
      type = segment;

      if (!_.isObject(jsonBody)) {
        throw new TypeError("Expected '" + path + "' to be Object (got '" + jt + "' from JSON response)");
      }
    } else {
      jsonBody = jsonBody[segment];
    }
  });

  // EACH item in array should match
  if ("*" === type || "&" === type) {
    _.each(jsonBody, function (json) {
      callback(json);
    });

  // ONE item in array should match
  } else if ("?" === type) {
    var itemCount = jsonBody.length;
    var errorCount = 0;
    var errorLast;

    for (var i = 0; i < itemCount; i++) {
      try {
        callback(jsonBody[i]);
      } catch (e) {
        errorCount++;
        errorLast = e;
      }
    }

    // If all errors, test fails
    if (itemCount === errorCount) {
      if (errorLast) {
        throw errorLast;
      } else {
        throw new Error("Expected one object in path '" + path + "' to match provided JSON values");
      }
    }

  // Normal matcher
  } else {
    return callback(jsonBody);
  }
}


module.exports = { withPath };

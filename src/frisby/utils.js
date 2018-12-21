'use strict';

const _ = require('lodash');

// Path execution method
function withPath(path, jsonBody, callback) {
  if (_.isUndefined(jsonBody)) {
    throw new Error('jsonBody is undefined');
  }

  // Execute immediately with no path
  if (!path) {
    return callback(jsonBody);
  }

  let type = false;
  let jsonChunks = [jsonBody];

  // Use given path to check deep objects
  _.each(_.toPath(path), segment => {
    _.each(jsonChunks.splice(0), jsonChunk => {
      if (_.includes(['*', '?', '&'], segment)) {
        // Must be object if special character is present
        if (!_.isObject(jsonChunk)) {
          throw new TypeError(`Expected '${path}' to be Object (got '${typeof jsonChunk}' from JSON response)`);
        }

        type = segment;
        _.each(jsonChunk, value => {
          jsonChunks.push(value);
        });
      } else {
        if (_.has(jsonChunk, segment)) {
          jsonChunks.push(_.get(jsonChunk, segment));
        }
      }
    });

    if (_.isEmpty(jsonChunks)) {
      throw new Error(`Expected '${segment}' not found (path '${path}')`);
    }
  });

  if ('?' === type) {
    // ONE item in object and array should match
    let itemCount = jsonChunks.length;
    let errorCount = 0;
    let errorLast;

    for (let i = 0; i < itemCount; i++) {
      try {
        callback(jsonChunks[i]);
      } catch (e) {
        errorCount++;
        errorLast = e;
      }
    }

    // If all errors, test fails
    if (itemCount === errorCount) {
      throw errorLast || new Error(`Expected one object in path '${path}' to match provided JSON values`);
    }
  } else {
    // EACH item in object and array should match
    // Normal matcher
    _.each(jsonChunks, jsonChunk => {
      callback(jsonChunk);
    });
  }
}

module.exports = { withPath };

/**
 * frisby.js: Main Frisby test package
 * (C) 2011, Vance Lucas
 */
var qs = require('querystring'),
  request = require('request'),
  vows = require('vows'),
  _ = require('underscore'),
  assert = require('assert');

function frisby() {
  var batch = {};
  var batches = [];
}

// Public methods and properties
exports.frisby = frisby;
exports.version = '0.0.1';
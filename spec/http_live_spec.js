var _ = require('lodash');
var frisby = require('../lib/frisby');

describe('Live HTTP tests', function() {

  var numTests = 6;
  for(var i = 0; i < numTests; i++) {
    frisby.create('should delay 1 second only, even for multiple tests [' + i + ']')
      .fetch('http://httpbin.org/delay/1')
      .expect('status', 200)
      .toss();
  }

});


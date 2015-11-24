'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.create = create;

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

var _spec = require('./frisby/spec.js');

var _spec2 = _interopRequireDefault(_spec);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Frisby = (function () {
  function Frisby() {
    _classCallCheck(this, Frisby);
  }

  _createClass(Frisby, null, [{
    key: 'describe',
    value: function describe(groupName) {}
  }, {
    key: 'create',
    value: function create(testName) {
      return new _spec2.default(testName);
    }
  }, {
    key: 'version',
    value: function version() {
      return _package2.default.version;
    }
  }]);

  return Frisby;
})();

function create(testName) {
  return new _spec2.default(testName);
}
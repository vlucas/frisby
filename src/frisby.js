import pkg from '../package.json';
import FrisbySpec from './frisby/spec.js';

class Frisby {
  constructor() {

  }

  static describe(groupName) {

  }

  static create(testName) {
    return new FrisbySpec(testName);
  }

  static version () {
    return pkg.version;
  }
}

export function create(testName) {
  return new FrisbySpec(testName);
}

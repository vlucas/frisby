import pkg from '../package.json';
import FrisbySpec from './frisby/spec.js';


/**
 * Export Frisby version from package.json
 */
export const version = pkg.version;

/**
 * Create a new FrisbySpec test with specified name
 */
export function create(testName) {
  return new FrisbySpec(testName);
}

export function addExpectHandler(expectName, expectFn) {
  return FrisbySpec.addExpectHandler(expectName, expectFn);
}

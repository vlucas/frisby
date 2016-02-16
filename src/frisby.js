import pkg from '../package.json';
import FrisbySpec from './frisby/spec.js';


/**
 * Export Frisby version from package.json
 */
export const version = pkg.version;

/**
 * Create a new FrisbySpec test with specified name
 */
export function createWithAction(action, params) {
  let test = new FrisbySpec();
  return test[action].apply(test, params);
}
export function fetch(...params) {
  return createWithAction('fetch', params);
}
export function post(...params) {
  return createWithAction('post', params);
}

export function addExpectHandler(expectName, expectFn) {
  return FrisbySpec.addExpectHandler(expectName, expectFn);
}

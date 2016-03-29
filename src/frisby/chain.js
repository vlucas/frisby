
let chain = [];

export function addSpec(specName, fn) {
  chain.push([specName, fn]);
}

export function executeChain() {
  for(let i = 0; i < chain.length; i++) {
    let currentSpec = chain[i];

    // Requires Jasmine/Mocha
    it(currentSpec[0], currentSpec[1]);
    console.log('> FrisbyChain -> it()');
  }
}

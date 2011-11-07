# Frisby

A node.js NPM module that makes testing API endpoints easy.


## Installation

Install Frisby from NPM:

    npm install frisby

## Usage

Frisby is built on top of the jasmine BDD spec framework, and uses the excellent [jasmine-node test runner](https://github.com/mhevery/jasmine-node) to run spec tests in a specified target directory.  

### File naming conventions

**Files must end with `spec.js` to run** 

Suggested file naming is to append the filename with `_spec`, like `mytests_spec.js`

### Install jasmine-node

    npm install -g jasmine-node

### Run it from the CLI

    cd your/project
    jasmine-node .
// Main test runner
console.log('Running all tests...\n');

// Import and run all test files
require('./mapDBTypeToGraph.test.js');
require('./identifySchemaRelationships.test.js');
require('./validateDBSchema.test.js');
require('./pruneFields.test.js');

console.log('\n===================');
console.log('Test suite complete');
console.log('===================');

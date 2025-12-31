const assert = require('assert');
const mapDBTypeToGraph = require('../mapDBTypeToGraph');
const { GraphQLInt, GraphQLFloat } = require('graphql');
const { GraphQLDateTime } = require('graphql-scalars');

console.log('Testing mapDBTypeToGraph...\n');

// Test 'int' type
try {
    const result = mapDBTypeToGraph('int');
    assert.strictEqual(result, GraphQLInt, 'int should map to GraphQLInt');
    console.log('✓ Test passed: int maps to GraphQLInt');
} catch (error) {
    console.error('✗ Test failed: int mapping');
    console.error(error.message);
}

// Test 'datetime' type
try {
    const result = mapDBTypeToGraph('datetime');
    assert.strictEqual(result, GraphQLDateTime, 'datetime should map to GraphQLDateTime');
    console.log('✓ Test passed: datetime maps to GraphQLDateTime');
} catch (error) {
    console.error('✗ Test failed: datetime mapping');
    console.error(error.message);
}

// Test 'decimal' type
try {
    const result = mapDBTypeToGraph('decimal');
    assert.strictEqual(result, GraphQLFloat, 'decimal should map to GraphQLFloat');
    console.log('✓ Test passed: decimal maps to GraphQLFloat');
} catch (error) {
    console.error('✗ Test failed: decimal mapping');
    console.error(error.message);
}

console.log('\nAll tests completed!');

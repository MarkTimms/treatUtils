const assert = require('assert');

console.log('Testing pruneFields...\n');

// Mock graphql-fields BEFORE requiring fields.js
// We need to ensure we get a fresh reference or that we mocking the module that fields.js will require.
// Since we are not using a test runner that handles this, we do some cache invalidation magic.

const GRAPHQL_FIELDS_PATH = require.resolve('graphql-fields');
const FIELDS_PATH = require.resolve('../fields');

// Prepare the mock
// Our mock simply returns the 'info' object passed to it, so we can control the output
// by passing a simple object as 'info'
// No code needed here as the mock payload is passed directly to pruneFields in each test.
// Manually injecting a mock into Node's module cache to intercept calls to require('graphql-fields')
require.cache[GRAPHQL_FIELDS_PATH] = {
    id: GRAPHQL_FIELDS_PATH,
    filename: GRAPHQL_FIELDS_PATH,
    loaded: true,
    exports: (info) => info // simply return what we pass as info
};

// Invalidate fields.js cache so it picks up our mocked dependency
delete require.cache[FIELDS_PATH];
const { pruneFields } = require('../fields');

try {
    // Test 1: Basic Selection (Valid and Invalid fields)
    console.log('Test 1: Basic Selection');
    const viewFields = new Set(['name', 'age', 'id']);
    const infoMock = {
        'name': {},
        'invalidField': {},
        'age': {}
    };

    const result1 = pruneFields(infoMock, viewFields, null, null);
    assert.deepStrictEqual(result1.sort(), ['age', 'name'], 'Should only return fields present in viewFields');
    console.log('✓ Passed');


    // Test 2: N1 Relationships (mirroring Sales -> Store)
    // We request 'Store' (graph name), expecting 'storeID' (db field) to be added
    console.log('Test 2: N1 Relationships');

    // Schema has 'storeID'
    const viewFields2 = new Set(['saleID', 'storeID', 'amount']);

    // Relationship definition: fieldName -> { name: GraphName, type: TypeName }
    const n1Relevant = {
        'storeID': { name: 'Store', type: 'Store' }
    };

    // User requests 'amount' and 'Store'
    const infoMock2 = {
        'amount': {},
        'Store': {}
    };

    const result2 = pruneFields(infoMock2, viewFields2, n1Relevant, null);
    assert.ok(result2.includes('amount'), 'Should include requested normal field');
    assert.ok(result2.includes('storeID'), 'Should auto-include storeID because Store was requested');
    console.log('✓ Passed');


    // Test 3: NN Relationships (mirroring Store -> Sales)
    // We request 'Sales' (graph name), expecting 'storeID' (primary key of Store) to be added
    console.log('Test 3: NN Relationships');

    // Schema has 'storeID' (PK due to getIDField logic usually looking for ordinal 1, 
    // but here we might need to mock getIDField if we can't control the ordinal easily 
    // OR we just provide a viewFields map that getIDField likes.
    // fields.js calls: require('./getIDField').getIDField(viewFields)
    // Let's create a proper Map for viewFields to satisfy getIDField

    const viewFields3 = new Map([
        ['storeID', { ordinalPosition: 1 }],
        ['name', { ordinalPosition: 2 }]
    ]);

    // NN Relationship definition: RelatedType -> { DBField : GraphName }
    const nnRelevant = {
        'Sale': {
            'storeID': 'Sales' // In the Store view, we have a join to Sales via storeID (which is the PK here)
        }
    };

    // User requests 'name' and 'Sales'
    const infoMock3 = {
        'name': {},
        'Sales': {}
    };

    const result3 = pruneFields(infoMock3, viewFields3, null, nnRelevant);

    assert.ok(result3.includes('name'), 'Should include requested normal field');
    assert.ok(result3.includes('storeID'), 'Should auto-include PK (storeID) because Sales relationship was requested');
    console.log('✓ Passed');

} catch (error) {
    console.error('✗ Test failed: pruneFields');
    console.error(error);
}

// Cleanup: remove mock so other tests aren't affected if they run after this in the same process
delete require.cache[GRAPHQL_FIELDS_PATH];
delete require.cache[FIELDS_PATH];

const assert = require('assert');
const identifySchemaRelationships = require('../db/identifySchemaRelationships');

console.log('Testing identifySchemaRelationships...\n');

// Mock Data
// 1. apiViewSales (Type: Sale)
//    - saleID (PK)
//    - storeID (FK to Store) -> exact match
//    - createdByUserID (FK to User) -> ending match

// 2. apiViewStores (Type: Store)
//    - storeID (PK)

// 3. apiViewUsers (Type: User)
//    - userID (PK)

const mockDBSchemaViews = new Map([
    ['apiViewSales', new Map([
        ['saleID', { ordinalPosition: 1 }],
        ['storeID', { ordinalPosition: 2 }],
        ['createdByUserID', { ordinalPosition: 3 }]
    ])],
    ['apiViewStores', new Map([
        ['storeID', { ordinalPosition: 1 }]
    ])],
    ['apiViewUsers', new Map([
        ['userID', { ordinalPosition: 1 }]
    ])]
]);

try {
    const relationships = identifySchemaRelationships(mockDBSchemaViews);

    // Test n:1 Relationships
    // Expect Sale to have storeID -> Store
    assert.deepStrictEqual(relationships.n1.Sale.storeID, {
        name: 'Store',
        type: 'Store'
    }, 'Sale should have n:1 relationship with Store via storeID');

    // Expect Sale to have createdByUserID -> User
    assert.deepStrictEqual(relationships.n1.Sale.createdByUserID, {
        name: 'CreatedByUser',
        type: 'User'
    }, 'Sale should have n:1 relationship with User via createdByUserID');

    console.log('✓ Test passed: n:1 relationships identified correctly');

    // Test n:n Relationships
    // Expect Store to have Sale -> Sales (Inverse of storeID)
    assert.strictEqual(relationships.nn.Store.Sale.storeID, 'Sales', 'Store should have n:n relationship with Sale (Sales)');

    // Expect User to have Sale -> SalesCreatedByUser (Inverse of createdByUserID)
    assert.strictEqual(relationships.nn.User.Sale.createdByUserID, 'SalesCreatedByUser', 'User should have n:n relationship with Sale (SalesCreatedByUser)');

    console.log('✓ Test passed: n:n relationships identified correctly');

} catch (error) {
    console.error('✗ Test failed: identifySchemaRelationships');
    console.error(error);
}

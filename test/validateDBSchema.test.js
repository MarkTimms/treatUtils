const assert = require('assert');
const validateSchema = require('../db/validateDBSchema');
const { mandatoryTableFields, reservedFieldNames } = require('../fields');

console.log('Testing validateDBSchema...\n');

try {
    // Helper to create a basic valid table schema
    const createValidTable = () => {
        const fields = new Map();
        // Add all mandatory fields
        mandatoryTableFields.forEach(field => {
            fields.set(field, { dataType: 'nvarchar' });
        });
        // Add a non-mandatory field
        fields.set('someData', { dataType: 'nvarchar' });
        return fields;
    };

    // Test 1: Valid Schema
    console.log('Test 1: Valid Schema');
    const validSchema = {
        tables: new Map([
            ['ValidTable', createValidTable()]
        ])
    };
    try {
        validateSchema(validSchema);
        console.log('✓ Passed');
    } catch (e) {
        assert.fail(`Should not throw error for valid schema: ${e.message}`);
    }

    // Test 2: Missing Mandatory Field
    console.log('Test 2: Missing Mandatory Field');
    const invalidSchema1 = {
        tables: new Map([
            ['InvalidTable1', createValidTable()]
        ])
    };
    const missingField = mandatoryTableFields[0];
    invalidSchema1.tables.get('InvalidTable1').delete(missingField);

    try {
        validateSchema(invalidSchema1);
        assert.fail('Should throw error for missing mandatory field');
    } catch (e) {
        assert.ok(e.message.includes(`missing mandatory field ${missingField}`), 'Error message should mention missing field');
        console.log('✓ Passed');
    }

    // Test 3: Reserved Field Name
    console.log('Test 3: Reserved Field Name');
    const invalidSchema2 = {
        tables: new Map([
            ['InvalidTable2', createValidTable()]
        ])
    };
    const reservedField = reservedFieldNames[0];
    invalidSchema2.tables.get('InvalidTable2').set(reservedField, { dataType: 'nvarchar' });

    try {
        validateSchema(invalidSchema2);
        assert.fail('Should throw error for reserved field name');
    } catch (e) {
        assert.ok(e.message.includes(`contains reserved field name ${reservedField}`), 'Error message should mention reserved field');
        console.log('✓ Passed');
    }

    // Test 4: Varchar Field Type
    console.log('Test 4: Varchar Field Type');
    const invalidSchema3 = {
        tables: new Map([
            ['InvalidTable3', createValidTable()]
        ])
    };
    invalidSchema3.tables.get('InvalidTable3').set('badField', { dataType: 'varchar' });

    try {
        validateSchema(invalidSchema3);
        assert.fail('Should throw error for varchar field');
    } catch (e) {
        assert.ok(e.message.includes('contains varchar field badField'), 'Error message should mention varchar field');
        console.log('✓ Passed');
    }

} catch (error) {
    console.error('✗ Test failed: validateDBSchema');
    console.error(error);
    process.exit(1);
}

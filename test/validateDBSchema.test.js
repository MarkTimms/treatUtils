const assert = require('assert');
const validateSchema = require('../db/validateDBSchema');
const { mandatoryFields, reservedFieldNames } = require('../fields');

console.log('Testing validateDBSchema...\n');

try {
    // Helper to create a basic valid table schema
    const createValidTable = () => {
        const fields = new Map();
        // Add all mandatory fields
        mandatoryFields.forEach(([fieldName, dataType, isNullable]) => {
            fields.set(fieldName, { dataType, isNullable });
        });
        // Add a non-mandatory field
        fields.set('someData', { dataType: 'nvarchar', isNullable: true });
        return fields;
    };

    // Test 1: Valid Schema
    console.log('Test 1: Valid Schema');
    const validSchema = {
        tables: new Map([
            ['ValidTable', createValidTable()]
        ]),
        views: new Map([
            ['ValidView', createValidTable()]
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
        ]),
        views: new Map()
    };
    const missingFieldName = mandatoryFields[0][0]; // Get name from first definition
    invalidSchema1.tables.get('InvalidTable1').delete(missingFieldName);

    try {
        validateSchema(invalidSchema1);
        assert.fail('Should throw error for missing mandatory field');
    } catch (e) {
        assert.ok(e.message.includes(`missing mandatory field ${missingFieldName}`), 'Error message should mention missing field');
        console.log('✓ Passed');
    }

    // Test 3: Reserved Field Name
    console.log('Test 3: Reserved Field Name');
    const invalidSchema2 = {
        tables: new Map([
            ['InvalidTable2', createValidTable()]
        ]),
        views: new Map()
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
        ]),
        views: new Map()
    };
    invalidSchema3.tables.get('InvalidTable3').set('badField', { dataType: 'varchar' });

    try {
        validateSchema(invalidSchema3);
        assert.fail('Should throw error for varchar field');
    } catch (e) {
        assert.ok(e.message.includes('contains varchar field badField'), 'Error message should mention varchar field');
        console.log('✓ Passed');
    }

    // Test 5: Incorrect Data Type
    console.log('Test 5: Incorrect Data Type');
    const invalidSchema4 = {
        tables: new Map([
            ['InvalidTable4', createValidTable()]
        ]),
        views: new Map()
    };
    // Pick a field and change its type. mandatoryFields[0] is ['createdByUserID', 'int', false]
    const [targetField, originalType] = mandatoryFields[0];
    const wrongType = originalType === 'int' ? 'nvarchar' : 'int';

    const fieldDef = invalidSchema4.tables.get('InvalidTable4').get(targetField);
    fieldDef.dataType = wrongType;

    try {
        validateSchema(invalidSchema4);
        assert.fail(`Should throw error for incorrect data type on ${targetField}`);
    } catch (e) {
        assert.ok(e.message.includes(`has field ${targetField} of type ${wrongType}, expected ${originalType}`),
            `Error message should mention type mismatch. Got: ${e.message}`);
        console.log('✓ Passed');
    }

    // Test 6: Invalid View (Missing Field)
    console.log('Test 6: Invalid View (Missing Field)');
    const invalidSchemaView = {
        tables: new Map(),
        views: new Map([
            ['InvalidView1', createValidTable()]
        ])
    };
    const missingViewField = mandatoryFields[0][0];
    invalidSchemaView.views.get('InvalidView1').delete(missingViewField);

    try {
        validateSchema(invalidSchemaView);
        assert.fail('Should throw error for missing mandatory field in View');
    } catch (e) {
        assert.ok(e.message.includes(`missing mandatory field ${missingViewField}`), 'Error message should mention missing field in view');
        console.log('✓ Passed');
    }


} catch (error) {
    console.error('✗ Test failed: validateDBSchema');
    console.error(error);
    process.exit(1);
}

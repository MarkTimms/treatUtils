function validateSchema(dbSchema) {
    //check that every table has the mandatory fields
    validateMandatoryFields(dbSchema);
    validateReservedFieldNames(dbSchema);
    validateVarcharTypes(dbSchema);
}

/**
 * Validate that every table has the mandatory fields, they are the right type, and are nullable or not as specified
 * @param {*} dbSchema 
 */
function validateMandatoryFields(dbSchema) {
    const mandatoryFields = require('../fields').mandatoryFields;

    function validate(tables) {
        tables.forEach((tableFields, tableName) => {
            mandatoryFields.forEach(([fieldName, dataType, isNullable]) => {
                if (!tableFields.has(fieldName)) {
                    throw new Error(`Table ${tableName} is missing mandatory field ${fieldName}`);
                }
                const field = tableFields.get(fieldName);
                if (field.dataType !== dataType) {
                    throw new Error(`Table ${tableName} has field ${fieldName} of type ${field.dataType}, expected ${dataType}`);
                }
                if (field.isNullable !== isNullable) {
                    throw new Error(`Table ${tableName} has field ${fieldName} of nullable ${field.isNullable}, expected ${isNullable}`);
                }
            })
        })
    }
    //validate tables and views both contain the mandatory fields
    validate(dbSchema.tables);
    validate(dbSchema.views);
}

//check no fields are named sort or pagination etc
function validateReservedFieldNames(dbSchema) {
    const reservedFieldNames = require('../fields').reservedFieldNames;

    function validate(tables) {
        tables.forEach((tableFields, tableName) => {
            reservedFieldNames.forEach((reservedFieldName) => {
                if (tableFields.has(reservedFieldName)) {
                    throw new Error(`Table ${tableName} contains reserved field name ${reservedFieldName}`);
                }
            })
        })
    }
    //validate tables and views both contain the reserved field names
    validate(dbSchema.tables);
    validate(dbSchema.views);
}

//check all varchar fields are actually nvarchar
function validateVarcharTypes(dbSchema) {
    dbSchema.tables.forEach((tableFields, tableName) => {
        tableFields.forEach((field, fieldName) => {
            if (field.dataType === 'varchar') {
                throw new Error(`Table ${tableName} contains varchar field ${fieldName}.  Please update to nvarchar`);
            }
        })
    })
}

module.exports = validateSchema;
